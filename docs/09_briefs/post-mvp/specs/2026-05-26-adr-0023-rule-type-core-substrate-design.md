# ADR-0023 Rule Type Core Substrate and ADR-0017 Reconciliation — Design Spec

**Status:** Pre-ratification design spec per ADR-0021 §4 (Decision item 4). **NOT an ADR** and carries no `proposed` status — chounting routes pre-ratification design through the design-spec genre, not through `status: proposed` ADR files (ADR-0021 Alternative 5). This spec informs the eventual `docs/07_governance/adr/0023-rule-type-core-substrate.md`, which is created with `status: ratified` at CTO ratification. Reserves the **0023** ADR number.

**Date:** 2026-05-26 · **HEAD anchor:** `baeeb862`, branch `staging`.

**Voice:** decision-bearing. The Rule Type Core architecture is ratified at V3.2 (`docs/02_specs/rule-type-core.md`); this spec lands substrate calls, not semantics. Decisions are made, not opened. It is deliberately much shorter than the spec it implements.

**Inputs (read before this spec):**
- `docs/09_briefs/post-mvp/2026-05-26-ring1-substrate-brainstorm.md` (empirical HEAD pass + decision map).
- `docs/09_briefs/post-mvp/2026-05-26-ring1-pre-adr-verification.md` (the three pre-migration verifications).
- `docs/02_specs/rule-type-core.md` (V3.2, ratified) — §5, §6, §8.4, §8.5, §10.
- ADR-0017 (`0017-vendor-template-substrate.md`), ADR-0012 §12, ADR-0007 §Q78 / Path X, ADR-0010, ADR-0011 §10.

**Amends ADR-0017 (recorded at ratification, not here).** Two columns: enum naming (`vendor_rule_rung` → `rule_autonomy_rung`, relocated to `rule_registry`) and `created_by` shape (`text` → `uuid`). This is an **amendment, not supersession** — ADR-0017 stays in force; this ADR reconciles two drift items against it. Recorded via `related: ["0017"]` plus the Decision 4 / Decision 5 body notes. The paired ADR-0022 amendment status-clause edit to ADR-0017 lands **at ratification of ADR-0023** — pre-ratification design specs do not mutate ratified ADRs (ADR-0021 §4 lifecycle).

---

## Planned ADR-0023 frontmatter (finalized at ratification)

```yaml
id: "0023"
title: "Rule Type Core Substrate and ADR-0017 Reconciliation"
status: ratified            # set at ratification; no `proposed` in the chounting enum (ADR-0021)
date: "<ratification-date>"
deciders: [phil]
modules: [db, agent]        # db = registry/track-record/vendor_rules substrate + migration;
                            # agent = autonomy rung (Agent Ladder). `core` (the evaluator) lands
                            # at Ring 2A, not here. Confirm against taxonomy.md at ratification.
features: []                # Features taxonomy deferred (taxonomy.md §Features)
phase: "post-mvp"
supersedes: []              # amendment, not supersession
superseded_by: []
related: ["0007", "0010", "0011", "0012", "0015", "0017"]
invariants: []              # substrate-only and inert at Ring 1; no enforced invariant lands
                            # until Ring 2 wires the evaluator. INV-ID assignment is a Ring 2 concern.
```

There is **no `amends` field** in the ADR-0021 frontmatter schema. The ADR-0017 amendment is carried by `related: ["0017"]` + Decision 4/5 body prose + the paired ADR-0022 status-clause edit applied to ADR-0017 at ratification.

---

## Context

The Rule Type Core spec is ratified at V3.2 (`docs/02_specs/rule-type-core.md`): rules as a domain concept, a closed Trigger/Condition/Action grammar, deterministic conflict resolution, and a three-ring delivery plan. Ring 0 (the spec) is done. **Ring 1 is the substrate** — the tables, enums, and service boundaries the rule core persists into. This ADR is Ring 1. It does not implement an evaluator (Ring 2A) and does not relitigate semantics.

The live schema has drifted from ADR-0017's text on four items (brainstorm §1 empirical pass): the shipped `vendor_rules` table is a 9-column shell — `{rule_id, org_id, vendor_id, default_account_id, autonomy_tier, created_at, created_by, approved_at, approved_by}` — while ADR-0017's *text* describes ~18 columns (`current_rung`, `clean_approval_count`, `bundle_type`, `legal_entity_id`, `promotion_authority`, promoted/demoted anchors, the multi-entity unique constraint). None of that substrate was migrated. This is the exact failure mode Ring 1 exists to fix: substrate described in prose as if live, never built, canon and disk silently diverging.

