// tests/e2e/ec-19.spec.ts
// Phase 1.2 Exit Criterion #19 — canvas-context over-anchoring.
// Three scenarios per docs/09_briefs/phase-1.2/canvas_context_injection.md
// §Over-Anchoring Test:
//
//   (a) clicked entry + ambiguous question → agent should use the selection
//   (b) clicked entry + explicit reference to a different entry → agent
//       should follow the explicit reference (hard failure if over-anchored)
//   (c) no click + ambiguous question → agent should ask a clarification
//
// This spec captures artifacts only; it does NOT render a pass/fail
// verdict on the agent's natural-language response (Pre-decision 24).
// Founder + planner hold verdict authority by reviewing
// /tmp/ec-19-results-<timestamp>/results.json and the per-scenario PNGs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { CONTROLLER_ORG_ID } from './fixtures/auth';
import {
  clearSelection,
  gotoJournalEntryList,
  latestAssistantText,
  selectFirstEntry,
  sendAgentMessage,
} from './fixtures/journalEntry';

const RUN_TIMESTAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, '-');
const RESULTS_DIR = `/tmp/ec-19-results-${RUN_TIMESTAMP}`;
const RESULTS_FILE = join(RESULTS_DIR, 'results.json');

type CapturedRequest = {
  url: string;
  method: string;
  request_body: unknown;
  response_status: number;
  response_body: unknown;
};

type ScenarioResult = {
  scenario: 'a' | 'b' | 'c';
  description: string;
  user_message: string;
  selected_entity:
    | { entry_number: number; description: string; entry_id: string }
    | null;
  second_entry_hint?: { entry_number: number; description: string };
  agent_response_text: string;
  captured: CapturedRequest[];
  screenshot: string;
  timestamp: string;
};

const collected: ScenarioResult[] = [];

mkdirSync(RESULTS_DIR, { recursive: true });

/** Capture /api/agent/message request/response on the page. */
function attachAgentMessageSpy(page: Page): CapturedRequest[] {
  const captured: CapturedRequest[] = [];
  page.on('response', async (res) => {
    if (!res.url().endsWith('/api/agent/message')) return;
    const req = res.request();
    let request_body: unknown = null;
    try {
      request_body = JSON.parse(req.postData() ?? 'null');
    } catch {
      request_body = req.postData();
    }
    let response_body: unknown = null;
    try {
      response_body = await res.json();
    } catch {
      try {
        response_body = await res.text();
      } catch {
        response_body = null;
      }
    }
    captured.push({
      url: res.url(),
      method: req.method(),
      request_body,
      response_status: res.status(),
      response_body,
    });
  });
  return captured;
}

/** Pull the first two entry rows' number + description from the DOM. */
async function readFirstTwoEntries(page: Page): Promise<
  Array<{ entry_number: number; description: string; row_index: number }>
> {
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  const results: Array<{
    entry_number: number;
    description: string;
    row_index: number;
  }> = [];
  for (let i = 0; i < Math.min(2, count); i += 1) {
    const cells = rows.nth(i).locator('td');
    const num = parseInt((await cells.nth(0).innerText()).trim(), 10);
    const desc = (await cells.nth(2).innerText()).trim();
    results.push({ entry_number: num, description: desc, row_index: i });
  }
  return results;
}

test.afterAll(() => {
  writeFileSync(RESULTS_FILE, JSON.stringify(
    { run_timestamp: RUN_TIMESTAMP, scenarios: collected },
    null,
    2,
  ));
  // eslint-disable-next-line no-console
  console.log(`[ec-19] wrote ${collected.length} scenario(s) to ${RESULTS_DIR}`);
});

test('EC-19 (a) clicked entry + ambiguous question', async ({ page }) => {
  const captured = attachAgentMessageSpy(page);
  await gotoJournalEntryList(page, CONTROLLER_ORG_ID);

  const entries = await readFirstTwoEntries(page);
  expect(entries.length, 'seed must have at least one journal entry').toBeGreaterThanOrEqual(1);

  await selectFirstEntry(page);

  const USER_MSG = 'why was this posted?';
  await sendAgentMessage(page, USER_MSG);

  const responseText = await latestAssistantText(page);
  const screenshot = join(RESULTS_DIR, 'scenario-a.png');
  await page.screenshot({ path: screenshot, fullPage: true });

  collected.push({
    scenario: 'a',
    description: 'clicked entry + ambiguous question → agent should use the selection',
    user_message: USER_MSG,
    selected_entity: {
      entry_number: entries[0].entry_number,
      description: entries[0].description,
      entry_id: '(id not exposed in UI; see captured request_body.canvas_context)',
    },
    agent_response_text: responseText,
    captured,
    screenshot,
    timestamp: new Date().toISOString(),
  });
});

test('EC-19 (b) clicked entry + explicit reference to a different entry', async ({ page }) => {
  const captured = attachAgentMessageSpy(page);
  await gotoJournalEntryList(page, CONTROLLER_ORG_ID);

  const entries = await readFirstTwoEntries(page);
  expect(entries.length, 'seed must have at least two journal entries for scenario (b)').toBeGreaterThanOrEqual(2);

  await selectFirstEntry(page);

  const USER_MSG = `tell me about entry #${entries[1].entry_number}`;
  await sendAgentMessage(page, USER_MSG);

  const responseText = await latestAssistantText(page);
  const screenshot = join(RESULTS_DIR, 'scenario-b.png');
  await page.screenshot({ path: screenshot, fullPage: true });

  collected.push({
    scenario: 'b',
    description:
      'clicked entry + explicit reference to a different entry → agent should follow the explicit reference',
    user_message: USER_MSG,
    selected_entity: {
      entry_number: entries[0].entry_number,
      description: entries[0].description,
      entry_id: '(id not exposed in UI; see captured request_body.canvas_context)',
    },
    second_entry_hint: {
      entry_number: entries[1].entry_number,
      description: entries[1].description,
    },
    agent_response_text: responseText,
    captured,
    screenshot,
    timestamp: new Date().toISOString(),
  });
});

test('EC-19 (c) no click + ambiguous question', async ({ page }) => {
  const captured = attachAgentMessageSpy(page);
  await gotoJournalEntryList(page, CONTROLLER_ORG_ID);
  // Ensure nothing is selected: navigate away (reducer clears on
  // incompatible directive change) then back to the list.
  await clearSelection(page);
  await gotoJournalEntryList(page, CONTROLLER_ORG_ID);

  const USER_MSG = "what's going on with this?";
  await sendAgentMessage(page, USER_MSG);

  const responseText = await latestAssistantText(page);
  const screenshot = join(RESULTS_DIR, 'scenario-c.png');
  await page.screenshot({ path: screenshot, fullPage: true });

  collected.push({
    scenario: 'c',
    description:
      'no click + ambiguous question → agent should ask a clarification question',
    user_message: USER_MSG,
    selected_entity: null,
    agent_response_text: responseText,
    captured,
    screenshot,
    timestamp: new Date().toISOString(),
  });
});
