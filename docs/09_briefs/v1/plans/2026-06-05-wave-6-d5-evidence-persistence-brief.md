# Wave 6 D5 Brief — Evidence-Object Persistence + Subject↔Trace Tightening

**Status:** DRAFT — surfaced for advisor read-back.
**Charter (plan-of-record §3, verbatim):** "Evidence-object persistence +
subject↔trace tightening (`evidenceObjectService`)." Registers:
**`INV-EVIDENCE-001`**. Amends: **ADR-0033 D-0033.7**. IDOR surface:
**yes**.
**Grounding HEAD:** `4862fe5e` (39 banked-local; D1 + D2.1 + D2.3 + D3 +
D4 closed).
**Governance footprint (the framing that separates D5 from D3/D4):** D5
**deliberately crosses** the spec/governance fences D3/D4 stayed inside.
Its close check is not "empty diff over `docs/02_specs` /
`docs/07_governance` / `docs/06_audit`" but "**the right additive
governance changes, four-gate-verified**": the INV-EVIDENCE-001
registration (three artifacts + code annotation) and the ADR-0033
amendment. Governance changes are never subagent-decidable; each gets
line-by-line read-back at the registration/amendment grain.

---

## 1. Grounded surface (what exists at HEAD)

### 1.1 The ADR-0033 contract D5 discharges

- **D-0033.1/.3:** `evidence_objects` shipped at Wave 2 **inert** — "no
  `evidence_objects` rows are written … persistence + the row-producer
  deferred to Wave 6." Wave 2 = `core/evidence` pure helpers +
  `services/evidence` assemble-on-read (transient object).
- **D-0033.7 (the amendment target, current text):** "Enforcement
  (`INV-EVIDENCE-001` with teeth; persistence; the row-producer; the
  object *required* for commit) lands at Wave 6, where the general
  shape is final."
