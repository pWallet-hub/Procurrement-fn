import { useRef, useState, type ReactNode } from 'react';
import { ApiError, errorMessage, newIdempotencyKey } from '../../api/client';
import type { SignBody } from '../../api/types';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field, fieldAria } from '../../ui/Field';
import { Modal } from '../../ui/Modal';
import { Input, Textarea } from '../../ui/Input';
import { SignatureInput, type SignatureValue } from './SignatureInput';

interface Props {
  slotLabel: string;
  declaration: string;
  contentHash: string | null;
  /** from template.workflow.requires_conflict_confirmation */
  requiresConflictConfirmation: boolean;
  defaultName?: string;
  /** performs the API call; the same idempotency key is reused until it succeeds */
  onSign: (body: SignBody, idempotencyKey: string) => Promise<unknown>;
  /** omitted for external signers when decline is not supported */
  onDecline?: (reason: string) => Promise<unknown>;
  onDone?: () => void;
  /** values for fields with fill_at === this slot (sent as body.data) */
  data?: Record<string, unknown>;
  /** shown above the declaration (e.g. distance control note) */
  notice?: ReactNode;
  /** external signer: ask for name (required) and position */
  collectSigner?: boolean;
  /** called with the raw error so the page can show error.fields next to inputs */
  onError?: (e: unknown) => void;
}

/** Declaration + (conflict) confirmation + signature + sign/decline for one slot. */
export function SigningPanel({ slotLabel, declaration, contentHash, requiresConflictConfirmation, defaultName, onSign, onDecline, onDone, data, notice, collectSigner, onError }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [signerName, setSignerName] = useState(defaultName ?? '');
  const [signerPosition, setSignerPosition] = useState('');
  const idemKey = useRef<string | null>(null);

  const ready = accepted && !!signature && !!contentHash && (!requiresConflictConfirmation || conflict) && (!collectSigner || !!signerName.trim());

  async function sign() {
    if (!ready || !signature || !contentHash) return;
    setBusy(true);
    setError(null);
    idemKey.current ??= newIdempotencyKey(); // reused on retry so a double click cannot sign twice
    try {
      await onSign(
        {
          content_hash: contentHash,
          declaration_accepted: true,
          ...(requiresConflictConfirmation ? { conflict_confirmed: conflict } : {}),
          ...signature,
          ...(data && Object.keys(data).length ? { data } : {}),
          ...(collectSigner ? { signer_name: signerName.trim(), ...(signerPosition.trim() ? { signer_position: signerPosition.trim() } : {}) } : {}),
        },
        idemKey.current,
      );
      idemKey.current = null;
      onDone?.();
    } catch (e) {
      if (!(e instanceof ApiError && e.isNetwork)) idemKey.current = null; // real rejection: new attempt, new key
      setError(errorMessage(e));
      onError?.(e);
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (!onDecline) return;
    setBusy(true);
    setError(null);
    try {
      await onDecline(reason.trim());
      setDeclineOpen(false);
      onDone?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={`Sign: ${slotLabel}`}>
      <div className="stack">
        {notice}
        {collectSigner && (
          <>
            <Field id="signer-name" label="Your full name" required>
              <Input {...fieldAria('signer-name')} value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            </Field>
            <Field id="signer-pos" label="Position">
              <Input {...fieldAria('signer-pos')} value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} />
            </Field>
          </>
        )}
        <div>
          <div className="field__label">Document fingerprint (SHA-256)</div>
          <div className="hash" data-testid="content-hash">
            {contentHash ?? 'Not available yet'}
          </div>
          <p className="field__help">You are signing exactly this version of the document.</p>
        </div>

        <label className="choice">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>{declaration}</span>
        </label>

        {requiresConflictConfirmation && (
          <label className="choice">
            <input type="checkbox" checked={conflict} onChange={(e) => setConflict(e.target.checked)} />
            <span>I confirm that I have no conflict of interest with any supplier on this document.</span>
          </label>
        )}

        <SignatureInput defaultName={defaultName} onChange={setSignature} />

        {error && <Alert tone="error">{error}</Alert>}

        <div className="row">
          <Button variant="primary" disabled={!ready} loading={busy} onClick={sign}>
            Sign
          </Button>
          {onDecline && (
            <Button variant="danger" disabled={busy} onClick={() => setDeclineOpen(true)}>
              Decline
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={declineOpen}
        title="Decline to sign"
        onClose={() => setDeclineOpen(false)}
        footer={
          <>
            <Button onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={!reason.trim()} loading={busy} onClick={decline}>
              Decline
            </Button>
          </>
        }
      >
        <Field id="decline-reason" label="Reason (required)" required>
          <Textarea {...fieldAria('decline-reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </Modal>
    </Card>
  );
}
