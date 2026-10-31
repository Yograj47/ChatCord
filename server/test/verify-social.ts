// Run from server: npx ts-node --transpile-only -r tsconfig-paths/register test/verify-social.ts
import 'reflect-metadata';
import dns from 'node:dns';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionStates, createConnection, Types } from 'mongoose';
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
import {
  RoomSchema,
  RoomType,
  RoomVisibility,
  RoomMemberRole,
} from '../src/modules/rooms/schemas/room.schema';
import { RoomsService } from '../src/modules/rooms/rooms.service';
import { RoomEventsService } from '../src/modules/rooms/room-events.service';
import { RoomsController } from '../src/modules/rooms/rooms.controller';
import { DmsController } from '../src/modules/rooms/dms.controller';
import { FriendshipSchema } from '../src/modules/friendships/schemas/friendship.schema';
import { FriendshipsService } from '../src/modules/friendships/friendships.service';
import { FriendshipsController } from '../src/modules/friendships/friendships.controller';
import { RedisService } from '../src/modules/redis/redis.service';
import { MessageSchema } from '../src/modules/messages/schemas/message.schema';
import { MessagesService } from '../src/modules/messages/messages.service';
import { MessageEventsService } from '../src/modules/messages/message-events.service';
import { MessagesController } from '../src/modules/messages/messages.controller';

