import { Router } from 'express';
import { Role } from '@prisma/client';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const paymentRouter = Router();

// Initiate payout for collected scrap or hub settlement
paymentRouter.post(
  '/payout',
  authenticate,
  authorize(Role.COLLECTOR, Role.HUB_MANAGER, Role.ADMIN),
  paymentController.initiatePayout
);

// Query payment record by idempotency key
paymentRouter.get(
  '/idempotency/:key',
  authenticate,
  paymentController.getByIdempotencyKey
);

// Query payments for a given pickup
paymentRouter.get(
  '/pickup/:pickupId',
  authenticate,
  paymentController.getByPickup
);
