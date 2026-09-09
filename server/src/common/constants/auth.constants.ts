export const AUTH_SESSION = {
  GUEST_TTL: 30 * 60 * 1000,
  REGISTERED_IDLE_TTL: 7 * 24 * 60 * 60 * 1000,
  REGISTERED_ABSOLUTE_TTL: 30 * 24 * 60 * 60 * 1000,
} as const;

export const AUTH_COOKIE = 'chatcord.sid';
