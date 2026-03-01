import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIAvailable, AI_MODEL, getConfiguredProviders } from '@/lib/openai';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const doTest = url.searchParams.get('test') === 'true';

  const providers = getConfiguredProviders();
  const activeProvider = providers.find((p) => p.active);
  let testResult: { ok: boolean; error?: string } | null = null;

  if (doTest && isOpenAIAvailable() && openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        temperature: 0,
        max_tokens: 10,
      });
      const content = completion.choices[0]?.message?.content?.trim();
      testResult = { ok: !!content };
    } catch (err) {
      testResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const body: Record<string, unknown> = {
    configured: providers.filter((p) => p.configured).length,
    activeProvider: activeProvider?.name ?? null,
    model: AI_MODEL,
    providers: providers.map((p) => ({ name: p.name, configured: p.configured, active: p.active })),
  };
  if (testResult) body.test = testResult;

  return NextResponse.json(body);
}