Three empirical HEAD findings reframe the substrate scope and are load-bearing for the decisions below (sources cited inline): **zero `vendor_rules` writers** (no service, no seed — brainstorm §1a), so the table is empty in any reproducible environment and any backfill is a no-op; **zero `autonomy_tier` readers** outside generated types (brainstorm §1b), so the source-of-truth collapse holds with no live autonomy consumer to sequence around; and **the `bundle_type` enum is unmigrated** (verification §1; `rg "bundle_type" supabase/migrations/` empty), so ADR-0017's `bundle_type` column has an unmet prerequisite this ADR must create. The verification doc also grounds the `legal_entity_id` precedent (uniformly nullable, never in a unique constraint) and the actor-reference standard (ADR-0007 Q78 / Path X: `created_by uuid → auth.users(id)`).

---

## Decision

### 1. Ship `rule_registry` via class-table inheritance

**The call.** Create `rule_registry` at Ring 1 as the parent identity table for all rule materializations. `vendor_rules.rule_id` becomes a 1:1 FK child identity to `rule_registry.id` on the **existing** PK (verification confirms the live PK is `rule_id` — no new column on `vendor_rules`). `rule_registry` owns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | rule identity; `vendor_rules.rule_id` references it 1:1 |
| `rule_type` | `rule_type NOT NULL` | §5.3 enum |
| `lifecycle_state` | `rule_lifecycle_state NOT NULL` | §5.8 enum |
| `current_rung` | `rule_autonomy_rung NOT NULL DEFAULT 'always_confirm'` | source-of-truth from creation (Decision 4) |
| `name` | `text NULL` | mutable display metadata (§5.1); null until named (system-proposed rules) |
| `created_by` | `uuid REFERENCES auth.users(id)` | actor-reference standard (Decision 5) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `predecessor_rule_id` | `uuid NULL REFERENCES rule_registry(id)` | amendment lineage (§5.8) |
| `successor_rule_id` | `uuid NULL REFERENCES rule_registry(id)` | amendment lineage (§5.8) |

After the migration `vendor_rules` retains only vendor-scope columns (see migration sketch §e and the note below).

**Load-bearing reason.** Deferring `rule_registry` reproduces the exact pattern Ring 1 exists to fix. ADR-0017 named substrate, deferred the migration, and the live schema drifted from canon (Context, above). Parking the registry's cross-cutting metadata on `vendor_rules` "for now" with a known-future migration to move it plants the seed of the next ADR-0017 while reconciling the current one. The cheapest way to not repeat the drift is to not create a second instance of it.

**`current_rung` is source-of-truth from creation,** backfilled once from `vendor_rules.autonomy_tier` in the migration (§d). Per verification, `vendor_rules` is empty in any reproducible environment, so the backfill is a **no-op**; it stays in the migration as an idempotent forward-safety step, not as transition machinery.

**Vendor-scope retention note.** `vendor_rules` retains `org_id`, `vendor_id`, `default_account_id`, `approved_at`, `approved_by` (the vendor-template approval-ceremony columns are vendor-scope per ADR-0017), plus the new `bundle_type` and `legal_entity_id` (Decision 3); `rule_id` is now PK **and** FK. `created_at` / `created_by` are carried by `rule_registry` as rule-identity audit; the migration drops the `vendor_rules` copies to avoid a dual source of the same fact (flagged for the migration pass).

**Deferred registry columns — keeps Decision 6 honest.** §5.10 also assigns `triggers`, `applies_to_intent_types`, and `applies_to_source_triggers` (the eligibility-gating columns) to the registry. This ADR **does not** add them: they consume `trigger_type`, which Ring 1 keeps reserve-only (Decision 6). Adding them now would make `trigger_type` load-bearing and pull Branch/eligibility substrate into Ring 1. They land with the Branch/eligibility ring.

**Alternatives rejected.**
- *Defer the registry (§5.10 interim path).* Rejected — reproduces the ADR-0017 drift this ADR reconciles; partial substrate with a known-future migration is the failure mode, not a savings.
- *Polymorphic spine (`backing_table` + `backing_row_id`, à la `source_document_links`).* Rejected — `source_document_links` is polymorphic because it links genuinely heterogeneous entities; rules are an is-a hierarchy, so the service-only integrity weakness would be imported without the justification that earns it (§5.10; `source_document_links` confirmed live-and-consumed in brainstorm §1c). Class-table inheritance is one table + one 1:1 FK, **not** a runtime dispatcher — the YAGNI objection targets polymorphic dispatch, which this is not.

