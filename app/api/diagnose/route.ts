import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, getBedrockClient, BEDROCK_MODEL } from '@/lib/openai';
import { buildSkillDiagnosisPrompt } from '@/lib/prompts';
import { parseJsonRobust } from '@/lib/parseJsonResponse';
import type { UserProfile, SkillGapMap, SkillAssessment } from '@/lib/types';

/** Build a fallback diagnosis when AI response cannot be parsed. */
function buildFallbackDiagnosis(profile: UserProfile): SkillGapMap {
  const skills: SkillAssessment[] = [];
  const fromProfile = [
    ...(profile.hardSkills || []),
    ...(profile.softSkills || []),
    ...(profile.tools || []),
    ...(profile.certifications || []),
  ].filter(Boolean).slice(0, 8);
  for (const s of fromProfile) {
    skills.push({
      skillName: s,
      category: 'technical',
      userLevel: 60,
      marketDemand: 65,
      demandTrend: 'stable',
      status: 'strong',
      priority: 'nice_to_have',
      reasoning: 'From your profile.',
    });
  }
  const commonGaps = ['Data Analytics', 'Excel', 'Communication', 'Project Management'].filter(
    (g) => !fromProfile.some((f) => f.toLowerCase().includes(g.toLowerCase()))
  );
  for (const g of commonGaps.slice(0, 5)) {
    skills.push({
      skillName: g,
      category: 'technical',
      userLevel: 30,
      marketDemand: 70,
      demandTrend: 'rising',
      status: 'missing',
      priority: 'important',
      reasoning: 'Common HK market requirement.',
      timeToAcquire: '2-3 months',
    });
  }
  const strongCount = skills.filter((s) => s.status === 'strong').length;
  const missingCount = skills.filter((s) => s.status === 'missing').length;
  const fadingCount = skills.filter((s) => s.status === 'fading').length;
  const total = skills.length || 1;
  return {
    userId: 'gen-' + Date.now(),
    generatedAt: new Date().toISOString(),
    industry: profile.industry || 'Other',
    role: profile.currentRole || 'Professional',
    overallReadiness: Math.min(100, Math.round((strongCount / total) * 100)),
    rubric: {
      skillCoverage: Math.round((strongCount / total) * 30),
      criticalGaps: Math.max(0, 25 - Math.round((missingCount / total) * 50)),
      proficiencyDepth: 15,
      trendAlignment: 10,
      fadingRisk: 5,
    },
    skills,
    strongCount,
    fadingCount,
    missingCount,
    topPriorities: commonGaps.slice(0, 3),
    industryInsights: ['Complete a full analysis to get personalised insights.'],
    peerComparison: 'Based on your profile.',
    futureForecast: ['Data & AI literacy', 'Digital transformation skills', 'Cross-border (GBA) awareness', 'ESG & sustainability'],
  };
}

function getApiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('401') || msg.includes('User not found') || msg.includes('Invalid key') || msg.includes('invalid_api_key')) {
    return 'Your API key is invalid or expired. Check GOOGLE_GEMINI_API_KEY, OPENROUTER_API_KEY, MINIMAX_API_KEY, AWS_BEDROCK_API_KEY, or OPENAI_API_KEY in .env.local and restart the server.';
  }
  if (msg.includes('402') || msg.includes('credits')) {
    return 'Insufficient API credits. Add credits or use a different key.';
  }
  if (msg.includes('429')) {
    return 'Too many requests. Please try again in a few minutes.';
  }
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('network')) {
    return 'Could not reach the AI service (network error). Please try again — we\'ll retry with Bedrock if configured.';
  }
  return msg || 'Skill gap analysis failed. Please try again.';
}

