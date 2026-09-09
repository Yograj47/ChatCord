import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';

export enum SessionType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

@Schema({
  timestamps: true,
  strict: true,
})
export class Session {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  userId!: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: SessionType,
    index: true,
  })
  type!: SessionType;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  tokenHash!: string;

  @Prop({
    required: true,
    index: true,
  })
  expiresAt!: Date;

  @Prop({
    required: true,
  })
  absoluteExpiresAt!: Date;

  @Prop({
    required: true,
  })
  lastActiveAt!: Date;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
export type SessionDocument = HydratedDocument<Session>;

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
