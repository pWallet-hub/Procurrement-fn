import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import type { Stage } from '../api/types';
import { signingApi } from '../api/signing';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { formatAge, formatDate } from '../lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Icon } from '../ui/Icon';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { cx } from '../ui/cx';

const PIPELINE_STAGES: Stage[] = [
  'requisition',
  'quotation',
  'market_check',
  'evaluation',
  'purchase_order',
  'delivery',
  'payment',
];

/** Stages are grouped into three phases; each phase has one chart colour. */
const PHASES: { key: string; label: string; color: string; stages: Stage[] }[] = [
  { key: 'planning', label: 'Planning', color: 'var(--chart-purple)', stages: ['requisition', 'quotation'] },
  { key: 'sourcing', label: 'Sourcing', color: 'var(--chart-sky)', stages: ['market_check', 'evaluation'] },
  { key: 'fulfilment', label: 'Fulfilment', color: 'var(--chart-green)', stages: ['purchase_order', 'delivery', 'payment'] },
];
const phaseColor = (stage: Stage) => PHASES.find((p) => p.stages.includes(stage))?.color ?? 'var(--chart-purple)';

const PROJECT_COLORS = ['var(--chart-purple)', 'var(--chart-sky)', 'var(--chart-green)', 'var(--chart-amber)', 'var(--chart-coral)'];

const AGE_BUCKETS = [
  { label: 'Today', test: (d: number) => d < 1, color: 'var(--chart-green)' },
  { label: '1–2 days', test: (d: number) => d >= 1 && d < 3, color: 'var(--chart-sky)' },
  { label: '3–6 days', test: (d: number) => d >= 3 && d < 7, color: 'var(--chart-amber)' },
  { label: '7+ days', test: (d: number) => d >= 7, color: 'var(--chart-coral)' },
];

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

interface KpiProps {
  label: string;
  value: ReactNode;
  icon: 'edit' | 'folder' | 'file' | 'chart';
  tone: 'purple' | 'coral' | 'amber' | 'green';
  chip: string;
  chipTone: 'good' | 'bad' | 'warn' | 'neutral';
  foot: string;
  to?: string;
  href?: string;
}

function Kpi({ label, value, icon, tone, chip, chipTone, foot, to, href }: KpiProps) {
  const body = (
    <>
      <span className="kpi__label">{label}</span>
      <span className={`kpi__icon kpi__icon--${tone}`}><Icon name={icon} size={22} /></span>
      <div className="kpi__value">{value}</div>
      <span className="kpi__foot"><span className={`chip chip--${chipTone}`}>{chip}</span>{foot}</span>
    </>
  );
  return to ? <Link className="kpi" to={to}>{body}</Link> : <a className="kpi" href={href}>{body}</a>;
}

