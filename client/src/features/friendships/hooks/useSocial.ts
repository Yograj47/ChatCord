import { usersApi } from '@/features/auth/api/user.api';
import { socialApi } from '@/features/friendships/api/social.api';
import { SOCIAL_QUERY_KEYS } from '@/features/friendships/api/social.keys';
import { dmsApi } from '@/features/rooms/api/dm.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useFriends(userId?: string, enabled = true) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.friends(userId),
    queryFn: socialApi.friends,
    enabled: Boolean(userId && enabled),
    refetchInterval: 30000,
  });
}
export function useFriendRequests(userId: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.requests(userId),
    queryFn: socialApi.requests,
    refetchInterval: 30000,
  });
}
export function useDirectMessages(userId?: string) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.dms(userId),
    queryFn: dmsApi.list,
    enabled: Boolean(userId),
  });
}
export function useUserSearch(userId: string, query: string, enabled: boolean) {
  return useQuery({
    queryKey: SOCIAL_QUERY_KEYS.search(userId, query),
    queryFn: ({ signal }) => usersApi.search(query, signal),
    enabled,
    staleTime: 30000,
    retry: false,
  });
}
export function useCreateDm(userId: string | undefined, onCreated: (id: string) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: dmsApi.create,
    onSuccess: async (room) => {
      await client.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.dms(userId) });
      onCreated(room._id);
    },
  });
}
