import { BatchStatus, CpcbSyncStatus, VerificationStatus } from '@prisma/client';

export interface RecyclerProfileDto {
  id: string;
  userId: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  contactNumber: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
}

export interface BatchYields {
  copperKg: number;
  goldKg: number;
  aluminumKg: number;
  plasticKg: number;
  wasteKg: number;
}

export interface BatchYieldsRecord extends BatchYields {
  totalOutputYieldKg: number;
  massBalancePercentage: number;
  certifiedWeightKg: number;
  recordedAt: string;
}

export interface ProcessBatchYieldsInput extends BatchYields {
  notes?: string;
}

export interface ProcessBatchYieldsResult {
  batchId: string;
  batchCode: string;
  recyclerId: string;
  status: BatchStatus;
  netWeightKg: number;
  yields: BatchYieldsRecord;
  processedAt: Date;
}

export interface GenerateEprInput {
  batchId: string;
  issuedTo: string;
  recyclerId?: string;
}

export interface EprCertificateDto {
  id: string;
  batchId: string;
  recyclerId: string;
  certificateNumber: string;
  certifiedWeightKg: number;
  issuedTo: string;
  certificateUrl: string;
  sha256Hash: string;
  cpcbSyncStatus: CpcbSyncStatus;
  issuedAt: Date;
  qrPayload: string;
}

export interface CertificateVerificationDto {
  valid: boolean;
  certificateNumber: string;
  sha256Hash: string;
  issuanceDate: Date;
  issuedTo: string;
  certifiedWeightKg: number;
  status: string;
  cpcbSyncStatus: CpcbSyncStatus;
  recycler: {
    id: string;
    companyName: string;
    licenseNumber: string;
    address: string;
    city: string;
    state: string;
    contactNumber: string;
  };
  batch: {
    id: string;
    batchCode: string;
    grossWeightKg: number;
    netWeightKg: number;
    status: BatchStatus;
    categoryName?: string;
  };
  yields?: BatchYieldsRecord;
}
