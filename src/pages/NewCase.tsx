import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, errorMessage } from '../api/client';
import { casesApi } from '../api/cases';
import { lookupsApi } from '../api/lookups';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field, fieldAria } from '../ui/Field';
import { Input, Select } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';

/** Creates a case + PR-01 draft, then opens the PR-01 document to fill in the rest. */
export function NewCase() {
  const navigate = useNavigate();
  const budgets = useQuery({ queryKey: ['lookups', 'budget-lines'], queryFn: lookupsApi.budgetLines });
  const [project, setProject] = useState('');
  const [budgetLineId, setBudgetLineId] = useState('');
  const [requiredBy, setRequiredBy] = useState('');

  const create = useMutation({
    mutationFn: () =>
      casesApi.create({
        project: project.trim() || undefined,
        budget_line_id: budgetLineId || undefined,
        required_by: requiredBy || undefined,
      }),
    onSuccess: (c) => {
      const pr = c.documents.find((d) => d.doc_type === 'PR-01') ?? c.documents[0];
      navigate(pr ? `/documents/${pr.id}` : `/cases/${c.id}`);
    },
  });
  const fe = create.error instanceof ApiError ? create.error.fields : {};

  return (
    <div className="stack">
      <PageHeader title="New procurement case" subtitle="Starts a case and a draft Procurement Requisition (PR-01)." />
      <Card>
        <form
          className="stack"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field id="nc-project" label="Project / activity" error={fe.project}>
            <Input {...fieldAria('nc-project')} value={project} onChange={(e) => setProject(e.target.value)} />
          </Field>
          <Field id="nc-budget" label="Budget line" error={fe.budget_line_id}>
            <Select {...fieldAria('nc-budget')} value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)}>
              <option value="">{budgets.isLoading ? 'Loading…' : 'Select…'}</option>
              {(budgets.data?.items ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.code} - {b.project}</option>
              ))}
            </Select>
          </Field>
          <Field id="nc-req" label="Required by" error={fe.required_by}>
            <Input {...fieldAria('nc-req')} type="date" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} />
          </Field>
          {create.error && <Alert tone="error">{errorMessage(create.error)}</Alert>}
          <div className="row">
            <Button type="submit" variant="primary" loading={create.isPending}>Create case</Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
