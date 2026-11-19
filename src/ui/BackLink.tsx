import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

/**
 * "Back" button at the top of a page. It returns to wherever the person came from (My actions, a case, a list,
 * a notification...). When the page was opened directly (a link in an email, a new tab), there is nothing to go back
 * to, so it goes to `to` instead and says where: "Back to procurement cases".
 * className hook: .back-link
 */
export function BackLink({ to, label }: { to: string; /** where `to` leads, e.g. "procurement cases" */ label: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  // React Router gives the first page of a visit the key "default": no in-app page to return to.
  const canGoBack = location.key !== 'default' && window.history.length > 1;
  return (
    <button type="button" className="back-link" onClick={() => (canGoBack ? navigate(-1) : navigate(to))}>
      <span className="back-link__icon"><Icon name="arrowLeft" size={16} /></span>
      {canGoBack ? 'Back' : `Back to ${label}`}
    </button>
  );
}
