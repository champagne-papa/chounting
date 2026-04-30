# Session 30 Hot-fix — G1 cross-org data leak closure

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (hot-fix is route-handler-side membership check + JSDoc reconciliation + regression tests; no orchestrator request fires).

**Goal:** Close the cross-org data leak at four GET endpoints surfaced at S30 brief-creation pre-decision (d-pre) substrate-grep. Element #6 G1 decision-fork resolved to Variant γ (hot-fix) on substrate evidence: both "missing-mechanism" AND "misremembered-OQ-07-resolution" framings are TRUE per element #6's discriminator. Active exploit shape today: authenticated user from org A receives org B's data on a UUID-guessed/scanned URL. Fix: add explicit `caller.org_ids.includes(orgId)` check at the four GET route handlers; reconcile the four service-layer JSDoc claims to reflect the route-handler check posture; add four cross-org regression tests. Standalone hot-fix commit; ships before S30 re-opens.

**Architecture (hot-fix scope; minimum viable):**

- **4 route-handler membership checks.** Hand-crafted early-return per pre-decision (b-shape-1) at the four GET handlers: `src/app/api/orgs/[orgId]/profile/route.ts` (GET), `src/app/api/orgs/[orgId]/addresses/route.ts` (GET), `src/app/api/orgs/[orgId]/users/route.ts` (GET), `src/app/api/orgs/[orgId]/invitations/route.ts` (GET). Architecturally distinct from service-layer/middleware-layer gates; locally readable as "this is the gate; below is gated code."
- **4 service-layer JSDoc reconciliations.** Update the comments on `orgService.getOrgProfile`, `addressService.listAddresses`, `membershipService.listOrgUsers`, `invitationService.listPendingInvitations` (and the file-top of `invitationService.ts` per S29a item (i)) to reflect that the route-handler check is now real. Closes the "misremembered-OQ-07-resolution" sub-finding from element #6.
- **4 cross-org regression tests.** Mirror the existing route-level test pattern at `tests/integration/conversationLoadEndpoint.test.ts` (vi.mock buildServiceContext + dynamic import + Request + assert). One test per route; assert 403 + `ORG_ACCESS_DENIED` on cross-org GET.
- **Standalone hot-fix commit.** Subject under 70 chars: `fix(security): close cross-org data leak at GET /orgs/[orgId]/{profile,addresses,users,invitations}`.

**Tech stack:** TypeScript, Next.js route handlers, Vitest. No new dependencies. No schema changes. No service-layer behavior changes (only JSDoc reconciliation). No orchestrator changes. No `withInvariants` wrap additions (per ratified pre-decision (b-shape-1) — minimum viable fix; deeper wrap-or-not decision deferred to S30 territory if at all).

---

**Anchor (parent) SHA:** `ee35abf` — single-file `.gitignore` cleanup landed between S30 brief commit `53aa533` and hot-fix arc opening (orthogonal to G1 territory; substrate-confirmed at brief-creation lock-acquisition). Verify HEAD's parent matches at Task 1 Step 2. Chain (chronological, oldest → newest): `1400694` (S28 brief) → `7ba3455` (Path C corrigendum + folded NOTE) → `3cedd05` (corrigendum SHA fix-forward) → `bafd4f9` (S29a brief) → `c47e58d` (S29a execution) → `53aa533` (S30 brief) → `ee35abf` (.gitignore cleanup) → this hot-fix execution commit.

**Upstream authority:**
- `docs/09_briefs/phase-1.3/session-30-brief.md` (at `53aa533`) — pre-decision (d) section transitions from "operator-pending; conditional task-shape encoded" to "resolved at hot-fix; G1 territory closed pre-S30" post-this-fix; S30 brief re-anchors against post-hot-fix HEAD.
- `docs/07_governance/friction-journal.md` tail — element #6 G1 decision-fork (S29a element #6 origin); element-pre-6 closeout-NOTE pending at S30 execution closeout.
- `src/services/middleware/serviceContext.ts:38` — `buildServiceContext(_req: Request)` does auth-only; populates `caller.org_ids` from memberships table; does NOT check URL `orgId` against that list. Structural reason the bug exists.
- `src/services/middleware/withInvariants.ts:67` — Invariant 3 throws `ORG_ACCESS_DENIED` for service-side cross-org-deny; canonical error code precedent.
- `src/services/errors/ServiceError.ts:7` — `ORG_ACCESS_DENIED` in `ServiceErrorCode` union.
- `src/app/api/_helpers/serviceErrorToStatus.ts:20-22` — maps `ORG_ACCESS_DENIED` → 403.
- `tests/integration/conversationLoadEndpoint.test.ts` (lines 27-47, 308-326) — canonical route-level test pattern shape; cross-org-isolation precedent (different cross-org shape than this hot-fix needs, but file-organizational precedent).

---

## Session label
`s30-hotfix-g1-brief` (brief-creation) → `s30-hotfix-g1` (execution).

## Pre-flight findings (substrate-grounded reference at HEAD `ee35abf`)

### Pre-flight delta inventory vs S30 brief-creation assumptions

Per the codified discipline (substrate-fidelity-gate, graduated at S30 brief-creation N=3 with continuing-firings post-graduation):

