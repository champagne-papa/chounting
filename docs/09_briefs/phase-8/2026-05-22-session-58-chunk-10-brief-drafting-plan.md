# Session 58 Phase 8 Chunk 10 Brief-Drafting Implementation Plan — TERMINAL brief-drafting cycle session

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunk 10 brief at substantively-new-phase chunk-brief sub-curve (a) grade per cycle-close §5.1 framing #7 system_actor widening at withInvariants (structural union per Sub-Q5 + Sub-Q11 locks; consumer migration from `synthCtxForCommit` substrate-shim to canonical SystemActorServiceContext per service-layer.md Candidate #11 forward-pointer; Layer 2 item #C ADR amendment paired with chunk 10 substrate-grade widening per Sub-Q9 substrate-grade-first lock OR retrospective Commit A grade). **TERMINAL brief-drafting cycle session** — Session 58 close fires brief-drafting cycle TERMINAL CLOSE at 100% complete grade per cycle-close §9.5 sequencing inheritance.

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md`. §1-§6 structure inheriting chunk 9 brief template at `470469e` (515 LOC; most recent single-chunk-brief precedent at sub-curve (a) banking-surface-density variant LOW-density grade) + chunk 7 brief template at `aba5fe7` (684 LOC; Layer 2-paired substrate-pair shape inheritance source at sub-curve (a) banking-surface-density variant HIGH-density grade) + chunk 4 brief template at `a2c20fa` (620 LOC sub-curve (a) anchor). Single-subagent dispatch per Sessions 53-57 precedent inheritance; briefing-grade anti-drift discipline at composition START at BOTH PATH-citation grade (sub-grain (a) N=6 → N=7 cumulative confirming-fire candidate) + NUMERICAL-COUNT grade (sub-grain (e) preemption discipline per Sessions 56 first-instance + 57 confirming-fire-CLEAN inheritance). ~590-640 LOC sub-curve (a) substantively-new-phase forecast band with banking-surface-density variant BIDIRECTIONAL consideration per Session 57 N=2 first-instance MATERIALIZED inheritance.

**Tech Stack:** Markdown docs authoring. No code changes. ADR-0007 §Tier 2 lines 208-235 substrate + service-layer.md Candidate #11 lines 335-466 substrate + Phase 7 chunks 7.3a + 7.3b synthCtxForRouter + synthCtxForCommit substrate-shim canonical sites + withInvariants canonical at apps/web/src/services/middleware/ + SystemActorServiceContext canonical at apps/web/src/services/middleware/serviceContext read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md` (~590-640 LOC at substantively-new-phase chunk-brief sub-curve (a) grade; banking-surface-density variant BIDIRECTIONAL consideration)

**Files to read (Phase A substrate verification per design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework + Phase A discovery grade EXPLICIT verification per Sessions 55+56+57 cycle-close §10.4 enumeration grade UNDERCOUNT sub-pattern N=3 promotion-threshold-MET MATERIALIZED inheritance):**

- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` (chunk 9 brief at `470469e`; 515 LOC sub-curve (a) banking-surface-density variant LOW-density grade; PRIMARY single-chunk-brief precedent template + Layer 2-paired substrate-pair shape inheritance source)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (chunk 7 brief at `aba5fe7`; 684 LOC sub-curve (a) banking-surface-density variant HIGH-density grade; Layer 2-paired substrate-pair shape inheritance source)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (chunk 4 brief at `a2c20fa`; 620 LOC sub-curve (a) anchor; §-structure template confirmation source)
- `docs/09_briefs/phase-8/2026-05-22-session-58-disposition-design.md` (Session 58 design doc at `70c55ab`; ratifies Candidate (a) chunk 10 single-chunk brief-drafting at framing #7 system_actor widening at withInvariants — TERMINAL brief-drafting cycle session)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 chunk 10 ↔ framing #7 + §5.3 chunk 10 acceptance criteria + §6.2 service dependencies + §6.4 Item #C + §7.7 chunk 10 brief-drafting framing at lines 437-449 + §10.4 chunk 10 code surfaces at line 657 with "or analogous" framing requiring Phase A discovery resolution)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (§Tier 2 lines 208-235: safety contract item #1 "No direct writes" + item #2 structured handoffs + item #3 re-verification + item #4 trace propagation + item #5 ProposedMutation.justification.* with pipeline_trace; Layer 2 item #C amendment target)
- `docs/04_engineering/conventions/service-layer.md` (Candidate #11 lines 335-466: consumer-side synthetic ServiceContext for system_actor orchestrator invocations discipline; substrate-shim 4-invariant pattern; N=2 cross-chunk evidence basis chunks 7.3a + 7.3b)
- `apps/web/src/services/middleware/withInvariants.ts` (93 LOC; EXTENSION target — widen signature to ServiceContext | SystemActorServiceContext structural union per Sub-Q5 + Sub-Q11 locks)
- `apps/web/src/services/middleware/serviceContext.ts` (canonical type definition module; verified at Phase A grade as canonical site for ServiceContext + SystemActorServiceContext types)
- `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` (Phase 7 chunks 7.3a + 7.3b substrate-shim canonical sites; synthCtxForRouter at line 299+333 + synthCtxForCommit at line 425 + 4 withInvariants call sites at lines 519/528/588/614)

**Files to grep (Phase A discovery — substantive surface enumeration at canonical-source-artifact grade BEYOND cycle-close §10.4 citation grade per N=3 promotion-threshold-MET compensation discipline):**

- `withInvariants` callers across `apps/web/src/`:
  ```bash
  grep -rnE "withInvariants\(" apps/web/src --include="*.ts" | head -30
  ```
- `synthCtxForRouter` + `synthCtxForCommit` consumer sites (substrate-shim canonical):
  ```bash
  grep -rnE "synthCtxForRouter|synthCtxForCommit" apps/web/src --include="*.ts"
  ```
- `SystemActorServiceContext` consumer sites (canonical type already adopted at multiple sites):
  ```bash
  grep -rnE "SystemActorServiceContext|system_actor" apps/web/src --include="*.ts" | head -30
  ```
- `ServiceContext \| SystemActorServiceContext` structural union usage (verify recordMutation.ts:144 already-shipped widening + identify additional sites):
  ```bash
  grep -rnE "ServiceContext.*\|.*SystemActorServiceContext|SystemActorServiceContext.*\|.*ServiceContext" apps/web/src --include="*.ts"
  ```
- Phase 8 chunks 7/8/9 net-new consumer enumeration (Phase A discovery grade per cycle-close §7.7 partial-information items):
  - chunk 7 substrate: `postV1ReconciliationOrchestrator.ts` (not yet shipped; deferred to Sessions 59+)
  - chunk 8 substrate: ingestDocument.ts:528+614 ActionName binding switch (not yet shipped; deferred to Sessions 59+)
  - chunk 9 substrate: ProposalJustificationSchema codification (not yet shipped; deferred to Sessions 59+)

**Files NOT created:** Chunk 10 implementation substrate (withInvariants signature widening + ingestDocument.ts consumer migration + ADR-0007 §Tier 2 Layer 2 #C amendment + service-layer.md Candidate #11 phase-out). Per Candidate (a) ratification: chunk 10 impl deferred to canonical §9.5 sequencing at Sessions 59+ grade.

---

## Task 1: Phase A — Pre-composition verify-from-disk + Phase A discovery grade EXPLICIT verification at canonical-source-artifact grade BEYOND cycle-close §10.4 enumeration

**Files:**
- Read-only verification across substrate paths above
- Phase A discovery grade EXPLICIT verification at canonical-source-artifact grade per cycle-close §10.4 UNDERCOUNT N=3 promotion-threshold-MET MATERIALIZED compensation discipline

**Phase A split-discharge sub-grain (b) discipline application** per Sessions 56+57+58 N=3 promotion-threshold-MET MATERIALIZED inheritance: UNCONDITIONAL Steps 1-3 ALREADY discharged at Session 58 onset BEFORE Candidate ratification (verified 30 commits + working tree clean + 26/26 green + 9 chunk briefs canonical). CONDITIONAL Steps 4-16 discharge at this Task 1 grade post-Candidate-ratification + post-design-doc-commit-grade.

- [ ] **Step 1 (CONDITIONAL post-design-doc): Verify commits-ahead at Session 58 plan-composition grade.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `31` (was 30 at Session 57 close + 1 new at Session 58 design doc commit `70c55ab`). If 32, plan-doc commit already fired — adjust expectations downstream. Sessions 53-57 plan template precedent expressed pre-plan-commit count; honor convention.

- [ ] **Step 2 (UNCONDITIONAL already-discharged at session-onset): Cite Phase A Step 2 background discharge.**

pnpm agent:validate 26/26 green verified at Session 58 Phase A Step 2 background discharge (background ID `b5gc80qjh`; exit 0; 5 files; 3.64s duration; preserved per Session 57 docs-only close shape). No re-discharge required at Task 1 grade unless intervening substrate-modification commits surfaced.

- [ ] **Step 3 (UNCONDITIONAL already-discharged at session-onset): Cite working tree clean state.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files.

- [ ] **Step 4: Read chunk 9 brief in full as most recent single-chunk-brief precedent.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` (515 LOC at `470469e`). Verify §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.15 banking surface enumeration shape. Chunk 9 establishes Layer 2 item #B paired substrate-pair shape + cross-domain Zod schema EXTENSION sub-pattern + sub-curve (a) banking-surface-density variant LOW-density grade; chunk 10 inherits Layer 2 item #C paired substrate-pair shape (mirrors chunk 7's #A paired + chunk 9's #B paired shape).

