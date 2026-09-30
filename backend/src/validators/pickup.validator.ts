import { z } from 'zod';

const weightSchema = z
  .number({ invalid_type_error: 'Estimated weight must be a number' })
  .positive('Estimated weight must be greater than 0 kg')
  .max(5000, 'Estimated weight cannot exceed 5000 kg')
  .refine(
    (val) => Number(val.toFixed(3)) === val,
    'Estimated weight precision must not exceed 3 decimal places'
  );

const actualWeightSchema = z
  .number({ invalid_type_error: 'Actual weight must be a number' })
  .positive('Actual weight must be greater than 0 kg')
  .max(5000, 'Actual weight cannot exceed 5000 kg')
  .refine(
    (val) => Number(val.toFixed(3)) === val,
    'Actual weight precision must not exceed 3 decimal places'
  );

export const pickupItemInputSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID (must be a valid UUID)'),
  estimatedWeightKg: weightSchema,
});

export const pickupAddressSchema = z.object({
  addressLine: z.string().trim().min(5, 'Address line must have at least 5 characters').max(255),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Postal code must be exactly 6 digits'),
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
  isDefault: z.boolean().optional(),
});

export const createPickupSchema = z
  .object({
    items: z.array(pickupItemInputSchema).min(1, 'At least one scrap item is required'),
    addressId: z.string().uuid('Invalid address ID').optional(),
    address: pickupAddressSchema.optional(),
    scheduledDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Scheduled date must be in YYYY-MM-DD format')
      .refine((val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduled = new Date(val);
        return !isNaN(scheduled.getTime()) && scheduled >= today;
      }, 'Scheduled date cannot be in the past'),
    scheduledSlot: z.string().trim().min(3, 'Scheduled time slot is required').max(50),
    notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
  })
  .refine((data) => Boolean(data.addressId || data.address), {
    message: 'Either addressId or address details must be provided',
    path: ['address'],
  });

export const estimateValuationSchema = z.object({
  items: z.array(pickupItemInputSchema).min(1, 'At least one item is required for estimation'),
});

export const nearbyPickupsQuerySchema = z.object({
  lat: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90'),
  lng: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180'),
  radiusKm: z.coerce
    .number()
    .positive('Radius must be greater than 0 km')
    .max(100, 'Radius cannot exceed 100 km')
    .optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const recordPickupItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID (must be a valid UUID)'),
  actualWeightKg: actualWeightSchema,
  pricePerKg: z.number().positive('Price per kg must be positive').optional(),
  imageProofUrl: z.string().url('imageProofUrl must be a valid URL').optional().or(z.literal('')),
});

export const recordPickupItemsPayloadSchema = z.union([
  recordPickupItemSchema,
  z.object({
    items: z.array(recordPickupItemSchema).min(1, 'At least one item is required'),
  }),
]);
