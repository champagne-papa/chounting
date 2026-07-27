# classifyFailure — permanent-failure terminalization

**Status:** v4 — brainstorm RESOLVED, self-review applied, **§6 diagnostic RUN
and RESOLVED BENIGN 2026-07-27**. No migration authored, no deploy. The sole
remaining deploy gate is the §5 three-CHECK migration bundle.

**Implementation order is not the section order.** §2.4.1 is a hard
prerequisite: the wrapper-rethrow fix ships first, alone, with its own test.
Every enumeration mapping in §2 is unobservable until it lands.
**Date:** 2026-07-26
**Grounded at:** `e280baf1` (main, clean tree)
**Scope:** the `classifyFailure` mislabeling finding — permanent failures
labelled retryable, re-run hourly by the stranded-case sweep, never surfaced
to a human.

**Conditional scope — RESOLVED 2026-07-27 to ONE-PART.** §6's diagnostic was
scope-determining, not confirmatory. It has now run: query 1 returned 9 rows,
query 2 empty, and the two **agree** — the 9 are the by-design content-duplicate
floor, not stranded cases (§6). This design is therefore **one-part**:
forward-prevention only. §9's backfill half does **not** activate, and must
explicitly **exclude** that population (§9.3).

---

## 1. Grounding ledger

Every claim read from disk at `e280baf1`. Line numbers verified, not carried
from the brief.

### 1.1 The twins — CONFIRMED

`classifyFailure` (`ingestDocument.ts:1557-1564`) and `classifyError`
(`failureClassification.ts:113-121`) are byte-identical modulo the function
name and one comment line. Verified by normalising the identifier and diffing:
no output.

Both recognise exactly three `ServiceError` codes:

| code | class |
|---|---|
| `PIPELINE_UNAVAILABLE` | `unavailable` |
| `PIPELINE_TRANSIENT_EXHAUSTED` | `transient_exhausted` |
| `NOT_FOUND` | `permanent_malformed` |
| *everything else* | `transient_exhausted` |

### 1.2 The exits — CORRECTED: 18, not 19

`grep -c "status: 'pipeline_failed'"` → **18**; `grep -c "classifyFailure(err)"`
→ **18**. The brief said 19; an earlier count in this session also said 19.
Both included the comment mention at `ingestDocument.ts:693`. 18 matched pairs
is correct.

None calls `enqueueException`. The 5 `enqueueException` sites (`:274`, `:362`,
`:518`, `:604`, `:715`) are all on successful-classification routing paths.

**Five of the 18 exits (`:293`, `:372`, `:531`, `:617`, `:728`) are the catch
blocks for `enqueueException` itself throwing.** A failed escalation is
classified `transient_exhausted` and re-enters the loop. The code already
proves the migration-ordering gate is a must, not a should — and it forces the
§4.5 decision.

### 1.3 The loop — CONFIRMED

`sweepStrandedCases.ts:347-354` buckets `pipeline_failed` into B4 and records
`failure_class` at `:352`. It **never branches on it**. Bucket comment
(`:133-134`): *"re-run returned pipeline_failed; re-eligible next run."*

Cron: `apps/web/vercel.json` → `0 * * * *`; route passes `execute: true`,
`staleness_minutes: 30`, `max_b3_reruns: 10` (`route.ts:61-65`).

### 1.4 Re-eligibility is governed by case state ALONE — CONFIRMED

`strandedCaseReadService.findEligibleStrandedCases:48-73` queries
`document_cases` by `.in('state', ...)` and `.lt('created_at', cutoffIso)`. It
**never reads `document_jobs.state`.**

Writing `document_job_state = 'failed_permanent'` does not remove a case from
eligibility. The loop-breaker is the **case-state transition**; the job-state
write is a job-level record only.

### 1.5 Dead substrate — CONFIRMED unwritten

`failed_retry` / `failed_permanent` appear only in
`20240152000000_ingestion_substrate.sql:109-110` and generated `db/types.ts`.
Zero writes in `apps/web/src`.

`provider_unavailable` is in the `exception_reason` enum (added `20240180` as
an explicit not-active forward hook) and **absent from the live CHECK**.
`20240191` is the highest migration in the tree and the latest CHECK-defining
one; it admits 12 values. The Zod mirror `ExceptionReasonSchema`
(`exceptionQueueEntry.schema.ts:86-124`) carries the same 12. Next CHECK name:
`exception_reason_chunk_13_active`.

---

## 2. Fork A — the four-class union

```ts
export type PipelineFailureClass =
  | 'transient_exhausted'
  | 'unavailable'
  | 'permanent_malformed'
  | 'unknown';
```

