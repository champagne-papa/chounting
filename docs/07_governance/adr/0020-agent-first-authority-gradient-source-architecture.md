# ADR-0020: Agent-First Authority-Gradient Source Architecture (substrate-only v1)

## Status

Ratified 2026-05-05 by CTO with named follow-ups (B.5 rules
substrate session, Phase 1 chunk 1 first-consumer activation).

## Date

2026-05-05

## Triggered by

Phase 0 governance arc closeout (Sessions 2A-2F) at commit
`45ba684` 2026-05-04, which authorized Phase 1 (Storage / Evidence
Core) code start; the CTO Handoff v2 architectural recommendation
at `docs/07_governance/CTO_HANDOFF_V2.md` (1175 lines, co-landed in
this commit), which rejects DDD-first `/src/modules/` organization
and accepts an agent-first authority-gradient source architecture;
and the Phase 1 onset that needs a settled organizing axis before
its first storage chunk lands. ADR-0020 is the substrate ADR for
the source-tree architecture. Phase 1's first shipping piece
(`storageProviderService` per ADR-0013, sub-arc chunk 1) is the
first consumer.

ADR-0020 follows the substrate-now-enforcement-later cross-pattern
codified at Phase 0 D6 §6.8 + ADR-0010 Variant A precedent at
commit `797db40`. The pattern: substrate (folder layout, empty
target homes, ESLint rule scaffold, import boundary rules) lands
at v1 ratification time; enforcement (ESLint rule severity flip
from `'off'` to `'error'`, opportunistic file migration, capability
subdirectory population under `agent/tools/` and
`contracts/agent-tools/`) lands at implementation time when the
first consuming code path forces the question. ADR-0020 ships the
substrate; the first consumer is Phase 1 chunk 1.

The Tier 4 substrate-only-v1 precedent is **ADR-0017** (Vendor
Template Substrate, ratified 2026-05-04, commit referenced in the
Phase 0 closure verification artifact). ADR-0017's pattern —
substrate at v1 schema time, enforcement deferred to a future ADR
when the first consumer materializes — is the canonical shape
ADR-0020 inherits. Other Phase 0 substrate-only-v1 applications
(ADR-0014 Tier B small-classifier reservation; ADR-0019 confidence
calibration governance forward-pointer; Q23 v1-fixed promotion
thresholds) extend the same pattern across data, calibration, and
autonomy axes; ADR-0020 extends it to the **source-code layout**
axis.

## Context

### Why an agent-first source-tree ADR exists (v2 acceptance)

A v1 architectural draft proposed a `/src/modules/` DDD-first
layout where each product module (Document Core, Double Entry,
Client Core, Audit, Reporting) owned its own subtree and a feature
lived "in exactly one module folder." The CTO Handoff v2
explicitly rejects that draft on three grounds:

1. **Bounded context is not the load-bearing seam for chounting.**
   Per `docs/00_product/product_vision.md` Thesis Extension (the
   2026-04-16 Agent Autonomy Design Sprint addition), "the product
   is not the AI; the product is the control surface over the AI."
   The system's load-bearing seam is the **authority gradient**
   between the AI agent, formal tool contracts, deterministic
   services, pure rules, and the database — not the bounded
   contexts of accounting subdomains. Organizing source code by
   product module instead of by authority layer hides the
   load-bearing seam.

2. **A feature is a vertical slice, not a folder.** A product
   feature (e.g., "post a journal entry") spans the authority
   gradient: workflow route → agent tool → tool contract → service
   → core rules → repository → audit. Forcing all those files into
   `modules/double-entry/journal-entry/` collapses the gradient
   into a single subtree and obscures which authority layer owns
   which file. The agent boundary (the place where the
   probabilistic interface meets the deterministic engine per the
   product_vision.md thesis) becomes invisible at the folder level.

3. **DDD framing reopens settled questions.** Adopting `domain/`
   nomenclature would invite `application/` / `infrastructure/` /
   `interfaces/` companion folders, hexagonal-architecture
   reorganization debates, and aggregate-root discussions —
   reopening architectural questions Phase 0 has already settled
   through the authority-gradient framing in
   `docs/02_specs/agent_autonomy_model.md` §2 and the three-tier
   agent architecture in ADR-0007. ADR-0020 holds the line: the
   organizing axis is authority layer, not bounded context.

The v2 acceptance is therefore: **CHOUnting is organized around
the authority gradient between the AI agent, formal tool
contracts, deterministic services, pure rules, and persistence.**
Product modules and workflow arcs remain essential planning
artifacts (documented under `docs/00_product/` and
`docs/01_workflows/`); source code is organized by authority
layer.

### Phase 0 dependency context

ADR-0020 sits post-Phase-0; Phase 0 closure ratified ADR-0011
through ADR-0019 plus the ADR-0007 Tier 2.5 amendment and the
ADR-0010 Variants A/B/C amendment. The dependencies:

- **ADR-0007** — three-tier agent architecture (Tier 1 commit
  path, Tier 2 proposal pipeline, Tier 2.5 Relationship Router,
  Tier 3 interface). ADR-0020 inherits the three-tier framework
  verbatim and surfaces it at the folder layer: `agent/orchestrator/`
  + `agent/policies/agent-ladder/` are the Tier 1 / Tier 2 / Tier 3
  homes; `services/` is where the deterministic engine carries the
  invariants ADR-0007 names. ADR-0020 does NOT introduce a fourth
  agent tier or re-categorize the three-tier framework.
