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

/** Account details + TOTP enrolment (setup -> show secret -> confirm with a code). */
export function Profile() {
  const { user, reloadUser } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

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