export async function POST(request: NextRequest) {
  try {
    let body: { profile?: UserProfile };
    try {
      body = (await request.json()) as { profile: UserProfile };
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
    const { profile } = body;

    if (!profile || !profile.currentRole || !profile.industry) {
      return NextResponse.json({ success: false, error: 'Invalid profile' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Add GOOGLE_GEMINI_API_KEY, OPENROUTER_API_KEY, MINIMAX_API_KEY, AWS_BEDROCK_API_KEY, or OPENAI_API_KEY to .env.local and restart the server.' },
        { status: 503 }
      );
    }

    const prompt = buildSkillDiagnosisPrompt(profile as UserProfile);
    const maxRetries = 3;
    let lastErr: unknown = null;
    let content: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          response_format: { type: 'json_object' },
        });
        content = completion.choices[0]?.message?.content ?? null;
        if (content && typeof content === 'string') break;
      } catch (apiErr) {
        lastErr = apiErr;
        const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
        const isRetryable = msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('UND_ERR_CONNECT_TIMEOUT') || msg.includes('network') || msg.includes('timeout');
        if (attempt < maxRetries && isRetryable) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        break;
      }
    }

    // Try Bedrock fallback if primary failed
    const bedrockClient = getBedrockClient();
    if (!content && bedrockClient) {
      try {
          const completion = await bedrockClient.chat.completions.create({
            model: BEDROCK_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' },
          });
          content = completion.choices[0]?.message?.content ?? null;
      } catch (bedrockErr) {
        console.warn('Bedrock fallback failed:', bedrockErr);
      }
    }

    if (!content || typeof content !== 'string') {
      throw lastErr ?? new Error('No response from AI');
    }
    const stripped = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (stripped.toLowerCase().includes('bad request') || (stripped.length < 100 && stripped.toLowerCase().includes('error'))) {
      throw new Error('API returned an error. Check your API key.');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJsonRobust<Record<string, unknown>>(content);
    } catch (parseErr) {
      console.warn('AI JSON parse failed, using fallback diagnosis:', parseErr);
      const diagnosis = buildFallbackDiagnosis(profile as UserProfile);
      return NextResponse.json({ success: true, diagnosis });
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

        const skillName = String(s.skillName || s.name || s.skill || 'Unknown Skill');

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
          skillName: skillName,
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
  const criticalMissingSkills = missingSkills.filter((s) => s.priority === 'critical');
  const strongCount = strongSkills.length;
  const fadingCount = fadingSkills.length;
  const missingCount = missingSkills.length;
  const criticalMissing = criticalMissingSkills.length;

  // --- Rubric: compare to peers in field over 5yr. Gaps hurt; few strong can't rescue many missing ---

  // 1. Skill Coverage (30pts): % of assessed skills you have strong (vs peers who typically have most)
  //    Count-based: 3/15 strong = 20% = 6pts. No inflation from having "high-demand" strong.
  const skillCoverage = Math.round(30 * (strongCount / total));

  // 2. Critical Gaps (25pts): heavy penalty — missing what peers have hurts a lot
  //    ~6pts per critical missing, ~2pts per other missing. 4 critical + 5 other = 24+10 = 34 → 0
  const criticalGapPenalty = criticalMissing * 6 + (missingCount - criticalMissing) * 2;
  const criticalGaps = Math.round(Math.max(0, 25 - criticalGapPenalty));

  // 3. Proficiency Depth (20pts): scaled by coverage — can't get 20 if you have few strong
  //    avg proficiency ratio × (strongCount/total) so many gaps cap your depth score
  const avgProficiency = strongCount > 0
    ? strongSkills.reduce((sum, s) => sum + Math.min(1, s.userLevel / Math.max(1, s.marketDemand)), 0) / strongCount
    : 0;
  const proficiencyDepth = Math.round(20 * avgProficiency * (strongCount / total));

  // 4. Trend Alignment (15pts): of your strong skills, how many are rising? Scaled by coverage.
  const risingStrong = strongSkills.filter((s) => s.demandTrend === 'rising').length;
  const trendAlignment = strongCount > 0
    ? Math.round(15 * (risingStrong / strongCount) * (strongCount / total))
    : 0;

  // 5. Fading Risk (10pts): penalty for skills on CV that peers are moving away from
  const fadingPenalty = total > 0 ? (fadingCount / total) * 12 : 0; // up to 12pts lost
  const fadingRisk = Math.round(Math.max(0, 10 - fadingPenalty));

  const rubric = { skillCoverage, criticalGaps, proficiencyDepth, trendAlignment, fadingRisk };
  const rawSum = skillCoverage + criticalGaps + proficiencyDepth + trendAlignment + fadingRisk;
  const overallReadiness = Math.min(100, Math.max(0, Math.round(rawSum)));

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
    topPriorities: Array.isArray(parsed.topPriorities)
      ? parsed.topPriorities.map((p: unknown) => (typeof p === 'string' ? p : String((p as Record<string, unknown>)?.title ?? (p as Record<string, unknown>)?.name ?? p)))
      : [],
    industryInsights: Array.isArray(parsed.industryInsights)
      ? parsed.industryInsights.map((i: unknown) => {
          if (typeof i === 'string') return i;
          if (i && typeof i === 'object') {
            const o = i as Record<string, unknown>;
            const text = o.text ?? o.content ?? o.insight ?? o.title;
            return typeof text === 'string' ? text : JSON.stringify(o).slice(0, 120);
          }
          return String(i);
        })
      : [],
    peerComparison: typeof parsed.peerComparison === 'string' ? parsed.peerComparison : '',
    futureForecast: Array.isArray(parsed.futureForecast)
      ? parsed.futureForecast.map((f: unknown) => {
          if (typeof f === 'string') return f;
          if (f && typeof f === 'object') {
            const o = f as Record<string, unknown>;
            const title = o.title ?? o.name ?? o.skill ?? o.text;
            return typeof title === 'string' ? title : JSON.stringify(o).slice(0, 80);
          }
          return String(f);
        })
      : undefined,
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
