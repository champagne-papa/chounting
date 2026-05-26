# Ring 2A — Pre-ADR Verification Pass

**Date:** 2026-05-26 · **HEAD anchor:** `2de50113`, branch `staging`.
**Status:** Verification output (read-only; not committed). Disk/spec-grounds the open questions the Ring 2A brainstorm (`2de50113`) escalated, with **H settled = SPLIT** (CTO 2026-05-26) as the framing.
**Scope:** brainstorm Open Q #2 (Logic Receipt dependency — anchor), #6 (capping-table values), #3 (audit one-write-vs-two). F (UI label) runs to product/UX in parallel; not verified here.

**Settled framing (H = split):** Ring 2A-core (evaluator + gate + Stage 1 canvas + windowed view + evaluation log, against seeded rules) and Ring 2A-authoring (agent conversational-drafting → approval → create path + the Logic Receipt dependency; its own brainstorm+verification cycle). Each verification result is read against this split.

**Headline:** the pass resolves #2 cleanly and **corrects two brainstorm assumptions** — #6 (capping values are *already ratified*, not deferred) and a precision point on #2 (the Logic Receipt is broader than rule-core, a prerequisite, not a rule-core output). #3 is genuinely a design-spec call on mixed precedent, surfaced not forced.

---

## Verification 1 (Open Q #2) — Logic Receipt / INV-AGENT-002 scope

**Result: the Logic Receipt write path is a broader Tier-1 cross-agent concern that Ring 2A *consumes*, not a rule-core output. Maps onto the split: 2A-core has no dependency; 2A-authoring depends on it; it is most likely a Tier-1 prerequisite, not 2A-authoring's to author.**

Evidence:
- **INV-AGENT-002 is defined at the agent-autonomy level, reserved-not-registered.** `agent_autonomy_model.md §10`: *"INV-AGENT-002 — Every auto-post produces a Logic Receipt … written as part of the auto-post service call. **To be registered when the Logic Receipt write path lands.**"* It is **not** in `invariants.md` yet (confirmed by grep), consistent with reserved-not-registered.
- **Tier-1-owned, not rule-core.** ADR-0007 §Tier 1 lists *"the Logic Receipt production (INV-AGENT-002)"* under what Tier 1 owns. Tier 1 is the committing agent layer — orthogonal to the rule-core pure evaluator.
- **The Logic Receipt is a universal concept.** `intent_model.md §6`: it's *"the immutable audit artifact derived from `ProposedMutation.justification`"*, structured (no raw LLM reasoning), consumed by the **Four Questions grammar** which is *"universal across all entry points"* (journal entries, reversals, bundles — `rule_id` is null when no rule applies). Not rule-specific.
- **The codec already exists and is live.** `apps/web/src/shared/schemas/accounting/proposalJustification.schema.ts` (Phase 8 chunk 9; ADR-0012 §6 / ADR-0007 Q30) is the canonical Logic-Receipt codec, carrying `pipeline_trace` + `bundle_audit_trace` + optional Logic-Receipt fields (`rule_id`, `input_features`, `historical_match_count`, …). So the **schema** is built; the **write-path integration** (emitting it at auto-post commit, INV-AGENT-002 enforcement) is what's unbuilt.

