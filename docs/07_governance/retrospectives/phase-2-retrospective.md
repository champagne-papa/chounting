# Phase 2 Closeout Retrospective — Document Core

Written: 2026-05-13, immediately after Phase 2.5 Commit B (ADR-0011
amendment) shipped at HEAD `e2cceb9`. This retrospective is itself
Phase 2.5 Commit C — the third and final deliverable of Phase 2.5
(Phase 2 close + ADR audit cycle).

Audience: future-me starting Phase 3 (Document Relationship Graph
consolidation) or Phase 4 (Relationship Router) or Phase 7 (Tier 2
pipeline), the next-phase brief author, any future collaborator
inheriting this codebase.

---

## 1. What Phase 2 actually built

The Document Platform substrate spine per ADR-0011 §1. Six chunks
shipped across roughly 2 calendar days (2026-05-12 through
2026-05-13), each as a single bundled commit. Phase 2.5 closed the
arc with two ADR-amendment commits + this retrospective.

The substrate spine ships these tables, in chunk order:

- **`document_cases`** (chunks 1-2) — the workflow-item entity
  created from one or more source documents; carries the
  `document_case_state` ENUM (10 values; v1-active subset broadens
  chunk-by-chunk from 1 → 4 → 6 via the `_chunk_N_active` CHECK
  pattern). Atomic INSERT-with-audit RPC + atomic UPDATE-with-audit
  RPC for state transitions. Direct org_id 4-policy RLS.
- **`document_case_sources`** (chunk 3) — many-source-to-one-case
  join table with surrogate-PK + UNIQUE-triple. 4-policy
  through-parent RLS via `document_cases.org_id`. Atomic
  INSERT-with-audit RPC with **parent-derived `org_id`** (the
  canonical Phase 2/3 RPC pattern). Full immutability triggers
  (UPDATE + DELETE forbidden).
- **`document_artifacts`** + **`ocr_runs`** + **`extraction_runs`**
  (chunk 4) — engine-agnostic OCR/extraction substrate per ADR-0011
  §5 + ADR-0011 §9 Rules 1 + 2. Three tables, per-table immutability
  triggers, supersession via `supersedes_ocr_run_id` + UNIQUE on
  `(source_document_id, ocr_run_id, extraction_version)`.
  **Substrate-walkable carve-out** — no service surface; the Phase 7
  Tier 2 pipeline orchestrator per ADR-0014 owns the writer.
- **`source_document_links`** (chunk 5) — polymorphic many-to-many
  spine linking `source_documents` to domain entities (bills,
  payments, allocations, prepayments) per ADR-0011 §4 + ADR-0016.
  Three enums (`linked_entity_type` 28 values; `link_role` 27 values;
  `link_status` 2 values), pair-validity matrix per ADR-0016 §3 Table A.
  **Column-level GRANT + BEFORE UPDATE OF trigger composition** for
  narrow service_role mutation on the one mutable column
  (`link_status`). Bulk-reverse atomic RPC per ADR-0016 §5.
- **`exception_queue_entries`** (chunk 6) — first-class workflow
  surface per ADR-0011 §13. Three new enums (`resolution_action` 18
  values; `exception_status` 3 values; `exception_reason` 8 values),
  9-action terminal-state mapping for `resolveException`, partial
  UNIQUE on `(document_case_id) WHERE exception_status = 'open'`,
  column-level GRANT + BEFORE UPDATE trigger composition scaled to
  5 mutable columns, INSERT-then-UPDATE atomic RPC ordering.
  Broadens chunk-2's LEGAL_TRANSITIONS to admit
  `needs_review → classified` for `reprocess` resolution_action.

Plus four Pattern B services on disk:
`documentCaseService` (chunks 1-2), `documentCaseSourceService`
(chunk 3), `documentLinkService` (chunk 5), `documentExceptionService`
(chunk 6). Each follows the same shape — unwrapped function exports
throwing `ServiceError`, Zod parse at service entry, atomic RPC for
mutations, Zod safeParse on read-back.

Concretely, Phase 2 + Phase 2.5 shipped 14 substantive commits
(6 chunk briefs + 6 chunk implementations + 2 ADR amendments + this
retrospective). Test count at HEAD `e2cceb9`: **945/945** vitest
passing, 26/26 `agent:validate` floor green. The Phase 2 substrate
spine is complete per ADR-0011 §1's listing minus three deferred
items (`source_document_versions` shipped in Phase 1; ingest_batches
+ ingest_items + document_jobs deferred to Phase 7 per the "land
schema with consumer code" discipline at Phase 1 storage_substrate
migration lines 46-49).

## 2. The 6-chunk arc + Phase 2.5

Phase 2 ran 6 substantive chunks across roughly 2 calendar days
(2026-05-12 through 2026-05-13). Each chunk had its own
scope-lock → brief-draft → implementation cycle. The chunks were
not pre-planned as a 6-chunk sequence — chunk 6 was the natural
substrate-spine completion point, and Phase 2.5 emerged when chunk-7
scope-lock surfaced that the remaining ADR-0011 §1 entities all
defer to Phase 7 per "land schema with consumer code" discipline.

**Chunk 1 — document_cases substrate.** Shipped Pattern B service +
atomic INSERT-with-audit RPC + ADR-0010 three-layer reserved-enum
defense for `document_case_state` (10 values; v1-active = 1 value).
Direct org_id 4-policy RLS. BEFORE DELETE reject trigger preserving
audit_log referent integrity. Zero implementation-time deviations
from the brief.

