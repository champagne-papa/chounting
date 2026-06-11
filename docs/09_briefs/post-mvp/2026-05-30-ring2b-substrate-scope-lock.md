# Ring 2B substrate — scope-lock (design-authoring arc, ninth arc)

**Date:** 2026-05-30 · **Anchor:** `origin/staging` = `8680e323` (Ring 2A-authoring
implementation closeout) · **Lock:** `ring-2b-substrate-8680e323`.

Scope-locked after a HEAD-pass that verified the advisor-drafted opener against disk
(three spec-§10-vs-shipped-code drifts already caught in reconnaissance: Ring 1
shipped, Ring 2A evaluator shipped, the orchestrator shipped-but-unconsumed). This
record is arc-canon for scope; the ADR (next) carries the design decisions.

## What this arc is

Ring 2B = **make pattern (vendor) rules actually win on the drag-drop-bill scope**, by
landing the substrate the shipped-but-inert evaluator needs. The matching engine
(`core/rules/`), `ruleEvaluationService.evaluate`/`recordEvaluation`, and the agent-layer
`evaluateAndDispatch` coordinator are **already shipped** (Ring 2A-core); they are
structurally inert in production because the `branchSource` seam defaults to
`noBranchSource = () => []` (branchless rules → `almost_match`/no winner) and
`evaluateAndDispatch` has **no production caller** (test-exercised only, via
`ruleEvaluateAndDispatch.integration.test.ts`).

## Locked scope (A1a)

1. **Branch/condition STORAGE substrate** — the genuine greenfield: a migration + ADR
   for where each rule's branches + ordered conditions + per-branch `max_outcome_action`
   physically live (currently absent; predicate schema reserved §4/§5.5).
2. **A production `branchSource`** — replace the `noBranchSource` no-op, sourcing real
   branches from (1).
3. **A thin Seam-1 call** to the existing `evaluateAndDispatch` (not building it).
4. **`default_account_id` resolution** (Ring 2A OQ-2 defer) **+ vendor-name resolution**.

**Out of scope (guardrails):**
- **No temporal/inferential evaluator-building.** `predicates.ts` implements the six §5.5
  *pattern* conditions only; the four temporal/inferential are absent-by-design
  (`branchEvaluator` throws on them). Per §10 they belong to *separate later workflow
  ships* (recurring-transactions / novel-item-categorization) — the code's "defer to
  Ring 2B" label is a catch-all for "later," broader than this arc.
- **No live auto-post wiring (A1a).** Ring 2B is shadow/diagnostic-capable (§9.2) but does
  NOT live-wire auto-posting; the drag-drop-bill go-live defers to a later workflow arc
  once `docs/02_specs/document-v2-workflow.md` exists (absent on disk).

## Arc shape — A1a + two-arc (RI-7 ratified)

RI-7 volume/framing estimate — **5 ADR-resolving framings** (A2-storage-shape /
A2-normalized-vs-JSONB / §5.10-reconciliation / single-writer / A3; A1 the arc-shape
decision is excluded as circular — it is the split being decided, not a workload item) —
clears the ≥5 / Path-C bar on its own, and with ~6–10 files / 1–2 migrations / types.ts
regen / novel-logic the volume approaches chunk-3's empirical upper bound and trips
Path-C/split conditions.
→ **design-authoring arc (ADR ratified) → separate implementation arc.** This
(design-authoring) arc produces the ratified ADR; implementation opens fresh against it,
Path-C internally if needed.

A1a (substrate-only) is disk-evidenced two ways: the orchestrator is already built +
test-proven (H3), and there is no workflow spec for a live call to couple to (H5). A1b
(include live wiring) is disfavored — it pulls in an unwritten workflow spec.

## ADR open questions (the design-authoring arc resolves these; ADR-before-code)

