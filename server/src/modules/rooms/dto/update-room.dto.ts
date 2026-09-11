import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoomCapability, RoomVisibility } from '../schemas/room.schema';

export class UpdateRoomDto {
  @ApiPropertyOptional({
    example: 'Updated Room Name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated room description.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: RoomVisibility,
  })
  @IsOptional()
  @IsEnum(RoomVisibility)
  visibility?: RoomVisibility;

  @ApiPropertyOptional({
    enum: RoomCapability,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoomCapability, { each: true })
  capabilities?: RoomCapability[];
}
