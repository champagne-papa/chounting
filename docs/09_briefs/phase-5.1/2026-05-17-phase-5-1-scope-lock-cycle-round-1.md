# Phase 5.1 Amendments — Scope-Lock Cycle Round 1

**Session:** 15
**Date:** 2026-05-17
**Branch:** `staging`
**Local HEAD at session-onset:** `3ca0314`
**`origin/staging` HEAD:** `de6bc02` (5 commits ahead of local — friction-journal bank tail; see §1.1)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green; full vitest claimed at 1148/1148 (trusted absent contrary evidence).
**Predecessor:** Phase 6.5 terminal close at `d144240` ("Phase 6.5 retrospective writeup (Commit C)"); five subsequent friction-journal bank commits between `d144240` and `de6bc02` (codification-arc-sequence tail per `phase-6-5-codification-arc-sequence-retrospective.md`).

---

## §1 — Preamble + cross-references

### §1.0 What this cycle is

This is the **Round 1** of the Phase 5.1 amendments scope-lock cycle. Phase 5.1 ships three substrate amendments named at v3 §7 Step 8 + Phase 6 retrospective §6.b:

1. **INV-DOC-001 enforcement** — evidence-completeness invariant; bills require attached primary document.
2. **paymentService introduction** — currently `billService.recordPayment` handles payments; dedicated service per ADR-0011 §7 separation-of-concerns framing.
3. **vendor_credits substrate ratification** — currently reserved per Phase 2.5 Commit A; tables + (possibly) consumer service move from reserved-not-active toward v1-active.

Scope-lock cycle (not direct brief drafting) is the right preamble grain because Phase 5.1 substantively differs from Phase 6.5 chunk-grade work: three substrate amendments touching service-layer + invariant enforcement + table ratification. Cross-phase blast radius needs adjudication before brief drafting fires.

**Precedent shape:** Phase 2.5 (2 ADR amendments + retrospective writeup, three sequenced commits A→B→C at `docs/09_briefs/phase-2.5/`) is the amendment-cycle precedent. Phase 6.5 (substantive UI/ingestion chunks with 11-sub-question scope-lock cycle) is a heavier precedent shape. Phase 5.1 likely sits between these — heavier than Phase 2.5 (service-layer + invariant + table substrate vs ADR-text-only amendments) but lighter than Phase 6.5 (no UI surfaces; no greenfield computational shapes).

### §1.1 Session-onset divergence absorption

Two divergences from the Session 15 directive's preconditions surfaced at session-onset verify-from-disk. Both are absorbed at §1 rather than fired as a re-prompt:

**Divergence (a) — apReportService.ts path correction.** Directive cited `apps/web/src/services/spend/apReportService.ts`. Actual path is `apps/web/src/services/spend/reports/apReportService.ts` (one subdir level deeper, sibling to `vendorReportService.ts`). Banked as **candidate (c) pattern instance N=13** at session-prompt-authoring grain (partial-information-recommendation-drift; cited path inferred without verify-from-disk).

**Divergence (b) — HEAD-pin drift.** Directive pinned `HEAD = d144240`. Actual local HEAD at session-onset = `3ca0314`; `origin/staging` HEAD = `de6bc02` (5 friction-journal bank commits past `d144240`). The five commits are entirely documentation work (`docs/`, `scripts/`, `.claude/skills/`) — zero `apps/web/` scope, zero substrate or test changes, validation gates remain green. Phase 5.1 preconditions hold cleanly at `de6bc02` as they did at `d144240`. Banked as **candidate (c) pattern instance N=14** at session-prompt-authoring grain (HEAD-pin drift; cited HEAD inferred from "where Phase 6.5 left close" without verify-from-disk on `git log origin/staging`).

**Candidate (c) catalog observation.** N=14 total instances after Session 15 onset; brainstorming-arc grain now at N=9 (8 from Phase 6.5 + the two new instances above), the highest-firing grain in the three-grain catalog. Proportional observation banked for Phase 7 retrospective scoping or earlier amendment-cycle adjudication.

### §1.2 Phase 6.5 codification-arc-sequence retrospective — substrate-fit

The synthesizing retrospective at `docs/07_governance/retrospectives/phase-6-5-codification-arc-sequence-retrospective.md` (committed `de6bc02`) documents the eight-arc recursion sequence that fired post-Phase-6.5-close. **Substrate-fit for Phase 5.1 scope-lock cycle is assessed as WEAK.**

The retrospective codified 7 conventions, re-deferred 2 families (with triggers), resolved 1 Open Question, and refined 1 detector. All 7 conventions are scoped to meta-discipline work (codification / friction-pattern evaluation / skill output formatting), not amendment-cycle or scope-lock grain. The one entry with potential Phase 5.1 applicability — `conventions/README.md §Open codification questions` — provides canonical housing for meta-deferred decisions; if Phase 5.1 surfaces any meta-Open Question during scope-lock cycle, that section is the destination. No other entries from the synthesizing retrospective change how §2 verify-from-disk or §3 sub-question structure get drafted.

**Disposition:** Forward-reference-only; the retrospective is not cited at §2 or §3 of this cycle.

### §1.3 Sequencing observation — session count shift

v3 §7 Step 8 narrative estimated "Sessions 14-15" for Phase 5.1 amendments. Actual shape:

- **Session 14 (2026-05-16):** Phase 6.5 retrospective drafting (Phase 6.5 close at `d144240`).
- **Session 15 (2026-05-17, this cycle Round 1):** Phase 5.1 amendments scope-lock cycle onset.
- **Session 16+ (TBD):** Phase 5.1 brief drafting + implementation, or Round 2+ of this scope-lock cycle if disposition requires.

The shift from "Sessions 14-15" to "Sessions 15-16+" reflects the substantive grain of Phase 6.5 retrospective drafting at Session 14 (which v3 §7 Step 8 anticipated would conclude faster than realized). Banked as observation; not a scope-fire condition.

### §1.4 Canonical cross-references

