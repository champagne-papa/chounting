# Phase 2.5 Commit B — ADR-0011 amendment (sub-findings 6.4, 6.5, 6.6, 6.7)

**Date**: 2026-05-13
**Phase**: 2.5 (Phase 2 close + ADR audit cycle)
**Commit**: B of 3 (sequenced A → B → C; Commit A shipped at 9d788e2 ADR-0016 amendment; Commit C is Phase 2 retrospective writeup at separate session)

## Goal

Amend ADR-0011 (Document Platform) to reconcile §3, §10, §13 with chunk-6 ship state + close §13 Closes-section stale math (a two-amendment-cycle drift surfaced during Phase 2.5 verify-from-disk). Four sub-findings of retrospective inventory item #6 close: 6.4 (§3 transition table broadening), 6.5 (§13 enum entry for `backfill_vendor_prepayment_suggested`), 6.6 (§13 Closes Q68 math sweep), 6.7 (§10 wrong_entity_exception enum-name clarification at 2 locations).

Editorial work only — no migration, no service, no tests, no validation gate against test counts. Brief + ADR edits ship in one bundled commit; new §Amendment block at end of ADR-0011 sits alongside the existing 2026-05-08 manual_born_paid_workflow registration block.

## Cross-commit amendment-shape discipline (codified at Phase 2.5)

Per the consistent grain emerging across Commits A and B: **ADR amendment shape is additive provenance-preserving; never restructure to absorb amendments invisibly.** Both commits' sub-options chose the additive shape over restructuring (A.1-i surgical edits, A.2-i+cite citation parallel to existing fields, A.3-i edit-in-place with explanation, A.4-ii table split, B.4-ii separate bullet, B.5-i semantic placement + cross-reference note, B.7-i schema-and-section cite). The 2026-05-08 manual_born_paid_workflow amendment set this precedent at §13 (added the value AND added an explicit cross-reference note rather than absorbing the value invisibly); Phase 2.5's amendments inherit + extend the pattern.

This discipline belongs in the Commit C retrospective writeup as a Phase-2.5-codified rule.

## Sub-finding 6.4 — §3 transition table missing `needs_review → classified` (B.4-ii separate bullet)

§3's current transition list at lines 339-340:

> `needs_review → matched` or `needs_review → proposed`: human only (resolution from the exception queue).

Chunk-6 broadened chunk-2's LEGAL_TRANSITIONS at `documentCaseService.ts` line 36 to add `'classified'` to `needs_review`'s exit list (human-callable; NOT in `AUTOMATION_ONLY_TRANSITIONS` lines 49-59). The transition exists for the `reprocess` resolution_action — re-runs extraction/router from a clean slate.

