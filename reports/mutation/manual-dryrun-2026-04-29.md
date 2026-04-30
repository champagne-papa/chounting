# Manual Mutation Dry-Run — journalEntryService.post()

**Date:** 2026-04-29
**Operator:** philc
**Synthesis:** Drafted by Claude (claude.ai) from WSL Claude's raw run output.
**Validation status:** Findings below are operator's gut + Claude's pattern synthesis.
This document has NOT been reviewed by an independent party. Treat pattern claims
as one valid reading among possible others until externally sanity-checked.

## Run summary

- Target: `src/services/accounting/journalEntryService.ts`, function `post()` and helper `validateReversalMirror()`.
- Method: 8 hand-picked mutations, applied one at a time via direct edit, with `git checkout` between each.
- Test subset between mutations: targeted post()-relevant suite (8 integration files, 2 unit files).
- Final full suite re-run after the 8 cycles: failed with the same two pre-existing failures (state residue).

**Score: 5 / 8 killed, 2 partial, 3 survived.**

## Per-mutation results

| # | Mutation | Status | Killer test | Notes |
|---|---|---|---|---|
| 1 | Period lock check inverted | KILLED (mislabel) | `adjustmentEntry`, `journalEntryPeriodDateRange` (collateral) | `lockedPeriodRejection` did NOT catch; DB trigger acted as backstop. Category A floor #2 is weaker than its name. |
| 2 | Period-not-found block deleted | SURVIVED | — | Bucket A. No test exercises invalid `fiscal_period_id` input. |
| 3 | Date range inverted | KILLED (clean) | `journalEntryPeriodDateRange` | Strong kill — typed-error assertion distinguished service-layer from DB-trigger. |
| 4 | `entryType` collapsed to 'regular' | PARTIAL | `adjustmentEntry` only | Caught for adjustments, NOT for reversals. `reversalMirror` doesn't assert on `entry_type`. |
| 5 | `action` collapsed to 'journal_entry.post' | PARTIAL | `adjustmentEntry` only | Caught for adjustments, NOT for reversals. Reversal audit action could be silently mis-logged. |
| 6 | `reversal_reason` whitespace check weakened | SURVIVED | — | Bucket A + parallel-oversight: `adjustment_reason` has a whitespace test, `reversal_reason` doesn't. No DB CHECK backstop. |
| 7 | Mirror canary (require identical not swapped) | KILLED (clean) | `reversalMirror` | Two-direction kill. Mirror invariant genuinely tested. |
| 8 | Cross-org reversal check deleted | SURVIVED | — | Bucket A + security-shaped. Service-layer is the only guard (admin-client bypasses RLS). Latent privilege escalation. |

## Pattern findings (Claude's synthesis — externally unverified)

**Finding 1 — Three survivors share one shape.** Mutations 2, 6, and 8 all delete typed-error guards on input-validation paths that no test exercises with malformed input. This is one architectural gap repeated three times: the suite covers happy paths and happy-path-near-misses, not "what happens when the caller sends nonsense."

**Finding 2 — Reversal-vs-adjustment test asymmetry.** The adjustment test asserts on `entry_type`, audit `action`, and reason shape. The reversal test asserts only on the line-level mirror. Same domain, parallel operations, different test depth. The mirror canary (mutation 7) was caught with maximum signal — meaning when reversals were tested, they were tested well, but only on one property.

**Finding 3 — Category A floor #2 is mislabeled.** `lockedPeriodRejection.test.ts` is described as testing the service-layer guard. Mutation 1 demonstrates it actually only tests "an error is thrown" and relies on the DB trigger. The test passed for the wrong reason. This is a Bucket D finding hiding inside the highest-confidence test category.

**Finding 4 — State-residue fragility is reproducible within a single session.** The session began with two failing tests due to prior-run residue. After 8 mutation cycles + cleanup attempts, the same two tests failed again at session end. This is not "flaky tests"; this is "the suite is not idempotent across runs without explicit DB reset." Normal-developer-workflow distance.

## Cross-mutation observations

- No mutation produced a crash-kill (TypeError, "cannot read property"). All 5 kills were clean ServiceError or AssertionError shape. The kills that did happen were structurally sound.
- The targeted post()-relevant subset stayed green across all 8 cycles. The broader full suite did not. The targeted subset is genuinely cleaner state; the broader suite carries residue accumulators (audit_log, fixed-UUID test data).

## Caveats

- This was 8 hand-picked mutations, not exhaustive. A full Stryker run would generate ~150-300 mutants and could surface findings these 8 missed.
- The mutations targeted `post()` and `validateReversalMirror()`. They do NOT exercise the Zod schema layer, the DB triggers, the `write_journal_entry_atomic` RPC, or the read functions (`list`, `get`).
- Pattern findings 1-3 are Claude's synthesis. The raw kill/survive data is mechanical; the *grouping* into patterns is interpretive. Worth a sanity check by an independent reader before treating any single pattern as canonical.

## Implications for the §11 policy (DEV_WORKFLOW.md draft)

Findings to feed into §11 when it is drafted:

1. Mutation testing produces signal that line-coverage tools cannot, because the gap shape is "we test the function, not the property."
2. Parallel-shape features (reversal/adjustment, etc.) need explicit symmetry checks for test surface area. LLMs write the test in front of them, not the test that should exist by symmetry.
3. Test-name truth audits — every Category A floor test should be mutation-audited at least once and the result inscribed in the test header.
4. State-residue is load-bearing infrastructure, not optional cleanup. Idempotency-across-runs is a test-suite property worth treating as a hard requirement.
