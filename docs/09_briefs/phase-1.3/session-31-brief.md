# Session 31 — Path C LT-02 test coverage closure (final session of Path C arc)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S31 is test-coverage closure; sub-item (b) saturation curve uses simulated/replayed conversation per pre-decision (b-α); sub-item (a) agent confirm/reject integration uses fixtures-and-mocks per existing apiAgentConfirm* test precedent).

**Goal:** Close the five LT-02 sub-items per `action-plan.md` and complete Path C arc Gate 5 (final gate). After S31 closes, all five verification-harness gates are green: Gate 1 (MT-05) + Gate 2 (MT-06) at S28; Gate 3 (UF-002 broad-scope wrap) at S29b; Gate 4 (LT-01 + LT-03 + LT-04 + QUALITY-006) at S30; Gate 5 (LT-02 test coverage) here. Phase 2 surface expansion gate unblocks at S31 closeout.

**Architecture (V1 minimal scope):**

- **Sub-item (a) — agent confirm/reject route integration tests.** Closes the "agent confirm-flow integration coverage" Phase 2 obligation flagged at S27 closeout (friction-journal NOTE 2026-04-29 (a-f)). Existing `apiAgentConfirm*` tests cover endpoint-level behaviors (idempotent / not-found / stale); the LT-02(a) gap is the full agent-flow integration that exercises path→service→RPC composed. Closes the `journalEntryService.get` test coverage gap surfaced at S29b brief-creation pre-flight pre-5 (route handler partially covered; integration test exercises the full path).
- **Sub-item (b) — conversation saturation curve characterization.** Simulated/replayed conversation history at turn counts up to 32; verify codebase truncation/rotation behavior (per pre-decision (b-α)). Tests codebase handling of saturation, not model-side behavior under saturation (latter is Phase 2 obligation requiring paid-API budget pre-allocation).
- **Sub-item (c) — cross-org account contamination test.** Attempt to reference an account from org B in org A's journal-entry post; verify rejection. Exercises the S26 QW-05 cross-org trigger (chartOfAccountsServiceCrossOrg + journalLinesCrossOrgAccount substrate at HEAD). Sibling-shape to existing `crossOrgRlsIsolation` test surface; this sub-item closes the journal-entry-line-account-FK-cross-org gap.
- **Sub-item (d) — audit-log PII presence assertions (S25 QW-07 + S28 MT-06 end-to-end).** Verify redaction works: write a `recordMutation` call carrying PII in `before_state` (flat + nested); read the resulting `audit_log` row; assert PII fields are absent. Encodes S28 closeout NOTE category iv naming-asymmetry honestly: `audit_log.before_state` redacts `invited_email`/`phone`/`first_name`/`last_name`/`display_name` (PII_FIELDS const) at any nesting depth (post-S28 redactPii recursive extension); pino logs redact `*.email`/`*.phone`/etc. at depth 1 only (post-S28 single-level pino paths; multi-level pino is Phase 2 per consolidated obligation). Test asserts both layers; documents the asymmetry as load-bearing-substrate not as bug.
- **Sub-item (e) — period-lock date-range enforcement test.** Post journal entries before/after a period's date-range; verify rejection. Exercises the S26 QW-03 rejection. Sibling-shape to existing `lockedPeriodRejection` test (which covers locked-status); this sub-item closes the date-range-enforcement gap (entries with `entry_date` outside the locked period's `start_date..end_date` range).

**Tech stack:** TypeScript, Vitest, Supabase Postgres (real DB via `pnpm db:reset:clean && pnpm db:seed:all` baseline). No new dependencies. No schema changes. No migrations. No orchestrator or prompt edits. **No paid-API spend** (sub-item (b) simulated; sub-item (a) uses existing fixture/mock patterns from apiAgentConfirm* test precedent).

---

**Anchor (parent) SHA:** `7774d25` (S29b execution close — MT-03 Patterns C/E migration via input-shape refactor) chained from `aae6c87` (S29b brief-creation) → `e966f30` (S28 execution close) → `4a3eafb` (S28 brief re-anchor) → `64996b5` (S30 execution close) → `c9fb118` (S30 re-anchor-2) → `595556a` (S30 re-anchor) → `5d58b36` (sibling fix-forward) → `c617f58` (S30 hot-fix execution) → `b4f6063` (S30 hot-fix brief) → `ee35abf` (gitignore) → `53aa533` (S30 brief) → `c47e58d` (S29a closeout) → `bafd4f9` (S29a brief) → corrigendum + arc-summary chain. Verify HEAD's parent matches at Task 1 Step 2.

