import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role } from '@prisma/client';
import {
  mockConsumerUser,
  otherConsumerUser,
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

describe('Integration Tests: Consumer Pickup Booking Endpoints', () => {
  const app = createApp();

  const consumerToken = tokenService.generateAccessToken({
    userId: mockConsumerUser.id,
    role: Role.CONSUMER,
  });

  const otherConsumerToken = tokenService.generateAccessToken({
    userId: otherConsumerUser.id,
    role: Role.CONSUMER,
  });

  beforeEach(() => {
    inMemoryAddresses.length = 0;
    inMemoryPickups.length = 0;
  });

  it('GET /api/v1/categories -> 200 with list of active scrap categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].code).toBe('PCB_HIGH_GRADE');
    expect(res.body.data[0].baseRatePerKg).toBe(450.0);
  });

  it('POST /api/v1/pickups -> 401 Unauthorized when token is missing', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 2 }],
        scheduledDate: '2026-10-15',
        scheduledSlot: '09:00 AM - 12:00 PM',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/pickups -> 422 when weight precision exceeds 3 decimal places', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 2.12345 }],
        address: {
          addressLine: 'Sector 45, DLF Phase 2',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          latitude: 28.4595,
          longitude: 77.0266,
        },
        scheduledDate: '2026-10-15',
        scheduledSlot: '09:00 AM - 12:00 PM',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.items).toBeDefined();
  });

  it('POST /api/v1/pickups -> 422 when scheduled date is in the past', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 2.5 }],
        address: {
          addressLine: 'Sector 45, DLF Phase 2',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          latitude: 28.4595,
          longitude: 77.0266,
        },
        scheduledDate: '2020-01-01',
        scheduledSlot: '09:00 AM - 12:00 PM',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.scheduledDate).toBeDefined();
  });

  it('POST /api/v1/pickups -> 422 when both addressId and address are omitted', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 2.5 }],
        scheduledDate: '2026-10-15',
        scheduledSlot: '09:00 AM - 12:00 PM',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/pickups -> 201 Created with valid payload and computed valuation', async () => {
    const res = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [
          { categoryId: mockCategories[0].id, estimatedWeightKg: 2.0 },
          { categoryId: mockCategories[1].id, estimatedWeightKg: 3.0 },
        ],
        address: {
          addressLine: 'Flat 402, Green Tower, Sector 45',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122003',
          latitude: 28.4595,
          longitude: 77.0266,
        },
        scheduledDate: '2026-10-20',
        scheduledSlot: '09:00 AM - 12:00 PM',
        notes: 'Call before arriving',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('REQUESTED');
    expect(res.body.data.estimatedAmount).toBe(1230.0);
    expect(res.body.data.estimatedRange.min).toBe(1070.0);
    expect(res.body.data.estimatedRange.max).toBe(1620.0);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('GET /api/v1/pickups/:id -> 200 for pickup owner and 403 for unauthorized consumer', async () => {
    const createRes = await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 1.5 }],
        address: {
          addressLine: 'Flat 402, Green Tower, Sector 45',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122003',
          latitude: 28.4595,
          longitude: 77.0266,
        },
        scheduledDate: '2026-10-20',
        scheduledSlot: '12:00 PM - 03:00 PM',
      });

    const pickupId = createRes.body.data.id;

    const ownerRes = await request(app)
      .get(`/api/v1/pickups/${pickupId}`)
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.success).toBe(true);
    expect(ownerRes.body.data.id).toBe(pickupId);

    const otherRes = await request(app)
      .get(`/api/v1/pickups/${pickupId}`)
      .set('Authorization', `Bearer ${otherConsumerToken}`);

    expect(otherRes.status).toBe(403);
    expect(otherRes.body.success).toBe(false);
    expect(otherRes.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/v1/pickups/my-pickups -> 200 with all personal pickups', async () => {
    await request(app)
      .post('/api/v1/pickups')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 1.0 }],
        address: {
          addressLine: 'DLF Cyber City, Tower 10',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          latitude: 28.4986,
          longitude: 77.0878,
        },
        scheduledDate: '2026-10-25',
        scheduledSlot: '03:00 PM - 06:00 PM',
      });

    const res = await request(app)
      .get('/api/v1/pickups/my-pickups')
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('POST /api/v1/pickups/estimate -> 200 with dynamic valuation calculations', async () => {
    const res = await request(app)
      .post('/api/v1/pickups/estimate')
      .send({
        items: [{ categoryId: mockCategories[0].id, estimatedWeightKg: 5.0 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEstimatedAmount).toBe(2250.0);
    expect(res.body.data.totalMinEstimatedAmount).toBe(2000.0);
    expect(res.body.data.totalMaxEstimatedAmount).toBe(3000.0);
  });
});
