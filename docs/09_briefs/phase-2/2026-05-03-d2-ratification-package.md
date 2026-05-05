# D2 Ratification Package — ADR-0011

**Status:** Awaiting CTO ratification + founder review.
**Date assembled:** 2026-05-03.
**Phase 0 plan reference:** Task D2 (gates Stream C Tier 3 — ADR-0012 ProposedMutationBundle, ADR-0013 Storage Provider, ADR-0014 Tier 2 Document Pipeline — three independent ADRs, parallel within tier).
**Drafted by:** Phase 0 governance plan execution, Session 2 (Task C2).
**Source ADR file:** `docs/07_governance/adr/0011-document-platform.md` (worktree branch `worktree-phase-0-governance`, commits `de63c01` C2 draft + `cc8c837` cleanup pass).

---

## 1. Summary

ADR-0011 is the spine ADR for the Document Platform substrate per Phase 0 governance plan Task C2. It establishes the load-bearing contract that the eight downstream Phase 0 ADRs (ADR-0012 through ADR-0019) inherit and forward-point back to. The spine items captured in the Decision section:

- entity ownership boundary (Platform-owned / domain-owned / ledger-owned table sets);
- `source_documents` schema with the immutable evidence anchor + current-version-pointer hybrid;
- polymorphic `source_document_links` discipline (full enum membership deferred to ADR-0016);
- `document_artifacts` engine-agnostic contract (engine choice deferred to ADR-0014);
- document-type discriminator with v1 active subset (`vendor_invoice`, `receipt`, `payment_confirmation`, `unknown`);
- `ProposedMutation` / `ProposedMutationBundle` / `ProposedAttachment` handoff vocabulary;
- Reading B preservation (three-layer separation: platform proposes, domain decides, ledger writes);
- document lifecycle immutability rules per spec §16;
- multi-entity reservations per spec §17;
- vendor-matcher read-boundary inheritance from ADR-0007's three-category split;
- Q28 expansion forward-pointer (matrix lives in `agent_architecture_policy.md` per Phase 0 Task E2);
- exception queue first-class deliverable with full resolution-action enum (eight active in v1, eight reserved);
- Domain Boundary Map (Banking post-v1; reconciliation-metadata preservation requirement on the v1 `payments` schema);
- `DOC` invariant prefix introduction with INV-DOC-001 evidence-completeness as the first reserved candidate.

**Ratification authority:** CTO ratifies; founder reviews (soft gate per Phase 0 governance plan Decision 3).

**Length:** 1354 lines / ~67 KB. Density-over-length per the calibration phrasing — every spine item that downstream ADRs need to cite is here, in full enough form that they can cite without round-tripping. Cleanup pass commit `cc8c837` resolved four internal-consistency issues identified in the C2 self-review (count consistency in the resolution-action enum, `content_hash` semantics on the `source_documents` row, the audit-log writer boundary, and the case-level reversibility framing).

ADR-0011 closes 7 questions, forward-points 16 to downstream ADRs, and cross-references 7 already-resolved items from ADR-0007 (Q27, Q28, Q29, Q30, Q31, Q66 closed by ADR-0007; Q77 updated by ADR-0007).

## 2. Closes — seven questions

