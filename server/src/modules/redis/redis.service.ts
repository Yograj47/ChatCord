import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import type { RedisClientType } from 'redis';

const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async onApplicationShutdown() {
    await this.redisClient.quit();
  }

  async setCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async getCache<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async deleteCache(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async addPresence(userId: string, socketId: string): Promise<number> {
    // Leases expire after crashes; renewing one tab never extends another tab.
    return Number(
      await this.redisClient.eval(
        `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
      local previous = redis.call('ZCARD', KEYS[1])
      redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
      redis.call('EXPIRE', KEYS[1], 120)
      return previous
    `,
        {
          keys: [`presence:v2:user:${userId}`],
          arguments: [String(Date.now()), String(Date.now() + 60000), socketId],
        },
      ),
    );
  }

  async removePresence(userId: string, socketId: string): Promise<number> {
    return Number(
      await this.redisClient.eval(
        `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
      redis.call('ZREM', KEYS[1], ARGV[2])
      return redis.call('ZCARD', KEYS[1])
    `,
        {
          keys: [`presence:v2:user:${userId}`],
          arguments: [String(Date.now()), socketId],
        },
      ),
    );
  }

  async getPresence(userId: string): Promise<string[]> {
    const key = `presence:v2:user:${userId}`;
    await this.redisClient.zRemRangeByScore(key, '-inf', Date.now());
    return this.redisClient.zRange(key, 0, -1);
  }

  private typingKey(roomId: string): string {
    return `typing:v2:${roomId}`;
  }

  async setTyping(
    roomId: string,
    userId: string,
    socketId: string,
    ttlSeconds = 5,
  ): Promise<void> {
    await this.redisClient.eval(
      `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
      redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
      redis.call('EXPIRE', KEYS[1], 15)
      return 1
    `,
      {
        keys: [this.typingKey(roomId)],
        arguments: [
          String(Date.now()),
          String(Date.now() + ttlSeconds * 1000),
          `${userId}:${socketId}`,
        ],
      },
    );
  }

  async clearTyping(
    roomId: string,
    userId: string,
    socketId: string,
  ): Promise<void> {
    await this.redisClient.zRem(
      this.typingKey(roomId),
      `${userId}:${socketId}`,
    );
  }

  async isTyping(roomId: string, userId: string): Promise<boolean> {
    return (await this.getTyping(roomId)).includes(userId);
  }

  async getTyping(roomId: string): Promise<string[]> {
    const key = this.typingKey(roomId);
    await this.redisClient.zRemRangeByScore(key, '-inf', Date.now());
    return [
      ...new Set(
        (await this.redisClient.zRange(key, 0, -1)).map(
          (value) => value.split(':')[0],
        ),
      ),
    ];
  }

  async incrementRateLimit(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const count = await this.redisClient.incr(key);

    if (count === 1) {
      await this.redisClient.expire(key, windowSeconds);
    }

    return count;
  }
}
