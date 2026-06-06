# Agent→adminClient cleanup — Arc 2 brief (Class B)

**Date:** 2026-06-06. **Session:** `agent-adminclient-arc2` (lock held).
**Base:** HEAD `dee3b5ce` (cwd-guard arc tip; origin/staging `b8ddb087`,
5 banked unpushed — rides to terminal close, not this arc's concern).
**Cadence:** this brief → advisor read-back/clear → per-task commits.
Corrections to this brief are dated additive appends; the original
stays byte-intact.

## 1. Charter and governance home

Scope: clear the **Class B** agent→`@/db/adminClient` boundary
violations — the 7 files currently firing
`architecture/agent-first-import-boundaries` under
`apps/web/src/agent/` — by hoisting the DB touches into
`services/`-layer functions (legal path agent → services → db),
per the Arc 1 Class A precedent (`reviewPreviewReadService.ts`,
`strandedCaseReadService.ts`).

**Governance home: Q33**
(`docs/02_specs/open_questions.md` §Q33, "Service-layer placement
for the … `@/db/adminClient` direct-import sites"). Citing it here
closes the Arc-1 citation gap (reviewPreview read as "undocumented"
at Arc-1 kickoff despite D3 close §2 naming it a Q33 member).

**Q33 membership delta, anchored to disk this session.** Q33's text
(last status update 2026-04-30) scopes itself to **3 agent-runtime
sites** (`agent/memory/orgContextManager.ts:20`,
`agent/orchestrator/index.ts:42`,
`agent/orchestrator/loadOrCreateSession.ts:13`). Those 3 are waived
today by per-line
`eslint-disable-next-line architecture/agent-first-import-boundaries`
annotations under `TODO(adr-0020-decision-6)` markers — NOT by the
`eslint.config.mjs` Q33 block (that block only disables the old
`no-restricted-imports` mechanism; the custom rule is silenced at
the line grain). The 7 Class B files are **post-Q33 accretions**
from the Tier-2 pipeline phases (6–8), none annotated, all firing.
Arc 1 fixed 2 more accretions (reviewPreview, sweepStrandedCases:
9→7 at `src/agent` grain). **This arc does NOT touch Q33's 3
deferred sites** — their resolution stays tied to the Double Entry
Agent build per Q33's own timing. Arc close appends a dated status
note to Q33 recording the accretion-and-clearance history
(additive; the 2026-04-30 text stays byte-intact).

## 2. Derived baseline (grain-anchored; derived 2026-06-06, not inherited)

**`src/agent` eslint grain: 7 errors / 7 files**, all under
`orchestrator/extraction/`:

| # | File | Import | adminClient use |
|---|------|--------|-----------------|
| 1 | `extraction/aiFallbackExtractorBase.ts` | :25 | :65 `recordMutation(adminClient(), ctx, …)` — audit write |
| 2 | `extraction/classifier/aiFallback.ts` | :55 | :139 same audit-write shape |
| 3 | `extraction/failureClassification.ts` | :20 | :158 same audit-write shape |
| 4 | `extraction/stages/dedupByHash.ts` | :15 | :33 read-only (`source_documents` ×2 selects) |
| 5 | `extraction/stages/shadowRuleEvaluation.ts` | :30 | :139 read-only (`vendor_rules`, `vendors`) |
| 6 | `extraction/stages/runOCR.ts` | :24 | :85 **writes** (`ocr_runs`, `extraction_runs`, `document_artifacts` — 3 INSERTs, best-effort, no txn) |
| 7 | `extraction/ingestDocument.ts` (spine) | :63 | 4 sites, **all read-only**: :1121 commit-default lookups; :1200 rule-default-account resolver; :1331 payment-default lookups; :1406 case-id lookup |

Correction to inherited framing: `stages/proposalBuilder.ts` appears
in lint output but carries only an unused-var **warning** — it is
NOT a Class B member.

**Codebase eslint grain (full `src`): 14 errors / 14 files, one
each, three classes:**

- **Class B (agent→adminClient explicit-deny): 7** — the table above.
- **Class C (app→db layer violations): 5** — `documents/cases/route.ts:36`,
  `documents/cases/[caseId]/route.ts:20`, `review/cases/route.ts:18`,
  `review/cases/[caseId]/approve-post/route.ts:43`,
  `api/webhooks/postmark-inbound/route.ts:34`. **Out of scope** this
  arc; the fifth member (postmark-inbound) is one more than Arc-1's
  "D3 route pair" framing surfaced — recorded here so the count is
  honest at this grain.
- **Class D (services→agent): 2** — `ingestionService.ts:142`
  (runtime), `services/spend/vendorService.ts:48` (type-only).
  **Out of scope**; separately queued (§3).

**Waived population (not errors, on disk): +3** — Q33's deferred
sites (§1). Total agent→adminClient import sites on disk: 10
(7 firing + 3 waived).

Incidental lint noise observed in the touched files, left untouched
per ratified-contract scope (carry-forward, not absorbed): 3 unused
`eslint-disable no-console` directives + 1 unused var
(`proposalBuilder.ts:39`).

## 3. Spine-knot (flagged, not entangled)

`services/document-platform/ingestionService.ts:142` carries a
**static top-level runtime import** of `ingestDocument` (services→
agent; the ACTIVE pipeline invocation path — confirmed from disk
this session, not lazy-bound). The Class B hoist runs the
**opposite direction** (agent→services) and cannot resolve it; the
two knot at the spine. Discipline for this arc:

- New read/write service functions take **primitive params and row
  shapes only** — they must not import anything from `@/agent/**`
  (that would convert a Class B fix into a new Class D edge).
- The approve-post route's imports of `buildPostBillInput` /
  `buildRecordPaymentInput` from the spine (eslint-disabled at the
  route) and the Class D pair stay queued for their own arc.

## 4. Fix shapes (per sub-class; Arc 1 precedent confirmed from disk)

`recordMutation(db: SupabaseClient, ctx, entry)` is
transport-agnostic — the admin handle is a call-site choice, which
is exactly what hoists into a service.

- **B-audit (files 1–3):** one services-layer audit-emit function
  (proposed: `services/document-platform/pipelineAuditService.ts`
  exporting `emitPipelineAuditEvent(ctx, entry)` wrapping
  `recordMutation(adminClient(), ctx, entry)`). Three consumers
  rewritten to import it. Behavior-preserving by construction.
- **B-read (files 4, 5, and the spine's 4 sites):** hoist into
  read-service functions on the `reviewPreviewReadService` /
  `strandedCaseReadService` shapes (org-scoped `.eq` chains,
  null-on-miss, `ServiceError('READ_FAILED')` on query error).
  Proposed homes: extend `services/document-platform/` with
  `extractionReadService.ts` (dedup-hash lookups, case-id lookup)
  and `commitDefaultsReadService.ts` (fiscal-period / COA / rule
  default lookups for the two Stage-7 preserved helpers + resolver);
  `shadowRuleEvaluation`'s vendor-rule reads go to a
  `ruleReadService.ts` under the same dir unless read-back prefers
  an existing home. Exact placement is a read-back question, not a
  conviction.
- **B-write (file 6, `runOCR`):** hoist the 3 INSERTs into a
  services-layer write function (proposed:
  `extractionArtifactWriteService.ts`). **Named decision for
  read-back:** plain transport hoist preserving current semantics
  (no `withInvariants`, no new audit emission — the writes are
  pipeline-internal system writes, best-effort per chunk 7.1b §1.2
  orphan tolerance), vs. wrapping in `withInvariants` per the
  Two Laws. Lean: **behavior-preserving plain hoist with an
  explicit header note** — a boundary fix should not change runtime
  semantics mid-hoist; if the Two-Laws posture should change, that
  is its own decision with its own test surface. Advisor/operator
  call.
- **Spine care (file 7):** the 4 hoists are read-only and
  mechanical, but `ingestDocument` is the pipeline spine — each
  hoist lands with `pnpm agent:validate` green before the next, and
  the arc-close gate re-runs the documentPipeline integration
  surface.

## 5. Task decomposition (per-task commits)

- **T1** — this brief (commit 1), relay for advisor clearance.
  **No fix work until cleared.**
- **T2** — B-audit hoist: `pipelineAuditService` + 3 consumers.
- **T3** — B-read hoist, stages: `dedupByHash`, `shadowRuleEvaluation`.
- **T4** — B-read hoist, spine: `ingestDocument` ×4 sites.
- **T5** — B-write hoist: `runOCR` (posture per read-back).
- **T6** — close: eslint re-derive both grains (expect `src/agent`
  boundary errors 0; codebase 7 = 5 Class C + 2 Class D), Q33 dated
  status append, friction-journal arc entry, session close.

Each of T2–T5: `pnpm agent:validate` green before commit; eslint
boundary-error count strictly decreasing; commits from repo root,
root-relative pathspecs, inline `COORD_SESSION='agent-adminclient-arc2'`.

## 6. Entry disposals (proposed; ratification at read-back)

Untracked-count reconciliation, enumerated from `git status --short`
this session — **5 entries** (the "five chartered vs. four groups"
gap resolves as: four content groups + one metadata artifact):

1. `apps/web/tests/e2e/.auth/` (`user.json` — Playwright auth state;
   credential-shaped). **Propose: add `.gitignore` entry; never
   commit.** Highest-priority disposal.
2. `docs/09_briefs/phase-6.5/2026-05-17-phase-6-5-retrospective-drafting-plan.md`
   — **propose: defer to the post-V1 doc-refresh arc** (2026-05-17
   vintage; not Arc 2 material).
3. `docs/09_briefs/phase-6.5/2026-05-17-session-14-substrate.md` —
   same disposition as 2.
4. `docs/09_briefs/phase-6/…Zone.Identifier` — WSL/Windows metadata
   noise. **Propose: delete** (and optionally gitignore
   `*Zone.Identifier`).
5. `docs/09_briefs/v1/specs/2026-05-31-adr-0036-compliance-assumptions-jurisdictions-design.md`
   — parked Decision-10 design draft. **Propose: commit tracked**
   as its own docs commit (it is chartered repo material; tracking
   removes the sweep-in hazard the loose file poses).

Bank-if-touched (cwd-guard spec §5 → sentinel-invisibility pointer):
spec not touched this arc; stays banked.

## 7. Out of scope (explicit)

Class C (5 app routes), Class D (2 services→agent), Q33's 3 waived
sites, the approve-post route's spine imports, the incidental lint
noise (§2), and any `withInvariants` posture change beyond the T5
read-back decision. Push: operator-gated at the eventual terminal
close (Condition 1 `test:full` gates it; this arc prepares, never
pushes).
