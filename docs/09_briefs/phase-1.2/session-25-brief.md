# Session 25 — Phase 1.2 post-audit Day-1 fixes (non-ledger)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S25 is service + middleware + audit-redaction work; no orchestrator request fires).

**Goal:** Close three of the seven Phase 1.2 audit Quick Wins on the non-ledger surface — QW-01 (UF-009 MFA-middleware wiring), QW-02 (UF-002 read-path org checks on `chartOfAccountsService.get()` and `periodService.isOpen()`), and QW-07 (UF-010 `audit_log.before_state` PII redaction at write time). Three additive, low-coupling changes; bundled into a single commit because each is well under one day, all three share zero files, and the ledger-integrity cluster (QW-03/04/05) ships separately in S26 to keep that session's test fixtures isolated.

**Architecture (V1 minimal scope):**

- **QW-01 (MFA):** Import `enforceMfa` from `src/middleware/mfaEnforcement.ts` into the top-level `middleware.ts` (repo-root location confirmed at brief-write — see Task 2 Step 1) and invoke it after the `next-intl` locale routing returns. Add an integration test that asserts the middleware actually invokes `enforceMfa`'s redirect for an `aal1` session against an org with `mfa_required = true`. The existing test `tests/integration/mfaEnforcementMiddleware.test.ts` only verifies the column flips and the function exports — it does not assert wiring (per UF-009 evidence at lines 322–324 of `unified-findings.md`).
- **QW-02 (read-path org checks):** Add `if (!ctx.caller.org_ids.includes(input.org_id)) throw new ServiceError('FORBIDDEN', ...)` guard to `chartOfAccountsService.get()` (lines 47–66) AND `periodService.isOpen()` (lines 52–83). Pattern is consistently applied in `chartOfAccountsService.list()` line 20 and `periodService.listOpen()` line 29 (verified by `grep -n "ctx.caller.org_ids" src/services/accounting/{chartOfAccountsService,periodService}.ts` at brief-write). Wrap the raw Supabase error throw at `chartOfAccountsService.get()` line 62 in `ServiceError`. Add cross-org 403 regression tests for both methods.
- **QW-07 (audit-log PII redaction):** Extend `recordMutation.ts` with a write-time redaction function that strips `invited_email`, `phone`, `first_name`, `last_name`, `display_name` from the `before_state` JSONB before persistence at line 69. PII redaction in pino logs (UF-010 logger surface) is a separate Phase 2 follow-on (MT-06) and is NOT in this session's scope per the audit-of-audit synthesis.

**Tech stack:** TypeScript, Next.js middleware (per `AGENTS.md`: read `node_modules/next/dist/docs/` before any middleware change since this version may differ from training data), Supabase, Vitest. No new dependencies. No schema changes.

---

**Anchor (parent) SHA:** `0952fdd0..` — the SHA of S24 Phase 1.2 audit closeout commit (`0952fdd docs(governance): Phase 1.2 audit — 24 unified findings, YES-WITH-CAVEATS readiness`). Verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:**
- `docs/07_governance/audits/phase-1.2/action-plan.md` — QW-01 (lines 11–15), QW-02 (lines 17–21), QW-07 (lines 47–52). Verbatim "Done when" criteria are reproduced in the Exit-criteria matrix below.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-009 (lines 310–328 MFA dead code), UF-002 (lines 141–159 read-path org-check gap; carry-forward from Phase 1.1 UF-002 per line 159 cross-reference), UF-010 (lines 332–348 PII surface).
- `docs/07_governance/audits/phase-1.2/audit-report.md` — synthesis context for the YES-WITH-CAVEATS readiness verdict (these three QWs are caveats).
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — the arc summary that places this session as the first of three.
- Phase 1.1 carry-forward: UF-002 was originally documented in Phase 1.1 known-concerns; this session closes the carry forward for the read-path surface only (mutation-surface CI guard / LT-01 / UF-006 remains Phase 2).
- `AGENTS.md` — Next.js breaking-change discipline applies to the `middleware.ts` edit. Do not assume App Router middleware semantics from training data.
- `CLAUDE.md` — repo standing rules. The `service-architecture` skill applies to `src/services/` edits; the `integration-test-rules` skill applies to the new tests under `tests/integration/`.

---

