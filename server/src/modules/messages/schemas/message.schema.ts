import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: true,
  strict: true,
})
export class Message {
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

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({
  roomId: 1,
  createdAt: -1,
});
