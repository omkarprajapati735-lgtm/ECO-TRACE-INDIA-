import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Role, User } from '@prisma/client';

// In-memory mock store for users in integration tests
const inMemoryUsers: User[] = [];

vi.mock('../../src/config/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id?: string; phone?: string; email?: string } }) => {
          return (
            inMemoryUsers.find(
              (u) =>
                (where.id && u.id === where.id) ||
                (where.phone && u.phone === where.phone) ||
                (where.email && u.email === where.email)
            ) || null
          );
        }),
        findFirst: vi.fn(
          async ({
            where,
          }: {
            where: { OR: Array<{ phone?: string; email?: string }> };
          }) => {
            return (
              inMemoryUsers.find((u) =>
                where.OR.some(
                  (cond) =>
                    (cond.phone && u.phone === cond.phone) ||
                    (cond.email && u.email === cond.email)
                )
              ) || null
            );
          }
        ),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const user: User = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fullName: data.fullName as string,
            phone: data.phone as string,
            email: (data.email as string) || null,
            passwordHash: (data.passwordHash as string) || null,
            role: (data.role as Role) || Role.CONSUMER,
            preferredLanguage: (data.preferredLanguage as string) || 'en',
            isVerified: (data.isVerified as boolean) ?? false,
            status: (data.status as string) || 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          inMemoryUsers.push(user);
          return user;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const index = inMemoryUsers.findIndex((u) => u.id === where.id);
            if (index === -1) throw new Error('User not found');
            inMemoryUsers[index] = { ...inMemoryUsers[index], ...data } as User;
            return inMemoryUsers[index];
          }
        ),
      },
      collector: {
        create: vi.fn(async ({ data }: { data: { userId: string } }) => ({
          id: `col-${Date.now()}`,
          userId: data.userId,
        })),
      },
      wallet: {
        create: vi.fn(async ({ data }: { data: { collectorId: string } }) => ({
          id: `wal-${Date.now()}`,
          collectorId: data.collectorId,
          balance: 0,
        })),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
        return cb({
          collector: {
            create: async ({ data }: { data: { userId: string } }) => ({
              id: `col-${Date.now()}`,
              userId: data.userId,
            }),
          },
          wallet: {
            create: async ({ data }: { data: { collectorId: string } }) => ({
              id: `wal-${Date.now()}`,
              collectorId: data.collectorId,
            }),
          },
        });
      }),
    },
  };
});

// Import createApp and auth modules AFTER mocking prisma
import { createApp } from '../../src/server';
import { tokenService } from '../../src/services/token.service';
import { otpService } from '../../src/services/otp.service';
import { apiRouter } from '../../src/routes';
import { authenticate, authorize } from '../../src/middlewares/auth.middleware';

describe('Integration Tests: Auth & RBAC Endpoints', () => {
  const app = createApp();

  // Define a dummy protected endpoint to verify TICK-004 RBAC criteria
  apiRouter.get(
    '/test/hub-only',
    authenticate,
    authorize(Role.HUB_MANAGER, Role.ADMIN),
    (_req, res) => {
      res.status(200).json({ success: true, message: 'Welcome Hub Manager' });
    }
  );

  beforeEach(() => {
    inMemoryUsers.length = 0;
    otpService.clearStore();
  });

  it('POST /api/v1/auth/send-otp -> 200 on valid phone and 422 on invalid phone', async () => {
    const validRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9876543210' });
    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.otp).toBeDefined();

    const invalidRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '123' });
    expect(invalidRes.status).toBe(422);
    expect(invalidRes.body.success).toBe(false);
  });

  it('POST /api/v1/auth/verify-otp -> 200 with tokens and Set-Cookie', async () => {
    const sendRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9876543210' });
    const otp = sendRes.body.data.otp;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp, role: 'CONSUMER' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessToken).toBeDefined();
    expect(verifyRes.body.data.user.phone).toBe('9876543210');
    expect(verifyRes.headers['set-cookie']).toBeDefined();
    const cookieHeader = Array.isArray(verifyRes.headers['set-cookie'])
      ? verifyRes.headers['set-cookie'].join(';')
      : verifyRes.headers['set-cookie'];
    expect(cookieHeader).toContain('refreshToken=');
    expect(cookieHeader.toLowerCase()).toContain('httponly');
  });

  it('POST /api/v1/auth/register & /login -> full cycle', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Vikram Singh',
      phone: '9876500001',
      email: 'vikram@ecotrace.in',
      password: 'StrongPassword123',
      role: 'HUB_MANAGER',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.role).toBe('HUB_MANAGER');
    expect(regRes.body.data.accessToken).toBeDefined();

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'vikram@ecotrace.in',
      password: 'StrongPassword123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/me -> 200 when authenticated, 401 when missing token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Ananya Sharma',
      phone: '9876500002',
      password: 'StrongPassword123',
      role: 'CONSUMER',
    });
    const token = regRes.body.data.accessToken;

    const authRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(authRes.status).toBe(200);
    expect(authRes.body.data.fullName).toBe('Ananya Sharma');

    const unauthRes = await request(app).get('/api/v1/auth/me');
    expect(unauthRes.status).toBe(401);
  });

  it('TICK-004 RBAC Acceptance Criteria: CONSUMER gets 403 Forbidden, HUB_MANAGER gets 200', async () => {
    const consumerToken = tokenService.generateAccessToken({
      userId: 'c-1',
      role: Role.CONSUMER,
    });
    const hubToken = tokenService.generateAccessToken({
      userId: 'h-1',
      role: Role.HUB_MANAGER,
    });

    const forbiddenRes = await request(app)
      .get('/api/v1/test/hub-only')
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');

    const allowedRes = await request(app)
      .get('/api/v1/test/hub-only')
      .set('Authorization', `Bearer ${hubToken}`);
    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.message).toBe('Welcome Hub Manager');
  });

  it('POST /api/v1/auth/refresh & /logout -> refresh rotation and cookie clear', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Refresh Tester',
      phone: '9876500003',
      password: 'StrongPassword123',
    });

    const cookies = regRes.headers['set-cookie'];
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies)
      .send();
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const logoutRes = await request(app).post('/api/v1/auth/logout');
    expect(logoutRes.status).toBe(200);
    const logoutCookies = logoutRes.headers['set-cookie'];
    expect(logoutCookies).toBeDefined();
  });
});
