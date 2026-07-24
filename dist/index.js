"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const cache_service_1 = require("./services/cache.service");
const server = app_1.default.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`PagePulse Production SDE API running on port ${env_1.env.PORT} [env: ${env_1.env.NODE_ENV}]`);
});
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        logger_1.logger.info('HTTP server closed.');
        await cache_service_1.cacheService.close();
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
