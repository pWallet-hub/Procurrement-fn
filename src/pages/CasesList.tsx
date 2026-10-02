import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { formatDate } from '../lib/format';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Field, fieldAria } from '../ui/Field';
import { Input, Select } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { DataTable } from '../ui/Table';

const STAGES = ['requisition', 'quotation', 'market_check', 'evaluation', 'purchase_order', 'delivery', 'payment', 'closed', 'cancelled'];

export function CasesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [stage, setStage] = useState('');
  const [q, setQ] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['cases', { status, stage, q }],
    queryFn: ({ pageParam }) => casesApi.list({ status, stage, q, limit: 20, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
  });
  const rows = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="stack">
      <PageHeader
        title="Procurement cases"
        actions={hasRole(user, ...CASE_CREATOR_ROLES) && <Button variant="primary" onClick={() => navigate('/cases/new')}>New case</Button>}
      />
      <div className="grid-2">
        <Field id="f-q" label="Search">
          <Input {...fieldAria('f-q')} type="search" placeholder="Request no or project" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Field id="f-status" label="Status">
          <Select {...fieldAria('f-status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
        <Field id="f-stage" label="Stage">
          <Select {...fieldAria('f-stage')} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All</option>
            {STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </Field>
      </div>

      {query.isLoading ? <PageSpinner /> : query.error ? <ErrorState error={query.error} /> : (
        <>
          <DataTable
            rows={rows}
            rowKey={(c) => c.id}
            empty="No cases match."
            onRowClick={(c) => navigate(`/cases/${c.id}`)}
            columns={[
              { header: 'Request no', cell: (c) => <Link to={`/cases/${c.id}`}>{c.request_no}</Link> },
              { header: 'Project', cell: (c) => c.project },
              { header: 'Requested by', cell: (c) => c.requested_by.full_name },
              { header: 'Stage', cell: (c) => humanize(c.current_stage) },
              { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
              { header: 'Required by', cell: (c) => formatDate(c.required_by) },
            ]}
          />
          {query.hasNextPage && <div><Button loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}
