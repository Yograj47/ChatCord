import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '#hooks/useSocket';
import { socket } from '#lib/socket';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { type Message } from './MessageItem';
import { useAppStore } from '../../stores/app.store';
import { useComposerStore } from '../../stores/composer.store';
import { useRoomDetail } from '#hooks/useRoom';

export const ChatContainer: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const activeRoomId = roomId || null;

  const { isConnected } = useSocket();
  const setActiveRoomId = useAppStore((s) => s.setActiveRoomId);

  console.log(roomId);
  
  // Fetch real room details using TanStack Query
  const { data: room, isLoading: isLoadingRoom } = useRoomDetail(activeRoomId);

  const {
    activeReplyTo,
    setReplyToMessage,
    clearReplyToMessage,
    resetComposer,
  } = useComposerStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Sync active room ID to store
  useEffect(() => {
    if (activeRoomId) {
      setActiveRoomId(activeRoomId);
    }
  }, [activeRoomId, setActiveRoomId]);

  // Reset composer on room change
  useEffect(() => {
    resetComposer();
    setMessages([]); // Reset messages placeholder for new room
  }, [activeRoomId, resetComposer]);

  // Handle Socket Room Joins & Events
  useEffect(() => {
    if (!activeRoomId || !isConnected) return;

    // Join room socket channel
    socket.emit('join_room', { roomId: activeRoomId });

    // Listen for incoming messages (stub for upcoming message integration)
    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('room_message', handleNewMessage);

    return () => {
      socket.emit('leave_room', { roomId: activeRoomId });
      socket.off('room_message', handleNewMessage);
    };
  }, [activeRoomId, isConnected]);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderName: 'You',
      senderInitials: 'ME',
      senderAvatarBg: 'bg-indigo-600',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyingTo: activeReplyTo
        ? {
            messageId: activeReplyTo.messageId,
            senderName: activeReplyTo.senderName,
            content: activeReplyTo.contentSnippet,
          }
        : null,
    };

    // Emit message over socket if connected
    if (activeRoomId && isConnected) {
      socket.emit('send_message', { roomId: activeRoomId, content, replyTo: activeReplyTo?.messageId });
    }

    setMessages((prev) => [...prev, newMessage]);
    clearReplyToMessage();
  };

  const handleReplyInInput = (msg: Message) => {
    setReplyToMessage({
      messageId: msg.id,
      senderName: msg.senderName,
      contentSnippet: msg.content,
    });
  };

  const roomDisplayName = room?.name || (isLoadingRoom ? 'Loading room...' : 'Select a room');
  const roomTopic = room?.description || `Connected to ChatCord (${isConnected ? 'Live' : 'Connecting...'})`;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0b0c10] overflow-hidden">
      <ChatHeader
        roomName={roomDisplayName}
        topic={roomTopic}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={messages}
          onReplyInInput={handleReplyInInput}
        />
      </div>

      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

      <MessageInput
        channelName={roomDisplayName}
        onSendMessage={handleSendMessage}
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
    </div>
  );
};