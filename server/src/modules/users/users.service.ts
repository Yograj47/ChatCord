import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'node:crypto';
import {
  AuthProvider,
  AvatarSource,
  User,
  UserDocument,
  UserType,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByGoogleId(providerId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        'identity.provider': AuthProvider.GOOGLE,
        'identity.providerId': providerId,
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.trim().toLowerCase() })
      .exec();
  }

  async createFromGoogle(data: {
    email: string;
    displayName: string;
    providerId: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      type: UserType.REGISTERED,
      username: this.generateUsername(data.email),
      displayName: data.displayName,
      email: data.email,
      identity: {
        provider: AuthProvider.GOOGLE,
        providerId: data.providerId,
      },
      avatar: data.avatarUrl
        ? {
            url: data.avatarUrl,
            source: AvatarSource.GOOGLE,
          }
        : undefined,
    });

    return user.save();
  }

  async updateDisplayName(
    userId: string,
    displayName: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { displayName: displayName.trim() },
        { new: true },
      )
      .exec();
  }

  async deleteById(userId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: userId }).exec();

    return result.deletedCount === 1;
  }

  private generateUsername(email: string): string {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || 'user';

    return `${base}_${randomBytes(3).toString('hex')}`;
  }
}
