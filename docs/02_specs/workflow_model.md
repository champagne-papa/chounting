# Workflow Model — the portable Workflow Core contract

**Status:** Net-new, ADR-0028 (V1 governance arc, Wave 1, R4), 2026-06-01.
**Posture:** the **portable contract** for Workflow Core (Layer 2.5). It is
the one Wave-1 artifact with lasting value — what makes the ratified
"first option; Temporal later" (Decision 4) a *runtime* swap rather than a
substrate rewrite. The substrate it describes (`workflow_instances` +
`workflow_events`, migration `20240171000000`) ships **INERT** at Wave 1:
nothing writes it live until a consumer wave.
**Authority:** ADR-0028 is the tiebreaker. This doc elaborates the
code-level contract the ADR reserves; it registers no invariant and
decides nothing the ADR did not.

---

## 1. Placement — Layer 2.5

Workflow Core is **Layer 2.5** (ratified Decision 3): it *advances process
state* but **cannot bypass Services or write the ledger**. It is conceptual,
not a physical folder — the code home is `services/workflow/` (forced by the
ADR-0020 Appendix A import boundaries; `core/` may import `shared/` only, so a
Service-calling orchestrator cannot live there).

**Import-direction invariant** (live-enforced by `agent-first-import-boundaries`
at `"error"`):

```
agent/orchestrator/  →  services/workflow/  →  other services
```

never the reverse. `services/workflow/` **never writes the ledger directly** —
it delegates posting to `services/accounting/` (`journalEntryService.post()`),
per the Two Laws (control invariant 1). The existing `agent/orchestrator/` is a
*caller* on the agent side of the seam, not the home of Workflow Core. The
"runs without the AI" engine lives on the Services side.

---

## 2. The definition model — code-defined, version-pinned

Workflow **definitions are code-defined** (Decision 4). There is **no
`workflow_definitions` table** — a definition is a code object under
`services/workflow/`, identified by a stable `definition_key` and a
`definition_version`.

- **`definition_key`** — stable identity of a workflow (e.g. a future
  `document_ingest` or `month_end_close`). General, not AP-specific.
- **`definition_version`** — every revision to a definition's skeleton bumps
  the version. An **instance pins the version it started under**
  (`workflow_instances.definition_version`); the running instance is
  unaffected by later definition edits. This is the determinism anchor (§5).
- A definition declares an ordered/graph set of **activities** (§3) and, per
  activity, its **compensation** (§4).

The definition registry is a code map (`definition_key → versioned
definition`); resolving an instance's definition means looking up
`(definition_key, definition_version)` in code. Keeping definitions in code —
not in rows — is what keeps them **portable**: a later Temporal migration
re-hosts the same definitions on a different runtime without a data model
change.

---

## 3. The activity contract — idempotent, service-only

An **activity** is one step of a definition. The contract:

1. **Service-only.** An activity calls **Services** (Layer 2) to do work. It
   does not touch the DB directly, does not call the agent, and **never writes
   the ledger** — ledger finality is `services/accounting/` alone (Two Laws).
2. **Idempotent.** An activity is safe to retry: re-running it with the same
   inputs produces the same effect once (Services already carry idempotency
   keys / `withInvariants`; activities ride that, they do not reinvent it).
   Idempotency is what makes crash-recovery and at-least-once execution safe.
3. **Recorded.** Each activity attempt appends to `workflow_events`
   (`activity_started` / `activity_completed` / `activity_failed`) under the
   instance's `trace_id`. An activity that consumes an AI step records that
   step's output in `ai_output` (§5).
