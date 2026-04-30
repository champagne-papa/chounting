# Session 31 — Path C LT-02 test coverage closure (final session of Path C arc)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S31 is test-coverage closure; sub-item (b) boundary-not-overflow test uses mocked callClaude per pre-decision (b-α); sub-item (a) `journalEntryService.get` coverage uses existing fixture/mock patterns).

**Goal:** Close the five LT-02 sub-items per `action-plan.md` and complete Path C arc Gate 5 (final gate). After S31 closes, all five verification-harness gates are green: Gate 1 (MT-05) + Gate 2 (MT-06) at S28; Gate 3 (UF-002 broad-scope wrap) at S29b; Gate 4 (LT-01 + LT-03 + LT-04 + QUALITY-006) at S30; Gate 5 (LT-02 test coverage) here. Phase 2 surface expansion gate unblocks at S31 closeout.

**Architecture (V1 minimal scope; post-re-anchor substrate-honest amendments):**

- **Sub-item (a) — `journalEntryService.get` post-S29b-wrapped coverage gap.** NARROW SCOPE per AMENDMENT 1: substrate at HEAD `7774d25` shows CA-61 (`apiAgentConfirmIdempotent.test.ts`) already covers full path→service→RPC composition through agent confirm flow with idempotency replay; the original brief's framing was substrate-stale. The narrow real gap is `journalEntryService.get` post-S29b-wrapped (S29b pre-flight pre-5 finding). New test file `tests/integration/journalEntryServiceGet.test.ts` covers same-org / cross-org / not-found cases.
- **Sub-item (b) — conversation length boundary-not-overflow test.** REFRAMED per AMENDMENT 2: orchestrator main-loop step 5 explicitly comments "Conversation truncation — full history" — NO truncation/rotation logic at HEAD; testing truncation behavior tests behavior that doesn't exist. Substrate-honest reframe: test boundary-not-overflow — verify orchestrator handles 32-turn full-history without breaking (memory, persistence, mock-callClaude pass-through). New test file `tests/integration/agentConversationLengthBoundary.test.ts`. NO live Anthropic API call (mocked callClaude per pre-decision (b-α)). When Phase 2 ships truncation infrastructure, this test inverts to truncation-curve characterization.
- **Sub-item (c) — coverage-sufficiency-verification of CA-28 + chartOfAccountsServiceCrossOrg.** REFRAMED per AMENDMENT 3: substrate at HEAD shows CA-28 (`journalLinesCrossOrgAccount.test.ts`) covers cross-org account contamination via FK trigger; `chartOfAccountsServiceCrossOrg.test.ts` covers service-layer side. Substrate-substantially duplicate. No new test file at S31 scope; substrate-record NOTE entry produced at execution closeout. Per Hard Constraint F: halt-and-surface if sufficiency-verification surfaces a substrate-real gap.
- **Sub-item (d) — audit-log nested-PII redaction integration.** NARROW SCOPE per AMENDMENT 4: substrate at HEAD shows CA-15 (`userProfileAudit.test.ts`) covers integration-level flat-PII redaction end-to-end via `userProfileService.updateProfile`. The narrow real gap is post-S28 nested-PII recursion at integration level (unit-level coverage at `recordMutationPiiRedaction.test.ts` exists). New test file `tests/integration/auditLogNestedPiiRedaction.test.ts`. Naming-asymmetry honest encoding preserved per Hard Constraint C (audit_log redacts `invited_email` recursively; pino paths redact `*.email` at depth-1 only; multi-level pino is Phase 2 per consolidated obligation).
- **Sub-item (e) — coverage-sufficiency-verification of CA-27.** REFRAMED per AMENDMENT 5: substrate at HEAD shows CA-27 (`journalEntryPeriodDateRange.test.ts`) covers all 3 cases the original brief specified (before-start rejection + after-end rejection + in-range success) plus DB-trigger coverage and on-boundary inclusivity; uses Soft 9 natural-key pattern. Substrate-substantially duplicate. No new test file at S31 scope; substrate-record NOTE entry produced at execution closeout. Per Hard Constraint F: halt-and-surface if sufficiency-verification surfaces a substrate-real gap.

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
- **Hard Constraint B — No paid-API spend.** Sub-item (b) boundary-not-overflow test uses mocked callClaude (replay-only; explicit anti-precedent cite of `agentRealClientSmoke.test.ts skipIf(!HAS_KEY)` — sub-item (b) test runs unconditionally with mocked callClaude); sub-item (a) `journalEntryService.get` coverage uses existing fixture/mock patterns (`buildServiceContext` mock + `adminClient` direct DB setup; no Anthropic API call). If any sub-item drifts toward paid-API surface during execution, halt and surface for operator decision (Phase 2 paid-API budget pre-allocation territory; not S31 scope).
- **Hard Constraint C — Sub-item (d) PII naming-asymmetry honest encoding.** Test must encode the substrate-coherent existing pattern: `audit_log.before_state` redacts `PII_FIELDS = ['invited_email', 'phone', 'first_name', 'last_name', 'display_name']` recursively (post-S28 depth-8 + warn-and-continue); pino `REDACT_CONFIG.paths` redacts `*.email`/`*.phone`/`*.first_name`/`*.last_name`/`*.display_name` at single-level only (post-S28; multi-level deferred to Phase 2 per S28 closeout NOTE category iv). Test asserts both layers; documents the asymmetry in test-file header as load-bearing-substrate not bug. NO remediation of the asymmetry at S31 (Phase 2 consolidated obligation).
- **Hard Constraint D — No schema changes.** S31 is test-additions only. No migration files. No type regeneration. No service-layer behavior changes (the post-S29a + S29b + S28 + S30 substrate is the test target).
- **Hard Constraint E — Y2 commit shape (single bundled by default).** Y2 split available if Commit 1 net diff > 200 lines (lower threshold than original 400 since post-amendment surface is materially smaller; ~3 new test files + 2 substrate-record NOTE entries + 1 friction-journal NOTE; estimated ~150-200 lines total) OR if any sub-item's coverage-sufficiency-verification surfaces a substrate-real gap requiring scope-expansion in-flight (substrate-fidelity-gate firing at execution cadence; would advance (γ)-rhythm scope-amend codification candidate from N=2 to N=3, graduating). Operator's call at execution; brief encodes guidance not fixed split.
- **Hard Constraint F — Post-amendment substrate-discipline.** Sub-items (c) + (e) coverage-sufficiency-verification produces substrate-record (NOTE entry) at S31 execution closeout; does NOT silently expand to fresh-test-creation if existing-test-coverage holds. Halt-and-surface to operator if a substrate-real gap surfaces during sufficiency-verification; do NOT scope-creep into in-flight test-creation without operator ratification. Per AMENDMENT 7's pre-flight delta-inventory pattern propagation; honors substrate-honest scope at execution.
- **No SHA self-reference** in commit body or NOTE body per S29a element #1 + S28 closeout fix-forward precedent.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight against HEAD `7774d25`. Re-verify at execution time before edit; halt on any drift. Carry-forward category v line-cite drift (per S28 closeout NOTE) is illustrative-of-known-drift, not load-bearing claims.
- **Grep-stable anchors locked.**
  - Sub-item (a): existing `apiAgentConfirm*` test precedent for fixture/mock pattern; `journalEntryService.post` + `.get` post-S29b wrapped exports.
  - Sub-item (b): no existing test surface (fresh test file); fixture-built conversation history.
  - Sub-item (c): `chartOfAccountsServiceCrossOrg` + `journalLinesCrossOrgAccount` precedents; QW-05 trigger at journal_entries insert path.
  - Sub-item (d): `recordMutation` post-S28 + `redactPii` recursive; `pino REDACT_CONFIG.paths` post-S28 single-level; `PII_FIELDS` const post-S28.
  - Sub-item (e): `lockedPeriodRejection` precedent for fixture pattern; QW-03 trigger at journal_entries insert path with date-range filter.

