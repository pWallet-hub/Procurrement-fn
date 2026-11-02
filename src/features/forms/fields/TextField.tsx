import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import type { FieldProps } from '../types';
import { acceptWithinWordLimit } from '../wordLimit';

/** type "text" (also the fallback for unknown field types). */
export function TextField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const currentValue = typeof value === 'string' ? value : value == null ? '' : String(value);

  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Input
        {...fieldAria(id, field.help, error, required)}
        type="text"
        value={currentValue}
        maxLength={field.maxLength}
        readOnly={readOnly}
        title={field.maxWords ? `Maximum ${field.maxWords} words` : undefined}
        onChange={(e) => onChange(field.maxWords ? acceptWithinWordLimit(e.target.value, currentValue, field.maxWords) : e.target.value)}
      />
    </Field>
  );
}
