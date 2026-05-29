---
id: "0026"
title: "Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring"
status: ratified
date: "2026-05-29"
deciders: [phil]
modules: [agent, app-components, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0011", "0012", "0020", "0023", "0024", "0025"]
invariants: []
---

# ADR-0026: Ring 2A-authoring — Conversational rule-drafting, Four-Questions card, approval, create-path wiring

## Status

Ratified 2026-05-29 by phil per the Ring 2A-authoring design spec
(`docs/09_briefs/post-mvp/specs/2026-05-29-adr-0026-ring2a-authoring-design.md`,
V0.1 at `c85eb7c6`) and the CTO chat-ratification of that design spec on
2026-05-29.

**Amended 2026-05-29** (Ring 2A-authoring implementation arc, commit-(b)
HEAD-pass) — two ratification-time substrate errors, caught at the implementation
layer's HEAD-pass and corrected below (the original ratified claims are preserved
in this note for provenance):

1. **Decision 5 mechanics.** The ratified text framed approval as "a narrow UPDATE
   … deriving `lifecycle_state='active'` (migration `20240163:271`)." That is
   wrong: migration `:271`'s `CASE WHEN approved_at IS NOT NULL` is a **backfill-time**
   initial-value computation (step d), not a runtime derivation; `rule_registry.
   lifecycle_state` is a plain stored `NOT NULL` column set explicitly by writers
   (cf. `ruleRegistryService.promote`), with no generated column or sync trigger.
   Because `ruleEvaluationService.evaluate` filters candidates on
   `lifecycle_state='active'`, approval must **explicitly set
   `rule_registry.lifecycle_state='active'`** (functional activation) in addition
   to `vendor_rules.approved_at`/`approved_by` (provenance). Approve is therefore a
   **two-table atomic write** via a new `approve_vendor_rule_atomic` RPC — the
   transition-sibling of the shipped `create_vendor_rule_atomic` (which creates the
   rows in `'proposed'` state). Decision 5 and the Context bullet are corrected.

2. **Migration outline.** "No migration" is wrong. **Two** function/seed-only
   migrations are required (neither changes a table shape → no `types.ts` regen):
   `20240167` seeds the `rule.create` permission (the create/approve POST authorizes
   via `withInvariants({ action: 'rule.create' })`, absent from `ACTION_NAMES`/
   permissions; CA-27 set-equality parity enforced; controller-only grant mirroring
   `20240166`), and `20240168_approve_vendor_rule_atomic_rpc` (function-only;
   mirrors `create_vendor_rule_atomic`'s `SECURITY DEFINER` + `service_role` grant,
   and inherits its DEFINER-vs-INVOKER hygiene forward-flag).

Both errors share the late-emerging-substrate shape: the design-spec + ratification
frames focused on the consumer/writer surfaces; the substrate one layer below
(route-authz permission catalog; `lifecycle_state` storage mechanics + two-table
consistency) was invisible until the implementation HEAD-pass reached it. Per the
ADR-before-code discipline, this amendment lands before the code that depends on it.

This ADR is **consumer wiring plus net-new service writers** against
already-ratified substrate. It does **not** amend or supersede any prior ADR:
Ring 2A-core's substrate (ADR-0024) and implementation seams (ADR-0025), and the
Rule Type Core substrate (ADR-0023), are ratified canon and are consumed here,
not relitigated. The `related` set records the ADRs Ring 2A-authoring reads from;
none is amended. INV-AGENT-002 (the Logic Receipt write path) is **not** established
here — it remains reserved per the Non-decisions, deferred to rung activation.

## Date

2026-05-29

## Triggered by

Ring 2A-core ratified at ADR-0024 (`b5a2ced4`): the pure-core evaluator, the Agent
Ladder gate, the Stage 1 `RuleRegistryView` canvas, `ruleCreationOrchestrator`
(shipped with zero production callers by design), and the `rule_evaluation_log`
substrate are green at HEAD. Per the ADR-0024 **H-split**, Ring 2A-authoring is the
separate later arc that wires the *consumer* surface: conversational rule-drafting
→ approval → create-path.

The Ring 2A-authoring design arc, on `origin/staging`: brainstorm (`46fe7dcf`,
leans) → pre-ADR verification (`61945a01`, corrections; supersedes the brainstorm
on conflict) → design spec V0.1 (`c85eb7c6`, decisions). This ADR is authored from
the cleared design spec per the ADR-0021 §4 pre-ratification lifecycle, as the
opening commit of the Ring 2A-authoring implementation arc.

