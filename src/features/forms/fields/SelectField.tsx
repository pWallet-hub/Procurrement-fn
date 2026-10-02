import { Field, fieldAria } from '../../../ui/Field';
import { Select } from '../../../ui/Input';
import type { FieldProps } from '../types';

export function SelectField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
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
      </Select>
    </Field>
  );
}
