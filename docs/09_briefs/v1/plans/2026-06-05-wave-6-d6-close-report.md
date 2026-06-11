# Wave 6 D6 — Close Report

**Status:** DRAFT — surfaced for advisor read-back (T5, the final D6
surface).
**Refs:** brief `85249e62` (LOCKED), decomposition `7f741aef` (LOCKED),
T1 `c4df9f6f`, T2 `216832ad`, T3 `aa85390c`, T4 `6b6da12a`. Grounding
HEAD: `6b6da12a` (52 banked-local; origin `e571ceb5` untouched).
**Charter discharged:** "INV-WORKFLOW-001 teeth-flip — Query-gap
scope-out (§2) → `exit(gaps>0?1:0)` → wire `check-intent-producers.ts`
into CI." Registers: INV-WORKFLOW-001 (row 28). Amends: ADR-0031
(Amendment block + frontmatter). Plus the ask-(a) Variant-A harness
wiring (Phil-cleared scope addition).

---

## 1. What shipped (five commits)

- **T1** (`c4df9f6f`): the teeth — pure `runCheck` in `producers.ts`
  (the ask-(b) import-side-effect gotcha dissolved by placement) +
  `V1_TEETH_SCOPE_OUT: readonly IntentKey[]` (Q2 discharge: visible,
  re-include trigger binding, don't-erase) + the formalized
  grep-visible annotation + the script as thin print-and-exit wrapper
  with the provenance-preserving header; 4 new unit tests.
- **T2** (`216832ad`): the blocking `intent-producers` ci.yml job
  (adr-check-isomorphic, zero `github.event.*`) + the **Variant A**
  root `agent:validate` wiring (the teeth's live home during the
  wave).
- **T3** (`aa85390c`): INV-WORKFLOW-001 registered — row 28 + matrix
  entry + leaf, both hedges headline-grade; **closed the reverse-only
  reachability window open since Wave 4** (the literal token went 0→2
  forward-side).
- **T4** (`6b6da12a`): ADR-0031 Amendment 2026-06-05 (five decision
  items incl. the D-0031.2 drift owned) + frontmatter
  `["INV-WORKFLOW-001"]` + the regenerated README grouping.
- **T5**: this report.

## 2. Gates (at close HEAD)

- `pnpm agent:validate` — **now self-exercising the teeth** (Variant
  A): web validate (typecheck + no-hardcoded-urls + floor 26/26) then
  the check ("1 gap(s); 1 scoped out (V1 carve-out); 0 ERROR(s)",
  exit 0). Green end-to-end.
- `pnpm typecheck`: clean. Unit suite: 10/10 (6 Wave-4 byte-unchanged
  + 4 D6 incl. the executable flip-safety proof and the teeth-bite
  synthetic).
- Lint, scoped: zero findings in D6-touched files.
- ADR tooling: `adr:lint` 13/0/0 at both governance commits — T3 with
  frontmatter `[]` (the hook fired on the `invariants.md` trigger and
  passed) and T4 with the frontmatter populated (the first live
  frontmatter↔registry validation) — the corrected sequencing
  confirmed empirically twice.

## 3. The two-class inverted fence (verified at close)

**Class 1 — governance** (`git diff 85249e62..HEAD` over
`docs/02_specs` + `docs/07_governance` + `docs/06_audit`): **exactly
five files** — `invariants.md` +1 (row 28), `ledger_truth_model.md`
+82 (single insertion hunk at `:2566`; the INV-WORKFLOW-002 leaf and
its de-tokenized citation byte-intact — must-confirm #6),
`control_matrix.md` +7, the ADR +69−1, the generated README +4
(exactly the grouping). Heading "the 25 invariants" byte-untouched;
glossary diff zero.

**Class 2 — CI** (`git diff 85249e62..HEAD -- .github/`): **exactly
`ci.yml`** (+31−2: the one job + the header inventory line);
`verify-audit-coverage.yml` untouched; triggers/concurrency
untouched; existing jobs byte-unchanged; zero `github.event.*` in the
new job (the repo's own workflow-security hook fired at edit time and
the job satisfies it by construction).

## 4. Brief-vs-shipped (D-1 … D-7)

| Position | Shipped state |
|---|---|
| **D-1 carve-out constant** | FAITHFUL + tightened at read-back (typed `IntentKey[]` — the compile-time typo guard, T1 minor 1). Visible in both files; re-include trigger binding; `query`'s registry entry byte-unchanged. |
| **D-2 the teeth** | FAITHFUL. `exit(effectiveGaps>0?1:0)`; flip landed green on the grounded empty effective set; the proof is executable (the unit pin), not asserted. |
| **D-3 runCheck extraction** | FAITHFUL with a surfaced placement deviation: the pure core lives in `producers.ts` (the in-file precedent) rather than exported from the script — dissolving the advisor's ask-(b) import-side-effect gotcha by construction (the script's unconditional `main()` is never on an import path). Advisor-cleared as the better resolution. |
| **D-4 CI job** | FAITHFUL. adr-check-isomorphic; blocking by job-failure semantics (the comment claims exactly that, no merge-blocking overclaim); the security property held for the verified reason (`pull_request`, not `pull_request_target`; fork PRs secretless). |
| **D-5 harness wiring** | **Variant A landed** (Phil's nod via the encoded default through three unflagged read-backs): root `agent:validate` gains the check — the teeth's live home under the no-push posture; D-0031.2 realized-late. |
| **D-6 registration + amendment** | FAITHFUL to both carry-ins: hedges headline-grade in the row cell + leaf Enforcement headline; `producers.ts` as the grep-visible anchor with the mechanism cited-not-grep-counted; the amendment's five items incl. the drift owned with the ratified text unedited. |
| **D-7 honest residuals** | All four named in leaf + matrix: self-declared registry; branch-protection operator-grain (must-confirm #3 remains a Phil question — recorded in §6); the dynamic-execution deferral; the Q2 carve-out. |

## 5. Named deviations (read-back-authorized)

1. **runCheck placement** (D-3 above) — producers.ts, not the script;
   cleared as superior at the T1 read-back.
2. **T1 headers softened pre-commit** (T1 minor 2): variant-neutral
   "gate wiring lands at D6 T2" rather than asserting the harness
   before Phil's nod; reconciled by T2's Variant A landing.
3. The Wave-4 test title at `:58` ("…deferred to Wave 6") left
   byte-unchanged per the advisor's additive-discipline ruling —
   historical label, true assertion.

## 6. Carry-forward docket

1. **The wave-close checklist step (binding):** on Phil's terminal
   push, **confirm the `intent-producers` CI job ran green** — the
   fence-class deferral's closure (the job's first dynamic execution).
2. **Branch-protection confirmation (Phil, operator-grain,
   must-confirm #3):** do `main`/`staging` require the CI workflow's
   checks to merge? The leaf's hedge stands either way; the answer
   sharpens it.
3. **The Q2 re-include trigger (Phase 2, binding):** when `QuerySpec`
   lands and `query` separates from `navigation`, remove `query` from
   `V1_TEETH_SCOPE_OUT` — the check goes red until a non-AI Query
   producer exists.
4. **D8 handoff (compounding, now final for the wave):** heading +
   `control_matrix.md` counts + the reachability-narrative live-count,
   **all 25→28**; the symmetric-diff re-run; the glossary
   "empty reserved directories" reconcile; the wave UI-screenshot
   closeout.
5. **Registry-honesty review discipline** (the self-declared
   residual): producer entries are claims — staleness is
   review-caught only; a periodic registry-vs-disk audit is a
   wave-retro candidate.

## 7. Wave 6 position after D6

D1 + D2.1 + D2.3 + D3 + D4 + D5 + **D6 complete**. Remaining: **D7**
(the positive human-approve→post row-delta test — after D1+D3, now
unblocked and small) and **D8** (governance doc-sync first-class: the
25→28 reconciliation + reachability + UI-screenshot closeout +
release-at-arc-close). Terminal push remains Phil's at wave close,
now carrying the §6.1 checklist step.