## Session label
`S25-non-ledger-day-1` — captures the non-ledger Day-1 fix bundle (MFA wiring + read-path org checks + audit-log PII redaction).

## Hard constraints (do not violate)

- **Out of scope:**
  - QW-03 / QW-04 / QW-05 ledger-integrity items (ship in S26).
  - MT-01 atomicity RPC (ships in S27).
  - QW-06 (UF-007 conversation Zod validation) — DEFERRED to Phase 2; rationale captured in pre-decisions block and logged into `docs/09_briefs/phase-2/obligations.md` by the orchestrating session. Do NOT implement in S25.
  - LT-01 / UF-006 service-mutation CI guard.
  - MT-06 pino redaction expansion (audit-of-audit synthesis distinguishes the audit_log write-time surface from the pino log-emit surface; this session covers only the former).
  - MT-03 read-path enforcement wrapper (Phase 2).
  - Any prompt or orchestrator request-shape change.
- **Test posture floor:** ALL existing tests green at HEAD post-edit. `pnpm agent:validate` clean (typecheck + no-hardcoded-urls + 26-test agent floor). Full suite: any pre-existing carry-forwards documented at HEAD remain unchanged. No new failures attributable to this session.
- **No schema changes.** S25 is service + middleware + audit-write logic only. No migration files.
- **No paid-API spend authorization.** S25 does not invoke the orchestrator or fire any Anthropic call.
- **Y2 commit shape (single bundled commit, one founder-review gate).** Three QW items, all under one day each, share no files; bundle into one commit. Subject line below in Task 8. Friction-journal entry at session closeout.
- **PII redaction placement.** Write-time filter inside `recordMutation()` BEFORE the `db.from('audit_log').insert(...)` call at line 62. Do NOT push the redaction into a database trigger — once a row hits `audit_log`, the append-only triggers (`trg_audit_log_no_update`, `trg_audit_log_no_delete` per `supabase/migrations/20240122000000_audit_log_append_only.sql`) make scrubbing architecturally infeasible per UF-010's evidence. Service-layer redaction is the only viable surface.
- **Convention #8 verify-directly discipline.** Every cited file/line/UF-ID was grep-confirmed at brief-write (see Task 2). Re-verify at execution time before edit; halt on any drift.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time):

