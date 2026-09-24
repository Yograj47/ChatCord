import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HydratedDocument, Types } from 'mongoose';

import { RoomsService } from '../rooms/rooms.service';
import { RoomCapability, RoomMemberRole } from '../rooms/schemas/room.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './schemas/message.schema';
import { MessagesService } from './messages.service';

const roomId = new Types.ObjectId().toString();
const senderId = new Types.ObjectId().toString();

const createMockMessage = (
  overrides: Partial<Message> = {},
): HydratedDocument<Message> => {
  const message = {
    _id: new Types.ObjectId(),
    roomId: new Types.ObjectId(roomId),
    senderId: new Types.ObjectId(senderId),
    content: 'Hello everyone!',
    save: jest.fn(),
    ...overrides,
  };

  const hydratedDoc = message as unknown as HydratedDocument<Message>;
  hydratedDoc.save = jest
    .fn<HydratedDocument<Message>['save']>()
    .mockResolvedValue(hydratedDoc);
  return hydratedDoc;
};

describe('MessagesService', () => {
  let service: MessagesService;

  const mockMessageModelFactory = jest.fn((...args: unknown[]) => {
    const dto = (args[0] ?? {}) as Partial<Message>;
    return createMockMessage(dto);
  });

  const mockMessageModel = Object.assign(mockMessageModelFactory, {
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  });

  const mockRoomsService = {
    findById:
      jest.fn<
        (roomId: string) => Promise<{ capabilities: RoomCapability[] }>
      >(),
    findMembership:
      jest.fn<
        (roomId: string, userId: string) => Promise<RoomMemberRole | null>
      >(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockMessageModel.mockImplementation((data: unknown) =>
      createMockMessage(data as Partial<Message>),
    );

    mockRoomsService.findById.mockResolvedValue({
      capabilities: [RoomCapability.TEXT],
    });
    mockRoomsService.findMembership.mockResolvedValue(RoomMemberRole.MEMBER);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create and persist a trimmed text message for a room member', async () => {
      const dto: CreateMessageDto = {
        content: '  Hello everyone!  ',
      };
      const savedMessage = createMockMessage();
      const save = jest
        .fn<HydratedDocument<Message>['save']>()
        .mockResolvedValue(savedMessage);

      mockMessageModel.mockImplementationOnce((data: unknown) => {
        const message = createMockMessage(data as Partial<Message>);
        message.save = save;
        return message;
      });

      const result = await service.createMessage(roomId, senderId, dto);

      expect(mockRoomsService.findById).toHaveBeenCalledWith(roomId);
      expect(mockRoomsService.findMembership).toHaveBeenCalledWith(
        roomId,
        senderId,
      );
      expect(mockMessageModel).toHaveBeenCalledWith({
        roomId: expect.any(Types.ObjectId),
        senderId: expect.any(Types.ObjectId),
        content: 'Hello everyone!',
      });
      expect(save).toHaveBeenCalled();
      expect(result).toBe(savedMessage);
    });

    it('should reject a user who is not a room member', async () => {
      mockRoomsService.findMembership.mockResolvedValue(null);

      await expect(
        service.createMessage(roomId, senderId, {
          content: 'Hello everyone!',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockMessageModel).not.toHaveBeenCalled();
    });

    it('should reject text messages when the room does not allow text', async () => {
      mockRoomsService.findById.mockResolvedValue({
        capabilities: [RoomCapability.VOICE],
      });

      await expect(
        service.createMessage(roomId, senderId, {
          content: 'Hello everyone!',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockMessageModel).not.toHaveBeenCalled();
    });
  });

  describe('findAllForRoom', () => {
    it('should return room messages from newest to oldest', async () => {
      const messages = [createMockMessage()];
      const exec = jest
        .fn<() => Promise<HydratedDocument<Message>[]>>()
        .mockResolvedValue(messages);
      const sort = jest.fn().mockReturnValue({ exec });

      mockMessageModel.find.mockReturnValue({ sort });

      const result = await service.findAllForRoom(roomId, senderId);

      expect(mockMessageModel.find).toHaveBeenCalledWith({
        roomId: expect.any(Types.ObjectId),
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(exec).toHaveBeenCalled();
      expect(result).toBe(messages);
    });

    it('should reject a user who is not a room member', async () => {
      mockRoomsService.findMembership.mockResolvedValue(null);

      await expect(service.findAllForRoom(roomId, senderId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockMessageModel.find).not.toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    it("should update a sender's message", async () => {
      const messageId = new Types.ObjectId().toString();
      const message = createMockMessage();
      const save = jest
        .fn<HydratedDocument<Message>['save']>()
        .mockResolvedValue(message);
      message.save = save;

      mockMessageModel.findOne.mockReturnValue({
        exec: jest
          .fn<() => Promise<HydratedDocument<Message>>>()
          .mockResolvedValue(message),
      });

      const result = await service.updateMessage(roomId, messageId, senderId, {
        content: '  Updated message  ',
      });

      expect(message.content).toBe('Updated message');
      expect(save).toHaveBeenCalled();
      expect(result).toBe(message);
    });

    it("should reject updating another user's message", async () => {
      const messageId = new Types.ObjectId().toString();
      const message = createMockMessage({
        senderId: new Types.ObjectId(),
      });

      mockMessageModel.findOne.mockReturnValue({
        exec: jest
          .fn<() => Promise<HydratedDocument<Message>>>()
          .mockResolvedValue(message),
      });

      await expect(
        service.updateMessage(roomId, messageId, senderId, {
          content: 'Updated message',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(jest.spyOn(message, 'save')).not.toHaveBeenCalled();
    });

    it('should reject updating a message that does not exist', async () => {
      const messageId = new Types.ObjectId().toString();

      mockMessageModel.findOne.mockReturnValue({
        exec: jest.fn<() => Promise<null>>().mockResolvedValue(null),
      });

      await expect(
        service.updateMessage(roomId, messageId, senderId, {
          content: 'Updated message',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMessage', () => {
    it("should delete a sender's message", async () => {
      const messageId = new Types.ObjectId().toString();
      const message = createMockMessage();
      const exec = jest
        .fn<() => Promise<{ deletedCount: number }>>()
        .mockResolvedValue({ deletedCount: 1 });

      mockMessageModel.findOne.mockReturnValue({
        exec: jest
          .fn<() => Promise<HydratedDocument<Message>>>()
          .mockResolvedValue(message),
      });
      mockMessageModel.deleteOne.mockReturnValue({ exec });

      await service.deleteMessage(roomId, messageId, senderId);

      expect(mockMessageModel.deleteOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        roomId: expect.any(Types.ObjectId),
      });
      expect(exec).toHaveBeenCalled();
    });

    it("should reject deleting another user's message", async () => {
      const messageId = new Types.ObjectId().toString();
      const message = createMockMessage({
        senderId: new Types.ObjectId(),
      });

      mockMessageModel.findOne.mockReturnValue({
        exec: jest
          .fn<() => Promise<HydratedDocument<Message>>>()
          .mockResolvedValue(message),
      });

      await expect(
        service.deleteMessage(roomId, messageId, senderId),
      ).rejects.toThrow(ForbiddenException);

      expect(mockMessageModel.deleteOne).not.toHaveBeenCalled();
    });
  });
});
