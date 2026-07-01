# Board #4 — Slice 2 Build Plan (§1.6)

> **Status:** DRAFT — Phase 1 §1.6 task decomposition. No code; no prod writes.
> Pending advisor disk-verification + Phil approval. **Not committed with the
> `bb511285` checkpoint** (authored after it).
> **Authored:** 2026-07-01 (WSL).
> **Design authority:** `2026-06-29-board-4-slice-2-build-spec.md` (§1.4 N-1;
> §1.5 the fan — both locks); `2026-06-16-board-4-multi-invoice-modeling-design.md`
> (α, Fork A/B, §10.1 trace).
> **All four locks (carried):** Fork A = one-case-N-bills · N-home = α · N-1
> segment-then-loop · idempotency = caseId-prefixed composite · atomicity =
> per-invoice-independent + aggregate committed-marking.
> **Lane:** WSL drafts; advisor verifies against disk; Phil owns commits + prod.

---

## Three advisor attention-points (built to be disk-checkable when this lands)

Called out up front because they are where a subtle build-spec error does real
damage (advisor, 2026-07-01):

- **(AP-1) The α migration shape** — Task 1.
- **(AP-2) The committed-marking re-grain must actually read *all N* α rows'
  `posted_bill_id`** — Task 4.
- **(AP-3) The per-invoice key is read *from the α row*, never recomputed** —
  Task 5 (crosses Tasks 1/3/4).

---

## Build order (dependency-ordered)

```
T1 α migration ──► T2 Stage 2.5 segment ──► T3 N-loop post ──► T4 committed re-grain
                                     └─► T5 persisted key (spans T1/T3/T4)
                                     └─► T6 G3 stuck-invoice affordance (T3/T4 + UI)
                                                                    └─► T7 tests + close
```

## Task 1 — α `extracted_invoice` migration (AP-1)

- **Table** (draft; the Phase-2 substrate pattern, but a **workflow row**, not a
  fully-immutable one — see immutability note):
  - `id` uuid PK
  - `document_case_id` uuid NOT NULL → `document_cases(id)`
  - `source_document_id` uuid NOT NULL → `source_documents(id)`
  - `ordinal` int NOT NULL — 1..N within case, over a **deterministic** Stage-2.5
    sort (T2)
  - `document_type` document_type NOT NULL — **per-invoice** (subsumes §10.2)
  - `extracted_fields` jsonb NOT NULL — the per-invoice `VendorInvoiceExtraction`
  - `extraction_run_id` uuid NULL → `extraction_runs(id)` — **nullable is
    load-bearing** (advisor, 2026-07-01): α (via `extracted_fields` + `region_ref`),
    **not** `extraction_runs`, is the per-region provenance home — the direct
    consequence of choosing **α over β** (extend-`extraction_runs`, the wrong axis).
    Per-region extraction under N-1 does not fit the per-`source_document`
    `extraction_runs` keying, so this link is optional/coarse by design. Do **not**
    "fix" to NOT NULL.
  - `region_ref` jsonb NULL — segment bbox/line-range (N-1 provenance)
  - `idempotency_key` text NULL → the resolved per-invoice key, **written at first
    post, then immutable** (AP-3 / Task 5)
  - `posted_bill_id` uuid NULL → `bills(bill_id)` — the auditable case↔bill link
  - `post_status` enum NOT NULL DEFAULT `pending` ∈ {`pending`, `posted`,
    `unrepairable`} — drives T4 aggregate + T6 affordance
  - `trace_id` uuid NOT NULL, `created_by` text NOT NULL, `created_at` timestamptz
- **Immutability posture (AP-1 detail):** follow **`document_cases`** (workflow
  row, column-immutability) NOT `document_artifacts` (fully append-only): anchors
  (`id`/`document_case_id`/`source_document_id`/`ordinal`/`created_*`) immutable via
  trigger; **`posted_bill_id`, `post_status`, `idempotency_key` mutable** (they're
  written post-INSERT). Note: `idempotency_key` is *write-once* (NULL→value, never
  re-write) — enforce with a trigger guard, since a re-key would break AP-3.
- **RLS:** through-parent `document_cases.org_id` (mirror `document_case_sources`
  `20240145:82-98`).
- **Atomic INSERT-with-audit RPC** (mirror `create_document_case_with_audit` /
  `attach_document_case_source_with_audit`, parent-derived `org_id`).
- **Verify (AP-1):** FK targets exist (`document_cases.id`, `source_documents.id`,
  `extraction_runs.id`, `bills.bill_id` — confirmed §1.4 audit); the write-once
  `idempotency_key` guard; the mutable/immutable column split.
