// From server: npx ts-node --transpile-only -r tsconfig-paths/register test/verify-realtime.ts [--serve]
// Uses the real AppModule, MongoDB, Redis, Redis adapter, controllers, guards and Socket.IO.
import 'reflect-metadata';
import dns from 'node:dns';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request, Response, Express } from 'express';
import cookieParser from 'cookie-parser';
// Reuse the frontend's installed transport client to verify its actual Socket.IO version.
import {
  io,
  Socket as ClientSocket,
} from '../../client/node_modules/socket.io-client';
import { User, UserType } from '../src/modules/users/schemas/user.schema';
import {
  Room,
  RoomType,
  RoomMemberRole,
} from '../src/modules/rooms/schemas/room.schema';
import { Message } from '../src/modules/messages/schemas/message.schema';
import { Session } from '../src/modules/auth/schemas/session.schema';
import { Friendship } from '../src/modules/friendships/schemas/friendship.schema';
import { SessionService } from '../src/modules/auth/session.service';
import { FriendshipsService } from '../src/modules/friendships/friendships.service';
import { RoomsService } from '../src/modules/rooms/rooms.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { AUTH_COOKIE } from '../src/common/constants/auth.constants';

interface Packet {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
}
interface Ack {
  ok: boolean;
  error?: string;
  data?: Packet;
}
const apiBase = 'http://127.0.0.1:4188';
const browserBase = 'http://chatcord-verify.localhost:4187';
const sockets: ClientSocket[] = [];
function event<T>(socket: ClientSocket, name: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(name, listener);
      reject(new Error(`Timed out waiting for ${name}`));
    }, 10000);
    const listener = (value: T) => {
      clearTimeout(timeout);
      resolve(value);
    };
    socket.once(name, listener);
  });
}
async function connect(token?: string): Promise<ClientSocket> {
  const socket = io(`${apiBase}/realtime`, {
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    transports: ['websocket'],
    extraHeaders: {
      Origin: browserBase,
      ...(token ? { Cookie: `${AUTH_COOKIE}=${token}` } : {}),
    },
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Socket connection timed out')),
      10000,
    );
    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once('connect_error', () => {
      clearTimeout(timeout);
      reject(new Error('Socket authentication rejected'));
    });
    socket.connect();
  });
  return socket;
}
const acknowledge = (
  socket: ClientSocket,
  name: string,
  payload: unknown,
): Promise<Ack> =>
  socket.timeout(10000).emitWithAck(name, payload) as Promise<Ack>;

