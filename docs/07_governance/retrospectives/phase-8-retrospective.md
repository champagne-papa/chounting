# Phase 8 retrospective — Document Drop / Reconciliation Orchestrator

*Drafted at Session 78 close, 2026-05-23. Phase 8 ran Sessions 43–78 on
`staging`, banked locally (no push) per the push-terminal-close timing
pattern; the terminal-close push follows this retrospective. Scope-lock
cycle closed at `e413b80`
(`docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`).*

---

## §1 What shipped

Phase 8 decomposed into 10 substantive chunks plus one dedicated-fix-chunk
inserted mid-phase (after the Session 68 classifier gap, below). **10 of 11
chunks are impl-COMPLETE; chunk 10 is PARTIAL by design** (see §3). The
phase is therefore impl-incomplete by its original framing — chunk 10's
commit-path half is a scoped follow-up, not a closed item.

| Chunk | Session(s) | Commit | What shipped |
|------|-----------|--------|--------------|
| 1 | 50 | `6738e38` | Deploy-validation harness; sidecar timeout 10s→60s; e2e opt-in gate |
| 2 | 60 | `1acd798` | Per-feature contribution surface at `completeCandidate`; VALID_PAIRS pair-validity assertion |
| 3 | 61 | `4618806` | `composeScore` (weighted-sum, 5 axes) + `candidate_features.schema.ts` |
| 4 | 64–66 | `26d583a`→`3990160`→`6031107` | `router_match_against_state` pipeline_trace stage record; Subsystem 2/3 wiring; decomposed across 3 sessions |
| dedicated-fix | 70–73 | `e6bc7d0`…`63f7782`, close `32cba4a` | Tier A classifier real-OCR recalibration (see §2) |
| 5 (sub-chunk a) | 67 | `7ee1e00` | React component test infra (vitest jsdom + RTL) + 3 fixtures (33 tests) |
| 6 (sub-chunk b) | 74 | `6f35281` | `documentPipeline.*.e2e` assertion bodies + shared harness (real Modal) |
| 7 | 75 | `56c370a` | `postV1ReconciliationOrchestrator` (born_paid_bill bundle commit) |
| 8 | 76 | `bf1a79b` | `payment.record` permission + migration 20240162 + ingestDocument binding |
| 9 | 77 | `cd10a06` | `ProposalJustificationSchema` codification; ADR-0007 Q30 resolved |
| 10 | 78 | `48ebaf6` | **PARTIAL** — router-path `withInvariants`-adjacent widening; commit-path deferred |

Test baseline at phase close: **1403 pass / 0 fail / 10 skipped** (routine
`pnpm test`, `RUN_MODAL_E2E=0`); `agent:validate` 26/26. Chunks 5+6 were
authored as a single consolidated brief (Session 54) and implemented as two
sub-chunks; chunk 4 expanded and was implemented across three sessions.

## §2 Real findings (canonically documented elsewhere; pointers here)

- **Tier A classifier real-OCR calibration gap.** The Session 68 demo re-fire
  surfaced that the Tier A rule classifier mis-classified receipts and
  payment confirmations as `vendor_invoice` (over-broad `invoice`/`bill`
  positives firing on field-label cross-references). This drove the inserted
  dedicated-fix-chunk: shape-discriminating positives (field-label
  negative-lookahead), a receipt-header carve-out, and asymmetric
  receipt/payment-outrank-invoice precedence centralized in
  `tierCoordination`. Validated against a 10-doc real-OCR corpus with zero
  misclassifications (overfit guard). Canonical record: dedicated-fix-chunk
  close report `docs/09_briefs/phase-8/chunks/2026-05-23-phase-8-dedicated-fix-chunk-close-report.md`
  (commit `32cba4a`).

- **`synthCtxForCommit` is an auth gate, not a context-shape adapter
  (chunk 10).** The document-pipeline commit-path shim downgrades the
  orchestrator's system-actor context to a synthetic *verified* caller whose
  `user_id` has no membership, so Invariant 4 (`canUserPerformAction`) denies
  and the best-effort `try/catch` yields `proposal_id=null`. That shim is the
  de-facto gate currently preventing the pipeline from auto-committing ledger
  mutations. Retiring it is a ledger-authorization policy change, not a
  refactor (see §3). Canonical record: friction-journal entry 2026-05-23
  (commit `48ebaf6`).

