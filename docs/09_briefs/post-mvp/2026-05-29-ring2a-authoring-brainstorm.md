# Ring 2A-authoring Brainstorm — Conversational rule-drafting, Four-Questions card, approval, create-path wiring

**Date:** 2026-05-29 · **HEAD anchor:** `b5a2ced4`, branch `staging`.
**Status:** Brainstorm (not a design spec; not committed at author time). Maps the Ring 2A-authoring v1 decision space; lands leans where disk/spec evidence supports one; routes genuinely open items. Point-in-time — superseded by the pre-ADR verification pass on conflict.
**Scope:** (δ.1) adjudication — Ring 2A-authoring v1 = **rule-creation only** (conversational-drafting + Four-Questions render + approval + create-path through `ruleCreationOrchestrator`). Proceeds entirely against ratified substrate. INV-AGENT-002 / Logic Receipt write path / auto-post execution defer to rung activation.
**Inputs:** `docs/02_specs/rule-type-core.md`, `docs/02_specs/intent_model.md` (§Four Questions Grammar, §Logic Receipts), `docs/02_specs/agent_autonomy_model.md` (§Agent Ladder, §Authority Gradient), ADR-0024, ADR-0025, ADR-0007 (§Tier 1, Q30), the shipped Ring 2A-core substrate (`apps/web/src/services/rules/`, migrations `20240163`–`20240166`).

## 1. Preamble — operating posture

**Empirical HEAD pass discipline.** Any decision turning on "the existing X behavior" gets a disk-grep before tradeoff analysis. Ring 2A-authoring builds the *consumer* surface against shipped substrate, so the HEAD pass maps what is already on disk — and several sub-prompt framings turn out to need correction against it.

**Prompt frames, disk refines, flag-and-propose.** Where the sub-prompt's framing diverges from disk, this brainstorm flags the divergence (tagged by the four-category prompt-drift typology, `docs/04_engineering/conventions/prompt-drift-typology.md`) and proposes the corrected framing rather than bending disk to the prompt. Three divergences fired this pass (Decisions A, B, E).

**Scope-conditioning (carry into the design spec).** The arc's substrate is fully ratified: `ProposedEntryCard` + the Four-Questions grammar + next-intl templating + the inline-card chat transcript + `ruleCreationOrchestrator` + the `RuleRegistryView` canvas all ship at HEAD. Ring 2A-authoring is **not** greenfield in the way Ring 2A-core was — it is mostly *wiring shipped pieces together* plus one new card component and one new agent tool. This conditions arc size: smaller than Ring 2A-core.

## 2. Empirical HEAD pass

Commands run from `~/projects/chounting`; findings with code references.

**(a) `proposalBuilder` is a Tier-2 document-pipeline stage, not a chat-drafting API.**
```
grep -rn "proposalBuilder|buildProposal" apps/web/src → agent/orchestrator/extraction/stages/proposalBuilder.ts
```
`buildProposal(input: ProposalBuilderInput): ProposalResult` is **Stage 7** of the document-extraction pipeline (`ingestDocument.ts:409`). It routes born-paid bundles / vendor invoices / payment confirmations / receipts into a `ProposalResult` union (`proposed_entry_card | proposed_attachment_card | proposed_mutation_bundle`). It is pure/deterministic and **document-keyed** — it does not take a chat utterance. **The actual chat-drafting precedent is different** (finding (b)).

**(b) Chat drafting today = agent tool + `respondToUser` canvas_directive.** `handleUserMessage` (`agent/orchestrator/index.ts:134`) runs the model with a tool registry; a ledger proposal arises when the model calls `postJournalEntry(dry_run=true)` then emits `respondToUser` with a `canvas_directive` carrying a `ProposedEntryCard`. The orchestrator post-fills card IDs (org_id, idempotency_key, trace_id) at `index.ts:867`. **No discrete "create proposal" tool** — the card emerges from a tool result + the model's structured response. This is the pattern Ring 2A-authoring extends.

**(c) No rule-drafting agent tool exists (greenfield, as expected).**
```
grep -rn "ruleCreationOrchestrator|createVendorRule|rule_registry|vendorRule" apps/web/src/agent → (none)
```
The 10 existing tools (`agent/tools/`) include none for rules. Ring 2A-authoring adds one (Decision A).

