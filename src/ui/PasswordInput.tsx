import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { Input } from './Input';

/** Password input with a show/hide button so users can check what they typed. className hooks: .password-input, .password-input__toggle */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <Input ref={ref} {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="password-input__toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
});
