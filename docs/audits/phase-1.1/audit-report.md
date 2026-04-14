# Audit Report — Phase 1.1

Date: 2026-04-13
Auditor: Claude (self-audit — see Limitations)

## Executive Summary

The Phase 1.1 codebase is architecturally sound, with strong service-layer discipline, thorough schema design, and consistent multi-tenancy enforcement via RLS and the `withInvariants` middleware. The single most critical issue is a transaction atomicity gap in the journal entry creation path (UF-001): three independent database inserts without transaction wrapping, incompatible with Phase 1.2 agent retry semantics. The most pervasive systemic pattern is documentation-reality divergence (UF-002) — authoritative documentation claims enforcement mechanisms that do not exist, creating false confidence. The audit produced 21 unified findings: 1 Critical, 5 High, 8 Medium, and 7 Low. The foundation is ready for Phase 1.2 agent integration with four specific, bounded fixes that must land first.

---

## Category Assessments

### 1. Architecture Fit

#### Current State

The Bridge follows a layered Next.js + Supabase architecture with strict service-layer mediation. All database mutations flow through `src/services/` via the `withInvariants` middleware, which enforces org-scoped authorization before every mutating operation. The Two Laws — all database access through services (Law 1) and all journal entries through `journalEntryService.post()` (Law 2) — define the structural contract. Agent integration points exist as clean extension surfaces (canvas directive system, tool invocation patterns) but are not yet exercised.

#### Strengths

- The Two Laws provide a clear, defensible architectural contract that constrains mutation paths to known, auditable surfaces.
- The `withInvariants` middleware is applied consistently to every mutating service function, providing defense-in-depth for multi-tenancy.
- Agent extension points (canvas directives, tool patterns) are cleanly separated from the core journal entry path, enabling Phase 1.2 integration without restructuring.
- The schema design is multi-currency-ready at the database and service layers; the `CAD`-only constraint is intentionally localized to the form layer (H-12 refuted).

#### Weaknesses

- **Convention-only enforcement of critical invariants** (UF-002): Laws 1 and 2 — the two most important architectural rules — rely entirely on developer discipline. No lint rule, CI check, or type-system mechanism prevents violations. The ESLint rule claimed by CLAUDE.md does not exist.
- **Read-path authorization is ad-hoc** (UF-012): Two functions already lack the required `org_ids.includes()` check (`chartOfAccountsService.get()` per UF-008, `periodService.isOpen()` per UF-012). No centralized read-path middleware catches omissions.
- **OrgSwitcher bypasses Law 1** (UF-014): The component creates a Supabase browser client and queries `memberships` directly, establishing a precedent that Law 1 has exceptions.

#### Risks

- **Convention violations multiply with codebase growth.** Probability: Likely. Impact: High. Phase 1.2 adds agent tools, more mutation paths, and potentially more contributors. Without automated enforcement, each new path is a potential Law 1 or Law 2 violation. (UF-002, UF-014)
- **Read-path authorization gaps expand.** Probability: Possible. Impact: Medium. Each new read function must independently remember to add the org check. Phase 1.2 agent tools will add read call sites. (UF-012)

### 2. Backend Design & API

#### Current State

The backend consists of two API route handlers (journal entry CRUD and org management) mediated by the service layer. `journalEntryService.post()` is the most complex function, handling entry creation, line insertion, audit logging, and the deferred balance constraint. `orgService.createOrgWithTemplate()` handles org provisioning with template chart-of-accounts seeding. Error handling follows a `ServiceError`-to-HTTP-status pipeline for journal entries but not consistently across all services.

#### Strengths

- `journalEntryService.post()` correctly implements the double-entry constraint, reversal mirror validation, period-lock enforcement, and audit logging — the core accounting invariants are structurally enforced.
- The `ServiceError` type system provides typed, structured error reporting from service to API route to frontend for the journal entry path.
- The `withInvariants` middleware provides consistent authorization checking with zero exceptions in the mutation path.
- Zod validation at service boundaries is consistently applied for the journal entry path (CLAUDE.md Rule 5).

#### Weaknesses

