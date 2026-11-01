import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MessageEventsModule } from '../messages/message-events.module';
import { RoomActivityService } from './room-activity.service';

@Module({
  imports: [UsersModule, MessageEventsModule],
  providers: [RoomActivityService],
  exports: [RoomActivityService],
})
export class RoomActivityModule {}
