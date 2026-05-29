# Ring 2A-authoring Pre-ADR Verification — gating call HOLDS, brainstorm leans corrected at deeper grain

**Date:** 2026-05-29 · **HEAD anchor:** `46fe7dcf`, branch `staging`.
**Status:** Pre-ADR verification (read-only output; not committed at author time, committed per arc discipline). Disk/spec-grounds the brainstorm's six open questions + three precision flags; corrects leans where deeper canon diverges; surfaces narrowed design-spec items. Supersedes the brainstorm (`46fe7dcf`) on conflict.
**Scope:** (δ.1) — Ring 2A-authoring v1 = rule-creation only. This pass's load-bearing role is **Verification 1, the gating call**: whether v1 vendor-rule semantics extend beyond `(vendor, bundle_type, default_account)`. If they do, Decision E reopens and arc scope reverts toward substantive-multi-session. **They do not — V1 HOLDS** (below).

This pass resolves the gating call (V1 holds; arc stays medium-scope), corrects three brainstorm leans against deeper canon (V2 render-path conflation; V4 `card_resolution` source; V6 creation-time Q3 template), sharpens two (V5 vendor-resolution strictness; V3 persona scaffolding gap), and surfaces one honest **v1-inertness** flag for the operator. No new drift *grain* this layer — corrections are Category-D gap-fill-at-consumer plus the normal pre-ADR correction stance (per the prior arc, where V2 corrected V6).

## Verification 1 (Open Q6) — THE GATING CALL: v1 vendor rules are branchless. **HOLDS.**

**Result: confirmed.** v1 vendor-rule semantics are fully `(vendor_id, bundle_type, default_account_id)`; no closed-grammar Condition expression is stored or authored at v1. Decision E's lean holds; **the arc does not reopen.**

**Evidence.**
- `rule-type-core.md:406` (§5.2): "**In v1, only `primary` and `otherwise_if` branches are valid.**" `:401` — `otherwise` (empty-condition catch-all) is "**reserved post-v1.**"
- `rule-type-core.md:408`: "In v1, a Rule produces an `almost_match` whenever its Trigger fires but no Branch's Conditions pass." A rule with no stored branches can only `almost_match`.
- `rule-type-core.md:262`: "The exact predicate JSON schema. **Reserved for Ring 2 implementation.**" `:517` — the specificity weight table is "owned by Ring 2."
- Substrate: `20240163` adds `bundle_type` / `legal_entity_id` / `default_account_id` to `vendor_rules`; **no `conditions`/`branches` column**. `condition_type`/`trigger_type`/`action_type` are reserved enums (`:113–134`).
- `ruleCreationOrchestrator.createVendorRule` input is `(vendor_id, bundle_type, default_account_id, …)` — **no predicate/branch parameter** (`ruleCreationOrchestrator.ts:40`).
- `ruleEvaluationService.evaluate` runs a no-op `branchSource` at v1 (Ring 2A-core HEAD-pass §5): branchless rules → `almost_match` only until Ring 2B.

**Net for the design spec.** Decision E v1 = NL → `(vendor, bundle_type, default_account)` extraction (V5 grounds the resolution mechanics). Closed-grammar Condition / Branch / Action authoring is Ring 2B, on Decision F's carry-forward. ADR-0026 opens at medium scope.

**Sub-finding (design-spec resolution, NOT a gating reopener) — v1 runtime effect is near-inert.** A branchless v1 vendor rule, when its Trigger fires, produces `almost_match` → "the proposal goes to its default path (typically approval as novel pattern)" (`:642–645`). Because `winning_rule_id` is null for `almost_match` and `last_winning_match_at` updates only on a *win* (§5.7, §5.9), a branchless rule **accrues no winning track record** until Ring 2B branches land. So a created v1 vendor rule's observable effect is: a registry record visible on `RuleRegistryView` + a captured `default_account` intent + an informational `almost_match` signal — **not** autonomous action and **not** track-record accrual. This is consistent with the substrate-only/inert-ahead-of-activation posture (Ring 2A-core shipped the promotion modal + gate components inert), but it bears on the arc's honest v1 value proposition → operator flag in Net/impact.

## Verification 2 (Decision B) — render-path divergence confirmed and SHARPENED; brainstorm slightly conflated two surfaces. **CORRECTED.**

