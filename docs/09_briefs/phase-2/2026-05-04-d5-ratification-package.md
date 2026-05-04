# D5 Ratification Package — Tier 5 (ADR-0018 Relationship Router)

## §1 Purpose and scope

Single-ADR Tier 5 ratification package. Covers ADR-0018 (Relationship Router) at the post-C10b+C10c on-disk state (1681 lines, untracked at the worktree branch tip). ADR-0018 drafted-not-ratified per Phase 0 plan; D5 is the ratification gate that closes Tier 5 of the eight-ADR Phase 0 set. Tier 6 (ADR-0019 Confidence Calibration Policy) splits to Session 2D per the Session 2C calibrated handoff authorization.

Single-ADR scope means the §4 cross-trio territory matrix (the discipline this package added vs D3) collapses for D5 — no co-tier siblings to cross-check against. The substantive review burden is concentrated in §3 ADR-0018 verdict; §6 discoverability notes capture the C10a / C10b / C10c revision passes that produced the post-C10b+C10c state ratified here.

## §2 Tier 5 commit chain

Pre-ratification commit chain since Session 2A closeout (`a14d939`): inherits the full D4 chain through `3577484` (Cleanup Commits 1–3) plus Session 2B closeout commits and Session 2C work-in-progress.

```
... (D4 chain through 3577484 — Tier 4 trio + Cleanup Commits 1-3) ...
e71ecc1 D4 ratification: CTO ratified ADR-0015 / ADR-0016 / ADR-0017 with named follow-ups
25ddbc6 Cleanup Commit 4 (post-D4 hygiene): Tier 4 trio named-follow-ups closeout
eab7bad mini-decision dispatch brief: evidence-link coordination (Option 1C + 2A bundled)
6934256 Cleanup Commit 5 (post-D4 mini-decision): evidence-link coordination ratification (Option 1C + 2A)
e1111b3 Cleanup Commit 6 (post-Cleanup-Commit-5 hygiene): ADR-0016 §3 preamble scope-based wording
fa8d2e5 Cleanup Commit 7 (post-Cleanup-Commit-6 hygiene): ADR-0016 drift residual closeout (operationally serves as Session 2C handoff anchor)
[untracked] ADR-0018: Relationship Router (1681 lines post-C10a + C10b + C10c)
```

ADR-0018 is **untracked** at the worktree branch tip; D5 ratification triggers the commit. Per the D1/D2/D3/D4 precedent, post-ratification commits land as separate single-purpose commits: one for the post-C10a + C10b + C10c ADR-0018 file, one for the D5 ratification package file. No cleanup commits authored by D5 itself — the C10a / C10b / C10c revision passes were applied during ADR-0018 drafting (pre-ratification), not as post-ratification cleanups. The pre-D5 worktree state already incorporates Cleanup Commits 4–7 from the post-D4 / post-mini-decision hygiene cascades, which are locked-in per §7 and not re-litigated by D5.

## §3 Per-ADR ratification verdict

### §3.1 ADR-0018 (Relationship Router) — ratify-as-is

- **Closes:** Q56 (Relationship Router re-evaluation triggers) — three deliverables: closed list T1–T10 (v1-active subset T1/T2/T3/T4/T5/T6/T8/T10; reserved post-v1 T7/T9), audit-trail shape for routing-decision changes (`pre_commit_link_rerouted` per ADR-0016 §6 + new `router_re_evaluation_fired` for liveness telemetry), immutability boundary citation (owned by ADR-0011 §9 + ADR-0016 §6, not redrafted).

