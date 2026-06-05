# Wave 6 D4 — Task Decomposition

**Status:** DRAFT — surfaced for advisor read-back. Implementation
starts task-by-task after green, each task getting a per-task code
read-back (code + runs surfaced together).
**Anchors:** the LOCKED brief
(`2026-06-05-wave-6-d4-default-account-consumption-brief.md`, committed
`c7e5c2db`) — design decisions D-1…D-6 are settled there and are NOT
relitigated here; this document orders the work and pins each task's
files, tests, and impl-onset verify items. Advisor read-back carry-ins
encoded: (i) resolution-path tests seed rules **with**
`default_account_id` set; (ii) the cross-org-account IDOR-negative is
explicit in the fallback matrix.
**Grounding HEAD:** `c7e5c2db` (36 banked-local).

Dependency spine: T1 → T2. Tasks commit individually under the lock
(`COORD_SESSION='wave-6-ap-review'`); TDD within each task; no push.

**Shape refinement vs the brief's §6 sketch:** the brief estimated
"~3 tasks (helper+wiring / tests / close)". TDD-within-each-task makes
a separate tests task incoherent (tests are written first, inside the
implementing task — the D3 per-task pattern). Refined to two tasks:
T1 implementation+tests, T2 close.

---

## T1 — `resolveRuleDefaultAccount` helper + `buildPostBillInput` wiring + integration suite

**Files:**
- Modify `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts`
  — new module-local helper, sibling to `lookupBillCommitDefaults`
  (`:1106`); consumption at `buildPostBillInput` (line account `:910`).
- Create `apps/web/tests/integration/reviewApprovePostDefaultAccount.integration.test.ts`
  — **new file**, not an extension of `reviewApprovePost.integration.test.ts`,
  so the brief's additive proof ("D3 suite green **byte-unchanged**")
  stays byte-clean.

**Scope:**
1. **Helper** `resolveRuleDefaultAccount(org_id, vendor_id, trace_id):
   Promise<string | null>`:
   - Org-scoped `vendor_rules` read on `(org_id, vendor_id)` — the
     `vendorRuleService` read pattern, NOT the shadow's rule_id-only
     shape (brief §1.4).
   - Filter to `rule_registry.lifecycle_state='active'` — two-step
     read mirroring `ruleEvaluationService.ts:127` if the composite-FK
     embed fights Supabase JS (impl-onset verify #3).
   - Keep rows with non-null `default_account_id`; tiebreak by
     `bundle_type` enum order (`born_paid_bill` →
     `final_invoice_with_applied_deposit` →
     `vendor_credit_applied_to_bill`, the types.ts:4310 array order,
     pinned as a code-comment constant) then `rule_id`; log the
     ambiguity when >1 (brief D-2).
   - Validate the account via org-scoped `chart_of_accounts` read:
     in-org + `account_type='expense'` + `is_active=true` (brief D-3).
   - `log.info` inside the helper (threads the `trace_id` param):
     resolved `{rule_id, account_id}` or the named fallback reason
     (brief D-5). Null on every fallback; **never throws** past a read
     error that the caller's existing null-contract doesn't already
     absorb — error shape pinned at impl-onset verify #6.
2. **Wiring:** in `buildPostBillInput`, after the existing
   `lookupBillCommitDefaults` call (`:888`):
   `account_id: ruleAccount ?? lookups.default_expense_account_id` at
   the bill line (`:910`). No other builder line changes; the
   null-return conditions stay identical (brief D-4 additive floor).
   `buildPostBillInputFromChildMutation` byte-unchanged (brief D-2).

**Impl-onset verifies (brief §4 + read-back additions):**
1. Read the `:729`/`:802` commit-composite call blocks — confirm
   cited-inert status (blast-radius accuracy; additive either way).
2. Read `reviewPreview.ts` postable-summary shape — confirm the §1.6
   no-account-display grep-negative at block grain.
3. Composite-FK join shape: attempt the `vendor_rules` →
   `rule_registry` embed; fall back to two-step on friction.
4. `chart_of_accounts` column names at HEAD against types.ts
   (`account_type`, `is_active`, org column).
5. Seeding path: ground the rule-creation + approval-ceremony fixture
   shape from `vendorRuleServiceApprove.integration.test.ts` /
   `approveVendorRuleAtomicRpc.integration.test.ts` and reuse it —
   rules seeded **with `default_account_id` set** via
   `createVendorRule` (the API-reachable path, brief §1.5).
6. `types.ts:3395-3402` non-composite FK re-verify (advisor verifies
   in parallel at the task read-back).

**Tests (TDD — written first, red, then the helper/wiring):**
- **Happy path:** seeded vendor + approved/active rule with in-org
  active expense `default_account_id` → full approve→post through the
  route → posted bill line `account_id` = the rule's account (assert
  at JE/bill-line read grain, the D3 T6 assertion pattern).