### 2. Ship `rule_track_records`

**The call.** Create `rule_track_records` at Ring 1, keyed by `rule_id` (`uuid PRIMARY KEY REFERENCES rule_registry(id) ON DELETE CASCADE`), holding the denormalized TrackRecord counters per spec §5.10 (column names grounded verbatim against §5.10 lines 712–796):

| Column | Type | Source |
|---|---|---|
| `rule_id` | `uuid PK, FK → rule_registry(id) ON DELETE CASCADE` | §5.10 |
| `clean_approval_count` | `integer NOT NULL DEFAULT 0` | §5.10; resolves ADR-0017's counter |
| `rejection_count` | `integer NOT NULL DEFAULT 0` | §5.10 |
| `guardrail_fire_count` | `integer NOT NULL DEFAULT 0` | §5.7 / §5.10 |
| `guardrail_confirmed_count` | `integer NOT NULL DEFAULT 0` | §5.7 / §5.10 |
| `guardrail_resolved_into_primary_bounds_count` | `integer NOT NULL DEFAULT 0` | §5.7 / §5.10 |
| `last_clean_approval_at` | `timestamptz NULL` | §5.10 audit anchor |
| `last_rejection_at` | `timestamptz NULL` | §5.10 audit anchor |
| `last_guardrail_fire_at` | `timestamptz NULL` | §5.10 audit anchor |
| `last_winning_match_at` | `timestamptz NULL` | Q-RC-AT-2 (stored; see below) |
| `model_version` | `text NULL` | §5.10 — inferential rules only; null for pattern/temporal |

`model_version` lands on the shared `rule_track_records` table rather than in a split inferential-counters child table because no inferential rules exist at Ring 1 and splitting now would be overbuilt; the column is nullable for pattern/temporal rules and populated for inferential.

One row per rule, co-created with the `rule_registry` row in the same transaction (Decision 5).

**Load-bearing reason.** Isolating hot counter-writes off the rule-identity row is sound with one backing rule table or five, and it resolves ADR-0017's `clean_approval_count` cleanly — the counter lands here, **not** on `vendor_rules`, which avoids the "interim column, migrate later" move Decision 1 rejects.

**Q-RC-AT-1 (windowed read) is deferred to Ring 2A.** The Stage 1 canvas's last-30-day indicator is a derived windowed read; Ring 1 stores cumulative counters and reserves the read contract but does not build it. The audit corpus of `rule_evaluated` events is empty at v1 (verification §1d — `audit_log.action` is text, zero emitters), and the consumer (the canvas) ships at Ring 2A, which owns both the emitter and the reader. Building a materialized view now would mean tuning a refresh cadence against zero rows.

**Q-RC-AT-2 (`last_winning_match_at`) ships at Ring 1 as a stored timestamp.** Semantic per the access-and-tuning brief: *the most recent evaluation in which the Rule won conflict resolution (`winning_rule_id = this.rule_id`)*. Stored rather than derived because the consumer is real (Ring 2A canvas), the cost is one column, and the derived alternative is inert until the audit corpus fills. The UI label ("last matched" / "last applied" both collide with existing vocabulary) is product/UX's call and is deferred.

**Alternative rejected.** *Derive `last_winning_match_at` from the `rule_evaluated` audit corpus.* Rejected for v1 — no corpus exists until Ring 2 emits, and it would couple the canvas indicator to an unbuilt read path.

### 3. ADR-0017 drift reconciliation (`vendor_rules`)

**The call.** Two column additions to `vendor_rules`:
- `bundle_type bundle_type NOT NULL` (the enum is created in this ADR — Decision 6; the column has no DB default, but `vendor_rules` is empty so NOT NULL is satisfiable).
- `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT`, **nullable, no DB default** — matching the project's uniform idiom (verification §2: identical shape in `source_documents`, `vendor_prepayments`, `vendor_credits`; "defaults to org_id in v1" is an application-layer convention via `NULLIF(...)→NULL`, never a schema `DEFAULT`; no `legal_entities` table exists).

One uniqueness constraint, as an **expression unique index**:

```
UNIQUE INDEX ON vendor_rules (org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type)
```

