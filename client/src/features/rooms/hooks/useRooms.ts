import { roomsApi } from '@/features/rooms/api/room.api';
import { invalidateRoomState } from '@/features/rooms/api/room.cache';
import { ROOM_QUERY_KEYS } from '@/features/rooms/api/room.keys';
import type { CreateRoomDto, UpdateRoomDto } from '@/features/rooms/types/room.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { showError, showSuccess } from '@/shared/lib/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (dto: CreateRoomDto) => roomsApi.createRoom(dto),
    onSuccess: (newRoom) => {
      void queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
      showSuccess('Room "' + (newRoom.name || 'Chat') + '" created successfully.');
    },
    onError: (error: unknown) => showError(getApiErrorMessage(error, 'Failed to create room.')),
  });
  return { createRoom: mutation.mutateAsync, isCreatingRoom: mutation.isPending };
}
export function useUpdateRoom() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ roomId, dto }: { roomId: string; dto: UpdateRoomDto }) =>
      roomsApi.updateRoom(roomId, dto),
    onSuccess: (room) => {
      void invalidateRoomState(queryClient, room._id);
      showSuccess('Room updated successfully.');
    },
    onError: (error: unknown) => showError(getApiErrorMessage(error, 'Failed to update room.')),
  });
  return { updateRoom: mutation.mutateAsync, isUpdatingRoom: mutation.isPending };
}
export const useRoomDetail = (roomId: string | null) => {
  return useQuery({
    queryKey: ROOM_QUERY_KEYS.detail(roomId!),
    queryFn: () => roomsApi.getRoom(roomId!),
    enabled: Boolean(roomId),
    staleTime: 1000 * 60 * 2,
  });
};

export function useRoomsQuery(enabled = true) {
  return useQuery({
    queryKey: ROOM_QUERY_KEYS.lists(),
    queryFn: roomsApi.getMyRooms,
    enabled,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}
export function useRooms(enabled = true) {
  const query = useRoomsQuery(enabled);
  return { rooms: query.data ?? [], isLoadingRooms: query.isLoading, roomsError: query.error };
}

export function useRoomMembers(roomId: string | null, userId?: string, enabled = true) {
  return useQuery({
    queryKey: ROOM_QUERY_KEYS.members(roomId ?? '', userId),
    queryFn: () => roomsApi.getMembers(roomId!),
    enabled: Boolean(roomId && enabled),
    refetchInterval: 15000,
    retry: false,
  });
}

export function usePublicRooms(query: string, enabled = true) {
  return useQuery({
    queryKey: ROOM_QUERY_KEYS.public(query),
    queryFn: () => roomsApi.searchPublic(query),
    enabled,
    staleTime: 30000,
  });
}