- [ ] **Step 5: Read chunk 7 brief as Layer 2-paired substrate-pair shape inheritance source + HIGH-density anchor.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (684 LOC at `aba5fe7`). Chunk 7 establishes Layer 2 item #A paired substrate-pair shape (ADR-0010 amendment + ExceptionReasonSchema Zod broaden + Layer 1 CHECK broaden synchronously ratified). Chunk 10 inherits Layer 2-paired substrate-pair shape but at framing #7 grade — substrate-grade signature widening (withInvariants) + Layer 2 item #C ADR-0007 §Tier 2 amendment + Phase 7 chunks 7.3a + 7.3b substrate-shim retroactive phase-out synchronously ratified.

- [ ] **Step 6: Read chunk 4 brief as sub-curve (a) anchor template confirmation.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (620 LOC at `a2c20fa`). Confirm §-structure stability — chunks 4 + 7 + 8 + 9 + 10 all single-chunk briefs at sub-curve (a) grade.

- [ ] **Step 7: Read cycle-close §5.1 + §5.3 + §6.2 + §6.4 + §7.7 + §10.4 chunk 10 framing.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`:
- §5.1 framing-pairing inventory (chunk 10 ↔ framing #7 system_actor widening at withInvariants at line 276)
- §5.3 chunk 10 acceptance criteria (line 313: withInvariants signature widening to structural union; consumer migration from synthCtxForCommit substrate-shim to canonical SystemActorServiceContext)
- §6.2 service dependencies (withInvariants Phase 1.5+ substrate → chunk 10 widening surface)
- §6.4 ADR amendment ratification sequencing Item #C (paired with chunk 10 substrate-grade widening per Sub-Q9 substrate-grade-first OR retrospective Commit A grade)
- §7.7 chunk 10 brief-drafting framing (lines 437-449: scope framing #7 system_actor widening; substrate-load expectation ADR-0007 §Tier 2 lines 208-235 + Layer 2 item #C amendment + service-layer.md Candidate #11 lines 335-466 + Phase 7 chunks 7.3a + 7.3b synthCtxForRouter + synthCtxForCommit N=2 substrate-shim evidence; per-chunk forecast Layer 1 item #5 ~120-250 LOC; partial-information items consumer migration count)
- §10.4 chunk 10 code surfaces (line 657: `apps/web/src/services/withInvariants.ts (or analogous) — extension (structural union signature widening)` — "or analogous" framing requires Phase A discovery resolution per Session 58 design doc §5.1 banking)

- [ ] **Step 8: Read ADR-0007 §Tier 2 lines 208-235 safety contract.**

```bash
sed -n '208,235p' docs/07_governance/adr/0007-three-tier-agent-architecture.md
```

Verify Tier 2 safety contract inviolable items #1-#5:
- Item #1: "No direct writes" — Tier 2 stages route through Tier 1
- Item #2: Structured handoffs (Zod-validated JSON)
- Item #3: Re-verification at commit boundary
- Item #4: Trace propagation
- Item #5: ProposedMutation.justification.* with pipeline_trace per Q30

Chunk 10 Layer 2 item #C amendment formalizes structural union widening per Sub-Q5 + Sub-Q11 locks at safety contract grade.

- [ ] **Step 9: Read service-layer.md Candidate #11 lines 335-466 consumer-side substrate-shim discipline.**

```bash
sed -n '335,466p' docs/04_engineering/conventions/service-layer.md
```

Verify substrate-shim discipline:
- 4-invariant pattern (ServiceContext shape + Verified caller + org-access + Role-based authorization)
- N=2 cross-chunk evidence basis (chunks 7.3a synthCtxForRouter + 7.3b synthCtxForCommit)
- Action option omission discipline for orchestrator-driven commits
- Trigger: orchestrator authoring invoking wrapped service via withInvariants from system_actor calling context

Chunk 10 retroactive phase-out: discipline retires post-amendment; consumers pass SystemActorServiceContext directly.

- [ ] **Step 10: Phase A discovery grade — verify withInvariants canonical substrate.**

```bash
wc -l apps/web/src/services/middleware/withInvariants.ts
head -50 apps/web/src/services/middleware/withInvariants.ts
```

Expected: file at 93 LOC. Verify canonical signature shape — likely `function withInvariants<Input, Output>(serviceFn, options?)` returning a wrapped function. Identify current ServiceContext parameter typing for widening target identification.

**Phase A discovery grade resolution**: cycle-close §10.4 line 657 cites `apps/web/src/services/withInvariants.ts (or analogous) — extension` — Phase A discovery verifies canonical path at `apps/web/src/services/middleware/withInvariants.ts` (NOT services/ root subdirectory; canonical at middleware/ subdirectory). The "or analogous" framing acknowledges path uncertainty at cycle-close grade; Phase A discovery resolves at substrate-grade-grain accurate grade per Session 58 design doc §5.1 + §6 banking entry.

- [ ] **Step 11: Phase A discovery grade — verify serviceContext canonical type definitions.**

```bash
wc -l apps/web/src/services/middleware/serviceContext.ts
grep -nE "type ServiceContext|type SystemActorServiceContext|interface ServiceContext|interface SystemActorServiceContext|VerifiedCaller" apps/web/src/services/middleware/serviceContext.ts | head -10
```

Identify canonical ServiceContext + SystemActorServiceContext type definitions. Verify shape disambiguation:
- ServiceContext: `caller: VerifiedCaller` with `user_id: string` + `email: string` + `verified: true` + `org_ids: string[]`
- SystemActorServiceContext: `caller: { user_id: null, system_actor: string }` + `org_id: string`

Chunk 10 widening target: withInvariants accepts `ServiceContext | SystemActorServiceContext` discriminated union (or structural union per Sub-Q5 + Sub-Q11 lock framing).

- [ ] **Step 12: Phase A discovery grade — enumerate withInvariants callers across codebase.**

```bash
grep -rnE "withInvariants\(" apps/web/src --include="*.ts" | head -30
```

Expected: extensive caller sites at app/api routes + agent/orchestrator paths. Specific call sites at ingestDocument.ts:519+528+588+614 (verified at Session 56 chunk 8 work) + app/api/orgs/* route handlers.

**Phase A discovery grade EXPLICIT verification**: identify ALL withInvariants callers from system_actor calling context — these are the consumer migration target sites at chunk 10 grade. Phase 7 chunks 7.3a + 7.3b shipped 2 substrate-shim sites (synthCtxForRouter + synthCtxForCommit); chunks 7+8+9 impl substrate (deferred to Sessions 59+) may add additional consumers; Phase 8 chunk 7 impl post-v1 reconciliation orchestrator + chunk 8 ingestDocument.ts ActionName binding switch + chunk 9 Logic Receipt consumer surface may surface additional substrate-shim sites OR may directly adopt SystemActorServiceContext post-chunk-10 widening.

- [ ] **Step 13: Phase A discovery grade — verify synthCtxForRouter + synthCtxForCommit consumer sites.**

```bash
grep -rnE "synthCtxForRouter|synthCtxForCommit" apps/web/src --include="*.ts"
```

Expected: synthCtxForRouter at ingestDocument.ts:299 + 333; synthCtxForCommit at ingestDocument.ts:412+414+420+425. N=2 substrate-shim sites per Phase 7 chunks 7.3a + 7.3b inheritance.

Chunk 10 consumer migration target: eliminate both substrate-shim sites; pass SystemActorServiceContext directly post-withInvariants widening.

- [ ] **Step 14: Phase A discovery grade — verify SystemActorServiceContext partial-adoption sites.**

```bash
grep -rnE "SystemActorServiceContext\|system_actor" apps/web/src --include="*.ts" | head -30
```

Expected: MULTIPLE consumer sites ALREADY adopting SystemActorServiceContext (Phase A discovery — NOT a net-new shape):
- `apps/web/src/services/middleware/serviceContext.ts` — canonical type definition
- `apps/web/src/services/audit/recordMutation.ts:144` — signature ALREADY accepts `ServiceContext | SystemActorServiceContext` union (PARTIAL WIDENING ALREADY SHIPPED)
- `apps/web/src/agent/orchestrator/extraction/receiptExtractor.ts:12+110` — orchestrator parameter
- `apps/web/src/app/api/webhooks/postmark-inbound/route.ts` — webhook constructs directly
- `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts:30+45+70+72` — orchestrator entry constructs (then DOWNGRADES to substrate-shim for withInvariants)

Chunk 10 extends PARTIAL WIDENING (already shipped at recordMutation.ts:144) to withInvariants signature.

- [ ] **Step 15: Phase A discovery grade — enumerate existing `ServiceContext | SystemActorServiceContext` structural union sites.**

```bash
grep -rnE "ServiceContext.*\|.*SystemActorServiceContext|SystemActorServiceContext.*\|.*ServiceContext" apps/web/src --include="*.ts"
```

Identify ALL existing structural union sites — these establish the canonical pattern that chunk 10 withInvariants signature widening inherits. Brief composition adjudicates consumer enumeration at canonical pattern inheritance grade.

- [ ] **Step 16: List ADR canonical directory + verify chunk 10 referenced ADR paths.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference against:
- `0007-three-tier-agent-architecture.md` (§Tier 2 lines 208-235; Layer 2 item #C amendment target)
- Consumer-only ADRs (no chunk 10 modification at primary grade)

Preemptive substrate path verification at session-onset N=10 → N=11 cumulative confirming-fire candidate (Sessions 48-58 sustained-firing).

- [ ] **Step 17: HALT-and-surface gate at conditional-discharge close grade.**

If any of Steps 1-16 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression, withInvariants.ts structural divergence from Phase A verified surface state, Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution outcome differs from Session 58 design doc framing, NUMERICAL-COUNT drift at any cited count vs canonical-source-artifact state), HALT and surface to founder before Task 2 dispatch fires.

Per substrate-evidence-propagation-gap discipline N=5 confirming-fire MET + sub-grain catalog at PATH-grade four-depth + NUMERICAL-COUNT-grade sub-grain (e) MATERIALIZED + remediation discipline N=2 confirming-fire MET + sub-grain (iv) pre-commit-inline-edit remediation N=2 cumulative confirming-fire MATERIALIZED inheritance: material divergence fires correction-commit-at-source per remediation discipline.

---

## Task 2: Dispatch subagent for chunk 10 brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md`

