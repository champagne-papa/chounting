# Session 5B: Layer 1 + Layer 2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-2 Session 5B — migrate 9 Phase-2-pattern feature specs from `docs/09_briefs/phase-2/` to `docs/01_prd/` (Layer 1) and 13 Phase-0 governance files to `docs/09_briefs/phase-0/` (Layer 2). Convention expansion: new `phase-0/ratification-packages/` sub-bucket. Three READMEs touched (briefs convention README sub-bucket count; ADR README new paragraph; phase-0/README instance update). 01_prd/README.md touch-up (3 structurally-invalid claims fixed; full rewrite deferred to Session 6). Friction-journal path-note blockquote extended for the docs/superpowers/-style annotation pattern applied to the new 13-file phase-0 migration.

**Architecture:** 5 commits substrate-then-moves applied at session level. C1 self-contained Layer 1 bundle (9 moves + phase-2/README acknowledgment + 01_prd/README touch-up). C2 Layer 2 substrate (convention expansion + 3 README updates + new sub-bucket directory). C3 Layer 2 2026-05-03 group (5 moves + ref-update sweep). C4 Layer 2 2026-05-04 group (8 moves + ref-update sweep). C5 closeout friction-journal entry. Total: 5 commits matching the count-level commit pattern from fix-arc and 5A (N=3 instances; pattern at codification candidacy).

**Tech Stack:** git mv, mkdir, Edit/Write tools, bash for verification.

**Acceptance criteria:**

