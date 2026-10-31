import { IsMongoId } from 'class-validator';

export class CreateDmDto {
  @IsMongoId()
  userId!: string;
}
