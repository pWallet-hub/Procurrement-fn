import { Field, fieldAria } from '../../../ui/Field';
import { Textarea } from '../../../ui/Input';
import type { FieldProps } from '../types';
import {
  acceptWithinWordLimit,
  countWords,
  getFieldWordLimit,
  isNotedDetails,
  isPurposeJustification,
} from '../wordLimit';

export function TextareaField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const currentValue = typeof value === 'string' ? value : '';
  const isPurpose = isPurposeJustification(field.label);
  const isNoted = isNotedDetails(field.label);
  const wordLimit = getFieldWordLimit(field.label, field.maxWords);
  const rows = isPurpose
    ? Math.min(6, 2 + Math.floor(countWords(currentValue) / 3))
    : isNoted || inline ? 2 : 4;

  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Textarea
        className={isPurpose ? 'textarea--purpose' : isNoted ? 'textarea--compact' : undefined}
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