import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, BatchStatus, CpcbSyncStatus, Prisma } from '@prisma/client';
import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';

const mockRecyclerUser = {
  id: 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
  fullName: 'Dr. Sunita Rao (Recycler Lead)',
  phone: '9876543201',
  role: Role.RECYCLER,
};

const mockAdminUser = {
  id: 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
  fullName: 'Rajesh Admin',
  phone: '9876543202',
  role: Role.ADMIN,
};

const mockConsumerUser = {
  id: 'cccccccc-3333-3333-3333-cccccccccccc',
  fullName: 'Pooja Consumer',
  phone: '9876543203',
  role: Role.CONSUMER,
};

const mockRecyclerId = 'dddddddd-4444-4444-4444-dddddddddddd';
const mockBatchId = 'eeeeeeee-5555-5555-5555-eeeeeeeeeeee';
const mockHubId = 'ffffffff-6666-6666-6666-ffffffffffff';
const mockCategoryId = '99999999-7777-7777-7777-999999999999';

interface MockBatchRecord {
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
  eprRecord?: MockEprRecord | null;
}

interface MockEprRecord {
  id: string;
  batchId: string;
  recyclerId: string;
  certificateNumber: string;
  certifiedWeightKg: Prisma.Decimal;
  issuedTo: string;
  certificateUrl: string;
  cpcbSyncStatus: CpcbSyncStatus;
  issuedAt: Date;
  batch?: MockBatchRecord;
  recycler?: {
    id: string;
    companyName: string;
    licenseNumber: string;
    address: string;
    city: string;
    state: string;
    contactNumber: string;
    user: { fullName: string; phone: string; email: string | null };
  };
}

let mockBatches: MockBatchRecord[] = [];
let mockEprRecords: MockEprRecord[] = [];
let mockAuditLogs: Array<{
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  newValue: unknown;
  createdAt: Date;
}> = [];

vi.mock('../../src/config/prisma', () => {
  const mockDb = {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb),
    recycler: {
      findUnique: async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.id === mockRecyclerId || where.userId === mockRecyclerUser.id) {
          return {
            id: mockRecyclerId,
            userId: mockRecyclerUser.id,
            companyName: 'EcoTech Metallurgical Solutions',
            licenseNumber: 'CPCB-REG-2024-BLR-089',
            address: 'Peenya Industrial Area Phase II',
            city: 'Bengaluru',
            state: 'Karnataka',
            contactNumber: '080-28394000',
            verificationStatus: 'VERIFIED',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: mockRecyclerUser.id,
              fullName: mockRecyclerUser.fullName,
              phone: mockRecyclerUser.phone,
              email: 'sunita.rao@ecotech.in',
            },
          };
        }
        return null;
      },
    },
    batch: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const batch = mockBatches.find((b) => b.id === where.id);
        if (!batch) return null;
        const epr = mockEprRecords.find((e) => e.batchId === batch.id) || null;
        return {
          ...batch,
          hub: { id: mockHubId, name: 'Bengaluru South Hub', address: 'Koramangala, Bengaluru' },
          category: { id: mockCategoryId, code: 'METALS', name: 'Metals & Circuit Scrap' },
          recycler: batch.recyclerId ? { id: mockRecyclerId, companyName: 'EcoTech Metallurgical Solutions', licenseNumber: 'CPCB-REG-2024-BLR-089' } : null,
          eprRecord: epr,
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<MockBatchRecord> }) => {
        const batch = mockBatches.find((b) => b.id === where.id);
        if (!batch) throw new Error('Batch not found');
        Object.assign(batch, data);
        const epr = mockEprRecords.find((e) => e.batchId === batch.id) || null;
        return {
          ...batch,
          hub: { id: mockHubId, name: 'Bengaluru South Hub', address: 'Koramangala, Bengaluru' },
          category: { id: mockCategoryId, code: 'METALS', name: 'Metals & Circuit Scrap' },
          recycler: batch.recyclerId ? { id: mockRecyclerId, companyName: 'EcoTech Metallurgical Solutions', licenseNumber: 'CPCB-REG-2024-BLR-089' } : null,
          eprRecord: epr,
        };
      },
      findMany: async () => {
        return mockBatches.map((b) => ({
          ...b,
          hub: { id: mockHubId, name: 'Bengaluru South Hub', address: 'Koramangala, Bengaluru' },
          category: { id: mockCategoryId, code: 'METALS', name: 'Metals & Circuit Scrap' },
          recycler: b.recyclerId ? { id: mockRecyclerId, companyName: 'EcoTech Metallurgical Solutions', licenseNumber: 'CPCB-REG-2024-BLR-089' } : null,
          eprRecord: mockEprRecords.find((e) => e.batchId === b.id) || null,
        }));
      },
    },
    eprRecord: {
      create: async ({ data }: { data: { batchId: string; recyclerId: string; certificateNumber: string; certifiedWeightKg: Prisma.Decimal; issuedTo: string; certificateUrl: string } }) => {
        const record: MockEprRecord = {
          id: `epr-${Date.now()}`,
          batchId: data.batchId,
          recyclerId: data.recyclerId,
          certificateNumber: data.certificateNumber,
          certifiedWeightKg: data.certifiedWeightKg,
          issuedTo: data.issuedTo,
          certificateUrl: data.certificateUrl,
          cpcbSyncStatus: CpcbSyncStatus.LOCAL_ONLY,
          issuedAt: new Date(),
        };
        mockEprRecords.push(record);
        return record;
      },
      findUnique: async ({ where }: { where: { certificateNumber?: string; id?: string; batchId?: string } }) => {
        const rec = mockEprRecords.find(
          (e) => (where.certificateNumber && e.certificateNumber === where.certificateNumber) ||
                 (where.id && e.id === where.id) ||
                 (where.batchId && e.batchId === where.batchId)
        );
        if (!rec) return null;
        return {
          ...rec,
          batch: {
            id: mockBatchId,
            batchCode: 'BATCH-2026-BLR-089',
            grossWeightKg: new Prisma.Decimal('1300.000'),
            netWeightKg: new Prisma.Decimal('1250.000'),
            status: BatchStatus.PROCESSED,
            hub: { id: mockHubId, name: 'Bengaluru South Hub', address: 'Koramangala, Bengaluru' },
            category: { id: mockCategoryId, code: 'METALS', name: 'Metals & Circuit Scrap' },
          },
          recycler: {
            id: mockRecyclerId,
            companyName: 'EcoTech Metallurgical Solutions',
            licenseNumber: 'CPCB-REG-2024-BLR-089',
            address: 'Peenya Industrial Area Phase II',
            city: 'Bengaluru',
            state: 'Karnataka',
            contactNumber: '080-28394000',
            user: { fullName: mockRecyclerUser.fullName, phone: mockRecyclerUser.phone, email: 'sunita.rao@ecotech.in' },
          },
        };
      },
    },
    auditLog: {
      create: async ({ data }: { data: { action: string; entityType: string; entityId: string; newValue: unknown } }) => {
        const entry = { id: `audit-${Date.now()}`, ...data, createdAt: new Date() };
        mockAuditLogs.push(entry);
        return entry;
      },
      findFirst: async ({ where }: { where: { entityType?: string; entityId?: string; action?: string } }) => {
        return mockAuditLogs.find(
          (a) => (!where.entityType || a.entityType === where.entityType) &&
                 (!where.entityId || a.entityId === where.entityId) &&
                 (!where.action || a.action === where.action)
        ) || null;
      },
    },
  };

  return { prisma: mockDb };
});

