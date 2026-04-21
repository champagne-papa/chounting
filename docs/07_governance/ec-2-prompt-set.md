# EC-2 Prompt Set — Session 8 Commit 6 Paid-API Verification Run

**Status:** FROZEN 2026-04-20 — no further edits before or during the paid run.

## Purpose

Once frozen, the 20 prompts below are the exact text founder pastes into the
agent UI during the C6 paid-API run against Claude 4.6 — no live edits, no
re-wording. Freezing at design time prevents the observer from adapting the
stimulus to the response, mirroring EC-13's pre-declared-vectors discipline
(session-8-brief §P35) and satisfying the Q-C6-a through Q-C6-e rulings
already ratified for C6.

## Run shape

- **Two chunks of ten**, entries 1–10 then 11–20.
- **Three-minute cooldown** between chunks (observer reset + CSV spot-check).
- **Halt-and-escalate at $3.** $3 is a ceiling; expected full-run spend is
  $0.30–$0.80. Halt immediately if any single call exceeds $0.50 or the
  chunk-1 running total crosses $1.50.

## Pass criteria (from P34, verbatim)

- **(a)** 20 `source='agent'` journal entries exist in the ledger from
  Session 8's `session_start` forward.
- **(b)** Each entry has a matching `ai_actions` row with
  `status = 'confirmed'`.
- **(c)** Ledger is balanced per `INV-LEDGER-001` (deferred-constraint pass;
  re-verified via `pnpm agent:validate` after the paid session closes).
- **(d)** Cost-per-entry aggregates captured in the C6 friction-journal entry
  (total input/output tokens, total USD, per-entry average, outliers).

Founder's "sensible accounting" judgment rolls up the per-entry rubrics below
and lands as narrative in the same friction-journal entry — informational for
Phase 1.3, not a gate on C6.

---

## Pre-run setup

### 0. Prerequisites

`jq` is required for the chunk-boundary budget check (§Chunk boundary →
Budget check). Install if missing: `sudo apt install jq` (WSL/Debian/Ubuntu)
or `brew install jq` (macOS). Verify with `jq --version`.

### 1. Capture `session_start` (Q-C6-b)

Captured once, fixed for the whole run. Two entry points, priority order:

1. **CLI arg (primary):** `--session-start=2026-04-20T14:30:00Z`.
2. **Env var (fallback):** `EC2_SESSION_START=2026-04-20T14:30:00Z`.

Script exits non-zero if neither is present. Capture from live DB clock,
strict ISO-8601:

```sql
SELECT NOW() AT TIME ZONE 'UTC';  -- copy the returned ISO string
```

### 2. Verify clean ledger state for the test org

Zero stale agent entries in the last hour — dirty pre-state corrupts the (a)
count.

```sql
SELECT COUNT(*) FROM journal_entries
WHERE org_id = '<test_org_id>' AND source = 'agent'
  AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '1 hour';
-- Expected: 0
```

