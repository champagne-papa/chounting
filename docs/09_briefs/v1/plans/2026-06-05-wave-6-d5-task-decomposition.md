# Wave 6 D5 — Task Decomposition

**Status:** DRAFT — surfaced for advisor read-back. Implementation
starts task-by-task after green, each task getting a per-task code
read-back (code + runs surfaced together).
**Anchors:** the LOCKED brief
(`2026-06-05-wave-6-d5-evidence-persistence-brief.md`, committed
`eeb9a9ed`) — design decisions D-1…D-8 + the two read-back conditions
(B-axis guard; A-axis residual + enumeration) are settled there and
NOT relitigated here.
**Grounding HEAD:** `eeb9a9ed` (40 banked-local).

Dependency spine: T1 → T2 → T3 → T4 → T5. Tasks commit individually
under the lock (`COORD_SESSION='wave-6-ap-review'`); TDD within each
task; no push. T3/T4 are **governance commits** — the advisor's
line-by-line applies at the registration/amendment grain; neither is
subagent-decidable.

---

## T1 — Migration: UNIQUE + index drop + CHECK broaden (+ types regen)

**Files:**
- Create `supabase/migrations/20240177000000_wave_6_d5_evidence_objects_persistence_substrate.sql`
  (slot verified free at decomposition time; re-verify at T1 — the
  collision lesson).
- `apps/web/src/db/types.ts` regen.

**Scope (one migration, three acts):**
1. `ALTER TABLE evidence_objects ADD CONSTRAINT
   evidence_objects_subject_unique UNIQUE (org_id, subject_type,
   subject_id);` — brief D-4.1.
2. `DROP INDEX idx_evidence_objects_org_subject;` — redundant with the
   unique index (read-back note; zero-row table).
3. CHECK broaden, drop-and-replace:
   `evidence_objects_status_v1_active` → successor admitting
   `('reserved','partial','complete')` (behaviorally additive strict
   superset; enum already carries all three — no enum change).

