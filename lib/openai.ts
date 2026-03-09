import OpenAI from 'openai';

// Only use AWS Bedrock
const bedrockKey = process.env.AWS_BEDROCK_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK;
const bedrockRegion = process.env.AWS_BEDROCK_REGION || 'us-east-1';

const apiKey = bedrockKey;

export const AI_MODEL = bedrockKey ? (process.env.AWS_BEDROCK_MODEL || 'amazon.nova-pro-v1:0') : 'amazon.nova-pro-v1:0';

export const IS_MINIMAX = false;

const AI_REQUEST_TIMEOUT = 120000;

export const openai = {
  chat: {
    completions: {
      create: async (params: Parameters<OpenAI['chat']['completions']['create']>[0]) => {
        if (!bedrockKey) {
          throw new Error('No AI API configured. Add AWS_BEDROCK_API_KEY or AWS_BEARER_TOKEN_BEDROCK to .env.local');
        }
        return bedrockConverseChat({
          model: params.model,
          messages: (params.messages as Array<{ role: string; content: string }>).map((m) => ({
            role: (m as { role: string }).role,
            content: typeof (m as { content: string }).content === 'string' ? (m as { content: string }).content : JSON.stringify((m as { content: string }).content),
          })),
          temperature: params.temperature ?? 0.7,
          maxTokens: (params as { max_tokens?: number }).max_tokens ?? 8192,
        }) as ReturnType<OpenAI['chat']['completions']['create']>;
      },
    },
  },
} as OpenAI;

export function isOpenAIAvailable(): boolean {
  return !!apiKey;
}

/** Default: Amazon Nova (no geo restrictions). Use AWS_BEDROCK_MODEL to override. */
export const BEDROCK_MODEL = process.env.AWS_BEDROCK_MODEL || 'amazon.nova-pro-v1:0';

/** Call Bedrock Converse API (supports Claude). The /openai/v1 endpoint only supports gpt-oss, not Claude. */
async function bedrockConverseChat(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ choices: Array<{ message: { content: string } }> }> {
  const url = `https://bedrock-runtime.${bedrockRegion}.amazonaws.com/model/${encodeURIComponent(params.model)}/converse`;
  const converseMessages = params.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bedrockKey}`,
      },
      body: JSON.stringify({
        messages: converseMessages,
        inferenceConfig: {
          maxTokens: params.maxTokens ?? 8192,
          temperature: params.temperature ?? 0.7,
        },
      }),
    });
  } catch (fetchErr) {
    clearTimeout(timeout);
    if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
      throw new Error('Request timed out. The AI service took too long to respond. Please try again.');
    }
    throw fetchErr;
  }
  clearTimeout(timeout);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bedrock API error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    output?: { message?: { content?: Array<{ text?: string }> } };
  };
  const text = data.output?.message?.content?.[0]?.text ?? '';
  return { choices: [{ message: { content: text } }] };
}

/** Bedrock client (same as openai when Bedrock-only). */
export function getBedrockClient(): { chat: { completions: { create: (p: { model: string; messages: Array<{ role: string; content: string }>; temperature?: number; max_tokens?: number; response_format?: { type: string } }) => Promise<{ choices: Array<{ message: { content: string } }> }> } } } | null {
  if (!bedrockKey) return null;
  return {
    chat: {
      completions: {
        create: (p) => bedrockConverseChat({ model: p.model, messages: p.messages as Array<{ role: string; content: string }>, temperature: p.temperature, maxTokens: p.max_tokens }),
      },
    },
  };
}

export function getConfiguredProviders(): { name: string; configured: boolean; active: boolean }[] {
  return [{ name: 'AWS Bedrock', configured: !!bedrockKey, active: !!bedrockKey }];
}
