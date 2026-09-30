import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
        details: err.details,
      },
      `[AppError] ${err.errorCode}: ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details ?? undefined,
      },
    });
    return;
  }

  logger.error(
    {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    `[UnhandledError] ${err.message}`
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected internal server error occurred.'
          : err.message,
    },
  });
}
