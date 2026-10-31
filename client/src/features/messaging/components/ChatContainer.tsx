import { useSession } from '@/features/auth/hooks/useSession';
import { ChatHeader } from '@/features/messaging/components/ChatHeader';
import { MessageDialog } from '@/features/messaging/components/MessageDialog';
import { MessageInput } from '@/features/messaging/components/MessageInput';
import { MessageList } from '@/features/messaging/components/MessageList';
import { MessageReplies } from '@/features/messaging/components/MessageReplies';
import { MessageSearch } from '@/features/messaging/components/MessageSearch';
import { TypingIndicator } from '@/features/messaging/components/TypingIndicator';
import { useConversationConnection } from '@/features/messaging/hooks/useConversationConnection';
import { useMessageMutations, useMessages } from '@/features/messaging/hooks/useMessages';
import { toMessageView } from '@/features/messaging/lib/message-view';
import { useComposerStore } from '@/features/messaging/stores/composer.store';
import type { StoredMessage } from '@/features/messaging/types/message.types';
import { usePresence } from '@/features/realtime/hooks/usePresence';
import { useTyping } from '@/features/realtime/hooks/useTyping';
import { EditRoomModal } from '@/features/rooms/components/EditRoomModal';
import { RoomMembersDialog } from '@/features/rooms/components/RoomMembersDialog';
import { useRoomDetail, useRoomMembers, useUpdateRoom } from '@/features/rooms/hooks/useRooms';
import { useRoomUiStore } from '@/features/rooms/stores/room-ui.store';
import type { UpdateRoomDto } from '@/features/rooms/types/room.types';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ChatContainer() {
  const { roomId, dmId } = useParams<{ roomId?: string; dmId?: string }>();
  const requestedRoomId = roomId || dmId || null;
  return <ChatConversation key={requestedRoomId ?? 'empty'} requestedRoomId={requestedRoomId} />;
}

