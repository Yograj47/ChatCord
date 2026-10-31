import { AppController } from '../../src/app.controller';
import { createControllerApp, ControllerApp } from '../helpers/controller-app';

describe('AppController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(AppController);
  });
  afterAll(async () => {
    await f.app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  it('returns the root service response without requiring a session', async () => {
    f.services.app.getHello.mockReturnValue('Hello World!');
    await f.call('get', '', undefined, null).expect(200).expect('Hello World!');
    expect(f.services.app.getHello).toHaveBeenCalledTimes(1);
    expect(f.session.validateSession).not.toHaveBeenCalled();
  });
});
