import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildCVParsingPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/parseJsonResponse';
import type { UserProfile } from '@/lib/types';

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err);
    throw new Error('Failed to parse PDF. Try manual input instead.');
  }
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
        rawText = await extractTextFromPDF(buffer);
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

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Add POE_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY to .env.local and restart. Or use "Tell us manually" to skip CV upload.' },
        { status: 503 }
      );
    }

    try {
      const prompt = buildCVParsingPrompt(rawText);
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        ...(IS_POE ? {} : { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0]?.message?.content;
      if (!content || typeof content !== 'string') throw new Error('No response from AI');

      const trimmed = content.trim();
      if (trimmed.toLowerCase().includes('bad request') || trimmed.toLowerCase().startsWith('error')) {
        throw new Error('API returned an error. Check your API key and try again.');
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = trimmed.startsWith('{') ? (JSON.parse(content) as Record<string, unknown>) : extractJson<Record<string, unknown>>(content);
      } catch {
        throw new Error('Could not read structured response from API. Try again or use "Tell us manually".');
      }
      const profile = mapToUserProfile(parsed);

      return NextResponse.json({ success: true, profile });
    } catch (apiErr) {
      console.warn('AI parse failed:', apiErr);
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      let userMsg: string;
      if (msg.includes('401') || msg.includes('User not found') || msg.includes('Invalid')) {
        userMsg = 'Your API key is invalid or expired. Add a valid key to .env.local, or use "Tell us manually" to skip CV upload.';
      } else if (msg.includes('Unexpected token') || msg.includes('JSON')) {
        userMsg = 'The API returned an unexpected response. Check your API key and try again, or use "Tell us manually".';
      } else {
        userMsg = `CV parsing failed: ${msg}. Try "Tell us manually".`;
      }
      return NextResponse.json({ success: false, error: userMsg }, { status: 502 });
    }
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
