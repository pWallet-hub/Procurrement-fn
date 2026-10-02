import { Field, fieldAria } from '../../../ui/Field';
import { Textarea } from '../../../ui/Input';
import type { FieldProps } from '../types';

export function TextareaField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Textarea
        {...fieldAria(id, field.help, error, required)}
        value={typeof value === 'string' ? value : ''}
        maxLength={field.maxLength}
        readOnly={readOnly}
        rows={inline ? 2 : 4}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
