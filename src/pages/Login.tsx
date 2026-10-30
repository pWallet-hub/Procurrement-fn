import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE, errorMessage } from '../api/client';
import { authApi } from '../api/auth';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PublicLayout } from '../layout/PublicLayout';
import { Field, fieldAria } from '../ui/Field';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';

/** Messages for the codes the API puts in /login?sso_error=... after an AFS sign-in. */
const SSO_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in with AFS was cancelled.',
  expired: 'Your AFS sign-in expired. Please try again.',
  not_assigned: 'Your AFS account is not assigned to Procurement. Contact an administrator.',
  unknown_role: 'Your Procurement role is not set up yet. Contact an administrator.',
  no_account: 'No Procurement account is linked to this AFS account. Contact an administrator.',
  unverified_email: 'Your AFS email address must be verified before it can be linked.',
  disabled: 'This Procurement account is not active. Contact an administrator.',
  unavailable: 'AFS sign-in is temporarily unavailable. Try again shortly.',
};

/**
 * Email + password, then an optional TOTP step when the server answers requires_totp. When AFS single sign-on is
 * enabled, a person who already signed in to AFS in this browser is taken straight in. Otherwise the form is shown.
 */
export function Login() {
  const { user, login, verifyTotp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const params = new URLSearchParams(location.search);
  const ssoCode = params.get('sso_error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .ssoConfig()
      .then(({ enabled }) => {
        if (cancelled) return;
        setSsoEnabled(enabled);
        // Returning from a failed or silent attempt, just signed out, or the password form was asked for: show the form.
        const showForm = Boolean(ssoCode) || params.has('signed_out') || params.has('password');
        if (enabled && !showForm) window.location.replace(`${API_BASE}/auth/sso/login?next=${encodeURIComponent(from)}&silent=1`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (user) return <Navigate to={from} replace />;

  // "silent" means the AFS session was missing, which is not an error: the form is simply shown.
  const ssoMessage = ssoCode && ssoCode !== 'silent' ? SSO_MESSAGES[ssoCode] ?? 'AFS sign-in failed. Please try again.' : null;

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
    <PublicLayout auth>
      <Card className="auth-card">
        <h1 className="auth-card__title">Sign in</h1>
        <p className="auth-card__sub">{challenge ? 'Two-step verification' : 'Use your AfS-Rwanda account to continue.'}</p>
        <form className="stack" onSubmit={submit}>
          {!challenge ? (
            <>
              <Field id="email" label="Email" required>
                <Input {...fieldAria('email')} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field id="password" label="Password" required>
                <PasswordInput {...fieldAria('password')} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
            </>
          ) : (
            <Field id="totp" label="Authenticator code" required help="Enter the 6 digit code from your authenticator app.">
              <Input {...fieldAria('totp', 'Enter the 6 digit code from your authenticator app.')} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus required />
            </Field>
          )}
          {ssoMessage && <Alert tone="error">{ssoMessage}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" variant="primary" size="lg" loading={busy}>
            {challenge ? 'Verify' : 'Sign in'}
          </Button>
        </form>
        {ssoEnabled && !challenge && (
          <div className="stack">
            <p className="auth-card__sub">or</p>
            <a className="btn btn--lg" href={`${API_BASE}/auth/sso/login?next=${encodeURIComponent(from)}`}>
              Sign in with AFS SSO
            </a>
          </div>
        )}
      </Card>
    </PublicLayout>
  );
}
