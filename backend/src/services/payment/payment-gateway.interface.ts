import { PayoutDetails, PayoutResult } from '../../types';

export { PayoutDetails, PayoutResult };

export interface IPaymentService {
  /**
   * Process a payout via UPI to the designated payee.
   * Enforces integer paise and idempotency key.
   */
  processPayout(payoutDetails: PayoutDetails): Promise<PayoutResult>;
}
