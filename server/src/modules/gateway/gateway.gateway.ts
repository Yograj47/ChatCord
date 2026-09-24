import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { MessagesService } from '../messages/messages.service';
import { SocketAuthService } from './socket-auth.service';

interface GatewaySocketData {
  userId?: string;
  sessionId?: string;
  sessionType?: string;
}

interface GatewayServerToClientEvents {
  'connection-error': (data: { message: string }) => void;
  'user-online': (data: { userId: string }) => void;
  'user-offline': (data: { userId: string }) => void;
  'user-joined-room': (data: { roomId: string; userId: string }) => void;
  'user-left-room': (data: { roomId: string; userId: string }) => void;
  'new-message': (data: unknown) => void;
  'user-typing': (data: { roomId: string; userId: string }) => void;
  'user-stopped-typing': (data: { roomId: string; userId: string }) => void;
}

type GatewaySocket = Socket<
  Record<string, unknown>, // 1. ListenEvents (prevents 'any' lint errors)
  GatewayServerToClientEvents, // 2. EmitEvents (Server -> Client)
  Record<string, never>, // 3. InterServerEvents
  GatewaySocketData // 4. SocketData
>;

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class GatewayGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketAuthService: SocketAuthService,
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  private readonly connectedUsers = new Map<string, Set<string>>();

  async handleConnection(client: GatewaySocket): Promise<void> {
    try {
      const session = await this.socketAuthService.authenticate(client);
      const userId = session.userId?.toString();

      if (!userId) {
        client.emit('connection-error', {
          message: 'Registered user authentication required.',
        });
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      client.data.sessionId = session._id.toString();
      client.data.sessionType = session.type;

      const sockets = this.connectedUsers.get(userId) ?? new Set<string>();

      const wasOffline = sockets.size === 0;

      sockets.add(client.id);
      this.connectedUsers.set(userId, sockets);

      if (wasOffline) {
        client.broadcast.emit('user-online', {
          userId,
        });
      }

      console.log(`Socket connected: ${client.id}`);
    } catch {
      client.emit('connection-error', {
        message: 'Authentication failed.',
      });

      client.disconnect(true);
    }
  }

  handleDisconnect(client: GatewaySocket): void {
    const userId = client.data.userId;

    if (!userId) {
      return;
    }

    const sockets = this.connectedUsers.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.connectedUsers.delete(userId);

      client.broadcast.emit('user-offline', {
        userId,
      });
    }

    console.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const membership = await this.roomsService.findMembership(
      data.roomId,
      userId,
    );

    if (!membership) {
      throw new WsException('You are not a member of this room.');
    }

    await client.join(data.roomId);

    client.to(data.roomId).emit('user-joined-room', {
      roomId: data.roomId,
      userId,
    });

    return {
      event: 'room-joined',
      data: {
        roomId: data.roomId,
      },
    };
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const membership = await this.roomsService.findMembership(
      data.roomId,
      userId,
    );

    if (!membership) {
      throw new WsException('You are not a member of this room.');
    }

    await client.leave(data.roomId);

    client.to(data.roomId).emit('user-left-room', {
      roomId: data.roomId,
      userId,
    });

    return {
      event: 'room-left',
      data: {
        roomId: data.roomId,
      },
    };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const message = await this.messagesService.createMessage(
      data.roomId,
      userId,
      {
        content: data.content,
      },
    );

    client.to(data.roomId).emit('new-message', message);

    return {
      event: 'message-sent',
      data: message,
    };
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = await this.assertRoomMembership(client, data.roomId);

    client.to(data.roomId).emit('user-typing', {
      roomId: data.roomId,
      userId,
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = await this.assertRoomMembership(client, data.roomId);

    client.to(data.roomId).emit('user-stopped-typing', {
      roomId: data.roomId,
      userId,
    });
  }

  private async assertRoomMembership(
    client: GatewaySocket,
    roomId: string,
  ): Promise<string> {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const membership = await this.roomsService.findMembership(roomId, userId);

    if (!membership) {
      throw new WsException('You are not a member of this room.');
    }

    return userId;
  }
}
