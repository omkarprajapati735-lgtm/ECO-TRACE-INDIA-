import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, PickupStatus, BatchStatus, Prisma } from '@prisma/client';
import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';

const mockHubManager = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  fullName: 'Anil Verma (Hub Manager)',
  phone: '9876543201',
  role: Role.HUB_MANAGER,
};

const mockAdminUser = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  fullName: 'Rajesh Admin',
  phone: '9876543202',
  role: Role.ADMIN,
};

const mockConsumerUser = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  fullName: 'Pooja Consumer',
  phone: '9876543203',
  role: Role.CONSUMER,
};

const mockCollector = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  userId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  fullName: 'Suresh Kabadiwala',
  phone: '9876543204',
};

const mockHubId = '11111111-2222-3333-4444-555555555555';
const mockCategoryId = '66666666-7777-8888-9999-000000000000';
const mockPickupId = '77777777-8888-9999-aaaa-bbbbbbbbbbbb';

interface MockPickupType {
  id: string;
  collectorId: string | null;
  hubId: string | null;
  status: PickupStatus;
  items: Array<{
    id: string;
    pickupId: string;
    categoryId: string;
    actualWeightKg: Prisma.Decimal | null;
    estimatedWeightKg: Prisma.Decimal;
    pricePerKg: Prisma.Decimal;
    totalAmount: Prisma.Decimal | null;
    imageProofUrl: string | null;
    category: { id: string; code: string; name: string };
  }>;
  collector?: {
    id: string;
    user: { fullName: string; phone: string };
  };
}

interface MockInventoryType {
  id: string;
  hubId: string;
  categoryId: string;
  storageBin: string;
  quantityKg: Prisma.Decimal;
  updatedAt: Date;
  category: { id: string; code: string; name: string; baseRatePerKg: Prisma.Decimal };
}

interface MockBatchType {
  id: string;
  batchCode: string;
  hubId: string;
  recyclerId: string | null;
  categoryId: string;
  grossWeightKg: Prisma.Decimal;
  netWeightKg: Prisma.Decimal;
  status: BatchStatus;
  qrCode: string;
  manifestUrl: string | null;
  shippedAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  hub?: { id: string; name: string; address: string };
  category?: { id: string; code: string; name: string };
  recycler?: { id: string; companyName: string; licenseNumber: string } | null;
  eprRecord?: unknown;
}

let mockPickups: MockPickupType[] = [];
let mockInventory: MockInventoryType[] = [];
let mockBatches: MockBatchType[] = [];

