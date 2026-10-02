import { Link } from 'react-router-dom';
import { EmptyState } from '../ui/EmptyState';

export function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link to="/">Back to my actions</Link>
    </EmptyState>
  );
}