- **D-0033.4/.8:** `INV-EVIDENCE-001` named ("every committed AP
  posting carries a complete evidence bundle on one canonical evidence
  object"), reserved-**unregistered** per ADR-0021
  register-on-enforcement; registered at Wave 6. `INV-EVIDENCE-002`
  stays reserved-unallocated.
- **Design-spec OQ-2 (binding constraint):** the row-producer is "a
  separate evidence-assembly path — **never** `billService.post`, which
  stays untouched."
- **OQ-3** (INV-EVIDENCE-001 registration wording) and **OQ-6**
  (completeness semantics: descriptive at Wave 2 vs enforced at Wave 6)
  were left for this wave — D-6 and D-5 below discharge/dispose them.

### 1.2 What Wave 2 shipped (verified on disk)

- **Migration `20240172000000_evidence_objects_substrate.sql`:** spine
  `id, org_id (FK organizations, RESTRICT), subject_type, subject_id,
  trace_id, status, domain_extension jsonb, created_at, created_by`;
  enum `evidence_object_status = 'reserved' | 'partial' | 'complete'`
  with **CHECK `evidence_objects_status_v1_active (status =
  'reserved')`** — comment: "broadens at the Wave-6 producer wave
  (document_cases / workflow_instances precedent)". Indexes on
  `(org_id, subject_type, subject_id)` and `(trace_id)`. **No unique
  constraint** (deferred). RLS: SELECT via `user_has_org_access`;
  **no user-path write policy — "the Wave-6 producer writes via
  service_role"** (the write-posture is pinned in the migration).
- **`evidenceObjectService.assemble`** (`services/evidence/`, 196
  lines): read-only, inline org-authz (`ORG_ACCESS_DENIED`, `:47-49`),
  adminClient; document/extraction facets subject-scoped via
  org-verified `source_documents` (the cross-tenant guard, `:67-71`,
  hardened at `a2a0b2dc`); decision/approval facets referenced by the
  **link-derived trace_ids** + org filters. Header `:15-17`: "The
  Wave-6 producer refines subject↔trace scoping when persistence
  lands" — **the tightening anchor**. No production callers (test-only).
- **`core/evidence/completeness.ts`:** `assessCompleteness` —
  descriptive (`'empty' | 'partial' | 'complete'` on the transient
  object), "it does not reject anything. Enforcement … lands at Wave 6."
- **Zod:** `CanonicalEvidenceObjectSchema` — transient-object shape;
  `completeness.status ∈ {'complete','partial','empty'}`. Note the
  **gap**: the transient `'empty'` has no row-enum counterpart (the DB
  enum is `reserved|partial|complete`) — D-5 maps it.
- Tests: `evidenceCompleteness.test.ts` (4 unit),
  `evidenceObjectAssembly.integration.test.ts` (ORG_ACCESS_DENIED,
  empty subject, live bill slice, cross-tenant no-leak),
  `billEvidenceCompleteness.test.ts` (INV-DOC-001 fixtures).

### 1.3 The live commit path (the producer's seam)

The only live commit surface at V1 is D3's approve→post route. Verified
sequence (`approve-post/route.ts`): forward transitions → **post**
(`post_bill` branch: `billService.post` returns `{bill_id,
journal_entry_id}`, dup-catch recovery via `${caseId}:bill`;
`record_bill_payment` branch: `paymentService.record` returns
`{payment_id, journal_entry_id}`, `${caseId}:payment`) → **the
committed marking** (`advanceCaseAutomation → 'committed'`, `:250-255`)
→ 200. The preserved auto-commit composite
(`commitProposedEntryCard`/`commitProposedMutationBundle`) is
intentionally unreferenced (D4-confirmed) — not a producer site.
Subject-type vocabulary: `'bill'` and `'payment'` are established
`linked_entity_type` values (`LINKED_ENTITY_TABLE_MAP`: `bill →
bills.bill_id`, `payment → payments.payment_id`).

### 1.4 The registration precedent (INV-WORKFLOW-002, D2.1)

Atomic three-artifact registration: `invariants.md` **row 26** +
`control_matrix.md` entry (`docs/06_audit/control_matrix.md:241`,
class "Runtime/structural … test-verified support") +
`ledger_truth_model.md` leaf (`:2345`) + a named **code annotation
site**. The frozen heading (`invariants.md:3` — "the 25 invariants")
stays **untouched**; D8 reconciles 25→26→27. INV-EVIDENCE-001 lands as
**row 27** following this shape exactly.

---

## 2. Design decisions (positions for read-back)

### D-1 — Producer seam: route-level, between post-success and the committed marking

`persist` hooks in the approve→post route **after** the post succeeds
(both branches — subject `('bill', bill_id)` or `('payment',
payment_id)`) and **before** `advanceCaseAutomation('committed')`.
Honors OQ-2's binding constraint (`billService.post` untouched — the
producer is route-orchestrated, not service-buried) and D-0033.3 (the
live INV-DOC-001 gate stays exactly as-is). The recovery branch
(dup-catch) also persists: it resolves the entity id (bill via
`bills.posted_journal_entry_id`, the established lookup) and produces
identically — **the producer is part of the resume, not just the happy
path**. The preserved composite stays byte-unchanged (adoption at the
post-V1 re-wire, the D4 carry-forward shape).

### D-2 — The teeth: committed-marking requires the evidence row (compensating, not transactional)

INV-EVIDENCE-001's v1 enforcement is **structural**: the only code path
that marks a case `committed` persists the evidence object first. If
the persist fails, the request fails → the case sits at `approved`
(operator-visible in the inbox — D3's compensating-path visibility) →
re-approve resumes: dup-catch recovers the JE, persist retries
(idempotent, D-4), the committed marking completes. **The ledger write
is never rolled back** (financial finality; same posture as D3's
post-first sequencing). This gives "the object *required* for commit"
its teeth without rewiring any service gate — enforcement class
**runtime/structural** (the INV-WORKFLOW-002 sibling), test-verified.

### D-3 — `evidenceObjectService.persist`: subject-ownership guard, then assemble→write

New `persist(input, ctx)` method on the existing service (Wave 2's
service grows its write half), in order:

1. **In-service subject-ownership guard (the IDOR centerpiece — read-back
   B-axis).** Resolve `subject_id` in its own table via
   `LINKED_ENTITY_TABLE_MAP[subject_type]` (`bill → bills.bill_id`,
   `payment → payments.payment_id`) **with `.eq('org_id', input.org_id)`**;
   refuse on miss with a typed `SUBJECT_NOT_FOUND` — **foreign ≡ missing**
   (the D3 discipline; no existence leak). This is load-bearing, not
   belt-and-suspenders: `subject_id` is a bare polymorphic uuid (no FK,
   not org-composite) and RLS gives zero write-side protection
   (service-role bypass, no write policy) — without this check a
   foreign-subject persist would flow through assemble's
   empty-facets→`'partial'` mapping into a **spurious
   (verified-org, foreign-subject) row** that the UNIQUE constraint
   cannot catch. The wave's own pattern (D3 in-service org checks; D4
   org-validated account consumption) binds at the write.
