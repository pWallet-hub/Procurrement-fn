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
