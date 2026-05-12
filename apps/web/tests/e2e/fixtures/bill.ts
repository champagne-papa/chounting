// tests/e2e/fixtures/bill.ts
// Phase 5 chunk B5-3-D3 substantive session #1 — first write-side E2E fixture.
// Sibling-pattern to journalEntry.ts (navigation-only) but ships the first
// form-fill + submit + assert helpers; sets precedent for subsequent write-side E2E.
//
// Four exported helpers:
//   gotoBillForm(page, orgId)  — navigate to org root + click "New Bill" rail entry
//   fillBillForm(page, fixture) — fill all required form fields via label/option queries
//   submitBillForm(page)        — click "Post Bill" + wait for navigation or error
//   assertBillCreated(page)     — verify navigation to report_open_bills + table visible
//
// Additional export:
//   seedTestVendor(orgId)       — creates a vendor in the local Supabase instance via
//                                  admin client; returns cleanup fn. Required because
//                                  dev.sql seeds no vendors; VendorPicker renders empty
//                                  without at least one row.
//
// Env vars consumed (from .env.local, available to Playwright process):
//   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase admin client.

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { LOCALE } from './auth';

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS for test vendor seeding)
// ---------------------------------------------------------------------------

function makeAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (() => {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be set');
    })();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    (() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set');
    })();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// BillFixture — typed fixture parameter for fillBillForm
// ---------------------------------------------------------------------------

export interface BillFixture {
  /** Vendor name text as it appears in the VendorPicker <option> (exact match). */
  vendor_name: string;
  /** Optional bill number string (may be empty string to leave blank). */
  bill_number: string;
  /** Total bill amount (CAD) as numeric string, e.g. "500.00". */
  amount_cad: string;
  /** Expense account option text as it appears in the Expense Account <select>,
   *  e.g. "5000 — Professional Fees". Match is against option text content. */
  line_account_option_text: string;
  /** Line description string. */
  line_description: string;
  /** Line amount as numeric string, e.g. "500.00". */
  line_amount: string;
}

// ---------------------------------------------------------------------------
// seedTestVendor — creates a vendor row via admin client; returns cleanup fn.
// ---------------------------------------------------------------------------

/**
 * Seed a single vendor in the given org for E2E use.
 * Returns the seeded vendor row + an async cleanup function that deletes it.
 *
 * The cleanup cascades to bills/bill_lines via ON DELETE CASCADE; however,
 * bills created by E2E tests accumulate (journal_entries is append-only).
 * Call cleanup() in afterAll/afterEach at the spec's discretion.
 */
export async function seedTestVendor(
  orgId: string,
  vendorName = 'E2E Test Vendor',
): Promise<{ vendorId: string; cleanup: () => Promise<void> }> {
  const db = makeAdminClient();
  const vendorId = crypto.randomUUID();

  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: vendorName,
  });
  if (error) {
    throw new Error(`seedTestVendor failed: ${error.message}`);
  }

  const cleanup = async () => {
    // bills DELETE at vendor grain cascades to bill_lines (ON DELETE CASCADE).
    await db.from('bills').delete().eq('org_id', orgId).eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
  };

  return { vendorId, cleanup };
}

// ---------------------------------------------------------------------------
// gotoBillForm — navigate to org root + click "New Bill" rail entry
// ---------------------------------------------------------------------------

/**
 * Navigate to the org root and click the "New Bill" MainframeRail entry.
 * Waits for the "New Bill" heading to be visible before returning.
 */