**Upstream authority:**
- `docs/09_briefs/phase-1.3/path-c-arc-summary.md` — S31 section (lines 247-296); pre-decisions a/b/c/d framing; Gate 5 verification harness specs (lines 802-819); revised dependency graph (S31 sequences after S29b; final session of Path C arc).
- `docs/07_governance/audits/phase-1.2/action-plan.md` — LT-02 verbatim "Done when" criteria; UF-013 + UF-014 closure semantics for the test-coverage facets.
- `docs/09_briefs/phase-1.2/session-19-brief.md` — Soft 9 precedent at commit `13e11f7` (runtime-lookup-by-natural-key pattern for account-balance-touching tests).
- `docs/07_governance/obligations.md` §6 — `accountLedgerService` running-balance fragility sibling pattern (carry-forward; do NOT replicate).
- `tests/integration/apiAgentConfirmIdempotent.test.ts` + `tests/integration/apiAgentConfirmNotFound.test.ts` + `tests/integration/apiAgentConfirmStale.test.ts` + `tests/integration/apiAgentRejectEndpoint.test.ts` — existing partial-coverage at sub-item (a)'s surface; the integration-test gap surfaces above this layer.
- `tests/integration/agentRealClientSmoke.test.ts` — paid-API harness precedent (`describe.skipIf(!HAS_KEY)` pattern). Sub-item (b) does NOT take this path per pre-decision (b-α).
- `tests/integration/lockedPeriodRejection.test.ts` — sibling test for sub-item (e); covers locked-status rejection; gap is date-range-out-of-window rejection.
- `tests/integration/crossOrgRlsIsolation.test.ts` + `tests/integration/chartOfAccountsServiceCrossOrg.test.ts` + `tests/integration/journalLinesCrossOrgAccount.test.ts` — sibling tests for sub-item (c).
- `tests/unit/recordMutationPiiRedaction.test.ts` (post-S28 with 13 cases) — unit-level PII redaction surface; sub-item (d) is the integration-level end-to-end complement (write → read audit_log row).
- `src/services/audit/recordMutation.ts` (post-S28 with recursive `redactPii` to depth 8 + warn-and-continue).
- `src/shared/logger/pino.ts` (post-S28 with 5 PII paths at single-level coverage).
- `src/services/accounting/journalEntryService.ts` (post-S29b: get + post + list all wrapped via withInvariants; input shape `{ org_id, ... }`).
- `src/services/accounting/recurringJournalService.ts` (post-S29b: getTemplate + getRun wrapped via withInvariants; getRun uses join-FK PostgREST embed).
- S28 closeout NOTE (friction-journal tail) — category iv naming-asymmetry; load-bearing for sub-item (d) test design.
- S29b closeout NOTE (friction-journal tail) — sub-finding category v Convention #8 line-cite drift carry-forward (re-confirmed at execution; no fresh codification-graduation).

---

## Session label
`S31-lt-02-test-coverage` — Path C LT-02 test coverage closure across five sub-items (a/b/c/d/e).

## Hard constraints (do not violate)

- **Out of scope:**
  - All Path C MT-03 wrap work (closed at S29a/S29b; Pattern G1 at hot-fix arc).
  - All Path C MT-05/MT-06 observability work (closed at S28).
  - All Path C LT-01/LT-03/LT-04 + QUALITY-006 CI-enforcement cluster (closed at S30).
  - **Phase 2 PII-coverage consolidated obligation** (multi-level pino + financial-PII path depth + PII_FIELDS-vs-pino-paths naming-asymmetry per S28 closeout NOTE category iv) — out of scope; sub-item (d) test ENCODES the asymmetry honestly, does NOT remediate.
  - **Live Anthropic API saturation curve characterization** — Phase 2 obligation requiring paid-API budget pre-allocation; out of S31 scope per pre-decision (b-α).
  - **`accountLedgerService` running-balance fragility remediation** — Phase 2 test-hygiene workstream per `obligations.md` §6; sibling pattern, not absorbed by S31. Sub-item (a)/(c)/(d)/(e) tests MUST NOT replicate the running-balance fragility shape per Hard Constraint A (Soft 9 precedent).
  - **Reactivate-route action-string substrate-bug** (per S30 closeout NOTE element 12) — orthogonal to S31's test-coverage scope; if sub-item (a) integration tests fixture-touch the membership routes, the bug carries forward; S31 does NOT fix it (separate session).
  - **8 LT-03 architectural-surface sites** (per S30 closeout disposition-γ; Phase 2).
  - **CURRENT_STATE.md staleness + "17 invariants" count basis ambiguity** (per S30 LT-01(d) audit inventory; deferred operator decisions).
  - **`getRun` consumer addition** (per S29b OOS; substrate-fidelity-gate firing held; Phase 2 if ever scoped).
  - **QW-06 conversation Zod validation** (Phase 2).
  - **DND-01 / DND-02 / DND-03** (Phase 2 / Path A).
  - Any orchestrator or prompt-text edits.
