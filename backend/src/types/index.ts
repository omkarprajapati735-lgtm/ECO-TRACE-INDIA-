import { Role } from '@prisma/client';

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export interface HealthCheckData {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  version: string;
  timestamp: string;
}

export interface AuthUserPayload {
  userId: string;
  role: Role;
  phone?: string;
  email?: string | null;
}

export interface SafeUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: Role;
  preferredLanguage: string;
  isVerified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendOtpDto {
  phone: string;
}

export interface VerifyOtpDto {
  phone: string;
  otp: string;
  role?: Role;
}

export interface RegisterDto {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role?: Role;
  preferredLanguage?: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface AuthResponseData {
  user: SafeUser;
  accessToken: string;
  refreshToken?: string;
}

export interface WasteCategoryDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseRatePerKg: number;
  minRatePerKg: number;
  maxRatePerKg: number;
  isActive: boolean;
}

export interface PricingItemInput {
  categoryId: string;
  estimatedWeightKg: number;
}

export interface ItemValuationBreakdown {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  estimatedWeightKg: number;
  baseRatePerKg: number;
  minRatePerKg: number;
  maxRatePerKg: number;
  estimatedAmount: number;
  minEstimatedAmount: number;
  maxEstimatedAmount: number;
}

export interface ScrapValuationResult {
  totalEstimatedAmount: number;
  totalMinEstimatedAmount: number;
  totalMaxEstimatedAmount: number;
  totalWeightKg: number;
  itemBreakdown: ItemValuationBreakdown[];
}

export interface CreatePickupAddressInput {
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface CreatePickupInput {
  items: PricingItemInput[];
  addressId?: string;
  address?: CreatePickupAddressInput;
  scheduledDate: string; // YYYY-MM-DD
  scheduledSlot: string;
  notes?: string;
}

export interface PickupItemDto {
  id: string;
  pickupId: string;
  categoryId: string;
  category: {
    id: string;
    code: string;
    name: string;
  };
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  pricePerKg: number;
  totalAmount: number | null;
  imageProofUrl: string | null;
  createdAt: Date;
}

export interface PickupDetailDto {
  id: string;
  consumerId: string;
  collectorId: string | null;
  hubId: string | null;
  addressId: string;
  status: string;
  scheduledDate: Date;
  scheduledSlot: string;
  estimatedAmount: number;
  finalAmount: number | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  consumer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  collector?: {
    id: string;
    userId: string;
    collectorType: string;
    rating: number;
    user: {
      fullName: string;
      phone: string;
    };
  } | null;
  address: {
    id: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  items: PickupItemDto[];
}

export interface NearbyPickupsQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface NearbyPickupDto extends PickupDetailDto {
  distanceKm: number;
}

export interface RecordPickupItemInput {
  categoryId: string;
  actualWeightKg: number;
  pricePerKg?: number;
  imageProofUrl?: string;
}

export interface AiClassificationResult {
  predictedCategory: string;
  confidence: number;
  reasoning?: string;
  isFallback: boolean;
  fraudRiskScore?: number;
  suggestedAction?: string;
}

export interface ClassifyWasteDto {
  image: string;
}

export interface PayoutDetails {
  payeeId: string;
  amountPaise: number;
  upiId: string;
  idempotencyKey: string;
  notes?: string;
}

export interface PayoutResult {
  success: boolean;
  transactionId: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  amountPaise: number;
  rawResponse?: Record<string, unknown>;
  errorMessage?: string;
}

export interface InitiatePayoutDto {
  pickupId: string;
  payeeId: string;
  amountRupees: number;
  paymentMethod?: 'UPI' | 'BANK_TRANSFER' | 'WALLET' | 'CASH';
  upiId: string;
  notes?: string;
}

export interface WalletWithdrawDto {
  amountRupees: number;
  upiId: string;
}

export interface WalletTransactionDto {
  id: string;
  walletId: string;
  type: string;
  amountRupees: number;
  referenceId: string | null;
  description: string;
  createdAt: Date;
}

export interface WalletSummaryDto {
  walletId: string;
  collectorId: string;
  balanceRupees: number;
  totalEarnedRupees: number;
  totalWithdrawnRupees: number;
  transactions: WalletTransactionDto[];
}

export * from './hub.types';
export * from './batch.types';
export * from './recycler.types';
export * from './admin.types';



