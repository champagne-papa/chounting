# apps/web/src/

This folder organizes source code by authority layer per ADR-0020.
Folder placement decisions here are load-bearing — wrong placements
compound through code review and into the runtime architecture.
Before creating any folder under `apps/web/src/`, read this
guardrail.

## Authority-layer enumeration (current siblings)

Each top-level sibling under `apps/web/src/` is an authority layer
or a boundary / library / cross-cutting node. The canonical
descriptions live in
[`docs/03_architecture/folder-structure.md`](../../../docs/03_architecture/folder-structure.md);
the canonical sub-pattern for placing new code within a layer
lives in
[`docs/04_engineering/conventions.md`](../../../docs/04_engineering/conventions.md)
§ "Contribution Conventions". The list below cross-references — it
does not re-derive.

- **`agent/`** — cognitive layer (orchestrator, tools, prompts,
  policies, memory, canvas). New tool → `agent/tools/<toolName>.ts`
  per `conventions.md`. See `folder-structure.md` § `agent/`.
- **`app/`** — workflow-shaped Next.js routes and surfaces. Routes
  call services / server actions; routes do NOT own accounting
  rules or agent policy. See `folder-structure.md` § `app/`.
- **`components/`** — CHOUnting-specific shared UI. Design-system
  primitives live in `packages/ui/`, not here. See
  `folder-structure.md` § `components/`.
- **`contracts/`** — formal Zod / TypeScript schemas at the
  agent ↔ services seam. New tool contract →
  `contracts/agent-tools/<capability>/`. Boundary artifact, not an
  authority layer. See `folder-structure.md` § `contracts/`.
- **`core/`** — pure deterministic rules (no DB, no I/O, no agent,
  no UI). Per ADR-0020 Decision item 2, the chosen name is `core/`
  not `domain/`. Pure logic extracted from services per ADR-0020
  Decision item 6 (opportunistic). See `folder-structure.md`
  § `core/`.
- **`db/`** — persistence boundary (admin client, generated types,
  repositories). Layer 1 home. New repository →
  `db/repositories/<entity>Repository.ts`. See `folder-structure.md`
  § `db/`.
- **`middleware/`** — Next.js middleware (auth, locale, MFA
  enforcement). Distinct from `services/middleware/` which holds
  the `withInvariants` wrapper. See `folder-structure.md`
  § Cross-cutting.
- **`services/`** — Layer 2 deterministic engine. Subdirectory
  naming follows ADR-0011 §14 Domain Boundary Map. New service
  function → `services/<module>/<entity>Service.ts` per
  `conventions.md`. The Two Laws (all DB access through `services/`;
  all journal entries via `journalEntryService.post()`) are
  canonical. See `folder-structure.md` § `services/`.
- **`shared/`** — shared primitives (env loading, logging, type
  primitives). Imported by every layer. New Zod schema →
  `shared/schemas/<module>/<entity>.schema.ts` per `conventions.md`.
  See `folder-structure.md` § Cross-cutting.

Two additional canonical authority layers documented in
`folder-structure.md` are not yet present at execution time and
materialize at first-consumer time per the
opportunistic-migration discipline (ADR-0020 Decision item 6):

- **`hooks/`** — cross-cutting React hooks. Permitted; create when
  the first cross-cutting hook is authored.
- **`lib/`** — cross-cutting non-React utilities (formatting,
  parsing, etc.). Permitted; create when the first cross-cutting
  utility is authored. Smaller than `shared/`.

## Permitted patterns

- A new folder under `apps/web/src/` that exactly matches an
  authority-layer name from the canonical list above (current
  siblings + `hooks/` + `lib/`).
- A new sub-folder under an existing authority layer that follows
  the canonical sub-pattern for that layer (`services/<module>/`,
  `agent/tools/<capability>/`, `contracts/agent-tools/<capability>/`,
  `db/repositories/`, `core/<area>/`, `shared/schemas/<module>/`,
  etc.) per `conventions.md` § "Contribution Conventions" and
  `folder-structure.md`.

## Forbidden patterns

The following placements are forbidden under `apps/web/src/`. Each
worked example carries a one-sentence rationale.

- **`apps/web/src/utils/`** — `utils/` is a catchall name that
  signals no clear ownership; cross-cutting utility code lives in
  `shared/` (env, logging, type primitives) or `lib/` (non-React
  utilities) per the canonical layer split, both of which carry
  their own authority semantics that `utils/` would erode.
- **`apps/web/src/modules/<feature>/`** — DDD-style per-feature
  subtrees collapse the authority gradient into a single folder
  and re-introduce the framing CTO Handoff v2 §12 explicitly
  rejected; product features are vertical slices through the
  authority layers, not folders of their own.
- **Any per-feature / per-module / per-domain top-level folder
  under `apps/web/src/`** — a top-level folder named for a product
  feature, module, or domain concept (e.g.,
  `apps/web/src/billing/`) duplicates the cross-cutting axis at
  the wrong granularity: billing-related code spans
  `services/billing/`, `core/billing/`,
  `db/repositories/billingRepository.ts`, etc., per the
  authority-gradient organizing axis. Per the DDD-rejection logic
  in `CTO_HANDOFF_V2` §12, source code is organized by authority
  layer, not by bounded context.

## Decision rule for ambiguous cases

If your case doesn't clearly match a permitted pattern AND doesn't
clearly violate a forbidden pattern: file an ADR before creating
the folder. The ADR ratifies the new pattern; the folder follows
the ADR. Do not create the folder first and document later — the
ADR is the substrate, the folder is the consumer.

## Bypass procedure

The bypass discipline mirrors the substrate-now-enforcement-later
pattern (ADR-0010 + ADR-0020) at the folder-placement axis:

- **New authority layer.** Requires an ADR ratifying the addition
  to the canonical list in `folder-structure.md`. The ADR is
  operator-led; AI agents may not propose a new authority layer
  unilaterally. The ADR lands first; the folder lands second.
- **New sub-pattern within an existing authority layer.** Requires
  operator acknowledgment in the commit body and a friction-journal
  entry recording the case as evidence for future codification. AI
  agents may not unilaterally introduce a new sub-pattern; the
  commit body's acknowledgment is the audit trail surfaced at PR
  review.

If the new sub-pattern fires three times across distinct sessions,
the codification threshold (per `conventions.md` § "Codification
thresholds") is met and the pattern is added to the canonical
sub-pattern list in `conventions.md` § "Contribution Conventions"
in a follow-on session.

## Cross-references

- ADR-0020 — Agent-First Authority-Gradient Source Architecture.
  Ratifying ADR for the source-tree organizing axis. The full
  Appendix A import boundary rules are normative for all code
  under `apps/web/src/`.
- [`docs/03_architecture/folder-structure.md`](../../../docs/03_architecture/folder-structure.md)
  — canonical layout reference; per-layer one-line semantic
  descriptions and worked sub-trees.
- [`docs/03_architecture/authority-gradient.md`](../../../docs/03_architecture/authority-gradient.md)
  — the four-layer authority framing each top-level folder maps
  to.
- [`docs/04_engineering/conventions.md`](../../../docs/04_engineering/conventions.md)
  — § "Contribution Conventions" for canonical sub-patterns;
  § "Codification thresholds" for the convention-codification
  cadence; § "Documentation Routing" for doc-routing rules.
