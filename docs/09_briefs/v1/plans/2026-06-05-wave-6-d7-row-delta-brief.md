# Wave 6 D7 Brief — The Positive Human-Approve→Post Ledger-Row-Delta Test

**Status:** DRAFT — surfaced for advisor read-back (combined
brief + decomposition — see §5 Cadence; D7 is test-only and not
governance-crossing).
**Charter (plan-of-record §3, verbatim):** "§5.1 direct
ledger-row-delta test — the **positive** human-approve→post row-delta
(non-vacuous post-D1); **not** the §3.3(b) auto-commit-zero negative."
Registers/amends: nothing. IDOR surface: —. No migration, no ADR, no
fence class — none of the four-gate governance scrutiny applies (the
advisor's boundary characterization, confirmed by grounding).
**Grounding HEAD:** `33a26b8e` (53 banked-local; seven of nine
deliverables closed).
**Record line:** Variant A (D6 D-5 harness wiring) **explicitly
affirmed by Phil** at the D6→D7 boundary, 2026-06-05 — converting the
close report's standing-by-non-objection into an affirmative record.

---

## 1. Grounded surface

### 1.1 The §5.1 provenance and the build-plan reframe

The hotfix change-spec §5.1 (2026-05-31) deferred a "truly-direct
ledger-row-delta test" to Wave 6 because it was **structurally
vacuous** pre-D1 (the matcher gap null-gated the post path; "zero-rows
is true with or without the bleed-stop"). §5.1's own wording describes
the **negative** (a matched postable invoice produces zero rows); the
build-plan D7 row deliberately reframes to the **positive** — the
human approve→post writes exactly the right rows — and **excludes**
the auto-commit-zero negative (that is §3.3(b), deferred post-V1 with
the governed re-wire; the build plan's deferred list carries it).
Post-D1 the positive is non-vacuous: the matcher resolves, the
proposal is postable, the route posts.

### 1.2 What already exists (the D3 seam)

`reviewApprovePost.integration.test.ts` HAPPY PATH asserts **in
passing**: `jeCount` delta === 1 (the line carrying the literal
comment "(the D7 seam)"), `created_by` = the human reviewer,
`source_system='manual'`, `source_external_id=${caseId}:bill`, a
`bills` row pointing at the JE, case `committed`. What it does NOT
assert: the `journal_lines` shape (balance; the debit/credit accounts;
the amounts), the **absence** deltas (no `payments`, no
`bill_payment_allocations` rows), `bill_lines`, or the D5
`evidence_objects` delta — the full write-set of one human approval.

### 1.3 The post-D5/D4 write-set (what one approval writes at HEAD)

One approve→post of a postable vendor_invoice card writes, at ledger
grain: **1** `journal_entries` row (human-attributed, dedup-keyed) ·
**2** `journal_lines` (DR expense — the D4 rule account or the org
default — and CR AP-control, equal amounts — INV-1 at the route grain)
· **1** `bills` row (+ `posted_journal_entry_id`) · **1** `bill_lines`
row · **1** `evidence_objects` row (D5) · **0** `payments` · **0**
`bill_payment_allocations`. That matrix is D7's content: the positive
delta, asserted exhaustively as a first-class artifact rather than
partially in passing.

## 2. Design decisions

### D-1 — A dedicated test file asserting the complete delta matrix

New `apps/web/tests/integration/reviewApprovePostRowDelta.integration.test.ts`
(the D3/D4/D5 harness: `buildServiceContext` mock, seed RPC, Tier-A
artifact, exact-name vendor). One primary test: capture
**before-counts across all seven tables** (org-scoped) → approve →
assert the exact deltas (+1 JE, +2 JL, +1 bill, +1 bill_line, +1
evidence object, **+0 payments, +0 allocations**) plus the row-content
assertions: the JE balanced (sum debits === sum credits === the
invoice amount), DR line on an expense account / CR line on the
AP-control account, human attribution, the dedup key, bill→JE
back-reference, evidence subject = the bill. A second test asserts
**idempotence at the delta grain**: re-approving the committed case
(`already_complete`) produces **all-zero deltas** across all seven
tables — the strongest single statement of "one approval = one
write-set."

### D-2 — Scope fences (sharp, because the neighbors are owned)

NOT the §3.3(b) auto-commit-zero negative (post-V1, charter-excluded).
NOT a re-test of D3's recovery/IDOR/permission branches, D4's account
selection (asserted only as "an expense account" — the D4 suite owns
which), or D5's persist semantics (the evidence delta is counted, not
re-verified). D3/D4/D5 suites stay byte-unchanged. No source-code
change of any kind — **test-only**; if any assertion fails, that is a
finding to STOP-and-surface, not code to fix under D7.

## 3. Impl-onset must-confirms

1. `journal_lines` count for a single-line bill post: grounded
   expectation 2 (DR expense + CR AP) — verify from
   `billService.post`/`journalEntryService.post` line construction on
   disk before pinning the literal.
2. Table/column names for the two absence assertions (`payments`,
   `bill_payment_allocations`) — read from types.ts (both confirmed
   present this wave).
3. The D3 suite stays byte-unchanged (the seam comment is cited, not
   edited).

## 4. Test surface

The two tests of D-1 (the delta matrix + the all-zero idempotence
delta), org-scoped counts throughout, run with the standard gates
(`agent:validate` — which now self-exercises the D6 teeth — and
typecheck).

## 5. Cadence (light-arc proposal — the read-back decides)

D7 is one test file with zero governance footprint. Proposed shape:
**this combined brief+decomposition** (one read-back) → **T1** (the
test, TDD-natural: the file IS the deliverable; red is meaningless
here since the code under test already works — the discipline is
assert-from-disk-grounded expectations, surface any failure as a
finding) → **T2** folded into T1's commit + a short close note
appended to this doc (§6, post-implementation) rather than a separate
close report — the close check is "D3/D4/D5 suites byte-unchanged +
gates green + this doc's §6 filled." If the advisor prefers the full
five-surface ceremony, it splits without rework. No push; terminal
push is Phil's at wave close.

## 6. Close note (T1 close — the light-arc close record)

**Shipped:** `apps/web/tests/integration/reviewApprovePostRowDelta.integration.test.ts`
— two tests: THE DELTA MATRIX (org-scoped count deltas
`{+1 journal_entries, +1 bills, +0 payments, +0 bill_payment_allocations,
+1 evidence_objects}` + the new-row-grain content assertions: exactly
2 balanced journal_lines at $180 (1 DR on an org-scoped expense
account, 1 CR on the org-scoped AP-control liability), human
attribution + dedup key, bill→JE back-reference, exactly 1 bill_line,
the evidence subject) and THE ALL-ZERO IDEMPOTENCE DELTA (re-approve
of a committed case → `already_complete` + zero deltas across all
five counted tables).

**Grounding discharged (the read-back condition — every literal
traced):** +2 JL ← `billService.post` `lines: [...drLines, crLine]`
(`billService.ts:308-315` — one DR per bill_line + ONE aggregated CR
ap_control; the builder emits one bill_line); +0 payments/+0
allocations ← `post()` returns at `:461`, the payment/allocation
writes live in `recordPayment` (`:679+`); +1 evidence ← the D5
persist-before-marking seam; the DR/CR account types ← the builder's
D-3/D-4 lookups (D4 owns WHICH expense account — asserted at type
grain only).

**Counting deviation (grounded, surfaced):** `journal_lines` and
`bill_lines` carry no `org_id`; asserted at NEW-ROW grain (exactly 2
on the new JE / exactly 1 on the new bill — the only writer on this
path) instead of org-scoped count deltas. The five org_id-bearing
tables use the org-scoped before/after delta (the D3 `jeCount`
precedent, race-shape shared with the standing suites).

**Close checks:** D7 suite 2/2; D3 (10) + D4 (8) + D5 (8) suites
26/26 green with `git diff` **empty** (byte-unchanged); typecheck
clean; `agent:validate` green end-to-end (the floor 26/26 + the D6
teeth: "1 gap(s); 1 scoped out; 0 ERROR(s)"). The test-only
STOP-and-surface fence was never tripped — every grounded expectation
held on first run (no source file touched; the diff is one new test
file + this close note).

**Carry-forward:** none new. D7 confirms the D3/D4/D5 composite
write-set as specified; the §3.3(b) auto-commit-zero negative stays
post-V1 (charter-excluded).