- **Transaction atomicity gap** (UF-001): The journal entry creation path makes three independent auto-committed inserts (entry, lines, audit_log) without transaction wrapping. The deferred balance constraint fires at the PostgREST auto-commit boundary, not at an application transaction boundary. Test and production operate at different constraint semantics.
- **Org service rigor deficit** (UF-003): `orgService.createOrgWithTemplate()` has no `recordMutation` call (no audit trail), an unchecked membership insert error (silent orphaning), no service-level Zod validation, and inline error mapping instead of `serviceErrorToStatus`.
- **`chartOfAccountsService.get()` defect cluster** (UF-008): Missing org authorization check, raw Supabase error throwing instead of `ServiceError`, and dormant cross-org exposure. Currently unreachable but a natural Phase 1.2 agent tool target.
- **Money type inconsistencies at service boundaries** (UF-009): The reversal mirror check uses `Number()` instead of `decimal.js`. `JournalEntryDetail` declares money fields as plain `string` behind a double type assertion. Both violate CLAUDE.md Rule 3.
- **Inconsistent error propagation** (UF-010, UF-015): Two services throw raw `PostgrestError` instead of `ServiceError`, bypassing the error-to-HTTP pipeline. Schema details (table names, constraint names) leak in error responses.

#### Risks

- **Agent retry on partial commit produces orphaned entries.** Probability: Likely. Impact: High. Without transaction wrapping, a failure after the entry insert but before the lines insert creates an orphaned entry with no lines and no audit trail. Phase 1.2 agent retry semantics make this the single highest-priority fix. (UF-001)
- **Org provisioning events are forensically unattributable.** Probability: Possible. Impact: Medium. No audit trail for org creation means a rogue or erroneously created org cannot be traced to its origin. (UF-003)

### 3. Frontend Architecture

#### Current State

The frontend uses a split-screen layout with a canvas panel (journal entry forms, account views) and a chat panel (future agent interaction surface). Components use React Server Components for data fetching and client components for interactive forms. The canvas directive system provides a mechanism for programmatic navigation between views.

#### Strengths

- Clean separation between the canvas panel and chat panel, enabling independent development of agent features in Phase 1.2.
- The canvas directive system provides a structured mechanism for inter-component communication without prop drilling.
- Server/client boundary is well-maintained — all `import type` from services are correctly erased at compile time (H-13 refuted).

#### Weaknesses

- **No canvas refresh mechanism** (UF-004): When a mutation occurs (whether from the form or from a future agent), the canvas has no way to refresh its data. No event bus, no React Query, no `refreshKey` counter. Agent-driven mutations from the chat panel will leave the canvas showing stale data.
- **ProposedEntryCard money type error** (UF-009): Money fields are typed as `number` instead of `string`/`MoneyAmount`. Written before the money-as-string rule was established. A latent trap for Phase 1.2 agent implementation.
- **Fetch and error handling inconsistency** (UF-010): Reference data fetches skip `response.ok` checks, producing silent empty dropdowns on expired sessions. Form submission error handling diverges: `JournalEntryForm` maps field-level errors while `ReversalForm` shows generic banners.
- **OrgSwitcher Law 1 violation** (UF-014): Direct browser-to-database query bypasses the service layer.

#### Risks

- **Stale-after-mutation is a trust-breaking UX failure.** Probability: Likely. Impact: High. For an AI-native accounting platform where the agent performs mutations, showing stale data after an agent action undermines the core value proposition. (UF-004)
- **Phase 1.2 agent follows ProposedEntryCard's number type.** Probability: Possible. Impact: Medium. If the Phase 1.2 Zod schema for proposed entries copies the existing `number` type, money will flow through the system as JavaScript numbers, violating Rule 3 at a critical boundary. (UF-009)

### 4. Data Layer & Database Design

#### Current State

The database uses PostgreSQL via Supabase with a schema covering journal entries, journal lines, chart of accounts, periods, organizations, memberships, and audit logging. Row-Level Security policies enforce tenant isolation on all tables. The deferred balance constraint ensures double-entry integrity. An `events` table exists with append-only triggers but receives no writes in Phase 1 (reserved-seat pattern per PLAN.md Section 0).

