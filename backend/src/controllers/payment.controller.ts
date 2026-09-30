import { Request, Response, NextFunction } from 'express';
import { PaymentService, paymentService } from '../services/payment.service';
import { payoutSchema, idempotencyHeaderSchema } from '../validators/payment.validator';
import { ValidationError, UnauthorizedError } from '../errors/app-error';

export class PaymentController {
  constructor(private readonly payments: PaymentService = paymentService) {}

  /**
   * POST /api/v1/payments/payout
   * Initiates an atomic scrap payout with mandatory Idempotency-Key header.
   */
  initiatePayout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to initiate payout');
      }

      // 1. Validate mandatory Idempotency-Key header
      const rawKey = req.header('Idempotency-Key') || req.headers['idempotency-key'];
      const headerValidation = idempotencyHeaderSchema.safeParse(rawKey);
      if (!headerValidation.success) {
        throw new ValidationError(
          'Missing or invalid Idempotency-Key header (must be 8-100 characters)',
          headerValidation.error.flatten().fieldErrors
        );
      }
      const idempotencyKey = headerValidation.data;

      // 2. Validate request body
      const bodyValidation = payoutSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.flatten().fieldErrors);
      }
      const parsedBody = bodyValidation.data;

      // 3. Process payout
      const result = await this.payments.processPayout({
        pickupId: parsedBody.pickupId,
        payerId: req.user.userId,
        payeeId: parsedBody.payeeId,
        amountRupees: parsedBody.amountRupees,
        paymentMethod: parsedBody.paymentMethod,
        upiId: parsedBody.upiId,
        idempotencyKey,
        notes: parsedBody.notes,
      });

      res.status(result.isDuplicate ? 200 : 201).json({
        success: true,
        data: result.payment,
        message: result.message || 'Payout initiated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/payments/idempotency/:key
   */
  getByIdempotencyKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.params.key;
      const payment = await this.payments.getPaymentByIdempotencyKey(key);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'No payment found for idempotency key' },
        });
        return;
      }
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/payments/pickup/:pickupId
   */
  getByPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pickupId = req.params.pickupId;
      const payments = await this.payments.getPaymentsByPickup(pickupId);
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
