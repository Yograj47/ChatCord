import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import {
  Message,
  MessageDocument,
  RoomActivityEvent,
} from '../messages/schemas/message.schema';
import { MessageEventsService } from '../messages/message-events.service';

@Injectable()
export class RoomActivityService {
  private readonly logger = new Logger(RoomActivityService.name);
  constructor(
    @InjectModel(Message.name)
    private readonly messages: Model<MessageDocument>,
    private readonly users: UsersService,
    private readonly events: MessageEventsService,
  ) {}
  async record(
    roomId: string,
    event: RoomActivityEvent,
    actorId: string,
    detail?: string,
    targetId?: string,
  ) {
    try {
      const profiles = await this.users.publicProfiles([
        actorId,
        ...(targetId ? [targetId] : []),
      ]);
      const name = (id: string) => {
        const user = profiles.find((profile) => profile._id.toString() === id);
        return user?.username
          ? `@${user.username}`
          : user?.displayName || 'A member';
      };
      const actor = name(actorId);
      const target = targetId ? name(targetId) : 'a member';
      const content = {
        joined: `${actor} joined the room.`,
        left: `${actor} left the room.`,
        removed: `${actor} removed ${target} from the room.`,
        expired: `${actor} left the room (guest session expired).`,
        renamed: `${actor} renamed the room to “${detail ?? ''}”.`,
        permissions: `${actor} updated room settings: ${detail ?? 'permissions changed'}.`,
        role: `${actor} changed ${target}'s role to ${detail ?? 'member'}.`,
      }[event];
      const message = await this.messages.create({
        roomId: new Types.ObjectId(roomId),
        senderId: new Types.ObjectId(actorId),
        kind: 'system',
        systemEvent: event,
        content,
      });
      await this.events.emit(roomId, 'new-message', message);
    } catch (error: unknown) {
      this.logger.error(
        'Room changed but its activity message could not be recorded.',
        error,
      );
    }
  }
}
