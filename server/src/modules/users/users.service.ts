import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async publicProfiles(ids: string[]) {
    return this.userModel
      .find({ _id: { $in: ids } })
      .select('_id username displayName avatar')
      .lean()
      .exec();
  }

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
      // Leave the username unset so new users complete onboarding.
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

  async setUsername(
    userId: string,
    username: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { username: username.trim().toLowerCase() },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async completeOnboarding(
    userId: string,
    username: string,
    displayName?: string,
  ) {
    try {
      const user = await this.userModel
        .findOneAndUpdate(
          { _id: userId, type: UserType.REGISTERED },
          {
            $set: {
              username: username.trim().toLowerCase(),
              ...(displayName === undefined
                ? {}
                : { displayName: displayName.trim() }),
            },
          },
          { new: true, runValidators: true },
        )
        .exec();
      if (!user) throw new NotFoundException('Registered user not found.');
      return user;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Username is already taken.');
      }
      throw error;
    }
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

  async searchByUsername(query: string, currentUserId: string) {
    const normalizedQuery = query.trim().toLowerCase();

    const users = await this.userModel
      .find({
        type: UserType.REGISTERED,
        username: { $regex: `^${normalizedQuery}` },
        _id: { $ne: currentUserId },
      })
      .select('_id username displayName avatar')
      .sort({ username: 1 })
      .limit(20)
      .lean()
      .exec();

    return users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    }));
  }
}
