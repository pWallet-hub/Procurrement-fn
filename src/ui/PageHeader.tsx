import { useEffect, type ReactNode } from 'react';
import { BackLink } from './BackLink';

const APP_NAME = 'AfS Rwanda Procurement';

/**
 * className hooks: .page-header .page-header__title .page-header__subtitle .page-header__actions
 * A text title also names the browser tab, so open tabs and history entries say which page they are.
 */
export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; /** shows a Back button above the title */ back?: { to: string; label: string } }) {
  useEffect(() => {
    if (typeof title !== 'string') return;
    document.title = `${title} · ${APP_NAME}`;
    return () => { document.title = APP_NAME; };
  }, [title]);
  return (
    <>
    {back && <BackLink to={back.to} label={back.label} />}
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
    </>
  );
}
