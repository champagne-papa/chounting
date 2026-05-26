-- =============================================================
-- 20240164000000_rule_evaluation_log.sql
-- Ring 2A-core — evaluation log substrate (ADR-0024 §a–d).
--
-- Executable authoring pass for ADR-0024
-- (docs/07_governance/adr/0024-ring2a-core.md, ratified at dcf5e394).
-- This migration is the SQL for ADR-0024's a–d outline; it makes no
-- substrate decisions of its own (bounded translation). It is the
-- first consumer-substrate of the ADR-0023 rule core
-- (20240163000000_rule_type_core_substrate.sql).
--
-- =============================================================
-- HEAD PASS (findings grounding this migration)
--
-- (a) FILENAME CONVENTION. Migrations are `<14-digit-ts>_<snake>.sql`.
--     Immediately follows 20240163000000_rule_type_core_substrate.sql;
--     next slot is 20240164000000. Suffix `rule_evaluation_log` names
--     the table this migration ships (per ADR-0024 §a).
--
-- (b) SERVICE-EMITTED-ONLY RLS SHAPE. ADR-0024 Decision 1 cites the
--     `ai_actions` precedent for the one-write (standalone log, no
--     paired audit_log row) decision. HEAD-pass grep shows `ai_actions`
--     is NOT a clean precedent for the *INSERT* shape: `ai_actions_insert`
--     is `FOR INSERT WITH CHECK (user_has_org_access(org_id))` — an
--     AFFIRMATIVE user-path INSERT policy, because ai_actions permits
--     user-path inserts. `rule_evaluation_log` is genuinely
--     service-emitted-only (the gate/service writes via service_role;
--     no user path creates evaluation records). The clean precedent for
--     service-emitted-only is `audit_log`/`events`: SELECT policy only,
--     NO INSERT policy (RLS-enabled-no-policy denies the user path;
--     service_role bypasses). This migration follows ADR-0024's
--     "no user-path INSERT policy" — matching audit_log/events, not
--     ai_actions.
--
--     For UPDATE/DELETE, ADR-0024 specifies explicit `USING (false)`
--     policies. This matches `audit_log_no_update` / `audit_log_no_delete`
--     (20240122000000_audit_log_append_only.sql) — explicit USING(false)
--     is functionally redundant with default-deny but surfaces the
--     append-only intent at the RLS layer (discoverable from `\d`) and
--     guards against a future migration accidentally adding a permissive
--     UPDATE/DELETE policy. This migration uses the explicit form.
--
--     ENFORCEMENT SCOPE (important — narrower than INV-AUDIT-002).
--     INV-AUDIT-002 / INV-LEDGER-003 are *trigger-authoritative*: their
--     BEFORE UPDATE/DELETE/TRUNCATE triggers fire even for service_role,
--     so those tables are append-only against ALL paths. ADR-0024
--     specifies RLS-only for rule_evaluation_log (no triggers, no
--     REVOKEs). RLS does NOT constrain service_role (it bypasses RLS).
--     So INV-RULE-001's append-only is enforced against the USER path
--     only (analogous to INV-RLS-001); the service path is append-only
--     by single-writer discipline (ruleEvaluationService inserts only),
--     not DB-enforced. This is ADR-0024's specified shape, authored
--     faithfully; the INV-RULE-001 leaf states this scope precisely.
--
-- (c) PG15 security_invoker VIEW SYNTAX (precedent-setting).
--     `CREATE VIEW <name> WITH (security_invoker = true) AS SELECT ...`.
--     PG15 view storage parameter; default is `security_invoker = false`
--     (owner-rights — the view evaluates underlying RLS as the view
--     OWNER, bypassing the querying user's RLS). The
--     document_cards_view precedent (20240154000000) is a PLAIN view
--     (no WITH clause) and its header comment misstates the default as
--     "SECURITY INVOKER for views" — it is not; the default is
--     owner-rights, which is why document_cards_view is RLS-safe only
--     via route-handler service-role discipline. This view sets
--     `security_invoker = true` so it genuinely inherits
--     rule_evaluation_log's RLS for any caller (ADR-0024 Decision 2;
--     closes that latent footgun).
--
-- (d) 30d-VIEW AGGREGATE COLUMN SHAPE. ADR-0024 Decision 2 enumerates
--     the aggregates and delegates the column-shape choice to this pass
--     ("separate columns vs. single aggregate — pick the shape that
--     matches document_cards_view precedent and document the choice").
--     document_cards_view uses flat named columns (no jsonb, no nesting),
--     so this view uses explicit named `count(*) FILTER (WHERE ...)`
--     columns — one per match_classification, one per effective_action
--     value, one per disposition value — over a single aggregate. Flat,
--     queryable, self-documenting; matches the precedent. New enum values
--     (Ring 2B) would add columns via a later migration.
--
-- =============================================================
-- SCOPE
--   IN : rule_evaluation_log table, 3 indexes, RLS (append-only,
--        service-emitted), rule_evaluation_30d_view (security_invoker).
--   OUT: no vendor_rules / rule_registry / rule_track_records changes
--        (substrate settled at ADR-0023); no new enums (consumed enums
--        all shipped at Ring 1); no triggers/REVOKEs (ADR-0024 = RLS-only);
--        no service/evaluator/gate/canvas code (authoring arc).
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- §a. rule_evaluation_log — the structured record of every evaluation
-- -----------------------------------------------------------------
CREATE TABLE rule_evaluation_log (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL,
  rule_id                   uuid NOT NULL,
  trace_id                  uuid NOT NULL,
  match_classification      text NOT NULL
    CHECK (match_classification IN ('primary_match','guardrail_match','almost_match')),
  winning_branch_type       text NULL
    CHECK (winning_branch_type IN ('primary','guardrail')),
  winning_branch_max_action action_type NULL,
  effective_action          action_type NULL,
  proposed_mutation_id      uuid NULL,
  disposition               text NULL
    CHECK (disposition IS NULL OR disposition IN ('auto_posted','routed','blocked','pending')),
  evaluation_trace          jsonb NOT NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),

  -- Composite identity FK (mirrors ADR-0023 vendor_rules). Targets
  -- rule_registry's UNIQUE (id, org_id); a log row cannot pair org A's
  -- org_id with org B's rule. REPLACES separate rule_id->rule_registry
  -- and org_id->organizations FKs: org-scope integrity + the org-delete
  -- cascade run transitively through rule_registry
  -- (rule_registry.org_id -> organizations). No direct org_id FK, exactly
  -- as vendor_rules carries none.
  CONSTRAINT rule_evaluation_log_rule_registry_fk
    FOREIGN KEY (rule_id, org_id)
    REFERENCES rule_registry (id, org_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- §b. Indexes (ADR-0024 Decision 1)
-- -----------------------------------------------------------------
CREATE INDEX idx_rule_evaluation_log_rule_created
  ON rule_evaluation_log (rule_id, created_at);   -- the 30d windowed read
CREATE INDEX idx_rule_evaluation_log_org_created
  ON rule_evaluation_log (org_id, created_at);    -- tenant-scoped queries
CREATE INDEX idx_rule_evaluation_log_trace
  ON rule_evaluation_log (trace_id);              -- cross-event lookup

-- -----------------------------------------------------------------
-- §c. RLS — append-only, service-emitted (ADR-0024 Decision 1)
--
-- INV-RULE-001 (Layer 1a) — rule_evaluation_log is append-only against
-- the user path: RLS blocks authenticated-role UPDATE/DELETE
-- (USING(false)) and there is no user-path INSERT policy. Evaluation
-- records are written only by ruleEvaluationService on the service_role
-- client (which bypasses RLS). service_role can technically mutate
-- (RLS-only, no triggers — see HEAD pass (b)); service-path append-only
-- is by single-writer discipline. Enforcement site for INV-RULE-001.
-- See docs/02_specs/ledger_truth_model.md#inv-rule-001.
-- -----------------------------------------------------------------
ALTER TABLE rule_evaluation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY rule_evaluation_log_select ON rule_evaluation_log
  FOR SELECT USING (user_has_org_access(org_id));

-- No INSERT policy: service-emitted only. RLS-enabled-no-policy denies
-- the user path; service_role bypasses RLS (audit_log/events precedent).

CREATE POLICY rule_evaluation_log_no_update ON rule_evaluation_log
  FOR UPDATE USING (false);   -- INV-RULE-001 append-only (user path)

CREATE POLICY rule_evaluation_log_no_delete ON rule_evaluation_log
  FOR DELETE USING (false);   -- INV-RULE-001 append-only (user path)

COMMENT ON TABLE rule_evaluation_log IS
  'Ring 2A-core (ADR-0024 §1). The structured, queryable record of every '
  'rule evaluation (row-per-rule-evaluation: N candidate rules -> N rows; '
  'winner-attribute columns null on non-winners). One-write: sole record '
  'for the rule_evaluated event, no paired audit_log row (ai_actions '
  'precedent; evaluation is read-shaped, not an INV-AUDIT-001 mutation). '
  'INV-RULE-001: append-only against the user path via RLS USING(false) + '
  'no user-path INSERT; service-emitted via service_role; service-path '
  'append-only by single-writer discipline (RLS-only, no triggers).';

-- -----------------------------------------------------------------
-- §d. rule_evaluation_30d_view — trailing-30-day windowed aggregates
--     per (org_id, rule_id). security_invoker = true so the view
--     inherits rule_evaluation_log's RLS for any caller (ADR-0024
--     Decision 2; corrects the document_cards_view owner-rights footgun).
-- -----------------------------------------------------------------
CREATE VIEW rule_evaluation_30d_view
  WITH (security_invoker = true) AS
SELECT
  org_id,
  rule_id,
  count(*)                                                                    AS evaluation_count,
  count(*) FILTER (WHERE match_classification = 'primary_match')              AS primary_match_count,
  count(*) FILTER (WHERE match_classification = 'guardrail_match')            AS guardrail_match_count,
  count(*) FILTER (WHERE match_classification = 'almost_match')               AS almost_match_count,
  -- counts by effective_action (gate output)
  count(*) FILTER (WHERE effective_action = 'auto_post_at_rung_2')            AS effective_auto_post_rung_2_count,
  count(*) FILTER (WHERE effective_action = 'auto_post_at_rung_3')            AS effective_auto_post_rung_3_count,
  count(*) FILTER (WHERE effective_action = 'suggest_with_required_approval') AS effective_suggest_count,
  count(*) FILTER (WHERE effective_action = 'route_to_exception_queue_with_reason') AS effective_route_count,
  count(*) FILTER (WHERE effective_action = 'block_with_reason')              AS effective_block_count,
  -- counts by disposition (insert-time dispatch outcome)
  count(*) FILTER (WHERE disposition = 'auto_posted')                         AS disposition_auto_posted_count,
  count(*) FILTER (WHERE disposition = 'routed')                              AS disposition_routed_count,
  count(*) FILTER (WHERE disposition = 'blocked')                             AS disposition_blocked_count,
  count(*) FILTER (WHERE disposition = 'pending')                             AS disposition_pending_count,
  max(created_at)                                                             AS last_evaluated_at
FROM rule_evaluation_log
WHERE created_at >= now() - interval '30 days'
GROUP BY org_id, rule_id;

COMMENT ON VIEW rule_evaluation_30d_view IS
  'Ring 2A-core (ADR-0024 §2). Trailing rolling-30-day windowed '
  'aggregates per (org_id, rule_id) over rule_evaluation_log, the Stage 1 '
  'canvas track-record indicator data source (always-fresh; no '
  'materialization). security_invoker = true so the view inherits '
  'rule_evaluation_log RLS for any caller (corrects the document_cards_view '
  'owner-rights footgun). Windowed human-approval (clean-approval / '
  'rejection) rates are NOT here: disposition is insert-time-only and does '
  'not carry terminal controller approve/reject (ADR-0024 Decision 2).';

GRANT SELECT ON rule_evaluation_30d_view TO service_role;
GRANT SELECT ON rule_evaluation_30d_view TO authenticated;

COMMIT;
