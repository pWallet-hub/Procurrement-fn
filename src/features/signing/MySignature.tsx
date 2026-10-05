import { useState } from 'react';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { useToast } from '../../ui/Toast';
import { SavedSignatureImage } from './SavedSignatureImage';
import { SignatureInput, type SignatureValue } from './SignatureInput';

/** Profile card "My signature": show the saved signature, replace it (draw or upload) or delete it. */
export function MySignature() {
  const { user, reloadUser } = useAuth();
  const toast = useToast();
  const has = !!user?.has_signature;
  const [editing, setEditing] = useState(!has);
  const [value, setValue] = useState<SignatureValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reloadUser();
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="My signature">
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>Save your signature once, then sign documents with a single click. Past signatures never change if you replace it.</p>
        {has && !editing && (
          <>
            <div className="saved-sig"><SavedSignatureImage className="saved-sig__img" version={version} /></div>
            <div className="row">
              <Button onClick={() => { setValue(null); setEditing(true); }}>Replace</Button>
              <Button variant="danger" loading={busy} onClick={() => run(async () => { await authApi.deleteSignature(); toast.success('Saved signature deleted'); setEditing(true); })}>Delete</Button>
            </div>
          </>
        )}
        {editing && (
          <>
            <SignatureInput onlyImages onChange={setValue} />
            <div className="row">
              <Button
                variant="primary"
                disabled={!value?.signature_image}
                loading={busy}
                onClick={() => run(async () => { await authApi.saveSignature(value!.signature_image!); toast.success('Signature saved'); setEditing(false); setValue(null); })}
              >
                Save signature
              </Button>
              {has && <Button onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Card>
  );
}
