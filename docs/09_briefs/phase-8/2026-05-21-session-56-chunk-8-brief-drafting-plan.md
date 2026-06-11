# Session 56 Phase 8 Chunk 8 Brief-Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunk 8 brief at substantively-new-phase chunk-brief sub-curve (a) grade per cycle-close §5.1 framing #3 cross-service orchestrators (payment.record ActionName + role_permissions migration + canUserPerformAction parity test CA-27 inheritance + paymentService.record() multi-consumer wiring per Sub-Q3.b).

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md`. §1-§6 structure inheriting chunk 7 brief template at `aba5fe7` (most recent single-chunk-brief precedent at 684 LOC) + chunk 4 brief template at `a2c20fa` (single-chunk anchor at 620 LOC sub-curve (a) anchor); §2.1 + §2.2 + §2.3 single-chunk scope (chunk 8 five substantive surfaces per cycle-close §10.4 + §10.5 enumeration); §4 Tasks single-chunk decomposition. Single-subagent dispatch per Sessions 53 + 54 + 55 precedent inheritance; briefing-grade anti-drift discipline at composition START per subagent-composition-grade anti-drift via explicit briefing sub-grain (a) N=4 → N=5 cumulative confirming-fire candidate. ~590-640 LOC sub-curve (a) substantively-new-phase forecast band per Phase 5.1 + 6.5 + 7 + Phase 8 chunks 2 + 3 + 4 + 7 precedent inheritance.

**Tech Stack:** Markdown docs authoring. No code changes. ADR substrate + Phase 5.1 paymentService.record substrate + Phase 7 chunk 7.3b consumer #1 + chunk 7 consumer #2 + canUserPerformAction.ts ACTION_NAMES array + supabase/migrations/ existing bill_action_permissions seeding pattern + apps/web/tests/integration/services/ NEW subdirectory read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` (~590-640 LOC at substantively-new-phase chunk-brief sub-curve (a) grade)

**Files to read (Phase A substrate verification per design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework — Task 1 absorbs cycle-close §10.4 + §10.5 chunk 8 canonical surface enumeration at substrate-grade-grain accurate grade):**

- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (chunk 7 brief at `aba5fe7`; most recent single-chunk-brief precedent at 684 LOC; §-structure template inheritance source + paymentService.record consumer #2 wiring substrate inheritance for chunk 8 consumer #N expansion)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (chunk 4 brief at `a2c20fa`; sub-curve (a) anchor at 620 LOC; §-structure template inheritance source for §1-§6 + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 framing-pairing chunk 8 + §5.3 chunk 8 acceptance criteria + §6.2 service dependencies paymentService.record → chunk 7 → chunk 8 + §7.5 chunk 8 brief-drafting framing + §10.4 chunk 8 code surfaces + §10.5 chunk 8 substrate migrations)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (Tier 2 safety contract surface; chunk 8 paymentService.record consumer wiring at Tier 2 grade per ADR-0007 §Tier 2 inheritance)
- `docs/07_governance/adr/0015-ap-spend-subdomain.md` (AP/Spend subdomain Phase 5 substrate ADR; paymentService.record provenance + multi-consumer expansion substrate framing)
- `docs/07_governance/adr/0011-document-platform.md` (§3 permissions framework + §13 exception queue framing for consumer wiring context)
- `apps/web/src/services/auth/canUserPerformAction.ts` (INV-AUTH-001 permission source; ACTION_NAMES array canonical site at lines 19+; CA-27 parity test reference at convention comment)
- `apps/web/src/services/spend/paymentService.ts` (Phase 5.1 substrate at 13KB; paymentService.record() function signature + ledger-write path for chunk 8 multi-consumer wiring target)
- `apps/web/src/services/spend/billService.ts` (Phase 5.1 substrate at 36KB; CA-27 enforced parity test inheritance source at bill.post + bill.approve + bill.record_payment + bill.reverse ACTION_NAMES + role_permissions seeding pattern grade)
- `supabase/migrations/20240140000000_bill_action_permissions.sql` (role_permissions seeding pattern inheritance source; bill.post + bill.approve canonical seeding shape)
- `supabase/migrations/20240141000000_bill_record_payment_action_permission.sql` (role_permissions seeding pattern inheritance source; bill.record_payment seeding shape)
- `supabase/migrations/20240142000000_bill_reverse_action_permission.sql` (role_permissions seeding pattern inheritance source; bill.reverse seeding shape)

**Files to grep (Phase A discovery):**

- `supabase/migrations/` (latest at `20240158000000_phase_7_org_settings_substrate.sql`; chunk 7 target `20240159000000`; chunk 8 target `20240160000000_phase_8_chunk_8_role_permissions_payment_record.sql` per cycle-close §10.4 net-new framing)
- `apps/web/tests/integration/services/` (NEW subdirectory per §10.4 chunks 7-8 shared; verify NON-existence)
- `paymentService.record` callers (verify Phase 7 chunk 7.3b consumer #1 + identify additional consumer surfaces beyond chunk 7 consumer #2 per Sub-Q3.b multi-consumer expansion)

**Files NOT created:** Chunk 8 implementation substrate (ACTION_NAMES enum extension + migration + paymentService.record() multi-consumer wiring + CA-27 parity test). Per Candidate (a) ratification: chunk 8 impl deferred to canonical §9.5 sequencing at Sessions 59+ grade.

---

## Task 1: Phase A — Pre-composition verify-from-disk

**Files:**
- Read-only verification across substrate paths above

- [ ] **Step 1: Verify commits-ahead at Session 56 plan-composition grade.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `25` (was 24 at Session 55 close + 1 new at Session 56 design doc commit `21eea02`). If 26, plan-doc commit already fired — adjust expectations downstream accordingly. Sessions 53+54+55 plan template precedent expressed pre-plan-commit count; honor convention.

- [ ] **Step 2: Verify pnpm agent:validate 26/26 baseline preserved.**

```bash
pnpm agent:validate 2>&1 | tail -5
```
Expected: `Tests 26 passed (26)` in output. Inheritance from Session 55 close + Session 56 Phase A Step 2 background discharge (exit code 0; 5 files; 4.07s duration).

- [ ] **Step 3: Verify working tree clean at Session 56 plan-composition grade.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files. Pre-existing untracked items match Session 55 close inheritance exactly.

- [ ] **Step 4: Read chunk 7 brief in full as most recent single-chunk-brief precedent.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (684 LOC at `aba5fe7`). Verify §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape. Chunk 7 establishes paymentService.record consumer #2 wiring at postV1ReconciliationOrchestrator grade; chunk 8 inherits as consumer #N source for multi-consumer expansion framing. Chunk 7 brief at 684 LOC reflected high banking surface density (~8 NEW first-instance candidates); chunk 8 brief substantive surface scope is comparable to chunks 2+3+4 at single-chunk grade per sub-curve (a) banking-surface-density variant (NOT chunk 7's high-banking-density grade) per Session 56 design doc §5.3 distinction.

- [ ] **Step 5: Read chunk 4 brief as sub-curve (a) anchor.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (620 LOC at `a2c20fa`). Chunk 4 brief is the single-chunk sub-curve (a) anchor at 620 LOC — verifies §-structure stability across Sessions 53 + 55 brief-drafting (chunk 4 + chunk 7 both single-chunk briefs at sub-curve (a) grade; §-structure stable inheritance source). Chunk 8 brief inherits identical §-structure from chunk 4/chunk 7.

- [ ] **Step 6: Read cycle-close §5.1 + §5.3 + §6.2 + §7.5 + §10.4 + §10.5 chunk 8 framing.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`:
- §5.1 framing-pairing inventory (chunk 8 ↔ framing #3 cross-service orchestrators; paymentService.record() v1 consumers per Sub-Q3.b multi-consumer expansion)
- §5.3 chunk 8 acceptance criteria (Layer 1 item #3 substrate-grade migration ships payment.record ActionName + role_permissions; canUserPerformAction parity test CA-27 inheritance; additional paymentService.record() consumers per multi-consumer expansion)
- §6.2 service dependencies (paymentService.record Phase 5.1 substrate → chunk 7 consumer #2 → chunk 8 consumer #N sequential dependency per Sub-Q3.b multi-consumer expansion)
- §7.5 chunk 8 brief-drafting framing (substrate-load expectation: Phase 5.1 paymentService.record substrate + chunk 7 consumer #2 wiring + Phase 7 chunk 7.3b consumer #1 already shipped; per-chunk forecast: Layer 1 item #3 ~125-235 LOC + multi-consumer wiring scope per brief-drafting adjudication)
- §10.4 chunk 8 code surfaces (5 surfaces: ACTION_NAMES enum extension + supabase migrations role_permissions payment_record net-new + paymentService.record multi-consumer wiring + canUserPerformAction parity test CA-27 + chunks 7-8 shared apps/web/tests/integration/services/ NEW subdirectory)
- §10.5 chunk 8 substrate migrations (role_permissions migration — payment.record ActionName seeding)

- [ ] **Step 7: Read ACTION_NAMES canonical site + verify INV-AUTH-001 framing.**

```bash
head -100 apps/web/src/services/auth/canUserPerformAction.ts
```

Verify ACTION_NAMES array canonical site at lines 19+. Confirm INV-AUTH-001 permission source framing per Phase 1.5C rewrite (permissions table + role_permissions join authoritative). Confirm convention comment at lines 12-15 establishing the pattern: "Adding a new permission requires updating ACTION_NAMES AND seeding a permissions row in a migration." Chunk 8 follows this pattern at `payment.record` addition grade.

CA-27 parity test reference: comment at line 13-14 cites parity test "asserts set-equality between ACTION_NAMES and the permissions table." Chunk 8 brief inherits CA-27 parity test extension at `payment.record` parity assertion grade.

- [ ] **Step 8: Read role_permissions seeding pattern from existing bill_action migrations.**

```bash
cat supabase/migrations/20240140000000_bill_action_permissions.sql
```

Verify role_permissions seeding grammar at `bill.post` + `bill.approve` canonical shape. Chunk 8 inherits identical pattern at `payment.record` grade.

```bash
cat supabase/migrations/20240141000000_bill_record_payment_action_permission.sql
```

Verify single-permission migration shape at `bill.record_payment` grade. Chunk 8 follows this canonical single-permission migration shape (matches single-ActionName addition framing at chunk 8 scope grade).

```bash
cat supabase/migrations/20240142000000_bill_reverse_action_permission.sql
```

Verify second single-permission migration shape at `bill.reverse` grade. Confirm role_permissions seeding pattern + permissions table insertion grammar stable across N=3 precedent (`bill.post` + `bill.record_payment` + `bill.reverse`).

- [ ] **Step 9: Read paymentService.record canonical signature + ledger-write path.**

```bash
grep -nE "^export.*function|record\(|paymentService\." apps/web/src/services/spend/paymentService.ts | head -20
```

Verify paymentService.record substrate from Phase 5.1 ship. Confirm record function signature shape + ledger-write path for chunk 8 multi-consumer wiring target.

- [ ] **Step 10: Read billService CA-27 parity test inheritance source.**

```bash
grep -nE "bill\.post|bill\.approve|bill\.record_payment|bill\.reverse|ACTION_NAMES" apps/web/src/services/spend/billService.ts | head -20
```

Verify billService Phase 5.1 substrate at canUserPerformAction integration grade. Confirm bill.* ActionName usage pattern as canonical multi-permission seeding precedent for chunk 8 payment.record analogous pattern.

- [ ] **Step 11: List ADR canonical directory + verify chunk 8 referenced ADR paths.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference against:
- `0007-three-tier-agent-architecture.md` (Tier 2 safety contract)
- `0011-document-platform.md` (§3 permissions framework context)
- `0015-ap-spend-subdomain.md` (AP/Spend Phase 5 subdomain)

Per cycle-close §6.4: NO ADR amendment paired with chunk 8 (Layer 2 items A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1). Chunk 8 substrate-amendment-pairing absent at framing #3 cross-service orchestrators grade.

Preemptive substrate path verification at session-onset N=8 → N=9 confirming-fire candidate if all paths verify clean (per Session 56 Phase A Step 1+2+4 foreground+background discharge at Candidate (a) ratification preamble grade).

- [ ] **Step 12: Verify ACTION_NAMES canonical site is single source.**

```bash
grep -rln "ACTION_NAMES\b" apps/web/src --include="*.ts"
```

Expected: confirm `apps/web/src/services/auth/canUserPerformAction.ts` is the single canonical site (per Phase A Step 5 brainstorming-side verification). Any additional sites surface drift firing — HALT and surface to founder.

- [ ] **Step 13: List recent supabase migrations + identify chunk 8 target naming.**

```bash
ls supabase/migrations/ | tail -10
```

Verify latest at `20240158000000_phase_7_org_settings_substrate.sql`. Chunk 7 target `20240159000000` (NOT yet shipped per chunk-impl deferral; chunk 7 brief at `aba5fe7` references substrate-grade migration at this slot). Chunk 8 target `20240160000000_phase_8_chunk_8_role_permissions_payment_record.sql` per sequence inheritance.

- [ ] **Step 14: Verify apps/web/tests/integration/services/ NON-existence at Phase A grade.**

```bash
ls apps/web/tests/integration/services/ 2>/dev/null && echo "EXISTS" || echo "DOES NOT EXIST (expected per §10.4 chunks 7-8 shared net-new framing)"
```

Expected: `DOES NOT EXIST` per cycle-close §10.4 chunks 7-8 shared NEW subdirectory framing inheritance (chunk 7 + chunk 8 substrate create this subdirectory at impl-grade).

- [ ] **Step 15: Identify paymentService.record callers beyond chunk 7 consumer #2 + Phase 7 chunk 7.3b consumer #1.**

```bash
grep -rnE "paymentService\.record|paymentService\.record\(" apps/web/src --include="*.ts" | head -20
```

Identify existing paymentService.record callers at codebase grade. Brief composition at Task 2 grade enumerates "additional consumer count beyond minimum baseline" per cycle-close §7.5 partial-information items: existing callers establish baseline; chunk 8 multi-consumer wiring expands at Sub-Q3.b grade. Specific consumer enumeration deferred to brief-drafting adjudication grade — partial-information item resolution fires at brief-drafting Task 2 grade.

- [ ] **Step 16: HALT-and-surface gate.**

If any of Steps 1-15 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression, ACTION_NAMES canonical site multi-location, paymentService.ts structural divergence from Phase 5.1 expected substrate, role_permissions seeding pattern divergence from N=3 precedent canonical shape, apps/web/tests/integration/services/ UNEXPECTED existence), HALT and surface to founder before Task 2 dispatch fires. Per Sessions 51 + 53 + 54 + 55 Phase A halt-and-surface precedent (γ' resolution + ingestDocument.ts path drift + components canvas/ path drift + design-doc pre-write substantive surface citation correction) + preemptive substrate path verification at session-onset N=9 confirming-fire candidate.

Per substrate-evidence-propagation-gap discipline N=5 confirming-fire + remediation discipline N=2 confirming-fire MET inheritance: material divergence fires correction-commit-at-source per remediation discipline. Sub-grain (iii) pre-write remediation (Session 55 design-doc pre-write grade) + sub-grain (iv) pre-commit-inline-edit remediation (Session 55 brief-post-subagent-dispatch grade) applied at brainstorming-side adjudication grade BEFORE this plan composed; sub-grain (i) pre-dispatch remediation OR sub-grain (ii) post-dispatch remediation applies if Phase A surfaces divergence at substrate-grade BEFORE Task 2 dispatch.

---

## Task 2: Dispatch subagent for chunk 8 brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md`

- [ ] **Step 1: Compose comprehensive subagent briefing with briefing-grade anti-drift discipline at composition START.**

Per Sessions 52 + 53 + 54 + 55 chunks 3 + 4 + 5+6 + 7 brief composition precedent (subagent-composition-grade anti-drift discipline via explicit briefing sub-grain (a) N=4 → N=5 cumulative confirming-fire candidate): briefing EXPLICITLY enumerates ALL paths referenced (canonical ADR paths + canonical code substrate paths + Session 56 design doc canonical filename + Session 56 plan doc canonical filename + chunk 8 brief canonical filename) at composition START. NO commit-SHA inference OR session-context inference at briefing grade — sub-grain (b) drift risk fires at implicit-inference paths per Session 55 line 81 drift discovery precedent.

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 7 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` as most recent single-chunk-brief precedent at 684 LOC + chunk 4 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` as 620 LOC sub-curve (a) anchor. Match §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape.

(b) **Chunk 8 substantive scope (framing #3 cross-service orchestrators per cycle-close §5.1 + §5.3 + §7.5 + §10.4 + §10.5)**: five substantive axes per §10.4 canonical surface enumeration:

- **Axis 1: ACTION_NAMES enum extension** at canonical `apps/web/src/services/auth/canUserPerformAction.ts` (canonical site verified at Phase A grade Step 12 single-source check). Add `payment.record` literal to ACTION_NAMES array per INV-AUTH-001 permission source convention. Pattern: insert literal alphabetically OR domain-grouped (existing array uses domain-grouped sections — bill.* domain has 4 entries per Phase 5 inheritance; payment.* domain is new at chunk 8 grade). Brief composition adjudicates insertion position at substrate-grade-grain accurate grade.

- **Axis 2: Migration role_permissions_payment_record net-new** at canonical `supabase/migrations/20240160000000_phase_8_chunk_8_role_permissions_payment_record.sql` (sequence inheritance per chunk 7 target at 20240159000000). Inserts permissions table row at `payment.record` + role_permissions seeding for `payment.record` ActionName per ADR-0011 §3 permissions framework. Pattern inherits from existing `20240140000000_bill_action_permissions.sql` + `20240141000000_bill_record_payment_action_permission.sql` + `20240142000000_bill_reverse_action_permission.sql` canonical seeding shape (N=3 precedent inheritance verified at Phase A grade Step 8).

- **Axis 3: paymentService.record() multi-consumer wiring** per Sub-Q3.b multi-consumer expansion. Phase 7 chunk 7.3b shipped consumer #1; chunk 7 brief at `aba5fe7` defines consumer #2 at postV1ReconciliationOrchestrator grade; chunk 8 wires consumer #N at canonical service-layer integration grade. Specific consumer enumeration per cycle-close §7.5 partial-information items: "additional v1 consumer count beyond minimum baseline (chunk 7 + chunk 8 minimums; Framing #5 Logic Receipt + Framing #4 ledger extensions may surface additional consumers)" — brief composition adjudicates specific consumer count + canonical consumer paths at substrate-grade-grain accurate grade. paymentService.ts at `apps/web/src/services/spend/paymentService.ts` extension surface; signature shape preserved (no contract change at chunk 8 grade).

- **Axis 4: canUserPerformAction parity test CA-27 inheritance** at NEW test fixture at `apps/web/tests/integration/services/` subdirectory (NEW per Axis 5). Parity test asserts set-equality between `ACTION_NAMES` array (canUserPerformAction.ts) and `permissions` table (database state); chunk 8 extends parity to admit `payment.record` literal. CA-27 enforced parity test inheritance source: billService Phase 5.1 substrate at `apps/web/src/services/spend/billService.ts` (36KB; verified at Phase A grade Step 10) — chunk 8 parity test fixture inherits bill.* parity pattern at payment.* analogous grade.

- **Axis 5: `apps/web/tests/integration/services/` NEW subdirectory** — shared net-new with chunk 7 per cycle-close §10.4 (chunks 7-8 shared subdirectory ownership grade). Test substrate ownership at chunks 7-8 shared grade per Sub-Q18 canonical path discipline + testing.md Candidate #8 three-surface extension. Chunk 8 brief composition creates the canonical path at brief-grade citation; impl-grade creates the actual directory.

(c) **What chunk 8 does NOT ship** (deferred per cycle-close §6.4 ADR amendment ratification sequencing + §9.5 brief-then-impl sequencing):

- Chunk 8 implementation substrate: deferred to canonical §9.5 sequencing at Sessions 59+ grade.
- ADR amendment at chunk 8 substrate-grade-pair: NONE per cycle-close §6.4 (Layer 2 items A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1). Chunk 8 substrate-amendment-pairing absent at framing #3 grade — chunk 8 brief documents absence at substrate-pair shape grade vs chunk 7's substrate-pair shape (chunk 7 ships Layer 2 item #A; chunk 8 ships zero Layer 2 amendment).
- Chunks 9 + 10 substrate (framing #5 Logic Receipt consumer + framing #7 system_actor widening at withInvariants): deferred to Sessions 57 + 58 per cycle-close §7.6 + §7.7.
- Bill domain ActionNames (bill.post + bill.approve + bill.record_payment + bill.reverse already shipped per Phase 5.1 substrate): chunk 8 ONLY adds `payment.record`; existing bill.* ActionNames remain unchanged.

(d) **Verified-correct substrate citations** (preemptive against substrate-evidence-propagation-gap sub-pattern N=5 cumulative inheritance + sub-grain catalog four-grain depth (a)/(b)/(c)/(d) inheritance):

- ADR-0007: `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (Tier 2 safety contract; chunk 8 paymentService.record consumer wiring at Tier 2 grade)
- ADR-0015: `docs/07_governance/adr/0015-ap-spend-subdomain.md` (AP/Spend Phase 5 subdomain; paymentService.record provenance)
- ADR-0011: `docs/07_governance/adr/0011-document-platform.md` (§3 permissions framework context)
- canUserPerformAction.ts: `apps/web/src/services/auth/canUserPerformAction.ts` (ACTION_NAMES canonical site at lines 19+; INV-AUTH-001 permission source per Phase 1.5C rewrite)
- paymentService.ts: `apps/web/src/services/spend/paymentService.ts` (Phase 5.1 substrate at 13KB)
- billService.ts: `apps/web/src/services/spend/billService.ts` (Phase 5.1 substrate at 36KB; CA-27 parity test inheritance source)
- chunk 7 brief: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-7.md` (paymentService.record consumer #2 wiring inheritance source)
- chunk 4 brief: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (sub-curve (a) anchor at 620 LOC; §-structure template)
- Existing role_permissions migrations: `supabase/migrations/20240140000000_bill_action_permissions.sql` + `supabase/migrations/20240141000000_bill_record_payment_action_permission.sql` + `supabase/migrations/20240142000000_bill_reverse_action_permission.sql` (N=3 seeding pattern precedent canonical shape)
- Chunk 8 target migration: `supabase/migrations/20240160000000_phase_8_chunk_8_role_permissions_payment_record.sql` (net-new; verified at Phase A grade Step 13 as next-available sequence slot post-chunk-7 20240159000000)
- Chunk 8 brief: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` (this brief; net-new at composition grade)

DO NOT cite paths via commit-SHA inference OR session-context inference. EVERY path enumerated above at canonical-path grade per sub-grain (a) briefing-explicitly-enumerated subset N=4 cumulative confirming-fire MATERIALIZED inheritance.

(e) **Path C invocation evaluation at brief-grade**: Sub-Q3 + Sub-Q9 locks at scope-lock cycle Round 2 + 3 pre-decomposed framing #3 into single chunk (chunk 8) at multi-consumer expansion framing per Sub-Q3.b lock. **NO-SPLIT outcome forecast** at brief-grade — chunk 8 five substantive surfaces (ACTION_NAMES + Migration + paymentService.record multi-consumer wiring + CA-27 parity test + apps/web/tests/integration/services/ subdirectory) cohere at single-chunk-impl-bound grade per substrate-pair shape:

- Surfaces 1-2-4 share substrate-amendment-pairing per Layer 1 item #3 grade (ACTION_NAMES enum extension + role_permissions migration + canUserPerformAction parity test are co-ratified at chunk 8 substrate-grade ship)
- Surface 3 (paymentService.record multi-consumer wiring) is service-layer extension at chunk 8 single-service grade
- Surface 5 (apps/web/tests/integration/services/) is test substrate ownership at chunks 7-8 shared grade
- ~125-235 LOC substrate migration scope per §7.5 forecast + multi-consumer wiring scope per brief-drafting adjudication is well-bounded at single-chunk-impl-bound grade

F-J-14 Grain 1 prospective NO-SPLIT outcome: **N=7 → N=8 cumulative confirming-fire** (Phase 8 chunks 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 prospective NO-SPLIT).

(f) **Forecast band**: Sub-curve (a) substantively-new-phase ~590-640 LOC band-center per Phase 5.1 chunk 5.1a 605 + Phase 6.5 chunk 1 623 + Phase 7 chunk 7.1 592 + Phase 8 chunk 2 592 + Phase 8 chunk 3 597 + Phase 8 chunk 4 620 + Phase 8 chunk 7 684 anchor inheritance.

Sub-curve (a) calibration **N=6 → N=7 cumulative confirming-fire candidate** at Session 56 chunk 8 brief LOC outcome.

**Sub-curve (a) banking-surface-density variant consideration** per Session 55 Finding B inheritance + Session 56 design doc §5.3 distinction: chunk 7 brief at 684 LOC reflected high banking surface density (N=8+ NEW first-instance candidates per chunk 7 substrate-grade-pair + Layer 2 item #A ratification + Stage 7 reconciliation framing). Chunk 8 brief substantive surface scope is comparable to chunks 2 + 3 + 4 at single-chunk grade (NOT comparable to chunk 7's high-banking-density grade) — sub-curve (a) banking-surface-density variant forecast: **~590-640 LOC band-center if moderate banking surface density** (N=3-5 NEW first-instance candidates per chunks 2-4 precedent) OR **~640-720 LOC if high banking surface density** (N=8+ NEW first-instance candidates per chunk 7 precedent). Brief composition at Task 2 grade adjudicates banking surface density at chunk 8 substrate scope grade.

Distinction at LOC band grade: cycle-close §7.5 "~125-235 LOC" is the **substrate migration LOC band** (Layer 1 item #3 migration scope at impl-grade); brief LOC forecast at ~590-640 LOC band-center is the **brief-grade LOC band** at sub-curve (a) substantively-new-phase calibration grade per Sessions 51-55 inheritance.

(g) **§1.2 session-onset divergence absorption for chunk 8**:

- **(α) Session 56 Candidate (a) ratification**: Path B continuation + chunk 8 single-chunk brief-drafting at framing #3 cross-service orchestrators ratified via `/superpowers:brainstorming` skill workflow at Session 56 design doc commit `21eea02` (Session 56 disposition design); chunk 8 brief composition fires per sequential brief-drafting cycle continuation inheritance from Sessions 51 + 52 + 53 + 54 + 55. Banking observation: sequential-brief-drafting-cycle-progresses-substrate-readiness N=4 → N=5 cumulative confirming-fire MATERIALIZING (Sessions 52+53+54+55+56 cumulative; hypothesis strongly confirmed trajectory grade) + Path B disposition selection N=4 → N=5 cumulative confirming-fire (Sessions 52+53+54+55+56 cumulative).

- **(β) Finding A — Phase A execution shape sub-pattern at split-discharge grade N=1 first-instance MATERIALIZED** per Session 56 design doc §6 Finding A banking. Sub-grain (a) sequential discharge grade (Sessions 53+54+55 precedent — all Phase A steps discharged BEFORE founder Candidate ratification) vs sub-grain (b) split-discharge grade (Session 56 N=1 first-instance — UNCONDITIONAL substrate-readiness checks fire foreground at session-onset; CONDITIONAL substrate verification defers to post-Candidate-ratification fire grade). Codification graduation candidate at Phase 8 retro Commit B grade routing.

- **(γ) Skill-chain composition + Session 56 plan-doc composition shape**: `/superpowers:brainstorming` → `/superpowers:writing-plans` → `/superpowers:executing-plans` per Sessions 52+53+54+55+56 plan-doc + design-doc + brief-doc three-artifact composition shape N=4 → N=5 cumulative confirming-fire MATERIALIZING. Session 56 design doc at `21eea02` + this Session 56 plan doc + chunk 8 brief composition (Task 2-4) per three-artifact composition shape canonical inheritance.

(h) **§6 carry-forward observation banking surface inheritance** from Session 55 close + Session 56 design doc §6 banking implications (full enumeration at chunk 7 brief §6 + Session 56 design doc §6):

**Ten N+1 cumulative confirming-fire firings at Session 56** (Phase 8 retro Commit A grade routing):

1. **Sequential-brief-drafting-cycle-progresses-substrate-readiness N=4 → N=5 cumulative confirming-fire** (Sessions 52+53+54+55+56) — hypothesis strongly confirmed trajectory
2. **Subagent-composition-grade anti-drift via explicit briefing sub-grain (a) N=4 → N=5 cumulative confirming-fire candidate** (Session 56 Task 2 single-subagent dispatch is the N=5 firing if Task 3 spot-check fires ZERO drift)
3. **Subagent-dispatch sub-pattern at Phase 8 grade N=6 → N=7 cumulative confirming-fire** (Sessions 50+51+52+53+54+55+56)
4. **Plan-doc + design-doc + brief-doc three-artifact composition shape N=4 → N=5 cumulative confirming-fire** (Sessions 52+53+54+55+56)
5. **Chunk-brief-drafting sub-curve (a) calibration N=6 → N=7 cumulative confirming-fire** if chunk 8 LOC lands in 590-640 band
6. **Path B disposition selection sub-pattern N=4 → N=5 cumulative confirming-fire** (Sessions 52+53+54+55+56)
7. **Docs-authoring-plan-with-internal-subagent-dispatch skill-mandate-recommendation-inversion N=4 → N=5 cumulative confirming-fire**
8. **Inline-Execution-vs-Subagent-Driven-Development execution-approach adjudication discipline N=4 → N=5 cumulative confirming-fire**
9. **Brainstorming-skill-invocation-at-disposition-grade sub-pattern N=3 → N=4 cumulative confirming-fire**
10. **Brainstorming-side disposition-grade-skip-past sub-pattern avoidance discipline N=3 → N=4 cumulative confirming-fire**

**One NEW first-instance sub-pattern candidate from Session 56 grade** (Phase 8 retro Commit B grade routing):
- Finding A — Phase A execution shape sub-pattern at split-discharge grade N=1 first-instance MATERIALIZED (sub-grain (a) sequential discharge vs sub-grain (b) split-discharge disambiguation at Session 56 N=1 first-instance grade)

**Path B sub-grain catalog at four-grain depth MATERIALIZED inheritance** (preserved from Session 55 Findings + Session 56 sub-grain (iii)/(iv) disambiguation):
- Sub-grain (i) brief-drafting cycle continuation (canonical Sessions 52+53+54+56)
- Sub-grain (ii) brief-drafting cycle close negative-test outcome (Session 55 60% cycle-complete grade)
- Sub-grain (iii) PARTIAL-brief-drafting-cycle-shift at 70%-complete grade (Session 56 ungraduated first-instance candidate; PRESERVED for future fire grade)
- Sub-grain (iv) TERMINAL-brief-drafting-cycle-shift at 100%-complete grade (Session 59+ canonical fire post-brief-drafting cycle terminal close at ~Session 58 grade)

**Additional banking surfaces**:
- Preemptive substrate path verification at session-onset N=8 → N=9 cumulative confirming-fire (Sessions 48-56)
- F-J-14 Grain 1 NO-SPLIT outcome sub-sub-pattern N=7 → N=8 cumulative (Phase 8 chunks 1+2+3+4+5+6+7+8 prospective NO-SPLIT)
- F-J-14 Grain 1.4 sub-chunk-impl-bound vs further-SPLIT distinction N=6 → N=7 cumulative confirming-fire (Phase 8 chunks 2+3+4+5+6+7+8 sub-chunk-impl-bound at Sub-Q14 + Sub-Q15 + Sub-Q3 SPLIT inheritance)
- Discovery-after-commit substrate-stability discipline N=3 maintained (PENDING N=4 if Phase A surfaces material divergence + correction commit fires post-write)
- Substrate-evidence-propagation-gap N=5 confirming-fire MET maintained; sub-grain catalog at four-grain depth (a)/(b)/(c)/(d) MATERIALIZED inheritance
- Substrate-evidence-propagation-gap remediation via explicit correction commit N=2 confirming-fire MET maintained; sub-grain catalog at four-grain depth (i)/(ii)/(iii)/(iv) MATERIALIZED inheritance
- Multi-chunk-consolidation-framing-substrate-grade-grain mismatch sub-pattern N=1 maintained from Session 53 inheritance
- Multi-chunk consolidation N=1 maintained from Session 54
- Interleaved cycle posture N=2 PRESERVED ungraduated per Candidate (a) sequential continuation
- Coordination warning cross-session N=23 → N=26 cumulative firing (Session 56 fires 3 warnings: design 21eea02 + plan + chunk 8 brief) OR N=27 at 4-commit close with correction commit
- Directive-grade self-correction anti-drift N=10 → N=11 cumulative confirming-fire candidate (if directive-iteration grade fires)
- F-J-14 Grain 0 two-stage banking N=11 → N=12 cumulative; walk-order N=11 → N=12; Refinement #3 N=11 → N=12
- Brief-drafting metafact-assertion grain context re-entry to canonical foreground discipline N=6 → N=7 cumulative

(i) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct via post-composition spot-check (mirror chunk 7 brief precedent at Session 55 grade). Briefing-grade anti-drift means subagent ALSO verifies ADR paths + canonical code substrate paths via filesystem reads BEFORE citing in brief composition (preventive at composition-input surface).

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunk 8 brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md | head -40
```

Expected:
- LOC in 590-640 band (sub-curve (a) calibration N=7 cumulative confirming-fire candidate at moderate banking surface density grade) OR 640-720 band (if high banking surface density grade fires per sub-curve (a) variant)
- §1-§6 + §1.1-§1.4 + §6.x sub-section structure consistent with chunk 7 brief template at `aba5fe7` + chunk 4 brief template at `a2c20fa`

Read first 50 lines of `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md` to confirm header matter (Date, Phase, Chunk, Path C disposition, Status, Session shape, Predecessor, Baseline, Sub-curve grade) + §1 Preamble structure.

---

## Task 3: Post-composition ADR-path + substrate-path spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: Enumerate substrate path citations.**

```bash
grep -nE "canUserPerformAction|paymentService|billService|role_permissions|ACTION_NAMES|tests/integration/services|bill_action_permissions|bill_record_payment|bill_reverse" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md | head -30
```

Cross-reference against Phase A grade Steps 7-14 verified paths. Each substrate path citation in the brief must match canonical path verified at Phase A grade.

**Special path-drift checks at Session 56 grade**:
- `apps/web/src/services/auth/canUserPerformAction.ts` is canonical (single source per Phase A Step 12); any `canUserPerformAction.ts` citation at alternate path fires drift firing.
- `apps/web/src/services/spend/paymentService.ts` is canonical (NOT `apps/web/src/services/payment/...` OR `apps/web/src/services/ap/...`); any alternate-path citation fires drift firing.
- `apps/web/src/services/spend/billService.ts` is canonical (CA-27 parity test inheritance source); any alternate-path citation fires drift firing.
- `supabase/migrations/20240160000000_phase_8_chunk_8_role_permissions_payment_record.sql` is the target migration slot; any sequence-misalignment citation (e.g., `20240159000000_payment_record_*` OR `20240161000000_*`) fires drift firing per chunk 7 target at 20240159000000 inheritance.

- [ ] **Step 4: If briefing-grade anti-drift held clean, expect ZERO drift firings.**

Per Sessions 52 + 53 + 54 + 55 precedent: briefing-grade anti-drift discipline at composition START preempted post-composition correction. If briefing-grade prevention holds at Session 56 grade, subagent-composition-grade anti-drift via explicit briefing **N=4 → N=5 cumulative confirming-fire MATERIALIZES**.

If ANY path drift surfaces, fire inline-edit correction. Also correct any associated label drift. Add §6.x banking entry for subagent-composition-grade path-citation drift if drift fires (briefing-grade prevention discipline failed). Sub-grain (iv) pre-commit-inline-edit remediation grade applies per Session 55 brief-post-subagent-dispatch grade precedent inheritance.

- [ ] **Step 5: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md
```

Expected: 590-640 (within sub-curve (a) substantively-new-phase forecast band at moderate banking surface density) OR 640-720 (sub-curve (a) banking-surface-density variant at high banking surface density). LOC observation determines sub-curve (a) calibration N=6 → N=7 cumulative confirming-fire materialization + sub-curve (a) banking-surface-density variant N=1 first-instance materialization disambiguation.

---

## Task 4: Commit chunk 8 brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md`

- [ ] **Step 1: Stage the chunk 8 brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at chunk-8-execution-grade per per-task evidence):

```
docs(phase-8): chunk 8 brief — framing #3 cross-service orchestrators (payment.record ActionName + role_permissions migration + canUserPerformAction parity test CA-27 inheritance + paymentService.record() multi-consumer wiring per Sub-Q3.b)

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-8.md (~590-640
LOC at substantively-new-phase chunk-brief sub-curve (a) grade per
Phase 5.1+6.5+7 + Phase 8 chunks 2+3+4+7 precedent inheritance).

Five substantive axes per cycle-close §10.4 + §10.5 chunk 8
canonical surface enumeration:

Axis 1: ACTION_NAMES enum extension at canonical apps/web/src/
services/auth/canUserPerformAction.ts. Add payment.record literal
to ACTION_NAMES array per INV-AUTH-001 permission source
convention (Phase 1.5C rewrite).

Axis 2: Migration role_permissions_payment_record net-new at
supabase/migrations/20240160000000_phase_8_chunk_8_role_
permissions_payment_record.sql. Inserts permissions table row +
role_permissions seeding for payment.record ActionName per ADR-
0011 §3 permissions framework. Pattern inherits from existing
20240140000000 + 20240141000000 + 20240142000000 bill.* canonical
seeding shape (N=3 precedent).

Axis 3: paymentService.record() multi-consumer wiring per Sub-
Q3.b. Phase 7 chunk 7.3b shipped consumer #1; chunk 7 brief
defines consumer #2 at postV1ReconciliationOrchestrator; chunk 8
wires consumer #N at canonical service-layer integration.

Axis 4: canUserPerformAction parity test CA-27 inheritance at NEW
test fixture at apps/web/tests/integration/services/. Asserts
set-equality between ACTION_NAMES + permissions table; chunk 8
extends parity at payment.record literal.

Axis 5: apps/web/tests/integration/services/ NEW subdirectory
(shared net-new with chunk 7 per §10.4).

§1.2 Divergence absorption:
(α) Session 56 Candidate (a) (Path B continuation + chunk 8
single-chunk brief-drafting at framing #3) ratified per design
doc 21eea02.
(β) Finding A — Phase A execution shape sub-pattern at split-
discharge grade N=1 first-instance MATERIALIZED. Sub-grain (a)
sequential discharge vs sub-grain (b) split-discharge
disambiguation at Session 56 grade per founder brainstorming-side
analysis.
(γ) Skill-chain composition: /superpowers:brainstorming → /super
powers:writing-plans → /superpowers:executing-plans per Sessions
52+53+54+55+56 plan-doc + design-doc + brief-doc three-artifact
composition shape N=4 → N=5 cumulative confirming-fire.

Banking surfaces materialized at Session 56 close grade:

Ten N+1 cumulative confirming-fire firings simultaneously:
- Sequential-brief-drafting N=4 → N=5 (Sessions 52+53+54+55+56;
  hypothesis strongly confirmed trajectory).
- Subagent-composition-grade anti-drift via explicit briefing sub-
  grain (a) N=4 → N=5 (Task 3 ZERO drift; clean).
- Subagent-dispatch N=6 → N=7 (Sessions 50+51+52+53+54+55+56).
- Plan-doc + design-doc + brief-doc three-artifact composition
  shape N=4 → N=5 (Sessions 52+53+54+55+56).
- Sub-curve (a) calibration N=6 → N=7 (chunk 8 LOC within forecast
  band).
- Path B disposition selection N=4 → N=5 (Sessions 52+53+54+55+56).
- Docs-authoring-plan-with-internal-subagent-dispatch skill-mandate-
  recommendation-inversion N=4 → N=5.
- Inline-Execution-vs-Subagent-Driven-Development execution-approach
  adjudication N=4 → N=5.
- Brainstorming-skill-invocation-at-disposition-grade N=3 → N=4.
- Brainstorming-side disposition-grade-skip-past avoidance N=3 → N=4.

One NEW first-instance sub-pattern candidate from Session 56
disposition adjudication:
- Finding A — Phase A execution shape sub-pattern at split-
  discharge grade N=1 first-instance MATERIALIZED (sub-grain (a)
  sequential discharge vs sub-grain (b) split-discharge
  disambiguation).

Path B sub-grain catalog at four-grain depth MATERIALIZED:
- Sub-grain (i) brief-drafting cycle continuation (canonical
  Sessions 52+53+54+56).
- Sub-grain (ii) brief-drafting cycle close negative-test (Session
  55 60% cycle-complete).
- Sub-grain (iii) PARTIAL-brief-drafting-cycle-shift at 70%-
  complete (Session 56 ungraduated first-instance; PRESERVED).
- Sub-grain (iv) TERMINAL-brief-drafting-cycle-shift at 100%-
  complete (Session 59+ canonical fire post-brief-drafting cycle
  terminal close at ~Session 58).

Additional strengthening:
- Preemptive substrate path verification at session-onset N=8 →
  N=9 (Sessions 48-56; hypothesis-strongly-confirmed trajectory).
- F-J-14 Grain 1 NO-SPLIT N=7 → N=8 (chunks 1+2+3+4+5+6+7+8).
- F-J-14 Grain 1.4 sub-chunk-impl-bound vs further-SPLIT N=6 → N=7.
- Brief-drafting metafact-assertion grain N=6 → N=7.
- Coordination warning N=23 → N=26 (3-commit close).
- Directive-grade self-correction N=10 → N=11.
- F-J-14 Grain 0 N=11 → N=12; walk-order N=12; Refinement #3 N=12.

Phase 8 cycle status: 1 of 10 chunk-impl sessions substrate-
complete (chunk 1 at 6738e38); 8 of 10 chunk briefs shipped (chunk
1 ad47042 + chunk 2 5dc042a + chunk 3 683d5df + chunk 4 a2c20fa +
chunks 5+6 multi-chunk consolidated 0288953 + chunk 7 aba5fe7 +
chunk 8 this commit). Brief-drafting cycle terminal close
approaching at ~Session 58 grade.
Next operational fire: Session 57 — chunk 9 brief-drafting at
framing #5 Logic Receipt consumer per cycle-close §7.6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 27 commits ahead of origin/staging (was 24 at Session 55 close + 1 Session 56 design `21eea02` + 1 Session 56 plan + 1 Session 56 chunk 8 brief = 27 at 3-commit close OR 28 at 4-commit close with correction commit). Adjust expected count to actual.

---

## Task 5: Update memory + Session 56 close summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunk_8_brief_shipped.md`
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunk 8 brief shipped topic memory file.**

Template per Sessions 51 + 52 + 53 + 54 + 55 chunk brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Chunk 8 five substantive axes (ACTION_NAMES + Migration + paymentService.record multi-consumer wiring + CA-27 parity test + apps/web/tests/integration/services/ NEW subdirectory)
- Banking surfaces materialized at Session 56 close (full enumeration; ten N+1 cumulative confirming-fire firings simultaneously + one NEW first-instance sub-pattern candidate Finding A Phase A split-discharge + Path B sub-grain catalog at four-grain depth MATERIALIZED)
- Validation gate state (pnpm agent:validate 26/26 green; working tree clean post-commits)
- Next operational fire (Session 57 chunk 9 brief-drafting at framing #5 Logic Receipt consumer per cycle-close §7.6 OR alternative founder operational adjudication)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 8 of 10 chunk briefs shipped; brief-drafting cycle terminal close approaching at ~Session 58 grade)

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_7_brief_shipped.md` entry. Format per project convention.

- [ ] **Step 3: Compose Session 56 close summary in conversation.**

Mirror Session 55 close summary shape. Cover:
- Three-commit Session 56 close shape (Session 56 design doc 21eea02 + Session 56 plan + chunk 8 brief) per Session 52 + 55 precedent inheritance — OR four-commit Session 56 close shape if Phase A surfaces material divergence requiring correction-commit-at-source per Sessions 53+54 precedent
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (27 commits ahead of origin/staging post-Session-56 3-commit close; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized (ten N+1 cumulative confirming-fire firings + one NEW first-instance candidate Finding A Phase A split-discharge sub-pattern)
- Next operational fire (Session 57 disposition: chunk 9 brief-drafting at framing #5 Logic Receipt consumer)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of Session 56 design doc §5 operational consequences covered by tasks (§5.1 chunk 8 five substantive surfaces + §5.2 substrate-load expectation + §5.3 forecast band + §5.4 envelope timing + §5.5 sequential brief-drafting cycle continuation)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunk 8 brief at composition close.
- [ ] **Type consistency:** All `ACTION_NAMES` references match canonical site at canUserPerformAction.ts; all `payment.record` literal usage consistent across ACTION_NAMES + migration + permissions table + role_permissions + CA-27 parity test; all `paymentService.record` references match Phase 5.1 substrate signature.
- [ ] **Path-citation drift:** All ADR-path + canonical code substrate path citations verified against Phase A grade verified paths. Special verification: `apps/web/src/services/auth/canUserPerformAction.ts` (single canonical site); `apps/web/src/services/spend/paymentService.ts` (NOT alternate paths); `apps/web/src/services/spend/billService.ts` (CA-27 parity inheritance source); `supabase/migrations/20240160000000_phase_8_chunk_8_*` (target slot per chunk 7 sequence inheritance).

---

## Operational Notes

**Single-subagent-per-chunk-brief dispatch shape**: Task 2 is the heaviest task at substrate-composition grade. Single-subagent dispatch with comprehensive briefing inheriting chunk 7 brief composition precedent (684 LOC most recent single-chunk-brief) + chunk 4 brief precedent (620 LOC sub-curve (a) anchor) + briefing-grade anti-drift discipline at composition START per Sessions 52 + 53 + 54 + 55 N=4 cumulative confirming-fire MATERIALIZED inheritance. WSL-side post-composition spot-check at Task 3 grade serves as preemptive backstop if briefing-grade prevention misses.

**Anti-drift discipline at every step**: substrate citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path + substrate-path verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=9 cumulative confirming-fire candidate if Phase A holds clean (Session 56 strengthens cumulative banking past N=3 promotion threshold + N=5+ hypothesis-strongly-confirmed trajectory grade).

**Briefing-explicitly-enumerated subset discipline at sub-grain (a) grade**: Per Session 55 Finding D + Session 56 design doc §3.3 discipline graduation framework: briefing at Task 2 grade EXPLICITLY enumerates ALL paths referenced (canonical ADR paths + canonical code substrate paths + Session 56 design doc canonical filename `21eea02` + Session 56 plan doc canonical filename + chunk 8 brief canonical filename) at composition START. NO commit-SHA inference OR session-context inference at briefing grade — sub-grain (b) drift risk fires at implicit-inference paths per Session 55 line 81 drift discovery precedent. Sub-grain (a) N=4 → N=5 cumulative confirming-fire MATERIALIZES if briefing-grade prevention holds at Session 56 grade.

**No ADR amendment paired at chunk 8 grade**: Per cycle-close §6.4: Layer 2 items A→chunk 7, B→chunk 9, C→chunk 10, D→chunk 1. Chunk 8 substrate-amendment-pairing ABSENT at framing #3 cross-service orchestrators grade — chunk 8 brief documents absence at substrate-pair shape grade vs chunk 7's substrate-pair shape (chunk 7 ships Layer 2 item #A; chunk 8 ships zero Layer 2 amendment). This is a substantively distinct substrate-pair shape for chunk 8 brief grade — section §2 in brief composition adjudicates absence-of-amendment framing at substrate-grade-grain accurate grade.

**Design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation framework**: Per brainstorming-side Finding D inheritance + Session 56 design doc §5.1 inheritance: design-doc grade specifies framing-level substantive surface enumeration + disposition adjudication + discipline firings catalog + forecast LOC; brief-drafting plan grade Task 1 Phase A verify-from-disk EXPLICITLY absorbs cycle-close §10.4 + §10.5 chunk 8 canonical surface enumeration at substrate-grade-grain accurate grade per design-doc-grade-vs-brief-drafting-plan-grade depth disambiguation sub-pattern N=1 first-instance materialization (Session 55 grade) preserved at Session 56 grade.

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade per Phase 7 chunk 7.3b first-fire + Session 50 chunk 1 second-fire precedent. Session 56 fires brief-drafting cycle; Grain 3 carries forward to chunk 8 impl future session at Sessions 59+ grade.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Session 68-70 per Session 54 close envelope refinement). Banks locally on staging branch at 27 commits ahead of origin/staging post-Session-56 3-commit close (was 24 at Session 55 close).

**Coordination warning posture**: Coordination warning N=23 → N=26 cumulative firing candidate at Task 4 commit grade (Sessions 43-56 cumulative; Session 56 fires 3 warnings at 3-commit close shape: design 21eea02 + plan + chunk 8 brief). Codification graduation candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with HIGH priority.

**Phase A split-discharge sub-pattern preservation across plan execution**: Per Session 56 design doc §6 Finding A inheritance: Phase A sub-grain (b) split-discharge grade applied at Session 56 grade — UNCONDITIONAL substrate-readiness checks (this plan's Task 1 Steps 1-3 git-state + validation-gate + working-tree-clean) discharged at session-onset BEFORE founder Candidate ratification; CONDITIONAL substrate verification (Task 1 Steps 4-15 chunk-8-specific substrate verification) discharges at post-ratification grade. Codification graduation candidate at Phase 8 retro Commit B grade routing per first-emergence + cumulative-evidence accumulation grade — Phase 8 remaining sessions (57 + 58 + chunk-impl 59-67 + retro 68-70) may fire sub-grain (b) split-discharge at confirming-fire grade.

**Brief-drafting cycle terminal close approaching**: Per cycle-close §9.5 + §7.6 + §7.7 inheritance: chunks 9 + 10 brief-drafting at Sessions 57 + 58 fires brief-drafting cycle TERMINAL CLOSE at ~Session 58 grade. Only 2 sessions remain to TERMINAL-cycle close after Session 56. Sub-grain (iv) TERMINAL-brief-drafting-cycle-shift at 100%-complete grade fires at Session 59+ canonical (post-brief-drafting cycle terminal close).
