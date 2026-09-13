import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({
    example: '665f1a2b3c4d5e6f78901234',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;
}
