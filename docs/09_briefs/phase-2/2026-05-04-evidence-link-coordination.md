# Evidence-Link Coordination — Bank-Detail-Evidence Link-Target + Failure-Notice Link-Role

**Date assembled:** 2026-05-04.
**Phase 0 plan reference:** Session 2B post-D4 named-follow-ups closeout. Coordinated mini-decision dispatch covering two related questions deferred from D4 ratification (judgment item 2 + B5 from Cleanup Commit 4 hygiene-pass discoveries).
**Drafted by:** Phase 0 governance plan execution, Session 2B, post-D4.
**Commits referenced:**
- D4 ratification at `e71ecc1` (CTO ratification of ADR-0015 / ADR-0016 / ADR-0017 with named follow-ups).
- Cleanup Commit 4 at `25ddbc6` (post-D4 hygiene closeout; deferred B5 link-role question to this dispatch per the "Out-of-scope" disposition).

---

## 1. Summary

Two related questions about evidence attachment in the document relationship graph were deferred from D4 ratification because they share the same architectural shape and warrant coordinated decision rather than independent resolution. The questions:

**Question 1 (judgment item 2 from Tier 4 review):** Where does the source document supporting a vendor bank-detail change attach in the link graph?

**Question 2 (B5 from Cleanup Commit 4 hygiene pass):** Where does the bank/card failure notice attach for a payment that flips to `payment_state = 'failed'` per ADR-0015 §8?

Both questions are "evidence attachment" decisions: a document needs to attach to *something* in CHOUnting's relationship graph for audit-trail completeness, but neither has a defined target in the current Tier 4 ratified state. Both touch ADR-0015 (consumer side), ADR-0016 (link-role / link-target enums), and possibly ADR-0011 §6 (polymorphic-link discipline at the spine level if a new entity type is required).

The brief proposes options for each question, recommends a coordinated path, and asks CTO + founder to ratify the path. The actual ADR amendments land in a separate commit (or commits, depending on the chosen path) after ratification.

## 2. Why these questions warrant coordinated decision

### 2.1 Shared architectural shape

Both questions ask: *given a source document that carries information about a non-bundle, non-receipt event (a vendor-change request; a payment failure notice), where does that document attach so the audit trail is complete and queryable?*

The Tier 4 ratified state covers the four canonical attachment shapes:
- Bills carry attached `primary_invoice` + `supporting` evidence (ADR-0015 §10 + ADR-0016 §3 cell `(bill, primary_invoice)` = `A`).
- Payments carry attached `payment_evidence` + `receipt` evidence (cells `(payment, payment_evidence)` and `(payment, receipt)` = `A`).
- Vendor prepayments carry attached `payment_evidence` + `receipt` + `supporting` (cells = `A`).
- Vendor credits carry attached `supporting` (cell = `A`).

