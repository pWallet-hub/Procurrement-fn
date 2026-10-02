import { useQuery } from '@tanstack/react-query';
import { reportsApi, type ReportName } from '../api/reports';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { humanize } from '../ui/StatusBadge';
import { Table } from '../ui/Table';

const REPORTS: Array<{ name: ReportName; title: string }> = [
  { name: 'open-cases', title: 'Open cases' },
  { name: 'cycle-time', title: 'Cycle time' },
  { name: 'spend', title: 'Spend' },
];

function cell(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'object') return 'amount' in (v as object) ? `${(v as { amount: number }).amount} ${(v as { currency?: string }).currency ?? ''}` : JSON.stringify(v);
  return String(v);
}

/** Row shape is not fixed by the contract, so columns come from the keys of the rows. */
function ReportTable({ name }: { name: ReportName }) {
  const q = useQuery({ queryKey: ['report', name], queryFn: () => reportsApi.get(name) });
  if (q.isLoading) return <PageSpinner />;
  if (q.error) return <ErrorState error={q.error} />;
  const rows = q.data?.rows ?? [];
  if (rows.length === 0) return <EmptyState title="No data." />;
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return (
    <Table>
      <thead><tr>{cols.map((c) => <th key={c} scope="col">{humanize(c)}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{cell(r[c])}</td>)}</tr>)}</tbody>
    </Table>
  );
}

export function Reports() {
  return (
    <div className="stack">
      <PageHeader title="Reports" />
      {REPORTS.map((r) => (
        <Card key={r.name} title={r.title}><ReportTable name={r.name} /></Card>
      ))}
    </div>
  );
}
