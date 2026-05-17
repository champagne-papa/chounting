// tests/e2e/fixtures/withDialogAccept.ts
//
// Phase 6.5 chunk 2b — Playwright test wrapper with auto-accept
// dialog handler. Required because Sub-Q11.a EC1.β v1 default
// always-prompt-on-replace fires `window.confirm()` on every Zone 1
// navigation (handleMainframeNavigate in SplitScreenLayout). Without
// auto-accept, Playwright dismisses dialogs by default → return early
// from handler → canvas doesn't navigate → E2E assertions fail.
//
// Per-form dirty-state detection is substrate-now-enforcement-later
// per ADR-0010 (fifth UI-layer instance: v1-default-prompt-mechanism
// grain). Post-v1 amendment may add selective prompting + per-form
// dirty flags; until then, this fixture handles the v1 always-prompt
// behavior universally across E2E specs.
//
// Usage: replace `import { test, expect } from '@playwright/test';`
// with `import { test, expect } from './fixtures/withDialogAccept';`
// at the top of any spec that clicks Zone 1 nav items OR
// AvatarDropdown.onTeamClick (which also routes through
// handleMainframeNavigate post-chunk-2b).

import { test as base, expect } from '@playwright/test';

type Fixtures = {
  autoAcceptDialogs: void;
};

export const test = base.extend<Fixtures>({
  // `auto: true` makes this fixture run automatically for every
  // test that uses this `test` object — no explicit invocation
  // needed in spec bodies.
  autoAcceptDialogs: [
    async ({ page }, use) => {
      page.on('dialog', (dialog) => {
        void dialog.accept();
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export type { Page, Locator } from '@playwright/test';
