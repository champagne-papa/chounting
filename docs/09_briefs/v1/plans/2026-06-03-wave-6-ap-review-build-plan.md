# Wave 6 — AP Review (V1 ships) — build plan

**Status:** D1 **CLOSED** (T1–T5 shipped `98fe5be0..a776ab2a`; Condition-1
full-suite sweep 1651/0/10 green, +19 = D1 T4 exactly); D2.1 **LOCKED**
(advisor-cleared — see §5); D2.3 (sweep) + D3–D8 **scoped** (each surfaces
its own chunk detail + read-back before build). Plan only; no
implementation, commit, or push is authorized by this document beyond
what a per-chunk read-back has cleared.
**Anchored at:** HEAD `e571ceb5` (= `origin/staging`, branch `staging`).
**Wave:** 6 of the V1 wave plan
(`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §5).
**Deliverable type:** **build wave that registers invariants and amends
two ratified ADRs in place — NOT a new-ADR four-gate wave.** Grounds: §4
reserved block maps **no ADR to Wave 6** (0028–0033 → Waves 0–4, 0034/0035
→ V2, 0036 deferred); so no §8 per-ADR ratification lifecycle fires.
Under register-on-enforcement, Wave-6 enforcement code newly registers
`INV-WORKFLOW-001` (D6), `INV-EVIDENCE-001` (D5), and `INV-WORKFLOW-002`
(D2), and amends ADR-0031 D-0031.3 (D6) + ADR-0033 D-0033.7 (D5). Cadence
is therefore the **build cadence** — this plan → advisor green-light →
implement → per-deliverable artifact read-back → commit under the lock →
push on the CTO's explicit terminal go — **with doc-sync (D8) elevated to
first-class read-back gates** (the sharp contrast with Wave 5, which
registered no invariant and touched no governance doc).
**Lock:** `wave-6-ap-review` (held).

---

## 0. What this wave does

Wave 6 = **AP Review, the first behavioral consumer (A-complete)** — and
**V1 ships**. The §5 charter line (verbatim, `:154-157`):

> AP Review — first behavioral consumer (A-complete): review/inbox UI
> (net-new) + approve→post action (net-new) under the human ctx + real
> coding (consume matched rule's `default_account_id`) + matcher-gap fix +
> parked-backlog recovery + the deferred routing/silent-drop/§5.1-direct-test.
> V1 ships.

The posture inverts Wave 5: Wave 6 **writes truth to the ledger** (human
approve→post via `journalEntryService.post()`, INV-1's sole writer, under
the human's identity) and **persists evidence objects** — squarely on the
`adminClient` / persisted read-write surface where the Wave-2 IDOR class
lives. The cautionary discipline is load-bearing here: **every new read
facet derives from org-verified rows, never raw/caller-supplied ids**
(binds at D3/D5).

---

## 1. Governance-footprint determination (grounded)

| Surface | Wave-6 action | Grounding |
|---|---|---|
| `INV-WORKFLOW-001` | **register** (teeth) at D6 | ADR-0031 D-0031.3 "registers at Wave 6 (teeth), in `invariants.md` + a `ledger_truth_model.md` leaf"; D-0031.2 teeth-flip within ratified scope |
| `INV-EVIDENCE-001` | **register** at D5 | ADR-0033 D-0033.8 "registered by no one at Wave 2"; D-0033.7 "enforcement … lands at Wave 6" |
| `INV-WORKFLOW-002` | **register** (new) at D2 | new id (next free slot, §4 reserves `INV-WORKFLOW-001..005`); see §2 |
| ADR-0031 | **amend** D-0031.3 (registration record) at D6 | not a body rewrite — teeth-flip already ratified at D-0031.2 |
| ADR-0033 | **amend** D-0033.7 (persistence + subject↔trace final shape) at D5 | "where the general shape is final"; §7 carry-forward tracked at D-0033.7 |
| New ADR | **none** | §4 maps no ADR to Wave 6 |

ADR decision **bodies** (D-0031.3, D-0033.7/.8) are verified at the D6/D5
amendment read-backs, when the amendment text drafts against them — taken
on grounding-agent verbatim quotes for this plan, corroborated by the
`producers.ts` header + governance-plan §7.

---

## 2. Ratified governance decisions

**Q2 — Query-gap disposition (RATIFIED: scope-out).** The
`INV-WORKFLOW-001` teeth-flip (D6) blocks on the `query` intent, which has
no non-AI producer (`core/intent/producers.ts:71-83`). Disposition:
**formally scope `query` out of the V1 teeth** with a documented Phase-2
rationale — per `intent_model.md §5`, `QuerySpec` is a reserved Phase-2
shape; at V1 transient views are produced via the **Navigation** path,
which *has* non-AI producers, so there is no AI-only path for queries at
V1. Document the rationale **visibly** in the check + `producers.ts` (not
silent), with the **re-include trigger named**: when `QuerySpec` lands in
Phase 2 and `query` separates from `navigation`, `query` rejoins the teeth
and needs its own non-AI producer. (Building a non-AI Query producer now
is rejected as premature Phase-2 work.)

**INV-WORKFLOW-002 registration form (RATIFIED: single invariant).** The
routing fix and the no-silent-drops fix are two code seams (the pipeline's
unmatched-handling + `documentCaseService` transitions) realizing **one
property**. Per the INV-1 precedent (one property, multiple enforcement
sites = one invariant), register **one**:

> **`INV-WORKFLOW-002` — "terminal-disposition completeness / no silent
> drops":** every ingested document case advances to a pipeline-terminal
> disposition (`needs_review`, or a terminal case state `rejected` /
> `committed`); the pipeline never returns null-and-drops (the Inv-7 fix);
> no case orphans in a pre-review state (`received`). `needs_review` is the
> pipeline's terminal hand-off to the human — **not** a final case state.

The routing fix **also realizes INV-5's** human-review destination, but
INV-5 is **cross-referenced, not re-registered** (each invariant owns one
property even when one code change serves two). D8 carries **one leaf +
one `control_matrix` row** for `INV-WORKFLOW-002`, with an INV-5 cross-ref
on the routing — no "covering the routing half of INV-5" phrasing.
`INV-AUTONOMY-GATE-001` **stays reserved / post-V1** (governance-plan §2
Inv 5:57 — "Gate-driven auto-commit (`INV-AUTONOMY-GATE-001`) is post-V1");
Wave 6 does not touch it.

**Q1 — INV-2 input-side sanitization home (RESOLVED 2026-06-03: Option 1
— CTO formalization).** The home of the INV-2 input-side
(extraction-input) sanitization control — Wave 6 (D9) vs a named post-V1
track — was a CTO call. It is backstopped by INV-5 (proposal-only +
human review) + the INV-2 **output** boundary, so it is defense-in-depth,
not safety-load-bearing. **RESOLVED: Option 1 — post-V1 track; D9 is
omitted from Wave 6.** Flip condition: revisit the moment governed
auto-commit returns to the roadmap; build the control alongside that
governance. Named residual (recorded, not oversold): a contaminated
extraction misleading the human reviewer — kept low by source-document
visibility + the output-side bound; itself a post-V1 hardening
candidate. (Source of the open-item: the **Wave-5 build plan §8** "Open
items for Phil" — *not* governance-plan §8, which is the ratification
lifecycle; the retrospective §5 item 1 mis-cites "plan §8".)

---

## 3. Deliverable decomposition (D1–D8)

| # | Deliverable | Registers / amends | IDOR surface |
|---|---|---|---|
| **D1** | Matcher-gap fix (vendor-identity extraction field) — **foundational; unblocks D3/D4/D7** | — | no |
| **D2** | Routing + parked-backlog recovery + no-silent-drops (matrix-advancement `received→…→needs_review`; sweep over `state='received'` w/ completed `pipeline_trace`) | `INV-WORKFLOW-002` register; INV-5 cross-ref | — |
| **D3** | Review/inbox UI (net-new) + approve→post (net-new) under human identity (`ctx.caller.user_id → created_by`) | — | **yes** |
| **D4** | Real coding — consume matched rule's `default_account_id` in the posting path | — | — |
| **D5** | Evidence-object persistence + subject↔trace tightening (`evidenceObjectService`) | `INV-EVIDENCE-001` register; ADR-0033 D-0033.7 amend | **yes** |
| **D6** | `INV-WORKFLOW-001` teeth-flip — Query-gap scope-out (§2) → `exit(gaps>0?1:0)` → **wire `check-intent-producers.ts` into CI** (`.github/workflows/ci.yml`; it is wired into no CI today) | `INV-WORKFLOW-001` register; ADR-0031 D-0031.3 amend | — |
| **D7** | §5.1 direct ledger-row-delta test — the **positive** human-approve→post row-delta (non-vacuous post-D1); **not** the §3.3(b) auto-commit-zero negative | — | — |
| **D8** | Governance doc-sync (first-class) — register the invariants in `invariants.md` ↔ `control_matrix.md` ↔ `ledger_truth_model.md` leaves; amend ADR-0031 + ADR-0033; reconcile glossary "empty reserved directories at V1" | the above | — |
| D9 | INV-2 input-side sanitization control — **OMITTED** (Q1 RESOLVED 2026-06-03, Option 1: post-V1 track; see §2) | — | — |

**Sequencing:** D1 first (unblocks the post path → D3/D4/D7); D2 before D3
(the review surface needs routed cases); D5/D6 parallelizable; D7 after
D1+D3; D8 threaded through + at close.

**Deferred / out of Wave-6 scope (carried forward, grounded):** Tier-C
(AI) extraction-accuracy harness (post-V1, Wave-5 retro §5.2); Router
Subsystem-2 ambiguity-margin (ADR-0019 §13); `.strict()` output-boundary
hardening; Double Entry Agent AI-output boundary / agent-safety eval
(ruling (a), next agent touch); §3.3(b) commit-cluster extraction (post-V1,
with the governed-auto-commit re-wire — hotfix-spec `:204`, `:218-219`);
`ingestDocument.ts` `adminClient`/ADR-0020 lint ticket (separate,
unscheduled — line 58, no active violation: `src/agent/**` is
`no-restricted-imports:"off"` per Q33).

---

## 4. D1 — Matcher-gap fix (LOCKED)

**Objective:** structurally unblock vendor matching — `matchVendor`
resolves a non-null `vendor_id` for a vendor_invoice, so `completeCandidate`
(Subsystem 1) no longer auto-skips. **Extraction *accuracy* is explicitly
out of scope** (the ~30%-on-real-OCR baseline is recorded; the Tier-C
accuracy harness is post-V1, Wave-5 retro §5.2). D1's bar is structural
flow, not recall.

**Grounded gap chain (cites):**
- `VendorInvoiceExtractionSchema` (`shared/schemas/extraction/vendorInvoiceExtractionSchema.ts:36-47`) emits no vendor-identity field — only `vendor_id` (matcher **output** slot, `:39`).
- Tier A `tryExtractTierA` (`agent/orchestrator/extraction/vendorInvoiceExtractor.ts:52-96`) extracts invoice#/amount/date/due/currency — no name. Tier C prompt (`:98-112`) emits no `vendor_name` (and prohibits `vendor_id`).
- Bridge `extractVendorFields` (`agent/orchestrator/extraction/ingestDocument.ts:1061-1078`) reads `vendor_name`/`vendor_text`/`merchant_text`/`tax_id`/`email` (docstring: "per ADR-0007 §Tier 2 Read boundary: name + tax_id + email ONLY") → all `undefined` today.
- `matchVendor` (`services/spend/vendorService.ts:122-311`) keys on `vendorField.vendor_name ?? vendor_text ?? merchant_text` (`:133-134`), `tax_id` (`:162`), `email` (`:187`) → falls to `no_match` / `vendor_id:null` (`:305-310`).
- Downstream: `completeCandidate` (defined `services/document-platform/documentRouterService.ts:765`) skips at `:834-843` when `!vendor_match.vendor_id`.

**Field-naming alignment — confirmed:** the bridge reads and `matchVendor`
reads use the **same** keys (`vendor_name`, `tax_id`, `email`). Emitting
exactly those key names from the schema flows through with **no rename**;
the bridge already reads the full ADR-0007 name+tax_id+email boundary, so
the tax_id/email fast-follow (below) is schema-emit-only, no bridge change.

**Exit criterion:** a vendor_invoice whose OCR yields a `vendor_name`
matching a seeded `vendors.name` (same org) → `matchVendor` returns
`{vendor_id:<non-null>, match_type:'exact_name'|'fuzzy_name'}`, and
`documentRouterService.completeCandidate` no longer hits the `:834` skip.

**Tasks (each: implement → artifact read-back → commit under lock):**
- **T1 (schema):** add `vendor_name: z.string().optional()` to `VendorInvoiceExtractionSchema`; update the field-matrix docstring (`:16-22`, 11→12). *Surfaced first.*
- **T2 (Tier A):** best-effort `vendor_name` heuristic in `tryExtractTierA`; the exported `extractVendorInvoiceFieldsTierA` (`:200-204`, the Wave-5 eval entrypoint) inherits it. **The `tierASufficient` gate (`:128-131`) and the Tier-A→Tier-C fallthrough stay byte-unchanged** (see Discovery 2).
- **T3 (Tier C):** add `"vendor_name"` to the emitted JSON block (`:102-110`); leave the `Do NOT include vendor_id…` line intact (`vendor_id` stays matcher output). The prompt hash (`:114-117`) recomputes automatically.
- **T4 (tests):** unit (schema accepts `vendor_name`; Tier A extracts it) under the **fixture-offline eval-teeth** convention (`testing.md` — mock `callClaude`+`adminClient` to throw, sync-return assertion); integration (seeded vendor + extracted name → `matchVendor` resolves `vendor_id`; `completeCandidate` no longer skips at its real site).
- **T5 (doc-sync, D1-local):** schema docstring + `agent_architecture_policy.md §2.1.1` vendor_invoice field matrix (§2.1.1 grounded at impl-onset). **Distinct from D8's invariant registration.**

**Structural discoveries (resolved per advisor steers):**
1. **Schema change is mandatory + first (sequencing fact, not a question).** The schema is plain `z.object` (no `.strict()`) → Zod **strips** unknown keys, so a Tier-C `vendor_name` is dropped before the bridge without the schema field; and Tier A's `Partial<VendorInvoiceExtraction>` return type forces schema-first via `tsc`.
2. **Do NOT gate `tierASufficient` on `vendor_name`** (RATIFIED). Keeps D1 additive (shipped control flow byte-unchanged) and avoids paid Tier-C for often-zero benefit (an invoice with amount+invoice#+date but no name would fall to Tier-C, may still miss the name at the 30% baseline, and routes to `needs_review` either way). Unmatched → `needs_review` (D2) is the designed no-silent-drop behavior, not a failure.
3. **`tax_id` vs `tax_code_id` collision (fast-follow caution).** The schema's `tax_code_id` (`:43`, a tax *code*) is distinct from the vendor's `tax_id` the matcher reads. When the tax_id/email fast-follow lands, the new field must be named `tax_id` (matcher key) — **never** folded into `tax_code_id`.
4. **Scope: `vendor_name`-only for D1** (RATIFIED). Unblocks the dominant exact_name + fuzzy_name strategies with minimal surface and sidesteps Discovery 3 entirely for D1. `tax_id`/`email` (strategies 2-4) are a clean fast-follow (bridge already reads them → schema-emit-only).

**IDOR scope (honest):** D1 adds **no new `adminClient` read facet** —
`matchVendor` already org-scopes (`.eq('org_id', org_id)` throughout) and
the bridge is pure. The Wave-2 IDOR discipline binds at **D3/D5**, not D1.

---

## 5. D2.1 — Live routing + no-silent-drop wiring (LOCKED)

**Objective:** every case the pipeline processes reaches a terminal
disposition. Wire `ingestDocument` to advance case state and route both
decision outcomes to `needs_review`; register `INV-WORKFLOW-002` atomically
with the enforcement. (The v1-plan's "D2.2 registration" is absorbed into
T3 — the atomic registration commit; D2.3 = the parked-backlog sweep, its
own brief, after D2.1.)

**Grounded closures:**
- **(A)** No automation emitter exists for the gap transitions: the state
  RPC's sole caller is `transition()` (`documentCaseService.ts:195`), and
  the RPC validates row-existence + the Layer-1 CHECK only — matrix
  legality is app-side-only (`20240144:40-95`). Subsystem 2
  (`resolveCandidates`, `documentRouterService.ts:1428`) already owns
  `classified→matched` (branch (a): `set_case_head_pointer_with_audit`,
  state transition + rich decision-record audit, `20240150:164-172`) and
  `classified→needs_review` (branches (b)/(c): `record_router_decision` +
  cross-service `enqueueException`). **New:**
  `documentCaseService.advanceCaseAutomation` — the system-actor sibling of
  `transition()`; allowed set EXACTLY `{received→extracting,
  extracting→classified, matched→needs_review}`; **REFUSES `classified→*`**
  (single-ownership by construction — Subsystem 2 owns that segment);
  enforces `LEGAL_TRANSITIONS` app-side; calls the same audit-paired RPC;
  state-aware chain-advance, idempotent under re-runs. Human `transition()`
  + its Zod (approved|rejected discriminated union) stay byte-untouched.
- **(B)** Live CHECK = `document_cases_state_chunk_7_active` (trail
  1→2→6→7, `20240150:96-108`) — `extracting` not admitted. T1 carries the
  Layer-1 broaden → `document_cases_state_chunk_8_active` (+`extracting`).
  PG enum unchanged (all 10 states already); human `TransitionInputSchema`
  needs no broaden; the automation entry point's input schema is born
  aligned. Constraint name continues the linear chunk suffix per the
  item-7 codification (T1 — this is the named *second cross-phase
  CHECK-broaden event* per `20240150`'s own header, the deferred
  codification trigger). Empirical pin: 3 test sites across 2 files assert
  `/document_cases_state_chunk_\d+_active/` — `chunk_8` passes the pins;
  `wave_6` would break them.
- **(C)** Matched→`needs_review` = **direct automation transition** (lean
  (ii), ratified): `matched->needs_review` is already in
  `AUTOMATION_ONLY_TRANSITIONS`; a clean match is V1's NORMAL path (INV-5),
  not an exception; branch (a) is reachable at v1 via N=1, so the hand-off
  is required, not dead code. Audit shape: a plain state-transition row via
  the generic RPC — NOT a second decision record (the router decision was
  already recorded by the head-pointer RPC). Live `exception_reason`
  (`chunk_8_active`, 8 values) untouched. Unmatched stays exception-true:
  wire `resolveCandidates` after `completeCandidate` (the file's own v1
  contract, `documentRouterService.ts:76-80`) → branch (c)
  `enqueueException('unmatched_router_candidate')`.

**Wiring order (mandatory, not stylistic):** advance
`received→extracting→classified` (post-hoc, at decision) → call
`resolveCandidates` (the branch-(a) RPC guard is `WHERE state='classified'`)
→ for branch-(a) outcomes: the `matched→needs_review` hand-off via
`advanceCaseAutomation`. Post-classified failures → `enqueueException`
(`ai_fallback_validation_failed` fits the Tier-C case; others enumerated at
impl). **Flag for D3:** matched cases reach the inbox with persisted
candidates but NO persisted proposal (`parked_unposted` returns
`proposal_id:null`); D3 rebuilds at review time or persists proposals.

**Design decisions (ratified at the plan read-back):**
1. **Post-hoc at-decision advancement.** The chain is 3–5 separate RPC
   transactions ⇒ the orphan class is EVERY non-terminal state
   (`received`/`extracting`/`classified`/`matched` strandings), named in
   the leaf Residual and covered by the D2.3 sweep. (A single atomic
   `received→classified` RPC is the noted shrink-the-window option; not
   taken at V1.)
2. **Attachment-card path out of scope** (ADR-0011 §11) — named residual:
   committed+linked with case-state lagging at `received` by design;
   persists until its carry-forward closes; the D2.3 sweep distinguishes
   committed+linked-state-lagged from true orphans. Carry-forward, not
   absorbed (ratified-contract-scope discipline).
3. **Prospective property-scoping (registration honest on day one):**
   `INV-WORKFLOW-002` registers as a prospective process guarantee with
   three named residual classes — (i) attachment-card, (ii) pre-D2.1
   parked backlog (transitional; retired by D2.3), (iii) mid-chain
   strandings (reported + sweep-recoverable). Leaf framing: "reaches a
   terminal disposition, with the sweep as the eventual-consistency
   backstop" — NOT "never observed non-terminal" (a Subsystem-3 re-eval
   can transiently leave `matched` with no hand-off; sweep-backstopped).
   [Advisor refinement #1 — pinned at the T3 leaf read-back.]

**Registration (atomic at T3, per the sharpened Finding 1):** leaf +
`// INV-WORKFLOW-002` annotation in the SAME commit as the enforcing code
(the leaf↔annotation reachability diff is CI-hard); `invariants.md` #26
row + `control_matrix.md` entry in that same commit (procedure steps 3–4,
tests cited, no placeholder). D8 = counts 25→26 + reachability narrative +
final diff re-run. Layer 2, runtime/structural sub-type pinned at the leaf
read-back.

**ctx-widening (advisor refinement #2 — T2/T3 impl scope):**
`resolveCandidates` widens `ctx: ServiceContext` →
`ServiceContext | SystemActorServiceContext`, mirroring the
`completeCandidate` precedent (direct invocation, NOT through
`withInvariants`; no role-based authz on the system-actor path per
ADR-0007 §Tier 2) with the same documented rationale;
`advanceCaseAutomation` is born with the widened union + the same
rationale, explicitly covering the state-mutating transitions.

**Tasks (each: implement → artifact read-back → commit under the lock):**
- **T1** — Layer-1 migration (`chunk_7→chunk_8`, +`extracting`) +
  `types.ts` regen (expect zero diff — enum unchanged; the no-diff IS the
  verification) + local apply-verification + the item-7 naming-discipline
  codification (via `codify-convention`) + the `documentCase.schema.ts`
  docstring CHECK-history touch.
- **T2** — `advanceCaseAutomation` (gap-scoped; refuses `classified→*`) +
  unit tests incl. the human-boundary regression and the single-ownership
  refusal; ctx union per refinement #2.
- **T3** — `ingestDocument` wiring + the ATOMIC REGISTRATION commit
  (annotation + leaf w/ the ratified scoping + `invariants.md` #26 +
  `control_matrix` entry); `resolveCandidates` ctx-widening.
- **T4** — integration (matched→`needs_review` w/ plain-transition audit;
  unmatched→`needs_review` w/ exception row; legal persisted
  intermediates; stranding residual behavior) + Phase-8 pipeline e2e
  harness + full-suite Condition-1 sweep at D2.1 close.

**IDOR:** org derives from the parent case row throughout (verified shape);
no raw-id read facets.

**Q1 (INV-2 input home):** RESOLVED 2026-06-03, Option 1 — see §2 (post-V1
track; D9 omitted; flip condition = governed auto-commit returning to the
roadmap; named residual recorded). Did not gate D2.1.

---

## Cadence

Per-task read-backs under `wave-6-ap-review`; commit on each task's
read-back clear; push waits for the CTO's explicit terminal go. This
footer carries the **standing cadence only** — living arc status (chunks
locked/closed, decision resolutions) lives in this doc's **Status:**
header and the dated section bodies (§2/§5), not here. (Q1 resolved
2026-06-03, Option 1 — see §2; the footer's earlier present-tense Q1/T1
lines were a staleness class, retired at the Q1-amendment read-back.)
