# Phase 1.1 Closeout Retrospective

Written: 2026-04-13, immediately after Phase 2 of the technical audit.

Audience: future-me starting Phase 1.2, the Phase 3 audit synthesis
agent, any future collaborator inheriting this codebase.

---

## 1. What Phase 1.1 actually built

The Bridge can post double-entry journal entries through a manual form,
reverse them, and display P&L and Trial Balance reports — all within a
multi-tenant, RLS-isolated, split-screen layout with an inert agent
chat panel. It cannot do anything with the agent. It has no deployment
target, no CI pipeline, and no production users.

## 2. The 18-task closeout arc

The closeout was supposed to be execution: take the Phase 1.1 spec,
build 18 tasks in order, verify against exit criteria, close. It turned
out to be about discovering that the documents and the running system
were different systems. Task 2 was the pivotal moment — what was
supposed to be a routine migration application became a half-day detour
when two latent drifts surfaced in sequence: a migration that existed
as a file but was never applied, and test helpers that worked only
because of accumulated database state from manual operations. From
that point forward, every task included a reconciliation step that
wasn't in the original plan.

The three recovery cycles in the middle (Phase 13B's `useWatch` fix,
Phase 14B's chart_of_accounts embed shape, Phase 15B's NUMERIC
serialization) were not failures of execution — the subagent produced
exactly what was briefed each time. They were failures of prediction:
I could not predict what TypeScript's type system would fail to catch
at the boundary between our code and an external system. Each bug was
invisible to typecheck, invisible to code review, invisible to the
32-point structural review, and visible only when a human clicked a
button in a browser. These three bugs taught me that the quality
bottleneck is at system boundaries, not inside the code.

## 3. Patterns that emerged during the work

### The three external-system runtime-shape bug classes

Phase 13B: `form.watch('lines')` returns correct values in event
handlers but stale values in render context. The react-hook-form
documentation distinguishes `watch` (imperative) from `useWatch`
(reactive), but both typecheck as `FieldPath<T>`. Phase 14B:
Supabase's generated types model chart_of_accounts FK embeds as
`Array<{...}>` but PostgREST returns many-to-one relationships as a
single object. Phase 15B: PostgreSQL `NUMERIC(20,4)` columns are
serialized as JavaScript `number` by the Supabase driver, not
`string`. All three branded `MoneyAmount` values were arriving as
numbers that TypeScript believed were strings.

I named this category around Phase 15B when the third instance made the
pattern undeniable: **external systems lie to the TypeScript type
system at serialization boundaries**. The meta-lesson is that TypeScript
types describe the *intended* contract, not the *actual* wire format.
Every boundary where data crosses from an external system (Supabase
driver, PostgREST, react-hook-form internals) needs explicit runtime
coercion, and the coercion functions (`toMoneyAmount`, `toFxRate`) are
not optional helpers — they are load-bearing infrastructure.

In Phase 1.2, I will treat every new external-system integration point
(Claude API responses, agent tool outputs) as a boundary that will lie.
The first thing built at each boundary will be a coercion function with
a smoke test, not a TypeScript type.

### Subagent brief pattern calibration

Five subagent tasks (Phases 12B, 13B, 14B, 15B, 17B), all zero
structural drift. The pattern that made this work: **literal code for
interfaces, descriptive prose for behaviors**. Import statements,
function signatures, Zod schemas, type definitions — these were given
as literal code blocks that the subagent copied verbatim. Layout
decisions, error handling nuances, UX behaviors — these were described
in prose and the subagent interpreted them within the constraints.

The pre-delegation verification step was where the actual quality work
happened. For a typical brief, verification took 20-40 minutes:
checking that every import path existed, every type name matched the
codebase, every function signature was current. This was proportional
to complexity — Phase 12B (routes, ~100 lines output) took 15 minutes;
Phase 13B (form, ~495 lines output) took 40 minutes. The fixed
overhead was ~10 minutes regardless of task size (reading the plan,
checking git status, verifying the dev server state).

