import {
  INestApplication,
  Type,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { Request } from 'express';
import type { Server } from 'node:http';
import { AppService } from '../../src/app.service';
import { AUTH_COOKIE } from '../../src/common/constants/auth.constants';
import { AuthService } from '../../src/modules/auth/auth.service';
import { GoogleAuthGuard } from '../../src/modules/auth/guards/google-auth.guard';
import { SessionService } from '../../src/modules/auth/session.service';
import { UsersService } from '../../src/modules/users/users.service';
import { RoomsService } from '../../src/modules/rooms/rooms.service';
import { MessagesService } from '../../src/modules/messages/messages.service';
import { FriendshipsService } from '../../src/modules/friendships/friendships.service';

export const ME = '000000000000000000000001';
export const TARGET = '000000000000000000000002';
export const ROOM = '000000000000000000000003';
export const ID = '000000000000000000000004';
export type Method = 'get' | 'post' | 'patch' | 'delete';
export type Route = readonly [Method, string];
const mockMethods = (...names: string[]) =>
  Object.fromEntries(names.map((name) => [name, jest.fn()]));

export async function createControllerApp(controller: Type<unknown>) {
  const services = {
    app: mockMethods('getHello'),
    auth: mockMethods(
      'googleLogin',
      'createUserSession',
      'createGuestSession',
      'logout',
    ),
    users: mockMethods('findById', 'completeOnboarding', 'searchByUsername'),
    rooms: mockMethods(
      'createRoom',
      'findAllForUser',
      'findAccessible',
      'updateRoom',
      'deleteRoom',
      'joinRoom',
      'leaveRoom',
      'addMember',
      'removeMember',
      'updateMemberRole',
      'members',
      'invitations',
      'acceptInvitation',
      'declineInvitation',
      'listDms',
      'createDm',
    ),
    messages: mockMethods(
      'createMessage',
      'findAllForRoom',
      'page',
      'getMessage',
      'updateMessage',
      'deleteMessage',
      'react',
    ),
    friendships: mockMethods(
      'send',
      'requests',
      'friends',
      'accept',
      'dismiss',
      'remove',
    ),
  };
  const session = {
    validateSession: jest.fn((token: string) => {
      if (!['registered', 'guest'].includes(token))
        throw new UnauthorizedException('Invalid or expired session.');
      return {
        _id: ID,
        type: token,
        userId: token === 'registered' ? ME : undefined,
      };
    }),
  };
  const providerIdentity: { user: unknown } = { user: { _id: ME } };
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      { provide: AppService, useValue: services.app },
      { provide: AuthService, useValue: services.auth },
      { provide: UsersService, useValue: services.users },
      { provide: RoomsService, useValue: services.rooms },
      { provide: MessagesService, useValue: services.messages },
      { provide: FriendshipsService, useValue: services.friendships },
      { provide: SessionService, useValue: session },
      {
        provide: ConfigService,
        useValue: { getOrThrow: () => 'http://client.test' },
      },
    ],
  })
    .overrideGuard(GoogleAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => { getRequest: () => Request };
      }) => {
        context.switchToHttp().getRequest().user =
          providerIdentity.user as Request['user'];
        return true;
      },
    })
    .compile();
  const app: INestApplication = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  const call = (
    method: Method,
    path: string,
    body?: unknown,
    token: string | null = 'registered',
  ) => {
    const pending = request(app.getHttpServer() as Server)[method](
      `/api${path}`,
    );
    if (token) pending.set('Cookie', `${AUTH_COOKIE}=${token}`);
    if (body !== undefined && body !== null) pending.send(body);
    return pending;
  };
  return { app, services, session, providerIdentity, call };
}

export type ControllerApp = Awaited<ReturnType<typeof createControllerApp>>;

// These exercise guards through controller routes, not guard/service implementations in isolation.
export function protectedRoutes(
  fixture: () => ControllerApp,
  routes: readonly Route[],
  guestStatus = 403,
) {
  it.each(routes)(
    'protects %s %s from missing, expired and guest sessions',
    async (method, path) => {
      const f = fixture();
      await f.call(method, path, undefined, null).expect(401);
      await f.call(method, path, undefined, 'expired').expect(401);
      await f.call(method, path, undefined, 'guest').expect(guestStatus);
      for (const methods of Object.values(f.services))
        for (const mock of Object.values(methods))
          expect(mock).not.toHaveBeenCalled();
    },
  );
}
