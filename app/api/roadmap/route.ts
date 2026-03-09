import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, getBedrockClient, BEDROCK_MODEL } from '@/lib/openai';
import { buildRoadmapPrompt } from '@/lib/prompts';
import { parseJsonRobust } from '@/lib/parseJsonResponse';
import type { SkillGapMap, CareerRoadmap, WeekPlan, LearningTask, LearningResource, Milestone } from '@/lib/types';

const PATH_TITLES: Record<string, string> = {
  stay_dominate: 'Stay & Dominate',
  level_up: 'Level Up',
  pivot: 'Pivot',
};

function mapPathType(val: unknown, index: number): 'stay_dominate' | 'level_up' | 'pivot' {
  const s = String(val ?? '').toLowerCase().replace(/\s+/g, '_');
  if (s.includes('stay') || s.includes('dominate') || s === 'path_a' || s === 'a') return 'stay_dominate';
  if (s.includes('level') || s.includes('up') || s === 'path_b' || s === 'b') return 'level_up';
  if (s.includes('pivot') || s === 'path_c' || s === 'c') return 'pivot';
  const fallbacks: ('stay_dominate' | 'level_up' | 'pivot')[] = ['stay_dominate', 'level_up', 'pivot'];
  return fallbacks[Math.min(index, 2)] ?? 'stay_dominate';
}

function normalizeMilestones(raw: unknown[]): Milestone[] {
  return raw.map((m) => {
    const rec = m as Record<string, unknown>;
    const skills = rec.skillsTargeted ?? rec.skills_targeted ?? rec.skills ?? [];
    const skillsArr = Array.isArray(skills)
      ? skills.map((s) => (typeof s === 'string' ? s : String(s)))
      : typeof skills === 'string'
        ? [skills]
        : [];
    return {
      week: typeof rec.week === 'number' ? rec.week : 0,
      title: String(rec.title ?? rec.name ?? ''),
      description: String(rec.description ?? ''),
      skillsTargeted: skillsArr,
      assessmentType: ['quiz', 'project', 'reflection'].includes(String(rec.assessmentType ?? rec.assessment ?? ''))
        ? (rec.assessmentType ?? rec.assessment) as Milestone['assessmentType']
        : 'quiz',
    };
  });
}

function normalizeRoadmaps(raw: unknown[], weeklyHours: number): CareerRoadmap[] {
  let templatePlan: WeekPlan[] | null = null;

  return raw.map((r, idx) => {
    const rec = r as Record<string, unknown>;
    const pathType = mapPathType(rec.pathType ?? rec.path ?? rec.type ?? rec.name, idx);
    const rawMilestones = (rec.milestones ?? rec.milestone ?? []) as unknown[];
    const milestones = normalizeMilestones(rawMilestones);
    const weeklyPlan = (rec.weeklyPlan ?? rec.weekly_plan ?? rec.weekPlan ?? []) as Record<string, unknown>[];
    let normalizedWeeks: WeekPlan[] = weeklyPlan.map((w, widx) => {
      const weekNum = typeof w.weekNumber === 'number' ? w.weekNumber : typeof w.week === 'number' ? w.week : widx + 1;
      const tasks = (w.tasks ?? w.task ?? []) as Record<string, unknown>[];
      const normalizedTasks: LearningTask[] = tasks.map((t) => {
        const resources = (t.resources ?? t.resource ?? []) as Record<string, unknown>[];
        const normalizedResources: LearningResource[] = resources
          .filter((res) => res && typeof res === 'object')
          .map((res) => ({
            type: ['video', 'article', 'course', 'tool'].includes(String(res.type)) ? res.type as LearningResource['type'] : 'course',
            title: String(res.title ?? res.name ?? 'Suggested resource'),
            description: typeof res.description === 'string' ? res.description : undefined,
            url: typeof res.url === 'string' ? res.url : typeof res.link === 'string' ? res.link : undefined,
          }))
          .filter((r) => r.title && r.title !== 'Suggested resource');
        const skillTargeted = String(t.skillTargeted ?? t.skill ?? '');
        const searchQuery = encodeURIComponent(`${skillTargeted} tutorial`);
        const fallbackResources: LearningResource[] = [
          {
            type: 'video',
            title: `YouTube: "${skillTargeted}" tutorials`,
            description: 'Search for video tutorials',
            url: `https://www.youtube.com/results?search_query=${searchQuery}`,
          },
          {
            type: 'course',
            title: `Coursera / edX: "${skillTargeted}" courses`,
            description: 'Online and HK university options',
            url: `https://www.coursera.org/search?query=${encodeURIComponent(skillTargeted)}`,
          },
        ];
        const finalResources = normalizedResources.length > 0 ? normalizedResources : fallbackResources;
        return {
          title: String(t.title ?? ''),
          format: ['video', 'audio', 'reading', 'interactive', 'practice', 'quiz', 'reflection'].includes(String(t.format)) ? t.format as LearningTask['format'] : 'reading',
          duration: String(t.duration ?? '30 min'),
          description: String(t.description ?? ''),
          skillTargeted,
          difficulty: ['beginner', 'intermediate', 'advanced'].includes(String(t.difficulty)) ? t.difficulty as LearningTask['difficulty'] : 'beginner',
          learningGuide: typeof t.learningGuide === 'string' ? t.learningGuide : undefined,
          resources: finalResources,
        };
      });
      return {
        weekNumber: weekNum,
        theme: String(w.theme ?? w.title ?? `Week ${weekNum}`),
        tasks: normalizedTasks,
        estimatedHours: typeof w.estimatedHours === 'number' ? w.estimatedHours : typeof w.hours === 'number' ? w.hours : 5,
        assessmentIncluded: Boolean(w.assessmentIncluded ?? w.assessment ?? false),
      };
    });
    // Fallback: if AI skipped weeklyPlan for Path B/C, reuse first path's plan so they display
    if (normalizedWeeks.length > 0) templatePlan = normalizedWeeks;
    else if (templatePlan && templatePlan.length > 0) normalizedWeeks = templatePlan;

    const rawTitle = rec.title ?? rec.name ?? rec.path ?? '';
    const rawSubtitle = rec.subtitle ?? rec.description ?? '';
    const rawTimeline = rec.timeline ?? rec.duration ?? (pathType === 'stay_dominate' ? '3-6 months' : pathType === 'level_up' ? '6-12 months' : '12-18 months');
    const rawWeekly = rec.weeklyCommitment ?? rec.weekly_commitment ?? `${weeklyHours} hours/week`;
    return {
      pathType,
      title: String(rawTitle || PATH_TITLES[pathType] || 'Career Path'),
      subtitle: String(rawSubtitle),
      timeline: String(rawTimeline),
      weeklyCommitment: String(rawWeekly),
      targetOutcome: String(rec.targetOutcome ?? rec.target_outcome ?? rec.outcome ?? ''),
      milestones,
      weeklyPlan: normalizedWeeks,
    } as CareerRoadmap;
  });
}

