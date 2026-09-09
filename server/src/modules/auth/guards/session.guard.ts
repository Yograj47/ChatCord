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
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[AUTH_COOKIE];

    if (!token) {
      throw new UnauthorizedException('Authentication cookie missing.');
    }

    const session = await this.sessionService.validateSession(token);

    request.user = {
      sessionId: session._id.toString(),
      type: session.type,
      id: session.userId ? session.userId.toString() : undefined,
    };

    return true;
  }
}