| Question | Topic | Closure |
|---|---|---|
| Q53 | Document-type enum: active v1 set, reserved set | v1 active: `vendor_invoice`, `receipt`, `payment_confirmation`, `unknown`. Remaining 14 values reserved per ADR-0010. Per-type confidence thresholds are owned by ADR-0019, not closed here. |
| Q54 | Document case lifecycle states + transition guards | State set: `received, extracting, classified, matched, proposed, needs_review, approved, committed, rejected, archived`. Service-layer-enforced transitions per the §3 table (automation-only, human-only, automation-or-human per row). All states reserved per ADR-0010. |
| Q67 | Banking / Spend boundary; bank/card transaction ownership | Domain Boundary Map: Banking is post-v1. v1 routes bank/card statements to the exception queue. Spend (v1) owns outgoing `payments` with reconciliation-metadata preservation. Banking (post-v1) will own `bank_transactions` / `card_transactions` and the reconciliation workflow. |
| Q68 | Exception queue UX + resolution-action enum | Full 16-value resolution-action enum per ADR-0010 discipline. v1 active subset: `attach_to_existing_bill`, `attach_to_existing_payment`, `record_bill_payment`, `mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`, `reprocess`, `archive`. Bulk operations, reclassification, document-type-aware actions, and screenshot-gate coverage are first-class deliverable requirements. |
| Q73 | Per-org Document Platform configuration | **Narrow closure on the platform-surface portion only.** v1 platform is not per-org-configurable for the active document-type set, the v1 active resolution-action subset, the ProposedAttachment approval policy, or the Domain Boundary Map cut — those are system-fixed for v1. Configurability of storage provider, OCR provider, retention policy, language packs, and confidence thresholds is forward-pointed to ADR-0013 / ADR-0014 / ADR-0019. See §5 Item A. |
| Q75 | Document case source cardinality | v1 ships the `document_case_sources(document_case_id, source_document_id, role)` table with the four-value v1 active subset (`primary, supporting, email_body, payment_evidence`). v1 patterns that ship case-source bundling: email body + invoice attachment; receipt + payment-evidence. Remaining patterns route to manual linking via the exception queue. |
| Q76 | Re-evaluation policy / immutability vs supersession boundary | The four immutability rules per spec §16: `ocr_runs` immutable; `extraction_runs` immutable per `(source_document_id, ocr_run_id, extraction_version)` tuple; `relationship_candidates` versioned via supersession; pre-commit case `current_relationship_candidate_id` may change, post-commit `source_document_links` require reversal/supersession. **Closure-venue rationale documented in ADR-0011's "Notes for future ADR writers" section** — Q76 is a judgment-call closure between this ADR and ADR-0018, placed here because immutability is about row semantics, not Router behavior. |

## 3. Updates — none

The Updates table is empty. ADR-0011 does not update any prior ADR or canonical doc. Two clarifying notes:

- **Q77 stays open** until E2's matrix ratifies. ADR-0011 does not update Q77 — ADR-0007 already did, and ADR-0011 cites that update as a cross-reference.
- **The DOC prefix is introduced by ADR-0011 but not registered.** Registration in `docs/02_specs/invariants.md` is Phase 0 Task E1, executed post-ratification of this ADR. The prefix introduction is a downstream consequence captured in §15 of the ADR; it is not framed as an "Update" to a prior artifact because no prior artifact named the prefix.

## 4. Delta vs. source materials

ADR-0011 carries the following items beyond what the reframe spec / B1 skeleton / D1 baseline already captured. Each item below is a genuine delta — verified against the spec's existing treatment:

1. **§3 case lifecycle table extrapolation.** Spec §13 Q54 framed the open question as "not the state names (those are decided), but which transitions get service-layer enforcement vs UI convention" — without enumerating per-transition automation-only / human-only guards. ADR-0011's §3 enumerates the per-transition guard table in full (which transitions are automation-driven, which are human-driven, which permit both). The ADR also adds the case-level reversibility-as-misframe clarification (case-level `committed` is not reversible; reversal lives at the journal-entry level per ADR-0001 and operates against the `source_document_links` row, not the case state). The subagent extrapolated the per-transition table and self-flagged the extrapolation in C2 self-review.

2. **§15 INV-DOC-001 reserved candidate naming.** Spec §3.2 named INV-DOC-NNN (placeholder) as a reserved invariant candidate for evidence-completeness (one primary attachment per bill / per case). ADR-0011 specifies the candidate's exact number (INV-DOC-001), candidate text, and Layer-2 enforcement disposition (service-layer enforcement at `billService.post()` with controller-override flag).

3. **§13 v1 active subset of the resolution-action enum.** Spec §13 Q68 enumerated the full 16-value enum but framed v1 active set as "narrow" without specifying which eight values are active. ADR-0011 specifies the v1 active subset (eight values) with explicit rationale for why credit / prepayment paths are deferred to manual AP/Spend forms rather than activated as queue resolution rows.