**Chunk 2 — transition state machine.** Shipped atomic
UPDATE-with-audit RPC with `FOR UPDATE` lock (narrowed but didn't
eliminate the matrix-check race; documented as accepted). Service-
layer `LEGAL_TRANSITIONS` map (10×10 keyed by `${AllCaseStates}->
${AllCaseStates}` template-literal) + `AUTOMATION_ONLY_TRANSITIONS`
set for actor-gating. Conditional-required Zod discriminated union
for transition input (target_state determines whether reason is
required). The `_chunk_2_active` CHECK broadens
`_chunk_1_active` from 1 → 4 states. Two observations carried
forward: matrix-check race is acceptable; template-literal typing
catches typos not semantic errors.

**Chunk 3 — document_case_sources join table.** Codified
**org_id-derived-in-RPC** as the canonical Phase 2/3 audit-RPC
pattern (audit_log.org_id derived via subquery from the parent
table at INSERT time, not passed by the service). Codified
**surrogate-PK-for-join-tables** (chunks-1-5 precedent is
unambiguously surrogate; no composite-PK join tables in this
codebase). 4-policy through-parent RLS via EXISTS-subquery on
`document_cases.org_id` — different from chunks 1-2's direct
org_id pattern. Zero implementation-time surprises.

**Chunk 4 — document_artifacts + ocr_runs + extraction_runs
substrate-walkable carve-out.** First chunk to refine the phase-done
bar: substrate-walkable instead of service-walkable. The Phase 7
Tier 2 pipeline orchestrator owns the writer; chunk 4 ships only
the substrate (admin-INSERT + CHECK/trigger/RLS verifiable from
tests). Per-table immutability trigger pattern (one function + 2
triggers per table) reused across all three tables. Zero
implementation-time surprises.

**Chunk 5 — source_document_links polymorphic spine.** First
cross-phase chunk — verify-from-disk paid off at brief-loop by
catching **two real-state issues** before implementation: (a)
ADR-0016 §1 v1-active subset overshoots Phase 5 substrate
(`vendor_credit` + `vendor_credit_application` tables don't exist;
chunk 5 ships tighter 6-value subset); (b) Phase 5 PK column naming
inconsistency (`<entity>_id` for most tables but bare `id` for
prepayments) required `LINKED_ENTITY_TABLE_MAP` exported from
schema for chunks 6+ + Phase 4 Router reuse.
**Codebase-novel pattern**: column-level GRANT + BEFORE UPDATE OF
trigger composition (chunks 1-4 used RLS USING (false) for
full-row UPDATE/DELETE blocking; chunk 5 introduces column-level
GRANT for narrow service_role mutation while blocking other
columns). `(c-α)` ship-but-don't-wire known-state: function exists,
tested, but no production caller wired yet. Cascade-despite-REVOKE
OUTCOME B fired (Phase 1's BEFORE DELETE trigger on source_documents
blocks all DELETE attempts including service_role; cascade path
unreachable from chunk-5 code).

**Chunk 6 — exception queue + 3 enums + documentExceptionService.**
Second consecutive cross-phase chunk. Verify-from-disk at scope-lock
caught **two cross-ADR gaps**: (a)
`backfill_vendor_prepayment_suggested` referenced by ADR-0015 §6
but missing from ADR-0011 §13's enum (same trajectory as the
2026-05-08 `manual_born_paid_workflow` amendment that already
shipped); (b) ADR-0013 ratification status correction (recon
initially said "not yet ratified" when ADR-0013 ratified
2026-05-03). Implementation surfaced **four real deviations** at
first test run: DocumentCaseStateSchema Zod boundary needed
broadening beyond brief enumeration (Layer 1 CHECK → Zod schema
broadening rule codified); enqueue RPC needed INSERT-then-UPDATE
ordering (UPDATE-first masked unique_violation behind
check_violation on duplicate retries; rule codified); chunk-2 test
regex fragility second firing (the chunk-2 codified lesson fired
exactly as predicted; fixed inline); 5-column GRANT + trigger
composition scaled clean from chunk-5's 1-column shape.

**Phase 2.5 (Commits A + B + C).** Phase 2 close + ADR audit cycle.
Three deliverables sequenced A → B → C.

- **Commit A** (`9d788e2`) — ADR-0016 amendment. Three sub-findings
  closed: §6→§4 cross-reference correction at 8 locations (chunk-5
  notes estimated "at least 4"; verify-from-disk surfaced 8 actual
  wrongs); §5 `reverseLinkedEntityLink` signature reconciliation
  (4-field → 5-field; `reversal_reason` inserted as 3rd field per
  chunk-5 schema order); §1 v1-active subset 8→6 values with
  cascading edits to §3 Table A (8→6 rows, 216→162 cells), Table B
  (20→22 rows, 540→594 cells), Cell-count totals (15→13 active),
  §5 cascade matrix split into 6-row v1-active + 2-row reserved-
  post-v1 sub-tables, §Schema-deltas, §Closes Q55.
- **Commit B** (`e2cceb9`) — ADR-0011 amendment. Four sub-findings
  closed: §3 transition table broadens to admit
  `needs_review → classified` (separate-bullet placement per
  B.4-ii preserves chunk-2-vs-chunk-6 provenance); §13 enum
  extends to 18 values with `backfill_vendor_prepayment_suggested`
  at semantic position after `apply_vendor_prepayment`; §13 Closes
  Q68 math sweep (two-amendment-cycle drift — 2026-05-08 amendment
  added `manual_born_paid_workflow` to Decision-section but didn't
  propagate to §Closes Q68; Phase 2.5 Commit B simultaneously
  fixes the propagation gap AND adds the Commit-B reserved value;
  post-Commit-B math = 9 v1-active + 9 reserved = 18); §10
  `wrong_entity_exception` enum-name clarification at 2 references
  (chunk-6 substrate placed the value in `exception_reason` enum,
  not `resolution_action`).
