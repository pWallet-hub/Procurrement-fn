import type { ReactNode } from 'react';

/** className hooks: .empty-state .empty-state__title */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__title">{title}</div>
      {children}
    </div>
  );
}
