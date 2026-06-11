# Services→agent cleanup — Class D charter (design-first arc)

**Date:** 2026-06-06. **Session:** `services-agent-classd` (lock held).
**Base:** HEAD `de395614` (Arc 2 close; origin/staging `b8ddb087`, 13
banked unpushed — rides to terminal close).
**Cadence:** charter → design spec **cleared by the advisor before any
fix** → fix behind per-task verification → close with
correction-naming and tracked residue. Corrections to this charter
are dated additive appends.

## 1. Charter and governance home

Scope: resolve the **Class D** services→agent boundary violations —
the 2 sites firing `architecture/agent-first-import-boundaries` in
the **zero-precedent reverse direction** (ADR-0020 Appendix A:
`services → [core, db, contracts, shared]`; agent is not in the
allowed set, and unlike agent→db there is no sanctioned pattern for
a service reaching up into `@/agent/**`).

Governance home: **ADR-0020 Appendix A** (the boundary rule;
`eslint-rules/agent-first-import-boundaries.js`) + the **Arc 2
friction-journal entry** (2026-06-06, "Agent→adminClient cleanup —
Arc 2 (Class B)"), where both Class D sites and the two read gaps
are already on record as queued residue.

## 2. Derived baseline (grain-anchored; derived 2026-06-06, not inherited)

Codebase eslint grain pre-arc: 7 boundary-rule errors = 5 Class C
(app→db routes; out of scope, accepted baseline debt) + **2 Class D**:

| # | Site | Shape | Substance |
|---|------|-------|-----------|
| 1 | `services/document-platform/ingestionService.ts:142` | **runtime value import** | static top-level `import { ingestDocument }`; invoked at exactly ONE site (`:390`), the post-ingest-commit loop inside `handleDragDropUploadImpl`, Pattern-B best-effort isolation (failures audited internally, HTTP result always returned) |
| 2 | `services/spend/vendorService.ts:44` | **type-only import** | `import type { VendorMatchInput, VendorMatchResult, VendorCandidate }` from agent extraction types; fires at :44 (import-statement open — the prior ":48" was the closing-brace grain of the same site) |

Grain corrections to inherited framing: (a) vendorService fires at
:44, not :48 — same single site, statement-open grain; (b) the
spine-knot is narrower than "actively invoked in the live ingest
path" implied — the **forwarded-mailbox path never invokes
`ingestDocument`** (the postmark route composes
`handleForwardedMailbox` for ingestion only; pipeline pickup for
mailbox docs is the stranded-case sweep). Exactly one synchronous
invocation site exists.

## 3. Substrate findings (design inputs, all disk-derived this session)

1. **Sub-Q2 sync-v1 invocation lock** (cited at `ingestionService:382`):
   the per-document `ingestDocument` invocation is ratified
   SYNCHRONOUS in v1. An event/queue boundary (decision-space option
   C) would overturn a ratified lock — that is a governance
   amendment, not a refactor. Named and set aside unless the design
   read-back reopens it.
2. **The rule's matrix sanctions NO layer→agent import.** Entry
   surfaces use per-line annotated disables — verbatim precedent at
   the approve-post route ("Agent-entry surface (the
   api/agent/message/route.ts:16 precedent) … exempted explicitly"
   + `eslint-disable-next-line`). Any inversion/injection design
   relocates the services→agent edge to ONE annotated app→agent
   entry edge in the sanctioned shape — the edge does not vanish;
   it moves to where the architecture says entry edges live.
3. **Type half has a shared-layer near-home that is NOT a drop-in:**
   `shared/schemas/document-platform/documentRelationshipCandidate.schema.ts`
   already carries `VendorMatchResultSchema` + inferred type
   ("ADR-0014 §9 verbatim shape") — but it diverges from the agent
   interface (`match_type` includes `'alias'`, 7 values vs the
   impl's 6; `candidate_alternatives` is `z.record(z.unknown())`
   loose vs typed `VendorCandidate[]`). A swap would silently widen
   types. Pre-existing spec-vs-impl divergence: **record, don't
   absorb.** The behavior-preserving shape is relocation of the 4
   agent interfaces (`VendorMatchInput`, `VendorMatchResult`,
   `VendorCandidate`, + dependency `VendorIdentityFields`) to a
   neutral shared module with agent-side re-export (agent→shared
   legal; agent consumers `types.ts` + `reviewPreview.ts`
   unchanged).
4. **Consumer/blast map (spine):** `handleDragDropUpload` consumers:
   the drag-drop route (live path), `documentPlatformService.ts`,
   and direct-service-call tests
   (`ingestionService.dragDropUpload.integration.test.ts` + the
   route-grain `dragDropRoute.integration.test.ts`, plus mailbox
   composition tests). Any design that moves the invocation loop
   out of the service changes what direct-service-call tests
   exercise — the spec must map this exactly; this is where a
   silent test-surface weakening would hide.

## 4. Design step (T2 — advisor-cleared before fix work)

The spec argues the spine-knot direction between:

- **A. Invert** — move the post-commit invocation loop (with its
  Pattern-B catch block verbatim) up to the drag-drop route behind
  the sanctioned entry-surface disable; `ingestionService` loses its
  agent import entirely.
- **B. Port/seam** — `ingestionService` accepts an injected
  ingest-invoker (interface in `contracts/`/`shared/`); the route
  wires the concrete `ingestDocument` — which still requires the
  same annotated route-side agent import, plus interface machinery.
- **C. Event/queue** — set aside per finding 1 (ratified sync lock)
  unless read-back reopens.

Both live options produce the same single annotated entry edge; they
differ in where the loop's semantics live and what the service's
signature promises. Behavior-preservation bar is higher than Class
B's: every call site mapped, Pattern-B isolation byte-equivalent,
sync-v1 lock honored, and a real test surface exercised (the two
ingest integration suites at minimum). The spec picks one, with the
test-surface consequence map for both.

## 5. Fold-in decision (proposed: IN, severable)

The two Arc-2 ledgered read gaps —
`ruleOutcomeReadService.resolveRuleOutcomeParams` (vendor_rules, no
org filter; shadow/log-only) and
`extractionReadService.lookupDocumentCaseId` (document_jobs, no org
filter; UUID-safe but service-unscoped) — are proposed **scoped IN
as a severable tail task (T5)**: both follow the
`resolveRuleDefaultAccount` in-file model. These are **correctness
changes, not hoists** (adding `.eq('org_id', …)` narrows match
semantics): the task confirms the live call paths supply the right
org_id, lands WITH tests, and is explicitly severable to its own
arc if the spine design runs long. Ratification requested at
read-back.

## 6. Task skeleton

- **T1** — this charter (commit), relayed with T2 for clearance.
- **T2** — design spec for the spine-knot + type half; **advisor
  clears before T3+**.
- **T3** — type half: 4 interfaces → shared module + agent re-export
  + vendorService import swap (zero runtime change; typecheck the
  adjudicator).
- **T4** — spine fix per the cleared design; ingest integration
  suites green; eslint Class D 2→0.
- **T5** — (severable) read-gap org-scoping + tests.
- **T6** — close: re-derive both grains (expect codebase = 5, Class
  C only), friction-journal entry, Q33 untouched (its 3 sites are
  not this arc), residue named.

## 7. Out of scope

Class C (5 app→db routes — accepted baseline debt); Q33's 3
deferred agent-runtime sites (Double-Entry-Agent timing); the
spec-vs-impl vendor-match shape divergence (recorded as residue);
the 6 pre-existing LT-01b errors; push (operator-gated at terminal
close, Condition 1 `test:full` gates the 13+N stack).
