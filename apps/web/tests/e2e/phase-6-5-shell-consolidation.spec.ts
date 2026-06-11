// tests/e2e/phase-6-5-shell-consolidation.spec.ts
//
// Phase 6.5 chunk 1 — five E2E scenarios verifying the three-zone
// shell consolidation:
//   1. Golden-path navigation (workspace switch + nav click flow)
//   2. Zone 1 collapse + expand via button
//   3. Zone 2 collapse + expand via keyboard (Cmd+Shift+\)
//   4. localStorage persistence across reload
//   5. Region 7.3 footer cross-workspace stability
//
// Per Phase A A1-B disposition: React component + hook unit tests
// blocked by vitest DOM-environment gap (chunk 6.2b carry-forward);
// observable shell behavior carries through this E2E spec.

import { test, expect } from './fixtures/withDialogAccept';
import { CONTROLLER_ORG_ID, LOCALE } from './fixtures/auth';

const ORG_ROOT = `/${LOCALE}/${CONTROLLER_ORG_ID}`;

const SHELL_KEYS = [
  'chounting:shell:zone1Collapsed',
  'chounting:shell:zone2Collapsed',
  'chounting:shell:activeWorkspace',
] as const;

test.describe('Phase 6.5 chunk 1 — shell consolidation', () => {
  test.beforeEach(async ({ page }) => {
    // Reset shell localStorage to default before each scenario.
    await page.goto(ORG_ROOT);
    await page.evaluate((keys) => {
      keys.forEach((key) => window.localStorage.removeItem(key));
    }, SHELL_KEYS);
    await page.reload();
  });

  test('golden path: workspace switch + nav click renders correct canvas', async ({
    page,
  }) => {
    // Default state: Zone 1 expanded; Billing workspace active.
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="false"]'),
    ).toBeVisible();

    // Billing workspace tab is the active one (aria-pressed=true).
    const billingTab = page.getByRole('button', { name: /^.*Billing.*$/ });
    await expect(billingTab.first()).toHaveAttribute('aria-pressed', 'true');

    // Click Open Bills nav item → canvas renders.
    await page.getByTitle('Open Bills').click();
    await expect(
      page.getByRole('heading', { name: /open bills/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Switch to Reports workspace.
    const reportsTab = page.getByRole('button', { name: /^.*Reports.*$/ });
    await reportsTab.first().click();
    await expect(reportsTab.first()).toHaveAttribute('aria-pressed', 'true');

    // P&L Report is now reachable.
    await page.getByTitle('P&L Report').click();
    await expect(
      page.getByRole('heading', { name: /p&l|profit.*loss/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Balance Sheet (new nav surface for existing report_balance_sheet directive).
    await expect(page.getByTitle('Balance Sheet')).toBeVisible();
  });

  test('Zone 1 collapse + expand via button toggles rail-mode', async ({
    page,
  }) => {
    // Default expanded.
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="false"]'),
    ).toBeVisible();

    // Click collapse trigger.
    await page.getByRole('button', { name: 'Collapse Zone 1' }).click();

    // Verify collapsed rail rendered.
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="true"]'),
    ).toBeVisible();
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="false"]'),
    ).toHaveCount(0);

    // Click expand trigger.
    await page.getByRole('button', { name: 'Expand Zone 1' }).click();

    // Verify expanded.
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="false"]'),
    ).toBeVisible();
  });

  test('Zone 2 collapse + expand via keyboard shortcut', async ({ page }) => {
    // Default: AgentChatPanel expanded (full panel, not the collapsed rail).
    await expect(
      page.locator('aside[data-zone="2"][data-collapsed="true"]'),
    ).toHaveCount(0);

    // Press Ctrl+Shift+\ to toggle Zone 2 (handler accepts metaKey OR ctrlKey).
    await page.keyboard.press('Control+Shift+\\');

    // Collapsed rail visible.
    await expect(
      page.locator('aside[data-zone="2"][data-collapsed="true"]'),
    ).toBeVisible();

    // Press again to expand.
    await page.keyboard.press('Control+Shift+\\');
    await expect(
      page.locator('aside[data-zone="2"][data-collapsed="true"]'),
    ).toHaveCount(0);
  });

  test('localStorage persists shell state across reload', async ({ page }) => {
    // Collapse Zone 1 + switch to Reports workspace.
    await page.getByRole('button', { name: 'Collapse Zone 1' }).click();
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="true"]'),
    ).toBeVisible();

    // Expand back so we can click the Reports tab (Zone 1 collapsed hides workspace tabs).
    await page.getByRole('button', { name: 'Expand Zone 1' }).click();
    const reportsTab = page.getByRole('button', { name: /^.*Reports.*$/ });
    await reportsTab.first().click();

    // Re-collapse so reload state has both collapse + workspace persisted.
    await page.getByRole('button', { name: 'Collapse Zone 1' }).click();

    // Verify localStorage values.
    const stored = await page.evaluate((keys) => {
      return Object.fromEntries(
        keys.map((key) => [key, window.localStorage.getItem(key)]),
      );
    }, SHELL_KEYS);
    expect(stored['chounting:shell:zone1Collapsed']).toBe('true');
    expect(stored['chounting:shell:activeWorkspace']).toBe('reports');

    // Reload page.
    await page.reload();

    // Zone 1 still collapsed.
    await expect(
      page.locator('nav[data-zone="1"][data-collapsed="true"]'),
    ).toBeVisible();

    // Active workspace still Reports (visible after re-expand).
    await page.getByRole('button', { name: 'Expand Zone 1' }).click();
    await expect(
      page.getByRole('button', { name: /^.*Reports.*$/ }).first(),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('Region 7.3 footer is cross-workspace stable', async ({ page }) => {
    // From Billing, verify all 4 footer items visible.
    const region73 = page.locator('div[data-region="7.3"]');
    await expect(region73.getByTitle('Chart of Accounts')).toBeVisible();
    await expect(region73.getByTitle('Journal Entries')).toBeVisible();
    await expect(region73.getByTitle('Recurring Journals')).toBeVisible();
    await expect(region73.getByTitle('AI Action Review')).toBeVisible();

    // Switch to Reports workspace.
    await page.getByRole('button', { name: /^.*Reports.*$/ }).first().click();

    // Same 4 footer items still visible (unaffected by workspace switch).
    await expect(region73.getByTitle('Chart of Accounts')).toBeVisible();
    await expect(region73.getByTitle('Journal Entries')).toBeVisible();
    await expect(region73.getByTitle('Recurring Journals')).toBeVisible();
    await expect(region73.getByTitle('AI Action Review')).toBeVisible();
  });
});