- **v3 §7 Step 8** at `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md` — Phase 5.1 scope statement.
- **v3 §2.2 Finding J** — cross-phase finding motivating Phase 5.1; source authority Phase 6 retrospective §6.
- **v3 §9 Decision 5 + CTO Condition 7** — gate Round 2+ work (per-chunk acceptance criteria + decision-class split).
- **Phase 6 retrospective §6.b** at `docs/07_governance/retrospectives/phase-6-retrospective.md` — Phase 5.1 amendments two-inventory cross-phase consumer entry.
- **Phase 2 retrospective §6 line 587-589** — canonical Phase 5.1 naming source: "Phase 5 amendment work (INV-DOC-001 enforcement wiring; vendor_credits substrate) is the other parallel candidate; could ship as Phase 5.1 amendments before or alongside Phase 3/4/7."
- **Phase 5 retrospective §6 lines 404-414** — reserved-schema-seats framing for vendor_credits + vendor_credit_applications: "intentionally deferred — the founder and two real users haven't hit operational need for prepayments or credits in Phase 5's shakedown. If they hit need later, these become a B5-4 follow-on chunk; otherwise they remain reserved-seat substrate for whenever the operational signal arrives."
- **Phase 2.5 Commit A** at `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md` — vendor_credit + vendor_credit_application moved from v1-active 8 → v1-active 6 (reserved post-v1) per ADR-0010 substrate-now-enforcement-later discipline.
- **Phase 2.5 Commit B** at `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-b.md` — ADR amendment shape codification (additive provenance-preserving; never restructure to absorb amendments invisibly).
- **ADR-0011 §7** at `docs/07_governance/adr/0011-document-platform.md:474-552` — ProposedMutation / ProposedMutationBundle / ProposedAttachment handoff; cited at Sub-Q2 (paymentService extraction scope) for separation-of-concerns framing.
- **ADR-0011 §15** at `docs/07_governance/adr/0011-document-platform.md:840-873` — DOC invariant prefix introduction + INV-DOC-001 reserved-candidate spec.
- **ADR-0015** (referenced by ADR-0011 §15) — owns the `override_evidence_completeness` controller-override mechanism.
- **ADR-0018 §item 4** — T2 dispatcher slot reserved at `paymentService.record()` post-commit dispatch hook (per Phase 4 retrospective §6.b cross-phase consumer inventory).
- **CLAUDE.md §Push readiness three-condition gate** — applies at Phase 5.1 close.
- **CLAUDE.md §Substrate-receipt discipline** + **§Prediction grounding** + **§Verify-forward-at-scope-lock for computational-shape chunks** — fire at this cycle.

---

## §2 — Verify-from-disk pass against named substrates

Per RI-6 four-grain + Grain 5 discipline at scope-lock-onset, this section walks the substrate-shape and existing-consumer-contract grains. Grain 2-3-4 deferral is documented at §2.3.

### §2.1 — Grain 1: substrate-shape verify-from-disk

#### §2.1.a INV-DOC-001 leaf state

**Finding.** `INV-DOC-001` is **NOT a leaf in `docs/02_specs/ledger_truth_model.md`** (grep returns 0 hits across 5087 lines).

**Reserved-candidate spec exists** at ADR-0011 §15 lines 845-859:

> **INV-DOC-001 (reserved candidate).** Every committed bill / case has at least one `source_document_links` row with a `primary_invoice` (or `primary`) `link_role`, unless a controller override is recorded. The candidate's exact shape (per-bill vs per-case) and the override mechanism are filed as Q-new (per spec §13, deferred for downstream ADR scoping).
>
> **Layer:** Layer 2 (service-layer enforcement). The `billService.post()` and adjacent commit paths refuse to commit bills without an attached primary document, except when the `override_evidence_completeness` controller flag is set on the bill row. The override mechanism is owned by ADR-0015.
>
> **Registration.** This ADR specifies the prefix name and the first candidate. Actual registration in `docs/02_specs/invariants.md` happens at Phase 0 governance plan Task E1 (after this ADR ratifies). The schema-level seats — for example, the controller-override flag — ship at the AP/Spend Subdomain ADR's first migration; the Layer 2 enforcement lands when the AP foundation phase ships.

**Phase 5.1 substrate-shape consequence.** AP foundation (Phase 5) **has shipped** — the Layer 2 enforcement landing is therefore **overdue per ADR-0011 §15**. Phase 5.1's INV-DOC-001 work covers two distinct artifacts:

- **(a) Leaf registration.** Promote INV-DOC-001 from reserved-candidate (ADR-0011 §15) to leaf in `ledger_truth_model.md` + rollup in `invariants.md` + (if applicable) audit row in `control_matrix.md`.
- **(b) Layer 2 enforcement code.** Land `billService.post()` (and any adjacent commit paths) refusal-to-commit-without-primary-document behavior, with `override_evidence_completeness` short-circuit.

This is a two-artifact shape (doc + code) at amendment-cycle grain — not a single-shape amendment.

#### §2.1.b paymentService nonexistence

**Finding.** `apps/web/src/services/spend/paymentService.ts` **does not exist on disk** (git log --all grep returns 0). No prior introduction; Phase 5.1 introduces this service from greenfield.

**Current handler location.** `apps/web/src/services/spend/billService.ts:515-744` (229 lines for `recordPayment` function, including header doc comment). Surface:

- Zod boundary validation (`RecordBillPaymentInputSchema`)
- Sub-L precondition: bill.currency === 'CAD' (v1 single-currency)
- INV-AP-002 Layer 2: state-transition path enforcement (`approved_for_payment` ∪ `partially_paid` precondition)
- Validates referenced `fiscal_period_id` + `ap_control_account_id` + `cash_account_id` exist in org (defense-in-depth)
- INV-AP-001 Layer 2: cumulative allocation sum ≤ `bill.amount_cad`
- Composes payment JE (Dr ap_control / Cr cash) and delegates to `journalEntryService.post()` (Reading B preserved)
- Inserts `payments` row (payment_purpose='bill_payment', payment_state='paid')
- Inserts `bill_payment_allocations` row
- Computes new `lifecycle_state` ('partially_paid' if cumulative < bill.amount_cad; 'fully_paid' if cumulative >= bill.amount_cad)
- Updates `bills.lifecycle_state`
- Emits `bill_payment_recorded` audit (bill grain)
- Dispatches T5 trigger (per Phase 4 retro §6.b chunk-3-Phase-4 carry-forward) when newState === 'fully_paid' (per F-J-12 conditional gating)

**Phase 5.1 substrate-shape consequence.** paymentService extraction has two possible shapes adjudicated at Sub-Q2:

- **Full extraction:** All 229 lines move to paymentService.payment(); billService.recordPayment becomes a thin wrapper or is deleted in favor of direct paymentService.payment() call sites.
- **Partial extraction:** paymentService introduced as new service with paymentService.payment() handling ledger-touching mutation; billService.recordPayment retains as orchestration wrapper that composes paymentService.payment() + bill-grain audit + T5 dispatch.

