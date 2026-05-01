# Open Questions

The single place to look up "what unresolved questions does this
project carry forward?"

This file captures genuine uncertainty — questions where the
answer is not yet determined. Distinct from:

- **`docs/09_briefs/phase-1.2/obligations.md`** — Phase 1.2
  obligations (deferred-with-a-plan items inherited from Phase
  1.1 closeout). If something has a clear "Phase 1.2 will resolve
  this" pointer, it lives there, not here.
- **`docs/07_governance/friction-journal.md`** — decisions
  already made, with rationale recorded. Historical record, not
  open questions.
- **`docs/07_governance/adr/`** — formalized architectural
  decisions. ADR-001 (reversal semantics) is currently the only
  one.

The four sections below distinguish three categories of genuine
uncertainty (founder data, architectural defaults, closeout
surfacing) plus one separate category (formalization candidates
— certainty awaiting formal write-up, not architectural
uncertainty).

## How to resolve a question

When a question is answered, the resolution lands in the
appropriate place depending on type:

- **Founder data and environment questions** → friction-journal
  entry dated when the answer was given. Remove the question
  from this file (or strike through with a "RESOLVED — see
  friction-journal entry YYYY-MM-DD" note for traceability).
- **Architectural defaults** → either accept-the-default in the
  Phase 1.2 brief (with the brief citing this file's question
  number), or land an ADR if the decision warrants formalization.
  Either way, remove from this file.
- **Closeout-surfaced questions** → resolution mechanism depends
  on the question (CI check, brief requirement, ADR). Pick the
  appropriate venue.
- **Formalization candidates** → the candidate is removed when
  the formal write-up (ADR or otherwise) lands.

Removing items from this file as they resolve is the discipline
that keeps the file useful. A growing list of stale RESOLVED
entries is worse than a short list of genuinely open ones.

---

## Section 1 — Founder data and environment

Questions only the founder can answer. Inherited from PLAN.md §18a
(now archived at `docs/99_archive/PLAN_v0.5.6.md`). 3 of the
original 10 founder questions remain open as of Phase 1.1
closeout.

### Q3 — Which org + month for Phase 1.3 close

Phase 1.3 exit criterion #1 is "close one real month for one real
org." The month must be chosen before Phase 1.2 finishes so the
data is being collected as Phase 1.2 work proceeds.

**Specify which org and which month.**

**Blocks:** Phase 1.3 brief writing.
**Answer needed before:** Phase 1.2 work concludes.

### Q6 — Real-email or test-email accounts for Phase 1.1 users

The seed script creates 3 dev users. The two real users in Phase
1.1 exit criterion #7 are different — they are real human users
with real Supabase Auth accounts.

**Confirm whether the founder wants to use real email addresses
for these or test addresses initially.**

**Blocks:** Auth flow testing in production environment.
**Answer needed before:** Phase 1.3 (when real-email accounts
become operationally meaningful — Phase 1.2 dev-only work can
proceed with test accounts).

### Q8 — Phase 1.3 DB backup strategy

Phase 1.3 uses the system for real bookkeeping. The local
Supabase database holding real financial data needs a backup
story before Phase 1.3 begins. Two options:

- Rely on remote Supabase backups (means running against remote,
  not local, in Phase 1.3).
- Document a manual `pg_dump` cadence.

PLAN.md §18a.8's recommendation: switch to remote Supabase for
Phase 1.3.

**Decide which backup strategy applies.**

**Blocks:** Phase 1.3 readiness.
**Answer needed before:** Phase 1.3 brief writing.

---

## Section 2 — Architectural decisions deferred to Phase 1.2 brief

Decisions promoted to PLAN.md §18 in v0.5.1 because their
defaults were architectural defaults rather than founder data.
7 of the original architectural defaults remain open as of Phase
1.1 closeout. Each carries a proposed default from PLAN.md; the
Phase 1.2 brief either accepts the default or specifies an
alternative.

### Q11 — Claude API failure handling UX

What does the user see when the Claude API fails?

**PLAN.md §18b proposed default:** chat panel shows an explicit
"agent unavailable — retry" state with a Retry button; the
[Mainframe](glossary.md#m) remains fully functional so every
Phase 1 task can still be completed via the manual path. The
failure state is a banner, not a modal — it does not block other
workspace actions.

**Confirm the proposed default or specify an alternative.**

**Blocks:** Phase 1.2 agent UI implementation.

### Q12 — Cost budget per agent interaction

What is the ceiling on per-interaction agent cost?

**PLAN.md §18b proposed default:** no hard ceiling in Phase 1.2;
measure per-entry cost in Phase 1.3 and set a ceiling in Phase 2
informed by real data. Starting model: Claude Sonnet for
orchestrator, prompt caching on, structured responses only.

**Confirm "measure first, ceiling later" approach, or specify a
Phase 1.2 hard ceiling.**

**Blocks:** Phase 1.2 cost modeling.

### Q13 — Tool-call validation retry policy

How many retries on tool-call validation failure?

**PLAN.md §18b proposed default:** bounded retry, max 2
attempts, with the validation error fed back to Claude as a
clarification message. After 2 failures, surface a clarification
question to the user instead of retrying further.

**Confirm 2, or specify 1 or 3.**

**Blocks:** Phase 1.2 orchestrator retry policy.

### Q14 — Streaming vs batch agent responses in Phase 1.2

**PLAN.md §18b proposed default:** batch in Phase 1.2 (simpler —
one round-trip per user message; the UI renders the complete
response after the agent finishes). Phase 2 introduces streaming
for UX.

**Confirm batch in Phase 1.2, or specify streaming from day
one.**

**Blocks:** Phase 1.2 agent UI rendering path.

### Q15 — AgentSession TTL and cleanup mechanism

**PLAN.md §18b proposed default:** 30-day TTL. Cleanup is a
manual SQL script in Phase 1 (no pg-boss available); Phase 2
promotes it to a scheduled pg-boss job.

**Confirm 30 days, or specify a different TTL.**

**Blocks:** Phase 1.2 session cleanup script.

### Q16 — Persona prompt scope for Executive in Phase 1.2

Most CFO functionality (consolidated reporting, runway modeling,
variance analysis) is Phase 3+.

**PLAN.md §18b proposed default:** the Executive persona exists
in Phase 1.2 with a system prompt that says "I can help you look
at any of your entities' P&L and chart of accounts; consolidated
views are coming in Phase 3." Tools available:
`listChartOfAccounts`, `checkPeriod`, and read-only journal
entry queries. **No mutating tools** for the Executive persona
in Phase 1.2 — Executives do not post journal entries directly.

**Confirm this scope.**

**Blocks:** Phase 1.2 persona prompts and tool whitelist.

### Q17 — Data export / audit package urgency

IFRS and Canadian regulatory compliance both require data
portability.

**PLAN.md §18b proposed default:** Phase 1.3 friction journal
will tell us when this becomes urgent; the Phase 2 brief
addresses it formally. The Bible flags it as a known long-term
requirement.

**Confirm "wait for Phase 1.3 to inform," or specify that a
basic CSV export is required by end of Phase 1.2.**

**Blocks:** Phase 1.2 vs Phase 2 scope decision for export.

### Q23 — Promotion criteria: globally fixed or org-configurable?

The Agent Ladder promotion defaults are ≥15 matches, ≥95% approval
rate, within a 30-day window. These are opinionated defaults chosen
to keep the initial system simple. Open question: should these
thresholds be org-configurable (with owner authorization), or fixed
at the system level across all orgs?

**Proposed default (design sprint):** fixed at the system level for
v1. Log every promotion decision; adjust the defaults after
observing real promotion behavior across several orgs. Org-level
configuration is a Phase 2 decision informed by data.

**Confirm fixed-at-system-level, or specify org-configurable from
v1.**

**Blocks:** agent_autonomy_model.md final content.

### Q24 — Limit change authorization: who?

Amount limits (per-transaction, per-day aggregate, per-rule) are
the policy lever that controls how much the agent can act on
without human approval. Who can change them?

Three options: (a) controller-direct — any controller can change
limits; (b) controller-proposes / owner-approves — a controller
proposes the change, the owner confirms before it takes effect;
(c) owner-only — only the owner can change limits.

**Proposed default (design sprint):** option (b),
controller-proposes / owner-approves. The friction is the feature —
limit changes are security-sensitive in a family-office context and
the extra approval step is low-cost at this user count. Reconsider
after 6 months of real use.

**Confirm (b), or specify (a) or (c).**

**Blocks:** agent_autonomy_model.md final content; Phase 1.2 UI
for the Agent Policies canvas.

### Q25 — Agent persona and voice

The agent has one voice to the user across all interactions (chat,
onboarding, proposed-mutation-card reasoning text). The design
sprint settled on a "senior bookkeeper" voice — neutral,
professional, slightly understated, no name, no personality
gimmicks. Open question: is the persona truly unnamed, or does it
carry a neutral product-aligned name ("The Bridge," "Bridge," or
similar)?

**Proposed default (design sprint):** unnamed. The agent is
referred to in UI copy as "the agent" or "your bookkeeper-style
agent" — no proper name, no anthropomorphization. This preserves
the trust framing: the product is a control surface, not a
personality.

**Confirm unnamed, or specify a name to use in Phase 1.2 UI
copy.**

**Blocks:** Phase 1.2 UI copy work (chat empty state, onboarding
flow text, proposed-mutation-card language).

### Q26 — Active vs passive promotion prompting

When a rule meets promotion criteria, how does the system surface
it to the controller? Two options: (a) passive — a banner in the
Agency Health view ("3 rules eligible for promotion"), discovered
on review; (b) active — the agent raises the prompt in chat
("I've handled Amazon invoices correctly 15 times — want to
promote?").

**Proposed default (design sprint):** passive (option a) for v1.
Active prompts risk polluting the chat transcript with housekeeping
requests; the Agency Health view lets the controller grant autonomy
deliberately in a calm review moment rather than reactively.
Flagged as tunable after real-use observation.

**Confirm passive (a), or specify active (b) or a hybrid.**

**Blocks:** agent_autonomy_model.md user-facing surface section;
Phase 2 Agency Health canvas view brief.

### Q27 — CLAUDE.md §4 amendment for Tier 2 stateless sub-agents

The Phase 2+ layered-tiers proposal (ADR-0007 draft target)
introduces stateless sub-agent stages that produce typed output
consumed by the Tier 1 committing agent. CLAUDE.md §4 item 3 reads
"No agent may reference an account code, vendor name, or amount
it has not first retrieved from the database in the current
session." The rule as written does not distinguish between
stateful conversational agents and stateless pipeline stages. A
Tier 2 stage that extracts an amount from an OCR'd invoice is, by
the plain reading of §4, violating the rule — the amount was not
retrieved from the database.

Two resolution options:

- **(a) Add a clarifying sub-bullet to CLAUDE.md §4** stating that
  the rule applies to the committing Tier 1 agent's session, and
  that Tier 2 stateless stages produce tool-like outputs
  re-verified by Tier 1 at the commit boundary.
- **(b) Exception clause in ADR-0007** explicitly superseding §4
  for Tier 2 sub-agent calls, with the re-verification contract
  (Q28) as the compensating control.

**Decide during Phase 2 scoping, after Phase 1.3 triage.**

**Blocks:** ADR-0007 drafting.

**Source:** Phase 2 agent architecture review, 2026-04-19.

### Q28 — Re-verification matrix for the Tier 2 → Tier 1 boundary

The Tier 2 safety contract requires "re-verification at the
commit boundary" for every data field whose semantic correctness
affects the ledger. "Re-verification" as prose is insufficient; a
concrete field-level matrix is needed before any Tier 2 system
codes. The matrix specifies, for each field on a Tier-2-produced
`ProposedMutation`:

- **Source** — which Tier 2 stage produced the value, and via
  what mechanism (LLM extraction, DB lookup, deterministic
  transform).
- **Re-verification method at Tier 1** — how the committing agent
  validates the value (re-call a read tool and compare, require
  human confirmation on the card, check against a seeded table,
  accept if structural pass-through).
- **Failure mode** — what happens if re-verification fails
  (reject the mutation, queue for human review, raise a
  `ServiceError`).

Illustrative sketch (not authoritative):

| Field | Source | Re-verification at Tier 1 | Failure mode |
|---|---|---|---|
| `amount` | LLM from document | Human confirms on ProposedEntryCard | User edit before approve |
| `vendor_id` | Matcher stage | Re-call `getVendor(id)`; verify org scope | Reject if not found |
| `account_code` | Account-suggest stage | Must exist in `listChartOfAccounts(org_id)` | Reject if absent |
| `entry_date` | Document | Re-call `checkPeriod(entry_date)` before commit | Period-locked → reject |
| `tax_code_id` | Document | Must exist in seeded `tax_codes` | Reject if absent |

**Produce the authoritative matrix in
`docs/02_specs/agent_architecture_policy.md` before any Tier 2
system codes.**

**Blocks:** ADR-0007 drafting; first Tier 2 system (AP Agent)
implementation.

**Source:** Phase 2 agent architecture review, 2026-04-19.

### Q29 — Tier 2 boundary enforcement mechanism

The Tier 2 safety contract states "No direct writes. Tier 2
stages never call mutating services or insert into tables."
Today this would be a convention. The existing
`no-unwrapped-service-mutation` build-time lint prevents a
related class of error (mutating service functions called
without `withInvariants()`). An analogous mechanical rule is
needed to prevent Tier 2 module paths from importing mutating
service entry points.

Proposed sketch:

- **Scope:** files under `src/agent/pipelines/**/*` (or the
  chosen Tier 2 path) cannot import
  `journalEntryService.post`, `chartOfAccountsService.create`,
  or any other mutating service function.
- **Enforcement:** ESLint rule or grep-fail CI check, depending
  on which gives crisper error messages.
- **Mutating set derivation:** from the
  `no-unwrapped-service-mutation` rule's allowlist, so adding a
  new mutating service function automatically extends the Tier 2
  prohibition.

**Produce the concrete lint design in
`docs/02_specs/agent_architecture_policy.md` alongside the
re-verification matrix (Q28).**

**Blocks:** first Tier 2 system (AP Agent) implementation;
ADR-0007 governance-artifacts section.

**Source:** Phase 2 agent architecture review, 2026-04-19.

### Q30 — Logic Receipt reproducibility under Tier 2 pipelines

`intent_model.md` §6 rule 4 requires Logic Receipts to be
byte-for-byte reproducible given the same rule version, input
features, and historical context. The existing
`ProposedMutation.justification` fields (`rule_id`,
`input_features`, `historical_match_count`, `confidence_score`,
`source_transactions`, `user_utterance`) capture Tier 1's inputs
at the moment the mutation was proposed. They do not capture
per-stage input/output under a Tier 2 pipeline.

Two options:

- **(a) Extend `ProposedMutation.justification` with a
  `pipeline_trace: PipelineStageRecord[]` field.** Each stage
  record carries `stage_name`, `input_hash`, `output_hash`,
  `model`, `timestamp`. Per-stage reproducibility is preserved;
  Logic Receipts continue to satisfy the byte-for-byte rule.
- **(b) Accept that Tier 2 Logic Receipts lose step-level
  reproducibility.** Document the limitation: auditors see "this
  was produced by Tier 2 pipeline X at version Y" but cannot
  replay stages deterministically.

**Author's preference: (a). The cost is one field addition; the
benefit is that Logic Receipt reproducibility survives the Tier 2
introduction. Confirm during ADR-0007 drafting.**

**Blocks:** ADR-0007 drafting; `ProposedMutation` Zod schema
extension (if (a) is chosen, the extension lands with Tier 2's
first system).

**Source:** Phase 2 agent architecture review, 2026-04-19.

### Q31 — LLM-planned orchestration prohibition for Tier 2

The Tier 2 safety contract illustrates deterministic TypeScript
orchestration between pipeline stages but does not codify it as
a rule. Without an explicit prohibition, a future author can
argue "my LLM coordinator is just a typed function" and
introduce the exact pattern the three-tier policy is designed to
prevent — LLM-planned stage sequencing, dynamic tool dispatch, or
multi-agent chat handoffs disguised as typed orchestration.

Proposed rule, to be added verbatim to ADR-0007's safety
contract:

> Orchestration between Tier 2 stages MUST be deterministic
> TypeScript. LLM-planned orchestration is prohibited. A stage's
> role is to produce a typed output from a typed input; a stage
> does not decide which stage runs next. The orchestrator module
> is a plain function that calls stages in a fixed sequence.

**Confirm verbatim in ADR-0007, or propose alternative wording.**

**Blocks:** ADR-0007 drafting.

**Source:** Phase 2 agent architecture review, 2026-04-19.

---

## Section 3 — Open questions surfaced during Phase 1.1 closeout

Questions that emerged during the Phase 1.1 closeout work but
were not part of PLAN.md §18's original scope. Source:
friction-journal entries from April 2026 closeout work.

### Q21 — "No orphaned SQL files" rule: codify as CI grep-fail check, Phase 1.2 brief requirement, or both?

The Phase 1.1 closeout (friction-journal entries dated
2026-04-12) discovered that `src/db/migrations/` contained a
migration file (`002_add_reversal_reason.sql`) that was never
applied to the running database, plus
`tests/setup/test_helpers.sql` was loaded only via accumulated
state, not via any wired-up pipeline. Both produced silent
correctness failures: the integration test suite was
non-reproducible from a fresh clone for an unknown duration.

The lesson: any file in the project that LOOKS like it should
be applied by tooling but isn't wired into a pipeline is a
latent drift source. The friction-journal entry proposes a
Document Sync exit criterion — "no orphaned SQL files" — meaning
every SQL file is either in `supabase/migrations/`, in
`src/db/seed/`, or referenced by test setup code.

**Decide:** does this become a CI grep-fail check, a Phase 1.2
brief requirement, or both?

**Blocks:** Phase 1.2 brief writing (if it becomes a brief
requirement); Phase 1.2 CI configuration (if it becomes a
check).

**Source:** friction-journal entry 2026-04-12 ("Two related
drift findings during closeout Task 2 execution," lessons
section item 3).

### Q22 — Phase 1.3 globalSetup remote-DB mechanism

`tests/setup/globalSetup.ts` currently hardcodes
`postgresql://postgres:postgres@127.0.0.1:54322/postgres`
because local Supabase exposes Postgres on a fixed port.

Phase 1.3 (remote Supabase) needs the test helper application
to work against the remote database. Two approaches:

- **(a) Test helper application via admin API** — call the
  Supabase admin API to apply test helpers, no direct Postgres
  connection needed.
- **(b) `SUPABASE_TEST_DB_URL` env var** — parameterize the
  hardcoded URL, set the env var to the remote DB URL in CI for
  Phase 1.3.

Both work. (a) is more aligned with how the rest of Phase 1.3
infrastructure connects (Supabase admin API for auth seeding,
PostgREST for app reads). (b) is simpler — one env var, no new
HTTP code.

**Decide which mechanism applies.**

**Blocks:** Phase 1.3 readiness.

**Source:** friction-journal entry 2026-04-12 ("Phase 1.3
obligation: globalSetup currently hardcodes...").

### Q32 — Reversal mirror check step order: ADR-0001 vs leaf vs code

The reversal mirror check has three governance surfaces that
disagree about the *numbering* of the five steps, although all
three agree on the *set* of checks and all describe the check as
running before the `BEGIN` transaction.

- **`docs/07_governance/adr/0001-reversal-semantics.md` (lines
  113-127).** Enumerates five steps with **`reversal_reason`
  non-empty as Step 5**: (1) load referenced entry, (2) same-org,
  (3) line count match, (4) per-line mirror with debit/credit
  swap, (5) reason non-empty.
- **`docs/02_specs/ledger_truth_model.md` INV-REVERSAL-001 leaf
  (lines 2314-2348).** Enumerates five steps with
  **`reversal_reason` non-empty as Step 1**: (1) reason
  non-empty, (2) load referenced entry, (3) same-org, (4) line
  count match, (5) per-line mirror with debit/credit swap.
- **`src/services/accounting/journalEntryService.ts`.** The
  header block comment (lines 186-192) describes the execution
  order as **reason-first** (matches the leaf). The inline step
  labels inside the function body (lines 198-243) use ADR-0001's
  logical numbering (reason = Step 5) so that a reader scanning
  the function body sees `// Step 5: reversal_reason` execute
  before `// Step 1: load the referenced entry`, contradicting
  the function's own header comment.

The code **executes** reason-first. The leaf documents
reason-first. The function's header comment documents
reason-first. The ADR and the function's inline step labels
document reason-last. Two of the three governance surfaces agree
with the code; ADR-0001 and the inline labels are the outliers.

**Likely origin:** ADR-0001 is dated 2026-04-11, before Phase
1.1 execution. The leaf was written during the 2026-04 docs
restructure after the implementation landed, reflecting the
cheap-first execution order adopted during Phase 1.1 execution.
The code inherited the ADR's design-time numbering in the inline
comments even after the execution order was reordered.

**Recommendation:** update ADR-0001 with a post-implementation
note matching the leaf's execution order (the ADR's own "Notes
for future ADR writers" §2 anticipates exactly this situation —
"Capture the history when the decision moves during the same
cycle"), and renumber the inline step labels inside
`validateReversalMirror()` so they match the function's own
header comment (reason-first). No code behavior change; purely
documentation + comment reconciliation.

**Why not a new ADR:** ADR-0001 already has the "placement
rationale and history" pattern for mid-cycle corrections. An
in-place amendment preserves decision continuity; a superseding
ADR for a comment-ordering correction would be ceremony.

**Blocks:** ADR-0001 amendment (one paragraph addition) +
`src/services/accounting/journalEntryService.ts` inline comment
renumbering (five line edits, no code change).

**Source:** Skills migration session, 2026-04-19.

### Q33 — Service-layer placement for the 3 remaining `@/db/adminClient` direct-import sites in apps/web/

**Status update 2026-04-30 (partial-resolution arc):** the 4 route-
handler half of this question was resolved by extracting service-
layer functions and rewriting the consumers. The 3 agent-runtime
sites remain deferred per the original rationale below. The
question now scopes to those 3 sites only.

**Resolved this arc (route-handler half — 4 sites cleared):**

```
apps/web/src/app/api/agent/confirm/route.ts:21       ← cleared
apps/web/src/app/api/agent/conversation/route.ts:35  ← cleared
apps/web/src/app/api/agent/reject/route.ts:28        ← cleared
apps/web/src/app/api/auth/mfa-status/route.ts:4      ← cleared
```

Now consume `aiActionsService.{getByIdempotencyKey,
listByIdempotencyKeys, markConfirmed, markResolved}`,
`agentSessionService.getMostRecentForUser`,
`journalEntryService.{getEntryNumber, getEntryNumbersBatch}`, and
`orgService.getMfaRequirement`. New mutations carry no action key
pending Q34.

**Remaining (agent-runtime half — 3 sites still deferred):**

```
apps/web/src/agent/memory/orgContextManager.ts:17
apps/web/src/agent/orchestrator/index.ts:39
apps/web/src/agent/orchestrator/loadOrCreateSession.ts:10
```

Verified pre-existing in the original migration via checkout of
`b2bf9f3` (the pre-migration HEAD) and running `next lint`. The
4 route-handler sites were the half that decomposed cleanly into
`src/services/` exports without prejudging agent shape; the 3
agent-runtime sites remain held for the reasons below.

**Why this is genuine uncertainty (not just an obligations
entry):** the right service-layer shape for these consumers
depends on patterns that haven't been observed yet. The agent
modules in particular (`orgContextManager`, `orchestrator`,
`loadOrCreateSession`) will reshape when the Double Entry Agent
work proceeds. Building a service-layer surface around them
*now* risks structuring against assumptions the agent work
later contradicts; the consumers would have to be moved twice.

**Resolution timing:** tied to the Double Entry Agent build,
not to a calendar. Once the agent's actual data-access patterns
are observable, decide which existing service each consumer
belongs in (or whether a new service shape — e.g. an
`agentSessionService`, `mfaStatusService` — is warranted) and
move them in one coherent pass.

**Current containment (post partial-resolution arc):**
- `apps/web/eslint.config.mjs` carries a narrow `src/agent/**`
  exemption added 2026-04-30 referencing this question by name.
  The 4 route handlers and `src/services/**` continue to enforce
  the rule normally; the exemption scopes to exactly the 3
  agent-runtime files left here.
- `.github/workflows/ci.yml` previously filtered `@chounting/web`
  out of the `lint` and `build` jobs via `--filter=@chounting/demo`.
  With the exemption in place, that filter can be removed (the
  `lint` and `build` jobs now pass on `@chounting/web`).
- `docs/03_architecture/monorepo.md` "Pre-existing baseline"
  section has been updated to reflect the 7→3 narrowing.

**Blocks:** none currently; the narrowed exemption keeps CI
unblocked and the 3 deferred sites trackable. When Q33 closes
(agent-runtime refactor lands), the exemption block is deleted
and the rule regains full coverage.

**Related:** Q34 (filed alongside this update) — should
`ai_actions` lifecycle mutations have their own permission keys?
Resolution gated on Q33 closure.

**Source:** Pattern 3 monorepo migration, 2026-04-30; partial
resolution arc 2026-04-30 (4-of-7 cleared).

---

## Section 4 — Formalization candidates

Distinct category from Sections 1-3. These are NOT architectural
uncertainty — they are decisions or patterns that have already
demonstrated themselves through repeated successful use, and are
awaiting a focused write-up to give them a stable home where
they're easier to find and easier to cite. The friction journal
is the right home for a pattern until it has survived enough
incidents to warrant a crisper, more stable record.

### Candidate F1 — ADR-002: Subagent brief structure for delegated coding tasks

**Status:** demonstrated through 5 consecutive zero-drift
subagent invocations during Phase 1.1 closeout (Phase 12B, 13B,
14B, 15B, 17B). Brief structure: literal-for-interfaces (exact
imports, exact function signatures, exact error handling
patterns), descriptive-for-behaviors (layout, styling). Both the
review checklist and the runtime smoke tests confirmed
zero structural drift across complexity tiers (mechanical
routes, complex forms, navigation views, specialized forms,
dual report views).

**What the ADR would establish:**

- The brief structure as the canonical pattern for delegated
  coding work in Phase 1.2 and beyond.
- The counterfactual — what the structure prevents from
  happening (interpretation of behavior descriptions producing
  drift; under-specified interfaces producing the wrong shape).
- Scope decision: is the ADR about coding subagents
  specifically, or about subagent briefs generally? The
  evidence is all from coding tasks; claiming broader scope
  without evidence would weaken the ADR.

**What writing it well needs:**

- A focused session (not the spare attention of another commit
  with substantial work in flight).
- A survey of the five zero-drift invocations as evidence, with
  the literal-vs-descriptive framing distinction drawn
  precisely from the briefs that worked.
- A decision on scope (coding-specific vs general).

**Sources:**

- friction-journal entries 2026-04-14, 2026-04-15, 2026-04-16,
  2026-04-17, 2026-04-13 (the five zero-drift NOTE entries).
- The most explicit pattern statement is the 2026-04-17 entry:
  "All four runtime bugs (13B useWatch, 14B.1 chart_of_accounts,
  15B money type) came from brief-author runtime assumptions,
  not subagent execution. The brief-writing step is the quality
  bottleneck."

**This is certainty awaiting formalization, not architectural
uncertainty.** The pattern works; the question is when a focused
session writes the ADR. The candidate is removed from this file
when ADR-002 lands under `docs/07_governance/adr/`.
