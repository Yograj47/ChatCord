import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { FriendshipsService } from './friendships.service';
import {
  FriendshipDocument,
  FriendshipStatus,
} from './schemas/friendship.schema';
import { UsersService } from '../users/users.service';
import { UserType } from '../users/schemas/user.schema';

describe('FriendshipsService', () => {
  const sender = '000000000000000000000001';
  const recipient = '000000000000000000000002';
  const requestId = '000000000000000000000003';
  const exec = jest.fn();
  const model = {
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  const users = { findById: jest.fn() };
  let service: FriendshipsService;

  beforeEach(() => {
    jest.resetAllMocks();
    model.findOneAndUpdate.mockReturnValue({ exec });
    model.findOneAndDelete.mockReturnValue({ exec });
    users.findById.mockResolvedValue({ type: UserType.REGISTERED });
    service = new FriendshipsService(
      model as unknown as Model<FriendshipDocument>,
      users as unknown as UsersService,
    );
  });

  it('rejects self requests and malformed IDs before querying users', async () => {
    await expect(service.send(sender, sender)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.send(sender, 'invalid')).rejects.toThrow(
      BadRequestException,
    );
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('rejects guests and missing recipients', async () => {
    for (const target of [null, { type: UserType.GUEST }]) {
      users.findById.mockResolvedValue(target);
      await expect(service.send(sender, recipient)).rejects.toThrow(
        NotFoundException,
      );
    }
    expect(model.create).not.toHaveBeenCalled();
  });

  it('uses the same unique pair key in either direction', async () => {
    model.create.mockResolvedValue({
      _id: requestId,
      status: FriendshipStatus.PENDING,
    });
    await service.send(sender, recipient);
    await service.send(recipient, sender);
    const expectedPair: unknown = expect.objectContaining({
      pairKey: `${sender}:${recipient}`,
    });
    expect(model.create).toHaveBeenNthCalledWith(1, expectedPair);
    expect(model.create).toHaveBeenNthCalledWith(2, expectedPair);
  });

  it('translates concurrent duplicate requests into a conflict', async () => {
    model.create.mockRejectedValue({ code: 11000 });
    await expect(service.send(sender, recipient)).rejects.toThrow(
      ConflictException,
    );
  });

  it('accepts only an incoming pending request in one atomic update', async () => {
    exec.mockResolvedValue({
      _id: requestId,
      status: FriendshipStatus.ACCEPTED,
    });
    await expect(service.accept(recipient, requestId)).resolves.toEqual({
      id: requestId,
      status: 'accepted',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(requestId),
        recipient: new Types.ObjectId(recipient),
        status: 'pending',
      },
      { $set: { status: 'accepted' } },
      { new: true },
    );
    exec.mockResolvedValue(null);
    await expect(service.accept(sender, requestId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each(['decline', 'cancel'] as const)(
    'restricts %s to the correct participant and pending status',
    async (action) => {
      exec.mockResolvedValue({ _id: requestId });
      await service.dismiss(sender, requestId, action);
      expect(model.findOneAndDelete).toHaveBeenCalledWith({
        _id: new Types.ObjectId(requestId),
        status: 'pending',
        [action === 'decline' ? 'recipient' : 'requester']: new Types.ObjectId(
          sender,
        ),
      });
      exec.mockResolvedValue(null);
      await expect(service.dismiss(sender, requestId, action)).rejects.toThrow(
        NotFoundException,
      );
    },
  );

  it('removes only accepted friendships belonging to the caller', async () => {
    exec.mockResolvedValue({ _id: requestId });
    await service.remove(sender, requestId);
    expect(model.findOneAndDelete).toHaveBeenCalledWith({
      _id: new Types.ObjectId(requestId),
      status: 'accepted',
      $or: [
        { requester: new Types.ObjectId(sender) },
        { recipient: new Types.ObjectId(sender) },
      ],
    });
  });

  it('lists only pending requests involving the caller', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };
    model.find.mockReturnValue(chain);
    exec.mockResolvedValue([]);
    await expect(service.requests(sender)).resolves.toEqual([]);
    expect(model.find).toHaveBeenCalledWith({
      status: 'pending',
      $or: [
        { requester: new Types.ObjectId(sender) },
        { recipient: new Types.ObjectId(sender) },
      ],
    });
    expect(chain.populate).toHaveBeenCalledWith(
      'requester recipient',
      '_id username displayName avatar',
    );
  });

  it('returns the other user for either friendship direction and omits deleted users', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec,
    };
    model.find.mockReturnValue(chain);
    const me = { _id: new Types.ObjectId(sender) };
    const other = { _id: new Types.ObjectId(recipient), username: 'friend' };
    exec.mockResolvedValue([
      { _id: requestId, requester: me, recipient: other },
      { _id: requestId, requester: other, recipient: me },
      { _id: requestId, requester: me, recipient: null },
    ]);
    await expect(service.friends(sender)).resolves.toEqual([
      { id: requestId, user: other },
      { id: requestId, user: other },
    ]);
    expect(model.find).toHaveBeenCalledWith({
      status: 'accepted',
      $or: [
        { requester: new Types.ObjectId(sender) },
        { recipient: new Types.ObjectId(sender) },
      ],
    });
  });
});
