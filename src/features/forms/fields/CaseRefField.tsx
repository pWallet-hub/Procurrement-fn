import { Field } from '../../../ui/Field';
import type { FieldProps } from '../types';

/** Read only value copied from the case (e.g. request number). */
export function CaseRefField({ field, id, value, error, inline }: FieldProps) {
  return (
    <Field id={id} label={field.label} help={field.help} error={error} hideLabel={inline}>
      <output id={id} className="field-readonly-value">
        {value == null || value === '' ? '—' : String(value)}
      </output>
    </Field>
  );
}