**Load-bearing reason — precedent-setting call, made explicitly.** `legal_entity_id` is nullable, and Postgres treats `NULL ≠ NULL`, so a plain unique constraint silently fails to enforce when `legal_entity_id IS NULL` — which is the v1 norm. Verification §2 establishes there is **no prior precedent** in the schema for `legal_entity_id` in a unique constraint, nor for a COALESCE expression index, so this ADR chooses fresh among three options:
- **(a) `NOT NULL DEFAULT org_id` at the column level** — rejected: diverges from the uniform nullable idiom at the schema layer and from the existing reservation note that the FK target may shift to a separate `legal_entities` table post-v1 (`20240135000000_storage_substrate.sql:178-181`, grounded in verification §2; ADR-0011 §10 reserves the column and the `org_id` default but is silent on the FK-target trajectory), and forces app-layer code to fork its `legal_entity_id` handling by table.
- **(b) expression unique index with `COALESCE(legal_entity_id, org_id)`** — **chosen**: preserves the existing application-layer idiom (write `NULL`, default to `org_id` in app code) and moves enforcement into the index. The only net-new pattern lives in schema definitions, not in app-layer code.
- **(c) partial unique indexes** (one `WHERE legal_entity_id IS NULL`, one `WHERE NOT NULL`) — rejected: two indexes to express one invariant; more surface, no idiom benefit over (b).

**Forward-looking codification.** This ADR establishes option (b) as **project-canon** for the shape "*a scoped foreign key participates in a unique constraint where the FK defaults to `org_id` at the app layer*." Future tables of this shape follow the `COALESCE(scoped_fk, org_id)` expression-index pattern rather than re-deriving the choice.

**Don't-resurrect-`autonomy_tier` note (forward to Ring 2A).** Ring 2A's rung consumers read `rule_registry.current_rung`, never a resurrected `vendor_rules.autonomy_tier`. The column and its enum are dropped in this migration (Decision 4); they are not to be re-added.

### 4. Enum naming reconciliation

**The call.**
- Type name: **`rule_autonomy_rung`**.
- Values: **`always_confirm | notify_and_auto_post | silent_auto`** (3 values; v1 emits only `always_confirm`). Verified against spec §6 (Agent Ladder, three rungs) — no additional rung is implied; the `otherwise` reservation in the spec is a `branch_type` concern, not a rung, so no reserved-rung values beyond these three.
- Column: **`rule_registry.current_rung`** uses the type.
- **Drop** `vendor_rules.autonomy_tier` (column) and the `autonomy_tier` enum type at the end of the migration (after the no-op backfill).

**Load-bearing reason.** Three names exist on disk (verification §1e): live `autonomy_tier` (`always_confirm | notify_auto | silent`), ADR-0017 *text* `vendor_rule_rung`, and spec §10 `rule_autonomy_rung`. With zero readers and zero rows, there is no consumer to break and no data to migrate, so the canonical long-form values are adopted at no cost. `rule_autonomy_rung` wins on a substantive ground, not a coin flip: post-collapse the rung lives on `rule_registry`, so a `vendor_`-prefixed name (`vendor_rule_rung`) would name a registry-level concept after one of its backing tables — it is actively wrong.

**Amends ADR-0017.** ADR-0017's `vendor_rule_rung` naming on this column is superseded by `rule_autonomy_rung` on `rule_registry.current_rung`. This is an amendment (ADR-0017 otherwise stands); recorded via `related: ["0017"]` and the paired ADR-0022 status-clause edit applied to ADR-0017 at ratification.

**Alternative rejected.** *Amend ADR-0017 to ratify `autonomy_tier`/`vendor_rule_rung` as canonical.* Rejected — keeps a `vendor_`-scoped name for a registry-level column and the short value variants the spec already moved away from.

### 5. Single-writer service boundaries

**The call.** Three service boundaries defined fresh at Ring 1, disjoint by table, mirroring Reading B from `ledger_truth_model.md`:
- `ruleRegistryService` — sole writer for `rule_registry`.
- `ruleTrackRecordService` — sole writer for `rule_track_records`.
- `vendorRuleService` — sole writer for `vendor_rules`.

All three ship **defined-but-inert** at Ring 1; no v1 caller exercises them. This matches the verification finding that `vendor_rules` has zero writers at HEAD — these are greenfield boundaries, not a "preserve the existing writer" exercise.

