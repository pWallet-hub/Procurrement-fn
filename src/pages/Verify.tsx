import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signingApi } from '../api/signing';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { PageSpinner } from '../ui/Spinner';

const LABELS: Record<string, string> = {
  content_hash: 'Document content matches the signed fingerprint',
  pdf_hash: 'Stored PDF is unchanged',
  audit_chain: 'Audit trail is intact',
};

/** Public page behind the QR code on the PDF audit page. */
export function Verify() {
  const { documentId = '' } = useParams();
  const q = useQuery({ queryKey: ['verify', documentId], queryFn: () => signingApi.verify(documentId) });
  return (
    <main className="public-page stack">
      <h1>Document verification</h1>
      <p className="mono muted">{documentId}</p>
      {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : q.data && (
        <>
          <Alert tone={q.data.ok ? 'success' : 'error'}>
            {q.data.ok ? 'This document is authentic and has not been altered.' : `Verification failed${q.data.failing ? `: ${q.data.failing}` : '.'}`}
          </Alert>
          <Card title="Checks">
            <ul className="list-plain">
              {Object.entries(q.data.checks).map(([k, ok]) => (
                <li key={k} className="row row--between">
                  <span>{LABELS[k] ?? k}</span>
                  <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Pass' : 'Fail'}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </main>
  );
}
