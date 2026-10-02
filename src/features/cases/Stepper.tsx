import type { TimelineStage } from '../../api/types';
import { cx } from '../../ui/cx';

/** Case stage stepper fed by GET /cases/{id}/timeline. className hooks: .stepper .stepper__step--done|current|skipped */
export function Stepper({ stages }: { stages: TimelineStage[] }) {
  return (
    <ol className="stepper" aria-label="Case progress">
      {stages.map((s) => (
        <li
          key={s.stage}
          className={cx('stepper__step', `stepper__step--${s.status === 'upcoming' ? 'upcoming' : s.status}`)}
          aria-current={s.status === 'current' ? 'step' : undefined}
        >
          {s.label}
          <span className="visually-hidden"> ({s.status})</span>
        </li>
      ))}
    </ol>
  );
}
