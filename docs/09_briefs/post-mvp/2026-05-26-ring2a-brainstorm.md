# Ring 2A Brainstorm — Evaluator, Agent Ladder Gate, Stage 1 Canvas, Q-RC-AT-1 Read Path

**Date:** 2026-05-26 · **HEAD anchor:** `d1d23e41`, branch `staging`.
**Status:** Brainstorm (not a design spec; not committed). Maps the Ring 2A decision space; lands leans where disk/spec evidence supports one; routes genuinely open items.
**Inputs:** `docs/02_specs/rule-type-core.md` (V3.2), `docs/09_briefs/post-mvp/2026-05-25-rule-core-access-and-tuning-brief.md`, ADR-0023, the shipped migration `20240163000000`.

## 1. Preamble — operating posture

**Empirical HEAD pass discipline.** Any decision turning on "the existing X behavior" gets a disk-grep before tradeoff analysis. Ring 2A has more present-tense-but-unbuilt spec surface than Ring 1, so the HEAD pass is the non-skippable opener.

**Prompt frames, disk refines, flag-and-propose.** Where this prompt's framing diverges from disk — a read-path candidate that doesn't fit precedent, a creation-entry assumption the brief contradicts — the brainstorm flags and proposes the corrected framing rather than bending disk to the prompt.

**Scope-conditioning starting state (carry into the design spec).** All three Ring 1 services — `ruleRegistryService`, `ruleTrackRecordService`, `vendorRuleService` — are **greenfield**: the Ring 1 migration pass shipped substrate only and deferred service code. Ring 2A authors all three from scratch, on top of the evaluator, gate, Stage 1 canvas, windowed view, and evaluation-log table. This conditions the whole arc's size (Decisions G and H) and must not get lost in the brainstorm → design-spec transition.

---

## 2. Empirical HEAD pass

Everything Ring 2A builds is **greenfield at HEAD** — no stubs to extend, and (importantly) no present-tense spec passage that points at a live consumer we'd accidentally depend on. Commands + findings:

**(a) Stage 1 canvas — greenfield.**
```
rg -l "rule_registry|ruleRegistry|RuleCard|rule_track_records" apps/web/src/components apps/web/src/app  → (none)
ls apps/web/src/components/canvas/  → 30+ *View.tsx (AccountLedgerView, OpenBillsView, PendingDocumentsView, …); no rule view
```
No rule canvas exists. **Precedent for the shape:** the existing `*View.tsx` read-only canvas views (e.g., `OpenBillsView`, `PendingDocumentsView`) — Stage 1 rule canvas is a new `*View.tsx` following that pattern.

**(b) Evaluator — greenfield.**
```
ls apps/web/src/core/  → README.md, evidence/   (no rules/ dir)
```
Spec §7 ratifies `apps/web/src/core/rules/` as the empty home (no DB/I/O/agent imports). Fully unbuilt. The `MatchResult`/`winning_branch` grep hits are document-platform scoring (`scoreComposition.ts`), a different domain — not rule-core.

**(c) Agent Ladder gate — unbuilt.**
```
rg "current_rung|effective_action|winning_branch_max_action|per_transaction_limit|daily_aggregate" apps/web/src (excl. types.ts) → (none)
```
No gate consumer. `apps/web/src/agent/policies/agent-ladder/` is the ADR-0020 empty home. The whole gate is a Ring 2A deliverable.

**(d) `rule_evaluated` emitter — zero (good).**
```
rg "rule_evaluated" apps/web/src  → (none)
```
No premature emitter — no payload landing pre-chosen without an ADR. Decision B is open as intended.

**(e) `audit_log` shape — confirmed, no general payload column.**
```
rg "ALTER TABLE audit_log" supabase/migrations  → 20240113 (org_id DROP NOT NULL); 20240123 (ADD COLUMN reason TEXT)
```
Columns at HEAD: `audit_log_id, org_id (nullable), user_id, session_id, trace_id, action text, entity_type text, entity_id, before_state jsonb, after_state_id uuid, tool_name, idempotency_key, created_at, reason text`. **No general JSONB payload column** (the `reason` column is a short string, not a trace payload). Ring 1's finding holds — the payload landing (Decision B) is genuinely unresolved.

