# Migration conventions

Supabase migration discipline, RLS preservation, NOT NULL blast
radius, review cadence, and seed-data discipline. The rules that
prevent migration-time mistakes that are expensive to retrofit.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

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

---

## Substrate-mod-event test-staleness review

When shipping a substrate modification that broadens an enum, adds
a partial UNIQUE constraint, renames a CHECK constraint, or
otherwise changes a column-level invariant, audit dependent tests
at substrate-mod commit time (not at downstream test-failure time)
for:

- Assertion strings referencing constraint names (likely to drift)
- Hardcoded values that the substrate-mod broadens or constrains
  (likely to collide)
- Reserved-set assertions (likely to invalidate)

**Evidence basis (N=3 graduation).** chunk-2-Phase-4 β-2
(exception_status `'matched'` broadening invalidated chunk-6 test
assertion on still-reserved set); chunk-6-Phase-2 β-2c (audit test
regex hardcoded constraint name that broadening migration renamed);
chunk-6.3a β-4 (chunk-6.1 RPC rollback test hardcoded `message_id`
collided with migration 155 idempotency partial UNIQUE index).

**Trigger.** Any substrate-mod commit that touches CHECK
constraint suffixes, enum membership, UNIQUE indexes, or column-
level NOT NULL invariants. Discipline fires at the substrate-mod
commit grain, before substrate changes propagate to downstream
consumer tests.

---
**Origin:**
- First codified: Phase 4 chunk 2 close (codified across chunk-2-Phase-4
  + chunk-6-Phase-2 + chunk-6.3a observations)
- Evidence basis: N=3 graduation (chunk-2-Phase-4 β-2 +
  chunk-6-Phase-2 β-2c + chunk-6.3a β-4)
- Promoted from: friction-journal substrate-mod observations across
  Phase 2 chunk 6, Phase 4 chunk 2, Phase 6 chunk 6.3a
- Cross-references: chunk-2-Phase-4 implementation notes (β-2);
  chunk-6-Phase-2 implementation notes (β-2c); chunk-6.3a
  implementation notes (β-4); migration 155 idempotency partial
  UNIQUE index
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Seed-data PII-shape placeholder convention

When migration-seeded data includes PII or near-PII (email addresses,
phone numbers, personal identifiers), prefer placeholder-plus-post-
deploy convention vs. literal-values-in-migration.

**Pattern.** Migration ships placeholder rows (e.g.,
`placeholder-founder@chounting.com`); operator runs post-deploy
`UPDATE` to substitute real values. Discipline-failure mode if
forgotten: downstream consumer rejects all data as not-matching
expected shape (loud, observable, not silent).

**Reason.** Git history is forever; v1 audience scope (internal-only)
does not constrain future audience. Placeholder seeds keep PII out of
the git provenance trail.

**Evidence basis (N=1 first-instance precedent at chunk-6.3a;
load-bearing-for-future-PII-seed-migrations).** Migration 155
Statement 3 inserts 3 allowlist seed rows with placeholder addresses
for `internal_sender_allowlist`. Operator runs post-deploy `UPDATE`
for each placeholder.

**Cross-references.**
- `supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql`
  Statement 3 — first-instance precedent.
- chunk-6.2a `_for_test` suffix convention (N=1 first-instance
  precedent) — parallel graduation pattern.

---
**Origin:**
- First codified: Phase 6 chunk 6.3a (load-bearing for future
  PII-seed migrations)
- Evidence basis: N=1 first-instance precedent (migration 155
  Statement 3 internal_sender_allowlist seed rows)
- Promoted from: chunk-6.3a implementation notes
- Cross-references:
  `supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql`
  Statement 3; chunk-6.2a `_for_test` suffix convention (parallel
  graduation pattern)
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Versioned-CHECK constraint naming (linear chunk suffix)

When a v1-active CHECK constraint with the `_chunk_N_active` suffix
shape is broadened (new value admitted) and renamed, the new name
continues the **linear chunk-number suffix** — `chunk_{N+1}_active` —
regardless of which phase, wave, or arc lands the broaden. Do not
switch the suffix vocabulary to the landing arc's naming
(`_wave_N_active`, `_phase_N_active`): the suffix is a per-constraint
version counter, not a provenance tag. Provenance lives in the
migration header; the constraint name only needs to order the
broadening events.

**Mechanism.** Dependent tests pin the constraint name with
forward-compatible regexes
(`/document_cases_state_chunk_\d+_active/` — 3 sites across 2 files
at codification time). The linear suffix passes those pins across
arbitrarily many broadens; a vocabulary switch breaks every pin for
zero information gain. The suffix is monotonic, not dense (the
historical chunk_2 → chunk_6 jump tracked the landing chunk's
number); going forward the rule is current+1 — readers should not
infer missing constraint versions from gaps.

**Alternatives were weighed at adoption** (phase-4 chunk-2 brief
R2.3): a phase-based suffix communicates the broadening event's
phase but loses the linear sequence; a time-based suffix communicates
chronology but loses semantic grouping. The chunk-number sequence was
picked for continuity with the chunks-1-6 precedent and is ratified
here.

---
**Origin:**
- First codified: V1 Wave 6 D2.1 T1, 2026-06-03 (migration
  `20240174000000`, `document_cases_state_chunk_7_active` →
  `chunk_8_active`, +`extracting`)
- Evidence basis: pre-named deferred-codification trigger —
  `20240150`'s header + the phase-4 chunk-2 brief (R2.3) deferred
  ratification to "the second cross-phase CHECK-broaden event";
  Wave 6 D2.1 is that event. Naming-lineage N=4 broaden events
  (`20240144` chunk_1→2; `20240148` chunk_2→6; `20240150` chunk_6→7,
  first cross-phase; `20240174` chunk_7→8, second cross-phase).
  Empirical pin: 3 test sites across 2 files assert
  `/document_cases_state_chunk_\d+_active/`.
- Promoted from:
  `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-2.md`
  §"Layer 1 CHECK suffix discipline — provisional `_chunk_7_active`"
  (R2.3) + the friction-journal NOTE 2026-06-03 (codification event).
- Cross-references: `.claude/rules/migrations.md` (operational
  projection); "Substrate-mod-event test-staleness review" above
  (sibling discipline — the same broaden event triggers both);
  advisor-steered + CTO-approved at the Wave-6 D2.1 plan read-back.

**Evaluation basis:**

- **Load-bearing (prescriptive).** Generates a concrete naming
  action at every CHECK-broaden event and prevents a test-breakage
  class: the pinned `\d+` regexes encode the linear suffix as an
  empirical contract, so the suite enforces the convention — not
  just discipline.
- **Generalizable.** Applies to any versioned v1-active constraint
  with the `_<suffix>_active` shape (e.g.
  `exception_reason_chunk_8_active` follows the same lineage on a
  different table), not only `document_cases.state`.
- **Stable.** The lineage has held across four broaden events
  spanning three phases; the codification was pre-scheduled by the
  artifact that created the ambiguity (R2.3), and the alternatives
  (phase-suffix, time-suffix) were weighed and rejected at adoption.
