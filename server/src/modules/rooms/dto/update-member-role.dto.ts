import { IsIn, IsEnum } from 'class-validator';
import { RoomMemberRole } from '../schemas/room.schema';

export class UpdateMemberRoleDto {
  @IsEnum(RoomMemberRole)
  @IsIn([RoomMemberRole.MEMBER, RoomMemberRole.MODERATOR])
  role!: RoomMemberRole;
}
