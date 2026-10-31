export const SOCIAL_QUERY_KEYS = {
  friends: (userId?: string) => ['friends', userId] as const,
  requests: (userId?: string) => ['friend-requests', userId] as const,
  dms: (userId?: string) => ['dms', userId] as const,
  search: (userId: string, query: string) => ['user-search', userId, query] as const,
};
