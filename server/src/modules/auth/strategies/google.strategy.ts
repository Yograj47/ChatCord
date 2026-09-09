import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('auth.googleClientId'),
      clientSecret: configService.getOrThrow<string>('auth.googleClientSecret'),
      callbackURL: configService.getOrThrow<string>('auth.googleCallbackUrl'),
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException(
        'Google account does not provide an email address.',
      );
    }

    let user = await this.usersService.findByGoogleId(providerId);

    if (!user) {
      user = await this.usersService.createFromGoogle({
        providerId,
        email,
        displayName: profile.displayName ?? 'ChatCord User',
        avatarUrl: profile.photos?.[0]?.value,
      });
    }

    return user;
  }
}
