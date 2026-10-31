import { ForbiddenException } from '@nestjs/common';
import { RoomsController } from '../../src/modules/rooms/rooms.controller';
import {
  createControllerApp,
  ControllerApp,
  ME,
  TARGET,
  ROOM,
  ID,
  Method,
  protectedRoutes,
} from '../helpers/controller-app';

const base = `/rooms/${ROOM}`;
const routes: {
  method: Method;
  path: string;
  handler: string;
  args: unknown[];
  body?: unknown;
  status: number;
}[] = [
  {
    method: 'post',
    path: '/rooms',
    handler: 'createRoom',
    args: [ME, { type: 'group', name: 'Studio' }],
    body: { type: 'group', name: 'Studio' },
    status: 201,
  },
  {
    method: 'get',
    path: '/rooms',
    handler: 'findAllForUser',
    args: [ME],
    status: 200,
  },
  {
    method: 'get',
    path: '/rooms/invitations',
    handler: 'invitations',
    args: [ME],
    status: 200,
  },
  {
    method: 'get',
    path: base,
    handler: 'findAccessible',
    args: [ROOM, ME],
    status: 200,
  },
  {
    method: 'patch',
    path: base,
    handler: 'updateRoom',
    body: { visibility: 'private' },
    args: [ROOM, ME, { visibility: 'private' }],
    status: 200,
  },
  {
    method: 'delete',
    path: base,
    handler: 'deleteRoom',
    args: [ROOM, ME],
    status: 200,
  },
  {
    method: 'post',
    path: `${base}/join`,
    handler: 'joinRoom',
    args: [ROOM, ME],
    status: 201,
  },
  {
    method: 'post',
    path: `${base}/leave`,
    handler: 'leaveRoom',
    args: [ROOM, ME],
    status: 201,
  },
  {
    method: 'post',
    path: `${base}/members`,
    handler: 'addMember',
    body: { userId: TARGET },
    args: [ROOM, ME, TARGET],
    status: 201,
  },
  {
    method: 'get',
    path: `${base}/members`,
    handler: 'members',
    args: [ROOM, ME],
    status: 200,
  },
  {
    method: 'delete',
    path: `${base}/members/${TARGET}`,
    handler: 'removeMember',
    args: [ROOM, ME, TARGET],
    status: 200,
  },
  {
    method: 'patch',
    path: `${base}/members/${TARGET}`,
    handler: 'updateMemberRole',
    body: { role: 'moderator' },
    args: [ROOM, ME, TARGET, 'moderator'],
    status: 200,
  },
  {
    method: 'post',
    path: `${base}/invitations/${ID}/accept`,
    handler: 'acceptInvitation',
    args: [ROOM, ID, ME],
    status: 201,
  },
  {
    method: 'delete',
    path: `${base}/invitations/${ID}`,
    handler: 'declineInvitation',
    args: [ROOM, ID, ME],
    status: 200,
  },
];

describe('RoomsController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(RoomsController);
  });
  afterAll(async () => {
    await f.app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  protectedRoutes(
    () => f,
    routes.map(({ method, path }) => [method, path]),
  );
  it.each(routes)(
    '$method $path delegates validated data and the session user',
    async (route) => {
      f.services.rooms[route.handler].mockResolvedValue({ success: true });
      await f
        .call(route.method, route.path, route.body)
        .expect(route.status)
        .expect({ success: true });
      expect(f.services.rooms[route.handler]).toHaveBeenCalledWith(
        ...route.args,
      );
    },
  );
  it.each([
    ['post', '/rooms', { type: 'bad' }],
    ['post', '/rooms', { type: 'group', createdBy: TARGET }],
    ['patch', base, { visibility: 'bad' }],
    ['post', `${base}/members`, { userId: 'bad' }],
    ['patch', `${base}/members/${TARGET}`, { role: 'owner' }],
    ['patch', `${base}/members/bad`, { role: 'member' }],
    ['post', `${base}/invitations/bad/accept`, {}],
    ['delete', `${base}/invitations/bad`, undefined],
  ] as const)('rejects invalid %s %s input', async (method, path, body) => {
    await f.call(method, path, body).expect(400);
    for (const mock of Object.values(f.services.rooms))
      expect(mock).not.toHaveBeenCalled();
  });
  it('passes supported room slugs to the service', async () => {
    f.services.rooms.findAccessible.mockResolvedValue({ _id: ROOM });
    await f.call('get', '/rooms/studio').expect(200);
    expect(f.services.rooms.findAccessible).toHaveBeenCalledWith('studio', ME);
  });
  it('preserves service authorization errors', async () => {
    f.services.rooms.updateRoom.mockRejectedValueOnce(
      new ForbiddenException('Owner or moderator required.'),
    );
    const response = await f
      .call('patch', base, { name: 'New name' })
      .expect(403);
    expect(response.body).toMatchObject({
      message: 'Owner or moderator required.',
    });
  });
});
