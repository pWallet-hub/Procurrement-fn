import type { FieldDef, Money } from '../../api/types';

/** ISO date -> dd/mm/yyyy as printed on the forms. */
export function paperDate(v: unknown): string {
  if (typeof v !== 'string' || !v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
}

export function paperNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

export function isMoney(v: unknown): v is Money {
  return typeof v === 'object' && v !== null && 'amount' in v && typeof (v as Money).amount === 'number';
}

export function paperMoney(v: unknown): string {
  if (isMoney(v)) return `${paperNumber(v.amount)} ${v.currency ?? ''}`.trim();
  if (typeof v === 'number') return paperNumber(v);
  return '';
}

export const isEmpty = (v: unknown) =>
  v == null || v === '' || (Array.isArray(v) && v.length === 0);

export const optionLabel = (f: FieldDef, value: unknown): string =>
  f.options?.find((o) => o.value === value)?.label ?? String(value ?? '');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const looksLikeId = (v: unknown) => typeof v === 'string' && UUID.test(v);
