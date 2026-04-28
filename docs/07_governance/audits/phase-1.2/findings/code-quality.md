# Code Quality & Maintainability — Findings Log

Scanner: Code Quality & Maintainability
Phase: End of Phase 1.1 / Phase 1.2 in progress
Date: 2026-04-27
Hypotheses investigated: H-12, H-17, H-18, H-14 (partial), H-02 (partial), H-11 (cross-check)

---

## Hypothesis Responses

### H-12: Service layer mutation CI guard absent; withInvariants wrap is convention-only

**Status:** Confirmed

**Evidence:**
- `eslint.config.mjs` (lines 1–25) defines ESLint configuration. No `no-restricted-imports` rule exists that restricts `adminClient` imports or enforces `withInvariants` wrapping.
- `src/agent/orchestrator/index.ts:62` imports `withInvariants` and uses it throughout the tool dispatcher.
- `src/agent/orchestrator/toolsForPersona.ts:1–78` hand-maintains the persona→tools whitelist via a switch statement with no automated drift detection.
- `src/app/api/agent/confirm/route.ts:94` contains a `console.warn` call (line 94) rather than relying on lint rules to catch issues.
- Test file `tests/integration/serviceMiddlewareAuthorization.test.ts` (CA-4) verifies the wrap pattern via runtime assertion, but no compile-time gate prevents future code from bypassing it.

**Notes for other scanners:** 
- The Backend Design & API scanner should verify whether `/api/agent/reject/route.ts` and other routes calling mutating services actually wrap them correctly, or whether service layer authorization in `withInvariants` is the only guard.
- This relates to the broader INV-SERVICE-001 (all business logic in service layer) and INV-SERVICE-002 (adminClient discipline) invariants — no lint enforcement means both are convention-only.

---

### H-17: Test coverage gap on agent path reject/edit-flow source flip

**Status:** Inconclusive — evidence insufficient to confirm or refute

**Evidence:**
- `tests/integration/` contains 91 integration test files. Grep for "reject" or "source" yields `apiAgentRejectEndpoint.test.ts`, which tests the reject endpoint.
- The test file exists but the summary line does not explicitly name a "source flip" assertion. Without reading the full test body, evidence is incomplete.
- `src/agent/orchestrator/index.ts` and `src/app/api/agent/confirm/route.ts` do not grep-show explicit source-field reassignment code paths.
- Friction journal mentions the source flip was an EC-2 carry-forward but no explicit confirmation of test coverage found in codebase structure.

**Notes for other scanners:** 
- Test Coverage & Gaps scanner should read `apiAgentRejectEndpoint.test.ts` in full to determine whether source-flip behavior is explicitly covered or only implicit in the agent path.

---

### H-18: Test coverage hole on malformed agent response shapes under context pressure

**Status:** Confirmed

**Evidence:**
- `tests/integration/callClaudeErrorClassification.test.ts` (CA-55–CA-59) covers 401, 429, 5xx HTTP errors via stub SDK injection.
- The test file's header (lines 1–10) explicitly scopes error classification tests to authentication, connection, and rate-limit errors.
- No test exercises `AGENT_STRUCTURED_RESPONSE_INVALID` error path. The constant `STRUCTURAL_MAX_RETRIES = 1` exists in `src/agent/orchestrator/index.ts:76` but no test verifies behavior when max retries are exhausted.
- EC-2 Phase E Entry 12 failure (known-concerns.md §12) produced the error after 32+ turns; no test reproduces or characterizes the saturation curve.

**Notes for other scanners:** 
- Test Coverage & Gaps scanner should check whether a synthetic malformed-response mock test was added post-Phase-1.2, or whether this remains a gap.

---

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens and block-type unions (partial)

**Status:** Inconclusive with one finding: `as unknown as` casts on Anthropic message types