- **Commit C** (this retrospective) — closes retrospective inventory
  item #6 with reference to A + B SHAs; flips MEMORY.md to Phase 2.5
  SHIPPED.

## 3. Patterns codified during the work

Eight patterns are load-bearing enough to carry forward. They earned
their place across multiple instances; each is listed with evidence
base + codification mechanism + future-application guidance.

### 3.1. Verify-from-disk at four lifecycle stages

The most load-bearing single discipline of Phase 2. The discipline
graduated from a brief-loop-only practice (chunks 1-4) to a
lifecycle-wide rule (chunks 5-6 + Phase 2.5 Session 1), now firing
at four distinct stages:

- **Scope-lock stage** (chunk 6, Phase 2.5 Session 1): caught
  ADR-0013 ratification-status correction during exception_reason
  adjudication; caught `backfill_vendor_prepayment_suggested`
  cross-ADR enum-membership gap; caught Framing A's "Phase 5 closed,
  source_document_versions already shipped" reality before
  framing-A scope locked.
- **Brief-draft stage** (chunks 3-5): caught `ingest_channel:
  'direct_upload'` typo, `created_by` field missing in test setup,
  `userClientFor` signature mismatch, AP-user seed-configured org
  access, `crossOrgRlsIsolation.test.ts` mechanism, ADR-0016 §1
  v1-active overshoot (vendor_credits substrate absence), Phase 5
  PK column inconsistency.
- **Implementation stage** (chunks 1, 2, 6): caught `audit_log`
  column list, ServiceContext shape, `created_by` type mismatch,
  Zod `.datetime()` vs Postgres timestamptz, chunk-1 test regex
  break from constraint rename, accountLedgerService category
  error, DocumentCaseStateSchema Zod broadening gap, enqueue RPC
  INSERT-then-UPDATE ordering bug, chunk-2 test regex fragility
  second firing.
- **Editorial amendment stage** (Phase 2.5 Session 1): surfaced
  three independent scope-expansion findings — 6.1 from "at least
  4" §6→§4 wrongs to 8 actual wrongs; 6.3 cascaded from §1 alone
  to 5 separate touchpoints; 6.6 surfaced as a 5-day-old
  amendment-cycle drift rather than a Phase-2.5-introduced gap.

The discipline is codified in
`/home/philc/.claude/projects/-home-philc-projects-chounting/memory/feedback_verify_from_disk_at_brief_loop.md`
with two specific checklist items: (A) cross-ADR-cited-substrate
verification at scope-lock + brief-draft for cross-phase chunks;
(B) Zod schema audit when broadening a Layer 1 CHECK that gates
an ENUM.

**Future application**: at every chunk-lifecycle stage where new
substrate, service code, ADR amendment text, or retrospective
content is about to commit, ask "what does this artifact cite that
I haven't read at the precision the citation requires?" The answer
should be empty before committing. The cost is 5-15 minutes per
stage; the payoff is large.

### 3.2. ADR amendment additive-provenance-preserving shape

Codified at Phase 2.5 across Commits A + B. The rule: **ADR
amendment shape is additive provenance-preserving; never restructure
to absorb amendments invisibly.**

The 2026-05-08 `manual_born_paid_workflow` §13 amendment set the
precedent at ADR-0011: added the value to §13's enum AND added an
explicit cross-reference note documenting when/why, rather than
restructuring §13's existing wording to make the value look like
it was always there. Phase 2.5 Commits A + B inherit + extend the
pattern across 7 sub-findings:

- A.1-i: 8 surgical per-line edits (§6→§4 correction) preserve
  per-line context rather than bulk-replace.
- A.2-i+cite: parenthetical citation parallel to existing
  `reversal_trace_id` field citation (no justification paragraph;
  §5 is contract-not-justification surface).
- A.3-i: §1 v1-active 8→6 edit-in-place with explicit explanation
  paragraph; preserves §1's two-bucket structure.
- A.4-ii: §5 cascade matrix split into 6-row v1-active + 2-row
  reserved-post-v1 sub-tables; preserves cascade contract intent
  for the reserved entity types.
- B.4-ii: §3 separate bullet for `needs_review → classified`
  preserves chunk-2-vs-chunk-6 provenance distinction.
- B.5-i: semantic-grouping placement of new enum entry mirrors
  2026-05-08 precedent.
- B.7-i / B.7-ii: enum-name clarification cites chunk + ADR
  section (no file path; refactor-resilient).

**Future application**: when amending an ADR, default to additive
edits that preserve the original ADR text's provenance — bullets,
section listings, enum entries, cross-references. Restructure only
when the original text is structurally incompatible with the
amendment (rare). The cost of restructuring is invisible to a
casual reader; the cost of additive-with-provenance is one extra
sub-bullet or cross-reference note. The latter cost is correct.

### 3.3. Scope-lock estimates underestimate without verify-from-disk pass

Phase 2.5 Session 1 produced three independent scope-expansion
findings in a single session:

- Sub-finding 6.1 estimated at "at least four" §6→§4 wrongs at
  chunk-5 implementation notes; verify-from-disk surfaced **8**
  actual wrongs.
- Sub-finding 6.3 estimated as "tighten §1 to 6 v1-active + 2
  reserved"; verify-from-disk surfaced **4 separate touchpoints**
  (§1 + §3 matrix + §Schema-deltas + §Closes Q55) plus §5 cascade
  matrix split.
- Sub-finding 6.6 estimated as "Phase 2.5-introduced stale math";
  verify-from-disk surfaced **5-day-old 2026-05-08-amendment-cycle
  drift** (8 v1-active in Closes Q68 was already stale before
  Phase 2.5 began).

