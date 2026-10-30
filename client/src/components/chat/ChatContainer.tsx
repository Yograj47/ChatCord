import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "#hooks/useSocket";
import { socket } from "#lib/socket";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { type Message } from "./MessageItem";
import { useAppStore } from "../../stores/app.store";
import { useComposerStore } from "../../stores/composer.store";
import { ROOM_QUERY_KEYS, useRoomDetail, useRooms } from "#hooks/useRoom";
import { EditRoomModal } from "../modals/EditRoomModal";
import { RoomMembersDialog } from "../rooms/RoomMembersDialog";
import type { UpdateRoomDto } from "../../types/room";
import { useAuth } from "../../hooks/useAuth";
import { roomsApi } from "../../api/room.api";
import { api } from "../../lib/api";

interface StoredMessage {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
}
interface Acknowledgement {
  ok: boolean;
  error?: string;
  data?: StoredMessage;
}
function mergeMessages(existing: StoredMessage[], incoming: StoredMessage[]) {
  return [
    ...new Map(
      [...existing, ...incoming].map((message) => [message._id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a._id.localeCompare(b._id),
  );
}

export function ChatContainer() {
  const { roomId, dmId } = useParams<{ roomId?: string; dmId?: string }>();
  const requestedRoomId = roomId || dmId || null;
  return (
    <ChatConversation
      key={requestedRoomId ?? "empty"}
      requestedRoomId={requestedRoomId}
    />
  );
}

function ChatConversation({
  requestedRoomId,
}: {
  requestedRoomId: string | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionData } = useAuth();
  const { isConnected, socketId, error: socketError } = useSocket();
  const setActiveRoomId = useAppStore((state) => state.setActiveRoomId);
  const isEditRoomOpen = useAppStore((state) => state.isEditRoomOpen);
  const setEditRoomOpen = useAppStore((state) => state.setEditRoomOpen);
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useRoomDetail(requestedRoomId);
  const activeRoomId = room?._id ?? null;
  const { updateRoom, isUpdatingRoom } = useRooms();
  const {
    activeReplyTo,
    setReplyToMessage,
    clearReplyToMessage,
    resetComposer,
  } = useComposerStore();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [joined, setJoined] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const isMember = Boolean(
    !roomError &&
    room?.members.some((member) => member.userId === sessionData?.id),
  );
  const canManage =
    room?.type === "group" &&
    isMember &&
    room.members.some(
      (member) =>
        member.userId === sessionData?.id &&
        ["owner", "moderator"].includes(member.role),
    );
  const members = useQuery({
    queryKey: ["room-members", activeRoomId, sessionData?.id],
    queryFn: () => roomsApi.getMembers(activeRoomId!),
    enabled: Boolean(activeRoomId && isMember),
    retry: false,
  });
  const connectionKey =
    activeRoomId && socketId ? `${activeRoomId}:${socketId}` : "";
  const ready = Boolean(
    isConnected && isMember && connectionKey && joined === connectionKey,
  );

  useEffect(() => {
    if (activeRoomId) setActiveRoomId(activeRoomId);
  }, [activeRoomId, setActiveRoomId]);
  useEffect(() => {
    resetComposer();
  }, [activeRoomId, resetComposer]);

  useEffect(() => {
    if (!activeRoomId || !isMember) return;
    const controller = new AbortController();
    api
      .get<StoredMessage[]>(`/rooms/${activeRoomId}/messages`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        setMessages((existing) => mergeMessages(existing, data));
        setHistoryError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setHistoryError(true);
      });
    return () => controller.abort();
  }, [activeRoomId, isMember, joined]);

  useEffect(() => {
    if (!activeRoomId || !isMember || !isConnected || !connectionKey) return;
    let active = true;
    const handleMessage = (message: StoredMessage) => {
      if (message.roomId === activeRoomId)
        setMessages((existing) => mergeMessages(existing, [message]));
    };
    const handleChanged = ({ roomId }: { roomId: string }) => {
      if (roomId !== activeRoomId) return;
      void queryClient.invalidateQueries({
        queryKey: ROOM_QUERY_KEYS.detail(activeRoomId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["room-members", activeRoomId],
      });
    };
    const handleRevoked = ({ roomId }: { roomId: string }) => {
      if (roomId !== activeRoomId) return;
      setJoined("");
      setActiveRoomId(null);
      queryClient.removeQueries({
        queryKey: ROOM_QUERY_KEYS.detail(activeRoomId),
      });
      queryClient.removeQueries({ queryKey: ["room-members", activeRoomId] });
      void queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
      navigate("/app");
    };
    socket.on("new-message", handleMessage);
    socket.on("room-members-changed", handleChanged);
    socket.on("room-access-revoked", handleRevoked);
    socket
      .timeout(10000)
      .emit(
        "join-room",
        { roomId: activeRoomId },
        (error: Error | null, response?: Acknowledgement) => {
          if (!active) return;
          if (error || !response?.ok) {
            setMessageError(
              response?.error ??
                "Could not join this conversation. Check your connection and access.",
            );
            return;
          }
          setJoined(connectionKey);
          setMessageError(null);
        },
      );
    return () => {
      active = false;
      socket.emit("leave-room", { roomId: activeRoomId });
      socket.off("new-message", handleMessage);
      socket.off("room-members-changed", handleChanged);
      socket.off("room-access-revoked", handleRevoked);
    };
  }, [
    activeRoomId,
    isMember,
    isConnected,
    connectionKey,
    navigate,
    queryClient,
    setActiveRoomId,
  ]);

  const handleSend = (content: string): Promise<boolean> => {
    if (!ready || !activeRoomId) return Promise.resolve(false);
    setMessageError(null);
    return new Promise((resolve) => {
      socket
        .timeout(10000)
        .emit(
          "send-message",
          { roomId: activeRoomId, content },
          (error: Error | null, response?: Acknowledgement) => {
            if (error || !response?.ok || !response.data) {
              setMessageError(
                response?.error ??
                  "Delivery was not confirmed. Check history before retrying.",
              );
              resolve(false);
              return;
            }
            setMessages((existing) =>
              mergeMessages(existing, [response.data!]),
            );
            clearReplyToMessage();
            resolve(true);
          },
        );
    });
  };

  const displayName =
    room?.name ||
    (room?.type === "dm"
      ? (members.data?.find((member) => member.id !== sessionData?.id)
          ?.displayName ?? "Direct message")
      : isLoadingRoom
        ? "Loading room…"
        : "Conversation");
  const toMessage = useCallback(
    (message: StoredMessage): Message => {
      const name =
        message.senderId === sessionData?.id
          ? "You"
          : (members.data?.find((member) => member.id === message.senderId)
              ?.displayName ?? "Member");
      return {
        id: message._id,
        content: message.content,
        senderName: name,
        senderInitials: name.slice(0, 2).toUpperCase(),
        isSelf: message.senderId === sessionData?.id,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    },
    [sessionData?.id, members.data],
  );
  const invite = () => {
    setMembersOpen(false);
    if (activeRoomId)
      navigate(`/app/invitations?view=send&room=${activeRoomId}`);
  };
  const update = async (payload: UpdateRoomDto) => {
    if (!activeRoomId) return;
    await updateRoom({ roomId: activeRoomId, dto: payload });
    setEditRoomOpen(false);
  };
  const disabledReason = isLoadingRoom ? 'Loading conversation…' : !isMember
    ? "Join this room to send messages."
    : !room?.capabilities.includes("text")
      ? "Text messages are disabled in this room."
      : !ready
        ? (socketError ?? "Connecting to the conversation…")
        : undefined;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#0b0c10]">
      <ChatHeader
        roomName={displayName}
        topic={room?.description || (ready ? "Connected" : "Connecting…")}
        onOpenEdit={() => setEditRoomOpen(true)}
        onInvite={invite}
        canManageRoom={canManage}
        onOpenMembers={() => setMembersOpen(true)}
        memberCount={room?.members.length ?? 0}
      />
      <div role="status" className="px-4 pt-2 text-xs text-zinc-500">
        {ready
          ? "Connected"
          : (socketError ??
            (isMember ? "Connecting…" : "Read-only · join to participate"))}
      </div>
      {(messageError || historyError || roomError) && (
        <div role="alert" className="px-4 py-2 text-sm text-rose-300">
          {roomError
            ? "This conversation is unavailable or you do not have access."
            : (messageError ??
              "Could not load message history. Reconnect or reload to try again.")}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={messages.map(toMessage)}
          onReplyInInput={(message) =>
            setReplyToMessage({
              messageId: message.id,
              senderName: message.senderName,
              contentSnippet: message.content,
            })
          }
        />
      </div>
      <MessageInput
        channelName={displayName}
        onSendMessage={handleSend}
        disabled={Boolean(disabledReason)}
        disabledReason={disabledReason}
        replyingTo={
          activeReplyTo
            ? {
                messageId: activeReplyTo.messageId,
                senderName: activeReplyTo.senderName,
                content: activeReplyTo.contentSnippet,
              }
            : null
        }
        onCancelReply={clearReplyToMessage}
      />
      {room && sessionData?.id && membersOpen && (
        <RoomMembersDialog
          room={room}
          userId={sessionData.id}
          onClose={() => setMembersOpen(false)}
          onInvite={invite}
        />
      )}
      {activeRoomId && canManage && (
        <EditRoomModal
          isOpen={isEditRoomOpen}
          onClose={() => setEditRoomOpen(false)}
          roomName={room?.name || ""}
          roomDescription={room?.description}
          onUpdateRoom={update}
          isUpdating={isUpdatingRoom}
        />
      )}
    </div>
  );
}