- **pre-7: Anchor drift at lock-acquisition.** S30 brief-creation framing assumed "HEAD is `53aa533`. No subsequent commits expected." Substrate at hot-fix lock-acquisition shows HEAD = `ee35abf` with one orthogonal interceding commit (`.gitignore` cleanup; allows committing `.claude/settings.json`). Substrate-orthogonal to G1 hot-fix scope (zero touch on the 4 routes, 4 services, buildServiceContext, eslint config, tests, package.json). Anchor chain extends; substrate-grounded findings carried forward intact. Sixth post-codification firing of substrate-fidelity-gate; **first firing at the lock-acquisition cadence layer** (sibling-shape to pre-1/2/3 at brief-creation pre-flight derivation, pre-4 at brief-drafting decision introduction, pre-5 at brief-drafting derivation). Sub-finding: the prompt's explicit "verify at brief-creation pre-flight; halt on drift" instruction is what made substrate-verify fire at lock-acquisition rather than later. Future hot-fix or execution prompts should carry that instruction explicitly when they assert anchor SHA — codifies the catch-shape.
- **pre-7-sub-1: parent-brief assumption gap on test-fixture pattern.** Parent brief speculated existing tests would be "Invariant 3 PATCH/POST cross-org-deny pattern"; substrate shows route-level pattern is broader (`apiAgent*` tests + `conversationLoadEndpoint` exercise GET handlers with vi.mock-buildServiceContext shape). Resolution still aligns with Variant (a1) intent. Folds into pre-7 family; sibling cadence layer.
- **pre-7-sub-2: parent-brief speculative lean on (b-shape).** Three-cadence flow: (i) S30 brief-creation prompt's "minimum viable fix per ratified scope" framed (b-shape-1) hand-crafted; (ii) hot-fix brief-drafting (WSL-side) leaned (b-shape-2) throw-and-catch on uniformity-with-codebase-error-flow reasoning; (iii) chat-side structural review pushed back to (b-shape-1) on three architectural-layer-clarity counter-considerations (failure-mode-asymmetry, locality-of-readability, counter-precedent-at-PATCH-paths); (iv) operator ratified (b-shape-1). Three-cadence shape: brief-prompt → brief-drafting-derivation → chat-review → operator-ratification. Sibling cadence layer; folds into pre-7 family.

- **pre-7-sub-3: brief-drafting introduced deferred-to-execution sub-decision without dialogue ratification (Task 4 Step 1 file-organization).** Initial brief-draft framed test file-organization as "(α) 4 separate files vs (β) 1 bundled file; substrate-decide at execution; lean (β)." Caught at chat-side structural review; resolved at brief-creation as ratified (β) bundled file per substrate-precedent at `conversationLoadEndpoint.test.ts`. Sibling-shape to S30 pre-4 (brief-drafting introducing operator-pending without dialogue ratification) but at the hot-fix-brief-drafting cadence — second instance of same shape across briefs. Folds into pre-7 family at the brief-drafting cadence layer.

**Codification durability evidence:** the codified discipline now has substrate-confirmed firing at every cadence layer it could plausibly fire at (pre-flight derivation, brief-drafting decision, brief-drafting derivation, lock-acquisition). 7+ post-graduation firings across 4 distinct cadence layers. Within this hot-fix brief-creation session alone, the brief-drafting cadence layer fired twice (pre-7-sub-2 derivation gap + pre-7-sub-3 deferred-decision-introduction gap) — same-cadence multi-firing within a single session is itself substrate evidence the discipline is correctly scoped at this layer. Future briefs that don't surface substrate-fidelity-gate firings at any layer should be looked at with suspicion — either the brief is genuinely substrate-stable (rare given codebase velocity) or the discipline isn't being applied.

### Lint / typecheck / test floor at HEAD `ee35abf`

| Check | Result | Disposition |
|---|---|---|
| `pnpm typecheck` | clean (carried from S30 brief-creation; .gitignore change cannot affect typecheck) | floor passes |
| `pnpm lint` | 10,614 problems baseline (pre-existing `.next/` pollution; out-of-scope per Hard constraint A — S30 territory) | unchanged |
| `pnpm test` (post `db:reset:clean && db:seed:all`) | 1 failed (verifyAuditCoverageRoundTrip) / 573 passed / 0 skipped (574); pre-existing carry-forward per S29a element #19 | unchanged |

### 4 GET handler shapes (text-anchor + error-handling pattern)

| Site | File:line | Error-handling pattern |
|---|---|---|
| getOrgProfile GET | `src/app/api/orgs/[orgId]/profile/route.ts:14-26` | shared `errorResponse(err)` helper at lines 58-72 |
| listAddresses GET | `src/app/api/orgs/[orgId]/addresses/route.ts:18-30` | shared `errorResponse(err)` helper at lines 57-71 |
| listOrgUsers GET | `src/app/api/orgs/[orgId]/users/route.ts:9-24` | inline `if (err instanceof ServiceError)` in catch (lines 18-23) |
| listPendingInvitations GET | `src/app/api/orgs/[orgId]/invitations/route.ts:41-56` | inline `if (err instanceof ServiceError)` in catch (lines 50-55) |

The membership-check insertion is uniform across all four (between `await buildServiceContext(req)` and the service call); the surrounding error-handling preserves each route's existing pattern.

### 4 service-layer JSDoc claims (current text at HEAD `ee35abf`; reconciliation targets)

| Function | File:line | Claim shape |
|---|---|---|
| orgService.getOrgProfile | `src/services/org/orgService.ts:352` (file-top reference at :17) | JSDoc says "NOT withInvariants-wrapped per OQ-07 (resolved 2026-04-15) — read-only service functions rely on RLS at the DB level. The route handler should use a userClient or the caller's org-membership pre-check to gate visibility." Update: "should" → "does" with citation to this hot-fix as the closure. |
| addressService.listAddresses | `src/services/org/addressService.ts:360` | JSDoc says "Read; not withInvariants-wrapped per OQ-07. RLS gates visibility." Update to cite route-handler check. |
| membershipService.listOrgUsers | `src/services/org/membershipService.ts:227` | No method-level JSDoc currently. Reconciliation adds JSDoc documenting the route-handler check posture. |
| invitationService.listPendingInvitations | `src/services/org/invitationService.ts:341` (file-top reference at :4) | File-top at lines 3-7 (S29a item (i) reframe) currently says "Read function listPendingInvitations is currently unwrapped pending Pattern G1 remediation." This hot-fix IS the remediation; update file-top to reflect that listPendingInvitations is now route-handler-gated. Method itself has no JSDoc; reconciliation adds. |

