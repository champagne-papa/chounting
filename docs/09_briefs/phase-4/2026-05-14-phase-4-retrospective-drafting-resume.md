# Phase 4 retrospective drafting — fresh conversation; 7-round scope-lock complete

## 1. Header

Resume Phase 4 retrospective drafting in fresh conversation after
7-round scope-lock closed (Rounds 1-7 locked in prior conversation).
This session executes the drafting work: 3 commits A → B → C
sequenced; bundled push to origin after end-of-batch validation.

The 7-round scope-lock outputs structural-shape commitments;
drafting transforms them into the actual ADR amendment text +
retrospective writeup + CLAUDE.md addition + friction-journal entry.

Drafting volume estimated at ~1300-1800 insertions across 3
commits + 2 files (Commit C has writeup + CLAUDE.md addition).
This is at-or-near chunk-3 substrate volume; fresh conversation
chosen via RI-7 evidence-forced reasoning to reduce
context-overhead-risk.

## 2. Scope-lock authority

All 7 rounds locked in prior conversation. Drafting consumes
round outputs as authoritative content + structural-shape
specifications:

- Round 1: Phase 4 closes at chunk-3 substrate complete (1.a
  closure; multi-feature scoring deferred per RI-7
  codify-then-ignore-at-N+1 avoidance)
- Round 2: T1 + T3 + T4 framing-discovery arc treatment (T2b
  deferred; T5 skipped)
- Round 3: 19-item inventory consolidated to T3 (4 items +
  arc-derived) / T3' (2 items) / T4 (4 items + 1 memory-only) /
  T1 (arc + RI-5 trail + brief inventory documentation) /
  memory-only-stays (2 candidates) / carry-forward (4 items) /
  closes-pre-Round-3 (1 item)
- Round 4: T3 four-section mapping; T3' two-section mapping;
  parallel A/B commit-message structure with Commit A
  paradigm-shift callout; impl-time verify trigger for §item 3
  substructure
- Round 5: T1 seven-section writeup structure with
  framing-discovery centerpiece between per-chunk-learnings and
  codified-patterns; T4 CLAUDE.md addition six-sub-section
  structure; descriptive-primary-with-RI-parenthetical naming
  convention; impl-time verify trigger for CLAUDE.md insertion
  site; surface-precedence T3 > T4 > T1 at writeup end
- Round 6: Per-commit typecheck+agent:validate + end-of-batch
  test verification; Option B commit sequencing (sequential
  commits → bundled push); A → B → C drafting order with
  verify-at-impl items at A and C; single F-J entry covering 4
  retrospective-process meta-observations with (4)
  codify-while-deciding leading; ship-readiness three-condition
  gate per CLAUDE.md
- Round 7: Phase 5.1 + Phase 7 cross-phase consumer inheritance;
  per-consumer two-inventory documentation (activation-trigger +
  discipline-reference); T1 section 6 extends to three subsections

If drafting surfaces a decision-touching question that the
7-round scope-lock didn't anticipate (rare; the scope-lock was
comprehensive), STOP and report. Brainstorming-side adjudicates
whether the question is in-scope-of-existing-lock (continue
drafting with the resolution applied) or out-of-scope (round
reopen needed before drafting continues). Do NOT auto-resolve
scope-lock-touching questions at drafting time.

## 3. Source artifacts

Authoritative inputs to drafting:

- **Phase 2 retrospective (precedent shape)**: 8f6e49f. 3 commits
  A+B+C; single bundled push. Phase 4 retrospective inherits this
  shape extended for T4 operational graduation (Commit C carries
  writeup + CLAUDE.md addition).
- **chunk-3 amended brief**: `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-3.md`
  at c76d264. Authoritative for chunk-3 substrate + framings;
  consumed by T3 ADR-0018 amendment for §item 4 v1 contract
  codification.
- **chunk-3 3a commit**: c3782e9. Dispatcher service + dispatcher
  tests + dispatcher-side friction-journal (F-J-1 through F-J-7 +
  F-J-13 + F-J-14 + F-J-15 + β-3-mislabeled).
