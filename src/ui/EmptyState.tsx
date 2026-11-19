import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/**
 * Friendly empty list: say what would be here, why it is empty, and offer the next step.
 * className hooks: .empty-state .empty-state__title .empty-state__action
 */
export function EmptyState({ title, icon = 'file', children, action }: { title: string; icon?: IconName; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><Icon name={icon} size={24} /></div>
      <div className="empty-state__title">{title}</div>
      {children && <div className="empty-state__text">{children}</div>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
