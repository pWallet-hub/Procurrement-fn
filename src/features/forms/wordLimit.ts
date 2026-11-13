export const DEFAULT_TEXTAREA_WORD_LIMIT = 15;

function normalizedLabel(label: string): string {
  return label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function isPurposeJustification(label: string): boolean {
  return normalizedLabel(label) === 'purpose justification';
}

export function isNotedDetails(label: string): boolean {
  return normalizedLabel(label) === 'noted details';
}

export function getFieldWordLimit(label: string, configuredLimit?: number): number {
  const normalized = normalizedLabel(label);
  const fieldLimit = normalized === 'item fee description'
    ? 5 // remove this special case if this field should also allow 15
    : DEFAULT_TEXTAREA_WORD_LIMIT;
  return Math.min(configuredLimit ?? fieldLimit, fieldLimit);
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function truncateToWordLimit(value: string, maxWords: number): string {
  const limit = Math.max(0, Math.floor(maxWords));
  if (limit === 0) return '';
  if (countWords(value) <= limit) return value;

  const words = /\S+/g;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = words.exec(value)) !== null) {
    count += 1;
    if (count === limit) return value.slice(0, match.index + match[0].length);
  }
  return value;
}

export function acceptWithinWordLimit(next: string, current: string, maxWords: number): string {
  const limit = Math.max(0, Math.floor(maxWords));
  if (limit === 0) return '';
  if (countWords(next) <= limit) return next;       // within the limit: accept
  if (countWords(current) >= limit) return current; // already full: ignore new words
  return truncateToWordLimit(next, limit);          // paste overflow: cut at the limit
}