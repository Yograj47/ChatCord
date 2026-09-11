import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HydratedDocument, Types } from 'mongoose';

import { RoomsService } from './rooms.service';
import {
  Room,
  RoomCapability,
  RoomMemberRole,
  RoomType,
  RoomVisibility,
} from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

const userId = new Types.ObjectId().toString();
const otherUserId = new Types.ObjectId().toString();
const moderatorId = new Types.ObjectId().toString();
const roomId = new Types.ObjectId().toString();

const createMockRoom = (overrides: Partial<Room> = {}): HydratedDocument<Room> => {
  const room = {
    _id: new Types.ObjectId(),
    type: RoomType.GROUP,
    name: 'General Chat',
    description: 'General discussion',
    visibility: RoomVisibility.PUBLIC,
    capabilities: [RoomCapability.TEXT],
    createdBy: new Types.ObjectId(userId),
    members: [
      {
        userId: new Types.ObjectId(userId),
        role: RoomMemberRole.OWNER,
        joinedAt: new Date(),
      },
    ],
    save: jest.fn(),
    ...overrides,
  };

  const hydratedDoc = room as unknown as HydratedDocument<Room>;
  hydratedDoc.save = jest.fn<HydratedDocument<Room>['save']>().mockResolvedValue(hydratedDoc);
  return hydratedDoc;
};

