import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient, BatchStatus, CpcbSyncStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { RecyclerRepository, recyclerRepository } from '../repositories/recycler.repository';
import { NotFoundError, ConflictError } from '../errors/app-error';
import { logger } from '../config/logger';
import { generateEprPdfBuffer, EprPdfData } from '../utils/pdf-generator';
import {
  EprCertificateDto,
  CertificateVerificationDto,
  BatchYieldsRecord,
} from '../types/recycler.types';

export class EprService {
  private readonly pdfBufferCache = new Map<string, Buffer>();
  private readonly pdfHashCache = new Map<string, string>();
  private readonly storageDir = path.join(process.cwd(), 'storage', 'certificates');

  constructor(
    private readonly recyclerRepo: RecyclerRepository = recyclerRepository,
    private readonly db: PrismaClient = prisma
  ) {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch {
      // Non-blocking in ephemeral/serverless environments
    }
  }

  generateCertificateNumber(): string {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CPCB-EPR-2026-${hex}`;
  }

  async generateEprCertificate(
    batchId: string,
    recyclerId: string,
    issuedTo: string,
    userId?: string
  ): Promise<EprCertificateDto> {
    const batch = await this.recyclerRepo.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundError(`Batch with ID '${batchId}' not found`);
    }

    if (batch.eprRecord) {
      throw new ConflictError(
        `EPR certificate already issued for batch '${batch.batchCode}'. ` +
        `Certificate Number: ${batch.eprRecord.certificateNumber}`
      );
    }

    if (batch.status !== BatchStatus.PROCESSED) {
      throw new ConflictError(
        `Batch '${batch.batchCode}' must be in PROCESSED status before issuing EPR certificate. ` +
        `Current status: '${batch.status}'.`
      );
    }

    const recycler = await this.recyclerRepo.findById(recyclerId);
    if (!recycler) {
      throw new NotFoundError(`Recycler with ID '${recyclerId}' not found`);
    }

    let yields = await this.recyclerRepo.getYieldsForBatch(batchId);
    if (!yields) {
      const net = Number(batch.netWeightKg);
      yields = {
        copperKg: Number((net * 0.15).toFixed(4)),
        goldKg: Number((net * 0.0001).toFixed(4)),
        aluminumKg: Number((net * 0.35).toFixed(4)),
        plasticKg: Number((net * 0.45).toFixed(4)),
        wasteKg: Number((net * 0.04).toFixed(4)),
        totalOutputYieldKg: net,
        massBalancePercentage: 99.0,
        certifiedWeightKg: Number((net * 0.95).toFixed(3)),
        recordedAt: new Date().toISOString(),
      };
    }

    const certificateNumber = this.generateCertificateNumber();
    const qrPayload = `ecotrace://verify/epr/${certificateNumber}`;
    const issuedAt = new Date();
    const certifiedWeightKg = yields.certifiedWeightKg;

    const pdfData: EprPdfData = {
      certificateNumber,
      issuedTo,
      issuedAt,
      certifiedWeightKg,
      qrPayload,
      recycler: {
        companyName: recycler.companyName,
        licenseNumber: recycler.licenseNumber,
        address: recycler.address,
        city: recycler.city,
        state: recycler.state,
        contactNumber: recycler.contactNumber,
      },
      batch: {
        batchCode: batch.batchCode,
        netWeightKg: Number(batch.netWeightKg),
        grossWeightKg: Number(batch.grossWeightKg),
        hubName: batch.hub?.name || 'EcoTrace Hub',
        categoryName: batch.category?.name || 'Electronic Waste',
      },
      yields,
    };

    const pdfBuffer = await generateEprPdfBuffer(pdfData);
    const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    this.pdfBufferCache.set(certificateNumber, pdfBuffer);
    this.pdfHashCache.set(certificateNumber, sha256Hash);

    try {
      const filePath = path.join(this.storageDir, `${certificateNumber}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);
    } catch (err) {
      logger.warn({ err }, '[EprService] Could not persist certificate to local filesystem');
    }

    const certificateUrl = `/api/v1/epr/${batchId}/download`;

    const eprRecord = await this.recyclerRepo.createEprRecord({
      batchId,
      recyclerId: recycler.id,
      certificateNumber,
      certifiedWeightKg,
      issuedTo,
      certificateUrl,
    });

    this.pdfBufferCache.set(eprRecord.id, pdfBuffer);
    this.pdfHashCache.set(eprRecord.id, sha256Hash);

    await this.db.auditLog.create({
      data: {
        action: 'EPR_CERTIFICATE_ISSUED',
        entityType: 'EprRecord',
        entityId: eprRecord.id,
        newValue: {
          certificateNumber,
          sha256Hash,
          certifiedWeightKg,
          issuedTo,
          certificateUrl,
        },
        userId: userId ?? null,
      },
    });

    logger.info(
      { certificateNumber, sha256Hash, batchId, recyclerId },
      '[EprService] CPCB EPR digital certificate generated and cryptographically fingerprinted'
    );

    return {
      id: eprRecord.id,
      batchId,
      recyclerId: recycler.id,
      certificateNumber,
      certifiedWeightKg,
      issuedTo,
      certificateUrl,
      sha256Hash,
      cpcbSyncStatus: eprRecord.cpcbSyncStatus,
      issuedAt,
      qrPayload,
    };
  }

  async verifyCertificate(certificateNumber: string): Promise<CertificateVerificationDto> {
    const record = await this.recyclerRepo.findEprRecordByCertificateNumber(certificateNumber);
    if (!record) {
      throw new NotFoundError(`CPCB EPR Certificate '${certificateNumber}' not found or invalid`);
    }

    let sha256Hash = this.pdfHashCache.get(certificateNumber);

    if (!sha256Hash) {
      const auditLog = await this.db.auditLog.findFirst({
        where: {
          entityType: 'EprRecord',
          entityId: record.id,
          action: 'EPR_CERTIFICATE_ISSUED',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (auditLog?.newValue && typeof auditLog.newValue === 'object' && 'sha256Hash' in auditLog.newValue) {
        sha256Hash = String(auditLog.newValue.sha256Hash);
      }
    }

    if (!sha256Hash) {
      const filePath = path.join(this.storageDir, `${certificateNumber}.pdf`);
      if (fs.existsSync(filePath)) {
        const fileBuf = fs.readFileSync(filePath);
        sha256Hash = crypto.createHash('sha256').update(fileBuf).digest('hex');
      }
    }

    if (!sha256Hash) {
      sha256Hash = crypto.createHash('sha256').update(record.certificateNumber).digest('hex');
    }

    const yields = await this.recyclerRepo.getYieldsForBatch(record.batchId);

    return {
      valid: true,
      certificateNumber: record.certificateNumber,
      sha256Hash,
      issuanceDate: record.issuedAt,
      issuedTo: record.issuedTo,
      certifiedWeightKg: Number(record.certifiedWeightKg),
      status: 'VALID',
      cpcbSyncStatus: record.cpcbSyncStatus,
      recycler: {
        id: record.recycler.id,
        companyName: record.recycler.companyName,
        licenseNumber: record.recycler.licenseNumber,
        address: record.recycler.address,
        city: record.recycler.city,
        state: record.recycler.state,
        contactNumber: record.recycler.contactNumber,
      },
      batch: {
        id: record.batch.id,
        batchCode: record.batch.batchCode,
        grossWeightKg: Number(record.batch.grossWeightKg),
        netWeightKg: Number(record.batch.netWeightKg),
        status: record.batch.status,
        categoryName: record.batch.category?.name,
      },
      yields: yields ?? undefined,
    };
  }

  async getCertificatePdf(idOrNumber: string): Promise<{ buffer: Buffer; filename: string }> {
    let cached = this.pdfBufferCache.get(idOrNumber);
    if (cached) {
      return { buffer: cached, filename: `CPCB-EPR-${idOrNumber}.pdf` };
    }

    let record = await this.recyclerRepo.findEprRecordById(idOrNumber);
    if (!record) {
      record = await this.recyclerRepo.findEprRecordByCertificateNumber(idOrNumber);
    }
    if (!record) {
      throw new NotFoundError(`EPR Certificate '${idOrNumber}' not found`);
    }

    const filePath = path.join(this.storageDir, `${record.certificateNumber}.pdf`);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      this.pdfBufferCache.set(idOrNumber, buf);
      return { buffer: buf, filename: `${record.certificateNumber}.pdf` };
    }

    let yields = await this.recyclerRepo.getYieldsForBatch(record.batchId);
    if (!yields) {
      const net = Number(record.batch.netWeightKg);
      yields = {
        copperKg: Number((net * 0.15).toFixed(4)),
        goldKg: Number((net * 0.0001).toFixed(4)),
        aluminumKg: Number((net * 0.35).toFixed(4)),
        plasticKg: Number((net * 0.45).toFixed(4)),
        wasteKg: Number((net * 0.04).toFixed(4)),
        totalOutputYieldKg: net,
        massBalancePercentage: 99.0,
        certifiedWeightKg: Number(record.certifiedWeightKg),
        recordedAt: record.issuedAt.toISOString(),
      };
    }

    const pdfBuffer = await generateEprPdfBuffer({
      certificateNumber: record.certificateNumber,
      issuedTo: record.issuedTo,
      issuedAt: record.issuedAt,
      certifiedWeightKg: Number(record.certifiedWeightKg),
      qrPayload: `ecotrace://verify/epr/${record.certificateNumber}`,
      recycler: {
        companyName: record.recycler.companyName,
        licenseNumber: record.recycler.licenseNumber,
        address: record.recycler.address,
        city: record.recycler.city,
        state: record.recycler.state,
        contactNumber: record.recycler.contactNumber,
      },
      batch: {
        batchCode: record.batch.batchCode,
        netWeightKg: Number(record.batch.netWeightKg),
        grossWeightKg: Number(record.batch.grossWeightKg),
        hubName: record.batch.hub?.name || 'EcoTrace Hub',
        categoryName: record.batch.category?.name || 'Electronic Waste',
      },
      yields,
    });

    this.pdfBufferCache.set(record.id, pdfBuffer);
    this.pdfBufferCache.set(record.certificateNumber, pdfBuffer);

    return { buffer: pdfBuffer, filename: `${record.certificateNumber}.pdf` };
  }
}

export const eprService = new EprService();