The pattern: scope-lock estimates by reasoning about ADR structure;
verify-from-disk reveals actual surface area. Reasoning underestimates
systematically because it relies on a mental model of the ADR;
disk-grep reveals the actual surface area.

**Future application**: scope-lock estimates are useful for sizing
the work but should not commit to specific counts (file counts, edit
counts, line numbers, sub-finding counts). Commit to the work shape;
defer the actual surface area to brief-draft verify-from-disk.
Briefs that cite specific counts pre-verify will systematically
underestimate.

### 3.4. Substrate-now-amendment-later

Chunks 5 + 6 + Phase 2.5 codified this pattern. When a chunk's
substrate ships a value that an ADR's enum / table / column listing
doesn't yet carry (because cross-ADR drift surfaced during
chunk-implementation verify-from-disk):

- Ship the substrate with the value as **reserved per ADR-0010**
  (Layer 1 enum admits; Layer 2 Zod rejects; Layer 3 service no-emit).
- Document the cross-reference in implementation notes + friction
  journal.
- Schedule the ADR amendment for the next retrospective cycle
  (typically Phase-close or end-of-arc).
- When the ADR amendment ships, no substrate migration needed (the
  enum already carries the value).

Three instances:

- **chunk 5** shipped `LinkedEntityTypeSchema` with the 6 v1-active
  values that actually have Phase 5 substrate, deviating from
  ADR-0016 §1's 8-value listing. Reconciled at Phase 2.5 Commit A.
- **chunk 6** shipped `resolution_action` enum with the 18th value
  `backfill_vendor_prepayment_suggested` reserved per ADR-0015 §6
  cross-reference. Reconciled at Phase 2.5 Commit B.
- **2026-05-08** shipped the same pattern at a different cadence:
  `manual_born_paid_workflow` referenced by ADR-0015 §7 (Q74
  Scenario C) was added to ADR-0011 §13 via amendment rather than
  via a new substrate commit. The pattern fires both directions
  (substrate-first OR ADR-cross-reference-first).

**Future application**: when verify-from-disk surfaces a cross-ADR
drift between an ADR's enum/table listing and the substrate or
another ADR's cross-reference, the (β) reconciliation says
**substrate stays; ADR text adjusts at next retrospective cycle.**
This is the default. Path (a) of the audit-cycle framing. Path
(b) — adjusting the substrate to match outdated ADR text — is the
worse path almost always (substrate already shipped; ADR text is
the editorial surface).

### 3.5. Layer 1 CHECK → Zod schema broadening

Codified at chunk 6 close after caught-at-first-test-failure. The
rule: when broadening a Layer 1 CHECK constraint on an ENUM column,
also broaden the corresponding Zod schema's `z.enum(...)` literal
union to admit the same set.

The chunk-6 case: brief specified `document_cases.state` CHECK
broadening from 4 → 6 values (adding `needs_review` + `classified`)
but didn't enumerate the parallel `DocumentCaseStateSchema`
broadening. `readDocumentCase` calls `DocumentCaseSchema.safeParse(...)`
which uses `DocumentCaseStateSchema`; cases in the newly-admitted
states would fail Zod parse → `READ_FAILED` ServiceError. Caught at
first integration test against a case in `needs_review` state.

**Future application**: brief-draft sessions for state-machine
substrate chunks must enumerate BOTH the SQL migration changes AND
the Zod schema changes. The two layers track each other; missing
one breaks the read-back path. Codified as Checklist Item B in
`feedback_verify_from_disk_at_brief_loop.md`.

### 3.6. INSERT-then-UPDATE atomic RPC ordering

Codified at chunk 6 close after caught-at-first-test-failure (the
N=4 partial UNIQUE sequence test). The rule: when an atomic RPC
combines a UNIQUE-protected INSERT with a state-machine UPDATE,
**INSERT first, UPDATE second** preserves typed-error semantics.

The chunk-6 case: brief specified
`enqueue_exception_with_audit` as `(1) UPDATE document_case state
classified|matched → needs_review; (2) INSERT
exception_queue_entries row`. The N=4 partial-UNIQUE test (enqueue
→ fail-second-enqueue → resolve → re-enqueue succeeds) surfaced
the bug: on duplicate-enqueue against a case already in `needs_review`
(because the first enqueue transitioned it), the UPDATE matches zero
rows and raises `check_violation` BEFORE the partial-UNIQUE
constraint can fire on the INSERT. Service maps `check_violation`
→ `INVALID_TRANSITION`; the test expected `EXCEPTION_ALREADY_OPEN`
(from `unique_violation`).

Fix: reorder the RPC to INSERT first. Partial-UNIQUE fires on
duplicates (correct error class); UPDATE runs only for first-enqueues
against wrong-state cases (also correct error class).

**Future application**: atomic RPCs combining UNIQUE-protected INSERT
+ state-machine UPDATE should INSERT first. UPDATE-first ordering
masks UNIQUE violations behind state-violations during duplicate
retries. Migration top-comment should name the ordering rationale.

### 3.7. Chunk-2 test regex fragility — second firing confirms the codification

Chunk 2's friction-journal entry codified the rule: test assertions
that hardcode migration-internal names (constraint names, trigger
names, function names) are fragile to substrate changes. Stable
regex pattern `/<table>_state_chunk_\d+_active/` survives rename
cycles.

Chunks 3, 4, 5 didn't fire the rule (they didn't broaden
`document_cases`'s CHECK). Chunk 6 broadened `_chunk_2_active` to
`_chunk_6_active` and the chunk-2 test at
`documentCaseService.integration.test.ts:332` had hardcoded
`document_cases_state_chunk_2_active` — fired the trap exactly as
predicted. Fixed inline with the stable regex.

