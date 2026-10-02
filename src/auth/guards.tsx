import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../api/types';
import { PageSpinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { useAuth } from './AuthContext';
import { hasRole } from './permissions';

/** Layout route: renders children only for signed-in users, else redirects to /login (remembering where we were). */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Shows a "not allowed" message unless the user holds one of `roles`. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!hasRole(user, ...roles)) {
    return <EmptyState title="You do not have access to this page." />;
  }
  return <>{children}</>;
}
