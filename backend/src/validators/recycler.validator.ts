import { z } from 'zod';
import { BatchStatus } from '@prisma/client';

export const processYieldsSchema = z.object({
  copperKg: z
    .number({ required_error: 'copperKg is required' })
    .min(0, 'copperKg cannot be negative'),
  goldKg: z
    .number({ required_error: 'goldKg is required' })
    .min(0, 'goldKg cannot be negative'),
  aluminumKg: z
    .number({ required_error: 'aluminumKg is required' })
    .min(0, 'aluminumKg cannot be negative'),
  plasticKg: z
    .number({ required_error: 'plasticKg is required' })
    .min(0, 'plasticKg cannot be negative'),
  wasteKg: z
    .number({ required_error: 'wasteKg is required' })
    .min(0, 'wasteKg cannot be negative'),
  notes: z.string().max(500).optional(),
});

export const generateEprSchema = z.object({
  batchId: z.string().uuid('Invalid batchId format (must be UUID)'),
  issuedTo: z
    .string({ required_error: 'issuedTo is required' })
    .min(2, 'issuedTo must be at least 2 characters')
    .max(200, 'issuedTo must not exceed 200 characters'),
  recyclerId: z.string().uuid('Invalid recyclerId format').optional(),
});

export const verifyCertificateParamsSchema = z.object({
  certificateNumber: z
    .string({ required_error: 'certificateNumber is required' })
    .min(5, 'Certificate number is too short')
    .max(100, 'Certificate number is too long'),
});

export const listRecyclerBatchesQuerySchema = z.object({
  status: z.nativeEnum(BatchStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});
