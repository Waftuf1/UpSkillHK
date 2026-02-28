#!/usr/bin/env node
/**
 * Quick test to verify OpenRouter/OpenAI API works.
 * Run: node scripts/test-api.mjs
 * (Loads .env.local - Next.js uses this for local secrets)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local (Next.js convention)
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  // .env.local not found, use existing env
}
import OpenAI from 'openai';

const poeKey = process.env.POE_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const apiKey = poeKey || openRouterKey || openaiKey;
const baseURL = poeKey ? 'https://api.poe.com/v1' : openRouterKey ? 'https://openrouter.ai/api/v1' : undefined;
const model = poeKey ? 'Gemini-3-Pro' : openRouterKey ? 'openai/gpt-4o' : 'gpt-4o';

if (!apiKey) {
  console.error('❌ No API key found. Add OPENROUTER_API_KEY or OPENAI_API_KEY to .env.local');
  process.exit(1);
}

if (apiKey.includes('your-actual-key') || apiKey.includes('your-key')) {
  console.error('❌ You still have the placeholder key. Replace it with your real key from https://openrouter.ai/keys');
  process.exit(1);
}

// Debug: verify key is loaded (show format, not value)
const keyPreview = apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : 'MISSING';
console.log(`Key loaded: ${keyPreview} (length: ${apiKey?.length || 0})`);
console.log(`Testing API... (${poeKey ? 'Poe' : openRouterKey ? 'OpenRouter' : 'OpenAI'})`);
console.log(`Model: ${model}\n`);

const openai = new OpenAI({ apiKey, baseURL });

try {
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'Reply with exactly: API works!' }],
    max_tokens: 20,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  console.log('Response:', reply || '(empty)');
  console.log('\n✅ API is working!');
} catch (err) {
  console.error('❌ API error:', err.message);
  if (err.status) console.error('Status:', err.status);
  process.exit(1);
}
