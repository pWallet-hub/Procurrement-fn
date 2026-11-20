import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import type { TravellerOption } from '../../../api/types';
import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Select } from '../../../ui/Input';
import { FieldRenderer } from '../FieldRenderer';
import type { FieldProps } from '../types';

type Row = Record<string, unknown>;

const NEW_EXTERNAL = '__new_external__';
const ID_LABEL: Record<string, string> = { rwanda_national_id: 'ID', passport: 'Passport' };

/** Saved details of a traveller as a row (empty values left out, so nothing typed is wiped). */
function rowFrom(o: TravellerOption): Row {
  const row: Row = { traveller_type: o.traveller_type, id_type: o.id_type ?? 'rwanda_national_id' };
  if (o.traveller_type === 'external') row.name = o.name; else row.staff = o.staff;
  for (const k of ['id_number', 'account_number', 'function'] as const) if (o[k]) row[k] = o[k];
  if (o.traveller_type === 'external' && o.email) row.email = o.email;
  return row;
}

const optionKey = (o: TravellerOption) => (o.traveller_type === 'external' ? `ext:${o.id_type}:${o.id_number}` : `staff:${o.staff}`);
const optionLabel = (o: TravellerOption) =>
  o.traveller_type === 'external'
    ? `${o.name} — external${o.id_number ? `, ${ID_LABEL[o.id_type ?? ''] ?? 'ID'} ${o.id_number}` : ''}`
    : `${o.name}${o.function ? ` (${o.function})` : ''}${o.id_number ? '' : ' — no saved details yet'}`;

/**
 * TC-10 travellers. Pick a staff member or a saved external traveller and their ID, account number and function are
 * filled in from their last clearance; or add someone new. Each traveller gets their own clearance at submit.
 * Rows are the template's table rows, so validation messages point at the same paths (`travellers[1].id_number`).
 */
export function TravellersField({ field, path, id, value, onChange, error, errors, readOnly, required, rootData }: FieldProps) {
  const rows: Row[] = Array.isArray(value) ? (value as Row[]) : [];
  const q = useQuery({ queryKey: ['lookups', 'travellers'], queryFn: lookupsApi.travellers, staleTime: 60_000, enabled: !readOnly });
  const options = q.data?.items ?? [];
  const [pick, setPick] = useState('');
  const columns = field.columns ?? [];
  const canAdd = !readOnly && (field.max_rows == null || rows.length < field.max_rows);
  const canRemove = !readOnly && rows.length > (field.min_rows ?? 0);
  const listed = new Set(rows.map((r) => (r.traveller_type === 'external' ? `ext:${r.id_type}:${r.id_number}` : `staff:${r.staff}`)));

  const add = (key: string) => {
    setPick('');
    if (!key) return;
    if (key === NEW_EXTERNAL) return onChange([...rows, { traveller_type: 'external', id_type: 'passport' }]);
    const o = options.find((x) => optionKey(x) === key);
    if (o) onChange([...rows, rowFrom(o)]);
  };

  const setCell = (i: number, key: string, v: unknown) => {
    let row: Row = { ...rows[i], [key]: v };
    // picking a staff member fills their saved details
    if (key === 'staff' && typeof v === 'string') {
      const o = options.find((x) => x.traveller_type === 'internal_afs_staff' && x.staff === v);
      if (o) row = { ...row, ...rowFrom(o) };
    }
    if (key === 'traveller_type') row = { traveller_type: v, id_type: v === 'external' ? 'passport' : 'rwanda_national_id' };
    onChange(rows.map((r, idx) => (idx === i ? row : r)));
  };

  return (
    <Field id={id} group label={field.label} help={field.help} error={error} required={required}>
      <div className="travellers">
        {rows.map((row, i) => {
          const name = row.traveller_type === 'external'
            ? (row.name as string) || 'New external traveller'
            : options.find((o) => o.staff === row.staff)?.name ?? 'Staff member';
          return (
            <section key={i} className="traveller-card" aria-label={`Traveller ${i + 1}`}>
              <header className="traveller-card__head">
                <span className="traveller-card__num">{i + 1}</span>
                <strong>{name}</strong>
                {!readOnly && (
                  <Button size="sm" variant="ghost" disabled={!canRemove} onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label={`Remove traveller ${i + 1}`}>
                    Remove
                  </Button>
                )}
              </header>
              <div className="form-section__fields">
                {columns.map((c) => (
                  <FieldRenderer
                    key={c.key}
                    field={c}
                    container={row}
                    onChangeKey={(k, v) => setCell(i, k, v)}
                    pathPrefix={`${path}[${i}].`}
                    errors={errors}
                    readOnly={readOnly}
                    rootData={{ ...rootData, ...row }}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {rows.length === 0 && readOnly && <span className="muted">No travellers</span>}
        {canAdd && (
          <div className="travellers__add">
            <label htmlFor={`${id}-add`} className="travellers__add-label">Add a traveller</label>
            <Select {...fieldAria(`${id}-add`)} id={`${id}-add`} value={pick} disabled={q.isLoading} onChange={(e) => add(e.target.value)}>
              <option value="">{q.isLoading ? 'Loading…' : 'Choose a person…'}</option>
              <option value={NEW_EXTERNAL}>+ New external traveller</option>
              <optgroup label="AfS staff">
                {options.filter((o) => o.traveller_type !== 'external' && !listed.has(optionKey(o))).map((o) => (
                  <option key={optionKey(o)} value={optionKey(o)}>{optionLabel(o)}</option>
                ))}
              </optgroup>
              {options.some((o) => o.traveller_type === 'external') && (
                <optgroup label="Saved external travellers">
                  {options.filter((o) => o.traveller_type === 'external' && !listed.has(optionKey(o))).map((o) => (
                    <option key={optionKey(o)} value={optionKey(o)}>{optionLabel(o)}</option>
                  ))}
                </optgroup>
              )}
            </Select>
            <span className="muted">
              {rows.length} {rows.length === 1 ? 'traveller' : 'travellers'}: {rows.length === 1 ? 'one clearance' : `${rows.length} clearances, one each`} at submit.
            </span>
          </div>
        )}
      </div>
    </Field>
  );
}
