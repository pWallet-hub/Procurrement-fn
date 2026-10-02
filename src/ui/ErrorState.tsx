import { errorMessage } from '../api/client';
import { Alert } from './Alert';

/** Standard query-error display. */
export function ErrorState({ error }: { error: unknown }) {
  return <Alert tone="error">{errorMessage(error)}</Alert>;
}
