// Manual live-database check: npx ts-node --transpile-only -r tsconfig-paths/register test/verify-user-search.ts
// Uses .env.local, then .env; creates and removes only isolated test records.
import 'reflect-metadata';
import dns from 'node:dns';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection, Types, ConnectionStates } from 'mongoose';
import type { Server } from 'node:http';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { SessionService } from '../src/modules/auth/session.service';
import { SessionGuard } from '../src/modules/auth/guards/session.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { UsersService } from '../src/modules/users/users.service';
import { UserSchema, UserType } from '../src/modules/users/schemas/user.schema';
import { SessionSchema } from '../src/modules/auth/schemas/session.schema';
import { AUTH_COOKIE } from '../src/common/constants/auth.constants';

async function main() {
  // Match the resolver configuration used by src/main.ts.
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  for (const file of ['.env.local', '.env'])
    if (existsSync(file)) loadEnvFile(file);
  assert(process.env.MONGODB_URI, 'MONGODB_URI is required');
  const connection = createConnection(process.env.MONGODB_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 15000,
  });
  const ids = Array.from({ length: 28 }, () => new Types.ObjectId());
  const sessionIds: Types.ObjectId[] = [];
  // Keep the HTTP application separate so cleanup also runs after failed assertions.
  let httpApp: import('@nestjs/common').INestApplication | undefined;
  try {
    await connection.asPromise();
    console.log('Connected to configured MongoDB (credentials withheld).');
    const users = connection.model('User', UserSchema);
    const sessions = connection.model('Session', SessionSchema);
    const usersService = new UsersService(
      users as unknown as ConstructorParameters<typeof UsersService>[0],
    );
    const sessionService = new SessionService(
      sessions as unknown as ConstructorParameters<typeof SessionService>[0],
    );
    const prefix = `v${randomBytes(5).toString('hex')}`;
    await users.insertMany(
      ids.map((_id, i) => ({
        _id,
        type: i === 26 ? UserType.GUEST : UserType.REGISTERED,
        username:
          i === 27 ? undefined : `${prefix}_${String(i).padStart(2, '0')}`,
        displayName: `Search verification ${i}`,
        email: `${prefix}_${i}@example.invalid`,
      })),
    );
    const registered = await sessionService.createUserSession(
      ids[0].toString(),
    );
    sessionIds.push(registered.session._id);
    const guest = await sessionService.createGuestSession();
    sessionIds.push(guest.session._id);
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: SessionService, useValue: sessionService },
        { provide: AuthService, useValue: {} },
        { provide: ConfigService, useValue: new ConfigService() },
        SessionGuard,
        RolesGuard,
      ],
    }).compile();
    httpApp = module.createNestApplication();
    httpApp.setGlobalPrefix('api');
    httpApp.use(cookieParser());
    httpApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await httpApp.init();
    const api = request(httpApp.getHttpServer() as Server);
    const search = (q: string) =>
      api
        .get('/api/auth/users/search')
        .query({ q })
        .set('Cookie', `${AUTH_COOKIE}=${registered.token}`);
    const response = await search(` ${prefix.toUpperCase()} `).expect(200);
    const rows = response.body as {
      id: string;
      username: string;
      displayName: string;
      avatar?: unknown;
    }[];
    assert.equal(rows.length, 20);
    assert.deepEqual(
      rows.map((row) => row.username),
      Array.from(
        { length: 20 },
        (_, i) => `${prefix}_${String(i + 1).padStart(2, '0')}`,
      ),
    );
    for (const row of rows) {
      assert.notEqual(row.id, ids[0].toString());
      assert.notEqual(row.id, ids[26].toString());
      assert(
        Object.keys(row).every((key) =>
          ['id', 'username', 'displayName', 'avatar'].includes(key),
        ),
      );
    }
    console.log(
      'PASS: normalization, prefix matching, sorting, limit, self exclusion, public fields',
    );
    assert.deepEqual((await search(`${prefix}_26`).expect(200)).body, []);
    assert.deepEqual((await search(`${prefix}_00`).expect(200)).body, []);
    assert.deepEqual((await search(`${prefix}_99`).expect(200)).body, []);
    console.log('PASS: guest exclusion, self-only query, empty results');
    for (const q of ['a', 'a'.repeat(21), '.*', 'ab cd'])
      await search(q).expect(400);
    await api
      .get('/api/auth/users/search')
      .set('Cookie', `${AUTH_COOKIE}=${registered.token}`)
      .expect(400);
    await api.get('/api/auth/users/search').query({ q: prefix }).expect(401);
    await api
      .get('/api/auth/users/search')
      .query({ q: prefix })
      .set('Cookie', `${AUTH_COOKIE}=invalid`)
      .expect(401);
    await api
      .get('/api/auth/users/search')
      .query({ q: prefix })
      .set('Cookie', `${AUTH_COOKIE}=${guest.token}`)
      .expect(403);
    console.log(
      'PASS: invalid input, missing/invalid sessions, guest authorization',
    );
  } finally {
    try {
      if (connection.readyState === ConnectionStates.connected) {
        await connection
          .collection('sessions')
          .deleteMany({ _id: { $in: sessionIds } });
        await connection.collection('users').deleteMany({ _id: { $in: ids } });
        console.log('Removed isolated verification users and sessions.');
      }
    } finally {
      await httpApp?.close();
      await connection.close();
    }
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) console.error(`Failure type: ${error.name}`);
  console.error(
    'Live user-search verification failed. Check database connectivity and assertions; connection details are withheld.',
  );
  process.exitCode = 1;
});
