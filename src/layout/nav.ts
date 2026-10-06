import type { Role } from '../api/types';
import type { IconName } from '../ui/Icon';
import { AUDIT_ROLES, REPORT_ROLES } from '../auth/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  /** visible only to these roles; omit for everyone */
  roles?: Role[];
}

// Sidebar entries. Edit here to add/reorder pages.
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'My actions', icon: 'tasks', end: true },
  { to: '/cases', label: 'Procurement cases', icon: 'folder' },
  { to: '/requests', label: 'Requests (GR-06)', icon: 'file' },
  { to: '/memos', label: 'Memos (IM-08)', icon: 'edit' },
  { to: '/travel', label: 'Travel clearance (TC-10)', icon: 'file' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/audit', label: 'Audit log', icon: 'shield', roles: AUDIT_ROLES },
  { to: '/reports', label: 'Reports', icon: 'chart', roles: REPORT_ROLES },
  { to: '/admin', label: 'Administration', icon: 'settings', roles: ['admin'] },
];
