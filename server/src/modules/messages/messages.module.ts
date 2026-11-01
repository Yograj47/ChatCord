import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageEventsModule } from './message-events.module';

@Module({
  imports: [AuthModule, RoomsModule, MessageEventsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService, MessageEventsModule],
})
export class MessagesModule {}
