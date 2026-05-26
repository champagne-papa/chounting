# Ring 2A-core Authoring Arc — Pre-ADR Verification Pass

**Date:** 2026-05-26 · **HEAD anchor:** `db43fadc` (== `origin/staging`),
branch `staging`.
**Status:** Verification output (disk/spec-grounding of the brainstorm's seven
open questions). Not committed; not pushed. Input to the Ring 2A-core authoring
design spec.
**Inputs:** the brainstorm (`2026-05-26-ring2a-core-authoring-brainstorm.md` @
`db43fadc`); `docs/02_specs/rule-type-core.md` (the canonical Ring spec — section
home for the `§` references); `docs/07_governance/adr/0020-agent-first-authority-
gradient-source-architecture.md`; `docs/07_governance/adr/0024-ring2a-core.md`;
`supabase/migrations/20240164000000_rule_evaluation_log.sql`;
`docs/02_specs/ledger_truth_model.md` (INV-RULE-001 leaf);
`docs/03_architecture/folder-structure.md`.

This pass grounds the brainstorm's open questions in the order their value falls:
the two disk-resolvable items (OQ-2, OQ-4) first, then the two chat-ratification
items framed (OQ-1, OQ-3), then the three ride-alongs (OQ-5/6/7).

---

## 2. Headline

**OQ-2 flipped the brainstorm's lean — and the flip resolves cleanly.** The
brainstorm assumed `agent → core` import was permitted (its outcome A) so the
capping table could live at `core/rules/capping.ts` and the gate could import it.
Disk says **FORBIDDEN** (outcome B): ADR-0020 Appendix A omits `core/` from
`agent/`'s allow-list, the reciprocal block forbids `core/ → agent/`, and the
`agent-first-import-boundaries` ESLint rule is **live at `'error'`**. The fallback
the brainstorm pre-named is resolved by the same pass: **both** `core/` **and**
`agent/` may import `shared/`, `shared/` already holds pure functions, so
**`shared/rules/capping.ts`** is the legal-and-idiomatic single-source home both
the pure-core tiebreak (§6.1 step 3) and the gate (§6.1 step 7) import.

**OQ-4 confirmed the brainstorm's lean** (separate sub-routes). **OQ-1 and OQ-3
are spec-grounded and framed for chat ratification** — OQ-3's service/gate/log
shape turns out to be **forced** by three independent constraints, not a free
choice. One precision point surfaced that the brainstorm glossed: rule-type-
core.md §5.7 calls the gate-output destination "the Logic Receipt per
INV-AGENT-002" (reserved, **not** registered), but ADR-0024 shipped that
destination as `rule_evaluation_log` / INV-RULE-001 — a terminology reconciliation
the design spec must make.

---

## 3. Pinned sub-decisions carried forward

Two carry-forward sub-decisions from brainstorm-close. Neither blocked this pass.

1. **Decision F sub-decision — `recordEvaluation` home.** Method on
   `ruleEvaluationService` (brainstorm lean; sole-writer at the service level) vs.
   a thin orchestrator helper. The load-bearing part is the single-writer
   constraint; the home is the smaller call. **Settle at design-spec time** once
   OQ-3's overall shape ratifies. Still carried.

2. **Decision E fallback — conditional on OQ-2.** The brainstorm said: "if
   Appendix A forbids agent→core import, the design spec inherits a new decision:
   where does shared-grammar canon (the capping table) live when neither layer can
   host it for both consumers?" **OQ-2 turned negative, so this fallback is
   activated — and resolved in Verification 1** (`shared/rules/capping.ts`). It is
   no longer a carried-forward open decision; it is a design-spec ratification of
   an evidence-backed home.

---

## 4. Verification 1 (OQ-2) — ADR-0020 Appendix A: `agent → core` import

**Question.** Does ADR-0020 Appendix A permit the gate (at
`apps/web/src/agent/policies/agent-ladder/`) to import the pure core's capping
table (at `apps/web/src/core/rules/`)?