## Context

Per the CTO-settled **H-split** and the **(δ.1)** opening adjudication, this ADR
covers Ring 2A-authoring **v1 = rule-creation only**: conversational-drafting +
Four-Questions card + approval + create-path through `ruleCreationOrchestrator`,
entirely against ratified substrate. Three load-bearing corrections from the
design arc's verification + design-spec HEAD-pass shape the decisions:

- **(δ.1) — INV-AGENT-002 is not a v1 prerequisite.** INV-AGENT-002 (the Logic
  Receipt write path) is scoped to **autonomous-agent ledger auto-posts**
  (`agent_autonomy_model.md §10` — "Every auto-post produces a Logic Receipt …
  written as part of the auto-post service call"), **not** to rule creation (a
  governance action). The Four Questions render from `ProposedMutation` content
  fields, not the Logic Receipt write path. So INV-AGENT-002 / auto-post execution
  defer to **rung activation** (a separate later arc), not this one. (ADR-0024's
  prose names the chat-card "Logic Receipt dependency"; the deeper canon scopes
  that dependency to the *content* a proposal carries, which is ratified, not the
  reserved write path.)

- **Gating call (V1) HOLDS — v1 vendor rules are branchless.** Closed-grammar
  Conditions/Branches are reserved for Ring 2B: `rule-type-core.md:406` ("in v1,
  only `primary` and `otherwise_if` branches are valid"), `:408` (a Trigger firing
  with no matching Branch yields `almost_match`), `:262` (predicate JSON schema
  "reserved for Ring 2"). `vendor_rules` stores no condition column; a v1 vendor
  rule is `(vendor_id, bundle_type, default_account_id)`-keyed. v1 rule-creation is
  therefore NL → `(vendor, bundle_type, default_account)` extraction, **not**
  predicate-grammar mapping.

- **Late-emerging substrate requirement — the approval-ceremony writer.** The
  design-spec HEAD-pass surfaced that `rule_lifecycle_state = {proposed, active,
  demoted, retired}` (no `rejected` state), and that `proposed → active` is **not**
  `promote()` (rung ascension, inert at v1) — it is the approval ceremony.
  *(Corrected per the 2026-05-29 amendment: `lifecycle_state` is a stored column
  set explicitly, not derived from `approved_at` — migration `:271` is a
  backfill-time one-shot. So the approval ceremony is a **two-table atomic write** —
  `vendor_rules.approved_at`/`approved_by` (provenance) **+** `rule_registry.
  lifecycle_state='active'` (the functional gate `evaluate` filters on) — via a new
  `approve_vendor_rule_atomic` RPC, the transition-sibling of `create_vendor_rule_atomic`.)*
  No shipped service writes `approved_at`; this arc authors the RPC + its wrapper
  (`createVendorRule` untouched per T4).

**v1-inertness, honestly named.** A created v1 vendor rule is near-inert at
runtime: branchless, it produces `almost_match` → default approval, and accrues no
*winning* track record until Ring 2B branches + rung activation land. The v1
deliverable is the conversational-drafting/approval UX + intent-recording +
registry-population. Unlike Ring 2A-core's promotion modal + gate components
(which ship inert and get zero v1 user contact), this surface **is exercised at
v1** against real controller utterances — substrate-validated-through-use, not
scaffold-and-wait.

**Modules taxonomy note (forward-flag).** The frontmatter uses `[agent,
app-components, db]`; `adr:lint` rejected an initial `[agent, ui, api]` projection
(`ui` is `packages/ui/` primitives, not `apps/web/src/components/`; `api` is not a
token). But the lint vocabulary (`docs/02_specs/taxonomy.md` Modules) and the
substrate this arc touches don't fully overlap: `services/rules/` (Decision 5's
`vendorRuleService.approve`) and `app/api/orgs/[orgId]/rules/` (Decision 7's route
handler) lack dedicated tokens. ADR-0025 flagged the parallel gap for `shared/` +
`app-components/` (the latter has since been added; the gap narrowed) — this is the
second time the gap has bitten this lineage. The work is fully described in
Decisions 5 and 7; only the frontmatter taxonomy can't represent it. Flagged, not
fixed here — a vocabulary change is governance work for its own pass, not a rider
on a ratification commit.

## Decision

