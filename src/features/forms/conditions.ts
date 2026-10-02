import type { Condition, FieldDef } from '../../api/types';

/** Evaluate a template Condition against document.data (field = top level key). */
export function evalCondition(cond: Condition | undefined, data: Record<string, unknown>): boolean {
  if (!cond) return true;
  const v = data[cond.field];
  if (cond.equals !== undefined) return JSON.stringify(v) === JSON.stringify(cond.equals);
  if (cond.includes !== undefined) {
    if (Array.isArray(v)) return v.includes(cond.includes);
    if (typeof v === 'string') return v.includes(cond.includes);
    return false;
  }
  if (cond.truthy !== undefined) {
    const t = Array.isArray(v) ? v.length > 0 : !!v;
    return cond.truthy ? t : !t;
  }
  return true;
}

export const isVisible = (f: { visible_if?: Condition }, data: Record<string, unknown>) =>
  evalCondition(f.visible_if, data);

export const isRequired = (f: FieldDef, data: Record<string, unknown>) =>
  !!f.required || (!!f.required_if && evalCondition(f.required_if, data));

/** Field types the user can never edit. */
export const isServerFilled = (f: FieldDef) => !!f.readonly || f.type === 'computed' || f.type === 'case_ref';
