# Ring 1 Substrate — Brainstorm Pass

**Date:** 2026-05-26
**Status:** Brainstorm (not the ADR draft; not committed). Decision-map + tradeoff surface for the Ring 1 substrate ADR.
**HEAD anchor:** `baeeb862` (`docs(spec): close petition voice — Q-RTC-1 + §14 phrasing`), branch `staging`.
**Canonical inputs:** spec `docs/02_specs/rule-type-core.md` (V3.2, ratified); `docs/07_governance/adr/0017-vendor-template-substrate.md`; `docs/09_briefs/post-mvp/2026-05-25-rule-core-access-and-tuning-brief.md`.

Scope: substrate-only at v1. Out of scope: rule semantics (ratified at V3.2), the ADR draft itself, the seven banked commits, anything push-related.

Voice note: propose voice, not constitutional voice. Where disk grounds a single answer this doc lands it; where it doesn't, it surfaces the tradeoff and says so.

---

## 1. Empirical HEAD pass

Everything below was run at `baeeb862`. Tradeoff analysis in §2–§7 runs against these findings, not against spec/ADR prose. The single most consequential finding is that **the autonomy / track-record / multi-entity substrate ADR-0017 describes in prose was almost entirely never migrated** — the live `vendor_rules` table is a 9-column shell. Ring 1 is reconciling a large drift, not a cosmetic one.

### Live `vendor_rules` (ground truth)

`supabase/migrations/20240101000000_initial_schema.sql:347-357`:

```sql
CREATE TABLE vendor_rules (
  rule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  default_account_id  uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier       autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_vendor_rules_org_vendor ON vendor_rules (org_id, vendor_id);
```

`autonomy_tier` enum (`:47-51`): `always_confirm | notify_auto | silent`.

**Corrections to the prompt's framing, grounded here:**

