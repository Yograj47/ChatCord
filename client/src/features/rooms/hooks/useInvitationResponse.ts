import { roomsApi } from '@/features/rooms/api/room.api';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { invitationKey, useInvitations } from '@/features/rooms/hooks/useInvitations';
import type { RoomInvitation } from '@/features/rooms/types/room.types';
import { showSuccess } from '@/shared/lib/toast';
import { useLayoutStore } from '@/shared/stores/layout.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function useInvitationResponse(userId: string) {
  const invitations = useInvitations(userId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  const action = useMutation({
    mutationFn: async ({
      kind,
      invitation,
    }: {
      kind: 'accept' | 'decline';
      invitation: RoomInvitation;
    }) => {
      if (kind === 'accept') return roomsApi.acceptInvitation(invitation.roomId, invitation.id);
      await roomsApi.declineInvitation(invitation.roomId, invitation.id);
    },
    onSuccess: async (room, { invitation }) => {
      queryClient.setQueryData<RoomInvitation[]>(invitationKey(userId), (items) =>
        items?.filter((item) => item.id !== invitation.id),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() }),
      ]);
      if (room) {
        queryClient.setQueryData(ROOM_QUERY_KEYS.detail(room._id), room);
        setMobileView('chat');
        showSuccess(`You joined ${room.name || 'the room'}.`);
        void navigate(`/app/rooms/${room._id}`);
      } else showSuccess('Room invitation declined.');
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKey(userId) });
      void queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
    },
  });
  return { invitations, action };
}
