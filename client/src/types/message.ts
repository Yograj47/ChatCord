export interface StoredMessage {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  replyTo?: string | null;
  reactions?: { emoji: string; userId: string }[];
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageDto {
  content: string;
  replyTo?: string;
}
export interface UpdateMessageDto {
  content: string;
}
export interface MessagePage {
  items: StoredMessage[];
  nextCursor: string | null;
}
export interface MessageQuery {
  before?: string;
  limit?: number;
  q?: string;
  replyTo?: string;
}
export interface MessageAcknowledgement {
  ok: boolean;
  error?: string;
  data?: StoredMessage;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted?: boolean;
}

export interface QuotedReply { messageId: string; senderName: string; content: string }

export interface Message {
  id: string;
  roomId?: string;
  viewerId?: string;
  replyToId?: string | null;
  isDeleted?: boolean;
  isEdited?: boolean;
  senderName: string;
  senderInitials: string;
  senderAvatarBg?: string;
  content: string;
  timestamp: string;
  isSelf?: boolean;
  replyCount?: number;
  lastReplyTime?: string;
  reactions?: Reaction[];
  isPinned?: boolean;
  replyingTo?: QuotedReply | null;
}
