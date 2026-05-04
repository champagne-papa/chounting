# D4 Ratification Package — Tier 4 Trio (ADR-0015 / ADR-0016 / ADR-0017)

## §1 Purpose and scope

Three-ADR Tier 4 ratification package. Covers ADR-0015 (AP/Spend Subdomain at `c036c31`), ADR-0016 (Document Relationship Graph at `ccfc6da`), ADR-0017 (Vendor Template Substrate at `c7b7eef`). All three drafted-not-ratified per Phase 0 plan; D4 is the ratification gate that closes Tier 4 of the eight-ADR Phase 0 set.

Also covers Cleanup Commit 1 (`0c0224c`, 13 mechanical edits across 7 files restoring canonical Form A citation uniformity post-INV-AGENT-006 amendment) and Cleanup Commit 2 (`5cf8e36`, single judgment edit harmonizing `agent_autonomy_model.md` §6 prose for row 7 / INV-AGENT-006 structural distinctness).

## §2 Tier 4 trio commit chain

Pre-ratification commit chain since Session 2A closeout (`a14d939`):

```
ece0559 brief: agent-autonomy bank-detail amendment proposal
84691d5 agent_autonomy_model: register vendor bank-detail System ceiling
c036c31 ADR-0015: AP/Spend Subdomain (1771 lines)
29aacf5 hygiene: Q79 + Q66 + §7 reframe-spec
ccfc6da ADR-0016: Document Relationship Graph (1644 lines)
c7b7eef ADR-0017: Vendor Template Substrate (1328 lines)
0c0224c Cleanup pass: post-INV-AGENT-006 citation tightening (13 edits / 7 files)
5cf8e36 Cleanup Commit 2 (judgment-1): §6 prose harmonization for row 7
```

9 commits since `a14d939`. Tier 4 trio drafted, reviewed, cleanup applied (citation uniformity restored, §6 prose harmonized).

## §3 Per-ADR ratification verdicts

### §3.1 ADR-0015 (AP/Spend Subdomain) — ratify-as-is

- **Closes:** Q59 (vendor prepayment shape), Q60 v1 portion (Always Confirm for `born_paid_bill`), Q61 (vendor prepayment approval gate), Q62 (deposit/retainer tax timing), Q63 (vendor balance view composition), Q64 (final invoice with prior deposit), Q74 AP/Spend domain rows, Q78 (payment failure / reversal lifecycle, Reading B with proposal-and-confirm framing — triple-redundant)
- **Length:** 1771 lines vs 1100–1400 target (+26%). Ratify-as-is on density grounds per Z1 framing — overshoot concentrated in Q78 / Q74 / Notes content; ~3% compression headroom doesn't justify churn.
- **Anti-overscope:** held vs ADR-0016/0017/0018/0019/0014 (named explicitly in Anti-overscope discipline section)
- **Reading B:** triple-redundant for Q78 (proposal-and-confirm NOT auto-reverse); INV-AGENT-006 cited directly
- **Schema deltas:** explicit per discipline (`override_evidence_completeness`, `payment_state`, `vendor_credits.status` extension)
- **Verdict:** ratify-as-is. No C7a cleanup needed.

### §3.2 ADR-0016 (Document Relationship Graph) — ratify-as-is

