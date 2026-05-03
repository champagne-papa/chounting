# Phase 0 Governance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Phase 0 of the Document Platform reframe — produce two ratified initiative briefs, eight ratified ADRs, 26 filed open questions, and four dependent-artifact updates — so Phase 1 (Storage / Evidence Core) code can begin.

**Architecture:** Four parallel streams against a six-tier ADR critical path. Stream A files Q53–Q78. Stream B drafts skeleton briefs first, finalizes after ADR ratification. Stream C drafts ADRs in dependency order. Stream D ratifies ADRs per assigned authority. Stream E updates dependent artifacts. Phase 0 closes only when nine explicit exit criteria are met.

**Tech Stack:** Markdown, git, the existing `docs/` tree (`docs/02_specs/`, `docs/03_architecture/`, `docs/07_governance/adr/`, `docs/09_briefs/phase-2/`). No code in this phase.

**Source spec:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` — the reframe-decision spec produced by the brainstorming cycle on 2026-05-02 / 2026-05-03.

**Granularity note.** Governance writing steps are larger than the skill's default 2–5 minute target — typical step is 10–60 minutes (drafting an ADR section, drafting a Q entry, ratification review). The discipline of explicit checkboxes-per-step still holds; the time-box does not.

**Deviation note.** The writing-plans skill's "produces working, testable software" criterion is interpreted here as "produces verifiable artifacts." Phase 0 produces ratified briefs / ADRs / Q-filings, not code. Verification = artifact ratification by the named authority + cross-reference consistency check against the spec.

---

## Six explicit decisions (locked before drafting)

These decisions were resolved by the founder + reviewer feedback on 2026-05-03 and are constraints on every task below. Do not relitigate.

**Decision 1 — ADR dependency order is a six-tier graph, not a flat batch.**

```
Tier 1: ADR-0007 amendment
Tier 2: Document Platform ADR (depends on Tier 1)
Tier 3: Storage Provider ADR | Tier 2 Document Pipeline ADR | ProposedMutationBundle ADR (parallel within tier; all depend on Tier 2)
Tier 4: Document Relationship Graph ADR | AP/Spend Subdomain ADR | Vendor Template substrate portion (parallel within tier)
Tier 5: Relationship Router ADR (depends on Tier 4)
Tier 6: Confidence Calibration Policy ADR (depends on Tier 5)
```

Tasks below tag each ADR with its tier. Tasks within the same tier can run in parallel (subagent-driven mode) or sequentially (inline mode).

**Decision 2 — Brief drafting uses skeleton-first sequencing.**

Skeleton briefs (TOC + section stubs) draft first → ADRs draft against the skeleton structure → ADRs ratify → final brief content fills in against ratified ADRs. This avoids the chicken-and-egg problem of "the brief depends on the ADR, the ADR references the brief."

**Decision 3 — Ratification authority per ADR.**

| ADR | Ratification authority |
|---|---|
| ADR-0007 amendment | CTO ratifies |
| Document Platform ADR | CTO ratifies; founder reviews |
| Storage Provider ADR | CTO ratifies |
| Tier 2 Document Pipeline ADR | CTO ratifies |
| ProposedMutationBundle ADR | CTO ratifies |
| Document Relationship Graph ADR | CTO ratifies |
| AP/Spend Subdomain ADR | CTO ratifies; founder reviews |
| Relationship Router ADR | CTO ratifies |
| Confidence Calibration Policy ADR | CTO + Controller ratify (governance-level, not engineering-only) |
| Vendor Template / Autonomy Rule (substrate portion) | CTO ratifies; full enforcement portion deferred post-v1 |

**Decision 4 — Q-filing runs in parallel from day 1.**

Stream A (Q53–Q78 filing) does not gate Stream B (briefs) or Stream C (ADRs). Some Q's resolve to ADR text and close on ratification; others stay open as v1 implementation gates; others defer.

**Decision 5 — Dependent artifact updates are their own stream (Stream E).**

Five existing files need explicit updates: `docs/02_specs/open_questions.md`, `docs/02_specs/agent_architecture_policy.md`, `docs/02_specs/invariants.md`, `docs/03_architecture/phase_simplifications.md`, and a possible `docs/07_governance/adr/0010-reserved-enum-states.md` amendment. Each is a tracked task, not an invisible follow-up.

**Decision 6 — Phase 0 exit criteria are nine explicit checks.**

Listed in Task Z1 below. Phase 1 code does not start until all nine are met.

**Decision 7 — ADR numbering follows dependency-tier order, not draft-completion order.**

Parallel ADRs within a tier get sequential numbers in alphabetical order by file slug. The numbering convention:

| Tier | ADR | Number |
|---|---|---|
| 1 | Three-tier agent architecture (amendment) | ADR-0007 (existing, amended in place) |
| 2 | Document Platform | ADR-0011 |
| 3 | ProposedMutationBundle | ADR-0012 |
| 3 | Storage Provider | ADR-0013 |
| 3 | Tier 2 Document Pipeline | ADR-0014 |
| 4 | AP/Spend Subdomain | ADR-0015 |
| 4 | Document Relationship Graph | ADR-0016 |
| 4 | Vendor Template substrate reservation | ADR-0017 |
| 5 | Relationship Router | ADR-0018 |
| 6 | Confidence Calibration Policy | ADR-0019 |

Tier-3 alphabetical order: ProposedMutationBundle, Storage Provider, Tier 2 Document Pipeline → 0012, 0013, 0014.
Tier-4 alphabetical order: AP/Spend Subdomain, Document Relationship Graph, Vendor Template substrate → 0015, 0016, 0017.

This convention overrides the "next available ADR number" wording in §"File structure" and in each `Step 1` of Tasks C2–C10 — number assignment is deterministic from the table above, not from `ls`-time discovery. Future readers can reconstruct dependency order from ADR numbers alone.

If a separate (non-Phase-0) ADR drafts during this cycle and would otherwise consume a number from the 0011–0019 range, hold those numbers for Phase 0 and assign the new ADR a higher number.

---

## File structure

**Files created:**

- `docs/09_briefs/phase-2/document_platform_initiative.md` (new — Document Platform brief, skeleton then final)
- `docs/09_briefs/phase-2/spend_initiative.md` (renamed from `ap_ingestion_initiative.md`, then pruned)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (existing — amended in place per ADR README convention; or `0007-three-tier-agent-architecture-amendment.md` if a separate file is preferred)
- `docs/07_governance/adr/0011-document-platform.md` (new — Tier 2)
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md` (new — Tier 3)
- `docs/07_governance/adr/0013-storage-provider.md` (new — Tier 3)
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (new — Tier 3)
- `docs/07_governance/adr/0015-ap-spend-subdomain.md` (new — Tier 4)
- `docs/07_governance/adr/0016-document-relationship-graph.md` (new — Tier 4)
- `docs/07_governance/adr/0017-vendor-template-substrate-reservation.md` (new — Tier 4; substrate-only portion of the Vendor Template ADR)
- `docs/07_governance/adr/0018-relationship-router.md` (new — Tier 5)
- `docs/07_governance/adr/0019-confidence-calibration-policy.md` (new — Tier 6)

**Files modified:**

- `docs/02_specs/open_questions.md` — append Q53–Q78
- `docs/02_specs/agent_architecture_policy.md` — Q28 re-verification matrix expansion (drafted, not ratified — ratification gates v1 ship, not Phase 1 start)
- `docs/02_specs/invariants.md` — register new `DOC` domain prefix on Document Platform ADR ratification
- `docs/03_architecture/phase_simplifications.md` — append Simplification 3 footnote noting the reframe operationalizes (not amends) it
- `docs/07_governance/adr/0010-reserved-enum-states.md` — amendment IF the Document Platform ADR introduces a new reserved-enum pattern (e.g., the `(linked_entity_type, link_role)` pair-validity matrix)
- `docs/07_governance/adr/README.md` — register the eight new ADRs in the ADR index
- `docs/INDEX.md` — register the two new briefs (Document Platform, Spend Initiative) and renamed brief (drop `ap_ingestion_initiative.md`)

**Files removed (renamed):**

- `docs/09_briefs/phase-2/ap_ingestion_initiative.md` → renamed via `git mv` to `spend_initiative.md`

---

## Stream A — Open-questions filing (Q53–Q78)

Runs in parallel from day 1. Does not gate Streams B/C/D.

### Task A1: Verify open_questions.md anchor and prepare scaffolding

**Files:**
- Read: `docs/02_specs/open_questions.md`

- [ ] **Step 1: Read open_questions.md, confirm Q34 is the most recent filed question and Q53 is the next available number.**

Run: `grep -n "^### Q" docs/02_specs/open_questions.md | tail -5`
Expected output ends with `Q34`. If it ends with anything else, file a friction-journal entry naming the discrepancy and stop — do not file Q53–Q78 over a Q-numbering collision.

- [ ] **Step 2: Confirm Section 3 ("Open questions surfaced during Phase 1.1 closeout") is the right home for Q53–Q78 vs creating a new "Section 5 — Phase 2 Document Platform reframe."**

The convention from the existing file: Q21 / Q22 are in Section 3 (Phase 1.1 closeout); Q33 / Q34 are also in Section 3 even though they came later. Continue this pattern — append Q53–Q78 to Section 3 with a sub-header `### Phase 2 Document Platform reframe (2026-05-02)` separating them. Do not create Section 5.

