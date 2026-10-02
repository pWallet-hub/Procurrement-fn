import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError, errorMessage } from '../api/client';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field, fieldAria } from '../ui/Field';
import { Input } from '../ui/Input';

/** /accept-invite?token=... : user sets a password and is signed in. */
export function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [busy, setBusy] = useState(false);

  const mismatch = confirm !== '' && confirm !== password;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    setError(null);
    try {
      await acceptInvite(token, password);
      navigate('/profile', { replace: true }); // offer 2FA enrolment right away
    } catch (err) {
      setError(err as Error);
    } finally {
      setBusy(false);
    }
  }

  const fe = error instanceof ApiError ? error.fields : {};
  return (
    <main className="auth-page">
      <Card className="auth-card" title="Set your password">
        {!token ? (
          <Alert tone="error">This invitation link is missing its token.</Alert>
        ) : (
          <form className="stack" onSubmit={submit}>
            <Field id="pw" label="New password" required error={fe.password}>
              <Input {...fieldAria('pw')} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field id="pw2" label="Confirm password" required error={mismatch ? 'Passwords do not match' : undefined}>
              <Input {...fieldAria('pw2')} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </Field>
            {error && <Alert tone="error">{errorMessage(error)}</Alert>}
            <Button type="submit" variant="primary" loading={busy} disabled={mismatch}>
              Activate account
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