The label earns its keep only because §4 terminalizes on it. The two
byte-identical classifiers collapse into one exported function in
`failureClassification.ts`, imported by `ingestDocument.ts` — two private
twins that must stay in sync is a latent divergence bug, and this arc is when
to kill it.

### 2.1 AGENT_UNAVAILABLE is overloaded — do NOT flat-map it

The check you asked for, run before hard-mapping. **Your hypothesis is
correct, and my v1 mapping was wrong for the same reason a flat
`→ permanent` would have been.** Six throw sites, three different cause
classes:

| site | condition | true cause |
|---|---|---|
| `callClaude.ts:159` | 401 / 403, no retry | **permanent** (revoked/wrong key) |
| `orchestrator/index.ts:153` | API key not configured | **permanent** (config) |
| `callClaude.ts:173` | 429 after 3 attempts | **transient**, retried & exhausted |
| `callClaude.ts:195` | 5xx after 2 attempts | **transient**, retried & exhausted |
| `callClaude.ts:219` | connection after 2 attempts | **transient**, retried & exhausted |
| `callClaude.ts:237` | "anything else" | **mixed** — BadRequest/NotFound/Conflict/Unprocessable (permanent) lumped with genuine non-`APIError` surprises |

Mapping the code flatly to `permanent` would relabel three genuinely-transient
exhaustion paths — recreating the mislabel in the opposite direction. Mapping
it flatly to `unavailable` (my v1 draft) escalates those same three
immediately, which is over-escalation, since `unavailable` is already a
no-retry/escalate-now class per `failureClassification.ts:9-12`.

**Fix at the throw site**, per your instruction — inspect status before the
code is assigned:

| new code | sites | pipeline class |
|---|---|---|
| `AGENT_AUTH_FAILED` | 401/403 + key-not-configured | `unavailable` |
| `AGENT_UNAVAILABLE` (retained) | 429 / 5xx / conn exhaustion | `transient_exhausted` |
| `AGENT_REQUEST_INVALID` | `APIError` with 4xx status | `permanent_malformed` |
| `AGENT_UNEXPECTED` | non-`APIError` residue | `unknown` |

Blast radius is small — verified: outside `callClaude.ts`, the only consumers
of `AGENT_UNAVAILABLE` are the union in `ServiceError.ts:71` and the status map
in `serviceErrorToStatus.ts:41` (→ 503). No code branches on the value. The
three new codes need union entries and status cases; `AGENT_AUTH_FAILED` → 503,
`AGENT_REQUEST_INVALID` → 502, `AGENT_UNEXPECTED` → 502.

### 2.1.1 The principle — split at the throw site

This generalises beyond `AGENT_UNAVAILABLE` and governs the whole enumeration
effort:

> **The throw site is the last place the distinction exists.** By the time an
> error reaches `classifyFailure`, 401-vs-429-vs-5xx has already collapsed into
> a single code. `classifyFailure` can only ever be as precise as the codes
> handed to it — so where the throw site knows more than the code carries,
> split there. Enumerating harder inside the classifier cannot recover
> information that was destroyed upstream.

`AGENT_UNEXPECTED → unknown` is the honest floor of the principle: the residue
that genuinely cannot be named routes to the class built to make ignorance
queryable. A four-class union whose fourth class quietly absorbs *nameable*
causes is the original bug with more steps.

### 2.2 Additional enumeration

| code | class |
|---|---|
| `AGENT_TOOL_VALIDATION_FAILED` | `permanent_malformed` |
| `INVALID_TRANSITION` | `permanent_malformed` |
| `ORG_ACCESS_DENIED` | `permanent_malformed` |

### 2.3 Retry budget — GATING VERIFICATION PASSED

**The thrift argument holds cleanly; no compounding.**

*Modal OCR.* `ingestDocument.ts:171-183` wraps `runOCR`, which calls
`invokeSidecar` (`extraction/sidecar/client.ts:39-148`) — a **single `fetch`**
with a 60s `AbortController` and **no internal retry**, verified across the
whole file. The wrapper's `MAX_ATTEMPTS = 3` is the only retry and it is real
Modal spend. Dropping to 0 recovers 3×.

*Claude.* Tier C never propagates a throw into the wrapper.
`aiFallbackExtractorBase.ts:150-175` catches a `callClaude` failure, emits a
`pipeline_unavailable` audit event, and returns
`{valid: false, reason: 'invocation_failed'}` — a graceful degrade. Stage 3
classify (`ingestDocument.ts:322-330`) is not wrapped at all; its comment
(`:318-320`) states Tier C defers to `callClaude`'s internal retry by design.