- [ ] **Step 3: Commit a marker file noting Stream A has started.**

```bash
mkdir -p .claude/phase-0-tracking
cat > .claude/phase-0-tracking/stream-a-start.md << 'EOF'
Stream A (Q53–Q78 filing) started 2026-05-03 against Q34 anchor.
Ends when all 26 entries are appended to docs/02_specs/open_questions.md.
EOF
git add .claude/phase-0-tracking/stream-a-start.md
git commit -m "phase-0: Stream A (Q-filing) started"
```

### Task A2: Draft Q53–Q60 (8 questions — types, lifecycle, links, router re-eval, governance, bundle atomicity, prepayment shape, born-paid approval)

**Files:**
- Modify: `docs/02_specs/open_questions.md` (append)

- [ ] **Step 1: Open `docs/02_specs/open_questions.md` and locate the end of Section 3.**

The append point is after the last existing Q34 entry, before Section 4 ("Formalization candidates").

- [ ] **Step 2: Draft Q53 — Document-type enum.**

Use the spec's §13 Q53 text verbatim:

```markdown
### Q53 — Document-type enum: which types are active in v1, which are reserved?

The Document Platform classifier produces a document-type discriminator
per the Document Platform ADR. The full reserved set per ADR-0010
discipline includes: `vendor_invoice`, `receipt`, `payment_confirmation`,
`credit_memo`, `vendor_statement`, `purchase_order`, `receiving_document`,
`retainer_request`, `deposit_request`, `bank_statement`, `card_statement`,
`customer_invoice`, `customer_remittance`, `tax_form`, `contract`,
`payroll_document`, `asset_purchase_support`, `unknown`.

**Decision space:** which types ship classification logic in v1
(`vendor_invoice`, `receipt`, `payment_confirmation`, others?) and
which sit reserved-without-classifier-implementation. The
classification-confidence threshold for routing-to-exception vs
routing-to-proposal is also v1 calibration.

**Blocks:** Document Platform ADR; Tier 2 Document Pipeline ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 3: Draft Q54 — Document case lifecycle states.**

```markdown
### Q54 — Document case lifecycle states: which transitions are guarded?

The document case lifecycle states are: `received → extracting →
classified → matched → proposed → needs_review → approved → committed →
rejected → archived`.

**Decision space:** not the state names (those are decided), but which
transitions get service-layer enforcement vs UI convention. Specifically:
which transitions can be triggered only by automation, only by humans,
or by either; and which transitions are reversible.

**Blocks:** Document Platform ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 4: Draft Q55 — Polymorphic link enums and (entity_type, role) validity matrix.**

```markdown
### Q55 — `source_document_links`: active enums and pair validity

Per spec §6, `linked_entity_type` and `link_role` are both closed enums
under ADR-0010 reserved-enum-states discipline. Not every
`(linked_entity_type, link_role)` pair is valid — `retainer_agreement`
only makes sense linked to `vendor_prepayment`, not to `bank_transaction`.

**Decision space:** the per-pair validity matrix and which pairs the
`documentLinkService` rejects. Active v1 set is narrow (probably
`(bill, primary_invoice)`, `(bill, supporting)`, `(payment,
payment_evidence)`, `(payment, receipt)`); the full matrix is reserved.

**Blocks:** Document Relationship Graph ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §6, §13.
```

- [ ] **Step 5: Draft Q56 — Relationship Router re-evaluation triggers.**

```markdown
### Q56 — Relationship Router re-evaluation triggers

When a previously unmatched document gets re-classified after new
domain state lands (a new bill posts that matches a stranded receipt;
a vendor master gets merged that re-resolves prior matches; a period
reopens).

**Decision space:** which domain events trigger Router re-runs, the
audit-trail shape for routing-decision changes, and which decisions
are immutable post-commit (per spec §16 lifecycle immutability rules).

**Blocks:** Relationship Router ADR; Phase 4 (Router) code.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 6: Draft Q57 — Confidence calibration governance.**

```markdown
### Q57 — Confidence calibration governance

Who calibrates classifier and Router confidence thresholds, against
what test set, how often, with what audit trail?

**Decision space:** org-configurable vs system-fixed for v1 (cf. Q23
on agent ladder thresholds); reviewer authority for changes; what
changes when a threshold moves (re-evaluate prior decisions or not).

**Blocks:** Confidence Calibration Policy ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 7: Draft Q58 — Bundle atomicity at the DB transaction layer.**

```markdown
### Q58 — ProposedMutationBundle atomicity at the DB transaction layer

How does Tier 1 enforce all-or-nothing bundle commit, and how does
the Logic Receipt represent bundle children?

**Decision space:** single transaction vs saga with compensating
reversals; the audit-log shape for bundle commits; the Logic Receipt
shape when one ProposedMutationBundle produces multiple journal
entries.

**Blocks:** ProposedMutationBundle ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 8: Draft Q59 — Vendor prepayment object shape.**

```markdown
### Q59 — Vendor prepayment object shape

Types (`retainer | deposit | advance | security_deposit |
prepaid_service | inventory_deposit | fixed_asset_deposit | other`),
statuses, payment-purpose discriminator linkage, application logic.

**Decision space:** which prepayment types ship as active v1 enum
values vs reserved per ADR-0010.

**Blocks:** AP/Spend Subdomain ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 9: Draft Q60 — Born-paid bundle approval gate.**

```markdown
### Q60 — Born-paid bill bundle approval gate

Always Confirm at first; later auto-post under what specific rules?

**Decision space:** thresholds, vendor-rule applicability, controller
authority. Tied to post-v1 auto-post per spec §11. May feed into Q43
(vendor-template-as-autonomy-rule) when that ADR drafts post-v1.

**Blocks:** AP/Spend Subdomain ADR (v1 portion); Vendor Template
ADR (post-v1 portion).

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 10: Commit Q53–Q60.**

```bash
git add docs/02_specs/open_questions.md
git commit -m "open-questions: file Q53–Q60 (Phase 2 Document Platform reframe — types/lifecycle/links/router/governance/bundle/prepayment/born-paid)"
```

### Task A3: Draft Q61–Q70 (10 questions — prepayment approval, deposit tax, vendor balance, prior credit, classifier thresholds, tier placement, domain boundary, exception UX, replayability, OCR idempotency)

**Files:**
- Modify: `docs/02_specs/open_questions.md` (append)

- [ ] **Step 1: Append Q61 — Vendor prepayment approval gate.**

```markdown
### Q61 — Vendor prepayment approval gate

Can AP specialist record a vendor prepayment without controller
approval if the cash already left the bank (after-the-fact
classification), vs requiring controller approval for future-cash
retainer authorization?

**Decision space:** separate approval rule for future-cash retainer
authorization vs after-the-fact retainer classification. Default lean
per spec §13: no controller bypass for future cash; bypass allowed for
after-the-fact reconciliation classification.

**Blocks:** AP/Spend Subdomain ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 2: Append Q62 — Deposit / retainer tax timing.**

```markdown
### Q62 — Deposit / retainer tax timing

When a deposit / retainer request includes GST / HST / PST, does
CHOUnting recognize recoverable tax at deposit payment date, final
invoice date, or controller-selected date?

**Decision space:** jurisdiction default + per-org override + per-
document override; default to `review_required` until explicit choice
is captured.

**Blocks:** AP/Spend Subdomain ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 3: Append Q63 — Vendor balance view composition.**

```markdown
### Q63 — Vendor balance view composition

Which components combine into "vendor balance"? Open AP, unapplied
vendor credits, open vendor deposits / retainers, accrued unbilled.

**Decision space:** which composition the Spend brief specifies for
v1 reporting and which views surface partial vs net balance.

**Blocks:** AP/Spend Subdomain ADR; Phase 5 (Spend foundation) reporting.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 4: Append Q64 — Final invoice with prior-deposit credit but no matching prepayment.**

```markdown
### Q64 — Final invoice references prior deposit not in CHOUnting

A final invoice arrives showing "$X paid as deposit, balance owing
$Y" but no `vendor_prepayment` row exists in CHOUnting (the deposit
was paid before the org adopted CHOUnting, or via a channel that
didn't ingest).

**Decision space:** backfill (create back-dated `vendor_prepayment`
from bank/card transaction), treat as discount, treat as vendor
credit, or send to review. Default per spec §13: route to exception
queue with backfill suggestion; do not silently treat as discount.

**Blocks:** AP/Spend Subdomain ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 5: Append Q65 — Per-document-type classifier thresholds.**

```markdown
### Q65 — Per-document-type classifier confidence thresholds

Per-type calibration, exception-queue routing rules. Subordinate to
Q57 (confidence calibration governance).

**Decision space:** per-type threshold values for v1 (`vendor_invoice`,
`receipt`, `payment_confirmation`, `unknown`).

**Blocks:** Tier 2 Document Pipeline ADR; Confidence Calibration
Policy ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 6: Append Q66 — Pending ADR-0007 amendment: Tier placement of Relationship Router.**

```markdown
### Q66 — Relationship Router tier placement (pending ADR-0007 amendment)

Where does the Relationship Router live — amended Tier 2, new
Tier 2.5, or Tier 1 read-only pre-commit stage?

**Decision space:** (a) amend ADR-0007 to authorize Tier 2 reads
against committed ledger state with Q28 expansion covering
relationship-match outcomes; (b) introduce Tier 2.5 with read-only
ledger access, idempotent, no LLM-planned matching; (c) place in
Tier 1 as read-only pre-commit shaping. Recommended preference per
spec §9: (b). Resolved only by ADR-0007 amendment + Relationship
Router ADR ratification.

**Blocks:** Relationship Router ADR; Q27 wording.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §9, §13.
```

