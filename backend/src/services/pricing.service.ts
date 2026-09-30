import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';
import { PricingItemInput, ScrapValuationResult, WasteCategoryDto } from '../types';
import { NotFoundError } from '../errors/app-error';

export function roundToCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function roundToWeight(weight: number): number {
  return Math.round((weight + Number.EPSILON) * 1000) / 1000;
}

export class PricingService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async getActiveCategoriesWithRates(): Promise<WasteCategoryDto[]> {
    const categories = await this.db.wasteCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      baseRatePerKg: Number(c.baseRatePerKg),
      minRatePerKg: Number(c.minRatePerKg),
      maxRatePerKg: Number(c.maxRatePerKg),
      isActive: c.isActive,
    }));
  }

  async calculateScrapValuation(items: PricingItemInput[]): Promise<ScrapValuationResult> {
    if (!items || items.length === 0) {
      return {
        totalEstimatedAmount: 0,
        totalMinEstimatedAmount: 0,
        totalMaxEstimatedAmount: 0,
        totalWeightKg: 0,
        itemBreakdown: [],
      };
    }

    const categoryIds = Array.from(new Set(items.map((i) => i.categoryId)));

    const categories = await this.db.wasteCategory.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    for (const item of items) {
      if (!categoryMap.has(item.categoryId)) {
        throw new NotFoundError(
          `Waste category '${item.categoryId}' is either not found or inactive`
        );
      }
    }

    let totalEstimated = 0;
    let totalMinEstimated = 0;
    let totalMaxEstimated = 0;
    let totalWeight = 0;

    const itemBreakdown = items.map((item) => {
      const cat = categoryMap.get(item.categoryId)!;
      const baseRate = Number(cat.baseRatePerKg);
      const minRate = Number(cat.minRatePerKg);
      const maxRate = Number(cat.maxRatePerKg);
      const weight = roundToWeight(item.estimatedWeightKg);

      const estimatedAmount = roundToCurrency(weight * baseRate);
      const minEstimatedAmount = roundToCurrency(weight * minRate);
      const maxEstimatedAmount = roundToCurrency(weight * maxRate);

      totalEstimated += estimatedAmount;
      totalMinEstimated += minEstimatedAmount;
      totalMaxEstimated += maxEstimatedAmount;
      totalWeight += weight;

      return {
        categoryId: cat.id,
        categoryCode: cat.code,
        categoryName: cat.name,
        estimatedWeightKg: weight,
        baseRatePerKg: baseRate,
        minRatePerKg: minRate,
        maxRatePerKg: maxRate,
        estimatedAmount,
        minEstimatedAmount,
        maxEstimatedAmount,
      };
    });

    return {
      totalEstimatedAmount: roundToCurrency(totalEstimated),
      totalMinEstimatedAmount: roundToCurrency(totalMinEstimated),
      totalMaxEstimatedAmount: roundToCurrency(totalMaxEstimated),
      totalWeightKg: roundToWeight(totalWeight),
      itemBreakdown,
    };
  }
}

export const pricingService = new PricingService();
