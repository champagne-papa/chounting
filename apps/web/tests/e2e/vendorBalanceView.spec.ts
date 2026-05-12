// tests/e2e/vendorBalanceView.spec.ts
// Phase 5 chunk B5-3-D2 session #1 — EC-A-5 Vendor balance canvas view
// smoke E2E. Substantively novel — 2-service composition via dual fetch:
// (1) vendors list on mount (populates <select>); (2) balance fetch on
// vendor selection (4-component shape). Pattern parity with
// apAgingView.spec.ts / openBillsView.spec.ts: navigate to org root +
// click the MainframeRail icon by title, assert the canvas view header
// renders, and confirm the vendor-picker → balance flow OR empty-state
// path if test org has no vendors seeded.

import { test, expect } from '@playwright/test';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

test.describe('VendorBalanceView', () => {
  test('renders Vendor Balance view from MainframeRail click and shows vendor picker or empty state', async ({
    page,
  }) => {
    // (1) Navigate to org root + click "Vendor Balance" MainframeRail icon.
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Vendor Balance').click();

    // (2) Heading visible.
    await expect(
      page.getByRole('heading', { name: /vendor balance/i }),
    ).toBeVisible();

    // (3) Wait for vendors-loading stencil to clear: either the <select>
    // populates OR the empty-state message appears once the mount fetch
    // resolves.
    await expect(
      page.locator('select').or(page.getByText(/no vendors found/i)),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('fires GET /api/orgs/[orgId]/vendors on mount', async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/orgs/') &&
        req.url().includes('/vendors') &&
        !req.url().includes('/reports/') &&
        req.method() === 'GET',
    );

    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Vendor Balance').click();

    const request = await requestPromise;
    expect(request.url()).toContain('/vendors');
  });

  test('selecting a vendor fires balance fetch and renders 4-component shape', async ({
    page,
  }) => {
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Vendor Balance').click();
    await expect(
      page.getByRole('heading', { name: /vendor balance/i }),
    ).toBeVisible();

    // Wait for vendors mount fetch to resolve (either select or empty-state).
    await expect(
      page.locator('select').or(page.getByText(/no vendors found/i)),
    ).toBeVisible({ timeout: 10_000 });

    // Branch on whether vendors exist. If empty state, assert empty-state
    // path; otherwise exercise the select → balance flow.
    const selectVisible = await page.locator('select').isVisible();
    if (!selectVisible) {
      await expect(page.getByText(/no vendors found/i)).toBeVisible();
      return;
    }

    // Vendor dropdown present; find the first non-placeholder option.
    // Filter to real vendor options (value attribute non-empty).
    const realOptions = page.locator('select option[value]:not([value=""])');
    const realCount = await realOptions.count();
    if (realCount === 0) {
      // Select renders only the placeholder; treat as empty-state path.
      await expect(page.getByText(/select a vendor/i)).toBeVisible();
      return;
    }
    const firstVendorId = await realOptions.first().getAttribute('value');
    if (!firstVendorId) {
      await expect(page.getByText(/select a vendor/i)).toBeVisible();
      return;
    }

    // Intercept the balance fetch.
    const balanceRequestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/orgs/') &&
        req.url().includes('/reports/vendor-balance') &&
        req.url().includes('vendor_id='),
    );

    await page.locator('select').selectOption(firstVendorId);

    const balanceRequest = await balanceRequestPromise;
    expect(balanceRequest.url()).toContain(`vendor_id=${firstVendorId}`);

    // Wait for balance to render: 4 component labels visible.
    await expect(page.getByText(/open ap/i)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/unapplied vendor credits/i),
    ).toBeVisible();
    await expect(
      page.getByText(/open vendor deposits and retainers/i),
    ).toBeVisible();
    await expect(page.getByText(/accrued unbilled/i)).toBeVisible();
    await expect(page.getByText(/net balance/i)).toBeVisible();
  });
});