**Net for the split:**
- **Ring 2A-core:** no Logic Receipt dependency. The canvas reads substrate directly; the evaluator returns `MatchResult`; the gate caps. None of these author or require the Logic Receipt write path. **2A-core proceeds to design spec unblocked by #2.**
- **Ring 2A-authoring:** the chat proposal cards render the Four Questions, which consume the Logic Receipt. But **registering INV-AGENT-002 / the write path is a Tier-1 / Authority-Gradient concern serving rules, bundles, reversals, and journal entries equally** — not rule-core-specific. So it is a **prerequisite 2A-authoring depends on**, most naturally landed by a Tier-1 arc (or as 2A-authoring's first dependency if it lands then). The 2A-authoring brainstorm opens with this dependency as a known input, not a rule-core deliverable to scope.

*Distinction to carry forward (don't conflate):* `intent_model.md §6` says Logic Receipts *piggyback on `audit_log.before_state`* (structured JSON alongside before/after state). That is the **auto-post justification** artifact. It is **not** the same as `rule_evaluated` (the per-evaluation event, ADR-0023 §8.5). ADR-0023 explicitly rejected `before_state`-stuffing for `rule_evaluated`; that rejection stands — `rule_evaluated` ≠ Logic Receipt. (Bears on Verification 3.)

---

## Verification 2 (Open Q #6) — capping-table values

**Result: CORRECTION. The rung→action capping values are NOT deferred to Ring 2 ratification — they are already ratified in `rule-type-core.md §6.1`. Ring 2A consumes the table; it does not invent it.**

The brainstorm (Open Q #6) and Decision D both stated the capping table's "exact values are owned by Ring 2 ratification." That is wrong against disk. `rule-type-core.md §6.1` (ratified 2026-05-26) carries the full 9-row capping table:

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

(`max` means max — a higher rung never *elevates* a Branch's `max_outcome_action`; only `auto_post_at_rung_*` are rung-capped; the three conservative actions pass through unchanged. §5.6.) `agent_autonomy_model.md §7` carries the gate *decision tree* (5 steps) but defers the numeric table to rule-core §6.1 (the "orthogonal" cross-reference).

**Net:** **Open Q #6 closes** — no Ring 2A capping-value ratification needed. Decision D's "values owned by Ring 2" line is superseded; the Ring 2A-core design spec implements §6.1's table as canon. At v1 (`current_rung = always_confirm` only), the live rows are the three `× always_confirm → suggest_with_required_approval` / pass-through rows — capping trivially routes everything to human approval, consistent with Decision D's v1 asymmetry. The post-v1 rows ship as the (inert) capping function regardless.

---

## Verification 3 (Open Q #3) — audit one-write-vs-two for `rule_evaluated`

**Result: MIXED precedent — a genuine design-spec call, not precedent-settled. Surfaced, not forced.**

Two precedents pull opposite ways:
- **Two writes (canonical-audit reading).** INV-AUDIT-001 (`ledger_truth_model.md` leaf): *"Every service function that writes to a tenant-scoped table also writes a row to `audit_log` inside the same database transaction."* ADR-0011 §1: *"both ledger-related and document-related mutations route their audit events through that canonical writer; no service inserts into `audit_log` directly."* `recordMutation.ts` is the universal writer (used by `invitationService`, `addressService`, the ledger/document services). Under this reading, a `rule_evaluated` mutation writes an `audit_log` row **and** the structured `rule_evaluation_log` holds the queryable trace → two writes.
- **One write (domain-log reading).** `ai_actions` is a tenant-scoped structured agent-action log that `aiActionsService` writes **without a paired `recordMutation`** (grep: `aiActionsService.ts` calls `.from('ai_actions')`, no `recordMutation` import/call). `exception_queue_entries` is similarly a standalone workflow log. Under this reading, `rule_evaluation_log` follows the `ai_actions` precedent — a standalone domain log, no separate `audit_log` row.

**The framing question the design spec must answer:** is emitting a `rule_evaluated` record a *mutating service call* (→ INV-AUDIT-001 applies, two writes) or a *domain-log append* like `ai_actions` (→ standalone, one write)? Precedent supports either; the spec/ADR decides.

Two grounding facts for that decision:
- `rule_evaluated` fires on **every evaluation** (win or lose), most of which produce no commit at v1 — high-volume, read-shaped. That leans toward the `ai_actions` domain-log model (one write) rather than per-mutation audit (the evaluation isn't itself a ledger/state mutation; the *disposition* that updates `rule_track_records` counters is, and that counter write is separately audit-eligible).
- ADR-0023's rejection of `before_state`-stuffing stands (Verification 1 distinction): whichever way #3 lands, `rule_evaluated`'s payload does **not** go in `audit_log.before_state`.

**Net:** brainstorm Decision B's lean (separate `rule_evaluation_log` table) holds either way — it's the queryable structured record. The open sub-question is narrowed to: *does `rule_evaluated` also emit a canonical `audit_log` row, or is `rule_evaluation_log` the sole record (ai_actions-style)?* Lean toward **one write (`rule_evaluation_log` as the domain log, ai_actions precedent)** given the high-volume read-shaped nature, with the explicit note that designating it sole-record may want an INV-AUDIT-001-interpretation note (not necessarily an amendment — `ai_actions` already operates this way). Design-spec decision; the counter-update mutations on `rule_track_records` remain separately audit-eligible regardless.

---

## Net / impact on the Ring 2A-core design spec

- **#2 resolved:** 2A-core is unblocked by the Logic Receipt; 2A-authoring carries it as a **Tier-1 prerequisite dependency** (not a rule-core output) — its own brainstorm opens with that input.
- **#6 corrected + closed:** the capping table is ratified (§6.1); 2A-core implements it as canon. Decision D's "values owned by Ring 2" line is wrong and superseded by this finding.
- **#3 narrowed:** `rule_evaluation_log` table holds the structured trace (Decision B lean stands); the one-write-vs-two sub-question is a framed design-spec call leaning one-write (ai_actions precedent), with `before_state`-rejection intact.
- **No new scope reach** beyond rule-core surfaced (the Logic Receipt is a *dependency*, explicitly not rule-core's to build).
- **Ring 2A-core can proceed to a design spec** on the brainstorm's leans, with Decision D corrected (consume §6.1's capping table) and Decision B's sub-question carried as the one design-spec decision remaining.

## Remaining open items (for the design spec / parallel tracks)

1. **#3 final call** (design spec): `rule_evaluation_log` sole-record (one write) vs. + canonical `audit_log` row (two writes). Leaning one-write per `ai_actions`.
2. **Promotion-modal-at-v1** (brainstorm Open Q #4; product/UX + gate timing): ship the modal with inert post-v1 targets vs. defer. Unchanged by this pass.
3. **F UI label** (product/UX, parallel): pick from `last fired` / `last selected` / `last won` / `last decisive match`.
4. **Ring 2A-authoring** (separate arc): opens with the Logic Receipt write-path dependency as a known Tier-1 prerequisite; whether 2A-authoring lands it or a Tier-1 arc does is that arc's opening question.

---

*Pre-ADR verification pass. Next: the Ring 2A-core design spec, on the brainstorm's leans with Decision D corrected per Verification 2. Not committed; not pushed.*
