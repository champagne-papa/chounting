---
paths:
  - "supabase/migrations/**/*.sql"
---

# Migration rule (path-scoped)

When editing SQL migration files under `supabase/migrations/`:

- **NOT NULL blast radius.** Adding a `NOT NULL` column without a
  `DEFAULT` requires a blast-radius enumeration in the brief —
  every file that INSERTs into the table. Generate with:
  `grep -rn "INSERT INTO <table>" --include="*.ts" --include="*.sql" src/ tests/`.
  See `docs/04_engineering/conventions/migrations.md` "NOT NULL
  Column Blast Radius" for the full discipline.
- **Migration review cadence.** Stop after each migration for
  review before writing the next. See `migrations.md` "Migration
  Review Cadence".
- **Seed-data PII placeholder.** Migration-seeded rows with PII
  (emails, phones) ship as placeholders (e.g.,
  `placeholder-founder@chounting.com`); operator runs post-deploy
  `UPDATE` for real values. Keeps PII out of git history. See
  repo-root `CLAUDE.md` "Seed-data PII-shape placeholder
  convention" (relocates to `migrations.md` at Commit D of the v2.2
  reorg).
- **Substrate-mod test-staleness review.** Migrations broadening
  `CHECK` constraints / `ENUM` membership / `UNIQUE` indexes /
  column-level `NOT NULL` invariants require auditing dependent
  tests at substrate-mod commit time. See repo-root `CLAUDE.md`
  "Substrate-mod-event test-staleness review" (relocates to
  `migrations.md` at Commit D).
- **RLS preservation.** Adding tables that hold org-scoped data
  requires the standard 4-policy RLS pattern (SELECT/INSERT/UPDATE/
  DELETE through-parent with `org_id` derivation). See
  `migrations.md` and the chunk-3-Phase-2 `org_id`-derived-in-RPC
  pattern (canonical post-chunk-3 across Phase 2/3).

This is an operational projection of canonical conventions; for
edge cases or full discipline, read the topical files above.
