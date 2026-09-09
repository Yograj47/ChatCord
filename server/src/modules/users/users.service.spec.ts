// src/modules/users/users.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import {
  AuthProvider,
  AvatarSource,
  User,
  UserType,
} from './schemas/user.schema';

type MockQuery<T> = {
  exec: jest.Mock<Promise<T>, []>;
};

const createMockQuery = <T>(result: T): MockQuery<T> => ({
  exec: jest.fn<Promise<T>, []>().mockResolvedValue(result),
});

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'john_1a2b3c',
    displayName: 'John Doe',
    email: 'john@example.com',
    type: UserType.REGISTERED,
    identity: {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-12345',
    },
    avatar: {
      url: 'https://example.com/avatar.jpg',
      source: AvatarSource.GOOGLE,
    },
  };

  const mockFindOne = jest.fn();
  const mockFindById = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockDeleteOne = jest.fn();

  const mockUserModelConstructor = jest.fn((dto: Record<string, unknown>) => ({
    ...dto,
    save: jest.fn<Promise<Record<string, unknown>>, []>().mockResolvedValue({
      _id: mockUser._id,
      ...dto,
    }),
  }));

  const mockUserModel = Object.assign(mockUserModelConstructor, {
    findOne: mockFindOne,
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    deleteOne: mockDeleteOne,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByGoogleId', () => {
    it('should return a user document if found by Google providerId', async () => {
      mockFindOne.mockReturnValue(createMockQuery(mockUser));

      const result = await service.findByGoogleId('google-12345');

      expect(mockFindOne).toHaveBeenCalledWith({
        'identity.provider': AuthProvider.GOOGLE,
        'identity.providerId': 'google-12345',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if no user matches Google providerId', async () => {
      mockFindOne.mockReturnValue(createMockQuery(null));

      const result = await service.findByGoogleId('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user document by ID', async () => {
      mockFindById.mockReturnValue(createMockQuery(mockUser));

      const result = await service.findById(mockUser._id);

      expect(mockFindById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found by ID', async () => {
      mockFindById.mockReturnValue(createMockQuery(null));

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should trim and lowercase the username before searching', async () => {
      mockFindOne.mockReturnValue(createMockQuery(mockUser));

      const result = await service.findByUsername('   JOHN_1a2b3c   ');

      expect(mockFindOne).toHaveBeenCalledWith({
        username: 'john_1a2b3c',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if username is not found', async () => {
      mockFindOne.mockReturnValue(createMockQuery(null));

      const result = await service.findByUsername('unknown_user');

      expect(result).toBeNull();
    });
  });

  describe('createFromGoogle', () => {
    it('should create and return a new user document with avatarUrl', async () => {
      const googleData = {
        email: 'john@example.com',
        displayName: 'John Doe',
        providerId: 'google-12345',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const result = await service.createFromGoogle(googleData);

      expect(mockUserModelConstructor).toHaveBeenCalled();
      expect(result._id).toBe(mockUser._id);
      expect(result.email).toBe(googleData.email);
      expect(result.displayName).toBe(googleData.displayName);
      expect(result.type).toBe(UserType.REGISTERED);
      expect(result.identity).toEqual({
        provider: AuthProvider.GOOGLE,
        providerId: googleData.providerId,
      });
      expect(result.avatar).toEqual({
        url: googleData.avatarUrl,
        source: AvatarSource.GOOGLE,
      });
      expect(result.username).toMatch(/^john_[a-f0-9]{6}$/);
    });

    it('should create a user document with undefined avatar if avatarUrl is not provided', async () => {
      const googleData = {
        email: 'jane@example.com',
        displayName: 'Jane Doe',
        providerId: 'google-67890',
      };

      const result = await service.createFromGoogle(googleData);

      expect(result.avatar).toBeUndefined();
      expect(result.username).toMatch(/^jane_[a-f0-9]{6}$/);
    });

    it('should fallback to "user_" base for username generation if email prefix contains special characters', async () => {
      const googleData = {
        email: '!!!@example.com',
        displayName: 'Special Name',
        providerId: 'google-99999',
      };

      const result = await service.createFromGoogle(googleData);

      expect(result.username).toMatch(/^user_[a-f0-9]{6}$/);
    });
  });

  describe('updateDisplayName', () => {
    it('should trim and update the user display name', async () => {
      const updatedUser = { ...mockUser, displayName: 'John Updated' };

      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(updatedUser));

      const result = await service.updateDisplayName(
        mockUser._id,
        '   John Updated   ',
      );

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { displayName: 'John Updated' },
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user to update is not found', async () => {
      mockFindByIdAndUpdate.mockReturnValue(createMockQuery(null));

      const result = await service.updateDisplayName(
        'non-existent-id',
        'New Name',
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should return true when a user is successfully deleted', async () => {
      mockDeleteOne.mockReturnValue(createMockQuery({ deletedCount: 1 }));

      const result = await service.deleteById(mockUser._id);

      expect(mockDeleteOne).toHaveBeenCalledWith({
        _id: mockUser._id,
      });
      expect(result).toBe(true);
    });

    it('should return false when no user document is deleted', async () => {
      mockDeleteOne.mockReturnValue(createMockQuery({ deletedCount: 0 }));

      const result = await service.deleteById('non-existent-id');

      expect(mockDeleteOne).toHaveBeenCalledWith({
        _id: 'non-existent-id',
      });
      expect(result).toBe(false);
    });
  });
});