- **A2 storage shape.** Lean: **normalized registry-keyed child tables** — `rule_branches`
  + ordered `rule_conditions` keyed by `rule_id` (= `rule_registry.id`), parallel to the
  shipped `rule_track_records`. Grounding: §5.1 logic is immutable post-`active`
  (write-once-then-frozen; amendment = retire-and-create-new; no `rule_version_id`), and
  the Branch contract is **uniform** across rule types (`core/rules/types.ts` — no
  rule_type-specific fields), so per-domain branch storage would duplicate identical
  structure. JSONB is a live tradeoff (assembly simplicity; §5.1 write-once removes its
  usual downside; the §5.7 `closest_branch_id`/`failed_conditions` are computed at runtime
  from in-memory `Branch[]`, *not* queried from storage — so that is NOT a point against
  JSONB). Lean normalized on relational-fiduciary convention + per-row immutability-trigger
  granularity (ADR-0010 three-layer); do not treat JSONB as disqualified.
- **§5.10 reconciliation (α-flavored doc-internal inconsistency, ADR-scoped).** §5.10's
  intro says domain tables "hold the type-specific FK structure and Branch / Condition /
  Action details," but the allocation says `vendor_rules` owns "vendor-specific scope only"
  (vendor_id, default_account_id, bundle_type, legal_entity_id, unique constraint) and
  never places branches on the registry — so the spec, taken whole, does not say where
  branches live. The ADR's reconciliation: branch/condition **structure** is uniform →
  registry-keyed child tables; action **type** (`max_outcome_action`) is uniform → on the
  branch; action **domain parameters** (`default_account_id`, vendor-name) are
  domain-specific → already on `vendor_rules` (scope item 4). The §5.10 intro conflates
  structure with parameters; the ADR carries the reconciliation + flags a §5.10 intro
  touch-up. (This is concrete + ADR-scoped; it does NOT touch the deferred α/β codification
  — graduate nothing.)
- **Single-writer for the new tables.** By §5.10's disjoint-by-table discipline, a new
  `ruleBranchService` (or `ruleRegistryService` if branches are treated as registry
  substrate) owns `rule_branches`/`rule_conditions`. A2-adjacent; ADR decides.
- **A3 — SECURITY-DEFINER forward-flag extends** if branch-authoring adds atomic write RPCs
  (create/approve_vendor_rule_atomic lineage). Carry it.

## Parked carry-forwards (not this arc's scope)

- **α/β codification amendment** — stays DEFERRED. The phantom-arc/assumed-absent-but-present
  sub-shape is observation-grain N=1 (all reconnaissance catches share one root cause:
  Ring 2A-core front-ran the staged §10 plan). Graduate nothing; pending cross-context N=2.
- **Spec staleness touch-ups (footnote-grade; won't bite adr:lint):** §3's four-item "does
  not exist" table is now false (mark reconciled-by-ADR-0023); §11.1's "INV-AGENT-002 Logic
  Receipt emits" should be INV-RULE-001/`rule_evaluation_log` per §5.7 / ADR-0025 §8.
- **modules-taxonomy** — likely third adr:lint bite when the new ADR frontmatter lands;
  fold-vs-split adjudicated at the ADR pass.

## HEAD-pass findings (disk-verified this session)

- Anchor `git ls-remote origin staging` = `8680e323` (authoritative); tree clean.
- Ring 1 shipped: `20240163` (rule_registry, rule_track_records, ADR-0017 drift,
  autonomy_tier→rule_autonomy_rung rename-and-drop). ADR-0023 is the Ring 1 ADR.
- Evaluator: six pattern conditions live + 3-tier weights; four temporal/inferential
  absent-by-design (`branchEvaluator` throws).
- `evaluateAndDispatch`: shipped, full evaluate→gate→log→counter flow; **zero `src/`
  callers** (one integration test; gate.ts is a comment). → item-3 = thin Seam-1 call.
- `document-v2-workflow.md` absent → A1a.

## Next

Author the ADR (next ADR number, likely 0027) carrying the A2 storage shape + the §5.10
reconciliation + single-writer + A3. Hold for the advisor's ADR-draft adjudication (§5.10
wording + storage shape against disk) before any migration or code.
