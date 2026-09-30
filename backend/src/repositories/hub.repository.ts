import {
  PrismaClient,
  Hub,
  InventoryItem,
  PickupStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { prisma } from '../config/prisma';

export interface HubWithDetails extends Hub {
  manager: { id: string; fullName: string; phone: string; email: string | null };
  inventoryItems: Array<InventoryItem & { category: { id: string; code: string; name: string } }>;
}

export interface IntakeLogPayload {
  hubId: string;
  collectorId: string;
  pickupIds: string[];
  claimedWeightKg: number;
  verifiedWeightKg: number;
  discrepancyPercent: number;
  managerUserId?: string;
}

export class HubRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<HubWithDetails | null> {
    return this.db.hub.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        inventoryItems: {
          include: {
            category: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
  }

  async getCollectorDropoffLots(hubId: string, collectorId: string) {
    return this.db.pickup.findMany({
      where: {
        collectorId,
        status: {
          in: [
            PickupStatus.COLLECTED,
            PickupStatus.PAYMENT_PENDING,
            PickupStatus.COMPLETED,
          ],
        },
        OR: [{ hubId }, { hubId: null }],
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
        consumer: {
          select: { id: true, fullName: true, phone: true },
        },
        collector: {
          select: {
            id: true,
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPickupsByIds(pickupIds: string[]) {
    return this.db.pickup.findMany({
      where: { id: { in: pickupIds } },
      include: {
        items: {
          include: { category: true },
        },
        collector: {
          select: { id: true, userId: true, user: { select: { fullName: true, phone: true } } },
        },
      },
    });
  }

  async getInventory(hubId: string) {
    return this.db.inventoryItem.findMany({
      where: { hubId },
      include: {
        category: {
          select: { id: true, code: true, name: true, baseRatePerKg: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findInventoryItem(hubId: string, categoryId: string, storageBin: string) {
    return this.db.inventoryItem.findUnique({
      where: {
        hubId_categoryId_storageBin: {
          hubId,
          categoryId,
          storageBin,
        },
      },
    });
  }

  async incrementInventory(
    hubId: string,
    categoryId: string,
    storageBin: string,
    weightKg: number | Prisma.Decimal,
    tx?: Prisma.TransactionClient
  ): Promise<InventoryItem> {
    const client = tx ?? this.db;
    const decimalWeight =
      typeof weightKg === 'number' ? new Prisma.Decimal(weightKg.toFixed(3)) : weightKg;

    return client.inventoryItem.upsert({
      where: {
        hubId_categoryId_storageBin: {
          hubId,
          categoryId,
          storageBin,
        },
      },
      update: {
        quantityKg: { increment: decimalWeight },
      },
      create: {
        hubId,
        categoryId,
        storageBin,
        quantityKg: decimalWeight,
      },
    });
  }

  async updatePickupsStatus(
    pickupIds: string[],
    status: PickupStatus,
    hubId?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? this.db;
    return client.pickup.updateMany({
      where: { id: { in: pickupIds } },
      data: {
        status,
        ...(hubId ? { hubId } : {}),
      },
    });
  }

  async createDiscrepancyLog(payload: IntakeLogPayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.db;
    const audit = await client.auditLog.create({
      data: {
        userId: payload.managerUserId ?? null,
        action: 'HUB_INTAKE_DISCREPANCY_FLAGGED',
        entityType: 'HubIntake',
        entityId: payload.hubId,
        newValue: {
          collectorId: payload.collectorId,
          pickupIds: payload.pickupIds,
          claimedWeightKg: payload.claimedWeightKg,
          verifiedWeightKg: payload.verifiedWeightKg,
          discrepancyPercent: payload.discrepancyPercent,
        },
      },
    });

    const admins = await client.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    const targetUserIds = admins.length > 0 ? admins.map((a) => a.id) : (payload.managerUserId ? [payload.managerUserId] : []);

    for (const userId of targetUserIds) {
      await client.notification.create({
        data: {
          userId,
          title: 'Weight Discrepancy Exceeded 5%',
          message: `Hub intake flagged: Lot has ${payload.discrepancyPercent}% variance (Claimed: ${payload.claimedWeightKg}kg, Verified: ${payload.verifiedWeightKg}kg). Payouts frozen.`,
          type: 'DISCREPANCY_ALERT',
        },
      });
    }

    return audit;
  }

  async createIntakeAuditLog(payload: IntakeLogPayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.db;
    return client.auditLog.create({
      data: {
        userId: payload.managerUserId ?? null,
        action: 'HUB_INTAKE_VERIFIED',
        entityType: 'HubIntake',
        entityId: payload.hubId,
        newValue: {
          collectorId: payload.collectorId,
          pickupIds: payload.pickupIds,
          claimedWeightKg: payload.claimedWeightKg,
          verifiedWeightKg: payload.verifiedWeightKg,
          discrepancyPercent: payload.discrepancyPercent,
        },
      },
    });
  }
}

export const hubRepository = new HubRepository();