So `callClaude`'s internal budgets (429→3, 5xx→2, conn→2;
`callClaude.ts:135-137`) never multiply against the wrapper's 3. They are
per-error-class, short, correctly placed. **They stay.**

**Decision:** one attempt, no retry, at `withFailureClassification` only.

**Correction found in self-review — it is `MAX_ATTEMPTS = 1`, not `0`.** The
constant counts *attempts*, not retries, and the loop is
`for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)`
(`failureClassification.ts:42`). At `0` the body never executes: the stage
function is never called, control falls through to `throw lastError`
(`:110`) — and `lastError` is still `null` (`:40`). Every wrapped stage would
throw `null` instead of running. "Zero retries" is `MAX_ATTEMPTS = 1`.

### 2.4 BLOCKER — the wrapper destroys the code before `classifyFailure` sees it

Found in self-review, and it invalidates §2.1/§2.2 as written unless fixed
first.

On the exhausted path, `withFailureClassification` does **not** rethrow the
original error. It throws a fresh one (`failureClassification.ts:102-105`):

```ts
throw new ServiceError(
  'PIPELINE_TRANSIENT_EXHAUSTED',
  `[${stage_name}] transient retry budget exhausted: ${extractErrorMessage(err)}`,
);
```

The original `ServiceError.code` is discarded; only its message survives, as
text inside a string. So for every wrapped stage, an unrecognised error reaches
the `ingestDocument` catch block already collapsed into
`PIPELINE_TRANSIENT_EXHAUSTED` — and `classifyFailure` maps that to
`transient_exhausted` *by explicit rule*, not by default.

Consequences:

- **Enumerating new codes in `classifyFailure` is inert for the 7 wrapped
  stages** (`:112`, `:145`, `:171`, `:396`, `:428`, `:759`, `:895`).
  `AGENT_AUTH_FAILED` would never arrive there.
- The collapse hits **precisely** the errors that fall through the default —
  the `unavailable` and `permanent_malformed` branches rethrow the original
  (`:60`, `:73`); only the transient/default path replaces it.
- Stage 3 classify is unwrapped, so the enumeration works there. That
  asymmetry would have made this look like it worked in some tests.

This is §2.1.1's principle applying to our own wrapper: information destroyed
upstream cannot be recovered downstream.

**Required fix:** the exhausted path must preserve the original error — rethrow
it directly. That makes the wrapper honest: it tried, it gave up, the error is
still what it was.

`PIPELINE_TRANSIENT_EXHAUSTED` currently has two producers — this wrapper and
`invokeSidecar:92-95` — and only the latter is a genuine statement about the
cause.

#### 2.4.1 HARD EDGE — this is a prerequisite, not an adjacent cleanup

**No enumeration mapping is testable until the wrapper preserves the code it
classifies.** The `AGENT_*` split (§2.1), the four-class union (§2), and every
rule keying off `.code` are unobservable behind the collapse for all seven
wrapped stages. Sequence the wrapper fix **first**, as its own change with its
own test, ahead of any enumeration work.

The test that becomes possible only after the fix — and that could not have
been written before this was found:

```
GIVEN a WRAPPED stage that throws AGENT_AUTH_FAILED
WHEN ingestDocument runs
THEN failure_class === 'unavailable'
```

Today that case silently arrives as `transient_exhausted`. This test is what
proves the fix fired.

#### 2.4.2 Audit-event verification — grounded against the bytes

Checked rather than assumed, per the review instruction. The `emitAuditEvent`
call at `:93-101` executes **before** the throw and its payload is
`{ retry_attempts: MAX_ATTEMPTS }` — a constant. **It never reads `err`.**
Changing what is thrown therefore cannot change the audit event's content.
"Nothing observable is lost" is confirmed.

**Second finding, same class, found by that check.** The exhausted branch is
the only one of the three carrying *no error identity at all*:

| branch | audit payload |
|---|---|
| `unavailable` (`:55-58`) | `error_code`, `error_message` |
| `permanent_malformed` (`:69-71`) | `failure_reason` |
| exhausted (`:98-100`) | `retry_attempts` **only** |

So on the default-fallthrough path *both* consumers of the error destroy it —
the throw replaces the code, and the audit never recorded it. This is §2.4's
collapse in the observability channel, and it is a substantial part of why the
bug stayed invisible: there is no audit row anywhere that says what actually
failed.

**Fold into the same change:** add `error_code` + `error_message` to the
exhausted payload, matching the `unavailable` branch.

**Also:** at `MAX_ATTEMPTS = 1`, `retry_attempts: MAX_ATTEMPTS` reports `1` when
zero retries occurred. Rename the key to `attempts`, or emit `MAX_ATTEMPTS - 1`.
A field whose name misstates its number is the same sin one layer down.