#### Strengths

- Comprehensive RLS policies on all tables, with correct `user_has_org_access()` and `user_is_controller()` functions enforcing tenant isolation.
- The deferred balance constraint (`check_journal_entry_balance`) correctly enforces double-entry integrity within the PostgREST auto-commit boundary.
- The `events` table's append-only triggers (`BEFORE UPDATE`, `BEFORE DELETE`, `BEFORE TRUNCATE` all reject) are correctly in place for Phase 2 activation.
- Foreign key relationships are correctly structured. The `journal_entry_attachments` SELECT-only RLS is consistent with the admin-only-writes pattern (UF-021).
- The `SECURITY INVOKER` + `service_role GRANT` pattern on RPCs is correct (UF-021).

#### Weaknesses

- **Cross-org report contamination via missing FK guard** (UF-007): The FK from `journal_lines` to `chart_of_accounts` is a simple FK without an org cross-check. A cross-org account reference would cause financial reports to silently aggregate amounts from another organization via LEFT JOIN.
- **Ledger immutability not enforced at trigger level** (UF-006): Journal entries and lines have RLS deny-all for UPDATE/DELETE, but the service-role client (`adminClient`) bypasses RLS. No trigger prevents modification. The events table pattern (append-only triggers) already exists in the codebase but has not been applied to ledger tables.
- **Constraint boundary mismatch between test and production** (UF-001): The deferred balance constraint fires within the plpgsql test helper's single transaction, but in production, three independent HTTP calls create three separate auto-commit boundaries. Tests verify a stricter semantic than production enforces.
- **Developer friction in seed/reset workflow** (UF-018): `pnpm db:reset` alone produces an unusable database requiring manual `pnpm db:seed:all` follow-up.

#### Risks

- **Cross-org report contamination is silent and undetectable after the fact.** Probability: Unlikely. Impact: High. The most realistic vector is a Phase 1.2 agent bug passing an `account_id` from a prior conversation context. No detection mechanism exists. (UF-007)
- **Service-role ledger modification has no database-level rejection.** Probability: Possible. Impact: High. Phase 1.2 agent tools will use `adminClient` via the service layer. An accidental UPDATE or DELETE on posted journal entries would succeed silently. (UF-006)

### 5. Security & Compliance

#### Current State

Authentication flows through Supabase Auth with `@supabase/ssr` cookie-based sessions. Authorization is enforced at three layers: URL/body org-id match in API routes, `withInvariants` membership check in the service layer, and RLS policies at the database layer. The audit_log table records all mutations synchronously within the mutation transaction.

#### Strengths

- Triple-layer write defense (URL/body match → `withInvariants` → RLS) provides genuine defense-in-depth for mutations. Cross-org INSERT RLS policies are correct and use `user_has_org_access()` (H-11 confirmed).
- SELECT-only RLS on admin tables is intentional defense-in-depth, not a gap (H-08 refuted). RLS deny-by-default blocks user-context writes.
- The `withInvariants` middleware is applied without exception to every mutating service function.
- The audit_log captures all mutations synchronously within the mutation transaction (Phase 1 simplification with documented Phase 2 correction).

#### Weaknesses

- **Auth chain (`buildServiceContext`) is untested** (UF-005): The sole authentication function has zero test coverage. Post-sign-out token replay, misconfigured Supabase URL, and JWT validation bypass are plausible failure modes with no automated detection.
- **No CORS, CSRF, or rate limiting on API routes** (UF-011): No current risk in local development, but cookie-based sessions via `@supabase/ssr` make CSRF protection necessary before network deployment.
- **Raw Supabase error text leaks to API responses** (UF-015): Schema details (table names, constraint names) visible in error responses. Minor information disclosure.
- **Cross-org report contamination** (UF-007): From a security perspective, the most realistic adversarial vector is a Phase 1.2 agent bug, not a direct user attack, but the impact (silent cross-org data aggregation) is a compliance concern.

#### Risks

