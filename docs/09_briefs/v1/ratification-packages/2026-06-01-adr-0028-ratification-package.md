# ADR-0028 Ratification Package — Workflow Core Substrate

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-06-01.
**V1 plan reference:** Wave 1 (R4); ADR-0028 reserved in `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4.
**Design spec:** `docs/09_briefs/v1/specs/2026-06-01-adr-0028-workflow-core-substrate-design.md` (committed `b43bed4d`, read-back clean).
**Anchored at:** HEAD `b43bed4d` (branch `staging`), unpushed.
**Posture:** SUBSTRATE-RESERVE — net-new general workflow substrate, **INERT** at Wave 1. The
decision content (§0–§9 of the design spec) is ratified as the ADR body in §A below, with the
six design-spec open questions resolved per CTO direction (§B). This package **ratifies and
specifies**; it ships no migration and no code — the Wave-1 build (migration + `workflow_model.md`
+ `system_overview.md` reconcile) proceeds **against the ratified ADR**, not in this package.

---

## 1. Summary

ADR-0028 reserves the **Workflow Core Substrate** (Layer 2.5, Decision 3): a **net-new,
general, INERT** instance/event substrate — `workflow_instances` (DB-backed instances; pinned
`definition_version`; `parent_instance_id` child-workflow linkage) + `workflow_events`
(append-only per-instance execution log; records AI-step outputs against frozen inputs for
replay-honor) — plus the `trace_id` audit join and the `workflow_model.md` model doc. The
engine *shape* is **already ratified** (Decision 4: code-defined defs · DB-backed instances ·
pinned versions · idempotent service-only activities · explicit compensation; "first option;
Temporal later"); this ADR builds on it without re-litigating build-vs-adopt.

The substrate is general — **not** an adoption of the ingest pipeline's `document_jobs`
(structurally a per-file ingest queue, §3). It registers **no invariant** (inert ⇒ no
enforcement), introduces no live writes, and explicitly defers exact columns, the ingest
consumer-seam mechanism, and the compensation encoding to the first migration (§B).

This package contains: the ratification ask (§2), the verified-against-disk grounding (§3), the
ADR-0028 body to land in `adr/` on ratification (§A), and the six OQ resolutions folding in CTO
direction (§B).

## 2. Ratification ask

Ratify ADR-0028 as SUBSTRATE-RESERVE posture. On ratification:

1. The §A body lands at `docs/07_governance/adr/0028-workflow-core-substrate.md` with
   `status: ratified`, `date: <ratification date>`.
2. The six OQ resolutions (§B) bind the Wave-1 build: §2.1/§2.2 table shapes as the
   recommendation with the reserved learning columns deferred to the first migration (OQ-1); INV-WORKFLOW
   `002`/`003`/`004` candidate allocation, `001`→ADR-0031, **register none** (OQ-2); ingest
   consumer-seam relationship reserved inert, mechanism deferred (OQ-3); compensation encoded as
   a `workflow_events.event_type` (OQ-4); `workflow_model.md` authored as the **full** portable
   contract (OQ-6).
3. **The Wave-1 build proceeds against the ratified ADR** — the first migration
   (`workflow_instances` + `workflow_events` + append-only triggers + RLS-through-org, all
   `v1-active`-CHECK narrowed to reserved/inert), `docs/02_specs/workflow_model.md`, and the
   `system_overview.md` Layer-2.5 reconcile row. **Not enacted in this package** (matches the
   ADR-0029 precedent: the package ratifies; the build follows).
4. `pnpm adr:check` green; banks local on `staging`; pushes at retrospective close.

**Boundaries carried from the design-spec read-back:**

- **Inert means inert.** No table is written live at Wave 1; the `events`-table reserved-seat
  pattern (`initial_schema.sql:555-574`) is the model. The first *consumer* (and the first live
  write) is a later wave, not this one.
- **`document_jobs` stays ingest's.** ADR-0028 declares it out of scope as the instance table
  and reserves — inert — only the additive *consumer relationship* (a `document_jobs` run as a
  child-run/activity a `workflow_instance` references). The mechanism is **not** chosen now
  (OQ-3); choosing it would repeat the over-specification avoided on the code-home fork.
- **Settled decisions stay settled.** Gate output is `ActionType`/`Disposition` (ADR-0030); this
  ADR does not reopen a gate-output addendum. Replay is ADR-0034 (V2); this ADR honors invariant
  9, it does not author replay.

## 3. Grounding (verified against disk at HEAD `b43bed4d`)

| Claim | Verification |
|---|---|
| Layer 2.5 is ratified; engine shape is ratified | charter §3 Decision 3 (Layer 2.5; cannot bypass Services or write ledger) + Decision 4 (engine shape; "first option; Temporal later") |
| Workflow Core is net-new on disk | `system_overview.md:23` "Workflow Core (process engine, Layer 2.5 — net-new)"; ADR-0030 spec `:44` "Workflow Routing — net-new — reserved for ADR-0028 … Nothing on disk today" |
| `events` is the R5 outbox, do-not-repurpose | `supabase/migrations/20240101000000_initial_schema.sql:555-574` (`CREATE TABLE events`, `aggregate_id`/`aggregate_type`/`payload`); trailing comment `:574` "Reserved seat. Nothing writes here until Phase 2." |
| `audit_log` is the mutation-grain join (`trace_id`) | `initial_schema.sql` `CREATE TABLE audit_log` + `idx_audit_org_trace (org_id, trace_id)`; append-only since `20240122000000_audit_log_append_only.sql` |
| `rule_evaluation_log` is decision-grain, not execution | `20240164000000_rule_evaluation_log.sql:105` `effective_action action_type NULL`; `:107-108` `disposition … IN ('auto_posted','routed','blocked','pending')` |
| `document_jobs` is a per-file ingest queue, not a general instance table | `20240152000000_ingestion_substrate.sql` `CREATE TABLE document_jobs`: `source_document_id NOT NULL REFERENCES source_documents(id)`, `document_case_id NOT NULL REFERENCES document_cases(id)`, `ingest_batch_id NOT NULL REFERENCES ingest_batches(id)` + `state document_job_state NOT NULL` + `CHECK (state = 'queued')` |
| Code home forced to `services/`; `core/` ineligible | `eslint-rules/agent-first-import-boundaries.js`: `services: new Set(['core','db','contracts','shared'])` (no `agent`), `core: new Set(['shared'])`, `agent: new Set(['contracts','services','shared'])` |
| Import boundary is **live-enforced** | `apps/web/eslint.config.mjs:119` `"architecture/agent-first-import-boundaries": "error"` |
| Subdirs materialize with first service | `docs/03_architecture/folder-structure.md:163` "other subdirectories materialize as their first service is authored"; `:168` Appendix A services-imports |
| Gate output is `ActionType` (correction 1) | ADR-0030 ratified (charter §3 row 11; the 5-value vocab is "a semantic gloss, not a competing enum"); ADR-0030 spec `:41` `gate.ts` emits `ActionType`, `MatchResult` carries no `effective_action` |
| Replay is ADR-0034/V2; evidence is ADR-0033/Wave 2 (correction 2 + sequencing) | charter §4: `0033` Canonical Evidence Object Model (Wave 2); `0034` Replayability Two-Part Definition (V2); invariant 9 (charter §2): "deterministic skeleton byte-for-byte (`INV-RULE-002`); AI steps record outputs for replay against frozen inputs" |
| `INV-WORKFLOW-001` belongs to ADR-0031 | charter §4 row `0031` "No-AI-Only-Paths (`INV-WORKFLOW-001` + producer registration)"; reserved IDs registered only on enforcement (charter §4) |

---

## §A — ADR-0028 body (lands in `adr/` on ratification)

> The frontmatter `status: ratified` and `date` take effect when the body moves to `adr/` at
> ratification, never before (a non-ratified ADR does not belong in `adr/`).

```markdown
---
id: "0028"
title: "Workflow Core Substrate — net-new general instance/event substrate, inert at Wave 1"
status: ratified
date: "<RATIFICATION_DATE>"
deciders: [phil]
modules: [services, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0011", "0020", "0030", "0031", "0032", "0033", "0034"]
invariants: []
---

# ADR-0028: Workflow Core Substrate

## Status

Ratified <RATIFICATION_DATE> by CTO (V1 governance arc, Wave 1, reservation R4). Reserved by
the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4). Design
spec: `docs/09_briefs/v1/specs/2026-06-01-adr-0028-workflow-core-substrate-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0028-ratification-package.md`.

