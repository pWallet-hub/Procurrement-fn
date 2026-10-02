import { Spinner } from '../../ui/Spinner';
import type { SaveStatus } from './useDocumentEditor';

const LABELS: Record<SaveStatus, string> = {
  idle: '',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  offline: 'Offline - will retry',
  error: 'Save failed',
};

/** className hooks: .save-indicator .save-indicator--saved|offline|error */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  return (
    <span className={`save-indicator save-indicator--${status}`} role="status" aria-live="polite">
      {status === 'saving' && <Spinner label="" />}
      {LABELS[status]}
    </span>
  );
}