**Method.** Read ADR-0020 Appendix A's import-boundary blocks; quote each;
determine the `agent → core` rule; grep `apps/web/src/agent/` for existing `core/`
imports; confirm the ESLint rule's allow-table and severity.

### Outcome: **B — FORBIDDEN** (explicit, bidirectional, lint-enforced).

The six import-boundary blocks (`0020-…-source-architecture.md:872–981`),
relevant rows quoted verbatim:

- **Block 1 — Agent (`:880–895`):** `agent/` *may import* `contracts/`,
  `services/`, `shared/`, `packages/flags`. **`core/` is not in the allow-list.**
- **Block 3 — Core (`:913–926`):** "`core/` may not import: `db/`, `services/`,
  `agent/`, `app/`, contracts that imply transport concerns, React." — the
  reciprocal forbid.

The gradient summary (`:321–340`) frames this as the load-bearing seam: authority
flows *downward* (agent → services/contracts → core → db); no upward imports.

**Enforcement is live, not theoretical:**

- `apps/web/eslint.config.mjs:116–120` registers
  `architecture/agent-first-import-boundaries` at **`"error"`** (not the `'off'`
  ADR-0020 described at its 2026-05-05 ratification — Phase 1 storage activation
  flipped it). *Incidental doc-drift: ADR-0020's ratification note is stale; the
  `'error'` state is the correct/desired one. One-line doc-sync, not a blocker.*
- `eslint-rules/agent-first-import-boundaries.js:70–77`:
  `agent: new Set(['contracts','services','shared'])` — no `'core'`. The rule
  **will** flag a gate→core import.
- **No existing `agent → core` import precedent** (grep of `apps/web/src/agent/`
  for `@/core`, `../core`, `../../core` → zero matches). The boundary is clean.

### Resolution of the activated Decision E fallback: `shared/rules/capping.ts`

The capping table is needed in two layers — the pure core (§6.1 step 3,
tiebreak-only) and the gate (§6.1 step 7, authoritative). With `agent → core`
forbidden, the table cannot live in `core/` and be gate-imported. The fallback
options, against the now-verified boundary rules:

| Option | Legal? | Idiomatic? | Verdict |
|---|---|---|---|
| **(1) `shared/rules/capping.ts`** | **Yes** — both `core/` and `agent/` may import `shared/` (Blocks 1 + 3) | **Yes** — see below | **Evidence-backed lean** |
| (2) Service-mediated (gate calls a service wrapping core's `cap()`) | Yes (`agent → services → core`) | No — heavy async indirection for a pure synchronous table lookup; the pure core's step-3 tiebreak still needs the table directly | Dispreferred |
| (3) Duplicate table in `core/` + `agent/` with an equality test | Yes (no cross-layer import) | No — duplicates canon; drift risk only mitigated, not removed | Dispreferred |

**Why Option 1 is idiomatic, not a stretch:**

- `shared/` is canonically "shared primitives… **imported by every layer**"
  (`folder-structure.md:255–257`).
- `shared/` **already holds pure logic**, not just types:
  `shared/types/tabTitle.ts` (`tabTitleForDirective()`, a pure exhaustive
  switch-map — the closest precedent to a pure `cap()`), `shared/logger/pino.ts`
  (`loggerWith()`), `shared/storage/shellStateStorage.ts` (pure helpers).
- **Both import directions are heavily exercised:** `agent/ → shared/` and
  `services/ → shared/` each show 71+ imports; the core→shared direction is
  permitted by Block 3's "`shared` primitives only." A pure `cap()` + a constant
  table satisfy "primitives" (deterministic, no DB/network/agent/UI).

**Design-spec impact.** Decision E is **revised**: capping table → `shared/rules/`,
not `core/rules/`. The pure core imports it from `shared/`; the gate imports it
from `shared/`. Net: *cleaner* than the brainstorm's original (now-illegal) lean,
and no extra carried decision. Ratify the `shared/` home at design-spec time
(low-controversy given the evidence). The capping table is the §6.1-step-3 9-row
table (quoted under Verification 3); it is application logic and correctly absent
from the DB migration.

---

## 5. Verification 2 (OQ-4) — Mutation-route convention precedent

**Question.** Do existing mutation routes use (a) separate sub-routes per action
or (b) a single route with an `action` body discriminator?

**Method.** Glob/grep `apps/web/src/app/api/` for action-shaped route segments and
for `body.action` discriminators; read existing mutation route files for the
auth + payload convention.

### Outcome: **A — separate sub-routes predominate** (no action-discriminator found).

Evidence (route files found):

- `app/api/agent/confirm/route.ts`, `app/api/agent/reject/route.ts`
- `app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts`
- `app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts`
- `app/api/orgs/[orgId]/bills/[billId]/reverse/route.ts`
- `app/api/orgs/[orgId]/recurring-runs/[runId]/approve/route.ts`
- `app/api/orgs/[orgId]/recurring-runs/[runId]/reject/route.ts`

A grep for `body.action` / `switch (action)` in mutation handlers returned zero
matches. The convention each route follows:

- **Auth:** delegate to `withInvariants(serviceFn, { action: 'resource.verb' })`
  (INV-AUTH-001 — caller identity + org membership + RBAC via
  `canUserPerformAction(action)` before service execution).
- **Payload:** parse a `.strict()` Zod schema built by merging URL params with the
  request body, then pass to the wrapped service with a `ctx` carrying `trace_id`
  + `caller`.

**Design-spec impact.** Decision H lands as the brainstorm leans: four sub-routes
under `/api/orgs/[orgId]/rules/[ruleId]/` — `promote`, `demote`, `rename`,
`retire` — each `withInvariants(ruleRegistryService.<verb>, { action:
'rule.<verb>' })` with a `.strict()` Zod input. Controller-grade authority rides
the existing RBAC check (`user_is_controller` is the DB/RLS backstop). The new
`rule.*` action keys feed the Permission Catalog count (watch the
known-drift-prone count at authoring time).

---

## 6. Verification 3 (OQ-1) — Specificity weight values *(chat ratification)*

**Not disk-grep work; chat-ratification framing.** The values become canon for the
rule core's conflict resolution; a future Ring 2B inherits the tier *ordering* and
assigns its predicate weights consistent with the *scheme* this arc ratifies.

**Spec grounding (verbatim):**

§5.5 (`rule-type-core.md:511–519`) fixes the three-tier ordering and the ownership:

> "Closed-set conditions (`field_equals`, `field_in_set`,
> `category_classification_matches`, `source_trigger_equals`) weight higher than
> range/threshold conditions (`field_in_range`, `field_outside_range`,
> `semantic_match_above_threshold`), which weight higher than pattern-match
> conditions (`field_matches_pattern`). **The exact weight table is owned by
> Ring 2; the ordering is fixed at Ring 0. There is no "if needed" discretion —
> the weight table is total.**"

§6.1 step 4a (`rule-type-core.md:909–912`) fixes the composition rule:

> "**(4a) Most specific predicate wins.** Specificity is the sum of deterministic
> specificity weights for the matched Branch's Conditions (§5.5)."

**v1 condition-type → tier mapping** (the brainstorm's six v1 types; the other two
in §5.5 are Ring 2B):

- Closed-set: `field_equals`, `field_in_set`, `source_trigger_equals`
- Range/threshold: `field_in_range`, `field_outside_range`
- Pattern: `field_matches_pattern`

**Worked example (3/2/1 lean).** Branch X = `field_equals vendor` (closed, 3) +
`field_in_range amount` (range, 2) → specificity 5. Branch Y = `field_equals
vendor` (closed, 3) → specificity 3. X wins. The 3-tier separation holds under
summation for any tier-monotonic assignment.

**Scheme alternatives to ratify (this is a scheme choice as much as a value
choice):**

