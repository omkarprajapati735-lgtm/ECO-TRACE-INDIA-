import { Payment, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PaymentRepository, paymentRepository } from '../repositories/payment.repository';
import { pickupRepository, PickupRepository } from '../repositories/pickup.repository';
import { IPaymentService } from './payment/payment-gateway.interface';
import { mockPaymentService } from './payment/mock-payment.service';
import { razorpayPaymentService } from './payment/razorpay.service';
import { CurrencyUtil } from '../utils/currency';
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { NotFoundError, ValidationError, ConflictError } from '../errors/app-error';

export interface ProcessPayoutInput {
  pickupId: string;
  payerId: string;
  payeeId: string;
  amountRupees: number;
  paymentMethod?: PaymentMethod;
  upiId: string;
  idempotencyKey: string;
  notes?: string;
}

export interface ProcessPayoutResponse {
  payment: Payment;
  isDuplicate: boolean;
  message?: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository = paymentRepository,
    private readonly pickupRepo: PickupRepository = pickupRepository,
    private readonly paymentGateway: IPaymentService = env.NODE_ENV === 'production'
      ? razorpayPaymentService
      : mockPaymentService
  ) {}

  /**
   * Processes a doorstep or hub payout with strict idempotency and integer paise arithmetic.
   */
  async processPayout(input: ProcessPayoutInput): Promise<ProcessPayoutResponse> {
    const { idempotencyKey } = input;

    // 1. Check for existing payment using the mandatory Idempotency-Key
    const existing = await this.paymentRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      logger.info(
        { idempotencyKey, paymentId: existing.id, status: existing.status },
        '[PaymentService] Duplicate idempotency key detected — returning cached payment'
      );
      return {
        payment: existing,
        isDuplicate: true,
        message: 'Payment already processed with this Idempotency-Key',
      };
    }

    // 2. Validate pickup exists
    const pickup = await this.pickupRepo.findById(input.pickupId);
    if (!pickup) {
      throw new NotFoundError(`Pickup not found with ID ${input.pickupId}`);
    }

    // 3. Prevent floating point math drift: convert to integer paise
    const amountPaise = CurrencyUtil.toPaise(input.amountRupees);
    if (amountPaise <= 0) {
      throw new ValidationError('Payout amount must be greater than zero paise');
    }
    const amountDecimal = CurrencyUtil.paiseToDecimal(amountPaise);

    // 4. Create initial payment record in PROCESSING state to guarantee DB-level lock on idempotencyKey
    let initialPayment: Payment;
    try {
      initialPayment = await this.paymentRepo.createPayment({
        pickupId: input.pickupId,
        payerId: input.payerId,
        payeeId: input.payeeId,
        amount: amountDecimal,
        paymentMethod: input.paymentMethod ?? PaymentMethod.UPI,
        idempotencyKey,
        status: PaymentStatus.PROCESSING,
      });
    } catch (err: unknown) {
      // Catch race condition: if concurrent request created payment with same idempotencyKey
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const concurrent = await this.paymentRepo.findByIdempotencyKey(idempotencyKey);
        if (concurrent) {
          return {
            payment: concurrent,
            isDuplicate: true,
            message: 'Payment already processed concurrently with this Idempotency-Key',
          };
        }
      }
      throw err;
    }

    // 5. Dispatch payout via configured payment gateway adapter (Mock or Razorpay)
    const payoutResult = await this.paymentGateway.processPayout({
      payeeId: input.payeeId,
      amountPaise,
      upiId: input.upiId,
      idempotencyKey,
      notes: input.notes,
    });

    // 6. Update payment record based on gateway outcome
    const finalStatus = payoutResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    const completedAt = payoutResult.success ? new Date() : undefined;

    const updatedPayment = await this.paymentRepo.updatePaymentStatus(
      initialPayment.id,
      finalStatus,
      payoutResult.transactionId,
      completedAt
    );

    // 7. If payout succeeded, update pickup status to COMPLETED
    if (payoutResult.success) {
      await this.pickupRepo.updateStatus(input.pickupId, 'COMPLETED');
    }

    logger.info(
      {
        paymentId: updatedPayment.id,
        transactionId: payoutResult.transactionId,
        status: finalStatus,
        amountPaise,
      },
      '[PaymentService] Payout completed successfully'
    );

    return {
      payment: updatedPayment,
      isDuplicate: false,
    };
  }

  async getPaymentByIdempotencyKey(key: string): Promise<Payment | null> {
    return this.paymentRepo.findByIdempotencyKey(key);
  }

  async getPaymentsByPickup(pickupId: string): Promise<Payment[]> {
    return this.paymentRepo.findByPickupId(pickupId);
  }
}

export const paymentService = new PaymentService();
