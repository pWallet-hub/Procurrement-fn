import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { Spinner } from '../../ui/Spinner';

/** The signed-in user's saved signature (GET /me/signature as a blob). `version` busts the cache after replace/delete. */
export function SavedSignatureImage({ className = 'sig-preview', version = 0 }: { className?: string; version?: number }) {
  const q = useQuery({ queryKey: ['my-signature', version], queryFn: authApi.signature, staleTime: 60_000, retry: false });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!q.data) return setUrl(null);
    const u = URL.createObjectURL(q.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [q.data]);
  if (q.isLoading) return <Spinner label="Loading signature" />;
  if (q.error || !url) return <span className="muted">Your saved signature could not be loaded.</span>;
  return <img className={className} src={url} alt="Your saved signature" />;
}
