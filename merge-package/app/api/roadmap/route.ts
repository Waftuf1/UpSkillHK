import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildRoadmapPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/parseJsonResponse';
import type { SkillGapMap, CareerRoadmap, WeekPlan, WeekVideo, LearningTask, LearningResource } from '@/lib/types';

/** Normalize API response: ensure weekNumber, tasks, learningGuide, resources with correct shape */
function normalizeRoadmaps(raw: unknown[]): CareerRoadmap[] {
  return raw.map((r) => {
    const rec = r as Record<string, unknown>;
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
        const fallbackResource: LearningResource = {
          type: 'course',
          title: `Search: "${skillTargeted}" courses on Coursera, edX, or HKU SPACE`,
          description: 'Online and Hong Kong university options available',
        };
        const finalResources = normalizedResources.length > 0 ? normalizedResources : [fallbackResource];
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
      const rawVideos = (w.recommendedVideos ?? w.recommended_videos ?? w.videos ?? []) as Record<string, unknown>[];
      const normalizedVideos: WeekVideo[] = rawVideos
        .filter((v) => v && typeof v === 'object' && v.title)
        .map((v) => ({
          title: String(v.title),
          channel: typeof v.channel === 'string' ? v.channel : undefined,
          description: String(v.description ?? ''),
          url: typeof v.url === 'string' ? v.url : typeof v.link === 'string' ? v.link : undefined,
          duration: typeof v.duration === 'string' ? v.duration : undefined,
          whyWatch: String(v.whyWatch ?? v.why_watch ?? v.reason ?? ''),
        }));

      return {
        weekNumber: weekNum,
        theme: String(w.theme ?? w.title ?? `Week ${weekNum}`),
        tasks: normalizedTasks,
        estimatedHours: typeof w.estimatedHours === 'number' ? w.estimatedHours : typeof w.hours === 'number' ? w.hours : 5,
        assessmentIncluded: Boolean(w.assessmentIncluded ?? w.assessment ?? false),
        recommendedVideos: normalizedVideos.length > 0 ? normalizedVideos : undefined,
      };
    });
    return {
      ...rec,
      pathType: rec.pathType ?? 'stay_dominate',
      milestones: rec.milestones ?? [],
      weeklyPlan: normalizedWeeks,
    } as CareerRoadmap;
  });
}

export async function POST(request: NextRequest) {
  try {
    const { diagnosis, preferences } = (await request.json()) as {
      diagnosis: SkillGapMap;
      preferences: { weeklyHours: number; formats: string[]; goal: string; targetRole?: string };
    };

    if (!diagnosis) {
      return NextResponse.json({ success: false, error: 'Missing diagnosis' }, { status: 400 });
    }

    const weeklyHours = preferences?.weeklyHours ?? 5;
    const formats = preferences?.formats ?? ['video', 'audio'];
    const goal = preferences?.goal ?? 'unsure';
    const targetRole = preferences?.targetRole;

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured. Add an API key to .env.local and restart.' },
        { status: 503 }
      );
    }

    const prompt = buildRoadmapPrompt(diagnosis, weeklyHours, formats, goal, targetRole);

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      ...(IS_POE ? { extra_body: { web_search: true } } : { response_format: { type: 'json_object' } }),
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('No response from AI');
    const trimmed = content.trim();
    if (trimmed.toLowerCase().includes('bad request') || (trimmed.length < 100 && trimmed.toLowerCase().includes('error'))) {
      throw new Error('API returned an error. Check your API key.');
    }
    let parsed: unknown;
    try {
      parsed = (trimmed.startsWith('{') || trimmed.startsWith('[')) ? JSON.parse(content) : extractJson(content);
    } catch {
      throw new Error('Invalid API response. Please try again.');
    }
    const parsedObj = parsed as Record<string, unknown>;
    const rawRoadmaps = Array.isArray(parsedObj?.roadmaps) ? parsedObj.roadmaps : (Array.isArray(parsed) ? parsed : [parsed]);
    const roadmaps = normalizeRoadmaps(rawRoadmaps as Record<string, unknown>[]);
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
