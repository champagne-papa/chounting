# Board #4 slice-2 implementation arc — retrospective

**Arc:** Board #4 slice-2 — multi-invoice modeling (one case → N bills via the α
`extracted_invoices` entity). T1 → T6, the middle-and-post-phase build.
**Anchor:** `origin/main` — 20 commits ahead, all local/unpushed at close.
**Range:** `bb511285`..`e8711ad4`. **Dates:** 2026-07-01 / 2026-07-12.
**Design authority:** `docs/09_briefs/post-mvp/2026-06-29-board-4-slice-2-build-spec.md`
(§1.4-1.6), `…-build-plan.md`, `2026-07-01-board-4-slice-2-middle-design.md`,
`2026-07-10-board-4-slice-2-t2b-ai-segmentation-design.md`,
`2026-07-12-board-4-slice-2-t6a-unrepairable-substrate-brief.md`.

## §1 Scope and timeline

The pre-slice pipeline was 1-invoice-per-case end to end; a document with N invoices
could not be represented. This slice built **case → N bills**, where bills stay the AP
target (`vendor_id` FK) and a new α entity, `extracted_invoices`, is the per-invoice
N-home. Locked: Fork A (one-case-N-bills); AI-assisted segmentation (A+D, reconciliation-
gate degrade); **Reading A** (two paths — α written only for reconciled N≥2 splits;
single-invoice docs write no α and take the untouched Tier-A path). 20 commits over
2026-07-01 → 07-12, all local on `feat/board-4-slice-2`, banked for the retrospective-
close push.

## §2 Chunks and commits

| Chunk | Commit | What |
|---|---|---|
| design | `bb511285` | Phase 1 design decisions + build spec §1.4-1.5 |
| plan | `cba78c7e` | build plan §1.6; Phase 1 closed |
| T1 | `d5d4f1be` | `extracted_invoices` (α) substrate migration (`20240181`) |
| design | `0c0cb1b5` | middle-design + review-surface scope supersession |
| T2a | `997fe2cf` | α-write service (`createExtractedInvoice`) + behavioral test |
| T2b | `78faf607` | AI-segmentation design + N-1→N-2 reversal (recorded additively) |
| T2b | `b93c4899` | AI-multi-extract core (segmentation + reconciliation gate) |
| enum | `00ab6cb6` | `exception_reason 'multi_invoice'` enum broaden |
| T2c | `d687243f` | live-wire the multi-invoice branch into `ingestDocument` |
| T2c | `36062512` | friction-journal — T2c grounding catch |
| T2.5 | `71f31d5d` | `buildReviewPreview` reads α → N cards + α-absent fallback |
| T3 3a | `d881243c` | α-post substrate — `post_extracted_invoice_with_audit` RPC + service (`20240184`) |
| T3 3b | `9597dc45` | approve-post N-branch fan (multi-invoice cases post N bills) |
| T2.5 fix | `7da4469b` | review-copy staleness post-T3 (badge + block comment) |
| T4 | `ab236ae1` | register INV-WORKFLOW-003 + reconcile INV-EVIDENCE-001 |
| T5 | `a01002ee` | verify-and-close — T5 subsumed into T3 (deterministic recompute + write-once persist) |
| T6a | `6160d3ae` | T6a chunk-brief — `unrepairable` write-path substrate |
| T6a | `4fb6c518` | T6a impl — `mark_extracted_invoice_unrepairable_with_audit` RPC + service + test (`20240185`) |
| T6b-1 | `435a75f2` | wire the crash-class into approve-post (mark + skip) + crash-class-X test |
| T6b-2 | `e8711ad4` | review-surface unrepairable affordance (guarded `anyPostable` + manual-repair UI) |

## §3 Codification

**None crossed the N≥3 graduation threshold — a narrative close, not a codifying one**
(the same disposition as the T5 close). Surfaced first-hand via the
`friction-pattern-detector` over the 20-commit window, corroborated by both slice-2
friction-journal entries' own self-declarations ("observation-grain N=+1 of the
already-codified"; "`codify-convention` not triggered"). Dispositions:

- **T1 (graduate-now): none.** No pattern fired N≥3 net-new in-window; no
  `codify-convention` invocation this close.
- **New articulations banked as narrative (below N=3):** **fail-loud-on-gating-mutation**
  (N=1 — the unwrapped-mark discriminator, banked as reusable); **chunk-sequencing
  artifact-staleness** (N=2 **watch-item**, two named fires — `7da4469b` + the T5
  doc-phrasing reconciliation — a third fire routes through `codify-convention`).
- **Reinforcements (no re-codification, cited as evidence):** the reciprocal
  executor↔advisor correction rhythm (`projection-from-model.md` bilateral-advisor-grain);
  report-before-mainline-touch / hold-for-go (`scope-lock.md`
  verify-from-disk-at-non-standard-grain); reversal-recorded-additively (ADR-0022 /
  `ratified-contract-scope.md`, correctly executed).

All recorded in the T6-arc friction-journal entry (2026-07-12).

## §4 Load-bearing decisions (and why)

1. **Reading A — two paths (α only for multi-invoice).** Single-invoice docs write no α
   and take the untouched Tier-A path; α is written only for reconciled N≥2 splits. The
   α-absent fallback is permanent, not a drain. Cost accepted and named: the Tier-C →
   NOT_POSTABLE single-invoice residual (§5).

