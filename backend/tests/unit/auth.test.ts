import { describe, it, expect, beforeEach } from 'vitest';
import { Role, User } from '@prisma/client';
import { OtpService } from '../../src/services/otp.service';
import { TokenService } from '../../src/services/token.service';
import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { createAuthMiddleware } from '../../src/middlewares/auth.middleware';
import { AppError, ForbiddenError, UnauthorizedError, ValidationError, ConflictError } from '../../src/errors/app-error';

describe('Unit Tests: Authentication & RBAC Services', () => {
  describe('OtpService', () => {
    let otpService: OtpService;

    beforeEach(() => {
      otpService = new OtpService(300);
      otpService.clearStore();
    });

    it('should generate a 6-digit numeric OTP', async () => {
      const otp = await otpService.generateOtp('9876543210');
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should verify matching OTP successfully', async () => {
      const otp = await otpService.generateOtp('9876543210');
      const isValid = await otpService.verifyOtp('9876543210', otp);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      await otpService.generateOtp('9876543210');
      const isValid = await otpService.verifyOtp('9876543210', '000000');
      expect(isValid).toBe(false);
    });

    it('should clear OTP on demand', async () => {
      const otp = await otpService.generateOtp('9876543210');
      await otpService.clearOtp('9876543210');
      const isValid = await otpService.verifyOtp('9876543210', otp);
      expect(isValid).toBe(false);
    });
  });

  describe('TokenService', () => {
    const tokenService = new TokenService();

    it('should generate and verify access tokens', () => {
      const payload = { userId: 'user-uuid-1', role: Role.CONSUMER };
      const token = tokenService.generateAccessToken(payload);
      expect(typeof token).toBe('string');

      const verified = tokenService.verifyAccessToken(token);
      expect(verified.userId).toBe('user-uuid-1');
      expect(verified.role).toBe(Role.CONSUMER);
    });

    it('should generate and verify refresh tokens', () => {
      const payload = { userId: 'user-uuid-2', role: Role.HUB_MANAGER };
      const token = tokenService.generateRefreshToken(payload);
      expect(typeof token).toBe('string');

      const verified = tokenService.verifyRefreshToken(token);
      expect(verified.userId).toBe('user-uuid-2');
      expect(verified.role).toBe(Role.HUB_MANAGER);
    });

    it('should reject invalid or forged token', () => {
      expect(() => tokenService.verifyAccessToken('invalid.token.signature')).toThrow(
        UnauthorizedError
      );
    });
  });

  describe('AuthService', () => {
    let mockUsers: User[];
    let mockUserRepo: UserRepository;
    let otpService: OtpService;
    let authService: AuthService;

    beforeEach(() => {
      mockUsers = [];
      otpService = new OtpService(300);
      otpService.clearStore();

      mockUserRepo = {
        findById: async (id: string) => mockUsers.find((u) => u.id === id) || null,
        findByPhone: async (phone: string) => mockUsers.find((u) => u.phone === phone) || null,
        findByEmail: async (email: string) => mockUsers.find((u) => u.email === email) || null,
        findByPhoneOrEmail: async (ident: string) =>
          mockUsers.find((u) => u.phone === ident || u.email === ident) || null,
        create: async (data: Record<string, unknown>) => {
          const user: User = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fullName: data.fullName as string,
            phone: data.phone as string,
            email: (data.email as string) || null,
            passwordHash: (data.passwordHash as string) || null,
            role: (data.role as Role) || Role.CONSUMER,
            preferredLanguage: (data.preferredLanguage as string) || 'en',
            isVerified: (data.isVerified as boolean) ?? false,
            status: (data.status as string) || 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockUsers.push(user);
          return user;
        },
        update: async (id: string, data: Record<string, unknown>) => {
          const index = mockUsers.findIndex((u) => u.id === id);
          if (index === -1) throw new Error('Not found');
          mockUsers[index] = { ...mockUsers[index], ...data } as User;
          return mockUsers[index];
        },
        createCollectorWithWallet: async () => {},
      } as unknown as UserRepository;

      authService = new AuthService(mockUserRepo, otpService);
    });

    it('sendOtp should reject non-Indian phone formats', async () => {
      await expect(authService.sendOtp('12345')).rejects.toThrow(ValidationError);
      await expect(authService.sendOtp('5123456789')).rejects.toThrow(ValidationError);
    });

    it('sendOtp should generate OTP for valid phone', async () => {
      const res = await authService.sendOtp('9876543210');
      expect(res.success).toBe(true);
      expect(res.otp).toMatch(/^\d{6}$/);
    });

    it('verifyOtp should auto-create user on valid OTP if not exists', async () => {
      const otp = await otpService.generateOtp('9876543210');
      const result = await authService.verifyOtp('9876543210', otp, Role.COLLECTOR);

      expect(result.user.phone).toBe('9876543210');
      expect(result.user.role).toBe(Role.COLLECTOR);
      expect(result.user.isVerified).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('verifyOtp should reject invalid OTP', async () => {
      await otpService.generateOtp('9876543210');
      await expect(authService.verifyOtp('9876543210', '999999')).rejects.toThrow(UnauthorizedError);
    });

    it('register should hash password and create new user', async () => {
      const res = await authService.register({
        fullName: 'Aarav Patel',
        phone: '9876543210',
        email: 'aarav@ecotrace.in',
        password: 'Password@123',
        role: Role.CONSUMER,
      });

      expect(res.user.fullName).toBe('Aarav Patel');
      expect(res.accessToken).toBeDefined();
      expect(mockUsers[0].passwordHash).not.toBe('Password@123');
    });

    it('register should prevent duplicate phone registrations', async () => {
      await authService.register({
        fullName: 'User 1',
        phone: '9876543210',
        password: 'Password@123',
      });

      await expect(
        authService.register({
          fullName: 'User 2',
          phone: '9876543210',
          password: 'Password@123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('login should succeed with valid credentials and fail with invalid', async () => {
      await authService.register({
        fullName: 'Admin User',
        phone: '9876543210',
        email: 'admin@ecotrace.in',
        password: 'AdminPassword123',
        role: Role.ADMIN,
      });

      const res = await authService.login('admin@ecotrace.in', 'AdminPassword123');
      expect(res.user.role).toBe(Role.ADMIN);
      expect(res.accessToken).toBeDefined();

      await expect(authService.login('admin@ecotrace.in', 'WrongPassword')).rejects.toThrow(
        UnauthorizedError
      );
      await expect(authService.login('unknown@ecotrace.in', 'AdminPassword123')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('RBAC Middleware (authenticate & authorize)', () => {
    const tokenService = new TokenService();
    const { authenticate, authorize } = createAuthMiddleware(tokenService);

    it('authenticate should reject missing or malformed Bearer headers', () => {
      const req: Record<string, unknown> = { headers: {} };
      expect(() => authenticate(req as never, {} as never, () => {})).toThrow(UnauthorizedError);

      req.headers = { authorization: 'Basic 12345' };
      expect(() => authenticate(req as never, {} as never, () => {})).toThrow(UnauthorizedError);
    });

    it('authenticate should set req.user on valid token', () => {
      const token = tokenService.generateAccessToken({ userId: 'u-1', role: Role.CONSUMER });
      const req: Record<string, unknown> = { headers: { authorization: `Bearer ${token}` } };
      let nextCalled = false;

      authenticate(req as never, {} as never, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
      expect((req as { user?: { userId: string } }).user?.userId).toBe('u-1');
    });

    it('authorize should allow permitted role and deny forbidden role', () => {
      const hubGuard = authorize(Role.HUB_MANAGER, Role.ADMIN);

      const permittedReq: Record<string, unknown> = {
        user: { userId: 'u-2', role: Role.HUB_MANAGER },
      };
      let permittedNext = false;
      hubGuard(permittedReq as never, {} as never, () => {
        permittedNext = true;
      });
      expect(permittedNext).toBe(true);

      const forbiddenReq: Record<string, unknown> = {
        user: { userId: 'u-3', role: Role.CONSUMER },
      };
      expect(() => hubGuard(forbiddenReq as never, {} as never, () => {})).toThrow(ForbiddenError);
    });
  });
});
