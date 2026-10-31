import { socket } from "../lib/socket";
import type { PresenceSnapshot, TypingSnapshot } from "../types/realtime";

function request<T extends { ok: boolean; error?: string }>(
  event: string,
  payload: unknown,
): Promise<T> {
  if (!socket.connected)
    return Promise.reject(new Error("Realtime connection unavailable."));
  return new Promise((resolve, reject) => {
    socket
      .timeout(10000)
      .emit(event, payload, (error: Error | null, response?: T) => {
        if (error || !response?.ok)
          reject(
            new Error(response?.error ?? "Realtime request was not confirmed."),
          );
        else resolve(response);
      });
  });
}

export const realtimeApi = {
  syncPresence: (userIds: string[]) =>
    request<PresenceSnapshot>("presence-sync", { userIds }),
  getTyping: (roomId: string) =>
    request<TypingSnapshot>("typing-state", { roomId }),
  setTyping: (roomId: string, typing: boolean) => {
    // Never buffer transient typing events for delivery after reconnection.
    if (socket.connected)
      socket.volatile.emit(typing ? "typing-start" : "typing-stop", { roomId });
  },
};
