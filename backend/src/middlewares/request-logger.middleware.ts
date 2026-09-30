import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.length > 0)
    ? incomingId
    : randomUUID();

  req.id = requestId;
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.userId,
      role: req.user?.role,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, '[HTTP] Server Error response');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, '[HTTP] Client Error response');
    } else {
      logger.info(logData, '[HTTP] Request processed');
    }
  });

  next();
}
