# Session 29a — Path C MT-03 Pattern A wrap mechanization

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S29a is service-layer wrap + comment-fix work; no orchestrator request fires).

**Goal:** Close Pattern A surface of MT-03 broad-scope. Route 16 Pattern A org-scoped service functions through `withInvariants` at their export sites, removing per-function manual `if (!ctx.caller.org_ids.includes(input.org_id)) throw ServiceError('ORG_ACCESS_DENIED', ...)` guards. Unify `withInvariants` pre-flight throws to `ServiceError` (eliminating the production-path 403→500 regression risk that 42 route handlers' `instanceof ServiceError` branches expose). Annotate Patterns D, G2, I as legitimate exceptions for S30's CI guard. Fix eight stale comments codifying convention-vs-mechanism asymmetry that S29a closes.

**Framing refinement from corrigendum.** Corrigendum at `7ba3455` cited "~18 Pattern A sites"; substrate-grounded grep at brief-creation confirmed **16 sites** (the canonical site list the corrigendum's Pattern landscape appendix enumerated is correct; the rounded count was high). Brief uses substrate-grounded numbers throughout per the fractal-substrate-fidelity codification (graduated this session at N=3).

**Architecture (V1 minimal scope):**

- **Wrap mechanization (16 Pattern A sites):** Inline wrap-at-export-site via `withInvariants(async (input, ctx) => { ... })` at the `export const xService = { fn: ... }` boundary (per ratified pre-decision (a)). Removes the 4-line hand-rolled guard; adds `withInvariants(` + `)` framing at the export. ~16 sites × ~3 lines saved per site = ~48 lines net removed at the wrap surface.
- **`withInvariants` throws unification (`α-class-unify`):** Change `withInvariants` Invariants 1-4 to throw `ServiceError` (with the existing codes — `MISSING_CONTEXT`, `MISSING_TRACE_ID`, `MISSING_CALLER`, `UNVERIFIED_CALLER`, `ORG_ACCESS_DENIED`, `PERMISSION_DENIED`) instead of `InvariantViolationError`. Single-site change at `src/services/middleware/withInvariants.ts`. Eliminates the production-path 403→500 regression risk: 42 route handlers' `if (err instanceof ServiceError) { ... }` branches all keep working unchanged. The 5 existing test sites that assert `InvariantViolationError` migrate to `ServiceError` in the same commit (bounded test-migration step).
- **Pattern D/G2/I annotation:** 6 sites gain canonical-form annotations `// withInvariants: skip-org-check (pattern-D|G2|I: <rationale-string>)` per ratified pre-decision (c). Pattern D: 3 sites in `userProfileService` (`getOrCreateProfile`, `getProfile`, `updateProfile`). Pattern G2: 2 sites (`taxCodeService.listShared`, `orgService.listIndustries`). Pattern I: 2 sites (`invitationService.acceptInvitation`, `invitationService.previewInvitationByToken`).
- **Eight comment fixes (a)–(e), (i), (j) re-framed, (k):** Listed in Task 4. Closes the convention-vs-mechanism documentary surface S29a's wrap-side closes mechanically.

**Tech stack:** TypeScript, Vitest. No new dependencies. No schema changes. No orchestrator or prompt edits. No route-handler edits (apart from the test-migration's import-statement updates to swap `InvariantViolationError` for `ServiceError`).

---

**Anchor (parent) SHA:** `3cedd05` — corrigendum SHA-fix-forward sibling commit. Verify HEAD's parent matches at Task 1 Step 2. Chain: `3cedd05` → `7ba3455` (Path C corrigendum + S29 split) → `5775ae6` (Path C arc summary) → `1400694` (S28 brief).

**Upstream authority:**
- `docs/09_briefs/phase-1.3/path-c-arc-summary.md` (post-corrigendum at `7ba3455`) — S29a entry; Pattern landscape appendix (canonical 9-pattern reference); Gate 3 + Gate 4 expected text (verification-harness alignment).
- `docs/07_governance/audits/phase-1.2/action-plan.md` — MT-03 (action-plan literal scope was "read-path enforcement wrapper"; corrigendum-broadened to nine-pattern landscape with S29a closing Pattern A).
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-002 (read-path org-check gap; S25 QW-02 closed two-method gap; S29a closes Pattern A's 16-site convention-vs-mechanism shape).
- `docs/07_governance/friction-journal.md` (Phase 2 section, tail entries 2026-04-29) — corrigendum NOTE; codification candidates ancestry (read-completeness threshold → fractal-substrate-fidelity).
- `src/services/middleware/withInvariants.ts` — wrap target; the file's file-top comment carries the line-2 mutation-only-framing internal contradiction that comment-fix item (a) reconciles.
- `src/services/errors/ServiceError.ts` — error class S29a unifies `withInvariants` throws to.
- `CLAUDE.md` — repo standing rules. The `service-architecture` skill applies to `src/services/` edits; standard test conventions apply to `tests/integration/` and `tests/unit/` edits.

---

## Session label
`s29a-brief` (brief-creation session label) → `S29a-mt-03-pattern-a-wrap` (execution session label, applied at Task 1 Step 1).

## Hard constraints (do not violate)

- **Out of scope:**
  - Pattern B sites (~17, route-handler-wrapped): stay as-is per ratified pre-decision (b). No route-handler-wrap migrations. No service-export-site wrap additions on Pattern B.
  - Pattern C sites (`journalEntryService.get`, `recurringJournalService.getTemplate`): S29b design-bearing migration. S29a leaves these untouched (no annotation, no wrap; LT-01(b) CI guard tolerates them as annotated-exception-pending per the corrigendum's Gate 4 calibration). Sub-finding from pre-flight: Pattern C/E sites have zero test coverage at the bounded-read surface; not S29a's gap to close.
  - Pattern E site (`recurringJournalService.getRun`): S29b design-bearing migration. Same disposition as Pattern C.
  - Pattern G1 sites (4: `orgService.getOrgProfile`, `addressService.listAddresses`, `membershipService.listOrgUsers`, `invitationService.listPendingInvitations`): security finding, separate friction-journal track per the corrigendum's "what stays open" table. S29a flags them in the closeout NOTE with the OQ-07-layer refinement (Firing 2 of the fractal candidate); does not remediate.
  - Pattern H site (`membershipService.listForUser`): dead code. Out of scope. Phase 2 cleanup workstream.
  - Pattern J / J-variant: helpers, not services. Out of scope.
  - Comment fixes (f), (g), (h): G1-conditional, deferred to G1 remediation session.
  - Phase 2 obligations (MT-02, MT-04, QW-06, UF-015, etc.).
  - Path A scope (DND-01 CORS/CSRF/rate-limiting, DND-04 pagination).
  - LT-01 CI-enforcement cluster (S30 scope; S29a's wrap-site state is the substrate S30's LT-01(b) guard fires against).
- **Test posture floor.** ALL existing tests green at HEAD post-edit. `pnpm agent:validate` clean. Full suite: any pre-existing carry-forwards documented at HEAD remain unchanged. No new failures attributable to this session beyond the bounded 5-site test-migration in `serviceMiddlewareAuthorization.test.ts` and `periodLockUnlock.test.ts`.
- **Hard constraint A — `withInvariants` throws unification preserves the InvariantViolationError class definition.** The 5 test sites that import `InvariantViolationError` migrate to import `ServiceError` instead, but `InvariantViolationError` itself stays defined in `src/services/middleware/errors.ts` for any future use the broader codebase has. Removing the class definition is out of S29a scope.
- **Hard constraint B — error codes preserve verbatim across the unification.** `ORG_ACCESS_DENIED`, `MISSING_CONTEXT`, `UNVERIFIED_CALLER`, etc. — same code strings, just thrown via `ServiceError` instead of `InvariantViolationError`. Tests pattern-matching on `.code === 'ORG_ACCESS_DENIED'` are unaffected.
- **Hard constraint C — annotation form is exact-string canonical.** Patterns D, G2, I annotation comments use the canonical form `// withInvariants: skip-org-check (pattern-X: rationale-string)` verbatim. The S30 LT-01(b) CI guard parses against this exact shape. Variant forms (different comment characters, different parenthesis style, missing pattern enum) would fail S30's guard and force a re-fix later.
- **Hard constraint D — Pattern A sites that do NOT match the canonical 16-site list stay untouched.** The site list is substrate-grounded at HEAD `3cedd05`; if a future session's substrate read finds a site that wasn't in the 16-site list (e.g., a new service file added between brief-creation and execution), execution surfaces it to operator before wrapping — could be a Pattern A scope expansion or a different pattern needing separate handling.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight. Re-verify at execution time before edit; halt on any drift. Substrate-grounded line numbers are parenthetical aids; text-anchors (the comment fragments enumerated in Task 4) are the load-bearing references. The S28 brief precedent applies: text-anchors over line numbers.
- **Additive-only on the route handler side.** S29a does not edit any route handler under `src/app/api/`. The 42 `instanceof ServiceError` branches stay verbatim — they keep working unchanged because (α-class-unify) makes withInvariants throw `ServiceError`. If any route-handler edit becomes necessary mid-execution (e.g., a route handler imports `InvariantViolationError`), halt and surface to operator.
- **Grep-stable anchors locked.**
  - Pattern A wrap sites: `ctx\.caller\.org_ids\.includes` (single grep across `src/services/` returns the 19-hit inventory; subtract the 2 expected non-Pattern hits + the 1 Pattern E hit to get the 16-site Pattern A surface).
  - `withInvariants` throws: search for `InvariantViolationError(` constructions in `withInvariants.ts`; replace each with `ServiceError(`.
  - Annotation form: `// withInvariants: skip-org-check (pattern-` (literal anchor for S30's CI guard parse).
  - Comment-fix anchors: per Task 4 table.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time; executor re-confirms the batch as a D1-shape preamble before touching code):

1. **Pre-decision (a) — refactor strategy: inline wrap-at-export-site for all 16 Pattern A sites.** Rationale: identical mechanical effect to a shared `withOrgAuth` helper, marginally fewer lines, more honest call-site surface (names the bible-canonical mechanism rather than a renamed indirection), aligns with the universal-wrapper codification target rather than a family-of-helpers shape. The counter-consideration on Pattern C/E specialized wrappers is correctly scoped to S29b — doesn't bind S29a's choice.

2. **Pre-decision (a)-sub — `α-class-unify`: change `withInvariants` to throw `ServiceError` instead of `InvariantViolationError`.** Substrate-grounded at brief-creation pre-flight: 5 `InvariantViolationError` hits outside `withInvariants.ts`/`errors.ts`, ALL test assertions (category a). Zero hits in catch blocks distinguishing pre-flight vs business-logic. Zero hits in central error-handling. Decision criterion match: (α-class-unify) holds with bounded test-migration step (5 sites, 2 files). No pivot to (α-ext). The 42 route-handler `instanceof ServiceError` branches keep working unchanged — eliminates the production-path 403→500 regression risk (the corrigendum's "test-suite delta" framing was substrate-elevated to "production-path regression" at brief-creation; the 42-route-handler figure is the actual blast radius).

3. **Pre-decision (b) — Pattern B stays route-handler-wrapped.** Pattern B's structural shape is correct as-is; the convention-vs-mechanism gap S29a closes is specifically about Pattern A reads going through hand-rolled guards instead of `withInvariants`. Action-as-load-bearing-distinction (Invariant 4 role-gating is per-call-site and body-discriminated) is decisive; export-site wrap can't carry that without baking-in or shifting selection into the body. Journal-entries POST handler's `INV-SERVICE-001 wrap site` comment is deliberate convention-codification.

4. **Pre-decision (c) — canonical annotation form `// withInvariants: skip-org-check (pattern-X: rationale-string)`.** Three pattern-specific rationales:
   - Pattern D: `// withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)`
   - Pattern G2: `// withInvariants: skip-org-check (pattern-G2: globally-shared reference data, RLS allows authenticated read)`
   - Pattern I: `// withInvariants: skip-org-check (pattern-I: token-bearer authorization, in-body validation)`
   Sub-ratification: `_ctx`/`ctx` parameter-name uniformity NOT required (sites keep current usage; `updateProfile`'s `ctx` is genuinely consumed for trace_id + recordMutation; renaming would be incorrect). Sub-ratification: annotation independent of `ctx`-presence (covers `previewInvitationByToken` despite no `ctx` parameter; CI guard's AST/regex match doesn't gate on parameter shape).

5. **Pre-decision (d) — integrated pre-flight specification ratified.** Five sub-items run as single substrate sweep at brief-creation; pre-flight findings folded into this brief's "Pre-flight findings" section below. No pivot conditions surfaced. (α-class-unify) holds. Pattern A site count is 16 (refines corrigendum's ~18 approximation). Comment-fix anchor refinements applied for items (e) and (k). Pattern C/E zero-test-coverage sub-finding flagged for closeout NOTE (informs LT-02/S31 scope).

6. **Estimated session duration: ~1-2 days.** 16 wrap-site mechanical edits (~1.5 hours) + withInvariants throws unification (~30 min) + 5-site test-migration (~30 min) + 6-site annotation pass (~30 min) + 8-comment-fix pass (~1 hour) + full-suite regression (~1 hour) + friction-journal NOTE drafting (~1 hour) + review buffer.

7. **Y2 commit shape: single bundled commit by default.** Wrap + unification + test-migration + annotations + comment-fixes share the same convention-vs-mechanism closure; bundling matches S25's three-QW-bundled precedent and S28's MT-05+MT-06 bundling. Y2 split available if net diff exceeds ~150 lines (operator's call at execution).

OPEN — operator to resolve before Session start (none flagged at brief-write; all decisions above resolved):

_none_

---

## Pre-flight findings (substrate-grounded reference at HEAD `3cedd05`)

### Pattern A site list (16 sites; canonical for execution scope)

| Site | File | Line |
|---|---|---|
| 1 | `chartOfAccountsService.list` | `chartOfAccountsService.ts:20` |
| 2 | `chartOfAccountsService.get` | `chartOfAccountsService.ts:57` |
| 3 | `periodService.listOpen` | `periodService.ts:29` |
| 4 | `periodService.isOpen` | `periodService.ts:58` |
| 5 | `periodService.lock` | `periodService.ts:111` |
| 6 | `periodService.unlock` | `periodService.ts:198` |
| 7 | `accountBalanceService.get` | `accountBalanceService.ts:57` |
| 8 | `journalEntryService.list` | `journalEntryService.ts:381` |
| 9 | `accountLedgerService.get` | `accountLedgerService.ts:87` |
| 10 | `aiActionsService.list` | `aiActionsService.ts:42` |
| 11 | `recurringJournalService.listTemplates` | `recurringJournalService.ts:665` |
| 12 | `recurringJournalService.listRuns` | `recurringJournalService.ts:724` |
| 13 | `reportService.profitAndLoss` | `reportService.ts:179` |
| 14 | `reportService.trialBalance` | `reportService.ts:220` |
| 15 | `reportService.balanceSheet` | `reportService.ts:315` |
| 16 | `reportService.accountsByType` | `reportService.ts:385` |

### `InvariantViolationError` migration sites (5 sites; bounded test-migration scope)

| File | Hits | Migration |
|---|---|---|
| `tests/integration/serviceMiddlewareAuthorization.test.ts` | 3 (import + test description + `rejects.toThrow(InvariantViolationError)`) | Replace import + assertion with `ServiceError`; preserve test descriptions (rename "throws InvariantViolationError" → "throws ServiceError" at line 46). |
| `tests/integration/periodLockUnlock.test.ts` | 2 (import + assertion at line 310) | Replace import + assertion with `ServiceError`. |

### Pattern B test coverage (~17 sites; behavior-unchanged spot-check at execution)

18 test files exercise Pattern B mutations: `accountBalanceService.test.ts`, `accountLedgerService.test.ts`, `addressServiceAudit.test.ts`, `adjustmentEntry.test.ts`, `conversationLoadEndpoint.test.ts`, `inviteAcceptFlow.test.ts`, `inviteRevokeReinvite.test.ts`, `journalEntryPeriodDateRange.test.ts`, `orgUsersViewInvite.test.ts`, `ownerProtection.test.ts`, `postJournalEntryRpcRollback.test.ts`, `recurringJournal.test.ts`, `reportAccountsByType.test.ts`, `reportBalanceSheet.test.ts`, `reportProfitAndLoss.test.ts`, `reportTrialBalance.test.ts`, `reversalMirror.test.ts`, `serviceMiddlewareAuthorization.test.ts`. Spot-check scope at S29a Task 6: confirm these tests pass unchanged.

### Pattern C/E test coverage (zero coverage at bounded-read surface)

Zero test files exercise `journalEntryService.get`, `recurringJournalService.getTemplate`, or `recurringJournalService.getRun`. Sub-finding for closeout NOTE; informs LT-02/S31 scope.

### Pattern G1 test coverage (3 files exercise the 4 sites)

`tests/integration/listOrgUsers.test.ts`, `tests/integration/orgProfileEditorAuthz.test.ts`, `tests/integration/orgUsersViewRender.test.ts`. Behavior unchanged under S29a (G1 is out-of-scope until separate remediation).

### Comment-fix anchor table (substrate-confirmed)

| Item | Anchor (text-stable) | File:line |
|---|---|---|
| (a) | `mutating service call is authorized` | `withInvariants.ts:2` (within :2-16 file-top block) |
| (b) | `Phase 12A pattern for read functions` | `chartOfAccountsService.ts:18` (inside `list()`'s body) |
| (c) | `Writes get this check from withInvariants` | `journalEntryService.ts:379` (inside `list()`'s body) |
| (d) | `No withInvariants wrapping — these are queries` | `reportService.ts:3` (file-top; line 2 stays as-is — anchor cite narrowed from :2-3 range to :3 single-line) |
| (e) | `Inline org_access check — reads do not go through withInvariants` | `aiActionsService.ts:41` (inside `list()`'s body) |
| (i) | `INV-SERVICE-001 export contract: plain unwrapped functions` | `invitationService.ts:3` (file-top) |
| (j) | `Read paths (listTemplates, getTemplate, listRuns, getRun)` | `recurringJournalService.ts:6` (file-top) |
| (k) | `exports post/list/get as unwrapped` | `journalEntryService.ts:2` (file-top) |

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| S29a-wrap | UF-002 (Pattern A facet) | 16 Pattern A sites across 8 files | All 16 hand-rolled `if (!ctx.caller.org_ids.includes(input.org_id)) throw ServiceError('ORG_ACCESS_DENIED', ...)` guards are removed; each function wrapped via `withInvariants(async (input, ctx) => { ... })` at the export site. `grep -rnE "ctx\.caller\.org_ids\.includes" src/services/` returns exactly 3 hits: `withInvariants.ts:64`, `canUserPerformAction.ts:66`, `recurringJournalService.ts:782` (Pattern E). | All 16 wrap-target sites' tests pass unchanged (Pattern A spot-check). | Gate 3 MT-03-wrap-coverage |
| S29a-unify | (no UF; production-path regression prevention) | `src/services/middleware/withInvariants.ts`; `src/services/middleware/errors.ts` (preserved); 2 test files (5 sites total) | `withInvariants` Invariants 1-4 throw `ServiceError` with existing codes (`MISSING_CONTEXT`, `MISSING_TRACE_ID`, `MISSING_CALLER`, `UNVERIFIED_CALLER`, `ORG_ACCESS_DENIED`, `PERMISSION_DENIED`); `serviceMiddlewareAuthorization.test.ts` and `periodLockUnlock.test.ts` updated to import + assert `ServiceError`. `grep -rn "InvariantViolationError" src/ tests/` returns hits ONLY in `src/services/middleware/errors.ts` (definition preserved per Hard constraint A) and `src/services/middleware/withInvariants.ts` (no longer imports it post-unification — verify zero hits in `withInvariants.ts`). | 42 route handlers' `instanceof ServiceError` branches all work unchanged on cross-org-deny (verified by Pattern A spot-check tests + the 5-site test-migration green). | (none — internal regression prevention) |
| S29a-annotate | UF-002 (annotation facet) | 7 sites (3 Pattern D + 2 Pattern G2 + 2 Pattern I); 7 single-line annotation additions. | Each Pattern D, G2, I site has the canonical-form annotation `// withInvariants: skip-org-check (pattern-X: rationale-string)` immediately above the function definition. `grep -rn "// withInvariants: skip-org-check" src/services/` returns exactly 7 hits (3 D + 2 G2 + 2 I). | (none — purely additive comments) | Gate 3 MT-03-wrap-coverage (annotated-exception case); Gate 4 LT-01(b) (annotation form parseable by future CI guard) |
| S29a-comments | UF-002 (documentary facet) | 8 comment fixes per the anchor table | All 8 comments updated to reflect post-S29a state: convention-vs-mechanism asymmetry framing replaced with universal-wrap framing; `withInvariants` named uniformly as the wrap mechanism; line-2 contradiction in `withInvariants.ts` reconciled to universal framing. Substrate verification: `grep` against the 8 anchors should return updated text (not the pre-S29a phrasing). | (none — purely documentary) | Gate 3 MT-03-withInvariants-comment (item (a) directly satisfies the harness check) |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S29a-mt-03-pattern-a-wrap
```

Then export in your shell:

```bash
export COORD_SESSION='S29a-mt-03-pattern-a-wrap'
```

Verify lock present:

```bash
cat .coordination/session-lock.json
```

Expected: lock contents include `"session": "S29a-mt-03-pattern-a-wrap"`, fresh `started_at` timestamp, current PID.

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit is the S29a brief-creation commit (single file: `docs/09_briefs/phase-1.3/session-29a-brief.md`); parent is `3cedd05` (corrigendum SHA-fix-forward); grandparent is `7ba3455` (Path C corrigendum); great-grandparent is `5775ae6` (Path C arc summary). If any drift, halt and surface to operator.

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

---

## Task 2: Convention #8 verify-directly — re-confirm pre-flight findings against HEAD

The brief's Pre-flight findings section was substrate-grounded at brief-creation HEAD `3cedd05`. Re-verify before any edit. Halt on drift.

- [ ] **Step 1: Re-verify Pattern A site count**

```bash
grep -rnE "ctx\.caller\.org_ids\.includes" src/services/ | wc -l
```

Expected: 19 hits total. If the count drifts, surface — could be a new Pattern A site (scope expansion candidate) or a removed site (scope contraction candidate).

- [ ] **Step 2: Re-verify `InvariantViolationError` blast radius**

```bash
grep -rn "InvariantViolationError" src/ tests/ | grep -v "withInvariants.ts\|middleware/errors.ts" | wc -l
```

Expected: 5 hits across 2 files. If any non-test hits surface (e.g., a new catch block distinguishing pre-flight from business-logic), halt and surface — pivot decision (`α-class-unify` → `α-ext`) becomes operator-pending.

- [ ] **Step 3: Re-verify route-handler `instanceof ServiceError` branches**

```bash
grep -rn "instanceof ServiceError" src/app/api/ | wc -l
```

Expected: 42 hits (production-path regression scope; should not change post-S29a since route handlers stay untouched).

- [ ] **Step 4: Re-verify the 8 comment-fix anchors**

```bash
grep -n "mutating service call is authorized" src/services/middleware/withInvariants.ts
grep -n "Phase 12A pattern for read functions" src/services/accounting/chartOfAccountsService.ts
grep -n "Writes get this check from withInvariants" src/services/accounting/journalEntryService.ts
grep -n "No withInvariants wrapping" src/services/reporting/reportService.ts
grep -n "Inline org_access check" src/services/agent/aiActionsService.ts
grep -n "INV-SERVICE-001 export contract: plain unwrapped functions" src/services/org/invitationService.ts
grep -n "Read paths (listTemplates, getTemplate, listRuns, getRun)" src/services/accounting/recurringJournalService.ts
grep -n "exports post/list/get as unwrapped" src/services/accounting/journalEntryService.ts
```

Each command should return exactly one line. Halt on any zero-hit (anchor missing — substrate drift) or multi-hit (anchor not unique — needs refinement).

---

## Task 3: Wrap mechanization (16 Pattern A sites)

Sequencing: edit one file at a time; run that file's tests after each edit before moving to the next file; bundle all wrap edits into the single commit at Task 7. The site list per file:

- `chartOfAccountsService.ts`: 2 sites (`list`, `get`)
- `periodService.ts`: 4 sites (`listOpen`, `isOpen`, `lock`, `unlock`)
- `accountBalanceService.ts`: 1 site (`get`)
- `journalEntryService.ts`: 1 site (`list`) — note that `post` (Pattern B) and `get` (Pattern C) stay untouched
- `accountLedgerService.ts`: 1 site (`get`)
- `aiActionsService.ts`: 1 site (`list`)
- `recurringJournalService.ts`: 2 sites (`listTemplates`, `listRuns`) — note that mutations (Pattern B) and `getRun`/`getTemplate` (Patterns E/C) stay untouched
- `reportService.ts`: 4 sites (`profitAndLoss`, `trialBalance`, `balanceSheet`, `accountsByType`)

- [ ] **Step 1: Per-site edit pattern**

For each site:

(a) Locate the `if (!ctx.caller.org_ids.includes(input.org_id)) throw new ServiceError('ORG_ACCESS_DENIED', ...)` block.

(b) Remove the 4-line block (the `if`, the `throw`, the closing brace, and the trailing blank line) AND any immediately-preceding comment block whose text-anchor matches comment-fix items (b), (c), or (e) per the comment-fix anchor table. The orphan-comment cleanup is part of the wrap-site edit; without it, items (b), (c), (e) leave dangling comments above wrapped functions and Task 6 Step 9's verification grep would still find the pre-S29a anchor strings.

(c) Wrap the function definition in `withInvariants(...)`. Two structural cases:
- **Object-literal export** (e.g., `chartOfAccountsService = { list: async (input, ctx) => {...}, ... }`): replace `list: async (input, ctx) => {...}` with `list: withInvariants(async (input, ctx) => {...})`.
- **Standalone-function-then-bundle** (e.g., `journalEntryService.ts`'s `async function list(...) {...}` then `export const journalEntryService = { post, list, get }`): the wrap goes at the export bundle, not the function declaration. Replace `{ post, list, get }` with `{ post, list: withInvariants(list), get }`.

(d) Add `import { withInvariants } from '@/services/middleware/withInvariants';` at the file top if not already imported.

(e) Run that file's tests:

```bash
pnpm test <serviceName>
```

Expected: all green.

- [ ] **Step 2: Final wrap-site grep verification**

After all 16 sites are wrapped:

```bash
grep -rnE "ctx\.caller\.org_ids\.includes" src/services/
```

Expected: exactly 3 hits — `withInvariants.ts:64`, `canUserPerformAction.ts:66`, `recurringJournalService.ts:782` (Pattern E). Any additional hits indicate an unwrapped Pattern A site; halt and re-check the wrap.

- [ ] **Step 3: Run agent:validate** to verify Pattern A spot-check + Category A floor:

```bash
pnpm agent:validate
```

Expected: 26/26 green.

---

## Task 4: `withInvariants` throws unification (`α-class-unify`)

- [ ] **Step 1: Edit `src/services/middleware/withInvariants.ts`**

Replace each `throw new InvariantViolationError(...)` with `throw new ServiceError(...)`. Six replacements expected (Invariants 1, 2, 3, 4 cover six error sites: MISSING_CONTEXT, MISSING_TRACE_ID, MISSING_CALLER, UNVERIFIED_CALLER, ORG_ACCESS_DENIED, PERMISSION_DENIED).

Update the import statement: replace `import { InvariantViolationError } from './errors';` with `import { ServiceError } from '@/services/errors/ServiceError';` (if not already imported — it may not be; the existing imports use `InvariantViolationError`).

- [ ] **Step 2: Edit `tests/integration/serviceMiddlewareAuthorization.test.ts`**

(a) Update import: replace `import { InvariantViolationError } from '@/services/middleware/errors';` with `import { ServiceError } from '@/services/errors/ServiceError';`.

(b) Update test description at line 46: `'throws InvariantViolationError before any DB write'` → `'throws ServiceError before any DB write'`.

(c) Update assertion at line 101: `rejects.toThrow(InvariantViolationError)` → `rejects.toThrow(ServiceError)`.

- [ ] **Step 3: Edit `tests/integration/periodLockUnlock.test.ts`**

(a) Update import at line 16: `import { InvariantViolationError } from '@/services/middleware/errors';` → `import { ServiceError } from '@/services/errors/ServiceError';`.

(b) Update assertion at line 310: `rejects.toThrow(InvariantViolationError)` → `rejects.toThrow(ServiceError)`.

- [ ] **Step 4: Run the 2 migrated test files**

```bash
pnpm test serviceMiddlewareAuthorization periodLockUnlock
```

Expected: both green.

- [ ] **Step 5: Verify `InvariantViolationError` reach is fully bounded**

```bash
grep -rn "InvariantViolationError" src/ tests/
```

Expected: hits ONLY in `src/services/middleware/errors.ts` (class definition; Hard constraint A preserves it). Zero hits in `src/services/middleware/withInvariants.ts`. Zero hits in `tests/`. If any hit remains in `tests/` or `withInvariants.ts`, the migration missed a site; halt and re-check.

---

## Task 5: Pattern D, G2, I annotation pass

7 sites total (3 D + 2 G2 + 2 I). Each gets the canonical-form single-line annotation immediately above the function.

- [ ] **Step 1: Pattern D annotations (3 sites in `userProfileService.ts`)**

For each of `getOrCreateProfile`, `getProfile`, `updateProfile`:

```typescript
// withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)
async functionName(...) { ... }
```

Note: `_ctx`/`ctx` parameter names stay verbatim per pre-decision (c)-sub-1. `updateProfile`'s `ctx` is genuinely consumed; do not rename.

- [ ] **Step 2: Pattern G2 annotations (2 sites)**

For `taxCodeService.listShared` and `orgService.listIndustries`:

```typescript
// withInvariants: skip-org-check (pattern-G2: globally-shared reference data, RLS allows authenticated read)
async functionName(...) { ... }
```

- [ ] **Step 3: Pattern I annotations (2 sites in `invitationService.ts`)**

For `acceptInvitation` and `previewInvitationByToken`:

```typescript
// withInvariants: skip-org-check (pattern-I: token-bearer authorization, in-body validation)
async functionName(...) { ... }
```

Note: `previewInvitationByToken(token: string)` has no `ctx` parameter; annotation applies regardless per pre-decision (c)-sub-2.

- [ ] **Step 4: Verify annotation form uniformity**

```bash
grep -rn "// withInvariants: skip-org-check" src/services/
```

Expected: exactly 7 hits, each matching the canonical form `// withInvariants: skip-org-check (pattern-[DGI]2?: <rationale-string>)`. Halt on any variant form (different parens, missing pattern enum, etc.) — Hard constraint C requires the exact-string canonical form for S30's CI guard.

---

## Task 6: Eight comment fixes

Each fix updates the named anchor's comment to reflect post-S29a state. Per the discipline carry-over: text-anchors are load-bearing, line numbers parenthetical.

- [ ] **Step 1: Item (a) — `withInvariants.ts:2-16` internal contradiction reconciliation**

Anchor: `mutating service call is authorized` (line 2).

Change line 2 from:
```
// INV-AUTH-001 (primary): every mutating service call is authorized before the function body runs.
```
to:
```
// INV-AUTH-001 (primary): every service call (read or mutation) is authorized before the function body runs.
```

Verify the rest of the file-top comment block (lines 3-16) reads consistently with universal framing. The existing lines 4 ("Every service function in src/services/...") and 14-16 ("Every PR that introduces a service function MUST wire it through withInvariants") already say universal; line 2 was the contradiction, now resolved.

- [ ] **Step 2: Item (b) — `chartOfAccountsService.ts:17-19` false-premise comment**

Anchor: `Phase 12A pattern for read functions` (line 18).

The pre-S29a comment in `list()`:
```
// Authorization: caller must be a member of the requested org.
// Matches Phase 12A pattern for read functions (writes use
// withInvariants Invariant 3 instead).
```

Post-S29a: the manual block is removed (Task 3). The comment goes with it. **No replacement comment needed** — the wrap itself is self-documenting; readers see `withInvariants(...)` at the export.

- [ ] **Step 3: Item (c) — `journalEntryService.ts:378-381` false-premise comment**

Anchor: `Writes get this check from withInvariants` (line 379).

Same disposition as item (b): the manual block (and surrounding 3-line comment) is removed at Task 3 along with the guard. No replacement.

- [ ] **Step 4: Item (d) — `reportService.ts:2-3` file-top convention-vs-mechanism codification**

Anchor: `No withInvariants wrapping — these are queries` (line 3).

Change from:
```
// migration 0007. No withInvariants wrapping — these are queries, not mutations.
```
to:
```
// migration 0007. All read functions wrap through withInvariants at their export sites (S29a).
```

- [ ] **Step 5: Item (e) — `aiActionsService.ts:41` body comment**

Anchor: `Inline org_access check — reads do not go through withInvariants` (line 41).

Same disposition as items (b) and (c): the manual block is removed at Task 3 along with the comment.

- [ ] **Step 6: Item (i) — `invitationService.ts:1-7` file-top INV-SERVICE-001**

Anchor: `INV-SERVICE-001 export contract: plain unwrapped functions` (line 3).

Change the file-top to reflect Pattern B (mutations route-handler-wrapped) without claiming all functions in the file are unwrapped. Specific text-edit: change line 3 from:
```
// INV-SERVICE-001 export contract: plain unwrapped functions.
```
to:
```
// INV-SERVICE-001 export contract: mutating functions (inviteUser, revokeInvitation, resendInvitation) are
// route-handler-wrapped via withInvariants. Read function listPendingInvitations is currently unwrapped
// pending Pattern G1 remediation. Token-bearer functions (acceptInvitation, previewInvitationByToken) carry
// pattern-I skip-org-check annotations per S29a.
```

- [ ] **Step 7: Item (j) re-framed — `recurringJournalService.ts:1-9` file-top**

Anchor: `Read paths (listTemplates, getTemplate, listRuns, getRun)` (line 6).

Substrate-grounded re-framing per the corrigendum. Change line 6 (and the relevant surrounding context) from claiming all 4 read paths "check org membership inline" to:
```
// Read paths: listTemplates and listRuns wrap through withInvariants at their export sites (S29a;
// Pattern A). getTemplate (Pattern C) and getRun (Pattern E) currently check inline; deferred to
// S29b for design-bearing migration to entity-id-only authorization. Mutations (createTemplate,
// updateTemplate, deactivateTemplate, generateRun, approveRun, rejectRun) are route-handler-wrapped
// via withInvariants per Pattern B.
```

- [ ] **Step 8: Item (k) — `journalEntryService.ts:1-7` file-top**

Anchor: `exports post/list/get as unwrapped` (line 2).

Change the file-top to reflect post-S29a state. Specifically, change line 2 from:
```
// INV-SERVICE-001 export contract (structural): this module exports post/list/get as unwrapped
```
to:
```
// INV-SERVICE-001 export contract (structural): this module exports post as unwrapped (route-handler-
// wrapped via withInvariants; Pattern B). list wraps through withInvariants at its export site (S29a;
// Pattern A). get is currently unwrapped pending S29b's design-bearing migration (Pattern C; entity-id-
// only authorization).
```

- [ ] **Step 9: Verify all 8 anchor edits**

After all 8 fixes:

```bash
grep -n "every service call (read or mutation) is authorized" src/services/middleware/withInvariants.ts
grep -n "All read functions wrap through withInvariants" src/services/reporting/reportService.ts
grep -n "S29a; Pattern A" src/services/accounting/journalEntryService.ts src/services/accounting/recurringJournalService.ts src/services/org/invitationService.ts
```

Expected: each command returns hits on the updated text. Pre-S29a anchor strings (`mutating service call is authorized`, `Phase 12A pattern for read functions`, etc.) should NOT appear in their original contexts (the manual blocks they were embedded in are removed).

---

## Task 7: Full-suite regression

- [ ] **Step 1: agent:validate**

```bash
pnpm agent:validate 2>&1 | tail -20
```

Expected: 26/26 green.

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck 2>&1 | tail -10
```

Expected: clean.

- [ ] **Step 3: full vitest suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: pre-existing carry-forward count unchanged; the 5 migrated test sites green; all 16 wrap-target sites' tests pass; the 18 Pattern B test files pass unchanged; the 3 Pattern G1 test files pass unchanged.

If carry-forward count drifts (e.g., the `accountLedgerService` running-balance fragility cases behave differently under the wrap), capture the drift state for the friction-journal NOTE — do not remediate (Phase 2 obligation per the corrigendum).

---

## Task 8: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. Eleven-element inventory per the brief-creation session's running list (folded into a single NOTE block):

1. **UF-002 closure citation (Pattern A facet) at S29a commit SHA** (placeholder; substituted post-commit per Y2-fixup pattern, NOT placeholder-and-amend per the prior session's self-reference flaw finding). Cite specific surfaces closed: 16 Pattern A wrap sites; `withInvariants` throws unification (α-class-unify); 7 legitimate-exception annotations (Patterns D/G2/I); 8 comment fixes; bounded test-migration (5 sites, 2 files).

2. **Severity-elevation finding (substrate-quantified):** Corrigendum's "test-suite delta" framing was reframed at brief-creation as "production-path 403→500 regression"; substrate sweep quantified the blast radius to 42 route handlers (`instanceof ServiceError` branches in `src/app/api/`). Eliminated by (α-class-unify).

3. **Fractal-substrate-fidelity codification candidate graduates at N=3** within S29a brief-creation. Codified as sibling of Convention #8 sub-shape #3 (assumption-vs-implementation). Codified shape: "Substrate fidelity is fractal — appendix descriptions, upstream framings, and mid-session substrate claims can all over-generalize and need substrate-re-derivation at use time, regardless of source artifact's recency or claim-author's confidence. Verify-before-assert applies recursively at every layer of inheritance from substrate to claim." Provenance: Firing 1 = Pattern D shape-divergence (corrigendum's "_ctx underscore-unused" elided updateProfile's ctx usage); Firing 2 = G1 OQ-07 citation layer (corrigendum's "RLS-relies-but-uses-adminClient" elided the OQ-07-resolved-decision framing); Firing 3 = item (c) anchor location (mid-session substrate claim of :351-353 was substrate-wrong; corrigendum's :378-383 was correct; agent's own derivation was the third firing).

4. **Pattern A site count substrate-correction:** Corrigendum's "~18 sites" was approximation; substrate-grounded count is 16. Concrete instance under the fractal-fidelity convention.

5. **Pattern D shape-divergence sub-finding** (folded as Firing 1 of fractal candidate; rationale uniform but `_ctx`/`ctx` parameter usage divergent within pattern).

6. **G1 finding-shape refinement (OQ-07 citation layer):** Corrigendum's G1 framing ("comment factually wrong about RLS coverage") substrate-refined to "comment cites resolved-decision document the code doesn't honor" (orgService.getOrgProfile cites OQ-07's "rely on RLS at DB level + route handler check" but uses adminClient and has no route-handler check). Severity assessment for G1 remediation refines from "comment fix" to "missing-mechanism-or-misremembered-OQ-resolution discriminator."

7. **Comment-fix scope-gap finding:** Item (k) — `journalEntryService.ts:1-7` file-top — was missing from the corrigendum's seven-item scope; added during brief-creation to make eight non-security fixes total. (j)-framing also amended to substrate-grounded staleness on `listTemplates`/`listRuns` (the data-access-discipline-vs-auth angle the corrigendum captured was less material than the actual file-top staleness post-wrap).

8. **Agent-side capability misrepresentation (over-claim direction):** Four prior firings of "lock acquired but no on-disk substrate" collapsed into one structural finding: the human-as-narrator was describing script execution they cannot perform. Resolution: passive/instructional voice from non-executing parties; verify-after-acquire is the discipline that catches the failure mode.

9. **Capability-symmetry sub-finding (under-claim direction):** Brief-creation surfaced the inverse — the agent (with Bash/Edit/Write capabilities) had narrated read-only filesystem framing for itself, mirroring the over-claim direction's failure mode but in reverse. N=1; pairs with #8 as bidirectional siblings under the same substrate-vs-claim discipline.

10. **Gate-cadence-calibration sub-finding:** Discipline-layer observation that gate cadence is itself a discipline, not a fixed rule. Structural decisions earn sub-gates ((a), (b), (c)); mechanical pre-flights earn integrated specification ((d)'s five-sub-item single-sweep design). N=1; sibling of substrate-re-derivation/fractal-fidelity at the rhythm-of-discipline layer rather than substrate-grounding-of-claims layer.

11. **Pattern C/E zero-test-coverage sub-finding:** Pre-flight (d)(iii) surfaced that Pattern C/E's three sites (journalEntryService.get, recurringJournalService.getTemplate, recurringJournalService.getRun) have zero test files exercising them at the bounded-read surface. S29b's design-bearing migration would land against an untested-shape baseline. Operator-decision item for LT-02/S31 scope: should S29b's pre-flight add C/E test coverage (in scope or sibling), or should LT-02/S31 absorb the gap?

NOTE plan formatting follows the existing tail entries' shape (date prefix, lead-line, lettered or numbered sub-elements as appropriate to length).

- [ ] **Step 2: Stage all changes**

```bash
git add src/services/middleware/withInvariants.ts \
        src/services/accounting/chartOfAccountsService.ts \
        src/services/accounting/periodService.ts \
        src/services/accounting/accountBalanceService.ts \
        src/services/accounting/journalEntryService.ts \
        src/services/accounting/recurringJournalService.ts \
        src/services/accounting/taxCodeService.ts \
        src/services/reporting/reportService.ts \
        src/services/reporting/accountLedgerService.ts \
        src/services/agent/aiActionsService.ts \
        src/services/user/userProfileService.ts \
        src/services/org/orgService.ts \
        src/services/org/invitationService.ts \
        tests/integration/serviceMiddlewareAuthorization.test.ts \
        tests/integration/periodLockUnlock.test.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 16 files staged (13 service files + 2 test files + friction-journal). No untracked files outside this set. If a route handler shows up in the staged list, halt — Hard constraint "no route-handler edits" was violated.

- [ ] **Step 3: Commit (Y2-shape: NO placeholder-and-amend strategy)**

Per the prior session's self-reference flaw finding (commit `3cedd05`'s body): do NOT use placeholder-and-amend for the friction-journal NOTE's SHA reference. The NOTE refers to "this commit" generically rather than citing a specific SHA, OR uses Y2-split (commit code + tests + comment fixes; sibling commit fixes the NOTE SHA reference referencing the now-stable first SHA).

**Default: NOTE refers to "this commit family" generically; no SHA reference in the NOTE body; single bundled commit.**

Subject (under 70 chars): `feat(services): S29a MT-03 Pattern A wrap mechanization + α-class-unify`

Body covers:
- 16 Pattern A sites wrapped via withInvariants at export-site (per pre-decision (a)).
- withInvariants throws unified to ServiceError (α-class-unify; eliminates 42-route-handler 403→500 regression risk).
- 7 Pattern D/G2/I sites annotated with canonical-form `// withInvariants: skip-org-check (...)` for S30 LT-01(b) CI guard.
- 8 comment fixes close convention-vs-mechanism documentary surface.
- Bounded test-migration (5 sites, 2 files: serviceMiddlewareAuthorization.test.ts + periodLockUnlock.test.ts).
- UF-002 (Pattern A facet) closure cited; UF-002's broader closure pending S29b (Patterns C/E).
- Friction-journal NOTE in same commit per S25/S26/S27 governance precedent.

Do NOT include `Co-Authored-By` unless operator-confirmed at closeout.

- [ ] **Step 4: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the S29a commit SHA.

- [ ] **Step 5: Session end**

```bash
bash scripts/session-end.sh
```

Lock release; COORD_SESSION unset.

- [ ] **Step 6: Surface S29a closeout to operator**

Single message summarizing:
- Commit SHA.
- 16 Pattern A sites wrapped (per Task 3).
- α-class-unify result: 5-site test-migration green; 42 route handlers' branches unchanged.
- 7 annotations added.
- 8 comment fixes applied.
- Pre-flight findings → execution outcomes mapping (any drift, any unexpected hits).
- Friction-journal NOTE summary (the 11-element inventory).
- S30 unblocked: brief-creation session for S30 opens against S29a closeout SHA. S29b sequences after S30 per the corrigendum's revised dependency graph.
- G1 finding-shape refinement: surface the OQ-07-layer refinement to operator with explicit decision-fork (severity-assessment + remediation-options).
- Pattern C/E zero-test-coverage finding: surface to operator with LT-02/S31 scope-decision pending.

---

## Verification harness alignment

S29a's exit-criteria map to the Path C arc-summary verification harness Gate 3 (post-corrigendum) checks. At S29a closeout, the harness's mechanical checks should fire:

**Gate 3: MT-03 closed — every org-scoped service export wraps through withInvariants**
- `MT-03-wrap-coverage` — `grep -rnE "ctx\.caller\.org_ids\.includes" src/services/` returns 3 hits (withInvariants.ts:64, canUserPerformAction.ts:66, recurringJournalService.ts:782 Pattern E pending S29b). 16 Pattern A sites no longer match.
- `MT-03-withInvariants-comment` — file-top comment at withInvariants.ts:2 reconciled to universal framing (item (a) closed).
- `MT-03-no-bypass-test` — `serviceMiddlewareAuthorization.test.ts` exercises the wrap-fires assertion.

Gate 4 LT-01(b) calibrates against this state at S30 brief-creation. Gate 3 also covers Patterns C/E pending S29b — annotated-exception pass-through under the corrigendum's calibration note.

---

## Friction-journal NOTE plan (summary; full text in Task 8 Step 1)

Eleven elements (the running closeout NOTE inventory from brief-creation):

1. UF-002 (Pattern A facet) closure
2. Severity-elevation substrate-quantification (42 route handlers)
3. Fractal-substrate-fidelity codification (graduated at N=3; three-firing provenance)
4. Pattern A site count substrate-correction (16, not ~18)
5. Pattern D shape-divergence (Firing 1 of fractal candidate)
6. G1 finding-shape refinement (OQ-07 layer; Firing 2)
7. Comment-fix scope-gap (item (k) added; (j) re-framed)
8. Agent-side capability misrepresentation (over-claim; four-firings collapsed)
9. Capability-symmetry sub-finding (under-claim; bidirectional sibling)
10. Gate-cadence-calibration sub-finding (rhythm-of-discipline layer)
11. Pattern C/E zero-test-coverage (LT-02/S31 scope-decision pending)

---

## Out-of-scope explicit list (recap for executor reference)

1. **Pattern B sites (~17)** — stay route-handler-wrapped per pre-decision (b). No service-export-site wrap.
2. **Patterns C and E (3 sites)** — S29b design-bearing migration; entity-id-only signatures requiring withInvariants overload OR input-shape refactor.
3. **Pattern G1 sites (4)** — security finding, separate friction-journal track. S29a flags with OQ-07-layer refinement.
4. **Pattern H site** — dead code; Phase 2 cleanup.
5. **Patterns J / J-variant** — auth helpers / loadOrgContext-shape; out of service surface.
6. **Comment fixes (f), (g), (h)** — G1-conditional; deferred.
7. **Phase 2 obligations** — MT-02, MT-04, QW-06, UF-015, etc.
8. **Path A scope** — DND-01..05.
9. **LT-01 CI-enforcement cluster** — S30 scope.
10. **Route-handler edits** — `src/app/api/` files stay untouched. `instanceof ServiceError` branches at 42 sites work unchanged under (α-class-unify).
11. **`InvariantViolationError` class definition removal** — preserved per Hard constraint A; future use possible.
12. **Pattern C/E test coverage addition** — pending operator decision in LT-02/S31 scope discussion.

Items 3, 11, and 12 are particularly likely to surface as confused-scope at execution; the executor should decline scope expansion and surface for operator decision rather than proceeding.