- **chunk-3 3b commit**: 5d4e954. Cross-phase wirings +
  cross-phase tests + F-J-8/10/11/12 + correction-notes section
  (β-numbering fix + RI-5 N=4 + RI-10 sub-discipline + RI-6 grain
  4 cross-reference + F-J-14 workflow-interaction note).
- **chunk-3 implementation_notes memory file**: at the new
  filename `project_phase_4_chunk_3_implementation_notes.md`
  (renamed at chunk-3 substrate complete during 3b Task 12).
  Carries scope-lock provenance + 3a + 3b implementation findings.

ADR amendment targets:

- **ADR-0018**: `docs/02_architectural_decisions/0018-document-relationship-router.md`
  (verify path at impl). Commit A amends.
- **ADR-0016**: `docs/02_architectural_decisions/0016-…-document-cascade…md`
  (verify exact filename at impl). Commit B amends.

CLAUDE.md addition target:

- **CLAUDE.md**: project-root. Commit C adds T4 section. Insertion
  site decided via verify-at-impl at Commit C drafting per Round 5
  Q3.

Retrospective writeup target:

- **New file**: `docs/07_governance/retrospectives/phase-4-retrospective.md`
  (verify path against existing retrospective convention; Phase 2
  retrospective at 8f6e49f for path reference).

## 4. State report

Branch state at session onset:

- HEAD: 5d4e954 (chunk-3 3b bundled commit)
- Branch: staging; 23 commits ahead of origin/staging post-3b
- MEMORY.md pointer at chunk-3-Phase-4 entry: SHIPPED at 5d4e954
- Working tree clean (3a + 3b shipped; no pending substrate work)

Drafting work to produce 3 new commits:

- Commit A: ADR-0018 amendment (T3) — 4 inventory items + γ'-partial
  + D-partial + D-partial-no-idempotency + RI-9 forward-pointer