async function main() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  for (const file of ['.env.local', '.env'])
    if (existsSync(file)) loadEnvFile(file);
  process.env.CLIENT_URL = browserBase;
  const loadModule = createRequire(__filename);
  const { AppModule } = loadModule(
    '../src/app.module',
  ) as typeof import('../src/app.module');
  const { RedisIoAdapter } = loadModule(
    '../src/modules/gateway/redis-io.adapter',
  ) as typeof import('../src/modules/gateway/redis-io.adapter');
  let app: INestApplication | undefined;
  const ids = Array.from({ length: 3 }, () => new Types.ObjectId());
  const sessionIds: Types.ObjectId[] = [];
  let stage = 'application initialization';
  try {
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    const adapter = new RedisIoAdapter(app);
    await adapter.connectToRedis();
    app.useWebSocketAdapter(adapter);
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.enableCors({ origin: browserBase, credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const users = app.get<Model<User>>(getModelToken(User.name));
    const rooms = app.get<Model<Room>>(getModelToken(Room.name));
    const messages = app.get<Model<Message>>(getModelToken(Message.name));
    const friendships = app.get(FriendshipsService);
    const roomService = app.get(RoomsService);
    const sessions = app.get(SessionService);
    const prefix = `rt${randomBytes(4).toString('hex')}`;
    await users.insertMany(
      ids.map((_id, i) => ({
        _id,
        type: UserType.REGISTERED,
        username: `${prefix}_${['alex', 'sam', 'jordan'][i]}`,
        displayName: [
          'Verification Alex',
          'Verification Sam',
          'Verification Jordan',
        ][i],
      })),
    );
    const tokens: string[] = [];
    for (const id of ids) {
      const session = await sessions.createUserSession(id.toString());
      tokens.push(session.token);
      sessionIds.push(session.session._id);
    }
    const guest = await sessions.createGuestSession();
    sessionIds.push(guest.session._id);
    let friendship = await friendships.send(
      ids[0].toString(),
      ids[1].toString(),
    );
    await friendships.accept(ids[1].toString(), friendship.id);
    const dm = await roomService.createDm(ids[0].toString(), ids[1].toString());
    const group = await roomService.createRoom(ids[0].toString(), {
      type: RoomType.GROUP,
      name: 'Verification Studio',
    });
    await rooms.updateOne(
      { _id: group._id },
      {
        $push: {
          members: {
            $each: [
              {
                userId: ids[1],
                role: RoomMemberRole.MEMBER,
                joinedAt: new Date(),
              },
              {
                userId: ids[2],
                role: RoomMemberRole.MODERATOR,
                joinedAt: new Date(),
              },
            ],
          },
        },
      },
    );
    const publicRoom = await roomService.createRoom(ids[2].toString(), {
      type: RoomType.GROUP,
      name: 'Verification Public Lounge',
      visibility:
        'public' as import('../src/modules/rooms/schemas/room.schema').RoomVisibility,
    });
    const dmId = dm._id.toString();
    const groupId = group._id.toString();
    const express = app.getHttpAdapter().getInstance() as Express;
    // Only temporary fixture identities are available. The cookie is scoped to an isolated localhost hostname.
    express.get(
      '/__verification/start',
      (request: Request, response: Response) => {
        if (request.hostname !== 'chatcord-verify.localhost') {
          response.status(404).end();
          return;
        }
        const identities = ['alex', 'sam', 'jordan'];
        const identity = request.query.user ?? 'alex';
        const index =
          typeof identity === 'string' ? identities.indexOf(identity) : -1;
        if (index < 0 && request.query.user !== 'guest') {
          response.status(400).end();
          return;
        }
        response.cookie(AUTH_COOKIE, index < 0 ? guest.token : tokens[index], {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 20 * 60 * 1000,
        });
        response.redirect(`${browserBase}/app/friends`);
      },
    );
    await app.listen(4188, '127.0.0.1');
    const http = async (
      path: string,
      user: number,
      method = 'GET',
      body?: unknown,
    ) => {
      const response = await fetch(`${apiBase}/api${path}`, {
        method,
        headers: {
          Cookie: `${AUTH_COOKIE}=${tokens[user]}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {
        status: response.status,
        body: (await response.json()) as unknown,
      };
    };

    stage = 'authentication';
    await assert.rejects(connect());
    await assert.rejects(connect(guest.token));
    const alex = await connect(tokens[0]);
    let sam = await connect(tokens[1]);
    const jordan = await connect(tokens[2]);
    assert((await acknowledge(alex, 'join-room', { roomId: dmId })).ok);
    assert((await acknowledge(sam, 'join-room', { roomId: dmId })).ok);
    assert.equal(
      (await acknowledge(jordan, 'join-room', { roomId: dmId })).ok,
      false,
    );
    console.log(
      'PASS: real Socket.IO authentication, guest rejection, participant-only room joins',
    );

    stage = 'delivery and persistence';
    const received = event<Packet>(sam, 'new-message');
    const sent = await acknowledge(alex, 'send-message', {
      roomId: dmId,
      content: 'Transport verification: hello',
    });
    assert(sent.ok && sent.data?._id);
    assert.equal((await received)._id, sent.data._id);
    const reply = event<Packet>(alex, 'new-message');
    assert(
      (
        await acknowledge(sam, 'send-message', {
          roomId: dmId,
          content: 'Transport verification: reply',
        })
      ).ok,
    );
    assert.equal((await reply).content, 'Transport verification: reply');
    assert.equal(await messages.countDocuments({ roomId: dm._id }), 2);
    assert.equal(
      (
        await acknowledge(jordan, 'send-message', {
          roomId: dmId,
          content: 'Forbidden',
        })
      ).ok,
      false,
    );
    assert.equal(
      (await acknowledge(alex, 'send-message', { roomId: dmId, content: ' ' }))
        .ok,
      false,
    );
    console.log(
      'PASS: bidirectional delivery, sender acknowledgement, persistence, outsider and invalid-payload rejection',
    );

    stage = 'reconnect and missed history';
    sam.disconnect();
    assert(
      (
        await acknowledge(alex, 'send-message', {
          roomId: dmId,
          content: 'Transport verification: sent while offline',
        })
      ).ok,
    );
    sam = await connect(tokens[1]);
    assert((await acknowledge(sam, 'join-room', { roomId: dmId })).ok);
    const history = await http(`/rooms/${dmId}/messages`, 1);
    assert.equal(history.status, 200);
    assert.equal((history.body as unknown[]).length, 3);
    const unique = await roomService.createDm(
      ids[1].toString(),
      ids[0].toString(),
    );
    assert.equal(unique._id.toString(), dmId);
    console.log(
      'PASS: reconnect/rejoin, missed-message history, unique conversation reuse',
    );

    stage = 'friendship and session revocation';
    await friendships.remove(ids[0].toString(), friendship.id);
    const denied = await acknowledge(alex, 'send-message', {
      roomId: dmId,
      content: 'Must not persist',
    });
    assert.equal(denied.ok, false);
    assert(denied.error?.includes('friendship'));
    assert.equal(await messages.countDocuments({ roomId: dm._id }), 3);
    assert.equal((await http(`/rooms/${dmId}/messages`, 1)).status, 200);
    friendship = await friendships.send(ids[0].toString(), ids[1].toString());
    await friendships.accept(ids[1].toString(), friendship.id);
    const revoked = await sessions.createUserSession(ids[2].toString());
    sessionIds.push(revoked.session._id);
    const revokedSocket = await connect(revoked.token);
    await sessions.deleteSession(revoked.token);
    assert.equal(
      (await acknowledge(revokedSocket, 'join-room', { roomId: groupId })).ok,
      false,
    );
    revokedSocket.disconnect();
    console.log(
      'PASS: unfriending blocks new sends without losing history; revoked sessions cannot perform socket actions',
    );

    stage = 'room membership and permission enforcement';
    const profiles = await http(`/rooms/${groupId}/members`, 0);
    assert.equal(profiles.status, 200);
    assert(
      (profiles.body as Record<string, unknown>[]).every(
        (member) => !('email' in member) && !('identity' in member),
      ),
    );
    assert.equal(
      (
        await http(
          `/rooms/${groupId}/members/${ids[1].toString()}`,
          0,
          'PATCH',
          { role: 'moderator' },
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await http(
          `/rooms/${groupId}/members/${ids[1].toString()}`,
          2,
          'DELETE',
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await http(
          `/rooms/${groupId}/members/${ids[1].toString()}`,
          2,
          'PATCH',
          { role: 'member' },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await http(
          `/rooms/${groupId}/members/${ids[1].toString()}`,
          0,
          'PATCH',
          { role: 'member' },
        )
      ).status,
      200,
    );
    assert((await acknowledge(sam, 'join-room', { roomId: groupId })).ok);
    const removed = event<{ roomId: string }>(sam, 'room-access-revoked');
    await roomService.removeMember(
      groupId,
      ids[0].toString(),
      ids[1].toString(),
    );
    assert.equal((await removed).roomId, groupId);
    assert.equal(
      (await acknowledge(sam, 'join-room', { roomId: groupId })).ok,
      false,
    );
    assert.equal((await http(`/rooms/${groupId}/messages`, 1)).status, 403);
    assert((await acknowledge(alex, 'join-room', { roomId: groupId })).ok);
    await roomService.updateRoom(groupId, ids[0].toString(), {
      capabilities: [],
    });
    assert.equal(
      (
        await acknowledge(alex, 'send-message', {
          roomId: groupId,
          content: 'Text is disabled',
        })
      ).ok,
      false,
    );
    await roomService.updateRoom(groupId, ids[0].toString(), {
      capabilities: [
        'text' as import('../src/modules/rooms/schemas/room.schema').RoomCapability,
      ],
    });
    console.log(
      'PASS: public member profiles, owner-only roles, moderator hierarchy, live subscription revocation and text permissions',
    );

    // Restore the regular member for manual/browser control verification.
    await rooms.updateOne(
      { _id: group._id },
      {
        $push: {
          members: {
            userId: ids[1],
            role: RoomMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        },
      },
    );
    assert((await acknowledge(sam, 'join-room', { roomId: dmId })).ok);
    if (process.argv.includes('--serve')) {
      if (process.argv.includes('--social')) {
        const invitationRoom = await roomService.createRoom(ids[0].toString(), {
          type: RoomType.GROUP,
          name: 'Verification Invitations',
        });
        await friendships.send(ids[2].toString(), ids[0].toString());
        console.log(
          `Social usernames: ${prefix}_alex, ${prefix}_sam, ${prefix}_jordan`,
        );
        console.log(`Invitation room: ${invitationRoom._id.toString()}`);
        console.log(
          'Switch isolated browser account with /__verification/start?user=alex|sam|jordan|guest on port 4188.',
        );
      }
      sam.on('new-message', (message: Packet) => {
        if (
          message.roomId === dmId &&
          message.senderId === ids[0].toString() &&
          message.content.startsWith('Browser check:')
        ) {
          void acknowledge(sam, 'send-message', {
            roomId: dmId,
            content: `Verified reply: ${message.content}`,
          }).then((result) => {
            if (result.ok)
              console.log(
                'PASS: browser-originated DM delivered to peer and peer reply acknowledged',
              );
          });
        }
      });
      console.log(
        'Live browser fixture ready: http://chatcord-verify.localhost:4188/__verification/start',
      );
      console.log(`Group controls: ${browserBase}/app/rooms/${groupId}`);
      console.log(
        `Public join: ${browserBase}/app/rooms/${publicRoom._id.toString()}`,
      );
      console.log(
        'Send "Browser check: hello" to Verification Sam for an actual Socket.IO reply. Type stop and Enter here to clean up (automatic after 20 minutes).',
      );
      await new Promise<void>((resolve) => {
        const input = (chunk: string | Buffer) => {
          if (chunk.toString().trim() === 'stop') stop();
        };
        const stop = () => {
          clearTimeout(timer);
          process.stdin.off('data', input);
          process.stdin.pause();
          process.off('SIGINT', stop);
          process.off('SIGTERM', stop);
          resolve();
        };
        const timer = setTimeout(stop, 20 * 60 * 1000);
        process.stdin.on('data', input);
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
      });
    }
  } catch (error: unknown) {
    console.error(`Failed verification stage: ${stage}`);
    if (error instanceof Error) console.error(`Failure type: ${error.name}`);
    process.exitCode = 1;
  } finally {
    for (const socket of sockets) socket.disconnect();
    if (app) {
      try {
        const rooms = app.get<Model<Room>>(getModelToken(Room.name));
        const owned = await rooms
          .find({ createdBy: { $in: ids } })
          .select('_id')
          .exec();
        await app
          .get<Model<Message>>(getModelToken(Message.name))
          .deleteMany({ roomId: { $in: owned.map((room) => room._id) } });
        await rooms.deleteMany({ createdBy: { $in: ids } });
        await app
          .get<Model<Friendship>>(getModelToken(Friendship.name))
          .deleteMany({ requester: { $in: ids } });
        await app.get<Model<Session>>(getModelToken(Session.name)).deleteMany({
          $or: [{ userId: { $in: ids } }, { _id: { $in: sessionIds } }],
        });
        await app
          .get<Model<User>>(getModelToken(User.name))
          .deleteMany({ _id: { $in: ids } });
        for (const id of ids)
          await app
            .get(RedisService)
            .deleteCache(`presence:user:${id.toString()}`);
        console.log('Removed isolated realtime verification records.');
      } finally {
        await app.close();
      }
    }
  }
}
main().catch(() => {
  console.error(
    'Realtime verification could not finish; connection details withheld.',
  );
  process.exitCode = 1;
});
