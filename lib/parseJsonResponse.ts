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
