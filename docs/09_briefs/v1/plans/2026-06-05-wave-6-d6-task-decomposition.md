# Wave 6 D6 — Task Decomposition

**Status:** DRAFT — surfaced for advisor read-back. Implementation
starts task-by-task after green, each task getting a per-task code
read-back (code + runs surfaced together).
**Anchors:** the LOCKED brief
(`2026-06-05-wave-6-d6-teeth-flip-brief.md`, committed `85249e62`) —
D-1…D-7 settled there and NOT relitigated. The three brief-read-back
carry-ins are encoded below: (i) D-5 harness wiring (advisor-
recommended; **Phil's nod lands at this read-back** — T2 carries both
variants); (ii) the leaf's headline enforcement claim carries both
hedges; (iii) `producers.ts` is the grep-visible annotation site.
**Grounding HEAD:** `85249e62` (47 banked-local).

Dependency spine: T1 → T2 → T3 → T4 → T5. Commits individually under
the lock from the repo root; TDD within each task; no push. T3/T4 are
governance commits (line-by-line read-back; never subagent-decidable).
**Hook note (advisor self-correction):** the ADR pre-commit trigger
fires on `invariants.md` too — T3 fires `adr:lint` + `adr:index
--check` locally and passes (no ADR cites INV-WORKFLOW-001 until T4;
the README matches the still-empty frontmatter). The ordering holds
because the tooling passes at T3, not because it stays silent.

---

## T1 — Scope-out + teeth + `runCheck` extraction + tests

**Files:**
- Modify `apps/web/src/core/intent/producers.ts` — add
  `V1_TEETH_SCOPE_OUT` (D-1; doc comment carries the Q2 rationale +
  the named re-include trigger, with the `intent_model.md §5`
  QuerySpec citation transcribed from disk — must-confirm #5). The
  `query` registry entry byte-unchanged (the AI producer stays
  recorded). **The `INV-WORKFLOW-001` token stays in this file — it is
  THE grep-visible annotation site (carry-in iii); strengthen the
  existing comment into the formal annotation** (the reachability grep
  covers `apps/web/src/` + `supabase/migrations/`, not `scripts/`).
- Modify `scripts/check-intent-producers.ts` — extract pure
  `runCheck(registry, scopeOut) → { gaps, scopedOut, effectiveGaps,
  exitCode }` (exported from the script file itself — no new
  `scripts/lib/` for one function; pinned per brief D-3); the body
  becomes print + `process.exit(result.exitCode)`. Scoped-out keys
  print **visibly** (key + "scoped out of V1 teeth (Q2 ratified)" +
  re-include trigger); unscoped gaps print as **error** lines; header
  comment updated from warn-only to teeth (past-tense the Wave-6
  TODO — the file-top-staleness pattern).
- Create the unit test (home: `apps/web/tests/unit/intentProducers.test.ts`
  — producers.ts is an apps/web module, trivially importable;
  `runCheck` imports from `scripts/` via relative path — verify the
  vitest include covers it or co-locate the pure fn accordingly at
  impl-onset; must-confirm #4).

**Impl-onset verifies:** brief §4 #2 (producers.ts is import-free —
expect clean tsx resolution; adr-check is the CI existence proof),
#4 (test home + vitest reach into `scripts/`), #5 (QuerySpec
citation), #6 (the de-tokenization sentence in the INV-WORKFLOW-002
leaf read before T3 drafts the new leaf).

**Tests (TDD):**
1. Gap-set pin: `intentsLackingNonAiProducer()` over the live
   registry === `['query']`; `V1_TEETH_SCOPE_OUT` === `['query']`;
   `runCheck(live)` → effectiveGaps `[]`, exitCode 0 (the flip-safety
   proof, executable).
2. Teeth bite: synthetic registry with an unscoped no-non-AI intent →
   exitCode 1 + the key in `gaps`; same key scoped out → exitCode 0 +
   the key in `scopedOut` (visibility asserted at the data grain; the
   print lines spot-checked in the run evidence).
