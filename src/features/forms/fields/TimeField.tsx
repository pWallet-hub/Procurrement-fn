import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';

/** Stored as TIME string (empty -> null). */
export function TimeField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Input
        {...fieldAria(id, field.help, error, required)}
        type="time"
        value={typeof value === 'string' ? value : ''}
        readOnly={readOnly}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </Field>
  );
}
