---
id: "0031"
title: "No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6"
status: ratified
date: "2026-06-02"
deciders: [phil]
modules: [agent, infra]
features: []
phase: "post-mvp"
supersedes: []
superseded_by: []
related: ["0005", "0010", "0020", "0021", "0028", "0032", "0033"]
invariants: []
---

# ADR-0031: No-AI-Only-Paths

## Status

Ratified 2026-06-02 by CTO (V1 governance arc, Wave 4, reservation R7).
Reserved by the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4 / §6 / §2 Invariant 3). Design spec:
`docs/09_briefs/v1/specs/2026-06-02-adr-0031-no-ai-only-paths-design.md`; ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-02-adr-0031-ratification-package.md`.

Registry + CI ADR. Reserves a code-defined producer registry and a warn-only CI producer-coverage
check. Ships no migration (code-defined) and no code in the ratification act (the Wave-4 build
follows). Registers no invariant; the CI check gains no teeth at Wave 4.

## Date

2026-06-02

## Triggered by

The V1 governance arc, Wave 4. Charter §2 Invariant 3 ("every Intent has ≥1 non-AI producer; CI
INV-WORKFLOW-001 (teeth at Wave 6)") and §6 R7 ("registry shaped to accept new producers without
rework"). Today there is no producer registry and no producer-coverage check; the "no AI-only path"
property is implicit. This ADR makes it an explicit, machine-checkable registry — reported at Wave 4,
enforced at Wave 6.

## Context

Every entry point produces one of three intents (`intent_model.md:37-42`; ADR-0005 three-path):
Navigation (→ `CanvasDirective`), Mutation (→ `ProposedMutation`), Query (→ transient view / in-chat
response). Only Mutation reaches a ledger write. The canonical rule (`intent_model.md:82-84`): "No
entry path has bespoke routing … all produce one of the three intents."

Producers today: the agent (`source:'agent'`) and ingest pipeline (AI); manual form (`source:'manual'`),
palette, Mainframe, file import (non-AI). There is **no producer registry** and **no single `Intent`
type** in code; the closest registration, `ACTION_NAMES` (`canUserPerformAction.ts:20-63`), is
authorization, not producer mapping. Producer registration is net-new.

The hazard is an AI-only path to a mutation — an autonomous producer reaching the ledger with no
human-initiable alternative (the structural complement to ADR-0032's recording-only autonomy). The
spec-without-enforcement rule (`README.md:36-37`) and ADR-0028's "code-defined definitions" govern the
shape.

## Decision

**D-0031.1 — Code-defined producer registry, all three intent types, keyed on intent type.** A
code-defined typed registry maps each Intent to its producers, each tagged AI / non-AI, keyed on intent
type (ADR-0028 definitions-in-code; producer declarations are static system facts, not per-org data). It
covers all three intent types — the ratified invariant says "every Intent", and narrowing to mutation
would silently shrink it. **Mutation** is the teeth-bearing spine (the only ledger-touching intent;
keyed at mutation granularity — `ProposedMutation.proposal_type` `post_bill`/`record_bill_payment`,
and/or the mutation subset of `ACTION_NAMES`; pinned at build). **Navigation** is satisfied-by-
construction (explicit non-AI producers — `intent_model.md:51` Mainframe click, `:54` palette).
**Query** is in-registry; whether each Query carries a declared non-AI producer is resolved by the
producer taxonomy (OQ-2), since the canonical rule gives shared routing, not a non-AI Query producer, and
the Query examples (`:74-78`) are chat/AI. Rejected: a DB table (couples to persistence, contradicts
definitions-in-code); mutation-only scope (narrows the ratified invariant).

**D-0031.2 — Warn-only CI producer-coverage check; teeth at Wave 6.** A `scripts/` + npm-task check on
the `adr:lint` warn-permissive / error-blocking pattern (`scripts/adr/lint.ts:370-386`). Wave 4: gaps
emit at warning (stdout, `exit 0`, non-blocking), wired into the validation harness. Wave 6: the same
findings flip to error (`exit 1`, build-failing) — a one-line severity change (the
`agent-first-import-boundaries` off→error analog). Rejected: an ESLint rule — the invariant is a
cross-file registry traversal, not an import-boundary; ESLint's precedent fits import rules.

**D-0031.3 — Reserve `INV-WORKFLOW-001`; register at Wave 6.** Warn-only reports without preventing ⇒ not
"enforcement in code today" (`README.md:36-37`) ⇒ `INV-WORKFLOW-001` stays reserved-unregistered at Wave
4 and registers at Wave 6 (teeth), in `invariants.md` + a `ledger_truth_model.md` leaf. The
substrate-now-enforcement-later lineage (origin ADR-0010, inherited ADR-0021) and the Wave-1/2/3
reserve-don't-register parity (D-0028.8 / D-0033.8 / D-0032.8) govern. Registering at Wave 4 would seat
an unenforced invariant — the precise thing the rule forbids.

**D-0031.4 — R7 extensibility: new producers without rework.** Because the registry is keyed on intent
type and producers are data entries (not switch arms), a new producer registers by adding an entry
against an existing intent type — no edit to the check, no structural change. The registry is the
extensibility seam; the check reads it generically.

**D-0031.5 — Code-defined ⇒ no org-scoping; stated contingency.** No persistence ⇒ no caller-supplied
id, no `adminClient` read facet ⇒ the Wave-2 cross-tenant IDOR lesson (commit `a2a0b2dc`) does not bite.
Binding condition: the CI traversal is a build-time static cross-file check with no runtime org context.
Contingency: if the registry ever flips to a per-org producer table, org-scoping (org_id from
org-verified rows, never caller-supplied; `security_invoker` reads) and the per-facet read-scoping audit
re-enter immediately. Not taken.

**D-0031.6 — Sequencing.** Wave 4: registry (code) + CI (warn) + reserved `INV-WORKFLOW-001`. Wave 6:
teeth (CI warn→error) + register `INV-WORKFLOW-001`. The §7 Wave-6 carry-forwards (silent-drop /
Invariant 7; matcher-gap; parked-backlog recovery) are distinct Wave-6 scope, not No-AI-Only-Paths —
but they interact (a non-AI producer path is moot if matched items silently drop), so the teeth and the
silent-drop fix land in the same wave.

**D-0031.7 — Reserved invariant.** `INV-WORKFLOW-001` is named, registered by no one at Wave 4
(register-on-enforcement). It is the No-AI-Only-Paths invariant; the registry + warn-only check are its
Wave-4 substrate.

## Consequences

- The "no AI-only path" guarantee becomes an explicit, machine-checkable registry rather than an
  implicit property; new producers register as data (R7); the warn→teeth split makes gaps visible at
  Wave 4 without blocking, and Wave 6 enforces with a one-line flip; Navigation/Query stay in the
  invariant's scope (no silent narrowing).
- Cost / posture: Wave 4 ships a real-but-non-blocking check; a warned gap is a known-gap until Wave 6.
  The registry's shape + home are deliberately left open (the ratification package's §B OQs) ahead of
  the build.
- Carried risk: the registry must stay code-defined for the no-IDOR property (a per-org table re-enters
  the audit); and it must key on intent type (not entry path) or R7 weakens.
- Doc surface: adds the ADR; names `INV-WORKFLOW-001` in prose; no `invariants.md` registration at Wave
  4 (nothing enforces).

## Alternatives considered

- **A DB producer table.** Rejected — couples to persistence + re-introduces org-scoping/IDOR;
  contradicts ADR-0028 definitions-in-code (producer declarations are static system facts).
- **Mutation-only scope.** Rejected — the ratified invariant says "every Intent"; narrowing to mutation
  silently shrinks it. Mutation is the teeth-bearing spine; Nav/Query stay in-registry.
- **An ESLint rule for the check.** Rejected — the invariant is a cross-file registry traversal, not an
  import-boundary; the `scripts/` + npm-task (adr:lint) pattern fits and carries the warn→teeth split.
- **Teeth at Wave 4.** Rejected — charter §2/§5 defer teeth to Wave 6; warn-only at Wave 4.
- **Register `INV-WORKFLOW-001` now.** Rejected — register-on-enforcement (`README.md:36-37`); warn-only
  enforces nothing.

## Cross-references

- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` — charter (R7; Wave plan; Invariant 3;
  reserved invariant IDs).
- `docs/02_specs/invariants.md` / `docs/02_specs/ledger_truth_model.md` — where `INV-WORKFLOW-001`
  registers at Wave 6 (register-on-enforcement, `docs/02_specs/README.md:36-37`).
- `docs/02_specs/intent_model.md` — the three intents + the canonical shared-routing rule.
- ADR-0005 — three-path intent schema.
- ADR-0010 — substrate-now-enforcement-later (origin of the pattern).
- ADR-0020 — folder structure / import boundaries (registry + check home).
- ADR-0021 — ADR frontmatter + tooling; inherits the substrate-now-enforcement-later pattern (the
  linter-as-enforcement precedent for the warn→teeth check).
- ADR-0028 — Workflow Core; code-defined definitions; D-0028.8 allocates `INV-WORKFLOW-001` to ADR-0031.
- ADR-0032 — Canonical Autonomy Gate Seam (the recording-not-deciding analog: declare/record now,
  enforce later).
- ADR-0033 — Canonical Evidence Object (D-0033.8 reserve-don't-register parity; the IDOR org-scoping
  lesson referenced by the §D-0031.5 contingency).