- **Authentication bug affects every API route with no detection.** Probability: Unlikely. Impact: High. `buildServiceContext` is a single point of failure — a bug here affects all authenticated operations. No test or monitoring would catch it until exploited. (UF-005)
- **CSRF attack surface before deployment.** Probability: Possible (at Phase 1.3). Impact: Medium. Cookie-based sessions without CSRF protection expose mutation routes to cross-origin attacks when the application is deployed to a network. (UF-011)

### 6. Infrastructure & DevOps

#### Current State

Infrastructure is minimal and appropriate for Phase 1.1: local Supabase instance, Next.js dev server, no CI/CD pipeline, no deployment configuration. The `events` table's append-only triggers are in place for Phase 2 activation.

#### Strengths

- The reserved-seat pattern for the `events` table demonstrates forward planning — infrastructure is prepared without being prematurely activated.
- Migration files are well-structured and sequentially ordered.

#### Weaknesses

- **No CI/CD pipeline** to enforce invariants automatically. This is expected at Phase 1.1 but means convention-only enforcement (UF-002) has no automated backstop.
- **No automated grep-fail check** for hardcoded test URLs (CLAUDE.md Rule 8 — the rule exists but enforcement is manual).

#### Risks

- Infrastructure gaps are expected at this phase and do not represent architectural risk. All items are Phase 1.3 concerns.

### 7. Observability & Reliability

#### Current State

Observability consists of the audit_log table (synchronous mutation logging) and a static health endpoint. No structured logging, no metrics, no alerting. This is expected at Phase 1.1.

#### Strengths

- The audit_log table provides a complete, synchronous record of all mutations — a strong foundation for Phase 2 observability.
- The `trace_id` propagation pattern is established in the architecture (CLAUDE.md Rule 6), even though not all paths implement it fully.

#### Weaknesses

- **Health endpoint does not verify database connectivity** (UF-019): Returns static `{ status: "ok" }` without dependency checks. Becomes relevant at Phase 1.3 deployment.
- **No structured logging**: Expected at Phase 1.1 but worth noting as a Phase 1.3 baseline.

#### Risks

- Observability gaps are expected at this phase. The health endpoint gap (UF-019) becomes relevant at Phase 1.3 deployment with health-check-based routing, not before.

### 8. Performance & Scalability

#### Current State

Performance characteristics are minimal and appropriate for Phase 1.1 data volumes. The three-query batch pattern in `journalEntryService.list()` avoids N+1 queries. No pagination, no caching, no query optimization beyond basic patterns.

#### Strengths

- The batch query pattern in `journalEntryService.list()` (three parallel queries instead of N+1) demonstrates awareness of query efficiency.

#### Weaknesses

- **Unbounded result sets on list endpoints** (UF-020): No `.limit()` on list queries. Appropriate at Phase 1.1 volumes but will require pagination when entry counts reach hundreds per period.

#### Risks

- **List queries degrade at moderate data volumes.** Probability: Possible. Impact: Low. The three-query batch pattern is efficient but will need pagination at moderate volumes. Not a Phase 1.1 or 1.2 concern. (UF-020)

### 9. Code Quality & Maintainability

#### Current State

The codebase follows consistent patterns for the journal entry path: Zod validation at boundaries, `ServiceError` typed error handling, `withInvariants` middleware wrapping, and audit logging. The org service path diverges significantly in rigor. Four dead code files exist. Type generation from the database schema is stale.

#### Strengths

- Consistent Zod validation at service boundaries for the primary mutation path.
- The `ServiceError` type system provides structured, typed error handling that propagates cleanly from service to API route to frontend.
- CLAUDE.md and PLAN.md provide thorough architectural documentation, even where documentation-reality gaps exist (UF-002).

#### Weaknesses

