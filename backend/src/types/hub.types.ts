export interface HubIntakeVerifyInput {
  collectorId: string;
  verifiedWeightKg: number;
  pickupIds: string[];
  storageBin: string;
}

export interface HubIntakePreviewItem {
  id: string;
  pickupId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  claimedWeightKg: number;
  pricePerKg: number;
  hasPhoto: boolean;
}

export interface HubIntakePreview {
  hubId: string;
  collectorId: string;
  collectorName: string;
  pickupCount: number;
  totalClaimedWeightKg: number;
  items: HubIntakePreviewItem[];
}

export interface HubIntakeResult {
  status: 'ACCEPTED' | 'FLAGGED_DISCREPANCY';
  discrepancyPercent: number;
  claimedWeightKg: number;
  verifiedWeightKg: number;
  commissionAmount?: number;
  message: string;
  pickupIds: string[];
  storageBin?: string;
}

export interface HubInventoryItemDto {
  id: string;
  hubId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  quantityKg: number;
  storageBin: string;
  updatedAt: Date;
}
