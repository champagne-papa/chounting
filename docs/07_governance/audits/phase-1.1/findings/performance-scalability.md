# Performance & Scalability — Findings Log

Scanner: Performance & Scalability
Phase: End of Phase 1.1
Date: 2026-04-13
Category status: Sparse — no production traffic, load testing, or performance baselines at this phase.

## Baseline

Phase 1.1 operates at development scale: ~16 chart-of-accounts rows per org, ~12 fiscal periods, single-digit journal entries in test fixtures. Report RPC functions (`get_profit_and_loss`, `get_trial_balance` in migration 007) use LEFT JOINs with `GROUP BY` and `FILTER` clauses. Indexes exist on the primary query paths: `idx_je_org_period` covers the journal entries lookup, `idx_jl_entry` and `idx_jl_account` cover journal lines joins, `idx_coa_org` covers chart-of-accounts lookups. No caching layer exists. No pagination on any list endpoint.

## Findings

### PERF-001: Journal entry list and report endpoints return unbounded result sets

- **Severity:** Low
- **Description:** `journalEntryService.list()` (`journalEntryService.ts:307-312`) queries all journal entries for an org (optionally filtered by period) with no `LIMIT` clause. The service then makes two additional batch queries: one for all lines of those entries, one for all reversing entries referencing those entry IDs. Similarly, `chartOfAccountsService.list()` and `periodService.listOpen()` return all rows without pagination. At Phase 1.1 volumes (single-digit entries, ~16 accounts, ~12 periods), this is fine. At ~1000+ entries per period, the three-query pattern in `list()` would transfer large payloads and consume memory client-side.
- **Evidence:**
  - `src/services/accounting/journalEntryService.ts:307-312` — no `.limit()` on entry query
  - `src/services/accounting/journalEntryService.ts:324-327` — `.in('journal_entry_id', entryIds)` with unbounded `entryIds`
  - `src/services/accounting/chartOfAccountsService.ts:30-34` — no `.limit()` on accounts query
- **Consequence:** No current impact. Will require pagination when journal entry counts reach hundreds per period. The three-query batch pattern in `list()` is efficient (avoids N+1) but returns all data in memory.
- **Cross-references:**
  - Phase 1.2 obligations — pagination is not yet listed as an obligation but should be considered when agent-driven batch entry creation is introduced

## Future Audit Triggers

- When production data volumes reach hundreds of journal entries per org-period, the unbounded list queries become a measurable concern.
- When agent-driven batch operations (Phase 1.2) create multiple entries in rapid succession, the entry_number MAX+1 pattern (H-04, no `FOR UPDATE` lock) becomes a concurrency bottleneck.
- When report queries cover multiple periods with thousands of lines, the RPC function performance should be profiled.
- When the frontend bundle grows past Phase 1.2 (agent SDK, chat UI), bundle size analysis becomes relevant.

## Category Summary

No performance bottlenecks at current Phase 1.1 volumes. The query patterns are batch-oriented (not N+1), and indexes cover the primary query paths. The one structural concern — unbounded result sets — is appropriate for Phase 1.1 but will need pagination before moderate data volumes arrive.