Substrate-reserve ADR. Reserves a net-new, general, **inert** workflow instance/event substrate
+ the `workflow_model.md` model doc. Introduces no live write, registers no invariant, ships no
migration in the ratification act (the Wave-1 build follows). Builds on the ratified engine
shape (Decision 4) and Layer-2.5 placement (Decision 3); re-litigates neither.

## Date

<RATIFICATION_DATE>

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
- ADR-0031 — No-AI-Only-Paths; owns `INV-WORKFLOW-001`.
- ADR-0032 — Canonical Autonomy Gate Seam (recording at V1).
- ADR-0033 — Canonical Evidence Object Model (Wave 2; prerequisite before AP Review).
- ADR-0034 — Replayability Two-Part Definition (V2; the replay definition this ADR honors).
- ADR-0011 — domain boundary map / document substrate (`document_cases`, `document_jobs`).
```

---

## §B — Open-question resolutions (CTO direction, folded in)

Each resolution binds the Wave-1 build; the design spec (§8) is preserved as-authored.

- **OQ-1 — exact columns.** **Defer-detail.** Accept the design-spec §2.1/§2.2 shapes as the
  recommendation; reserve the learning-readable columns as a block and **name and shape them
  at the first migration** (not pinned now — per the read-back clarification that "named"
  means to-be-named at the migration). *(Basis: substrate-now / shape-at-consumer
  discipline; over-shaping inert columns invites churn.)*
- **OQ-2 — INV-WORKFLOW allocation.** **Endorse as proposed.** `002` append-only, `003`
  never-writes-ledger, `004` version-pin; `001` → ADR-0031; **register none**. Cleanly avoids the
  0031 / 0034 collisions. *(Basis: register-on-enforcement, ADR-0021.)*
- **OQ-3 — ingest consumer-seam mechanism.** **Endorse the defer.** Reserve the *relationship*
  inert (a `document_jobs` run as a child-run/activity a `workflow_instance` references); defer
  the mechanism (nullable `workflow_instance_id` FK on `document_jobs` vs. a `workflow_events`
  activity record) to the consumer wave. *(Basis: picking now repeats the over-specification
  avoided on the code-home fork.)*
- **OQ-4 — compensation encoding.** **`workflow_events.event_type`** (a `compensation_started` /
  `compensation_completed` event), not a dedicated column/table. *(Basis: keeps one append-only
  execution log; a dedicated surface fragments the grain for an inert substrate.)*
- **OQ-5 — live ESLint enforcement.** **Confirmed live** — `apps/web/eslint.config.mjs:119`
  sets `architecture/agent-first-import-boundaries: "error"`. The import-direction invariant
  (D-0028.3) is enforced, not merely architectural. *(Resolved against disk during package
  drafting.)*
- **OQ-6 — `workflow_model.md` depth.** **Full contract now** (activity / compensation /
  version-pin semantics at model-doc level, not code). *(Basis: the portable contract is the one
  Wave-1 piece with lasting value and what makes "Temporal later" a runtime swap; a stub defers
  the substance.)*

---

## 4. Source materials read during package drafting

- `docs/09_briefs/v1/specs/2026-06-01-adr-0028-workflow-core-substrate-design.md` (the design
  spec, read-back clean at `b43bed4d`).
- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §2–§5 (invariants; Decisions 3/4;
  reserved ADR block; R4/R5; Wave plan).
- `supabase/migrations/20240101000000_initial_schema.sql` (`events` outbox `:555-574`;
  `audit_log`), `20240152000000_ingestion_substrate.sql` (`document_jobs` FKs + state enum),
  `20240164000000_rule_evaluation_log.sql` (`effective_action` / `disposition`).
- `eslint-rules/agent-first-import-boundaries.js` (layer import sets);
  `apps/web/eslint.config.mjs:119` (live `"error"` severity).
- `docs/03_architecture/folder-structure.md` (Appendix A; `services/` home);
  `docs/03_architecture/system_overview.md:23` (Layer 2.5 net-new).
- `docs/09_briefs/v1/specs/2026-05-31-adr-0030-...-design.md:41,44` (gate `ActionType`; Workflow
  Routing net-new).
- `docs/09_briefs/v1/ratification-packages/2026-05-31-adr-0029-ratification-package.md` (format
  exemplar).