- [ ] **Step 7: Append Q67 — Domain boundary for bank/card transactions.**

```markdown
### Q67 — Domain ownership: `bank_transactions` and `card_transactions`

Which domain owns these entity types? Banking (reconciliation), Spend
(payments outgoing), or shared?

**Decision space:** ownership, cross-domain protocols, and which ADR
(Document Platform vs a future Banking Subdomain ADR) decides the
cut.

**Blocks:** Document Platform ADR (Domain Boundary Map subsection);
Phase 5 (Spend foundation) and any future Banking domain.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 8: Append Q68 — Exception queue UX.**

```markdown
### Q68 — Exception queue UX

Bulk operations, reclassification flow, document-type-aware
resolution actions, first-class screenshot gate, SLA / status fields.

**Decision space:** which actions ship as active in v1 vs reserved.
The full resolution-action enum is (per converged review): `create_bill`,
`attach_to_existing_bill`, `attach_to_existing_payment`,
`record_bill_payment`, `create_vendor_prepayment`,
`apply_vendor_prepayment`, `create_vendor_credit`,
`apply_vendor_credit`, `mark_duplicate`, `mark_non_accounting`,
`request_missing_document`, `route_to_manual_entry`,
`route_to_bank_reconciliation`, `route_to_AR_future`, `reprocess`,
`archive`. v1 active set is narrow.

**Blocks:** Document Platform ADR; Phase 4 (Router) and Phase 5
(Spend foundation) UX.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 9: Append Q69 — Replayability of extraction.**

```markdown
### Q69 — Replayability: re-running extraction when OCR engine improves

When the OCR engine version changes or a new model version ships,
existing `source_documents` may benefit from re-extraction.

**Decision space:** `ocr_runs` / `extraction_runs` table separation,
supersession semantics (auto-supersede vs explicit promotion), and
whether replays affect already-committed `source_document_links`.
Per spec §16 immutability rules, replays produce new rows but do not
mutate prior rows.

**Blocks:** Tier 2 Document Pipeline ADR; Document Platform ADR
(Replayability subsection).

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13, §16.
```

- [ ] **Step 10: Append Q70 — OCR-layer idempotency.**

```markdown
### Q70 — Idempotency at the OCR layer

Hash bytes on ingestion, short-circuit duplicate processing.

**Decision space:** short-circuit policy (skip the OCR sidecar
entirely vs re-run with cached artifact); whether the same hash from
a different ingestion channel still short-circuits; how the
short-circuit decision is audited.

**Blocks:** Tier 2 Document Pipeline ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 11: Commit Q61–Q70.**

```bash
git add docs/02_specs/open_questions.md
git commit -m "open-questions: file Q61–Q70 (Phase 2 Document Platform reframe — prepayment/tax/balance/credit/thresholds/tier/banking/exception/replay/idempotency)"
```

### Task A4: Draft Q71–Q78 (8 questions — classifier strategy, AI fallback, per-org config, receipt v1 path, case source cardinality, re-eval policy, Q28 evolution, payment failure)

**Files:**
- Modify: `docs/02_specs/open_questions.md` (append)

- [ ] **Step 1: Append Q71 — Classification strategy.**

```markdown
### Q71 — Document-type classification strategy

Rules vs templates vs small-model classifier vs LLM fallback vs
fine-tuned classifier.

**Decision space:** which strategies ship in v1's classifier and the
fallback ordering. The OCR engine choice (per Q65 / Tier 2 Document
Pipeline ADR) is separate from the classification strategy.

**Blocks:** Tier 2 Document Pipeline ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 2: Append Q72 — AI fallback contract.**

```markdown
### Q72 — AI fallback contract

When can AI be called, what artifact + snippets can it see, what JSON
does it return, how does it feed Q28 re-verification?

**Decision space:** the exact input / output contract, the validation
gate before AI output enters the proposal pipeline, and the
re-verification cost budget.

**Blocks:** Tier 2 Document Pipeline ADR; Q28 expansion in
`agent_architecture_policy.md`.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 3: Append Q73 — Per-org Document Platform configuration.**

```markdown
### Q73 — Per-org Document Platform configuration

Storage provider, OCR provider, allowed channels, retention policy,
confidence thresholds, language packs.

**Decision space:** which knobs are per-org vs system-fixed for v1.

**Blocks:** Document Platform ADR; Storage Provider ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 4: Append Q74 — Receipt v1 path (per spec §15 decision matrix).**

```markdown
### Q74 — Receipt v1 path

The spec §15 decision matrix splits receipt capabilities. Confirm
the matrix as the v1 receipt stance: image ingestion ✅, OCR
extraction ✅ (single engine), receipt-as-payment-evidence
(Scenario A) ✅ via `ProposedAttachment`, receipt-as-payment-trigger
(Scenario B) ✅ via `ProposedMutation(record_bill_payment)`, single
high-confidence one-to-one bill matching ✅, multi-match
disambiguation conditional on Q56 / Q68, standalone POS receipt
(Scenario C) → exception with manual born-paid workflow.

**Decision space:** confirm the matrix or amend per-row.

**Blocks:** AP/Spend Subdomain ADR; Tier 2 Document Pipeline ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §15.
```

- [ ] **Step 5: Append Q75 — Document case source cardinality.**

```markdown
### Q75 — Document case source cardinality

When is one document case built from multiple source documents? Email
body + invoice PDF; final invoice + retainer agreement; vendor
statement + several invoices.

**Decision space:** which patterns ship case-source bundling in v1
(via the `document_case_sources` table per spec §3.1) vs route to
manual linking.

**Blocks:** Document Platform ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §3.1, §13.
```

- [ ] **Step 6: Append Q76 — Re-evaluation policy.**

```markdown
### Q76 — Re-evaluation policy: immutability vs supersession boundary

When relationships are re-run (per Q56), which decisions are
immutable, which are superseded with audit, and which require user
approval to change?

**Decision space:** the immutability boundary per spec §16 and the
audit-log shape for re-routed decisions. Pre-commit case re-routing
is allowed; post-commit `source_document_links` require
reversal/supersession.

**Blocks:** Document Platform ADR; Relationship Router ADR.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13, §16.
```

- [ ] **Step 7: Append Q77 — Q28 evolution scope.**

```markdown
### Q77 — Q28 re-verification matrix expansion scope

How does the existing Q28 re-verification matrix expand to cover
document-type-aware fields, relationship-claim re-verification,
stale-state TOCTOU checks, and bundle re-verification (per spec §12)?

**Decision space:** matrix shape and which checks are Layer 1 schema
/ Layer 2 service / Layer 3 review. Matrix lands in
`agent_architecture_policy.md` before v1 ships (not before v1 codes).

**Blocks:** ADR-0007 amendment ratification; v1 ship gate.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §12, §13.
```

- [ ] **Step 8: Append Q78 — Payment failure / reversal lifecycle.**

```markdown
### Q78 — Payment failure / reversal lifecycle

v1 currently has `paid` as a terminal state and `reversed` for
corrections, but doesn't address the operational reality that
payments can fail post-execution: wire bounced (insufficient funds
at sender, account closed at receiver, KYC hold), ACH returned (NSF,
account closed), card charge disputed and reversed, cheque bounced,
bank reversed for compliance.

**Decision space:** whether to add a `failed` payment state with
transition rules (`paid → failed → bill returns to
approved_for_payment via reversal entry`); the ledger semantics of
failure (auto-reverse vs proposal-and-confirm); which v1 phase ships
failure handling (Phase 5 AP foundation has it as an exit-criterion
vs Phase 5 ships paid-only and failure handling lands post-v1).

**Blocks:** AP/Spend Subdomain ADR; Phase 5 (Spend foundation) code.

**Source:** `docs/09_briefs/phase-2/document_platform_reframe_design.md` §13.
```

- [ ] **Step 9: Commit Q71–Q78.**

```bash
git add docs/02_specs/open_questions.md
git commit -m "open-questions: file Q71–Q78 (Phase 2 Document Platform reframe — classifier/AI/config/receipt/sources/re-eval/Q28/payment-failure)"
```

### Task A5: Cross-reference verify Q53–Q78 against spec

**Files:**
- Read: `docs/09_briefs/phase-2/document_platform_reframe_design.md`
- Read: `docs/02_specs/open_questions.md`

- [ ] **Step 1: Confirm every Q referenced in the spec lands as filed.**

Run: `grep -oE "Q5[0-9]|Q6[0-9]|Q7[0-8]" docs/09_briefs/phase-2/document_platform_reframe_design.md | sort -u`
Expected: Q53, Q54, ..., Q78 (every number in 53–78 should appear). Confirm against `grep -oE "^### Q5[0-9]|^### Q6[0-9]|^### Q7[0-8]" docs/02_specs/open_questions.md | sort -u`.

- [ ] **Step 2: Mark Stream A complete in tracking.**

```bash
cat > .claude/phase-0-tracking/stream-a-complete.md << 'EOF'
Stream A (Q53–Q78 filing) complete 2026-05-03.
26 entries appended to docs/02_specs/open_questions.md.
Cross-reference verified against spec.
EOF
git add .claude/phase-0-tracking/stream-a-complete.md
git commit -m "phase-0: Stream A (Q-filing) complete"
```

