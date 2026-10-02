import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../api/documents';
import { lookupsApi } from '../../api/lookups';
import type { Doc } from '../../api/types';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Input';
import { useToast } from '../../ui/Toast';

/** Compact 'Reassign signer' section (document.can.assign): sets a delegate on an open slot, e.g. QE-03 reviewers. */
export function AssignDelegate({ doc, onDone }: { doc: Doc; onDone: () => void }) {
  const toast = useToast();
  const users = useQuery({ queryKey: ['lookups', 'users'], queryFn: lookupsApi.users, staleTime: 5 * 60_000 });
  const [choice, setChoice] = useState<Record<string, string>>({});
  const assign = useMutation({
    mutationFn: ({ slot, user }: { slot: string; user: string }) => documentsApi.assign(doc.id, slot, user),
    onSuccess: () => { toast.success('Signer reassigned'); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  // only slots that can still be signed can be reassigned
  const open = doc.slots.filter((s) => s.status === 'pending' || s.status === 'waiting');
  if (open.length === 0) return null;
  const busySlot = assign.isPending ? assign.variables?.slot : undefined;
  return (
    <details className="collapse">
      <summary>Reassign signer</summary>
      <div className="collapse__body">
        <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Choose someone else to sign a step that is still open.</p>
        {open.map((s) => (
          <div key={s.slot_key} className="reassign-row">
            <label htmlFor={`as-${s.slot_key}`} className="field__label">
              {s.label}
              {s.assigned_user && <span className="muted" style={{ fontWeight: 400 }}> (now: {s.assigned_user.full_name})</span>}
            </label>
            <div className="reassign-row__ctl">
              <Select id={`as-${s.slot_key}`} value={choice[s.slot_key] ?? ''} onChange={(e) => setChoice({ ...choice, [s.slot_key]: e.target.value })}>
                <option value="">Select person…</option>
                {(users.data?.items ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </Select>
              <Button size="sm" disabled={!choice[s.slot_key]} loading={busySlot === s.slot_key} onClick={() => assign.mutate({ slot: s.slot_key, user: choice[s.slot_key] })}>Assign</Button>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
