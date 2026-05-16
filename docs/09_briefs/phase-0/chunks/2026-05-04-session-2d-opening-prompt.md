# Session 2D Opening Prompt — Tier 6 (ADR-0019 Confidence Calibration Policy)

## Phase 0 Governance Arc State (Session 2D Opening)

Five Phase 0 governance tiers locked. One tier remaining.

| Tier | ADRs | Ratification status |
|------|------|---------------------|
| 1 | ADR-0007 (three-tier agent architecture; Document Platform reframe amendment) | Ratified 2026-05-03 (D1) |
| 2 | ADR-0011 (Document Platform spine) | Ratified 2026-05-03 (D2) |
| 3 | ADR-0012 (ProposedMutationBundle); ADR-0013 (Storage Provider); ADR-0014 (Tier 2 Document Pipeline) | Ratified 2026-05-03 (D3) |
| 4 | ADR-0015 (AP/Spend); ADR-0016 (Document Relationship Graph); ADR-0017 (Vendor Template substrate) + post-D4 mini-decision (Option 1C + 2A) + Cleanup Commits 1–7 + bank-detail amendment | Ratified 2026-05-04 (D4) + post-D4 cascade |
| 5 | ADR-0018 (Relationship Router) — closes Q56 | Ratified 2026-05-04 (D5) at `cf8fd74` + `93efce8` |
| 6 | ADR-0019 (Confidence Calibration Policy) — closes Q57 | **Pending — Session 2D scope** |

## Worktree State (Session 2D Opening)

- Branch: `worktree-phase-0-governance`
- HEAD: Session 2C closeout state (working-tree-clean at the fourth Session 2C single-purpose commit landing this opening prompt as a precedent-preserving artifact, atop `c79ecfc` (Session 2C plan commit))
- WSL path: `/home/philc/projects/chounting/.claude/worktrees/phase-0-governance`
- Total commits since Session 2A closeout (`a14d939`): 22 (18 to `fa8d2e5` Session 2C handoff anchor + 4 from Session 2C: ADR-0018 + D5 package + plan + this opening prompt)
- Working tree: clean

## Tier 6 Drafting Context (ADR-0019)

ADR-0019 Confidence Calibration Policy is the algorithmic-apex calibration ADR that ratifies the Phase 0 v1 confidence threshold values per the Q77 v1-ship-gate pattern. Substantive scope:

**Closes Q57** — Calibration governance: who calibrates, against what test set, how often, with what audit trail, with what controls on threshold value adjustments. The governance question is distinct from the values themselves (which are owned by ADR-0014 §6 Q65 + ADR-0018 ambiguity-margin Q77-pattern).

**Ratifies (per Q77 v1-ship-gate pattern):**

