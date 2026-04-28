# Architecture Fit — Findings Log

**Scanner:** Architecture Fit Category (Phase 2 Audit)  
**Phase:** End of Phase 1.2 (HEAD = 32760e1)  
**Date:** 2026-04-27  
**Hypotheses investigated:** H-04, H-05, H-06, H-09, H-11, H-12, H-14, H-15  

---

## Hypothesis Responses

### H-04: Read-path authorization gaps on org-scoped service methods

**Status:** Confirmed (partial)

**Evidence:**
- `src/services/accounting/chartOfAccountsService.ts:47-65` — `get()` method **lacks** the `ctx.caller.org_ids.includes(input.org_id)` check. The list method at line 16-25 performs the check correctly.
- `src/services/accounting/periodService.ts:52-80` — `isOpen()` method **lacks** org membership validation. Pre-check does not exist; the query filters by `org_id` but does not verify caller access.
- Both methods are reachable from agent orchestrator: `chartOfAccountsService.get` is called indirectly via `listChartOfAccounts` (line 1251-1252 in orchestrator); `periodService.isOpen` is called directly at line 1257-1260.
- Pattern contrast: `chartOfAccountsService.list()` and `periodService.listOpen()` both perform the check; single-record getters do not.

**Notes for other scanners:**  
This is a Backend Design & API finding with Authorization implications. The Security & Compliance scanner should verify whether the RLS-policy layer compensates (though adminClient bypasses RLS). The pattern gap is consistency: read-path enforcement is sometimes at the service layer and sometimes deferred to RLS, with no documented rule for which applies where.

---

### H-05: Ledger immutability enforcement missing trigger pattern

**Status:** Confirmed

**Evidence:**
- `supabase/migrations/` grep for append-only triggers: `grep -r "journal_entries_no_update\|journal_entries_no_delete" /home/philc/projects/chounting/supabase/migrations/` yields no results. The triggers do not exist.
- Contrast: `20240122000000_audit_log_append_only.sql` **does** have `CREATE TRIGGER audit_log_no_update ... RAISE EXCEPTION`. The pattern exists elsewhere but not on journal tables.
- `src/services/accounting/journalEntryService.ts` at lines 102-180 relies entirely on convention: no INSERT guard at the service layer, no database trigger. The comment at line 13 states "Law 2: All journal entries are created by journalEntryService.post() only" — this is convention-enforced, not mechanically enforced.
- RLS policies `journal_entries_no_update` and `journal_entries_no_delete` exist but do not apply to `adminClient()` (service-role Supabase client).

**Consequence:**  
A future bug in the service layer (or direct adminClient call from a route handler that forgets withInvariants) can mutate posted ledger entries silently. Phase 1.1 audit flagged this as UF-006; Phase 1.2 did not implement the recommended trigger fix.

---

### H-06: Transaction atomicity gap across multi-call service writes

**Status:** Confirmed

**Evidence:**
- `src/services/accounting/journalEntryService.ts:131-228` — four sequential PostgREST calls: `INSERT journal_entries` (line 154), `INSERT journal_lines` (line 206), `recordMutation` call (line 220), and no explicit transaction wrapping.
- Each PostgREST `.insert()` or `.select()` call auto-commits at return. The deferred balance constraint fires at step 2 (journal_lines insert), but if step 3 (recordMutation) fails, the ledger mutation persists without an audit row.
- `src/services/audit/recordMutation.ts` JSDoc (line 45-51) states "Atomicity is guaranteed if the caller uses the same client" — but there is no plpgsql RPC that wraps the three writes. The "same client" assumption is convention-only.
- The comment at line 215-219 documents that recordMutation runs inside `adminClient()` for "synchronous write" (Simplification 1), but makes no mention of atomicity guarantees beyond the async-avoided-by-convention.

**Consequence:**  
Partial-state window: if audit_log insert fails, posted entry remains without a breadcrumb. Phase 1.1 flagged as UF-001; remains in Phase 1.2.

