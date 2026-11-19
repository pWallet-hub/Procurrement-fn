import type { AuditEvent } from '../../api/types';
import { formatDateTime } from '../../lib/format';
import { humanize } from '../../ui/StatusBadge';
import { DataTable } from '../../ui/Table';

function detailText(d: unknown): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : JSON.stringify(d);
}

/** Plain-language names for the sign-in events; everything else reads as "Document: signed". */
const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Sign-in failed',
  'auth.logout': 'Signed out',
  'auth.password_changed': 'Changed password',
  'auth.password_set': 'Set password',
  'auth.sso_login': 'Signed in with AFS',
  'auth.sso_link': 'Linked AFS account',
  'auth.sso_provision': 'Account created through AFS',
  'auth.totp_enabled': 'Turned on two-factor sign-in',
};

export function auditActionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]!;
  const [object, ...rest] = action.split('.');
  return rest.length ? `${humanize(object!)}: ${humanize(rest.join(' ')).toLowerCase()}` : humanize(action);
}

export function AuditTable({ events }: { events: AuditEvent[] }) {
  return (
    <DataTable
      rows={events}
      rowKey={(e) => e.id}
      empty="No audit events."
      columns={[
        { header: 'When', cell: (e) => formatDateTime(e.at) },
        { header: 'Who', cell: (e) => e.actor?.full_name ?? 'System' },
        { header: 'What', cell: (e) => <span title={e.action}>{auditActionLabel(e.action)}</span> },
        // System-wide entries (e.g. "audit verified") have no object id.
        { header: 'On', cell: (e) => <span title={e.object_id ?? undefined}>{e.object_type ? humanize(e.object_type) : '—'} {e.object_id && <span className="mono muted">{e.object_id.slice(0, 8)}</span>}</span> },
        { header: 'Detail', cell: (e) => <span className="mono">{detailText(e.detail)}</span> },
      ]}
    />
  );
}