---

## Pre-flight delta inventory (substrate-grounded reference at HEAD `9b093f1`)

Per the codified discipline (substrate-fidelity-gate, graduated S30 N=∞; pre-flight delta-inventory pattern as brief-creation discipline propagated at S31 re-anchor per Read-completeness-threshold N=3 graduation):

- **pre-1: Sub-item (e) period-lock date-range — CA-27 substrate-coverage.** `tests/integration/journalEntryPeriodDateRange.test.ts` (CA-27) at HEAD `7774d25` covers all 3 cases the original brief specified (before-start rejection + after-end rejection + in-range success) plus DB-trigger coverage and on-boundary inclusivity. Already uses Soft 9 natural-key pattern. Substrate-substantially duplicate; reframe to coverage-sufficiency-verification per AMENDMENT 5.

- **pre-2: Sub-item (c) cross-org account — CA-28 substrate-coverage.** `tests/integration/journalLinesCrossOrgAccount.test.ts` (CA-28) at HEAD covers cross-org account contamination via FK trigger; `chartOfAccountsServiceCrossOrg.test.ts` covers service-layer. Substrate-substantially duplicate; reframe to coverage-sufficiency-verification per AMENDMENT 3.

- **pre-3: Sub-item (a) agent confirm/reject — CA-61 substrate-coverage.** `tests/integration/apiAgentConfirmIdempotent.test.ts` (CA-61) at HEAD covers full path→service→RPC composition through agent confirm flow. The narrow real gap is `journalEntryService.get` post-S29b-wrapped coverage (S29b pre-flight pre-5 finding). Substrate-partially-redundant; narrow per AMENDMENT 1.

