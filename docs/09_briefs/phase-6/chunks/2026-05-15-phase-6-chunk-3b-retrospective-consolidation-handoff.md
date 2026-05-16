# Phase 6 chunk 6.3b — WSL-side session-onset prompt (retrospective consolidation + merge-to-main per Path C lock)

## §1 — Chunk frame

You are WSL-side execution Claude for Phase 6 chunk 6.3b: Phase 6 retrospective consolidation + merge-to-main, per the Path C lock at chunk-6.3a brief Sub-Q1. This is the canonical phase-close ceremony for Phase 6.

Two substantive operations sequence within chunk 6.3b:

1. **Phase 6 retrospective consolidation** — writeup + ADR amendments (if any) + CLAUDE.md additions (if any) + friction-journal consolidation entries + Phase 6 retrospective close memory file. Inherits Phase 4 retrospective shape precedent (7 rounds; Commits A/B/C structure; descriptive-primary-with-RI-parenthetical naming).
2. **Merge-to-main** — staging → main; origin/main is substantively behind (verify below).

Sequencing within chunk: (α) retrospective consolidation → merge-to-main (brainstorming-side lean ratified; rationale in §5). Merge-to-main is the closing ceremony after governance artifacts intact.

**Path C lock authority**: chunk-6.3a brief Sub-Q1 scoped 6.3a (substantive implementation) + 6.3b (consolidation + merge) as distinct chunks. This is Path C at a novel grain — Phase 4 chunk 3 Path C was within-implementation split (3a dispatcher + 3b cross-phase wirings); Phase 6 chunk 6.3 Path C is implementation-vs-retrospective split. Worth tracking at Round 1 closure framing as candidate centerpiece observation (N=2 with novel grain at instance #2).

**Brainstorming partner** (the user's prior Claude conversation): brainstorming-side. WSL-side execution Claude (you): drives implementation work + drafting + commits + merge ceremony. Standard split: brainstorming-side adjudicates findings; WSL-side ships substrate.

## §2 — State verification (Round 0 from brainstorming-side; ratify at session onset)

Brainstorming-side ran state-verify against disk at session onset. Ratify before substantive work.

**Verified at HEAD**:

- HEAD = `a9f10714e2011f6ef9c39a626055962e380e1d83` on staging
- origin/staging = HEAD (0 commits ahead)
- origin/main = `cfcf2e79b9ccab754e59a1bc51f5ce6a164f4945` (substantively behind; merge-to-main is forward-merge not no-op)

**Verified governance trail back-traced**:

- `a9f1071` — drag-drop scope-input artifact (post-Phase-6-close; reference-only at chunk 6.3b)
- `c612720` — chunk-6.3a chunk-close
- `9fc831a` — chunk-6.3a brief
- `5eb1fc5` / `a86731e` — chunk-6.2b feat / brief
- `c6a7159` / `010b5e6` — chunk-6.2a feat / brief
- `2c85ee6` — chunk-6.1 feat (commit message confirms chunk 6.1)
- `e16eb8c` / `2d6d0ca` — chunk-6.1 brief + amendment cycle
- `8eee953` — Phase 6 execution plan + folder bootstrap
- `18dd608` — Phase 4 retrospective post-close drift-fix
- `294f9e7` — Phase 4 retrospective writeup + CLAUDE.md addition + F-J entry
- `fc36c6e` — Phase 4 retrospective ADR-0016 amendment
- `e9a3cd5` — Phase 4 retrospective earlier commit
- `f74ed6a` — Phase 3 closeout-verify

**Validation state** inherited from chunk-6.3a close: `pnpm test` 1114/1114 / 194 files; `pnpm agent:validate` 26/26; `pnpm typecheck` green. Re-run at chunk 6.3b session onset to confirm baseline.

**Round 0 drift catches** from state-verify (surface to user at Round 1 if not already adjudicated):

1. **Filename convention divergence.** Existing chunk briefs in `docs/09_briefs/phase-6/chunks/` use `chunk-1.md`, `chunk-2a.md`, `chunk-2b.md`, `chunk-3a.md` — NO `phase-6-` prefix in the chunk-N part. The brainstorming-side handoff suggested `chunk-6-3b.md`. Round 1 adjudicates: inherit existing (`chunk-3b.md`) is the default unless explicit codification fires. Lean: inherit existing.
2. **Phase 2.5 retrospective inheritance reference.** Brainstorming-side handoff §4.1(c) names "Phase 2.5 retrospective" as shape inheritance. On disk: `docs/07_governance/retrospectives/` contains phase-1.1 / phase-1.2 / phase-2 / phase-4 / phase-5 / arc-A. No phase-2.5. Either the reference is implicit-shorthand for arc-A, or there's a naming inconsistency. Verify at Round 1.
3. **Friction-journal location decision pending.** chunk-6.3a's +506 lines landed in the monolithic `docs/07_governance/friction-journal.md` (841KB; chunk-6.3a's addition is at the bottom of the file). The directory `docs/07_governance/friction-journal/` exists with per-phase files for phase-1.1 / phase-1.2 / phase-1.5 / arc-A, but Phase 2-6 content all lives in the monolith. Phase 6 retrospective writeup at chunk 6.3b should adjudicate: (a) continue monolithic append, (b) start `friction-journal/phase-6.md` per the subdirectory pattern, (c) historical split. Tier-2 or tier-3 governance-shape decision; Round 5 territory (writeup structure + commit sequencing).

## §3 — Canonical sources inventory

Brainstorming-side completed §3.1 read (chunk-6.3a's full 22-entry F-J addition). The following remain unread; load on-demand as Round 1 framing surfaces specific needs (codify-while-deciding-at-decision-time discipline: don't pre-burn budget on substrate not yet load-bearing).

**Read on-demand at scope-lock**:

- `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3a.md` — chunk-6.3a brief at `9fc831a`. Path C Sub-Q1 lock framing source.
- `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-1.md` — chunk-6.1 brief + Amendment §4 (RI-6 fifth-grain codification origin).
- `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-2a.md` — chunk-6.2a brief; "Path C invocation callout" prospective application precedent.
- `docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-2b.md` — chunk-6.2b brief; Flag 13 brainstorming-round-vocabulary codification origin.
- `docs/07_governance/retrospectives/phase-4-retrospective.md` — Phase 4 retrospective writeup (7-section structure; T3/T3'/T4 cluster shape; Round 7 cross-phase consumer inventory). `18dd608` correction visible at end.
- `CLAUDE.md` Verify-forward-at-scope-lock for computational-shape chunks section — T4 codification cluster with 5 sub-sections (RI-1 / RI-6 four-grain / RI-7 / RI-10 + codification convention).
- `docs/07_governance/retrospectives/phase-5-retrospective.md` §6 — canonical sequencing (Phase 5 → 2 → 3 → 4 → 6 → 7 → 8).
- `docs/07_governance/retrospectives/phase-2-retrospective.md` §6 line 588 — Phase 5.1 amendments parallel-candidate framing.

**Reference-only (NOT consumed at chunk 6.3b)**:

- `docs/09_briefs/phase-6/2026-05-15-agent-conversation-document-drop-scope-input.md` (`a9f1071`) — drag-drop feature scope-input. Reads at SUBSEQUENT post-Phase-6-close session, not at chunk 6.3b.

**Inherited from brainstorming-side context (already-read substrate; do not re-read)**:

- chunk-6.3a friction-journal addition full 22 entries / 6 H2 sections (first-instance precedents 5 / flag codifications 5 / β reconciliations 4 / tier-2 retro carry-forwards 6 / tier-3 retro carry-forwards 4 / volume + test-count anchors 2).
- 2026-05-14 codify-while-deciding meta-discipline F-J entry + 3 applied-discipline instances.
- 2026-05-15 Phase 4 retro post-close drift-fix entry (Phase 5.1 reviewer naming drift + Phase 6 sequencing omission).
- 2026-05-15 Phase 3 closeout-verify entry (phase-scope-absorbed-by-preceding-phase-chunks pattern N=1).
- 2026-05-15 stratified continuity-of-business F-J entry (SharePoint N=1).
- 2026-05-15 RI-6 fifth grain F-J entry (chunk 6.1 codification origin).
- 2026-05-15 Path C N=2 prospective discipline F-J entry (chunk 6.2a graduation).
- 2026-05-15 Sub-Q4 split-across-chunks shape F-J entry.
- 2026-05-15 `_for_test` suffix convention F-J entry (chunk 6.2a first-instance precedent).
- 2026-05-15 Grain-5-test-floor enumeration F-J entry (chunk 6.2a two-phase application + 3 sub-instance refinements).
- 2026-05-15 Flag 13 brainstorming-round-vocabulary F-J entry (chunk 6.2b tier-1).
- 2026-05-15 Next.js native multipart + drag-drop UI F-J entry (chunk 6.2b dual first-instance precedent).
- 2026-05-15 chunk 6.2b volume-forecast drift entry (Flag 16 origin).
- 2026-05-15 chunk 6.2b impl-time discoveries entry (5 sub-findings).
- 2026-05-15 Flag 3 + Flag 6 resolution entries.

## §4 — Sub-Q8 walk inputs (load-bearing substrate)

Round 2 substantive work = Sub-Q8 walk against 22 chunk-6.3a codification candidates + 5 cross-session consolidation candidates. Brainstorming-side pre-classified the cross-session candidates against the read F-J substrate:

**(a) β-4 N=3 broadening-event-test-staleness — graduation-ready.** chunk-2-Phase-4 β-2 + chunk-6-Phase-2 β-2c + chunk 6.3a β-4 explicitly enumerated at β-4 entry. Convention candidate named in the entry: "substrate-mod-event test-staleness review." Tier-1 graduation eligibility at retrospective.

**(b) Compound cluster: Flag 20 + β-2 + β-3 + Sub-Q10 Grain 5 — consolidation substrate present.** Flag 20 entry explicitly cites β-3/MF-2 as "second brainstorming-side verify-from-disk miss"; β-3 entry independently echoes the link. Sub-Q10 firing strengthens the same root pattern (brief-scope-lock-without-substrate-verify-from-disk). Consolidate 4 entries → 1 codification at Sub-Q8 per RI-10 framing-interaction-tracing sub-discipline.

**(c) Partial-information-recommendation-drift N=3 — needs verification at Round 1/2.** Brainstorming-side handoff names three instances: (i) Phase 5.1 "reviewer chunk" naming drift (corrected at `18dd608`); (ii) Reading A vs B scope-lock adjudication; (iii) scope-observation framing on Postmark webhook scope vs Reading B lock. Only instance (i) is confirmed against disk (`18dd608` drift-fix entry codifies it). Instances (ii) and (iii) are brainstorming-session-internal; verify they're documented somewhere readable OR codify as conversation-grain observation at chunk 6.3b retrospective writeup.

**(d) RI-6 four-grain → five-grain — N=1 or N=2 ambiguity.** Brainstorming-side handoff frames Grain 5 firing at chunk-6.3a Sub-Q10 as N=1. Closer read: chunk 6.1 RI-6 fifth-grain F-J entry codified Grain 5 originally at the cross-phase-test-failure surface (substrate-shape grain); chunk 6.3a Sub-Q10 refines Grain 5 to include UI-consumer-contract verification (NEW sub-grain). Arguable that this is N=2 of Grain 5 family but N=1 of the specific UI-consumer sub-grain. Adjudicate at Round 2: is graduation tied to Grain 5 broad family or to specific sub-grain instance count? Codification convention says observation-grain N=3; this may not graduate at chunk 6.3b unless retrospective consolidation grain accepts N=2 with novel-sub-grain at instance #2.

**(e) Brainstorming-side / execution-side split scale-invariance — N=1 at phase-arc grain.** β-2 + β-3 + Sub-Q10 + scope-input artifact adjudications all operated via brainstorming-side / execution-side split during chunk-6.3a originating conversation. Track at retrospective for codification; below threshold at chunk-6.3b grain.

**Cross-cutting Sub-Q8 walk against 22 chunk-6.3a entries** — adjudicate each:

- H2-1 first-instance precedents (5): tier-1 load-bearing; ratify each as graduation candidate or hold at N=1.
- H2-2 flag codifications (5): Flags 18 + 20 + Sub-Q10 explicitly tier-1; Flag 19 + Sub-Q1 refinement tier-2/3.
- H2-3 β reconciliations (4): β-2 + β-3 tier-1 brainstorming-adjudicated; β-1 tier-3; β-4 N=3 graduation candidate (see (a) above).
- H2-4 tier-2 retro carry-forwards (6): each evaluated against graduation criteria.
- H2-5 tier-3 retro carry-forwards (4): lighter-touch evaluation.
- H2-6 volume + test-count anchors (2): Flag 16 N=1 validation + test-count methodology refinement.

## §5 — Scope-lock cycle expectations + RI inheritance

Brainstorming-side projects 5-7 rounds (vs Phase 4 retrospective's 7 rounds), since chunk-6.3a substrate is well-prepared per within-session-codification-preserves-cross-session-consolidation-enablement observation.

**Round shape (illustrative; scope-lock determines actual)**:

- **Round 1** — closure framing. Phase 6 closes at chunk 6.3b substrate complete. Centerpiece selection from candidates: (i) β-2 + β-3 brainstorming-side adjudication arc; (ii) compound cluster consolidation; (iii) Path C application at retrospective-grain novelty; (iv) scale-invariant split discipline; (v) cross-phase consumer-application of Phase 4 codifications. RI-7 evidence-forced reasoning at scope-lock onset (chunk 6.3b drafting volume estimation).
- **Round 2** — Sub-Q8 walk. 22 chunk-6.3a entries + 5 cross-session candidates evaluated against graduation criteria. T3/T3'/T4 cluster surface assignment fires here or Round 4.
- **Round 3** — cross-session consolidation candidates. Adjudicate (a)–(e) above explicitly.
- **Round 4** — graduation surface assignment. T3/T3' (ADR amendment) + T4 (CLAUDE.md addition) + T1 (retrospective writeup centerpiece) clusters formed.
- **Round 5** — writeup structure + commit sequencing. Phase 6 retrospective 7-section structure + CLAUDE.md addition structure + F-J entry shape + commit sequencing. Friction-journal location decision adjudicates here (per §2 drift catch #3).
- **Round 6** — validation gate + ship contract + merge-to-main sequencing. Per-commit validation; end-of-batch test verification; retrospective commits; merge-to-main ceremony shape.
- **Round 7** — carry-forwards. Phase 7 inventory; Phase 5.1 amendments; drag-drop scope-lock cycle pointer.

**RI inheritance** applies reflexively:

- **RI-1** consumer-presence verification on every new substrate addition (Phase 7 + Phase 5.1 + drag-drop are named-future-consumers).
- **RI-6** read-substrate verification four grains (five if Grain 5 graduates at Round 2/3). Apply to chunk 6.3b's own substrate additions.
- **RI-7** session-budget-feasibility verification at each round transition. Phase 4 retrospective drafting was ~1300-1800 insertions / 3 commits / 2 files; Phase 6 retrospective expected larger (richer chunk-6.3a substrate; 22 codifications + cross-session candidates).
- **RI-10** brief amendment cycle threshold + framing-interaction-tracing sub-discipline. Compound cluster consolidation (β candidate (b)) IS a framing-interaction-tracing instance.

**Codify-while-deciding meta-discipline** applies reflexively at decision-time within scope-lock rounds; not deferred to drafting or merge. Decisions surfaced at Round N are codified at Round N artifact-grain, not deferred.

**Sequencing within chunk 6.3b** — lean (α) retrospective-first → merge-to-main, ratified. Two reinforcements from disk verification beyond the handoff's framing:

1. origin/main lags origin/staging by ~20+ commits; merge-to-main is substantively forward, not no-op. Retrospective-first means main sees the codified governance trail in one atomic forward-merge.
2. chunk-6.1 RI-6 fifth-grain F-J entry explicitly forward-points: "Phase 6 retrospective at chunk 6.3 close consolidates the four findings into RI-6 amendment + CLAUDE.md update." Merging before retrospective orphans that pointer at main grain.

## §6 — First operation

When this session fires:

1. **Ratify Round 0 state catches (§2)** before substantive work. If user surfaces the three drift catches (filename convention; phase-2.5 reference; F-J location decision pending), acknowledge each and proceed; if user pre-empts or deprioritizes, hold them at Round 1.
2. **Re-run validation gates at session onset.** `pnpm test` + `pnpm agent:validate` + `pnpm typecheck` to confirm 1114/1114 + 26/26 + green baseline inherited from chunk-6.3a close. Any drift fires Round 0 codification before Round 1.
3. **Stand by for Round 1 closure framing fire from user.** Engage as scope-lock execution partner; verify-from-disk against canonical sources at §3 on-demand as Round 1 framing surfaces specific needs.
4. **Apply codify-while-deciding-at-decision-time meta-discipline reflexively across rounds.** Apply RI-1/6/7/10 at each round per §5.

After all 7 rounds (or however many surface), proceed to drafting per the round-locked commit sequencing. After retrospective ships to origin/staging, fire merge-to-main ceremony per Round 6 lock.

**Post-chunk-6.3b operational sequencing** (carry-forward documentation at Round 7):

- Phase 6 closes structurally at retrospective + merge-to-main complete.
- Drag-drop scope-lock cycle fires next (fresh conversation; reads `a9f1071` scope-input artifact).
- Phase 7 (Tier 2 pipeline) substantive scope-lock fires as canonical-next-phase per Phase 5 retrospective §6.
- Phase 5.1 amendments interleave per Phase 2 retrospective §6:588 parallel-candidate framing.

Standing by for Round 1 closure framing. Engage as scope-lock execution partner with push-back authority + verify-from-disk discipline + codification observation responsibility.
