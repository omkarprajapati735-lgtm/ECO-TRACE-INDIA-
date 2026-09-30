import { Role, PickupStatus } from '@prisma/client';
import { PickupRepository, pickupRepository } from '../repositories/pickup.repository';
import { PricingService, pricingService } from './pricing.service';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { CollectorRepository, collectorRepository } from '../repositories/collector.repository';
import { CreatePickupInput, NearbyPickupsQuery, RecordPickupItemInput } from '../types';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../errors/app-error';

export class PickupService {
  constructor(
    private readonly pickupRepo: PickupRepository = pickupRepository,
    private readonly pricing: PricingService = pricingService,
    private readonly userRepo: UserRepository = userRepository,
    private readonly collectorRepo: CollectorRepository = collectorRepository
  ) {}

  async createPickup(consumerId: string, data: CreatePickupInput) {
    const consumer = await this.userRepo.findById(consumerId);
    if (!consumer) throw new NotFoundError('Consumer user not found');
    if (!data.items?.length) throw new ValidationError('At least one scrap item is required');

    let resolvedAddressId: string;
    let latitude: number;
    let longitude: number;

    if (data.addressId) {
      const address = await this.pickupRepo.findAddressById(data.addressId);
      if (!address) throw new NotFoundError(`Address with ID '${data.addressId}' not found`);
      resolvedAddressId = address.id;
      latitude = address.latitude;
      longitude = address.longitude;
    } else if (data.address) {
      const newAddress = await this.pickupRepo.createAddress(consumerId, data.address);
      resolvedAddressId = newAddress.id;
      latitude = newAddress.latitude;
      longitude = newAddress.longitude;
    } else {
      throw new ValidationError('Either addressId or new address details must be provided');
    }

    const valuation = await this.pricing.calculateScrapValuation(data.items);
    const scheduledDateObj = new Date(data.scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      throw new ValidationError('Invalid scheduledDate format. Expected YYYY-MM-DD');
    }

    const pickup = await this.pickupRepo.createPickup({
      consumerId,
      addressId: resolvedAddressId,
      latitude,
      longitude,
      scheduledDate: scheduledDateObj,
      scheduledSlot: data.scheduledSlot,
      estimatedAmount: valuation.totalEstimatedAmount,
      notes: data.notes,
      items: valuation.itemBreakdown.map((item) => ({
        categoryId: item.categoryId,
        estimatedWeightKg: item.estimatedWeightKg,
        pricePerKg: item.baseRatePerKg,
        totalAmount: item.estimatedAmount,
      })),
    });

    return {
      ...pickup,
      estimatedRange: {
        min: valuation.totalMinEstimatedAmount,
        max: valuation.totalMaxEstimatedAmount,
      },
      itemBreakdown: valuation.itemBreakdown,
    };
  }

  async getNearbyPickups(userId: string, role: Role, query: NearbyPickupsQuery) {
    if (role !== Role.COLLECTOR && role !== Role.ADMIN) {
      throw new ForbiddenError('Only collectors and administrators can discover nearby jobs');
    }

    let radiusKm = query.radiusKm ?? 10;
    if (role === Role.COLLECTOR) {
      const profile = await this.collectorRepo.findByUserId(userId);
      if (profile && !query.radiusKm) {
        radiusKm = profile.serviceRadiusKm;
      }
    }

    return this.pickupRepo.findNearbyAvailable(
      query.lat,
      query.lng,
      radiusKm,
      query.limit ?? 50
    );
  }

  async claimPickup(pickupId: string, userId: string, role: Role) {
    if (role !== Role.COLLECTOR && role !== Role.ADMIN) {
      throw new ForbiddenError('Only collectors and administrators can claim pickup jobs');
    }

    const pickup = await this.pickupRepo.findById(pickupId);
    if (!pickup) throw new NotFoundError(`Pickup with ID '${pickupId}' not found`);

    if (pickup.status !== PickupStatus.REQUESTED) {
      throw new ConflictError(
        `Pickup cannot be claimed because its current status is '${pickup.status}'`
      );
    }

    let collector = await this.collectorRepo.findByUserId(userId);
    if (!collector) {
      collector = await this.collectorRepo.createProfile(userId);
    }

    const claimedCount = await this.pickupRepo.claimPickupAtomic(pickupId, collector.id);
    if (claimedCount === 0) {
      throw new ConflictError('Pickup has already been claimed by another collector');
    }

    return this.pickupRepo.findById(pickupId);
  }

