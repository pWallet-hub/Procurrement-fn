import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  actions?: ReactNode;
}

/** className hooks: .card .card__header .card__title .card__body */
export function Card({ title, actions, className, children, ...rest }: CardProps) {
  return (
    <section className={cx('card', className)} {...rest}>
      {(title || actions) && (
        <header className="card__header">
          <h2 className="card__title">{title}</h2>
          {actions}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}
