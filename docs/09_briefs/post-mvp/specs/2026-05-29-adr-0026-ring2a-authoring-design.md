# ADR-0026 (design spec) — Ring 2A-authoring: conversational rule-drafting, Four-Questions card, approval, create-path wiring

**RATIFIED:** _pending CTO ratification; this file is the pre-ratification design spec per ADR-0021 §4. The ratified record will live at `docs/07_governance/adr/0026-ring2a-authoring.md`._
**Status:** Pre-ratification design spec (committed for arc discipline; not yet ratified). **Decision-bearing** — decisions are made here, not opened. Where the brainstorm and pre-ADR verification diverge, the verification wins; where this spec's targeted HEAD-pass diverges from either, this spec wins.
**Date:** 2026-05-29 · **HEAD anchor:** `61945a01`, branch `staging`. · **Revision:** V0.1.
**Inputs:** brainstorm (`46fe7dcf`, leans), pre-ADR verification (`61945a01`, corrections — supersedes the brainstorm on conflict), ADR-0024 (parent H-split), ADR-0025 (Ring 2A-core seams), ADR-0007 §Tier 1 / Q30, ADR-0023 (rule-type-core substrate), `intent_model.md` (§Four Questions Grammar, §Logic Receipts), `rule-type-core.md` (§5.2, §5.7, §6.4), `agent_autonomy_model.md` (§Agent Ladder, §Authority Gradient).

---

## Empirical HEAD pass (targeted re-check)

The brainstorm + pre-ADR verification ran the deep disk-grep. This pass re-verifies only the shapes the load-bearing decisions depend on, and catches last-mile drift between the verification and design-spec authoring. **One load-bearing correction surfaced (lifecycle), beyond what the verification carried.**

- **`postJournalEntry` mirror-target (Decision 1).** The shipped chat-drafting flow: model calls a tool with `dry_run=true` → orchestrator mints `idempotency_key` + Zod-validates → `executeTool` runs it → model emits `respondToUser` with a `canvas_directive` carrying the card; orchestrator post-fills card IDs (`orchestrator/index.ts:134, 867`). `draftVendorRule` mirrors this shape.
- **`defineTool` contract (Decision 1).** `BaseToolDef = { name, description, input_schema, zodSchema, gatedByDispatcherSet }` (`agent/tools/types.ts:24–34`); `gatedByDispatcherSet` is a required boolean (S30 hard constraint). `controller` persona exposes all tools (`toolsForPersona.ts:37–52`).
- **`ProposedEntryCard` Four-Questions grammar (Decision 3).** Unchanged at `components/ProposedEntryCard.tsx:188–219`; renders from `policy_outcome` + `matched_rule_label` (entry-confirmation path). `ProposedRuleCard` mirrors the *grammar + next-intl mechanism*, not the data source (per verification V2).
- **`vendorService.matchVendor` (Decision 6).** Returns `{ vendor_id: string | null, confidence, match_type, candidate_alternatives[≤3] }`; not-found/ambiguous → `vendor_id: null` (`vendorService.ts:122–311`). Confirmed.
- **`rule_lifecycle_state` + the activation path (Decision 5) — CORRECTION.** The enum is `{ proposed, active, demoted, retired }` (`20240163:92–97`) — **there is no `rejected` state.** And the `proposed → active` transition is **not** `promote()` (which is rung ascension, inert at v1): migration `:271` derives `'active'` from `vendor_rules.approved_at IS NOT NULL`, and `:306` keeps `approved_at`/`approved_by` for "the vendor-template approval ceremony." `ruleCreationOrchestrator` creates `'proposed'` (`approved_at` null); **no shipped service writes `approved_at`** (`vendorRuleService` is read-only; `ruleRegistryService` only promote/demote/rename/retire). So the sub-prompt's Decision 5 framing ("proposed → active on approve; rejected on reject") is corrected: **the approve path is the approval-ceremony write (`approved_at`), which this arc must author; the reject path has no lifecycle state (ephemeral).**

---

## Planned ADR-0026 frontmatter (finalized at ratification)

```yaml
id: "0026"
title: "Ring 2A-authoring — conversational rule-drafting, Four-Questions card, approval, create-path wiring"
status: ratified            # set at ratification; chounting has no `proposed` status (ADR-0021)
date: "<ratification-date>"
deciders: [phil]
modules: [agent, ui, api]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0011", "0012", "0020", "0023", "0024", "0025"]
invariants: []              # INV-AGENT-002 is NOT established here (Decision F carry-forward).
                            # Whether a creation-path INV is registered is a Decision-9 / ratification call.
```

---

## Context

