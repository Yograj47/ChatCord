import { Test, TestingModule } from '@nestjs/testing';

import { SessionGuard } from '../auth/guards/session.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;

  const messagesService = {
    createMessage: jest.fn(),
    findAllForRoom: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: messagesService,
        },
      ],
    })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a message for the authenticated user', async () => {
    const roomId = 'room-id';
    const user = {
      id: 'user-id',
      sessionId: 'session-id',
      type: 'guest',
    };
    const dto: CreateMessageDto = {
      content: 'Hello everyone!',
    };
    const message = { id: 'message-id' };

    messagesService.createMessage.mockResolvedValue(message);

    await expect(controller.createMessage(roomId, user, dto)).resolves.toBe(
      message,
    );
    expect(messagesService.createMessage).toHaveBeenCalledWith(
      roomId,
      user.id,
      dto,
    );
  });

  it('should retrieve messages for the authenticated user', async () => {
    const roomId = 'room-id';
    const user = { id: 'user-id', sessionId: 'session-id', type: 'guest' };
    const messages = [{ id: 'message-id' }];

    messagesService.findAllForRoom.mockResolvedValue(messages);

    await expect(controller.findAllForRoom(roomId, user)).resolves.toBe(
      messages,
    );
    expect(messagesService.findAllForRoom).toHaveBeenCalledWith(
      roomId,
      user.id,
    );
  });

  it('should update a message for the authenticated user', async () => {
    const roomId = 'room-id';
    const messageId = 'message-id';
    const user = { id: 'user-id', sessionId: 'session-id', type: 'guest' };
    const dto = { content: 'Updated message' };
    const message = { id: messageId, content: dto.content };

    messagesService.updateMessage.mockResolvedValue(message);

    await expect(
      controller.updateMessage(roomId, messageId, user, dto),
    ).resolves.toBe(message);
    expect(messagesService.updateMessage).toHaveBeenCalledWith(
      roomId,
      messageId,
      user.id,
      dto,
    );
  });

  it('should delete a message for the authenticated user', async () => {
    const roomId = 'room-id';
    const messageId = 'message-id';
    const user = { id: 'user-id', sessionId: 'session-id', type: 'guest' };

    messagesService.deleteMessage.mockResolvedValue(undefined);

    await expect(
      controller.deleteMessage(roomId, messageId, user),
    ).resolves.toBeUndefined();
    expect(messagesService.deleteMessage).toHaveBeenCalledWith(
      roomId,
      messageId,
      user.id,
    );
  });
});
