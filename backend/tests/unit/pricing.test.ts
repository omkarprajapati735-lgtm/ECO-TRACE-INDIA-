import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingService, roundToCurrency, roundToWeight } from '../../src/services/pricing.service';
import { NotFoundError } from '../../src/errors/app-error';

// Mock WasteCategory entities conforming to seed data & DB_SCHEMA.md
const mockCategories = [
  {
    id: 'cat-uuid-pcb-high',
    code: 'PCB_HIGH_GRADE',
    name: 'High Grade Circuit Boards & Smartphones',
    description: 'Gold-bearing server/phone PCBs',
    baseRatePerKg: 450.0,
    minRatePerKg: 400.0,
    maxRatePerKg: 600.0,
    isActive: true,
  },
  {
    id: 'cat-uuid-battery',
    code: 'LITHIUM_BATTERY',
    name: 'Lithium-Ion Batteries',
    description: 'Rechargeable Li-ion and Li-Po cells',
    baseRatePerKg: 110.0,
    minRatePerKg: 90.0,
    maxRatePerKg: 140.0,
    isActive: true,
  },
  {
    id: 'cat-uuid-metals',
    code: 'METALS',
    name: 'Metals & Copper Wires',
    description: 'Copper cables, aluminum heat sinks',
    baseRatePerKg: 280.0,
    minRatePerKg: 240.0,
    maxRatePerKg: 320.0,
    isActive: true,
  },
  {
    id: 'cat-uuid-inactive',
    code: 'INACTIVE_CATEGORY',
    name: 'Deprecated Category',
    description: 'Not active',
    baseRatePerKg: 50.0,
    minRatePerKg: 40.0,
    maxRatePerKg: 60.0,
    isActive: false,
  },
];