export async function gotoBillForm(page: Page, orgId: string): Promise<void> {
  await page.goto(`/${LOCALE}/${orgId}`);
  // MainframeRail button matched by title attribute (parity with journalEntry.ts pattern).
  await page.getByTitle('New Bill').click();
  // Wait for the form heading to confirm canvas loaded.
  await page.getByRole('heading', { name: /new bill/i }).waitFor();
  // Wait for the loading stencil to clear (form fetches fiscal-periods + COA + tax-codes).
  await expect(
    page.getByRole('button', { name: /post bill/i }),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// fillBillForm — fill all required form fields via structural/text queries
// ---------------------------------------------------------------------------

/**
 * Fill the ManualBillForm with the given fixture values.
 *
 * Selector strategy: ManualBillForm labels lack htmlFor/id associations so
 * getByLabel() cannot match them via ARIA. Instead we use parent-div proximity:
 * locate the <label> by text, step to its containing <div>, then find the
 * <select> or <input> within it. This mirrors the DOM structure in ManualBillForm.tsx.
 *
 * - Vendor: VendorPicker <select> inside the "Vendor" label's parent div.
 * - Bill number, amount_cad: <input> inside respective label parent divs.
 * - Fiscal period + AP control account: already default-selected by the form
 *   on mount; no override needed for the basic smoke test.
 * - Bill line: fills the first default line — account by option text inside
 *   the "Expense Account" label parent div; description and amount similarly.
 *
 * Precondition: gotoBillForm has been called and the form is visible.
 */
export async function fillBillForm(page: Page, fixture: BillFixture): Promise<void> {
  // ---- Vendor (VendorPicker <select>; no htmlFor; locate via label proximity) ----
  // The Vendor label is a direct <label> sibling to the VendorPicker <Controller>
  // output. Use page.getByText to find the label, get its parent div, then select.
  const vendorDiv = page.locator('div').filter({
    has: page.locator('label', { hasText: /^vendor/i }),
  }).first();
  await vendorDiv.locator('select').selectOption({ label: fixture.vendor_name });

  // ---- Bill Number (optional) ----
  if (fixture.bill_number) {
    const billNumberDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /bill number/i }),
    }).first();
    await billNumberDiv.locator('input[type="text"]').fill(fixture.bill_number);
  }

  // ---- Bill Amount (CAD) ----
  const amountDiv = page.locator('div').filter({
    has: page.locator('label', { hasText: /bill amount.*cad/i }),
  }).first();
  await amountDiv.locator('input[type="text"]').fill(fixture.amount_cad);

  // ---- Bill Lines (first default line) ----
  // Lines are rendered inside a relative <div> with class "border border-neutral-200".
  // Locate the first line card, then fill each field within it.
  const firstLineCard = page.locator('div.border.border-neutral-200').first();

  // Expense Account <select> within the first line card.
  const expenseAccountDiv = firstLineCard.locator('div').filter({
    has: firstLineCard.locator('label', { hasText: /expense account/i }),
  }).first();
  await expenseAccountDiv.locator('select').selectOption({ label: fixture.line_account_option_text });

  // Description <input> within the first line card.
  const descriptionDiv = firstLineCard.locator('div').filter({
    has: firstLineCard.locator('label', { hasText: /^description/i }),
  }).first();
  await descriptionDiv.locator('input[type="text"]').fill(fixture.line_description);

  // Amount <input> within the first line card (label text is "Amount *").
  const lineAmountDiv = firstLineCard.locator('div').filter({
    has: firstLineCard.locator('label', { hasText: /^amount/i }),
  }).first();
  await lineAmountDiv.locator('input[type="text"]').fill(fixture.line_amount);
}

// ---------------------------------------------------------------------------
// submitBillForm — click "Post Bill" + wait for navigation or error
// ---------------------------------------------------------------------------

/**
 * Click the "Post Bill" submit button and wait for either:
 *   (a) canvas navigation away from the bill form (success path), OR
 *   (b) an error banner to appear (failure path).
 *
 * Returns immediately after the wait resolves. Callers should use
 * assertBillCreated() to verify the success path.
 */
export async function submitBillForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /post bill/i }).click();
  // Wait for either the open-bills heading (success) or an error message (failure).
  // timeout: 15s to allow server round-trip.
  await expect(
    page
      .getByRole('heading', { name: /open bills/i })
      .or(page.locator('[class*="red"]').filter({ hasText: /error|unable|unexpected/i })),
  ).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// assertBillCreated — verify navigation to report_open_bills + table visible
// ---------------------------------------------------------------------------

/**
 * Assert that the bill form submission succeeded:
 * 1. The canvas navigated to the Open Bills view (heading visible).
 * 2. The Open Bills table or content area is visible (data or empty-state).
 *
 * The spec does NOT assert the exact bill row text because the open-bills
 * table is populated by a server fetch that may race the assertion; verifying
 * the table-or-empty-state shape is the v1 smoke boundary (parity with
 * openBillsView.spec.ts convention).
 */
export async function assertBillCreated(page: Page): Promise<void> {
  // Heading confirms canvas directive navigated to report_open_bills.
  await expect(
    page.getByRole('heading', { name: /open bills/i }),
  ).toBeVisible();

  // Table or empty state confirms the view rendered after navigation.
  await expect(
    page.locator('table').or(page.getByText(/no data\./i)),
  ).toBeVisible({ timeout: 10_000 });
}
