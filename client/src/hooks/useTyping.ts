import { useCallback, useEffect, useRef, useState } from "react";
import { realtimeApi } from "../api/realtime.api";
import { socket } from "../lib/socket";
import type { TypingEvent } from "../types/realtime";

export function useTyping(roomId: string, userId: string, enabled: boolean) {
  const [users, setUsers] = useState<string[]>([]);
  const leases = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastStart = useRef(0);
  const active = useRef(false);
  const stop = useCallback(() => {
    clearTimeout(idle.current);
    if (active.current) realtimeApi.setTyping(roomId, false);
    active.current = false;
    lastStart.current = 0;
  }, [roomId]);
  const onTypingChange = useCallback(
    (typing: boolean) => {
      if (!typing || !enabled || !socket.connected) {
        stop();
        return;
      }
      const now = Date.now();
      if (!active.current || now - lastStart.current >= 2000) {
        realtimeApi.setTyping(roomId, true);
        lastStart.current = now;
        active.current = true;
      }
      clearTimeout(idle.current);
      idle.current = setTimeout(stop, 3000);
    },
    [enabled, roomId, stop],
  );
  useEffect(() => {
    if (!enabled || !roomId || !userId) return;
    let current = true;
    const timers = leases.current;
    const remove = (id: string) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      setUsers((previous) => previous.filter((user) => user !== id));
    };
    const add = (id: string) => {
      if (id === userId) return;
      clearTimeout(timers.get(id));
      setUsers((previous) => [...new Set([...previous, id])]);
      timers.set(
        id,
        setTimeout(() => remove(id), 6000),
      );
    };
    const start = (event: TypingEvent) => {
      if (event.roomId === roomId) add(event.userId);
    };
    const end = (event: TypingEvent) => {
      if (event.roomId === roomId) remove(event.userId);
    };
    const reset = () => {
      timers.forEach(clearTimeout);
      timers.clear();
      setUsers([]);
      stop();
    };
    const revoked = (event: { roomId: string }) => {
      if (event.roomId === roomId) reset();
    };
    socket.on("user-typing", start);
    socket.on("user-stopped-typing", end);
    socket.on("disconnect", reset);
    socket.on("room-access-revoked", revoked);
    void realtimeApi
      .getTyping(roomId)
      .then((snapshot) => {
        if (current) {
          setUsers([]);
          snapshot.userIds?.forEach(add);
        }
      })
      .catch(() => {});
    return () => {
      current = false;
      timers.forEach(clearTimeout);
      timers.clear();
      stop();
      socket.off("user-typing", start);
      socket.off("user-stopped-typing", end);
      socket.off("disconnect", reset);
      socket.off("room-access-revoked", revoked);
    };
  }, [roomId, userId, enabled, stop]);
  return {
    typingUserIds: enabled ? users : [],
    onTypingChange,
    stopTyping: stop,
  };
}
