import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SeedCategory {
  code: string;
  name: string;
  baseRatePerKg: number;
  minRatePerKg: number;
  maxRatePerKg: number;
  description: string;
}

export const initialCategories: readonly SeedCategory[] = [
  {
    code: 'PCB_HIGH_GRADE',
    name: 'High-Grade Telecom/Server PCBs',
    baseRatePerKg: 450.0,
    minRatePerKg: 400.0,
    maxRatePerKg: 600.0,
    description: 'High-grade telecommunications, server, and mainframe printed circuit boards with gold-plated contacts and high precious metal recovery yields.',
  },
  {
    code: 'PCB_LOW_GRADE',
    name: 'Low-Grade Consumer Electronics PCBs',
    baseRatePerKg: 120.0,
    minRatePerKg: 90.0,
    maxRatePerKg: 160.0,
    description: 'Consumer electronic circuit boards from televisions, radios, power supplies, and general household appliances.',
  },
  {
    code: 'LITHIUM_BATTERY',
    name: 'Lithium-Ion / Polymer Battery Packs',
    baseRatePerKg: 110.0,
    minRatePerKg: 80.0,
    maxRatePerKg: 150.0,
    description: 'Rechargeable lithium-ion and lithium-polymer batteries from laptops, mobile phones, power banks, and electric mobility tools.',
  },
  {
    code: 'DISPLAY_UNIT',
    name: 'LCD / LED Monitors and TV Screens',
    baseRatePerKg: 35.0,
    minRatePerKg: 20.0,
    maxRatePerKg: 50.0,
    description: 'Flat panel liquid crystal displays (LCD) and light-emitting diode (LED) screens from computer monitors and televisions.',
  },
  {
    code: 'MIXED_APPLIANCE',
    name: 'Mixed Small Domestic Appliances',
    baseRatePerKg: 28.0,
    minRatePerKg: 15.0,
    maxRatePerKg: 40.0,
    description: 'Small domestic electrical appliances including microwave ovens, toasters, electric irons, blenders, and vacuum cleaners.',
  },
  {
    code: 'PLASTIC_CASING',
    name: 'Flame-Retardant Electronics Plastics',
    baseRatePerKg: 14.0,
    minRatePerKg: 8.0,
    maxRatePerKg: 22.0,
    description: 'Engineering grade high-impact polystyrene (HIPS) and acrylonitrile butadiene styrene (ABS) plastics used in electronic device housings.',
  },
  {
    code: 'METALS',
    name: 'Copper Coils & Structural Aluminium',
    baseRatePerKg: 280.0,
    minRatePerKg: 220.0,
    maxRatePerKg: 350.0,
    description: 'High-purity non-ferrous structural metals including copper motor windings, power cables, extruded heatsinks, and transformer cores.',
  },
  {
    code: 'OTHER_E_WASTE',
    name: 'Cables, Adapters & Miscellaneous',
    baseRatePerKg: 40.0,
    minRatePerKg: 25.0,
    maxRatePerKg: 60.0,
    description: 'Peripheral connection cables, external AC-DC power adapters, multi-pin chargers, and uncategorized miscellaneous electronic scrap.',
  },
];

export async function seedCategories(): Promise<void> {
  console.log('🌱 [EcoTrace Seed] Upserting 8 standardized Indian e-waste categories...');

  for (const cat of initialCategories) {
    const category = await prisma.wasteCategory.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        baseRatePerKg: cat.baseRatePerKg,
        minRatePerKg: cat.minRatePerKg,
        maxRatePerKg: cat.maxRatePerKg,
        description: cat.description,
        isActive: true,
      },
      create: {
        code: cat.code,
        name: cat.name,
        baseRatePerKg: cat.baseRatePerKg,
        minRatePerKg: cat.minRatePerKg,
        maxRatePerKg: cat.maxRatePerKg,
        description: cat.description,
        isActive: true,
      },
    });

    console.log(`  ✓ Category [${category.code}] synced: ₹${category.baseRatePerKg}/kg (Range: ₹${category.minRatePerKg} - ₹${category.maxRatePerKg})`);
  }

  console.log('✅ [EcoTrace Seed] Successfully seeded 8 categories.');
}

async function main(): Promise<void> {
  try {
    await seedCategories();
  } catch (error) {
    console.error('❌ [EcoTrace Seed] Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
