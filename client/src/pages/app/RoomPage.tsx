import React from 'react';
import { useParams } from 'react-router-dom';
import { ChatContainer } from '../../components/chat/ChatContainer';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  return <ChatContainer roomId={roomId || 'dev-general'} />;
};