Every runtime bug came from my assumptions in the brief, never from
subagent execution. The subagent is a precision instrument that
amplifies both the correctness and the errors in its input. I am
confident enough in this pattern to bet on it in Phase 1.2 — but I
will add one step I skipped in Phase 1.1: a mandatory smoke test
checkpoint after every subagent task, before proceeding to the next
task. The Phase 13B/14B/15B bugs would have been caught one task
earlier each if I had enforced this.

### The git status discovery at Task 16

Fourteen files of multi-tenant routing and auth infrastructure —
including two Category A floor tests — had been running successfully
for three sessions without ever being committed. The root cause was
mechanical: each session committed specific files by path (`git add
<file>`), and dirty files outside the commit scope were never swept
in. No session-start routine checked for uncommitted work.

This taught me that **session boundaries are not git boundaries unless
you make them so**. The "git status as session-start gate" rule was
invented in response: every session starts with `git status --short`
and the expected output is empty. If it's not, you decide on every
dirty file before doing anything else. This is load-bearing because
uncommitted code is invisible to every quality mechanism — it's not
in the diff, not in the PR, not in the commit history, not in the
audit. It exists and runs but has no provenance.

### Smoke testing as the final safety net

Every runtime bug caught in Phase 1.1 was caught by manually clicking
through the UI in a browser. Not by typecheck (all three boundary bugs
passed). Not by integration tests (they test the service layer with
known inputs, not the full vertical slice through browser → fetch →
route → service → database → response → render). Not by the 28-32
point structural reviews (they verify code structure, not runtime
behavior).

What smoke tests catch that nothing else does: the *composition* of
layers. Each layer works correctly in isolation. The bug is in how
layer A's output becomes layer B's input at a boundary neither layer
controls. Running the thing end-to-end in a browser forces every
boundary to be exercised with real serialization, real HTTP, real
DOM rendering. There is no shortcut.

Will this scale into Phase 1.2? Partially. Manual smoke tests work for
synchronous form flows. Agent flows add asynchronous behavior (agent
thinks, proposes, user approves, canvas updates) that can't be tested
by clicking a button and reading the result. Phase 1.2 will need
either automated integration tests that exercise the agent pipeline
end-to-end, or a structured manual smoke test protocol that includes
"wait for agent response, verify canvas updated."

### The baseline-delta integration test pattern

Phase 16A invented this pattern when report aggregation tests needed
to assert specific P&L and Trial Balance totals against a database
that accumulated state from prior test files. The pattern: before
posting test-specific entries, snapshot the current aggregation totals.
After posting, re-query and assert that the *delta* matches the
hand-calculated expectation. The test doesn't care what absolute
values exist — only that its own entries produced the expected change.

This was invented because the previous approach (asserting absolute
values) broke whenever a prior test file committed entries to the same
org and period. The `entry_number` UNIQUE collision in Phase 12A
(friction journal, 2026-04-12) was the first symptom; the report
aggregation tests in Phase 16A were the second.

I would port this pattern to Phase 1.2 as-is for report tests. For
other integration tests, I would consider per-test org isolation
(each test creates its own org via `orgService.createOrgWithTemplate`)
as a cleaner solution — it eliminates shared state entirely rather
than working around it. The baseline-delta pattern is a correct
workaround for shared state; per-test org isolation removes the
need for the workaround.

### The working-memory limitation discovery

