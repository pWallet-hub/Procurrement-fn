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
};

export function humanize(s: string): string {
  const t = s.replace(/[_.-]+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={TONES[status] ?? 'neutral'}>{humanize(status)}</Badge>;
}
