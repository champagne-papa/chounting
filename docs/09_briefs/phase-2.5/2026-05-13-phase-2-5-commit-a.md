# Phase 2.5 Commit A — ADR-0016 amendment (sub-findings 6.1, 6.2, 6.3)

**Date**: 2026-05-13
**Phase**: 2.5 (Phase 2 close + ADR audit cycle)
**Commit**: A of 3 (sequenced A → B → C; Commit B is ADR-0011 amendment; Commit C is Phase 2 retrospective writeup at separate session)

## Goal

Amend ADR-0016 (Document Relationship Graph) to reconcile §1, §3, §5 with chunk-5 ship state + correct §6→§4 cross-reference drift surfaced at chunks-5-6. Three sub-findings of retrospective inventory item #6 close: 6.1 (§6→§4 cross-ref correction), 6.2 (§5 reverseLinkedEntityLink signature + reversal_reason), 6.3 (§1 v1-active overshoot — tighten to match codebase reality).

Editorial work only — no migration, no service, no tests, no validation gate against test counts. Brief + ADR edits ship in one bundled commit; new §Amendment block at end of ADR-0016 mirrors ADR-0011's 2026-05-08 manual_born_paid_workflow precedent.

## Sub-finding 6.1 — §6→§4 cross-ref correction

Audit pass at brief-loop verified-from-disk surfaced **8 wrong references** to `ADR-0011 §6` in ADR-0016 (chunk-5 implementation notes estimated "at least 4"; verify-from-disk produces the actual count). Plus 2 correct references that legitimately point at ADR-0011 §6 (the `document_type` discriminator section).

Distinguisher: references about `source_document_links` are wrong (should be §4, which owns source_document_links table reservation); references about the `document_type` discriminator are correct (§6 is the discriminator section).

8 surgical per-line edits, A.1-i disposition:

| Line | Context | Edit |
|---|---|---|
| 69 | "The document relationship graph is the schema substrate that ADR-0011 §6 reserved..." | `§6` → `§4` |
| 145 | "**ADR-0011 §6** — `source_document_links` table existence and base columns" | `§6` → `§4` |
| 910 | "`source_document_links` table itself is owned by ADR-0011 §6" | `§6` → `§4` |
| 921 | "(closed enum on `source_document_links` per ADR-0011 §6) — linked_entity_type" | `§6` → `§4` |
| 928 | "(closed enum on `source_document_links` per ADR-0011 §6) — link_role" | `§6` → `§4` |
| 940 | "The table's column set is owned by ADR-0011 §6" (source_document_links) | `§6` → `§4` |
| 945 | "`source_document_links` table is owned by ADR-0011 §6" | `§6` → `§4` |
| 1468 | "rejected per ADR-0011 §6's table reservation" (alternatives-considered re: source_document_links) | `§6` → `§4` |

**Correct references preserved** (NOT edited):
- Line 398: "forward-pointed by ADR-0011 §6 (the `document_type` discriminator's reserved set..."
- Line 961: "`document_type` enum membership (on `document_cases`) — owned by ADR-0011 §6"

**Post-edit verify**: re-grep ADR-0016 for `ADR-0011 §6` after the 8 edits land; expect exactly 2 remaining matches (lines 398, 961). If any other match appears, audit missed a reference; surface for re-adjudication.

## Sub-finding 6.2 — §5 reverseLinkedEntityLink signature reconciliation (A.2-i+cite)

§5's current 4-field signature at line 765-767:

> 1. **Input.** The function accepts `(linked_entity_type, linked_entity_id, reversal_trace_id, controller_user_id)`. The `reversal_trace_id` propagates from the upstream reversal's trace per Service Communication Rule 5 from `ledger_truth_model.md`.

Chunk-5 schema (`sourceDocumentLink.schema.ts` lines 85-91) field order:

```typescript
ReverseLinkedEntityLinkInputSchema = z.object({
  linked_entity_type,
  linked_entity_id,
  reversal_reason,         // 3rd field; required string
  reversal_trace_id,
  controller_user_id,
});
```

Amendment: insert `reversal_reason` as 3rd field in §5's signature. Add a parenthetical citation parallel to the existing `reversal_trace_id` Service Communication Rule 5 citation. No justification paragraph (A.2-i+cite per user adjudication: §5 is contract-not-justification surface; "why this field" lives at §Reserved-enums-and-audit-events line 1011).