describe('Integration Tests: Recycler Processing & CPCB EPR Engine', () => {
  const app = createApp();

  const recyclerToken = tokenService.generateAccessToken({
    userId: mockRecyclerUser.id,
    role: Role.RECYCLER,
    phone: mockRecyclerUser.phone,
  });

  const adminToken = tokenService.generateAccessToken({
    userId: mockAdminUser.id,
    role: Role.ADMIN,
    phone: mockAdminUser.phone,
  });

  const consumerToken = tokenService.generateAccessToken({
    userId: mockConsumerUser.id,
    role: Role.CONSUMER,
    phone: mockConsumerUser.phone,
  });

  beforeEach(() => {
    mockBatches = [
      {
        id: mockBatchId,
        batchCode: 'BATCH-2026-BLR-089',
        hubId: mockHubId,
        recyclerId: mockRecyclerId,
        categoryId: mockCategoryId,
        grossWeightKg: new Prisma.Decimal('1300.000'),
        netWeightKg: new Prisma.Decimal('1250.000'),
        status: BatchStatus.SEALED,
        qrCode: `ecotrace://batch/${mockBatchId}`,
        manifestUrl: null,
        shippedAt: new Date(),
        receivedAt: null,
        createdAt: new Date(),
      },
    ];
    mockEprRecords = [];
    mockAuditLogs = [];
  });

  describe('1. Batch Inbound & Receipt (PATCH /api/v1/recyclers/batches/:batchId/receive)', () => {
    it('should transition SEALED batch to RECEIVED status when called by authorized recycler', async () => {
      const res = await request(app)
        .patch(`/api/v1/recyclers/batches/${mockBatchId}/receive`)
        .set('Authorization', `Bearer ${recyclerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BatchStatus.RECEIVED);
      expect(res.body.data.recyclerId).toBe(mockRecyclerId);
    });

    it('should forbid CONSUMER from receiving batches (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/recyclers/batches/${mockBatchId}/receive`)
        .set('Authorization', `Bearer ${consumerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app)
        .patch(`/api/v1/recyclers/batches/${mockBatchId}/receive`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Yield Recovery & Mass Balance Validation (POST /api/v1/recyclers/batches/:batchId/process)', () => {
    beforeEach(async () => {
      // Mark batch as RECEIVED first
      mockBatches[0].status = BatchStatus.RECEIVED;
      mockBatches[0].receivedAt = new Date();
    });

    it('should reject yield entries that violate mass balance by > 1% (422 Validation Error)', async () => {
      // Batch net weight is 1,250 kg. Max allowed 1% margin is 1,262.5 kg.
      // Providing 1,300 kg total yield violates mass conservation.
      const payload = {
        copperKg: 300,
        goldKg: 1.0,
        aluminumKg: 500,
        plasticKg: 400,
        wasteKg: 99, // Total = 1,300 kg
      };

      const res = await request(app)
        .post(`/api/v1/recyclers/batches/${mockBatchId}/process`)
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/Mass balance conservation violation/i);
    });

    it('should successfully record yields and transition batch to PROCESSED when mass balance holds', async () => {
      // Total yield = 184.2 + 0.048 + 591.3 + 412.0 + 62.452 = 1,250.0 kg
      const payload = {
        copperKg: 184.2,
        goldKg: 0.048,
        aluminumKg: 591.3,
        plasticKg: 412.0,
        wasteKg: 62.452,
      };

      const res = await request(app)
        .post(`/api/v1/recyclers/batches/${mockBatchId}/process`)
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BatchStatus.PROCESSED);
      expect(res.body.data.yields.totalOutputYieldKg).toBeCloseTo(1250.0, 1);
      expect(res.body.data.yields.massBalancePercentage).toBeCloseTo(100.0, 1);
      expect(res.body.data.yields.certifiedWeightKg).toBeCloseTo(1187.548, 1);

      // Verify batch in mock database is updated to PROCESSED
      expect(mockBatches[0].status).toBe(BatchStatus.PROCESSED);
    });
  });

  describe('3. CPCB-Compliant EPR Certificate Generation (POST /api/v1/epr)', () => {
    beforeEach(async () => {
      // Prepare batch in PROCESSED status
      mockBatches[0].status = BatchStatus.PROCESSED;
      mockBatches[0].receivedAt = new Date();
    });

    it('should generate tamper-evident CPCB EPR certificate with SHA-256 hash', async () => {
      const payload = {
        batchId: mockBatchId,
        issuedTo: 'Samsung Electronics India Ltd',
      };

      const res = await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateNumber).toMatch(/^CPCB-EPR-2026-[A-F0-9]{8}$/);
      expect(res.body.data.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
      expect(res.body.data.issuedTo).toBe('Samsung Electronics India Ltd');
      expect(res.body.data.certifiedWeightKg).toBeGreaterThan(0);
      expect(res.body.data.certificateUrl).toContain(`/api/v1/epr/${mockBatchId}/download`);
    });

    it('should forbid duplicate EPR certificate issuance for the same batch (409 Conflict)', async () => {
      // First issuance
      await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          batchId: mockBatchId,
          issuedTo: 'Samsung Electronics India Ltd',
        });

      // Attempt duplicate issuance
      const res = await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          batchId: mockBatchId,
          issuedTo: 'Apple India Pvt Ltd',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toMatch(/already issued/i);
    });

    it('should forbid CONSUMER role from generating EPR certificates (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          batchId: mockBatchId,
          issuedTo: 'Apple India Pvt Ltd',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Public Certificate Verification (GET /api/v1/epr/verify/:certificateNumber)', () => {
    let certNumber: string;
    let expectedHash: string;

    beforeEach(async () => {
      mockBatches[0].status = BatchStatus.PROCESSED;
      const res = await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          batchId: mockBatchId,
          issuedTo: 'Dell Technologies India',
        });
      certNumber = res.body.data.certificateNumber;
      expectedHash = res.body.data.sha256Hash;
    });

    it('should publicly verify certificate without authentication headers', async () => {
      const res = await request(app)
        .get(`/api/v1/epr/verify/${certNumber}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.certificateNumber).toBe(certNumber);
      expect(res.body.data.sha256Hash).toBe(expectedHash);
      expect(res.body.data.issuedTo).toBe('Dell Technologies India');
      expect(res.body.data.recycler.companyName).toBe('EcoTech Metallurgical Solutions');
      expect(res.body.data.batch.batchCode).toBe('BATCH-2026-BLR-089');
    });

    it('should return 404 for nonexistent certificate number', async () => {
      const res = await request(app)
        .get('/api/v1/epr/verify/CPCB-EPR-2026-NONEXIST');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Certificate PDF Download (GET /api/v1/epr/:id/download)', () => {
    let eprRecordId: string;

    beforeEach(async () => {
      mockBatches[0].status = BatchStatus.PROCESSED;
      const res = await request(app)
        .post('/api/v1/epr')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          batchId: mockBatchId,
          issuedTo: 'HP India Sales Pvt Ltd',
        });
      eprRecordId = res.body.data.id;
    });

    it('should download the generated PDF certificate with correct headers', async () => {
      const res = await request(app)
        .get(`/api/v1/epr/${eprRecordId}/download`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=.*\.pdf/);
      expect(res.body).toBeInstanceOf(Buffer);

      // Verify PDF header magic bytes
      const header = (res.body as Buffer).subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });
  });

  describe('6. Recycler Batches Listing (GET /api/v1/recyclers/batches)', () => {
    it('should return batches accessible to the recycler', async () => {
      const res = await request(app)
        .get('/api/v1/recyclers/batches')
        .set('Authorization', `Bearer ${recyclerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].batchCode).toBe('BATCH-2026-BLR-089');
    });
  });
});
