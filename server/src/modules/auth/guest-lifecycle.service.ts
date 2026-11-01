import { RoomActivityService } from '../rooms/room-activity.service';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { User, UserDocument, UserType } from '../users/schemas/user.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class GuestLifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuestLifecycleService.name);
  private timer?: ReturnType<typeof setInterval>;
  private cleaning = false;
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Room.name) private readonly rooms: Model<RoomDocument>,
    @InjectModel(Session.name)
    private readonly sessions: Model<SessionDocument>,
    private readonly activity: RoomActivityService,
  ) {}
  onModuleInit() {
    const clean = () => {
      void this.cleanup().catch((error: unknown) =>
        this.logger.error('Guest cleanup failed', error),
      );
    };
    clean();
    this.timer = setInterval(clean, 30_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async create(expiresAt: Date) {
    const username = `guest_${randomBytes(6).toString('hex')}`;
    return this.users.create({
      type: UserType.GUEST,
      username,
      displayName: username,
      expiresAt,
    });
  }
  async isActive(id: Types.ObjectId) {
    return Boolean(
      await this.users.exists({
        _id: id,
        type: UserType.GUEST,
        expiresAt: { $gt: new Date() },
      }),
    );
  }
  async cleanup() {
    if (this.cleaning) return;
    this.cleaning = true;
    try {
      const expired = await this.users
        .find({ type: UserType.GUEST, expiresAt: { $lte: new Date() } })
        .select('_id')
        .limit(500)
        .lean()
        .exec();
      const ids = expired.map((user) => user._id);
      if (!ids.length) return;
      const affectedRooms = await this.rooms
        .find({ 'members.userId': { $in: ids } })
        .select('_id members')
        .lean()
        .exec();
      // Remove memberships before deleting identities so a failed cleanup can safely retry.
      await this.rooms.updateMany(
        { 'members.userId': { $in: ids } },
        { $pull: { members: { userId: { $in: ids } } } },
      );
      for (const room of affectedRooms) {
        for (const member of room.members.filter((member) =>
          ids.some((id) => id.equals(member.userId)),
        ))
          await this.activity.record(
            room._id.toString(),
            'expired',
            member.userId.toString(),
          );
      }
      await this.sessions.deleteMany({ userId: { $in: ids } });
      await this.users.deleteMany({ _id: { $in: ids }, type: UserType.GUEST });
    } finally {
      this.cleaning = false;
    }
  }
}
