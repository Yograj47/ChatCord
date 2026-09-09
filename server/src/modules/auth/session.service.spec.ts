import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';

import { SessionService } from './session.service';
import { Session, SessionType } from './schemas/session.schema';
import { AUTH_SESSION } from 'src/common/constants/auth.constants';

describe('SessionService', () => {
  let service: SessionService;
  let mockSessionModel: {
    create: ReturnType<typeof jest.fn>;
    findOne: ReturnType<typeof jest.fn>;
    deleteOne: ReturnType<typeof jest.fn>;
    deleteMany: ReturnType<typeof jest.fn>;
  };

  beforeEach(async () => {
    mockSessionModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should create guest session with 30-minute expiration', async () => {
    mockSessionModel.create.mockImplementation((data: unknown) => ({
      ...(data as Record<string, unknown>),
      _id: 'guest_session_id',
    }));

    const result = await service.createGuestSession('127.0.0.1', 'jest-agent');
    expect(result.token).toBeDefined();
    expect((result.session as unknown as Record<string, unknown>).type).toBe(
      SessionType.GUEST,
    );
    expect(
      (result.session as unknown as Record<string, unknown>).userId,
    ).toBeNull();
  });

  it('should throw UnauthorizedException if session not found or expired', async () => {
    mockSessionModel.findOne.mockReturnValue({
      exec: jest.fn<() => Promise<null>>().mockResolvedValue(null),
    });

    await expect(service.validateSession('invalid_token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should extend idle expiration for registered sessions during validation', async () => {
    const now = new Date();
    const mockSession = {
      _id: 'reg_session_id',
      type: SessionType.REGISTERED,
      userId: 'user_123',
      expiresAt: new Date(now.getTime() + 100000),
      absoluteExpiresAt: new Date(
        now.getTime() + AUTH_SESSION.REGISTERED_ABSOLUTE_TTL,
      ),
      save: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };

    mockSessionModel.findOne.mockReturnValue({
      exec: jest
        .fn<() => Promise<typeof mockSession>>()
        .mockResolvedValue(mockSession),
    });

    const validated = await service.validateSession('valid_token');
    expect(validated.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    expect(mockSession.save).toHaveBeenCalled();
  });
});
