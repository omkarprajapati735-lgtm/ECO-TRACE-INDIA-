import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authService, AuthService } from '../services/auth.service';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from '../services/token.service';
import { ValidationError, UnauthorizedError } from '../errors/app-error';

const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting with 6-9)');

const sendOtpSchema = z.object({
  phone: indianPhoneSchema,
});

const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit number'),
  role: z.nativeEnum(Role).optional(),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must have at least 2 characters').max(100),
  phone: indianPhoneSchema,
  email: z.string().trim().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.nativeEnum(Role).default(Role.CONSUMER),
  preferredLanguage: z.string().trim().max(10).optional(),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Identifier (phone or email) is required'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required'),
});

export class AuthController {
  constructor(private readonly auth: AuthService = authService) {}

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = sendOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const result = await this.auth.sendOtp(parsed.data.phone);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { user, accessToken, refreshToken } = await this.auth.verifyOtp(
        parsed.data.phone,
        parsed.data.otp,
        parsed.data.role
      );

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Authentication successful',
      });
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { user, accessToken, refreshToken } = await this.auth.register(parsed.data);

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'User registered successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { user, accessToken, refreshToken } = await this.auth.login(
        parsed.data.identifier,
        parsed.data.password
      );

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Login successful',
      });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken =
        (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ??
        (req.body?.refreshToken as string | undefined);

      const parsed = refreshSchema.safeParse({ refreshToken: rawToken });
      if (!parsed.success) {
        throw new UnauthorizedError('Valid refresh token required');
      }

      const { user, accessToken, refreshToken: newRefreshToken } = await this.auth.refreshToken(
        parsed.data.refreshToken
      );

      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 0,
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const profile = await this.auth.getUserProfile(req.user.userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