**Co-creation rule (named deviation from strict single-writer).** `ruleRegistryService` creates the `rule_registry` row **and** the corresponding `rule_track_records` row in the **same transaction**, to enforce the 1:1 invariant. `ruleTrackRecordService` is the sole writer for all **updates** to `rule_track_records` after creation. Creation is co-owned with `ruleRegistryService`; this is an explicit, documented deviation from strict single-writer — named here so it is not read as a violation later.

**Cross-table reads.** Either service may perform read-only joins across the two tables; neither writes outside its own table. The Stage 1 canvas (Ring 2A) joining `rule_registry` + `rule_track_records` is a read-side concern, not a writer-boundary violation. Default: `ruleRegistryService` owns identity-anchored reads (including the CTI join to `vendor_rules`); `ruleTrackRecordService` owns counter reads.

**`created_by` actor-reference standard.** `rule_registry.created_by` is `uuid REFERENCES auth.users(id)` per ADR-0007 Q78 / Path X (verification §3). The human/system distinction is carried at the service-context layer (`caller.user_id` null + `caller.system_actor` string) and collapses to the seeded service-account uuid (`SYSTEM_ACTOR_USER_ID`) at write time — system-proposed rules attribute via the `withInvariants` service-account adaptation. **No `actor_type` column.** ADR-0017's `created_by text` is drift; this ADR supersedes it on that column (amendment, per Decision 4's mechanism).

### 6. Reserve enums, columns, and audit-event vocabulary

Per ADR-0010 three-layer reserved-enum-states discipline. The migration creates the enums; the reservation is the full closed value set shipped at schema time.

**Created and load-bearing at Ring 1** (a `rule_registry` / `vendor_rules` column consumes each):

- **`rule_type`** (§5.3) — `pattern`, `temporal`, `inferential`. *(consumes: `rule_registry.rule_type`)*
- **`rule_lifecycle_state`** (§5.8) — `proposed`, `active`, `demoted`, `retired`. *(consumes: `rule_registry.lifecycle_state`)*
- **`rule_autonomy_rung`** (§5.1 / §6; Decision 4) — `always_confirm`, `notify_and_auto_post`, `silent_auto`. *(consumes: `rule_registry.current_rung`; v1 emits only `always_confirm`)*
- **`bundle_type`** (ADR-0012 §12; verification §1) — `born_paid_bill` (v1 active), `final_invoice_with_applied_deposit` (reserved), `vendor_credit_applied_to_bill` (reserved). *(consumes: `vendor_rules.bundle_type`)* The three further candidates ADR-0012 §12 names (`intercompany_due_to_due_from`, `multi_entity_payment_split`, `vendor_credit_with_refund`) are explicitly **excluded** from the v1 enum by §12 itself.

**Created and reserve-only at Ring 1** (closed grammar from the ratified spec; no Ring 1 column consumes them, but they ship per ADR-0010 so generated types carry the closed set):

- **`condition_type`** (§5.5) — `field_equals`, `field_in_range`, `field_outside_range`, `field_in_set`, `field_matches_pattern`, `source_trigger_equals`, `schedule_matches`, `cadence_matches`, `semantic_match_above_threshold`, `category_classification_matches`. *(10)*
- **`action_type`** (§5.6) — `auto_post_at_rung_2`, `auto_post_at_rung_3`, `suggest_with_required_approval`, `route_to_exception_queue_with_reason`, `block_with_reason`. *(5)*
- **`trigger_type`** (§5.4) — `proposed_mutation_generated`, `proposed_mutation_bundle_generated`, `scheduled_time_occurs`, `external_event_ingested`, `user_drag_drop`, `user_form_submit`, `user_palette_action`, `agent_proposal`. *(8)*

**Reserved `org_settings.*` columns** (§8.4) — added nullable to the existing `org_settings` table (verification: table exists, migration `20240158`):

- `default_initial_rung_for_new_rules` — `rule_autonomy_rung NULL` (reuses the enum above; v1 value is always `always_confirm`).
- `rule_proposal_threshold` — `integer NULL`.
- `rule_type_preference` — closed enum `pattern_preferred | temporal_preferred | inferential_preferred | no_preference`.
- `agent_verbosity_for_rules` — closed enum `terse | standard | educational`.

The two columns carrying their own closed value sets (`rule_type_preference`, `agent_verbosity_for_rules`) ship as dedicated enum types per ADR-0010; `default_initial_rung_for_new_rules` reuses `rule_autonomy_rung`.

