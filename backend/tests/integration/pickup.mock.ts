import { Role, PickupStatus } from '@prisma/client';

export interface MockUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: Role;
  isVerified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAddress {
  id: string;
  userId: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface MockCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseRatePerKg: number;
  minRatePerKg: number;
  maxRatePerKg: number;
  isActive: boolean;
}

export interface MockPickupItem {
  id: string;
  pickupId: string;
  categoryId: string;
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  pricePerKg: number;
  totalAmount: number;
  imageProofUrl?: string | null;
  category?: MockCategory;
}

export interface MockPickup {
  id: string;
  consumerId: string;
  collectorId: string | null;
  hubId: string | null;
  addressId: string;
  status: PickupStatus;
  scheduledDate: Date;
  scheduledSlot: string;
  estimatedAmount: number;
  finalAmount: number | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  address?: MockAddress;
  items?: MockPickupItem[];
  consumer?: { id: string; fullName: string; phone: string; email: string | null };
  collector?: {
    id: string;
    userId: string;
    collectorType: string;
    rating: number;
    user: { fullName: string; phone: string };
  } | null;
}

export const mockConsumerUser: MockUser = {
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Aarav Sharma',
  phone: '9876543210',
  email: 'aarav@example.com',
  role: Role.CONSUMER,
  isVerified: true,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const otherConsumerUser: MockUser = {
  id: '22222222-2222-4222-8222-222222222222',
  fullName: 'Priya Patel',
  phone: '9876543211',
  email: 'priya@example.com',
  role: Role.CONSUMER,
  isVerified: true,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCollectorUser: MockUser = {
  id: '77777777-7777-4777-8777-777777777777',
  fullName: 'Ramesh Kumar (Collector)',
  phone: '9876543222',
  email: 'ramesh@ecotrace.in',
  role: Role.COLLECTOR,
  isVerified: true,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCollectorProfile = {
  id: 'col-9999-9999-9999-999999999999',
  userId: mockCollectorUser.id,
  collectorType: 'KABADIWALA',
  serviceRadiusKm: 10.0,
  verificationStatus: 'VERIFIED',
  rating: 5.0,
  totalCollections: 0,
  totalWeightKg: 0,
  user: {
    id: mockCollectorUser.id,
    fullName: mockCollectorUser.fullName,
    phone: mockCollectorUser.phone,
    email: mockCollectorUser.email,
  },
  wallet: { balance: 0, totalEarned: 0, totalWithdrawn: 0 },
};

export const mockCategories: MockCategory[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    code: 'PCB_HIGH_GRADE',
    name: 'Old Phones & PCBs',
    description: 'Circuit boards and phones',
    baseRatePerKg: 450.0,
    minRatePerKg: 400.0,
    maxRatePerKg: 600.0,
    isActive: true,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    code: 'LITHIUM_BATTERY',
    name: 'Lithium Batteries',
    description: 'Laptop and phone battery packs',
    baseRatePerKg: 110.0,
    minRatePerKg: 90.0,
    maxRatePerKg: 140.0,
    isActive: true,
  },
];

export const inMemoryAddresses: MockAddress[] = [];
export const inMemoryPickups: MockPickup[] = [];

export function createPickupMockPrisma() {
  return {
    user: {
      findUnique: async ({ where }: { where: { id?: string } }) => {
        if (where.id === mockConsumerUser.id) return mockConsumerUser;
        if (where.id === otherConsumerUser.id) return otherConsumerUser;
        if (where.id === mockCollectorUser.id) return mockCollectorUser;
        return null;
      },
    },
    collector: {
      findByUserId: async (userId: string) => {
        if (userId === mockCollectorUser.id) return mockCollectorProfile;
        return null;
      },
      findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
        if (where.userId === mockCollectorUser.id || where.id === mockCollectorProfile.id) {
          return mockCollectorProfile;
        }
        return null;
      },
      create: async ({ data }: { data: { userId: string } }) => {
        return {
          ...mockCollectorProfile,
          userId: data.userId,
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: unknown }) => {
        return { ...mockCollectorProfile, ...data };
      },
    },
    address: {
      create: async ({ data }: { data: Omit<MockAddress, 'id' | 'createdAt'> }) => {
        const addr: MockAddress = {
          id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: data.userId,
          addressLine: data.addressLine,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: data.isDefault ?? false,
          createdAt: new Date(),
        };
        inMemoryAddresses.push(addr);
        return addr;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return inMemoryAddresses.find((a) => a.id === where.id) || null;
      },
    },
    wasteCategory: {
      findMany: async ({ where }: { where?: { id?: { in: string[] }; isActive?: boolean } }) => {
        return mockCategories.filter((c) => {
          if (where?.isActive !== undefined && c.isActive !== where.isActive) return false;
          if (where?.id?.in && !where.id.in.includes(c.id)) return false;
          return true;
        });
      },
    },
    pickupItem: {
      create: async ({
        data,
      }: {
        data: {
          pickupId: string;
          categoryId: string;
          actualWeightKg: number;
          pricePerKg: number;
          totalAmount: number;
          imageProofUrl?: string | null;
        };
      }) => {
        const item: MockPickupItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pickupId: data.pickupId,
          categoryId: data.categoryId,
          estimatedWeightKg: 0,
          actualWeightKg: data.actualWeightKg,
          pricePerKg: data.pricePerKg,
          totalAmount: data.totalAmount,
          imageProofUrl: data.imageProofUrl ?? null,
          category: mockCategories.find((c) => c.id === data.categoryId),
        };

        const targetPickup = inMemoryPickups.find((p) => p.id === data.pickupId);
        if (targetPickup) {
          if (!targetPickup.items) targetPickup.items = [];
          targetPickup.items.push(item);
        }

        return item;
      },
    },
    pickup: {
      create: async ({
        data,
      }: {
        data: {
          consumerId: string;
          addressId: string;
          latitude: number;
          longitude: number;
          scheduledDate: Date;
          scheduledSlot: string;
          estimatedAmount: number;
          notes?: string | null;
          status: PickupStatus;
          items: {
            create: Array<{
              categoryId: string;
              estimatedWeightKg: number;
              pricePerKg: number;
              totalAmount: number;
            }>;
          };
        };
      }) => {
        const address = inMemoryAddresses.find((a) => a.id === data.addressId) || {
          id: data.addressId,
          userId: data.consumerId,
          addressLine: 'Default Road',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122001',
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: false,
          createdAt: new Date(),
        };

        const pickupId = `pck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const items: MockPickupItem[] = data.items.create.map((item, idx) => ({
          id: `item-${pickupId}-${idx}`,
          pickupId,
          categoryId: item.categoryId,
          estimatedWeightKg: item.estimatedWeightKg,
          actualWeightKg: null,
          pricePerKg: item.pricePerKg,
          totalAmount: item.totalAmount,
          category: mockCategories.find((c) => c.id === item.categoryId),
        }));

        const pickup: MockPickup = {
          id: pickupId,
          consumerId: data.consumerId,
          collectorId: null,
          hubId: null,
          addressId: data.addressId,
          status: data.status,
          scheduledDate: data.scheduledDate,
          scheduledSlot: data.scheduledSlot,
          estimatedAmount: data.estimatedAmount,
          finalAmount: null,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          address,
          items,
          consumer: {
            id: mockConsumerUser.id,
            fullName: mockConsumerUser.fullName,
            phone: mockConsumerUser.phone,
            email: mockConsumerUser.email,
          },
        };

        inMemoryPickups.push(pickup);
        return pickup;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return inMemoryPickups.find((p) => p.id === where.id) || null;
      },
      findMany: async ({
        where,
      }: {
        where?: {
          consumerId?: string;
          status?: PickupStatus;
          latitude?: { gte?: number; lte?: number };
          longitude?: { gte?: number; lte?: number };
          id?: { in: string[] };
        };
      }) => {
        let results = [...inMemoryPickups];
        if (where?.id?.in) {
          results = results.filter((p) => where.id!.in.includes(p.id));
        }
        if (where?.consumerId) {
          results = results.filter((p) => p.consumerId === where.consumerId);
        }
        if (where?.status) {
          results = results.filter((p) => p.status === where.status);
        }
        if (where?.latitude?.gte !== undefined && where?.latitude?.lte !== undefined) {
          results = results.filter(
            (p) => p.latitude >= where.latitude!.gte! && p.latitude <= where.latitude!.lte!
          );
        }
        if (where?.longitude?.gte !== undefined && where?.longitude?.lte !== undefined) {
          results = results.filter(
            (p) => p.longitude >= where.longitude!.gte! && p.longitude <= where.longitude!.lte!
          );
        }
        return results;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: PickupStatus };
        data: { status: PickupStatus; collectorId?: string };
      }) => {
        const target = inMemoryPickups.find((p) => p.id === where.id && p.status === where.status);
        if (!target) {
          return { count: 0 };
        }
        target.status = data.status;
        if (data.collectorId) {
          target.collectorId = data.collectorId;
          target.collector = {
            id: data.collectorId,
            userId: mockCollectorUser.id,
            collectorType: 'KABADIWALA',
            rating: 5.0,
            user: { fullName: mockCollectorUser.fullName, phone: mockCollectorUser.phone },
          };
        }
        return { count: 1 };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { status?: PickupStatus; finalAmount?: number; collectorId?: string };
      }) => {
        const target = inMemoryPickups.find((p) => p.id === where.id);
        if (!target) {
          throw new Error(`Pickup ${where.id} not found in mock`);
        }
        if (data.status) target.status = data.status;
        if (data.finalAmount !== undefined) target.finalAmount = data.finalAmount;
        if (data.collectorId) target.collectorId = data.collectorId;
        return target;
      },
    },
  };
}
