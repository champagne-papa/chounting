// tests/e2e/activePaymentsView.spec.ts
// Phase 5 chunk B5-3-D5 session #1 — Active payments canvas view smoke E2E.
// Pattern parity with paymentApprovalQueueView.spec.ts: navigate to org root
// + click the MainframeRail icon by title, assert the canvas view header
// renders, and confirm the table-or-empty-state shape. No filter UI in v1;
// single fetch on mount.

import { test, expect } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

test.describe('ActivePaymentsView', () => {
  test('renders Active Payments view from MainframeRail click and shows table-or-empty shape', async ({
    page,
  }) => {
    // (1) Navigate to org root + click "Active Payments" MainframeRail icon.
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Active Payments').click();

    // (2) Heading visible.
    await expect(
      page.getByRole('heading', { name: /active payments/i }),
    ).toBeVisible();

    // (3) Wait for the loading stencil to clear: either the table or
    // the partial-payment empty-state appears once the fetch resolves.
    await expect(
      page.locator('table').or(
        page.getByText(/no bills currently in partial-payment state/i),
      ),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('fires GET /api/orgs/[orgId]/reports/active-payments on mount', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/orgs/') &&
        req.url().includes('/reports/active-payments') &&
        req.method() === 'GET',
    );

    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Active Payments').click();

    const request = await requestPromise;
    expect(request.url()).toContain('/reports/active-payments');
  });
});
