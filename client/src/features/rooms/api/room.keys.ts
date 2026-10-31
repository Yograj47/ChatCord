export const ROOM_QUERY_KEYS = {
  all: ['rooms'] as const,
  lists: () => ['rooms', 'list'] as const,
  detail: (id: string) => ['rooms', 'detail', id] as const,
  members: (id: string, userId?: string) => ['room-members', id, userId] as const,
  memberScope: (id: string) => ['room-members', id] as const,
  invitations: (userId?: string) => ['room-invitations', userId] as const,
};
