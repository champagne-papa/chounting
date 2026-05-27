# Ring 2A-core Implementation Seams — Pure-Core Evaluator, Agent Ladder Gate, Services, Route Handler, Stage 1 Canvas

**RATIFIED 2026-05-26 as [ADR-0025](../../../07_governance/adr/0025-ring2a-core-implementation-seams.md).** Per ADR-0021 §4, this design spec is now preserved as historical reference; the ratified ADR carries the canonical record. One ratification-time correction not in the V0.2 content below: the `modules` frontmatter omits `shared` (not a `taxonomy.md` module token — it would fail `adr:lint`), landing `[db, agent, core]` to match ADR-0024; the V0.2 planned `[…, shared]` is corrected in ADR-0025's Context (the `shared/rules/` work is fully described in Decisions 3 + 5 regardless). All other decisions carry verbatim. The content below describes the pre-ratification (V0.2) state.

**Status:** Pre-ratification design spec (ADR-0021 §4 / Alternative 5). Routes
through `docs/09_briefs/post-mvp/specs/`; lands at
`docs/07_governance/adr/0025-ring2a-core-implementation-seams.md` with `status:
ratified` at CTO ratification. This file is the design input the CTO marks up; it
is **not** a `status: proposed` ADR.
**Date:** 2026-05-26 · **Revision:** V0.2 (precision pass over V0.1 — review patch:
naming/scope, sequencing-vs-append, every-evaluation + skip semantics, OQ-8/OQ-9
resolved to decisions) · **Branch:** `staging` · **Session lock:**
`ring2a-core-authoring-spec`.
**Voice:** decision-bearing, constitutional-prep. Where the brainstorm and
verification settled positions, they are decisions, not reopened.

**Inputs (by SHA):**
- Brainstorm — `docs/09_briefs/post-mvp/2026-05-26-ring2a-core-authoring-brainstorm.md` @ `db43fadc` (Decisions A–K; F-layering reframe).
- Pre-ADR verification — `docs/09_briefs/post-mvp/2026-05-26-ring2a-core-authoring-pre-adr-verification.md` @ `6214c603` (OQ-2 disk-refutation → `shared/rules/capping.ts`; OQ-3 shape forced by three constraints; OQ-4 confirmed; §5.7/INV-AGENT-002 precision point; OQ-5 third-path).
- Verification ratifications (§11) @ `3016b8c2` (OQ-1 3/2/1 + named constants; OQ-3a separate txn; OQ-3b Path A; OQ-3c `recordEvaluation` on `ruleEvaluationService`; OQ-7 one-spec-multi-commit).
- Canonical spec — `docs/02_specs/rule-type-core.md` (§5.4–§5.7, §6.1, §6.3, §7).
- Substrate — ADR-0023 (`20240163000000_rule_type_core_substrate.sql`), ADR-0024 (`20240164000000_rule_evaluation_log.sql`), `vendor_rules` from `20240101000000_initial_schema.sql`.

---

## 1. HEAD pass (this session, disk-grounded)

The brainstorm did the broad mapping; the verification did the chat-ratification
framing. This narrow pass confirms the still-greenfield consumer surface and the
precedents the decisions inherit. **Three findings conflict with the brief's
framing and are flagged here (Corrections 1–3), with corrected shapes folded into
the decisions; a fourth (Correction 4 — boundary-crossing types) is derived in
Decision 5 from §1f's import boundary.**

**(a) ADR number.** Highest ratified ADR is `0024-ring2a-core.md`. Next available
is **0025**. The design-spec container `docs/09_briefs/post-mvp/specs/` already
holds the 0023 and 0024 design specs (precedents). This spec is
`2026-05-26-adr-0025-ring2a-core-implementation-seams-design.md` (renamed from the
working `…-authoring-design.md` at the V0.2 naming correction — see §3).

**(b) `shared/` convention — confirmed; `shared/rules/` fits.** `shared/` is
subdirectory-based (`shared/types/`, `shared/logger/`, `shared/i18n/`,
`shared/storage/`, `shared/schemas/<domain>/`; only `shared/env.ts` is flat). A
new `shared/rules/` subdir is idiomatic. The pure-helper precedent is
`shared/types/tabTitle.ts`: `export function tabTitleForDirective(directive:
CanvasDirective): string { switch (directive.type) { … } }` — a pure exhaustive
switch-map, exactly the shape `cap()` takes. `shared/` files import nothing
outside `shared/`.

**(c) Mutation-route shape — confirmed (Decision 9 inherits it).** From
`app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts`:
```ts
const { orgId, billId } = await params;            // params is a Promise
const json = await req.json().catch(() => ({}));
const parsed = ApproveBillForPaymentInputSchema.parse({ org_id: orgId, bill_id: billId, ...json });
const ctx = await buildServiceContext(req);        // { trace_id, caller:{user_id,email,verified,org_ids}, locale }
const result = await withInvariants(billService.approveForPayment, { action: 'bill.approve' })(parsed, ctx);
return NextResponse.json(result, { status: 200 });  // 200 state-only; 201 creation
// catch: ZodError→400 {error,details}; ServiceError→serviceErrorToStatus(code); else→500
```
`withInvariants` is invoked **route-site** (Pattern B) around an unwrapped service
fn with `{ action: '<resource>.<verb>' }`. Zod `.strict()` is on the schema;
composed by spreading `...json` over URL params.

**(d) Service conventions — confirmed, with one correction (see below).** Two
export patterns coexist: Pattern A (export-site wrap — `aiActionsService`:
`{ list: withInvariants(list), … }`) and Pattern B (route-site wrap —
`billService`: `{ post, approveForPayment, … }` unwrapped). Signature is
`async fn(input: <ZodType>, ctx: ServiceContext): Promise<T>`; the DB client is
obtained **inside** the fn via `adminClient()` (service-role, RLS-bypassing) —
**never passed in**. Sole-writer is a comment + code-review discipline
(`journalEntryService.post() is the sole writer of journal_entries`).