1. **3/2/1** — minimal-integer-by-tier (brainstorm lean; simplest; satisfies the
   ordering). *Risk:* sums can collide across tier-mixes at high condition counts
   (e.g., three pattern-matches = 3 = one closed-set), though step 4a is a
   tiebreak among already-matched branches, so collisions fall through to 4b
   conservatism → 4c recency → 4d UUID (total order; never stuck).
2. **5/3/1 or 10/5/1** — spaced integers, more headroom against future-tier
   insertion and cross-tier sum collisions.
3. **Named constants** (`SPECIFICITY_CLOSED_SET = 3`, …) — readability over raw
   numerals; orthogonal to (1)/(2) and combinable.

**Lean:** 3/2/1 with named constants, living alongside each predicate evaluator
per Decision A's `Record<ConditionType, { evaluate, specificityWeight }>` shape
(co-located in `shared/`/`core/` with the evaluator registry). **Surfaced, not
forced** — chat ratifies the scheme.

---

## 7. Verification 4 (OQ-3) — F-layering shape *(chat ratification)*

**Not disk-grep work; chat-ratification framing.** The brainstorm's reframe is
**forced by three independent constraints**, verified below — it is not a free
design choice.

**Constraint 1 — MatchResult carries no `effective_action`** (§5.7,
`rule-type-core.md:594–627`):

> "MatchResult does **not** carry a final `effective_action`: that is computed
> downstream by the Agent Ladder gate (§6.1 steps 7–8, §6.1.1) from `current_rung`
> + limits + track-record health…"

→ The log row cannot be written at MatchResult/`evaluate` time; `effective_action`
isn't known yet.

**Constraint 2 — INV-RULE-001 is append-only** (`ledger_truth_model.md:2060–2069`
leaf; `migration:146–158` RLS `USING (false)` on UPDATE/DELETE + no user-path
INSERT):

> "Rows in `rule_evaluation_log` are append-only against the user path: no UPDATE
> and no DELETE through a user-scoped client, and no user-path INSERT."

→ No "write at evaluate, UPDATE after gate" path exists. There is exactly one
append per evaluation, *after* the gate produces `effective_action`.

**Constraint 3 — `services → agent` is forbidden** (ADR-0020 Appendix A,
`:907–911`):

> "`services/` may not import: `agent/`, `app/`, React components."

→ `ruleEvaluationService` (service) cannot call the gate (at `agent/`). The
**orchestrator** (agent layer) coordinates.

**Forced shape (ratify):**

1. `ruleEvaluationService.evaluate(proposal, ctx): MatchResult | EvaluationSkipped`
   — step-1 trigger lookup + input assembly (the service layer's job per §6.1
   step 1, `:868–871`), calls the pure core, returns MatchResult. **No log write.**
2. Orchestrator calls `gate(matchResult, ruleRegistryRow, limitContext):
   effective_action` (at `agent/policies/agent-ladder/`).
3. `ruleEvaluationService.recordEvaluation(matchResult, effectiveAction,
   disposition, ctx): { id }` — the **single append** to `rule_evaluation_log`,
   sole-writer per INV-RULE-001.

Orchestrator flow: `ceilingCheck → evaluate → gate → recordEvaluation`.

**`EvaluationSkipped` is spec-grounded, not inferred** (§5.6 `:563–569`; §6.3
`:1004–1017`): `ruleEvaluationService.evaluate` returns `EvaluationSkipped(reason =
system_ceiling_class)` — e.g. `system_ceiling_reversal` for reversal-class
proposals — as a defensive guard, since ceiling-class proposals are short-circuited
upstream and never normally reach the service.

