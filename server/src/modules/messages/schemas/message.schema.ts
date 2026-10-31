import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: true,
  strict: true,
})
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  replyTo?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  editedAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({
    type: [
      {
        _id: false,
        emoji: String,
        userId: { type: Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  reactions!: { emoji: string; userId: Types.ObjectId }[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  })
  roomId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  senderId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 4000,
  })
  content!: string;
}

export type MessageDocument = HydratedDocument<Message>;

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ roomId: 1, _id: -1 });
MessageSchema.index({ roomId: 1, replyTo: 1, _id: -1 });

MessageSchema.index({
  roomId: 1,
  createdAt: -1,
});
