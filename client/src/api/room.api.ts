
import { api } from '#lib/api';
import type {
    Room,
    CreateRoomDto,
    UpdateRoomDto,
    RoomMemberRole,
} from '../types/room';

export const roomsApi = {
    // Create a room (POST /api/rooms)
    createRoom: async (payload: CreateRoomDto): Promise<Room> => {
        const { data } = await api.post<Room>('/rooms', payload);
        return data;
    },

    // Fetch authenticated user's rooms (GET /api/rooms)
    getMyRooms: async (): Promise<Room[]> => {
        const { data } = await api.get<Room[]>('/rooms');
        return data;
    },

    // Fetch room details (GET /api/rooms/:roomId)
    getRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.get<Room>(`/rooms/${roomId}`);
        return data;
    },

    // Update room details (PATCH /api/rooms/:roomId)
    updateRoom: async (
        roomId: string,
        payload: UpdateRoomDto,
    ): Promise<Room> => {
        const { data } = await api.patch<Room>(
            `/rooms/${roomId}`,
            payload,
        );
        return data;
    },

    // Delete a room (DELETE /api/rooms/:roomId)
    deleteRoom: async (roomId: string): Promise<void> => {
        await api.delete(`/rooms/${roomId}`);
    },

    // Join a room (POST /api/rooms/:roomId/join)
    joinRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.post<Room>(
            `/rooms/${roomId}/join`,
        );
        return data;
    },

    // Leave a room (POST /api/rooms/:roomId/leave)
    leaveRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.post<Room>(
            `/rooms/${roomId}/leave`,
        );
        return data;
    },

    // Add a member (POST /api/rooms/:roomId/members)
    addMember: async (
        roomId: string,
        userId: string,
    ): Promise<Room> => {
        const { data } = await api.post<Room>(
            `/rooms/${roomId}/members`,
            { userId },
        );
        return data;
    },


    // Remove a member (DELETE /api/rooms/:roomId/members/:userId)
    removeMember: async (
        roomId: string,
        userId: string,
    ): Promise<Room> => {
        const { data } = await api.delete<Room>(
            `/rooms/${roomId}/members/${userId}`,
        );
        return data;
    },

    // Update a member's role (PATCH /api/rooms/:roomId/members/:userId)
    updateMemberRole: async (
        roomId: string,
        userId: string,
        role: RoomMemberRole,
    ): Promise<Room> => {
        const { data } = await api.patch<Room>(
            `/rooms/${roomId}/members/${userId}`,
            { role },
        );
        return data;
    },
};
