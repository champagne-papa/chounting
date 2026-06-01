# V1 Governance Plan — ratification record + Wave 0 opening

**Status:** Ratified 2026-05-31 by CTO (Decisions 1–9, per the V1 Final System Proposal v2); Decision 11 ratified 2026-06-01 (option i′, ADR-0030); Decision 10 deferred-by-design 2026-06-01 (jurisdictions — internal-use-only; ADR-0036 parked).
**Anchored at:** HEAD `de607fdb` (branch `staging`). Banked-local, unpushed.
**Form:** governance charter (lock + reserve + open), mirroring
`docs/09_briefs/phase-0/plans/2026-05-03-phase-0-governance-plan.md` Decision 7. Lean
by design — per-ADR work is carried by the `specs/` → `ratification-packages/` lifecycle
(ADR README §"Pre-ratification design specs"), not embedded here. **No ADR bodies are
authored in this charter.**
**Rationale document (not in this repo):** the CHOUnting V1 Final System Proposal (v2)
is the full rationale; it lives container-side and is referenced, not duplicated. This
charter is the lighter repo-side record of the decision it enacts.

---

## 0. What this charter does

Records the CTO ratification of the V1 system definition, locks the scope line + the 9
control invariants, reserves the ADR block (0028–0036), sequences the build waves
(-1 → 6), and formally opens **Wave 0**. It does not author the reserved ADRs — each is
a next sequenced sub-step (a pre-ratification design spec under
`docs/09_briefs/v1/specs/`, then a ratification package under
`docs/09_briefs/v1/ratification-packages/`).

Naming, stated once: **"V1"** = the first complete shippable CHOUnting system — distinct
from V4 (the authority-gradient architecture iteration) and V5 (the workflow-native
iteration), whose synthesis V1's architecture *is*. V1 is defined by the AP
review-and-post wedge running end-to-end on the controlled stack, with a manual fallback
and an evidence chain.

---

## 1. Scope line (ratified)

V1 = everything already shipped **+** the foundational pieces the AP wedge needs **+**
the **AP review-and-post wedge** as the first behavioral consumer. Everything else is
V2+.

**Thesis:** AI proposes, Workflow Core orchestrates, decision modules evaluate, Services
enforce, Accounting Core records truth — **and the system runs without the AI.**

---

## 2. The 9 control invariants (ratified)

1. **Single financial-finality boundary** — only Accounting Core posts truth
   (`journalEntryService.post()` sole writer; append-only triggers).
2. **AI outputs are untrusted proposals** — validated before posting/sending/routing;
   output side (proposal-only) + input side (extraction-input sanitization).
3. **No AI-only paths** — every Intent has ≥1 non-AI producer; CI `INV-WORKFLOW-001`
   (teeth at Wave 6).
4. **One typed decision contract** — reconciled with the shipped `Disposition` enum
   (Decision 11); reason codes + evidence refs in `rule_evaluation_log.evaluation_trace`.
5. **No autonomous commit at V1** — SHIPPED (A-now, `de607fdb`): auto-commit disabled,
   matched proposals park in `received`, no ledger write. At Wave 6 they route
   `received → needs_review` for human approve→post under the human's identity.
   Gate-driven auto-commit (`INV-AUTONOMY-GATE-001`) is post-V1, gated on the eval
   harness. *(Auth-model vs exercise: ADR-0007 Q78 resolved that a system actor* may *cross
   `withInvariants`; it never said ungoverned auto-commit* should *happen. The bleed-stop
   re-scopes the exercise, not the auth model.)*
6. **Evidence-native** — every committed AP posting carries a complete evidence bundle on
   one canonical evidence object; extends INV-DOC-001 (`INV-EVIDENCE-001`).
7. **No silent drops** *(Wave 6 — NOT yet enforced)* — today an unmatched-vendor invoice
   still returns `null` and is dropped; fix deferred to Wave 6.
