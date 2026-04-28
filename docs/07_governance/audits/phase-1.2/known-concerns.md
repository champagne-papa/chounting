# Known Concerns — Phase 1.2 Audit

Pre-execution artifact. These concerns were identified during Phase
1.2 build sessions, the external pre-Phase-2 review (2026-04-28),
and the audit-of-the-audit verification pass (S23-S24, 2026-04-28).
The orientation agent should generate hypotheses targeting these
specifically. The category scanners should investigate them deeply.

These are not the only concerns — they are the ones where prior
evidence exists. The orientation agent should generate additional
hypotheses beyond what is listed here.

The Phase 1.1 known-concerns file (4 items) carries forward in
spirit; items 1, 2, and 4 there are largely closed by Phase 1.2
work, but item 3 (runtime-vs-compile-time type gaps — fourth
boundary-bug instance hunt) remains open and is restated below as
concern 14.

---

## 1. MFA enforcement is dead code (external review C1)

`src/middleware/mfaEnforcement.ts` exists, exports `enforceMfa`,
and is imported by no production code path. The top-level
`middleware.ts` performs i18n routing only and never invokes
the enforcement. `organizations.mfa_required` is a settable
column (Phase 1.5B), but flipping it to `true` does nothing at
runtime because the redirect logic never executes.

`tests/integration/mfaEnforcementMiddleware.test.ts` exists but
its header explicitly states "the actual redirect behavior is
verified manually in the browser" — the test asserts the column
flips and the function exports, not that the middleware invokes
the redirect.

**Question for audit:** Confirm there is no covert wiring path
that the external review missed. Verify the integration test's
scope claim. Identify any other middleware patterns that exist
but are unwired.

---

## 2. Read-path org-membership checks missing on two services (external review C2)

`chartOfAccountsService.get()` (lines 47-65) and
`periodService.isOpen()` (lines 52-79) lack the
`ctx.caller.org_ids.includes(input.org_id)` check that every
other org-scoped read function performs. The agent path's
`executeTool` dispatcher reaches both — `checkPeriod` calls
`isOpen` directly, and `chartOfAccountsService.get` is reachable
via several lookups. Phase 1.1 audit flagged the COA case at
Medium because it had no callers; Phase 1.2 made it reachable.

**Question for audit:** Are there other read functions in
`src/services/` that lack the same guard? Spot-check
`accountBalanceService`, `recurringJournalService`, `taxCodeService`,
`addressService`, `userProfileService`, `aiActionsService`,
`reportService`, `accountLedgerService`. If the pattern is
inconsistent across reads, that's a category-spanning finding.

---

## 3. Ledger immutability not trigger-enforced (external review C3, Phase 1.1 carry UF-006)

The Phase 1.1 audit (UF-006) flagged this and proposed the QW-03
fix (~30-line migration paralleling the `audit_log_append_only`
pattern). The fix did not ship. `journal_entries` and
`journal_lines` rely on RLS policies (`*_no_update`/`*_no_delete`)
which do not apply to the service-role client. Every write in
the codebase goes through `adminClient()`. Service-layer
convention is the only thing standing between an agent-tool bug
and a mutated posted ledger.

**Phase 2 risk multiplier:** Phase 2 adds more agent tools, more
mutation paths, and a possible "edit" action that stores a
`tool_input` referencing journal-entry mutations. With triggers
in place, faulty implementations throw cleanly. Without them,
posted ledger gets corrupted silently.

**Question for audit:** Confirm the trigger absence at HEAD; identify
any other append-only tables that lack the same pattern (events,
ai_actions if posted should be append-only too).

---

## 4. Transaction atomicity gap on journal entry write (Phase 1.1 carry UF-001, external review H1)

`journalEntryService.post():131-218` issues four sequential
PostgREST calls inside the function body: INSERT
`journal_entries`, INSERT `journal_lines`, `recordMutation`
(audit_log), and (agent path) INSERT `ai_actions` (handled
elsewhere). Each PostgREST call is its own auto-committed
transaction. The deferred balance constraint trigger fires at
`journal_lines` commit — fine in isolation — but the audit_log
write is not atomically tied to the ledger writes. If audit
insert fails after lines insert succeeds, the ledger write stays.

The JSDoc on `recordMutation.ts:45-51` claims atomicity *if* the
caller passes the same client — but no plpgsql RPC actually wraps
the three writes in one transaction. UF-002 (documentation-
reality divergence) compounds UF-001.

**Question for audit:** Are there other multi-write service
methods with the same gap? Check `orgService.createOrgWithTemplate`,
`recurringJournalService.approveRun`, `addressService.addAddress`
(with primary-flip), `membershipService.changeUserRole`. Each
sequential auto-commit boundary is a potential partial-state
window.

