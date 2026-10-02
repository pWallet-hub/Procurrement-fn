import { Field } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';

const OTHER = 'other';

/** Stored as string[]. With allow_other, an "other" entry reveals a text input stored in `${key}_other`. */
export function CheckboxGroupField({ field, id, value, onChange, otherValue, onOtherChange, error, readOnly, required, inline }: FieldProps) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const toggle = (v: string, on: boolean) => onChange(on ? [...selected, v] : selected.filter((x) => x !== v));
  return (
    <Field id={id} group label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      {(field.options ?? []).map((o) => (
        <label key={o.value} className="choice">
          <input type="checkbox" checked={selected.includes(o.value)} disabled={readOnly} onChange={(e) => toggle(o.value, e.target.checked)} />
          {o.label}
        </label>
      ))}
      {field.allow_other && (
        <>
          <label className="choice">
            <input type="checkbox" checked={selected.includes(OTHER)} disabled={readOnly} onChange={(e) => toggle(OTHER, e.target.checked)} />
            Other
          </label>
          {selected.includes(OTHER) && (
            <Input
              aria-label={`${field.label} other`}
              value={otherValue ?? ''}
              readOnly={readOnly}
              onChange={(e) => onOtherChange(e.target.value)}
            />
          )}
        </>
      )}
    </Field>
  );
}
