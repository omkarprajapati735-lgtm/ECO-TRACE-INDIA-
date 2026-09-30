import {
  PrismaClient,
  Wallet,
  WalletTransaction,
  WalletTransactionType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../config/prisma';
import { CurrencyUtil } from '../utils/currency';
import { ValidationError, NotFoundError } from '../errors/app-error';

export interface WalletWithTransactions extends Wallet {
  transactions: WalletTransaction[];
}

export class WalletRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findByCollectorId(collectorId: string): Promise<WalletWithTransactions | null> {
    return this.db.wallet.findUnique({
      where: { collectorId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async findById(walletId: string): Promise<Wallet | null> {
    return this.db.wallet.findUnique({
      where: { id: walletId },
    });
  }

  async createWallet(collectorId: string): Promise<Wallet> {
    return this.db.wallet.create({
      data: {
        collectorId,
        balance: 0.0,
        totalEarned: 0.0,
        totalWithdrawn: 0.0,
      },
    });
  }

  /**
   * Atomically credits commission to collector wallet and inserts immutable ledger transaction.
   */
  async creditCommission(
    walletId: string,
    amount: Prisma.Decimal | number,
    referenceId?: string,
    description = 'Commission credit'
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const amountPaise = CurrencyUtil.toPaise(amount);
    if (amountPaise <= 0) {
      throw new ValidationError('Commission credit amount must be greater than zero');
    }
    const amountDecimal = CurrencyUtil.paiseToDecimal(amountPaise);

    return this.db.$transaction(async (tx) => {
      const existingWallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!existingWallet) {
        throw new NotFoundError(`Wallet ${walletId} not found`);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amountDecimal },
          totalEarned: { increment: amountDecimal },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: WalletTransactionType.CREDIT_COLLECTION_COMMISSION,
          amount: amountDecimal,
          referenceId: referenceId ?? null,
          description,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Atomically debits withdrawal from collector wallet after checking balance in integer paise.
   */
  async debitWithdrawal(
    walletId: string,
    amount: Prisma.Decimal | number,
    upiId: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const amountPaise = CurrencyUtil.toPaise(amount);
    if (amountPaise <= 0) {
      throw new ValidationError('Withdrawal amount must be greater than zero');
    }
    const amountDecimal = CurrencyUtil.paiseToDecimal(amountPaise);

    return this.db.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!currentWallet) {
        throw new NotFoundError(`Wallet ${walletId} not found`);
      }

      const balancePaise = CurrencyUtil.toPaise(currentWallet.balance);
      if (balancePaise < amountPaise) {
        throw new ValidationError(
          `Insufficient wallet balance. Available: ₹${(balancePaise / 100).toFixed(2)}, Requested: ₹${(amountPaise / 100).toFixed(2)}`
        );
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amountDecimal },
          totalWithdrawn: { increment: amountDecimal },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: WalletTransactionType.DEBIT_WITHDRAWAL,
          amount: amountDecimal,
          referenceId: upiId,
          description: `UPI withdrawal to ${upiId}`,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Retrieves paginated transaction ledger for a given wallet.
   */
  async getTransactions(
    walletId: string,
    limit = 20,
    offset = 0
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.db.walletTransaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.db.walletTransaction.count({
        where: { walletId },
      }),
    ]);

    return { transactions, total };
  }
}

export const walletRepository = new WalletRepository();
