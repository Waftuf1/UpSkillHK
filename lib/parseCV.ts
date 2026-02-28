// CV text extraction logic - used by API route
// Actual extraction happens in API route using pdf-parse and mammoth

export function extractTextFromLinkedIn(text: string): string {
  // Clean up LinkedIn pasted text - remove excessive whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim();
}
