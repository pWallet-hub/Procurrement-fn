import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import { errorMessage } from '../../../api/client';
import { hasRole, useAuth } from '../../../auth';
import { Alert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Input } from '../../../ui/Input';
import { Modal } from '../../../ui/Modal';
import type { FieldProps } from '../types';
import { RefSelect } from './RefSelect';

/** One of the programs kept in the system (Administration → Programs). Administrators can add a missing one here. */
export function ProgramRefField(props: FieldProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ['lookups', 'programs'], queryFn: lookupsApi.programs, staleTime: 60_000 });
  const options = (q.data?.items ?? []).map((p) => ({ id: p.id, label: p.name }));
  return (
    <>
      <RefSelect props={props} options={options} loading={q.isLoading} />
      {!props.readOnly && hasRole(user, 'admin') && (
        <div><Button size="sm" onClick={() => setCreating(true)}>New program</Button></div>
      )}
      {creating && <NewProgram onClose={() => setCreating(false)} onCreated={(id) => props.onChange(id)} />}
    </>
  );
}

function NewProgram({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const save = useMutation({
    mutationFn: () => lookupsApi.createProgram(name.trim()),
    onSuccess: async (p) => {
      await qc.invalidateQueries({ queryKey: ['lookups', 'programs'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'programs'] });
      onCreated(p.id);
      onClose();
    },
  });
  return (
    <Modal
      open
      title="New program"
      onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={save.isPending} disabled={!name.trim()} onClick={() => save.mutate()}>Create</Button></>}
    >
      <div className="stack">
        <Field id="np-name" label="Program name" required><Input {...fieldAria('np-name')} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {save.error && <Alert tone="error">{errorMessage(save.error)}</Alert>}
      </div>
    </Modal>
  );
}
