import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { Role } from '@prisma/client';
import { env } from '../config/env.config';
import { UnauthorizedError } from '../errors/app-error';

export interface JwtTokenPayload {
  userId: string;
  role: Role;
}

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
};

export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: NonNullable<SignOptions['expiresIn']>;
  private readonly refreshExpiry: NonNullable<SignOptions['expiresIn']>;

  constructor() {
    this.accessSecret = env.JWT_ACCESS_SECRET;
    this.refreshSecret = env.JWT_REFRESH_SECRET;
    this.accessExpiry = (env.JWT_ACCESS_EXPIRY || '15m') as NonNullable<SignOptions['expiresIn']>;
    this.refreshExpiry = (env.JWT_REFRESH_EXPIRY || '7d') as NonNullable<SignOptions['expiresIn']>;
  }

  generateAccessToken(payload: JwtTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  generateRefreshToken(payload: JwtTokenPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });
  }

  generateTokenPair(payload: JwtTokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtTokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as jwt.JwtPayload;
      if (!decoded.userId || !decoded.role) {
        throw new UnauthorizedError('Invalid access token payload');
      }
      return {
        userId: decoded.userId as string,
        role: decoded.role as Role,
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtTokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as jwt.JwtPayload;
      if (!decoded.userId || !decoded.role) {
        throw new UnauthorizedError('Invalid refresh token payload');
      }
      return {
        userId: decoded.userId as string,
        role: decoded.role as Role,
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}

export const tokenService = new TokenService();
