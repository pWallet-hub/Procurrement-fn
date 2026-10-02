import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/permissions';
import { notificationsApi } from '../api/notifications';
import { Icon } from '../ui/Icon';
import { cx } from '../ui/cx';
import { NAV_ITEMS } from './nav';

function initials(name?: string) {
  return (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}

/** Sidebar + header + routed content. Sidebar is an off-canvas drawer below 900px (see layout.css). */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setNavOpen(false);
    if (menuRef.current) menuRef.current.open = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list, refetchInterval: 60_000 });
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;

  const items = NAV_ITEMS.filter((i) => !i.roles || hasRole(user, ...i.roles));

  return (
    <div className={cx('shell', navOpen && 'shell--nav-open')}>
      <header className="shell__header">
        <button type="button" className="shell__menu-btn" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} aria-controls="main-nav" onClick={() => setNavOpen((o) => !o)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={22} />
        </button>
        <Link to="/" className="shell__header-brand" aria-label="AfS Rwanda Procurement - home">
          <img src="/logo.png" alt="" />
        </Link>
        <div className="header-actions">
          <Link to="/notifications" className="bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Icon name="bell" />
            {unread > 0 && <span className="bell__count">{unread > 99 ? '99+' : unread}</span>}
          </Link>
          <details className="user-menu" ref={menuRef}>
            <summary>
              <span className="avatar" aria-hidden="true">{initials(user?.full_name)}</span>
              <span className="user-menu__name">{user?.full_name}</span>
              <Icon name="chevron" size={16} />
              <span className="visually-hidden">User menu</span>
            </summary>
            <div className="user-menu__panel">
              <div>
                <strong>{user?.full_name}</strong>
                <div className="muted">{user?.position}</div>
                <div className="muted">{user?.email}</div>
              </div>
              <Link to="/profile" className="user-menu__item"><Icon name="lock" size={16} /> Security (2FA)</Link>
              <button
                type="button"
                className="user-menu__item"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <Icon name="logout" size={16} /> Sign out
              </button>
            </div>
          </details>
        </div>
      </header>

      <aside className="shell__sidebar" id="main-nav" aria-label="Main navigation">
        <Link to="/" className="brand">
          <span className="brand__logo"><img src="/logo.png" alt="Alliance for Science Rwanda" /></span>
          <span className="brand__name">Procurement system</span>
        </Link>
        <nav className="nav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cx('nav__link', isActive && 'active')}>
              <Icon name={i.icon} size={18} />
              <span>{i.label}</span>
              {i.to === '/notifications' && unread > 0 && <span className="nav__count">{unread}</span>}
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
