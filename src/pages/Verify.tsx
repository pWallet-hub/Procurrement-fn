import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signingApi } from '../api/signing';
import { PublicLayout } from '../layout/PublicLayout';
import { Badge } from '../ui/Badge';
import { cx } from '../ui/cx';
import { ErrorState } from '../ui/ErrorState';
import { PageSpinner } from '../ui/Spinner';

const LABELS: Record<string, string> = {
  content_hash: 'Document content matches the signed fingerprint',
  pdf_hash: 'Stored PDF is unchanged',
  audit_chain: 'Audit trail is intact',
};

/** Why a verification failed, by the `failing` code the server returns. */
function failure(code?: string): string {
  if (!code) return 'This document could not be verified.';
  if (code === 'content_hash') return 'The document content no longer matches the fingerprint taken when it was signed. Contact the administrator.';
  if (code === 'pdf_hash') return 'The stored PDF does not match the signed fingerprint. The system redraws archived PDFs automatically; try again in a few minutes, and contact the administrator if it persists.';
  if (code === 'pdf_unavailable') return 'The stored PDF could not be read right now (file storage unavailable). The document content itself is checked; try again later.';
  if (code.startsWith('audit_event')) return `The audit trail is broken at entry ${code.split(' ')[1] ?? ''}. Contact the administrator.`;
  if (code.includes('not been submitted')) return 'This document has not been submitted for signing yet, so there is nothing to verify.';
  return `This document could not be verified: ${code}.`;
}

/** Public page behind the QR code on the PDF audit page. */
export function Verify() {
  const { documentId = '' } = useParams();
  const q = useQuery({ queryKey: ['verify', documentId], queryFn: () => signingApi.verify(documentId) });
  return (
    <PublicLayout>
      <div className="public-card stack" style={{ maxWidth: '36rem', margin: '0 auto', width: '100%' }}>
        {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : q.data && (
          <>
            <div className={cx('verify-result', q.data.ok ? 'verify-result--ok' : 'verify-result--fail')}>
              <div className="verify-result__icon" aria-hidden="true">{q.data.ok ? '✓' : '!'}</div>
              <div>
                <h1>{q.data.ok ? 'Document verified' : 'Verification failed'}</h1>
                <p className="muted" style={{ margin: 0 }}>
                  {q.data.ok ? 'This document is authentic and has not been altered since it was signed.' : failure(q.data.failing)}
                </p>
              </div>
            </div>
            <div>
              {Object.entries(q.data.checks).map(([k, ok]) => (
                <div key={k} className="check-row">
                  <span>{LABELS[k] ?? k}</span>
                  <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Pass' : 'Fail'}</Badge>
                </div>
              ))}
            </div>
            <p className="mono muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>Document {documentId}</p>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