- **Documentation-reality divergence is a systemic pattern** (UF-002): Four independent scanners found instances of authoritative documentation claiming guarantees that the implementation doesn't deliver. CLAUDE.md Rule 2 claims a lint rule that doesn't exist. Inline comments claim transactional atomicity that doesn't hold. The pattern creates false confidence.
- **Test coverage gaps at critical boundaries** (UF-013): `buildServiceContext` (zero tests), audit_log content assertions (untested), API route integration tests (incomplete), and cross-org report contamination (no test). Priority 1 items are confirmed Phase 1.2 blockers.
- **Dead code with misleading comments** (UF-017): `getMembership.ts` claims usage by `canUserPerformAction`, which does the same work inline. `membershipService.ts` duplicates `buildServiceContext` functionality. `CanvasContext` type is a correctly-labeled Phase 1.2 placeholder. `UserRole` is duplicated across files.
- **Informational spec deviations** (UF-021): Four spec deviations from PLAN.md are architecturally sound but undocumented as intentional. `journalEntryService.post()` complexity is natural and will self-resolve with the write RPC.

#### Risks

- **False confidence from documentation compounds over time.** Probability: Likely. Impact: Medium. Developers reading CLAUDE.md believe the build will catch violations. It won't. The pattern is dangerous precisely because the documentation is well-written and authoritative. (UF-002)
- **Untested authentication path is a single point of failure.** Probability: Possible. Impact: High. Combined with the test coverage gaps in UF-013, the testing posture leaves critical boundaries unverified. (UF-005, UF-013)

---

## Risk Map

| ID | Risk | Probability | Impact | Severity | Source Findings |
|----|------|-------------|--------|----------|----------------|
| R-01 | Agent retry on partial commit produces orphaned entries or un-audited mutations | Likely | High | Critical | UF-001 |
| R-02 | Convention-only enforcement of Laws 1 and 2 violated as codebase grows | Likely | High | Critical | UF-002, UF-014 |
| R-03 | Stale canvas data after agent mutations breaks user trust | Likely | High | Critical | UF-004 |
| R-04 | Authentication bug in `buildServiceContext` affects all API routes with no detection | Unlikely | High | Medium | UF-005 |
| R-05 | Service-role client modifies posted ledger entries with no database-level rejection | Possible | High | High | UF-006 |
| R-06 | Cross-org report contamination via agent bug passing stale account_id | Unlikely | High | Medium | UF-007 |
| R-07 | `chartOfAccountsService.get()` exposes cross-org reads when agent tools use it | Possible | Medium | Medium | UF-008 |
| R-08 | Phase 1.2 code follows ProposedEntryCard's `number` money type as precedent | Possible | Medium | Medium | UF-009 |
| R-09 | Org provisioning events are forensically unattributable | Possible | Medium | Medium | UF-003 |
| R-10 | Expired sessions produce silent empty dropdowns and unhelpful error messages | Possible | Medium | Medium | UF-010 |
| R-11 | False confidence from documentation compounds with new contributors | Likely | Medium | High | UF-002 |
| R-12 | Read-path authorization gaps expand with new agent read call sites | Possible | Medium | Medium | UF-012 |
| R-13 | CSRF attack surface when deployed with cookie-based sessions | Possible | Medium | Medium | UF-011 |
| R-14 | List queries degrade at moderate data volumes | Possible | Low | Low | UF-020 |
| R-15 | Schema details leak in error responses | Unlikely | Low | Low | UF-015 |

---

## Scalability Constraints

Performance scanning was sparse at Phase 1.1, as expected. The known constraints:

1. **Unbounded list queries** (UF-020): No `.limit()` on list endpoints. The three-query batch pattern in `journalEntryService.list()` is efficient (avoids N+1) but will need pagination when entry counts reach hundreds per period. This is not a Phase 1.1 or 1.2 concern but becomes one at moderate data volumes.

2. **No caching layer**: All reads go directly to the database. Acceptable at Phase 1.1 volumes. The Architecture Fit scanner noted clean extension points exist for adding caching without restructuring.

3. **Single-query aggregation for reports**: Report RPCs aggregate across all entries in a period without materialized views or pre-computation. Will need optimization if period entry counts reach thousands.

These constraints are appropriate for the current phase. None represent design flaws — they are intentional simplifications with clear scaling paths.

---

## Security Vulnerabilities

The following are specific to this codebase, not generic OWASP items:

1. **Untested authentication chain** (UF-005): `buildServiceContext` is the sole authentication function. Post-sign-out token replay, misconfigured Supabase URL, and JWT validation bypass are plausible failure modes. No test exercises any of these paths. A bug here would affect every authenticated API route.