  async markArrived(pickupId: string, userId: string, role: Role) {
    const pickup = await this.pickupRepo.findById(pickupId);
    if (!pickup) throw new NotFoundError(`Pickup with ID '${pickupId}' not found`);

    if (role === Role.COLLECTOR) {
      const collector = await this.collectorRepo.findByUserId(userId);
      if (!collector || pickup.collectorId !== collector.id) {
        throw new ForbiddenError('You are not assigned to this pickup');
      }
    }

    if (pickup.status === PickupStatus.COLLECTOR_ARRIVED) return pickup;
    if (pickup.status !== PickupStatus.ASSIGNED) {
      throw new ConflictError(`Cannot mark arrived on pickup with status '${pickup.status}'`);
    }

    return this.pickupRepo.updateStatus(pickupId, PickupStatus.COLLECTOR_ARRIVED);
  }

  async recordDoorstepItems(
    pickupId: string,
    userId: string,
    role: Role,
    items: RecordPickupItemInput[]
  ) {
    const pickup = await this.pickupRepo.findById(pickupId);
    if (!pickup) throw new NotFoundError(`Pickup with ID '${pickupId}' not found`);

    if (role === Role.COLLECTOR) {
      const collector = await this.collectorRepo.findByUserId(userId);
      if (!collector || pickup.collectorId !== collector.id) {
        throw new ForbiddenError('You are not assigned to this pickup');
      }
    }

    const allowedStatuses: PickupStatus[] = [
      PickupStatus.ASSIGNED,
      PickupStatus.COLLECTOR_ARRIVED,
      PickupStatus.REQUESTED,
    ];
    if (!allowedStatuses.includes(pickup.status)) {
      throw new ConflictError(`Cannot add weigh-in items to pickup with status '${pickup.status}'`);
    }

    const categories = await this.pricing.getActiveCategoriesWithRates();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const recordedItems = [];
    for (const item of items) {
      const cat = categoryMap.get(item.categoryId);
      if (!cat) throw new NotFoundError(`Category ID '${item.categoryId}' not found`);

      const pricePerKg = item.pricePerKg ?? cat.baseRatePerKg;
      const totalAmount = Number((item.actualWeightKg * pricePerKg).toFixed(2));

      const created = await this.pickupRepo.addPickupItem(pickupId, {
        categoryId: item.categoryId,
        actualWeightKg: item.actualWeightKg,
        pricePerKg,
        totalAmount,
        imageProofUrl: item.imageProofUrl,
      });
      recordedItems.push(created);
    }

    const updatedPickup = await this.pickupRepo.findById(pickupId);
    return { recordedItems, pickup: updatedPickup };
  }

  async completeCollection(pickupId: string, userId: string, role: Role) {
    const pickup = await this.pickupRepo.findById(pickupId);
    if (!pickup) throw new NotFoundError(`Pickup with ID '${pickupId}' not found`);

    if (role === Role.COLLECTOR) {
      const collector = await this.collectorRepo.findByUserId(userId);
      if (!collector || pickup.collectorId !== collector.id) {
        throw new ForbiddenError('You are not assigned to this pickup');
      }
    }

    const allowedStatuses: PickupStatus[] = [
      PickupStatus.ASSIGNED,
      PickupStatus.COLLECTOR_ARRIVED,
    ];
    if (!allowedStatuses.includes(pickup.status)) {
      throw new ConflictError(`Cannot complete pickup with status '${pickup.status}'`);
    }

    const items = pickup.items || [];
    const validItems = items.filter(
      (i) => i.actualWeightKg !== null && Number(i.actualWeightKg) > 0
    );

    if (validItems.length === 0) {
      throw new ValidationError('Doorstep weigh-in requires at least one recorded item with weight');
    }

    const finalAmount = Number(
      validItems.reduce((acc, curr) => acc + Number(curr.totalAmount ?? 0), 0).toFixed(2)
    );
    const totalWeightKg = validItems.reduce(
      (acc, curr) => acc + Number(curr.actualWeightKg ?? 0),
      0
    );

    const completed = await this.pickupRepo.completePickup(pickupId, finalAmount);
    if (pickup.collectorId) {
      await this.collectorRepo.updateStats(pickup.collectorId, totalWeightKg);
    }

    return completed;
  }

  async getPickupById(id: string, userId: string, role: Role) {
    const pickup = await this.pickupRepo.findById(id);
    if (!pickup) throw new NotFoundError(`Pickup with ID '${id}' not found`);
    if (role === Role.CONSUMER && pickup.consumerId !== userId) {
      throw new ForbiddenError('You are not authorized to view this pickup');
    }
    return pickup;
  }

  async getConsumerPickups(consumerId: string) {
    const consumer = await this.userRepo.findById(consumerId);
    if (!consumer) throw new NotFoundError('Consumer user not found');
    return this.pickupRepo.findByConsumerId(consumerId);
  }

  async getAllPickups(role: Role) {
    if (role !== Role.ADMIN && role !== Role.HUB_MANAGER && role !== Role.COLLECTOR) {
      throw new ForbiddenError('Access forbidden for listing all pickups');
    }
    return this.pickupRepo.findAll();
  }
}

export const pickupService = new PickupService();
