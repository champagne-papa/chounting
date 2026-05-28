# Lint and validation: `agent:validate` vs `pnpm lint`

The project runs two orthogonal validation gates with non-overlapping scope.

**`pnpm agent:validate` — the canonical contribution gate.** Runs
`pnpm typecheck` (`tsc --noEmit`) + `pnpm test:no-hardcoded-urls` (a
`grep -rn` negation against `localhost:54321` in `tests/` + `src/`) +
`pnpm agent:floor` (`vitest run` against the Category A floor test suite).
It does NOT run ESLint. Per CLAUDE.md What "done" means, passing
`agent:validate` is the done-bar for a contribution.

**`pnpm lint` — full ESLint sweep.** At repo root: `turbo run lint` →
`apps/web` `lint = eslint` (bare). Runs ESLint across the configured
globs; does NOT run typecheck or tests.

**The two gates do not subset each other.** `agent:validate` can be green
while `pnpm lint` surfaces baseline errors in files untouched by the
current contribution (commonly via `architecture/agent-first-import-boundaries`,
`services/withInvariants-wrap-or-annotate`, `no-restricted-imports` — see
Evidence basis below for the exact baseline composition as of the
codification SHA).

**Discipline for "lint clean" claims.** Name the scope. Examples:
*"lint clean on new/modified files"* (the typical contribution claim) vs.
*"full `pnpm lint` baseline = N pre-existing errors in untouched files"*
(when relevant). Bare "lint clean" without scope is ambiguous and at risk
of overclaiming.

**Baseline-clearing is a separate hygiene concern, not this convention.**
This convention documents the scope distinction; it does NOT address
pre-existing baseline errors in untouched files. Clearing them (or
accepting them as the documented baseline with explicit suppression)
belongs to a dedicated lint-hygiene arc.

---

**Origin:**
- First codified: `hygiene-post-ring2a-core` arc, 2026-05-27 (item 6 of
  the post-Ring-2A-core hygiene queue).
- Evidence basis: empirical observation across the arc's items 1–5 —
  every commit's verify-gate named "lint clean on new/modified files"
  while flagging the 38-error pre-existing baseline as of `8b324fcd`
  (composition per disk: 24 `services/withInvariants-wrap-or-annotate` +
  11 `architecture/agent-first-import-boundaries` + 3
  `no-restricted-imports`). Item 2's surface first named the scope-claim
  ambiguity; this convention codifies the discipline.
- Promoted from: `hygiene-post-ring2a-core` arc empirical observation
  across commits `ef100ed6`, `8b324fcd`, `327e9cf6`, `dee35849`,
  `92a79e25` — no antecedent friction-journal entry; documents disk-fact
  (the orthogonal scope of the two gates per `apps/web/package.json`
  definitions).
- Cross-references: CLAUDE.md What "done" means §1;
  `apps/web/package.json` (script definitions);
  `apps/web/eslint.config.mjs` (the linter config).

**Evaluation basis:**

- **Load-bearing (prescriptive).** Generates operator action at two
  surfaces: (1) "lint clean" claims must be scoped — bare claims are
  rejected at review; (2) baseline-error-clearing requires its own arc,
  not silent fixes folded into unrelated work. Both disciplines are
  prescriptive guards against overclaiming and scope creep.
- **Generalizable.** Applies wherever multiple validation gates run
  independently. The chounting-specific axes are `agent:validate` and
  `pnpm lint`; the general shape — non-overlapping gates with
  independently-meaningful greenness — generalizes to any repo with a
  tiered validation story. The "name your scope" sub-discipline is itself
  a reusable contribution-claim discipline.
- **Stable.** The `package.json` script composition has been the canonical
  contribution gate since Phase 0; ADR-0020 Sub-verification 2's ESLint-
  rule activation at `8b324fcd` (`17885dc6`) is the live state. The
  baseline error count may evolve (a future lint-hygiene arc reduces it or
  formally accepts it); the convention's scope-distinction substance is
  structurally stable across that evolution.
