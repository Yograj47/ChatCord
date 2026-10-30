import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty({
    example: 'Hello everyone!',
    maxLength: 4000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}
