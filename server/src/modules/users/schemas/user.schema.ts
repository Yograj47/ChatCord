import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum UserType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

export enum AuthProvider {
  GOOGLE = 'google',
}

export enum AvatarSource {
  GOOGLE = 'google',
  UPLOAD = 'upload',
}

@Schema({
  timestamps: true,
  strict: true,
})
export class User {
  @Prop({
    required: true,
    enum: UserType,
  })
  type!: UserType;

  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
  })
  username!: string;

  @Prop({
    required: true,
    trim: true,
  })
  displayName!: string;

  @Prop({
    trim: true,
    lowercase: true,
  })
  email?: string;

  @Prop({
    type: {
      provider: {
        type: String,
        enum: AuthProvider,
      },
      providerId: {
        type: String,
      },
    },
    _id: false,
  })
  identity?: {
    provider?: AuthProvider;
    providerId?: string;
  };

  @Prop({
    type: {
      url: {
        type: String,
      },
      source: {
        type: String,
        enum: AvatarSource,
      },
    },
    _id: false,
  })
  avatar?: {
    url: string;
    source: AvatarSource;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
