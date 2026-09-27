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
    return this.redisClient.sAdd(`presence:user:${userId}`, socketId);
  }

  async removePresence(userId: string, socketId: string): Promise<number> {
    return this.redisClient.sRem(`presence:user:${userId}`, socketId);
  }

  async getPresence(userId: string): Promise<string[]> {
    return this.redisClient.sMembers(`presence:user:${userId}`);
  }

  private typingKey(roomId: string, userId: string): string {
    return `typing:${roomId}:${userId}`;
  }

  async setTyping(
    roomId: string,
    userId: string,
    ttlSeconds = 5,
  ): Promise<void> {
    await this.redisClient.set(this.typingKey(roomId, userId), '1', {
      EX: ttlSeconds,
    });
  }

  async clearTyping(roomId: string, userId: string): Promise<void> {
    await this.redisClient.del(this.typingKey(roomId, userId));
  }

  async isTyping(roomId: string, userId: string): Promise<boolean> {
    return (
      (await this.redisClient.exists(this.typingKey(roomId, userId))) === 1
    );
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
