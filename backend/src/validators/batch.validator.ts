import { z } from 'zod';
import { BatchStatus } from '@prisma/client';

export const createBatchSchema = z
  .object({
    hubId: z.string().uuid({ message: 'hubId must be a valid UUID' }),
    categoryId: z.string().uuid({ message: 'categoryId must be a valid UUID' }),
    grossWeightKg: z
      .number({ required_error: 'grossWeightKg is required' })
      .positive({ message: 'grossWeightKg must be positive' }),
    netWeightKg: z
      .number({ required_error: 'netWeightKg is required' })
      .positive({ message: 'netWeightKg must be positive' }),
    recyclerId: z.string().uuid({ message: 'recyclerId must be a valid UUID' }).optional().nullable(),
    storageBin: z.string().max(50).optional(),
  })
  .refine((data) => data.netWeightKg <= data.grossWeightKg, {
    message: 'netWeightKg cannot exceed grossWeightKg',
    path: ['netWeightKg'],
  });

export const sealBatchSchema = z.object({
  manifestUrl: z.string().url({ message: 'manifestUrl must be a valid URL' }).optional().nullable(),
  storageBin: z.string().max(50).optional(),
});

export const listBatchesQuerySchema = z.object({
  hubId: z.string().uuid().optional(),
  recyclerId: z.string().uuid().optional(),
  status: z.nativeEnum(BatchStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateBatchSchemaInput = z.infer<typeof createBatchSchema>;
export type SealBatchSchemaInput = z.infer<typeof sealBatchSchema>;
export type ListBatchesQueryInput = z.infer<typeof listBatchesQuerySchema>;
