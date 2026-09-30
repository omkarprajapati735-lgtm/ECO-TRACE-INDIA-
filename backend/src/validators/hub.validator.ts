import { z } from 'zod';

export const verifyIntakeSchema = z.object({
  collectorId: z.string().uuid({ message: 'collectorId must be a valid UUID' }),
  verifiedWeightKg: z
    .number({ required_error: 'verifiedWeightKg is required' })
    .positive({ message: 'verifiedWeightKg must be positive' })
    .refine((val) => Number(val.toFixed(3)) === val || val.toString().split('.')[1]?.length <= 3, {
      message: 'verifiedWeightKg cannot have more than 3 decimal places',
    }),
  pickupIds: z
    .array(z.string().uuid({ message: 'Each pickupId must be a valid UUID' }))
    .min(1, { message: 'At least one pickupId must be provided' }),
  storageBin: z
    .string()
    .min(1, { message: 'storageBin is required' })
    .max(50, { message: 'storageBin cannot exceed 50 characters' }),
});

export const intakePreviewQuerySchema = z.object({
  collectorId: z.string().uuid({ message: 'collectorId query parameter must be a valid UUID' }),
});

export type VerifyIntakeSchemaInput = z.infer<typeof verifyIntakeSchema>;
export type IntakePreviewQueryInput = z.infer<typeof intakePreviewQuerySchema>;