1. **Bundle three QWs into one commit (not three separate commits).** All under one day, share no files, share no test fixtures. The single-commit shape avoids three-trip founder-review overhead and matches the action-plan's "1–2 week horizon" framing for the QW class.
2. **Sequencing within session: QW-01 → QW-02 → QW-07.** Independent items; order is by ascending complexity (MFA = one-line wire + one test; read-path = three-line guard × 2 + two tests; PII redaction = redaction utility + filter point + unit test).
3. **MFA test scope.** Integration test against the seed `SEED.ORG_REAL_ESTATE` (UUID `22222222-2222-2222-2222-222222222222`, verified at `tests/setup/testDb.ts:31`) with `mfa_required = true` for an `aal1` session, asserting 307 redirect. Pass-through assertion for `aal2`. Unhappy-path coverage of the assertion that `enforceMfa` is actually invoked from `middleware.ts` is the test's load-bearing claim per UF-009 evidence.
4. **Read-path test fixture.** Seed `SEED.ORG_REAL_ESTATE` plus a secondary org from existing test seeds. Caller's `ctx.caller.org_ids` includes only the secondary org; calls to `chartOfAccountsService.get()` and `periodService.isOpen()` against `SEED.ORG_REAL_ESTATE` IDs must throw `ServiceError('FORBIDDEN', ...)`. Mirror `chartOfAccountsService.list()`'s existing 403 pattern from line 20.
5. **`ServiceError` wrapping at `chartOfAccountsService.get()` line 62.** Replace `throw error` with `throw new ServiceError('NOT_FOUND', error.message)` (or appropriate code) so callers see a typed error, not a raw Supabase error. Match the pattern used elsewhere in `src/services/accounting/`.
6. **PII redaction list:** `invited_email`, `phone`, `first_name`, `last_name`, `display_name` (verbatim from action-plan QW-07 line 49). Stripped fields are deleted from a shallow clone of `before_state`; nested fields are NOT recursed (Phase 2 work if needed). The redaction function lives in `src/services/audit/recordMutation.ts` (or a sibling helper file in the same folder) — not exported globally; not used by anything other than `recordMutation()`.
7. **PII redaction unit test:** new file `tests/unit/recordMutationPiiRedaction.test.ts` (or co-located within `tests/integration/` if integration scope is preferred — operator's call at execution time). Unit-level is preferable because the redaction is a pure function with no DB dependency.
8. **QW-06 deferred to Phase 2.** Operator decision; rationale: shape-versioning work for the conversation table is more invasive than a write-time fix and is best paired with the events-table cutover (Phase 2 Simplification 1 correction). Logged into `docs/09_briefs/phase-2/obligations.md` and noted in `docs/07_governance/audits/phase-1.2/action-plan.md` deferral note by the orchestrating session.
9. **This session changes the audit's "Session 1 = QW-01..QW-07 bundled" recommendation to a "non-ledger / ledger split" framing.** Rationale (capture in friction-journal): the ledger-integrity cluster (QW-03/04/05) shares migration files and test fixtures and benefits from isolated session context, separate from the additive non-ledger fixes here. The split lowers per-session blast radius without lengthening total elapsed time.
10. **Estimated session duration:** ~4 hours (1h MFA + 2h read-path + 1h PII redaction + review).

OPEN — operator to resolve before Session start (none flagged at brief-write; all decisions above resolved):

_none_

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when (verbatim from action-plan) | Test evidence required |
|---|---|---|---|---|
| QW-01 | UF-009 | `middleware.ts` (repo root) — verified at brief-write to be the actual middleware location, NOT `src/middleware.ts` as cited in the audit's UF-009 evidence; surface this drift at Task 2 Step 1 | "When an org has `mfa_required = true`, non-MFA users are redirected to MFA enrollment. Test or manual verification in browser." | Integration test asserts `aal1` session against an MFA-required org receives 307 redirect; `aal2` session passes through. Test asserts `enforceMfa` is invoked from `middleware.ts` (not just exported). |
| QW-02 | UF-002 | `src/services/accounting/chartOfAccountsService.ts` lines 47–66; `src/services/accounting/periodService.ts` lines 52–83 | "Function throws `ServiceError` with code `FORBIDDEN` when called with an org the user doesn't belong to. All Supabase errors wrapped in `ServiceError`." | Cross-org 403 regression test for `chartOfAccountsService.get()`; cross-org 403 regression test for `periodService.isOpen()`; test that raw Supabase error from `chartOfAccountsService.get()` is wrapped in `ServiceError`. |
| QW-07 | UF-010 | `src/services/audit/recordMutation.ts` (write-time redaction at the insert call site) | "`audit_log.before_state` no longer contains `invited_email`, `phone`, or name fields. Existing rows (if any) should be noted as technical debt and planned for Phase 2 cleanup." | Unit test passes `{ invited_email, phone, first_name, last_name, display_name, other_field }` as `before_state`, asserts the row written to `audit_log` retains only `other_field`. |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S25-non-ledger-day-1
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `0952fdd0..` (S24 audit closeout). HEAD's single changed file should be `docs/09_briefs/phase-1.2/session-25-brief.md` (and the arc summary + S26/S27 briefs if the orchestrating session committed them together — surface what's in the diff).

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention (CLAUDE.md session execution conventions).

---

## Task 2: Pre-flight verification

S25-shaped pre-flight reads: middleware location verify, service signatures verify, recordMutation surface verify, test-baseline grep.

- [ ] **Step 1: Verify middleware location**

```bash
test -f middleware.ts && echo "ROOT" || true
test -f src/middleware.ts && echo "SRC" || true
grep -n "next-intl" middleware.ts 2>/dev/null
```

Expected: middleware lives at `middleware.ts` (repo root), 10 lines, only does `next-intl` locale routing. If `src/middleware.ts` also exists, surface the duplication and halt — Next.js spec allows only one middleware file.

UF-009 evidence in `unified-findings.md:320` cites `src/middleware.ts (lines 1–10)`; brief-write found it at repo root. This is a documentation drift in the audit, not a code drift. Note in friction-journal at session closeout.

- [ ] **Step 2: Verify `chartOfAccountsService.get()` signature**

```bash
sed -n '47,66p' src/services/accounting/chartOfAccountsService.ts
```