- **Permission Catalog Count Drift undercount.** Adding one permission
  (`payment.record`, chunk 8) rippled to hardcoded catalog counts across
  CA-28 (`permissionCatalogSeed`) and CA-37 (`crossOrgRlsIsolation`) — more
  sites than the convention enumerates. The convention needs the complete
  grep recipe, not a representative subset. Canonical record: friction-journal
  entry 2026-05-23 (commit `bf1a79b`).

- **ADR-0014 canonical pipeline (8 stages, §1) vs runtime trace (~10
  stage_names).** The spec's §1 enumerates Stages 0–7; the runtime
  `pipeline_trace` emits more distinct `stage_name` values (the relationship
  step splits into `match_against_existing_state` + `router_match_against_state`,
  plus dedup/ai-fallback variants). Citation nuance: code comments cite
  "§13 canonical stage_names" but §13 is the Logic Receipt section; the
  enumeration is §1. Canonical record: friction-journal entry 2026-05-23
  (commit `6f35281`). **Reconciliation owed** (amend spec to match runtime, or
  trim runtime to match spec) — see §3.

- **E2E observable surface vs ledger-mutation assertions (chunk 6,
  Session 74).** The brief's e2e assertions expected ledger mutations (a bill
  created, `proposal_id` populated), but the pipeline commits `proposal_id=null`
  without a seeded matching vendor. Resolution: assert the observed runtime
  (10-stage traversal → committed → `proposal_id=null`) and defer 5 seeded
  scenarios as `it.skip` (see §3).

- **`RUN_MODAL_E2E` opt-in gate (Session 74).** vitest loads `.env.local`, so
  real-Modal e2e would run on every routine `pnpm test` (~130s cold-start,
  flaky). Gated behind an explicit env var; the routine suite skips e2e,
  giving the hermetic 1378→1403 baseline with 10 by-design skips.

- **Migration slot-collision mechanical shift (Sessions 75–76).** A chunk-4
  migration had occupied the slot the chunk-7 brief assumed free; resolved by
  a founder-ratified +1 mechanical shift (20240160/20240161, cascading to
  20240162 at chunk 8), with the stale brief citation banked rather than
  amended.

## §3 Deferred items (with their actual gate conditions)

- **Chunk 10 commit-path retirement.** Letting the system-actor context reach
  `withInvariants` and skip role-auth is a ledger-authorization policy change.
  Gate: an explicit ADR-0007 auth-model statement (do trusted system actors
  bypass Invariant 4, or carry explicit grants?) **plus** seeded auto-commit
  tests that make the behavior observable before it ships. `service-layer.md`
  Candidate #11 stays live until this lands.
- **The 5 `it.skip` seeded e2e scenarios (chunk 6).** Gate: seeded vendors/bills
  in the test fixtures so the pipeline reaches a real ledger commit.
- **Tier C empirical exercise.** Tier C (Claude fallback) is fully implemented
  but never exercised (Tier A handles the corpus). The 3 abstaining founder
  docs would exercise it via full `ingestDocument` + real Claude — runnable
  anytime; no blocker.
- **ADR-0014 §1/§13 stage reconciliation.** Decide between amending the spec
  to the runtime stage set or trimming the runtime trace; either is a small
  doc/code change, not a blocker.

### §3 closeout update (2026-05-23)

*Additive per ADR-0022; the original four-item §3 framing above is preserved.*

Phase 8 §3 is **closed** this session. The four deferred items resolved as
follows:

- **Item 4 (ADR-0014 §1/§13 stage reconciliation) — DONE** (commit
  `f3cc0e78`). §1 amended to enumerate the runtime ~10-stage set (10
  parent-level `stage_name` values + 2 AI-fallback child sub-stages) as the
  canonical enumeration home (additive); §13's stale parenthetical reconciled
  to point at §1; 11 code comments repointed from "§13 canonical
  stage_names" to §1. **Spec reconciled to runtime, not runtime to spec** —
  the runtime is what ships, what the real-OCR corpus tests against, and what
  `ProposalJustificationSchema.pipeline_trace` (chunk 9) consumes.
- **Item 3 (Tier C empirical exercise) — DONE** (commit `b2f4dee7`). The 3
  abstaining docs ran end-to-end through full `ingestDocument` with real
  `claude-sonnet-4-5`; Tier C validated end-to-end (Tier A abstain → live
  classify → extract → downstream → gated commit at `proposal_id=null`, the
  documented `synthCtxForCommit` behavior — no real ledger commit reached).
  All three emit the full 11-record `pipeline_trace`, empirically grounding
  the item-4 reconciliation. One finding (the founder payment-confirmation
  doc's Tier C extract returned a top-level array → Zod gate rejected →
  graceful degradation). Writeup:
  `docs/09_briefs/phase-8/2026-05-23-tier-c-empirical-exercise.md`;
  friction-journal 2026-05-23.