8. **Read/write separation** — reads emit a lightweight QueryTrace.
9. **Versioned + replayable** — deterministic skeleton byte-for-byte (`INV-RULE-002`);
   AI steps record outputs for replay against frozen inputs.

---

## 3. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Ratify the V1 scope line (§1) | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 2 | Ratify the 9 control invariants (§2) | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 3 | Workflow Core as Layer 2.5 (advances process state; cannot bypass Services or write the ledger) | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 4 | Workflow engine shape — code-defined defs · DB-backed instances · pinned versions · idempotent service-only activities · explicit compensation (first option; Temporal later) | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 5 | Option A — disable shipped auto-commit; AP is human approve→post; governed auto-commit returns post-V1 gated on eval | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 6 | Autonomy Ladder as the future-facing concept; substrate = single `rule_autonomy_rung`; no physical rename | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 7 | Decision modules, not a "Decision Core" | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 8 | Canonical evidence object model (extends INV-DOC-001) before AP ships | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 9 | Minimal eval harness folded into Ring 2B + AP wedge | **Ratified 2026-05-31 by CTO** (per the V1 Final System Proposal v2) |
| 10 | **First-class jurisdictions** (compliance-assumptions) | **DEFERRED BY DESIGN 2026-06-01** — internal-use-only; no market scope until the product is complete + tested; unparks when market strategy is set. **ADR-0036 parked, NOT ratified.** |
| 11 | **Disposition reconciliation** — 4-value shipped `Disposition` (`auto_posted`/`blocked`/`routed`/`pending`) vs proposed 5-value gate disposition (`allow`/`deny`/`require_approval`/`require_more_evidence`/`queue_manual_review`); gate *command* vs outcome *label* | **Ratified 2026-06-01 (option i′) at ADR-0030** — `ActionType` is the one typed decision contract (reconciled to `Disposition` via `dispositionForAction`); the proposed 5-value vocab is a semantic gloss, not a competing enum; `require_more_evidence` deferred as a future ActionType addition. |

