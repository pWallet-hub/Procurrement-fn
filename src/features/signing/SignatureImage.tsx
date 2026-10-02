import { useEffect, useState, type ReactNode } from 'react';
import { documentsApi } from '../../api/documents';

/** Signature image fetched with the bearer token and shown from an object URL. `fallback` is shown if it cannot be loaded. */
export function SignatureImage({
  documentId,
  slotKey,
  alt,
  className = 'sig-preview',
  fallback = null,
}: {
  documentId: string;
  slotKey: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let made: string | null = null;
    let cancelled = false;
    documentsApi
      .signatureImage(documentId, slotKey)
      .then((b) => {
        if (cancelled) return;
        made = URL.createObjectURL(b);
        setUrl(made);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [documentId, slotKey]);
  if (url) return <img className={className} src={url} alt={alt} />;
  return failed ? <>{fallback}</> : null;
}
