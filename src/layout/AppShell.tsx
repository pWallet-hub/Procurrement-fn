import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/permissions';
import { notificationsApi } from '../api/notifications';
import { Icon } from '../ui/Icon';
import { cx } from '../ui/cx';
import { CREATE_ITEMS, NAV_GROUPS } from './nav';

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
  const createRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setNavOpen(false);
    if (menuRef.current) menuRef.current.open = false;
    if (createRef.current) createRef.current.open = false;
  }, [location.pathname]);

  // Header menus close on Escape or on a click anywhere else, like ordinary menus.
  useEffect(() => {
    const menus = () => [menuRef.current, createRef.current].filter((m): m is HTMLDetailsElement => !!m);
    const onDown = (e: PointerEvent) => menus().forEach((m) => { if (m.open && !m.contains(e.target as Node)) m.open = false; });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      menus().forEach((m) => { if (m.open) { m.open = false; m.querySelector('summary')?.focus(); } });
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list, refetchInterval: 60_000 });
  const unread = (notes.data?.items ?? []).filter((n) => !n.read_at).length;

  const allowed = <T extends { roles?: Parameters<typeof hasRole>[1][] }>(i: T) => !i.roles || hasRole(user, ...i.roles);
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter(allowed) })).filter((g) => g.items.length > 0);
  const creatable = CREATE_ITEMS.filter(allowed);

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
          {creatable.length > 0 && (
            <details className="create-menu" ref={createRef}>
              <summary className="btn btn--primary">
                <Icon name="plus" size={18} />
                <span className="create-menu__label">New</span>
                <span className="visually-hidden"> document or case</span>
              </summary>
              <div className="create-menu__panel" role="menu">
                <div className="create-menu__heading">Start something new</div>
                {creatable.map((c) => (
                  <Link key={c.to} to={c.to} role="menuitem" className="create-menu__item">
                    <span className="create-menu__icon"><Icon name={c.icon} size={18} /></span>
                    <span><strong>{c.label}</strong><span className="create-menu__hint">{c.hint}</span></span>
                  </Link>
                ))}
              </div>
            </details>
          )}
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
              <Link to="/profile" className="user-menu__item"><Icon name="lock" size={16} /> My account, signature &amp; security</Link>
              <button
                type="button"
                className="user-menu__item"
                onClick={async () => {
                  await logout();
                  // signed_out stops the login page from signing the person straight back in through AFS.
                  navigate('/login?signed_out=1');
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
          {groups.map((g, n) => (
            <div key={g.heading ?? n} className="nav__group" role="group" aria-label={g.heading}>
              {g.heading && <div className="nav__heading" aria-hidden="true">{g.heading}</div>}
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cx('nav__link', isActive && 'active')}>
                  <Icon name={i.icon} size={18} />
                  <span>{i.label}</span>
                  {i.code && <span className="nav__code">{i.code}</span>}
                  {i.to === '/notifications' && unread > 0 && <span className="nav__count">{unread}</span>}
                </NavLink>
              ))}
            </div>
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