> **⚠ Correction 1 — transaction model (load-bearing).** The brief's Decisions
> 6/7 say the orchestrator "threads one client/transaction through both services."
> **Disk contradicts this.** Services do not thread clients and do not open
> service-layer Postgres transactions. Multi-table atomicity is achieved via an
> **RPC**: `journalEntryService.post` delegates to `write_journal_entry_atomic`
> for its atomic three-table insert; `billService.recordPayment` otherwise
> accepts non-atomic sequential writes + idempotency. **Corrected shape:**
> all-or-nothing rule creation uses an atomic RPC `create_vendor_rule_atomic`
> (the project's only multi-table atomicity primitive), invoked by
> `ruleCreationOrchestrator`. This adds one small RPC migration to Commit 3.
> Folded into Decision 6, where it is **resolved (former OQ-8)**: atomic RPC; the
> non-atomic + idempotency alternative is rejected (rule creation isn't retry-shaped).

**(e) Mutating-canvas pattern — confirmed, with one reconciliation.** From
`PaymentApprovalCard.tsx` / `BillReverseCard.tsx` / `RecordPaymentCard.tsx`:
mutations are **raw `fetch()`** (no shared helper) with form→service-input
transform; on success they **re-read authoritative state** (the cards navigate
away because the entity leaves its filtered list); **no optimistic updates**;
errors are **inline** (`border-red-300 bg-red-50`, no toast lib); `401` →
redirect to sign-in; `400 {details}` → per-field form errors. Destructive actions
use a **warning banner + red button**, **not a confirm modal**.

> **⚠ Correction 3 — canvas confirmation is modal-free.** The project has no
> confirm-dialog convention; destructive mutations use an inline amber warning
> banner + red high-friction button. The ADR-0024 "inert promotion modal" is a
> **different artifact** — a disabled *promotion-ceremony* surface, not a confirm
> dialog. Decision 10 reconciles: `retire`/`demote` use the inline-warning + red-
> button pattern; `promote` opens the inert ceremony modal (ADR-0024 affordance,
> disabled); and because the rule persists in the registry after a mutation
> (unlike a bill leaving a list), the success action is **refetch-the-list**, not
> navigate-away.

**(f) ADR-0020 doc-drift — confirmed (forward-flag).**
`apps/web/eslint.config.mjs:119` registers
`architecture/agent-first-import-boundaries` at `"error"`. ADR-0020's ratification
note still describes it as `'off'` (Phase 1 activation flipped it). The live
`'error'` state is correct; ADR-0020's text wants a one-line doc-sync. Forward-
flagged, not an in-arc fix.

**(g) Permission Catalog — confirmed, with one correction.** `ACTION_NAMES` lives
at `apps/web/src/services/auth/canUserPerformAction.ts` (30 keys; strict
`<resource>.<verb>` shape; e.g. `bill.approve`, `payment.record`). The four new
keys are `rule.promote`, `rule.demote`, `rule.rename`, `rule.retire` (→ 34).

> **⚠ Correction 2 — permissions is a migration + count-drift discipline, not a
> constant edit.** Adding the four keys requires, **atomically in one commit**
> (Permission Catalog Count Drift convention,
> `docs/04_engineering/conventions/audit-permissions.md`): (1) the `ACTION_NAMES`
> constant; (2) a permissions seed migration (template:
> `20240140000000_bill_action_permissions.sql`) inserting `permissions` rows +
> `role_permissions` rows; (3) CA-27 parity (`permissionParity.test.ts`) — auto-
> passes; (4) CA-28 (`permissionCatalogSeed.test.ts`) — bump ~5 hardcoded count
> sites (total 30→34; controller count; exact-set list); (5) CA-37
> (`crossOrgRlsIsolation.test.ts`) — bump hardcoded RLS-surface counts. Folded
> into Decision 9 + Commit 4. Role assignment: **controller** gets all four
> (rule governance is controller authority; RLS `user_is_controller` is the DB
> backstop); `ap_specialist`/`executive` get none.

**Substrate column confirmations (verify-from-disk for the decisions):**
- `rule_registry` (`20240163`): `id`, `org_id`, `rule_type rule_type`,
  `lifecycle_state rule_lifecycle_state`, `current_rung rule_autonomy_rung DEFAULT
  'always_confirm'`, `name text` (nullable), `created_by`, `created_at`,
  `promoted_at/_by`, `demoted_at/_by`, `retired_at/_by`, `predecessor_rule_id`,
  `successor_rule_id`, `UNIQUE (id, org_id)`. The brief's `current_rung` is
  **correct** (the `autonomy_tier` drift was `vendor_rules`-specific, not the
  registry).
- `rule_track_records` (`20240163`): PK `rule_id` → `rule_registry(id)`; counters
  (`clean_approval_count`, `rejection_count`, `guardrail_*`); `last_clean_approval_at`,
  `last_rejection_at`, `last_guardrail_fire_at`, **`last_winning_match_at`** (`-- Q-RC-AT-2 (stored)`),
  `model_version`. UPDATE/DELETE `USING(false)`; INSERT through-parent
  `user_is_controller`; SELECT through-parent `user_has_org_access`.
- `vendor_rules` (`20240101` + `20240163` step e): post-substrate columns are
  `rule_id` (PK, 1:1 child of `rule_registry` via composite FK on `(rule_id,
  org_id)` → `(id, org_id)`), `org_id`, `vendor_id`, `default_account_id`,
  **`bundle_type bundle_type` NOT NULL** (added step e; the memory's "bundle_type
  drift" is **resolved**). `autonomy_tier`/`created_*` were dropped — they live on
  `rule_registry` (class-table-inheritance: parent = identity/rung/lineage, child
  = vendor-specifics).
- `rule_evaluation_log` (`20240164`): `id`, `org_id`, `rule_id`, `trace_id`,
  `match_classification` (`primary_match|guardrail_match|almost_match`),
  `winning_branch_type` (nullable), `winning_branch_max_action action_type`
  (nullable), `effective_action action_type` (nullable), `proposed_mutation_id`
  (nullable), `disposition` (nullable, `auto_posted|routed|blocked|pending`),
  `evaluation_trace jsonb NOT NULL`, `created_at`. RLS: SELECT
  `user_has_org_access`; no INSERT policy (service-emitted); UPDATE/DELETE
  `USING(false)` (INV-RULE-001, user-path). `rule_evaluation_30d_view`
  (`security_invoker = true`) exposes `last_evaluated_at` (`max(created_at)`, all
  classifications).
- `action_type` enum values: `auto_post_at_rung_3`, `auto_post_at_rung_2`,
  `suggest_with_required_approval`, `route_to_exception_queue_with_reason`,
  `block_with_reason`. `rule_autonomy_rung`: `silent_auto`,
  `notify_and_auto_post`, `always_confirm` (v1 ships `always_confirm` only).

---

## 2. Planned ADR-0025 frontmatter (finalized at ratification)

```yaml
# (illustrative — finalized when this lands as docs/07_governance/adr/0025-ring2a-core-implementation-seams.md)
adr: 0025
title: Ring 2A-core Implementation Seams — Evaluator, Agent Ladder Gate, Services, Route, Stage 1 Canvas
status: ratified            # at CTO ratification
date: <ratification date>
supersedes: []
related: [0007, 0010, 0011, 0017, 0020, 0023, 0024]
invariants: []              # consumes INV-RULE-001 (registered at ADR-0024); registers none
modules: [db, agent, core, shared]   # +shared vs ratified ADR-0024 [db,agent,core]; see note
```

**Taxonomy note (forward-flag; disk-checked).** ADR-0025's `modules` add **`shared`**
to ratified ADR-0024's `[db, agent, core]` (`0024-ring2a-core.md:7`) — this arc is
the first to introduce `shared/rules/` (Decisions 3, 5). `ui` is **absent**:
`RuleRegistryView` is an `app`/`components/canvas` artifact, not `packages/ui`, and
the `modules` vocabulary has no `app-components` token. (The ADR-0024 *design spec*
listed `[db, agent, core, ui]`, but the *ratified* ADR-0024 dropped `ui` — the same
tokenless-app-components gap, resolved the same way. So this is **+`shared`**, not a
"ui → shared swap": ratified ADR-0024 carried no `ui`.) The taxonomy gap (no token
for canvas/app components) is flagged for future module-vocabulary hygiene, not
resolved here.

---

## 3. Context

Ring 2A-core's substrate ratified at **ADR-0024** (`rule_evaluation_log` +
`rule_evaluation_30d_view` + INV-RULE-001, migration `20240164`, atop the ADR-0023
Ring 1 registry substrate). This arc authors the **consumers** of that substrate:
the pure-core evaluator, the Agent Ladder gate, the `services/rules/` layer, the
route handlers, and the Stage 1 `RuleRegistryView` canvas. The schema is live,
tested, and RLS-verified; this is consumer-side greenfield against settled canon.

**ADR-0024 vs ADR-0025 boundary (read this first).** ADR-0024 ratified the
*substrate* and the high-level Ring 2A-core shape: `rule_evaluation_log`,
`rule_evaluation_30d_view`, INV-RULE-001, and the core/gate/canvas boundary.
**ADR-0025 ratifies the *implementation seams* that consume ADR-0024** — the file
homes, the `shared/rules/` types + capping, the service APIs, the route handlers,
the permission-catalog change, the canvas action patterns, and the commit plan. It
adds no new domain tables: only an atomicity RPC (Decision 6) and a permissions
seed (Decision 9). **Substrate → seams.** The title reads "Implementation Seams"
(not "Authoring") precisely because the conversational rule-*authoring* path is the
separate later arc (next paragraph) — naming it "Authoring" would invite exactly
that misread.

**Scope is Ring 2A-*core*, not Ring 2A-*authoring*.** This arc ships the
evaluation/gate/registry-management path. The agent conversational-drafting
approval flow and the broader cross-agent **Logic Receipt** write path
(INV-AGENT-002) are the separate later **Ring 2A-authoring** arc. The split (H in
the brainstorm) holds.

**Pre-design chain.** Brainstorm (`db43fadc`) mapped Decisions A–K and the
F-layering reframe. The pre-ADR verification (`6214c603`) disk-refuted the
brainstorm's `agent → core` import lean (→ `shared/rules/capping.ts`), confirmed
the route convention, established that the service/gate/log layering is *forced*
by three constraints, and surfaced the §5.7/INV-AGENT-002 terminology precision
point. Ratifications (`3016b8c2`, §11) locked OQ-1/OQ-3a/b/c/OQ-7. This spec folds
all of it in, plus the three Correction findings from §1.

---

## 4. Decision

Eleven decisions, in dependency order. Each gives file paths, signatures, and the
migration-or-not call.

### Decision 1 — Pure-core Rule/Branch/Condition types
*(Brainstorm B; ADR-0023 Branch/Condition non-decision carried)*

File `apps/web/src/core/rules/types.ts`. Pure; imports nothing outside `core`.
In-memory types only — this arc authors **no predicate-storage substrate** (the
service assembles `Rule[]` from `rule_registry` rows; Branch/Condition shapes are
typed fixtures/service-assembled objects per ADR-0023's non-decision).

```ts
type Rule = {
  id: string; org_id: string;
  rule_type: RuleType;                 // enum rule_type
  current_rung: RuleAutonomyRung;      // enum rule_autonomy_rung (DEFAULT 'always_confirm')
  lifecycle_state: RuleLifecycleState; // enum rule_lifecycle_state
  name: string | null;
  promoted_at: string | null; demoted_at: string | null; retired_at: string | null;
  created_at: string;
  branches: Branch[];
};
type Branch = {
  branch_order: number;
  branch_type: 'primary' | 'otherwise_if';
  applies_to_evaluation_triggers: EvaluationTrigger[];
  applies_to_source_triggers: SourceTrigger[] | null;   // §6.1 step 2 branch-level filter
  max_outcome_action: ActionType;                       // enum action_type
  conditions: Condition[];
};
type Condition = {
  condition_type: ConditionType;
  condition_order: number;
  target_field: string;          // context field reference
  condition_value: ConditionValue;  // typed per condition_type
};
type EvaluationContext = { /* proposed mutation fields, source_trigger, vendor_id, amount, … */ };
// Boundary-crossing types live in shared/rules/types.ts (Decision 5 / OQ-9), NOT here:
//   MatchResult       — §5.7; NO effective_action (gate output)
//   EvaluationSkipped — { skipped: true; reason: 'system_ceiling_class' | 'system_ceiling_reversal' }
//   ActionType, RuleAutonomyRung — shared enums the gate + capping also consume
```

`Rule`/`Branch`/`Condition`/`EvaluationContext` stay in `core/rules/types.ts`
(used by `core` and, via the legal `services → core` edge, by `ruleEvaluationService`).
Migration: **none** (in-memory types). Zod schemas reserved for the persistence
boundary (`shared/schemas/rules/`) at the future Branch-substrate ring — not this
arc.

### Decision 2 — Predicate evaluator registry
*(Brainstorm A; OQ-1 ratified `3016b8c2`)*

File `apps/web/src/core/rules/predicates.ts`. Pure.

```ts
export const SPECIFICITY_CLOSED_SET = 3;
export const SPECIFICITY_RANGE = 2;
export const SPECIFICITY_PATTERN = 1;

type PredicateEvaluator = (conditionValue: unknown, contextFieldValue: unknown) => boolean;

export const PREDICATES: Record<ConditionType, { evaluate: PredicateEvaluator; specificityWeight: number }> = {
  field_equals:         { evaluate: …, specificityWeight: SPECIFICITY_CLOSED_SET }, // 3
  field_in_set:         { evaluate: …, specificityWeight: SPECIFICITY_CLOSED_SET }, // 3
  source_trigger_equals:{ evaluate: …, specificityWeight: SPECIFICITY_CLOSED_SET }, // 3
  field_in_range:       { evaluate: …, specificityWeight: SPECIFICITY_RANGE },      // 2
  field_outside_range:  { evaluate: …, specificityWeight: SPECIFICITY_RANGE },      // 2
  field_matches_pattern:{ evaluate: …, specificityWeight: SPECIFICITY_PATTERN },    // 1
};
```

Each `evaluate` is pure, no I/O. **Ring 2B extensibility:** temporal/inferential
predicates (`category_classification_matches`, `semantic_match_above_threshold`)
are added as new map entries with weight constants matching §5.5's tier ordering
(closed-set 3, range/threshold 2). Re-numbering reserved for a future tier-
insertion need. Migration: none.

### Decision 3 — `shared/rules/capping.ts`
*(Brainstorm E, **revised per OQ-2 disk-refutation, verification `6214c603`**)*

File `apps/web/src/shared/rules/capping.ts`. Pure; imports nothing outside
`shared/`. **This is the OQ-2 correction:** `agent → core` is forbidden
(ADR-0020 Appendix A; ESLint `'error'`), so the capping table cannot live in
`core/` and be gate-imported. It lives in `shared/` — importable by **both** the
pure core (§6.1 step 3 tiebreak) and the agent gate (§6.1 step 7 authoritative).

```ts
// §6.1 step 3 capping table (rule-type-core.md:892–903), verbatim.
export function cap(maxOutcomeAction: ActionType, currentRung: RuleAutonomyRung): ActionType { … }
```

The 9-row table (verbatim from `rule-type-core.md:892–903`):

| `max_outcome_action` | `current_rung` | capped action |
|---|---|---|
| `auto_post_at_rung_3` | `silent_auto` | `auto_post_at_rung_3` |
| `auto_post_at_rung_3` | `notify_and_auto_post` | `auto_post_at_rung_2` |
| `auto_post_at_rung_3` | `always_confirm` | `suggest_with_required_approval` |
| `auto_post_at_rung_2` | `silent_auto` | `auto_post_at_rung_2` |
| `auto_post_at_rung_2` | `notify_and_auto_post` | `auto_post_at_rung_2` |
| `auto_post_at_rung_2` | `always_confirm` | `suggest_with_required_approval` |
| `suggest_with_required_approval` | any | `suggest_with_required_approval` |
| `route_to_exception_queue_with_reason` | any | `route_to_exception_queue_with_reason` |
| `block_with_reason` | any | `block_with_reason` |

**v1 asymmetry:** since v1 `current_rung` is only `always_confirm`, every
`auto_post_at_rung_*` caps to `suggest_with_required_approval`. Migration: none
(application logic; correctly absent from the DB).

### Decision 4 — Pure-core evaluator
*(Brainstorm A + D; Decision C ratifications)*

Directory `apps/web/src/core/rules/`. Files: `types.ts` (Decision 1),
`predicates.ts` (Decision 2), `branchEvaluator.ts`, `conflictResolver.ts`,
`evaluator.ts`. Entry point (per §7, pure/deterministic):

```ts
export function evaluate(rules: Rule[], context: EvaluationContext): MatchResult;
```

- **Branch evaluation (§6.1 step 2):** first-match — primary branch, then
  `otherwise_if` branches in `branch_order`; filtered by
  `applies_to_evaluation_triggers` and `applies_to_source_triggers`.
- **Conflict resolution (§6.1 step 4 + Decision C):** (4a) specificity = **sum**
  of matched branch's condition weights (Decision 2); (4b) most-conservative
  `tiebreak_effective_action`, computed by applying `cap()` (Decision 3) — order
  `block_with_reason` > `route_to_exception_queue_with_reason` >
  `suggest_with_required_approval` > `auto_post_at_rung_2` > `auto_post_at_rung_3`;
  (4c) recency — `COALESCE(promoted_at, created_at)` descending (from the assembled
  `Rule`); (4d) stable `id` UUID order. Total ordering.
- **`MatchResult` fields (§5.7, `rule-type-core.md:594–627`):** `winning_rule_id`
  (null if none), `winning_branch`, `winning_branch_type`
  (`primary|guardrail`), `winning_branch_max_action`, `match_classification`
  (`primary_match|guardrail_match|almost_match`), `also_matched_rules` (ordered by
  the full resolution ordering), `almost_match_rules` (`rule_id`,
  `closest_branch_id`, `failed_conditions`), `track_record_snapshot`,
  `four_questions_population`, `evaluation_trace`. **No `effective_action`** — that
  is the gate's output (Decision 5).
- **Imports:** `shared/rules/capping.ts` only (the step-3 tiebreak). No DB, no
  services, no agent. ESLint `agent-first-import-boundaries` (`'error'`) guards
  this.

Migration: none.

### Decision 5 — Agent Ladder gate
*(Brainstorm E; §6.1 capping as canon)*

Directory `apps/web/src/agent/policies/agent-ladder/`. Files: `gate.ts`,
`stubs.ts`.

```ts
export function gate(matchResult: MatchResult, ruleRegistryRow: RuleRegistryRow, limitContext: LimitContext): ActionType;
```

Sequential composition (§6.1 step 7):
```
cap(matchResult.winning_branch_max_action, ruleRegistryRow.current_rung)
  → checkPerTransactionLimit(action, ctx)
  → checkDailyAggregate(action, ctx)
  → checkTrackRecordHealth(action, ctx)
  → effective_action
```

Three **inert stubs** (`stubs.ts`), each `(action: ActionType, ctx: LimitContext)
=> ActionType` returning the input unchanged with an explicit `// activates
post-v1` marker; post-v1 activation is a single-file body replacement. At v1 the
gate's output equals `cap(max, rung)`.

**Imports — boundary-forced (Correction 4; resolves former OQ-9).** The gate needs
`cap()` plus the `MatchResult`, `ActionType`, and `RuleAutonomyRung` types.
`agent ↛ core` **and** `agent ↛ db` (ADR-0020 Block 1, §1f), so the gate cannot
import these from `core/rules/types.ts` or the generated `db/types.ts`. Therefore
the **boundary-crossing evaluation types live in `shared/rules/types.ts`**
(alongside `shared/rules/capping.ts`) — importable by `core` (its `evaluate()`
return type), `agent` (the gate's input + `ActionType` output), and
`shared/rules/capping.ts` itself. **This is the identical boundary problem OQ-2
resolved for the capping table — same boundary (`agent ↛ core`), same resolution
(`shared/rules/`).** `contracts/` is **not** the home: it is conventionally for
cross-service type *contracts* at API/RPC boundaries, but the boundary crossed here
is the `agent ↛ core` *import* boundary, not an API boundary (a category mismatch),
and splitting capping (`shared/rules/`) from types (`contracts/rules/`) would
fragment one coherent rule-evaluation-grammar module. `EvaluationContext`, `Rule`,
`Branch`, `Condition` stay in `core/rules/types.ts` (used by `core` + the legal
`services → core` edge). **Resolved: `shared/rules/types.ts`.** The gate imports
**only** from `shared/`. Migration: none.

### Decision 6 — `services/rules/` greenfield (five services + one atomic RPC)
*(Brainstorm F + G; OQ-3c ratified; **Correction 1 folded in**)*

Directory `apps/web/src/services/rules/`. Files: `ruleRegistryService.ts`,
`ruleTrackRecordService.ts`, `vendorRuleService.ts`, `ruleEvaluationService.ts`,
`ruleCreationOrchestrator.ts`. All obtain `adminClient()` internally; signature
`async fn(input, ctx: ServiceContext): Promise<T>`.

- **`ruleRegistryService`** — sole writer of `rule_registry` for **lifecycle
  mutations**: `promote(rule_id, target_rung, ctx)`, `demote(rule_id, ctx)`,
  `rename(rule_id, name, ctx)`, `retire(rule_id, ctx)` (single-table UPDATEs,
  setting the matching lineage anchor + actor column); plus read methods for
  canvas joins.
- **`ruleTrackRecordService`** — sole writer of `rule_track_records` updates:
  `recordEvaluation(rule_id, classification, disposition, ctx)` (counter
  increments + `last_*_at` stamps, per disposition outcome; service-role write).
  Read methods for counters.
- **`vendorRuleService`** — sole writer of `vendor_rules`:
  `create(rule_id, org_id, vendor_id, default_account_id, bundle_type, ctx)` for
  the **single-table** child insert path; reads. (Post-`20240163` columns; no
  `autonomy_tier`/`created_*` — those are on the registry.)
- **`ruleEvaluationService`** — sole writer of `rule_evaluation_log`
  (INV-RULE-001). **Two methods (OQ-3c):**
  - `evaluate(proposal, ctx): MatchResult | EvaluationSkipped` — §6.1 step 1
    trigger-index lookup + input assembly (read `rule_registry` candidates +
    `rule_track_records` snapshot), calls pure-core `evaluate(rules, context)`,
    returns `MatchResult` — or `EvaluationSkipped(reason='system_ceiling_class')`
    for ceiling/reversal-class proposals (§5.6/§6.3 defensive guard). **No log
    write.**
  - `recordEvaluation(matchResult, effectiveAction, disposition, ctx): { ids }` —
    appends to `rule_evaluation_log`. **Ownership split:** `ruleEvaluationService`
    owns the *append operation* (the table write); it does **not** own the decision
    of *when* to append — that sequencing is the orchestrator's (Decision 7).
    **Do not collapse `recordEvaluation` into `evaluate` for "atomicity"** — that
    re-breaks the forced layering, since the row needs `effective_action`, which
    only exists *after* the gate runs.
  - **Logging semantics (every-evaluation; ADR-0024 carry-forward).**
    `rule_evaluation_log` is **row-per-candidate-rule**, not row-per-proposal: a
    proposal evaluated against N candidate rules (trigger matched) writes **N rows**
    sharing one `trace_id`, with winner-attribute columns (`winning_branch_type`,
    `winning_branch_max_action`, `effective_action`, `disposition`) populated on the
    winning row and **null on non-winners** (the migration's table comment). So
    `recordEvaluation` expands the `MatchResult` (winner + `also_matched` +
    `almost_match`) into that row set and appends it in one statement. It is **not**
    row-per-condition or row-per-branch — branch/condition detail lives inside
    `evaluation_trace` (jsonb). A proposal with **zero candidate rules** (no trigger
    match) writes **no row** (`rule_id` is `NOT NULL` per ADR-0024; a synthetic
    "no-rule" row would force a nullable `rule_id` or a sentinel — both rejected);
    "no rules triggered" is captured by the proposal pipeline's own audit trail. A
    pure `almost_match` evaluation (no winner → no gate → no dispatch) writes its
    candidate rows with `effective_action = null`, `disposition = null`.
  - **`EvaluationSkipped` is not logged** to `rule_evaluation_log` in this arc. The
    schema's `match_classification` CHECK (`primary_match | guardrail_match |
    almost_match`) doesn't accommodate a skip, and ceiling handling is an upstream
    concern (the proposal pipeline / agent-ladder ceiling check) —
    `EvaluationSkipped` here is a defensive guard, not a logged event. A future ADR
    may extend the schema if ceiling-skip visibility becomes useful.
- **`ruleCreationOrchestrator`** — `createVendorRule(input, ctx): { rule_id }`.
  **Correction 1 (resolves former OQ-8):** all-or-nothing creation of
  `rule_registry` (parent) + `rule_track_records` (co-created, ADR-0023 Decision 5)
  + `vendor_rules` (child) is achieved via a **new atomic RPC**
  `create_vendor_rule_atomic(p_registry, p_track_record, p_vendor_rule)` doing all
  three inserts in one DB transaction — mirroring `write_journal_entry_atomic`. The
  orchestrator invokes the RPC; this is the project-idiomatic atomicity primitive
  (not a threaded client). **The non-atomic + idempotency alternative
  (`billService.recordPayment`) is rejected:** idempotency is retry-shaped, but rule
  creation isn't (a duplicate create is a duplicate-*rule* problem, not an idempotent
  no-op), and an orphaned `rule_registry` row from a failed `vendor_rules` insert is
  a real integrity gap. No production caller wires the orchestrator this arc (the
  conversational-drafting approval is Ring 2A-authoring); it exists + is
  integration-testable against seeded inputs.

**Migration (Commit 3): one** — `create_vendor_rule_atomic` RPC
(`SECURITY DEFINER`, service-role-callable; inserts three rows in one txn). No new
tables.

### Decision 7 — Orchestrator-coordinated `evaluate → gate → recordEvaluation`
*(Brainstorm F; OQ-3a ratified; shape forced by three constraints, verification §7)*

File `apps/web/src/agent/policies/agent-ladder/ruleEvaluationOrchestrator.ts`
(agent layer — must live here because **services ↛ agent**, so a service cannot
call the gate). Function `evaluateAndDispatch(proposal, ctx):
EvaluationDispatchResult`.

Flow:
```
ceilingCheck
  → ruleEvaluationService.evaluate(proposal, ctx)          // MatchResult | EvaluationSkipped
  → gate(matchResult, ruleRegistryRow, limitContext)       // effective_action  (agent layer)
  → ruleEvaluationService.recordEvaluation(matchResult, effective_action, disposition, ctx)  // single append
  → ruleTrackRecordService.recordEvaluation(rule_id, classification, disposition, ctx)        // counter update
```

The shape is **forced**, not chosen: (1) `MatchResult` carries no
`effective_action` (§5.7) → log can't be written at evaluate-time; (2)
INV-RULE-001 append-only → no UPDATE → single append after the gate; (3) ADR-0020
`services ↛ agent` → the service can't call the gate → the orchestrator (agent
layer) coordinates.

**Ownership split (the load-bearing distinction).** The orchestrator owns
*sequencing* — *when* each step fires, and specifically that the append happens
*after* the gate. `ruleEvaluationService.recordEvaluation` owns the *append
operation* — the table write. Keeping these separate is what prevents the append
from migrating back into `evaluate` (Decision 6): the sole-writer property
(`ruleEvaluationService` is the only writer of `rule_evaluation_log`) is orthogonal
to — and does **not** imply — that the service decides *when* to write.

**Transaction boundary (OQ-3a): separate.** The `recordEvaluation` log append is
its own statement; the `ruleTrackRecordService.recordEvaluation` counter update is
a separate mutating call (independently audit-eligible). If the log append
succeeds and the counter update fails, the log is source-of-truth and counters are
reconcilable from the log corpus. Migration: none.

### Decision 8 — Logic Receipt reconciliation prose
*(OQ-3b Path A ratified, `3016b8c2`)*

The spec carries this reconciliation (one paragraph, also surfaced in
Cross-references): **`rule_evaluation_log` (INV-RULE-001) is the concrete
realization of the abstract "Logic Receipt" surface that `rule-type-core.md` §5.7
names.** INV-AGENT-002 was reserved at the spec level before the substrate landed
and **remains reserved** for the broader cross-agent Logic Receipt concern serving
Ring 2A-authoring (a Tier-1 prerequisite). `rule_evaluation_log` is the rule-core-
specific append, not the entirety of the Logic Receipt. The `rule-type-core.md`
§5.7 prose amendment (updating "recorded on the Logic Receipt per INV-AGENT-002")
is **forward-flagged for future doc-hygiene, not this arc**.

### Decision 9 — Route handlers
*(Brainstorm H; OQ-4 confirmed `6214c603`; **Correction 2 folded in**)*

- **List route** `GET /api/orgs/[orgId]/rules/route.ts`. Service-role client;
  `ctx.caller.org_ids.includes(orgId)` + `WHERE org_id = orgId`. Joins
  `rule_registry ⋈ rule_track_records ⋈ rule_evaluation_30d_view`. Response per
  rule: identity, `current_rung` + `lifecycle_state` badges, cumulative counters,
  30-day windowed indicators, and the winning-match timestamp **from
  `rule_track_records.last_winning_match_at`** (per OQ-5 disk finding — no view
  amendment). Sort/filter as query params (`?sort=`, `?rung=`, `?lifecycle=`,
  `?health=`).
- **Four row-action sub-routes** (OQ-4 confirmed: separate sub-routes, not an
  action-param route) under `/api/orgs/[orgId]/rules/[ruleId]/`: `promote/`,
  `demote/`, `rename/`, `retire/` — each `route.ts` following the §1c pattern:
  ```ts
  const { orgId, ruleId } = await params;
  const parsed = RulePromoteInputSchema.parse({ org_id: orgId, rule_id: ruleId, ...json });  // .strict()
  const ctx = await buildServiceContext(req);
  const result = await withInvariants(ruleRegistryService.promote, { action: 'rule.promote' })(parsed, ctx);
  return NextResponse.json(result, { status: 200 });
  ```
  Controller-grade authority: `withInvariants` checks `rule.<verb>` via
  `canUserPerformAction`; RLS `user_is_controller` is the DB backstop.
- **Correction 2 — permissions migration + count-drift discipline (Commit 4,
  atomic).** Add `rule.promote/demote/rename/retire` to `ACTION_NAMES`
  (`services/auth/canUserPerformAction.ts`); a permissions seed migration
  (template `20240140000000_bill_action_permissions.sql`) inserting four
  `permissions` rows + `role_permissions` rows (controller only); CA-27 auto-
  passes; bump CA-28 (`permissionCatalogSeed.test.ts`, ~5 sites: total 30→34,
  controller count, exact-set list) and CA-37 (`crossOrgRlsIsolation.test.ts`
  RLS-surface counts) — **all in the same commit.**

**Migration (Commit 4): one** — `rule.*` permissions seed.

### Decision 10 — `RuleRegistryView` canvas
*(Brainstorm I; **Correction 3 reconciled**)*

Component `apps/web/src/components/canvas/RuleRegistryView.tsx`.

- **List view** — `'use client'` + `useEffect`/`fetch('/api/orgs/${orgId}/rules')`
  (the `OpenBillsView` fetch/loading/error/empty/data idiom) + table with
  `current_rung` & `lifecycle_state` badges, the 30-day indicators,
  `last_winning_match_at`, client- or query-param sort/filter.
- **Row actions** — raw `fetch()` POST to each sub-route, then **refetch the list**
  on success (Correction 3: the rule persists in the registry, so refetch-in-place,
  not navigate-away; no optimistic update). Inline error (`border-red-300
  bg-red-50`); `401` → sign-in redirect; `400 {details}` → field errors.
  - `demote` / `retire` (destructive/irreversible-ish) → inline **amber warning
    banner + red high-friction button** (the `BillReverseCard` pattern), **not a
    confirm modal**.
  - `rename` → inline edit or small form.
  - `promote` → opens the **inert promotion-ceremony modal** (ADR-0024
    "intentionally disabled, not broken") — targets disabled with a visible
    "available post-v1" affordance. This is a ceremony surface, *not* a confirm
    dialog (Correction 3 distinction).
- **Detail surface** — behavior, not logic: track-record breakdown, recent matches
  (from `rule_evaluation_log`), last winning match, lifecycle anchors. **Not**
  Trigger/Condition/Action structure (Stage 2); **not** the Four Questions (Ring
  2A-authoring chat surface).
- **Open placeholders (Decision I):** **OQ-5** UI label (product/UX — "last
  evaluated" uses the 30d view aggregate, any winner-only label reads
  `rule_track_records.last_winning_match_at` directly, zero substrate work);
  **OQ-6** inert-modal copy (product/UX, deferrable to build time).

Migration: none.

### Decision 11 — Test fixtures and integration scope
*(Brainstorm J)*

- **Shared fixtures** — `apps/web/tests/fixtures/rules.ts` (verify co-location vs
  `core/rules/__fixtures__/` against project precedent at authoring). In-memory
  `Rule[]` objects are the source; DB-seeding inserts derive from them. Canonical:
  one **primary-match** rule (`field_equals vendor=Amazon` + `field_in_range
  amount=[0,500]` → categorize 5100); one **guardrail** rule (`field_outside_range`
  Spotify-$1,399, §11.2 → `guardrail_match`); one **almost-match** scenario
  (trigger matches, no branch matches).
- **Pure-core unit tests** (Vitest, in-memory): six predicate evaluators; branch
  first-match; conflict resolution (specificity sum, conservatism, recency, UUID);
  capping (9 rows + tiebreak path).
- **Service integration tests** (admin-client direct seed; RLS-isolation pattern
  from the substrate cycle's `ruleCoreRlsIsolation` /
  `ruleEvaluationLogRlsIsolation`): each of the five services; the
  `create_vendor_rule_atomic` RPC all-or-nothing (incl. rollback-on-child-failure).
- **Route tests** — cross-org RLS isolation + controller-only authorization for
  each of the four row-action routes (controller passes; non-controller and
  cross-org denied).
- **Component tests** — `RuleRegistryView` (jsdom + RTL, per the Phase 8 component-
  test infra precedent; verify against disk at authoring).

---

## 5. Authoring rollout (Decision K → five module-seam commits)

One design spec (Decisions 1–11); authoring lands across five reviewable commits
along clean module boundaries (OQ-7 ratified). Full integration suite runs at each
commit's close (substrate-cycle precedent).

1. **Commit 1 — `shared/rules/` foundations + `core/rules/` pure core.**
   `shared/rules/types.ts` (boundary-crossing evaluation types — Decision 5/OQ-9)
   and `shared/rules/capping.ts` (Decision 3) land **here** — `core` imports both
   (the conflict resolver's step-4b tiebreak calls `cap()`), so they must precede
   `core`. Then `core/rules/`: `types.ts`, `predicates.ts`, `branchEvaluator.ts`,
   `conflictResolver.ts`, `evaluator.ts` + unit tests. *(Deviation from the brief,
   which placed capping in Commit 2: `core` is the first consumer of capping +
   shared types, so they ship in Commit 1.)*
2. **Commit 2 — `agent/policies/agent-ladder/` gate + stubs** + unit tests.
   Imports the already-landed `shared/rules/capping.ts` + `shared/rules/types.ts`.
3. **Commit 3 — `services/rules/` (five services) + `create_vendor_rule_atomic`
   RPC migration** + service integration tests.
4. **Commit 4 — `app/api/orgs/[orgId]/rules/…` list + four row-action routes +
   `rule.*` permissions seed migration** (atomic with `ACTION_NAMES` + CA-28/CA-37
   count bumps) + route RLS tests.
5. **Commit 5 — `components/canvas/RuleRegistryView.tsx`** + component tests +
   inert promotion modal. OQ-5/OQ-6 product/UX resolutions land here (or just
   before).

---

## 6. Non-decisions (explicitly out of scope)

- **No predicate-storage substrate** (Branch/Condition persistence) — future
  Branch-substrate ring / Ring 2B.
- **No temporal or inferential evaluators** (`category_classification_matches`,
  `semantic_match_above_threshold`) — Ring 2B (the registry shape and weight
  constants leave room).
- **No agent conversational-drafting path** — Ring 2A-authoring.
- **No Logic Receipt write path / INV-AGENT-002 registration** — Tier-1
  prerequisite serving Ring 2A-authoring.
- **No `rule-type-core.md` §5.7 prose amendment** — future doc-hygiene (OQ-3b
  Path A forward-flag).
- **No refinement loop** (Ring 3, §9.3).
- **No production wiring of `ruleCreationOrchestrator` or `evaluateAndDispatch`** —
  both exist + are test-only this arc (the hot-path wiring is Ring 2A-authoring /
  pipeline integration).
- **No ADR-0020 ESLint-note doc-sync** (§1f) — forward-flag only.

---

## 7. Consequences

**Enables.** A complete, deterministic, unit-tested rule-evaluation core; an Agent
Ladder gate whose three limit dimensions are inert-but-defined (post-v1 activation
= body replacement); the `services/rules/` layer with single-writer discipline and
INV-RULE-001-respecting append; a controller-governed rule-registry management
surface (list + promote/demote/rename/retire); the Stage 1 canvas. Ring 2A-
authoring inherits a live evaluation path to wire conversational drafting onto.

**Constrains.** The capping table is canon in one place (`shared/rules/capping.ts`)
consumed by two layers — any §6.1-step-3 change is single-source. The forced
`evaluate → gate → recordEvaluation` layering means the orchestrator (agent layer)
is the only legal coordinator; services stay pure of agent dependencies. The
atomic-create RPC is the only all-or-nothing rule-creation path.

**Costs.** Two small migrations (atomicity RPC + permissions seed) — neither a new
domain table. The Permission Catalog count-drift discipline (CA-28/CA-37) adds
mechanical edits to Commit 4. The boundary-crossing types land in
`shared/rules/types.ts` in Commit 1 (Decision 5). Five module-seam commits is more
ceremony than a single drop, but
each is independently reviewable/rollback-able (the F-coupling argued against a
sub-arc split, not against commit seams).

---

## 8. Open questions

- **OQ-5 (product/UX)** — Q-RC-AT-2 indicator label. Data is settled:
  `rule_track_records.last_winning_match_at` gives a winner-only timestamp for zero
  substrate work; "last evaluated" uses the 30d-view aggregate. Only the label is
  open.
- **OQ-6 (product/UX)** — inert promotion-modal copy; deferrable to build time.
*Former OQ-8 and OQ-9 are **resolved to decisions** in V0.2 — both were forced by
constraints, not preferences: OQ-8 → atomic RPC `create_vendor_rule_atomic`
(Decision 6); OQ-9 → `shared/rules/types.ts` (Decision 5, citing the OQ-2
precedent). **No CTO-ratification open questions remain** — ratification confirms
the V0.2 design; it does not resolve open questions. The only open items are the
two product/UX calls above.*

---

## 9. Cross-references

- **ADR-0007** — Tier 1 / system-actor (`created_by` actor-reference standard).
- **ADR-0010** — reserved enums.
- **ADR-0011** — INV-AUDIT-001 (the rule-evaluation append is read-shaped, *not* an
  INV-AUDIT-001 mutation — no paired `audit_log` row; `ai_actions` precedent).
- **ADR-0017** — vendor template substrate (`vendor_rules` origin; class-table-
  inheritance child).
- **ADR-0020** — authority gradient + Appendix A import boundaries (the OQ-2
  refutation; the `services ↛ agent` constraint forcing Decision 7). **Doc-drift
  note:** ratification text says `agent-first-import-boundaries` is `'off'`; live
  config is `'error'` (§1f) — future doc-sync.
- **ADR-0023** — Ring 1 substrate (`rule_registry`, `rule_track_records`,
  `vendor_rules` composite FK; Decision 5 co-creation).
- **ADR-0024** — Ring 2A-core substrate (`rule_evaluation_log`, 30d view,
  INV-RULE-001). **Logic Receipt reconciliation:** see Decision 8.
- **Pre-design chain** — brainstorm `db43fadc`; verification `6214c603`;
  ratifications `3016b8c2`.
- **Spec sections** — `rule-type-core.md` §5.4 (trigger roles), §5.5 (specificity
  ordering), §5.6 (System-ceiling skip), §5.7 (MatchResult), §6.1 (evaluation
  ordering + capping table), §6.3 (reversal defensive guard), §7 (purity contract).

---

*Pre-ratification design spec V0.2 (precision pass over V0.1). Former OQ-8/OQ-9
resolved to decisions; only product/UX OQ-5/OQ-6 remain open. Ratification-ready:
CTO confirms the V0.2 design → ratified ADR-0025. Authoring then proceeds along the
five commit seams (§5).*
