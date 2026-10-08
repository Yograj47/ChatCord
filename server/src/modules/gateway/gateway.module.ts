import { Module } from '@nestjs/common';
import { GatewayGateway } from './gateway.gateway';
import { SocketAuthService } from './socket-auth.service';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesModule } from '../messages/messages.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RoomsModule, MessagesModule, RedisModule],
  providers: [GatewayGateway, SocketAuthService],
})
export class GatewayModule { }
