# Session 57 Phase 8 Chunk 9 Brief-Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunk 9 brief at substantively-new-phase chunk-brief sub-curve (a) grade per cycle-close §5.1 framing #5 Logic Receipt consumer (ProposalJustificationSchema formal Zod codification + pipeline_trace + bundle_audit_trace parallel field per Sub-Q2 + Sub-Q10 locks; Layer 2 item #B ADR amendment paired with chunk 9 substrate-grade Zod codification per Sub-Q9 substrate-grade-first lock OR retrospective Commit A grade).

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md`. §1-§6 structure inheriting chunk 8 brief template at `2cd394a` (most recent single-chunk-brief precedent at 590 LOC) + chunk 7 brief template at `aba5fe7` (684 LOC sub-curve (a) banking-surface-density variant anchor) + chunk 4 brief template at `a2c20fa` (620 LOC sub-curve (a) anchor). §2.1 + §2.2 + §2.3 single-chunk scope (chunk 9 FIVE substantive surfaces per cycle-close §10.4 + §10.5 + Phase A discovery grade); §4 Tasks single-chunk decomposition. Single-subagent dispatch per Sessions 53-56 precedent inheritance; briefing-grade anti-drift discipline at composition START at BOTH PATH-citation grade (sub-grain (a) N=5 → N=6 cumulative confirming-fire candidate) + NUMERICAL-COUNT grade (sub-grain (e) preemption discipline per Session 56 Finding A Observation 2 inheritance). ~590-640 LOC sub-curve (a) substantively-new-phase forecast band per chunks 2 + 3 + 4 + 7 + 8 + Phase 5.1/6.5/7 precedent inheritance.

**Tech Stack:** Markdown docs authoring. No code changes. ADR-0007 Q30 substrate + Phase 7 chunk 7.3b permissive substrate inheritance + proposedMutation.schema.ts existing Zod surface + ProposalJustificationSchema + PipelineStageRecord + BundleAuditRecord NEW Zod schema substrate-pair read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` (~590-640 LOC at substantively-new-phase chunk-brief sub-curve (a) grade)

**Files to read (Phase A substrate verification per design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework + Phase A discovery grade explicit verification per Session 56 Finding D Discovery 3 operational implication inheritance — Task 1 absorbs cycle-close §10.4 + §10.5 chunk 9 canonical surface enumeration AND Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution at substrate-grade-grain accurate grade):**

- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` (chunk 8 brief at `2cd394a`; 590 LOC sub-curve (a) lower bound; most recent single-chunk-brief precedent; §-structure template inheritance source + zero-Layer-2-amendment substrate-pair shape precedent)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (chunk 7 brief at `aba5fe7`; 684 LOC sub-curve (a) banking-surface-density variant anchor; Layer 2 item #A ADR amendment paired substrate-pair shape precedent)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (chunk 4 brief at `a2c20fa`; 620 LOC sub-curve (a) anchor; §-structure template confirmation source)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 framing-pairing chunk 9 ↔ framing #5 at line 275 + §5.3 chunk 9 acceptance criteria + §6.2 service dependencies + §6.4 ADR amendment ratification sequencing Item #B + §7.6 chunk 9 brief-drafting framing at lines 423-435 + §10.4 chunk 9 code surfaces at line 656 — note "or analogous" framing requires Phase A discovery grade resolution)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (Q30 resolution at lines 482-489: pipeline_trace: PipelineStageRecord[] field with stage_name + input_hash + output_hash + model + timestamp; cross-references at lines 99-100, 233-234, 387, 423-424; §Tier 2 item 5 substrate)
- `docs/07_governance/adr/0011-document-platform.md` (§10 commentary expansion target if applicable; consumer-only at chunk 9 grade)
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (Sub-Q21 Option 21.δ consumer-ADR naming surface §X if applicable; chunk-impl substrate-amendment-pairing deferred grade)
- `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts` (Phase 7 chunk 7.3b substrate; existing 81 LOC; EXTENSION target at lines 65-68 + 77 — replace permissive `z.record(z.string(), z.unknown()).optional()` with formal `ProposalJustificationSchema` import + use)

**Files to grep (Phase A discovery — substantive surface enumeration at canonical-source-artifact grade BEYOND cycle-close §10.4 citation grade):**

- `apps/web/src/shared/schemas/accounting/` (verify canonical Zod schema subdirectory + identify NEW companion file candidates: `proposalJustification.schema.ts` + `pipelineStageRecord.schema.ts` + `bundleAuditRecord.schema.ts` OR consolidated single file):
  ```bash
  ls apps/web/src/shared/schemas/accounting/ | head -20
  ```
- `justification` consumers across `apps/web/src/`:
  ```bash
  grep -rnE "justification|ProposalJustificationSchema|PipelineStageRecord|BundleAuditRecord" apps/web/src --include="*.ts" | head -25
  ```
- `pipeline_trace` + `bundle_audit_trace` references across codebase:
  ```bash
  grep -rnE "pipeline_trace|bundle_audit_trace|PipelineStage" apps/web/src --include="*.ts" | head -25
  ```
- `INV-AGENT-002` audit event composition references:
  ```bash
  grep -rnE "INV-AGENT-002|bundle_id|composition_at|child_proposal_ids|invariant_class" apps/web/src docs --include="*.ts" --include="*.md" 2>/dev/null | head -20
  ```
- `apps/web/tests/integration/services/` existence at Session 57 grade (verify NON-existent per chunks 7-8 impl deferred state):
  ```bash
  ls apps/web/tests/integration/services/ 2>&1 || echo "NON-EXISTENT (expected; chunks 7-8 impl deferred)"
  ```
- `types.ts` generated surface (verify if ProposalJustificationSchema codification surfaces at generated grade):
  ```bash
  ls apps/web/src/db/types.ts 2>&1 && grep -nE "justification|pipeline_trace" apps/web/src/db/types.ts | head -10
  ```

**Files NOT created:** Chunk 9 implementation substrate (ProposalJustificationSchema + PipelineStageRecord + BundleAuditRecord Zod codification + proposedMutation.schema.ts extension + ADR-0007 Q30 Layer 2 #B amendment). Per Candidate (a) ratification: chunk 9 impl deferred to canonical §9.5 sequencing at Sessions 59+ grade.

---

## Task 1: Phase A — Pre-composition verify-from-disk + Phase A discovery grade explicit verification

**Files:**
- Read-only verification across substrate paths above
- Phase A discovery grade explicit substantive surface enumeration verification at canonical-source-artifact grade BEYOND cycle-close §10.4 citation grade per Session 56 Finding D Discovery 3 operational implication inheritance

**Phase A split-discharge sub-grain (b) discipline application** per Session 56 N=1 first-instance + Session 57 N=2 cumulative confirming-fire MATERIALIZED inheritance: UNCONDITIONAL Steps 1-3 already discharged at Session 57 onset BEFORE Candidate ratification (verified at session-onset; reported at Phase A unconditional-discharge close turn). CONDITIONAL Steps 4-16 discharge at this Task 1 grade post-Candidate-ratification + post-design-doc-commit-grade.

- [ ] **Step 1 (CONDITIONAL post-design-doc): Verify commits-ahead at Session 57 plan-composition grade.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `28` (was 27 at Session 56 close + 1 new at Session 57 design doc commit `e5bd188`). If 29, plan-doc commit already fired — adjust expectations downstream. Sessions 53-56 plan template precedent expressed pre-plan-commit count; honor convention.

- [ ] **Step 2 (UNCONDITIONAL already-discharged at session-onset): Cite Phase A Step 2 background discharge.**

pnpm agent:validate 26/26 green verified at Session 57 Phase A Step 2 background discharge (exit 0; 5 files; 4.46s duration; preserved per Session 56 docs-only close shape). No re-discharge required at Task 1 grade unless intervening substrate-modification commits surfaced (verify via Step 1 commits-ahead count; if count exceeds expected by >1, re-discharge required).

- [ ] **Step 3 (UNCONDITIONAL already-discharged at session-onset): Cite working tree clean state.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files. Pre-existing untracked items match Session 56 close inheritance exactly.

- [ ] **Step 4: Read chunk 8 brief in full as most recent single-chunk-brief precedent.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` (590 LOC at `2cd394a`). Verify §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape. Chunk 8 establishes zero-Layer-2-amendment substrate-pair shape (substantively distinct vs chunk 7 Layer 2 item #A paired); chunk 9 substrate-pair shape includes Layer 2 item #B paired per Sub-Q9 substrate-grade-first lock — closer to chunk 7 substrate-pair shape than chunk 8.

- [ ] **Step 5: Read chunk 7 brief as Layer 2-paired substrate-pair shape precedent.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (684 LOC at `aba5fe7`). Chunk 7 establishes Layer 2 item #A paired substrate-pair shape (ADR-0010 admit framework + ExceptionReasonSchema Zod broaden + Layer 1 CHECK broaden synchronously ratified at chunk 7 substrate-grade migration grade). Chunk 9 inherits Layer 2-paired substrate-pair shape but at framing #5 Logic Receipt consumer grade — substrate-grade Zod codification (ProposalJustificationSchema) + Layer 2 item #B ADR-0007 Q30 → §Tier 2 item 5 amendment + Phase 7 chunk 7.3b permissive substrate retroactive formalization synchronously ratified.

- [ ] **Step 6: Read chunk 4 brief as sub-curve (a) anchor template confirmation.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (620 LOC at `a2c20fa`). Confirm §-structure stability — chunks 4 + 7 + 8 + 9 all single-chunk briefs at sub-curve (a) grade; §-structure stable inheritance source.

- [ ] **Step 7: Read cycle-close §5.1 + §5.3 + §6.2 + §6.4 + §7.6 + §10.4 chunk 9 framing.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`:
- §5.1 framing-pairing inventory (chunk 9 ↔ framing #5 Logic Receipt consumer at line 275)
- §5.3 chunk 9 acceptance criteria (line 312: ProposalJustificationSchema formal Zod codification + pipeline_trace + bundle_audit_trace parallel field; Logic Receipt consumer surface materializes)
- §6.2 service dependencies (paymentService.record consumer surface for chunk 9 Layer 2 #B amendment grade; verify)
- §6.4 ADR amendment ratification sequencing Item #B (paired with chunk 9 substrate-grade Zod codification per Sub-Q9 substrate-grade-first OR retrospective Commit A grade)
- §7.6 chunk 9 brief-drafting framing (lines 423-435: scope framing #5 Logic Receipt consumer; substrate-load expectation ADR-0007 Q30 + Layer 2 item #B amendment + Phase 7 chunk 7.3b permissive justification substrate; per-chunk forecast Layer 1 item #2 ~210-320 LOC + Logic Receipt consumer surface; partial-information items BundleAuditRecord field shape; retrospective-candidate operational-relevance Layer 2 item #B ADR amendment timing per Sub-Q9)
- §10.4 chunk 9 code surfaces (line 656: `apps/web/src/agent/orchestrator/proposalJustification.schema.ts (or analogous) — net-new` — "or analogous" framing requires Phase A discovery grade resolution per Session 57 design doc §5.1 INCORRECTNESS sub-pattern banking)

- [ ] **Step 8: Read ADR-0007 Q30 + Tier 2 item 5 substrate at substantive surface grade.**

```bash
sed -n '99,100p;233,234p;387,387p;423,424p;482,489p' docs/07_governance/adr/0007-three-tier-agent-architecture.md
```

Verify Q30 resolution substrate:
- Q30 framing at lines 99-100 + 233-234: justification extends with pipeline_trace
- §Tier 2 item 5 at lines 482-489: pipeline_trace: PipelineStageRecord[] field; stage record carries stage_name, input_hash, output_hash, model, timestamp
- Cross-references at lines 387 + 423-424: pipeline_trace captures per-stage observability; schema change + type-regeneration + Logic Receipt consumer

- [ ] **Step 9: Phase A discovery grade — verify proposedMutation.schema.ts canonical surface.**

```bash
wc -l apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts
grep -nE "justification|ProposalJustificationSchema|pipeline_trace|bundle_audit_trace|z\.record" apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts
```

Expected:
- File at 81 LOC
- Line 12: `// justification field: permissive z.record(z.unknown()).optional() shape`
- Line 14: `// ProposalJustificationSchema codification deferred to Phase 8 / post-v1`
- Line 17: `// user_utterance + pipeline_trace`
- Line 65-68: justification deferral comment + `justification: z.record(z.string(), z.unknown()).optional()` first variant
- Line 77: same shape at second variant

**Phase A discovery grade resolution**: cycle-close §10.4 line 656 cites `apps/web/src/agent/orchestrator/proposalJustification.schema.ts (or analogous) — net-new` for chunk 9 — Phase A discovery grade verifies canonical Zod schema surface is at `apps/web/src/shared/schemas/accounting/` (existing proposedMutation.schema.ts is EXTENSION target; net-new companion schema files at same canonical subdirectory). The "or analogous" framing acknowledges path uncertainty at cycle-close grade; Phase A discovery resolves at substrate-grade-grain accurate grade per Session 57 design doc §5.1 banking entry.

- [ ] **Step 10: Phase A discovery grade — list canonical Zod schema subdirectory + identify NEW companion file candidates.**

```bash
ls apps/web/src/shared/schemas/accounting/ | head -20
```

Identify existing schema files at canonical subdirectory. Verify chunk 9 NEW companion file naming candidates:
- `proposalJustification.schema.ts` — ProposalJustificationSchema with required pipeline_trace + bundle_audit_trace + preserved user_utterance
- `pipelineStageRecord.schema.ts` (or inline within proposalJustification.schema.ts) — PipelineStageRecord with stage_name + input_hash + output_hash + model + timestamp per ADR-0007 Q30 resolution
- `bundleAuditRecord.schema.ts` (or inline) — BundleAuditRecord with bundle_id + composition_at + child_proposal_ids[] + invariant_class per Sub-Q10 parallel-field + INV-AGENT-002 audit event composition

Decision adjudicated at chunk-9-brief-grade composition. Brief composition adjudicates whether 1-3 net-new files OR consolidated single file ships at chunk 9 impl grade.

- [ ] **Step 11: Phase A discovery grade — locate justification + pipeline_trace + bundle_audit_trace consumers across codebase.**

```bash
grep -rnE "justification|ProposalJustificationSchema|PipelineStageRecord|BundleAuditRecord|pipeline_trace|bundle_audit_trace" apps/web/src --include="*.ts" | head -25
```

Identify additional Logic Receipt consumer surfaces beyond proposedMutation.schema.ts. Specific consumer enumeration deferred to brief-drafting adjudication grade — partial-information item resolution fires at brief-drafting Task 2 grade.

- [ ] **Step 12: Phase A discovery grade — locate INV-AGENT-002 audit event composition substrate.**

```bash
grep -rnE "INV-AGENT-002|bundle_id|composition_at|child_proposal_ids|invariant_class" apps/web/src docs --include="*.ts" --include="*.md" 2>/dev/null | head -20
```

Verify INV-AGENT-002 audit event composition framing — BundleAuditRecord field shape derivation source. Partial-information per cycle-close §7.6 line 433: "BundleAuditRecord field shape (bundle_id + composition_at + child_proposal_ids[] + invariant_class per INV-AGENT-002 audit event composition; specific shape at chunk-impl grade)."

- [ ] **Step 13: List ADR canonical directory + verify chunk 9 referenced ADR paths.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference against:
- `0007-three-tier-agent-architecture.md` (Q30 resolution + §Tier 2 item 5 — Layer 2 item #B amendment target)
- `0011-document-platform.md` (§10 commentary expansion if applicable; consumer-only at chunk 9 grade)
- `0014-tier-2-document-pipeline.md` (Sub-Q21 Option 21.δ consumer-ADR naming §X if applicable; chunk-impl substrate-amendment-pairing deferred grade)

Per cycle-close §6.4: Layer 2 item #B paired with chunk 9 substrate-grade Zod codification (or retrospective Commit A grade per per-item adjudication). **This is the ONE Layer 2 item paired with chunk 9** (substantively distinct from chunk 8 zero-Layer-2-amendment shape; closer to chunk 7 Layer 2 item #A paired shape).

Preemptive substrate path verification at session-onset N=10 → N=11 confirming-fire candidate if all paths verify clean (per Session 57 Phase A Step 1+2+3 foreground+background discharge at unconditional-discharge-close grade — split-discharge sub-grain (b) N=2 cumulative confirming-fire MATERIALIZED per Session 56 + 57 inheritance).

- [ ] **Step 14: Verify apps/web/tests/integration/services/ NON-existence at Phase A grade.**

```bash
ls apps/web/tests/integration/services/ 2>/dev/null && echo "EXISTS" || echo "DOES NOT EXIST (expected; chunks 7-8 impl deferred)"
```

Expected: `DOES NOT EXIST` per chunks 7-8 impl deferred state (chunks 7-8 brief shipped at Sessions 55-56; impl deferred to Sessions 59+ per §9.5 brief-then-impl sequencing). Chunk 9 inherits subdirectory inheritance framing at brief-grade documentation (NOT subdirectory creation).

- [ ] **Step 15: Phase A discovery grade — verify types.ts generated surface inheritance.**

```bash
ls apps/web/src/db/types.ts 2>&1
grep -nE "justification|pipeline_trace|bundle_audit_trace" apps/web/src/db/types.ts 2>&1 | head -10
```

Verify whether ProposalJustificationSchema codification surfaces at generated types.ts grade. Per cycle-close §10.4 reading: "schema change, type-regeneration, and Logic Receipt consumer" cite at line 424 implies types.ts regeneration is part of chunk 9 substrate-pair impl grade. Brief documents type-regeneration surface at substrate-touchpoint grade if applicable.

- [ ] **Step 16: HALT-and-surface gate at conditional-discharge close grade.**

If any of Steps 1-15 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression, proposedMutation.schema.ts structural divergence from Phase A verified surface state, Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution outcome differs from Session 57 design doc framing, NUMERICAL-COUNT drift at any cited count vs canonical-source-artifact state), HALT and surface to founder before Task 2 dispatch fires.

Per substrate-evidence-propagation-gap discipline N=5 confirming-fire MET + sub-grain catalog at PATH-grade four-depth + NUMERICAL-COUNT-grade sub-grain (e) MATERIALIZED + remediation discipline N=2 confirming-fire MET + sub-grain (iv) pre-commit-inline-edit remediation N=2 cumulative confirming-fire MATERIALIZED inheritance: material divergence fires correction-commit-at-source per remediation discipline.

---

## Task 2: Dispatch subagent for chunk 9 brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md`

- [ ] **Step 1: Compose comprehensive subagent briefing with briefing-grade anti-drift discipline at composition START at BOTH PATH-citation + NUMERICAL-COUNT grade.**

Per Sessions 52-56 chunks 3 + 4 + 5+6 + 7 + 8 brief composition precedent (subagent-composition-grade anti-drift discipline via explicit briefing sub-grain (a) N=5 cumulative confirming-fire MATERIALIZED inheritance): briefing EXPLICITLY enumerates ALL paths referenced (canonical ADR paths + canonical code substrate paths + Session 57 design doc canonical filename `e5bd188` + Session 57 plan doc canonical filename + chunk 9 brief canonical filename) AND EXPLICITLY enumerates ALL numerical-count substrate values per Session 56 Finding A Observation 2 sub-grain (e) avoidance discipline (NOT relying on prior-session-count inheritance OR cycle-close-citation inheritance without verify-from-disk numerical-count verification).

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 8 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` (590 LOC) as PRIMARY single-chunk-brief precedent + chunk 7 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (684 LOC) as Layer 2-paired substrate-pair shape inheritance source + chunk 4 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (620 LOC) as §-structure template confirmation source. Match §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape.

(b) **Chunk 9 substantive scope (framing #5 Logic Receipt consumer per cycle-close §5.1 + §5.3 + §7.6 + §10.4)**: FIVE substantive surfaces per Session 57 design doc §5.1 + Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution:

- **Surface 1: `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts` EXTENSION** at lines 65-68 + 77 — replace permissive `z.record(z.string(), z.unknown()).optional()` with formal `ProposalJustificationSchema` import + use. File currently 81 LOC; chunk 9 modifies 2 variant locations. **Phase A discovery: this is the canonical surface, NOT the `apps/web/src/agent/orchestrator/proposalJustification.schema.ts` cited in cycle-close §10.4 line 656 (which is "or analogous" framing — `or analogous` resolves to `apps/web/src/shared/schemas/accounting/`)**.

- **Surface 2: NEW companion Zod schema file(s) at `apps/web/src/shared/schemas/accounting/`** — 1-3 net-new files per substrate-pair shape adjudication:
  - `proposalJustification.schema.ts` — `ProposalJustificationSchema` with REQUIRED `pipeline_trace: PipelineStageRecord[]` + `bundle_audit_trace: BundleAuditRecord[]` + preserved `user_utterance` fields per ADR-0007 Q30 resolution lines 482-489 + Sub-Q2 + Sub-Q10 lock framings
  - `pipelineStageRecord.schema.ts` (OR inline within proposalJustification.schema.ts) — `PipelineStageRecord` with `stage_name`, `input_hash`, `output_hash`, `model`, `timestamp` per ADR-0007 lines 482-489
  - `bundleAuditRecord.schema.ts` (OR inline) — `BundleAuditRecord` with `bundle_id`, `composition_at`, `child_proposal_ids[]`, `invariant_class` per Sub-Q10 parallel-field + INV-AGENT-002 audit event composition (partial-information per cycle-close §7.6 line 433: "specific shape at chunk-impl grade")
  
  Brief composition adjudicates file decomposition (1 file vs 2 files vs 3 files) at substrate-grade-grain accurate grade based on canonical subdirectory inspection at Task 1 Phase A grade Step 10.

- **Surface 3: ADR-0007 Q30 → §Tier 2 item 5 Layer 2 item #B ADR amendment** paired with chunk 9 substrate-grade Zod codification per Sub-Q9 substrate-grade-first lock OR retrospective Commit A grade per per-item adjudication. The amendment formalizes parallel `bundle_audit_trace` field per Sub-Q10 lock. **This is the ONE Layer 2 item paired with chunk 9** (substantively distinct from chunk 8 zero-Layer-2-amendment shape; closer to chunk 7 Layer 2 item #A paired shape).

- **Surface 4: Phase 7 chunk 7.3b permissive substrate inheritance retroactive formalization** — Phase 7 chunk 7.3b deferred ProposalJustificationSchema formalization with permissive `z.record(z.unknown()).optional()` placeholder; chunk 9 retroactively-formalizes per cycle-close §7.6 substrate-load expectation. Comment block at proposedMutation.schema.ts lines 12-18 (header) + lines 65-68 + 77 (per-variant) currently documents the deferral; chunk 9 impl updates these comments to reflect resolution (deferral → resolved at chunk 9 substrate-pair grade).

- **Surface 5: `apps/web/tests/integration/services/` subdirectory inheritance from chunks 7-8 impl** — NOT created at chunk 9 grade. Chunks 7-8 impl creates first at impl-grade. Chunk 9 inherits subdirectory presence at impl-grade (test substrate ownership at chunks 7-8-9 shared grade per Sub-Q18 canonical path discipline; testing.md Candidate #8 three-surface extension).

(c) **What chunk 9 does NOT ship** (deferred per cycle-close §6.4 ADR amendment ratification sequencing + §9.5 brief-then-impl sequencing):

- Chunk 9 implementation substrate: deferred to canonical §9.5 sequencing at Sessions 59+ grade.
- ADR amendment at chunk 9 substrate-grade-pair: ONLY Layer 2 item #B per cycle-close §6.4 (Layer 2 items A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1). Brief documents Layer 2 item #B paired substrate-pair shape at §2 explicitly (mirrors chunk 7 Layer 2 item #A paired shape; substantively distinct from chunk 8 zero-Layer-2-amendment shape).
- Chunk 10 substrate (framing #7 system_actor widening at withInvariants): deferred to Session 58 per cycle-close §7.7.
- Bill domain ActionNames + payment.record ActionName (chunk 8 shipped): unchanged.
- Subdirectory creation at `apps/web/tests/integration/services/` (chunks 7-8 impl creates).
- ADR-0011 §10 + ADR-0014 §X consumer-ADR naming: deferred per Sub-Q21 framework (chunk-impl substrate-amendment-pairing) UNLESS Layer 2 item #B amendment surfaces necessity at brief-grade adjudication.

(d) **Verified-correct substrate citations** (preemptive against substrate-evidence-propagation-gap discipline at PATH-citation grade four-depth sub-grain (a/b/c/d) + NUMERICAL-COUNT grade sub-grain (e) MATERIALIZED inheritance):

PATH-citation grade (verified at Task 1 Phase A grade):
- ADR-0007: `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (Q30 resolution at lines 482-489)
- ADR-0011: `docs/07_governance/adr/0011-document-platform.md` (§10 commentary expansion if applicable; consumer-only)
- ADR-0014: `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (Sub-Q21 Option 21.δ consumer-ADR naming if applicable)
- proposedMutation.schema.ts: `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts` (existing; 81 LOC; chunk 9 EXTENSION target at lines 65-68 + 77)
- NEW companion Zod files: `apps/web/src/shared/schemas/accounting/proposalJustification.schema.ts` (net-new) + optionally `pipelineStageRecord.schema.ts` + `bundleAuditRecord.schema.ts` (or inline)
- Chunk 9 brief: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` (this brief; net-new at composition grade)
- Session 57 design doc: `docs/09_briefs/phase-8/2026-05-21-session-57-disposition-design.md` (canonical filename `e5bd188`)
- Session 57 plan doc: `docs/09_briefs/phase-8/2026-05-21-session-57-chunk-9-brief-drafting-plan.md` (canonical filename)
- Predecessor chunk briefs: chunk 8 `2cd394a` + chunk 7 `aba5fe7` + chunk 4 `a2c20fa`

NUMERICAL-COUNT grade (preempt sub-grain (e) drift per Session 56 N=1 first-instance inheritance):
- proposedMutation.schema.ts LOC: **81 LOC** (verified at Phase A grade)
- chunk 8 brief LOC: **590** (verified at Session 56 close)
- chunk 7 brief LOC: **684** (verified at Session 55 close)
- chunk 4 brief LOC: **620** (verified at Session 53 close)
- Phase 8 chunk count: **10 chunks total**; **9 of 10 briefs shipped post-this-commit** (was 8 of 10 at Session 56 close)
- Layer 2 items: **4 total** (A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1); **2 shipped substrate-paired** (chunk 1 + chunk 7) post-this-commit; **chunk 9 is 3rd Layer 2-paired chunk-brief** at substrate-pair shape grade
- Commits-ahead at Session 57 onset: **27**; post-design `e5bd188`: **28**; post-plan: **29**; post-chunk-9-brief: **30**

DO NOT cite paths or numerical counts via commit-SHA inference OR session-context inference. EVERY path + EVERY numerical-count enumerated above at canonical-source-artifact grade per sub-grain (a) + (e) discipline MATERIALIZED inheritance.

(e) **Path C invocation evaluation at brief-grade**: Sub-Q2 + Sub-Q9 + Sub-Q10 locks at scope-lock cycle Round 2+3 pre-decomposed framing #5 into single chunk (chunk 9) at single-consumer-minimum framing. **NO-SPLIT outcome forecast** at brief-grade — chunk 9 FIVE substantive surfaces cohere at single-chunk-impl-bound grade per substrate-pair shape:

- Surfaces 1+2+3+4 share substrate-amendment-pairing per Layer 2 item #B grade (ADR-0007 amendment + ProposalJustificationSchema codification + proposedMutation.schema.ts extension + Phase 7 chunk 7.3b retroactive formalization are co-ratified at chunk 9 substrate-grade ship)
- Surface 5 (subdirectory inheritance) is test substrate ownership at chunks 7-8-9 shared grade
- ~210-320 LOC substrate Zod codification scope per §7.6 forecast + Logic Receipt consumer surface scope per brief-drafting adjudication is well-bounded at single-chunk-impl-bound grade

F-J-14 Grain 1 prospective NO-SPLIT outcome: **N=8 → N=9 cumulative confirming-fire** (Phase 8 chunks 1+2+3+4+5+6+7+8+9 prospective NO-SPLIT — 9 consecutive).

(f) **Forecast band**: Sub-curve (a) substantively-new-phase ~590-640 LOC band-center per Phase 5.1 chunk 5.1a 605 + Phase 6.5 chunk 1 623 + Phase 7 chunk 7.1 592 + Phase 8 chunk 2 592 + Phase 8 chunk 3 597 + Phase 8 chunk 4 620 + Phase 8 chunk 7 684 + Phase 8 chunk 8 590 anchor inheritance.

Sub-curve (a) calibration **N=7 → N=8 cumulative confirming-fire candidate** at Session 57 chunk 9 brief LOC outcome.

**Sub-curve (a) banking-surface-density variant consideration** per Session 55 Finding B inheritance + Session 56 design doc §5.3 + Session 57 design doc §5.3 distinction: chunk 7 brief at 684 LOC reflected high banking surface density (8+ NEW first-instance candidates); chunk 8 brief at 590 LOC reflected moderate banking surface density (2 NEW first-instance candidates) at lower bound. Chunk 9 anticipated at moderate banking surface density (2-4 NEW first-instance candidates including Phase A discovery grade canonical-path INCORRECTNESS sub-pattern) — sub-curve (a) calibration forecast: **~590-640 LOC band-center** if moderate banking surface density grade fires.

Distinction at LOC band grade: cycle-close §7.6 "~210-320 LOC" is the **substrate Zod codification LOC band** (Layer 1 item #2 substrate scope at impl-grade); brief LOC forecast at ~590-640 LOC band-center is the **brief-grade LOC band** at sub-curve (a) substantively-new-phase calibration grade.

(g) **§1.2 session-onset divergence absorption for chunk 9** (three subsections):

- **(α) Session 57 Candidate (a) ratification**: Path B continuation + chunk 9 single-chunk brief-drafting at framing #5 Logic Receipt consumer ratified via `/superpowers:brainstorming` skill workflow at Session 57 design doc commit `e5bd188`. Sequential brief-drafting cycle continuation from Sessions 51+52+53+54+55+56. **PENULTIMATE brief-drafting cycle session** — only chunk 10 remains at Session 58 grade to TERMINAL CLOSE. Banking: sequential-brief-drafting N=5 → N=6 cumulative confirming-fire MATERIALIZING (Sessions 52+53+54+55+56+57; hypothesis canonically confirmed trajectory grade) + Path B disposition selection N=5 → N=6.

- **(β) Phase A execution shape sub-pattern at split-discharge grade sub-grain (b) N=2 cumulative confirming-fire MATERIALIZED** per Session 57 Phase A unconditional-discharge ratification grade. Session 56 N=1 first-instance + Session 57 N=2 cumulative confirming-fire at substantive operational shape grade. Sub-pattern stability observation N=1 first-instance candidate per identical operational shape across Sessions 56 + 57. Codification graduation candidacy approaches N=3 promotion-threshold-MET candidacy at Session 58 fire grade if split-discharge continues.

- **(γ) Cycle-close §10.4 canonical-path INCORRECTNESS sub-pattern N=1 first-instance candidate** at Phase A discovery grade — sibling pattern to Sessions 55 + 56 UNDERCOUNT sub-pattern at N=2 cumulative confirming-fire. §10.4 line 656 cites `apps/web/src/agent/orchestrator/proposalJustification.schema.ts (or analogous)`; Phase A discovery resolves canonical path at `apps/web/src/shared/schemas/accounting/` (existing proposedMutation.schema.ts is EXTENSION target). Substrate citation accuracy sub-pattern catalog evolves at multi-grade depth: UNDERCOUNT (count gap) + INCORRECTNESS (path gap).

(h) **§6 carry-forward observation banking surface inheritance** from Session 56 close + Session 57 design doc §6 banking implications:

**Twelve N+1 cumulative confirming-fire firings at Session 57** (Phase 8 retro Commit A grade routing):

1. Sequential-brief-drafting N=5 → N=6 (hypothesis canonically confirmed trajectory)
2. Subagent-composition-grade anti-drift via explicit briefing sub-grain (a) N=5 → N=6 candidate at PATH + NUMERICAL-COUNT grade
3. Subagent-dispatch Phase 8 N=7 → N=8
4. Plan-doc + design-doc + brief-doc three-artifact composition shape N=5 → N=6
5. Sub-curve (a) calibration N=7 → N=8 candidate
6. Path B disposition selection N=5 → N=6
7. Docs-authoring-plan-with-internal-subagent-dispatch skill-mandate-recommendation-inversion N=5 → N=6
8. Inline-Execution-vs-Subagent-Driven-Development N=5 → N=6
9. Brainstorming-skill-invocation-at-disposition-grade N=4 → N=5
10. Brainstorming-side disposition-grade-skip-past avoidance N=4 → N=5
11. Phase A execution shape sub-pattern at split-discharge grade sub-grain (b) N=2 cumulative confirming-fire MATERIALIZED
12. Preemptive substrate path verification at session-onset N=9 → N=10 (Sessions 48-57; hypothesis canonically-and-strongly confirmed trajectory)

**TWO NEW first-instance sub-pattern candidates at Session 57 grade**:
- Cycle-close §10.4 enumeration grade canonical-path INCORRECTNESS sub-pattern N=1 first-instance candidate (sibling pattern to UNDERCOUNT sub-pattern at N=2 cumulative confirming-fire)
- Sub-pattern stability observation at sub-grain (b) discipline emergence grade N=1 first-instance candidate (Sessions 56 + 57 identical operational shape)

**Sessions-with-major-banking-event-firing-concurrent-N-progression sub-pattern N=3 → N=4 cumulative confirming-fire candidate** (Sessions 54+55+56+57; concurrent-pattern-count meta-progression 6→6→10→12).

**Path B sub-grain catalog at four-grain depth MATERIALIZED inheritance + multi-completion-percentage-granularity sub-grain catalog evolution**:
- Sub-grain (i): canonical Sessions 52+53+54+56+57 fire
- Sub-grain (ii): Session 55 60% cycle-complete fire
- Sub-grain (iii): Sessions 56 + 57 PARTIAL-cycle-shift ungraduated candidates at 70% + 80% completion-percentage-granularity
- Sub-grain (iv): Session 59+ canonical fire post-cycle-terminal-close at ~Session 58

**Additional banking surfaces**:
- F-J-14 Grain 1 NO-SPLIT N=8 → N=9 (Phase 8 chunks 1+2+3+4+5+6+7+8+9 prospective NO-SPLIT — 9 consecutive)
- F-J-14 Grain 1.4 sub-chunk-impl-bound vs further-SPLIT N=7 → N=8
- Substrate-evidence-propagation-gap N=5 confirming-fire MET + PATH four-depth + NUMERICAL-COUNT sub-grain (e) MATERIALIZED
- Substrate-evidence-propagation-gap remediation N=2 confirming-fire MET + four-depth + sub-grain (iv) N=2 cumulative MATERIALIZED
- Discovery-after-commit substrate-stability N=3 maintained
- Interleaved cycle posture N=2 PRESERVED ungraduated
- Coordination warning N=26 → N=29 (3-commit close: design + plan + chunk 9 brief)
- Directive-grade self-correction N=11 → N=12
- F-J-14 Grain 0 N=12 → N=13; walk-order N=12 → N=13; Refinement #3 N=12 → N=13
- Brief-drafting metafact-assertion grain N=7 → N=8

(i) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct + numerical-count citations verified-correct via post-composition spot-check. Briefing-grade anti-drift means subagent ALSO verifies ADR paths + canonical code substrate paths + numerical-count substrate values via filesystem reads BEFORE citing in brief composition (preventive at composition-input surface at BOTH PATH-citation + NUMERICAL-COUNT grade).

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunk 9 brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md | head -40
```

Expected:
- LOC in 590-640 band (sub-curve (a) calibration N=8 cumulative confirming-fire candidate at moderate banking surface density grade) OR 640-720 band (banking-surface-density variant if high)
- §1-§6 + §1.1-§1.4 + §6.x sub-section structure consistent with chunk 8 + chunk 7 + chunk 4 brief template

Read first 50 lines of `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` to confirm header matter (Date, Phase, Chunk, Path C disposition, Status, Session shape, Predecessor, Baseline, Sub-curve grade) + §1 Preamble structure.

---

## Task 3: Post-composition ADR-path + substrate-path + numerical-count spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: Enumerate substrate path citations.**

```bash
grep -nE "proposedMutation|proposalJustification|pipelineStageRecord|bundleAuditRecord|tests/integration/services|shared/schemas/accounting|agent/orchestrator/proposalJustification" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md | head -30
```

Cross-reference against Phase A grade verified paths. Each substrate path citation in the brief must match canonical path verified at Phase A grade.

**Special path-drift checks at Session 57 grade**:
- `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts` is canonical (single source per Phase A Step 9); ALL `proposedMutation` citations must be at this canonical path.
- `apps/web/src/shared/schemas/accounting/` is canonical subdirectory for NEW companion Zod files (NOT `apps/web/src/agent/orchestrator/`); ANY citation at `apps/web/src/agent/orchestrator/proposalJustification.schema.ts` as canonical fires drift firing (this is the Session 57 cycle-close §10.4 INCORRECTNESS sub-pattern resolution at brief grade per Session 57 design doc §5.1 + §6 banking).
- NO `reconciliationService.ts` citations (Session 55 retired stale citation).

- [ ] **Step 4: Enumerate numerical-count citations + verify against canonical-source-artifact grade.**

```bash
grep -nE "\b81\b|\b590\b|\b684\b|\b620\b|\b27\b|\b28\b|\b29\b|\b30\b|\b10 chunks\b|\b9 of 10\b|Layer 2 item|chunks-ahead" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md | head -30
```

Verify numerical-count citations against:
- proposedMutation.schema.ts: 81 LOC (verified at Phase A Step 9)
- chunk 8 brief: 590 LOC
- chunk 7 brief: 684 LOC
- chunk 4 brief: 620 LOC
- commits-ahead at brief-composition grade: 28 (post-design) OR 29 (post-plan)
- chunks shipped: 9 of 10 (post-this-commit)
- Layer 2 items: 4 total; chunk 9 = 3rd Layer 2-paired chunk-brief

**Per Session 56 Finding A Observation 2 sub-grain (e) NUMERICAL-COUNT grade discipline**: ANY numerical-count citation mismatch from canonical-source-artifact grade fires drift firing. Inline-edit remediation per sub-grain (iv) pre-commit-inline-edit grade applies.

- [ ] **Step 5: If briefing-grade anti-drift held clean, expect ZERO drift firings.**

Per Sessions 52 + 53 + 54 + 55 + 56 precedent: briefing-grade anti-drift discipline at composition START preempts post-composition correction at BOTH PATH-citation grade (sub-grain (a)) + NUMERICAL-COUNT grade (sub-grain (e) per Session 56 Finding A Observation 2 inheritance).

If briefing-grade prevention holds at Session 57 grade, subagent-composition-grade anti-drift via explicit briefing **N=5 → N=6 cumulative confirming-fire MATERIALIZES** at PATH-citation + NUMERICAL-COUNT grade combined.

If ANY path drift OR numerical-count drift surfaces, fire inline-edit correction per sub-grain (iv) pre-commit-inline-edit remediation grade per Session 55 + 56 precedent inheritance — sub-grain (iv) N=2 → N=3 promotion-threshold-MET candidacy approaches at Session 57 fire grade.

Add §6.x banking entry for subagent-composition-grade drift if drift fires (briefing-grade prevention discipline failed at specific sub-grade — PATH-citation grade vs NUMERICAL-COUNT grade vs combined).

- [ ] **Step 6: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md
```

Expected: 590-640 (within sub-curve (a) substantively-new-phase forecast band at moderate banking surface density grade) OR 640-720 (banking-surface-density variant at high banking surface density). LOC observation determines sub-curve (a) calibration N=7 → N=8 cumulative confirming-fire materialization + banking-surface-density variant disambiguation.

---

## Task 4: Commit chunk 9 brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md`

- [ ] **Step 1: Stage the chunk 9 brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at chunk-9-execution-grade per per-task evidence):

```
docs(phase-8): chunk 9 brief — framing #5 Logic Receipt consumer (ProposalJustificationSchema formal Zod codification + pipeline_trace + bundle_audit_trace parallel field per Sub-Q2 + Sub-Q10 locks + Layer 2 item #B ADR-0007 Q30 → §Tier 2 item 5 amendment paired per Sub-Q9 substrate-grade-first + Phase 7 chunk 7.3b permissive substrate retroactive formalization)

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md (~590-640
LOC at substantively-new-phase chunk-brief sub-curve (a) grade per
Phase 5.1+6.5+7 + Phase 8 chunks 2+3+4+7+8 precedent inheritance).

Five substantive surfaces per cycle-close §7.6 + §10.4 + Phase A
discovery grade canonical-path INCORRECTNESS sub-pattern resolution:

Surface 1: apps/web/src/shared/schemas/accounting/proposedMutation.
schema.ts EXTENSION at lines 65-68 + 77. Replace permissive z.record
(z.string(), z.unknown()).optional() with formal Proposal
JustificationSchema import + use. File currently 81 LOC.

Surface 2: NEW companion Zod schema file(s) at apps/web/src/shared/
schemas/accounting/ — ProposalJustificationSchema + PipelineStage
Record (stage_name + input_hash + output_hash + model + timestamp
per ADR-0007 Q30 lines 482-489) + BundleAuditRecord (bundle_id +
composition_at + child_proposal_ids[] + invariant_class per Sub-Q10
parallel-field + INV-AGENT-002 audit event composition).

Surface 3: ADR-0007 Q30 → §Tier 2 item 5 Layer 2 item #B ADR
amendment paired per Sub-Q9 substrate-grade-first OR retrospective
Commit A grade. Formalizes parallel bundle_audit_trace per Sub-Q10
lock. ONE Layer 2 item paired with chunk 9 — substantively distinct
from chunk 8 zero-Layer-2-amendment shape; closer to chunk 7 Layer
2 item #A paired shape.

Surface 4: Phase 7 chunk 7.3b permissive substrate inheritance
retroactive formalization. proposedMutation.schema.ts lines 12-18
header + lines 65-68 + 77 per-variant comment block updates at
chunk 9 impl reflect resolution (deferral → resolved).

Surface 5: apps/web/tests/integration/services/ subdirectory
inheritance from chunks 7-8 impl. NOT created at chunk 9.

Phase A discovery grade canonical-path INCORRECTNESS sub-pattern
N=1 first-instance candidate: cycle-close §10.4 line 656 cites
apps/web/src/agent/orchestrator/proposalJustification.schema.ts
(or analogous) — Phase A discovery resolves canonical path at
apps/web/src/shared/schemas/accounting/. Sibling pattern to
Sessions 55+56 UNDERCOUNT sub-pattern at N=2 cumulative
confirming-fire. Substrate citation accuracy sub-pattern catalog
evolves at multi-grade depth: UNDERCOUNT (count gap) +
INCORRECTNESS (path gap).

§1.2 Divergence absorption:
(α) Session 57 Candidate (a) (Path B continuation + chunk 9
single-chunk brief-drafting at framing #5; PENULTIMATE brief-
drafting cycle session) ratified per design doc e5bd188.
(β) Phase A execution shape sub-pattern at split-discharge grade
sub-grain (b) N=2 cumulative confirming-fire MATERIALIZED per
Session 56 first-instance + Session 57 confirming-fire (sub-
pattern stability at substantive operational shape grade).
(γ) Skill-chain composition: /superpowers:brainstorming → /super
powers:writing-plans → /superpowers:executing-plans per Sessions
52+53+54+55+56+57 plan-doc + design-doc + brief-doc three-artifact
composition shape N=5 → N=6 cumulative confirming-fire.

Banking surfaces materialized at Session 57 close grade:

Twelve N+1 cumulative confirming-fire firings simultaneously:
- Sequential-brief-drafting N=5 → N=6 (hypothesis canonically
  confirmed trajectory).
- Subagent-composition-grade anti-drift sub-grain (a) N=5 → N=6
  candidate at PATH + NUMERICAL-COUNT grade.
- Subagent-dispatch N=7 → N=8.
- Three-artifact composition N=5 → N=6.
- Sub-curve (a) calibration N=7 → N=8 candidate.
- Path B disposition selection N=5 → N=6.
- Skill-mandate-recommendation-inversion N=5 → N=6.
- Inline-Execution-vs-Subagent-Driven-Development N=5 → N=6.
- Brainstorming-skill-invocation-at-disposition-grade N=4 → N=5.
- Brainstorming-side disposition-grade-skip-past avoidance N=4 →
  N=5.
- Phase A split-discharge sub-grain (b) N=2 cumulative confirming-
  fire MATERIALIZED.
- Preemptive substrate path verification N=9 → N=10 (Sessions
  48-57).

Two NEW first-instance sub-pattern candidates:
- Cycle-close §10.4 enumeration grade canonical-path INCORRECTNESS
  sub-pattern N=1 first-instance (sibling to UNDERCOUNT N=2).
- Sub-pattern stability observation at sub-grain (b) discipline
  emergence grade N=1 first-instance (identical operational shape
  Sessions 56+57).

Sessions-with-major-banking-event-firing-concurrent-N-progression
N=3 → N=4 cumulative confirming-fire candidate (concurrent-pattern-
count meta-progression 6→6→10→12).

Path B sub-grain catalog four-grain depth MATERIALIZED + multi-
completion-percentage-granularity sub-grain catalog evolution:
- Sub-grain (i) canonical fire Sessions 52+53+54+56+57.
- Sub-grain (ii) Session 55 60% cycle-complete.
- Sub-grain (iii) Sessions 56+57 PARTIAL-cycle-shift candidates at
  70%+80% completion-percentage-granularity (ungraduated;
  PRESERVED).
- Sub-grain (iv) Session 59+ canonical fire post-cycle-terminal-
  close at ~Session 58.

Additional strengthening:
- F-J-14 Grain 1 NO-SPLIT N=8 → N=9 (chunks 1+2+3+4+5+6+7+8+9 — 9
  consecutive).
- F-J-14 Grain 1.4 sub-chunk-impl-bound N=7 → N=8.
- Brief-drafting metafact-assertion grain N=7 → N=8.
- Coordination warning N=26 → N=29 (3-commit close).
- Directive-grade self-correction N=11 → N=12.
- F-J-14 Grain 0 N=12 → N=13; walk-order N=13; Refinement #3 N=13.

Phase 8 cycle status: 1 of 10 chunk-impl sessions substrate-
complete (chunk 1 at 6738e38); 9 of 10 chunk briefs shipped (chunk
1 ad47042 + chunk 2 5dc042a + chunk 3 683d5df + chunk 4 a2c20fa +
chunks 5+6 multi-chunk consolidated 0288953 + chunk 7 aba5fe7 +
chunk 8 2cd394a + chunk 9 this commit). Brief-drafting cycle
TERMINAL CLOSE 1 session away at ~Session 58 grade (chunk 10
remains).

Next operational fire: Session 58 — chunk 10 brief-drafting at
framing #7 system_actor widening at withInvariants per cycle-close
§7.7 (TERMINAL brief-drafting cycle session).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 30 commits ahead of origin/staging (was 27 at Session 56 close + 1 Session 57 design `e5bd188` + 1 Session 57 plan + 1 Session 57 chunk 9 brief = 30 at 3-commit close OR 31 at 4-commit close with correction commit). Adjust expected count to actual.

---

## Task 5: Update memory + Session 57 close summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunk_9_brief_shipped.md`
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunk 9 brief shipped topic memory file.**

Template per Sessions 51-56 chunk brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Chunk 9 FIVE substantive surfaces (proposedMutation.schema.ts EXTENSION + NEW companion Zod files + Layer 2 item #B ADR-0007 amendment + Phase 7 chunk 7.3b retroactive formalization + tests/integration/services subdirectory inheritance)
- Phase A discovery grade canonical-path INCORRECTNESS sub-pattern N=1 first-instance candidate banking
- Banking surfaces materialized at Session 57 close (TWELVE N+1 cumulative confirming-fire firings + TWO NEW first-instance candidates + Sessions-with-major-banking-event-firing-concurrent-N-progression N=4 candidate)
- Validation gate state (pnpm agent:validate 26/26 green; working tree clean post-commits)
- Next operational fire (Session 58 chunk 10 brief-drafting at framing #7 system_actor widening per cycle-close §7.7 — TERMINAL brief-drafting cycle session)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 9 of 10 chunk briefs shipped; brief-drafting cycle TERMINAL CLOSE 1 session away)

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_8_brief_shipped.md` entry. Format per project convention.

- [ ] **Step 3: Compose Session 57 close summary in conversation.**

Mirror Session 56 close summary shape. Cover:
- Three-commit Session 57 close shape (Session 57 design doc `e5bd188` + Session 57 plan + chunk 9 brief) per Sessions 52+55+56 precedent inheritance — OR four-commit Session 57 close shape if Phase A surfaces material divergence requiring correction-commit-at-source per Sessions 53+54 precedent
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (30 commits ahead of origin/staging post-Session-57 3-commit close; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized (TWELVE N+1 cumulative confirming-fire firings + TWO NEW first-instance candidates + Phase A split-discharge sub-grain (b) N=2 cumulative confirming-fire MATERIALIZED + Sessions-with-major-banking-event-firing-concurrent-N-progression N=4 candidate)
- Next operational fire (Session 58 disposition: chunk 10 brief-drafting at framing #7 system_actor widening — TERMINAL brief-drafting cycle session)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of Session 57 design doc §5 operational consequences covered by tasks (§5.1 chunk 9 five substantive surfaces + §5.2 substrate-load expectation + §5.3 forecast band + §5.4 envelope timing + §5.5 sequential brief-drafting cycle continuation at PENULTIMATE session grade)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunk 9 brief at composition close.
- [ ] **Type consistency:** All `ProposalJustificationSchema` references consistent across §2 + §3 + §4; all `PipelineStageRecord` + `BundleAuditRecord` schema names consistent; all `pipeline_trace` + `bundle_audit_trace` field name usage consistent; all `Layer 2 item #B` references consistent.
- [ ] **Path-citation drift:** All ADR-path + canonical code substrate path citations verified against Phase A grade verified paths. Special verification: `apps/web/src/shared/schemas/accounting/proposedMutation.schema.ts` (single canonical site; NOT `apps/web/src/agent/orchestrator/`); NEW companion Zod files at `apps/web/src/shared/schemas/accounting/` (NOT alternate subdirectory); NO `reconciliationService.ts` citations.
- [ ] **Numerical-count drift:** All numerical-count citations verified against canonical-source-artifact grade per Session 56 Finding A Observation 2 sub-grain (e) discipline (81 LOC proposedMutation.schema.ts; 590/684/620 anchor LOCs; commits-ahead 28 post-design / 29 post-plan / 30 post-chunk-9; chunks shipped 9 of 10).

---

## Operational Notes

**Single-subagent-per-chunk-brief dispatch shape**: Task 2 is the heaviest task at substrate-composition grade. Single-subagent dispatch with comprehensive briefing inheriting chunk 8 brief composition precedent (590 LOC most recent single-chunk-brief) + chunk 7 brief precedent (684 LOC Layer 2-paired substrate-pair shape) + chunk 4 brief precedent (620 LOC sub-curve (a) anchor) + briefing-grade anti-drift discipline at BOTH PATH-citation grade (sub-grain (a) N=5 cumulative confirming-fire MATERIALIZED) + NUMERICAL-COUNT grade (sub-grain (e) preemption discipline per Session 56 Finding A Observation 2 inheritance).

**Anti-drift discipline at every step**: substrate citations + numerical-count citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path + substrate-path + numerical-count verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=10 → N=11 cumulative confirming-fire candidate if Phase A holds clean.

**Briefing-explicitly-enumerated subset discipline at sub-grain (a) + (e) combined grade**: Per Session 55 Finding D + Session 56 Finding A Observation 2 + Session 57 design doc §3.3 discipline graduation framework inheritance: briefing at Task 2 grade EXPLICITLY enumerates ALL paths referenced (canonical ADR paths + canonical code substrate paths + Session 57 design doc `e5bd188` + Session 57 plan doc canonical filename + chunk 9 brief canonical filename) AND ALL numerical-count substrate values at canonical-source-artifact grade (NOT relying on prior-session-count inheritance OR cycle-close-citation inheritance without verify-from-disk numerical-count verification). NO commit-SHA inference OR session-context inference at briefing grade.

**Layer 2 item #B amendment paired substrate-pair shape**: Per cycle-close §6.4 Layer 2 amendment ratification sequencing: chunk 9 paired with Layer 2 item #B ADR-0007 Q30 → §Tier 2 item 5 amendment per Sub-Q9 substrate-grade-first OR retrospective Commit A grade. Brief documents Layer 2 item #B paired substrate-pair shape at §2 explicitly — substantively distinct from chunk 8 zero-Layer-2-amendment shape; closer to chunk 7 Layer 2 item #A paired shape inheritance.

**Phase A discovery grade canonical-path INCORRECTNESS sub-pattern compensation**: Per Session 56 Finding D Discovery 3 operational implication + Session 57 design doc §5.1 + §6 banking inheritance: Phase A grade fires EXPLICIT substantive surface enumeration verification at canonical-source-artifact grade BEYOND cycle-close §10.4 citation grade. §10.4 line 656 "or analogous" framing acknowledges path uncertainty at cycle-close grade; Phase A discovery resolves canonical path at substrate-grade-grain accurate grade. Brief documents resolution at §3.2 Files created + §6.x banking entry.

**Design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework**: design-doc grade specifies framing-level substantive surface enumeration + disposition adjudication + discipline firings catalog + forecast LOC; brief-drafting plan grade Task 1 Phase A verify-from-disk EXPLICITLY absorbs cycle-close §10.4 + §10.5 chunk 9 canonical surface enumeration + Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution at substrate-grade-grain accurate grade per design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation sub-pattern N=2 cumulative confirming-fire MATERIALIZED at Session 56 grade.

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade. Session 57 fires brief-drafting cycle; Grain 3 carries forward to chunk 9 impl future session at Sessions 59+ grade.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Sessions 68-70 per envelope refinement). Banks locally on staging branch at 30 commits ahead of origin/staging post-Session-57 3-commit close (was 27 at Session 56 close).

**Coordination warning posture**: Coordination warning N=26 → N=29 cumulative firing candidate at Task 4 commit grade (Sessions 43-57 cumulative; Session 57 fires 3 warnings at 3-commit close shape: design `e5bd188` + plan + chunk 9 brief). Codification graduation candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with HIGH priority.

**Phase A split-discharge sub-pattern preservation across plan execution**: Per Session 57 design doc §1 + Phase A unconditional-discharge ratification grade inheritance: Phase A sub-grain (b) split-discharge grade applied at Session 57 grade — UNCONDITIONAL substrate-readiness checks (Task 1 Steps 1-3) ALREADY discharged at session-onset BEFORE founder Candidate ratification; CONDITIONAL substrate verification (Task 1 Steps 4-16) discharges at plan-execution grade post-Candidate-ratification + post-design-doc-commit-grade. Sub-grain (b) N=1 first-instance + N=2 cumulative confirming-fire MATERIALIZED inheritance Sessions 56 + 57. N=3 promotion-threshold-MET candidacy approaches at Session 58 fire grade if split-discharge continues.

**Brief-drafting cycle TERMINAL CLOSE 1 session away**: Per cycle-close §9.5 + §7.7 inheritance: chunk 10 brief-drafting at Session 58 fires brief-drafting cycle TERMINAL CLOSE. Session 57 fires PENULTIMATE brief-drafting cycle session. Sub-grain (iv) TERMINAL-brief-drafting-cycle-shift at 100%-complete grade fires at Session 59+ canonical (post-cycle-terminal-close).

**Sub-grain (iv) pre-commit-inline-edit remediation N=2 → N=3 promotion-threshold-MET candidacy**: Per Sessions 55 + 56 sub-grain (iv) N=2 cumulative confirming-fire MATERIALIZED inheritance: Session 57 Task 3 spot-check grade may fire sub-grain (iv) N=3 candidate if path-drift OR numerical-count-drift surfaces requiring inline-edit remediation. Codification graduation candidate at Phase 8 retro Commit B grade routing per N=3 promotion-threshold-MET inheritance.