vi.mock('../../src/config/prisma', () => {
  const mockDb = {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb),
    hub: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === mockHubId) {
          return {
            id: mockHubId,
            name: 'Gurugram Aggregation Hub',
            managerId: mockHubManager.id,
            address: 'Sector 18, Industrial Area',
            latitude: 28.48,
            longitude: 77.08,
            storageCapacityKg: new Prisma.Decimal(5000),
            licenseNumber: 'HUB-GUR-01',
            status: 'ACTIVE',
            manager: mockHubManager,
            inventoryItems: mockInventory,
          };
        }
        return null;
      },
    },
    pickup: {
      findMany: async ({ where }: { where: { collectorId?: string; id?: { in: string[] } } }) => {
        if (where?.id?.in) {
          return mockPickups.filter((p) => where.id!.in.includes(p.id));
        }
        if (where?.collectorId) {
          return mockPickups.filter((p) => p.collectorId === where.collectorId);
        }
        return mockPickups;
      },
      updateMany: async ({ where, data }: { where: { id: { in: string[] } }; data: { status: PickupStatus; hubId?: string } }) => {
        let count = 0;
        for (const p of mockPickups) {
          if (where.id.in.includes(p.id)) {
            p.status = data.status;
            if (data.hubId) p.hubId = data.hubId;
            count++;
          }
        }
        return { count };
      },
    },
    inventoryItem: {
      findMany: async () => mockInventory,
      findUnique: async ({ where }: { where: { hubId_categoryId_storageBin?: { hubId: string; categoryId: string; storageBin: string } } }) => {
        if (where?.hubId_categoryId_storageBin) {
          const k = where.hubId_categoryId_storageBin;
          return mockInventory.find((i) => i.hubId === k.hubId && i.categoryId === k.categoryId && i.storageBin === k.storageBin) || null;
        }
        return null;
      },
      upsert: async ({ where, update, create }: { where: { hubId_categoryId_storageBin: { hubId: string; categoryId: string; storageBin: string } }; update: { quantityKg: { increment: Prisma.Decimal } }; create: { hubId: string; categoryId: string; storageBin: string; quantityKg: Prisma.Decimal } }) => {
        const k = where.hubId_categoryId_storageBin;
        let item = mockInventory.find((i) => i.hubId === k.hubId && i.categoryId === k.categoryId && i.storageBin === k.storageBin);
        if (item) {
          item.quantityKg = new Prisma.Decimal(Number(item.quantityKg) + Number(update.quantityKg.increment));
        } else {
          item = {
            id: `inv-${Date.now()}`,
            hubId: create.hubId,
            categoryId: create.categoryId,
            storageBin: create.storageBin,
            quantityKg: create.quantityKg,
            updatedAt: new Date(),
            category: { id: mockCategoryId, code: 'PCB_HIGH_GRADE', name: 'High Grade PCB', baseRatePerKg: new Prisma.Decimal(450) },
          };
          mockInventory.push(item);
        }
        return item;
      },
      update: async ({ where, data }: { where: { hubId_categoryId_storageBin: { hubId: string; categoryId: string; storageBin: string } }; data: { quantityKg: { decrement: Prisma.Decimal } } }) => {
        const k = where.hubId_categoryId_storageBin;
        const item = mockInventory.find((i) => i.hubId === k.hubId && i.categoryId === k.categoryId && i.storageBin === k.storageBin);
        if (item) {
          item.quantityKg = new Prisma.Decimal(Number(item.quantityKg) - Number(data.quantityKg.decrement));
        }
        return item;
      },
    },
    auditLog: {
      create: async ({ data }: { data: unknown }) => ({ id: `audit-${Date.now()}`, ...(data as object) }),
    },
    notification: {
      create: async ({ data }: { data: unknown }) => ({ id: `notif-${Date.now()}`, ...(data as object) }),
    },
    user: {
      findMany: async () => [{ id: mockAdminUser.id }],
    },
    wallet: {
      findByCollectorId: async () => ({
        id: 'wal-1',
        collectorId: mockCollector.id,
        balance: new Prisma.Decimal(100),
        totalEarned: new Prisma.Decimal(100),
        totalWithdrawn: new Prisma.Decimal(0),
        transactions: [],
      }),
      findUnique: async () => ({
        id: 'wal-1',
        collectorId: mockCollector.id,
        balance: new Prisma.Decimal(100),
        totalEarned: new Prisma.Decimal(100),
        totalWithdrawn: new Prisma.Decimal(0),
        transactions: [],
      }),
      create: async () => ({
        id: 'wal-1',
        collectorId: mockCollector.id,
        balance: new Prisma.Decimal(0),
        totalEarned: new Prisma.Decimal(0),
        totalWithdrawn: new Prisma.Decimal(0),
        transactions: [],
      }),
      update: async ({ data }: { data: { balance: { increment: Prisma.Decimal }; totalEarned: { increment: Prisma.Decimal } } }) => ({
        id: 'wal-1',
        collectorId: mockCollector.id,
        balance: new Prisma.Decimal(100 + Number(data.balance.increment)),
        totalEarned: new Prisma.Decimal(100 + Number(data.totalEarned.increment)),
        totalWithdrawn: new Prisma.Decimal(0),
      }),
    },
    walletTransaction: {
      create: async ({ data }: { data: unknown }) => ({ id: `tx-${Date.now()}`, ...(data as object) }),
    },
    batch: {
      create: async ({ data }: { data: { id?: string; batchCode: string; hubId: string; categoryId: string; grossWeightKg: Prisma.Decimal; netWeightKg: Prisma.Decimal; recyclerId?: string | null; qrCode: string; manifestUrl?: string | null; status: BatchStatus } }) => {
        const newBatch: MockBatchType = {
          id: data.id ?? `batch-${Date.now()}`,
          batchCode: data.batchCode,
          hubId: data.hubId,
          recyclerId: data.recyclerId ?? null,
          categoryId: data.categoryId,
          grossWeightKg: data.grossWeightKg,
          netWeightKg: data.netWeightKg,
          status: BatchStatus.OPEN,
          qrCode: data.qrCode,
          manifestUrl: data.manifestUrl ?? null,
          shippedAt: null,
          receivedAt: null,
          createdAt: new Date(),
          hub: { id: mockHubId, name: 'Gurugram Hub', address: 'Sector 18' },
          category: { id: mockCategoryId, code: 'PCB_HIGH_GRADE', name: 'High Grade PCB' },
        };
        mockBatches.push(newBatch);
        return newBatch;
      },
      update: async ({ where, data }: { where: { id: string }; data: { status?: BatchStatus; qrCode?: string; manifestUrl?: string | null } }) => {
        const b = mockBatches.find((x) => x.id === where.id);
        if (b) {
          if (data.status) b.status = data.status;
          if (data.qrCode) b.qrCode = data.qrCode;
          if (data.manifestUrl !== undefined) b.manifestUrl = data.manifestUrl;
        }
        return b;
      },
      findUnique: async ({ where }: { where: { id?: string; batchCode?: string } }) => {
        return mockBatches.find((x) => x.id === where.id || x.batchCode === where.batchCode) || null;
      },
      findMany: async () => mockBatches,
    },
  };

  return { prisma: mockDb };
});

