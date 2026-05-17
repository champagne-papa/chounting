# Migration conventions

Supabase migration discipline, RLS preservation, NOT NULL blast
radius, review cadence, and seed-data discipline. The rules that
prevent migration-time mistakes that are expensive to retrofit.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

Seed-data PII-shape placeholder convention and substrate-mod
test-staleness review are currently in repo-root `CLAUDE.md`; they
relocate to this file at Commit D of the v2.2 reorg (see
`docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1).

---

## Migration Review Cadence

Stop after each migration for review before writing the next.
Phase 1.5A's four-migration sequence used this cadence and caught
two issues early (seed count drift, ActionName collision) that
would have been harder to untangle in a larger commit.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=2 within Phase 1.5A four-migration sequence
  (seed count drift, ActionName collision)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references: `supabase/migrations/`

---

## NOT NULL Column Blast Radius

When a brief adds a `NOT NULL` column **without a DEFAULT** to an
existing table, include a "blast radius" section listing every
file that inserts into that table. Generate the list with:

```bash
grep -rn "INSERT INTO <table>" --include="*.ts" --include="*.sql" src/ tests/
```

Phase 1.5A's `source_system NOT NULL` on `journal_entries` broke
four files (`journalEntryService.ts`, `crossOrgRlsIsolation.test.ts`,
both SQL test helpers, plus `dev.sql`). All fixes were mechanical
but should have been pre-identified in the brief. See
`docs/07_governance/friction-journal/phase-1.5.md` entry 2026-04-15.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=1 first-instance precedent (`source_system NOT
  NULL` on `journal_entries`; 4-file blast radius)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.5.md` entry
  2026-04-15