**Reserved audit-event vocabulary** (§8.5) — a **string vocabulary on `audit_log.action` (`text`), NOT an enum** (verification §1d). No migration extends `action`; this ADR documents the reserved event names so emitters at Ring 2 use the canonical strings:

`rule_proposed`, `rule_activated`, `rule_promoted`, `rule_demoted`, `rule_retired`, `rule_proposal_rejected`, `rule_evaluated`, `rule_match_confirmed`, `rule_match_rejected`, `rule_guardrail_fired`, `rule_guardrail_confirmed`, `rule_guardrail_resolved_into_primary_bounds`, `rule_refinement_proposed`, `rule_refinement_rejected`, `rule_metadata_updated`. *(15)*

**Audit payload caveat (explicit, so a future implementer does not default-stuff traces).** `rule_evaluated` is intended to carry `MatchResult.evaluation_trace`, but `audit_log` has only `before_state jsonb` and `after_state_id uuid` — **no general payload column**. Ring 1 reserves the event **name only**. **Ring 2 must decide where `evaluation_trace` lives before emitting `rule_evaluated`**; it must not assume an audit payload column exists, and must not stuff traces into `before_state` by default.

---

## Migration sketch (ordered DDL outline — not executable SQL)

The executable migration is a separate pass after ratification. Order:

a. **Create new enums** — `rule_type`, `rule_lifecycle_state`, `rule_autonomy_rung`, `bundle_type`, `condition_type`, `action_type`, `trigger_type`, plus the two `org_settings` value-set enums (`rule_type_preference`, `agent_verbosity_for_rules`). All ship full closed membership per Decision 6.
b. **Create `rule_registry`** — columns per Decision 1, self-FKs for predecessor/successor.
c. **Create `rule_track_records`** — columns per Decision 2; `rule_id` PK + FK to `rule_registry(id) ON DELETE CASCADE`.
d. **Backfill `rule_registry` (+ co-created `rule_track_records`) from `vendor_rules`** — for each existing row: `id = rule_id`, `rule_type = 'pattern'`, `lifecycle_state` from `approved_at` (`approved_at IS NOT NULL → 'active'` else `'proposed'`), `current_rung` mapped from `autonomy_tier` (`always_confirm→always_confirm`, `notify_auto→notify_and_auto_post`, `silent→silent_auto`), `created_by`/`created_at` carried over, `name = NULL`; insert the all-zero `rule_track_records` row. **No-op in reproducible environments** (`vendor_rules` empty — verification §1a); retained as an idempotent safety step.
e. **Alter `vendor_rules`** — add `bundle_type bundle_type NOT NULL`; add `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT` (nullable, no default); add the FK from `rule_id` to `rule_registry(id)`; drop the now-redundant `created_at`/`created_by` copies (rule-identity audit lives on `rule_registry`).
f. **Create the expression unique index** on `vendor_rules (org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type)` per Decision 3.
g. **Drop** `vendor_rules.autonomy_tier` column, then **drop** the `autonomy_tier` enum type (after the §d backfill).
h. **Add reserved `org_settings` columns** (nullable) per Decision 6 / §8.4.

(The substrate-mod test-staleness review per `.claude/rules/migrations.md` fires at migration-authoring time — broadening enums / dropping a type / new unique index all qualify.)

---

## Non-decisions

This ADR explicitly does **not**:

- Define any predicate JSON schema or Branch/Condition storage shape beyond the reserved enums. The `triggers` / `applies_to_intent_types` / `applies_to_source_triggers` registry columns (§5.10) are deferred to the Branch/eligibility ring (Decision 1 note).
- Implement an evaluator. Conflict resolution, the pure-core `MatchResult`, and the Agent Ladder gate are Ring 2A.
- Build the 30-day windowed read model for the canvas (Q-RC-AT-1 — Ring 2A).
- Change audit-payload storage. Only the event-name vocabulary is reserved (Decision 6 caveat).
- Build the Stage 1 canvas UI (Ring 2A).
- Integrate any service caller. All three services ship defined-but-inert.
- Establish or modify an INV-ID. Substrate is inert at Ring 1; the enforced invariant lands when Ring 2 wires the evaluator.

---

## Consequences

