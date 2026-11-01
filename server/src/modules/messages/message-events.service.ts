import { Injectable, Logger } from '@nestjs/common';
import type { MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessageEventsService {
  private readonly logger = new Logger(MessageEventsService.name);
  private publish?: (
    roomId: string,
    event: string,
    message: MessageDocument,
  ) => Promise<void>;
  bind(
    publish: (
      roomId: string,
      event: string,
      message: MessageDocument,
    ) => Promise<void>,
  ) {
    this.publish = publish;
  }
  async emit(roomId: string, event: string, message: MessageDocument) {
    try {
      await this.publish?.(roomId, event, message);
    } catch (error: unknown) {
      this.logger.error('Message saved but live delivery failed.', error);
    }
  }
}
