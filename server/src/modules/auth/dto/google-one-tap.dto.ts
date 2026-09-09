import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleOneTapDto {
  @ApiProperty({
    description:
      'JWT ID token returned by Google Identity Services (google.accounts.id)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  credential!: string;
}
