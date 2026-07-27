# Board #4 Slice-2 — T6a chunk-brief: the `unrepairable` write-path substrate

> **Status:** DRAFT — chunk-brief for the advisor's doc-consistency pass and
> Phil's impl go. **No code, migration, or apply authored under this document
> yet.** Scope is the substrate half of T6 only (the write path); the route
> loop-fix, the top-of-loop skip, the review-UI affordance, and the crash-class-X
> integration test are **T6b** (see Anti-scope).
>
> **Design authority (unchanged, not re-litigated here):**
> `2026-06-29-board-4-slice-2-build-plan.md` Task 3 (mark-unrepairable-and-continue,
> locked) + Task 6 (manual-repair affordance); `2026-06-29-board-4-slice-2-build-spec.md`
> §1.6 watch-item #2; `2026-07-01-board-4-slice-2-middle-design.md` §5 (T6).

## 1. What this realizes (completion, not invention)

The build-plan **Task 3** already locked the behavior: *"On
`POSTING_RECOVERY_UNREPAIRABLE` (G3), mark `α.post_status='unrepairable'` and
continue the loop — one stuck invoice never blocks its siblings"* (build-plan
:104-106). The shipped T3 3b (`9597dc45`) implemented that per-invoice-independence only for
the *not-postable* / *missing-required-fields* cases — **never the crash-class** (a
partial Task 3). And the crash-class does **not** arrive at the loop's `else throw`:
`postMultiInvoiceCase`'s catch special-cases only `DUPLICATE_SOURCE_EXTERNAL_ID`,
but on re-approval `billService.post` raises `DUPLICATE` (the JE landed → dedup
fires), which **is** caught; then, *inside that branch*,
`getRecoveryBillIdByJournalEntry` finds no bill and raises
`POSTING_RECOVERY_UNREPAIRABLE` **unguarded** (`approve-post/route.ts:420-438`; the
recovery sub-call at `~:431`). So the crash-class propagates out of the **`DUPLICATE`
branch — not the `else`** — the α is never marked `'unrepairable'`, the throw aborts
the loop, and the case 409s. **The T6b fix-site is that recovery sub-call (§6), not a
new `else` arm** — the framing both of us corrected mid-onset, pinned here so it
carries forward.

T6 completes that locked-but-unshipped behavior in two chunks:
- **T6a (this brief):** the write path that lets a caller set
  `α.post_status='unrepairable'` — an audit-paired RPC + service method + types +
  a behavioral test. Proven in isolation, exactly as 3a proved the post-write path
  before 3b routed to it.
- **T6b (next):** wire the route loop to that path (catch the crash-class at the
  recovery sub-call → mark → route to `unposted` → continue), add the top-of-loop
  `'unrepairable'` skip, render the manual-repair affordance, and the crash-class-X
  integration test. **Not in this brief.**

The reserved enum value `'unrepairable'` exists in the T1 substrate
(`20240181000000`) with **zero writers today** (grounded: `create` RPC defaults
`'pending'`, 3a sets `'posted'`, nothing sets `'unrepairable'`). T6a is its first
and only writer.

## 2. The substrate contract (grounded against the T1 bytes)

The transition needs **no substrate change** — the T1 substrate already admits it.
First-hand from `20240181000000`:

- **CHECK** (`:94-96`): `((post_status = 'posted') = (posted_bill_id IS NOT NULL))`,
  comment (`:91-93`): *"unrepairable + pending both have NULL posted_bill_id."*
- **Immutability trigger** (`:163-205`): `post_status` is **absent** from the
  anchor-immutability list (`:166-176`); the two write-once guards
  (`idempotency_key` `:184-188`, `posted_bill_id` `:192-196`) are each gated on
  `OLD.<col> IS NOT NULL`.

The load-bearing invariant — **the RPC's `UPDATE` sets `post_status` only, leaving
`posted_bill_id` (and `idempotency_key`) untouched**. This is the *mechanism*, not
tidiness; both required behaviors fall out of it:

| Case | Effect of `UPDATE post_status only` | Result |
|---|---|---|
| `pending` α (bill NULL) → `unrepairable` | bill stays NULL; write-once guards dormant (`OLD IS NOT NULL` false); CHECK `FALSE = FALSE` | **succeeds** |
| `posted` α (bill non-NULL) → `unrepairable` | bill unchanged → write-once guard's `NEW IS DISTINCT FROM OLD` false → **trigger passes**; CHECK `FALSE = TRUE` → FALSE | **`23514`** (check_violation) |
| `unrepairable` α → `unrepairable` (re-mark) | no-op UPDATE; CHECK `FALSE = FALSE` | **no-op success** (D1) |

**Error-code precision (the T6a-specific build requirement):** the posted-α reject
is raised by the **CHECK (`23514`)**, *not* the write-once trigger (`0A000`) —
because the `UPDATE` doesn't touch the bill, the trigger passes and the CHECK is
what fails. 3a's `postExtractedInvoice` maps only `0A000 → INVALID_TRANSITION`,
else → `POST_FAILED` (`extractedInvoiceWriteService.ts:169-183`, grounded). So the
T6a service method **must add an explicit `23514 → INVALID_TRANSITION` mapping** —
it cannot inherit 3a's mapping, or the reject surfaces as the `POST_FAILED`
catch-all. `0A000` is not expected on any T6a path (no write-once column is
touched).

