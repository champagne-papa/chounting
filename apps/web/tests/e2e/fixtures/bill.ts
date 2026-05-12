// tests/e2e/fixtures/bill.ts
// Phase 5 chunk B5-3-D3 substantive session #1 — first write-side E2E fixture.
// Extended at chunk B5-3-D4 session #2 Task 2 with RecordPaymentCard helpers
// (gotoPaymentApprovalQueue, selectBillFromQueue, fillRecordPaymentForm,
// submitRecordPaymentForm, assertPaymentRecorded) + seedApprovedBill admin
// helper for pre-seeding bills directly into `approved_for_payment` lifecycle
// state (bypasses post+approve UI flows; the recordPayment spec tests only
// the recordPayment UX, not the upstream flows).
//
// Original four exported helpers (B5-3-D3):
//   gotoBillForm(page, orgId)   — navigate to org root + click "New Bill" rail entry
//   fillBillForm(page, fixture) — fill all required form fields via label/option queries
//   submitBillForm(page)        — click "Post Bill" + wait for navigation or error
//   assertBillCreated(page)     — verify navigation to report_open_bills + table visible
//
// New helpers (B5-3-D4 session #2):
//   gotoPaymentApprovalQueue(page, orgId) — click "Payment Approval Queue" rail entry
//   selectBillFromQueue(page, billId)     — click the bill row to navigate to RecordPaymentCard
//   fillRecordPaymentForm(page, opts)     — fill the RecordPaymentCard form (8 fields)
//   submitRecordPaymentForm(page)         — click "Record Payment" + wait for navigation back
//   assertPaymentRecorded(page, opts)     — verify return to queue + bill state visibility
//
// Seed exports:
//   seedTestVendor(orgId)               — creates a vendor row via admin client.
//   seedApprovedBill(orgId, vendorId, opts) — creates a bill row in lifecycle_state
//                                            'approved_for_payment' via admin client.
//                                            Skips the post + approve UI flows entirely
//                                            (E2E tests only the recordPayment UX).
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

// ---------------------------------------------------------------------------
// seedApprovedBill — create a bill row directly via admin client in
// `lifecycle_state = 'approved_for_payment'`. Bypasses post + approve UI
// flows since the RecordPaymentCard E2E exercises only the recordPayment UX.
// ---------------------------------------------------------------------------

export interface SeedApprovedBillOpts {
  /** Bill amount (CAD); defaults to '500.00'. */
  amount_cad?: string;
  /** Optional bill_number; defaults to a unique 'E2E-PAY-<short-uuid>' string. */
  bill_number?: string;
  /** Issue date (YYYY-MM-DD); defaults to today. */
  issue_date?: string;
  /** Optional due date (YYYY-MM-DD); defaults to today. */
  due_date?: string;
}

/**
 * Seed a single bill row in `approved_for_payment` state for E2E use.
 *
 * Important: this skips post_bill (no journal_entries row is created and
 * `posted_journal_entry_id` is left null). That's intentional — the spec
 * tests only recordPayment behavior; INV-AP-001 / INV-AP-002 are exercised
 * at the recordPayment grain (allocation sum, state transition), which
 * doesn't require an upstream posted JE to fire correctly.
 *
 * Returns the seeded bill_id + a cleanup function that deletes the bill
 * (which cascades to bill_lines + bill_payment_allocations via FK).
 */
export async function seedApprovedBill(
  orgId: string,
  vendorId: string,
  opts: SeedApprovedBillOpts = {},
): Promise<{ billId: string; billNumber: string; amountCad: string; cleanup: () => Promise<void> }> {
  const db = makeAdminClient();
  const billId = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const amount_cad = opts.amount_cad ?? '500.00';
  const bill_number = opts.bill_number ?? `E2E-PAY-${billId.slice(0, 8)}`;
  const issue_date = opts.issue_date ?? today;
  const due_date = opts.due_date ?? today;

  const { error } = await db.from('bills').insert({
    bill_id: billId,
    org_id: orgId,
    vendor_id: vendorId,
    bill_number,
    issue_date,
    due_date,
    currency: 'CAD',
    amount_original: amount_cad,
    amount_cad,
    fx_rate: '1.0',
    lifecycle_state: 'approved_for_payment',
  });
  if (error) {
    throw new Error(`seedApprovedBill failed: ${error.message}`);
  }

  const cleanup = async () => {
    await db.from('bills').delete().eq('bill_id', billId);
  };

  return { billId, billNumber: bill_number, amountCad: amount_cad, cleanup };
}

