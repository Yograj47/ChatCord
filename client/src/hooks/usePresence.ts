import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { realtimeApi } from "../api/realtime.api";
import { socket } from "../lib/socket";
import { useSocket } from "./useSocket";
import { useAuth } from "./useAuth";
import type { PresenceSnapshot, PresenceStatus } from "../types/realtime";

export function usePresence(userIds: string[]) {
  const { sessionData } = useAuth();
  const { isConnected, socketId } = useSocket();
  const client = useQueryClient();
  const ids = [...new Set(userIds)].sort().slice(0, 100);
  const signature = ids.join(",");
  const userId =
    sessionData?.type === "registered" ? sessionData.id : undefined;
  const query = useQuery({
    queryKey: ["presence", userId, socketId, signature],
    queryFn: () =>
      realtimeApi.syncPresence(signature ? signature.split(",") : []),
    enabled: Boolean(userId && isConnected),
    refetchInterval: 20000,
    refetchIntervalInBackground: true,
    staleTime: 10000,
    retry: false,
  });
  useEffect(() => {
    if (!userId || !isConnected) return;
    const update =
      (online: boolean) =>
      ({ userId: changedId }: { userId: string }) => {
        client.setQueryData<PresenceSnapshot>(
          ["presence", userId, socketId, signature],
          (previous) =>
            previous
              ? {
                  ...previous,
                  users: previous.users?.map((user) =>
                    user.userId === changedId ? { ...user, online } : user,
                  ),
                }
              : previous,
        );
      };
    const onOnline = update(true);
    const onOffline = update(false);
    socket.on("user-online", onOnline);
    socket.on("user-offline", onOffline);
    return () => {
      socket.off("user-online", onOnline);
      socket.off("user-offline", onOffline);
    };
  }, [userId, isConnected, socketId, signature, client]);
  const status = (id: string): PresenceStatus => {
    if (!isConnected || !userId || query.isError) return "unknown";
    const user = query.data?.users?.find((user) => user.userId === id);
    return user ? (user.online ? "online" : "offline") : "unknown";
  };
  return { status, isConnected, error: query.error };
}