- **NOT-NULL blast radius:** `.claude/rules/migrations.md` — enumerate INSERT sites
  (only Stage 2.5, T2) before shipping any NOT-NULL-without-default.

## Task 2 — Stage 2.5 (segment)

- New pipeline stage between OCR (Stage 2) and classify (Stage 3): read the
  structured artifact (bbox `lines`), partition into N invoice regions, and for
  each write one α row (via T1 RPC) carrying `region_ref` + the per-region
  `document_type` + `extracted_fields` (classify+extract run per region — the N-1
  loop).
- **Deterministic ordering** (watch-item 1 / re-seg drift): assign `ordinal` over a
  content-stable sort (e.g. region top-`y`), so a re-run reproduces ordinals and the
  ordinal-fallback key (T5) is stable.
- **Segmentation algorithm is the build risk** (spatial clustering vs
  `Invoice #`-header anchoring) — the α lock is robust to its difficulty (design
  §4.4); imperfect segmentation degrades to `needs_review` via the spine, never
  silent mis-post. Isolate the algorithm behind a seam so it can be iterated.
- **N=1 compatibility:** a single-invoice document segments to N=1 → one α → the
  existing 1-shape, unchanged. Slice 2 must not regress the common single-invoice
  path.

## Task 3 — N-loop in the approve-post route

- Replace the single `buildPostBillInput(card) → billService.post` with a **loop
  over the case's α rows** (`post_status='pending'`): for each α,
  `buildPostBillInput(α) → billService.post({ ..., source_external_id: α.idempotency_key })`,
  then write `α.posted_bill_id` + `post_status='posted'`.
- **Per-invoice-independent (locked):** each α posts/fails alone. On
  `POSTING_RECOVERY_UNREPAIRABLE` (G3), mark `α.post_status='unrepairable'` and
  **continue the loop** — one stuck invoice never blocks its siblings.
- **Key source (AP-3):** `source_external_id` is read from `α.idempotency_key`
  (T5), never recomputed here.
- Preserve the existing state-aware resume (needs_review→proposed→approved) at the
  **case** grain; the post loop is the per-invoice grain beneath it.

## Task 4 — Committed-marking re-grain (AP-2)

- The case reaches `committed` **only when every α row has `post_status='posted'`
  (⇔ `posted_bill_id` set)**. Otherwise the case holds in a review state with the
  non-posted α rows flagged (`pending` = retryable; `unrepairable` = G3, Task 6).
- **AP-2 verify:** the terminal marking must **read all N α rows** and aggregate —
  not mark `committed` off a single post. This is the specific place a subtle error
  (marking committed after the first/any post) would wrongly terminate a
  partially-posted case. Test: 3 α, 2 posted + 1 `pending` → case NOT committed; all
  3 posted → committed.

## Task 5 — Persisted per-α idempotency key (AP-3 / watch-item 1)

- **Resolve once, at first post:** `key = vendor_invoice_number` when present AND
  unique within the case's N α rows, else `${caseId}:bill:${ordinal}`; store as
  `${caseId}:bill:${suffix}` on `α.idempotency_key` (write-once, T1 guard).
- **Read, never recompute** at re-run dedup (T3) and crash-class recovery (G3) — so
  the two can never disagree about an invoice's key (the mixed number/ordinal seam
  the advisor flagged). The `caseId` prefix is mandatory (G1: dedup scope is
  `(org_id,'manual',key)`, org-wide — an unprefixed number collides across cases).

## Task 6 — G3 stuck-invoice affordance (watch-item 2)

- An `α.post_status='unrepairable'` (JE landed, bill didn't;
  `POSTING_RECOVERY_UNREPAIRABLE`) renders a **distinct "manual repair"
  affordance** in the review UI — explicitly **not** a "retry" (re-approving
  structurally cannot resolve it, by the error's own words). Slice-2 / §2 UX.

## Task 7 — Tests + close

- Integration: N=1 (no regression); N=3 all-clean (3 bills, case committed); N=3
  with 1 `needs_review` (2 posted, case in review); N=3 with 1 `unrepairable` (2
  posted, 1 flagged manual-repair, case in review); re-run idempotency (persisted
  key → no double-post); AP-2 aggregate; AP-3 key read-from-α.
- `pnpm agent:validate` green; migration-review cadence per `.claude/rules/`.

---

## Out of scope

- Stage 2.5 segmentation *algorithm* internals (build-time; iterated behind the T2
  seam).
- Org-wide cross-case invoice dedup (design §1.5.2 — preserves per-case scope).
- Slice-1 detector (Phase 0) — independent.
