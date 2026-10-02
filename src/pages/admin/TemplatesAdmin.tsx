import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { ErrorState } from '../../ui/ErrorState';
import { PageSpinner } from '../../ui/Spinner';
import { DataTable } from '../../ui/Table';

export function TemplatesAdmin() {
  const q = useQuery({ queryKey: ['admin', 'templates'], queryFn: adminApi.templates });
  if (q.isLoading) return <PageSpinner />;
  if (q.error) return <ErrorState error={q.error} />;
  return (
    <DataTable
      rows={q.data?.items ?? []}
      rowKey={(t) => `${t.code}:${t.version}`}
      columns={[
        { header: 'Code', cell: (t) => t.code },
        { header: 'Title', cell: (t) => t.title },
        { header: 'Version', cell: (t) => t.version },
        { header: 'Sections', cell: (t) => t.schema?.sections?.length ?? '—' },
        { header: 'Signature slots', cell: (t) => t.signature_slots?.length ?? '—' },
      ]}
    />
  );
}
