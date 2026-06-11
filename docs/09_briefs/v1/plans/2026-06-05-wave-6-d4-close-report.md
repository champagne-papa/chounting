# Wave 6 D4 — Close Report

**Status:** DRAFT — surfaced for advisor read-back (T2).
**Refs:** brief `c7e5c2db` (LOCKED), decomposition `f32feed1` (LOCKED),
T1 `4522c6ea`. Grounding HEAD: `4522c6ea` (38 banked-local; origin
`e571ceb5` untouched).
**Charter discharged:** "Real coding — consume matched rule's
`default_account_id` in the posting path." Registers/amends: nothing
(verified, §6).

---

## 1. What shipped

One implementation commit (T1, `4522c6ea`; read-back cleared
line-by-line): `resolveRuleDefaultAccount` (module-local helper in
`ingestDocument.ts`, sibling to `lookupBillCommitDefaults`) + the
single wiring line in `buildPostBillInput`
(`account_id: ruleAccountId ?? lookups.default_expense_account_id`) +
`reviewApprovePostDefaultAccount.integration.test.ts` (8 tests,
TDD red→green). 652 insertions, 1 deletion, 2 files.

## 2. Gates

- `pnpm agent:validate` (root): 26/26 green.
- `pnpm typecheck` (apps/web): clean.
- Targeted suites: D4 suite 8/8; D3 `reviewApprovePost` 10/10 with
  the file **byte-unchanged** (the D-4 additive proof);
  `agentOrchestratorIngestDocument` (edited module's suite) 9/9.
- **Lint — scoped claim (per `conventions/lint-and-validation.md`):**
  zero new errors and zero new warnings in D4-touched files. The one
  finding inside `ingestDocument.ts`
  (`:63 architecture/agent-first-import-boundaries`, the `adminClient`
  import) **predates D4**: it is a member of the Q33
  orchestrator/extraction agent-adminClient sibling class (D3 close
  report §2 Class B; the build plan §3 carries it as the named
  separate/unscheduled lint ticket). D4 added no `adminClient` import —
  its only new import is `loggerWith` from `@/shared/logger/pino`,
  which is agent-boundary-legal and raised no finding. The repo-wide
  total remains the standing known-red baseline; no new error class,
  no new instance.

## 3. Brief-vs-shipped (D-1 … D-6)

| Position | Shipped state |
|---|---|
| **D-1 direct lookup, not live evaluation** | FAITHFUL. Org-scoped two-step (`vendor_rules` by org+vendor with non-null account → `rule_registry` `lifecycle_state='active'`, the `ruleEvaluationService` precedent); zero Logic-Receipt/counter writes from the human posting path. The DIVERGENCE WATCH obligation lives as a code comment at the helper + carry-forward §5.1. |
| **D-2 single-entry live path only** | FAITHFUL. Wiring exists only in `buildPostBillInput`; `buildPostBillInputFromChildMutation` byte-unchanged (advisor-verified at the T1 read-back). Vendor-keyed resolution (not bundle_type-narrowed, the brief's tension resolution); enum-order + rule_id tiebreak implemented with ambiguity logging; determinism proven by the reverse-seeded two-rule test. |
| **D-3 consumption-time validation** | FAITHFUL. In-org + `account_type='expense'` + `is_active=true`, read org-scoped (never trusting the non-composite FK). The cross-org IDOR-negative proves it end-to-end: a real foreign-org expense account on an active rule → fallback, foreign id appears nowhere in the posted entry (bill_lines + journal_lines). Read-back finding worth recording: **the IDOR-negative's seed succeeding is itself the proof the FK is non-composite** — a composite FK would have rejected the rule at seed time. |
| **D-4 strictly-additive fallback** | FAITHFUL. Reason-coded null on every helper exit + outer catch→warn→null; a rule never blocks the human post. Six-row fallback matrix green; D3 suite green byte-unchanged. |
| **D-5 observability** | FAITHFUL with one read-back-driven refinement: `no_rule_with_account` logs at **debug** (the expected common path — most vendors carry no rule — a non-event, not a noteworthy fallback), while `account_validation_failed` carries `org_id` + `rule_id` + `account_id` at **info** (the audit-relevant line: a rule pointing where it shouldn't). Resolution success logs at info. This report is the provenance for the level choice; the brief's "log the named fallback reason" is met in substance on every path. |
| **D-6 local helper** | FAITHFUL. Module-local sibling to the existing lookups; `trace_id` third param (decomposition ask (c)); `loggerWith` import added to a previously logging-free file (`shared/`, boundary-legal — surfaced and cleared at T1). |

## 4. Deviations

None beyond the two read-back-cleared refinements already recorded:
the D-5 log-level choice (§3) and the decomposition's two-task shape
vs the brief's "~3 tasks" sketch (ask (a), affirmed — estimate, not
position).

## 5. Carry-forward docket

1. **D-1 divergence watch** — when non-vendor conditions or per-type
   branches exist (post-V1), consumption must migrate from the direct
   lookup to the evaluation result. Pinned as a code comment at
   `resolveRuleDefaultAccount`; routes to the wave retrospective.
2. **Resolved-account display at review** — the human approves without
   seeing the expense account the post will carry (preview surfaces no
   account; pre-existing, unchanged by D4). Joins the
   `review_case_detail` directive deferral (D3 close carry-forward #5).
3. **Unordered fallback default** — `lookupBillCommitDefaults`' first-
   expense-account `.limit(1)` remains unordered (pre-existing
   arbitrariness; D4 narrowed its reach to rule-less vendors but did
   not order it). Noted, unscheduled.
4. **v1 producer gap** — the card flow still never sets
   `default_account_id` (Ring 2B owns resolution); until then the
   non-fallback path is exercised via the rules API
   (`CreateVendorRuleInputSchema` admits the field). Recorded at the
   brief stage by the advisor; no action scheduled.
5. **Bundle-child adoption** — `buildPostBillInputFromChildMutation`
   adopts the helper at the post-V1 bundle-at-review re-wire (sibling
   of D3 close carry-forward #2). The helper is vendor-keyed by design
   so the adoption is a call-site change only.

## 6. Scope fences (verified at close)

- `git diff c7e5c2db..HEAD -- docs/02_specs docs/07_governance
  docs/06_audit` → **empty**. Registers/amends: nothing.
- No migrations; no payment-path change; no UI change; no evaluator /
  Logic-Receipt writes; the preserved commit composite untouched
  (confirmed intentionally-unreferenced at impl-onset:
  `commitProposedEntryCard` / `commitProposedMutationBundle` carry the
  "PRESERVED FOR POST-V1" JSDoc + eslint-disabled `no-unused-vars`).
- The five pre-existing untracked worktree paths are not D4's and were
  not dispositioned.

## 7. Wave 6 position after D4

D1 + D2.1 + D2.3 + D3 + **D4 complete**. Remaining per the build
plan: D5 (evidence-object persistence, INV-EVIDENCE-001, IDOR
surface), D6 (INV-WORKFLOW-001 teeth-flip + CI wiring), D7 (positive
human-approve→post row-delta test), D8 (governance doc-sync,
invariant-count 25→26 + reachability + wave UI-screenshot closeout).
Terminal push remains Phil's at wave close.
