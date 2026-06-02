# ADR-0033 — Canonical Evidence Object Model — Design Spec

**Status:** DRAFT for review · 2026-06-01 · pre-ratification design spec (lifecycle stage 1
of 3: `specs/` → `ratification-packages/` → ratified ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0033 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4, Wave 2, reservation R3; Decision 8).
**Anchored at:** HEAD `b30c5ae0` (branch `staging`).
**Posture:** the canonical evidence object is **net-new and general** (a by-reference anchor),
**populated at Wave 2 in a read/assemble posture** — it *assembles* a canonical evidence object
from the already-live, fragmented evidence substrate; it does **not** rewire the live
`billService.post` INV-DOC-001 gate. Reserves and shapes; authors no ADR body, ships no
migration, registers no invariant. Four structural forks were settled by the CTO at spec-onset
(§2–§3); residual shape choices are carried as open questions (§8) for the ratification package.

> **What stays OPEN here.** Exact column set of the anchor (thin-anchor + trace_id assembly vs.
> explicit reference columns), the anchor producer wiring, and the persisted-vs-assembled-on-read
> question are §8 OQs, decided at the first migration. The macro-spine (form / posture / invariant
> relationship / decision-facet boundary) is settled and recorded as closed.

---

## 0. What this ADR does (and does not do)

- **Does:** reserve a **net-new, general, by-reference** canonical evidence object
  (`evidence_objects` anchor — one stable, addressable row per committed posting, holding typed
  references to the existing fragmented substrate) + the `core/evidence` (pure helpers) and
  `services/evidence` (assembly/read service) homes the charter says Wave 2 populates. Names a
  general **`INV-EVIDENCE-001`** over an untouched **INV-DOC-001** (its first bill realization).
  Establishes the Wave-2 **read/assemble** posture and the first live slice (assemble from live
  bill evidence).
- **Does NOT:** generalize an ingest-specific table into the evidence object (the Wave-1 spine
  trap); rewire or restructure the **live** `billService.post` INV-DOC-001 gate (read/assemble,
  not enforce); **subsume** the Logic Receipt (that is **ADR-0035, V2** — referenced, not
  absorbed); register any invariant (assembling ≠ enforcing ⇒ ADR-0021 register-on-enforcement ⇒
  `INV-EVIDENCE-001` stays reserved, teeth at Wave 6); author the AP-specific evidence shape as
  the object's spine (AP is one consumer).

---

## 1. Context — already-shipping-but-fragmented evidence

A committed AP bill today already carries evidence, **spread across five+ tables threaded by
`trace_id`** (no single canonical object):

| Facet | Lives in | Note |
|---|---|---|
| **Document / file** | `source_documents` (`supabase/migrations/20240135000000_storage_substrate.sql:173`) | Immutable anchor: `original_content_hash` / `original_storage_key` / `original_byte_size` (trigger-immutable post-ingestion); ADR-0011 §2 "evidence anchor". |
| **Attachment** | `source_document_links` (`20240147000000_source_document_links_substrate.sql:177`) | Polymorphic `linked_entity_type` / `link_role` enums (ADR-0016). The bill↔document link. |
| **Extraction** | `document_artifacts` (`20240146000000_document_artifacts_substrate.sql:232`) | Append-only OCR/extraction output. |
| **Decision** | `rule_evaluation_log` (`20240164000000_rule_evaluation_log.sql:95`) + the partial Logic Receipt `ProposalJustificationSchema` (`shared/schemas/accounting/proposalJustification.schema.ts`) | `evaluation_trace`, `effective_action`, `disposition`. |
| **Approval / actor** | `audit_log` (`trace_id` join, `idx_audit_org_trace`) | Mutation-grain actor/approver record. |
| **Execution** | `workflow_events` (`20240171000000`, INERT) | Wave-1 substrate; `trace_id` join; no writer yet. |

