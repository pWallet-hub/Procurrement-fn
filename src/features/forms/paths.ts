import type { FieldDef, Template } from '../../api/types';

/** Human readable description of an error path like `items[0].qty` -> `Items, row 1, Qty`. */
export function describePath(template: Template, path: string): string {
  const m = /^([^.[\]]+)(?:\[(\d+)\])?(?:\.(.+))?$/.exec(path);
  if (!m) return path;
  const [, key, idx, rest] = m;
  let field: FieldDef | undefined;
  for (const s of template.schema.sections) {
    field = s.fields.find((f) => f.key === key);
    if (field) break;
  }
  if (!field) return path;
  let out = field.label;
  if (idx !== undefined) out += `, row ${Number(idx) + 1}`;
  if (rest) {
    const col = field.columns?.find((c) => c.key === rest);
    out += `, ${col?.label ?? rest}`;
  }
  return out;
}

/** Top level data key an error path belongs to. */
export function rootKey(path: string): string {
  return path.split(/[.[]/)[0];
}
