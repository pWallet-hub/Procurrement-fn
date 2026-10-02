import { Field, fieldAria } from '../../../ui/Field';
import { Select } from '../../../ui/Input';
import type { FieldProps } from '../types';

export interface RefOption {
  id: string;
  label: string;
}

/** Shared picker used by user_ref / supplier_ref / budget_line_ref. Stores the selected uuid. */
export function RefSelect({
  props: { field, id, value, onChange, error, readOnly, required, inline },
  options,
  loading,
}: {
  props: FieldProps;
  options: RefOption[];
  loading: boolean;
}) {
  const current = typeof value === 'string' ? value : '';
  // keep an existing value visible even if the lookup list does not (yet) contain it
  const missing = current && !options.some((o) => o.id === current);
  return (
    <Field id={id} label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <Select
        {...fieldAria(id, field.help, error, required)}
        value={current}
        disabled={readOnly || loading}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{loading ? 'Loading…' : 'Select…'}</option>
        {missing && <option value={current}>{current}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
