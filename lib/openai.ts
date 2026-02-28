import OpenAI from 'openai';

// Support: Poe > OpenRouter > OpenAI (first available wins)
const poeKey = process.env.POE_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const apiKey = poeKey || openRouterKey || openaiKey;
const baseURL = poeKey
  ? 'https://api.poe.com/v1'
  : openRouterKey
    ? 'https://openrouter.ai/api/v1'
    : undefined;

// Poe: Gemini-3-Pro with web search | OpenRouter: openai/gpt-4o | OpenAI: gpt-4o
export const AI_MODEL = poeKey ? 'Gemini-3-Pro' : openRouterKey ? 'openai/gpt-4o' : 'gpt-4o';

// Poe ignores response_format - we pass extra_body for web search
export const IS_POE = !!poeKey;

export const openai = apiKey
  ? new OpenAI({ apiKey, baseURL })
  : null;

export function isOpenAIAvailable(): boolean {
  return !!apiKey;
}