- **pre-4: Sub-item (d) audit-log PII — CA-15 substrate-coverage.** `tests/integration/userProfileAudit.test.ts` (CA-15) at HEAD covers integration-level flat-PII redaction end-to-end via `userProfileService.updateProfile`. Real residual gap is post-S28 nested-PII recursion at integration level (unit-level coverage at `recordMutationPiiRedaction.test.ts` exists). Substrate-partially-redundant; narrow per AMENDMENT 4.

- **pre-5: Sub-item (b) saturation curve — orchestrator-substrate-gap.** `src/agent/orchestrator/index.ts` main-loop step 5 comment explicitly says "Conversation truncation — full history" — meaning NO truncation/rotation logic at HEAD. Original brief's "test codebase truncation/rotation behavior at turn counts 8/16/24/32" has no substrate to exercise. Reframe to boundary-not-overflow per AMENDMENT 2.

**Pre-flight delta-inventory pattern propagation:** this section's existence as a brief-creation discipline is itself a Read-completeness-threshold N=3 graduation outcome. Future briefs that produce substrate-claims about test-coverage-gaps OR existing-implementation-shapes carry a pre-flight delta-inventory section enumerating substrate-vs-brief-framing gaps. Sibling-shape to S30's pre-flight delta-inventory section. Codification graduates at this S31 re-anchor; codification-fire element captured at S31 execution closeout NOTE per (re-anchor-1-α)-style precedent (re-anchor commits don't carry codification-firing elements; defer to next execution closeout).

---

## Pre-decisions enumerated

What's decided at brief-write per operator-delegated recommendation at brief-creation pre-flight (do not re-litigate at execution time):

1. **(a-α) Test pattern discipline — Soft 9 runtime-lookup-by-natural-key as Hard Constraint A.** Ratified verbatim per arc-summary's pre-decision (a) framing. Account-balance-touching tests use natural-key lookups (account_code + org_id); no hardcoded UUIDs. Honors Soft 9 precedent at S19 commit `13e11f7`; sibling pattern to `obligations.md` §6's `accountLedgerService` running-balance fragility (Phase 2; do NOT replicate shape).

2. **(b-α) Boundary-not-overflow — mocked callClaude (free); REFRAMED per AMENDMENT 2.** Original arc-summary framing was "saturation curve characterization" testing truncation/rotation behavior at turn counts 8/16/24/32. Substrate at HEAD shows orchestrator main-loop step 5 has NO truncation/rotation logic ("Conversation truncation — full history"); testing truncation behavior tests behavior that doesn't exist. Substrate-honest reframe: boundary-not-overflow test verifies orchestrator handles 32-turn full-history without breaking; mocked callClaude per pre-decision (b-α). Saves $10-30 per run; preserves zero-paid-API-spend posture for S31. Live-API saturation curve characterization for product reasons (model behavior under load) is Phase 2 obligation requiring paid-API budget pre-allocation; out of S31 scope.

3. **(c-α) Sub-item ordering — all five independent under (b-α) decision.** Default execution order (post-re-anchor): (e) coverage-sufficiency-verification (CA-27) → (c) coverage-sufficiency-verification (CA-28 + chartOfAccountsServiceCrossOrg) → (d) nested-PII integration → (b) boundary-not-overflow → (a) `journalEntryService.get` coverage. Rationale: substrate-record-only sub-items first (cheap; no test-creation surface); test-creation sub-items second (complexity-ascending); narrow service-test last (smallest substrate surface; carry-forward for reactivate-route bug fixture-touching avoidance per S30 closeout element 12 carry-forward).

4. **(d-α) Y2 split-trigger threshold — net diff > 400 lines OR (γ)-rhythm scope-amend > 50 lines of pre-existing-test rewrite.** Operator confirms at execution time; brief encodes guidance not fixed split. The 400-line threshold = roughly 5 sub-items × ~80 lines each; below that, single-commit Y2 is the default. (γ)-rhythm scope-amend trigger advances the codification candidate from N=2 to N=3 (graduates per Documentation Routing convention's N=3 threshold) if firings surface at execution cadence.

5. **Estimated session duration: ~5 hours** (post-re-anchor substrate-honest scope; original 2-3 days framing was substrate-stale per pre-flight delta inventory). Task 0 substrate-confirm (~30 min) + AMENDMENT 5 sub-item (e) coverage-sufficiency-verification (~30 min — substrate-confirm CA-27 + draft NOTE entry) + AMENDMENT 3 sub-item (c) coverage-sufficiency-verification (~30 min — substrate-confirm CA-28 + chartOfAccountsServiceCrossOrg + draft NOTE entry) + AMENDMENT 4 sub-item (d) nested-PII integration test (~1 hour) + AMENDMENT 2 sub-item (b) boundary-not-overflow test (~2 hours; new test surface with mocked callClaude fixture) + AMENDMENT 1 sub-item (a) journalEntryService.get coverage (~1 hour — narrow scope) + full-suite regression (~30 min) + friction-journal NOTE drafting (~30 min) + review buffer. **3 NEW test files** (sub-items a/b/d) + **2 substrate-record NOTE entries** (sub-items c/e) at S31 scope.

OPEN — operator to resolve before / during S31 execution: _none ratified at brief-creation_. All four arc-summary pre-decisions ratified to (a-α) / (b-α) / (c-α) / (d-α) at brief-creation per substrate-grounded analysis.

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| S31-LT-02-a | UF-013 (test coverage) | `tests/integration/journalEntryServiceGet.test.ts` (NEW; or shape-equivalent name) | `journalEntryService.get` post-S29b-wrapped coverage gap closed via new test exercising same-org / cross-org / not-found cases. Closes S29b pre-flight pre-5 finding. Out-of-scope removal: full path→service→RPC integration (CA-61 already covers); reactivate-route fixture-touching (orthogonal carry-forward per S30 NOTE element 12). | 3 cases pass: (i) get with same-org returns expected JournalEntryDetail shape; (ii) get with cross-org returns ServiceError('NOT_FOUND') per existence-leak-prevention contract; (iii) get with non-existent UUID returns ServiceError('NOT_FOUND'). | Gate 5: LT-02a-confirm-reject-routes |
| S31-LT-02-b | UF-013 (test coverage) | `tests/integration/agentConversationLengthBoundary.test.ts` (NEW) | Boundary-not-overflow test verifies orchestrator handles 32-turn full-history without breaking; mocked callClaude per pre-decision (b-α). Substrate-honest reframe per AMENDMENT 2: orchestrator main-loop step 5 has NO truncation/rotation logic at HEAD ("Conversation truncation — full history"); test pins current "no truncation" architectural state as boundary-condition regression-guard. | Test fixtures synthetic 32-turn conversation; persists via `agent_sessions.conversation` JSONB; loads via loadOrCreateSession; asserts handleUserMessage signature accepts loaded session without throwing; mocked callClaude receives full conversation array. NO live Anthropic API call. | Gate 5: LT-02b-saturation-curve |
| S31-LT-02-c | UF-013 (test coverage) | (coverage-sufficiency-verification of CA-28 + chartOfAccountsServiceCrossOrg; no new test file) | Substrate-record NOTE entry produced at S31 execution closeout naming `tests/integration/journalLinesCrossOrgAccount.test.ts` (CA-28) + `tests/integration/chartOfAccountsServiceCrossOrg.test.ts` as the LT-02(c) closure with substrate-cite. No new test file at S31 scope. If gap surfaces during sufficiency-verification, halt-and-surface to operator per Hard Constraint F. | Substrate-record NOTE entry; CA-28 + chartOfAccountsServiceCrossOrg substrate-confirmed via grep + read at execution Task entry. | Gate 5: LT-02c-cross-org-account |
| S31-LT-02-d | UF-010 (audit_log PII surface) + UF-013 | `tests/integration/auditLogNestedPiiRedaction.test.ts` (NEW) | Nested-PII integration test verifies post-S28 redactPii recursive depth-N at integration level; flat-PII deferred to CA-15 (`userProfileAudit.test.ts`) existing coverage; naming-asymmetry honest encoding preserved per Hard Constraint C. Out-of-scope removal: flat-PII integration coverage (CA-15 already covers); pino-side single-level test (orthogonal layer; Phase 2 multi-level remediation tracks naming-asymmetry honest encoding). | Test invokes service mutation OR synthetic recordMutation call carrying nested PII at depth 4 (e.g., `{ a: { b: { c: { invited_email: 'leak@example.com', phone: '555-1212' } } } }`); reads audit_log row via adminClient; asserts PII_FIELDS members redacted recursively per post-S28 redactPii depth-8 traversal; documents naming-asymmetry as load-bearing-substrate per S28 closeout NOTE category iv. | Gate 5: LT-02d-audit-log-pii |
| S31-LT-02-e | UF-013 + period-lock surface | (coverage-sufficiency-verification of CA-27; no new test file) | Substrate-record NOTE entry produced at S31 execution closeout naming `tests/integration/journalEntryPeriodDateRange.test.ts` (CA-27) as the LT-02(e) closure with substrate-cite. CA-27 covers all 3 cases the original brief specified plus DB-trigger coverage and on-boundary inclusivity; uses Soft 9 natural-key pattern. No new test file at S31 scope. If gap surfaces during sufficiency-verification, halt-and-surface to operator per Hard Constraint F. | Substrate-record NOTE entry; CA-27 substrate-confirmed via grep + read at execution Task entry. | Gate 5: LT-02e-period-lock-date-range |

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

## Task 3: Sub-item (e) — coverage-sufficiency-verification of CA-27 (REFRAMED per AMENDMENT 5)

- [ ] **Step 1: Read existing `lockedPeriodRejection.test.ts` + CA-27 (`journalEntryPeriodDateRange.test.ts`) for substrate context**

`lockedPeriodRejection` covers locked-status rejection. CA-27 sibling-test covers date-range-out-of-window. Per AMENDMENT 5 / pre-flight pre-1: CA-27 substantively closes LT-02(e) at HEAD — coverage-sufficiency-verification is the substrate-honest scope at S31.

- [ ] **Step 2: Substrate-confirm CA-27 coverage sufficiency (per AMENDMENT 5)**

```bash
ls -la tests/integration/journalEntryPeriodDateRange.test.ts
grep -nE "before.*period|after.*period|in.*range|on.*boundary" tests/integration/journalEntryPeriodDateRange.test.ts | head -10
```

Expected: file exists; CA-27 covers all 3 cases (before-start rejection + after-end rejection + in-range success) plus DB-trigger coverage and on-boundary inclusivity. Uses Soft 9 natural-key pattern via chart_of_accounts lookup at fixture-setup. Per Hard Constraint F: if sufficiency-verification surfaces a substrate-real gap (e.g., agent-route-handler integration not covered), HALT-and-surface to operator; do NOT scope-creep into in-flight test-creation without operator ratification.

- [ ] **Step 3: Draft substrate-record NOTE entry for sub-item (e) closure**

Capture for Task 9 Step 1 friction-journal NOTE: "LT-02(e) closure substantially-covered by CA-27 (`tests/integration/journalEntryPeriodDateRange.test.ts`); coverage-sufficiency-verification ratified at S31 execution (no new test file required at S31 scope; Hard Constraint F preserved)."

NO new test file at S31 scope per AMENDMENT 5. Sub-item (e) closes via substrate-record citation.

---

## Task 4: Sub-item (c) — coverage-sufficiency-verification of CA-28 + chartOfAccountsServiceCrossOrg

- [ ] **Step 1: Substrate-confirm CA-28 + chartOfAccountsServiceCrossOrg coverage sufficiency (per AMENDMENT 3)**

```bash
ls -la tests/integration/journalLinesCrossOrgAccount.test.ts tests/integration/chartOfAccountsServiceCrossOrg.test.ts
grep -nE "cross.*org|FK.*trigger|account.*from.*org" tests/integration/journalLinesCrossOrgAccount.test.ts tests/integration/chartOfAccountsServiceCrossOrg.test.ts | head -15
```

Expected: both files exist; CA-28 covers cross-org account contamination via FK trigger; chartOfAccountsServiceCrossOrg covers service-layer side. Uses Soft 9 natural-key pattern. Per Hard Constraint F: if sufficiency-verification surfaces a substrate-real gap (e.g., service-layer-error-code-mapping not covered), HALT-and-surface to operator; do NOT scope-creep.

- [ ] **Step 2: Draft substrate-record NOTE entry for sub-item (c) closure**

Capture for Task 9 Step 1 friction-journal NOTE: "LT-02(c) closure substantially-covered by CA-28 (`tests/integration/journalLinesCrossOrgAccount.test.ts`) + `tests/integration/chartOfAccountsServiceCrossOrg.test.ts`; coverage-sufficiency-verification ratified at S31 execution (no new test file required at S31 scope; Hard Constraint F preserved)."

NO new test file at S31 scope per AMENDMENT 3. Sub-item (c) closes via substrate-record citation.

---

## Task 5: Sub-item (d) — audit-log nested-PII redaction integration (NARROW per AMENDMENT 4)

- [ ] **Step 1: Read existing `tests/unit/recordMutationPiiRedaction.test.ts` (post-S28) + `tests/integration/userProfileAudit.test.ts` (CA-15)**

recordMutationPiiRedaction.test.ts has 13 unit-level cases covering flat + nested + array + depth-limit. CA-15 covers integration-level FLAT-PII redaction end-to-end via `userProfileService.updateProfile`. Sub-item (d) at AMENDMENT 4 narrow scope is the integration-level NESTED-PII complement (CA-15 already covers flat).

- [ ] **Step 2: Create `tests/integration/auditLogNestedPiiRedaction.test.ts`**

Test cases (NARROW per AMENDMENT 4):
- (i) Invoke a service mutation OR construct a synthetic recordMutation call carrying NESTED PII at depth 4 (e.g., `{ a: { b: { c: { invited_email: 'leak@example.com', phone: '555-1212' } } } }`). Read resulting audit_log row via adminClient. Assert PII_FIELDS members redacted recursively per post-S28 redactPii depth-8 traversal.
- (ii) **Naming-asymmetry honest encoding (Hard Constraint C):** document the asymmetry in the test-file header as load-bearing-substrate per S28 closeout NOTE category iv. Audit-log redacts `invited_email` recursively (in PII_FIELDS); pino paths redact `*.email` at depth-1 only; multi-level pino is Phase 2 consolidated obligation. Test does NOT assert pino-side redaction (orthogonal layer; Phase 2 territory).

Out-of-scope removal per AMENDMENT 4: flat-PII integration coverage (CA-15 already covers); pino-side single-level test (orthogonal layer; Phase 2 multi-level remediation tracks naming-asymmetry honest encoding).

- [ ] **Step 3: Run new test file**

```bash
pnpm test auditLogNestedPiiRedaction 2>&1 | tail -10
```

Expected: all cases green; nested redaction at depth 4 fires; naming-asymmetry preserved as load-bearing-substrate per Hard Constraint C.

---

## Task 6: Sub-item (b) — agent conversation length boundary-not-overflow (REFRAMED per AMENDMENT 2)

- [ ] **Step 1: Substrate-confirm orchestrator's full-history pass-through**

```bash
grep -nE "Conversation truncation|full history|callClaude|conversation.*array" src/agent/orchestrator/index.ts | head -10
```

Expected: orchestrator main-loop step 5 comment confirms "Conversation truncation — full history" (NO truncation/rotation logic at HEAD). Capture the callClaude invocation entry-point — that's the layer the boundary-not-overflow test exercises (mocked).

- [ ] **Step 2: Create `tests/integration/agentConversationLengthBoundary.test.ts`**

Test cases (REFRAMED per AMENDMENT 2 — boundary-not-overflow, not saturation-curve):
- (i) Construct a 32-turn synthetic conversation history (alternating user/assistant; ~500 chars per turn).
- (ii) Persist via `agent_sessions.conversation` JSONB column.
- (iii) Load session via `loadOrCreateSession`.
- (iv) Mock callClaude to capture the conversation array passed in; assert handleUserMessage signature accepts the loaded session without throwing on conversation-length boundaries.
- (v) Assert mocked callClaude received the full 32-turn conversation array (full-history pass-through; no truncation at HEAD).

Substrate-honest framing: this test pins the current "no truncation" architectural state as a boundary-condition regression-guard. When Phase 2 ships truncation infrastructure, this test inverts to truncation-curve characterization OR is replaced with truncation-explicit tests.

NO live Anthropic API call per pre-decision (b-α). Mocked callClaude replay-only; explicit cite of `agentRealClientSmoke.test.ts skipIf(!HAS_KEY)` as anti-precedent (test runs unconditionally).

- [ ] **Step 3: Run new test file**

```bash
pnpm test agentConversationLengthBoundary 2>&1 | tail -10
```

Expected: all cases green.

---

## Task 7: Sub-item (a) — `journalEntryService.get` post-S29b-wrapped coverage (NARROW per AMENDMENT 1)

- [ ] **Step 1: Substrate-confirm post-S29b-wrapped `journalEntryService.get` shape**

```bash
grep -nE "get: withInvariants\(get\)|^async function get\b" src/services/accounting/journalEntryService.ts | head -5
```

Expected: `get: withInvariants(get)` at export site (post-S29b); `async function get(input: { org_id: string; journal_entry_id: string }, ctx)` at function declaration. Verify input shape matches AMENDMENT 1's expectation.

- [ ] **Step 2: Create `tests/integration/journalEntryServiceGet.test.ts`**

Test cases (NARROW per AMENDMENT 1; closes S29b pre-flight pre-5 finding):
- (i) `get` with same-org caller + valid journal_entry_id: returns expected `JournalEntryDetail` shape (org_id matches, lines populated, reversed_by/reverses fields populated correctly).
- (ii) `get` with cross-org caller (caller has org_ids = [org_A]; journal_entry_id belongs to org_B): returns `ServiceError('NOT_FOUND')` per existence-leak-prevention contract.
- (iii) `get` with non-existent UUID: returns `ServiceError('NOT_FOUND')`.

Hard Constraint A: account IDs via natural-key (account_code + org_id) at fixture-setup if any line-fixture references touch chart_of_accounts.

Out-of-scope removal per AMENDMENT 1: full path→service→RPC integration (CA-61 already covers); reactivate-route fixture-touching (orthogonal carry-forward per S30 NOTE element 12; sub-item (a) narrow scope at AMENDMENT 1 doesn't fixture-touch membership routes).

- [ ] **Step 3: Run new test file**

```bash
pnpm test journalEntryServiceGet 2>&1 | tail -10
```

Expected: 3/3 green.

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
git add tests/integration/journalEntryServiceGet.test.ts \
        tests/integration/agentConversationLengthBoundary.test.ts \
        tests/integration/auditLogNestedPiiRedaction.test.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 4 files staged (3 new test files for sub-items a/b/d + friction-journal NOTE containing sub-items c/e substrate-record entries). No untracked files outside this set.

Per AMENDMENT 6's revised threshold (Hard Constraint E): Y2-split available if Commit 1 net diff > 200 lines OR if any sub-item's coverage-sufficiency-verification surfaced a substrate-real gap requiring scope-expansion (substrate-fidelity-gate firing at execution cadence; (γ)-rhythm scope-amend candidate advances N=2 → N=3 graduating). Operator's call at execution.

- [ ] **Step 3: Commit**

Subject (under 70 chars): `test(coverage): S31 LT-02 closure across five sub-items (Path C arc close)`

Body covers (post-re-anchor scope per AMENDMENTS 1-5):
- Sub-item (a) closure: `journalEntryService.get` post-S29b-wrapped coverage gap closed via `tests/integration/journalEntryServiceGet.test.ts` (NEW; 3 cases: same-org / cross-org / not-found). Closes S29b pre-flight pre-5.
- Sub-item (b) closure: `tests/integration/agentConversationLengthBoundary.test.ts` (NEW) — boundary-not-overflow at 32-turn full-history; mocked callClaude per pre-decision (b-α); zero paid-API spend.
- Sub-item (c) closure: coverage-sufficiency-verification of CA-28 + chartOfAccountsServiceCrossOrg; substrate-record NOTE entry. No new test file at S31 scope per AMENDMENT 3.
- Sub-item (d) closure: nested-PII integration test at `tests/integration/auditLogNestedPiiRedaction.test.ts` (NEW); flat-PII deferred to CA-15; naming-asymmetry honest encoding preserved (Phase 2 obligation per S28 closeout NOTE category iv).
- Sub-item (e) closure: coverage-sufficiency-verification of CA-27; substrate-record NOTE entry. No new test file at S31 scope per AMENDMENT 5.
- Path C arc Gate 5 closed; all five gates green at this commit; Phase 2 surface expansion unblocks.
- UF-013 + UF-014 (test-coverage facets) + UF-010 (audit_log surface end-to-end) closed.
- Y2 commit shape: single bundled (default; ~150-200 line target post-re-anchor) OR Y2-split (per Hard Constraint E threshold > 200 lines or coverage-sufficiency-verification scope-expansion).
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

**Gate 5: LT-02 test coverage closed (five sub-items; post-re-anchor substrate-honest scope)**
- `LT-02a-confirm-reject-routes` — `journalEntryService.get` post-S29b-wrapped coverage closed at `tests/integration/journalEntryServiceGet.test.ts` (NEW; 3 cases). CA-61 (`apiAgentConfirmIdempotent.test.ts`) substantively covers the original full-flow scope per pre-flight pre-3 / AMENDMENT 1.
- `LT-02b-saturation-curve` — boundary-not-overflow test exists at `tests/integration/agentConversationLengthBoundary.test.ts` (NEW); 32-turn full-history pass-through verified with mocked callClaude per pre-decision (b-α). Per pre-flight pre-5 / AMENDMENT 2: orchestrator has NO truncation/rotation logic at HEAD; saturation-curve framing reframed to boundary-not-overflow.
- `LT-02c-cross-org-account` — coverage-sufficiency-verified by CA-28 (`tests/integration/journalLinesCrossOrgAccount.test.ts`) + `tests/integration/chartOfAccountsServiceCrossOrg.test.ts`; substrate-record NOTE entry produced at S31 closeout. Per pre-flight pre-2 / AMENDMENT 3.
- `LT-02d-audit-log-pii` — nested-PII integration test exists at `tests/integration/auditLogNestedPiiRedaction.test.ts` (NEW); naming-asymmetry honest encoding per Hard Constraint C. CA-15 (`userProfileAudit.test.ts`) substantively covers flat-PII per pre-flight pre-4 / AMENDMENT 4.
- `LT-02e-period-lock-date-range` — coverage-sufficiency-verified by CA-27 (`tests/integration/journalEntryPeriodDateRange.test.ts`); substrate-record NOTE entry produced at S31 closeout. Per pre-flight pre-1 / AMENDMENT 5.

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

Codification candidates ledger at S31 re-anchor (per AMENDMENT 8):
- Substrate-fidelity-gate (graduated S30 N=∞; continuing-firings at brief-creation pre-flight cadence at S31 re-anchor; at lock-acquisition cadence; at re-anchor cadence)
- Resolved-decision-citation as contract (graduated S30 N=3)
- Orphan-reference-review at edit-completion (graduated S28 re-anchor N=3)
- Reconciliation-scope-derivation as substrate-completeness gate (graduated S29b parent-shape N=3 with strict-shape sub-tracking)
- Read-completeness-threshold (**graduates at S31 re-anchor N=3 under loose-shape parent-shape with strict-shape sub-tracking**: S29 brief-creation partial-pattern-read N=1 + S30 brief-creation Pattern B count drift N=2 + S31 brief-creation existing-tests-not-fully-enumerated N=3; strict-shape distinguishes substrate-honestly-tagged firings (S30) from substrate-untagged-concealed firings (S31). Codification-fire element captured at S31 execution closeout per (re-anchor-1-α)-style precedent.)
- (γ)-rhythm scope-amend (N=2; held; would advance to N=3 graduation if S31 execution surfaces in-flight scope-amendment per AMENDMENT 6 Hard Constraint E)
- Library-documentation-vs-integrated-behavior-divergence (N=1)
- Brief-spec-vs-arc-precedent-substrate-conflict (N=1-or-N=2)
- Existence-leak-prevention-as-error-code-contract (N=1; ratified S29b)
- Stash-revert isolation (N=2; held)
- Action-string-substrate-drift (N=1; observation-only — reactivate route bug per S30 NOTE element 12)
- Pre-flight delta-inventory pattern (NEW codification candidate at N=1; **propagated as brief-creation discipline at S31 re-anchor**; sibling-shape to S30 pre-flight delta-inventory section's source-shape)
- post-acknowledgment-substrate-skip (NEW codification candidate at N=1; chat-side gap at S31 closeout-summary acknowledgment cadence; observation-only)
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
