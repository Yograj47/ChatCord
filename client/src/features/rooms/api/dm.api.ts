import type { DmRoom, Room } from '@/features/rooms/types/room.types';
import { api } from '@/shared/api/http-client';

export const dmsApi = {
  async list() {
    return (await api.get<DmRoom[]>('/dms')).data;
  },
  async create(userId: string) {
    return (await api.post<Room>('/dms', { userId })).data;
  },
};
