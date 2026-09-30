import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PickupStatus, BatchStatus, Prisma } from '@prisma/client';
import { HubService } from '../../src/services/hub.service';
import { BatchService } from '../../src/services/batch.service';
import { HubRepository, HubWithDetails } from '../../src/repositories/hub.repository';
import { BatchRepository } from '../../src/repositories/batch.repository';
import { WalletService } from '../../src/services/wallet.service';

describe('Unit Tests: Hub Scale Intake & 5% Weight Discrepancy Engine (TICK-012)', () => {
  const mockHubId = 'hub-1111-2222-3333-444444444444';
  const mockCollectorId = 'col-1111-2222-3333-444444444444';
  const mockCategoryId = 'cat-1111-2222-3333-444444444444';
  const mockPickupId = 'pck-1111-2222-3333-444444444444';
  const storageBin = 'Bin A-08';

  const mockHub: HubWithDetails = {
    id: mockHubId,
    name: 'Gurugram Central Hub',
    managerId: 'usr-mgr-1',
    address: 'Sector 18, Gurugram',
    latitude: 28.48,
    longitude: 77.08,
    storageCapacityKg: new Prisma.Decimal(5000),
    licenseNumber: 'HUB-DL-2026-001',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    manager: {
      id: 'usr-mgr-1',
      fullName: 'Anil Verma',
      phone: '9876543210',
      email: 'anil@ecotrace.in',
    },
    inventoryItems: [],
  };

  const createMockPickup = (claimedWeight: number) => ({
    id: mockPickupId,
    consumerId: 'usr-cns-1',
    collectorId: mockCollectorId,
    hubId: null,
    addressId: 'addr-1',
    status: PickupStatus.COLLECTED,
    scheduledDate: new Date(),
    scheduledSlot: '10:00 AM',
    estimatedAmount: new Prisma.Decimal(500),
    finalAmount: new Prisma.Decimal(500),
    latitude: 28.48,
    longitude: 77.08,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    collector: {
      id: mockCollectorId,
      userId: 'usr-col-1',
      user: { fullName: 'Suresh Kumar', phone: '9876543211' },
    },
    items: [
      {
        id: 'item-1',
        pickupId: mockPickupId,
        categoryId: mockCategoryId,
        estimatedWeightKg: new Prisma.Decimal(claimedWeight),
        actualWeightKg: new Prisma.Decimal(claimedWeight),
        pricePerKg: new Prisma.Decimal(50),
        totalAmount: new Prisma.Decimal(claimedWeight * 50),
        imageProofUrl: 'https://images.ecotrace.in/proof1.jpg',
        createdAt: new Date(),
        category: {
          id: mockCategoryId,
          code: 'PCB_HIGH_GRADE',
          name: 'High Grade PCB',
        },
      },
    ],
  });

  let mockHubRepo: HubRepository;
  let mockWalletSvc: WalletService;
  let mockPrismaClient: unknown;
  let hubService: HubService;

  beforeEach(() => {
    mockHubRepo = {
      findById: vi.fn(async () => mockHub),
      getCollectorDropoffLots: vi.fn(),
      findPickupsByIds: vi.fn(async () => [createMockPickup(100.0)]),
      getInventory: vi.fn(),
      findInventoryItem: vi.fn(),
      incrementInventory: vi.fn(async () => ({} as unknown as never)),
      updatePickupsStatus: vi.fn(async () => ({ count: 1 })),
      createDiscrepancyLog: vi.fn(async () => ({} as unknown as never)),
      createIntakeAuditLog: vi.fn(async () => ({} as unknown as never)),
    } as unknown as HubRepository;

    mockWalletSvc = {
      creditCommission: vi.fn(async () => ({
        wallet: {} as never,
        transaction: {} as never,
      })),
    } as unknown as WalletService;

    mockPrismaClient = {
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockPrismaClient)),
    };

    hubService = new HubService(mockHubRepo, mockWalletSvc, mockPrismaClient as never);
  });

  describe('4.9% Tolerance Acceptance', () => {
    it('should accept inbound lot when verified weight is 4.9% below claimed weight (95.1kg vs 100kg)', async () => {
      // claimed = 100kg, verified = 95.1kg => discrepancy = |95.1 - 100| / 100 * 100 = 4.9%
      const result = await hubService.verifyInboundLot(
        mockHubId,
        mockCollectorId,
        95.1,
        [mockPickupId],
        storageBin
      );

      expect(result.status).toBe('ACCEPTED');
      expect(result.discrepancyPercent).toBe(4.9);
      expect(result.claimedWeightKg).toBe(100.0);
      expect(result.verifiedWeightKg).toBe(95.1);
      expect(result.message).toContain('accepted into inventory');
      expect(mockHubRepo.updatePickupsStatus).toHaveBeenCalledWith(
        [mockPickupId],
        PickupStatus.DELIVERED_TO_HUB,
        mockHubId,
        expect.anything()
      );
      expect(mockHubRepo.incrementInventory).toHaveBeenCalledWith(
        mockHubId,
        mockCategoryId,
        storageBin,
        95.1,
        expect.anything()
      );
      expect(mockWalletSvc.creditCommission).toHaveBeenCalled();
      expect(mockHubRepo.createDiscrepancyLog).not.toHaveBeenCalled();
    });

    it('should accept inbound lot when verified weight is 4.9% above claimed weight (104.9kg vs 100kg)', async () => {
      const result = await hubService.verifyInboundLot(
        mockHubId,
        mockCollectorId,
        104.9,
        [mockPickupId],
        storageBin
      );

      expect(result.status).toBe('ACCEPTED');
      expect(result.discrepancyPercent).toBe(4.9);
      expect(mockWalletSvc.creditCommission).toHaveBeenCalled();
    });
  });

  describe('5.0% Exact Boundary Verification', () => {
    it('should accept inbound lot when discrepancy is exactly 5.0% (95.0kg vs 100kg)', async () => {
      // claimed = 100kg, verified = 95.0kg => discrepancy = 5.0%
      const result = await hubService.verifyInboundLot(
        mockHubId,
        mockCollectorId,
        95.0,
        [mockPickupId],
        storageBin
      );

      expect(result.status).toBe('ACCEPTED');
      expect(result.discrepancyPercent).toBe(5.0);
      expect(mockHubRepo.updatePickupsStatus).toHaveBeenCalledWith(
        [mockPickupId],
        PickupStatus.DELIVERED_TO_HUB,
        mockHubId,
        expect.anything()
      );
      expect(mockWalletSvc.creditCommission).toHaveBeenCalled();
    });
  });

  describe('5.1% Discrepancy Lock & Payout Freeze', () => {
    it('should flag discrepancy and freeze payouts when variance is 5.1% below claimed (94.9kg vs 100kg)', async () => {
      // claimed = 100kg, verified = 94.9kg => discrepancy = |94.9 - 100| / 100 * 100 = 5.1%
      const result = await hubService.verifyInboundLot(
        mockHubId,
        mockCollectorId,
        94.9,
        [mockPickupId],
        storageBin
      );

      expect(result.status).toBe('FLAGGED_DISCREPANCY');
      expect(result.discrepancyPercent).toBe(5.1);
      expect(result.message).toContain('Discrepancy exceeds 5% threshold');
      expect(mockHubRepo.updatePickupsStatus).toHaveBeenCalledWith(
        [mockPickupId],
        PickupStatus.FLAGGED_DISCREPANCY,
        mockHubId
      );
      expect(mockHubRepo.createDiscrepancyLog).toHaveBeenCalledWith(
        expect.objectContaining({
          hubId: mockHubId,
          collectorId: mockCollectorId,
          discrepancyPercent: 5.1,
        })
      );
      // Payouts frozen: Wallet commission MUST NOT be credited
      expect(mockWalletSvc.creditCommission).not.toHaveBeenCalled();
      // Inventory MUST NOT be incremented
      expect(mockHubRepo.incrementInventory).not.toHaveBeenCalled();
    });

    it('should flag discrepancy and freeze payouts when variance is 5.1% above claimed (105.1kg vs 100kg)', async () => {
      const result = await hubService.verifyInboundLot(
        mockHubId,
        mockCollectorId,
        105.1,
        [mockPickupId],
        storageBin
      );

      expect(result.status).toBe('FLAGGED_DISCREPANCY');
      expect(result.discrepancyPercent).toBe(5.1);
      expect(mockWalletSvc.creditCommission).not.toHaveBeenCalled();
      expect(mockHubRepo.incrementInventory).not.toHaveBeenCalled();
    });
  });

  describe('Validation & Edge Cases', () => {
    it('should throw NotFoundError if hub does not exist', async () => {
      vi.mocked(mockHubRepo.findById).mockResolvedValueOnce(null);

      await expect(
        hubService.verifyInboundLot(
          'non-existent-hub',
          mockCollectorId,
          98.0,
          [mockPickupId],
          storageBin
        )
      ).rejects.toThrow('not found');
    });

    it('should throw ValidationError if pickup does not belong to collector', async () => {
      vi.mocked(mockHubRepo.findPickupsByIds).mockResolvedValueOnce([
        {
          ...createMockPickup(100.0),
          collectorId: 'different-collector-id',
        } as never,
      ]);

      await expect(
        hubService.verifyInboundLot(
          mockHubId,
          mockCollectorId,
          98.0,
          [mockPickupId],
          storageBin
        )
      ).rejects.toThrow('does not belong to collector');
    });
  });
});

