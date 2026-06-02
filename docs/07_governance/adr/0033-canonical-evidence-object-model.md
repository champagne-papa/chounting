---
id: "0033"
title: "Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2"
status: ratified
date: "2026-06-01"
deciders: [phil]
modules: [evidence, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0011", "0013", "0016", "0020", "0024", "0028"]
invariants: []
---

# ADR-0033: Canonical Evidence Object Model

## Status

Ratified 2026-06-01 by CTO (V1 governance arc, Wave 2, reservation R3, Decision 8).
Reserved by the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4). Design spec: `docs/09_briefs/v1/specs/2026-06-01-adr-0033-canonical-evidence-object-model-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0033-ratification-package.md`.

Substrate-reserve ADR. Reserves a net-new, general, by-reference canonical evidence object and the
`core/evidence` + `services/evidence` homes. Ships no migration in the ratification act (the Wave-2
build follows). Registers no invariant; touches no live gate.

## Date

2026-06-01

## Triggered by

The V1 governance arc, Wave 2. The charter (§5) sequences the canonical evidence object model as
the gating prerequisite before the Wave-6 AP Review consumer (R3; ADR-0028 D-0028.7). Evidence is
already shipping but fragmented across five+ tables; this ADR reserves the single canonical object
that synthesizes them.

## Context

A committed AP bill today already carries evidence, spread across tables threaded by `trace_id`:
the document/file anchor (`source_documents`, immutable `original_content_hash`, ADR-0011 §2); the
attachment (`source_document_links`, polymorphic `link_role`, ADR-0016); extraction
(`document_artifacts`, append-only); the decision (`rule_evaluation_log.evaluation_trace` + the
partial Logic Receipt `ProposalJustificationSchema`); the approver/actor (`audit_log`); and the
inert Wave-1 execution log (`workflow_events`). No single canonical object exists.

The glossary pre-defines the object (`docs/02_specs/glossary.md:148-158`): "the canonical artifact
a committed AP posting hangs its evidence off … replacing today's fragmentation … net-new for V1
(reserved ADR-0033); shaped general (not AP-only) … extends the existing `billService.post`
evidence-completeness gate (INV-DOC-001) rather than duplicating it." This ADR honors that
definition.

INV-DOC-001 is **live** and bill-specific (`ledger_truth_model.md:3746`): a committed bill needs ≥1
`source_document_links` row with `link_role ∈ {primary_invoice, receipt}` unless
`override_evidence_completeness=true`; Layer-2 check at `billService.post()`. Precision: the leaf
*accepts* `{primary_invoice, receipt}`, but the live producer path, given `primary_document_id`,
writes `link_role='primary_invoice'` (`billService.ts:403-409`).

## Decision

**D-0033.1 — Net-new, general, by-reference `evidence_objects` anchor; INERT at Wave 2.** A
net-new anchor table — one stable, addressable row per committed posting (subject-polymorphic:
`subject_type` / `subject_id`; `org_id`; `trace_id`; `status`; `created_*`; a typed
`domain_extension` for per-domain specifics) holding typed **references** to the fragmented facets.
It aggregates by reference; it duplicates and moves nothing. The table ships at Wave 2 but
**inert** — **no row-producer** (the `events`/`workflow_*` reserved-seat pattern). Rejected:
generalizing an ingest-specific table (`source_documents` / `document_cases`) — couples the general
object to ingest (the Wave-1 spine trap); a view/projection — V2 learners need a stable addressable
identity a view cannot give.

**D-0033.2 — General shape: generic reference-chain core + typed domain extension.** The anchor
spine is general (subject + `trace_id` + the reference-chain). AP is one consumer: AP-specific
evidence (invoice/statement/receipt particulars) rides the typed `domain_extension`, never the
spine — so V2 Track 4 (workflow learning) + Track 7.4 (first-class Logic Receipts) read the object
without V1 AP assumptions. Exact spine columns + flat-vs-extension pinned at the first migration.

**D-0033.3 — Posture: populate, read/assemble; the live INV-DOC-001 gate untouched.** Wave 2
populates `core/evidence` (pure helpers — hashing, completeness validation) + `services/evidence`
(the assembly/read service that produces a canonical evidence object by following references). Per
OQ-2 the posture is **assemble-on-read**: the service assembles a **transient** canonical object
from live references; **no `evidence_objects` rows are written** at Wave 2 (persistence + the
row-producer deferred to Wave 6 — which dodges the historical-bill backfill question). The first
live slice assembles from the **already-live** bill evidence (`source_documents` ←
`source_document_links` → bill, plus the trace). The live `billService.post` INV-DOC-001 gate
(`EVIDENCE_INCOMPLETE`) stays **exactly as-is** — read/assemble, not enforce; the spec does not
rewire a live, financial-finality-adjacent gate for an unfinalized generalization.

