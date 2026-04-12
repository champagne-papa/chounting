import { z } from 'zod';
import Decimal from 'decimal.js';

// --- Branded types (PLAN.md §3a) ---

export type MoneyAmount = string & { __brand: 'MoneyAmount' };
export type FxRate = string & { __brand: 'FxRate' };

// --- Zod schemas ---

export const MoneyAmountSchema = z
  .string()
  .regex(
    /^-?\d{1,16}(\.\d{1,4})?$/,
    'MoneyAmount must match /^-?\\d{1,16}(\\.\\d{1,4})?$/',
  )
  .transform((v) => v as MoneyAmount);

export const FxRateSchema = z
  .string()
  .regex(
    /^-?\d{1,12}(\.\d{1,8})?$/,
    'FxRate must match /^-?\\d{1,12}(\\.\\d{1,8})?$/',
  )
  .transform((v) => v as FxRate);

// --- Arithmetic helpers (decimal.js confined to this file) ---

export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).plus(new Decimal(b)).toFixed(4) as MoneyAmount;
}

export function multiplyMoneyByRate(
  amount: MoneyAmount,
  rate: FxRate,
): MoneyAmount {
  return new Decimal(amount)
    .times(new Decimal(rate))
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    .toFixed(4) as MoneyAmount;
}

export function eqMoney(a: MoneyAmount, b: MoneyAmount): boolean {
  return new Decimal(a).eq(new Decimal(b));
}

export function eqRate(a: FxRate, b: FxRate): boolean {
  return new Decimal(a).eq(new Decimal(b));
}

export function zeroMoney(): MoneyAmount {
  return '0.0000' as MoneyAmount;
}

export function oneRate(): FxRate {
  return '1.00000000' as FxRate;
}