**(f) Stage 1 canvas data surface** (spec §6.4 + brief §4). The canvas detail surface renders **behavior, not logic** (brief §4): identity header (`name`, `rule_type`, `current_rung`, `lifecycle_state`), 30-day track-record trend (`clean_approval_count`/`rejection_count`/guardrail counts windowed), recent matches (from the `rule_evaluated` corpus), and `last_winning_match_at`. It does **not** render Trigger/Condition/Action structure (Stage 2). So the canvas reads: `rule_registry` (identity/rung/lifecycle/name/anchors) + `rule_track_records` (cumulative counters + `last_winning_match_at`) + a 30-day windowed read over the `rule_evaluated` corpus. **The Four Questions (§6.4) are a separate consumer** — they render on a *chat proposal card*, composed from `MatchResult` (Q2/Q3) + the gate's `effective_action` (Q4), not on the canvas. They share `rule_track_records` fields with the canvas but are a different surface with a different dependency (the Logic Receipt path — see (h)).

**(g) Q-RC-AT-1 read-path precedent — decisive.**
```
rg "MATERIALIZED VIEW|REFRESH MATERIALIZED|pg_cron|cron.schedule" supabase/migrations  → NONE
rg "CREATE (OR REPLACE )?VIEW" supabase/migrations  → 20240154 document_cards_view (CREATE OR REPLACE VIEW … INNER JOIN flatten for canvas cards)
```
**The project has no materialized-view or cron precedent at all, and one plain-`VIEW` precedent** (`document_cards_view`, the document canvas's flattening read view). This is load-bearing for Decision A: a matview would be first-of-kind AND require a refresh mechanism (cron) that doesn't exist; a plain view matches precedent and is always-fresh.

**(h) Present-tense-but-unbuilt spec passages.** §6 (gate), §6.4 (Four Questions), §7 (evaluator) all read present-tense; all are unbuilt at HEAD (confirmed (b)/(c)). No trap (nothing we'd falsely depend on). **One real dependency:** §6.4's Four Questions UI templating routes through the **Logic Receipt write path (INV-AGENT-002), which is reserved-but-not-registered** (spec notes). So the *chat* Four Questions rendering has an unbuilt prerequisite. The *canvas* behavior surface does not depend on the Logic Receipt — it reads the substrate directly. (Interaction surfaced in Decision E.)

**(i) Migration vs ADR-0023 — no drift.** The shipped `20240163000000` was authored from ADR-0023's a–i outline and validated during the test-update pass (applied clean; `types.ts` regen + 974-green integration suite reflect the live schema). RLS shipped as chat-resolved: `rule_track_records` UPDATE/DELETE = `USING(false)` (verified: 6 policies, 2 `USING(false)`). Ring 2A reasons from this disk schema.

**(j) Canvas cross-table read under the shipped RLS.** `rule_registry` SELECT = `user_has_org_access(org_id)`; `rule_track_records` SELECT = through-parent `user_has_org_access`. **A non-controller operator CAN SELECT both tables** → the read-only canvas join (registry ⋈ track_records ⋈ windowed view) works for operators. Writes: `rule_registry` CUD = `user_is_controller` (so promote/demote/rename/retire row actions are controller-only, matching brief §4); `rule_track_records` user-writes blocked (`USING(false)`) → counter updates are service-path only (`ruleTrackRecordService` on service_role). **No read-access gap.** The canvas is read-only for operators, write-enabled for controllers — exactly the shipped posture.

**Cross-cutting:** all three Ring 1 services (`ruleRegistryService`, `ruleTrackRecordService`, `vendorRuleService`) are **not yet authored** — the Ring 1 migration pass deferred service code explicitly. Decision G is greenfield service authoring, not wiring inert files.

---

## 3. Decision A — Q-RC-AT-1 windowed read path

**Candidates:** (1) materialized view on `rule_track_records` + `rule_evaluated` corpus, periodically refreshed; (2) derived read computed at canvas-load time from the corpus; (3) incremental `rule_track_records_windowed` table the emitter writes to; (4) **plain SQL VIEW** over the structured evaluation log (surfaced by the HEAD pass).

**Lean: (4) a plain `VIEW`** over the `rule_evaluation_log` table (Decision B), windowed to 30 days, computed live.
- **Precedent (g):** zero matview/cron precedent; one plain-`VIEW` precedent (`document_cards_view`). (4) fits; (1) is first-of-kind and needs a cron that doesn't exist.
- **Freshness (§7 bar):** a plain view is **always real-time** (computed at query time) — it can't be stale, so it meets "fresh-enough-to-be-useful (real-time, not daily-batch)" by construction. (1) matview trades freshness for read speed — the wrong trade against a freshness-first bar. (3) incremental table is always-fresh but adds write-amplification on every evaluation.
- **Scale:** at v1 (few rules, modest `rule_evaluated` volume), a live aggregate over a 30-day window with an index on `(rule_id, created_at)` is cheap. If volume later makes the live view slow, *that's* when a matview or incremental table earns its place — but YAGNI until measured.
- **Coupling to B:** (4) reads the structured `rule_evaluation_log` table (Decision B lean), not raw `audit_log` JSONB — which is why B leans toward a purpose-built table.

Rejected: (1) matview (no precedent, needs cron, freshness-wrong); (3) incremental table (write-amplification before it's needed). (2) derived-read is essentially (4) without the view abstraction — fine, but a named view is more reusable and matches `document_cards_view`.

**Open:** the exact window semantics (rolling 30×24h vs. calendar-day boundaries) — minor, defer to design-spec.

---

## 4. Decision B — `rule_evaluated` payload landing

**Candidates:** (1) extend `audit_log` with a general JSONB payload column; (2) **separate `rule_evaluation_log` table** purpose-shaped for `evaluation_trace`; (3) stuff into `before_state` (ADR-0023 reject baseline).

**Lean: (2) a separate `rule_evaluation_log` table** holding the structured per-evaluation record — `(id, org_id, rule_id, trace_id, match_classification, winning_branch_type, winning_branch_max_action, proposed_mutation_id, disposition, evaluation_trace jsonb, created_at)` — keyed for the windowed read (`rule_id, created_at`) and the "why did this fire" query.
- **Why not (1):** `audit_log` is the canonical append-only trail (ADR-0011 §1, INV-AUDIT-002), general across all mutations. Bolting a rule-specific JSONB payload onto it bloats every audit row's schema for one event type, and the windowed read (A) would do JSONB extraction over a huge mixed-purpose table. The reserved `action='rule_evaluated'` vocabulary (ADR-0023 §8.5) can still emit an `audit_log` row for the canonical trail (with `trace_id` linking to `rule_evaluation_log`), but the *queryable structured trace* lives in the purpose-built table.
- **Why not (3):** ADR-0023 explicitly rejected `before_state`-stuffing; `before_state` is the pre-mutation snapshot, semantically wrong for an evaluation trace, and the payload caveat named this as the failure mode to avoid.
- **Audit-trail relationship:** lean to emit BOTH — an `audit_log` row (`action='rule_evaluated'`, canonical append-only trail, shared `trace_id`) AND the `rule_evaluation_log` row (structured, queryable). The audit row satisfies ADR-0011 §1; the log table satisfies the read patterns. Surface the "one write or two" question for the design spec — a single `rule_evaluation_log` write with a derived audit projection is an alternative.
- **Scope check:** a new table = a Ring 2A migration, but it's squarely within rule-core scope (ADR-0023 named it a Ring 2 decision). **Not** a scope reach like `bundle_type` was. No CTO scope flag needed.

**Open:** whether `rule_evaluation_log` is the audit landing OR audit_log row + log table (the "one write or two" question); the `evaluation_trace` JSONB shape (the pure core's `MatchResult.evaluation_trace` defines it — design-spec detail).

---

## 5. Decision C — Evaluator scope at Ring 2A

**Lean: pattern-only at Ring 2A; defer temporal and inferential to Ring 2B.**
- Spec §5.3: `pattern` is pure deterministic field comparison ("no model in the loop, reproducible byte-for-byte") — the simplest. `temporal` needs schedule state + a system clock in the reproducibility contract; `inferential` needs model outputs + `pipeline_trace` (ADR-0007 Q30).
- **Justification against canvas scope:** the brief's v1 authoring examples are all pattern rules ("auto-post Amazon office supplies under $500" = field-equals vendor + field-in-range amount). Temporal/inferential rules don't exist at v1, so the evaluator evaluating only `pattern` costs the canvas nothing — there are no temporal/inferential rows to render or evaluate.
- The evaluator's structure (trigger lookup → branch walk → conflict resolution → `MatchResult`) is type-agnostic; pattern-only means implementing the pattern `condition_type` predicates (`field_equals`, `field_in_range`, `field_in_set`, `field_matches_pattern`, `source_trigger_equals`) and deferring the temporal (`schedule_matches`, `cadence_matches`) and inferential (`semantic_match_above_threshold`, `category_classification_matches`) predicate evaluators. The enums all ship (Ring 1); only the evaluation functions defer.
- Conflict resolution (§6.1 step 4) ships fully — it's type-agnostic (specificity → conservatism → recency → UUID).

**Open:** whether any guardrail (`otherwise_if`) branch evaluation is in Ring 2A or defers (spec notes guardrail audit events activate with the first `otherwise_if` evaluator). Lean: include `primary` + `otherwise_if` branch evaluation (both are pattern-evaluable); `otherwise` stays reserved post-v1 per §5.2.

---

## 6. Decision D — Agent Ladder gate scope at Ring 2A

The gate (spec §6.1 steps 7–8 / `agent_autonomy_model.md` §7): cap `winning_branch_max_action` by `current_rung` → per-transaction limit → daily aggregate → track-record health → `effective_action`.

**Lean: ship the gate pipeline with `current_rung` capping live; per-transaction / daily-aggregate / track-record-health as defined-but-inert stubs.**
- **The v1 asymmetry:** v1 emits only `current_rung = 'always_confirm'` (ADR-0023 / spec). Capping by `always_confirm` forces every outcome to human approval (`suggest_with_required_approval`) regardless of the branch's `max_outcome_action`. So at v1 the capping step is "trivially active" — it always caps to always_confirm — and the other three checks have nothing to gate (there's no rung above always_confirm where per-txn/daily/health limits would bind). They're reserved-but-inert safety surfaces that activate post-v1 when promotion to `notify_and_auto_post`/`silent_auto` exists.
- This mirrors Ring 1's substrate-only-v1 posture: ship the structure, activate what v1 exercises, stub what post-v1 needs. The gate pipeline + capping table land; the three downstream checks are named stubs with explicit "activates post-v1" markers.
- **Don't-resurrect-`autonomy_tier` (standing constraint):** the gate reads `rule_registry.current_rung`, never a resurrected `vendor_rules.autonomy_tier` (dropped in the migration). Honored.

**Open:** the capping table's exact values are "owned by Ring 2 ratification" (§5.5/§6) — a design-spec item. The gate's home is `agent/policies/agent-ladder/` (orchestrator layer), reading canonical rung/limit state — confirm the gate is orchestrator-layer, not pure-core (it is, per §6.1.1: pure core returns `MatchResult` with no `effective_action`).

---

## 7. Decision E — Stage 1 canvas scope at Ring 2A

The brief §4 specifies the full Stage 1: list view (name, scope, rung badge, lifecycle badge, 30-day track record, last winning match, sort/filter) + 4 row actions (promote-modal, demote-one-click, rename, retire-with-confirm) + promotion-ceremony modal + behavior-not-logic detail surface.

**Lean: ship the brief's Stage 1 in full — it is already scoped as the minimum.** The brief explicitly says "the full description *is* the minimum" (Stage 2 = flowchart authoring; Stage 3 = system-proposed rules). So Decision E isn't "trim the canvas"; it's "build the brief's Stage 1 against the substrate."

What that requires, and the deferrals:
- **List view + detail surface** read `rule_registry` ⋈ `rule_track_records` ⋈ the Decision-A windowed view. Pure read; works under RLS for operators (HEAD pass (j)). Ships.
- **Row actions** (promote/demote/rename/retire) write `rule_registry` via `ruleRegistryService` — controller-only per RLS. Ship; they're the canvas's only writes.
- **Recent matches** in the detail surface read the `rule_evaluation_log` (Decision B). Coupled to B landing.
- **The Four Questions are NOT canvas scope** — they render on chat proposal cards (MatchResult + effective_action), gated on the evaluator + gate + Logic Receipt path (HEAD pass (h)). The prompt framed the Four Questions as canvas content; the brief is explicit they're the chat proposal surface. **Flag/correction:** the canvas detail surface and the Four Questions share `rule_track_records` fields but are different consumers. The canvas ships independent of the Logic Receipt path; the Four Questions chat rendering is part of the evaluator's chat-integration and carries the INV-AGENT-002 dependency. Surface the Logic Receipt path as a Four-Questions prerequisite, not a canvas prerequisite.

**Genuine deferral question:** does Stage 1's **promotion-ceremony modal** ship at Ring 2A given v1 only has `always_confirm`? Promotion to `notify_and_auto_post` requires the gate's post-v1 activation (Decision D). If nothing can be promoted at v1, the promote action + modal are inert UI. Lean: ship the modal (it's the controller's primary tuning affordance and the brief centers it), but its target rungs are gated by the same post-v1 activation as Decision D's downstream checks. Surface: promote-modal-now (inert target) vs. defer-with-demote/rename/retire-only. Leans surfaced, not landed — product/UX + the gate-activation timing decide.

---

## 8. Decision F — Q-RC-AT-2 UI label (route to product/UX, do not decide)

Semantic pinned (brief): "the most recent evaluation in which the Rule won conflict resolution (`winning_rule_id = this.rule_id`)." Stored as `rule_track_records.last_winning_match_at` (shipped Ring 1). The label is the open product/UX naming sub-question.

**Constraints (collisions to avoid):** "last matched" collides with `also_matched_rules` (where "matched" includes losers); "last applied" collides with ledger-posting (gated by `effective_action`, ≠ winning conflict resolution).

**Candidates to route to product/UX** (brainstorm proposes, does not pick):
- **"last fired"** — terse, technical; "fire" already used for guardrail (`guardrail_fire_count`), so mild overload but in-vocabulary.
- **"last selected"** — matches conflict-resolution language ("selected the winner", §6.1 step 4) without colliding with "matched".
- **"last won"** — precise to the pinned semantic ("won conflict resolution"), slightly jargon-y.
- **"last active match"** / **"last decisive match"** — descriptive, collision-free, wordier.

Routing note: this is a product/UX decision the Ring 2A design spec records once chosen; the brainstorm only narrows the field and names the collisions.

---

## 9. Decision G — Service-layer integration (call graph)

All three services are greenfield (HEAD cross-cutting finding). Ring 2A authors them and wires the first callers. Dependency direction per spec §7 / ADR-0020: **agent/orchestrator → services → repositories + pure core; core imports nothing.**

Proposed call graph:
- **`ruleEvaluationService`** (service layer; spec §7 step 1 names it) — on an evaluation trigger: reads candidate rules via `ruleRegistryService` read methods + TrackRecord snapshots via `ruleTrackRecordService` read methods → assembles inputs → calls the pure-core evaluator at `core/rules/` → returns `MatchResult` to the orchestrator. **No DB writes.**
- **Orchestrator (agent)** → applies the **Agent Ladder gate** (`agent/policies/agent-ladder/`) to the `MatchResult` → `effective_action` → dispatch. On disposition, the gate writes track-record counter updates via **`ruleTrackRecordService`** (service_role — `rule_track_records` user-writes are `USING(false)`, so counter writes are service-path only; HEAD pass (j)).
- **`ruleRegistryService`** — sole writer for `rule_registry` (creation on approval; lifecycle/rung mutation on promote/demote/retire). Owns identity-anchored reads (the canvas join). **Co-creation rule (Ring 1 Decision 5, standing):** `ruleRegistryService` creates the `rule_registry` row AND the `rule_track_records` row in one transaction; `ruleTrackRecordService` is the sole *updater* after creation.
- **`vendorRuleService`** — sole writer for `vendor_rules`. Creating a *vendor* rule is a cross-service transaction: `ruleRegistryService.create` (registry + track_records co-created) + `vendorRuleService.create` (the `vendor_rules` child, composite FK `(rule_id, org_id)`). **Name this orchestration** so the co-creation + child-creation sequence isn't rediscovered — a creation orchestrator (or `ruleRegistryService.createWithVendorMaterialization`) coordinating the two single-writers in one txn.
- **Canvas** — read-only cross-table join via `ruleRegistryService` (identity-anchored reads) + the Decision-A windowed view.

**Open:** exact service-file boundaries and the creation-orchestration naming (design-spec detail); whether `ruleEvaluationService` and the gate are one orchestrator step or two.

---

## 10. Decision H — Rule-creation entry point

**HEAD pass + brief finding (corrects the prompt's framing):** the prompt sketched (1) admin-only canvas-seed, (2) agent-proposal, (3) both. The brief §5 is explicit: **"Stage 1 has no form-based authoring. The agent is the primary authoring surface at v1."** Controller says in chat → agent's drafting API produces a typed Rule → surfaces as a proposal-shaped affordance → controller approves → registry mutation via `ruleRegistryService`/`vendorRuleService`, landing at `lifecycle_state=active`, `current_rung=always_confirm`. So the prompt's candidate (1) admin-form-seed **contradicts the brief** — there is no form-based authoring surface at v1.

**This is the biggest scope/sequencing question for Ring 2A.** The agent-drafting path is greenfield (HEAD pass (H): no `proposeRule`/`rule_refinement` infra; the general `ProposedMutation`/`proposalBuilder` infra exists for documents/bills as a pattern to mirror). Building it = drafting API + the closed-grammar Rule object construction + the chat proposal affordance + the approval→create path. That's substantial — comparable to a sub-arc on its own.

**Tradeoff:**
- The evaluator + gate + canvas + read-path + payload-landing is **already a large Ring 2A.** Adding the full conversational authoring path may overload one ring.
- But without a creation path, rules only exist via test/dev seed — the evaluator/canvas have nothing real to act on in production.
- Note: the *rule-refinement loop* (§9.3 — agent observes audit corpus, proposes successor) is **Ring 3 / post-v1** (Explore confirm). That's distinct from *creation* (controller-initiated chat drafting, brief §5 = v1). Don't conflate; refinement is not Ring 2A.

**Lean (surfaced as a sequencing proposal, not landed):** split Ring 2A —
- **Ring 2A-core:** evaluator (pattern-only) + gate (capping live) + Stage 1 canvas (read + controller row actions) + Decision-A view + Decision-B log table. Exercises the substrate against rules seeded by test/dev fixtures (explicitly *not* a product creation surface).
- **Ring 2A-authoring (or 2B):** the agent conversational-drafting → approval → create path (the brief's v1 authoring surface). Distinct, substantial; mirrors the existing `proposalBuilder` pattern.

This keeps Ring 2A-core shippable and testable without conflating the authoring-surface build. **Escalate the split as a chat decision** before the design spec — it materially sizes Ring 2A. (The alternative — one big Ring 2A including authoring — is viable but large; the CTO sizes it.)

---

## 11. Open questions

Surfaced by the HEAD pass / needing escalation before the design spec:

1. **Ring 2A scope split (escalate — sizes the arc).** Decision H: core (evaluator + gate + canvas + view + log) vs. authoring (agent conversational-drafting path) as one ring or two. Biggest open item.
2. **Four Questions ↔ Logic Receipt dependency (escalate).** The chat Four Questions rendering depends on the Logic Receipt write path (INV-AGENT-002, reserved-not-registered). Is registering the Logic Receipt path Ring 2A scope (it's the evaluator's chat-integration output) or a separate prerequisite? The canvas does **not** depend on it; the chat proposal rendering does.
3. **Decision B "one write or two"** — `rule_evaluation_log` as the sole evaluation landing vs. `audit_log` row (canonical trail) + `rule_evaluation_log` (queryable). ADR-0011 §1 (audit-canonical) pulls toward two.
4. **Promotion-modal at v1 (product/UX + gate timing).** Decision E: ship the promote affordance with inert post-v1 targets, or defer until the gate activates rungs above `always_confirm`?
5. **Q-RC-AT-2 label (product/UX).** Decision F — pick from the routed candidates.
6. **Capping-table values (Ring 2 ratification).** Spec defers the rung→action capping table values to Ring 2; the design spec ratifies them.
7. **Test-update-pass finding (out of scope here, flagged):** none surfaced beyond the closed test-update pass — `types.ts` is regenerated and the suite is green at HEAD; no Ring-2A-blocking staleness.
8. **No scope reach beyond rule-core** detected (unlike `bundle_type`'s reach into ADR-0012). `rule_evaluation_log` is in-scope (ADR-0023 named it a Ring 2 decision). If the authoring path turns out to need agent-orchestrator changes beyond rule-core, that's the surface to watch — flag at design-spec time.

---

*Brainstorm pass. Next likely: a pre-ADR verification pass on the open questions (esp. #1 scope split, #2 Logic Receipt dependency), then a Ring 2A design spec. Not committed; not pushed.*
