import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { messagesApi } from "../api/message.api";
import { socket } from "../lib/socket";
import { showError } from "../lib/toast";
import type {
  CreateMessageDto,
  MessageAcknowledgement,
  StoredMessage,
} from "../types/message";

export const MESSAGE_QUERY_KEYS = {
  room: (roomId: string, userId: string) =>
    ["messages", roomId, userId] as const,
  detail: (roomId: string, userId: string, id: string) =>
    ["messages", roomId, userId, "detail", id] as const,
};

export function useMessages(
  roomId: string,
  userId: string,
  enabled: boolean,
  q = "",
  replyTo?: string,
) {
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: [
      ...MESSAGE_QUERY_KEYS.room(roomId, userId),
      "pages",
      q,
      replyTo ?? "",
    ],
    queryFn: ({ pageParam, signal }) =>
      messagesApi.getPage(
        roomId,
        { before: pageParam, q: q || undefined, replyTo, limit: 30 },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(enabled && roomId && userId),
    retry: false,
  });
  useEffect(() => {
    if (!enabled || !roomId || !userId) return;
    const refresh = (message: StoredMessage) => {
      if (message.roomId === roomId)
        void client.invalidateQueries({
          queryKey: MESSAGE_QUERY_KEYS.room(roomId, userId),
        });
    };
    socket.on("new-message", refresh);
    socket.on("message-updated", refresh);
    return () => {
      socket.off("new-message", refresh);
      socket.off("message-updated", refresh);
    };
  }, [roomId, userId, enabled, client]);
  const messages = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.items) ?? []).map((message) => [
        message._id,
        message,
      ]),
    ).values(),
  ].sort((a, b) => a._id.localeCompare(b._id));
  return { ...query, messages };
}

export function useMessageDetail(roomId: string, userId: string, id: string) {
  return useQuery({
    queryKey: MESSAGE_QUERY_KEYS.detail(roomId, userId, id),
    queryFn: ({ signal }) => messagesApi.getMessage(roomId, id, signal),
    enabled: Boolean(roomId && userId && id),
    retry: false,
  });
}

export function useMessageMutations(roomId: string, userId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({
      queryKey: MESSAGE_QUERY_KEYS.room(roomId, userId),
    });
  const onError = (error: unknown) => {
    const message = isAxiosError<{ message?: string | string[] }>(error)
      ? error.response?.data?.message
      : undefined;
    showError(
      Array.isArray(message)
        ? message.join(" ")
        : (message ??
            (error instanceof Error
              ? error.message
              : "Message action failed.")),
    );
  };
  const send = useMutation({
    mutationFn: (dto: CreateMessageDto) =>
      new Promise<StoredMessage>((resolve, reject) => {
        socket
          .timeout(10000)
          .emit(
            "send-message",
            { roomId, ...dto },
            (error: Error | null, response?: MessageAcknowledgement) => {
              if (error || !response?.ok || !response.data)
                reject(
                  new Error(
                    response?.error ??
                      "Delivery was not confirmed. Check history before retrying.",
                  ),
                );
              else resolve(response.data);
            },
          );
      }),
    onSuccess: refresh,
    onError,
  });
  const edit = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      messagesApi.updateMessage(roomId, id, { content }),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => messagesApi.deleteMessage(roomId, id),
    onSuccess: refresh,
    onError,
  });
  const react = useMutation({
    mutationFn: ({
      id,
      emoji,
      add,
    }: {
      id: string;
      emoji: string;
      add: boolean;
    }) => messagesApi.setReaction(roomId, id, emoji, add),
    onSuccess: refresh,
    onError,
  });
  return { send, edit, remove, react };
}