3. Carve-out integrity: `INTENT_PRODUCERS.query` still contains its
   AI producer entry (don't-erase, asserted).

**Run evidence:** `pnpm intent-producers:check; echo $?` → the
scoped-out line + exit 0.

**Commit:** `feat(governance): Wave 6 D6 T1 — INV-WORKFLOW-001 teeth (exit gaps>0) + Q2 query scope-out (visible carve-out, re-include trigger named)`

## T2 — CI job + harness wiring (ask (a) — Phil's nod at this read-back)

**Files:**
- Modify `.github/workflows/ci.yml` — new `intent-producers` job,
  adr-check-isomorphic (checkout → pnpm → node → install →
  `pnpm intent-producers:check`); **no `github.event.*` context**; no
  turbo cache; header comment's job inventory updated.
  `verify-audit-coverage.yml` untouched (fence §3.4).
- **Variant A (advisor-recommended):** modify root `package.json` —
  `"agent:validate": "pnpm --filter @chounting/web agent:validate &&
  pnpm intent-producers:check"` — the teeth bite locally during the
  wave (the no-push invariant means the CI job sits un-executed until
  the terminal push); converts the D-0031.2 drift to realized-late.
- **Variant B (strict row):** ci.yml only; the amendment records the
  drift as standing.
  **The decomposition proceeds on Variant A unless Phil's nod at this
  read-back says B** — the advisor's recommendation + the
  teeth-bite-nowhere argument carry the lean; the T4 amendment text
  adjusts to whichever lands.

**Tests / evidence:** YAML reviewed at the read-back grain (the
fence-class static verification — adr-check-isomorphic diff, no event
context, triggers inherited); `pnpm agent:validate` run green
end-to-end (Variant A validating itself); the **dynamic-execution
deferral named in the run evidence** (first real CI execution =
Phil's terminal push; the close report's wave-close checklist gains
"confirm the intent-producers job ran green on the push").

**Commit:** `ci(governance): Wave 6 D6 T2 — intent-producers blocking job in ci.yml (+ agent:validate wiring per ask (a))`

## T3 — INV-WORKFLOW-001 registration (governance commit #1)

**Files:** `docs/02_specs/invariants.md` (row 28) +
`docs/06_audit/control_matrix.md` + `docs/02_specs/ledger_truth_model.md`
(the leaf).

**Scope (carry-ins ii + iii discharged):**
1. Row 28 appended; heading "the 25 invariants" + matrix counts
   untouched (D8's, target 25→28).
2. **The headline enforcement claim carries both hedges** (carry-in
   ii — claim only what is enforced): *"build-time structural — the
   producer-coverage check exits non-zero on any unscoped gap, wired
   as a CI job and into the validation harness [per the T2 variant];
   a red CI run blocks merge only where branch protection requires
   the check (operator-grain); the CI job's first execution occurs at
   the wave-close push."* The hedges live in the row's enforcement
   cell and the leaf's **Enforcement** section headline, not only the
   residual list.
3. **Annotation site = `producers.ts`** (carry-in iii): the row/leaf
   cite `apps/web/src/core/intent/producers.ts` as the grep-visible
   annotation (the reachability grep excludes `scripts/`); the check
   script + the ci.yml job are cited as the **mechanism**, named as
   grep-invisible-by-location. The leaf notes the reverse window has
   been open code-side since Wave 4 and closes here.
4. Residuals (brief D-7, all four): self-declared registry
   (review-guarded); branch-protection operator-grain (per
   must-confirm #3's answer, named either way); dynamic-execution
   deferral; the Q2 carve-out with re-include trigger.
5. INV-WORKFLOW-002's de-tokenization device preserved (must-confirm
   #6 — the new leaf must not retro-tokenize that leaf's reserved-
   block citation).
6. Templates transcribed from disk (row 27 / the two prior leaves) —
   not from memory.

**Commit:** `docs(governance): Wave 6 D6 T3 — register INV-WORKFLOW-001 (row 28 + matrix + leaf; hedged enforcement claim; producers.ts as the grep-visible annotation)`

## T4 — ADR-0031 amendment (governance commit #2)

**Files:** `docs/07_governance/adr/0031-no-ai-only-paths.md` +
regenerated `docs/07_governance/adr/README.md`.

**Scope:** `## Amendment 2026-06-05` block (ADR-0022 §2, before the
parent Cross-references) + frontmatter `invariants:
["INV-WORKFLOW-001"]` + the Status-section temporal-layering note
(ADR-0024/ADR-0033 shape). Records: the teeth realization (the
one-line flip the ADR forecast, plus the runCheck extraction); the Q2
scope-out + re-include trigger; the CI wiring; **the D-0031.2 drift
owned** ("wired into the validation harness" never landed at Wave 4 —
realized-late at D6 per Variant A, or recorded-as-deferred per B);
D-0031.1–.7 byte-preserved. `adr:index` regenerated (the
INV-WORKFLOW-001 grouping — the deterministic README delta).

**Commit:** `docs(governance): Wave 6 D6 T4 — ADR-0031 amendment (teeth realized; Q2 scope-out; D-0031.2 drift owned) + frontmatter invariant`

## T5 — Close: gates + the two-class fence + close report

**Files:** create `docs/09_briefs/v1/plans/<date>-wave-6-d6-close-report.md`.

**Scope:**
1. Gates: `agent:validate` (now self-validating per Variant A) +
   `typecheck` + the T1 unit tests + targeted suites; scoped lint
   claim.
2. **Two-class inverted fence:** (a) governance diff `85249e62..HEAD`
   over the three doc trees = exactly T3's three artifacts + T4's ADR
   + generated README; heading/counts/glossary untouched; (b) **the
   CI fence:** `.github/workflows/` diff = exactly the one job in
   `ci.yml` (verify-audit-coverage.yml untouched), no trigger/
   concurrency changes, no event-context consumption.
3. Close report: brief-vs-shipped D-1…D-7; the dynamic-execution
   deferral as a named deviation-class item with the wave-close
   checklist step ("confirm intent-producers ran green on the
   terminal push"); carry-forward docket (at minimum: the Q2
   re-include trigger as a Phase-2 item; branch-protection
   confirmation per must-confirm #3; D8 handoff now **25→28** across
   heading + matrix counts + reachability-narrative live-count).

**Commit:** `docs(v1): Wave 6 D6 T5 CLOSE — gates green, two-class fence exact, brief-vs-shipped reconciled`

---

## Read-back asks (decomposition-level decisions)

- **(a) T2 Variant A vs B — Phil's nod lands here.** The advisor's
  recommendation (A) is encoded as the default; the argument: under
  the no-push invariant the CI job cannot execute during D6/D7/D8, so
  ci-only teeth bite nowhere until the terminal push. B remains fully
  specified if the strict-row reading is preferred.
- **(b) `runCheck` exported from the script file itself** (no
  `scripts/lib/` for one function); the unit test imports across the
  root boundary — test home + vitest include verified at impl-onset
  (T1 must-confirm), with co-location of the pure fn as the fallback
  if the include fights.
- **(c) T1 commit type `feat(governance)`** — the teeth are a
  behavior change in a governance mechanism, not docs; named for
  consistency review.
- **(d) The script's header rewrite at T1** (warn-only → teeth,
  past-tensing the self-prescription) — the 4th-fire
  file-top-comment-staleness pattern applied prophylactically rather
  than left stale; flagged since the header text was load-bearing
  grounding for this very brief.