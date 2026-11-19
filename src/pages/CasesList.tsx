import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { formatDate } from '../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { Input, Select } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { DataTable } from '../ui/Table';

const STAGES = ['requisition', 'quotation', 'market_check', 'evaluation', 'purchase_order', 'delivery', 'payment', 'closed', 'cancelled'];
const STATUSES = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Waits until typing pauses before searching, so the list does not reload on every key. */
function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CasesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Filters live in the address bar, so "back" from a case returns to the same filtered list and a filtered view can be shared.
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const stage = params.get('stage') ?? '';
  const [q, setQ] = useState(params.get('q') ?? '');
  const search = useDebounced(q.trim());

  const setParam = (key: string, value: string) =>
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set(key, value); else n.delete(key); return n; }, { replace: true });
  useEffect(() => { if ((params.get('q') ?? '') !== search) setParam('q', search); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = !!(status || stage || search);
  const clearFilters = () => { setQ(''); setParams(new URLSearchParams(), { replace: true }); };
  const canCreate = hasRole(user, ...CASE_CREATOR_ROLES);

  const query = useInfiniteQuery({
    queryKey: ['cases', { status, stage, q: search }],
    queryFn: ({ pageParam }) => casesApi.list({ status, stage, q: search, limit: 20, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
  });
  const rows = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="stack">
      <PageHeader
        title="Procurement cases"
        subtitle="Every purchase from requisition to payment. Open a case to see where it is and what it is waiting for."
        actions={canCreate && <Button variant="primary" onClick={() => navigate('/cases/new')}><Icon name="plus" size={18} /> New case</Button>}
      />

      <div className="list-toolbar" role="search">
        <label className="list-toolbar__search">
          <span className="visually-hidden">Search cases</span>
          <Icon name="search" size={18} />
          <Input type="search" placeholder="Search by request number or project" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="filter-chips" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button key={s.value} type="button" className="filter-chip" aria-pressed={status === s.value} onClick={() => setParam('status', s.value)}>{s.label}</button>
          ))}
        </div>
        <Select aria-label="Stage" value={stage} onChange={(e) => setParam('stage', e.target.value)}>
          <option value="">Any stage</option>
          {STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </Select>
        {filtered && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
        {!query.isLoading && !query.error && (
          <span className="list-toolbar__count" aria-live="polite">
            {rows.length}{query.hasNextPage ? '+' : ''} {rows.length === 1 ? 'case' : 'cases'}
          </span>
        )}
      </div>

      {query.isLoading ? <PageSpinner /> : query.error ? <ErrorState error={query.error} /> : (
        <>
          <DataTable
            rows={rows}
            rowKey={(c) => c.id}
            empty={
              filtered ? (
                <EmptyState title="No cases match these filters" icon="search" action={<Button onClick={clearFilters}>Clear filters</Button>}>
                  Try a different search, status or stage.
                </EmptyState>
              ) : (
                <EmptyState
                  title="No procurement cases yet"
                  icon="folder"
                  action={canCreate && <Button variant="primary" onClick={() => navigate('/cases/new')}><Icon name="plus" size={18} /> Start the first case</Button>}
                >
                  {canCreate ? 'A case starts with a procurement requisition (PR-01) and follows the purchase until it is paid.' : 'Cases you are involved in will appear here.'}
                </EmptyState>
              )
            }
            onRowClick={(c) => navigate(`/cases/${c.id}`)}
            columns={[
              { header: 'Request no', cell: (c) => <Link to={`/cases/${c.id}`} onClick={(e) => e.stopPropagation()}><strong>{c.request_no}</strong></Link> },
              { header: 'Project', cell: (c) => c.project },
              { header: 'Requested by', cell: (c) => c.requested_by.full_name },
              { header: 'Stage', cell: (c) => <StatusBadge status={c.current_stage} /> },
              { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
              { header: 'Required by', cell: (c) => formatDate(c.required_by) },
            ]}
          />
          {query.hasNextPage && <div className="row" style={{ justifyContent: 'center' }}><Button loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Show more cases</Button></div>}
        </>
      )}
    </div>
  );
}
