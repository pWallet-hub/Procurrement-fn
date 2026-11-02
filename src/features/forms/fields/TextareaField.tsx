import { Field, fieldAria } from '../../../ui/Field';
import { Textarea } from '../../../ui/Input';
import type { FieldProps } from '../types';
import { acceptWithinWordLimit, DEFAULT_TEXTAREA_WORD_LIMIT } from '../wordLimit';

export function TextareaField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const currentValue = typeof value === 'string' ? value : '';
  const wordLimit = field.maxWords ?? DEFAULT_TEXTAREA_WORD_LIMIT;

  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Textarea
        {...fieldAria(id, field.help, error, required)}
        value={currentValue}
        maxLength={field.maxLength}
        readOnly={readOnly}
        rows={inline ? 2 : 4}
        title={field.maxWords ? `Maximum ${field.maxWords} words` : `Maximum ${wordLimit} words`}
        onChange={(e) => onChange(acceptWithinWordLimit(e.target.value, currentValue, wordLimit))}
      />
    </Field>
  );
}
