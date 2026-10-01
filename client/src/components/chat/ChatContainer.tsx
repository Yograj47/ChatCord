import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { type Message } from './MessageItem';

interface ChatContainerProps {
  roomId?: string;
  topic?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderName: 'Julian Reyes',
    senderInitials: 'JR',
    senderAvatarBg: 'bg-indigo-600',
    content: 'Hey team, welcome! WebSocket gateway is connected.',
    timestamp: '10:14 AM',
  },
  {
    id: 'm2',
    senderName: 'Mara Voss',
    senderInitials: 'MV',
    senderAvatarBg: 'bg-emerald-600',
    content: 'Awesome! Latency looks stable at ~24ms.',
    timestamp: '10:16 AM',
  },
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  roomId: propRoomId,
  topic = 'General developer channel and realtime updates',
}) => {
  // Read params from URL router if not explicitly passed as props
  const params = useParams<{ roomId?: string; dmId?: string; messageId?: string }>();
  const activeRoomId = propRoomId || params.roomId || params.dmId || 'dev-general';

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderName: 'Elena Marchetti',
      senderInitials: 'EM',
      senderAvatarBg: 'bg-purple-600',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <main className="flex-1 flex flex-col bg-[#0b0c10] h-full overflow-hidden">
      <ChatHeader roomName={activeRoomId} topic={topic} />
      <MessageList messages={messages} />
      <MessageInput channelName={activeRoomId} onSendMessage={handleSendMessage} />
    </main>
  );
};