import { PrismaClient, Collector, CollectorType, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export class CollectorRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findByUserId(userId: string): Promise<Collector | null> {
    return this.db.collector.findUnique({
      where: { userId },
      include: {
        wallet: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Collector | null> {
    return this.db.collector.findUnique({
      where: { id },
      include: {
        wallet: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async createProfile(
    userId: string,
    collectorType: CollectorType = CollectorType.KABADIWALA,
    serviceRadiusKm: number = 10.0
  ): Promise<Collector> {
    return this.db.collector.create({
      data: {
        userId,
        collectorType,
        serviceRadiusKm,
        verificationStatus: VerificationStatus.VERIFIED,
        wallet: {
          create: {
            balance: 0.0,
            totalEarned: 0.0,
            totalWithdrawn: 0.0,
          },
        },
      },
      include: {
        wallet: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStats(collectorId: string, additionalWeightKg: number): Promise<Collector> {
    return this.db.collector.update({
      where: { id: collectorId },
      data: {
        totalCollections: { increment: 1 },
        totalWeightKg: { increment: additionalWeightKg },
      },
    });
  }
}

export const collectorRepository = new CollectorRepository();
