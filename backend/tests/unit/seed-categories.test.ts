import { describe, it, expect } from 'vitest';
import { initialCategories } from '../../prisma/seed';
import { WASTE_CATEGORIES } from '../../src/constants';

describe('Standard E-Waste Seed Categories', () => {
  it('should contain exactly 8 categories', () => {
    expect(initialCategories).toHaveLength(8);
  });

  it('should include all required category codes from DB_SCHEMA.md', () => {
    const codes = initialCategories.map((c) => c.code);
    expect(codes).toContain('PCB_HIGH_GRADE');
    expect(codes).toContain('PCB_LOW_GRADE');
    expect(codes).toContain('LITHIUM_BATTERY');
    expect(codes).toContain('DISPLAY_UNIT');
    expect(codes).toContain('MIXED_APPLIANCE');
    expect(codes).toContain('PLASTIC_CASING');
    expect(codes).toContain('METALS');
    expect(codes).toContain('OTHER_E_WASTE');
  });

  it('should match constants defined in WASTE_CATEGORIES', () => {
    const definedCodes = Object.values(WASTE_CATEGORIES);
    const seedCodes = initialCategories.map((c) => c.code);
    expect(seedCodes.sort()).toEqual(definedCodes.sort());
  });

  it('should enforce minRate <= baseRate <= maxRate for all categories', () => {
    for (const cat of initialCategories) {
      expect(cat.minRatePerKg).toBeLessThanOrEqual(cat.baseRatePerKg);
      expect(cat.baseRatePerKg).toBeLessThanOrEqual(cat.maxRatePerKg);
      expect(cat.baseRatePerKg).toBeGreaterThan(0);
    }
  });

  it('should enforce specific scrap rates from DB_SCHEMA.md Section 5', () => {
    const pcbHigh = initialCategories.find((c) => c.code === 'PCB_HIGH_GRADE');
    expect(pcbHigh).toBeDefined();
    expect(pcbHigh?.baseRatePerKg).toBe(450.0);
    expect(pcbHigh?.minRatePerKg).toBe(400.0);
    expect(pcbHigh?.maxRatePerKg).toBe(600.0);

    const metals = initialCategories.find((c) => c.code === 'METALS');
    expect(metals).toBeDefined();
    expect(metals?.baseRatePerKg).toBe(280.0);

    const battery = initialCategories.find((c) => c.code === 'LITHIUM_BATTERY');
    expect(battery).toBeDefined();
    expect(battery?.baseRatePerKg).toBe(110.0);
  });
});
