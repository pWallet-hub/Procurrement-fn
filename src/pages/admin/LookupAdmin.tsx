import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import type { BudgetLine } from '../../api/types';
import { formatNumber } from '../../lib/format';
import { ApiError, errorMessage } from '../../api/client';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Field, fieldAria } from '../../ui/Field';
import { Input, Select } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { PageSpinner } from '../../ui/Spinner';
import { DataTable } from '../../ui/Table';
import { useToast } from '../../ui/Toast';

interface FieldSpec {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'select';
  options?: { value: string; label: string }[];
  /** value for a new row */
  initial?: string;
  /** shown only when this returns true for the values being edited */
  showIf?: (values: Record<string, string>) => boolean;
  /** cannot be changed after creation */
  createOnly?: boolean;
}

interface CrudProps<T extends { id: string }> {
  title: string;
  queryKey: string;
  list: () => Promise<{ items: T[] }>;
  create: (body: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  fields: FieldSpec[];
  /** extra read-only list columns (e.g. budget used) */
  extraColumns?: { header: string; cell: (row: T) => string }[];
}

const cellText = (f: FieldSpec, v: unknown) =>
  v == null ? '' : f.type === 'number' ? formatNumber(Number(v)) : f.options?.find((o) => o.value === v)?.label ?? String(v);

/** Generic list + create/edit modal used for departments, budget lines and suppliers. */
function Crud<T extends { id: string }>({ title, queryKey, list, create, update, fields, extraColumns = [] }: CrudProps<T>) {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['admin', queryKey], queryFn: list });
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.createOnly && editing !== 'new') continue;
        body[f.key] = f.type === 'number' ? (values[f.key] === '' ? null : Number(values[f.key])) : values[f.key] ?? '';
      }
      return editing === 'new' ? create(body) : update((editing as T).id, body);
    },
    onSuccess: async () => {
      toast.success('Saved');
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['admin', queryKey] });
      void qc.invalidateQueries({ queryKey: ['lookups'] });
    },
  });
  const fe = save.error instanceof ApiError ? save.error.fields : {};

  function open(row: T | 'new') {
    save.reset();
    setEditing(row);
    setValues(Object.fromEntries(fields.map((f) => [f.key, row === 'new' ? f.initial ?? '' : String((row as Record<string, unknown>)[f.key] ?? '')])));
  }

  if (q.isLoading) return <PageSpinner />;
  if (q.error) return <ErrorState error={q.error} />;
  return (
    <div className="stack">
      <div><Button variant="primary" onClick={() => open('new')}>Add {title}</Button></div>
      <DataTable
        rows={q.data?.items ?? []}
        rowKey={(r) => r.id}
        columns={[
          ...fields.map((f) => ({ header: f.label, cell: (r: T) => cellText(f, (r as Record<string, unknown>)[f.key]) })),
          ...extraColumns,
          { header: '', cell: (r: T) => <Button size="sm" onClick={() => open(r)}>Edit</Button> },
        ]}
      />
      <Modal
        open={editing !== null}
        title={editing === 'new' ? `Add ${title}` : `Edit ${title}`}
        onClose={() => setEditing(null)}
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}
      >
        <div className="stack">
          {fields.filter((f) => !f.showIf || f.showIf(values)).map((f) => (
            <Field key={f.key} id={`crud-${f.key}`} label={f.label} error={fe[f.key]}>
              {f.type === 'select' ? (
                <Select {...fieldAria(`crud-${f.key}`)} value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              ) : (
                <Input
                  {...fieldAria(`crud-${f.key}`)}
                  type={f.type ?? 'text'}
                  value={values[f.key] ?? ''}
                  disabled={f.createOnly && editing !== 'new'}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
          {save.error && <Alert tone="error">{errorMessage(save.error)}</Alert>}
        </div>
      </Modal>
    </div>
  );
}

export const DepartmentsAdmin = () => (
  <Crud title="department" queryKey="departments" list={adminApi.departments} create={adminApi.createDepartment} update={adminApi.patchDepartment} fields={[{ key: 'name', label: 'Name' }]} />
);

const CURRENCY_OPTIONS = ['RWF', 'USD', 'EUR'].map((c) => ({ value: c, label: c }));
const BUDGET_FIELDS: FieldSpec[] = [
  { key: 'code', label: 'Code', createOnly: true },
  { key: 'project', label: 'Project' },
  { key: 'funding_source', label: 'Funding', type: 'select', initial: 'internal', options: [{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }] },
  { key: 'funder', label: 'Funder / donor', showIf: (v) => v.funding_source === 'external' },
  { key: 'baseline', label: 'Baseline', type: 'number' },
  { key: 'available', label: 'Available', type: 'number' },
  { key: 'currency', label: 'Currency', type: 'select', initial: 'RWF', options: CURRENCY_OPTIONS },
];

export const BudgetLinesAdmin = () => (
  <Crud
    title="budget line"
    queryKey="budget-lines"
    list={adminApi.budgetLines}
    create={adminApi.createBudgetLine}
    update={adminApi.patchBudgetLine}
    fields={BUDGET_FIELDS}
    extraColumns={[{ header: 'Used', cell: (b: BudgetLine) => formatNumber(b.baseline - b.available) }]}
  />
);

export const SuppliersAdmin = () => (
  <Crud
    title="supplier"
    queryKey="suppliers"
    list={adminApi.suppliers}
    create={adminApi.createSupplier}
    update={adminApi.patchSupplier}
    fields={[
      { key: 'name', label: 'Name' },
      { key: 'tin_or_reg_no', label: 'TIN / registration no' },
      { key: 'contact_person', label: 'Contact person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address' },
    ]}
  />
);
