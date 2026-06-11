# ADR-0031 — No-AI-Only-Paths (producer registry + CI) — Design Spec

**Status:** DRAFT for review · 2026-06-02 · pre-ratification design spec (lifecycle step 1 of 4:
design spec → ratification package → ratified ADR in `docs/07_governance/adr/` → build; charter §8).
**Reserves:** ADR-0031 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4 Wave 4 / §6 reservation R7; §2 Invariant 3; §5 Wave-4 line).
**Anchored at:** HEAD `f8e92e98` (branch `staging`, level with `origin/staging`).
**Posture:** REGISTRY + CI, warn-only — *declare now, enforce later* (the Wave-3
recording-not-deciding analog). Wave 4 ships a **code-defined producer registry** (every Intent
declares its producers, each tagged AI / non-AI) + a **warn-only CI check** that reports any Intent
lacking a non-AI producer. **Teeth defer to Wave 6** (the check flips warn→error) — at which point
**`INV-WORKFLOW-001` registers**. This spec **reserves and shapes**; it authors no ADR body, ships
no code/migration, registers no invariant, and writes nothing live. Five forks were settled by the
CTO at spec-onset (recorded inline §2–§5); residual shape choices are §8 OQs.

> **What stays OPEN here.** The registry's exact data shape + its code home (§3) are §8 OQs decided
> at the build. The spine — **code-defined** registry (Fork B1) covering **all three intent types**
> with Mutation as the teeth-bearing spine and Navigation/Query **satisfied-by-construction** (Fork
> B2), a **warn→teeth CI** on the `adr:lint` severity-split pattern (Fork A1), **reserve
> INV-WORKFLOW-001 at Wave 4 / register at Wave 6** (Fork A2), and **no persistence ⇒ no org-scoping**
> with a stated contingency (Fork D) — is settled and recorded as closed.

> **Provenance correction (references-are-claims).** The Wave-4 kickoff stated "the charter calls it
> `invariants.md` but there is no such file under docs/." That is **false against disk**:
> `docs/02_specs/invariants.md` exists (the canonical index of 25 invariants); the registry is
> two-tier (`invariants.md` index + `docs/02_specs/ledger_truth_model.md` leaves). `INV-WORKFLOW-001`
> is correctly **absent** there today (reserved); it lands there + a leaf when it registers (Wave 6).

---

## 0. What this ADR does (and does not do)

- **Does:** reserve a **code-defined producer registry** — every Intent (Navigation, Mutation, Query)
  declares its ≥1 producers, each tagged AI / non-AI — and a **warn-only CI check** (Wave 4) that
  reports any in-scope Intent lacking a non-AI producer. Establish the **warn→teeth** mechanism (the
  check flips warn→error at Wave 6 — one severity change, the `adr:lint` pattern), the **register-at-
  Wave-6** timing for `INV-WORKFLOW-001`, and the **R7 extensibility** shape (new producers register
  as data, no rework).
- **Does NOT:** give the CI check **teeth** at Wave 4 (warn-only — `INV-WORKFLOW-001` "teeth at Wave
  6", charter §2/§5); **register** `INV-WORKFLOW-001` (warn-only ≠ enforcement ⇒ spec-without-
  enforcement rule ⇒ reserved, §6); narrow the ratified invariant to mutation-only (Navigation/Query
  are **in-registry, satisfied-by-construction**, §2.1); ship a **DB table** (code-defined,
  ADR-0028 precedent) or any persistence (⇒ no org-scoping, §4); absorb the Wave-6 carry-forwards
  (silent-drop, matcher-gap, parked-backlog — distinct Wave-6 scope, §5); author the ADR body, ship
  code/migration, or register any invariant.

---

## 1. Context — three intents, producers without a registry

**The three intents** (`docs/02_specs/intent_model.md:37-42`; ADR-0005 three-path schema): every entry
point produces one of **Navigation** (→ `CanvasDirective`), **Mutation** (→ `ProposedMutation`), or
**Query** (→ transient view / in-chat response). The canonical rule (`intent_model.md:82-84`): *"No
entry path has bespoke routing. Chat, palette, Mainframe, form, and file import all produce one of the
three intents. The intent handlers are singular and shared across all paths."* Only **Mutation**
reaches a ledger write (`ProposedMutation` → the policy decision tree → posting); Navigation and Query
are read-shaped.

