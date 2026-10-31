import { ValidationPipe } from '@nestjs/common';
import { CompleteOnboardingDto } from '../auth/dto/complete-onboarding.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { SendMessageEventDto } from '../gateway/dto/room-event.dto';
import { MongoIdPipe } from '../../common/pipes/mongo-id.pipe';

describe('Social boundary validation', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  it.each([
    {},
    { username: 7 },
    { username: 'bad name' },
    { username: 'ab' },
    { username: 'valid_name', displayName: ' ' },
  ])('rejects invalid onboarding input %j', async (body) => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: CompleteOnboardingDto }),
    ).rejects.toThrow();
  });

  it('normalizes onboarding fields', async () => {
    await expect(
      pipe.transform(
        { username: ' Alice_1 ', displayName: ' Alice ' },
        { type: 'body', metatype: CompleteOnboardingDto },
      ),
    ).resolves.toEqual({ username: 'alice_1', displayName: 'Alice' });
  });

  it.each(['owner', 'admin', null, 5])(
    'rejects unsupported member role %j',
    async (role) => {
      await expect(
        pipe.transform(
          { role },
          { type: 'body', metatype: UpdateMemberRoleDto },
        ),
      ).rejects.toThrow();
    },
  );

  it('canonicalizes ObjectIds and rejects malformed identifiers', () => {
    const ids = new MongoIdPipe();
    expect(ids.transform('ABCDEF000000000000000001')).toBe(
      'abcdef000000000000000001',
    );
    expect(() => ids.transform('not-an-id')).toThrow();
  });

  it('validates message events and normalizes channel identifiers', async () => {
    const metadata = { type: 'body' as const, metatype: SendMessageEventDto };
    await expect(
      pipe.transform(
        { roomId: 'ABCDEF000000000000000001', content: ' hello ' },
        metadata,
      ),
    ).resolves.toEqual({
      roomId: 'abcdef000000000000000001',
      content: 'hello',
    });
    for (const body of [
      { roomId: 'general', content: 'hi' },
      { roomId: 'abcdef000000000000000001', content: ' ' },
      { roomId: 'abcdef000000000000000001', content: 42 },
    ])
      await expect(pipe.transform(body, metadata)).rejects.toThrow();
  });
});
