import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export class HealthController {
  getHealth = async (_req: Request, res: Response): Promise<void> => {
    let dbStatus = 'CONNECTED';

    if (process.env.NODE_ENV !== 'test') {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (err) {
        dbStatus = 'DISCONNECTED';
        logger.error({ err }, '[HealthCheck] Database connection check failed');
      }
    }

    const memoryUsage = process.memoryUsage();
    const overallStatus = dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED';

    res.status(200).json({
      success: true,
      service: 'EcoTrace India Backend API',
      status: overallStatus,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        rssMb: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
        heapUsedMb: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
      },
      database: {
        status: dbStatus,
      },
    });
  };
}

export const healthController = new HealthController();