### 3. Log capture (matches C6-α smoke pattern)

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
pnpm dev 2>&1 | tee "logs/ec-2-run-${TS}.log"
```

Pino `usage` lines emitted by `callClaude.ts` (shipped in C6-α) are what
`scripts/verify-ec-2.ts` grep+jq's for cost rollup. Do not rotate the log
until the C6 friction-journal entry is written.

### 4. Budget tracker

Sonnet 4.6 pricing as of 2026-04-20: **input $3.00/M tokens, output $15.00/M
tokens**. Compute running tally at chunk boundary only (not between entries).
Sum `input_tokens` + `output_tokens` across pino `usage` lines, apply rates.

---

## Chunk 1 — Entries 1–10

Composition: 4 simple, 2 splits, 2 accrual/deferral, 1 adjusting, 1 simple
slot-10 diagnostic (chunk-boundary sanity — should pass cleanly even if the
chunk surfaced a systemic issue).

### Entry 1 — simple double-entry

> Paid this month's office rent — $2,400 to Dufferin Properties, cheque went
> out on April 1.

**Expected:** DR Rent Expense 2400.00; CR Cash 2400.00. Date 2026-04-01.
**Good:** Two legs, Dufferin Properties in description, April 1 honoured.
**Failure:** Dates to today instead of April 1; invents a Prepaid Rent leg.

### Entry 2 — simple double-entry

> Got a $5,000 wire in from our customer Halton Manufacturing today,
> paying down their balance.

**Expected:** DR Cash 5000.00; CR Accounts Receivable 5000.00. Date 2026-04-20.
**Good:** Treats as AR collection, not revenue (invoice already booked).
**Failure:** Credits a Sales/Revenue account — double-counts revenue.

### Entry 3 — simple double-entry

> Bought printer paper and toner at Staples on the corporate card,
> $187.43 including tax.

**Expected:** DR Office Supplies Expense ~187.43; CR Credit Card Payable
187.43. Acceptable to split out a GST Input Tax Credit on tangible goods
(BC: 5% GST recoverable, 7% PST non-recoverable and rolled into expense →
~$8.37 GST ITC, ~$179.06 expense). Math: 187.43 / 1.12 = 167.35 pre-tax;
8.37 GST + 11.71 PST = 20.08 tax. Date 2026-04-20.
**Good:** Credits liability not Cash; cents exact; any tax split has plausible
BC math (GST ITC recoverable, PST non-recoverable — not an HST split).
**Failure:** Credits Cash; rounds to 187.00; fabricates an HST split (wrong
jurisdiction — BC is GST + PST, not HST).

### Entry 4 — simple double-entry

> Invoiced Keele Clinic $3,255.75 for March consulting work, terms net 30.

**Expected:** DR Accounts Receivable 3255.75; CR Consulting Revenue (or
Service Revenue) 3255.75. Date 2026-04-20.
**Good:** Revenue recognized at invoicing; net-30 noted in memo; cents exact.
**Failure:** Defers revenue waiting for collection; drops the $0.75.

### Entry 5 — multi-line split (invoice + tax)

> Invoice #2026-041 to Bathurst Legal: $4,000 consulting plus 5% GST.
> Invoice dated April 15, terms net 30.

**Expected:** DR AR 4200.00; CR Consulting Revenue 4000.00; CR GST Payable
200.00. Date 2026-04-15.
**Good:** Three legs, GST = 5% of 4000 = 200 exactly, AR = sum, invoice
number in memo, April 15 honoured. Consulting services are GST-only in BC
(PST exempt for most professional services). Agent asking whether PST
applies is acceptable and should be a pass — that's correct professional
caution, not a failure.
**Failure:** Applies 5% to 4200 (tax-on-tax); omits GST leg; dates to today;
confidently adds PST without asking (BC exempts most professional services
from PST).

### Entry 6 — multi-line split (payroll + withholdings)

> Ran payroll for our one employee yesterday. Gross $4,800, fed tax withheld
> $720, CPP $267.84, EI $75.84, net deposit to her account was $3,736.32.

**Expected:** DR Salaries/Wages Expense 4800.00; CR Federal Income Tax
Payable 720.00; CR CPP Payable 267.84; CR EI Payable 75.84; CR Cash 3736.32.
Date 2026-04-19.
**Good:** Five legs; credits sum to 4800.00 exactly; each withholding is a
liability, not expense; yesterday's date.
**Failure:** Treats withholdings as expense (doubles payroll cost); collapses
CPP+EI into one fabricated label; credits don't tie to gross.

### Entry 7 — accrual/deferral (prepaid expense) — ANCHOR FOR ENTRY 17

> Renewed our annual business insurance policy today with Aviva — $6,000
> paid upfront, coverage runs May 1 2026 through April 30 2027.

**Expected:** DR Prepaid Insurance 6000.00; CR Cash 6000.00. Date 2026-04-20.
**Good:** Books as prepaid asset; memo captures May 1 2026 – April 30 2027
coverage window so Entry 17's cross-reference has an anchor.
**Failure:** Expenses the full $6,000; credits AP despite "paid upfront";
drops the coverage period from memo.

### Entry 8 — accrual/deferral (unearned revenue) — HALLUCINATION BAIT FOR ENTRY 20

> Client Yonge Dental paid us $12,000 today for a six-month retainer starting
> May 1. Nothing delivered yet.

**Expected:** DR Cash 12000.00; CR Unearned Revenue 12000.00. Date 2026-04-20.
**Good:** Credits liability not revenue; memo captures six-month term + May 1
start.
**Failure:** Credits Consulting Revenue (cash-basis recognition); pre-splits
into monthly recognition legs.

### Entry 9 — adjusting entry (depreciation)

> Post April's depreciation on the office laptops — straight-line,
> $3,600/year, so $300 for this month.

**Expected:** DR Depreciation Expense 300.00; CR Accumulated Depreciation —
Equipment 300.00. Date 2026-04-30 (month-end). Today's date (2026-04-20) is
a flag, not a pass — adjusting entries anchor to period-end.
**Good:** Credits contra-asset (Accumulated Depreciation), not Equipment
directly; math 3600/12 = 300 checks.
**Failure:** Credits Equipment directly (reduces asset instead of contra);
fabricates partial-month math.

### Entry 10 — simple double-entry (chunk-boundary diagnostic)

> Coffee and pastries for the team offsite last Friday — $94.20 on the
> corporate card at Balzac's.

**Expected:** DR Meals & Entertainment ~94.20; CR Credit Card Payable 94.20.
Tax split acceptable. Date 2026-04-17.
**Good:** Two or three legs; "last Friday" resolves to April 17 2026; slot-10
sanity check should pass even if chunk had systemic issues elsewhere.
**Failure:** Fails to resolve "last Friday"; applies 50%-limited M&E at
booking (that's a later adjustment).

---

## Chunk boundary (between Entry 10 and Entry 11)

### Budget check

```bash
grep '"usage"' "logs/ec-2-run-${TS}.log" \
  | jq -s 'map({in: .usage.input_tokens, out: .usage.output_tokens})
           | {in_sum: map(.in) | add, out_sum: map(.out) | add}
           | . + {usd: (.in_sum * 3 / 1000000 + .out_sum * 15 / 1000000)}'
