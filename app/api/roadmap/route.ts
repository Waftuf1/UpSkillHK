import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL } from '@/lib/openai';
import { buildRoadmapPrompt } from '@/lib/prompts';
import { parseJsonRobust } from '@/lib/parseJsonResponse';
import { MOCK_ROADMAPS } from '@/lib/mockData';
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
  return raw.map((r, idx) => {
    const rec = r as Record<string, unknown>;
    const pathType = mapPathType(rec.pathType ?? rec.path ?? rec.type ?? rec.name, idx);
    const rawMilestones = (rec.milestones ?? rec.milestone ?? []) as unknown[];
    const milestones = normalizeMilestones(rawMilestones);
    const weeklyPlan = (rec.weeklyPlan ?? rec.weekly_plan ?? rec.weekPlan ?? []) as Record<string, unknown>[];
    const normalizedWeeks: WeekPlan[] = weeklyPlan.map((w, idx) => {
      const weekNum = typeof w.weekNumber === 'number' ? w.weekNumber : typeof w.week === 'number' ? w.week : idx + 1;
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

function getSuitableJobsFromDiagnosis(diagnosis: SkillGapMap): string[] {
  const role = diagnosis.role || 'Professional';
  const industry = diagnosis.industry || 'your field';
  const base = [role, `Senior ${role}`, `${role} (${industry})`];
  if (industry !== 'your field') base.push(`${industry} Manager`, `${industry} Specialist`);
  return Array.from(new Set(base)).slice(0, 6);
}

function getPersonalizedRoadmaps(diagnosis: SkillGapMap, weeklyHours: number): CareerRoadmap[] {
  const role = diagnosis.role || 'Professional';
  const industry = diagnosis.industry || 'your field';
  const priorities = diagnosis.topPriorities?.length ? diagnosis.topPriorities.slice(0, 3) : ['Key skills'];
  const hours = `${weeklyHours}-${weeklyHours + 1} hours/week`;

  return MOCK_ROADMAPS.map((r) => ({
    ...r,
    weeklyCommitment: hours,
    targetOutcome:
      r.pathType === 'stay_dominate'
        ? `Master ${priorities[0]} and ${priorities[1] || 'key skills'} to secure your ${role} role in ${industry}`
        : r.pathType === 'level_up'
          ? `Advance to ${role} or next senior level in ${industry}`
          : `Move into high-growth adjacent field in ${industry}`,
  }));
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
      const roadmaps = getPersonalizedRoadmaps(diagnosis, weeklyHours);
      const suitableJobs = getSuitableJobsFromDiagnosis(diagnosis);
      return NextResponse.json({ success: true, roadmaps, suitableJobs });
    }

    const prompt = buildRoadmapPrompt(diagnosis, weeklyHours, formats, goal, targetRole);

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('No response from AI');
    const trimmed = content.trim();
    if (trimmed.toLowerCase().includes('bad request') || (trimmed.length < 100 && trimmed.toLowerCase().includes('error'))) {
      throw new Error('API returned an error. Check your API key.');
    }
    let parsed: unknown;
    try {
      parsed = parseJsonRobust(content);
    } catch {
      if (diagnosis) {
        const roadmaps = getPersonalizedRoadmaps(diagnosis, weeklyHours);
        const suitableJobs = getSuitableJobsFromDiagnosis(diagnosis);
        return NextResponse.json({ success: true, roadmaps, suitableJobs });
      }
      throw new Error('Invalid API response. Please try again.');
    }
    const parsedObj = parsed as Record<string, unknown>;
    const rawRoadmaps = Array.isArray(parsedObj?.roadmaps) ? parsedObj.roadmaps : (Array.isArray(parsed) ? parsed : [parsed]);
    const roadmaps = normalizeRoadmaps(rawRoadmaps as Record<string, unknown>[], weeklyHours);
    const suitableJobs = Array.isArray(parsedObj?.suitableJobs)
      ? (parsedObj.suitableJobs as string[]).filter((j): j is string => typeof j === 'string')
      : [];

    return NextResponse.json({ success: true, roadmaps, suitableJobs });
  } catch (err) {
    console.error('roadmap error:', err);
    if (diagnosis) {
      const roadmaps = getPersonalizedRoadmaps(diagnosis, weeklyHours);
      const suitableJobs = getSuitableJobsFromDiagnosis(diagnosis);
      return NextResponse.json({ success: true, roadmaps, suitableJobs });
    }
    const msg = err instanceof Error ? err.message : String(err);
    const userMsg = msg.includes('401') || msg.includes('Invalid') ? 'Your API key is invalid or expired. Check .env.local.' : msg;
    return NextResponse.json({ success: false, error: userMsg }, { status: 502 });
  }
}