### Existing cross-org-deny test patterns

8+ existing test files use `ORG_ACCESS_DENIED` in cross-org assertions: `chartOfAccountsServiceCrossOrg.test.ts`, `periodServiceIsOpenCrossOrg.test.ts`, `accountLedgerService.test.ts`, `aiActionsListService.test.ts`, `periodLockUnlock.test.ts`, `reportBalanceSheet.test.ts`, `reportAccountsByType.test.ts`, `recurringJournal.test.ts`. These are **service-level** tests (call service directly with non-member ctx; assert `rejects.toThrow('ORG_ACCESS_DENIED')` or `rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' })`).

The hot-fix needs **route-level** tests because the check lives at the route handler. Canonical route-level pattern at `tests/integration/conversationLoadEndpoint.test.ts:27-47`:

```ts
vi.mock('@/services/middleware/serviceContext', async () => {
  const actual = await vi.importActual<typeof import('@/services/middleware/serviceContext')>(
    '@/services/middleware/serviceContext',
  );
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: TEST_TRACE,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true,
        org_ids: [SEED.ORG_HOLDING /* single org for cross-org-deny */],
      },
      locale: 'en' as const,
    })),
  };
});

const { GET } = await import('@/app/api/orgs/[orgId]/profile/route');
// then: new Request(url, { method: 'GET' }) → await GET(req, { params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }) }) → assert response status === 403, body.error === 'ORG_ACCESS_DENIED'
```

`conversationLoadEndpoint.test.ts:308-326` has a different-shape cross-org test (org_id query-param mismatch) — file-organizational precedent, not directly transferable.

### `ORG_ACCESS_DENIED` substrate (canonical, codebase-wide)

Defined at `src/services/errors/ServiceError.ts:7`. Maps to HTTP 403 at `serviceErrorToStatus.ts:20-22`. Used at 6+ service-side and orchestrator-side sites including `withInvariants.ts:67` (Invariant 3), `recurringJournalService.ts:454, :627`, `orchestrator/index.ts:1071`, `src/app/api/org/route.ts:28`. 8+ tests assert against this exact code. **Uncontested as the right code for the hot-fix.**

---

## Hard constraints (do not violate)

- **Out of scope:**
  - `withInvariants` wrap additions on the GET paths. Per ratified scope: minimum viable fix; route-handler-level guard is architecturally distinct from middleware-layer gate. Future "should these be wrapped" question deferred to S30 territory or later.
  - `.next/` ignore in eslint.config.mjs (S30 territory).
  - LT-01(b) / LT-03 / LT-04 mechanizations (S30 territory).
  - Service-layer behavior changes other than JSDoc reconciliation. Service-layer adminClient usage stays — the hot-fix gates at the route, not by re-wrapping service.
  - JSDoc updates beyond the 4 G1 functions.
  - Any other security review beyond the 4 G1 sites named in element #6.
  - Action-key-based role-permission decisions (Invariant 4 territory). The hot-fix closes the membership gate (Invariant 3 equivalent); it does not bundle role decisions for these GET endpoints.
- **Test posture floor.** ALL existing tests at HEAD post-edit remain at the documented pre-existing carry-forward state per S29a element #19. `pnpm agent:validate` clean (26/26 post `db:reset:clean && db:seed:all`). 4 new regression tests pass. No new failures attributable to this hot-fix beyond the 4 deliberately-added regression tests.
- **Hard constraint A — no eslint config touches.** `.next/` ignore and any other eslint-config work is S30 scope. The hot-fix must not modify `eslint.config.mjs`.
- **Hard constraint B — no withInvariants wrap additions.** Route-handler-level guard only per pre-decision (b-shape-1). Architectural-layer clarity preserved.
- **Hard constraint C — response shape uniformity at the wire.** Hand-crafted 403 response uses shape `{ error: 'ORG_ACCESS_DENIED', message: \`caller is not a member of org ${orgId}\` }` matching existing PATCH catch-block output (`{ error: err.code, message: err.message }`). Tests assert against this shape; future readers see uniform wire response across PATCH-thrown and GET-pre-check.
- **Hard constraint D — no service-layer behavior changes.** Service-layer functions (`getOrgProfile`, `listAddresses`, `listOrgUsers`, `listPendingInvitations`) keep their existing implementation. JSDoc-only updates at the service layer.
- **Hard constraint E — file-top reframe at invitationService.** Per S29a item (i) reframe, the file-top says "pending Pattern G1 remediation." This hot-fix IS the remediation; file-top must update to reflect route-handler-gated state.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight. Re-verify at execution time before edit; halt on any drift. Substrate-grounded line numbers are parenthetical aids; text-anchors are load-bearing.
- **Y2 commit shape.** Single bundled commit by default. Hot-fix is small enough (~15-line code + 4 JSDoc updates + 4 small tests) that splitting is not warranted unless surface-area expands during execution.
- **No placeholder-and-amend.** NOTE refers to "this commit" generically; no SHA self-reference in commit body or NOTE body.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time; executor re-confirms the batch as a D1-shape preamble before touching code):

1. **(a) Test-fixture shape = Variant (a1).** Mirror the existing route-level test pattern at `tests/integration/conversationLoadEndpoint.test.ts:27-47` (vi.mock buildServiceContext + dynamic import + Request + assert). Tests live under `tests/integration/`. File-organizational precedent at `conversationLoadEndpoint.test.ts:308-326` (different cross-org shape; same file-organizational home).

2. **(b) Error code = `ORG_ACCESS_DENIED`.** Substrate-canonical; maps to HTTP 403 at `serviceErrorToStatus.ts:20-22`; 8+ existing test assertions against this exact code.

