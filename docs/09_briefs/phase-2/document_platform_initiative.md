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
[Stub — eight ADRs from reframe spec §7; 26 open questions Q53–Q78; four dependent-artifact updates]

## 16. ADRs this initiative produces
[Stub — Document Platform ADR (ADR-0011), Storage Provider ADR (ADR-0013), Tier 2 Document Pipeline ADR (ADR-0014), ProposedMutationBundle ADR (ADR-0012), Document Relationship Graph ADR (ADR-0016), Relationship Router ADR (ADR-0018), Confidence Calibration Policy ADR (ADR-0019) — seven Document-Platform-owned ADRs per Decision 7 of the Phase 0 plan]

## 17. Open questions (Q53–Q78 filed in open_questions.md)
[Stub — list per reframe spec §13. Document-Platform-scope subset: Q53, Q54, Q55, Q56, Q57, Q58, Q65, Q66, Q67, Q68, Q69, Q70, Q71, Q72, Q73, Q75, Q76, Q77 (Spend-domain questions Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78 belong to the Spend brief)]

## 18. Friction-journal scope
[Stub — Document Platform arc placeholder name]

## 19. What this initiative does NOT do
[Stub — does not commit accounting state; does not own domain logic; does not change Authority Gradient / Agent Ladder / Two Laws / Service Communication Rules / existing invariants; does not edit AP/Spend brief content; does not generalize Document Core into a non-accounting document management system]

## 20. Verification against canonical docs
[Stub — fill after ADRs ratify; list every canonical doc verified per the original AP brief §18 precedent]

## 21. Review history

- **2026-05-03** — Skeleton drafted under Phase 0 governance plan Task B1. Sections 1–20 are stubs; final content fills in after Phase 0 ADRs ratify (Task B3 in Session 3).
