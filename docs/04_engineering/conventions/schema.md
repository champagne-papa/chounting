# Schema conventions

Zod schemas, JSON schema generation, API boundary casing. The
boundary discipline that keeps the API surface, the database
surface, and the agent toolchain in sync.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

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

### Extension — strict-mode-for-our-shape vs passthrough-for-third-party

The Phase 1.5A `.strict()` rule above is the foundation; chunk
6.2b + chunk 6.3a refined it with a substrate-origin discriminator
that separates **our-shape schemas** from **third-party-payload
schemas**.

Zod schemas split on `.strict()` / `.passthrough()` based on
substrate origin:

- **Our-shape schemas** use `.strict()` — typically with `.refine()`
  sentinel-rejection layer for defense-in-depth. Detect drift early;
  symmetric Layer-2 write-side discipline.

- **Third-party-payload schemas** use `.passthrough()` — forward-
  compat with provider API additions (new fields silently dropped at
  our-shape construction). Sentinel-rejection NOT applied (third-
  party payload won't naturally emit our sentinel-shape;
  defense-in-depth marginal).

**Evidence basis (N=2 graduation).**
`DragDropChannelMetadataSchema` `.strict()` + `.refine()` for
sentinel rejection (our-shape; chunk 6.2b);
`PostmarkInboundWebhookSchema` `.passthrough()` for forward-compat
with Postmark API additions like `ReplyTo`, `MessageStream`,
`OriginalRecipient` (third-party-payload; chunk 6.3a).

**Discipline rule.** Authoring a new Zod schema requires
substrate-origin classification: our-shape gets `.strict()`; third-
party-payload gets `.passthrough()`. PascalCase field names at the
third-party-payload boundary transform to snake_case at our-shape
construction.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15 (foundational `.strict()`
  rule); extended at Phase 6 chunks 6.2b + 6.3a (substrate-origin
  discriminator)
- Evidence basis: foundational — N=multiple (Phase 1.5A organization
  schemas); extension — N=2 graduation
  (`DragDropChannelMetadataSchema` our-shape strict at chunk 6.2b
  + `PostmarkInboundWebhookSchema` third-party-payload passthrough at
  chunk 6.3a)
- Promoted from: Phase 1.5A convention codification batch; extension
  promoted from chunks 6.2b + 6.3a implementation notes
- Cross-references: `src/shared/schemas/`;
  `DragDropChannelMetadataSchema`; `PostmarkInboundWebhookSchema`
- v2.2 reorg: 2026-05-17 (substrate-origin discriminator extension
  relocated from repo-root CLAUDE.md at Commit D per
  `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1; merged with
  existing Phase 1.5A entry via primary-entry-plus-extension pattern
  per §A.14)
