import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  RoomCapability,
  RoomType,
  RoomVisibility,
} from '../schemas/room.schema';

export class CreateRoomDto {
  @ApiProperty({
    enum: RoomType,
    example: RoomType.GROUP,
  })
  @IsEnum(RoomType)
  type!: RoomType;

  @ApiPropertyOptional({
    example: 'General Chat',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    enum: RoomVisibility,
    default: RoomVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(RoomVisibility)
  visibility?: RoomVisibility;

  @ApiPropertyOptional({
    enum: RoomCapability,
    isArray: true,
    example: [RoomCapability.TEXT],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoomCapability, { each: true })
  capabilities?: RoomCapability[];

  @ApiPropertyOptional({
    example: 'A general discussion room.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
