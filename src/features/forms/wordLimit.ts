export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function acceptWithinWordLimit(next: string, current: string, maxWords?: number): string {
  if (!maxWords || countWords(next) <= maxWords) return next;
  if (countWords(current) > maxWords && countWords(next) <= countWords(current)) return next;
  return current;
}