- Commit B: ADR-0016 amendment (T3') — 2 inventory items
- Commit C: retrospective writeup + CLAUDE.md addition (T1 + T4)

Expected total drafting volume: ~1300-1800 insertions across
3 commits + 2 new files (retrospective writeup + CLAUDE.md
addition) + 2 modified files (ADR-0018 + ADR-0016) + 1 modified
file (friction-journal for retrospective-process meta-observations
F-J entry).

## 5. Drafting order (A → B → C; sequential with verify-at-impl)

Execute in chronological order:

**a. Commit A drafting — ADR-0018 amendment.**

a.1. **First operation: verify §item 3 substructure against chunk-2-Phase-4
substrate.** Read ADR-0018 §item 3 current wording. Read chunk-2-Phase-4
implementation reality (chunk-2 commits' substrate; chunk-2 retrospective
inventory item 6 — "ADR-0018 §item 3 amendment for branch (b)/(c)
substrate-collapse"). If substantive divergence surfaces between current
§item 3 wording and shipped substrate, Round 4 partial reopen on §item 3
line of four-section mapping. Reopen completes before §item 3 amendment
text drafted. Verify-from-disk-applied-at-drafting-grain is the codify-while-deciding
discipline at the drafting boundary.

a.2. **Four-section amendment drafting per Round 4 lock**:

- **§item 2**: chunk-2-Phase-4 item 1 (8→6 v1-active linked_entity_type
  reconciliation)
- **§item 3**: chunk-2-Phase-4 item 6 (branch (b)/(c) substrate-collapse
  v1-pragmatic interpretation; substructure per a.1 verify outcome)
- **§item 4**: three new bolded-paragraph-lead subsections per Round 4
  Q1 refinement:
  - **v1 dispatcher semantic coverage — γ'-partial.** Per-trigger
    semantic-coverage table (T1/T3/T10-stranded audit-only;
    T5/T8/T10-with-priors re-routing-functional); reasoning trace from
    chunk-3 amendment cycle Pause 3
  - **Decision-outcome discriminator — D-partial 6-rule.** 6-rule
    discriminator table with β-6 ratification on rule 5 → no_change
    (operationally reachable via T5→T1 sequence under
    no-supersedes-on-empty-rerun)
  - **Idempotency contract — D-partial-no-idempotency at v1.** Explicit
    non-implementation of ADR-0018:792-805 idempotency contract at
    chunk-3 ship; RI-9 named-future-activation forward-pointer
- **§Schema-deltas**: RI-2 dispatch_failed 5th decision_outcome value
  formalization

a.3. **Commit A message structure**:

- Scope line: "docs(adr): Phase 4 retrospective amends ADR-0018 with
  v1 Subsystem 3 contract refinements + Phase 4 chunks 1-2 amendment
  carry-forwards"
- Per-§-item amendment summary (4 sections)
- Cross-references: chunk-3 amended brief c76d264 + 3a c3782e9 + 3b
  5d4e954
- Ratification note: amendments ratified per Phase 4 retrospective
  scope-lock Rounds 1-7
- **Paradigm-shift callout** (Round 4 lock; sharpened per Round 5
  prefatory reaction): "§item 4 amendment is substantive v1 contract
  refinement, not clarification — codifies v1 implementation reality
  at the ADR level, replacing the pre-implementation 're-run Subsystem
  1' framing with γ'-partial per-trigger coverage + D-partial 6-rule
  discriminator + D-partial-no-idempotency contract as canonical v1
  Subsystem 3 contract; future Phase 7 + Phase 5.1 work consuming
  Subsystem 3 reads these refinements at the ADR."

a.4. **Per-commit validation**: `pnpm typecheck` → green;
`pnpm agent:validate` → 26/26. Documentation-only commit; test surface
unaffected (end-of-batch verification only).

a.5. **Commit A lands locally on staging.**

**b. Commit B drafting — ADR-0016 amendment.**

b.1. No verify-at-impl items at Commit B drafting onset.

b.2. **Two-section amendment drafting per Round 4 lock**:

- **§Reserved-enums-and-audit-events table**: chunk-2-Phase-4 item 2
  (table reconciliation per chunks-1-6 + Phase 4 chunks 1-2 shipped
  reality)
- **§6 (cascade-payload audit events)**: RI-4 pre_commit_link_rerouted
  substrate forward-pointer (named substrate slot + deferral rationale
  + future-chunk activation trigger)

b.3. **Commit B message structure** (parallel to Commit A; lighter
content):

- Scope line: "docs(adr): Phase 4 retrospective amends ADR-0016 with
  Reserved-enums table reconciliation + pre_commit_link_rerouted
  substrate forward-pointer"
- Per-§-item amendment summary (2 sections)
- Cross-references: same as Commit A
- Ratification note: same shape as Commit A
- No paradigm-shift callout (both amendments are clarification-grade)

b.4. **Per-commit validation**: same as Commit A.

b.5. **Commit B lands locally on staging.**

**c. Commit C drafting — retrospective writeup + CLAUDE.md addition + F-J entry.**

c.1. **First operation: verify CLAUDE.md insertion site against current
CLAUDE.md structure.** Read CLAUDE.md sections. Decide T4 placement: within
"Session execution conventions" (fits with existing convention-grain
entries) OR as new top-level section (warranted if T4 weight ~200-300
lines exceeds typical entries). Verify-from-disk at drafting boundary.

c.2. **Retrospective writeup (T1) drafting per Round 5 lock — 7
sections in order**:

1. **Arc summary**: Phase 4 closes at chunk-3 substrate complete;
   three subsystems shipped per ADR-0018 §item 1; Subsystem 1 (chunk
   1, 6f3c2ad) + Subsystem 2 (chunk 2, 8c036be) + Subsystem 3 (chunk
   3, 3a c3782e9 + 3b 5d4e954); brief outline of chunk substrate
   progression
2. **Per-chunk learnings (chunks 1-3)**: Per-chunk substantive findings
   + chunk-2-Phase-4 carry-forward closures + chunk-3 codification trail
3. **Framing-discovery arc (centerpiece)**: Five-pause sequence (γ' /
   γ'-partial / D-partial / D-partial-no-idempotency / Path C-dispatcher-
   isolated) + brief amendment cycle (c76d264) + RI-10 sub-discipline
   emergence + meta-observation (7-round scope-lock missed
   computational-shape under-specification systematically) + RI-6
   four-grain as codification synthesis. Substantive narrative section.
4. **Codified patterns** — grouped by graduation surface per Round 5
   Q1 refinement (Round 3 inventory distribution):
   - T3 cluster: RI-2 + RI-9 + chunk-2 items 1+6 + arc-derived content
   - T3' cluster: chunk-2 item 2 + RI-4
   - T4 cluster: RI-1 + RI-6 four-grain + RI-7 + RI-10 + memory-only (iii)
   - Memory-only-stays cluster: candidates (i)+(ii) at N=1
   - Carry-forward cluster: RI-3 + chunk-2 items 3+5+8 reframed
   Per-entry shape: codification statement + evidence basis +
   graduation surface + cross-reference
5. **Inventory documentation**: services/evidence/ empty-with-.gitkeep
   status; created_by permissiveness pattern (6 files at chunk-3 close);
   brief notes on memory-only candidates (i)+(ii); RI-5 N=4 trail mention
6. **Carry-forwards to future retrospectives** (Round 7 extension to
   three subsections):
   - 6.a Carry-forward inventory items (RI-3 + chunk-2 items 3+5+8
     reframed; per-item: codification statement + named-future-trigger)
   - 6.b Cross-phase consumer inventory (Phase 5.1 + Phase 7
     per-consumer two-inventory shape per Round 7 Q3 refinement:
     activation-trigger inventory + discipline-reference application;
     both inventories may be non-empty)
   - 6.c Named-future-feedback-loops (Phase 5.1 + Phase 7 scope-locks
     produce evidence about Phase 4 codifications operating as designed
     at consumer-application time)
7. **Surface-precedence note**: T3 > T4 > T1 per CLAUDE.md "When in
   doubt" leaf-discipline; future readers see precedence ordering
   legibly. End-of-writeup positioning.

c.3. **CLAUDE.md addition (T4) drafting per Round 5 lock — section
header + context + 5 content sub-sections + cross-references**:

- **Section header**: "Verify-forward-at-scope-lock for
  computational-shape chunks" (descriptive primary per Round 5 Q4)
- **Context paragraph**: discipline scope (computational-shape chunks:
  dispatcher-style, re-evaluator-style, substantively-novel-logic) +
  evidence basis (chunk-3 framing-discovery arc; reference to Phase 4
  retrospective writeup centerpiece)
- **Sub-section 1**: "Consumer-presence verification for substrate
  additions" (RI-1 parenthetical body cross-reference; four-instance
  precedent codified)
- **Sub-section 2**: "Read-substrate verification at scope-lock (four
  grains)" (RI-6 four-grain detail with chunk-3 evidence per-grain)
