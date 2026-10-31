import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../src/modules/auth/auth.controller';
import {
  createControllerApp,
  ControllerApp,
  ME,
  ID,
  protectedRoutes,
} from '../helpers/controller-app';

describe('AuthController HTTP', () => {
  let f: ControllerApp;
  beforeAll(async () => {
    f = await createControllerApp(AuthController);
  });
  afterAll(async () => {
    await f.app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    f.providerIdentity.user = { _id: ME };
  });
  protectedRoutes(() => f, [['get', '/auth/users/search?q=al']]);

  it.each([
    ['get', '/auth/me'],
    ['post', '/auth/logout'],
    ['post', '/auth/onboarding'],
  ] as const)('requires a valid session on %s %s', async (method, path) => {
    await f.call(method, path, undefined, null).expect(401);
    await f.call(method, path, undefined, 'expired').expect(401);
  });
  it('returns the registered profile and onboarding requirement', async () => {
    f.services.users.findById.mockResolvedValue({
      _id: ME,
      displayName: 'Alex',
    });
    const response = await f.call('get', '/auth/me').expect(200);
    expect(response.body).toMatchObject({
      id: ME,
      type: 'registered',
      requiresOnboarding: true,
      user: { displayName: 'Alex' },
    });
    expect(f.services.users.findById).toHaveBeenCalledWith(ME);
  });
  it('recognizes completed onboarding', async () => {
    f.services.users.findById.mockResolvedValue({ _id: ME, username: 'alex' });
    const response = await f.call('get', '/auth/me').expect(200);
    expect(response.body).toHaveProperty('requiresOnboarding', false);
  });
  it('returns guest session data without reading a registered profile', async () => {
    const response = await f
      .call('get', '/auth/me', undefined, 'guest')
      .expect(200);
    expect(response.body).toEqual({
      sessionId: ID,
      type: 'guest',
      requiresOnboarding: false,
    });
    expect(f.services.users.findById).not.toHaveBeenCalled();
  });
  it('normalizes onboarding and uses the session user', async () => {
    f.services.users.completeOnboarding.mockResolvedValue({
      username: 'alex_1',
    });
    await f
      .call('post', '/auth/onboarding', {
        username: ' Alex_1 ',
        displayName: ' Alex ',
      })
      .expect(201)
      .expect({ username: 'alex_1' });
    expect(f.services.users.completeOnboarding).toHaveBeenCalledWith(
      ME,
      'alex_1',
      'Alex',
    );
  });
  it('rejects guest onboarding', async () => {
    await f
      .call('post', '/auth/onboarding', { username: 'alex' }, 'guest')
      .expect(401);
    expect(f.services.users.completeOnboarding).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { username: 'a' },
    { username: 'bad name' },
    { username: 'alex', userId: ME },
  ])('rejects invalid onboarding %j', async (body) => {
    await f.call('post', '/auth/onboarding', body).expect(400);
    expect(f.services.users.completeOnboarding).not.toHaveBeenCalled();
  });
  it('normalizes username search and excludes the caller via its service arguments', async () => {
    f.services.users.searchByUsername.mockResolvedValue([
      { id: ME, username: 'alex' },
    ]);
    await f.call('get', '/auth/users/search?q=%20AL%20').expect(200);
    expect(f.services.users.searchByUsername).toHaveBeenCalledWith('al', ME);
  });
  it.each([
    '/auth/users/search',
    '/auth/users/search?q=a',
    '/auth/users/search?q=bad%20name',
    '/auth/users/search?q=alex&userId=bad',
  ])('rejects invalid search %s', async (path) => {
    await f.call('get', path).expect(400);
    expect(f.services.users.searchByUsername).not.toHaveBeenCalled();
  });
  it('creates a guest session and sets an HTTP-only cookie', async () => {
    f.services.auth.createGuestSession.mockResolvedValue({
      token: 'fixture-token',
    });
    const response = await f
      .call('post', '/auth/guest', undefined, null)
      .expect(201);
    expect(response.body).toEqual({ message: 'Guest session created.' });
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('HttpOnly')]),
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('SameSite=Lax')]),
    );
    expect(f.services.auth.createGuestSession).toHaveBeenCalledTimes(1);
  });
  it('delegates Google credential verification and creates a registered session', async () => {
    f.services.auth.googleLogin.mockResolvedValue({
      _id: ME,
      displayName: 'Alex',
    });
    f.services.auth.createUserSession.mockResolvedValue({
      token: 'fixture-token',
    });
    const response = await f
      .call('post', '/auth/google', { credential: 'fixture-credential' }, null)
      .expect(201);
    expect(f.services.auth.googleLogin).toHaveBeenCalledWith(
      'fixture-credential',
    );
    expect(f.services.auth.createUserSession).toHaveBeenCalledWith(
      ME,
      expect.any(String),
      undefined,
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('HttpOnly')]),
    );
  });
  it.each([
    {},
    { credential: 5 },
    { credential: '' },
    { credential: 'token', userId: ME },
  ])('rejects invalid Google input %j', async (body) => {
    await f.call('post', '/auth/google', body, null).expect(400);
    expect(f.services.auth.googleLogin).not.toHaveBeenCalled();
  });
  it('preserves provider authentication failures', async () => {
    f.services.auth.googleLogin.mockRejectedValueOnce(
      new UnauthorizedException('Invalid Google credential.'),
    );
    await f
      .call('post', '/auth/google', { credential: 'bad' }, null)
      .expect(401);
    expect(f.services.auth.createUserSession).not.toHaveBeenCalled();
  });
  it('sets the callback session cookie and redirects to the configured client', async () => {
    f.services.auth.createUserSession.mockResolvedValue({
      token: 'fixture-token',
    });
    await f
      .call('get', '/auth/google/callback', undefined, null)
      .expect(302)
      .expect('Location', 'http://client.test');
    expect(f.services.auth.createUserSession).toHaveBeenCalledWith(
      ME,
      expect.any(String),
      undefined,
    );
  });
  it('redirects a callback without a provider identity to the failure page', async () => {
    f.providerIdentity.user = undefined;
    await f
      .call('get', '/auth/google/callback', undefined, null)
      .expect(302)
      .expect('Location', '/login?error=auth_failed');
    expect(f.services.auth.createUserSession).not.toHaveBeenCalled();
  });
  it('logs out the cookie token and clears the cookie', async () => {
    const response = await f.call('post', '/auth/logout').expect(201);
    expect(f.services.auth.logout).toHaveBeenCalledWith('registered');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('Expires=')]),
    );
  });

  it('marks session cookies Secure in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      f.services.auth.createGuestSession.mockResolvedValue({
        token: 'fixture-token',
      });
      const response = await f
        .call('post', '/auth/guest', undefined, null)
        .expect(201);
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('; Secure')]),
      );
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  });

  it('exposes the Google login entry without creating a session before the callback', async () => {
    await f.call('get', '/auth/google', undefined, null).expect(200).expect('');
    expect(f.services.auth.createUserSession).not.toHaveBeenCalled();
  });
});
