import { useState } from 'react';
import { authApi } from '../api/auth';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field, fieldAria } from '../ui/Field';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { PasswordInput } from '../ui/PasswordInput';
import { MySignature } from '../features/signing/MySignature';

/** Account details + TOTP enrolment (setup -> show secret -> confirm with a code). */
export function Profile() {
  const { user, reloadUser } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 10) return setPwMsg({ tone: 'error', text: 'The new password must be at least 10 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ tone: 'error', text: 'The new passwords do not match.' });
    setBusy(true);
    setPwMsg(null);
    try {
      await authApi.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ tone: 'success', text: 'Password changed. Other devices have been signed out.' });
    } catch (err) {
      setPwMsg({ tone: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader title="My account" />
      <Card title="Details">
        <dl className="kv">
          <dt>Name</dt><dd>{user?.full_name}</dd>
          <dt>Email</dt><dd>{user?.email}</dd>
          <dt>Position</dt><dd>{user?.position}</dd>
          <dt>Department</dt><dd>{user?.department?.name ?? '—'}</dd>
          <dt>Roles</dt><dd>{user?.roles.join(', ')}</dd>
        </dl>
      </Card>
      <MySignature />
      <Card title="Change password">
        <form onSubmit={changePassword} className="stack">
          <Field id="pw-current" label="Current password" required>
            <PasswordInput {...fieldAria('pw-current')} autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </Field>
          <Field id="pw-new" label="New password" help="At least 10 characters." required>
            <PasswordInput {...fieldAria('pw-new')} autoComplete="new-password" minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
          </Field>
          <Field id="pw-confirm" label="Confirm new password" required>
            <PasswordInput {...fieldAria('pw-confirm')} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          </Field>
          {pwMsg && <Alert tone={pwMsg.tone}>{pwMsg.text}</Alert>}
          <Button type="submit" variant="primary" loading={busy}>Change password</Button>
        </form>
      </Card>
      <Card title="Two-factor authentication (TOTP)">
        {user?.totp_enabled ? (
          <Alert tone="success">Two-factor authentication is enabled.</Alert>
        ) : !setup ? (
          <Button variant="primary" loading={busy} onClick={() => run(async () => setSetup(await authApi.totpSetup()))}>
            Set up authenticator app
          </Button>
        ) : (
          <div className="stack">
            <p>Add this account to your authenticator app, then enter the code it shows.</p>
            <div>
              <div className="field__label">Secret</div>
              <div className="hash">{setup.secret}</div>
            </div>
            <div>
              <div className="field__label">otpauth link</div>
              <div className="hash">{setup.otpauth_url}</div>
            </div>
            <Field id="totp-code" label="Code" required>
              <Input {...fieldAria('totp-code')} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
            <Button
              variant="primary"
              loading={busy}
              disabled={code.length < 6}
              onClick={() =>
                run(async () => {
                  await authApi.totpEnable(code.trim());
                  await reloadUser();
                  setSetup(null);
                  setMsg({ tone: 'success', text: 'Two-factor authentication enabled.' });
                })
              }
            >
              Enable
            </Button>
          </div>
        )}
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      </Card>
    </div>
  );
}
