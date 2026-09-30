import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { RecyclerService, recyclerService } from '../services/recycler.service';
import { RecyclerRepository, recyclerRepository } from '../repositories/recycler.repository';
import {
  processYieldsSchema,
  listRecyclerBatchesQuerySchema,
} from '../validators/recycler.validator';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/app-error';
import { ApiResponse } from '../types';
import { ProcessBatchYieldsResult } from '../types/recycler.types';

export class RecyclerController {
  constructor(
    private readonly service: RecyclerService = recyclerService,
    private readonly repo: RecyclerRepository = recyclerRepository
  ) {}

  private async resolveRecyclerId(req: Request, fallbackBatchId?: string): Promise<string> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role === Role.RECYCLER) {
      const profile = await this.repo.findByUserId(req.user.userId);
      if (!profile) {
        throw new NotFoundError('Recycler profile not found for the authenticated user');
      }
      return profile.id;
    }

    // Role is ADMIN
    const bodyRecyclerId = req.body?.recyclerId as string | undefined;
    const queryRecyclerId = req.query?.recyclerId as string | undefined;
    if (bodyRecyclerId) return bodyRecyclerId;
    if (queryRecyclerId) return queryRecyclerId;

    if (fallbackBatchId) {
      const batch = await this.repo.findBatchById(fallbackBatchId);
      if (batch?.recyclerId) return batch.recyclerId;
    }

    throw new ValidationError('recyclerId is required for administrative recycler operations');
  }

  receiveBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batchId } = req.params;
      if (!batchId) {
        throw new ValidationError('batchId parameter is required');
      }

      const recyclerId = await this.resolveRecyclerId(req, batchId);
      const batch = await this.service.receiveBatch(batchId, recyclerId);

      const response: ApiResponse<typeof batch> = {
        success: true,
        data: batch,
        message: 'Batch successfully marked as RECEIVED at recycler plant',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  processBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { batchId } = req.params;
      if (!batchId) {
        throw new ValidationError('batchId parameter is required');
      }

      const parsed = processYieldsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const recyclerId = await this.resolveRecyclerId(req, batchId);
      const data: ProcessBatchYieldsResult = await this.service.processBatchYields(
        batchId,
        recyclerId,
        parsed.data,
        req.user?.userId
      );

      const response: ApiResponse<ProcessBatchYieldsResult> = {
        success: true,
        data,
        message: 'Batch recovery yields successfully validated and recorded',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  listBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listRecyclerBatchesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const recyclerId = await this.resolveRecyclerId(req);
      const batches = await this.service.getRecyclerBatches(recyclerId, parsed.data.status);

      const response: ApiResponse<typeof batches> = {
        success: true,
        data: batches,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const recyclerController = new RecyclerController();
