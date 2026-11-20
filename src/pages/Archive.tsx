import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { errorMessage } from '../api/client';
import type { Doc } from '../api/types';
import { downloadBlob } from '../lib/download';
import { formatDate } from '../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { DataTable } from '../ui/Table';
import { useToast } from '../ui/Toast';

/** Groups of forms people look for together; `types` is sent as the doc_type filter. */
const KINDS = [
  { value: '', label: 'All', types: '' },
  { value: 'procurement', label: 'Procurement', types: 'PR-01,QC-02,MPV-03,QE-03,PO-09,CONTRACT,PA-04' },
  { value: 'requests', label: 'Requests (GR-06)', types: 'GR-06' },
  { value: 'memos', label: 'Memos (IM-08)', types: 'IM-08' },
  { value: 'travel', label: 'Travel (TC-10)', types: 'TC-10' },
];

/** Completed = every box signed: the date of the last signature. */
const completedAt = (d: Doc) => {
  const dates = d.slots.map((s) => s.signature?.signed_at).filter((x): x is string => !!x).sort();
  return dates[dates.length - 1] ?? d.updated_at;
};

/** The requester: who signed the first box, or who it was assigned to; the creator otherwise. */
const requester = (d: Doc) => {
  const first = [...d.slots].sort((a, b) => a.seq - b.seq)[0];
  return first?.signature?.signer_name ?? first?.assigned_user?.full_name ?? d.created_by.full_name;
};

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Completed (fully signed) documents of every kind the user may see, with search, a kind filter and the signed PDF. */
export function Archive() {
  const navigate = useNavigate();
  const toast = useToast();
  // filters live in the address bar, so "back" from a document returns to the same filtered list
  const [params, setParams] = useSearchParams();
  const kind = KINDS.find((k) => k.value === (params.get('kind') ?? '')) ?? KINDS[0];
  const [q, setQ] = useState(params.get('q') ?? '');
  const search = useDebounced(q.trim());
  const [downloading, setDownloading] = useState<string | null>(null);

  const setParam = (key: string, value: string) =>
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set(key, value); else n.delete(key); return n; }, { replace: true });
  useEffect(() => { if ((params.get('q') ?? '') !== search) setParam('q', search); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = !!(kind.value || search);
  const clearFilters = () => { setQ(''); setParams(new URLSearchParams(), { replace: true }); };

  const query = useInfiniteQuery({
    queryKey: ['documents', 'archive', { kind: kind.value, q: search }],
    queryFn: ({ pageParam }) => documentsApi.list({ state: 'signed,archived', doc_type: kind.types || undefined, q: search || undefined, limit: 20, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
  });
  const rows = query.data?.pages.flatMap((p) => p.items) ?? [];

  async function downloadPdf(e: MouseEvent, d: Doc) {
    e.stopPropagation();
    setDownloading(d.id);
    try {
      downloadBlob(await documentsApi.pdf(d.id), `${d.request_no ?? d.doc_type}-${d.doc_type}.pdf`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Archive"
        subtitle="Completed documents: every signature collected. Open one to read it, check its authenticity or download the signed PDF."
      />

      <div className="list-toolbar" role="search">
        <label className="list-toolbar__search">
          <span className="visually-hidden">Search the archive</span>
          <Icon name="search" size={18} />
          <Input type="search" placeholder="Search by number, form, title, name or any text in the form" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="filter-chips" role="group" aria-label="Kind of document">
          {KINDS.map((k) => (
            <button key={k.value} type="button" className="filter-chip" aria-pressed={kind.value === k.value} onClick={() => setParam('kind', k.value)}>{k.label}</button>
          ))}
        </div>
        {filtered && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
        {!query.isLoading && !query.error && (
          <span className="list-toolbar__count" aria-live="polite">
            {rows.length}{query.hasNextPage ? '+' : ''} {rows.length === 1 ? 'document' : 'documents'}
          </span>
        )}
      </div>

      {query.isLoading ? <PageSpinner /> : query.error ? <ErrorState error={query.error} /> : (
        <>
          <DataTable
            rows={rows}
            rowKey={(d) => d.id}
            empty={
              filtered ? (
                <EmptyState title="No completed documents match" icon="search" action={<Button onClick={clearFilters}>Clear filters</Button>}>
                  Try another search or kind of document.
                </EmptyState>
              ) : (
                <EmptyState title="The archive is empty" icon="archive">
                  When every signature on a document is collected, it is filed here automatically.
                </EmptyState>
              )
            }
            onRowClick={(d) => navigate(`/documents/${d.id}`)}
            columns={[
              {
                header: 'Document',
                cell: (d) => (
                  <span className="archive-doc">
                    <span className="archive-doc__code">{d.doc_type}</span>
                    <Link to={`/documents/${d.id}`} onClick={(e) => e.stopPropagation()}><strong>{d.title}</strong></Link>
                  </span>
                ),
              },
              { header: 'Number', cell: (d) => d.request_no ?? '—' },
              { header: 'Requested by', cell: (d) => requester(d) },
              { header: 'Completed', cell: (d) => formatDate(completedAt(d)) },
              {
                header: 'Signed PDF',
                cell: (d) => d.pdf_available
                  ? <Button size="sm" loading={downloading === d.id} onClick={(e) => void downloadPdf(e, d)} aria-label={`Download the signed PDF of ${d.doc_type} ${d.request_no ?? ''}`}><Icon name="download" size={16} /> PDF</Button>
                  : <span className="muted">Being prepared</span>,
              },
            ]}
          />
          {query.hasNextPage && <div className="row" style={{ justifyContent: 'center' }}><Button loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Show more</Button></div>}
        </>
      )}
    </div>
  );
}