/** Reorder weeks so Week 1 matches user's #1 priority — AI often returns same order regardless of prompt */
function getWeekPriority(week: WeekPlan, priorities: string[]): number {
  const theme = (week.theme ?? '').toLowerCase();
  if (theme.includes('integrat')) return 999;
  const skills = Array.from(new Set((week.tasks ?? []).map((t) => (t.skillTargeted ?? '').toLowerCase()).filter(Boolean)));
  const matchStr = [theme, ...skills].join(' ');
  for (let i = 0; i < priorities.length; i++) {
    const p = priorities[i].toLowerCase();
    const tokens = p.split(/\s+/).filter((t) => t.length > 2);
    if (tokens.some((t) => matchStr.includes(t) || theme.includes(t))) return i;
  }
  return priorities.length;
}

function reorderWeeksByPriorities(roadmaps: CareerRoadmap[], priorities: string[]): CareerRoadmap[] {
  if (!priorities.length) return roadmaps;
  return roadmaps.map((r) => {
    const plan = r.weeklyPlan ?? [];
    if (plan.length < 2) return r;
    const sorted = [...plan].sort((a, b) => getWeekPriority(a, priorities) - getWeekPriority(b, priorities));
    const reordered = sorted.map((w, i) => ({ ...w, weekNumber: i + 1 }));
    return { ...r, weeklyPlan: reordered };
  });
}