Neither of the two questions' documents fits any of these four shapes naturally. A bank-detail-change request document doesn't attach to a bill (it's not invoice-shaped) or to a payment (the change *might* be triggered by a payment-related document but the document itself describes vendor-master change, not payment evidence). A failure notice attaches to a payment in some sense, but the existing `payment_evidence` role describes "this document confirms the payment occurred" — using it for "this document confirms the payment failed" conflates two distinct semantic claims with serious downstream consequences for audit queries.

### 2.2 Coordinated decision discipline

Resolving the two questions independently produces two ADR amendments authored at different times against potentially-different decisions about the underlying enum membership. Coordinating them means: one decision about what gets added to ADR-0016's enum-membership reserved set or v1-active subset, with both questions' use cases informing the choice. This is the same discipline that motivated the Tier 4 trio ratifying as a package — both questions cite ADR-0016 enum membership; coordinated dispatch prevents a future B5 amendment from being misaligned with a prior judgment-item-2 amendment.

### 2.3 V1 functional adequacy is not in question

Both questions are about evidence-trail completeness, not about whether the v1 functional path exists. Specifically:

- **Bank-detail change:** the v1 fraud-control gate exists per ADR-0015 §9 (INV-AGENT-006 enforcement at `vendorService.update()`). Out-of-band verification + controller approval + the `vendor_bank_detail_change_confirmed` audit event all fire regardless of whether a supporting source document is attached through a typed `link_role`. The question is whether the supporting document also attaches via the link graph (giving forensic queries like "show me every bank-detail change with its supporting documentation" a clean structured query path) or remains inline-in-form only (controller pastes the verification context into the audit event's free-form `description` field).
- **Failure notice:** the v1 reversal flow exists per ADR-0015 §8 (proposal-and-confirm with controller approval; `payment_failure_reversed` audit event). The bank/card failure notice document — when one exists physically — currently has no defined attachment path. The audit event captures the failure reason as a string field; the document itself either gets attached through `payment_evidence` (semantically wrong) or remains unattached (audit-trail completeness gap).

Both questions are therefore "evidence-trail polish" rather than "v1 missing functionality." That framing means deferring resolution to a future phase is acceptable; ratifying a Notes-callout-only path that defers schema activation is acceptable; activating a typed `link_role` reservation now with v1-emit gating is acceptable. The brief's recommendation reflects this judgment.

## 3. Question 1 — bank-detail-evidence link-target

### 3.1 Question shape

A controller authoring a vendor bank-detail change per ADR-0015 §9 has out-of-band verification documentation (an email confirming the new bank details with the vendor; a screenshot of a phone-call recording confirmation; a signed change form). The current ADR-0015 §9 captures this as: `vendor_bank_detail_change_confirmed` audit event with the controller_user_id, prior values, new values, out-of-band-verification claim timestamp, trace_id. **The supporting document itself has no defined attachment target.**

### 3.2 Three options

**Option 1A — Document attaches to a `vendor_change_proposal` entity (new platform-substrate or AP/Spend-domain entity).**

Introduces a new entity (`vendor_change_proposal`) that represents the in-flight vendor-change workflow: created when `vendorService.proposeBankDetailChange()` fires; transitions to `confirmed` or `rejected` as the controller acts. The bank-detail-evidence document attaches to this entity via `(linked_entity_type = 'vendor_change_proposal', link_role = 'bank_detail_evidence')`. Both the entity type and the link role are NEW reservations — neither exists in the current ADR-0016 reserved sets.

Architectural implications:
- New entity table (`vendor_change_proposals`) with schema for the in-flight workflow.
- Entity ownership question: platform-substrate (ADR-0011 §1) or AP/Spend-domain (ADR-0015 §1)?
  - Platform-substrate framing: the `ProposedMutation` workflow is platform; `vendor_change_proposal` is just a typed `ProposedMutation` variant, no new table needed (the mutation lives on the existing proposal infrastructure).
  - AP/Spend-domain framing: the workflow is AP/Spend (vendor master is AP/Spend-owned); the entity lives with the domain that owns vendors.
  - Resolving this is an ADR-0011 amendment OR an ADR-0015 amendment depending on which framing wins.
- New `linked_entity_type` value (`vendor_change_proposal`) added to ADR-0016 reserved set; activated at v1 if Option 1A is chosen.
- New `link_role` value (`bank_detail_evidence`) added to ADR-0016 reserved set; activated at v1.
- New cell `(vendor_change_proposal, bank_detail_evidence)` = `A` in ADR-0016 §3 pair-validity matrix.

Cost: highest — introduces a new entity, requires entity-ownership decision, two enum extensions, one matrix cell activation. Schema deltas across ADR-0011 (or ADR-0015), ADR-0016, and possibly ADR-0017 cross-references.

Benefit: cleanest separation. Bank-detail change becomes a first-class workflow entity with its own proposal lifecycle, evidence attachments, and audit history. The pattern generalizes to other vendor-master changes (e.g., a future "vendor name change requires controller approval" rule reuses the same entity).

**Option 1B — Document attaches directly to the vendor row.**

Activates `vendor_master` in the ADR-0016 v1 active `linked_entity_type` subset (currently reserved post-v1 per item 1's Notable absences callout). Adds a new `link_role` value (`bank_detail_evidence`) to ADR-0016's reserved or v1-active set. The bank-detail-evidence document attaches via `(linked_entity_type = 'vendor_master', link_role = 'bank_detail_evidence')`.

Architectural implications:
- ADR-0016 §1 v1-active subset extends from 8 to 9 entity types (adds `vendor_master`).
- ADR-0016 §2 v1-active subset extends from 4 to 5 link roles (adds `bank_detail_evidence`) — OR reserved post-v1 only with v1 emission gated.
- ADR-0016 §3 matrix gains a new active cell `(vendor_master, bank_detail_evidence)` = `A`.
- ADR-0015 §9 amends to capture the new attachment surface in the audit event field set.
- ADR-0015 §10 schema deltas adds the new attachment expectation.

The "Notable absences" callout in ADR-0016 §1 explicitly framed `vendor_master`'s reservation as "vendor-master changes in v1 do not produce `source_document_links` rows." Activating the entity type contradicts this framing, requiring a documented rationale change.

Cost: medium — one entity-type activation + one link-role addition + one matrix cell activation + ADR-0015 §9 amendment. No new entity table.

Benefit: simpler than Option 1A. The vendor row is the durable artifact (proposals are transient); attaching evidence to the vendor itself means the evidence persists with the vendor record across multiple change events.

Tension: a single vendor row may carry many bank-detail changes over its lifetime; attaching all evidence to the vendor row makes the audit trail at the vendor level clear but loses per-change-event grouping (which change event does this document support?). The audit event ID in the `source_document_links.metadata` (a column not currently introduced — would itself be a schema delta) could solve this; a cleaner fix is to use a composite link target (`vendor_master` + audit_event_id discriminator), which is what Option 1A's `vendor_change_proposal` entity provides natively.

**Option 1C — V1 keeps inline-in-form evidence; Notes-for-future-writers callout in both ADRs.**

V1 ships with no typed link-role attachment for bank-detail evidence. The controller pastes verification context into the audit event's `description` field (or attaches the document through ad-hoc means outside the structured link graph — e.g., uploads to a controller-folder that's outside the relationship-graph substrate). Both ADR-0015 §9 and ADR-0016 add Notes-for-future-writers callouts naming the gap and forward-pointing the resolution to a post-Phase-0 amendment when the right shape is clearer (likely after Banking domain ADR scopes and surfaces vendor-change-proposal patterns more broadly).

Architectural implications:
- Zero schema deltas at v1.
- ADR-0015 Notes addition naming the inline-in-form pattern as the v1 path.
- ADR-0016 Notes addition naming the gap and forward-pointing to a post-Phase-0 ADR.

Cost: lowest — text-only additions to two ADRs.

Benefit: defers the architectural decision until the right shape is clearer. The "founder + 2 real users" v1 cohort produces a small number of bank-detail changes (estimated < 10 across v1 duration based on a small founder + 2 real-users cohort with low vendor churn). Inline-in-form evidence is operationally tractable at this volume; the controller's audit event description field carries the verification context.

Tension: defers the decision; if a post-v1 phase forces resolution, the deferral cost is the migration of inline evidence to typed-link evidence (which depends on a controller manually re-attaching prior inline evidence — possibly requiring the original documents to still be accessible).

### 3.3 Brainstorm-side recommendation for Question 1

**Option 1C — Notes-callout-only at v1.**

Reasoning:
1. V1 cohort volume is low (founder + 2 real users; estimated < 10 bank-detail changes per v1 duration).
2. The architectural decision between Options 1A and 1B depends on whether `vendor_change_proposal` is a generalizable platform entity (i.e., do other vendor-master changes warrant the same workflow shape?) — that question is outside Phase 0 scope and would force premature commitment to one framing.
3. The v1 fraud-control gate (INV-AGENT-006 + controller out-of-band verification) is already present and mechanical; missing structured-link evidence does NOT weaken the fraud control.
4. Forward-pointing the resolution lets a post-Phase-0 ADR (likely Banking domain or a vendor-master-workflow ADR) make the decision once the broader vendor-change pattern is clearer.

**Trade-offs accepted:** v1 audit-trail queries about bank-detail changes return controller_user_id + prior/new values + verification timestamp + free-form description; they do NOT return a typed link to the supporting document. A controller running a forensic query "show me every bank-detail change with its supporting documentation" would need to read the description field for a free-form pointer to where the evidence lives (file system, email folder, etc.) rather than getting a structured-link result.

## 4. Question 2 — failure_notice link-role

### 4.1 Question shape

A bank/card failure event (NSF, ACH return, wire bounce, card chargeback) per ADR-0015 §8 produces a notice document — typically a bank statement excerpt, an ACH return notice, a chargeback notification, or a card processor's failure report. The notice carries the canonical evidence that the failure occurred. The current ADR-0015 §8 captures the failure context as: the `payment_failure_reversed` audit event with the `failure_reason` free-form text field. **The notice document itself has no defined attachment target.**

The Q78 closure picked proposal-and-confirm over auto-reverse precisely because the controller's accept/reject decision needs to be traceable. The notice document is the evidence that grounds the controller's decision. Without a typed link-role attachment, the notice attaches via `payment_evidence` (semantically incorrect — `payment_evidence` describes "this document confirms the payment occurred" not "this document confirms the payment failed"), or remains unattached (audit-trail gap).

### 4.2 Two options (the third "C" parallel doesn't apply here cleanly)

**Option 2A — Add `failure_notice` to ADR-0016's reserved post-v1 set (NOT v1-active).**

Adds `failure_notice` to ADR-0016 §2 reserved post-v1 list. v1 does not emit the value (Layer 2 Zod rejects it; Layer 3 service emission omits it; Layer 1 DB CHECK rejects it). Activation lands when post-v1 enforcement scopes — likely the same Banking domain ADR that would activate `bank_transaction` and related entity types.

Architectural implications:
- ADR-0016 §2 reserved set extends from 22 to 23 values.
- ADR-0016 §3 matrix gains reserved cells: `(payment, failure_notice)` = `R`, `(bill, failure_notice)` = `R` (or `I` if the role is payment-only by semantic).
- ADR-0015 §8 Notes addition naming the post-v1 attachment surface and the v1 inline-only path.

Cost: low — one reserved-set extension + matrix cell labeling + Notes addition.

Benefit: schema reservation lands at v1 schema time per ADR-0010 reserved-enum-states discipline. Post-v1 activation does not require an enum migration — only a Layer 1/2/3 defense loosening + a v1-active subset extension. The reservation pattern matches Cleanup Commit 3's `legal_entity_id` framing (reserve at v1 schema time; activate post-v1).

**Option 2B — Activate `failure_notice` at v1 (NOT reserved).**

Adds `failure_notice` to ADR-0016 §2 v1-active subset. v1 emits it via `paymentService.commitFailureReversal()` when a notice document is attached. Cell `(payment, failure_notice)` = `A` in the matrix.

Architectural implications:
- ADR-0016 §2 v1-active subset extends from 4 to 5 values.
- ADR-0016 §3 matrix activates `(payment, failure_notice)` = `A`.
- ADR-0016 §4 service rejection rules update to admit the new active pair.
- ADR-0015 §8 amends the failure-reversal flow to include a `ProposedAttachment(attach_failure_notice)` step in the proposal lifecycle.

Cost: medium — one enum activation + matrix cell activation + Layer 1/2/3 defense extension + ADR-0015 §8 flow amendment.

Benefit: v1 ships with structured-link evidence for failure events. The audit-trail completeness gap closes at v1.

Tension: V1 cohort volume is low for payment failures (estimated < 5 across v1 duration based on small cohort + low payment volume). Activating at v1 means writing v1 service code (the `ProposedAttachment` flow extension in `paymentService.commitFailureReversal()`) for a code path that may never fire in v1. This is the substrate-now-enforcement-later anti-pattern: shipping v1 code that has no v1 use case violates the discipline named in ADR-0017's substrate-only-v1 framing.

### 4.3 Brainstorm-side recommendation for Question 2

**Option 2A — Reserve at v1 schema time; activate post-v1.**

Reasoning:
1. V1 cohort volume is low (estimated < 5 payment failures across v1 duration).
2. The substrate-now-enforcement-later pattern (ADR-0017 §Notes for future writers, fourth Phase 0 application) applies cleanly: reserve the value at v1 schema time so post-v1 activation does not require enum migration; defer the v1 service code until the post-v1 corpus exists.
3. ADR-0010 reserved-enum-states discipline is the canonical framing for "ship the schema seat at v1; ship the runtime later"; Option 2A is the textbook application.

**Trade-offs accepted:** v1 failure events have no typed-link evidence attachment. The notice document either attaches via `payment_evidence` (with a Notes-for-future-writers callout in ADR-0015 §8 explicitly noting this is an interim measure) or remains unattached (controller's audit-event description field carries a free-form pointer). The forensic query "show me every payment failure with its supporting notice" has limited structured-link visibility at v1; the gap closes post-v1 when `failure_notice` activates.

## 5. Coordinated path — both questions resolved together

If CTO + founder ratify the brainstorm-side recommendations (Option 1C for Question 1 + Option 2A for Question 2), the resolution lands as:

### 5.1 ADR-0015 amendments
- §9 Notes-for-future-writers entry: bank-detail-evidence link-target gap; v1 path is inline-in-form via controller's audit event description field; post-Phase-0 resolution forward-pointed.
- §8 Notes-for-future-writers entry: failure_notice link-role gap; v1 path is interim `payment_evidence` attachment OR unattached + free-form pointer in audit description; post-v1 activation of `failure_notice` link-role per ADR-0016.

### 5.2 ADR-0016 amendments
- §2 reserved post-v1 set extends: add `failure_notice` value (count goes from 22 to 23 reserved values).
- §3 matrix labels: cell `(payment, failure_notice)` = `R`; cell `(bill, failure_notice)` = `I` (semantically invalid — failure notices attach to payments only); other Table A entity types' `failure_notice` cells = `I`. Reserved post-v1 entity types' cells label per existing matrix conventions.
- Notes-for-future-writers entry: bank-detail-evidence link-target gap forward-pointed; failure_notice activation forward-pointed.

### 5.3 ADR-0011 (no amendments required)
Both recommended options are scoped to ADR-0015 and ADR-0016. No ADR-0011 §6 polymorphic-link discipline amendment is required for Option 1C + Option 2A.

### 5.4 Single-commit landing pattern
The post-ratification commit lands as one or two commits:
- **Single-commit option:** all five edits across two files in one commit titled "Cleanup Commit 5 (post-D4 mini-decision): evidence-link coordination" — pattern matches Cleanup Commit 4's editorial-only shape.
- **Split-commit option:** ADR-0015 Notes additions in one commit; ADR-0016 reserved-set + matrix update in a separate commit (substrate change vs editorial). Matches the Cleanup Commit 1/2/3 split that separated mechanical edits from substrate addition.

Brainstorm-side recommendation: single-commit. The `failure_notice` reservation IS a substrate addition, but it's a single value extending an already-reserved set per ADR-0010 discipline — not a multi-cell schema change like Cleanup Commit 3's `legal_entity_id`. The substrate-vs-editorial split was load-bearing for Cleanup Commit 3 because the column addition affected the unique constraint and the v1 fill semantics; for Option 2A's reserved-value extension, those mechanics don't apply. Single commit preserves the post-Tier-4 closeout narrative as a unified named-follow-ups closure.

## 6. Alternative — choose different options per question

CTO + founder may choose differently per question:
- Option 1A or 1B for Question 1 + Option 2A for Question 2.
- Option 1C for Question 1 + Option 2B for Question 2.
- Any other combination.

The brief presents the brainstorm-side recommendation but does not constrain CTO + founder to it. Each question's options are independent; the coordinated recommendation reflects shared reasoning (low v1 cohort volume, substrate-now-enforcement-later precedent, deferred-decision discipline) but is not architecturally forced.

If a different combination is chosen, the post-ratification amendment shape adjusts:
- Option 1A chosen → introduces new entity table, requires entity-ownership decision (ADR-0011 vs ADR-0015), substantive amendments to multiple ADRs.
- Option 1B chosen → activates `vendor_master` in v1, contradicts current ADR-0016 §1 "Notable absences" framing, requires rationale amendment.
- Option 2B chosen → activates `failure_notice` in v1, requires v1 service code in `paymentService.commitFailureReversal()`.

## 7. Ratification path

Mini-decision ratification is CTO authority. Founder review is appropriate — the bank-detail attachment surface is an evidence-trail polish question with low operational urgency at v1, and the founder's view on "ship structured evidence-link now vs defer to post-Phase-0" is the strategic input that disambiguates Options 1A/1B vs 1C.

**Recommended path:** CTO + founder review this brief in Session 2B post-D4. Verdict on each question lands in a follow-up message; brainstorm-side authors the post-ratification amendment dispatch brief; WSL executes the amendment commit.

No D-task ratification package is required for a sub-2-page mini-decision dispatch of this size; the ratification is folded into the Session 2B post-D4 review window.

The post-ratification amendment commit lands the chosen path's edits per §5 above. ADR Status fields update mechanically as part of the same commit (or an immediately-following commit) to reflect the named-follow-up resolution.

## 8. Open questions surfaced

If the CTO + founder review surfaces a scope question on either decision, file as Q-new in the post-D4 review session. The next available Q-number per the open_questions.md sequence is Q80 (Q79 was reserved for the INV-DOC-001 shape question per D2 ratification; brainstorm-side has not verified whether Q79 was consumed during ADR-0015 drafting — WSL spot-check recommended before Q-new filing).

Possible scope expansions that may arise:
- Whether `vendor_change_proposal` (Option 1A) generalizes to other vendor-master change classes (name changes, address changes, payment-instructions changes that don't touch bank account).
- Whether `failure_notice` (Option 2A) should distinguish bank-side vs card-side vs cheque-side failures (separate reserved values vs a single shared role with a typed metadata field).
- Whether the inline-in-form v1 evidence pattern (Option 1C) needs explicit governance on what "inline-in-form" means operationally (file uploads to a controller-folder; email attachments on the audit-event email; pasted text in the description field; some combination).

These are not blocking the mini-decision; they're potential follow-on Q-new filings.

## Status

Drafted 2026-05-04. Awaiting CTO + founder verdict on each question.