Decision 11 was ratified 2026-06-01 at ADR-0030 (option i′). Decision 10 was
deferred-by-design 2026-06-01: the strategic input does not exist yet (CHOUnting is
internal-use-only, no market scope until the product is complete), so ADR-0036 stays
parked and unparks when market strategy is set. 10 remains a business call (compliance
hardening, a gated parallel track — does not block the AP wedge); 11 is now settled
before V2 extends the enum (don't fork).

---

## 4. Reserved ADR block (numbers verified free at HEAD `de607fdb`; ceiling was 0027)

Per the Phase 0 Decision-7 precedent (reserve the block, hold the numbers). These are
**reserved, not authored** — each ADR is its own sub-step.

| ADR | Title | Wave / Decision |
|---|---|---|
| **0028** | Workflow Core Substrate | Wave 1 (R4) |
| **0029** | Autonomy Ladder Generalization (single `rule_autonomy_rung`; reconcile ADR-0007/0017/0023/0024/0025; INV-AGENT-001..006 precision pass) | Wave 0 |
| **0030** | Decision-Module Composition + Disposition reconciliation (Decision 11) + (V2) Learning Trichotomy | Wave 0 / 3 |
| **0031** | No-AI-Only-Paths (`INV-WORKFLOW-001` + producer registration) | Wave 4 (R7) |
| **0032** | Canonical Autonomy Gate Seam (recording at V1; one result per autonomous attempt; auto-commit post-V1) | Wave 3 (R1) |
| **0033** | Canonical Evidence Object Model (extends INV-DOC-001) | Wave 2 (R3) |
| **0034** | Replayability Two-Part Definition | V2 |
| **0035** | Logic Receipt first-class (today: partial via `ProposalJustificationSchema` + `evaluation_trace`) | V2 |
| **0036** | Compliance Assumptions / first-class jurisdictions (Decision 10) | **DEFERRED** — Decision 10 deferred-by-design; parked, not Wave-0-closing |

If a separate (non-V1) ADR drafts during this cycle and would otherwise consume a number
in 0028–0036, hold those numbers for V1 and assign the new ADR a higher number (Phase 0
Decision-7 hold-rule).

**Reserved invariant IDs** (named now, registered in `invariants.md` only when
enforcement code/migration lands, per the project's substrate-now / register-on-
enforcement rule): `INV-WORKFLOW-001..005`, `INV-AUTONOMY-GATE-001`,
`INV-EVIDENCE-001..002`, `INV-LEARNING-001`. All verified free at HEAD.

---

## 5. Wave plan

```
Wave -1  PRE-ARC SAFETY — SHIPPED (banked local on staging; push at retro close)
         (a) ADR-0007 Q78 V1-rescoping amendment — ratified 2026-05-31, commit 7cb68895.
         (b) A-now bleed-stop — commit de607fdb: matched proposed_entry_card /
             proposed_mutation_bundle return parked_unposted; auto-post disabled; case
             parks in 'received'; no ledger write. Commit machinery preserved for the
             post-V1 governed re-wire.
         (c) Routing-to-needs_review + silent-drop fix → DEFERRED to Wave 6
             (received→needs_review illegal; no review UI yet).

Wave A   Finish Ring 2B (in flight) + fold in eval items 1–3 (golden set, shadow
         scoring, Disposition reconciliation) → rules match in SHADOW.

Wave 0   Vocabulary + decisions + THIS ratification. ADR-0029 (Autonomy Ladder rename)
         + ADR-0030 (Decision 11 = i′) RATIFIED; ADR-0036 (Decision 10)
         DEFERRED-BY-DESIGN (parked, not delivered this wave); glossary; system_overview.
         [OPENED by this charter; Wave-0 decisions closed 2026-06-01.]

Wave 1   Workflow Core substrate — ADR-0028; workflow_model.md; instance/event tables +
         audit join; inert seams. (R4)
Wave 2   Canonical evidence object model — ADR-0033; core/evidence + services/evidence
         populated; GENERAL (not-AP-only) object (R3). AP bundle is one consumer.
Wave 3   Autonomy Gate contract (recording) — ADR-0032; INV-AUTONOMY-GATE-001; gate
         records a disposition on the LIVE commit path at a SINGLE seam (R1). No rule
         auto-commits at V1.
Wave 4   No-AI-only-paths registry + CI — ADR-0031; INV-WORKFLOW-001 (teeth at Wave 6). (R7)
Wave 5   AP eval harness — extraction golden set + accuracy; confidence-to-policy
         validation; unsafe-output / input-contamination suite.
Wave 6   AP Review — first behavioral consumer (A-complete): review/inbox UI (net-new) +
         approve→post action (net-new) under the human ctx + real coding (consume matched
         rule's default_account_id) + matcher-gap fix + parked-backlog recovery + the
         deferred routing/silent-drop/§5.1-direct-test. V1 ships.
```

---

## 6. V1 → V2 reservations (per the V2 preflight)

V1 must lay these seams so V2 is a config change, not a rebuild:

- **R1 → Wave 3.** Gate records on the *live* commit path at a *single* seam (distinct
  from the pre-commit shadow eval, which cannot influence the commit), so
  recording → deciding is a config flip — V2 Track 1.1 governed auto-commit.
- **R2 → Decision 11.** Settle the 4-value `Disposition` vs the 5-value gate disposition
  before V2 extends the enum. *(Settled 2026-06-01 at ADR-0030, option i′ — `ActionType`
  canonical; the 5-value vocab is a gloss.)*
- **R3 → Wave 2.** General, NOT-AP-only evidence object carrying what V2 Track 4
  (workflow learning) + Track 7.4 (first-class Logic Receipts) will need.
- **R4 → Wave 1.** Workflow Core substrate (child-workflow data model present;
  version-pin; instance/event tables shaped for the learning substrate to read).
- **R5.** Reserved seats stay reserved (`events` table → outbox emitter; per-org autonomy
  thresholds; the reserved INV-IDs). Do not repurpose.
- **R6.** Evaluator interface stays slot-in extensible — verified open (the pure-core
  `PREDICATES` map; the four deferred predicates are reserved keys).
- **R7 → Wave 4.** No-AI-only-paths registry shaped to accept new producers without rework.
- **R8 → Decision 10.** Jurisdiction decision gates the V2 governance-hardening track.
  *(Decision 10 deferred-by-design 2026-06-01; the gate is pending until the jurisdiction
  decision unparks.)*

---

## 7. Carry-forwards (durable; must survive into V1 tracking)

- **Matcher-gap Wave 6 MUST-FIX.** The vendor_invoice extractor emits no vendor identity
  (Stage-4 `VendorInvoiceExtractionSchema` has no vendor-name field; Tier A regex emits
  none; the Tier C prompt explicitly defers `vendor_id`), so `matchVendor` resolves
  `vendor_id=null` for *every* vendor_invoice — this blocks not just auto-commit but even
  human review-and-post coding suggestions. Add a vendor-identity field to the Stage-4
  schema + Tier A/C. This is also where the commit-cluster extraction (hotfix-spec §3.3
  (b)) and the direct ledger-row-delta test land.
- **Parked-backlog recovery (Wave 6).** Legal matrix-advancement
  (`received → extracting → classified → matched → needs_review` — proper advancement,
  not a matrix amendment, preserving `needs_review ⇒ classified+matched`) + a sweep over
  `state='received'` cases with a completed `pipeline_trace`, so Part A's parked docs
  don't orphan.
- **§5.1 direct ledger-row-delta test → deferred to Wave 6** (non-vacuous only once the
  matcher gap is closed and the post path is reachable; today zero-rows is true with or
  without the bleed-stop, so the test would be vacuous).
- **Severity correction.** The vendor_invoice→bill path was structurally unreachable
  (matcher gap), so the live exposure was narrower than "wrong entries on staging now" —
  but the capability was wired + ungoverned and the null-gating is a bug, not a control,
  so the bleed-stop is correct. (Scope: only vendor_invoice→bill verified; born-paid
  bundle + payment_confirmation reported-same-mechanism, not independently confirmed.)
- **Pre-existing `adminClient` / ADR-0020 layer-boundary lint ticket** at
  `ingestDocument.ts:57` — NOT introduced by Part A; its own separate ticket.

Full detail for the §5.1 / severity / matcher-gap items lives in the committed hotfix
change-spec: `docs/09_briefs/v1/2026-05-31-a-now-hotfix-change-spec.md` (commit
`de607fdb`).

---

## 8. Per-ADR ratification lifecycle (how the reserved ADRs close)

Each reserved ADR follows the briefs lifecycle (ADR README §"Pre-ratification design
specs"):

1. Pre-ratification **design spec** under `docs/09_briefs/v1/specs/`.
2. **Ratification package** under `docs/09_briefs/v1/ratification-packages/` (the Phase 0
   D1–D6 analog) enacting the ADR's ratification.
3. The ratified **ADR** lands in `docs/07_governance/adr/`.

This charter reserves and sequences; it does not perform any per-ADR ratification.

---

## 9. State pointers

- Banked local on `staging`, UNPUSHED (push at retrospective close):
  `7cb68895` (ADR-0007 Q78 amendment) + `de607fdb` (A-now bleed-stop). This charter is
  the third banked commit.
- Wave 0 ADRs (sub-steps, not this charter), via the lifecycle in §8: ADR-0029 + ADR-0030
  RATIFIED 2026-06-01; ADR-0036 (Decision 10) DEFERRED-BY-DESIGN, parked. Ring 2B (Wave A)
  shipped (the `11633dc6` anchor).
