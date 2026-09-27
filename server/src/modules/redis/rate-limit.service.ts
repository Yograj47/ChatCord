import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async check(
    scope: string,
    identifier: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const window = Math.floor(Date.now() / 1000 / windowSeconds);

    const key = `rate:${scope}:${identifier}:${window}`;

    const count = await this.redisService.incrementRateLimit(
      key,
      windowSeconds,
    );

    return count <= limit;
  }
}
