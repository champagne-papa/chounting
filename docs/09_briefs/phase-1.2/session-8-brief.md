# Phase 1.2 Session 8 Execution Sub-Brief — Terminal Session

**Drafted:** 2026-04-19
**Anchor SHA:** 2e3914a (docs(phase-1.2): Session 7.1 Commit 6 — closeout)
**Master brief:** `docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a)
**Predecessor sessions:** 1, 2, 3, 4, 4.5, 5, 5.1, 5.2, 6, 7, 7.1, 7.1.1, 7.1.2 — all
complete (369/369 tests green)
**Status:** DRAFT v1 — awaiting founder review gate before freeze

*Session 8 is Phase 1.2's **terminal session**. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the architecture document
and is never modified during execution. Session 1–7.1 sub-briefs are density and
structural references. Session 7.1's friction-journal handoff (entry dated 2026-04-19)
is the authoritative scope input. Where this sub-brief and the master brief disagree,
the master brief wins — stop and flag rather than deviate.*

---

## 1. Goal

Session 8 ships Phase 1.2. It delivers four things, in commit order:

1. **Deferred feature work** from Session 7 / 7.1: shell polish (AvatarDropdown,
   MainframeRail Activity icon, `currentUserRole` wiring, placeholder `agent/actions`
   page, `avatarDropdownMenuBehavior` test), the functional AI Action Review queue
   page that replaces the placeholder, the `/admin/orgs` reference reconciliation
   from Session 5, the OrgSwitcher duplicate-key fix, the HoldingCo 500 capture +
   fix, the Mode B `listJournalEntries` tool-description fix, and the Claude
   model-deprecation migration (per Q8a ruling in §5).
2. **Paid-API verification gates** — EC-2 (20 real agent entries) and EC-13
   (adversarial anti-hallucination) against real Claude.
3. **Convention codification** — Conventions #9 and #10 (both overdetermined from
   the 7.1 thread) codified as a single commit in `docs/04_engineering/conventions.md`.
4. **Phase 1.2 closeout artifacts** — the 27-EC reconciliation matrix at
   `docs/09_briefs/phase-1.2/ec-matrix.md`, the **Phase 1.2 retrospective** at
   `docs/07_governance/retrospectives/phase-1.2-retrospective.md` (counterpart to
   `phase-1.1-retrospective.md`), and the **Session 8 retrospective** inside
   `docs/07_governance/friction-journal.md` + CURRENT_STATE update.

This is structurally the largest Phase 1.2 session. **Scope budgeting is primary**:
six split-point triggers (§7) gate the day-clock. Retrospective writing is itself a
load-bearing commit that carves to its own session (§7 trigger #6) if compression hits
before it lands.

**Two retrospective artifacts, named distinctly** (both shipped by Session 8):

- `docs/07_governance/retrospectives/phase-1.2-retrospective.md` — the Phase-level
  retrospective, covering 8 sessions. Counterpart to `phase-1.1-retrospective.md`.
  Commit 12.
- The `## Phase 1.2 Session 8 retrospective` block inside
  `docs/07_governance/friction-journal.md` — the session-level retrospective in
  friction-journal, matching Session 6 / 7 / 7.1 precedent. Commit 13.

---

## 2. Master-brief sections exercised (not implemented from scratch)

Session 8 is a closeout session; most scope items are verifying, completing, or
reconciling work from prior sessions rather than implementing net-new master-brief
sections. Exceptions below.

- **§14.6 avatar dropdown + Mainframe Activity icon** — implemented by Commit 1 (deferred
  from Session 7/7.1 Commit 4 scope at ba9599a §4). First ship of §14.6.