4. **§14 Domain Boundary Map cross-domain protocol paragraph.** The reconciliation-metadata preservation requirement on the `payments` row (`payment_method`, last-4 of card or bank account, merchant identifier, authorization / reference number, transaction-as-it-would-appear-on-statement date) is named here so the future Banking ADR can inherit the metadata-preservation contract from ADR-0015's `payments` schema without round-tripping. Spec §15 named the requirement; ADR-0011 frames it as the cross-domain protocol that ties v1 Spend to post-v1 Banking.

5. **§1 audit-log writer boundary clarification (separate from journal-entry writer boundary).** New architectural language not present in the spec or ADR-0007. The ADR codifies that `audit_log` is written through the canonical audit-log writer (`recordMutation.ts` per INV-AUDIT-001 today) and explicitly extends the pattern to document-link mutations: when `documentLinkService.create()` commits a `ProposedAttachment`, it routes the audit event through the canonical writer rather than inserting into `audit_log` directly. This codifies how the existing pattern already works and makes the boundary explicit for future contributors.

6. **§2 `source_documents` schema split into immutable original-anchor + current-version-pointer.** Cleanup-pass artifact (commit `cc8c837`). The original C2 draft contained a write-once-vs-latest contradiction on `content_hash`. The cleanup resolved it by splitting the schema into an immutable evidence anchor (`original_content_hash`, `original_byte_size`, `original_filename`) and a mutable pointer (`current_version_id`) into the version-history table. Drift detection produces new version rows or exceptions; the anchor never mutates.

7. **Q73 narrow-closure scoping decision.** Cleanup-pass artifact. The C2 brief listed Q73 as "close in this ADR" without specifying scope. The cleanup pass scoped the closure narrowly: the platform-surface portion only (no platform-owned per-org knobs in v1), with storage / OCR / retention / language packs / confidence thresholds forward-pointed to ADR-0013 / ADR-0014 / ADR-0019. See §5 Item A below.

## 5. Carry-forward code-quality items needing CTO call

Three items surfaced during C2 drafting + cleanup pass that the agent author flagged but did not change in the draft, on the grounds that they are CTO-decision items rather than draft-quality items. The CTO can decide ratify-as-is, ratify-with-follow-up-amendments, or request-changes-pre-D2 for any subset.

**Item A — Q73 narrow-closure scope.**
ADR-0011 closes Q73 only on the platform-surface portion (no platform-owned per-org knobs in v1) and forward-points configurability of storage / OCR / retention / language packs / confidence thresholds to ADR-0013 / ADR-0014 / ADR-0019. The C2 brief listed Q73 as "close in this ADR" without specifying scope; the cleanup pass scoped the closure narrowly.

CTO call: ratify the narrow closure as-is; OR expand the scope if CTO believes the platform should own additional configurability knobs in v1; OR request a partial-closure rephrasing that more explicitly names Q73 as Q73 (partial) in the open_questions tracking.

*Recommended:* ratify as-is. The narrow closure is correct — claiming broader Q73 ownership would either duplicate-close knobs that downstream ADRs need to own or claim ownership of knobs the platform doesn't control.

**Item B — INV-DOC-001 shape Q-new not yet filed.**
§15 references "Q-new" for the per-bill-vs-per-case INV-DOC-001 shape and the controller-override mechanism, but no such Q is filed in `open_questions.md`. The override mechanism is ADR-0015-owned (per §15 of ADR-0011), so the question's natural home is alongside ADR-0015 drafting in Session 2B rather than as a D2 pre-merge fix.

CTO call: file the Q in Session 2B alongside ADR-0015 drafting; OR file it now as part of D2 pre-merge fixes; OR fold the question into ADR-0015's open scope without a numbered Q.

*Recommended:* file alongside ADR-0015 drafting in Session 2B; the Q is ADR-0015-bound, not platform-bound. The Q-numbering will start at Q79.