The wrong alternative — setting `posted_bill_id = NULL` to "force" a CHECK-legal
state — would trip the write-once trigger on a `posted` α (`0A000`, the wrong
error) and would un-link a real bill. Rejected by design: **`UPDATE post_status`
only; the CHECK does the rest.**

## 3. Deliverables

1. **Migration `20240185000000_board_4_mark_extracted_invoice_unrepairable.sql`**
   (slot confirmed free first-hand) — a new RPC
   `mark_extracted_invoice_unrepairable_with_audit(p_post JSONB, p_audit JSONB)`
   **mirroring `20240184000000`'s shape**: `SECURITY INVOKER`; `GRANT EXECUTE … TO
   service_role`; `FOR UPDATE` lock on the α row; capture `before_state`
   (`post_status` + `posted_bill_id`); derive `org_id` from the parent
   `document_case` (chunk-3 canonical, no service-side double-read); paired
   `audit_log` INSERT in the same transaction; `RETURN v_id`. **Sole difference
   from 20240184:** the `UPDATE` sets `post_status = 'unrepairable'` **only** —
   `p_post` carries just `{id}`, no `posted_bill_id`, no `idempotency_key`. New
   audit action `'extracted_invoice_unrepairable'`.
2. **Service method `markExtractedInvoiceUnrepairable`** in
   `extractedInvoiceWriteService.ts`, mirroring `postExtractedInvoice`: input
   `{ extracted_invoice_id, trace_id, marked_by }`; calls the new RPC; **maps
   `23514 → INVALID_TRANSITION`** (D2), else → `POST_FAILED`. `marked_by` mirrors
   3a's `posted_by` attribution — the reviewer whose approval surfaced the
   crash-class (honest causality; open to confirmation at grounding).
3. **`types.ts` regen** against the post-migration schema (additive; no shape
   change beyond the new RPC signature).
4. **Behavioral test** (mirroring 3a's write-once test), the five designed
   assertions below.

## 4. Decisions (Phil's calls; advisor leaned concur)

- **D1 — re-mark `unrepairable → unrepairable` is a no-op success.** Mirrors 3a's
  same-value re-post no-op; CHECK-legal (`FALSE = FALSE`); writes a redundant audit
  row (the identical accepted noise 3a carries). T6b's top-of-loop skip keeps it
  off the hot path — a clean defensive contract.
- **D2 — the posted-α reject is a designed, tested assertion.** The T6a analog of
  3a test-2's different-bill reject: attempting to mark a `posted` α through the
  real RPC/service path must reject `23514 → INVALID_TRANSITION`, with a read-back
  proving the posted α survives unchanged. Closes a real hole — a successfully
  posted α can never be silently reclassified as a crash-failure.

## 5. The five designed assertions (behavioral test)

1. `pending → unrepairable` sets `post_status = 'unrepairable'`.
2. `posted_bill_id` stays **NULL** on the marked row.
3. The persist is **CHECK-legal** (row survives; no `23514`).
4. A **paired `audit_log`** row lands, with **`before_state.post_status = 'pending'`**
   (the load-bearing assertion — designed, not incidental; the advisor's named
   verify target).
5. Marking a **`posted`** α is **rejected `23514 → INVALID_TRANSITION`**, and a
   read-back shows that α unchanged (D2).

## 6. Anti-scope (explicitly NOT in T6a — these are T6b)

- The route catch-fix at the recovery sub-call (`approve-post/route.ts ~:431`) —
  catch `POSTING_RECOVERY_UNREPAIRABLE` → call this service → `unposted.push` →
  `continue`.
- The top-of-loop `post_status === 'unrepairable'` skip (`~:387`).
- The `ReviewCaseDetailView` manual-repair affordance + excluding `'unrepairable'`
  α from the case-level postable count (`reviewPreview.ts` `anyPostable`).
- The crash-class-X multi-case integration test (α marked, siblings post, case
  holds at `approved`, re-approval skips, never `committed`) and the WORKFLOW-003
  non-weakening verification.
- Any invariant-ledger / `control_matrix` change. T6a registers **no INV** — it is
  a write-path substrate; WORKFLOW-003 already carries "committed ⇒ all-α-posted."

**This brief must not reach past the substrate into any T6b surface.**

## 7. Verify-done (T6a impl, at the separate impl go)

- `pnpm typecheck` green; the behavioral test (5 assertions) green.
- `types.ts` regenerated against the post-migration schema.
- Migration applies clean to local PG (**Phil's apply lane**); migration-review
  cadence per `.claude/rules/migrations.md` (stop-after-migration review before the
  service).
- `pnpm agent:validate` floor green.
- No T6b surface touched.

## 8. Lanes / provenance

- Substrate bytes (T1 CHECK/trigger, the `23514`-vs-`0A000` distinction), 3a's
  mirror shape and `0A000`-only mapping, and the free slot `20240185000000` are
  **first-hand (WSL, this pass)**.
- The build-plan Task-3/Task-6 framing is grounded first-hand.
- D1/D2 are **Phil's calls** (advisor leaned concur); the migration-apply is
  **Phil's lane**; the advisor's doc-consistency pass verifies this brief says what
  the bytes say and does not reach into T6b.
- Nothing here is a go: the T6a **impl** waits for Phil's separate word to WSL.
