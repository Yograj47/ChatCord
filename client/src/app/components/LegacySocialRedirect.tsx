import { Navigate, useLocation } from 'react-router-dom';

export function LegacySocialRedirect({ section }: { section: 'friends' | 'invitations' }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('section', section);
  return <Navigate replace to={`/app/notifications?${params}`} />;
}