**Producers today, no registry.** Intents are produced by the conversational agent (`source:'agent'`),
the ingest pipeline, and the non-AI paths — manual form (`source:'manual'`), command palette, Mainframe
nav, file import (`journalEntry.schema.ts:111` `source` enum `['manual','agent','import']`). In code
there is **no single `Intent` type** and **no producer registry** — `ProposedMutation` is a
discriminated union on `proposal_type` (`post_bill` / `record_bill_payment`,
`proposedMutation.schema.ts:20-23,57-78`); the closest existing registration is `ACTION_NAMES`
(`canUserPerformAction.ts:20-63`, 37 authorization actions) which is **orthogonal** (who-may-act, not
who-produces). Producer registration is **net-new**.

**The risk this closes.** Charter §2 Invariant 3 (`:50`): *"every Intent has ≥1 non-AI producer; CI
`INV-WORKFLOW-001` (teeth at Wave 6)."* The hazard is an **AI-only path to a mutation** — an autonomous
producer reaching the ledger with no human-initiable alternative. (This pairs with ADR-0032: even with
recording-only autonomy at V1, the structural guarantee that a human path always exists must be
defensible.)

**Register-on-enforcement.** The spec-without-enforcement rule (`docs/02_specs/README.md:36-37`): *"an
invariant only appears in `invariants.md` if it has corresponding enforcement in code TODAY"* — the
substrate-now-enforcement-later cross-pattern (origin ADR-0010; inherited by ADR-0021). ADR-0028
ratified the engine shape this builds on: **code-defined definitions, DB-backed instances** (the
registry is definition-class → code).

---

## 2. Decision — code-defined registry, warn→teeth CI, reserve the invariant

### 2.1 A code-defined producer registry covering all three intent types (Forks B1 + B2, CTO-settled)

A **code-defined** typed registry (Fork B1 — ADR-0028 "definitions in code, not table-driven"; producer
declarations are static system facts, not per-org data) maps each Intent to its producers, each tagged
**AI / non-AI**, **keyed on intent type** (not entry path — keying on type is what makes R7 hold, §2.4).

The registry covers **all three intent types** (Fork B2 — the ratified invariant says *"every Intent"*;
narrowing to mutation-only would silently shrink a ratified invariant):

- **Mutation — the teeth-bearing spine.** The only ledger-touching intent; this is where "no AI-only
  path" is the real safety property and where the Wave-6 teeth bind. Keyed at mutation granularity
  (`ProposedMutation.proposal_type` `post_bill`/`record_bill_payment`, and/or the mutation subset of
  `ACTION_NAMES` — exact key pinned at build, §8 OQ-1). Each must declare ≥1 non-AI producer (the
  manual form / API path).
- **Navigation + Query — in-registry, not out-of-scope.** **Navigation** is satisfied-by-construction:
  it has explicit non-AI producers (the Mainframe icon click, `intent_model.md:51`; palette navigation,
  `:54`). **Query**: the canonical shared-routing rule (`intent_model.md:82-84`) puts Query on the same
  shared entry paths, but that line establishes shared *routing*, not a non-AI Query *producer*, and the
  spec's Query examples (`:74-78`) are chat/AI — so whether each Query carries a declared non-AI producer
  is resolved by the producer taxonomy (§8 OQ-2), not asserted settled here. Both intent types are
  recorded in the registry; neither is narrowed out of the ratified invariant.

### 2.2 Warn→teeth CI on the `adr:lint` severity-split pattern (Fork A1, CTO-settled)

