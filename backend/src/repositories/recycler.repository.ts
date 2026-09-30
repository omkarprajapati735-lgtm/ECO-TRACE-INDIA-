import {
  PrismaClient,
  Recycler,
  Batch,
  BatchStatus,
  EprRecord,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/prisma';
import { BatchYieldsRecord } from '../types/recycler.types';

export class RecyclerRepository {
  private readonly yieldsMemoryCache = new Map<string, BatchYieldsRecord>();

  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string): Promise<Recycler | null> {
    return this.db.recycler.findUnique({
      where: { id },
      include: {
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

  async findByUserId(userId: string): Promise<Recycler | null> {
    return this.db.recycler.findUnique({
      where: { userId },
      include: {
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

  async findBatchById(batchId: string): Promise<
    | (Batch & {
        hub: { id: string; name: string; address: string };
        category: { id: string; code: string; name: string };
        recycler: { id: string; companyName: string; licenseNumber: string } | null;
        eprRecord: EprRecord | null;
      })
    | null
  > {
    return this.db.batch.findUnique({
      where: { id: batchId },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async updateBatchStatus(
    batchId: string,
    status: BatchStatus,
    recyclerId?: string,
    receivedAt?: Date,
    tx?: Prisma.TransactionClient
  ): Promise<Batch> {
    const client = tx ?? this.db;
    return client.batch.update({
      where: { id: batchId },
      data: {
        status,
        ...(recyclerId ? { recyclerId } : {}),
        ...(receivedAt ? { receivedAt } : {}),
      },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async recordBatchYields(
    batchId: string,
    recyclerId: string,
    yieldsData: BatchYieldsRecord,
    userId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.db;

    // Cache locally for instantaneous access
    this.yieldsMemoryCache.set(batchId, yieldsData);

    // Update batch status to PROCESSED
    await client.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.PROCESSED,
        recyclerId,
      },
    });

    // Write immutable compliance audit log snapshot
    await client.auditLog.create({
      data: {
        action: 'BATCH_YIELDS_RECORDED',
        entityType: 'Batch',
        entityId: batchId,
        newValue: yieldsData as unknown as Prisma.InputJsonValue,
        userId: userId ?? null,
      },
    });
  }

  async getYieldsForBatch(batchId: string): Promise<BatchYieldsRecord | null> {
    const cached = this.yieldsMemoryCache.get(batchId);
    if (cached) {
      return cached;
    }

    const log = await this.db.auditLog.findFirst({
      where: {
        entityType: 'Batch',
        entityId: batchId,
        action: 'BATCH_YIELDS_RECORDED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log || !log.newValue) {
      return null;
    }

    const data = log.newValue as unknown as BatchYieldsRecord;
    this.yieldsMemoryCache.set(batchId, data);
    return data;
  }

  async listBatchesForRecycler(
    recyclerId: string,
    status?: BatchStatus
  ): Promise<
    Array<
      Batch & {
        hub: { id: string; name: string; address: string };
        category: { id: string; code: string; name: string };
        recycler: { id: string; companyName: string; licenseNumber: string } | null;
        eprRecord: EprRecord | null;
      }
    >
  > {
    return this.db.batch.findMany({
      where: {
        OR: [
          { recyclerId },
          // Also show batches that are ready for intake (SEALED, IN_TRANSIT) if unassigned
          { recyclerId: null, status: { in: [BatchStatus.SEALED, BatchStatus.IN_TRANSIT] } },
        ],
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        hub: { select: { id: true, name: true, address: true } },
        category: { select: { id: true, code: true, name: true } },
        recycler: { select: { id: true, companyName: true, licenseNumber: true } },
        eprRecord: true,
      },
    });
  }

  async createEprRecord(
    data: {
      batchId: string;
      recyclerId: string;
      certificateNumber: string;
      certifiedWeightKg: number;
      issuedTo: string;
      certificateUrl: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<EprRecord> {
    const client = tx ?? this.db;
    return client.eprRecord.create({
      data: {
        batchId: data.batchId,
        recyclerId: data.recyclerId,
        certificateNumber: data.certificateNumber,
        certifiedWeightKg: new Prisma.Decimal(data.certifiedWeightKg.toFixed(3)),
        issuedTo: data.issuedTo,
        certificateUrl: data.certificateUrl,
      },
      include: {
        batch: {
          include: {
            hub: true,
            category: true,
          },
        },
        recycler: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findEprRecordByCertificateNumber(certificateNumber: string): Promise<
    | (EprRecord & {
        batch: Batch & { hub: { id: string; name: string; address: string }; category: { id: string; code: string; name: string } };
        recycler: Recycler & { user: { fullName: string; phone: string; email: string | null } };
      })
    | null
  > {
    return this.db.eprRecord.findUnique({
      where: { certificateNumber },
      include: {
        batch: {
          include: {
            hub: { select: { id: true, name: true, address: true } },
            category: { select: { id: true, code: true, name: true } },
          },
        },
        recycler: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findEprRecordById(id: string): Promise<
    | (EprRecord & {
        batch: Batch & { hub: { id: string; name: string; address: string }; category: { id: string; code: string; name: string } };
        recycler: Recycler & { user: { fullName: string; phone: string; email: string | null } };
      })
    | null
  > {
    return this.db.eprRecord.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            hub: { select: { id: true, name: true, address: true } },
            category: { select: { id: true, code: true, name: true } },
          },
        },
        recycler: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findEprRecordByBatchId(batchId: string): Promise<EprRecord | null> {
    return this.db.eprRecord.findUnique({
      where: { batchId },
    });
  }
}

export const recyclerRepository = new RecyclerRepository();
