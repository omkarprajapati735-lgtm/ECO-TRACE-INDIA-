import {
  PrismaClient,
  Batch,
  BatchStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/prisma';
import { ValidationError, NotFoundError } from '../errors/app-error';

export interface CreateBatchRepoInput {
  id?: string;
  batchCode: string;
  hubId: string;
  categoryId: string;
  grossWeightKg: number;
  netWeightKg: number;
  recyclerId?: string | null;
  qrCode: string;
  manifestUrl?: string | null;
}

export class BatchRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createBatch(
    data: CreateBatchRepoInput,
    tx?: Prisma.TransactionClient
  ): Promise<Batch> {
    const client = tx ?? this.db;
    return client.batch.create({
      data: {
        id: data.id,
        batchCode: data.batchCode,
        hubId: data.hubId,
        categoryId: data.categoryId,
        grossWeightKg: new Prisma.Decimal(data.grossWeightKg.toFixed(3)),
        netWeightKg: new Prisma.Decimal(data.netWeightKg.toFixed(3)),
        recyclerId: data.recyclerId ?? null,
        qrCode: data.qrCode,
        manifestUrl: data.manifestUrl ?? null,
        status: BatchStatus.OPEN,
      },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async sealBatch(
    id: string,
    batchCode: string,
    qrCode: string,
    manifestUrl?: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<Batch> {
    const client = tx ?? this.db;
    return client.batch.update({
      where: { id },
      data: {
        batchCode,
        qrCode,
        manifestUrl: manifestUrl ?? null,
        status: BatchStatus.SEALED,
      },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async findById(id: string) {
    return this.db.batch.findUnique({
      where: { id },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async findByBatchCode(batchCode: string) {
    return this.db.batch.findUnique({
      where: { batchCode },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async listBatches(filter?: {
    hubId?: string;
    recyclerId?: string;
    status?: BatchStatus;
    limit?: number;
    offset?: number;
  }) {
    return this.db.batch.findMany({
      where: {
        ...(filter?.hubId ? { hubId: filter.hubId } : {}),
        ...(filter?.recyclerId ? { recyclerId: filter.recyclerId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      take: filter?.limit ?? 50,
      skip: filter?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async deductInventory(
    hubId: string,
    categoryId: string,
    storageBin: string,
    weightKg: number,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? this.db;
    const inv = await client.inventoryItem.findUnique({
      where: {
        hubId_categoryId_storageBin: {
          hubId,
          categoryId,
          storageBin,
        },
      },
    });

    if (!inv) {
      throw new NotFoundError(
        `Inventory not found for hub ${hubId}, category ${categoryId}, bin ${storageBin}`
      );
    }

    const available = Number(inv.quantityKg);
    if (available < weightKg) {
      throw new ValidationError(
        `Insufficient inventory balance. Available: ${available}kg, Required: ${weightKg}kg`
      );
    }

    const weightDecimal = new Prisma.Decimal(weightKg.toFixed(3));
    return client.inventoryItem.update({
      where: {
        hubId_categoryId_storageBin: {
          hubId,
          categoryId,
          storageBin,
        },
      },
      data: {
        quantityKg: { decrement: weightDecimal },
      },
    });
  }

  async findInventory(hubId: string, categoryId: string) {
    return this.db.inventoryItem.findMany({
      where: { hubId, categoryId },
    });
  }
}

export const batchRepository = new BatchRepository();