### 1. Agent conversational-drafting entry point: a new `draftVendorRule` tool

A new `draftVendorRuleTool` is registered via `defineTool()` (with
`gatedByDispatcherSet: true` — it is org-scoped) and added to the `controller`
persona case in `toolsForPersona.ts`; it dispatches inline in `executeTool`,
mirroring the shipped `postJournalEntry(dry_run)` → `respondToUser(canvas_directive)`
flow. Input schema (Zod `.strict()`): the controller's drafting intent —
`vendor_text`, `bundle_type_hint`, `account_hint`. Output: a `ProposedRuleCard`
emitted via `respondToUser` canvas_directive, with org/trace IDs post-filled by the
orchestrator.

*Alternatives rejected:* embedding rule-drafting in an existing tool (overloads a
ledger tool with governance semantics); a structured form outside chat (abandons the
conversational-drafting premise); "mirror `proposalBuilder`" (it is a
document-pipeline Stage-7 function, not a chat-drafting API).

### 2. Persona prompt-scaffolding for reliable tool emission

The controller-persona system prompt is extended with scaffolding that conditions
the model to emit `draftVendorRule` when a controller expresses a recurring-coding
intent ("always code Spotify to subscriptions"). The tool input-schema is the closed
boundary; reliable emission depends on the persona prompt. The scaffolding names the
trigger pattern (vendor + recurring intent + target account) and the disambiguation
expectation (vendor must resolve — Decision 6).

### 3. `ProposedRuleCard`: the Four-Questions grammar with a creation-time population

A new `components/ProposedRuleCard.tsx` reuses the Four-Questions **grammar +
next-intl mechanism** of `ProposedEntryCard`, but renders a **creation-time
population** derived from the drafted rule + the controller utterance — explicitly
**not** from `MatchResult` (no match exists at creation) and **not** from
`policy_outcome` (the entry-confirmation path). The render-path framing is
deliberately distinguished — three exist on disk (`intent_model.md` §6
`justification.*`; shipped `policy_outcome` templating; `rule-type-core.md §6.4`
`MatchResult.four_questions_population`, the rule-aware *match-time* path), and the
creation-time `ProposedRuleCard` population is a fourth, distinct surface. The four
answers:

- **Q1 What changed?** The rule to be created: vendor + `bundle_type` + "code to
  {account}" + "initial rung: Always Confirm."
- **Q2 Why?** The controller's utterance, generalized.
- **Q3 Track record?** "New rule — no track record yet" (Decision 4 template).
- **Q4 What if I reject?** "The rule will not be created; edit and resubmit, or
  discard."

*Alternatives rejected:* overloading `ProposedEntryCard` (a rule proposal has no
debit/credit lines, a different action set); grounding on `MatchResult` /
`policy_outcome` (neither exists at creation).

### 4. Creation-specific next-intl templates

New `proposed_rule.*` template IDs are added to `messages/{en,fr-CA,zh-Hant}.json`
and Zod-validated in `validTemplateIds.ts`: `proposed_rule.what_changed.vendor_rule`
(Q1; params vendor, bundle_type, account), `proposed_rule.why.from_utterance` (Q2;
utterance summary), `proposed_rule.track_record.new_rule` (Q3), and
`proposed_rule.if_rejected.standard` (Q4). The match-time `track_record.no_rule`
template ("no rule applies to this transaction") is **not** overloaded — it is a
semantically distinct proposition from "this newly-created rule has no track record."

### 5. Approval flow, the approval-ceremony write path, and resolution source

The `ProposedRuleCard` carries Approve / Reject / Edit actions (the shipped
`ProposedEntryCard` action pattern). The flow:

- **Draft is ephemeral.** `draftVendorRule` emits the card without persisting a rule;
  nothing in `rule_registry` exists until approval.
- **Approve = create + approval ceremony.** On approve, the route handler (Decision 7)
  orchestrates `ruleCreationOrchestrator.createVendorRule` (persisting the rows in
  `'proposed'` state), then **the approval ceremony atomically sets
  `vendor_rules.approved_at`/`approved_by` (provenance) and
  `rule_registry.lifecycle_state='active'` (the functional activation gate
  `ruleEvaluationService.evaluate` filters candidates on)**. Both writes are one
  transaction — an orphaned half-approve (provenance set but `lifecycle_state` still
  `'proposed'`, or vice versa) is an inconsistent state — so this arc authors a new
  **`approve_vendor_rule_atomic` RPC** (the transition-sibling of the shipped
  `create_vendor_rule_atomic`, which writes the same two tables at creation in
  `'proposed'` state), with `vendorRuleService.approve` as a thin wrapper over it
  (mirroring how `createVendorRule` wraps its RPC), idempotent on the
  `approved_at IS NULL` precondition. `lifecycle_state` is **not** derived from
  `approved_at` (it is a stored column; migration `:271` is backfill-time only —
  see the 2026-05-29 amendment). `createVendorRule` is **not** modified (T4).
