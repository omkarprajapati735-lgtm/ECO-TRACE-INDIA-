import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { EprService, eprService } from '../services/epr.service';
import { RecyclerRepository, recyclerRepository } from '../repositories/recycler.repository';
import {
  generateEprSchema,
  verifyCertificateParamsSchema,
} from '../validators/recycler.validator';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/app-error';
import { ApiResponse } from '../types';
import {
  EprCertificateDto,
  CertificateVerificationDto,
} from '../types/recycler.types';

export class EprController {
  constructor(
    private readonly service: EprService = eprService,
    private readonly repo: RecyclerRepository = recyclerRepository
  ) {}

  private async resolveRecyclerId(req: Request, batchId: string, inputRecyclerId?: string): Promise<string> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role === Role.RECYCLER) {
      const profile = await this.repo.findByUserId(req.user.userId);
      if (!profile) {
        throw new NotFoundError('Recycler profile not found for authenticated user');
      }
      return profile.id;
    }

    // Role is ADMIN
    if (inputRecyclerId) {
      return inputRecyclerId;
    }

    const batch = await this.repo.findBatchById(batchId);
    if (batch?.recyclerId) {
      return batch.recyclerId;
    }

    throw new ValidationError('recyclerId is required for administrative certificate issuance');
  }

  generateCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = generateEprSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { batchId, issuedTo, recyclerId: inputRecyclerId } = parsed.data;
      const recyclerId = await this.resolveRecyclerId(req, batchId, inputRecyclerId);

      const data: EprCertificateDto = await this.service.generateEprCertificate(
        batchId,
        recyclerId,
        issuedTo,
        req.user?.userId
      );

      const response: ApiResponse<EprCertificateDto> = {
        success: true,
        data,
        message: 'CPCB Form-2 EPR Certificate successfully generated and signed',
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  downloadCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrNumber = req.params.id;
      if (!idOrNumber) {
        throw new ValidationError('Certificate identifier is required');
      }

      const { buffer, filename } = await this.service.getCertificatePdf(idOrNumber);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  };

  verifyCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyCertificateParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const data: CertificateVerificationDto = await this.service.verifyCertificate(
        parsed.data.certificateNumber
      );

      const response: ApiResponse<CertificateVerificationDto> = {
        success: true,
        data,
        message: 'CPCB EPR Certificate verified successfully',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
}

export const eprController = new EprController();
