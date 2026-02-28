import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildSkillDiagnosisPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/parseJsonResponse';
import type { UserProfile, SkillGapMap } from '@/lib/types';

function getApiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('401') || msg.includes('User not found') || msg.includes('Invalid')) {
    return 'Your API key is invalid or expired. Check POE_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY in .env.local and restart the server.';
  }
  if (msg.includes('402') || msg.includes('credits')) {
    return 'Insufficient API credits. Add credits or use a different key.';
  }
  if (msg.includes('429')) {
    return 'Too many requests. Please try again in a few minutes.';
  }
  if (msg.includes('Unexpected token') || msg.includes('JSON')) {
    return 'The API returned an unexpected response. Check your API key and try again.';
  }
  return msg || 'Skill gap analysis failed. Please try again.';
}

export async function POST(request: NextRequest) {
  try {
    const { profile } = (await request.json()) as { profile: UserProfile };

    if (!profile || !profile.currentRole || !profile.industry) {
      return NextResponse.json({ success: false, error: 'Invalid profile' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Add POE_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY to .env.local and restart the server.' },
        { status: 503 }
      );
    }

    const prompt = buildSkillDiagnosisPrompt(profile);
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      ...(IS_POE ? { extra_body: { web_search: true } } : { response_format: { type: 'json_object' } }),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('No response from AI');
    const trimmed = content.trim();
    if (trimmed.toLowerCase().includes('bad request') || (trimmed.length < 100 && trimmed.toLowerCase().includes('error'))) {
      throw new Error('API returned an error. Check your API key.');
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = trimmed.startsWith('{') ? (JSON.parse(content) as Record<string, unknown>) : extractJson<Record<string, unknown>>(content);
    } catch {
      throw new Error('Invalid API response. Please try again.');
    }
    const diagnosis = mapToSkillGapMap(parsed, profile);

    return NextResponse.json({ success: true, diagnosis });
  } catch (err) {
    console.error('diagnose error:', err);
    const message = getApiErrorMessage(err);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

function mapToSkillGapMap(parsed: Record<string, unknown>, profile: UserProfile): SkillGapMap {
  const skills = Array.isArray(parsed.skills)
    ? parsed.skills.map((s: Record<string, unknown>) => ({
        skillName: String(s.skillName || ''),
        category: ['technical', 'soft', 'tool', 'certification', 'domain'].includes(String(s.category))
          ? (s.category as SkillGapMap['skills'][0]['category'])
          : 'technical',
        userLevel: typeof s.userLevel === 'number' ? s.userLevel : 50,
        marketDemand: typeof s.marketDemand === 'number' ? s.marketDemand : 50,
        demandTrend: ['rising', 'stable', 'declining'].includes(String(s.demandTrend))
          ? (s.demandTrend as SkillGapMap['skills'][0]['demandTrend'])
          : 'stable',
        status: ['strong', 'fading', 'missing'].includes(String(s.status))
          ? (s.status as SkillGapMap['skills'][0]['status'])
          : 'missing',
        priority: ['critical', 'important', 'nice_to_have'].includes(String(s.priority))
          ? (s.priority as SkillGapMap['skills'][0]['priority'])
          : 'nice_to_have',
        reasoning: String(s.reasoning || ''),
        timeToAcquire: typeof s.timeToAcquire === 'string' ? s.timeToAcquire : undefined,
      }))
    : [];

  const strongCount = skills.filter((s) => s.status === 'strong').length;
  const fadingCount = skills.filter((s) => s.status === 'fading').length;
  const missingCount = skills.filter((s) => s.status === 'missing').length;

  return {
    userId: typeof parsed.userId === 'string' ? parsed.userId : 'gen-' + Date.now(),
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : new Date().toISOString(),
    industry: typeof parsed.industry === 'string' ? parsed.industry : profile.industry,
    role: typeof parsed.role === 'string' ? parsed.role : profile.currentRole,
    overallReadiness: typeof parsed.overallReadiness === 'number' ? parsed.overallReadiness : 50,
    skills,
    strongCount,
    fadingCount,
    missingCount,
    topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities.map(String) : [],
    industryInsights: Array.isArray(parsed.industryInsights) ? parsed.industryInsights.map(String) : [],
    peerComparison: typeof parsed.peerComparison === 'string' ? parsed.peerComparison : '',
  };
}