The pattern: codify a rule, wait for the next firing as validation.
Two firings (chunk 2 + chunk 6) confirm the rule earns its keep.

**Future application**: when broadening a CHECK constraint, audit
the integration test suite for hardcoded constraint-name literals
prospectively (not at first-test-failure). The chunk-2 codified
lesson should fire only at codification time; subsequent broadenings
should already use stable regex. **The chunk-6 implementation notes
carry-forward** schedules a prospective audit of all chunk-2-CHECK
references in the test suite as a chunk-7+ docs-hygiene task.

### 3.8. Pattern B + atomic RPC parent-derived org_id

Established across chunks 1-3 + 5 + 6 (chunk 4 had no service surface).
Two related rules:

**Pattern B unwrapped service architecture**: service methods are
plain unwrapped functions throwing typed `ServiceError`; route handlers
wrap each method at the call site via `withInvariants(action: '<verb>')`.
Phase 5 codified; Phase 2 inherited. Test ergonomics: route
integration tests can mock `buildServiceContext` and exercise the
real service through the real route handler.

**Atomic RPC with parent-derived org_id**: audit_log.org_id is
derived inside the RPC via subquery from the parent table at INSERT
time, not from `p_audit`. Single source of truth at INSERT time;
eliminates service-side double-read TOCTOU window. Chunks 1-2 used
the older pattern (service passes org_id) because no parent table
existed yet; chunk 3 introduced the parent-derived pattern when
`document_cases` was available as parent; chunks 4 + 5 + 6 inherited
unchanged.

**Future application**: both rules are defaults for new Phase 2 /
Phase 3 / Phase 4 / Phase 7 services. Pattern A (service-wrapped) is
rejected at the brief-draft loop unless the chunk has a specific
reason to override.

## 4. Architectural decisions and their rationale

**Direct org_id RLS (chunks 1-2, 6) vs through-parent RLS (chunks
3-5).** The split is intentional. Spine entities (document_cases,
exception_queue_entries) — entities with their own lifecycle,
independent operational status, and direct user-visible workflows —
carry `org_id` directly. Join entities (document_case_sources,
document_artifacts, source_document_links) — entities derived from
or relating spine entities — derive `org_id` through-parent via
EXISTS-subquery. Direct org_id is cheaper at query time (one column
lookup vs subquery); through-parent is more structurally honest for
join shapes. Both 4-policy patterns share the same SELECT / INSERT /
UPDATE / DELETE policy structure via `user_has_org_access(org_id)`
helper from Phase 1.

**Column-level GRANT + BEFORE UPDATE OF trigger composition**
(chunk 5 1-column; chunk 6 5-column). Chunks 1-4 used RLS USING
(false) for full-row UPDATE/DELETE blocking. Chunk 5 introduced the
codebase-novel pattern for narrow service_role mutation: `REVOKE
UPDATE FROM service_role` + `GRANT UPDATE (<column-list>) TO
service_role` + a `BEFORE UPDATE OF <column>` trigger that
constrains valid transitions on the mutable column. The two
mechanisms compose: GRANT enforces "which columns are mutable";
trigger enforces "valid transitions on the mutable column." No
overlap; clean separation of concerns. Chunk 6 scaled to 5 mutable
columns (exception_status, resolution_action, resolution_notes,
resolved_at, resolved_by) without issue; the pattern is exercised
at two scales now.

**Partial UNIQUE for state-machine uniqueness** (chunk 6).
Postgres partial unique index `(document_case_id) WHERE
exception_status = 'open'` enforces one-open-per-case-at-a-time;
resolved historical rows preserved. Index entry drops automatically
when status flips to resolved, allowing legitimate re-enqueue. The
choice of partial-UNIQUE over full-UNIQUE-on-status-tuple or
service-layer-uniqueness-check was driven by atomicity + concurrency
correctness — partial-UNIQUE is enforced by the database at INSERT
time; service-layer checks have a TOCTOU window.

**9-action terminal-state mapping** (chunk 6 `resolveException`).
Single largest design surface in Phase 2 substrate. Five of nine
v1-active `resolution_action` values terminal at `proposed`; three
terminal at `rejected`; one (`reprocess`) terminal at `classified`
(requires LEGAL_TRANSITIONS broadening). The `matched` vs `proposed`
distinction is load-bearing: `matched` is for Router-identified
candidates awaiting Router-driven proposal materialization;
`proposed` is for any articulated proposal (Router-automation OR
human-from-queue). Controller resolution-action choice IS an
articulated proposal, so 5 actions terminal at `proposed` rather
than `matched` (avoiding a stuck-state where no automation exists
to flip `matched → proposed` for human-resolved cases).

**`exception_reason` as a separate enum from `resolution_action`**
(chunk 6). Closed retrospective inventory item #2 (the §10 vs §13
`wrong_entity_exception` cross-enum inconsistency). The two enums
carry orthogonal information: `exception_reason` is **why** the
case is queued; `resolution_action` is **what** the controller
chose. Conflating them into a single enum would couple the routing
trigger to the resolution mechanism and break the cross-ADR
separation between routing-rule ADRs (ADR-0014 pipeline, ADR-0018
Router) and resolution-vocabulary ADR (ADR-0011 §13).

## 5. Process calibration data

**Chunk shape held cleanly.** All six chunks bundled into single
substantive commits: substrate + service + schemas + tests +
friction-journal paragraph. Substantive commits averaged 1500-2500
lines each (smaller than Phase 5's 900-1400 range because Phase 2
has less UI). The bundled-commit pattern is the right default —
zero out-of-band hotfixes, zero forgotten-cleanup commits.

