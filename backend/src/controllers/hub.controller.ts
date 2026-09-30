import { Request, Response, NextFunction } from 'express';
import { HubService, hubService } from '../services/hub.service';
import {
  verifyIntakeSchema,
  intakePreviewQuerySchema,
} from '../validators/hub.validator';
import { ValidationError } from '../errors/app-error';
import { ApiResponse } from '../types';
import {
  HubIntakePreview,
  HubIntakeResult,
  HubInventoryItemDto,
} from '../types/hub.types';

export class HubController {
  constructor(private readonly service: HubService = hubService) {}

  getIntakePreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hubId = req.params.id;
      const parsed = intakePreviewQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const data = await this.service.getCollectorDropoffPreview(
        hubId,
        parsed.data.collectorId
      );

      const response: ApiResponse<HubIntakePreview> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  verifyIntake = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hubId = req.params.id;
      const parsed = verifyIntakeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const managerUserId = req.user?.userId;

      const data = await this.service.verifyInboundLot(
        hubId,
        parsed.data.collectorId,
        parsed.data.verifiedWeightKg,
        parsed.data.pickupIds,
        parsed.data.storageBin,
        managerUserId
      );

      const response: ApiResponse<HubIntakeResult> = {
        success: true,
        data,
        message: data.message,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hubId = req.params.id;
      const data = await this.service.getInventory(hubId);

      const response: ApiResponse<HubInventoryItemDto[]> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const hubController = new HubController();