---

## 3. Fork B — the sweep is the backoff; counter substrate ALREADY EXISTS

**Read completed: `20240152000000_ingestion_substrate.sql`.**

`document_jobs` already carries six Phase-7-reserved columns provisioned for
exactly this work (`:356-362`):

```sql
attempt_count       int          NOT NULL DEFAULT 0,
started_at          timestamptz,
completed_at        timestamptz,
last_error_code     text,
last_error_message  text,
pipeline_trace_id   uuid,
```

`attempt_count` has **no v1-active CHECK**, and the substrate comment
(`:333-341`) says so deliberately: *"attempt_count ships as NOT NULL DEFAULT 0
with NO v1-active CHECK constraint… Phase 7 orchestrator activates by writing
non-zero values… DO NOT reflexively add a CHECK constraint."* The
column-immutability trigger lists `state, attempt_count, started_at,
completed_at` as mutable (`:400`).

**Resolution: B-i. Zero new substrate for the counter.** `attempt_count` is the
counter; `last_error_code` / `last_error_message` are free, purpose-built
real estate for the classification and message. This is the anticipatory
schema being activated exactly as designed — no migration for any of it.

### 3.1 The job-state CHECK broaden — Migration C, TAKEN

`CONSTRAINT document_jobs_state_v1_active CHECK (state = 'queued')` (`:365-367`)
pins `document_jobs.state` to `'queued'` only. Writing `failed_permanent`
requires broadening it.

§1.4 proves the job-state write is not the loop-breaker, which made this look
like a taste call. It is not. Two findings in this doc converge on it:

1. `last_error_code` / `last_error_message` without a matching job state is a
   half-written record.
2. §4.5's last-resort path emits a distinct `escalation_failed` audit action at
   `log.error`. **That action needs something durable to correspond to.**

If the job state cannot move off `queued`, the only trace that escalation was
attempted-and-failed is a log line — and *"the failure exists only in logs"* is
the precise property this entire arc exists to kill. Dropping Migration C to
narrow the arc would reintroduce the bug one layer down, in the very path
designed to catch it.

**Taken.** It rides the same gate as the `exception_reason` broaden — see §5.

### 3.2 The load-bearing tests

The assertion that matters is **absence from the next eligibility result**, not
the presence of a label. Two cases, and the first is the one to write first —
it is the assertion that would have caught the original bug.

**Test 1 — `permanent_malformed` leaves eligibility on the FIRST pass.**

```
GIVEN a case at 'received' whose ingest fails with a permanent_malformed error
WHEN the sweep runs ONCE
THEN findEligibleStrandedCases does not return that case on pass 2
 AND the case state is needs_review
 AND an open exception_queue_entries row exists
     (with the reason §7's open question settles on)
```

This is the direct regression test for record-but-never-branch. A sweep that
records `failure_class` at `:352` and re-buckets the case passes every
label-shaped assertion and fails this one.

**Test 2 — `unknown` leaves eligibility after its ceiling, not before.**

```
GIVEN a case at 'received' whose ingest fails with an unrecognised error
WHEN the sweep runs 3 times
THEN findEligibleStrandedCases STILL returns it on passes 2 and 3
 AND after pass 3 it is absent
 AND the case state is needs_review
```

The still-returns half matters as much as the absent half: it proves the
ceiling is a ceiling and not an immediate escalation wearing one.

Asserting `failure_class === 'unknown'` or `job.state === 'failed_permanent'`
is the green that only proves the happy path. Neither test above asserts on a
label as its terminal condition.

---

## 4. Fork C — C-1, terminal exit via the human queue

**Decided: C-1.** C-2 is disqualified — advancing a byte-fetch failure through
`extracting`→`classified` writes "OCR happened" into a state log that is
evidence in an accounting product. C-3 is deferred to its own ADR, uncoupled
from an urgent fix.

### 4.1 The premise, confirmed

`enqueue_exception_with_audit`
(`20240148000000_exception_queue_substrate.sql:345-436`) INSERTs the queue row,
then atomically transitions `classified|matched → needs_review`, raising
`check_violation` otherwise. A case at `received` is rejected.

### 4.2 Why the matrix must change

`documentCaseService.ts:36-47` — `LEGAL_TRANSITIONS`:

```
received:   ['extracting']            ← only edge out
extracting: ['classified']            ← only edge out
classified: ['matched', 'needs_review']
```

`AUTOMATION_ADVANCE_EDGES` (`:273-279`) deliberately has no `classified` source
edge — Subsystem 2 owns that segment (`:268-272`). **No legal path exists from
`received` to any state outside the sweep's eligibility set.**