function ChatConversation({ requestedRoomId }: { requestedRoomId: string | null }) {
  const navigate = useNavigate();
  const { messageId: routeReplyId } = useParams<{ messageId?: string }>();
  const { sessionData } = useSession();

  const isEditRoomOpen = useRoomUiStore((state) => state.isEditRoomOpen);
  const setEditRoomOpen = useRoomUiStore((state) => state.setEditRoomOpen);
  const { data: room, isLoading: isLoadingRoom, error: roomError } = useRoomDetail(requestedRoomId);
  const activeRoomId = room?._id ?? null;
  const { updateRoom, isUpdatingRoom } = useUpdateRoom();
  const { activeReplyTo, setReplyToMessage, clearReplyToMessage, resetComposer } =
    useComposerStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [messageDialog, setMessageDialog] = useState<{
    message: StoredMessage;
    mode: 'edit' | 'delete';
  } | null>(null);
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const isMember = Boolean(
    !roomError && room?.members.some((member) => member.userId === sessionData?.id),
  );
  const canManage =
    room?.type === 'group' &&
    isMember &&
    room.members.some(
      (member) => member.userId === sessionData?.id && ['owner', 'moderator'].includes(member.role),
    );
  const messageQuery = useMessages(
    activeRoomId ?? '',
    sessionData?.id ?? '',
    isMember,
    debouncedSearch,
  );
  const { messages } = messageQuery;
  const messageActions = useMessageMutations(activeRoomId ?? '', sessionData?.id ?? '');

  const members = useRoomMembers(activeRoomId, sessionData?.id, isMember);
  const { ready, messageError, setMessageError, socketError } = useConversationConnection(
    activeRoomId,
    isMember,
    sessionData?.id ?? '',
  );
  const typing = useTyping(
    activeRoomId ?? '',
    sessionData?.id ?? '',
    ready && Boolean(room?.capabilities.includes('text')),
  );
  const presence = usePresence(
    isMember ? (room?.members.map((member) => member.userId) ?? []) : [],
  );
  const peerId = room?.members.find((member) => member.userId !== sessionData?.id)?.userId;
  const peerStatus = peerId ? presence.status(peerId) : 'unknown';
  const typingNames = typing.typingUserIds
    .filter((id) => room?.members.some((member) => member.userId === id))
    .map((id) => members.data?.find((member) => member.id === id)?.displayName ?? 'Someone');

  useEffect(() => {
    resetComposer();
  }, [activeRoomId, resetComposer]);

  const handleSend = async (content: string): Promise<boolean> => {
    if (!ready || !activeRoomId) return false;
    setMessageError(null);
    try {
      await messageActions.send.mutateAsync({
        content,
        replyTo: activeReplyTo?.messageId,
      });
      clearReplyToMessage();
      return true;
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Could not send message.');
      return false;
    }
  };

  const displayName =
    room?.name ||
    (room?.type === 'dm'
      ? (members.data?.find((member) => member.id !== sessionData?.id)?.displayName ??
        'Direct message')
      : isLoadingRoom
        ? 'Loading room…'
        : 'Conversation');
  const toMessage = useCallback(
    (message: StoredMessage) => toMessageView(message, sessionData?.id, members.data),
    [sessionData?.id, members.data],
  );
  const invite = () => {
    setMembersOpen(false);
    if (activeRoomId) void navigate(`/app/invitations?view=send&room=${activeRoomId}`);
  };
  const update = async (payload: UpdateRoomDto) => {
    if (!activeRoomId) return;
    await updateRoom({ roomId: activeRoomId, dto: payload });
    setEditRoomOpen(false);
  };
  const disabledReason = isLoadingRoom
    ? 'Loading conversation…'
    : !isMember
      ? 'Join this room to send messages.'
      : !room?.capabilities.includes('text')
        ? 'Text messages are disabled in this room.'
        : !ready
          ? (socketError ?? 'Connecting to the conversation…')
          : undefined;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <ChatHeader
        roomName={displayName}
        topic={
          room?.type === 'dm'
            ? peerStatus === 'online'
              ? 'Online'
              : peerStatus === 'offline'
                ? 'Offline'
                : 'Status unavailable'
            : room?.description || (ready ? 'Connected' : 'Connecting…')
        }
        onOpenEdit={() => setEditRoomOpen(true)}
        onInvite={invite}
        canManageRoom={canManage}
        onOpenMembers={() => setMembersOpen(true)}
        memberCount={room?.members.length ?? 0}
      />
      <div role="status" className="px-4 pt-2 text-xs text-zinc-500">
        {ready
          ? 'Connected'
          : (socketError ?? (isMember ? 'Connecting…' : 'Read-only · join to participate'))}
      </div>
      {isMember && (
        <MessageSearch
          value={search}
          onChange={setSearch}
          searching={messageQuery.isFetching && Boolean(search)}
        />
      )}
      {(messageError || messageQuery.isError || roomError) && (
        <div role="alert" className="px-4 py-2 text-sm text-rose-300">
          {roomError
            ? 'This conversation is unavailable or you do not have access.'
            : (messageError ?? 'Could not load message history. Reconnect or reload to try again.')}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messageQuery.isPending && isMember && (
          <p role="status" className="p-4 text-xs text-zinc-400">
            Loading messages…
          </p>
        )}
        {messageQuery.isError && (
          <button className="p-4 text-indigo-300" onClick={() => void messageQuery.refetch()}>
            Retry history
          </button>
        )}
        {messageQuery.hasNextPage && (
          <button
            className="w-full p-3 text-xs text-indigo-300"
            disabled={messageQuery.isFetchingNextPage}
            onClick={() => void messageQuery.fetchNextPage()}
          >
            {messageQuery.isFetchingNextPage ? 'Loading…' : 'Load older messages'}
          </button>
        )}
        {!messageQuery.isPending && !messageQuery.isError && isMember && messages.length === 0 && (
          <p className="p-4 text-xs text-zinc-400">
            {debouncedSearch ? 'No matching messages.' : 'No messages yet.'}
          </p>
        )}
        <MessageList
          messages={messages.map(toMessage)}
          onEditMessage={(id) => {
            const message = messages.find((item) => item._id === id);
            if (message) setMessageDialog({ message, mode: 'edit' });
          }}
          onDeleteMessage={(id) => {
            const message = messages.find((item) => item._id === id);
            if (message) setMessageDialog({ message, mode: 'delete' });
          }}
          onOpenReplies={setReplyMessageId}
          onReact={(id, emoji) => {
            const message = messages.find((item) => item._id === id);
            const add = !message?.reactions?.some(
              (reaction) => reaction.emoji === emoji && reaction.userId === sessionData?.id,
            );
            if (!messageActions.react.isPending)
              void messageActions.react.mutateAsync({ id, emoji, add }).catch(() => {});
          }}
          onReplyInInput={(message) =>
            setReplyToMessage({
              messageId: message.id,
              senderName: message.senderName,
              contentSnippet: message.content,
            })
          }
        />
      </div>
      <TypingIndicator users={typingNames} />
      <MessageInput
        onTypingChange={typing.onTypingChange}
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
      {messageDialog && activeRoomId && sessionData?.id && (
        <MessageDialog
          key={messageDialog.message._id}
          {...messageDialog}
          roomId={activeRoomId}
          userId={sessionData.id}
          onClose={() => setMessageDialog(null)}
        />
      )}
      {(replyMessageId || routeReplyId) && activeRoomId && sessionData?.id && isMember && (
        <MessageReplies
          key={replyMessageId ?? routeReplyId}
          roomId={activeRoomId}
          userId={sessionData.id}
          messageId={(replyMessageId ?? routeReplyId)!}
          canSend={ready && Boolean(room?.capabilities.includes('text'))}
          onClose={() => {
            setReplyMessageId(null);
            if (routeReplyId) void navigate(`/app/rooms/${activeRoomId}`);
          }}
          nameFor={(id) =>
            id === sessionData.id
              ? 'You'
              : (members.data?.find((member) => member.id === id)?.displayName ?? 'Member')
          }
        />
      )}
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
          roomName={room?.name || ''}
          roomDescription={room?.description}
          onUpdateRoom={update}
          isUpdating={isUpdatingRoom}
        />
      )}
    </div>
  );
}
