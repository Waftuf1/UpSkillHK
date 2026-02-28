import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildRoadmapPrompt } from '@/lib/prompts';
import { MOCK_ROADMAPS } from '@/lib/mockData';
import type { SkillGapMap, CareerRoadmap } from '@/lib/types';

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
      return NextResponse.json({ success: true, roadmaps: MOCK_ROADMAPS });
    }

    try {
      const prompt = buildRoadmapPrompt(diagnosis, weeklyHours, formats, goal, targetRole);

      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        ...(IS_POE ? { extra_body: { web_search: true } } : { response_format: { type: 'json_object' } }),
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content);
      const roadmaps = (Array.isArray(parsed.roadmaps) ? parsed.roadmaps : parsed) as CareerRoadmap[];

      return NextResponse.json({ success: true, roadmaps });
    } catch (apiErr) {
      // API failed (401, etc.) — use mock so user can continue
      console.warn('Roadmap API failed, using mock:', apiErr);
      return NextResponse.json({ success: true, roadmaps: MOCK_ROADMAPS });
    }
  } catch (err) {
    console.error('roadmap error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Roadmap generation failed' },
      { status: 500 }
    );
  }
}