### 4.3 The requirement that makes C-1 break the loop

The sibling RPC's job is the **case-state transition**, not the
`failed_permanent` write. Both halves must hold, and one without the other is a
silent dead-end:

- **Out of the filter.** Target `needs_review` ∉
  `{received, extracting, classified, matched}` — the `ELIGIBLE_STATES` list at
  `sweepStrandedCases.ts:76-81`. ✔
- **On the human surface.** `needs_review` is the INV-WORKFLOW-002 terminal
  hand-off and the state the exception queue reads. An open
  `exception_queue_entries` row with `exception_reason = 'provider_unavailable'`
  is what a human actually sees. ✔

`document_jobs.failed_permanent` + `last_error_code` is the job-level record.
It is neither the loop-breaker nor the human surface, and the design must not
lean on it for either.

**Deliverable shape:**

- ADR-0011 §3 amendment adding automation-only edges
  `received → needs_review`, `extracting → needs_review`. **Authored and
  ratified before any code** (CLAUDE.md: *"The ADR comes before the code"*).
- `enqueue_terminal_failure_with_audit` — sibling RPC accepting
  `received|extracting|classified|matched` as source, same INSERT-then-UPDATE
  ordering so the partial-UNIQUE on open exceptions still yields
  `EXCEPTION_ALREADY_OPEN` rather than `check_violation`.
- `LEGAL_TRANSITIONS` + `AUTOMATION_ONLY_TRANSITIONS` + `PIPELINE_ORDER`
  updates in `documentCaseService.ts`.

### 4.4 Per-class ceilings — and B4 must branch

A single N conflates two populations. The ceiling lives in the sweep, because
the pipeline exit cannot transition the case out of `received`. **This means
`sweepStrandedCases.ts:347` must start branching on `failure_class`, not just
recording it at `:352` — record-but-never-branch is the shape of the whole
bug.**

| class | ceiling | rationale |
|---|---|---|
| `permanent_malformed` | **escalate on first sweep** | no value in re-running a corrupt PDF hourly; one sweep is already the floor |
| `unavailable` | **escalate on first sweep** | see §4.4.1 — corrected in self-review |
| `transient_exhausted` | 10 | see §4.4.2 — this is a NEW ceiling, not a retained one |
| `unknown` | **3** | the population that may be transient-but-unnamed; ~3h benefit-of-the-doubt, then escalate |

N=3 survives as the `unknown` ceiling only. Counter: `document_jobs.attempt_count`.

#### 4.4.1 `unavailable` cannot be 10 — two contradictions

The v2 table gave `unavailable` a ceiling of 10. That is wrong twice over.

1. **It contradicts the class's own definition.**
   `failureClassification.ts:9-10` defines `unavailable` as *"no retry;
   immediate route to exception queue."* A 10-pass sweep ceiling is ten more
   retries.
2. **It contradicts the revoked-key decision.** §2.1 maps
   `AGENT_AUTH_FAILED → unavailable`. With a ceiling of 10, a revoked Anthropic
   key — the canonical recognisable-permanent failure — would wait ten hourly
   passes before a human saw it. That is the original bug, slower.

Corrected to first-sweep escalation. `unavailable` and `permanent_malformed`
are both terminal classes; they differ in audit event and reason, not in
patience.

#### 4.4.2 The "existing 10" does not exist

`max_b3_reruns: 10` (`route.ts:49`) is a **per-run cap on B3 re-runs across all
cases in one sweep** — a spend ceiling, not a per-case attempt limit. There is
no per-case ceiling today; a case can be re-swept unboundedly, which is the bug.

So "keep the existing 10" describes something that was never there.

**Every ceiling in the §4.4 table is new behaviour — permanent at 1, unknown at
3, transient at 10 — because the thing they replace never existed.** Nobody
downstream should read "keep" and build nothing.

Required test, or the transient path keeps looping against the wrong counter:

```
GIVEN one case failing with transient_exhausted on every pass
WHEN the sweep runs 11 times
THEN it is still eligible on passes 2..10
 AND absent on pass 11
```

### 4.5 When the escalation RPC itself throws — taking (i)

The new RPC inherits the 5-catch problem from §1.2: if it throws, that failure
has nowhere higher to escalate.

**Taking (i): bounded re-sweep with alarmed logging on that specific path.**

Consistent with the C-3 deferral logic — (ii)'s `escalation_failed` case state
is the same new-case-state substrate cost you just declined to couple to an
urgent fix, and taking it here would reintroduce that coupling through the back
door. The §5 migration gate removes the CHECK-violation cause, which is the
only *predictable* way this path fires; what remains is a genuine DB blip,
which is what bounded re-sweep is for.