describe('Integration Tests: Epic 6 Hub Operations (TICK-012 & TICK-013)', () => {
  const app = createApp();

  const managerToken = tokenService.generateAccessToken({
    userId: mockHubManager.id,
    role: Role.HUB_MANAGER,
  });

  const consumerToken = tokenService.generateAccessToken({
    userId: mockConsumerUser.id,
    role: Role.CONSUMER,
  });

  beforeEach(() => {
    mockPickups = [
      {
        id: mockPickupId,
        collectorId: mockCollector.id,
        hubId: null,
        status: PickupStatus.COLLECTED,
        collector: {
          id: mockCollector.id,
          user: { fullName: mockCollector.fullName, phone: mockCollector.phone },
        },
        items: [
          {
            id: 'item-1',
            pickupId: mockPickupId,
            categoryId: mockCategoryId,
            actualWeightKg: new Prisma.Decimal(100.0),
            estimatedWeightKg: new Prisma.Decimal(100.0),
            pricePerKg: new Prisma.Decimal(450.0),
            totalAmount: new Prisma.Decimal(45000.0),
            imageProofUrl: 'https://images.ecotrace.in/proof1.jpg',
            category: { id: mockCategoryId, code: 'PCB_HIGH_GRADE', name: 'High Grade PCB' },
          },
        ],
      },
    ];

    mockInventory = [
      {
        id: 'inv-1',
        hubId: mockHubId,
        categoryId: mockCategoryId,
        storageBin: 'Bin C-04',
        quantityKg: new Prisma.Decimal(500.0),
        updatedAt: new Date(),
        category: { id: mockCategoryId, code: 'PCB_HIGH_GRADE', name: 'High Grade PCB', baseRatePerKg: new Prisma.Decimal(450.0) },
      },
    ];

    mockBatches = [];
  });

  describe('TICK-012: Inbound Intake & 5% Discrepancy Engine', () => {
    it('GET /api/v1/hubs/:id/intake/preview -> 401 when unauthenticated', async () => {
      const res = await request(app).get(`/api/v1/hubs/${mockHubId}/intake/preview?collectorId=${mockCollector.id}`);
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/hubs/:id/intake/preview -> 403 when user is CONSUMER', async () => {
      const res = await request(app)
        .get(`/api/v1/hubs/${mockHubId}/intake/preview?collectorId=${mockCollector.id}`)
        .set('Authorization', `Bearer ${consumerToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/v1/hubs/:id/intake/preview -> 200 with dropoff lots for HUB_MANAGER', async () => {
      const res = await request(app)
        .get(`/api/v1/hubs/${mockHubId}/intake/preview?collectorId=${mockCollector.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalClaimedWeightKg).toBe(100.0);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('POST /api/v1/hubs/:id/intake -> 200 ACCEPTED when variance is 4.9% (95.1 kg vs 100 kg claimed)', async () => {
      const res = await request(app)
        .post(`/api/v1/hubs/${mockHubId}/intake`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          collectorId: mockCollector.id,
          verifiedWeightKg: 95.1,
          pickupIds: [mockPickupId],
          storageBin: 'Bin C-04',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');
      expect(res.body.data.discrepancyPercent).toBe(4.9);
      expect(mockPickups[0].status).toBe(PickupStatus.DELIVERED_TO_HUB);
    });

    it('POST /api/v1/hubs/:id/intake -> 200 FLAGGED_DISCREPANCY when variance is 5.1% (94.9 kg vs 100 kg claimed)', async () => {
      const res = await request(app)
        .post(`/api/v1/hubs/${mockHubId}/intake`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          collectorId: mockCollector.id,
          verifiedWeightKg: 94.9,
          pickupIds: [mockPickupId],
          storageBin: 'Bin C-04',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('FLAGGED_DISCREPANCY');
      expect(res.body.data.discrepancyPercent).toBe(5.1);
      expect(mockPickups[0].status).toBe(PickupStatus.FLAGGED_DISCREPANCY);
    });

    it('GET /api/v1/hubs/:id/inventory -> 200 with inventory balances', async () => {
      const res = await request(app)
        .get(`/api/v1/hubs/${mockHubId}/inventory`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('TICK-013: Batch Consolidation & QR Code Manifest', () => {
    it('POST /api/v1/batches -> 201 Created with open batch and initial QR payload', async () => {
      const res = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          hubId: mockHubId,
          categoryId: mockCategoryId,
          grossWeightKg: 200.0,
          netWeightKg: 190.0,
          storageBin: 'Bin C-04',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.batchCode).toMatch(/^BATCH-2026-[A-F0-9]{8}$/);
      expect(res.body.data.qrCode).toMatch(/^ecotrace:\/\/batch\/[0-9a-fA-F-]{36}$/);
      expect(res.body.data.status).toBe(BatchStatus.OPEN);
    });

    it('POST /api/v1/batches/:id/seal -> 200 with SEALED status and QR data URL', async () => {
      // First create a batch
      const createRes = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          hubId: mockHubId,
          categoryId: mockCategoryId,
          grossWeightKg: 100.0,
          netWeightKg: 95.0,
          storageBin: 'Bin C-04',
        });

      const batchId = createRes.body.data.id;

      // Now seal it
      const sealRes = await request(app)
        .post(`/api/v1/batches/${batchId}/seal`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          storageBin: 'Bin C-04',
        });

      expect(sealRes.status).toBe(200);
      expect(sealRes.body.success).toBe(true);
      expect(sealRes.body.data.status).toBe(BatchStatus.SEALED);
      expect(sealRes.body.data.qrCode).toBe(`ecotrace://batch/${batchId}`);
      expect(sealRes.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('GET /api/v1/batches/:id -> 200 with batch and QR code', async () => {
      const createRes = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          hubId: mockHubId,
          categoryId: mockCategoryId,
          grossWeightKg: 50.0,
          netWeightKg: 48.0,
        });

      const batchId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/v1/batches/${batchId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.id).toBe(batchId);
      expect(getRes.body.data.qrCodeDataUrl).toBeDefined();
    });

    it('GET /api/v1/batches -> 200 with list of batches', async () => {
      const res = await request(app)
        .get('/api/v1/batches')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });
});
