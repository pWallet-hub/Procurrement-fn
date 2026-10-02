import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './cx';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** className hooks: .toast-region .toast .toast--success|error|info */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l, { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(
    () => ({ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error') }),
    [show],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx('toast', `toast--${t.kind}`)} role={t.kind === 'error' ? 'alert' : 'status'}>
            <span>{t.message}</span>
            <Button variant="ghost" size="sm" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ✕
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
