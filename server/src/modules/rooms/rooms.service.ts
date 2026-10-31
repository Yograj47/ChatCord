import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Room,
  RoomDocument,
  RoomMemberRole,
  RoomType,
  RoomVisibility,
  RoomCapability,
} from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { UserType } from '../users/schemas/user.schema';
import { FriendshipsService } from '../friendships/friendships.service';
import { RoomEventsService } from './room-events.service';

@Injectable()
export class RoomsService {
  async presencePeers(userId: string): Promise<string[]> {
    const rooms = await this.findAllForUser(userId);
    const friends = await this.friendships.friends(userId);
    return [
      ...new Set([
        userId,
        ...rooms.flatMap((room) =>
          room.members.map((member) => member.userId.toString()),
        ),
        ...friends.map((friend) => friend.user._id.toString()),
      ]),
    ];
  }
  async members(roomId: string, userId: string) {
    const room = await this.findById(roomId);
    this.member(room, userId);
    const profiles = await this.usersService.publicProfiles(
      room.members.map((member) => member.userId.toString()),
    );
    const byId = new Map(
      profiles.map((profile) => [profile._id.toString(), profile]),
    );
    return room.members.map((member) => ({
      id: member.userId.toString(),
      username: byId.get(member.userId.toString())?.username,
      displayName:
        byId.get(member.userId.toString())?.displayName ?? 'Deleted user',
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
    private readonly friendships: FriendshipsService,
    private readonly roomEvents: RoomEventsService,
  ) {}

  private id(value: string) {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value))
      throw new BadRequestException('Invalid ID.');
    return new Types.ObjectId(value);
  }

  private async invalidate(room: RoomDocument) {
    this.roomEvents.changed(room._id.toString());
    await this.redisService.deleteCache(`cache:room:${room._id.toString()}`);
    if (room.slug)
      await this.redisService.deleteCache(`cache:room:${room.slug}`);
  }

  // Fetch fresh documents: cached JSON cannot safely authorize or mutate rooms.
  async findById(roomId: string): Promise<RoomDocument> {
    if (typeof roomId !== 'string' || !roomId.trim())
      throw new BadRequestException('Room identifier required.');
    const room = await this.roomModel
      .findOne(
        /^[a-f\d]{24}$/i.test(roomId) ? { _id: roomId } : { slug: roomId },
      )
      .exec();
    if (!room) throw new NotFoundException('Room not found.');
    return room;
  }

  async findAccessible(roomId: string, userId: string) {
    this.id(userId);
    const room = await this.findById(roomId);
    if (room.type === RoomType.DM || room.visibility === RoomVisibility.PRIVATE)
      this.member(room, userId);
    return room;
  }

  async createRoom(userId: string, dto: CreateRoomDto) {
    const id = this.id(userId);
    if (dto.type === RoomType.DM)
      throw new ForbiddenException('Use the direct message creation flow.');
    if (!dto.name?.trim())
      throw new ConflictException('Group room name is required.');
    return this.roomModel.create({
      ...dto,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      createdBy: id,
      members: [
        { userId: id, role: RoomMemberRole.OWNER, joinedAt: new Date() },
      ],
    });
  }

  async findAllForUser(userId: string) {
    return this.roomModel
      .find({ 'members.userId': this.id(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findMembership(
    roomId: string,
    userId: string,
  ): Promise<RoomMemberRole | null> {
    const room = await this.findById(roomId);
    const id = this.id(userId).toHexString();
    return (
      room.members.find((member) => member.userId.toString() === id)?.role ??
      null
    );
  }

  private member(room: RoomDocument, userId: string) {
    const id = this.id(userId).toHexString();
    const member = room.members.find((item) => item.userId.toString() === id);
    if (!member)
      throw new ForbiddenException('You are not a member of this room.');
    return member;
  }

  private manager(room: RoomDocument, userId: string, ownerOnly = false) {
    if (room.type === RoomType.DM)
      throw new ForbiddenException(
        'DM membership and settings cannot be changed.',
      );
    const member = this.member(room, userId);
    if (
      member.role !== RoomMemberRole.OWNER &&
      (ownerOnly || member.role !== RoomMemberRole.MODERATOR)
    )
      throw new ForbiddenException(
        'You do not have permission to manage this room.',
      );
  }

  private managerFilter(userId: string, ownerOnly = false) {
    return {
      $elemMatch: {
        userId: this.id(userId),
        role: {
          $in: ownerOnly
            ? [RoomMemberRole.OWNER]
            : [RoomMemberRole.OWNER, RoomMemberRole.MODERATOR],
        },
      },
    };
  }

  private async changed(
    room: RoomDocument,
    updated: RoomDocument | null,
    removedUserId?: string,
  ) {
    if (!updated)
      throw new ConflictException('Room changed; refresh and try again.');
    if (removedUserId)
      this.roomEvents.changed(room._id.toString(), removedUserId);
    await this.invalidate(room);
    return updated;
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.findById(roomId);
    const id = this.id(userId);
    if (room.type === RoomType.DM || room.visibility !== RoomVisibility.PUBLIC)
      throw new ForbiddenException('This room requires an invitation.');
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            type: RoomType.GROUP,
            visibility: RoomVisibility.PUBLIC,
            'members.userId': { $ne: id },
          },
          {
            $push: {
              members: {
                userId: id,
                role: RoomMemberRole.MEMBER,
                joinedAt: new Date(),
              },
            },
          },
          { new: true, runValidators: true },
        )
        .exec(),
    );
  }

  async leaveRoom(roomId: string, userId: string) {
    const room = await this.findById(roomId);
    if (room.type === RoomType.DM)
      throw new ForbiddenException('DM membership cannot be changed.');
    if (this.member(room, userId).role === RoomMemberRole.OWNER)
      throw new ForbiddenException(
        'Room owner cannot leave without transferring ownership.',
      );
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            members: {
              $elemMatch: {
                userId: this.id(userId),
                role: { $ne: RoomMemberRole.OWNER },
              },
            },
          },
          { $pull: { members: { userId: this.id(userId) } } },
          { new: true },
        )
        .exec(),
      userId,
    );
  }

  async updateRoom(roomId: string, userId: string, dto: UpdateRoomDto) {
    const room = await this.findById(roomId);
    this.manager(room, userId);
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            members: this.managerFilter(userId),
            type: RoomType.GROUP,
          },
          {
            $set: {
              ...dto,
              ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
              ...(dto.description === undefined
                ? {}
                : { description: dto.description.trim() }),
            },
          },
          { new: true, runValidators: true },
        )
        .exec(),
    );
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.findById(roomId);
    this.manager(room, userId, true);
    const result = await this.roomModel
      .deleteOne({
        _id: room._id,
        type: RoomType.GROUP,
        members: this.managerFilter(userId, true),
      })
      .exec();
    if (!result.deletedCount)
      throw new ConflictException('Room changed; refresh and try again.');
    await this.invalidate(room);
  }

  // Adding a member sends an invitation; membership requires the recipient's consent.
  async addMember(roomId: string, userId: string, targetUserId: string) {
    const room = await this.findById(roomId);
    this.manager(room, userId);
    const targetId = this.id(targetUserId);
    const target = await this.usersService.findById(targetId.toHexString());
    if (!target || target.type !== UserType.REGISTERED)
      throw new NotFoundException('Registered user not found.');
    const invitation = {
      _id: new Types.ObjectId(),
      recipient: targetId,
      invitedBy: this.id(userId),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    const updated = await this.roomModel
      .findOneAndUpdate(
        {
          _id: room._id,
          type: RoomType.GROUP,
          members: this.managerFilter(userId),
          'members.userId': { $ne: targetId },
          invitations: {
            $not: {
              $elemMatch: {
                recipient: targetId,
                expiresAt: { $gt: new Date() },
              },
            },
          },
        },
        { $push: { invitations: invitation } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated)
      throw new ConflictException(
        'User is a member, already invited, or room permissions changed.',
      );
    return {
      id: invitation._id.toString(),
      roomId: room._id.toString(),
      expiresAt: invitation.expiresAt,
    };
  }

  async invitations(userId: string) {
    const id = this.id(userId);
    const rooms = await this.roomModel
      .find({
        invitations: {
          $elemMatch: { recipient: id, expiresAt: { $gt: new Date() } },
        },
      })
      .select('name +invitations')
      .exec();
    return rooms.flatMap((room) =>
      room.invitations
        .filter(
          (invitation) =>
            invitation.recipient.equals(id) &&
            invitation.expiresAt > new Date(),
        )
        .map((invitation) => ({
          id: invitation._id.toString(),
          roomId: room._id.toString(),
          roomName: room.name,
          invitedBy: invitation.invitedBy.toString(),
          expiresAt: invitation.expiresAt,
        })),
    );
  }

  async acceptInvitation(roomId: string, invitationId: string, userId: string) {
    const room = await this.findById(roomId);
    const id = this.id(userId);
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            type: RoomType.GROUP,
            'members.userId': { $ne: id },
            invitations: {
              $elemMatch: {
                _id: this.id(invitationId),
                recipient: id,
                expiresAt: { $gt: new Date() },
              },
            },
          },
          {
            $push: {
              members: {
                userId: id,
                role: RoomMemberRole.MEMBER,
                joinedAt: new Date(),
              },
            },
            $pull: { invitations: { recipient: id } },
          },
          { new: true, runValidators: true },
        )
        .exec(),
    );
  }

  async declineInvitation(
    roomId: string,
    invitationId: string,
    userId: string,
  ) {
    const room = await this.findById(roomId);
    const invitation = {
      _id: this.id(invitationId),
      recipient: this.id(userId),
    };
    const result = await this.roomModel
      .updateOne(
        { _id: room._id, invitations: { $elemMatch: invitation } },
        { $pull: { invitations: invitation } },
      )
      .exec();
    if (!result.modifiedCount)
      throw new NotFoundException('Invitation not found.');
    return { success: true };
  }

  async removeMember(roomId: string, userId: string, targetUserId: string) {
    const room = await this.findById(roomId);
    this.manager(room, userId);
    const actor = this.member(room, userId);
    const target = this.member(room, targetUserId);
    if (
      actor.role !== RoomMemberRole.OWNER &&
      target.role !== RoomMemberRole.MEMBER
    )
      throw new ForbiddenException('Only the owner can remove moderators.');
    if (this.member(room, targetUserId).role === RoomMemberRole.OWNER)
      throw new ForbiddenException('The room owner cannot be removed.');
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            type: RoomType.GROUP,
            $and: [
              { members: this.managerFilter(userId) },
              {
                members: {
                  $elemMatch: {
                    userId: this.id(targetUserId),
                    role: {
                      $in:
                        actor.role === RoomMemberRole.OWNER
                          ? [RoomMemberRole.MEMBER, RoomMemberRole.MODERATOR]
                          : [RoomMemberRole.MEMBER],
                    },
                  },
                },
              },
            ],
          },
          { $pull: { members: { userId: this.id(targetUserId) } } },
          { new: true },
        )
        .exec(),
      targetUserId,
    );
  }

  async updateMemberRole(
    roomId: string,
    userId: string,
    targetUserId: string,
    role: RoomMemberRole,
  ) {
    if (![RoomMemberRole.MEMBER, RoomMemberRole.MODERATOR].includes(role))
      throw new BadRequestException('Invalid member role.');
    const room = await this.findById(roomId);
    this.manager(room, userId, true);
    if (this.member(room, targetUserId).role === RoomMemberRole.OWNER)
      throw new ForbiddenException(
        'Room ownership cannot be changed through this operation.',
      );
    return this.changed(
      room,
      await this.roomModel
        .findOneAndUpdate(
          {
            _id: room._id,
            type: RoomType.GROUP,
            $and: [
              { members: this.managerFilter(userId, true) },
              {
                members: {
                  $elemMatch: {
                    userId: this.id(targetUserId),
                    role: { $ne: RoomMemberRole.OWNER },
                  },
                },
              },
            ],
          },
          { $set: { 'members.$[target].role': role } },
          {
            arrayFilters: [{ 'target.userId': this.id(targetUserId) }],
            new: true,
            runValidators: true,
          },
        )
        .exec(),
    );
  }

  async createDm(userId: string, targetUserId: string) {
    const id = this.id(userId);
    const target = this.id(targetUserId);
    if (id.equals(target))
      throw new BadRequestException('Cannot create a DM with yourself.');
    await this.friendships.assertFriends(
      id.toHexString(),
      target.toHexString(),
    );
    const targetUser = await this.usersService.findById(target.toHexString());
    if (!targetUser || targetUser.type !== UserType.REGISTERED)
      throw new NotFoundException('Registered user not found.');
    const dmPairKey = [id.toHexString(), target.toHexString()].sort().join(':');
    const existing = await this.roomModel.findOne({ dmPairKey }).exec();
    if (existing) return existing;
    try {
      return await this.roomModel.create({
        type: RoomType.DM,
        dmPairKey,
        visibility: RoomVisibility.PRIVATE,
        capabilities: [RoomCapability.TEXT],
        createdBy: id,
        members: [id, target].map((userId) => ({
          userId,
          role: RoomMemberRole.MEMBER,
          joinedAt: new Date(),
        })),
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        const room = await this.roomModel.findOne({ dmPairKey }).exec();
        if (room) return room;
      }
      throw error;
    }
  }

  async listDms(userId: string) {
    return this.roomModel
      .find({ type: RoomType.DM, 'members.userId': this.id(userId) })
      .populate('members.userId', '_id username displayName avatar')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async assertCanSend(room: RoomDocument, userId: string) {
    this.member(room, userId);
    if (room.type === RoomType.DM) {
      const other = room.members.find(
        (member) => member.userId.toString() !== this.id(userId).toHexString(),
      );
      if (room.members.length !== 2 || !other)
        throw new ForbiddenException('Invalid DM membership.');
      await this.friendships.assertFriends(userId, other.userId.toString());
    }
  }
}
