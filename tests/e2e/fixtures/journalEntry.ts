// tests/e2e/fixtures/journalEntry.ts
// Thin navigation helpers for specs that need to reach the
// journal-entry list view inside the split-screen shell.
// Text-based selectors per Session 7.1.2 stop-condition: if
// selector ambiguity surfaces, add stable data-testid attributes
// as part of Session 7.1 Commit 5's own scope, not 7.1.2.

import type { Locator, Page } from '@playwright/test';
import { LOCALE } from './auth';

/** Navigate to the org root and switch canvas to the journal-entry list. */
export async function gotoJournalEntryList(page: Page, orgId: string): Promise<void> {
  await page.goto(`/${LOCALE}/${orgId}`);
  // MainframeRail button — matched by its title attribute.
  await page.getByTitle('Journal Entries').click();
  // Wait for either the entries table or the empty state.
  await page.getByRole('heading', { name: /journal entries/i }).waitFor();
}

/** Return a Locator for the first posted entry row in the list. */
export function firstEntryRow(page: Page): Locator {
  return page.locator('table tbody tr').first();
}

/** Click the first posted entry row (selects it via onSelectEntity). */
export async function selectFirstEntry(page: Page): Promise<void> {
  await firstEntryRow(page).click();
}

/**
 * Reset canvas selection. The selection reducer clears on
 * incompatible directive changes, so navigating to Chart of
 * Accounts and back is the simplest "no click" state.
 */
export async function clearSelection(page: Page): Promise<void> {
  await page.getByTitle('Chart of Accounts').click();
  await page.getByRole('heading', { name: /chart of accounts/i }).waitFor();
}

/** Send a message via the agent chat panel and wait for the assistant turn. */
export async function sendAgentMessage(page: Page, message: string): Promise<void> {
  const transcriptBefore = await page
    .getByTestId('turn-assistant')
    .count();
  await page.getByTestId('agent-input').fill(message);
  await page.getByTestId('agent-send').click();
  // Wait for a new assistant turn to appear. Generous timeout for
  // real-Claude round-trip.
  await page
    .getByTestId('turn-assistant')
    .nth(transcriptBefore)
    .waitFor({ timeout: 60_000 });
}

/** Extract the visible text of the latest assistant turn. */
export async function latestAssistantText(page: Page): Promise<string> {
  const turns = page.getByTestId('turn-assistant');
  const count = await turns.count();
  if (count === 0) return '';
  return (await turns.nth(count - 1).innerText()).trim();
}
