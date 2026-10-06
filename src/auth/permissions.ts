import type { Role, User } from '../api/types';

export function hasRole(user: User | null | undefined, ...roles: Array<Role | string>): boolean {
  return !!user && roles.some((r) => user.roles.includes(r));
}

/** Permission codes come from the server (`user.permissions`). */
export function can(user: User | null | undefined, permission: string): boolean {
  return !!user && user.permissions.includes(permission);
}

// Roles that may start a case (permission matrix in the project document, section 4).
export const CASE_CREATOR_ROLES: Role[] = ['requesting_staff', 'accountant', 'director_comms', 'director_dept', 'pi', 'admin'];
// Roles that see the audit log / reports.
export const AUDIT_ROLES: Role[] = ['accountant', 'pi', 'cfm', 'admin', 'director_comms', 'director_dept', 'requesting_staff'];
export const REPORT_ROLES: Role[] = ['accountant', 'pi', 'cfm', 'admin'];
