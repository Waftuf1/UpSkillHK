import OpenAI from 'openai';

// Support: Gemini > OpenRouter > OpenAI > MiniMax > Bedrock (MiniMax before Bedrock to avoid Anthropic geo restrictions)
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const minimaxKey = process.env.MINIMAX_API_KEY;
const bedrockKey = process.env.AWS_BEDROCK_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK;
const bedrockRegion = process.env.AWS_BEDROCK_REGION || 'us-east-1';

const apiKey = geminiKey || openRouterKey || openaiKey || minimaxKey || bedrockKey;

// Gemini: gemini-2.0-flash | OpenRouter: gpt-4o | OpenAI: gpt-4o | MiniMax: M2-her | Bedrock: Claude
export const AI_MODEL = geminiKey
  ? (process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash')
  : openRouterKey
    ? 'openai/gpt-4o'
    : openaiKey
      ? 'gpt-4o'
      : minimaxKey
        ? (process.env.MINIMAX_MODEL || 'M2-her')
        : bedrockKey
          ? (process.env.AWS_BEDROCK_MODEL || 'amazon.nova-pro-v1:0')
          : 'gpt-4o';

// MiniMax uses a different endpoint path - we use a custom client
export const IS_MINIMAX = !!minimaxKey;

const AI_REQUEST_TIMEOUT = 120000; // 2 min for slow connections (e.g. Bedrock)

function getStandardOpenAIClient(): OpenAI | null {
  const baseOptions = { timeout: AI_REQUEST_TIMEOUT };
  if (geminiKey) return new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', ...baseOptions });
  if (openRouterKey) return new OpenAI({ apiKey: openRouterKey, baseURL: 'https://openrouter.ai/api/v1', ...baseOptions });
  if (openaiKey) return new OpenAI({ apiKey: openaiKey, ...baseOptions });
  // Bedrock /openai/v1 only supports gpt-oss, not Claude. Use Converse API via custom path below.
  if (bedrockKey) return null;
  if (minimaxKey) return null; // MiniMax uses custom fetch
  return null;
}

const standardOpenai = getStandardOpenAIClient();

async function minimaxChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: string };
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min for slow connections
  let res: Response;
  try {
    res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${minimaxKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        temperature: params.temperature ?? 0.7,
        // MiniMax Text-01 supports response_format; M2 models may ignore it - prompt asks for JSON
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
    throw new Error(`MiniMax API error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    base_resp?: { status_code?: number; status_msg?: string };
  };
  if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax: ${data.base_resp.status_msg || `Error ${data.base_resp.status_code}`}`);
  }
  return data as { choices: Array<{ message: { content: string } }> };
}

export const openai = {
  chat: {
    completions: {
      create: async (params: Parameters<OpenAI['chat']['completions']['create']>[0]) => {
        // Priority: Gemini > OpenRouter > OpenAI > MiniMax > Bedrock (MiniMax first to avoid Anthropic geo restrictions)
        if (standardOpenai) {
          return standardOpenai.chat.completions.create(params);
        }
        if (minimaxKey) {
          return minimaxChatCompletion({
            model: params.model,
            messages: (params.messages as Array<{ role: string; content: string }>).map((m) => ({
              role: (m as { role: string }).role,
              content: typeof (m as { content: string }).content === 'string' ? (m as { content: string }).content : JSON.stringify((m as { content: string }).content),
            })),
            temperature: params.temperature ?? undefined,
            response_format: params.response_format as { type: string } | undefined,
          }) as ReturnType<OpenAI['chat']['completions']['create']>;
        }
        if (bedrockKey) {
          return bedrockConverseChat({
            model: params.model,
            messages: (params.messages as Array<{ role: string; content: string }>).map((m) => ({
              role: (m as { role: string }).role,
              content: typeof (m as { content: string }).content === 'string' ? (m as { content: string }).content : JSON.stringify((m as { content: string }).content),
            })),
            temperature: params.temperature ?? 0.7,
          }) as ReturnType<OpenAI['chat']['completions']['create']>;
        }
        throw new Error('No AI API configured. Add GOOGLE_GEMINI_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, MINIMAX_API_KEY, or AWS_BEDROCK_API_KEY to .env.local');
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
          maxTokens: 4096,
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

/** Get Bedrock client for fallback. Uses Converse API for Claude (OpenAI endpoint only supports gpt-oss). */
export function getBedrockClient(): { chat: { completions: { create: (p: { model: string; messages: Array<{ role: string; content: string }>; temperature?: number; response_format?: { type: string } }) => Promise<{ choices: Array<{ message: { content: string } }> }> } } } | null {
  if (!bedrockKey) return null;
  return {
    chat: {
      completions: {
        create: (p) => bedrockConverseChat({ model: p.model, messages: p.messages as Array<{ role: string; content: string }>, temperature: p.temperature }),
      },
    },
  };
}

export function getConfiguredProviders(): { name: string; configured: boolean; active: boolean }[] {
  const activeProvider = geminiKey ? 'gemini' : openRouterKey ? 'openrouter' : openaiKey ? 'openai' : minimaxKey ? 'minimax' : bedrockKey ? 'bedrock' : null;
  return [
    { name: 'Google Gemini', configured: !!geminiKey, active: activeProvider === 'gemini' },
    { name: 'OpenRouter', configured: !!openRouterKey, active: activeProvider === 'openrouter' },
    { name: 'OpenAI', configured: !!openaiKey, active: activeProvider === 'openai' },
    { name: 'MiniMax', configured: !!minimaxKey, active: activeProvider === 'minimax' },
    { name: 'AWS Bedrock', configured: !!bedrockKey, active: activeProvider === 'bedrock' },
  ];
}
