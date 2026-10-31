
import { api } from '#lib/api';
import type {
    Room,
    CreateRoomDto,
    UpdateRoomDto,
    RoomMemberRole,
    RoomInvitation,
    SentRoomInvitation,
    RoomMemberProfile,
} from '../types/room';

export const roomsApi = {
    getMembers: async (roomId: string): Promise<RoomMemberProfile[]> => (await api.get<RoomMemberProfile[]>(`/rooms/${roomId}/members`)).data,
    getInvitations: async (): Promise<RoomInvitation[]> => (await api.get<RoomInvitation[]>('/rooms/invitations')).data,
    acceptInvitation: async (roomId: string, invitationId: string): Promise<Room> => (await api.post<Room>(`/rooms/${roomId}/invitations/${invitationId}/accept`)).data,
    declineInvitation: async (roomId: string, invitationId: string): Promise<void> => { await api.delete(`/rooms/${roomId}/invitations/${invitationId}`); },

    createRoom: async (payload: CreateRoomDto): Promise<Room> => {
        const { data } = await api.post<Room>('/rooms', payload);
        return data;
    },


    getMyRooms: async (): Promise<Room[]> => {
        const { data } = await api.get<Room[]>('/rooms');
        return data;
    },


    getRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.get<Room>(`/rooms/${roomId}`);
        return data;
    },


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


    deleteRoom: async (roomId: string): Promise<void> => {
        await api.delete(`/rooms/${roomId}`);
    },


    joinRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.post<Room>(
            `/rooms/${roomId}/join`,
        );
        return data;
    },


    leaveRoom: async (roomId: string): Promise<Room> => {
        const { data } = await api.post<Room>(
            `/rooms/${roomId}/leave`,
        );
        return data;
    },


    addMember: async (
        roomId: string,
        userId: string,
    ): Promise<SentRoomInvitation> => {
        const { data } = await api.post<SentRoomInvitation>(
            `/rooms/${roomId}/members`,
            { userId },
        );
        return data;
    },



    removeMember: async (
        roomId: string,
        userId: string,
    ): Promise<Room> => {
        const { data } = await api.delete<Room>(
            `/rooms/${roomId}/members/${userId}`,
        );
        return data;
    },


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
