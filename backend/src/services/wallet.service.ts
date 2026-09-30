import { Wallet, WalletTransaction, Prisma } from '@prisma/client';
import { WalletRepository, walletRepository } from '../repositories/wallet.repository';
import { CollectorRepository, collectorRepository } from '../repositories/collector.repository';
import { IPaymentService } from './payment/payment-gateway.interface';
import { mockPaymentService } from './payment/mock-payment.service';
import { razorpayPaymentService } from './payment/razorpay.service';
import { CurrencyUtil } from '../utils/currency';
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { NotFoundError, ValidationError, ConflictError } from '../errors/app-error';
import { WalletSummaryDto, WalletTransactionDto } from '../types';

export interface WithdrawRequestInput {
  amountRupees: number;
  upiId: string;
  idempotencyKey: string;
}

export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository = walletRepository,
    private readonly collectorRepo: CollectorRepository = collectorRepository,
    private readonly paymentGateway: IPaymentService = env.NODE_ENV === 'production'
      ? razorpayPaymentService
      : mockPaymentService
  ) {}

  /**
   * Retrieves the wallet summary and recent ledger transactions for a collector.
   */
  async getWalletByUserId(userId: string): Promise<WalletSummaryDto> {
    const collector = await this.collectorRepo.findByUserId(userId);
    if (!collector) {
      throw new NotFoundError('Collector profile not found for the authenticated user');
    }

    let wallet = await this.walletRepo.findByCollectorId(collector.id);
    if (!wallet) {
      await this.walletRepo.createWallet(collector.id);
      wallet = await this.walletRepo.findByCollectorId(collector.id);
      if (!wallet) {
        throw new NotFoundError('Could not initialize wallet for collector');
      }
    }

    return {
      walletId: wallet.id,
      collectorId: collector.id,
      balanceRupees: CurrencyUtil.decimalToRupees(wallet.balance),
      totalEarnedRupees: CurrencyUtil.decimalToRupees(wallet.totalEarned),
      totalWithdrawnRupees: CurrencyUtil.decimalToRupees(wallet.totalWithdrawn),
      transactions: (wallet.transactions || []).map((tx) => this.mapTransactionDto(tx)),
    };
  }

  /**
   * Requests an atomic withdrawal to UPI with balance validation and idempotency protection.
   */
  async requestWithdrawal(
    userId: string,
    input: WithdrawRequestInput
  ): Promise<{ wallet: Wallet; transaction: WalletTransactionDto; isDuplicate: boolean }> {
    const collector = await this.collectorRepo.findByUserId(userId);
    if (!collector) {
      throw new NotFoundError('Collector profile not found for user');
    }

    const wallet = await this.walletRepo.findByCollectorId(collector.id);
    if (!wallet) {
      throw new NotFoundError('Collector wallet not found');
    }

    // Check for idempotency: if a withdrawal with this referenceId / key already exists
    const existingTransactions = await this.walletRepo.getTransactions(wallet.id, 50, 0);
    const existingTx = existingTransactions.transactions.find(
      (tx) => tx.referenceId === input.idempotencyKey || tx.referenceId === input.upiId && tx.description.includes(input.idempotencyKey)
    );
    if (existingTx) {
      logger.info(
        { idempotencyKey: input.idempotencyKey, txId: existingTx.id },
        '[WalletService] Duplicate withdrawal request detected — returning cached transaction'
      );
      return {
        wallet,
        transaction: this.mapTransactionDto(existingTx),
        isDuplicate: true,
      };
    }

    const requestedPaise = CurrencyUtil.toPaise(input.amountRupees);
    if (requestedPaise <= 0) {
      throw new ValidationError('Withdrawal amount must be strictly greater than zero');
    }

    const availablePaise = CurrencyUtil.toPaise(wallet.balance);
    if (availablePaise < requestedPaise) {
      throw new ValidationError(
        `Insufficient balance. Available: ₹${(availablePaise / 100).toFixed(2)}, Requested: ₹${(requestedPaise / 100).toFixed(2)}`
      );
    }

    // Process payout through gateway adapter
    const payoutResult = await this.paymentGateway.processPayout({
      payeeId: userId,
      amountPaise: requestedPaise,
      upiId: input.upiId,
      idempotencyKey: input.idempotencyKey,
      notes: `Withdrawal by collector ${collector.id}`,
    });

    if (!payoutResult.success) {
      logger.error(
        { error: payoutResult.errorMessage, upiId: input.upiId },
        '[WalletService] Gateway withdrawal payout failed'
      );
      throw new ValidationError(
        `Payout gateway failed to process withdrawal: ${payoutResult.errorMessage || 'Transaction rejected'}`
      );
    }

    // Atomically debit wallet balance and record ledger entry
    const { wallet: updatedWallet, transaction } = await this.walletRepo.debitWithdrawal(
      wallet.id,
      CurrencyUtil.paiseToDecimal(requestedPaise),
      `${input.upiId} [${input.idempotencyKey}]`
    );

    return {
      wallet: updatedWallet,
      transaction: this.mapTransactionDto(transaction),
      isDuplicate: false,
    };
  }

  /**
   * Atomically credits commission to collector's wallet.
   */
  async creditCommission(
    collectorId: string,
    amountRupees: number,
    referenceId?: string,
    description?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransactionDto }> {
    let wallet = await this.walletRepo.findByCollectorId(collectorId);
    if (!wallet) {
      await this.walletRepo.createWallet(collectorId);
      wallet = await this.walletRepo.findByCollectorId(collectorId);
      if (!wallet) {
        throw new NotFoundError(`Unable to locate wallet for collector ${collectorId}`);
      }
    }

    const amountPaise = CurrencyUtil.toPaise(amountRupees);
    const amountDecimal = CurrencyUtil.paiseToDecimal(amountPaise);

    const { wallet: updatedWallet, transaction } = await this.walletRepo.creditCommission(
      wallet.id,
      amountDecimal,
      referenceId,
      description
    );

    return {
      wallet: updatedWallet,
      transaction: this.mapTransactionDto(transaction),
    };
  }

  /**
   * Retrieves paginated transaction ledger for the authenticated collector.
   */
  async getTransactions(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ transactions: WalletTransactionDto[]; total: number }> {
    const collector = await this.collectorRepo.findByUserId(userId);
    if (!collector) {
      throw new NotFoundError('Collector profile not found for user');
    }

    let wallet = await this.walletRepo.findByCollectorId(collector.id);
    if (!wallet) {
      await this.walletRepo.createWallet(collector.id);
      wallet = await this.walletRepo.findByCollectorId(collector.id);
      if (!wallet) return { transactions: [], total: 0 };
    }

    const result = await this.walletRepo.getTransactions(wallet.id, limit, offset);
    return {
      transactions: result.transactions.map((tx) => this.mapTransactionDto(tx)),
      total: result.total,
    };
  }

  private mapTransactionDto(tx: WalletTransaction): WalletTransactionDto {
    return {
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amountRupees: CurrencyUtil.decimalToRupees(tx.amount),
      referenceId: tx.referenceId,
      description: tx.description,
      createdAt: tx.createdAt,
    };
  }
}

export const walletService = new WalletService();
