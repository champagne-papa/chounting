// tests/e2e/pendingApprovalsView.spec.ts
// Phase 5 arc-closure — Pending Approvals canvas view smoke E2E.
//
// Pattern parity with activePaymentsView.spec.ts. Two tests:
//   (1) MainframeRail icon → view renders → table-or-empty shape.
//   (2) Row-click smoke: seed pending_approval bill → view → click row →
//       PaymentApprovalCard mounts (substrate-correction verified at
//       wire-up grain) → cancel returns.
//
// E2E execution is informational (founder-review-workflow grain) — NOT
// a chunk-close gate.

import { test, expect, type Page } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';
import {
  seedTestVendor,
  seedPendingApprovalBill,
  gotoPendingApprovals,
  selectBillFromPendingApprovals,
  cancelPaymentApproval,
} from './fixtures/bill';

const VENDOR_NAME = 'E2E Pending Approvals Vendor';

test.describe('PendingApprovalsView', () => {
  test('renders Pending Approvals view from MainframeRail click and shows table-or-empty shape', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(`/${LOCALE}/${CONTROLLER_ORG_ID}`);
    await page.getByTitle('Pending Approvals').click();

    await expect(
      page.getByRole('heading', { name: /pending approvals/i }),
    ).toBeVisible();

    await expect(
      page.locator('table').or(
        page.getByText(/no bills currently awaiting approval/i),
      ),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('row-click navigates to PaymentApprovalCard; cancel returns to view', async ({
    page,
  }: {
    page: Page;
  }) => {
    const vendor = await seedTestVendor(CONTROLLER_ORG_ID, VENDOR_NAME);
    const { billNumber, cleanup: billCleanup } = await seedPendingApprovalBill(
      CONTROLLER_ORG_ID,
      vendor.vendorId,
      { amount_cad: '250.00' },
    );

    try {
      await gotoPendingApprovals(page, CONTROLLER_ORG_ID);

      await expect(
        page.locator('td', { hasText: new RegExp(`^${billNumber}$`) }),
      ).toBeVisible({ timeout: 10_000 });

      await selectBillFromPendingApprovals(page, billNumber);

      // PaymentApprovalCard mounts (substrate-correction verified: the
      // card now fetches the per-bill endpoint and resolves successfully
      // for a pending_approval bill instead of failing with
      // "Bill not found in approval queue").
      await expect(
        page.getByRole('heading', { name: /approve bill.*for payment/i }),
      ).toBeVisible({ timeout: 10_000 });

      await cancelPaymentApproval(page);
    } finally {
      await billCleanup();
      await vendor.cleanup();
    }
  });
});
