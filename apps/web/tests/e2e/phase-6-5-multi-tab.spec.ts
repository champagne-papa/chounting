// tests/e2e/phase-6-5-multi-tab.spec.ts
//
// Phase 6.5 chunk 2b — E2E scenarios verifying the multi-tab canvas
// substrate + Pattern γ source-driven routing per Sub-Q11.a Rules
// 2-4 + edge cases EC1.β + EC2.β (Rule 1 drop wires at chunk 3).
//
// Scope-bounded test coverage at chunk 2b: scenarios that don't
// require real Claude API agent emissions OR drop events. Multi-tab
// open scenarios (Rule 2 agent canvas_directive → new tab; Rule 1
// drop → new tab) defer to chunk 3 (which wires drop) OR a future
// dedicated session OR are covered visually via the screenshot gate
// + Pattern γ unit tests at tests/unit/canvasTabRouting.test.ts.
//
// The auto-accept-dialogs fixture from withDialogAccept handles
// EC1.β v1 default window.confirm() prompts on Zone 1 nav.

import { test, expect } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

const ORG_ROOT = `/${LOCALE}/${CONTROLLER_ORG_ID}`;

test.describe('Phase 6.5 chunk 2 — multi-tab canvas', () => {
  test('CanvasTabStrip renders with one tab at default page load', async ({
    page,
  }) => {
    await page.goto(ORG_ROOT);

    // Strip is present with role=tablist.
    const tabStrip = page.locator('[data-testid="canvas-tab-strip"]');
    await expect(tabStrip).toBeVisible();
    await expect(tabStrip).toHaveAttribute('role', 'tablist');

    // Exactly one tab; its role is "tab" with aria-selected=true.
    const tabs = page.locator('[data-testid="canvas-tab-strip"] [role="tab"]');
    await expect(tabs).toHaveCount(1);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('close button hidden when tabs.length === 1', async ({ page }) => {
    await page.goto(ORG_ROOT);

    // No close button rendered at single-tab state (canvasTabRouting
    // closeTab dance for tabs-zero recreates a fresh 'none' tab; UX
    // hides the no-op click).
    const closeButtons = page.locator('[data-testid="canvas-tab-close"]');
    await expect(closeButtons).toHaveCount(0);
  });

  test('Zone 1 nav (EC1.β auto-accept) replaces active tab; tab count stays 1', async ({
    page,
  }) => {
    await page.goto(ORG_ROOT);

    // Click Open Bills in Zone 1 → window.confirm fires + auto-accepts
    // via withDialogAccept fixture → routeReplaceActive fires →
    // active tab's directive replaces; history resets.
    await page.getByTitle('Open Bills').click();

    await expect(
      page.getByRole('heading', { name: /open bills/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Tab strip still shows 1 tab (replace doesn't open a new tab).
    const tabs = page.locator('[data-testid="canvas-tab-strip"] [role="tab"]');
    await expect(tabs).toHaveCount(1);

    // History reset post-replace: back arrow disabled (canGoBack=false).
    const backButton = page.getByLabel('Canvas back');
    await expect(backButton).toBeDisabled();
  });

  test('in-canvas drill-down appends history; back arrow restores prior view', async ({
    page,
  }) => {
    await page.goto(ORG_ROOT);

    // Navigate to journal entries list via Zone 1 (auto-accept).
    await page.getByTitle('Journal Entries').click();
    await expect(
      page.getByRole('heading', { name: /journal entries/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify back arrow disabled at start of fresh tab.
    const backButton = page.getByLabel('Canvas back');
    await expect(backButton).toBeDisabled();

    // Click first entry row to drill down (in-canvas navigation;
    // Pattern γ Rule 4 routeStayInActive → appends history).
    const firstRow = page.locator('table tbody tr').first();
    const rowCount = await page.locator('table tbody tr').count();
    if (rowCount > 0) {
      await firstRow.click();
      // Drill-down landed on detail view; back arrow now enabled.
      await expect(backButton).toBeEnabled({ timeout: 10_000 });

      // Click back arrow → returns to journal entries list.
      await backButton.click();
      await expect(
        page.getByRole('heading', { name: /journal entries/i }),
      ).toBeVisible();
      await expect(backButton).toBeDisabled();
    }
  });

  test('tab title renders for default state ("New tab")', async ({ page }) => {
    await page.goto(ORG_ROOT);

    // Default tab title for {type: 'none'} directive.
    const tab = page.locator('[data-testid="canvas-tab-strip"] [role="tab"]').first();
    await expect(tab).toContainText('New tab');
  });

  test('tab title updates after Zone 1 nav (active-tab directive change)', async ({
    page,
  }) => {
    await page.goto(ORG_ROOT);

    // Navigate to AP Aging → tab title updates to "AP Aging".
    await page.getByTitle('AP Aging').click();
    await expect(
      page.getByRole('heading', { name: /ap aging/i }),
    ).toBeVisible({ timeout: 10_000 });

    const tab = page.locator('[data-testid="canvas-tab-strip"] [role="tab"]').first();
    await expect(tab).toContainText('AP Aging');
  });
});