describe('Unit Tests: PricingService & Valuation Formula', () => {
  let mockPrisma: {
    wasteCategory: {
      findMany: (args: { where: { id?: { in: string[] }; isActive?: boolean } }) => Promise<typeof mockCategories>;
    };
  };
  let pricingService: PricingService;

  beforeEach(() => {
    mockPrisma = {
      wasteCategory: {
        findMany: vi.fn(async ({ where }: { where: { id?: { in: string[] }; isActive?: boolean } }) => {
          return mockCategories.filter((c) => {
            if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
            if (where.id && where.id.in && !where.id.in.includes(c.id)) return false;
            return true;
          });
        }),
      },
    };

    pricingService = new PricingService(mockPrisma as unknown as import('@prisma/client').PrismaClient);
  });

  describe('Utility: roundToCurrency & roundToWeight', () => {
    it('should round floating values to 2 decimal places without precision drift', () => {
      // 0.1 + 0.2 in standard JS is 0.30000000000000004
      expect(roundToCurrency(0.1 + 0.2)).toBe(0.3);
      expect(roundToCurrency(123.456)).toBe(123.46);
      expect(roundToCurrency(123.454)).toBe(123.45);
      expect(roundToCurrency(0)).toBe(0);
    });

    it('should round weights to 3 decimal places', () => {
      expect(roundToWeight(1.23456)).toBe(1.235);
      expect(roundToWeight(0.025)).toBe(0.025);
      expect(roundToWeight(10.1234)).toBe(10.123);
    });
  });

  describe('getActiveCategoriesWithRates', () => {
    it('should fetch only active categories with numeric rate values', async () => {
      const categories = await pricingService.getActiveCategoriesWithRates();
      expect(categories).toHaveLength(3);
      expect(categories.every((c) => c.isActive)).toBe(true);

      const pcb = categories.find((c) => c.code === 'PCB_HIGH_GRADE');
      expect(pcb).toBeDefined();
      expect(pcb?.baseRatePerKg).toBe(450.0);
      expect(pcb?.minRatePerKg).toBe(400.0);
      expect(pcb?.maxRatePerKg).toBe(600.0);
    });
  });

  describe('calculateScrapValuation', () => {
    it('should return 0 amounts for empty item list', async () => {
      const result = await pricingService.calculateScrapValuation([]);
      expect(result.totalEstimatedAmount).toBe(0);
      expect(result.totalMinEstimatedAmount).toBe(0);
      expect(result.totalMaxEstimatedAmount).toBe(0);
      expect(result.totalWeightKg).toBe(0);
      expect(result.itemBreakdown).toEqual([]);
    });

    it('should accurately calculate valuation for a single item (weight * rate)', async () => {
      const items = [{ categoryId: 'cat-uuid-pcb-high', estimatedWeightKg: 2.5 }];
      const result = await pricingService.calculateScrapValuation(items);

      // base: 2.5 * 450 = 1125.00
      // min: 2.5 * 400 = 1000.00
      // max: 2.5 * 600 = 1500.00
      expect(result.totalWeightKg).toBe(2.5);
      expect(result.totalEstimatedAmount).toBe(1125.0);
      expect(result.totalMinEstimatedAmount).toBe(1000.0);
      expect(result.totalMaxEstimatedAmount).toBe(1500.0);

      expect(result.itemBreakdown).toHaveLength(1);
      expect(result.itemBreakdown[0].categoryCode).toBe('PCB_HIGH_GRADE');
      expect(result.itemBreakdown[0].estimatedAmount).toBe(1125.0);
      expect(result.itemBreakdown[0].minEstimatedAmount).toBe(1000.0);
      expect(result.itemBreakdown[0].maxEstimatedAmount).toBe(1500.0);
    });

    it('should accurately aggregate multiple items across categories', async () => {
      const items = [
        { categoryId: 'cat-uuid-pcb-high', estimatedWeightKg: 1.0 }, // 450, min 400, max 600
        { categoryId: 'cat-uuid-battery', estimatedWeightKg: 3.5 },  // 3.5 * 110 = 385, min 3.5 * 90 = 315, max 3.5 * 140 = 490
        { categoryId: 'cat-uuid-metals', estimatedWeightKg: 5.0 },   // 5 * 280 = 1400, min 5 * 240 = 1200, max 5 * 320 = 1600
      ];

      const result = await pricingService.calculateScrapValuation(items);

      // Total weight: 1.0 + 3.5 + 5.0 = 9.5 kg
      expect(result.totalWeightKg).toBe(9.5);
      // Total base: 450 + 385 + 1400 = 2235.00
      expect(result.totalEstimatedAmount).toBe(2235.0);
      // Total min: 400 + 315 + 1200 = 1915.00
      expect(result.totalMinEstimatedAmount).toBe(1915.0);
      // Total max: 600 + 490 + 1600 = 2690.00
      expect(result.totalMaxEstimatedAmount).toBe(2690.0);
    });

    it('should handle fractional precision weights (e.g. 0.025 kg) without floating inaccuracies', async () => {
      const items = [{ categoryId: 'cat-uuid-pcb-high', estimatedWeightKg: 0.025 }];
      const result = await pricingService.calculateScrapValuation(items);

      // 0.025 * 450 = 11.25
      // 0.025 * 400 = 10.00
      // 0.025 * 600 = 15.00
      expect(result.totalWeightKg).toBe(0.025);
      expect(result.totalEstimatedAmount).toBe(11.25);
      expect(result.totalMinEstimatedAmount).toBe(10.0);
      expect(result.totalMaxEstimatedAmount).toBe(15.0);
    });

    it('should throw NotFoundError if a category does not exist', async () => {
      const items = [{ categoryId: 'non-existent-uuid', estimatedWeightKg: 2.0 }];
      await expect(pricingService.calculateScrapValuation(items)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if category exists but isActive is false', async () => {
      const items = [{ categoryId: 'cat-uuid-inactive', estimatedWeightKg: 2.0 }];
      await expect(pricingService.calculateScrapValuation(items)).rejects.toThrow(NotFoundError);
    });
  });
});
