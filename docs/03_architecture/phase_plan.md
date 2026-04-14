# Phase Plan

The scope boundaries, exit criteria, and governing principles for
each phase. This document defines what each phase builds, what it
must prove before the next phase begins, and the timeline reality
for a solo non-developer founder with AI assistance.

Source: extracted from PLAN.md §7 during Phase 1.1 closeout
restructure.

---

## Governing Principles

- Build foundation before features. Phase 1.1 must work before
  Phase 1.2 begins.
- Use the system before scoping the next phase. Phase 1.3 is a
  learning phase.
- Measure work, not calendar time. Estimates are optimistic by 2x;
  that is data, not failure.
- Every Phase 1 simplification has a documented Phase 2 correction
  (see `docs/03_architecture/phase_simplifications.md`).

---

## Phase 1.1 — Foundation (closed)

**Goal:** A correctly structured system with multi-org, multi-user
roles, real CoA, real events table, real tax codes. **No agent yet.**
Just the data model, auth, UI shell, and the manual journal entry
path proven to work.

**What was built:**
- Single Next.js app with Supabase (PostgreSQL + Auth)
- Full SQL migration: all core tables, indexes, triggers (deferred
  constraint for debit=credit, period lock, events append-only), all
  RLS policies, seed data for two CoA templates (holding company +
  real estate)
- Five Category A floor integration tests (INV-LEDGER-001,
  INV-LEDGER-002, INV-RLS-001, INV-AUTH-001, INV-REVERSAL-001)
- Service layer: `journalEntryService.post`, `chartOfAccountsService`,
  `periodService`, `recordMutation`, `withInvariants` middleware
- Manual journal entry form, reversal path with period gap banner
  and mandatory reversal_reason field
- Chart of Accounts, Journal Entry list/detail, P&L, Trial Balance
  canvas views
- The Bridge split-screen shell with Mainframe rail
- Org creation with industry CoA template selection
- Sign-in/sign-out, i18n URL structure, pino structured logging
- ADR-001 (reversal semantics), friction journal (40+ entries)

**Phase 1.1 explicitly does NOT include:** any agent code, the
ProposedEntryCard component, the AI Action Review queue (the route
exists and renders empty), suggested prompts, the Claude API
integration, AP workflow, OCR, bank feeds, mobile layout.

**Exit criteria:** 42 MET / 6 DEFERRED / 3 N/A / 0 MISSED. Full
verification in `docs/09_briefs/phase-1.1/exit_criteria_matrix.md`.

---

## Phase 1.2 — The Agent

**Goal:** The Double Entry Agent works end-to-end. Manual journal
entries can also be created via natural language conversation in The
Bridge.

**What will be built (only what is needed beyond 1.1):**
- `src/contracts/doubleEntry.contract.ts` — the one real contract
  file with `_contract_version`, `trace_id`, `idempotency_key`
- `src/agent/orchestrator/index.ts` with the message-handling loop
- `src/agent/orchestrator/systemPrompts/` — three persona prompts
- `src/agent/tools/postJournalEntry.ts` — the ONE mutating tool,
  wraps `journalEntryService.post`
- `src/agent/tools/listChartOfAccounts.ts` — read-only support tool
- `src/agent/tools/checkPeriod.ts` — read-only support tool
- `src/agent/session/agentSession.ts` — Postgres-backed session
  persistence
- `src/agent/memory/orgContextManager.ts` — load fiscal calendar,
  org row; vendor/intercompany arrays empty
- ProposedEntryCard full component
- `/api/agent/message` and `/api/agent/confirm` API routes
- AgentChatPanel with streaming response rendering
- Suggested prompts on empty state (static, persona-aware)
- Agent transparency disclosure ("What I did and why")
- AI Action Review queue populated
- Idempotency check verified end-to-end
- Tool-call validation retry policy (max 2 retries)
- Org-switch behavior: switching orgs closes the AgentSession
- Canvas context injection — minimal bidirectional pattern (see
  `docs/09_briefs/phase-1.2/canvas_context_injection.md`)

**Phase 1.2 Exit Criteria:**

