import { ConflictException } from '@nestjs/common';
import { DmsController } from '../../src/modules/rooms/dms.controller';
import {
  createControllerApp,
  ControllerApp,
  ME,
  TARGET,
  ROOM,
  protectedRoutes,
} from '../helpers/controller-app';

describe('DmsController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(DmsController);
  });
  afterAll(async () => {
    await f.app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  protectedRoutes(
    () => f,
    [
      ['get', '/dms'],
      ['post', '/dms'],
    ],
  );

  it('lists conversations for the session user', async () => {
    f.services.rooms.listDms.mockResolvedValue([{ _id: ROOM }]);
    await f
      .call('get', '/dms')
      .expect(200)
      .expect([{ _id: ROOM }]);
    expect(f.services.rooms.listDms).toHaveBeenCalledWith(ME);
  });
  it('delegates create-or-find using the session identity and validated target', async () => {
    f.services.rooms.createDm.mockResolvedValue({ _id: ROOM });
    await f
      .call('post', '/dms', { userId: TARGET })
      .expect(201)
      .expect({ _id: ROOM });
    expect(f.services.rooms.createDm).toHaveBeenCalledWith(ME, TARGET);
  });
  it.each([{}, { userId: 'bad' }, { userId: TARGET, senderId: TARGET }])(
    'rejects invalid or spoofed input %j',
    async (body) => {
      await f.call('post', '/dms', body).expect(400);
      expect(f.services.rooms.createDm).not.toHaveBeenCalled();
    },
  );
  it('preserves a domain conflict response', async () => {
    f.services.rooms.createDm.mockRejectedValueOnce(
      new ConflictException('Friendship required.'),
    );
    const response = await f
      .call('post', '/dms', { userId: TARGET })
      .expect(409);
    expect(response.body).toMatchObject({ message: 'Friendship required.' });
  });
});
