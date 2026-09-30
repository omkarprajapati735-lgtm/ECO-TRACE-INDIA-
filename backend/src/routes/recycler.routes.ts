import { Router } from 'express';
import { Role } from '@prisma/client';
import { recyclerController } from '../controllers/recycler.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const recyclerRouter = Router();

// Mark manifested batch as received at recycler facility
recyclerRouter.patch(
  '/batches/:batchId/receive',
  authenticate,
  authorize(Role.RECYCLER, Role.ADMIN),
  recyclerController.receiveBatch
);

// Process batch and record metallurgical/plastic recovery yields with mass balance validation
recyclerRouter.post(
  '/batches/:batchId/process',
  authenticate,
  authorize(Role.RECYCLER, Role.ADMIN),
  recyclerController.processBatch
);

// List batches assigned to recycler or available for intake
recyclerRouter.get(
  '/batches',
  authenticate,
  authorize(Role.RECYCLER, Role.ADMIN),
  recyclerController.listBatches
);
