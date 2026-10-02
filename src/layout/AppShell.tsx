import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/permissions';
import { notificationsApi } from '../api/notifications';
import { Button } from '../ui/Button';
import { cx } from '../ui/cx';
import { NAV_ITEMS } from './nav';

/** Sidebar + header + routed content. Sidebar is an off-canvas drawer below 900px (see layout.css). */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [location.pathname]);

  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list, refetchInterval: 60_000 });
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;

  const items = NAV_ITEMS.filter((i) => !i.roles || hasRole(user, ...i.roles));

  return (
    <div className={cx('shell', navOpen && 'shell--nav-open')}>
      <header className="shell__header">
        <Button className="shell__menu-btn" variant="ghost" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
          ☰
        </Button>
        <div className="header-actions" style={{ marginLeft: 'auto' }}>
          <Link to="/notifications" className="bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {unread > 0 && <span className="bell__count">{unread > 99 ? '99+' : unread}</span>}
          </Link>
          <details className="user-menu">
            <summary>
              <span className="user-menu__name">{user?.full_name}</span>
              <span aria-hidden="true"> ▾</span>
              <span className="visually-hidden">User menu</span>
            </summary>
            <div className="user-menu__panel">
              <div>
                <strong>{user?.full_name}</strong>
                <div className="muted">{user?.email}</div>
                <div className="muted">{user?.roles.join(', ')}</div>
              </div>
              <Link to="/profile">Security (2FA)</Link>
              <Button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Sign out
              </Button>
            </div>
          </details>
        </div>
      </header>

      <aside className="shell__sidebar" aria-label="Main navigation">
        <div className="brand">AfS Rwanda Procurement</div>
        <nav className="nav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cx('nav__link', isActive && 'active')}>
              {i.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="shell__backdrop" onClick={() => setNavOpen(false)} />

      <main className="shell__main">
        <div className="shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
