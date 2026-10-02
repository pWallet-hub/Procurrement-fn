import type { AuditEvent } from '../../api/types';
import { formatDateTime } from '../../lib/format';
import { DataTable } from '../../ui/Table';

function detailText(d: unknown): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : JSON.stringify(d);
}

export function AuditTable({ events }: { events: AuditEvent[] }) {
  return (
    <DataTable
      rows={events}
      rowKey={(e) => e.id}
      empty="No audit events."
      columns={[
        { header: 'When', cell: (e) => formatDateTime(e.at) },
        { header: 'Actor', cell: (e) => e.actor?.full_name ?? 'System' },
        { header: 'Action', cell: (e) => e.action },
        { header: 'Object', cell: (e) => `${e.object_type} ${e.object_id.slice(0, 8)}` },
        { header: 'Detail', cell: (e) => <span className="mono">{detailText(e.detail)}</span> },
      ]}
    />
  );
}
