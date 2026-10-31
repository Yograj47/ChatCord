import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserType } from '../users/schemas/user.schema';
import { RoomsService } from './rooms.service';

import { CreateDmDto } from './dto/create-dm.dto';

@ApiTags('dms')
@Controller('dms')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserType.REGISTERED)
export class DmsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.rooms.listDms(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateDmDto) {
    return this.rooms.createDm(user.id, dto.userId);
  }
}