// ---------------------------------------------------------------------------
// gotoPaymentApprovalQueue — navigate to the queue canvas view
// ---------------------------------------------------------------------------

/**
 * Navigate to the org root and click the "Payment Approval Queue" MainframeRail
 * entry. Waits for the heading + table-or-empty-state to ensure the queue's
 * client-side fetch has resolved.
 */
export async function gotoPaymentApprovalQueue(page: Page, orgId: string): Promise<void> {
  await page.goto(`/${LOCALE}/${orgId}`);
  await page.getByTitle('Payment Approval Queue').click();
  await expect(
    page.getByRole('heading', { name: /payment approval queue/i }),
  ).toBeVisible();
  // Wait for fetch to resolve — table or empty-state must be visible.
  await expect(
    page.locator('table').or(page.getByText(/no data\./i)),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// selectBillFromQueue — click the bill row to navigate to RecordPaymentCard
// ---------------------------------------------------------------------------

/**
 * Click the queue row for the given billId to trigger the
 * `payment_record_card` canvas directive. Waits for the RecordPaymentCard
 * heading to appear before returning.
 *
 * Row identification: PaymentApprovalQueueView renders the bill_number cell
 * but not the bill_id (vendor_id is shown as a mono uuid). We match on the
 * bill_number cell text which is unique within the E2E run.
 */
export async function selectBillFromQueue(page: Page, billNumber: string): Promise<void> {
  // Locate the <tr> whose first cell text matches billNumber, then click it.
  // The row has cursor-pointer + hover styling per the Task 1 amendment.
  const row = page.locator('tr').filter({
    has: page.locator('td', { hasText: new RegExp(`^${billNumber}$`) }),
  }).first();
  await row.click();

  // Wait for RecordPaymentCard heading to confirm navigation.
  await expect(
    page.getByRole('heading', { name: /record payment/i }),
  ).toBeVisible({ timeout: 10_000 });

  // Wait for the form to mount (Record Payment button visible).
  await expect(
    page.getByRole('button', { name: /^record payment$/i }),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// fillRecordPaymentForm — fill the 8-field record-payment form
// ---------------------------------------------------------------------------

export interface RecordPaymentFormOverrides {
  /** Payment method enum value; defaults to 'eft' (form default). */
  payment_method?: 'check' | 'eft' | 'wire' | 'cash' | 'other';
  /** Payment date (YYYY-MM-DD); defaults left as form default (today). */
  payment_date?: string;
  /** Amount (CAD) as numeric string; required to override the pre-filled bill amount_due. */
  amount_cad?: string;
  /** Reference number; defaults to empty. */
  reference_number?: string;
  /** Entry date (YYYY-MM-DD); defaults left as form default (today). */
  entry_date?: string;
  /**
   * Cash account option text substring (case-insensitive); the form default-
   * selects "Cash and Cash Equivalents". Override only when the test needs
   * a non-default account.
   */
  cash_account_option_text?: string;
  /**
   * AP control account option text substring (case-insensitive); the form
   * default-selects "Accounts Payable". Override only when the test needs
   * a non-default account.
   */
  ap_control_account_option_text?: string;
}

/**
 * Fill the RecordPaymentCard form. Most defaults are pre-populated by the
 * component on mount (payment_method='eft', payment_date=today, entry_date=
 * today, fiscal_period_id=first period, ap_control_account_id=Accounts Payable,
 * cash_account_id=Cash and Cash Equivalents, amount_cad=bill.amount_due).
 *
 * Tests override only what they need (typically amount_cad for the
 * partial-payment case).
 *
 * Precondition: selectBillFromQueue has been called and the form is mounted.
 */
export async function fillRecordPaymentForm(
  page: Page,
  opts: RecordPaymentFormOverrides = {},
): Promise<void> {
  // ---- Payment Method (optional override) ----
  if (opts.payment_method) {
    const pmDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^payment method/i }),
    }).first();
    await pmDiv.locator('select').selectOption(opts.payment_method);
  }

  // ---- Payment Date (optional override) ----
  if (opts.payment_date) {
    const pdDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^payment date/i }),
    }).first();
    await pdDiv.locator('input[type="date"]').fill(opts.payment_date);
  }

  // ---- Amount (CAD) override ----
  // The form pre-fills with bill.amount_due; tests that want a non-full
  // payment must override.
  if (opts.amount_cad !== undefined) {
    const amountDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^amount \(cad\)/i }),
    }).first();
    const amountInput = amountDiv.locator('input[type="text"]').first();
    await amountInput.fill(opts.amount_cad);
  }

  // ---- Reference Number (optional override) ----
  if (opts.reference_number !== undefined) {
    const refDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^reference number/i }),
    }).first();
    await refDiv.locator('input[type="text"]').fill(opts.reference_number);
  }

  // ---- Entry Date (optional override) ----
  if (opts.entry_date) {
    const edDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^entry date/i }),
    }).first();
    await edDiv.locator('input[type="date"]').fill(opts.entry_date);
  }

  // ---- Cash Account (optional override) ----
  if (opts.cash_account_option_text) {
    const cashDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^cash account/i }),
    }).first();
    await cashDiv.locator('select').selectOption({
      label: new RegExp(opts.cash_account_option_text, 'i') as unknown as string,
    });
  }

  // ---- AP Control Account (optional override) ----
  if (opts.ap_control_account_option_text) {
    const apDiv = page.locator('div').filter({
      has: page.locator('label', { hasText: /^ap control account/i }),
    }).first();
    await apDiv.locator('select').selectOption({
      label: new RegExp(opts.ap_control_account_option_text, 'i') as unknown as string,
    });
  }
}

