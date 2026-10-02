import type { ReactNode } from 'react';
import { cx } from './cx';

/** Inline message. className hooks: .alert .alert--error|warning|success|info */
export function Alert({ tone = 'info', children }: { tone?: 'error' | 'warning' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div className={cx('alert', `alert--${tone}`)} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
