import { useT } from '../i18n';
import { Link } from '../lib/router';
import { Icon } from '../ui/Icon';

export function NotFound() {
  const t = useT();
  return (
    <div className="screen not-found">
      <p className="nf-code num" aria-hidden="true">404</p>
      <p className="lede">{t.notFound.body}</p>
      <Link to="/ask" className="btn primary"><Icon name="ask" />{t.notFound.home}</Link>
    </div>
  );
}
