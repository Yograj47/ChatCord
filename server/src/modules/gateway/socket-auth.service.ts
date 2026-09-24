import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';

import { SessionService } from '../auth/session.service';
import { AUTH_COOKIE } from 'src/common/constants/auth.constants';

@Injectable()
export class SocketAuthService {
  constructor(private readonly sessionService: SessionService) {}

  async authenticate(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) {
      throw new UnauthorizedException('Authentication cookie missing.');
    }

    const token = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${AUTH_COOKIE}=`))
      ?.split('=')
      .slice(1)
      .join('=');

    if (!token) {
      throw new UnauthorizedException('Authentication cookie missing.');
    }

    return this.sessionService.validateSession(token);
  }
}
