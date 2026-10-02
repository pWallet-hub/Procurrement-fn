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
