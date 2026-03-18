export function normalizeSpecificAimsText(input: string): string {
  const trimmed = input.trim();
  const collapsedBlankLines = trimmed.replace(/\n{3,}/g, "\n\n");
  return collapsedBlankLines;
}

export function countCharacters(input: string): number {
  return input.length;
}

export function estimateWordCount(input: string): number {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

