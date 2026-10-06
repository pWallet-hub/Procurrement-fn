import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import { ApiError, errorMessage } from '../../../api/client';
import type { Currency, FundingSource } from '../../../api/types';
import { can, useAuth } from '../../../auth';
import { formatNumber } from '../../../lib/format';
import { Alert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Input, Select } from '../../../ui/Input';
import { Modal } from '../../../ui/Modal';
import type { FieldProps } from '../types';
import { RefSelect } from './RefSelect';

export function BudgetLineRefField(props: FieldProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ['lookups', 'budget-lines'], queryFn: lookupsApi.budgetLines, staleTime: 60_000 });
  const options = (q.data?.items ?? []).map((b) => ({
    id: b.id,
    label: `${b.code} - ${b.project}${b.funding_source === 'external' ? ` [External: ${b.funder}]` : ''} (${formatNumber(b.available)} ${b.currency} available)`,
  }));
  return (
    <>
      <RefSelect props={props} options={options} loading={q.isLoading} />
      {!props.readOnly && can(user, 'budget.manage') && (
        <div><Button size="sm" onClick={() => setCreating(true)}>New budget line</Button></div>
      )}
      {creating && <NewBudgetLine onClose={() => setCreating(false)} onCreated={(id) => props.onChange(id)} />}
    </>
  );
}

/** Creates a budget line when the one a form needs does not exist yet, then selects it. */
function NewBudgetLine({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState({ code: '', project: '', funding_source: 'internal' as FundingSource, funder: '', baseline: '', currency: 'RWF' });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  const save = useMutation({
    mutationFn: () => lookupsApi.createBudgetLine({ ...v, funder: v.funder || null, baseline: v.baseline === '' ? 0 : Number(v.baseline), currency: v.currency as Currency }),
    onSuccess: async (b) => {
      await qc.invalidateQueries({ queryKey: ['lookups', 'budget-lines'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'budget-lines'] });
      onCreated(b.id);
      onClose();
    },
  });
  const fe = save.error instanceof ApiError ? save.error.fields : {};
  return (
    <Modal
      open
      title="New budget line"
      onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Create</Button></>}
    >
      <div className="stack">
        <Field id="nbl-code" label="Code" required error={fe.code}><Input {...fieldAria('nbl-code')} value={v.code} onChange={set('code')} /></Field>
        <Field id="nbl-project" label="Project" error={fe.project}><Input {...fieldAria('nbl-project')} value={v.project} onChange={set('project')} /></Field>
        <Field id="nbl-source" label="Funding" error={fe.funding_source}>
          <Select {...fieldAria('nbl-source')} value={v.funding_source} onChange={set('funding_source')}>
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </Select>
        </Field>
        {v.funding_source === 'external' && (
          <Field id="nbl-funder" label="Funder / donor" required error={fe.funder}><Input {...fieldAria('nbl-funder')} value={v.funder} onChange={set('funder')} /></Field>
        )}
        <Field id="nbl-baseline" label="Baseline (approved budget)" error={fe.baseline}>
          <Input {...fieldAria('nbl-baseline')} type="number" min={0} value={v.baseline} onChange={set('baseline')} />
        </Field>
        <Field id="nbl-currency" label="Currency" error={fe.currency}>
          <Select {...fieldAria('nbl-currency')} value={v.currency} onChange={set('currency')}>
            {['RWF', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        {save.error && <Alert tone="error">{errorMessage(save.error)}</Alert>}
      </div>
    </Modal>
  );
}
