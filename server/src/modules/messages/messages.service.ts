import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { RoomsService } from '../rooms/rooms.service';
import { RoomCapability } from '../rooms/schemas/room.schema';
import { CreateMessageDto } from './dto/create-message-dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly roomsService: RoomsService,
  ) {}

  async createMessage(
    roomId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageDocument> {
    const room = await this.roomsService.findById(roomId);
    await this.assertMembership(roomId, senderId);

    if (!room.capabilities.includes(RoomCapability.TEXT)) {
      throw new ForbiddenException(
        'Text messages are not enabled for this room.',
      );
    }

    const message = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(senderId),
      content: dto.content.trim(),
    });

    return message.save();
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

    message.content = dto.content.trim();
    return message.save();
  }

  async deleteMessage(
    roomId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    await this.assertMembership(roomId, userId);

    const message = await this.findMessage(roomId, messageId);
    this.assertSender(message, userId);

    await this.messageModel
      .deleteOne({
        _id: new Types.ObjectId(messageId),
        roomId: new Types.ObjectId(roomId),
      })
      .exec();
  }

  private async assertMembership(
    roomId: string,
    userId: string,
  ): Promise<void> {
    await this.roomsService.findById(roomId);

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
