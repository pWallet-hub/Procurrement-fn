import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';

/** type "text" (also the fallback for unknown field types). */
export function TextField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Input
        {...fieldAria(id, field.help, error, required)}
        type="text"
        value={typeof value === 'string' ? value : value == null ? '' : String(value)}
        maxLength={field.maxLength}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
