import { ChevronRight } from 'lucide-react';
import { HeaderBranding } from '@/app/components/header/HeaderBranding';
import { DirectMessagesSection, type DMItem } from '@/app/components/sidebar/DirectMessagesSection';
import { PinnedSpacesSection } from '@/app/components/sidebar/PinnedSpacesSection';
import { RoomsSection, type RoomItem } from '@/app/components/sidebar/RoomsSection';
import { UserProfileFooter } from '@/app/components/sidebar/UserProfileFooter';
import { useConversationRoute } from '@/app/hooks/useConversationRoute';
import { useSession } from '@/features/auth/hooks/useSession';
import { AccountControls } from '@/features/auth/components/AccountControls';
import { useDirectMessages } from '@/features/friendships/hooks/useSocial';
import { usePresence } from '@/features/realtime/hooks/usePresence';
import { useRooms } from '@/features/rooms/hooks/useRooms';
import { useLayoutStore } from '@/shared/stores/layout.store';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { sessionData } = useSession();
  const enabled = sessionData?.type === 'registered';
  const dms = useDirectMessages(enabled ? sessionData?.id : undefined);
  const peerIds = (dms.data ?? []).flatMap((room) =>
    room.members.map((member) => member.userId?._id).filter((id): id is string => Boolean(id)),
  );
  const presence = usePresence([...peerIds, ...(sessionData?.id ? [sessionData.id] : [])]);
  const { setMobileView } = useLayoutStore();
  const { rooms: backendRooms, isLoadingRooms } = useRooms(enabled);

  const { roomId: activeRoomId, dmId: activeDmId } = useConversationRoute();

  const roomItems: RoomItem[] = backendRooms
    .filter((r) => r.type === 'group')
    .map((r) => ({
      id: r._id,
      name: r.name || 'Unnamed Room',
      unreadCount: 0,
    }));

  const dmItems: DMItem[] = (dms.data ?? []).map((room) => ({
    id: room._id,
    name:
      room.members.find((member) => member.userId && member.userId._id !== sessionData?.id)?.userId
        ?.username ?? 'Member',
    status: presence.status(
      room.members.find((member) => member.userId?._id !== sessionData?.id)?.userId?._id ?? '',
    ),
  }));

  const handleSelectRoom = (id: string) => {
    setMobileView('chat');
    void navigate(`/app/rooms/${id}`);
  };

  const handleSelectDm = (id: string) => {
    setMobileView('chat');
    void navigate(`/app/dms/${id}`);
  };

  return (
    <aside className="h-full w-full bg-background border-r border-zinc-800/80 flex flex-col justify-between shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <HeaderBranding />
          <button
            type="button"
            aria-label="Back to workspace"
            onClick={() => setMobileView('chat')}
            className="rounded p-1 text-zinc-400 hover:text-white min-[900px]:hidden"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-2 pt-4 space-y-4">
          <PinnedSpacesSection />

          {isLoadingRooms ? (
            <div className="px-2 py-3 text-xs text-zinc-500 animate-pulse">Loading rooms...</div>
          ) : (
            <RoomsSection
              rooms={roomItems}
              activeRoomId={activeRoomId ?? ''}
              onSelectRoom={handleSelectRoom}
            />
          )}

          <DirectMessagesSection
            dms={dmItems}
            activeDmId={activeDmId}
            onSelectDm={handleSelectDm}
          />
          {dms.isError && (
            <p role="alert" className="px-2 text-xs text-red-400">
              Could not load conversations.
            </p>
          )}
        </div>
      </div>

      <UserProfileFooter
        username={sessionData?.user?.username ?? 'Guest'}
        initials={(sessionData?.user?.username ?? 'Guest').slice(0, 2).toUpperCase()}
        status={presence.status(sessionData?.id ?? '')}
      >
        <AccountControls />
      </UserProfileFooter>
    </aside>
  );
};
