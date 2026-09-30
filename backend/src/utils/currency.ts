import { Prisma } from '@prisma/client';
import { ValidationError } from '../errors/app-error';

/**
 * Currency utility to prevent floating-point calculation errors in financial flows.
 * Strictly adheres to integer paise operations.
 */
export class CurrencyUtil {
  /**
   * Converts Rupees (number, string, or Prisma.Decimal) to integer paise.
   * Ensures no floating-point drift (e.g. 150.50 -> 15050 paise).
   */
  static toPaise(rupees: number | string | Prisma.Decimal): number {
    if (rupees instanceof Prisma.Decimal) {
      return Math.round(rupees.mul(100).toNumber());
    }

    const val = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
    if (isNaN(val) || !isFinite(val)) {
      throw new ValidationError(`Invalid currency amount: ${String(rupees)}`);
    }

    if (val < 0) {
      throw new ValidationError(`Currency amount cannot be negative: ${val}`);
    }

    // Fixed precision multiplication to avoid floating point math drift
    return Math.round(Math.round(val * 10000) / 100);
  }

  /**
   * Converts integer paise to a Prisma.Decimal representation in Rupees.
   */
  static paiseToDecimal(paise: number): Prisma.Decimal {
    if (!Number.isInteger(paise)) {
      paise = Math.round(paise);
    }
    const rupeesStr = (paise / 100).toFixed(2);
    return new Prisma.Decimal(rupeesStr);
  }

  /**
   * Converts integer paise to a numeric Rupee value rounded to 2 decimal places.
   */
  static paiseToRupees(paise: number): number {
    return Number((paise / 100).toFixed(2));
  }

  /**
   * Converts a Prisma.Decimal or number in Rupees to a clean 2-decimal number.
   */
  static decimalToRupees(decimal: Prisma.Decimal | number): number {
    if (decimal instanceof Prisma.Decimal) {
      return Number(decimal.toFixed(2));
    }
    return Number(decimal.toFixed(2));
  }

  /**
   * Formats paise as Indian Rupee display string (e.g. ₹1,240.50).
   */
  static formatInr(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(rupees);
  }
}
