import { NotFoundException } from '@nestjs/common';
import { FriendshipsController } from '../../src/modules/friendships/friendships.controller';
import {
  createControllerApp,
  ControllerApp,
  ME,
  TARGET,
  ID,
  Method,
  protectedRoutes,
} from '../helpers/controller-app';

const routes: {
  method: Method;
  path: string;
  handler: string;
  args: unknown[];
  body?: unknown;
  status: number;
}[] = [
  {
    method: 'get',
    path: '/friendships',
    handler: 'friends',
    args: [ME],
    status: 200,
  },
  {
    method: 'get',
    path: '/friendships/requests',
    handler: 'requests',
    args: [ME],
    status: 200,
  },
  {
    method: 'post',
    path: '/friendships/requests',
    handler: 'send',
    body: { recipientId: TARGET },
    args: [ME, TARGET],
    status: 201,
  },
  {
    method: 'patch',
    path: `/friendships/requests/${ID}/accept`,
    handler: 'accept',
    args: [ME, ID],
    status: 200,
  },
  {
    method: 'delete',
    path: `/friendships/requests/${ID}/decline`,
    handler: 'dismiss',
    args: [ME, ID, 'decline'],
    status: 200,
  },
  {
    method: 'delete',
    path: `/friendships/requests/${ID}/cancel`,
    handler: 'dismiss',
    args: [ME, ID, 'cancel'],
    status: 200,
  },
  {
    method: 'delete',
    path: `/friendships/${ID}`,
    handler: 'remove',
    args: [ME, ID],
    status: 200,
  },
];

describe('FriendshipsController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(FriendshipsController);
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
    '$method $path delegates the session identity and returns the service result',
    async (route) => {
      f.services.friendships[route.handler].mockResolvedValue({
        success: true,
      });
      await f
        .call(route.method, route.path, route.body)
        .expect(route.status)
        .expect({ success: true });
      expect(f.services.friendships[route.handler]).toHaveBeenCalledWith(
        ...route.args,
      );
    },
  );
  it.each([
    {},
    { recipientId: 'bad' },
    { recipientId: TARGET, userId: TARGET },
  ])('rejects invalid/spoofed friend requests %j', async (body) => {
    await f.call('post', '/friendships/requests', body).expect(400);
    expect(f.services.friendships.send).not.toHaveBeenCalled();
  });
  it('preserves a missing incoming request error', async () => {
    f.services.friendships.accept.mockRejectedValueOnce(
      new NotFoundException('Incoming pending request not found.'),
    );
    await f.call('patch', `/friendships/requests/${ID}/accept`).expect(404);
  });
});
