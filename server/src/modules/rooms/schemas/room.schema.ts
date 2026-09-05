import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum RoomType {
  DM = 'dm',
  GROUP = 'group',
}

export enum RoomVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum RoomCapability {
  TEXT = 'text',
  MEDIA = 'media',
  VOICE = 'voice',
  VIDEO = 'video',
}

export enum RoomMemberRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

@Schema({
  _id: false,
})
export class RoomMember {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: RoomMemberRole,
    default: RoomMemberRole.MEMBER,
  })
  role!: RoomMemberRole;

  @Prop({
    type: Date,
    default: Date.now,
  })
  joinedAt!: Date;
}

export const RoomMemberSchema = SchemaFactory.createForClass(RoomMember);

@Schema({
  timestamps: true,
  strict: true,
})
export class Room {
  @Prop({
    required: true,
    enum: RoomType,
  })
  type!: RoomType;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  name?: string;

  @Prop({
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    index: true,
    maxlength: 120,
  })
  slug?: string;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @Prop({
    required: true,
    enum: RoomVisibility,
    default: RoomVisibility.PRIVATE,
  })
  visibility!: RoomVisibility;

  @Prop({
    type: [String],
    enum: RoomCapability,
    default: [RoomCapability.TEXT],
  })
  capabilities!: RoomCapability[];

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({
    type: [RoomMemberSchema],
    default: [],
  })
  members!: RoomMember[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ type: 1, createdBy: 1 });
RoomSchema.index({ 'members.userId': 1 });
