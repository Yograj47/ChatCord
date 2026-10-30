import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { RoomsService } from './rooms.service';
import {
  RoomDocument,
  RoomType,
  RoomVisibility,
  RoomMemberRole,
  RoomCapability,
} from './schemas/room.schema';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { UserType } from '../users/schemas/user.schema';
import { FriendshipsService } from '../friendships/friendships.service';
import { RoomEventsService } from './room-events.service';

describe('RoomsService', () => {
  const anyDate: unknown = expect.any(Date);
  const anyArray: unknown = expect.any(Array);
  const owner = new Types.ObjectId();
  const target = new Types.ObjectId();
  const outsider = new Types.ObjectId();
  const roomId = new Types.ObjectId();
  const model = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    updateOne: jest.fn(),
  };
  const redis = { getCache: jest.fn(), deleteCache: jest.fn() };
  const users = { findById: jest.fn(), publicProfiles: jest.fn() };
  const friendships = { assertFriends: jest.fn() };
  let service: RoomsService;
  let room: RoomDocument;
  const oid = owner.toHexString();
  const tid = target.toHexString();
  const rid = roomId.toHexString();
  const query = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    room = {
      _id: roomId,
      slug: 'general',
      name: 'General',
      type: RoomType.GROUP,
      visibility: RoomVisibility.PUBLIC,
      members: [
        { userId: owner, role: RoomMemberRole.OWNER, joinedAt: new Date() },
        { userId: target, role: RoomMemberRole.MEMBER, joinedAt: new Date() },
      ],
    } as RoomDocument;
    model.findOne.mockReturnValue(query(room));
    model.findOneAndUpdate.mockReturnValue(query(room));
    model.create.mockResolvedValue(room);
    model.deleteOne.mockReturnValue(query({ deletedCount: 1 }));
    model.updateOne.mockReturnValue(query({ modifiedCount: 1 }));
    users.findById.mockResolvedValue({ type: UserType.REGISTERED });
    service = new RoomsService(
      model as unknown as Model<RoomDocument>,
      redis as unknown as RedisService,
      users as unknown as UsersService,
      friendships as unknown as FriendshipsService,
      new RoomEventsService(),
    );
  });

  it('reads fresh documents by slug and ID, ignoring cached authorization data', async () => {
    redis.getCache.mockReturnValue({ members: [] });
    await service.findById(rid);
    expect(model.findOne).toHaveBeenLastCalledWith({ _id: rid });
    await service.findById('general');
    expect(model.findOne).toHaveBeenLastCalledWith({ slug: 'general' });
    expect(redis.getCache).not.toHaveBeenCalled();
  });

  it('rejects missing rooms and empty identifiers', async () => {
    model.findOne.mockReturnValue(query(null));
    await expect(service.findById(rid)).rejects.toThrow(NotFoundException);
    await expect(service.findById('')).rejects.toThrow(BadRequestException);
  });

  it('allows public reads but restricts private rooms and DMs to members', async () => {
    await expect(
      service.findAccessible(rid, outsider.toString()),
    ).resolves.toBe(room);
    room.visibility = RoomVisibility.PRIVATE;
    await expect(
      service.findAccessible(rid, outsider.toString()),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.findAccessible(rid, oid)).resolves.toBe(room);
    room.type = RoomType.DM;
    room.visibility = RoomVisibility.PUBLIC;
    await expect(
      service.findAccessible(rid, outsider.toString()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates a group with trimmed fields and owner membership', async () => {
    await service.createRoom(oid, {
      type: RoomType.GROUP,
      name: ' General ',
      description: ' Topic ',
    });
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'General',
        description: 'Topic',
        createdBy: owner,
        members: [
          {
            userId: owner,
            role: RoomMemberRole.OWNER,
            joinedAt: anyDate,
          },
        ],
      }),
    );
  });

  it('rejects generic DM creation, unnamed groups and missing user IDs', async () => {
    await expect(
      service.createRoom(oid, { type: RoomType.DM }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createRoom(oid, { type: RoomType.GROUP }),
    ).rejects.toThrow(ConflictException);
    await expect(service.findAllForUser('')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('queries only user rooms in recent order', async () => {
    const chain = { sort: jest.fn().mockReturnValue(query([room])) };
    model.find.mockReturnValue(chain);
    await expect(service.findAllForUser(oid)).resolves.toEqual([room]);
    expect(model.find).toHaveBeenCalledWith({ 'members.userId': owner });
    expect(chain.sort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  it('resolves membership through either room identifier', async () => {
    await expect(service.findMembership('general', oid)).resolves.toBe(
      RoomMemberRole.OWNER,
    );
    await expect(
      service.findMembership(rid, outsider.toString()),
    ).resolves.toBeNull();
  });

  it('joins atomically and invalidates ID and slug caches', async () => {
    await service.joinRoom('general', outsider.toString());
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: roomId,
        type: RoomType.GROUP,
        visibility: RoomVisibility.PUBLIC,
        'members.userId': { $ne: outsider },
      }),
      {
        $push: {
          members: {
            userId: outsider,
            role: RoomMemberRole.MEMBER,
            joinedAt: anyDate,
          },
        },
      },
      expect.any(Object),
    );
    expect(redis.deleteCache).toHaveBeenCalledWith(`cache:room:${rid}`);
    expect(redis.deleteCache).toHaveBeenCalledWith('cache:room:general');
  });

  it.each([RoomType.DM, RoomVisibility.PRIVATE])(
    'rejects joining restricted room %s',
    async (restriction) => {
      if (restriction === RoomType.DM) room.type = RoomType.DM;
      else room.visibility = RoomVisibility.PRIVATE;
      await expect(service.joinRoom(rid, tid)).rejects.toThrow(
        ForbiddenException,
      );
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );

  it('reports duplicate/concurrent membership updates as conflicts', async () => {
    model.findOneAndUpdate.mockReturnValue(query(null));
    await expect(service.joinRoom(rid, tid)).rejects.toThrow(ConflictException);
    expect(redis.deleteCache).not.toHaveBeenCalled();
  });

  it('allows normal members to leave with an atomic pull', async () => {
    await service.leaveRoom(rid, tid);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: roomId }),
      { $pull: { members: { userId: target } } },
      { new: true },
    );
  });

  it('blocks owners, nonmembers and DM participants from leaving', async () => {
    await expect(service.leaveRoom(rid, oid)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.leaveRoom(rid, outsider.toString())).rejects.toThrow(
      ForbiddenException,
    );
    room.type = RoomType.DM;
    await expect(service.leaveRoom(rid, tid)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it.each([RoomMemberRole.OWNER, RoomMemberRole.MODERATOR])(
    'allows %s to update with permissions in the database filter',
    async (role) => {
      room.members[0].role = role;
      await service.updateRoom('general', oid, {
        name: ' Updated ',
        description: ' Topic ',
      });
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: roomId,
          members: {
            $elemMatch: {
              userId: owner,
              role: { $in: [RoomMemberRole.OWNER, RoomMemberRole.MODERATOR] },
            },
          },
        }),
        { $set: { name: 'Updated', description: 'Topic' } },
        { new: true, runValidators: true },
      );
    },
  );

  it('rejects ordinary members and DMs from room management', async () => {
    await expect(service.updateRoom(rid, tid, { name: 'No' })).rejects.toThrow(
      ForbiddenException,
    );
    room.type = RoomType.DM;
    await expect(service.updateRoom(rid, oid, { name: 'No' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deletes only with owner permissions in the database filter', async () => {
    await service.deleteRoom('general', oid);
    expect(model.deleteOne).toHaveBeenCalledWith({
      _id: roomId,
      type: RoomType.GROUP,
      members: {
        $elemMatch: { userId: owner, role: { $in: [RoomMemberRole.OWNER] } },
      },
    });
    room.members[0].role = RoomMemberRole.MODERATOR;
    await expect(service.deleteRoom(rid, oid)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('invites a registered target without inserting membership', async () => {
    const result = await service.addMember(rid, oid, outsider.toString());
    expect(result.roomId).toBe(rid);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ 'members.userId': { $ne: outsider } }),
      {
        $push: {
          invitations: expect.objectContaining({
            recipient: outsider,
            invitedBy: owner,
          }) as unknown,
        },
      },
      expect.any(Object),
    );
    expect(room.members).toHaveLength(2);
  });

  it.each([null, { type: UserType.GUEST }])(
    'rejects missing or guest invitation recipients',
    async (targetUser) => {
      users.findById.mockResolvedValue(targetUser);
      await expect(
        service.addMember(rid, oid, outsider.toString()),
      ).rejects.toThrow(NotFoundException);
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    },
  );

  it('prevents ordinary members from inviting', async () => {
    await expect(
      service.addMember(rid, tid, outsider.toString()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('binds invitation acceptance to recipient, expiry and absent membership atomically', async () => {
    const invitationId = new Types.ObjectId();
    await service.acceptInvitation(
      'general',
      invitationId.toString(),
      outsider.toString(),
    );
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: roomId,
        'members.userId': { $ne: outsider },
        invitations: {
          $elemMatch: {
            _id: invitationId,
            recipient: outsider,
            expiresAt: { $gt: anyDate },
          },
        },
      }),
      expect.objectContaining({
        $pull: { invitations: { recipient: outsider } },
      }),
      expect.any(Object),
    );
  });

  it('binds declining an invitation to its recipient', async () => {
    const invitationId = new Types.ObjectId();
    await service.declineInvitation(rid, invitationId.toString(), tid);
    expect(model.updateOne).toHaveBeenCalledWith(
      {
        _id: roomId,
        invitations: { $elemMatch: { _id: invitationId, recipient: target } },
      },
      { $pull: { invitations: { _id: invitationId, recipient: target } } },
    );
    model.updateOne.mockReturnValue(query({ modifiedCount: 0 }));
    await expect(
      service.declineInvitation(rid, invitationId.toString(), oid),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows managers to remove nonowners atomically', async () => {
    await service.removeMember(rid, oid, tid);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: roomId, $and: anyArray }),
      { $pull: { members: { userId: target } } },
      { new: true },
    );
    await expect(service.removeMember(rid, oid, oid)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.removeMember(rid, tid, oid)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows owners to change member roles with a conditional array update', async () => {
    await service.updateMemberRole(rid, oid, tid, RoomMemberRole.MODERATOR);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: roomId, $and: anyArray }),
      { $set: { 'members.$[target].role': RoomMemberRole.MODERATOR } },
      {
        arrayFilters: [{ 'target.userId': target }],
        new: true,
        runValidators: true,
      },
    );
  });

  it('rejects invalid roles, ownership changes and nonowner role management', async () => {
    await expect(
      service.updateMemberRole(rid, oid, tid, RoomMemberRole.OWNER),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateMemberRole(rid, oid, oid, RoomMemberRole.MODERATOR),
    ).rejects.toThrow(ForbiddenException);
    room.members[0].role = RoomMemberRole.MODERATOR;
    await expect(
      service.updateMemberRole(rid, oid, tid, RoomMemberRole.MEMBER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects self DMs and nonfriends before creating a room', async () => {
    await expect(service.createDm(oid, oid)).rejects.toThrow(
      BadRequestException,
    );
    friendships.assertFriends.mockRejectedValue(new ConflictException());
    await expect(service.createDm(oid, tid)).rejects.toThrow(ConflictException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('creates a private DM with a canonical unique pair and exactly two members', async () => {
    model.findOne.mockReturnValue(query(null));
    await service.createDm(oid, tid);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dmPairKey: [oid, tid].sort().join(':'),
        type: RoomType.DM,
        visibility: RoomVisibility.PRIVATE,
        capabilities: [RoomCapability.TEXT],
        members: [
          {
            userId: owner,
            role: RoomMemberRole.MEMBER,
            joinedAt: anyDate,
          },
          {
            userId: target,
            role: RoomMemberRole.MEMBER,
            joinedAt: anyDate,
          },
        ],
      }),
    );
  });

  it('returns an existing DM and recovers from concurrent creation', async () => {
    await expect(service.createDm(oid, tid)).resolves.toBe(room);
    model.findOne
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(room));
    model.create.mockRejectedValue({ code: 11000 });
    await expect(service.createDm(tid, oid)).resolves.toBe(room);
  });

  it('requires an accepted friendship on every DM send', async () => {
    room.type = RoomType.DM;
    await service.assertCanSend(room, oid);
    expect(friendships.assertFriends).toHaveBeenCalledWith(oid, tid);
    friendships.assertFriends.mockRejectedValue(new ConflictException());
    await expect(service.assertCanSend(room, oid)).rejects.toThrow(
      ConflictException,
    );
    await expect(
      service.assertCanSend(room, outsider.toString()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not require friendship for group sends', async () => {
    await service.assertCanSend(room, tid);
    expect(friendships.assertFriends).not.toHaveBeenCalled();
  });

  it('returns public member profiles only to room members', async () => {
    users.publicProfiles.mockResolvedValue([
      { _id: owner, username: 'owner', displayName: 'Owner', email: 'private' },
    ]);
    const profiles = await service.members(rid, oid);
    expect(profiles[0]).toEqual({
      id: oid,
      username: 'owner',
      displayName: 'Owner',
      role: RoomMemberRole.OWNER,
      joinedAt: anyDate,
    });
    expect(profiles[0]).not.toHaveProperty('email');
    await expect(service.members(rid, outsider.toString())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('prevents a moderator from removing another moderator', async () => {
    room.members[0].role = RoomMemberRole.MODERATOR;
    room.members[1].role = RoomMemberRole.MODERATOR;
    await expect(service.removeMember(rid, oid, tid)).rejects.toThrow(
      ForbiddenException,
    );
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
