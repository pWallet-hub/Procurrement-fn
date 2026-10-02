import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Built on the native <dialog> (focus trap, Esc to close). className hooks: .modal .modal__header .modal__title .modal__body .modal__footer */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-title" onClose={onClose} onCancel={onClose}>
      {open && (
        <>
          <div className="modal__header">
            <h2 className="modal__title" id="modal-title">
              {title}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
              ✕
            </Button>
          </div>
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__footer">{footer}</div>}
        </>
      )}
    </dialog>
  );
}