export async function POST(request: NextRequest) {
  let diagnosis: SkillGapMap | null = null;
  let weeklyHours = 5;

  try {
    let body: { diagnosis?: SkillGapMap; preferences?: { weeklyHours?: number; formats?: string[]; goal?: string; targetRole?: string } };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
    diagnosis = body.diagnosis ?? null;
    const preferences = body.preferences;
    weeklyHours = preferences?.weeklyHours ?? 5;
    const formats = preferences?.formats ?? ['video', 'audio'];
    const goal = preferences?.goal ?? 'unsure';
    const targetRole = preferences?.targetRole;

    if (!diagnosis) {
      return NextResponse.json({ success: false, error: 'Missing diagnosis' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No AI API key configured. Add AWS_BEDROCK_API_KEY or AWS_BEARER_TOKEN_BEDROCK to .env.local.' },
        { status: 503 }
      );
    }

    const prompt = buildRoadmapPrompt(diagnosis, weeklyHours, formats, goal, targetRole);

    const callAI = (useBedrock = false) => {
      const bedrock = getBedrockClient();
      if (useBedrock && bedrock) {
        return bedrock.chat.completions.create({
          model: BEDROCK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        });
      }
      return openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      });
    };

    let content: string | null | undefined;
    let parsed: unknown;
    const providers: boolean[] = [false, false, true]; // primary x2, then Bedrock fallback
    for (let attempt = 0; attempt < providers.length; attempt++) {
      try {
        const completion = await callAI(providers[attempt]);
        content = completion.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') continue;
        const trimmed = content.trim();
        if (trimmed.toLowerCase().includes('bad request') || (trimmed.length < 100 && trimmed.toLowerCase().includes('error'))) continue;
        try {
          parsed = parseJsonRobust(content);
          break;
        } catch (parseErr) {
          if (attempt < providers.length - 1) {
            await new Promise((r) => setTimeout(r, 1500));
          } else {
            console.error('Roadmap parse failed after all retries:', parseErr, 'Snippet:', content?.slice(0, 300));
            throw new Error('AI returned invalid roadmap data. Please try again.');
          }
        }
      } catch (apiErr) {
        if (attempt === providers.length - 1) throw apiErr;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (parsed === undefined) throw new Error('No response from AI');
    const parsedObj = parsed as Record<string, unknown>;
    let rawArr = parsedObj?.roadmaps;
    if (!Array.isArray(rawArr)) rawArr = typeof rawArr === 'object' && rawArr ? [rawArr] : [parsedObj ?? {}];
    let roadmaps = normalizeRoadmaps((rawArr as Record<string, unknown>[]).slice(0, 10), weeklyHours);

    // Ensure exactly 3 paths (AI sometimes returns 1 or 2)
    const pathOrder: ('stay_dominate' | 'level_up' | 'pivot')[] = ['stay_dominate', 'level_up', 'pivot'];
    const pathConfig = [
      { pathType: 'stay_dominate' as const, title: 'Stay & Dominate', timeline: '3-6 months' },
      { pathType: 'level_up' as const, title: 'Level Up', timeline: '6-12 months' },
      { pathType: 'pivot' as const, title: 'Pivot', timeline: '12-18 months' },
    ];
    const byType = new Map<string, CareerRoadmap>();
    for (const r of roadmaps) {
      if (!byType.has(r.pathType)) byType.set(r.pathType, r);
    }
    const result = pathOrder.map((pt) => byType.get(pt)).filter((r): r is CareerRoadmap => !!r);
    if (result.length < 3) {
      const base = result[0] ?? roadmaps[0];
      if (base) {
        for (let i = result.length; i < 3; i++) {
          const cfg = pathConfig[i];
          result.push({
            ...base,
            pathType: cfg.pathType,
            title: base.pathType === cfg.pathType ? base.title : cfg.title,
            timeline: base.pathType === cfg.pathType ? base.timeline : cfg.timeline,
          });
        }
      }
    }
    roadmaps = result.slice(0, 3);

    // Expand weeklyPlan if AI returned only 1-2 weeks (should be 6-8)
    roadmaps = roadmaps.map((r) => {
      const plan = r.weeklyPlan ?? [];
      if (plan.length >= 4) return r;
      if (plan.length === 0) return r;
      const expanded: WeekPlan[] = [];
      const targetWeeks = 6;
      for (let i = 0; i < targetWeeks; i++) {
        const src = plan[i % plan.length];
        const theme = i < plan.length ? src.theme : `${plan[0].theme} (continued)`;
        let tasks = src.tasks ?? [];
        if (tasks.length === 0 && plan[0].tasks?.length) tasks = plan[0].tasks;
        if (tasks.length === 0) {
          tasks = [{
            title: theme,
            format: 'reading' as const,
            duration: '30 min',
            description: 'Explore this topic. Search for tutorials and practice.',
            skillTargeted: theme.split(' ')[0] ?? 'Skills',
            difficulty: 'beginner' as const,
            resources: [{ type: 'video' as const, title: 'YouTube search', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(theme)}` }],
          }];
        }
        expanded.push({ ...src, weekNumber: i + 1, theme, tasks });
      }
      return { ...r, weeklyPlan: expanded };
    });

    const fromTop = diagnosis.topPriorities?.filter((p) => p && p !== 'Key skills').slice(0, 3) ?? [];
    const fromSkills =
      fromTop.length === 0
        ? (diagnosis.skills ?? [])
            .filter((s) => s.status === 'missing' && (s.priority === 'critical' || s.priority === 'important'))
            .sort((a, b) => (b.marketDemand ?? 0) - (a.marketDemand ?? 0))
            .slice(0, 3)
            .map((s) => s.skillName)
        : [];
    let priorities = fromTop.length ? fromTop : fromSkills;
    if (priorities.length === 0) {
      const seed = `${diagnosis.generatedAt ?? ''}-${diagnosis.role ?? ''}-${diagnosis.industry ?? ''}`;
      const hash = seed.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const defaults = [
        ['Python', 'Data Analytics', 'ESG Reporting'],
        ['Data Analytics', 'Python', 'ESG Reporting'],
        ['ESG Reporting', 'Data Analytics', 'Python'],
      ];
      priorities = defaults[Math.abs(hash) % 3];
    }
    roadmaps = reorderWeeksByPriorities(roadmaps, priorities);

    const suitableJobs = Array.isArray(parsedObj?.suitableJobs)
      ? (parsedObj.suitableJobs as string[]).filter((j): j is string => typeof j === 'string')
      : [];

    return NextResponse.json({ success: true, roadmaps, suitableJobs });
  } catch (err) {
    console.error('roadmap error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    const userMsg = msg.includes('401') || msg.includes('Invalid') ? 'Your API key is invalid or expired. Check .env.local.' : msg;
    return NextResponse.json({ success: false, error: userMsg }, { status: 502 });
  }
}