---

## Stream B — Brief drafting (skeleton-first)

### Task B1: Skeleton — Document Platform Initiative brief

**Files:**
- Create: `docs/09_briefs/phase-2/document_platform_initiative.md`

- [ ] **Step 1: Create skeleton with header block matching `agent_architecture_proposal.md` precedent.**

```markdown
# Document Platform Initiative — Phase 2 Brief

**Status:** Skeleton; not authorized for code. Substrate brief that
the AP/Spend Initiative and future domain initiatives consume.
Pre-finalization — sections fill in after the eight Phase 0 ADRs
ratify.

**Date:** 2026-05-03

**Resolution path:** Eight Phase 0 ADRs (per
`docs/09_briefs/phase-2/document_platform_reframe_design.md` §7) +
26 open questions (Q53–Q78) + four dependent-artifact updates
before any v1 code lands.

**Relationship to existing architecture:** Operationalizes
Simplification 3 from `docs/03_architecture/phase_simplifications.md`
(AP Agent as the second real agent informing what shared
agent-platform infrastructure is actually needed). The
Document Platform is what the AP Agent's exercise reveals as the
right substrate shape once receipts, retainers, statements,
credits, and other non-AP-bill document types are in scope.
Supersedes the substrate-shaped portions of the
2026-05-01 AP Ingestion Initiative brief; consumes the Authority
Gradient, Agent Ladder, Two Laws, Service Communication Rules,
and existing invariants from `docs/02_specs/`.

> **Document Platform is the foundation.**
> **AP/Spend is the first domain.**
> **Extraction is a feeder.**
> **Domain services produce ledger operations; the ledger service
> is the only writer of journal entries.**
> **Existing CHOUnting mutation and invariant discipline remains
> the authority.**

## Conceptual anchor

Documents are evidence. Bills, payments, prepayments, credits,
applications, statements, and reconciliations are
accounting/domain objects. A document may create, support,
modify, settle, or reconcile an accounting object — but a
document is never itself an accounting transaction.

---

## 1. Why this initiative exists
[Stub — fill from spec §1 motivation, anchored on shape diversity not volume]

## 2. Locked v1 scope
[Stub — substrate-shaped locks: storage_provider abstraction day 1, polymorphic source_document_links, document_cases + document_case_sources, ProposedMutation + ProposedMutationBundle + ProposedAttachment, exception queue first-class, OCR engine + Python sidecar v1 deliverables behind DocumentArtifact contract]

## 3. Architecture overview
[Stub — Storage / Evidence Core → Document Core → Relationship Router → Intent Router → Domain handoff → Tier 1 commit]

## 4. Tier 1 / Tier 2 / Tier 2.5 / Tier 3 placement
[Stub — pending ADR-0007 amendment per Q66; preferred Tier 2.5 for Relationship Router]

## 5. Data model
[Stub — source_documents, source_document_versions, source_document_links, document_cases, document_case_sources, document_artifacts, document_classifications, document_relationship_candidates, ingest_batches, ingest_items, document_jobs]

## 6. Storage abstraction
[Stub — fill from spec; carries forward the original AP brief §6]

## 7. Polymorphic source-document links — schema discipline
[Stub — closed enum for linked_entity_type, closed enum for link_role, (entity_type, role) pair-validity matrix, service-layer integrity validation, orphan/cascade behavior]

## 8. Relationship Router — three subsystems
[Stub — match-against-existing-state engine, ambiguity resolution, re-evaluation logic]

## 9. ProposedMutation / ProposedMutationBundle / ProposedAttachment
[Stub — fill from spec §14; ProposedAttachment for no-ledger-effect attaches]

## 10. Document lifecycle immutability rules
[Stub — fill from spec §16; ocr_runs immutable, extraction_runs immutable, candidates versioned, post-commit links require supersession]

## 11. Exception queue — first-class deliverable
[Stub — fill from spec §10; document-type-aware actions, reclassification, bulk operations, screenshot gate]

## 12. Multi-entity reservation
[Stub — fill from spec §17; legal_entity_id / paying_entity_id / benefiting_entity_id reservations]

## 13. Receipt v1 decision matrix
[Stub — fill from spec §15; per-capability split]

## 14. Phase A acceptance criteria
[Stub — fill after AP/Spend Subdomain ADR ratifies]

## 15. Phase 0 prerequisites
[Stub — eight ADRs from spec §7; 26 open questions Q53–Q78; four dependent-artifact updates]

## 16. ADRs this initiative produces
[Stub — Document Platform ADR, Storage Provider ADR, Tier 2 Document Pipeline ADR, ProposedMutationBundle ADR, Document Relationship Graph ADR, Relationship Router ADR, Confidence Calibration Policy ADR (seven)]

## 17. Open questions (Q53–Q78 filed in open_questions.md)
[Stub — list per spec §13]

## 18. Friction-journal scope
[Stub — Document Platform arc]

## 19. What this initiative does NOT do
[Stub — does not commit accounting state; does not own domain logic; does not change Authority Gradient / Agent Ladder / Two Laws / SCRs / existing invariants; does not edit AP/Spend brief content]

## 20. Verification against canonical docs
[Stub — fill after ADRs ratify]

## 21. Review history
- **2026-05-03** — Skeleton drafted under Phase 0 governance plan Task B1.
```

- [ ] **Step 2: Commit the skeleton.**

```bash
git add docs/09_briefs/phase-2/document_platform_initiative.md
git commit -m "briefs(phase-2): document_platform_initiative.md skeleton (Phase 0 Task B1)"
```

### Task B2: Rename + prune — Spend Initiative brief

**Files:**
- Rename: `docs/09_briefs/phase-2/ap_ingestion_initiative.md` → `docs/09_briefs/phase-2/spend_initiative.md`
- Modify: the renamed file (prune per spec §3.2 migration table)

- [ ] **Step 1: Rename via git mv to preserve history.**

```bash
git mv docs/09_briefs/phase-2/ap_ingestion_initiative.md docs/09_briefs/phase-2/spend_initiative.md
git commit -m "briefs(phase-2): rename ap_ingestion_initiative.md → spend_initiative.md (Phase 0 Task B2)"
```

- [ ] **Step 2: Open the renamed file and apply the spec §3.2 migration table — pruning sections that move to Document Platform.**

For each "Move" row in the migration table, delete the section from the Spend brief (the content has moved or will move into the Document Platform brief — verify the destination row in the migration table). For each "Split" row, keep the AP-domain portion and delete the substrate-shaped portion. For each "Stay" row, leave unchanged.

Specifically delete from `spend_initiative.md`:
- §6 (storage abstraction) — moves to Document Platform
- The Tier 2 extraction pipeline language inside §4 (the Tier 1 commit-boundary text stays)
- The polymorphic `source_document_links` paragraph in §5.2 (moves to Document Platform)
- The `source_documents` and `bill_attachments` paragraphs in §5.2 (move to Document Platform; the `bill_attachments` table is replaced by polymorphic `source_document_links`)
- §11.5 entries 6, 8 (Triage Bucket / drag-drop zone, Forwarded-email arrival notification — move to Document Platform)
- §15 entries: "Python OCR sidecar," "EDI / Peppol," "Vendor portal scraping," "LayoutLM / ML extraction," "Linked OAuth ingestion," "Photo / mobile receipt capture" (move to Document Platform deferred list)

- [ ] **Step 3: Rewrite the Spend brief lede section (§1) to reflect new framing.**

Replace §1's "Why this initiative exists" with the new framing: Spend is the first domain consumer of the Document Platform. The original lede sentence ("Extraction is a feeder. AP is the foundation. ...") moves to a history footnote noting the 2026-05-02 reframe. The new operative lede is the canonical five-sentence form from spec §4.

- [ ] **Step 4: Add the conceptual anchor immediately below the header block, matching the Document Platform brief.**

```markdown
## Conceptual anchor

Documents are evidence. Bills, payments, prepayments, credits,
applications are accounting/domain objects. The Spend Initiative
implements the AP/Spend subdomain as the first consumer of the
Document Platform substrate.
```

- [ ] **Step 5: Add the Spend-specific extensions per spec §3.2.**

Add to §3 (ProposedMutation variants): `record_vendor_prepayment`, `apply_vendor_prepayment_to_bill`, `record_vendor_prepayment_refund`, `write_off_vendor_prepayment`, `post_vendor_credit`, `apply_vendor_credit_to_bill`, `post_bill_with_payment` (born-paid bundle), `attach_payment_evidence` (`ProposedAttachment` variant).

Add to §5 (data model): `vendor_prepayments`, `vendor_prepayment_applications`, `vendor_credits`, `vendor_credit_applications`, `payment_purpose` enum on `payments`.

