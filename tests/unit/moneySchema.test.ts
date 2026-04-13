import { describe, it, expect } from 'vitest';
import {
  MoneyAmountSchema,
  FxRateSchema,
  addMoney,
  multiplyMoneyByRate,
  eqMoney,
  zeroMoney,
  oneRate,
  toMoneyAmount,
  toFxRate,
  type MoneyAmount,
  type FxRate,
} from '@/shared/schemas/accounting/money.schema';

describe('MoneyAmountSchema', () => {
  it('accepts valid money strings', () => {
    expect(MoneyAmountSchema.parse('100.0000')).toBe('100.0000');
    expect(MoneyAmountSchema.parse('0.0000')).toBe('0.0000');
    expect(MoneyAmountSchema.parse('-50.1234')).toBe('-50.1234');
  });

  it('accepts whole numbers (decimal portion optional per §3a)', () => {
    expect(MoneyAmountSchema.parse('100')).toBe('100');
  });

  it('rejects invalid formats', () => {
    expect(() => MoneyAmountSchema.parse('abc')).toThrow();
    expect(() => MoneyAmountSchema.parse(100)).toThrow();
    expect(() => MoneyAmountSchema.parse('12345678901234567.0000')).toThrow(); // >16 digits
    expect(() => MoneyAmountSchema.parse('1.00000')).toThrow(); // >4 decimal digits
  });
});

describe('FxRateSchema', () => {
  it('accepts valid FX rate strings', () => {
    expect(FxRateSchema.parse('1.00000000')).toBe('1.00000000');
    expect(FxRateSchema.parse('1.35420000')).toBe('1.35420000');
  });

  it('accepts short decimal portions (1-8 digits per §3a)', () => {
    expect(FxRateSchema.parse('1.0')).toBe('1.0');
    expect(FxRateSchema.parse('1.35')).toBe('1.35');
  });

  it('rejects invalid formats', () => {
    expect(() => FxRateSchema.parse(1.0)).toThrow();
    expect(() => FxRateSchema.parse('abc')).toThrow();
    expect(() => FxRateSchema.parse('1.000000001')).toThrow(); // >8 decimal digits
  });
});

describe('Money arithmetic', () => {
  it('addMoney adds correctly', () => {
    const result = addMoney('100.0000' as MoneyAmount, '50.5000' as MoneyAmount);
    expect(result).toBe('150.5000');
  });

  it('addMoney handles negative values', () => {
    const result = addMoney('100.0000' as MoneyAmount, '-100.0000' as MoneyAmount);
    expect(result).toBe('0.0000');
  });

  it('multiplyMoneyByRate matches Postgres ROUND behavior', () => {
    // 100.0000 * 1.35420000 = 135.4200 (Postgres ROUND(..., 4))
    const result = multiplyMoneyByRate(
      '100.0000' as MoneyAmount,
      '1.35420000' as FxRate,
    );
    expect(result).toBe('135.4200');
  });

  it('multiplyMoneyByRate handles rounding at the .5 boundary', () => {
    // Edge case: trailing digit exactly 5
    // 1.0000 * 1.00005000 = 1.00005 -> ROUND to 4 = 1.0001 (half-up)
    const result = multiplyMoneyByRate(
      '1.0000' as MoneyAmount,
      '1.00005000' as FxRate,
    );
    expect(result).toBe('1.0001');
  });

  it('eqMoney handles trailing zero equivalence', () => {
    expect(eqMoney('100.0000' as MoneyAmount, '100.0000' as MoneyAmount)).toBe(true);
  });

  it('zeroMoney returns correct format', () => {
    expect(zeroMoney()).toBe('0.0000');
  });

  it('oneRate returns correct format', () => {
    expect(oneRate()).toBe('1.00000000');
  });
});

describe('toMoneyAmount (DB boundary coercion)', () => {
  it('coerces number to 4-decimal string', () => {
    expect(toMoneyAmount(100)).toBe('100.0000');
  });

  it('coerces string to canonical 4-decimal format', () => {
    expect(toMoneyAmount('100')).toBe('100.0000');
    expect(toMoneyAmount('100.5')).toBe('100.5000');
  });

  it('is idempotent on already-correct input', () => {
    expect(toMoneyAmount('0.0000')).toBe('0.0000');
    expect(toMoneyAmount('100.1234')).toBe('100.1234');
  });

  it('handles zero correctly (matches zeroMoney)', () => {
    expect(toMoneyAmount(0)).toBe('0.0000');
    expect(toMoneyAmount(0)).toBe(zeroMoney());
  });

  it('rounds to 4 decimal places (half-up)', () => {
    expect(toMoneyAmount('100.12345')).toBe('100.1235');
  });
});

describe('toFxRate (DB boundary coercion)', () => {
  it('coerces number to 8-decimal string', () => {
    expect(toFxRate(1)).toBe('1.00000000');
    expect(toFxRate(1.5)).toBe('1.50000000');
  });

  it('is idempotent on already-correct input', () => {
    expect(toFxRate('1.00000000')).toBe('1.00000000');
  });

  it('matches oneRate for value 1', () => {
    expect(toFxRate(1)).toBe(oneRate());
  });
});
