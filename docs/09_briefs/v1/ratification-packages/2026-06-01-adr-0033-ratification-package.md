# ADR-0033 Ratification Package — Canonical Evidence Object Model

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-06-01.
**V1 plan reference:** Wave 2 (R3); Decision 8; ADR-0033 reserved in `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4.
**Design spec:** `docs/09_briefs/v1/specs/2026-06-01-adr-0033-canonical-evidence-object-model-design.md` (committed `48890d72`, read-back clean).
**Anchored at:** HEAD `48890d72` (branch `staging`), unpushed.
**Posture:** SUBSTRATE-RESERVE + read/assemble. The canonical evidence object is **net-new and
general** (a by-reference `evidence_objects` anchor); its table ships **INERT** (DDL, no
row-producer) while `services/evidence` assembles **transient** canonical objects from the live,
fragmented evidence substrate (OQ-2 = assemble-on-read). The live `billService.post` INV-DOC-001
gate is **untouched**. This package **ratifies and specifies**; it ships no migration and no code
— the Wave-2 build proceeds **against the ratified ADR**.

---

## 1. Summary

ADR-0033 reserves the **Canonical Evidence Object Model** (Wave 2, R3, Decision 8): a **net-new,
general, by-reference** `evidence_objects` anchor — one stable, addressable row per committed
posting, holding typed references to the existing fragmented evidence facets (`source_documents`,
`source_document_links`, `document_artifacts`, `rule_evaluation_log` / the partial Logic Receipt,
`audit_log`, `workflow_events`) threaded by `trace_id`. It **aggregates by reference, duplicates
nothing, moves nothing**, and is **general** (AP is one consumer; AP specifics ride a typed
extension).

Per the CTO-settled OQ-2, Wave 2 is **assemble-on-read**: the table ships **inert** (no
row-producer — the Wave-1 reserved-seat pattern), and `services/evidence` assembles **transient**
canonical objects from live references. The first live slice assembles from the **already-live**
bill evidence; the live `billService.post` INV-DOC-001 gate stays **as-is** (read/assemble, not
enforce). A general **`INV-EVIDENCE-001`** is named over an **untouched** INV-DOC-001 (its first
bill realization); **nothing is registered** (assembling ≠ enforcing ⇒ ADR-0021 ⇒ teeth at Wave
6). The decision facet (Logic Receipt) is **referenced, not subsumed** (ADR-0035, V2).

This package contains: the ratification ask (§2), the verified-against-disk grounding (§3), the
ADR-0033 body to land in `adr/` on ratification (§A), and the six OQ resolutions (§B).

## 2. Ratification ask

Ratify ADR-0033 as SUBSTRATE-RESERVE + read/assemble posture. On ratification:

1. The §A body lands at `docs/07_governance/adr/0033-canonical-evidence-object-model.md` with
   `status: ratified`, `date: <ratification date>`.
2. The six OQ resolutions (§B) bind the Wave-2 build: thin anchor spine + `trace_id` assembly +
   `jsonb` domain extension (OQ-1); **assemble-on-read — table inert, no row-producer, persistence
   deferred to Wave 6** (OQ-2); INV-EVIDENCE-001 enforcement-predicate wording deferred to Wave 6
   (OQ-3); module layout deferred to build (OQ-4); glossary reconcile at build (OQ-5);
   completeness **descriptive** at Wave 2, enforced at Wave 6 (OQ-6).
3. **The Wave-2 build proceeds against the ratified ADR** — the migration for the inert
   `evidence_objects` anchor; `core/evidence` (pure helpers) + `services/evidence` (assembly/read
   service) populated; the `glossary.md` evidence-object reconcile; the INV-DOC-001 prose reframe.
   **Not enacted in this package** (the ADR-0028/0029 precedent: the package ratifies; the build
   follows).
4. `pnpm adr:check` green; banks local on `staging`; pushes at retrospective close.

**Boundaries carried from the design-spec read-back:**

- **Read/assemble, never enforce-rewire.** The live `billService.post` INV-DOC-001 gate
  (`EVIDENCE_INCOMPLETE`, `billService.ts:290`) is untouched. The evidence object reads/assembles;
  it does not become the bill-commit enforcement. Enforcement lands at Wave 6.
- **Reference, don't subsume.** The decision facet (Logic Receipt) is referenced by id/`trace_id`;
  ADR-0035 (V2) owns first-class Logic Receipt. The slip-check (no "reference"→"subsume") held in
  the spec and must hold in the build.
- **Reserve, don't register.** `INV-EVIDENCE-001/002` are named, not registered (Wave-1 D-0028.8
  parity). The slip-check (no "reserve"→"register") held and must hold.
- **General, not AP-only.** The anchor spine is subject-polymorphic; AP specifics ride a typed
  extension — the object stays readable by V2 Track 4 / Track 7.4.

## 3. Grounding (verified against disk at HEAD `48890d72`)

| Claim | Verification |
|---|---|
| Glossary pre-defines the object (binding) | `docs/02_specs/glossary.md:148-158` — "canonical artifact … net-new for V1 … shaped general … extends … rather than duplicating … homes are empty reserved directories at V1" |
| INV-DOC-001 is live + bill-specific; the producer writes `primary_invoice` | `apps/web/src/services/spend/billService.ts:290` (`EVIDENCE_INCOMPLETE` gate), `:403-409` (`documentLinkService.create({linked_entity_type:'bill', link_role:'primary_invoice'})`); leaf `docs/02_specs/ledger_truth_model.md:3746-3776` (accepts `{primary_invoice, receipt}`) |
| `source_documents` = immutable hash anchor | `supabase/migrations/20240135000000_storage_substrate.sql:173` (`original_content_hash` / `original_storage_key` / `original_byte_size`, trigger-immutable) |
| `source_document_links` = polymorphic attachment | `20240147000000_source_document_links_substrate.sql:177` (`linked_entity_type` / `link_role` enums, ADR-0016) |
| `document_artifacts` = append-only extraction | `20240146000000_document_artifacts_substrate.sql:232` |
| `rule_evaluation_log` = decision record | `20240164000000_rule_evaluation_log.sql:95` (`evaluation_trace`, `effective_action`, `disposition`) |
| `workflow_events` (Wave 1) = inert; `trace_id` join | `20240171000000_workflow_core_substrate.sql` (ADR-0028, inert) |
| `core/evidence` + `services/evidence` empty placeholders | `apps/web/src/core/evidence/README.md` + `services/evidence/.gitkeep` |
| ADR-0035 (Logic Receipt first-class) is V2, not authored | `charter:110`; no `docs/07_governance/adr/0035-*.md` on disk |
| `INV-EVIDENCE-001/002` reserved-unregistered | `charter:120` (reserved IDs, register-on-enforcement) |
| Charter "populated" vs glossary "empty reserved at V1" | `charter:146` ("core/evidence + services/evidence populated") vs `glossary:157-158` — reconciled toward the charter (snapshot vs prescription); glossary line tightened at build (OQ-5) |

---

## §A — ADR-0033 body (lands in `adr/` on ratification)

> The frontmatter `status: ratified` and `date` take effect when the body moves to `adr/` at
> ratification, never before.

```markdown
---
id: "0033"
title: "Canonical Evidence Object Model — net-new general by-reference evidence object, read/assemble at Wave 2"
status: ratified
date: "<RATIFICATION_DATE>"
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

