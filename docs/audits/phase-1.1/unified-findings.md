# Unified Findings — Cross-Cutting Synthesis

Phase: End of Phase 1.1
Date: 2026-04-13
Input: 9 category findings logs, 39 total raw findings
Output: 21 unified findings (after dedup/merge)

---

## Hypothesis Verification

### H-01: journalEntryService.post() lacks transaction wrapping
- **Verdict:** Confirmed
- **Evidence:** BACKEND-001 (service-layer angle), DATALAYER-001 (constraint-semantics angle), BACKEND-007 (misleading comments). Three scanners independently confirmed. The deferred balance constraint fires correctly within the PostgREST auto-commit boundary for lines, but cannot provide cross-insert atomicity. Test helpers already demonstrate the write RPC solution.
- **Findings:** UF-001

### H-02: Reversal mirror check uses Number() coercion instead of decimal.js
- **Verdict:** Confirmed
- **Evidence:** BACKEND-002 confirmed local `toMoney`/`toRate` helpers use `Number().toFixed()` instead of canonical `decimal.js` helpers. CLAUDE.md Rule 3 violation. Realistic precision loss improbable but the pattern is wrong.
- **Findings:** UF-009

### H-03: orgService.createOrgWithTemplate has no audit trail
- **Verdict:** Confirmed
- **Evidence:** BACKEND-003 (correctness angle), SECURITY-002 (compliance angle). No `recordMutation` call anywhere in the org service. Additionally, H-09's unchecked membership error was confirmed in the same function.
- **Findings:** UF-003