- **Fallback matrix** (each → first-expense-account default, post
  succeeds, fallback reason logged):
  1. no rule for the vendor;
  2. rule `proposed` (ceremony not run);
  3. rule active + `default_account_id` null;
  4. **cross-org account (the load-bearing IDOR-negative):** rule's
     `default_account_id` points at another org's account → D-3
     validation fails → fallback; **assert the posted line's
     `account_id` is the in-org default AND the foreign account id
     appears nowhere in the posted entry** — proves D-3 is real, not
     declared;
  5. account `account_type` ≠ expense;
  6. account `is_active=false`.
- **Determinism:** two active rules for the vendor (distinct
  `bundle_type`, distinct accounts, both valid) → the enum-order
  winner posts; ambiguity logged.
- **Additive proof:** `reviewApprovePost.integration.test.ts` run
  green, file byte-unchanged (surfaced in the run evidence).

**Commit:** `feat(document-platform): Wave 6 D4 T1 — matched-rule default_account_id consumption at buildPostBillInput (org-validated, fallback-additive)`

## T2 — Close: gates + brief reconciliation

**Files:**
- Create `docs/09_briefs/v1/plans/<date>-wave-6-d4-close-report.md`.

**Scope:**
1. Gates: `pnpm agent:validate` (root) + `pnpm typecheck` (apps/web) +
   the T1 suite + the D3 approve→post suite. Lint claim SCOPED per
   `conventions/lint-and-validation.md`: `ingestDocument.ts` sits in
   `src/agent/**` where `no-restricted-imports` is `'off'` (Q33) —
   expected zero new errors; any that appear get named by class, never
   absorbed.
2. Scope-fence check (the D3 T8 pattern): diff over `c7e5c2db..HEAD`
   restricted to `docs/02_specs` + `docs/07_governance` +
   `docs/06_audit` is empty. Registers/amends: nothing.
3. Close report: brief-vs-shipped reconciliation (D-1…D-6 row by
   row), deviations named, carry-forward docket — at minimum the D-1
   **divergence-watch marker** (when non-vendor conditions or
   per-type branches exist post-V1, consumption must migrate from
   direct lookup to the evaluation result) and the deferred
   preview/case-detail account display (joins close-report
   carry-forward #5's directive deferral).
4. Memory/CURRENT_STATE untouched (wave-close artifacts, not
   per-deliverable — the D3 precedent).

**Commit:** `docs(v1): Wave 6 D4 T2 CLOSE — gates green, brief-vs-shipped reconciled`

---

## Read-back asks (decomposition-level decisions)

- **(a) Two-task shape** — the brief's "~3 tasks" sketch refined:
  tests fold into T1 per TDD-within-each-task (the D3 per-task
  pattern). Flagged because it diverges from the LOCKED brief's §6
  estimate (estimate, not position — D-1…D-6 untouched).
- **(b) New test file** rather than extending the D3 suite — keeps
  the additive proof byte-clean. Costs one more file in the
  integration dir; the D3 suite is named in T1's run evidence either
  way.
- **(c) Helper signature carries `trace_id`** (third param) so D-5's
  log lives inside the helper — the builders' `input.trace_id` is in
  scope at the call site; no `ServiceContext` introduced (brief D-6).
- **(d) Determinism test seeds two rules across `bundle_type`** — the
  only multi-rule shape the §1.3 uniqueness key admits for one vendor
  + one legal-entity fold. If the advisor reads the dedup key
  differently, the test reshapes to match.
- **(e) Per-task gate posture mirrors D3:** targeted suites at T1;
  full `agent:validate` + `typecheck` at T2 close. Full
  `pnpm test:full` remains a wave-close (push-gate) artifact, not
  per-deliverable.
