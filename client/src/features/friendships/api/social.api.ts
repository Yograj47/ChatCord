import type { FriendRequest, Friendship } from '@/features/friendships/types/social.types';
import { api } from '@/shared/api/http-client';

export const socialApi = {
  friends: async () => (await api.get<Friendship[]>('/friendships')).data,
  requests: async () => (await api.get<FriendRequest[]>('/friendships/requests')).data,

  sendRequest: async (recipientId: string) =>
    (await api.post<{ id: string; status: 'pending' }>('/friendships/requests', { recipientId }))
      .data,
  acceptRequest: async (id: string) =>
    (await api.patch<{ id: string; status: 'accepted' }>(`/friendships/requests/${id}/accept`))
      .data,
  declineRequest: async (id: string): Promise<void> => {
    await api.delete(`/friendships/requests/${id}/decline`);
  },
  cancelRequest: async (id: string): Promise<void> => {
    await api.delete(`/friendships/requests/${id}/cancel`);
  },
  removeFriend: async (id: string): Promise<void> => {
    await api.delete(`/friendships/${id}`);
  },
};
