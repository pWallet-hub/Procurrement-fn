import type { ReactNode } from 'react';
import { cx } from '../ui/cx';

/** Shared frame for pages without the app shell (login, invite, supplier signing, verify): logo on top, centered content. */
export function PublicLayout({ children, wide, auth }: { children: ReactNode; wide?: boolean; auth?: boolean }) {
  return (
    <div className={auth ? 'auth-page' : 'public-shell'}>
      <a className="public-brand" href="/" aria-label="Alliance for Science Rwanda">
        <img src="/logo.png" alt="Alliance for Science Rwanda" />
      </a>
      <main className={cx(!auth && 'public-page', wide && 'public-page--wide', 'stack')} style={auth ? { width: 'min(26rem,100%)' } : undefined}>
        {children}
      </main>
      <p className="public-footer">AfS-Rwanda Procurement &amp; e-signature system</p>
    </div>
  );
}
