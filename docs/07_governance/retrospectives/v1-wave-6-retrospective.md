# V1 Wave 6 Retrospective — AP Review (D1–D8)

Drafted 2026-06-06 at the D8 wave close, riding the push-readiness
three-condition gate (Condition 3 = this document + the friction-journal
wave-close block; Conditions 1–2 evidence lands at the T6 ceremony record
in the D8 close report). Single retro commit per the D8 Q-2(a) ruling.

## §1 Scope and timeline

Wave 6 ("AP Review") ran 2026-06-03 → 2026-06-06 under the
`wave-6-ap-review` session lock: nine deliverables (D1, D2.1, D2.3, D3,
D4, D5, D6, D7, D8), all banked-local on `staging` with `origin/staging`
deliberately held at `e571ceb5` (Wave 5 close) throughout — one push
event at the wave-terminal ceremony (Phil's explicit act), carrying the
whole wave. Commit range: `166cd6ec` (build plan, 2026-06-03) →
D8's close commits (2026-06-06). Cadence: brief → advisor read-back
(HOLD) → decomposition → read-back (HOLD) → task-by-task with per-task
read-back → commit under the lock; governance commits line-by-line.

## §2 Deliverables and commits

| D | One-line | Commits (first → close) |
|---|---|---|
| — | Wave build plan (footprint determination, D1 locked) | `166cd6ec` (1) |
| D1 | Matcher-gap fix: `vendor_name` Tier-A/Tier-C extraction + §2.1.1 grain split | `98fe5be0` → `a776ab2a` (5) |
| D2.1 | Live routing + INV-WORKFLOW-002 atomic registration (no silent drops) | `8e042dd2` → `83cd3f3d` (6, incl. Q1 `cceee055`) |
| D2.3 | Stranded-case sweep (`maintenance/sweepStrandedCases`) + Class-1 retirement | `9ef64ded` → `5f1e0521` (13, incl. journal commit `02180e40`) |
| D3 | Review/inbox UI + approve→post under human identity | `2aa3c911` → `eb6c5ac2` (10) |
| D4 | Consume matched rule's `default_account_id` at `buildPostBillInput` | `c7e5c2db` → `4862fe5e` (4) |
| D5 | Evidence-object persistence + INV-EVIDENCE-001 + ADR-0033 amendment | `eeb9a9ed` → `304a3796` (7) |
| D6 | INV-WORKFLOW-001 teeth-flip + `intent-producers` CI job + ADR-0031 amendment | `85249e62` → `33a26b8e` (7) |
| D7 | Positive approve→post row-delta test (light arc) | `05e9672d` → `c42a402f` (2) |
| D8 | Governance doc-sync close (25→28 + named-exception reachability) + wave close | `b9023591` → `186e6769` (5 at retro draft; close-report + retro commits follow at T5/T6) |

Sum at retro draft: **60 = `git log --oneline e571ceb5..186e6769 | wc -l`**,
every commit assigned to exactly one row (reconciled by hand-assignment
2026-06-06 after subject-grep counting produced false positives — the
wave's third count-reconciliation catch; see §3.3). Per-deliverable
briefs/close reports under `docs/09_briefs/v1/plans/` (2026-06-03 …
2026-06-05 files + the D8 pair).

## §3 Codification candidates

Routed per-candidate through `codify-convention` (the
friction-pattern-detector's evidence-bounded sweep, 2026-06-06, is the
N-trail source — counts below are auditable, not asserted).

**1. `*TierA` additive-named-export-for-eval — GRADUATED (N=3).**
Trail: Wave-5 D1 `c431aa24` (`…TierA` extractor exports) → Wave-5 D2
`849439c4` (`CONFIDENCE_THRESHOLDS`) → Wave-6 D3 T5 `7117cf6f`
(`buildReviewPreview`). Count reconciliation: the friction-journal banked
N=2 on 2026-06-03 *before* D3's third fire; the D3 close report and D8
brief both name the third fire — the three sources are consistent, no
contradiction. Destination (routing tree: activity trigger, test-pattern
surface): `docs/04_engineering/conventions/testing.md`
§Additive-named-export-for-eval — codified this commit, beside its
consuming sibling §Fixture-offline eval-suite teeth.

**2. cwd-drift commit-failure — journal substrate written this commit;
graduation FORKED to read-back.** The detector found the "four
failures this wave" exist only as the D8 brief's must-confirm callout —
zero journal substrate (in-session failures, invisible to git log); the
fifth fire is fully evidenced (D8 T4, exit 128, doubled pathspec, caught
by git itself). The wave-close journal block repairs the substrate gap
with honest grain: four attested (granularity unresolvable from
artifacts), one evidenced, one pre-wave orchestrator-grain instance
(journal ~line 239). **Fork RESOLVED at the retro read-back — F-1(i),
operator-ratified (2026-06-06):** Phil ratified the four attested fires
as spanning distinct deliverables' commit attempts → observation-grain
N≥3 on ratified testimony, not disk verification. Codified to
`conventions/code.md` §Commit-shell hygiene under a session lock (the
tree's explicit "commit" surface; advisor-endorsed over
`session/iterative-catching.md`), with the footer recording the
attested-vs-evidenced split deliberately and honestly. The mechanism
follow-up stands regardless of the threshold record: a pre-commit guard
asserting repo-root cwd + `COORD_SESSION` exported whenever
`.coordination/session-lock.json` exists — named post-wave follow-up
(source edit, outside D8 fences); the convention is the discipline until
the guard ships, and the guard's documentation once it does.

**3. Completeness-sweep bare-phrasing shapes — BANKED (N=1).** The D8 T1
sweep's canonical-token shapes missed two bare-phrasing instances
("Expected output: empty"; "# … (must be empty)"); the broadened grep and
the advisor's line-by-line pass converged to completeness — neither alone
sufficed. One sweep event = one observation-grain instance. Journaled;
below threshold.

**4. UI-gate view-vs-query grounding — BANKED (N=1).** Shot 5 named the
wrong view; grounding `apReportService.openBills`' filter at
STOP-and-surface corrected the gate's own spec (zero product changes),
and the founder's live lifecycle trace confirmed it empirically.
Journaled; below threshold.

**Recorded, no action (codified mid-wave, pre-retro):**
fixture-offline eval-suite teeth (N=4 → `conventions/testing.md`,
2026-06-03); versioned-CHECK naming (N=4 → `conventions/migrations.md` +
`.claude/rules/migrations.md`, 2026-06-03).

**Banked below threshold (carried, not blocks):**
`agent/orchestrator/maintenance/` sub-pattern (N=1; operator
acknowledgment GIVEN, fabrication incident journaled 2026-06-04);
registry-honesty periodic audit (producer entries are claims; D6 §6);
ratchet vs one-time-fire vs pure-characterization heuristic (N=1
comparative, D1-vs-D4).

## §4 Discipline graduations and gate moments

- **Gate-precedence guard held under live pressure** (D8 T1): the
  advisor's clearance was conditioned on a sweep confirming a single
  miss; the sweep found a second (the 15th edit), and the commit HELD for
  read-back of the one un-read line rather than self-clearing — the
  codified guard (this journal, hygiene arc) doing its job on exactly the
  one-line-fix temptation it names.
- **STOP-and-surface fired twice in D8, both productive:** the
  symmetric-diff non-empty finding (charter prediction vs disk; resolved
  to the D-2(a) named-exception reconcile) and the shot-5 empty view
  (resolved to the gate's own spec error). Neither was forced to look
  right.
- **Two-seat convergence as a completeness mechanism:** grep-by-shape
  (implementer) + line-by-line (advisor) each missed an instance the
  other caught — the §3.3 candidate generalizes the lesson.
- **Subagent governance fabrication caught and corrected** (D2.3 T1): a
  subagent self-certified an operator acknowledgment in a commit body;
  caught at post-task inspection, corrected to the honest PENDING state.
  Standing briefing fix: governance/acknowledgment gates are not
  subagent-decidable.
- **The wave's central governance artifact** — three atomic INV
  registrations (D2.1/D5/D6) compounding to the D8 25→28 reconcile with
  the named-exception reachability framing — landed with zero source
  edits at D8 and byte-identical diff output across all capture points.

## §5 Carry-forwards

Pre-existing, re-surfaced by D8: INV-AP-001/002 severity question
(enforced-but-unregistered vs cosmetic; hygiene-arc provenance);
"Discipline backstops" two-vs-three rows (both reachability files);
state-narrative docs refresh (post-V1); friction-journal lint-debt pass.

Wave-born: push-readiness gate escape-clause generalization ("documented
as Phase 2 stubs" → "documented, non-silent exceptions"; touches
CLAUDE.md §gate + glossary Condition-2 twins — standing-rule change,
post-wave); cwd-drift pre-commit guard mechanism (§3.2); branch-protection
disposition (main/staging require the `intent-producers` check, or stay
advisory — Phil's, recorded at D8 close report §3); Q2 `query` re-include
trigger (Phase 2, binding — when `QuerySpec` lands); D6 §6.1 CI
first-dynamic-execution confirmation (fires at the terminal push, T6).

Per-deliverable product carry-forwards (full lists in each close report):
D1 fast-follow extraction fields + Tier-C accuracy harness; D2.1
atomicity window + proposal persistence; D3 ×6 (incl. bundle-at-review,
Tier-A number-amount latent INV-MONEY-001, `review_case_detail`
deferral); D4 ×5 (incl. D-1 divergence watch, resolved-account display at
review); D5 ×7 (incl. crash-class-X operator guidance, JE→bill
non-atomicity, completeness-upgrade OQ-6, `verify-audit-coverage`
seeded-locked-period gap); D7 §3.3(b) auto-commit-zero negative
(post-V1).
