# Class D design spec — services→agent dependency inversion

**Date:** 2026-06-06. **Status:** DESIGN — awaiting advisor clearance
(charter `b4ae622d` §4; no fix work until cleared).
**Base:** HEAD `b4ae622d`, branch `staging`.

## 1. The two halves

**Half 1 (spine-knot):** `ingestionService.ts:142` runtime import of
`ingestDocument`, invoked at exactly one site (`:390`) — the
post-ingest-commit Pattern-B loop inside `handleDragDropUploadImpl`
(catch = `log.error` + continue; result + HTTP contract unchanged on
pipeline failure). Sub-Q2 sync-v1 lock governs the invocation.

**Half 2 (types):** `vendorService.ts:44` type-only import of
`VendorMatchInput` / `VendorMatchResult` / `VendorCandidate`
(+ transitive `VendorIdentityFields`) from agent extraction types.

## 2. Half 1 decision — Option B: required-parameter injection

**Picked: B.** `handleDragDropUpload` gains a **required** third
parameter carrying the invoker; the loop, its data source
(`putRecords`), the Pattern-B catch, the result shape, and the HTTP
contract stay byte-identical in place. The drag-drop route imports
the concrete `ingestDocument` behind the sanctioned entry-surface
disable (the api/agent/message:16 / approve-post precedent, verbatim
on disk) and passes it through.

```ts
// services/document-platform/types.ts (service-owned; route→services legal)
/** Per-document pipeline invoker, injected by the entry surface
 *  (Class D inversion; the concrete value is agent-layer
 *  ingestDocument, wired at the route behind the entry-surface
 *  disable). Return value is ignored by the loop (pre-inversion
 *  behavior: awaited and discarded). */
export type IngestInvoker = (args: {
  org_id: string;
  source_document_id: string;
  trace_id: string;
}) => Promise<unknown>;
```

`handleDragDropUploadImpl(input, ctx, invokeIngest: IngestInvoker)` —
loop body becomes `await invokeIngest({ … })`, byte-equivalent
arguments. `handleForwardedMailbox` untouched (it never invokes).

**Why not A (invert — move the loop to the route).** Disk surfaced a
cost the charter's framing missed: the loop iterates `putRecords`
(service-internal), and `DragDropUploadResult` carries only
`{ ingest_batch_id, document_count }` — **no per-document ids**.
Moving the loop to the route forces either (i) widening the service
result to expose `source_document_id`s and re-narrowing the HTTP
response at the route to preserve the API contract, or (ii) a
route-side re-read to recover the ids. Both change more than the
boundary. B moves nothing but the edge.

**Why the invoker type is service-owned, not `contracts/`.** The
route may import services (matrix-legal); a `contracts/` home would
add a layer for one structural function type with exactly two
importers (service + route). YAGNI; relocation to `contracts/` is a
one-line move if a second entry surface ever appears.

**Why required, not optional-with-default.** An optional param
defaulting to no-op changes the service's default behavior (silent
pipeline-skip); defaulting to the agent import would re-create the
violation. Required = every caller chooses explicitly, and the
compiler — not a reviewer — finds every call site.

**Option C (event/queue):** set aside per the ratified Sub-Q2
sync-v1 lock (charter §3.1). Reopening it is a governance amendment
with its own arc.

**Test-surface consequence map (the silent-weakening watch):**

- `dragDropRoute.integration.test.ts` (route grain) — exercises the
  real wiring; no signature change visible; MUST stay green
  unmodified. This is the live-path proof.
- `ingestionService.dragDropUpload.integration.test.ts` (service
  grain) — compile-forced to supply an invoker. Wire the **real
  `ingestDocument`** (tests/** is rule-exempt per the established
  config rationale) to preserve what the test exercised pre-change;
  a recording stub is acceptable ONLY for cases that asserted
  ingestion-write behavior rather than pipeline behavior — decided
  per test case, recorded in the T4 commit body.
- Mailbox tests — untouched (no invocation in that path).

## 3. Half 2 decision — relocate the 4 interfaces to shared, re-export from agent

New module `shared/schemas/spend/vendorMatch.types.ts` (sits with
the spend schemas its consumer lives beside): `VendorIdentityFields`,
`VendorMatchInput`, `VendorMatchResult`, `VendorCandidate` — moved
**verbatim**, JSDoc included. Agent `extraction/types.ts` replaces
the four definitions with `export type { … } from
'@/shared/schemas/spend/vendorMatch.types'` (agent→shared legal), so
the agent-side consumers (`types.ts` importers, `reviewPreview.ts`)
are unchanged. `vendorService` imports from shared directly; the :44
violation disappears. Zero runtime change (types only); typecheck is
the adjudicator.

**Deliberately NOT unified** with the pre-existing
`VendorMatchResultSchema` in
`documentRelationshipCandidate.schema.ts` — that Zod shape diverges
from the implementation (7-value `match_type` incl. `'alias'`; loose
`candidate_alternatives`). Swapping would silently widen types.
The divergence is pre-existing spec-vs-impl residue: recorded at T6
with a pointer, not absorbed (ratified-contract scope).

## 4. T5 (severable) — the two read-gap corrections

Both call paths confirmed to have the right `org_id` in scope:

- `resolveRuleOutcomeParams` — already takes `orgId`; the
  `vendor_rules` query simply doesn't use it. Fix: add
  `.eq('org_id', orgId)`. Caller (`shadowRuleEvaluation:119`) passes
  `args.org_id` from the spine. Test: extend
  `shadowRuleEvaluation.integration.test.ts` with a cross-org
  vendor_rules row that must NOT resolve.
- `lookupDocumentCaseId` — takes only `source_document_id`; fix is a
  **signature change** `(org_id, source_document_id)` + `.eq('org_id',
  …)`. Callers: `ingestDocument.ts` `:219` (unknown-route) and
  `:331` (main lookup) — both have `input.org_id`/`parsed.org_id` in
  scope. Test: cross-org probe returning null.

Correctness changes, not hoists: each narrows match semantics, so
each lands with its test in the same commit. Severable to its own
arc if T4 runs long.

## 5. Task → commit map (post-clearance)

- **T3** — Half 2 (types): shared module + re-export + vendorService
  swap. Gate: typecheck + eslint (Class D 2→1).
- **T4** — Half 1 (spine): `IngestInvoker` + signature + route wiring
  + test updates. Gate: both ingest integration suites + route suite
  green; eslint Class D 1→0; `agent:validate`.
- **T5** — (severable) read gaps + tests.
- **T6** — close: re-derive grains (expect codebase = 5, Class C
  only); friction-journal; residue (Class C ×5, Q33 ×3,
  vendor-match shape divergence) named.
