# Session 28 — Path C MT-05 + MT-06 (observability cluster)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S28 is structured-log + redaction work; no orchestrator request fires).

**Goal:** Close MT-05 (UF-008 audit-emit failure observability) and MT-06 (UF-010 PII redaction expansion — pino paths + nested `redactPii` recursion) as a single bundled commit. MT-05 augments existing structured observability at three try/catch sites with an explicit grep-stable flag. MT-06 expands `pino` redaction paths to cover five PII fields and extends `recordMutation.redactPii` from shallow-clone-only to nested traversal.

**Framing refinement from `action-plan.md`:** MT-05 as scoped in action-plan.md reads "add a dedicated counter metric or structured log flag." On verification of the three try/catch sites at HEAD, the existing `log.error` calls already carry structured `action` and `err` fields plus a uniform unique swallow message string (`'agent audit write failed; continuing (tx-atomicity gap per Clarification F)'`). MT-05 augments this with one additional structured field (`audit_emit_failure: true`) per site. The "or" in the action plan resolves to the smaller form because the existing structured-log scaffolding makes Option A's delta minimal; Option B (counter metric) requires metrics infrastructure the codebase doesn't have today and is deferred to a Phase 2 metrics-infrastructure scoping session, naturally sequenced with MT-04 (conversation-rotation observability).

**Architecture (V1 minimal scope):**

- **MT-05 (audit-emit observability flag):** Add `audit_emit_failure: true` to the structured log object at three `log.error(...)` call sites — all guarded by the unique swallow-message string anchor:
  - Site 1: `src/agent/orchestrator/loadOrCreateSession.ts` — single try/catch wrapping the `agent.session_created` and `agent.session_org_switched` `recordMutation` calls.
  - Site 2: `src/agent/orchestrator/index.ts` — `emitMessageProcessedAudit` arrow function's catch block (action: `agent.message_processed`).
  - Site 3: `src/agent/orchestrator/index.ts` — `executeTool` finally-block catch (action: `agent.tool_executed`).
