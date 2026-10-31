import type { PublicUser } from '@/features/auth/types/auth.types';
import { roomsApi } from '@/features/rooms/api/room.api';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { showSuccess } from '@/shared/lib/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSendInvitation(roomId: string, onSent: (id: string, expiresAt: string) => void) {
  const queryClient = useQueryClient();
  const send = useMutation({
    mutationFn: (user: PublicUser) => roomsApi.addMember(roomId, user._id),
    onSuccess: (invitation, user) => {
      onSent(user._id, invitation.expiresAt);
      showSuccess(`Invitation sent to ${user.displayName}.`);
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: ROOM_QUERY_KEYS.lists(),
      });
    },
  });

  return send;
}