3. **(b-shape-1) Hand-crafted early-return at the route handler.** Per ratified architectural-layer-clarity argument:
   - Throw-and-catch creates failure-mode-asymmetry between membership check and other route logic (catch block now serves two semantically distinct purposes).
   - Hand-crafted is shorter and more direct at the call site; gate-logic locally readable as "this is the gate; below is gated code."
   - Existing PATCH paths' throw-and-catch flow leverages `withInvariants` Invariant 3 as the gate; for GET paths there is no equivalent middleware gate (that's why we're adding one). Mimicking the PATCH error-flow conflates these two architecturally-distinct gates.

   Concrete fix shape:

   ```ts
   const ctx = await buildServiceContext(req);
   if (!ctx.caller.org_ids.includes(orgId)) {
     return NextResponse.json(
       { error: 'ORG_ACCESS_DENIED', message: `caller is not a member of org ${orgId}` },
       { status: 403 },
     );
   }
   const row = await orgService.getOrgProfile({ org_id: orgId }, ctx);
   ```

4. **(c) Test file-organization = single bundled file.** `tests/integration/orgGetCrossOrg.test.ts` with 4 `it(...)` cases inside one `describe(...)` and shared `vi.mock(buildServiceContext)` setup. Ratified at brief-creation post-substrate-grep: substrate-precedent at `conversationLoadEndpoint.test.ts` is itself a single bundled file covering multiple GET handler scenarios for one route family — closest match for four GET handlers in the same `/api/orgs/[orgId]/` route family exercising the same exploit shape. Single vi.mock setup is more readable and maintainable than four files duplicating mock setup. The (α) 4-separate-files shape was considered and rejected: per-route isolation isn't load-bearing when the four routes share exploit shape AND the same vi.mock setup. Reject `Test 6 Step 2 staging list` "13-file variant" framing — staging list is uniformly 10 files (4 routes + 4 services + 1 bundled test + friction-journal).

5. **Y2 commit shape: single bundled commit.** Hot-fix scope is bounded; no Y2-split planned.

6. **Estimated session duration: ~3-4 hours.** Task 0 variant-confirmation (~5 min) + Task 1 lock+pre-flight (~15 min) + Task 2 4 route-handler edits (~30 min) + Task 3 4 JSDoc reconciliations (~30 min) + Task 4 4 regression tests (~1 hour) + Task 5 full-suite regression (~30 min) + Task 6 commit + NOTE drafting (~30-45 min) + review buffer.

OPEN — operator to resolve before / during execution: **none.** All structural pre-decisions ratified at brief-creation. No carry-forward inputs from S30 brief-creation that affect this hot-fix scope (G1 disposition WAS the carry-forward; this hot-fix IS the resolution).

---

## Exit-criteria matrix

| ID | Target file(s) | Done when | Test evidence required |
|---|---|---|---|
| HOTFIX-G1-routes | 4 GET route handlers (profile, addresses, users, invitations) | Each GET handler has `if (!ctx.caller.org_ids.includes(orgId))` early-return with 403 + `ORG_ACCESS_DENIED` shape between `buildServiceContext` and service call. Surrounding error-handling preserved per each route's existing pattern. | 4 regression tests pass (one per route) asserting cross-org GET returns 403 + `error: 'ORG_ACCESS_DENIED'`. |
| HOTFIX-G1-jsdoc | 4 service-layer functions (getOrgProfile, listAddresses, listOrgUsers, listPendingInvitations) + invitationService.ts file-top | JSDoc on each function reflects the route-handler check posture (no longer "should use a route-handler check"; now "the route handler enforces caller.org_ids.includes(orgId)"). invitationService.ts file-top reframed from "pending Pattern G1 remediation" to "route-handler-gated post-this-hot-fix." | grep substrate confirms updated text-anchors at each site; pre-hot-fix anchor strings ("should use", "pending Pattern G1 remediation") absent. |
| HOTFIX-G1-tests | 4 new test files OR additions to existing route-test files at `tests/integration/` | 4 cross-org regression tests pass; tests use vi.mock(buildServiceContext) pattern; assert 403 + `ORG_ACCESS_DENIED`. | `pnpm test` shows 4 new tests passing; no existing tests broken. |
| HOTFIX-G1-floor | (full suite) | `pnpm agent:validate` 26/26 green; `pnpm typecheck` clean; `pnpm test` shows pre-existing carry-forward unchanged + 4 new tests passing. | per S29a element #19 baseline with `db:reset:clean && db:seed:all` pre-condition. |

---

## Task 0: Pre-Task discipline check (BEFORE lock acquisition)

Per S30 brief-creation precedent: variant-disposition resolution happens BEFORE lock acquisition where applicable. For this hot-fix, all pre-decisions are ratified at brief-creation; Task 0 is a defensive re-confirmation that the prompt's anchor SHA assertion holds.

- [ ] **Step 0.1: Confirm anchor SHA + verify orthogonality if drift present**

```bash
git log --oneline -1
```

Expected: HEAD = `ee35abf` (or the hot-fix brief-creation commit anchored at `ee35abf`, or one-or-two further orthogonal commits ahead).

If HEAD has drifted past the hot-fix brief-creation commit, substrate-verify orthogonality:

```bash
git diff ee35abf..HEAD --stat
```

Confirm none of these surfaces are touched: the 4 routes (`src/app/api/orgs/[orgId]/{profile,addresses,users,invitations}/route.ts`); the 4 service files (`src/services/org/{orgService,addressService,membershipService,invitationService}.ts`); `src/services/middleware/serviceContext.ts`; `src/services/middleware/withInvariants.ts`; `src/services/errors/ServiceError.ts`; `src/app/api/_helpers/serviceErrorToStatus.ts`; `eslint.config.mjs`; `package.json`; `tests/integration/conversationLoadEndpoint.test.ts`. If any are touched, HALT and surface for substrate-re-derivation.

