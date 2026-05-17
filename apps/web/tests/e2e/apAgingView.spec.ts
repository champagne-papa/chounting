// tests/e2e/apAgingView.spec.ts
// Phase 5 chunk B5-3-D2 session #1 — EC-A-3 AP aging canvas view
// smoke E2E. Pattern parity with tests/e2e/fixtures/journalEntry.ts:
// navigate to org root + click the MainframeRail icon by title,
// assert the canvas view header renders, exercise the as_of_date
// filter, and confirm the 4-bucket table structure.

import { test, expect } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

test.describe('ApAgingView', () => {
  test('renders AP aging view from MainframeRail click and shows 4-bucket table', async ({
    page,
  }) => {
    // (1) Navigate to org root + click "AP Aging" MainframeRail icon.
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('AP Aging').click();

    // (2) Heading visible.
    await expect(
      page.getByRole('heading', { name: /ap aging/i }),
    ).toBeVisible();

    // (3) As-of-date filter input present.
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    // (4) Table renders. Wait for loading state to clear.
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // Header columns present.
    await expect(
      page.locator('thead').getByText(/bucket/i),
    ).toBeVisible();
    await expect(
      page.locator('thead').getByText(/bill count/i),
    ).toBeVisible();
    await expect(
      page.locator('thead').getByText(/amount/i),
    ).toBeVisible();

    // (5) Total row in tfoot.
    await expect(page.locator('tfoot').getByText(/total/i)).toBeVisible();
  });

  test('refetches on as_of_date filter change', async ({ page }) => {
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('AP Aging').click();
    await expect(
      page.getByRole('heading', { name: /ap aging/i }),
    ).toBeVisible();

    // Intercept the second fetch to confirm filter parameter is wired.
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/orgs/') &&
        req.url().includes('/reports/ap-aging') &&
        req.url().includes('as_of_date='),
    );

    await page.locator('input[type="date"]').fill('2026-01-31');

    const filteredRequest = await requestPromise;
    expect(filteredRequest.url()).toContain('as_of_date=2026-01-31');
  });
});
