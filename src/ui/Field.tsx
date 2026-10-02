import type { ReactNode } from 'react';
import { cx } from './cx';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  /** keep the label for screen readers only (e.g. inside table cells) */
  hideLabel?: boolean;
  /** render as fieldset/legend for radio/checkbox groups */
  group?: boolean;
  className?: string;
  children: ReactNode;
}

/** ARIA props to spread on the control inside a <Field>. */
export function fieldAria(id: string, help?: string, error?: string, required?: boolean) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required || undefined };
}

/**
 * Label + control + help + error wrapper.
 * className hooks: .field .field--invalid .field__label .field__required .field__help .field__error
 */
export function Field({ id, label, required, help, error, hideLabel, group, className, children }: FieldProps) {
  const labelContent = (
    <>
      {label}
      {required && (
        <span className="field__required" aria-hidden="true">
          *
        </span>
      )}
    </>
  );
  const body = (
    <>
      {children}
      {help && !hideLabel && (
        <div id={`${id}-help`} className="field__help">
          {help}
        </div>
      )}
      {error && (
        <div id={`${id}-error`} className="field__error" role="alert">
          {error}
        </div>
      )}
    </>
  );
  const cls = cx('field', error && 'field--invalid', className);
  if (group) {
    return (
      <fieldset className={cls} id={id} aria-describedby={fieldAria(id, help, error)['aria-describedby']}>
        <legend className={cx('field__label', hideLabel && 'visually-hidden')}>{labelContent}</legend>
        {body}
      </fieldset>
    );
  }
  return (
    <div className={cls}>
      <label htmlFor={id} className={cx('field__label', hideLabel && 'visually-hidden')}>
        {labelContent}
      </label>
      {body}
    </div>
  );
}