Add to vendor-master section the **bank-detail hard-rule callout** verbatim from spec §15 (this is the spec's drafting requirement for the Spend brief — must be a callout, not a parenthetical).

Add to §17 multi-entity reservations: `bills.legal_entity_id`, `bill_lines.benefiting_entity_id`, `payments.paying_entity_id`, `payments.benefiting_entity_id`. Reserved exception type `wrong_entity_exception`.

Add to §11.3 invariant candidates: `INV-DOC-NNN` (evidence-completeness — one primary attachment per bill / per case unless controller override). The reclassified `INV-AGENT-NNN` (bank-detail-confirmation as System ceiling) stays in the AGENT prefix.

- [ ] **Step 6: Update the title and header block.**

Title becomes "Spend Initiative — Phase 2 Brief." Status becomes: "CTO-reviewed; canonical Phase 2 planning artifact for the Spend subdomain (AP bills + payments + vendor prepayments + vendor credits). Renamed from `ap_ingestion_initiative.md` per the 2026-05-02 Document Platform reframe; substrate-shaped sections moved to `document_platform_initiative.md`. Not authorized for code."

- [ ] **Step 7: Update §13 ADR list to point to the spec.**

Replace §13 ADRs with:

```markdown
## 13. ADRs this initiative produces

Per `docs/09_briefs/phase-2/document_platform_reframe_design.md`
§7, two ADRs land in the Spend Initiative:

1. **AP/Spend Subdomain ADR.** Bill / payment / prepayment / credit
   lifecycles. Closes Q59 (vendor prepayment shape), Q60 (born-paid
   bundle approval), Q61 (vendor prepayment approval), Q62 (deposit
   tax timing), Q63 (vendor balance composition), Q64 (final invoice
   + prior credit), Q74 (receipt v1 path), Q78 (payment failure
   lifecycle).
2. **Vendor Template ADR (substrate portion only in v1).** Reserves
   `clean_approval_count` column on `vendor_rules` and the table
   shape under ADR-0010 reserved-enum-states discipline. Full
   enforcement / promotion / auto-post calibration ADR is drafted
   and ratified post-v1 when auto-post lands.

The five Document Platform ADRs (Document Platform, Storage
Provider, Tier 2 Document Pipeline, ProposedMutationBundle,
Document Relationship Graph, Relationship Router, Confidence
Calibration Policy) live in
`docs/09_briefs/phase-2/document_platform_initiative.md` and gate
this brief.
```

- [ ] **Step 8: Update §14 (open questions) to reference Q35–Q52 + filtered Q53–Q78 that fall in Spend scope.**

Spend-scope questions from Q53–Q78: Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78. The remaining Q53–Q78 are Document-Platform-scope and live in the Document Platform brief. Q35–Q52 from the original brief carry forward unchanged.

- [ ] **Step 9: Commit the pruned + extended Spend brief.**

```bash
git add docs/09_briefs/phase-2/spend_initiative.md
git commit -m "briefs(phase-2): spend_initiative.md pruned + extended per reframe migration table (Phase 0 Task B2)"
```

### Task B3: Finalize Document Platform brief (gated on Tier 1–6 ADR ratification)

**Files:**
- Modify: `docs/09_briefs/phase-2/document_platform_initiative.md`

- [ ] **Step 1: Verify all eight Document Platform ADRs are ratified before starting.**

Run: `ls docs/07_governance/adr/ | grep -iE "document-platform|storage-provider|tier-2-document-pipeline|proposed-mutation-bundle|document-relationship-graph|relationship-router|confidence-calibration|0007"`
Expected: at minimum the seven new files plus ADR-0007 amendment file. If any are missing, this task is blocked.

Read each ADR's Status header. Expected: `Ratified` (not `Drafted` or `Proposed`).

- [ ] **Step 2: Fill §1–§3 (motivation / scope / architecture) from spec §1 / §2 / §3.1.**

Pull motivation language from spec §1 (shape-not-volume framing). Pull scope from spec §3.1 (substrate items). Pull architecture overview from spec §3.1 + §15 (decision matrix).

- [ ] **Step 3: Fill §4 (Tier placement) from ratified ADR-0007 amendment + Relationship Router ADR.**

Whichever of (a)/(b)/(c) the ADR-0007 amendment chose is the canonical Tier placement. Document it here verbatim with cross-reference.

- [ ] **Step 4: Fill §5 (data model) from ratified Document Platform ADR + Document Relationship Graph ADR.**

Tables: `source_documents`, `source_document_versions`, `source_document_links`, `document_cases`, `document_case_sources`, `document_artifacts`, `document_classifications`, `document_relationship_candidates`, `ingest_batches`, `ingest_items`, `document_jobs`. Each with the column shape from the ratified ADR.

- [ ] **Step 5: Fill §6 (Storage) from ratified Storage Provider ADR.**

Carries forward and supersedes original AP brief §6 content. Cross-reference the ratified ADR for `Sites.Selected` setup, drift detection cadence, queue-and-retry parameters.

- [ ] **Step 6: Fill §7 (Polymorphic links) from ratified Document Relationship Graph ADR.**

`linked_entity_type` enum, `link_role` enum, `(entity_type, role)` validity matrix per Q55, service-layer integrity validation, orphan / link-status policy.

- [ ] **Step 7: Fill §8 (Relationship Router) from ratified Relationship Router ADR.**

Three subsystems: match, ambiguity resolution, re-evaluation. Confidence interaction with Confidence Calibration Policy ADR.

- [ ] **Step 8: Fill §9 (ProposedMutation / Bundle / Attachment) from ratified ProposedMutationBundle ADR.**

Bundle atomicity (DB-transaction), Logic Receipt shape, `ProposedAttachment` distinct from `ProposedMutation` (per spec §14).

- [ ] **Step 9: Fill §10 (immutability rules) from spec §16 verbatim.**

Four rules: ocr_runs immutable, extraction_runs immutable per `(source_document_id, ocr_run_id, extraction_version)`, candidates versioned, post-commit links require supersession.

- [ ] **Step 10: Fill §11 (exception queue) from ratified Document Platform ADR + Q68 disposition.**

Resolution-action enum, document-type-aware actions, screenshot-gate inclusion, bulk operations.

- [ ] **Step 11: Fill §12 (multi-entity reservation) from spec §17 verbatim.**

`legal_entity_id` (source_documents), `paying_entity_id` / `benefiting_entity_id` (payments), `wrong_entity_exception` reserved.

- [ ] **Step 12: Fill §13 (receipt decision matrix) from spec §15 verbatim.**

The 11-row capability matrix.

- [ ] **Step 13: Fill §14 (Phase A acceptance criteria) by cross-referencing the Spend brief.**

Document Platform exit criteria: Storage Core complete, Document Core skeleton complete, Document Relationship Graph complete, Relationship Router complete with confidence calibration, Exception queue UX complete with screenshot-gate ratification.

- [ ] **Step 14: Fill §15 (Phase 0 prerequisites) — list ratified ADRs, filed Q's, completed dependent-artifact updates.**

- [ ] **Step 15: Fill §16 (ADRs this brief produces) — list with cross-reference to ratified files.**

- [ ] **Step 16: Fill §17 (open questions) — list Q53–Q58, Q65–Q73, Q75–Q77 (Document-Platform-scope subset).**

- [ ] **Step 17: Fill §18 (friction-journal scope) — Document Platform arc placeholder name.**

- [ ] **Step 18: Fill §19 (NOT-do).**

- [ ] **Step 19: Fill §20 (verification) — list every canonical doc verified: CLAUDE.md, AGENTS.md, docs/INDEX.md, docs/02_specs/README.md, ledger_truth_model.md, agent_autonomy_model.md, intent_model.md, mutation_lifecycle.md, data_model.md, invariants.md, glossary.md, open_questions.md, conventions.md, ADR README, ADR-0001 through ADR-0010, agent_architecture_proposal.md, triage_bucket_intake.md, interaction_model_extraction.md, cmd_z_as_reversal.md, obligations.md, phase_plan.md, phase_simplifications.md, CURRENT_STATE.md, plus the eight ratified Phase 0 ADRs.**

- [ ] **Step 20: Update §21 review history with finalization entry and commit.**

```bash
git add docs/09_briefs/phase-2/document_platform_initiative.md
git commit -m "briefs(phase-2): document_platform_initiative.md finalized against ratified ADRs (Phase 0 Task B3)"
```

### Task B4: Finalize Spend brief (gated on AP/Spend Subdomain ADR ratification)

**Files:**
- Modify: `docs/09_briefs/phase-2/spend_initiative.md`

- [ ] **Step 1: Verify the AP/Spend Subdomain ADR is ratified.**

Run: `grep -i "^Status" docs/07_governance/adr/00*-ap-spend-subdomain.md`
Expected: `Status: Ratified`.

- [ ] **Step 2: Fill the AP-domain extensions to §3 (mapping table) with the new intent variants.**

Add table rows for `record_vendor_prepayment`, `apply_vendor_prepayment_to_bill`, `record_vendor_prepayment_refund`, `write_off_vendor_prepayment`, `post_vendor_credit`, `apply_vendor_credit_to_bill`, `post_bill_with_payment` (born-paid).

- [ ] **Step 3: Fill §5 data model extensions per the ratified ADR.**

`vendor_prepayments`, `vendor_prepayment_applications`, `vendor_credits`, `vendor_credit_applications` tables. `payment_purpose` enum on `payments`. Multi-entity reservations on `bills`, `bill_lines`, `payments`.

- [ ] **Step 4: Fill the Q-disposition table for Spend-scope questions.**

Q35–Q52 from original brief: keep disposition column (`open` / `resolved-by-ADR` / `deferred`). Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78 from this Phase 0 cycle: add disposition column.

- [ ] **Step 5: Update §21 review history and commit.**

```bash
git add docs/09_briefs/phase-2/spend_initiative.md
git commit -m "briefs(phase-2): spend_initiative.md finalized against ratified AP/Spend Subdomain ADR (Phase 0 Task B4)"
```

---

## Stream C — ADR drafting (six dependency tiers)

### Task C1 (Tier 1): Draft ADR-0007 amendment

**Files:**
- Modify (or amend in place per ADR README): `docs/07_governance/adr/0007-three-tier-agent-architecture.md` OR create `docs/07_governance/adr/0007-three-tier-agent-architecture-amendment.md`

- [ ] **Step 1: Read the existing ADR-0007 file and confirm whether the original was drafted (so amendment-in-place is appropriate) or proposed-only (so a new amendment file is appropriate).**

Run: `cat docs/07_governance/adr/0007-three-tier-agent-architecture.md 2>&1 | head -30`
If the file does not exist yet (ADR-0007 is referenced as "existing reservation" but never drafted), this task drafts the original ADR + the amendment in one document.

- [ ] **Step 2: Draft the Status / Context / Decision / Consequences sections.**

Cover: original three-tier framework (Tier 1 / Tier 2 / Tier 3 from `agent_architecture_proposal.md`), the amendment authorizing Tier 2 reads from committed ledger state OR introducing Tier 2.5 OR Tier-1-pre-commit (per Q66 — pick one), and the Q27 anti-hallucination wording covering Router reads as request-time context retrieval.

- [ ] **Step 3: Draft the Q28 expansion section.**

Per spec §12, the matrix expands to four re-verification surfaces: document-type-aware fields, relationship-claim re-verification, stale-state TOCTOU checks, bundle re-verification. Specify which Layer (1 schema / 2 service / 3 review) each check fires at.

- [ ] **Step 4: Cross-reference Q27, Q28, Q29, Q30, Q31, Q66, Q77.**

Each closes (or updates disposition) on this ADR's ratification.

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/0007*.md
git commit -m "adr(0007): three-tier agent architecture amendment — Tier 2/2.5 placement + Q27/Q28 expansion (Phase 0 Task C1 draft)"
```

### Task C2 (Tier 2): Draft Document Platform ADR

**Files:**
- Create: `docs/07_governance/adr/00NN-document-platform.md` (NN = next available ADR number after 0010 + the count of any ADRs already drafted in this Phase 0 cycle)

- [ ] **Step 1: Run `ls docs/07_governance/adr/0*.md | sort` to identify the next available ADR number.**

- [ ] **Step 2: Draft the Status / Context / Decision / Consequences sections.**

Decision covers: Document Platform as substrate; depends on ADR-0007 amendment; absorbs the Domain Boundary Map (Spend vs Banking ownership of `bank_transactions` / `card_transactions` per Q67); registers the new `DOC` invariant prefix; specifies the Q73 per-org-config knobs.

- [ ] **Step 3: Draft the Q28 Evolution subsection.**

Per spec §12 + the corresponding ADR-0007 amendment language. Document-type-aware re-verification matrix shape lives here (or cross-references `agent_architecture_policy.md` if that's the authoritative location).

- [ ] **Step 4: Cross-reference Q53, Q54, Q67, Q73, Q75, Q76.**

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-document-platform.md
git commit -m "adr(00NN): Document Platform — substrate definition + DOC prefix + Domain Boundary Map (Phase 0 Task C2 draft)"
```

### Task C3 (Tier 3): Draft Storage Provider ADR (parallel with C4, C5)

**Files:**
- Create: `docs/07_governance/adr/00NN-storage-provider.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers: Supabase Storage default + SharePoint opt-in + future provider seats; `Sites.Selected` over `Files.ReadWrite.All`; per-vendor folder structure; drift-detection cadence; queue-and-retry parameters; controller-override path; `attachment_status` enum; integrity-check policy.

- [ ] **Step 3: Cross-reference Q47, Q52 (carried from original brief), Q73 (per-org config).**

- [ ] **Step 4: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-storage-provider.md
git commit -m "adr(00NN): Storage Provider — Supabase default + SharePoint opt-in + drift detection (Phase 0 Task C3 draft)"
```

### Task C4 (Tier 3): Draft Tier 2 Document Pipeline ADR (parallel with C3, C5)

**Files:**
- Create: `docs/07_governance/adr/00NN-tier-2-document-pipeline.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers (per spec §15 reframe-supersession note): OCR engine choice (PaddleOCR / Tesseract / Claude vision / etc.) selected for v1 with rationale; Python-sidecar deployment topology (Modal / Azure GPU VM / self-hosted); language boundary (HTTP between TS and Python); trace propagation; model versioning; rollback strategy; provider-swap path. The OCR engine is a swap-target behind `DocumentArtifact`.

- [ ] **Step 3: Draft the DocumentArtifact / OcrArtifact contract.**

Per spec §3.1: pages, lines, words, bounding boxes, confidence, quality flags, pipeline trace. Engine-agnostic.

- [ ] **Step 4: Cross-reference Q53, Q65, Q69, Q70, Q71, Q72, Q74.**

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-tier-2-document-pipeline.md
git commit -m "adr(00NN): Tier 2 Document Pipeline — OCR engine + Python sidecar + DocumentArtifact contract (Phase 0 Task C4 draft)"
```

### Task C5 (Tier 3): Draft ProposedMutationBundle ADR (parallel with C3, C4)

**Files:**
- Create: `docs/07_governance/adr/00NN-proposed-mutation-bundle.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers: bundle shape, child-mutation atomicity (absorbs the Bundle Atomicity decision per spec §7 — DB-transaction-atomic enforcement), Logic Receipt shape for compound mutations, mapping to `intent_model.md` Primitive 1 (Proposal) with composite payload (no new primitive needed per spec §20). Also defines `ProposedAttachment` as a sibling concept (per spec §14): same approval queue, no ledger operation, commits via `documentLinkService.create()` with audit-log entry.

- [ ] **Step 3: Cross-reference Q58.**

- [ ] **Step 4: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-proposed-mutation-bundle.md
git commit -m "adr(00NN): ProposedMutationBundle + ProposedAttachment — atomicity + sibling no-mutation concept (Phase 0 Task C5 draft)"
```

### Task C6 (Tier 4): Draft Document Relationship Graph ADR (parallel with C7)

**Files:**
- Create: `docs/07_governance/adr/00NN-document-relationship-graph.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers: `source_document_links` polymorphic table; closed `linked_entity_type` enum (per spec §6 list — bill, payment, bill_payment_allocation, vendor_prepayment, vendor_prepayment_application, vendor_credit, vendor_credit_application, vendor_statement_reconciliation, bank_transaction, card_transaction, customer_invoice, customer_payment, employee_expense_report, fixed_asset, purchase_order, receiving_document, tax_form, manual_journal_entry); closed `link_role` enum (per spec §6 enumerated set — primary_invoice, payment_evidence, receipt, supporting, correspondence, credit_memo, statement, deposit_request, retainer_agreement, refund_evidence, proof_of_delivery, contract, tax_support, source_of_extraction, derived_from, superseded_by); `(entity_type, role)` pair-validity matrix; service-layer integrity validation discipline; orphan / link-status / cascade behavior. v1 active subset narrow; rest reserved per ADR-0010.

- [ ] **Step 3: Cross-reference Q55.**

- [ ] **Step 4: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-document-relationship-graph.md
git commit -m "adr(00NN): Document Relationship Graph — polymorphic source_document_links + pair validity matrix (Phase 0 Task C6 draft)"
```

### Task C7 (Tier 4): Draft AP/Spend Subdomain ADR (parallel with C6)

**Files:**
- Create: `docs/07_governance/adr/00NN-ap-spend-subdomain.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers: bill / payment / prepayment / credit lifecycles; `vendor_prepayments` + `vendor_prepayment_applications` table shapes; `vendor_credits` + `vendor_credit_applications` table shapes; `payment_purpose` discriminator on `payments`; `bills.legal_entity_id` + `bill_lines.benefiting_entity_id` reservations; born-paid bundle workflow via `billService.postWithImmediatePayment(...)`; reconciliation-metadata preservation requirement on `payments` (last-4 / merchant / auth ref / statement-date) for v2 reconciliation; vendor-bank-detail-change hard-rule callout cross-reference; `INV-DOC-NNN` evidence-completeness candidate.

- [ ] **Step 3: Cross-reference Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78.**

- [ ] **Step 4: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-ap-spend-subdomain.md
git commit -m "adr(00NN): AP/Spend Subdomain — bill/payment/prepayment/credit lifecycles + payment_purpose + multi-entity (Phase 0 Task C7 draft)"
```

### Task C8 (Tier 4 parallel): Draft Vendor Template substrate-only ADR

**Files:**
- Create: `docs/07_governance/adr/00NN-vendor-template-substrate-reservation.md`

- [ ] **Step 1: Identify next available ADR number.**

- [ ] **Step 2: Draft Status / Context / Decision / Consequences.**

Decision covers: substrate-only portion of vendor-template work — reserves `clean_approval_count` integer column on `vendor_rules`, default account mapping columns, autonomy-tier reservation. Explicitly notes that full enforcement / promotion / auto-post calibration is **drafted and ratified post-v1** when auto-post lands. Reserved-enum-states pattern per ADR-0010.

- [ ] **Step 3: Add the spec §7 scope-split justification paragraph verbatim.**

"This is not an exception to the atomic-ADR rule. It is an ADR-0010 reserved-enum-states pattern: reserve the schema now so v1 can collect clean-approval evidence, but defer the governance / enforcement decision until auto-post is actually in scope."

- [ ] **Step 4: Cross-reference Q43 (carried from original brief), Q60.**

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-vendor-template-substrate-reservation.md
git commit -m "adr(00NN): Vendor Template substrate reservation — clean_approval_count + vendor_rules table shape only (Phase 0 Task C8 draft)"
```

### Task C9 (Tier 5): Draft Relationship Router ADR

**Files:**
- Create: `docs/07_governance/adr/00NN-relationship-router.md`

- [ ] **Step 1: Verify Tier 1, 2, 3, 4 ADRs are at least drafted (this ADR depends on them).**

- [ ] **Step 2: Identify next available ADR number.**

- [ ] **Step 3: Draft Status / Context / Decision / Consequences.**

Decision covers: three-subsystem decomposition (match-against-existing-state, ambiguity resolution, re-evaluation logic); per spec §8. Match algorithm (vendor + amount + date + reference fuzzy match thresholds per document type); ambiguity UX integration with exception queue (per Q68); re-evaluation triggers (per Q56) — new-bill-posted, vendor-master-changed, period-reopened, OCR-engine-version-changed; immutability / supersession boundary (per spec §16 + Q76); Q28 stale-state TOCTOU check obligations.

- [ ] **Step 4: Cross-reference Q56, Q66, Q76, Q77.**

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-relationship-router.md
git commit -m "adr(00NN): Relationship Router — three subsystems + re-evaluation triggers + stale-state checks (Phase 0 Task C9 draft)"
```

### Task C10 (Tier 6): Draft Confidence Calibration Policy ADR

**Files:**
- Create: `docs/07_governance/adr/00NN-confidence-calibration-policy.md`

- [ ] **Step 1: Verify Tier 5 (Relationship Router ADR) is at least drafted.**

- [ ] **Step 2: Identify next available ADR number.**

- [ ] **Step 3: Draft Status / Context / Decision / Consequences.**

Decision covers: who calibrates thresholds (Controller + CTO governance review), against what test set, how often, with what audit trail; per-type vs system-wide thresholds; org-configurable knobs vs system-fixed for v1 (cf. Q23 on agent ladder thresholds); what happens when a threshold moves (re-evaluate prior decisions or not — gates against spec §16 immutability for committed decisions).

- [ ] **Step 4: Cross-reference Q57, Q65, Q73.**

- [ ] **Step 5: Commit draft.**

```bash
git add docs/07_governance/adr/00NN-confidence-calibration-policy.md
git commit -m "adr(00NN): Confidence Calibration Policy — governance over per-type thresholds + audit trail (Phase 0 Task C10 draft)"
```

---

## Stream D — ADR ratification (gates Streams B-final and Phase 1+ code)

Each ratification task verifies the named authority (per Decision 3 above) has reviewed and approved. The ratification act is a Status header change in the ADR file from `Drafted` to `Ratified`, plus a friction-journal entry.

### Task D1: Ratify Tier 1 — ADR-0007 amendment

- [ ] **Step 1: CTO reviews ADR-0007 amendment draft.**

- [ ] **Step 2: Address review feedback (revise C1 if needed, re-commit).**

- [ ] **Step 3: On CTO approval, change Status header to `Ratified` with date.**

- [ ] **Step 4: File friction-journal entry naming the ratification.**

```markdown
### 2026-MM-DD — ADR-0007 amendment ratified

CTO ratified the three-tier agent architecture amendment after
NNN review cycles. Decision: Tier 2.5 (option (b) per spec §9)
introduces a read-only ledger-state-aware tier specifically for
the Relationship Router. Q27, Q28, Q29, Q30, Q31, Q66, Q77 close
or update disposition.
```

- [ ] **Step 5: Commit the ratification.**

```bash
git add docs/07_governance/adr/0007*.md docs/07_governance/friction-journal.md
git commit -m "adr(0007): ratify three-tier agent architecture amendment (Phase 0 Task D1)"
```

### Task D2: Ratify Tier 2 — Document Platform ADR

- [ ] **Step 1: CTO ratifies, founder reviews.**

- [ ] **Step 2: Address feedback, re-commit.**

- [ ] **Step 3: Change Status to `Ratified`. File friction-journal entry. Commit.**

```bash
git add docs/07_governance/adr/00NN-document-platform.md docs/07_governance/friction-journal.md
git commit -m "adr(00NN): ratify Document Platform ADR (Phase 0 Task D2)"
```

### Task D3: Ratify Tier 3 — Storage Provider, Tier 2 Document Pipeline, ProposedMutationBundle (parallel)

- [ ] **Step 1: CTO ratifies each.**

- [ ] **Step 2: Change Status on all three to `Ratified`. File friction-journal entries. Commit.**

```bash
git add docs/07_governance/adr/00NN-storage-provider.md docs/07_governance/adr/00NN-tier-2-document-pipeline.md docs/07_governance/adr/00NN-proposed-mutation-bundle.md docs/07_governance/friction-journal.md
git commit -m "adr: ratify Tier 3 ADRs (Storage Provider, Tier 2 Document Pipeline, ProposedMutationBundle) (Phase 0 Task D3)"
```

### Task D4: Ratify Tier 4 — Document Relationship Graph, AP/Spend Subdomain, Vendor Template substrate (parallel)

- [ ] **Step 1: CTO ratifies Document Relationship Graph and Vendor Template substrate; CTO ratifies + founder reviews AP/Spend Subdomain.**

- [ ] **Step 2: Change Status on all three to `Ratified`. File friction-journal entries. Commit.**

```bash
git add docs/07_governance/adr/00NN-document-relationship-graph.md docs/07_governance/adr/00NN-ap-spend-subdomain.md docs/07_governance/adr/00NN-vendor-template-substrate-reservation.md docs/07_governance/friction-journal.md
git commit -m "adr: ratify Tier 4 ADRs (Relationship Graph, AP/Spend Subdomain, Vendor Template substrate) (Phase 0 Task D4)"
```

### Task D5: Ratify Tier 5 — Relationship Router

- [ ] **Step 1: CTO ratifies.**

- [ ] **Step 2: Change Status to `Ratified`. File friction-journal entry. Commit.**

```bash
git add docs/07_governance/adr/00NN-relationship-router.md docs/07_governance/friction-journal.md
git commit -m "adr(00NN): ratify Relationship Router ADR (Phase 0 Task D5)"
```

### Task D6: Ratify Tier 6 — Confidence Calibration Policy

- [ ] **Step 1: Controller + CTO ratify (governance-level decision per Decision 3).**

- [ ] **Step 2: Change Status to `Ratified`. File friction-journal entry. Commit.**

```bash
git add docs/07_governance/adr/00NN-confidence-calibration-policy.md docs/07_governance/friction-journal.md
git commit -m "adr(00NN): ratify Confidence Calibration Policy ADR (Phase 0 Task D6)"
```

---

## Stream E — Dependent artifact updates

### Task E1: Register `DOC` invariant prefix in invariants.md

**Files:**
- Modify: `docs/02_specs/invariants.md`

- [ ] **Step 1: Verify Document Platform ADR is ratified (gates this task).**

- [ ] **Step 2: Add `DOC` to the registered prefix list.**

The registered-prefix list in `invariants.md` currently includes LEDGER, MONEY, IDEMPOTENCY, RLS, AUTH, SERVICE, AUDIT, REVERSAL, ADJUSTMENT, RECURRING. Append `DOC` with a one-paragraph description matching the existing entries' shape.

- [ ] **Step 3: Note INV-DOC-001 as the first reserved (not registered) candidate.**

`INV-DOC-001` (evidence-completeness — one primary attachment per bill / per case unless controller override). Layer 2 service-layer enforcement. Registered when enforcement lands — per the spec-without-enforcement rule.

- [ ] **Step 4: Commit.**

```bash
git add docs/02_specs/invariants.md
git commit -m "invariants: register DOC domain prefix + INV-DOC-001 evidence-completeness candidate (Phase 0 Task E1)"
```

### Task E2: Draft Q28 expansion in agent_architecture_policy.md

**Files:**
- Create or modify: `docs/02_specs/agent_architecture_policy.md`

- [ ] **Step 1: Verify ADR-0007 amendment is ratified (gates this task).**

- [ ] **Step 2: Locate or create the Q28 re-verification matrix section.**

If `agent_architecture_policy.md` does not exist yet (it's referenced in original brief Q28 as the destination — may not have been created), create it now with header block matching `ledger_truth_model.md` shape.

- [ ] **Step 3: Draft the four re-verification surfaces per spec §12.**

Document-type-aware field re-verification (per-type matrix); relationship-claim re-verification (receipt-still-matches-bill, prepayment-balance-still-sufficient, credit-still-applies); stale-state re-verification (bill-still-in-posted-state, prepayment-not-applied-by-other-mutation, period-still-open, vendor-bank-flag-not-flipped); bundle re-verification (compound mutation balances; rollback semantics).

- [ ] **Step 4: Mark the matrix as `Drafted, awaiting ratification — gates v1 ship, not Phase 1 start`.**

- [ ] **Step 5: Commit.**

```bash
git add docs/02_specs/agent_architecture_policy.md
git commit -m "agent-policy: Q28 re-verification matrix expansion — four surfaces incl stale-state TOCTOU (Phase 0 Task E2)"
```

### Task E3: Append Simplification 3 footnote to phase_simplifications.md

**Files:**
- Modify: `docs/03_architecture/phase_simplifications.md`

- [ ] **Step 1: Locate the Simplification 3 entry.**

- [ ] **Step 2: Append a footnote noting the 2026-05-02 reframe operationalizes (not amends) Simplification 3.**

```markdown
> **Footnote (2026-05-03).** The Document Platform reframe (per
> `docs/09_briefs/phase-2/document_platform_reframe_design.md`)
> operationalizes Simplification 3 rather than amending it. The
> AP Agent remains the second real agent (after the Phase 1
> Double Entry Agent); the Document Platform is what the AP
> Agent's exercise reveals as the right substrate shape once
> receipts, retainers, statements, credits, and other non-AP-bill
> document types are in scope. The discipline "no platform
> abstraction until two systems prove the need" is preserved by
> treating the receipts / retainers / statements class as the
> second consumer that the platform must accommodate alongside
> AP bills.
```

- [ ] **Step 3: Commit.**

```bash
git add docs/03_architecture/phase_simplifications.md
git commit -m "phase-simplifications: Simplification 3 footnote — reframe operationalizes not amends (Phase 0 Task E3)"
```

### Task E4: Decide whether ADR-0010 needs amendment, amend if needed

**Files:**
- Read: `docs/07_governance/adr/0010-reserved-enum-states.md`
- Possibly modify: same file

- [ ] **Step 1: Read ADR-0010 in full.**

- [ ] **Step 2: Decide — does the Document Platform ADR introduce a reserved-enum pattern that ADR-0010 doesn't already cover?**

Specifically: the `(linked_entity_type, link_role)` pair-validity matrix is a two-dimensional reservation pattern, not the standard one-dimensional enum reservation ADR-0010 was written against. The `attachment_status` enum on `source_documents` follows the standard pattern. The `payment_purpose` enum follows the standard pattern.

- [ ] **Step 3: If amendment is needed, draft an amendment-in-place per the ADR README's "amend in place when the decision moves during the same cycle" pattern.**

Amendment covers two-dimensional `(entity_type, role)` reservation discipline as a recognized pattern under ADR-0010.

- [ ] **Step 4: If no amendment needed, skip.**

- [ ] **Step 5: Commit (if amended).**

```bash
git add docs/07_governance/adr/0010-reserved-enum-states.md
git commit -m "adr(0010): amend reserved-enum-states to recognize two-dimensional pair-validity pattern (Phase 0 Task E4)"
```

### Task E5: Register the eight new ADRs in ADR README + new briefs in INDEX.md

**Files:**
- Modify: `docs/07_governance/adr/README.md`
- Modify: `docs/INDEX.md`

- [ ] **Step 1: Append entries for each new ADR to the ADR README index.**

Each entry is a one-line: `ADR-NNNN — Title (Status: Ratified, YYYY-MM-DD)`.

- [ ] **Step 2: Update INDEX.md to register `document_platform_initiative.md` and the renamed `spend_initiative.md`.**

Drop the entry for `ap_ingestion_initiative.md` (renamed). Add entries for `document_platform_initiative.md` and `spend_initiative.md`. Add an entry for `document_platform_reframe_design.md` (the reframe spec). Add an entry for `2026-05-03-phase-0-governance-plan.md` (this file).

- [ ] **Step 3: Commit.**

```bash
git add docs/07_governance/adr/README.md docs/INDEX.md
git commit -m "index: register Phase 0 ADRs and renamed/new briefs (Phase 0 Task E5)"
```

---

## Phase 0 closeout

### Task Z1: Verify all nine exit criteria

**Files:**
- Read: various

- [ ] **Step 1: Verify (1) Document Platform Initiative brief is ratified.**

```bash
grep -i "^Status" docs/09_briefs/phase-2/document_platform_initiative.md
```
Expected: `Status: CTO-reviewed; canonical Phase 2 planning artifact ... ratified ...`

- [ ] **Step 2: Verify (2) Spend Initiative brief is ratified.**

```bash
grep -i "^Status" docs/09_briefs/phase-2/spend_initiative.md
```
Expected: ratified status text.

- [ ] **Step 3: Verify (3) all eight Phase 0 ADRs are ratified (or the substrate-only portion of Vendor Template ADR).**

```bash
for f in docs/07_governance/adr/0007*.md docs/07_governance/adr/00*-document-platform.md docs/07_governance/adr/00*-storage-provider.md docs/07_governance/adr/00*-tier-2-document-pipeline.md docs/07_governance/adr/00*-proposed-mutation-bundle.md docs/07_governance/adr/00*-document-relationship-graph.md docs/07_governance/adr/00*-ap-spend-subdomain.md docs/07_governance/adr/00*-vendor-template-substrate-reservation.md docs/07_governance/adr/00*-relationship-router.md docs/07_governance/adr/00*-confidence-calibration-policy.md; do
  echo "==> $f"
  grep -i "^Status" "$f" | head -1
done
```
Expected: every line shows `Ratified` (with optional date).

- [ ] **Step 4: Verify (4) Q53–Q78 are filed in open_questions.md with disposition.**

```bash
grep -cE "^### Q5[3-9]|^### Q6[0-9]|^### Q7[0-8]" docs/02_specs/open_questions.md
```
Expected: `26`.

- [ ] **Step 5: Verify (5) ADR-0007 amendment / Tier 2.5 decision is resolved.**

ADR-0007 file Status header is `Ratified`. Decision section names the chosen Tier placement (a / b / c per Q66).

- [ ] **Step 6: Verify (6) DOC invariant prefix is registered.**

```bash
grep -E "^- DOC" docs/02_specs/invariants.md
```
Expected: at least one line.

- [ ] **Step 7: Verify (7) Q28 re-verification expansion is drafted.**

```bash
test -f docs/02_specs/agent_architecture_policy.md && grep -i "Q28" docs/02_specs/agent_architecture_policy.md
```
Expected: file exists with Q28 mention.

- [ ] **Step 8: Verify (8) Storage Provider ADR resolves Supabase / SharePoint behavior and integrity policy.**

ADR file contains: Supabase default, SharePoint opt-in, drift detection cadence, queue-and-retry parameters, controller-override path.

- [ ] **Step 9: Verify (9) Tier 2 Document Pipeline ADR resolves OCR / Python sidecar ownership.**

ADR file contains: OCR engine choice with rationale, Python-sidecar deployment topology, language boundary, trace propagation, model versioning, rollback strategy.

- [ ] **Step 10: File closeout friction-journal entry.**

```markdown
### 2026-MM-DD — Phase 0 closed

All nine exit criteria met:
1. Document Platform Initiative brief ratified.
2. Spend Initiative brief ratified.
3. Eight Phase 0 ADRs ratified.
4. Q53–Q78 filed (26 entries).
5. ADR-0007 amendment ratified.
6. DOC invariant prefix registered.
7. Q28 re-verification expansion drafted (ratification gates v1 ship).
8. Storage Provider ADR resolves provider behavior + integrity policy.
9. Tier 2 Document Pipeline ADR resolves OCR / Python sidecar ownership.

Phase 1 (Storage / Evidence Core) code can now begin. The next
writing-plans cycle produces the Phase 1 implementation plan.

Eight subsequent code phases (1–8) will need their own plans.
Some phases may be combinable (e.g., Phase 6 ingestion + Phase 7
extraction may fit one plan if scope allows); most warrant their
own plan.
```

- [ ] **Step 11: Commit closeout.**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "phase-0: closed — all nine exit criteria met; Phase 1 unblocked"
```

- [ ] **Step 12: Remove tracking files.**

```bash
git rm -r .claude/phase-0-tracking
git commit -m "phase-0: remove tracking scaffolding"
```

---

## Plan summary

**Streams (parallelism):**
- Stream A (Q-filing): 5 tasks. Independent. Runs from day 1.
- Stream B (Briefs): 4 tasks. B1+B2 independent. B3+B4 gated on Stream D.
- Stream C (ADR drafting): 10 tasks. Six dependency tiers.
- Stream D (Ratification): 6 tasks. Each gates next-tier C task and Stream B finalization.
- Stream E (Dependent artifacts): 5 tasks. E1 gated on D2; E2 gated on D1; E3/E4/E5 independent.

**Critical path:** C1 → D1 → C2 → D2 → C3/C4/C5 → D3 → C6/C7/C8 → D4 → C9 → D5 → C10 → D6 → B3/B4 → Z1.

**Total tasks:** 31 (5 A + 4 B + 10 C + 6 D + 5 E + 1 Z).

**Subsequent plans needed (post-Phase-0, separate writing-plans cycles):**

- Phase 1 plan: Storage / Evidence Core implementation
- Phase 2 plan: Document Core skeleton implementation
- Phase 3 plan: Document Relationship Graph implementation
- Phase 4 plan: Relationship Router implementation
- Phase 5 plan: Spend / AP foundation (manual only) implementation
- Phase 6 plan: Ingestion channels (drag-drop + forwarded mailbox) implementation
- Phase 7 plan: Extraction pipeline (OCR + DocumentArtifact production) implementation
- Phase 8 plan: Proposal handoff + Tier 1 commit implementation

Some of these may combine if scope allows (Phase 6 + 7 are tightly coupled and may fit one plan). Most warrant their own plan.
