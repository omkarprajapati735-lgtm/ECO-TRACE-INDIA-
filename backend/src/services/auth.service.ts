import bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { userRepository, UserRepository } from '../repositories/user.repository';
import { otpService, OtpService } from './otp.service';
import { tokenService, TokenService } from './token.service';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../errors/app-error';
import { SafeUser, RegisterDto } from '../types';
import { env } from '../config/env.config';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository = userRepository,
    private readonly otpServ: OtpService = otpService,
    private readonly tokenServ: TokenService = tokenService
  ) {}

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    if (!INDIAN_PHONE_REGEX.test(phone)) {
      throw new ValidationError('Invalid Indian phone number format (expected 10 digits starting 6-9)');
    }

    const otp = await this.otpServ.generateOtp(phone);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp: env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp(
    phone: string,
    otp: string,
    role: Role = Role.CONSUMER
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    if (!INDIAN_PHONE_REGEX.test(phone)) {
      throw new ValidationError('Invalid Indian phone number format');
    }

    const isValid = await this.otpServ.verifyOtp(phone, otp);
    if (!isValid) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    await this.otpServ.clearOtp(phone);

    let user = await this.userRepo.findByPhone(phone);

    if (!user) {
      user = await this.userRepo.create({
        fullName: `User ${phone.slice(-4)}`,
        phone,
        role,
        isVerified: true,
        status: 'ACTIVE',
      });

      if (role === Role.COLLECTOR) {
        await this.userRepo.createCollectorWithWallet(user.id);
      }
    } else {
      if (user.status !== 'ACTIVE') {
        throw new ForbiddenError('User account is inactive or suspended');
      }

      if (!user.isVerified) {
        user = await this.userRepo.update(user.id, { isVerified: true });
      }
    }

    const { accessToken, refreshToken } = this.tokenServ.generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async register(
    data: RegisterDto
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    if (!INDIAN_PHONE_REGEX.test(data.phone)) {
      throw new ValidationError('Invalid Indian phone number format');
    }

    const existingPhone = await this.userRepo.findByPhone(data.phone);
    if (existingPhone) {
      throw new ConflictError('User with this phone number is already registered');
    }

    if (data.email) {
      const existingEmail = await this.userRepo.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictError('User with this email is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.role ?? Role.CONSUMER;

    const user = await this.userRepo.create({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email ?? null,
      passwordHash,
      role,
      preferredLanguage: data.preferredLanguage ?? 'en',
      isVerified: true,
      status: 'ACTIVE',
    });

    if (role === Role.COLLECTOR) {
      await this.userRepo.createCollectorWithWallet(user.id);
    }

    const { accessToken, refreshToken } = this.tokenServ.generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(
    identifier: string,
    password: string
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByPhoneOrEmail(identifier);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'Password login not configured for this account. Please use OTP login.'
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is inactive or suspended');
    }

    const { accessToken, refreshToken } = this.tokenServ.generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    token: string
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    if (!token) {
      throw new UnauthorizedError('Refresh token required');
    }

    const payload = this.tokenServ.verifyRefreshToken(token);
    const user = await this.userRepo.findById(payload.userId);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User session expired or user is inactive');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.tokenServ.generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getUserProfile(userId: string): Promise<SafeUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.toSafeUser(user);
  }
}

export const authService = new AuthService();
