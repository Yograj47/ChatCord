import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import type { QueryClient } from '@tanstack/react-query';

export function invalidateRoomState(client: QueryClient, roomId?: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() }),
    ...(roomId
      ? [
          client.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(roomId) }),
          client.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.memberScope(roomId) }),
        ]
      : []),
  ]);
}
