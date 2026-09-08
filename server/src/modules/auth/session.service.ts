import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';

import {
  Session,
  SessionDocument,
  SessionType,
} from './schemas/session.schema';
import { AUTH_SESSION } from 'src/common/constants/auth.constants';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async createGuestSession(ipAddress?: string, userAgent?: string) {
    const now = new Date();

    return this.createSession({
      type: SessionType.GUEST,
      userId: null,
      ipAddress,
      userAgent,
      expiresAt: new Date(now.getTime() + AUTH_SESSION.GUEST_TTL),
      absoluteExpiresAt: new Date(now.getTime() + AUTH_SESSION.GUEST_TTL),
    });
  }

  async createUserSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const now = new Date();

    return this.createSession({
      type: SessionType.REGISTERED,
      userId: new Types.ObjectId(userId),
      ipAddress,
      userAgent,
      expiresAt: new Date(now.getTime() + AUTH_SESSION.REGISTERED_IDLE_TTL),
      absoluteExpiresAt: new Date(
        now.getTime() + AUTH_SESSION.REGISTERED_ABSOLUTE_TTL,
      ),
    });
  }

  private async createSession(data: {
    type: SessionType;
    userId: Types.ObjectId | null;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    absoluteExpiresAt: Date;
  }) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const session = await this.sessionModel.create({
      ...data,
      tokenHash,
      lastActiveAt: now,
    });

    return {
      session,
      token,
    };
  }

  async validateSession(token: string) {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const session = await this.sessionModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: now },
        absoluteExpiresAt: { $gt: now },
      })
      .exec();

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    if (session.type === SessionType.REGISTERED) {
      const nextExpiry = new Date(
        now.getTime() + AUTH_SESSION.REGISTERED_IDLE_TTL,
      );

      session.expiresAt =
        nextExpiry < session.absoluteExpiresAt
          ? nextExpiry
          : session.absoluteExpiresAt;
    }

    session.lastActiveAt = now;

    await session.save();

    return session;
  }

  async deleteSession(token: string) {
    await this.sessionModel.deleteOne({
      tokenHash: this.hashToken(token),
    });
  }

  async deleteUserSessions(userId: string) {
    await this.sessionModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