describe('Unit Tests: Batch Consolidation & QR Code Manifest Generator (TICK-013)', () => {
  const mockHubId = 'hub-1111-2222-3333-444444444444';
  const mockCategoryId = 'cat-1111-2222-3333-444444444444';
  const mockBatchId = '99999999-8888-4777-a666-666666666666';

  let mockBatchRepo: BatchRepository;
  let mockHubRepo: HubRepository;
  let mockPrismaClient: unknown;
  let batchService: BatchService;

  const mockBatch = {
    id: mockBatchId,
    batchCode: 'BATCH-2026-A1B2C3D4',
    hubId: mockHubId,
    recyclerId: null,
    categoryId: mockCategoryId,
    grossWeightKg: new Prisma.Decimal(500.0),
    netWeightKg: new Prisma.Decimal(480.0),
    status: BatchStatus.OPEN,
    qrCode: `ecotrace://batch/${mockBatchId}`,
    manifestUrl: null,
    shippedAt: null,
    receivedAt: null,
    createdAt: new Date(),
    hub: { id: mockHubId, name: 'Gurugram Central Hub', address: 'Sector 18' },
    category: { id: mockCategoryId, code: 'PCB_HIGH_GRADE', name: 'High Grade PCB' },
    recycler: null,
    eprRecord: null,
  };

  beforeEach(() => {
    mockBatchRepo = {
      createBatch: vi.fn(async () => mockBatch),
      sealBatch: vi.fn(async () => ({ ...mockBatch, status: BatchStatus.SEALED })),
      findById: vi.fn(async (id: string) => (id === mockBatchId ? mockBatch : null)),
      findByBatchCode: vi.fn(),
      listBatches: vi.fn(async () => [mockBatch]),
      deductInventory: vi.fn(async () => ({} as never)),
      findInventory: vi.fn(async () => [{ storageBin: 'Bin C-04', quantityKg: new Prisma.Decimal(1000) }]),
    } as unknown as BatchRepository;

    mockHubRepo = {
      findById: vi.fn(async () => ({ id: mockHubId } as never)),
      findInventoryItem: vi.fn(async () => ({ quantityKg: new Prisma.Decimal(1000) } as never)),
    } as unknown as HubRepository;

    mockPrismaClient = {
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockPrismaClient)),
    };

    batchService = new BatchService(mockBatchRepo, mockHubRepo, mockPrismaClient as never);
  });

  describe('Batch Code & QR Payload Specification', () => {
    it('should generate unique batch codes matching BATCH-2026-<HEX> format', () => {
      const batchCode1 = batchService.generateBatchCode();
      const batchCode2 = batchService.generateBatchCode();

      expect(batchCode1).toMatch(/^BATCH-2026-[A-F0-9]{8}$/);
      expect(batchCode2).toMatch(/^BATCH-2026-[A-F0-9]{8}$/);
      expect(batchCode1).not.toBe(batchCode2);
    });

    it('should generate valid QR code payload with ecotrace://batch/<UUID> schema and data URL', async () => {
      const result = await batchService.createBatch({
        hubId: mockHubId,
        categoryId: mockCategoryId,
        grossWeightKg: 500.0,
        netWeightKg: 480.0,
      });

      expect(result.qrCode).toMatch(/^ecotrace:\/\/batch\/[0-9a-fA-F-]{36}$/);
      expect(result.qrCodeDataUrl).toBeDefined();
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.status).toBe(BatchStatus.OPEN);
    });

    it('should seal batch, deduct inventory and return SEALED status with QR manifest', async () => {
      const sealed = await batchService.sealBatch(mockBatchId, {
        storageBin: 'Bin C-04',
      });

      expect(mockBatchRepo.deductInventory).toHaveBeenCalledWith(
        mockHubId,
        mockCategoryId,
        'Bin C-04',
        480.0,
        expect.anything()
      );
      expect(mockBatchRepo.sealBatch).toHaveBeenCalledWith(
        mockBatchId,
        mockBatch.batchCode,
        `ecotrace://batch/${mockBatchId}`,
        null,
        expect.anything()
      );
      expect(sealed.qrCode).toBe(`ecotrace://batch/${mockBatchId}`);
      expect(sealed.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should reject batch creation if net weight exceeds gross weight', async () => {
      await expect(
        batchService.createBatch({
          hubId: mockHubId,
          categoryId: mockCategoryId,
          grossWeightKg: 100.0,
          netWeightKg: 150.0, // net > gross
        })
      ).rejects.toThrow('netWeightKg cannot exceed grossWeightKg');
    });
  });
});
