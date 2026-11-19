import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { systemApi } from '../../api/system';
import { formatAge, formatDate } from '../../lib/format';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ErrorState } from '../../ui/ErrorState';
import { Icon, type IconName } from '../../ui/Icon';
import { PageSpinner } from '../../ui/Spinner';
import { StatusBadge, humanize } from '../../ui/StatusBadge';
import { useToast } from '../../ui/Toast';
import { cx } from '../../ui/cx';

function Tile({ value, label, tone, to, icon }: { value: number; label: string; tone: 'ok' | 'warn' | 'bad'; to?: string; icon: IconName }) {
  const body = (
    <>
      <span className="ov-tile__icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <span className="ov-tile__value">{value.toLocaleString()}</span>
      <span className="ov-tile__label">{label}</span>
    </>
  );
  const cls = cx('ov-tile', `ov-tile--${tone}`);
  if (!to) return <div className={cls}>{body}</div>;
  // "#section" jumps within this page; anything else is another page
  return to.startsWith('#') ? <a href={to} className={cls}>{body}</a> : <Link to={to} className={cls}>{body}</Link>;
}

/** A card listing items that need attention; says "All clear" when there are none. */
function Section<T>({ title, hint, total, items, clear, actions, render }: {
  title: string; hint: string; total: number; items: T[]; clear: string; actions?: ReactNode; render: (item: T) => ReactNode;
}) {
  return (
    <Card title={<>{title} {total > 0 && <span className="ov-count">{total}</span>}</>} actions={actions}>
      <p className="muted ov-hint">{hint}</p>
      {items.length === 0 ? (
        <p className="ov-clear"><Icon name="check" size={16} /> {clear}</p>
      ) : (
        <ul className="ov-list">{items.map(render)}</ul>
      )}
      {total > items.length && <p className="muted ov-more">Showing the {items.length} oldest of {total}.</p>}
    </Card>
  );
}

