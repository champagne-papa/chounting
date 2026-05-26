# ADR-0023 Migration — Test-Staleness Review

**Date:** 2026-05-26 · **Migration:** `supabase/migrations/20240163000000_rule_type_core_substrate.sql`
**HEAD anchor:** `9843b217` (ADR-0023 ratified). **Status:** review input for the eventual test-update / type-regen pass; not the test-update itself.

Per `.claude/rules/migrations.md` → "Substrate-mod-event test-staleness review": a migration that broadens/adds enum membership, adds partial UNIQUE indexes, or adds column-level NOT NULL invariants must audit dependent tests at substrate-mod commit time for (1) assertion strings referencing constraint names, (2) hardcoded values the substrate broadens/constrains, (3) reserved-set assertions. This note records that audit. **It does not author or fix tests** (separate pass).

## Surfaces the migration modifies

- **New enum types (9):** `rule_type`, `rule_lifecycle_state`, `rule_autonomy_rung`, `bundle_type`, `condition_type`, `action_type`, `trigger_type`, `rule_type_preference`, `agent_verbosity_for_rules`.
- **New tables:** `rule_registry`, `rule_track_records` (+ partial unique lineage indexes, non-negative counter CHECKs, `UNIQUE (id, org_id)`).
- **`vendor_rules`:** ADD `bundle_type` (Option B), ADD `legal_entity_id`; DROP `autonomy_tier`, `created_at`, `created_by`; ADD composite FK `(rule_id, org_id)`; ADD expression unique index.
- **DROP TYPE** `autonomy_tier`.
- **`org_settings`:** ADD 4 nullable reserved columns.
- **RLS** (resolved post-flag, CTO adjudication 2026-05-26): `rule_registry` mirrors `vendor_rules` (SELECT org-access, CUD controller); `rule_track_records` — SELECT org-access + INSERT controller (both through-parent via `rule_registry`), UPDATE/DELETE `USING(false)` (counters are service-derived; no user-path mutation in any planned ring; service writes are RLS-exempt).

## NOT NULL blast radius

`grep -rn "INSERT INTO vendor_rules" --include="*.ts" --include="*.sql" apps/web/src supabase tests` → **none**. `rule_registry` / `rule_track_records` are new (no external INSERT sites). The only INSERT into any of these tables is the migration's own step-d backfill. So the NOT NULL columns (`rule_registry.org_id` / `rule_type` / `lifecycle_state` / `current_rung`; `vendor_rules.bundle_type` via Option B) have **zero external blast radius**.

## Test-staleness findings

| Surface | Reference | Verdict |
|---|---|---|
| `apps/web/src/db/types.ts` (generated) | 9 refs to `autonomy_tier` / `vendor_rules` | **Regenerate (required).** After the migration: `autonomy_tier` enum removed; `vendor_rules` columns change (`autonomy_tier`/`created_at`/`created_by` gone, `bundle_type`/`legal_entity_id` added); 9 new enums + `rule_registry`/`rule_track_records` + 4 `org_settings` columns added. Large but mechanical diff. |
| `apps/web/tests/fixtures/agent/orgContextFixture.ts:39` | `vendor_rules: []` | **Unaffected.** This is the orgContext `never[]` reserved field (orgContextManager), not the DB table. The orgContext shape is independent of the `vendor_rules` schema. |
| `apps/web/tests/integration/orgContextManagerLoad.test.ts:50` | `expect(ctx.vendor_rules).toEqual([])` | **Unaffected.** Same — asserts the reserved-empty orgContext array, not the table. |
| Constraint-name assertions | — | **None.** No test references constraint names on the affected objects (the new objects are net-new; no prior assertions). |
| Hardcoded enum-value / reserved-set assertions | — | **None.** No test asserts `autonomy_tier` values or any of the new enums' membership. |
| `vendor_rules` DB readers/writers in tests | — | **None.** No `.from('vendor_rules')` / `INSERT INTO vendor_rules` in tests. |

## Expected to break

- **Nothing in the test suite directly.** The audit found no constraint-name assertions, no reserved-set assertions, and no DB reads/writes of `vendor_rules` in tests.
- **The one required follow-on is `types.ts` regeneration** (a generated artifact, not a test). Per grep, `autonomy_tier` appears **only** in `types.ts` (no source or test imports the enum type or the old `vendor_rules` row shape), so even the regen has **no downstream code breakage** — it is a self-contained generated-file update.

## Expected NOT to break

- The orgContext fixture + `orgContextManagerLoad` test (independent reserved-array shape).
- All `vendor_rules`-adjacent code paths (zero writers/readers at HEAD per the verification doc).

## Carry-forward to the test-update / service pass

1. **Regenerate `apps/web/src/db/types.ts`** via the project's Supabase type-gen, commit the diff (confirm the exact gen command at that step).
2. **Service pass (Decision 5, separate):** `ruleRegistryService` / `ruleTrackRecordService` / `vendorRuleService` author against the regenerated types; they ship defined-but-inert.
3. **Cross-org RLS isolation tests (now a definite item — RLS landed).** RLS shipped on `rule_registry` + `rule_track_records` (see migration §b.RLS / §c.RLS). The test-update pass should add cross-org isolation coverage: `rule_registry` (org-scoped select/cud); `rule_track_records` SELECT/INSERT through-parent (a cross-org user must not read/insert a track-record whose parent rule belongs to another org) **and** UPDATE/DELETE blocked for all user paths (`USING(false)` — no direct counter mutation). Not authored here.

## Ship gate

The RLS open question is **resolved** (RLS landed per CTO adjudication 2026-05-26; see migration §b.RLS / §c.RLS), and column-immutability triggers are **deferred to Ring 2A** (not a uniform convention — see the migration header). The migration is **commit-ready**. The test-update items above (`types.ts` regen + cross-org RLS isolation tests) are the paired follow-on pass, not blockers on the migration commit itself.
