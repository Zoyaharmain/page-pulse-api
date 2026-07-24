"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    REDIS_URL: zod_1.z.string().optional(),
    CACHE_TTL_SECONDS: zod_1.z.string().default('300').transform((val) => parseInt(val, 10)),
    AUDIT_TIMEOUT_MS: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    MAX_CONCURRENT_AUDITS: zod_1.z.string().default('10').transform((val) => parseInt(val, 10)),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('60000').transform((val) => parseInt(val, 10)),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('30').transform((val) => parseInt(val, 10)),
});
exports.env = envSchema.parse(process.env);
