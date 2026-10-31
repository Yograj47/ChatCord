import type { PublicUser } from '@/features/auth/types/auth.types';
import { api } from '@/shared/api/http-client';

interface SearchUser extends Omit<PublicUser, '_id'> {
  id: string;
}
export const usersApi = {
  async search(q: string, signal?: AbortSignal): Promise<PublicUser[]> {
    const { data } = await api.get<SearchUser[]>('/auth/users/search', { params: { q }, signal });
    return data.map(({ id, ...user }) => ({ ...user, _id: id }));
  },
};
