import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomEventsService {
  private broadcast?: (roomId: string, removedUserId?: string) => void;
  bind(broadcast: (roomId: string, removedUserId?: string) => void) {
    this.broadcast = broadcast;
  }
  changed(roomId: string, removedUserId?: string) {
    this.broadcast?.(roomId, removedUserId);
  }
}
