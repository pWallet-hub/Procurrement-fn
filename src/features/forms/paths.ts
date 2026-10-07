import type { FieldDef, Template } from '../../api/types';

/** Human readable description of an error path like `items[0].qty` -> `Items, row 1, Qty`. */
export function describePath(template: Template, path: string): string {
  const m = /^([^.[\]]+)(?:\[(\d+)\])?(?:\.(.+))?$/.exec(path);
  if (!m) return path;
  const [, rawKey, idx, rest] = m;
  // `${key}_other`: the "Other, please specify" text of a check box field
  const other = rawKey.endsWith('_other') && !rest;
  const key = other ? rawKey.slice(0, -'_other'.length) : rawKey;
  let field: FieldDef | undefined;
  for (const s of template.schema.sections) {
    field = s.fields.find((f) => f.key === key || f.key === rawKey);
    if (field) break;
  }
  if (!field) return path === '_form' ? 'Form' : path;
  if (other && field.key === key) return `${field.label} (Other)`;
  let out = field.label;
  if (idx !== undefined) out += `, row ${Number(idx) + 1}`;
  if (rest) {
    const colKey = rest.endsWith('_other') ? rest.slice(0, -'_other'.length) : rest;
    const col = field.columns?.find((c) => c.key === rest || c.key === colKey);
    out += `, ${col?.label ?? rest}${col && col.key !== rest ? ' (Other)' : ''}`;
  }
  return out;
}

/** Top level data key an error path belongs to. */
export function rootKey(path: string): string {
  return path.split(/[.[]/)[0];
}
