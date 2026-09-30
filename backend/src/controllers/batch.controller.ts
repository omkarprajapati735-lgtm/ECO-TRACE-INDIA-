import { Request, Response, NextFunction } from 'express';
import { BatchService, batchService } from '../services/batch.service';
import {
  createBatchSchema,
  sealBatchSchema,
  listBatchesQuerySchema,
} from '../validators/batch.validator';
import { ValidationError } from '../errors/app-error';
import { ApiResponse } from '../types';
import { BatchDetailDto } from '../types/batch.types';

export class BatchController {
  constructor(private readonly service: BatchService = batchService) {}

  createBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const data = await this.service.createBatch(parsed.data);
      const response: ApiResponse<BatchDetailDto> = {
        success: true,
        data,
        message: 'Batch created successfully',
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  sealBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batchId = req.params.id;
      const parsed = sealBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const data = await this.service.sealBatch(batchId, parsed.data);
      const response: ApiResponse<BatchDetailDto> = {
        success: true,
        data,
        message: 'Batch successfully sealed and QR manifest generated',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  getBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batchId = req.params.id;
      const data = await this.service.getBatchById(batchId);
      const response: ApiResponse<BatchDetailDto> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  listBatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listBatchesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const data = await this.service.listBatches(parsed.data);
      const response: ApiResponse<{ items: BatchDetailDto[]; total: number }> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const batchController = new BatchController();