- **ADR-0011 §14 (Domain Boundary Map)** — entity ownership
  boundary between Spend (`vendors`, AP), Banking (bank/card
  feeds), and Platform substrate (`source_documents`,
  `source_document_links`, `document_cases`). ADR-0020's
  `services/` and `core/` subdirectory layout follows the §14
  ownership map: `services/accounting/` for Double Entry,
  `services/evidence/` and `services/storage/` for Document
  Platform substrate, `services/audit/` for Audit, and so on.
  ADR-0020 does NOT extend the §14 ownership map; it surfaces it
  at the folder layer.
- **ADR-0013** — Storage Provider service. ADR-0013's
  `storageProviderService` is the first Phase 1 consumer of the
  ADR-0020 substrate; it lands under `services/storage/` per the
  v2 §3 layout. ADR-0020 ships the empty `services/storage/`
  target home; ADR-0013 implementation populates it.
- **ADR-0017** — Vendor Template Substrate. The substrate-only-v1
  precedent ADR-0020 inherits in shape: ratify the substrate at v1
  ratification time; defer enforcement to first-consumer time. The
  enforcement gates ADR-0017 ships (the ESLint rule scaffold here
  has the same `severity: 'off'` posture as ADR-0017's reserved
  enum values — present in the codebase, not yet firing) match the
  pattern.
- **Phase 0 D6 §6.8** — substrate-now-enforcement-later
  cross-pattern codification. ADR-0020 is the post-Phase-0
  application of the same pattern at the source-code-layout axis.

### What this ADR does NOT do (boundary discipline at draft time)

ADR-0020 ratifies the source-tree organizing axis and the empty
target homes for it. It does NOT:

- **Migrate any existing file.** The 6 existing services under
  `apps/web/src/services/accounting/`, the existing
  `apps/web/src/agent/` tree, the existing `apps/web/src/shared/`
  tree, and the existing `apps/web/src/components/` tree all stay
  exactly where they are. Migration is opportunistic per Decision
  item 6: a service file moves to `services/<area>/` only when
  it's edited for substantive reasons; a tool schema moves to
  `contracts/agent-tools/<capability>/` only when its tool is
  naturally edited. Pre-emptive bulk migration is rejected.
- **Activate the ESLint rule.** The
  `eslint-rules/agent-first-import-boundaries.js` rule file
  defines the import boundary checks from Appendix A; the rule is
  registered in `apps/web/eslint.config.mjs` at `severity: 'off'`.
  Activation (flip to `'error'`) is the first Phase 1 storage
  session's responsibility per Sub-verification 2 below.
- **Specify Phase 1 storage code.** Phase 1 chunk 1
  (`storageProviderService` per ADR-0013) ships in a fresh session
  after ADR-0020 ratifies. ADR-0020 ships the target homes
  (`services/storage/`, `core/evidence/`); the first storage
  session populates them.
- **Specify B.5 rules-substrate docs.** A follow-on session
  (`feat/arch-rules-2026-05-05`) ships `repo-rules.md`,
  `worktree-rules.md`, `delivery-model.md`, `product-map.md`, and
  glossary additions for Stage / Workflow Stage / Module /
  Workflow Phase / Delivery Phase vocabulary. ADR-0020 names the
  vocabulary distinction conceptually in
  `docs/03_architecture/product-workflow-delivery-mapping.md` (the
  six architecture docs added by Phase B of this session) but does
  NOT formalize it as glossary entries.
- **Relocate the worktree directory.** The current worktree at
  `.claude/worktrees/` works; the v2 §1 aspirational target at
  `~/projects/chounting-worktrees/` is flagged as opportunistic
  in `docs/03_architecture/branching-and-feature-flag-strategy.md`
  but not actioned in this session.
- **Create `packages/flags/`.** Deferred until Phase 2 needs the
  shared feature-flag package; v2 §10's package layout is
  forward-looking. Phase 1's storage feature flags (if any) live
  inline per current convention.

### What ADR-0007 / ADR-0011 / ADR-0013 / ADR-0017 already nailed down (do not redraft)

- **ADR-0007** — three-tier agent architecture. ADR-0020 inherits
  verbatim and does NOT propose a fourth tier or re-categorize
  Tier 1 / Tier 2 / Tier 2.5 / Tier 3 boundaries. The Tier 1
  commit path lives under `services/`; the Tier 2 proposal
  pipeline under `agent/orchestrator/` + `agent/tools/`; the
  Tier 2.5 Relationship Router under `services/` (not `agent/`,
  per ADR-0011 §11 read-boundary inheritance); Tier 3 surfaces
  under `app/` + `components/`. ADR-0020's folder layout makes the
  three-tier separation visible; it does not amend the framework.
- **ADR-0011 §1 + §14** — entity ownership boundary and Domain
  Boundary Map. ADR-0020's `services/<area>/` subdirectory naming
  follows §14 verbatim: `services/accounting/`,
  `services/evidence/`, `services/storage/`, `services/audit/`,
  `services/auth/`, `services/org/`, `services/user/`,
  `services/middleware/`. ADR-0020 does NOT extend §14 or propose
  new domain ownership.
- **ADR-0013** — Storage Provider service. ADR-0013's
  `storageProviderService` is the first first-class consumer of
  the ADR-0020 layout; ADR-0013's implementation lands under
  `services/storage/storageProviderService.ts`. ADR-0020 does NOT
  re-specify the service's interface, evidence-handling logic, or
  storage-provider abstraction; all of that lives in ADR-0013.
