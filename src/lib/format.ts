import type { Money } from '../api/types';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}
export function formatMoney(m: Money): string {
  return `${formatNumber(m.amount)} ${m.currency}`;
}
/** dd/mm/yyyy (the format printed on the forms), whatever the browser locale. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
/** Today as an ISO date (YYYY-MM-DD) in local time. */
export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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
