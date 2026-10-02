import { Field } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';

/** Radio group. With allow_other, an "Other" choice reveals a text input stored in `${key}_other`. */
export function RadioField({ field, id, value, onChange, otherValue, onOtherChange, error, readOnly, required, inline }: FieldProps) {
  const OTHER = '__other__';
  const options = field.options ?? [];
  const known = options.some((o) => o.value === value);
  const otherSelected = field.allow_other && (value === OTHER || (!!value && !known));
  return (
    <Field id={id} group label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      {options.map((o) => (
        <label key={o.value} className="choice">
          <input type="radio" name={id} checked={value === o.value} disabled={readOnly} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
      {field.allow_other && (
        <>
          <label className="choice">
            <input type="radio" name={id} checked={!!otherSelected} disabled={readOnly} onChange={() => onChange(OTHER)} />
            Other
          </label>
          {otherSelected && (
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