- **Sub-section 3**: "Session-budget-feasibility verification" (RI-7
  with Path C invocation conditions; chunk-3 upper-bound calibration
  anchor)
- **Sub-section 4**: "Brief amendment cycle threshold" (RI-10 with
  framing-interaction-tracing sub-discipline at N≥3; chunk-3 as first
  instance; empirical bound)
- **Sub-section 5**: "Codification convention: observation-grain vs
  application-grain N count" (memory-only candidate (iii) graduation;
  applies retroactively to F-J-11 + future ambiguous-N codifications)
- **Cross-references**: Phase 4 retrospective writeup centerpiece +
  ADR-0018 §item 4 amendment + ADR-0016 §6 amendment

c.4. **Friction-journal entry drafting — single entry per Round 6
lock with (4) leading per Round 7 prefatory reframing**:

- F-J header timestamp: 2026-05-14 (matches chunk-3 friction-journal
  entries' date precedent)
- Opening: "Phase 4 retrospective scope-lock surfaced an organizing
  meta-discipline (codify-while-deciding-not-while-implementing) with
  three applied-discipline instances observable across rounds 3-6."
- Primary treatment: (4) codify-while-deciding-not-while-implementing
  with discipline statement + Rounds 4-6 cross-round emergence as
  evidence + Round 3 verify-from-disk-applied-at-retrospective-grain
  as Round 3 instance
- Named-instance subsections (under primary):
  - (1) Descriptive-primary-with-RI-parenthetical naming convention
    (Round 5 drafting time codification)
  - (2) Scope-lock-rounds-carry-verify-at-impl-forward pattern
    (Rounds 4-5-6 cross-round emergence)
  - (3) Verify-from-disk applied at retrospective-scoping-grain
    (Round 3 emergence; folded into (4)'s evidence)
- **Instance enumeration stays open through drafting per Round 6
  Q4 lock**: if drafting surfaces a fifth retrospective-process
  meta-observation (e.g., a drafting-stage applied-discipline
  instance distinct from the four), the entry expands at drafting
  close. Current four are the floor, not the ceiling.

c.5. **Commit C message structure** (inherits A/B parallel shape per
Round 6 Q3 lock):

- Scope line: "docs(governance): Phase 4 retrospective writeup +
  CLAUDE.md verify-forward-at-scope-lock addition + retrospective-
  process meta-observations F-J entry"
- Per-section summary: writeup 7-section overview + CLAUDE.md
  addition structure + F-J entry shape
- Cross-references: same as A/B + Phase 2 retrospective shape
  precedent (8f6e49f)
- Ratification note: Phase 4 retrospective scope-lock complete; this
  commit closes the retrospective work

c.6. **Per-commit validation**: same as Commit A and B.

c.7. **Commit C lands locally on staging.**

**d. End-of-batch validation + bundled push.**

d.1. `pnpm test` — target 1050/1050 (unchanged from 3b close at
5d4e954; documentation-only commits don't affect test surface).

d.2. **Ship-readiness three-condition gate per CLAUDE.md** (Round 6
Q4 lock):

- Condition 1: validation gate green at end-of-batch ✓
- Condition 2: doc-sync reconciled — retrospective IS the doc-sync
  artifact ✓
- Condition 3: governance closeout — retrospective written (T1) +
  friction-journal updated (retrospective-process meta-observations
  entry) + CLAUDE.md addition shipped (T4) + ADR amendments shipped
  (T3 + T3') ✓

d.3. **Bundled push to origin staging**. Three commits land at
origin in one push event.

## 6. Verify-at-impl ledger (drafting session)

| Item | Status | Where it resolves |
|---|---|---|
| §item 3 substructure vs chunk-2 substrate | PENDING | Commit A drafting first operation (a.1) |
| CLAUDE.md insertion site | PENDING | Commit C drafting first operation (c.1) |
| Validation gate green per commit | PENDING | Per-commit (a.4, b.4, c.6) |
| Test verification at end-of-batch | PENDING | d.1 |

If §item 3 verify surfaces substantive divergence: Round 4 partial
reopen; bounded to §item 3 line of four-section mapping; reopen
completes before §item 3 amendment text drafted.

If CLAUDE.md insertion site verify surfaces neither candidate
placement is appropriate (rare): adjudicate brainstorming-side.

If validation gate fails at any commit: stop, report failure mode,
wait for adjudication. Do NOT ship partial commit.

## 7. Pre-flights (load-bearing decisions from scope-lock)

### 7a. Commit A paradigm-shift callout (locked at Round 4 + sharpened at Round 5 prefatory reaction)

Explicit callout text: "§item 4 amendment is substantive v1 contract
refinement, not clarification — codifies v1 implementation reality at
the ADR level, replacing the pre-implementation 're-run Subsystem 1'
framing with γ'-partial per-trigger coverage + D-partial 6-rule
discriminator + D-partial-no-idempotency contract as canonical v1
Subsystem 3 contract; future Phase 7 + Phase 5.1 work consuming
Subsystem 3 reads these refinements at the ADR."

Carries metadata-in-commit-message value (git log --grep + amendment-
history scanning).

### 7b. Cross-phase consumer documentation per-consumer two-inventory shape (locked at Round 7 Q3 refined)

T1 section 6.b per-consumer:

- **Phase 5.1 inheritance**:
  - Activation-trigger: chunk-3 reserved T2/T4/T6 dispatcher slots
    (DispatchTriggerInputSchema branches + dispatchTrigger switch
    handlers + fan-out helpers)
  - Discipline-reference: RI-1 (forward-application on Phase 5.1's
    own substrate) + RI-6 four-grain + RI-7 + RI-10
- **Phase 7 inheritance**:
  - Activation-trigger: γ'-partial coverage gap (T1/T3/T10-stranded
    re-routing-functional via pipeline substrate) + RI-9 (fingerprint-
    based dedup activates ADR-0018 idempotency contract)
  - Discipline-reference: RI-1 + RI-6 four-grain + RI-7 + RI-10

Both consumers are both-shapes (per Round 7 Q3 refinement). Binary
classification collapses; per-consumer two-inventory documentation
is the right grain.

### 7c. F-J entry instance enumeration stays open (locked at Round 6 + reinforced at fresh-conversation transition)

Current four meta-observations are the floor. If drafting surfaces a
fifth retrospective-process meta-observation (e.g., RI-7 reflexive
application at transition-boundaries observable across scope-lock →
drafting transition), the F-J entry expands at drafting close.
Codify-while-deciding applies reflexively to the F-J entry itself.

## 8. Drafting-close reporting contract

When drafting completes (Commit C landed + d.1 test verification
green + d.3 push to origin), report back with:

- Three commit hashes (Commit A + Commit B + Commit C)
- Push event hash (or origin/staging HEAD post-push)
- `pnpm test` final count at end-of-batch (target 1050/1050)
- Verify-at-impl resolutions:
  - §item 3 substructure (Round 4 partial reopen fired or not; if
    fired, brief description of the divergence and §item 3 amendment
    scope)
  - CLAUDE.md insertion site (within "Session execution conventions"
    or as new top-level section)
- F-J entry final instance count (4 floor; 5+ if drafting surfaced
  additional retrospective-process meta-observation)
- Phase 4 retrospective shipping confirmation (3 commits land per
  Option B sequencing; bundled push completes)
- Phase 4 closure confirmation (retrospective is the closure artifact;
  multi-feature scoring + Phase 5.1 + Phase 7 sit downstream per
  Round 1 1.a lock)

If drafting surfaces a scope-lock-touching question (Round reopen
needed): stop, report, brainstorming-side adjudicates. Do NOT auto-
resolve.

## 9. Honest scope acknowledgment

Drafting volume estimated ~1300-1800 insertions across 3 commits +
2 files. At-or-near chunk-3 substrate volume. Fresh conversation
reduces context-overhead-risk but adds setup cost.

If context pressure forces a pause mid-drafting: natural fault line
is at commit boundary (Commit A done → pause → fresh for B+C; OR
Commit A+B done → pause → fresh for C). Do NOT pause within-commit
unless validation gate fails. Path-C-equivalent at drafting stays
evidence-forced; commit-boundary fault line preferred over
within-commit per chunk-3 Path C precedent.

If pause fires:

- Drafting session reports state per element 8 (which commits landed;
  which verify-at-impl items resolved; what's pending)
- Resume prompt for next-session drafting inherits this prompt's
  structure with state-report adapted to landed commits

Do NOT proactively invoke commit-boundary pause. Only fall back if
evidence forces it.

## 10. Codify-while-deciding meta-discipline as drafting's operational principle

The codify-while-deciding-not-while-implementing meta-discipline
that emerged across scope-lock Rounds 3-6 applies reflexively to
drafting itself. Decisions surfaced during drafting (substructure
expansion at §item 3 verify; insertion site at CLAUDE.md verify;
naming refinement; F-J entry restructure if fifth meta-observation
surfaces; commit-boundary pause if evidence forces it) get codified
at decision time within the drafting session — same pattern that
operated across the 7 rounds.

This is the operational reflexive principle for drafting. If
drafting surfaces a *new* meta-observation about retrospective
drafting itself (e.g., "drafting-stage verify-at-impl resolves
differently than scope-lock-stage verify-at-impl"), that's evidence
accumulation for the F-J entry's meta-discipline framing. Track
during drafting; expand F-J entry at drafting close if substantive.

---

7-round scope-lock locked all content + structural-shape decisions.
Drafting transforms them into 3 commits + 2 new files. Resume from
Commit A drafting onset (§item 3 verify-from-disk first operation).
Standing by to begin.