**Validation gate sequence held.** `pnpm typecheck` (cheapest,
~30s); `pnpm agent:validate` (26 floor tests, ~3-5s); `pnpm test`
(full vitest, ~2 minutes). Cheap signals first surfaced failures
fast. Chunks 1-5 typecheck always green at first attempt; chunk 6
had one typecheck-passing-but-test-failing surface (the INSERT-
then-UPDATE bug) that caught at integration-test-stage. No
chunk-close needed a manual db:reset:clean except chunk 6 (because
the RPC ordering fix required replaying the migration).

**Brief-draft + implementation separation pattern.** Chunks 1-6
each ran scope-lock → brief-draft → implementation across three
sessions per chunk. Phase 2.5 collapsed brief-draft + implementation
into single sessions because editorial work doesn't have the same
validation-gate cadence (no migration, no tests). The split shape
earns its keep when the work has a substantial validation gate;
collapses cleanly when the work is editorial-only.

**Verify-from-disk's cost-vs-payoff.** 5-15 minutes per lifecycle
stage; payoff is preventing implementation-time diagnostic detours
that take longer than the saved minutes. Chunks 3, 4, and 6 brief-
loops verified specific shapes; chunk 6's Phase 2.5 Session 1 ran
the verify pass at editorial-amendment grain and surfaced three
scope-expansion findings. The discipline earned its keep at every
stage where it fired.

**Two-paired-commits for ADR audit cycle.** Phase 2.5 Commits A + B
shipped as two paired commits, one per ADR (ADR-0016 first, ADR-0011
second). The split decision (vs bundled single commit) was
deliberate: each ADR amendment has independent diff/review scope;
verify-from-disk against originals easier per-ADR; smaller blast
radius. Worked cleanly — each commit reviewed in isolation, neither
blocked the other.

**One narrative-document commit for phase close.** Phase 2.5
Commit C ships only this retrospective + retrospective inventory
closure + MEMORY.md flip. No migration, no service, no tests, no
ADR amendments. Bundled in one commit because the artifacts are
tightly coupled (the retrospective references Commits A + B SHAs;
inventory closure references Commits A + B + C SHAs; MEMORY.md
pointer captures the SHIPPED status).

## 6. What Phase 3 / Phase 4 / Phase 7 needs that Phase 2 didn't provide

The next-phase decision is open per the Phase 2.5 scope-lock memory.
Three candidate next-phase framings:

- **Phase 3 — Document Relationship Graph consolidation.** ADR-0011
  §1 "What this costs" originally listed Phase 3 as "ships the link
  table." But chunk 5 already shipped `source_document_links`. Phase
  3 may be substantively complete or near-complete; verify against
  ADR-0011 + ADR-0016 at next-phase scope-lock.
- **Phase 4 — Relationship Router.** Consumes
  `document_relationship_candidates` per ADR-0018. Substrate
  addition (the candidates table) + service layer (Router subsystems
  1, 2, 3). The chunks-5-6 polymorphic spine + exception queue are
  ready for Router consumption.
- **Phase 7 — Tier 2 Document Pipeline.** Substrate
  (`ingest_batches`, `ingest_items`, `document_jobs`) + pipeline
  orchestrator per ADR-0014 + consumers of chunk-4 substrate
  (`ocr_runs` writer, `extraction_runs` writer). Per "land schema
  with consumer code" discipline, these substrates land alongside
  Phase 7 consumer code.

Phase 5 amendment work (INV-DOC-001 enforcement wiring; vendor_credits
substrate) is the other parallel candidate; could ship as Phase 5.1
amendments before or alongside Phase 3/4/7.

Three things from Phase 2 that affect next-phase onset:

- **The verify-from-disk discipline is operationally proven at four
  lifecycle stages.** Next-phase scope-lock should bring the
  refinement (chunks 5 + 6 + Phase 2.5 evidence) without prompting.
  Codified as checklist items A + B in the feedback memory.
- **Chunks-5-6 patterns are inherited substrate**: polymorphic
  spine, exception queue routing, partial-UNIQUE state-machine,
  column-level GRANT composition, ADR-0010 three-layer defense
  on three enums simultaneously. Phase 4 (Router) builds on these
  + adds `document_relationship_candidates` with §9 Rule 3
  versioning per `supersedes_candidate_id`. Phase 7 (Pipeline)
  builds on these + adds the work-queue substrate per ADR-0014.
- **Phase 5 PK column convention asymmetry** (chunk 5 finding):
  `<entity>_id` for most Phase 5 tables; bare `id` for prepayment
  tables. `LINKED_ENTITY_TABLE_MAP` at
  `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts`
  is the single source of truth for the polymorphic table → PK
  column registry. Phase 4 Router should import this map rather
  than re-derive.

Three carry-forwards for specific phase consumers:

- **Phase 4 Router**: T1-T4 firing-shape consumes `exception_status =
  'cancelled'` (currently reserved per ADR-0010 in chunk-6
  substrate; activates when Phase 4 Router code emits it). T1-T10
  broader trigger set consumes `enqueueException(...)` for
  unmatched / multi-candidate exceptions.
- **Phase 7 Pipeline**: emission to
  `documentExceptionService.enqueueException` for
  `low_confidence_classification` + `unknown_document_type` +
  pipeline-failure variants. Per ADR-0014 §6+ Q65 confidence
  thresholds.
- **Phase 5 reversal-path wiring** (chunk-5 `(c-α)` known-state):
  `billService.reverse` / `paymentService.commitFailureReversal` /
  `paymentService.reverse` should call
  `documentLinkService.reverseLinkedEntityLink(...)` as part of
  their within-transaction work to keep `source_document_links`
  status in sync with domain-entity reversals.