2. `assemble` (org-verified facets, the existing cross-tenant guard) →
   map completeness → **upsert** the row.

Mutation ⇒ `withInvariants`-wrapped (unlike read-only `assemble` — the
INV-SERVICE-001 asymmetry, now exercised in both directions in one
service), audit via `recordMutation` (`evidence_object.persisted`;
insert ⇒ `before_state` null), service errors typed. Write via
service-role adminClient — the migration's pinned write-posture (RLS
no-user-write). A guard refusal fails the request (the case holds at
`approved`, D-2) — at this seam a foreign/missing subject is an
integrity violation, never a fallback.

### D-4 — Subject↔trace tightening: uniqueness + the commit trace

1. **Migration:** `UNIQUE (org_id, subject_type, subject_id)` — one
   canonical object per subject (D-0033.1's "one stable, addressable
   row per committed posting" finally constraint-backed). The upsert
   keys on it (idempotent resume; re-persist refreshes `status` +
   `trace_id`). The existing non-unique
   `idx_evidence_objects_org_subject` becomes redundant (the unique
   index serves the same lookup) — **dropped in the same migration**
   (read-back note; zero-row table, no plan risk).
2. **Row `trace_id` = the successful-commit request's `ctx.trace_id`**
   (the approval moment — the object's anchor event; correlates the
   approval/audit rows of the commit). Read-back-confirmed lean, with
   the resume nuance stated for the leaf: the unique key excludes
   `trace_id`, so a crash-resume re-persist refreshes it to the
   **resuming** request's trace — the anchor is the trace of the
   commit that *succeeded*; the original attempt's trace stays
   recoverable from `audit_log`. The link-derived ingest traces remain
   reachable through the assembled facets (`trace_ids[]`).
3. **Assemble-side:** facet scoping unchanged this wave (already
   subject-scoped + org-verified); the header's "refines subject↔trace
   scoping" is realized by the row carrying the verified subject + the
   commit trace under the unique key, not by re-querying facets
   differently.

### D-5 — Status mapping + CHECK broaden (Layer-1 ⇒ Zod checklist)

- Row `status` = transient completeness `'complete'` → `'complete'`,
  else `'partial'` (the transient `'empty'` **collapses to `'partial'`
  at the row grain** — the enum has no 'empty' by design; named here,
  recorded in the leaf). Completeness stays **descriptive** (OQ-6
  disposed: v1 registers structural production, not completeness
  enforcement — see D-6).
- CHECK broadens **additively**:
  `evidence_objects_status_v1_active` → drop; add the successor
  admitting `('reserved','partial','complete')` (constraint-name shape
  per the document_cases linear-suffix convention — exact name pinned
  at decomposition; 'reserved' stays admitted though the producer never
  writes it — purely additive, zero-row table makes either choice safe,
  additive is the precedent).
- Zod: the transient schema is unchanged (it models the assembled
  object, not the row). `types.ts` regen for the new constraint is a
  no-op at type grain (CHECKs don't surface) — regen run regardless as
  the gate.

### D-6 — INV-EVIDENCE-001 registration: claim only what is enforced (OQ-3 discharge)

Registered statement (draft for line-by-line):

> **INV-EVIDENCE-001 — canonical evidence object required at commit
> (Layer 2).** Every AP posting committed through the review path
> produces exactly one canonical `evidence_objects` row per subject
> (org-scoped; `UNIQUE (org_id, subject_type, subject_id)`), carrying
> the commit `trace_id` and a descriptive completeness status, before
> the case reaches `committed`. Enforcement: runtime/structural — the
> approve→post sequence persists-before-marking (annotated
> `INV-EVIDENCE-001`), idempotent across crash-resume; uniqueness is
> Layer-1. Completeness is descriptive at V1 (the D-0033.4 "complete
> evidence bundle" aspiration narrows to what is enforced; the
> completeness-enforcement upgrade is a named post-V1 evolution).

**The reachability argument (the advisor's load-bearing check):** the
invariant is enforced by (a) the Layer-1 unique constraint, (b) the
single live commit path persisting before marking, (c) the
crash-resume tests proving no committed case without its row. It
registers because it now *rejects* states (a second row; a
commit-marking without persist), not because it is declared.

**Read-back condition (A-axis), binding at registration:**

- The leaf and the control-matrix row carry the **runtime/structural
  residual explicitly**, in the INV-WORKFLOW-002 shape: nothing at the
  DB forces the persist-before-marking sequencing; a future edit that
  marks `committed` without persisting compiles cleanly and is caught
  by review + the test suite. Only the uniqueness half has DB teeth.
- The sole-commit-path premise is **not** carried as "D4-confirmed":
  T3 includes a fresh WSL-run **enumeration of every committed-marking
  call site** at HEAD (`advanceCaseAutomation` `target_state:
  'committed'` callers + any direct state writes), each shown
  downstream of a persist (or shown unreferenced, for the preserved
  composite), recorded in the registration commit. The §5.2
  crash-resume test is the test-verified support named in the
  control-matrix row.

Registration artifacts (atomic, one commit): `invariants.md` row 27 +
`control_matrix.md` entry (runtime/structural class, residual named) +
`ledger_truth_model.md` leaf (residual + resume-trace nuance named) +
the code annotation at the route seam + ADR-0033 frontmatter
`invariants: ["INV-EVIDENCE-001"]` (the ADR-0024 precedent). **Heading
count 25 untouched — D8's.**

### D-7 — ADR-0033 D-0033.7 amendment: additive, provenance-preserving

In-place amendment block appended to D-0033.7 (build wave ⇒ amend, not
new ADR; the Phase-2.5 additive-provenance discipline): records that
Wave 6 D5 landed persistence (the route-seam producer), the
subject↔trace final shape (unique key + commit-trace anchor), and the
enforcement realization (structural persist-before-marking;
completeness descriptive). Frontmatter `invariants` updated (D-6).
The D-0033.7 glossary-line sentence is **not** touched — the glossary
reconcile is D8's.

### D-8 — IDOR posture (third-in-a-row surface; the established pattern binds)

- **Writes:** `persist` derives `org_id` from the route's verified
  case row and `subject_id` from the post result / the org-scoped
  recovery lookup — **never caller-supplied ids** (the D3
  `transition()` / D4 account-validation lesson). Service-role write
  is the migration's pinned posture, not a bypass.
- **Reads:** `assemble`'s cross-tenant guard is regression-locked (the
  existing no-leak test stays green).
- **Centerpiece negative, asserted at the persist grain** (read-back
  B-axis: route coverage is the pre-D3 posture and does not count):
  a **direct service-call** `persist` with a foreign-org subject →
  typed `SUBJECT_NOT_FOUND`, **zero rows written**, foreign subject's
  facts leak nowhere; a missing subject behaves identically
  (foreign ≡ missing). The route-level 403/404 pair (D3 suite) stays
  as defense-in-depth, not as the mechanism.

---

## 3. What D5 does NOT do (scope fences)

1. **`billService.post` untouched** (OQ-2 binding; D-0033.3) — the
   INV-DOC-001 gate and its leaf stay exactly as-is.
2. **No completeness enforcement** — status stays descriptive (OQ-6);
   the registered statement claims structural production only.
3. **Heading count + glossary reconcile = D8's** (25→26→27 math; the
   "empty reserved directories" line).
4. **Preserved auto-commit composite untouched** (producer adoption at
   the post-V1 re-wire — carry-forward).
5. **No Logic-Receipt absorption** (D-0033.5/ADR-0035); the decision
   facet stays by-reference.
6. **No backfill** of pre-D5 committed bills (the D-0033.3 dodge holds;
   absence of rows for historical commits is named in the leaf).
7. **No UI change**; no `INV-EVIDENCE-002` allocation.

---

## 4. Impl-onset must-confirms (verify-from-disk before T1)

1. Migration slot: next free number after `20240176` (collision check —
   the Phase-8/D3 lesson).
2. `bills.posted_journal_entry_id` recovery-lookup shape +
   `payments` equivalent for the payment branch (column name on disk).
   **And (read-back fold, now load-bearing for the D-3 guard):**
   confirm `bills` and `payments` carry `org_id` — the guard's
   `.eq('org_id', …)` depends on it (near-certain per INV-RLS-001
   tenant-table coverage; verify regardless).
3. `recordMutation` action-key conventions for a new
   `evidence_object.persisted` key (catalog-count drift check — the
   Permission/audit-key precedent).
4. `withInvariants` opts shape for a non-ledger mutation (nearest
   sibling precedent on disk).
5. The exact INV-WORKFLOW-002 three-artifact texts as templates
   (`invariants.md` row 26, `control_matrix.md:241+`, the leaf at
   `ledger_truth_model.md:2345+`) — transcribe-from-disk, not from
   memory.
6. `CanonicalEvidenceObjectSchema` field list (the persist write maps
   from it); `evidence_object_status` types.ts enum entry.
7. Whether the `record_bill_payment` review branch is reachable with a
   persistable subject at V1 (the D3 postability vendor-gate reading) —
   if structurally unreachable, the payment-branch producer ships
   wired-but-unexercised with the bundle-style grounding note, not a
   fabricated test.

---

## 5. Test surface (summary — full TDD decomposition at plan stage)

1. **Producer happy path:** approve→post → exactly one
   `evidence_objects` row (`subject ('bill', bill_id)`, org = the
   case's org, `trace_id` = the request trace, status ∈
   partial/complete per facets); case `committed`. (D7's row-delta test
   stays D7's — this asserts the evidence row, not the JE delta.)
2. **Idempotent resume (the teeth test):** the D3 crash shape —
   persist made to fail on first approve (or the approved+JE-bound
   seed) → case holds at `approved`, no row or one row → re-approve →
   exactly one row, `committed`. No committed case without its row.
3. **Uniqueness:** direct second insert for the same subject → 23505;
   upsert path refreshes instead.
4. **Cross-org negatives (persist grain):** direct-service
   foreign-org-subject persist → `SUBJECT_NOT_FOUND`, zero rows;
   missing-subject persist → identical refusal (foreign ≡ missing);
   plus the standing assemble no-leak regression + the route 403/404
   pair (D3 suite, byte-unchanged).
5. **CHECK broaden:** `'partial'`/`'complete'` insert admitted;
   (`'reserved'` per the D-5 choice).
6. **Registration doc-sync:** advisor line-by-line at the three
   artifacts + annotation (not a runtime test).
7. D3 + D4 suites green **byte-unchanged**.

## 6. Cadence

This brief → advisor read-back (**HOLD**) → decomposition →
read-back (**HOLD**) → task-by-task (per-task read-back, code + runs
together) → commit under `COORD_SESSION='wave-6-ap-review'`. Expected
shape: ~5 tasks (T1 migration + types regen; T2 `persist` +
route wiring + integration suite; T3 INV-EVIDENCE-001 registration,
atomic three-artifact + annotation; T4 ADR-0033 D-0033.7 amendment +
frontmatter; T5 close — gates + governance-diff verification +
close report). The close's scope-fence check is **inverted** vs D3/D4:
the governance diff must contain **exactly** the registration +
amendment artifacts and nothing else. No push; terminal push is Phil's
at wave close.