/** "My actions": KPIs, pipeline charts, signature queue, and the lists behind them. */
export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const tasks = useQuery({ queryKey: ['signing-tasks'], queryFn: signingApi.tasks });
  const cases = useQuery({ queryKey: ['cases', { status: 'open', limit: 10 }], queryFn: () => casesApi.list({ status: 'open', limit: 10 }) });
  const taskItems = tasks.data?.items ?? [];
  const caseItems = cases.data?.items ?? [];
  const canCreate = hasRole(user, ...CASE_CREATOR_ROLES);
  const moreCases = cases.data?.next_cursor ? '+' : '';

  // pipeline
  const stageCounts = PIPELINE_STAGES.map((stage) => ({ stage, count: caseItems.filter((c) => c.current_stage === stage).length }));
  const maxStageCount = Math.max(1, ...stageCounts.map(({ count }) => count));
  const visibleCases = selectedStage ? caseItems.filter((c) => c.current_stage === selectedStage) : caseItems;
  const phaseCounts = PHASES.map((p) => ({ ...p, count: stageCounts.filter((s) => p.stages.includes(s.stage)).reduce((n, s) => n + s.count, 0) }));

  // deadlines
  const left = caseItems.map((c) => daysUntil(c.required_by));
  const overdue = left.filter((d) => d !== null && d < 0).length;
  const dueSoon = left.filter((d) => d !== null && d >= 0 && d <= 7).length;

  // signature queue
  const ages = taskItems.map((t) => formatAge(t.created_at).days);
  const oldTasks = ages.filter((d) => d >= 3).length;
  const oldest = ages.length ? Math.max(...ages) : 0;
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const buckets = AGE_BUCKETS.map((b) => ({ ...b, count: ages.filter(b.test).length }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  // projects
  const projectMap = new Map<string, number>();
  caseItems.forEach((c) => projectMap.set(c.project, (projectMap.get(c.project) ?? 0) + 1));
  const topProjects = [...projectMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const projectTotal = topProjects.reduce((n, [, c]) => n + c, 0) || 1;

  const nextTask = taskItems.length ? taskItems[ages.indexOf(oldest)] : undefined;
  const nextAge = nextTask ? formatAge(nextTask.created_at) : { text: '', days: 0 };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : '';

  return (
    <div className="dashboard stack">
      <section className={cx('dash-hero', oldTasks > 0 && 'dash-hero--alert')}>
        <div className="dash-hero__main">
          <div className="dash-hero__meta">
            {oldTasks > 0
              ? <span className="chip chip--bad">{oldTasks} {oldTasks === 1 ? 'signature' : 'signatures'} overdue</span>
              : <span className="chip chip--good">On track</span>}
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="dash-hero__title">Good {greeting}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="dash-hero__sub">
            {tasks.isLoading || cases.isLoading ? 'Loading your queue…' : (
              <>You have <strong>{taskItems.length} {taskItems.length === 1 ? 'document' : 'documents'}</strong> to sign and <strong>{dueSoon} {dueSoon === 1 ? 'case' : 'cases'}</strong> required within 7 days.</>
            )}
          </p>
          <div className="dash-hero__actions">
            {canCreate && <Button variant="primary" size="lg" onClick={() => navigate('/cases/new')}><Icon name="plus" size={18} /> New procurement case</Button>}
            <Link className="dash-hero__ghost" to="/cases">View all cases</Link>
          </div>
        </div>
        <aside className="dash-hero__panel" aria-label="Next to sign">
          <span className="dash-hero__panel-label">{nextTask ? 'Next to sign' : 'Signature queue'}</span>
          {nextTask ? (
            <>
              <p className="dash-hero__panel-title"><span className="dash-hero__chip">{nextTask.doc_type}</span>{nextTask.title}</p>
              <dl className="dash-hero__facts">
                {nextTask.request_no && <div><dt>Request</dt><dd>{nextTask.request_no}</dd></div>}
                <div><dt>Signing as</dt><dd>{nextTask.label}</dd></div>
                {nextAge.text && <div><dt>Waiting</dt><dd className={cx(nextAge.days >= 3 && 'is-late')}>{nextAge.text}</dd></div>}
              </dl>
              <button type="button" className="dash-hero__btn" onClick={() => navigate(`/documents/${nextTask.document_id}`)}>Review &amp; sign</button>
            </>
          ) : (
            <>
              <p className="dash-hero__panel-title">You are all caught up</p>
              <p className="dash-hero__sub">Nothing is waiting for your signature.</p>
            </>
          )}
        </aside>
      </section>

      <div className="kpi-row">
        <Kpi label="Waiting for your signature" value={tasks.isLoading ? '–' : taskItems.length} icon="edit" tone="purple"
          chip={oldTasks > 0 ? `${oldTasks} overdue` : 'On track'} chipTone={oldTasks > 0 ? 'bad' : 'good'} foot="3+ days" href="#my-actions" />
        <Kpi label="Open procurement cases" value={cases.isLoading ? '–' : `${caseItems.length}${moreCases}`} icon="folder" tone="green"
          chip={`${phaseCounts[2].count} in fulfilment`} chipTone="good" foot="to deliver" to="/cases" />
        <Kpi label="Required within 7 days" value={cases.isLoading ? '–' : dueSoon} icon="file" tone="amber"
          chip={dueSoon > 0 ? 'Due soon' : 'Clear'} chipTone={dueSoon > 0 ? 'warn' : 'good'} foot="open cases" to="/cases" />
        <Kpi label="Past required date" value={cases.isLoading ? '–' : overdue} icon="chart" tone="coral"
          chip={overdue > 0 ? 'Needs action' : 'None late'} chipTone={overdue > 0 ? 'bad' : 'good'} foot="open cases" to="/cases" />
      </div>

      <div className="dash-row dash-row--wide">
        <Card
          className="dashboard-card"
          title="Open case pipeline"
          actions={<span className="dashboard__chart-note">{caseItems.length} cases shown{moreCases ? ' · more available' : ''}</span>}
        >
          {cases.isLoading ? <PageSpinner /> : cases.error ? <ErrorState error={cases.error} /> : caseItems.length === 0 ? (
            <EmptyState title="No pipeline data yet" icon="chart">Open cases will appear here as your team moves through procurement stages.</EmptyState>
          ) : (
            <>
              <div className="hbars" role="group" aria-label="Open cases by procurement stage. Select a bar to filter the case list.">
                {stageCounts.map(({ stage, count }) => (
                  <button
                    key={stage}
                    type="button"
                    className={cx('hbar', selectedStage === stage && 'hbar--selected')}
                    aria-pressed={selectedStage === stage}
                    aria-label={`${humanize(stage)}: ${count} ${count === 1 ? 'case' : 'cases'}. ${selectedStage === stage ? 'Clear filter' : 'Filter cases by this stage'}.`}
                    onClick={() => setSelectedStage((cur) => (cur === stage ? null : stage))}
                  >
                    <span className="hbar__label">{humanize(stage)}</span>
                    <span className="hbar__track"><span className="hbar__fill" style={{ width: `${(count / maxStageCount) * 100}%`, background: phaseColor(stage) }} /></span>
                    <span className="hbar__value">{count}</span>
                  </button>
                ))}
              </div>
              <div className="chart-legend">
                {PHASES.map((p) => <span key={p.key}><i className="dot" style={{ background: p.color }} />{p.label}</span>)}
                <span style={{ marginLeft: 'auto' }}>Select a bar to filter</span>
              </div>
            </>
          )}
        </Card>

        <Card className="dashboard-card" title="Cases by phase">
          {cases.isLoading ? <PageSpinner /> : caseItems.length === 0 ? (
            <EmptyState title="No open cases" icon="folder">Phases appear once cases are open.</EmptyState>
          ) : (
            <>
              <div className="donut-wrap">
                <div
                  className="donut"
                  role="img"
                  aria-label={phaseCounts.map((p) => `${p.label}: ${p.count}`).join(', ')}
                  style={{
                    background: `conic-gradient(${phaseCounts.reduce<{ css: string[]; at: number }>((acc, p) => {
                      const end = acc.at + (p.count / caseItems.length) * 100;
                      acc.css.push(`${p.color} ${acc.at}% ${end}%`);
                      return { css: acc.css, at: end };
                    }, { css: [], at: 0 }).css.join(', ')})`,
                  }}
                >
                  <div className="donut__center"><strong>{caseItems.length}</strong><span>open cases</span></div>
                </div>
              </div>
              <ul className="legend-list">
                {phaseCounts.map((p) => (
                  <li key={p.key}>
                    <i className="dot" style={{ background: p.color }} />
                    <span className="legend-list__name">{p.label}</span>
                    <span className="legend-list__num">{p.count} {p.count === 1 ? 'case' : 'cases'}</span>
                    <span className="chip chip--neutral">{Math.round((p.count / caseItems.length) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="dash-row dash-row--2">
        <Card className="dashboard-card" title="Signature queue age">
          {tasks.isLoading ? <PageSpinner /> : tasks.error ? <ErrorState error={tasks.error} /> : (
            <>
              <div className="metric-strip">
                <div><strong>{taskItems.length}</strong><span>Waiting</span></div>
                <div><strong>{oldest}d</strong><span>Oldest</span></div>
                <div><strong>{avgAge}d</strong><span>Average age</span></div>
              </div>
              <div className="cols" role="img" aria-label={`Documents waiting by age: ${buckets.map((b) => `${b.label} ${b.count}`).join(', ')}`}>
                {buckets.map((b) => (
                  <div className="col" key={b.label}>
                    <span className="col__value">{b.count}</span>
                    <span className="col__bar" style={{ height: `${b.count === 0 ? 1 : Math.max(6, (b.count / maxBucket) * 80)}%`, background: b.color }} />
                  </div>
                ))}
              </div>
              <div className="col-labels">{buckets.map((b) => <span key={b.label}>{b.label}</span>)}</div>
            </>
          )}
        </Card>

        <Card className="dashboard-card" title="Top projects" actions={<Link to="/cases">See all</Link>}>
          {cases.isLoading ? <PageSpinner /> : topProjects.length === 0 ? (
            <EmptyState title="No projects yet" icon="folder">Projects with open cases will be ranked here.</EmptyState>
          ) : (
            <>
              <div className="big-number">{projectMap.size} <span className="dashboard__chart-note">{projectMap.size === 1 ? 'project' : 'projects'} with open cases</span></div>
              <div className="segbar" aria-hidden="true">
                {topProjects.map(([name, count], i) => <i key={name} style={{ width: `${(count / projectTotal) * 100}%`, background: PROJECT_COLORS[i] }} />)}
              </div>
              <ul className="project-list">
                {topProjects.map(([name, count], i) => (
                  <li key={name}>
                    <i className="dot" style={{ background: PROJECT_COLORS[i] }} />
                    <span className="project-list__name">{name}</span>
                    <span className="project-list__pct">{count}</span>
                    <span className="chip chip--neutral">{Math.round((count / caseItems.length) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="dash-row dash-row--actions">
        <Card id="my-actions" className="dashboard-card" title="Pending your review" actions={taskItems.length > 0 ? <span className="dashboard__count">{taskItems.length} to review</span> : undefined}>
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
                        {age.text && <span className={cx(age.days >= 3 && 'task__age--old')}>{age.text}</span>}
                      </div>
                    </div>
                    <Button variant="primary" onClick={() => navigate(`/documents/${t.document_id}`)} aria-label={`Review and sign ${t.title}`}>Review &amp; sign</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          className="dashboard-card"
          title={selectedStage ? `Open cases · ${humanize(selectedStage)}` : 'Open cases'}
          actions={selectedStage
            ? <button className="dashboard__clear-filter" type="button" onClick={() => setSelectedStage(null)}>Clear filter</button>
            : <Link to="/cases">See all</Link>}
        >
          {cases.isLoading ? <PageSpinner /> : cases.error ? <ErrorState error={cases.error} /> : caseItems.length === 0 ? (
            <EmptyState title="No open cases" icon="folder">
              {canCreate ? 'Start a new procurement case to raise a requisition.' : 'Cases you are involved in will appear here.'}
            </EmptyState>
          ) : visibleCases.length === 0 ? (
            <EmptyState title="No cases in this stage" icon="folder">Choose another bar in the pipeline chart or clear the filter.</EmptyState>
          ) : (
            <div className="case-list">
              {visibleCases.map((c) => (
                <Link key={c.id} to={`/cases/${c.id}`} className="case-row">
                  <span className="case-row__icon"><Icon name="file" size={18} /></span>
                  <span className="case-row__main">
                    <span className="case-row__title">{c.request_no}</span>
                    <span className="case-row__project">{c.project}</span>
                    <span className="case-row__meta">Required by {formatDate(c.required_by)}</span>
                  </span>
                  <StatusBadge status={c.current_stage} label={humanize(c.current_stage)} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}