**(d) The Four Questions ALREADY render — for journal-entry proposals.** `components/ProposedEntryCard.tsx:188–219` renders all four sections (What changed / Why / Track record / If rejected). They render from `card.policy_outcome.reason_template_id + reason_params` and `card.matched_rule_label` — **NOT** from `ProposalJustificationSchema` (which `proposalJustification.schema.ts:26` notes has *no v1 producer*). So the Four-Questions grammar is a shipped, reusable structure; the enriched `justification.*` fields the spec names are a forward contract, not the live render path. (Divergence banked in Decision B.)

**(e) next-intl templating, validated template IDs.** `messages/{en,fr-CA,zh-Hant}.json` + `useTranslations()`; template IDs are Zod-validated in `agent/prompts/validTemplateIds.ts` (e.g. `proposed_entry.why.rule_matched: { label: string }`, `proposed_entry.why.novel_pattern`, `track_record.no_rule`). New `proposed_rule.*` templates slot into this system (Decision B).

**(f) Proposal cards render INLINE in the chat transcript; actions navigate to canvas.** `AgentChatPanel.tsx:1022` renders `<ProposedEntryCard>` inline next to the assistant turn; Approve/Edit fire `onNavigate(...)` into the `ContextualCanvas` (`SplitScreenLayout` Zone 3). `ChatTurn` carries `card?: ProposedEntryCard` + `card_resolution?: { status: 'approved'|'rejected'|'edited' }`. Strong precedent for open-question #2.

**(g) `ruleCreationOrchestrator.createVendorRule` — shipped, `withInvariants`-wrapped, condition-less.**
```
apps/web/src/services/rules/ruleCreationOrchestrator.ts:40
createVendorRule(input: { org_id; vendor_id; bundle_type; default_account_id?;
  legal_entity_id?; rule_type?; lifecycle_state?; model_version? }, ctx)
  : Promise<{ rule_id: string; created: boolean }>
```
Dedup probe (`vendorRuleService.findExisting`) → `create_vendor_rule_atomic` RPC → `recordMutation('rule.created')`. Defaults `rule_type='pattern'`, `lifecycle_state='proposed'`. **The input takes no Trigger/Condition/Action predicates** — it is keyed on `(vendor_id, bundle_type, default_account_id)`. Load-bearing for Decision E.

**(h) Closed-grammar predicates are RESERVED for Ring 2, with no v1 storage.**
```
grep "create table.*(condition|trigger|action)" supabase/migrations → (none)
```
`condition_type`/`trigger_type`/`action_type` exist only as **reserved enums** (`20240163:113–134`; rule-type-core.md:1117, 1448 "reserved per ADR-0010 three-layer defense"). The predicate JSON schema is "**Reserved for Ring 2 implementation**" (rule-type-core.md:262). `vendor_rules` gained `bundle_type`, `legal_entity_id`, `default_account_id` (dropped `autonomy_tier`) — **no condition column**. v1 vendor rules are vendor+bundle+account scoped; closed-grammar Conditions are Stage 2. Decisive for Decision E.

**(i) ServiceError rule codes shipped.** `errors/ServiceError.ts:123` — `RULE_NOT_FOUND`, `RULE_LIFECYCLE_INVALID`, `RULE_CREATE_FAILED`; plus `withInvariants` throws `PERMISSION_DENIED` / `ORG_ACCESS_DENIED` / `UNVERIFIED_CALLER`. Grounds Decision D error handling.

**(j) v1 rung floor confirmed.** `org_settings.default_initial_rung_for_new_rules` "v1 value always 'always_confirm'" (`20240163:356`). No auto-posts fire → the (δ.1) deferral of INV-AGENT-002 holds operationally, not just nominally.

## 3. Decision A — Agent conversational-drafting entry point

**Flag (Cat A — prompt-vs-disk).** The sub-prompt says "mirror the existing `proposalBuilder` pattern." Per HEAD-pass (a), `proposalBuilder` is a document-pipeline Stage-7 function, not a chat-drafting API. The real chat-drafting precedent is the agent-tool + `respondToUser` canvas_directive pattern (HEAD-pass (b)).

