import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    CreateRoomDto,
    UpdateRoomDto,
    RoomMemberRole,
} from '../types/room';
import { showSuccess, showError } from '../lib/toast';
import { roomsApi } from '../api/room.api';
import { isAxiosError } from 'axios';

function errorMessage(error: unknown, fallback: string): string {
    if (isAxiosError<{ message?: string | string[] }>(error)) {
        const message = error.response?.data?.message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message)) return message.join(' ');
    }
    return fallback;
}

export const ROOM_QUERY_KEYS = {
    all: ['rooms'] as const,
    lists: () => [...ROOM_QUERY_KEYS.all, 'list'] as const,
    detail: (id: string) => [...ROOM_QUERY_KEYS.all, 'detail', id] as const,
};

export const useRooms = () => {
    const queryClient = useQueryClient();

    // 1. Fetch user's rooms list
    const roomsQuery = useQuery({
        queryKey: ROOM_QUERY_KEYS.lists(),
        queryFn: roomsApi.getMyRooms,
        staleTime: 1000 * 60 * 5,
    });

    // 2. Create room mutation
    const createRoomMutation = useMutation({
        mutationFn: (dto: CreateRoomDto) => roomsApi.createRoom(dto),
        onSuccess: (newRoom) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
            showSuccess(`Room "${newRoom.name || 'Chat'}" created successfully.`);
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to create room.'));
        },
    });

    // 3. Update room mutation
    const updateRoomMutation = useMutation({
        mutationFn: ({ roomId, dto }: { roomId: string; dto: UpdateRoomDto }) =>
            roomsApi.updateRoom(roomId, dto),
        onSuccess: (updatedRoom) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(updatedRoom._id) });
            showSuccess('Room updated successfully.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to update room.'));
        },
    });

    // 4. Delete room mutation
    const deleteRoomMutation = useMutation({
        mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
        onSuccess: (_, roomId) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
            queryClient.removeQueries({ queryKey: ROOM_QUERY_KEYS.detail(roomId) });
            showSuccess('Room deleted successfully.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to delete room.'));
        },
    });

    // 5. Join room mutation
    const joinRoomMutation = useMutation({
        mutationFn: (roomId: string) => roomsApi.joinRoom(roomId),
        onSuccess: (room) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(room._id) });
            showSuccess('Joined room successfully.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to join room.'));
        },
    });

    // 6. Leave room mutation
    const leaveRoomMutation = useMutation({
        mutationFn: (roomId: string) => roomsApi.leaveRoom(roomId),
        onSuccess: (_, roomId) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.lists() });
            queryClient.removeQueries({ queryKey: ROOM_QUERY_KEYS.detail(roomId) });
            showSuccess('Left room.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to leave room.'));
        },
    });

    // 7. Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
            roomsApi.addMember(roomId, userId),
        onSuccess: (invitation) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(invitation.roomId) });
            showSuccess('Invitation sent. The recipient must accept to join.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to send invitation.'));
        },
    });

    // 8. Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
            roomsApi.removeMember(roomId, userId),
        onSuccess: (room) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(room._id) });
            showSuccess('Member removed.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to remove member.'));
        },
    });

    // 9. Update member role mutation
    const updateMemberRoleMutation = useMutation({
        mutationFn: ({
            roomId,
            userId,
            role,
        }: {
            roomId: string;
            userId: string;
            role: RoomMemberRole;
        }) => roomsApi.updateMemberRole(roomId, userId, role),
        onSuccess: (room) => {
            queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEYS.detail(room._id) });
            showSuccess('Member role updated.');
        },
        onError: (err: unknown) => {
            showError(errorMessage(err, 'Failed to update member role.'));
        },
    });

    return {
        rooms: roomsQuery.data ?? [],
        isLoadingRooms: roomsQuery.isLoading,
        roomsError: roomsQuery.error,

        createRoom: createRoomMutation.mutateAsync,
        isCreatingRoom: createRoomMutation.isPending,

        updateRoom: updateRoomMutation.mutateAsync,
        isUpdatingRoom: updateRoomMutation.isPending,

        deleteRoom: deleteRoomMutation.mutateAsync,
        isDeletingRoom: deleteRoomMutation.isPending,

        joinRoom: joinRoomMutation.mutateAsync,
        leaveRoom: leaveRoomMutation.mutateAsync,

        addMember: addMemberMutation.mutateAsync,
        removeMember: removeMemberMutation.mutateAsync,
        updateMemberRole: updateMemberRoleMutation.mutateAsync,
    };
};

// Helper hook for fetching a single room's details
export const useRoomDetail = (roomId: string | null) => {
    return useQuery({
        queryKey: ROOM_QUERY_KEYS.detail(roomId!),
        queryFn: () => roomsApi.getRoom(roomId!),
        enabled: Boolean(roomId),
        staleTime: 1000 * 60 * 2,
    });
};
