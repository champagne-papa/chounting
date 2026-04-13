# Where I am as of 2026-04-17 (Phase 15A complete)

Phase 15A (inline, 5 commits):
1. mirrorLines pure helper + 6 unit tests
2. reversed_by in JournalEntryListItem (separate query, Option Q)
3. reversed_by in JournalEntryDetail (separate query)
4. List view "Reversed" indicator (opacity-60 + badge)
5. Detail view Reverse button disabled when already reversed

Next: Phase 15B (subagent: ReversalForm component).
The form:
- Fetches source entry via GET /api/orgs/${orgId}/journal-entries/${sourceEntryId}
- Calls mirrorLines on source entry's lines → read-only preview
- User edits only: entry_date (default today) and reversal_reason (required)
- ReversalFormSchema validates ONLY user-editable fields
- reversalFormStateToServiceInput combines form state + locked mirrored
  lines + original entry ID + current period → ReversalInput
- POSTs to /api/orgs/${orgId}/journal-entries (same endpoint, discriminated
  union routing on reverses_journal_entry_id)
- Period gap banner: non-dismissible yellow warning when reversal period
  differs from original entry's period
- Success: navigate to detail view of the NEW reversal entry
- ContextualCanvas: move reversal_form from Phase 2+ group to dedicated
  case rendering ReversalForm

Key interfaces:
- reversal_form directive: { type: 'reversal_form'; orgId: string; sourceEntryId: string }
- mirrorLines: imported from journalEntry.schema.ts
- ReversalInputSchema: requires lines array + reverses_journal_entry_id + reversal_reason
- The form constructs the full ReversalInput including mirrored lines

Seed passwords (all end in #1):
- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

Dev server rule: kill before rm -rf .next, or restart after.
