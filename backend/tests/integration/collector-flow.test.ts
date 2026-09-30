import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, PickupStatus } from '@prisma/client';
import {
  mockConsumerUser,
  mockCollectorUser,
  mockCategories,
  inMemoryAddresses,
  inMemoryPickups,
  createPickupMockPrisma,
} from './pickup.mock';

vi.mock('../../src/config/prisma', () => {
  return {
    prisma: createPickupMockPrisma(),
  };
});

import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';

describe('Integration Tests: Collector Field Operations (TICK-007, TICK-008, TICK-009)', () => {
  const app = createApp();

  const collectorToken = tokenService.generateAccessToken({
    userId: mockCollectorUser.id,
    role: Role.COLLECTOR,
  });

  const consumerToken = tokenService.generateAccessToken({
    userId: mockConsumerUser.id,
    role: Role.CONSUMER,
  });

  beforeEach(() => {
    inMemoryAddresses.length = 0;
    inMemoryPickups.length = 0;
  });

  // Seed helper
  async function createTestPickup(lat = 28.4595, lng = 77.0722, status: PickupStatus = PickupStatus.REQUESTED) {
    const pickupId = `pck-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const pickup = {
      id: pickupId,
      consumerId: mockConsumerUser.id,
      collectorId: status === PickupStatus.ASSIGNED ? 'col-9999-9999-9999-999999999999' : null,
      hubId: null,
      addressId: 'addr-test-1',
      status,
      scheduledDate: new Date('2026-10-20'),
      scheduledSlot: '10:00 AM - 01:00 PM',
      estimatedAmount: 900.0,
      finalAmount: null,
      latitude: lat,
      longitude: lng,
      notes: 'Handle with care',
      createdAt: new Date(),
      updatedAt: new Date(),
      address: {
        id: 'addr-test-1',
        userId: mockConsumerUser.id,
        addressLine: 'Sector 45, DLF Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        latitude: lat,
        longitude: lng,
        isDefault: true,
        createdAt: new Date(),
      },
      items: [
        {
          id: `item-${pickupId}-0`,
          pickupId,
          categoryId: mockCategories[0].id,
          estimatedWeightKg: 2.0,
          actualWeightKg: null,
          pricePerKg: 450.0,
          totalAmount: 900.0,
          category: mockCategories[0],
        },
      ],
      consumer: {
        id: mockConsumerUser.id,
        fullName: mockConsumerUser.fullName,
        phone: mockConsumerUser.phone,
        email: mockConsumerUser.email,
      },
      collector: null,
    };
    inMemoryPickups.push(pickup);
    return pickup;
  }

  /* -------------------------------------------------------------
   * TICK-007: Proximity Job Discovery API
   * ------------------------------------------------------------- */
  describe('TICK-007: GET /api/v1/pickups/nearby', () => {
    it('should return 401 Unauthorized when auth token is omitted', async () => {
      const res = await request(app)
        .get('/api/v1/pickups/nearby')
        .query({ lat: 28.4595, lng: 77.0722 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden when a CONSUMER attempts to access nearby jobs', async () => {
      const res = await request(app)
        .get('/api/v1/pickups/nearby')
        .set('Authorization', `Bearer ${consumerToken}`)
        .query({ lat: 28.4595, lng: 77.0722 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 422 when latitude or longitude are missing or out of bounds', async () => {
      const res = await request(app)
        .get('/api/v1/pickups/nearby')
        .set('Authorization', `Bearer ${collectorToken}`)
        .query({ lat: 100, lng: 77.0722 }); // Latitude > 90

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 200 with nearby open pickups sorted by distance in km', async () => {
      // Collector location: Gurugram Sector 45 (28.4595, 77.0722)
      // Close job: DLF Phase 1 (~3.2 km)
      await createTestPickup(28.4795, 77.0985);
      // Very close job: (~0.5 km)
      await createTestPickup(28.4615, 77.074);
      // Far job: Connaught Place (~27 km - should be filtered out by default 10km radius)
      await createTestPickup(28.6304, 77.2177);

      const res = await request(app)
        .get('/api/v1/pickups/nearby')
        .set('Authorization', `Bearer ${collectorToken}`)
        .query({ lat: 28.4595, lng: 77.0722, radiusKm: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2); // The 27km job should be excluded

      // Verify distanceKm is calculated and sorted ascending
      expect(res.body.data[0].distanceKm).toBeLessThan(res.body.data[1].distanceKm);
      expect(res.body.data[0].status).toBe('REQUESTED');
    });
  });

  /* -------------------------------------------------------------
   * TICK-008: Atomic Pickup Claiming & Doorstep Weigh-in
   * ------------------------------------------------------------- */
  describe('TICK-008: Atomic Claiming & Doorstep Weigh-in', () => {
    it('PATCH /api/v1/pickups/:id/claim -> 200 and assigns pickup to collector', async () => {
      const pickup = await createTestPickup();

      const res = await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ASSIGNED');
      expect(res.body.data.collectorId).toBeDefined();
    });

    it('PATCH /api/v1/pickups/:id/claim -> 409 Conflict when pickup is ALREADY claimed (double claim guard)', async () => {
      const pickup = await createTestPickup(28.4595, 77.0722, PickupStatus.ASSIGNED);

      const res = await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('ASSIGNED');
    });

    it('PATCH /api/v1/pickups/:id/arrived -> 200 confirms doorstep arrival', async () => {
      const pickup = await createTestPickup();
      // Claim first
      await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      const res = await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/arrived`)
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COLLECTOR_ARRIVED');
    });

    it('POST /api/v1/pickups/:id/items -> 422 if actual weight precision exceeds 3 decimals', async () => {
      const pickup = await createTestPickup();
      await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      const res = await request(app)
        .post(`/api/v1/pickups/${pickup.id}/items`)
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          categoryId: mockCategories[0].id,
          actualWeightKg: 3.12345, // Invalid: 5 decimal places!
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/pickups/:id/items -> 201 records actual scale weight and locks pricePerKg', async () => {
      const pickup = await createTestPickup();
      await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      const res = await request(app)
        .post(`/api/v1/pickups/${pickup.id}/items`)
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          categoryId: mockCategories[0].id,
          actualWeightKg: 2.350,
          imageProofUrl: 'https://images.example.com/scale-proof.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recordedItems).toBeDefined();
      expect(res.body.data.recordedItems[0].actualWeightKg).toBe(2.350);
      expect(res.body.data.recordedItems[0].pricePerKg).toBe(450.0);
      // 2.350 * 450 = 1057.50
      expect(res.body.data.recordedItems[0].totalAmount).toBe(1057.50);
    });

    it('POST /api/v1/pickups/:id/complete -> 200 transitions to COLLECTED with calculated finalAmount', async () => {
      const pickup = await createTestPickup();
      await request(app)
        .patch(`/api/v1/pickups/${pickup.id}/claim`)
        .set('Authorization', `Bearer ${collectorToken}`);

      // Add item 1
      await request(app)
        .post(`/api/v1/pickups/${pickup.id}/items`)
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          categoryId: mockCategories[0].id,
          actualWeightKg: 2.000,
        });

      // Add item 2
      await request(app)
        .post(`/api/v1/pickups/${pickup.id}/items`)
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          categoryId: mockCategories[1].id,
          actualWeightKg: 3.000,
        });

      const completeRes = await request(app)
        .post(`/api/v1/pickups/${pickup.id}/complete`)
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.status).toBe('COLLECTED');
      // Item 1: 2.0 * 450 = 900; Item 2: 3.0 * 110 = 330; Total = 1230.00
      expect(completeRes.body.data.finalAmount).toBe(1230.0);
    });
  });

  /* -------------------------------------------------------------
   * TICK-009: Advisory Gemini Vision Waste Classifier
   * ------------------------------------------------------------- */
  describe('TICK-009: POST /api/v1/ai/classify-waste', () => {
    it('should return 401 when auth token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ai/classify-waste')
        .send({ image: 'data:image/jpeg;base64,dGVzdA==' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when CONSUMER attempts to call AI classifier', async () => {
      const res = await request(app)
        .post('/api/v1/ai/classify-waste')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ image: 'data:image/jpeg;base64,dGVzdA==' });

      expect(res.status).toBe(403);
    });

    it('should return 200 with deterministic fallback when API key is unconfigured', async () => {
      const res = await request(app)
        .post('/api/v1/ai/classify-waste')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({ image: 'data:image/jpeg;base64,dGVzdA==' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFallback).toBe(true);
      expect(res.body.data.predictedCategory).toBe('OTHER_E_WASTE');
      expect(res.body.data.confidence).toBe(0.5);
    });
  });
});