async function main() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  for (const file of ['.env.local', '.env'])
    if (existsSync(file)) loadEnvFile(file);
  assert(process.env.MONGODB_URI, 'MONGODB_URI required');
  const connection = createConnection(process.env.MONGODB_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 15000,
  });
  const ids = Array.from({ length: 4 }, () => new Types.ObjectId());
  const sessionIds: Types.ObjectId[] = [];
  const roomIds: Types.ObjectId[] = [];
  let app: INestApplication | undefined;
  let stage = 'connect';
  try {
    await connection.asPromise();
    const users = connection.model('User', UserSchema);
    const sessions = connection.model('Session', SessionSchema);
    const rooms = connection.model('Room', RoomSchema);
    const friendships = connection.model('Friendship', FriendshipSchema);
    const messages = connection.model('Message', MessageSchema);
    // Add only the required unique indexes; never drop or synchronize existing indexes.
    await rooms.collection.createIndex(
      { dmPairKey: 1 },
      { unique: true, sparse: true },
    );
    await friendships.collection.createIndex({ pairKey: 1 }, { unique: true });
    const prefix = `v${randomBytes(5).toString('hex')}`;
    await users.insertMany(
      ids.map((_id, i) => ({
        _id,
        type: i === 3 ? UserType.GUEST : UserType.REGISTERED,
        username: `${prefix}_${i}`,
        displayName: `Social verification ${i}`,
      })),
    );
    const sessionService = new SessionService(
      sessions as unknown as ConstructorParameters<typeof SessionService>[0],
    );
    const tokens: string[] = [];
    for (const id of ids.slice(0, 3)) {
      const result = await sessionService.createUserSession(id.toString());
      tokens.push(result.token);
      sessionIds.push(result.session._id);
    }
    const guest = await sessionService.createGuestSession();
    tokens.push(guest.token);
    sessionIds.push(guest.session._id);
    const usersService = new UsersService(
      users as unknown as ConstructorParameters<typeof UsersService>[0],
    );
    const friendshipService = new FriendshipsService(
      friendships as unknown as ConstructorParameters<
        typeof FriendshipsService
      >[0],
      usersService,
    );
    const invalidated: string[] = [];
    const redis = {
      deleteCache: (key: string) => {
        invalidated.push(key);
        return Promise.resolve();
      },
      getCache: () => {
        throw new Error('Room authorization must not read stale cached JSON');
      },
    } as unknown as RedisService;
    const roomService = new RoomsService(
      rooms as unknown as ConstructorParameters<typeof RoomsService>[0],
      redis,
      usersService,
      friendshipService,
      new RoomEventsService(),
    );
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        RoomsController,
        DmsController,
        FriendshipsController,
        MessagesController,
      ],
      providers: [
        SessionGuard,
        RolesGuard,
        { provide: SessionService, useValue: sessionService },
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: {} },
        { provide: ConfigService, useValue: new ConfigService() },
        { provide: FriendshipsService, useValue: friendshipService },
        { provide: RoomsService, useValue: roomService },
        {
          provide: MessagesService,
          useValue: new MessagesService(
            messages as unknown as ConstructorParameters<
              typeof MessagesService
            >[0],
            roomService,
            new MessageEventsService(),
          ),
        },
      ],
    }).compile();
    app = module.createNestApplication();
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
    const api = request(app.getHttpServer() as Server);
    const cookie = (i: number) => `${AUTH_COOKIE}=${tokens[i]}`;
    const userId = (i: number) => ids[i].toString();

    stage = 'room access and guest permissions';
    const room = await rooms.create({
      type: RoomType.GROUP,
      name: 'Verification',
      slug: prefix,
      visibility: RoomVisibility.PRIVATE,
      createdBy: ids[0],
      members: [{ userId: ids[0], role: RoomMemberRole.OWNER }],
    });
    roomIds.push(room._id);
    const roomPath = `/api/rooms/${prefix}`;
    await api.get(roomPath).set('Cookie', cookie(1)).expect(403);
    await api.get(roomPath).set('Cookie', cookie(0)).expect(200);
    for (const path of [
      '/api/rooms',
      '/api/dms',
      '/api/friendships',
      `/api/rooms/${room._id.toString()}/messages`,
    ])
      await api.get(path).set('Cookie', cookie(3)).expect(403);
    await api.get(roomPath).expect(401);
    console.log('PASS: private room access and guest permissions');

    stage = 'invitation consent, validation and atomic acceptance';
    await api
      .post(`${roomPath}/members`)
      .set('Cookie', cookie(1))
      .send({ userId: userId(2) })
      .expect(403);
    await api
      .post(`${roomPath}/members`)
      .set('Cookie', cookie(0))
      .send({ userId: userId(3) })
      .expect(404);
    const invitation = await api
      .post(`${roomPath}/members`)
      .set('Cookie', cookie(0))
      .send({ userId: userId(1) })
      .expect(201);
    const invitationId = (invitation.body as { id: string }).id;
    assert.equal(
      (await rooms.findById(room._id).orFail().exec()).members.length,
      1,
    );
    await api
      .post(`${roomPath}/members`)
      .set('Cookie', cookie(0))
      .send({ userId: userId(1) })
      .expect(409);
    const incoming = await api
      .get('/api/rooms/invitations')
      .set('Cookie', cookie(1))
      .expect(200);
    assert.equal((incoming.body as unknown[]).length, 1);
    await api
      .post(`${roomPath}/invitations/${invitationId}/accept`)
      .set('Cookie', cookie(2))
      .expect(409);
    const acceptances = await Promise.all(
      [0, 1].map(() =>
        api
          .post(`${roomPath}/invitations/${invitationId}/accept`)
          .set('Cookie', cookie(1)),
      ),
    );
    assert.deepEqual(
      acceptances.map((response) => response.status).sort(),
      [201, 409],
    );
    assert.equal(
      (await rooms.findById(room._id).orFail().exec()).members.filter(
        (member) => member.userId.equals(ids[1]),
      ).length,
      1,
    );
    assert(invalidated.includes(`cache:room:${prefix}`));
    assert(invalidated.includes(`cache:room:${room._id.toString()}`));
    await api
      .patch(`${roomPath}/members/${userId(1)}`)
      .set('Cookie', cookie(0))
      .send({ role: 'owner' })
      .expect(400);
    await api
      .patch(`${roomPath}/members/${userId(1)}`)
      .set('Cookie', cookie(0))
      .send({ role: 'moderator' })
      .expect(200);
    await api
      .delete(`${roomPath}/members/${userId(0)}`)
      .set('Cookie', cookie(1))
      .expect(403);
    await api.post(`${roomPath}/leave`).set('Cookie', cookie(1)).expect(201);
    await api.get(roomPath).set('Cookie', cookie(1)).expect(403);
    console.log(
      'PASS: invitation consent, concurrent acceptance, role validation, slug mutation and cache invalidation',
    );

    stage = 'public joins and invitation expiry';
    await api
      .patch(roomPath)
      .set('Cookie', cookie(0))
      .send({ visibility: 'public' })
      .expect(200);
    const joins = await Promise.all(
      [0, 1].map(() => api.post(`${roomPath}/join`).set('Cookie', cookie(1))),
    );
    assert.deepEqual(
      joins.map((response) => response.status).sort(),
      [201, 409],
    );
    const expiredId = new Types.ObjectId();
    await rooms.updateOne(
      { _id: room._id },
      {
        $push: {
          invitations: {
            _id: expiredId,
            recipient: ids[2],
            invitedBy: ids[0],
            expiresAt: new Date(0),
          },
        },
      },
    );
    await api
      .post(`${roomPath}/invitations/${expiredId.toString()}/accept`)
      .set('Cookie', cookie(2))
      .expect(409);
    const decline = await api
      .post(`${roomPath}/members`)
      .set('Cookie', cookie(0))
      .send({ userId: userId(2) })
      .expect(201);
    await api
      .delete(`${roomPath}/invitations/${(decline.body as { id: string }).id}`)
      .set('Cookie', cookie(2))
      .expect(200);
    console.log(
      'PASS: concurrent joins, expired invitations, recipient decline',
    );

    stage = 'onboarding validation and atomic duplicate handling';
    for (const body of [
      {},
      { username: 5 },
      { username: 'bad name' },
      { username: 'valid_name', displayName: ' ' },
    ])
      await api
        .post('/api/auth/onboarding')
        .set('Cookie', cookie(0))
        .send(body)
        .expect(400);
    await api
      .post('/api/auth/onboarding')
      .set('Cookie', cookie(0))
      .send({ username: `${prefix}_1`, displayName: 'Should not persist' })
      .expect(409);
    assert.equal(
      (await users.findById(ids[0]).orFail().exec()).displayName,
      'Social verification 0',
    );
    await api
      .post('/api/auth/onboarding')
      .set('Cookie', cookie(0))
      .send({
        username: ` ${prefix.toUpperCase()}_0 `,
        displayName: ' Verified ',
      })
      .expect(201);
    assert.equal(
      (await users.findById(ids[0]).orFail().exec()).displayName,
      'Verified',
    );
    console.log(
      'PASS: onboarding validation, normalization and duplicate rollback',
    );

    stage = 'friendship lifecycle and DM concurrency';
    await api
      .post('/api/dms')
      .set('Cookie', cookie(0))
      .send({ userId: userId(1) })
      .expect(409);
    const sent = await api
      .post('/api/friendships/requests')
      .set('Cookie', cookie(0))
      .send({ recipientId: userId(1) })
      .expect(201);
    const friendshipId = (sent.body as { id: string }).id;
    await api
      .post('/api/friendships/requests')
      .set('Cookie', cookie(1))
      .send({ recipientId: userId(0) })
      .expect(409);
    await api
      .patch(`/api/friendships/requests/${friendshipId}/accept`)
      .set('Cookie', cookie(2))
      .expect(404);
    await api
      .patch(`/api/friendships/requests/${friendshipId}/accept`)
      .set('Cookie', cookie(1))
      .expect(200);
    const dms = await Promise.all(
      [0, 1].map((i) =>
        api
          .post('/api/dms')
          .set('Cookie', cookie(i))
          .send({ userId: userId(1 - i) })
          .expect(201),
      ),
    );
    const dmId = (dms[0].body as { _id: string })._id;
    roomIds.push(new Types.ObjectId(dmId));
    assert.equal((dms[1].body as { _id: string })._id, dmId);
    const dmPath = `/api/rooms/${dmId}`;
    await api.get(dmPath).set('Cookie', cookie(2)).expect(403);
    await api.get('/api/dms').set('Cookie', cookie(1)).expect(200);
    await api
      .post(`${dmPath}/members`)
      .set('Cookie', cookie(0))
      .send({ userId: userId(2) })
      .expect(403);
    await api
      .post(`${dmPath}/messages`)
      .set('Cookie', cookie(0))
      .send({ content: 'Verified DM' })
      .expect(201);
    await api
      .delete(`/api/friendships/${friendshipId}`)
      .set('Cookie', cookie(1))
      .expect(200);
    await api
      .post(`${dmPath}/messages`)
      .set('Cookie', cookie(0))
      .send({ content: 'Must be blocked' })
      .expect(409);
    const history = await api
      .get(`${dmPath}/messages`)
      .set('Cookie', cookie(0))
      .expect(200);
    assert.equal((history.body as unknown[]).length, 1);
    console.log(
      'PASS: friendship authorization, duplicate DM prevention, private DM access, immutable members, friend-only sends and retained history',
    );

    stage = 'cancel and decline requests';
    for (const action of ['cancel', 'decline']) {
      const pending = await api
        .post('/api/friendships/requests')
        .set('Cookie', cookie(0))
        .send({ recipientId: userId(2) })
        .expect(201);
      const pendingId = (pending.body as { id: string }).id;
      await api
        .delete(`/api/friendships/requests/${pendingId}/${action}`)
        .set('Cookie', cookie(1))
        .expect(404);
      await api
        .delete(`/api/friendships/requests/${pendingId}/${action}`)
        .set('Cookie', cookie(action === 'cancel' ? 0 : 2))
        .expect(200);
    }
    console.log(
      'PASS: cancel and decline authorization; all live social checks passed',
    );
  } catch (error) {
    console.error(`Failed stage: ${stage}`);
    throw error;
  } finally {
    try {
      if (connection.readyState === ConnectionStates.connected) {
        // Ownership filters also catch records created before an assertion failed.
        const owned = await connection
          .model('Room', RoomSchema)
          .find({ createdBy: { $in: ids } })
          .select('_id')
          .exec();
        const allRooms = [...roomIds, ...owned.map((room) => room._id)];
        await connection
          .collection('messages')
          .deleteMany({ roomId: { $in: allRooms } });
        await connection
          .collection('rooms')
          .deleteMany({ createdBy: { $in: ids } });
        await connection
          .collection('friendships')
          .deleteMany({ requester: { $in: ids } });
        await connection
          .collection('sessions')
          .deleteMany({ _id: { $in: sessionIds } });
        await connection.collection('users').deleteMany({ _id: { $in: ids } });
        console.log('Removed isolated social verification records.');
      }
    } finally {
      await app?.close();
      await connection.close();
    }
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) console.error(`Failure type: ${error.name}`);
  console.error('Social verification failed; connection details withheld.');
  process.exitCode = 1;
});