## 7. What I would do differently

1. **Bring verify-from-disk discipline to chunk 1 in its current
   form.** Chunks 1-4 verified at brief-loop only; the cross-phase
   refinement landed at chunk 5; the lifecycle-wide refinement
   landed at Phase 2.5 Session 1. The lifecycle-wide form should
   be the default from chunk 1 onward — verify substrate-reality
   claims at every lifecycle stage, not just brief-loop. Cost is
   minimal (5-15 min per stage); payoff compounds.

2. **Codify the Layer 1 CHECK → Zod schema broadening rule
   prospectively.** Chunk 6 caught the rule at first integration
   test failure. Codifying earlier would have caught it at
   brief-loop instead — the chunk-6 brief would have enumerated
   the parallel Zod schema change alongside the migration change.
   The rule belongs in any brief that touches a state-machine
   CHECK constraint.

3. **Codify the INSERT-then-UPDATE atomic RPC ordering rule
   prospectively.** Same shape as above — chunk 6 caught at first
   N=4 test failure. Codifying earlier would have caught it at
   brief-loop. The rule belongs in any brief that combines a
   UNIQUE-protected INSERT with a state-machine UPDATE in one RPC.

4. **Audit chunk-2 CHECK references in the test suite
   prospectively, not at next-firing.** The chunk-6
   implementation notes carry a prospective-audit task for
   chunks 7+: grep the integration test suite for hardcoded
   constraint-name literals; replace with stable regex patterns.
   Doing this proactively prevents the chunk-2 lesson from firing
   a third time when a future chunk broadens the CHECK again.

5. **The Phase 2.5 amendment shape works for these 7 sub-findings;
   future audit cycles may need different shapes.** "Additive
   provenance-preserving" works for editorial drift surfacing
   between ADR text and substrate. When an ADR amendment requires
   restructuring (e.g., deprecating a section because the
   architecture changed), the additive pattern doesn't apply.
   Future audit cycles should articulate the amendment shape at
   scope-lock rather than inheriting it as default.

## 8. What I would keep exactly the same

**The four disciplines kept from Phase 5.** Verify-from-disk before
citing; friction-journal as future-you note; chunk-bundling commits;
UX-flow screenshot gate (when chunks have visible UI surface; not
relevant for Phase 2's substrate-only work). These earned their keep
across Phase 2 + Phase 2.5 cleanly.

**Pattern B service architecture (unwrapped).** Inherited from Phase
5 + chunks 1-6's evidence. Held across all four Phase 2 services
(documentCaseService, documentCaseSourceService, documentLinkService,
documentExceptionService). The test ergonomics it produces (route
integration tests mocking `buildServiceContext` + exercising real
service through real route handler) is a substantial win over
Pattern A.

**Atomic RPC with parent-derived org_id.** Codified at chunk 3.
Used at chunks 3, 4 (audit-only via run-table writers in Phase 7),
5, 6. The single-source-of-truth + TOCTOU-elimination semantics
hold; future chunks should default to this pattern over
service-passes-org_id.

**ADR-0010 three-layer reserved-enum defense.** Layer 1 DB CHECK +
Layer 2 Zod boundary + Layer 3 service no-emit. Applied to every
enum chunk 1-6 ships (`document_case_state`, `document_type`,
`document_case_source_role`, `document_artifact_engine`,
`linked_entity_type`, `link_role`, `link_status`, `resolution_action`,
`exception_status`, `exception_reason` — 10 enums). Each layer catches
a different failure mode; the composition is well-exercised.

**Stable regex for constraint / trigger names in test assertions.**
`/_chunk_\d+_active/` pattern survives `_chunk_N_active` →
`_chunk_(N+1)_active` rename cycles. Codified at chunk 2; validated
at chunk 6. Future tests touching named constraints should default
to this pattern.

**The bundled-commit pattern.** All Phase 2 chunks shipped as single
substantive commits. Held cleanly; produced clean rollback shapes;
matched Phase 5's discipline. No reason to revisit.

**The two-paired-commits-per-ADR shape for editorial amendments.**
Phase 2.5 Commits A + B shipped one per ADR; verify-from-disk
against originals was easier per-ADR; blast radius smaller. Future
audit cycles touching multiple ADRs should default to this shape.

## 9. Honest limitations of this retrospective

I drafted this retrospective immediately after Phase 2.5 Commit B
shipped, in the same session. The self-audit bias is real: I am
the one judging whether the eight patterns earned their place, and
I am also the one who experienced their value. A reader with a
different perspective would probably notice:

(a) The "verify-from-disk at four lifecycle stages" framing is
generous in one direction. Chunks 1-4 ran the discipline only at
brief-loop; chunks 5-6 + Phase 2.5 Session 1 extended it. The
framing presents this as a discipline-graduation; an alternative
read is that chunks 1-4 missed the discipline at three lifecycle
stages and got away with it because Phase 2 substrate was
relatively self-contained until chunk 5. Phase 4 / Phase 7 may
surface failure modes that chunks 1-4's brief-loop-only verify
wouldn't catch.

(b) The eight patterns codified are the ones I noticed and
remembered. There may be patterns I unconsciously downgraded
because they don't fit the narrative I'm constructing. Likely
candidates: anything about the chunk-6 (β) reconciliation
trade-offs that didn't surface cleanly; anything about whether
the `(c-α)` ship-but-don't-wire pattern's friction will surface
when Phase 5 reversal-path wiring catches up.

(c) Phase 2 ran across 2 calendar days. The chunk cadence,
bug density, and shipping velocity may not be representative of
how Phase 4 or Phase 7 will run — those phases will exercise
service paths that don't exist yet (Router, Pipeline) where
chunk-by-chunk decomposition may be harder. The patterns may
hold; the cadence may not.

(d) The Phase 2.5 amendment cycle is itself a small sample (3
commits, 7 sub-findings across 2 ADRs). The "ADR amendment
additive-provenance-preserving" rule is codified from one round
of evidence. If a future audit cycle requires a different shape
(restructuring rather than additive), the rule may need
qualification.

(e) The retrospective itself is an artifact the apparatus would
have produced. The structure (numbered sections, "what I'd do
differently," "what I'd keep") inherits from Phase 5's
retrospective. The content tries to be plain English rather than
catch-ledger jargon, but the form is the form. If this
retrospective itself is apparatus, the antidote is that future
retrospectives keep getting shorter and more specific until the
only thing being captured is what genuinely needs to be captured.

(f) Items 1, 3, 5 of retrospective inventory remain open and
deferred. Item 4 (stale "Phase 1" wording in the canonical Phase
2 brief) is deferred to a separate docs-hygiene pass — 26
references in the brief require per-reference disambiguation
(many legitimately reference Phase 1 Storage; some need updating
to Phase 2). Bundling with Commit C would have created a large
mixed-purpose commit; the docs-hygiene pass is a cleaner shape.
The deferral risks the items aging further; the alternative
(forcing closure in this commit) would have bloated the
retrospective scope.

---

## Retrospective inventory status at Phase 2.5 close

Pre-Phase 2: 6 items.
Closed during the Phase 2 arc:

- **Item #2** (ADR-0011 §10 vs §13 wrong_entity_exception cross-enum
  inconsistency) — closed at chunk-6 ship (`4de4d38`) when chunk 6
  invented `exception_reason` enum as separate from `resolution_action`.
  The §10 enum-name editorial drift was reframed as a sub-finding
  of item #6 and closed at Phase 2.5 Commit B.
- **Item #6** (ADR-0011 + ADR-0016 cross-ADR editorial audit, 7
  sub-findings consolidated) — closed at Phase 2.5 Commit A
  (`9d788e2`) for sub-findings 6.1-6.3 (ADR-0016) + Phase 2.5
  Commit B (`e2cceb9`) for sub-findings 6.4-6.7 (ADR-0011) + this
  retrospective (Commit C) for the consolidated closure record.

