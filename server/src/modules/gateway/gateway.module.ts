import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { SocketAuthService } from './socket-auth.service';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesModule } from '../messages/messages.module';
import { RedisModule } from '../redis/redis.module';
import { SocketSessionGuard } from './socket-session.guard';

@Module({
  imports: [AuthModule, RoomsModule, MessagesModule, RedisModule],
  providers: [RealtimeGateway, SocketAuthService, SocketSessionGuard],
})
export class GatewayModule {}
