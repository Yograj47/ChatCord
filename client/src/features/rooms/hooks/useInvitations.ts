import { roomsApi } from '@/features/rooms/api/room.api';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { useQuery } from '@tanstack/react-query';

export const invitationKey = ROOM_QUERY_KEYS.invitations;

export function useInvitations(userId?: string) {
  return useQuery({
    queryKey: invitationKey(userId),
    queryFn: roomsApi.getInvitations,
    enabled: Boolean(userId),
    refetchInterval: 30000,
    retry: 1,
  });
}
