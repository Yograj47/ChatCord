import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsMongoId } from 'class-validator';
import { CreateMessageDto } from '../../messages/dto/create-message.dto';

export class RoomEventDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsMongoId()
  roomId!: string;
}

export class PresenceSyncDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  userIds!: string[];
}

export class SendMessageEventDto extends CreateMessageDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsMongoId()
  roomId!: string;
}
