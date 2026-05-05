# Document Platform Initiative — Phase 2 Brief

**Status:** Ratified per Phase 0 closure verification 2026-05-04 (Session 2F).
Substrate brief that the AP/Spend Initiative and future domain
initiatives consume. Status header + §15 Phase 0 prerequisites + §17
open questions + §21 review history finalized at Phase 0 closure;
substantive content sections (§1–§14, §16, §18–§20) deferred to
Phase 1 implementation onset per the substrate-now-enforcement-later
cross-pattern (per `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`
§6.8 codified Phase 0 governance lesson + ADR-0010 amendment Variant
A precedent at commit `797db40`). Substantive section content fills
in alongside Phase 1 (Storage / Evidence Core) implementation work
that consumes the corresponding ratified ADR content. NOT authorized
for code outside Phase 1 scope.

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
[Stub — fill from reframe spec §1 motivation, anchored on shape diversity not volume]

## 2. Locked v1 scope
[Stub — substrate-shaped locks: storage_provider abstraction day 1, polymorphic source_document_links, document_cases + document_case_sources, ProposedMutation + ProposedMutationBundle + ProposedAttachment, exception queue first-class, OCR engine + Python sidecar v1 deliverables behind DocumentArtifact contract]

## 3. Architecture overview
[Stub — Storage / Evidence Core → Document Core → Relationship Router → Intent Router → Domain handoff → Tier 1 commit]

## 4. Tier 1 / Tier 2 / Tier 2.5 / Tier 3 placement
[Stub — pending ADR-0007 amendment per Q66; preferred Tier 2.5 for Relationship Router]

## 5. Data model
[Stub — source_documents, source_document_versions, source_document_links, document_cases, document_case_sources, document_artifacts, document_classifications, document_relationship_candidates, ingest_batches, ingest_items, document_jobs]

## 6. Storage abstraction
[Stub — fill from reframe spec; carries forward the original AP brief §6]

## 7. Polymorphic source-document links — schema discipline
[Stub — closed enum for linked_entity_type, closed enum for link_role, (entity_type, role) pair-validity matrix, service-layer integrity validation, orphan/cascade behavior]

## 8. Relationship Router — three subsystems
[Stub — match-against-existing-state engine, ambiguity resolution, re-evaluation logic]

## 9. ProposedMutation / ProposedMutationBundle / ProposedAttachment
[Stub — fill from reframe spec §14; ProposedAttachment for no-ledger-effect attaches]

## 10. Document lifecycle immutability rules
[Stub — fill from reframe spec §16; ocr_runs immutable, extraction_runs immutable, candidates versioned, post-commit links require supersession]

## 11. Exception queue — first-class deliverable
[Stub — fill from reframe spec §10; document-type-aware actions, reclassification, bulk operations, screenshot gate]

## 12. Multi-entity reservation
[Stub — fill from reframe spec §17; legal_entity_id / paying_entity_id / benefiting_entity_id reservations]

## 13. Receipt v1 decision matrix
[Stub — fill from reframe spec §15; per-capability split]

## 14. Phase A acceptance criteria
[Stub — fill after AP/Spend Subdomain ADR ratifies]

## 15. Phase 0 prerequisites

Phase 0 closure verification (Session 2F, 2026-05-04) confirms all
prerequisites met. The verification artifact at
`docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`
documents the full 12-surface disposition.

**Eight Phase 0 ADRs ratified across six gates D1–D6:**

- **D1 (2026-05-03):** ADR-0007 amendment (three-tier agent
  architecture with Tier 2.5 Read-Only Ledger-Aware Path; Q66 closure
  via option (b) Tier 2.5).
- **D2 (2026-05-03):** ADR-0011 (Document Platform spine; entity
  ownership boundary; DOC invariant prefix reserved).
- **D3 (2026-05-03):** ADR-0012 (ProposedMutationBundle), ADR-0013
  (Storage Provider), ADR-0014 (Tier 2 Document Pipeline).
- **D4 (2026-05-04):** ADR-0015 (AP/Spend Subdomain), ADR-0016
  (Document Relationship Graph), ADR-0017 (Vendor Template Substrate)
  + post-D4 Cleanup Commits 1–7 + bank-detail amendment.
- **D5 (2026-05-04):** ADR-0018 (Relationship Router; Q56 closure).
- **D6 (2026-05-04):** ADR-0019 (Confidence Calibration Policy; Q57
  closure + Q73 confidence-threshold portion + Q65 ratification +
  ambiguity-margin ratification).

**Filed open questions Q53–Q79:** 25 closed (Q53–Q76 + Q78); 2 open
as Phase-1-implementation-gate or v1-ship-gate deferrals (Q77 v1-ship
matrix-ratification gate; Q79 INV-DOC-001 shape Phase-1-implementation
gate per substrate-now-enforcement-later pattern). See §17 below.

**Stream E dependent-artifact update state:**

- **E2 `agent_architecture_policy.md`** Q28 matrix expansion: ✓ DRAFTED
  (4 re-verification surfaces; Q77 ratification gates v1 ship).
- **E3 `phase_simplifications.md`** Simplification 3 footnote: ✓ CLEAN
  (2026-05-03 footnote operationalizes-not-amends framing).
- **E4 `0010-reserved-enum-states.md`** amendment: ✓ CLOSED via commit
  `797db40` (Variants A/B/C added per Phase 0 reserved-enum patterns).
- **E5 ADR README + INDEX.md** registration: ✓ CLEAN.
- **E1 `invariants.md`** DOC prefix registration: deferred per Q79
  path β to Phase 1 implementation onset (substrate-now-enforcement-later
  pattern; spec-without-enforcement-rule canonical convention honored).