Open / carry-forward at Phase 2.5 close (4 items):

- **Item #1** (ADR-0011 §3 vs ADR-0010 layer-numbering drift) —
  surfaced at chunk 2 brief loop; carried since. Closes at next
  ADR-0011 amendment cycle or ADR-0010 amendment cycle (the rule
  is "framework wins" — ADR-0011 amends to follow ADR-0010's
  layer numbering). Not in Phase 2.5's scope.
- **Item #3** (ADR-0011 §3 detach-lifecycle gap) — surfaced at
  chunk 3 brief loop. Chunk 6 shipped `resolveException` as the
  detach-equivalent operation but ADR-0011 §3 doesn't describe
  detach lifecycle. Closes at next ADR-0011 amendment cycle. Not
  in Phase 2.5's scope.
- **Item #4** (Stale "Phase 1" wording in canonical Phase 2 brief
  at `docs/09_briefs/phase-2/document_platform_initiative.md`) —
  surfaced at chunk 1 brief loop. 26 references in the brief,
  requiring per-reference disambiguation. Deferred to a separate
  docs-hygiene pass; mixed-purpose bundling with Commit C
  rejected.
- **Item #5** (AccountLedgerService disposable-accounts test
  refactor) — surfaced at chunk 2. Phase 5 ledger ownership;
  carries forward to a Phase 5 test refactor or future ledger work.

## References

**Chunk implementation notes** (in user memory at
`/home/philc/.claude/projects/-home-philc-projects-chounting/memory/`):

- `project_phase_2_chunk_1_implementation_notes.md`
- `project_phase_2_chunk_2_implementation_notes.md`
- `project_phase_2_chunk_3_implementation_notes.md`
- `project_phase_2_chunk_4_implementation_notes.md`
- `project_phase_2_chunk_5_implementation_notes.md`
- `project_phase_2_chunk_6_implementation_notes.md`
- `project_phase_2_5_scope_locked.md` — Phase 2.5 scope-lock record
- `project_phase_2_retrospective_candidates.md` — inventory + item
  closure status
- `feedback_verify_from_disk_at_brief_loop.md` — discipline at
  four lifecycle stages + checklist items A + B

**Chunk ship commits** (on `staging`):

- chunk 1: `dd3f774`
- chunk 2: `10e6a8a`
- chunk 3: `398230b`
- chunk 4: `41a9a80`
- chunk 5: `0786cc2`
- chunk 6: `4de4d38`
- Phase 2.5 Commit A (ADR-0016 amendment): `9d788e2`
- Phase 2.5 Commit B (ADR-0011 amendment): `e2cceb9`
- Phase 2.5 Commit C (this retrospective): _committed in the same
  bundled commit_

**ADRs touched at Phase 2.5**:

- ADR-0011 — Document Platform (`docs/07_governance/adr/0011-document-platform.md`)
  — second amendment at Phase 2.5 Commit B; the 2026-05-08
  `manual_born_paid_workflow` registration is the first amendment.
- ADR-0016 — Document Relationship Graph
  (`docs/07_governance/adr/0016-document-relationship-graph.md`) —
  first amendment at Phase 2.5 Commit A.

**Related governance docs**:

- `docs/07_governance/friction-journal.md` — chunk-by-chunk
  friction-journal entries for the six Phase 2 chunks.
- `docs/07_governance/retrospectives/phase-5-retrospective.md` —
  the template this retrospective mirrors.