**Enables.**
- The §10 / §5.10 source-of-truth language holds **literally** from Ring 1: the registry owns `current_rung`, and no v1 service path consumes it for an autonomy decision (the collapse is real, not staged).
- Ring 2A's rung consumers read `rule_registry.current_rung`; the don't-resurrect-`autonomy_tier` discipline carries forward as a standing note.
- The `COALESCE(scoped_fk, org_id)` expression-unique-index pattern becomes project-canon for the "scoped FK in a unique constraint, app-layer-defaulted to org_id" shape; future tables follow it instead of re-deriving.
- ADR-0017 is reconciled completely (not partially): the registry/track-record split, the `bundle_type` enum + column + constraint, the `legal_entity_id` column, and the enum-naming/`created_by` amendments all land in one migration.

**Constrains / costs.**
- `rule_evaluated`'s event-name reservation **requires** Ring 2 to settle audit-payload storage before emitting — a named dependency, not a free reservation.
- Creating the `bundle_type` enum pulls a slice of ADR-0012 §12 substrate into Ring 1 (the enum was unmigrated). This is deliberate — partial reconciliation would re-create the drift Ring 1 fixes — but it is a real scope reach beyond the rule core, surfaced for CTO acknowledgment.
- The co-creation rule (Decision 5) is a deviation from strict single-writer; it is named and bounded (creation only; updates stay single-writer) but is a complexity the reader must hold.
- Seven new enums + three reserve-only enums show up in generated types immediately while remaining inert — generated-type surface grows ahead of consumers (the ADR-0010 reserved-state cost, accepted).

---

## Open questions

Carried forward for CTO or product/UX input; none blocks ratification of the substrate calls above.

1. **`bundle_type` scope acknowledgment (CTO).** Creating the `bundle_type` enum in Ring 1 reaches into ADR-0012 §12 territory. The value set is verified (verification §1); the scope reach itself wants explicit CTO sign-off at ratification.
2. **Q-RC-AT-1 windowed read path (product/UX + Ring 2A).** Materialized view vs derived read vs the deferral chosen here. The §7 freshness bar ("fresh-enough-to-be-useful") is the acceptance criterion whichever path Ring 2A picks.
3. **Q-RC-AT-2 UI label (product/UX).** `last_winning_match_at` ships as a column; "last matched" / "last applied" both collide with existing vocabulary, so the canonical UI label is deferred.
4. **INV-ID assignment (Ring 2).** When the evaluator lands and the substrate becomes enforced, the relevant INV-ID(s) and their `invariants:` frontmatter entry are assigned then.
5. **Vendor-rule audit-column disposition (migration pass).** Decision 1 leans drop of the redundant `vendor_rules.created_at`/`created_by`; the migration pass confirms no downstream reader depends on the `vendor_rules`-local copies (verification §1a shows zero writers, strongly implying zero readers, but the migration pass re-checks).

---

## Cross-references

- `docs/02_specs/rule-type-core.md` (V3.2) — §5 (closed grammar), §6 (Agent Ladder rungs), §8.4 (`org_settings` reservations), §8.5 (audit vocabulary), §10 (Ring 1 decision enumeration), §5.10 (source-of-truth allocation).
- `docs/09_briefs/post-mvp/2026-05-26-ring1-substrate-brainstorm.md` — empirical HEAD pass + decision map.
- `docs/09_briefs/post-mvp/2026-05-26-ring1-pre-adr-verification.md` — `bundle_type` value set, `legal_entity_id` precedent, actor-reference standard.
- ADR-0017 (`0017-vendor-template-substrate.md`) — **amended** here on enum naming + `created_by` shape (`related`).
- ADR-0012 §12 — `bundle_type` enum membership.
- ADR-0007 §Q78 / Path X — actor-reference standard (`created_by uuid → auth.users(id)` + service-account attribution).
- ADR-0010 — reserved-enum-states discipline (the reservation in Decision 6).
- ADR-0011 §10 — `legal_entity_id` multi-entity reservation precedent (nullable, defaults to `org_id` in v1); silent on the FK-target trajectory (re-sourced at Decision 3).
- ADR-0015 §2 — `clean_approval_count` forward-pointer, satisfied here on `rule_track_records` (Decision 2).
- ADR-0021 §4 — pre-ratification design-spec lifecycle (why this file is a design spec, not a `proposed` ADR).
- ADR-0022 — amend-vs-supersede workflow (the ADR-0017 amendment status-clause edit applied at ratification).

---

*Pre-ratification design spec. The ADR-0023 file (`status: ratified`) is authored from this spec at CTO ratification. Not committed; not pushed.*
