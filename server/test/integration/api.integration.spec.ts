import { FriendshipStatus } from '../../src/modules/friendships/schemas/friendship.schema';
import { Types } from 'mongoose';
import { RoomType } from '../../src/modules/rooms/schemas/room.schema';
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
    await f.api.get('/api/rooms').set('Cookie', cookie).expect(403);
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
});