Concretely: escalation failure increments `attempt_count`, writes
`last_error_code`, and emits a distinct `escalation_failed` audit action at
`log.error` with the case id. Bound at 3; past that the case stops being
re-attempted and the alarm is the surface.

**(ii) is the named follow-up** if §6's diagnostic shows this path is live, or
if the alarm fires in practice. Recorded here so it is a decision, not a
forgotten edge.

---

## 5. Migration ordering — HARD SEQUENCING

The self-armouring failure mode is real: escalation-writing code deployed
before the CHECK admits `provider_unavailable` → INSERT raises
`check_violation` → `ServiceError` → `classifyFailure` → `transient_exhausted`
→ the loop being killed. Ordered, never concurrent:

1. **ADR-0011 §3 amendment** ratified (no code).
2. **The CHECK-broaden bundle — THREE broadens, one migration, one gate, one
   confirmation.** The count is stated explicitly so the migration author does
   not ship two and leave the third:
   1. `exception_reason` admitting **`provider_unavailable`**
      (`ALTER TYPE ADD VALUE` already done at `20240180`).
   2. `exception_reason` admitting **`pipeline_permanent_failure`** (§7 (β)) —
      needs its own `ALTER TYPE ADD VALUE`, which per the `20240160/20240161`
      precedent cannot sit in the same transaction as the CHECK naming it.
   3. `document_jobs_state_v1_active` admitting **`failed_permanent`**.

   Both `exception_reason` values land in one
   `exception_reason_chunk_13_active` CHECK. **There must be no window in which
   any one of the three admits a value its siblings do not** — every half-state
   produces a write that throws, gets classified, and re-enters the loop this
   arc kills.
3. **RPC migration** — `enqueue_terminal_failure_with_audit`. After the bundle
   by convention, though `CREATE FUNCTION` validates nothing at author time;
   what matters is that both precede step 6.
4. **Confirm applied against the live database** — queried, not inferred from
   the migration list. One confirmation covering the whole bundle. Evidence
   pasted into the arc record.
5. **Zod broaden** — `ExceptionReasonSchema` += every value the bundle admitted
   (Layer-1 CHECK broaden ⇒ Zod broaden, codified checklist item).
6. **Only then** deploy code that writes any of it.

Step numbering is the ordering contract; the labels "Migration A/B/C" from
earlier drafts are retired to avoid implying three separable applies.

---

## 6. Diagnostic — RUN 2026-07-27, RESOLVED BENIGN

> **RESULT — no longer a deploy gate.**
> **Ran:** 2026-07-27 against prod.
> **Outcome:** query 1 non-empty (9 rows), query 2 empty — **and the two
> agree.** The 9 `received`-state cases are the by-design content-duplicate
> floor, **not** a stranded population.
> **Consequence:** §5 step 6 is no longer blocked by this. The sole remaining
> deploy gate is the §5 three-CHECK migration bundle.
> **§9:** does **not** activate. The backfill must **exclude** this population
> (§9.3).

The 9 cases (org `f0fa6501…`, created 2026-06-11/12) are `B3-D` content
duplicates — the `.eml` / Outlook-signature-image class. **No stranding, no
loop, no spend, no customer impact:** their originals were already processed,
so no outreach is warranted.

**Confirmed four ways.**

1. **Code.** `sweepOneCase` short-circuits at the `dedup_carveout` exit
   *before* `runIngest`, so these cases are swept hourly but never re-ingested
   and never emit `pipeline_*` audit events.
2. **prod-readiness §5 caveat** (2026-06-14,
   `docs/05_operations/prod-readiness-checklist.md:111-119`) — documents this
   exact floor, its mechanism, and the dup class.
3. **Live `SweepReport` telemetry, 2026-07-27** — 9 consecutive hourly prod
   fires reading `B3-D: 9 / B4: 0 / b3_reruns_executed: 0`, `env=production`.
4. **Query 2's emptiness is correct, not an instrument miss.** The four action
   names and the target table (`audit_log`) were verified against the code to
   match the query, so with no B4 and no re-runs there are no `pipeline_*`
   events that *could* exist.

**Invariant caveat.** The floor's *existence* is by design; the **number 9 is
an empirical reading** (measured 2026-06-14, re-confirmed 2026-07-27). Do not
treat 9 as a designed constant — the health signal is new `received` cases
accumulating *above* the floor.

Full resolution record: `1d8ad6e1` on `docs/classify-failure-arc-closeout`
(`CURRENT_STATE.md`, CF-1).

The queries below are retained verbatim as the reproducible instrument.

