import { useEffect } from 'react';
import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import { formatDate, todayIso } from '../../../lib/format';
import type { FieldProps } from '../types';

/**
 * Stored as an ISO date string (empty -> null). Native picker + a "Today" shortcut; the chosen date is also shown as dd/mm/yyyy.
 * A date with default "today" that is still empty when it appears (a section shown by a choice, a date filled at
 * signing) is filled with today's date once; the person can change it or clear it, and a cleared date stays empty.
 * Table cells (inline) are not filled here: new rows already start with today's date (TableField newRow), and several
 * cells filling at once would overwrite each other's row update.
 */
export function DateField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const iso = typeof value === 'string' ? value : '';
  useEffect(() => {
    if (!readOnly && !inline && !iso && field.default === 'today') onChange(todayIso());
    // once, when the field appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