Expected: `get()` takes `(input: { account_id: string }, ctx: ServiceContext)`, no `org_id` in `input`. Halt if drift — the org-check requires `input.org_id`, so the input shape needs to be extended OR the org check needs to fetch the account first and verify its `org_id` against `ctx.caller.org_ids`. Surface the design choice to operator before Task 3.

**Open at brief-write — operator may resolve here:** the action-plan's QW-02 entry says "Add `if (!ctx.caller.org_ids.includes(input.org_id))` ..." but `chartOfAccountsService.get()`'s input has only `account_id`, not `org_id`. Two design options:
1. **Extend `input` to require `org_id` AND verify the looked-up account's `org_id` matches.** Stricter; matches `list()`'s pattern. Breaking change for any caller (none in Phase 1.1; agent dispatch may pass `org_id` already).
2. **Look up the account first, then verify its `org_id` against `ctx.caller.org_ids`.** Closes the leak; doesn't require input-shape change. Slightly less strict because the row-level RLS bypass is already in play.

Default at brief-write: option 1 (extend input). Operator confirms before Task 4.

- [ ] **Step 3: Verify `periodService.isOpen()` input**

```bash
sed -n '52,83p' src/services/accounting/periodService.ts
```

Expected: `isOpen()` already takes `input: { org_id, entry_date }` — input has `org_id`, so the org-check pattern from `listOpen()` line 29 transplants directly.

- [ ] **Step 4: Verify `recordMutation.ts` write site**

```bash
sed -n '57,79p' src/services/audit/recordMutation.ts
```

Expected: line 62 is the `db.from('audit_log').insert(...)` call; line 69 sets `before_state: entry.before_state ?? null`. Redaction goes between the function entry and the insert — strip the named fields from a shallow clone of `entry.before_state` if present.

- [ ] **Step 5: Verify existing test surfaces**

```bash
ls tests/integration/mfaEnforcementMiddleware.test.ts
ls tests/integration/crossOrgRlsIsolation.test.ts
ls tests/integration/periodLockUnlock.test.ts
grep -n "enforceMfa\|mfa_required" tests/integration/mfaEnforcementMiddleware.test.ts | head -10
```

Expected: all three test files exist. The MFA test currently asserts column-flip + function-export but not middleware wiring (per UF-009 evidence). The new MFA test in this session will assert wiring.

- [ ] **Step 6: Verify test-baseline at HEAD**

```bash
pnpm agent:validate
```

Expected: clean (26-test agent floor). Halt and surface if anything fails — this is the floor against which S25's edits are measured.

- [ ] **Step 7: Verification report to operator**

Surface:
1. Middleware location (root vs. src — note the audit drift).
2. `chartOfAccountsService.get()` input shape — surface the design choice (Step 2).
3. `periodService.isOpen()` input shape (clean transplant).
4. `recordMutation.ts` write site location.
5. Existing test files present.
6. `pnpm agent:validate` clean at HEAD.

Wait for operator acknowledgment before Task 3. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — diff scope + design decisions

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface `chartOfAccountsService.get()` design decision**

Per Task 2 Step 2: extend input to `{ account_id: string; org_id: string }` and add the standard org-membership guard. Update any callers found via `grep -rn "chartOfAccountsService\.get\b" src/ tests/`. Surface caller list to operator.

- [ ] **Step 2: Surface PII redaction shape**

```ts
// In src/services/audit/recordMutation.ts (or sibling helper)
const PII_FIELDS = [
  'invited_email',
  'phone',
  'first_name',
  'last_name',
  'display_name',
] as const;

function redactPii(state: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!state) return null;
  const clone = { ...state };
  for (const field of PII_FIELDS) {
    delete clone[field];
  }
  return clone;
}
```

Applied at line 69: `before_state: redactPii(entry.before_state),`.

- [ ] **Step 3: Surface MFA wiring shape**

