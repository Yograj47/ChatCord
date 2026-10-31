import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';
import { WsException } from '@nestjs/websockets';
import { SocketSessionGuard } from './socket-session.guard';
import { SocketAuthService } from './socket-auth.service';
import { SessionType } from '../auth/schemas/session.schema';

describe('SocketSessionGuard', () => {
  const auth = { authenticate: jest.fn() };
  const context = {
    switchToWs: () => ({ getClient: () => ({}) }),
  } as unknown as ExecutionContext;
  const guard = new SocketSessionGuard(auth as unknown as SocketAuthService);
  beforeEach(() => jest.resetAllMocks());
  it('revalidates the session for every event', async () => {
    auth.authenticate.mockResolvedValue({
      type: SessionType.REGISTERED,
      userId: new Types.ObjectId(),
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.authenticate).toHaveBeenCalledTimes(2);
  });
  it('rejects revoked sessions and guests', async () => {
    auth.authenticate.mockRejectedValueOnce(new Error('Expired'));
    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    auth.authenticate.mockResolvedValue({
      type: SessionType.GUEST,
      userId: null,
    });
    await expect(guard.canActivate(context)).rejects.toThrow(WsException);
  });
});
