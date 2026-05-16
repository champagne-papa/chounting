// tests/e2e/paidBillsHistoryView.spec.ts
// Phase 5 chunk B5-3-D2 session #2 — EC-A-7 Paid bills history
// canvas view smoke E2E. Pattern parity with paymentApprovalQueueView.spec.ts:
// navigate to org root + click the MainframeRail icon by title,
// assert the canvas view header renders, and confirm the table-or-
// empty-state shape. No filter UI in v1; single fetch on mount.

import { test, expect } from '@playwright/test';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

test.describe('PaidBillsHistoryView', () => {
  test('renders Paid Bills History view from MainframeRail click and shows table-or-empty shape', async ({
    page,
  }) => {
    // (1) Navigate to org root + click "Paid Bills History" MainframeRail icon.
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Paid Bills History').click();

    // (2) Heading visible.
    await expect(
      page.getByRole('heading', { name: /paid bills history/i }),
    ).toBeVisible();

    // (3) Wait for the loading stencil to clear: either the table or
    // the "No data." empty-state appears once the fetch resolves.
    await expect(
      page.locator('table').or(page.getByText(/no data\./i)),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('fires GET /api/orgs/[orgId]/reports/paid-bills-history on mount', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/orgs/') &&
        req.url().includes('/reports/paid-bills-history') &&
        req.method() === 'GET',
    );

    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Paid Bills History').click();

    const request = await requestPromise;
    expect(request.url()).toContain('/reports/paid-bills-history');
  });
});