**Result: divergence real; the brainstorm conflated creation-time and match-time cards.** There are **three** render-path framings on disk, not two:
1. `intent_model.md` §6 — render from `ProposedMutation.justification.*`.
2. shipped `ProposedEntryCard.tsx:188–219` — render from `policy_outcome.reason_template_id` + `matched_rule_label`.
3. `rule-type-core.md` §6.4 — render from `MatchResult.four_questions_population` (composed with the gate's `effective_action`); this is the **canonical rule-aware** population (`:1023–1081`).

**Evidence + correction.** §6.4 (1) is the **match-time** surface — the Four Questions when a *created rule later matches a transaction at runtime*. That is Ring 2A-core/Ring 2B territory (and at v1 branchless rules only `almost_match`). Ring 2A-authoring's `ProposedRuleCard` is the **creation-time** surface — "here is the rule I drafted; approve it?" At creation there is **no MatchResult** (nothing has matched) and **no `policy_outcome`** (that is the entry-confirmation path). So the brainstorm's "mirror `ProposedEntryCard`'s Four-Questions structure, ground on shipped `policy_outcome` templating" is **half-right**: reuse the *grammar + next-intl mechanism*, but the **creation card needs its own structured population** derived from the *drafted rule* + the *controller utterance*, not from MatchResult or policy_outcome.

**Net for the design spec.** Define a creation-time `four_questions_population` analog for `ProposedRuleCard` (Q1 = the rule to be created; Q2 = the utterance generalized; Q3 = "new rule"; Q4 = "will not be created"). Name the §6.4 match-time path as the *separate* surface that activates with branches (Ring 2B) + the Logic Receipt write path (Decision F). The spec-vs-code divergence (banked N=1 code-grain at brainstorm) gets explicit deferral framing, not reconciliation in this arc (T4).

## Verification 3 (Decision A) — tool registration grounded; persona scaffolding is the open work. **HOLDS, with a flagged gap.**

**Result: lean holds.** `toolsForPersona.ts` is a per-persona switch; the `controller` persona exposes all 10 tools (`toolsForPersona.ts:37–52`). A new `draftVendorRuleTool` registers via `defineTool()` (the `gatedByDispatcherSet` field is required, `tools/types.ts:24–44`) → add to the `ToolDef` union → import → add to the `controller` case; dispatch is inline in `executeTool` (`orchestrator/index.ts`). The drafting flow mirrors the shipped `postJournalEntry(dry_run)` → `respondToUser(canvas_directive)` pattern (`index.ts:134, 867`).

**Gap (→ design-spec work, open question 1).** The reader found no per-persona prompt scaffolding that reliably conditions the model to emit a *specific* tool from a natural-language utterance. The system-prompt design that makes "always code Spotify to subscriptions" reliably emit `draftVendorRule` is genuine design work, not a wiring lookup. The design spec owns the prompt-scaffolding + tool-input-schema contract.

## Verification 4 (precision flag #2) — `card_resolution` is `ai_actions`-derived; NOT directly reusable for rules. **CORRECTED.**

**Result: brainstorm's "reuse shipped `card_resolution`" needs correction.** `CardResolution` is a 4-state union `approved | rejected | edited | stale` (`shared/types/chatTurn.ts:25–33`), but it is **server-derived from `ai_actions.status` at hydration, not persisted** (`PersistedAssistantTurn` omits it, `:74–77`). Rule creation goes through `rule_registry` / `ruleCreationOrchestrator`, **not** `ai_actions` — so the `ProposedRuleCard` cannot reuse the `ai_actions`-derived resolution mechanism as-is. Edit semantics confirmed: clicking Edit POSTs `/api/agent/reject` with `outcome: 'edited'` → navigates to a prefilled form → **new card/turn cycle**, not in-place amendment (`ProposedEntryCard.tsx:126–149`).

**Net for the design spec.** Define how `ProposedRuleCard` resolution state is derived — candidate: `rule_registry.lifecycle_state` (`proposed` → `active`/created on approve; a `rejected`/discarded path on reject) rather than an `ai_actions` row. Resolve precision-flag #2: edit = re-draft → **new card** (consistent with the shipped edit-as-new-cycle pattern); `status='edited'` marks the superseded card. The resolution-source choice is a real design-spec decision, not a reuse.

## Verification 5 (Decision D) — vendor resolution grounded; STRICTER than the document-pipeline precedent. **HOLDS, sharpened.**

**Result: lean holds; one strictness correction.** `vendorService.matchVendor(input, ctx): VendorMatchResult` returns `{ vendor_id: string | null, confidence, match_type, candidate_alternatives[] }`; not-found/ambiguous → `vendor_id: null` + up to 3 `candidate_alternatives` (`vendorService.ts:122–311`). The document pipeline passes a **null `vendor_id` through to the card** and posts the bill with the vendor unset for later manual entry (`proposalBuilder.ts:182–227`).

**Sharpening.** `ruleCreationOrchestrator.createVendorRule` **requires a non-null `vendor_id`** (it is the dedup + FK key). So unlike the document pipeline, rule creation **cannot proceed with an unresolved vendor**. The drafting step (Decision A) must resolve `vendor_id` to non-null — surfacing `candidate_alternatives` for controller selection when ambiguous, and a clarification turn (mirror the pipeline's `failureClassification` degrade) when not-found — **before** the `ProposedRuleCard` is approvable.

**Net for the design spec.** Vendor resolution is a *blocking pre-condition* of the create path, owned by the drafting tool (resolve-at-drafting-time, not resolve-at-create-time). Define the ambiguous/not-found disambiguation UX (open question 5).

## Verification 6 (precision flag #1) — two Q3 surfaces confirmed; creation-time needs a NEW template. **CORRECTED.**

**Result: the brainstorm's "reuse `track_record.no_rule`" is semantically wrong.** §6.4's `almost_match`/no-rule Q3 is "**No matching rule** … first time the system has seen this transaction shape" (`:1066`) — i.e. *no rule applies to this transaction*. The creation-time Q3 is "**this newly-created rule** has no track record yet" — a different proposition. Reusing `track_record.no_rule` would mislabel. **Two distinct surfaces, two distinct template sets:**
- **Creation-time** (Ring 2A-authoring v1): new `proposed_rule.track_record.new_rule` template — "new rule; no track record yet."
- **Match-time** (Ring 2A-core/2B runtime): `MatchResult.four_questions_population` per §6.4 — not this arc.

**Net for the design spec.** Add creation-specific `proposed_rule.*` templates to `messages/{locale}.json` + `validTemplateIds.ts`; do not overload the match-time `track_record.*` templates.

## Net / impact on the Ring 2A-authoring design spec (ADR-0026)

- **Gating call resolved: HOLDS.** ADR-0026 opens at medium scope. Decision E v1 = `(vendor, bundle_type, default_account)` extraction; closed-grammar authoring is Ring 2B (Decision F).
- **`ProposedRuleCard` is genuinely greenfield** with a *creation-time* `four_questions_population` (V2), creation-specific templates (V6), and a non-`ai_actions` resolution source (V4) — more than "mirror `ProposedEntryCard`."
- **Vendor resolution is a blocking pre-condition** owned by the drafting tool (V5).
- **Tool wiring is mechanical; persona prompt-scaffolding is the design work** (V3).
- **Operator flag — honest v1 value.** Per V1's sub-finding, a created v1 vendor rule is near-inert at runtime (registry record + intent capture + informational `almost_match`; no autonomous action, no winning track record until Ring 2B). The arc's v1 deliverable is **intent-recording + registry-population + the conversational-drafting/approval UX**, with behavioral automation deferred to Ring 2B + rung activation. This is coherent with the substrate-only-v1 posture, but the operator should confirm the v1 deliverable is worth shipping ahead of Ring 2B rather than folding rule-creation into the Ring 2B branch-authoring arc. (This is a sequencing question, not a scope reopener — Decision E still holds whichever way it resolves.)

## Remaining open items (design spec / parallel tracks)

1. **Persona prompt-scaffolding** for reliable `draftVendorRule` emission (V3; open question 1).
2. **`ProposedRuleCard` resolution source** — `rule_registry.lifecycle_state` vs a new mechanism (V4).
3. **`default_account_id`'s v1 role** — is it surfaced as a suggestion at the (branchless) `almost_match` default-approval path, or purely recorded for Ring 2B? (V1 sub-finding; bears on Q1 "What changed?" render.)
4. **Ambiguous/not-found vendor disambiguation UX** (V5; open question 5).
5. **Card placement** inline-vs-canvas (brainstorm open question 2; strong inline precedent, `AgentChatPanel.tsx:1022`).
6. **Operator sequencing call** — ship v1 rule-creation now vs fold into Ring 2B (Net/impact operator flag).

---

*Pre-ADR verification ends. Next substantive step under the arc shape: ADR-0026 design spec authoring (`specs/2026-05-29-adr-0026-ring2a-authoring-design.md`), parallel to ADR-0024's authoring shape.*
