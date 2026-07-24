"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const redis_1 = require("redis");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.redisClient = null;
        this.inMemoryCache = new Map();
        this.isRedisConnected = false;
        if (env_1.env.REDIS_URL) {
            this.redisClient = (0, redis_1.createClient)({ url: env_1.env.REDIS_URL });
            this.redisClient.on('error', (err) => logger_1.logger.error({ err }, 'Redis Client Error'));
            this.redisClient.on('connect', () => {
                this.isRedisConnected = true;
                logger_1.logger.info('Connected to Redis server');
            });
            this.redisClient.connect().catch((err) => {
                logger_1.logger.warn({ err: err.message }, 'Failed to initialize Redis. Falling back to in-memory cache.');
            });
        }
    }
    async get(key) {
        if (this.isRedisConnected && this.redisClient) {
            try {
                const data = await this.redisClient.get(key);
                return data ? JSON.parse(data) : null;
            }
            catch (err) {
                logger_1.logger.warn({ err }, 'Redis GET failed, attempting fallback');
            }
        }
        const item = this.inMemoryCache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.inMemoryCache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds = env_1.env.CACHE_TTL_SECONDS) {
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
                return;
            }
            catch (err) {
                logger_1.logger.warn({ err }, 'Redis SETEx failed, saving to in-memory fallback');
            }
        }
        this.inMemoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async close() {
        if (this.redisClient && this.isRedisConnected) {
            await this.redisClient.quit();
        }
    }
}
exports.cacheService = new CacheService();
