import { Router } from 'express';
import { Role } from '@prisma/client';
import { batchController } from '../controllers/batch.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const batchRouter = Router();

// Create open batch
batchRouter.post(
  '/',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN),
  batchController.createBatch
);

// Seal batch and generate QR code manifest
batchRouter.post(
  '/:id/seal',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN),
  batchController.sealBatch
);

// Retrieve sealed batch details with QR code
batchRouter.get(
  '/:id',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN, Role.RECYCLER),
  batchController.getBatch
);

// List batches for hub/recycler
batchRouter.get(
  '/',
  authenticate,
  authorize(Role.HUB_MANAGER, Role.ADMIN, Role.RECYCLER),
  batchController.listBatches
);