The producer-coverage check is a **`scripts/` script + npm task**, not an ESLint rule (the invariant is
a **cross-file registry traversal** — "does every in-scope Intent declare ≥1 non-AI producer" — not an
import-boundary; ESLint's `off→error` precedent fits import rules). It follows the **`adr:lint`
warn-permissive / error-blocking** pattern (`scripts/adr/lint.ts:370-386`, `exit(errorCount>0?1:0)`):

- **Wave 4:** coverage gaps emit at **warning** (stdout, `exit 0`, non-blocking) — reported, not
  enforced. Wired into the validation harness alongside `agent:validate` (typecheck +
  `test:no-hardcoded-urls` + `agent:floor`).
- **Wave 6:** the same findings flip to **error** (`exit 1`, build-failing). **The flip is a one-line
  severity change** — no re-architecture (the `agent-first-import-boundaries` `off→error` analog, done
  as a severity edit rather than a rewrite).

### 2.3 Reserve `INV-WORKFLOW-001`; register at Wave 6 (Fork A2, CTO-settled)

A **warn-only check reports without preventing** the violation ⇒ it is **not "enforcement in code
TODAY"** ⇒ per the spec-without-enforcement rule (`README.md:36-37`), `INV-WORKFLOW-001` stays
**reserved-unregistered at Wave 4** and **registers at Wave 6** when the check gains teeth (exact Wave-1
D-0028.8 / Wave-2 D-0033.8 / ADR-0032 D-0032.8 parity). Registering it at Wave 4 would seat an
unenforced invariant in `invariants.md` — the precise thing the rule forbids.

### 2.4 R7 extensibility — new producers without rework (CTO-settled)

Charter §6 R7 (`:180`): *"registry shaped to accept new producers without rework."* Because the registry
is **keyed on intent type** and producers are **data entries** (not switch arms), a new producer
registers by **adding an entry against an existing intent type** — no edit to the check, no structural
change. The registry is the extensibility seam; the CI check reads it generically.

---

## 3. Code home & layer placement (OQ — defer to build)

Candidate homes: `services/workflow/` (ADR-0028 R7 frames the registry as workflow-adjacent) vs a
standalone `core/intent/` or `contracts/` (Intents/producers are broader than workflow — form / palette
/ Mainframe producers are not workflow-driven). The CI script lives under `scripts/`. Module layout is
**deferred to the build** (the Wave-1/2 ADR-0020 item-6 opportunistic-migration pattern) — §8 OQ-3. The
registry must be importable by the build-time check without pulling in runtime/DB context (§4).

---

## 4. Safety — no persistence ⇒ no org-scoping; the stated contingency (Fork D, CTO-settled)

Because the registry is **code-defined** (§2.1), there is **no persistence, no caller-supplied id, no
`adminClient` read facet** — the Wave-2 cross-tenant IDOR lesson (ADR-0033, commit `a2a0b2dc`)
**genuinely does not bite**. The one condition that keeps it clean, stated as a binding constraint: the
CI traversal must be a **build-time static cross-file check with no runtime org context** — it reads the
code-defined registry, never a per-org row.

**Contingency (flag for the build / future waves):** if the registry ever flips to a **per-org producer
table** (e.g. orgs customize producers), org-scoping and the per-facet read-scoping audit **re-enter
immediately** — `org_id` from org-verified rows, never caller-supplied; `security_invoker` reads;
append-only as applicable. This spec does not take that path.

---

## 5. Sequencing & the Wave-4/Wave-6 boundary (Fork E, CTO-confirmed)

- **Wave 4:** the registry (code) + the warn-only CI check + this ADR + **reserved** `INV-WORKFLOW-001`.
- **Wave 6:** **teeth** (CI flips warn→error) + **register** `INV-WORKFLOW-001` in `invariants.md` (+ a
  `ledger_truth_model.md` leaf).

**Carry-forward interaction (scoped out of Wave 4).** The §7 Wave-6 carry-forwards — silent-drop fix
(Invariant 7, `charter:63-64`, *"NOT yet enforced"*), the matcher-gap MUST-FIX, parked-backlog recovery
(`charter:189-202`) — are **distinct Wave-6 scope, not No-AI-Only-Paths**. They **interact**: a non-AI
producer path is moot if matched items silently drop, so the No-AI-Only-Paths teeth and the silent-drop
fix land in the same wave. Noted; not absorbed into Wave 4.

---

## 6. Reserved invariant IDs (named; none registered)

`INV-WORKFLOW-001` is **named, registered by no one** at Wave 4. Charter §4 reserves
`INV-WORKFLOW-001..005` (`:117-120`, register-on-enforcement); ADR-0028 D-0028.8 explicitly
allocated `INV-WORKFLOW-001` to **ADR-0031** ("No-AI-Only-Paths, Wave 4"). Warn-only ≠ enforcement ⇒
ADR-0010/0021 substrate-now-enforcement-later ⇒ it registers at **Wave 6** (teeth), the exact
Wave-1/2/Wave-3 reserve-don't-register precedent. Eventual predicate (recorded for the body, registered
then): *every in-scope Intent has at least one registered non-AI producer; CI-enforced build-failing.*

