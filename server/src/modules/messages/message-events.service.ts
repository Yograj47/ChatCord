import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageEventsService {
  private publish?: (roomId: string, event: string, message: unknown) => void;
  bind(publish: (roomId: string, event: string, message: unknown) => void) {
    this.publish = publish;
  }
  emit(roomId: string, event: string, message: unknown) {
    this.publish?.(roomId, event, message);
  }
}
