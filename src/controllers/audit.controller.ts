import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/requestId';
import { auditService } from '../services/audit.service';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const auditQuerySchema = z.object({
  url: z.string().url('Invalid URL format. Must include protocol (http:// or https://)'),
  bypassCache: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const auditController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = auditQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid query parameters';
      throw new AppError(400, 'INVALID_INPUT', firstError);
    }

    const { url: targetUrl, bypassCache } = parseResult.data;
    const cacheKey = `audit:${targetUrl}`;

    if (!bypassCache) {
      const cachedResult = await cacheService.get<ReturnType<typeof auditService.performAudit> extends Promise<infer U> ? U : never>(cacheKey);
      if (cachedResult) {
        logger.info({ requestId: req.id, url: targetUrl }, 'Served audit from cache');
        return res.status(200).json({
          status: 'success',
          data: {
            ...cachedResult,
            cached: true,
          },
        });
      }
    }

    logger.info({ requestId: req.id, url: targetUrl }, 'Running fresh URL audit');
    const auditData = await auditService.performAudit(targetUrl);

    await cacheService.set(cacheKey, auditData);

    return res.status(200).json({
      status: 'success',
      data: {
        ...auditData,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};