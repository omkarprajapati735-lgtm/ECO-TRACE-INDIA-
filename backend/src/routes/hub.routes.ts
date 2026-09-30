import { Router } from 'express';
import { Role } from '@prisma/client';
import { hubController } from '../controllers/hub.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const hubRouter = Router();

// Inbound lot dropoff preview for collector
hubRouter.get(
  '/:id/intake/preview',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN),
  hubController.getIntakePreview
);

// Scale intake & 5% weight discrepancy verification
hubRouter.post(
  '/:id/intake',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN),
  hubController.verifyIntake
);

// Hub inventory items listing
hubRouter.get(
  '/:id/inventory',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN),
  hubController.getInventory
);