```sql
-- Are any cases already looping?
SELECT id, org_id, state, created_at, now() - created_at AS age
FROM document_cases
WHERE state IN ('received','extracting','classified','matched')
  AND created_at < now() - interval '30 minutes'
ORDER BY created_at ASC;
```

```sql
-- Repeat-failure signature: same document, many hourly pipeline audit events
SELECT entity_id, count(*) AS events,
       min(created_at) AS first_seen, max(created_at) AS last_seen
FROM audit_log
WHERE action IN ('pipeline_transient_exhausted','pipeline_unavailable',
                 'extraction_failed','pipeline_transient_retry')
  AND created_at > now() - interval '14 days'
GROUP BY entity_id
HAVING count(*) > 3
ORDER BY events DESC;
```

Vercel: filter `/api/cron/sweep-stranded-cases` for the `counts` object across
successive hourly fires. A B4 count that is non-zero and **stable** across
fires is the loop signature; a one-time spike is not.

---

## 7. Open items

The three forks are resolved. The self-review then opened one new design
question (below) and found three defects, corrected in place: §2.3
(`MAX_ATTEMPTS = 1`, not `0`), §2.4 (the wrapper destroys the error code —
**ship-blocking**, ordered before the enumeration), §4.4.1/§4.4.2 (the
`unavailable` ceiling and the phantom "existing 10").

Resolved across rounds — Fork A: 4-class union, split-at-throw-site
enumeration (§2.1.1), `unknown` as the named floor. Fork B: `attempt_count`
substrate confirmed already present, per-class ceilings, 3 for `unknown` only,
sweep must **branch** not record. Fork C: C-1 sibling RPC, case-state
transition as the real loop-breaker, bounded re-sweep for escalation-failure
with `escalation_failed` (option ii) named as follow-up. Migration C: in,
bundled under one gate.

**Opened by the self-review, RESOLVED: (β).**

§3.2 and §4.3 originally wrote `exception_reason = 'provider_unavailable'` for
every terminal failure. A corrupt PDF is not a provider failure, and the two
labels drive the two different actions a human takes: *"the pipeline is broken,
call the operator"* versus *"this document is bad, reject it."* Merging them at
the only layer a human reads is the §2.1.1 collapse again, at the surface.

(α) — one reason with the class in `last_error_code` — is (β) minus the part
that makes it work: the queue UI does not surface `last_error_code`.

**Resolved: add `pipeline_permanent_failure` alongside `provider_unavailable`.**
Both join the §5 bundle under the one gate.

The terminal split is decided **at the throw site**, carried forward — not
reconstructed at the terminal from a code that has already lost the
distinction. Third application of §2.1.1:

| cause | class | `exception_reason` |
|---|---|---|
| `AGENT_AUTH_FAILED`, key-not-configured | `unavailable` | `provider_unavailable` |
| `AGENT_REQUEST_INVALID`, malformed input, corrupt PDF | `permanent_malformed` | `pipeline_permanent_failure` |

**Closed 2026-07-27 — the diagnostic ran:**

