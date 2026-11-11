import { Field, fieldAria } from '../../../ui/Field';
import { Textarea } from '../../../ui/Input';
import type { FieldProps } from '../types';
import { acceptWithinWordLimit, countWords, getFieldWordLimit, isPurposeJustification } from '../wordLimit';

export function TextareaField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const currentValue = typeof value === 'string' ? value : '';
  const isPurpose = isPurposeJustification(field.label);
  const isNotedDetails = field.label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() === 'noted details';
  const wordLimit = getFieldWordLimit(field.label, field.maxWords);
  const rows = isPurpose
    ? Math.min(6, 2 + Math.floor(countWords(currentValue) / 3))
    : isNotedDetails || inline ? 2 : 4;

  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Textarea
        className={isPurpose ? 'textarea--purpose' : isNotedDetails ? 'textarea--compact' : undefined}
        {...fieldAria(id, field.help, error, required)}
        value={currentValue}
        maxLength={field.maxLength}
        readOnly={readOnly}
        rows={rows}
        title={`Maximum ${wordLimit} words`}
        onChange={(e) => onChange(acceptWithinWordLimit(e.target.value, currentValue, wordLimit))}
      />
    </Field>
  );
}
