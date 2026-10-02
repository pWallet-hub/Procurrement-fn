import type { ReactNode } from 'react';
import { cx } from './cx';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** className hooks: .badge .badge--success|warning|danger|info */
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('badge', tone !== 'neutral' && `badge--${tone}`, className)}>{children}</span>;
}