**Candidates.** (A1) New agent tool `draftVendorRule` registered in `toolsForPersona` (controller persona), dispatched via `orchestrator.executeTool`; the tool resolves the vendor + bundle_type + default account and emits a `ProposedRuleCard` via `respondToUser` canvas_directive. (A2) Embed rule drafting in an existing tool. (A3) A dedicated structured affordance (form) outside chat.

**Lean: A1.** It mirrors the shipped `postJournalEntry` → `respondToUser` drafting flow exactly; the tool's Zod input schema enforces the closed boundary; `executeTool` already threads `ctx`/`trace_id`. `proposalBuilder` is a *secondary* reference (how a typed card is post-filled), not the precedent to mirror. **Open:** the system-prompt persona scaffolding that makes the model reliably emit `draftVendorRule` from "always code Spotify to subscriptions" (→ open-question #1).

## 4. Decision B — Four-Questions chat-proposal card (a new `ProposedRuleCard`)

**Finding (Cat A + spec-vs-code divergence to bank).** Per HEAD-pass (d), the Four-Questions grammar is *already shipped* in `ProposedEntryCard` — but it renders from `policy_outcome` templating + `matched_rule_label`, while `intent_model.md` §Four Questions specifies rendering from `justification.*` fields. The shipped code and the spec diverge because `justification` has no v1 producer. **Bank:** *spec-vs-code divergence at the Four-Questions render path* (sibling to the ADR-compression-vs-deeper-canon sub-shape banked at this arc's HEAD-pass; here it is spec-vs-shipped-code, code-grain). The brainstorm grounds on the **shipped** templating pattern, not the unwired `justification.*` path — and notes the spec's `justification.*` target aligns with the deferred Logic Receipt path (Decision F).

**Candidates.** (B1) New `ProposedRuleCard.tsx` mirroring `ProposedEntryCard`'s Four-Questions structure + next-intl templating, rendering **rule** content. (B2) Overload `ProposedEntryCard` with a rule variant. **Lean: B1** — a rule proposal is structurally unlike a journal entry (no debit/credit lines; it renders the rule's vendor scope + bundle_type + default account + initial rung). The Four answers map:

- **What changed?** → the rule to be created: vendor + bundle_type + "code to {account}" + "initial rung: Always Confirm."
- **Why?** → the controller's utterance generalized (`proposed_rule.why.from_utterance`).
- **Track record?** → **always "new rule — no track record yet"** at creation (the rule does not exist yet). This is the sub-prompt's B(iii) `rule_id=null` case, but for *creation* not *match*; precedent template `track_record.no_rule`.
- **If rejected?** → "the rule will not be created; edit and resubmit, or discard."

New `proposed_rule.*` template IDs added to `messages/{locale}.json` + `validTemplateIds.ts` with strict param schemas.

## 5. Decision C — Approval flow

**Grounding (Cat D — gap-fill at consumer).** Approval is shipped for entries: Approve/Reject/Edit buttons on `ProposedEntryCard`, `card_resolution` on the turn, navigate-on-action to canvas (HEAD-pass (f)).

