import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AUTH_COOKIE } from 'src/common/constants/auth.constants';
import { SessionService } from '../session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[AUTH_COOKIE];

    if (!token) {
      throw new UnauthorizedException('Authentication token missing.');
    }

    const sessionPayload = await this.sessionService.validateSession(token);

    if (!sessionPayload) {
      throw new UnauthorizedException('Invalid or expired session token.');
    }

    request.user = sessionPayload;
    return true;
  }
}
