import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ApiError, errorMessage } from '../../api/client';
import { lookupsApi } from '../../api/lookups';
import { ROLES, type AdminUser } from '../../api/types';
import { Alert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Field, fieldAria } from '../../ui/Field';
import { Input, Select } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { PageSpinner } from '../../ui/Spinner';
import { humanize } from '../../ui/StatusBadge';
import { DataTable } from '../../ui/Table';
import { useToast } from '../../ui/Toast';

const EMPTY = { email: '', full_name: '', position: '', department_id: '', roles: [] as string[] };

function RoleChecks({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field id="roles" group label="Roles">
      {ROLES.map((r) => (
        <label key={r} className="choice">
          <input type="checkbox" checked={value.includes(r)} onChange={(e) => onChange(e.target.checked ? [...value, r] : value.filter((x) => x !== r))} />
          {humanize(r)}
        </label>
      ))}
    </Field>
  );
}

export function UsersAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users });
  const depts = useQuery({ queryKey: ['lookups', 'departments'], queryFn: lookupsApi.departments });
  const [mode, setMode] = useState<null | 'invite' | AdminUser>(null);
  const [form, setForm] = useState(EMPTY);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  const save = useMutation({
    mutationFn: async () => {
      const body = { ...form, department_id: form.department_id || null };
      if (mode === 'invite') return adminApi.createUser(body);
      return adminApi.patchUser((mode as AdminUser).id, { full_name: body.full_name, position: body.position, department_id: body.department_id, roles: body.roles });
    },
    onSuccess: async (res) => {
      toast.success('Saved');
      if (mode === 'invite') setInviteLink((res as { invite_link?: string }).invite_link ?? null);
      setMode(null);
      await refresh();
    },
  });
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => { toast.success('Done'); await refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const fe = save.error instanceof ApiError ? save.error.fields : {};
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  function open(m: 'invite' | AdminUser) {
    save.reset();
    setMode(m);
    setForm(m === 'invite' ? EMPTY : { email: m.email, full_name: m.full_name, position: m.position, department_id: m.department?.id ?? '', roles: m.roles });
  }

  if (users.isLoading) return <PageSpinner />;
  if (users.error) return <ErrorState error={users.error} />;
  return (
    <div className="stack">
      <div><Button variant="primary" onClick={() => open('invite')}>Invite user</Button></div>
      {inviteLink && (
        <Alert tone="success">
          Invite link (shown outside production only): <span className="mono">{inviteLink}</span>
        </Alert>
      )}
      <DataTable
        rows={users.data?.items ?? []}
        rowKey={(u) => u.id}
        columns={[
          { header: 'Name', cell: (u) => u.full_name },
          { header: 'Email', cell: (u) => u.email },
          { header: 'Department', cell: (u) => u.department?.name ?? '—' },
          { header: 'Roles', cell: (u) => u.roles.join(', ') },
          { header: 'Status', cell: (u) => <Badge tone={u.active === false ? 'danger' : 'success'}>{u.active === false ? 'Inactive' : 'Active'}</Badge> },
          {
            header: 'Actions',
            cell: (u) => (
              <div className="row">
                <Button size="sm" onClick={() => open(u)}>Edit</Button>
                <Button size="sm" onClick={() => act.mutate(() => adminApi.patchUser(u.id, { active: u.active === false }))}>{u.active === false ? 'Activate' : 'Deactivate'}</Button>
                <Button size="sm" onClick={() => window.confirm(`Reset password for ${u.email}?`) && act.mutate(() => adminApi.resetPassword(u.id))}>Reset password</Button>
                <Button size="sm" onClick={() => window.confirm(`Reset 2FA for ${u.email}?`) && act.mutate(() => adminApi.resetTotp(u.id))}>Reset 2FA</Button>
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={mode !== null}
        title={mode === 'invite' ? 'Invite user' : 'Edit user'}
        onClose={() => setMode(null)}
        footer={<><Button onClick={() => setMode(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>{mode === 'invite' ? 'Send invite' : 'Save'}</Button></>}
      >
        <div className="stack">
          <Field id="u-email" label="Email" required error={fe.email}>
            <Input {...fieldAria('u-email')} type="email" value={form.email} disabled={mode !== 'invite'} onChange={set('email')} />
          </Field>
          <Field id="u-name" label="Full name" required error={fe.full_name}>
            <Input {...fieldAria('u-name')} value={form.full_name} onChange={set('full_name')} />
          </Field>
          <Field id="u-pos" label="Position" error={fe.position}>
            <Input {...fieldAria('u-pos')} value={form.position} onChange={set('position')} />
          </Field>
          <Field id="u-dept" label="Department" error={fe.department_id}>
            <Select {...fieldAria('u-dept')} value={form.department_id} onChange={set('department_id')}>
              <option value="">None</option>
              {(depts.data?.items ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <RoleChecks value={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
          {fe.roles && <Alert tone="error">{fe.roles}</Alert>}
          {save.error && <Alert tone="error">{errorMessage(save.error)}</Alert>}
        </div>
      </Modal>
    </div>
  );
}
