import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.string().default('300').transform((val) => parseInt(val, 10)),
  AUDIT_TIMEOUT_MS: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MAX_CONCURRENT_AUDITS: z.string().default('10').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('30').transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);