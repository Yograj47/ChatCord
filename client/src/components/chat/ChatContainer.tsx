import React, { useState } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput, type ReplyingToState } from './MessageInput';
import { type Message } from './MessageItem';

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyingTo, setReplyingTo] = useState<ReplyingToState | null>(null);

  const handleSendMessage = (content: string, replyContext?: ReplyingToState | null) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderName: 'You',
      senderInitials: 'ME',
      senderAvatarBg: 'bg-indigo-600',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyingTo: replyContext || null,
    };

    setMessages((prev) => [...prev, newMessage]);
    setReplyingTo(null); // Auto-clear active reply preview
  };

  const handleReplyInInput = (msg: Message) => {
    setReplyingTo({
      messageId: msg.id,
      senderName: msg.senderName,
      content: msg.content,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0b0c10] overflow-hidden">
      <ChatHeader roomName="dev-general" />
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={messages}
          onReplyInInput={handleReplyInInput}
        />
      </div>

      <MessageInput
        channelName="dev-general"
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};