- (a) 9 feature specs at `docs/01_prd/` (flat, no sub-folder); phase-2/ retains 8 files with explicit forward-pointers (2 architectural briefs to Session 6, 1 scope-decision + 5 specialized to Session 7 or post-round-2).
- (b) 13 phase-0 files migrated to `docs/09_briefs/phase-0/` in proper sub-buckets per Decision 5: phase-0-governance-plan → plans/; D1-D6 ratification packages → ratification-packages/; bank-detail amendment + evidence-link + closure-verification + 3 session prompts/closeout → chunks/.
- (c) New `phase-0/ratification-packages/` sub-bucket created and populated with 6 D1-D6 packages.
- (d) Three READMEs updated: `docs/09_briefs/README.md` (sub-bucket count 3→4, with explicit framing per the convention's "added as consumers emerge" rule); `docs/07_governance/adr/README.md` (separate paragraph for ratification packages, distinguishing pre-ratification specs/ + plans/ from ratification-time ratification-packages/); `docs/09_briefs/phase-0/README.md` (instance update reflecting 4 sub-buckets + closeout-artifact references at new chunks/ location).
- (e) `docs/09_briefs/phase-2/README.md` acknowledges 9-file Layer 1 migration + 13-file Layer 2 migration + 8-file deferral, with disposition explicit per forward-pointer discipline.
- (f) `docs/01_prd/README.md` touched-up — 3 structurally-invalid claims removed/replaced per Decision 3's locked text. Full rewrite deferred to Session 6 as 5th outside the locked four.
- (g) Friction-journal file-top path-note blockquote extends or sibling-adds for the 13-file phase-0 migration (matching 5A's docs/superpowers/ path-note pattern).
- (h) `pnpm typecheck` clean before each commit.
- (i) `pnpm adr:lint` clean throughout (ADR README touched in C2 — pre-commit hook will fire).
- (j) `pnpm adr:index --check` clean throughout (no INDEX drift).
- (k) Push-readiness gate: floor-only carve-out (formal criteria met).
- (l) All 5 commits independently revertable; commit boundaries align with Decision 4's substrate-then-moves seams.

---

## Push-readiness gate (floor-only carve-out, third invocation)

The floor-only carve-out's formal criteria, established at the halftime plans push (commit `ea22b76`):

> Floor-only is mechanically defensible for diffs containing zero migrations / zero services / zero integration tests / zero source files / zero test files.

5B's diff against these criteria:

| Criterion | 5B status |
|---|---|
| Zero DB migrations | ✓ no `apps/web/sql/` changes |
| Zero services | ✓ no `apps/web/src/services/` changes |
| Zero integration tests | ✓ no `apps/web/tests/integration/` changes |
| Zero source files | ✓ no `.ts`/`.tsx` changes |
| Zero test files | ✓ no `.test.ts` changes |

All five criteria met. 5B's diff is mechanically docs-only; floor-only gate applies.

**Brainstorm-time-instinct correction (preserved as evidence trail).** During Decision 6 deliberation, the operator's initial instinct flagged 5B as full-suite-appropriate via "structural changes via new sub-bucket directory" framing. Closer examination revealed this conflated substrate-change-affecting-downstream-consumers with test-regression-risk — different concerns with different gates. Full-suite gate's mechanical purpose is catching test regressions caused by code changes; substrate-correctness has its own audit-shaped gate via review process (typecheck, adr:lint, adr:index, README cross-references, friction-journal entries). Floor-only stays mechanically defined per its formal criteria; substrate-correctness gets its own audit-shaped gate. The instinct was wrong; the wrongness is informative; preserve as evidence trail to prevent future similar cases from treating the instinct as precedent.

**N=3 invocation context.** This dispatch's plans-landing commit-batch push will be the third floor-only invocation (after halftime plans push and 5B brainstorm closeout push). N=3 with natural-outcome evidence at three independent consumers strengthens codification candidacy beyond N=2 LIVE status. Codification candidate remains LIVE for Session 7's brief template substrate work; the additional evidence is qualitative strengthening, not status change.

**Verification protocol per the floor-only carve-out:**
- `pnpm db:reset:clean` (clear accumulated dev DB state)
- `pnpm agent:validate` (floor-scope: typecheck + URL grep + 5 Category A floor tests; expect 26/26 GREEN)
- Full-suite `pnpm test` NOT invoked — would burn ~10 min producing no signal beyond floor-scope per the mechanical-non-impact argument.

---

## Stop conditions (keyed to scope-completion milestones)

Stop and report at each of these checkpoints, before proceeding to the next:

1. **After environment preconditions verified, before reading context.** Confirm: repo accessible, git state matches handoff expectations (HEAD at 5B brainstorm closeout push), pnpm toolchain working.
2. **After C1 (Layer 1 bundle) lands, before C2 substrate.** Confirm: 9 feature specs at 01_prd/, 01_prd/README touched-up, phase-2/README acknowledges migration, working tree clean. **C1 reviewability check:** if 9 moves + 2 README updates feel separable during execution, surface as finding rather than forcing the bundle. Default is bundled per Decision 3+4 lock.
3. **After C2 substrate establishes, before Layer 2 migrations.** Confirm: ratification-packages/ directory exists, 3 READMEs updated cleanly, working tree clean, no broken cross-references introduced.
4. **After C4 (Layer 2 2026-05-04 group) lands, before floor-only verification.** Confirm: all 13 phase-0 files at proper sub-buckets, friction-journal path-note added, working tree clean, scope complete.
5. **After floor-only verification, before closeout commit.** Confirm: pnpm db:reset:clean && pnpm agent:validate reports 26/26 GREEN.
6. **After closeout commit lands, before pushing.** Confirm push-readiness state per all three conditions.

---

## Task 1: Layer 1 — 9 feature specs to 01_prd/ + READMEs touch-ups (C1)

**Context:** 9 Phase-2-pattern feature specs share provenance ("Status: Phase 2 pattern, captured during the agent autonomy design sprint 2026-04-16"). All are PRD-grain (user-facing feature intent). Migrate flat to 01_prd/, no sub-folder, per V1 amendment #3 ("top-level folders are document classes"). Bundled with phase-2/README acknowledgment + 01_prd/README touch-up because both READMEs describe state that changes via this commit.

**Files moved (`git mv`, all tracked siblings, content-preserving renames):**
1. `docs/09_briefs/phase-2/cmd_z_as_reversal.md` → `docs/01_prd/cmd_z_as_reversal.md`
2. `docs/09_briefs/phase-2/contextual_annotations.md` → `docs/01_prd/contextual_annotations.md`
3. `docs/09_briefs/phase-2/institutional_memory_view.md` → `docs/01_prd/institutional_memory_view.md`
4. `docs/09_briefs/phase-2/mini_map_large_ledgers.md` → `docs/01_prd/mini_map_large_ledgers.md`
5. `docs/09_briefs/phase-2/mirror_cards_intercompany.md` → `docs/01_prd/mirror_cards_intercompany.md`
6. `docs/09_briefs/phase-2/mobile_approval_remote.md` → `docs/01_prd/mobile_approval_remote.md`
7. `docs/09_briefs/phase-2/peek_drill_down.md` → `docs/01_prd/peek_drill_down.md`
8. `docs/09_briefs/phase-2/pinned_views_strip.md` → `docs/01_prd/pinned_views_strip.md`
9. `docs/09_briefs/phase-2/triage_bucket_intake.md` → `docs/01_prd/triage_bucket_intake.md`

**Files modified:**
- `docs/01_prd/README.md` — touch-up (3 structurally-invalid claims removed/replaced).
- `docs/09_briefs/phase-2/README.md` — acknowledgment paragraph for migrations.

- [ ] **Step 1: Read both READMEs to confirm current bytes.**

```bash
cat docs/01_prd/README.md
cat docs/09_briefs/phase-2/README.md
```

Confirm 01_prd/README.md still has the three structurally-invalid claims ("ships empty in Phase 1.1"; "Expected first occupant: Phase 1.2 agent integration PRD"; "Deletion criterion"). Confirm phase-2/README.md still has its current "What goes here / What does NOT go here" structure.

- [ ] **Step 2: 9 git mv commands** for the feature specs to 01_prd/ flat.

```bash
git mv docs/09_briefs/phase-2/cmd_z_as_reversal.md docs/01_prd/cmd_z_as_reversal.md
git mv docs/09_briefs/phase-2/contextual_annotations.md docs/01_prd/contextual_annotations.md
git mv docs/09_briefs/phase-2/institutional_memory_view.md docs/01_prd/institutional_memory_view.md
git mv docs/09_briefs/phase-2/mini_map_large_ledgers.md docs/01_prd/mini_map_large_ledgers.md
git mv docs/09_briefs/phase-2/mirror_cards_intercompany.md docs/01_prd/mirror_cards_intercompany.md
git mv docs/09_briefs/phase-2/mobile_approval_remote.md docs/01_prd/mobile_approval_remote.md
git mv docs/09_briefs/phase-2/peek_drill_down.md docs/01_prd/peek_drill_down.md
git mv docs/09_briefs/phase-2/pinned_views_strip.md docs/01_prd/pinned_views_strip.md
git mv docs/09_briefs/phase-2/triage_bucket_intake.md docs/01_prd/triage_bucket_intake.md
```

Verify with `git status --short`: expect 9 lines `R  docs/09_briefs/phase-2/<file>.md -> docs/01_prd/<file>.md`.

- [ ] **Step 3: Touch-up 01_prd/README.md.**

Replace the entire file body (from line 3 onward, after the `# Product Requirements Documents` header) with the locked text from Decision 3:

```markdown
# Product Requirements Documents

This folder houses feature-level product intent documents — the
bridge between product vision and system specs. Current contents
are Phase 2 feature specs from the agent autonomy design sprint;
future PRDs land here when features need product-level intent docs
separate from architecture and execution.
```

Old content removed: "ships empty in Phase 1.1" sentence; "Expected first occupant" paragraph; "Deletion criterion" paragraph. Framing-clause integrated into the new opening (preserves "feature-level product intent documents — the bridge between product vision and system specs").

**Decision 3 lock:** session-internal vocabulary ("migrated round-2 Session 5B") deliberately omitted; phase context is content-derived ("Phase 2 feature specs from the agent autonomy design sprint") matching the provenance encoded in each file's "Status:" header.

**Decision 3 lock:** deletion-criterion deleted entirely (not preserved as conditional). Cleaner; let any V2-ratified deletion convention apply uniformly across directories.

- [ ] **Step 4: Acknowledge migrations in phase-2/README.md.**

Insert a blockquote at the top of the file (after `# Phase 2 Briefs` H1, before the existing `Execution briefs and architectural planning documents...` paragraph), matching the friction-journal path-note pattern:

```markdown
> **Migration note (round-2 Session 5B, 2026-05-08):** 9
> Phase-2-pattern feature specs migrated to `docs/01_prd/` as
> product intent documents (per the briefs convention's
> top-level-folders-are-document-classes principle). 13 Phase-0
> governance files migrated to `docs/09_briefs/phase-0/` per the
> per-phase organization. 8 files retained here with deferred
> dispositions: 2 architectural briefs (`interaction_model_extraction.md`,
> `agent_architecture_proposal.md`) deferred to Session 6 alongside
> docs/03_architecture/ README rewrite; 1 scope-decision
> (`class-2-scope-decision.md`) and 5 specialized files
> (`document_platform_initiative.md`, `document_platform_reframe_design.md`,
> `obligations.md`, `session-22-brief.md`, `spend_initiative.md`)
> deferred to Session 7 or post-round-2 per their natural homes.
> The existing prose below describes original intent; some claims
> are partially stale post-migration but preserved per the δ-i
> preservation discipline. Full rewrite deferred to Session 7's
> V1→V2 ratification work.
```

The existing prose below stays unchanged (δ-i preservation per the discipline).

- [ ] **Step 5: Verify no broken active-doc references.**

```bash
grep -rn "09_briefs/phase-2/cmd_z_as_reversal\|09_briefs/phase-2/contextual_annotations\|09_briefs/phase-2/institutional_memory_view\|09_briefs/phase-2/mini_map\|09_briefs/phase-2/mirror_cards\|09_briefs/phase-2/mobile_approval\|09_briefs/phase-2/peek_drill\|09_briefs/phase-2/pinned_views\|09_briefs/phase-2/triage_bucket" --include="*.md" docs/
```

Expected: zero matches. If matches surface, those references need updating per the disposition matrix (active-doc rewrite vs δ-i preserve) — surface as finding for evaluation before commit.

- [ ] **Step 6: Run static toolchain checks.**

```bash
pnpm typecheck
pnpm adr:lint
pnpm adr:index --check
```

Expected: all three exit clean.

- [ ] **Step 7: Commit C1.**

```bash
git add docs/09_briefs/phase-2/cmd_z_as_reversal.md docs/01_prd/cmd_z_as_reversal.md \
        docs/09_briefs/phase-2/contextual_annotations.md docs/01_prd/contextual_annotations.md \
        docs/09_briefs/phase-2/institutional_memory_view.md docs/01_prd/institutional_memory_view.md \
        docs/09_briefs/phase-2/mini_map_large_ledgers.md docs/01_prd/mini_map_large_ledgers.md \
        docs/09_briefs/phase-2/mirror_cards_intercompany.md docs/01_prd/mirror_cards_intercompany.md \
        docs/09_briefs/phase-2/mobile_approval_remote.md docs/01_prd/mobile_approval_remote.md \
        docs/09_briefs/phase-2/peek_drill_down.md docs/01_prd/peek_drill_down.md \
        docs/09_briefs/phase-2/pinned_views_strip.md docs/01_prd/pinned_views_strip.md \
        docs/09_briefs/phase-2/triage_bucket_intake.md docs/01_prd/triage_bucket_intake.md \
        docs/01_prd/README.md docs/09_briefs/phase-2/README.md

git commit -m "$(cat <<'EOF'
docs(briefs): Layer 1 — 9 feature specs to 01_prd/ + READMEs touch-ups (5B Commit 1)

Round-2 Session 5B Layer 1 migration. Per Decision 1 (narrow scope),
9 Phase-2-pattern feature specs migrate from docs/09_briefs/phase-2/
to docs/01_prd/ flat. All share provenance ("Status: Phase 2 pattern,
captured during the agent autonomy design sprint 2026-04-16"); all
PRD-grain (user-facing feature intent). 8 retained phase-2/ files
defer per disposition matrix (2 architectural briefs to Session 6;
1 scope-decision + 5 specialized files to Session 7 or post-round-2).

01_prd/README.md and phase-2/README.md updates: factual claims
invalidated by Layer 1 migration corrected. 01_prd/README.md
"ships empty" / "expected first occupant" / "deletion criterion"
claims removed; current contents framed as Phase 2 feature specs
from agent autonomy design sprint. phase-2/README.md acknowledges
the 9-file Layer 1 migration with the 8-file deferral. Touch-up
scope only — one-canonical-axis framing and full rewrite remain
Session 6 work per the locked-four-becomes-five carry-forward.

Per V1 amendment #3 ("top-level folders are document classes"),
01_prd/ stays flat; phase provenance encoded in each file's
"Status:" header, not folder structure. First concrete consumer
of V1 amendment #3 since ratification.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 2.** Confirm: 9 feature specs at 01_prd/, 01_prd/README touched-up, phase-2/README acknowledges migration, working tree clean. C1 reviewability check: if execution surfaced want-to-separate signals during the bundle, surface as finding now.

---

## Task 2: Layer 2 substrate — convention expansion + 3 READMEs (C2)

**Context:** Per Decision 2 lock, Layer 2 expands the briefs convention with a new `phase-0/ratification-packages/` sub-bucket (4th sub-bucket), driven by 7-consumer evidence (D1-D6 ratification packages cluster in Phase 0). Three READMEs document the expansion: briefs convention README (sub-bucket count 3→4); ADR README (separate paragraph for ratification packages, distinguishing pre-ratification vs ratification-time); phase-0/README (instance update reflecting 4 sub-buckets present).

**Files modified:**
- `docs/09_briefs/README.md` — sub-bucket count update + added bullet.
- `docs/07_governance/adr/README.md` — separate paragraph for ratification packages, after the existing pre-ratification design specs section.
- `docs/09_briefs/phase-0/README.md` — instance update (sub-buckets-present list + closeout-artifact references).

**Files created:**
- `docs/09_briefs/phase-0/ratification-packages/` directory (will be populated in C3-C4 by 6 D1-D6 packages; create with `mkdir -p` so it exists before migrations land).

- [ ] **Step 1: Create the new sub-bucket directory.**

```bash
mkdir -p docs/09_briefs/phase-0/ratification-packages
ls -d docs/09_briefs/phase-0/ratification-packages
```

Expected: directory created. Files land in C3-C4.

- [ ] **Step 2: Update briefs convention README (`docs/09_briefs/README.md`).**

Edit the Convention section. Find the three-sub-bucket bullet list:

```markdown
Each phase folder contains the sub-buckets the phase needs:

- `specs/`  — pre-ratification design specs (per ADR-0021).
- `plans/`  — multi-step execution plans.
- `chunks/` — mid-arc working briefs.

Phases use the subset that applies. Sub-buckets are added as their
consumers emerge; current convention ships with three because
three have current consumers. Future sub-buckets land when consumer
evidence forces the shape.
```

Replace with:

```markdown
Each phase folder contains the sub-buckets the phase needs:

- `specs/`              — pre-ratification design specs (per ADR-0021).
- `plans/`              — multi-step execution plans.
- `chunks/`             — mid-arc working briefs.
- `ratification-packages/` — formal substrate enacting ADR ratification (added round-2 Session 5B; 6-consumer evidence from Phase 0's D1-D6 ratification cluster).

Phases use the subset that applies. Sub-buckets are added as their
consumers emerge; current convention ships with four because four
have current consumers. The `ratification-packages/` sub-bucket
exercises the rule's first concrete invocation (Session 5B's Layer
2 migration; consumer evidence: D1-D6 ratification packages from
Phase 0's governance arc). Future sub-buckets land when consumer
evidence forces the shape.
```

The "first concrete invocation" framing flags this as the rule's first test case (per the convention-expansion-rule observation logged at 5B brainstorm Decision 2; codification waits for second invocation to validate).

- [ ] **Step 3: Update ADR README (`docs/07_governance/adr/README.md`).**

After the existing § Pre-ratification design specs (the section ending at the line that mentions ADR-0019's spec migration to phase-0/specs/ at round-2 Session 5A), insert a new paragraph (NOT under § Pre-ratification design specs — separate concern):

`old_string`:
```
ADR-0021 introduced the pre-ratification-design-spec discipline
at round-2 Session 3. ADRs 0001-0018 predate this convention
and were ratified without separate pre-ratification specs.
ADR-0019 is the single pre-existing instance under the
convention; its design spec was originally authored at the
now-deprecated location `docs/superpowers/specs/`, migrated to
`docs/09_briefs/phase-0/specs/` in round-2 Session 5A (see
`docs/restructure-plan.md` Amendments section for migration
provenance and `docs/07_governance/DOCS_RESTRUCTURE_V2.md`
when ratified at Session 7).
```

`new_string`:
```
ADR-0021 introduced the pre-ratification-design-spec discipline
at round-2 Session 3. ADRs 0001-0018 predate this convention
and were ratified without separate pre-ratification specs.
ADR-0019 is the single pre-existing instance under the
convention; its design spec was originally authored at the
now-deprecated location `docs/superpowers/specs/`, migrated to
`docs/09_briefs/phase-0/specs/` in round-2 Session 5A (see
`docs/restructure-plan.md` Amendments section for migration
provenance and `docs/07_governance/DOCS_RESTRUCTURE_V2.md`
when ratified at Session 7).

## Ratification packages

Distinct from pre-ratification artifacts (specs/ + plans/),
**ratification packages** are the formal substrate enacting ADR
ratification at the original ratification moment. They live at
`docs/09_briefs/<phase>/ratification-packages/` per the briefs
convention's per-phase organization. Filename pattern:
`YYYY-MM-DD-<package-id>-ratification-package.md`. Phase 0's
D1-D6 ratification cluster (6 packages, ratifying ADRs 0011-0018
respectively) is the canonical consumer; ratification-packages/
sub-bucket established in round-2 Session 5B per consumer
evidence. Migrated from the original Phase-2-brief-folder location
during Session 5B Layer 2.

The lifecycle distinction matters: pre-ratification specs/plans
are INPUTS to ADR drafting (design specs become ADRs; execution
plans guide ADR authorship); ratification packages are FORMAL
SUBSTRATE at ratification time (the package is what enacts the
ratification ceremony per the project's governance discipline).
```

The new section is structurally separate from § Pre-ratification design specs to preserve the lifecycle distinction (pre-ratification vs ratification-time) per Decision 2 refinement #2.

- [ ] **Step 4: Update phase-0/README.md instance.**

Edit the existing phase-0/README.md (shipped at 5A) to reflect the post-5B state. Find the Sub-buckets present section:

`old_string`:
```
## Sub-buckets present

- `specs/` — pre-ratification design spec for ADR-0019 (the
  single pre-existing instance under the ADR-0021 convention;
  ADRs 0011-0018 predate the discipline and were ratified
  without separate pre-ratification specs).
- `plans/` — D5 ratification execution plan + C11/D6
  ratification execution plan.

## Closeout artifacts

Friction-journal entries spanning Sessions 2A-2F live under
their respective date headers in
`docs/07_governance/friction-journal.md`. Closure-verification
brief and other Phase 0 governance docs migrate to this folder
in Session 5B (Layer 2 of round-2 docs reorganization).
```

`new_string`:
```
## Sub-buckets present

- `specs/` — pre-ratification design spec for ADR-0019 (the
  single pre-existing instance under the ADR-0021 convention;
  ADRs 0011-0018 predate the discipline and were ratified
  without separate pre-ratification specs).
- `plans/` — D5 ratification execution plan + C11/D6
  ratification execution plan + phase-0-governance-plan
  (overall arc plan).
- `chunks/` — mid-arc working briefs: bank-detail amendment,
  evidence-link coordination, phase-0 closure-verification,
  session 2D opening prompt, session 2F opening prompt and
  closeout.
- `ratification-packages/` — D1-D6 ratification packages
  (formal substrate enacting ADRs 0011-0018 ratification).

## Closeout artifacts

Friction-journal entries spanning Sessions 2A-2F live under
their respective date headers in
`docs/07_governance/friction-journal.md`. Closure-verification
brief at `chunks/2026-05-04-phase-0-closure-verification.md`
(routed to chunks/ per "closeout artifacts route by purpose"
rule — closure-verification's purpose is procedural-verification
not formal-closure-enactment, distinguishing it from
ratification-packages/ which is for formal-substrate-at-
ratification-moment).
```

The instance README documents what's actually in phase-0/ post-5B. Closeout-artifacts framing names the routing rule explicitly per Decision 5's closure-verification placement justification.

- [ ] **Step 5: Verify static toolchain.**

```bash
pnpm typecheck
pnpm adr:lint
pnpm adr:index --check
```

Expected: all clean. ADR README is touched but pre-commit hook will re-verify on commit.

- [ ] **Step 6: Commit C2.**

```bash
git add docs/09_briefs/README.md docs/07_governance/adr/README.md docs/09_briefs/phase-0/README.md

# Note: empty directory ratification-packages/ is not staged by git;
# C3 will populate it via git mv and the directory becomes tracked
# transitively. No .gitkeep needed.

git commit -m "$(cat <<'EOF'
docs(briefs): Layer 2 substrate — convention expansion + 3 READMEs (5B Commit 2)

Round-2 Session 5B Layer 2 substrate. Per Decision 2 (convention
expansion via option X), briefs convention adds a 4th sub-bucket
ratification-packages/ for formal substrate enacting ADR
ratification. Driven by 6-consumer evidence (Phase 0's D1-D6
ratification cluster). Forced into existing 3 sub-buckets would be
category-erosion at the sub-bucket level — same V1-amendment-#3
("top-level folders are document classes") principle applied at
sub-bucket grain. Convention's "sub-buckets added as consumers
emerge" rule first concrete invocation; observation #15 logged in
brainstorm closeout for codification candidacy at second invocation.

Three READMEs touched per Decision 2 refinement #2:
- docs/09_briefs/README.md: sub-bucket count 3→4 with explicit
  framing per "added as consumers emerge" rule. New bullet
  documents ratification-packages/'s consumer evidence and
  first-invocation status.
- docs/07_governance/adr/README.md: separate paragraph for
  ratification packages, NOT folded into pre-ratification design
  specs section. Preserves lifecycle distinction (pre-ratification
  inputs vs ratification-time formal substrate) per Decision 2
  refinement.
- docs/09_briefs/phase-0/README.md: instance update reflecting
  4 sub-buckets present + closeout-artifacts framing per "closeout
  artifacts route by purpose" rule (closure-verification → chunks/
  per procedural-verification purpose; ratification-packages/ for
  formal-substrate-at-ratification-moment).

Layer 2 migrations follow in C3 (2026-05-03 group, 5 files) and
C4 (2026-05-04 group, 8 files). Empty ratification-packages/
directory created via mkdir; will be populated transitively by
git mv operations in C3-C4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 3.** Confirm: ratification-packages/ directory exists, 3 READMEs updated, working tree clean.

---

## Task 3: Layer 2 — 2026-05-03 group migration (C3)

**Context:** 5 files dated 2026-05-03 migrate from `docs/09_briefs/phase-2/` to `docs/09_briefs/phase-0/` per their content classification:

| File | Sub-bucket | Reasoning |
|---|---|---|
| `2026-05-03-phase-0-governance-plan.md` | `plans/` | Overall arc plan (multi-step execution scope) |
| `2026-05-03-d1-ratification-package.md` | `ratification-packages/` | D1 formal ratification substrate |
| `2026-05-03-d2-ratification-package.md` | `ratification-packages/` | D2 formal ratification substrate |
| `2026-05-03-d3-ratification-package.md` | `ratification-packages/` | D3 formal ratification substrate |
| `2026-05-03-agent-autonomy-bank-detail-amendment.md` | `chunks/` | Post-ratification mid-arc adjustment per Decision 2 refinement #3 (temporal-vs-formal distinction) |

**Tracked-to-tracked migrations**, all `git mv` (no asymmetric handling per the 5A precedent's case-specific scope; 5A's deliberate-untracked breadcrumb pattern doesn't apply to tracked-to-tracked migrations).

- [ ] **Step 1: 5 git mv commands.**

```bash
git mv docs/09_briefs/phase-2/2026-05-03-phase-0-governance-plan.md \
       docs/09_briefs/phase-0/plans/2026-05-03-phase-0-governance-plan.md

git mv docs/09_briefs/phase-2/2026-05-03-d1-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-03-d1-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-03-d2-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-03-d2-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-03-d3-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-03-d3-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-03-agent-autonomy-bank-detail-amendment.md \
       docs/09_briefs/phase-0/chunks/2026-05-03-agent-autonomy-bank-detail-amendment.md
```

Verify with `git status --short`: expect 5 lines `R  ...phase-2/2026-05-03-... -> ...phase-0/<sub-bucket>/2026-05-03-...`.

- [ ] **Step 2: Ref-update sweep for active-doc references to migrated files.**

```bash
grep -rn "09_briefs/phase-2/2026-05-03-" --include="*.md" docs/
```

For each match, evaluate per disposition matrix from 5A's Commit 3:
- friction-journal entries → preserved verbatim (covered by file-top path-note blockquote in Step 3)
- legacy ADRs (0021, 0019) → δ-i preserved
- restructure-plan.md → δ-i preserved (historical)
- 5A plan / 5B plan / round-2 README → describe own work; preserved
- closed-phase brief → δ-i preserved

Active-doc rewrites (if any beyond the disposition matrix): surface as findings before commit.

- [ ] **Step 3: Extend friction-journal path-note blockquote.**

Find the existing path-note blockquote at the top of `docs/07_governance/friction-journal.md` (added at 5A Commit 3). Add a sibling blockquote (or extend the existing one) for the phase-0 governance migration.

`old_string` (anchored to the existing 5A blockquote ending):
```
> File contents are unchanged; only locations moved. References
> preserved verbatim per the friction-journal-is-history rule
> (entries record what was true at write time). See the 2026-05-08
> NOTE entry below (Session 5A closeout) for the migration's
> commit-level provenance.

## Phase 2
```

`new_string`:
```
> File contents are unchanged; only locations moved. References
> preserved verbatim per the friction-journal-is-history rule
> (entries record what was true at write time). See the 2026-05-08
> NOTE entry below (Session 5A closeout) for the migration's
> commit-level provenance.

> **Path note 2026-05-08 (round-2 docs reorganization Session 5B
> Layer 2 phase-0 governance migration):** entries below
> referencing `docs/09_briefs/phase-2/2026-05-03-*` and
> `docs/09_briefs/phase-2/2026-05-04-*` files (D1-D6 ratification
> packages, phase-0-governance-plan, bank-detail amendment,
> evidence-link coordination, phase-0-closure-verification, session
> 2d/2f opening prompts and closeout) should be read as referring
> to their new locations under `docs/09_briefs/phase-0/<sub-bucket>/`
> per the briefs convention's per-phase organization. Sub-bucket
> assignments per Session 5B Decision 2 + 5: governance-plan →
> plans/; D1-D6 packages → ratification-packages/ (NEW sub-bucket
> per convention expansion at Session 5B Decision 2); bank-detail
> amendment + evidence-link + closure-verification + session
> prompts/closeout → chunks/. File contents unchanged; only
> locations moved. References preserved verbatim per the
> friction-journal-is-history rule. See the 2026-05-08 NOTE entry
> below (Session 5B closeout) for the migration's commit-level
> provenance.

## Phase 2
```

- [ ] **Step 4: Static toolchain checks.**

```bash
pnpm typecheck && pnpm adr:lint && pnpm adr:index --check
```

Expected: all clean.

- [ ] **Step 5: Commit C3.**

```bash
git add docs/07_governance/friction-journal.md
# git mv operations from Step 1 are already staged

git commit -m "$(cat <<'EOF'
docs(briefs): Layer 2 — 2026-05-03 group phase-0 migration (5B Commit 3)

Round-2 Session 5B Layer 2 first migration commit. 5 files
dated 2026-05-03 migrate from docs/09_briefs/phase-2/ to
docs/09_briefs/phase-0/ per Decision 2 + 5 sub-bucket
assignments:

- phase-0-governance-plan.md → plans/ (overall arc plan)
- d1/d2/d3-ratification-package.md → ratification-packages/
  (formal ratification substrate; first 3 inhabitants of the
  new sub-bucket established in C2)
- agent-autonomy-bank-detail-amendment.md → chunks/
  (post-ratification mid-arc adjustment per temporal-vs-formal
  distinction; ADR-0022's amendment-vs-ratification workflow
  framing applied to placement)

Tracked-to-tracked migrations; all git mv. 5A's deliberate-
untracked breadcrumb pattern doesn't apply (case-specific to
scratch-to-tracked migrations); pure git mv suffices for
tracked-to-tracked.

Friction-journal file-top path-note blockquote extended with
sibling blockquote for the phase-0 governance migration
(matching the 5A docs/superpowers/ migration pattern). All
journal references to 2026-05-03-* files preserved verbatim
per friction-journal-is-history rule; the new blockquote
covers the migration in the same shape as 5A's.

C4 (2026-05-04 group, 8 files) follows next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Layer 2 — 2026-05-04 group migration (C4)

**Context:** 8 files dated 2026-05-04 migrate from `docs/09_briefs/phase-2/` to `docs/09_briefs/phase-0/`:

| File | Sub-bucket | Reasoning |
|---|---|---|
| `2026-05-04-d4-ratification-package.md` | `ratification-packages/` | D4 formal ratification substrate |
| `2026-05-04-d5-ratification-package.md` | `ratification-packages/` | D5 formal ratification substrate |
| `2026-05-04-d6-ratification-package.md` | `ratification-packages/` | D6 formal ratification substrate |
| `2026-05-04-evidence-link-coordination.md` | `chunks/` | Mid-arc working brief |
| `2026-05-04-phase-0-closure-verification.md` | `chunks/` | Procedural verification (closeout artifact routed by purpose; not formal-closure-enactment) |
| `2026-05-04-session-2d-opening-prompt.md` | `chunks/` | Session-grain working brief |
| `2026-05-04-session-2f-opening-prompt.md` | `chunks/` | Session-grain working brief |
| `2026-05-04-session-2f-closeout.md` | `chunks/` | Session-grain closeout (mid-arc, not phase closeout) |

**One file (`2026-05-06-phase-2-brief-pre-positioning-notes.md`) NOT migrated** — it's about Phase 2 brief preparation, not phase-0 governance, despite being date-grouped with the others. Stays at `docs/09_briefs/phase-2/`.

- [ ] **Step 1: 8 git mv commands.**

```bash
git mv docs/09_briefs/phase-2/2026-05-04-d4-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-04-d4-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-04-d5-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md \
       docs/09_briefs/phase-0/ratification-packages/2026-05-04-d6-ratification-package.md

git mv docs/09_briefs/phase-2/2026-05-04-evidence-link-coordination.md \
       docs/09_briefs/phase-0/chunks/2026-05-04-evidence-link-coordination.md

git mv docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md \
       docs/09_briefs/phase-0/chunks/2026-05-04-phase-0-closure-verification.md

git mv docs/09_briefs/phase-2/2026-05-04-session-2d-opening-prompt.md \
       docs/09_briefs/phase-0/chunks/2026-05-04-session-2d-opening-prompt.md

git mv docs/09_briefs/phase-2/2026-05-04-session-2f-opening-prompt.md \
       docs/09_briefs/phase-0/chunks/2026-05-04-session-2f-opening-prompt.md

git mv docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md \
       docs/09_briefs/phase-0/chunks/2026-05-04-session-2f-closeout.md
```

- [ ] **Step 2: Ref-update sweep for 2026-05-04 references.**

```bash
grep -rn "09_briefs/phase-2/2026-05-04-" --include="*.md" docs/
```

Disposition per same matrix as Step 2 of Task 3.

- [ ] **Step 3: Static toolchain checks.**

```bash
pnpm typecheck && pnpm adr:lint && pnpm adr:index --check
```

- [ ] **Step 4: Commit C4.**

```bash
git commit -m "$(cat <<'EOF'
docs(briefs): Layer 2 — 2026-05-04 group phase-0 migration (5B Commit 4)

Round-2 Session 5B Layer 2 second migration commit. 8 files
dated 2026-05-04 migrate from docs/09_briefs/phase-2/ to
docs/09_briefs/phase-0/ per Decision 2 + 5 sub-bucket
assignments:

- d4/d5/d6-ratification-package.md → ratification-packages/
  (completing the D1-D6 cluster; sub-bucket now has 6
  inhabitants matching its consumer-evidence basis)
- evidence-link-coordination.md → chunks/ (coordination
  artifact; mid-arc working brief)
- phase-0-closure-verification.md → chunks/ (procedural
  verification per "closeout artifacts route by purpose" rule;
  closure-verification's purpose is procedural-verification,
  not formal-closure-enactment, distinguishing from
  ratification-packages/ which is formal-substrate-at-
  ratification-moment)
- session-2d-opening-prompt + session-2f-opening-prompt +
  session-2f-closeout → chunks/ (session-grain working briefs)

NOT migrated: 2026-05-06-phase-2-brief-pre-positioning-notes.md
stays at docs/09_briefs/phase-2/ — content is about Phase 2
brief preparation, not phase-0 governance, despite the date-
grouping.

Tracked-to-tracked migrations; pure git mv (no asymmetric
handling per Decision 4 — 5A's case-specific deliberate-
untracked precedent doesn't apply).

5B Layer 1 + Layer 2 migration scope complete with this commit.
Closeout commit (C5) follows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 4.** Confirm: all 13 phase-0 files at proper sub-buckets, working tree clean, scope complete.

---

## Task 5: Floor-only verification + closeout commit + push (C5 + push)

**Context:** Push-readiness gate per Decision 6 lock: floor-only carve-out (formal criteria met). Verification protocol matches the carve-out's framing — floor-scope only, full-suite NOT invoked per the mechanical-non-impact argument.

- [ ] **Step 1: Floor-only verification protocol.**

```bash
pnpm db:reset:clean
pnpm agent:validate
pnpm typecheck
```

Expected:
- `pnpm db:reset:clean` completes (DB reset).
- `pnpm agent:validate` reports `Test Files 5 passed (5); Tests 26 passed (26)` (typecheck + URL grep + 5 floor tests).
- `pnpm typecheck` clean exit.

If any check fails, surface as finding before closeout.

**STOP at this checkpoint per Stop Condition 5.** Confirm: floor-only verification GREEN; ready for closeout.

- [ ] **Step 2: Draft and commit closeout friction-journal entry.**

Insert a new multi-paragraph bullet at the top of `## Phase 2` in `docs/07_governance/friction-journal.md`, above the existing topmost bullet (which is the 5B brainstorm closeout entry from the writing-plans dispatch push).

Entry structure (closeout for 5B EXECUTION, not brainstorm):

```markdown
- 2026-05-XX NOTE — Round-2 docs reorganization Session 5B
  (Layer 1 + Layer 2 execution) shipped. Five implementation
  commits per the substrate-then-moves sequence locked at 5B
  brainstorm + plan at
  `docs/07_governance/round-2/2026-05-08-session-5b-plan.md`.

  Five commits:
  - <C1 hash> (Layer 1): 9 feature specs phase-2/ → 01_prd/
    flat + phase-2/README acknowledgment + 01_prd/README touch-up.
  - <C2 hash> (Layer 2 substrate): convention expansion (3→4
    sub-buckets) + 3 README updates + new ratification-packages/
    directory.
  - <C3 hash> (Layer 2 migrations 2026-05-03): 5 file moves
    + friction-journal path-note blockquote extension.
  - <C4 hash> (Layer 2 migrations 2026-05-04): 8 file moves.

  Acceptance criteria — all 12 satisfied (a-l per plan).

  Pre-codification observation queue advances per 5B brainstorm's
  triage: floor-only push gate carve-out elevates from N=2 LIVE
  to N=3 LIVE (third invocation at this push); other observations
  unchanged from brainstorm-closeout state. Convention-expansion
  rule observation #15 reaches N=1 first invocation (ratification-
  packages/ created per Decision 2).

  Push-readiness gate (per CLAUDE.md three-condition gate, floor-
  only carve-out path):
  - Condition 1 (test-suite health): GREEN under floor-only path.
    pnpm db:reset:clean && pnpm agent:validate reports 26/26.
    Full-suite NOT invoked per the carve-out's mechanical-non-
    impact argument; doc-only diff (zero migrations / zero
    services / zero integration tests / zero source files / zero
    test files) cannot regress tests by construction.
  - Condition 2 (doc-sync): GREEN. 5B's primary deliverable IS
    doc-sync work (Layer 1 + Layer 2 migrations + convention
    expansion + 3 README updates); category-distinct from fix-
    arc closeout's "no doc-sync needed" green AND 5A closeout's
    "doc-sync done as primary deliverable" green — same category
    as 5A's, indicating sustained-pattern not establishing-
    pattern.
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured per the brainstorm closeout's framing.

  Forward pointers:
  - Session 6 brainstorm inherits the queue post-5B-execution
    plus whatever 5B execution surfaces. Per brainstorm closeout's
    queue-trajectory-non-linearity flag, Session 6 brainstorm
    should make the payload-mitigation decision explicitly
    (offload-to-Session-6 vs split-7A/7B vs accept-overload)
    rather than deferring to Session 7 trigger time.
  - Session 7 codification queue: Tier 1 candidates LIVE
    (Turbo cache, floor-only at N=3, count-level commit pattern
    at N=3 candidacy).
  - 8 retained phase-2/ files have explicit dispositions per
    Decision 1's narrow scope: 2 architectural briefs to Session 6;
    1 scope-decision + 5 specialized to Session 7 or post-round-2.
```

Replace `2026-05-XX` with execution date and `<C1 hash>` etc. with actual commit SHAs.

- [ ] **Step 3: Commit C5.**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(governance): friction-journal — round-2 Session 5B closeout

Records 5B Layer 1 + Layer 2 execution shipped: four
implementation commits (Layer 1 bundle; Layer 2 substrate;
Layer 2 2026-05-03 group; Layer 2 2026-05-04 group) plus this
closeout commit. Push-readiness gate evaluates green under
floor-only carve-out (third invocation; N=3 with natural-outcome
evidence at three independent consumers).

Floor-only push gate carve-out advances N=2 LIVE → N=3 LIVE
this push. Codification position for Session 7 strengthens:
N=3 with natural-outcome evidence is qualitatively stronger
codification basis than N=2.

Convention-expansion rule observation #15 reaches first
concrete invocation (ratification-packages/ created in C2 per
Decision 2). Codification candidacy at second invocation per
the same epistemic discipline.

Carry-forwards documented for Session 6 brainstorm: queue-
trajectory-non-linearity flag (Session 7 may inherit 25-30
observations if growth pattern continues); payload-mitigation
decision should land at Session 6 brainstorm not Session 7
trigger.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 6.** Confirm push-readiness state per all three conditions.

- [ ] **Step 4: Push.**

```bash
git push origin staging
```

Verify with `git log --oneline origin/staging..HEAD | wc -l` post-push: expect 0 (in sync).

---

## Self-Review Checklist (run before declaring plan complete)

1. **Spec coverage:** Each acceptance criterion (a)–(l) maps to a verification step in Task 1-5. ✓
2. **Placeholder scan:** Date placeholders (`2026-05-XX`) and commit-hash placeholders (`<C1 hash>` etc.) intentional execution-time fill-ins. No "TBD" / "TODO" / "implement later" patterns. ✓
3. **Type/identifier consistency:** Sub-bucket names (specs/, plans/, chunks/, ratification-packages/) consistent across plan + commit messages + closeout entry. File paths consistent. ✓
4. **Disposition matrix coverage:** Each `09_briefs/phase-2/` reference site is covered by an explicit disposition (rewrite via active doc, annotate via path-note, preserve per δ-i). ✓
5. **Stop conditions keyed to scope-completion milestones:** Per observation #6 from 5A, stops use scope-completion language ("after Layer 1 bundle lands," "after Layer 2 substrate establishes," "after migrations complete," "after verification") not commit numbers. ✓
6. **Plan readability standalone:** A fresh-context execution session opening this plan can execute against it without conversation reload. All five flagged details (stop conditions, C1-reviewability, 01_prd/README touch-up text, floor-only gate criteria, closure-verification placement justification) are plan-internal substrate, not conversation references. ✓

---

## Notes for executor

- **The five flagged details** from the brainstorm-to-writing-plans handoff are all plan-internal substrate above. None require reading the brainstorm conversation.
- **C1 reviewability check** is at Stop Condition 2; default is bundled per Decision 3+4 lock; surface separability if execution finds a clean seam, but don't force separation.
- **Date placeholders** in Task 5 Step 2 (`2026-05-XX`) and commit-hash placeholders (`<C1 hash>` etc.) need execution-time fills before the closeout commit lands.
- **The floor-only carve-out's N=3 invocation** is one of the closeout-entry-significant observations; capture explicitly in the friction-journal entry per Task 5 Step 2's structure.
- **Phase-2/README's protection note for `interaction_model_extraction.md`** stays unchanged — the file remains in phase-2/ for Layer 1's narrow scope, deferred to Session 6 alongside docs/03_architecture/ README rewrite.
- **Working tree clean state expected post-execution** — no deferred work, no in-flight observations, no untracked files. 5B inherits the cleanest baseline yet (per 5A closeout's framing) and ships clean state to Session 6 brainstorm.
