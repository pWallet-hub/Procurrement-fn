import { useMutation, useQuery } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { systemApi, type CheckStatus, type HealthCheck } from '../../api/system';
import { formatDateTime } from '../../lib/format';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Icon, type IconName } from '../../ui/Icon';
import { PageSpinner } from '../../ui/Spinner';
import { cx } from '../../ui/cx';

const STATUS: Record<CheckStatus, { word: string; icon: IconName }> = {
  ok: { word: 'Working', icon: 'check' },
  warning: { word: 'Needs attention', icon: 'alert' },
  error: { word: 'Not working', icon: 'close' },
  off: { word: 'Off', icon: 'minus' },
};

const ISO = /^\d{4}-\d{2}-\d{2}T/;
const factValue = (v: string | number | null) => (v == null ? '—' : typeof v === 'string' && ISO.test(v) ? formatDateTime(v) : String(v));

function CheckCard({ c }: { c: HealthCheck }) {
  return (
    <li className={cx('health-check', `health-check--${c.status}`)}>
      <span className="health-check__icon" aria-hidden="true"><Icon name={STATUS[c.status].icon} size={18} /></span>
      <div className="health-check__body">
        <div className="health-check__head">
          <h3 className="health-check__label">{c.label}</h3>
          <span className="health-check__state">{STATUS[c.status].word}</span>
        </div>
        <p className="health-check__summary">{c.summary}</p>
        {c.fix && (
          <p className="health-check__fix"><strong>How to fix: </strong>{c.fix}</p>
        )}
        {c.facts && Object.keys(c.facts).length > 0 && (
          <dl className="health-check__facts">
            {Object.entries(c.facts).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{factValue(v)}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </li>
  );
}

/** Administration > System health: is every part of the system working, and what to do when it is not. */
export function SystemHealth() {
  const q = useQuery({ queryKey: ['system-health'], queryFn: systemApi.health, refetchInterval: 60_000 });
  const verify = useMutation({ mutationFn: systemApi.verifyAudit });

  if (q.isLoading) return <PageSpinner />;
  if (q.error || !q.data) return <ErrorState error={q.error} />;
  const h = q.data;
  const problems = h.checks.filter((c) => c.status === 'error' || c.status === 'warning');
  // Problems first, so the admin sees what needs doing without scrolling.
  const order: Record<CheckStatus, number> = { error: 0, warning: 1, ok: 2, off: 3 };
  const checks = [...h.checks].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="stack">
      <section className={cx('health-banner', `health-banner--${h.status}`)} aria-live="polite">
        <span className="health-banner__icon" aria-hidden="true"><Icon name={STATUS[h.status].icon} size={26} /></span>
        <div className="health-banner__text">
          <h2>
            {h.status === 'ok' ? 'Everything is working' : h.status === 'error' ? `${problems.filter((p) => p.status === 'error').length} part(s) of the system are not working` : `${problems.length} thing(s) need attention`}
          </h2>
          <p className="muted">
            Checked {formatDateTime(h.checked_at)} · rechecks every minute · {h.environment} · {h.app_url}
          </p>
        </div>
        <div className="health-banner__actions">
          <Button onClick={() => q.refetch()} loading={q.isFetching}>Check again</Button>
        </div>
      </section>

      <ul className="health-list">
        {checks.map((c) => <CheckCard key={c.key} c={c} />)}
      </ul>

      <section className="card card__body health-audit">
        <div>
          <h3 className="card__title">Verify the audit trail</h3>
          <p className="muted">Recalculates the tamper-proof chain of every recorded action. The worker also does this every night.</p>
        </div>
        <Button onClick={() => verify.mutate()} loading={verify.isPending}><Icon name="shield" size={16} /> Verify now</Button>
        {verify.data && (
          verify.data.ok
            ? <Alert tone="success">The audit trail is intact: {verify.data.checked.toLocaleString()} entries checked, none changed.</Alert>
            : <Alert tone="error">The audit trail is broken at entry {verify.data.failing_id}. Someone may have changed the database directly. Keep a backup and contact your technical team.</Alert>
        )}
        {verify.error && <Alert tone="error">{errorMessage(verify.error)}</Alert>}
      </section>
    </div>
  );
}
