import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '../../ui/PageHeader';
import { cx } from '../../ui/cx';

const LINKS = [
  ['users', 'Users'],
  ['departments', 'Departments'],
  ['budget-lines', 'Budget lines'],
  ['suppliers', 'Suppliers'],
  ['templates', 'Templates'],
];

export function AdminLayout() {
  return (
    <div className="stack">
      <PageHeader title="Administration" />
      <nav className="tabs" aria-label="Admin sections">
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => cx('tabs__tab', isActive && 'is-active')} style={({ isActive }) => ({ borderBottomColor: isActive ? 'var(--color-primary)' : undefined, color: isActive ? 'var(--color-text)' : undefined, textDecoration: 'none' })}>
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