- **MT-06 pino paths (additive only):** Extend `src/shared/logger/pino.ts` `REDACT_CONFIG.paths` to include `*.email`, `*.phone`, `*.first_name`, `*.last_name`, `*.display_name`. Match existing bare-intermediate-wildcard form (the `*.tax_id`, `*.bank_account_number` etc. entries' shape).
- **MT-06 nested redactPii (recursive extension):** Extend `src/services/audit/recordMutation.ts` `redactPii()` from shallow-clone-only to recursive traversal. Depth limit: 8 levels. Behavior at depth-limit-exceeded: warn-and-continue with grep-stable warn message `'redactPii: depth limit exceeded; partial redaction'`. `PII_FIELDS` const at `recordMutation.ts:21-27` is **preserved** — the recursive function references the existing list rather than redefining.

**Tech stack:** TypeScript, pino logger (`@pinojs/redact` v0.4.0), Vitest. No new dependencies. No schema changes. No migrations. No orchestrator or prompt edits.

---

**Anchor (parent) SHA:** `64996b5` (S30 execution close — LT-01 + LT-03 + LT-04 + QUALITY-006 convention-to-CI-enforcement cluster) chained from `c9fb118` (S30 re-anchor-2) → `595556a` (S30 re-anchor) → `5d58b36` (sibling fix-forward — route-handler file-top reconciliation) → `c617f58` (S30 hot-fix execution — G1 cross-org closure) → `b4f6063` (S30 hot-fix brief) → `ee35abf` (gitignore cleanup) → `53aa533` (S30 brief) → `c47e58d` (S29a closeout) → `bafd4f9` (S29a brief) → corrigendum + arc-summary chain → `d39ec09` (post-S27 verification-gate corrections). Re-anchored at the S28 re-anchor session (sibling-shape to s30-reanchor `595556a` + s30-reanchor-2 `c9fb118`); the original S28 brief commit at `4c8dac0` was authored pre-S29a/S30 substrate. Verify HEAD's parent matches at Task 1 Step 2.

**Upstream authority:**
- `docs/07_governance/audits/phase-1.2/action-plan.md` — MT-05 (audit-emit alerting), MT-06 (PII redaction expansion). Verbatim "Done when" criteria reproduced in the Exit-criteria matrix below.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-008 (audit-emit failure swallow), UF-010 (PII surface; S25 QW-07 closed audit_log shallow-only; S28 closes pino + nested audit_log).
- `docs/09_briefs/phase-1.3/path-c-arc-summary.md` — arc summary placing this session as the first Path C session; Gates 1 and 2 of the verification harness target this session's deliverables.
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — predecessor arc summary; post-S25 QW-07 deferred MT-06 explicitly.
- `src/services/audit/recordMutation.ts:14-19` — in-code MT-06 reference confirming the pino-paths-expansion + structured-nested-support scope split.
- `tests/unit/pinoRedaction.test.ts` — CA-83 existing pino-redaction regression test; the multi-level probe extends this file.
- `tests/unit/recordMutationPiiRedaction.test.ts` — S25 QW-07 test home; the nested-recursion cases extend this file.
- `CLAUDE.md` — repo standing rules. The `service-architecture` skill applies to `src/services/` edits; standard test conventions apply to `tests/unit/` extensions.
- `AGENTS.md` — Next.js breaking-change discipline does not apply this session (no middleware or routing edits).

---

## Session label
`S28-mt-05-mt-06-observability` — captures the Path C observability cluster (audit-emit flag + PII redaction expansion).

## Hard constraints (do not violate)

- **Out of scope (Path C and beyond):**
  - MT-03 Pattern A wrap (closed at S29a, `c47e58d`).
  - MT-03 Patterns C/E design + migration (ships in S29b after S28; sequences via the path-c-arc-summary's revised dependency graph S30 → S28 → S29b → S31).
  - Pattern G1 cross-org closure (closed at S30 hot-fix arc, `c617f58` + `5d58b36`).
  - LT-01 / LT-03 / LT-04 + QUALITY-006 CI-enforcement cluster (closed at S30, `64996b5`).
  - LT-02 test coverage closure (ships in S31).
  - Substrate-bug at `src/app/api/orgs/[orgId]/users/[userId]/reactivate/route.ts` action-string mismatch (`'user.suspend'` instead of `'user.reactivate'`); pre-existing carry-forward orthogonal to S28's MT-05/MT-06 scope; resolution provenance per S30 execution closeout NOTE element 12 (commit `64996b5`); filed for separate fix in a follow-up session.
  - QW-06 conversation Zod validation (Phase 2).
  - MT-02 canvas refresh (Phase 2).
  - MT-04 conversation rotation observability (Phase 2; sequences with cross-turn caching).
  - DND-01 CORS/CSRF/rate-limiting (Path A scope).
  - DND-02 conversation-table rebuild (Phase 2).
  - DND-03 full PII compliance suite — right-to-erasure, retention policy, row-level access controls (Phase 2).
  - `audit_log` table rebuild for historical-PII scrub (architecturally infeasible per append-only triggers; Phase 2 if ever scoped).
  - Phase 2 metrics infrastructure / MT-05 Option B counter metric (sequences with MT-04).
  - Financial-PII path depth behavior remediation (separate friction-journal finding only, if pino multi-level probe surprises — see Task 4 Probe Branch).
  - Any orchestrator or prompt-text edits.
- **Test posture floor (run-ordinal-dependent per S30 brief re-anchor-2 framing).** `pnpm agent:validate` 26/26 green at HEAD post-edit; if drift surfaces, run `pnpm db:reset:clean && pnpm db:seed:all` to restore clean baseline per S29a element #16 + S30 execution discipline. Full suite fresh-post-reset baseline at HEAD `64996b5` = 1 failed (`verifyAuditCoverageRoundTrip` orthogonal carry-forward per S29a element #19) + 581 passed + 0 skipped (582 total). Post-S28 edits expected to preserve this baseline plus the deliberate test additions from Tasks 3-5: Task 3 Step 4 NEW `orchestratorAuditEmitFailure` tests (3 cases); Task 4 Step 3 EXTEND `pinoRedaction` (1 multi-level probe case); Task 5 Step 2 EXTEND `recordMutationPiiRedaction` (5 cases). Total expected fresh-run at S28 closeout: 1 failed + 590 passed + 0 skipped (591 total; +9 deliberate additions). State-pollution-dependent reporting per S30 brief re-anchor-2 framing: subsequent runs without DB reset surface accumulated state (`accountLedgerService` running-balance ×2 + `crossOrgRlsIsolation` cascading from `journal_entries_pkey`). Halt criteria per Task 6 Step 3: drift beyond fresh-run baseline (post-`db:reset:clean && db:seed:all`) halts execution; carry-forward stays unchanged.
- **No schema changes.** S28 is structured-log + redaction work only. No migration files. No type regeneration.
- **No paid-API spend authorization.** S28 does not invoke the orchestrator or fire any Anthropic call.
- **Y2 commit shape (single bundled commit, one founder-review gate).** UF-008 + UF-010 closure body single. Friction-journal NOTE appended in the same commit, three required elements per the NOTE plan section below (UF-008 + UF-010 closure citation, multi-level probe outcome, any sub-findings).
- **Hard constraint A — single-wrap structural preservation at site 1.** Do NOT split `loadOrCreateSession.ts`'s site 1 try/catch into per-branch try/catch blocks. The four logical actions (`session_created`, `session_org_switched`, `message_processed`, `tool_executed`) span three try/catch sites by design — the single-wrap at site 1 covers both org-switched and freshly-created branches because both invoke `recordMutation` with structurally identical failure modes. The MT-05 flag addition is one structural change inside the single existing catch block; do not refactor the wrap shape.
- **Hard constraint B — emitMessageProcessedAudit call-site preservation.** Do NOT refactor `emitMessageProcessedAudit`'s call sites. The arrow's multiple firings (OI-2 gate-A short-circuit, success path, failure paths in `handleUserMessage`) are by-design. MT-05's coverage of site 2 is one structural change inside the arrow's catch block; the call-sites all benefit automatically. Do not "fix" the multiple-firing pattern even if it appears redundant on first read.
- **Hard constraint C — `PII_FIELDS` const preservation.** The `PII_FIELDS` const at `recordMutation.ts:21-27` is preserved verbatim. The nested-recursion extension to `redactPii` references the existing list; do NOT redefine, expand, or relocate the const.
- **Convention #8 verify-directly discipline.** Every cited file/line/UF-ID was grep-confirmed at brief-write. Re-verify at execution time before edit (Task 2); halt on any drift. Audit-cited line numbers (`orchestrator/index.ts:187-205, 1272-1295`, `loadOrCreateSession.ts:152-179`) have already drifted post-S25/S26/S27 — use the grep-stable anchor strings rather than line numbers.
- **Additive-only.** No API surface changes; no signature changes; no exports added or removed; no public types changed. The MT-05 flag is a structural-log addition; the MT-06 pino entries are paths-array extensions; the redactPii recursion replaces the function body but preserves its single-input/single-output contract.
- **Grep-stable anchors locked.**
  - MT-05 site identification: `'agent audit write failed; continuing (tx-atomicity gap per Clarification F)'` — uniquely identifies all three sites.
  - MT-06 in-code reference: `recordMutation.ts:14-19` (the comment block stating the scope split).
  - MT-06 pino target: `pino.ts` `REDACT_CONFIG.paths` array.
  - MT-06 nested target: `PII_FIELDS` const + the `redactPii` function it backs.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time; executor re-confirms the batch as a D1-shape preamble before touching code):

1. **MT-05 observability shape: Option A (structured-flag log).** Rationale: existing `log.error` calls at all three sites already carry `action` + uniform unique swallow message; adding `audit_emit_failure: true` is genuinely a one-field-per-site change. Option B (counter metric / aggregable surface) requires metrics infrastructure the codebase doesn't have today and is deferred to a Phase 2 metrics-infrastructure scoping session, naturally sequenced with MT-04. The Gate 1 harness's "single grep-able marker that identifies all three sites uniformly" expectation is satisfied by the field name itself.
2. **MT-05 alert threshold: 1% failure rate over a 15-minute rolling window; destination: log-pipeline filter.** Calibrated against zero deployment data; this is the Phase 1.2 Day-1 floor and is operator-tunable post-deployment when real traffic data lands. 15-minute window balances signal vs. alert fatigue at Phase 1.2 traffic volume (tighter would false-positive on small denominators; wider delays detection). Documentation destination: friction-journal NOTE at S28 closeout (the project does not yet have an operator-runbook surface; creating one is out of S28 scope).
3. **MT-06 nested-traversal recursion depth limit: 8 levels; behavior at depth-limit-exceeded: warn-and-continue.** Rationale: `before_state` blobs in this codebase are structurally flat or 2-3 levels (organizations, COA, journal_entries before_state); 8 is well above natural shape and well below pathological-attack territory. Warn-and-continue preserves the audit row's other fields, matching the existing `recordMutation` contract — audit row write succeeding is more important than PII redaction being perfect. **Warn-message string locked:** `'redactPii: depth limit exceeded; partial redaction'`. Strict-throw alternatives (would block the mutation) and silent-truncate alternatives (lose information without signal) are both rejected.
4. **MT-06 pino glob form: bare `*.field` intermediate wildcards.** Matches existing financial-PII entries (`*.tax_id`, `*.bank_account_number`, etc.). Per `@pinojs/redact` v0.4.0 docs, `*.field` redacts at any nesting level. **Multi-level probe required at execution time** — the codebase's existing CA-83 test only verifies single-level matching; pino's documented multi-level behavior is not test-verified in this codebase. The probe extends `tests/unit/pinoRedaction.test.ts` with a stand-alone test case that constructs a multi-level-deep PII fixture (e.g., `{ user: { profile: { email: SENTINEL } } }`) and asserts redaction at the parsed-output level. See Task 4 Probe Branch for fallback paths.
5. **Test surface split:**
   - **MT-05 test: NEW file** `tests/unit/orchestratorAuditEmitFailure.test.ts`. Three test cases (one per site), mock `recordMutation` to throw at each call site; assert the structured-flag field (`audit_emit_failure: true`) appears in the captured log line. Unit-level — pure log-shape assertion, no DB dependency.
   - **MT-06 pino test: EXTEND** `tests/unit/pinoRedaction.test.ts`. Five new path entries gain coverage automatically via the existing test infrastructure that iterates `REDACT_CONFIG.paths`. Add one stand-alone multi-level test case (the probe).
   - **MT-06 nested redactPii test: EXTEND** `tests/unit/recordMutationPiiRedaction.test.ts` (canonical home from S25 QW-07; default-extend rather than create new). Five test cases: (i) flat PII-bearing object (regression of S25 QW-07); (ii) nested PII at depth 2; (iii) nested PII at depth 4; (iv) array of nested objects; (v) circular reference / depth-limit-exceeded path validating warn-and-continue.
6. **Commit shape: single bundled commit.** Both items <half day; UF-008 + UF-010 closure body single. Friction-journal NOTE folds into the same commit. No Y2 split.

OPEN — operator to resolve before Session start (none flagged at brief-write; all decisions above resolved):

_none_

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when (verbatim from action-plan) | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| MT-05 | UF-008 | `loadOrCreateSession.ts` site 1 catch; `orchestrator/index.ts` site 2 (`emitMessageProcessedAudit`); `orchestrator/index.ts` site 3 (`executeTool` finally) | "Audit-emit failures produce a counter metric or structured log flag distinguishing them from a normal log; alert threshold defined." | New `tests/unit/orchestratorAuditEmitFailure.test.ts` — three cases, one per site, assert `audit_emit_failure: true` in captured log line when `recordMutation` throws. | Gate 1: MT-05-counter-or-flag, MT-05-alert-threshold, MT-05-test |
| MT-06 (pino) | UF-010 (logger surface) | `src/shared/logger/pino.ts` `REDACT_CONFIG.paths` | "`pino.ts` `REDACT_CONFIG.paths` covers `email`, `phone`, `first_name`, `last_name`, `display_name`." | Extended `tests/unit/pinoRedaction.test.ts` — five new entries covered by existing iteration; one stand-alone multi-level test case asserts redaction at nested depth (the probe). | Gate 2: MT-06-pino-paths |
| MT-06 (nested redactPii) | UF-010 (audit_log surface) | `src/services/audit/recordMutation.ts` `redactPii()` | "`redactPii()` recurses nested objects (extends beyond S25 QW-07's shallow-clone-only shape); recursion has a documented depth limit." | Extended `tests/unit/recordMutationPiiRedaction.test.ts` — five cases: flat regression / depth-2 / depth-4 / array-of-objects / depth-limit-exceeded warn-and-continue. | Gate 2: MT-06-nested-redaction, MT-06-tests |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S28-mt-05-mt-06-observability
```

Then export in your shell:

```bash
export COORD_SESSION='S28-mt-05-mt-06-observability'
```

Verify lock present:

```bash
cat .coordination/session-lock.json
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit is the S28 re-anchor commit (single file: `docs/09_briefs/phase-1.3/session-28-brief.md`, subject "docs(briefs): S28 brief re-anchor — chain to 64996b5 + post-S30 substrate"); parent is `64996b5` (S30 execution close); grandparent is `c9fb118` (S30 re-anchor-2). If any drift, halt and surface to operator.

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

---

## Task 2: Convention #8 verify-directly — re-confirm grep anchors against HEAD

Run all four sub-shapes against the cited file paths and grep anchors. Halt on any drift before touching code.

- [ ] **Step 1: Sub-shape #1 — existence-level grep on the MT-05 swallow-message anchor**

```bash
grep -rn 'agent audit write failed; continuing (tx-atomicity gap per Clarification F)' src/agent/orchestrator/
```

Expected: exactly three hits — one in `loadOrCreateSession.ts`, two in `index.ts` (sites 2 and 3). Surface line numbers in execution-session log; these are the post-HEAD-drift authoritative locations.

- [ ] **Step 2: Sub-shape #1 — existence-level grep on MT-06 surfaces**

```bash
grep -nE 'REDACT_CONFIG|paths' src/shared/logger/pino.ts | head -20
grep -nE 'PII_FIELDS|redactPii' src/services/audit/recordMutation.ts
sed -n '14,30p' src/services/audit/recordMutation.ts
```

Expected: `REDACT_CONFIG.paths` array exists in pino.ts with the existing financial-PII entries; `PII_FIELDS` const exists at `recordMutation.ts:21-27` (verify exact lines; halt if drift); the `recordMutation.ts:14-19` MT-06 reference comment block matches the in-code text the brief cites.

- [ ] **Step 3: Sub-shape #2 — behavior-level binary on pino multi-level wildcard**

Read `node_modules/.pnpm/@pinojs+redact@*/node_modules/@pinojs/redact/README.md` (or the v0.4.0 vendored docs). Verify the documented behavior of intermediate wildcards: does `*.email` redact `{ user: { profile: { email: ... } } }` at arbitrary depth, or only at single-level? **This is a documented-vs-actual question** — the probe in Task 4 Step 3 is the in-codebase verification.

- [ ] **Step 4: Sub-shape #3 — assumption-vs-implementation on existing recordMutation**

Read `src/services/audit/recordMutation.ts` in full. Verify:
- `redactPii()` is shallow-clone-only as the in-code MT-06 comment states.
- `PII_FIELDS` const carries exactly five entries (matching the pino additions).
- The function is invoked exactly once per `recordMutation()` call, before `db.from('audit_log').insert(...)`.

If any assumption fails, halt and surface — the brief's hard-constraint C ("preserve `PII_FIELDS` verbatim") rests on the const being structurally what the brief expects.

- [ ] **Step 5: Sub-shape #4 — quantitative-behavior on MT-05 sites' log shape**

Read each of the three MT-05 sites in full (the try/catch + log.error block). Verify each `log.error` invocation already carries:
- `err: String(err)` field
- `action: 'agent.<event>'` field
- The unique swallow-message string

If any site's log shape differs from the brief's claim, halt — the MT-05 augmentation strategy depends on the existing structured-log scaffolding being uniform.

---

## Task 3: MT-05 implementation — augment three try/catch sites with `audit_emit_failure: true`

- [ ] **Step 1: Edit site 1** (`src/agent/orchestrator/loadOrCreateSession.ts`)

Locate the catch block by the swallow-message anchor (Task 2 Step 1 surfaced the line). Add `audit_emit_failure: true` as a structured field in the `log.error` first-arg object. Hard constraint A applies — do NOT split the single try/catch into per-branch wrappers.

- [ ] **Step 2: Edit site 2** (`src/agent/orchestrator/index.ts` — `emitMessageProcessedAudit` arrow)

Locate via the swallow-message anchor. Add `audit_emit_failure: true`. Hard constraint B applies — do NOT touch the arrow's call sites.

- [ ] **Step 3: Edit site 3** (`src/agent/orchestrator/index.ts` — `executeTool` finally-block)

Locate via the swallow-message anchor. Add `audit_emit_failure: true`. Preserve the existing `tool_name: toolName` field.

- [ ] **Step 4: Create new test file** `tests/unit/orchestratorAuditEmitFailure.test.ts`

Three test cases, one per site. For each case:
- Mock `recordMutation` (or the underlying audit-write path) to throw a synthetic error.
- Capture the `log.error` invocation (pino mock or test logger).
- Assert the captured log object includes `audit_emit_failure: true`, `action: 'agent.<expected_event>'`, and the unique swallow-message string.

Each case isolates a single site; do not bundle into a single parameterized test (the three sites have different surrounding contexts; per-case clarity matches the structural-preservation constraints).

- [ ] **Step 5: Run the new test file**

```bash
pnpm test orchestratorAuditEmitFailure 2>&1 | tail -20
```

Expected: 3/3 green.

---

## Task 4: MT-06 pino paths expansion + multi-level probe

- [ ] **Step 1: Edit `src/shared/logger/pino.ts` `REDACT_CONFIG.paths`**

Add five entries matching the existing bare-intermediate-wildcard form:

```ts
'*.email',
'*.phone',
'*.first_name',
'*.last_name',
'*.display_name',
```

Insert alongside the existing financial-PII entries; preserve existing entries verbatim. No other changes to pino.ts.

- [ ] **Step 2: Verify existing pino redaction tests still green**

```bash
pnpm test pinoRedaction 2>&1 | tail -10
```

Expected: existing CA-83 test passes; the iteration over `REDACT_CONFIG.paths` automatically covers the five new entries at single-level depth.

- [ ] **Step 3: Add multi-level probe test case to `tests/unit/pinoRedaction.test.ts`**

Stand-alone test case (do not extend the `concretePathFor` helper — the test-helper's TODO surface is out of scope). Construct a synthetic multi-level fixture:

```ts
const fixture = { user: { profile: { email: 'SENTINEL_EMAIL_VALUE' } } };
```

Pass the fixture through pino's redaction (use the same redaction harness the existing tests use). Assert the parsed log output redacts the `email` value at the depth-3 nesting.

- [ ] **Step 4: Run the probe**

```bash
pnpm test pinoRedaction 2>&1 | tail -20
```

**Probe Branch:**

- **If probe PASSES:** pino's `*.field` intermediate wildcard does redact at arbitrary depth. The five new entries fully cover nested PII on the pino surface. Proceed to Task 5.

- **If probe FAILS:** pino's intermediate wildcard does NOT redact at arbitrary depth (or only single-level). Two fallback paths:
  - **Path (1) — explicit nested paths.** Add explicit per-shape entries to `REDACT_CONFIG.paths` for known PII captures (`*.user.email`, `*.profile.email`, etc.). Surface the list of known shapes from the codebase (grep agent + service paths for known nested structures).
  - **Path (2) — custom redaction function.** Replace pino's path-based redaction with a custom redactor that recurses arbitrary depth. Higher complexity; only take this path if (1) is structurally infeasible.
  - **Side finding (out of scope for remediation; in scope for closeout NOTE):** existing financial-PII entries (`*.tax_id`, `*.bank_account_number`, `*.account_number_last_four`, `*.sin`, `*.card_number`) have been operating under a silent-broken nested-coverage assumption. This is a separate friction-journal finding to record at S28 closeout — do NOT remediate financial-PII paths in this session (Phase 2 work).
  - **Halt and surface to operator** before taking either fallback path. Operator decides which fallback applies and authorizes the scope expansion.

---

## Task 5: MT-06 nested redactPii — recursive extension

- [ ] **Step 1: Refactor `redactPii()` in `src/services/audit/recordMutation.ts`**

Replace the shallow-clone-only body with a recursive implementation. Contract preserved: single input (the `before_state` object or null), single output (redacted clone or null). `PII_FIELDS` const reference unchanged. Hard constraint C applies.

Implementation requirements:
- Recurses into nested objects (plain objects only; do not recurse into class instances or special types).
- Recurses into arrays (each element traversed).
- Depth limit: 8 levels.
- Behavior at depth-limit-exceeded: emit `log.warn({ ... }, 'redactPii: depth limit exceeded; partial redaction')` and return the partially-redacted clone (do not throw, do not truncate silently).
- Circular reference handling: detect via a visited-set; on detection, treat the cycle as terminal (do not recurse further into the visited subtree; preserve the redaction work done so far).

- [ ] **Step 2: Extend `tests/unit/recordMutationPiiRedaction.test.ts` with five cases**

- **Case (i) — flat regression of S25 QW-07.** PII-bearing flat object; assert PII fields redacted at top level (preserves the existing S25 behavior).
- **Case (ii) — nested at depth 2.** `{ user: { email: 'SENTINEL' } }`; assert `email` redacted, other fields preserved.
- **Case (iii) — nested at depth 4.** `{ a: { b: { c: { phone: 'SENTINEL' } } } }`; assert `phone` redacted at depth 4.
- **Case (iv) — array of nested objects.** `{ users: [{ email: 'A' }, { email: 'B' }] }`; assert all array-element PII fields redacted.
- **Case (v) — depth-limit / warn-and-continue.** Construct a fixture exceeding depth 8 (e.g., 10 levels of nesting with a PII field at depth 9); capture the `log.warn` invocation; assert the warn-message string `'redactPii: depth limit exceeded; partial redaction'` fires; assert the clone has the redaction performed up to depth 8 (partial-redaction posture).

- [ ] **Step 3: Run the extended test file**

```bash
pnpm test recordMutationPiiRedaction 2>&1 | tail -30
```

Expected: all five cases green.

---

## Task 6: Full-suite regression

- [ ] **Step 1: agent:validate**

```bash
pnpm agent:validate 2>&1 | tail -20
```

Expected: 26/26 green (typecheck + no-hardcoded-urls + Category A floor tests).

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck 2>&1 | tail -10
```

Expected: clean.

- [ ] **Step 3: full vitest suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: pre-existing carry-forward count unchanged; no new failures attributable to S28; the new MT-05 test file (3 cases), the extended pinoRedaction test (existing + 1 multi-level), and the extended recordMutationPiiRedaction test (5 cases) all pass.

If the multi-level probe (Task 4 Step 4) took a fallback path, verify the fallback's tests pass and record the path taken in the friction-journal draft.

If carry-forward count drifts (e.g., the `accountLedgerService` running-balance fragility cases behave differently under shared-DB), capture the drift state for the friction-journal NOTE — do not remediate (Phase 2 obligation).

---

## Task 7: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. Three required elements:

1. **UF-008 + UF-010 closure citation** — name the S28 commit SHA (TBD until Step 3); cite specific surfaces closed: UF-008 audit-emit observability flag at three sites; UF-010 pino-paths expansion (five fields) + nested redactPii recursion (depth 8, warn-and-continue).
2. **Multi-level probe outcome** — record whether the probe PASSED (pino's `*.field` wildcard covers arbitrary depth) or FAILED-and-took-fallback-path-X. If fallback was taken, name the path and rationale.
3. **Sub-findings surfaced at execution** — any of:
   - Financial-PII paths' actual depth behavior (if probe surprises and reveals silent-broken nested coverage on the existing `*.tax_id` etc. entries).
   - Recursion edge cases on circular references (depth-limit interactions).
   - Carry-forward drift on the full-suite run (if S27's `accountLedgerService` running-balance fragility behaves differently under the new redactPii).
   - Any drift surfaced at Task 2 Convention #8 verification.
   - Anything else surfaced during execution that doesn't fit existing categories.

NOTE plan formatting follows the existing tail entries' shape (date prefix, lead-line, lettered sub-elements).

- [ ] **Step 2: Stage all changes**

```bash
git add src/agent/orchestrator/loadOrCreateSession.ts \
        src/agent/orchestrator/index.ts \
        src/shared/logger/pino.ts \
        src/services/audit/recordMutation.ts \
        tests/unit/orchestratorAuditEmitFailure.test.ts \
        tests/unit/pinoRedaction.test.ts \
        tests/unit/recordMutationPiiRedaction.test.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 8 files staged (or 7 if Task 4 fallback didn't add new pino paths beyond the five baseline). No untracked files outside this set.

- [ ] **Step 3: Commit**

Subject (under 70 chars): `feat(observability): S28 MT-05 audit-emit flag + MT-06 PII redaction expansion`

Body covers:
- MT-05 closure: three sites augmented with `audit_emit_failure: true`; new test file with three cases.
- MT-06 pino closure: five PII paths added; multi-level probe outcome (PASS or fallback-path-X).
- MT-06 nested redactPii closure: recursion to depth 8, warn-and-continue at limit; five test cases.
- Alert threshold: 1% over 15min rolling, log-pipeline filter destination; calibrated against zero deployment data; tunable post-deployment.
- Friction-journal NOTE references this commit's SHA at closeout (after Step 4 SHA-fix).
- UF-008 + UF-010 closure cited.

Do NOT include `Co-Authored-By` or generated-by tags unless operator-confirmed at closeout.

- [ ] **Step 4: SHA fix-up if NOTE references the commit's own SHA**

If the friction-journal NOTE references the S28 commit SHA (it should, per element 1 of the NOTE plan), the SHA is unknown until the commit lands. Two strategies:
- **(a) Two-commit Y2 split** — commit code + tests as Commit 1, then append NOTE referencing Commit 1's SHA as Commit 2. Loses the "single bundled commit" pre-decision (f) shape. Default: do NOT take this path.
- **(b) Placeholder + amend** — write the NOTE with `<S28-SHA>` placeholder, commit, capture the resulting SHA, edit the NOTE in place to substitute, `git commit --amend --no-edit` to fold the substitution. Preserves single-commit shape. **Default path.**

Verify final commit family:

```bash
git log --oneline -3
```

Expected: most recent commit is the S28 execution commit; parent is the S28 re-anchor commit; grandparent is `64996b5` (S30 execution close).

- [ ] **Step 5: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the S28 commit SHA.

- [ ] **Step 6: Session end**

```bash
bash scripts/session-end.sh
```

Or whatever the project's session-end convention is at that time. Lock release; COORD_SESSION unset in operator's shell.

- [ ] **Step 7: Surface S28 closeout to operator**

Single message summarizing:
- Commit SHA.
- Gates 1+2 pass status (per the verification harness in `path-c-arc-summary.md` Appendix).
- Multi-level probe outcome.
- Any sub-findings recorded in the friction-journal NOTE.
- S29 unblocked: brief-creation session for S29 opens against S28 closeout SHA.

---

## Verification harness alignment

This brief's exit-criteria map 1:1 to the Path C arc-summary verification harness Gates 1 and 2. At S28 closeout, the harness's mechanical checks for these gates should fire green:

**Gate 1: MT-05 audit-emit observability live**
- `MT-05-counter-or-flag` — three try/catch sites carry `audit_emit_failure: true` flag; uniform grep-stable marker.
- `MT-05-alert-threshold` — friction-journal NOTE captures the 1%/15min threshold and log-pipeline filter destination.
- `MT-05-test` — `tests/unit/orchestratorAuditEmitFailure.test.ts` exists; three cases assert flag fires on synthetic failure.

**Gate 2: MT-06 PII redaction comprehensive**
- `MT-06-pino-paths` — `REDACT_CONFIG.paths` includes all five PII path globs.
- `MT-06-nested-redaction` — `redactPii` recurses with documented depth limit; `PII_FIELDS` list unchanged.
- `MT-06-tests` — extended pino test asserts multi-level redaction; extended recordMutation test asserts nested PII redaction end-to-end.

Re-anchor note: Gate 4 portions (LT-01 + LT-03 + LT-04 + QUALITY-006) closed at S30 (`64996b5`); S28 closes Gate 1 (MT-05) + Gate 2 (MT-06). At re-verification post-S31 (the arc's ad-hoc verification cadence per `path-c-arc-summary.md` Verification Harness section), if any harness check fails the failing surface reopens for remediation before Phase 2 surface expansion proceeds. Post-S30 the verification-harness's count-language shifted from enumerated-14 to substrate-35 annotations across `src/services/` (S30 closeout NOTE element 1); S28's closure semantics for Gates 1+2 are unaffected by that count shift.

---

## Friction-journal NOTE plan

**Re-anchor framing.** This brief was originally authored at `4c8dac0` (pre-S29a/S30 substrate); re-anchored at HEAD `64996b5` per the S28 re-anchor session. The original NOTE plan referenced a brief-creation-session-lock codification thread that is not tracked as a codification candidate in the visible friction-journal tail post-S29a (per S28 re-anchor pre-flight substrate-confirm against the friction-journal tail through S30 execution closeout). The S28 brief-creation lock-acquisition outcome (downgrade per path (3) of the brief-creation flow) is captured at `4c8dac0`-era substrate; subsequent brief-creation sessions across the arc (S29a, S30, S30 hot-fix, S30 re-anchor, S30 re-anchor-2) each carry their own lock-acquisition outcomes captured in their respective closeout NOTEs and at their respective re-anchor-or-execution cadences. The S28 closeout NOTE captures S28 execution's lock-acquisition outcome per the friction-journal tail's lineage discipline, not a fire-status prediction for a thread substrate doesn't track.

The friction-journal NOTE for S28 closeout carries three elements:

1. UF-008 + UF-010 closure citation.
2. Multi-level probe outcome (PASS or fallback-path-X per Task 4 Probe Branch).
3. Sub-findings surfaced at execution. Categories include (non-exhaustive):
   i. Financial-PII silent-broken nested-coverage on existing `*.tax_id` etc. entries (if probe failed).
   ii. Recursion edge cases on circular references / depth-limit interactions.
   iii. Carry-forward drift on the full-suite run (orthogonal to S29a element #19 baseline).
   iv. **`PII_FIELDS`-vs-pino-paths naming-asymmetry** (substrate-confirmed at S28 re-anchor pre-flight): `recordMutation.PII_FIELDS` includes `invited_email` (not `email`); pino `REDACT_CONFIG.paths` post-S28-MT-06 includes `*.email`. Audit-log `before_state` capturing a user row with `email` key continues to leak post-S28 even with the nested-recursion extension landing. Surface as substrate-finding at closeout; whether it's S28-load-bearing remediation or Phase-2-territory disposition is open at execution time. Codification-fire-status: sibling-shape to brief-creation-pre-flight-as-substrate-fidelity-gate's "fires at every cadence layer" clause — this firing is at the re-anchor cadence layer, surfaced for execution-cadence-layer disposition.
   v. Task 2 Convention #8 verify-directly drift on cited file/line numbers (e.g., `recordMutation.ts:21-27` cite for `PII_FIELDS` vs substrate `:20-26`; `recordMutation.ts:14-19` MT-06 reference cite vs substrate `:12-19`); fold under S29a element #3's "applies recursively at every layer" clause; no fresh codification-graduation.
   vi. **Orphan-reference-review-at-edit-completion N=3 graduation** (deferred N=2 candidate from S30 re-anchor-2 closeout; N=3 firing at S28 re-anchor's edit-completion sweep per the s28-reanchor commit body). Documentation Routing convention's N=3 threshold met; codification-fire element captured at S28 closeout sub-firing addition (NOT at the re-anchor commit itself — re-anchor commits are brief-creation-shape per (re-anchor-1-α) precedent, no codification-firing elements in the re-anchor's own NOTE).
   vii. Anything else surfaced during execution that doesn't fit existing categories.

---

## Out-of-scope explicit list (recap for executor reference)

1. **Phase 2 metrics infrastructure / MT-05 Option B counter metric** — sequences with MT-04 conversation-rotation observability per Phase 2 obligations.
2. **DND-03 full PII compliance suite** — right-to-erasure, retention policy, access controls.
3. **`audit_log` row-level access controls** — Phase 2 obligation per UF-010 description.
4. **`audit_log` table rebuild for historical-PII scrub** — architecturally infeasible per append-only triggers; Phase 2 if ever scoped.
5. **Financial-PII path depth behavior remediation** — if the multi-level probe surprises and reveals silent-broken nested coverage on `*.tax_id` etc., this becomes a separate friction-journal finding only; remediation is Phase 2 work (would require the same probe-and-fix shape across all financial-PII paths plus a posture decision on existing un-redacted historical log lines).
6. **DND-02 conversation-table rebuild for shape versioning** — Phase 2 obligation.

Items 1, 4, and 5 are particularly likely to surface as confused-scope at execution time; the executor should decline scope expansion and surface for operator decision rather than proceeding.