2. **Cross-org report contamination** (UF-007): The FK from `journal_lines` to `chart_of_accounts` lacks an org cross-check. If a cross-org account reference is ever created (most likely via a Phase 1.2 agent bug), financial reports silently aggregate amounts from another organization. No detection mechanism exists.

3. **Ledger immutability bypass via service-role client** (UF-006): Journal entries and lines are protected by RLS deny-all for UPDATE/DELETE, but the `adminClient` (used by all service functions) bypasses RLS. No trigger prevents modification. Phase 1.2 agent tools will use `adminClient`, making this bypass exploitable by a software bug.

4. **`chartOfAccountsService.get()` missing org authorization** (UF-008): Currently unreachable (zero call sites), but if exposed as a Phase 1.2 agent tool, allows cross-org account detail reads. Three-line fix.

5. **No CORS/CSRF/rate limiting** (UF-011): Cookie-based sessions via `@supabase/ssr` make CSRF protection necessary before network deployment. No current risk in local development. Phase 1.3 concern.

6. **Raw error text leaks schema details** (UF-015): Table names and constraint names visible in API error responses. Minor information disclosure.

---

## Foundation Readiness Assessment

**Verdict: YES-WITH-CAVEATS**

The Phase 1.1 foundation is ready for Phase 1.2 agent integration, contingent on four specific fixes. The Two Laws are consistently enforced across all mutation paths. The `withInvariants` middleware is applied without exception. The service/API/database layering is clean. Multi-tenancy is structurally enforced via RLS and the service context pattern. The schema design is thorough and multi-currency-ready at the database and service layers.

**Four blockers must land before Phase 1.2 agent integration begins:**

1. **Transaction atomicity** (UF-001, Critical): The write RPC pattern wrapping entry + lines + audit_log in a plpgsql function. Already proven in `test_helpers.sql` and migration 007. Estimated: 1 day.
2. **Ledger immutability triggers** (UF-006, High): Append-only triggers on journal_entries and journal_lines, mirroring the existing events table pattern. Estimated: ~20-line migration.
3. **`chartOfAccountsService.get()` org check** (UF-008, Medium): Add `org_ids.includes()` guard matching the pattern in every other read function. Estimated: 3-line fix.
4. **Canvas refresh mechanism** (UF-004, High): A `refreshKey` counter, event bus, or React Query integration to refresh the canvas after mutations. The simplest option (refreshKey in SplitScreenLayout) matches the existing architecture.

**Three near-blockers should be addressed in Phase 1.2 sprint 1:**

5. **Auth chain test coverage** (UF-005, High): `buildServiceContext` has zero tests and is the sole authentication function.
6. **Org service parity** (UF-003, High): Missing audit trail, unchecked errors, no Zod validation.
7. **ProposedEntryCard money types** (UF-009): The `number` type must become `string`/`MoneyAmount` before the Phase 1.2 Zod schema references it.

The caveats are specific, bounded fixes with existing solution patterns in the codebase — not architectural redesigns. Items 1–3 are estimated at 1–2 days of implementation. The foundation is strong.

---

## Comparison to Prior Audits

First audit. No prior comparison available.

Phase 1.2's audit will be the first with real comparison data, enabling delta analysis (which findings were addressed, which grew in severity), quick win tracking, Foundation Readiness Assessment validation, and assessment of whether agent integration introduces finding categories not present in Phase 1.1.

---

## Audit Metadata

See `audit-metadata.md` for full execution details. Summary: six-session audit (Session A edits, Session B orientation, Session C three scans, Session D four scans, Session E synthesis, Session F write) using the four-phase C' execution model (Orientation → Category Scans → Synthesis → Write). 39 raw findings consolidated to 21 unified findings after deduplication and merging. 15 hypotheses investigated: 8 confirmed, 4 refuted, 1 partially confirmed, 1 inconclusive, 1 confirmed-as-known. Self-audit by the same Claude instance that helped build Phase 1.1 — bias risk is acknowledged throughout.
