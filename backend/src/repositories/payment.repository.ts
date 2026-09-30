import { PrismaClient, Payment, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CurrencyUtil } from '../utils/currency';

export interface CreatePaymentDto {
  pickupId: string;
  payerId: string;
  payeeId: string;
  amount: Prisma.Decimal | number;
  paymentMethod?: PaymentMethod;
  transactionId?: string | null;
  idempotencyKey: string;
  status?: PaymentStatus;
  completedAt?: Date | null;
}

export class PaymentRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    return this.db.payment.findUnique({
      where: { idempotencyKey },
      include: {
        payer: {
          select: { id: true, fullName: true, phone: true },
        },
        payee: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.db.payment.findUnique({
      where: { id },
      include: {
        payer: {
          select: { id: true, fullName: true, phone: true },
        },
        payee: {
          select: { id: true, fullName: true, phone: true },
        },
        pickup: true,
      },
    });
  }

  async findByPickupId(pickupId: string): Promise<Payment[]> {
    return this.db.payment.findMany({
      where: { pickupId },
      orderBy: { createdAt: 'desc' },
      include: {
        payer: { select: { id: true, fullName: true, phone: true } },
        payee: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const amountDecimal =
      data.amount instanceof Prisma.Decimal
        ? data.amount
        : CurrencyUtil.paiseToDecimal(CurrencyUtil.toPaise(data.amount));

    return this.db.payment.create({
      data: {
        pickupId: data.pickupId,
        payerId: data.payerId,
        payeeId: data.payeeId,
        amount: amountDecimal,
        paymentMethod: data.paymentMethod ?? PaymentMethod.UPI,
        transactionId: data.transactionId ?? null,
        idempotencyKey: data.idempotencyKey,
        status: data.status ?? PaymentStatus.PENDING,
        completedAt: data.completedAt ?? null,
      },
      include: {
        payer: { select: { id: true, fullName: true, phone: true } },
        payee: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string,
    completedAt?: Date
  ): Promise<Payment> {
    return this.db.payment.update({
      where: { id },
      data: {
        status,
        ...(transactionId !== undefined && { transactionId }),
        ...(completedAt !== undefined && { completedAt }),
      },
      include: {
        payer: { select: { id: true, fullName: true, phone: true } },
        payee: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
