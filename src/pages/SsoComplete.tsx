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
 * Where AFS sends the browser back to. The one-time code is exchanged once for a session, then the person continues to
 * the page they asked for. A failed or reused code explains what happened and offers a fresh sign-in.
 */
export function SsoComplete() {
  const { completeSso } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // The code works once. Development builds run effects twice, so only the first run may exchange it.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = params.get('code');
    if (!code) {
      setError('This sign-in link is incomplete. Start again.');
      return;
    }
    const next = safeNext(params.get('next'));
    completeSso(code)
      .then(() => navigate(next, { replace: true }))
      .catch((err) => setError(errorMessage(err)));
    // Runs once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <PublicLayout auth>
        <Card className="auth-card">
          <div className="card__body stack">
            <h1 className="auth-card__title">Sign-in not completed</h1>
            <Alert tone="error">{error}</Alert>
            <p className="auth-card__sub" style={{ marginBottom: 0 }}>
              <Link to="/login">Start again</Link>
            </p>
          </div>
        </Card>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout auth>
      <Card className="auth-card">
        <div className="card__body stack" aria-live="polite">
          <h1 className="auth-card__title">Signing you in</h1>
          <p className="auth-card__sub">Completing sign-in with your AFS account.</p>
        </div>
      </Card>
    </PublicLayout>
  );
}
