# ADR-0028 — Workflow Core Substrate — Design Spec

**Status:** DRAFT for review · 2026-06-01 · pre-ratification design spec (lifecycle stage 1
of 3: `specs/` → `ratification-packages/` → ratified ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0028 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4, Wave 1, reservation R4).
**Anchored at:** HEAD `98a4474e` (branch `staging`).
**Posture:** SUBSTRATE — reserve tables + a model doc (`workflow_model.md`) + **inert seams**.
Nothing writes the new substrate live at Wave 1 (the `events`-table reserved-seat pattern).
The engine *shape* is **already ratified** (Decision 4) and the layer placement is **already
ratified** (Decision 3); this spec builds on both — it does **not** re-litigate build-vs-adopt.
Genuinely-forking sub-decisions are carried as an options/open-questions section for the
ratification-package stage, like ADR-0030 Part 2.

> **What stays OPEN here.** Exact column sets, the child-workflow representation, the
> compensation encoding, and the INV-WORKFLOW-\* sub-allocation are presented with a grounded
> recommendation but **decided at the ratification-package / first-migration stage**. Two
> spine decisions were settled by the CTO at spec-authoring (§2.0, §3.0) and are recorded as
> closed.

---

## 0. What this ADR does (and does not do)

- **Does:** reserve a **net-new, general, INERT** workflow substrate — `workflow_instances`
  (DB-backed instances; pinned definition version; child-workflow linkage) + `workflow_events`
  (append-only per-instance execution log; records AI-step outputs for replay-honor) — plus
  the **audit join** (`trace_id`) and the `workflow_model.md` model doc. Names the code home
  (`services/workflow/`) and the import-direction invariant. Folds in the canvas
  "don't-foreclose" checklist (§4–§5), corrected.
- **Does NOT:** write any of the new substrate live (Wave 1 = inert seams); build the engine
  runtime; re-decide the engine shape (Decision 4) or the Layer-2.5 placement (Decision 3);
  author the replay ADR (that is **ADR-0034, V2** — the substrate only *honors* invariant 9);
  standardize the 5-value gate-disposition gloss (settled at **ADR-0030**: `ActionType` is the
  contract); register any invariant (inert ⇒ no enforcement ⇒ nothing registers); or touch the
  workflow-instance canvas (off this arc's critical path, §5.2).

---

## 1. Context — Layer 2.5, ratified shape, near-clean slate

**Decision 3 (ratified, charter §3):** Workflow Core is **Layer 2.5** — it *advances process
state* but **cannot bypass Services or write the ledger**. It sits conceptually between
Services (Layer 2) and Agent (Layer 3); there is no physical "2.5" folder.

**Decision 4 (ratified, charter §3):** the engine shape — **code-defined definitions ·
DB-backed instances · pinned versions · idempotent service-only activities · explicit
compensation** ("first option; Temporal later"). This spec **builds on Decision 4 verbatim**.
The "Temporal later" clause is the load-bearing constraint on substrate shape: the definition
must stay **portable** (no homegrown-engine semantics leaking into the data model), so that a
later Temporal swap is a runtime change, not a substrate rewrite.

**Near-clean slate.** The only architecture-doc reference today is
`docs/03_architecture/system_overview.md:23` — "Workflow Core (process engine, Layer 2.5 —
net-new)". ADR-0030's design spec already reserves the seam:
`docs/09_briefs/v1/specs/2026-05-31-adr-0030-...-design.md:44` — "**Workflow Routing** |
net-new — reserved for ADR-0028 (Workflow Core Substrate, Wave 1). Nothing on disk today. |
⚫ net-new".

**Three logs already on disk — disambiguated so the substrate does not repurpose them:**