---

### H-09: Period lock enforcement checks only is_locked, not entry_date consistency

**Status:** Confirmed

**Evidence:**
- `src/services/accounting/journalEntryService.ts:107-119` — checks `period.is_locked = false` only. No call to `periodService.isOpen()` to validate `entry_date` within `[start_date, end_date]`.
- `src/services/accounting/periodService.ts:60-65` — `isOpen()` exists with correct date-range logic (`lte('start_date', input.entry_date).gte('end_date', input.entry_date)`), but grep confirms zero call sites from journalEntryService.
- The agent's `checkPeriod` tool (orchestrator line 1255-1260) calls `periodService.isOpen()` correctly, so the agent can validate; but the manual entry route does not.
- An attacker can POST a journal entry with `entry_date` = locked-period-date while supplying an open period's `fiscal_period_id`, defeating INV-LEDGER-002 in spirit.

---

### H-11: MFA enforcement middleware exists but is unwired to the request path

**Status:** Confirmed

**Evidence:**
- `src/middleware/mfaEnforcement.ts` — 50 lines, exports `enforceMfa` function (line 10), fully implemented.
- `middleware.ts` at repo root — performs **only** i18n routing via `next-intl/middleware`. Does **not** import or call `enforceMfa`.
- `grep -r "enforceMfa" /home/philc/projects/chounting/src/` yields two results: the export at line 10 of mfaEnforcement.ts and the test import at `tests/integration/mfaEnforcementMiddleware.test.ts`.
- Test file header confirms "the actual redirect behavior is verified manually in the browser"; the test asserts column-flips and function-exports, not that the redirect runs.
- `organizations.mfa_required` is settable (Phase 1.5B), but flipping to true produces no runtime effect because middleware.ts never invokes enforceMfa.

**Notes for other scanners:**  
This is a Frontend Architecture & Test Coverage finding. The pattern is "code exists, not wired, test doesn't catch it." Characteristic of Phase 1 implementation where features ship scaffolded but incomplete.

---

### H-12: Service layer mutation CI guard absent; withInvariants wrap is convention-only

**Status:** Confirmed

**Evidence:**
- `eslint.config.mjs` — lines 13-25 show only TypeScript and Next.js core rules. No `no-restricted-imports` rule. No enforcement of `withInvariants` wrapping or `adminClient` import boundaries.
- Phase 1.1 audit identified this gap (UF-002); Phase 1.2 did not add a rule.
- `src/app/api/orgs/[orgId]/journal-entries/route.ts:76-83` shows the wrap pattern (correct), but there is no lint rule that would reject a future route that imports `journalEntryService.post` and calls it unwrapped.
- `src/app/api/agent/reject/route.ts` — checked; this route calls `adminClient()` directly (line 50 `await db.from(...)`) for ai_actions updates, **not** via a service function. This is documented in the file header as "inline adminClient pattern" and is deliberate per sub-brief §4, but a future similar route could miss this distinction and bypass withInvariants by accident.

**Consequence:**  
Pattern is convention-only. A future contributor could accidentally wire a mutating service without the wrap, bypassing authorization checks silently.

---

### H-14: Anthropic SDK message shape drift — cache_read/cache_creation tokens

**Status:** Inconclusive (likely present but not directly exercised)

**Evidence:**
- Commit 856dcc7 (caching enablement, S22) restructured `system: string` → `system: TextBlockParam[]`, requiring a compat-shim at `tests/setup/getSystemPromptText.ts`.
- `src/agent/orchestrator/callClaude.ts` — code calls Anthropic SDK `messages.create()`. Does not explicitly read `usage.cache_read_input_tokens` or `usage.cache_creation_input_tokens` fields (grep confirms zero matches for those field names in orchestrator or related files).
- The internal Anthropic SDK types (imported from `@anthropic-ai/sdk`) may have drifted between Sept 2025 and Apr 2026. The codebase does not read cache-token fields, so drift in those fields is latent (present but not triggered by current code).
- Phase E findings (friction-journal) note that S22 caching produces `cache_read_input_tokens=0` on warm-state calls, suggesting the field exists and is read by the cost-tracking logic, but the orchestrator itself does not parse it.