describe('RoomsService', () => {
  let service: RoomsService;

  const mockRoomModelFactory = jest.fn((...args: unknown[]) => {
    const dto = (args[0] ?? {}) as Partial<Room>;
    return createMockRoom(dto);
  });

  const mockRoomModel = Object.assign(mockRoomModelFactory, {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRoomModel.mockImplementation((data: unknown) => {
      const dto = (data ?? {}) as Partial<Room>;
      return createMockRoom(dto);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: getModelToken(Room.name),
          useValue: mockRoomModel,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a group room successfully', async () => {
      const dto: CreateRoomDto = {
        type: RoomType.GROUP,
        name: 'General Chat',
        description: 'General discussion',
        visibility: RoomVisibility.PUBLIC,
        capabilities: [RoomCapability.TEXT],
      };

      const savedRoom = createMockRoom();
      const save = jest.fn<HydratedDocument<Room>['save']>().mockResolvedValue(savedRoom);

      mockRoomModel.mockImplementationOnce((data: unknown) => {
        const doc = createMockRoom(data as Partial<Room>);
        doc.save = save;
        return doc;
      });

      const result = await service.createRoom(userId, dto);

      expect(mockRoomModel).toHaveBeenCalledWith({
        type: RoomType.GROUP,
        name: 'General Chat',
        description: 'General discussion',
        visibility: RoomVisibility.PUBLIC,
        capabilities: [RoomCapability.TEXT],
        createdBy: expect.any(Types.ObjectId),
        members: [
          {
            userId: expect.any(Types.ObjectId),
            role: RoomMemberRole.OWNER,
            joinedAt: expect.any(Date),
          },
        ],
      });

      expect(save).toHaveBeenCalled();
      expect(result).toBe(savedRoom);
    });

    it('should reject DM room creation through the generic room flow', async () => {
      const dto: CreateRoomDto = {
        type: RoomType.DM,
      };

      await expect(service.createRoom(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockRoomModel).not.toHaveBeenCalled();
    });

    it('should reject a group room without a name', async () => {
      const dto: CreateRoomDto = {
        type: RoomType.GROUP,
      };

      await expect(service.createRoom(userId, dto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockRoomModel).not.toHaveBeenCalled();
    });

    it('should trim room fields before creating the room', async () => {
      const dto: CreateRoomDto = {
        type: RoomType.GROUP,
        name: '  General Chat  ',
        description: '  General discussion  ',
      };

      const savedRoom = createMockRoom();
      const save = jest.fn<HydratedDocument<Room>['save']>().mockResolvedValue(savedRoom);

      mockRoomModel.mockImplementationOnce((data: unknown) => {
        const doc = createMockRoom(data as Partial<Room>);
        doc.save = save;
        return doc;
      });

      await service.createRoom(userId, dto);

      expect(mockRoomModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'General Chat',
          description: 'General discussion',
        }),
      );
    });
  });

  describe('findAllForUser', () => {
    it('should return rooms belonging to the user', async () => {
      const rooms = [createMockRoom()];

      const exec = jest.fn<() => Promise<HydratedDocument<Room>[]>>().mockResolvedValue(rooms);

      const sort = jest.fn().mockReturnValue({
        exec,
      });

      mockRoomModel.find.mockReturnValue({
        sort,
      });

      const result = await service.findAllForUser(userId);

      expect(mockRoomModel.find).toHaveBeenCalledWith({
        'members.userId': expect.any(Types.ObjectId),
      });

      expect(sort).toHaveBeenCalledWith({
        updatedAt: -1,
      });

      expect(exec).toHaveBeenCalled();
      expect(result).toBe(rooms);
    });
  });

  describe('findById', () => {
    it('should return a room when it exists', async () => {
      const room = createMockRoom();

      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn<() => Promise<HydratedDocument<Room>>>().mockResolvedValue(room),
      });

      const result = await service.findById(roomId);

      expect(mockRoomModel.findById).toHaveBeenCalledWith(roomId);
      expect(result).toBe(room);
    });

    it('should throw NotFoundException when the room does not exist', async () => {
      mockRoomModel.findById.mockReturnValue({
        exec: jest.fn<() => Promise<HydratedDocument<Room> | null>>().mockResolvedValue(null),
      });

      await expect(service.findById(roomId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMembership', () => {
    it('should return the member role when the user is a member', async () => {
      const room = createMockRoom();

      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn<() => Promise<HydratedDocument<Room>>>().mockResolvedValue(room),
      });

      const result = await service.findMembership(roomId, userId);

      expect(mockRoomModel.findOne).toHaveBeenCalledWith(
        {
          _id: roomId,
          'members.userId': expect.any(Types.ObjectId),
        },
        {
          members: {
            $elemMatch: {
              userId: expect.any(Types.ObjectId),
            },
          },
        },
      );

      expect(result).toBe(RoomMemberRole.OWNER);
    });

    it('should return null when the user is not a member', async () => {
      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn<() => Promise<HydratedDocument<Room> | null>>().mockResolvedValue(null),
      });

      const result = await service.findMembership(roomId, otherUserId);

      expect(result).toBeNull();
    });

    it('should return null when the room has no matching member', async () => {
      const room = createMockRoom({
        members: [],
      });

      mockRoomModel.findOne.mockReturnValue({
        exec: jest.fn<() => Promise<HydratedDocument<Room>>>().mockResolvedValue(room),
      });

      const result = await service.findMembership(roomId, otherUserId);

      expect(result).toBeNull();
    });
  });

  describe('joinRoom', () => {
    it('should add a user to a public group room', async () => {
      const room = createMockRoom({
        visibility: RoomVisibility.PUBLIC,
      });

      room.members = [
        {
          userId: new Types.ObjectId(otherUserId),
          role: RoomMemberRole.OWNER,
          joinedAt: new Date(),
        },
      ];

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const result = await service.joinRoom(roomId, userId);

      expect(room.members).toHaveLength(2);
      expect(room.members[1]).toEqual(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          role: RoomMemberRole.MEMBER,
          joinedAt: expect.any(Date),
        }),
      );
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should reject joining a DM room', async () => {
      const room = createMockRoom({
        type: RoomType.DM,
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.joinRoom(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject joining a private room', async () => {
      const room = createMockRoom({
        visibility: RoomVisibility.PRIVATE,
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.joinRoom(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject a user who is already a member', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.joinRoom(roomId, userId)).rejects.toThrow(
        ConflictException,
      );

      expect(room.save).not.toHaveBeenCalled();
    });
  });

  describe('leaveRoom', () => {
    it('should remove a normal member from the room', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(userId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const result = await service.leaveRoom(roomId, userId);

      expect(room.members).toHaveLength(1);
      expect(
        room.members.some(
          (member) => member.userId.toString() === userId,
        ),
      ).toBe(false);
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should reject leaving when the user is not a member', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.leaveRoom(roomId, otherUserId)).rejects.toThrow(
        NotFoundException,
      );

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject the room owner from leaving', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.leaveRoom(roomId, userId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(room.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRoom', () => {
    it('should allow the owner to update the room', async () => {
      const room = createMockRoom();

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const dto: UpdateRoomDto = {
        name: 'Updated Room',
        description: 'Updated description',
        visibility: RoomVisibility.PRIVATE,
        capabilities: [RoomCapability.TEXT, RoomCapability.MEDIA],
      };

      const result = await service.updateRoom(roomId, userId, dto);

      expect(room.name).toBe('Updated Room');
      expect(room.description).toBe('Updated description');
      expect(room.visibility).toBe(RoomVisibility.PRIVATE);
      expect(room.capabilities).toEqual([
        RoomCapability.TEXT,
        RoomCapability.MEDIA,
      ]);
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should allow a moderator to update the room', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(moderatorId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const dto: UpdateRoomDto = {
        name: 'Moderator Updated Room',
      };

      await service.updateRoom(roomId, moderatorId, dto);

      expect(room.name).toBe('Moderator Updated Room');
      expect(room.save).toHaveBeenCalled();
    });

    it('should reject a normal member from updating the room', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateRoom(roomId, otherUserId, {
          name: 'Unauthorized Update',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should trim updated name and description', async () => {
      const room = createMockRoom();

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await service.updateRoom(roomId, userId, {
        name: '  Updated Room  ',
        description: '  Updated description  ',
      });

      expect(room.name).toBe('Updated Room');
      expect(room.description).toBe('Updated description');
    });
  });

  describe('deleteRoom', () => {
    it('should allow the owner to delete the room', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const exec = jest.fn<() => Promise<{ deletedCount: number }>>().mockResolvedValue({
        deletedCount: 1,
      });

      mockRoomModel.deleteOne.mockReturnValue({
        exec,
      });

      await service.deleteRoom(roomId, userId);

      expect(mockRoomModel.deleteOne).toHaveBeenCalledWith({
        _id: roomId,
      });

      expect(exec).toHaveBeenCalled();
    });

    it('should reject a non-owner from deleting the room', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.deleteRoom(roomId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockRoomModel.deleteOne).not.toHaveBeenCalled();
    });

    it('should reject a moderator from deleting the room', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(moderatorId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(service.deleteRoom(roomId, moderatorId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockRoomModel.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should allow the owner to add a member', async () => {
      const room = createMockRoom();

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const result = await service.addMember(
        roomId,
        userId,
        otherUserId,
      );

      expect(room.members).toHaveLength(2);
      expect(room.members[1]).toEqual(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          role: RoomMemberRole.MEMBER,
          joinedAt: expect.any(Date),
        }),
      );
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should allow a moderator to add a member', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(moderatorId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await service.addMember(roomId, moderatorId, otherUserId);

      expect(room.members).toHaveLength(2);
      expect(room.save).toHaveBeenCalled();
    });

    it('should reject a normal member from adding members', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.addMember(roomId, otherUserId, moderatorId),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject adding an existing member', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.addMember(roomId, userId, userId),
      ).rejects.toThrow(ConflictException);

      expect(room.save).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should allow the owner to remove a member', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(userId),
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const result = await service.removeMember(
        roomId,
        userId,
        otherUserId,
      );

      expect(room.members).toHaveLength(1);
      expect(
        room.members.some(
          (member) => member.userId.toString() === otherUserId,
        ),
      ).toBe(false);
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should allow a moderator to remove a member', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(moderatorId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await service.removeMember(
        roomId,
        moderatorId,
        otherUserId,
      );

      expect(room.members).toHaveLength(1);
      expect(room.save).toHaveBeenCalled();
    });

    it('should reject a normal member from removing members', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.removeMember(roomId, otherUserId, moderatorId),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject removing a user who is not a member', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.removeMember(roomId, userId, otherUserId),
      ).rejects.toThrow(NotFoundException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject removing the room owner', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.removeMember(roomId, userId, userId),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('should allow the owner to promote a member to moderator', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(userId),
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      const result = await service.updateMemberRole(
        roomId,
        userId,
        otherUserId,
        RoomMemberRole.MODERATOR,
      );

      expect(room.members[1].role).toBe(RoomMemberRole.MODERATOR);
      expect(room.save).toHaveBeenCalled();
      expect(result).toBe(room);
    });

    it('should allow the owner to change a moderator to member', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(userId),
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(room, 'save').mockResolvedValue(room as never);
      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await service.updateMemberRole(
        roomId,
        userId,
        otherUserId,
        RoomMemberRole.MEMBER,
      );

      expect(room.members[1].role).toBe(RoomMemberRole.MEMBER);
      expect(room.save).toHaveBeenCalled();
    });

    it('should reject a moderator from changing member roles', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(moderatorId),
            role: RoomMemberRole.MODERATOR,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateMemberRole(
          roomId,
          moderatorId,
          otherUserId,
          RoomMemberRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject a normal member from changing member roles', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateMemberRole(
          roomId,
          otherUserId,
          userId,
          RoomMemberRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject changing the owner role', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateMemberRole(
          roomId,
          userId,
          userId,
          RoomMemberRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject assigning the owner role', async () => {
      const room = createMockRoom({
        members: [
          {
            userId: new Types.ObjectId(userId),
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(),
          },
          {
            userId: new Types.ObjectId(otherUserId),
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      });

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateMemberRole(
          roomId,
          userId,
          otherUserId,
          RoomMemberRole.OWNER,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });

    it('should reject changing the role of a non-member', async () => {
      const room = createMockRoom();

      jest.spyOn(service, 'findById').mockResolvedValue(room);

      await expect(
        service.updateMemberRole(
          roomId,
          userId,
          otherUserId,
          RoomMemberRole.MODERATOR,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(room.save).not.toHaveBeenCalled();
    });
  });
});