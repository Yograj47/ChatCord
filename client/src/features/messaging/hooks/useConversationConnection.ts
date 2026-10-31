import { MESSAGE_QUERY_KEYS } from '@/features/messaging/api/message.keys';
import type { MessageAcknowledgement as Acknowledgement } from '@/features/messaging/types/message.types';
import { socket } from '@/features/realtime/api/socket';
import { useSocket } from '@/features/realtime/hooks/useSocket';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useConversationConnection(
  activeRoomId: string | null,
  isMember: boolean,
  userId: string,
) {
  const navigate = useNavigate(),
    queryClient = useQueryClient();
  const { isConnected, socketId, error: socketError } = useSocket();
  const [joined, setJoined] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const connectionKey = activeRoomId && socketId ? activeRoomId + ':' + socketId : '';
  const ready = Boolean(isConnected && isMember && connectionKey && joined === connectionKey);
  useEffect(() => {
    if (!activeRoomId || !isMember) return;
    void queryClient.invalidateQueries({
      queryKey: MESSAGE_QUERY_KEYS.room(activeRoomId, userId),
    });
  }, [activeRoomId, isMember, joined, queryClient, userId]);

  useEffect(() => {
    if (!activeRoomId || !isMember || !isConnected || !connectionKey) return;
    let active = true;
    const handleMessage = (message: { roomId: string }) => {
      if (message.roomId === activeRoomId)
        void queryClient.invalidateQueries({
          queryKey: MESSAGE_QUERY_KEYS.room(activeRoomId, userId),
        });
    };
    socket.on('new-message', handleMessage);
    socket.on('message-updated', handleMessage);

    const handleChanged = ({ roomId }: { roomId: string }) => {
      if (roomId !== activeRoomId) return;
      void queryClient.invalidateQueries({
        queryKey: ROOM_QUERY_KEYS.detail(activeRoomId),
      });
      void queryClient.invalidateQueries({
        queryKey: ROOM_QUERY_KEYS.memberScope(activeRoomId),
      });
    };
    const handleRevoked = ({ roomId }: { roomId: string }) => {
      if (roomId !== activeRoomId) return;
      setJoined('');
      queryClient.removeQueries({ queryKey: MESSAGE_QUERY_KEYS.room(activeRoomId, userId) });
      queryClient.removeQueries({
        queryKey: ROOM_QUERY_KEYS.detail(activeRoomId),
      });
      queryClient.removeQueries({ queryKey: ROOM_QUERY_KEYS.memberScope(activeRoomId) });
      void queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
      void navigate('/app');
    };
    socket.on('room-members-changed', handleChanged);
    socket.on('room-access-revoked', handleRevoked);
    socket
      .timeout(10000)
      .emit(
        'join-room',
        { roomId: activeRoomId },
        (error: Error | null, response?: Acknowledgement) => {
          if (!active) return;
          if (error || !response?.ok) {
            setMessageError(
              response?.error ??
                'Could not join this conversation. Check your connection and access.',
            );
            return;
          }
          setJoined(connectionKey);
          setMessageError(null);
        },
      );
    return () => {
      active = false;
      socket.off('new-message', handleMessage);
      socket.off('message-updated', handleMessage);
      socket.emit('leave-room', { roomId: activeRoomId });
      socket.off('room-members-changed', handleChanged);
      socket.off('room-access-revoked', handleRevoked);
    };
  }, [activeRoomId, isMember, isConnected, connectionKey, navigate, queryClient, userId]);

  return { ready, joined, messageError, setMessageError, socketError };
}
