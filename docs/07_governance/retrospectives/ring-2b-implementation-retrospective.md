# Ring 2B implementation arc — retrospective

**Arc:** Ring 2B implementation (tenth arc), the fresh second arc against ratified
ADR-0027. **Anchor:** `origin/staging` = `90bf2c38` (Ring 2B design-authoring closeout).
**Scope-lock:** `docs/09_briefs/post-mvp/2026-05-30-ring2b-impl-scope-lock.md`.
**Date:** 2026-05-30.

## What shipped

A1a substrate-only (shadow/diagnostic, no live auto-post). Six commits:

1. **Scope-lock** (`8d9ae98c`) — single-arc A1a; four deferred decisions adjudicated.
2. **Migration `20240169`** (`a5aa7cd6`) — `branch_type` enum + `rule_branches` +
   `rule_conditions` + RLS + §5.1 logic-freeze triggers + indexes/REVOKEs.
3. **Migration `20240170`** (`81edb600`) — `create_vendor_rule_atomic` extended to
   co-create branches/conditions (`p_branches`) + `types.ts` regen.
4. **`ruleBranchService`** (`fa0baa30`) — production `branchSource` (sync-closure) +
   v1 branch derivation + condition_value validation boundary.
5. **Seam-1 shadow** (`22dc6db7`) — `shadowRuleEvaluation` wired into `ingestDocument`;
   `evaluateAndDispatch` ctx widened to admit the system actor.
6. **Close** (this commit) — INV-RULE-004 registration + spec footnotes + INDEX +
   retrospective + friction-journal.

Pattern (vendor) rules now match end-to-end in production **shadow**: real branches feed
the shipped-but-inert evaluator; the Logic Receipt records winners; nothing auto-posts.

## Load-bearing decisions (and why)

