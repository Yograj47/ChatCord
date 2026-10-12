import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AUTH_COOKIE, AUTH_SESSION } from 'src/common/constants/auth.constants';

import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

import {
  CurrentUserDecorator,
  GoogleCallbackDecorator,
  GoogleLoginDecorator,
  GuestSessionDecorator,
  LogoutDecorator,
} from './decorators';

import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleOneTapDto } from './dto/google-one-tap.dto';
import { SessionGuard } from './guards/session.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  @GoogleLoginDecorator()
  @Get('google')
  googleLogin() { }

  @GoogleCallbackDecorator()
  @Get('google/callback')
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    const user = request.user as UserDocument | undefined;

    if (!user?._id) {
      return response.redirect('/login?error=auth_failed');
    }

    const session = await this.authService.createUserSession(
      user._id.toString(),
      request.ip,
      request.headers['user-agent'],
    );

    this.setAuthCookie(
      response,
      session.token,
      AUTH_SESSION.REGISTERED_ABSOLUTE_TTL,
    );

    const clientUrl = this.configService.getOrThrow<string>('app.clientUrl');

    return response.redirect(clientUrl);
  }

  @Post('google')
  async googleOneTap(
    @Body() dto: GoogleOneTapDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const user = await this.authService.googleLogin(dto.credential);

    const session = await this.authService.createUserSession(
      user._id.toString(),
      request.ip,
      request.headers['user-agent'],
    );

    this.setAuthCookie(
      response,
      session.token,
      AUTH_SESSION.REGISTERED_ABSOLUTE_TTL,
    );

    return response.json({
      message: 'Google authentication successful.',
      user,
    });
  }

  @GuestSessionDecorator()
  @Post('guest')
  async createGuestSession(@Req() request: Request, @Res() response: Response) {
    const session = await this.authService.createGuestSession(
      request.ip,
      request.headers['user-agent'],
    );

    this.setAuthCookie(response, session.token, AUTH_SESSION.GUEST_TTL);

    return response.json({
      message: 'Guest session created.',
    });
  }

  @CurrentUserDecorator()
  @Get('me')
  async getCurrentUser(
    @CurrentUser()
    sessionPayload: {
      id?: string;
      sessionId: string;
      type: string;
    },
  ) {
    if (!sessionPayload?.id) {
      return {
        ...sessionPayload,
        requiresOnboarding: false,
      };
    }

    const user = await this.usersService.findById(sessionPayload.id);

    return {
      ...sessionPayload,
      user,
      requiresOnboarding:
        sessionPayload.type === 'registered' && !user?.username,
    };
  }

  @UseGuards(SessionGuard)
  @Post('onboarding')
  async completeOnboarding(
    @CurrentUser() sessionPayload: { id?: string; type: string },
    @Body() dto: { username: string; displayName?: string },
  ) {
    if (!sessionPayload?.id || sessionPayload.type !== 'registered') {
      throw new UnauthorizedException('Invalid session for onboarding.');
    }

    if (dto.displayName) {
      await this.usersService.updateDisplayName(sessionPayload.id, dto.displayName);
    }

    const updatedUser = await this.usersService.setUsername(sessionPayload.id, dto.username);
    return updatedUser;
  }

  @LogoutDecorator()
  @Post('logout')
  async logout(@Req() request: Request, @Res() response: Response) {
    const token = request.cookies?.[AUTH_COOKIE] as string | undefined;

    if (token) {
      await this.authService.logout(token);
    }

    response.clearCookie(AUTH_COOKIE);

    return response.json({
      message: 'Logout successful.',
    });
  }

  private setAuthCookie(response: Response, token: string, maxAge: number) {
    response.cookie(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
  }
}