```ts
// middleware.ts (repo root)
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { enforceMfa } from '@/middleware/mfaEnforcement';

const intl = createMiddleware({
  locales: ['en', 'fr-CA', 'zh-Hant'],
  defaultLocale: 'en',
});

export default async function middleware(req: NextRequest) {
  const intlResp = intl(req);
  // intlResp may be a redirect/rewrite; if so, prefer it before MFA check.
  if (intlResp && intlResp.headers.get('location')) return intlResp;

  const mfaResp = await enforceMfa(req);
  if (mfaResp) return mfaResp;

  return intlResp;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

Exact composition order is operator-confirmable; the load-bearing claim is that `enforceMfa` is invoked. Per `AGENTS.md`, consult `node_modules/next/dist/docs/` for the current middleware composition idiom before writing this — Next.js semantics may differ from training data.

- [ ] **Step 4: Surface diff scope**

Single commit:

| File | Status | Approx delta |
|---|---|---|
| `middleware.ts` | Modified | ~+15 / -2 lines |
| `src/services/accounting/chartOfAccountsService.ts` | Modified | ~+8 / -3 lines (org-check + ServiceError wrap) |
| `src/services/accounting/periodService.ts` | Modified | ~+4 / -0 lines (org-check) |
| `src/services/audit/recordMutation.ts` | Modified | ~+15 / -1 lines (redaction utility + filter point) |
| `tests/integration/mfaEnforcementMiddleware.test.ts` | Modified | ~+30 lines (wiring assertion test) — or new file if cleaner |
| `tests/integration/chartOfAccountsServiceCrossOrg.test.ts` | New | ~+50 lines |
| `tests/integration/periodServiceIsOpenCrossOrg.test.ts` | New | ~+50 lines |
| `tests/unit/recordMutationPiiRedaction.test.ts` | New | ~+40 lines |
| **Total** | **8 files** | **~+212 / -6 lines** |

The exact test-file locations (integration vs. unit) are operator's call at Task 4. Default per pre-decision #7: PII redaction is unit; cross-org are integration.

- [ ] **Step 5: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- `chartOfAccountsService.get()` input-shape design (extend vs. lookup-then-check).
- PII redaction shape (shallow clone, the named fields, no nested recursion).
- Middleware composition order.
- Test-file placement (unit vs. integration).
- Single-bundled-commit shape.

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement QW-01 (MFA wiring)

After plan approval.

- [ ] **Step 1: Edit `middleware.ts`** per Task 3 Step 3 design.

- [ ] **Step 2: Author or extend the MFA wiring test**

Add a test that constructs a request matching the middleware matcher, mocks the Supabase auth response to indicate `aal1`, mocks `organizations.mfa_required = true`, and asserts the middleware returns a 307 redirect to the MFA-enrollment path. Pass-through assertion for `aal2`.

Decision at execution time: extend `tests/integration/mfaEnforcementMiddleware.test.ts` OR add a new file `tests/integration/middlewareMfaWiring.test.ts`. Pre-decision default: extend the existing file because UF-009's evidence says it tests "manually in browser" — replacing that with the wiring-assertion test is the directly-corrective surface.

- [ ] **Step 3: Run targeted test**

```bash
pnpm test mfaEnforcementMiddleware
```

Expected: green. Halt and surface on failure.

---

## Task 5: Implement QW-02 (read-path org checks)

- [ ] **Step 1: Edit `chartOfAccountsService.get()`**

Per Task 3 Step 1's design (extend input to `{ account_id: string; org_id: string }` and add the standard guard at function entry; replace `throw error` at line 62 with `throw new ServiceError(...)`). Update any callers found via `grep -rn "chartOfAccountsService\.get\b" src/ tests/`.

- [ ] **Step 2: Edit `periodService.isOpen()`**

Add the `if (!ctx.caller.org_ids.includes(input.org_id)) throw new ServiceError('FORBIDDEN', ...)` guard at function entry (line 56-57 area), matching `listOpen()`'s pattern at line 29.

- [ ] **Step 3: Author cross-org regression tests**

Two new files:
- `tests/integration/chartOfAccountsServiceCrossOrg.test.ts` — caller's `org_ids` does not include the target org; expect `ServiceError('FORBIDDEN', ...)`.
- `tests/integration/periodServiceIsOpenCrossOrg.test.ts` — same shape.

Plus a test that asserts a raw Supabase error from `chartOfAccountsService.get()` (e.g., non-existent `account_id` in a same-org context) surfaces as `ServiceError`, not the raw Supabase error.

- [ ] **Step 4: Run targeted tests**

```bash
pnpm test chartOfAccountsService periodService
```

Expected: green. Halt and surface on failure.

---

## Task 6: Implement QW-07 (audit-log PII redaction)

- [ ] **Step 1: Edit `src/services/audit/recordMutation.ts`**

Add the `PII_FIELDS` constant and `redactPii()` helper near the top of the file (after imports; before `AuditEntry`). Apply at line 69 (the `before_state` field of the insert).

- [ ] **Step 2: Author the unit test**

New file `tests/unit/recordMutationPiiRedaction.test.ts` (or whatever placement operator confirms at Task 3 Step 5):
- Test 1: `before_state` containing all 5 PII fields + a non-PII field; assert the row insert receives only the non-PII field.
- Test 2: `before_state` containing none of the PII fields; assert pass-through.
- Test 3: `before_state === undefined`; assert `null` is written.
- Test 4: `before_state === null`; assert `null` is written.

Mock the Supabase `db.from('audit_log').insert(...)` call to capture the payload; assert on the captured payload's `before_state`.

- [ ] **Step 3: Run targeted test**

```bash
pnpm test recordMutationPii
```

Expected: green. Halt and surface on failure.

---

## Task 7: Full-suite gate

- [ ] **Step 1: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean. Halt and surface on failure.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: full-suite green at HEAD baseline (modulo any documented carry-forwards present at HEAD before this session — surface those with the result so the comparison is explicit). No new failures attributable to this session.

If any new failures surface, halt and surface — they're caused by this session's edits and need triage.

---

## Task 8: Founder review gate

- [ ] **Step 1: Surface to operator for review**

Present:
1. Eight file diffs per Task 3 Step 4 (or whatever shape was approved).
2. `pnpm agent:validate` output.
3. `pnpm test` output (or documented deviation).
4. Diff scope summary.
5. Cross-references to UF-001 / UF-009 / UF-002 / UF-010.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + full suite after every revision pass. Re-surface for re-approval.

---

## Task 9: Commit + friction-journal

- [ ] **Step 1: Stage files**

```bash
git add middleware.ts \
        src/services/accounting/chartOfAccountsService.ts \
        src/services/accounting/periodService.ts \
        src/services/audit/recordMutation.ts \
        tests/integration/mfaEnforcementMiddleware.test.ts \
        tests/integration/chartOfAccountsServiceCrossOrg.test.ts \
        tests/integration/periodServiceIsOpenCrossOrg.test.ts \
        tests/unit/recordMutationPiiRedaction.test.ts
