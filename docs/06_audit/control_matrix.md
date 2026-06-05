# Control Matrix

Audit-side evidence for the 24 invariants.
Maps each INV-ID to its spec definition, its test coverage, and
the specific mechanism by which it is enforced in code.

This file is auditor-facing — it answers "how do I verify that
rule X is actually enforced and tested?" Different audience and
different level of specificity than the contributor-facing
[`invariants.md`](../02_specs/invariants.md):

- `invariants.md` says `file:path` + a one-phrase mechanism
  description. Sufficient for a contributor pivoting from doc to
  code.
- `control_matrix.md` (this file) says the mechanism specifically
  enough that an auditor can reason about whether the
  enforcement is bypassable, what failure mode it catches, and
  whether the test exercises the enforcement directly or
  implicitly.

For the per-invariant rationale, Phase 2 evolution notes, and
interactions with other invariants, see the leaves in
`../02_specs/ledger_truth_model.md`. For the test authoring
patterns, see `../04_engineering/testing_strategy.md`.

## Audit floor — Category A integration tests

The five integration tests below are the **mechanical proof**
that the most load-bearing Phase 1.1 invariants cannot be
bypassed through normal service calls. They are required to
pass on a fresh database reset (the "tests pass on a fresh
clone" discipline established in Phase 1.1 closeout).

| Test file | Invariant under test | Plain-language assertion |
|---|---|---|
| `tests/integration/unbalancedJournalEntry.test.ts` | INV-LEDGER-001 | Posting a journal entry whose debit and credit totals do not match is rolled back at COMMIT with `ServiceError('POST_FAILED')` carrying the `check_violation` code as its cause. No rows are committed to `journal_entries` or `journal_lines`. |
| `tests/integration/lockedPeriodRejection.test.ts` | INV-LEDGER-002 | Posting a journal entry whose `fiscal_period_id` references a locked period is rejected with `ServiceError('PERIOD_LOCKED')` before the database transaction begins. No rows are committed. |
| `tests/integration/crossOrgRlsIsolation.test.ts` | INV-RLS-001 | A user-scoped client authenticated as a member of org A cannot SELECT any row belonging to org B from any tenant-scoped table (`journal_entries`, `journal_lines`, `chart_of_accounts`, `audit_log`, `ai_actions`, etc.) — RLS policies collectively enforce cross-org isolation. The test runs through the user-scoped client (the path RLS protects), not the service-role client. |
| `tests/integration/serviceMiddlewareAuthorization.test.ts` | INV-AUTH-001 | A mutating service function called with a `ServiceContext` whose caller's role does not permit the action throws `InvariantViolationError('PERMISSION_DENIED')` before any DML is issued. No rows are committed and no audit log row is created — the rejection happens at the middleware pre-flight. |
| `tests/integration/reversalMirror.test.ts` | INV-REVERSAL-001 (+ service-layer portion of INV-REVERSAL-002) | Three invalid reversals are rejected with the expected `ServiceError` codes (`REVERSAL_NOT_MIRROR`, `REVERSAL_CROSS_ORG`, `REVERSAL_PARTIAL_NOT_SUPPORTED`) without affecting the original entry. A valid reversal posts and the two entries net to zero in a P&L query. |

## The 25 invariants — audit evidence

Each row below names: the INV-ID, the spec leaf, the test
coverage (Category A floor / unit / implicit / Phase X
scheduled), the specific enforcement mechanism, and the
non-bypassability claim that supports the audit position.

The rows appear in the same order as `invariants.md` and the
leaf's Summary section: Layer 1 first (16 invariants), then
Layer 2 (9 invariants).

### Layer 1a — Physical Truth, commit-time (16 invariants)

Per ADR-0008, Layer 1 is split into 1a (commit-time prevention)
and 1b (scheduled audit detection). All 15 invariants below are
Layer 1a. The control-foundations set has
zero Layer 1b members; Phase 2 stubs are recorded in
`docs/02_specs/ledger_truth_model.md` under "Phase 2 Reserved
Invariants."

#### INV-LEDGER-001 — Debit = credit per journal entry

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-001`](../02_specs/ledger_truth_model.md#inv-ledger-001--debit--credit-per-journal-entry)
- **Test coverage:** Category A floor — `tests/integration/unbalancedJournalEntry.test.ts`
- **Code enforcement:** `CONSTRAINT TRIGGER trg_enforce_journal_entry_balance` declared `DEFERRABLE INITIALLY DEFERRED` on `journal_lines`. The trigger function `enforce_journal_entry_balance()` aggregates `SUM(debit_amount)` and `SUM(credit_amount)` for the parent `journal_entry_id` and raises `check_violation` if they disagree. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** the deferred constraint runs at COMMIT regardless of which client (user-scoped or service-role) issued the INSERT. The service layer's Zod refine is a pre-flight ergonomic check, not authoritative enforcement.

#### INV-LEDGER-002 — Posting to a locked period is rejected

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-002`](../02_specs/ledger_truth_model.md#inv-ledger-002--posting-to-a-locked-period-is-rejected)
- **Test coverage:** Category A floor — `tests/integration/lockedPeriodRejection.test.ts`
- **Code enforcement:** `TRIGGER trg_enforce_period_not_locked` (`BEFORE INSERT OR UPDATE` on `journal_lines`). The trigger function `enforce_period_not_locked()` takes a row-level lock via `SELECT fp.is_locked FROM fiscal_periods fp WHERE ... FOR UPDATE` before reading `is_locked`, then raises `check_violation` if locked. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** the trigger fires on every INSERT regardless of client. The `FOR UPDATE` row lock serializes against concurrent `periodService.lock()` calls, closing the race that READ COMMITTED isolation alone would leave open.

#### INV-LEDGER-003 — The events table is append-only

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-003`](../02_specs/ledger_truth_model.md#inv-ledger-003--the-events-table-is-append-only)
- **Test coverage:** **None in Phase 1.1** — Phase 2 obligation. The `events` table is a reserved seat with no Phase 1.1 writes. The dedicated integration test that attempts every mutation path (`UPDATE`, `DELETE`, `TRUNCATE`) lands in Phase 2 alongside the first service function that writes events. Manual spot-check procedure documented in `docs/04_engineering/conventions.md`.
- **Code enforcement:** Three triggers (`trg_events_no_update`, `trg_events_no_delete`, `trg_events_no_truncate`) all calling `reject_events_mutation()` which raises `feature_not_supported`. Plus three `REVOKE TRUNCATE ON events FROM PUBLIC|authenticated|anon` statements as defense in depth (TRUNCATE bypasses row-level triggers; the statement-level trigger catches it but REVOKE removes the privilege itself from non-privileged roles). Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** the triggers fire on every UPDATE / DELETE / TRUNCATE regardless of client. The Supabase-managed `service_role` retains `TRUNCATE` privilege by platform constraint, but `trg_events_no_truncate` catches it.

#### INV-LEDGER-006 — Journal line amounts are non-negative

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-006`](../02_specs/ledger_truth_model.md#inv-ledger-006--journal-line-amounts-are-non-negative)
- **Test coverage:** **Implicit coverage** via `tests/unit/journalEntrySchema.test.ts` (Zod refine logic) and the construction of every integration test that posts real journal entries (all use non-negative amounts). The CHECK has no dedicated "try to post a negative amount" test because doing so requires bypassing both the Zod schema and the manual entry form; the CHECK is the last line of defense against a path that does not exist in Phase 1.1 code.
- **Code enforcement:** `CONSTRAINT line_amounts_nonneg CHECK (debit_amount >= 0 AND credit_amount >= 0)` on `journal_lines`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint, evaluated on every INSERT and UPDATE regardless of client.

#### INV-LEDGER-004 — A journal line is debit XOR credit

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-004`](../02_specs/ledger_truth_model.md#inv-ledger-004--a-journal-line-is-debit-xor-credit)
- **Test coverage:** **Implicit coverage** via `tests/unit/journalEntrySchema.test.ts` (Zod refine for combined XOR + non-negative + non-zero rule) and the construction of every integration test that posts real journal entries. Same posture as INV-LEDGER-006 — no dedicated "try to post a line with both debit and credit set" test because the form input and the Zod schema both reject before the CHECK can fire.
- **Code enforcement:** `CONSTRAINT line_is_debit_xor_credit CHECK ((debit_amount = 0) OR (credit_amount = 0))` on `journal_lines`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint.

#### INV-LEDGER-005 — A journal line is never all-zero

- **Spec leaf:** [`ledger_truth_model.md#inv-ledger-005`](../02_specs/ledger_truth_model.md#inv-ledger-005--a-journal-line-is-never-all-zero)
- **Test coverage:** **Implicit coverage** via `tests/unit/journalEntrySchema.test.ts` (Zod refine for combined XOR + non-zero check) and integration test construction. Same posture as INV-LEDGER-004 and INV-LEDGER-006.
- **Code enforcement:** `CONSTRAINT line_is_not_all_zero CHECK (debit_amount > 0 OR credit_amount > 0)` on `journal_lines`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint.

#### INV-MONEY-002 — Original amount matches base amount

- **Spec leaf:** [`ledger_truth_model.md#inv-money-002`](../02_specs/ledger_truth_model.md#inv-money-002--original-amount-matches-base-amount)
- **Test coverage:** **Implicit coverage** via `tests/unit/moneySchema.test.ts` (the `addMoney()` helper against known input/output pairs including 4-decimal-place boundary values) and integration tests that post multi-line journal entries. The CHECK has no dedicated "try to post a mismatch" test because the Zod refine prevents the mismatch from leaving the service boundary.
- **Code enforcement:** `CONSTRAINT line_amount_original_matches_base CHECK (amount_original = debit_amount + credit_amount)` on `journal_lines`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint with arithmetic that uses Postgres `numeric(20,4)` semantics. The service-layer Zod refine uses `decimal.js` (via `addMoney()`) which matches Postgres semantics exactly — the two checks agree on every input.

#### INV-MONEY-003 — CAD amount matches FX-converted original

- **Spec leaf:** [`ledger_truth_model.md#inv-money-003`](../02_specs/ledger_truth_model.md#inv-money-003--cad-amount-matches-fx-converted-original)
- **Test coverage:** **Implicit coverage** via `tests/unit/moneySchema.test.ts` (the `multiplyMoneyByRate()` helper against boundary cases at the `numeric(20,4)` precision edge) and integration tests (every Phase 1.1 entry has `fx_rate = 1.0` and the rule trivially holds). Phase 2 multi-currency test lands alongside the first AP Agent multi-currency bill.
- **Code enforcement:** `CONSTRAINT line_amount_cad_matches_fx CHECK (amount_cad = ROUND(amount_original * fx_rate, 4))` on `journal_lines`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`. Postgres `ROUND()` uses HALF_UP rounding, which the service-layer `multiplyMoneyByRate()` matches via `decimal.js` `Decimal.ROUND_HALF_UP`.
- **Non-bypassable from application layer:** Postgres CHECK constraint with rounding semantics that match the service-layer pre-flight.

#### INV-IDEMPOTENCY-001 — Agent-sourced entries require idempotency key

- **Spec leaf:** [`ledger_truth_model.md#inv-idempotency-001`](../02_specs/ledger_truth_model.md#inv-idempotency-001--agent-sourced-entries-require-idempotency-key)
- **Test coverage:** **Phase 1.2 obligation.** Implicit coverage today via every Phase 1.1 integration test (all use `source = 'manual'` and do not trigger the rule) plus `tests/unit/journalEntrySchema.test.ts` (which tests the Zod refine, currently dead code in Phase 1.1 due to the sibling `source !== 'agent'` refine). The first dedicated integration test for the agent path lands in Phase 1.2 alongside the first real agent-posted entry. Phase 1.2 exit criterion #4 ("Idempotency works: submit the same approval twice, the second call returns the existing result") is the mechanical proof.
- **Code enforcement:** `CONSTRAINT idempotency_required_for_agent CHECK (source <> 'agent' OR idempotency_key IS NOT NULL)` on `journal_entries`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`. Service-side pre-flight pairing in `src/shared/schemas/accounting/journalEntry.schema.ts` (`idempotencyRefinement` function — currently dead code, activates Phase 1.2).
- **Non-bypassable from application layer:** Postgres CHECK constraint catches any path that forgets the idempotency key for an agent-sourced row, before any retry scenario can occur.

#### INV-RLS-001 — Cross-org data is never visible outside the org

- **Spec leaf:** [`ledger_truth_model.md#inv-rls-001`](../02_specs/ledger_truth_model.md#inv-rls-001--cross-org-data-is-never-visible-outside-the-org)
- **Test coverage:** Category A floor — `tests/integration/crossOrgRlsIsolation.test.ts`. Test runs through the user-scoped client (the path RLS protects), not the service-role client.
- **Code enforcement:** Collective effect of approximately 20 `CREATE POLICY` statements across every tenant-scoped table, plus two `SECURITY DEFINER` helper functions (`user_has_org_access` and `user_is_controller`) that centralize the membership-check logic. The helpers are `STABLE` (planner can inline and memoize), set `search_path = ''` (defense against malicious shadowing of `public.memberships`), and have `EXECUTE` granted only to `authenticated`. Defined in `supabase/migrations/20240101000000_initial_schema.sql`. Phase 1.1 grew the policy set in `supabase/migrations/20240106000000_add_attachments.sql` (the `journal_entry_attachments` table — annotated as a collective participant, not a separate INV).
- **Non-bypassable from user-scoped clients:** RLS evaluates on every query through `userClient`. The service-role client (`adminClient`) bypasses RLS by design — service-layer authorization (INV-AUTH-001 + INV-SERVICE-002) is the primary enforcement for writes through that path.

#### INV-REVERSAL-002 — Reversal entries require a non-empty reason

- **Spec leaf:** [`ledger_truth_model.md#inv-reversal-002`](../02_specs/ledger_truth_model.md#inv-reversal-002--reversal-entries-require-a-non-empty-reason)
- **Test coverage:** Service-layer portion covered by `tests/integration/reversalMirror.test.ts` (the empty-reason rejection path is step 1 of the `validateReversalMirror` algorithm). A dedicated "try to insert a reversal with empty reversal_reason through direct DML" test is not on the Phase 1.1 floor because it would require bypassing the service layer entirely — Phase 1.1 has no code path that does so. The dedicated DB-CHECK test lands in Phase 1.2 alongside the `reverseJournalEntry` agent tool.
- **Code enforcement:** `CONSTRAINT reversal_reason_required_when_reversing CHECK (reverses_journal_entry_id IS NULL OR (reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0))` on `journal_entries`. The `length(trim(...)) > 0` form rejects whitespace-only values, not just NULL. Defined in `supabase/migrations/20240102000000_add_reversal_reason.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint catches any reversal-insert path that lacks a meaningful reason.

#### INV-AUDIT-002 — The audit_log table is append-only

- **Spec leaf:** [`ledger_truth_model.md#inv-audit-002`](../02_specs/ledger_truth_model.md#inv-audit-002--the-audit_log-table-is-append-only-layer-1a)
- **Test coverage:** **None in Phase 1.1** — Phase 1.2 obligation. The Category A test that attempts every mutation path (`UPDATE`, `DELETE`, `TRUNCATE`) against `audit_log` lands alongside the AI Action Review queue work (Phase 1.2), which depends on `audit_log` integrity for its historical view. Manual spot-check procedure documented in `docs/04_engineering/conventions.md` (forward-facing; written when the Category A test lands).
- **Code enforcement:** Three triggers (`trg_audit_log_no_update`, `trg_audit_log_no_delete`, `trg_audit_log_no_truncate`) all calling `reject_audit_log_mutation()` which raises `feature_not_supported`. Plus two RLS policies (`audit_log_no_update` / `audit_log_no_delete`, both `USING (false)`) surfacing append-only intent at the RLS layer. Plus three `REVOKE TRUNCATE ON audit_log FROM PUBLIC|authenticated|anon` statements as defense in depth (TRUNCATE bypasses row-level triggers; the statement-level trigger catches it but REVOKE removes the privilege itself from non-privileged roles). Defined in `supabase/migrations/20240122000000_audit_log_append_only.sql`.
- **Non-bypassable from application layer:** The triggers fire on every UPDATE / DELETE / TRUNCATE regardless of client. The Supabase-managed `service_role` retains `TRUNCATE` privilege by platform constraint, but `trg_audit_log_no_truncate` catches it. RLS policies provide the second layer for `authenticated`/`anon` paths.
- **Pairing with INV-AUDIT-001:** INV-AUDIT-001 (Layer 2) guarantees every mutation writes an `audit_log` row; INV-AUDIT-002 (Layer 1a) guarantees that row is permanent. Together: every mutation produces a permanent audit record. Registered as a cross-layer pairing in `docs/02_specs/invariants.md`.

#### INV-ADJUSTMENT-001 — Adjusting entries require a non-empty reason

- **Spec leaf:** [`ledger_truth_model.md#inv-adjustment-001`](../02_specs/ledger_truth_model.md#inv-adjustment-001--adjusting-entries-require-a-non-empty-reason-layer-1a)
- **Test coverage:** `tests/integration/adjustmentEntry.test.ts` — test 2 ("Zod rejects empty adjustment_reason via .min(1)") exercises the Layer 2 Zod boundary, and test 3 ("DB CHECK rejects whitespace-only adjustment_reason") exercises the Layer 1a DB CHECK by submitting `'   '` which slips past `.min(1)` (length-only) and is rejected by the CHECK's `length(trim(...)) > 0` form. Test 1 verifies the happy-path adjusting-entry post succeeds with `adjustment_status = 'posted'` via the DB DEFAULT (ADR-0010 Layer 3 pin on the sibling reserved-enum-states affordance).
- **Code enforcement:** `CONSTRAINT adjustment_reason_required_for_adjusting CHECK (entry_type <> 'adjusting' OR (adjustment_reason IS NOT NULL AND length(trim(adjustment_reason)) > 0))` on `journal_entries`. Discriminator-scoped: non-adjusting rows trivially satisfy via the `entry_type <> 'adjusting'` short-circuit. The `length(trim(...)) > 0` form rejects whitespace-only values — stricter than the Zod-boundary `.min(1)` which is length-only. Defined in `supabase/migrations/20240128000000_add_adjustment_reason.sql`.
- **Non-bypassable from application layer:** Postgres CHECK constraint evaluated on every INSERT and UPDATE regardless of client. The service-layer Zod `.min(1)` is a fast ergonomic pre-flight; the DB CHECK is the stricter authoritative guard.

#### INV-RECURRING-001 — Recurring journal templates balance

- **Spec leaf:** [`ledger_truth_model.md#inv-recurring-001`](../02_specs/ledger_truth_model.md#inv-recurring-001--recurring-journal-templates-balance-layer-1a)
- **Test coverage:** `tests/integration/recurringJournal.test.ts` — test 2 ("INV-RECURRING-001 Layer 2: Zod rejects unbalanced template") exercises the Zod boundary by submitting a 100/50 debit/credit split and asserting ZodError; test 3 ("INV-RECURRING-001 Layer 1: deferred CONSTRAINT TRIGGER rejects unbalanced at commit") bypasses Zod via direct `adminClient().from('recurring_journal_template_lines').insert(...)` and asserts the deferred trigger rejects at commit with a message matching `/not balanced|check_violation|enforce_template_balance/i`. The two-layer coverage demonstrates both enforcement points independently.
- **Code enforcement:** `CONSTRAINT TRIGGER trg_enforce_template_balance` declared `DEFERRABLE INITIALLY DEFERRED` on `recurring_journal_template_lines`. The trigger function `enforce_template_balance()` aggregates `SUM(debit_amount)` and `SUM(credit_amount)` for the parent `recurring_template_id` at commit and raises `check_violation` if they disagree. Structural mirror of INV-LEDGER-001's `enforce_journal_entry_balance` at `supabase/migrations/20240101000000_initial_schema.sql:255-283`. Defined in `supabase/migrations/20240131000000_recurring_journal_templates.sql`.
- **Non-bypassable from application layer:** the deferred constraint runs at COMMIT regardless of which client (user-scoped or service-role) issued the INSERT. The service layer's Zod refine is a pre-flight ergonomic check, not authoritative enforcement.
- **Pairing with INV-LEDGER-001:** INV-RECURRING-001 guards the recurring-journal template; INV-LEDGER-001 guards the posted journal entry that results from `approveRun`. Together: a broken template cannot produce unbalanced posted entries because either (a) the template write fails at RECURRING-001's CONSTRAINT TRIGGER, or (b) `approveRun` reads balanced template lines and the resulting `journal_entries` / `journal_lines` INSERT must also balance per LEDGER-001. Registered as a cross-layer pairing in `docs/02_specs/invariants.md`.

#### INV-RULE-001 — rule_evaluation_log is append-only, user-path (Layer 1a)

- **Spec leaf:** [`ledger_truth_model.md#inv-rule-001`](../02_specs/ledger_truth_model.md#inv-rule-001--rule_evaluation_log-is-append-only-user-path-layer-1a)
- **Test coverage:** **None at HEAD** — `rule_evaluation_log` has no consumers yet (the services + evaluator are the Ring 2A-authoring arc). The test-update arc (next after this migration) adds an RLS isolation test (cross-org SELECT denied; user-path UPDATE/DELETE denied; no user-path INSERT) and the `security_invoker` behavior test (a non-controller operator querying `rule_evaluation_30d_view` directly gets RLS-filtered rows, not the owner-bypass leak `document_cards_view` carries). Recorded in `docs/09_briefs/post-mvp/2026-05-26-adr-0024-migration-test-staleness.md`.
- **Code enforcement:** RLS on `rule_evaluation_log` in `supabase/migrations/20240164000000_rule_evaluation_log.sql` — `rule_evaluation_log_no_update` (`FOR UPDATE USING (false)`), `rule_evaluation_log_no_delete` (`FOR DELETE USING (false)`), and no INSERT policy (RLS-enabled default-deny for the user path; `service_role` bypasses). `ruleEvaluationService` (Ring 2A-authoring) is the sole writer and inserts only (ADR-0024 Decision 6).
- **Non-bypassable from application layer — user path only.** RLS blocks the `authenticated` (user-scoped) path absolutely. It does **not** bind `service_role` (which bypasses RLS); ADR-0024 specified RLS-only (no triggers / `REVOKE`s), so service-path append-only is single-writer discipline, not DB enforcement — materially weaker than INV-AUDIT-002's trigger-authoritative all-path append-only. See the INV-RULE-001 leaf "Scope" + "Threat model" subsections. The view inherits this RLS via `security_invoker = true`.

#### INV-RULE-004 — rule_branches / rule_conditions are logic-frozen (Layer 1a)

- **Spec leaf:** [`ledger_truth_model.md#inv-rule-004`](../02_specs/ledger_truth_model.md#inv-rule-004--rule_branches--rule_conditions-are-logic-frozen-layer-1a)
- **Test coverage:** `apps/web/tests/integration/ruleBranchService.integration.test.ts` — the validation-boundary test hand-inserts a branch + malformed `condition_value` and asserts `buildBranchSource` throws `RULE_BRANCH_ASSEMBLY_FAILED`; the end-to-end test's cleanup exercises the DELETE-cascade path (a `rule_registry` delete cascades through `rule_branches`/`rule_conditions` — the UPDATE+TRUNCATE trigger does not block DELETE). The all-path UPDATE block + the eval-subset/non-empty CHECKs + the cascade behavior were verified at migration-apply time (8 in-transaction probes against local PG, `20240169`).
- **Code enforcement:** Column-immutability triggers + RLS + `REVOKE TRUNCATE` on `rule_branches`/`rule_conditions` in `supabase/migrations/20240169000000_ring2b_branch_condition_substrate.sql`: `reject_rule_branches_mutation` / `reject_rule_conditions_mutation` fire `BEFORE UPDATE` (FOR EACH ROW) + `BEFORE TRUNCATE` (FOR EACH STATEMENT) for every role including `service_role`; RLS `USING(false)` on UPDATE/DELETE (user path); `REVOKE TRUNCATE` from PUBLIC/authenticated/anon. There is **no** DELETE trigger (see Non-bypassable). `ruleBranchService` is the single-writer owner (`apps/web/src/services/rules/ruleBranchService.ts`); the physical write is the SECURITY-DEFINER `create_vendor_rule_atomic` RPC.
- **Non-bypassable from application layer — HYBRID.** UPDATE + TRUNCATE are **all-path** (the trigger fires for `service_role` too — stronger than INV-RULE-001; the INV-AUDIT-002 shape). DELETE is **user-path only** (RLS `USING(false)`); a `service_role` direct DELETE is not DB-blocked — deliberately, so the `rule_registry` `ON DELETE CASCADE` cleanup path works (an all-path BEFORE DELETE on a cascade-child of a deletable parent is the CA-65 trap). The residual — a service-path direct single-row branch/condition DELETE on a *live* rule — is covered by the `ruleBranchService` single-writer contract, not the DB (the same discipline-not-DB gap INV-RULE-001 carries on its service path). See the INV-RULE-004 leaf "Scope" + "Residual".

### Layer 2 — Operational Truth (9 invariants)

#### INV-AUTH-001 — Every mutating service call is authorized

- **Spec leaf:** [`ledger_truth_model.md#inv-auth-001`](../02_specs/ledger_truth_model.md#inv-auth-001--every-mutating-service-call-is-authorized)
- **Test coverage:** Category A floor — `tests/integration/serviceMiddlewareAuthorization.test.ts`. Test calls a mutating service function with a `ServiceContext` whose caller's role does not permit the action and asserts `InvariantViolationError('PERMISSION_DENIED')` is thrown before any DML.
- **Code enforcement:** `withInvariants()` higher-order function at `src/services/middleware/withInvariants.ts` runs four pre-flight invariants in order: (1) ServiceContext shape, (2) caller identity verified (not claimed), (3) org-id consistency with caller's memberships, (4) role-based authorization via `canUserPerformAction()`. Each failure throws an `InvariantViolationError` with one of: `MISSING_CONTEXT`, `MISSING_TRACE_ID`, `MISSING_CALLER`, `UNVERIFIED_CALLER`, `ORG_ACCESS_DENIED`, `PERMISSION_DENIED`. The role-action matrix is defined in `src/services/auth/canUserPerformAction.ts` (3 roles × 7 actions, exhaustive).
- **Non-bypassable from application layer:** every mutating service function is invoked through `withInvariants()` per INV-SERVICE-001. The middleware runs before the function body, so authorization failure short-circuits before any database call. RLS provides defense-in-depth for reads through user-scoped clients but does not protect the service-role write path — `withInvariants()` is the only authoritative authorization for service-role writes.

#### INV-SERVICE-001 — Every mutating service function is invoked through `withInvariants`

- **Spec leaf:** [`ledger_truth_model.md#inv-service-001`](../02_specs/ledger_truth_model.md#inv-service-001--every-mutating-service-function-is-invoked-through-withinvariants)
- **Test coverage:** **Implicit coverage** — exercised by every integration test that posts a journal entry (the wrap is at the route handler in `src/app/api/orgs/[orgId]/journal-entries/route.ts`, and integration tests call through the route handler path). The Category A floor `serviceMiddlewareAuthorization.test.ts` proves that the wrap is in place by exercising the pre-flight checks the wrap triggers.
- **Code enforcement:** Structural pattern (not a runtime assertion). Three layered mechanisms: (1) service modules export unwrapped functions by convention (no wrapped export to "accidentally" use); (2) every mutating route handler in `src/app/api/` imports both the service module and `withInvariants` and applies the wrapper inline at the call site; (3) code review rejects bare service calls. Reference implementation: `src/app/api/orgs/[orgId]/journal-entries/route.ts` POST handler.
- **Non-bypassable from application layer:** the rule is code-level discipline, not runtime enforcement. A regression that imported and called a service function without the wrap would compile and run but skip all four INV-AUTH-001 pre-flight checks. Phase 1.2 may add an ESLint restricted-syntax rule to forbid direct calls to `services/**.post` and similar mutating exports — Phase 1.1 relies on code review and the fact that only one developer is writing this code.

#### INV-SERVICE-002 — The service layer uses `adminClient`, never `userClient`

- **Spec leaf:** [`ledger_truth_model.md#inv-service-002`](../02_specs/ledger_truth_model.md#inv-service-002--the-service-layer-uses-adminclient-never-userclient)
- **Test coverage:** **Implicit coverage** — every Phase 1.1 integration test exercises service functions that use `adminClient`; if a service function used `userClient` instead, audit-log writes would fail (no INSERT policy for `audit_log`) and the integration test would surface the failure. The implicit coverage is therefore the audit-log write succeeding in every mutating test.
- **Code enforcement:** Structural pattern (import discipline). Every service file in `src/services/**` imports from `@/db/adminClient`, never from `@/db/userClient`. Reference pattern: `const db = adminClient();` inside service function bodies. Code review rejects `userClient` imports under the `services/` directory.
- **Non-bypassable from application layer:** the rule is code-level discipline. A regression that imported `userClient` into a service file would be caught at runtime when the audit-log write fails (RLS rejection). Phase 1.2 may add a lint rule forbidding `userClient` imports under `src/services/`.

#### INV-MONEY-001 — Money at the service boundary is string-typed, never JavaScript `Number`

- **Spec leaf:** [`ledger_truth_model.md#inv-money-001`](../02_specs/ledger_truth_model.md#inv-money-001--money-at-the-service-boundary-is-string-typed-never-javascript-number)
- **Test coverage:** **Implicit coverage** via `tests/unit/moneySchema.test.ts` (covers `addMoney`, `multiplyMoneyByRate`, `toMoneyAmount`, `toFxRate` against boundary cases at 4-decimal-place precision and 8-decimal-place precision) plus every integration test that posts a journal entry (each implicitly exercises `MoneyAmountSchema` via the Zod boundary parse).
- **Code enforcement:** Collective enforcement by four mechanisms in `src/shared/schemas/accounting/money.schema.ts`: (1) branded TypeScript types `MoneyAmount = string & { __brand: 'MoneyAmount' }` and `FxRate = string & { __brand: 'FxRate' }` prevent accidental Number assignment at compile time; (2) Zod schemas `MoneyAmountSchema` and `FxRateSchema` validate the string shape at runtime boundaries (regex: 1-16 integer digits + optional 1-4 decimals for money; 1-12 + optional 1-8 for FX rate); (3) arithmetic helpers `addMoney`, `multiplyMoneyByRate`, `eqMoney`, `eqRate`, `zeroMoney`, `oneRate` use `decimal.js` exclusively; (4) `decimal.js` is imported only in this one file — no other file imports it, confining IEEE 754 precision loss risk to this boundary.
- **Non-bypassable from application layer:** branded types catch drift at compile time. A new service function that accidentally typed a parameter as `string` instead of `MoneyAmount` would still accept actual `MoneyAmount` values (because `MoneyAmount extends string`), but a call site passing a `number` would fail at type-check. The Zod boundary parse catches any runtime drift that compile-time checks miss.

#### INV-REVERSAL-001 — Reversal lines must mirror the original

- **Spec leaf:** [`ledger_truth_model.md#inv-reversal-001`](../02_specs/ledger_truth_model.md#inv-reversal-001--reversal-lines-must-mirror-the-original)
- **Test coverage:** Category A floor — `tests/integration/reversalMirror.test.ts`. Exercises three invalid reversal cases (missing line, mismatched amounts, debit/credit not swapped) plus a valid reversal that nets to zero in P&L. Plus unit coverage in `tests/unit/mirrorLines.test.ts` for the `mirrorLines` pure helper used by the UI to construct mirror inputs.
- **Code enforcement:** `validateReversalMirror()` in `src/services/accounting/journalEntryService.ts`, called from `journalEntryService.post()` before the database transaction begins. Five-step algorithm: (1) reversal_reason non-empty (also INV-REVERSAL-002's service-layer pre-flight); (2) load referenced entry; (3) same-org check; (4) line count match (no partial reversals in Phase 1.1); (5) per-line mirror match with debit/credit swap. Throws `REVERSAL_NOT_MIRROR` / `REVERSAL_CROSS_ORG` / `REVERSAL_PARTIAL_NOT_SUPPORTED` before any DML.
- **Non-bypassable from application layer:** the check runs inside `journalEntryService.post()`, which is the only legal way to create a journal entry per Law 2 of the Two Laws of Service Architecture. A bypass would require constructing a journal entry through direct DML — which requires the service-role client and would also bypass `withInvariants()` (INV-SERVICE-001 violation).

#### INV-AUDIT-001 — Every mutating service call writes an `audit_log` row in the same transaction

- **Spec leaf:** [`ledger_truth_model.md#inv-audit-001`](../02_specs/ledger_truth_model.md#inv-audit-001--every-mutating-service-call-writes-an-audit_log-row-in-the-same-transaction)
- **Test coverage:** **Implicit coverage** — every integration test that posts a journal entry implicitly exercises the audit write (if it failed, the entire transaction would roll back via `AUDIT_WRITE_FAILED`, and the integration test's "entry was posted" assertion would fail). Audit-log content assertions are not currently in the integration tests; the obligation to add them is documented in `docs/09_briefs/phase-1.2/obligations.md`.
- **Code enforcement:** `recordMutation()` in `src/services/audit/recordMutation.ts` is called inside the same database transaction as the mutation it records (Phase 1.1 Simplification 1). Accepts a `SupabaseClient` parameter so the caller passes the same client (and therefore the same transaction) that performed the mutation — guarantees atomic commit. On INSERT failure, throws `Error('[AUDIT_WRITE_FAILED] ...')` which propagates and rolls back the entire transaction. Call site in `journalEntryService.post()` runs after the journal_entries and journal_lines INSERTs but before the function returns — same transaction window.
- **Non-bypassable from application layer:** the synchronous same-transaction write is the enforcement. If the audit write fails, the data writes also disappear — there is no "data committed but audit missing" failure mode in Phase 1.1. Phase 2 evolution: `recordMutation()` is replaced by an event emission to the `events` table; the `audit_log` becomes a projection updated post-commit by pg-boss. The same-transaction guarantee transfers to the event-write step in Phase 2.

#### INV-DOC-001 — Evidence completeness for committed bills (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-doc-001`](../02_specs/ledger_truth_model.md#inv-doc-001--evidence-completeness-for-committed-bills-layer-2)
- **Test coverage:** `apps/web/tests/integration/billEvidenceCompleteness.test.ts` (Phase 5.1 chunk 5.1a; 3 fixtures: positive path with `primary_document_id` succeeds + creates `source_document_links` row with `link_role='primary_invoice'`; override path with `override_evidence_completeness=true` succeeds without link row; failure path throws `ServiceError('EVIDENCE_INCOMPLETE', ...)`).
- **Code enforcement:** TypeScript service function check in `billService.post()` at `src/services/spend/billService.ts`. The check fires AFTER Zod input validation (`PostBillInputSchema.parse()`) and BEFORE the entity preload block. If `override_evidence_completeness=false` AND `primary_document_id` is absent, the function throws `ServiceError('EVIDENCE_INCOMPLETE', ...)` before any database mutation. If `primary_document_id` is provided, the function inserts the bill row + bill_lines + JE via `journalEntryService.post()`, then calls `documentLinkService.create()` to insert the `source_document_links` row with `link_role='primary_invoice'` in the same transaction window (atomic; either both commit or neither).
- **Non-bypassable from application layer:** No code path other than `billService.post()` creates a bills row — all consumers flow through this service per INV-SERVICE-001 + INV-SERVICE-002. The override flag is the only bypass mechanism; the flag is itself a controller-grade audit event per ADR-0015 §10 (override use cases: controller backfill for pre-Phase-5.1 bills via Sub-Q4-d 4-d.γ migration backfill, audit-trail exception for emergency posting without document). Sub-Q4-b lock admits both `link_role='primary_invoice'` AND `link_role='receipt'` for primary attachment (born-paid Scenario C per ADR-0015 §7).

#### INV-RULE-002 — the pure-core rule evaluator is deterministic (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-rule-002`](../02_specs/ledger_truth_model.md#inv-rule-002--the-pure-core-rule-evaluator-is-deterministic-layer-2)
- **Test coverage:** `apps/web/tests/unit/ruleEvaluator.test.ts` "determinism" block — `evaluate()` twice on identical inputs yields a byte-identical `MatchResult` (`JSON.stringify` equality), plus reorder-invariance (candidate input order does not change output, via the total 4a–4d conflict-resolution ordering). The verification site (Ring 2A-core authoring Commit 1).
- **Code enforcement:** Test-verified pure-function property — the **first test-verified INV** in the registry. `evaluate(rules, context)` at `apps/web/src/core/rules/evaluator.ts` is pure (no I/O, no clock, no RNG; total ordering with a UUID tiebreak); there is no runtime sentinel because determinism is a property across invocations, not a single-run rule violation. `agent-first-import-boundaries` (`'error'`) structurally removes the DB/services/agent import vectors in `core/`, but the clock/RNG globals are not import-gated — the determinism test is the load-bearing check.
- **Non-bypassable from application layer:** N/A — pure function, no service or DB path. Verification is the unit test, not a runtime or DB guard; a future edit introducing non-determinism (e.g., `Math.random()` in a predicate) compiles cleanly through the import boundary and is caught by the determinism test, not by a guard at any call site.

#### INV-RULE-003 — rule_evaluation_log has a single writer (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-rule-003`](../02_specs/ledger_truth_model.md#inv-rule-003--rule_evaluation_log-has-a-single-writer-layer-2)
- **Test coverage:** No test asserts the sole-writer property itself (runtime/structural sub-type — see Code enforcement). What the tests cover is the append *shape* `recordEvaluation` produces: `apps/web/tests/integration/ruleEvaluationServiceRecordEvaluation.integration.test.ts` (row-per-candidate expansion; winner-attribute columns null on non-winners; zero-candidate → no row) + `ruleEvaluateAndDispatch.integration.test.ts` (the orchestrator reaches the log only through `recordEvaluation`, and only after the gate). These verify the writer behaves correctly, not that it is the only writer.
- **Code enforcement:** Runtime/structural — `ruleEvaluationService.recordEvaluation` (`apps/web/src/services/rules/ruleEvaluationService.ts`) is the sole `rule_evaluation_log` insert site. The **control is the service pattern (one function owns the write) + code-review discipline**, not a test name and not a DB constraint. `agent-first-import-boundaries` (`'error'`) structurally bars the agent layer from writing `db/` directly; the ADR-0025 §6 (OQ-3c) two-method split keeps the append in `recordEvaluation`. This is the **runtime/structural Layer-2 sub-type**, distinct from INV-RULE-002's test-verified sub-type (the registry's two Layer-2 sub-types; see the leaf "Scope").
- **Non-bypassable from application layer:** Partial — the same shape as INV-RULE-001's service path. INV-RULE-001's RLS makes the log append-only against the *user* path, but `service_role` bypasses RLS, so a second service *could* insert; single-writer is discipline + review, not a DB guard. A future edit adding a second writer compiles cleanly and is caught by code review at the service boundary, not by a runtime or DB sentinel.

#### INV-WORKFLOW-002 — terminal-disposition completeness / no silent drops (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-workflow-002`](../02_specs/ledger_truth_model.md#inv-workflow-002--terminal-disposition-completeness--no-silent-drops-layer-2)
- **Test coverage:** `apps/web/tests/integration/advanceCaseAutomation.integration.test.ts` (9 tests — the automation chain-advance with per-hop audit rows; persisted `extracting`; idempotent at/past-target re-runs; the matched→needs_review hand-off as a plain state-transition row; the single-ownership refusal of `classified→*`; system-actor attribution `=== SYSTEM_ACTOR_USER_ID`; the human-boundary regression) + the D2.1 T4 end-to-end routing suite (matched case ends at `needs_review` with the hand-off audit chain; unmatched case ends at `needs_review` with an `unmatched_router_candidate` exception row) + `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` (12 tests — the D2.3 backstop: eligibility/staleness filtering, bucketing order, B1 hand-off with system-actor attribution, B2 re-resolve branches (a)/(b) with real decision artifacts, EXCEPTION_ALREADY_OPEN recovered/anomaly split + loop-safety, B3/B4 DI-seam dispatch + re-eligibility, B3-D dedup carve-out with runner-never-invoked, dry-run zero-writes). The prospective process guarantee itself is runtime/structural (see Code enforcement); the tests verify the routing behaves correctly on each branch, not that no orphan can ever exist (the leaf's named residuals are the explicit non-coverage).
- **Code enforcement:** Runtime/structural — the orchestrator's Stage-6.5 routing block + park-exit hand-offs (`apps/web/src/agent/orchestrator/extraction/ingestDocument.ts`, annotated `INV-WORKFLOW-002`) route every pipeline decision to a terminal disposition: `advanceCaseAutomation` (`documentCaseService.ts`) owns `received→extracting→classified` + `matched→needs_review` and REFUSES `classified→*` (single ownership); Subsystem 2 (`resolveCandidates`) owns `classified→{matched, needs_review}` with the rich decision-record audit; the `enqueue_exception_with_audit` RPC guard (`state IN ('classified','matched')`) is the substrate-layer enforcer for the `needs_review` entry. The **control is the routing code path (every decision exit routes) + review discipline**, the INV-RULE-003 runtime/structural sub-type.
- **Non-bypassable from application layer:** Partial — a prospective process guarantee, not a DB sentinel. The DB enforces transition legality (the chunk_8 state CHECK + the enqueue RPC's source-state guard + the head-pointer RPC's `WHERE state='classified'`) but nothing at the DB layer forces a decided case to *be* routed — a future edit that parks without routing compiles cleanly and is caught by review + the D2.3 sweep (`sweepStrandedCases`, `apps/web/src/agent/orchestrator/maintenance/sweepStrandedCases.ts` — SHIPPED at Wave 6 D2.3, operator-run, dry-run default; the eventual-consistency backstop), not by a runtime sentinel. The leaf names two residual classes (pre-enforcement backlog, transitional — RETIRED 2026-06-04 via the backlog-clearing run, run_trace_id `2855c8e3-…`; strandings, sweep-recoverable) plus the Stage-0 dedup carve-out — none silent. (The attachment-card class was eliminated at D2.1 T4: the attachment and unknown exits route like every other decision outcome.)

#### INV-EVIDENCE-001 — canonical evidence object required at commit (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-evidence-001`](../02_specs/ledger_truth_model.md#inv-evidence-001--canonical-evidence-object-required-at-commit-layer-2)
- **Test coverage:** `apps/web/tests/integration/evidenceObjectPersistence.integration.test.ts` (8 tests — producer happy path: one row, subject/org/trace/status asserted, case committed; **the teeth test**: injected persist failure → 500-class, case HOLDS at `approved`, zero evidence rows, then resume → dup-catch JE recovery + idempotent upsert → one row + committed + one JE total; **crash-class-X**: JE-only recovery → 409 `POSTING_RECOVERY_UNREPAIRABLE`, approved-hold, org-wide evidence-count unchanged, the seeded JE survives by direct read, identical refusal on re-approve; persist-grain cross-org + foreign≡missing negatives → `LINKED_ENTITY_NOT_FOUND` + zero rows; two-user idempotence → one row, trace refreshed, `created_by` INSERT-only) + `apps/web/tests/integration/evidenceObjectsConstraints.integration.test.ts` (5 tests — the Layer-1 half: duplicate triple → 23505 naming `evidence_objects_subject_unique`; status CHECK admits `reserved`/`partial`/`complete`). The sequencing guarantee itself is runtime/structural (see Code enforcement); the tests verify the seam behaves correctly on each branch, not that no future edit can mark `committed` without persisting (the leaf's named residual is the explicit non-coverage).
- **Code enforcement:** Layer-1 + runtime/structural split. **Layer 1:** `evidence_objects_subject_unique` UNIQUE `(org_id, subject_type, subject_id)` (migration `20240177`) — at most one canonical object per subject, DB-enforced. **Layer 2 (runtime/structural):** the persist-before-marking seam in `apps/web/src/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts` (annotated `INV-EVIDENCE-001`) — `evidenceObjectService.persist` (org-scoped subject-ownership guard via `LINKED_ENTITY_TABLE_MAP` + `.eq('org_id', …)`, foreign ≡ missing; then assemble; then idempotent upsert refreshing status + trace only) runs after the ledger write and before `advanceCaseAutomation('committed')`. The sole-commit-path enumeration at registration HEAD: `transition()` schema-barred from `committed`; nine `advanceCaseAutomation` call sites of which only the approve→post route targets `'committed'`, downstream of the seam; the state RPC has no callers outside `documentCaseService`; the preserved auto-commit composite is unreferenced. The **control is the seam (the one committed-marking path persists first) + review discipline**, the INV-RULE-003/INV-WORKFLOW-002 runtime/structural sub-type.
- **Non-bypassable from application layer:** Partial — only the uniqueness half has DB teeth. Nothing at the DB forces persist-before-marking: a future edit that marks `committed` without persisting compiles cleanly and is caught by review + the crash-resume test, not by a DB sentinel. The user path is RLS-denied (no write policy on `evidence_objects`); `service_role` writes outside the service path are not barred (the standard partial). The leaf names the residuals explicitly, including crash-class-X (a recovered JE whose posting entity never landed) as a typed, non-retryable, operator-visible HOLD at `approved` — never a committed state — closing the JE/subledger gap D3's 23505-recovery ratification silently admitted.

#### INV-WORKFLOW-001 — no AI-only paths / producer coverage (Layer 2)

- **Spec leaf:** [`ledger_truth_model.md#inv-workflow-001`](../02_specs/ledger_truth_model.md#inv-workflow-001--no-ai-only-paths--producer-coverage-layer-2)
- **Test coverage:** `apps/web/tests/unit/intentProducers.test.ts` — the Wave-4 registry-shape suite (6 tests: all three intent types present; every producer valid-kinded with provenance; every ledger Mutation non-AI-covered; Navigation non-AI-covered; the gap-finder over a synthetic registry) + the Wave-6 D6 teeth suite (4 tests: **the executable flip-safety proof** — live gap set exactly `['query']`, `V1_TEETH_SCOPE_OUT` covers it, effective gaps empty, exit 0; **the teeth bite** — a synthetic unscoped gap exits 1, the same gap scoped out exits 0 with the carve-out visible at the data grain; the intersection-only `scopedOut` (an inert carve-out claims nothing); carve-out integrity — `query` keeps its AI producer recorded, still no non-AI). The declared-registry honesty itself is review-guarded, not test-verified (see Non-bypassable).
- **Code enforcement:** **Build-time structural** (a new Layer-2 sub-type: neither runtime nor DB) — `runCheck` (`apps/web/src/core/intent/producers.ts`, pure: gaps / intersection-only scopedOut / effectiveGaps / exitCode) consumed by `scripts/check-intent-producers.ts` (thin print-and-exit wrapper; scoped-out keys print visibly with the Q2 re-include trigger; unscoped gaps print ERROR), wired as the blocking `intent-producers` job in `.github/workflows/ci.yml` (adr-check-isomorphic; zero `github.event.*` context) and into the root `agent:validate` harness (Variant A — the live enforcement under the wave's no-push posture). The **control is the check + its two gate wirings + review discipline**; `producers.ts` is the grep-visible annotation anchor (the mechanism is grep-invisible by location, cited from the anchor).
- **Non-bypassable from application layer:** Partial — three named hedges, headline-grade in the leaf. (1) The registry is **self-declared**: the check proves declared coverage, not declaration truth — a stale/wrong producer entry compiles and passes; review-guarded. (2) A red CI run fails the workflow but **blocks merge only where branch protection requires the check** — operator-grain repo settings, not verifiable from the tree; direct pushes run CI without being blocked by it. (3) The ci.yml job's **first dynamic execution is the wave-close terminal push** (the no-push invariant); the harness wiring bites in the interim; the wave-close checklist carries the post-push confirmation. Plus the **Q2 `query` carve-out** (visible, re-include trigger binding) as part of the honest statement.

## Implicit coverage rationale

Several invariants (INV-LEDGER-004, INV-LEDGER-005, INV-LEDGER-006,
INV-MONEY-002, INV-MONEY-003, INV-MONEY-001, INV-SERVICE-001,
INV-SERVICE-002, INV-AUDIT-001) are listed above with **implicit
coverage** rather than dedicated integration tests. This is not
"no test" — it is "the rule is exercised by every integration
test that posts a real journal entry, plus dedicated unit tests
for the helper code that would have to fail for the rule to
fail."

The audit position: a regression that violated any of these
rules would surface in the existing integration tests because
the existing tests construct realistic inputs that exercise the
rule on every run. A negative-amount regression (INV-LEDGER-006)
would surface as a Zod parse failure in every integration test
that uses `MoneyAmountSchema`. A `Number`-instead-of-string
regression (INV-MONEY-001) would fail at TypeScript compile time
before any test ran. The integration tests do not need to assert
"and we did NOT post a negative amount" because the construction
of every test implicitly assumes positive amounts.

The Phase 1.2 brief obligation (`obligations.md` recurring
pattern #1, "Typecheck passes, runtime shape doesn't match") is
to add explicit runtime-coercion tests at every external-system
boundary as a defense-in-depth measure. That work expands the
"implicit coverage" set into "implicit + explicit coverage" but
does not change the audit position for Phase 1.1.

## Phase X coverage scheduled

Two invariants have no current dedicated test because the code
path that would exercise them does not exist in Phase 1.1:

- **INV-LEDGER-003** — Phase 2 obligation. The `events` table is
  a reserved seat (no Phase 1.1 writes), so the dedicated
  integration test that attempts every mutation path
  (`UPDATE`, `DELETE`, `TRUNCATE`) lands in Phase 2 alongside the
  first service function that writes events. Manual spot-check
  procedure in `docs/04_engineering/conventions.md` covers Phase
  1.1.
- **INV-IDEMPOTENCY-001** — Phase 1.2 obligation. The agent path
  doesn't exist in Phase 1.1, and the Zod refine that pre-flights
  the rule is currently dead code (sibling refine rejects
  `source = 'agent'` outright). The first dedicated integration
  test lands in Phase 1.2 alongside the first real
  agent-posted entry. Phase 1.2 exit criterion #4
  ("Idempotency works: submit the same approval twice, the
  second call returns the existing result") is the mechanical
  proof.

Both invariants are currently enforced (the database CHECK and
trigger mechanisms exist and would fire on any attempted
violation) but are not exercised by an automated test until the
relevant code path lands.

## Discipline backstops (not on the audit floor)

Two database-level enforcement sites participate in documented
disciplines without warranting their own INV-IDs. They are
annotated in their migrations with discoverability comments
(Waypoint E.3) but are not on the audit floor — they are
defenses for failure modes that the Phase 1.1 architecture
deliberately accepts as backstops, not foundational rules.

| Site | Discipline | Audit position |
|---|---|---|
| `unique_entry_number_per_org_period` UNIQUE constraint in `supabase/migrations/20240104000000_add_entry_number.sql` | "Retroactive collision detector" for the no-FOR-UPDATE entry-number allocation pattern | Not on the audit floor. Phase 1.1 deliberately accepts gaps in entry numbering under failure conditions; the rule the codebase actually cares about is sequentiality, not uniqueness, and UNIQUE cannot enforce sequentiality. See the Transaction Isolation section of `ledger_truth_model.md` for the discipline-vs-invariant distinction. |
| `je_attachments_select` RLS policy in `supabase/migrations/20240106000000_add_attachments.sql` | Collective participant in INV-RLS-001 ("the set of policies that enforce it grows") | Audit coverage is provided by INV-RLS-001's Category A floor test (`crossOrgRlsIsolation.test.ts`), which exercises the collective enforcement. The attachments-table policy is not separately audited because it follows the same `user_has_org_access(org_id)` pattern as every other tenant-scoped table. |
| `reportService.trialBalance()` footer check in `src/services/reporting/reportService.ts` | Trial balance debits equal credits (theorem of INV-LEDGER-001 (Layer 1a)) | Not on the audit floor. The rule is INV-LEDGER-001 (Layer 1a), covered by the `unbalancedJournalEntry.test.ts` Category A floor test. The service-layer throw is a boundary defense for non-UI consumers (agents, exports, reconciliation integrations, tests), not a separate audit artifact. The equivalent UI check in `BasicTrialBalanceView.tsx` covers the render path. |

See [`invariants.md`](../02_specs/invariants.md) "Discipline
backstops (not invariants)" section for the full non-promotion
rationale.

## Reproducible bidirectional reachability check

The audit position rests on the bidirectional reachability check
verified during Waypoint F (commit `65bcfe0`):

```bash
# Forward: every documented INV-ID has at least one annotation site in code
grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u

# Reverse: every annotated INV-ID in code has a corresponding leaf
grep -rho 'INV-[A-Z]\+-[0-9]\+' apps/web/src/ supabase/migrations/ | sort -u

# Symmetric difference (must be empty)
diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) \
     <(grep -rho 'INV-[A-Z]\+-[0-9]\+' apps/web/src/ supabase/migrations/ | sort -u)
```

Expected: 24 distinct INV-IDs in both directions, empty symmetric
diff. This is the single command an auditor can run at any future
point to confirm the doc-to-code reachability has not drifted.
