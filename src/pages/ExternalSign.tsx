import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signingApi } from '../api/signing';
import { ApiError } from '../api/client';
import { FormRenderer } from '../features/forms';
import { SigningPanel } from '../features/signing/SigningPanel';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { PageSpinner } from '../ui/Spinner';

/** /sign/:token - supplier signs the contract without an account. */
export function ExternalSign() {
  const { token = '' } = useParams();
  const [done, setDone] = useState(false);
  const q = useQuery({ queryKey: ['external-sign', token], queryFn: () => signingApi.externalGet(token), retry: false });
  if (q.isLoading) return <PageSpinner />;
  if (q.error || !q.data) return <main className="public-page">{q.error instanceof ApiError && q.error.status === 410 ? <Alert tone="warning">This signing link has already been used or has expired.</Alert> : <ErrorState error={q.error} />}</main>;
  const { document: doc, template, slot, signer_email } = q.data;

  return (
    <main className="public-page stack">
      <h1>{doc.title}</h1>
      <p className="muted">Signing as {signer_email}</p>
      <Card title="Document">
        <FormRenderer template={template} data={doc.data} onChange={() => {}} readOnly />
      </Card>
      {done ? (
        <Alert tone="success">Thank you. Your signature has been recorded. You can close this page.</Alert>
      ) : (
        <SigningPanel
          slotLabel={slot.label}
          declaration={slot.declaration}
          contentHash={doc.content_hash}
          requiresConflictConfirmation={template.workflow.requires_conflict_confirmation}
          collectSigner
          defaultName={signer_email}
          onSign={(body, key) => signingApi.externalSign(token, body, key)}
          onDone={() => setDone(true)}
        />
      )}
    </main>
  );
}
