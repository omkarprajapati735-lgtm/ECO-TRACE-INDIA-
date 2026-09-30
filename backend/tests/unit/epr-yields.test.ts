import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { BatchStatus, Prisma } from '@prisma/client';
import { RecyclerService } from '../../src/services/recycler.service';
import { EprService } from '../../src/services/epr.service';
import { RecyclerRepository } from '../../src/repositories/recycler.repository';
import { generateEprPdfBuffer, EprPdfData } from '../../src/utils/pdf-generator';
import { ValidationError, ConflictError } from '../../src/errors/app-error';

describe('Unit Tests: Recycler Mass Balance & CPCB EPR Engine', () => {
  const mockRecyclerId = '11111111-1111-1111-1111-111111111111';
  const mockBatchId = '22222222-2222-2222-2222-222222222222';
  const inputNetWeight = 1000.0; // 1,000 kg input batch

  let mockBatch: {
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
    hub: { id: string; name: string; address: string };
    category: { id: string; code: string; name: string };
    recycler: { id: string; companyName: string; licenseNumber: string } | null;
    eprRecord: null;
  };

  let mockRecyclerProfile: {
    id: string;
    userId: string;
    companyName: string;
    licenseNumber: string;
    address: string;
    city: string;
    state: string;
    contactNumber: string;
    verificationStatus: 'VERIFIED';
    createdAt: Date;
    updatedAt: Date;
  };

  let recyclerRepo: RecyclerRepository;
  let recyclerService: RecyclerService;

  beforeEach(() => {
    mockBatch = {
      id: mockBatchId,
      batchCode: 'BATCH-2026-TEST-001',
      hubId: 'hub-001',
      recyclerId: mockRecyclerId,
      categoryId: 'cat-001',
      grossWeightKg: new Prisma.Decimal('1050.000'),
      netWeightKg: new Prisma.Decimal('1000.000'),
      status: BatchStatus.RECEIVED,
      qrCode: 'ecotrace://batch/test-001',
      manifestUrl: null,
      shippedAt: new Date(),
      receivedAt: new Date(),
      createdAt: new Date(),
      hub: { id: 'hub-001', name: 'Bengaluru South Hub', address: 'Koramangala, Bengaluru' },
      category: { id: 'cat-001', code: 'METALS', name: 'Metals & Circuit Scrap' },
      recycler: { id: mockRecyclerId, companyName: 'EcoTech Metallurgical Solutions', licenseNumber: 'CPCB-REG-2026-BLR-01' },
      eprRecord: null,
    };

    mockRecyclerProfile = {
      id: mockRecyclerId,
      userId: 'user-recycler-001',
      companyName: 'EcoTech Metallurgical Solutions',
      licenseNumber: 'CPCB-REG-2026-BLR-01',
      address: 'Plot 45, Peenya Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      contactNumber: '9876543210',
      verificationStatus: 'VERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb = {
      batch: {
        findUnique: async () => mockBatch,
        update: async ({ data }: { data: { status: BatchStatus } }) => {
          mockBatch.status = data.status;
          return mockBatch;
        },
      },
      recycler: {
        findUnique: async () => mockRecyclerProfile,
      },
      auditLog: {
        create: async () => ({ id: 'audit-001' }),
        findFirst: async () => null,
      },
    };

    recyclerRepo = new RecyclerRepository(mockDb as unknown as import('@prisma/client').PrismaClient);
    recyclerService = new RecyclerService(recyclerRepo);
  });

  describe('Mass Balance Conservation Guardrails', () => {
    it('should successfully process yields when total output equals input net weight (100% conservation)', async () => {
      const yields = {
        copperKg: 300,
        goldKg: 0.5,
        aluminumKg: 400,
        plasticKg: 250,
        wasteKg: 49.5, // Total = 1,000 kg
      };

      const result = await recyclerService.processBatchYields(mockBatchId, mockRecyclerId, yields);

      expect(result.status).toBe(BatchStatus.PROCESSED);
      expect(result.yields.totalOutputYieldKg).toBe(1000);
      expect(result.yields.massBalancePercentage).toBe(100);
      expect(result.yields.certifiedWeightKg).toBe(950.5); // 300 + 0.5 + 400 + 250
    });

    it('should pass yields when within acceptable 1% measurement margin (1,010 kg on 1,000 kg batch)', async () => {
      const yields = {
        copperKg: 300,
        goldKg: 1.0,
        aluminumKg: 409,
        plasticKg: 250,
        wasteKg: 50, // Total = 1,010 kg (exactly 101.0%)
      };

      const result = await recyclerService.processBatchYields(mockBatchId, mockRecyclerId, yields);

      expect(result.status).toBe(BatchStatus.PROCESSED);
      expect(result.yields.totalOutputYieldKg).toBe(1010);
      expect(result.yields.massBalancePercentage).toBe(101.0);
    });

    it('should reject yields exceeding the 1% measurement margin (> 1,010 kg) with ValidationError', async () => {
      const invalidYields = {
        copperKg: 300,
        goldKg: 1.0,
        aluminumKg: 410,
        plasticKg: 250,
        wasteKg: 50, // Total = 1,011 kg (101.1% > 101.0%)
      };

      await expect(
        recyclerService.processBatchYields(mockBatchId, mockRecyclerId, invalidYields)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject grossly inflated yields (e.g., 1,200 kg from 1,000 kg input)', async () => {
      const phantomYields = {
        copperKg: 500,
        goldKg: 10,
        aluminumKg: 400,
        plasticKg: 200,
        wasteKg: 90, // Total = 1,200 kg
      };

      await expect(
        recyclerService.processBatchYields(mockBatchId, mockRecyclerId, phantomYields)
      ).rejects.toThrow(/Mass balance conservation violation/i);
    });

    it('should disallow negative yield values', async () => {
      const negativeYields = {
        copperKg: -10,
        goldKg: 0.1,
        aluminumKg: 400,
        plasticKg: 200,
        wasteKg: 50,
      };

      await expect(
        recyclerService.processBatchYields(mockBatchId, mockRecyclerId, negativeYields)
      ).rejects.toThrow(ValidationError);
    });

    it('should disallow total output yield of 0 kg', async () => {
      const zeroYields = {
        copperKg: 0,
        goldKg: 0,
        aluminumKg: 0,
        plasticKg: 0,
        wasteKg: 0,
      };

      await expect(
        recyclerService.processBatchYields(mockBatchId, mockRecyclerId, zeroYields)
      ).rejects.toThrow(/Total recovered yield must be greater than zero/i);
    });

    it('should refuse to process batch if status is not RECEIVED (e.g. SEALED or OPEN)', async () => {
      mockBatch.status = BatchStatus.SEALED;
      const yields = {
        copperKg: 200,
        goldKg: 0.1,
        aluminumKg: 300,
        plasticKg: 400,
        wasteKg: 50,
      };

      await expect(
        recyclerService.processBatchYields(mockBatchId, mockRecyclerId, yields)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('CPCB Form-2 PDF Generation & Cryptographic SHA-256 Fingerprinting', () => {
    const pdfSampleData: EprPdfData = {
      certificateNumber: 'CPCB-EPR-2026-9A8B7C6D',
      issuedTo: 'Samsung Electronics India Ltd',
      issuedAt: new Date('2026-09-30T10:00:00Z'),
      certifiedWeightKg: 950.5,
      qrPayload: 'ecotrace://verify/epr/CPCB-EPR-2026-9A8B7C6D',
      recycler: {
        companyName: 'EcoTech Metallurgical Solutions',
        licenseNumber: 'CPCB-REG-2026-BLR-01',
        address: 'Plot 45, Peenya Industrial Area',
        city: 'Bengaluru',
        state: 'Karnataka',
        contactNumber: '9876543210',
      },
      batch: {
        batchCode: 'BATCH-2026-TEST-001',
        netWeightKg: 1000.0,
        grossWeightKg: 1050.0,
        hubName: 'Bengaluru South Hub',
        categoryName: 'Metals & Circuit Scrap',
      },
      yields: {
        copperKg: 300.0,
        goldKg: 0.5,
        aluminumKg: 400.0,
        plasticKg: 250.0,
        wasteKg: 49.5,
        totalOutputYieldKg: 1000.0,
        massBalancePercentage: 100.0,
      },
    };

    it('should render a valid PDF buffer starting with standard PDF header', async () => {
      const buffer = await generateEprPdfBuffer(pdfSampleData);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(5000); // Realistic PDF with vector graphics & QR is > 5KB
      // Check standard %PDF- header magic bytes
      const header = buffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('should compute a 64-character SHA-256 hex digest for digital fingerprinting', async () => {
      const buffer = await generateEprPdfBuffer(pdfSampleData);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      expect(sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should guarantee cryptographic reproducibility: hashing the same buffer yields the exact same hash', async () => {
      const buffer = await generateEprPdfBuffer(pdfSampleData);
      const hash1 = crypto.createHash('sha256').update(buffer).digest('hex');
      const hash2 = crypto.createHash('sha256').update(buffer).digest('hex');

      expect(hash1).toBe(hash2);
    });

    it('should produce distinct SHA-256 hashes when certificate metadata changes', async () => {
      const buffer1 = await generateEprPdfBuffer(pdfSampleData);
      const buffer2 = await generateEprPdfBuffer({
        ...pdfSampleData,
        certificateNumber: 'CPCB-EPR-2026-DIFFERENT',
        certifiedWeightKg: 850.0,
      });

      const hash1 = crypto.createHash('sha256').update(buffer1).digest('hex');
      const hash2 = crypto.createHash('sha256').update(buffer2).digest('hex');

      expect(hash1).not.toBe(hash2);
    });
  });
});
