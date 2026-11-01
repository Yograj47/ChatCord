import { Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSession } from '@/features/auth/hooks/useSession';
import { useFriendRequests } from '@/features/friendships/hooks/useSocial';
import { useInvitations } from '@/features/rooms/hooks/useInvitations';
import { useLayoutStore } from '@/shared/stores/layout.store';

export function NotificationsButton() {
  const { sessionData } = useSession();
  const userId = sessionData?.type === 'registered' ? sessionData.id : undefined;
  const requests = useFriendRequests(userId);
  const invitations = useInvitations(userId);
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  const incoming = (requests.data ?? []).filter(
    (request) => request.recipient?._id === userId,
  ).length;
  const count = incoming + (invitations.data?.length ?? 0);
  return (
    <NavLink
      to="/app/notifications"
      onClick={() => setMobileView('chat')}
      title="Notifications"
      aria-label={count ? `Notifications, ${count} pending` : 'Notifications'}
      className={({ isActive }) =>
        `relative grid size-8 place-items-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-indigo-400 ${isActive ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800/70 hover:text-white'}`
      }
    >
      <Bell className="size-4" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-indigo-500 px-1 text-center text-[9px] font-semibold leading-4 text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  );
}
