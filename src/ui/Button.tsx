import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  loading?: boolean;
}

/** className hooks: .btn .btn--primary|danger|ghost .btn--sm */
export function Button({ variant = 'default', size = 'md', loading, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', variant !== 'default' && `btn--${variant}`, size === 'sm' && 'btn--sm', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner label="" />}
      {children}
    </button>
  );
}
