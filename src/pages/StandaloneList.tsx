import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { formatDateTime } from '../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge } from '../ui/StatusBadge';
import { DataTable } from '../ui/Table';

/** List of standalone documents (GR-06 requests, IM-08 memos, TC-10 travel clearances) visible to the user. */
export function StandaloneList({ docType, title, basePath, noun }: { docType: string; title: string; basePath: string; /** "request", "memo"... */ noun: string }) {
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
      <PageHeader
        title={title}
        subtitle={`${docType} forms you started or that are waiting for you.`}
        actions={<Button variant="primary" onClick={() => navigate(`${basePath}/new`)}><Icon name="plus" size={18} /> New {noun}</Button>}
      />
      {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : (
        <>
          <DataTable
            rows={rows}
            rowKey={(d) => d.id}
            empty={
              <EmptyState
                title={`No ${noun}s yet`}
                action={<Button variant="primary" onClick={() => navigate(`${basePath}/new`)}><Icon name="plus" size={18} /> Create a {noun}</Button>}
              >
                {`When you create a ${noun} (${docType}) or someone asks you to sign one, it will appear here.`}
              </EmptyState>
            }
            onRowClick={(d) => navigate(`/documents/${d.id}`)}
            columns={[
              { header: 'Title', cell: (d) => <Link to={`/documents/${d.id}`} onClick={(e) => e.stopPropagation()}><strong>{d.title}</strong></Link> },
              { header: 'Number', cell: (d) => d.request_no ?? '—' },
              { header: 'Created by', cell: (d) => d.created_by.full_name },
              { header: 'Status', cell: (d) => <StatusBadge status={d.state} /> },
              { header: 'Updated', cell: (d) => formatDateTime(d.updated_at) },
            ]}
          />
          {q.hasNextPage && <div><Button loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Show more</Button></div>}
        </>
      )}
    </div>
  );
}
