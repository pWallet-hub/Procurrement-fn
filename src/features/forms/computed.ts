import type { FieldDef, Template } from '../../api/types';
import { isServerFilled } from './conditions';

type Data = Record<string, unknown>;

/**
 * After an autosave the server returns computed / readonly values (totals, case copies).
 * Copy only those into the local data so we never overwrite what the user is typing.
 */
export function mergeServerComputed(template: Template, local: Data, server: Data): Data {
  let next = local;
  const set = (k: string, v: unknown) => {
    if (next === local) next = { ...local };
    next[k] = v;
  };
  for (const section of template.schema.sections) {
    for (const f of section.fields) mergeField(f, local, server, set);
  }
  return next;
}

function mergeField(f: FieldDef, local: Data, server: Data, set: (k: string, v: unknown) => void) {
  if (isServerFilled(f)) {
    if (JSON.stringify(local[f.key]) !== JSON.stringify(server[f.key])) set(f.key, server[f.key]);
    return;
  }
  if (f.type === 'table' && f.columns?.some(isServerFilled)) {
    const l = local[f.key];
    const s = server[f.key];
    if (!Array.isArray(l) || !Array.isArray(s) || l.length !== s.length) return;
    let changed = false;
    const rows = l.map((row: Data, i: number) => {
      let r = row;
      for (const c of f.columns ?? []) {
        if (isServerFilled(c) && JSON.stringify(row[c.key]) !== JSON.stringify((s[i] as Data)[c.key])) {
          if (r === row) r = { ...row };
          r[c.key] = (s[i] as Data)[c.key];
          changed = true;
        }
      }
      return r;
    });
    if (changed) set(f.key, rows);
  }
}

const amt = (v: unknown): number =>
  typeof v === 'number' ? v : v && typeof v === 'object' && 'amount' in v ? Number((v as { amount: unknown }).amount) || 0 : Number(v) || 0;
const cur = (v: unknown): string | undefined => (v && typeof v === 'object' && 'currency' in v ? String((v as { currency: unknown }).currency) : undefined);

/**
 * Preview of computed fields filled at a signature slot (e.g. the TC-10 total), while the signer types.
 * Only top level `add` / `add_times` (+ `plus` amounts); the server recomputes the stored value when the slot is signed.
 */
export function previewSlotComputed(fields: FieldDef[], data: Data): Data {
  const out: Data = {};
  for (const f of fields) {
    const sp = f.computed as { op?: string; fields?: string[]; field?: string; plus?: string[] } | undefined;
    if (f.type !== 'computed' || !sp?.fields || (sp.op !== 'add' && sp.op !== 'add_times')) continue;
    const vals = sp.fields.map((k) => data[k]);
    if (vals.every((v) => v == null || v === '')) continue;
    const extra = sp.op === 'add_times' ? (sp.plus ?? []).map((k) => data[k]) : [];
    const n = vals.reduce<number>((s, v) => s + amt(v), 0) * (sp.op === 'add_times' ? amt(data[sp.field ?? '']) : 1) + extra.reduce<number>((s, v) => s + amt(v), 0);
    const r = Math.round(n * 100) / 100;
    out[f.key] = f.format === 'money' ? { amount: r, currency: [...vals, ...extra].map(cur).find(Boolean) ?? 'RWF' } : r;
  }
  return out;
}
