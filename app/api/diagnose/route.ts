import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildSkillDiagnosisPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/parseJsonResponse';
import type { UserProfile, SkillGapMap } from '@/lib/types';

function getApiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('401') || msg.includes('User not found') || msg.includes('Invalid key') || msg.includes('invalid_api_key')) {
    return 'Your API key is invalid or expired. Check POE_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY in .env.local and restart the server.';
  }
  if (msg.includes('402') || msg.includes('credits')) {
    return 'Insufficient API credits. Add credits or use a different key.';
  }
  if (msg.includes('429')) {
    return 'Too many requests. Please try again in a few minutes.';
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
    // With Poe: web_search lets the model use real HK job/regulatory data for marketDemand and trends
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      ...(IS_POE ? { extra_body: { web_search: true } } : { response_format: { type: 'json_object' } }),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('No response from AI');
    // Strip markdown code fences (```json ... ```) that Poe often wraps around JSON
    const stripped = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (stripped.toLowerCase().includes('bad request') || (stripped.length < 100 && stripped.toLowerCase().includes('error'))) {
      throw new Error('API returned an error. Check your API key.');
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(stripped) as Record<string, unknown>;
    } catch {
      try {
        parsed = extractJson<Record<string, unknown>>(stripped);
      } catch {
        console.error('Failed to parse AI response:', stripped.slice(0, 500));
        throw new Error('Could not parse the AI response as JSON. Please try again.');
      }
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
    ? parsed.skills.map((s: Record<string, unknown>) => {
        const userLevel = typeof s.userLevel === 'number' ? s.userLevel : 50;
        const marketDemand = typeof s.marketDemand === 'number' ? s.marketDemand : 50;
        const demandTrend: 'rising' | 'stable' | 'declining' =
          ['rising', 'stable', 'declining'].includes(String(s.demandTrend))
            ? (s.demandTrend as 'rising' | 'stable' | 'declining')
            : 'stable';

        // Enforce status from the data:
        // missing = not on CV (low userLevel) but market wants it
        // fading  = on CV (decent userLevel) but market declining or low demand
        // strong  = on CV (decent userLevel) and market wants it
        let status: 'missing' | 'fading' | 'strong';
        if (userLevel <= 20 && marketDemand >= 40) {
          status = 'missing';
        } else if (userLevel > 20 && (marketDemand < 40 || demandTrend === 'declining')) {
          status = 'fading';
        } else if (userLevel > 20 && marketDemand >= 40) {
          status = 'strong';
        } else if (['strong', 'fading', 'missing'].includes(String(s.status))) {
          status = s.status as 'missing' | 'fading' | 'strong';
        } else {
          status = 'missing';
        }

        let priority: 'critical' | 'important' | 'nice_to_have';
        if (status === 'missing' && marketDemand >= 60) priority = 'critical';
        else if (status === 'missing' || status === 'fading') priority = 'important';
        else priority = 'nice_to_have';

        return {
          skillName: String(s.skillName || s.name || s.skill || 'Unknown Skill'),
          category: ['technical', 'soft', 'tool', 'certification', 'domain'].includes(String(s.category))
            ? (s.category as SkillGapMap['skills'][0]['category'])
            : 'technical',
          userLevel,
          marketDemand,
          demandTrend,
          status,
          priority,
          reasoning: String(s.reasoning || ''),
          timeToAcquire: typeof s.timeToAcquire === 'string' ? s.timeToAcquire : undefined,
        };
      })
    : [];

  const total = skills.length || 1;
  const strongSkills = skills.filter((s) => s.status === 'strong');
  const fadingSkills = skills.filter((s) => s.status === 'fading');
  const missingSkills = skills.filter((s) => s.status === 'missing');
  const strongCount = strongSkills.length;
  const fadingCount = fadingSkills.length;
  const missingCount = missingSkills.length;
  const criticalMissing = missingSkills.filter((s) => s.priority === 'critical').length;

  // --- Structured rubric (100 points total) ---
  // 1. Skill Coverage (30pts): what % of assessed skills are strong
  const skillCoverage = Math.round((strongCount / total) * 30);

  // 2. Critical Gaps (25pts): start at 25, lose points for each critical missing skill
  const criticalGaps = Math.round(Math.max(0, 25 - (criticalMissing / total) * 50));

  // 3. Proficiency Depth (20pts): for strong skills, how close is userLevel to marketDemand
  const proficiencyDepth = strongCount > 0
    ? Math.round(
        (strongSkills.reduce((sum, s) => sum + Math.min(1, s.userLevel / Math.max(1, s.marketDemand)), 0) / strongCount) * 20
      )
    : 0;

  // 4. Trend Alignment (15pts): % of strong skills that have rising demand
  const risingStrong = strongSkills.filter((s) => s.demandTrend === 'rising').length;
  const trendAlignment = strongCount > 0
    ? Math.round((risingStrong / strongCount) * 15)
    : 0;

  // 5. Fading Risk (10pts): start at 10, lose points for fading skills
  const fadingRisk = Math.round(Math.max(0, 10 - (fadingCount / total) * 20));

  const rubric = { skillCoverage, criticalGaps, proficiencyDepth, trendAlignment, fadingRisk };
  const overallReadiness = Math.min(100, Math.max(0,
    skillCoverage + criticalGaps + proficiencyDepth + trendAlignment + fadingRisk
  ));

  return {
    userId: typeof parsed.userId === 'string' ? parsed.userId : 'gen-' + Date.now(),
    generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : new Date().toISOString(),
    industry: typeof parsed.industry === 'string' ? parsed.industry : profile.industry,
    role: typeof parsed.role === 'string' ? parsed.role : profile.currentRole,
    overallReadiness,
    rubric,
    skills,
    strongCount,
    fadingCount,
    missingCount,
    topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities.map(String) : [],
    industryInsights: Array.isArray(parsed.industryInsights) ? parsed.industryInsights.map(String) : [],
    peerComparison: typeof parsed.peerComparison === 'string' ? parsed.peerComparison : '',
    futureForecast: Array.isArray(parsed.futureForecast) ? parsed.futureForecast.map(String) : undefined,
    futureForecastDetail: Array.isArray(parsed.futureForecastDetail)
      ? parsed.futureForecastDetail.map((d: Record<string, unknown>) => ({
          title: String(d.title ?? ''),
          explanation: typeof d.explanation === 'string' ? d.explanation : undefined,
          dataUsed: typeof d.dataUsed === 'string' ? d.dataUsed : undefined,
          links: Array.isArray(d.links) ? d.links.map(String).filter(Boolean) : undefined,
        }))
      : undefined,
  };
}