**Notes for other scanners:**  
This is a boundary-mismatch (external SDK vs internal types). The fourth instance of the boundary-bug pattern (per DESIGN.md Constraint #5). Currently latent because the orchestrator doesn't read the fields, but if Phase 2 adds cost tracking or token-budget enforcement, this gap could activate.

---

### H-15: Agent tool selection hints insufficient for disambiguating cross-org access

**Status:** Inconclusive (prompt fixed, service gaps remain)

**Evidence:**
- `src/agent/prompts/` — Session 8 C8 commit bd5cd75 added TOOL_SELECTION_HINTS to disambiguate tools in Mode B (multi-org context). Inspecting the buildSystemPrompt reveals org-scoped tool hints injected into the system prompt.
- Underlying service gaps remain: `chartOfAccountsService.get()` (H-04 finding above) lacks org-check; `periodService.isOpen()` (H-09 above) lacks org-check.
- The test at Session 8 C8 (commit body acknowledges) "guards plumbing, not real-Claude prompt-contract behavior." Behavioral validation deferred to C7 EC-13, which closed PARTIAL on OI-2 + Class 2 without exercising the org_id confusion vector.
- Conclusion: Prompt fix alone is insufficient if service layer has holes. The finding is architecturally a layering-leak: the agent compensates for service-layer gaps by prompting carefully, rather than the service layer defending.

---

## Findings

### ARCHFIT-001: Read-path org-membership checks missing on two critical service methods

**Severity:** High

**Description:**  
`chartOfAccountsService.get()` and `periodService.isOpen()` lack the mandatory org-membership pre-flight check that every other read-scoped service function performs. While `chartOfAccountsService.list()` correctly checks `ctx.caller.org_ids.includes(input.org_id)` at the entry point, the single-record getter does not. Similarly, `periodService.isOpen()` queries by org_id but does not validate that the caller has access to that org. Both methods are reachable from the agent orchestrator's executeTool path, creating a potential cross-org data leak: the agent can request accounts or periods from orgs it does not belong to, and the service layer will return them (though RLS-protected reads might fail at the DB layer, the service layer has no defense-in-depth).

The pattern inconsistency is itself a risk: some read paths enforce at the service layer, some rely on RLS. This creates a hidden assumption that `adminClient()` queries are always RLS-protected, which is correct today but fragile if ownership changes or the code pattern drifts.

**Evidence:**
- `src/services/accounting/chartOfAccountsService.ts:47-65` — `get()` method has no org_ids check; contrast `list()` at line 16-25 which performs the check.
- `src/services/accounting/periodService.ts:52-80` — `isOpen()` method has no org_ids check; `listOpen()` at line 27 correctly checks.
- `src/agent/orchestrator/index.ts:1251-1260` — both methods called from agent executeTool; `listChartOfAccounts` calls `chartOfAccountsService.list()` (correctly guarded), and `checkPeriod` calls `periodService.isOpen()` (gap exposed).

**Consequence:**  
Cross-org data leak at the service boundary. A malicious or buggy agent could exfiltrate account names, periods, and metadata from other orgs in the same database. RLS might prevent actual balance queries, but structural information leaks. Phase 1.1 audit flagged chartOfAccountsService.get as Medium-severity "has no callers"; Phase 1.2 made it reachable, elevating the risk.

**Cross-references:**
- H-04 (hypothesis confirmed)
- Security & Compliance scanner should verify RLS effectiveness and whether admin-client data flows are truly protected
- Also related to H-15 (layering-leak) — agent tool design compensates for service gaps

---

### ARCHFIT-002: Ledger immutability enforced by convention, not by database trigger

**Severity:** High

**Description:**  
`journal_entries` and `journal_lines` are intended to be append-only per the ledger truth model (INV-LEDGER-001). The Phase 1 design relies on RLS policies (`*_no_update`, `*_no_delete`) which do not apply to `adminClient()` — the Supabase service-role client used by all service functions. The enforcement is purely convention: the codebase has agreed that `journalEntryService.post()` is the only function that writes to these tables, and no other code will attempt UPDATE or DELETE. There is no database trigger to mechanically reject such mutations. Contrast: the `audit_log` table **does** have `CREATE TRIGGER audit_log_no_update ... RAISE EXCEPTION` (20240122000000_audit_log_append_only.sql), proving the trigger pattern is known and applied elsewhere.

A future bug in the service layer (or a route handler that calls `adminClient()` directly without the service abstraction) can silently corrupt posted ledger entries. Phase 1.1 audit flagged this as UF-006 and proposed a ~30-line migration to add the trigger (parallel to audit_log pattern); Phase 1.2 did not implement it.

**Evidence:**
- `supabase/migrations/` — no `journal_entries_no_update` or `journal_entries_no_delete` trigger. Confirmed via grep (zero matches).
- `supabase/migrations/20240122000000_audit_log_append_only.sql` — demonstrates the trigger pattern exists and is used elsewhere.
- `src/services/accounting/journalEntryService.ts:13-14` comment — states "Law 2: All journal entries are created by journalEntryService.post() only" — this is a law in the documentation, not a law in the database.

**Consequence:**  
Ledger corruption via service-layer bug or accidental adminClient bypass. Posted entries can be mutated or deleted without audit trail. The risk is mitigated by code review (Law 2 is well-known), but a mechanical guard is absent. Phase 2 will add more agent tools and more mutation paths, multiplying the risk surface.

**Cross-references:**
- H-05 (hypothesis confirmed)
- Phase 1.1 audit UF-006 (carry-forward item)
- Phase 2 obligations: trigger addition is not explicitly listed but is implicit in the H-05 mitigation path

---

### ARCHFIT-003: Transaction atomicity gap in journal entry post path

**Severity:** High

**Description:**  
`journalEntryService.post()` executes four sequential PostgREST calls inside the function body (INSERT journal_entries, INSERT journal_lines, audit_log write via recordMutation, and ai_actions row in agent paths). Each call auto-commits independently. The deferred balance constraint fires at the journal_lines commit (step 2), but if the audit_log write (step 3) fails after ledger writes succeed, the ledger mutation persists without an audit record. Per INV-AUDIT-001, audit entries are load-bearing for forensics and regulatory compliance. A partial-state window exists where the ledger is mutated but the audit trail is incomplete.

The `recordMutation` JSDoc (line 45-51 of recordMutation.ts) claims "atomicity is guaranteed if the caller uses the same client," but there is no plpgsql RPC that wraps the calls in a single Postgres transaction. The claim is based on convention: both calls use `adminClient()`, so they *appear* to be in the same transaction context, but PostgREST auto-commits each call independently.

This is documented in phase_simplifications.md as "Simplification 1" (synchronous audit log, deferred to Phase 2 correction via pg-boss), but the correction is not implemented. The gap remains load-bearing for Phase 1.2.

**Evidence:**
- `src/services/accounting/journalEntryService.ts:131-228` — sequential PostgREST calls at lines 154 (INSERT entries), 206 (INSERT lines), 220 (recordMutation call). No explicit `BEGIN`/`COMMIT` wrapper.
- `src/services/audit/recordMutation.ts:45-51` — JSDoc claims atomicity; no RPC implementation.
- `docs/03_architecture/phase_simplifications.md:65-127` — documents this as Simplification 1; Phase 2 correction involves pg-boss and event sourcing.

**Consequence:**  
Ledger entries can be posted without audit breadcrumbs if the audit write fails transiently. Regulatory audit trail has a gap. Forensics cannot fully reconstruct the system's history. The risk is lower than H-002 (immutability) because the ledger itself is intact, just the audit log is incomplete.

**Cross-references:**
- H-06 (hypothesis confirmed)
- Phase 1.1 audit UF-001 (carry-forward)
- Phase 1.2 does not address this; deferred to Phase 2 per arch simplifications

---

### ARCHFIT-004: Period lock enforcement incomplete — entry_date not validated against period range

**Severity:** High

**Description:**  
`journalEntryService.post()` validates that the supplied `fiscal_period_id` has `is_locked = false`, but does not validate that the supplied `entry_date` actually falls within the period's `[start_date, end_date]` range. An authorized user can post an entry with `entry_date` inside a closed period while supplying an *open* period's fiscal_period_id, defeating INV-LEDGER-002 (period-lock invariant) in spirit while the lock trigger fires green.

`periodService.isOpen()` exists (lines 52-65) with the correct date-range logic and is even called from the agent's `checkPeriod` tool (orchestrator line 1257-1260). But the manual journal entry route does not call it. The service function is available but not wired into the mandatory path.

**Evidence:**
- `src/services/accounting/journalEntryService.ts:107-119` — checks `period.is_locked` only. Grep for `isOpen` call site: zero matches in journalEntryService.
- `src/services/accounting/periodService.ts:60-65` — `isOpen()` method correctly checks date range via `lte('start_date', entry_date).gte('end_date', entry_date)`.
- `src/agent/orchestrator/index.ts:1255-1260` — agent correctly calls `periodService.isOpen()` for checkPeriod tool; manual entry path does not.
- S23 security review explicitly identified this in pass comments (known-concerns.md §7).

**Consequence:**  
Period-locking enforcement is incomplete. Closing a period is supposed to prevent all entries with dates in that period. A user can work around the lock by posting entries with dates in the closed period but assigning them to an open period, silently violating the fiscal calendar.

**Cross-references:**
- H-09 (hypothesis confirmed)
- S23 security review (known-concerns.md §7)
- Also related to ARCHFIT-001: the agent compensates via the checkPeriod tool, but the manual route has no such guard

---

### ARCHFIT-005: MFA enforcement middleware exists but is not wired to runtime

**Severity:** Medium

**Description:**  
`src/middleware/mfaEnforcement.ts` is a fully implemented 50-line module that exports an `enforceMfa` function. It correctly checks `organizations.mfa_required`, retrieves the user's AAL level from Supabase Auth, and redirects to the MFA enrollment flow if needed. However, the top-level `middleware.ts` (at repo root) performs **only** i18n routing via `next-intl/middleware` and never imports or calls `enforceMfa`. The implementation exists but is architecturally orphaned.

`organizations.mfa_required` is a settable boolean column (Phase 1.5B, production-settable by org owners). Flipping it to true produces no runtime effect because the middleware check never runs.

The integration test (`tests/integration/mfaEnforcementMiddleware.test.ts`) explicitly states in its header that "the actual redirect behavior is verified manually in the browser." The test asserts that the column flips and the function exports; it does not test that middleware.ts invokes the function on org-scoped routes.

**Evidence:**
- `src/middleware/mfaEnforcement.ts` — fully implemented, line 10 exports `enforceMfa`.
- `middleware.ts` (repo root) — lines 1-10, import and export only next-intl middleware. No enforceMfa import.
- Grep for enforceMfa in src/: two results (the export and the test import). Never called at runtime.
- `tests/integration/mfaEnforcementMiddleware.test.ts` header explicitly states manual verification; test does not assert runtime wiring.

**Consequence:**  
MFA policy is not enforced at runtime. An org that requires MFA will not redirect non-MFA users; they can access org-scoped pages without the 2FA ceremony. The feature is documented and scaffolded but not active. Severity is Medium rather than High because the code is complete and would work if wired (low risk of bugs in the unused code), but the intended security control is absent.

**Cross-references:**
- H-11 (hypothesis confirmed)
- Pattern: "code exists, not wired, test scope is limited to verification of code existence rather than runtime behavior"
- Frontend Architecture scanner may have additional findings on test coverage implications

---

### ARCHFIT-006: Service-layer mutation surface lacks CI enforcement; withInvariants wrap is convention-only

**Severity:** Medium

**Description:**  
The `withInvariants()` middleware is the primary enforcement mechanism for the Two Laws (every mutating service call is authorized before execution). The pattern is documented in CLAUDE.md, enforced in code review, and correctly applied at all current call sites (e.g., journalEntryService.post at src/app/api/orgs/[orgId]/journal-entries/route.ts:76-83).

However, there is no ESLint rule to **enforce** this pattern at the linter level. `eslint.config.mjs` contains only TypeScript and Next.js core rules; no `no-restricted-imports` rule exists to reject unwrapped service imports or to require the wrap pattern. Phase 1.1 audit identified the missing `@/db/adminClient` import boundary rule (UF-002); Phase 1.2 did not add it.

A future contributor could accidentally import a mutating service and call it unwrapped, silently bypassing authorization. The pattern is strong (code review catches this today), but mechanical enforcement is absent.

Relatedly, `src/app/api/agent/reject/route.ts` uses the "inline adminClient pattern" (direct db.from() calls) documented as deliberate per sub-brief §4. This is a valid exception, but the codebase has no enforcement rule to prevent similar exceptions in routes that don't warrant them.

**Evidence:**
- `eslint.config.mjs` — lines 13-25, no `no-restricted-imports` rule.
- Phase 1.1 audit identified this gap (UF-002); still absent in Phase 1.2.
- `src/app/api/orgs/[orgId]/journal-entries/route.ts:76-83` — correct wrap pattern; no linter prevents deviations.
- `src/app/api/agent/reject/route.ts` — documented inline adminClient exception; no rule distinguishes it from accidental bypasses.

**Consequence:**  
Pattern is convention-only. A future contributor could accidentally introduce a mutation path that bypasses withInvariants, breaking INV-AUTH-001 (caller authorization). Code review would likely catch this, but mechanical enforcement would be stronger.

**Cross-references:**
- H-12 (hypothesis confirmed)
- Phase 1.1 audit UF-002 (carry-forward)
- Related to ARCHFIT-002 (immutability) — both are convention-enforced rather than mechanically guarded

---

## Category Summary

The Architecture Fit audit reveals **strong foundational layering** (service-layer abstraction, middleware enforcement, context threading) paired with **critical consistency gaps and missing mechanical guards**. The core laws are well-articulated and mostly well-followed, but critical paths rely on convention rather than enforcement: ledger immutability (no triggers), transaction atomicity (no RPC wrapper), and middleware wiring (no linter rules) are all convention-enforced. Read-path authorization is inconsistently applied across similar functions, and period-locking enforcement is incomplete at the service layer (though compensated by the agent). 

The most important finding is that **two critical read-path methods lack org-membership checks**, creating a cross-org data leak path reachable from the agent orchestrator. Combined with the missing ledger-immutability triggers and incomplete period-lock validation, these represent architectural gaps that Phase 2 agent expansion will amplify. The codebase has the *shape* of a correct architecture but lacks *mechanical enforcement* at key boundaries.

**Self-audit bias note:** The same Claude family that helped author Phase 1.2 reviewed this audit. Familiarity with design decisions (especially the "convention-enforced" patterns that are explicitly designed that way) may have softened assessment of these patterns as risks. The gaps identified above are real; the risk severity assigned reflects their actual impact on ledger safety and tenant isolation.

