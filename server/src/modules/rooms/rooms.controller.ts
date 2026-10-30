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
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RoomsService } from './rooms.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '../users/schemas/user.schema';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MongoIdPipe } from '../../common/pipes/mongo-id.pipe';

interface SessionUser {
  id?: string;
  sessionId: string;
  type: string;
}

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserType.REGISTERED)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(SessionGuard)
  @Post()
  createRoom(@CurrentUser() user: SessionUser, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(user.id!, dto);
  }

  @UseGuards(SessionGuard)
  @Get()
  findAll(@CurrentUser() user: SessionUser) {
    return this.roomsService.findAllForUser(user.id!);
  }

  @UseGuards(SessionGuard)
  @Get('invitations')
  invitations(@CurrentUser() user: SessionUser) {
    return this.roomsService.invitations(user.id!);
  }

  @Post(':roomId/invitations/:invitationId/accept')
  acceptInvitation(
    @Param('roomId') roomId: string,
    @Param('invitationId', MongoIdPipe) invitationId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.roomsService.acceptInvitation(roomId, invitationId, user.id!);
  }

  @Delete(':roomId/invitations/:invitationId')
  declineInvitation(
    @Param('roomId') roomId: string,
    @Param('invitationId', MongoIdPipe) invitationId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.roomsService.declineInvitation(roomId, invitationId, user.id!);
  }

  @Get(':roomId')
  findById(@Param('roomId') roomId: string, @CurrentUser() user: SessionUser) {
    return this.roomsService.findAccessible(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Patch(':roomId')
  updateRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(roomId, user.id!, dto);
  }

  @UseGuards(SessionGuard)
  @Delete(':roomId')
  deleteRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.roomsService.deleteRoom(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Post(':roomId/join')
  joinRoom(@Param('roomId') roomId: string, @CurrentUser() user: SessionUser) {
    return this.roomsService.joinRoom(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Post(':roomId/leave')
  leaveRoom(@Param('roomId') roomId: string, @CurrentUser() user: SessionUser) {
    return this.roomsService.leaveRoom(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Post(':roomId/members')
  addMember(
    @Param('roomId') roomId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.roomsService.addMember(roomId, user.id!, dto.userId);
  }

  @Get(':roomId/members')
  members(@Param('roomId') roomId: string, @CurrentUser() user: SessionUser) {
    return this.roomsService.members(roomId, user.id!);
  }

  @UseGuards(SessionGuard)
  @Delete(':roomId/members/:userId')
  removeMember(
    @Param('roomId') roomId: string,
    @Param('userId', MongoIdPipe) targetUserId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.roomsService.removeMember(roomId, user.id!, targetUserId);
  }

  @UseGuards(SessionGuard)
  @Patch(':roomId/members/:userId')
  updateMemberRole(
    @Param('roomId') roomId: string,
    @Param('userId', MongoIdPipe) targetUserId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.roomsService.updateMemberRole(
      roomId,
      user.id!,
      targetUserId,
      dto.role,
    );
  }
}
