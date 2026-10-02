import type { ReactNode } from 'react';
import type { FieldDef } from '../../api/types';
import { cx } from '../../ui/cx';
import { isEmpty, isMoney, looksLikeId, optionLabel, paperDate, paperMoney, paperNumber } from './format';
import type { RefLabels } from './useRefLabels';

export interface ValueCtx {
  refs: RefLabels;
  /** top level document data (for `${key}_other` lookups) */
  container: Record<string, unknown>;
}

/** A printed check box. Drawn with CSS so it prints identically everywhere. */
export function Box({ on, children }: { on: boolean; children?: ReactNode }) {
  return (
    <span className="pf-check">
      <span className={cx('pf-box', on && 'pf-box--on')} role="img" aria-label={on ? 'checked' : 'not checked'} />
      {children}
    </span>
  );
}

export const Blank = ({ wide }: { wide?: boolean }) => <span className={cx('pf-blank', wide && 'pf-blank--wide')} aria-hidden="true" />;

const OTHER = 'other';

/** Printed representation of one field value, by field type. Unknown types print as text. */
export function PaperValue({ field, value, ctx, compact }: { field: FieldDef; value: unknown; ctx: ValueCtx; compact?: boolean }): ReactNode {
  switch (field.type) {
    case 'checkbox_group':
    case 'radio': {
      const selected = Array.isArray(value) ? (value as string[]) : value != null && value !== '' ? [String(value)] : [];
      const opts = field.options ?? [];
      const other = ctx.container[`${field.key}_other`];
      return (
        <span className={cx('pf-checks', compact && 'pf-checks--compact')}>
          {opts.map((o) => (
            <Box key={o.value} on={selected.includes(o.value)}>{o.label}</Box>
          ))}
          {field.allow_other && (
            <Box on={selected.includes(OTHER)}>
              Other: {typeof other === 'string' && other ? <u>{other}</u> : <Blank />}
            </Box>
          )}
        </span>
      );
    }
    case 'yes_no':
      return (
        <span className="pf-checks pf-checks--compact">
          <Box on={value === true}>Yes</Box>
          <Box on={value === false}>No</Box>
        </span>
      );
    case 'select':
      return isEmpty(value) ? <Blank /> : <>{optionLabel(field, value)}</>;
    case 'date':
      return isEmpty(value) ? <span className="pf-date"><Blank />/<Blank />/<Blank /></span> : <>{paperDate(value)}</>;
    case 'money':
      return isEmpty(value) ? <Blank /> : <>{paperMoney(value)}</>;
    case 'number':
      return typeof value === 'number' ? <>{paperNumber(value)}</> : isEmpty(value) ? <Blank /> : <>{String(value)}</>;
    case 'computed':
      return isEmpty(value) ? <Blank /> : <>{isMoney(value) ? paperMoney(value) : typeof value === 'number' ? paperNumber(value) : String(value)}</>;
    case 'user_ref':
    case 'supplier_ref':
    case 'budget_line_ref': {
      if (isEmpty(value)) return <Blank />;
      const id = String(value);
      const label = field.type === 'user_ref' ? ctx.refs.user(id) : field.type === 'supplier_ref' ? ctx.refs.supplier(id) : ctx.refs.budget(id);
      if (label) return <>{label}</>;
      return looksLikeId(id) ? <Blank /> : <>{id}</>; // never print a raw uuid on a form
    }
    case 'file':
      return isEmpty(value) ? <Blank /> : <Box on>Attached</Box>;
    case 'textarea':
      return isEmpty(value) ? <Blank wide /> : <span className="pf-multiline">{String(value)}</span>;
    default:
      if (isEmpty(value)) return <Blank />;
      if (isMoney(value)) return <>{paperMoney(value)}</>;
      return <>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</>;
  }
}
