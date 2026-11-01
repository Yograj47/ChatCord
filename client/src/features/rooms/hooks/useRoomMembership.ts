import { MESSAGE_QUERY_KEYS } from '@/features/messaging/api/message.keys';
import { usePresence } from '@/features/realtime/hooks/usePresence';
import { roomsApi } from '@/features/rooms/api/room.api';
import { invalidateRoomState } from '@/features/rooms/api/room.cache';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import { useRoomMembers } from '@/features/rooms/hooks/useRooms';
import type { Room, RoomMemberRole } from '@/features/rooms/types/room.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { showSuccess } from '@/shared/lib/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Action =
  | { kind: 'join' | 'leave' }
  | { kind: 'remove'; userId: string }
  | { kind: 'role'; userId: string; role: RoomMemberRole }
  | { kind: 'visibility'; value: 'public' | 'private' }
  | { kind: 'text'; enabled: boolean };

export function useRoomMembership(room: Room, userId: string, onClose: () => void) {
  const [confirmation, setConfirmation] = useState<Action | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMember = room.members.some((member) => member.userId === userId);
  const presence = usePresence(isMember ? room.members.map((member) => member.userId) : []);
  const members = useRoomMembers(room._id, userId, isMember);
  const myRole = members.data?.find((member) => member.id === userId)?.role;
  const owner = members.isSuccess && myRole === 'owner';
  const manager = room.type === 'group' && members.isSuccess && (owner || myRole === 'moderator');

  const refresh = () => invalidateRoomState(queryClient, room._id);
  const action = useMutation({
    mutationFn: (input: Action) => {
      switch (input.kind) {
        case 'join':
          return roomsApi.joinRoom(room._id);
        case 'leave':
          return roomsApi.leaveRoom(room._id);
        case 'remove':
          return roomsApi.removeMember(room._id, input.userId);
        case 'role':
          return roomsApi.updateMemberRole(room._id, input.userId, input.role);
        case 'visibility':
          return roomsApi.updateRoom(room._id, { visibility: input.value });
        case 'text':
          return roomsApi.updateRoom(room._id, {
            capabilities: input.enabled
              ? [...new Set([...room.capabilities, 'text' as const])]
              : room.capabilities.filter((capability) => capability !== 'text'),
          });
      }
    },
    onSuccess: async (updated, input) => {
      if (input.kind === 'join' || input.kind === 'leave')
        queryClient.removeQueries({ queryKey: MESSAGE_QUERY_KEYS.room(room._id, userId) });
      setConfirmation(null);
      if (input.kind === 'leave') {
        queryClient.removeQueries({ queryKey: ROOM_QUERY_KEYS.memberScope(room._id) });
        queryClient.removeQueries({
          queryKey: ROOM_QUERY_KEYS.detail(room._id),
        });

        onClose();
        void navigate('/app');
        await queryClient.invalidateQueries({
          queryKey: ROOM_QUERY_KEYS.lists(),
        });
        showSuccess('You left the room.');
        return;
      }
      queryClient.setQueryData(ROOM_QUERY_KEYS.detail(room._id), updated);
      await refresh();
      showSuccess(input.kind === 'join' ? 'You joined the room.' : 'Room permissions updated.');
    },
    onError: () => {
      void refresh();
    },
  });
  const failure = getApiErrorMessage(action.error, 'Could not update room permissions.');
  return {
    confirmation,
    setConfirmation,
    isMember,
    presence,
    members,
    myRole,
    owner,
    manager,
    action,
    failure,
  };
}
