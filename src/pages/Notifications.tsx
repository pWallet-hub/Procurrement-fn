import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import type { Notification } from '../api/types';
import { formatDateTime } from '../lib/format';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { humanize } from '../ui/StatusBadge';
import { cx } from '../ui/cx';
import '../styles/notifications.css';

// Payload: {subject, title, message, document_id|null, path|null, vars, in_app}
type Tone = 'info' | 'danger' | 'warning' | 'success' | 'neutral';
type Filter = 'all' | 'unread';

function target(n: Notification): string | null {
  const p = n.payload ?? {};
  if (typeof p.path !== 'string' || !p.path) return null; // SPA route, e.g. /documents/<id>
  return p.path.startsWith('/') ? p.path : `/${p.path}`;
}

function summary(n: Notification): string {
  const p = n.payload ?? {};
  return (
    (typeof p.message === 'string' && p.message) ||
    (typeof p.title === 'string' && p.title) ||
    (typeof p.subject === 'string' && p.subject) ||
    ''
  );
}

// Color + icon follow the meaning of the event, so people can scan by color.
function toneOf(kind: string): Tone {
  const k = kind.toLowerCase();
  if (/(delet|remov|reject|declin|fail|overdue|revok)/.test(k)) return 'danger';
  if (/(reset|expir|remind|pending|warn|due)/.test(k)) return 'warning';
  if (/(approv|complet|sign|success|verif|publish)/.test(k)) return 'success';
  if (/(upload|creat|share|assign|comment|updat|invit)/.test(k)) return 'info';
  return 'neutral';
}

const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const icons = {
  file: I(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>),
  trash: I(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>),
  clock: I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  check: I(<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" /></>),
  bell: I(<><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></>),
};
function iconOf(kind: string): ReactNode {
  const k = kind.toLowerCase();
  if (/(delet|remov)/.test(k)) return icons.trash;
  if (/(reset|expir|remind|due|pending)/.test(k)) return icons.clock;
  if (/(approv|complet|sign|success|verif)/.test(k)) return icons.check;
  if (/(upload|document|file|creat|share)/.test(k)) return icons.file;
  return icons.bell;
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  for (const n of items) {
    const label = dayLabel(n.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}

export function Notifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const read = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh });
  const readAll = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => notificationsApi.markRead(id))),
    onSuccess: refresh,
  });

  const items = q.data?.items ?? [];
  const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
  const shown = filter === 'unread' ? items.filter((n) => !n.read_at) : items;
  const groups = groupByDay(shown);

  return (
    <div className="stack notifs">
      <PageHeader title="Notifications" />

      {q.isLoading ? (
        <PageSpinner />
      ) : q.error ? (
        <ErrorState error={q.error} />
      ) : items.length === 0 ? (
        <EmptyState title="You're all caught up." />
      ) : (
        <>
          <div className="notifs__bar">
            <div className="seg" role="tablist" aria-label="Filter notifications">
              <button role="tab" aria-selected={filter === 'all'} className={cx('seg__tab', filter === 'all' && 'is-on')} onClick={() => setFilter('all')}>
                All
              </button>
              <button role="tab" aria-selected={filter === 'unread'} className={cx('seg__tab', filter === 'unread' && 'is-on')} onClick={() => setFilter('unread')}>
                Unread
                {unreadIds.length > 0 && <span className="seg__count">{unreadIds.length}</span>}
              </button>
            </div>
            <button className="linkbtn" disabled={unreadIds.length === 0 || readAll.isPending} onClick={() => readAll.mutate(unreadIds)}>
              {readAll.isPending ? 'Marking…' : 'Mark all as read'}
            </button>
          </div>

          {groups.length === 0 ? (
            <p className="notifs__none">No unread notifications. Nice work.</p>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="ngroup" aria-label={g.label}>
                <h2 className="ngroup__title">{g.label}</h2>
                <ul className="ncard">
                  {g.items.map((n) => {
                    const to = target(n);
                    const tone = toneOf(n.kind);
                    const unread = !n.read_at;
                    const body = (
                      <>
                        <span className="nrow__title">{humanize(n.kind)}</span>
                        <span className="nrow__text">{summary(n)}</span>
                      </>
                    );
                    return (
                      <li key={n.id} className={cx('nrow', `tone-${tone}`, unread && 'is-unread')}>
                        <span className="nrow__icon">{iconOf(n.kind)}</span>

                        {to ? (
                          <Link className="nrow__body" to={to} onClick={() => unread && read.mutate(n.id)}>
                            {body}
                          </Link>
                        ) : (
                          <div className="nrow__body">{body}</div>
                        )}

                        <div className="nrow__side">
                          <time className="nrow__time" dateTime={n.created_at} title={formatDateTime(n.created_at)}>
                            {ago(n.created_at)}
                          </time>
                          {unread ? (
                            <button className="nrow__read" onClick={() => read.mutate(n.id)} aria-label={`Mark "${humanize(n.kind)}" as read`}>
                              Mark read
                            </button>
                          ) : (
                            <span className="sr-only">Read</span>
                          )}
                        </div>
                        {unread && <span className="sr-only">Unread</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}