- **Items 1 + 2 (chunk 10 commit-path retirement; the 5 `it.skip` seeded e2e
  scenarios) — RE-CLASSIFIED as the *auto-commit arc*, the opening work of
  the next phase/arc — not Phase 8 cleanup.** Reasoning: auto-committing
  ledger mutations from the document pipeline is a **feature, not a fix**.
  The current v1 default — pipeline proposes, human reviews via canvas, human
  commits — is a defensible posture for a Canadian SMB accounting product
  where ledger mutations are high-trust. Retiring `synthCtxForCommit` is a
  ledger-authorization policy change gated on an explicit ADR-0007 auth-model
  statement (do trusted system actors bypass Invariant 4, or carry explicit
  grants?) **plus** seeded auto-commit tests — which subsume the 5 `it.skip`
  scenarios (item 2). Calling this "Phase 8 cleanup" undersells what it is.
  The auto-commit arc is the **named carry-forward** out of Phase 8.

New carry-forward surfaced this session (outside the original §3 four):

- **Tier C extract robustness.** Live Tier C extract can return a top-level
  array despite an explicit single-object prompt instruction (item 3
  finding). The Zod structural gate degrades gracefully today; a hardening
  follow-up (tolerate/unwrap single-element arrays, reinforce the prompt, or
  formalize the exception-route as intended behavior) is a candidate for the
  auto-commit arc's Tier C work or a standalone item. Friction-journal
  2026-05-23; N=1, not codified.

`service-layer.md` Candidate #11 (`synthCtxForCommit`) stays live until the
auto-commit arc lands. With items 3 + 4 done and items 1 + 2 reframed,
**Phase 8 §3 is complete; the auto-commit arc is the named carry-forward.**

### Auto-commit arc closeout (2026-05-24)

The auto-commit arc (the named carry-forward above) **landed this session** —
4 commits on `staging`:

- `a940ec6f` — ADR-0007 Q78 ratified (**Option A**: system actors bypass the
  identity invariants at `withInvariants`).
- `60b89106` — service-account substrate (**Path X**: `SYSTEM_ACTOR_USER_ID`
  seeded; `system_user_id` on `SystemActorCaller`; `actingUserId` helper).
- `edb260f6` — gate opened: `withInvariants` widened to admit + adapt system
  actors; `synthCtxForCommit` retired; `service-layer.md` Candidate #11
  retired. Routine parity held (no ledger-service edits — Approach Adapt).
- `c67801ec` — Option II seeded gate validation (paid-API-free integration
  test) + a `created_by`-citation correction.

**§3 item-1 (chunk 10 commit-path retirement) — DONE.** **§3 item-2 (seeded
auto-commit tests) — gate satisfied** via the Option II integration test
(`autoCommitGate.integration.test.ts`: bill + payment auto-commit attributed
to the service account; no-identity rejection). The original 5 **Modal-gated
e2e `it.skip` scenarios** (full-OCR coverage) are **NOT done** — they're a
**tracked follow-up** (paid `RUN_MODAL_E2E=1` founder-review run; only 2 of 5
commit ledger, the other 3 are attachment-routing; depends on the fixture
PDFs' real OCR yielding the right fields). Routine baseline **1406/0/10**.

Two corrections surfaced + fixed this arc (verify-from-disk):
- The `bills.created_by NOT NULL FK` blocker was a **misattribution** — `bills`
  has no `created_by`; the real NOT-NULL actor column is
  `bill_payment_allocations.created_by`. Path X unchanged + still necessary.
- The opener brief's Commit 4 framing (paid-API-free, 1408/0/5, 5
  seeded-commit tests) diverged from disk on all three counts. Both
  corrections: friction-journal 2026-05-24.

## §4 Pre-push gate status

- **`corpus.ts` PII scrub — DONE** (commit `b981c77`): renamed to
  `corpus.sanitized.ts` with structural separation; raw OCR output gitignored;
  classification verdicts identical pre/post.
- **`MEMORY.md` trim — DONE** (this session, home-dir, outside git): 91 KB →
  17.9 KB, all entries preserved, read-back validated.

Both pre-push gates are clear. The terminal-close push (this retrospective +
the Phase 8 chunk-impl bundle on `staging`) is the next and final step.
