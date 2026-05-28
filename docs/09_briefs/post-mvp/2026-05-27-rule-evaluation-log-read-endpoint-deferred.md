# Deferred: `rule_evaluation_log` read endpoint

**Substrate:** `rule_evaluation_log` (ADR-0024 §a–d, migration `20240164`).
**Date:** 2026-05-27.
**Status:** Deferred — known-needed; shape mostly settled (per ADR-0025 §10); not in any current arc scope.

This brief identifies the deferred work and its settled shape; it does **not**
ship the endpoint. The implementation lands when one of the triggers below
fires.

## What's deferred

A read endpoint exposing `rule_evaluation_log` rows to the canvas / agent
layer — e.g. `GET /api/orgs/[orgId]/rules/[ruleId]/evaluations` returning
recent rows filtered by `(org_id, rule_id)`, ordered by `created_at`
descending, paged.

## Why it's known-needed

ADR-0025 §10 names the Stage 1 canvas detail surface as including
*"recent matches (from `rule_evaluation_log`)"* alongside track-record
breakdown, last winning match, lifecycle anchors. The substrate exists
(ADR-0024 shipped `rule_evaluation_log` at migration `20240164` + the 30-day
view `rule_evaluation_30d_view` with `security_invoker = true`); the table
carries every column the surface would render. But Commit 4 of the ADR-0025
rollout shipped only the list route (`GET /api/orgs/[orgId]/rules`) + four
row-action sub-routes; a read endpoint over `rule_evaluation_log` was
explicitly not in scope.

The gap surfaced concretely during the `hygiene-post-ring2a-core` arc:
item 5's HEAD-pass for §5.7 prose reconciliation noted the missing read
route as a category-D gap; item 7's forward-flag in `RuleRegistryView.tsx`
renders an in-UI *"Recent matches — available post-Ring-2A"* note where
the read endpoint would feed.

## Shape (as settled by ADR-0025 §10 + ADR-0024 substrate)

- **Route:** `GET /api/orgs/[orgId]/rules/[ruleId]/evaluations` (preferred
  shape; adapt at authoring time).
- **Filter:** `(org_id, rule_id)` via the service-layer wrap (mirroring
  `journalEntryService.list`). The user-path RLS already shapes
  authenticated reads per INV-RULE-001; the route + service add the
  `withInvariants` org-access check.
- **Order + paging:** `created_at DESC`, with limit (default ~25–50) +
  cursor on `(created_at, id)` for deterministic pagination. Match the
  precedent set by other paged-list routes at HEAD.
- **Returns:** likely subset of `rule_evaluation_log` columns sufficient
  for the detail surface (e.g., `id`, `created_at`, `match_classification`,
  `winning_branch_type`, `winning_branch_max_action`, `effective_action`,
  `disposition`); future-implementer call on exact composition. The full
  `evaluation_trace` JSONB may be heavy for list view; implementer's call
  on whether to elide or paginate at row-granularity.

## What triggers picking this up

Any of:

1. Stage 1 canvas detail surface materializing the "recent matches" view
   (the §10-named affordance) — the likely-soonest trigger.
2. Stage 2 canvas (Trigger/Condition/Action structure, Ring 2B) needing
   a per-rule evaluation history.
3. Ring 2A-authoring's Logic Receipt / Four Questions chat surface
   needing a per-rule recent-match read path.

## Provenance

- ADR-0025 §10 (canonical naming — "recent matches (from
  `rule_evaluation_log`)").
- ADR-0024 §1 + §2 (substrate — table + 30-day view).
- `hygiene-post-ring2a-core` arc item 5 (HEAD-pass category-D gap surface)
  + item 7 (forward-flag in `RuleRegistryView.tsx` at `b03090c8`).
