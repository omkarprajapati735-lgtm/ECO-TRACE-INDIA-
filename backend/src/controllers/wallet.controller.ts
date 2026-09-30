import { Request, Response, NextFunction } from 'express';
import { WalletService, walletService } from '../services/wallet.service';
import { withdrawSchema, idempotencyHeaderSchema } from '../validators/payment.validator';
import { ValidationError, UnauthorizedError } from '../errors/app-error';

export class WalletController {
  constructor(private readonly wallets: WalletService = walletService) {}

  /**
   * GET /api/v1/wallets/me
   * Fetches the current collector's wallet balance and recent ledger history.
   */
  getMyWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to access wallet');
      }

      const wallet = await this.wallets.getWalletByUserId(req.user.userId);
      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/wallets/withdraw
   * Requests an atomic withdrawal to UPI with balance validation and Idempotency-Key protection.
   */
  withdrawFunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to request withdrawal');
      }

      // 1. Mandatory Idempotency-Key validation
      const rawKey = req.header('Idempotency-Key') || req.headers['idempotency-key'];
      const headerValidation = idempotencyHeaderSchema.safeParse(rawKey);
      if (!headerValidation.success) {
        throw new ValidationError(
          'Missing or invalid Idempotency-Key header (must be 8-100 characters)',
          headerValidation.error.flatten().fieldErrors
        );
      }
      const idempotencyKey = headerValidation.data;

      // 2. Body validation
      const bodyValidation = withdrawSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.flatten().fieldErrors);
      }
      const parsedBody = bodyValidation.data;

      // 3. Process withdrawal
      const result = await this.wallets.requestWithdrawal(req.user.userId, {
        amountRupees: parsedBody.amountRupees,
        upiId: parsedBody.upiId,
        idempotencyKey,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.isDuplicate
          ? 'Duplicate withdrawal request returned cached transaction'
          : 'Withdrawal processed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/wallets/transactions
   * Retrieves paginated transaction history.
   */
  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
      const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

      const result = await this.wallets.getTransactions(req.user.userId, limit, offset);
      res.status(200).json({
        success: true,
        data: result.transactions,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const walletController = new WalletController();
