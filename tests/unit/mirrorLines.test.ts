import { describe, it, expect } from 'vitest';
import { mirrorLines, type MirrorableLine } from '@/shared/schemas/accounting/journalEntry.schema';
import type { MoneyAmount, FxRate } from '@/shared/schemas/accounting/money.schema';

const m = (v: string) => v as MoneyAmount;
const r = (v: string) => v as FxRate;

describe('mirrorLines', () => {
  const twoLineFixture: MirrorableLine[] = [
    {
      account_id: 'acct-1',
      debit_amount: m('100.0000'),
      credit_amount: m('0.0000'),
      currency: 'CAD',
      amount_original: m('100.0000'),
      amount_cad: m('100.0000'),
      fx_rate: r('1.00000000'),
      tax_code_id: null,
    },
    {
      account_id: 'acct-2',
      debit_amount: m('0.0000'),
      credit_amount: m('100.0000'),
      currency: 'CAD',
      amount_original: m('100.0000'),
      amount_cad: m('100.0000'),
      fx_rate: r('1.00000000'),
      tax_code_id: 'tax-1',
    },
  ];

  it('swaps debit_amount and credit_amount for each line', () => {
    const mirrored = mirrorLines(twoLineFixture);
    // Line 1: was debit 100, should become credit 100
    expect(mirrored[0].debit_amount).toBe('0.0000');
    expect(mirrored[0].credit_amount).toBe('100.0000');
    // Line 2: was credit 100, should become debit 100
    expect(mirrored[1].debit_amount).toBe('100.0000');
    expect(mirrored[1].credit_amount).toBe('0.0000');
  });

  it('preserves account_id, currency, amount_original, amount_cad, fx_rate, tax_code_id', () => {
    const mirrored = mirrorLines(twoLineFixture);
    expect(mirrored[0].account_id).toBe('acct-1');
    expect(mirrored[0].currency).toBe('CAD');
    expect(mirrored[0].amount_original).toBe('100.0000');
    expect(mirrored[0].amount_cad).toBe('100.0000');
    expect(mirrored[0].fx_rate).toBe('1.00000000');
    expect(mirrored[0].tax_code_id).toBeNull();
    // Line 2 preserves tax_code_id
    expect(mirrored[1].tax_code_id).toBe('tax-1');
  });

  it('does not mutate the original array', () => {
    const original = [...twoLineFixture];
    mirrorLines(twoLineFixture);
    expect(twoLineFixture[0].debit_amount).toBe('100.0000'); // unchanged
    expect(twoLineFixture).toEqual(original);
  });

  it('returns the same number of lines', () => {
    expect(mirrorLines(twoLineFixture)).toHaveLength(2);
  });

  it('handles lines with non-1.0 FX rate', () => {
    const fxLine: MirrorableLine[] = [
      {
        account_id: 'acct-fx',
        debit_amount: m('135.4200'),
        credit_amount: m('0.0000'),
        currency: 'USD',
        amount_original: m('135.4200'),
        amount_cad: m('183.5000'),
        fx_rate: r('1.35420000'),
        tax_code_id: null,
      },
    ];
    const mirrored = mirrorLines(fxLine);
    expect(mirrored[0].debit_amount).toBe('0.0000');
    expect(mirrored[0].credit_amount).toBe('135.4200');
    // FX fields preserved
    expect(mirrored[0].fx_rate).toBe('1.35420000');
    expect(mirrored[0].amount_cad).toBe('183.5000');
    expect(mirrored[0].currency).toBe('USD');
  });

  it('handles empty array', () => {
    expect(mirrorLines([])).toEqual([]);
  });
});