### H-04: entry_number MAX+1 without row-level locking
- **Verdict:** Confirmed (known, partially documented)
- **Evidence:** BACKEND-001 H-04 response confirmed no `FOR UPDATE` lock. DATALAYER H-04 confirmed the UNIQUE constraint provides a safety net (collision → clear error, not silent corruption). Phase 1.1 single-user context makes this low-risk. Phase 1.2 agent concurrency will increase exposure.
- **Findings:** Folded into UF-013 (test coverage gaps — gap #7)

### H-05: Inconsistent response.ok checks in frontend fetch chains
- **Verdict:** Partially confirmed
- **Evidence:** BACKEND-004 and FRONTEND-003 confirmed: reference data fetches skip `response.ok`; primary data fetches check it. The pattern is inconsistent, not uniformly absent.
- **Findings:** UF-010

### H-06: Read-path services use adminClient with inline org checks
- **Verdict:** Confirmed (consistent pattern, two dormant gaps)
- **Evidence:** SECURITY H-06 verified the pattern is consistent. Two functions lack the check: `chartOfAccountsService.get()` (BACKEND-006, SECURITY-005) and `periodService.isOpen()` (ARCHFIT-002). The `buildServiceContext` membership fetch is sound — every user sees all their own memberships.
- **Findings:** UF-008, UF-012

### H-07: JournalEntryDetail uses plain string instead of branded MoneyAmount
- **Verdict:** Confirmed (type-system concern, no runtime bug)
- **Evidence:** BACKEND-008 and FRONTEND H-07 confirmed. The `as unknown as JournalEntryDetail` double assertion is the only one in the codebase. Runtime values are correctly coerced; the compiler cannot enforce the coercion.
- **Findings:** UF-009

### H-08: RLS policies on admin-only tables are SELECT-only by design
- **Verdict:** Refuted
- **Evidence:** DATALAYER H-08 and SECURITY H-08 independently concluded: SELECT-only RLS on admin tables is intentional defense-in-depth. RLS deny-by-default blocks user-context writes. The pattern is consistent and architecturally sound.
- **Surprise:** None — both scanners reached the same conclusion despite investigating independently. The hypothesis was correctly deprioritized by orientation (priority: low).

### H-09: orgService membership insert silently drops errors
- **Verdict:** Confirmed
- **Evidence:** BACKEND-003 H-09 confirmed the unchecked error. DATALAYER H-09 confirmed the UNIQUE constraint interaction. The membership insert is the sole unchecked mutation in a function where every other insert checks errors.
- **Findings:** UF-003

### H-10: buildServiceContext never tested
- **Verdict:** Confirmed
- **Evidence:** All three assigned scanners (Backend, Security, Code Quality) independently confirmed zero test hits for `buildServiceContext`. SECURITY-006 produced the most detailed risk analysis (JWT validation, post-sign-out token replay).
- **Findings:** UF-005

### H-11: Cross-org INSERT RLS policies exist and use org-scoped checks
- **Verdict:** Confirmed (structurally sound, untested defense-in-depth)
- **Evidence:** DATALAYER H-11 verified all four INSERT policies use `user_has_org_access()` or `user_is_controller()`. SECURITY H-11 confirmed the triple-layer write defense (URL/body match → withInvariants → Zod). The policies are correct but never exercised by tests. Since all writes go through `adminClient`, these are fourth-layer defense.
- **Findings:** Folded into UF-013 (testing gap context)

### H-12: Hardcoded 'CAD' currency in JournalEntryForm
- **Verdict:** Refuted
- **Evidence:** ARCHFIT H-12 and FRONTEND H-12 both confirmed: documented Phase 4 deferral with correct architectural boundaries. The form-level hardcoding is intentionally localized; service and database layers are multi-currency-ready.

### H-13: Client components import service-layer types
- **Verdict:** Refuted
- **Evidence:** All three assigned scanners verified: every import from `@/services/` in `src/components/` uses `import type`, erased at compile time. Next.js server/client boundary provides build-time enforcement.

### H-14: Seed memberships between auth users and orgs
- **Verdict:** Refuted
- **Evidence:** DATALAYER H-14 verified `dev.sql:30-42` correctly creates memberships. The friction journal claim was about running `db:reset` without `db:seed:all` — an operational sequence issue (DATALAYER-005), not a seed data correctness gap.
- **Findings:** UF-018

### H-15: Date serialization across boundaries
- **Verdict:** Inconclusive
- **Evidence:** FRONTEND H-15 and DATALAYER H-15 both found no evidence of breakage. The `YYYY-MM-DD` format is consistent across all layers. The boundary is theoretically fragile (PostgREST date serialization is not contractually guaranteed), but no current issue exists.

**Hypothesis quality assessment:** 15 hypotheses produced: 8 confirmed, 4 refuted, 1 partially confirmed, 1 inconclusive, 1 confirmed-as-known. The refuted hypotheses (H-08, H-12, H-13, H-14) were valuable — they verified that suspected gaps were actually intentional patterns. No hypothesis was left uninvestigated. The orientation phase performed well.

---

## Unified Findings

### Critical

#### UF-001: Transaction atomicity gap across journal entry creation path

- **Severity:** Critical
- **Source findings:** BACKEND-001 (Critical), DATALAYER-001 (High), BACKEND-007 (Medium)
- **Categories:** Backend Design, Data Layer, Code Quality
- **Synthesis note:** BACKEND-001 and DATALAYER-001 are preserved as paired angles. BACKEND-001 describes the service-layer orphan risk (three independent auto-committed inserts). DATALAYER-001 describes the constraint-semantics gap (deferred balance constraint fires at PostgREST auto-commit, not at an application transaction boundary, so tests and production operate at different constraint boundaries). BACKEND-007 adds that `recordMutation.ts` comments falsely claim transactional semantics, compounding the risk by creating false confidence.
- **Impact:** Phase 1.2 agent retry on partial commit produces orphaned entries or un-audited mutations. The test suite verifies constraint behavior under conditions (plpgsql function = single transaction) that don't match production (three HTTP calls = three transactions). This is the single highest-priority fix.
- **Resolution path:** Write RPC wrapping entry + lines + audit_log in a plpgsql function. Pattern already proven in `test_helpers.sql` and migration 007.

### High

#### UF-002: Documentation-reality divergence — aspirational-as-actual documentation

- **Severity:** High
- **Source findings:** QUALITY-001 (High), ARCHFIT-001 (Medium), BACKEND-007 (Medium), QUALITY-004 (Medium)
- **Categories:** Code Quality, Architecture Fit, Backend Design
- **Synthesis note:** QUALITY-001 named this as a systemic pattern with two confirmed instances. QUALITY-004 mapped the full enforcement landscape, revealing that Laws 1 and 2 — the two most important invariants — rely on convention only. ARCHFIT-001 is the sharpest instance: CLAUDE.md claims a build-time lint rule that doesn't exist. BACKEND-007 is the second instance: inline comments claim transactional atomicity that doesn't hold. Merged because all four findings describe the same meta-pattern; the severity reflects the systemic nature (found by three independent scanners).
- **Impact:** Developers trusting CLAUDE.md or inline comments make architectural assumptions based on guarantees that don't hold. Phase 1.2 adds more contributors and mutation paths, increasing the probability that convention-only rules are violated without detection.

#### UF-003: Org service rigor deficit — missing audit trail and unchecked errors

- **Severity:** High
- **Source findings:** BACKEND-003 (High), SECURITY-002 (High), BACKEND-005 (Low)
- **Categories:** Backend Design, Security & Compliance
- **Synthesis note:** BACKEND-003 and SECURITY-002 are preserved as paired angles. BACKEND-003 describes the correctness gap (missing `recordMutation`, unchecked membership error, four sequential mutations without transaction wrapping). SECURITY-002 describes the compliance gap (SOC 2 CC6.1/CC8.1 require auditable provisioning events; a rogue org creation is forensically unattributable). BACKEND-005 (inline error mapping) is absorbed as a third symptom of the same root cause: the org creation path was treated as scaffolding rather than production code.
- **Impact:** Org provisioning events have no audit trail. Failed membership inserts silently orphan orgs. The function's lower rigor level sets a bad pattern for Phase 1.2 mutation paths.

#### UF-004: No canvas refresh mechanism — Phase 1.2 agent integration blocker

- **Severity:** High
- **Source findings:** FRONTEND-001 (High)
- **Categories:** Frontend Architecture
- **Synthesis note:** Standalone finding — no other scanner surfaced this specific gap. ARCHFIT-003 noted clean agent extension points but did not identify the frontend refresh gap. FRONTEND-001 adds a fourth blocker to the Foundation Readiness Assessment's original three.
- **Impact:** Agent-driven mutations from the chat panel leave the canvas showing stale data. For an AI-native accounting platform, stale-after-mutation is a trust-breaking UX failure. Requires one of: event bus, React Query, or a simple `refreshKey` counter.

#### UF-005: Auth chain (buildServiceContext) untested — single point of authentication failure

- **Severity:** High
- **Source findings:** SECURITY-006 (High), QUALITY-005 (Medium, partially)
- **Categories:** Security & Compliance, Code Quality
- **Synthesis note:** Three scanners (Backend, Security, Code Quality) independently confirmed zero test coverage for `buildServiceContext`. SECURITY-006 produced the deepest analysis: post-sign-out token replay, misconfigured Supabase URL, and JWT validation bypass are all plausible failure modes with no automated detection. QUALITY-005 prioritized this as Priority 1 for Phase 1.2 readiness.
- **Impact:** A bug in the sole authentication function would affect every API route. No test or monitoring would catch it until exploited.

#### UF-006: Ledger immutability bypassable by service-role client

- **Severity:** High (elevated from Medium)
- **Source findings:** DATALAYER-003 (Medium), SECURITY-004 (Medium)
- **Categories:** Data Layer, Security & Compliance
- **Synthesis note:** Both scanners rated Medium independently. Elevated to High based on cross-cutting analysis: (1) the Architecture Fit scanner listed immutability triggers as one of three must-fix caveats for Phase 1.2, (2) agent tools will use `adminClient` via the service layer, making RLS-only enforcement insufficient, (3) the solution is trivial (~20-line migration) and the pattern already exists on the events table. The cost/benefit ratio strongly favors fixing this before Phase 1.2.
- **Severity justification:** Two independent scanners + Architecture Fit's blocker assessment + trivial fix cost + high-consequence failure mode (ledger modification) = High.
- **Impact:** Phase 1.2 agent tools using `adminClient` could accidentally UPDATE or DELETE posted journal entries with no database-level rejection.

### Medium

#### UF-007: Cross-org report contamination via missing FK guard

- **Severity:** Medium
- **Source findings:** DATALAYER-002 (Medium), SECURITY-003 (Medium)
- **Categories:** Data Layer, Security & Compliance
- **Synthesis note:** DATALAYER-002 identified the structural gap (simple FK, no org cross-check; LEFT JOIN aggregates cross-org amounts). SECURITY-003 added the adversarial analysis (most realistic vector: Phase 1.2 agent bug passing account_id from prior context). Merged because both describe the same root gap from complementary angles.
- **Impact:** If a cross-org account reference is ever created, financial reports silently include amounts from another org. No detection mechanism exists.

#### UF-008: chartOfAccountsService.get() missing org authorization

- **Severity:** Medium
- **Source findings:** BACKEND-006 (Medium), SECURITY-005 (Medium), QUALITY-003 (Medium, partially)
- **Categories:** Backend Design, Security & Compliance, Code Quality
- **Synthesis note:** Three scanners converged on the same function. BACKEND-006 flagged the missing `org_ids.includes()` check. SECURITY-005 added adversarial analysis (Phase 1.2 agent exposure path). QUALITY-003 noted the function also throws raw Supabase errors instead of `ServiceError`. This is a cluster finding: one function, three independent defects. Currently unreachable (no call site), becoming a Phase 1.2 blocker if exposed.
- **Impact:** Phase 1.2 agent tools calling this function would allow cross-org account detail reads. 3-line fix.

#### UF-009: Money type system inconsistencies

- **Severity:** Medium
- **Source findings:** BACKEND-002 (Medium), BACKEND-008 (Low), FRONTEND-002 (Medium)
- **Categories:** Backend Design, Frontend Architecture
- **Synthesis note:** Three distinct manifestations of the same gap: the codebase has not fully committed to branded money types at all boundaries. BACKEND-002: reversal mirror uses `Number()` instead of `decimal.js`. BACKEND-008: `JournalEntryDetail` declares money fields as plain `string`. FRONTEND-002: `ProposedEntryCard` declares money fields as `number`. All three are CLAUDE.md Rule 3 violations with varying severity. Merged because the fix is the same pattern: use `MoneyAmount`/`FxRate` branded types consistently.
- **Impact:** No runtime bug today (values are correct at runtime). Type-system gaps prevent the compiler from catching future regressions. `ProposedEntryCard`'s `number` type is a latent trap for Phase 1.2 agent implementation.

#### UF-010: Frontend fetch and error handling inconsistency

- **Severity:** Medium
- **Source findings:** BACKEND-004 (Medium), FRONTEND-003 (Medium), FRONTEND-004 (Medium)
- **Categories:** Backend Design, Frontend Architecture
- **Synthesis note:** Three findings describe different facets of the same gap: no shared fetch/error contract between API and frontend. BACKEND-004 cataloged the inconsistency. FRONTEND-003 described the UX impact (silent empty dropdowns). FRONTEND-004 described the form submission divergence (JournalEntryForm maps field-level errors; ReversalForm shows generic banners). A shared fetch wrapper would address all three.
- **Impact:** Expired sessions produce silent empty dropdowns. Server validation errors on reversals produce unhelpful messages. Phase 1.2 agent-generated inputs may bypass client-side validation, making server error display more important.

#### UF-011: No CORS, CSRF, or rate limiting on API routes

- **Severity:** Medium
- **Source findings:** SECURITY-001 (Medium)
- **Categories:** Security & Compliance
- **Synthesis note:** Standalone finding. No current risk (local dev). The scanner's self-audit note ("I was initially inclined to rate Low") is validated by cross-cutting analysis: the correct framing is Phase 1.3 deployment readiness. Cookie-based sessions via `@supabase/ssr` make CSRF protection necessary before network deployment.
- **Impact:** Phase 1.3 deployment without these protections exposes mutation routes to cross-origin attacks and denial-of-service.

#### UF-012: Read-path authorization is ad-hoc — no centralized enforcement

- **Severity:** Medium (elevated from Low)
- **Source findings:** ARCHFIT-002 (Low)
- **Categories:** Architecture Fit
- **Synthesis note:** Elevated from Low based on cross-cutting evidence: two functions already lack org checks (`chartOfAccountsService.get()` per UF-008, `periodService.isOpen()` per ARCHFIT-002). The scanner's self-audit note ("a fresh auditor might rate Medium") is validated — the pattern of ad-hoc inline checks with no fallback for omissions is exactly the kind of gap that grows with codebase size. Phase 1.2 agent tools will add more read call sites.
- **Severity justification:** Two confirmed omissions in the current codebase + Phase 1.2 expansion of read call sites = the gap is already demonstrated, not theoretical.
- **Impact:** Each new read function must remember to add the org check independently. A lightweight read middleware or extending `withInvariants` with read action types would centralize the check.

#### UF-013: Test coverage gaps prioritized for Phase 1.2 readiness

- **Severity:** Medium
- **Source findings:** QUALITY-005 (Medium)
- **Categories:** Code Quality
- **Synthesis note:** QUALITY-005 prioritized 8 documented test gaps plus one undocumented gap (cross-org report contamination test for UF-007). The prioritization is informed by cross-cutting analysis: Priority 1 items (API route integration tests, audit_log content assertions) are confirmed blockers by SECURITY-006 and BACKEND-001. One net-new gap identified: no test verifies report RPCs filter by `je.org_id`.
- **Impact:** Without Priority 1 tests, Phase 1.2 builds on an untested auth chain and an unverified audit trail.

#### UF-014: OrgSwitcher bypasses Law 1 — direct browser-to-database query

- **Severity:** Medium (elevated from Low)
- **Source findings:** FRONTEND-006 (Low)
- **Categories:** Frontend Architecture
- **Synthesis note:** Elevated from Low based on cross-cutting analysis with UF-002 (documentation-reality divergence). CLAUDE.md Law 1 states "All database access goes through `src/services/` only." The OrgSwitcher creates a Supabase browser client and queries `memberships` directly, bypassing the service layer. The scanner's self-audit note flagged this as potentially under-rated. Cross-cutting with UF-002: if the documentation claims strict enforcement of Law 1 but the codebase has an exception, this is another instance of the documentation-reality pattern. The pragmatic risk is low (RLS protects the query), but the pattern precedent matters.
- **Severity justification:** Law 1 is a non-negotiable rule with no documented exception for this component. Pattern precedent for Phase 1.2 outweighs the low practical risk.
- **Impact:** Sets a precedent that Law 1 has exceptions. Phase 1.2 agent components could follow the same pattern.

### Low

#### UF-015: Raw Supabase error text leaks to API responses

- **Severity:** Low
- **Source findings:** SECURITY-007 (Low), QUALITY-003 (Medium, partially)
- **Categories:** Security & Compliance, Code Quality
- **Synthesis note:** SECURITY-007 identified the information disclosure risk. QUALITY-003 identified the pattern where two services throw raw `PostgrestError` instead of `ServiceError`, bypassing the error-to-HTTP pipeline entirely. The information disclosure is minor (table/constraint names, not credentials), but the pattern is inconsistent.
- **Impact:** Schema details (table names, constraint names) visible in error responses. Minor information disclosure.

#### UF-016: Phase 1.2 agent integration surface needs runtime validation

- **Severity:** Low
- **Source findings:** FRONTEND-005 (Low), ARCHFIT-003 (Low)
- **Categories:** Frontend Architecture, Architecture Fit
- **Synthesis note:** FRONTEND-005 flagged the canvas directive system's lack of runtime validation for agent-generated directives. ARCHFIT-003 noted agent extension points are clean but undocumented. Both are Phase 1.2 first-sprint work, not blockers. Merged because both describe the same readiness gap: the agent integration surface exists but needs validation and documentation.
- **Impact:** Agent-generated directives not validated at runtime. No documented integration guide. Both are Phase 1.2 sprint 1 items.

#### UF-017: Dead code — four unused exports with misleading comments

- **Severity:** Low
- **Source findings:** QUALITY-002 (Low)
- **Categories:** Code Quality
- **Synthesis note:** Standalone finding. `getMembership.ts` is the most misleading — its comment claims usage by `canUserPerformAction`, which does the same work inline. `CanvasContext` type is a documented Phase 1.2 placeholder. `UserRole` is duplicated between `userRole.ts` and `canUserPerformAction.ts`.
- **Impact:** Minor contributor confusion. The `getMembership.ts` misleading comment is the sharpest instance.

#### UF-018: Developer friction in seed/reset workflow

- **Severity:** Low
- **Source findings:** DATALAYER-005 (Low)
- **Categories:** Data Layer
- **Synthesis note:** `pnpm db:reset` alone produces an unusable database. Must be followed by `pnpm db:seed:all`. The friction journal's claim about missing memberships was about this operational sequence, not a code bug (H-14 refuted). A `db:reset:all` convenience script would eliminate the friction.
- **Impact:** Developer confusion on fresh setup. No data integrity impact.

#### UF-019: Health endpoint does not verify database connectivity

- **Severity:** Low
- **Source findings:** OBSERVE-001 (Low)
- **Categories:** Observability & Reliability
- **Synthesis note:** Static health endpoint returns `{ status: "ok" }` without checking dependencies. Becomes relevant at Phase 1.3 deployment with health-check-based routing.
- **Impact:** No current impact. Phase 1.3 concern.

#### UF-020: Unbounded result sets on list endpoints

- **Severity:** Low
- **Source findings:** PERF-001 (Low)
- **Categories:** Performance & Scalability
- **Synthesis note:** No `.limit()` on list queries. Appropriate at Phase 1.1 volumes. The three-query batch pattern in `journalEntryService.list()` is efficient (avoids N+1) but will need pagination at moderate data volumes.
- **Impact:** No current impact. Will require pagination when entry counts reach hundreds per period.

#### UF-021: Informational findings — Phase 1.1 spec deviations and natural complexity

- **Severity:** Low (informational)
- **Source findings:** ARCHFIT-004 (Low), QUALITY-006 (Low), DATALAYER-004 (Low), DATALAYER-006 (Low)
- **Categories:** Architecture Fit, Code Quality, Data Layer
- **Synthesis note:** Four findings that document the state of the codebase without identifying actionable gaps. ARCHFIT-004: four spec deviations from PLAN.md are architecturally sound. QUALITY-006: `journalEntryService.post()` complexity will self-resolve when the write RPC is introduced. DATALAYER-004: `journal_entry_attachments` SELECT-only RLS is consistent with admin-only-writes pattern. DATALAYER-006: RPC SECURITY INVOKER with service_role GRANT is correct but has implicit org isolation. Grouped as informational.
- **Impact:** None requiring action. These findings document reviewed decisions and accepted patterns.

---

## Cluster Findings

### Cluster A: The `chartOfAccountsService.get()` cluster

**Functions:** `chartOfAccountsService.get()` (lines 47-66)
**Findings:** BACKEND-006 + SECURITY-005 + QUALITY-003 → UF-008
**Pattern:** One function, three independent defects — missing org authorization check, dormant cross-org read exposure for Phase 1.2, and raw error throwing bypassing ServiceError pipeline. Currently unreachable (zero call sites), but is a natural Phase 1.2 agent tool target. Fix all three before exposing.

### Cluster B: The documentation-reality divergence cluster

**Files/artifacts:** CLAUDE.md Rule 2, `recordMutation.ts` comments, `orgService` Rule 5 gap, `eslint.config.mjs`
**Findings:** QUALITY-001 + ARCHFIT-001 + BACKEND-007 + QUALITY-004 → UF-002
**Pattern:** Authoritative documentation describes enforcement mechanisms (lint rules, transactional semantics, defense-in-depth validation) that don't exist in the codebase. Four scanners independently found instances. The systemic nature elevates what would be Medium-severity individual findings to High.

### Cluster C: The `orgService.createOrgWithTemplate` rigor cluster

**Functions:** `orgService.createOrgWithTemplate` (lines 14-87), `org/route.ts`
**Findings:** BACKEND-003 + SECURITY-002 + BACKEND-005 → UF-003
**Pattern:** One function written with systematically lower rigor than `journalEntryService.post()` — no `recordMutation` call, unchecked membership insert error, inline error mapping instead of `serviceErrorToStatus`, no service-level Zod validation. The org creation path was treated as scaffolding.

### Cluster D: The transaction atomicity cluster

**Functions:** `journalEntryService.post()`, `recordMutation()`, test helpers
**Findings:** BACKEND-001 + DATALAYER-001 + BACKEND-007 → UF-001
**Pattern:** The same absence of transaction wrapping surfaces as: orphaned entries (Backend angle), constraint boundary mismatch between test and production (Data Layer angle), and misleading comments creating false confidence (Code Quality angle). Three views of one critical gap.

### Cluster E: The money type system cluster

**Files:** `journalEntryService.ts:208-209`, `journalEntryService.ts:274-289`, `proposedEntryCard.ts:9-10`
**Findings:** BACKEND-002 + BACKEND-008 + FRONTEND-002 → UF-009
**Pattern:** The codebase has not fully committed to branded money types at all boundaries. Three locations where `MoneyAmount`/`FxRate` branded types should be used but aren't — using `Number()`, plain `string`, or `number` instead. All three are CLAUDE.md Rule 3 violations.

---

## Cross-Cutting Patterns

### Pattern 1: Convention-vs-Enforcement Gaps

**Definition:** Critical invariants enforced by author discipline rather than automated checks (lint rules, type system, database constraints).

**Instances:**
- Law 1 (all DB through services) — `adminClient` can be imported anywhere; no lint rule restricts it. UF-002, UF-014.
- Law 2 (all mutations through `withInvariants`) — claimed lint rule doesn't exist. UF-002.
- Rule 5 (Zod at every boundary) — `orgService.createOrgWithTemplate` skips service-level validation. UF-003.
- Read-path authorization — inline `org_ids.includes()` with no fallback for omissions. UF-012.
- Ledger immutability — RLS deny-all, convention-only at service-role level. UF-006.

**Significance:** Phase 1.1 has 2 mutation routes and 1 developer. Convention works. Phase 1.2 adds agent tools, more mutation paths, and potentially more contributors. The probability of a convention violation increases linearly with codebase size. The three cheapest fixes: ESLint import restriction for `adminClient`, CI check for `withInvariants` wrapping, immutability triggers on ledger tables.

### Pattern 2: Documentation-Reality Divergence

**Definition:** Authoritative documentation (CLAUDE.md, inline code comments) describes guarantees that the implementation doesn't deliver.

**Instances:**
- CLAUDE.md Rule 2 claims `no-unwrapped-service-mutation` lint rule. Doesn't exist. UF-002.
- `recordMutation.ts` comments claim transactional atomicity. Not implemented. UF-001, UF-002.
- `orgService.createOrgWithTemplate` — CLAUDE.md Rule 5 (Zod at every boundary) and Rule 6 (trace_id through audit_log) are both violated. UF-003.
- `getMembership.ts` comment claims usage by `canUserPerformAction`. Not true. UF-017.
- CLAUDE.md Law 1 claims all DB through services. OrgSwitcher queries directly. UF-014.

**Significance:** Creates false confidence. Developers reading CLAUDE.md believe the build will catch violations. It won't. The pattern is dangerous precisely because the documentation is well-written and authoritative — it invites trust.

### Pattern 3: Phase 1.2 Readiness Gaps

**Definition:** Specific defects that are acceptable in Phase 1.1 (single-user, local dev) but become blockers when Phase 1.2 introduces agent-driven mutations, retry semantics, and additional call sites.

**Instances:**
- Transaction atomicity (UF-001) — agent retries on partial commits cause corruption.
- Ledger immutability (UF-006) — agent tools with `adminClient` could modify posted entries.
- `chartOfAccountsService.get()` (UF-008) — agent tools expose the dormant authorization gap.
- Canvas refresh (UF-004) — agent mutations leave UI showing stale data.
- Auth chain untested (UF-005) — agent `ServiceContext` construction relies on untested code.
- `ProposedEntryCard` number types (UF-009) — agent will follow this type to produce money as numbers.

**Significance:** Six findings are explicitly Phase 1.2 blockers or near-blockers. The Architecture Fit scanner identified the first three; FRONTEND-001 added the fourth; cross-cutting analysis confirms the fifth and sixth. See Foundation Readiness Assessment below.

### Pattern 4: Runtime-vs-Compile-Time Boundaries

**Definition:** Locations where TypeScript's compile-time guarantees diverge from runtime behavior at external system boundaries.

**Instances:**
- Money type gaps — `Number()` vs `decimal.js`, plain `string` vs `MoneyAmount`, `number` vs `string`. UF-009.
- Supabase driver coercion — `NUMERIC` returned as JS numbers, patched by `toMoneyAmount`/`toFxRate` at service boundaries. Known concern #3.
- Date serialization — `YYYY-MM-DD` consistent today but PostgREST behavior not contractually guaranteed. H-15 inconclusive.
- `JournalEntryDetail` double assertion — `as unknown as JournalEntryDetail` bypasses type safety. UF-009.

**Significance:** The codebase handles external system boundaries well in practice (coercion helpers, Zod validation). But the boundary patches are ad-hoc, not systematic. When Phase 1.2 adds the Anthropic API as another external boundary, the same pattern class will likely recur.

### Pattern 5: Placeholder Code as Latent Traps

**Definition:** Code written early in Phase 1.1 that compiles correctly but encodes incorrect assumptions. These are not bugs today — they become bugs when Phase 1.2 code follows the existing patterns.

**Instances:**
- `ProposedEntryCard` `number` type for money fields — written pre-v0.5.3 before the money-as-string rule. UF-009.
- `OrgSwitcher` browser-to-DB query — works via RLS but violates Law 1. UF-014.
- `getMembership.ts` — dead code with misleading comment claiming active usage. UF-017.
- `CanvasContext` type — Phase 1.2 placeholder, correctly labeled. UF-017.
- `membershipService.ts` — dead code duplicating `buildServiceContext` functionality. UF-017.

**Significance:** The traps are individually trivial. The pattern risk is that Phase 1.2 developers see existing code and follow it — writing more `number` money fields, more direct DB queries, more helper functions that duplicate existing ones.

---

## Severity Recalibration

Four findings were explicitly flagged by scanner self-audit notes as potentially under-rated. Cross-cutting analysis on each:

| Finding | Scanner Rating | Self-Audit Note | Synthesis Rating | Justification |
|---------|---------------|-----------------|-----------------|---------------|
| ARCHFIT-002 | Low | "fresh auditor might rate Medium" | **Medium** (UF-012) | Two functions already lack the org check. Phase 1.2 adds agent read call sites. The gap is demonstrated, not theoretical. |
| SECURITY-001 | Medium | "initially inclined to rate Low" | **Medium** (UF-011) | Scanner was right to upgrade. Cookie-based sessions via `@supabase/ssr` make CSRF protection necessary before network deployment. |
| QUALITY-006 | Low | self-audit note on generosity | **Low** (UF-021) | The function is readable and the write RPC will naturally decompose it. The self-audit concern is acknowledged but the rating holds. |
| FRONTEND-006 | Low | "OrgSwitcher Law 1 break" | **Medium** (UF-014) | Pattern precedent matters. Law 1 is non-negotiable with no documented exception. Cross-cutting with UF-002 (documentation-reality divergence) reinforces the upgrade. |

Additionally, one finding pair was elevated without a scanner self-audit note:

| Findings | Scanner Rating | Synthesis Rating | Justification |
|----------|---------------|-----------------|---------------|
| DATALAYER-003 + SECURITY-004 | Medium (both) | **High** (UF-006) | Architecture Fit listed immutability triggers as a must-fix Phase 1.2 caveat. Two independent scanners + blocker assessment + trivial fix cost + high-consequence failure mode. |

---

## Retrospective Validation

*Section written after completing sections 1-5, then reading `docs/phase-1.1-retrospective.md`.*

### "Three external-system boundary classes" — validated, partially overlapping

The retrospective names three runtime-shape bug classes discovered during the build: (1) React hook re-render semantics (`form.watch` vs `useWatch`), (2) PostgREST embed shapes (many-to-one returned as object, not array), (3) Postgres NUMERIC serialization (returned as JS numbers, not strings). The scanners' Pattern 4 (Runtime-vs-Compile-Time Boundaries) captures the same meta-pattern. However, the scanners only found live evidence of class #3 — the money type gaps (UF-009, H-02, H-07) and the broader boundary coercion discipline. Classes #1 and #2 were build-time bugs that were fixed; the scanners correctly didn't re-surface them as findings. The retrospective's pattern is broader than what the scanners can see: it describes a *class of future bugs*, while the scanners found *current instances*. The retrospective's prediction — "Phase 1.2 will have a fourth instance (Claude API responses)" — is not something the scanners could validate, but it aligns with the scan findings showing that boundary coercion is ad-hoc rather than systematic.

### "Documentation-reality divergence" — naming convergence with QUALITY-001

The retrospective's Section 7 item 4 says: "CLAUDE.md claims [the lint rule] exists. It doesn't." This is ARCHFIT-001, the sharpest instance of QUALITY-001's named pattern ("aspirational-as-actual documentation"). The retrospective's Section 2 also captures a broader version: "the documents and the running system were different systems." QUALITY-001's framing is code-focused (CLAUDE.md rules, inline comments); the retrospective's framing includes spec-to-implementation divergence discovered during Task 2. Both are valid — the retrospective's version is broader and process-oriented, the scanner's version is specific and evidence-grounded. No contradiction.

### FRONTEND-001 in the retrospective's Phase 1.2 needs — confirmed and amplified

The retrospective's Section 6 explicitly references FRONTEND-001: "From the build-experience side, Phase 1.2 also needs something the audit couldn't measure: a canvas refresh mechanism." The retrospective adds build-experience context that the scan couldn't provide — framing the canvas refresh gap as "the equivalent of a broken promise" for an AI-native platform. The scan and the retrospective converge on the same finding from independent angles (code analysis vs build experience). The retrospective's claim that "the audit couldn't measure" the canvas refresh need is slightly inaccurate — FRONTEND-001 did measure it, rated it High, and the Architecture Fit scanner endorsed it as a fourth blocker. The retrospective may have been written before seeing the Architecture Fit scan's Foundation Readiness Assessment.

### Retrospective observations not captured by scans

Three retrospective patterns have no scanner equivalent:
1. **Working-memory limitation** (Section 3) — the distinction between recall (degrades) and coherence checking (does not) is a process insight invisible to code analysis.
2. **Subagent brief calibration** (Section 3) — "literal code for interfaces, descriptive prose for behaviors" is a collaboration pattern the scanners cannot assess.
3. **Per-test org isolation** recommendation (Section 7 item 3) — the scanners noted shared-state test concerns (H-04, H-11, QUALITY-005) but didn't propose this specific architectural solution. The retrospective's recommendation is more actionable than the scanner findings.

### Retrospective observations confirmed by scans

1. **Self-audit bias** (Section 3) — the retrospective's honest description of bias matches the four scanner self-audit notes and the three severity recalibrations this synthesis performed.
2. **OrgSwitcher as the one Law 1 exception** (Section 8) — the retrospective says "OrgSwitcher's membership query is the one exception, and the audit correctly flagged it." FRONTEND-006 / UF-014 confirmed.
3. **The write RPC solution path** (Section 6) — the retrospective's Phase 1.2 needs list matches the Architecture Fit scanner's three blockers exactly.

### No contradictions found

The retrospective and the scan findings are complementary, not contradictory. The retrospective provides process context and future predictions; the scans provide code-level evidence and structural analysis. Where they overlap (documentation-reality divergence, canvas refresh, Three Laws enforcement, self-audit bias), they converge.

---

## Scanner Blind Spots

The retrospective flagged three patterns the scanners did not catch:

1. **Per-test org isolation as the solution to shared-state test fragility.** Scanners identified the shared-state problem (H-04, H-11, QUALITY-005 gap #7) but none proposed per-test org isolation as the architectural solution. The retrospective's recommendation (each test creates its own org) is more actionable than the scanner findings. Future scan prompts should ask: "for each testing gap identified, what is the architectural fix, not just the test that's missing?"

2. **Session boundary discipline as a code provenance risk.** The retrospective's "14 uncommitted files" discovery (Section 3) is a process gap that no code-level scanner could detect. The scan framework should consider adding a "provenance check" step: at audit time, verify that `git status` is clean and no uncommitted load-bearing code exists.

3. **The prediction that Claude API responses will be the next boundary bug class.** The scanners found evidence of the boundary pattern (Pattern 4) but couldn't predict its next instance. The retrospective's forward-looking pattern application is a capability the scan framework should consider integrating: ask scanners to predict where known patterns will recur in the next phase, not just where they exist today.

---

## Foundation Readiness Assessment (Preliminary)

**Verdict: YES-WITH-CAVEATS — agreeing with Architecture Fit's assessment, with an expanded blocker list.**

The Architecture Fit scanner identified three blockers and one non-blocker caveat. FRONTEND-001 added a fourth blocker. Cross-cutting analysis confirms all four and adds nuance:

**Blockers (must fix before Phase 1.2 agent integration):**

1. **Transaction atomicity** (UF-001, Critical) — Confirmed as the single highest-priority fix. The write RPC pattern is already proven in the codebase. Estimated: 1 day.

2. **Ledger immutability triggers** (UF-006, High, elevated from Medium) — The events table pattern already exists. Agents using `adminClient` make this essential. Estimated: ~20-line migration.

3. **chartOfAccountsService.get() org check** (UF-008, Medium) — 3-line fix. Must be done before any agent tool exposes this function.

4. **Canvas refresh mechanism** (UF-004, High) — Agent mutations must trigger canvas refreshes. The simplest option (refreshKey counter in SplitScreenLayout) matches the existing architecture.

**Near-blockers (should fix in Phase 1.2 sprint 1):**

5. **Auth chain test coverage** (UF-005, High) — `buildServiceContext` is the sole authentication function and has never been tested. Agent sessions will construct `ServiceContext` through the same path.

6. **Org service parity** (UF-003, High) — Missing audit trail, unchecked errors. Should be fixed before Phase 1.2 adds more mutation paths.

7. **ProposedEntryCard money types** (UF-009, partially) — The `number` type must be changed to `string`/`MoneyAmount` before the Phase 1.2 Zod schema is written for this type.

**The foundation is strong.** The Two Laws are consistently enforced. The `withInvariants` middleware is correctly applied. The service/API/database layering is clean. Multi-tenancy is structurally enforced. The schema design is thorough. The caveats are specific, bounded fixes — not architectural redesigns. Items 1-3 are estimated at 1-2 days of implementation. The codebase is well-positioned for Phase 1.2 agent integration.

---

## Comparison to Prior Audits

This is the first comprehensive audit of The Bridge codebase. There is no prior audit to compare against. Phase 1.2's audit will be the first with real comparison data, enabling:

- Delta analysis: which Phase 1.1 findings were addressed, which grew in severity
- Quick win tracking: which action plan items were completed
- Foundation Readiness Assessment validation: did the YES-WITH-CAVEATS verdict and its four blockers prove accurate
- New category emergence: whether agent integration introduces finding categories not present in Phase 1.1

---

## Scanner Blind Spots

*To be populated after retrospective validation.*

---

## Synthesis Summary

The Phase 1.1 codebase is architecturally sound with a strong service-layer discipline, thorough schema design, and consistent multi-tenancy enforcement. The single most critical issue is the transaction atomicity gap (UF-001) — three independent database inserts in `journalEntryService.post()` without transaction wrapping, incompatible with Phase 1.2 agent retry semantics. The most pervasive pattern is documentation-reality divergence (UF-002) — authoritative documentation claiming enforcement mechanisms that don't exist, creating false confidence that compounds as the codebase grows. The overall risk posture for Phase 1.2 is manageable: four specific blockers, all with bounded fixes and existing solution patterns in the codebase. The foundation is ready for expansion with targeted hardening.