- **PK is `rule_id`** ✓ — the prompt is right, ADR-0017 *text* is the drifted one (its schema block says `id uuid primary key`). The CTI plan `rule_registry.id ← vendor_rules.rule_id` lands on the existing PK with no rename.
- **Live table = 9 columns.** ADR-0017 text describes ~18 (`current_rung`, `clean_approval_count`, `last_clean_approval_at`, `rejection_count`, `last_rejection_at`, `bundle_type`, `legal_entity_id`, `promotion_authority`, `promoted_at/by`, `demoted_at/by`, `trace_id`, the unique constraint). None of it shipped. The rung column is even named differently (`autonomy_tier`, not ADR-0017's `current_rung`), and `created_by` is `uuid` not ADR-0017's `text`.

### (a) vendor_rules writers — **zero, including seed**

```
$ rg -n "from\(['\"]vendor_rules['\"]\).*(insert|update|upsert|delete)|INSERT INTO vendor_rules|UPDATE vendor_rules|DELETE FROM vendor_rules" apps/web/src supabase/
  (no matches)

$ rg -n "vendor_rules" apps/web/src supabase/        # all references
  apps/web/src/db/types.ts:2979,3015,3022,3029        # generated types only
  apps/web/src/agent/memory/orgContextManager.ts:43   #   vendor_rules: never[];
  apps/web/src/agent/memory/orgContextManager.ts:166   #   vendor_rules: [],   (reserved-empty)
  supabase/migrations/20240101000000_initial_schema.sql  # DDL + RLS + index only

$ rg -n "vendor_rules" -g '*.sql' -g '*.ts' -g '*.js' --glob '!.../types.ts' . | rg -i "insert|seed|\.from\("
  (no matches)   # no seed.sql, no seed inserts anywhere; supabase/ holds only config.toml + migrations
```

**Finding:** no code path writes `vendor_rules`. Not services, not seeds, not tests. The `orgContextManager` reference is a reserved-empty `never[]`. **Consequence:** in any reproducible environment the table is empty, so the "backfill once from `autonomy_tier`" step in Decision 1 is a no-op. And `vendorRuleService` (Decision 5) is greenfield-inert, not "preserve the existing sole writer" — there is no existing writer.

### (b) autonomy_tier readers — **zero outside types**

```
$ rg -n "autonomy_tier" apps/web/src | rg -v "types|\.test\.|\.spec\.|__tests__|/tests/"
  (no matches)

$ rg -n "autonomy_tier" apps/web/src supabase/        # full set
  supabase/migrations/20240101000000_initial_schema.sql:47,352   # TYPE def + column def
  apps/web/src/db/types.ts:2983,2994,3005,3300,3683              # generated types only
```

**Finding:** the only references are the DDL and generated types. No source read, no view, no scheduled job, no Agent Ladder gate. **The source-of-truth collapse holds with no caveat** — there is no live autonomy consumer to sequence around. Lean to **DROP** `autonomy_tier` in the Ring 1 migration (not dormant-deprecate); dormant only becomes relevant if a reader surfaces that this grep missed (none did).

### (c) source_document_links — **built and consumed (not reserved)**

```
$ rg -n "from\(['\"]source_document_links['\"]\)|INSERT INTO source_document_links" apps/web/src supabase/
  apps/web/src/services/document-platform/documentLinkService.ts:185   .from('source_document_links')
  apps/web/src/services/document-platform/documentRouterService.ts:374  .from('source_document_links')
  supabase/migrations/20240147000000_source_document_links_substrate.sql:296  INSERT INTO ...
  # plus reads in billService.ts, ProposedAttachmentCard.tsx, candidate schema
```

**Finding:** `source_document_links` is a live, written, read table — not reserved substrate. This *strengthens* §5.10's "considered and rejected: polymorphic spine" argument: it's a real, in-use pattern whose justification (genuinely heterogeneous link targets — bills, payments, vendors, JEs) does not transfer to rules. The rejection is "don't copy a live pattern's shape without importing its justification," which is the right framing precisely because the pattern is live and well-understood, not theoretical.

### (d) audit-event write path — **live; rule-event corpus empty; `action` is text**

```
$ rg -ni "create table .*audit" supabase/
  supabase/migrations/20240101000000_initial_schema.sql:484  CREATE TABLE audit_log (...)

$ rg -n "from\(['\"]audit_log['\"]\)" apps/web/src
  services/audit/recordMutation.ts:147   .from('audit_log').insert({...})
  services/auth/authEvents.ts:13,31       .from('audit_log').insert({...})

$ rg -n "rule_evaluated|rule_metadata_updated" apps/web/src supabase/
  (no matches)
```

`audit_log` shape (`:484-498`): `audit_log_id, org_id, user_id, session_id, trace_id, action text NOT NULL, entity_type text NOT NULL, entity_id, before_state jsonb, after_state_id uuid, tool_name, idempotency_key, created_at`.

**Findings:**
- The audit write path **is live** (`recordMutation` is the canonical writer; `authEvents` writes auth events).
- `action` is **`text`, not a Postgres enum.** So the spec's rule audit event types (§8.5) reserve as a *string vocabulary*, not as enum values needing a migration. Nothing to "extend" — Ring 1 reserves them by documenting them.
- **No `rule_evaluated` / `rule_metadata_updated` rows are emitted at HEAD** (zero references → zero emitters). This conditions Q-RC-AT-1/2/3: a derived read "from the `rule_evaluated` audit corpus" has **no corpus at v1** until the Ring 2 evaluation path emits those events. (See §3.)

### (e) Judgment checks beyond the §10 list

- **`bundle_type` enum does not exist at HEAD.**
  ```
  $ rg -n "bundle_type" supabase/migrations/        →  (no matches)
  ```
  ADR-0017's `bundle_type` column references the `bundle_type` enum "from ADR-0012 §12." That enum was never migrated. **This is the most important unflagged finding:** Decision 3's `bundle_type` column and the `(org_id, legal_entity_id, vendor_id, bundle_type)` unique constraint cannot be created without first creating the enum. Decision 3 is therefore not "straight satisfy ADR-0017 as written" — it carries an unmet substrate prerequisite. See §4.

- **All eight candidate rule enums are greenfield.**
  ```
  $ for t in rule_type rule_lifecycle_state condition_type action_type trigger_type \
             rule_autonomy_rung vendor_rule_rung promotion_authority; do
      rg -c "CREATE TYPE $t " supabase/migrations/ ; done
  →  none, for all eight
  ```
  Notably `vendor_rule_rung` (ADR-0017's enum name) was **never created** — only `autonomy_tier` exists. So Decision 4's naming choice is genuinely three-way (§5).

- **`org_settings` exists** (`20240158000000_phase_7_org_settings_substrate.sql:53`, 11 reserved columns). §8.4's reservations land as ADD COLUMN on a real table.

- **No `legal_entities` table.** The codebase models `legal_entity_id uuid REFERENCES organizations(org_id)` (v1 1:1 org↔entity), with precedent in `source_documents` (ADR-0011 §10), `vendor_credits` (`20240156`), and `vendor_prepayment` (`20240138`). Decision 3's `legal_entity_id` column should follow that exact pattern, defaulting to `org_id` in v1.

- **All four services greenfield.** `apps/web/src/services/` has no `rules/` or `vendor/` directory; `vendorRuleService` / `ruleRegistryService` / `ruleTrackRecordService` / `ruleEvaluationService` return zero matches.

---

## 2. Decision 1 — Registry shape

**Ship `rule_registry` at Ring 1.** Class-table inheritance: `rule_registry.id ← vendor_rules.rule_id`, 1:1 FK on the existing PK (confirmed `rule_id` on disk). Registry owns identity, `name`, `rule_type`, `lifecycle_state`, `current_rung`, `triggers`, `applies_to_intent_types`, audit anchors, `predecessor_rule_id`/`successor_rule_id` (per §5.10). `current_rung` is source-of-truth from creation.

**Lead argument (self-demonstrating).** The disk evidence makes the lead argument stronger than the prompt assumed. ADR-0017 didn't drift by a few columns — its entire autonomy/track-record/multi-entity substrate (≈9 of its ≈18 described columns, plus the rung column name, plus the unique constraint) was never built. That *is* the failure mode Ring 1 exists to fix: substrate described in prose as if consumed, never migrated, canon and disk diverging silently. Deferring `rule_registry` parks the registry's cross-cutting metadata on `vendor_rules` "for now" with a known-future migration to move it — i.e., it plants the seed of the next ADR-0017 while reconciling the current one. The cheapest way to not repeat the drift is to not create a second instance of it.

**Backfill is a no-op.** The prompt frames Decision 1 as "backfilled once from existing `autonomy_tier` values." Per §1(a), `vendor_rules` has no writer and is empty in any reproducible environment, so there is nothing to backfill. Include the backfill `INSERT ... SELECT` as forward-safety (idempotent, harmless if a manual row exists on a live DB), but it does no work. This removes the only piece of Decision 1 that smelled like transition machinery.

**Steelman for defer (§5.10 names it).** "Premature abstraction with one backing table; the second-materialization ADR is the natural home for the split." Honest weight: defer is genuinely cheaper *this week*.

**Disarming the steelman.** YAGNI targets *polymorphic dispatch* — a `RULE_BACKING_TABLE_MAP`-style runtime dispatcher across heterogeneous tables (the §5.10-rejected spine). CTI is not that. CTI is one table + a 1:1 FK + a discriminator, queried per-table, no dispatch layer. The thing you build early is *one table and one writer service* — and §1 shows that table's contents are mostly ADR-0017 columns you owe anyway. The premature-abstraction objection would bite if Ring 1 were building the dispatcher; it isn't.

**§10-vs-§5.10 tension is paper-only post-collapse.** §1(b) confirms zero live autonomy consumers. "Diagnostic-only at v1" holds because nothing reads rungs at v1; "registry owns `current_rung`" holds because the registry is the only place `current_rung` lives. The two statements describe the same inert column from two angles; they don't conflict on disk.

**Open / reopen trigger.** The collapse is confirmed for this HEAD. If a later pass surfaces *any* live `autonomy_tier` reader (production path, view, cron, RLS predicate), the (i)-diagnostic-vs-(ii)-owned tradeoff lattice reopens and this decision must be revisited. As of `baeeb862`: none exists.

**Load-bearing enums at Ring 1.** Note for §7: `rule_registry` has `rule_type`, `lifecycle_state`, and `current_rung` columns, so the `rule_type`, `rule_lifecycle_state`, and `rule_autonomy_rung` enums are **created-and-used at Ring 1**, not reserve-only.

---

## 3. Decision 2 — `rule_track_records` shape

**Ship at Ring 1.** New table keyed by `rule_id` (FK to `rule_registry.id`), holding the denormalized TrackRecord counters per §5.10: `clean_approval_count`, `rejection_count`, `guardrail_fire_count`, `guardrail_confirmed_count`, `guardrail_resolved_into_primary_bounds_count`, `last_clean_approval_at`, `last_rejection_at`, `last_guardrail_fire_at`, and (for inferential) `model_version`.

**The easy yes that anchors the narrative.** Standalone justification independent of the registry debate: isolating hot counter-writes off the rule-identity row is good practice with one backing rule table or five. It also resolves ADR-0017's `clean_approval_count` cleanly — the counter lands here, *not* on `vendor_rules` (which avoids re-creating the very "interim column, migrate later" move Decision 1 argues against).

**Open — Q-RC-AT-1 (windowed read path).** The Stage 1 canvas wants a last-30-day indicator; `clean_approval_count` is cumulative. Three shapes:
- **(a) Materialized view** on `rule_track_records` + `audit_log` rule events. Fast reads; refresh cadence must meet the §7 freshness bar ("fresh-enough-to-be-useful," real-time/near-real-time, *not* daily-batch). A matview on a refresh schedule risks failing that bar.
- **(b) Derived read** from the `rule_evaluated` audit corpus at query time. Honors substrate-only posture (no new state) and is always fresh. **But §1(d): the corpus is empty at HEAD** — no `rule_evaluated` rows until the Ring 2 evaluation path emits them. So (b) is *defined* at Ring 1 but *inert* until Ring 2, which is consistent with substrate-only posture as long as the brainstorm says so.
- **(c) Defer** to Ring 2A alongside the canvas consumer.

Lean: **don't build the windowed read in Ring 1's migration.** Reserve the shape (likely (b), a parameterized query over `audit_log WHERE action='rule_evaluated'`), document the freshness bar as its acceptance criterion, and let Ring 2A — which owns the canvas consumer *and* the event emitter — build it against a real corpus. Building a matview now means tuning a refresh cadence against zero rows. Surfaced, not resolved; flag for product/UX + Ring 2A scoping.

**Open — Q-RC-AT-2 (last winning match).** Semantic is pinned by the brief: "most recent evaluation where `winning_rule_id = this.rule_id`." Two shapes:
- **Stored `last_winning_match_at` column** on `rule_track_records`. Simplifies the read path and the canvas indicator; one timestamp column; the consumer exists in Ring 2A.
- **Derived read** from `rule_evaluated` audit events. Honors substrate-only posture — but, again, §1(d): no corpus at v1, and the derived read needs the same freshness handling as Q-RC-AT-1.

Lean: **stored column.** The consumer is real (Ring 2A canvas), the cost is one `timestamptz`, and the derived alternative is inert until the audit corpus fills. Storing it also decouples the indicator from whatever path Q-RC-AT-1 settles on. Tradeoff surfaced; not blocking.
*Label is a product/UX sub-question* — "last matched" collides with `also_matched_rules` (losers), "last applied" collides with ledger-posting. The brief uses the descriptive phrase without committing; Ring 1 stores the column, UX names the label.

**Open — counter set at v1.** §5.10 names the full counter set above. Ship the full set as reserved columns (ADR-0010 reserved-state discipline; they're inert until Ring 2 emitters write them). One sub-question: `model_version` is inferential-only — keep it nullable on the shared table (lean) vs. split inferential counters to a child table (over-engineered for one nullable column). Lean: nullable column on the shared table.

---

## 4. Decision 3 — ADR-0017 drift reconciliation

Post-collapse, three items survive on `vendor_rules` (the fourth, `clean_approval_count`, lands on `rule_track_records` per Decision 2):

1. **`bundle_type` column** per ADR-0017 text.
2. **`legal_entity_id` column** per ADR-0017 text.
3. **`(org_id, legal_entity_id, vendor_id, bundle_type)` unique constraint** per ADR-0017 text.

The prompt expected this to be a confirmation pass ("confirm types, confirm constraint name, confirm nothing breaks downstream"). The downstream-break check is clean — §1(a) shows zero readers/writers of `vendor_rules`, so adding columns breaks nothing. **But the confirmation pass surfaced a hard prerequisite the prompt didn't anticipate:**

**`bundle_type` enum does not exist (§1e).** The `bundle_type` column types against the `bundle_type` enum "from ADR-0012 §12," which was never migrated. The dependency chain: the unique constraint needs the `bundle_type` column, which needs the `bundle_type` enum. So Decision 3 is a scope fork, not a confirmation:

- **Option A — create the enum in Ring 1, reconcile ADR-0017 fully.** `CREATE TYPE bundle_type AS ENUM (...)` with the full closed set (ADR-0017's rationale cites v1-active `born_paid_bill`; reserved `final_invoice_with_applied_deposit`, `vendor_credit_applied_to_bill` — *verify against ADR-0012 §12 at ADR-draft time*), then add the column + constraint. Pulls ADR-0012 enum-creation into Ring 1 scope, but it's a 3-value enum, and it keeps Ring 1's ADR-0017 reconciliation *complete*. **Consistent with Decision 1's logic:** partial reconciliation (ship `legal_entity_id`, defer `bundle_type` + constraint) re-creates the exact "interim, migrate later" drift Decision 1 argues against — leaving the multi-entity uniqueness ungated.
- **Option B — defer `bundle_type` column + unique constraint; ship `legal_entity_id` alone.** Smallest Ring 1, but partial ADR-0017 reconciliation and an ungated uniqueness invariant. Self-inconsistent with Decision 1.
- **Option C — redefine the v1 constraint without `bundle_type`** (e.g., `(org_id, legal_entity_id, vendor_id)`). Contradicts ADR-0017 text; needs an ADR-0017 amendment. Not recommended without explicit cause.

**Lean: Option A,** flagged as a scope expansion for CTO acknowledgment (it reaches into ADR-0012 territory). It's the only option consistent with Decision 1's "don't plant the next drift" argument. Confirm the `bundle_type` value set against ADR-0012 §12 before the migration is drafted (the brainstorm couldn't, because ADR-0012 §12 wasn't in this pass's read set — see §8).

**`legal_entity_id` shape (grounded).** Disk has no `legal_entities` table; the canonical pattern is `legal_entity_id uuid REFERENCES organizations(org_id)`, v1-defaulted to `org_id` (precedent: `source_documents` ADR-0011 §10, `vendor_credits` `20240156`, `vendor_prepayment` `20240138`). Use that exact shape. Nullable at schema level per the precedent; v1 service path populates with `org_id`.

**Don't-resurrect-`autonomy_tier` note (forward to Ring 2A).** Ring 2A's rung consumers read `rule_registry.current_rung`, never a resurrected `vendor_rules.autonomy_tier`. This is a "don't un-drop the dormant column" note for the ADR, not a Ring 1 acceptance criterion.

---

## 5. Decision 4 — Enum naming reconciliation

**Three-way naming, grounded (§1e):**

| Source | Enum name | Values |
|---|---|---|
| Live schema | `autonomy_tier` | `always_confirm \| notify_auto \| silent` |
| ADR-0017 *text* | `vendor_rule_rung` | `always_confirm \| notify_and_auto_post \| silent_auto` |
| Spec §10 instruction | `rule_autonomy_rung` | (canonical, per §5.1/§5.10) |

The prompt attributed `rule_autonomy_rung` to ADR-0017; on disk ADR-0017 says `vendor_rule_rung`. Neither ADR-0017 name was ever migrated — only `autonomy_tier` exists. So this is a clean pick, no live consumer to break.

**Recommendation:**
- **Enum type name: `rule_autonomy_rung`** (spec §10). Decisive argument from the collapse: the rung now lives on `rule_registry`, not `vendor_rules`, so a `vendor_`-prefixed name (`vendor_rule_rung`) is actively *wrong* — it would name a registry-level concept after one of its backing tables. `rule_autonomy_rung` is correctly scoped to the registry. This is a *reason to prefer the spec's name over ADR-0017's*, not just a coin flip; the ADR draft should note it reconciles the spec/ADR-0017 name divergence in the spec's favor, with this rationale.
- **Column name on `rule_registry`: `current_rung`** (spec §5.10).
- **Values: the canonical long set** `always_confirm | notify_and_auto_post | silent_auto`. The live short variants (`notify_auto`, `silent`) lose: spec and ADR-0017 both use the long forms, the long forms are self-describing, and there's zero data to migrate (§1a/b — empty table, no readers), so adopting them costs nothing.
- **`autonomy_tier`: DROP** in the Ring 1 migration. §1(b) confirms zero readers; dormant-deprecation buys nothing and leaves a misleading column. Drop the column, then drop the enum type. (Dormant only if a future reader surfaces — none at `baeeb862`.)
- **Reserved rung values:** all three rungs are named in `agent_autonomy_model.md` §4 and ship in the closed enum at Ring 1 per ADR-0010 (only `always_confirm` is emitted at v1). No rung beyond these three is implied by §6 / ADR-0017, so no *additional* reserved values are needed. Verify against §6 + ADR-0017 at ADR-draft time (this pass found three, fully enumerated, no implied fourth).

---

## 6. Decision 5 — Single-writer rules

Post-collapse this is **greenfield**, not "preserve the existing sole writer" — §1(a) confirms `vendor_rules` has no writer of any kind today. Define three services from scratch, disjoint by table (Reading B from `ledger_truth_model.md`). Likely home: a new `apps/web/src/services/rules/` directory (none exists today).

- **`ruleRegistryService`** — sole writer for `rule_registry`.
- **`ruleTrackRecordService`** — sole writer for `rule_track_records`.
- **`vendorRuleService`** — sole writer for `vendor_rules`.

**`vendorRuleService` posture (conditioned on §1a — finding is: no current writer).** Since there is no existing writer to ratify or refactor, `vendorRuleService` ships **defined-but-inert** at Ring 1, mirroring the registry/track-records substrate-only posture. The ADR does *not* need to cite-and-ratify an existing writer (option a) or refactor one through a new boundary (option b); both were conditioned on a writer existing, and none does. Define the service boundary and its write methods; no v1 caller exercises them. This is the cleanest of the three branches the prompt anticipated.

**Reading-side discipline.** Single-writer governs writes; name the read patterns too:
- `ruleRegistryService` owns reads anchored on rule identity (lookup by `rule_id`, by `vendor_id` via the CTI join to `vendor_rules`, lifecycle/rung reads).
- `ruleTrackRecordService` owns counter reads.
- **Cross-table reads** (the Stage 1 canvas joining `rule_registry` + `rule_track_records`, and the CTI join `rule_registry ⋈ vendor_rules`) are **read-only and either service may perform them**, provided no service *writes* outside its own table. Lean: register the canvas join under `ruleRegistryService` (it anchors on rule identity); if a join grows into a distinct read concern with its own shape, promote it to a read-only query function then — don't pre-build a separate read service for one join. Surfaced; the conservative default (registry owns identity-anchored reads, track-records owns counter reads) needs no new abstraction at Ring 1.

---

## 7. Reservation appendix (enumerate only; no migration drafted)

Per ADR-0010 three-layer defense. **Important distinction surfaced by §1:** some of these are *load-bearing at Ring 1* (a registry column uses them, so Ring 1 creates the enum), the rest are *reserve-only* (no Ring 1 column consumes them).

### Enums

**Load-bearing at Ring 1 (created + used by `rule_registry`):**

- **`rule_type`** (§5.3) — `pattern`, `temporal`, `inferential`. *(3; `rule_registry.rule_type`.)*
- **`rule_lifecycle_state`** (§5.8) — `proposed`, `active`, `demoted`, `retired`. *(4; `rule_registry.lifecycle_state`.)*
- **`rule_autonomy_rung`** (§5.1/§5.10; see Decision 4) — `always_confirm`, `notify_and_auto_post`, `silent_auto`. *(3; `rule_registry.current_rung`. v1 emits only `always_confirm`.)*

**Reserve-only (no Ring 1 column consumes these; Branch/condition substrate is not in Ring 1's five decisions):**

- **`condition_type`** (§5.5) — `field_equals`, `field_in_range`, `field_outside_range`, `field_in_set`, `field_matches_pattern`, `source_trigger_equals`, `schedule_matches`, `cadence_matches`, `semantic_match_above_threshold`, `category_classification_matches`. *(10.)*
- **`action_type`** (§5.6) — `auto_post_at_rung_2`, `auto_post_at_rung_3`, `suggest_with_required_approval`, `route_to_exception_queue_with_reason`, `block_with_reason`. *(5.)*
- **`trigger_type`** (§5.4) — evaluation: `proposed_mutation_generated`, `proposed_mutation_bundle_generated`; proposal-source: `scheduled_time_occurs`, `external_event_ingested`, `user_drag_drop`, `user_form_submit`, `user_palette_action`, `agent_proposal`. *(8.)*

*Open sub-question for the ADR draft:* whether Ring 1 physically `CREATE TYPE`s the three reserve-only enums now (ADR-0010 reserved-enum-states discipline says yes — ship the closed set at schema time) or defers them to the Branch-substrate ring that first adds a consuming column. Per ADR-0010 precedent (e.g., `bundle_type`, `exception_reason` shipping full reserved sets), lean **create now**; but unlike the load-bearing three, deferring these breaks nothing at Ring 1. Surfaced, not landed.

### Post-v1 `org_settings.*` columns (§8.4) — reserve on the existing `org_settings` table

- `default_initial_rung_for_new_rules` — closed enum; v1 value always `always_confirm`.
- `rule_proposal_threshold` — integer; NULL-default at v1.
- `rule_type_preference` — closed enum `pattern_preferred | temporal_preferred | inferential_preferred | no_preference`; NULL-default.
- `agent_verbosity_for_rules` — closed enum `terse | standard | educational`.

### Reserved audit event types (§8.5) — **string vocabulary on `audit_log.action`, not an enum (§1d)**

`rule_proposed`, `rule_activated`, `rule_promoted`, `rule_demoted`, `rule_retired`, `rule_proposal_rejected`, `rule_evaluated`, `rule_match_confirmed`, `rule_match_rejected`, `rule_guardrail_fired`, `rule_guardrail_confirmed`, `rule_guardrail_resolved_into_primary_bounds`, `rule_refinement_proposed`, `rule_refinement_rejected`, `rule_metadata_updated`. *(15.)* Reserved as documented vocabulary; no migration extends `action` (it is `text`). `rule_match_confirmed` drives `clean_approval_count`; `rule_evaluated` carries `MatchResult.evaluation_trace` as payload (note: `audit_log` has `before_state jsonb` / `after_state_id` but no general payload column — payload-shape for `rule_evaluated` is a Ring 2 evaluation-path concern, out of Ring 1 scope, flagged here only so the ADR draft doesn't assume a payload column exists).

---

## 8. Open questions

Surfaced by the empirical pass or unresolvable without product/UX or out-of-pass reads:

1. **`bundle_type` enum prerequisite (escalate — scope decision).** Decision 3 cannot fully reconcile ADR-0017 without creating the `bundle_type` enum, which is ADR-0012 §12 substrate that was never migrated. Lean Option A (create it in Ring 1), but this expands Ring 1's scope beyond the rule core and needs CTO acknowledgment. **Action before ADR draft:** read ADR-0012 §12 to confirm the `bundle_type` value set (this pass cited ADR-0017's restatement of it; the source wasn't read).

2. **Q-RC-AT-1 windowed read path (product/UX + Ring 2A).** Matview vs derived-read vs defer. Lean defer-to-Ring-2A because the audit corpus is empty at v1 and Ring 2A owns both the consumer and the emitter. The §7 freshness bar is the acceptance criterion whichever path wins.

3. **Q-RC-AT-2 UI label (product/UX).** "last matched" / "last applied" both collide with existing vocabulary. Ring 1 stores the column (`last_winning_match_at`, lean); the canonical UI label is deferred.

4. **Reserve-only enum creation timing (ADR draft).** `CREATE TYPE` the three reserve-only enums (`condition_type`, `action_type`, `trigger_type`) at Ring 1 per ADR-0010, or defer to the Branch-substrate ring? Lean create-now; deferring breaks nothing.

5. **`rule_evaluated` audit payload shape (Ring 2, flagged not owned).** Spec says the payload is `MatchResult.evaluation_trace`; `audit_log` has no general payload column (`before_state jsonb` / `after_state_id` only). Ring 2's evaluation path resolves how the trace is stored; Ring 1 must not assume a payload column.

6. **Collapse reopen trigger (standing).** If any live `autonomy_tier` reader ever surfaces (production path, view, cron, RLS predicate), Decision 1's diagnostic-vs-owned lattice reopens. None at `baeeb862`.

7. **`created_by` type drift (minor, note for ADR).** Live `vendor_rules.created_by` is `uuid`; ADR-0017 text says `text`; `audit_log.created_by`-equivalents and newer tables vary. Ring 1's new tables should pick the project-canonical actor-reference type deliberately rather than inherit by accident — relevant given the auto-commit arc's `SYSTEM_ACTOR_USER_ID` / system-actor work. Flag for the ADR draft to align with the system-actor convention.

---

*End brainstorm pass. Next artifact (separate prompt): the Ring 1 substrate ADR draft. Not committed; not pushed.*
