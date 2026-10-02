import { Field } from '../../../ui/Field';
import type { FieldProps } from '../types';

/** Stored as boolean; null until the user picks. */
export function YesNoField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  return (
    <Field id={id} group label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <div className="row">
        <label className="choice">
          <input type="radio" name={id} checked={value === true} disabled={readOnly} onChange={() => onChange(true)} />
          Yes
        </label>
        <label className="choice">
          <input type="radio" name={id} checked={value === false} disabled={readOnly} onChange={() => onChange(false)} />
          No
        </label>
      </div>
    </Field>
  );
}