Both shapes preserve Reading B (journalEntryService remains sole journal_entries / journal_lines writer).

#### §2.1.c billService.recordPayment current invariant-wrap

Per `apps/web/src/services/spend/billService.ts:9-13` header doc:

> Mirror pattern: vendorPrepaymentService.ts (chunk B5-1). Plain unwrapped functions exported as service object; route handlers wrap via withInvariants(action: 'bill.post' | 'bill.approve' | 'bill.record_payment' | 'bill.reverse') per Pattern B INV-SERVICE-001 export contract.

Phase 5.1 paymentService extraction inherits the Pattern B export shape. The route-handler wrap action shifts from `'bill.record_payment'` to (likely) `'payment.record'` — naming adjudication is Sub-Q2 sub-decision.

**Adjacent consumer hooks already wire to `paymentService.record()`:**

- **T2 dispatcher slot** per ADR-0018 §item 4 — currently reserved-at-T2-pending-paymentService.ts per Phase 4 retro §6.b activation-trigger inventory.
- **Phase 4 chunk 3 documentRouterService.dispatchTrigger** already emits T1/T3/T5/T8/T10 (T2/T4/T6 reserved pending paymentService.ts + vendorCreditService.ts per memory of Phase 4 chunk 3).

#### §2.1.d vendor_credits + vendor_credit_applications reservation state

**Finding.** Tables `vendor_credits` + `vendor_credit_applications` **do not exist** in any migration in `supabase/migrations/`:

- `supabase/migrations/20240147000000_source_document_links_substrate.sql:24` — header comment cites "vendor_credits / vendor_credit_applications tables. The…" framing them as reservation-only.
- `supabase/migrations/20240149000000_document_relationship_candidates_substrate.sql:135` — header comment cites "vendor_credits table doesn't exist."

**Reservation extant in enum.** Phase 2.5 Commit A (`9d788e2`) moved `vendor_credit` + `vendor_credit_application` from `linked_entity_type` v1-active (8 values) to reserved-post-v1 (22 values). Per Commit A §6 sub-finding 6.3: "Phase 5 substrate did not ship `vendor_credits` / `vendor_credit_applications` tables (no v1 consumer service). Moved to reserved post-v1 per ADR-0010 substrate-now-enforcement-later discipline."

**Phase 5 retrospective §6 lines 404-414 framing (verbatim):**

> The "reserved schema seats" framing for prepayments and credits. `vendor_prepayments`, `vendor_prepayment_applications`, `vendor_credits`, `vendor_credit_applications` tables exist in the schema; `vendorPrepaymentService` has three of four methods. None of them are user-reachable through any UI. This is intentionally deferred — the founder and two real users haven't hit operational need for prepayments or credits in Phase 5's shakedown. If they hit need later, these become a B5-4 follow-on chunk; otherwise they remain reserved-seat substrate for whenever the operational signal arrives.

**Verify-from-disk correction.** Phase 5 retrospective §6 asserts `vendor_credits` + `vendor_credit_applications` "tables exist in the schema." Actual disk state: **the tables do NOT exist in any migration**. Phase 5 retro is partially incorrect on this point; only the enum reservation exists. The `vendor_prepayments` + `vendor_prepayment_applications` tables DO exist (migration 20240138000000); vendor_credits siblings do not. This is a §2.1 Grain 1 finding worth banking: Phase 5 retro statement was authored without verify-from-disk on actual migration contents.

**Phase 5.1 substrate-shape consequence.** vendor_credits ratification has three possible scopes adjudicated at Sub-Q3:

