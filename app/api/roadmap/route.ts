import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, IS_POE } from '@/lib/openai';
import { buildRoadmapPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/parseJsonResponse';
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
    const roadmaps = (Array.isArray(parsedObj?.roadmaps) ? parsedObj.roadmaps : parsed) as CareerRoadmap[];

    return NextResponse.json({ success: true, roadmaps });
  } catch (err) {
    console.error('roadmap error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    const userMsg = msg.includes('401') || msg.includes('Invalid') ? 'Your API key is invalid or expired. Check .env.local.' : msg;
    return NextResponse.json({ success: false, error: userMsg }, { status: 502 });
  }
}
