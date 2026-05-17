// tests/e2e/billReverseCard.spec.ts
// Phase 5 chunk B5-3-D6 — BillReverseCard write-side E2E smoke.
//
// Scope: verify the canvas wire-up — row-click from Active Payments
// navigates to BillReverseCard, the 3-field form renders, the Cancel
// button returns the user to Active Payments. The reverse-success
// path requires a real posted journal entry which is not feasible to
// seed from the Playwright runner without importing server modules
// (which trip on assertEnv at module load) — that case is covered
// instead by tests/integration/billReverseRoute.test.ts which exercises
// all four lifecycle states with real posted JEs via billService.
//
// E2E is informational (founder-review-workflow grain) — NOT a
// chunk-close gate. pnpm typecheck + pnpm test are the gate.

import { test, expect, type Page } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID } from './fixtures/auth';
import {
  seedTestVendor,
  seedPartiallyPaidBill,
  gotoActivePayments,
  clickReverseFromActivePayments,
  fillBillReverseForm,
  cancelBillReverse,
} from './fixtures/bill';

const VENDOR_NAME = 'E2E Reverse Vendor';

test.describe('BillReverseCard write-side smoke', () => {
  let vendorCleanup: (() => Promise<void>) | undefined;
  let vendorId: string;

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

  test('Active Payments → row Reverse → card renders → cancel returns to view', async ({
    page,
  }: {
    page: Page;
  }) => {
    const { billNumber } = await seedPartiallyPaidBill(
      CONTROLLER_ORG_ID,
      vendorId,
      { amount_cad: '300.00' },
    );

    await gotoActivePayments(page, CONTROLLER_ORG_ID);

    await expect(
      page.locator('td', { hasText: new RegExp(`^${billNumber}$`) }),
    ).toBeVisible({ timeout: 10_000 });

    await clickReverseFromActivePayments(page, billNumber);

    // Form renders with the three required fields.
    await expect(
      page.locator('label', { hasText: /^reversal reason/i }),
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: /^fiscal period/i }),
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: /^entry date/i }),
    ).toBeVisible();

    // Filling the reason exercises the textarea, then cancel returns.
    await fillBillReverseForm(page, {
      reversal_reason: 'E2E smoke: about to cancel',
    });

    await cancelBillReverse(page);
  });
});