**The shipped columns ground `recordEvaluation`'s write** (`migration:95–122`):
`rule_evaluation_log` carries `effective_action action_type NULL`, `disposition
text NULL` (CHECK `auto_posted|routed|blocked|pending`), `winning_branch_max_action
action_type NULL`, and `evaluation_trace jsonb NOT NULL`. The nullability confirms
the brainstorm's `almost_match` case: no winner → no gate → append carries
`effective_action = null`, `disposition = null`. The `effective_action` and
`disposition` 30d-view aggregates (`migration:185–195`) confirm the gate output is
the intended log payload.

**Transaction-boundary sub-point (surface; lean separate).** Does
`recordEvaluation`'s log append share a transaction with the downstream
`rule_track_records` counter update (`ruleTrackRecordService.recordEvaluation`)?
**Lean: separate** — the log is read-shaped/append-only; the counter update is the
mutating, independently audit-eligible write; a shared txn couples two
service-writers across the boundary and complicates error semantics. *Alternative:*
shared txn buys "evaluation-happened ⇔ counters-updated" atomicity at that coupling
cost. Chat decides.

**Precision point to flag — "Logic Receipt" vs `rule_evaluation_log`.** §5.7 prose
says `winning_branch_max_action` and `evaluation_trace` are "recorded on the Logic
Receipt per INV-AGENT-002" — and notes INV-AGENT-002 is **reserved-but-not-yet-
registered**. But ADR-0024 shipped a table (`rule_evaluation_log`, INV-RULE-001)
carrying exactly those fields plus `effective_action` + `disposition`. So either
`rule_evaluation_log` **is** the concrete realization the spec abstractly called
"the Logic Receipt," or there are two intended write targets. **Practical answer
for authoring:** `recordEvaluation` writes to `rule_evaluation_log` (the shipped
table). **The design spec should make a one-line reconciliation** (and possibly a
rule-type-core.md §5.7 note) so authoring writes to one unambiguous target and the
INV-AGENT-002/INV-RULE-001 relationship is explicit.

**Pin carried:** `recordEvaluation` as a method on `ruleEvaluationService` vs. a
thin orchestrator helper — design-spec-time call (sole-writer is the load-bearing
constraint, satisfied either way).

---

## 8. Verifications 5–7 (OQ-5 / OQ-6 / OQ-7) — ride-along

**OQ-5 — Q-RC-AT-2 indicator UI label (product/UX).** Candidates carried from
ADR-0024: `last fired` / `last selected` / `last won` / `last decisive match`.
**Data-shape finding on disk — the winner-only timestamp is already provisioned.**
The 30d view exposes `max(created_at) AS last_evaluated_at`
(`20240164000000_rule_evaluation_log.sql:196`) — last evaluation of *any*
classification (incl. `almost_match`), **not** a winning-match timestamp. But the
Ring 1 substrate already carries the winner-only column the brainstorm assumed:
`rule_track_records.last_winning_match_at timestamptz`
(`20240163000000_rule_type_core_substrate.sql:220`), annotated **`-- Q-RC-AT-2
(stored)`** (ADR-0023 Decision 2) — the same indicator OQ-5 labels — and it is
canvas-readable through the table's `user_has_org_access` SELECT policy ("canvas
reads counters", `:227`). Three label/source combinations:

1. **"Last evaluated"** → existing `rule_evaluation_30d_view.last_evaluated_at`;
   no change. (All-classification semantics.)
2. **Winner-only label** (`last won` / `last fired` / `last decisive match`) →
   read `rule_track_records.last_winning_match_at` **directly** — already
   provisioned for Q-RC-AT-2, canvas-readable, **zero substrate work.** This is the
   substrate-intended source.
3. Winner-only via a 30d-view filtered aggregate (`… FILTER (WHERE
   match_classification IN ('primary_match','guardrail_match'))`) → a follow-up
   migration; **redundant** given (2) already exists.

So the data-shape question is effectively *closed by existing substrate*: a
winner-only label costs nothing (path 2). Only the **label** is genuinely open —
route to product/UX, surfacing that a winning-match timestamp is free.

**OQ-6 — inert promotion-modal copy (product/UX).** Shape settled by ADR-0024
("intentionally disabled, not broken"); the copy ("promotion available post-v1")
is product/UX's call. No verification work.

