import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, newIdempotencyKey } from '../api/client';
import { documentsApi } from '../api/documents';
import { templatesApi } from '../api/templates';
import type { Doc } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/permissions';
import { ReasonModal } from '../features/cases/ReasonModal';
import { AuditTable } from '../features/documents/AuditTable';
import { PdfPreview } from '../features/documents/PdfPreview';
import { FormRenderer, SaveIndicator, useDocumentEditor } from '../features/forms';
import { SigningPanel } from '../features/signing/SigningPanel';
import { SlotList } from '../features/signing/SlotList';
import { formatDateTime } from '../lib/format';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
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
  const [tab, setTab] = useState('document');
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const submitKey = useRef<string | null>(null);

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
  const isCreator = user?.id === doc.created_by.id;
  // the contract has no can.edit_request flag: creator or accountant while in_signing (see README)
  const canEditRequest = doc.state === 'in_signing' && (isCreator || hasRole(user, 'accountant'));

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
            {canEditRequest && <Button onClick={() => setEditReqOpen(true)}>Request edit</Button>}
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

      <Tabs
        tabs={[
          { id: 'document', label: 'Document' },
          ...(doc.pdf_available ? [{ id: 'pdf', label: 'PDF' }] : []),
          { id: 'audit', label: 'Audit trail' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'document' && (
        <div className="doc-layout">
          <Card>
            <FormRenderer
              template={template}
              data={editor.data}
              onChange={editor.setField}
              errors={editor.errors}
              readOnly={!editor.editable}
              caseId={doc.case_id}
              documentId={doc.id}
            />
          </Card>
          <aside className="stack" aria-label="Signatures">
            {mySlot && (
              <SigningPanel
                slotLabel={mySlot.label}
                declaration={mySlot.declaration}
                contentHash={doc.content_hash}
                requiresConflictConfirmation={template.workflow.requires_conflict_confirmation}
                defaultName={user?.full_name}
                onSign={(body, key) => documentsApi.sign(doc.id, mySlot.slot_key, body, key)}
                onDecline={doc.can.decline.includes(mySlot.slot_key) ? (reason) => documentsApi.decline(doc.id, mySlot.slot_key, reason) : undefined}
                onDone={refresh}
              />
            )}
            <Card title="Signatures">
              <SlotList slots={doc.slots} />
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
