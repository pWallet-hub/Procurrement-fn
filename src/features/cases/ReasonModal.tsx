import { useState } from 'react';
import { errorMessage } from '../../api/client';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Field, fieldAria } from '../../ui/Field';
import { Textarea } from '../../ui/Input';
import { Modal } from '../../ui/Modal';

/** Generic "enter a reason, then confirm" dialog (cancel case, advance arrangement, edit request, cancel doc). */
export function ReasonModal({
  open,
  title,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Back</Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={!reason.trim()} loading={busy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field id="reason" label="Reason" required>
          <Textarea {...fieldAria('reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}
