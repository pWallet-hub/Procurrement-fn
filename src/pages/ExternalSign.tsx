import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signingApi } from '../api/signing';
import { ApiError } from '../api/client';
import { PublicLayout } from '../layout/PublicLayout';
import { PaperForm } from '../features/paper';
import { SigningPanel } from '../features/signing/SigningPanel';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { PageSpinner } from '../ui/Spinner';

/** /sign/:token - supplier signs the contract without an account. */
export function ExternalSign() {
  const { token = '' } = useParams();
  const [done, setDone] = useState(false);
  const q = useQuery({ queryKey: ['external-sign', token], queryFn: () => signingApi.externalGet(token), retry: false });
  if (q.isLoading) return <PublicLayout><PageSpinner /></PublicLayout>;
  if (q.error || !q.data) {
    const gone = q.error instanceof ApiError && q.error.status === 410;
    return (
      <PublicLayout>
        {gone ? <Alert tone="warning">This signing link has already been used or has expired. If you need a new link, please contact AfS-Rwanda.</Alert> : <ErrorState error={q.error} />}
      </PublicLayout>
    );
  }
  const { document: doc, template, slot, signer_email } = q.data;

  return (
    <PublicLayout wide>
      <div className="public-card">
        <div className="row row--between">
          <div>
            <h1 style={{ marginBottom: 'var(--space-1)' }}>{doc.title}</h1>
            <p className="muted" style={{ margin: 0 }}>Please read the document below, then sign at the bottom of the page. Signing as {signer_email}.</p>
          </div>
          <Button className="no-print" onClick={() => window.print()}><Icon name="print" size={16} /> Print</Button>
        </div>
      </div>
      <PaperForm template={template} doc={doc} data={doc.data} />
      {done ? (
        <Alert tone="success">Thank you. Your signature has been recorded. You can close this page.</Alert>
      ) : (
        <div className="sign-panel">
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
        </div>
      )}
    </PublicLayout>
  );
}
