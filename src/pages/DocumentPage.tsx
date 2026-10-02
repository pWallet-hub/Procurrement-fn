import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, newIdempotencyKey } from '../api/client';
import { documentsApi } from '../api/documents';
import { templatesApi } from '../api/templates';
import type { Doc } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ReasonModal } from '../features/cases/ReasonModal';
import { AuditTable } from '../features/documents/AuditTable';
import { PdfPreview } from '../features/documents/PdfPreview';
import { FormRenderer, SaveIndicator, useDocumentEditor } from '../features/forms';
import { PaperForm } from '../features/paper';
import { SigningPanel } from '../features/signing/SigningPanel';
import { AssignDelegate } from '../features/signing/AssignDelegate';
import { SlotList } from '../features/signing/SlotList';
import { formatDateTime } from '../lib/format';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge } from '../ui/StatusBadge';
import { TabPanel, Tabs } from '../ui/Tabs';
import { useToast } from '../ui/Toast';
import type { Template } from '../api/types';

export function DocumentPage() {
  const { id = '' } = useParams();
  const docQ = useQuery({ queryKey: ['document', id], queryFn: () => documentsApi.get(id) });
  const code = docQ.data?.template.code;
  const tplQ = useQuery({ queryKey: ['template', code], queryFn: () => templatesApi.get(code!), enabled: !!code, staleTime: 5 * 60_000 });

  if (docQ.isLoading) return <PageSpinner />;
  if (docQ.error || !docQ.data) return <ErrorState error={docQ.error} />;
  if (tplQ.isLoading) return <PageSpinner />;
  if (tplQ.error || !tplQ.data) return <ErrorState error={tplQ.error} />;
  // key: remount the editor whenever a new server version/state arrives (submit, revise, sign ...)
  const doc = docQ.data;
  return <DocumentView key={`${doc.id}:${doc.version}:${doc.state}`} doc={doc} template={tplQ.data} />;
}

