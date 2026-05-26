-- =============================================================
-- 20240163000000_rule_type_core_substrate.sql
-- Ring 1 substrate for Rule Type Core. Executable authoring of
-- ADR-0023's a–i migration outline (the ADR is the decision record;
-- this file is the SQL).
--
-- Canon: docs/07_governance/adr/0023-rule-type-core-substrate.md
--        (ratified 2026-05-26; amends ADR-0017).
-- Spec:  docs/02_specs/rule-type-core.md (V3.2).
--
-- ── HEAD pass findings (narrow form; bounded translation) ──────
-- • Postgres major_version = 15 (supabase/config.toml). gen_random_uuid()
--   is built-in (no pgcrypto needed); expression unique indexes and
--   COALESCE-in-index are supported.
-- • Transaction wrapping: explicit BEGIN; … COMMIT; per project
--   convention (initial_schema + most migrations). No CREATE INDEX
--   CONCURRENTLY / ALTER TYPE ADD VALUE here, so the whole migration is
--   one transaction safely (only CREATE TYPE on new enums).
-- • add-nullable → backfill → SET NOT NULL precedent: migration
--   20240111 (journal_entries.source_system) / 20240109. Step e follows it.
-- • RAISE EXCEPTION 'msg %', arg is the idiomatic abort shape (20240122,
--   20240143, 20240153). Step f preflight uses a DO block with it.
-- • No prior DROP TYPE / DROP COLUMN in any migration — step h is
--   precedent-setting but standard SQL; autonomy_tier has zero readers
--   (ADR-0023 Context / Decision 4) so DROP TYPE is clean after the
--   column drop.
-- • NOT NULL blast radius: `grep -rn "INSERT INTO vendor_rules" src/ tests/`
--   → none. rule_registry / rule_track_records are new (no external
--   INSERT sites). The only INSERT into any of these is step d's backfill.
-- • vendor_rules RLS policies (vendor_rules_select / vendor_rules_cud)
--   reference org_id only — dropping autonomy_tier (step h) does not
--   touch them.
-- • Test-staleness footprint: apps/web/src/db/types.ts MUST be
--   regenerated (autonomy_tier enum removed; vendor_rules columns change;
--   nine new enums + two new tables + four org_settings columns added).
--   The two test refs to `vendor_rules` (orgContextFixture.ts,
--   orgContextManagerLoad.test.ts) are the orgContext `never[]` array, not
--   the DB table — unaffected. See the companion staleness note.
--
-- ── RLS — RESOLVED (CTO adjudication 2026-05-26) ──────────────
-- ADR-0023's a–i outline was silent on RLS; flagged during this HEAD pass
-- and resolved in chat: LAND RLS NOW. Rationale: the convention is uniform
-- (every org-scoped substrate table enables RLS in its creating migration —
-- document_cases, vendor_credits, org_settings, source_document_links,
-- vendor_rules); defined-but-inert tables carry zero traffic to break, so
-- the policies are correct and in place before Ring 2A wires consumers;
-- deferring would conflate substrate with consumer decisions, the failure
-- shape Ring 1's substrate-only-v1 framing exists to prevent. Policy shapes:
--   • rule_registry (§b.RLS) — mirrors vendor_rules exactly (the most
--     architecturally analogous table): SELECT user_has_org_access(org_id);
--     CUD (FOR ALL) user_is_controller(org_id). Rule mutation
--     (create/promote/demote/retire) is controller-governance work.
--   • rule_track_records (§c.RLS) — org derived through-parent via
--     rule_registry (no direct org_id, per Decision 2). SELECT via
--     user_has_org_access and INSERT via user_is_controller follow the
--     document_case_sources / source_document_links / document_artifacts
--     through-parent EXISTS precedent. UPDATE/DELETE are USING(false):
--     counters are service-derived state (ruleTrackRecordService increments
--     from evaluation outcomes) with no user-path mutation in any planned
--     ring; service writes go via service_role (RLS-exempt), so USING(false)
--     states the design intent without affecting the service path. (Revised
--     from through-parent-controller per CTO re-read — match the actual
--     mutation semantics, not the registry CUD shape.)
--
-- ── Column-immutability triggers — CONSIDERED, DEFERRED ───────
-- The ADR is also silent on trigger-level column-immutability (protecting
-- created_*/lineage anchors from accidental mutation). HEAD-pass grep:
-- ~7 of 55 tables carry such triggers (document_cases, source_documents,
-- document_artifacts, exception_queue, candidates, prepayments) — NOT a
-- uniform convention; vendor_rules and org_settings explicitly lack them.
-- Per the per-table-judgment-call rule, DEFERRED: mutation discipline is
-- first enforced by Decision 5's single-writer services (Ring 2A);
-- trigger-level immutability is a belt-and-suspenders decision for that arc,
-- not this substrate pass. Flagged here so the Ring 2A author revisits it.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- a. Create new enum types (full closed membership per ADR-0023
--    Decision 6). Column-named-same-as-type follows the vendor_rules
--    autonomy_tier precedent.
-- -------------------------------------------------------------

