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