**Per B.4-ii**: insert a new bullet immediately after the existing needs_review → matched/proposed bullet. Preserves chunk-2-vs-chunk-6 provenance (the existing bullet documents chunk-2-origin transitions; the new bullet documents the chunk-6 broadening). Mirrors the 2026-05-08 §13 amendment precedent (which added `manual_born_paid_workflow` as a discrete addition rather than restructuring §13's existing 16-value enum listing).

**Edit text**:

> `needs_review → classified`: human only (resolution from the exception queue, `reprocess` resolution_action — re-runs extraction/router from a clean slate per chunk-6 broadening; lands at exception-queue `resolveException` service path).

Annotation tone parallels the existing "human only (resolution from the exception queue)" framing; extends with chunk-6-specific origin (`reprocess` action) + names the service path (`resolveException`) that triggers it.

## Sub-finding 6.5 — §13 enum missing `backfill_vendor_prepayment_suggested` (B.5-i semantic placement)

§13's current 17-value listing at lines 746-753 is semantically grouped:

1. bill-related (4 values)
2. prepayment-related (create_vendor_prepayment, apply_vendor_prepayment)
3. credit-related (create_vendor_credit, apply_vendor_credit)
4. mark_*/request (3 values)
5. route_to_manual + manual_born_paid (2 values; the 2026-05-08 amendment added the latter at this semantic position)
6. route_to_bank/AR (2 values)
7. close-out (reprocess, archive)

`backfill_vendor_prepayment_suggested` is a prepayment-related action per ADR-0015 §6 (creates a back-dated `vendor_prepayment` row). Per B.5-i: insert after `apply_vendor_prepayment` (group 2). Mirrors 2026-05-08 manual_born_paid_workflow placement precedent ("after `route_to_manual_entry` (semantically grouped with manual-routing actions)").

**Edit text**: insert `\`backfill_vendor_prepayment_suggested\`,` between `apply_vendor_prepayment` and `create_vendor_credit`.

**Additional edit**: the amendment cross-reference note at lines 755-757 currently has one parenthetical for the 2026-05-08 amendment. Append a second parenthetical for Phase 2.5 Commit B:

> (`manual_born_paid_workflow` added by 2026-05-08 amendment — see `## Amendment — manual_born_paid_workflow registration (2026-05-08)` at end of this ADR. `backfill_vendor_prepayment_suggested` added by Phase 2.5 Commit B amendment 2026-05-13 — see `## Amendment — Phase 2.5 Commit B reconciliation (2026-05-13)` at end of this ADR.)

## Sub-finding 6.6 — §13 Closes Q68 stale math (bundled with 6.5; two-amendment-cycle drift)

§Closes Q68 at lines 995-1000 currently lists v1-active 8 values + "remaining eight values reserved":

> v1 active subset narrow (`attach_to_existing_bill`, `attach_to_existing_payment`, `record_bill_payment`, `mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`, `reprocess`, `archive`); the remaining eight values reserved per ADR-0010.

**This is a two-amendment-cycle drift, not a Phase-2.5-introduced drift.** The 2026-05-08 amendment to §13 added `manual_born_paid_workflow` to the Decision-section enum listing AND the §13 v1-active subset listing (line 759-762), but DID NOT propagate to §Closes Q68's v1-active subset listing. Phase 2.5 Commit B simultaneously fixes the 2026-05-08 propagation gap AND adds `backfill_vendor_prepayment_suggested` to the reserved subset, producing the post-Commit-B math: **9 v1-active + 9 reserved = 18**.

Brief-preamble framing for the receipt: §Closes Q68's drift originates from the 2026-05-08 amendment cycle, not Phase 2.5. Phase 2.5 Commit B is the cleanup surface.

**Edit text** (post-Commit-B):

> v1 active subset narrow (`attach_to_existing_bill`, `attach_to_existing_payment`, `record_bill_payment`, `mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`, `manual_born_paid_workflow`, `reprocess`, `archive` — 9 values); the remaining nine values reserved per ADR-0010.

## Sub-finding 6.7 — §10 wrong_entity_exception enum-name ambiguity (B.7-i / B.7-ii; 2 references)

Verify-from-disk surfaced two references to "exception-routing enum" — an ambiguous phrase since §13's `resolution_action` enum doesn't include `wrong_entity_exception`. Chunk 6 placed `wrong_entity_exception` in the `exception_reason` enum (a separate enum from `resolution_action`).

- **Line 645-646** (§10 primary reservation declaration): "The platform also reserves the `wrong_entity_exception` value in the exception-routing enum (per §13 below)."
- **Line 878** (§What this enables consequence): "the `wrong_entity_exception` reservation in the exception-routing enum"
- Line 1426 reference inside the existing 2026-05-08 §Amendment block (within-arc Flag 3 surface count historical context); NOT edited (amendment-block history is preserved).

**Per B.7-i (refined; no file path)** for §10 line 645-646:

> The platform also reserves the `wrong_entity_exception` value in the `exception_reason` enum (chunk-6 substrate, owned by the document-platform exception queue per ADR-0011 §13; the `exception_reason` enum is separate from the `resolution_action` enum that §13 owns).

Citation by chunk + ADR section + structural distinction (no file path; chunks-3-5 pattern is service/schema-name citation, not file-path citation, since file paths shift under refactor).

**Per B.7-ii** for §What-this-enables line 878:

> the `wrong_entity_exception` reservation in the `exception_reason` enum (chunk-6 substrate)

Terser; matches the consequence-listing tone.

## §Amendment block (new, at end of ADR-0011 after 2026-05-08 block)

Mirrors ADR-0016's Phase 2.5 Commit A §Amendment block shape + ADR-0011's 2026-05-08 manual_born_paid_workflow precedent. Two §Amendment blocks coexist at file-end after Phase 2.5 Commit B: 2026-05-08 first (preserved), Phase 2.5 Commit B second (new).

Draft text:

```
## Amendment — Phase 2.5 Commit B reconciliation (2026-05-13)

ADR-0011 is amended at Phase 2.5 close (the Phase 2 close + ADR
audit cycle following six chunks of substrate ship). Path (a) of
the audit-cycle (β) reconciliation pattern: ADR text catches up to
chunk-6 substrate ship state + closes a two-amendment-cycle drift
surfaced during Phase 2.5 verify-from-disk + clarifies cross-§ enum
naming.

### Substance

Four reconciliations:

1. **§3 transition table broadens to admit `needs_review →
   classified` (chunk-6 LEGAL_TRANSITIONS extension).** Chunk-6
   broadened chunk-2's LEGAL_TRANSITIONS at
   `documentCaseService.ts` line 36 to add `'classified'` to
   `needs_review`'s exit list (human-callable; NOT in
   `AUTOMATION_ONLY_TRANSITIONS`) for the `reprocess`
   resolution_action. §3's transition table listed the existing
   `needs_review → matched/proposed` exits but not the new
   `needs_review → classified` exit. New bullet added (B.4-ii
   separate-bullet placement preserves chunk-2-vs-chunk-6
   provenance) with annotation citing the `resolveException`
   service path origin.

2. **§13 enum extends to 18 values with
   `backfill_vendor_prepayment_suggested` (chunk-6 substrate +
   ADR-0015 §6 cross-reference reconciliation).** ADR-0015 §6
   cross-references `backfill_vendor_prepayment_suggested` as a
   reserved resolution_action value at 4 locations (lines
   628/650/1137/1373); chunk-6 ships it as the 18th value in the
   resolution_action ENUM. §13's 17-value listing missed the
   value. New value inserted at semantic position after
   `apply_vendor_prepayment` (mirrors 2026-05-08
   manual_born_paid_workflow placement precedent). Amendment
   cross-reference note at lines 755-757 extended with a second
   parenthetical.

3. **§13 Closes Q68 math sweep (two-amendment-cycle drift).**
   The 2026-05-08 amendment added `manual_born_paid_workflow`
   to §13 Decision-section enum listing + v1-active subset
   listing but did NOT propagate to §Closes Q68's v1-active
   subset listing. Phase 2.5 Commit B simultaneously fixes the
   2026-05-08 propagation gap (8→9 v1-active values; adds
   `manual_born_paid_workflow`) AND updates the reserved count
   (8→9 reserved; reflects the Phase 2.5 Commit B addition of
   `backfill_vendor_prepayment_suggested`), producing the
   post-Commit-B math: 9 v1-active + 9 reserved = 18. The
   drift's two-amendment-cycle origin is documented for future
   readers: the 2026-05-08 amendment's propagation surface was
   incomplete, and Phase 2.5 Commit B is the cleanup.

4. **§10 + §What-this-enables `wrong_entity_exception` enum-name
   clarification (chunk-6 substrate naming reconciliation).**
   §10 reserved `wrong_entity_exception` "in the exception-routing
   enum (per §13 below)" but §13's `resolution_action` enum
   doesn't include the value. Chunk 6 placed it in
   `exception_reason` (a separate enum from `resolution_action`).
   Two §10 + §What-this-enables references clarified to cite
   `exception_reason` enum + chunk-6 origin. The §10 wording is
   more explicit (chunk + ADR section + structural distinction);
   the §What-this-enables wording is terser (consequence-listing
   tone). Third reference at line 1426 inside the 2026-05-08
   §Amendment block (historical context) preserved.

### Why this amendment

Per chunk-6 implementation close (chunk-6 friction-journal entry +
chunk-6 implementation notes memory): chunk-6 substrate shipped
the broadened LEGAL_TRANSITIONS + 18-value resolution_action ENUM
+ exception_reason enum with explicit deviation from ADR-0011's
existing §3 / §13 / §10 framing; the (β) reconciliation pattern
says ADR text catches up at the next retrospective cycle. Phase
2.5 is that cycle. §Closes Q68's stale math originates from the
2026-05-08 amendment cycle's incomplete propagation surface;
Phase 2.5 Commit B is the natural cleanup point (the next §13
touch after 2026-05-08).

### Bundling

Phase 2.5 Commit B bundles four sub-findings (6.4, 6.5, 6.6, 6.7)
of retrospective inventory item #6 — the consolidated ADR-0011 +
ADR-0016 cross-ADR editorial audit cycle. Commit A (ADR-0016
amendment, shipped at 9d788e2) bundled three sub-findings (6.1,
6.2, 6.3). Commit C (Phase 2 retrospective writeup) closes the
consolidated audit item with reference to commits A and B SHAs.

### Cross-references

- `docs/07_governance/friction-journal.md` — chunk-6 close entries
  documenting the LEGAL_TRANSITIONS broadening + cross-ADR
  substrate-now-amendment-later trajectory.
- `apps/web/src/services/document-platform/documentCaseService.ts`
  lines 30-41 + 49-59 — chunk-6 LEGAL_TRANSITIONS broadening +
  AUTOMATION_ONLY_TRANSITIONS unchanged (source of truth for §3
  transition-table reconciliation).
- `supabase/migrations/20240148000000_exception_queue_substrate.sql`
  — chunk-6 resolution_action ENUM 18 values (source of truth for
  §13 reconciliation).
- `apps/web/src/shared/schemas/document-platform/exceptionQueueEntry.schema.ts`
  — chunk-6 `ExceptionReasonSchema` with `wrong_entity_exception`
  reserved (source of truth for §10 enum-name clarification).
- `docs/07_governance/adr/0015-ap-spend-subdomain.md` §6 (lines
  628/650/1137/1373) — `backfill_vendor_prepayment_suggested`
  cross-references (the ADR-0015 side of the cross-ADR-named
  resolution_action pattern; ADR-0011 §13's enum is the membership
  authority).
- `docs/07_governance/adr/0011-document-platform.md` `## Amendment
  — manual_born_paid_workflow registration (2026-05-08)` — the
  prior amendment whose propagation gap §Closes Q68 6.6 closes.
- `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-b.md` —
  brief for this commit.
- `docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md` +
  ADR-0016 §Amendment block at commit 9d788e2 — Phase 2.5
  Commit A bundle.

### Note on amendment shape

Per the cross-commit discipline codified at Phase 2.5: ADR
amendments are additive provenance-preserving. Each of the four
sub-findings above was implemented as a discrete addition to the
existing ADR text (new bullet for 6.4; enum-value insertion at
semantic position + cross-reference note extension for 6.5;
Closes-section listing extension for 6.6; reference clarification
in place for 6.7) rather than restructuring §3 / §13 / §10 to
absorb the chunk-6 substrate invisibly. The 2026-05-08
manual_born_paid_workflow amendment set this precedent at §13;
Phase 2.5 Commits A + B inherit + extend the pattern. The
discipline belongs in the Commit C retrospective writeup as a
Phase-2.5-codified rule.

This is **ADR-0011's second amendment** (the 2026-05-08
manual_born_paid_workflow registration is the first). Title-line
stability preserved (no title-line revision). Scope is narrow (the
four sub-findings 6.4, 6.5, 6.6, 6.7 of retrospective inventory
item #6); broader Phase 0 review deferred per arc-class
first-instance status framing.
```

## Implementation tasks

1. Apply §3 transition-table edit: insert new bullet for `needs_review → classified` immediately after the existing `needs_review → matched/proposed` bullet (B.4-ii separate bullet).
2. Apply §13 enum listing edit: insert `backfill_vendor_prepayment_suggested` between `apply_vendor_prepayment` and `create_vendor_credit` (B.5-i semantic placement).
3. Apply §13 amendment cross-reference note edit at lines 755-757: append a second parenthetical referencing Phase 2.5 Commit B.
4. Apply §Closes Q68 edit at lines 995-1000: v1-active 8→9 values (add `manual_born_paid_workflow`); "remaining eight values" → "remaining nine values".
5. Apply §10 edit at line 645-646: clarify enum-name reference to `exception_reason` enum (B.7-i refined wording, no file path).
6. Apply §What-this-enables edit at line 878: clarify enum-name reference (B.7-ii terser wording).
7. Append new §Amendment block at file-end (after the existing 2026-05-08 block).

## Commit message

```
docs(adr): ADR-0011 amendment — §3 transition broadening + §13 enum extension + §13 Closes math sweep + §10 enum-name clarification (Phase 2.5 commit B; closes retrospective item #6 sub-findings 6.4/6.5/6.6/6.7)

Phase 2.5 Commit B of three. Editorial amendment closing four
sub-findings of retrospective inventory item #6 (ADR-0011 +
ADR-0016 cross-ADR editorial audit; ADR-0016 amendment shipped
at Commit A 9d788e2):

- 6.4 §3 transition table broadens to admit needs_review →
  classified (chunk-6 LEGAL_TRANSITIONS extension at
  documentCaseService.ts line 36 for the reprocess
  resolution_action). New separate bullet preserves
  chunk-2-vs-chunk-6 provenance (B.4-ii per Phase 2.5
  scope-lock sub-option adjudication; mirrors 2026-05-08 §13
  amendment precedent of additive-not-restructuring).

- 6.5 §13 enum extends to 18 values with
  backfill_vendor_prepayment_suggested (chunk-6 substrate per
  ADR-0015 §6 cross-reference at 4 locations). Inserted at
  semantic position after apply_vendor_prepayment per B.5-i
  (mirrors 2026-05-08 manual_born_paid_workflow placement
  precedent). Amendment cross-reference note at lines
  755-757 extended.

- 6.6 §13 Closes Q68 math sweep — two-amendment-cycle drift.
  The 2026-05-08 amendment added manual_born_paid_workflow
  to Decision-section but did not propagate to §Closes Q68's
  v1-active subset listing. Phase 2.5 Commit B simultaneously
  fixes the 2026-05-08 propagation gap (8→9 v1-active) AND
  updates the reserved count (8→9 reserved) reflecting the
  Commit B addition of backfill_vendor_prepayment_suggested.
  Post-Commit-B math: 9 v1-active + 9 reserved = 18.

- 6.7 §10 + §What-this-enables wrong_entity_exception
  enum-name clarification (2 references). §10 reserved the
  value "in the exception-routing enum (per §13 below)" but
  §13's resolution_action enum doesn't include the value;
  chunk-6 placed it in exception_reason (a separate enum
  from resolution_action). References at lines 645-646 (§10
  primary, B.7-i refined wording with chunk + ADR section
  citation; no file path) and line 878 (§What this enables
  consequence, B.7-ii terser wording) clarified. Third
  reference at line 1426 inside 2026-05-08 §Amendment block
  preserved as historical context.

Brief at docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-b.md.
New §Amendment block at end of ADR-0011 sits alongside the
existing 2026-05-08 manual_born_paid_workflow registration
block. ADR-0011's second amendment.

Cross-commit discipline codified at Phase 2.5: ADR amendment
shape is additive provenance-preserving; never restructure to
absorb amendments invisibly. Phase 2.5 Commits A + B both
honor this; Commit C retrospective writeup will name as a
Phase-2.5-codified rule.

Item #6 closes at Commit C (Phase 2 retrospective writeup).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
