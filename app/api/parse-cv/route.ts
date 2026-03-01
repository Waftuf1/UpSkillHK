import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, getBedrockClient, BEDROCK_MODEL } from '@/lib/openai';
import { buildCVParsingPrompt, CV_PARSING_FROM_PDF_PROMPT } from '@/lib/prompts';
import { parseJsonRobust } from '@/lib/parseJsonResponse';
import type { UserProfile } from '@/lib/types';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash';

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text?.trim() || '';
  } catch (err) {
    try {
      const pdfParse = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (fallbackErr) {
      console.error('PDF parse error:', err, fallbackErr);
      throw new Error('This PDF could not be read (e.g. scanned/image-based). Try a text-based PDF or use "Tell us manually".');
    }
  }
}

/** Use Gemini's native API to read PDF directly (including scanned/image-based). */
async function parsePDFWithGemini(buffer: Buffer): Promise<Record<string, unknown>> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key required for PDF vision extraction');

  const base64 = buffer.toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: CV_PARSING_FROM_PDF_PROMPT }, { inlineData: { mimeType: 'application/pdf', data: base64 } }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') throw new Error('No response from Gemini');

  let parsed: Record<string, unknown>;
  try {
    parsed = parseJsonRobust<Record<string, unknown>>(text);
  } catch {
    throw new Error('Could not parse Gemini response as JSON');
  }
  return parsed;
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX parse error:', err);
    throw new Error('Failed to parse DOCX');
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let rawText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        try {
          rawText = await extractTextFromPDF(buffer);
        } catch (pdfErr) {
          // Fallback: use Gemini vision to read PDF directly (handles scanned/image-based PDFs)
          if (GEMINI_API_KEY) {
            try {
              const parsed = await parsePDFWithGemini(buffer);
              if (parsed.isValidCV === false) {
                const reason = typeof parsed.rejectionReason === 'string' ? parsed.rejectionReason : null;
                return NextResponse.json({
                  success: false,
                  error: reason || 'This doesn\'t appear to be a CV. Please upload a resume or CV that contains your work experience, skills, and education.',
                }, { status: 400 });
              }
              const profile = mapToUserProfile(parsed);
              return NextResponse.json({ success: true, profile });
            } catch (geminiErr) {
              console.warn('Gemini PDF fallback failed:', geminiErr);
            }
          }
          throw pdfErr;
        }
      } else if (ext === 'docx') {
        rawText = await extractTextFromDOCX(buffer);
      } else {
        return NextResponse.json({ success: false, error: 'Only PDF and DOCX are supported' }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Please upload a CV (PDF or DOCX) or use "Tell us manually".' },
        { status: 400 }
      );
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Text extracted from file is too short to parse. Try a different file or use "Tell us manually".' },
        { status: 400 }
      );
    }

    // Truncate very long CVs to avoid token limits (e.g. MiniMax context limits)
    const MAX_CV_CHARS = 10000;
    if (rawText.length > MAX_CV_CHARS) {
      rawText = rawText.slice(0, MAX_CV_CHARS) + '\n\n[... truncated for length ...]';
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Add GOOGLE_GEMINI_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, MINIMAX_API_KEY, or AWS_BEDROCK_API_KEY to .env.local and restart. Or use "Tell us manually" to skip CV upload.' },
        { status: 503 }
      );
    }

    const maxRetries = 4;
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = buildCVParsingPrompt(rawText);
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          response_format: { type: 'json_object' },
        });

      const content = completion.choices[0]?.message?.content;
      if (!content || typeof content !== 'string') throw new Error('No response from AI');

      const trimmed = content.trim();
      if (trimmed.toLowerCase().includes('bad request') || trimmed.toLowerCase().startsWith('error')) {
        throw new Error('API returned an error. Check your API key and try again.');
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = parseJsonRobust<Record<string, unknown>>(content);
      } catch {
        throw new Error('Could not read structured response from API. Try again or use "Tell us manually".');
      }

      if (parsed.isValidCV === false) {
        const reason = typeof parsed.rejectionReason === 'string' ? parsed.rejectionReason : null;
        return NextResponse.json({
          success: false,
          error: reason || 'This doesn\'t appear to be a CV. Please upload a resume or CV that contains your work experience, skills, and education.',
        }, { status: 400 });
      }

      const profile = mapToUserProfile(parsed);

      return NextResponse.json({ success: true, profile });
      } catch (apiErr) {
        lastErr = apiErr;
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        const isRetryable = msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('UND_ERR_CONNECT_TIMEOUT') || msg.includes('network') || msg.includes('timeout');
        if (attempt < maxRetries && isRetryable) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        break;
      }
    }

    // MiniMax failed after retries — try Bedrock as fallback if configured
    const bedrockClient = getBedrockClient();
    if (bedrockClient) {
      console.warn('Trying Bedrock fallback for CV parse');
      try {
        const prompt = buildCVParsingPrompt(rawText);
        const completion = await bedrockClient.chat.completions.create({
          model: BEDROCK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          response_format: { type: 'json_object' },
        });
        const content = completion.choices[0]?.message?.content;
        if (content && typeof content === 'string') {
          const trimmed = content.trim();
          if (!trimmed.toLowerCase().includes('bad request') && !trimmed.toLowerCase().startsWith('error')) {
            let parsed: Record<string, unknown>;
            try {
              parsed = parseJsonRobust<Record<string, unknown>>(content);
              if (parsed.isValidCV !== false) {
                const profile = mapToUserProfile(parsed);
                return NextResponse.json({ success: true, profile });
              }
            } catch {
              // fall through to error
            }
          }
        }
      } catch (bedrockErr) {
        console.warn('Bedrock fallback also failed:', bedrockErr);
      }
    }

    const apiErr = lastErr;
    console.warn('AI parse failed:', apiErr);
    const msg = apiErr instanceof Error ? (apiErr as Error).message : String(apiErr);
    let userMsg: string;
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('UND_ERR_CONNECT_TIMEOUT') || msg.includes('network')) {
      userMsg = 'Connection to the AI service timed out. This can happen on slow networks. Try again, or use "Tell us manually" to continue.';
    } else if (msg.includes('401') || msg.includes('User not found') || msg.includes('Invalid')) {
      userMsg = 'Your API key is invalid or expired. Add a valid key to .env.local, or use "Tell us manually" to skip CV upload.';
    } else if (msg.includes('Unexpected token') || msg.includes('JSON')) {
      userMsg = 'The API returned an unexpected response. Check your API key and try again, or use "Tell us manually".';
    } else {
      userMsg = `CV parsing failed: ${msg}. Try "Tell us manually".`;
    }
    return NextResponse.json({ success: false, error: userMsg }, { status: 502 });
  } catch (err) {
    console.error('parse-cv error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to parse CV' },
      { status: 500 }
    );
  }
}

function mapToUserProfile(parsed: Record<string, unknown>): UserProfile {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

  return {
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    currentRole: typeof parsed.currentRole === 'string' ? parsed.currentRole : 'Professional',
    industry: typeof parsed.industry === 'string' ? parsed.industry : 'Other',
    subSector: typeof parsed.subSector === 'string' ? parsed.subSector : undefined,
    seniorityLevel: ['junior', 'mid', 'senior', 'lead', 'executive'].includes(String(parsed.seniorityLevel))
      ? (parsed.seniorityLevel as UserProfile['seniorityLevel'])
      : 'mid',
    yearsExperience: typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : 3,
    location: 'Hong Kong',
    hardSkills: arr(parsed.hardSkills),
    softSkills: arr(parsed.softSkills),
    tools: arr(parsed.tools),
    certifications: arr(parsed.certifications),
    languages: arr(parsed.languages),
    education: arr(parsed.education),
    primaryGoal: 'unsure',
    weeklyHoursAvailable: 5,
    preferredFormats: ['video', 'audio'],
  };
}
