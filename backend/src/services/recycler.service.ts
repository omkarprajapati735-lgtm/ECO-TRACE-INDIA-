import { BatchStatus } from '@prisma/client';
import { RecyclerRepository, recyclerRepository } from '../repositories/recycler.repository';
import { NotFoundError, ValidationError, ConflictError } from '../errors/app-error';
import { logger } from '../config/logger';
import {
  ProcessBatchYieldsInput,
  ProcessBatchYieldsResult,
  BatchYieldsRecord,
} from '../types/recycler.types';

export class RecyclerService {
  constructor(private readonly repo: RecyclerRepository = recyclerRepository) {}

  async receiveBatch(batchId: string, recyclerId: string) {
    const recycler = await this.repo.findById(recyclerId);
    if (!recycler) {
      throw new NotFoundError(`Recycler with ID '${recyclerId}' not found`);
    }

    const batch = await this.repo.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundError(`Batch with ID '${batchId}' not found`);
    }

    if (batch.status === BatchStatus.RECEIVED && batch.recyclerId === recyclerId) {
      return batch;
    }

    if (batch.status !== BatchStatus.SEALED && batch.status !== BatchStatus.IN_TRANSIT) {
      throw new ConflictError(
        `Cannot receive batch in status '${batch.status}'. Expected 'SEALED' or 'IN_TRANSIT'.`
      );
    }

    if (batch.recyclerId && batch.recyclerId !== recyclerId) {
      throw new ConflictError(
        `Batch '${batch.batchCode}' is assigned to a different recycler.`
      );
    }

    const received = await this.repo.updateBatchStatus(
      batchId,
      BatchStatus.RECEIVED,
      recyclerId,
      new Date()
    );

    logger.info(
      { batchId, batchCode: batch.batchCode, recyclerId },
      '[RecyclerService] Batch successfully received at recycler facility'
    );

    return received;
  }

  async processBatchYields(
    batchId: string,
    recyclerId: string,
    yields: ProcessBatchYieldsInput,
    userId?: string
  ): Promise<ProcessBatchYieldsResult> {
    const recycler = await this.repo.findById(recyclerId);
    if (!recycler) {
      throw new NotFoundError(`Recycler with ID '${recyclerId}' not found`);
    }

    const batch = await this.repo.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundError(`Batch with ID '${batchId}' not found`);
    }

    if (batch.recyclerId && batch.recyclerId !== recyclerId) {
      throw new ConflictError(
        `Batch '${batch.batchCode}' is not assigned to recycler '${recycler.companyName}'.`
      );
    }

    if (batch.status !== BatchStatus.RECEIVED && batch.status !== BatchStatus.PROCESSING) {
      throw new ConflictError(
        `Batch '${batch.batchCode}' cannot be processed in status '${batch.status}'. Must be 'RECEIVED'.`
      );
    }

    const { copperKg, goldKg, aluminumKg, plasticKg, wasteKg } = yields;

    if (
      copperKg < 0 ||
      goldKg < 0 ||
      aluminumKg < 0 ||
      plasticKg < 0 ||
      wasteKg < 0
    ) {
      throw new ValidationError('Yield weights cannot be negative numbers.');
    }

    const totalOutputYield = Number(
      (copperKg + goldKg + aluminumKg + plasticKg + wasteKg).toFixed(4)
    );

    if (totalOutputYield <= 0) {
      throw new ValidationError('Total recovered yield must be greater than zero.');
    }

    const inputNetWeight = Number(batch.netWeightKg);
    // Mass conservation: total output <= input net batch weight + 1% margin
    const maxAllowedYield = Number((inputNetWeight * 1.01).toFixed(4));

    if (totalOutputYield > maxAllowedYield) {
      throw new ValidationError(
        `Mass balance conservation violation: Total output yield (${totalOutputYield.toFixed(3)} kg) ` +
        `exceeds input net weight (${inputNetWeight.toFixed(3)} kg) beyond the acceptable 1% margin ` +
        `(Max allowed: ${maxAllowedYield.toFixed(3)} kg).`
      );
    }

    const massBalancePercentage = Number(
      ((totalOutputYield / inputNetWeight) * 100).toFixed(2)
    );

    const certifiedWeightKg = Number(
      (copperKg + goldKg + aluminumKg + plasticKg).toFixed(3)
    );

    const yieldsRecord: BatchYieldsRecord = {
      copperKg: Number(copperKg.toFixed(4)),
      goldKg: Number(goldKg.toFixed(4)),
      aluminumKg: Number(aluminumKg.toFixed(4)),
      plasticKg: Number(plasticKg.toFixed(4)),
      wasteKg: Number(wasteKg.toFixed(4)),
      totalOutputYieldKg: totalOutputYield,
      massBalancePercentage,
      certifiedWeightKg,
      recordedAt: new Date().toISOString(),
    };

    await this.repo.recordBatchYields(batchId, recyclerId, yieldsRecord, userId);

    logger.info(
      {
        batchId,
        batchCode: batch.batchCode,
        recyclerId,
        totalOutputYield,
        massBalancePercentage,
        certifiedWeightKg,
      },
      '[RecyclerService] Batch yields successfully processed and recorded'
    );

    return {
      batchId,
      batchCode: batch.batchCode,
      recyclerId,
      status: BatchStatus.PROCESSED,
      netWeightKg: inputNetWeight,
      yields: yieldsRecord,
      processedAt: new Date(),
    };
  }

  async getRecyclerBatches(recyclerId: string, status?: BatchStatus) {
    const recycler = await this.repo.findById(recyclerId);
    if (!recycler) {
      throw new NotFoundError(`Recycler with ID '${recyclerId}' not found`);
    }

    return this.repo.listBatchesForRecycler(recyclerId, status);
  }
}

export const recyclerService = new RecyclerService();
