import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { formatDateTime } from '../lib/format';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataTable } from '../ui/Table';

/** List of standalone documents (GR-06 requests, IM-08 memos) visible to the user. */
export function StandaloneList({ docType, title, basePath }: { docType: string; title: string; basePath: string }) {
  const navigate = useNavigate();
  const q = useInfiniteQuery({
    queryKey: ['documents', { docType }],
    queryFn: ({ pageParam }) => documentsApi.list({ doc_type: docType, limit: 20, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div className="stack">
      <PageHeader title={title} actions={<Button variant="primary" onClick={() => navigate(`${basePath}/new`)}>New</Button>} />
      {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : (
        <>
          <DataTable
            rows={rows}
            rowKey={(d) => d.id}
            empty="Nothing here yet."
            onRowClick={(d) => navigate(`/documents/${d.id}`)}
            columns={[
              { header: 'Title', cell: (d) => <Link to={`/documents/${d.id}`}>{d.title}</Link> },
              { header: 'Number', cell: (d) => d.request_no ?? '—' },
              { header: 'By', cell: (d) => d.created_by.full_name },
              { header: 'State', cell: (d) => <StatusBadge status={d.state} /> },
              { header: 'Updated', cell: (d) => formatDateTime(d.updated_at) },
            ]}
          />
          {q.hasNextPage && <div><Button loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}
