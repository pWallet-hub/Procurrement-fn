import type { Role } from '../api/types';
import { AUDIT_ROLES, REPORT_ROLES } from '../auth/permissions';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  /** visible only to these roles; omit for everyone */
  roles?: Role[];
}

// Sidebar entries. Edit here to add/reorder pages.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'My actions', end: true },
  { to: '/cases', label: 'Procurement cases' },
  { to: '/requests', label: 'Requests (GR-06)' },
  { to: '/memos', label: 'Memos (IM-08)' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/audit', label: 'Audit log', roles: AUDIT_ROLES },
  { to: '/reports', label: 'Reports', roles: REPORT_ROLES },
  { to: '/admin', label: 'Administration', roles: ['admin'] },
];
