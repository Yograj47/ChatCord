import { Module } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { RedisService } from './redis.service';
import { RateLimitService } from './rate-limit.service';

const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (): Promise<RedisClientType> => {
        const client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await client.connect();
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService, RateLimitService],
})
export class RedisModule {}