**Lean.** `ProposedRuleCard` carries the same three actions. **Approve** → calls the create-path (Decision D), sets `card_resolution.status='approved'`, navigates to `RuleRegistryView` (the rule now exists on the canvas Ring 2A-core shipped). **Reject** → `status='rejected'`, drafting state discarded (mirror entry pattern). **Edit-then-resubmit** (intent_model §Four Questions Q4) → re-open the draft for amendment; v1 lean = re-prompt the agent with a correction rather than a structured edit form (the structured rule-edit form is Stage 2 territory). **Open:** does approval fire create immediately or interpose a second confirmation? (→ open-question #4; lean: immediate, the card *is* the gate).

## 6. Decision D — Create-path wiring to `ruleCreationOrchestrator`

**Grounding.** `createVendorRule` is shipped, `withInvariants`-wrapped, idempotent via dedup probe, audit-emitting (HEAD-pass (g), (i)). Ring 2A-core left it with zero production callers by design.

**Lean.** A new API route handler `POST /api/orgs/[orgId]/rules` (or `/api/agent/rules/confirm`) wraps `ruleCreationOrchestrator.createVendorRule(input, ctx)` per the `services.md` path-scoped rule (route → `withInvariants(serviceFn)(input, ctx)`; trace_id threaded; idempotency-first). Error handling catches `ServiceError`: `RULE_CREATE_FAILED` → surface retry; `PERMISSION_DENIED`/`ORG_ACCESS_DENIED` → controller-authority message (rule creation is controller-only per `rule_registry` CUD RLS). **Gap to close in design spec:** `createVendorRule` requires a resolved `vendor_id` — the drafting step (Decision A) must resolve the vendor first (`vendorService.matchVendor` precedent) and handle the not-found case (→ open-question #5).

## 7. Decision E — Rule object construction: NOT closed-grammar at v1

**Flag (Cat A + Cat B — prompt-vs-disk and prompt-vs-ratified-contract).** The sub-prompt frames Decision E as "the LLM maps natural language to closed-grammar predicates (`field_equals`, `field_in_range`, …)." Per HEAD-pass (h), **this is premature for v1**: the predicate library is a *reserved enum set* with no v1 storage table and an explicitly "reserved for Ring 2" JSON schema; `vendor_rules` carries no condition column. A v1 vendor rule is `(vendor_id, bundle_type, default_account_id)` — the match is implicit in vendor+bundle, the "action" is the default account.

**Propose (corrected framing).** Decision E at v1 = **NL → `(vendor, bundle_type, default_account)` extraction**, a tractable structured-extraction problem (vendor resolution + bundle-type classification + account selection), *not* NL → predicate-grammar mapping. This removes the hardest LLM problem from the arc and aligns with the prior Ring 2A brainstorm §2(f) ("the canvas does NOT render Trigger/Condition/Action structure — Stage 2"). **Closed-grammar Condition authoring joins the carry-forward list** (Decision F), re-emerging at Ring 2B / Stage 2 when the predicate schema and storage land.

## 8. Decision F — Out-of-scope boundary (T4 ratified-contract-scope)

Explicitly carry-forward, not absorbed:

- **Logic Receipt write path / INV-AGENT-002 registration** — re-emerges at rung activation (Notify & Auto-Post / Silent Auto), itself a Layer 4 governance decision (`agent_autonomy_model.md` §Agent Ladder). The spec's `justification.*` Four-Questions render path (Decision B divergence) lands with it.
- **Auto-post execution under approved rules** — no auto-posts fire at v1 (HEAD-pass (j)); Ring 2B or rung-activation arc.
- **Closed-grammar Condition / Trigger / Action authoring** — Stage 2 / Ring 2B per Decision E; predicate JSON schema + storage are reserved.
- **Structured rule-edit form** — Stage 2; v1 edit is re-prompt (Decision C).

Adjacent issues uncovered during authoring (e.g. the spec-vs-code Four-Questions divergence) get carry-forward framing per T4, not absorption into this arc.

## Final Open Questions — escalation surface before design spec

1. **Drafting ergonomics / persona scaffolding.** What system-prompt scaffolding makes the model reliably emit `draftVendorRule` from a controller utterance? Chat-typed mid-conversation (lean) vs a structured drafting affordance. Load-bearing for the agent-prompt work in the design spec.
2. **Proposal-card placement.** Inline in the transcript (strong disk precedent, HEAD-pass (f)) vs a canvas panel. Lean: inline; approve navigates to `RuleRegistryView`.
3. **Multi-rule drafting.** One utterance → one proposal (matches the one-card-per-turn shipped pattern) vs multiple proposals from one utterance. Lean: one-at-a-time for v1.
4. **Approval ↔ creation transaction boundary.** Approve fires create immediately (lean — `createVendorRule` is atomic + idempotent; the card is the confirmation gate) vs a second confirmation gate.
5. **Drafting failure modes.** Vendor not found / ambiguous bundle_type / no clear default account → graceful degrade to a `respondToUser` clarification (mirror the document-pipeline `failureClassification` pattern). What is the disambiguation UX?
6. **(new, from Decision E)** Confirm with product/spec that v1 vendor-rule semantics are fully captured by `(vendor, bundle_type, default_account)` with no condition expression — i.e. that "What changed?" (Q1) has nothing beyond vendor+bundle+account to render. If any v1 condition exists beyond vendor+bundle, Decision E reopens.

---

*Brainstorm ends. Next substantive step under the arc shape: pre-ADR verification authoring (`2026-05-29-ring2a-authoring-pre-adr-verification.md`) — deeper disk-grep corrections to these leans before the ADR-0026 design spec.*