- **ADR-0017** — Vendor Template Substrate. ADR-0020 inherits the
  substrate-only-v1 framing verbatim and does NOT amend ADR-0017's
  `vendor_rules` schema, single-writer rule, closed enum
  membership, or audit-event vocabulary.
- **`docs/02_specs/ledger_truth_model.md`** — the 20 invariants.
  ADR-0020 does NOT introduce, modify, or amend any invariant.
  INV-SERVICE-001 (`withInvariants` wrapping) and INV-SERVICE-002
  (`adminClient` discipline) keep their existing scope of
  `src/services/**/*.ts`; the `core/` directory ADR-0020
  introduces is scoped OUT of those invariants per Decision item 1
  below (pure logic; no DB access; no `withInvariants` wrapping
  required because `core/` functions are stateless).
- **`docs/02_specs/agent_autonomy_model.md`** — Agent Ladder,
  limit model, System vs Policy boundary. ADR-0020 ships the
  empty `agent/policies/agent-ladder/` home per Decision item 5;
  ADR-0020 does NOT amend the autonomy model itself.

## Decision

The Decision is presented as nine items. Items 1–8 ratify the
source-tree architecture; item 9 records a governance correction
discovered during this session's pre-flight (the gitignore gap on
`.claude/skills/` since 2026-04-19).

### 1. Folder layout (canonical `apps/web/src/` tree per v2 §3)

The canonical `apps/web/src/` tree is:

```
apps/web/src/
├── app/                # workflow-shaped routes and surfaces
├── agent/              # cognitive layer
│   ├── orchestrator/
│   ├── tools/
│   │   ├── ledger/
│   │   ├── onboarding/
│   │   ├── document/
│   │   ├── evidence/
│   │   └── reference/
│   ├── policies/
│   │   └── agent-ladder/
│   ├── prompts/
│   ├── memory/
│   ├── date-resolution/
│   └── canvas/
├── contracts/          # formal agent/API/event contracts
│   ├── agent-tools/
│   ├── api/
│   ├── events/
│   └── public/
├── services/           # deterministic engine
│   ├── accounting/
│   ├── evidence/
│   ├── audit/
│   ├── auth/
│   ├── org/
│   ├── user/
│   ├── storage/
│   └── middleware/
├── core/               # pure deterministic rules
│   ├── ledger/
│   ├── period/
│   ├── chart/
│   ├── money/
│   ├── tax/
│   └── evidence/
├── db/                 # persistence boundary
│   ├── adminClient.ts
│   ├── types.ts
│   └── repositories/
├── components/         # app UI (CHOUnting-specific shared UI)
├── hooks/
├── lib/
├── shared/             # cross-cutting utilities
└── middleware/
```

Full one-line semantic descriptions live in
`docs/03_architecture/folder-structure.md` (added by Phase B of
this session). The layout is verbatim from CTO Handoff v2 §3.

### 2. `core/` not `domain/` (avoids reopening DDD framing)

Pure deterministic logic — math, validation helpers, rule
predicates, and types with no database, no network, no agent, no
UI — lives under `apps/web/src/core/`. The chosen name is
`core/`, not `domain/`, deliberately:

- **`core/` is descriptive.** It captures "deterministic
  calculations and rules" without invoking a methodology framing.
  Files inside it are pure functions; tests are unit tests; no
  Supabase imports; no agent imports.
- **`domain/` would invite DDD companion folders.** Adopting the
  DDD vocabulary forces companion folders (`application/`,
  `infrastructure/`, `interfaces/`) and reopens questions about
  hexagonal architecture, aggregate roots, and bounded contexts —
  exactly the questions the v2 acceptance rejects.

The `core/` framing preserves the testability property
(accounting and evidence rules unit-testable without spinning up
Supabase or the agent runtime) without committing to DDD as an
organizing methodology.

### 3. Import boundary rules per v2 §11 (codified in Appendix A)

Six import boundary rule blocks (`agent/`, `services/`, `core/`,
`db/`, `app/`, `contracts/`) ship verbatim from CTO Handoff v2
§11 in **Appendix A** of this ADR. The rules are normative for
all code under `apps/web/src/`. Enforcement is deferred to the
ESLint rule scaffold per Decision item 7; the rule file is
registered at `severity: 'off'` in this session and flips to
`'error'` when Phase 1's first storage code lands per
Sub-verification 2 below.

The most load-bearing rules:

- **`agent/` may not import `db/adminClient` or `db` repositories
  directly.** Agent code calls services; services call db. Agent
  code must not bypass the service layer for database access. (The
  current Q33 narrowed exemption per `docs/03_architecture/monorepo.md`
  remains in force; ADR-0020 does NOT modify Q33's deferral state.
  The 3 remaining `@/db/adminClient` agent-runtime sites stay
  flagged where they are; they enter Phase 1 carrying the same
  exemption.)
- **`services/` may not import `agent/`, `app/`, or React
  components.** The deterministic engine does not depend on the
  cognitive layer or the UI.
- **`core/` may not import `db/`, `services/`, `agent/`, `app/`,
  `contracts/` (transport types), or React.** Pure functions only.
- **`db/` may not import `services/` or `core` business
  orchestration.** The persistence boundary owns generated types,
  the admin client, and repositories — not domain logic.
- **`contracts/` may import only zod and primitive shared types.**
  No service or agent imports inside contracts.

