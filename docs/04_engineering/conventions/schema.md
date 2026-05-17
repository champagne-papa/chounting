# Schema conventions

Zod schemas, JSON schema generation, API boundary casing. The
boundary discipline that keeps the API surface, the database
surface, and the agent toolchain in sync.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

Zod strict-vs-passthrough discipline is currently in repo-root
`CLAUDE.md` under "Zod strict-mode-for-our-shape vs
passthrough-for-third-party"; it relocates to this file at Commit D
of the v2.2 reorg (see
`docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1).

---

## API Boundary Casing

Schemas under `src/shared/schemas/organization/` use **camelCase**
field names on the API boundary. The service layer maps camelCase →
snake_case DB columns via dedicated helper functions
(`profilePatchToDbColumns`, `addressInputToDbColumns`).

The only non-1:1 mapping is `baseCurrency` → `functional_currency`.

The earlier `src/shared/schemas/accounting/` schemas predate this
convention and use snake_case directly. Do not mix conventions
within a subdirectory; do match the existing convention when adding
to an existing subdirectory.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=multiple (Phase 1.5A organization schemas)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references: `src/shared/schemas/organization/`,
  `src/shared/schemas/accounting/`

---

## Zod Schema Strictness

Both create schemas and update-patch schemas use `.strict()`.
Typos in payload field names fail loudly with "Unrecognized key"
rather than being silently ignored. Adding a new field requires
editing the schema — matching the "schema change, not silent
write" rule also used by `externalIds.schema.ts` passthrough.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=multiple (Phase 1.5A organization schemas)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references: `src/shared/schemas/`, related "Zod
  strict-mode-for-our-shape vs passthrough-for-third-party" rule in
  repo-root `CLAUDE.md` (which discriminates by substrate origin —
  our-shape gets `.strict()`; third-party-payload gets
  `.passthrough()`)