- [ ] **Step 0.2: Verify no operator-pending decisions remain**

All structural pre-decisions for this hot-fix were ratified at brief-creation. No (d)/(e)/(c4)-shape carry-forwards. If any operator-pending decision surfaces here, the brief was incomplete; HALT.

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh s30-hotfix-g1
```

Then export in your shell:

```bash
export COORD_SESSION='s30-hotfix-g1'
```

Verify lock present:

```bash
cat .coordination/session-lock.json
```

Expected: lock contents include `"session": "s30-hotfix-g1"`, fresh `started_at` timestamp, current PID. Per element #12 lock-mechanical-discipline: lock-acquisition is what UPGRADES the pre-commit hook from advisory to blocking. **Verify-after-acquire is load-bearing.**

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit is the hot-fix brief-creation commit (single file: `docs/09_briefs/phase-1.3/session-30-hotfix-g1-brief.md`); parent is `ee35abf` (or a small number of orthogonal commits, all verified at Task 0 Step 0.1).

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

- [ ] **Step 4: Re-verify pre-flight findings substrate**

Convention #8 verify-directly discipline. Substrate-confirm at execution HEAD before any edit:

```bash
# 4 GET handlers exist at expected files:
ls src/app/api/orgs/\[orgId\]/profile/route.ts \
   src/app/api/orgs/\[orgId\]/addresses/route.ts \
   src/app/api/orgs/\[orgId\]/users/route.ts \
   src/app/api/orgs/\[orgId\]/invitations/route.ts
# 4 service-layer functions exist at expected anchors:
grep -n "getOrgProfile\|listAddresses\|listOrgUsers\|listPendingInvitations" \
  src/services/org/orgService.ts \
  src/services/org/addressService.ts \
  src/services/org/membershipService.ts \
  src/services/org/invitationService.ts | head -10
# canonical route-level test pattern still at conversationLoadEndpoint:
grep -n "vi.mock.*serviceContext" tests/integration/conversationLoadEndpoint.test.ts
# ORG_ACCESS_DENIED still maps to 403:
grep -A2 "case 'ORG_ACCESS_DENIED'" src/app/api/_helpers/serviceErrorToStatus.ts
```

Halt on any drift.

---

## Task 2: 4 route-handler membership checks

Sequencing: edit one file at a time; substrate-verify after each edit before moving to next file. All 4 edits land in the same commit at Task 6.

- [ ] **Step 1: profile/route.ts GET handler**

Edit `src/app/api/orgs/[orgId]/profile/route.ts:14-26`. Insert membership-check between `buildServiceContext(req)` and `orgService.getOrgProfile({ org_id: orgId }, ctx)`:

```ts
const ctx = await buildServiceContext(req);
if (!ctx.caller.org_ids.includes(orgId)) {
  return NextResponse.json(
    { error: 'ORG_ACCESS_DENIED', message: `caller is not a member of org ${orgId}` },
    { status: 403 },
  );
}
const row = await orgService.getOrgProfile({ org_id: orgId }, ctx);
```

- [ ] **Step 2: addresses/route.ts GET handler**

Same shape at `src/app/api/orgs/[orgId]/addresses/route.ts:18-30`.

- [ ] **Step 3: users/route.ts GET handler**

Same shape at `src/app/api/orgs/[orgId]/users/route.ts:9-24`.

- [ ] **Step 4: invitations/route.ts GET handler**

Same shape at `src/app/api/orgs/[orgId]/invitations/route.ts:41-56`.

- [ ] **Step 5: Verify all 4 membership checks present**

```bash
grep -B1 -A5 "ctx.caller.org_ids.includes(orgId)" \
  src/app/api/orgs/\[orgId\]/profile/route.ts \
  src/app/api/orgs/\[orgId\]/addresses/route.ts \
  src/app/api/orgs/\[orgId\]/users/route.ts \
  src/app/api/orgs/\[orgId\]/invitations/route.ts
```

Expected: 4 matches, each followed by the same return-403 shape.

---

## Task 3: 4 service-layer JSDoc reconciliations

**Line-number framing for this Task:** Line numbers cited in each step are parenthetical aids; substrate-re-derive at execution time. Text-anchors (current JSDoc text quoted in each step) are load-bearing for find-and-replace per Convention #8 verify-directly. If line numbers have drifted between brief-creation and execution (likely for sub-files where edits land mid-file), the text-anchor still locates the target uniquely.

- [ ] **Step 1: orgService.getOrgProfile JSDoc**

Edit `src/services/org/orgService.ts` JSDoc on `getOrgProfile` (around line 352). Replace text:

```
NOT withInvariants-wrapped per OQ-07 (resolved 2026-04-15) — read-only
service functions rely on RLS at the DB level. The route handler should
use a userClient or the caller's org-membership pre-check to gate
visibility.
```

With:

```
NOT withInvariants-wrapped per OQ-07 (resolved 2026-04-15). Authorization
is enforced at the route handler via an explicit
caller.org_ids.includes(orgId) check that returns 403 ORG_ACCESS_DENIED
on cross-org access. Service uses adminClient and bypasses RLS;
route-handler check is the load-bearing gate. (S30 hot-fix; element #6
G1 Variant γ closure.)
```

Also update the file-top reference at `src/services/org/orgService.ts:17` if it carries claims about getOrgProfile's wrap state.

- [ ] **Step 2: addressService.listAddresses JSDoc**

Edit `src/services/org/addressService.ts:360`. Replace existing JSDoc text (currently along the lines of "Read; not withInvariants-wrapped per OQ-07. RLS gates visibility.") with substrate-grounded equivalent of orgService.getOrgProfile reconciliation. Same factual content; route-handler-gated; cite hot-fix.

- [ ] **Step 3: membershipService.listOrgUsers JSDoc**

Edit `src/services/org/membershipService.ts:227`. Add method-level JSDoc (currently absent):

```
/**
 * Lists users in an org with their memberships and profile data.
 * NOT withInvariants-wrapped — read-only; service uses adminClient and
 * bypasses RLS. Authorization is enforced at the route handler via an
 * explicit caller.org_ids.includes(orgId) check that returns 403
 * ORG_ACCESS_DENIED on cross-org access. (S30 hot-fix; element #6 G1
 * Variant γ closure.)
 */
