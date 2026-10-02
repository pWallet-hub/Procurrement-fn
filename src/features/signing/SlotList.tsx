import type { DocumentSlot } from '../../api/types';
import { formatDateTime } from '../../lib/format';
import { SignatureImage } from './SignatureImage';
import { cx } from '../../ui/cx';
import { StatusBadge, humanize } from '../../ui/StatusBadge';

/** Signature chain: one entry per slot, ordered by seq, with status and signer. className hooks: .slot-list .slot .slot--<status> */
export function SlotList({ slots, documentId }: { slots: DocumentSlot[]; documentId: string }) {
  const sorted = [...slots].sort((a, b) => a.seq - b.seq);
  if (sorted.length === 0) return <p className="muted">No signature slots yet. They are created when the document is submitted.</p>;
  return (
    <ol className="slot-list">
      {sorted.map((s) => (
        <li key={s.slot_key} className={cx('slot', `slot--${s.status}`)}>
          <div className="slot__head">
            <strong>{s.label}</strong>
            <StatusBadge status={s.status} />
          </div>
          <div className="muted">
            {humanize(s.role_code)} · step {s.seq}
            {s.group ? ` (parallel: ${s.group})` : ''}
          </div>
          {s.assigned_user && <div>Assigned to {s.assigned_user.full_name}</div>}
          {s.signature && (
            <div>
              <div>
                Signed by {s.signature.signer_name} on {formatDateTime(s.signature.signed_at)} ({s.signature.method})
              </div>
              {s.signature.method !== 'type' && <SignatureImage documentId={documentId} slotKey={s.slot_key} alt={`Signature of ${s.signature.signer_name}`} />}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
