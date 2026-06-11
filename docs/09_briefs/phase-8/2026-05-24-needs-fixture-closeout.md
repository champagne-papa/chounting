# Modal-e2e NEEDS-FIXTURE closeout (2026-05-24)

Carry-forward from the auto-commit-arc follow-ups closeout (`5eade62f`). Closes
the 2 `[NEEDS FIXTURE]` scenarios asymmetrically. Spec:
`2026-05-24-needs-fixture-closeout-spec.md`; plan:
`2026-05-24-needs-fixture-closeout-plan.md`.

## What was run

- **Synthetic fixtures generated** (zero-dependency PDF writer):
  `payment_no_cited_bill.pdf`, `born_paid_invoice.pdf`. xref/`/Length`
  validated byte-correct before any paid call.
- **Paid OCR capture** (Modal sidecar, label-filtered) of both fixtures →
  gitignored `corpus.partial.ts` → sanitized into `corpus.sanitized.ts` under a
  new `source:'synthetic'` tag. Both classify `payment_confirmation` via Tier A;
  classifier regression went 15→17 tests.
- **Scenario 1 (no-cited-bill payment): unskipped + paid Modal-e2e.** Intended
  to run exactly that scenario via `-t "attach_payment_evidence"`. In practice
  **2 paid Modal scenarios ran** — `attach_payment_evidence` is a proposal
  *type* shared across e2e files, and `pnpm test:integration` globs the whole
  `tests/integration` dir, so the substring filter also matched the
  `receipt.e2e` matched-payment scenario. Honest scoping miss (see "What we
  learned").
- **Scenario 2 (born-paid): body built as durable infra, left `it.skip
  [NEEDS-FIX]`, no paid run.**

## What happened

- **Scenario 1 — PASS.** `status='committed'`, `failure_class=null`,
  `proposal_id=null` — Branch 2 of `buildPaymentConfirmationProposal` (no cited
  bill + matched payment candidate → `attach_payment_evidence`
  ProposedAttachmentCard → non-ledger → `proposal_id=null`). The no-cited-bill
  `[NEEDS FIXTURE]` item is **closed**.
- **Receipt matched-payment scenario — PASS (incidental re-run).** Same outcome
  as the 2026-05-24 `27687de3` run against the same fixture — regression
  confirmation, not new information.
- **Born-paid — not run** (`[NEEDS-FIX]`, statically-proven failure).
- **Paid cost (actual):** ~$0.15–0.20 for the e2e run (2 Modal scenarios),
  combined with the capture (~$0.10) → **session Modal total ~$0.25–0.30**
  (above the ~$0.20 I surfaced, due to the scoping miss below; still well under
  a dollar).

## What we learned

- **Positive evidence — Branch 2 is not threshold-gated.** Two different
  classification entry points (receipt and payment_confirmation) both reached
  `buildPaymentConfirmationProposal` Branch 2 against low-confidence candidates
  and routed to `attach_payment_evidence`. Branch 2 fires on *any* non-null
  matched candidate, independent of confidence — consistent with the 0.25
  candidate that emitted in the 2026-05-24 run. This is why Scenario 1 had
  materially better odds than the previously re-skipped *bill*-candidate
  scenarios (whose blocker is candidate **emission**, a separate subsystem).
- **Scoping lesson for paid e2e runs.** `vitest -t` is a substring filter
  against test names across *all files in the run's glob*, not file-scoped. The
  positional path appended to `pnpm test:integration` (= `vitest run
  tests/integration`) is **OR'd** with the script's existing `tests/integration`
  glob, not AND'd — so it does not narrow the file set. A shared proposal-type
  substring (`attach_payment_evidence`) therefore matched scenarios in multiple
  e2e files. Future paid e2e isolation needs **belt-and-suspenders**: a
  fully-unique test-name substring **and** genuine path-narrowing (a config or
  invocation that restricts the file glob to the single target file), not a
  substring under `test:integration`.

## Disposition / carry-forwards

- **No-cited-bill payment scenario — CLOSED** (Scenario 1 PASS, stays unskipped).
- **Born-paid bundle — DEFERRED `[NEEDS-FIX]`**; fixture + body + corpus entry
  shipped as durable infra. **Born-paid bundle fix is the named next arc**
  (friction-journal 2026-05-24; likely a 1–2 commit arc — the
  `amount`/`payment_amount` field+type mismatch in `buildBornPaidBundle`, plus
  the question of whether the receipt + vendor_invoice schema gaps are filled or
  codified as intentionally-dead).
- **Bill-candidate matching investigation — still open** (the 2026-05-24
  finding; no new evidence this session).
- **Tier C extract robustness — still N=1** (Scenario 1 passes whether Tier C
  extracted cleanly or array-degraded — both yield `proposal_id=null` — and no
  trace was captured, so no N=2 evidence either way).
