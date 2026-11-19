import type { Role } from '../api/types';
import type { IconName } from '../ui/Icon';
import { AUDIT_ROLES, CASE_CREATOR_ROLES, REPORT_ROLES } from '../auth/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Form code shown as a small tag next to the label (e.g. GR-06), so people who know the paper form find it. */
  code?: string;
  end?: boolean;
  /** visible only to these roles; omit for everyone */
  roles?: Role[];
}

export interface NavGroup {
  /** Small heading above the group; omit for the first group. */
  heading?: string;
  items: NavItem[];
}

// Sidebar entries, grouped so the everyday pages come first. Edit here to add/reorder pages.
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'My actions', icon: 'tasks', end: true },
      { to: '/cases', label: 'Procurement cases', icon: 'folder' },
      { to: '/notifications', label: 'Notifications', icon: 'bell' },
    ],
  },
  {
    heading: 'Other documents',
    items: [
      { to: '/requests', label: 'Requests', code: 'GR-06', icon: 'file' },
      { to: '/memos', label: 'Memos', code: 'IM-08', icon: 'edit' },
      { to: '/travel', label: 'Travel clearance', code: 'TC-10', icon: 'file' },
    ],
  },
  {
    heading: 'Oversight',
    items: [
      { to: '/reports', label: 'Reports', icon: 'chart', roles: REPORT_ROLES },
      { to: '/audit', label: 'Audit log', icon: 'shield', roles: AUDIT_ROLES },
      { to: '/admin', label: 'Administration', icon: 'settings', roles: ['admin'] },
    ],
  },
  {
    items: [{ to: '/help', label: 'Help', icon: 'help' }],
  },
];

/** Everything that can be started from the header's "New" menu. */
export const CREATE_ITEMS: Array<{ to: string; label: string; hint: string; icon: IconName; roles?: Role[] }> = [
  { to: '/cases/new', label: 'Procurement case', hint: 'Starts a requisition (PR-01)', icon: 'folder', roles: CASE_CREATOR_ROLES },
  { to: '/requests/new', label: 'Request', hint: 'Form GR-06', icon: 'file' },
  { to: '/memos/new', label: 'Memo', hint: 'Form IM-08', icon: 'edit' },
  { to: '/travel/new', label: 'Travel clearance', hint: 'Form TC-10', icon: 'file' },
];
