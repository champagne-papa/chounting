# ADR-0031 Ratification Package — No-AI-Only-Paths (producer registry + CI)

**Status:** Awaiting CTO ratification.
**Date assembled:** 2026-06-02.
**V1 plan reference:** Wave 4 (R7); ADR-0031 reserved in `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §4 (Wave plan) / §6 (R7) / §2 (Invariant 3).
**Design spec:** `docs/09_briefs/v1/specs/2026-06-02-adr-0031-no-ai-only-paths-design.md` (committed `57fd13e4`, read-back clean; two precision fixes folded).
**Anchored at:** HEAD `57fd13e4` (branch `staging`), unpushed.
**Posture:** REGISTRY + CI, warn-only — *declare now, enforce later*. Wave 4 ships a **code-defined
producer registry** (every Intent declares its producers, each tagged AI / non-AI) + a **warn-only CI
check** that reports any Intent lacking a non-AI producer. **Teeth defer to Wave 6** (the check flips
warn→error), at which point **`INV-WORKFLOW-001` registers**. This package **ratifies and specifies**;
it ships no code and no migration (there is no migration — the registry is code-defined) — the Wave-4
build proceeds **against the ratified ADR**.

---

## 1. Summary

ADR-0031 reserves **No-AI-Only-Paths** (Wave 4, R7): the structural guarantee that **every Intent has
≥1 non-AI producer** (charter §2 Invariant 3), realized as a **code-defined producer registry** + a
**CI producer-coverage check**. The registry maps each Intent to its producers, each tagged AI / non-AI,
**keyed on intent type** so new producers register as data without rework (R7). It covers **all three
intent types** (`intent_model.md`): **Mutation** is the teeth-bearing spine (the only ledger-touching
intent — `ProposedMutation` → posting); **Navigation** is satisfied-by-construction (explicit non-AI
producers — Mainframe click, palette); **Query** is in-registry with its non-AI producer resolved by the
producer taxonomy (§B OQ-2) — neither Nav nor Query is narrowed out of the ratified invariant.

The CI check is a `scripts/` + npm task on the **`adr:lint` warn-permissive / error-blocking** pattern:
**warn-only (`exit 0`) at Wave 4**, flipping to **error (`exit 1`) at Wave 6** — a one-line severity
change. Because warn-only **reports without preventing**, it is not "enforcement in code today"
(`docs/02_specs/README.md:36-37`), so **`INV-WORKFLOW-001` stays reserved at Wave 4 and registers at
Wave 6** (the Wave-1/2/3 reserve-don't-register parity). The registry is **code-defined** (ADR-0028
definitions-in-code) ⇒ **no persistence ⇒ no org-scoping** (the build-time check carries no runtime org
context; a per-org-table flip would re-introduce the IDOR audit — stated contingency).

This package contains: the ratification ask (§2), the verified-against-disk grounding (§3), the
ADR-0031 body to land in `adr/` on ratification (§A), and the OQ resolutions (§B).

## 2. Ratification ask

Ratify ADR-0031 as REGISTRY + CI (warn-only) posture. On ratification:

1. The §A body lands at `docs/07_governance/adr/0031-no-ai-only-paths.md` with `status: ratified`,
   `date: <ratification date>`.
2. The OQ resolutions (§B) bind the Wave-4 build: intent-type-keyed registry, Mutation sub-keyed on
   `proposal_type` (OQ-1); the non-AI producer taxonomy authored at the body (OQ-2); registry + check
   home deferred to build (OQ-3); `INV-WORKFLOW-001` registration predicate deferred to Wave 6 (OQ-4);
   warn-only harness wiring that does not fail the build at Wave 4 (OQ-5).
3. **The Wave-4 build proceeds against the ratified ADR** — the code-defined producer registry; the
   warn-only `scripts/` producer-coverage check + npm/harness wiring; no migration (code-defined). **Not
   enacted in this package** (the ADR-0028/0029 precedent: the package ratifies; the build follows). The
   build is a **separate go**. Wave 6 (later, separate) flips the check warn→teeth and registers
   `INV-WORKFLOW-001`.
4. `pnpm adr:check` green; banks local on `staging`; pushes at retrospective close.

**Boundaries carried from the design-spec read-back:**

- **Declare, don't enforce (at Wave 4).** The CI check is warn-only (`exit 0`); it reports gaps, does not
  block. Teeth (`exit 1`) land at Wave 6. No build-failing producer check at Wave 4.
- **Reserve, don't register.** `INV-WORKFLOW-001` is named, not registered (warn-only ≠ enforcement;
  `README.md:36-37`; D-0028.8 / D-0033.8 / D-0032.8 reserve-don't-register parity).
- **All three intent types; don't narrow.** Mutation is the teeth-bearing spine; Navigation/Query are
  in-registry (satisfied-by-construction / OQ-2), not out-of-scope.
- **Code-defined ⇒ no org-scoping.** No persistence, no caller-supplied id, no `adminClient` read facet;
  the check is a build-time static cross-file traversal with no runtime org context. A per-org-table flip
  re-enters the IDOR audit (ADR-0033 lesson) — not taken.

## 3. Grounding (verified against disk at HEAD `57fd13e4`)

| Claim | Verification |
|---|---|
| The invariants registry exists (kickoff's "no such file" is false) | `docs/02_specs/invariants.md:1-14` ("canonical index for the 25 invariants"); two-tier with `docs/02_specs/ledger_truth_model.md` leaves; `INV-WORKFLOW-001` absent (reserved) |
| register-on-enforcement (the operative rule) | `docs/02_specs/README.md:36-37` — "an invariant only appears in `invariants.md` if it has corresponding enforcement in code TODAY" |
| substrate-now-enforcement-later lineage | origin `docs/07_governance/adr/0010-*` ; inherited by ADR-0021 (`0021:112-114` "Inheritance from ADR-0010 substrate-now-enforcement-later") — README is the operative invariant rule |
| D-0028.8 allocates INV-WORKFLOW-001 → ADR-0031 | `docs/07_governance/adr/0028-workflow-core-substrate.md:127-131` ("Reserved invariants, none registered"; INV-WORKFLOW-001 belongs to ADR-0031) |
| reserve-don't-register parity | `adr/0033-canonical-evidence-object-model.md:120` (D-0033.8); `adr/0032-canonical-autonomy-gate-seam.md:125` (D-0032.8) |
| three intents; only Mutation touches the ledger | `docs/02_specs/intent_model.md:37-42` (three intents); Mutation → `ProposedMutation` → posting (§ Mutation Intent) |
| canonical shared-routing rule | `intent_model.md:82-84` — "No entry path has bespoke routing … all produce one of the three intents" |
| Navigation has explicit non-AI producers; Query examples are AI | `intent_model.md:51` (Mainframe click), `:54` (palette nav); Query examples `:74-78` (chat/AI) |
| `ProposedMutation` variants | `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts:20-23,57-78` (`post_bill` / `record_bill_payment`) |
| `ACTION_NAMES` (candidate mutation key; orthogonal to producers) | `apps/web/src/services/auth/canUserPerformAction.ts:20-63` (37 actions) |
| `source` enum (current low-level producer tracking) | `apps/web/src/shared/schemas/accounting/journalEntry.schema.ts:111` (`['manual','agent','import']`) |
| no producer registry exists today (net-new) | grep: no producer-registration substrate; `ACTION_NAMES` is authorization, not producer mapping |
| `adr:lint` warn/error severity split (the warn→teeth pattern) | `scripts/adr/lint.ts:370-386` (`exit(errorCount>0?1:0)`; warnings→stdout, errors→stderr) |
| validation harness | `apps/web/package.json` `agent:validate` = typecheck + `test:no-hardcoded-urls` + `agent:floor` |
| ESLint off→error precedent (severity-flip analog) | `apps/web/eslint.config.mjs:14-19,116-120` (`agent-first-import-boundaries`, originally `'off'`, now `"error"`) |
| code-defined definitions (registry is definition-class) | ADR-0028 (ratified) — "code-defined definitions, DB-backed instances" |
| Wave-2 IDOR lesson (contingency reference) | commit `a2a0b2dc` "fix(evidence): org-scope all evidence-object facets — close cross-tenant IDOR (ADR-0033)" |

---

## §A — ADR-0031 body (lands in `adr/` on ratification)

> The frontmatter `status: ratified` and `date` take effect when the body moves to `adr/` at
> ratification, never before.

```markdown
---
id: "0031"
title: "No-AI-Only-Paths — code-defined producer registry + warn-only CI; teeth + INV-WORKFLOW-001 at Wave 6"
status: ratified
date: "<RATIFICATION_DATE>"
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

