import { createClient, RedisClientType } from 'redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class CacheService {
  private redisClient: RedisClientType | null = null;
  private inMemoryCache: Map<string, { value: unknown; expiresAt: number }> = new Map();
  private isRedisConnected = false;

  constructor() {
    if (env.REDIS_URL) {
      this.redisClient = createClient({ url: env.REDIS_URL });
      this.redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
        logger.info('Connected to Redis server');
      });
      this.redisClient.connect().catch((err) => {
        logger.warn({ err: err.message }, 'Failed to initialize Redis. Falling back to in-memory cache.');
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        return data ? (JSON.parse(data) as T) : null;
      } catch (err) {
        logger.warn({ err }, 'Redis GET failed, attempting fallback');
      }
    }

    const item = this.inMemoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number = env.CACHE_TTL_SECONDS): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (err) {
        logger.warn({ err }, 'Redis SETEx failed, saving to in-memory fallback');
      }
    }

    this.inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async close(): Promise<void> {
    if (this.redisClient && this.isRedisConnected) {
      await this.redisClient.quit();
    }
  }
}

export const cacheService = new CacheService();