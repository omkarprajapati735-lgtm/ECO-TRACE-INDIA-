import { Router } from 'express';
import { Role } from '@prisma/client';
import { walletController } from '../controllers/wallet.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const walletRouter = Router();

// Collector wallet balance and recent transactions
walletRouter.get(
  '/me',
  authenticate,
  authorize(Role.COLLECTOR),
  walletController.getMyWallet
);

// Atomic withdrawal request to UPI
walletRouter.post(
  '/withdraw',
  authenticate,
  authorize(Role.COLLECTOR),
  walletController.withdrawFunds
);

// Paginated transaction history
walletRouter.get(
  '/transactions',
  authenticate,
  authorize(Role.COLLECTOR),
  walletController.getTransactions
);
