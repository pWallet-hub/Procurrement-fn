import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { PublicLayout } from '../layout/PublicLayout';

/** Only same-site paths. Anything else goes to the home page. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/';
}

/**
 * Where the API sends the browser after an AFS sign-in. The one-time code is exchanged once for a session, then the
 * person continues to the page they asked for. A failed or reused code shows a message and a way back to sign-in.
 */
export function SsoComplete() {
  const { completeSso } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // The code works once. Strict Mode runs effects twice in development, so only the first run may exchange it.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get('code');
    if (!code) {
      setError('This sign-in link is incomplete. Sign in again.');
      return;
    }
    const next = safeNext(params.get('next'));
    completeSso(code)
      .then(() => navigate(next, { replace: true }))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <PublicLayout auth>
      <Card className="auth-card">
        <h1 className="auth-card__title">{error ? 'Sign-in not completed' : 'Signing you in'}</h1>
        {error ? (
          <>
            <Alert tone="error">{error}</Alert>
            <p className="auth-card__sub">
              <Link to="/login">Back to sign-in</Link>
            </p>
          </>
        ) : (
          <p className="auth-card__sub">Using your AFS account.</p>
        )}
      </Card>
    </PublicLayout>
  );
}
