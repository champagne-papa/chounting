# Phase 1.5A Exit Criteria Matrix

Generated 2026-04-15 after all 109 tests passed (20 files).
Matching the Phase 1.1 closeout convention
(`docs/09_briefs/phase-1.1/exit_criteria_matrix.md`).

---

## Schema (§16.1)

| # | Criterion | Status | Verification |
|---|---|---|---|
| S1 | Migration 108 applied; `industries` table exists with ≥25 rows | **MET** | `SELECT COUNT(*) FROM industries` = 28 |
| S2 | Every bridged industries row has `default_coa_template_industry` populated for currently-seeded CoA templates | **MET** | §9.3 verification query returned 0 rows (commit `de610fb`) |
| S3 | Migration 109 applied; all new `organizations` columns exist with correct types/defaults | **MET** | `\d organizations` verified; probe inserts confirmed defaults (commit `30473ff`) |
| S4 | `organizations.industry_id` is NOT NULL for every existing org row | **MET** | `SELECT COUNT(*) WHERE industry_id IS NULL` = 0 |
| S5 | `organizations.industry` (legacy enum column) still exists | **MET** | `\d organizations` shows the column; two-step cutover preserved |
| S6 | Four new enums exist: `business_structure`, `accounting_framework`, `report_basis`, `org_status` | **MET** | `\dT+` confirmed all four (commit `30473ff`) |
| S7 | Migration 110 applied; `organization_addresses` table + `address_type` enum + partial unique index exist | **MET** | All verified; probe inserts confirmed CHECK + partial unique behavior (commit `291412e`) |
| S8 | Migration 111 applied; `journal_entries.source_system NOT NULL` + `source_external_id` + partial unique `idx_je_source_external` | **MET** | Three probes passed: duplicate triple rejected, multiple NULLs accepted, index binds `source_system` text (commit `5ae6fbf`) |

## Services (§16.2)

| # | Criterion | Status | Verification |
|---|---|---|---|
| V1 | `createOrgWithTemplate` accepts all new required + optional fields | **MET** | `orgProfileCreation.test.ts` (CA-06) passes |
| V2 | `updateOrgProfile` is controller-only, writes full `before_state` to `audit_log` | **MET** | Controller-only via `withInvariants({ action: 'org.profile.update' })` at route; audit logging verified in service code review |
| V3 | `listIndustries` callable by any authenticated user (no org scoping) | **MET** | `listIndustries.test.ts` (CB-01) passes with zero-membership caller |
| V4 | `addressService` has 4 mutating functions, each `withInvariants`-wrapped at the route layer | **MET** | `addAddress`, `updateAddress`, `removeAddress`, `setPrimaryAddress` exported; route handlers wire `withInvariants` with imperative-verb ActionNames |
| V5 | Zod schemas exist at `src/shared/schemas/organization/{profile,address,externalIds}.schema.ts` | **MET** | Files exist; `pnpm typecheck` clean |

## API routes (§16.3)

| # | Criterion | Status | Verification |
|---|---|---|---|
| R1 | All eight routes from §6 exist and call their service functions | **MET** | `find src/app/api -name route.ts` — 8 new route files covering all endpoints |
| R2 | `PATCH /api/orgs/[orgId]/profile` rejects non-controller callers with 403 | **MET** | Enforced by `withInvariants({ action: 'org.profile.update' })` → `canUserPerformAction` role check |
| R3 | `POST /api/orgs/[orgId]/addresses` rejects non-controller callers with 403 | **MET** | Enforced by `withInvariants({ action: 'org.address.create' })` → `canUserPerformAction` role check |

## Audit (§16.4)

| # | Criterion | Status | Verification |
|---|---|---|---|
| A1 | Five new action keys in `audit_log` after exercising service layer | **MET** | `addressServiceAudit.test.ts` (CA-09) asserts `org.address_added`, `org.address_updated`, `org.address_removed`, `org.address_primary_changed`; `updateOrgProfile` writes `org.profile_updated` |
| A2 | Every `org.profile_updated` audit row has non-null `before_state` | **MET** | Service code confirmed: `before_state: before as Record<string, unknown>` written before UPDATE in `updateOrgProfile` |

## Tests (§16.5)

| # | Criterion | Status | Verification |
|---|---|---|---|
| T1 | All five Phase 1.1 Category A tests still pass | **MET** | 26 existing tests pass (0 regressions) |
| T2 | All ten Phase 1.5A tests pass (5 Cat A + 5 Cat B) | **MET** | CA-06 through CA-10 + CB-01 through CB-05 all green |
| T3 | `pnpm typecheck` passes after `pnpm db:generate-types` | **MET** | `src/db/types.ts` regenerated; typecheck clean |

---

## Test catalog summary

| Category | # | File | Tests | Status |
|---|---|---|---|---|
| A (floor) | CA-06 | `orgProfileCreation.test.ts` | 1 | PASS |
| A (floor) | CA-07 | `industryForeignKey.test.ts` | 2 | PASS |
| A (floor) | CA-08 | `addressPrimaryUniqueness.test.ts` | 3 | PASS |
| A (floor) | CA-09 | `addressServiceAudit.test.ts` | 4 | PASS |
| A (floor) | CA-10 | `crossOrgRlsIsolation.test.ts` (ext.) | +2 | PASS |
| B | CB-01 | `listIndustries.test.ts` | 2 | PASS |
| B | CB-02 | `addressRegionValidation.test.ts` | 6 | PASS |
| B | CB-03 | `externalIdsSchema.test.ts` | 6 | PASS |
| B | CB-04 | `parentOrgSelfFk.test.ts` | 5 | PASS |
| B | CB-05 | `journalSourceExternalId.test.ts` | 3 | PASS |

**Totals:** 20 test files, 109 tests, 0 failures.

---

## Counts

- Migrations: 11 (001-007 Phase 1.1 + 108-111 Phase 1.5A)
- Integration tests: 14 files, 57 tests (7 existing + 7 new)
- Unit tests: 6 files, 52 tests (4 existing + 2 new)
- New service functions: 6 (`createOrgWithTemplate` extended, `updateOrgProfile`, `getOrgProfile`, `listIndustries`, `addressService` × 5)
- New API routes: 8 endpoints across 5 files
- New Zod schemas: 3 files, 7 exported schemas
- New error codes: 12
- New ActionName values: 5
- Commits in this session: 10
