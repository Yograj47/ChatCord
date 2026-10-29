export type RoomType = 'dm' | 'group';

export const RoomType = {
    DM: 'dm',
    GROUP: 'group',
} as const;

export type RoomVisibility = 'public' | 'private';

export const RoomVisibility = {
    PUBLIC: 'public',
    PRIVATE: 'private',
} as const;

export type RoomCapability = 'text' | 'media' | 'voice' | 'video';

export const RoomCapability = {
    TEXT: 'text',
    MEDIA: 'media',
    VOICE: 'voice',
    VIDEO: 'video',
} as const;

export type RoomMemberRole = 'owner' | 'moderator' | 'member';

export const RoomMemberRole = {
    OWNER: 'owner',
    MODERATOR: 'moderator',
    MEMBER: 'member',
} as const;

export interface RoomMember {
    userId: string;
    role: RoomMemberRole;
    joinedAt: string;
}

export interface Room {
    _id: string;
    type: RoomType;
    name?: string;
    slug?: string;
    description?: string;
    visibility: RoomVisibility;
    capabilities: RoomCapability[];
    createdBy: string;
    members: RoomMember[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoomDto {
    type: RoomType;
    name?: string;
    description?: string;
    visibility?: RoomVisibility;
    capabilities?: RoomCapability[];
}

export interface UpdateRoomDto {
    name?: string;
    description?: string;
    visibility?: RoomVisibility;
    capabilities?: RoomCapability[];
}