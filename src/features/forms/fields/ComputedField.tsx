import { Field } from '../../../ui/Field';
import { formatMoney, formatNumber } from '../../../lib/format';
import type { FieldProps } from '../types';

/** Display only; the server fills the value on each autosave. */
export function ComputedField({ field, id, value, error, required, inline }: FieldProps) {
  let text = '—';
  if (value && typeof value === 'object' && 'amount' in value) text = formatMoney(value as never);
  else if (typeof value === 'number') text = formatNumber(value);
  else if (typeof value === 'string' && value) text = value;
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <output id={id} className="field-readonly-value">
        {text}
      </output>
    </Field>
  );
}
