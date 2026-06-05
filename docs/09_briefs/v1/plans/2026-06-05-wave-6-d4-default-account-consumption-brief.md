# Wave 6 D4 Brief — Consume Matched Rule's `default_account_id` in the Posting Path

**Status:** DRAFT — surfaced for advisor read-back.
**Charter (plan-of-record §3, verbatim):** "Real coding — consume matched
rule's `default_account_id` in the posting path." Registers/amends:
nothing. IDOR surface: — (none new; one load-bearing read-validation, see
D-3).
**Grounding HEAD:** `eb6c5ac2` (35 banked-local; D1 + D2.1 + D2.3 + D3
fully closed, T8 read-back CLEARED).
**Predecessors:** D3 closed — its approve→post is the live consumer
surface this deliverable wires into. Decision-6 provenance: ADR-0027
("v1 shadow scope: resolve + record in the trace; posting consumption
defers to the workflow arc") — Wave 6 is that workflow arc per the V1
governance-plan §5 charter line ("real coding (consume matched rule's
`default_account_id`)").

---

## 1. Grounded surface (what exists at HEAD)

### 1.1 The arbitrary default D4 replaces

`lookupBillCommitDefaults` (`agent/orchestrator/extraction/ingestDocument.ts:1106-1149`)
resolves three org-level defaults for bill commit; its
`default_expense_account_id` is the **first expense account, unordered
`.limit(1)`** (`:1135-1142`) — no name filter, no ordering, pure
arbitrariness. Two builders consume it as the single bill line's
`account_id`:

- `buildPostBillInput` (`:865-925`) — lookup at `:888`, line account at
  `:910`. Exported at D3 T6 (comment `:862-864`: "the approve→post route
  reuses the SAME input builder the pipeline's preserved commit path
  uses; a copy would drift"). Requires `vendorMatch.vendor_id` non-null
  (`:870-874`) — **`vendor_id` is in scope at the consumption seam.**
- `buildPostBillInputFromChildMutation` (`:927-983`) — lookup at `:942`,
  line account at `:968`; born-paid bundle child path; `vendor_id` from
  `params` (`:938-940`).

### 1.2 Who exercises the builders at V1

- **LIVE:** the approve→post route
  (`app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts:151`)
  calls `buildPostBillInput` under human ctx, post-first with
  `source_external_id = ${caseId}:bill` (`:150`, `:165`) and the
  constraint-NAME-keyed `DUPLICATE_SOURCE_EXTERNAL_ID` dup-catch
  (`:168-189`). This is D3's verified path and **D4's only live
  surface**. Postable population per the D3 D-5 amendment:
  candidate-UNMATCHED single entry cards (vendor-matched).
- **INERT at V1:** the pipeline's preserved commit composite
  (`ingestDocument.ts:729` card path, `:802` bundle-child path) — not
  live per the A-now bleed-stop (`de607fdb`); matched proposals park.
  (Impl-onset must-confirm: read both call blocks at HEAD — cited here
  from grep + the wave record, not a block-level read.)
- **Bundles:** not at review at V1 (D3 close report carry-forward #2,
  "bundle-at-review posting" → post-V1).

### 1.3 The rule substrate

- `vendor_rules` (types.ts:3364-3402): `rule_id`, `org_id`, `vendor_id`,
  `bundle_type`, `default_account_id` (nullable), `legal_entity_id`,
  `approved_at/by`. **`default_account_id` FK → `chart_of_accounts.account_id`
  is NOT org-composite** (`:3395-3402`) — the column alone does not
  guarantee an in-org account.
- Functional gate: `rule_registry.lifecycle_state='active'`
  (`vendorRuleService.ts:88-90` — "the functional gate
  `ruleEvaluationService.evaluate` filters candidates on", confirmed at
  `ruleEvaluationService.ts:127`). Approval ceremony =
  `approve_vendor_rule_atomic` (sets `approved_at/by` + `active`).
  Lifecycle enum: `proposed | active | demoted | retired`
  (types.ts:4085).
- Uniqueness key: `(org_id, COALESCE(legal_entity_id, org_id),
  vendor_id, bundle_type)` (`vendorRuleService.findExisting` `:55-83`).

### 1.4 The resolution precedent (Decision 6, shadow scope)

`shadowRuleEvaluation.ts` resolves the winner's `default_account_id` +
vendor name and **records only** (`:78-79`: "resolved-and-recorded,
consumption deferred"; `:116-119`). Its `resolveOutcomeParams`
(`:134-155`) reads `vendor_rules.default_account_id` **by `rule_id`
alone — no org filter** (`:140-144`). D4's lookup must NOT inherit that
shape; org-scope is load-bearing (D-3). The v1 evaluator semantics D4
mirrors: derived branch = `field_equals(vendor_id)`,
**proposal_type-agnostic** (`:82-85`), **card-only** (`:20-28`).

### 1.5 v1 rule-creation reality (honest framing)

- `createVendorRule` defaults `default_account_id` to null
  (`ruleCreationOrchestrator.ts:83`) and `lifecycle_state='proposed'`
  (`:75`).
- The v1 ProposedRuleCard flow does **not** send it
  (`ProposedRuleCard.tsx:17`, `:69`; `proposedRuleCard.schema.ts:7`,
  `:32` — "stays null until Ring 2B").
- **BUT** the rules create route admits it:
  `CreateVendorRuleInputSchema.default_account_id: uuid.optional()`
  (`ruleActions.schema.ts:43`). A non-null value is API-reachable at v1;
  consumption is forward-wiring with a live (if narrow) producer, not
  dead code.
- `born_paid_bill` is "the only v1-active bundle_type"
  (`proposedRuleCard.schema.ts:23`); enum is 3-valued (types.ts:4310).

### 1.6 Preview surface

`reviewPreview.ts` surfaces **no bill-line account today** (grep over
the file for account/expense terms returns only `accounting_date`;
impl-onset must-confirm with a read). The human currently approves
without seeing the expense account at all — so D4 changing the selection
creates no preview-vs-post *display* drift; surfacing the resolved
account in the case detail is named as an explicit deferral (§3).

---

## 2. Design decisions (positions for read-back)

### D-1 — Resolution mechanism: direct active-rule lookup, NOT live evaluation

Three candidate mechanisms for "matched rule" at posting time:

- **(A — position)** Direct org-scoped lookup at builder grain:
  `vendor_rules` rows for `(org_id, vendor_id)` joined/filtered to
  `rule_registry.lifecycle_state='active'`; consume
  `default_account_id` when the resolved row carries one.
- (B) Run `evaluateAndDispatch` (production branchSource) inside
  approve→post and consume the winner's params.
- (C) Read the recorded shadow evaluation (`rule_evaluation_log`) for
  the trace's `winning_rule_id`.

**Position: A.** At v1 the derived branch is `field_equals(vendor_id)`,
proposal_type-agnostic and card-only (§1.4) — so A and B select the
same rule; A buys that equivalence without dragging Logic-Receipt
writes (`rule_evaluation_log`, INV-RULE-001 append-only) and counter
updates into a human-initiated ledger write the charter didn't scope
(D4 registers nothing). C is rejected outright: it couples posting to
the `RING2B_SHADOW_EVAL` diagnostic flag (default OFF, fail-safe
swallow) — a posting path may not depend on a diagnostic. The brief
records the divergence-watch obligation: when non-vendor conditions or
per-type branches exist (post-V1), A's equivalence to the evaluator
breaks and consumption must migrate to the evaluation result — noted as
a carry-forward marker, not built now (YAGNI + the ADR-0027 follow-on
note on faithful proposal_type derivation).

### D-2 — Scope: single-entry live path only (the D3-intersection fence)

D4 wires consumption **only into `buildPostBillInput`** (the live
approve→post single-entry path D3 verified at T6).
`buildPostBillInputFromChildMutation` (born-paid bundle child, `:927`)
stays **byte-unchanged**: it is inert at V1 (bleed-stop; bundles not at
review — close-report carry-forward #2), and touching the preserved
commit machinery is exactly what the wave fenced out. The new lookup
helper is shaped vendor-keyed (not card-keyed) so the bundle builder
can adopt it at the post-V1 governed re-wire without redesign.

**The bundle_type tension, surfaced explicitly:** v1 rules carry
`bundle_type='born_paid_bill'` (the only v1-active value) while D4's
live surface is the plain `post_bill` entry card. Resolution is keyed
on **vendor** (org + vendor + lifecycle-active), NOT narrowed by
`bundle_type` — mirroring the evaluator, whose v1 derived branch is
proposal_type-agnostic (§1.4). A `bundle_type` narrowing would make
every v1 rule invisible to the only live posting path (or force the
card to masquerade as a born-paid bundle). If `(org, vendor)` resolves
multiple active rules with non-null `default_account_id` (possible
across `bundle_type`/`legal_entity_id` under the §1.3 uniqueness key),
take the deterministic first by `bundle_type` enum order then
`rule_id`, and log the ambiguity — deterministic-over-arbitrary, no
new policy invented.

### D-3 — Consumption-time validation (the load-bearing org check)

The resolved `default_account_id` is consumed **only if** the account
(read org-scoped from `chart_of_accounts`):

1. belongs to the posting org (`org_id` match — load-bearing because
   the FK is not org-composite, §1.3, and the shadow precedent's
   rule_id-only read shape must not be inherited, §1.4),
2. `account_type='expense'` (the slot it fills is the bill's expense
   line; AP-control stays `lookupBillCommitDefaults`-resolved),
3. `is_active=true`.

Any failure → **fall back, never block** (D-4). This is a
read-validation inside an existing write path, not a new read facet —
consistent with the charter's "IDOR surface: —".

### D-4 — Fallback semantics: strictly additive

Rule absent / not `active` / `default_account_id` null / validation
fail → behavior **byte-equivalent to today** (first-expense-account
default). The rule parameter is an enrichment, not a gate: a human
approving a bill must never be blocked by rule-substrate state. D3's
shipped tests must pass unmodified as the additive proof.

### D-5 — Observability: log at resolution grain, no trace-stage write

One `log.info` at resolution (threading `trace_id`: `winning rule_id`,
resolved `account_id`, or the named fallback reason) — Decision 6's
record-spirit carried to consumption grain. **No `pipeline_trace` stage
write**: trace stages are pipeline-scoped, approve→post is
route-scoped, and D4 registers nothing.

### D-6 — Surface shape: local helper, sibling to the existing lookups

`resolveRuleDefaultAccount(org_id, vendor_id): Promise<string | null>`
as a **module-local helper in `ingestDocument.ts`**, sibling to
`lookupBillCommitDefaults`/`lookupPaymentCommitDefaults` (same file,
same raw-`adminClient` shape, same null-on-missing contract) — the
established precedent for builder-grain lookups. Not a
`vendorRuleService` method: the service's reads are
`withInvariants`-wrapped wanting `ServiceContext`, which the builders
don't carry (`builderInput` = org/source-doc/trace only,
approve-post route `:139-143`); and the one-consumer rule says don't
generalize yet. Consumed at `buildPostBillInput` between the existing
lookup (`:888`) and the return — rule account when resolved, else
`lookups.default_expense_account_id`.

---

## 3. What D4 does NOT do (scope fences)

1. **No rule authoring/resolution change** — `default_account_id` stays
   null in the v1 card flow; setting it remains Ring 2B's.
2. **No bundle/child-builder change; no auto-commit re-wire** — the
   preserved commit composite and `buildPostBillInputFromChildMutation`
   stay byte-unchanged (D-2).
3. **No evaluator/Logic-Receipt writes in the posting path** (D-1).
4. **No preview/UI change** — surfacing the resolved account in case
   detail is deferred (joins the `review_case_detail` directive
   deferral, close-report carry-forward #5).
5. **No migration, no invariant registration, no governance-doc writes**
   — charter row: registers/amends nothing. Scope-fence check at close:
   diff over the D4 range restricted to `docs/02_specs` +
   `docs/07_governance` + `docs/06_audit` is empty (the D3 T8 pattern).
6. **No payment-path change** — `lookupPaymentCommitDefaults` and
   `buildRecordPaymentInput`/`FromChildMutation` untouched (rules carry
   no payment-account parameter).

---

## 4. Impl-onset must-confirms (verify-from-disk before T1)

1. Read the two inert commit-composite call blocks
   (`ingestDocument.ts:729`, `:802`) — confirm cited-inert status and
   that the D-2 fence holds against their actual shape.
2. Read `reviewPreview.ts` postable-summary shape — confirm the §1.6
   no-account-display grep finding at block grain.
3. Confirm the Supabase JS join shape for vendor_rules →
   rule_registry lifecycle filter (composite FK `(rule_id, org_id)`;
   two-step query acceptable if the embed fights the composite key —
   `ruleEvaluationService.ts:127` is the existing lifecycle-filter
   precedent to mirror).
4. Confirm `chart_of_accounts` column names at HEAD
   (`account_type`, `is_active`, org column name) against types.ts.
5. Confirm test seeding surface: `orgContextFixture.ts:39` has
   `vendor_rules: []`; integration tests seed via
   `create_vendor_rule_atomic`/`createVendorRule` + `approve` (the
   ceremony, §1.3) — confirm the fixture/factory path used by existing
   rules integration tests and reuse it.

---

## 5. Test surface (summary — full TDD decomposition at plan stage)

Integration grain (the floor; builder is adminClient-coupled, so
integration is the honest grain — name the unit-test absence rather
than mock-theater it):

1. **Happy path:** seeded vendor + **approved/active** rule with
   non-null in-org expense `default_account_id` → approve→post → the
   posted bill line's `account_id` = the rule's account (assert at
   journal/bill-line read grain).
2. **Fallback matrix** (each → first-expense-account default, post
   succeeds): no rule; rule `proposed` (ceremony not run); rule active
   + null `default_account_id`; account cross-org; account
   non-expense; account `is_active=false`.
3. **Determinism:** two active rules for the vendor with distinct
   accounts → the D-2 tiebreak account, logged.
4. **Additive proof:** D3's approve→post suite green byte-unchanged.
5. Category A floor untouched (no schema change ⇒ no floor delta —
   confirm at close gate).

---

## 6. Cadence

This brief → advisor read-back (**HOLD**) → task decomposition →
read-back (**HOLD**) → task-by-task (implement → per-task read-back
with code + runs surfaced together → commit under
`COORD_SESSION='wave-6-ap-review'`). Expected small: ~3 tasks
(T1 helper + wiring; T2 integration tests; T3 close — gates +
close-report). No push; terminal push is Phil's at wave close.
