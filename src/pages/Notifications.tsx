import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import type { Notification } from '../api/types';
import { formatDateTime } from '../lib/format';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { humanize } from '../ui/StatusBadge';
import { cx } from '../ui/cx';

// Payload shape is not fixed by the contract: link to a document/case when ids are present.
function target(n: Notification): string | null {
  const p = n.payload ?? {};
  if (typeof p.document_id === 'string') return `/documents/${p.document_id}`;
  if (typeof p.case_id === 'string') return `/cases/${p.case_id}`;
  return null;
}
function summary(n: Notification): string {
  const p = n.payload ?? {};
  return (typeof p.message === 'string' && p.message) || (typeof p.title === 'string' && p.title) || '';
}

export function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });
  const read = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const items = q.data?.items ?? [];
  return (
    <div className="stack">
      <PageHeader title="Notifications" />
      {q.isLoading ? <PageSpinner /> : q.error ? <ErrorState error={q.error} /> : items.length === 0 ? <EmptyState title="No notifications." /> : (
        <ul className="list-plain card">
          {items.map((n) => {
            const to = target(n);
            return (
              <li key={n.id} className={cx('card__body row row--between', !n.read_at && 'is-unread')}>
                <div>
                  <strong>{humanize(n.kind)}</strong> {summary(n)}
                  <div className="muted">{formatDateTime(n.created_at)}</div>
                  {to && <Link to={to}>Open</Link>}
                </div>
                {!n.read_at && <Button size="sm" onClick={() => read.mutate(n.id)}>Mark read</Button>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