Ring 2A-core is ratified and green at HEAD `61945a01` (atop `b5a2ced4`): the pure-core evaluator, the Agent Ladder gate, the Stage 1 `RuleRegistryView` canvas, `ruleCreationOrchestrator` (zero production callers by design), and the `rule_evaluation_log` substrate. Per the ADR-0024 **H-split**, Ring 2A-authoring is the separate later arc that wires the *consumer* surface: conversational rule-drafting → approval → create-path.

The pre-ADR verification resolved the gating call: **v1 vendor rules are branchless** — `(vendor_id, bundle_type, default_account_id)`-keyed, no closed-grammar Conditions (those are reserved for Ring 2B; `rule-type-core.md:262, 406–408`). The operator confirmed **ship-v1-now** sequencing. The v1 runtime effect is honestly near-inert (a branchless rule produces `almost_match` → default approval; accrues no winning track record until Ring 2B), but the drafting + approval UX **is exercised at v1** against real controller utterances — substrate-validated-through-use, not scaffold-and-wait. The v1 deliverable is the conversational-drafting/approval UX + intent-recording + registry-population.

---

## Decision 1 — Agent conversational-drafting entry point: a new `draftVendorRule` tool

A new `draftVendorRuleTool` is registered via `defineTool()` (with `gatedByDispatcherSet: true` — it is org-scoped) and added to the `controller` persona case in `toolsForPersona.ts`; it dispatches inline in `executeTool`, mirroring the shipped `postJournalEntry(dry_run)` → `respondToUser(canvas_directive)` flow. Input schema (Zod `.strict()`): the controller's drafting intent — `vendor_text` (utterance vendor reference), `bundle_type_hint`, `account_hint`. Output: a `ProposedRuleCard` emitted via `respondToUser` canvas_directive, with org/trace IDs post-filled by the orchestrator.

**Alternatives rejected.** Embedding rule-drafting in an existing tool (overloads a ledger tool with governance semantics); a dedicated structured form outside chat (abandons the conversational-drafting premise of ADR-0024). The brainstorm's "mirror `proposalBuilder`" is rejected per verification: `proposalBuilder` is a document-pipeline Stage-7 function, not a chat-drafting API.

## Decision 2 — Persona prompt-scaffolding for reliable tool emission

The system prompt for the controller persona is extended with scaffolding that conditions the model to emit `draftVendorRule` when a controller expresses a recurring-coding intent ("always code Spotify to subscriptions"). This is the genuine design work the verification flagged (V3) — the tool input-schema is the closed boundary, but reliable emission depends on the persona prompt. The scaffolding names the trigger pattern (vendor + recurring intent + target account) and the disambiguation expectation (vendor must resolve — Decision 6).

**Alternatives rejected.** Relying on tool description alone (insufficient for reliable emission per the shipped tool-emission patterns); a slash-command/explicit invocation (abandons conversational drafting).

## Decision 3 — `ProposedRuleCard`: the Four-Questions grammar with a creation-time population

A new `components/ProposedRuleCard.tsx` reuses the Four-Questions **grammar + next-intl mechanism** of `ProposedEntryCard`, but renders a **creation-time population** derived from the drafted rule + the controller utterance — explicitly **not** from `MatchResult` (no match exists at creation) and **not** from `policy_outcome` (the entry-confirmation path). Per verification V2, this is one of three render-path framings; the match-time `MatchResult.four_questions_population` path (`rule-type-core.md` §6.4) is a *separate* surface that activates with branches (Ring 2B) + the Logic Receipt write path (Decision F). The four answers:

- **Q1 What changed?** The rule to be created: vendor + `bundle_type` + "code to {account}" + "initial rung: Always Confirm."
- **Q2 Why?** The controller's utterance, generalized.
- **Q3 Track record?** "New rule — no track record yet" (creation-time; see Decision 4 for the dedicated template).
- **Q4 What if I reject?** "The rule will not be created; edit and resubmit, or discard."

**Alternatives rejected.** Overloading `ProposedEntryCard` with a rule variant (a rule proposal has no debit/credit lines and a different action set); grounding on `MatchResult` or `policy_outcome` (verification V2 — neither exists at creation).

## Decision 4 — Creation-specific next-intl templates

New `proposed_rule.*` template IDs are added to `messages/{en,fr-CA,zh-Hant}.json` and Zod-validated in `validTemplateIds.ts`: `proposed_rule.what_changed.vendor_rule` (Q1, params: vendor, bundle_type, account), `proposed_rule.why.from_utterance` (Q2, params: utterance summary), `proposed_rule.track_record.new_rule` (Q3), `proposed_rule.if_rejected.standard` (Q4). Per verification V6, the match-time `track_record.no_rule` template ("no rule applies to this transaction") is **not** overloaded — it is a semantically distinct proposition from "this newly-created rule has no track record."

