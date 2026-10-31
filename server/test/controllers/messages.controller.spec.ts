import { NotFoundException } from '@nestjs/common';
import { MessagesController } from '../../src/modules/messages/messages.controller';
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

const base = `/rooms/${ROOM}/messages`;
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
    path: base,
    handler: 'findAllForRoom',
    args: [ROOM, ME],
    status: 200,
  },
  {
    method: 'get',
    path: `${base}/page?limit=10&q=hello&before=${ID}&replyTo=${TARGET}`,
    handler: 'page',
    args: [ROOM, ME, { limit: 10, q: 'hello', before: ID, replyTo: TARGET }],
    status: 200,
  },
  {
    method: 'post',
    path: base,
    handler: 'createMessage',
    body: { content: ' hello ', replyTo: TARGET },
    args: [ROOM, ME, { content: 'hello', replyTo: TARGET }],
    status: 201,
  },
  {
    method: 'get',
    path: `${base}/${ID}`,
    handler: 'getMessage',
    args: [ROOM, ID, ME],
    status: 200,
  },
  {
    method: 'patch',
    path: `${base}/${ID}`,
    handler: 'updateMessage',
    body: { content: ' edited ' },
    args: [ROOM, ID, ME, { content: 'edited' }],
    status: 200,
  },
  {
    method: 'delete',
    path: `${base}/${ID}`,
    handler: 'deleteMessage',
    args: [ROOM, ID, ME],
    status: 200,
  },
  {
    method: 'post',
    path: `${base}/${ID}/reactions`,
    handler: 'react',
    body: { emoji: '👍' },
    args: [ROOM, ID, ME, '👍', true],
    status: 201,
  },
  {
    method: 'delete',
    path: `${base}/${ID}/reactions`,
    handler: 'react',
    body: { emoji: '👍' },
    args: [ROOM, ID, ME, '👍', false],
    status: 200,
  },
];

describe('MessagesController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(MessagesController);
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
    '$method $path delegates validated data and the session identity',
    async (route) => {
      f.services.messages[route.handler].mockResolvedValue({ success: true });
      await f
        .call(route.method, route.path, route.body)
        .expect(route.status)
        .expect({ success: true });
      expect(f.services.messages[route.handler]).toHaveBeenCalledWith(
        ...route.args,
      );
    },
  );
  it.each([
    ['post', base, { content: ' ' }],
    ['post', base, { content: 'x'.repeat(4001) }],
    ['post', base, { content: 'hi', senderId: TARGET }],
    ['post', base, { content: 'hi', replyTo: 'bad' }],
    ['patch', `${base}/${ID}`, { content: ' ' }],
    ['post', `${base}/${ID}/reactions`, { emoji: 'bad' }],
    ['get', `${base}/page?limit=101`, undefined],
    ['get', `${base}/page?limit=0`, undefined],
    ['get', `${base}/page?before=bad`, undefined],
    ['get', `${base}/page?replyTo=bad`, undefined],
    ['get', `${base}/page?q=%20`, undefined],
    ['get', `${base}/page?userId=${TARGET}`, undefined],
    ['get', '/rooms/bad/messages', undefined],
    ['delete', `${base}/bad`, undefined],
  ] as const)('rejects invalid %s %s input', async (method, path, body) => {
    await f.call(method, path, body).expect(400);
    for (const mock of Object.values(f.services.messages))
      expect(mock).not.toHaveBeenCalled();
  });
  it('applies default pagination without confusing page with a message ID', async () => {
    f.services.messages.page.mockResolvedValue({ items: [], nextCursor: null });
    await f
      .call('get', `${base}/page`)
      .expect(200)
      .expect({ items: [], nextCursor: null });
    expect(f.services.messages.page).toHaveBeenCalledWith(
      ROOM,
      ME,
      expect.objectContaining({ limit: 30 }),
    );
    expect(f.services.messages.getMessage).not.toHaveBeenCalled();
  });
  it('returns an empty success body for deletion', async () => {
    f.services.messages.deleteMessage.mockResolvedValue(undefined);
    await f.call('delete', `${base}/${ID}`).expect(200).expect('');
  });
  it('preserves a missing-message response from the service', async () => {
    f.services.messages.getMessage.mockRejectedValueOnce(
      new NotFoundException('Message not found.'),
    );
    await f.call('get', `${base}/${ID}`).expect(404);
  });
});