- Q65 v1 provisional confidence threshold values from ADR-0014 §6: `vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation` 0.85 / `unknown` always-exception. ADR-0019 ratifies these at v1 ship time; if ratification adjusts values, an ADR-0014 amendment cascade follows.
- ADR-0018 ambiguity-margin threshold value (provisional in v1; Router-implementation default at v1 ship). ADR-0019 ratifies the value at v1 ship; if ratification adjusts, an ADR-0018 amendment cascade follows.
- Possibly governs the post-v1 vendor-template enforcement calibration that ADR-0017 forward-pointed (per ADR-0017's substrate-now-enforcement-later framing). Whether vendor-template auto-post calibration falls under ADR-0019's Q57 governance scope OR a separate post-v1 vendor-template-enforcement ADR is a Session 2D drafting decision.

**Anti-overscope discipline expected** vs ADR-0014 (per-document-type confidence values), ADR-0018 (ambiguity-margin algorithmic placement), ADR-0017 (vendor-template post-v1 enforcement scope), ADR-0011 (entity ownership), ADR-0007 (Tier 2.5 calibration timing). Multi-area boundary callout per the D4/D5 anti-overscope precedent.

**Schema deltas expected:** likely zero new platform tables; possibly one or more reserved audit-event types for calibration governance (e.g., `confidence_threshold_calibrated`, `calibration_run_completed`, `calibration_test_set_published`); possibly new `org_settings.*` columns for per-org calibration cadence/test-set-version per ADR-0010 reserved-enum-states discipline. Schema-decision discipline preserved per the D2/D3/D4/D5 precedent.

**Provisional values expected:** the calibration governance itself ships substantive in v1; per-org calibration cadence values may be provisional at v1 with ADR-0019 ratifying them at v1 ship time per the Q77 pattern (recursive provisional-pending-v1-ship if applicable).

**Length calibration target:** ADR-0019 inherits the broader-scope Z1 #9 band (1400–2000 lines) per Tier 5/Tier 6 algorithm-apex framing. Substrate-only-v1 framing analogous to ADR-0017 may pull length lower (toward 1100–1400) if calibration governance ships substrate-only; full-enforcement framing pulls length toward upper band. Density beats raw line count per Z1 #9.

## Locked Phase 0 Decisions (NEVER re-litigate)

Per the Phase 0 governance discipline that decisions ratified in earlier turns are not re-opened in subsequent ratification packages:

- **From D1 ratification (`a14d939` predecessor):** ADR-0007 amendment (Tier 2.5 introduction; three-category vendor-master read boundary; Q28 four-surface expansion; Q31 LLM-planned-orchestration prohibition extending to Tier 2.5; Q66 closure per option (b) Tier 2.5).
- **From D2 ratification:** ADR-0011 spine (entity ownership boundary; `source_documents` schema; ProposedAttachment contract; lifecycle immutability per §9; document-type discriminator with v1 active set; exception queue first-class with v1 active resolution-action enum per §13; DOC invariant prefix; Domain Boundary Map per §14).
- **From D3 ratification:** ADR-0012 (ProposedMutationBundle atomicity + lifecycle + Logic Receipt; bundle child composition; v1 active bundle type `born_paid_bill`); ADR-0013 (Storage Provider abstraction; v1 active `supabase_storage`; reserved providers; failure-classification matrix; orphan-blob risk forward-pointed to ADR-0014); ADR-0014 (Tier 2 Document Pipeline — PaddleOCR v1, Modal v1, AI fallback OCR'd-text-only NEVER raw image bytes max 2 calls/doc, Q65 confidence thresholds `vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation` 0.85 / `unknown` always-exception, Tier A+C+D classification with Tier B reserved post-v1, orphan-blob GC daily cadence + 24-hour threshold `supabase_storage` only; §11 match-against-existing-state subsystem boundary forward-pointing to ADR-0018).
- **From D4 ratification:** ADR-0015 (AP/Spend Subdomain — Q59/Q60 v1/Q61/Q62/Q63/Q64/Q74 AP/Spend domain rows/Q78 closures; INV-AGENT-006 enforcement at `vendorService.update()`); ADR-0016 (Document Relationship Graph — Q55 closure; `linked_entity_type` + `link_role` enum membership; pair-validity matrix at 756 cells post-mini-decision; cascade behavior; pre-commit/post-commit boundary; `documentLinkService` single-writer rule); ADR-0017 (Vendor Template Substrate — Q60 post-v1 portion; substrate-only-v1 framing; `vendor_rules` table with nullable `legal_entity_id` multi-entity reservation per ADR-0011 §10; `vendorRuleService` single-writer rule; substrate-now-enforcement-later pattern fourth Phase 0 application). Cleanup Commits 1–3.
- **From bank-detail amendment (`84691d5`):** INV-AGENT-006 registered; `agent_autonomy_model.md` §6 row 7 active; vendor bank-detail changes uncappable across the System ceiling.
- **From mini-decision Option 1C + 2A** (dispatched at `eab7bad` brief; ratified at Cleanup Commit 5 `6934256`; post-ratification hygiene at Cleanup Commits 6 + 7 `e1111b3` + `fa8d2e5`): Q1 bank-detail-evidence Notes-callout-only at v1; Q2 `failure_notice` reserved post-v1 in ADR-0016 §2 banking-cluster position; activation expected with post-v1 Banking domain ADR.
- **From D5 ratification at `cf8fd74` + `93efce8`:** ADR-0018 (Relationship Router — Q56 closure; closed list T1–T10 with v1-active subset 8 of 10 + reserved post-v1 subset 2 of 10; three-subsystem decomposition Ledger-State Candidate Completion / Ambiguity Resolution / Re-Evaluation Logic; Tier 2.5 read-boundary specifics with single-writer-rule citations for five tables; stale-state TOCTOU obligations distributed correctly between Router and Tier 1; provisional ambiguity-margin value pending ADR-0019 ratification per Q77 v1-ship-gate pattern; new audit event `router_re_evaluation_fired` for Subsystem 3 liveness telemetry; cross-ADR boundary harmonization with ADR-0014 §11; ten-area anti-overscope discipline; zero new platform tables, zero new schema columns, one new audit event).

**Newly-targeted for Session 2D ratification:** ADR-0019 (Confidence Calibration Policy; Tier 6; depends on all five locked tiers).

## Standing Operational Rules (carried forward verbatim)

- Citation discipline: section/label form not positional (e.g., `agent_autonomy_model.md §6 row 7`).
- Form A canonical: vendor bank-detail changes (INV-AGENT-006 / `agent_autonomy_model.md` §6 row 7).
- Lifecycle vocabulary: canonical mutation states from `mutation_lifecycle.md` only (Pending, Needs Attention, Approved, Posted (auto), Posted (manual), Finalized; terminal Rejected and Rejected-with-reversal). Domain entities carry narrow lifecycles; never unify.
- Schema-decision discipline: new columns in §X Schema deltas, zero silent introductions per the D3/D4/D5 precedent. The ADR-0013 `original_storage_key` precedent is the canonical example.
- Reading B: `ledgerService` sole writer of `journal_entries`/`journal_lines`; `documentLinkService` sole writer of `source_document_links`; `vendorRuleService` sole writer of `vendor_rules`; ADR-0019 may establish a fourth single-writer-rule application for any new calibration-governance service it introduces.
- Length-as-calibration not enforcement (Z1 #9): density beats raw line count.
- Single-purpose commit discipline preserved.

## Z1 Captures (12 locked + 2 in candidate state)

**12 captures locked:**

- 11 from Sessions 2A/2B carried forward unchanged.
- **Z1 #12** (newly codified at Session 2C closeout): Count-metric authorship discipline. Count metrics asserted in any authored artifact (cleanup briefs, ratification packages, execution plans, handoff anchors, or any future authoring layer) require byte-level grep verification against the actual content blob the metric is asserted against, not enumeration from prior reads or rough estimation. The discipline applies regardless of authoring role (brainstorm-side, executor-side, subagent, founder). The catching surface for missed verifications is byte-level grep at the next layer down — typically the executor-side pre-execution prophylactic verification (Z1 #11) or the post-execution spot-check. Validation surfaces: C10a §16 occurrence miscount; C10b 756 occurrence miss; C10b match-against-existing-state lowercase miss; D5 §2 commit-chain drift; D5 plan Task 1 Step 4 grep-count drift. Five fires across three authoring contexts at codification; sixth fire (Session 2D opening prompt's "26 filed" count drift) demonstrated the discipline's operational value within minutes of codification at a fourth distinct authoring context (session-handoff-prompt authoring).

**2 candidates held in candidate state for Session 2D revisit:**

- **Candidate A:** Cross-ADR section-number citation verification. 1 validation surface (C10 §16/§9 drift). Lower codification priority; revisit at Session 2D closeout.
- **Candidate C:** Cross-ADR ownership-claim verification. 1 validation surface (C10b Subsystem 1 vs ADR-0014 §11 conflict caught only via founder verdict, not brainstorm-side review). Lower codification priority; revisit at Session 2D closeout.

## CTO-Loop Budget for Session 2D

Single-ADR scope (ADR-0019). Comparable budget shape to Session 2C's three-CTO-loop-turn shape:

- **Turn 1:** ADR-0019 drafting dispatch (subagent or inline) + brainstorm-side review of returned draft + possible C11a hygiene revision pass per the C10a precedent.
- **Turn 2:** Founder verdict on draft + C11b cleanup pass if founder names follow-ups (per the C10b precedent) + brainstorm-side spot-check + possible C11c residual correction (per the C10c precedent if Candidate B fires again).
- **Turn 3:** D6 ratification package authoring + WSL-side D6 write + brainstorm-side post-write spot-check + founder D6 ratification verdict + post-ratification commits per the D1/D2/D3/D4/D5 precedent.

One-session feasibility is the calibrated expectation. Session 2D closes Phase 0 if Tier 6 ratifies clean.

## Phase 0 Closure Pending After Tier 6

Per the Phase 0 governance plan §6 Decision 6's nine explicit exit criteria, Phase 0 closure requires more than just Tier 6 ratification:

- ✓ Two ratified initiative briefs (Document Platform + Spend Initiative).
- ✓ Tier 1–5 ratifications (six of eight ADRs locked).
- **Pending:** Tier 6 ratification (ADR-0019 — Session 2D scope).
- **Pending verification at Phase 0 closeout:** filed open questions in the Q53+ range; the exact count and range to be verified at Phase 0 closeout via `wc -l` / `grep` against `open_questions.md`. WSL-side flagged at Session 2C closeout that Q79 (INV-DOC-001 shape, post-v1 reserved per ADR-0011 §15) was filed during Session 2B's pre-D4 hygiene cleanup at commit `29aacf5`; whether the Phase 0 closure scope includes Q79 or terminates at Q78 is itself a Session 2D closeout verification surface. Some questions are closed per ratifications, others held as v1 implementation gates or post-v1 deferrals — Session 2D verifies the closure state for each.
- **Pending verification at Phase 0 closeout:** four dependent-artifact updates per the Phase 0 plan Stream E.
- ✓ Phase 0 plan §6 Decision 6 nine-explicit-checks framework.
- **Pending verification at Phase 0 closeout:** all nine explicit checks individually.
- **Pending:** Phase 1 (Storage / Evidence Core) code start gate.
- **Pending:** ADR-0010 amendment (if a new reserved-enum pattern was introduced in Phase 0 — possibly the `(linked_entity_type, link_role)` pair-validity matrix from ADR-0016).

Session 2D substantive scope is Tier 6 ratification. Phase 0 closure verification of the eight non-Tier-6 criteria is a Session 2D closing-step deliverable.

## Session 2D Opening Action Sequence

When Session 2D opens, suggested action sequence:

1. Verify worktree state at the Session 2C closeout HEAD (or its descendant if any commits land between Session 2C closeout and Session 2D opening); confirm working-tree-clean.
2. Read inherited Session 2C closeout receipt (this prompt + the Session 2C transcript if accessible) to confirm Phase 0 ratification state.
3. Pre-dispatch discovery for ADR-0019 drafting: read ADR-0014 §6 (Q65 v1 provisional confidence threshold values), ADR-0018 §3 (Subsystem 2 ambiguity-margin Q77-pattern provisional value), ADR-0017 §6 (vendor-template substrate-now-enforcement-later forward-pointer to calibration governance), and `open_questions.md` Q57 entry (calibration governance scope as filed).
4. Dispatch ADR-0019 drafting per the Phase 0 governance plan Task C11 (Tier 6) per the C7/C8/C9/C10 precedent (subagent dispatch with calibrated brief; inline drafting alternative if scope shape suggests it; brainstorm-side returns a calibrated drafting brief in either case).
5. Apply Z1 #12 discipline at every authoring step — byte-level grep verification on every count metric in cleanup briefs, ratification packages, execution plans, and any other authored artifact.
6. Apply Z1 #11 prophylactic-grep discipline at every cleanup-pass execution — pre-execution case-insensitive grep on every count-target string before applying any edit.

## Closing Note

Tier 5 closes cleanly at Session 2C. Five Phase 0 governance tiers locked; one tier remaining (Tier 6 ADR-0019 Confidence Calibration Policy). Session 2D substantive scope: Tier 6 ratification + Phase 0 closure verification of the eight non-Tier-6 exit criteria.

Phase 0 closure within reach.
