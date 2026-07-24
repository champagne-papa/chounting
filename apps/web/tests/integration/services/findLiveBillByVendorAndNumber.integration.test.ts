// Board #4 Fork C handler #1 (semantic-duplicate) — the detection READ.
//
// findLiveBillByVendorAndNumber finds a LIVE bill with the same
// (org, vendor_id, bill_number) as an incoming invoice — the re-book of an
// already-booked invoice that Stage-0 dedupByHash (byte-identity) misses.
//
// "Live" = lifecycle_state NOT IN ('voided','cancelled'). This is DELIBERATELY
// NOT loadOpenBillsForVendor's {approved_for_payment, partially_paid} filter:
// a fully_paid bill is the WORST double-pay case and must count; a voided or
// cancelled bill is a legitimate re-book target and must not.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../../setup/testDb';
import { findLiveBillByVendorAndNumber } from '@/services/document-platform/extractionReadService';

describe('findLiveBillByVendorAndNumber — semantic-duplicate baseline', () => {
  const org_id = SEED.ORG_HOLDING;
  let vendor_id: string;

  beforeAll(async () => {
    const db = adminClient();
    vendor_id = crypto.randomUUID();
    const { error } = await db.from('vendors').insert({
      vendor_id,
      org_id,
      name: `TEST fork-c dup-lookup vendor ${vendor_id.slice(0, 8)}`,
    });
    if (error) throw new Error(`vendor seed failed: ${error.message}`);
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('bills').delete().eq('vendor_id', vendor_id);
    await db.from('vendors').delete().eq('vendor_id', vendor_id);
  });

  async function seedBill(
    bill_number: string,
    lifecycle_state: string,
  ): Promise<string> {
    const db = adminClient();
    const bill_id = crypto.randomUUID();
    const { error } = await db.from('bills').insert({
      bill_id,
      org_id,
      vendor_id,
      bill_number,
      issue_date: '2026-05-14',
      lifecycle_state,
      amount_cad: 1000,
    });
    if (error) throw new Error(`bill seed failed: ${error.message}`);
    return bill_id;
  }

  it('finds a live approved_for_payment bill with the same (vendor, number)', async () => {
    const bill_id = await seedBill('INV-LIVE-1', 'approved_for_payment');
    const result = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id,
      bill_number: 'INV-LIVE-1',
    });
    expect(result.matched_bill_id).toBe(bill_id);
  });

  it('finds a fully_paid bill (the worst double-pay case; excluded by the open-bill loader)', async () => {
    const bill_id = await seedBill('INV-PAID-1', 'fully_paid');
    const result = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id,
      bill_number: 'INV-PAID-1',
    });
    expect(result.matched_bill_id).toBe(bill_id);
  });

  it('does NOT match a voided bill (legitimate re-book after void)', async () => {
    await seedBill('INV-VOID-1', 'voided');
    const result = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id,
      bill_number: 'INV-VOID-1',
    });
    expect(result.matched_bill_id).toBeNull();
  });

  it('does NOT match a cancelled bill', async () => {
    await seedBill('INV-CANCEL-1', 'cancelled');
    const result = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id,
      bill_number: 'INV-CANCEL-1',
    });
    expect(result.matched_bill_id).toBeNull();
  });

  it('does NOT match a different number, or the same number under a different vendor', async () => {
    await seedBill('INV-OTHER-1', 'approved_for_payment');
    const wrongNumber = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id,
      bill_number: 'INV-DOES-NOT-EXIST',
    });
    expect(wrongNumber.matched_bill_id).toBeNull();
    const wrongVendor = await findLiveBillByVendorAndNumber({
      org_id,
      vendor_id: crypto.randomUUID(),
      bill_number: 'INV-OTHER-1',
    });
    expect(wrongVendor.matched_bill_id).toBeNull();
  });
});
