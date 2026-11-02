export const DEFAULT_TEXTAREA_WORD_LIMIT = 180;

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function acceptWithinWordLimit(next: string, current: string, maxWords?: number): string {
  const limit = maxWords ?? DEFAULT_TEXTAREA_WORD_LIMIT;
  if (!limit || countWords(next) <= limit) return next;
  if (countWords(current) > limit && countWords(next) <= countWords(current)) return next;
  return current;
}