**D-0033.4 — INV-DOC-001: generalize in prose, don't restructure; register nothing.** Name a
general, evidence-native **`INV-EVIDENCE-001`** ("every committed AP posting carries a complete
evidence bundle on one canonical evidence object"); leave the **live INV-DOC-001 untouched**,
reframed *in prose* as `INV-EVIDENCE-001`'s **first bill realization**. Do not broaden the live
INV-DOC-001 leaf in place. Under the read/assemble posture the object **assembles**, it does not
**reject a commit** — assembling ≠ enforcing ⇒ ADR-0021 register-on-enforcement ⇒
`INV-EVIDENCE-001` stays **reserved-unregistered**, registered at **Wave 6** (Wave-1 D-0028.8
parity).

**D-0033.5 — Decision facet: reference, don't subsume.** The evidence object holds a typed
reference (id / `trace_id`) to the decision record (`rule_evaluation_log` / the partial Logic
Receipt); it does not absorb or redefine the Logic Receipt. **ADR-0035 (V2)** owns first-class
Logic Receipt; when it lands, the object's reference stays valid while the referenced thing grows —
no ADR-0033 rework.

**D-0033.6 — Correlation by `trace_id`; subsume nothing.** The object references the facets — and
joins `audit_log` / `workflow_events` — by `trace_id`, the established universal correlation key,
plus reference-by-id where a stable child identity exists. The evidence object references the
facets; it subsumes none (the Wave-1 "three logs, one `trace_id`, none subsuming another"
discipline).

**D-0033.7 — Sequencing.** Prerequisite before AP Review (Wave 6), not co-traveler (ADR-0028
D-0028.7). Enforcement (`INV-EVIDENCE-001` with teeth; persistence; the row-producer; the object
*required* for commit) lands at Wave 6, where the general shape is final. ADR-0035 (V2) owns the
Logic Receipt (referenced, not pre-empted). ADR-0011/0013/0016 own the document/storage/link
substrate the object references. The `glossary.md:157-158` "empty reserved directories at V1" line
is reconciled at the build to "populated at Wave 2 as a read/assembly surface; enforcement remains
INV-DOC-001, generalized at Wave 6".

**D-0033.8 — Reserved invariants, none registered.** `INV-EVIDENCE-001` (evidence-native) is named;
`INV-EVIDENCE-002` is reserved unallocated; **registered by no one** at Wave 2 (read/assemble ⇒ no
enforcement). INV-DOC-001 remains the live, registered bill-evidence invariant — untouched.

## Consequences

- One canonical, addressable, general evidence object replaces the five-table fragmentation by
  reference; V2 Track 4 / Track 7.4 read it without AP assumptions; the live bill gate is untouched;
  nothing is duplicated or moved.
- Wave 2 ships real (not dead) code — an assembly service with a live data source (bill evidence) —
  but writes no rows and makes the object load-bearing for nothing; persistence, the row-producer,
  and enforcement are Wave 6. The historical-bill backfill question is dodged until then.
- Carried risk: an assembler must not drift from the live INV-DOC-001 truth; mitigation is leaving
  INV-DOC-001 the single enforcement and having the object *read* it, not re-implement it.
- Doc surface: adds the ADR + reconciles the `glossary.md` evidence-object line + reframes
  INV-DOC-001 in prose. No invariant-doc registration.

## Alternatives considered

- **Generalize an existing table** as the evidence object. Rejected — `source_documents` /
  `document_cases` are ingest/AP-pipeline-specific; adoption couples the general object to ingest.
- **View/projection only.** Rejected — V2 learners need a stable addressable identity; a view
  gives no addressable row.
- **Subsume the Logic Receipt inline.** Rejected — pre-empts ADR-0035 (V2); welds the object to the
  current partial Logic-Receipt shape.
- **Enforce at Wave 2 (rewire `billService.post`).** Rejected — touches a live, financial-finality-
  adjacent gate for an unfinalized generalization; enforcement belongs at Wave 6.
- **Register INV-EVIDENCE-001 now.** Rejected — register-on-enforcement (ADR-0021); read/assemble
  enforces nothing at Wave 2.

## Cross-references

- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter (Decision 8; R3; Wave plan;
  reserved invariant IDs).
- `docs/02_specs/glossary.md` — the binding "Evidence object" pre-definition (reconciled at build).
- `docs/02_specs/ledger_truth_model.md` — INV-DOC-001 leaf (untouched; reframed in prose).
- ADR-0011 — Document Platform (`source_documents` evidence anchor §2).
- ADR-0013 — Storage Provider (evidence bytes / integrity).
- ADR-0016 — document relationship graph (`source_document_links` polymorphic spine).
- ADR-0020 — folder structure / import boundaries (`core/evidence` + `services/evidence` homes).
- ADR-0024 — `rule_evaluation_log` (the decision facet referenced).
- ADR-0028 — Workflow Core Substrate (`workflow_events`, `trace_id` join).
- ADR-0035 (reserved) — Logic Receipt first-class (V2; referenced, not subsumed).
