import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../api/documents';
import { lookupsApi } from '../../api/lookups';
import type { Doc } from '../../api/types';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Input';
import { useToast } from '../../ui/Toast';

/** Delegate picker (document.can.assign): sets a user on an open slot, e.g. QE-03 reviewers. */
export function AssignDelegate({ doc, onDone }: { doc: Doc; onDone: () => void }) {
  const toast = useToast();
  const users = useQuery({ queryKey: ['lookups', 'users'], queryFn: lookupsApi.users, staleTime: 5 * 60_000 });
  const [choice, setChoice] = useState<Record<string, string>>({});
  const assign = useMutation({
    mutationFn: ({ slot, user }: { slot: string; user: string }) => documentsApi.assign(doc.id, slot, user),
    onSuccess: () => { toast.success('Delegate assigned'); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const open = doc.slots.filter((s) => s.status === 'pending' || s.status === 'waiting');
  if (open.length === 0) return null;
  return (
    <div className="stack">
      <div className="field__label">Assign a delegate</div>
      {open.map((s) => (
        <div key={s.slot_key} className="row">
          <label htmlFor={`as-${s.slot_key}`} style={{ minWidth: '8rem' }}>{s.label}</label>
          <Select id={`as-${s.slot_key}`} value={choice[s.slot_key] ?? ''} onChange={(e) => setChoice({ ...choice, [s.slot_key]: e.target.value })} style={{ flex: 1 }}>
            <option value="">Select user…</option>
            {(users.data?.items ?? []).map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </Select>
          <Button size="sm" disabled={!choice[s.slot_key]} loading={assign.isPending} onClick={() => assign.mutate({ slot: s.slot_key, user: choice[s.slot_key] })}>Assign</Button>
        </div>
      ))}
    </div>
  );
}
