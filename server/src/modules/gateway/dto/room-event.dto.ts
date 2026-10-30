import { Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';
import { CreateMessageDto } from '../../messages/dto/create-message.dto';

export class RoomEventDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsMongoId()
  roomId!: string;
}

export class SendMessageEventDto extends CreateMessageDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsMongoId()
  roomId!: string;
}
