import { AdminRepository, adminRepository } from '../repositories/admin.repository';
import { logger } from '../config/logger';
import {
  PlatformAnalyticsDto,
  FlaggedDiscrepancyDto,
  DiscrepancyResolutionResult,
  DiscrepancyResolutionType,
} from '../types/admin.types';

export class AdminService {
  constructor(private readonly repo: AdminRepository = adminRepository) {}

  async getAnalytics(): Promise<PlatformAnalyticsDto> {
    logger.info('[AdminService] Fetching platform analytics metrics');
    const analytics = await this.repo.getPlatformAnalytics();
    return analytics;
  }

  async getDiscrepancyRadar(): Promise<FlaggedDiscrepancyDto[]> {
    logger.info('[AdminService] Fetching flagged discrepancy radar lots');
    const discrepancies = await this.repo.getFlaggedDiscrepancies();
    return discrepancies;
  }

  async resolveDiscrepancy(
    pickupId: string,
    resolution: DiscrepancyResolutionType,
    notes?: string,
    adminId?: string
  ): Promise<DiscrepancyResolutionResult> {
    logger.info(
      { pickupId, resolution, adminId },
      `[AdminService] Admin resolving discrepancy for pickup ${pickupId}`
    );
    const result = await this.repo.resolveDiscrepancy(pickupId, resolution, notes, adminId);
    return result;
  }
}

export const adminService = new AdminService();