- **Reject is ephemeral.** There is no `rejected` lifecycle state, and (because draft
  is ephemeral) no persisted rule to mark. Reject resolution is chat-turn-local.
- **Edit = re-draft → new card.** Edit produces a new card cycle (the shipped
  `/api/agent/reject` + `outcome:'edited'` re-prompt pattern), not in-place amendment.
- **Resolution source.** For approve, the created rule's existence + `lifecycle_state`
  (`active`) is the durable resolution record; the chat turn carries a
  creation-specific resolution marker. This does **not** reuse `card_resolution`
  (which is `ai_actions.status`-derived and does not apply to rule creation).

*Alternatives rejected:* deriving resolution from `card_resolution`/`ai_actions`
(rule creation does not touch `ai_actions`); using `promote()` for activation (rung
ascension, inert at v1, semantically wrong — promotion changes authority, not
approval status); persisting the draft as `'proposed'` before approval (orphans
rejected drafts with no `rejected` state to retire them to).

### 6. Vendor resolution as a blocking pre-condition

`draftVendorRule` resolves `vendor_id` via `vendorService.matchVendor` **before**
emitting the `ProposedRuleCard`. Because `createVendorRule` requires a non-null
`vendor_id` (dedup + FK key) — stricter than the document pipeline, which tolerates a
null vendor — resolution must succeed before the card is approvable: a confident
single match resolves directly; ambiguous matches surface `candidate_alternatives`
(≤3) for controller selection; a not-found vendor degrades to a `respondToUser`
clarification turn. No `ProposedRuleCard` is emitted with an unresolved vendor.

### 7. Create-path wiring + API route handler

A new route handler `POST /api/orgs/[orgId]/rules` wraps the create-path per the
service-layer discipline: `withInvariants(serviceFn)(input, ctx)`, `trace_id`
threaded, idempotency-first. The handler orchestrates the Decision-5 two-step (create
`'proposed'` → approval-ceremony write → `'active'`). Error handling catches
`ServiceError`: `RULE_CREATE_FAILED` → surface retry; `PERMISSION_DENIED` /
`ORG_ACCESS_DENIED` → controller-authority message (rule creation is controller-only
per `rule_registry` CUD RLS = `user_is_controller`). The route slots into the
`app/api/orgs/[orgId]/rules/` convention ADR-0025 §9 established (GET list + four
row-action routes under `/[ruleId]/`).

### 8. Post-approval navigation

On approve, the UI navigates to `RuleRegistryView` (the canvas view Ring 2A-core
shipped) so the controller sees the now-created rule, mirroring the shipped
`onNavigate(...)` pattern in `ProposedEntryCard`.

## Migration outline

**Two migrations** (both function/seed-only — neither changes a table shape, so no
`types.ts` regen; corrected from the ratified "No migration" per the 2026-05-29
amendment):

