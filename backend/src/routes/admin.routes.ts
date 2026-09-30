import { Router } from 'express';
import { Role } from '@prisma/client';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const adminRouter = Router();

// Central Operations Cockpit & Platform Analytics
adminRouter.get(
  '/analytics',
  authenticate,
  authorize(Role.ADMIN),
  adminController.getAnalytics
);

// High-Priority Fraud & Discrepancy Radar Lots
adminRouter.get(
  '/discrepancies',
  authenticate,
  authorize(Role.ADMIN),
  adminController.getDiscrepancies
);

// Resolve 5% Discrepancy Lot (APPROVE into inventory or FORFEIT)
adminRouter.patch(
  '/discrepancies/:id/resolve',
  authenticate,
  authorize(Role.ADMIN),
  adminController.resolveDiscrepancy
);
