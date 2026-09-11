import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { SessionGuard } from '../auth/guards/session.guard';

describe('RoomsController', () => {
  let controller: RoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: {
            createRoom: jest.fn(),
            findAllForUser: jest.fn(),
            findById: jest.fn(),
            updateRoom: jest.fn(),
            deleteRoom: jest.fn(),
            joinRoom: jest.fn(),
            leaveRoom: jest.fn(),
            addMember: jest.fn(),
            removeMember: jest.fn(),
            updateMemberRole: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});