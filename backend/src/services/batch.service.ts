import { randomBytes, randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { PrismaClient, BatchStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BatchRepository, batchRepository } from '../repositories/batch.repository';
import { HubRepository, hubRepository } from '../repositories/hub.repository';
import { NotFoundError, ValidationError, ConflictError } from '../errors/app-error';
import { logger } from '../config/logger';
import {
  CreateBatchInput,
  SealBatchInput,
  BatchDetailDto,
  BatchFilterQuery,
} from '../types/batch.types';

export class BatchService {
  constructor(
    private readonly batchRepo: BatchRepository = batchRepository,
    private readonly hubRepo: HubRepository = hubRepository,
    private readonly db: PrismaClient = prisma
  ) {}

  generateBatchCode(): string {
    const randomSuffix = randomBytes(4).toString('hex').toUpperCase();
    return `BATCH-2026-${randomSuffix}`;
  }

  async createBatch(input: CreateBatchInput): Promise<BatchDetailDto> {
    const hub = await this.hubRepo.findById(input.hubId);
    if (!hub) {
      throw new NotFoundError(`Hub ${input.hubId} not found`);
    }

    if (input.netWeightKg > input.grossWeightKg) {
      throw new ValidationError('netWeightKg cannot exceed grossWeightKg');
    }

    if (input.storageBin) {
      const inv = await this.hubRepo.findInventoryItem(
        input.hubId,
        input.categoryId,
        input.storageBin
      );
      if (!inv || Number(inv.quantityKg) < input.netWeightKg) {
        throw new ValidationError(
          `Insufficient inventory in bin '${input.storageBin}'. Available: ${inv ? Number(inv.quantityKg) : 0}kg, Requested: ${input.netWeightKg}kg`
        );
      }
    }

    const batchId = randomUUID();
    const batchCode = this.generateBatchCode();
    const qrPayload = `ecotrace://batch/${batchId}`;

    const batch = await this.batchRepo.createBatch({
      id: batchId,
      batchCode,
      hubId: input.hubId,
      categoryId: input.categoryId,
      grossWeightKg: input.grossWeightKg,
      netWeightKg: input.netWeightKg,
      recyclerId: input.recyclerId,
      qrCode: qrPayload,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
    });

    logger.info({ batchId: batch.id, batchCode }, '[BatchService] Open batch created');

    const created = await this.batchRepo.findById(batch.id);
    if (!created) {
      throw new NotFoundError('Failed to load created batch');
    }
    return this.mapToDto(created, qrCodeDataUrl);
  }

  async sealBatch(id: string, input?: SealBatchInput): Promise<BatchDetailDto> {
    const batch = await this.batchRepo.findById(id);
    if (!batch) {
      throw new NotFoundError(`Batch ${id} not found`);
    }

    if (batch.status === BatchStatus.SEALED) {
      const qrCodeDataUrl = await QRCode.toDataURL(batch.qrCode, {
        errorCorrectionLevel: 'H',
        margin: 2,
      });
      return this.mapToDto(batch, qrCodeDataUrl);
    }

    if (batch.status !== BatchStatus.OPEN) {
      throw new ConflictError(`Cannot seal batch in status '${batch.status}'`);
    }

    const qrPayload = `ecotrace://batch/${batch.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
    });

    const netWeight = Number(batch.netWeightKg);

    await this.db.$transaction(async (tx) => {
      if (input?.storageBin) {
        await this.batchRepo.deductInventory(
          batch.hubId,
          batch.categoryId,
          input.storageBin,
          netWeight,
          tx
        );
      } else {
        const availableItems = await this.batchRepo.findInventory(
          batch.hubId,
          batch.categoryId
        );
        let remainingToDeduct = netWeight;
        for (const item of availableItems) {
          const qty = Number(item.quantityKg);
          if (qty > 0 && remainingToDeduct > 0) {
            const deductAmount = Math.min(qty, remainingToDeduct);
            await this.batchRepo.deductInventory(
              batch.hubId,
              batch.categoryId,
              item.storageBin,
              deductAmount,
              tx
            );
            remainingToDeduct -= deductAmount;
          }
        }
      }

      await this.batchRepo.sealBatch(
        batch.id,
        batch.batchCode,
        qrPayload,
        input?.manifestUrl ?? batch.manifestUrl,
        tx
      );
    });

    logger.info(
      { batchId: batch.id, batchCode: batch.batchCode, qrPayload },
      '[BatchService] Batch successfully sealed with QR manifest'
    );

    const sealed = await this.batchRepo.findById(batch.id);
    if (!sealed) {
      throw new NotFoundError('Failed to load sealed batch');
    }
    return this.mapToDto(sealed, qrCodeDataUrl);
  }

  async getBatchById(id: string): Promise<BatchDetailDto> {
    const batch = await this.batchRepo.findById(id);
    if (!batch) {
      throw new NotFoundError(`Batch ${id} not found`);
    }

    const qrCodeDataUrl = await QRCode.toDataURL(batch.qrCode, {
      errorCorrectionLevel: 'H',
      margin: 2,
    });

    return this.mapToDto(batch, qrCodeDataUrl);
  }

  async listBatches(filter?: BatchFilterQuery): Promise<{ items: BatchDetailDto[]; total: number }> {
    const batches = await this.batchRepo.listBatches(filter);
    const items = await Promise.all(
      batches.map(async (b) => {
        const qrCodeDataUrl = await QRCode.toDataURL(b.qrCode, {
          errorCorrectionLevel: 'H',
          margin: 2,
        });
        return this.mapToDto(b, qrCodeDataUrl);
      })
    );

    return {
      items,
      total: items.length,
    };
  }

  private mapToDto(
    batch: NonNullable<Awaited<ReturnType<BatchRepository['findById']>>>,
    qrCodeDataUrl?: string
  ): BatchDetailDto {
    return {
      id: batch.id,
      batchCode: batch.batchCode,
      hubId: batch.hubId,
      recyclerId: batch.recyclerId,
      categoryId: batch.categoryId,
      grossWeightKg: Number(batch.grossWeightKg),
      netWeightKg: Number(batch.netWeightKg),
      status: batch.status,
      qrCode: batch.qrCode,
      qrCodeDataUrl,
      manifestUrl: batch.manifestUrl,
      shippedAt: batch.shippedAt,
      receivedAt: batch.receivedAt,
      createdAt: batch.createdAt,
      hub: batch.hub
        ? { id: batch.hub.id, name: batch.hub.name, address: batch.hub.address }
        : undefined,
      category: batch.category
        ? { id: batch.category.id, code: batch.category.code, name: batch.category.name }
        : undefined,
      recycler: batch.recycler
        ? {
            id: batch.recycler.id,
            companyName: batch.recycler.companyName,
            licenseNumber: batch.recycler.licenseNumber,
          }
        : null,
    };
  }
}

export const batchService = new BatchService();