1. **Two-migration green-sequencing split.** The scope-lock anticipated one migration
   `20240169`; implementation split the RPC extension into `20240170` because the 3-arg→4-arg
   signature change is a DROP+CREATE that breaks `ruleCreationOrchestrator` until its caller
   updates. Landing the additive tables first (`20240169`) keeps both commits green rather
   than banking a red intermediate. Then `p_branches JSONB DEFAULT '[]'` made even the caller
   flip unnecessary — the existing 3-named-arg call resolves to the 4-arg function unchanged,
   creating a branchless rule (today's inert behavior) until branch-authoring lands. The
   default decoupled the storage-WRITE capability from branch DERIVATION cleanly.

2. **INV-RULE-004 hybrid scope (the DELETE fork).** The §5.1 logic-freeze trigger blocks
   UPDATE + TRUNCATE **all-path** (fires for `service_role`, stronger than INV-RULE-001) but
   **deliberately does NOT block DELETE**. Disk evidence drove this: `rule_registry` is
   delete-able and every child cascades (`ON DELETE CASCADE`), so an all-path BEFORE DELETE
   on a cascade-child of a deletable parent is the **CA-65 trap** (append-only DELETE triggers
   silently rejecting cascades, breaking the `rule_registry`-delete test-cleanup pattern). The
   advisor's initial "BEFORE UPDATE/DELETE fires even for service_role" phrasing was refined
   against disk to UPDATE+TRUNCATE-only; DELETE is user-path RLS + service-discipline (the same
   model as INV-RULE-001). The cascade-cleanup was then proven by a real test, not just the
   rolled-back probe. **Lesson:** the canonical immutability pattern (journal) achieves
   full-append-only by making the *parent* delete-blocked too — that doesn't transfer to a
   mutable-parent child, and "column-immutability trigger" (the ADR's exact words) means
   UPDATE, not DELETE.

3. **Branch derivation (forward-flag F) — minimal-but-complete given the data.** The spec
   gives worked examples (§11.1/§11.2) but no derivation algorithm — genuinely underspecified.
   The sole writer populates only `vendor_id` + outcome params, so `field_equals(vendor_id)` is
   the maximal data-grounded condition. Richer derivation (amount bounds, patterns, guardrails)
   needs learned data absent on disk → correctly defers to the workflow arc. Option B (defer all
   derivation, prove wiring via fixtures) was rejected: it would make the production shadow
   observe nothing, gutting the ADR's stated enablement.

4. **`evaluateAndDispatch` ctx widening** (the one shipped-Ring-2A touch). `ctx: ServiceContext`
   → `ServiceContext | SystemActorServiceContext` to admit the ingest pipeline's system actor.
   Additive + behavior-preserving (ctx read only as `trace_id`; threaded to union-accepting
   withInvariants services). Chosen over a system-actor→verified adapter, which would fabricate
   a verified caller and mask the genuine system-actor provenance (`caller.user_id=null` is the
   authorization discriminant). Within ADR-0027 Decision 5's "thin Seam-1 call" scope.

5. **Operator-gated fiduciary stance.** `max_outcome_action=auto_post_at_rung_2` (the v1 derived
   branch's ceiling) was escalated to the operator as a fiduciary-autonomy call and selected
   explicitly via the AskUserQuestion "Action ceiling" gate. The advisor (read-only seat)
   declined to cast it and could not see the widget tap — so the provenance was recorded plainly
   in code + commit message. The rung gates the effective action (suggest-only at
   `always_confirm`) and this arc is shadow, so it is reversible recorded-intent.

## Process observations

- **Surface-before-commit per chunk held throughout.** Each commit (migration / RPC / service /
  Seam-1) was drafted, locally verified, surfaced for advisor adjudication against disk, then
  committed on greenlight. The advisor caught real things: the over-broad DELETE phrasing, the
  card-only-enforced-at-the-caller subtlety (proposalToContext hardcodes the eval trigger), the
  ceiling-provenance gap. The executor caught real things the advisor (no runtime/widget view)
  couldn't: the CA-65 cascade trap from the actual test-cleanup pattern, the `p_branches` default
  caller-compat, the empirical probe results.

- **Belt-and-suspenders where the house style calls for it.** Exactly-one-primary is enforced
  twice (DB partial unique index for ≤1; RPC for ≥1). The eval-subset is a DB CHECK with a
  non-empty guard (`<@` alone admits `{}` = dead branch). The immutability trigger is
  belt-and-suspenders over RLS `USING(false)`.

## Three-condition push gate

- **C1 (test-suite health).** `pnpm test:full` at HEAD — see the close commit message for the
  summary line. Per-commit gates were green throughout (typecheck + targeted suites + floor).
- **C2 (doc-sync reconciled).** INV-RULE-004 registered: leaf (`ledger_truth_model.md`) → code
  annotation (`20240169` + `ruleBranchService`) → rollup row (`invariants.md`, 24→25) →
  control-matrix row (`control_matrix.md`) → bidirectional-reachability diff clean (INV-RULE-004
  in both sets). ADR-0027 frontmatter `invariants:["INV-RULE-004"]` + `adr:check` green.
  `types.ts` regenerated. §5.10 structure-vs-parameter footnote. INDEX 0026 line added
  (prior-arc omission) + 0027 registration corrected.
- **C3 (governance closeout).** This retrospective + friction-journal arc-scope entry. No
  convention graduated this arc (see Carry-forwards).

## Carry-forwards (T4 — adjacent, not absorbed)

1. **DEFINER hygiene flag** — `create_vendor_rule_atomic` is SECURITY DEFINER while
   `write_journal_entry_atomic` is INVOKER; re-touched this arc, flag re-surfaced, resolution
   NOT taken (spans create+approve, T4-adjacent).
2. **Faithful `proposal_type` derivation** — the Seam-1 constructs a `post_bill` mutation
   regardless of the card's actual `proposed_action` (harmless at v1: the derived branch is
   vendor-only, proposal-type-agnostic, and `proposal_type` is not a logged column).
3. **Richer branch derivation** (amount bounds, `field_matches_pattern`, `otherwise_if`
   guardrails per §11.2) + faithful per-type branches — workflow arc, needs learned data.
4. **§6.5 bundle evaluation** — card-only this arc; bundle (envelope + per-child) + its Seam-1
   context mapping is a deliberate follow-on.
5. **condition_value validators** — `field_in_range` temporal (date-string) bounds;
   `source_trigger_equals` closed-set validation (banked in-code, not v1-exercised).
6. **Existing branchless vendor rules** — newly-created rules get branches; pre-arc rules stay
   branchless. A backfill data-migration if they accumulate before the workflow arc.
7. **α/β late-emerging-substrate codification** — stays DEFERRED (obs-grain N=1). The
   derivation-underspecification this arc is a distinct shape (spec-gives-examples-not-algorithm),
   not the same root cause; no N=2 graduation forced.

## Arc character

A faithful build of a ratified design, with the discipline operating in both directions:
disk refined the ADR's prose (the DELETE scope, the `p_branches` default), and the operator
held the one genuine fiduciary call (the action ceiling). The shadow-not-live posture (A1a)
made every choice reversible recorded-intent — the right shape for a substrate-then-consumer
split where the consumer (live auto-post) waits on an unwritten workflow spec.
