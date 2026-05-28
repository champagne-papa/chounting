# Engineering conventions

This is the index. Canonical conventions are organized topically
under [`conventions/`](./conventions/). See
[`conventions/README.md`](./conventions/README.md) for the routing
rule, decision tree, write-time tripwires, hygiene cadence,
archival rule, and deprecation model.

## Topical files

- [`conventions/code.md`](./conventions/code.md) — contribution
  rules, performance, i18n.
- [`conventions/lint-and-validation.md`](./conventions/lint-and-validation.md) —
  `agent:validate` vs full `pnpm lint` scope, "lint clean" claim discipline.
- [`conventions/service-layer.md`](./conventions/service-layer.md) —
  service template, three-consumer pattern, error-handling review.
- [`conventions/schema.md`](./conventions/schema.md) — Zod
  strictness, API boundary casing.
- [`conventions/migrations.md`](./conventions/migrations.md) —
  review cadence, NOT NULL blast radius.
- [`conventions/audit-permissions.md`](./conventions/audit-permissions.md) —
  permission keys vs audit action keys, catalog count drift,
  `before_state`.
- [`conventions/testing.md`](./conventions/testing.md) — test-scope
  pragmatic reduction at chunk close.
- [`conventions/ai-agents.md`](./conventions/ai-agents.md) —
  agent-mediated session discipline.
- [`conventions/ratified-contract-scope.md`](./conventions/ratified-contract-scope.md) —
  named-scope binds the drafter; adjacent issues carry-forward, not absorb.
- [`conventions/session/`](./conventions/session/) — session-
  execution conventions sub-folder (plan-authoring, scope-lock,
  session-close, iterative-catching).

## Codification thresholds

- **N=2** — split-trigger (sub-types graduate on second instance).
- **N=3** — codification threshold (friction-journal pattern →
  topical entry).
- **N=5** — meta-shape review (re-evaluate at five sub-types).

Working thresholds, not laws; author judgment governs edge cases.
Full discussion in
[`conventions/README.md`](./conventions/README.md#codification-thresholds).

## Deprecation model

Three retirement paths: **Deprecated** (rule no longer applicable;
moved to a "Deprecated Conventions" section in its topical file),
**Superseded** (rule replaced; lineage links both ways), **Merged**
(rules combined; merged-out rules become stubs pointing at the
survivor). Full discussion in
[`conventions/README.md`](./conventions/README.md#deprecation-model).

## Governance audit appendix

Pre-v2.2-reorg ratification trail for Phase 1.2 conventions is
preserved in git history at the pre-reorg form of this file (SHA
`d889e1e`); it is not duplicated here per v2.2 §5.2. Post-reorg,
ratification provenance lives in each topical file's
origin-metadata footer per v2.2 §5.3.

---

**v2.2 reorg note.** This index file replaced the previous
~2,369-line `conventions.md` at Commit A of the v2.2 reorg per
`docs/09_briefs/phase-6.5/reorg-proposal-v2.md`. All content
preserved in topical files under [`conventions/`](./conventions/);
pre-reorg form in git history at SHA `d889e1e`.
