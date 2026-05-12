// tests/e2e/recordPaymentCard.spec.ts
// Phase 5 chunk B5-3-D4 substantive session #2 Task 2 — RecordPaymentCard
// write-side E2E smoke spec. Second write-side spec in the project (after
// billForm.spec.ts at B5-3-D3 session #1); covers the recordPayment UX
// flow via row-click navigation from the PaymentApprovalQueueView (which
// gained row-click navigation at Task 1 of this session).
//
// Two tests:
//   (1) Full payment   — amount_cad = bill.amount_cad → fully_paid → queue absence.
//   (2) Partial payment — amount_cad = half of bill → partially_paid → queue absence.
//
// Setup approach: seed bill rows directly via admin client in
// `lifecycle_state = 'approved_for_payment'` (bypasses post_bill +
// approve_for_payment UI flows entirely). The spec exercises only the
// recordPayment UX; INV-AP-001 (allocation sum) + INV-AP-002 (state
// transition) are enforced by billService.recordPayment at the call site
// and don't require an upstream posted JE for the recordPayment grain to
// surface correctly.
//
// CONTROLLER_ORG_ID (holding org) is used because the controller seed user
// has is_org_owner + controller role + bill.record_payment permission grant
// per the migration at B5-3-D4 session #1.
//
// Cleanup: vendor cleanup cascades to bills via ON DELETE CASCADE; per-bill
// cleanup helpers from seedApprovedBill are not invoked separately because
// vendor cascade handles it.
//
// E2E execution is informational (founder-review-workflow grain per catch #37
// lesson) — NOT a chunk-close gate. pnpm typecheck is the validation step.

import { test, expect, type Page } from '@playwright/test';
import { CONTROLLER_ORG_ID } from './fixtures/auth';
import {
  seedTestVendor,
  seedApprovedBill,
  gotoPaymentApprovalQueue,
  selectBillFromQueue,
  fillRecordPaymentForm,
  submitRecordPaymentForm,
  assertPaymentRecorded,
} from './fixtures/bill';

const VENDOR_NAME = 'E2E RecordPayment Vendor';

test.describe('RecordPaymentCard write-side smoke', () => {
  let vendorCleanup: (() => Promise<void>) | undefined;
  let vendorId: string;

  // Seed a single vendor before all tests; cleanup cascades to bills.
  test.beforeAll(async () => {
    const seeded = await seedTestVendor(CONTROLLER_ORG_ID, VENDOR_NAME);
    vendorId = seeded.vendorId;
    vendorCleanup = seeded.cleanup;
  });

  test.afterAll(async () => {
    if (vendorCleanup) {
      await vendorCleanup();
    }
  });

  test('full payment: queue row-click → fill amount = bill.amount → submit → fully_paid (queue absent)', async ({
    page,
  }: {
    page: Page;
  }) => {
    // (1) Seed a bill in approved_for_payment state (admin client; bypasses
    //     post + approve UI flows).
    const { billNumber, amountCad } = await seedApprovedBill(
      CONTROLLER_ORG_ID,
      vendorId,
      { amount_cad: '500.00' },
    );

    // (2) Navigate to the payment approval queue via MainframeRail.
    await gotoPaymentApprovalQueue(page, CONTROLLER_ORG_ID);

    // (3) Confirm the seeded bill is visible in the queue.
    await expect(
      page.locator('td', { hasText: new RegExp(`^${billNumber}$`) }),
    ).toBeVisible({ timeout: 10_000 });

    // (4) Click the bill row → RecordPaymentCard navigation.
    await selectBillFromQueue(page, billNumber);

    // (5) Fill the form: amount_cad defaults to bill.amount_due (full payment).
    //     No overrides needed — defaults produce a fully_paid transition.
    await fillRecordPaymentForm(page, { amount_cad: amountCad });

    // (6) Submit + wait for navigation back to queue.
    await submitRecordPaymentForm(page);

    // (7) Assert: queue is visible + bill row no longer present (fully_paid
    //     transition removes bill from approved_for_payment-filtered queue).
    await assertPaymentRecorded(page, {
      expectedLifecycleState: 'fully_paid',
      billNumber,
    });
  });

  test('partial payment: queue row-click → fill amount = half → submit → partially_paid (queue absent)', async ({
    page,
  }: {
    page: Page;
  }) => {
    // (1) Seed a bill in approved_for_payment state.
    const { billNumber } = await seedApprovedBill(
      CONTROLLER_ORG_ID,
      vendorId,
      { amount_cad: '500.00' },
    );

    // (2) Navigate to queue.
    await gotoPaymentApprovalQueue(page, CONTROLLER_ORG_ID);

    // (3) Confirm seeded bill is visible.
    await expect(
      page.locator('td', { hasText: new RegExp(`^${billNumber}$`) }),
    ).toBeVisible({ timeout: 10_000 });

    // (4) Row-click → RecordPaymentCard.
    await selectBillFromQueue(page, billNumber);

    // (5) Fill amount_cad = half of bill (partial payment).
    await fillRecordPaymentForm(page, { amount_cad: '250.00' });

    // (6) Submit + wait for queue navigation.
    await submitRecordPaymentForm(page);

    // (7) Assert: queue visible + bill row absent (partially_paid state is
    //     also outside the queue filter set; assertPaymentRecorded handles
    //     the queue-absence assertion for both transition states).
    await assertPaymentRecorded(page, {
      expectedLifecycleState: 'partially_paid',
      billNumber,
    });
  });
});
