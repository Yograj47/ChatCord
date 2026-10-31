import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketAuthService } from './socket-auth.service';
import { SessionType } from '../auth/schemas/session.schema';

@Injectable()
export class SocketSessionGuard implements CanActivate {
  constructor(private readonly auth: SocketAuthService) {}
  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient<Socket>();
    try {
      const session = await this.auth.authenticate(client);
      if (session.type !== SessionType.REGISTERED || !session.userId)
        throw new Error('Registered session required');
      return true;
    } catch {
      throw new WsException(
        'Your session expired or was revoked. Sign in again.',
      );
    }
  }
}