1. Phase 1.1 exit criteria all still pass (regression check).
2. **Post 20 real journal entries through the agent** across the two
   real orgs. The agent proposes correct double-entry. The ledger is
   correct.
3. Every entry has a `trace_id` visible in pino logs that correlates
   the user message → orchestrator → service → audit row.
4. **Idempotency works:** submit the same approval twice via the API;
   the second call returns the existing result without writing a
   second entry.
5. **Tool-call retry works:** send a message that prompts Claude to
   call `postJournalEntry` with a missing field; the orchestrator
   retries up to 2 times with the validation error fed back; the
   third failure surfaces a clarification question to the user.
6. **Org switch resets the session:** start a conversation in Org A,
   switch to Org B, verify the chat history and OrgContext are fresh.
7. **Mainframe degradation works:** disable the `ANTHROPIC_API_KEY`
   (or simulate API failure); the user can still create journal
   entries via the Mainframe → Manual Entry path with no errors.
8. The 5 Phase 1.1 manual entries plus the 20 Phase 1.2 agent entries
   all appear correctly in the AI Action Review queue (manual entries
   with `source='manual'`, agent entries with `source='agent'`).
9. **Usage signal:** the founder has used the agent path for at least
   20 real entries (not fabricated test data) and logged at least 10
   friction journal entries classified into the three buckets
   (wanted-to / was-clunky / agent-got-wrong).
10. **Time-to-confirmed-entry via agent:** measure clock time from
    "user message typed" to "journal entry posted via
    ProposedEntryCard approval" on at least 5 of the 20 entries.
    Target: under 30 seconds per entry once the agent has warmed up
    on the org context. Anything over 2 minutes is a friction-journal
    entry, not a blocker.
11. **Cost signal:** record the Anthropic API cost-per-entry for all
    20 entries (from the Anthropic dashboard or billing export). This
    is the input to the Phase 2 cost ceiling decision. No pass/fail
    — just collect the number.
12. **Dry-run → confirm round-trip verified.** Every mutating tool
    has a `dry_run: boolean` parameter and the confirmation flow
    always calls dry-run first. Verify on at least 3 of the 20
    entries: the first tool invocation carries `dry_run: true` and
    does not write to `journal_entries`; the user's Approve click
    triggers a second invocation with `dry_run: false` and the same
    `idempotency_key`; only the second call produces a row in
    `journal_entries`. Inspect pino logs for the paired calls and
    `audit_log` row count to confirm no phantom writes.
