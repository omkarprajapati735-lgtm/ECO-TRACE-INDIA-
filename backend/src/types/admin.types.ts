export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  totalWeightKg: number;
  percentage: number;
}

export interface MonthlyTrendDto {
  month: string;
  pcb: number;
  battery: number;
  appliance: number;
  metal: number;
  totalWeightKg: number;
}

export interface PlatformAnalyticsDto {
  platformTonnageKg: number;
  totalPayoutsRupees: number;
  activeCollectors: number;
  discrepancyCount: number;
  categoryBreakdown: CategoryBreakdownDto[];
  monthlyTrends: MonthlyTrendDto[];
}

export interface DiscrepancyCollectorDto {
  id: string;
  fullName: string;
  phone: string;
  rating: number;
  collectorType: string;
}

export interface DiscrepancyHubDto {
  id: string;
  name: string;
  managerName?: string;
  address?: string;
}

export interface FlaggedDiscrepancyDto {
  pickupId: string;
  date: string;
  claimedWeightKg: number;
  verifiedWeightKg: number;
  variancePercent: number;
  status: string;
  notes?: string | null;
  collector: DiscrepancyCollectorDto | null;
  hub: DiscrepancyHubDto | null;
  createdAt: Date;
}

export type DiscrepancyResolutionType = 'APPROVE' | 'FORFEIT';

export interface ResolveDiscrepancyPayload {
  resolution: DiscrepancyResolutionType;
  notes?: string;
}

export interface DiscrepancyResolutionResult {
  pickupId: string;
  previousStatus: string;
  currentStatus: string;
  resolution: DiscrepancyResolutionType;
  notes?: string;
  resolvedByAdminId: string;
  resolvedAt: Date;
}
