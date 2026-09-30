import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server';

describe('Health Check API', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with healthy status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      service: 'EcoTrace India Backend API',
      status: 'HEALTHY',
      version: '1.0.0',
    });
    expect(response.body.timestamp).toBeDefined();
  });

  it('GET / should redirect to /api/v1/health', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/api/v1/health');
  });
});