**Item C — §7 ProposedAttachment audit-log phrasing.**
The cleanup pass added §1's audit-log writer boundary clarification (canonical writer per INV-AUDIT-001) but §7's ProposedAttachment section still phrases it as "writes an `audit_log` entry on the document layer" without explicitly noting the canonical-writer routing. The §7 statement is true as written but reads slightly inconsistent with §1's boundary clarification.

CTO call: ratify-as-is (statements are true; the inconsistency is phrasing-level); OR tighten §7 to "records a document-layer audit event through the canonical audit-log writer per §1" as a follow-up amendment; OR request the tightening pre-D2.

*Recommended:* ratify-as-is; the tightening is a one-line follow-up that doesn't warrant pre-D2 churn.

## 6. Recommended ratification path

**Ratify with named follow-up amendments.** Specifically:

- **Item A** (Q73 narrow-closure scope): ratify as-is. The narrow closure is correct.
- **Item B** (INV-DOC-001 shape Q-new): file the Q in Session 2B alongside ADR-0015 drafting; not a D2 pre-merge fix.
- **Item C** (§7 ProposedAttachment audit-log phrasing): ratify as-is with optional one-line follow-up tightening.

The CTO can:
- accept this recommendation (ratify with named follow-ups);
- ratify as-is and let all three items become tracked amendments;
- request changes pre-D2 for any subset of items A–C.

## 7. Ratification ask

CTO selects one of three paths above (or proposes a fourth). On ratification:

- CTO updates ADR-0011's `Status` field to `Ratified YYYY-MM-DD by CTO` with their handle.
- The Phase 0 governance plan's D2 task closes.
- Stream C Tier 3 (ADR-0012 ProposedMutationBundle, ADR-0013 Storage Provider, ADR-0014 Tier 2 Document Pipeline — three independent ADRs, parallel within tier) becomes unblocked.

Founder review is a soft gate (review, not ratify).

**Founder-review focus areas:**
- §1 motivation (Document-Platform-as-foundation framing per Option A).
- §14 Domain Boundary Map (the Banking-post-v1 cut).
- §13 exception queue (the v1 user-experience reality of "founder + 2 real users will spend most of their time here").

**CTO-review focus areas:**
- §1 entity ownership boundary (including the audit-log writer boundary clarification).
- §2 `source_documents` schema (the original-anchor + current-pointer hybrid is the cleanup-pass artifact most worth CTO eyes).
- §7 ProposedAttachment (commit path + approval policy).
- §8 Reading B preservation.
- §10 multi-entity reservations.
- §11 vendor-matcher read boundary (verify the three-category quote landed faithfully from ADR-0007).
- §15 DOC prefix / INV-DOC-001.

(All section numbers above refer to ADR-0011's sections, not this package's sections.)

## 8. Source materials read during C2 drafting + cleanup pass

For CTO context, the C2 subagent and cleanup pass read the following before drafting:

- `docs/09_briefs/phase-2/document_platform_reframe_design.md` (the canonical 21-section design spec).
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (ratified 2026-05-03; three-category vendor-master read-boundary split inherited verbatim).
- `docs/02_specs/open_questions.md` Q53–Q78 (closure / forward-pointer disposition decisions).
- `docs/09_briefs/phase-2/document_platform_initiative.md` (the B1 skeleton; structural alignment for B3 finalization in Session 3).
- `docs/02_specs/intent_model.md` (`ProposedMutation` shape; Four Questions grammar; `ProposedAttachment`-as-Primitive-1 mapping).
- `docs/02_specs/ledger_truth_model.md` (Reading B; Service Communication Rules; INV-AUDIT-001/002 separation; canonical audit-log writer pattern).
- `docs/02_specs/agent_autonomy_model.md` §6 Item 2 (vendor bank-detail-change System ceiling).
- `docs/07_governance/adr/0010-reserved-enum-states.md` (discipline applied to every closed enum introduced or named).
- `docs/07_governance/adr/README.md` (ADR-0011 number reservation per Decision 7 of governance plan).
- `docs/09_briefs/phase-2/2026-05-03-d1-ratification-package.md` (D1 precedent for the ratify-with-named-follow-ups pattern).

This list is here so the CTO can spot-check that the ADR's claims about what existing artifacts say are accurate.
