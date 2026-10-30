import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../users/users.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { DmsController } from './dms.controller';
import { RoomEventsService } from './room-events.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    FriendshipsModule,
    MongooseModule.forFeature([
      {
        name: Room.name,
        schema: RoomSchema,
      },
    ]),
    RedisModule,
  ],
  providers: [RoomsService, RoomEventsService],
  exports: [RoomsService, RoomEventsService],
  controllers: [RoomsController, DmsController],
})
export class RoomsModule {}
