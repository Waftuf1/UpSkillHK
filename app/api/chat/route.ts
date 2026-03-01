import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL } from '@/lib/openai';

const SYSTEM_PROMPT = `You are a friendly, knowledgeable career coach assistant embedded in a career roadmap tool for Hong Kong professionals.

Your role:
- Help users understand their roadmap tasks and how to approach them
- Explain concepts, skills, and topics that appear in their learning plan
- Guide users to find answers themselves — suggest specific search terms, YouTube channels, documentation, and courses
- Provide actionable, step-by-step advice when users feel stuck

When answering:
1. Be concise but helpful (2-4 short paragraphs max)
2. ALWAYS include 1-3 concrete sources at the end of your response in this exact format:
   📹 [Video title] - Channel/Creator (search: "suggested YouTube search query")
   📄 [Article/Doc title] - Source (search: "suggested Google search query")
   📚 [Course title] - Platform (e.g. Coursera, edX, HKU SPACE)
3. Prefer real, well-known resources (YouTube channels like Fireship, freeCodeCamp, Khan Academy, CrashCourse, The Plain Bagel, etc.)
4. For HK-specific topics, suggest local resources (HKU SPACE, CUHK, HKICPA, SFC website, etc.)
5. Encourage the user — remind them that roadmap tasks are suggestions and they can explore beyond them

IMPORTANT: You have context about the user's current roadmap. Use it to give targeted advice. If the user asks something unrelated to career development, gently redirect them.

CRITICAL: Output ONLY your final answer. Never include <think> tags, internal reasoning, or any XML-like markup. Do not output your thinking process — only the user-facing response.`;

/** Strip model thinking/reasoning blocks and other artifacts from the response */
function sanitizeReply(content: string): string {
  let out = content;
  // Remove <think>...</think> blocks (case-insensitive, multiline, greedy to catch nested)
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove unclosed <think> at start (model leaked reasoning)
  out = out.replace(/^<think>[\s\S]*?<\/think>\s*/i, '');
  out = out.replace(/^<think>[\s\S]*/i, '');
  // Remove stray </think> or <think> tags
  out = out.replace(/<\/?think>/gi, '');
  // Remove <think>...</think> anywhere (repeat to catch nested/overlapping)
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove [thinking] or [reasoning] blocks
  out = out.replace(/\[(?:thinking|reasoning)\][\s\S]*?\[\/(?:thinking|reasoning)\]/gi, '');
  // Collapse multiple blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { messages, roadmapContext } = (await request.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      roadmapContext?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'No message provided' }, { status: 400 });
    }

    if (!isOpenAIAvailable() || !openai) {
      return NextResponse.json(
        { success: false, error: 'No API key configured.' },
        { status: 503 }
      );
    }

    const systemContent = roadmapContext
      ? `${SYSTEM_PROMPT}\n\nCURRENT ROADMAP CONTEXT:\n${roadmapContext}`
      : SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const reply = sanitizeReply(content);
    if (!reply) throw new Error('No response from AI');

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error('chat error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }
}