git status --short
```

- [ ] **Step 2: Create the commit**

```bash
export COORD_SESSION='S25-non-ledger-day-1' && git commit -m "$(cat <<'EOF'
feat(security): Day-1 fixes — MFA wiring, read-path org checks, audit_log PII redaction

- QW-01 (UF-009): wire enforceMfa from src/middleware/
  mfaEnforcement.ts into top-level middleware.ts after the
  next-intl locale routing returns. Extend the existing MFA
  middleware test to assert wiring (not just column flip and
  function export), per UF-009 evidence that the prior test
  did not cover the runtime path.
- QW-02 (UF-002, Phase 1.1 carry-forward): add ctx.caller.
  org_ids.includes(input.org_id) guard to chartOfAccountsService.
  get() (47-66) and periodService.isOpen() (52-83). Wrap the
  raw Supabase error throw at chartOfAccountsService.get():62
  in ServiceError. Cross-org 403 regression tests added for
  both methods.
- QW-07 (UF-010): write-time PII filter on audit_log.before_state
  in recordMutation.ts. Strips invited_email, phone, first_name,
  last_name, display_name from a shallow clone before insert.
  Pino redaction expansion (UF-010 logger surface) is MT-06,
  separate Phase 2 follow-on; this commit covers only the
  audit_log write-time surface.
- QW-06 (UF-007 conversation Zod validation) deferred to Phase 2
  obligations per audit-of-audit synthesis.
- Closes UF-009, UF-002 (read-path facet), UF-010 (audit_log
  write-time facet). Phase 1.1 UF-002 carry-forward closed for
  the read-path surface; mutation-surface CI guard (LT-01 / UF-006)
  remains Phase 2.
- Sequenced before S26 (ledger-integrity Day-1) and S27 (MT-01
  atomicity RPC). See docs/09_briefs/phase-1.2/post-audit-fix-
  stack-arc.md.

Session: S25-non-ledger-day-1

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify commit landed**

```bash
git log -1 --stat
```

Expected: 8 files, ~+212 / -6 lines (matches Task 3 Step 4 estimate; surface drift if material).