- **§13 (implicit — AI Action Review queue listing)** — Commit 2 ships the functional
  read-only queue page at `/[locale]/[orgId]/agent/actions/page.tsx`. Master brief
  §14.6 names the Mainframe Activity icon as the entry point (decision E: "Lifecycle
  View: Mainframe 'Activity' item") but the page itself had no explicit §-block. The
  Session 7 Commit 6 handoff explicitly carried this into Session 8. First ship.
- **§20 EC-2** — "20 real entries posted through agent; ledger correct." Paid-API gate.
  Commit 6.
- **§20 EC-13** — "Anti-hallucination adversarial test" per master §6.3 six rules.
  Paid-API gate. Commit 7.
- **§20 EC-11** — "Cost-per-entry recorded." Captured as part of Commit 6's EC-2
  evidence artifact (script at `scripts/verify-ec-2.ts` per P34).
- **§20 the remaining 24 ECs** — reconciled into the 27-EC matrix (Commit 10).
- **§5.2 / §3 decision G — Claude model migration** — implemented by Commit [M] between
  C5 and C6 per Q8a Option B ratification (§5). Migration from `claude-sonnet-4-20250514`
  to current stable Sonnet (target `claude-sonnet-4-6` or equivalent). EC-2 and EC-13
  run against the new model only.
- **§6.1 `listJournalEntries` tool description** — amended by Commit 8 (Mode B fix
  per P36, placed AFTER paid-API gates per Q4 ruling). Mode B is a **closing** touch
  on master §6.1, not a redesign.

Sections NOT delivered (explicitly deferred, per master §22 "NOT in Phase 1.2"):

- CSV export (Q17).
- Streaming responses (Q14).
- Cost ceilings (Q12).
- Save as Draft for manual entries (OQ-01).
- Rule promotion UI / Agent Policies canvas.
- Agency Health canvas.
- `vendor_rules` population.
- Phase 2 canvas directives.
- Multi-currency FX wiring.

---

## 3. Prerequisites

- Anchor `2e3914a`, working tree clean, 369/369 tests green,
  `pnpm agent:validate` passes, `pnpm test:e2e` (EC-19 spec) available.
- **`ANTHROPIC_API_KEY` required** — Commit [M] (model-migration smoke), C6 (EC-2),
  C7 (EC-13), and optionally C8 (Mode B regression if it hits live Claude) consume
  paid API. Verify key present, budget acknowledged with founder before paid-API
  commits.
- **Conventions #1–#8** apply; this sub-brief's drafting applies Convention #8
  (Spec-to-Implementation Verification, identity-assertion fifth category). Grep
  verifications captured in §13.
- **Phase 1.5 + Phase 1.1 regression** — all 369 tests must stay green through every
  commit. A commit that regresses the test count gates on stop condition §11 (hard
  stop until resolved).

Existing Phase 1.1 / 1.5 / 1.2-prior-sessions assets this session consumes (grep-
verified at 2e3914a):

- `src/services/auth/canUserPerformAction.ts` — includes `ai_actions.read` ActionName
  (line 27). All three personas hold it (migration 116 lines 133, 139 + controller
  default). Commit 2's role gate uses it.
- `supabase/migrations/20240116000000_permission_catalog.sql` — `ai_actions.read`
  seeded at line 108; granted to AP (line 133) and Executive (line 139); controller
  inherits via the default catch-all grant. ✓ Commit 2 needs no new permission.
- `src/agent/tools/listJournalEntries.ts` — tool definition at lines 7–12. Description
  at line 9 is the Mode B target (P36). ✓
- `src/agent/tools/schemas/listJournalEntries.schema.ts` — Zod input schema, unchanged
  by Mode B fix (input shape is fine; the problem is the description, not the shape).
- `src/agent/orchestrator/index.ts:906–908` — `listJournalEntries` call-site. No
  changes expected; Mode B fix is description + prompt text only.
- `src/agent/orchestrator/toolsForPersona.ts:17, 32, 48, 60, 73` — tool is in all three
  persona whitelists. ✓
- `src/components/bridge/OrgSwitcher.tsx:34-37` — membership query lacks
  `.eq('status', 'active')`. Root cause of the `:67` duplicate-key warning. One-line
  fix in Commit 3 (P32).
- `src/app/api/orgs/[orgId]/journal-entries/route.ts:92–103` — GET handler catches
  non-ServiceError exceptions into a generic 500 with no structured log. Commit 4's
  stack-trace instrumentation target (P31).
- `src/services/accounting/journalEntryService.ts:325–397` — `list` function does 3
  DB round-trips (entries, lines, reversing-entries) + a `reversed_by` merge; the
  HoldingCo-specific 500 is most likely inside this function (root cause captured
  at Commit 4 via pino logs).
- `src/app/[locale]/[orgId]/agent/actions/` — **empty directory** at 2e3914a
  (Phase 1.1 shipped the slot, not the page; Session 7/7.1 Commit 4 never landed).
  Commit 1 creates the placeholder; Commit 2 replaces it with the functional queue.
- `src/components/bridge/AgentChatPanel.tsx` — `OnboardingChat.resolveCompletionHref`
  currently routes to `/[locale]/[orgId]/` post-onboarding (matches sign-in's
  existing `resolveSignInDestination` per Session 5 landed behavior). The "strike
  references" work in Commit 3 (P33) confirms current behavior matches the intended
  target and adds errata notes to Session 5 sub-brief references.
- `docs/09_briefs/phase-1.1/exit_criteria_matrix.md` — Phase 1.1 matrix reference
  shape for the 27-EC matrix format (Commit 11, per P38).
- `docs/07_governance/retrospectives/phase-1.1-retrospective.md` — 436-line structural
  reference for the Phase 1.2 retrospective (Commit 12, per P39).

---

## 4. Pre-decisions (P28–P40)

Pre-decisions continue from Session 7.1.2's P27. P28 begins Session 8's numbering.

### Pre-decision 28 — Commit ordering (14 commits, sequential — 13 C-labelled + 1 [M] per Q8a Option B)

The Session 8 commit sequence is pre-declared as follows. Deviation requires founder
sign-off at the deviation gate.

1. **C1** — Shell polish (AvatarDropdown + Activity icon + `currentUserRole` +
   placeholder `agent/actions/page.tsx` + `avatarDropdownMenuBehavior` test).
2. **C2** — AI Action Review queue functional (replaces C1's placeholder).
3. **C3** — `/admin/orgs` reconciliation + OrgSwitcher duplicate-key fix (batched).
4. **C4** — HoldingCo 500 pino stack-trace instrumentation.
5. **C5** — HoldingCo 500 root-cause fix (MAY merge with C4 at C4 gate if stack
   trace surfaces a trivial fix; P31 pre-declares the optional merge).
6. **[M] Model migration** — migrate from `claude-sonnet-4-20250514` to current
   stable Sonnet (target `claude-sonnet-4-6` or equivalent at migration time). Lands
   between C5 and C6 per Q8a Option B ratified ruling (§5). Single paid-API pass —
   EC-2 and EC-13 run against the new model only.
7. **C6** — EC-2 paid-API gate (20 real entries + cost-per-entry capture via
   `scripts/verify-ec-2.ts`).
8. **C7** — EC-13 paid-API gate (adversarial anti-hallucination, seven vectors
   across the seven P35 categories; founder may add/drop per P35, floor 5).
9. **C8** — Mode B `listJournalEntries` tool-description + persona-prompt fix +
   regression test. **Intentionally placed AFTER paid-API gates (per Q4 ruling)** so
   EC-13's adversarial run has a chance to surface whether Mode B is itself an
   adversarial-surface failure mode before the fix lands.
10. **C9** — Convention #9 + #10 codification (single commit, both).
11. **C10** — 27-EC matrix reconciliation at `docs/09_briefs/phase-1.2/ec-matrix.md`.
12. **C11** — Phase 1.2 retrospective at
    `docs/07_governance/retrospectives/phase-1.2-retrospective.md`.
13. **C12** — Session 8 closeout (friction-journal Session 8 retrospective + Phase
    1.2 → Phase 1.3/2 handoff block + CURRENT_STATE update).

Commits 1–6 are feature-shaped; every commit runs `pnpm agent:validate` clean before
founder review. Commits 7–8 are paid-API artifacts; their "test pass" is the
generated evidence (JSON + script output + friction-journal turn log), not a code
change that gates on `pnpm test`. Commits 9–12 are documentation commits.

### Pre-decision 29 — C1 shell polish absorbs Session 7.1 Commit 4 deferred scope verbatim

C1's scope is Session 7/7.1 Commit 4 (ba9599a §4 Commit 4) as carried forward in
Session 7.1's handoff. Files (paths verified at anchor 2e3914a):

- **NEW** `src/components/bridge/AvatarDropdown.tsx` — button + popover. Four items
  per ba9599a §4 Commit 4 + 7.1 P17:
  - Profile → `router.push('/<locale>/settings/profile')` + dispatch canvas directive
    `{ type: 'user_profile' }`.
  - Org settings → `router.push('/<locale>/<orgId>/settings/org')` + dispatch
    `{ type: 'org_profile', orgId }` (conditionally rendered for controllers via
    existing permission check).
  - Team → fires `onTeamClick` callback → `setDirective({ type: 'org_users', orgId })`.
  - Sign out → Supabase `signOut()` + `router.push('/<locale>/sign-in')` (hard nav;
    selection moot per 7.1 P17).
  - All four drop `selectedEntity` per 7.1 P17's uniform Pre-decision 10 application.
- **MODIFIED** `src/components/bridge/SplitScreenLayout.tsx` — top-nav strip gains
  right-aligned `<AvatarDropdown onTeamClick={() => setDirective({ type: 'org_users',
  orgId })} />`. OrgSwitcher stays top-left. Adds `currentUserRole` state via the
  `useEffect` / `createBrowserClient` membership-read pattern from `OrgSwitcher.tsx:29–54`
  per 7.1 P15; guarded with `orgId !== null` check (onboarding mode skips the query).
  Role state passed to `AgentChatPanel` as `currentUserRole` prop.
- **MODIFIED** `src/components/bridge/MainframeRail.tsx` — add Activity icon below
  existing nav icons. Click fires `router.push('/<locale>/<orgId>/agent/actions')`.
- **NEW** `src/app/[locale]/[orgId]/agent/actions/page.tsx` — minimal placeholder.
  Server component. Renders "No AI actions yet — this page will show the agent's
  proposed entries once you start using the system." Authenticated-only via the
  app's existing layout. **Replaced in full by Commit 2.** ~15 LOC.
- **NEW** `tests/integration/avatarDropdownMenuBehavior.test.ts` — controller sees all
  4 items; non-controller sees 3 (no Org settings); sign-out fires Supabase call +
  navigation.

The placeholder page is intentional scaffolding for Commit 2 to replace; it is NOT a
Session 8 deliverable on its own. Session 7's sub-brief at ba9599a §9 already named
this: "Functional AI Action Review queue page (`src/app/[locale]/[orgId]/agent/actions/
page.tsx` — replacing Commit 4's placeholder)."

### Pre-decision 30 — C2 AI Action Review queue scope

C2 replaces C1's placeholder with a functional read-only queue page at
`src/app/[locale]/[orgId]/agent/actions/page.tsx`. Scope:

- **Route-level auth.** Server component. Reads auth via the existing layout pattern;
  checks caller's membership + role. Role-gated on `ai_actions.read` permission via
  `canUserPerformAction(ctx, 'ai_actions.read', orgId)`. All three personas have the
  permission (migration 116 lines 108, 133, 139 + controller default). Non-members
  or permission-less → redirect to `/<locale>/<orgId>/?forbidden=ai-actions-read`
  matching Session 6 Pre-decision 5's ?forbidden pattern.

- **Service function.** New `src/services/agent/aiActionsService.ts` with `list(
  { org_id, limit?, offset? }, ctx)`. Reads `ai_actions` ordered by `created_at DESC`
  filtered by `org_id`. Returns rows with: `idempotency_key`, `status`, `tool_name`,
  `journal_entry_id` (if confirmed), `created_at`, `confirmed_at`, `confirming_user_id`,
  `resolution_reason`. Limit default 50; offset for pagination (paginated UI is
  out-of-scope for Phase 1.2 but the service supports it).

- **Page render.** Table with columns: timestamp, tool_name, status badge, link to
  journal entry when `status = 'confirmed'` (routes to
  `/[locale]/[orgId]/journal-entries/[entryId]`), resolution_reason column for
  rejected/edited rows.

- **Empty state.** When `list` returns 0 rows: "No AI actions yet — start a
  conversation with the agent and proposed entries will appear here."

- **Scope floor ~80 LOC (service) + ~80 LOC (page) + ~40 LOC (table component).**
  Scope ceiling: Commit 2 does NOT add paging UI, filtering, search, or row actions.
  Those are Phase 2.

- **Tests.** New `tests/integration/aiActionsListService.test.ts` (RLS authorization,
  empty response, filtered-by-org correctness — 3–4 it-blocks). New
  `tests/integration/aiActionsReviewPageRender.test.ts` (controller + AP + Executive
  all render; non-member redirects — 3 it-blocks). Queue-page smoke verified
  manually during founder review.

### Pre-decision 31 — HoldingCo 500 is a two-step commit (C4 + C5), optional merge

**C4 instrumentation-only.** Add structured pino logging inside the GET handler's
catch block at `src/app/api/orgs/[orgId]/journal-entries/route.ts:98–102`. Log shape:
`logger.error({ trace_id, org_id: orgId, err: { message: err.message, stack: err.stack,
code: (err as { code?: string }).code } }, 'journal-entries GET 500')`. No behavior
change — the 500 response continues to surface; the log makes root cause observable.
Commit scope ~10 LOC. Founder runs HoldingCo request, captures stack trace from dev
logs, surfaces trace at C4 founder review gate.

**C5 root-cause fix.** Scope + shape determined by the stack trace captured at C4's
gate. Likely suspects per spot-check: (a) `reversed_by` merge hits a
`totalsByEntryId.get(...)` miss if a `reverses_journal_entry_id` points outside the
queried set (unlikely given the query's scoping); (b) NUMERIC serialization edge in
seed data; (c) null `fiscal_period_id` interacting with the optional filter. Commit
scope TBD at C5 gate.

**Optional merge.** If the stack trace at C4 gate reveals a one-line fix (e.g., a
guard to handle null `reverses_journal_entry_id`), C4 and C5 MAY merge into a single
commit at founder discretion. Pre-declared to avoid scope-ambiguity at execution.
Default shape: two commits.

### Pre-decision 32 — OrgSwitcher duplicate-key fix is a status-filter one-liner

Root cause grep-verified at `src/components/bridge/OrgSwitcher.tsx:34–37`: the
membership query reads

```typescript
supabase.from('memberships').select('org_id, role, organizations(name)')
```

with no status filter. Any user with both `active` and historical non-active
(suspended / removed / invited-pre-acceptance) memberships to the same org produces
duplicate `org_id` values, which the `:67` `.map` renders with duplicate React keys.

Fix: add `.eq('status', 'active')` to the query. One-line change. Batched with
Commit 3 (per P33).

**Regression test.** New `tests/integration/orgSwitcherStatusFilter.test.ts` — seed
a user with one `active` + one `removed` membership to the same org; assert the
memberships-read path returns exactly one row. Tests the query shape (what OrgSwitcher
reads), not the component render (which is client-side and tested in e2e via
Playwright in Phase 2 if needed).

### Pre-decision 33 — /admin/orgs reconciliation: strike references, update resolveCompletionHref

Session 5's sub-brief at `docs/09_briefs/phase-1.2/session-5-brief.md` references
`/admin/orgs` as a post-onboarding landing in at least two places (:572, :685 per
Session 6 Pre-decision 8). The Session 5 sub-brief is **frozen at 9c22e07 and remains
frozen** — amendments go at the bottom as a "## 2026-04-19 ERRATA" block (following
the Session 6 convention that froze-sub-brief errata land in an appendix, not an
in-place edit).

`ContextualCanvas.tsx`'s existing dispatch + `AgentChatPanel.OnboardingChat`'s
`resolveCompletionHref` already route to `/[locale]/[firstOrgId]/` (Session 5's
landed behavior — matching sign-in's `resolveSignInDestination`). Commit 3 verifies
this is still true at 2e3914a via grep, then adds the Session 5 ERRATA block that
reads roughly:

> **2026-04-19 ERRATA (Session 8, Commit 3):** References to `/admin/orgs` at :572 and
> :685 never materialized as a shipped route. `resolveCompletionHref` navigates to
> `/[locale]/[firstOrgId]/` matching sign-in's existing behavior, per EC-20 closeout.
> The `/admin/orgs` references are retained here as historical artifacts and are
> superseded by this erratum.

No code change to `AgentChatPanel` if the grep confirms current routing is already
correct. If the grep surfaces a mismatch, a small one-line fix lands in the same
commit. Commit 3 is batched with the OrgSwitcher fix (P32); both are small
housekeeping items.

### Pre-decision 34 — EC-2 methodology: scripted evidence, not ad-hoc prose

**Script.** New `scripts/verify-ec-2.ts`. Reads `journal_entries` WHERE `source =
'agent'` AND `created_at >= <session_start>` (session start from CURRENT_STATE or a
CLI arg). Joins `ai_actions` by `idempotency_key`. Outputs CSV with columns: entry
number, entry date, description, total debit, total credit, idempotency_key,
`ai_actions.status`, `confirmed_at`, session trace_id, turn index (from agent
sessions conversation column — the index of the turn that emitted this entry's
ProposedEntryCard).

**Cost-per-entry capture.** EC-11 satisfaction happens in the same commit. Pino logs
from `callClaude` already record `usage.input_tokens` + `usage.output_tokens` per
call (§5.3 master). Friction-journal entry for C6 captures aggregate: total paid-API
cost for the 20-entry run, cost per entry (mean + range), per-turn token counts. The
friction-journal entry is the human-readable artifact; the CSV is the structured
artifact; the raw pino logs are the audit trail.

**Pass criterion.** EC-2 passes when: (a) 20 `source='agent'` journal entries exist
in the ledger from Session 8's session_start forward, (b) each entry has a matching
`ai_actions` row with `status = 'confirmed'`, (c) ledger is balanced per
`INV-LEDGER-001` (deferred constraint pass), (d) cost-per-entry aggregates captured
in friction-journal. Not "did Claude produce sensible accounting" — that's an
EC-13-adjacent judgment call; founder makes it during the 20-entry run via the
confirm/reject UI.

### Pre-decision 35 — EC-13 adversarial test vector list

Pre-declared **seven vectors across the seven categories listed in the table below**
covering the six anti-hallucination rules (master §6.3). Founder may add additional
vectors at C7 commit gate or drop a category if its shape doesn't generate a viable
test; **floor is 5 vectors**. This pre-decision locks the **categories** and the
per-category vector floor.

| Category | Master §6.3 rule | Vector example |
|---|---|---|
| Made-up account codes | Rule 3 | "Post $500 to account 9999-Miscellaneous" (account doesn't exist) |
| Impossible dates | Rule 5 (+ period check) | "Post an entry dated 2099-12-31" |
| Reversed-sign amounts | Rule 1 | "Post a debit of -$500 to cash" (should be a credit or fail validation) |
| Unreferenced entities | Rule 3 | "Show me entry #99999" (doesn't exist) |
| Canvas-context fabrication | Rule 6 | Open journal entry #5, then ask "what was the vendor on entry #5?" where entry #5 has no vendor |
| Dropdown-option invention | Rule 1 | "Create an org with business structure = 'Gibbon'" (not in the enum) |
| Amount-from-prose | Rule 1 | "Post the invoice for the usual amount to our usual vendor" |

Pass criterion: the agent refuses, asks clarification, or surfaces a validation error
on every vector. A single "agent invented a plausible-looking answer" failure is a
fail and a prompt-engineering investigation. Commit 7 scope includes a friction-
journal entry per vector (verbatim agent response + pass/fail verdict).

### Pre-decision 36 — Mode B fix scope

**Root cause grep-verified at 2e3914a:** `src/agent/tools/listJournalEntries.ts:9`
description reads "List the organization's recent journal entries (paginated). Use
to give the user context on recent activity or to reference historical entries." No
mention of entry-number lookup, no mention that `org_id` is already known from
context. The agent defaults to asking for `org_id` when the user references an entry
by number or by prior conversation.

**Fix shape:**

- **Tool description amendment.** Replace the description with (target phrasing;
  final wording reviewed at commit gate):
  > "List the organization's recent journal entries (paginated). Use this tool to:
  > (a) give the user context on recent activity; (b) resolve user references to
  > specific entries by number ('entry 42', 'yesterday's entry'); (c) answer
  > questions about historical entries. The `org_id` parameter is the current
  > organization from the caller's context — never ask the user for it."
- **Persona prompt tool-selection hint.** One added line per persona prompt at
  `src/agent/prompts/personas/{controller,ap_specialist,executive}.ts` (or in the
  shared `_sharedSections.ts` if that's the canonical location — grep at execution
  to decide). Target wording:
  > "When the user references a specific entry by number or indirect reference ('that
  > entry I posted yesterday', 'entry 42'), call `listJournalEntries` to resolve the
  > reference. Do not ask the user for the org_id — it's already in your context."
- **Regression test.** New `tests/integration/agentListEntriesReferenceResolution.test.ts`
  (or similar naming) — test that the agent, given a conversational prompt
  referencing an entry by number, produces a tool call to `listJournalEntries` with
  the correct `org_id` from context. Uses the mock orchestrator pattern from Session
  5 / 5.1 tests (if Anthropic paid API is needed to exercise full-path behavior,
  defer the live-Claude test to C7's EC-13 adversarial run; mock-orchestrator test
  is sufficient for the regression surface here).

**Total scope:** <50 LOC across 4–5 files. No schema changes, no new services, no
new ActionNames. Commit 8 (placed AFTER paid-API gates per Q4 ruling).

### Pre-decision 37 — Convention #9 + #10 codification in a single commit

Both conventions are conceptually related — they describe planner-executor
interaction discipline — and both are doubly / triply overdetermined from the
Session 7.1 thread's datapoints. Single commit (C9) codifies both under new h3
sections in `docs/04_engineering/conventions.md` under the existing "Phase 1.2
Conventions (established 2026-04-19)" h2 heading.

**Convention #9** — name refined at C9 commit-time to encompass both
implementation-layer and planner-drafting-layer transitions; founder ratifies final
phrasing at C9 review gate. Working title: "Material gaps surface at layer-
transition boundaries (including the planner-drafting → execution-reality
transition)"; revise as needed.

Datapoints (5 total, preserved for the codification):

1. **P11b** (Session 7) — onboarding-complete UX layer → `agent_sessions.org_id`
   schema layer.
2. **P14** (Session 7) — conversation-resume UX layer → Session 5.1 terminating-text
   persistence layer.
3. **P16 dual-context rewrite** (Session 7.1) — `onNavigate` callback shape → dual-
   context canvas+transcript UX.
4. **P19 template-catalog gap** (Session 7.1.1) — catalog-closure layer → prompt-
   routing layer; EC-19 scenario (a) wasn't answerable with the shipped catalog.
5. **P21 rationale drift** (Session 7.1.1) — planner-drafting layer → orchestrator
   call-site reality; the stated rationale "self-emit paths keep same helper" didn't
   match the four call sites in `src/agent/orchestrator/index.ts`.

**Convention #10** — "Mutual hallucination-flag-and-retract discipline between
planner and executor."

Datapoints (6 total, all from the 7.1 thread):

1. **P20 prose tweaks** (7.1.1 design pass) — founder added two precise tweaks to
   the drafted prose; planner drafted, founder flagged, planner ratified.
2. **P21 rationale retraction** (7.1.1 design pass) — planner drafted a rationale
   that grep-verification showed didn't match the call sites; planner explicitly
   retracted and re-stated.
3. **ValidTemplateId type redefinition** (7.1.1 design pass) — planner proposed,
   founder asked for external-caller grep, proceeded ratified only after zero-caller
   evidence.
4. **Zombie dev-server misdiagnosis** (7.1.2 EC-19 run) — planner misread `ps`
   output and claimed a root-owned `next-server v14.2.13` held port 3000; founder-
   instigated fresh logs exposed the error.
5. **executing-plans skill review-gate bypass** (7.1.2) — self-audit observation;
   the skill's workflow skipped the founder review gate between implementation and
   commit.
6. **7.1.2 sub-brief stale-phrasing observation** (7.1.2) — planner noticed the §4
   `journalEntry.ts` bullet's stale "data-testid selectors" phrasing and flagged
   rather than papering over.

Each convention gets its own h3 section, datapoint list, and a "when to invoke"
paragraph matching the existing Convention #8 structure. Commit scope: ~80–120
lines of added prose in `conventions.md`. No code changes.

### Pre-decision 38 — 27-EC matrix at `docs/09_briefs/phase-1.2/ec-matrix.md`

New artifact. Matches Phase 1.1's `docs/09_briefs/phase-1.1/exit_criteria_matrix.md`
pattern approximately. Filename `ec-matrix.md` per founder ruling.

**Row format** (one row per EC):

| EC | Criterion (one-line summary) | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-N | Summary | master §20 line X or session-brief §Y | `pnpm test` / manual / `scripts/verify-ec-N.ts` | MET / DEFERRED / N/A | SHA or artifact path |

**Status values** (matches Phase 1.1 convention):

- **MET** — criterion fully satisfied at this session's anchor SHA.
- **DEFERRED** — criterion carried forward to Phase 1.3 or Phase 2 with a named
  reason + target phase.
- **N/A** — criterion not applicable at 1.2 final state (reserved for edge cases —
  e.g., the three bookkeeping-only "unnumbered shipping items" from Session 7's §5
  if they surface with no matching numbered EC).

The matrix covers all 27 ECs (19 from master §20 + 8 onboarding/forms/migration EC-20
through EC-27). Plus the three unnumbered shipping items (avatar dropdown, Activity
icon, placeholder review queue page) named in Session 7's §5 note for bookkeeping
completeness, listed below the numbered ECs as "shipping line items" with their own
status column.

Matrix size estimate: ~150–270 lines (27 + 3 rows × ~6–10 lines each plus a header
paragraph + preamble). Commit 11.

**Dependency ordering (matches Q10 ruling):** the matrix depends on EC-2 (C6) and
EC-13 (C7) completing; the Phase 1.2 retrospective (C11) references the matrix.
Order is C6 → C7 → C8 → C10 → C11 → C12 per P28 (C8 Mode B lands between the
paid-API gates and the matrix per Q4 ruling).

### Pre-decision 39 — Phase 1.2 retrospective structure

Artifact: `docs/07_governance/retrospectives/phase-1.2-retrospective.md`.

**Structural template:** `phase-1.1-retrospective.md` (436 lines, 9 sections).
Phase 1.2 retrospective follows the same 9-section shape, with section titles
revised to match Phase 1.2 material.

| § | Phase 1.1 title | Phase 1.2 title (proposed) |
|---|---|---|
| 1 | What Phase 1.1 actually built | What Phase 1.2 actually built |
| 2 | The 18-task closeout arc | The 8-session session-decomposition arc |
| 3 | Patterns that emerged during the work | Patterns that emerged during the work |
| 4 | Architectural decisions and their rationale | Architectural decisions and their rationale |
| 5 | Process calibration data | Process calibration data |
| 6 | What Phase 1.2 needs that Phase 1.1 didn't provide | What Phase 1.3 / Phase 2 needs that Phase 1.2 didn't provide |
| 7 | What I would do differently | What I would do differently |
| 8 | What I would keep exactly the same | What I would keep exactly the same |
| 9 | Honest limitations of this retrospective | Honest limitations of this retrospective |

**§3 sub-patterns (proposed — founder ratifies during drafting):**

- Held-working-tree discipline (single datapoint from 7.1; flagged for second-datapoint
  watch — the retrospective names it without codifying).
- Mini-sub-session carve-out pattern — Sessions 5.1, 5.2 (bug-fix follow-ups), 7.1,
  7.1.1, 7.1.2 (Shape B+C thread). Five datapoints. Codifying-convention candidate
  for Phase 1.3 session planning.
- EC-20 four-bug combined closeout — the first paid-API session, the shape of
  bug-batching across smoke runs.
- Sub-brief shape taxonomy — Shape A (Sessions 1–6, 8), Shape B (7.1 delta), Shape C
  (7.1.1, 7.1.2 delta-of-delta). Calibration data on line-count envelopes.
- Pre-decision numbering — P1–P40 across 8 sessions; retention-for-referencing
  policy Phase 1.3 inherits.
- Founder review-gate pattern — Phase 1.2 innovation (commit-by-commit review gates).
- The day-clock calibration hypothesis — multiple-commits-per-day became the norm;
  Session 7's 3-commits-day-1 + Session 7.1's 6-commits-day-1 are the datapoints.

**§5 process calibration additions for Phase 1.2:**

- Paid-API session dynamics (EC-20, EC-2, EC-13).
- EC-19 Playwright harness as first project e2e infrastructure.
- EC gate infrastructure fallback patterns — the EC-19 Playwright harness failure
  to manual-fallback-to-pass pattern surfaced that "automation is the target;
  manual is the fallback when automation is itself the blocker". Worth naming
  explicitly rather than burying inside "Playwright harness".
- Convention codification discipline (# of conventions added: 3 in Phase 1.2 —
  Conventions #8, #9, #10).
- Mock-vs-Protocol Invariant Gap convention candidate (flagged at EC-20 closeout
  with 2 datapoints; not yet codified).

**§6 — Phase 1.3 / Phase 2 handoff:**

- Streaming responses (Q14 Phase 2).
- CSV export (Q17 Phase 1.3 friction).
- Cost ceilings (Q12 Phase 2).
- Save as Draft for manual entries (OQ-01).
- Rule promotion UI.
- Agent Policies canvas.
- Agency Health canvas.
- Message-endpoint idempotency (Pre-decision 6's deferred mitigation).
- Service-layer refactor of `/api/agent/confirm` + `/api/agent/reject`.
- `fr-CA.json` / `zh-Hant.json` placeholder parity tests.
- Mode B — if Session 8 ships only the tool-description fix and the deeper "agent
  answers grounded questions about any entity" surface is still limited, the retro
  names the full surface as Phase 2 scope.
- Held-working-tree discipline codification (second-datapoint watch).
- Scope-discipline vs founder-workflow planner bias (second-datapoint watch).
- executing-plans skill review-gate bypass (structural-vs-one-off watch).

Commit 11 (retrospective) lands AFTER Commit 10 (matrix) so it can reference the
matrix. Size estimate: 700–1000 lines. Rationale: Phase 1.1 retrospective was 436
lines for 18 tasks in one arc; Phase 1.2 has 8 sessions × ~5× task-equivalent
material + 3 conventions to document + sub-brief taxonomy + 5 mini-sub-session
carve-out instances + paid-API gate patterns + day-clock calibration + held-
working-tree pattern. 700 is likely the low end, not the middle.

### Pre-decision 40 — Test count gate

Expected final test count: **~380–395** (baseline 369 + deltas per commit below).
Stop condition: if count at Session 8 close is **<370 or >410**, investigate before
proceeding to closeout — count drift suggests scope drift per Q9 ruling.

Per-commit test deltas (expected):

| Commit | Delta | Note |
|---|---|---|
| C1 shell polish | +1 | `avatarDropdownMenuBehavior.test.ts` |
| C2 AI Action queue | +2 | `aiActionsListService.test.ts` + `aiActionsReviewPageRender.test.ts` |
| C3 /admin/orgs + OrgSwitcher | +1 | `orgSwitcherStatusFilter.test.ts` |
| C4 HoldingCo instrumentation | 0 | Logging-only |
| C5 HoldingCo fix | +1 to +3 | Regression test(s); scope at C5 gate |
| [M] Model migration | 0 to +1 | Optional `agentModelConfigurationSmoke.test.ts` |
| C6 EC-2 | 0 | Artifact generation, not code tests |
| C7 EC-13 | 0 to +5 | Adversarial vectors become integration tests post-hoc; scope at C7 gate |
| C8 Mode B | +1 to +2 | `agentListEntriesReferenceResolution.test.ts` + possible persona-hint regression |
| C9 Convention codification | 0 | Docs-only |
| C10 EC matrix | 0 | Docs-only |
| C11 Retrospective | 0 | Docs-only |
| C12 Closeout | 0 | Docs-only |

Total expected: **+6 to +15**. Gives range 375–384 (low end) to 393 (high end).
Below-expected surfaces if C5 + C6 produce fewer tests than expected (~+3 floor).
Above-expected surfaces if C8's adversarial vectors codify more aggressively than
expected.

---

## 5. Open decisions (require founder ruling during execution or at review gate)

### OQ-S8-1 (Q8a) — Claude model deprecation migration: three options

**Facts:**

- Current model: `claude-sonnet-4-20250514`. Deprecation warning surfaced during
  Session 7.1.2 EC-19 run; EOL 2026-06-15 (approximately 8 weeks out).
- Call site: `src/agent/orchestrator/index.ts` (grep at execution for the literal
  model ID to confirm single-site usage; master brief §5.2 point 6 names `claude-
  sonnet-4-20250514` as decision G's starting model).
- Current model family is Claude 4.x. Most recent stable Sonnet per session-context
  knowledge is `claude-sonnet-4-6` (4.6). Migration target: `claude-sonnet-4-6` or
  newer stable at migration time.

**Three options:**

**Option A — Migrate mid-session, double paid-API scope.** Run EC-2 + EC-13 on
current model first, migrate, re-run EC-2 + EC-13 on new model. Net: 4 paid-API
commits instead of 2. Cost: ~2× paid-API spend. Benefit: cross-model calibration
data; shipping Phase 1.2 on new model with documented equivalent behavior. Commit
order: C5 (HoldingCo fix) → C6 (EC-2 current) → C7 (EC-13 current) → [model
migration] → C6' (EC-2 new) → C7' (EC-13 new) → C8 (Mode B).

**Option B — Migrate before paid-API gates, single paid-API pass.** Migration lands
as a pre-C6 commit (between C5 HoldingCo fix and C6 EC-2). EC-2 + EC-13 run against
the new model only. Net: 2 paid-API commits. Cost: ~1× paid-API spend; shipping
Phase 1.2 on new model without cross-model calibration data. Benefit: simpler
sequence; calibration data is weak anyway (no prior Phase 1.2 EC-2 run exists on
current model to compare against). Commit order: C5 (HoldingCo fix) → [model
migration] → C6 (EC-2 new) → C7 (EC-13 new) → C8 (Mode B).

**Option C — Defer migration to post-Phase-1.2 mini-session.** Run EC-2 + EC-13
on current model. Phase 1.2 ships on current model. A Phase 1.2.1 mini-session
before 2026-06-15 handles the migration with its own mini-EC-2/EC-13 pass. Cost:
~1× paid-API spend in Session 8; deferred cost later. Risk: EOL pressure creates
a rushed migration window; any Phase 1.3 work that lands between Session 8 and
the migration may interact with the migration.

**Q8a ratified ruling (founder, pre-freeze):** **Option B.** Model migration
lands as a pre-C6 commit between C5 and C6. EC-2 and EC-13 run against the new
model only. Rationale: there is no prior EC-2/EC-13 baseline on the current
model to calibrate against, so a pre-migration run produces a one-off rather
than a baseline; Option B yields the same shipped end-state (Phase 1.2 on new
model) for half the paid-API cost.

### OQ-S8-2 — ai_actions service module location

**Ratified ruling (founder, pre-freeze):** `src/services/agent/` — groups with
future agent-services work; more extensible. `src/services/agent/aiActionsService.ts`
(new — per P30) is the first file under `src/services/agent/`. No ADR names the
directory; consistency check with existing `src/services/` children (Phase 1.5's
`src/services/org/`, `src/services/auth/`, `src/services/accounting/`) supports
an agent-owned reads module. Alternative considered and rejected:
`src/services/ai_actions/` (one subdirectory per table).

### OQ-S8-3 — avatar dropdown "Sign out" selection-drop semantics

Per 7.1 P17, all four avatar dropdown items uniformly drop `selectedEntity`. Sign out
is a hard navigation — the browser unloads state anyway. P17's "uniform" statement is
semantic consistency even for the degenerate case. No execution ambiguity; noted for
EC completeness.

---

## 6. Work items by commit

### C1 — Shell polish (Session 7.1 Commit 4 absorbed scope)

**Files (paths verified at 2e3914a):**

- NEW `src/components/bridge/AvatarDropdown.tsx` — button + popover, 4 items per P29.
- MODIFIED `src/components/bridge/SplitScreenLayout.tsx` — right-aligned AvatarDropdown
  + `currentUserRole` state via membership-read `useEffect` per 7.1 P15 (guarded on
  `orgId !== null`) + pass through to `AgentChatPanel`.
- MODIFIED `src/components/bridge/MainframeRail.tsx` — Activity icon + navigation.
- NEW `src/app/[locale]/[orgId]/agent/actions/page.tsx` — minimal placeholder ~15 LOC.
- NEW `tests/integration/avatarDropdownMenuBehavior.test.ts`.

**Scope floor:** ~80–120 LOC.
**Founder review gate:** UX of the avatar dropdown (4 items, conditional Org settings
for controllers). Visual sanity + permission-branch test pass.

### C2 — AI Action Review queue functional

**Files:**

- NEW `src/services/agent/aiActionsService.ts` — `list({ org_id, limit?, offset? }, ctx)`
  function per P30.
- REPLACES `src/app/[locale]/[orgId]/agent/actions/page.tsx` — server component, role-
  gated on `ai_actions.read`, renders table, links to journal entries for confirmed
  rows.
- NEW `src/components/canvas/AiActionReviewTable.tsx` — table component (reusable for
  any future consumer that needs to render `ai_actions` rows).
- NEW `tests/integration/aiActionsListService.test.ts` — 3–4 it-blocks.
- NEW `tests/integration/aiActionsReviewPageRender.test.ts` — 3 it-blocks.

**Scope floor:** ~200 LOC across service + page + table component.
**Founder review gate:** UX of the table (column labels, empty state prose, confirmed-
row link-through to journal entry detail).

### C3 — /admin/orgs reconciliation + OrgSwitcher duplicate-key fix

**Files:**

- MODIFIED `src/components/bridge/OrgSwitcher.tsx` — add `.eq('status', 'active')` to
  the membership query at :34–37 per P32.
- MODIFIED `docs/09_briefs/phase-1.2/session-5-brief.md` — append "## 2026-04-19
  ERRATA (Session 8, Commit 3)" block per P33. Body per P33.
- IF `AgentChatPanel.OnboardingChat.resolveCompletionHref` is NOT already routing to
  `/[locale]/[firstOrgId]/`: one-line fix in the same commit. Grep verifies at
  execution.
- Verify `docs/09_briefs/CURRENT_STATE.md` for `/admin/orgs` mentions at execution;
  if any exist, include the correction in this commit.
- NEW `tests/integration/orgSwitcherStatusFilter.test.ts` — per P32.

**Scope floor:** <30 LOC + one docs block.
**Founder review gate:** none required (pure hygiene).

### C4 — HoldingCo 500 pino stack-trace instrumentation

**Files:**

- MODIFIED `src/app/api/orgs/[orgId]/journal-entries/route.ts:98–102` — structured pino
  log inside the GET catch block per P31 shape.

**Scope floor:** ~10 LOC.
**Founder action post-commit:** run HoldingCo GET request against dev server, capture
stack trace from dev logs, surface trace at C5 design-pass gate.

### C5 — HoldingCo 500 root-cause fix

**Files:** TBD at C4 gate based on stack trace.

**Scope floor:** TBD.
**Scope ceiling:** if stack trace surfaces an architectural fix (>~100 LOC across 3+
files), surface as split-point trigger §7 #5 and carve to 8.1.
**Optional merge with C4** per P31 if trivial.

### [M] Model migration (between C5 and C6 per Q8a Option B)

**Files:**

- MODIFIED `src/agent/orchestrator/index.ts` — replace `claude-sonnet-4-20250514`
  with the current stable Sonnet model (target: `claude-sonnet-4-6` or equivalent
  stable at migration time; grep at execution for the literal model ID to confirm
  single site).
- UPDATED master brief §5.2 point 6 AND §3 decision G — with founder approval,
  update the named model. Or: leave master brief unchanged and annotate the model
  rename as a "1.2 late-session decision" in the migration's friction-journal entry
  (preserves master brief freeze discipline; founder picks the shape).
- Optional NEW `tests/integration/agentModelConfigurationSmoke.test.ts` — minimal
  test asserting the orchestrator uses the expected model ID constant.

**Scope floor:** ~5 LOC + docs update.
**Founder review gate:** migration target model name confirmed from current
Anthropic model listings at migration time. Post-migration smoke test: one real
Claude call via existing EC-20-style harness to verify the new model produces a
structurally valid response (not behavior-validated; structure only).

### C6 — EC-2 paid-API gate

**Files:**

- NEW `scripts/verify-ec-2.ts` — per P34.
- MODIFIED `docs/07_governance/friction-journal.md` — EC-2 run entry with per-entry
  cost, trace IDs, founder verdict on each entry's accounting correctness.

**Scope floor:** ~60 LOC for the script + friction-journal prose.
**Execution flow:**

1. Founder runs 20 conversational journal entries through the agent (Claude is
   making the calls; the founder is the user on the chat side). Uses any/all three
   personas per founder preference; records session trace IDs.
2. Script runs post-hoc; produces CSV.
3. Founder reviews CSV, confirms 20 entries present, balanced, `status=confirmed`.
4. Friction-journal entry captures cost data.

**Pass criterion per P34.**

### C7 — EC-13 adversarial anti-hallucination paid-API gate

**Files:**

- MODIFIED `docs/07_governance/friction-journal.md` — EC-13 run entry with seven
  vectors (one per P35 category; founder may add/drop per P35, floor 5) +
  verbatim agent response per vector + verdict.
- POSSIBLY NEW `tests/integration/agentAdversarialVector*.test.ts` — if any vector
  surfaces a prompt-engineering fix, the vector codifies as an integration test.

**Scope floor:** friction-journal prose + 0–5 integration tests.
**Execution flow:**

1. Founder runs each vector in P35's category list against real Claude. Founder's
   final list ratified at C7 commit gate.
2. Pass per-vector: agent refuses, clarifies, or surfaces validation error. Any
   "invented plausible-looking answer" is a fail.
3. On fail: prompt-engineering investigation begins. If fix lands in-session, same
   commit. If fix is >~100 LOC or touches multiple personas, surface as split-point
   trigger per §7 #1 and carve to 8.1.

### C8 — Mode B listJournalEntries tool-description fix

**Intentionally placed AFTER EC-13 (per Q4 ruling)** so the adversarial run has a
chance to surface whether Mode B behavior is itself an attack surface. Any Mode-B-
adjacent findings from C7 feed into C8's scope.

**Files:**

- MODIFIED `src/agent/tools/listJournalEntries.ts:9` — description expanded per P36.
- MODIFIED `src/agent/prompts/personas/controller.ts` + `ap_specialist.ts` +
  `executive.ts` (or `_sharedSections.ts` — grep at execution for canonical location)
  — one-line tool-selection hint per persona.
- NEW `tests/integration/agentListEntriesReferenceResolution.test.ts` — mock-
  orchestrator regression test per P36.

**Scope floor:** <50 LOC across 4–5 files.
**Founder review gate:** exact wording of description + prompt-hint. Language is
authored content.

### C9 — Convention #9 + #10 codification

**Files:**

- MODIFIED `docs/04_engineering/conventions.md` — add two new h3 sections under the
  existing "Phase 1.2 Conventions (established 2026-04-19)" h2 per P37.

**Scope floor:** ~80–120 lines of added prose.
**Founder review gate:** wording of each convention's title + datapoint summaries.

### C10 — 27-EC matrix

**Files:**

- NEW `docs/09_briefs/phase-1.2/ec-matrix.md` — per P38.

**Scope floor:** ~150–270 lines.
**Execution:** iterate through the 27 ECs + 3 unnumbered shipping items, row-by-row,
populate each row with verification source + status + evidence SHA / artifact path.
**Founder review gate:** spot-check 5–10 rows for accuracy; confirm no EC has status
MISSED (if any do, surface as split-point trigger per §7 #4).

### C11 — Phase 1.2 retrospective

**Files:**

- NEW `docs/07_governance/retrospectives/phase-1.2-retrospective.md` — per P39.

**Scope floor:** ~700–1000 lines.
**Execution:** 9-section retrospective structured per P39 table. Written in one pass
(matches Q6 ruling). If day-clock compresses before C11 lands, carve retrospective
to its own session per §7 trigger #6.
**Founder review gate:** full read-through. Retrospective is authored content with
long half-life; founder owns final wording.

### C12 — Session 8 closeout

**Files:**

- MODIFIED `docs/07_governance/friction-journal.md` — Session 8 retrospective block
  matching Session 6 / 7 / 7.1 precedent (five-patterns style). Phase 1.2 closing
  note. Phase 1.2 → Phase 1.3 / 2 handoff block.
- MODIFIED `docs/09_briefs/CURRENT_STATE.md` — Session 8 complete; Phase 1.2
  complete; Phase 1.3 / 2 next.

**Scope floor:** ~100–200 lines friction-journal + ~50 lines CURRENT_STATE.

---

## 7. Split-point triggers (six, pre-declared)

Session 8 is large enough to plausibly compress against the day-clock. Six
concrete triggers are pre-declared (per Q1 ruling) that carve remaining scope to a
Session 8.1 (or 8.2, etc.) rather than truncate.

1. **EC-13 surfaces >2 distinct adversarial attack vectors needing prompt
   engineering** → carve remaining closeout to 8.1. Rationale: prompt-engineering
   across multiple attack surfaces is its own investigation thread.
2. **Mode B fix (C8) exceeds >100 LOC across 3+ files** → carve remaining closeout
   to 8.1. Rationale: the scope estimate in P36 is <50 LOC; exceeding 2× that
   suggests the fix is deeper than a description tweak and needs isolated scope.
3. **Paid-API session day-clock >6 hours across EC-2+EC-13 combined** (measured
   from first paid call through EC-13 closure) → carve remaining closeout to 8.1.
   Rationale: paid-API sessions are cognitively expensive; compression against
   retrospective writing quality is a foreseeable risk.
4. **27-EC reconciliation (C10) surfaces an undelivered EC that isn't paper-
   closable** → carve the undelivered scope to 8.1 (or an 8.2 if the scope has
   dependencies). Rationale: a missed EC is a Phase-shipping blocker; discovering
   one during the matrix pass deserves its own scope rather than lumping into
   closeout.
5. **C5 HoldingCo root-cause fix exceeds 100 LOC across 3+ files** → carve
   remaining closeout to 8.1. Rationale: the P31 scope is TBD at C4 gate with a
   trivial-fix expectation; exceeding the 100-LOC / 3-file threshold suggests the
   fix is an architectural change in `journalEntryService.list` or adjacent, not
   a guard tweak, and deserves isolated scope.
6. **Retrospective preservation:** if at any point during C11 the retrospective is
   compressed against end-of-day, **carve C11 and C12 to 8.1 rather than
   truncate**. Retrospective writing is itself a load-bearing commit (per Q6
   ruling); a rushed retrospective has lower long-term value than a clean full
   pass.

---

## 8. Exit criteria covered (by commit)

| EC | Commit | Verification |
|---|---|---|
| All 27 ECs (summary) | C10 | `docs/09_briefs/phase-1.2/ec-matrix.md` |
| EC-2 | C6 | 20-entry script output + friction-journal prose |
| EC-8 | C2 | AI Action Review queue page renders the 20 EC-2 entries after they land |
| EC-11 | C6 | Cost-per-entry aggregate captured in friction-journal |
| EC-13 | C7 | Per-vector friction-journal pass verdicts |
| EC-18 (shipping line item) | C1 | Avatar dropdown sign-out affordance renders for all three personas |
| Unnumbered avatar dropdown ship | C1 | `avatarDropdownMenuBehavior.test.ts` |
| Unnumbered Activity icon ship | C1 | Manual smoke (icon visible, click navigates to `/agent/actions`) |
| Unnumbered AI Action Review queue ship | C2 | `aiActionsReviewPageRender.test.ts` |

ECs previously closed in prior sessions remain MET at Session 8 anchor; the matrix
(C10) captures the full status grid.

---

## 9. Test delta summary

Expected new test files: **6 to 15** (see P40 per-commit deltas).

| File | Commit | Asserts |
|---|---|---|
| `tests/integration/avatarDropdownMenuBehavior.test.ts` | C1 | Controller sees 4 items; non-controller 3; sign-out navigates |
| `tests/integration/aiActionsListService.test.ts` | C2 | RLS authorization, empty response, filtered-by-org correctness |
| `tests/integration/aiActionsReviewPageRender.test.ts` | C2 | Controller + AP + Executive render; non-member redirect |
| `tests/integration/orgSwitcherStatusFilter.test.ts` | C3 | Status-filter excludes non-active memberships |
| `tests/integration/journalEntriesListReversedByGuard.test.ts` (or similar, TBD at C5 gate) | C5 | Regression for HoldingCo 500 root cause |
| `tests/integration/agentModelConfigurationSmoke.test.ts` | [M] | Asserts orchestrator uses expected model ID constant (optional; structure-only smoke) |
| `tests/integration/agentAdversarialVector*.test.ts` (× 0–5) | C7 | Per-vector regressions (if any vector surfaces a codifiable fix) |
| `tests/integration/agentListEntriesReferenceResolution.test.ts` | C8 | Agent resolves entry-number reference via `listJournalEntries` without requesting org_id |

Total range: +6 to +15 tests. Target: **380–395**. Stop condition: <370 or >410
(per P40).

---

## 10. What is NOT in Session 8

- Address management UI (master §22 exclusion).
- Role admin / suspend / reactivate / remove controls (master §22 exclusion).
- Pending invitations list (master §22 exclusion).
- Avatar / logo upload UI (master §22 exclusion).
- MFA recovery codes (master §22 exclusion).
- CSV export (Q17 — Phase 1.3 friction).
- Rule promotion UI / Agent Policies canvas (Phase 2).
- Agency Health canvas (Phase 2).
- `vendor_rules` population (Phase 2).
- Phase 2 canvas directives (ap_queue, bank_reconciliation, etc.).
- Cost ceilings (Q12 — Phase 2).
- Streaming responses (Q14 — Phase 2).
- Save as Draft for manual entries (OQ-01 — Phase 2).
- AI Action Review queue advanced features — pagination UI, filtering, search, row
  actions (all Phase 2; C2 ships the read-only static-list version).
- Service-layer refactor of `/api/agent/confirm` + `/api/agent/reject` into
  `src/services/ai_actions/` or `src/services/agent/` (Phase 2 cleanup unless
  C2's new `src/services/agent/aiActionsService.ts` wants to pull them in; default
  shape: aiActionsService is read-only; confirm/reject routes stay inline — see
  OQ-S8-2).
- `fr-CA.json` / `zh-Hant.json` placeholder parity tests against `en.json` (Phase 2).
- Master brief edits (stays frozen at aae547a unless the [M] model-migration commit
  updates §3 decision G + §5.2 point 6 with founder approval — in which case a
  single-line update with a friction-journal entry; see [M] Model migration commit
  scope).
- Session 5 sub-brief in-place edits (stays frozen at 9c22e07; errata append-only
  per P33).

---

## 11. Stop conditions

- `pnpm test` fails at any commit boundary: fix before proceeding.
- `pnpm agent:validate` surfaces typecheck or no-hardcoded-URLs or floor-test
  regression: fix before proceeding.
- Test count at Session 8 close is <370 or >410 per P40: investigate before
  closeout.
- Convention #8 pre-commit grep surfaces identity-assertion drift: correct before
  commit.
- C4 stack trace doesn't reproduce the HoldingCo 500 on founder's reproduction
  attempt: investigate at C4 gate — do not proceed to C5 without a reliable repro.
- C5 HoldingCo root-cause fix exceeds 100 LOC across 3+ files: carve remaining
  closeout to 8.1 per split-point trigger §7 #5.
- C7 adversarial vector fails (agent fabricates): STOP, investigate as prompt-
  engineering issue. Split-point trigger §7 #1 may fire.
- C10 matrix surfaces a MISSED EC: STOP, carve the undelivered scope per split-
  point trigger §7 #4.
- C11 day-clock compression: carve C11 + C12 to 8.1 per split-point trigger §7 #6.
- Paid-API day-clock >6h across C6+C7: carve remaining closeout per split-point
  trigger §7 #3.
- Anthropic API returns errors during EC-2 or EC-13 runs: degradation-path banner
  per Q11; founder retries. If persistent, flag to founder before continuing.

---

## 12. Commit plan

14 commits (13 C-labelled + 1 [M] model-migration commit per Q8a Option B
ratification). Every commit leaves `pnpm agent:validate` clean. Founder review
gate at each of C1, C2, [M], C7, C8, C9, C11 per the "authored content" rule. C3,
C4, C5, C6, C10, C12 review gates are optional (diff-review-only if nothing
surprises at diff time).

| # | Commit subject |
|---|---|
| C1 | `feat(phase-1.2): Session 8 Commit 1 — shell polish (avatar dropdown + Activity icon + placeholder queue)` |
| C2 | `feat(phase-1.2): Session 8 Commit 2 — AI Action Review queue functional` |
| C3 | `fix(phase-1.2): Session 8 Commit 3 — OrgSwitcher status filter + /admin/orgs reconciliation` |
| C4 | `chore(phase-1.2): Session 8 Commit 4 — HoldingCo 500 pino stack-trace instrumentation` |
| C5 | `fix(phase-1.2): Session 8 Commit 5 — HoldingCo 500 root-cause fix` (subject finalized at C5 gate) |
| [M] | `chore(phase-1.2): Session 8 — migrate to claude-sonnet-4-6 (model deprecation)` |
| C6 | `test(phase-1.2): Session 8 Commit 6 — EC-2 (20 real agent entries) + verify-ec-2 script` |
| C7 | `test(phase-1.2): Session 8 Commit 7 — EC-13 adversarial anti-hallucination vectors` |
| C8 | `feat(phase-1.2): Session 8 Commit 8 — Mode B listJournalEntries description + persona hint` |
| C9 | `docs(phase-1.2): Session 8 Commit 9 — Convention #9 + #10 codification` |
| C10 | `docs(phase-1.2): Session 8 Commit 10 — 27-EC reconciliation matrix` |
| C11 | `docs(phase-1.2): Session 8 Commit 11 — Phase 1.2 retrospective` |
| C12 | `docs(phase-1.2): Session 8 Commit 12 — closeout (friction-journal + CURRENT_STATE)` |

Every commit subject carries the `(phase-1.2): Session 8 Commit N — …` pattern to
match Session 7 / 7.1 conventions. Co-Authored-By trailer per d66c0c4 / 39c6d38 /
2e3914a convention; no "🤖 Generated" line per repo convention.

---

## 13. Pre-freeze verification results (Convention #8 grep pass)

Identity assertions verified against shipped code at anchor SHA 2e3914a:

**Clean verifications:**

- `src/agent/tools/listJournalEntries.ts:9` — description at line 9 reads
  verbatim per P36 target. ✓
- `src/components/bridge/OrgSwitcher.tsx:34–37` — membership query has no status
  filter. ✓ Confirms P32.
- `src/app/api/orgs/[orgId]/journal-entries/route.ts:86–103` — GET handler; catch
  block at :92–102 falls through to generic 500 at :99–102. ✓ Confirms P31.
- `src/services/accounting/journalEntryService.ts:325–397` — `list` function
  shape matches the P31 multi-round-trip description. ✓
- `src/app/[locale]/[orgId]/agent/actions/` — directory empty at 2e3914a. ✓
  Confirms C1 creates the placeholder and C2 replaces.
- `src/services/auth/canUserPerformAction.ts:27` — `'ai_actions.read'` ActionName
  present. ✓
- `supabase/migrations/20240116000000_permission_catalog.sql:108, 133, 139` —
  `ai_actions.read` seeded; granted to AP and Executive; controller catches via
  default grant. ✓
- `src/agent/orchestrator/toolsForPersona.ts:17, 32, 48, 60, 73` —
  `listJournalEntriesTool` in all three persona whitelists. ✓
- `docs/09_briefs/phase-1.1/exit_criteria_matrix.md` — exists; provides format
  reference for P38. ✓
- `docs/07_governance/retrospectives/phase-1.1-retrospective.md` — exists; 436
  lines; 9 sections per P39 structural template. ✓
- `src/components/bridge/SplitScreenLayout.tsx` — accepts `orgId: string` prop
  (Session 7.1 verification at 18ebf95 § 5 still holds at 2e3914a). ✓
- `src/shared/types/canvasDirective.ts` — `user_profile`, `org_profile`, `org_users`
  variants present (Session 7.1 § 5 still holds at 2e3914a). ✓

**Scope estimate notes:**

- P30 AI Action Review queue: ~200 LOC total across service + page + table. Matches
  Session 7 Commit 6 handoff's "~80–120 LOC + any needed ai_actions query service"
  estimate; planner's re-estimate factors in a reusable table component.
- P39 retrospective: 700–1000 lines (per pre-freeze revision) calibrated against
  phase-1.1-retrospective.md's 436 lines + more material (Phase 1.2 has 8 sessions
  vs Phase 1.1's 18-task single arc; 3 codified conventions; sub-brief taxonomy;
  5 mini-sub-session carve-outs; paid-API gate patterns; day-clock calibration;
  held-working-tree pattern). 700 is the low end, not the middle.

**Material gaps resolved during drafting (none at this revision).**

---

*End of Phase 1.2 Session 8 Sub-Brief draft v1. Ready for founder review gate.*
