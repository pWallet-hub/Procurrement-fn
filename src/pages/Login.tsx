import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field, fieldAria } from '../ui/Field';
import { Input } from '../ui/Input';

/** Email + password, then an optional TOTP step when the server answers requires_totp. */
export function Login() {
  const { user, login, verifyTotp } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (challenge) {
        await verifyTotp(challenge, code.trim());
        navigate(from, { replace: true });
      } else {
        const res = await login(email.trim(), password);
        if (res.kind === 'totp') setChallenge(res.challengeToken);
        else navigate(from, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" title="AfS Rwanda Procurement">
        <form className="stack" onSubmit={submit}>
          {!challenge ? (
            <>
              <Field id="email" label="Email" required>
                <Input {...fieldAria('email')} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field id="password" label="Password" required>
                <Input {...fieldAria('password')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
            </>
          ) : (
            <Field id="totp" label="Authenticator code" required help="Enter the 6 digit code from your authenticator app.">
              <Input {...fieldAria('totp', 'Enter the 6 digit code from your authenticator app.')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus required />
            </Field>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" variant="primary" loading={busy}>
            {challenge ? 'Verify' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
