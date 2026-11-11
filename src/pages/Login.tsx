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
  cancelled: 'You cancelled sign-in with AFS. Choose the button again when you are ready.',
  expired: 'Your sign-in link expired. Start again.',
  not_assigned: 'Your AFS account does not have access to Procurement yet. Ask your administrator to assign it in AFS Command Center.',
  unknown_role: 'Your Procurement role is not set up yet. Contact an administrator.',
  no_account: 'No Procurement account is linked to this AFS account. Contact an administrator.',
  unverified_email: 'Your AFS email address must be verified before you can sign in. Verify it in AFS, then try again.',
  disabled: 'This account is switched off. Contact an administrator.',
  unavailable: 'AFS sign-in is temporarily unavailable. Try again in a few minutes.',
  token: 'Sign-in with AFS could not be completed. Try again.',
  invalid_token: 'Sign-in with AFS could not be verified. Try again.',
};

/** Email + password, then an optional TOTP step. Shown only when the server offers password sign-in. */
function PasswordForm({ onError }: { onError: (message: string) => void }) {
  const { login, verifyTotp } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError('');
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
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
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
      <Button type="submit" variant="default" size="lg" loading={busy}>
        {challenge ? 'Verify' : 'Sign in with password'}
      </Button>
    </form>
  );
}

/**
 * Sign-in page. AFS single sign-on is the main way in. When the server offers password sign-in (development and any
 * deployment that has not switched it off), the password form sits below the AFS button. A person who already signed
 * in to AFS in this browser is taken straight in, without seeing this page.
 */
export function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const params = new URLSearchParams(location.search);
  const ssoError = params.get('sso_error');
  const [sso, setSso] = useState<{ enabled: boolean; password_login: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState('');

  // Errors come back from AFS as a code. "silent" only means there was no AFS session, which is not an error.
  const ssoMessage = ssoError && ssoError !== 'silent' ? SSO_MESSAGES[ssoError] ?? 'Sign-in with AFS did not work. Try again.' : '';
  const showForm = Boolean(ssoError) || params.has('signed_out') || params.has('password');
  const shownError = formError || ssoMessage;

  useEffect(() => {
    let cancelled = false;
    authApi
      .ssoConfig()
      .then((config) => {
        if (cancelled) return;
        setSso(config);
        if (config.enabled && !showForm) {
          setChecking(true);
          window.location.replace(`${API_BASE}/auth/sso/login?next=${encodeURIComponent(from)}&silent=1`);
        }
      })
      .catch(() => {
        if (!cancelled) setSso({ enabled: false, password_login: true });
      });
    return () => {
      cancelled = true;
    };
    // Runs once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user) return <Navigate to={from} replace />;

  const ssoHref = `${API_BASE}/auth/sso/login?next=${encodeURIComponent(from)}`;

  if (sso === null || checking) {
    return (
      <PublicLayout auth>
        <Card className="auth-card">
          <div className="card__body stack" aria-live="polite">
            <h1 className="auth-card__title">Checking your AFS session</h1>
            <p className="auth-card__sub">If you are already signed in to AFS, you will be taken straight to Procurement.</p>
          </div>
        </Card>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout auth>
      <Card className="auth-card">
        <div className="card__body stack">
          <h1 className="auth-card__title">Sign in</h1>
          <p className="auth-card__sub">
            {sso.password_login ? 'Use your AFS account, or your Procurement password.' : 'Use your AFS account to continue.'}
          </p>

          {shownError && <Alert tone="error">{shownError}</Alert>}

          {sso.enabled && (
            <a className="btn btn--primary btn--lg" href={ssoHref} style={{ width: '100%', justifyContent: 'center' }}>
              Continue with AFS account
            </a>
          )}

          {sso.password_login && (
            <>
              {sso.enabled && (
                <div className="auth-divider" aria-hidden>
                  <span>or sign in with a password</span>
                </div>
              )}
              <PasswordForm onError={setFormError} />
            </>
          )}

          {!shownError && (
            <p className="auth-card__sub" style={{ marginBottom: 0, fontSize: 'var(--text-sm)' }}>
              No access yet? Ask your administrator to assign Procurement to you in AFS Command Center.
            </p>
          )}
        </div>
      </Card>
    </PublicLayout>
  );
}