Ratified <RATIFICATION_DATE> by CTO (V1 governance arc, Wave 2, reservation R3, Decision 8).
Reserved by the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4). Design spec: `docs/09_briefs/v1/specs/2026-06-01-adr-0033-canonical-evidence-object-model-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0033-ratification-package.md`.

Substrate-reserve ADR. Reserves a net-new, general, by-reference canonical evidence object and the
`core/evidence` + `services/evidence` homes. Ships no migration in the ratification act (the Wave-2
build follows). Registers no invariant; touches no live gate.

## Date

<RATIFICATION_DATE>

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
```

---

## §B — Open-question resolutions (CTO direction, folded in)

Each resolution binds the Wave-2 build; the design spec (§8) is preserved as-authored.

- **OQ-1 — anchor spine + general-vs-extension.** **Endorse the spec rec.** Thin anchor (`id`,
  `org_id`, `subject_type`, `subject_id`, `trace_id`, `status`, `created_*`) + facets discovered by
  `trace_id`/subject + a `jsonb` domain extension for AP. Keeps AP off the general spine; pin
  exact columns at the first migration.
- **OQ-2 — producer + persisted-vs-assembled-on-read.** **Assemble-on-read.** The `evidence_objects`
  table ships **empty/inert** (DDL only, like the Wave-1 tables); `services/evidence` assembles
  **transient** canonical objects from live references; **no row-producer** at Wave 2. Persistence
  + the row-producer deferred to Wave 6 — dodging the historical-bill backfill. The "live producer"
  is the assembler reading live evidence, not a row-inserter. *(Most Wave-1-consistent.)*
- **OQ-3 — INV-EVIDENCE-001 wording.** **Defer to Wave 6.** The §6 naming is enough now; the
  enforcement predicate is authored when enforcement lands.
- **OQ-4 — module layout.** **Defer to build** (ADR-0020 item-6 opportunistic migration), as Wave 1.
- **OQ-5 — glossary reconcile wording.** **Build-stage.** The proposed line ("populated at Wave 2
  as a read/assembly surface; enforcement remains INV-DOC-001, generalized at Wave 6") is accepted.
- **OQ-6 — completeness semantics.** **Descriptive at Wave 2, enforced at Wave 6.** "Complete" is an
  assemble-time status at Wave 2; it gets teeth at Wave 6. Keep "complete" general — do not bake the
  bill slice into the general object's definition.

---

## 4. Source materials read during package drafting

- `docs/09_briefs/v1/specs/2026-06-01-adr-0033-canonical-evidence-object-model-design.md` (the
  design spec, read-back clean at `48890d72`).
- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §1–§6 (Decision 8; R3; Wave plan;
  reserved invariant IDs).
- `docs/02_specs/glossary.md:148-158` (binding pre-definition);
  `docs/02_specs/ledger_truth_model.md:3746-3776` (INV-DOC-001 leaf).
- `apps/web/src/services/spend/billService.ts:271,290,403-409` (the live gate + producer).
- Migrations `20240135000000` (`source_documents`), `20240147000000` (`source_document_links`),
  `20240146000000` (`document_artifacts`), `20240164000000` (`rule_evaluation_log`),
  `20240171000000` (`workflow_events`).
- `docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0028-ratification-package.md` (format
  exemplar).
