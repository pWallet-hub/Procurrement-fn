/** CONTRACT clauses: substitute {advance_percent}, {advance_days}, {balance_percent} from document data. */
export function fillPlaceholders(text: string, data: Record<string, unknown>): string {
  const adv = Number(data.advance_percent);
  return text
    .replace(/\{advance_percent\}/g, data.advance_percent != null ? String(data.advance_percent) : '{advance_percent}')
    .replace(/\{advance_days\}/g, data.advance_days != null ? String(data.advance_days) : '{advance_days}')
    .replace(/\{balance_percent\}/g, data.advance_percent != null && !isNaN(adv) ? String(100 - adv) : '{balance_percent}');
}