-- Load-bearing (consumed by rule_registry / vendor_rules columns):
CREATE TYPE rule_type AS ENUM (
  'pattern',
  'temporal',
  'inferential'
);

CREATE TYPE rule_lifecycle_state AS ENUM (
  'proposed',
  'active',
  'demoted',
  'retired'
);

CREATE TYPE rule_autonomy_rung AS ENUM (
  'always_confirm',
  'notify_and_auto_post',
  'silent_auto'
);

CREATE TYPE bundle_type AS ENUM (
  'born_paid_bill',                       -- v1 active
  'final_invoice_with_applied_deposit',   -- reserved (ADR-0012 §12)
  'vendor_credit_applied_to_bill'         -- reserved (ADR-0012 §12)
);

-- Reserve-only (no Ring 1 column consumes these; ship per ADR-0010 so
-- generated types carry the closed grammar):
CREATE TYPE condition_type AS ENUM (
  'field_equals',
  'field_in_range',
  'field_outside_range',
  'field_in_set',
  'field_matches_pattern',
  'source_trigger_equals',
  'schedule_matches',
  'cadence_matches',
  'semantic_match_above_threshold',
  'category_classification_matches'
);

CREATE TYPE action_type AS ENUM (
  'auto_post_at_rung_2',
  'auto_post_at_rung_3',
  'suggest_with_required_approval',
  'route_to_exception_queue_with_reason',
  'block_with_reason'
);

CREATE TYPE trigger_type AS ENUM (
  'proposed_mutation_generated',
  'proposed_mutation_bundle_generated',
  'scheduled_time_occurs',
  'external_event_ingested',
  'user_drag_drop',
  'user_form_submit',
  'user_palette_action',
  'agent_proposal'
);

-- org_settings value-set enums (reserve-only; consumed by step i columns):
CREATE TYPE rule_type_preference AS ENUM (
  'pattern_preferred',
  'temporal_preferred',
  'inferential_preferred',
  'no_preference'
);

CREATE TYPE agent_verbosity_for_rules AS ENUM (
  'terse',
  'standard',
  'educational'
);

-- -------------------------------------------------------------
-- b. Create rule_registry (parent identity table; class-table
--    inheritance — vendor_rules.rule_id becomes the 1:1 child via the
--    composite FK in step e). ADR-0023 Decision 1.
-- -------------------------------------------------------------
CREATE TABLE rule_registry (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  rule_type            rule_type NOT NULL,
  lifecycle_state      rule_lifecycle_state NOT NULL,
  current_rung         rule_autonomy_rung NOT NULL DEFAULT 'always_confirm',
  name                 text,                                          -- mutable display metadata (§5.1); null until named
  created_by           uuid REFERENCES auth.users(id),                -- actor-reference standard (ADR-0007 Q78 / Path X)
  created_at           timestamptz NOT NULL DEFAULT now(),
  promoted_at          timestamptz,
  promoted_by          uuid REFERENCES auth.users(id),
  demoted_at           timestamptz,
  demoted_by           uuid REFERENCES auth.users(id),
  retired_at           timestamptz,
  retired_by           uuid REFERENCES auth.users(id),
  predecessor_rule_id  uuid REFERENCES rule_registry(id),
  successor_rule_id    uuid REFERENCES rule_registry(id),
  -- composite key targeted by vendor_rules' child FK (step e), so parent
  -- and child cannot diverge on org_id:
  CONSTRAINT rule_registry_id_org_uq UNIQUE (id, org_id),
  -- a rule never succeeds itself:
  CONSTRAINT rule_registry_no_self_predecessor CHECK (predecessor_rule_id IS NULL OR predecessor_rule_id <> id),
  CONSTRAINT rule_registry_no_self_successor   CHECK (successor_rule_id   IS NULL OR successor_rule_id   <> id)
);

