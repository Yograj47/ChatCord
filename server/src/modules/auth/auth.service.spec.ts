// src/modules/auth/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

type GooglePayload = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

describe('AuthService', () => {
  let service: AuthService;

  // Standalone mock function avoids @typescript-eslint unsafe property chain resolution errors
  const mockVerifyIdToken = jest.fn<
    Promise<{ getPayload: () => GooglePayload | undefined }>,
    [{ idToken: string; audience: string }]
  >();

  const usersService = {
    findByGoogleId: jest.fn(),
    createFromGoogle: jest.fn(),
  };

  const sessionService = {
    createGuestSession: jest.fn(),
    createUserSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('mock-google-client-id'),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'john@example.com',
    displayName: 'John Doe',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
        { provide: SessionService, useValue: sessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Inject mock Google client safely using Object.defineProperty
    Object.defineProperty(service, 'googleClient', {
      value: { verifyIdToken: mockVerifyIdToken },
      writable: true,
      configurable: true,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should return existing user if found by Google providerId', async () => {
      const mockPayload: GooglePayload = {
        sub: 'google-12345',
        email: 'john@example.com',
        name: 'John Doe',
        picture: 'https://example.com/avatar.jpg',
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      });

      usersService.findByGoogleId.mockResolvedValue(mockUser);

      const result = await service.googleLogin('valid-id-token');

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-id-token',
        audience: 'mock-google-client-id',
      });
      expect(usersService.findByGoogleId).toHaveBeenCalledWith('google-12345');
      expect(usersService.createFromGoogle).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should create and return a new user if user does not exist', async () => {
      const mockPayload: GooglePayload = {
        sub: 'google-67890',
        email: 'jane@example.com',
        name: 'Jane Doe',
        picture: 'https://example.com/jane.jpg',
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      });

      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.createFromGoogle.mockResolvedValue(mockUser);

      const result = await service.googleLogin('valid-id-token');

      expect(usersService.findByGoogleId).toHaveBeenCalledWith('google-67890');
      expect(usersService.createFromGoogle).toHaveBeenCalledWith({
        providerId: 'google-67890',
        email: 'jane@example.com',
        displayName: 'Jane Doe',
        avatarUrl: 'https://example.com/jane.jpg',
      });
      expect(result).toEqual(mockUser);
    });

    it('should fallback displayName to "ChatCord User" if Google payload name is missing', async () => {
      const mockPayload: GooglePayload = {
        sub: 'google-12345',
        email: 'noname@example.com',
      };

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => mockPayload,
      });

      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.createFromGoogle.mockResolvedValue(mockUser);

      await service.googleLogin('valid-id-token');

      expect(usersService.createFromGoogle).toHaveBeenCalledWith({
        providerId: 'google-12345',
        email: 'noname@example.com',
        displayName: 'ChatCord User',
        avatarUrl: undefined,
      });
    });

    it('should throw UnauthorizedException if sub is missing from payload', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'john@example.com' }),
      });

      await expect(service.googleLogin('invalid-token')).rejects.toThrow(
        new UnauthorizedException('Invalid Google account information.'),
      );
    });

    it('should throw UnauthorizedException if email is missing from payload', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ sub: 'google-12345' }),
      });

      await expect(service.googleLogin('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if getPayload returns undefined', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => undefined,
      });

      await expect(service.googleLogin('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('createGuestSession', () => {
    it('should delegate session creation to sessionService', async () => {
      const mockGuestSession = { token: 'guest-session-token' };
      sessionService.createGuestSession.mockResolvedValue(mockGuestSession);

      const result = await service.createGuestSession(
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(sessionService.createGuestSession).toHaveBeenCalledWith(
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(result).toEqual(mockGuestSession);
    });
  });

  describe('createUserSession', () => {
    it('should delegate user session creation to sessionService', async () => {
      const mockUserSession = { token: 'user-session-token' };
      sessionService.createUserSession.mockResolvedValue(mockUserSession);

      const result = await service.createUserSession(
        'user-id-123',
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(sessionService.createUserSession).toHaveBeenCalledWith(
        'user-id-123',
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(result).toEqual(mockUserSession);
    });
  });

  describe('logout', () => {
    it('should call sessionService.deleteSession and return success message', async () => {
      sessionService.deleteSession.mockResolvedValue(undefined);

      const result = await service.logout('session-token-123');

      expect(sessionService.deleteSession).toHaveBeenCalledWith(
        'session-token-123',
      );
      expect(result).toEqual({ message: 'Logout successful.' });
    });
  });
});
