import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { logger } from './config/logger';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { generalLimiterMiddleware } from './middlewares/rate-limiter.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';

export function createApp(): Express {
  const app = express();

  // Security headers & Cross-Origin settings
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body and cookie parsing
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Structured request logging with X-Request-Id
  app.use(requestLogger);

  // Global rate limiter
  app.use(generalLimiterMiddleware);

  // Root health redirect
  app.get('/', (_req, res) => {
    res.redirect('/api/v1/health');
  });

  // API v1 router
  app.use('/api/v1', apiRouter);

  // Global error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(
      `🚀 EcoTrace India Backend API service running at http://localhost:${env.PORT}`
    );
    logger.info(`📋 Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });
}