```

- [ ] **Step 4: invitationService.listPendingInvitations JSDoc + file-top**

Edit `src/services/org/invitationService.ts:341`. Add method-level JSDoc (currently absent) per same shape as Step 3.

Edit file-top at `src/services/org/invitationService.ts:3-7` (S29a item (i) reframe). Replace:

```
INV-SERVICE-001 export contract: mutating functions (inviteUser, revokeInvitation, resendInvitation) are
route-handler-wrapped via withInvariants. Read function listPendingInvitations is currently unwrapped
pending Pattern G1 remediation. Token-bearer functions (acceptInvitation, previewInvitationByToken) carry
pattern-I skip-org-check annotations per S29a.
```

With:

```
INV-SERVICE-001 export contract: mutating functions (inviteUser, revokeInvitation, resendInvitation) are
route-handler-wrapped via withInvariants. Read function listPendingInvitations is route-handler-gated via
explicit caller.org_ids.includes(orgId) check (S30 hot-fix; element #6 G1 Variant γ closure). Token-bearer
functions (acceptInvitation, previewInvitationByToken) carry pattern-I skip-org-check annotations per S29a.
```

- [ ] **Step 5: Verify JSDoc reconciliation**

```bash
# Pre-hot-fix anchors should be ABSENT:
grep -n "should use a userClient or the caller's org-membership pre-check" src/services/org/orgService.ts && echo "STILL PRESENT — drift" || echo "GONE ✓"
grep -n "pending Pattern G1 remediation" src/services/org/invitationService.ts && echo "STILL PRESENT — drift" || echo "GONE ✓"
# Post-hot-fix anchors should be PRESENT:
grep -n "S30 hot-fix; element #6 G1 Variant γ closure" \
  src/services/org/orgService.ts \
  src/services/org/addressService.ts \
  src/services/org/membershipService.ts \
  src/services/org/invitationService.ts
```

Expected: 4 hits on the post-hot-fix anchor; zero hits on pre-hot-fix anchors.

---

## Task 4: 4 cross-org regression tests

Per pre-decision (a) Variant (a1): mirror the route-level test pattern at `tests/integration/conversationLoadEndpoint.test.ts:27-47`.

- [ ] **Step 1: Confirm file-organization per pre-decision (c)**

File-organization ratified at brief-creation per pre-decision (c) — see Pre-decisions section. **Single bundled file at `tests/integration/orgGetCrossOrg.test.ts`** with 4 `it(...)` cases inside one `describe(...)` and shared `vi.mock(buildServiceContext)` setup. Substrate-precedent: `conversationLoadEndpoint.test.ts` is itself a single bundled file covering multiple GET handler scenarios for one route family — closest precedent for four GET handlers in the same `/api/orgs/[orgId]/` route family exercising the same exploit shape.

- [ ] **Step 2: Create the test file(s)**

Test shape per test (within bundled file or per-file):

```ts
it('GET /api/orgs/[orgId]/profile returns 403 when caller is not a member of orgId', async () => {
  const req = new Request(`http://test/api/orgs/${SEED.ORG_REAL_ESTATE}/profile`, { method: 'GET' });
  const resp = await GET(req, { params: Promise.resolve({ orgId: SEED.ORG_REAL_ESTATE }) });
  expect(resp.status).toBe(403);
  const body = await resp.json();
  expect(body.error).toBe('ORG_ACCESS_DENIED');
  expect(body.message).toContain(SEED.ORG_REAL_ESTATE);
});
```

The vi.mock setup populates `caller.org_ids = [SEED.ORG_HOLDING]`; the test URL targets `SEED.ORG_REAL_ESTATE`. Mismatch triggers the 403.

- [ ] **Step 3: Run the new tests**

```bash
pnpm test orgGetCrossOrg 2>&1 | tail -10
```

Expected: 4/4 green.

- [ ] **Step 4: Verify the tests fail when membership check is removed (negative test of the test)**

Temporarily revert the Task 2 Step 1 edit (one route's membership check is sufficient — pick profile/route.ts as representative); rerun the corresponding test; expect 200 (i.e., cross-org GET succeeds — proving the test catches the bug). Re-apply Task 2 Step 1.

This step is the fail-without-fix evidence the regression test was capturing the right behavior. Skipping it under time-pressure is a discipline-failure shape — it removes the only direct evidence the test is doing what it claims (green-with-fix alone is necessary but not sufficient; a test that always passes would also be green-with-fix). Cost is ~30 seconds; do not skip.

---

## Task 5: Full-suite regression

- [ ] **Step 1: agent:validate post-reset**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green. Per S29a element #16: clean-baseline pre-condition closes the test-DB pollution flake.

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 3: full vitest suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: pre-existing carry-forward unchanged from S29a element #19 baseline (verifyAuditCoverageRoundTrip carry-forward; possibly accountLedgerService running-balance carry-forwards via cascading ordering pollution). 4 new tests passing.

If unexpected drift surfaces beyond the carry-forward set, apply S29a's stash-revert isolation discipline (currently N=2; firing here would graduate at N=3 per Documentation Routing convention).

---

## Task 6: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. NOTE plan:

1. **Element #6 G1 closure citation.** Pattern G1's four sites (`orgService.getOrgProfile`, `addressService.listAddresses`, `membershipService.listOrgUsers`, `invitationService.listPendingInvitations`) are now route-handler-gated via explicit `caller.org_ids.includes(orgId)` checks returning 403 `ORG_ACCESS_DENIED`. Both element #6 framings ("missing-mechanism" AND "misremembered-OQ-07-resolution") confirmed TRUE at S30 brief-creation (d-pre) substrate-grep; this hot-fix closes both. JSDoc reconciliation closes the misremembered-OQ-07 sub-finding; route-handler check closes the missing-mechanism sub-finding.

2. **Substrate-grep-first as ratification-shape (codification graduated at S30 brief-creation N=3; this hot-fix is closure-execution evidence).** S30 brief-creation arc fired three substrate-greps that flipped or grounded operator priors: (a1-sub-1′) Pattern B AST-shape verification; (c4) ORG_SCOPED_TOOLS Set semantics verification; (d-pre) G1 route-handler check verification. (d-pre) was the third firing AND the one that flipped operator's prior (Variant β Phase-2-obligation) to ratified (Variant γ hot-fix) on substrate evidence. This hot-fix is the closure-execution of that flip — pre-flight substrate-evidence-grounded ratification produces the right work product when the operator's prior was substrate-ungrounded.

3. **Element-pre-7 family closure (substrate-fidelity-gate codification continuing-firings post-graduation).** S30 brief-creation graduated brief-creation-pre-flight-as-substrate-fidelity-gate at N=3 (pre-1/2/3) with continuing firings at pre-4 (brief-drafting introducing operator-pending without ratification) and pre-5 (brief-drafting over-claiming substrate-fidelity). This hot-fix brief-creation surfaced pre-7 (anchor drift at lock-acquisition; HEAD shifted from `53aa533` to `ee35abf` via orthogonal `.gitignore` cleanup) plus pre-7-sub-1 (parent-brief assumption gap on test-fixture pattern) and pre-7-sub-2 (parent-brief speculative lean on (b-shape)). Six post-codification firings across four distinct cadence layers (brief-creation pre-flight, brief-drafting decision, brief-drafting derivation, lock-acquisition); the codified discipline now has substrate-confirmed firing at every cadence layer it could plausibly fire at — durable evidence the discipline is correctly scoped.

4. **Sub-finding: verify-and-halt instruction as load-bearing catch-mechanism.** At pre-7, the prompt's explicit "verify at brief-creation pre-flight; halt on drift" instruction is what made substrate-verify fire at lock-acquisition rather than later. Without that instruction, lock-acquisition would have proceeded silently against stale `53aa533` substrate. Future hot-fix or execution prompts should carry that instruction explicitly when they assert anchor SHA — small prompt-engineering discipline that codifies the catch-shape.

5. **OQ-07's resolved-decision integrity.** Pre-this-hot-fix, four service-layer JSDocs cited OQ-07's resolution ("rely on RLS at DB level + route handler check") but neither layer implemented it (services use adminClient bypassing RLS; route handlers had no caller.org_ids check). Element #6 named this discriminator as "missing-mechanism vs misremembered-OQ-07-resolution"; substrate at S30 (d-pre) confirmed BOTH true. Post-this-hot-fix: route-handler check is real; JSDoc cites the route-handler check; OQ-07's resolved decision integrity restored. **Codification candidate at N=1: "Resolved-decision-citation as contract."** When JSDoc cites a resolved-decision document (open question, ADR, OQ-N, etc.), the citation is a contract — code must honor the cited resolution OR the JSDoc must update OR the resolution must explicitly note the divergence. N=1 today (the four G1 sites collapsed into one structural finding); future sites surfacing "JSDoc cites OQ-N; code violates OQ-N" would graduate per Documentation Routing convention's N=3 threshold.

6. **(b-shape-1) architectural-layer-clarity disposition.** Operator ratified hand-crafted early-return over throw-and-catch on three architectural-layer counter-considerations: failure-mode-asymmetry between membership check and other route logic; locality-of-readability of the gate; and counter-precedent at existing PATCH paths whose throw-and-catch flow leverages `withInvariants` Invariant 3 (a middleware-layer gate) — the hot-fix's route-handler-level gate is architecturally distinct and should not be conflated. **Codification candidate at N=1: "Don't conflate uniformity-at-the-wire (response shape) with uniformity-of-control-flow (throw vs early-return)."** The two operate at different architectural layers and should be calibrated independently. N=1 today; future architectural-layer disambiguation decisions would graduate per Documentation Routing convention's N=3 threshold.

NOTE plan formatting follows existing tail entries' shape (date prefix, lead-line, lettered or numbered sub-elements as appropriate to length).

- [ ] **Step 2: Stage all changes**

```bash
git add src/app/api/orgs/\[orgId\]/profile/route.ts \
        src/app/api/orgs/\[orgId\]/addresses/route.ts \
        src/app/api/orgs/\[orgId\]/users/route.ts \
        src/app/api/orgs/\[orgId\]/invitations/route.ts \
        src/services/org/orgService.ts \
        src/services/org/addressService.ts \
        src/services/org/membershipService.ts \
        src/services/org/invitationService.ts \
        tests/integration/orgGetCrossOrg.test.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 10 files staged (4 route handlers + 4 service files + 1 bundled test file at `tests/integration/orgGetCrossOrg.test.ts` per pre-decision (c) + friction-journal). Halt if Hard constraint violations surface (eslint config touched, withInvariants wrap added, service-layer behavior changed beyond JSDoc).

- [ ] **Step 3: Commit (single bundled, hot-fix shape)**

Subject (under 70 chars): `fix(security): close cross-org data leak at GET /orgs/[orgId]/{profile,addresses,users,invitations}`

Body covers:
- Element #6 G1 missing-mechanism + misremembered-OQ-07-resolution finding (substrate-evidence at S30 brief-creation (d-pre) substrate-grep).
- 4 GET endpoints affected; uniform exploit shape (caller.org_ids not checked).
- Fix: explicit `caller.org_ids.includes(orgId)` early-return with 403 `ORG_ACCESS_DENIED` at each route handler.
- JSDoc reconciliation at 4 service-layer functions + invitationService.ts file-top.
- 4 cross-org regression tests added (vi.mock buildServiceContext + dynamic import + Request + assert pattern).
- Cites friction-journal element #6 origin and S30 brief-creation element-pre-6 closeout-NOTE entry.
- References S30 brief at `53aa533` as the resolution context (pre-decision (d) Variant γ).
- Friction-journal NOTE in same commit per S25-S29a-S30 governance precedent.

Do NOT include `Co-Authored-By` unless operator-confirmed at closeout.

- [ ] **Step 4: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the hot-fix commit SHA. Per S29a element #16: re-run `db:reset:clean && db:seed:all` if state pollution surfaces.

- [ ] **Step 5: Session end**

```bash
bash scripts/session-end.sh
```

Lock release; COORD_SESSION unset.

- [ ] **Step 6: Surface hot-fix closeout to operator**

Single message summarizing:
- Commit SHA.
- 4 routes patched with substrate-confirmed text-anchors.
- 4 JSDoc reconciliations applied.
- 4 regression tests passing.
- Pre-flight findings → execution outcomes mapping (any drift, any unexpected hits).
- Friction-journal NOTE summary (6-element inventory).
- S30 brief re-anchor sequence:
  - Pattern G1 row in S30 LT-01(b) annotation pass table updates from "annotated under Variant β" to "wrapped via route-handler-check; entries removed from annotation pass."
  - LT-01(b) annotation pass count drops by 4 (~14-18 → ~10-14).
  - Pre-decision (d) section in S30 brief moves from "operator-pending; conditional task-shape encoded" to "resolved at hot-fix; G1 territory closed pre-S30."
  - LT-01(d) audit scope shrinks: hot-fix's JSDoc updates close some claims preemptively that LT-01(d) would have audited.
- Path C arc proximity: post-this-hot-fix, S30 ready to re-open against new HEAD.

---

## Verification harness alignment

This is a security hot-fix; the Path C arc-summary verification harness does not have a dedicated G1 gate (G1 was scoped as "separate friction-journal track" per the corrigendum's "what stays open" table at S29 brief-creation). Hot-fix closure is captured via:

- Element #6 friction-journal closure (NOTE element 1 per Task 6 Step 1 plan).
- Substrate-grep verification at exit-criteria matrix (HOTFIX-G1-routes, HOTFIX-G1-jsdoc, HOTFIX-G1-tests, HOTFIX-G1-floor).
- 4 regression tests as ongoing CI evidence (firing if any future change re-introduces the leak).

S30's Gate 4 LT-01(b) calibration updates post-hot-fix: G1 sites no longer appear in the annotation-pass table; the annotation-default discipline's allowlist remains empty (G1 sites are now wrapped-equivalent via route-handler check; rule's wrap-or-annotate predicate satisfied without annotation entry).

---

## Friction-journal NOTE plan (summary; full text in Task 6 Step 1)

Six-element inventory:

1. Element #6 G1 closure citation (missing-mechanism + misremembered-OQ-07-resolution both closed)
2. Substrate-grep-first codification closure-execution evidence
3. Element-pre-7 family closure (substrate-fidelity-gate continuing-firings; first lock-acquisition cadence firing)
4. Verify-and-halt instruction sub-finding (load-bearing catch-mechanism)
5. OQ-07's resolved-decision integrity discipline observation
6. (b-shape-1) architectural-layer-clarity disposition discipline observation

Element count is conservative; closeout will likely add elements per execution-time substrate findings (per S29a/S30 precedent).

---

## Out-of-scope explicit list (recap for executor reference)

1. `withInvariants` wrap additions on the 4 GET paths. Architecturally distinct from middleware-layer gate; minimum viable fix per ratified scope.
2. `.next/` ignore in eslint.config.mjs (S30 territory).
3. LT-01(b) / LT-03 / LT-04 mechanizations (S30 territory).
4. Service-layer behavior changes other than JSDoc reconciliation (adminClient usage stays; service signature stays; service body stays).
5. JSDoc updates beyond the 4 G1 functions (other service functions' JSDoc audit is LT-01(d) territory at S30).
6. Any other security review beyond the 4 G1 sites named in element #6 (no scope-expansion to "audit the rest of /api/orgs/[orgId]/" — that's its own work).
7. Action-key-based role-permission decisions (Invariant 4 territory). Hot-fix closes membership gate (Invariant 3 equivalent); does not bundle role decisions.
8. PATCH/POST handlers on the same routes (already covered by `withInvariants` wraps; out-of-scope for this hot-fix).
9. Re-litigating element #6's Variant choice. Variant γ ratified at S30 brief-creation on substrate-grep evidence; this hot-fix executes that resolution. (If Task 0 substrate-verification reveals material drift such that Variant γ is no longer the substrate-grounded disposition — e.g., a parallel commit added the missing-mechanism between brief-creation and execution — HALT and surface for re-derivation; out-of-scope-of-execution does not mean out-of-scope-of-substrate-fidelity.)
10. Substrate-re-derivation of S30 brief findings (the substrate-grounded findings carried forward from S30 brief-creation are already substrate-confirmed at brief-creation HEAD `ee35abf` per Task 1 Step 4).

Items 1, 4, 7 are particularly likely to surface as scope-creep at execution; the executor should decline scope expansion and surface for operator decision rather than proceeding.