function DocumentView({ doc, template }: { doc: Doc; template: Template }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const editor = useDocumentEditor(doc, template);
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const submitKey = useRef<string | null>(null);
  // values for fill_at fields, entered while the signing panel is open and sent with the sign call
  const [signData, setSignData] = useState<Record<string, unknown>>({});
  const [signErrors, setSignErrors] = useState<Record<string, string>>({});

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['document', doc.id] });
    void qc.invalidateQueries({ queryKey: ['signing-tasks'] });
    if (doc.case_id) {
      void qc.invalidateQueries({ queryKey: ['case', doc.case_id] });
      void qc.invalidateQueries({ queryKey: ['timeline', doc.case_id] });
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      await editor.flush(); // make sure the server has the latest edits
      submitKey.current ??= newIdempotencyKey();
      return documentsApi.submit(doc.id, submitKey.current);
    },
    onSuccess: async () => {
      submitKey.current = null;
      toast.success('Submitted for signing');
      await refresh();
    },
    onError: (e: Error) => {
      if (!(e instanceof ApiError && e.isNetwork)) submitKey.current = null;
      editor.applyApiError(e); // shows error.fields next to the inputs
      toast.error(e.message);
    },
  });
  const revise = useMutation({
    mutationFn: () => documentsApi.revise(doc.id),
    onSuccess: async () => { toast.success('New draft version created'); await refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSignSlots = doc.can.sign;
  const mySlot = doc.slots.find((s) => canSignSlots.includes(s.slot_key));
  const fillFields = template.schema.sections.flatMap((s) => s.fields).filter((f) => f.fill_at && f.fill_at === mySlot?.slot_key);
  const fillAt = fillFields.length ? mySlot?.slot_key : null;
  const onFormChange = (key: string, value: unknown) => {
    if (fillAt && fillFields.some((f) => f.key === key)) setSignData((d) => ({ ...d, [key]: value }));
    else editor.setField(key, value);
  };
  // People who have something to fill in land on the editable fields; everyone else sees the paper form.
  const needsInput = editor.editable || !!fillAt;
  const [tab, setTab] = useState(needsInput ? 'edit' : 'form');
  const formData = { ...editor.data, ...signData };
  // GR-06 distance control note: help text of travel_category before pi_final_authorization
  const travel = mySlot?.slot_key === 'pi_final_authorization'
    ? template.schema.sections.flatMap((s) => s.fields).find((f) => f.key === 'travel_category')
    : undefined;

  return (
    <div className="stack">
      <PageHeader
        title={doc.title}
        subtitle={
          <span className="doc-meta">
            <StatusBadge status={doc.state} />
            <span>{doc.doc_type} · v{doc.version}</span>
            {doc.request_no && <span>Request {doc.request_no}</span>}
            {doc.case_id && <Link to={`/cases/${doc.case_id}`}>View case</Link>}
            <span>Updated {formatDateTime(doc.updated_at)}</span>
          </span>
        }
        actions={
          <>
            {editor.editable && <SaveIndicator status={editor.status} />}
            {doc.can.submit && <Button variant="primary" loading={submit.isPending} onClick={() => submit.mutate()}>Submit for signing</Button>}
            {doc.can.revise && <Button variant="primary" loading={revise.isPending} onClick={() => revise.mutate()}>Revise</Button>}
            {doc.can.edit_request && <Button onClick={() => setEditReqOpen(true)}>Request edit</Button>}
            {doc.can.cancel && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel</Button>}
          </>
        }
      />

      {doc.state === 'returned' && doc.returned_reason && <Alert tone="warning">Returned: {doc.returned_reason}</Alert>}
      {(doc.state === 'signed' || doc.state === 'archived') && (
        <Alert tone="success">
          This document is complete. <Link to={`/verify/${doc.id}`}>Verify authenticity</Link>
        </Alert>
      )}

      <div className="doc-toolbar">
        <Tabs
          tabs={[
            { id: 'form', label: 'Form' },
            ...(needsInput ? [{ id: 'edit', label: 'Edit fields' }] : []),
            ...(doc.pdf_available ? [{ id: 'pdf', label: 'PDF' }] : []),
            { id: 'audit', label: 'Audit trail' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === 'form' && <Button size="sm" onClick={() => window.print()}><Icon name="print" size={16} /> Print</Button>}
      </div>

      {(tab === 'form' || tab === 'edit') && (
        <div className="doc-layout">
          <div className="doc-layout__main">
            {tab === 'form' ? (
              <PaperForm template={template} doc={doc} data={formData} />
            ) : (
              <Card>
                <FormRenderer
                  template={template}
                  data={formData}
                  onChange={onFormChange}
                  errors={{ ...editor.errors, ...signErrors }}
                  fillAt={fillAt}
                  readOnly={!editor.editable}
                  caseId={doc.case_id}
                  documentId={doc.id}
                />
              </Card>
            )}
          </div>
          <aside className="doc-layout__aside" aria-label="Signatures">
            {mySlot && (
              <SigningPanel
                slotLabel={mySlot.label}
                declaration={mySlot.declaration}
                contentHash={doc.content_hash}
                requiresConflictConfirmation={template.workflow.requires_conflict_confirmation}
                defaultName={user?.full_name}
                onSign={(body, key) => documentsApi.sign(doc.id, mySlot.slot_key, body, key)}
                onDecline={doc.can.decline.includes(mySlot.slot_key) ? (reason) => documentsApi.decline(doc.id, mySlot.slot_key, reason) : undefined}
                onDone={() => { toast.success('Signed. Thank you.'); void refresh(); }}
                data={fillAt ? pickKeys(signData, fillFields.map((f) => f.key)) : undefined}
                notice={travel?.help ? <Alert tone="warning">{travel.help}</Alert> : undefined}
                onError={(e) => { if (e instanceof ApiError) setSignErrors(e.fields); }}
              />
            )}
            <Card title="Signatures">
              <SlotList slots={doc.slots} documentId={doc.id} />
              {doc.can.assign && <div style={{ marginTop: 'var(--space-4)' }}><AssignDelegate doc={doc} onDone={refresh} /></div>}
            </Card>
          </aside>
        </div>
      )}
      {tab === 'pdf' && <TabPanel><PdfPreview documentId={doc.id} filename={`${doc.request_no ?? doc.doc_type}-${doc.doc_type}.pdf`} /></TabPanel>}
      {tab === 'audit' && <TabPanel><AuditTab documentId={doc.id} /></TabPanel>}

      <ReasonModal
        open={editReqOpen}
        title="Request edit (voids collected signatures)"
        confirmLabel="Request edit"
        onClose={() => setEditReqOpen(false)}
        onConfirm={async (reason) => {
          await documentsApi.editRequest(doc.id, reason);
          await refresh();
        }}
      />
      <ReasonModal
        open={cancelOpen}
        title="Cancel document"
        confirmLabel="Cancel document"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await documentsApi.cancel(doc.id, reason);
          toast.success('Document cancelled');
          if (doc.case_id) navigate(`/cases/${doc.case_id}`);
          else await refresh();
        }}
      />
    </div>
  );
}

function AuditTab({ documentId }: { documentId: string }) {
  const q = useQuery({ queryKey: ['document-audit', documentId], queryFn: () => documentsApi.audit(documentId) });
  if (q.isLoading) return <PageSpinner />;
  if (q.error) return <ErrorState error={q.error} />;
  return <AuditTable events={q.data?.items ?? []} />;
}

function pickKeys(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
}