**The glossary already pre-defines the object** (binding — the spec cannot contradict it),
`docs/02_specs/glossary.md:148-158`:
> "The canonical artifact a committed AP posting hangs its evidence off — source document,
> extraction, decision, approver, receipt — **replacing today's fragmentation** across
> `proposedAttachment`, `document_cases`, `source_document_links`, audit rows, and the partial
> Logic Receipt. **Net-new for V1** (reserved ADR-0033); shaped **general (not AP-only)** so V2
> workflow-learning and first-class Logic Receipts can read it. **Extends** the existing
> `billService.post` evidence-completeness gate (INV-DOC-001) **rather than duplicating** it. The
> `core/evidence/` + `services/evidence/` homes are empty reserved directories at V1."

**INV-DOC-001 is live and bill-specific** (`docs/02_specs/ledger_truth_model.md:3746-3776`;
registered `invariants.md:144`): every committed bill needs ≥1 `source_document_links` row with
`link_role ∈ {primary_invoice, receipt}` unless `override_evidence_completeness=true`; Layer-2
check at `billService.post()`. **Precision (verified at `billService.ts:290,403-409`):** the leaf
*accepts* `{primary_invoice, receipt}`, but the live `post()` **producer** path, when given
`primary_document_id`, writes `link_role='primary_invoice'` specifically. The spec must not
overstate what the live gate produces.

`core/evidence/` and `services/evidence/` are **empty placeholders** today (`.gitkeep` /
README only). `INV-EVIDENCE-001..002` are reserved-unregistered (`charter:120`).

---

## 2. Decision (CTO-settled) — net-new by-reference object, read/assemble posture

### 2.1 Form (Fork 1, settled): net-new by-reference anchor table

The canonical evidence object is a **net-new `evidence_objects` anchor table**: one stable,
addressable row per committed posting, holding typed **references** (by id / `trace_id`) to the
existing fragmented facets (§1) — it **aggregates by reference, duplicates nothing, moves
nothing**. The glossary is decisive: "net-new", "hangs evidence off" the existing sources,
"replacing fragmentation", "extends rather than duplicating".

- **Rejected — generalize an existing table** (`source_documents` / `document_cases`): those are
  ingest/AP-pipeline-specific; adopting one couples the general object to ingest — the exact
  Wave-1 `document_jobs` spine trap.
- **Rejected — view/projection only:** V2 learners (Track 4 / Track 7.4) need a **stable
  addressable identity** to anchor references on; a view gives no addressable row. "Object" wants
  a row, not a query.

### 2.2 General shape: generic reference-chain core + typed domain extension

The anchor's spine is **general** — a subject (`subject_type` / `subject_id`), `org_id`,
`trace_id`, and the reference-chain to the facets. **AP is one consumer**: AP-specific evidence
(invoice/statement/receipt particulars) rides a typed **domain extension** (e.g. a
`domain_extension jsonb` or a typed sidecar), never the spine. This keeps the object readable by
V2 workflow-learning + first-class Logic Receipts without V1 AP assumptions baked in. *(Exact
spine columns + flat-vs-extension = §8 OQ-1.)*

### 2.3 Posture (Fork 2, settled): populate — read/assemble, INV-DOC-001 gate untouched

Wave 2 **populates** `core/evidence` (pure helpers — hashing, completeness validation) +
`services/evidence` (the **assembly/read** service that produces a canonical evidence object by
following references), and realizes a **first live slice**: the service *assembles* a canonical
evidence object from the **already-live bill evidence** (`source_documents` ←
`source_document_links` → bill, plus the trace). This resolves the charter-vs-glossary tension
toward the charter's "populated" (`charter:146`) — exploiting the **asymmetry** with Wave 1: Wave
1's workflow substrate had no possible producer until Wave 6 (forced inert), but Wave 2 has a
**live evidence source today**, so there is real evidence to assemble (not dead code).

**Read/assemble, NOT enforce.** The live `billService.post` INV-DOC-001 gate (`EVIDENCE_INCOMPLETE`,
`billService.ts:290`) stays **exactly as-is** — the spec does not rewire a live, financial-finality-
adjacent gate for an unfinalized generalization. The evidence object **reads/assembles**; it does
not become the enforcement. Enforcement (the object *required* for commit) lands at the Wave-6 AP
Review consumer, where the general shape is final. *(The glossary's "empty reserved at V1" is a
Wave-0 snapshot, not a throughout-V1 posture; it is reconciled in this arc — §5 / §7.)*