| Log | Where | Grain / purpose | Relationship to Workflow Core |
|---|---|---|---|
| **`events`** | `supabase/migrations/20240101000000_initial_schema.sql` (≈ `CREATE TABLE events`) | Domain-event **outbox** (`aggregate_id`/`aggregate_type`/`payload`); **R5-reserved**, "do not repurpose"; inert. | **NOT** the workflow execution log. R5 forbids reuse. `workflow_events` is net-new and distinct. |
| **`audit_log`** | `supabase/migrations/20240101000000_initial_schema.sql` (`CREATE TABLE audit_log`); append-only since `20240122000000_audit_log_append_only.sql` | **Mutation-grain** audit; `trace_id` join key (`idx_audit_org_trace (org_id, trace_id)`). | The **audit join**: a workflow instance/event joins to its mutation rows by `(org_id, trace_id)`. |
| **`rule_evaluation_log`** | `supabase/migrations/20240164000000_rule_evaluation_log.sql` | Logic-Receipt of rule evaluations (ADR-0024); `trace_id` linkage; `effective_action action_type`; `disposition` 4-value. | A decision-grain record the workflow can correlate by `trace_id`; **not** the execution log. |

The existing ingest pipeline (`document_cases` state machine + `document_jobs` work-queue,
`supabase/migrations/20240143000000_*` and `20240152000000_ingestion_substrate.sql`) is the
first *real* multi-stage process — but it is **ingest-specific** (see §2.0). It is the future
first *consumer* of Workflow Core, not the substrate itself.

---

## 2. Decision (proposed) — net-new general workflow substrate, INERT

### 2.0 Spine (CTO-settled): net-new general tables; `document_jobs` out of scope

**Settled at spec-authoring (CTO).** The substrate is **net-new and general** (Option 1), not
an adoption of the existing ingest substrate, because `document_jobs` is structurally a
**per-file ingest queue**, not a general instance table:
`20240152000000_ingestion_substrate.sql` (BLOCK 4) gives it three **NOT-NULL** FKs —
`source_document_id → source_documents`, `document_case_id → document_cases`,
`ingest_batch_id → ingest_batches` — plus an ingest-flavored state enum (`document_job_state`:
`queued|in_flight|failed_retry|failed_permanent|completed`). A general workflow instance (a
month-end close, a report run) has no source document, no case, no batch. Adopting
`document_jobs` would mean either dropping those FKs (a destructive retrofit of ingest's own
integrity model) or leaking ingest semantics into the general engine — violating the
portability property Decision 4 needs for the later Temporal swap.

