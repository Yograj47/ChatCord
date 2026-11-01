import type { Message, StoredMessage } from '@/features/messaging/types/message.types';
import type { RoomMemberProfile } from '@/features/rooms/types/room.types';

export function toMessageView(
  message: StoredMessage,
  viewerId?: string,
  members?: RoomMemberProfile[],
  historySince?: string,
): Message {
  const name =
    message.senderId === viewerId
      ? 'You'
      : (members?.find((member) => member.id === message.senderId)?.displayName ?? 'Member');
  const sender = members?.find((member) => member.id === message.senderId);
  return {
    id: message._id,
    kind: message.kind,
    systemEvent: message.systemEvent,
    roomId: message.roomId,
    viewerId: viewerId,
    replyToId: message.replyTo,
    isDeleted: Boolean(message.deletedAt),
    isEdited: Boolean(message.editedAt),
    reactions: [...new Set(message.reactions?.map((reaction) => reaction.emoji) ?? [])].map(
      (emoji) => {
        const users = (message.reactions ?? [])
          .filter((reaction) => reaction.emoji === emoji)
          .map((reaction) => reaction.userId);
        return {
          emoji,
          count: users.length,
          users,
          hasReacted: users.includes(viewerId ?? ''),
        };
      },
    ),
    content: message.content,
    senderName: name,
    historySince,
    senderAvatarUrl: sender?.avatar?.url,
    senderInitials: name.slice(0, 2).toUpperCase(),
    isSelf: message.senderId === viewerId,
    timestamp: new Date(message.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