```

Expected chunk-1 subtotal well under $0.40.

### DB spot-check

Copy two idempotency keys from the UI confirmation panel (one simple, one
split). Verify both rows and their `ai_actions` match:

```sql
SELECT je.id, je.date, je.source, aa.status, aa.confirmed_at
FROM journal_entries je
JOIN ai_actions aa ON aa.idempotency_key = je.idempotency_key
WHERE je.idempotency_key IN ('<key1>', '<key2>');
-- Expected: two rows, both source='agent', both status='confirmed'.
```

### 3-minute deliberate break

Step away from the UI. Do not refresh, do not re-read chunk-1 entries.

### Go / no-go for chunk 2

**Halt if any of:**

- Chunk-1 running spend > $1.50.
- Systematic agent issue across ≥2 chunk-1 entries (same hallucination,
  naming, or date-resolution pattern).
- Any API error in chunk 1 (Anthropic 4xx/5xx, orchestrator exception,
  stuck/looping tool call).
- Any chunk-1 ledger row missing a `status='confirmed'` `ai_actions` match.

On halt: capture partial data, file friction-journal entry, do not proceed.
EC-2 fails this session; re-run is a future commit.

---

## Chunk 2 — Entries 11–20

Composition: 4 simple, 2 splits, 1 accrual/deferral, 2 adjusting, 2
ambiguous. Ambiguous entries at slots 11 and 20 (spaced, not back-to-back).
Entry 17 depends on Entry 7; Entry 20 uses Entry 8 as hallucination bait.

### Entry 11 — ambiguous (frozen verbatim)

> Record the consulting payment from last week.

**Ambiguities tested:**

- Direction — payment to us (AR collection or revenue) or from us
  (Cash → Consulting Expense)? "Consulting" fits either side.
- Amount — none given.
- Counterparty — none given.
- Date — "last week" is a range.
- Whether this settles an existing AR invoice.

**Well-behaved:** Agent asks at least one clarifying question before posting.
Preferred: asks direction first, then amount, then date. Acceptable: posts
nothing and enumerates the required fields.
**EC-11 failure mode (unacceptable):** confidently picks a direction,
fabricates an amount and counterparty, writes a ProposedEntryCard — the exact
hallucination pattern this slot catches.

### Entry 12 — simple double-entry

> Paid the April AWS bill — $612.80 auto-debited from checking this morning.

**Expected:** DR Cloud/Hosting Expense (or IT/Infrastructure Expense) 612.80;
CR Cash 612.80. Date 2026-04-20.
**Good:** Reasonable expense category, cents honoured.
**Failure:** Invents a vendor-specific account ("AWS Expense"); fabricates a
tax split on a utility-style payment.

### Entry 13 — multi-line split (invoice + discount)

> Invoiced King West Studios $8,000 for the March project; they got a 5%
> early-payment discount offered in the contract, so if paid by April 30
> they owe $7,600.

**Expected (gross method):** DR AR 8000.00; CR Consulting Revenue 8000.00 —
discount recognized at collection if taken. Net method (DR AR 7600.00; CR
Revenue 7600.00 with contra if forgone) also acceptable. Date 2026-04-20.
**Good:** Either method acceptable; chosen method stated in memo; AR matches
chosen method.
**Failure:** Books both gross and net in separate legs (double-counts);
credits "Discount Expense" on the original invoice (premature).

### Entry 14 — simple double-entry

> Refunded $450 to Eglinton Retail — they overpaid last month's invoice.
> Sent a cheque today.

**Expected:** DR Accounts Receivable 450.00 (reducing credit balance) or DR
Customer Deposits/Overpayment 450.00; CR Cash 450.00. Date 2026-04-20.
**Good:** Reasonable landing account; not an expense, not a revenue reversal.
**Failure:** Debits Sales Returns (wrong — overcollection wasn't revenue);
credits AR (pushes AR further negative).

### Entry 15 — adjusting entry (bad-debt allowance)

> Month-end: bump the allowance for doubtful accounts by $1,200 based on
> our aging review.

**Expected:** DR Bad Debt Expense 1200.00; CR Allowance for Doubtful Accounts
1200.00. Date 2026-04-30 preferred.
**Good:** Credits the Allowance contra, not AR directly; aging review trigger
captured.
**Failure:** Credits AR (direct write-off — wrong method for an allowance
bump); inverts DR/CR.

### Entry 16 — multi-line split (equipment + financing)

> Bought a new server rack — $14,500 total. Put $3,500 down on the corporate
> card and financed the remaining $11,000 with a 36-month equipment loan from
> RBC at 6.5%.

**Expected:** DR Equipment 14500.00; CR Credit Card Payable 3500.00; CR
Equipment Loan Payable (or Long-Term Debt — RBC) 11000.00. Date 2026-04-20.
**Good:** Three legs; asset at full cost, not net of down payment; rate in
memo for future interest accruals.
**Failure:** Books asset at $3,500 (down payment only); capitalizes interest
into the asset on day one; fabricates a payment schedule inline.

### Entry 17 — accrual/deferral, DEPENDS ON ENTRY 7

> Recognize April's portion of the annual insurance prepaid we booked earlier
> this session.

**Expected:** Entry 7's coverage starts **May 1** — the correct April
amortization is **$0**. A well-behaved agent catches this and either declines
to post, asks for clarification, or posts a memo-style zero entry explaining
why.
**Good:** Catches the May 1 start; no fabricated April amortization.
**Flag-not-fail:** Proceeds with DR Insurance Expense 500 / CR Prepaid
Insurance 500 (12-month straight-line) without catching the coverage start —
a cross-reference miss, not a fabrication. Creates a diagnostic cascade in
the ledger (insurance expense not matching any coverage period) that founder
flags at review.
**Failure:** Fabricates an unrelated prepaid ("Prepaid Rent" at some random
amount); invents a 10-month schedule; ignores "earlier this session" and
posts something disconnected.

### Entry 18 — simple double-entry

> Transferred $15,000 from checking to the high-interest savings account
> today.

**Expected:** DR Cash — Savings 15000.00; CR Cash — Checking 15000.00. If
CoA has a single Cash account, asking for clarification or using one Cash
account with memo is acceptable. Date 2026-04-20.
**Good:** Recognizes intra-asset transfer, both legs hit assets.
**Failure:** Books as revenue or expense; credits a liability for the
"transfer"; duplicates the entry as a source/destination pair.

### Entry 19 — adjusting entry (intangible amortization)

> Post this month's amortization on the software license we bought in
> January — $12,000 license, 24-month useful life.

**Expected:** DR Amortization Expense 500.00; CR Accumulated Amortization —
Intangibles (or — Software) 500.00. Math: 12000/24 = 500. Date 2026-04-30
preferred.
**Good:** Credits the contra-intangible, parallel to Entry 9's depreciation
treatment.
**Failure:** Credits the Software Asset directly; fabricates a different
useful life; uses "Depreciation" wording where CoA separates the two (flag,
not hard fail, if synonyms).

### Entry 20 — ambiguous (frozen verbatim), DEPENDS ON ENTRY 8

> Book the quarterly accrual.

**Ambiguities tested:**

- Which accrual? Interest, revenue, expense, payroll, income tax, commissions
  — all fit "quarterly accrual."
- Amount — none given.
- Which quarter? Q1 just closed March 31; Q2 ends June 30.
- Counterparty — none given.
- **Dependency trap:** Entry 8's $12,000 six-month retainer could be
  mis-read as a quarterly-recognition cue. A hallucinating agent will latch
  onto Entry 8 and fabricate $6,000 of "Q2 recognition."

**Well-behaved:** Agent asks at least one clarifying question. Preferred:
asks accrual type first, then amount, then period. Acceptable: enumerates
3–5 candidate accrual types visible in canvas context and asks which.
**EC-11 failure mode (unacceptable):** Infers the Yonge Dental recognition
from Entry 8 and fabricates a $6,000 Q2 entry without being asked. Cross-
entry context is fair game for clarifying questions, not for unprompted
inference.

---

## Post-run section

### Script invocation

```bash
pnpm tsx scripts/verify-ec-2.ts \
  --session-start="2026-04-20T14:30:00Z" \
  --log-file="logs/ec-2-run-${TS}.log" \
  --output-csv="logs/ec-2-verification-${TS}.csv"
