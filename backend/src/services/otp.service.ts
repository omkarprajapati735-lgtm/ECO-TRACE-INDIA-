import Redis from 'ioredis';
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { SYSTEM_CONSTANTS } from '../constants';

interface OtpCacheEntry {
  otp: string;
  expiresAt: number;
}

export class OtpService {
  private readonly ttlSeconds: number;
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private readonly inMemoryStore = new Map<string, OtpCacheEntry>();

  constructor(ttlSeconds: number = SYSTEM_CONSTANTS.OTP_EXPIRY_SECONDS) {
    this.ttlSeconds = ttlSeconds;
    this.initRedis();
  }

  private initRedis(): void {
    if (process.env.NODE_ENV === 'test') {
      // In test mode, default to in-memory store for reliability and speed
      return;
    }

    try {
      this.redisClient = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      this.redisClient.on('connect', () => {
        this.isRedisAvailable = true;
        logger.info('✅ Redis connected successfully for OTP store');
      });

      this.redisClient.on('error', (err: Error) => {
        this.isRedisAvailable = false;
        logger.warn({ error: err.message }, 'Redis unavailable for OTP, falling back to memory store');
      });

      this.redisClient.connect().catch((err: Error) => {
        this.isRedisAvailable = false;
        logger.warn({ error: err.message }, 'Initial Redis connection failed, using in-memory OTP store');
      });
    } catch (err: unknown) {
      this.isRedisAvailable = false;
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn({ error: errorMsg }, 'Failed to initialize Redis client, using in-memory OTP store');
    }
  }

  private getOtpKey(phone: string): string {
    return `otp:${phone}`;
  }

  async generateOtp(phone: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.getOtpKey(phone);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.setex(key, this.ttlSeconds, otp);
      } catch (err: unknown) {
        logger.warn('Redis setex failed, falling back to in-memory store');
        this.saveToMemory(key, otp);
      }
    } else {
      this.saveToMemory(key, otp);
    }

    if (env.NODE_ENV !== 'production') {
      logger.info(`[DEV OTP] 🔐 6-digit OTP for phone ${phone}: ${otp}`);
      // Also log to console directly in dev mode as specified in ticketing requirements
      console.log(`[EcoTrace Dev OTP] Phone: ${phone} -> OTP: ${otp} (Valid for ${this.ttlSeconds}s)`);
    }

    return otp;
  }

  async verifyOtp(phone: string, inputOtp: string): Promise<boolean> {
    const key = this.getOtpKey(phone);
    let storedOtp: string | null = null;

    if (this.isRedisAvailable && this.redisClient) {
      try {
        storedOtp = await this.redisClient.get(key);
      } catch (err: unknown) {
        logger.warn('Redis get failed, falling back to in-memory store');
        storedOtp = this.getFromMemory(key);
      }
    } else {
      storedOtp = this.getFromMemory(key);
    }

    if (!storedOtp) {
      return false;
    }

    return storedOtp.trim() === inputOtp.trim();
  }

  async clearOtp(phone: string): Promise<void> {
    const key = this.getOtpKey(phone);
    this.inMemoryStore.delete(key);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        // Silently continue if Redis del fails
      }
    }
  }

  private saveToMemory(key: string, otp: string): void {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.inMemoryStore.set(key, { otp, expiresAt });
  }

  private getFromMemory(key: string): string | null {
    const entry = this.inMemoryStore.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }

    return entry.otp;
  }

  clearStore(): void {
    this.inMemoryStore.clear();
  }
}

export const otpService = new OtpService();
