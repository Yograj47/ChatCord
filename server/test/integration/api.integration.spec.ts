import type { Server } from 'node:http';
interface GuestIdentity {
  id: string;
  expiresAt: string;
  user: { username: string };
}
import { GuestLifecycleService } from '../../src/modules/auth/guest-lifecycle.service';
import { io } from '../../../client/node_modules/socket.io-client';
import type { AddressInfo } from 'node:net';
import { FriendshipStatus } from '../../src/modules/friendships/schemas/friendship.schema';
import { Types } from 'mongoose';
import {
  RoomCapability,
  RoomMemberRole,
  RoomVisibility,
  RoomType,
} from '../../src/modules/rooms/schemas/room.schema';
import {
  createIntegrationApp,
  IntegrationApp,
} from '../helpers/integration-app';

describe('API integration with real persistence', () => {
  let f: IntegrationApp;
  let roomId: string;
  let invitationId: string;
  let friendshipId: string;
  let dmId: string;
  let messageId: string;
  let replyId: string;
  const user = (index: number) => f.actors[index]._id.toString();
  beforeAll(async () => {
    f = await createIntegrationApp();
  }, 90000);
  afterAll(async () => {
    await f?.close();
  }, 30000);

  it('returns an actual persisted user from the authenticated session', async () => {
    const response = await f.api
      .get('/api/auth/me')
      .set('Cookie', f.cookies[0])
      .expect(200);
    expect(response.body).toMatchObject({
      id: user(0),
      type: 'registered',
      user: { username: 'alex' },
    });
    await f.api.get('/api/rooms').expect(401);
    await f.api
      .get('/api/rooms')
      .set('Cookie', 'chatcord.sid=invalid')
      .expect(401);
  });
  it('creates and revokes a real guest session through the API', async () => {
    const created = await f.api.post('/api/auth/guest').expect(201);
    const cookie = (
      created.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];
    await f.api.get('/api/auth/me').set('Cookie', cookie).expect(200);
    await f.api.get('/api/rooms').set('Cookie', cookie).expect(200);
    await f.api.post('/api/auth/logout').set('Cookie', cookie).expect(201);
    await f.api.get('/api/auth/me').set('Cookie', cookie).expect(401);
  });
  it('updates onboarding atomically and searches persisted registered profiles', async () => {
    await f.api
      .post('/api/auth/onboarding')
      .set('Cookie', f.cookies[0])
      .send({ username: ' ALEX_1 ', displayName: ' Alex ' })
      .expect(201);
    expect((await f.users.findById(user(0)).orFail()).username).toBe('alex_1');
    await f.api
      .post('/api/auth/onboarding')
      .set('Cookie', f.cookies[0])
      .send({ username: 'sam', displayName: 'Must not persist' })
      .expect(409);
    expect((await f.users.findById(user(0)).orFail()).displayName).toBe('Alex');
    const search = await f.api
      .get('/api/auth/users/search?q=SA')
      .set('Cookie', f.cookies[0])
      .expect(200);
    expect(search.body).toEqual([
      expect.objectContaining({ id: user(1), username: 'sam' }),
    ]);
    expect((search.body as unknown[])[0]).not.toHaveProperty('email');
  });
  it('creates a private group and enforces private access against stored membership', async () => {
    const created = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({
        type: 'group',
        name: 'API integration group',
        visibility: 'private',
      })
      .expect(201);
    roomId = (created.body as { _id: string })._id;
    expect(
      await f.rooms.countDocuments({
        _id: new Types.ObjectId(roomId),
        'members.userId': f.actors[0]._id,
      }),
    ).toBe(1);
    await f.api
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', f.cookies[2])
      .expect(403);
    await f.api
      .patch(`/api/rooms/${roomId}`)
      .set('Cookie', f.cookies[2])
      .send({ name: 'Forbidden' })
      .expect(403);
  });
  it('persists an invitation without adding membership and prevents duplicate pending invitations', async () => {
    const sent = await f.api
      .post(`/api/rooms/${roomId}/members`)
      .set('Cookie', f.cookies[0])
      .send({ userId: user(1) })
      .expect(201);
    invitationId = (sent.body as { id: string }).id;
    expect((await f.rooms.findById(roomId).orFail()).members).toHaveLength(1);
    await f.api
      .post(`/api/rooms/${roomId}/members`)
      .set('Cookie', f.cookies[0])
      .send({ userId: user(1) })
      .expect(409);
    const inbox = await f.api
      .get('/api/rooms/invitations')
      .set('Cookie', f.cookies[1])
      .expect(200);
    expect(inbox.body).toEqual([
      expect.objectContaining({ id: invitationId, roomId }),
    ]);
    const outsider = await f.api
      .get('/api/rooms/invitations')
      .set('Cookie', f.cookies[2])
      .expect(200);
    expect(outsider.body).toEqual([]);
  });
  it('authorizes the invitation recipient and accepts membership exactly once under concurrency', async () => {
    const path = `/api/rooms/${roomId}/invitations/${invitationId}/accept`;
    await f.api.post(path).set('Cookie', f.cookies[2]).expect(409);
    const responses = await Promise.all(
      [0, 1].map(() => f.api.post(path).set('Cookie', f.cookies[1])),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      (await f.rooms.findById(roomId).orFail()).members.filter(
        (member) => member.userId.toString() === user(1),
      ),
    ).toHaveLength(1);
  });
  it('enforces owner-only role changes and membership removal', async () => {
    const path = `/api/rooms/${roomId}/members/${user(1)}`;
    await f.api
      .patch(path)
      .set('Cookie', f.cookies[1])
      .send({ role: 'moderator' })
      .expect(403);
    await f.api
      .patch(path)
      .set('Cookie', f.cookies[0])
      .send({ role: 'moderator' })
      .expect(200);
    await f.api
      .delete(`/api/rooms/${roomId}/members/${user(0)}`)
      .set('Cookie', f.cookies[1])
      .expect(403);
    expect(
      (await f.rooms.findById(roomId).orFail()).members.find(
        (member) => member.userId.toString() === user(1),
      )?.role,
    ).toBe('moderator');
  });
  it('creates and accepts a friendship using participant authorization and a unique pair', async () => {
    await f.api
      .post('/api/dms')
      .set('Cookie', f.cookies[0])
      .send({ userId: user(1) })
      .expect(409);
    const sent = await f.api
      .post('/api/friendships/requests')
      .set('Cookie', f.cookies[0])
      .send({ recipientId: user(1) })
      .expect(201);
    friendshipId = (sent.body as { id: string }).id;
    await f.api
      .post('/api/friendships/requests')
      .set('Cookie', f.cookies[1])
      .send({ recipientId: user(0) })
      .expect(409);
    await f.api
      .patch(`/api/friendships/requests/${friendshipId}/accept`)
      .set('Cookie', f.cookies[2])
      .expect(404);
    await f.api
      .patch(`/api/friendships/requests/${friendshipId}/accept`)
      .set('Cookie', f.cookies[1])
      .expect(200);
    expect(
      await f.friendships.countDocuments({
        _id: friendshipId,
        status: FriendshipStatus.ACCEPTED,
      }),
    ).toBe(1);
  });
  it('reuses one persisted DM during concurrent opposite-direction creation', async () => {
    const responses = await Promise.all(
      [0, 1].map((index) =>
        f.api
          .post('/api/dms')
          .set('Cookie', f.cookies[index])
          .send({ userId: user(1 - index) })
          .expect(201),
      ),
    );
    dmId = (responses[0].body as { _id: string })._id;
    expect((responses[1].body as { _id: string })._id).toBe(dmId);
    expect(await f.rooms.countDocuments({ type: RoomType.DM })).toBe(1);
    await f.api
      .get(`/api/rooms/${dmId}/messages/page`)
      .set('Cookie', f.cookies[2])
      .expect(403);
  });
  it('validates and persists message creation and reply references', async () => {
    await f.api
      .post(`/api/rooms/${dmId}/messages`)
      .set('Cookie', f.cookies[0])
      .send({ content: ' ', senderId: user(2) })
      .expect(400);
    const created = await f.api
      .post(`/api/rooms/${dmId}/messages`)
      .set('Cookie', f.cookies[0])
      .send({ content: ' Persisted parent ' })
      .expect(201);
    messageId = (created.body as { _id: string })._id;
    const reply = await f.api
      .post(`/api/rooms/${dmId}/messages`)
      .set('Cookie', f.cookies[1])
      .send({ content: 'Persisted reply', replyTo: messageId })
      .expect(201);
    replyId = (reply.body as { _id: string })._id;
    expect(
      (await f.messages.findById(replyId).orFail()).replyTo?.toString(),
    ).toBe(messageId);
    const replies = await f.api
      .get(`/api/rooms/${dmId}/messages/page?replyTo=${messageId}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    expect((replies.body as { items: unknown[] }).items).toHaveLength(1);
  });
  it('persists author-only edits and scoped literal search', async () => {
    const path = `/api/rooms/${dmId}/messages/${messageId}`;
    await f.api
      .patch(path)
      .set('Cookie', f.cookies[1])
      .send({ content: 'Forbidden' })
      .expect(403);
    await f.api
      .patch(path)
      .set('Cookie', f.cookies[0])
      .send({ content: ' Edited .* parent ' })
      .expect(200);
    expect((await f.messages.findById(messageId).orFail()).content).toBe(
      'Edited .* parent',
    );
    const search = await f.api
      .get(`/api/rooms/${dmId}/messages/page`)
      .query({ q: '.*' })
      .set('Cookie', f.cookies[1])
      .expect(200);
    expect((search.body as { items: unknown[] }).items).toHaveLength(1);
  });
  it('stores idempotent per-user reactions and removes only the caller reaction', async () => {
    const path = `/api/rooms/${dmId}/messages/${messageId}/reactions`;
    await Promise.all(
      [0, 1].map(() =>
        f.api
          .post(path)
          .set('Cookie', f.cookies[1])
          .send({ emoji: '👍' })
          .expect(201),
      ),
    );
    await f.api
      .delete(path)
      .set('Cookie', f.cookies[0])
      .send({ emoji: '👍' })
      .expect(200);
    expect(
      (await f.messages.findById(messageId).orFail()).reactions,
    ).toHaveLength(1);
    await f.api
      .delete(path)
      .set('Cookie', f.cookies[1])
      .send({ emoji: '👍' })
      .expect(200);
    expect(
      (await f.messages.findById(messageId).orFail()).reactions,
    ).toHaveLength(0);
  });
  it('paginates persisted records without overlap', async () => {
    const first = await f.api
      .get(`/api/rooms/${dmId}/messages/page?limit=1`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    const cursor = (first.body as { nextCursor: string }).nextCursor;
    expect(cursor).toBe(replyId);
    const next = await f.api
      .get(`/api/rooms/${dmId}/messages/page?limit=1&before=${cursor}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    expect(next.body).toMatchObject({
      items: [{ _id: messageId }],
      nextCursor: null,
    });
  });
  it('blocks sends after unfriending while retaining persisted history', async () => {
    await f.api
      .delete(`/api/friendships/${friendshipId}`)
      .set('Cookie', f.cookies[1])
      .expect(200);
    await f.api
      .post(`/api/rooms/${dmId}/messages`)
      .set('Cookie', f.cookies[0])
      .send({ content: 'Blocked' })
      .expect(409);
    expect(
      await f.messages.countDocuments({ roomId: new Types.ObjectId(dmId) }),
    ).toBe(2);
    await f.api
      .get(`/api/rooms/${dmId}/messages/page`)
      .set('Cookie', f.cookies[0])
      .expect(200);
  });
  it('deletes author text without breaking reply references', async () => {
    const path = `/api/rooms/${dmId}/messages/${messageId}`;
    await f.api.delete(path).set('Cookie', f.cookies[1]).expect(403);
    await f.api.delete(path).set('Cookie', f.cookies[0]).expect(200);
    const stored = await f.messages.findById(messageId).orFail();
    expect(stored.content).toBe('[Message deleted]');
    expect(stored.deletedAt).toBeInstanceOf(Date);
    expect(
      (await f.messages.findById(replyId).orFail()).replyTo?.toString(),
    ).toBe(messageId);
    await f.api
      .patch(path)
      .set('Cookie', f.cookies[0])
      .send({ content: 'Resurrect' })
      .expect(404);
  });
  it('persists recipient-only invitation decline without adding membership', async () => {
    const sent = await f.api
      .post(`/api/rooms/${roomId}/members`)
      .set('Cookie', f.cookies[0])
      .send({ userId: user(2) })
      .expect(201);
    const id = (sent.body as { id: string }).id;
    const path = `/api/rooms/${roomId}/invitations/${id}`;
    await f.api.delete(path).set('Cookie', f.cookies[1]).expect(404);
    await f.api.delete(path).set('Cookie', f.cookies[2]).expect(200);
    const stored = await f.rooms
      .findById(roomId)
      .select('+invitations')
      .orFail();
    expect(stored.invitations).toHaveLength(0);
    expect(stored.members).toHaveLength(2);
  });
  it('authorizes request decline and cancellation and persists their removal', async () => {
    for (const action of ['decline', 'cancel']) {
      const sent = await f.api
        .post('/api/friendships/requests')
        .set('Cookie', f.cookies[0])
        .send({ recipientId: user(2) })
        .expect(201);
      const id = (sent.body as { id: string }).id;
      const path = `/api/friendships/requests/${id}/${action}`;
      await f.api.delete(path).set('Cookie', f.cookies[1]).expect(404);
      await f.api
        .delete(path)
        .set('Cookie', f.cookies[action === 'decline' ? 2 : 0])
        .expect(200);
      expect(await f.friendships.findById(id)).toBeNull();
    }
  });
  it('persists public-room join and leave without duplicate membership', async () => {
    const created = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({ type: 'group', name: 'Public API group', visibility: 'public' })
      .expect(201);
    const id = (created.body as { _id: string })._id;
    await f.api.get(`/api/rooms/${id}`).set('Cookie', f.cookies[2]).expect(200);
    await f.api
      .post(`/api/rooms/${id}/join`)
      .set('Cookie', f.cookies[2])
      .expect(201);
    expect((await f.rooms.findById(id).orFail()).members).toHaveLength(2);
    await f.api
      .get(`/api/rooms/${id}/members`)
      .set('Cookie', f.cookies[2])
      .expect(200);
    await f.api
      .post(`/api/rooms/${id}/leave`)
      .set('Cookie', f.cookies[2])
      .expect(201);
    expect((await f.rooms.findById(id).orFail()).members).toHaveLength(1);
    await f.api
      .delete(`/api/rooms/${id}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
  });
  it('revokes private-room reads after membership removal and deletes the group', async () => {
    await f.api
      .delete(`/api/rooms/${roomId}/members/${user(1)}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    await f.api
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', f.cookies[1])
      .expect(403);
    await f.api
      .delete(`/api/rooms/${roomId}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    expect(await f.rooms.findById(roomId)).toBeNull();
  });
  it('lets temporary guests discover and chat in public rooms while enforcing restrictions', async () => {
    const created = await f.api.post('/api/auth/guest').expect(201);
    const cookie = (
      created.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];
    const me = await f.api
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    const identity = me.body as GuestIdentity;
    const guestId = identity.id;
    expect(identity.user.username).toMatch(/^guest_[a-f0-9]{12}$/);
    const deadline = identity.expiresAt;
    const guest = await f.users.findById(guestId).orFail();
    expect(guest.expiresAt!.getTime() - Date.now()).toBeLessThanOrEqual(
      30 * 60 * 1000,
    );
    const room = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({
        type: 'group',
        name: 'Guest public lounge',
        visibility: 'public',
      })
      .expect(201);
    const id = (room.body as { _id: string })._id;
    const hidden = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({
        type: 'group',
        name: 'Guest private lounge',
        visibility: 'private',
      })
      .expect(201);
    const hiddenId = (hidden.body as { _id: string })._id;
    const found = await f.api
      .get('/api/rooms/public?q=Guest')
      .set('Cookie', cookie)
      .expect(200);
    expect(found.body).toEqual([expect.objectContaining({ _id: id })]);
    await f.api
      .get('/api/rooms/public?q=%5B')
      .set('Cookie', cookie)
      .expect(200)
      .expect([]);
    await f.api.get(`/api/rooms/${hiddenId}`).set('Cookie', cookie).expect(403);
    await f.api
      .post(`/api/rooms/${hiddenId}/join`)
      .set('Cookie', cookie)
      .expect(403);
    await f.api
      .get(`/api/rooms/${id}/messages/page`)
      .set('Cookie', cookie)
      .expect(403);
    await f.api.post(`/api/rooms/${id}/join`).set('Cookie', cookie).expect(201);
    await f.api
      .get(`/api/rooms/${id}/members`)
      .set('Cookie', cookie)
      .expect(200);
    const sent = await f.api
      .post(`/api/rooms/${id}/messages`)
      .set('Cookie', cookie)
      .send({ content: 'Guest hello' })
      .expect(201);
    expect((sent.body as { senderId: string }).senderId).toBe(guestId);
    const history = await f.api
      .get(`/api/rooms/${id}/messages/page`)
      .set('Cookie', cookie)
      .expect(200);
    expect(
      (history.body as { items: { kind?: string }[] }).items.filter(
        (message) => message.kind !== 'system',
      ),
    ).toEqual([expect.objectContaining({ content: 'Guest hello' })]);
    await f.api
      .post('/api/rooms')
      .set('Cookie', cookie)
      .send({ type: 'group', name: 'Forbidden' })
      .expect(403);
    await f.api
      .patch(`/api/rooms/${id}`)
      .set('Cookie', cookie)
      .send({ name: 'Forbidden' })
      .expect(403);
    await f.api
      .patch(`/api/rooms/${id}/members/${guestId}`)
      .set('Cookie', f.cookies[0])
      .send({ role: 'moderator' })
      .expect(403);
    await f.api.get('/api/rooms/invitations').set('Cookie', cookie).expect(403);
    await f.api.get('/api/dms').set('Cookie', cookie).expect(403);
    await f.api.get('/api/friendships').set('Cookie', cookie).expect(403);
    expect(
      (
        (await f.api.get('/api/auth/me').set('Cookie', cookie))
          .body as GuestIdentity
      ).expiresAt,
    ).toBe(deadline);
    await f.api
      .patch(`/api/rooms/${id}`)
      .set('Cookie', f.cookies[0])
      .send({ visibility: 'private' })
      .expect(200);
    await f.api
      .get(`/api/rooms/${id}/messages/page`)
      .set('Cookie', cookie)
      .expect(403);
    expect(
      (await f.rooms.findById(id).orFail()).members.some(
        (member) => member.userId.toString() === guestId,
      ),
    ).toBe(false);
    await f.api
      .delete(`/api/rooms/${id}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
    await f.api
      .delete(`/api/rooms/${hiddenId}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
  });

  it('expires guest sockets and HTTP access and deletes expired identities and memberships', async () => {
    await f.app.listen(0, '127.0.0.1');
    const created = await f.api.post('/api/auth/guest').expect(201);
    const cookie = (
      created.headers['set-cookie'] as unknown as string[]
    )[0].split(';')[0];
    const me = await f.api
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    const identity = me.body as GuestIdentity;
    const guestId = identity.id;
    const room = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({
        type: 'group',
        name: 'Expiring guest room',
        visibility: 'public',
      })
      .expect(201);
    const id = (room.body as { _id: string })._id;
    await f.api.post(`/api/rooms/${id}/join`).set('Cookie', cookie).expect(201);
    const deadline = new Date(Date.now() + 8000);
    await f.sessions.updateMany(
      { userId: new Types.ObjectId(guestId) },
      { $set: { expiresAt: deadline, absoluteExpiresAt: deadline } },
    );
    await f.users.updateOne(
      { _id: guestId },
      { $set: { expiresAt: deadline } },
    );
    const httpServer = f.app.getHttpServer() as Server;
    const address = httpServer.address() as AddressInfo;
    const socket = io(`http://127.0.0.1:${address.port}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      extraHeaders: { Cookie: cookie },
      reconnection: false,
    });
    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
      const ack: unknown = await socket
        .timeout(2000)
        .emitWithAck('join-room', { roomId: id });
      expect(ack).toMatchObject({ ok: true });
      const sent: unknown = await socket
        .timeout(2000)
        .emitWithAck('send-message', {
          roomId: id,
          content: 'Guest socket message',
        });
      expect(sent).toMatchObject({ ok: true });
      await new Promise<void>((resolve) =>
        socket.once('disconnect', () => resolve()),
      );
      await f.api.get('/api/auth/me').set('Cookie', cookie).expect(401);
      await f.api
        .get(`/api/rooms/${id}/messages/page`)
        .set('Cookie', cookie)
        .expect(401);
      await f.app.get(GuestLifecycleService).cleanup();
      expect(
        await f.messages.countDocuments({
          roomId: new Types.ObjectId(id),
          kind: 'system',
          systemEvent: 'expired',
        }),
      ).toBe(1);
      expect(await f.users.findById(guestId)).toBeNull();
      expect(
        await f.sessions.countDocuments({
          userId: new Types.ObjectId(guestId),
        }),
      ).toBe(0);
      expect(
        (await f.rooms.findById(id).orFail()).members.some(
          (member) => member.userId.toString() === guestId,
        ),
      ).toBe(false);
    } finally {
      socket.disconnect();
    }
    await f.api
      .delete(`/api/rooms/${id}`)
      .set('Cookie', f.cookies[0])
      .expect(200);
  }, 20000);
  it.each(['public', 'private', 'dm', 'guest'] as const)(
    'hides pre-join messages and bypass routes for %s membership',
    async (kind) => {
      let cookie = f.cookies[1];
      let viewerId = user(1);
      if (kind === 'guest') {
        const created = await f.api.post('/api/auth/guest').expect(201);
        cookie = (
          created.headers['set-cookie'] as unknown as string[]
        )[0].split(';')[0];
        const identity = (await f.api.get('/api/auth/me').set('Cookie', cookie))
          .body as GuestIdentity;
        viewerId = identity.id;
      }
      if (kind === 'dm')
        await f.friendships.create({
          requester: f.actors[0]._id,
          recipient: f.actors[1]._id,
          pairKey: [user(0), user(1)].sort().join(':'),
          status: FriendshipStatus.ACCEPTED,
        });
      const joinedAt = new Date(Date.now() - 5000);
      const room = await f.rooms.create({
        type: kind === 'dm' ? RoomType.DM : RoomType.GROUP,
        name: `History policy ${kind}`,
        visibility:
          kind === 'private' || kind === 'dm'
            ? RoomVisibility.PRIVATE
            : RoomVisibility.PUBLIC,
        capabilities: [RoomCapability.TEXT],
        createdBy: f.actors[0]._id,
        members: [
          {
            userId: f.actors[0]._id,
            role: RoomMemberRole.OWNER,
            joinedAt: new Date(joinedAt.getTime() - 10000),
          },
          {
            userId: new Types.ObjectId(viewerId),
            role: RoomMemberRole.MEMBER,
            joinedAt,
          },
        ],
      });
      const id = room._id.toString();
      const [old, recent, oldOwn] = await f.messages.create([
        {
          roomId: room._id,
          senderId: f.actors[0]._id,
          content: 'hidden old secret',
          createdAt: new Date(joinedAt.getTime() - 1000),
        },
        {
          roomId: room._id,
          senderId: f.actors[0]._id,
          content: 'visible new message',
          createdAt: new Date(joinedAt.getTime() + 1000),
        },
        {
          roomId: room._id,
          senderId: new Types.ObjectId(viewerId),
          content: 'own message before rejoin',
          createdAt: new Date(joinedAt.getTime() - 1000),
        },
      ]);
      const list = await f.api
        .get(`/api/rooms/${id}/messages`)
        .set('Cookie', cookie)
        .expect(200);
      expect(list.body).toEqual([
        expect.objectContaining({ _id: recent._id.toString() }),
      ]);
      const page = await f.api
        .get(`/api/rooms/${id}/messages/page?limit=1`)
        .set('Cookie', cookie)
        .expect(200);
      expect(page.body).toMatchObject({
        items: [{ _id: recent._id.toString() }],
        nextCursor: null,
      });
      await f.api
        .get(`/api/rooms/${id}/messages/page?before=${recent._id.toString()}`)
        .set('Cookie', cookie)
        .expect(200)
        .expect({ items: [], nextCursor: null });
      await f.api
        .get(`/api/rooms/${id}/messages/page?q=secret`)
        .set('Cookie', cookie)
        .expect(200)
        .expect({ items: [], nextCursor: null });
      await f.api
        .get(`/api/rooms/${id}/messages/${old._id.toString()}`)
        .set('Cookie', cookie)
        .expect(404);
      await f.api
        .get(`/api/rooms/${id}/messages/page?replyTo=${old._id.toString()}`)
        .set('Cookie', cookie)
        .expect(404);
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', cookie)
        .send({ content: 'Hidden parent reply', replyTo: old._id.toString() })
        .expect(404);
      await f.api
        .post(`/api/rooms/${id}/messages/${old._id.toString()}/reactions`)
        .set('Cookie', cookie)
        .send({ emoji: '👍' })
        .expect(404);
      await f.api
        .patch(`/api/rooms/${id}/messages/${oldOwn._id.toString()}`)
        .set('Cookie', cookie)
        .send({ content: 'Forbidden edit' })
        .expect(404);
      await f.api
        .delete(`/api/rooms/${id}/messages/${oldOwn._id.toString()}`)
        .set('Cookie', cookie)
        .expect(404);
      const ownerHistory = await f.api
        .get(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .expect(200);
      expect(ownerHistory.body).toHaveLength(3);
      if (kind === 'dm')
        await f.friendships.deleteOne({
          pairKey: [user(0), user(1)].sort().join(':'),
        });
      await f.messages.deleteMany({ roomId: room._id });
      await f.rooms.deleteOne({ _id: room._id });
    },
  );

  it('filters old-message socket updates and starts fresh history after rejoining', async () => {
    const created = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({
        type: 'group',
        name: 'History socket policy',
        visibility: 'public',
      })
      .expect(201);
    const id = (created.body as { _id: string })._id;
    const oldResponse = await f.api
      .post(`/api/rooms/${id}/messages`)
      .set('Cookie', f.cookies[0])
      .send({ content: 'Before joining' })
      .expect(201);
    const old = oldResponse.body as { _id: string };
    await f.api
      .post(`/api/rooms/${id}/join`)
      .set('Cookie', f.cookies[1])
      .expect(201);
    const address = (f.app.getHttpServer() as Server).address() as AddressInfo;
    const socket = io(`http://127.0.0.1:${address.port}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      extraHeaders: { Cookie: f.cookies[1] },
      reconnection: false,
    });
    const updates: unknown[] = [];
    socket.on('message-updated', (message: unknown) => updates.push(message));
    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
      expect(
        await socket.timeout(3000).emitWithAck('join-room', { roomId: id }),
      ).toMatchObject({ ok: true });
      await f.api
        .patch(`/api/rooms/${id}/messages/${old._id}`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'Old secret edited' })
        .expect(200);
      const delivered = new Promise<{ content: string }>((resolve) =>
        socket.once('new-message', resolve),
      );
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'After joining' })
        .expect(201);
      expect(await delivered).toMatchObject({ content: 'After joining' });
      expect(updates).toEqual([]);
      await f.api
        .post(`/api/rooms/${id}/leave`)
        .set('Cookie', f.cookies[1])
        .expect(201);
      await f.api
        .post(`/api/rooms/${id}/join`)
        .set('Cookie', f.cookies[1])
        .expect(201);
      const rejoined = await f.api
        .get(`/api/rooms/${id}/messages/page`)
        .set('Cookie', f.cookies[1])
        .expect(200);
      expect(
        (rejoined.body as { items: { kind?: string }[] }).items.filter(
          (message) => message.kind !== 'system',
        ),
      ).toEqual([]);
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'After rejoining' })
        .expect(201);
      const history = await f.api
        .get(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[1])
        .expect(200);
      expect(
        (history.body as { kind?: string }[]).filter(
          (message) => message.kind !== 'system',
        ),
      ).toEqual([expect.objectContaining({ content: 'After rejoining' })]);
    } finally {
      socket.disconnect();
    }
    await f.messages.deleteMany({ roomId: new Types.ObjectId(id) });
    await f.rooms.deleteOne({ _id: new Types.ObjectId(id) });
  });
  it('persists trusted activity notices for membership and room changes and publishes them live', async () => {
    const created = await f.api
      .post('/api/rooms')
      .set('Cookie', f.cookies[0])
      .send({ type: 'group', name: 'Activity room', visibility: 'public' })
      .expect(201);
    const id = (created.body as { _id: string })._id;
    const address = (f.app.getHttpServer() as Server).address() as AddressInfo;
    const socket = io(`http://127.0.0.1:${address.port}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
      extraHeaders: { Cookie: f.cookies[0] },
      reconnection: false,
    });
    const notices: { kind?: string; systemEvent?: string; content: string }[] =
      [];
    socket.on(
      'new-message',
      (message: { kind?: string; systemEvent?: string; content: string }) => {
        if (message.kind === 'system') notices.push(message);
      },
    );
    try {
      await new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
      expect(
        await socket.timeout(3000).emitWithAck('join-room', { roomId: id }),
      ).toMatchObject({ ok: true });
      await f.api
        .post(`/api/rooms/${id}/join`)
        .set('Cookie', f.cookies[1])
        .expect(201);
      await f.api
        .post(`/api/rooms/${id}/join`)
        .set('Cookie', f.cookies[1])
        .expect(409);
      await f.api
        .post(`/api/rooms/${id}/leave`)
        .set('Cookie', f.cookies[1])
        .expect(201);
      await f.api
        .post(`/api/rooms/${id}/join`)
        .set('Cookie', f.cookies[1])
        .expect(201);
      await f.api
        .patch(`/api/rooms/${id}/members/${user(1)}`)
        .set('Cookie', f.cookies[0])
        .send({ role: 'moderator' })
        .expect(200);
      await f.api
        .patch(`/api/rooms/${id}`)
        .set('Cookie', f.cookies[0])
        .send({ name: 'Renamed activity room', capabilities: [] })
        .expect(200);
      const count = await f.messages.countDocuments({
        roomId: new Types.ObjectId(id),
        kind: 'system',
      });
      await f.api
        .patch(`/api/rooms/${id}`)
        .set('Cookie', f.cookies[0])
        .send({ name: 'Renamed activity room', capabilities: [] })
        .expect(200);
      await f.api
        .patch(`/api/rooms/${id}`)
        .set('Cookie', f.cookies[2])
        .send({ name: 'Forbidden change' })
        .expect(403);
      expect(
        await f.messages.countDocuments({
          roomId: new Types.ObjectId(id),
          kind: 'system',
        }),
      ).toBe(count);
      await f.api
        .delete(`/api/rooms/${id}/members/${user(1)}`)
        .set('Cookie', f.cookies[0])
        .expect(200);
      const invitation = await f.api
        .post(`/api/rooms/${id}/members`)
        .set('Cookie', f.cookies[0])
        .send({ userId: user(2) })
        .expect(201);
      await f.api
        .post(
          `/api/rooms/${id}/invitations/${(invitation.body as { id: string }).id}/accept`,
        )
        .set('Cookie', f.cookies[2])
        .expect(201);
      await f.api
        .patch(`/api/rooms/${id}`)
        .set('Cookie', f.cookies[0])
        .send({ capabilities: ['text'] })
        .expect(200);
      const renamed = await f.messages
        .findOne({ roomId: new Types.ObjectId(id), systemEvent: 'renamed' })
        .orFail();
      expect(renamed.content).toContain('Renamed activity room');
      await f.api
        .patch(`/api/rooms/${id}/messages/${renamed._id.toString()}`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'Tampered notice' })
        .expect(403);
      await f.api
        .delete(`/api/rooms/${id}/messages/${renamed._id.toString()}`)
        .set('Cookie', f.cookies[0])
        .expect(403);
      await f.api
        .post(`/api/rooms/${id}/messages/${renamed._id.toString()}/reactions`)
        .set('Cookie', f.cookies[0])
        .send({ emoji: '👍' })
        .expect(404);
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'Reply to system', replyTo: renamed._id.toString() })
        .expect(403);
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'Forged', kind: 'system' })
        .expect(400);
      const barrier = new Promise<void>((resolve) => {
        const listener = (message: { content: string }) => {
          if (message.content === 'Activity barrier') {
            socket.off('new-message', listener);
            resolve();
          }
        };
        socket.on('new-message', listener);
      });
      await f.api
        .post(`/api/rooms/${id}/messages`)
        .set('Cookie', f.cookies[0])
        .send({ content: 'Activity barrier' })
        .expect(201);
      await barrier;
      expect(notices.map((message) => message.systemEvent)).toEqual([
        'joined',
        'left',
        'joined',
        'role',
        'renamed',
        'permissions',
        'removed',
        'joined',
        'permissions',
      ]);
      expect(
        await f.messages.countDocuments({
          roomId: new Types.ObjectId(id),
          kind: 'system',
        }),
      ).toBe(notices.length);
      const history = await f.api
        .get(`/api/rooms/${id}/messages/page`)
        .set('Cookie', f.cookies[0])
        .expect(200);
      expect(
        (history.body as { items: { kind?: string }[] }).items.filter(
          (message) => message.kind === 'system',
        ),
      ).toHaveLength(notices.length);
    } finally {
      socket.disconnect();
    }
    await f.messages.deleteMany({ roomId: new Types.ObjectId(id) });
    await f.rooms.deleteOne({ _id: new Types.ObjectId(id) });
  }, 60000);
});