Somewhere around Task 14, I noticed that I could not reliably answer
"what did we decide about X three tasks ago?" but I could reliably
answer "does this code look correct given the schema I'm reading right
now?" The distinction is between *recall* (retrieving a specific fact
from earlier in the session) and *coherence checking* (verifying that
what I'm looking at is internally consistent). Recall degrades over
long sessions; coherence checking does not.

I adapted by front-loading context: before making a decision, I would
re-read the relevant file rather than relying on what I remembered
about it. The pre-delegation verification step is entirely a
coherence-checking activity — I read the brief against the codebase,
not against my memory of the codebase. This is the most important
pattern for Phase 1.2 onboarding: **collaborate with Claude by asking
it to verify coherence against artifacts, not by asking it to recall
decisions from earlier in the session.** The artifacts are reliable;
the memory is not.

### Self-audit bias and the framework's response

Self-audit bias is not a feeling of "I should go easy on my own code."
It's subtler: it's the feeling of *already understanding why a
decision was made*, which makes the decision feel more reasonable than
it would to a reader encountering it cold. When I read
`recordMutation.ts`'s comment claiming transactional atomicity, I knew
the aspiration behind it. A fresh reader would see a lie.

The audit framework's discipline — requiring scanners to flag
self-audit bias explicitly — forced me to ask at each finding: "am I
rating this lower because I understand the context, or because the
severity is genuinely lower?" Four explicit self-audit notes in
Session D alone. The most honest one: ARCHFIT-002 (read-path
authorization split) rated Low, with a note that a fresh auditor might
rate it Medium. I still think Low is correct, but I flagged the
uncertainty rather than resolving it in my own favor.

Is this replicable for Phase 1.2? Yes, but the bias compounds. I now
have Phase 1.1 build experience *and* Phase 1.1 audit experience. I'll
be more familiar with the codebase, which makes the "already
understanding why" effect stronger. The framework should add a
specific instruction for Phase 1.2: "compare your severity ratings
against Phase 1.1's ratings for similar findings — if you're
consistently rating lower, investigate whether the code improved or
your standards shifted."

## 4. Architectural decisions and their rationale

**Reversals net naturally via aggregation (Q21a).** The alternative was
reversal chain tracking: when computing P&L, walk each entry's
`reverses_journal_entry_id` chain and exclude reversed entries from the
SUM. This is more complex (recursive CTE or application-layer chain
walking), and produces the same result because reversals are
mirror entries — their debits and credits cancel in the SUM. I chose
the simpler query. I would reconsider if partial reversals are
introduced (Phase 2+), because a partial reversal doesn't fully cancel
the original — but for Phase 1.1's full-mirror-only reversals, natural
netting is correct and simple.

**Trial Balance uses `amount_cad` instead of native-currency columns.**
The spec called for `debit_amount`/`credit_amount` (native currency).
I overrode this for consistency with the P&L RPC, which already used
`amount_cad`. In CAD-only Phase 1.1, the values are identical. The
alternative — separate column choices per report — would have produced
two report RPCs with different aggregation semantics for no current
benefit. I would reconsider when multi-currency arrives in Phase 4;
the Trial Balance will need native-currency columns for multi-currency
orgs. The migration is straightforward (add columns to the RPC's
`RETURNS TABLE`).

**RPC-first for complex SQL.** Migration 007 established that
PostgREST's query builder is not sufficient for reporting queries
(FILTER clauses, conditional JOINs). I stumbled into this — I initially
tried to express the P&L query through the Supabase client and hit the
FILTER clause limitation within 30 minutes. The test helpers
(`test_helpers.sql`) had already established the plpgsql pattern, so
RPCs were the natural fallback. I would have preferred to stay with the
query builder (less context-switching between TypeScript and SQL), but
the limitation is real and the RPC pattern works cleanly.

**adminClient-based writes with service-layer authorization.** The
alternative was RLS-based writes: use the user-context client for
mutations, relying on RLS INSERT/UPDATE policies to enforce tenant
isolation. The `withInvariants` middleware would be unnecessary — RLS
would do the authorization work at the database level. I chose
adminClient because: (1) the service layer needs to perform
authorization checks *beyond* RLS (role-based permissions via
`canUserPerformAction`), (2) the Supabase JS client doesn't provide
transaction handles, so using the user-context client would still
require the same three-separate-call pattern, and (3) adminClient
gives the service full control over what gets written, making the
transaction atomicity fix (write RPC) simpler. I would reconsider if
the service-role key management becomes a security concern in
deployment — but for the current architecture where the key never
leaves the server, adminClient is the right choice.

## 5. Process calibration data

**Session length.** Full-capacity sessions supported 4-6 hours of
substantive work. The signal for "time to stop" was not fatigue but
*increasing re-reads*: when I started re-reading files I had already
read in the same session to confirm what I remembered, that was the
signal that working memory was degrading. The practical rule: if I'm
re-reading the same file for the third time in an hour, commit what
I have and stop.

**Fresh-session discipline.** The audit framework required fresh
sessions between phases. This felt like unnecessary ceremony at the
start of Session D — I had just finished Session C and knew exactly
what the findings said. But when I started the Architecture Fit scan, I
caught myself reaching for conclusions I'd already drawn in Session C
rather than investigating from the evidence. The fresh session forced
me to re-derive rather than recall. The output was better for it — the
Foundation Readiness Assessment in ARCHFIT would have been less
thorough if I'd carried Session C's context forward. My subjective
read: fresh sessions produce better output for analytical work
(auditing, planning) and are unnecessary overhead for mechanical work
(applying a known fix, writing a migration).

**The ritual of closing.** Verify `git status`, read the final commit
hash, close the terminal. This matters because it creates a clean
boundary: the next session starts from committed state, not from
accumulated working-tree state. I was protecting against the Task 16
scenario — uncommitted work that runs but has no provenance. The
commit hash is the proof: if I can name the hash, everything is
committed.

**Pre-delegation brief verification.** This is the work step that
determines subagent output quality. Concretely: for each import path
in the brief, grep the codebase and verify the export exists. For each
type name, verify it matches the current definition. For each function
signature, read the actual function. For Phase 13B (the form task),
this took 40 minutes for a task that took the subagent ~3 minutes to
execute. The 40 minutes was the quality investment; the 3 minutes was
the execution. The ratio is not proportional to task complexity — it's
proportional to how many external-system boundaries the task crosses.

**Moments I considered stopping early.** Task 17's pre-delegation
review caught four errors — stale spec formula, missing period
dropdown, wrong net income calculation, and a missing onNavigate prop.
I briefly considered just delegating and fixing in review, which would
have been faster in the moment but would have produced a subagent
output with four known bugs. I didn't delegate, and the delivered
output was clean. The audit's Session D scan 6 (Code Quality) was the
last scan of a long session. The temptation was to produce a scan that
matched the volume of the prior scans. The anti-padding guidance in the
prompt saved me — "a scan that produces 3-4 substantive findings plus
a strong analysis is exactly right" gave me permission to write six
findings instead of stretching for ten. The discipline held because the
framework made the right output volume explicit.

## 6. What Phase 1.2 needs that Phase 1.1 didn't provide

The audit's Foundation Readiness Assessment says YES-WITH-CAVEATS with
three specific fixes: write RPC for transaction atomicity (BACKEND-001
/ DATALAYER-001), immutability triggers on ledger tables
(SECURITY-004 / DATALAYER-003), and the org authorization check on
`chartOfAccountsService.get()` (BACKEND-006 / SECURITY-005). These are
bounded, 1-2 day fixes.

From the build-experience side, Phase 1.2 also needs something the
audit couldn't measure: a canvas refresh mechanism. FRONTEND-001
flags the absence of cross-component state invalidation. When the agent
posts a journal entry from the chat panel, the journal entry list on
the canvas has no way to know the data changed. This is not a
correctness issue — it's a trust issue. The user will see the agent say
"I posted the entry" while the list still shows the old data. For an
AI-native platform, stale-after-agent-mutation is the equivalent of a
broken promise.

The deeper need is cultural: Phase 1.2 is where the codebase starts
receiving agent-generated mutations, which means the Three External-
System Boundary pattern will have a fourth instance (Claude API
responses). The coercion discipline that Phase 1.1 learned the hard
way — runtime shaping at every external boundary — must be applied
from day one of agent integration, not discovered after the third bug.

## 7. What I would do differently

1. **Require a browser smoke test after every subagent task, before
   proceeding to the next task.** Phase 13B's `useWatch` bug persisted
   through Phase 14B because I deferred the smoke test. One session
   boundary earlier would have caught it one task earlier.

2. **Write a coercion function and a smoke test as the first artifact
   at every new external-system boundary**, before writing the
   business logic that consumes the boundary's data. The three
   boundary bugs all had the same shape: I wrote the consumer first,
   assumed the types were correct, and discovered the mismatch later.

3. **Create per-test org isolation in integration tests** instead of
   relying on shared database state with baseline-delta assertions.
   Each test creates its own org, posts its own entries, asserts
   against its own data. Eliminates the shared-state class of bugs
   entirely.

4. **Implement the `no-unwrapped-service-mutation` ESLint rule before
   adding new mutation paths.** CLAUDE.md claims it exists. It doesn't.
   Phase 1.2 adds agent tools as new mutation paths — the rule should
   exist before those paths are built, not after.

5. **Run `git status --short` as the literal first command of every
   session.** Not as a suggestion — as a gate. If the output is
   non-empty, address every line before doing anything else. The
   Task 16 discovery (14 uncommitted files) is the kind of mistake
   that compounds silently.

6. **Split the Observability category out of the sparse-scanner
   collapse for the Phase 1.2 audit.** Once API route integration
   tests exist, pino redaction becomes testable, trace_id end-to-end
   propagation becomes verifiable, and the health endpoint can be
   tested against a real database. The category will produce 3-5
   meaningful findings, not the 1 sparse finding it produced at
   Phase 1.1.

## 8. What I would keep exactly the same

**The Two Laws.** Law 1 (all DB through services) and Law 2 (all
journal entries through `journalEntryService.post`) were the single
most valuable architectural constraint. Every time I was tempted to
make a quick direct database call — OrgSwitcher's membership query is
the one exception, and the audit correctly flagged it — the Laws
redirected me through the service layer where authorization, logging,
and audit trailing happen. The constraint paid for itself when the
audit found zero Law 1/Law 2 violations across 9 API routes.

**The friction journal.** Forty entries across 18 tasks. Every
entry captures a specific moment — not a summary, not a lesson learned,
but "this broke at 2:30 PM and here's why." The retrospective you're
reading was possible because the friction journal exists. Without it,
I would be reconstructing events from git history, which captures
*what* changed but not *why* it was surprising.

**The literal-interfaces subagent brief pattern.** Five zero-drift
tasks validate the approach. The key insight: the brief is not
instructions — it's a specification. The more it looks like the output,
the more the output matches the intent. I would not change this
pattern for Phase 1.2.

**The pre-delegation verification step.** Every runtime bug came from
my assumptions in the brief. Pre-delegation verification catches
assumption errors before they become subagent output. The 20-40
minutes per task is the highest-ROI quality investment in the entire
process.

**The audit framework's fresh-session discipline.** Session C and
Session D produced better output than they would have as a single
continuous session. The synthesis quality improved because each scan
started from the evidence, not from the previous scan's conclusions.
I would preserve this for Phase 1.2's audit.

## 9. Honest limitations of this retrospective

I helped build Phase 1.1 and then audited it and then wrote this
retrospective about it. The self-audit bias that four scanner notes
flagged in Session D applies here too, compounded by a layer of
narrative construction. I'm selecting which patterns to highlight and
which to minimize, and I can't fully see my own selection criteria. A
reader with a different perspective would probably notice: (a) I may
be overweighting the subagent brief pattern because it worked well,
without adequately exploring what would have happened if I'd briefed
differently; (b) the "three boundary bugs" narrative is clean and
memorable, but there may have been other bugs I've unconsciously
downgraded because they don't fit the pattern; (c) I have no baseline
for comparison — I don't know whether this closeout went well or
poorly relative to what another developer or another AI session would
have produced with the same spec. A second reader should check whether
the patterns I describe as universal ("every runtime bug came from
brief-author assumptions") are genuinely universal or just the ones I
noticed and remembered.