// ---------------------------------------------------------------------------
// submitRecordPaymentForm — click "Record Payment" + wait for navigation back
// ---------------------------------------------------------------------------

/**
 * Click the "Record Payment" submit button. On success the component
 * navigates back to `report_payment_approval_queue` via onNavigate (heading
 * "Payment Approval Queue" visible). On failure an error banner appears
 * inside the card.
 */
export async function submitRecordPaymentForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^record payment$/i }).click();

  // Wait for the queue heading (success) or an inline error banner (failure).
  await expect(
    page
      .getByRole('heading', { name: /payment approval queue/i })
      .or(page.locator('[class*="red"]').filter({ hasText: /error|unable|unexpected/i })),
  ).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// assertPaymentRecorded — verify return to queue + bill visibility transition
// ---------------------------------------------------------------------------

export interface AssertPaymentRecordedOpts {
  /**
   * Expected lifecycle state after the recordPayment call.
   * 'fully_paid' → the bill is removed from the approved_for_payment queue
   *                (queue filter is `approved_for_payment` only); expect the
   *                bill_number row to be absent.
   * 'partially_paid' → the bill remains in the queue (queue filter is
   *                    `approved_for_payment` only, but billService transitions
   *                    state to partially_paid which is NOT in the queue filter
   *                    set per apReportService).
   * The pragmatic v1 boundary: assert queue heading visible + table-or-empty
   * shape. State-specific row presence is verified for fully_paid only.
   */
  expectedLifecycleState: 'fully_paid' | 'partially_paid';
  /** Bill number used to identify the bill row. */
  billNumber: string;
}

/**
 * Assert that the recordPayment submission landed back on the queue view
 * and the bill's queue presence matches the expected post-state.
 *
 * Queue filter: apReportService.getPaymentApprovalQueue filters by
 * `lifecycle_state = 'approved_for_payment'`. After recordPayment:
 *   - fully_paid    → row absent from queue (state transition removes it).
 *   - partially_paid → also absent from queue (state is not in filter set).
 * Both transitions remove the row from the approved_for_payment-filtered
 * queue. The spec asserts queue navigation + row absence as the v1 boundary.
 */
export async function assertPaymentRecorded(
  page: Page,
  opts: AssertPaymentRecordedOpts,
): Promise<void> {
  // Queue heading visible (navigation back from RecordPaymentCard succeeded).
  await expect(
    page.getByRole('heading', { name: /payment approval queue/i }),
  ).toBeVisible();

  // Wait for queue fetch to resolve.
  await expect(
    page.locator('table').or(page.getByText(/no data\./i)),
  ).toBeVisible({ timeout: 10_000 });

  // Bill row should be ABSENT post-recordPayment (queue filters by
  // approved_for_payment; both fully_paid and partially_paid drop out).
  // Use a permissive check: the bill_number cell text is no longer visible.
  await expect(
    page.locator('td', { hasText: new RegExp(`^${opts.billNumber}$`) }),
  ).toHaveCount(0, { timeout: 10_000 });

  // Note: opts.expectedLifecycleState is currently used only to document the
  // expected transition; queue-absence holds for both. A future helper could
  // navigate to ApAgingView or PaidBillsHistoryView to verify the precise
  // post-state, but that's beyond the v1 smoke boundary.
  void opts.expectedLifecycleState;
}
