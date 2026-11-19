import { Badge, type Tone } from './Badge';

// Maps every status string in the contract (document state, slot status, case status, stage) to a tone.
const TONES: Record<string, Tone> = {
  draft: 'neutral',
  in_signing: 'info',
  signed: 'success',
  returned: 'warning',
  archived: 'neutral',
  cancelled: 'danger',
  pending: 'warning',
  waiting: 'neutral',
  declined: 'danger',
  skipped: 'neutral',
  open: 'info',
  closed: 'success',
  done: 'success',
  current: 'info',
  upcoming: 'neutral',
  requisition: 'info',
  quotation: 'info',
  market_check: 'info',
  evaluation: 'info',
  purchase_order: 'info',
  delivery: 'info',
  payment: 'info',
};

/** Short forms that read as letters, not words ("pi" is shown as "PI", not "Pi"). */
const ACRONYMS = new Set(['pi', 'cfm', 'id', 'po', 'pr', 'gr', 'im', 'tc', 'rwf', 'usd', 'eur', 'pdf', 'totp', 'sso', 'afs']);

export function humanize(s: string): string {
  const t = s.replace(/[_.-]+/g, ' ').trim();
  const words = t.split(' ').map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w));
  const out = words.join(' ');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Badge tone={TONES[status] ?? 'neutral'}>{label ?? humanize(status)}</Badge>;
}
