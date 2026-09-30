import { Router } from 'express';
import { Role } from '@prisma/client';
import { eprController } from '../controllers/epr.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const eprRouter = Router();

// Generate tamper-evident CPCB Form-2 EPR Certificate (PDF + SHA-256)
eprRouter.post(
  '/',
  authenticate,
  authorize(Role.RECYCLER, Role.ADMIN),
  eprController.generateCertificate
);

// Download signed EPR certificate PDF (public/authenticated with id or cert number)
eprRouter.get('/:id/download', eprController.downloadCertificate);

// Public verification endpoint: check SHA-256 hash and compliance audit integrity
eprRouter.get('/verify/:certificateNumber', eprController.verifyCertificate);
