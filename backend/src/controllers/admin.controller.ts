import { Request, Response, NextFunction } from 'express';
import { AdminService, adminService } from '../services/admin.service';
import {
  resolveDiscrepancySchema,
  discrepancyParamsSchema,
} from '../validators/admin.validator';
import { ValidationError } from '../errors/app-error';
import { ApiResponse } from '../types';
import {
  PlatformAnalyticsDto,
  FlaggedDiscrepancyDto,
  DiscrepancyResolutionResult,
} from '../types/admin.types';

export class AdminController {
  constructor(private readonly service: AdminService = adminService) {}

  getAnalytics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.service.getAnalytics();
      const response: ApiResponse<PlatformAnalyticsDto> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  getDiscrepancies = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await this.service.getDiscrepancyRadar();
      const response: ApiResponse<FlaggedDiscrepancyDto[]> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };

  resolveDiscrepancy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const paramCheck = discrepancyParamsSchema.safeParse(req.params);
      if (!paramCheck.success) {
        throw new ValidationError('Invalid discrepancy pickup ID', paramCheck.error.flatten().fieldErrors);
      }

      const bodyCheck = resolveDiscrepancySchema.safeParse(req.body);
      if (!bodyCheck.success) {
        throw new ValidationError('Validation failed for discrepancy resolution', bodyCheck.error.flatten().fieldErrors);
      }

      const adminUserId = req.user?.userId;
      const { resolution, notes } = bodyCheck.data;

      const data = await this.service.resolveDiscrepancy(
        paramCheck.data.id,
        resolution,
        notes,
        adminUserId
      );

      const response: ApiResponse<DiscrepancyResolutionResult> = {
        success: true,
        data,
        message: `Discrepancy for lot ${paramCheck.data.id} successfully resolved with decision: ${resolution}`,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