- **Does NOT close:**
  - Q28 (Q28 matrix expansion landing in `agent_architecture_policy.md` per Q77 v1-ship gate — ADR-0018 cites Q28 surface 2 relationship-claim re-verification + Q28 surface 3 stale-state TOCTOU as the Router's commit-time contract with Tier 1; does NOT redraft the matrix).
  - Q66 (Relationship Router tier placement — already closed by ADR-0007 §Amendment 2026-05-03 per option (b) Tier 2.5; ADR-0018 inherits, does NOT re-close).
  - Q76 (immutability boundary — owned by ADR-0011 §9 + ADR-0016 §6; ADR-0018 inherits the immutability framing for Subsystem 3 re-evaluation policy, does NOT redraft the boundary itself).
  - Q77 (Q28 matrix expansion scope — still open per ADR-0007 §Amendment; v1-ship gate not v1-code gate).

- **Length:** 1681 lines vs broader-scope target band 1400–2000 (within target; lower-band density preferred per Z1 #9). Tier 5 ADR (Relationship Router algorithm) inherits the broader-scope calibration framing per Z1 #9 — line count is calibration not enforcement; density of substance is the bar. The Phase 0 length trend converges: ADR-0014 2003, ADR-0015 1771, ADR-0016 1644, ADR-0017 1328, ADR-0018 1681 — back inside band after the substrate-only ADR-0017 dipped below upper band; broader-scope ADR-0018 expected slightly above density-optimized lower band given the Q56 closure substance + three-subsystem decomposition + ten triggers + Tier 2.5 read-boundary specifics + stale-state TOCTOU obligations + ADR-0014/0019 integration points.

- **Anti-overscope:** explicit boundary callout against ADR-0016 (schema substrate), ADR-0014 (OCR/extraction/classification — including the cross-ADR Subsystem 1 boundary at ADR-0014 §11), ADR-0015 (AP/Spend domain decisions), ADR-0019 (confidence calibration governance), ADR-0011 §7 (ProposedAttachment primitive), ADR-0016 §1 single-writer rule (`source_document_links` writes), ADR-0017 (vendor template substrate), `agent_architecture_policy.md` (Q28 matrix expansion scope), Q66 closure venue (ADR-0007 §Amendment), Q76 closure venue (ADR-0011 §9 + ADR-0016 §6). Ten-area explicit boundary callout — broader than D4's six-area callouts because Tier 5's ADR sits at the algorithmic apex consuming all Tier 1-4 substrate.

- **Reading B preservation:** triple-redundant across Phase 0 dependency context section, Decision item 1 Tier 2.5 safety contract restatement, and Tier 2.5 read-boundary specifics §5. The Router is the **first algorithmic component** that reads committed ledger state at proposal time; Reading B's load-bearing constraint (`ledgerService` sole writer of `journal_entries`/`journal_lines`; `documentLinkService` sole writer of `source_document_links`) is preserved by the Router's read-only-against-ledger contract enforced mechanically via ADR-0007 §Tier 2.5 + Q29 ESLint rule. Single-writer-rule citations for `source_document_links`, `journal_entries`/`journal_lines`, `source_documents`/`source_document_versions`/`document_artifacts`, `document_relationship_candidates` (the table the Router IS sole writer of), and `audit_log` are enumerated explicitly at §5.

- **Cross-ADR boundary with ADR-0014 §11 (mechanical, not conventional):** ADR-0014 §11 specifies that its match-against-existing-state subsystem produces structural / reference-data-resolvable candidates, with explicit forward-pointer text ("When the subsystem's output requires reading committed accounting state ... the relationship candidate is an **incomplete candidate** that flows into the Relationship Router (ADR-0018, Tier 2.5) for completion"). ADR-0018 Subsystem 1 (renamed from "Match-Against-Existing-State" to "Ledger-State Candidate Completion" via C10b Edit 2.2) is the completion stage; the boundary is restated in 3 places (Decision item 1 decomposition list, Decision item 2 opening paragraph, Notes for future ADR writers cross-ADR boundary bullet). Neither ADR is amended by this framing — the boundary is restated to make Subsystem 1 ownership unambiguous between the two ADRs.

- **Schema deltas:** zero new platform tables, zero new source-document schema columns, zero new closed enums. **One new audit event:** `router_re_evaluation_fired` (Subsystem 3 dispatcher liveness telemetry; distinct from the existing `pre_commit_link_rerouted` per ADR-0016 §6). The audit event flows through the canonical audit-log writer per ADR-0011 §1; lands inside the dispatcher's transaction so re-evaluation telemetry is atomic with any candidate-row mutation. The trigger identifier strings T1–T10 and the `decision_outcome` four-string vocabulary are documented as event-payload constraints, not promoted to schema-level closed enums (no service-behavior path branches on the value at v1; promotion follows ADR-0010 reserved-enum-states discipline if a future feature gates behavior on the value).

- **Provisional values per Q77 v1-ship-gate pattern:** the ambiguity-margin threshold value in Subsystem 2 is provisional in v1 pending ADR-0019 ratification at v1 ship time (same provisional-pending-v1-ship pattern as ADR-0014 §6 Q65 confidence threshold values and ADR-0007 §Q77 Q28 matrix). ADR-0018 does not specify the value beyond "Router-implementation default"; calibration governance for ongoing post-ratification adjustment is forward-pointed to ADR-0019.

- **Cleanup applied:** Three pre-ratification revision passes folded in (C10a / C10b / C10c). C10a (7 edits) corrected §16/§9 ADR-0011 citation drift + `decision_outcome` Schema-deltas explanatory framing + INV-DOC-001 enforce-when-registered framing per Q79. C10b (15 edits across 5 founder-named cleanup areas) corrected Tier label (Tier 6 → Tier 5; 5 locations), harmonized Subsystem 1 ownership with ADR-0014 §11 (rename + cross-ADR boundary citation; 5 locations), corrected Scenario C `resolution_action` (`manual_born_paid_workflow` → `route_to_manual_entry` + `manualBornPaidBundleEntry` subtype; 1 location), softened ADR-0016 matrix-count hardcoded citations to label-only (3 locations), tightened Schema-deltas opening with explicit no-platform-tables / no-schema-columns / one-audit-event-type framing (1 location). C10c (1 residual edit) corrected the L42 Triggered-by closing paragraph to use canonical Subsystem 1 name "Ledger-State Candidate Completion" instead of the pre-rename "match-against-existing-state engine" phrasing — internal consistency completion.

- **Verdict:** ratify-as-is. No D5-cleanup-commit needed (all cleanups folded into pre-ratification revision passes).

## §4 Anti-overscope cross-check

Single-ADR scope means the cross-trio territory matrix discipline from D4 collapses. ADR-0018's anti-overscope is verified internally (the ten-area boundary callout enumerated in §3.1 above) rather than against co-tier siblings. The substantive verification:

- ADR-0018 cites ADR-0016 §3 by label rather than restating cell counts (post-C10b softening) — drift-resistant against future ADR-0016 amendments.
- ADR-0018 cites ADR-0014 §11 explicitly as the upstream cross-ADR boundary for Subsystem 1 inputs — both ADRs name each other at the boundary.
- ADR-0018 explicitly does not amend ADR-0011 §13's v1 active resolution-action enum (post-C10b Scenario C correction) — uses only the v1-active `route_to_manual_entry` value with a payload subtype rather than introducing a new enum value.
- ADR-0018 cites ADR-0019 as Tier 6 dependent (depends on this Tier 5 ADR) rather than as Tier 6 sibling — corrected post-C10b across 3 locations.

No territory bleeding observed. The post-C10b+C10c ADR-0018 holds anti-overscope discipline verbatim against all ten cited boundary owners.

## §5 Recommended action

**Recommended path: ratify ADR-0018 as-is.**

Per the Z1 framing applied across Tier 3/Tier 4/Tier 5 reviews: length is calibration not enforcement; density beats raw line count; substance-complete is the bar. The post-C10b+C10c ADR-0018 holds:

1. Q56 closed in full per item 4 (three deliverables: trigger list, audit-trail shape, immutability boundary citation).
2. Q28 / Q66 / Q76 / Q77 cited but not closed (each with explicit closure-venue rationale per the Anti-overscope discipline section).
3. Three-subsystem decomposition with cross-ADR boundary harmonization (ADR-0014 §11 boundary mechanical + restated in 3 locations).
4. Ten triggers (T1–T10) with v1-active subset 8 of 10 + reserved post-v1 subset 2 of 10 (T7 vendor-master merge, T9 document supersession).
5. Tier 2.5 read-boundary specifics with closed list of authorized reads + single-writer-rule citations.
6. Stale-state TOCTOU obligations distributed correctly between Router (proposes) and Tier 1 (re-verifies inside `withInvariants()`).
7. Provisional ambiguity-margin value pending ADR-0019 ratification per Q77 v1-ship-gate pattern.
8. Reading B preservation triple-redundant.
9. Anti-overscope discipline against ten cited boundary owners.
10. Schema-delta discipline: zero platform tables, zero schema columns, one audit event.

CTO substantive verdict on §3.1 ADR-0018 ratification: ratify-as-is per density grounds, OR specify named follow-ups (per the D3/D4 named-follow-up precedent if particular Decision items warrant CTO-named refinement before ratification).

## §6 Discoverability notes (10 carried forward)

These are framing observations that don't block ratification but warrant CTO/founder visibility during D5 review.

### §6.1 Length calibration trend (Tier 3/Tier 4/Tier 5 ADRs)

| ADR | Lines | Target | Position |
|-----|------:|------|-----------|
| ADR-0014 | 2003 | 1100–1400 | +43% (broader-scope inheritance content) |
| ADR-0015 | 1771 | 1100–1400 | +26% (Q78 + Q74 + Notes content) |
| ADR-0016 | 1644 | 1100–1400 | +17% (728→756-cell pair-validity matrix) |
| ADR-0017 | 1328 | 1100–1400 | within target (substrate-only-v1 framing) |
| ADR-0018 | 1681 | 1400–2000 (broader-scope band per Z1 #9) | within target, lower-band density |

ADR-0018 inherits the broader-scope target band per Z1 #9 (Z1 framing applied to Tier 5 algorithm-apex ADRs that consume substrate from all upstream tiers). Within band; lower-band density preferred. Trend convergence consistent with two readings: (a) calibration target is well-tuned across scope archetypes; (b) brainstorm-side / writer-subagent calibration converging across Phase 0 cycle. Z1 candidate post-D5 for calibration target re-evaluation on algorithm-apex ADRs (Tier 5 + Tier 6).

### §6.2 ADR-0018 C10a revision pass — pre-cleanup hygiene

C10a applied 7 edits across 3 surfaces post-initial-draft, pre-C10b:
- §16 → §9 ADR-0011 citation drift correction (5 locations; the §16 vs §9 confusion is a known ADR-0011 drift surface — ADR-0011 §9 owns lifecycle immutability; §16 does not exist).
- `decision_outcome` Schema-deltas explanatory framing addition (event-payload constraint vs closed-enum distinction).
- INV-DOC-001 framing correction in `invariants.md` cross-reference: "will enforce when registered per Q79" rather than "currently enforces" (preserves the spec-without-enforcement discipline since INV-DOC-001 is a reserved candidate per ADR-0011 §15).

C10a pass executed clean on first attempt; 1604 → 1612 lines.

### §6.3 ADR-0018 C10b revision pass — five-area founder-named cleanup

C10b applied 15 edits across 5 founder-named cleanup areas in response to founder verdict on the post-C10a draft:

1. **Tier label correction (5 locations):** L19 Triggered-by section, L91 Phase 0 dependency context section, §7 ADR-0019 framing, ADR-0017 cross-reference entry, ADR-0019 cross-reference entry. ADR-0018 is Tier 5; ADR-0019 is Tier 6 dependent — they are not co-tier siblings.

2. **Subsystem 1 ownership harmonization with ADR-0014 §11 (5 locations):** Decision item 1 decomposition list (rename + cross-ADR boundary statement), Decision item 2 header rename + cross-ADR boundary paragraph + Inputs intro adjustment, Cross-references ADR-0014 entry §11 boundary citation addition, Closes Q56 deliverable 1 Subsystem 1 reference rename, Notes for future ADR writers three-subsystem rename + new ADR-0014 §11 cross-ADR boundary bullet. Subsystem 1 renamed from "Match-Against-Existing-State" to "Ledger-State Candidate Completion" to harmonize with ADR-0014's claim to the match-against-existing-state subsystem ownership; cross-ADR boundary explicitly cites ADR-0014 §11.

3. **Scenario C `resolution_action` correction (1 location):** Subsystem 1 receipt-flow Scenario C bullet. Replaced `manual_born_paid_workflow` (which is NOT a v1 active resolution-action enum value per ADR-0011 §13) with `route_to_manual_entry` (v1 active) + `manualBornPaidBundleEntry` subtype. Explicit "ADR-0018 does not amend ADR-0011 §13's v1 active resolution-action enum" framing added.

4. **ADR-0016 matrix-count drift softening (3 locations):** Anti-overscope discipline section, Cross-references ADR-0016 entry, Context primitives enumeration (the third occurrence at L141 was caught by WSL-side pre-execution prophylactic grep before C10b applied — added as Edit 4.3 to the brief). All three locations softened from hardcoded counts to label-only citations to avoid count-drift across future ADR-0016 amendments. (Note: ADR-0016 on disk at HEAD `fa8d2e5` is at 756 cells per the post-D4 mini-decision adding `failure_notice` to link-role; the D4 package's "728-cell" figure is now stale — separate hygiene surface, out of D5 scope.)

5. **Audit-event vs schema-delta framing tightening (1 location):** Schema deltas opening summary statement. Explicit "ADR-0018 introduces no new platform tables and no new source-document schema columns. It introduces one audit-event type: `router_re_evaluation_fired`." opening framing added.

C10b pass executed clean on first attempt; 1612 → 1681 lines.

### §6.4 ADR-0018 C10c revision pass — single-edit residual correction

C10c applied 1 edit catching a residual from C10b that brainstorm-side's case-sensitive count metric had missed: the Triggered-by section closing paragraph at L42-44 still used the pre-rename "match-against-existing-state engine" phrasing for ADR-0018's own three subsystems. WSL-side's case-insensitive whole-file grep on "match-against-existing-state" caught the omission at the post-C10b spot-check stage. C10c rename: "(match-against-existing-state engine, ambiguity resolution, re-evaluation logic)" → "(Ledger-State Candidate Completion, Ambiguity Resolution, Re-Evaluation Logic)". The L29 spec-citation occurrence (citing the reframe spec's pre-rename framing verbatim) was preserved correctly — the two readings co-exist by capitalization (L29 lowercase = spec citation; L42-44 capitalized = ADR-0018 canonical names). C10c pass executed clean; 1681 → 1681 lines (byte-substitution rename, no line delta).

### §6.5 ADR-0018 Q56 closure pattern as Phase 0 Tier 5 lesson

Q56 closed with a closed list T1–T10 + per-trigger contract surfaces (trigger event source, dispatcher, scope, audit event) following the ADR-0014 Q72 / ADR-0015 Q78 closed-list-with-per-element-contract pattern. The closed-list discipline bounds the operational surface: every named trigger has a working dispatcher in v1 for the v1-active subset (T1/T2/T3/T4/T5/T6/T8/T10); reserved triggers (T7 vendor-master merge, T9 document supersession) cost zero v1 implementation but cost the discipline of preserving the seats. This is the same closed-list-with-reserved-extensions pattern used across Phase 0 ADRs (ADR-0011 document-type discriminator, ADR-0016 enum membership, ADR-0017 promotion-authority enum). Worth surfacing as a Phase 0 governance lesson.

### §6.6 ADR-0018 cross-ADR boundary harmonization pattern

The C10b cleanup 2 (ADR-0014 §11 cross-ADR boundary harmonization for Subsystem 1) is a new pattern this package surfaces: when two ADRs name overlapping subsystems by similar phrases (here: ADR-0014's "match-against-existing-state subsystem" vs ADR-0018's pre-rename "Match-Against-Existing-State subsystem"), the boundary harmonization mechanically restates which ADR owns which portion plus explicit forward-pointer text in the upstream ADR ("incomplete candidate flows into the Relationship Router for completion"). This avoids both ADRs claiming the same name and clarifies the cross-ADR contract. The pattern is a candidate Z1 capture (Candidate C: cross-ADR ownership-claim verification) — held in candidate state pending session closeout adjudication.

### §6.7 ADR-0018 reframe-spec citation preservation discipline

ADR-0018's Triggered-by section L29 cites the upstream reframe spec verbatim using the spec's pre-rename "three subsystems (match-against-existing-state, ambiguity resolution, re-evaluation logic)" phrasing. The C10c cleanup deliberately preserved this citation while renaming the L42-44 ADR-0018-own-subsystem enumeration to "Ledger-State Candidate Completion / Ambiguity Resolution / Re-Evaluation Logic". The two readings co-exist by capitalization. The discipline: amending a citation OF an upstream artifact misrepresents the upstream artifact; the rename applies only to ADR-0018's own canonical vocabulary. Worth surfacing as a Phase 0 governance lesson — citation discipline (cite verbatim; rename only own canonical vocabulary).

### §6.8 ADR-0018 single-writer rule citations as fourth Reading-B-analog application

ADR-0018 §5 enumerates single-writer-rule citations for five tables/services: `source_document_links` (`documentLinkService.create()` per ADR-0016 §1), `journal_entries`/`journal_lines` (`ledgerService` per Reading B), `source_documents`/`source_document_versions`/`document_artifacts` (Document Platform substrate writers per ADR-0011 §1 + ADR-0014 §1), `document_relationship_candidates` (the Router IS sole writer per ADR-0011 §1), and `audit_log` (canonical audit-log writer per ADR-0011 §1). This is the **fourth Phase 0 application** of the single-writer-rule pattern (after `ledgerService` / `documentLinkService` / `vendorRuleService`); ADR-0018 establishes the Router as the sole writer of `document_relationship_candidates` while preserving Reading B at all four upstream tables. The pattern reaches five-instance robustness with this ADR. Worth surfacing as Phase 0 governance lesson.

### §6.9 ADR-0018 substrate-now-enforcement-later applied to T7 / T9

T7 (vendor-master merge) and T9 (document supersession) are reserved post-v1 trigger identifiers: the seats are reserved in this ADR; the dispatchers do not exist in v1; activation requires explicit ADR-0018 amendment plus the corresponding upstream ADR amendment (vendor-master domain ADR for T7; ADR-0016 §2 `superseded_version` link-role activation for T9). This is the **fifth Phase 0 application** of the substrate-now-enforcement-later pattern (after ADR-0014 Tier B, Q23 thresholds, Q57 calibration, ADR-0017 vendor template substrate). The pattern continues to apply uniformly to forward-looking activation gates. Worth surfacing as Phase 0 governance lesson.

### §6.10 ADR-0018 C10a/C10b/C10c revision-pass discipline

The three pre-ratification revision passes (C10a / C10b / C10c) demonstrate the cleanup-between-subagents discipline scaling to single-ADR review: subagent draft → brainstorm-side review → C10a revision (7 edits, hygiene surfaces) → founder verdict → C10b revision (15 edits, five founder-named cleanup areas) → brainstorm-side spot-check → C10c revision (1 edit, residual correction caught by WSL-side prophylactic grep) → brainstorm-side spot-check verdict → D5 packaging. The discipline preserves single-pass execution at each revision (Z1 #1 attempt-all-then-rollback-atomically validated 3× through C10a/C10b/C10c) and atomic rollback at the brief level rather than per-edit. The validation surface for Candidate B (count-metric authorship discipline; brainstorm-side count metrics being drift-prone across cleanup-brief and ratification-package authoring contexts in ways the executor's byte-level pre-execution verification catches) reached four fires this session: C10a §16 miscount (cleanup-brief authoring), C10b 756 miss (cleanup-brief authoring), C10b match-against-existing-state lowercase miss (cleanup-brief post-execution), D5 §2 commit-chain drift (ratification-package authoring; caught by WSL-side pre-write `git log` verification). Candidate B is at codification-readiness pending founder concurrence at session closeout; the four-fire pattern argues strongly for codification with the parent-pattern statement extended to cover both authoring contexts (cleanup briefs AND ratification packages).

## §7 Locked Phase 0 decisions (carried forward, never re-litigate)

Per the Phase 0 governance discipline that decisions ratified in earlier turns are not re-opened in subsequent ratification packages:

- **From D1 ratification:** ADR-0007 amendment (Tier 2.5 introduction; three-category vendor-master read boundary; Q28 four-surface expansion).
- **From D2 ratification:** ADR-0011 spine (entity ownership; `source_documents` schema; ProposedAttachment; lifecycle immutability per §9; document-type discriminator; exception queue first-class with v1 active resolution-action enum; DOC invariant prefix; Domain Boundary Map).
- **From D3 ratification:** ADR-0012 (ProposedMutationBundle atomicity + lifecycle + Logic Receipt); ADR-0013 (Storage Provider abstraction); ADR-0014 (Tier 2 Document Pipeline — PaddleOCR v1, Modal v1, AI fallback OCR'd-text-only NEVER raw image bytes max 2 calls/doc, Q65 confidence thresholds vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 / unknown always exception, Tier A+C+D classification with Tier B reserved post-v1, orphan-blob GC daily cadence + 24-hour threshold supabase_storage only; §11 match-against-existing-state subsystem boundary forward-pointing to ADR-0018).
- **From D4 ratification:** ADR-0015 + ADR-0016 + ADR-0017 + Cleanup Commits 1–3.
- **From bank-detail amendment (`84691d5`):** INV-AGENT-006 registered; `agent_autonomy_model.md` §6 row 7 active; vendor bank-detail changes uncappable across the System ceiling.
- **From mini-decision Option 1C + 2A (dispatched at `eab7bad` brief; ratified at Cleanup Commit 5 `6934256`; post-ratification hygiene at Cleanup Commits 6 + 7 `e1111b3` + `fa8d2e5`):** Q1 bank-detail-evidence Notes-callout-only at v1; Q2 `failure_notice` reserved post-v1 in ADR-0016 §2 banking-cluster position; activation expected with post-v1 Banking domain ADR.

**Newly proposed for D5 ratification:** ADR-0018 (post-C10a + C10b + C10c revision passes folded in pre-ratification).

## §8 Ratification ask

CTO + founder confirm:

1. **ADR-0018 ratified as-is** — Relationship Router algorithm; Q56 closed in full (closed list T1–T10 with v1-active subset 8 of 10 + reserved post-v1 subset 2 of 10; per-trigger contract surfaces; audit-trail shape with new `router_re_evaluation_fired` event for liveness telemetry plus existing `pre_commit_link_rerouted` per ADR-0016 §6 for re-routing outcomes; immutability boundary citation owned by ADR-0011 §9 + ADR-0016 §6, not redrafted); three-subsystem decomposition (Ledger-State Candidate Completion / Ambiguity Resolution / Re-Evaluation Logic) with cross-ADR boundary harmonization vs ADR-0014 §11; Tier 2.5 read-boundary specifics with single-writer-rule citations for five tables; stale-state TOCTOU obligations distributed correctly between Router and Tier 1; provisional ambiguity-margin value pending ADR-0019 ratification per Q77 v1-ship-gate pattern; ten-area anti-overscope discipline.

**Status update after D5 ratification (mechanical, applied post-CTO-verdict):**

- ADR-0018 Status: "Drafted 2026-05-04 by Phase 0 governance plan Task C10. Pending CTO ratification." → "Ratified 2026-05-04 by CTO with named follow-ups per D5 ratification package §3.1" (or equivalent ratification framing per CTO verdict shape).

### What this asks from CTO and founder

**CTO substantive review:** verdict on §3.1 ADR-0018 ratification. Recommended ratify-as-is on density grounds; CTO can accept the recommended path or specify named follow-ups. Single-ADR scope means the review burden concentrates on one Decision section; the seven items + Schema deltas + Anti-overscope + Closes + Cross-references are the substantive surface.

**Founder review:** awareness of §6 discoverability notes. Particular surfaces worth founder visibility: §6.1 length calibration trend (broader-scope band per Z1 #9 applied to Tier 5; ADR-0018 lower-band density), §6.5 closed-list-with-per-element-contract pattern as Phase 0 Tier 5 lesson, §6.6 cross-ADR ownership-claim verification pattern (Candidate C source), §6.8 single-writer rule fourth-application pattern, §6.9 substrate-now-enforcement-later fifth-application pattern, §6.10 C10a/C10b/C10c revision-pass discipline (Candidate B source — four validation surfaces in this session; codification-ready pending founder concurrence at session closeout).

**Tier 6 (ADR-0019) splits to Session 2D** per the Session 2C calibrated handoff authorization. D5 ratification closes Tier 5; Session 2C closes after the post-D5 commits (ADR-0018 + D5 package as separate single-purpose commits per D1/D2/D3/D4 precedent).

No re-litigation requested of D1/D2/D3/D4 ratifications, the bank-detail amendment, or the mini-decision Option 1C + 2A.
