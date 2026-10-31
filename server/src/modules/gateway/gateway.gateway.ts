import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type { Namespace } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { MessagesService } from '../messages/messages.service';
import { SocketAuthService } from './socket-auth.service';
import { RedisService } from '../redis/redis.service';
import { RateLimitService } from '../redis/rate-limit.service';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
  OnModuleDestroy,
} from '@nestjs/common';
import { RoomEventsService } from '../rooms/room-events.service';
import { SocketSessionGuard } from './socket-session.guard';
import { GatewayExceptionFilter } from './gateway-exception.filter';
import { SessionType } from '../auth/schemas/session.schema';
import { RoomEventDto, SendMessageEventDto } from './dto/room-event.dto';
import { MessageEventsService } from '../messages/message-events.service';

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
  'room-access-revoked': (data: { roomId: string }) => void;
  'room-members-changed': (data: { roomId: string }) => void;
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
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: () => new WsException('Invalid event payload.'),
  }),
)
@UseGuards(SocketSessionGuard)
@UseFilters(GatewayExceptionFilter)
export class GatewayGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
{
  private shuttingDown = false;
  onModuleDestroy() {
    this.shuttingDown = true;
  }
  private namespace!: Namespace;
  afterInit(namespace: Namespace) {
    this.namespace = namespace;
    this.messageEvents.bind((roomId, event, message) =>
      namespace.to(roomId).emit(event, message),
    );
    namespace.use((client, next) => {
      void this.socketAuthService
        .authenticate(client)
        .then((session) => {
          if (session.type !== SessionType.REGISTERED || !session.userId) {
            next(new Error('Registered user authentication required.'));
            return;
          }
          const data = client.data as GatewaySocketData;
          data.userId = session.userId.toString();
          data.sessionId = session._id.toString();
          data.sessionType = session.type;
          next();
        })
        .catch(() => next(new Error('Authentication failed.')));
    });
    this.roomEvents.bind((roomId, removedUserId) => {
      if (removedUserId) {
        namespace.in(`user:${removedUserId}`).socketsLeave(roomId);
        namespace
          .to(`user:${removedUserId}`)
          .emit('room-access-revoked', { roomId });
      }
      namespace.to(roomId).emit('room-members-changed', { roomId });
    });
  }
  constructor(
    private readonly socketAuthService: SocketAuthService,
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly roomEvents: RoomEventsService,
    private readonly messageEvents: MessageEventsService,
  ) {}

  async handleConnection(client: GatewaySocket): Promise<void> {
    try {
      const userId = client.data.userId;

      if (!userId) {
        client.emit('connection-error', {
          message: 'Registered user authentication required.',
        });
        client.disconnect(true);
        return;
      }

      await client.join(`user:${userId}`);

      const sockets = await this.redisService.getPresence(userId);

      await this.redisService.addPresence(userId, client.id);

      if (sockets.length === 0) {
        client.broadcast.emit('user-online', { userId });
      }

      console.log(`Socket connected: ${client.id}`);
    } catch {
      client.emit('connection-error', {
        message: 'Authentication failed.',
      });

      client.disconnect(true);
    }
  }

  async handleDisconnect(client: GatewaySocket): Promise<void> {
    const userId = client.data.userId;

    if (!userId) {
      return;
    }

    await this.redisService.removePresence(userId, client.id);

    const remainingSockets = await this.redisService.getPresence(userId);

    if (remainingSockets.length === 0 && !this.shuttingDown) {
      client.broadcast.emit('user-offline', { userId });
    }

    console.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: RoomEventDto,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const allowed = await this.rateLimitService.check(
      'room:join',
      userId,
      20,
      60,
    );

    if (!allowed) {
      throw new WsException('Too many room join requests. Please slow down.');
    }

    const membership = await this.roomsService.findMembership(
      data.roomId,
      userId,
    );

    if (!membership) {
      throw new WsException('You are not a member of this room.');
    }

    await client.join(data.roomId);
    if (!(await this.roomsService.findMembership(data.roomId, userId))) {
      await client.leave(data.roomId);
      throw new WsException('You are not a member of this room.');
    }

    client.to(data.roomId).emit('user-joined-room', {
      roomId: data.roomId,
      userId,
    });

    return { ok: true, roomId: data.roomId };
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: RoomEventDto,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const allowed = await this.rateLimitService.check(
      'room:leave',
      userId,
      20,
      60,
    );

    if (!allowed) {
      throw new WsException('Too many room leave requests. Please slow down.');
    }

    await client.leave(data.roomId);

    client.to(data.roomId).emit('user-left-room', {
      roomId: data.roomId,
      userId,
    });

    return { ok: true, roomId: data.roomId };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: SendMessageEventDto,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('Authentication required.');
    }

    const allowed = await this.rateLimitService.check(
      'message',
      userId,
      30,
      60,
    );

    if (!allowed) {
      throw new WsException('Too many message. Please slow down.');
    }

    const message = await this.messagesService.createMessage(
      data.roomId,
      userId,
      {
        content: data.content,
        replyTo: data.replyTo,
      },
    );

    // Include the sender's other tabs, and deduplicate by message ID in clients.

    return {
      ok: true,
      data: message,
    };
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: RoomEventDto,
  ) {
    const userId = await this.assertRoomMembership(client, data.roomId);

    const allowed = await this.rateLimitService.check('typing', userId, 10, 1);

    if (!allowed) {
      throw new WsException('Too many typing events. Please slow down.');
    }

    await this.redisService.setTyping(data.roomId, userId);

    client.to(data.roomId).emit('user-typing', {
      roomId: data.roomId,
      userId,
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: RoomEventDto,
  ) {
    const userId = await this.assertRoomMembership(client, data.roomId);

    await this.redisService.clearTyping(data.roomId, userId);

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
