import { useQuery } from "@tanstack/react-query";
import { roomsApi } from "../api/room.api";

export const invitationKey = (userId?: string) =>
  ["room-invitations", userId] as const;

export function useInvitations(userId?: string) {
  return useQuery({
    queryKey: invitationKey(userId),
    queryFn: roomsApi.getInvitations,
    enabled: Boolean(userId),
    refetchInterval: 30000,
    retry: 1,
  });
}