**Impl-onset verifies:** slot 20240177 free; constraint/index names at
HEAD byte-match the brief's cites; `bills.org_id` + `payments.org_id`
exist (the D-3 guard dependency — brief must-confirm #2 fold);
`bills.posted_journal_entry_id` + the payments recovery-column name.

**Tests (integration, direct-DB):** insert with `status='partial'` and
`'complete'` admitted; duplicate `(org_id, subject_type, subject_id)`
→ 23505 naming `evidence_objects_subject_unique`; `'reserved'` still
admitted (additive proof).

**Commit:** `feat(db): Wave 6 D5 T1 — evidence_objects UNIQUE(org,subject) + status CHECK broaden (producer substrate)`

## T2 — `persist` (guard → assemble → upsert) + route wiring + integration suite

**Files:**
- Modify `apps/web/src/services/evidence/evidenceObjectService.ts` —
  add `persist`; `assemble` byte-unchanged.
- Modify `apps/web/src/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route.ts`
  — persist call between post-success and the committed marking, both
  branches + recovery; **`INV-EVIDENCE-001` code annotation lands here**
  (the registration's named annotation site — T3 cites it; flagged as
  ask (b)).
- Create `apps/web/tests/integration/evidenceObjectPersistence.integration.test.ts`
  — new file (D3/D4 suites stay byte-unchanged, the D4 ask-(b)
  discipline).

**Scope:**
1. `persist({subject_type, subject_id, org_id}, ctx)`: **step 1 the
   D-3 subject-ownership guard** (`LINKED_ENTITY_TABLE_MAP[subject_type]`
   table, `.eq(pkColumn, subject_id).eq('org_id', org_id)`,
   `maybeSingle`; miss → typed `SUBJECT_NOT_FOUND`, foreign ≡ missing);
   step 2 `assemble` → completeness mapping (`'complete'`→`complete`,
   else `partial`); step 3 upsert on the unique triple (refresh
   `status` + `trace_id` = `ctx.trace_id`; `created_by` =
   `ctx.caller.user_id`). `withInvariants`-wrapped; `recordMutation`
   `evidence_object.persisted` (insert ⇒ `before_state` null; resume
   re-persist ⇒ prior row as before_state). New ServiceErrorCode
   `SUBJECT_NOT_FOUND` if absent at HEAD (verify; reuse if an
   equivalent exists).
2. Route wiring: after `journalEntryId` resolves (posted OR recovered),
   resolve the subject pair — `post_bill`: (`'bill'`, `bill_id` from
   the post result; recovery branch looks up
   `bills.posted_journal_entry_id`); `record_bill_payment`:
   (`'payment'`, `payment_id` / payments recovery lookup) — then
   `persist(...)` **before** `advanceCaseAutomation('committed')`.
   Persist failure propagates (case holds at `approved` — D-2).
3. Must-confirm #7 resolution recorded in code comment + suite: if the
   payment branch is structurally unreachable at review (the D3
   postability vendor-gate reading), the payment persist ships wired
   with the grounding note, no fabricated test (the D3
   bundle-unreachability precedent).

**Tests (TDD):** producer happy path (one row, subject/org/trace/status
asserted; case `committed`); **the teeth test** — persist forced to
fail (mock/constraint) → 500-class response, case holds `approved`, no
row or recoverable row → re-approve → dup-catch JE recovery + idempotent
upsert → exactly one row, `committed`; **persist-grain cross-org
negatives** — direct service call, foreign-org subject →
`SUBJECT_NOT_FOUND` + zero rows; missing subject → identical;
uniqueness via double-persist (one row, refreshed trace); assemble
no-leak regression green; **D3 + D4 suites green byte-unchanged**.

**Commit:** `feat(evidence): Wave 6 D5 T2 — evidence-object producer at approve→post (subject-ownership-guarded, persist-before-marking)`

## T3 — INV-EVIDENCE-001 registration (governance commit #1)

**Files:** `docs/02_specs/invariants.md` (row 27, end of the Layer-2
block) + `docs/06_audit/control_matrix.md` (runtime/structural entry)
+ `docs/02_specs/ledger_truth_model.md` (the leaf).

**Scope (the A-axis condition discharged):**
1. Row 27 per the D-6 drafted statement; **heading "the 25 invariants"
   untouched** (D8's).
2. Control-matrix entry naming the residual explicitly
   (INV-WORKFLOW-002 shape: only uniqueness has DB teeth; sequencing
   is review + test-verified) and citing the §5.2 crash-resume test as
   test-verified support.
3. Leaf carrying: the residual; the empty→partial row-grain collapse;
   the successful-commit trace anchor + resume-refresh nuance
   (original attempt recoverable from `audit_log`); the
   no-backfill note (pre-D5 commits carry no row); the INV-DOC-001
   first-realization cross-reference (existing prose untouched).
4. **The sole-commit-path enumeration, fresh at this HEAD:** every
   `advanceCaseAutomation` caller reaching `target_state:'committed'`
   + any direct `document_cases.state` write, each shown downstream of
   a persist or shown unreferenced (the preserved composite) —
   recorded in the commit body.
5. INV-WORKFLOW-002's three artifact texts transcribed-from-disk as
   templates (brief must-confirm #5), not drafted from memory.

**Commit:** `docs(governance): Wave 6 D5 T3 — register INV-EVIDENCE-001 (row 27 + control matrix + leaf; residual named; commit-path enumeration in body)`

## T4 — ADR-0033 amendment (governance commit #2)

**Files:** `docs/07_governance/adr/0033-canonical-evidence-object-model.md`.

**Scope:** additive amendment block appended to D-0033.7 (provenance
header citing this wave + the brief; original text untouched)
recording: persistence landed (route-seam producer, OQ-2 honored);
subject↔trace final shape (unique triple + successful-commit trace
anchor); enforcement realization (structural persist-before-marking;
completeness descriptive — OQ-6 disposition); the glossary sentence
explicitly NOT touched (D8). Frontmatter `invariants: []` →
`["INV-EVIDENCE-001"]` — **rides this commit, not T3** (one file, one
commit; flagged as ask (a) since D-6's atomic list grouped it with
registration).

**Commit:** `docs(governance): Wave 6 D5 T4 — ADR-0033 D-0033.7 amendment (persistence shipped) + frontmatter invariant`

## T5 — Close: gates + inverted scope-fence + close report

**Files:** create `docs/09_briefs/v1/plans/<date>-wave-6-d5-close-report.md`.

**Scope:** `pnpm agent:validate` + `pnpm typecheck` + T1/T2 suites +
D3/D4 suites; lint scoped claim (evidence service + route — name any
new finding by class; the route's agent-entry inline-disable and the
Q33 siblings are standing baseline). **The inverted fence:** diff
`eeb9a9ed..HEAD` over `docs/02_specs` + `docs/07_governance` +
`docs/06_audit` contains **exactly** T3's three artifacts + T4's ADR
file and nothing else; heading count / glossary / INV-DOC-001 leaf
verified untouched. Brief-vs-shipped D-1…D-8 reconciliation;
carry-forward docket (at minimum: completeness-enforcement upgrade
post-V1; preserved-composite producer adoption; payment-branch
disposition per must-confirm #7; D8 heading-math handoff note 25→27).

**Commit:** `docs(v1): Wave 6 D5 T5 CLOSE — gates green, governance diff exact, brief-vs-shipped reconciled`

---

## Read-back asks (decomposition-level decisions)

- **(a) Frontmatter rides T4, not T3** — one-file-one-commit (both
  edits touch ADR-0033); deviates from D-6's "atomic" artifact list,
  which grouped frontmatter with registration. The registration's
  three doc artifacts + annotation stay atomic in T3; the ADR file
  changes are atomic in T4; both land before close.
- **(b) The code annotation lands at T2** (it is a code-file comment
  at the route seam, written with the persist call); T3 cites the
  site. Alternative: T3 edits the route file — rejected as a
  code-touch inside a governance commit.
- **(c) CHECK successor name:** `evidence_objects_status_wave_6_active`
  — the chunk-suffix family is document_cases-specific (chunk_7→8→9 on
  disk); the `v1_active` originals have no successor precedent, so
  this is a first-instance name keyed to the broadening wave. Say the
  word if the chunk family should generalize instead
  (`…_status_chunk_2_active`).
- **(d) `SUBJECT_NOT_FOUND`** as a new typed ServiceErrorCode (verify
  no equivalent exists at HEAD first; the D4 lesson —
  INTEGRITY_VIOLATION-style codes have been assumed-and-absent
  before).
- **(e) The teeth test's persist-failure injection** — vi.mock at the
  service boundary (preferred; no prod code hooks) vs a
  constraint-violation seed. Pinned at T2 TDD time; named here so the
  choice is visible.