**Post-D6 hygiene cleanup:** ADR-0018 14-line `ADR-0014 §6 → §7`
citation drift fixed via comprehensive cleanup at commit `e5965c3`.

## 16. ADRs this initiative produces
[Stub — Document Platform ADR (ADR-0011), ProposedMutationBundle ADR (ADR-0012), Storage Provider ADR (ADR-0013), Tier 2 Document Pipeline ADR (ADR-0014), Document Relationship Graph ADR (ADR-0016), Relationship Router ADR (ADR-0018), Confidence Calibration Policy ADR (ADR-0019) — seven Document-Platform-owned ADRs per Decision 7 of the Phase 0 plan]

## 17. Open questions

**Document-Platform-scope subset of Q53–Q79** (Spend-domain
questions Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78 belong to the
Spend Initiative brief):

**Closed at Phase 0 ratification (17 questions):**

- Q53 (document-type enum) — closed by ADR-0014 D3.
- Q54 (document case lifecycle states) — closed by ADR-0011 D2.
- Q55 (source_document_links pair validity matrix) — closed by
  ADR-0016 D4.
- Q56 (Relationship Router re-evaluation triggers) — closed by
  ADR-0018 D5.
- Q57 (confidence calibration governance) — closed by ADR-0019 D6.
- Q58 (ProposedMutationBundle atomicity) — closed by ADR-0012 D3.
- Q65 (per-document-type classifier thresholds) — ratified by
  ADR-0019 D6 at v1 ship + 6 months cadence.
- Q66 (Relationship Router tier placement) — closed by ADR-0007 D1
  via option (b) Tier 2.5.
- Q67 (bank_transactions / card_transactions ownership) — closed
  by ADR-0011 D2 (Domain Boundary Map).
- Q68 (exception queue UX) — closed by ADR-0011 D2 (resolution-
  action enum).
- Q69 (replayability of extraction) — closed by ADR-0014 D3.
- Q70 (OCR-layer idempotency) — closed by ADR-0014 D3.
- Q71 (classification strategy) — closed by ADR-0014 D3.
- Q72 (AI fallback contract) — closed by ADR-0014 D3.
- Q73 (per-org Document Platform configuration) — confidence-
  threshold portion closed by ADR-0019 D6 (Path γ system-fixed-
  only-at-v1 + per-org substrate reserved); other knobs closed by
  ADR-0011 / ADR-0013 / ADR-0014.
- Q75 (document case source cardinality) — closed by ADR-0011 D2.
- Q76 (re-evaluation policy immutability boundary) — closed by
  ADR-0011 §9 + ADR-0016 §6.

**Open at Phase 0 closure (2 questions, both deferred per
substrate-now-enforcement-later cross-pattern):**

- **Q77 (Q28 re-verification matrix expansion) — v1-ship-gate
  deferral.** Matrix drafted in
  `docs/02_specs/agent_architecture_policy.md` per ADR-0007
  amendment ratification. Ratification gates v1 ship, NOT Phase 1
  start. Q28 Ratification Tracker per Phase 0 plan Task Z1.5
  ensures visibility across Phase 1+ work.

- **Q79 (INV-DOC-001 shape / DOC prefix registration) — Phase-1-
  implementation-gate deferral.** ADR-0011 §15 reserved INV-DOC-001
  shape; Phase 0 closure verification check 6.6 confirmed DOC
  prefix NOT registered in `invariants.md`. Per Session 2F closure
  verification path β verdict (founder-locked 2026-05-04), Q79
  closure work TRIGGERS at Phase 1 (Storage / Evidence Core) code
  start when first DOC-citing code lands. The
  spec-without-enforcement-rule canonical convention in
  `invariants.md` is honored verbatim.

**Q29 ESLint rule design** is a sibling Phase-1-implementation-gate
deferral filed in `docs/02_specs/open_questions.md` (not a Q53–Q79
filing). ADR-0007 D1 SELECTED the ESLint mechanism; concrete design
deferred to Phase 1 implementation onset per Session 2F path β
verdict (founder-locked 2026-05-04). Same substrate-now-enforcement-
later cross-pattern as Q77 + Q79.

**The three-deferral cohort (Q29 + Q77 + Q79)** structurally
parallels ADR-0010 amendment Variant A (NULL-default forward-
compatible config-column reservation) — substrate ratified at
Phase 0; enforcement landing at Phase 1 implementation or v1 ship.

## 18. Friction-journal scope
[Stub — Document Platform arc placeholder name]

## 19. What this initiative does NOT do
[Stub — does not commit accounting state; does not own domain logic; does not change Authority Gradient / Agent Ladder / Two Laws / Service Communication Rules / existing invariants; does not edit AP/Spend brief content; does not generalize Document Core into a non-accounting document management system]

## 20. Verification against canonical docs
[Stub — fill after ADRs ratify; list every canonical doc verified per the original AP brief §18 precedent]

## 21. Review history

- **2026-05-03** — Skeleton drafted under Phase 0 governance plan Task B1. Sections 1–20 are stubs; final content fills in after Phase 0 ADRs ratify (Task B3 in subsequent session).
- **2026-05-04** — B3-Lite finalization at Phase 0 closure verification (Session 2F). Status header updated from Skeleton to Ratified-with-deferred-substantive-authoring per substrate-now-enforcement-later cross-pattern; §15 Phase 0 prerequisites filled; §17 Open questions filled with closure-state per question + Q29/Q77/Q79 Phase-1-implementation-gate deferral framing; §21 review history updated. Sections §1–§14, §16, §18–§20 remain stubs; substantive content fills alongside Phase 1 (Storage / Evidence Core) implementation work that consumes the corresponding ratified ADR content. NOT authorized for code outside Phase 1 scope.
