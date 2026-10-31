import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { RoomsService } from '../rooms/rooms.service';
import { RoomCapability } from '../rooms/schemas/room.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message, MessageDocument } from './schemas/message.schema';
import { MessageEventsService } from './message-events.service';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly roomsService: RoomsService,
    @Optional()
    private readonly events: MessageEventsService = new MessageEventsService(),
  ) {}

  async createMessage(
    roomId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageDocument> {
    const room = await this.roomsService.findById(roomId);

    await this.assertMembership(roomId, senderId);
    await this.roomsService.assertCanSend(room, senderId);

    if (!room.capabilities.includes(RoomCapability.TEXT)) {
      throw new ForbiddenException(
        'Text messages are not enabled for this room.',
      );
    }

    if (dto.replyTo) {
      const parent = await this.findMessage(roomId, dto.replyTo);
      if (parent.deletedAt)
        throw new NotFoundException('Reply target was deleted.');
    }
    const message = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(senderId),
      content: dto.content.trim(),
      ...(dto.replyTo ? { replyTo: new Types.ObjectId(dto.replyTo) } : {}),
    });

    const saved = await message.save();
    this.events.emit(roomId, 'new-message', saved);
    return saved;
  }

  async page(roomId: string, userId: string, query: MessageQueryDto) {
    await this.assertMembership(roomId, userId);
    const limit = query.limit ?? 30;
    const filter = {
      roomId: new Types.ObjectId(roomId),
      ...(query.before
        ? { _id: { $lt: new Types.ObjectId(query.before) } }
        : {}),
      ...(query.replyTo ? { replyTo: new Types.ObjectId(query.replyTo) } : {}),
      ...(query.q
        ? {
            deletedAt: null,
            content: {
              $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              $options: 'i',
            },
          }
        : {}),
    };
    const rows = await this.messageModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    return { items, nextCursor: hasMore ? items.at(-1)!._id.toString() : null };
  }

  async getMessage(roomId: string, messageId: string, userId: string) {
    await this.assertMembership(roomId, userId);
    return this.findMessage(roomId, messageId);
  }

  async react(
    roomId: string,
    messageId: string,
    userId: string,
    emoji: string,
    add: boolean,
  ) {
    await this.assertMembership(roomId, userId);
    const reaction = { emoji, userId: new Types.ObjectId(userId) };
    const message = await this.messageModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(messageId),
          roomId: new Types.ObjectId(roomId),
          deletedAt: null,
        },
        add
          ? { $addToSet: { reactions: reaction } }
          : { $pull: { reactions: reaction } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!message) throw new NotFoundException('Message not found.');
    this.events.emit(roomId, 'message-updated', message);
    return message;
  }

  async findAllForRoom(
    roomId: string,
    userId: string,
  ): Promise<MessageDocument[]> {
    await this.assertMembership(roomId, userId);

    return this.messageModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateMessage(
    roomId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageDocument> {
    await this.assertMembership(roomId, userId);

    const message = await this.findMessage(roomId, messageId);
    this.assertSender(message, userId);

    const updated = await this.messageModel
      .findOneAndUpdate(
        {
          _id: message._id,
          roomId: new Types.ObjectId(roomId),
          senderId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        { $set: { content: dto.content.trim(), editedAt: new Date() } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Message was deleted.');
    this.events.emit(roomId, 'message-updated', updated);
    return updated;
  }

  async deleteMessage(
    roomId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMembership(roomId, userId);

    const message = await this.findMessage(roomId, messageId);
    this.assertSender(message, userId);

    const deleted = await this.messageModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(messageId),
          roomId: new Types.ObjectId(roomId),
          senderId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        {
          $set: {
            content: '[Message deleted]',
            reactions: [],
            deletedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!deleted) throw new NotFoundException('Message was already deleted.');
    this.events.emit(roomId, 'message-updated', deleted);
  }

  private async assertMembership(
    roomId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.roomsService.findMembership(roomId, userId);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this room.');
    }
  }

  private async findMessage(
    roomId: string,
    messageId: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel
      .findOne({
        _id: new Types.ObjectId(messageId),
        roomId: new Types.ObjectId(roomId),
      })
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    return message;
  }

  private assertSender(message: MessageDocument, userId: string): void {
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own messages.');
    }
  }
}
