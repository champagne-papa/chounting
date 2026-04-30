// tests/e2e/fixtures/auth.ts
// Playwright globalSetup: signs in as the controller seed user
// once per test run and persists storageState to
// tests/e2e/.auth/user.json. Individual specs inherit the cookie
// via the default `use.storageState` in playwright.config.ts.
//
// The controller seed is chosen because it has is_org_owner on
// both dev orgs and carries the full journal-entry fixture data
// needed by EC-19. Additional personas (executive, ap) can land
// in a second *.auth/*.json file when a spec requires it.
//
// Credentials match scripts/seed-auth-users.ts — these are
// public dev seeds (also documented in
// docs/09_briefs/CURRENT_STATE.md §Seed passwords) and are NOT
// secrets. The tests/e2e/.auth/ directory is gitignored because
// the *cookie* it persists IS a credential.

import { chromium, type FullConfig } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export const CONTROLLER_EMAIL = 'controller@thebridge.local';
export const CONTROLLER_PASSWORD = 'DevSeed!Controller#1';
export const CONTROLLER_ORG_ID = '11111111-1111-1111-1111-111111111111';
export const LOCALE = 'en';
export const STORAGE_STATE = 'tests/e2e/.auth/user.json';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await mkdir(dirname(STORAGE_STATE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`http://localhost:3000/${LOCALE}/sign-in`);
  await page.getByLabel(/email/i).fill(CONTROLLER_EMAIL);
  await page.getByLabel(/password/i).fill(CONTROLLER_PASSWORD);
  await page.getByRole('button', { name: /sign in|submit/i }).click();

  // resolveSignInDestination sends the controller to
  // /en/<earliest-org>; ORG_HOLDING is seeded first.
  await page.waitForURL(new RegExp(`/${LOCALE}/${CONTROLLER_ORG_ID}`), {
    timeout: 15_000,
  });

  await context.storageState({ path: STORAGE_STATE });
  await browser.close();
}