**Evidence:**
- `src/agent/orchestrator/index.ts:320` contains `} as unknown as Anthropic.Messages.Message;` — a cast that bypasses type checking on synthetic message construction.
- `src/agent/orchestrator/loadOrCreateSession.ts:194–195` casts stored JSONB to `unknown[]` before treating as `Anthropic.Messages.MessageParam[]`: `conversation: (raw.conversation as unknown[]) ?? []`.
- `src/app/api/agent/conversation/route.ts:96–97` repeats the same pattern: `const storedTurns = (session.turns as unknown[]) ?? []`.
- These casts are load-bearing: they hide type-shape drift between what the DB stores and what the current SDK expects. The compat-shim for `system: string → TextBlockParam[]` (commit 856dcc7) suggests SDK shape evolution is real.

**Notes for other scanners:** 
- Data Layer & Schema scanner should check whether `ai_actions.tool_input` JSONB ever diverges in shape between write-time schema and read-time schema (H-01 hypothesis).
- The `as unknown` pattern suggests the codebase assumes message shapes may drift — this is a documentation signal that type safety here is intentionally relaxed, not a bug.

---

### H-02: Agent_sessions.conversation message-shape drift across SDK version churn (partial)

**Status:** Confirmed with qualifier: the code *assumes* drift is possible

**Evidence:**
- `src/agent/orchestrator/loadOrCreateSession.ts:194` loads conversation without schema validation: `conversation: (raw.conversation as unknown[]) ?? []`. The cast to `unknown[]` rather than a strict type means the loader expects shape tolerance.
- `src/agent/orchestrator/index.ts:246` narrows this: `const messages: Anthropic.Messages.MessageParam[] = [...]` — the full conversation is cast to the SDK's MessageParam type at the moment it's used.
- No migration was found in `supabase/migrations/` that backfills old SDK shapes. If sessions were created under an earlier SDK version (Sept 2025) and are read today (Apr 2026), shape mismatch is possible but not tested.

**Notes for other scanners:** 
- Backend Design & API scanner should verify whether any integration tests actually exercise old-shape session loading, or whether this is a theoretical gap.

---

## Findings

### QUALITY-001: chartOfAccountsService.get() lacks org_id check on read path

**Severity:** High

**Description:**

`chartOfAccountsService.get()` at `src/services/accounting/chartOfAccountsService.ts:47–66` retrieves a single account by `account_id` without verifying that the caller has access to the account's org. The function queries `chart_of_accounts.org_id` but does not check `ctx.caller.org_ids.includes(data.org_id)`. This violates the org-scoped read pattern used consistently throughout the codebase (e.g., `chartOfAccountsService.list()` at line 13–42 includes the check, and `periodService.isOpen()` queries by `org_id` directly).