### 4. `contracts/agent-tools/` placement; opportunistic migration

Tool input/output schemas, tool result envelopes, dry-run response
contracts, and approval-requirement metadata live at
`apps/web/src/contracts/agent-tools/<capability>/`. Capability
subdirectories (`ledger/`, `onboarding/`, `document/`, `evidence/`,
`reference/`) are created on first use; ADR-0020 ships the
top-level `contracts/agent-tools/` directory with a README only.

**Migration rule.** Existing tool schemas at
`apps/web/src/agent/tools/schemas/` and
`apps/web/src/shared/schemas/accounting/` migrate to
`contracts/agent-tools/<capability>/` only when their tool is
naturally edited. Pre-emptive bulk migration is rejected.

The rationale matches the substrate-now-enforcement-later
pattern: ratify the home now (so future tool authors land schemas
in the right place from day one); migrate existing schemas
opportunistically (so the migration cost amortizes over the
natural editing cadence rather than landing as a single large
refactor).

### 5. `agent/policies/agent-ladder/` empty home created in this session

The Agent Ladder per `docs/02_specs/agent_autonomy_model.md` §4
(three rungs: Always Confirm / Notify & Auto-Post / Silent Auto)
plus promotion ceremonies (§4.1) and demotion paths (§4.3) is
load-bearing for Phase 2 (interaction model extraction).
ADR-0020 ships the empty home at
`apps/web/src/agent/policies/agent-ladder/` with a README.md that
forward-references:

- Canonical authority: `docs/02_specs/agent_autonomy_model.md`
- Implementation begins: Phase 2 (interaction model extraction)

A load-bearing distinction the README captures: **Agent Ladder
*policy logic* (decision rules, promotion/demotion conditions)
lives here in `agent/`. Agent Ladder *durable state* (track
records, rule rungs, promotion ceremonies as audit events) is
persisted through services and the database — never held only in
agent memory.** Per the Decision item 1 dependency direction:
agent code calls services; services write to db. The Agent
Ladder is not an exception to that rule.

### 6. Opportunistic migration only (no bulk move)

Existing files under `apps/web/src/services/accounting/`,
`apps/web/src/agent/`, `apps/web/src/shared/schemas/`, and
`apps/web/src/components/` stay where they are. Migration to the
new layout is opportunistic:

- **Service files** move to `services/<area>/` only when the file
  is edited for substantive reasons (not just to relocate).
- **Tool schemas** move to `contracts/agent-tools/<capability>/`
  per Decision item 4.
- **Agent tools** move to `agent/tools/<capability>/` per Decision
  item 1's tool-surface organization (not DDD; tool-surface is
  organized by what-the-tool-does, not by what-domain-it-touches).
- **Pure logic extraction** (any function that fits `core/`'s
  no-DB-no-network-no-agent rule) moves to `core/<area>/` only
  when the surrounding service is naturally being edited.

The cost of opportunistic migration is dispersed across the
natural editing cadence; the cost of bulk migration is concentrated
into a single PR with high review burden and high regression risk.
The opportunistic-migration rule has been validated repeatedly in
prior phases (LT-03 service-layer migration; the
Component-extraction pattern from Arc A) and is the chosen path
here.

### 7. ESLint rule scaffold-not-firing

The import boundary rules from Appendix A are codified in a
custom ESLint rule at:

```
eslint-rules/agent-first-import-boundaries.js
```

Rule file structure mirrors the existing
`eslint-rules/withInvariants-wrap-or-annotate.js` (the LT-01b
rule from Arc A). The rule is registered in
`apps/web/eslint.config.mjs` at `severity: 'off'` for this
session.

**Activation gate.** When Phase 1's first storage code lands
under `services/storage/storageProviderService.ts`, that
session's validation gate enables the rule as `'error'` in
`apps/web/eslint.config.mjs` as part of its commit. This is
Sub-verification 2 below.

The pattern matches **Q29 ESLint rule deferral** (the
`agent_architecture_policy.md` §6.2 forward-pointer) and the
existing `no-restricted-imports` rule on `@/db/adminClient` (which
ratified at v1 with broad scope and narrowed via Q33-style
exemptions when first consumers materialized). ADR-0020's rule
follows the same shape: substrate-defined now, enforcement
activated when the first consumer materializes.

### 8. No retroactive renames

Existing phase folders (`docs/09_briefs/phase-1/`,
`docs/09_briefs/phase-1.2/`, `docs/09_briefs/phase-1.5/`,
`docs/09_briefs/phase-2/`), friction-journal archives
(`docs/07_governance/friction-journal/phase-1.1.md` and
similar), and ADR cross-references all stay as-is. ADR-0020 does
NOT rename any phase folder, archive, or cross-reference.

The cost of retroactive renames is reference rot: every brief,
every retrospective, every CLAUDE.md or AGENTS.md cross-reference
that names a phase folder by path would break. The benefit
(consistency with the new naming convention) does not justify the
break. Phase folders, like ADR numbers, are stable identifiers
once committed.

### 9. Skills tracking correction (governance correction)

