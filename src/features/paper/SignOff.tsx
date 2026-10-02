import type { ReactNode } from 'react';
import type { DocumentSlot, Template } from '../../api/types';
import { SignatureImage } from '../signing/SignatureImage';
import { humanize } from '../../ui/StatusBadge';
import { cx } from '../../ui/cx';
import { paperDate } from './format';

export interface SignOffSlot {
  key: string;
  label: string;
  seq: number;
  status: string;
  assignedTo?: string;
  signer?: string;
  signedAt?: string;
  method?: string;
}

/** Slots of the document, or (draft, before submit) the template's slot definitions as empty boxes. */
export function toSignOffSlots(slots: DocumentSlot[], template: Template): SignOffSlot[] {
  const src: SignOffSlot[] = slots.length
    ? slots.map((s) => ({
        key: s.slot_key,
        label: s.label,
        seq: s.seq,
        status: s.status,
        assignedTo: s.assigned_user?.full_name,
        signer: s.signature?.signer_name,
        signedAt: s.signature?.signed_at,
        method: s.signature?.method,
      }))
    : template.signature_slots.map((s) => ({ key: s.key, label: s.label, seq: s.seq, status: 'unsigned' }));
  return src.sort((a, b) => a.seq - b.seq);
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'Awaiting signature',
  waiting: 'Waiting for an earlier signature',
  declined: 'Declined',
  skipped: 'Not required',
  unsigned: 'Not yet submitted for signing',
};

/** Signature as it appears on the paper: the drawn/uploaded image, or the typed name in a script font. */
export function SignatureMark({ documentId, slot }: { documentId: string; slot: SignOffSlot }) {
  const typed = <span className="pf-typed-sig">{slot.signer}</span>;
  if (slot.method === 'type') return typed;
  return <SignatureImage documentId={documentId} slotKey={slot.key} alt={`Signature of ${slot.signer ?? slot.label}`} className="pf-sig-img" fallback={typed} />;
}

function Line({ label, children, tall }: { label: string; children?: ReactNode; tall?: boolean }) {
  return (
    <div className={cx('pf-sign__line', tall && 'pf-sign__line--tall')}>
      <span className="pf-sign__label">{label}</span>
      <span className="pf-sign__val">{children}</span>
    </div>
  );
}

/** Name / Signature / Date grid, up to three columns per row. */
export function SignOffGrid({ documentId, slots, plain }: { documentId: string; slots: SignOffSlot[]; plain?: boolean }) {
  if (slots.length === 0) return null;
  const cols = Math.min(3, slots.length);
  return (
    <div className={cx('pf-sign', plain && 'pf-sign--plain')} style={{ ['--pf-cols' as string]: cols }}>
      {slots.map((s) => {
        const signed = s.status === 'signed';
        return (
          <div key={s.key} className={cx('pf-sign__cell', !signed && 'pf-sign__cell--open')}>
            <div className="pf-sign__head">{s.label}</div>
            <div className="pf-sign__body">
              <Line label="Name:">{signed ? s.signer : null}</Line>
              <Line label="Signature:" tall>{signed ? <SignatureMark documentId={documentId} slot={s} /> : null}</Line>
              <Line label="Date:">{signed ? paperDate(s.signedAt) : null}</Line>
              {!signed && (
                <div className={cx('pf-sign__status', `pf-sign__status--${s.status}`)}>
                  {STATUS_TEXT[s.status] ?? humanize(s.status)}
                  {s.assignedTo && s.status !== 'unsigned' ? ` - ${s.assignedTo}` : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
