import { z } from 'zod';

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  iconName: string;
  baseRate: number;
  minRate: number;
  maxRate: number;
  description: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface BookingCategorySelection {
  categoryId: string;
  weightKg: number;
}

export const bookingFormZodSchema = z.object({
  selectedCategories: z
    .array(z.string())
    .min(1, 'Please select at least one e-waste category'),
  totalWeightKg: z
    .number({ invalid_type_error: 'Weight must be a number' })
    .min(0.5, 'Minimum pickup weight is 0.5 kg')
    .max(500, 'Maximum residential pickup is 500 kg')
    .refine(
      (val) => Number(val.toFixed(3)) === val,
      'Weight must not exceed 3 decimal places'
    ),
  addressId: z.string().min(1, 'Please select a pickup address'),
  scheduledDate: z
    .string()
    .min(1, 'Please select a scheduled date')
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduled = new Date(val);
      return !isNaN(scheduled.getTime()) && scheduled >= today;
    }, 'Scheduled date cannot be in the past'),
  scheduledSlot: z.string().min(1, 'Please select a preferred time slot'),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional(),
});

export type BookingFormData = z.infer<typeof bookingFormZodSchema>;

export type TrackerStage =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'COLLECTOR_ARRIVED'
  | 'COLLECTED'
  | 'COMPLETED';

export interface TrackerItem {
  name: string;
  code: string;
  weightKg: number;
  ratePerKg: number;
  subtotal: number;
}

export interface PickupTrackerData {
  id: string;
  status: TrackerStage;
  scheduledDate: string;
  scheduledSlot: string;
  createdAt: string;
  estimatedAmount: number;
  minEstimatedAmount: number;
  maxEstimatedAmount: number;
  finalAmount: number | null;
  doorstepOtp: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  collector: {
    fullName: string;
    phone: string;
    rating: number;
    totalTrips: number;
    vehicleNumber: string;
    isVerified: boolean;
  } | null;
  items: TrackerItem[];
}
