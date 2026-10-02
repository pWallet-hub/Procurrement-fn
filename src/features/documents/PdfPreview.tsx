import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents';
import { errorMessage } from '../../api/client';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { PageSpinner } from '../../ui/Spinner';
import { downloadBlob } from '../../lib/download';

/** Fetches the PDF with the auth header and shows it from a blob URL (an <iframe> cannot send headers). */
export function PdfPreview({ documentId, filename }: { documentId: string; filename: string }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    documentsApi
      .pdf(documentId)
      .then((b) => {
        if (cancelled) return;
        revoked = URL.createObjectURL(b);
        setBlob(b);
        setUrl(revoked);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [documentId]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!url || !blob) return <PageSpinner />;
  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => downloadBlob(blob, filename)}>Download PDF</Button>
      </div>
      <iframe className="pdf-frame" src={url} title="Document PDF preview" />
    </div>
  );
}