---

## 5. Cross-org account_id injection on journal_lines (Phase 1.1 carry UF-007, external review H2)

`journal_lines.account_id` references `chart_of_accounts(account_id)`
but the FK does not constrain that the account's `org_id`
matches the parent `journal_entries.org_id`. The
`journal_lines_insert` RLS policy checks the entry's org via
`user_has_org_access(je.org_id)` but does not check that
`account_id`'s org matches. Zod `JournalLineSchema:20` requires
`account_id: z.string().uuid()` only — no cross-org membership
check. `journalEntryService.post()` does not assert that all line
accounts belong to `parsed.org_id`.

The agent does not have legitimate access to other orgs'
account_ids today (`chartOfAccountsService.list` filters by
org), but `chartOfAccountsService.get()` lacks the org check
(concern 2 above) — the gaps compound.

**Question for audit:** Beyond `journal_lines.account_id`, are
there other FKs to org-scoped tables that don't enforce the
same-org constraint? Check `recurring_template_lines.account_id`,
`ai_actions.entry_id`, `audit_log` JSONB cross-references, and
any membership/permission FK that references org-scoped state.

---

## 6. Audit-emit failures swallowed in agent paths (external review H3)

Per Clarification F (commented in code), `agent.message_processed`,
`agent.tool_executed`, `agent.session_created`, and
`agent.session_org_switched` audit emits are wrapped in try/catch
and swallowed on error — `log.error` then continue. The reasoning
is "the audit emit is outside a service transaction so a thrown
error would poison the user-facing request." That's a real
concern, but the consequence is that the agent can mutate
organization data (via wrapped service tools) and produce no
audit row for the agent's session attribution.

The `audit_log` already shows the inner `journal_entry.*` row.
The missing rows are agent-session-level breadcrumbs. Forensically
this matters: reconstructing which session posted a given entry
requires the `agent.session_created` row to tie session_id → user.

**Question for audit:** What is the operational alerting on
swallowed audit-emit failures? Is there a metric counter, a
structured-log incident_type, or anything that surfaces the
silent log emissions? If pino-only, is that visible in the
deployment's log pipeline?

---

## 7. Period date / fiscal_period_id mismatch (S23 security-review pass, NEW)

`journalEntryService.post` and the DB trigger
`enforce_period_not_locked` both gate on the caller-supplied
`fiscal_period_id` (verifying `is_locked = false`), but neither
validates that `entry_date` actually falls within the supplied
period's `[start_date, end_date]` range. An authorized member
can post an entry with `entry_date` inside a closed period
while supplying an *open* period's `fiscal_period_id`,
defeating the period-lock invariant in spirit while the lock
trigger fires green.

`periodService.isOpen()` exists with the correct date-range
logic at lines 63-64 but is never called from
`journalEntryService.post` (grep-confirmed zero matches).

**Question for audit:** Is this gap also present in
`recurringJournalService.approveRun` (which derives the period
from `scheduled_for`)? Are there other places that gate on
`is_locked` without re-checking the date-range / period-id
consistency? Is INV-LEDGER-002 (period-lock) enforced fully or
only structurally?

---

## 8. PII in pino logs and `before_state` JSONB (S23 security-review pass + audit-of-audit refinement, NEW)

Two surfaces:

**(a) Pino layer** — `REDACT_CONFIG.paths` covers tokens,
secrets, `tax_id`, `sin`, `bank_account_number`, and
`card_number`, but does not cover `email`, `phone`,
`first_name`, `last_name`, `display_name`. Multiple service
files log invitee email and other PII in plaintext, e.g.,
`invitationService.ts:92` `log.info({ org_id, email,
invitation_id }, 'User invited')`.

**(b) Audit log table** — `recordMutation` writes `before_state`
JSONB directly to the append-only `audit_log` table, where
invitation rows / user_profiles / memberships land verbatim
(including invited_email, display_name, full address strings,
phone numbers). The pino redaction does not apply here — the
data lands in the database, not in a log emission. Once it
lands, `audit_log_no_update`/`no_delete` triggers prevent
selective pruning. PIPEDA right-to-erasure becomes
architecturally awkward.

**Question for audit:** Beyond `invitationService`, which
service log emissions and `recordMutation` `before_state`
captures contain unredacted PII? Is the `audit_log` schema
designed with right-to-erasure in mind (separate JSONB columns
per category, scrub-at-write toggle), or does it serialize
whole rows verbatim? What is the access posture on `audit_log`
queries — is it gated to a privileged role or readable by any
membership?

---

