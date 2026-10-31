import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session.guard';
import { UserType } from '../users/schemas/user.schema';
import { FriendshipsService } from './friendships.service';

import { SendFriendRequestDto } from './dto/send-friend-request.dto';

interface SessionUser {
  id?: string;
}

@ApiTags('friendships')
@Controller('friendships')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserType.REGISTERED)
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  private userId(user: SessionUser): string {
    if (!user?.id)
      throw new UnauthorizedException('Registered user session required.');
    return user.id;
  }

  @Post('requests')
  send(@CurrentUser() user: SessionUser, @Body() dto: SendFriendRequestDto) {
    return this.friendships.send(this.userId(user), dto.recipientId);
  }

  @Get('requests')
  requests(@CurrentUser() user: SessionUser) {
    return this.friendships.requests(this.userId(user));
  }

  @Get()
  friends(@CurrentUser() user: SessionUser) {
    return this.friendships.friends(this.userId(user));
  }

  @Patch('requests/:id/accept')
  accept(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.friendships.accept(this.userId(user), id);
  }

  @Delete('requests/:id/decline')
  decline(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.friendships.dismiss(this.userId(user), id, 'decline');
  }

  @Delete('requests/:id/cancel')
  cancel(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.friendships.dismiss(this.userId(user), id, 'cancel');
  }

  @Delete(':id')
  remove(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.friendships.remove(this.userId(user), id);
  }
}
