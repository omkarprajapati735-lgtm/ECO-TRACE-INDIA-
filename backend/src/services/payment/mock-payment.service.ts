import { IPaymentService, PayoutDetails, PayoutResult } from './payment-gateway.interface';
import { logger } from '../../config/logger';

export class MockPaymentService implements IPaymentService {
  private processedPayouts: PayoutDetails[] = [];
  private shouldFail = false;
  private failureReason = 'Mock payment failure simulated';

  async processPayout(payoutDetails: PayoutDetails): Promise<PayoutResult> {
    logger.info(
      {
        payeeId: payoutDetails.payeeId,
        amountPaise: payoutDetails.amountPaise,
        upiId: payoutDetails.upiId,
        idempotencyKey: payoutDetails.idempotencyKey,
      },
      '[MockPaymentService] Processing mock payout'
    );

    if (this.shouldFail || payoutDetails.upiId.endsWith('@fail') || payoutDetails.amountPaise <= 0) {
      return {
        success: false,
        transactionId: `mock_fail_${Date.now()}`,
        status: 'FAILED',
        amountPaise: payoutDetails.amountPaise,
        errorMessage: this.shouldFail
          ? this.failureReason
          : payoutDetails.amountPaise <= 0
          ? 'Amount must be greater than 0'
          : 'Simulated UPI transfer failure',
      };
    }

    this.processedPayouts.push(payoutDetails);

    const safeKeyPrefix = payoutDetails.idempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const transactionId = `mock_tx_${safeKeyPrefix}_${Date.now()}`;

    return {
      success: true,
      transactionId,
      status: 'COMPLETED',
      amountPaise: payoutDetails.amountPaise,
      rawResponse: {
        gateway: 'MOCK_UPI_SERVICE',
        simulatedAt: new Date().toISOString(),
        rrn: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      },
    };
  }

  // Testing helpers
  setShouldFail(fail: boolean, reason = 'Mock payment failure simulated'): void {
    this.shouldFail = fail;
    this.failureReason = reason;
  }

  getProcessedPayouts(): readonly PayoutDetails[] {
    return [...this.processedPayouts];
  }

  clear(): void {
    this.processedPayouts = [];
    this.shouldFail = false;
  }
}

export const mockPaymentService = new MockPaymentService();
