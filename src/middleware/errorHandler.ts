import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './requestId';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    logger.warn({ requestId, err: err.message, code: err.code }, 'Handled operational error');
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  logger.error({ requestId, err: err.stack }, 'Unhandled application error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};