import { ValidationPipe } from '@nestjs/common';
import { GatewayGateway } from './gateway.gateway';
import { PresenceSyncDto } from './dto/room-event.dto';

describe('Presence and typing gateway', () => {
  const userId = '000000000000000000000001';
  const peer = '000000000000000000000002';
  const roomId = '000000000000000000000003';
  const rooms = {
    presencePeers: jest.fn(),
    findMembership: jest.fn(),
    findById: jest.fn(),
    assertCanSend: jest.fn(),
  };
  const redis = {
    addPresence: jest.fn(),
    removePresence: jest.fn(),
    getPresence: jest.fn(),
    setTyping: jest.fn(),
    clearTyping: jest.fn(),
    isTyping: jest.fn(),
    getTyping: jest.fn(),
  };
  const emit = jest.fn();
  const namespace = { use: jest.fn(), to: jest.fn().mockReturnValue({ emit }) };
  const rate = { check: jest.fn() };
  let gateway: GatewayGateway;
  const client = () => ({
    id: 'tab-one',
    connected: true,
    data: { userId, typingRooms: new Set<string>() },
    rooms: new Set([roomId]),
    to: jest.fn().mockReturnValue({ emit }),
    join: jest.fn(),
    leave: jest.fn(),
    broadcast: { emit },
    emit,
    disconnect: jest.fn(),
  });
  type Client = Parameters<GatewayGateway['handleTypingStart']>[0];

  beforeEach(() => {
    jest.clearAllMocks();
    rooms.presencePeers.mockResolvedValue([userId, peer]);
    rooms.findMembership.mockResolvedValue('member');
    rooms.findById.mockResolvedValue({
      capabilities: ['text'],
      members: [{ userId }, { userId: peer }],
    });
    rooms.assertCanSend.mockResolvedValue(undefined);
    redis.addPresence.mockResolvedValue(1);
    redis.getPresence.mockResolvedValue(['tab']);
    redis.removePresence.mockResolvedValue(1);
    redis.isTyping.mockResolvedValue(false);
    rate.check.mockResolvedValue(true);
    type Args = ConstructorParameters<typeof GatewayGateway>;
    gateway = new GatewayGateway(
      {} as Args[0],
      rooms as unknown as Args[1],
      {} as Args[2],
      redis as unknown as Args[3],
      rate as unknown as Args[4],
      { bind: jest.fn() } as unknown as Args[5],
      { bind: jest.fn() } as unknown as Args[6],
    );
    gateway.afterInit(
      namespace as unknown as Parameters<GatewayGateway['afterInit']>[0],
    );
  });

  it('omits unrelated identities from presence snapshots', async () => {
    const response = await gateway.syncPresence(client() as unknown as Client, {
      userIds: [peer, roomId],
    });
    expect(response.users).toEqual([{ userId: peer, online: true }]);
    expect(redis.getPresence).toHaveBeenCalledTimes(1);
  });

  it('does not broadcast offline when another tab remains', async () => {
    await gateway.handleDisconnect(client() as unknown as Client);
    expect(emit).not.toHaveBeenCalledWith('user-offline', expect.anything());
    redis.removePresence.mockResolvedValue(0);
    redis.getPresence.mockResolvedValue([]);
    await gateway.handleDisconnect(client() as unknown as Client);
    expect(namespace.to).toHaveBeenCalledWith([
      `user:${userId}`,
      `user:${peer}`,
    ]);
    expect(emit).toHaveBeenCalledWith('user-offline', { userId });
  });

  it('rejects typing outside a subscribed room or when text is disabled', async () => {
    const socket = client();
    socket.rooms.clear();
    await expect(
      gateway.handleTypingStart(socket as unknown as Client, { roomId }),
    ).rejects.toThrow('Join the room first');
    socket.rooms.add(roomId);
    rooms.findById.mockResolvedValue({ capabilities: [] });
    await expect(
      gateway.handleTypingStart(socket as unknown as Client, { roomId }),
    ).rejects.toThrow('Text messages are disabled');
    expect(redis.setTyping).not.toHaveBeenCalled();
  });

  it('does not send a stale offline event after the user reconnects', async () => {
    redis.removePresence.mockResolvedValue(0);
    redis.getPresence.mockResolvedValue(['reconnected-tab']);
    await gateway.handleDisconnect(client() as unknown as Client);
    expect(emit).not.toHaveBeenCalledWith('user-offline', expect.anything());
  });

  it('stops only this socket typing and preserves another tab', async () => {
    const socket = client();
    await gateway.handleTypingStart(socket as unknown as Client, { roomId });
    expect(redis.setTyping).toHaveBeenCalledWith(roomId, userId, 'tab-one');
    emit.mockClear();
    redis.isTyping.mockResolvedValue(true);
    await gateway.handleTypingStop(socket as unknown as Client, { roomId });
    expect(redis.clearTyping).toHaveBeenCalledWith(roomId, userId, 'tab-one');
    expect(emit).not.toHaveBeenCalledWith(
      'user-stopped-typing',
      expect.anything(),
    );
  });

  it('clears typing when a socket disconnects', async () => {
    const socket = client();
    socket.data.typingRooms.add(roomId);
    await gateway.handleDisconnect(socket as unknown as Client);
    expect(redis.clearTyping).toHaveBeenCalledWith(roomId, userId, socket.id);
    expect(emit).toHaveBeenCalledWith('user-stopped-typing', {
      roomId,
      userId,
    });
  });

  it('validates snapshot bounds and prevents spoofed user identities', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    for (const body of [
      { userIds: [peer], userId: peer },
      { userIds: ['bad'] },
      { userIds: Array(101).fill(peer) },
      { userIds: peer },
    ]) {
      await expect(
        pipe.transform(body, { type: 'body', metatype: PresenceSyncDto }),
      ).rejects.toThrow();
    }
    await expect(
      pipe.transform(
        { userIds: [peer] },
        { type: 'body', metatype: PresenceSyncDto },
      ),
    ).resolves.toEqual({ userIds: [peer] });
  });
});