2. **α-always → α-only reversal (N-1 → N-2).** Segmentation is AI-multi-extract gated
   behind `looksMultiInvoice`, so the single path is untouched. Recorded additively
   (ADR-0022) at `78faf607` / `0c0cb1b5`, not a silent rewrite.

3. **T5 idempotency key = deterministic recompute + write-once persist (subsumed into
   T3).** The per-invoice key (`${caseId}:bill:${vendor_invoice_number-if-unique else
   ordinal}`) is needed at `billService.post` *before* it is persisted, and is NULL at
   crash-recovery — so read-back is structurally impossible. `childKeyFor` recomputes it
   deterministically over write-once α fields; the write-once persist is the durable
   record. "Persisted, not recomputed" holds for the posted-α short-circuit; the
   transient pre-persist recompute provably equals the persisted value.

4. **INV-WORKFLOW-003 — aggregate committed-marking, safety direction only.** A `committed`
   case bearing α has every α with `posted_bill_id` (committed ⇒ all-α-posted); the
   reverse is deliberately unregistered (crash-window-transient). This is what makes a
   stuck α hold the case at `approved` rather than falsely commit it.

5. **The crash-class fix-site correction (recovery sub-call, not the `else`).** Both the
   executor and the advisor first placed the `POSTING_RECOVERY_UNREPAIRABLE` handling at
   the loop's `else throw`. Grounding the origin corrected it: the crash-class is raised
   by `getRecoveryBillIdByJournalEntry` *inside* the `DUPLICATE` branch, unguarded. The
   fix wraps that recovery sub-call — not a new `else` arm.

6. **Fail-loud on the gating mutation (unwrapped mark).** `markExtractedInvoiceUnrepairable`
   in the route loop is deliberately unwrapped: a write that gates subsequent read-back /
   skip logic must not swallow its errors, because the failure mode is "the response
   claims a state the DB doesn't hold, and the downstream skip keys on the persisted
   `post_status`." Banked in the friction-journal as a reusable discriminator.

7. **Guarded `anyPostable` (the `[posted, unrepairable]` edge).** The `'posted'` disjunct
   is guarded with `!hasUnrepairable` (hoisted) — closing the case-grain watch-item-#2
   unwinnable ("Approve & Post" on a permanently-uncommittable case) **without**
   collapsing the mixed `[pending-postable, unrepairable]` case, where the operator can
   still post the pending α.

## §5 Carry-forwards

- ✅ **`post_status='unrepairable'` coupling — CLOSED.** T6a (writer) + T6b-1 (route) +
  T6b-2 (UI); the crash-class-X test proves the case can never commit while an
  `'unrepairable'` α exists.
- 🆕 **`ReviewCaseDetailView.test.tsx` test-1** — pre-existing async post-click status
  failure; fails identically on the clean baseline `435a75f2` (stash-and-run verified).
  Journaled 2026-07-12; carried forward as a friction-journal/retro item, not a slice-2
  defect.
- 🆕 **chunk-sequencing artifact-staleness** — watch-item, N=2 (two named fires:
  `7da4469b` UI-copy-vs-code; the T5 doc-phrasing reconciliation spec-vs-code). A third
  fire crosses N=3 → route through `codify-convention`.
- ⏳ **crash-window composition test gap** (bill-posted-but-α-write-crashed; proven in
  halves, not composed) — distinct from T6b's bill-never-landed (G3) test. Post-v1.
- ⏳ **Tier-C → NOT_POSTABLE single-invoice residual** — the accepted Reading-A cost.
  Post-v1.
- ⏳ **B3 re-segmentation ordinal-drift** (§1.5.2) — tracked-not-solved.

## §6 Three-condition push-gate status

- **C1 — test-suite health:** arc tests green at HEAD (integration group 37/37, floor
  26/26, T6a 3/3, T6b-1 1/1); the one deviation is test-1 (pre-existing, journaled,
  clean-baseline-verified). Formal Condition-1 evidence is a `pnpm test:full` sweep — the
  operator's pre-push act (it wipes the local DB).
- **C2 — doc-sync:** no commit since T4 (`ab236ae1`) touched `invariants.md` /
  `ledger_truth_model.md` / `control_matrix.md` (git-verified untouched). **C2 confirmed
  first-hand across the three documentation surfaces at this close:** the documented
  registered set reconciles at 29 (invariants live 29 ↔ control_matrix Expected:29 ↔
  ledger 30 IDs − the doc-side reserved INV-CHECKPOINT-001), the three code-side exceptions
  absent from the ledger, INV-WORKFLOW-003 reading the safety direction verbatim, no leaf
  added or dropped since T4. The symmetric-difference-empty (bidirectional reachability)
  claim stands from the reachability statement — the code-side annotation grep is not
  re-run here (git-lane).
- **C3 — governance closeout:** this retrospective + the T6-arc friction-journal entry.

**The push is a separate, later act — the operator's, given directly.** All three
conditions reading green is the precondition for the operator's decision, not the
decision. Twenty commits to `origin/main` is the arc's first prod-adjacent state change;
no clean retrospective, no doc-consistency pass, and no green-tally is that authorization.
