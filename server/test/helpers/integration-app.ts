import 'reflect-metadata';
import dns from 'node:dns';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import type { Server } from 'node:http';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { User, UserType } from '../../src/modules/users/schemas/user.schema';
import { Room } from '../../src/modules/rooms/schemas/room.schema';
import { Message } from '../../src/modules/messages/schemas/message.schema';
import { Friendship } from '../../src/modules/friendships/schemas/friendship.schema';
import { Session } from '../../src/modules/auth/schemas/session.schema';
import { SessionService } from '../../src/modules/auth/session.service';
import { AUTH_COOKIE } from '../../src/common/constants/auth.constants';

export async function createIntegrationApp() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  for (const filename of ['.env.local', '.env']) {
    if (!existsSync(filename)) continue;
    for (const [key, value] of Object.entries(
      parseEnv(readFileSync(filename, 'utf8')),
    ))
      process.env[key] ??= value;
  }
  const source = process.env.TEST_MONGODB_URI ?? process.env.MONGODB_URI;
  assert(source, 'Set TEST_MONGODB_URI or MONGODB_URI for integration tests.');
  const databaseName = `chatcord_api_test_${randomBytes(8).toString('hex')}`;
  const uri = new URL(source);
  assert(
    ['mongodb:', 'mongodb+srv:'].includes(uri.protocol),
    'A MongoDB connection URI is required.',
  );
  uri.pathname = `/${databaseName}`;
  process.env.MONGODB_URI = uri.toString();
  if (process.env.TEST_REDIS_URL)
    process.env.REDIS_URL = process.env.TEST_REDIS_URL;
  process.env.CLIENT_URL ??= 'http://localhost:5173';
  process.env.PORT ??= '3000';
  process.env.NODE_ENV = 'test';

  let app: INestApplication | undefined;
  async function close() {
    if (!app) return;
    try {
      const connection = app.get<Connection>(getConnectionToken());
      // Only this run's generated database may be dropped, including after a failed assertion.
      assert(/^chatcord_api_test_[a-f0-9]{16}$/.test(databaseName));
      assert.equal(connection.name, databaseName);
      await connection.dropDatabase();
    } finally {
      await app.close();
    }
  }
  try {
    const { AppModule } = await import('../../src/app.module.js');
    const { RedisIoAdapter } =
      await import('../../src/modules/gateway/redis-io.adapter.js');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ logger: false });
    const adapter = new RedisIoAdapter(app);
    await adapter.connectToRedis();
    app.useWebSocketAdapter(adapter);
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    const users = app.get<Model<User>>(getModelToken(User.name));
    const rooms = app.get<Model<Room>>(getModelToken(Room.name));
    const messages = app.get<Model<Message>>(getModelToken(Message.name));
    const friendships = app.get<Model<Friendship>>(
      getModelToken(Friendship.name),
    );
    const sessions = app.get<Model<Session>>(getModelToken(Session.name));
    await Promise.all([
      users.init(),
      rooms.init(),
      messages.init(),
      friendships.init(),
      sessions.init(),
    ]);
    assert.equal(app.get<Connection>(getConnectionToken()).name, databaseName);
    const actors = await users.create(
      ['alex', 'sam', 'outsider'].map((username) => ({
        type: UserType.REGISTERED,
        username,
        displayName: username,
      })),
    );
    const sessionService = app.get(SessionService);
    const cookies: string[] = [];
    for (const actor of actors) {
      const { token } = await sessionService.createUserSession(
        actor._id.toString(),
      );
      cookies.push(`${AUTH_COOKIE}=${token}`);
    }
    const api = request(app.getHttpServer() as Server);
    return {
      app,
      api,
      actors,
      cookies,
      users,
      rooms,
      messages,
      friendships,
      sessions,
      close,
      databaseName,
    };
  } catch (error) {
    await close();
    throw error;
  }
}

export type IntegrationApp = Awaited<ReturnType<typeof createIntegrationApp>>;
