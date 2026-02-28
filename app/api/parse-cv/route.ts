import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildCVParsingPrompt } from '@/lib/prompts';
import { MOCK_PROFILE } from '@/lib/mockData';
import type { UserProfile } from '@/lib/types';

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err);
    throw new Error('Failed to parse PDF. Try manual input or LinkedIn paste instead.');
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
      const body = await request.json();
      const text = body.text as string;
      const type = body.type as string;

      if (!text || !type) {
        return NextResponse.json({ success: false, error: 'Missing text or type' }, { status: 400 });
      }

      rawText = text.replace(/\s+/g, ' ').trim();
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ success: false, error: 'Text too short to parse' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json({
        success: true,
        profile: { ...MOCK_PROFILE, ...parseBasicProfile(rawText) },
      });
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
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content) as Record<string, unknown>;
      const profile = mapToUserProfile(parsed);

      return NextResponse.json({ success: true, profile });
    } catch (apiErr) {
      // API failed (401, rate limit, etc.) — fall back to basic extraction so user can continue
      console.warn('AI parse failed, using fallback:', apiErr);
      const profile = { ...MOCK_PROFILE, ...parseBasicProfile(rawText) };
      return NextResponse.json({
        success: true,
        profile,
        fallback: true,
        message: 'API key invalid or unavailable. We extracted basic info — you can edit it on the next step.',
      });
    }
  } catch (err) {
    console.error('parse-cv error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to parse CV' },
      { status: 500 }
    );
  }
}

function parseBasicProfile(text: string): Partial<UserProfile> {
  const t = text.toLowerCase();
  const industries = ['finance', 'accounting', 'legal', 'technology', 'marketing', 'healthcare', 'education', 'government'];
  const industry = industries.find((i) => t.includes(i)) || 'Other';
  const roleMatch = text.match(/(?:title|position|role|job)[:\s]+([^\n,]+)/i) || text.match(/([A-Z][a-z]+ (?:Manager|Engineer|Analyst|Director|Accountant|Consultant))/);
  const currentRole = roleMatch ? roleMatch[1].trim() : 'Professional';
  return {
    currentRole,
    industry: industry.charAt(0).toUpperCase() + industry.slice(1),
    seniorityLevel: 'mid',
    yearsExperience: 3,
    location: 'Hong Kong',
    hardSkills: [],
    softSkills: [],
    tools: [],
    certifications: [],
    languages: ['English'],
    education: [],
    primaryGoal: 'unsure',
    weeklyHoursAvailable: 5,
    preferredFormats: ['video', 'audio'],
  };
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