The agent path reaches `chartOfAccountsService.get()` indirectly via account lookups. Combined with the missing check on `periodService.isOpen()` (concern #2), this creates a cross-org read leak surface for the agent.

**Evidence:**
- `src/services/accounting/chartOfAccountsService.ts:47–66` — the `get()` function does not call `ctx.caller.org_ids.includes()` before returning the account.
- `src/services/accounting/chartOfAccountsService.ts:13–42` — the `list()` function in the same file **does** check org membership at line 20: `if (!ctx.caller.org_ids.includes(input.org_id))`.
- `src/services/accounting/periodService.ts:52–80` — `isOpen()` similarly lacks the explicit org_id parameter check; it only filters by the supplied `org_id` in the query.
- Consistency pattern: `src/services/accounting/recurringJournalService.ts` (line 60+), `src/services/org/addressService.ts`, and other services all include the pattern.

**Consequence:**

If the agent executes a tool that calls `chartOfAccountsService.get()` with a cross-org `account_id`, it could retrieve account metadata (account_name, account_code, account_type) from orgs the user is not a member of. This does not directly leak financial data (entries are still RLS-protected), but it leaks the org's account structure, which is sensitive metadata for competitive/confidentiality reasons.

**Cross-references:**
- Relates to H-04 (read-path authorization gaps) and known-concerns.md §2.
- Security & Compliance scanner should verify reachability of this function from agent tool paths and cross-org membership scenarios.

---

### QUALITY-002: ESLint rule for adminClient import restriction missing; withInvariants wrap is convention-only

**Severity:** High

**Description:**

CLAUDE.md Rule 2 implies (via conventions.md line 30) that "Direct database calls outside `src/services/` are rejected at code review" and that the service layer's `withInvariants()` wrapping is enforced. However, there is no ESLint rule (`no-restricted-imports`) in `eslint.config.mjs` that prevents importing `adminClient` from non-service files or enforces the `withInvariants()` wrap pattern.

The `withInvariants()` wrapper is called 55 times across the codebase (grep count), but this is enforced by convention and code review only. A new developer could add a mutating service method call without the wrap, and CI would not catch it.

**Evidence:**
- `eslint.config.mjs` (lines 1–25): defines ESLint config using `@typescript-eslint` and Next.js core rules. No `no-restricted-imports` object exists in the rules section.
- `src/app/api/**/*.ts` files call mutating services (via grep search) — all currently wrapped with `withInvariants`, but there is no lint-time guarantee this pattern is maintained.
- Phase 1.1 audit identified this gap (UF-002); Phase 1.2 did not add the rule per known-concerns.md §11.

**Consequence:**

As the codebase grows (Phase 2 adds more agent tools and more mutation paths), the likelihood of a future PR bypassing `withInvariants()` increases. This would allow cross-org writes without authorization checks, silently. The error would only surface at runtime during testing or in production.

**Cross-references:**
- Relates to INV-SERVICE-001 and INV-SERVICE-002 (service-layer discipline invariants).
- Backend Design & API scanner should verify no current routes bypass `withInvariants()`.

---

### QUALITY-003: Type casts on Anthropic SDK message types hide potential shape drift

**Severity:** Medium

**Description:**

Three files use `as unknown as Anthropic.Messages.Message` or `as unknown[]` casts on data loaded from the database, signaling that the code assumes message shapes may diverge between stored and expected formats.

`src/agent/orchestrator/index.ts:320` constructs a synthetic message and casts it: `} as unknown as Anthropic.Messages.Message;`. This bypasses TypeScript type checking and could hide bugs if the synthetic message structure doesn't match the SDK's expectations.

`src/agent/orchestrator/loadOrCreateSession.ts:194–195` loads stored conversations and turns as `unknown[]`, then narrows them later when used. This pattern tolerates shape drift but provides no validation of the stored shapes.

The S22 caching enablement (commit 856dcc7) already required a compat-shim for `system: string → TextBlockParam[]` drift, suggesting SDK evolution is an active concern. These casts indicate awareness of the risk but lack explicit shape validation.

**Evidence:**
- `src/agent/orchestrator/index.ts:320` — synthetic message cast
- `src/agent/orchestrator/loadOrCreateSession.ts:194–195` — conversation/turns loaded as `unknown[]`
- `src/app/api/agent/conversation/route.ts:96–97` — same pattern for conversation retrieval
- No corresponding schema or zod validation on the loaded data

**Consequence:**

If SDK message shapes evolve again (e.g., new cache-related token fields, new content block types), the casts will silently accept the new shapes without validation. This could lead to runtime errors or silent data loss if the new fields are critical. The pattern suggests good defensive intent but lacks a validation gate.

**Cross-references:**
- Relates to H-14 (boundary-bug hunt for SDK shape drift) and H-02 (message shape drift).
- Data Layer & Schema scanner should verify whether migrations or tests validate stored message shapes.

---

### QUALITY-004: One console.warn call in src/app/api/agent/confirm/route.ts; logger consistency incomplete

**Severity:** Low

**Description:**

`src/app/api/agent/confirm/route.ts:94` contains `console.warn(...)` instead of using the pino logger. All other service and handler code uses `loggerWith` from `@/shared/logger/pino`. This one call bypasses structured logging and may not appear in log aggregation pipelines.

The codebase is otherwise consistent on logger usage — no other `console.log`, `console.error`, or `console.warn` calls found in `src/` except this one.

**Evidence:**
- Grep search for `console\.` across src/ yields only this one hit in `src/app/api/agent/confirm/route.ts:94`.
- All service files import and use `loggerWith` from pino logger module.

**Consequence:**

Minor observability gap. One warn-level event per session rejection may not aggregate into structured logs. Low impact but reduces consistency.

**Cross-references:**
- Minor; no cross-category impact.

---

### QUALITY-005: Big files (1,300+ LOC) lack intermediate decomposition; bus-factor risk

**Severity:** Medium

**Description:**

Three files exceed 800 LOC and are in critical paths:

1. **`src/agent/orchestrator/index.ts` (1,343 LOC)** — the main agent loop. Lines 1–100 are high-level comments; the actual orchestrator loop, tool dispatcher, onboarding state machine, and error handling are all in this file.
2. **`src/db/types.ts` (2,040 LOC)** — auto-generated Supabase types. Not a maintainability concern (generated), but important for understanding type completeness.
3. **`src/services/accounting/recurringJournalService.ts` (800 LOC)** — handles template creation, approval, rejection, and run generation. The atomicity comment block at lines 31–49 is itself 19 lines describing the multi-step process.

The orchestrator file is the most concerning. Its top comment (lines 1–24) outlines 10 numbered steps of the main loop, but the steps are interspersed throughout the file without clear section markers. A new maintainer reading this file must keep the 10-step model in mind while navigating 1,343 lines.

**Evidence:**
- `src/agent/orchestrator/index.ts` — 1,343 lines with the main loop logic, tool dispatcher, onboarding state machine, and error handling.
- The file's top comment is accurate but does not include intra-file line-number references to each of the 10 steps.
- No exports are prefixed with clear section markers (e.g., `// --- Step 1: loadOrCreateSession ---`).

**Consequence:**

Bus-factor risk: if the maintainer who authored the orchestrator is unavailable, the next person reading it must spend significant time mapping the code structure to the 10-step model. The file is not "unreadable" — the code is well-commented — but intermediate extraction of steps into helper functions or clear section markers would improve onboardability.

This is not a bug, but it is a maintainability concern for Phase 2, where the orchestrator will evolve to support new agent capabilities (mobile approval, multi-turn sessions, etc.).

**Cross-references:**
- Relates to code organization (category definition: "are responsibilities clearly assigned?").

---

### QUALITY-006: ORG_SCOPED_TOOLS hand-maintained Set without automated drift detection

**Severity:** Medium

**Description:**

`src/agent/orchestrator/index.ts:1098–1104` defines a hand-maintained Set of tool names that require a non-null org_id:

```javascript
const ORG_SCOPED_TOOLS = new Set([
  'listChartOfAccounts',
  'checkPeriod',
  'listJournalEntries',
  'postJournalEntry',
  'reverseJournalEntry',
]);
```

When a new tool is added to `src/agent/orchestrator/toolsForPersona.ts`, the ORG_SCOPED_TOOLS set must be manually updated. There is no lint rule or test that verifies the set stays in sync with the actual tools. If a new org-scoped tool is added and the set is not updated, the orchestrator would incorrectly allow the tool to run with `session.org_id = null`, bypassing the org-membership check.

**Evidence:**
- `src/agent/orchestrator/index.ts:1098–1104` — Set defined and guarded at line 1105.
- `src/agent/orchestrator/toolsForPersona.ts:37–77` — tools defined per persona. No automatic mapping to ORG_SCOPED_TOOLS.
- Conventions.md §Permission Catalog Count Drift (lines 110–146) establishes a similar pattern for the permissions catalog and names the verification step explicitly (grep hardcoded counts before merging).

**Consequence:**

Phase 2 obligation risk: when new agent tools are added, the brief-writer must remember to update ORG_SCOPED_TOOLS. Failure is silent at code-review time but would surface as a test failure or runtime error under the right (wrong) org-switch condition. Codifying this in the brief-writer's checklist (like permission-catalog drift) would reduce the risk.

**Cross-references:**
- Relates to conventions.md §Permission Catalog Count Drift; similar pattern but no automated test exists yet.

---

### QUALITY-007: Test naming conventions are assertion-based and grep-friendly; pattern is clean

**Severity:** Low (positive finding)

**Description:**

Test naming in `tests/integration/` follows the assertion-based convention specified in conventions.md. Examples from the codebase:

- `unbalancedJournalEntry.test.ts` — test name mirrors invariant being tested.
- `reversalMirror.test.ts` with test `'rejects a reversal whose lines are NOT the debit/credit mirror of the original'`.
- Test names are predicates, not descriptions: `'post_rejects_unbalanced_entry'` rather than `'should reject unbalanced entries'`.

This is not a finding in the negative sense; it is a positive observation: the test naming convention is well-executed across the ~91 integration test files.

**Evidence:**
- `tests/integration/reversalMirror.test.ts:11–173` — tests named as assertions: `'rejects a reversal whose lines are NOT the debit/credit mirror...'`, `'rejects a reversal with empty reversal_reason...'`, `'accepts a correctly mirrored reversal...'`.
- Grep for `describe\|it(` across test files shows consistent assertion-based naming.

**Consequence:**

Positive: grep-friendly test names make it easy to find specific tests when a feature fails in CI. The convention is working well.

---

### QUALITY-008: Test infrastructure well-organized; globalSetup and loadEnv pattern is clean

**Severity:** Low (positive finding)

**Description:**

`tests/setup/globalSetup.ts` clearly separates test infrastructure (helpers, fixtures, SQL) from production schema. The file's header comment (lines 1–9) explicitly states the design rationale: "Test infrastructure belongs HERE, not in supabase/migrations/." The setup pattern (globalSetup, then setupFiles) is well-documented in vitest.config.ts.

**Evidence:**
- `vitest.config.ts:5–9` — defines globalSetup and setupFiles order.
- `tests/setup/globalSetup.ts:1–12` — header explains the separation.
- No hardcoded `localhost:54321` found in test files; all URLs sourced from environment variables via loadEnv.ts and SUPABASE_TEST_URL fallback chain.

**Consequence:**

Positive: test-to-production schema boundary is clean and explicit. Phase 1.3 schema migration to remote Supabase will require only env-var changes, not code edits across 90+ test files.

---

## Category Summary

**Overall Assessment:**

Code Quality & Maintainability is **solid on type safety and testing patterns** but shows **convention-over-implementation gaps** on CI enforcement. The codebase has strong testing discipline (91 integration tests, clear Category A floor, assertion-based test naming), strict TypeScript settings (`strict: true` in tsconfig.json), and no type assertions (`as any` usage is minimal and justified). However, the lack of ESLint rules for `adminClient` import boundaries and `withInvariants` wrapping means both invariants are convention-only. This is acceptable at Phase 1.2 scale but introduces bus-factor risk as Phase 2 expands the service surface. The one critical organizational gap is `chartOfAccountsService.get()` missing org checks — this is a security boundary gap, not a code-quality gap, but it affects the integrity of the read-path authorization pattern across the codebase.

**Self-audit bias note:** I participated in Phase 1.2 agent architecture design. My familiarity with the orchestrator may have softened the assessment on the large-file maintainability concern. An independent review would likely rate QUALITY-005 (big files) as higher severity for an unfamiliar reader.

**Key signals for synthesis phase:**

1. The hand-maintained ORG_SCOPED_TOOLS set (QUALITY-006) mirrors the permission-catalog-drift pattern codified in conventions.md. This is worth elevating to a Phase 2 brief requirement.
2. The type casts on Anthropic messages (QUALITY-003) are intentional shape-drift tolerance, not bugs. But they warrant an ADR documenting the strategy (cache-related fields may appear; validation is deferred).
3. QUALITY-001 and QUALITY-002 (missing org check, missing lint rule) are structural, not accidental. They reflect a phase-1 pragmatism: convention is sufficient at 55 service calls but becomes risky at 200+.

