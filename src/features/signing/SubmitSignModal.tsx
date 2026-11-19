import { useState } from 'react';
import type { SignBody } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../lib/format';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { SignatureInput, type SignatureValue } from './SignatureInput';

/** What the requester's signature adds to the submit call. The server fills in the content hash of what is submitted. */
export type SubmitSignature = Omit<SignBody, 'content_hash'>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** the requester's own box, e.g. "Prepared / Requested by" */
  slotLabel: string;
  declaration: string;
  requiresConflictConfirmation: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (signature: SubmitSignature) => void;
}

/**
 * The requester signs their own box as part of submitting: the request is never sent without it.
 * Same declaration and signature methods as the signing panel (saved, draw, type, upload).
 */
export function SubmitSignModal({ open, onClose, slotLabel, declaration, requiresConflictConfirmation, busy, error, onSubmit }: Props) {
  const { user } = useAuth();
  const hasSaved = !!user?.has_signature;
  const [accepted, setAccepted] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  const ready = accepted && !!signature && (!requiresConflictConfirmation || conflict);

  function submit() {
    if (!ready || !signature) return;
    onSubmit({
      declaration_accepted: true,
      ...(requiresConflictConfirmation ? { conflict_confirmed: conflict } : {}),
      ...signature,
    });
  }

  return (
    <Modal
      open={open}
      title={`Sign & submit: ${slotLabel}`}
      onClose={onClose}
      footer={(
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" disabled={!ready} loading={busy} onClick={submit}>Sign &amp; submit</Button>
        </>
      )}
    >
      <div className="stack">
        <p className="field__help">
          Your signature goes in the <strong>{slotLabel}</strong> box. You are signing the form exactly as it is now; after
          submitting, it is locked and sent to the next signer.
        </p>
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
        <p className="signing-date">Signing date: <strong>{formatDate(new Date().toISOString())}</strong> — recorded automatically when you submit.</p>
        <SignatureInput key={hasSaved ? 'saved' : 'nosaved'} defaultName={user?.full_name} onChange={setSignature} hasSaved={hasSaved} allowSave />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