- **Test posture floor (run-ordinal-dependent per S30 brief re-anchor-2 framing).** `pnpm agent:validate` 26/26 green at HEAD post-edit; if drift surfaces, run `pnpm db:reset:clean && pnpm db:seed:all` to restore clean baseline. Full suite fresh-post-reset baseline at HEAD `7774d25` = 1 failed (`verifyAuditCoverageRoundTrip` orthogonal carry-forward) + 570 passed + 20 skipped (591 total per S29b closeout). Post-S31 edits expected to preserve this baseline plus the deliberate test additions from sub-items (a)-(e). Total expected fresh-run at S31 closeout: 1 failed + (570 + N) passed + 20 skipped, where N ≥ 5 (one or more test cases per sub-item; substrate-grounded final count substrate-confirmed at execution Task 7 Step 5). Halt criteria: drift wrap-attributable to S31's edits → HALT; drift state-pollution-attributable (carry-forward category c per S29a element #19) → DO NOT halt; document.
- **Hard Constraint A — Soft 9 runtime-lookup-by-natural-key pattern (load-bearing).** ANY new test against `accountLedgerService` or any account-balance-touching surface (sub-item (c) cross-org account contamination especially) MUST follow the runtime-lookup-by-natural-key pattern (Soft 9 precedent at S19, commit `13e11f7`) rather than hardcoded UUIDs (Soft 8 precedent). Replicating the running-balance fragility shape is a hard-veto-at-review condition. Tests look up account IDs by `account_code` + `org_id` at fixture-setup time; do NOT bake account UUIDs into test fixtures.
- **Hard Constraint B — No paid-API spend.** Sub-item (b) saturation curve uses simulated/replayed conversation history (free); sub-item (a) agent confirm/reject integration tests use existing fixture/mock patterns from `apiAgentConfirm*` test precedent (mocks `buildServiceContext` + uses `adminClient` for direct DB setup; no Anthropic API call). If any sub-item drifts toward paid-API surface during execution, halt and surface for operator decision (Phase 2 paid-API budget pre-allocation territory; not S31 scope).
- **Hard Constraint C — Sub-item (d) PII naming-asymmetry honest encoding.** Test must encode the substrate-coherent existing pattern: `audit_log.before_state` redacts `PII_FIELDS = ['invited_email', 'phone', 'first_name', 'last_name', 'display_name']` recursively (post-S28 depth-8 + warn-and-continue); pino `REDACT_CONFIG.paths` redacts `*.email`/`*.phone`/`*.first_name`/`*.last_name`/`*.display_name` at single-level only (post-S28; multi-level deferred to Phase 2 per S28 closeout NOTE category iv). Test asserts both layers; documents the asymmetry in test-file header as load-bearing-substrate not bug. NO remediation of the asymmetry at S31 (Phase 2 consolidated obligation).
- **Hard Constraint D — No schema changes.** S31 is test-additions only. No migration files. No type regeneration. No service-layer behavior changes (the post-S29a + S29b + S28 + S30 substrate is the test target).
- **Hard Constraint E — Y2 commit shape (single bundled by default).** Y2 split available if Commit 1 net diff > 400 lines OR if any sub-item surfaces (γ)-rhythm scope-amend > 50 lines of pre-existing-test rewrite (substrate-fidelity-gate firing at execution cadence; would advance (γ)-rhythm scope-amend codification candidate from N=2 to N=3, graduating). Operator's call at execution; brief encodes guidance not fixed split.
- **No SHA self-reference** in commit body or NOTE body per S29a element #1 + S28 closeout fix-forward precedent.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight against HEAD `7774d25`. Re-verify at execution time before edit; halt on any drift. Carry-forward category v line-cite drift (per S28 closeout NOTE) is illustrative-of-known-drift, not load-bearing claims.
- **Grep-stable anchors locked.**
  - Sub-item (a): existing `apiAgentConfirm*` test precedent for fixture/mock pattern; `journalEntryService.post` + `.get` post-S29b wrapped exports.
  - Sub-item (b): no existing test surface (fresh test file); fixture-built conversation history.
  - Sub-item (c): `chartOfAccountsServiceCrossOrg` + `journalLinesCrossOrgAccount` precedents; QW-05 trigger at journal_entries insert path.
  - Sub-item (d): `recordMutation` post-S28 + `redactPii` recursive; `pino REDACT_CONFIG.paths` post-S28 single-level; `PII_FIELDS` const post-S28.
  - Sub-item (e): `lockedPeriodRejection` precedent for fixture pattern; QW-03 trigger at journal_entries insert path with date-range filter.

---

## Pre-decisions enumerated

What's decided at brief-write per operator-delegated recommendation at brief-creation pre-flight (do not re-litigate at execution time):

1. **(a-α) Test pattern discipline — Soft 9 runtime-lookup-by-natural-key as Hard Constraint A.** Ratified verbatim per arc-summary's pre-decision (a) framing. Account-balance-touching tests use natural-key lookups (account_code + org_id); no hardcoded UUIDs. Honors Soft 9 precedent at S19 commit `13e11f7`; sibling pattern to `obligations.md` §6's `accountLedgerService` running-balance fragility (Phase 2; do NOT replicate shape).

2. **(b-α) Saturation curve — simulated/replayed (free).** Fixture-based conversation history at turn counts up to 32; tests codebase truncation/rotation behavior, not model-side behavior under saturation. Saves $10-30 per run; preserves zero-paid-API-spend posture for S31. Live API saturation curve characterization for product reasons (model behavior under load) is Phase 2 obligation requiring paid-API budget pre-allocation; out of S31 scope.

3. **(c-α) Sub-item ordering — all five independent under (b-α) decision.** Default execution order: (e) period-lock → (c) cross-org account → (d) audit-log PII → (b) saturation curve → (a) agent confirm/reject. Rationale: complexity-ascending; cheapest/most-isolated first; agent-flow last in case it surfaces orthogonal substrate (e.g., reactivate-route bug fixture-touching; S30 closeout element 12 carry-forward).

