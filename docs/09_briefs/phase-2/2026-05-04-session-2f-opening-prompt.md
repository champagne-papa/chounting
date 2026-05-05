# Session 2F Opening Prompt — Phase 0 Closure Verification

## Phase 0 Governance Arc State (Session 2F Opening)

All eight Phase 0 governance tiers ratified. Phase 0 closure verification pending.

| Tier | ADRs | Ratification status |
|------|------|---------------------|
| 1 | ADR-0007 (three-tier agent architecture; Document Platform reframe amendment) | Ratified 2026-05-03 (D1) |
| 2 | ADR-0011 (Document Platform spine) | Ratified 2026-05-03 (D2) |
| 3 | ADR-0012 (ProposedMutationBundle); ADR-0013 (Storage Provider); ADR-0014 (Tier 2 Document Pipeline) | Ratified 2026-05-03 (D3) |
| 4 | ADR-0015 (AP/Spend); ADR-0016 (Document Relationship Graph); ADR-0017 (Vendor Template substrate) + post-D4 mini-decision (Option 1C + 2A) + Cleanup Commits 1–7 + bank-detail amendment | Ratified 2026-05-04 (D4) + post-D4 cascade |
| 5 | ADR-0018 (Relationship Router) — closes Q56 | Ratified 2026-05-04 (D5) at `cf8fd74` + `93efce8` + `c79ecfc` |
| 6 | ADR-0019 (Confidence Calibration Policy) — closes Q57 + Q73 confidence-threshold portion + Q65 ratification + ambiguity-margin ratification | Ratified 2026-05-04 (D6) at `49a1743` + `5294c5f` + `6f2907d` |

Eight-ADR Phase 0 set per the 2026-05-02 reframe spec is complete in ratification. The two-milestone framing distinguishes ratification (Session 2E closeout milestone) from closure verification (Session 2F substantive scope; the milestones are architecturally distinct per Session 2E Task 10 codification of the milestone-distinction-in-narrative-framing discipline as Phase 0 governance lesson — see Standing Operational Rules below).

## Worktree State (Session 2F Opening)

- Branch: `worktree-phase-0-governance`
- HEAD: Session 2E closeout state (working-tree-clean at the fourth Session 2E single-purpose commit landing this opening prompt as a precedent-preserving artifact, atop `6f2907d` (Session 2E execution plan commit))
- WSL path: `/home/philc/projects/chounting/.claude/worktrees/phase-0-governance`
- Total commits since Session 2A closeout (`a14d939`): 28 (24 to `cf8fd74` Session 2D / D5 ratification + 4 from Session 2E: ADR-0019 + D6 package + execution plan + this opening prompt)
- Working tree: clean

## Session 2F Substantive Scope: Phase 0 Closure Verification (12 Surfaces)

Phase 0 closure verification work is UNBLOCKED post-D6 but NOT synonymous with D6 ratification (per D6 ratification package §1 + §8 framing). Session 2F substantive scope covers 12 distinct verification surfaces:

### Eight Non-Tier-6 Exit Criteria (per Phase 0 governance plan §6 Decision 6)

