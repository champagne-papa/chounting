// Board #4 Fork C handler #2 — the bank-detail / remittance PRESENCE tripwire.
//
// looksLikeBankDetailPresent is a DETECT-AND-ROUTE scan: it returns a boolean
// ("payment-coordinate-shaped content is present in this OCR text") and NOTHING
// else — never the matched coordinates. That keeps the handler Tier-2-safe
// (ADR-0007 §Tier 2 read boundary): it does not read the vendor master's
// control fields, does not extract/persist the coordinates, and does not
// classify fraud. It grounds PRESENCE, not a proven change (there is no vendor
// bank-detail baseline at Tier 2). Permissive-to-flag: false positives cost a
// reviewer a glance, not correctness (route-to-human, never blocks).

import { describe, it, expect } from 'vitest';
import { looksLikeBankDetailPresent } from '@/agent/orchestrator/extraction/bankDetailScan';

describe('looksLikeBankDetailPresent — payment-coordinate presence tripwire', () => {
  it('flags a labeled routing number (9 digits)', () => {
    expect(looksLikeBankDetailPresent('Routing number: 123456789')).toBe(true);
    expect(looksLikeBankDetailPresent('ABA: 021000021')).toBe(true);
  });

  it('flags a labeled bank account number', () => {
    expect(looksLikeBankDetailPresent('Bank account number: 000123456')).toBe(true);
    expect(looksLikeBankDetailPresent('Acct #: 987654321')).toBe(true);
  });

  it('flags an IBAN', () => {
    expect(looksLikeBankDetailPresent('IBAN: GB29NWBK60161331926819')).toBe(true);
  });

  it('flags a SWIFT / BIC code', () => {
    expect(looksLikeBankDetailPresent('SWIFT: DEUTDEFF500')).toBe(true);
  });

  it('flags wire / ACH / remit-to payment instructions', () => {
    expect(looksLikeBankDetailPresent('Please remit to our ACH account')).toBe(true);
    expect(looksLikeBankDetailPresent('Wire transfer instructions below')).toBe(true);
  });

  it('does NOT flag an ordinary vendor invoice with no payment coordinates', () => {
    expect(
      looksLikeBankDetailPresent(
        'Invoice #12345\nVendor: Acme Vendor Co.\nDate: 2026-01-15\nTotal: $123.45',
      ),
    ).toBe(false);
  });
});