4. **No hidden state.** An activity's inputs come from the instance + prior
   recorded events; it does not read ambient mutable state that would break
   replay. (This is the data-model side of "no homegrown-engine semantics
   leaking in.")

---

## 4. The compensation contract — explicit

Compensation is **explicit** (Decision 4): each activity that has externally
visible effects **names its compensating action** in the definition (saga
style). There is no implicit rollback.

- When an instance fails partway, the engine runs the compensations for the
  completed activities **in reverse**, each recorded as a `workflow_events`
  event (`compensation_started` / `compensation_completed`) — the encoding
  chosen at OQ-4 (one append-only execution log, no separate compensation
  table).
- A compensation is itself an activity (idempotent, service-only, never writes
  the ledger). Reversing a *ledger* effect is a posting reversal performed by
  `services/accounting/`, invoked as a compensating activity — Workflow Core
  asks; Accounting Core reverses.
- Compensation is **definition-declared, not inferred**: if an activity has no
  declared compensation, it is treated as having none (and the definition
  author is responsible for ordering effects so that is safe).

---

## 5. Version-pinning + replay-honor (invariant 9)

The substrate **honors** the replay definition (control invariant 9:
"deterministic skeleton byte-for-byte, `INV-RULE-002`; AI steps record outputs
for replay against frozen inputs"). It does **not author** replay — that is
ADR-0034 (V2).

- **Deterministic skeleton.** The non-AI control flow of a pinned
  `(definition_key, definition_version)` is deterministic: given the same
  recorded inputs, it takes the same path. Pinning the version freezes the
  skeleton an instance replays against.
- **AI steps record outputs.** Any AI call inside an activity is non-
  deterministic, so its output is captured in `workflow_events.ai_output`
  against the frozen inputs. Replay (when ADR-0034 lands) re-runs the
  deterministic skeleton and *feeds the recorded AI outputs* rather than
  re-calling the model.

This is the full extent of Wave-1 replay work: the substrate carries the two
fields replay needs (`definition_version` pin + `ai_output`); the replay
*runner* is future.

---

## 6. Substrate mapping (migration `20240171000000`)

| Object | Grain | Role |
|---|---|---|
| `workflow_instances` | one per workflow run | DB-backed instance; `definition_key`+`definition_version` pin; `parent_instance_id` self-FK = child-workflow (R4); mutable `state`; `trace_id` audit join; `learning_metadata` reserved learning surface. Service-emitted; **mutable** (engine advances state). |
| `workflow_events` | one per execution step | Append-only per-instance log: activities, compensations, AI-step outputs (`ai_output`). `sequence_number` (global serial) totally orders within an instance via `ORDER BY`. **Append-only** (BEFORE UPDATE/DELETE/TRUNCATE triggers, events precedent). |

**Three logs, one key — none subsumes another:**

- **`events`** — domain-event **outbox** (R5; do-not-repurpose). Not the
  workflow execution log.
- **`audit_log`** — **mutation-grain** audit; `trace_id` join
  (`idx_audit_org_trace`).
- **`workflow_events`** — **execution-grain** log (this substrate).

`trace_id` is the shared correlation key: an instance, its events, and the
audit rows of the service mutations it drove all join on `trace_id`.

---

## 7. Inert posture + the ingest consumer seam

**Inert at Wave 1.** Both tables ship empty; `workflow_instances.state` has a
`v1-active` CHECK narrowed to `'pending'` (the document_cases/document_jobs
substrate-now precedent). No invariant is registered (ADR-0028 D-0028.8;
`INV-WORKFLOW-002/003/004` stay reserved). The first live writer is a later
consumer wave.

**`document_jobs` is not the instance table** (D-0028.2). It is a per-file
ingest queue (three NOT-NULL ingest FKs). Adopting it would break the general
engine's portability. Instead the ingest pipeline becomes a **consumer**: a
`document_jobs` run later modeled as a child-run/activity that a
`workflow_instance` references (R4). The exact mechanism (a nullable
`workflow_instance_id` FK on `document_jobs`, vs. a `workflow_events` activity
record) is **deferred to that consumer wave** (OQ-3) — reserved as a
relationship now, additive then, never a Wave-1 coupling.

---

## 8. What this model does not cover

- **The engine runtime** — execution loop, retry/timeout policy, the
  `services/workflow/` module layout. Deferred to the first consumer wave
  (ADR-0020 item-6 opportunistic migration).
- **The replay runner** — ADR-0034 (V2). This doc reserves only the fields it
  needs.
- **The workflow-instance canvas** — a post-AP-Review observe-and-operate
  projection (off this arc's critical path; docs draft in parallel, ship
  last; D-0028.7).
- **Decision/gate semantics** — gate output is `ActionType`/`Disposition`
  (ADR-0030); this model does not restate or extend it.

---

## Cross-references

- `docs/07_governance/adr/0028-workflow-core-substrate.md` — the ratified ADR
  (tiebreaker).
- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter
  (Decisions 3/4; invariant 9; R4/R5).
- `docs/03_architecture/folder-structure.md` / ADR-0020 — import boundaries;
  the `services/` home.
- `supabase/migrations/20240171000000_workflow_core_substrate.sql` — the
  substrate.
- ADR-0030 (`ActionType`), ADR-0033 (evidence object, Wave 2 prerequisite),
  ADR-0034 (replay, V2).
