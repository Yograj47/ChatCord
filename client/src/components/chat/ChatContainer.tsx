import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '#hooks/useSocket';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { type Message } from './MessageItem';
import { useAppStore } from '../../stores/app.store';
import { useComposerStore } from '../../stores/composer.store';

export const ChatContainer: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const activeRoomId = roomId || 'dev-general';

  const { isConnected } = useSocket();

  const setActiveRoomId = useAppStore((s) => s.setActiveRoomId);
  const {
    activeReplyTo,
    setReplyToMessage,
    clearReplyToMessage,
    resetComposer,
  } = useComposerStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    setActiveRoomId(activeRoomId);
  }, [activeRoomId, setActiveRoomId]);

  useEffect(() => {
    resetComposer();
  }, [activeRoomId, resetComposer]);

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

    setMessages((prev) => [...prev, newMessage]);
    clearReplyToMessage();

    setTimeout(() => {
      setTypingUsers(['Alex']);
    }, 800);

    setTimeout(() => {
      setTypingUsers([]);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          senderName: 'Alex',
          senderInitials: 'AL',
          senderAvatarBg: 'bg-emerald-600',
          content: 'Got your message! Looks great.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 3000);
  };

  const handleReplyInInput = (msg: Message) => {
    setReplyToMessage({
      messageId: msg.id,
      senderName: msg.senderName,
      contentSnippet: msg.content,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0b0c10] overflow-hidden">
      <ChatHeader
        roomName={activeRoomId}
        topic={`General developer discussion (${isConnected ? 'Live' : 'Connecting...'})`}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={messages}
          onReplyInInput={handleReplyInInput}
        />
      </div>

      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

      <MessageInput
        channelName={activeRoomId}
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