- [ ] **Step 4: Append friction-journal entry**

```markdown
- 2026-XX-XX NOTE — S25 Phase 1.2 post-audit Day-1 (non-ledger):
  QW-01 (MFA middleware wiring), QW-02 (read-path org checks
  on chartOfAccountsService.get + periodService.isOpen, wraps
  Supabase errors in ServiceError), QW-07 (audit_log.before_state
  PII redaction at write time). Single bundled commit because
  three items, each <1 day, share zero files. Audit recommendation
  to bundle QW-01..QW-07 split into non-ledger (S25) and
  ledger-integrity (S26) clusters per fix-stack-arc; rationale:
  ledger cluster shares migration files and test fixtures and
  benefits from isolated session context. Audit drift noted:
  UF-009 evidence cited middleware location as src/middleware.ts;
  actual location is repo-root middleware.ts (single Next.js
  middleware file). QW-06 (UF-007 conversation Zod validation)
  deferred to Phase 2 obligations per audit-of-audit synthesis.
```

Surface for operator review; commit as a follow-on (or fold into the bundled commit if the operator prefers — pre-decision default is bundled).

- [ ] **Step 5: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Test strategy summary

- **Fixtures.** `SEED.ORG_REAL_ESTATE` (UUID `22222222-2222-2222-2222-222222222222`, defined in `tests/setup/testDb.ts:31`) plus a secondary org (operator-confirmed at Task 3 if a second seed org exists, or seed inline). `aal1` and `aal2` session contexts via existing test helpers.
- **Integration tests added.**
  - `tests/integration/chartOfAccountsServiceCrossOrg.test.ts`
  - `tests/integration/periodServiceIsOpenCrossOrg.test.ts`
  - Wiring assertion in `tests/integration/mfaEnforcementMiddleware.test.ts` (extend) or new `middlewareMfaWiring.test.ts`.
- **Unit test added.**
  - `tests/unit/recordMutationPiiRedaction.test.ts`.
- **Category-A floor tests (per CLAUDE.md "What done means" §1).** All 5 must remain green; `pnpm agent:validate` is the gate.
- **Full-suite gate.** `pnpm test` green at session closeout, modulo documented carry-forwards present at HEAD before this session begins.

## Founder review gate

Surfaced at Task 8 Step 1. Artifacts:
1. Diffs of all 8 files.
2. `pnpm agent:validate` output (must be clean).
3. `pnpm test` output (must match HEAD baseline).
4. Cross-reference table tying each diff to its UF / QW ID.
5. Confirmation that no out-of-scope files appear in `git diff --stat`.

## Friction-journal entry expected at closeout

One-line description (Task 9 Step 4): "S25 Phase 1.2 post-audit Day-1 non-ledger: MFA wiring + read-path org checks + audit_log PII redaction. Single bundled commit. Audit recommendation split into non-ledger / ledger-integrity per fix-stack-arc."

## Cross-references

- `docs/07_governance/audits/phase-1.2/action-plan.md` — QW-01 / QW-02 / QW-07.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-009 / UF-002 / UF-010.
- Phase 1.1 UF-002 carry-forward (read-path facet closed; mutation-surface remains Phase 2 / LT-01).
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — arc context.
- `docs/09_briefs/phase-1.2/session-26-brief.md` — next session in the arc.
- `docs/09_briefs/phase-2/obligations.md` — QW-06 deferral (logged by orchestrating session).

## Out of scope (do not do)

- QW-03 / QW-04 / QW-05 (S26).
- MT-01 atomicity RPC (S27).
- QW-06 conversation Zod validation (Phase 2).
- LT-01 / UF-006 service-mutation CI guard (Phase 2 / Phase 1.3).
- MT-06 pino redaction config expansion (Phase 2 follow-on).
- MT-03 read-path enforcement wrapper (Phase 2).
- Schema migrations.
- Orchestrator or prompt edits.

## Halt conditions

- Any verification step in Task 2 fails (middleware location drift, service-signature drift, missing test surfaces, baseline test failure).
- `pnpm agent:validate` or `pnpm test` regression caused by this session's edits.
- Any out-of-scope file appears in `git diff --stat`.
- Operator does not approve plan at Task 3 Step 5 — halt; revise or close.
- A grep-confirmed claim in this brief proves wrong at execution time — halt, surface, do not paper over.