## 9. Multi-org users may mint additional orgs through the agent (external review H5)

`/api/agent/message/route.ts:24` accepts `org_id: z.string().uuid().nullable()`.
`resolvePersona(user_id, null)` at `index.ts:1059-1074` returns
`'controller'` unconditionally for the onboarding flow. The
orchestrator gates `createOrganization` by persona whitelist, so
a user with no memberships should only call onboarding tools.
But `orgService.createOrgWithTemplate()` does not check
`ctx.caller.org_ids.length === 0` — so a user with existing
memberships submitting `org_id: null` can mint a new
organization via the agent and become its controller.

**Question for audit:** Is this intentional (multi-org users
creating additional orgs is a valid product flow) or a bug? Is
the persona-resolution path that returns `'controller'` for
null org_id documented? What other agent flows assume "no
memberships" as the trigger for a privilege boundary?

---

## 10. `before_state` design at the audit-log layer (S24 audit-of-audit, NEW Phase 2 design conversation)

Sibling to concern 8 but a strategic question: `recordMutation`'s
`before_state` JSONB serializes whole rows. Phase 2 mobile
approval and remote-approver flows (per Phase 2 obligations) will
add more `recordMutation` call sites and more PII surfaces. The
`audit_log` is append-only by design (INV-AUDIT-002); selective
column scrubbing post-write is architecturally precluded.

Two paths:
- **(a)** Scrub PII from `before_state` blobs at write-time,
  before the audit row commits — preserves the ledger of what
  changed without preserving the values themselves.
- **(b)** Accept the PII-in-audit-log tradeoff and gate
  `audit_log` access to a privileged compliance/legal role,
  documenting the posture explicitly in `security.md`.

**Question for audit:** Which path does the architecture
imply? Is there documentation in `02_specs/` or
`07_governance/adr/` that picks one? If not, this is a
Phase 2 obligation candidate.

---

## 11. Service-layer mutation-surface CI guard absent (S24 audit-of-audit, NEW)

The Phase 1.1 audit identified the missing ESLint rule for
`@/db/adminClient` import boundary (UF-002). That rule still
does not exist (`eslint.config.mjs` has no
`no-restricted-imports`). Even with that rule, the `withInvariants`
*wrap* pattern is convention-only — the rule enforces import,
not invocation. A future route that imports a mutating service
method without going through `withInvariants` would silently
allow cross-org writes via service-role bypass.

**Question for audit:** Are there any current routes that call
mutating service methods without `withInvariants`? Search
`src/app/api/**` for service imports + non-`withInvariants` call
sites. The S23 pass found `/api/agent/reject/route.ts` calls
`adminClient` directly without `withInvariants`; verify whether
that's a real bypass or whether the route's own auth context
substitutes for the wrap.

---

## 12. Conversation context-window saturation (CURRENT_STATE Phase E, friction-journal Class 2)

Phase E EC-2 Entry 12 attempt 2 produced
AGENT_STRUCTURED_RESPONSE_INVALID after context saturation at
32+ turns in the same agent_session. Root cause hypothesis:
context-window overload. `agent_sessions.conversation` is
unbounded JSONB; `loadOrCreateSession.ts:194` loads
`(raw.conversation as unknown[]) ?? []` with no truncation or
windowing. `STRUCTURAL_MAX_RETRIES = 1` (per-turn retry budget)
governs validation retries but does not cap turn count.

S22 caching enablement (`856dcc7`) reduces per-call cost ~32%
within a single `handleUserMessage` flow but does not solve
cross-turn growth.

**Question for audit:** What is the projected turn count at
which production sessions saturate? Is there a TTL-based
rotation policy? Is there a session-rotation directive when
turn count exceeds a threshold? Do any existing tests
characterize the saturation curve, or is the 32-turn EC-2
incident the only datapoint?

---

## 13. Test coverage holes around the agent path (S23 gap analysis, NEW)

Spot-check of `tests/integration/` against the Phase 1.2 agent
surface reveals gaps:

- **Reject-path edit-flow source-flip** — when an `ai_action` is
  rejected and the user manually edits the proposed entry, the
  source field flips from `agent` to `manual`. This was an EC-2
  carry-forward in the friction-journal but has no named
  regression test. Phase 2 will reuse this code; the test should
  exist before that reuse.
- **Conversation truncation at high turn count** — no test
  characterizes the saturation behavior referenced in concern 12.
- **Oversized tool_result handling** —
  `callClaudeErrorClassification.test.ts` covers 401/429/5xx
  but not oversize-payload handling that could exceed Anthropic's
  context window limits.
