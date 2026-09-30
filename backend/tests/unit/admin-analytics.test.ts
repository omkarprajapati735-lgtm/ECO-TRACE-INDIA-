import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PickupStatus, Prisma } from '@prisma/client';
import { AdminService } from '../../src/services/admin.service';
import { AdminRepository } from '../../src/repositories/admin.repository';
import { resolveDiscrepancySchema, discrepancyParamsSchema } from '../../src/validators/admin.validator';
import { NotFoundError, ConflictError } from '../../src/errors/app-error';

describe('Unit Tests: Admin Analytics & Fraud Radar (TICK-016)', () => {
  let mockPrisma: any;
  let adminRepo: AdminRepository;
  let adminService: AdminService;

  const mockPickupId = '00000000-0000-0000-0000-000000000001';
  const mockCollectorId = '00000000-0000-0000-0000-000000000002';
  const mockHubId = '00000000-0000-0000-0000-000000000003';
  const mockAdminId = '00000000-0000-0000-0000-000000000004';

  beforeEach(() => {
    mockPrisma = {
      pickup: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      payment: {
        aggregate: vi.fn(),
      },
      collector: {
        count: vi.fn(),
      },
      wasteCategory: {
        findMany: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      inventoryItem: {
        upsert: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: any) => Promise<unknown>) => cb(mockPrisma)),
    };

    adminRepo = new AdminRepository(mockPrisma);
    adminService = new AdminService(adminRepo);
  });

  describe('Admin Analytics Calculations', () => {
    it('should aggregate platform tonnage, payouts, active collectors and category breakdown', async () => {
      mockPrisma.pickup.findMany.mockResolvedValue([
        {
          id: 'p-1',
          createdAt: new Date(),
          items: [
            { categoryId: 'cat-pcb', actualWeightKg: new Prisma.Decimal(50), estimatedWeightKg: new Prisma.Decimal(50), category: { code: 'PCB_HIGH_GRADE' } },
            { categoryId: 'cat-bat', actualWeightKg: new Prisma.Decimal(30), estimatedWeightKg: new Prisma.Decimal(30), category: { code: 'BATTERY_LI_ION' } },
          ],
        },
      ]);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(45000) } });
      mockPrisma.collector.count.mockResolvedValue(15);
      mockPrisma.pickup.count.mockResolvedValue(2);
      mockPrisma.wasteCategory.findMany.mockResolvedValue([
        { id: 'cat-pcb', name: 'PCB High Grade', code: 'PCB_HIGH_GRADE' },
        { id: 'cat-bat', name: 'Lithium Battery', code: 'BATTERY_LI_ION' },
      ]);

      const analytics = await adminService.getAnalytics();

      expect(analytics.platformTonnageKg).toBe(80);
      expect(analytics.totalPayoutsRupees).toBe(45000);
      expect(analytics.activeCollectors).toBe(15);
      expect(analytics.discrepancyCount).toBe(2);
      expect(analytics.categoryBreakdown).toHaveLength(2);
      expect(analytics.categoryBreakdown[0].percentage).toBe(62.5); // 50 / 80 * 100
      expect(analytics.categoryBreakdown[1].percentage).toBe(37.5); // 30 / 80 * 100
      expect(analytics.monthlyTrends).toBeDefined();
    });
  });

  describe('Discrepancy Radar', () => {
    it('should format flagged discrepancy lots with variance and hub/collector details', async () => {
      mockPrisma.pickup.findMany.mockResolvedValue([
        {
          id: mockPickupId,
          status: PickupStatus.FLAGGED_DISCREPANCY,
          notes: 'Suspected moisture addition',
          createdAt: new Date('2026-09-29T10:00:00Z'),
          collector: {
            id: mockCollectorId,
            collectorType: 'KABADIWALA',
            rating: new Prisma.Decimal(4.8),
            user: { fullName: 'Ramesh Patel', phone: '9876543210' },
          },
          hub: {
            id: mockHubId,
            name: 'Gurugram Central Hub',
            address: 'Sector 18, Gurugram',
            manager: { fullName: 'Anil Verma' },
          },
          items: [
            { actualWeightKg: new Prisma.Decimal(100), estimatedWeightKg: new Prisma.Decimal(100), category: { code: 'PCB_HIGH_GRADE' } },
          ],
        },
      ]);

      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          newValue: { pickupIds: [mockPickupId], claimedWeightKg: 100, verifiedWeightKg: 108.5, discrepancyPercent: 8.5 },
        },
      ]);

      const discrepancies = await adminService.getDiscrepancyRadar();

      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].pickupId).toBe(mockPickupId);
      expect(discrepancies[0].claimedWeightKg).toBe(100);
      expect(discrepancies[0].verifiedWeightKg).toBe(108.5);
      expect(discrepancies[0].variancePercent).toBe(8.5);
      expect(discrepancies[0].collector?.fullName).toBe('Ramesh Patel');
      expect(discrepancies[0].hub?.name).toBe('Gurugram Central Hub');
    });
  });

  describe('Discrepancy Resolution', () => {
    it('should APPROVE discrepancy lot, update status to DELIVERED_TO_HUB, and record audit log', async () => {
      mockPrisma.pickup.findUnique.mockResolvedValue({
        id: mockPickupId,
        status: PickupStatus.FLAGGED_DISCREPANCY,
        hubId: mockHubId,
        collector: { userId: 'usr-collector-1' },
        items: [{ categoryId: 'cat-1', actualWeightKg: new Prisma.Decimal(50) }],
      });

      const res = await adminService.resolveDiscrepancy(mockPickupId, 'APPROVE', 'Verified by re-weighing on certified scale', mockAdminId);

      expect(res.pickupId).toBe(mockPickupId);
      expect(res.previousStatus).toBe(PickupStatus.FLAGGED_DISCREPANCY);
      expect(res.currentStatus).toBe(PickupStatus.DELIVERED_TO_HUB);
      expect(res.resolution).toBe('APPROVE');
      expect(mockPrisma.pickup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPickupId },
          data: expect.objectContaining({ status: PickupStatus.DELIVERED_TO_HUB }),
        })
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should FORFEIT discrepancy lot and cancel pickup', async () => {
      mockPrisma.pickup.findUnique.mockResolvedValue({
        id: mockPickupId,
        status: PickupStatus.FLAGGED_DISCREPANCY,
        hubId: mockHubId,
        collector: { userId: 'usr-collector-1' },
        items: [],
      });

      const res = await adminService.resolveDiscrepancy(mockPickupId, 'FORFEIT', 'Confirmed fraudulent scrap batch', mockAdminId);

      expect(res.currentStatus).toBe(PickupStatus.CANCELLED);
      expect(res.resolution).toBe('FORFEIT');
      expect(mockPrisma.pickup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPickupId },
          data: expect.objectContaining({ status: PickupStatus.CANCELLED }),
        })
      );
    });

    it('should throw NotFoundError if pickup is not found', async () => {
      mockPrisma.pickup.findUnique.mockResolvedValue(null);

      await expect(
        adminService.resolveDiscrepancy('non-existent-id', 'APPROVE')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if pickup is not FLAGGED_DISCREPANCY', async () => {
      mockPrisma.pickup.findUnique.mockResolvedValue({
        id: mockPickupId,
        status: PickupStatus.COMPLETED,
      });

      await expect(
        adminService.resolveDiscrepancy(mockPickupId, 'APPROVE')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Zod Validation Boundaries', () => {
    it('should validate valid resolution payload', () => {
      const valid = resolveDiscrepancySchema.safeParse({ resolution: 'APPROVE', notes: 'Approved after verification' });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid resolution type', () => {
      const invalid = resolveDiscrepancySchema.safeParse({ resolution: 'IGNORE' });
      expect(invalid.success).toBe(false);
    });

    it('should reject invalid UUID param', () => {
      const invalid = discrepancyParamsSchema.safeParse({ id: 'not-a-uuid' });
      expect(invalid.success).toBe(false);
    });
  });
});
