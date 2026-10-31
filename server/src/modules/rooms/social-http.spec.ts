import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { Server } from 'node:http';
import { AUTH_COOKIE } from '../../common/constants/auth.constants';
import { SessionService } from '../auth/session.service';
import { FriendshipsController } from '../friendships/friendships.controller';
import { FriendshipsService } from '../friendships/friendships.service';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

describe('Social HTTP authorization and validation', () => {
  let app: INestApplication;
  const me = '000000000000000000000001';
  const target = '000000000000000000000002';
  const id = '000000000000000000000003';
  const friendships = Object.fromEntries(
    ['send', 'requests', 'friends', 'accept', 'dismiss', 'remove'].map(
      (name) => [name, jest.fn().mockResolvedValue({ success: true })],
    ),
  );
  const rooms = Object.fromEntries(
    ['invitations', 'addMember', 'acceptInvitation', 'declineInvitation'].map(
      (name) => [name, jest.fn().mockResolvedValue({ success: true })],
    ),
  );
  const routes = [
    ['get', '/friendships'],
    ['get', '/friendships/requests'],
    ['post', '/friendships/requests'],
    ['patch', `/friendships/requests/${id}/accept`],
    ['delete', `/friendships/requests/${id}/cancel`],
    ['delete', `/friendships/requests/${id}/decline`],
    ['delete', `/friendships/${id}`],
    ['get', '/rooms/invitations'],
    ['post', '/rooms/studio/members'],
    ['post', `/rooms/studio/invitations/${id}/accept`],
    ['delete', `/rooms/studio/invitations/${id}`],
  ] as const;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FriendshipsController, RoomsController],
      providers: [
        { provide: FriendshipsService, useValue: friendships },
        { provide: RoomsService, useValue: rooms },
        {
          provide: SessionService,
          useValue: {
            validateSession: (token: string) => {
              if (!['registered', 'guest'].includes(token))
                throw new UnauthorizedException();
              return {
                _id: id,
                type: token,
                userId: token === 'registered' ? me : undefined,
              };
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  it.each(routes)(
    'protects %s %s from missing, revoked and guest sessions',
    async (method, path) => {
      const api = request(app.getHttpServer() as Server);
      await api[method](path).expect(401);
      await api[method](path)
        .set('Cookie', `${AUTH_COOKIE}=revoked`)
        .expect(401);
      await api[method](path).set('Cookie', `${AUTH_COOKIE}=guest`).expect(403);
      for (const handler of [
        ...Object.values(friendships),
        ...Object.values(rooms),
      ])
        expect(handler).not.toHaveBeenCalled();
    },
  );

  it('uses the authenticated identity for friendship mutations', async () => {
    const api = request(app.getHttpServer() as Server);
    const cookie = `${AUTH_COOKIE}=registered`;
    await api
      .post('/friendships/requests')
      .set('Cookie', cookie)
      .send({ recipientId: target })
      .expect(201);
    expect(friendships.send).toHaveBeenCalledWith(me, target);
    await api
      .patch(`/friendships/requests/${id}/accept`)
      .set('Cookie', cookie)
      .expect(200);
    expect(friendships.accept).toHaveBeenCalledWith(me, id);
    for (const action of ['decline', 'cancel']) {
      await api
        .delete(`/friendships/requests/${id}/${action}`)
        .set('Cookie', cookie)
        .expect(200);
      expect(friendships.dismiss).toHaveBeenCalledWith(me, id, action);
    }
    await api.delete(`/friendships/${id}`).set('Cookie', cookie).expect(200);
    expect(friendships.remove).toHaveBeenCalledWith(me, id);
  });

  it('rejects malformed and identity-spoofing request bodies before service calls', async () => {
    const api = request(app.getHttpServer() as Server);
    for (const body of [
      {},
      { recipientId: 'invalid' },
      { recipientId: target, userId: target },
    ]) {
      await api
        .post('/friendships/requests')
        .set('Cookie', `${AUTH_COOKIE}=registered`)
        .send(body)
        .expect(400);
    }
    for (const body of [
      {},
      { userId: 'invalid' },
      { userId: target, role: 'owner' },
    ]) {
      await api
        .post('/rooms/studio/members')
        .set('Cookie', `${AUTH_COOKIE}=registered`)
        .send(body)
        .expect(400);
    }
    expect(friendships.send).not.toHaveBeenCalled();
    expect(rooms.addMember).not.toHaveBeenCalled();
  });

  it('routes invitations using the authenticated recipient and validates invitation IDs', async () => {
    const api = request(app.getHttpServer() as Server);
    const cookie = `${AUTH_COOKIE}=registered`;
    await api.get('/rooms/invitations').set('Cookie', cookie).expect(200);
    expect(rooms.invitations).toHaveBeenCalledWith(me);
    await api
      .post('/rooms/studio/members')
      .set('Cookie', cookie)
      .send({ userId: target })
      .expect(201);
    expect(rooms.addMember).toHaveBeenCalledWith('studio', me, target);
    await api
      .post(`/rooms/studio/invitations/${id}/accept`)
      .set('Cookie', cookie)
      .expect(201);
    expect(rooms.acceptInvitation).toHaveBeenCalledWith('studio', id, me);
    await api
      .delete(`/rooms/studio/invitations/${id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(rooms.declineInvitation).toHaveBeenCalledWith('studio', id, me);
    jest.clearAllMocks();
    await api
      .post('/rooms/studio/invitations/invalid/accept')
      .set('Cookie', cookie)
      .expect(400);
    await api
      .delete('/rooms/studio/invitations/invalid')
      .set('Cookie', cookie)
      .expect(400);
    expect(rooms.acceptInvitation).not.toHaveBeenCalled();
    expect(rooms.declineInvitation).not.toHaveBeenCalled();
  });
});