-- Strictly 1:1 bidirectional lineage (§5.8 / §9.3 retire-and-create-new;
-- no rule-split or merge): each predecessor/successor link is unique.
CREATE UNIQUE INDEX rule_registry_predecessor_uq
  ON rule_registry (predecessor_rule_id) WHERE predecessor_rule_id IS NOT NULL;
CREATE UNIQUE INDEX rule_registry_successor_uq
  ON rule_registry (successor_rule_id) WHERE successor_rule_id IS NOT NULL;

-- §b.RLS — Row-Level Security (mirrors vendor_rules exactly).
ALTER TABLE rule_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY rule_registry_select ON rule_registry
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY rule_registry_cud ON rule_registry
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));

-- -------------------------------------------------------------
-- c. Create rule_track_records (per-rule denormalized counters;
--    ADR-0023 Decision 2). Keyed by rule_id, cascade from registry.
-- -------------------------------------------------------------
CREATE TABLE rule_track_records (
  rule_id                                       uuid PRIMARY KEY REFERENCES rule_registry(id) ON DELETE CASCADE,
  clean_approval_count                          integer NOT NULL DEFAULT 0 CHECK (clean_approval_count >= 0),
  rejection_count                               integer NOT NULL DEFAULT 0 CHECK (rejection_count >= 0),
  guardrail_fire_count                          integer NOT NULL DEFAULT 0 CHECK (guardrail_fire_count >= 0),
  guardrail_confirmed_count                     integer NOT NULL DEFAULT 0 CHECK (guardrail_confirmed_count >= 0),
  guardrail_resolved_into_primary_bounds_count  integer NOT NULL DEFAULT 0 CHECK (guardrail_resolved_into_primary_bounds_count >= 0),
  last_clean_approval_at                        timestamptz,
  last_rejection_at                             timestamptz,
  last_guardrail_fire_at                        timestamptz,
  last_winning_match_at                         timestamptz,           -- Q-RC-AT-2 (stored)
  model_version                                 text                   -- inferential rules only; null for pattern/temporal
);

-- §c.RLS — Row-Level Security. org derived through-parent via rule_registry
-- (no direct org_id on this table per Decision 2). Policy semantics match
-- the table's actual mutation model, NOT the registry CUD shape:
--   SELECT — through-parent user_has_org_access (canvas reads counters).
--   INSERT — through-parent user_is_controller (co-created with the rule
--            per Decision 5; controller-governance authority).
--   UPDATE/DELETE — USING(false): counters are service-derived state, never
--            user-mutated; service writes are service_role (RLS-exempt), so
--            this states design intent without affecting the service path.
ALTER TABLE rule_track_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY rule_track_records_select ON rule_track_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rule_registry r
      WHERE r.id = rule_track_records.rule_id
        AND user_has_org_access(r.org_id)
    )
  );

CREATE POLICY rule_track_records_insert ON rule_track_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rule_registry r
      WHERE r.id = rule_track_records.rule_id
        AND user_is_controller(r.org_id)
    )
  );

CREATE POLICY rule_track_records_no_user_update ON rule_track_records
  FOR UPDATE USING (false);

CREATE POLICY rule_track_records_no_user_delete ON rule_track_records
  FOR DELETE USING (false);

-- -------------------------------------------------------------
-- d. Backfill rule_registry (+ co-created rule_track_records) from
--    vendor_rules. No-op in reproducible environments (vendor_rules is
--    empty — zero writers); ON CONFLICT DO NOTHING makes it idempotent.
--    Reads vendor_rules.autonomy_tier / created_* BEFORE step e/h drop them.
--    ADR-0023 Decision 1 / Migration §d.
-- -------------------------------------------------------------
INSERT INTO rule_registry (id, org_id, rule_type, lifecycle_state, current_rung, name, created_by, created_at)
SELECT
  vr.rule_id,
  vr.org_id,
  'pattern'::rule_type,
  CASE WHEN vr.approved_at IS NOT NULL THEN 'active'::rule_lifecycle_state
       ELSE 'proposed'::rule_lifecycle_state END,
  CASE vr.autonomy_tier
    WHEN 'always_confirm' THEN 'always_confirm'::rule_autonomy_rung
    WHEN 'notify_auto'    THEN 'notify_and_auto_post'::rule_autonomy_rung
    WHEN 'silent'         THEN 'silent_auto'::rule_autonomy_rung
  END,
  NULL,                       -- name
  vr.created_by,
  vr.created_at