- **(α) Enum-reservation-only ratification:** Move `vendor_credit` + `vendor_credit_application` from reserved-post-v1 back to v1-active in `linked_entity_type` CHECK constraint. Tables remain non-existent until first real-user operational signal. This is "ratification" in name only — equivalent to amending Phase 2.5 Commit A's amendment back.
- **(β) Substrate-ratification:** Land `vendor_credits` + `vendor_credit_applications` tables (mirroring `vendor_prepayments` + `vendor_prepayment_applications` shape) + activate enum values. No consumer service.
- **(γ) Full ratification:** (β) + vendorCreditService surface (mirroring vendorPrepaymentService's 3-of-4-methods shape per Phase 5 retro) + T4/T6 dispatcher activation per Phase 4 chunk 3 reserved trigger slots + (possibly) UI surface.

Sub-Q3 adjudication requires the founder's "operational signal" call: has the post-Phase-5-shakedown period accumulated operational need for credits? If yes, (γ); if not yet, (β) for substrate-readiness-without-service; if explicitly "still no signal," (α) re-defer.

#### §2.1.e bills.override_evidence_completeness reserved Phase 2 stub

**Finding.** Column **already exists on disk**:

- `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql:167-172`:
  ```
  -- bills.override_evidence_completeness: reserved Phase 2 stub for INV-DOC-001
  ALTER TABLE bills
    ADD COLUMN override_evidence_completeness boolean NOT NULL DEFAULT false;
  ```
- TypeScript types regenerated at `apps/web/src/db/types.ts:436` (Row), `:456` (Insert), `:476` (Update).

**Phase 5.1 substrate-shape consequence.** The Layer 1 substrate for INV-DOC-001's override mechanism is already shipped at Phase 5. Phase 5.1 INV-DOC-001 enforcement does NOT need a Layer 1 migration; it lands at Layer 2 (service code) only. This is a tighter substrate-shape than the directive may have anticipated.

#### §2.1.f evidence/ substrate

**Finding.** `apps/web/src/services/evidence/` exists with **only `.gitkeep`** (zero-byte). Per Phase 6 retro §6.b: "the directory ships with `.gitkeep` at v1; first realization at Phase 5.1 reviewer-side surface design."

**Phase 5.1 substrate-shape consequence.** The evidence/ directory is the substrate-allocation seat for INV-DOC-001 enforcement (and potentially other DOC-prefix invariants). Phase 5.1 INV-DOC-001 enforcement may either:

- **(a) Land enforcement inside billService.post()** at `apps/web/src/services/spend/billService.ts` — service-internal enforcement, no new evidence/ surface.
- **(b) Introduce evidence-service substrate** at `apps/web/src/services/evidence/evidenceCompletenessService.ts` (or similar) that billService.post() calls.

This is a Sub-Q4 sub-decision. Phase 6 retro §6.b's "first realization at Phase 5.1 reviewer-side surface design" framing suggests evidence/ is intended to host a service substrate (option b), not just inline enforcement (option a). Sub-Q4 adjudicates.

### §2.2 — Grain 5: existing-consumer-contract verify-from-disk

#### §2.2.a billService consumers

`billService.recordPayment` is consumed by:

- **Route handler:** `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` (or analogous path — verify-from-disk at brief-draft).
- **Agent tools:** any tool that emits `'bill.record_payment'` action (per ADR-0007 Tier 2 framing).
- **Integration tests:** likely under `apps/web/tests/integration/` (verify-from-disk at brief-draft).
- **Phase 4 chunk 3 dispatchTrigger emission:** dispatchTrigger fires T5_bill_state_transition on `newState === 'fully_paid'` post-recordPayment per F-J-12 conditional gating; T5 emission is internal to billService.recordPayment and is part of the function's contract.

**Phase 5.1 paymentService extraction consequence.** Whichever shape Sub-Q2 picks (full vs partial extraction), the consumer surface refactor is non-trivial:

- **Full extraction:** Every billService.recordPayment caller becomes a paymentService.payment() caller. Route handler + tests update.
- **Partial extraction:** billService.recordPayment retains as orchestration wrapper; callers unchanged; only internals refactor.

Path C invocation evaluation (per RI-7) applies at Sub-Q2 sub-decision: if Sub-Q2 picks full extraction, Path C prospective dispatch at brief-draft (Grain 5 enumeration of all call sites) is warranted; if partial extraction, Path C does not fire.

#### §2.2.b vendor_credits expected consumers

Per Phase 5 retrospective §6 reserved-schema-seats framing, vendor_credits consumers are **gated by founder-and-two-real-users operational signal**. No current consumer surface; no UI exposure.

If Sub-Q3 picks (γ) full ratification, expected consumers mirror vendorPrepaymentService shape:

- vendorCreditService.record / apply / refund / status methods
- Route handlers at `apps/web/src/app/api/orgs/[orgId]/vendor-credits/...`
- T4 dispatcher activation (per Phase 4 chunk 3 reserved slot)
- T6 dispatcher activation (per Phase 4 chunk 3 reserved slot)
- (Possibly) UI surface at vendor-card or AP report shell

Sub-Q3 (γ) consumer surface is substantial — comparable to Phase 5 chunk B5-1 (vendorPrepaymentService introduction). If Sub-Q3 (γ) is the disposition, Phase 5.1 likely decomposes (Sub-Q1 chunked) rather than ships as single amendment cycle.

#### §2.2.c INV-DOC-001 enforcement consumers

The enforcement consumers are billService.post() (canonical per ADR-0011 §15) and "adjacent commit paths." Identifying adjacent commit paths requires verify-from-disk at brief-draft:

- billService.post() — primary
- billService.approveForPayment? — likely not (no JE; state-only)
- billService.recordPayment? — bill must already have post()-ed; the primary-document check fires at post(), not at recordPayment
- billService.reverse? — reverses a previously post()-ed bill; primary-document check inapplicable post-reversal
- Document Platform commit paths? — Document Platform produces proposals; ledger-touching commits happen in domain services. The `documentLinkService.create()` path with `link_role='primary_invoice'` (or 'primary') is the canonical attachment-creation surface that INV-DOC-001 reads. If a primary attachment is detached after bill post(), is that allowed? Sub-Q4 adjudicates.

**Adjacent enforcement-shape framings to inherit:**

- Phase 1.1 audit framework UF-001 (transaction atomicity) — adjacent enforcement-shape
- ADR-0010 substrate-now-enforcement-later discipline — applies to INV-DOC-001 promotion
- ADR-0011 §15 Layer 2 pin — non-negotiable; INV-DOC-001 is Layer 2 per ADR

### §2.3 — Grain 2-3-4 deferral note

Phase 5.1 is amendment-cycle grain (not computational-shape dispatcher chunk grain like Phase 4 chunk 3). The four-grain framework from Phase 4 retrospective is:

- **Grain 1:** Substrate-shape (covered §2.1)
- **Grain 2:** Per-trigger semantic coverage (computational-shape-specific)
- **Grain 3:** Per-trigger × per-decision-outcome conformance (computational-shape-specific)
- **Grain 4:** Idempotency-and-side-effect-contract conformance (computational-shape-specific)
- **Grain 5:** Existing-consumer-contract conformance (covered §2.2)

**Grain 2-3-4 likely partial applicability at Phase 5.1:**

- **paymentService extraction (Sub-Q2):** If full extraction picks Path C invocation, Grain 5 fires intensively; Grain 2-3-4 do not naturally fire because paymentService.payment() is a single mutation (no per-trigger dispatch shape internal to the service).
- **INV-DOC-001 enforcement (Sub-Q4):** Single-invariant enforcement at single commit path (billService.post()); Grain 2-3-4 do not fire.
- **vendor_credits ratification (Sub-Q3):** If (γ) full ratification, vendorCreditService surface mirrors vendorPrepaymentService — which is itself non-computational-shape. Grain 2-3-4 do not fire.

**Adjudicate at Round 1 close.** Round 1 surfaces no Grain 2-3-4 walk requirement; if subsequent rounds discover Grain 2-3-4 firing (e.g., Sub-Q3 (γ) introduces T4/T6 dispatcher emission that requires per-trigger coverage walk), surface at that round.

### §2.4 — Verify-from-disk findings worth banking

1. **Phase 5 retrospective §6 assertion correction.** Phase 5 retro asserts vendor_credits + vendor_credit_applications "tables exist in the schema." Actual: tables do not exist. Bank as friction-journal candidate at Phase 5.1 retrospective: retrospective-assertion-without-verify-from-disk firing at cross-phase-claim grain (variant of candidate (c) at retrospective-authoring grain).

2. **bills.override_evidence_completeness Layer 1 already shipped.** Phase 5.1 INV-DOC-001 enforcement is Layer 2 only; no Layer 1 migration needed. Banked.

3. **evidence/ substrate is .gitkeep-only.** First realization target at Phase 5.1; specific surface shape adjudicated at Sub-Q4.

4. **AP/Spend service surface inventory.** billService.ts (946 lines), vendorService.ts (90 lines), vendorPrepaymentService.ts (582 lines), apReportService.ts at `spend/reports/` (909 lines, NOT at `spend/` per directive cite). vendorPrepaymentService exports `record` as `.record(...)` method on the service object (Pattern B internal helpers + export-const surface).

---

## §3 — Sub-question structure

Round 1 surfaces seven sub-questions at the amendment-cycle scope-lock grain. Round 2+ adjudicates.

### Sub-Q1 — Phase 5.1 amendments decomposition

**Question.** Single amendment cycle vs chunked decomposition?

**Options:**

- **1.α Single amendment cycle.** All three substrates ship together as a sequenced commit trail (analogous to Phase 2.5 Commit A → B → C). Plausible if total volume ≤ Phase 2.5 grain (~1500-2500 lines incl. retrospective).
- **1.β Chunked decomposition.** Phase 5.1 decomposes into three sub-chunks:
  - chunk 5.1a — INV-DOC-001 enforcement (leaf registration + Layer 2 enforcement)
  - chunk 5.1b — paymentService extraction
  - chunk 5.1c — vendor_credits substrate ratification
- **1.γ Partial decomposition.** Two of three substrates share a chunk; one separate. Sub-variants:
  - 1.γ-i — 5.1a (INV-DOC-001 + paymentService) + 5.1b (vendor_credits) — pairs the two AP-foundation-related substrates
  - 1.γ-ii — 5.1a (INV-DOC-001) + 5.1b (paymentService + vendor_credits) — pairs the two service-layer-introducing substrates

**Adjudication inputs:**

- Phase 2.5 precedent: 2 ADR amendments + retrospective = 3-commit single-cycle (1.α-shape)
- Phase 6.5 precedent: 3 chunks decomposed at 800-1300 lines per chunk (1.β-shape)
- Volume forecast (informed by §2.1 substrate-shape findings):
  - INV-DOC-001: 1 leaf addition + 1 invariants.md rollup + 1 control_matrix.md row (small docs) + billService.post() enforcement (~50-150 LOC depending on Sub-Q4) + tests (~150-300 LOC) → ~400-700 LOC
  - paymentService: greenfield service (~250-400 LOC) + billService.recordPayment refactor (~100-150 LOC if partial; ~200 LOC if full) + tests (~200-400 LOC) + route-handler refactor + T2 dispatcher activation → ~700-1300 LOC
  - vendor_credits: depends on Sub-Q3 disposition; (α) tens of LOC, (β) ~400-800 LOC, (γ) ~1500-2500 LOC
- Total range:
  - (α-shape Sub-Q3): ~1100-2000 LOC → 1.α (single cycle) feasible
  - (β-shape Sub-Q3): ~1500-2800 LOC → 1.γ likely (some pairing) or 1.β (full decomposition)
  - (γ-shape Sub-Q3): ~2600-4500 LOC → 1.β (full decomposition) required

**Path C invocation evaluation** (per RI-7) **defers to Round 4.** Sub-Q1 disposition depends on Sub-Q2 + Sub-Q3 sub-decisions; lock at Round 4 after those resolve.

**Decision class:** Governance-critical (per CTO Condition 7) — landed at scope-lock cycle, not implementation-brief review.

### Sub-Q2 — paymentService extraction scope

**Question.** What gets extracted from billService.recordPayment into paymentService?

**Options:**

- **2.α Full extraction.** All 229 lines of billService.recordPayment move to paymentService.payment(). billService.recordPayment either deletes (callers update to paymentService.payment()) or becomes thin re-export (callers unchanged but billService surface preserved as compatibility shim).
  - 2.α-i — full extraction + caller refactor (Path C invocation fires; Grain 5 walk)
  - 2.α-ii — full extraction + compatibility shim (callers preserved at billService surface; refactor scope tighter; Path C does NOT fire)
- **2.β Partial extraction.** paymentService.payment() introduced as new service handling the **payment-domain-pure** logic — JE composition + payment row insert + bill_payment_allocations row insert. billService.recordPayment retains as orchestration wrapper that calls paymentService.payment() then handles bill-grain audit + lifecycle_state update + T5 dispatch.
  - 2.β-i — paymentService.payment() returns `{payment_id, journal_entry_id}` only; billService.recordPayment handles state update + audit + T5
  - 2.β-ii — paymentService.payment() handles end-to-end through allocation insert; billService.recordPayment handles lifecycle update + audit + T5 only

**Adjudication inputs:**

- **ADR-0011 §7 ProposedMutation handoff framing:** "Maps to one ledger-touching change. Commits through a domain service that produces ledger operations via `ledgerService.post(...)` per Reading B. Examples: `record_bill_payment`, `post_vendor_credit`, `apply_vendor_prepayment_to_bill`." This frames `record_bill_payment` as the canonical mutation name — implying the **mutation** belongs in one service. If paymentService.payment() is the canonical mutation owner, full extraction is the natural shape (2.α).
- **Phase 4 retro §6.b T2 dispatcher slot:** "Chunk-3-Phase-4 reserved T2 dispatcher slot activates at `paymentService.record()` post-commit dispatch hook." This frames `paymentService.record()` as the post-commit dispatch trigger source — also implying the **post-commit dispatch** belongs in paymentService. Consistent with 2.α (full extraction).
- **Separation-of-concerns counterargument:** payment domain is more general than AP (could absorb vendor refunds, customer prepayments, banking payouts in future phases). billService.recordPayment is AP-domain-specific orchestration; the cleanest separation is paymentService = payment domain primitive + billService.recordPayment = AP-domain orchestration that composes paymentService + bill-grain side effects. This frames 2.β as the cleaner architectural shape.
- **Naming.** If 2.α, the service is `paymentService` and the method is `payment()` or `record()`. If 2.β-i, the service is `paymentService` and the method is `payment()` (returns payment + JE; no allocation). If 2.β-ii, the service is `paymentService` and the method is `payment()` (returns through allocation insert).
  - Sub-decision: method name. `paymentService.record()` (per Phase 4 retro §6.b naming) vs `paymentService.payment()` (mutation-name canonical per ADR-0011 §7) vs `paymentService.create()` (CRUD-grain). Round 2 adjudicates.

**Decision class:** Governance-critical (per CTO Condition 7). Architectural separation choice; lands at scope-lock cycle.

### Sub-Q3 — vendor_credits substrate ratification scope

**Question.** Does Phase 5.1 ship full consumer surface, substrate-only, or enum-only?

**Options:**

- **3.α Enum-reservation-only ratification.** Move `vendor_credit` + `vendor_credit_application` from reserved-post-v1 back to v1-active in `linked_entity_type` CHECK constraint. Tables remain non-existent. Equivalent to amending Phase 2.5 Commit A's amendment back; only sensible if the founder explicitly intends to ship the tables imminently (otherwise the v1-active vs reserved-post-v1 split is whatever the Phase 2.5 discipline says).
- **3.β Substrate-ratification (tables only).** Land `vendor_credits` + `vendor_credit_applications` migration mirroring `vendor_prepayments` + `vendor_prepayment_applications` substrate shape. Activate enum values. No vendorCreditService; no UI; no T4/T6 dispatcher activation.
- **3.γ Full ratification.** (β) + vendorCreditService surface (mirroring vendorPrepaymentService's 3-of-4-methods shape) + T4/T6 dispatcher emission per Phase 4 chunk 3 reserved slots + (TBD) UI surface.
- **3.δ No ratification — re-defer.** Phase 5.1 ships only INV-DOC-001 + paymentService. vendor_credits stays reserved per Phase 5 retro §6 framing ("reserved-seat substrate for whenever the operational signal arrives"). The Phase 5.1 scope statement (v3 §7 Step 8 + Phase 6 retro §6.b) is **trimmed** at Round 2 surfacing if the founder's signal hasn't fired.

**Adjudication input.** Phase 5 retrospective §6:404-414 explicit gating: "intentionally deferred — the founder and two real users haven't hit operational need for prepayments or credits in Phase 5's shakedown. If they hit need later, these become a B5-4 follow-on chunk; otherwise they remain reserved-seat substrate for whenever the operational signal arrives."

**Sub-Q3 adjudication requires the founder to surface operational-signal state at Round 2.** Round 1 surfaces the options; founder calls 3.δ (no signal yet → re-defer), 3.α (formal enum activation pending tables), 3.β (substrate-readiness without service), or 3.γ (full ratification with service surface).

**If 3.δ:** Phase 5.1's scope trims from three substrates to two (INV-DOC-001 + paymentService). v3 §7 Step 8 phrasing requires amendment: "vendor_credits substrate ratification" becomes "vendor_credits ratification deferred to post-Phase-5.1 contingent on founder operational signal."

**Decision class:** Governance-critical (per CTO Condition 7). Trim-vs-include disposition; lands at scope-lock cycle.

### Sub-Q4 — INV-DOC-001 enforcement implementation surface

**Question.** Where does the Layer 2 enforcement live?

**Options:**

- **4.α Inline at billService.post().** The enforcement check (`require attached primary_invoice link unless override_evidence_completeness=true`) lands as a precondition inside `billService.post()`, ~10-30 LOC.
- **4.β Service substrate at `apps/web/src/services/evidence/`.** Introduce `evidenceCompletenessService.ts` with `assertBillEvidenceCompleteness(bill_id, ctx)` (or similar shape). billService.post() calls it. Substrate-allocation seat at evidence/ realizes per Phase 6 retro §6.b "first realization at Phase 5.1 reviewer-side surface design."
- **4.γ Withinvariants wrap variant.** The enforcement lands as a `withInvariants` invariant (declared in middleware-layer invariant catalog) that fires on `'bill.post'` action. Centralized at middleware grain; doesn't live in service code at all.

**Adjudication inputs:**

- **ADR-0011 §15 pin:** "Layer 2 (service-layer enforcement). The `billService.post()` and adjacent commit paths refuse to commit bills without an attached primary document, except when the `override_evidence_completeness` controller flag is set on the bill row." Pin allows 4.α or 4.β (both are "service-layer"); 4.γ is middleware-layer, may or may not satisfy.
- **Phase 6 retrospective §6.b:** "`services/evidence/` substrate-allocation realization (chunk-3-Phase-4 carry-forward; the directory ships with `.gitkeep` at v1; first realization at Phase 5.1 reviewer-side surface design)." Suggests 4.β is the anticipated shape.
- **Reading B preservation:** any option that doesn't write to journal tables preserves Reading B (4.α, 4.β, 4.γ all do).
- **Future-extensibility:** If INV-DOC-002+ DOC-prefix invariants emerge, 4.β (service substrate at evidence/) is the natural home; 4.α (inline per-invariant) doesn't scale; 4.γ (middleware-wrapped) requires invariant catalog extension per new DOC invariant.

**Sub-decisions:**

- **4-a.** Per-bill vs per-case shape (ADR-0011 §15 leaves this as Q-new). The reserved-candidate spec says "Every committed bill / case has at least one `source_document_links` row with a `primary_invoice` (or `primary`) `link_role`." Sub-Q4-a adjudicates whether the enforcement is per-bill (one primary per bill) or per-case (one primary per case, regardless of how many bills route through the case). The case-shape mostly matters when multiple bills share a case (final invoice + manual bill merge, etc.).
- **4-b.** `link_role` accepted set. ADR-0011 §15 lists `primary_invoice` (or `primary`). Sub-Q4-b adjudicates whether the enforcement accepts `primary_invoice` only, `primary` only, or both. Cross-reference ADR-0016 §1 link_role v1-active values.
- **4-c.** Detach-after-post() handling. If a primary attachment is detached after bill post() succeeds, what happens? Options: (i) reject the detach (immutability rule via Layer 1 trigger); (ii) allow detach but auto-create an exception queue entry; (iii) allow detach silently. ADR-0011 §15 doesn't address; Sub-Q4-c surfaces.
- **4-d.** Backfill posture for existing bills without primary. The Phase 5 shakedown likely produced some bills without primary attachments (bill_id rows in the schema). Phase 5.1 INV-DOC-001 enforcement firing retroactively at billService.post() doesn't affect those — they're already post()-ed. But if Phase 5.1 introduces a backfill check (validate-all-existing-bills-have-primary at migration), that's a separate decision. Sub-Q4-d surfaces.

**Decision class:** Governance-critical for 4-main (α/β/γ); product-discovery for 4-a/4-b/4-c (UX micro-decisions affecting workflow shape); both governance-critical and product-discovery for 4-d (data-cleanup discipline). Per CTO Condition 7 split, 4-main lands at scope-lock; 4-a/4-b/4-c at implementation-brief review; 4-d at scope-lock if it shapes Phase 5.1 brief volume.

### Sub-Q5 — Ordering across substrates

**Question.** If chunked decomposition (Sub-Q1 1.β or 1.γ), what chunk order?

**Options:**

- **5.α v3 §7 Step 8 narrative order.** INV-DOC-001 → paymentService → vendor_credits (listed but not necessarily implementation-ordered).
- **5.β Dependency-derived order.** Sub-Q3 disposition shapes ordering:
  - If Sub-Q3 = 3.γ (full ratification), vendor_credits is heaviest → land last; INV-DOC-001 lightest → land first.
  - If Sub-Q3 = 3.δ (re-defer), only INV-DOC-001 + paymentService remain. Order: INV-DOC-001 first (no dependencies on paymentService); paymentService second (T2 dispatcher activation unblocks Phase 4 reserved slot).
  - paymentService's T2 dispatcher activation activates Phase 4 chunk 3 reserved trigger slot; vendor_credits (if 3.γ) would activate T4+T6. Ordering paymentService BEFORE vendor_credits lets each dispatcher activation land standalone without coupling.
- **5.γ Operational-priority order per Phase 2 retro §6:588.** "Both-shapes consumer (interleaves per operational priority per Phase 2 retro §6:588)" framing implies operational priority — but Phase 2 retro §6:588 doesn't actually specify a priority order. Surface this gap as Sub-Q5-a: is operational-priority order canonical-or-derivable?

**Path C invocation evaluation** per RI-7: if Sub-Q2 picks 2.α (full extraction), Path C prospective fires at paymentService chunk brief-draft; if Sub-Q2 picks 2.β (partial extraction), Path C does not fire. Lock at Round 4.

**Decision class:** Governance-critical for ordering disposition; product-discovery for per-chunk brief-draft details.

### Sub-Q6 — Phase 5.1 amendments artifact location

**Question.** Where do Phase 5.1 brief artifacts live?

**Options:**

- **6.α Phase 5.1-specific folder.** New folder `docs/09_briefs/phase-5.1/` (analogous to `docs/09_briefs/phase-2.5/`). Phase 5.1 briefs / cycle docs / scope-lock rounds live here.
- **6.β Phase 5-subfolder.** Co-locate at `docs/09_briefs/phase-5/phase-5.1-amendments/` or analogous nested path. Treats Phase 5.1 as a Phase 5 sub-phase rather than parallel phase.
- **6.γ Mixed.** Brief / cycle docs at `docs/09_briefs/phase-5.1/`; retrospective at `docs/07_governance/retrospectives/` per existing retrospective convention.

**Adjudication input.** Phase 2.5 precedent picked 6.α-shape: briefs at `docs/09_briefs/phase-2.5/`. Phase 6.5 precedent same: `docs/09_briefs/phase-6.5/`. Convention is stable.

**Disposition:** **6.α (briefs at `docs/09_briefs/phase-5.1/`)** — consistent with Phase 2.5 + Phase 6.5 amendment-cycle precedent. This Round 1 doc landed at this path.

**Decision class:** Product-discovery (file organization micro-decision); landed at Round 1 already via the choice of path for this artifact. Bank as Round 1 disposition; no further round needed.

### Sub-Q7 — Retrospective placement

**Question.** Where does the Phase 5.1 retrospective land?

**Options:**

- **7.α Standalone file.** `docs/07_governance/retrospectives/phase-5-1-retrospective.md` — consistent with phase-N-retrospective.md convention.
- **7.β Append to Phase 5 retrospective.** Add Phase 5.1 amendments section to existing `phase-5-retrospective.md`. Treats Phase 5.1 as Phase 5 amendment continuation.
- **7.γ Sibling synthesizing retrospective.** Follow the precedent set by `phase-6-5-codification-arc-sequence-retrospective.md` (committed at `de6bc02`): synthesizing retrospective lives at `docs/07_governance/retrospectives/` as a sibling to phase-N-retrospective.md. For Phase 5.1, this would be `phase-5-1-amendments-retrospective.md` or analogous; preserves Phase 5 retro and adds a Phase 5.1 sibling.

**Adjudication input.** Phase 2.5 chose 7.β-shape (Phase 2.5 retrospective was a section appended to Phase 2 retrospective per Phase 2.5 Commit C). Phase 6.5 chose 7.α-shape (`phase-6-5-retrospective.md` standalone). The user-noted Phase 6.5 codification-arc-sequence retrospective is a 7.γ-shape (sibling synthesizing).

The convention is **inconsistent across precedents**. Sub-Q7 surfaces this gap.

**Disposition framing:** Phase 5.1 amendments are substrate-shipping (INV-DOC-001 + paymentService + vendor_credits) rather than retrospective-synthesis-of-prior-arc (which is what 7.γ documents). 7.α (standalone) or 7.β (append) are the substantive options; 7.γ doesn't fit. Sub-Q7 adjudicates 7.α vs 7.β at Round 2 (after Sub-Q1 disposition; if single amendment cycle 7.β may be cleaner; if chunked decomposition 7.α is cleaner).

**Decision class:** Product-discovery (file organization micro-decision); landed at Round 2 after Sub-Q1.

---

## §4 — Decision-class split per CTO Condition 7

Per v3 §9 Decision 6 + CTO Condition 7: governance-critical decisions land at scope-lock cycle; product-discovery micro-decisions land at implementation-brief review.

**Governance-critical (lands at this scope-lock cycle):**

- Sub-Q1 (decomposition: single-cycle vs chunked)
- Sub-Q2 (paymentService extraction scope: full vs partial)
- Sub-Q3 (vendor_credits ratification scope: α/β/γ/δ)
- Sub-Q4 main (INV-DOC-001 enforcement surface: 4.α inline / 4.β evidence-service / 4.γ middleware-wrapped)
- Sub-Q4-d (backfill posture for existing bills without primary, if it shapes Phase 5.1 brief volume)
- Sub-Q5 (ordering across substrates)

**Product-discovery (lands at implementation-brief review):**

- Sub-Q2 sub-decisions (method name; route-handler-wrap action name)
- Sub-Q4-a (per-bill vs per-case enforcement shape)
- Sub-Q4-b (`link_role` accepted set)
- Sub-Q4-c (detach-after-post() handling)
- Sub-Q6 (artifact location — landed at this Round 1 via path-of-this-doc)
- Sub-Q7 (retrospective placement — adjudicate at Round 2 if needed)

**Sequencing.** Round 1 surfaces all sub-questions. Round 2 takes founder operational-signal call on Sub-Q3 (which gates Sub-Q1 disposition). Round 3 adjudicates Sub-Q2 architectural split. Round 4 locks Sub-Q1 (and Path C invocation per RI-7). Round 5+ as warranted (per-chunk acceptance criteria + Two Laws verification + cycle close).

---

## §5 — Round 2+ scope

### §5.1 Round count forecast

Per Phase 6.5 (7 rounds) + Phase 2.5 (cycle preamble + 3 commits + retrospective ≈ 5-round-equivalent) precedent: **5-7 rounds at amendment-cycle scope-lock grain.**

If Sub-Q3 = 3.δ (re-defer) and Sub-Q2 = 2.β (partial extraction), the cycle may compress to 4 rounds. If Sub-Q3 = 3.γ (full ratification) and Sub-Q2 = 2.α-i (full extraction with caller refactor), the cycle may extend to 7 rounds.

### §5.2 Round-by-round forecast

- **Round 1 (this doc):** Verify-from-disk pass + sub-question structure surface. Single-session execute-and-close.
- **Round 2:** Sub-Q3 disposition (founder operational-signal call on vendor_credits). Conditional on Sub-Q3, Sub-Q1 partially locks (1.α-feasibility narrows).
- **Round 3:** Sub-Q2 disposition (paymentService extraction architectural split: full vs partial). Conditional on Sub-Q2, Sub-Q5 ordering surface.
- **Round 4:** Sub-Q1 final lock (decomposition: single-cycle vs chunked vs partial-pairing) + Path C invocation evaluation per RI-7. If chunked, Sub-Q5 ordering finalizes.
- **Round 5:** Sub-Q4 disposition (INV-DOC-001 enforcement surface: 4.α / 4.β / 4.γ + sub-decisions 4-a / 4-b / 4-c / 4-d main-or-deferred to implementation-brief).
- **Round 6:** Per-chunk acceptance criteria + rollback posture + test matrix (per v3 §9 Decision 5 + CTO Condition 5; inherited from Phase 6.5). If single cycle (1.α), this round folds into per-commit acceptance criteria.
- **Round 7:** Two Laws verification scope (INV-SERVICE-001 + INV-SERVICE-002 + INV-AUTH-001 inheritance; per chunk if chunked) + cycle close + brief drafting plan.

### §5.3 Brief drafting plan placeholder

Brief drafting plan lands at Round 7. Expected shape:

- **If 1.α (single amendment cycle):** Single brief at `docs/09_briefs/phase-5.1/2026-MM-DD-phase-5-1-amendments-brief.md` covering all three substrates + sequenced commit plan A→B→C.
- **If 1.β (full chunked decomposition):** Three briefs at `docs/09_briefs/phase-5.1/chunks/2026-MM-DD-phase-5-1-chunk-{a,b,c}.md` per Phase 4 + Phase 6 chunk-brief convention.
- **If 1.γ (partial pairing):** Two briefs at `docs/09_briefs/phase-5.1/chunks/` per pairing disposition.

### §5.4 Validation-gate inheritance

Each Phase 5.1 chunk (or single-cycle commit) inherits the CLAUDE.md three-condition push-readiness gate at close:

1. Test-suite health (vitest full-suite green or documented deviations).
2. Doc-sync reconciled (invariants.md ↔ control_matrix.md ↔ ledger_truth_model.md ↔ shipped code; types.ts regenerated against post-arc schema; ADRs reconciled).
3. Governance closeout (retrospective per Sub-Q7 disposition; friction-journal arc-scope entries; conventions earned by fire count codified).

INV-DOC-001 leaf registration (per §2.1.a artifact (a)) is a Condition 2 doc-sync obligation at INV-DOC-001 chunk close: leaf in `ledger_truth_model.md` + rollup in `invariants.md` + (if applicable) audit row in `control_matrix.md`.

---

## §6 — Round 1 close

### §6.1 Round 1 dispositions banked

1. **§1.1 divergences absorbed.** apReportService.ts path corrected; HEAD-pin drift noted; both banked as candidate (c) pattern instances N=13 + N=14 at brainstorming-arc grain.
2. **§1.2 Phase 6.5 codification-arc-sequence retrospective.** Substrate-fit WEAK; forward-reference-only at §1.2; not cited at §2 or §3.
3. **§2 verify-from-disk pass complete.** Grain 1 (six sub-findings) + Grain 5 (three consumer surfaces) walked; Grain 2-3-4 deferral note at §2.3. Four bank-worthy findings at §2.4.
4. **§3 seven sub-questions surfaced.** Sub-Q1-Q7 enumerated; option spaces drafted; adjudication inputs documented.
5. **§4 decision-class split applied.** Six governance-critical + six product-discovery sub-questions/decisions classified.
6. **§5 Round 2-7 forecast.** 5-7 rounds expected at amendment-cycle scope-lock grain.
7. **Sub-Q6 landed at Round 1.** Phase 5.1 brief artifacts live at `docs/09_briefs/phase-5.1/` per Phase 2.5 + Phase 6.5 precedent (6.α).

### §6.2 Round 2 prompt inputs

Round 2 prompts should re-cite the canonical Phase 5 retrospective §6:404-414 reserved-schema-seats framing and ask the founder for explicit operational-signal disposition on Sub-Q3 (α/β/γ/δ). Sub-Q3 disposition is the round's primary load-bearing call; ancillary Round 2 walks (Sub-Q1 narrowing per Sub-Q3 disposition) follow naturally.

### §6.3 Carry-forward observations

- **N=14 candidate (c) catalog.** Brainstorming-arc grain is highest-firing (N=9). Consider noting at Phase 7 retrospective scoping or earlier codification round.
- **Phase 5 retro §6 vendor_credits assertion correction** (§2.4 finding 1). Bank as friction-journal candidate at Phase 5.1 retrospective: retrospective-assertion-without-verify-from-disk firing at cross-phase-claim grain.
- **Convention inconsistency on retrospective placement** (Sub-Q7). Three precedents differ (Phase 2.5 7.β append; Phase 6.5 7.α standalone; Phase 6.5 codification-arc-sequence 7.γ sibling synthesizing). Codification candidate if a fourth amendment-cycle adopts a fourth shape.

---

**Round 1 status:** complete. Single-session execute-and-close per directive. Awaiting Round 2 prompt drafting (founder operational-signal call on Sub-Q3 primary).
