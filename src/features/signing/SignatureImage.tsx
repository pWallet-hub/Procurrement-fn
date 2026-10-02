import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents';

/** Signature image fetched with the bearer token and shown from an object URL. */
export function SignatureImage({ documentId, slotKey, alt }: { documentId: string; slotKey: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
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
      .catch(() => {});
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [documentId, slotKey]);
  return url ? <img className="sig-preview" src={url} alt={alt} /> : null;
}
