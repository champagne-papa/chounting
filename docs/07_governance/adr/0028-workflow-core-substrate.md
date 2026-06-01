---
id: "0028"
title: "Workflow Core Substrate — net-new general instance/event substrate, inert at Wave 1"
status: ratified
date: "2026-06-01"
deciders: [phil]
modules: [db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0011", "0020", "0030"]
invariants: []
---

# ADR-0028: Workflow Core Substrate

## Status

Ratified 2026-06-01 by CTO (V1 governance arc, Wave 1, reservation R4). Reserved by
the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4). Design
spec: `docs/09_briefs/v1/specs/2026-06-01-adr-0028-workflow-core-substrate-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0028-ratification-package.md`.

Substrate-reserve ADR. Reserves a net-new, general, **inert** workflow instance/event substrate
+ the `workflow_model.md` model doc. Introduces no live write, registers no invariant, ships no
migration in the ratification act (the Wave-1 build follows). Builds on the ratified engine
shape (Decision 4) and Layer-2.5 placement (Decision 3); re-litigates neither.

## Date

2026-06-01

## Triggered by

The V1 governance arc, Wave 1. The charter (§5) sequences Workflow Core substrate first among
the build waves and reserves it as R4: "child-workflow data model present; version-pin;
instance/event tables shaped for the learning substrate to read." This ADR lays those seams.

## Context

Workflow Core is **Layer 2.5** (Decision 3): it advances process state but cannot bypass
Services or write the ledger. It is net-new — the only prior reference is
`system_overview.md:23` ("Workflow Core (process engine, Layer 2.5 — net-new)"). The engine
*shape* is ratified (Decision 4): code-defined definitions, DB-backed instances, pinned
versions, idempotent service-only activities, explicit compensation, "first option; Temporal
later." The load-bearing consequence of "Temporal later" is **portability**: no homegrown-engine
semantics may leak into the data model, so a later Temporal swap is a runtime change, not a
substrate rewrite.

Three logs already exist and the substrate must not repurpose any of them:

- **`events`** (`supabase/migrations/20240101000000_initial_schema.sql:555-574`) — the domain-
  event **outbox** (`aggregate_id`/`aggregate_type`/`payload`); reserved (R5, "do not
  repurpose"; comment `:574` "Reserved seat. Nothing writes here until Phase 2."). **Not** the
  workflow execution log.
- **`audit_log`** — **mutation-grain** audit; `trace_id` join key (`idx_audit_org_trace
  (org_id, trace_id)`); append-only (`20240122000000_audit_log_append_only.sql`).
- **`rule_evaluation_log`** (`20240164000000_rule_evaluation_log.sql`) — **decision-grain**
  Logic Receipt (`effective_action action_type`; 4-value `disposition`); `trace_id` linkage.

The ingest pipeline (`document_cases` state machine + `document_jobs` work-queue) is the first
real multi-stage process, but `document_jobs` is structurally a **per-file ingest queue** —
three NOT-NULL FKs (`source_document_id → source_documents`, `document_case_id →
document_cases`, `ingest_batch_id → ingest_batches`) and an ingest state enum
(`document_job_state`). It is a future *consumer* of Workflow Core, not the substrate.

## Decision

**D-0028.1 — Net-new, general, INERT instance/event substrate.** Reserve `workflow_instances`
(`org_id`-scoped; `definition_key` + `definition_version` pin; `parent_instance_id` self-FK for
child-workflows, R4; `state` with a `v1-active` CHECK narrowed to a reserved value; `trace_id`;
`started_at`/`completed_at`; `created_at`/`created_by`; a reserved block of nullable
learning-readable columns deferred to the first migration — named and shaped there, not
pinned now) and `workflow_events` (append-only per-instance execution log;
`workflow_instance_id`; `sequence_number`; `event_type`; `activity_key`; `payload`; `ai_output`
for replay-honor; `trace_id`). Both ship empty and inert at Wave 1 (the `events`-table reserved-
seat pattern). `workflow_events` is distinct from the `events` outbox and from `audit_log`:
three logs, one `trace_id` correlation key, none subsuming another.

**D-0028.2 — `document_jobs` is out of scope as the instance table; the consumer seam is
reserved inert.** Adopting `document_jobs` would force dropping its ingest FKs (a destructive
retrofit) or leaking ingest semantics into the general engine (breaking the Decision-4
portability property). Instead, reserve — inert — only the additive relationship by which ingest
later becomes a consumer: a `document_jobs` run modeled as a child-run/activity a
`workflow_instance` references (R4). The mechanism is deferred to the consumer wave (see OQ-3 in
the ratification package).

**D-0028.3 — Code home `services/workflow/`; import-direction invariant.** Workflow Core lives
under `services/workflow/`. The ADR-0020 Appendix A import boundaries force this: `core/` may
import `shared/` only (so a Service-calling orchestrator cannot live in `core/`); `services/`
may not import `agent/`; `agent/` may import `services/`. The invariant, **live-enforced** by
`agent-first-import-boundaries` at `"error"` (`apps/web/eslint.config.mjs:119`): `agent/orchestrator/
→ services/workflow/ → other services`, **never the reverse**; `services/workflow/` **never
writes the ledger directly**, delegating posting to `services/accounting/`
(`journalEntryService.post()`), per Decision 3 + the Two Laws (control invariant 1). The existing
`agent/orchestrator/` is a caller on the agent side of the seam, not the home of Workflow Core.
The concrete module layout is deferred to the first consumer (ADR-0020 item-6 opportunistic
migration; "directories materialize as their first service is authored").

**D-0028.4 — Definitions are code-defined; `workflow_model.md` is the model doc.** No
`workflow_definitions` table — definitions live in `services/workflow/` code (Decision 4).
`docs/02_specs/workflow_model.md` (net-new) is the portable contract: the definition registry
shape; the idempotent, service-only **activity** contract (calls Services, retry-safe, never
writes the ledger); the **explicit compensation** contract (each activity names its compensating
action; encoded as a `workflow_events.event_type`); and the version-pin rule (instances pin
`definition_version`). It is authored as the full contract at Wave 1 (it is the one Wave-1
artifact with lasting value and what makes "Temporal later" a runtime swap).

**D-0028.5 — Gate output is `ActionType`/`Disposition` (no addendum).** Where a workflow records
a decision it uses the ratified `ActionType` contract (ADR-0030); the 5-value gate-disposition
vocabulary (`allow|deny|require_approval|require_more_evidence|queue_manual_review`) is a
semantic gloss, not a competing enum. This ADR does not open a gate-output addendum.

**D-0028.6 — Replay is honored, not authored.** The substrate honors control invariant 9
(deterministic skeleton byte-for-byte, `INV-RULE-002`; AI steps record outputs against frozen
inputs) via `workflow_events.ai_output` + the `definition_version` pin. The replay *definition*
is ADR-0034 (V2); this ADR authors no replay ADR.

**D-0028.7 — Sequencing.** The canonical evidence object (ADR-0033, Wave 2; general, not-AP-only;
extends INV-DOC-001) is a **prerequisite** before the AP Review consumer (Wave 6) — not a
co-traveler. The workflow-instance canvas is **off this arc's critical path**: a post-AP-Review,
observe-and-operate projection of the code-defined definitions; its docs draft in parallel and
ship last. ADR-0028 neither builds nor forecloses it.

**D-0028.8 — Reserved invariants, none registered.** `INV-WORKFLOW-002` (`workflow_events`
append-only), `INV-WORKFLOW-003` (Layer 2.5 never writes the ledger), and `INV-WORKFLOW-004`
(version-pin determinism) are named as candidate allocations and **registered by no one** at
Wave 1 (inert ⇒ no enforcement ⇒ register-on-enforcement rule, ADR-0021). `INV-WORKFLOW-001`
belongs to ADR-0031 (No-AI-Only-Paths); `INV-WORKFLOW-005` is reserved unallocated. The replay
invariant remains ADR-0034's.

## Consequences

- A general, portable workflow substrate exists, shaped for the learning read surface (R4),
  coupled to neither ingest, the evidence object, nor the AI layer. The "Temporal later" swap
  stays a runtime change.
- The three-log disambiguation protects the R5 `events` outbox; the import-direction invariant
  (live-enforced) prevents a backwards-wired seam.
- Two net-new tables ship empty with `v1-active` CHECKs; nothing exercises them until the first
  consumer wave — the deliberate reserved-seat cost, accepted to lay R4's seams now.
- Carried risk: a net-new instance table alongside `document_jobs` could become a silent fork
  if the consumer seam (D-0028.2) is not reserved; reserving it is the load-bearing mitigation.
- Doc surface: adds `docs/02_specs/workflow_model.md` and one `system_overview.md` reconcile
  row. No invariant-doc / control-matrix change (nothing registers).

## Alternatives considered

- **Adopt `document_jobs` as the instance table.** Rejected — it is a per-file ingest queue
  (three NOT-NULL ingest FKs); adoption is a destructive retrofit or a portability breach.
- **Reuse the `events` outbox as the execution log.** Rejected — R5 reserves `events` for the
  outbox emitter ("do not repurpose"); the grains differ (domain-event vs. execution-step).
- **A new top-level `src/workflow/` layer.** Rejected — Layer 2.5 is conceptual; the ADR-0020
  import boundaries already place the engine on the services side; a physical layer would add
  net-new lint rules for an inert substrate.
- **Build the engine runtime / retrofit live ingest now.** Rejected — Wave 1 is inert seams;
  the runtime and the first consumer are later waves.
- **Register INV-WORKFLOW-\* now.** Rejected — register-on-enforcement (ADR-0021); nothing
  enforces at Wave 1.

## Cross-references

- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter (Decisions 3/4; R4/R5;
  Wave plan; reserved invariant IDs).
- `docs/02_specs/workflow_model.md` — the model doc (net-new, this wave).
- `docs/03_architecture/folder-structure.md` / ADR-0020 — Appendix A import boundaries; the
  `services/` home.
- ADR-0030 — `ActionType` the one typed decision contract (gate output).
- ADR-0031 (reserved) — No-AI-Only-Paths; owns `INV-WORKFLOW-001`.
- ADR-0032 (reserved) — Canonical Autonomy Gate Seam (recording at V1).
- ADR-0033 (reserved) — Canonical Evidence Object Model (Wave 2; prerequisite before AP Review).
- ADR-0034 (reserved) — Replayability Two-Part Definition (V2; the replay definition this ADR honors).
- ADR-0011 — domain boundary map / document substrate (`document_cases`, `document_jobs`).