- [ ] **Step 1: Compose comprehensive subagent briefing with briefing-grade anti-drift discipline at composition START at BOTH PATH-citation + NUMERICAL-COUNT grade.**

Per Sessions 52-57 brief composition precedent (subagent-composition-grade anti-drift discipline via explicit briefing sub-grain (a) + (e) combined N=6 cumulative confirming-fire MATERIALIZED CLEAN inheritance): briefing EXPLICITLY enumerates ALL paths referenced (canonical ADR paths + canonical code substrate paths + Session 58 design doc canonical filename `70c55ab` + Session 58 plan doc canonical filename + chunk 10 brief canonical filename) AND EXPLICITLY enumerates ALL numerical-count substrate values at canonical-source-artifact grade.

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 9 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-9.md` (515 LOC) as PRIMARY single-chunk-brief precedent + chunk 7 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (684 LOC) as Layer 2-paired substrate-pair shape inheritance source + chunk 4 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (620 LOC) as §-structure template confirmation source.

(b) **Chunk 10 substantive scope (framing #7 system_actor widening at withInvariants per cycle-close §5.1 + §5.3 + §7.7 + §10.4)**: FIVE substantive surfaces per Session 58 design doc §5.1 + Phase A discovery grade canonical-path INCORRECTNESS sub-pattern resolution:

- **Surface 1: `apps/web/src/services/middleware/withInvariants.ts` EXTENSION** (93 LOC; verified at Phase A grade Step 10) — widen signature to accept `ServiceContext | SystemActorServiceContext` structural union per Sub-Q5 + Sub-Q11 locks. **Phase A discovery: canonical surface at middleware/ subdirectory, NOT `apps/web/src/services/withInvariants.ts (or analogous)` cited in cycle-close §10.4 line 657.**

- **Surface 2: `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` consumer migration** at TWO substrate-shim sites:
  - `synthCtxForRouter` at line 299 + usage at line 333 — Phase 7 chunk 7.3a substrate-shim → eliminate; pass SystemActorServiceContext directly post-withInvariants widening
  - `synthCtxForCommit` at line 425 + 4 withInvariants call sites at lines 519/528/588/614 — Phase 7 chunk 7.3b substrate-shim → eliminate; pass SystemActorServiceContext directly post-widening

- **Surface 3: ADR-0007 §Tier 2 Layer 2 item #C ADR amendment** paired with chunk 10 substrate-grade widening per Sub-Q9 substrate-grade-first lock OR retrospective Commit A grade. Formalizes structural union widening per Sub-Q5 + Sub-Q11 locks at safety contract grade. **The ONE Layer 2 item paired with chunk 10** (closer to chunks 7+9 Layer 2-paired shapes than chunk 8 zero-Layer-2-amendment shape).

- **Surface 4: `docs/04_engineering/conventions/service-layer.md` Candidate #11 retroactive phase-out** at lines 335-466 — consumer-side substrate-shim discipline phases out post-amendment per cycle-close §7.7 retrospective-candidate operational-relevance: "service-layer.md Candidate #11 consumer-side substrate-shim discipline phases out post-amendment".

- **Surface 5: Phase A discovery grade additional consumer enumeration** per cycle-close §7.7 partial-information items: "consumer migration count (post-Phase-7 N=2 + Phase 8 chunk 7/8/9 net-new consumers if SystemActorServiceContext adopted at orchestrator grade)". Phase A grade verifies N=2 substrate-shim sites at ingestDocument.ts; chunks 7+8+9 impl substrate (deferred to Sessions 59+) may add additional consumers; canonical pattern at recordMutation.ts:144 PARTIAL WIDENING already-shipped serves as precedent for chunk 10 withInvariants widening.

(c) **What chunk 10 does NOT ship** (deferred per cycle-close §6.4 ADR amendment ratification sequencing + §9.5 brief-then-impl sequencing):

- Chunk 10 implementation: deferred to Sessions 59+ per §9.5 brief-then-impl sequencing.
- ADR amendment beyond Layer 2 item #C: NONE per cycle-close §6.4 (Layer 2 items A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1).
- Chunks 7/8/9 impl substrate: deferred to Sessions 59+ chunk-impl cycle onset per sub-grain (iv) TERMINAL-brief-drafting-cycle-shift canonical fire grade.
- SystemActorServiceContext as net-new type: ALREADY EXISTS at apps/web/src/services/middleware/serviceContext.ts canonical (Phase A discovery — NOT a net-new shape at chunk 10).
- recordMutation.ts:144 widening: ALREADY SHIPPED (partial widening already in place; chunk 10 extends pattern to withInvariants).

(d) **Verified-correct substrate citations** (preemptive against substrate-evidence-propagation-gap discipline at PATH-citation grade four-depth sub-grain (a/b/c/d) + NUMERICAL-COUNT grade sub-grain (e) MATERIALIZED inheritance):

PATH-citation grade (verified at Task 1 Phase A grade):
- ADR-0007: `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (§Tier 2 lines 208-235)
- service-layer.md: `docs/04_engineering/conventions/service-layer.md` (Candidate #11 lines 335-466)
- withInvariants: `apps/web/src/services/middleware/withInvariants.ts` (93 LOC; EXTENSION target)
- serviceContext: `apps/web/src/services/middleware/serviceContext.ts` (canonical type definitions)
- ingestDocument: `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` (substrate-shim sites at 299+333+425; withInvariants call sites at 519+528+588+614)
- recordMutation: `apps/web/src/services/audit/recordMutation.ts:144` (PARTIAL WIDENING precedent)
- chunk 10 brief: `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md` (this brief; net-new at composition grade)
- Session 58 design doc: `docs/09_briefs/phase-8/2026-05-22-session-58-disposition-design.md` (canonical filename `70c55ab`)
- Session 58 plan doc: `docs/09_briefs/phase-8/2026-05-22-session-58-chunk-10-brief-drafting-plan.md` (canonical filename)
- Predecessor chunk briefs: chunk 9 `470469e` + chunk 7 `aba5fe7` + chunk 4 `a2c20fa`

NUMERICAL-COUNT grade (preempt sub-grain (e) drift per Session 56 N=1 first-instance + Session 57 N=2 confirming-fire-CLEAN inheritance):
- withInvariants.ts LOC: **93 LOC** (verified at Phase A grade)
- chunk 9 brief LOC: **515** (verified at Session 57 close)
- chunk 7 brief LOC: **684** (verified at Session 55 close)
- chunk 4 brief LOC: **620** (verified at Session 53 close)
- Phase 8 chunk count: **10 chunks total**; **10 of 10 briefs shipped post-this-commit** (was 9 of 10 at Session 57 close); **TERMINAL CLOSE at 100% complete grade**
- Layer 2 items: **4 total** (A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1); **3 shipped substrate-paired** post-this-commit; **chunk 10 is 4th Layer 2-paired chunk-brief** at substrate-pair shape grade (final)
- Commits-ahead at Session 58 onset: **30**; post-design `70c55ab`: **31**; post-plan: **32**; post-chunk-10-brief: **33**
- Substrate-shim consumer sites: **N=2 canonical (synthCtxForRouter + synthCtxForCommit at ingestDocument.ts)** per Phase 7 chunks 7.3a + 7.3b inheritance

DO NOT cite paths or numerical counts via commit-SHA inference OR session-context inference. EVERY path + EVERY numerical-count enumerated above at canonical-source-artifact grade.

(e) **Path C invocation evaluation at brief-grade**: Sub-Q5 + Sub-Q9 + Sub-Q11 locks at scope-lock cycle Round 2+3 pre-decomposed framing #7 into single chunk (chunk 10). **NO-SPLIT outcome forecast** at brief-grade — chunk 10 FIVE substantive surfaces (withInvariants signature widening + ingestDocument.ts consumer migration + ADR-0007 §Tier 2 amendment + service-layer.md Candidate #11 phase-out + Phase A discovery grade additional consumer enumeration) cohere at single-chunk-impl-bound grade per substrate-pair shape.

F-J-14 Grain 1 prospective NO-SPLIT outcome: **N=9 → N=10 cumulative confirming-fire** (Phase 8 chunks 1+2+3+4+5+6+7+8+9+10 prospective NO-SPLIT — 10 consecutive at brief-drafting cycle TERMINAL CLOSE grade).

(f) **Forecast band**: Sub-curve (a) substantively-new-phase ~590-640 LOC band-center per Phase 5.1 + 6.5 + 7 + Phase 8 chunks 2 (592) + 3 (597) + 4 (620) + 7 (684) + 8 (590) + 9 (515) anchor inheritance.

Sub-curve (a) calibration **N=8 → N=9 cumulative confirming-fire candidate** at Session 58 chunk 10 brief LOC outcome.

**Sub-curve (a) banking-surface-density variant BIDIRECTIONAL consideration** per Session 57 N=2 first-instance MATERIALIZED inheritance: chunk 7 +7% above band (HIGH-density: 8+ NEW first-instance candidates) + chunk 9 -12.7% below band (LOW-density: compression-efficient at 2 NEW first-instance + Phase A discovery findings). Chunk 10 substantive surface scope: at moderate-to-high banking density grade (Layer 2 item #C amendment + service-layer.md Candidate #11 retroactive phase-out + Phase A discovery grade UNDERCOUNT sub-pattern N=4 confirming-fire candidate accumulates additional banking surface density). **Sub-curve (a) banking-surface-density variant BIDIRECTIONAL N=2 → N=3 promotion-threshold-MET candidate at Session 58 close grade IF chunk 10 brief LOC correlates with chunk 10 banking density grade.**

Distinction at LOC band grade: cycle-close §7.7 "~120-250 LOC" is the **substrate widening LOC band** (Layer 1 item #5 substrate scope at impl-grade); brief LOC forecast at ~590-640 LOC band-center is the **brief-grade LOC band** at sub-curve (a) substantively-new-phase calibration grade.

(g) **§1.2 session-onset divergence absorption for chunk 10** (three subsections):

- **(α) Session 58 Candidate (a) ratification**: Path B continuation + chunk 10 single-chunk brief-drafting at framing #7 system_actor widening at withInvariants ratified via `/superpowers:brainstorming` skill workflow at Session 58 design doc commit `70c55ab`. **TERMINAL brief-drafting cycle session** — Session 58 close fires brief-drafting cycle TERMINAL CLOSE at 100% complete grade. Sequential brief-drafting cycle continuation from Sessions 51-57. Banking: sequential-brief-drafting N=6 → N=7 (hypothesis-strongly-canonically-confirmed trajectory grade per seven-session sustained-firing across TERMINAL CLOSE).
- **(β) Phase A execution shape sub-pattern at split-discharge grade sub-grain (b) N=2 → N=3 promotion-threshold-MET MATERIALIZED** per Sessions 56 first-instance + 57 confirming-fire + 58 promotion-threshold-MET fire (verified at Phase A unconditional-discharge close grade pre-design-doc). Sub-pattern stability observation across three consecutive sessions — codification graduation candidate substantively past N=3 promotion threshold floor at Phase 8 retro Commit B grade routing.
- **(γ) Cycle-close §10.4 enumeration grade UNDERCOUNT sub-pattern N=3 → N=4 cumulative confirming-fire MATERIALIZING at Session 58 grade** per Sessions 55+56+57 N=3 promotion-threshold-MET MATERIALIZED inheritance + chunk 10 Phase A discovery grade canonical-path resolution. §10.4 line 657 cites single surface; Phase A discovery reveals 5+ surfaces. Codification graduation candidate at HIGH priority routing Phase 8 retro Commit B grade.

(h) **§6 carry-forward observation banking surface inheritance** from Session 57 close + Session 58 design doc §6 banking implications:

**TWELVE-PLUS N+1 cumulative confirming-fire firings at Session 58** (Phase 8 retro Commit A grade routing):

1. Sequential-brief-drafting N=6 → N=7 (hypothesis-strongly-canonically-confirmed trajectory per seven-session sustained-firing across TERMINAL CLOSE)
2. Subagent-composition-grade anti-drift via explicit briefing sub-grain (a) + (e) combined N=6 → N=7 candidate at PATH + NUMERICAL-COUNT grade
3. Subagent-dispatch Phase 8 N=8 → N=9
4. Plan-doc + design-doc + brief-doc three-artifact composition shape N=6 → N=7
5. Chunk-brief-drafting sub-curve (a) calibration N=8 → N=9 candidate
6. Path B disposition selection N=6 → N=7
7. Docs-authoring-plan-with-internal-subagent-dispatch skill-mandate-recommendation-inversion N=6 → N=7
8. Inline-Execution-vs-Subagent-Driven-Development N=6 → N=7
9. Brainstorming-skill-invocation-at-disposition-grade N=5 → N=6
10. Brainstorming-side disposition-grade-skip-past avoidance N=5 → N=6
11. **Phase A execution shape split-discharge sub-grain (b) N=2 → N=3 promotion-threshold-MET MATERIALIZED**
12. Preemptive substrate path verification N=10 → N=11 (Sessions 48-58)

**Codification graduation candidates substantively past N=3 promotion threshold** (Phase 8 retro Commit B grade routing):

- **Cycle-close §10.4 enumeration grade UNDERCOUNT sub-pattern N=3 → N=4 cumulative confirming-fire MATERIALIZING** (HIGH priority)
- **Sessions-with-major-banking-event-firing-concurrent-N-progression sub-pattern N=4 → N=5 cumulative confirming-fire candidate** (concurrent-pattern-count meta-progression 6→6→10→12→12+; sustained accumulation not plateauing meta-pattern grade)

**TWO NEW first-instance sub-pattern candidates at Session 58 grade**:
- **Brief-drafting cycle TERMINAL CLOSE materialization sub-pattern N=1 first-instance candidate** (Session 58 close at 100% complete grade per Phase 8 cycle progression)
- **Sub-pattern stability observation at sub-grain (b) discipline emergence grade N=1 → N=2 cumulative confirming-fire candidate** (Sessions 56+57+58 identical operational shape across three consecutive sessions)

**Path B sub-grain catalog at four-grain depth MATERIALIZED + multi-completion-percentage-granularity THREE-grade depth**:
- Sub-grain (i): canonical Sessions 52+53+54+56+57+58 fire under Candidate (a)
- Sub-grain (ii): Session 55 60% cycle-complete
- Sub-grain (iii): Sessions 56 70% + 57 80% + 58 90% PARTIAL-cycle-shift ungraduated; PRESERVED through TERMINAL grade
- Sub-grain (iv): **Session 59+ canonical fire** post-cycle-terminal-close

**Additional banking surfaces**:
- F-J-14 Grain 1 NO-SPLIT N=9 → N=10 (10 consecutive at TERMINAL CLOSE grade)
- F-J-14 Grain 1.4 sub-chunk-impl-bound N=8 → N=9
- Substrate-evidence-propagation-gap N=5 confirming-fire MET + PATH-grade four-depth + NUMERICAL-COUNT-grade sub-grain (e) MATERIALIZED
- Substrate-evidence-propagation-gap remediation N=2 confirming-fire MET + sub-grain (iv) N=2 cumulative MATERIALIZED
- Discovery-after-commit substrate-stability N=3 maintained
- Coordination warning N=29 → N=32 (3-commit close)
- Directive-grade self-correction N=12 → N=13
- F-J-14 Grain 0 N=13 → N=14; walk-order N=13 → N=14; Refinement #3 N=13 → N=14
- Brief-drafting metafact-assertion grain N=7 → N=8
- Discipline-emergence-trajectory sub-pattern N=2 cumulative MATERIALIZED inheritance
- Cross-domain Zod schema EXTENSION sub-pattern N=1 first-instance MATERIALIZED inheritance from Session 57

(i) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct + numerical-count citations verified-correct via post-composition spot-check. Briefing-grade anti-drift means subagent ALSO verifies ADR paths + canonical code substrate paths + numerical-count substrate values via filesystem reads BEFORE citing in brief composition.

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunk 10 brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md | head -40
```

Expected:
- LOC in 590-640 band (sub-curve (a) calibration N=9 cumulative confirming-fire candidate at moderate banking surface density grade) OR 640-720 band (banking-surface-density variant HIGH-density) OR 480-590 band (banking-surface-density variant LOW-density)
- §1-§6 + §1.1-§1.4 + §6.x sub-section structure consistent with chunk 9 + chunk 7 + chunk 4 brief template

---

## Task 3: Post-composition ADR-path + substrate-path + numerical-count spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: Enumerate substrate path citations.**

```bash
grep -nE "withInvariants|serviceContext|SystemActorServiceContext|ingestDocument|synthCtxForRouter|synthCtxForCommit|recordMutation|service-layer.md|services/middleware|services/withInvariants" docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md | head -30
```

**Special path-drift checks at Session 58 grade**:
- `apps/web/src/services/middleware/withInvariants.ts` is canonical (single source per Phase A Step 10); ANY citation at `apps/web/src/services/withInvariants.ts` (without middleware/ subdirectory) fires drift firing per Phase A discovery resolution
- `apps/web/src/services/middleware/serviceContext.ts` is canonical type definition module
- `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` for substrate-shim sites
- NO `reconciliationService.ts` citations (Session 55 retired)

- [ ] **Step 4: Enumerate numerical-count citations + verify against canonical-source-artifact grade.**

```bash
grep -nE "\b93\b|\b515\b|\b684\b|\b620\b|\b30\b|\b31\b|\b32\b|\b33\b|10 chunks|10 of 10|Layer 2 item" docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md | head -30
```

Verify numerical-count citations against:
- withInvariants.ts: 93 LOC (verified at Phase A Step 10)
- chunk 9 brief: 515 LOC; chunk 7 brief: 684 LOC; chunk 4 brief: 620 LOC
- commits-ahead at brief-composition grade: 31 (post-design) OR 32 (post-plan)
- chunks shipped: 10 of 10 (post-this-commit; TERMINAL CLOSE)
- Layer 2 items: 4 total; chunk 10 = 4th Layer 2-paired chunk-brief (final)

**Per Session 56 Finding A Observation 2 sub-grain (e) NUMERICAL-COUNT grade discipline**: ANY numerical-count citation mismatch from canonical-source-artifact grade fires drift firing. Inline-edit remediation per sub-grain (iv) pre-commit-inline-edit grade applies.

- [ ] **Step 5: If briefing-grade anti-drift held clean, expect ZERO drift firings.**

Per Sessions 52-57 precedent: briefing-grade anti-drift discipline at composition START preempts post-composition correction at BOTH PATH-citation grade (sub-grain (a)) + NUMERICAL-COUNT grade (sub-grain (e) per Session 57 N=2 confirming-fire CLEAN inheritance).

If briefing-grade prevention holds at Session 58 grade, subagent-composition-grade anti-drift via explicit briefing **N=6 → N=7 cumulative confirming-fire MATERIALIZES** at PATH-citation + NUMERICAL-COUNT grade combined.

If ANY path drift OR numerical-count drift surfaces, fire inline-edit correction per sub-grain (iv) pre-commit-inline-edit remediation grade. Sub-grain (iv) N=2 → N=3 promotion-threshold-MET candidacy approaches at Session 58 fire grade.

- [ ] **Step 6: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md
```

Expected: 590-640 (sub-curve (a) substantively-new-phase forecast band at moderate banking surface density) OR 640-720 (banking-surface-density variant HIGH-density) OR 480-590 (banking-surface-density variant LOW-density). LOC observation determines sub-curve (a) calibration N=8 → N=9 cumulative confirming-fire materialization + banking-surface-density variant BIDIRECTIONAL N=2 → N=3 promotion-threshold-MET candidate disambiguation.

---

## Task 4: Commit chunk 10 brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md`

- [ ] **Step 1: Stage the chunk 10 brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at chunk-10-execution-grade per per-task evidence):

```
docs(phase-8): chunk 10 brief — framing #7 system_actor widening at withInvariants (structural union ServiceContext | SystemActorServiceContext per Sub-Q5 + Sub-Q11 locks + consumer migration from synthCtxForRouter + synthCtxForCommit substrate-shim to canonical SystemActorServiceContext + Layer 2 item #C ADR-0007 §Tier 2 amendment paired per Sub-Q9 substrate-grade-first + service-layer.md Candidate #11 retroactive phase-out) — TERMINAL brief-drafting cycle session

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-22-phase-8-chunk-10.md (~590-640
LOC at substantively-new-phase chunk-brief sub-curve (a) grade per
Phase 5.1+6.5+7 + Phase 8 chunks 2+3+4+7+8+9 precedent inheritance).

FIVE substantive surfaces per cycle-close §7.7 + §10.4 + Phase A
discovery grade scope refinement:

Surface 1: apps/web/src/services/middleware/withInvariants.ts
EXTENSION (93 LOC; widen signature to ServiceContext |
SystemActorServiceContext structural union per Sub-Q5 + Sub-Q11
locks).

Surface 2: apps/web/src/agent/orchestrator/extraction/ingestDocument.ts
consumer migration at TWO substrate-shim sites — synthCtxForRouter
at line 299+333 (Phase 7 chunk 7.3a substrate-shim) + synthCtxForCommit
at line 425 + 4 withInvariants call sites at 519/528/588/614 (Phase 7
chunk 7.3b substrate-shim) → eliminate; pass SystemActorServiceContext
directly post-widening.

Surface 3: ADR-0007 §Tier 2 lines 208-235 Layer 2 item #C ADR
amendment paired per Sub-Q9 substrate-grade-first OR retrospective
Commit A. Formalizes structural union widening per Sub-Q5 + Sub-Q11
locks at safety contract grade.

Surface 4: docs/04_engineering/conventions/service-layer.md
Candidate #11 retroactive phase-out at lines 335-466 (consumer-side
substrate-shim discipline phases out post-amendment).

Surface 5: Phase A discovery grade additional consumer enumeration
(post-Phase-7 N=2 substrate-shim sites + Phase 8 chunks 7/8/9
net-new consumers deferred to Sessions 59+; canonical pattern at
recordMutation.ts:144 PARTIAL WIDENING already-shipped precedent).

Phase A discovery grade canonical-path resolution: cycle-close §10.4
line 657 cites apps/web/src/services/withInvariants.ts (or analogous)
— Phase A discovery resolves canonical path at apps/web/src/services/
middleware/withInvariants.ts. Cycle-close §10.4 enumeration grade
UNDERCOUNT sub-pattern N=3 → N=4 cumulative confirming-fire
MATERIALIZING at Session 58 grade — codification graduation candidate
substantively past N=3 promotion threshold at HIGH priority routing
Phase 8 retro Commit B grade.

SystemActorServiceContext canonical substrate verified at MULTIPLE
existing consumer sites (Phase A discovery — NOT a net-new shape):
- recordMutation.ts:144 signature ALREADY accepts ServiceContext |
  SystemActorServiceContext union (PARTIAL WIDENING SHIPPED)
- receiptExtractor.ts:12+110 orchestrator parameter
- postmark-inbound/route.ts webhook constructs directly
- ingestDocument.ts:30+45+70+72 orchestrator entry constructs

§1.2 Divergence absorption:
(α) Session 58 Candidate (a) (Path B continuation + chunk 10 single-
chunk brief-drafting at framing #7 — TERMINAL brief-drafting cycle
session) ratified per design doc 70c55ab.
(β) Phase A execution shape sub-pattern at split-discharge grade
sub-grain (b) N=2 → N=3 promotion-threshold-MET MATERIALIZED
(Sessions 56 first-instance + 57 confirming-fire + 58 promotion-
threshold-MET fire; codification graduation candidate substantively
past N=3 floor).
(γ) Cycle-close §10.4 enumeration grade UNDERCOUNT sub-pattern N=3
→ N=4 cumulative confirming-fire MATERIALIZING (Sessions 55+56+57+58
multi-grade depth: substantive surface depth + count + canonical-
path INCORRECTNESS + chunk 10 multi-surface depth gap).

Banking surfaces materialized at Session 58 close grade:

TWELVE-PLUS N+1 cumulative confirming-fire firings simultaneously:
- Sequential-brief-drafting N=6 → N=7 (hypothesis-strongly-
  canonically-confirmed trajectory per seven-session sustained-firing
  across TERMINAL CLOSE).
- Subagent-composition-grade anti-drift sub-grain (a) + (e) combined
  N=6 → N=7 candidate at PATH + NUMERICAL-COUNT grade.
- Subagent-dispatch N=8 → N=9.
- Three-artifact composition N=6 → N=7.
- Sub-curve (a) calibration N=8 → N=9 candidate.
- Path B disposition selection N=6 → N=7.
- Skill-mandate-recommendation-inversion N=6 → N=7.
- Inline-Execution-vs-Subagent-Driven-Development N=6 → N=7.
- Brainstorming-skill-invocation-at-disposition-grade N=5 → N=6.
- Brainstorming-side disposition-grade-skip-past avoidance N=5 → N=6.
- Phase A split-discharge sub-grain (b) N=2 → N=3 promotion-threshold-
  MET MATERIALIZED.
- Preemptive substrate path verification N=10 → N=11 (Sessions 48-58).

Codification graduation candidates substantively past N=3 promotion
threshold (Phase 8 retro Commit B grade routing):
- Cycle-close §10.4 enumeration grade UNDERCOUNT sub-pattern N=4
  cumulative confirming-fire MATERIALIZED (HIGH priority).
- Sessions-with-major-banking-event-firing-concurrent-N-progression
  N=4 → N=5 cumulative confirming-fire candidate.

TWO NEW first-instance sub-pattern candidates at Session 58 grade:
- Brief-drafting cycle TERMINAL CLOSE materialization sub-pattern
  N=1 first-instance candidate (Session 58 close at 100% complete).
- Sub-pattern stability observation at sub-grain (b) discipline
  emergence grade N=1 → N=2 cumulative confirming-fire candidate.

Path B sub-grain catalog four-grain depth MATERIALIZED + multi-
completion-percentage-granularity THREE-grade depth + sub-grain (iv)
canonical materialization at Session 59+ pending.

Additional strengthening:
- F-J-14 Grain 1 NO-SPLIT N=9 → N=10 (chunks 1+...+10 — 10
  consecutive at TERMINAL CLOSE grade).
- F-J-14 Grain 1.4 sub-chunk-impl-bound N=8 → N=9.
- Brief-drafting metafact-assertion grain N=7 → N=8.
- Coordination warning N=29 → N=32 (3-commit close).
- Directive-grade self-correction N=12 → N=13.
- F-J-14 Grain 0 N=13 → N=14; walk-order N=14; Refinement #3 N=14.

Phase 8 cycle status: 1 of 10 chunk-impl sessions substrate-complete
(chunk 1 at 6738e38); 10 of 10 chunk briefs shipped (chunk 1 ad47042 +
chunk 2 5dc042a + chunk 3 683d5df + chunk 4 a2c20fa + chunks 5+6
0288953 + chunk 7 aba5fe7 + chunk 8 2cd394a + chunk 9 470469e + chunk
10 this commit). **Brief-drafting cycle TERMINAL CLOSE at 100% complete
grade.**

Next operational fire: Session 59 — sub-grain (iv) TERMINAL-brief-
drafting-cycle-shift canonical fire grade at Sessions 59+ post-cycle-
terminal-close. Founder operational adjudication at Session 59 onset
fires cycle-posture shift to chunk-impl cycle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 33 commits ahead of origin/staging (was 30 at Session 57 close + 1 Session 58 design `70c55ab` + 1 Session 58 plan + 1 Session 58 chunk 10 brief = 33 at 3-commit close OR 34 at 4-commit close with correction commit). Adjust expected count to actual.

---

## Task 5: Update memory + Session 58 close summary + brief-drafting cycle TERMINAL CLOSE summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunk_10_brief_shipped.md`
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunk 10 brief shipped topic memory file.**

Template per Sessions 51-57 chunk brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Chunk 10 FIVE substantive surfaces (withInvariants signature widening + ingestDocument.ts consumer migration + ADR-0007 §Tier 2 Layer 2 #C amendment + service-layer.md Candidate #11 phase-out + Phase A discovery grade consumer enumeration)
- Phase A discovery grade canonical-path resolution banking
- Banking surfaces materialized at Session 58 close (TWELVE-PLUS N+1 cumulative confirming-fire firings + TWO NEW first-instance candidates + Phase A split-discharge sub-grain (b) N=3 promotion-threshold-MET MATERIALIZED + cycle-close §10.4 UNDERCOUNT N=4 cumulative confirming-fire MATERIALIZING)
- Validation gate state (pnpm agent:validate 26/26 green; working tree clean post-commits)
- **Brief-drafting cycle TERMINAL CLOSE at 100% complete grade** — Phase 8 cycle progression milestone
- Next operational fire (Session 59 sub-grain (iv) TERMINAL-brief-drafting-cycle-shift canonical fire grade)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 10 of 10 chunk briefs shipped — TERMINAL CLOSE)

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_9_brief_shipped.md` entry. Format per project convention.

- [ ] **Step 3: Compose Session 58 close summary + brief-drafting cycle TERMINAL CLOSE summary in conversation.**

Mirror Session 57 close summary shape. Cover:
- Three-commit Session 58 close shape (Session 58 design doc `70c55ab` + Session 58 plan + chunk 10 brief) per Sessions 52+55+56+57 precedent inheritance
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (33 commits ahead of origin/staging post-Session-58 3-commit close; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized (TWELVE-PLUS N+1 cumulative + TWO NEW first-instance + Phase A split-discharge N=3 promotion-threshold-MET + cycle-close §10.4 UNDERCOUNT N=4 cumulative)
- **Brief-drafting cycle TERMINAL CLOSE at 100% complete grade** — explicit cycle-progression milestone framing
- Next operational fire (Session 59 disposition: cycle-posture shift to chunk-impl cycle per sub-grain (iv) TERMINAL-brief-drafting-cycle-shift canonical fire grade)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of Session 58 design doc §5 operational consequences covered by tasks (§5.1 chunk 10 five substantive surfaces + §5.2 substrate-load expectation + §5.3 forecast band + §5.4 envelope timing TERMINAL CLOSE + §5.5 sequential brief-drafting cycle continuation at TERMINAL session grade)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunk 10 brief at composition close.
- [ ] **Type consistency:** All `withInvariants` references consistent; all `SystemActorServiceContext` references consistent; all `synthCtxForRouter` + `synthCtxForCommit` references consistent; all `ServiceContext | SystemActorServiceContext` structural union references consistent; all `Layer 2 item #C` references consistent.
- [ ] **Path-citation drift:** All ADR-path + canonical code substrate path citations verified against Phase A grade verified paths. Special verification: `apps/web/src/services/middleware/withInvariants.ts` (NOT services/ root); `apps/web/src/services/middleware/serviceContext.ts` canonical types; NO `reconciliationService.ts` citations.
- [ ] **Numerical-count drift:** All numerical-count citations verified against canonical-source-artifact grade per Session 56 Finding A Observation 2 sub-grain (e) discipline (93 LOC withInvariants.ts; 515/684/620 anchor LOCs; commits-ahead 31 post-design / 32 post-plan / 33 post-chunk-10; chunks shipped 10 of 10 TERMINAL).

---

## Operational Notes

**Single-subagent-per-chunk-brief dispatch shape**: Task 2 is the heaviest task at substrate-composition grade. Single-subagent dispatch with comprehensive briefing inheriting chunk 9 brief composition precedent (515 LOC LOW-density) + chunk 7 brief precedent (684 LOC HIGH-density) + chunk 4 brief precedent (620 LOC sub-curve (a) anchor) + briefing-grade anti-drift discipline at BOTH PATH-citation grade (sub-grain (a) N=6 cumulative confirming-fire MATERIALIZED) + NUMERICAL-COUNT grade (sub-grain (e) N=2 confirming-fire CLEAN inheritance).

**Anti-drift discipline at every step**: substrate citations + numerical-count citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path + substrate-path + numerical-count verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=10 → N=11 cumulative confirming-fire candidate.

**Briefing-explicitly-enumerated subset discipline at sub-grain (a) + (e) combined grade**: briefing at Task 2 grade EXPLICITLY enumerates ALL paths referenced + ALL numerical-count substrate values at canonical-source-artifact grade. NO commit-SHA inference OR session-context inference at briefing grade.

**Layer 2 item #C amendment paired substrate-pair shape**: Per cycle-close §6.4 Layer 2 amendment ratification sequencing: chunk 10 paired with Layer 2 item #C ADR-0007 §Tier 2 amendment per Sub-Q9 substrate-grade-first OR retrospective Commit A grade. Brief documents Layer 2 item #C paired substrate-pair shape at §2 explicitly — closer to chunks 7+9 Layer 2-paired shapes than chunk 8 zero-Layer-2-amendment shape inheritance.

**Phase A discovery grade canonical-path INCORRECTNESS sub-pattern compensation**: Per Sessions 55+56+57+58 N=3 → N=4 cumulative confirming-fire MATERIALIZING + HIGH priority routing inheritance: Phase A grade fires EXPLICIT substantive surface enumeration verification at canonical-source-artifact grade BEYOND cycle-close §10.4 citation grade. §10.4 line 657 "or analogous" framing acknowledges path uncertainty; Phase A discovery resolves canonical path at substrate-grade-grain accurate grade.

**Design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework**: design-doc grade specifies framing-level substantive surface enumeration + disposition adjudication + discipline firings catalog + forecast LOC; brief-drafting plan grade Task 1 Phase A verify-from-disk EXPLICITLY absorbs cycle-close §10.4 + §10.5 chunk 10 canonical surface enumeration + Phase A discovery grade canonical-path resolution at substrate-grade-grain accurate grade.

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade. Session 58 fires brief-drafting cycle TERMINAL CLOSE; Grain 3 carries forward to chunk-impl cycle Sessions 59+ grade.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Sessions 68-70 per envelope refinement). Banks locally on staging branch at 33 commits ahead of origin/staging post-Session-58 3-commit close (was 30 at Session 57 close).

**Coordination warning posture**: Coordination warning N=29 → N=32 cumulative firing candidate at Task 4 commit grade. Codification graduation candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with HIGH priority.

**Phase A split-discharge sub-pattern preservation across plan execution**: Per Session 58 design doc §1 + Phase A unconditional-discharge ratification grade inheritance + N=3 promotion-threshold-MET MATERIALIZED inheritance: Phase A sub-grain (b) split-discharge grade applied at Session 58 grade — UNCONDITIONAL substrate-readiness checks (Task 1 Steps 1-3) ALREADY discharged at session-onset BEFORE founder Candidate ratification; CONDITIONAL substrate verification (Task 1 Steps 4-17) discharges at plan-execution grade post-Candidate-ratification + post-design-doc-commit-grade. N=3 promotion-threshold-MET MATERIALIZED at Session 58 grade.

**Brief-drafting cycle TERMINAL CLOSE materialization**: Per cycle-close §9.5 + §7.7 inheritance: Session 58 close fires brief-drafting cycle TERMINAL CLOSE at 100% complete grade. Sub-grain (iv) TERMINAL-brief-drafting-cycle-shift at 100%-complete grade fires canonical at Session 59+ grade post-cycle-terminal-close. **Phase 8 cycle progression milestone** — first-instance brief-drafting cycle TERMINAL CLOSE materialization at Session 58 grade.

**Sub-grain (iv) pre-commit-inline-edit remediation N=2 → N=3 promotion-threshold-MET candidacy**: Per Sessions 55+56+57 sub-grain (iv) N=2 cumulative confirming-fire MATERIALIZED inheritance: Session 58 Task 3 spot-check grade may fire sub-grain (iv) N=3 candidate if path-drift OR numerical-count-drift surfaces requiring inline-edit remediation.
