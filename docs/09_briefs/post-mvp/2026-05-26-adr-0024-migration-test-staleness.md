# ADR-0024 migration — test-staleness review

**Migration:** `supabase/migrations/20240164000000_rule_evaluation_log.sql`
(Ring 2A-core, ADR-0024 §a–d). **Date:** 2026-05-26.
**Required by:** `.claude/rules/migrations.md` "Substrate-mod-event
test-staleness review" (new table + new RLS + new indexes + new view).

This brief identifies the staleness footprint; it does **not** fix it.
The fixes (RLS isolation test, `security_invoker` behavior test,
`types.ts` regen) are the **test-update arc**, the next arc after this
migration.

## What the migration changes

- **New table** `rule_evaluation_log` (12 columns; composite
  `(rule_id, org_id) → rule_registry(id, org_id)` FK; 3 indexes; RLS:
  SELECT `user_has_org_access`, no INSERT policy, UPDATE/DELETE
  `USING(false)`).
- **New view** `rule_evaluation_30d_view` (`security_invoker = true`;
  trailing-30-day aggregates per `(org_id, rule_id)`).
- **No** enum changes (consumed enums shipped at Ring 1 / ADR-0023).
- **No** changes to existing tables (`vendor_rules` / `rule_registry` /
  `rule_track_records` settled at ADR-0023).

## Affected tests at HEAD: none

`grep -rn "rule_evaluation_log\|rule_evaluation_30d" apps/web/src apps/web/tests`
returns **zero** matches. `rule_evaluation_log` has no consumers at HEAD
— the services (`ruleEvaluationService` et al.), the evaluator, the gate,
and the canvas are all the **Ring 2A-authoring** arc. So no existing test
exercises the affected surface; nothing breaks.

**NOT NULL blast radius (`.claude/rules/migrations.md`): zero.** The
`NOT NULL` columns are on a brand-new table with no writers at HEAD —
there are no INSERT sites to enumerate or break. (The blast-radius
discipline targets `NOT NULL` added to an *existing* table with live
inserters.)

## Expected `types.ts` changes (regen pending — test-update arc)

`apps/web/src/db/types.ts` will gain, on regeneration against the applied
migration:

- `rule_evaluation_log` `Row` / `Insert` / `Update` types (12 columns;
  `action_type` enum on `winning_branch_max_action` + `effective_action`;
  `text`-with-CHECK columns surface as `string`).
- `rule_evaluation_30d_view` `Row` type (the aggregate columns; views
  surface as `Row`-only, no Insert/Update).
- **No enum additions** to the generated `Enums` block.

Regen is not done in this pass (it requires the migration applied to a
local DB). The test-update arc applies the migration (`pnpm db:reset` or
equivalent) and regenerates.

## Test-update arc deliverables

1. **RLS isolation test** — mirror
   `apps/web/tests/integration/ruleCoreRlsIsolation.test.ts`. Assert,
   through the **user-scoped** client (the path RLS protects):
   - cross-org SELECT is denied (org A member cannot read org B's
     `rule_evaluation_log` rows);
   - user-path UPDATE and DELETE are denied (RLS `USING(false)`);
   - user-path INSERT is denied (no INSERT policy → default-deny).

2. **`security_invoker` behavior test (REQUIRED — distinct from generic
   RLS isolation; do not fold into #1).** This verifies the
   precedent-improvement ADR-0024 made over `document_cards_view`. Assert
   that a **non-controller operator querying `rule_evaluation_30d_view`
   directly** (a user-scoped client, NOT the route-handler service-role
   path) gets **RLS-filtered** rows — only their own org's aggregates —
   **not** the owner-bypass leak a plain (non-`security_invoker`) view
   would produce. Concretely: seed `rule_evaluation_log` rows for org A
   and org B; query the view as an org-A user-scoped client; assert only
   org-A aggregates return. Without `security_invoker = true` this test
   would surface org-B rows (the `document_cards_view` footgun). Folding
   this into a generic append-only/isolation test loses the verification
   that the precedent-improvement actually holds.

3. **`types.ts` regeneration** — apply the migration, regenerate
   `apps/web/src/db/types.ts`, commit the regen.

## Reachability note (INV-RULE-001)

INV-RULE-001 was registered with this migration (leaf in
`ledger_truth_model.md`, row in `invariants.md` + `control_matrix.md`,
migration annotation). The bidirectional-reachability diff confirms
**INV-RULE-001 is balanced** (leaf side + migration-annotation side; not
in the symmetric difference). Separately observed and **out of scope
here**: the overall diff is non-empty due to *pre-existing* drift
(`INV-AGENT-002`, `INV-AP-001`, `INV-AP-002` are code-annotated with
leaves outside `ledger_truth_model.md`; `INV-CHECKPOINT-001` is a
doc-only Phase 2 stub), so invariants.md's "Symmetric difference: empty"
statement is itself stale. A future doc-hygiene pass should reconcile it;
this bounded migration arc does not.
