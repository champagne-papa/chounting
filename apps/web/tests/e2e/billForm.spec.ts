// tests/e2e/billForm.spec.ts
// Phase 5 chunk B5-3-D3 substantive session #1 — ManualBillForm write-side
// E2E smoke spec. First write-side E2E spec in the project; sets precedent
// for form-fill + submit + assert at the Playwright harness grain.
//
// Single test:
//   1. Seed a vendor in ORG_HOLDING via admin client (dev.sql seeds no vendors).
//   2. Navigate to bill form via MainframeRail "New Bill".
//   3. Fill form with BillFixture values (vendor + amount + line).
//   4. Submit → assert navigation to open-bills canvas.
//   5. Cleanup seeded vendor in afterAll.
//
// CONTROLLER_ORG_ID (holding org) is used because the controller seed user
// has is_org_owner + controller role on both dev orgs, satisfying both
// `bill.post` permission grants (controller + ap_specialist per CA-28).
//
// Vendor selection note: dev.sql seeds no vendors. seedTestVendor() creates
// one via Supabase admin client in beforeAll and cleans up in afterAll.
//
// E2E execution is informational (founder-review-workflow grain per catch #37
// lesson) — NOT a chunk-close gate. pnpm typecheck is the validation step.

import { test, expect, type Page } from '@playwright/test';
import { CONTROLLER_ORG_ID } from './fixtures/auth';
import {
  type BillFixture,
  seedTestVendor,
  gotoBillForm,
  fillBillForm,
  submitBillForm,
  assertBillCreated,
} from './fixtures/bill';

// ---------------------------------------------------------------------------
// Test fixture values
// ---------------------------------------------------------------------------

const VENDOR_NAME = 'E2E Test Vendor';

// Expense account option text as rendered by ManualBillForm:
//   "{account_code} — {account_name}" (holding_company COA template).
// "Professional Fees" (5000) is the first expense account in the holding
// company template; confirmed from initial_schema.sql COA template seed.
const BILL_FIXTURE: BillFixture = {
  vendor_name: VENDOR_NAME,
  bill_number: 'E2E-001',
  amount_cad: '500.00',
  line_account_option_text: '5000 — Professional Fees',
  line_description: 'E2E smoke test expense',
  line_amount: '500.00',
};

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe('ManualBillForm write-side smoke', () => {
  let cleanup: (() => Promise<void>) | undefined;

  // Seed a vendor before all tests in this describe block.
  test.beforeAll(async () => {
    const seeded = await seedTestVendor(CONTROLLER_ORG_ID, VENDOR_NAME);
    cleanup = seeded.cleanup;
  });

  // Clean up the seeded vendor (cascades to any bills created during the run).
  test.afterAll(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  test('navigate to bill form → fill → submit → assert open-bills navigation', async ({
    page,
  }: {
    page: Page;
  }) => {
    // (1) Navigate to bill form via MainframeRail "New Bill" title click.
    await gotoBillForm(page, CONTROLLER_ORG_ID);

    // Verify the form heading is visible as a pre-fill sanity check.
    await expect(page.getByRole('heading', { name: /new bill/i })).toBeVisible();

    // (2) Fill the form with fixture values.
    await fillBillForm(page, BILL_FIXTURE);

    // (3) Submit and wait for navigation or error.
    await submitBillForm(page);

    // (4) Assert successful navigation to open-bills canvas view.
    await assertBillCreated(page);
  });
});
