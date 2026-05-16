# Agent Autonomy Model — Vendor Bank-Detail Amendment Proposal

**Date assembled:** 2026-05-03.
**Phase 0 plan reference:** Session 2A closeout carry-forward, executed in Session 2B alongside ADR-0015 drafting.
**Drafted by:** Phase 0 governance plan execution, Session 2B.
**Source spec file:** `docs/02_specs/agent_autonomy_model.md` (worktree branch `worktree-phase-0-governance`).
**Cross-artifact citation pass precedent:** commit `4ad6c69` (Session 2A) — replaced stale positional citations with label-based citations naming the rule's real source (`document_platform_reframe_design.md` §15) and noting that registration in `agent_autonomy_model.md` §6 was a Session 2B follow-up. This brief proposes that follow-up.

---

## 1. Summary

Layer-4 spec amendment proposal: add **vendor bank-detail change** as the seventh row in `agent_autonomy_model.md` §6 System table, and reserve **INV-AGENT-006** in §10 to govern enforcement. The amendment is mechanical — the rule is already understood, named, and cited across the system; what is missing is the canonical row in the canonical Layer-4 spec. The brief proposes the amendment; ratification authorizes it; a separate edit commit lands the row addition + INV-AGENT-006 registration.

## 2. Why this amendment exists

The vendor bank-detail-change System-ceiling rule is the single most important AP fraud control in the system: extracted invoice or payment instructions may suggest a bank-detail change, but they may never update the vendor master automatically — independent out-of-band confirmation with the vendor is required.

The rule was named as a Spend-brief callout requirement in `docs/09_briefs/phase-2/document_platform_reframe_design.md` §15 (2026-05-02 reframe). Five downstream artifacts already cite the rule:

- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` — three-category vendor-master read-boundary split (Tier 2 reads identity/matching fields only; Tier 2.5 reads payment-risk fields exclusively; Tier 1 re-verifies all vendor-control fields at commit).
- `docs/07_governance/adr/0011-document-platform.md` §11 — vendor-matcher read-boundary inheritance from ADR-0007.
- `docs/02_specs/agent_architecture_policy.md` — Q28 re-verification matrix surfaces (commit/staleness checks for the bank-detail-confirmed flag).
- `docs/07_governance/adr/0012-proposed-mutation-bundle.md` §9 — vendor bank-detail change is a separate System-ceiling proposal, not a bundle child.
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` — Tier 2 vendor matcher payment-risk read boundary; Tier 1 re-verification of vendor-control fields.

All five citations were tightened to label-based form in commit `4ad6c69` (Session 2A cross-artifact citation pass). The label they cite reads "the System-ceiling rule for vendor bank-detail changes (per `document_platform_reframe_design.md` §15; pending registration in `agent_autonomy_model.md` §6)." The canonical Layer-4 spec — `agent_autonomy_model.md` itself — does not currently carry the rule in §6's System table. This amendment closes the governance gap.

## 3. Proposed amendment

Add the seventh row to `agent_autonomy_model.md` §6 System table (the table at lines 383–391 of the current file, which presently carries six rows):

| # | Class | Status | Enforcement |
|---|-------|--------|-------------|
| 7 | Vendor bank-detail change | **Reserved** → INV-AGENT-006 | System ceiling on `update_vendor` mutations that change `bank_account`, `payment_instructions`, or the `bank_detail_confirmed_flag` column |

Add the corresponding entry to §10 Reserved INV-IDs (after INV-AGENT-005):

> **INV-AGENT-006 — Vendor bank-detail changes are System ceiling**
>
> Any mutation to `vendor.bank_account`, `vendor.payment_instructions`, or `vendor.bank_detail_confirmed_flag` is System ceiling, requiring controller confirmation. Out-of-band verification (independent confirmation with the vendor through a separate channel) is required for the controller to proceed. Extracted invoice or payment instructions may suggest a bank-detail change but may never update the vendor master automatically.
>
> **Layer:** Layer 2 (service enforcement via `vendorService.update`'s ceiling check). To be registered when the vendor-master service lands.

The §6 row composes with the existing System-table semantics: ceiling classes can never be auto-posted regardless of rung, limit, or rule maturity, and the ceiling list can only be extended (by adding new classes in a migration), never contracted.

## 4. Cross-artifact impact (cite-by-not-amend)

After this amendment ratifies, the five artifacts named in §2 each carry a label-based citation to the rule that can be tightened to a direct §6 reference. The follow-up cleanup pass would replace the trailing parenthetical "pending registration in `agent_autonomy_model.md` §6" with a clean direct citation to the row by label (never positionally — citation discipline from commit `4ad6c69`).

That follow-up is **out of scope for this amendment brief.** The amendment ratifies on its own; the citation tightening happens later (Session 2B post-ratification cleanup pass, or Session 3 if it slips). Sequencing the cleanup separately keeps this brief minimal and the cleanup commit reviewable as a single mechanical pattern replacement.

No artifact requires a substantive content change as part of this amendment. The five citations all already describe the rule correctly; only the address-form changes.

## 5. Ratification path

Layer-4 spec amendments that add to the System ceiling list are CTO-authority. Founder review is appropriate — the bank-detail rule is a Spend-brief-named callout the founder has already endorsed via the Option A confirmation in the reframe spec (`document_platform_reframe_design.md` §2).

**Recommended path:** CTO ratifies in Session 2B alongside ADR-0015 drafting. ADR-0015's vendor-master section will cite this rule heavily, and ratifying the §6 row before ADR-0015 lands lets ADR-0015 cite the row directly rather than carrying forward the "pending registration" parenthetical. No D-task ratification package is required for a sub-1-page Layer-4 spec amendment of this size; the ratification is folded into a Session 2B brief review.

The amendment commit (separate from this brief) lands two file edits to `agent_autonomy_model.md` only: the §6 row addition and the §10 INV-AGENT-006 entry. No other artifact is touched in the amendment commit.

## 6. Open questions surfaced

None expected. The amendment is mechanical — adding a row to a list of rules already understood by the system, with a reservation entry whose enforcement layer (Layer 2 service ceiling check on `vendorService.update`) is already implied by the four sibling INV-AGENT-001..005 reservations.

If founder review surfaces a scope question (e.g., "should this also cover ACH details? wire instructions? international account routing fields?"), file as Q-new in the amendment session. Q79+ is the next available number per Session 2A closeout (Q79 is also reserved for the INV-DOC-001 shape question carried forward from D2 ratification — the bank-detail amendment session would file from Q80 onward unless Q79 is consumed first).

## Status

Drafted 2026-05-03. Awaiting CTO ratification + founder review in Session 2B.