## Decision 5 — Approval flow, the approval-ceremony write path, and resolution source

The `ProposedRuleCard` carries Approve / Reject / Edit actions (shipped `ProposedEntryCard` action pattern). The flow, corrected against the targeted HEAD-pass:

- **Draft is ephemeral.** `draftVendorRule` emits the card without persisting a rule (mirrors `ProposedEntryCard`'s dry-run ephemerality). Nothing in `rule_registry` exists until approval.
- **Approve = create + approval ceremony.** On approve, the create path (Decision 7) fires `ruleCreationOrchestrator.createVendorRule` (persisting a `'proposed'` rule), then **a new approval-ceremony write sets `vendor_rules.approved_at`/`approved_by`**, which derives `lifecycle_state='active'` (`20240163:271`). This is the disk-faithful two-step the orchestrator's own comment describes ("the vendor-template approval ceremony flips `approved_at`/`by` separately"). **This writer does not exist on disk** — `vendorRuleService` is read-only — so this arc authors it (an `approveVendorRule` operation, or an extension of the create-path orchestration that performs both writes). `createVendorRule` itself is **not** modified (T4: Ring 2A-core substrate is out of scope).
- **Reject is ephemeral.** There is no `rejected` lifecycle state and (because draft is ephemeral) no persisted rule to mark. Reject resolution is chat-turn-local — the card is marked resolved in the turn, no `rule_registry` write.
- **Edit = re-draft → new card.** Per verification V4, edit produces a new card cycle (shipped `/api/agent/reject` + `outcome:'edited'` → re-prompt pattern), not in-place amendment.
- **Resolution source.** For the approve case, the created rule's existence + `lifecycle_state` (`active`) is the durable resolution record; the chat turn carries a creation-specific resolution marker. This does **not** reuse `card_resolution` (which is `ai_actions.status`-derived and does not apply to rule creation — verification V4).

**Alternatives rejected.** Deriving resolution from `card_resolution`/`ai_actions` (rule creation does not touch `ai_actions`); using `promote()` for activation (rung ascension, inert at v1, semantically wrong — promotion changes authority, not approval status); persisting the draft as `'proposed'` before approval (would orphan rejected drafts with no `rejected` state to retire them to).

## Decision 6 — Vendor resolution as a blocking pre-condition

`draftVendorRule` resolves `vendor_id` via `vendorService.matchVendor` **before** emitting the `ProposedRuleCard`. Because `createVendorRule` requires a non-null `vendor_id` (dedup + FK key) — stricter than the document pipeline, which tolerates a null vendor (verification V5) — resolution must succeed before the card is approvable: a confident single match resolves directly; ambiguous matches surface `candidate_alternatives` (≤3) for controller selection; a not-found vendor degrades to a `respondToUser` clarification turn (mirror the document-pipeline `failureClassification` degrade). No `ProposedRuleCard` is emitted with an unresolved vendor.

**Alternatives rejected.** Resolve-at-create-time (the route handler would have to fail an already-approved card); passing the vendor text through unresolved (the create path cannot key on it).

## Decision 7 — Create-path wiring + API route handler

A new route handler `POST /api/orgs/[orgId]/rules` wraps the create-path per the `services.md` path-scoped discipline: `withInvariants(serviceFn)(input, ctx)`, `trace_id` threaded, idempotency-first. The handler orchestrates the Decision-5 two-step (create `'proposed'` → approval-ceremony write → `'active'`). Error handling catches `ServiceError`: `RULE_CREATE_FAILED` → surface retry; `PERMISSION_DENIED` / `ORG_ACCESS_DENIED` → controller-authority message (rule creation is controller-only per `rule_registry` CUD RLS = `user_is_controller`).

**Alternatives rejected.** A `/api/agent/rules/confirm` endpoint paralleling `/api/agent/confirm` (the org-scoped `/api/orgs/[orgId]/rules` route matches the Ring 2A-core canvas route convention from ADR-0025 Commit 4 and the broader org-scoped route precedent).

## Decision 8 — Post-approval navigation

On approve, the UI navigates to `RuleRegistryView` (the canvas view Ring 2A-core shipped) so the controller sees the now-created rule, mirroring the shipped `onNavigate(...)` pattern in `ProposedEntryCard`.

## Migration outline

**No migration.** This arc wires existing substrate and authors the approval-ceremony writer against the already-shipped `vendor_rules.approved_at`/`approved_by` columns (migration `20240163`). No schema change.

## Non-decisions

This spec explicitly does **not**:
- Author the Logic Receipt write path / register INV-AGENT-002 (Decision F carry-forward; serves the rung-activation arc).
- Author auto-post execution under approved rules (Decision F; Ring 2B + rung activation — no auto-posts fire at v1).
- Author closed-grammar Condition / Trigger / Action authoring (Decision F; Ring 2B per verification V1).
- Author the structured rule-edit form (Decision F; Stage 2 — v1 edit is re-draft, Decision 5).
- Modify Ring 2A-core substrate, including `ruleCreationOrchestrator.createVendorRule` (T4 ratified-contract-scope).
- Add reserved enums or new ratified contracts.

## Consequences

**Enables.** Controllers draft vendor-coding rules conversationally; the Four-Questions card renders the proposed rule; approval creates + activates the rule (via the approval-ceremony write); `RuleRegistryView` populates with real, operator-visible rules. The drafting + approval UX is exercised against real utterances at v1.

**Constrains / costs.**
- **v1-inertness (honest).** A created v1 vendor rule is near-inert at runtime — branchless, producing `almost_match` → default approval, with no autonomous action and no winning track record until Ring 2B branches + rung activation land. The v1 value is intent-recording + registry-population + the substrate-validated-through-use drafting UX, consistent with the substrate-only-v1 posture (Ring 2A-core shipped the promotion modal + gate components inert). Unlike those purely-waiting surfaces, this surface gets real v1 user contact.
- **One new service operation.** The approval-ceremony writer (`approved_at`/`by`) did not exist on disk; this arc authors it. Modest, but beyond pure wiring.
- **Spec-vs-code render-path divergence carried, not reconciled.** The three-framing render-path divergence (verification V2) is named and deferred to the Logic Receipt write path arc (T4) — this spec does not reconcile it.

## Open questions

Carried forward + ratification-time:
1. **Persona prompt-scaffolding mechanics** (Decision 2 ratification detail).
2. **`default_account_id`'s v1 runtime role** — surfaced as a suggestion at the branchless `almost_match` default-approval path, or purely recorded for Ring 2B? Bears on Q1 render. Likely tied to whether the evaluator filters candidates on `lifecycle_state='active'` (if it does, activation is necessary for the rule to be evaluated even to `almost_match`; if not, activation is purely a registry-status concern at v1). To verify at ratification.
3. **Approval-ceremony writer home** — a new method on a (newly-write-enabled) `vendorRuleService.approve`, vs an extension of the create-path orchestration. Service-architecture call at ratification (respecting the single-writer + `services ↛ agent` boundaries).
4. **Ambiguous/not-found vendor disambiguation UX** (Decision 6 detail).
5. **Card placement** — inline in the transcript (strong shipped precedent, `AgentChatPanel.tsx:1022`) vs canvas panel. Lean: inline.
6. **Multi-rule drafting** — one utterance → one proposal (shipped one-card-per-turn pattern) vs multiple. Lean: one-at-a-time for v1.

---

## Cross-references

- ADR-0023 (`0023-rule-type-core-substrate.md`) — the substrate this arc consumes (`vendor_rules`, `rule_registry`, enums, `approved_at`/`by`).
- ADR-0024 (`0024-ring2a-core.md`) — parent H-split; names Ring 2A-authoring's scope.
- ADR-0025 (`0025-ring2a-core-implementation-seams.md`) — Ring 2A-core seams; the org-scoped rule route convention (Commit 4); the Logic Receipt / INV-AGENT-002 reservation (Decision 8).
- ADR-0007 §Tier 1 / Q30 — Logic Receipt ownership (INV-AGENT-002, reserved); `ProposalJustificationSchema`.
- ADR-0020 — Authority Gradient source-tree homes (`agent/`, `services/`, route handlers) + `services ↛ agent` boundary.
- ADR-0011 §1 / ADR-0012 — proposal / bundle primitives (render-path divergence context).
- `intent_model.md` §Four Questions Grammar (canonical), §Logic Receipts (Rule 2 templating; `audit_log.before_state` storage).
- `rule-type-core.md` §5.2 (branches; v1 branchless), §5.7 (MatchResult; `almost_match`), §6.4 (match-time `four_questions_population`).
- `agent_autonomy_model.md` §Agent Ladder (rung activation), §Authority Gradient.
- Brainstorm `46fe7dcf`; pre-ADR verification `61945a01`.

---

*Pre-ratification design spec; committed for arc discipline; not yet ratified. Next substantive step: CTO ratification + ADR-0026 file authoring at `docs/07_governance/adr/0026-ring2a-authoring.md`, then the implementation phase landing Decisions 1–8.*
