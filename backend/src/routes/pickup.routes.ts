import { Router } from 'express';
import { Role } from '@prisma/client';
import { pickupController } from '../controllers/pickup.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const pickupRouter = Router();

// Public / pre-booking valuation estimate
pickupRouter.post('/estimate', pickupController.estimateValuation);

// Active category listing under /pickups/categories
pickupRouter.get('/categories', pickupController.getCategories);

// Consumer personal pickups
pickupRouter.get(
  '/my-pickups',
  authenticate,
  authorize(Role.CONSUMER, Role.ADMIN),
  pickupController.getMyPickups
);

// TICK-007: Geospatial proximity discovery for open pickups (Must be before /:id)
pickupRouter.get(
  '/nearby',
  authenticate,
  authorize(Role.COLLECTOR, Role.ADMIN),
  pickupController.getNearbyPickups
);

// List pickups (Role-scoped: CONSUMER gets their own; COLLECTOR/HUB/ADMIN gets all)
pickupRouter.get('/', authenticate, pickupController.getPickups);

// Book a new doorstep pickup
pickupRouter.post(
  '/',
  authenticate,
  authorize(Role.CONSUMER, Role.ADMIN),
  pickupController.createPickup
);

// TICK-008: Atomic pickup job claiming
pickupRouter.patch(
  '/:id/claim',
  authenticate,
  authorize(Role.COLLECTOR, Role.ADMIN),
  pickupController.claimPickup
);

// TICK-008: Collector doorstep arrival confirmation
pickupRouter.patch(
  '/:id/arrived',
  authenticate,
  authorize(Role.COLLECTOR, Role.ADMIN),
  pickupController.markArrived
);

// TICK-008: Doorstep scale items recording with locked rates
pickupRouter.post(
  '/:id/items',
  authenticate,
  authorize(Role.COLLECTOR, Role.ADMIN),
  pickupController.recordDoorstepItems
);

// TICK-008: Finalize collection and compute final payout
pickupRouter.post(
  '/:id/complete',
  authenticate,
  authorize(Role.COLLECTOR, Role.ADMIN),
  pickupController.completePickup
);

// Get pickup details by ID with access control
pickupRouter.get('/:id', authenticate, pickupController.getPickupById);
