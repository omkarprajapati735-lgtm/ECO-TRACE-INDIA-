import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, PickupStatus, PaymentStatus, Prisma } from '@prisma/client';
import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';

const mockAdminUser = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  fullName: 'Rajesh Admin',
  phone: '9876543201',
  role: Role.ADMIN,
};

const mockConsumerUser = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  fullName: 'Anita Consumer',
  phone: '9876543202',
  role: Role.CONSUMER,
};

const mockPickupId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const mockHubId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const mockCollectorId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

let mockPickups: any[] = [];
let mockAuditLogs: any[] = [];

vi.mock('../../src/config/prisma', () => {
  const mockDb = {
    $transaction: async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb),
    $queryRaw: async () => [{ 1: 1 }],
    pickup: {
      findMany: async ({ where }: { where?: any }) => {
        if (where?.status === PickupStatus.FLAGGED_DISCREPANCY) {
          return mockPickups.filter((p) => p.status === PickupStatus.FLAGGED_DISCREPANCY);
        }
        return mockPickups;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return mockPickups.find((p) => p.id === where.id) ?? null;
      },
      count: async ({ where }: { where?: any }) => {
        if (where?.status === PickupStatus.FLAGGED_DISCREPANCY) {
          return mockPickups.filter((p) => p.status === PickupStatus.FLAGGED_DISCREPANCY).length;
        }
        return mockPickups.length;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = mockPickups.find((p) => p.id === where.id);
        if (item) {
          Object.assign(item, data);
          return item;
        }
        return null;
      },
    },
    payment: {
      aggregate: async () => ({ _sum: { amount: new Prisma.Decimal(125000) } }),
    },
    collector: {
      count: async () => 42,
    },
    wasteCategory: {
      findMany: async () => [
        { id: 'cat-1', code: 'PCB_HIGH_GRADE', name: 'High Grade PCB', isActive: true },
        { id: 'cat-2', code: 'BATTERY_LI_ION', name: 'Lithium Ion Battery', isActive: true },
      ],
    },
    auditLog: {
      findMany: async () => mockAuditLogs,
      create: async ({ data }: { data: any }) => {
        mockAuditLogs.push(data);
        return { id: 'audit-log-1', ...data, createdAt: new Date() };
      },
    },
    inventoryItem: {
      upsert: async () => ({ id: 'inv-item-1' }),
    },
    notification: {
      create: async ({ data }: { data: any }) => ({ id: 'notif-1', ...data }),
    },
  };

  return { prisma: mockDb, default: mockDb };
});

describe('Integration Tests: Admin Governance & Health Check Endpoints (TICK-016 & TICK-017)', () => {
  const app = createApp();
  let adminToken: string;
  let consumerToken: string;

  beforeEach(() => {
    adminToken = tokenService.generateAccessToken({
      userId: mockAdminUser.id,
      role: Role.ADMIN,
      phone: mockAdminUser.phone,
    });
    consumerToken = tokenService.generateAccessToken({
      userId: mockConsumerUser.id,
      role: Role.CONSUMER,
      phone: mockConsumerUser.phone,
    });

    mockPickups = [
      {
        id: mockPickupId,
        status: PickupStatus.FLAGGED_DISCREPANCY,
        hubId: mockHubId,
        collectorId: mockCollectorId,
        notes: 'Excess moisture flagged',
        createdAt: new Date(),
        updatedAt: new Date(),
        collector: {
          id: mockCollectorId,
          collectorType: 'KABADIWALA',
          rating: new Prisma.Decimal(4.9),
          userId: 'usr-collector-1',
          user: { fullName: 'Sunil Kumar', phone: '9876543299' },
        },
        hub: {
          id: mockHubId,
          name: 'Noida Aggregation Hub',
          address: 'Sector 62, Noida',
          manager: { fullName: 'Sanjay Sharma' },
        },
        items: [
          {
            id: 'it-1',
            categoryId: 'cat-1',
            actualWeightKg: new Prisma.Decimal(120),
            estimatedWeightKg: new Prisma.Decimal(120),
            category: { id: 'cat-1', code: 'PCB_HIGH_GRADE', name: 'High Grade PCB' },
          },
        ],
      },
    ];

    mockAuditLogs = [
      {
        id: 'aud-1',
        action: 'HUB_INTAKE_DISCREPANCY_FLAGGED',
        entityType: 'HubIntake',
        newValue: {
          pickupIds: [mockPickupId],
          claimedWeightKg: 120,
          verifiedWeightKg: 132,
          discrepancyPercent: 10,
        },
      },
    ];
  });

  describe('GET /api/v1/admin/analytics', () => {
    it('should return 200 with platform metrics for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platformTonnageKg).toBeDefined();
      expect(res.body.data.totalPayoutsRupees).toBe(125000);
      expect(res.body.data.activeCollectors).toBe(42);
      expect(res.body.data.categoryBreakdown).toBeInstanceOf(Array);
      expect(res.body.data.monthlyTrends).toBeInstanceOf(Array);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for non-admin user role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${consumerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/admin/discrepancies', () => {
    it('should return 200 with flagged lots for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/discrepancies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].pickupId).toBe(mockPickupId);
      expect(res.body.data[0].collector.fullName).toBe('Sunil Kumar');
      expect(res.body.data[0].variancePercent).toBe(10);
    });
  });

  describe('PATCH /api/v1/admin/discrepancies/:id/resolve', () => {
    it('should return 200 and APPROVE discrepancy lot', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/discrepancies/${mockPickupId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution: 'APPROVE', notes: 'Approved following supervisor review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe(PickupStatus.DELIVERED_TO_HUB);
      expect(res.body.data.resolution).toBe('APPROVE');
    });

    it('should return 422 on invalid resolution payload', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/discrepancies/${mockPickupId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution: 'INVALID_RESOLUTION' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 on non-UUID pickup ID', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/discrepancies/not-a-uuid/resolve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolution: 'APPROVE' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/health & Request Logger', () => {
    it('should return 200 with uptime, memory, version, and X-Request-Id header', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.header['x-request-id']).toBeDefined();
      expect(res.body.success).toBe(true);
      expect(res.body.uptime).toBeDefined();
      expect(res.body.memory.heapUsedMb).toBeGreaterThan(0);
      expect(res.body.database.status).toBe('CONNECTED');
    });
  });
});
