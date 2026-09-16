import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionGuard } from '../auth/guards/session.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

interface SessionUser {
  id?: string;
  sessionId: string;
  type: string;
}

@ApiTags('messages')
@Controller('rooms/:roomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(SessionGuard)
  @Post()
  createMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(roomId, user.id!, dto);
  }

  @UseGuards(SessionGuard)
  @Get()
  findAllForRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.findAllForRoom(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Patch(':messageId')
  updateMessage(
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(roomId, messageId, user.id!, dto);
  }

  @UseGuards(SessionGuard)
  @Delete(':messageId')
  deleteMessage(
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.deleteMessage(roomId, messageId, user.id!);
  }
}
