import { z } from 'zod';

export const resolveDiscrepancySchema = z.object({
  resolution: z.enum(['APPROVE', 'FORFEIT'], {
    required_error: "resolution is required and must be either 'APPROVE' or 'FORFEIT'",
  }),
  notes: z
    .string()
    .min(3, { message: 'notes must be at least 3 characters if provided' })
    .max(500, { message: 'notes cannot exceed 500 characters' })
    .optional(),
});

export const discrepancyParamsSchema = z.object({
  id: z.string().uuid({ message: 'Discrepancy pickup ID must be a valid UUID' }),
});

export type ResolveDiscrepancyInput = z.infer<typeof resolveDiscrepancySchema>;
export type DiscrepancyParamsInput = z.infer<typeof discrepancyParamsSchema>;
