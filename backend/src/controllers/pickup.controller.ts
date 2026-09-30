import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { pickupService, PickupService } from '../services/pickup.service';
import { pricingService, PricingService } from '../services/pricing.service';
import { ValidationError, UnauthorizedError } from '../errors/app-error';
import {
  createPickupSchema,
  estimateValuationSchema,
  nearbyPickupsQuerySchema,
  recordPickupItemsPayloadSchema,
} from '../validators/pickup.validator';

export class PickupController {
  constructor(
    private readonly pickup: PickupService = pickupService,
    private readonly pricing: PricingService = pricingService
  ) {}

  createPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required to book a pickup');
      const parsed = createPickupSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const pickup = await this.pickup.createPickup(req.user.userId, parsed.data);
      res.status(201).json({
        success: true,
        data: pickup,
        message: 'Pickup request scheduled successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  getPickupById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const idParam = req.params.id;
      if (!idParam) throw new ValidationError('Pickup ID parameter is required');

      const pickup = await this.pickup.getPickupById(idParam, req.user.userId, req.user.role);
      res.status(200).json({ success: true, data: pickup });
    } catch (err) {
      next(err);
    }
  };

  getMyPickups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const pickups = await this.pickup.getConsumerPickups(req.user.userId);
      res.status(200).json({ success: true, data: pickups });
    } catch (err) {
      next(err);
    }
  };

  getPickups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      if (req.user.role === Role.CONSUMER) {
        const pickups = await this.pickup.getConsumerPickups(req.user.userId);
        res.status(200).json({ success: true, data: pickups });
        return;
      }
      const pickups = await this.pickup.getAllPickups(req.user.role);
      res.status(200).json({ success: true, data: pickups });
    } catch (err) {
      next(err);
    }
  };

  getNearbyPickups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const parsed = nearbyPickupsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid proximity query parameters', parsed.error.flatten().fieldErrors);
      }

      const pickups = await this.pickup.getNearbyPickups(req.user.userId, req.user.role, parsed.data);
      res.status(200).json({
        success: true,
        data: pickups,
        message: `Found ${pickups.length} available pickups within service radius`,
      });
    } catch (err) {
      next(err);
    }
  };

  claimPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      if (!id) throw new ValidationError('Pickup ID parameter is required');

      const updated = await this.pickup.claimPickup(id, req.user.userId, req.user.role);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Pickup job claimed successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  markArrived = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      if (!id) throw new ValidationError('Pickup ID parameter is required');

      const updated = await this.pickup.markArrived(id, req.user.userId, req.user.role);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Arrival at consumer doorstep confirmed',
      });
    } catch (err) {
      next(err);
    }
  };

  recordDoorstepItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      if (!id) throw new ValidationError('Pickup ID parameter is required');

      const parsed = recordPickupItemsPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed for weigh-in item(s)', parsed.error.flatten().fieldErrors);
      }

      const itemsToRecord = 'items' in parsed.data ? parsed.data.items : [parsed.data];
      const result = await this.pickup.recordDoorstepItems(
        id,
        req.user.userId,
        req.user.role,
        itemsToRecord
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Doorstep weigh-in items recorded successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  completePickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      if (!id) throw new ValidationError('Pickup ID parameter is required');

      const completed = await this.pickup.completeCollection(id, req.user.userId, req.user.role);
      res.status(200).json({
        success: true,
        data: completed,
        message: 'Pickup collection completed and finalized',
      });
    } catch (err) {
      next(err);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.pricing.getActiveCategoriesWithRates();
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  };

  estimateValuation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = estimateValuationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }
      const result = await this.pricing.calculateScrapValuation(parsed.data.items);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}

export const pickupController = new PickupController();
