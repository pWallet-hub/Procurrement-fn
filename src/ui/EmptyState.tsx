import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Friendly empty list. Give it an icon, a hint and (optionally) the next action. className hooks: .empty-state .empty-state__title */
export function EmptyState({ title, icon = 'file', children }: { title: string; icon?: IconName; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><Icon name={icon} size={24} /></div>
      <div className="empty-state__title">{title}</div>
      {children}
    </div>
  );
}