- **Closes:** Q55 only (`linked_entity_type` / `link_role` enums + 728-cell pair-validity matrix + cascade behavior + pre/post-commit boundary). Q56 explicitly NOT-closed (forward-pointed to ADR-0018) — triple-redundant in Closes / Anti-overscope / Notes for future ADR writers.
- **Length:** 1644 lines vs 1100–1400 target (+17%). Ratify-as-is on matrix density grounds — 728-cell exhaustive pair-validity matrix is genuinely irreducible substance; ~3–4% compression headroom below 5% threshold.
- **Anti-overscope:** held vs ADR-0018 (algorithm), ADR-0018 (Q56 triggers), ADR-0019 (confidence), ADR-0015 (AP/Spend), ADR-0017 (vendor template), ADR-0014 (OCR) — six-ADR explicit boundary-callout
- **Reading B analog:** single-writer rule for `source_document_links` (`documentLinkService`) — triple-redundant; matches ADR-0011 §1 + Reading B for ledger pattern
- **`link_role` v1 active subset:** includes all 4 ADR-0015-consumed values (`primary_invoice`, `payment_evidence`, `receipt`, `supporting`); load-bearing inter-ADR contract preserved
- **Schema deltas:** enum-membership-only per ADR-0010 reserved-enum-states discipline; CHECK constraint additions on existing columns; no new tables; no new columns
- **Cleanup applied:** Cleanup Commit 1 fixed Consequences "22-cell" → "15-cell" (subagent's pre-commit self-correction missed one downstream instance; folded into mechanical cleanup)
- **Verdict:** ratify-as-is. No C8a dedicated cleanup commit needed (folded into Cleanup Commit 1).

### §3.3 ADR-0017 (Vendor Template Substrate) — ratify-as-is

- **Closes:** Q60 post-v1 portion (substrate-only v1: `vendor_rules` table with full v1 column set + `clean_approval_count` per ADR-0015 §2 forward-pointer + 2 closed enums per ADR-0010 + reserved audit events); Q43 retired-range topic-mapping inheritance acknowledged (no closure record per Q35–Q52 retirement)
- **Length:** 1328 lines (within 800–1100 expected for substrate-only-v1 framing; slightly above the upper end but within the 1400 ceiling). The smallest of Tier 4 trio in line count, as expected per substrate-only scope.
- **Anti-overscope:** held vs ADR-0015 (AP/Spend), ADR-0016 (graph), ADR-0019 (calibration), ADR-0014 (OCR), ADR-0011 §11 (read boundary), INV-AGENT-006 — six-area explicit boundary-callout
- **Reading B / single-writer rule:** `vendorRuleService` is sole writer of `vendor_rules`; third instance of the pattern (`ledgerService` / `documentLinkService` / `vendorRuleService`); future substrate tables expected to follow same pattern
- **System ceiling preservation:** explicit at item 6; bank-detail INV-AGENT-006 uncappable; substrate cannot extend autonomy across any of the seven System ceiling rows
- **Substrate-now-enforcement-later pattern:** named explicitly as fourth Phase 0 application (after ADR-0014 Tier B, Q23 thresholds, Q57 calibration); load-bearing precedent for future ADRs
- **Schema deltas:** one new table (`vendor_rules`) with 17 columns per Cleanup Commit 1 fix; two new closed enums; zero new columns on existing tables
- **Cleanup applied:** Cleanup Commit 1 fixed Consequences "14 columns" → "17 columns"
- **Verdict:** ratify-as-is. No C9a dedicated cleanup commit needed (folded into Cleanup Commit 1).

## §4 Anti-overscope cross-check across Tier 4 trio

The new discipline this package adds (vs D3) is the cross-trio verification: Tier 4 has three ADRs whose territories must not bleed.

**Territory matrix:**

| ADR | Owns | Does NOT own (delegated to) |
|-----|------|----------------------------|
| ADR-0015 | AP/Spend domain (bills, payments, prepayments, credits, vendor master, `payment_state`, evidence-completeness override, born-paid bundle workflow) | Document Relationship Graph schema → ADR-0016. Vendor template substrate → ADR-0017. Bundle envelope mechanics → ADR-0012 |
| ADR-0016 | Document Relationship Graph schema (`linked_entity_type` / `link_role` enums, 728-cell pair-validity matrix, cascade behavior, pre/post-commit boundary, `documentLinkService` single-writer rule) | Matching algorithm → ADR-0018. Re-evaluation triggers (Q56) → ADR-0018. AP/Spend domain decisions → ADR-0015. Vendor template substrate → ADR-0017 |
| ADR-0017 | Vendor template substrate (`vendor_rules` table, `vendor_rule_rung` / `vendor_rule_promotion_authority` enums, `vendorRuleService` single-writer rule, substrate-only-v1 framing) | Post-v1 enforcement (deferred). Calibration governance → ADR-0019. AP/Spend domain → ADR-0015. Document Relationship Graph → ADR-0016 |

**Inter-ADR contract verification:**

- ADR-0015 §10 declares consumption of `link_role` v1 active subset (`primary_invoice`, `payment_evidence`, `receipt`, `supporting`); ADR-0016 item 2 includes all four ✓
- ADR-0015 §2 forward-points `clean_approval_count` to ADR-0017; ADR-0017 item 1 ships the column with `NOT NULL DEFAULT 0` ✓
- ADR-0016 cites ADR-0015 §10 explicitly as the load-bearing inter-ADR contract for the v1 active `link_role` subset ✓
- ADR-0017 cites ADR-0015 §2's forward-pointer explicitly as the rationale for `clean_approval_count`'s substrate seat ✓
- ADR-0017's `vendor_rules.bundle_type` references ADR-0012 §12's `bundle_type` enum (no extension proposed) ✓

No territory bleeding observed. Each ADR explicitly disclaims the others' territories in its Anti-overscope section. The forward-pointers resolve.

## §5 Recommended action

**Recommended path: ratify all three ADRs as-is plus the two cleanup commits.**

Per the Z1 framing applied across Tier 3/Tier 4 reviews: length is calibration not enforcement; density beats raw line count; substance-complete is the bar.

1. ADR-0015 ratifies as-is (Q60 v1 portion closed; AP/Spend domain ownership boundary established with INV-AGENT-006 enforcement at `vendorService.update()`)
2. ADR-0016 ratifies as-is (Q55 closed in full; document relationship graph schema substrate established with single-writer rule)
3. ADR-0017 ratifies as-is (Q60 post-v1 substrate portion closed; substrate-now-enforcement-later pattern's fourth Phase 0 application; full enforcement deferred)
4. Cleanup Commit 1 (`0c0224c`) ratifies as-is — citation uniformity restored across 7 files using canonical Form A (per ADR-0015's most-recent ratified-state precedent)
5. Cleanup Commit 2 (`5cf8e36`) ratifies as-is — §6 prose harmonized for row 7 / INV-AGENT-006 structural distinctness

## §6 Discoverability notes (12 carried forward)

These are framing observations that don't block ratification but warrant CTO/founder visibility during D4 review.

### §6.1 Length calibration trend (Tier 3/Tier 4 ADRs)

| ADR | Lines | Target (1100–1400) | Overshoot |
|-----|------:|------|-----------|
| ADR-0014 | 2003 | 1100–1400 | +43% |
| ADR-0015 | 1771 | 1100–1400 | +26% |
| ADR-0016 | 1644 | 1100–1400 | +17% |
| ADR-0017 | 1328 | 1100–1400 | within target (-5% under upper) |

Trend converging. Each successive ADR closer to target. Two readings: (a) calibration target is well-tuned; substrate ADRs hit it naturally; broader-scope ADRs exceed it because the substance genuinely requires more; (b) brainstorm-side / writer-subagent calibration is converging across the Phase 0 cycle. Both consistent with Z1 framing ("length is a review signal, not an enforcement rule"). Z1 candidate post-D4 for calibration target re-evaluation on substrate ADRs.

### §6.2 ADR-0015 cross-ADR enum value specification pattern (Item 6 / Item 7)

ADR-0015 specifies reserved values for enums whose canonical membership is owned by ADR-0011 §13 (exception-queue resolution-action enum). The pattern: ADR-0015 declares which reserved values it expects; ADR-0011 §13 owns the enum's full reserved set. A future contributor who wants to amend the resolution-action enum files an ADR-0011 amendment, not an ADR-0015 amendment. This is a coherent split (consumer specifies needs; spine owns the membership).

### §6.3 ADR-0015 spend_initiative.md rename claim (verification needed)

ADR-0015's Cross-references entry refers to "Spend Initiative brief" by name. Worth verifying (a) whether the brief exists at that filename or has been superseded by `document_platform_reframe_design.md` / `document_platform_initiative.md`, (b) whether D4 should add a one-line note clarifying the reference. Not ratification-blocking. Surface for CTO awareness; can defer to a hygiene commit post-D4 if needed.

### §6.4 ADR-0015 Q78 v1-ship-vs-defer architectural choice

Reframe spec §13 framed Q78 (payment failure / reversal lifecycle) as a "Q dilemma" — multiple defensible routes. ADR-0015's closure picks one route: v1 ships proposal-and-confirm, NOT auto-reverse, with explicit Reading B preservation (`paymentService` proposes a `mark_payment_failed` mutation; controller confirms; reversal entry posts via ledger service per ADR-0001). This is an architectural choice ADR-0015 makes explicit rather than deferring. Worth surfacing for D4 awareness — the choice has downstream consequences for ADR-0018's Router (re-evaluation triggers post-failure).

### §6.5 ADR-0016 source_documents cascade-delete rare-path

ADR-0016 item 5 documents the rare-path where a `source_documents` row is genuinely deleted (controller authority + structured deletion reason; `ON DELETE CASCADE` on `source_document_links.source_document_id`). This is the only path where post-commit link rows are physically removed rather than `link_status`-flipped to `reversed`. Distinct from the standard `link_status = 'reversed'` flip path. Worth surfacing because it's an exception to the otherwise-mechanical immutability discipline.

### §6.6 ADR-0016 Cleanup Commit 1 cell-count reconciliation

ADR-0016 Consequences "22-cell" → "15-cell" cleanup applied at `0c0224c`. Subagent caught and corrected three other instances of the same drift pre-commit (Closes table, Layer 1 CHECK, Test surface); the fourth instance was missed and folded into Cleanup Commit 1. Lessons-extended pattern from C5/C7 review precedent (recap-arithmetic verification habit).

### §6.7 ADR-0017 Cleanup Commit 1 column-count reconciliation

ADR-0017 Consequences "14 columns" → "17 columns" cleanup applied at `0c0224c`. C9a-folded fix; reconciles Consequences §What this costs with Decision item 1's actual schema spec. Same pattern as ADR-0016's 22→15 drift.

### §6.8 Cleanup Commit 1 (0c0224c) Form A canonical citation

13 string-replacement operations across 7 files (`agent_autonomy_model.md`, ADR-0011, ADR-0012, ADR-0014, ADR-0016, ADR-0017, `agent_architecture_policy.md`). All "pending registration" parentheticals replaced with canonical Form A: `(INV-AGENT-006 / agent_autonomy_model.md §6 row 7)`. Applied after three dispatch cycles per the attempt-all-then-rollback-atomically discipline (Z1 #1 validated 3×).

### §6.9 Cleanup Commit 2 (5cf8e36) §6 prose judgment harmonization

Single-edit commit: `agent_autonomy_model.md` §6 prose paragraph harmonized to acknowledge row 7's structural distinctness from rows 3–6 (separate invariant INV-AGENT-006 vs INV-AGENT-001 consolidation; separate enforcement surface `vendorService.update()` vs agent orchestrator). Captures the architectural-placement justification (direct-user-action vs agent-proposal coverage at the service layer rather than the orchestrator).

### §6.10 Tier 4 trio sequence: cleanup-between-subagents discipline held

C7 → C7 review → no C7a needed → C8 dispatch → C8 review → no C8a needed → C9 dispatch → C9 review → C9a fold-in → Cleanup Commit 1 (mechanical-13) → Cleanup Commit 2 (judgment-1). Sequential discipline from C3/C4/C5 cleanup-between-subagents pattern preserved through all three Tier 4 dispatches. No parallel-dispatch shortcuts.

### §6.11 D3 → D4 four-piece closure pattern application

Q73 four-piece closure pattern (ADR-0011 platform-surface + ADR-0013 storage + ADR-0014 OCR/retention/language + ADR-0019 confidence-threshold) is mirrored in Tier 4's substrate-now-enforcement-later pattern (ADR-0014 Tier B + Q23 + Q57 + ADR-0017). Both are applications of the same architectural discipline: split closure across multiple ADRs by territory; each ADR closes its own narrow piece. Worth surfacing as a Phase 0 governance lesson.

### §6.12 Cap-lift conversation timing flag

CTO-loop budget at 2 used / 3 cap. D4 ratification = turn 3, exhausting headroom. Tier 5 (ADR-0018 Relationship Router, closes Q56) + Tier 6 (ADR-0019 Confidence Calibration Policy, closes Q57; ratifies Q65 confidence values, possible ADR-0014 amendment cascade) require either:

1. **Cap-lift conversation with founder** — extends Session 2B to ~5–6 CTO-loop turns
2. **Session 2C split** — D4 closes Session 2B; Tier 5/6 picks up in fresh session

Brainstorm-side recommendation: pre-D4 cap-lift conversation timing. Founder benefits from knowing Phase 0 budget shape during D4 review.

Sub-decision flag, no urgency. Can be raised after CTO ratification verdict on D4 substance lands.

## §7 Locked Phase 0 decisions (carried forward, never re-litigate)

Per the Phase 0 governance discipline that decisions ratified in earlier turns are not re-opened in subsequent ratification packages:

- **From D1 ratification (interstitial):** ADR-0007 amendment (Tier 2.5 introduction; three-category vendor-master read boundary; Q28 four-surface expansion).
- **From D2 ratification:** ADR-0011 spine (entity ownership; `source_documents` schema; ProposedAttachment; lifecycle immutability; document-type discriminator; exception queue first-class; DOC invariant prefix; Domain Boundary Map).
- **From D3 ratification:** ADR-0012 (ProposedMutationBundle atomicity + lifecycle + Logic Receipt); ADR-0013 (Storage Provider abstraction); ADR-0014 (Tier 2 Document Pipeline — PaddleOCR v1, Modal v1, AI fallback OCR'd-text-only NEVER raw image bytes max 2 calls/doc, Q65 confidence thresholds vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 / unknown always exception, Tier A+C+D classification with Tier B reserved post-v1, orphan-blob GC daily cadence + 24-hour threshold supabase_storage only).
- **From bank-detail amendment (`84691d5`):** INV-AGENT-006 registered; `agent_autonomy_model.md` §6 row 7 active; vendor bank-detail changes uncappable across the System ceiling.

**Newly proposed for D4 ratification:** ADR-0015 + ADR-0016 + ADR-0017 + Cleanup Commit 1 + Cleanup Commit 2.

## §8 Ratification ask

CTO + founder confirm:

1. **ADR-0015 ratified as-is** — AP/Spend domain ownership; Q60 v1 portion closed (Always Confirm for `born_paid_bill`); Q78 closed with proposal-and-confirm framing; INV-AGENT-006 enforcement at `vendorService.update()` per §9; `payment_state` vocabulary vs mutation-lifecycle vocabulary distinction held; born-paid bundle workflow with manual+automated path uniformity.
2. **ADR-0016 ratified as-is** — Document Relationship Graph schema substrate; Q55 closed in full (`linked_entity_type` 28-value enum, `link_role` 26-value enum, 728-cell pair-validity matrix, cascade behavior per `linked_entity_type`, pre/post-commit boundary); Q56 explicitly NOT-closed (ADR-0018 territory); single-writer rule for `source_document_links` established as Reading B analog.
3. **ADR-0017 ratified as-is** — Vendor Template Substrate (substrate-only v1); Q60 post-v1 portion closed; `vendor_rules` table with 17 columns + 2 closed enums per ADR-0010; `vendorRuleService` single-writer rule established; substrate-now-enforcement-later pattern named as Phase 0 lesson; full enforcement (auto-post calibration, promotion ceremonies, demotion-trigger rules, learning-loop governance) deferred past Phase 0.
4. **Cleanup Commit 1 (`0c0224c`) ratified as-is** — 13 mechanical edits across 7 files restoring canonical Form A citation uniformity; Z1 #1 attempt-all-then-rollback-atomically discipline validated 3×.
5. **Cleanup Commit 2 (`5cf8e36`) ratified as-is** — §6 prose harmonization for row 7 / INV-AGENT-006 structural distinctness vs INV-AGENT-001 consolidation; service-layer enforcement justification captured.

**Status updates after D4 ratification (mechanical, applied post-CTO-verdict):**

- ADR-0015 Status: "Drafted; awaiting D4 ratification" → "Ratified 2026-05-04 by CTO with named follow-ups per D4 ratification package §3.1"
- ADR-0016 Status: same shape → "Ratified 2026-05-04 by CTO with named follow-ups per D4 ratification package §3.2"
- ADR-0017 Status: same shape → "Ratified 2026-05-04 by CTO with named follow-ups per D4 ratification package §3.3"

### What this asks from CTO and founder

**CTO substantive review:** verdict on §3.1, §3.2, §3.3 ADR ratifications. Each is recommended ratify-as-is on density grounds; CTO can accept the recommended path or specify named follow-ups.

**Founder review:** awareness of §6 discoverability notes (especially §6.1 length trend, §6.4 Q78 architectural choice, §6.12 cap-lift timing flag). The cap-lift conversation per §6.12 is the strategic decision point — pre-D4 recommended timing means founder reviews Phase 0 budget shape now; post-D4 timing is acceptable if founder prefers.

No re-litigation requested of D1/D2/D3 ratifications or the bank-detail amendment.
