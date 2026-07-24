import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { cacheService } from './services/cache.service';

const server = app.listen(env.PORT, () => {
  logger.info(`PagePulse Production SDE API running on port ${env.PORT} [env: ${env.NODE_ENV}]`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await cacheService.close();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));