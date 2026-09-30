import { PrismaClient, User, Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateUserData {
  fullName: string;
  phone: string;
  email?: string | null;
  passwordHash?: string | null;
  role?: Role;
  preferredLanguage?: string;
  isVerified?: boolean;
  status?: string;
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  email?: string | null;
  passwordHash?: string;
  role?: Role;
  preferredLanguage?: string;
  isVerified?: boolean;
  status?: string;
}

export class UserRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { phone },
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async findByPhoneOrEmail(identifier: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,
        passwordHash: data.passwordHash ?? null,
        role: data.role ?? Role.CONSUMER,
        preferredLanguage: data.preferredLanguage ?? 'en',
        isVerified: data.isVerified ?? false,
        status: data.status ?? 'ACTIVE',
      },
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
      include: {
        collectorProfile: true,
        recyclerProfile: true,
      },
    });
  }

  async createCollectorWithWallet(userId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const collector = await tx.collector.create({
        data: {
          userId,
        },
      });
      await tx.wallet.create({
        data: {
          collectorId: collector.id,
        },
      });
    });
  }
}

export const userRepository = new UserRepository();