/** Administration > Overview: what needs an administrator's attention, with the fix one click away. */
export function AdminOverview() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['system-overview'], queryFn: systemApi.overview, refetchInterval: 120_000 });
  const health = useQuery({ queryKey: ['system-health'], queryFn: systemApi.health, staleTime: 60_000 });
  const refresh = () => void qc.invalidateQueries({ queryKey: ['system-overview'] });

  const remind = useMutation({
    mutationFn: systemApi.remind,
    onSuccess: (r) => toast.success(`Reminder sent to ${r.sent} ${r.sent === 1 ? 'person' : 'people'}`),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const retry = useMutation({
    mutationFn: systemApi.retryFailedEmails,
    onSuccess: (r) => { toast.success(r.retried ? `${r.retried} email(s) sent again` : 'No failed emails to retry'); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (q.isLoading) return <PageSpinner />;
  if (q.error || !q.data) return <ErrorState error={q.error} />;
  const o = q.data;
  const setupGaps = [
    o.setup.departments === 0 && { to: '/admin/departments', text: 'Add your departments' },
    o.setup.budget_lines === 0 && { to: '/admin/budget-lines', text: 'Add at least one active budget line (cases need one)' },
    o.setup.suppliers === 0 && { to: '/admin/suppliers', text: 'Add the suppliers you buy from' },
  ].filter(Boolean) as { to: string; text: string }[];
  const problems = health.data?.checks.filter((c) => c.status === 'error' || c.status === 'warning') ?? [];

  return (
    <div className="stack">
      {problems.length > 0 && (
        <Link to="/admin/system" className={cx('ov-alert', health.data?.status === 'error' && 'ov-alert--bad')}>
          <Icon name="alert" size={20} />
          <span><strong>{health.data?.status === 'error' ? 'Part of the system is not working' : 'Something needs attention'}:</strong> {problems.map((p) => p.label).join(', ')}.</span>
          <span className="ov-alert__go">See system health <Icon name="arrowRight" size={16} /></span>
        </Link>
      )}

      {setupGaps.length > 0 && (
        <Card title="Finish setting up">
          <ul className="ov-setup">
            {setupGaps.map((g) => <li key={g.to}><Link to={g.to}>{g.text}<Icon name="arrowRight" size={16} /></Link></li>)}
          </ul>
        </Card>
      )}

      <div className="ov-tiles">
        <Tile icon="clock" value={o.waiting_signatures.total} label="Signatures waiting" tone={o.waiting_signatures.total ? 'warn' : 'ok'} to="#waiting" />
        <Tile icon="folder" value={o.overdue_cases.total} label="Cases past their required date" tone={o.overdue_cases.total ? 'bad' : 'ok'} to="#overdue" />
        <Tile icon="mail" value={o.failed_emails.total} label="Emails that failed this week" tone={o.failed_emails.total ? 'bad' : 'ok'} to="#emails" />
        {o.people.password_login && <Tile icon="user" value={o.people.invite_pending} label="Invitations not accepted" tone={o.people.invite_pending ? 'warn' : 'ok'} to="/admin/users" />}
        <Tile icon="user" value={o.people.no_roles} label="Active users without a role" tone={o.people.no_roles ? 'warn' : 'ok'} to="/admin/users" />
        <Tile icon="edit" value={o.people.no_signature} label="People without a saved signature" tone="ok" />
      </div>

      <div id="waiting">
        <Section
          title="Signatures waiting"
          hint={`Oldest first. Signers get an automatic reminder every morning after ${o.reminder_days} days; you can also remind them now.`}
          total={o.waiting_signatures.total}
          items={o.waiting_signatures.items}
          clear="Nobody is holding up a document."
          render={(s) => {
            const age = formatAge(s.waiting_since);
            return (
              <li key={s.slot_id} className="ov-item">
                <div className="ov-item__main">
                  <Link to={`/documents/${s.document_id}`} className="ov-item__title"><span className="doc-chip">{s.doc_type}</span>{s.title}</Link>
                  <div className="ov-item__meta">
                    {s.request_no && <span>{s.request_no}</span>}
                    <span>{s.label}</span>
                    <span>{s.assigned_to ?? `anyone with the ${humanize(s.role_code)} role`}</span>
                    <span className={cx(age.days >= o.reminder_days && 'ov-late')}>waiting {age.text}</span>
                  </div>
                </div>
                <Button size="sm" loading={remind.isPending && remind.variables === s.slot_id} onClick={() => remind.mutate(s.slot_id)}>
                  <Icon name="bell" size={16} /> Remind now
                </Button>
              </li>
            );
          }}
        />
      </div>

      <div id="overdue">
        <Section
          title="Cases past their required date"
          hint="Open cases whose “required by” date has passed."
          total={o.overdue_cases.total}
          items={o.overdue_cases.items}
          clear="No case is late."
          render={(c) => (
            <li key={c.id} className="ov-item">
              <div className="ov-item__main">
                <Link to={`/cases/${c.id}`} className="ov-item__title">{c.request_no} · {c.project ?? 'No project'}</Link>
                <div className="ov-item__meta">
                  <span className="ov-late">required by {formatDate(c.required_by)}</span>
                  <span>requested by {c.requested_by}</span>
                </div>
              </div>
              <StatusBadge status={c.current_stage} />
            </li>
          )}
        />
      </div>

      <div className="grid-2">
        <Section
          title="Returned documents"
          hint="Sent back by a signer; the author has to correct and resubmit them."
          total={o.returned_documents.total}
          items={o.returned_documents.items}
          clear="Nothing has been returned."
          render={(d) => (
            <li key={d.id} className="ov-item">
              <div className="ov-item__main">
                <Link to={`/documents/${d.id}`} className="ov-item__title"><span className="doc-chip">{d.doc_type}</span>{d.request_no ?? d.title}</Link>
                {d.returned_reason && <div className="ov-item__meta"><span>“{d.returned_reason}”</span></div>}
              </div>
            </li>
          )}
        />
        <Section
          title="Forgotten drafts"
          hint="Drafts nobody has touched for more than a week."
          total={o.stale_drafts.total}
          items={o.stale_drafts.items}
          clear="No old drafts."
          render={(d) => (
            <li key={d.id} className="ov-item">
              <div className="ov-item__main">
                <Link to={`/documents/${d.id}`} className="ov-item__title"><span className="doc-chip">{d.doc_type}</span>{d.request_no ?? d.title}</Link>
                <div className="ov-item__meta"><span>{d.created_by}</span><span>last edited {formatAge(d.updated_at).text}</span></div>
              </div>
            </li>
          )}
        />
      </div>

      <div id="emails">
        <Section
          title="Emails that failed this week"
          hint="Fix the address in Users (or the email settings in System health), then send them again."
          total={o.failed_emails.total}
          items={o.failed_emails.items}
          clear="Every email was delivered."
          actions={o.failed_emails.total > 0 && <Button size="sm" variant="primary" loading={retry.isPending} onClick={() => retry.mutate()}>Retry failed emails</Button>}
          render={(n) => (
            <li key={n.id} className="ov-item">
              <div className="ov-item__main">
                <span className="ov-item__title">{n.full_name ?? n.email ?? 'Unknown recipient'} <span className="muted">· {humanize(n.kind)}</span></span>
                <div className="ov-item__meta"><span>{n.email ?? 'no email address'}</span><span className="ov-late">{n.error ?? 'unknown error'}</span><span>{formatAge(n.created_at).text}</span></div>
              </div>
            </li>
          )}
        />
      </div>
    </div>
  );
}
