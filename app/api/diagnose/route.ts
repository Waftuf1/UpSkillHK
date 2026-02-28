import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildSkillDiagnosisPrompt } from '@/lib/prompts';
import { MOCK_SKILL_GAP_MAP } from '@/lib/mockData';
import type { UserProfile, SkillGapMap } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { profile } = (await request.json()) as { profile: UserProfile };

    if (!profile || !profile.currentRole || !profile.industry) {
      return NextResponse.json({ success: false, error: 'Invalid profile' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      const mock = { ...MOCK_SKILL_GAP_MAP };
      mock.role = profile.currentRole;
      mock.industry = profile.industry;
      return NextResponse.json({ success: true, diagnosis: mock });
    }

    try {
      const prompt = buildSkillDiagnosisPrompt(profile);
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        ...(IS_POE ? { extra_body: { web_search: true } } : { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content) as Record<string, unknown>;
      const diagnosis = mapToSkillGapMap(parsed, profile);

      return NextResponse.json({ success: true, diagnosis });
    } catch (apiErr) {
      // API failed (401, etc.) — use mock so user can continue
      console.warn('Diagnose API failed, using mock:', apiErr);
      const mock = { ...MOCK_SKILL_GAP_MAP };
      mock.role = profile.currentRole;
      mock.industry = profile.industry;
      return NextResponse.json({ success: true, diagnosis: mock });
    }
  } catch (err) {
    console.error('diagnose error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Diagnosis failed' },
      { status: 500 }
    );
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