### 2.4 Decision facet (Fork 4, settled): reference, don't subsume

The "decision" facet is the **partial Logic Receipt** (`rule_evaluation_log` /
`ProposalJustificationSchema`). The evidence object holds a **typed reference** (id / `trace_id`)
to it; it does **not** absorb or redefine the Logic Receipt. **ADR-0035 (V2)** owns first-class
Logic Receipt. When ADR-0035 makes it first-class, the object's reference stays valid while the
referenced thing grows — no ADR-0033 rework. This is the Wave-1 "three logs, one `trace_id`, none
subsuming another" discipline applied to the decision facet.

### 2.5 Correlation: `trace_id` join (grounded default, not a fork)

The object references the facets — and joins `audit_log` / `workflow_events` — by **`trace_id`**,
the established universal correlation key (already threading `source_documents` / document tables /
`rule_evaluation_log` / `audit_log` / `workflow_events`). No new FK web; reference-by-id where a
stable child identity exists, `trace_id` for the correlation envelope.

---

## 3. INV-DOC-001 relationship + INV-EVIDENCE-001 (Fork 3, settled — reserve, none registered)

- **Relationship — generalize, don't restructure.** Name a general, evidence-native
  **`INV-EVIDENCE-001`** ("every committed AP posting carries a complete evidence bundle on one
  canonical evidence object"); leave the **live INV-DOC-001 untouched**, reframed *in prose* as
  `INV-EVIDENCE-001`'s **first bill realization**. Do not broaden the live INV-DOC-001 leaf in
  place (that restructures a working invariant and muddies the clean bill slice). This is the
  charter's "extends INV-DOC-001 (`INV-EVIDENCE-001`)" + the glossary's "extends rather than
  duplicating".
- **Registration — none at Wave 2.** Under the read/assemble posture (§2.3) the object
  **assembles**, it does not **reject a commit**. Assembling ≠ enforcing ⇒ ADR-0021
  register-on-enforcement ⇒ `INV-EVIDENCE-001` stays **reserved-unregistered**, registered at
  **Wave 6** when the AP posting path actually requires a complete evidence object. This is exact
  Wave-1 parity (ADR-0028 D-0028.8: `INV-WORKFLOW-002/003/004` stayed reserved though the substrate
  landed). `INV-EVIDENCE-002` stays reserved unallocated.

---

## 4. Code home & layer placement

`core/evidence/` — **pure** evidence helpers (hashing, metadata/completeness validation); imports
`shared/` only (ADR-0020 Appendix A). `services/evidence/` — the **assembly/read service** (Layer
2): reads the facets through the existing services / `db`, assembles the canonical object, **never
writes the ledger**. Both homes exist empty today; Wave 2 populates them (§2.3). The import-
direction is the standard service-layer shape (`services/` may import `core|db|contracts|shared`,
not `agent/`); the assembly service is a reader, callable by higher layers. *(Concrete module
layout = §8 OQ-4, deferred to the build.)*

---

## 5. Sequencing

- **Prerequisite before AP Review (Wave 6), not co-traveler** (ADR-0028 D-0028.7; `charter §5`).
  ADR-0033 lands at Wave 2; **enforcement** (`INV-EVIDENCE-001` with teeth; the object *required*
  for commit) lands at Wave 6 where the general shape is final.
- **ADR-0035 (V2)** owns first-class Logic Receipt — referenced, not pre-empted (§2.4).
- **ADR-0028 (Wave 1)** workflow substrate is referenced by `trace_id` (inert today).
- **ADR-0011 / ADR-0013** own the document-platform / storage substrate the object references
  (`source_documents` = ADR-0011 §2 anchor; storage integrity = ADR-0013); ADR-0033 references
  them, does not redefine them.
- **Glossary reconcile (this arc, at build):** the `glossary.md:157-158` line "empty reserved
  directories at V1" → "populated at Wave 2 as a read/assembly surface; enforcement remains
  INV-DOC-001, generalized at Wave 6." Whichever doc was the looser snapshot is tightened so the
  charter and glossary agree (parallels the Wave-1 `system_overview` reconcile row, executed at
  the build stage).

---

## 6. Reserved invariant IDs (named; none registered)

`INV-EVIDENCE-001` (evidence-native: committed AP posting carries a complete evidence bundle on
one canonical object) and `INV-EVIDENCE-002` (reserved unallocated) are **named, registered by no
one** at Wave 2 (read/assemble ⇒ no enforcement ⇒ register-on-enforcement, ADR-0021). INV-DOC-001
remains the live, registered bill-evidence invariant — untouched, reframed in prose only.

---

## 7. Consequences

- **Positive:** one canonical, addressable, general evidence object replaces the five-table
  fragmentation by reference; V2 Track 4 / Track 7.4 can read it without AP assumptions; the live
  bill gate is untouched; nothing is duplicated or moved.
- **Read/assemble cost:** Wave 2 ships real (not dead) code — an assembly service with a live data
  source (bill evidence) — but does **not** yet make the object load-bearing for commit; that is
  Wave 6. The anchor table's producer wiring and persisted-vs-read-through shape are deliberately
  left open (§8) rather than over-specified ahead of the Wave-6 consumer.
- **Carried risk:** an anchor that assembles by reference must not drift from the live
  INV-DOC-001 truth; the mitigation is leaving INV-DOC-001 as the single enforcement and having the
  object *read* it, not re-implement it.
- **Doc surface:** adds the ADR + reconciles the `glossary.md` evidence-object line; reframes
  INV-DOC-001 in prose as the first `INV-EVIDENCE-001` realization. No invariant-doc registration
  (nothing enforces).

---

## 8. Open questions for the ADR body / reviewer

- **OQ-1 — anchor spine columns + general-vs-extension.** Thin anchor (`id`, `org_id`,
  `subject_type`, `subject_id`, `trace_id`, `status`, `created_*`) + facets discovered by
  `trace_id`/subject, **vs.** explicit reference columns per facet. Plus: AP specifics on a
  `domain_extension jsonb` vs. a typed sidecar. Recommendation: thin anchor + `trace_id` assembly +
  `jsonb` extension; pin at the first migration.
- **OQ-2 — anchor producer + persisted-vs-assembled-on-read.** Who writes the `evidence_objects`
  row (a separate evidence-assembly path — **never** `billService.post`, which stays untouched), and
  is the anchor persisted at Wave 2 or assembled on read with persistence deferred to Wave 6?
- **OQ-3 — `INV-EVIDENCE-001` wording** for the eventual registration (the Wave-6 enforcement
  predicate) — named now, registered then.
- **OQ-4 — `services/evidence` / `core/evidence` module layout** — deferred to the build (ADR-0020
  item-6 opportunistic migration), as in Wave 1.
- **OQ-5 — glossary reconcile wording** — the exact tightened `glossary.md` line (charter vs.
  snapshot), applied at the build stage.
- **OQ-6 — completeness semantics** — what "complete" means for the general object beyond the bill
  slice (extraction present? decision present?), and whether that is descriptive (assemble-time
  status) at Wave 2 vs. enforced at Wave 6.

---

## 9. Lifecycle next steps (not this spec)

1. CTO read-back of this design spec (verify-against-disk) → resolve OQ-1..OQ-6 direction.
2. **Ratification package** under `docs/09_briefs/v1/ratification-packages/` enacting ADR-0033 (the
   ADR body; the first migration for `evidence_objects`; `core/evidence` + `services/evidence`
   population; the glossary reconcile; INV-DOC-001 prose reframe).
3. Ratified **ADR-0033** lands in `docs/07_governance/adr/`.
4. Design spec preserved as historical context (per ADR README §"Pre-ratification design specs").

This spec **reserves and shapes**; it authors no ADR body, builds no service, registers no
invariant, and touches no live gate. No commit until the read-back clears.
