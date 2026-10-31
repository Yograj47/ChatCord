export const MESSAGE_QUERY_KEYS = {
  room: (roomId: string, userId: string) => ['messages', roomId, userId] as const,
  detail: (roomId: string, userId: string, id: string) =>
    ['messages', roomId, userId, 'detail', id] as const,
};
