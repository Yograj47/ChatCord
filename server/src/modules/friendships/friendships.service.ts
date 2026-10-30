import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserType } from '../users/schemas/user.schema';
import {
  Friendship,
  FriendshipDocument,
  FriendshipStatus,
} from './schemas/friendship.schema';

@Injectable()
export class FriendshipsService {
  async assertFriends(firstId: string, secondId: string): Promise<void> {
    const first = this.objectId(firstId).toHexString();
    const second = this.objectId(secondId).toHexString();
    const friendship = await this.model
      .exists({
        pairKey: [first, second].sort().join(':'),
        status: FriendshipStatus.ACCEPTED,
      })
      .exec();
    if (!friendship)
      throw new ConflictException(
        'An accepted friendship is required for direct messages.',
      );
  }
  constructor(
    @InjectModel(Friendship.name)
    private readonly model: Model<FriendshipDocument>,
    private readonly usersService: UsersService,
  ) {}

  private objectId(value: string): Types.ObjectId {
    if (!/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('Invalid ID.');
    }
    return new Types.ObjectId(value);
  }

  async send(userId: string, recipientId: string) {
    const requester = this.objectId(userId);
    const recipient = this.objectId(recipientId);
    if (requester.equals(recipient)) {
      throw new BadRequestException(
        'You cannot send yourself a friend request.',
      );
    }
    const target = await this.usersService.findById(recipient.toHexString());
    if (!target || target.type !== UserType.REGISTERED) {
      throw new NotFoundException('Registered user not found.');
    }
    try {
      const friendship = await this.model.create({
        pairKey: [requester.toHexString(), recipient.toHexString()]
          .sort()
          .join(':'),
        requester,
        recipient,
        status: FriendshipStatus.PENDING,
      });
      return { id: friendship._id.toString(), status: friendship.status };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          'A request or friendship already exists between these users.',
        );
      }
      throw error;
    }
  }

  async requests(userId: string) {
    const id = this.objectId(userId);
    const rows = await this.model
      .find({
        status: FriendshipStatus.PENDING,
        $or: [{ requester: id }, { recipient: id }],
      })
      .select('_id requester recipient createdAt')
      .populate('requester recipient', '_id username displayName avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows;
  }

  async friends(userId: string) {
    const id = this.objectId(userId);
    const rows = await this.model
      .find({
        status: FriendshipStatus.ACCEPTED,
        $or: [{ requester: id }, { recipient: id }],
      })
      .select('_id requester recipient')
      .populate('requester recipient', '_id username displayName avatar')
      .sort({ _id: -1 })
      .lean()
      .exec();
    return rows
      .map((row) => ({
        id: row._id.toString(),
        user:
          row.requester && row.requester._id.toString() === id.toString()
            ? row.recipient
            : row.requester,
      }))
      .filter((row) => row.user !== null);
  }

  async accept(userId: string, requestId: string) {
    const row = await this.model
      .findOneAndUpdate(
        {
          _id: this.objectId(requestId),
          recipient: this.objectId(userId),
          status: FriendshipStatus.PENDING,
        },
        { $set: { status: FriendshipStatus.ACCEPTED } },
        { new: true },
      )
      .exec();
    if (!row)
      throw new NotFoundException('Incoming pending request not found.');
    return { id: row._id.toString(), status: row.status };
  }

  async dismiss(
    userId: string,
    requestId: string,
    action: 'decline' | 'cancel',
  ) {
    const row = await this.model
      .findOneAndDelete({
        _id: this.objectId(requestId),
        [action === 'decline' ? 'recipient' : 'requester']:
          this.objectId(userId),
        status: FriendshipStatus.PENDING,
      })
      .exec();
    if (!row) throw new NotFoundException('Pending request not found.');
    return { success: true };
  }

  async remove(userId: string, friendshipId: string) {
    const id = this.objectId(userId);
    const row = await this.model
      .findOneAndDelete({
        _id: this.objectId(friendshipId),
        status: FriendshipStatus.ACCEPTED,
        $or: [{ requester: id }, { recipient: id }],
      })
      .exec();
    if (!row) throw new NotFoundException('Friendship not found.');
    return { success: true };
  }
}
