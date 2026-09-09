import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { UserType } from 'src/modules/users/schemas/user.schema';
import { ROLES_KEY } from '../decorators/index';

interface SessionUserPayload {
  id?: string;
  sessionId: string;
  type: UserType;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: SessionUserPayload }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.type)) {
      throw new ForbiddenException(
        'Insufficient permissions to perform this action.',
      );
    }

    return true;
  }
}
