import { Fragment, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, errorMessage } from '../api/client';
import { downloadBlob } from '../lib/download';
import { casesApi } from '../api/cases';
import type { Case, Stage } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { can, hasRole } from '../auth/permissions';
import { DeliveryForm } from '../features/cases/DeliveryForm';
import { ReasonModal } from '../features/cases/ReasonModal';
import { Stepper } from '../features/cases/Stepper';
import { AuditTable } from '../features/documents/AuditTable';
import { formatDate, formatNumber } from '../lib/format';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';

/** Which document types may be started in each stage (backend enforces the real rule). */
function creatableDocTypes(c: Case): string[] {
  const byStage: Partial<Record<Stage, string[]>> = {
    quotation: ['QC-02'],
    market_check: ['MPV-03'],
    evaluation: ['QE-03'],
    purchase_order: c.contract_required ? ['PO-09', 'CONTRACT'] : ['PO-09'],
    payment: ['PA-04'],
  };
  const wanted = byStage[c.current_stage] ?? [];
  return wanted.filter((t) => !c.documents.some((d) => d.doc_type === t && d.state !== 'cancelled'));
}

export function CaseDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const caseQ = useQuery({ queryKey: ['case', id], queryFn: () => casesApi.get(id) });
  const timeline = useQuery({ queryKey: ['timeline', id], queryFn: () => casesApi.timeline(id) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['case', id] });
    void qc.invalidateQueries({ queryKey: ['timeline', id] });
  };

  const createDoc = useMutation({
    mutationFn: (docType: string) => casesApi.createDocument(id, docType),
    onSuccess: (d) => navigate(`/documents/${d.id}`),
    onError: (e: Error) => toast.error(e.message),
  });
  const patchCase = useMutation({
    mutationFn: (body: { market_check_required?: boolean; contract_required?: boolean }) => casesApi.patch(id, body),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  if (caseQ.isLoading) return <PageSpinner />;
  if (caseQ.error || !caseQ.data) return <ErrorState error={caseQ.error} />;
  const c = caseQ.data;
  const isOpen = c.status === 'open';
  const next = creatableDocTypes(c);

  return (
    <div className="stack">
      <PageHeader
        title={`${c.request_no} - ${c.project}`}
        subtitle={<>Requested by {c.requested_by.full_name} · required by {formatDate(c.required_by)}</>}
        actions={
          <>
            <StatusBadge status={c.status} />
            {c.status === 'closed' && (
              <Button onClick={async () => {
                try { downloadBlob(await casesApi.purchaseFile(id), `${c.request_no}-purchase-file.pdf`); }
                catch (e) { toast.error(e instanceof ApiError && e.status === 404 ? 'The purchase file is not built yet. Try again shortly.' : errorMessage(e)); }
              }}>Download purchase file</Button>
            )}
            {isOpen && can(user, 'case.advance_arrangement') && c.current_stage === 'payment' && !c.advance_arrangement && (
              <Button onClick={() => setAdvanceOpen(true)}>Advance arrangement</Button>
            )}
            {isOpen && (hasRole(user, 'admin', 'accountant') || user?.id === c.requested_by.id) && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel case</Button>
            )}
          </>
        }
      />

      {c.advance_arrangement && <Alert tone="warning">Advance arrangement recorded by CFM: {c.advance_arrangement.reason}</Alert>}

      <Card title="Progress">
        {timeline.isLoading ? <PageSpinner /> : timeline.error ? <ErrorState error={timeline.error} /> : <Stepper stages={timeline.data?.stages ?? []} />}
      </Card>

      <div className="grid-2">
        <Card title="Documents">
          <ul className="list-plain">
            {c.documents.map((d) => (
              <li key={d.id} className="row row--between">
                <Link to={`/documents/${d.id}`}>{d.doc_type} - {d.title} (v{d.version})</Link>
                <StatusBadge status={d.state} />
              </li>
            ))}
            {c.documents.length === 0 && <li className="muted">No documents yet.</li>}
          </ul>
          {isOpen && next.length > 0 && (
            <div className="row" style={{ marginTop: 'var(--space-4)' }}>
              {next.map((t) => (
                <Button key={t} variant="primary" loading={createDoc.isPending && createDoc.variables === t} onClick={() => createDoc.mutate(t)}>
                  Create {t}
                </Button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Next actions">
          <ul className="list-plain">
            {c.next_actions.map((a) => (
              <li key={`${a.document_id}:${a.slot_key}`}>
                <Link to={`/documents/${a.document_id}`}>{a.doc_type}: {a.label}</Link>
                <div className="muted">{humanize(a.role)}{a.assigned_user ? ` · ${a.assigned_user.full_name}` : ''}</div>
              </li>
            ))}
            {c.next_actions.length === 0 && <li className="muted">Nothing is waiting.</li>}
          </ul>
        </Card>
      </div>

      <Card title="Case summary">
        <dl className="kv">
          <dt>Stage</dt><dd>{humanize(c.current_stage)}</dd>
          <dt>Budget line</dt><dd>{c.budget_line?.code ?? '—'}</dd>
          <dt>Selected supplier</dt><dd>{c.selected_supplier?.name ?? '—'}</dd>
          <dt>Approved amount</dt><dd>{c.approved_amount != null ? `${formatNumber(c.approved_amount)} ${c.currency}` : '—'}</dd>
          <dt>Created</dt><dd>{formatDate(c.created_at)}</dd>
          <dt>Closed</dt><dd>{formatDate(c.closed_at)}</dd>
          {c.delivery && Object.entries(c.delivery).map(([k, v]) => (
            <Fragment key={k}><dt>{humanize(k)}</dt><dd>{String(v)}</dd></Fragment>
          ))}
        </dl>
        {isOpen && can(user, 'case.configure') && (
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <label className="choice">
              <input type="checkbox" checked={c.market_check_required} disabled={patchCase.isPending} onChange={(e) => patchCase.mutate({ market_check_required: e.target.checked })} />
              Market check required
            </label>
            <label className="choice">
              <input type="checkbox" checked={c.contract_required} disabled={patchCase.isPending} onChange={(e) => patchCase.mutate({ contract_required: e.target.checked })} />
              Contract required
            </label>
          </div>
        )}
      </Card>

      {isOpen && c.current_stage === 'delivery' && (
        <Card title="Record delivery and invoice">
          <DeliveryForm caseId={c.id} />
        </Card>
      )}

      <Card title="History">
        <AuditTable events={timeline.data?.events ?? []} />
      </Card>

      <ReasonModal
        open={cancelOpen}
        title="Cancel this case"
        confirmLabel="Cancel case"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await casesApi.cancel(id, reason);
          toast.success('Case cancelled');
          refresh();
        }}
      />
      <ReasonModal
        open={advanceOpen}
        title="Advance arrangement"
        confirmLabel="Record"
        onClose={() => setAdvanceOpen(false)}
        onConfirm={async (reason) => {
          await casesApi.advanceArrangement(id, reason);
          toast.success('Advance arrangement recorded');
          refresh();
        }}
      />
    </div>
  );
}