- **`20240167` — `rule.create` permission seed.** The create/approve POST (Decision 7)
  authorizes via `withInvariants({ action: 'rule.create' })`; `rule.create` is absent
  from `ACTION_NAMES` + the permissions catalog (the four seeded `rule.*` permissions
  are promote/demote/rename/retire, migration `20240166`). Seeds the permission
  (`'Rules'` category) + a controller-only `role_permissions` grant (rule governance
  is controller authority, ADR-0025 Decision 9), and adds `'rule.create'` to
  `ACTION_NAMES` in the same atomic commit (CA-27 set-equality parity; mirrors
  `20240166`'s inline-seed pattern). `rule.approve` is **not** seeded — the POST
  authorizes as a single `rule.create` action; the approval ceremony is internal to
  it (a separate `rule.approve` permission is carry-forward if an independent
  approve-existing-proposed-rule surface ever materializes — not v1, draft is ephemeral).
- **`20240168` — `approve_vendor_rule_atomic` RPC** (Decision 5). Function-only; the
  `vendor_rules.approved_at`/`approved_by` + `rule_registry.lifecycle_state` columns
  already exist (migration `20240163`). Atomically updates both tables; mirrors
  `create_vendor_rule_atomic`'s `SECURITY DEFINER` + `GRANT EXECUTE … TO service_role`
  shape, and inherits its DEFINER-vs-INVOKER hygiene forward-flag.

## Non-decisions

This ADR explicitly does **not**:

- Author the Logic Receipt write path / register INV-AGENT-002 — serves the
  rung-activation arc.
- Author auto-post execution under approved rules — Ring 2B + rung activation (no
  auto-posts fire at v1).
- Author closed-grammar Condition / Trigger / Action authoring — Ring 2B (gating
  call V1).
- Author the structured rule-edit form — Stage 2 (v1 edit is re-draft, Decision 5).
- Modify Ring 2A-core substrate, including `ruleCreationOrchestrator.createVendorRule`
  (T4 ratified-contract-scope).
- Add reserved enums or new ratified contracts.

## Consequences

**Enables.** Controllers draft vendor-coding rules conversationally; the
Four-Questions card renders the proposed rule; approval creates + activates the rule
(via the approval-ceremony write); `RuleRegistryView` populates with real,
operator-visible rules. The drafting + approval UX is exercised against real
utterances at v1.

**Constrains / costs.**

- **v1-inertness (honest).** A created v1 vendor rule is near-inert at runtime —
  branchless, producing `almost_match` → default approval, with no autonomous action
  and no winning track record until Ring 2B. The v1 value is the
  substrate-validated-through-use drafting UX + intent-recording + registry-
  population, consistent with the substrate-only-v1 posture.
- **One new service operation.** The approval-ceremony writer (`approved_at`/`by`)
  did not exist on disk; this arc authors it. Modest, but beyond pure wiring.
- **Spec-vs-code render-path divergence carried, not reconciled.** The
  three-framing (four, counting the creation-time population) render-path divergence
  is named and deferred to the Logic Receipt write path arc (T4); this ADR does not
  reconcile it.

## Open questions

1. **Persona prompt-scaffolding mechanics** (Decision 2 implementation detail).
2. **`default_account_id`'s v1 runtime role** — surfaced as a suggestion at the
   branchless `almost_match` default-approval path, or purely recorded for Ring 2B?
   Bears on the Q1 render; tied to whether the evaluator filters candidates on
   `lifecycle_state='active'`. To resolve when Decision 5's activation semantics land.
3. **Ambiguous/not-found vendor disambiguation UX** (Decision 6 detail).
4. **Card placement** — inline in the transcript (strong shipped precedent,
   `AgentChatPanel.tsx:1022`) vs canvas panel. Lean: inline.
5. **Multi-rule drafting** — one utterance → one proposal (shipped one-card-per-turn
   pattern) vs multiple. Lean: one-at-a-time for v1.

## Cross-references

- ADR-0023 (`0023-rule-type-core-substrate.md`) — the substrate this arc consumes
  (`vendor_rules`, `rule_registry`, enums, `approved_at`/`by`).
- ADR-0024 (`0024-ring2a-core.md`) — parent H-split; names Ring 2A-authoring's scope.
- ADR-0025 (`0025-ring2a-core-implementation-seams.md`) — Ring 2A-core seams; the
  org-scoped rule route convention (§9); the Logic Receipt / INV-AGENT-002 reservation
  (Decision 8).
- ADR-0007 §Tier 1 / Q30 — Logic Receipt ownership (INV-AGENT-002, reserved);
  `ProposalJustificationSchema`.
- ADR-0020 — Authority Gradient source-tree homes (`agent/`, `services/`, route
  handlers) + `services ↛ agent` boundary.
- ADR-0011 §1 / ADR-0012 — proposal / bundle primitives (render-path divergence
  context).
- `intent_model.md` §Four Questions Grammar (canonical), §Logic Receipts (Rule 2
  templating; `audit_log.before_state` storage).
- `rule-type-core.md` §5.2 (branches; v1 branchless), §5.7 (MatchResult;
  `almost_match`), §6.4 (match-time `four_questions_population`).
- `agent_autonomy_model.md` §10 (INV-AGENT-002 reserved; auto-post scope), §Agent
  Ladder (rung activation), §Authority Gradient.
- Brainstorm `46fe7dcf`; pre-ADR verification `61945a01`; design spec `c85eb7c6`.
