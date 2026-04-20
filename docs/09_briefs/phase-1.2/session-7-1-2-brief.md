# Phase 1.2 Session 7.1.2 Sub-Brief (DELTA of DELTA)

**Drafted:** 2026-04-19
**Anchor SHA:** a43dd35 (feat(phase-1.2): Session 7.1.1 — agent.response.natural + template catalog split)
**Predecessor sub-brief:** `docs/09_briefs/phase-1.2/session-7-1-1-brief.md` @ 58ade6e (Shape C DELTA-of-DELTA)
**Authoritative EC-19 scenario source:** `docs/09_briefs/phase-1.2/canvas_context_injection.md` §Over-Anchoring Test
**Status:** DRAFT v1 — awaiting founder review gate before freeze

---

## 1. Session goal

Micro-sub-session carved out of Session 7.1, parallel in shape to 7.1.1 but for test infrastructure. Introduces Playwright as project-side e2e harness and lands EC-19 scenarios (a), (b), (c) as its first spec. The first execution of the harness **is** Session 7.1 Commit 5's EC-19 verification — scope is "set up infrastructure + run EC-19 as its validation," not "set up infrastructure" separately. Single commit landing on top of a43dd35.

---

## 2. Prerequisites

- `pnpm test` at 369/369; `git rev-parse --short HEAD` → `a43dd35`.
- **Working-tree state:** Session 7.1 Commit 5 changes remain uncommitted (modified bridge/canvas components + `src/agent/canvas/` + two new `tests/integration/` files). **Do not touch, stage, stash, or revert.** 7.1.2 commits land on top of a43dd35; Commit 5's EC-19 verification is the first run of the new harness, after 7.1.2 lands.

---

## 3. Pre-decisions specific to 7.1.2

Numbering continues from Session 7.1.1 (P19–P21 landed at a43dd35).

### Pre-decision 22 — Playwright test directory: `tests/e2e/`

Co-located with existing `tests/integration/` under the top-level `tests/` tree. Single discovery root, same mental model as vitest. Rejected alternative: `e2e/` at repo root (splits test-landing convention across two parent directories for no gain).

### Pre-decision 23 — Auth fixture: `storageState`, cookie persisted to `tests/e2e/.auth/<user>.json`

Sign-in happens once per test run, cookie persisted via Playwright's `storageState` and reused across tests. **`tests/e2e/.auth/` MUST be added to `.gitignore` in the same commit** — session cookies in git history is a credential leak. Rejected alternative: per-test sign-in (slow; unnecessary for read-only EC-19 coverage).

### Pre-decision 24 — Output reporting: `/tmp/ec-19-results-<timestamp>/`

Per-run ephemeral directory containing `results.json` (template_ids, request/response bodies, verbatim agent response text) + per-scenario PNG screenshots (`scenario-a.png`, `scenario-b.png`, `scenario-c.png`). One-shot-per-run; no persistence inside the repo. Founder reviews JSON for correctness, screenshots for visual sanity. **No pass/fail verdict inside the spec** — outputs present; founder and planner hold verdict authority. Rejected alternative: spec-side assertions on Claude's natural-language output (over-constrains a free-form response surface).

### Pre-decision 25 — EC-19 row split: 19b only in e2e

The e2e spec covers 19b (agent-behavior against real Claude) only. 19a (client-side contract — reducer type-compatibility, `canvas_context` request passthrough) stays in the existing `canvasContextReducer.test.ts` + `apiAgentMessageCanvasContextPassthrough.test.ts` integration tests held in Commit 5's working tree. Mirrors the Session 7.1 handoff's 19a/19b split.

### Pre-decision 26 — Dev server orchestration: `webServer` with `reuseExistingServer: !process.env.CI`

Playwright's `webServer` config boots `pnpm dev` on `:3000` when nothing is listening and tears it down after the run; when a dev server is already running (founder's iterative terminal workflow), Playwright reuses it. Avoids the "port in use" foot-gun on re-runs. CI runs always boot fresh.

