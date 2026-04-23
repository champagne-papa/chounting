import { z } from 'zod';
import Decimal from 'decimal.js';

// INV-MONEY-001 (collective — combined enforcement): money at the service boundary is
// string-typed, never JavaScript Number. Enforced collectively by four mechanisms in this file:
// (1) branded types MoneyAmount/FxRate prevent accidental Number assignment at compile time,
// (2) Zod schemas validate the string shape at runtime boundaries, (3) arithmetic helpers
// (addMoney, multiplyMoneyByRate, eqMoney, eqRate) use decimal.js exclusively, and
// (4) decimal.js is imported only in this file — no other file imports it, confining IEEE 754
// precision loss risk to this boundary. See the INV-MONEY-001 leaf in
// docs/02_specs/ledger_truth_model.md for the Postgres numeric(20,4) matching rationale.

// --- Branded types (PLAN.md §3a) ---

export type MoneyAmount = string & { __brand: 'MoneyAmount' };
export type FxRate = string & { __brand: 'FxRate' };

// --- Zod schemas ---

export const MoneyAmountSchema = z
  .string()
  .regex(
    /^-?\d{1,16}(\.\d{1,4})?$/,
    'Must be a valid amount (up to 4 decimal places)',
  )
  .transform((v) => v as MoneyAmount);

export const FxRateSchema = z
  .string()
  .regex(
    /^-?\d{1,12}(\.\d{1,8})?$/,
    'Must be a valid rate (up to 8 decimal places)',
  )
  .transform((v) => v as FxRate);

// --- Arithmetic helpers (decimal.js confined to this file) ---

export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).plus(new Decimal(b)).toFixed(4) as MoneyAmount;
}

export function subtractMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).minus(new Decimal(b)).toFixed(4) as MoneyAmount;
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

/**
 * Coerce a value from an external source (database driver, JSON fetch)
 * into a canonical MoneyAmount string. Handles the Supabase/PostgREST
 * case where NUMERIC columns are serialized as JavaScript numbers.
 *
 * Canonical format: 4-decimal-place string (matches zeroMoney() and
 * addMoney() output).
 */
export function toMoneyAmount(value: string | number): MoneyAmount {
  return new Decimal(value).toFixed(4) as MoneyAmount;
}

/**
 * Coerce a value into a canonical FxRate string. Same rationale as
 * toMoneyAmount but with 8 decimal places per the FxRate convention.
 */
export function toFxRate(value: string | number): FxRate {
  return new Decimal(value).toFixed(8) as FxRate;
}