Ratified <RATIFICATION_DATE> by CTO (V1 governance arc, Wave 4, reservation R7).
Reserved by the V1 Governance Plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4 / §6 / §2 Invariant 3). Design spec:
`docs/09_briefs/v1/specs/2026-06-02-adr-0031-no-ai-only-paths-design.md`; ratification package:
`docs/09_briefs/v1/ratification-packages/2026-06-02-adr-0031-ratification-package.md`.

Registry + CI ADR. Reserves a code-defined producer registry and a warn-only CI producer-coverage
check. Ships no migration (code-defined) and no code in the ratification act (the Wave-4 build
follows). Registers no invariant; the CI check gains no teeth at Wave 4.

## Date

<RATIFICATION_DATE>

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
  The registry's shape + home are deliberately left open (§B) ahead of the build.
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
```

---

## §B — Open-question resolutions (folded in)

Each resolution binds the Wave-4 build; the design spec (§8) is preserved as-authored.

- **OQ-1 — registry data shape + key.** **Endorse the §2.1 shape:** intent-type-keyed map → producers
  tagged AI/non-AI; Mutation sub-keyed on `proposal_type` (`post_bill`/`record_bill_payment`). Confirm
  the variant enumeration at the build. Pin exact columns/shape at the build.
- **OQ-2 — "non-AI producer" taxonomy.** **Author at the ADR body / build.** Enumerate the non-AI paths
  (manual form, palette, Mainframe nav, file import) vs the AI paths (agent, ingest pipeline). This is
  where each **Query**'s non-AI producer is settled (the spec deliberately did not assert it).
- **OQ-3 — registry + check home.** **Defer to build** (ADR-0020 item-6 opportunistic migration), as
  Waves 1–2: `services/workflow/` vs `core/intent/` vs `contracts/`; the check under `scripts/`.
- **OQ-4 — `INV-WORKFLOW-001` registration predicate** wording. **Defer to Wave 6** — named now, authored
  when teeth land.
- **OQ-5 — harness wiring.** **Defer to build:** the Wave-4 warn-only check runs as an npm task and/or CI
  step but **must not fail the build** (warn-only); the teeth-flip at Wave 6 makes it build-failing.

---

## 4. Source materials read during package drafting

- `docs/09_briefs/v1/specs/2026-06-02-adr-0031-no-ai-only-paths-design.md` (the design spec, read-back
  clean at `57fd13e4`).
- `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §2/§4/§5/§6/§7 (Invariant 3/7; R7; Wave
  plan; carry-forwards; reserved invariant IDs).
- `docs/02_specs/invariants.md` + `docs/02_specs/README.md:36-37` (registry + register-on-enforcement);
  `docs/02_specs/intent_model.md:37-42,51,54,74-78,82-84` (intents + producers).
- `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts:20-23,57-78`;
  `apps/web/src/services/auth/canUserPerformAction.ts:20-63`;
  `apps/web/src/shared/schemas/accounting/journalEntry.schema.ts:111`.
- `scripts/adr/lint.ts:370-386` (warn/error split); `apps/web/package.json` (`agent:validate`);
  `apps/web/eslint.config.mjs:14-19,116-120` (off→error precedent).
- `docs/07_governance/adr/0028-workflow-core-substrate.md` (D-0028.8; code-defined definitions);
  `adr/0033-…:120` (D-0033.8); `adr/0032-…:125` (D-0032.8); `adr/0021-…:112-114` (lineage).
- `docs/09_briefs/v1/ratification-packages/2026-06-01-adr-0033-ratification-package.md` (format exemplar).
