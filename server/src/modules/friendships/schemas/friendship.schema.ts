import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

@Schema({ timestamps: true })
export class Friendship {
  @Prop({ required: true, unique: true })
  pairKey!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient!: Types.ObjectId;

  @Prop({
    required: true,
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status!: FriendshipStatus;
}

export type FriendshipDocument = HydratedDocument<Friendship>;
export const FriendshipSchema = SchemaFactory.createForClass(Friendship);
FriendshipSchema.index({ requester: 1, status: 1 });
FriendshipSchema.index({ recipient: 1, status: 1 });