FROM vendor_rules vr
ON CONFLICT (id) DO NOTHING;

INSERT INTO rule_track_records (rule_id)
SELECT id FROM rule_registry
ON CONFLICT (rule_id) DO NOTHING;

-- -------------------------------------------------------------
-- e. Alter vendor_rules — add bundle_type (Option B: nullable →
--    backfill → SET NOT NULL, no permanent default), add legal_entity_id,
--    add the composite child FK, drop redundant created_* copies.
--    ADR-0023 Decision 3 / Migration §e.
-- -------------------------------------------------------------
ALTER TABLE vendor_rules ADD COLUMN bundle_type bundle_type;
UPDATE vendor_rules SET bundle_type = 'born_paid_bill' WHERE bundle_type IS NULL;
ALTER TABLE vendor_rules ALTER COLUMN bundle_type SET NOT NULL;

ALTER TABLE vendor_rules
  ADD COLUMN legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT;

ALTER TABLE vendor_rules
  ADD CONSTRAINT vendor_rules_rule_registry_fk
  FOREIGN KEY (rule_id, org_id) REFERENCES rule_registry (id, org_id) ON DELETE CASCADE;

-- created_at / created_by relocated to rule_registry (rule-identity audit);
-- approved_at / approved_by stay (vendor-template approval ceremony).
ALTER TABLE vendor_rules
  DROP COLUMN created_at,
  DROP COLUMN created_by;

-- -------------------------------------------------------------
-- f. Duplicate-detection preflight — fail cleanly here (not on the index
--    build) if manual rows created a collision on the uniqueness key.
--    Runs AFTER §e because the key references bundle_type. ADR-0023 §f.
-- -------------------------------------------------------------
DO $$
DECLARE
  v_dupe_groups integer;
BEGIN
  SELECT count(*) INTO v_dupe_groups FROM (
    SELECT 1
    FROM vendor_rules
    GROUP BY org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type
    HAVING count(*) > 1
  ) d;

  IF v_dupe_groups > 0 THEN
    RAISE EXCEPTION
      'rule_type_core_substrate preflight: % duplicate (org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type) group(s) in vendor_rules; the expression unique index (§g) cannot be created. Resolve duplicates manually, then re-run.',
      v_dupe_groups;
  END IF;
END $$;

-- -------------------------------------------------------------
-- g. Expression unique index — preserves the nullable/app-layer-default
--    idiom while enforcing uniqueness (NULL legal_entity_id folds to
--    org_id). Project-canon for scoped-FK uniqueness. ADR-0023 Decision 3.
-- -------------------------------------------------------------
CREATE UNIQUE INDEX vendor_rules_org_legalentity_vendor_bundle_uq
  ON vendor_rules (org_id, COALESCE(legal_entity_id, org_id), vendor_id, bundle_type);

-- -------------------------------------------------------------
-- h. Drop the superseded autonomy_tier substrate (column first, then the
--    enum type — zero readers per ADR-0023 Decision 4). current_rung on
--    rule_registry is now the sole source-of-truth for the rung.
-- -------------------------------------------------------------
ALTER TABLE vendor_rules DROP COLUMN autonomy_tier;
DROP TYPE autonomy_tier;

-- -------------------------------------------------------------
-- i. Reserve post-v1 org_settings columns (nullable; ADR-0023 Decision 6
--    / spec §8.4). org_settings has its own RLS (existing table); ADD
--    COLUMN inherits it.
-- -------------------------------------------------------------
ALTER TABLE org_settings
  ADD COLUMN default_initial_rung_for_new_rules rule_autonomy_rung,   -- v1 value always 'always_confirm'
  ADD COLUMN rule_proposal_threshold            integer,
  ADD COLUMN rule_type_preference               rule_type_preference,
  ADD COLUMN agent_verbosity_for_rules          agent_verbosity_for_rules;

COMMIT;