4. **(d-α) Y2 split-trigger threshold — net diff > 400 lines OR (γ)-rhythm scope-amend > 50 lines of pre-existing-test rewrite.** Operator confirms at execution time; brief encodes guidance not fixed split. The 400-line threshold = roughly 5 sub-items × ~80 lines each; below that, single-commit Y2 is the default. (γ)-rhythm scope-amend trigger advances the codification candidate from N=2 to N=3 (graduates per Documentation Routing convention's N=3 threshold) if firings surface at execution cadence.

5. **Estimated session duration: ~2-3 days** (largest Path C item per arc-summary). Task 0 substrate-confirm (~30 min) + sub-item (e) period-lock (~3 hours) + sub-item (c) cross-org account (~3 hours) + sub-item (d) audit-log PII (~3 hours; encodes naming-asymmetry honestly) + sub-item (b) saturation curve (~4 hours; fixture-based but new test surface from scratch) + sub-item (a) agent confirm/reject integration (~5 hours; closes journalEntryService.get test coverage gap; full path→service→RPC composition) + full-suite regression (~30 min) + friction-journal NOTE drafting (~1 hour) + review buffer.

OPEN — operator to resolve before / during S31 execution: _none ratified at brief-creation_. All four arc-summary pre-decisions ratified to (a-α) / (b-α) / (c-α) / (d-α) at brief-creation per substrate-grounded analysis.

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| S31-LT-02-a | UF-013 (test coverage) | `tests/integration/apiAgentConfirmFullFlow.test.ts` (NEW; or shape-equivalent name) | Test exercises full path→service→RPC composition: agent confirm endpoint receives a dry-run journal-entry-handle; route handler calls `journalEntryService.post` (post-S29a wrapped); RPC `write_journal_entry_atomic` invoked; audit_log row written; full transaction commits. Closes journalEntryService.get test coverage gap (S29b pre-flight pre-5) by exercising .get post-confirm to verify the returned shape. | New test file passes; agent:validate 26/26 unchanged. | Gate 5: LT-02a-confirm-reject-routes |
| S31-LT-02-b | UF-013 (test coverage) | `tests/integration/agentSaturationCurve.test.ts` (NEW) | Test fixtures synthetic conversation history at turn counts 8/16/24/32; injects via `agent_sessions.conversation` JSONB column; invokes orchestrator's truncation/rotation logic via direct entry-point or simulated handleUserMessage; asserts truncation behavior at each turn count. Per pre-decision (b-α): NO live Anthropic API call; replay shape only. | New test file passes; full-suite green; pnpm test agentSaturationCurve clean. | Gate 5: LT-02b-saturation-curve |
| S31-LT-02-c | UF-013 (test coverage) | `tests/integration/crossOrgAccountContamination.test.ts` (NEW) | Test posts journal entry in org A referencing an account UUID from org B; verify rejection via S26 QW-05 cross-org trigger (PostgreSQL-level; bubbles up to ServiceError). Hard Constraint A applies: account UUIDs looked up at fixture-setup via account_code + org_id natural key. | New test file passes; full-suite green. | Gate 5: LT-02c-cross-org-account |
| S31-LT-02-d | UF-010 (audit_log PII surface) + UF-013 | `tests/integration/auditLogPiiRedactionEndToEnd.test.ts` (NEW) | Test invokes a service mutation (e.g., invitationService.inviteUser or a simpler one) carrying PII in before_state (flat + nested at depth 4); reads the resulting audit_log row directly via adminClient; asserts PII_FIELDS-redacted recursively. Encodes Hard Constraint C honest naming-asymmetry: tests audit_log.before_state for `invited_email` redaction (in PII_FIELDS) but does NOT test for `email` redaction (NOT in PII_FIELDS; documents the asymmetry as Phase 2 obligation per S28 closeout NOTE category iv). | New test file passes; full-suite green; pnpm test auditLogPiiRedaction clean. | Gate 5: LT-02d-audit-log-pii |
| S31-LT-02-e | UF-013 + period-lock surface | `tests/integration/periodLockDateRangeRejection.test.ts` (NEW) | Test posts journal entry with entry_date BEFORE period.start_date; verify rejection. Posts journal entry with entry_date AFTER period.end_date; verify rejection. Posts journal entry with entry_date INSIDE range; verify success. Exercises S26 QW-03 rejection path. Sibling-shape to `lockedPeriodRejection` (which covers locked-status, not date-range). | New test file passes; full-suite green. | Gate 5: LT-02e-period-lock-date-range |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S31-lt-02-test-coverage
export COORD_SESSION='S31-lt-02-test-coverage'
cat .coordination/session-lock.json
```

Verify lock present with COORD_SESSION matching.

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit is the S31 brief-creation commit (single file: `docs/09_briefs/phase-1.3/session-31-brief.md`); parent is `7774d25` (S29b execution close); grandparent is `aae6c87` (S29b brief-creation). If any drift, halt and surface to operator.

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

---

## Task 2: Convention #8 verify-directly + sub-pre-flight

Re-verify pre-flight findings at execution-time substrate. Halt on drift before touching code.

- [ ] **Step 1: Sub-shape #1 — existing test surfaces locate**

```bash
ls tests/integration/ | grep -iE "agent.*confirm|reject|crossOrg|auditPii|periodLock|saturation"
```

Expected: `apiAgentConfirm*` (3 files) + `apiAgentRejectEndpoint.test.ts` + `crossOrgRlsIsolation.test.ts` + `chartOfAccountsServiceCrossOrg.test.ts` + `journalLinesCrossOrgAccount.test.ts` + `lockedPeriodRejection.test.ts` (existing partial surfaces); NO existing `*saturation*` or `*auditLogPii*EndToEnd*` test files (LT-02 sub-items (b) + (d) are fresh).

- [ ] **Step 2: Sub-shape #1 — post-S29a/S28/S30/S29b substrate confirms**

```bash
grep -nE "^export const journalEntryService|^export const recurringJournalService" src/services/accounting/journalEntryService.ts src/services/accounting/recurringJournalService.ts
grep -nE "withInvariants\(get\)|withInvariants\(getTemplate\)|withInvariants\(getRun\)" src/services/accounting/
grep -nE "REDACT_DEPTH_LIMIT|warn-and-continue" src/services/audit/recordMutation.ts
grep -nE "^const PII_FIELDS|^export const PII_FIELDS" src/services/audit/recordMutation.ts
```

Expected: 2 export object hits; 3 wrap hits at C/E sites (post-S29b); 1 REDACT_DEPTH_LIMIT (post-S28); PII_FIELDS const at recordMutation.ts:19-26 (carry-forward line-cite drift category v).

- [ ] **Step 3: Sub-shape #2 — Soft 9 runtime-lookup-by-natural-key pattern reference**

Read `docs/09_briefs/phase-1.2/session-19-brief.md` Soft 9 section to refresh the pattern. The pattern shape: at fixture-setup, query `chart_of_accounts` table for `WHERE org_id = ? AND account_code = ?` to resolve account IDs at runtime; never hard-code account UUIDs in test fixtures.

- [ ] **Step 4: Sub-shape #3 — paid-API harness precedent NOT taken**

```bash
grep -n "skipIf(!HAS_KEY)" tests/integration/agentRealClientSmoke.test.ts
```

Expected: 1 hit (the `describe.skipIf(!HAS_KEY)` pattern). Sub-item (b) does NOT take this path per pre-decision (b-α). NEW saturation test runs unconditionally with simulated history.

- [ ] **Step 5: Sub-shape #4 — full-suite carry-forward state pre-edit**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -5
```

Expected: 26/26 green. If drift, halt and surface — agent:validate is the test-posture-floor pre-condition.

If any sub-shape surfaces drift beyond expectations, halt and surface for substrate-re-derivation.

---

## Task 3: Sub-item (e) — period-lock date-range rejection

- [ ] **Step 1: Read existing `lockedPeriodRejection.test.ts` for fixture pattern**

Existing test covers locked-status rejection. Sub-item (e) sibling-shape covers date-range-out-of-window.

- [ ] **Step 2: Create `tests/integration/periodLockDateRangeRejection.test.ts`**

Three test cases:
- (i) Post entry with `entry_date` before `period.start_date` → expect rejection (S26 QW-03 trigger).
- (ii) Post entry with `entry_date` after `period.end_date` → expect rejection.
- (iii) Post entry with `entry_date` inside range → expect success.

Hard Constraint A: account IDs looked up via natural-key (account_code + org_id) at fixture-setup; no hardcoded UUIDs.

- [ ] **Step 3: Run new test file**

```bash
pnpm test periodLockDateRangeRejection 2>&1 | tail -10
```

Expected: 3/3 green.

---

## Task 4: Sub-item (c) — cross-org account contamination

- [ ] **Step 1: Read existing `chartOfAccountsServiceCrossOrg.test.ts` + `journalLinesCrossOrgAccount.test.ts` for fixture patterns**

These cover the account-side cross-org checks. Sub-item (c) closes the journal-entry-line-account-FK-cross-org gap end-to-end.

- [ ] **Step 2: Create `tests/integration/crossOrgAccountContamination.test.ts`**

Test case: post a journal entry in org A whose line references an account UUID from org B. Account UUIDs looked up at fixture-setup via natural-key (org_id + account_code). Expect rejection via the database-level cross-org trigger (S26 QW-05). Bubble-up should surface as ServiceError.

Hard Constraint A applies.

- [ ] **Step 3: Run new test file**

```bash
pnpm test crossOrgAccountContamination 2>&1 | tail -10
```

Expected: green.

---

## Task 5: Sub-item (d) — audit-log PII redaction end-to-end

- [ ] **Step 1: Read existing `tests/unit/recordMutationPiiRedaction.test.ts` (post-S28)**

13 unit-level cases covering flat + nested + array + depth-limit. Sub-item (d) is the integration-level complement: end-to-end through a real recordMutation call writing to the audit_log table.

- [ ] **Step 2: Create `tests/integration/auditLogPiiRedactionEndToEnd.test.ts`**

Test cases:
- (i) Invoke a service mutation that calls recordMutation with PII in before_state (e.g., invitationService.inviteUser or revokeInvitation). Read the resulting audit_log row via adminClient. Assert before_state has PII_FIELDS redacted.
- (ii) Invoke a service mutation with NESTED PII at depth 4 (e.g., synthesize a before_state with `{ a: { b: { c: { invited_email: 'leak@example.com' } } } }` if the codebase has a mutation that captures complex nested before_state; otherwise construct a synthetic test that exercises the recursive redaction via a custom recordMutation call). Assert nested PII redacted recursively.
- (iii) **Naming-asymmetry honest encoding (Hard Constraint C):** Test that `email` field is NOT redacted (NOT in PII_FIELDS); document this assertion in the test-file header as Phase 2 obligation per S28 closeout NOTE category iv. Same for pino-side: assert `*.email` redacts at single-level only (depth 1) — multi-level pino redaction is Phase 2.

The (iii) test is INTENTIONAL substrate-honesty: it pins the current asymmetry as a regression-guard. When Phase 2 closes the consolidated PII obligation, the test inverts to positive.

- [ ] **Step 3: Run new test file**

```bash
pnpm test auditLogPiiRedactionEndToEnd 2>&1 | tail -10
```

Expected: all cases green; the naming-asymmetry assertion passes (substrate-coherent existing pattern).

---

## Task 6: Sub-item (b) — conversation saturation curve

- [ ] **Step 1: Substrate-grep orchestrator's truncation/rotation entry-point**

```bash
grep -nE "truncate|rotate|conversation.*length|context.*window" src/agent/orchestrator/index.ts | head -10
```

Capture the truncation/rotation logic location; saturation curve test fixtures conversation history through this layer.

- [ ] **Step 2: Create `tests/integration/agentSaturationCurve.test.ts`**

Test cases at turn counts 8 / 16 / 24 / 32:
- (i) Construct synthetic conversation history (alternating user/assistant turns; each turn ~500 chars to stay below tokens-per-turn realism).
- (ii) Persist via `agent_sessions.conversation` JSONB or pass directly to the truncation entry-point (substrate-decide at execution).
- (iii) Invoke truncation/rotation; assert truncation behavior matches expected (e.g., oldest-turns-first dropped; system-message preserved; MT-04 cross-turn caching hooks fire if any).

NO live Anthropic API call per pre-decision (b-α). Replay-only.

- [ ] **Step 3: Run new test file**

```bash
pnpm test agentSaturationCurve 2>&1 | tail -10
```

Expected: all cases green.

---

## Task 7: Sub-item (a) — agent confirm/reject full-flow integration

- [ ] **Step 1: Read existing `apiAgentConfirm*` tests for fixture/mock pattern**

Existing tests cover endpoint-level behaviors via `vi.mock('@/services/middleware/serviceContext', ...)` + `adminClient` direct DB setup. The LT-02(a) gap is the FULL agent flow: dry_run write → confirm endpoint → service layer → RPC → audit_log.

- [ ] **Step 2: Create `tests/integration/apiAgentConfirmFullFlow.test.ts`**

Test case: full path→service→RPC composition.
- Dry-run a journal-entry post (writes to ai_actions with dry_run=true).
- POST /api/agent/confirm with the dry-run handle.
- Assert: 200 response; journal_entries row written; audit_log row written; full transaction committed.
- Re-call confirm; assert idempotency (existing `apiAgentConfirmIdempotent` precedent).
- ALSO: post-confirm, call `journalEntryService.get({ org_id, journal_entry_id })` (post-S29b wrapped) to verify the returned shape closes the journalEntryService.get test coverage gap (S29b pre-flight pre-5).

Hard Constraint A: account IDs via natural-key.

- [ ] **Step 3: Substrate-bug awareness check**

The reactivate-route action-string substrate-bug (S30 closeout NOTE element 12) is at `src/app/api/orgs/[orgId]/users/[userId]/reactivate/route.ts:23` (action: 'user.suspend' instead of 'user.reactivate'). If this test fixture-touches the membership-service routes (unlikely for sub-item (a)'s confirm-flow scope), the bug carries forward; do NOT fix it at S31 (separate session).

- [ ] **Step 4: Run new test file**

```bash
pnpm test apiAgentConfirmFullFlow 2>&1 | tail -10
```

Expected: all cases green.

---

## Task 8: Full-suite regression

- [ ] **Step 1: Sub-pre-flight existing-test non-breakage**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green.

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 3: lint (LT-01(b) rule unchanged)**

```bash
pnpm lint src/services/ 2>&1 | grep "services/withInvariants-wrap-or-annotate" | head -5
```

Expected: zero rule violations. S31 doesn't touch service files; LT-01(b) state at HEAD is unchanged.

```bash
grep -rn "// withInvariants: skip-org-check" src/services/ | wc -l
```

Expected: 32 (S29b post-state).

- [ ] **Step 4: full vitest suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: 1 failed (verifyAuditCoverageRoundTrip orthogonal carry-forward) + (570 + N) passed + 20 skipped, where N is the substrate-confirmed total of new test cases added across sub-items (a)-(e). Pre-flight estimate: 5 sub-items × ~3 cases each = ~15 new cases; expected total ~585 passed + 1 failed + 20 skipped (606).

If full-suite drift wrap-attributable to S31's edits → HALT. State-pollution-attributable (carry-forward category c per S29a element #19) → DO NOT halt; document in NOTE.

---

## Task 9: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. Three required elements + sub-finding categories:

1. **LT-02 closure citation + Path C arc closeout citation** — cite specific surfaces closed: 5 sub-items closed (a/b/c/d/e); LT-02 closes Gate 5; **all five Path C verification-harness gates green at this commit** (Gate 1 + Gate 2 at S28 e966f30; Gate 3 at S29b 7774d25; Gate 4 at S30 64996b5; Gate 5 here). Path C arc closes; Phase 2 surface expansion gate unblocks.

2. **Test pattern discipline outcomes per sub-item** — record per-sub-item: (a) Soft 9 pattern applied; (b) simulated/replayed not paid; (c) Hard Constraint A applied; (d) naming-asymmetry honest encoding; (e) date-range coverage closed.

3. **Sub-findings surfaced at execution.** Categories include:

   i. **(γ)-rhythm scope-amend at execution cadence,** if any. If any sub-item surfaces > 50 lines of pre-existing-test rewrite, that's a (γ)-rhythm firing — codification candidate advances N=2 → N=3 (graduates per Documentation Routing convention's N=3 threshold).

   ii. **PII-coverage consolidated obligation re-confirmation.** Sub-item (d) test pins the post-S28 naming-asymmetry as substrate-coherent existing pattern; encodes the Phase 2 obligation as load-bearing-substrate, not bug.

   iii. **journalEntryService.get test coverage gap closure.** Sub-item (a) closes the gap surfaced at S29b brief-creation pre-flight pre-5.

   iv. **Carry-forward drift on full-suite run.** Document any drift; classify state-pollution-attributable vs S31-edit-attributable.

   v. **Convention #8 verify-directly drift on cited file/line numbers** (carry-forward shape from S28 + S29b closeout NOTEs category v); fold under S29a element #3.

   vi. **Y2 split status.** Single bundled commit (default) OR Y2-split if pre-decision (d-α) threshold tripped.

   vii. **Path C arc closure outcomes.** UF-002, UF-006, UF-008, UF-010, UF-013, UF-014, QUALITY-006 all closed across the arc. Anything observed about the arc's discipline-shape in retrospect.

   viii. **Anything else surfaced at execution that doesn't fit existing categories.**

Per S29a element #1 + S28 closeout fix-forward precedent: NO SHA self-reference in commit body or NOTE body.

- [ ] **Step 2: Stage all changes**

```bash
git add tests/integration/periodLockDateRangeRejection.test.ts \
        tests/integration/crossOrgAccountContamination.test.ts \
        tests/integration/auditLogPiiRedactionEndToEnd.test.ts \
        tests/integration/agentSaturationCurve.test.ts \
        tests/integration/apiAgentConfirmFullFlow.test.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 6 files staged (5 new test files + friction-journal). No untracked files outside this set.

If Y2-split applies (per pre-decision (d-α) threshold), stage Commit 1 = test additions only; Commit 2 = friction-journal NOTE only.

- [ ] **Step 3: Commit**

Subject (under 70 chars): `test(coverage): S31 LT-02 closure across five sub-items (Path C arc close)`

Body covers:
- Sub-item (a) closure: agent confirm/reject full-flow integration.
- Sub-item (b) closure: saturation curve simulated/replayed (zero paid-API spend per pre-decision (b-α)).
- Sub-item (c) closure: cross-org account contamination via Hard Constraint A natural-key pattern.
- Sub-item (d) closure: audit-log PII redaction end-to-end with naming-asymmetry honest encoding (Phase 2 obligation per S28 closeout NOTE category iv).
- Sub-item (e) closure: period-lock date-range enforcement (3 cases).
- Path C arc Gate 5 closed; all five gates green at this commit; Phase 2 surface expansion unblocks.
- UF-013 + UF-014 (test-coverage facets) + UF-010 (audit_log surface end-to-end) closed.
- Y2 commit shape: single bundled (default) OR Y2-split (per pre-decision (d-α) at execution).
- No SHA self-reference per S29a element #1 + S28 closeout fix-forward precedent.

Do NOT include `Co-Authored-By` unless operator-confirmed at closeout.

- [ ] **Step 4: Verify final commit family**

```bash
git log --oneline -3
```

Expected: most recent commit is the S31 execution commit; parent is the S31 brief-creation commit; grandparent is `7774d25` (S29b execution).

- [ ] **Step 5: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the S31 commit SHA.

- [ ] **Step 6: Session end**

```bash
bash scripts/session-end.sh
```

Lock release; COORD_SESSION unset.

- [ ] **Step 7: Surface S31 closeout to operator**

Single message summarizing:
- Commit SHA(s) (1 if single bundled; 2 if Y2-split).
- Path C arc Gate 5 closure + all five gates green at this commit.
- Sub-item (a)-(e) closure summaries.
- Sub-finding outcomes recorded in friction-journal NOTE.
- Codification candidate state changes at S31 closeout.
- **Path C arc closes; Phase 2 surface expansion gate unblocks.** Operator pivots to Phase 2 brief-creation OR Path A (deployment readiness) per the broader phase-1.3 plan.

---

## Verification harness alignment

This brief's exit-criteria map 1:1 to the Path C arc-summary verification harness Gate 5. At S31 closeout, the harness's mechanical checks for Gate 5 should fire green:

**Gate 5: LT-02 test coverage closed (five sub-items)**
- `LT-02a-confirm-reject-routes` — full agent confirm-flow integration test exists at `tests/integration/apiAgentConfirmFullFlow.test.ts`.
- `LT-02b-saturation-curve` — saturation curve test exists at `tests/integration/agentSaturationCurve.test.ts`; turn counts 8/16/24/32 covered; simulated/replayed (no paid API).
- `LT-02c-cross-org-account` — cross-org account contamination test exists at `tests/integration/crossOrgAccountContamination.test.ts`; Hard Constraint A applied.
- `LT-02d-audit-log-pii` — audit-log PII end-to-end test exists at `tests/integration/auditLogPiiRedactionEndToEnd.test.ts`; naming-asymmetry honest encoding per Hard Constraint C.
- `LT-02e-period-lock-date-range` — date-range enforcement test exists at `tests/integration/periodLockDateRangeRejection.test.ts`; 3 cases (before/inside/after).

**All five Path C arc gates at S31 closeout:**
- Gate 1 (MT-05 audit-emit observability): closed at S28 (`e966f30`).
- Gate 2 (MT-06 PII redaction): closed at S28 (`e966f30`).
- Gate 3 (UF-002 broad-scope wrap): closed at S29b (`7774d25`).
- Gate 4 (LT-01 + LT-03 + LT-04 + QUALITY-006): closed at S30 (`64996b5`).
- Gate 5 (LT-02 test coverage): closes here.

Path C arc closes; Phase 2 surface expansion gate unblocks.

---

## Friction-journal NOTE plan

Element 1 (LT-02 closure citation + Path C arc closeout) + Element 2 (test pattern discipline outcomes per sub-item) + Element 3 (sub-findings i-viii per Task 9 Step 1) per the brief's NOTE plan.

Codification candidates ledger at S31 brief-creation:
- Substrate-fidelity-gate (graduated S30 N=∞; continuing-firings at brief-creation pre-flight cadence at S31)
- Resolved-decision-citation as contract (graduated S30 N=3)
- Orphan-reference-review at edit-completion (graduated S28 re-anchor N=3)
- Reconciliation-scope-derivation as substrate-completeness gate (graduated S29b parent-shape N=3; codification-fire element captured at S29b execution closeout)
- (γ)-rhythm scope-amend (N=2; graduates if S31 sub-item surfaces > 50 lines of pre-existing-test rewrite per pre-decision (d-α))
- Read-completeness-threshold (N=2; held)
- Library-documentation-vs-integrated-behavior-divergence (N=1)
- Brief-spec-vs-arc-precedent-substrate-conflict (N=1)
- Existence-leak-prevention-as-error-code-contract (N=1; ratified S29b)
- Stash-revert isolation (N=2; held)
- Action-string-substrate-drift (N=1; observation-only)

---

## Out-of-scope explicit list (recap for executor reference)

1. **Phase 2 PII-coverage consolidated obligation** (multi-level pino + financial-PII path depth + PII_FIELDS-vs-pino-paths naming-asymmetry per S28 closeout NOTE category iv) — sub-item (d) test ENCODES the asymmetry honestly, does NOT remediate.
2. **Live Anthropic API saturation curve characterization** — Phase 2 obligation requiring paid-API budget pre-allocation; out of S31 per pre-decision (b-α).
3. **`accountLedgerService` running-balance fragility remediation** — Phase 2 test-hygiene workstream per `obligations.md` §6; sibling pattern, not absorbed by S31.
4. **Reactivate-route action-string substrate-bug** (per S30 closeout NOTE element 12) — orthogonal; separate fix; carries forward.
5. **8 LT-03 architectural-surface sites** (per S30 closeout disposition-γ; Phase 2).
6. **CURRENT_STATE.md staleness + "17 invariants" count basis ambiguity** (deferred operator decisions).
7. **`getRun` consumer addition** (per S29b OOS; Phase 2 if ever scoped).
8. **QW-06 conversation Zod validation** (Phase 2).
9. **DND-01 / DND-02 / DND-03** (Phase 2 / Path A).
10. **MT-02 canvas refresh + MT-04 conversation rotation observability** (Phase 2; sequences with cross-turn caching).
11. **`audit_log` table rebuild for historical-PII scrub** (architecturally infeasible per append-only triggers; Phase 2 if ever scoped).
12. Any orchestrator or prompt-text edits.

Items 1, 2, 3, 4, 7 are particularly likely to surface as confused-scope at execution time; the executor should decline scope expansion and surface for operator decision rather than proceeding.
