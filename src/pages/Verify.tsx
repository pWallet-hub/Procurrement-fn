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
                  {q.data.ok ? 'This document is authentic and has not been altered since it was signed.' : `This document could not be verified${q.data.failing ? `: ${q.data.failing}` : '.'}`}
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
