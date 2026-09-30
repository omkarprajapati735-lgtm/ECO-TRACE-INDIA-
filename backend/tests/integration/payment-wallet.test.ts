import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, PaymentStatus, PaymentMethod, WalletTransactionType, Prisma } from '@prisma/client';
import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';

// In-memory tables for integration test
interface InMemoryPayment {
  id: string;
  pickupId: string;
  payerId: string;
  payeeId: string;
  amount: Prisma.Decimal;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  idempotencyKey: string;
  status: PaymentStatus;
  createdAt: Date;
  completedAt: Date | null;
  payer?: { id: string; fullName: string; phone: string };
  payee?: { id: string; fullName: string; phone: string };
}

interface InMemoryWallet {
  id: string;
  collectorId: string;
  balance: Prisma.Decimal;
  totalEarned: Prisma.Decimal;
  totalWithdrawn: Prisma.Decimal;
  updatedAt: Date;
}

interface InMemoryWalletTx {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: Prisma.Decimal;
  referenceId: string | null;
  description: string;
  createdAt: Date;
}

const mockCollectorUser = {
  id: '33333333-3333-3333-3333-333333333333',
  fullName: 'Vikram Singh (Collector)',
  phone: '9876543233',
  role: Role.COLLECTOR,
};

const mockConsumerUser = {
  id: '44444444-4444-4444-4444-444444444444',
  fullName: 'Meera Sharma (Consumer)',
  phone: '9876543244',
  role: Role.CONSUMER,
};

const mockCollectorProfile = {
  id: 'col-int-0001',
  userId: mockCollectorUser.id,
  collectorType: 'KABADIWALA',
  verificationStatus: 'VERIFIED',
  rating: 5.0,
  user: mockCollectorUser,
};

const mockPickupRecord = {
  id: '55555555-5555-5555-5555-555555555555',
  consumerId: mockConsumerUser.id,
  collectorId: mockCollectorProfile.id,
  status: 'COLLECTED',
  finalAmount: new Prisma.Decimal('750.00'),
};

const inMemoryPayments: InMemoryPayment[] = [];
let inMemoryWallet: InMemoryWallet = {
  id: 'wal-int-0001',
  collectorId: mockCollectorProfile.id,
  balance: new Prisma.Decimal('2500.00'),
  totalEarned: new Prisma.Decimal('5000.00'),
  totalWithdrawn: new Prisma.Decimal('2500.00'),
  updatedAt: new Date(),
};
const inMemoryWalletTransactions: InMemoryWalletTx[] = [];

