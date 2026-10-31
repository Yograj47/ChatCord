export type PresenceStatus = "online" | "offline" | "unknown";
export interface PresenceUser {
  userId: string;
  online: boolean;
}
export interface PresenceSnapshot {
  ok: boolean;
  users?: PresenceUser[];
  error?: string;
}
export interface TypingEvent {
  roomId: string;
  userId: string;
}
export interface TypingSnapshot {
  ok: boolean;
  userIds?: string[];
  error?: string;
}
