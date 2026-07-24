import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedRequest extends Request {
  id?: string;
}

export const requestIdMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};