**Stipulation (CTO):** the ADR body **explicitly declares `document_jobs` out of scope as the
instance table**, and reserves — *inert* — the seam by which ingest later becomes a
**consumer**: a `document_jobs` run modeled as an **activity / child-run record that a
`workflow_instance` references** (per R4's "child-workflow data model present"). This converts
reuse from a Wave-1 coupling into a **planned, additive later-wave consumer relationship** and
prevents the failure mode of two parallel run-tables silently drifting. The exact mechanism
(nullable `workflow_instance_id` FK added to `document_jobs` at the consumer wave, vs. a
`workflow_events` activity record referencing the job) is §8 OQ-3.

### 2.1 `workflow_instances` (DB-backed instances; version-pin; child-workflow) — INERT

Proposed shape (exact columns = §8 OQ-1, migration detail; follows the project's
`org_id`-scoped, RLS-through-org, `trace_id`-carrying, `created_by`-text conventions and the
**substrate-now / v1-active-CHECK-narrow** pattern used across the ingest migrations):

- `id uuid PK`
- `org_id uuid NOT NULL` → `organizations` (RLS through org)
- `definition_key text NOT NULL` — identity of a **code-defined** definition (Decision 4; no
  definitions *table* — definitions live in `services/workflow/` code)
- `definition_version text NOT NULL` — the **pinned** version (Decision 4); an instance is
  bound to the exact definition version it started under
- `parent_instance_id uuid NULL` → self-FK — the **child-workflow** linkage (R4)
- `state text NOT NULL` — generic lifecycle (`pending|running|completed|compensating|compensated|failed`);
  a **v1-active CHECK** narrows it to an inert/reserved value until a consumer activates it
- `trace_id uuid NOT NULL` — the audit join key
- `started_at timestamptz NULL`, `completed_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`, `created_by text NOT NULL`
- *(reserved nullable columns for the learning read surface — R4 "shaped for the learning
  substrate to read"; named at OQ-1, registered by no one at Wave 1)*

### 2.2 `workflow_events` (append-only execution log; replay-honor) — INERT

The per-instance **execution-grain** log. **Net-new and distinct** from the `events` outbox
(§1 / R5) and from `audit_log` (mutation grain). Proposed shape (exact = §8 OQ-1):

- `id uuid PK`, `org_id uuid NOT NULL`
- `workflow_instance_id uuid NOT NULL` → `workflow_instances`
- `sequence_number bigserial` — total order within the instance
- `event_type text NOT NULL` — `activity_started|activity_completed|activity_failed|compensation_started|compensation_completed|ai_step_recorded|…`
- `activity_key text NULL`, `payload jsonb NOT NULL`
- `ai_output jsonb NULL` — **recorded AI-step outputs** captured against frozen inputs, so the
  deterministic skeleton can be replayed (this is the substrate **honoring invariant 9** — see
  §4.2; it does **not** author the replay definition)
- `trace_id uuid NOT NULL` — audit join
- `recorded_at timestamptz NOT NULL DEFAULT now()`
- **Append-only** (trigger-enforced, the `events`/`audit_log` precedent) — candidate
  INV-WORKFLOW-\* at §6.

### 2.3 Definitions in code (Decision 4) — `workflow_model.md` is the model doc

There is **no `workflow_definitions` table**. Definitions are **code-defined** under
`services/workflow/` (§3). `docs/02_specs/workflow_model.md` (net-new, this wave) documents:
the definition registry shape; the **idempotent, service-only activity** contract (an activity
calls Services, is retry-safe, and **never writes the ledger directly**); the **explicit
compensation** contract (each activity names its compensating action — saga-style); and the
version-pin rule (instances pin `definition_version`). The doc is the portable contract that
makes "Temporal later" a runtime swap. Compensation **encoding** in the substrate (a
`workflow_events.event_type`, vs. a dedicated column) = §8 OQ-4.

### 2.4 Audit join (`trace_id`)

Workflow Core advances process state **through Services** (Decision 3); those service
mutations already write `audit_log` rows under INV-AUDIT-001, carrying the request `trace_id`.
`workflow_instances` and `workflow_events` carry the same `trace_id`, so the **execution
grain** (`workflow_events`) and the **mutation grain** (`audit_log`) join by `(org_id,
trace_id)` (`idx_audit_org_trace`). Three logs, one correlation key — no log subsumes another.

---

## 3. Code home & layer placement (CTO-settled: `services/workflow/`, detail deferred)

**Settled at spec-authoring (CTO).** The home is **`services/workflow/`** (Option 1), with the
concrete module layout deferred to the first consumer (ADR-0020 item-6 opportunistic-migration
+ "directories materialize as their first service is authored"). The decision is forced by the
**ADR-0020 Appendix A import boundaries** (per `docs/03_architecture/folder-structure.md`, and
the live scaffold `eslint-rules/agent-first-import-boundaries.js`):

- `core/` may import `shared/` only (`core: new Set(['shared'])`) — so a Service-calling
  orchestrator **cannot** live in `core/`. Only a future *pure* `WorkflowDefinition → graph`
  compiler / predicate set would be `core/`-eligible.
- `services/` may import `core|db|contracts|shared` (intra-layer `services → services`
  allowed) but **not** `agent/`; `agent/` *may* import `services/`.

**Import-direction invariant (stated now, per CTO stipulation):**

> `agent/orchestrator/ → services/workflow/ → other services` — **never the reverse**.
> `services/workflow/` **never writes the ledger directly**; it delegates posting to
> `services/accounting/` (`journalEntryService.post()`), per Decision 3 + the Two Laws
> (control invariant 1, single financial-finality boundary).

This places the "**runs without the AI**" engine on the Services side of the `agent ↛ services`
boundary: the existing `agent/orchestrator/` (which today advances `document_cases` state) is a
**caller** on the agent side of the seam, not the home of Workflow Core. Stating the direction
now keeps the inert seam from being wired backwards later (the one cheap mistake deferral could
otherwise allow). Live ESLint enforcement status of the rule = §8 OQ-5 (the *architectural
rule* decides the home regardless; enforcement is an impl-gate detail).

---

## 4. The canvas "don't-foreclose" checklist, folded in — corrected

The handoff's canvas-affordance "don't-foreclose" checklist is folded into this spec with
three corrections (each verified against disk; the handoff briefing had them wrong):

### 4.1 Gate output is `ActionType`/`Disposition` — not the 5-value gloss

**ADR-0030 ratified (Decision 11, charter §3 row 11):** `ActionType` is *the one typed
decision contract*; the proposed 5-value vocabulary
(`allow|deny|require_approval|require_more_evidence|queue_manual_review`) is a **semantic
gloss, not a competing enum**. Verified seams (ADR-0030 spec §1): `gate.ts` emits `ActionType`;
`MatchResult` (`shared/rules/types.ts`) carries **no** `effective_action`;
`rule_evaluation_log` records `effective_action action_type` + a 4-value `disposition`
(`auto_posted|routed|blocked|pending`). **The spec specs against `ActionType`/`Disposition`.**
It must **not** open a "gate-output addendum" standardizing the 5-value gloss — that reopens a
settled decision.

### 4.2 Replay is **ADR-0034 (V2)**, not 0033 — substrate honor-only

**Charter §4:** ADR-0034 = "Replayability Two-Part Definition" (V2). ADR-0033 = "Canonical
Evidence Object Model" (Wave 2) — a different ADR. The substrate only **honors** the replay
definition — control invariant 9: "deterministic skeleton byte-for-byte (`INV-RULE-002`); AI
steps record outputs for replay against frozen inputs." Concretely: §2.2's `workflow_events.ai_output`
captures AI-step outputs against frozen inputs, and §2.1's `definition_version` pin freezes the
deterministic skeleton. **ADR-0028 does not author ADR-0034.**

### 4.3 Engine shape is ratified (Decision 4) — build on it, don't re-litigate

Decision 4 is **ratified** (charter §3 row 4). The spec **builds on** the code-defined-defs /
DB-instances / pinned-versions / idempotent-service-only-activities / explicit-compensation
shape and the "first option; Temporal later" posture. It does **not** re-open build-vs-adopt as
a fresh question. The only Decision-4-derived constraint exercised here is **portability** (no
engine semantics in the data model — §1, §2.0).

---

## 5. Sequencing constraints (stated in the spec)

### 5.1 Evidence object (ADR-0033, Wave 2) is a **prerequisite** before AP Review (Wave 6)

Per charter §5, the canonical evidence object (ADR-0033, Wave 2 — "GENERAL, not-AP-only; AP
bundle is one consumer"; extends INV-DOC-001 → `INV-EVIDENCE-001`) is **gating before** the AP
Review consumer (Wave 6), **prerequisite — not co-traveler**. The Workflow Core substrate
(Wave 1) lands first and inert; it must not assume the evidence object exists, and the AP
workflow that consumes both lands only after Wave 2 completes. The spec records this ordering
so a later reader does not collapse Waves 2 and 6.

### 5.2 The workflow-instance canvas is **off this arc's critical path**

The workflow-instance canvas is a **post-AP-Review, observe-and-operate projection of the
code-defined definitions** — not substrate. It stays **off this arc's critical path**: its docs
draft **in parallel** and **ship last**. ADR-0028 must **not foreclose** it — the substrate
shape (`workflow_instances` + `workflow_events`, joined to `audit_log` by `trace_id`, with a
learning-readable event log) is exactly what an observe-and-operate canvas later reads — but
ADR-0028 neither builds nor blocks it.

---

## 6. Reserved invariant IDs (named; **none registered** — inert ⇒ no enforcement)

Charter §4 reserves `INV-WORKFLOW-001..005`, registered in `invariants.md` only when
enforcement code/migration lands. Wave 1 is **inert**, so ADR-0028 **registers none** and only
*proposes* a candidate sub-allocation (confirmed/avoided-for-collision at the ADR body — §8 OQ-2):

- `INV-WORKFLOW-001` — **belongs to ADR-0031** (No-AI-Only-Paths, Wave 4; charter §4). **Not
  ADR-0028's.** Named here only to avoid collision.
- `INV-WORKFLOW-002` (candidate) — `workflow_events` **append-only** (execution log immutable).
- `INV-WORKFLOW-003` (candidate) — Workflow Core (Layer 2.5) **never writes the ledger**;
  delegates to `services/accounting/` (Decision 3 + invariant 1).
- `INV-WORKFLOW-004` (candidate) — **version-pin determinism**: an instance pins
  `definition_version`; replay honors the frozen skeleton (relates to invariant 9 /
  `INV-RULE-002`; the *replay definition* is ADR-0034's, not this one).
- `INV-WORKFLOW-005` — left unallocated/reserved.

---

## 7. Consequences

- **Positive:** a general, portable workflow substrate exists and is shaped for the learning
  read surface (R4) without coupling to ingest, the evidence object, or the AI layer. The
  "Temporal later" swap stays a runtime change. The three-log disambiguation (§1) prevents the
  `events`-outbox repurposing R5 forbids. The import-direction invariant (§3) prevents a
  backwards-wired seam.
- **Cost / inertness:** two net-new tables ship empty with `v1-active` CHECKs narrowing them to
  reserved states; nothing exercises them until the first consumer wave. This is the deliberate
  `events`-table reserved-seat pattern, accepted in trade for laying R4's seams now.
- **Carried risk:** a net-new instance table alongside `document_jobs` risks a **silent fork**
  if the consumer seam (§2.0 stipulation) is not reserved. The stipulation — `document_jobs`
  out-of-scope + reserved additive consumer relationship — is the mitigation and is load-bearing,
  not optional.
- **Doc surface:** adds `docs/02_specs/workflow_model.md` (net-new) and one row of reconciliation
  to `system_overview.md` (Layer 2.5 now has a substrate). No invariant-doc / control-matrix
  change (nothing registers).

---

## 8. Open questions for the ADR body / reviewer

- **OQ-1 — exact column sets** for `workflow_instances` / `workflow_events` (incl. the reserved
  learning-readable columns). Recommendation: §2.1/§2.2 shapes; pin at the first migration.
- **OQ-2 — INV-WORKFLOW-\* sub-allocation** (§6): confirm 002/003/004 candidates and the
  no-collision with ADR-0031 (001) and ADR-0034 (replay). Register none at Wave 1.
- **OQ-3 — ingest consumer-seam mechanism** (§2.0): nullable `workflow_instance_id` FK on
  `document_jobs` at the consumer wave, vs. a `workflow_events` activity record referencing the
  job. Reserve the relationship inert now; pick the mechanism when ingest becomes a consumer.
- **OQ-4 — compensation encoding** (§2.3): a `workflow_events.event_type` (recommended, keeps
  one execution log) vs. a dedicated compensation column/table.
- **OQ-5 — live ESLint enforcement** of `agent-first-import-boundaries` for `services/workflow/`
  (`eslint.config.mjs` severity): confirm before the *impl* wave leans on it. The architectural
  rule decides the home regardless; this is an enforcement-gate detail, not a spine question.
- **OQ-6 — `workflow_model.md` depth at Wave 1**: full activity/compensation/version-pin
  contract now (recommended — it is the portable contract) vs. a stub expanded at the first
  consumer.

---

## 9. Lifecycle next steps (not this spec)

1. CTO read-back of this design spec (verify-against-disk) → resolve OQ-1..OQ-6 direction.
2. **Ratification package** under `docs/09_briefs/v1/ratification-packages/` enacting ADR-0028
   (the first migration for `workflow_instances` + `workflow_events` + append-only triggers +
   RLS; `workflow_model.md`; `system_overview.md` reconcile row).
3. Ratified **ADR-0028** lands in `docs/07_governance/adr/`.
4. Design spec preserved as historical context (per ADR README §"Pre-ratification design specs").

This spec **reserves and shapes**; it authors no ADR body, builds no engine, registers no
invariant, and writes nothing live. No commit until the read-back clears.