// Mock Prisma client
vi.mock('../../src/config/prisma', () => {
  const mockDb = {
    user: {
      findUnique: async ({ where }: { where: { id?: string } }) => {
        if (where.id === mockCollectorUser.id) return mockCollectorUser;
        if (where.id === mockConsumerUser.id) return mockConsumerUser;
        return null;
      },
    },
    collector: {
      findByUserId: async (userId: string) => {
        if (userId === mockCollectorUser.id) return mockCollectorProfile;
        return null;
      },
      findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
        if (where.userId === mockCollectorUser.id || where.id === mockCollectorProfile.id) {
          return mockCollectorProfile;
        }
        return null;
      },
    },
    pickup: {
      findById: async (id: string) => (id === mockPickupRecord.id ? mockPickupRecord : null),
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === mockPickupRecord.id ? mockPickupRecord : null,
      update: async ({ where, data }: { where: { id: string }; data: { status?: string } }) => ({
        ...mockPickupRecord,
        ...data,
      }),
    },
    payment: {
      findUnique: async ({ where }: { where: { idempotencyKey?: string; id?: string } }) => {
        if (where.idempotencyKey) {
          return inMemoryPayments.find((p) => p.idempotencyKey === where.idempotencyKey) || null;
        }
        if (where.id) {
          return inMemoryPayments.find((p) => p.id === where.id) || null;
        }
        return null;
      },
      findMany: async ({ where }: { where: { pickupId?: string } }) => {
        return inMemoryPayments.filter((p) => !where.pickupId || p.pickupId === where.pickupId);
      },
      create: async ({ data }: { data: Omit<InMemoryPayment, 'id' | 'createdAt'> }) => {
        const payment: InMemoryPayment = {
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
          completedAt: data.completedAt ?? null,
          payer: mockCollectorUser,
          payee: mockConsumerUser,
        };
        inMemoryPayments.push(payment);
        return payment;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: PaymentStatus; transactionId?: string; completedAt?: Date };
      }) => {
        const item = inMemoryPayments.find((p) => p.id === where.id);
        if (!item) throw new Error('Payment not found');
        if (data.status) item.status = data.status;
        if (data.transactionId !== undefined) item.transactionId = data.transactionId;
        if (data.completedAt !== undefined) item.completedAt = data.completedAt;
        return item;
      },
    },
    wallet: {
      findUnique: async ({ where }: { where: { collectorId?: string; id?: string } }) => {
        if (where.collectorId === mockCollectorProfile.id || where.id === inMemoryWallet.id) {
          return {
            ...inMemoryWallet,
            transactions: inMemoryWalletTransactions.filter((t) => t.walletId === inMemoryWallet.id),
          };
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          balance?: { increment?: Prisma.Decimal; decrement?: Prisma.Decimal };
          totalEarned?: { increment?: Prisma.Decimal };
          totalWithdrawn?: { increment?: Prisma.Decimal };
        };
      }) => {
        if (data.balance?.increment) {
          inMemoryWallet.balance = inMemoryWallet.balance.add(data.balance.increment);
        }
        if (data.balance?.decrement) {
          inMemoryWallet.balance = inMemoryWallet.balance.sub(data.balance.decrement);
        }
        if (data.totalEarned?.increment) {
          inMemoryWallet.totalEarned = inMemoryWallet.totalEarned.add(data.totalEarned.increment);
        }
        if (data.totalWithdrawn?.increment) {
          inMemoryWallet.totalWithdrawn = inMemoryWallet.totalWithdrawn.add(
            data.totalWithdrawn.increment
          );
        }
        inMemoryWallet.updatedAt = new Date();
        return { ...inMemoryWallet };
      },
      create: async ({ data }: { data: { collectorId: string } }) => {
        inMemoryWallet = {
          id: `wal-${Date.now()}`,
          collectorId: data.collectorId,
          balance: new Prisma.Decimal('0.00'),
          totalEarned: new Prisma.Decimal('0.00'),
          totalWithdrawn: new Prisma.Decimal('0.00'),
          updatedAt: new Date(),
        };
        return inMemoryWallet;
      },
    },
    walletTransaction: {
      create: async ({ data }: { data: Omit<InMemoryWalletTx, 'id' | 'createdAt'> }) => {
        const tx: InMemoryWalletTx = {
          id: `wtx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          createdAt: new Date(),
        };
        inMemoryWalletTransactions.push(tx);
        return tx;
      },
      findMany: async ({ where }: { where: { walletId: string } }) => {
        return inMemoryWalletTransactions.filter((t) => t.walletId === where.walletId);
      },
      count: async ({ where }: { where: { walletId: string } }) => {
        return inMemoryWalletTransactions.filter((t) => t.walletId === where.walletId).length;
      },
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback(mockDb);
    },
  };

  return { prisma: mockDb };
});

describe('Integration Tests: Payment & Wallet Engine (TICK-011)', () => {
  const app = createApp();

  const collectorToken = tokenService.generateAccessToken({
    userId: mockCollectorUser.id,
    role: Role.COLLECTOR,
  });

  const consumerToken = tokenService.generateAccessToken({
    userId: mockConsumerUser.id,
    role: Role.CONSUMER,
  });

  beforeEach(() => {
    inMemoryPayments.length = 0;
    inMemoryWalletTransactions.length = 0;
    inMemoryWallet = {
      id: 'wal-int-0001',
      collectorId: mockCollectorProfile.id,
      balance: new Prisma.Decimal('2500.00'),
      totalEarned: new Prisma.Decimal('5000.00'),
      totalWithdrawn: new Prisma.Decimal('2500.00'),
      updatedAt: new Date(),
    };
  });

  /* -------------------------------------------------------------
   * POST /api/v1/payments/payout
   * ------------------------------------------------------------- */
  describe('POST /api/v1/payments/payout', () => {
    const validPayload = {
      pickupId: mockPickupRecord.id,
      payeeId: mockConsumerUser.id,
      amountRupees: 750.0,
      upiId: 'meera@okaxis',
      notes: 'Payment for e-waste collected',
    };

    it('should reject with 401 Unauthorized when authorization token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Idempotency-Key', 'IDEM-KEY-VALID-01')
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject with 403 Forbidden when caller is CONSUMER', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${consumerToken}`)
        .set('Idempotency-Key', 'IDEM-KEY-VALID-02')
        .send(validPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject with 422 when Idempotency-Key header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send(validPayload);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Missing or invalid Idempotency-Key header');
    });

    it('should reject with 422 when Idempotency-Key is too short (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'short')
        .send(validPayload);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject with 422 when UPI ID format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'IDEM-KEY-VALID-03')
        .send({ ...validPayload, upiId: 'invalid-upi-handle-without-bank' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject with 422 when amount is zero or negative', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'IDEM-KEY-VALID-04')
        .send({ ...validPayload, amountRupees: -50.0 });

      expect(res.status).toBe(422);
    });

    it('should successfully initiate payout with 201 Created and return payment record', async () => {
      const res = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'IDEM-KEY-SUCCESS-01')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.amount).toBe('750');
      expect(res.body.data.transactionId).toBeTruthy();
      expect(inMemoryPayments).toHaveLength(1);
    });

    it('should return 200 OK with cached record and no new DB insert when repeating identical Idempotency-Key', async () => {
      const idempotencyKey = 'IDEM-KEY-CACHED-01';

      // 1st request
      const res1 = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(validPayload);

      expect(res1.status).toBe(201);
      expect(inMemoryPayments).toHaveLength(1);
      const originalTxId = res1.body.data.transactionId;

      // 2nd request with exact same key
      const res2 = await request(app)
        .post('/api/v1/payments/payout')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(validPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.data.id).toBe(res1.body.data.id);
      expect(res2.body.data.transactionId).toBe(originalTxId);
      // DB payments count remains 1 (no duplicate records)
      expect(inMemoryPayments).toHaveLength(1);
    });
  });

  /* -------------------------------------------------------------
   * GET /api/v1/wallets/me
   * ------------------------------------------------------------- */
  describe('GET /api/v1/wallets/me', () => {
    it('should return collector wallet details, balance, and recent transactions', async () => {
      const res = await request(app)
        .get('/api/v1/wallets/me')
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balanceRupees).toBe(2500);
      expect(res.body.data.totalEarnedRupees).toBe(5000);
      expect(res.body.data.totalWithdrawnRupees).toBe(2500);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });

  /* -------------------------------------------------------------
   * POST /api/v1/wallets/withdraw
   * ------------------------------------------------------------- */
  describe('POST /api/v1/wallets/withdraw', () => {
    it('should reject with 422 if Idempotency-Key is missing', async () => {
      const res = await request(app)
        .post('/api/v1/wallets/withdraw')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          amountRupees: 500.0,
          upiId: 'vikram@okaxis',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject with 422 when withdrawal amount exceeds available balance', async () => {
      const res = await request(app)
        .post('/api/v1/wallets/withdraw')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'WITHDRAW-EXCEED-01')
        .send({
          amountRupees: 3500.0, // Available balance is 2500.00
          upiId: 'vikram@okaxis',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('Insufficient balance');
      expect(inMemoryWallet.balance.toString()).toBe('2500');
    });

    it('should atomically process withdrawal and create double-entry ledger transaction', async () => {
      const res = await request(app)
        .post('/api/v1/wallets/withdraw')
        .set('Authorization', `Bearer ${collectorToken}`)
        .set('Idempotency-Key', 'WITHDRAW-SUCCESS-01')
        .send({
          amountRupees: 1000.0,
          upiId: 'vikram@okaxis',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transaction.amountRupees).toBe(1000);
      expect(res.body.data.transaction.type).toBe('DEBIT_WITHDRAWAL');

      // Balance reduced from 2500 to 1500
      expect(inMemoryWallet.balance.toString()).toBe('1500');
      // Total withdrawn increased from 2500 to 3500
      expect(inMemoryWallet.totalWithdrawn.toString()).toBe('3500');
      // Immutable ledger entry inserted
      expect(inMemoryWalletTransactions).toHaveLength(1);
    });
  });
});