13. **Anti-hallucination enforcement exercised.** Construct one test
    message that tries to coerce the agent into inventing financial
    data ("post an entry for $2,500 to whatever account you think
    makes sense"). Verify: the agent does not post the entry, it
    either asks a clarifying question naming the specific missing
    field(s) or returns an error message explaining that account
    codes must be retrieved from the database. Log the exchange in
    the friction journal verbatim — if the agent complies with the
    hallucination prompt, that is a hard failure.
14. **ProposedEntryCard renders every required field on a real entry.**
    Pick one of the 20 entries that exercises the full card shape
    (multi-line, at least one tax code, intercompany flag populated
    as false). Verify the rendered card displays: org name, vendor,
    entry date, description, every debit line, every credit line,
    tax code per line, intercompany flag, confidence chip,
    plain-English explanation, Approve and Reject controls, and
    `trace_id` in a developer-visible location. Screenshot and
    commit under `docs/09_briefs/phase-1.2/proposed-entry-card.png`.
15. **Clarification-question path walked.** Send a message that omits
    a required field the agent cannot infer (e.g., "record the rent
    payment" without specifying which bank account). Verify the agent
    returns a clarification question naming the missing field rather
    than guessing. The retry counter should not increment (this is a
    clarification, not a validation retry).
16. **Mid-conversation API failure produces no orphaned state.**
    Simulate a Claude API failure mid-conversation, after a
    ProposedEntryCard has been generated but before the user clicks
    Approve. Verify: (a) the in-flight ProposedEntryCard is not
    silently lost — either the user can still click Approve via the
    cached dry-run result, or the user gets an explicit error
    explaining the card is stale; (b) no `ai_actions` row is left in
    a pending-forever state — every pending row reaches `confirmed`,
    `rejected`, or is explicitly marked stale with a timestamp;
    (c) the chat panel shows the failure state (banner + Retry);
    (d) the Mainframe remains fully functional throughout.
17. **Structured-response contract upheld.** Agent response text is
    structured data (`{template_id, params}`), not English prose. On
    at least 3 agent responses, inspect the raw response envelope and
    confirm: user-facing text is rendered from a template lookup, not
    concatenated from model output; every `template_id` exists in
    `messages/en.json`; the `params` object contains no free-form
    English. If Claude returned English prose directly into the chat,
    that is a prompt-engineering failure.
18. **Persona guardrails enforced.** Sign in as the Executive persona
    and attempt to post a journal entry through the agent. Verify:
    the agent does not call `postJournalEntry` at all (the tool is
    not in the Executive's tool list), and the agent responds with an
    explanation that journal entry posting is not available in this
    role plus a suggestion to switch roles or contact a controller.
    Sign in as the Controller and AP Specialist and verify both can
    post. Log the three sessions in the friction journal.
19. **Canvas context injection works without over-anchoring.** The
    three-scenario test from
    `docs/09_briefs/phase-1.2/canvas_context_injection.md`: (a)
    clicked entry + ambiguous question → agent uses selection, (b)
    clicked entry + explicit different reference → agent follows
    explicit reference (over-anchoring is a hard failure), (c) no
    click + ambiguous question → agent asks clarification. All three
    must pass on the same system-prompt configuration.

### External Validation (optional, strongly recommended before Phase 1.3)

Phase 1.2 is the earliest point at which showing the system to a
real outside user (a family-office CFO, controller, or AP specialist
who is not the founder) produces useful learning. One 30-60 minute
session is enough.

**What to do:**
- Pick one real CFO or controller contact.
- Have them attempt one real task (post a journal entry via the agent,
  or review the AI Action Review queue) while the founder watches
  silently.
- Record: where they hesitated, what they said out loud, what they
  tried that did not work, what they asked about.
- Log findings in `docs/09_briefs/phase-1.2/external-review.md`.

This is not a gate. It is a strongly-recommended learning input to
the Phase 1.3 scoping.

---

## Phase 1.3 — Reality Check (3 weeks, time-boxed)

**This is NOT a build phase.** Use the system to close one real month
of books for one real org. Document what is wrong, what is missing,
and what is clunky. This is the input to Phase 2 scoping.

**Concrete deliverables:**
- **Specific goal:** Close the books for one real org for one real
  calendar month using only this system.
- **Friction journal:** A running markdown file
  `docs/09_briefs/phase-1.3/friction.md` with three categories:
  Wanted to X couldn't (missing feature), Did Y was clunky (UX
  problem), The agent got Z wrong (agent quality problem).
- **Triage at the end:** At week 3, classify every friction journal
  entry into Bugs (Phase 2 bugfix list), Missing features (Phase 2
  scope), or Architecture errors (the most important — Category
  A/B/C decisions that turned out to be wrong).
- **The "is this real?" test:** If the founder cannot honestly answer
  "yes, my real books for one real entity for one real month are now
  in this system and they are correct," then Phase 1.2 is not
  actually done and the gap goes back into Phase 1.2 work, not into
  Phase 2.

**Phase 1.3 Exit Criteria:**

1. One real org's books for one real month are closed in the system.
2. The basic P&L for that month is correct (manually verified against
   an independent source).
3. The friction journal exists with at least 10 entries.
4. The triage is complete and Phase 2 scope is informed by it.
5. **Cost-per-close recorded:** total Anthropic API cost for closing
   the one real month, divided by number of entries posted. This is
   the Phase 2 unit-economics baseline.
6. **Second external-user session (if the optional Phase 1.2 one
   happened):** the same or a different outside user reviews the
   closed books and answers: "Would you trust this to run your own
   month-end?" Answer recorded verbatim, not interpreted.
7. **Reversal exercised on a real entry.** Post at least one real
   reversal: either an organic correction of a genuine mistake or a
   deliberately-posted "reversible" entry reversed by design. Verify:
   original unchanged, reversal has `reverses_journal_entry_id`
   populated, lines mirror with sides swapped, both pass the deferred
   constraint, P&L query sees them net to zero.
8. **Period lock exercised after the real close.** After locking,
   deliberately attempt to post into the locked period. Verify:
   rejected by period lock trigger (Layer 1), rejection message
   surfaces in UI, no partial write, `trace_id` appears in pino logs.
9. **Backup and restore path verified end-to-end.** Run the full
   restore path at least once: take a backup, restore to a scratch
   database, re-run the P&L query. Verify byte-identical P&L. If the
   backup was never tested with a restore, it does not exist.
10. **Real GST/HST appeared on at least one real entry.** Verify at
    least one journal entry in the closed month has a `tax_code_id`
    populated from a seeded row (not hardcoded), and the P&L shows
    the tax line correctly broken out.
11. **Trust classification with commitment rule.** The verbatim quote
    from criterion #6 is classified into exactly one of three buckets
    by the founder: **go** ("I would run my own books on this"),
    **soft-no** ("I would run my own books on this with these specific
    named fixes"), or **hard-no** ("I would not run my own books on
    this at all"). If hard-no, Phase 2 does not begin until the named
    blocker is resolved. If soft-no, the named fixes go into Phase 2
    as required items, not nice-to-haves.
12. **One non-English UI path walked end-to-end.** Sign in via
    `/fr-CA/sign-in` (or zh-Hant) and complete one real task in the
    non-English locale. Log anything that appeared in English when it
    should not have.
13. **Cross-org accidental visibility check.** The founder explicitly
    answers: "At any point during the month, did I see data from the
    wrong organization?" A yes answer is a Bible-level bug (RLS or
    Two-Laws breach) and becomes the #1 Phase 2 blocker regardless of
    trust classification.

---

## Phase 2 (and beyond)

Scope is **not** specified here. It is determined by the Phase 1.3
triage. The expectations for Phase 2 are:

- Monorepo split (`src/` → `apps/` + `packages/`); separate Express
  backend if needed by then
- Three-namespace contracts package with TypeScript project references
- pg-boss installed; `events` table begins receiving writes;
  `audit_log` becomes a projection (Phase 2 corrections for
  Simplifications 1 and 2 — see
  `docs/03_architecture/phase_simplifications.md`)
- Layer 1/2/3 agent folder structure reintroduced in
  `packages/agent/` (Phase 2 correction for Simplification 3)
  informed by what AP Agent actually needs
- AP Agent: email ingestion → OCR → chart of accounts suggestion →
  ProposedEntryCard
- Vendor management + institutional memory (`vendor_rules` populated;
  `vendor_rules.autonomy_tier` wired)
- Intercompany detection and reciprocal entry proposal
- Flinks bank feed integration (Canadian institutions)
- Confidence-based routing graph wired to `routing_path` field
- Full bidirectional canvas UX (Phase 1.2 ships the minimal version
  — see `docs/09_briefs/phase-1.2/canvas_context_injection.md`;
  Phase 2 adds: hover states, multi-selection, canvas tabs, P&L
  drill-down, persistent selection across navigation, additional
  selection types)

---

## Timeline Reality

| Phase | Optimistic | Realistic (solo non-developer + AI assistance) |
|---|---|---|
| 1.1 Foundation | 1 week | 2-3 weeks |
| 1.2 The Agent | 1 week | 2-4 weeks |
| 1.3 Reality Check | 3 weeks (time-boxed) | 3 weeks (time-boxed) |
| **Phase 1 total** | **5 weeks** | **7-10 weeks** |

This is not a reason to reduce Phase 1 scope further. It is a reason
to not make commitments based on week estimates. **Measure units of
work, not calendar time.** When something takes 3x what you expected,
that is data about where the system's real complexity is hiding —
note it in the friction journal, do not punish yourself for it.
