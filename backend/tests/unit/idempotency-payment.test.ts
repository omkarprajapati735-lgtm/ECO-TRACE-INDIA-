import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma, Payment, PaymentStatus, PaymentMethod, Role } from '@prisma/client';
import { CurrencyUtil } from '../../src/utils/currency';
import { PaymentService } from '../../src/services/payment.service';
import { MockPaymentService } from '../../src/services/payment/mock-payment.service';
import { PaymentRepository } from '../../src/repositories/payment.repository';
import { PickupRepository } from '../../src/repositories/pickup.repository';
import { WalletRepository } from '../../src/repositories/wallet.repository';
import { WalletService } from '../../src/services/wallet.service';
import { CollectorRepository } from '../../src/repositories/collector.repository';
import { ValidationError, NotFoundError } from '../../src/errors/app-error';

describe('Unit Tests: Idempotent Payment & Payout Engine (TICK-011)', () => {
  /* --------------------------------------------------------------------------
   * 1. Currency Math Precision & Integer Paise
   * -------------------------------------------------------------------------- */
  describe('CurrencyUtil (Banned Floating Math Guardrail)', () => {
    it('should correctly convert decimal rupees to integer paise without floating drift', () => {
      // Classic JS floating point bug: 0.1 + 0.2 = 0.30000000000000004
      const sum = 0.1 + 0.2;
      const paise = CurrencyUtil.toPaise(sum);
      expect(paise).toBe(30);

      expect(CurrencyUtil.toPaise(150.50)).toBe(15050);
      expect(CurrencyUtil.toPaise('250.75')).toBe(25075);
      expect(CurrencyUtil.toPaise(new Prisma.Decimal('99.99'))).toBe(9999);
      expect(CurrencyUtil.toPaise(0)).toBe(0);
    });

    it('should convert integer paise back to Prisma.Decimal with 2 decimal places', () => {
      const dec = CurrencyUtil.paiseToDecimal(15050);
      expect(dec.toFixed(2)).toBe('150.50');
      expect(CurrencyUtil.paiseToRupees(15050)).toBe(150.5);
    });

    it('should reject invalid and negative currency values', () => {
      expect(() => CurrencyUtil.toPaise(-50)).toThrow(ValidationError);
      expect(() => CurrencyUtil.toPaise('invalid-amount')).toThrow(ValidationError);
      expect(() => CurrencyUtil.toPaise(NaN)).toThrow(ValidationError);
    });
  });

  /* --------------------------------------------------------------------------
   * 2. Idempotency Engine & Concurrency Safety
   * -------------------------------------------------------------------------- */
  describe('PaymentService Idempotency', () => {
    let mockPaymentRepo: PaymentRepository;
    let mockPickupRepo: PickupRepository;
    let mockGateway: MockPaymentService;
    let paymentService: PaymentService;
    let inMemoryPayments: Payment[];

    const testPickupId = '00000000-0000-0000-0000-000000000001';
    const testPayerId = '00000000-0000-0000-0000-000000000002';
    const testPayeeId = '00000000-0000-0000-0000-000000000003';

    beforeEach(() => {
      inMemoryPayments = [];
      mockGateway = new MockPaymentService();

      mockPaymentRepo = {
        findByIdempotencyKey: vi.fn(async (key: string) => {
          return inMemoryPayments.find((p) => p.idempotencyKey === key) || null;
        }),
        createPayment: vi.fn(async (data) => {
          const existing = inMemoryPayments.find((p) => p.idempotencyKey === data.idempotencyKey);
          if (existing) {
            const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
              code: 'P2002',
              clientVersion: '5.14.0',
            });
            throw err;
          }

          const amountDecimal =
            data.amount instanceof Prisma.Decimal
              ? data.amount
              : CurrencyUtil.paiseToDecimal(CurrencyUtil.toPaise(data.amount));

          const newPayment: Payment = {
            id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            pickupId: data.pickupId,
            payerId: data.payerId,
            payeeId: data.payeeId,
            amount: amountDecimal,
            paymentMethod: data.paymentMethod ?? PaymentMethod.UPI,
            transactionId: data.transactionId ?? null,
            idempotencyKey: data.idempotencyKey,
            status: data.status ?? PaymentStatus.PENDING,
            createdAt: new Date(),
            completedAt: data.completedAt ?? null,
          };
          inMemoryPayments.push(newPayment);
          return newPayment;
        }),
        updatePaymentStatus: vi.fn(async (id: string, status: PaymentStatus, txId?: string, completedAt?: Date) => {
          const payment = inMemoryPayments.find((p) => p.id === id);
          if (!payment) throw new NotFoundError('Payment not found');
          payment.status = status;
          if (txId) payment.transactionId = txId;
          if (completedAt) payment.completedAt = completedAt;
          return payment;
        }),
        findById: vi.fn(),
        findByPickupId: vi.fn(),
      } as unknown as PaymentRepository;

      mockPickupRepo = {
        findById: vi.fn(async (id: string) => {
          if (id === testPickupId) {
            return { id: testPickupId, status: 'COLLECTED' };
          }
          return null;
        }),
        updateStatus: vi.fn(async () => ({})),
      } as unknown as PickupRepository;

      paymentService = new PaymentService(mockPaymentRepo, mockPickupRepo, mockGateway);
    });

    it('should process initial payout request and create exactly 1 payment record', async () => {
      const idempotencyKey = 'IDEM-KEY-UNIQUE-001';
      const result = await paymentService.processPayout({
        pickupId: testPickupId,
        payerId: testPayerId,
        payeeId: testPayeeId,
        amountRupees: 550.0,
        upiId: 'consumer@okaxis',
        idempotencyKey,
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
      expect(result.payment.amount.toFixed(2)).toBe('550.00');
      expect(inMemoryPayments).toHaveLength(1);
      expect(mockGateway.getProcessedPayouts()).toHaveLength(1);
    });

    it('should return cached payment and NOT call gateway when same Idempotency-Key is repeated sequentially', async () => {
      const idempotencyKey = 'IDEM-KEY-REPEAT-002';

      // First call
      const first = await paymentService.processPayout({
        pickupId: testPickupId,
        payerId: testPayerId,
        payeeId: testPayeeId,
        amountRupees: 800.0,
        upiId: 'consumer@okicici',
        idempotencyKey,
      });
      expect(first.isDuplicate).toBe(false);
      expect(inMemoryPayments).toHaveLength(1);
      expect(mockGateway.getProcessedPayouts()).toHaveLength(1);

      // Second call with same idempotency key
      const second = await paymentService.processPayout({
        pickupId: testPickupId,
        payerId: testPayerId,
        payeeId: testPayeeId,
        amountRupees: 800.0,
        upiId: 'consumer@okicici',
        idempotencyKey,
      });

      expect(second.isDuplicate).toBe(true);
      expect(second.payment.id).toBe(first.payment.id);
      expect(second.payment.transactionId).toBe(first.payment.transactionId);
      // Verify no duplicate record and gateway was called ONLY once
      expect(inMemoryPayments).toHaveLength(1);
      expect(mockGateway.getProcessedPayouts()).toHaveLength(1);
    });

    it('should handle 10 duplicate concurrent requests safely with exactly 1 payment record created', async () => {
      const idempotencyKey = 'IDEM-KEY-CONCURRENT-003';

      // Execute 10 simultaneous payout requests with the exact same idempotency key
      const concurrentCalls = Array.from({ length: 10 }).map(() =>
        paymentService.processPayout({
          pickupId: testPickupId,
          payerId: testPayerId,
          payeeId: testPayeeId,
          amountRupees: 1250.0,
          upiId: 'concurrent@okhdfcbank',
          idempotencyKey,
        })
      );

      const results = await Promise.all(concurrentCalls);

      // Verify all requests succeeded without error
      expect(results).toHaveLength(10);

      // Exactly 1 payment record must exist in DB
      expect(inMemoryPayments).toHaveLength(1);

      // All 10 returned the same payment ID
      const paymentIds = new Set(results.map((r) => r.payment.id));
      expect(paymentIds.size).toBe(1);

      // Exactly one had isDuplicate: false, the other 9 had isDuplicate: true
      const newCount = results.filter((r) => !r.isDuplicate).length;
      const dupCount = results.filter((r) => r.isDuplicate).length;
      expect(newCount).toBe(1);
      expect(dupCount).toBe(9);
    });

    it('should fail with NotFoundError if pickupId does not exist', async () => {
      await expect(
        paymentService.processPayout({
          pickupId: 'non-existent-pickup-id',
          payerId: testPayerId,
          payeeId: testPayeeId,
          amountRupees: 100.0,
          upiId: 'test@upi',
          idempotencyKey: 'IDEM-FAIL-001',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Collector Wallet Atomic Operations
   * -------------------------------------------------------------------------- */
  describe('WalletService Atomic Balance & Ledger', () => {
    let mockWalletRepo: WalletRepository;
    let mockCollectorRepo: CollectorRepository;
    let mockGateway: MockPaymentService;
    let walletService: WalletService;

    const testUserId = '00000000-0000-0000-0000-000000000010';
    const testCollectorId = '00000000-0000-0000-0000-000000000011';
    let currentBalance = new Prisma.Decimal('1000.00');
    let totalEarned = new Prisma.Decimal('2500.00');
    let totalWithdrawn = new Prisma.Decimal('1500.00');

    beforeEach(() => {
      currentBalance = new Prisma.Decimal('1000.00');
      totalEarned = new Prisma.Decimal('2500.00');
      totalWithdrawn = new Prisma.Decimal('1500.00');
      mockGateway = new MockPaymentService();

      mockCollectorRepo = {
        findByUserId: vi.fn(async (userId: string) => {
          if (userId === testUserId) {
            return { id: testCollectorId, userId: testUserId };
          }
          return null;
        }),
      } as unknown as CollectorRepository;

      mockWalletRepo = {
        findByCollectorId: vi.fn(async () => ({
          id: 'wallet-001',
          collectorId: testCollectorId,
          balance: currentBalance,
          totalEarned,
          totalWithdrawn,
          transactions: [],
          updatedAt: new Date(),
        })),
        debitWithdrawal: vi.fn(async (walletId: string, amountDecimal: Prisma.Decimal, upiId: string) => {
          currentBalance = currentBalance.sub(amountDecimal);
          totalWithdrawn = totalWithdrawn.add(amountDecimal);
          return {
            wallet: {
              id: walletId,
              collectorId: testCollectorId,
              balance: currentBalance,
              totalEarned,
              totalWithdrawn,
              updatedAt: new Date(),
            },
            transaction: {
              id: 'tx-001',
              walletId,
              type: 'DEBIT_WITHDRAWAL',
              amount: amountDecimal,
              referenceId: upiId,
              description: `UPI withdrawal to ${upiId}`,
              createdAt: new Date(),
            },
          };
        }),
        getTransactions: vi.fn(async () => ({ transactions: [], total: 0 })),
        creditCommission: vi.fn(async () => ({})),
      } as unknown as WalletRepository;

      walletService = new WalletService(mockWalletRepo, mockCollectorRepo, mockGateway);
    });

    it('should successfully withdraw funds when balance is sufficient', async () => {
      const result = await walletService.requestWithdrawal(testUserId, {
        amountRupees: 400.0,
        upiId: 'collector@okaxis',
        idempotencyKey: 'WITHDRAW-KEY-001',
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.transaction.amountRupees).toBe(400.0);
      expect(currentBalance.toFixed(2)).toBe('600.00');
    });

    it('should throw ValidationError when withdrawal amount exceeds available balance', async () => {
      await expect(
        walletService.requestWithdrawal(testUserId, {
          amountRupees: 2000.0, // Available is 1000.00
          upiId: 'collector@okaxis',
          idempotencyKey: 'WITHDRAW-KEY-EXCEED',
        })
      ).rejects.toThrow(ValidationError);

      // Verify balance did not change
      expect(currentBalance.toFixed(2)).toBe('1000.00');
    });
  });
});