---

## 7. Consequences

- **Positive:** the "no AI-only path" guarantee becomes an explicit, machine-checkable registry rather
  than an implicit property; new producers register as data (R7); the warn→teeth split lets Wave 4 make
  gaps visible without blocking, and Wave 6 enforces with a one-line flip; Navigation/Query stay in the
  invariant's scope (no silent narrowing) — Navigation satisfied-by-construction, Query's non-AI
  producer resolved by the §8 OQ-2 taxonomy.
- **Cost / posture:** Wave 4 ships a real-but-non-blocking check; a warned gap is a known-gap, not an
  enforced one, until Wave 6. The registry's exact shape + home are deliberately left open (§8) rather
  than over-specified ahead of the build.
- **Carried risk:** the registry must stay **code-defined** for §4's no-IDOR property to hold; a future
  per-org table re-introduces the cross-tenant audit (flagged §4). And the registry must key on intent
  **type** (not entry path) or R7 "new producers without rework" weakens.
- **Doc surface:** adds the ADR; names `INV-WORKFLOW-001` in prose; no `invariants.md` registration at
  Wave 4 (nothing enforces).

---

## 8. Open questions for the ADR body / reviewer

- **OQ-1 — registry data shape + key.** The §2.1 shape (intent-type-keyed map → producers tagged
  AI/non-AI); for Mutation, key on `proposal_type` vs the mutation subset of `ACTION_NAMES` vs both.
  Recommendation: intent-type-keyed, Mutation sub-keyed on `proposal_type`; pin at the build. Confirm
  the `ProposedMutation` variant enumeration (`post_bill`/`record_bill_payment`) at build.
- **OQ-2 — "non-AI producer" definition.** What counts as non-AI: manual form, manual API call,
  palette, Mainframe nav, file import? (The agent + the ingest pipeline are the AI producers.) Pin the
  taxonomy at the body.
- **OQ-3 — registry + check home** (§3): `services/workflow/` vs `core/intent/` vs `contracts/`; the
  check under `scripts/`. Defer to build (ADR-0020 item-6), as Waves 1–2.
- **OQ-4 — `INV-WORKFLOW-001` registration predicate** wording for Wave 6 (the enforcement statement) —
  named now, authored when teeth land.
- **OQ-5 — harness wiring** — does the Wave-4 warn-only check run inside `agent:validate`, as a separate
  npm task, and/or a CI job step? (It must not fail the build at Wave 4.) Pin at build.

---

## 9. Lifecycle next steps (not this spec)

1. CTO read-back of this design spec (verify-against-disk) → resolve OQ-1..OQ-5 direction.
2. **Ratification package** under `docs/09_briefs/v1/ratification-packages/` enacting ADR-0031 (the ADR
   body; the OQ resolutions). **Not** the build (the ADR-0028/0029 precedent: the package ratifies; the
   build follows).
3. Ratified **ADR-0031** lands in `docs/07_governance/adr/`.
4. **Wave-4 build** (separate go): the code-defined registry + the warn-only CI script + npm/harness
   wiring. Wave-6 (later) flips warn→teeth and registers `INV-WORKFLOW-001`.

This spec **reserves and shapes**; it authors no ADR body, builds no registry, ships no CI code,
registers no invariant, and writes nothing live. No commit until the read-back clears.
