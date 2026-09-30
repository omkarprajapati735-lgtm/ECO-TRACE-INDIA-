import { BatchStatus } from '@prisma/client';

export interface CreateBatchInput {
  hubId: string;
  categoryId: string;
  grossWeightKg: number;
  netWeightKg: number;
  recyclerId?: string | null;
  storageBin?: string;
}

export interface SealBatchInput {
  manifestUrl?: string | null;
  storageBin?: string;
}

export interface BatchDetailDto {
  id: string;
  batchCode: string;
  hubId: string;
  recyclerId: string | null;
  categoryId: string;
  grossWeightKg: number;
  netWeightKg: number;
  status: BatchStatus;
  qrCode: string;
  qrCodeDataUrl?: string;
  manifestUrl: string | null;
  shippedAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  hub?: {
    id: string;
    name: string;
    address: string;
  };
  category?: {
    id: string;
    code: string;
    name: string;
  };
  recycler?: {
    id: string;
    companyName: string;
    licenseNumber: string;
  } | null;
}

export interface BatchFilterQuery {
  hubId?: string;
  recyclerId?: string;
  status?: BatchStatus;
  limit?: number;
  offset?: number;
}
