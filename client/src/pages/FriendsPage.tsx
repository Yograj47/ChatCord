import { useAuth } from '@/features/auth/hooks/useAuth';
import { RegisteredFriends } from '@/features/friendships/components/RegisteredFriends';
import { errorMessage } from '@/features/friendships/lib/friendship-error';
import type { View } from '@/features/friendships/hooks/useFriendsController';
import { showError } from '@/shared/lib/toast';
import { actionClassName } from '@/shared/ui/action-styles';
import { Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function FriendsPage({ initialView = 'friends' }: { initialView?: View }) {
  const { sessionData, logout, isLogoutPending } = useAuth();
  const navigate = useNavigate();
  if (sessionData?.type !== 'registered' || !sessionData.id)
    return (
      <div className="m-auto max-w-md p-8 text-center">
        <Users className="mx-auto mb-4 h-10 w-10 text-indigo-400" />
        <h1 className="text-xl font-semibold">Make yourself at home</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Sign in with Google to find people, manage friend requests, and start conversations.
        </p>
        <button
          type="button"
          disabled={isLogoutPending}
          onClick={() => {
            void logout()
              .then(() => navigate('/', { replace: true }))
              .catch((error: unknown) => showError(errorMessage(error)));
          }}
          className={`${actionClassName} mt-6 inline-block`}
        >
          End guest session and sign in
        </button>
        <Link to="/app" className={`${actionClassName} ml-2 mt-6 inline-block`}>
          Back to workspace
        </Link>
      </div>
    );
  return (
    <RegisteredFriends key={sessionData.id} userId={sessionData.id} initialView={initialView} />
  );
}