**OQ-7 — Decision K scoping.** Brainstorm lean: **one design spec (Decisions A–J
coherent) + multi-commit authoring along five module seams** (`core/rules/` →
`agent/policies/agent-ladder/` → `services/rules/` → `app/api/.../rules/` →
`components/canvas/RuleRegistryView.tsx`). The F-layering finding (core ↔ gate ↔
service ↔ log coupling, confirmed forced in Verification 4) argues *against* a
sub-arc split — splitting the spec would fragment coupled decisions. Lean stands;
confirm at design-spec onset.

---

## 9. Net impact on the design spec

| OQ | Net impact |
|---|---|
| **OQ-1** | Design spec assigns the specificity weight table within §5.5's fixed ordering. Lean 3/2/1 + named constants, co-located with the predicate-evaluator registry. **Chat ratifies the scheme.** |
| **OQ-2** | **Decision E revised:** capping table → `shared/rules/capping.ts` (legal + idiomatic; both core and gate import `shared/`), **not** `core/rules/capping.ts`. Fallback resolved — no extra carried decision. Incidental: ADR-0020 ESLint-severity note is stale (`'off'` → actually `'error'`); flag for doc-sync. |
| **OQ-3** | F-layering ratified as **forced** by three constraints (no `effective_action` on MatchResult; INV-RULE-001 append-only; `services ↛ agent`). `recordEvaluation` writes `effective_action`+`disposition`+`evaluation_trace` to `rule_evaluation_log`. Txn-boundary lean: separate. **Reconcile "Logic Receipt"/INV-AGENT-002 vs `rule_evaluation_log`/INV-RULE-001** terminology in the spec. `recordEvaluation` home pinned to design-spec. |
| **OQ-4** | **Decision H lands as leaned:** four separate sub-routes under `/[ruleId]/`, each `withInvariants(..., { action: 'rule.<verb>' })` + `.strict()` Zod. New `rule.*` permission keys. |
| **OQ-5** | Data-shape closed by existing substrate: `rule_track_records.last_winning_match_at` (ADR-0023 Decision 2, annotated Q-RC-AT-2, canvas-readable) gives a winner-only timestamp for **zero** substrate work. Only the **label** is open — product/UX routing, no view amendment needed. |
| **OQ-6** | Product/UX copy routing; shape settled. |
| **OQ-7** | Confirm one-design-spec + multi-commit; F-coupling supports it. |

---

## 10. Remaining open items before the design spec opens

**Chat ratifications (the two that most shape the spec):**

- **OQ-1** — specificity weight *scheme* + values (lean 3/2/1 + named constants).
- **OQ-3** — (a) log↔counter transaction boundary (lean separate); (b) the
  "Logic Receipt" / INV-AGENT-002 vs `rule_evaluation_log` / INV-RULE-001
  terminology reconciliation; (c) `recordEvaluation` home (service method, lean).

**Product/UX routing (parallel; non-blocking for the core/services/gate seams):**

- **OQ-5** — indicator label only; the winner-only timestamp is already
  provisioned (`rule_track_records.last_winning_match_at`, path 2), so a winning-
  match label costs nothing. Surface that to product/UX.
- **OQ-6** — inert promotion-modal copy.

**Confirm:**

- **OQ-7** — one-design-spec + multi-commit structure (lean stands).

**Incidental (not blocking; future doc-sync):**

- ADR-0020's ratification note says `agent-first-import-boundaries` registers at
  `'off'`; the live config is `'error'` (correct). One-line doc-sync to ADR-0020
  or its CURRENT_STATE deferral note.

---

*Verification pass. Not committed; not pushed. Next: chat-ratify OQ-1 + OQ-3,
route OQ-5/6 to product/UX, then open the Ring 2A-core authoring design spec
(Decisions A–J coherent; Decision E now lands `shared/rules/capping.ts`).*
