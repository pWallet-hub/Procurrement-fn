import { Field, fieldAria } from '../../../ui/Field';
import { Input, Select } from '../../../ui/Input';
import type { FieldProps } from '../types';

/** With allow_other an "Other" option (value "other") reveals a text input stored in `${key}_other`. */
export function SelectField({ field, id, value, onChange, otherValue, onOtherChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Select
        {...fieldAria(id, field.help, error, required)}
        value={typeof value === 'string' ? value : ''}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Select…</option>
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {field.allow_other && <option value="other">Other</option>}
      </Select>
      {field.allow_other && value === 'other' && (
        <Input aria-label={`${field.label} other`} value={otherValue ?? ''} readOnly={readOnly} onChange={(e) => onOtherChange(e.target.value)} />
      )}
    </Field>
  );
}
