import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';

/** Stored as a number (empty -> null). */
export function NumberField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Input
        {...fieldAria(id, field.help, error, required)}
        type="number"
        inputMode="decimal"
        step="any"
        min={field.min}
        max={field.max}
        value={typeof value === 'number' ? value : ''}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </Field>
  );
}
