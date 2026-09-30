import { PrismaClient, PickupStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HubRepository, hubRepository } from '../repositories/hub.repository';
import { WalletService, walletService } from './wallet.service';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { logger } from '../config/logger';
import {
  HubIntakePreview,
  HubIntakeResult,
  HubInventoryItemDto,
  HubIntakePreviewItem,
} from '../types/hub.types';

export class HubService {
  constructor(
    private readonly hubRepo: HubRepository = hubRepository,
    private readonly walletSvc: WalletService = walletService,
    private readonly db: PrismaClient = prisma
  ) {}

  async getCollectorDropoffPreview(
    hubId: string,
    collectorId: string
  ): Promise<HubIntakePreview> {
    const hub = await this.hubRepo.findById(hubId);
    if (!hub) {
      throw new NotFoundError(`Hub ${hubId} not found`);
    }

    const pickups = await this.hubRepo.getCollectorDropoffLots(hubId, collectorId);
    const items: HubIntakePreviewItem[] = [];
    let totalClaimedWeightKg = 0;
    let collectorName = 'Field Collector';

    for (const p of pickups) {
      if (p.collector?.user?.fullName) {
        collectorName = p.collector.user.fullName;
      }
      for (const it of p.items) {
        const weight = Number(it.actualWeightKg ?? it.estimatedWeightKg ?? 0);
        totalClaimedWeightKg += weight;
        items.push({
          id: it.id,
          pickupId: p.id,
          categoryId: it.categoryId,
          categoryName: it.category.name,
          categoryCode: it.category.code,
          claimedWeightKg: Number(weight.toFixed(3)),
          pricePerKg: Number(it.pricePerKg),
          hasPhoto: Boolean(it.imageProofUrl),
        });
      }
    }

    return {
      hubId,
      collectorId,
      collectorName,
      pickupCount: pickups.length,
      totalClaimedWeightKg: Number(totalClaimedWeightKg.toFixed(3)),
      items,
    };
  }

  async verifyInboundLot(
    hubId: string,
    collectorId: string,
    verifiedWeightKg: number,
    pickupIds: string[],
    storageBin: string,
    managerUserId?: string
  ): Promise<HubIntakeResult> {
    const hub = await this.hubRepo.findById(hubId);
    if (!hub) {
      throw new NotFoundError(`Hub ${hubId} not found`);
    }

    if (!pickupIds || pickupIds.length === 0) {
      throw new ValidationError('At least one pickupId must be provided');
    }

    const pickups = await this.hubRepo.findPickupsByIds(pickupIds);
    if (pickups.length !== pickupIds.length) {
      throw new NotFoundError('One or more specified pickups could not be found');
    }

    for (const p of pickups) {
      if (p.collectorId !== collectorId) {
        throw new ValidationError(
          `Pickup ${p.id} does not belong to collector ${collectorId}`
        );
      }
    }

    let claimedWeightKg = 0;
    const categoryWeights: Record<string, number> = {};

    for (const p of pickups) {
      for (const it of p.items) {
        const itemWeight = Number(it.actualWeightKg ?? it.estimatedWeightKg ?? 0);
        claimedWeightKg += itemWeight;
        categoryWeights[it.categoryId] = (categoryWeights[it.categoryId] ?? 0) + itemWeight;
      }
    }

    claimedWeightKg = Number(claimedWeightKg.toFixed(3));
    if (claimedWeightKg <= 0) {
      throw new ValidationError('Total claimed weight for the lot cannot be zero');
    }

    const rawDiscrepancy = (Math.abs(verifiedWeightKg - claimedWeightKg) / claimedWeightKg) * 100;
    const discrepancyPercent = Number(rawDiscrepancy.toFixed(2));

    logger.info(
      { hubId, collectorId, claimedWeightKg, verifiedWeightKg, discrepancyPercent },
      '[HubService] Scale intake verification evaluated'
    );

    if (discrepancyPercent > 5.0) {
      logger.warn(
        { hubId, collectorId, discrepancyPercent, threshold: 5.0 },
        '[HubService] ⚠️ 5% weight discrepancy threshold EXCEEDED. Freezing lot & payouts.'
      );

      await this.hubRepo.updatePickupsStatus(pickupIds, PickupStatus.FLAGGED_DISCREPANCY, hubId);
      await this.hubRepo.createDiscrepancyLog({
        hubId,
        collectorId,
        pickupIds,
        claimedWeightKg,
        verifiedWeightKg,
        discrepancyPercent,
        managerUserId,
      });

      return {
        status: 'FLAGGED_DISCREPANCY',
        discrepancyPercent,
        claimedWeightKg,
        verifiedWeightKg,
        message: 'Discrepancy exceeds 5% threshold',
        pickupIds,
      };
    }

    const commissionRupees = Math.max(10, Math.round(verifiedWeightKg * 5));

    await this.db.$transaction(async (tx) => {
      await this.hubRepo.updatePickupsStatus(pickupIds, PickupStatus.DELIVERED_TO_HUB, hubId, tx);

      for (const [categoryId, catClaimed] of Object.entries(categoryWeights)) {
        const catProportion = catClaimed / claimedWeightKg;
        const catVerifiedWeight = Number((verifiedWeightKg * catProportion).toFixed(3));
        await this.hubRepo.incrementInventory(hubId, categoryId, storageBin, catVerifiedWeight, tx);
      }

      await this.hubRepo.createIntakeAuditLog(
        {
          hubId,
          collectorId,
          pickupIds,
          claimedWeightKg,
          verifiedWeightKg,
          discrepancyPercent,
          managerUserId,
        },
        tx
      );
    });

    try {
      await this.walletSvc.creditCommission(
        collectorId,
        commissionRupees,
        `INTAKE-${hubId.slice(0, 8)}-${Date.now()}`,
        `Hub intake verified collection commission (${verifiedWeightKg} kg)`
      );
    } catch (err) {
      logger.error({ err, collectorId }, '[HubService] Collector wallet credit error after lot acceptance');
    }

    return {
      status: 'ACCEPTED',
      discrepancyPercent,
      claimedWeightKg,
      verifiedWeightKg,
      commissionAmount: commissionRupees,
      message: 'Lot verified and accepted into inventory',
      pickupIds,
      storageBin,
    };
  }

  async getInventory(hubId: string): Promise<HubInventoryItemDto[]> {
    const hub = await this.hubRepo.findById(hubId);
    if (!hub) {
      throw new NotFoundError(`Hub ${hubId} not found`);
    }

    const items = await this.hubRepo.getInventory(hubId);
    return items.map((item) => ({
      id: item.id,
      hubId: item.hubId,
      categoryId: item.categoryId,
      categoryCode: item.category.code,
      categoryName: item.category.name,
      quantityKg: Number(item.quantityKg),
      storageBin: item.storageBin,
      updatedAt: item.updatedAt,
    }));
  }
}

export const hubService = new HubService();
