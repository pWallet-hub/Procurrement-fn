import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import { formatDate, todayIso } from '../../../lib/format';
import type { FieldProps } from '../types';

/** Stored as an ISO date string (empty -> null). Native picker + a "Today" shortcut; the chosen date is also shown as dd/mm/yyyy. */
export function DateField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const iso = typeof value === 'string' ? value : '';
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <div className="date-input">
        <Input
          {...fieldAria(id, field.help, error, required)}
          type="date"
          value={iso}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value || null)}
        />
        {!readOnly && (
          <Button size="sm" aria-label={`Set ${field.label} to today`} disabled={iso === todayIso()} onClick={() => onChange(todayIso())}>
            Today
          </Button>
        )}
      </div>
      {!readOnly && <span className="field__help" aria-hidden="true">{iso ? `Shown as ${formatDate(iso)}` : 'Format: dd/mm/yyyy'}</span>}
    </Field>
  );
}