- **Malformed agent response shapes** — the EC-2 Entry 12 failure
  suggested AGENT_STRUCTURED_RESPONSE_INVALID under context
  pressure; no test exercises that explicit failure mode.

**Question for audit:** What is the agent-path coverage matrix?
Cross-reference Category A floor tests with the agent surface
exposure points. Phase 1.2 added significant code; coverage may
have grown but unevenly.

---

## 14. Fourth boundary-bug instance hunt (Phase 1.1 carry, DESIGN.md Constraint #5)

Phase 1.1 found three instances of "external systems lie to the
type system":

- React hook re-render semantics (`form.watch` vs `useWatch`)
- PostgREST embed shapes (many-to-one returned as object)
- Postgres NUMERIC serialization (returned as JS numbers)

DESIGN.md mandates active hunt for the next instance. Phase 1.2
adds new boundaries that should be examined:

- **Anthropic SDK message shape vs internal types.** The S22
  caching enablement (`856dcc7`) restructured `system: string`
  → `system: TextBlockParam[]` and required a compat-shim
  (`tests/setup/getSystemPromptText.ts`). Has anything else in
  the SDK's `messages.create` response shape drifted between
  Sept 2025 and Apr 2026 that the internal types don't catch?
  Check `usage.cache_read_input_tokens`,
  `usage.cache_creation_input_tokens`, and the
  `content` array's typed-block discriminated union (text
  vs tool_use vs tool_result).
- **`ai_actions.tool_input` JSONB vs `PostJournalEntryInputSchema`.**
  The orchestrator's pre-Zod injection pattern (Site 1) writes
  `idempotency_key` and `org_id` into `tool_input` before
  validation. If the table column type drifted from the schema,
  reads of `tool_input` (e.g., for replay or display) might see
  shapes the schema doesn't validate.
- **`agent_sessions.conversation` message-shape drift** across
  the SDK churn. Stored conversations from older SDK versions
  may carry shapes the current parser assumes are absent.
- **`canvas_directive` vs `proposed_entry_card`** schema
  evolution — at least three commits added fields. Older
  persisted directives may have shapes the current
  `canvasDirective.schema.ts` rejects.

**Question for audit:** Any of the above is a candidate; the
hunt is actively flagged per framework rule. The data layer
scanner and the backend design scanner should both look for the
fourth instance.

---

## 15. Prompt-injection of user-controlled strings into system prompts (S23 gap, NEW)

`src/agent/prompts/suffixes/onboardingSuffix.ts` and
`src/agent/memory/orgContextManager.ts` interpolate user-provided
strings (displayName, account names, memo lines) into the system
prompt and into next-turn `tool_result` content without escaping
or length-limiting. Today's blast radius is single-org (the agent
only mutates within the active org's data). Phase 2 intercompany
flows (`mirror_cards_intercompany.md`) cross org boundaries; an
attacker who controls an account name in org A could attempt to
manipulate the agent's reasoning when it operates on org B
data via mirror-card flows.

The security-review skill explicitly excludes "user content into
AI system prompts" from formal vulnerability reporting, but it
is a real Phase 2 hardening surface.

**Question for audit:** Catalog every user-controlled string
that flows into system-prompt construction. Identify
length-limit gaps. Note this is a Phase 2 hardening obligation,
not a Phase 1.2 blocker — flag for the action plan accordingly.

---

## Synthesis-of-prior corrections

The external pre-Phase-2 review (2026-04-28) included three
findings the audit-of-audit verification refuted:

- **H6 (locale inline script)** — `notFound()` allowlist gate
  before interpolation makes the pattern safe; not a real
  finding.
- **M7 (onboarding state guard prompt-dependent)** — the
  structured guard at `index.ts:580+` is the load-bearing
  mechanism; `onboardingStep4GuardNoStep1.test.ts` is the
  regression test that asserts the gate works without the
  prompt.
- **L6 (setSubmitting after router.push)** — the synchronous
  setState runs before the navigation; component is still
  mounted; no warning.

These were verified at HEAD during the S23 verification pass.
Scanners should NOT re-investigate or re-flag these. If a
scanner independently surfaces evidence that contradicts the
verification, that's a finding worth elevating; otherwise
treat as resolved.

---

## Out-of-scope reminders (DESIGN.md Constraint #4)

The Phase 2 obligations file (`docs/09_briefs/phase-2/obligations.md`)
contains the deferred items inherited from Phase 1.2 closeout.
Do not re-audit DEFERRED items as new findings. Reference, do
not rediscover. The retrospective access rule applies — read
`docs/07_governance/retrospectives/phase-1.2-retrospective.md`
LAST in the synthesis phase, not as an anchor for scanner
analysis.