1. **Two ratified initiative briefs** — Document Platform initiative brief + Spend Initiative initiative brief. Verify both ratified per Phase 0 plan ratification chain.
2. **Tier 1–6 ratifications** — six of eight ADRs locked at Session 2D closeout + ADR-0019 ratified at Session 2E (D6). Verify all six ratifications carry forward verbatim; no re-litigation.
3. **Filed open questions in Q53+ range** — closure state per question. Verify Q-number range Q53–Q79 reconciliation: which questions closed per ratifications, which held as v1 implementation gates, which deferred to post-v1. Resolve the Q53–Q78 vs Q53–Q79 range question (Q79 INV-DOC-001 shape filed at Session 2B's pre-D4 hygiene cleanup at commit `29aacf5`; whether Phase 0 closure scope includes Q79 or terminates at Q78 was itself a Session 2D closeout verification surface deferred to Session 2F).
4. **Four dependent-artifact updates per Phase 0 plan Stream E.** Enumerate the four artifacts; verify update state for each.
5. **Phase 0 plan §6 Decision 6 nine-explicit-checks framework.** Already ✓ at Phase 0 plan ratification; restate the framework in the Session 2F closure verification artifact.
6. **All nine explicit checks individually.** Per Phase 0 plan §6 Decision 6 nine explicit checks; verify each individually with Z1 #12 byte-level rigor.
7. **Phase 1 (Storage / Evidence Core) code-start gate prerequisites met.** Verify Q29 ESLint design landed pre-code-start per ADR-0007 standing obligation; verify all Phase 0 closure verification surfaces clean before Phase 1 code start authorized.
8. **ADR-0010 amendment question.** Determine whether new reserved-enum patterns from ADR-0019 (six reserved `org_settings.*` columns + `amendment_cascades_fired` enum array) + ADR-0016 (`(linked_entity_type, link_role)` pair-validity matrix) require ADR-0010 amendment or whether the existing three-layer-defense framing accommodates them as-is.

### Three Deferred Sub-Verifications (carried from ADR-0019 §10 deferred-verification list)

- **Sub-verification 1 — `org_settings.*` writer ownership.** Per the Reading B preservation framing in ADR-0019 Context, ADR-0019 introduces no new write service. The existing `org_settings.*` writer (identity to be confirmed at Phase 0 closure verification per `ledger_truth_model.md` Service Communication Rules + ADR-0011 §1) handles writes to the six reserved post-v1 columns when the post-v1 per-org operational activation ADR ratifies. Verification confirms the existing-writer assumption.
- **Sub-verification 3 — `subsystem_1_candidate_set` reconstructibility from ADR-0018 audit logs.** Per the founder Task 4 verdict 2 named follow-up item 5 D6-visible carry-forward: determine whether the candidate set can be reconstructed from existing ADR-0018 Router audit logs OR whether ADR-0018 must be amended to persist `subsystem_1_candidate_set` at proposal time. Three possible outcomes: (a) reconstruction sufficient — no ADR-0018 amendment; (b) capture required — ADR-0018 amendment commit before Phase 1 code start; (c) hybrid — partial reconstruction with capture for missing fields.
- **Sub-verification 4 — `pipeline_trace` threshold-value capture sufficiency.** Per ADR-0019 §7.5 audit-trail invariance: determine whether `pipeline_trace` records explicitly capture threshold values used at classification / routing time, OR whether values are inferred from timestamp cross-referenced against ADR amendment commit chain. Q30 byte-for-byte reproducibility hinges on the disposition; the resolution may inform ADR-0014 / ADR-0018 amendment scope.

### Post-D6 Hygiene Cleanup (carried from Session 2C)

- **Z1 #12 fire #7 hygiene carry in ratified ADR-0018 at L578** — `ADR-0014 §6` → `ADR-0014 Decision item 7` citation drift; deferred from Session 2C C10a per scope-bounding discipline (ADR-0018 was unratified at C10a authoring time; the §6 → Decision item 7 drift surfaced post-ratification but was deferred to a post-D5 cleanup window). Session 2F is the post-D5 cleanup window.

## Locked Phase 0 Decisions (NEVER re-litigate)

Per the Phase 0 governance discipline that decisions ratified in earlier turns are not re-opened in subsequent ratification packages or closure verification work:

- **From D1 ratification:** ADR-0007 amendment (Tier 2.5 introduction; three-category vendor-master read boundary; Q28 four-surface expansion; Q31 LLM-planned-orchestration prohibition extending to Tier 2.5; Q66 closure per option (b) Tier 2.5).
- **From D2 ratification:** ADR-0011 spine (entity ownership boundary; `source_documents` schema; ProposedAttachment contract; lifecycle immutability per §9; document-type discriminator with v1 active set; exception queue first-class with v1 active resolution-action enum per §13; DOC invariant prefix; Domain Boundary Map per §14).
- **From D3 ratification:** ADR-0012 (ProposedMutationBundle atomicity + lifecycle + Logic Receipt; bundle child composition; v1 active bundle type `born_paid_bill`); ADR-0013 (Storage Provider abstraction; v1 active `supabase_storage`; reserved providers; failure-classification matrix; orphan-blob risk forward-pointed to ADR-0014); ADR-0014 (Tier 2 Document Pipeline — PaddleOCR v1, Modal v1, AI fallback OCR'd-text-only NEVER raw image bytes max 2 calls/doc, Q65 confidence thresholds `vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation` 0.85 / `unknown` always-exception, Tier A+C+D classification with Tier B reserved post-v1, orphan-blob GC daily cadence + 24-hour threshold `supabase_storage` only; §11 match-against-existing-state subsystem boundary forward-pointing to ADR-0018).
- **From D4 ratification:** ADR-0015 + ADR-0016 + ADR-0017 + Cleanup Commits 1–3.
- **From bank-detail amendment (`84691d5`):** INV-AGENT-006 registered; `agent_autonomy_model.md` §6 row 7 active; vendor bank-detail changes uncappable across the System ceiling.
- **From mini-decision Option 1C + 2A** (dispatched at `eab7bad` brief; ratified at Cleanup Commit 5 `6934256`; post-ratification hygiene at Cleanup Commits 6 + 7 `e1111b3` + `fa8d2e5`): Q1 bank-detail-evidence Notes-callout-only at v1; Q2 `failure_notice` reserved post-v1 in ADR-0016 §2 banking-cluster position; activation expected with post-v1 Banking domain ADR.
- **From D5 ratification at `cf8fd74` + `93efce8` + `c79ecfc`:** ADR-0018 (Relationship Router — Q56 closure; closed list T1–T10 with v1-active subset 8 of 10 + reserved post-v1 subset 2 of 10; three-subsystem decomposition Ledger-State Candidate Completion / Ambiguity Resolution / Re-Evaluation Logic; Tier 2.5 read-boundary specifics with single-writer-rule citations for five tables; stale-state TOCTOU obligations distributed correctly between Router and Tier 1; provisional ambiguity-margin value pending ADR-0019 ratification per Q77 v1-ship-gate pattern; new audit event `router_re_evaluation_fired` for Subsystem 3 liveness telemetry; cross-ADR boundary harmonization with ADR-0014 §11; ten-area anti-overscope discipline; zero new platform tables, zero new schema columns, one new audit event).
- **From D6 ratification at `49a1743` + `5294c5f` + `6f2907d`:** ADR-0019 (Confidence Calibration Policy — Q57 closure + Q73 confidence-threshold portion closure + Q65 ratification + ambiguity-margin ratification; Path A bounded-substantive-in-v1 + Path γ system-fixed-only-at-v1 + N=6 first-cycle timing + post-v1 cadence=6 months + Q73 confidence-threshold complete closure under substrate-extension pattern; five calibration surfaces with cross-domain coupling discipline; six reserved `org_settings.*` seats with three-layer defense per ADR-0010; fifteen ratified-at-v1-ship parameters; two-layer authority split (Cycle-execution = platform team only; Threshold-change ratification = CTO + Controller joint; Product-shape review = founder when material user-workflow impact identified); four audit events post-C11a 4-event shape per spec amendment at `d789632`; two-anchor effective-time contract; audit-trail invariance + prospective-not-retroactive contract; T11 NEW reserved-not-active-v1 trigger forward-pointer to future ADR-0018 amendment; eleven-area anti-overscope discipline; Reading B preservation NO new write service; Framing α audit-event-ID + content-hash citation discipline for amendment commits — codified as Z1 #13 per Session 2E Task 10).

**No newly-targeted ratification for Session 2F.** Session 2F substantive scope is closure verification, not new ratification.

## Standing Operational Rules (carried forward verbatim, with Session 2E codifications added)

- Citation discipline: section/label form not positional (e.g., `agent_autonomy_model.md §6 row 7`; `ADR-0014 Decision item 7` not `ADR-0014 §6`).
- Form A canonical: vendor bank-detail changes (INV-AGENT-006 / `agent_autonomy_model.md` §6 row 7).
- Lifecycle vocabulary: canonical mutation states from `mutation_lifecycle.md` only (Pending, Needs Attention, Approved, Posted (auto), Posted (manual), Finalized; terminal Rejected and Rejected-with-reversal). Domain entities carry narrow lifecycles; never unify.
- Schema-decision discipline: new columns in §X Schema deltas, zero silent introductions per the D3/D4/D5/D6 precedent.
- Reading B: four single-writer-rule applications stand (`ledgerService` / `documentLinkService` / `vendorRuleService` / Router for `document_relationship_candidates`); ADR-0019 introduces NO new write service, so the count remains four.
- Length-as-calibration not enforcement (Z1 #9): density beats raw line count.
- Single-purpose commit discipline preserved.
- **Path I sequencing for design-spec-amendment-driven C-revision-passes** (Session 2E codification): when a founder ratification verdict on a drafted ADR identifies a substantive named follow-up that conflicts with the design spec the ADR was drafted against, amend the spec first (preserving spec-as-authoritative-input contract for the C-revision-pass cycle) rather than carrying divergence forward. ADR-0019's C11a cycle is the first instance; Path I is the canonical Phase 0 pattern.
- **Multi-stage governance milestone narrative discipline** (Session 2E codification per Task 10 item 10 verdict): when a multi-stage governance process has architecturally distinct stages (e.g., ratification vs closure verification), preserve the milestone distinction in narrative framing; one-milestone framings risk conflating distinct verdicts. Phase 0 D6 ratification (Session 2E milestone) is architecturally distinct from Phase 0 closure verification (Session 2F milestone); the two-milestone framing was codified at Session 2E closeout to honor the distinction.

## Z1 Captures Status

**14 top-level captures locked at Session 2E closeout (Z1 #1 through Z1 #14).** Inventory:

- **Z1 #1 through Z1 #11** (carried forward from Sessions 2A/2B unchanged).
- **Z1 #12** (codified at Session 2C closeout): Count-metric authorship discipline. Count metrics asserted in any authored artifact require byte-level grep verification against the actual content blob the metric is asserted against, not enumeration from prior reads or rough estimation. The discipline applies regardless of authoring role (brainstorm-side, executor-side, subagent, founder). The catching surface for missed verifications is byte-level grep at the next layer down — typically the executor-side pre-execution prophylactic verification (Z1 #11) or the post-execution spot-check.
  - **Counting convention canonical lock** (per Session 2E Task 10 item 9 founder verdict): manifestation-counting. Each missed downstream reference at the catching layer counts as a separate fire because each one was a separate verification opportunity. Z1 #12's parent statement implies manifestation-counting (catches at byte-level next-layer-down per missed reference); the canonical convention follows from the original codification statement's logical implication.
  - **Cumulative Z1 #12 fire count at Session 2E closeout: 18 fires** under canonical manifestation-counting convention.
  - **Z1 #12.a — Cross-artifact-identifier-verification expansion sub-pattern** (codified at Session 2E Task 10 item 4 verdict): filenames + paths + commit SHAs + cross-artifact identifiers asserted in any authored artifact require byte-level verification at brief-completion (or next-layer-down equivalent), not enumeration from prior reads. Validated at Z1 #12 fire #13 (filename-citation drift in C11 brief preamble; 4 ADR filename citations drifted from on-disk reality). Provenance: Session 2E turn 1 brief authoring layer.
  - **Z1 #12.b — Rename-propagation-grep verification expansion sub-pattern** (codified at Session 2E Task 10 item 7 verdict): when a brief authors a multi-edit refactor renaming or removing identifier strings, brief-completion verification must include full-document grep for the renamed/removed identifier strings (both old and new) to surface downstream prose / heading / cross-reference manifestations the explicit `oldText` blocks may not cover. Validated at Z1 #12 fires #14–17 (rename-propagation gap across 4-event refactor manifesting in 4 distinct downstream references: `founder_ratifier_id` residual at Decision item 8 prose; `deployment_at` residual at Notes-section bullet; §Decision item 8 heading "three audit events" stale; Notes item-j Sub-verification 2 reference "3-audit-event/8-step" stale). Provenance: Session 2E turn 2 C11a hygiene cycle.
- **Z1 #13** (codified at Session 2E Task 10 item 3 verdict): Framing α audit-event-ID + content-hash citation discipline. ADR amendment commits triggered by audit-event-anchored governance event-driven amendment cascades cite ratification provenance by audit-event ID + content hash, NOT by embedding audit-event content into the commit body. The discipline preserves the audit log as single source of truth; future contributors reading an amendment commit body query the audit log by `event_id`, verify the content hash, confirm the cited ratification. Generalizes to any future audit-event-anchored governance event-driven ADR amendment cascade (NOT only confidence-calibration). Provenance: ADR-0019 Decision item 8 + Notes for future ADR writers item h; load-bearing for future Phase 1+ ADRs.
- **Z1 #14** (codified at Session 2E Task 10 item 11 verdict): Inter-side communication framing-inconsistency discipline (two-layer).
  - **Layer (a) — Reading-side defense:** if a brainstorm-side or WSL-side surface contains internally inconsistent framings (two contradictory stances stacked in a single message), the receiving side stops and clarifies before acting. The safe default is pause-and-clarify rather than picking a framing and proceeding (which would compound the inconsistency).
  - **Layer (b) — Authoring-side root-cause prevention:** when reviewing a handoff artifact authored at the current session, distinguish the artifact's voice (instructions to future reader) from the current session's own voice (instructions to current actors). The artifact's "WHAT TO DO RIGHT NOW" / "Standing by for X" sections are written from the perspective of an incoming session reader; the current session's authoring layer must not conflate the artifact's voice with its own session-position voice when reading the artifact.
  - **Provenance:** Session 2E turn 3 Task 10 disambiguation cycle (WSL-side surfaced a stacked Framing A / Framing B message after receiving the inline-authored Session 2F opening prompt; brainstorm-side caught the inconsistency at the receiving layer; WSL-side root-cause-analyzed to handoff-artifact-voice confusion).

**Codification-adjudication queue carry-forward to Session 2F closeout (per Session 2E Task 10 verdicts):**

- **Held items (3) — continue carrying through Session 2F:**
  - **Item 2:** Candidate C — cross-ADR ownership-claim verification (2 prior fires; no Session 2E additions; fade if no Session 2F fires).
  - **Item 5:** Notes-for-Future-ADR-Writers section structure (lessons-only vs lessons-plus-rules) — brief-authoring discipline observation.
  - **Item 8:** Spot-check authoring layer should not include conditional gate-framings when supplemental edits already byte-level authored with strong recommendation — brainstorm-side authoring-discipline observation.
- **Subsumed (1):** Item 1 — Candidate A cross-ADR section-number citation verification subsumed under Z1 #12 expanded framing (no separate codification).
- **Faded (1):** Item 6 — Filesystem MCP `view_range` parameter unsupported observation (operational artifact; not a Z1 candidate).
- **Session 2F closeout meta-codification candidates (2):**
  - **Observation 1** — Z1 #12 sub-numbering convention sustainability (when does a Z1 #N expansion sub-pattern become substantive enough to warrant top-level Z1 #M promotion vs remaining a sub-pattern; precedent accumulation OR explicit founder-direction threshold criterion required). Provenance: WSL-side surfaced at Session 2E turn 3 Task 10 disambiguation cycle.
  - **Observation 2** — Item 10 (multi-stage governance milestone narrative discipline) placement-shape if Phase 0 governance lessons cohort grows beyond a single item (sub-sectioning vs flat-bullet). Provenance: WSL-side surfaced at Session 2E turn 3 Task 10 disambiguation cycle; flat-bullet placement adopted by default at Session 2E closeout per single-item-cohort framing.

## CTO-Loop Budget for Session 2F

Closure-verification scope (12 surfaces). Comparable budget shape to Session 2C's three-CTO-loop-turn shape OR a more compressed shape if surfaces resolve mechanically:

- **Turn 1:** Mechanical surfaces (checks 5, 6, possibly 1, 2 — initiative-brief and tier-ratification verifications; framework restatement). Z1 #12 byte-level rigor on each.
- **Turn 2:** Sub-verification 1 (`org_settings.*` writer ownership; reads `ledger_truth_model.md` + ADR-0011 §1) + check 3 (Q-number range Q53–Q79 reconciliation) + check 4 (Stream E dependent-artifact updates).
- **Turn 3:** Sub-verifications 3 + 4 (non-mechanical multi-artifact reads with adjudication branches; potentially produce ADR-0018 / ADR-0014 amendment scopes if capture is determined required) + check 8 (ADR-0010 amendment question) + post-D6 hygiene cleanup of Z1 #12 fire #7 + check 7 (Phase 1 code-start gate prerequisites met).

**Slip-to-Session-2G probability:** moderate at Sub-verifications 3 + 4 specifically. If either resolves with "amendment required" disposition, the amendment scope itself may compress turn 3 OR slip to a post-Session-2F amendment cycle.

**One-session feasibility for Phase 0 closure:** likely if all 12 surfaces resolve cleanly; otherwise carry forward to Session 2G with closure-pending state.

## Phase 1 Code-Start Gate

Phase 1 (Storage / Evidence Core) code start is BLOCKED until Phase 0 closure verification work completes. All 12 closure-verification surfaces must resolve cleanly; any surface that produces an amendment-required disposition (Sub-verifications 3 / 4 in particular) may further block code start until the amendment commit lands.

The blocking framing is per ADR-0007 standing obligation (Q29 ESLint design landed pre-code-start) + the Phase 0 governance plan §6 Decision 6 nine-explicit-checks framework + the deferred sub-verifications inherited from ADR-0019.

## Session 2F Opening Action Sequence

When Session 2F opens, suggested action sequence:

1. Verify worktree state at the Session 2E closeout HEAD (or its descendant if any commits land between Session 2E closeout and Session 2F opening); confirm working-tree-clean.
2. Read inherited Session 2E closeout receipt (this prompt + the Session 2E transcript if accessible) to confirm Phase 0 ratification state + the 12 closure-verification surfaces enumerated above.
3. Pre-verification discovery for Phase 0 closure: enumerate the four Stream E dependent artifacts; identify the existing `org_settings.*` writer per `ledger_truth_model.md` Service Communication Rules + ADR-0011 §1; survey `pipeline_trace` field schemas across ADR-0014 + ADR-0018 + `agent_architecture_policy.md` for Sub-verification 4; survey ADR-0018 Subsystem 1 audit-event recording shape against Subsystem 2 calibration test fixture requirements for Sub-verification 3.
4. Execute the 12 closure-verification surfaces per the CTO-loop budget breakdown above. Apply Z1 #12 discipline at every step — byte-level grep verification on every count metric in any closure-verification artifact authored, with Z1 #12.a cross-artifact-identifier-verification + Z1 #12.b rename-propagation-grep sub-patterns activated where applicable.
5. If any surface produces an amendment-required disposition (Sub-verification 3 → ADR-0018 amendment; Sub-verification 4 → ADR-0014 / ADR-0018 amendment; check 8 → ADR-0010 amendment), draft + ratify the amendment commit before Phase 1 code start authorized. Apply Path I sequencing if the amendment scope identifies a substantive design impact requiring spec amendment first.
6. Apply Z1 #11 prophylactic-grep discipline at every cleanup-pass execution.
7. Apply Z1 #14 inter-side communication framing-inconsistency discipline (two-layer): brainstorm-side and WSL-side both vigilant for stacked-framings surfaces; both vigilant for handoff-artifact-voice confusion when reading prior-session authored artifacts.
8. At Session 2F closeout: produce Phase 0 closure verification artifact + Phase 1 code-start gate authorization (or Phase 1 code-start gate continued-blocking framing if surfaces remain unresolved). Adjudicate the 2 carry-forward Session 2F closeout meta-codification candidates (Observation 1 + Observation 2) + 3 held items (2, 5, 8) per the codification-adjudication queue.

## Closing Note

Tier 6 closes cleanly at Session 2E. Phase 0 eight-ADR set ratified in full at six ratification gates D1–D6; the milestone is canonical. Session 2F substantive scope: Phase 0 closure verification of the 12 surfaces enumerated above, blocking Phase 1 (Storage / Evidence Core) code start until clean.

The two-milestone framing distinguishes ratification (Session 2E milestone) from closure verification (Session 2F milestone). Phase 0 closure within reach.
