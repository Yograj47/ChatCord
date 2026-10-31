import { useSession } from '@/features/auth/hooks/useSession';
import { RegisteredInvitations } from '@/features/rooms/components/RegisteredInvitations';
import { actionClassName } from '@/shared/ui/action-styles';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function InvitationsPage() {
  const { sessionData } = useSession();
  if (sessionData?.type !== 'registered' || !sessionData.id)
    return (
      <div className="m-auto max-w-md p-8 text-center">
        <Mail className="mx-auto mb-4 h-10 w-10 text-indigo-400" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Room invitations</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Sign in with a registered account to send and respond to room invitations.
        </p>
        <Link to="/app" className={`${actionClassName} mt-6 inline-block`}>
          Back to workspace
        </Link>
      </div>
    );
  return <RegisteredInvitations key={sessionData.id} userId={sessionData.id} />;
}
