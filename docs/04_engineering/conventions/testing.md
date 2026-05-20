# Testing conventions

Test patterns, mocks, test-scope discipline, and infrastructure-vs-
value evaluation at chunk close.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

The integration-test floor rules and dedicated-test-accounts pattern
live in the `integration-test-rules` skill at
`.claude/skills/integration-test-rules/` and are not duplicated here.

---

## Test-scope-pragmatic-reduction at chunk close

When chunk-close validation surfaces test-infrastructure friction
that exceeds marginal verification value (e.g., DOM environment
gaps for unit tests, browser-API synthesis non-trivialities for E2E
tests, fixture infrastructure not yet shipped), defer the test scope
to a dedicated test-infrastructure session as named-future-trigger.

**Trigger:** any chunk close where test-infra friction surfaces
during validation gate firing.

**Discipline rule.** At chunk-close validation surface, evaluate
test-infra-friction-vs-marginal-verification-value ratio. When
friction exceeds value, defer to dedicated session with named
future-trigger; do not block chunk close on test-infra friction that
yields marginal verification incremental.

**Why:** chunk-close gates exist to verify substrate + service
correctness; test-infra friction at chunk close diverts attention
from substrate verification + delays chunk ship for marginal value.

**Evidence basis (N=3 graduation across Phase 6.5):** chunk 1
(vitest DOM environment gap; React component+hook unit tests
deferred per A1-B disposition; commit `5a9492b`); chunk 2 (A1-B
inheritance; CanvasTabStrip DOM coverage routes through E2E specs +
screenshot gate; commit `c5d7e89`); chunk 3 (Playwright DataTransfer
synthesis non-trivial; E2E specs skipped per Test Deviation 3;
commit `29e2ba1`).

**Cross-references.**
- Phase 6 chunk 6.2b vitest jsdom-config gap for adjacent N=4
  evidence at Phase 6 grain.
- Phase 6.5 retrospective §3 Candidate #7.

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close)
- Evidence basis: N=3 graduation across Phase 6.5 chunks 1, 2, 3
  (commits `5a9492b`, `c5d7e89`, `29e2ba1`)
- Promoted from: Phase 6.5 retrospective §3 Candidate #7
- Cross-references: Phase 6.5 retrospective §3 Candidate #7;
  Phase 6 chunk 6.2b vitest jsdom-config gap (adjacent N=4 evidence
  at Phase 6 grain)

---

## Test-location canonical path discipline (N=5 reaffirmation)

Integration tests live at `apps/web/tests/integration/` —
the canonical centralized location. Co-located `__tests__/`
directories alongside source files are anti-pattern at this
codebase. The discipline fires when authoring new integration
tests or relocating existing tests; brief / directive citations
suggesting co-located placement are corrected to canonical
`tests/integration/` at substrate-receipt grain.

**Trigger:** any new integration test authoring or brief/directive
citation referencing test placement.

**Discipline rule.** Author integration tests under
`apps/web/tests/integration/` (centralized location). E2E tests
under `apps/web/tests/integration/e2e/` (per Phase 7 chunk 7.3b
new precedent). Unit tests under `apps/web/tests/unit/`. Brief /
directive citations specifying co-located `__tests__/` paths are
override-corrected to canonical locations at impl-grade.

**Why:** Centralized test location enables single-pass discovery
(grep / find / IDE navigation) of all test coverage; co-located
`__tests__/` directories produce blast-radius for full-suite-
verification scripts that need to enumerate test locations.
Centralized location also aligns with the integration-test-rules
skill's §3 dedicated-test-accounts pattern and §1 floor-test
enumeration.

**Evidence basis (N=5 cross-validation; Phase 7 chunks
7.1a + 7.1b + 7.2 + 7.3a + 7.3b):** Each Phase 7 chunk-impl
directive cited integration test placement; each chunk-impl
implementation placed tests at canonical `tests/integration/`.
Chunk 7.3b added new `tests/integration/e2e/` subdirectory as
first-instance precedent for e2e-class tests at canonical location.
Five consecutive chunks reaffirming the canonical path discipline
graduates to N=5 cross-validation evidence.

**How to apply.** At impl-grade, place integration tests at
`apps/web/tests/integration/<test-name>.test.ts` (flat) or
`apps/web/tests/integration/<class>/<test-name>.test.ts` (e2e
class, future per-class subdirectories at need). Brief/directive
citations to co-located `__tests__/` are corrected at impl-grade.

**Cross-references.**
- `.claude/skills/integration-test-rules/` §1 floor-test
  enumeration (canonical Category A floor-test paths at
  `tests/integration/`).
- Phase 7 chunks 7.1a + 7.1b + 7.2 + 7.3a + 7.3b commits
  f0fdecc + 4c481a9 + c401296 + 8499189 + ab0f7fe (N=5
  cross-validation evidence).
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #8.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective
  close)
- Evidence basis: N=5 cross-validation across Phase 7 chunks
  7.1a + 7.1b + 7.2 + 7.3a + 7.3b
- Promoted from: Phase 7 retrospective §3 Candidate #8
- Cross-references: `.claude/skills/integration-test-rules/`;
  Phase 7 retrospective §3 Candidate #8
