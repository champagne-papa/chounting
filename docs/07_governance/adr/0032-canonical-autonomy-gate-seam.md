---
id: "0032"
title: "Canonical Autonomy Gate Seam — single live-path recording seam; recording at V1, deciding post-V1"
status: ratified
date: "2026-06-02"
deciders: [phil]
modules: [agent, db]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0007", "0020", "0024", "0027", "0028", "0029", "0030", "0033"]
invariants: []
---

# ADR-0032: Canonical Autonomy Gate Seam

## Status

Ratified 2026-06-02 by CTO (V1 governance arc, Wave 3, reservation R1).
Reserved by the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4 / §6). Design spec:
`docs/09_briefs/v1/specs/2026-06-01-adr-0032-canonical-autonomy-gate-seam-design.md`;
ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-02-adr-0032-ratification-package.md`.

Substrate-reserve + live-recording ADR. Reserves a single live-path recording seam and a net-new
attempt-grain `autonomy_gate_log`. Ships no migration in the ratification act (the Wave-3 build
follows). Registers no invariant; grants the gate no commit authority at V1.

## Date

2026-06-02

## Triggered by

The V1 governance arc, Wave 3. The charter (§6) reserves R1 as the Canonical Autonomy Gate Seam:
"Gate records on the *live* commit path at a *single* seam (distinct from the pre-commit shadow
eval, which cannot influence the commit), so recording → deciding is a config flip — V2 Track 1.1
governed auto-commit." Today nothing in production records the gate's disposition for an autonomous
commit attempt: the shadow seam is OFF and auto-commit is disabled (Wave -1 bleed-stop). This ADR
makes the gate's disposition a live, attempt-grain production record — without granting the gate any
commit authority at V1.

## Context

The ingest pipeline's Stage-7 commit composite (`ingestDocument.ts:456`) branches on
`ProposalResult.kind`. Two branches are ledger-committing — `proposed_entry_card`
(`ingestDocument.ts:485`) and `proposed_mutation_bundle` (`:521`) — and both **park**
(`status:'parked_unposted'`, `:496-501` / `:526-531`) since the Wave -1 A-now bleed-stop
(ADR-0007 Q78 V1-rescoping, `de607fdb`) disabled the ungoverned auto-post; the preserved
`commitProposed*` fns (`:552` / `:600`) are intentionally not called. `proposed_attachment_card`
(`:504`) is non-ledger (ADR-0011 §11) and returns `committed`.

The autonomy gate (`gate.ts:36`, `gate(matchResult, ruleRegistryRow, limitContext): ActionType`)
composes rule-match + caps + limits + track-record into an `effective_action`/`Disposition`
(`shared/rules/disposition.ts`). The shadow seam (`shadowRuleEvaluation.ts:57`, called at
`ingestDocument.ts:445`) already evaluates rules + records to `rule_evaluation_log`, but is
positioned **before** the decision branch and deliberately powerless (default-OFF, fail-safe,
void-return). Invariant 5 (`charter:54-60`) is the load-bearing constraint: no autonomous commit at
V1 — matched proposals park; Gate-driven auto-commit is post-V1, eval-gated.

The spine tension: the charter says "gate records on the LIVE commit path," but at V1 nothing
autonomous reaches the `journalEntryService.post` chokepoint (`:179`) — proposals park before it,
and the chokepoint sees only human posts. The only placement consistent with *live path* AND *one
result per autonomous attempt* AND Invariant 5 is the decision branch itself.

## Decision

**D-0032.1 — Single seam at the two ledger-committing decision branches.** The seam is the Stage-7
commit-composite decision at `proposed_entry_card` (`ingestDocument.ts:485`) and
`proposed_mutation_bundle` (`:521`). At each branch the build wires, in order: obtain the gate
disposition → record the attempt result → park (unchanged). Rejected: the seam at
`journalEntryService.post` / `write_journal_entry_atomic` (`:179`) — at V1 autonomous traffic parks
before it and only human posts reach it, so it would record human posts as "attempts" and record
nothing autonomous. `proposed_attachment_card` (`:504`) is non-ledger and is not a seam.

**D-0032.2 — Recording-not-deciding (the load-bearing V1 control).** At V1 the gate computes and
records a disposition; the **park is unconditional and is NOT a function of that disposition**
(Invariant 5). The record holds the gate's `effective_action`/`gate_disposition` (what the gate
would do) and a separate `realized_outcome` (what happened) — **always `parked` at V1**, regardless
of `gate_disposition`. This makes the control disk-checkable: no V1 row may show a `realized_outcome`
that varies with `gate_disposition`. Any "the gate decides" framing is out of scope at V1.

**D-0032.3 — Net-new attempt-grain `autonomy_gate_log`; not `rule_evaluation_log` reuse.** The seam
records to a net-new append-only table — **one row per autonomous commit attempt** — holding `id`,
`org_id`, the attempt key (`trace_id` + `source_document_id`), the seam branch, `effective_action`,
`gate_disposition`, `realized_outcome`, `created_at` (exact columns pinned at the first migration).
Rejected: reuse `rule_evaluation_log` — its grain is row-per-rule (not per-attempt), it is a
conceptually distinct artifact (rule-evaluation log vs. autonomy-gate log), and a separate table
gives `INV-AUTONOMY-GATE-001` a clean home (the Wave-1/2 "distinct logs, one `trace_id`, none
subsuming another" discipline).

**D-0032.4 — Obtain the disposition via the read-only evaluate path; never `evaluateAndDispatch`.**
The build obtains the disposition at the branches via `ruleEvaluationService.evaluate` (read-only) →
`gate()` + `dispositionForAction()` (pure). It must **not** call `evaluateAndDispatch`
(`ruleEvaluationOrchestrator.ts:91-100`), which writes `rule_evaluation_log` and would double-record.
The gate inputs are reachable at the branches: `matchResult` from `evaluate` (proposal +
`vendorMatch.vendor_id` + `input.org_id`); `ruleRegistryRow` from `ruleRegistryService.get`;
`limitContext = {}` (v1 stub).

**D-0032.5 — Distinct from the shadow seam.** R1 is a separate call site at the two ledger branches —
not a re-enabling of `shadowEvaluateRules` or its `RING2B_SHADOW_EVAL` flag. The distinction is
architectural position + trajectory, not behavior: shadow is before the branch, default-OFF,
diagnostic, positioned to be powerless forever; R1 is at the branch, on in production, positioned so
a config flip grants commit authority post-V1. No double-record: shadow → `rule_evaluation_log`
(rule-grain), R1 → `autonomy_gate_log` (attempt-grain).

**D-0032.6 — Recording → deciding is a config flip at the same seam.** The seam computes the
disposition identically in both modes; only the act-on-it step is gated. V1: `compute → record →
park` (unconditional). Post-V1 (V2 Track 1.1): `compute → record → act` (disposition drives
park-vs-commit, re-wiring to the preserved `commitProposedEntryCard` / `commitProposedMutationBundle`
at `:552` / `:600`). The exact flag shape (per-rule rung gate vs. global flag vs. config row) is a
build detail; the per-rule rung gate is the lean (autonomy ladder is rule-attached, ADR-0029; the
in-branch comment names "rung + confidence + eval", `:493-495`).

**D-0032.7 — Live recording producer at V1; org-scoping designed now.** Wave 3 is the first V1 wave
to write records in production (via the RLS-bypassing `adminClient`). Binding safety: every
`autonomy_gate_log` write sets `org_id` from the org-verified `input.org_id` / `document_case`
(validated by `withInvariants`, `:68-82`), never a caller-supplied id (the ADR-0033 IDOR lesson);
read surfaces ship `security_invoker = true` (the `rule_evaluation_30d_view` precedent); the table is
append-only (user-path RLS `USING(false)`; service-path single-writer discipline). The scope/risk is
consciously accepted and re-gated at the build read-back before anything writes live.

**D-0032.8 — Reserve `INV-AUTONOMY-GATE-001`, register nothing.** Recording ≠ enforcing ⇒ ADR-0021
register-on-enforcement ⇒ `INV-AUTONOMY-GATE-001` is named but registered by no one at Wave 3 (the
Wave-1 D-0028.8 / Wave-2 D-0033.8 parity). It registers when the gate gains commit authority
(post-V1 deciding). Eventual predicate (recorded for the body, registered then): *the autonomy gate
records exactly one disposition per autonomous commit attempt at the single canonical seam, and at
V1 that record never decides the commit.*

**D-0032.9 — Sequencing.** Recording at V1 (Wave 3); deciding (governed auto-commit) post-V1 (V2
Track 1.1), gated on the eval harness. Wave 6 routes parked proposals `received → needs_review` for
human approve→post under the human's identity (Invariant 5); `autonomy_gate_log` is the recording
substrate the V2 eval harness reads. ADR-0024 owns `rule_evaluation_log` (rule-grain, referenced not
reused). ADR-0027 owns the shadow seam (distinct). ADR-0007 Q78 owns the system-actor commit auth
(intact; exercise disabled at V1).

## Consequences

- The gate's disposition becomes a live, auditable, attempt-grain record on the real ingest path for
  the first time; recording → deciding is a genuine config flip at one seam (no re-architecture
  post-V1); the seam is provably distinct from the powerless shadow seam; Invariant 5 holds by
  construction (unconditional park) and is disk-checkable (`realized_outcome` never varies with
  `gate_disposition` at V1).
- Live-producer cost/risk: Wave 3 ships real code that writes in production via the RLS-bypassing
  `adminClient` — the first V1 wave to do so. Mitigation: D-0032.7 org-scoping treated as a build
  commit precondition + re-verified at the build read-back.
- Carried risk: the seam must never let `gate_disposition` gate park-vs-commit at V1; the build
  review verifies the unconditional park survives in code.
- Doc surface: adds the ADR; reserves `autonomy_gate_log`; names `INV-AUTONOMY-GATE-001` in prose. No
  invariant-doc registration at Wave 3 (nothing enforces).

## Alternatives considered

- **Seam at the `journalEntryService.post` chokepoint.** Rejected — at V1 autonomous traffic parks
  before it; it would record human posts as attempts and nothing autonomous (false grain), and the
  config flip re-wires the decision branch, not the chokepoint.
- **Reuse `rule_evaluation_log` as the record.** Rejected — row-per-rule grain ≠ one-row-per-attempt;
  conceptually distinct artifact; a dedicated table gives `INV-AUTONOMY-GATE-001` a clean home.
- **Reuse `evaluateAndDispatch` for the disposition.** Rejected — it writes `rule_evaluation_log`
  (double-record); the read-only `evaluate` + `gate` + `dispositionForAction` path is used instead.
- **Re-enable the shadow seam as the V1 recorder.** Rejected — the shadow seam is positioned before
  the decision branch and to be powerless forever; R1 needs the decision-branch position for the
  config-flip trajectory.
- **Inert-reserve (no live recording at V1).** Available fallback, not taken — it weakens the
  config-flip framing to a code/build step rather than a config change (charter R1 intent).
- **Register `INV-AUTONOMY-GATE-001` now.** Rejected — register-on-enforcement (ADR-0021); recording
  enforces nothing at V1.
- **Let the gate decide (block/allow) at V1.** Rejected — Invariant 5; the park is unconditional at
  V1; deciding is post-V1.

## Cross-references

- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter (R1; Wave plan; Invariant 5;
  reserved invariant IDs).
- `docs/02_specs/ledger_truth_model.md` / `docs/02_specs/invariants.md` — `INV-AUTONOMY-GATE-001`
  registers here post-V1 (register-on-enforcement).
- ADR-0007 — Q78 system-actor commit auth (Option A + Path X; exercise disabled at V1 via the Wave -1
  bleed-stop).
- ADR-0029 — Agent Ladder generalization / autonomy rung (the gate's `current_rung` input; rule-attached).
- ADR-0020 — folder structure / import boundaries (service-writer home; services↛agent).
- ADR-0024 — `rule_evaluation_log` (rule-grain decision log; referenced, not reused).
- ADR-0027 — shadow rule evaluation seam (distinct; pre-branch, powerless).
- ADR-0030 — decision-module composition; `ActionType`/`Disposition` (the gate's output contract).
- ADR-0033 — Canonical Evidence Object (the IDOR org-scoping lesson; `autonomy_gate_log` may be a
  referenced facet).
