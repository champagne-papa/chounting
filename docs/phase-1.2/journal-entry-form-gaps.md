# Phase 1.2 — Journal Entry Form Gaps

Reference: Zoho Books New Journal form (screenshot captured
during Phase 13B smoke test, 2026-04-13). Comparison against
Phase 1.1's JournalEntryForm.tsx.

## Schema changes needed (migration work)
- `journal_lines.description`: per-line memo (currently only entry-level
  `journal_entries.description`). Standard accounting software allows a
  description per line for audit clarity.
- `journal_entries.status` or `posted_at`: distinguish drafts from posted
  entries. Phase 1.1 has no draft concept — every submit is immediately
  posted. Phase 1.2's agent path may need draft state for the
  dry-run → confirm flow.
- `journal_entries.vendor_id` or `customer_id`: link entries to contacts.
  Phase 1.1 has no vendor/customer picker on the form. Phase 1.2's AP
  Agent will need this for bill-to-entry translation.

## Form features deferred from Phase 1.1
- Reference # — field exists in the schema and form but is underused
  (no auto-generation, no search by reference)
- Save as Draft — requires `status` column on `journal_entries`
- Multi-currency dropdown — requires FX rate lookup per PLAN.md §8b
  (Phase 4 wiring)
- Reverse Journal Date — scheduled reversals (deferred to Phase 2+
  per ADR-001 and spec §4h)
- Attachments upload — `journal_entry_attachments` table exists
  (migration 006), UX for uploading missing
- Per-line description — requires `journal_lines.description` to be
  surfaced in the form (column exists in the schema, not in the form)
- Per-line contact/vendor picker — requires schema + form changes
- Choose Template / Make Recurring — Phase 2+ automation per §18
  deferred items (Q23 recurring entries)

## UX fixes (quick wins for Phase 1.2)
- MoneyAmount validation error leaks regex to user. Fix: already applied
  in Phase 15B (custom message in money.schema.ts). Audit FxRate and
  any other branded type schemas for similar missing custom messages.
- Fiscal Period dropdown "Select a period..." is a selectable option
  instead of a disabled placeholder. Fix: `<option disabled value="">`.
  Affects both JournalEntryForm and ReversalForm period dropdowns.
- Fiscal Period dropdown defaults to an arbitrary month instead of the
  period matching the entry_date. Fix: compute default by finding the
  period whose start_date <= entry_date <= end_date. Discovered during
  Task 17 smoke test (seed creates 12 monthly periods, not "FY Current").

## Phase 2+ features (not for Phase 1.2)
- Accrual vs Cash reporting method toggle
- Transaction Type categorization (beyond entry_type enum)
- Recurring entries (requires pg-boss, Phase 2)
- Journal templates (requires template schema design)