### Pre-decision 27 — Commit structure: single feature commit

`feat(phase-1.2): Session 7.1.2 — Playwright harness + EC-19 spec`. Retrospective folded into the commit message per 7.1.1's pattern. Process observations roll up into Session 7.1 Commit 6 closeout.

---

## 4. Scope detail

- `package.json` — `@playwright/test` devDep; scripts `test:e2e` (`playwright test`), `test:e2e:ui` (`playwright test --ui`), `test:e2e:install` (`playwright install --with-deps chromium`).
- `playwright.config.ts` — `testDir: 'tests/e2e'`, `webServer` per P26, `use.baseURL: 'http://localhost:3000'`, `use.storageState` default from `tests/e2e/.auth/user.json`, Chromium project only for Phase 1.2.
- `tests/e2e/.auth/` — directory created by the auth fixture at first run; ignored via `.gitignore` per P23.
- `.gitignore` — add `tests/e2e/.auth/` line in the same commit.
- `tests/e2e/fixtures/auth.ts` — `globalSetup` sign-in flow that writes `user.json` to `tests/e2e/.auth/`. Signs in as `controller@thebridge.local` (full journal-entry data via ORG_HOLDING; scope-appropriate for EC-19). Credentials read from the existing local seed user set per `scripts/seed-auth-users.ts` convention (no new env vars). Other personas added as needed in future specs.
- `tests/e2e/fixtures/journalEntry.ts` — navigation helpers: `gotoJournalEntryList(page, orgId)`, `selectFirstEntry(page)`, `clearSelection(page)`. Thin wrappers around `page.goto()` + stable `data-testid` selectors on the Commit-5 click surfaces.
- `tests/e2e/ec-19.spec.ts` — three scenarios (a), (b), (c) per `canvas_context_injection.md` §Over-Anchoring Test; each writes its slice of `results.json` + a PNG screenshot to `/tmp/ec-19-results-<timestamp>/`.
- `tests/e2e/README.md` — harness usage, output location, founder review workflow.
- Documentation: one-line entry in `CLAUDE.md`'s "Navigation — tier-1 always-relevant" section naming `pnpm test:e2e` alongside `pnpm test` and `pnpm agent:validate`; detailed usage in `tests/e2e/README.md` per above. Skip `docs/04_engineering/` for this iteration (Session 8 or Phase 2 can add engineering docs if the harness expands).

---

## 5. Commit cadence

Single feature commit: `feat(phase-1.2): Session 7.1.2 — Playwright harness + EC-19 spec`. Retrospective folded into the commit message. Commit 5 then re-opens for its EC-19 verification via the new harness; its own commit remains a Session 7.1 Commit 5, not 7.1.2.

---

## 6. Stop conditions

- `pnpm test:e2e:install` (Chromium fetch) fails: surface the environment error to founder; do not work around.
- Playwright `webServer` fails to start `pnpm dev` on a cold port: investigate local env, not Playwright config.
- Selector ambiguity on Commit-5 click surfaces: use text-based selectors initially (`getByText`, `getByRole`). If text-based selectors prove unreliable after first harness run, add stable `data-testid` attributes as part of Commit 5's existing scope when Commit 5 commits post-EC-19 — do NOT widen 7.1.2's scope to modify Commit 5 files.
- `pnpm test` regresses at the 7.1.2 commit boundary: fix before proceeding.

---

## 7. Convention #9 / #10 datapoint context

Convention #9 candidate ("material gaps surface at layer-transition boundaries") sits at **5 datapoints** as of a43dd35 (P11b, P14, P16 dual-context rewrite, P19 template-catalog gap, 7.1.1 planner-side rationale drift). Convention #10 candidate ("mutual hallucination-flag-and-retract discipline between planner and executor") sits at **4 datapoints** as of a43dd35. Test-harness introduction is historically a high-yield surface for both; 7.1.2 is expected to surface more. Any new datapoints roll up into Session 7.1 Commit 6 closeout, not this sub-brief.