**Edit**: replace `(linked_entity_type, linked_entity_id, reversal_trace_id, controller_user_id)` with `(linked_entity_type, linked_entity_id, reversal_reason, reversal_trace_id, controller_user_id)`. After the existing Service Communication Rule 5 sentence (which stays attached to `reversal_trace_id`), append: "The `reversal_reason` is a required controller-stamped string per §Reserved-enums-and-audit-events — the `source_document_link_reversed` audit event lists `reversal_reason` as a required field."

## Sub-finding 6.3 — §1 v1-active overshoot (A.3-i + A.4-ii via table split)

§1 currently lists 8 v1-active `linked_entity_type` values; chunk-5 substrate ships 6 v1-active (vendor_credit + vendor_credit_application reserved-post-v1 because Phase 5 doesn't ship vendor_credits / vendor_credit_applications tables — no v1 consumer service). Amendment reconciles ADR-0016 to match codebase reality per (β) reconciliation pattern + ADR-0010 substrate-now-enforcement-later discipline + "land schema with consumer code" governance.

**Cascading edits across 4 sections + 1 closure summary** (cascade enumerated at brief-loop verify-from-disk):

### §1 v1-active subset (line 270-285)

- v1 active subset: 8 values → **6 values** (drop `vendor_credit`, `vendor_credit_application`).
- Reserved post-v1: 20 values → **22 values** (gain `vendor_credit`, `vendor_credit_application`).
- Add explanation paragraph after the Reserved post-v1 listing (per user's tightened wording): "`vendor_credit` and `vendor_credit_application` were listed in the original §1 v1-active subset, but Phase 5 substrate did not ship `vendor_credits` / `vendor_credit_applications` tables (no v1 consumer service). Moved to reserved post-v1 per ADR-0010 substrate-now-enforcement-later discipline; chunk-5 substrate ships the tighter 6-value CHECK at Layer 1; activation lands alongside the future substrate per 'land schema with consumer code' (Phase 1 storage_substrate migration anti-scope precedent at supabase/migrations/20240135000000_storage_substrate.sql)."

### §3 pair-validity matrix (line 424-553)

- Table A (v1-active rows): 8 rows × 27 columns = 216 cells → **6 rows × 27 columns = 162 cells**. Move `vendor_credit` (line 489) and `vendor_credit_application` (line 490) rows from Table A to Table B.
- Table B (reserved-post-v1 rows): 20 rows × 27 columns = 540 cells → **22 rows × 27 columns = 594 cells**. The 2 promoted rows' cell labels rewrite from their current state (each row has 1 `A` cell at `supporting`) to all-`R`-or-`I` per Table B convention (the 2 `A` cells become `R` since entity type is no longer v1-active). Other cells stay as-is (I → I).
- Update Table A header: "(8 rows × 27 columns = 216 cells)" → "(6 rows × 27 columns = 162 cells)".
- Update Table B header: "(20 rows × 27 columns = 540 cells)" → "(22 rows × 27 columns = 594 cells)".
- Update Cell count totals paragraph (line 525-536):
  - Table A: "216 cells" → "162 cells"; row breakdown updates (drop vendor_credit 1, vendor_credit_application 1; remaining 6 entity types: bill 3, bill_line 1, payment 3, bill_payment_allocation 2, vendor_prepayment 3, vendor_prepayment_application 1).
  - Table B: "540 cells" → "594 cells".
  - Combined: "756 cells" stays the same (162 + 594 = 756). ✓
  - Active v1 (`A`): "15 cells" → "**13 cells**" (drop the 2 vendor_credit-* `A` cells).

### §5 cascade matrix (line 746-755) — A.4-ii table split

Current single-table structure (8 rows). Amendment splits into two visually distinct tables per user adjudication (table split, not header note).

- **Top table — v1-active entity types (6 rows)**: bill, bill_line, payment, bill_payment_allocation, vendor_prepayment, vendor_prepayment_application. Header unchanged.
- **Bottom table — reserved post-v1 entity types (2 rows)**: vendor_credit, vendor_credit_application. Mini-header above the table: "Reserved post-v1 entity types (cascade behavior specified at v1 schema time per ADR-0010; substrate ships when a v1 consumer service emerges per 'land schema with consumer code' discipline)."

The 2 reserved-post-v1 rows' cascade-behavior content stays unchanged (the design-work content is load-bearing for future Phase 5 amendment when the substrate ships); only the visual presentation changes.

### §Schema-deltas (line 920-926)

Updates to match §1:
- "v1 active subset is 8 values (`bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`, `vendor_credit`, `vendor_credit_application`)" → "v1 active subset is **6 values** (`bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`)."
- "Reserved post-v1: 20 values enumerated in item 1." → "Reserved post-v1: **22 values** enumerated in item 1."

### §Closes Q55 (line 1183)

Inline summary update:
- "(a) `linked_entity_type` enum membership — full reserved set per item 1 + v1 active subset (8 values: `bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`, `vendor_credit`, `vendor_credit_application`)" → "(a) `linked_entity_type` enum membership — full reserved set per item 1 + v1 active subset (**6 values**: `bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`); `vendor_credit` and `vendor_credit_application` reserved post-v1 per item 1 (substrate not shipped in Phase 5)."
- "(c) ... 15 active v1 cells, remainder reserved or invalid" → "(c) ... **13 active v1 cells**, remainder reserved or invalid".

## §Amendment block (new, at end of ADR-0016)

Mirrors ADR-0011's 2026-05-08 manual_born_paid_workflow precedent shape (Status amended-date / Substance / Why this amendment / Bundling / Cross-references / This is ADR-0016's first amendment).

Draft text:

```
## Amendment — Phase 2.5 Commit A reconciliation (2026-05-13)

ADR-0016 is amended at Phase 2.5 close (the Phase 2 close + ADR
audit cycle following six chunks of substrate ship). Path (a) of
the audit-cycle (β) reconciliation pattern: ADR text catches up to
chunk-5 substrate ship state plus corrects cross-reference drift to
ADR-0011 §4.

### Substance

Three reconciliations:

1. **§6→§4 cross-reference correction (8 locations).** ADR-0016
   referenced `ADR-0011 §6` in 8 contexts that should have cited
   `ADR-0011 §4` (the section that owns source_document_links
   table reservation; §6 owns the document_type discriminator).
   References at lines 69, 145, 910, 921, 928, 940, 945, 1468
   updated. References at lines 398 and 961 correctly cite §6 (the
   document_type discriminator context) and are preserved.

2. **§5 reverseLinkedEntityLink signature reconciliation
   (4-field → 5-field).** Chunk-5 substrate shipped
   `reverseLinkedEntityLink` with 5 input fields because the
   audit event spec at §Reserved-enums-and-audit-events requires
   `reversal_reason` on every `source_document_link_reversed`
   audit event. §5's 4-field signature predated the chunk-5 ship;
   the amendment inserts `reversal_reason` as the 3rd field
   matching schema order at
   `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts`.

3. **§1 v1-active subset 8→6 + cascading edits.** §1 listed
   `vendor_credit` and `vendor_credit_application` as v1-active
   `linked_entity_type` values; chunk-5 substrate shipped the
   tighter 6-value v1-active CHECK because Phase 5 substrate did
   not ship `vendor_credits` / `vendor_credit_applications`
   tables (no v1 consumer service). Per ADR-0010
   substrate-now-enforcement-later discipline + 'land schema
   with consumer code' governance (Phase 1 anti-scope precedent
   at supabase/migrations/20240135000000_storage_substrate.sql):
   `vendor_credit` and `vendor_credit_application` moved to
   reserved post-v1. Cascading edits to §3 (Table A 8→6 rows;
   Table B 20→22 rows; Cell count totals 15→13 active v1
   cells), §5 (cascade matrix split into v1-active + reserved
   post-v1 sub-tables), §Schema-deltas, §Closes Q55.

### Why this amendment

Per chunk-5 implementation close (`docs/07_governance/friction-journal.md`
line 11074 region, chunk-5 friction-journal entry "**ADR-0016 §1
vendor_credit / vendor_credit_application substrate gap**"):
chunk-5 substrate shipped the tighter 6-value CHECK with explicit
deviation from ADR-0016 §1; the (β) reconciliation pattern says
ADR text catches up at the next retrospective cycle. Phase 2.5 is
that cycle. The §6→§4 cross-reference drift was a separate audit
finding at chunk-5 close consolidated into the same retrospective
inventory item; the §5 signature gap was a third chunk-5-close
finding under the same item.

### Bundling

Phase 2.5 Commit A bundles three sub-findings (6.1, 6.2, 6.3) of
retrospective inventory item #6 — the consolidated ADR-0011 +
ADR-0016 cross-ADR editorial audit cycle. Commit B (ADR-0011
amendment) bundles four more sub-findings (6.4-6.7). Commit C
(Phase 2 retrospective writeup) closes the consolidated audit
item with reference to commits A and B.

### Cross-references

- `docs/07_governance/friction-journal.md` — chunk-5 close entry
  documenting the substrate-now-amendment-later trajectory for
  §1.
- `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts`
  lines 18-25 — chunk-5 LinkedEntityTypeSchema 6 v1-active
  values (source of truth for §1 reconciliation).
- `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts`
  lines 85-95 — chunk-5 ReverseLinkedEntityLinkInputSchema
  5-field shape (source of truth for §5 signature
  reconciliation).
- `supabase/migrations/20240147000000_source_document_links_substrate.sql`
  — chunk-5 linked_entity_type_chunk_5_active CHECK + ENUM
  membership (28 values total; 6 v1-active CHECK).
- `supabase/migrations/20240135000000_storage_substrate.sql`
  lines 46-49 — Phase 1 'land schema with consumer code'
  governance precedent.

This is **ADR-0016's first amendment**. Title-line stability
preserved (no title-line revision). Scope is narrow (the three
sub-findings); broader Phase 0 review deferred per
arc-class first-instance status framing.
```

## Implementation tasks

1. Read ADR-0011 §4 to confirm it owns source_document_links table reservation (sanity check before the 8 §6→§4 edits).
2. Apply 8 surgical §6→§4 edits at the verified lines.
3. Post-edit re-grep for `ADR-0011 §6` to confirm exactly 2 remaining matches (lines 398, 961).
4. Apply §5 line 765-767 edit: insert `reversal_reason` as 3rd field + parenthetical citation.
5. Apply §1 line 270-285 edits: v1 active subset 8→6 values; Reserved post-v1 20→22 values; add explanation paragraph.
6. Apply §3 Table A edits: drop vendor_credit + vendor_credit_application rows; update header cell count 216→162.
7. Apply §3 Table B edits: add vendor_credit + vendor_credit_application rows (cell labels: 1 A → R per Table B convention; other I cells preserved); update header cell count 540→594.
8. Apply §3 Cell count totals paragraph edit: 8→6 rows; 216→162 (Table A); 20→22 rows; 540→594 (Table B); 15→13 (Active v1).
9. Apply §5 cascade matrix split edit: top table 6 v1-active rows; bottom table 2 reserved-post-v1 rows with mini-header per A.4-ii.
10. Apply §Schema-deltas edit at line 920-926: v1-active 8→6; Reserved post-v1 20→22.
11. Apply §Closes Q55 edit at line 1183: 8→6 values; 15→13 cells.
12. Append §Amendment block at end of ADR-0016.

## Commit message

```
docs(adr): ADR-0016 amendment — §1 v1-active reconciliation + §5 signature reconciliation + §6→§4 cross-ref correction (Phase 2.5 commit A; closes retrospective item #6 sub-findings 6.1/6.2/6.3)

Phase 2.5 Commit A of three. Editorial amendment closing three
sub-findings of retrospective inventory item #6 (ADR-0011 +
ADR-0016 cross-ADR editorial audit):

- 6.1 §6→§4 cross-reference correction at 8 locations
  (source_document_links is owned by ADR-0011 §4, not §6 which
  owns the document_type discriminator). 2 §6 references at
  lines 398 + 961 correctly cite the document_type discriminator
  section and are preserved. Post-edit re-grep verified.

- 6.2 §5 reverseLinkedEntityLink signature reconciliation
  (4-field → 5-field). chunk-5 shipped the 5-field shape because
  §Reserved-enums-and-audit-events requires reversal_reason on
  every source_document_link_reversed audit event. Inserts
  reversal_reason as 3rd field matching schema order at
  sourceDocumentLink.schema.ts lines 85-91. A.2-i+cite per
  Phase 2.5 scope-lock sub-option adjudication (cite, don't
  justify).

- 6.3 §1 v1-active subset 8→6 values per chunk-5 substrate ship.
  vendor_credit + vendor_credit_application moved to reserved
  post-v1 (no v1 consumer service; Phase 5 substrate doesn't
  ship the tables). Cascading edits to §3 (Table A 8→6 rows,
  Table B 20→22 rows, active v1 cells 15→13), §5 (cascade
  matrix split into v1-active 6-row + reserved-post-v1 2-row
  sub-tables per A.4-ii), §Schema-deltas, §Closes Q55. (β)
  reconciliation pattern + ADR-0010 substrate-now-enforcement-
  later discipline + 'land schema with consumer code'
  governance.

Brief at docs/09_briefs/phase-2.5/2026-05-13-phase-2-5-commit-a.md.
New §Amendment block at end of ADR-0016 mirroring ADR-0011's
2026-05-08 manual_born_paid_workflow precedent. ADR-0016's
first amendment.

Sub-findings 6.4-6.7 ship in Commit B (ADR-0011 amendment).
Item #6 closes at Commit C (Phase 2 retrospective writeup).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