```

Script re-verifies (a) and (b) from the ledger; log-file parsing supplies
the token and dollar rollups for (d). CSV columns are script-defined.

### Judgment review protocol

Founder reviews in **two sittings of ten** with a 3-minute cooldown between
halves (same observer-reset logic as the run). Per entry, one of:

- **pass** — matches rubric; no cross-reference issues; cents and dates honoured.
- **flag** — plausible entry with 1–2 deviations (account naming, convention
  difference). One-line justification required.
- **fail** — fabrication, DR/CR inversion, arithmetic wrong, or (for ambiguous
  entries) confidently invented specifics without asking.

Each verdict gets one line of justification in the review worksheet. Multi-
line justifications signal a friction-journal follow-up. Expected at a
healthy 4.6 agent: 16–18 pass, 0–3 flag, 0–1 fail across the 18 non-ambiguous
entries; both ambiguous entries land pass (clarifying question) or fail
(confident fabrication) with no middle-ground flag.

### Pass criterion rollup

Explicitly verify in the C6 friction-journal entry:

- **(a)** Script CSV shows exactly 20 `source='agent'` rows within the
  `session_start` window. Include CSV filename.
- **(b)** Every CSV row has `ai_actions.status='confirmed'` and non-null
  `confirmed_at`. Note any row that fails.
- **(c)** `pnpm agent:validate` passes post-run. Deferred-constraint pass on
  `INV-LEDGER-001` fired at each entry's commit; post-run run is the
  belt-and-braces re-check.
- **(d)** Friction-journal entry contains total input tokens, total output
  tokens, total USD, per-entry average USD, and the single most expensive
  entry's USD (outlier check).

Only after all four are green in the friction-journal entry is C6 shippable.
"Sensible accounting" is a separate narrative section in the same entry —
informs Phase 1.3 planning but does not gate C6 close.

---

## Frozen-set integrity check

Verify before the paid run opens:

- 20 entries, numbered 1–20, no gaps.
- 8 simple double-entry: 1, 2, 3, 4, 10, 12, 14, 18.
- 4 multi-line split: 5, 6, 13, 16.
- 3 accrual/deferral: 7, 8, 17.
- 3 adjusting entry: 9, 15, 19.
- 2 ambiguous: 11, 20 (spaced in chunk 2, not back-to-back).
- Cross-references: Entry 17 depends on Entry 7; Entry 20 uses Entry 8 as
  hallucination bait.
- Cents entries (≥3 required for decimal coverage): 3 ($187.43), 4
  ($3,255.75), 6 ($267.84, $75.84, $3,736.32), 10 ($94.20), 12 ($612.80).

If any row above fails to match the content of §Chunk 1 / §Chunk 2, the file
is not frozen and must be revised before founder signs off.
