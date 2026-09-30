import { Request, Response, NextFunction } from 'express';
import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
  IRateLimiterOptions,
} from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { env } from '../config/env.config';
import { logger } from '../config/logger';

function createLimiter(options: IRateLimiterOptions): RateLimiterMemory | RateLimiterRedis {
  if (process.env.NODE_ENV === 'test') {
    return new RateLimiterMemory(options);
  }

  try {
    const redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    redisClient.on('error', () => {
      // Handled silently to avoid crashing the server on missing Redis
    });

    return new RateLimiterRedis({
      storeClient: redisClient,
      ...options,
      inMemoryBlockOnConsumed: options.points,
      insuranceLimiter: new RateLimiterMemory(options),
    });
  } catch (err: unknown) {
    logger.warn('Failed to configure Redis for rate limiter, falling back to memory');
    return new RateLimiterMemory(options);
  }
}

// 3 OTP requests per 10 minutes per phone or IP
export const otpRateLimiter = createLimiter({
  keyPrefix: 'rl_otp',
  points: 3,
  duration: 600,
});

// 10 authentication requests per minute per IP
export const authRateLimiter = createLimiter({
  keyPrefix: 'rl_auth',
  points: 10,
  duration: 60,
});

// 100 general API requests per minute per IP
export const generalApiRateLimiter = createLimiter({
  keyPrefix: 'rl_api',
  points: 100,
  duration: 60,
});

type KeyExtractor = (req: Request) => string;

export function rateLimiterMiddleware(
  limiter: RateLimiterMemory | RateLimiterRedis,
  keyExtractor?: KeyExtractor
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // In test environment, allow bypassing rate limits unless specifically instructed
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    try {
      const key = keyExtractor
        ? keyExtractor(req)
        : req.ip || req.socket.remoteAddress || '127.0.0.1';

      await limiter.consume(key);
      next();
    } catch (err: unknown) {
      if (err instanceof RateLimiterRes) {
        const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfterSeconds,
            },
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const otpLimiterMiddleware = rateLimiterMiddleware(otpRateLimiter, (req) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  return phone ? `phone_${phone}` : `ip_${ip}`;
});

export const authLimiterMiddleware = rateLimiterMiddleware(authRateLimiter);
export const generalLimiterMiddleware = rateLimiterMiddleware(generalApiRateLimiter);
