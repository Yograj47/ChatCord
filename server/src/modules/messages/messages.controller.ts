import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionGuard } from '../auth/guards/session.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserType } from '../users/schemas/user.schema';
import { MongoIdPipe } from '../../common/pipes/mongo-id.pipe';
import { MessageQueryDto, ReactionDto } from './dto/message-query.dto';

interface SessionUser {
  id?: string;
  sessionId: string;
  type: string;
}

@ApiTags('messages')
@Controller('rooms/:roomId/messages')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserType.REGISTERED)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('page')
  page(
    @Param('roomId', MongoIdPipe) roomId: string,
    @CurrentUser() user: SessionUser,
    @Query() query: MessageQueryDto,
  ) {
    return this.messagesService.page(roomId, user.id!, query);
  }

  @Post(':messageId/reactions')
  react(
    @Param('roomId', MongoIdPipe) roomId: string,
    @Param('messageId', MongoIdPipe) messageId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: ReactionDto,
  ) {
    return this.messagesService.react(
      roomId,
      messageId,
      user.id!,
      dto.emoji,
      true,
    );
  }

  @Delete(':messageId/reactions')
  unreact(
    @Param('roomId', MongoIdPipe) roomId: string,
    @Param('messageId', MongoIdPipe) messageId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: ReactionDto,
  ) {
    return this.messagesService.react(
      roomId,
      messageId,
      user.id!,
      dto.emoji,
      false,
    );
  }

  @UseGuards(SessionGuard)
  @Post()
  createMessage(
    @Param('roomId', MongoIdPipe) roomId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(roomId, user.id!, dto);
  }

  @UseGuards(SessionGuard)
  @Get()
  findAllForRoom(
    @Param('roomId', MongoIdPipe) roomId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.findAllForRoom(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Patch(':messageId')
  updateMessage(
    @Param('roomId', MongoIdPipe) roomId: string,
    @Param('messageId', MongoIdPipe) messageId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(roomId, messageId, user.id!, dto);
  }

  @Get(':messageId')
  getMessage(
    @Param('roomId', MongoIdPipe) roomId: string,
    @Param('messageId', MongoIdPipe) messageId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.getMessage(roomId, messageId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Delete(':messageId')
  deleteMessage(
    @Param('roomId', MongoIdPipe) roomId: string,
    @Param('messageId', MongoIdPipe) messageId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.deleteMessage(roomId, messageId, user.id!);
  }
}
