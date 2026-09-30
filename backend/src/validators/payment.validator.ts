import { z } from 'zod';

const upiRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export const payoutSchema = z.object({
  pickupId: z.string().uuid({ message: 'pickupId must be a valid UUID' }),
  payeeId: z.string().uuid({ message: 'payeeId must be a valid UUID' }),
  amountRupees: z
    .number()
    .positive({ message: 'amountRupees must be strictly greater than 0' })
    .max(1000000, { message: 'amountRupees cannot exceed ₹10,00,000' }),
  paymentMethod: z
    .enum(['UPI', 'BANK_TRANSFER', 'WALLET', 'CASH'])
    .optional()
    .default('UPI'),
  upiId: z.string().regex(upiRegex, {
    message: 'Invalid UPI ID format. Expected format: handle@bank (e.g. collector@okaxis)',
  }),
  notes: z.string().max(255).optional(),
});

export const withdrawSchema = z.object({
  amountRupees: z
    .number()
    .positive({ message: 'Withdrawal amount must be strictly greater than 0' })
    .max(500000, { message: 'Single withdrawal cannot exceed ₹5,00,000' }),
  upiId: z.string().regex(upiRegex, {
    message: 'Invalid UPI ID format. Expected format: handle@bank (e.g. collector@okaxis)',
  }),
});

export const idempotencyHeaderSchema = z
  .string({ required_error: 'Idempotency-Key header is mandatory for payment transactions' })
  .min(8, { message: 'Idempotency-Key must be at least 8 characters' })
  .max(100, { message: 'Idempotency-Key must not exceed 100 characters' });

export type PayoutInput = z.infer<typeof payoutSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
