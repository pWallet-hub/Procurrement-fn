import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signingApi } from '../api/signing';
import { templatesApi } from '../api/templates';
import { FormRenderer } from '../features/forms';
import { SigningPanel } from '../features/signing/SigningPanel';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { PageSpinner } from '../ui/Spinner';
import { humanize } from '../ui/StatusBadge';

function Raw({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="kv">
      {Object.entries(data).map(([k, v]) => (
        <><dt key={`${k}t`}>{humanize(k)}</dt><dd key={`${k}d`}>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</dd></>
      ))}
    </dl>
  );
}

/** /sign/:token - supplier signs the contract without an account. */
export function ExternalSign() {
  const { token = '' } = useParams();
  const [done, setDone] = useState(false);
  const q = useQuery({ queryKey: ['external-sign', token], queryFn: () => signingApi.externalGet(token), retry: false });
  const code = q.data?.document.template.code;
  // Templates may require a login; if so we fall back to a plain key/value view of the data.
  const tpl = useQuery({ queryKey: ['external-template', code], queryFn: () => templatesApi.get(code!, { auth: false }), enabled: !!code, retry: false });

  if (q.isLoading) return <PageSpinner />;
  if (q.error || !q.data) return <main className="public-page"><ErrorState error={q.error} /></main>;
  const { document: doc, slot, signer_email } = q.data;

  return (
    <main className="public-page stack">
      <h1>{doc.title}</h1>
      <p className="muted">Signing as {signer_email}</p>
      <Card title="Document">
        {tpl.data ? (
          <FormRenderer template={tpl.data} data={doc.data} onChange={() => {}} readOnly />
        ) : (
          <Raw data={doc.data} />
        )}
      </Card>
      {done ? (
        <Alert tone="success">Thank you. Your signature has been recorded. You can close this page.</Alert>
      ) : (
        <SigningPanel
          slotLabel={slot.label}
          declaration={slot.declaration}
          contentHash={doc.content_hash}
          requiresConflictConfirmation={tpl.data?.workflow.requires_conflict_confirmation ?? false}
          onSign={(body, key) => signingApi.externalSign(token, body, key)}
          onDone={() => setDone(true)}
        />
      )}
    </main>
  );
}
