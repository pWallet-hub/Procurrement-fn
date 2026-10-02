import { Button } from '../../../ui/Button';
import { Field } from '../../../ui/Field';
import { FieldRenderer } from '../FieldRenderer';
import { isVisible } from '../conditions';
import type { FieldProps } from '../types';

type Row = Record<string, unknown>;

/**
 * Repeating rows. Each cell is rendered by the normal field registry (so any field type works as a
 * column, including computed ones). Error paths look like `items[0].qty`.
 * On phones the table collapses to stacked cards (see forms.css).
 */
export function TableField({ field, path, id, value, onChange, error, errors, readOnly, required, inline, rootData }: FieldProps) {
  const rows: Row[] = Array.isArray(value) ? (value as Row[]) : [];
  const columns = (field.columns ?? []).filter((c) => isVisible(c, rootData));
  const canAdd = !readOnly && (field.max_rows == null || rows.length < field.max_rows);
  const canRemove = !readOnly && rows.length > (field.min_rows ?? 0);

  const setCell = (i: number, key: string, v: unknown) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  return (
    <Field id={id} group label={field.label} help={field.help} error={error} required={required} hideLabel={inline}>
      <div className="table-field">
        {rows.length > 0 && (
          <div className="table-wrap">
            <table className="table table-field__table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {columns.map((c) => (
                    <th key={c.key} scope="col">
                      {c.label}
                    </th>
                  ))}
                  {!readOnly && (
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td data-label="Row">{i + 1}</td>
                    {columns.map((c) => (
                      <td key={c.key} data-label={c.label}>
                        <FieldRenderer
                          field={c}
                          container={row}
                          onChangeKey={(k, v) => setCell(i, k, v)}
                          pathPrefix={`${path}[${i}].`}
                          errors={errors}
                          readOnly={readOnly}
                          rootData={rootData}
                          inline
                        />
                      </td>
                    ))}
                    {!readOnly && (
                      <td>
                        <Button size="sm" variant="ghost" disabled={!canRemove} onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label={`Remove row ${i + 1}`}>
                          Remove
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length === 0 && readOnly && <span className="muted">No rows</span>}
        {!readOnly && (
          <div>
            <Button size="sm" disabled={!canAdd} onClick={() => onChange([...rows, {}])}>
              Add row
            </Button>
            {field.max_rows != null && (
              <span className="muted"> {rows.length}/{field.max_rows} rows</span>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