A pre-flight check for this session discovered that
`.claude/skills/` has been silently gitignored since the
2026-04-19 skills migration. The gitignore rule `.claude/*` plus
`!.claude/settings.json` re-included only `settings.json`, not
the skills tree. CLAUDE.md treats skills as load-bearing project
infrastructure ("Skills in `.claude/skills/` summarize and
point"), and Phase 0's six-session governance arc loaded these
skills repeatedly across D1–D6 — but none of those Phase 0
commits include the skills as part of the ratified state. Every
fresh clone of the repo has been losing the skills entirely; only
the local checkout where the skills were created on 2026-04-19
has had them.

This commit corrects the gap with a two-line addition to
`.gitignore`:

```
!.claude/skills/
!.claude/skills/**
```

(Both lines are needed because `.claude/*` excludes
`.claude/skills/` as a directory; git cannot recurse into an
excluded directory to re-include children, so the directory itself
plus the recursive contents both require explicit re-inclusion.
The existing comment block in `.gitignore` already calls out this
caveat for `.claude/` vs `.claude/*`.)

The substrate commit also first-time-tracks the five existing
skill folders (agent-tool-authoring, audit-scans,
integration-test-rules, journal-entry-rules,
service-architecture), `.claude/skills/README.md`, and
`.claude/settings.json` (currently un-ignored but never staged).

This is a **governance correction**, not a new architectural
decision: the skills are already referenced by CLAUDE.md as
load-bearing project infrastructure; tracking them merely matches
what the architectural statement already claimed. A friction-
journal NOTE entry records the discovery for traceability per the
codification-candidate framing; if a future "doc/config exists on
disk but isn't tracked" finding lands the same way, the codified
discipline fires at N=2.

## Consequences

### What this enables

- **Phase 1 chunk 1 lands in the new shape from day one.** The
  first Phase 1 storage file (`storageProviderService.ts` per
  ADR-0013) lands at `apps/web/src/services/storage/`; pure
  evidence rules extract to `apps/web/src/core/evidence/`; the
  storage tool's contract lands at
  `apps/web/src/contracts/agent-tools/evidence/` if the tool is
  authored in the same session. The substrate is in place; the
  first consumer doesn't pay any architectural-decision cost.

- **The agent boundary becomes visible at the folder layer.** The
  authority gradient (`agent/` → `contracts/` → `services/` →
  `core/` → `db/`) maps directly to folders. A new contributor
  reading `apps/web/src/` sees the layers; a code reviewer
  scanning a PR sees which authority layer each file belongs to.
  The product_vision.md thesis ("the product is the control
  surface over the AI") gets a load-bearing architectural
  embodiment.

- **Tool contracts get a canonical home.** Future tool authors
  land schemas at `contracts/agent-tools/<capability>/` from day
  one; auditors and reviewers asking "what is the AI allowed to
  ask the system to do?" have a single tree to inspect.

- **Pure logic gets a no-DB testable home.** The `core/` layer
  lets accounting and evidence rules be unit-tested without
  spinning up Supabase or the agent runtime. The first concrete
  candidate is `core/evidence/` per Phase 1 chunk 1; later
  candidates (`core/ledger/postingRules.ts`, `core/period/
  isPeriodLocked.ts`) extract opportunistically as their
  surrounding services are edited.

- **The Agent Ladder gets an implementation home.** Phase 2's
  interaction model extraction has a concrete target folder
  (`agent/policies/agent-ladder/`) with a README pinning the
  durable-state-through-services rule. The Phase 2 work doesn't
  spend time choosing where the Agent Ladder logic lives.

- **The substrate-now-enforcement-later pattern extends to the
  source-code-layout axis.** Future ADRs at the same axis
  (capability subdirectory codifications, packages/flags/
  introduction, worktree relocation) can reference ADR-0020 as
  precedent.

### What this constrains

- **No file under `apps/web/src/agent/**` may import
  `db/adminClient` or `db` repositories directly** once the ESLint
  rule activates per Decision item 7. The current Q33-narrowed
  exemption (3 agent-runtime sites in `orgContextManager`,
  `orchestrator/index`, `loadOrCreateSession`) carries forward; a
  future contributor who proposes a new agent-side direct DB
  access without amending Q33 is proposing a layering violation
  caught by the ESLint rule (once activated) and by code review
  (always).

- **No file under `apps/web/src/services/**` may import
  `apps/web/src/agent/**` or React components.** The
  deterministic engine cannot depend on the cognitive layer or
  the UI. Service tests that currently mock agent behavior should
  test against contract types from `contracts/agent-tools/`, not
  against agent code directly.

- **No file under `apps/web/src/core/**` may import
  `apps/web/src/db/**`, `apps/web/src/services/**`,
  `apps/web/src/agent/**`, or React.** `core/` is pure functions
  only; failure to honor this rejects the testability property
  `core/` is named for.

- **No bulk migration is permitted.** A future contributor who
  proposes "let's move all 6 existing accounting services to
  `services/accounting/` in one PR" is proposing the bulk
  migration that Decision item 6 rejects. The opportunistic-
  migration rule is the chosen discipline; bulk migration
  produces a high-review-burden PR with concentrated regression
  risk.

- **No reorganization of `agent/tools/` into capability subdirs
  in this session.** The current flat structure stays; capability
  subdirectories appear as new tools are authored or as existing
  tools are naturally edited.

- **No `domain/` folder under any rationale.** `core/` is the
  pure-logic home; proposals to rename `core/` to `domain/` are
  proposing a re-litigation of the v2 acceptance. If the DDD
  vocabulary is needed for a specific domain reasoning task, the
  reasoning lives in a doc, not a folder rename.

### What this costs

- **Repository scope.** One ADR (this one, ~720 lines), six new
  architecture docs under `docs/03_architecture/` (added by
  Phase B of this session), one ESLint rule file at
  `eslint-rules/agent-first-import-boundaries.js`, four empty
  target folders with READMEs (`agent/policies/agent-ladder/`,
  `core/`, `core/evidence/`, `contracts/agent-tools/`), three
  `.gitkeep` placeholders (`services/storage/`,
  `services/evidence/`, `db/repositories/`), one `apps/web/eslint.config.mjs`
  edit (rule registration at `severity: 'off'`), three light
  skill updates (`.claude/skills/service-architecture/SKILL.md`,
  `.claude/skills/agent-tool-authoring/SKILL.md`,
  `.claude/skills/README.md`), one `docs/INDEX.md` update
  (alphabetical entry additions for the six new docs and ADR-0020),
  one `docs/09_briefs/CURRENT_STATE.md` append, one `.gitignore`
  patch (skills tracking correction per Decision item 9), one
  friction-journal NOTE entry (gitignore discovery), and the
  first-time tracking of five existing skill folders + skills
  README + `.claude/settings.json`. Roster total: ~28 files.

- **No runtime cost.** The ESLint rule is at `severity: 'off'`;
  the empty folders ship with READMEs and `.gitkeep` only; no
  service or agent file is moved or modified beyond the three
  light skill summary additions.

- **Future activation cost.** When Phase 1's first storage code
  lands, that session's validation gate flips the ESLint rule to
  `'error'` and runs `pnpm --filter @chounting/web lint` against
  the post-storage codebase. If the storage code or any other
  in-tree code under `apps/web/src/agent/**` violates the import
  boundary rules, that session has to fix the violation before
  shipping. The cost is bounded: only `agent/`-layer code (which
  Q33 already exempts the existing 3 sites of) and any new
  Phase 1 storage file under the new layout are in scope.

- **Test surface cost.** The ESLint rule scaffold has its own
  `__tests__/` directory under `eslint-rules/` (per the existing
  `withInvariants-wrap-or-annotate.js` pattern). Phase 1's first
  storage session writes the test cases when it activates the
  rule.

## Cross-references

- **ADR-0007** — three-tier agent architecture; Tier 1 commit
  path discipline; Tier 2 proposal pipeline; Tier 2.5
  Relationship Router; Tier 3 interface. Inherited verbatim.
- **ADR-0011 §1 + §14** — entity ownership boundary and Domain
  Boundary Map. ADR-0020's `services/<area>/` subdirectory
  layout follows §14 verbatim.
- **ADR-0013** — Storage Provider service. First Phase 1 consumer
  of the ADR-0020 substrate; lands under `services/storage/`.
- **ADR-0017** — Vendor Template Substrate. Substrate-only-v1
  precedent ADR-0020 inherits in shape (substrate at v1
  ratification time, enforcement deferred to first-consumer
  time).
- **Phase 0 D6 §6.8** — substrate-now-enforcement-later
  cross-pattern codification. ADR-0020 is the post-Phase-0
  application at the source-code-layout axis.
- **`docs/00_product/product_vision.md`** — Thesis and Thesis
  Extension (the 2026-04-16 control-surface framing). The
  product-positioning anchor for the agent-first organizing axis.
- **`docs/02_specs/agent_autonomy_model.md`** — Agent Ladder
  (§4), promotion ceremony (§4.1), demotion (§4.3), System vs
  Policy boundary (§6). Forward-referenced by the empty
  `agent/policies/agent-ladder/` home.
- **`docs/02_specs/ledger_truth_model.md`** — INV-SERVICE-001
  (`withInvariants` wrapping), INV-SERVICE-002 (`adminClient`
  discipline), INV-AUTH-001 (authorization). Scope of these
  invariants is `src/services/**/*.ts` and is not changed by
  ADR-0020. The new `core/` directory is pure functions and is
  not in scope for `withInvariants`.
- **`docs/03_architecture/monorepo.md`** — Q33 narrowed
  exemption for the 3 agent-runtime adminClient sites. ADR-0020
  does NOT modify Q33's deferral state; the 3 sites stay flagged
  where they are.
- **`docs/07_governance/CTO_HANDOFF_V2.md`** — the architectural
  recommendation. Co-landed in this commit; cited verbatim in
  Appendix A.

## Closes

ADR-0020 closes the source-tree organizing-axis question that the
v1 DDD-first proposal opened and the v2 CTO Handoff resolved.
There is no Q-number anchor in `docs/02_specs/open_questions.md`
for the source-tree axis specifically; the question existed in
the architectural-design layer rather than in the question-filing
queue.

**Explicitly NOT closed by ADR-0020:**

- **B.5 rules-substrate docs** — deferred to follow-on session
  `feat/arch-rules-2026-05-05` after this ADR ratifies. B.5 ships
  `repo-rules.md`, `worktree-rules.md`, `delivery-model.md`,
  `product-map.md`, and the glossary additions for Stage / Module
  / Phase vocabulary.
- **Phase 1 storage code** — lands in a fresh session after this
  ADR ratifies. ADR-0020 ships the empty target homes; Phase 1
  chunk 1 populates them per ADR-0013.
- **`packages/flags/`** — deferred until Phase 2 needs it.
- **Worktree relocation** to `~/projects/chounting-worktrees/` —
  deferred per Decision items' Out-of-Scope; flagged as
  aspirational in
  `docs/03_architecture/branching-and-feature-flag-strategy.md`.
- **Capability subdirectory population** under `agent/tools/<capability>/`
  and `contracts/agent-tools/<capability>/` — fires
  opportunistically per Decision items 4 and 6.
- **ESLint rule activation** (`severity: 'off'` → `'error'`) —
  fires at Phase 1 chunk 1's validation gate per
  Sub-verification 2.

## Sub-verifications (deferred to Phase 1 closure)

The following four verifications confirm ADR-0020's substrate
landed correctly and that the first-consumer activation gates
fire as designed. They check at Phase 1 closure (not at this
session's commit time).

1. **First Phase 1 storage code lands under `services/storage/`
   and `core/evidence/` per architecture.** The first Phase 1
   storage file is
   `apps/web/src/services/storage/storageProviderService.ts`;
   pure evidence rules extract to `apps/web/src/core/evidence/`
   (e.g., `evidenceHash.ts`, `evidenceMetadataRules.ts` per
   v2 §4 example). Verification: `git log --diff-filter=A
   --name-only feat/arch-substrate-2026-05-05..HEAD | grep -E
   '^apps/web/src/(services/storage|core/evidence)/'` returns the
   first storage code paths.

2. **ESLint rule registered in `apps/web/eslint.config.mjs` with
   `severity: 'off'` until first Phase 1 storage code lands; that
   session enables the rule as `'error'` as part of its own
   validation gate.** Verification at this session's commit:
   `grep -A 2 'agent-first-import-boundaries'
   apps/web/eslint.config.mjs` shows the rule registered at
   `severity: 'off'`. Verification at Phase 1 chunk 1's commit:
   the same grep shows `'error'`.

3. **No file renames in this session.** `git show --stat HEAD`
   shows only file additions (no `R` status entries) for files
   outside the gitignore-correction first-time-tracking scope
   (which appears as new files on git's record). The substrate
   ratification adds 22 net-new files plus 6 pre-existing
   skill files first-time-tracked under the gitignore correction;
   no `git mv` operations executed.

4. **Skills tracking correction landed.** `git check-ignore
   .claude/skills/service-architecture/SKILL.md` returns no
   output (the file is no longer ignored). `git ls-files
   .claude/skills/ | wc -l` returns at least 6 (5 skill SKILL.md
   files + `.claude/skills/README.md`; higher if skills have
   additional sub-files at first-time-tracking). The
   `.gitignore` patch matches the two-line addition specified in
   Decision item 9.

## Anti-overscope discipline

ADR-0020 owns the source-tree organizing axis and the empty
target homes for it at v1. The following are explicitly NOT
ADR-0020 scope. Future readers (and future ADR amendment
authors) are warned: if a proposed amendment to ADR-0020 drifts
into the territories below, the proposal is misplaced and should
be re-scoped to the owning ADR or to a separate ADR in its own
right.

- **Phase 1 storage implementation** — owned by **ADR-0013**.
  ADR-0020 does NOT specify storage provider abstraction,
  evidence-handling logic, or the storage tool's input/output
  shape. Phase 1 chunk 1 ships the implementation against
  ADR-0013's contract.
- **Agent autonomy model** (Agent Ladder rungs, promotion
  thresholds, demotion paths, System vs Policy boundary) —
  owned by **`docs/02_specs/agent_autonomy_model.md`** and
  **ADR-0007**. ADR-0020's empty `agent/policies/agent-ladder/`
  home is forward-pointed; the autonomy model itself is not
  amended here.
- **Domain ownership boundary** — owned by **ADR-0011 §1 + §14**.
  ADR-0020's `services/<area>/` subdirectory naming follows
  §14; ADR-0020 does NOT propose new domain ownership.
- **Substrate tables** (`vendor_rules`, `source_documents`,
  `source_document_links`, `document_cases`) — owned by their
  respective ADRs (ADR-0017, ADR-0011, ADR-0016). ADR-0020 does
  NOT modify substrate-table schema or single-writer rules.
- **B.5 rules substrate** — deferred to follow-on session.
  ADR-0020 names the vocabulary distinction (Stage / Workflow
  Stage / Module / Workflow Phase / Delivery Phase) conceptually
  in `docs/03_architecture/product-workflow-delivery-mapping.md`
  but does NOT formalize it as glossary entries.
- **Worktree relocation** to `~/projects/chounting-worktrees/` —
  flagged as aspirational in
  `docs/03_architecture/branching-and-feature-flag-strategy.md`;
  not actioned in this session.
- **`packages/flags/`** — deferred until Phase 2 needs it.

Where ADR-0020 needs to reference any of the above areas, it does
so by ADR number with the boundary explicit (e.g., "Phase 1
storage code lands under `services/storage/` per ADR-0013";
"the existing Q33 narrowed exemption stays in force per
`docs/03_architecture/monorepo.md`"). The forward-pointers in
Sub-verifications 1 and 2 are the load-bearing boundary callouts.

## Notes for future ADR writers

- **The substrate-now-enforcement-later pattern at the
  source-code-layout axis.** ADR-0020 is the first application of
  the pattern at this axis (prior applications were at the
  schema axis, the data-pipeline axis, the autonomy axis, and
  the calibration-policy axis). The shape is the same: ratify
  the substrate at v1 ratification time; defer the enforcement
  to first-consumer time. A future ADR at the source-code-layout
  axis (e.g., `packages/flags/` introduction, capability
  subdirectory codification, worktree relocation) can reference
  ADR-0020 as precedent.

- **The agent-first organizing axis is load-bearing.** A future
  contributor proposing to reorganize `apps/web/src/` by product
  module is reopening the v2 acceptance. The organizing axis is
  authority layer, not bounded context, and that decision is the
  load-bearing line. Product modules remain a documentation /
  traceability concept under `docs/00_product/` and
  `docs/01_workflows/`; source code stays organized by authority
  layer.

- **`core/` vs `domain/` is a settled question.** A future
  contributor proposing to rename `core/` to `domain/` is
  reopening the DDD-framing rejection. The naming choice is
  deliberate and the rationale is documented in Decision item 2.
  If a future need for DDD vocabulary genuinely surfaces (e.g., a
  specific domain reasoning task that benefits from DDD framing),
  the reasoning lives in a doc, not a folder rename.

- **Opportunistic migration is the chosen discipline.** A future
  contributor proposing "let's bulk-migrate all existing services
  to the new layout in one PR" is proposing the bulk migration
  that Decision item 6 rejects. Opportunistic migration costs are
  dispersed across natural editing cadence; bulk migration costs
  concentrate into a single PR with high regression risk and
  high review burden. The opportunistic discipline has been
  validated in prior phases (LT-03 service-layer migration; the
  Component-extraction pattern from Arc A) and is the chosen
  path here.

- **The ESLint rule activation gate is at first-consumer time,
  not at calendar-driven time.** A future contributor proposing
  to activate the `agent-first-import-boundaries` rule before
  Phase 1's first storage code lands is proposing a calendar-
  driven gate where the chosen pattern is consumer-driven. The
  consumer-driven gate fires when the first code path forces the
  question (Phase 1 chunk 1); this lets the activation session
  also fix any immediate violations its own code introduces,
  rather than having an earlier session fix violations on behalf
  of a yet-unwritten consumer.

- **The skills-tracking correction (Decision item 9) is a
  governance correction, not a new decision.** The skills are
  already referenced by CLAUDE.md as load-bearing project
  infrastructure; the gitignore patch matches what the
  architectural statement already claimed. A future contributor
  reading this ADR's Decision items should NOT treat item 9 as
  introducing a new architectural rule — it's recording a
  pre-existing governance gap that this session's pre-flight
  surfaced and corrected.

- **No retroactive renames is a stable identifier discipline.**
  Phase folders, ADR numbers, friction-journal archives, and
  brief filenames are stable identifiers once committed. A
  future ADR proposing retroactive renames for "consistency
  with the new naming convention" is proposing reference rot;
  the cost (every brief, every retrospective, every CLAUDE.md
  cross-reference) does not justify the consistency benefit.

- **The Agent Ladder durable-state-through-services rule is
  load-bearing.** A future contributor proposing to hold Agent
  Ladder track records in agent memory only (without persisting
  through services) is proposing a layering violation. The
  README at `apps/web/src/agent/policies/agent-ladder/README.md`
  pins the rule explicitly; the rationale is the dependency
  direction in Decision item 1: agent code calls services;
  services write to db. The Agent Ladder is not an exception.

## Appendix A — Import Boundary Rules (verbatim from CTO Handoff v2 §11)

These rules are the real architecture. They are codified in
`eslint-rules/agent-first-import-boundaries.js` and registered in
`apps/web/eslint.config.mjs` at `severity: 'off'` per Decision
item 7. Activation as `'error'` fires at Phase 1 chunk 1's
validation gate per Sub-verification 2.

### Agent rules

`agent/` may import:

- `contracts/`
- `services/`
- `shared/`
- `packages/flags`

`agent/` may not import:

- `db/adminClient`
- `db` repositories directly
- `app` routes
- UI components unless explicitly part of canvas/surface
  integration

### Services rules

`services/` may import:

- `core/`
- `db/`
- `contracts/`
- `shared/`
- `packages/flags`

`services/` may not import:

- `agent/`
- `app/`
- React components

### Core rules

`core/` may import:

- `shared` primitives only

`core/` may not import:

- `db/`
- `services/`
- `agent/`
- `app/`
- contracts that imply transport concerns
- React

### DB rules

`db/` may import:

- generated types
- low-level config
- `shared/env`

`db/` should not import:

- `agent/`
- `app/`
- `services/`
- `core` business orchestration

### App rules

`app/` may import:

- `services/` through server actions / route handlers
- `contracts/`
- `components/`
- `packages/ui`
- `packages/flags`

`app/` should not own:

- accounting invariants
- agent policy
- direct DB mutations

**Client components** (`'use client'` files under `app/` or
`components/`) must NOT import from `services/`, `agent/`,
`db/`, or server-only contracts. Client components interact
with the server through server actions, route handlers, or
typed UI-safe props/contracts. This rule prevents accidental
client/server boundary crossings that would either fail to
build (server-only modules cannot bundle into client code) or
leak server secrets into the client bundle.

### Contracts rules

`contracts/` may import:

- zod or schema libraries
- shared primitive types where needed

`contracts/` should not import:

- `services/`
- `agent/`
- `app/`
- `db/`

---

End of ADR-0020. The six architecture docs added by Phase B of
this session (`authority-gradient.md`, `agent-tool-architecture.md`,
`agent-ladder.md`, `folder-structure.md`,
`branching-and-feature-flag-strategy.md`,
`product-workflow-delivery-mapping.md`) cross-reference this ADR
as the canonical source of the agent-first organizing axis.
