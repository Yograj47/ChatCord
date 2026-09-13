import {
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
} from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name)
    private readonly roomModel: Model<RoomDocument>,
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto): Promise<RoomDocument> {
    if (dto.type === RoomType.DM) {
      throw new ForbiddenException(
        'Direct messages require a separate DM creation flow.',
      );
    }

    if (dto.type === RoomType.GROUP && !dto.name?.trim()) {
      throw new ConflictException('Group room name is required.');
    }

    const room = new this.roomModel({
      type: dto.type,
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      visibility: dto.visibility ?? RoomVisibility.PRIVATE,
      capabilities: dto.capabilities,
      createdBy: new Types.ObjectId(userId),
      members: [
        {
          userId: new Types.ObjectId(userId),
          role: RoomMemberRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    });

    return room.save();
  }

  async findAllForUser(userId: string): Promise<RoomDocument[]> {
    return this.roomModel
      .find({
        'members.userId': new Types.ObjectId(userId),
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(roomId: string): Promise<RoomDocument> {
    const room = await this.roomModel.findById(roomId).exec();

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return room;
  }

  async findMembership(
    roomId: string,
    userId: string,
  ): Promise<RoomMemberRole | null> {
    const room = await this.roomModel
      .findOne(
        {
          _id: roomId,
          'members.userId': new Types.ObjectId(userId),
        },
        {
          members: {
            $elemMatch: {
              userId: new Types.ObjectId(userId),
            },
          },
        },
      )
      .exec();

    return room?.members[0]?.role ?? null;
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    if (room.type === RoomType.DM) {
      throw new ForbiddenException('DM rooms cannot be joined.');
    }

    if (room.visibility !== RoomVisibility.PUBLIC) {
      throw new ForbiddenException('Private rooms require an invitation.');
    }

    const alreadyMember = room.members.some(
      (member) => member.userId.toString() === userId,
    );

    if (alreadyMember) {
      throw new ConflictException('User is already a room member.');
    }

    room.members.push({
      userId: new Types.ObjectId(userId),
      role: RoomMemberRole.MEMBER,
      joinedAt: new Date(),
    });

    return room.save();
  }

  async leaveRoom(roomId: string, userId: string): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    const memberIndex = room.members.findIndex(
      (member) => member.userId.toString() === userId,
    );

    if (memberIndex === -1) {
      throw new NotFoundException('User is not a member of this room.');
    }

    const member = room.members[memberIndex];

    if (member.role === RoomMemberRole.OWNER) {
      throw new ForbiddenException(
        'Room owner cannot leave without transferring ownership.',
      );
    }

    room.members.splice(memberIndex, 1);

    return room.save();
  }

  async updateRoom(
    roomId: string,
    userId: string,
    dto: UpdateRoomDto,
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    const member = this.getMember(room, userId);

    if (
      member.role !== RoomMemberRole.OWNER &&
      member.role !== RoomMemberRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this room.',
      );
    }

    if (dto.name !== undefined) {
      room.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      room.description = dto.description.trim();
    }

    if (dto.visibility !== undefined) {
      room.visibility = dto.visibility;
    }

    if (dto.capabilities !== undefined) {
      room.capabilities = dto.capabilities;
    }

    return room.save();
  }

  async deleteRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.findById(roomId);

    const member = this.getMember(room, userId);

    if (member.role !== RoomMemberRole.OWNER) {
      throw new ForbiddenException('Only the room owner can delete the room.');
    }

    await this.roomModel.deleteOne({ _id: roomId }).exec();
  }

  async addMember(
    roomId: string,
    userId: string,
    targetUserId: string,
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    this.assertCanManageMembers(room, userId);

    const alreadyMember = room.members.some(
      (member) => member.userId.toString() === targetUserId,
    );

    if (alreadyMember) {
      throw new ConflictException('User is already a room member.');
    }

    room.members.push({
      userId: new Types.ObjectId(targetUserId),
      role: RoomMemberRole.MEMBER,
      joinedAt: new Date(),
    });

    return room.save();
  }

  async removeMember(
    roomId: string,
    userId: string,
    targetUserId: string,
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    this.assertCanManageMembers(room, userId);

    const targetIndex = room.members.findIndex(
      (member) => member.userId.toString() === targetUserId,
    );

    if (targetIndex === -1) {
      throw new NotFoundException('User is not a member of this room.');
    }

    if (room.members[targetIndex].role === RoomMemberRole.OWNER) {
      throw new ForbiddenException('The room owner cannot be removed.');
    }

    room.members.splice(targetIndex, 1);

    return room.save();
  }

  async updateMemberRole(
    roomId: string,
    userId: string,
    targetUserId: string,
    role: RoomMemberRole,
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    const requester = this.getMember(room, userId);

    if (requester.role !== RoomMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the room owner can change member roles.',
      );
    }

    const target = this.getMember(room, targetUserId);

    if (target.role === RoomMemberRole.OWNER) {
      throw new ForbiddenException(
        'Room ownership cannot be changed through this operation.',
      );
    }

    if (role === RoomMemberRole.OWNER) {
      throw new ForbiddenException(
        'Ownership cannot be assigned through this operation.',
      );
    }

    target.role = role;

    return room.save();
  }

  private getMember(room: RoomDocument, userId: string) {
    const member = room.members.find(
      (item) => item.userId.toString() === userId,
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this room.');
    }

    return member;
  }

  private assertCanManageMembers(room: RoomDocument, userId: string): void {
    const member = this.getMember(room, userId);

    if (
      member.role !== RoomMemberRole.OWNER &&
      member.role !== RoomMemberRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage room members.',
      );
    }
  }
}