**§6's diagnostic is RUN and RESOLVED BENIGN.** Query 1 returned 9 rows, query
2 empty, and the two agree: the 9 are the by-design `B3-D` content-duplicate
floor, not a stranded population. Confirmed four ways (code, prod-readiness §5
caveat, live `SweepReport` telemetry `B3-D: 9 / B4: 0 / b3_reruns_executed: 0`
`env=production`, and query 2's verified-correct emptiness). See §6.

Consequence: this arc **is one-part**. §9 does not activate; its backfill must
**exclude** this population (§9.3). The diagnostic no longer gates the deploy —
the sole remaining gate is the §5 three-CHECK migration bundle.

> **CARRY-FORWARD 1 — stranded-case diagnostic. RESOLVED 2026-07-27 (benign).**
> **Was:** Owner UNASSIGNED; blocked on prod database + Vercel log access.
> **Outcome:** ran against prod; 9 `received` cases are the by-design duplicate
> floor. No stranding, no loop, no spend, no customer impact.
> **Blocks:** nothing. §5 step 6 is cleared of this gate.
> **Record:** `1d8ad6e1` on `docs/classify-failure-arc-closeout`.

### 7.1 CARRY-FORWARD 2 — `delivery-model.md` describes a dead branch

Surfaced while resolving this arc's PR base. **Recorded, deliberately not
fixed** — amending a governance doc under cover of a classify-failure PR is the
scope breach `ratified-contract-scope` exists to prevent.

`docs/04_engineering/delivery-model.md:193` states *"Feature branch → staging:
PR-driven,"* with `staging` as integration trunk and `main` released from it.
Measured against the remote on 2026-07-27:

| | |
|---|---|
| `staging` last commit | 2026-06-14 (six weeks stale) |
| `main` ahead of `staging` | 60 commits |
| `staging` ahead of `main` | 0 |

`staging` is fully contained in `main` and has not been an integration trunk
since mid-June. Every arc since — board-4, Fork C, the housekeeping, the CI
fix — merged to `main` directly.

**Why this is a defect and not merely staleness:** obeying the doc breaks the
thing it governs. A PR diff is branch-vs-base, so basing a `main`-forked branch
on `staging` renders as **62 commits** — two signal, sixty noise. The written
rule, followed literally by someone careful enough to trust it, produces an
unreviewable PR. It punishes the virtue.

**Decision required (two defensible answers, needs an owner to pick):** revive
`staging` as a real integration trunk, or amend §Merge rules to describe the
main-direct flow that has been practice for six weeks.

> **Owner: UNASSIGNED.** Belongs to whoever owns the delivery model.
> **Blocks:** nothing in this arc. Left unowned, it re-traps the next careful
> reader.

---

## 8. Out of scope

Collapsing `services/storage/failureClassification.ts` into the pipeline
classifier — a separate three-way matrix (ADR-0013 §7) with its own `withRetry`
consumer. Its header comment names the routing gap this arc closes and should
be updated when this lands; the classifier stays put. Ratified-contract scope
discipline: noted, carried forward, not absorbed.

`document_case_state.failed_permanent` (option C-3) — deferred to its own ADR,
uncoupled from this fix.

---

## 9. CONDITIONAL — backfill / triage half — **RESOLVED TO EXCLUDED 2026-07-27**

> **DOES NOT ACTIVATE.** §6 ran on 2026-07-27. Query 1 *was* non-empty (9 rows)
> — but benign: those 9 are the by-design content-duplicate floor, not stranded
> cases. The trigger condition below was written assuming non-empty ⇒ stranded;
> that inference does not hold for this population. **See §9.3 for the binding
> exclusion.**
>
> §9.1 and §9.2 are **retained unchanged** — their reasoning stays correct for
> any genuinely-stranded population found later, and the amnesty argument is
> exactly why the exclusion in §9.3 has to be explicit rather than assumed.

**Original trigger (superseded — see above):** Activates only if §6 returns
non-empty. Marked conditional; not designed in detail until the diagnostic
decides.

### 9.1 The amnesty inversion — why this is not optional cleanup

The new ceilings key off `attempt_count`, and **every existing row is `0`.** A
case stranded since 2026-07-13 therefore does not escalate on the next sweep —
it receives a *fresh* 3-pass grace period.

This inverts the intuition, and the inversion is the whole argument: **the
cases most overdue for a human would get the most additional delay.** Deploying
forward-prevention alone grants amnesty to precisely the population that has
been looping longest. The backfill is not cleanup that can trail the fix; if
§6 returns non-empty, it is load-bearing and ships with it.

### 9.2 Consequent requirement

The backfill's job for stranded rows is **to set `attempt_count` at or past the
relevant ceiling, or to escalate them directly** — not merely to make them
eligible for the new logic. Making them eligible is what produces the amnesty.

Shape if activated:

- One-shot triage pass over the returned set, classifying each stranded case by
  its actual failure and routing through the same
  `enqueue_terminal_failure_with_audit` path.
- Seed `attempt_count` from observed audit-event counts (query 2 gives the
  per-document event count), or force direct escalation regardless of history.
  Either satisfies the requirement above; the choice is about audit fidelity,
  not behaviour.
- Spend bound: the triage pass must **not** re-run ingestion for cases it
  escalates — escalate from the recorded failure, do not re-derive it.

### 9.3 BINDING EXCLUSION — the B3-D duplicate floor (added 2026-07-27)

**Any backfill or triage pass MUST exclude `B3-D` content-duplicate cases.**

These are not stranded work. They are recognised duplicates whose originals
were already processed, deliberately carved out read-only at 0 spend. Routing
them through `enqueue_terminal_failure_with_audit` would push nine junk items
into a human review queue — the precise opposite of what terminalization is
for, and a direct harm to the reviewer this arc exists to serve.

The exclusion is stated as a rule rather than left implicit because §9.1's
amnesty argument creates pressure in the wrong direction: it argues that
*aged, never-escalated* cases are the most urgent to rescue, and these 9 match
that description on every surface signal — old, at `received`, never surfaced.
The one thing that disqualifies them is invisible to those signals and visible
only in the bucket. **Filter on the `B3-D` / `dedup_carveout` outcome, not on
age or state.**

If a future diagnostic finds a genuinely-stranded population, §9.1 and §9.2
govern it unchanged; this exclusion narrows the set, it does not retire the
design.
