import type { Money } from '../api/types';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
export function formatMoney(m: Money): string {
  return `${formatNumber(m.amount)} ${m.currency}`;
}
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}
/** "today", "3 days ago" ... for task ages. */
export function formatAge(iso?: string | null): { text: string; days: number } {
  if (!iso) return { text: '', days: 0 };
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms)) return { text: '', days: 0 };
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return { text: days === 1 ? 'waiting 1 day' : `waiting ${days} days`, days };
  const hours = Math.floor(ms / 3_600_000);
  return { text: hours >= 1 ? `waiting ${hours} h` : 'just now', days: 0 };
}
