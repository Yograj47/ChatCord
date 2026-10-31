import { api } from "../lib/api";
import type { Room } from "../types/room";

export interface PublicUser {
  _id: string;
  username?: string;
  displayName: string;
  avatar?: { url: string; source: string };
}
export interface Friendship {
  id: string;
  user: PublicUser;
}
export interface FriendRequest {
  _id: string;
  requester: PublicUser | null;
  recipient: PublicUser | null;
  createdAt: string;
}
interface SearchUser extends Omit<PublicUser, "_id"> {
  id: string;
}
export interface DmRoom extends Omit<Room, "members"> {
  members: { userId: PublicUser | null; role: string }[];
}

export const socialApi = {
  listDms: async () => (await api.get<DmRoom[]>("/dms")).data,
  friends: async () => (await api.get<Friendship[]>("/friendships")).data,
  requests: async () =>
    (await api.get<FriendRequest[]>("/friendships/requests")).data,
  searchUsers: async (
    q: string,
    signal?: AbortSignal,
  ): Promise<PublicUser[]> => {
    const { data } = await api.get<SearchUser[]>("/auth/users/search", {
      params: { q },
      signal,
    });
    return data.map(({ id, ...user }) => ({ ...user, _id: id }));
  },
  sendRequest: async (recipientId: string) =>
    (
      await api.post<{ id: string; status: "pending" }>(
        "/friendships/requests",
        { recipientId },
      )
    ).data,
  acceptRequest: async (id: string) =>
    (
      await api.patch<{ id: string; status: "accepted" }>(
        `/friendships/requests/${id}/accept`,
      )
    ).data,
  declineRequest: async (id: string) =>
    (await api.delete(`/friendships/requests/${id}/decline`)).data,
  cancelRequest: async (id: string) =>
    (await api.delete(`/friendships/requests/${id}/cancel`)).data,
  removeFriend: async (id: string) =>
    (await api.delete(`/friendships/${id}`)).data,
  createDm: async (userId: string) =>
    (await api.post<Room>("/dms", { userId })).data,
};
