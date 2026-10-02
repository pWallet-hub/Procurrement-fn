import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit';
import type { AuditFilter } from '../api/types';
import { AuditTable } from '../features/documents/AuditTable';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Field, fieldAria } from '../ui/Field';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';

export function Audit() {
  const [draft, setDraft] = useState<AuditFilter>({});
  const [filter, setFilter] = useState<AuditFilter>({});
  const q = useInfiniteQuery({
    queryKey: ['audit', filter],
    queryFn: ({ pageParam }) => auditApi.list({ ...filter, cursor: pageParam, limit: 50 }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
  });
  const events = q.data?.pages.flatMap((p) => p.items) ?? [];
  const set = (k: keyof AuditFilter) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div className="stack">
      <PageHeader title="Audit log" />
      <form className="grid-2" onSubmit={(e) => { e.preventDefault(); setFilter(draft); }}>
        <Field id="a-case" label="Case id"><Input {...fieldAria('a-case')} value={draft.case_id ?? ''} onChange={set('case_id')} /></Field>
        <Field id="a-actor" label="Actor (user id)"><Input {...fieldAria('a-actor')} value={draft.actor ?? ''} onChange={set('actor')} /></Field>
        <Field id="a-from" label="From"><Input {...fieldAria('a-from')} type="date" value={draft.from ?? ''} onChange={set('from')} /></Field>
        <Field id="a-to" label="To"><Input {...fieldAria('a-to')} type="date" value={draft.to ?? ''} onChange={set('to')} /></Field>
        <div className="row"><Button type="submit" variant="primary">Apply filters</Button></div>
      </form>
      {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : (
        <>
          <AuditTable events={events} />
          {q.hasNextPage && <div><Button loading={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}
