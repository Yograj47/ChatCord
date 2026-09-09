import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>('auth.googleClientId'),
    );
  }

  async googleLogin(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: this.configService.getOrThrow<string>('auth.googleClientId'),
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google account information.');
    }

    let user = await this.usersService.findByGoogleId(payload.sub);

    if (!user) {
      user = await this.usersService.createFromGoogle({
        providerId: payload.sub,
        email: payload.email,
        displayName: payload.name ?? 'ChatCord User',
        avatarUrl: payload.picture,
      });
    }

    return user;
  }

  async createGuestSession(ipAddress?: string, userAgent?: string) {
    return this.sessionService.createGuestSession(ipAddress, userAgent);
  }

  async createUserSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.sessionService.createUserSession(userId, ipAddress, userAgent);
  }

  async logout(token: string) {
    await this.sessionService.deleteSession(token);

    return {
      message: 'Logout successful.',
    };
  }
}
