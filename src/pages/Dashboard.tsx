import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import { signingApi } from '../api/signing';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { formatAge, formatDate } from '../lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { cx } from '../ui/cx';

/** "My actions": a task list of documents waiting for my signature + a summary of open cases. */
export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tasks = useQuery({ queryKey: ['signing-tasks'], queryFn: signingApi.tasks });
  const cases = useQuery({ queryKey: ['cases', { status: 'open', limit: 10 }], queryFn: () => casesApi.list({ status: 'open', limit: 10 }) });
  const taskItems = tasks.data?.items ?? [];
  const caseItems = cases.data?.items ?? [];

  return (
    <div className="stack">
      <PageHeader
        title={`Welcome, ${user?.full_name.split(' ')[0] ?? ''}`}
        subtitle="Here is what needs your attention today."
        actions={hasRole(user, ...CASE_CREATOR_ROLES) && <Button variant="primary" size="lg" onClick={() => navigate('/cases/new')}><Icon name="plus" size={18} /> New procurement case</Button>}
      />

      <div className="stat-row">
        <div className="stat"><div className="stat__value">{tasks.isLoading ? '–' : taskItems.length}</div><div className="stat__label">Waiting for my signature</div></div>
        <div className="stat"><div className="stat__value">{cases.isLoading ? '–' : caseItems.length}{cases.data?.next_cursor ? '+' : ''}</div><div className="stat__label">Open cases</div></div>
      </div>

      <Card title="My actions" actions={taskItems.length > 0 ? <span className="muted">{taskItems.length} to review</span> : undefined}>
        {tasks.isLoading ? <PageSpinner /> : tasks.error ? <ErrorState error={tasks.error} /> : taskItems.length === 0 ? (
          <EmptyState title="You are all caught up" icon="check">Nothing is waiting for your signature right now.</EmptyState>
        ) : (
          <ul className="tasks">
            {taskItems.map((t) => {
              const age = formatAge(t.created_at);
              return (
                <li key={`${t.document_id}:${t.slot_key}`} className="task">
                  <div className="task__main">
                    <p className="task__title"><span className="doc-chip">{t.doc_type}</span>{t.title}</p>
                    <div className="task__meta">
                      {t.request_no && <span>Request {t.request_no}</span>}
                      <span className="task__what">To sign: {t.label}</span>
                      <span className={cx(age.days >= 3 && 'task__age--old')}>{age.text}</span>
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => navigate(`/documents/${t.document_id}`)}>Review &amp; sign</Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Open cases" actions={<Link to="/cases">See all cases</Link>}>
        {cases.isLoading ? <PageSpinner /> : cases.error ? <ErrorState error={cases.error} /> : caseItems.length === 0 ? (
          <EmptyState title="No open cases" icon="folder">
            {hasRole(user, ...CASE_CREATOR_ROLES) ? 'Start a new procurement case to raise a requisition.' : 'Cases you are involved in will appear here.'}
          </EmptyState>
        ) : (
          <div>
            {caseItems.map((c) => (
              <Link key={c.id} to={`/cases/${c.id}`} className="case-row">
                <div className="case-row__main">
                  <div className="case-row__title">{c.request_no} <span className="muted" style={{ fontWeight: 400 }}>· {c.project}</span></div>
                  <div className="muted" style={{ fontSize: 'var(--text-sm)' }}>Requested by {c.requested_by.full_name} · required by {formatDate(c.required_by)}</div>
                </div>
                <StatusBadge status={c.current_stage} label={humanize(c.current_stage)} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
