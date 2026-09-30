import { PrismaClient, Pickup, Address, PickupStatus, PickupItem } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreatePickupAddressInput } from '../types';
import { calculateBoundingBox, calculateHaversineDistance } from '../utils/haversine';

export interface CreatePickupRepoInput {
  consumerId: string;
  addressId: string;
  latitude: number;
  longitude: number;
  scheduledDate: Date;
  scheduledSlot: string;
  estimatedAmount: number;
  notes?: string;
  items: Array<{
    categoryId: string;
    estimatedWeightKg: number;
    pricePerKg: number;
    totalAmount: number;
  }>;
}

export interface AddItemRepoInput {
  categoryId: string;
  actualWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  imageProofUrl?: string;
}

export class PickupRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createAddress(userId: string, data: CreatePickupAddressInput): Promise<Address> {
    return this.db.address.create({
      data: {
        userId,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async findAddressById(id: string): Promise<Address | null> {
    return this.db.address.findUnique({ where: { id } });
  }

  async createPickup(data: CreatePickupRepoInput) {
    return this.db.pickup.create({
      data: {
        consumerId: data.consumerId,
        addressId: data.addressId,
        latitude: data.latitude,
        longitude: data.longitude,
        scheduledDate: data.scheduledDate,
        scheduledSlot: data.scheduledSlot,
        estimatedAmount: data.estimatedAmount,
        notes: data.notes ?? null,
        status: PickupStatus.REQUESTED,
        items: {
          create: data.items.map((item) => ({
            categoryId: item.categoryId,
            estimatedWeightKg: item.estimatedWeightKg,
            pricePerKg: item.pricePerKg,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: { include: { category: true } },
        address: true,
        consumer: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    return this.db.pickup.findUnique({
      where: { id },
      include: {
        items: { include: { category: true } },
        consumer: { select: { id: true, fullName: true, phone: true, email: true } },
        collector: {
          select: {
            id: true,
            userId: true,
            collectorType: true,
            rating: true,
            user: { select: { fullName: true, phone: true } },
          },
        },
        address: true,
      },
    });
  }

  async findByConsumerId(consumerId: string) {
    return this.db.pickup.findMany({
      where: { consumerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { category: true } },
        address: true,
        collector: {
          select: {
            id: true,
            userId: true,
            collectorType: true,
            rating: true,
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
    });
  }

  async findNearbyAvailable(
    collectorLat: number,
    collectorLng: number,
    radiusKm: number = 10,
    limit: number = 50
  ) {
    const { minLat, maxLat, minLng, maxLng } = calculateBoundingBox(collectorLat, collectorLng, radiusKm);

    try {
      if (typeof this.db.$queryRaw === 'function') {
        const rawResults = await this.db.$queryRaw<Array<{ id: string; distanceKm: number }>>`
          SELECT 
            p.id,
            (
              6371.0 * acos(
                LEAST(1.0, GREATEST(-1.0,
                  cos(radians(${collectorLat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${collectorLng})) +
                  sin(radians(${collectorLat})) * sin(radians(p.latitude))
                ))
              )
            ) AS "distanceKm"
          FROM "Pickup" p
          WHERE p.status = 'REQUESTED'
            AND p.latitude BETWEEN ${minLat} AND ${maxLat}
            AND p.longitude BETWEEN ${minLng} AND ${maxLng}
            AND (
              6371.0 * acos(
                LEAST(1.0, GREATEST(-1.0,
                  cos(radians(${collectorLat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${collectorLng})) +
                  sin(radians(${collectorLat})) * sin(radians(p.latitude))
                ))
              )
            ) <= ${radiusKm}
          ORDER BY "distanceKm" ASC
          LIMIT ${limit}
        `;

        if (rawResults && Array.isArray(rawResults) && rawResults.length > 0) {
          const ids = rawResults.map((r) => r.id);
          const pickups = await this.db.pickup.findMany({
            where: { id: { in: ids } },
            include: {
              items: { include: { category: true } },
              address: true,
              consumer: { select: { id: true, fullName: true, phone: true, email: true } },
            },
          });
          const distMap = new Map(rawResults.map((r) => [r.id, Number(Number(r.distanceKm).toFixed(2))]));
          return pickups
            .map((p) => ({ ...p, distanceKm: distMap.get(p.id) ?? 0 }))
            .sort((a, b) => a.distanceKm - b.distanceKm);
        }
        return [];
      }
    } catch {
      // Fallback to in-memory Haversine below if raw query is not supported
    }

    const openPickups = await this.db.pickup.findMany({
      where: {
        status: PickupStatus.REQUESTED,
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
      },
      include: {
        items: { include: { category: true } },
        address: true,
        consumer: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      take: limit * 2,
    });

    return openPickups
      .map((p) => ({
        ...p,
        distanceKm: calculateHaversineDistance(collectorLat, collectorLng, p.latitude, p.longitude),
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }

  async claimPickupAtomic(pickupId: string, collectorId: string): Promise<number> {
    const result = await this.db.pickup.updateMany({
      where: { id: pickupId, status: PickupStatus.REQUESTED },
      data: { status: PickupStatus.ASSIGNED, collectorId },
    });
    return result.count;
  }

  async updateStatus(id: string, status: PickupStatus): Promise<Pickup> {
    return this.db.pickup.update({ where: { id }, data: { status } });
  }

  async addPickupItem(pickupId: string, item: AddItemRepoInput): Promise<PickupItem> {
    return this.db.pickupItem.create({
      data: {
        pickupId,
        categoryId: item.categoryId,
        actualWeightKg: item.actualWeightKg,
        pricePerKg: item.pricePerKg,
        totalAmount: item.totalAmount,
        imageProofUrl: item.imageProofUrl ?? null,
      },
      include: { category: true },
    });
  }

  async completePickup(pickupId: string, finalAmount: number) {
    return this.db.pickup.update({
      where: { id: pickupId },
      data: { status: PickupStatus.COLLECTED, finalAmount },
      include: {
        items: { include: { category: true } },
        address: true,
        consumer: { select: { id: true, fullName: true, phone: true, email: true } },
        collector: true,
      },
    });
  }

  async findAll(filters?: { status?: PickupStatus; limit?: number }) {
    return this.db.pickup.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      take: filters?.limit ?? 50,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { category: true } },
        address: true,
        consumer: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }
}

export const pickupRepository = new PickupRepository();
