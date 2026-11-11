import { useEffect, useMemo, useRef, useState } from 'react';
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
import '../../styles/UsersAdmin.css';

const EMPTY = { email: '', full_name: '', position: '', department_id: '', roles: [] as string[] };
const MAX_ROLE_CHIPS = 2;

/** Roles as a grid of selectable tiles. Still a real checkbox group underneath. */
function RoleChecks({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field id="roles" group label="Roles">
      <div className="ua-rolegrid">
        {ROLES.map((r) => {
          const on = value.includes(r);
          return (
            <label key={r} className={`ua-roletile${on ? ' is-on' : ''}`}>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onChange(e.target.checked ? [...value, r] : value.filter((x) => x !== r))}
              />
              <span className="ua-roletile__box" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.2 5 8.6l4.5-5" />
                </svg>
              </span>
              <span className="ua-roletile__label">{humanize(r)}</span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Role chips: the first few by name, the rest folded into "+N" (full list on hover). */
function RoleChips({ roles }: { roles: string[] }) {
  if (!roles.length) return <span className="ua-muted">No roles</span>;
  const shown = roles.slice(0, MAX_ROLE_CHIPS);
  const rest = roles.slice(MAX_ROLE_CHIPS);
  return (
    <div className="ua-roles">
      {shown.map((r) => <span key={r} className="ua-role">{humanize(r)}</span>)}
      {rest.length > 0 && <span className="ua-role ua-role--more" title={rest.map(humanize).join(', ')}>+{rest.length}</span>}
    </div>
  );
}

interface MenuItem {
  label: string;
  onSelect: () => void;
  tone?: 'danger';
  hidden?: boolean;
}

/** Small "more actions" menu. Fixed-positioned so the table's horizontal scroll never clips it. */
function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); trigger.current?.focus(); }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !trigger.current?.contains(t)) close();
    };
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = trigger.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  return (
    <>
      <button ref={trigger} type="button" className="btn btn--sm btn--ghost ua-more" aria-label={label} aria-haspopup="menu" aria-expanded={!!pos} onClick={toggle}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" /></svg>
      </button>
      {pos && (
        <div ref={menu} className="ua-menu" role="menu" style={{ top: pos.top, right: pos.right }}>
          {visible.map((i) => (
            <button key={i.label} type="button" role="menuitem" className={`ua-menu__item${i.tone === 'danger' ? ' ua-menu__item--danger' : ''}`} onClick={() => { setPos(null); i.onSelect(); }}>
              {i.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function UsersAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users });
  const depts = useQuery({ queryKey: ['lookups', 'departments'], queryFn: lookupsApi.departments });
  const [mode, setMode] = useState<null | 'invite' | AdminUser>(null);
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  const save = useMutation({
    mutationFn: async () => {
      const body = { ...form, department_id: form.department_id || null };
      if (mode === 'invite') return adminApi.createUser(body);
      return adminApi.patchUser((mode as AdminUser).id, { full_name: body.full_name, position: body.position, department_id: body.department_id, roles: body.roles });
    },
    onSuccess: async () => {
      toast.success(mode === 'invite' ? 'User created; invitation email queued' : 'Saved');
      setMode(null);
      await refresh();
    },
  });
  const act = useMutation({
    mutationFn: (action: { run: () => Promise<unknown>; successMessage: string }) => action.run(),
    onSuccess: async (_result, action) => { toast.success(action.successMessage); await refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const fe = save.error instanceof ApiError ? save.error.fields : {};
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  function open(m: 'invite' | AdminUser) {
    save.reset();
    setMode(m);
    setForm(m === 'invite' ? EMPTY : { email: m.email, full_name: m.full_name, position: m.position, department_id: m.department?.id ?? '', roles: m.roles });
  }

  const all = users.data?.items ?? [];
  const activeCount = all.filter((u) => u.active !== false).length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((u) => [u.full_name, u.email, u.position, u.department?.name, ...u.roles.map(humanize)].some((v) => v?.toLowerCase().includes(q)));
  }, [all, query]);

  const editing = mode !== null && mode !== 'invite' ? mode : null;

  if (users.isLoading) return <PageSpinner />;
  if (users.error) return <ErrorState error={users.error} />;
  return (
    <div className="stack ua">
      <div className="ua-toolbar">
        <div className="ua-toolbar__lead">
          <Input
            type="search"
            className="ua-search"
            aria-label="Search users"
            placeholder="Search by name, email or role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="ua-summary" aria-live="polite">
            {query ? `${rows.length} of ${all.length} users` : `${all.length} users, ${activeCount} active`}
          </p>
        </div>
        <Button variant="primary" onClick={() => open('invite')}>Invite user</Button>
      </div>

      {rows.length === 0 ? (
        <div className="ua-empty">
          <strong>No users match “{query}”.</strong>
          <span>Check the spelling, or search by email or role instead.</span>
          <Button size="sm" onClick={() => setQuery('')}>Clear search</Button>
        </div>
      ) : (
        <DataTable
          rows={rows}
          rowKey={(u) => u.id}
          columns={[
            {
              header: 'User',
              cell: (u) => (
                <div className={`ua-user${u.active === false ? ' ua-user--inactive' : ''}`}>
                  <span className="ua-avatar" aria-hidden="true">{initials(u.full_name)}</span>
                  <div className="ua-user__text">
                    <span className="ua-user__name">{u.full_name}</span>
                    <span className="ua-user__email">{u.email}</span>
                  </div>
                </div>
              ),
            },
            { header: 'Department', cell: (u) => u.department?.name ?? <span className="ua-muted">None</span> },
            { header: 'Roles', cell: (u) => <RoleChips roles={u.roles} /> },
            { header: 'Status', cell: (u) => <Badge tone={u.active === false ? 'danger' : 'success'}>{u.active === false ? 'Inactive' : 'Active'}</Badge> },
            {
              header: 'Actions',
              cell: (u) => (
                <div className="ua-actions">
                  <Button size="sm" onClick={() => open(u)}>Edit</Button>
                  <RowMenu
                    label={`More actions for ${u.full_name}`}
                    items={[
                      {
                        label: u.active === false ? 'Activate user' : 'Deactivate user',
                        tone: u.active === false ? undefined : 'danger',
                        onSelect: () => act.mutate({ run: () => adminApi.patchUser(u.id, { active: u.active === false }), successMessage: 'User status updated' }),
                      },
                      {
                        label: 'Resend invite',
                        hidden: !!u.has_password,
                        onSelect: () => window.confirm(`Send a new invite to ${u.email}? The old invite link will stop working.`) && act.mutate({ run: () => adminApi.resendInvite(u.id), successMessage: 'Invite email queued' }),
                      },
                      {
                        label: 'Reset password',
                        onSelect: () => window.confirm(`Reset password for ${u.email}?`) && act.mutate({ run: () => adminApi.resetPassword(u.id), successMessage: 'Password reset email queued' }),
                      },
                      {
                        label: 'Reset 2FA',
                        onSelect: () => window.confirm(`Reset 2FA for ${u.email}?`) && act.mutate({ run: () => adminApi.resetTotp(u.id), successMessage: '2FA reset' }),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={mode !== null}
        title={mode === 'invite' ? 'Invite user' : 'Edit user'}
        onClose={() => setMode(null)}
        footer={<><Button onClick={() => setMode(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>{mode === 'invite' ? 'Send invite' : 'Save changes'}</Button></>}
      >
        <div className="ua-form">
          {editing && (
            <div className="ua-identity">
              <span className="ua-avatar ua-avatar--lg" aria-hidden="true">{initials(form.full_name || form.email)}</span>
              <div className="ua-identity__text">
                <span className="ua-identity__name">{form.full_name || 'Unnamed user'}</span>
                <span className="ua-identity__email">{form.email}</span>
              </div>
              <Badge tone={editing.active === false ? 'danger' : 'success'}>{editing.active === false ? 'Inactive' : 'Active'}</Badge>
            </div>
          )}

          <section className="ua-section" aria-label="Profile">
            {mode === 'invite' && (
              <Field id="u-email" label="Email" required error={fe.email}>
                <Input {...fieldAria('u-email')} type="email" placeholder="name@company.com" value={form.email} onChange={set('email')} />
              </Field>
            )}
            <div className="ua-grid2">
              <Field id="u-name" label="Full name" required error={fe.full_name}>
                <Input {...fieldAria('u-name')} value={form.full_name} onChange={set('full_name')} />
              </Field>
              <Field id="u-pos" label="Position" error={fe.position}>
                <Input {...fieldAria('u-pos')} value={form.position} onChange={set('position')} />
              </Field>
            </div>
            <Field id="u-dept" label="Department" error={fe.department_id}>
              <Select {...fieldAria('u-dept')} value={form.department_id} onChange={set('department_id')}>
                <option value="">None</option>
                {(depts.data?.items ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          </section>

          <section className="ua-section ua-section--divided" aria-label="Roles">
            <RoleChecks value={form.roles} onChange={(roles) => setForm({ ...form, roles })} />
            <p className="ua-hint" aria-live="polite">
              {form.roles.length === 0 ? 'No roles selected' : `${form.roles.length} selected`}
            </p>
            {fe.roles && <Alert tone="error">{fe.roles}</Alert>}
          </section>

          {save.error && <Alert tone="error">{errorMessage(save.error)}</Alert>}
        </div>
      </Modal>
    </div>
  );
}