/**
 * Extract raw JSON substring (before parsing) for repair attempts.
 */
function extractJsonRaw(content: string): string {
  const trimmed = content.trim();
  const openBrace = trimmed.indexOf('{');
  const openBracket = trimmed.indexOf('[');
  let start: number;
  let openChar: string;
  let closeChar: string;
  if (openBrace >= 0 && (openBracket < 0 || openBrace < openBracket)) {
    start = openBrace;
    openChar = '{';
    closeChar = '}';
  } else if (openBracket >= 0) {
    start = openBracket;
    openChar = '[';
    closeChar = ']';
  } else {
    throw new Error('No JSON found');
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote: string | null = null;
  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if ((c === '"' || c === "'") && !inString) { inString = true; quote = c; continue; }
    if (inString && c === quote) { inString = false; quote = null; continue; }
    if (!inString) {
      if (c === openChar) depth++;
      else if (c === closeChar) { depth--; if (depth === 0) return trimmed.slice(start, i + 1); }
    }
  }
  throw new Error('Could not find end of JSON');
}

/**
 * Try to repair common JSON issues from AI responses.
 */
function tryRepairJson(str: string): string {
  return str.replace(/,(\s*[}\]])/g, '$1'); // trailing commas
}

/**
 * Try multiple strategies to parse JSON from AI output.
 */
export function parseJsonRobust<T = unknown>(content: string): T {
  const trimmed = content.trim();
  const stripped = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  const strategies: Array<() => T> = [
    () => JSON.parse(stripped) as T,
    () => extractJson<T>(stripped),
    () => extractJson<T>(content),
    () => JSON.parse(tryRepairJson(extractJsonRaw(stripped))) as T,
    () => JSON.parse(tryRepairJson(extractJsonRaw(content))) as T,
  ];

  for (const fn of strategies) {
    try {
      return fn();
    } catch {
      continue;
    }
  }
  throw new Error('Could not parse JSON from response');
}

/**
 * Extract a JSON object or array from model output.
 * Poe (and some other APIs) ignore response_format, so the model may return
 * prose like "Based on the CV, here is the profile: {...}" instead of raw JSON.
 * This finds the first { or [ and parses the matching bracket pair.
 */
export function extractJson<T = unknown>(content: string): T {
  const trimmed = content.trim();
  const openBrace = trimmed.indexOf('{');
  const openBracket = trimmed.indexOf('[');

  let start: number;
  let openChar: string;
  let closeChar: string;

  if (openBrace >= 0 && (openBracket < 0 || openBrace < openBracket)) {
    start = openBrace;
    openChar = '{';
    closeChar = '}';
  } else if (openBracket >= 0) {
    start = openBracket;
    openChar = '[';
    closeChar = ']';
  } else {
    throw new Error('No JSON object or array found in response');
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  let quote: string | null = null;

  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if ((c === '"' || c === "'") && !inString) {
      inString = true;
      quote = c;
      continue;
    }
    if (inString && c === quote) {
      inString = false;
      quote = null;
      continue;
    }
    if (!inString) {
      if (c === openChar) depth++;
      else if (c === closeChar) {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }

  if (end < 0) throw new Error('Could not find end of JSON in response');
  const jsonStr = trimmed.slice(start, end);
  return JSON.parse(jsonStr) as T;
}
