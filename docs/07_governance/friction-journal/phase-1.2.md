## Agent Autonomy Design Sprint

- 2026-04-16 NOTE   Agent autonomy model and UI/UX architecture
  design sprint completed. Multi-round review between the founder,
  External CTO A, and External CTO B. Format: iterated CTO
  feedback converging on a shared trust model and three-path
  entry architecture. Phase 1.2 implementation work was paused
  for the duration; Phase 1.5 had completed (2026-04-16) and
  Phase 1.2 was next on deck when the sprint began.

  Substantive decisions reached:

  - Product thesis extended: "The product is not the AI. The
    product is the control surface over the AI." This sharpens
    the interface half of the thesis without changing the engine
    half. The agent is a managed actor in a trust system.
  - Trust model: Agent Ladder with three rungs (probationary /
    auto-with-notification / silent auto). Dollar-based limits
    modeled on real accounting role delegation (AP-specialist
    limit analogy). Schema-enforced hard ceilings for
    transaction classes that can never auto-post regardless of
    rung: intercompany, period-end adjustments, equity,
    reversals, locked periods, first-time vendors above a floor.
  - Confidence scores are a policy input, not a UI hint. Raw
    confidence is never displayed to users — only the policy
    outcome with a legible reason.
  - One voice to the user, many tools under the hood. No
    user-facing sub-agent hierarchy; internal orchestration
    stays internal.
  - Three-path entry (Mainframe / chat / command palette)
    unified by a canonical Intent Schema. No path grows bespoke
    routing.
  - ProposedMutation is the canonical object for every
    ledger-touching change. Every confirmation surface renders
    from one; every audit record stores one.
  - Canvas ↔ chat relationship: canvas state flows into chat as
    context every turn, but canvas navigation history and chat
    transcript remain separate timelines. Phase 1.2
    canvas_context_injection work is the inbound side; this
    sprint confirmed the model.
  - Ghost Rows visual contract: four independent signals (italic
    + muted + left-stripe + "Draft" pill). Schema excludes from
    exports and reports.
  - Logic Receipts as the immutable audit artifact. No raw LLM
    reasoning stored or displayed, ever.

  What follows: this capture phase (Phase A) registers four new
  open questions (Q23–Q26) in open_questions.md and records this
  friction-journal entry. A follow-on documentation sprint
  (Phase B) will draft three new specs in docs/02_specs/
  (agent_autonomy_model.md, intent_model.md,
  mutation_lifecycle.md), extend docs/03_architecture/
  ui_architecture.md, create docs/03_architecture/
  agent_architecture.md, draft ADR-002 through ADR-006, and stub
  nine Phase 2 briefs under docs/09_briefs/phase-2/. Phase 1.2
  implementation is unblocked when the Phase B specs land.
- 2026-04-16 NOTE   Agent Autonomy Design Sprint documentation
  complete. Four-phase sprint delivered: Phase A (1 friction
  entry, 4 open questions Q23–Q26), Phase B (3 new specs, 1
  extension, 1 new architecture doc — ~1,739 lines), Phase C
  (5 new ADRs 0002–0006 — ~998 lines), Phase D (9 Phase 2
  brief stubs, 4 index updates, final cross-reference sweep).
  Spec-without-enforcement discipline held end-to-end:
  invariants.md still shows 17 Phase 1.1 invariants; no new
  INV-IDs registered. Phase 1.2 implementation is unblocked.
  The Phase 1.2 brief will be reconciled against ADR-0002
  (confidence display superseded) during execution.
- 2026-04-16 NOTE   Phase 1.2 execution brief writing session
  started. Starting model: Claude Sonnet (claude-sonnet-4-20250514).
  All Q11–Q17 and Q23–Q26 defaults accepted by founder. Scope
  decisions A–G locked. Design-sprint artifacts (Phases A–D)
  committed at 4ccc48d. Phase 1.5 complete; 162 tests green.
- 2026-04-16 WRONG  Product vision doc did not receive the thesis
  extension during the A–D sprint. The "control surface" reframe
  landed in agent_autonomy_model.md §2 and the friction journal
  but not in docs/00_product/product_vision.md where the quotable
  one-line thesis statement lives. Fix: product_vision.md Thesis
  section extended with a ### Thesis extension — the control
  surface subsection; Source line updated with sprint provenance.
  Lesson: when a thesis extension lands in specs, the vision doc
  is where the quotable one-liner belongs — specs extend the
  reasoning, the vision carries the quotable line.
- 2026-04-16 NOTE   Phase 1.2 brief patch session — closing 9
  review gaps identified during founder review. Gaps cover:
  orchestrator retry message structure, tool input schemas,
  structured-response enforcement mechanism, agent_sessions RLS,
  onboarding state machine, confirm payload source, ActionName
  verification, dry_run scope, Four Questions template mapping.
- 2026-04-16 NOTE   Phase 1.2 brief patch session complete. Nine
  gaps closed:
  Gap 1 (§5.2): orchestrator retry message shape (tool_result with
  is_error:true + Zod errors), session loading precedence (3-step),
  conversation truncation (full history, no window in 1.2).
  Gap 2 (§6.1): tool input schemas — each tool now has a cited Zod
  schema or inline definition + typed rejection branches.
  Gap 3 (§6.2): respondToUser tool as 10th tool — tool-based
  structured-response enforcement. Tool count 9→10.
  Gap 4 (§9.4): agent_sessions RLS verified — SELECT-only policy
  exists from migration 001. No changes needed in 118.
  Gap 5 (§11.5): onboarding state machine — OnboardingState shape
  in agent_sessions.state, resume behavior, invited-user detection,
  completion trigger.
  Gap 6 (§13.3): confirm payload source — reads ai_actions.tool_input
  (verified column name). No session_id in request body.
  Gap 7 (§16): user.profile.update ActionName missing — added as new
  required ActionName for all three roles.
  Gap 8 (§6.5): dry_run scope — ledger-mutating tools only. ADR-0008
  pending. updateUserProfile/createOrganization/updateOrgProfile
  exempt.
  Gap 9 (§10.3): Four Questions template_id mapping — 6 template IDs
  for ProposedEntryCard rendering, i18n-required in all 3 locales.
  Brief grew from 1037 to 1364 lines. No new gaps discovered.
- 2026-04-18 NOTE   Phase 1.2 Session 1 sub-brief drafting session
  started. Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]).
  Master brief frozen at SHA aae547a. Session 1 scope: schema +
  deps + types housekeeping only — migrations 118 (agent_session
  wiring + user.profile.update permission seed) and 119 (journal
  entry form fixes placeholder), two new dependencies
  (@anthropic-ai/sdk, zod-to-json-schema), one new ActionName,
  ProposedEntryCard type migration per ADR-0002, types.ts regen.
  No Anthropic API calls, no agent code, no new tests. Founder
  pre-resolved the permission-pattern question: 1.5C adds
  ActionNames via migration (not seed) with CA-27 parity test
  enforcement. Session 1 folds the permission seed into migration
  118 matching the 1.5C precedent (migration 116 combined schema
  + initial catalog).
- 2026-04-18 NOTE   Phase 1.2 Session 1 sub-brief drafting session
  complete. Artifacts: (1) session-1-brief.md (443 lines, within
  the 250–450 target), (2) CURRENT_STATE.md updated to note
  Session 1 ready to execute and Phase 1.2 decomposed into ~8
  sessions, (3) this entry. Two discoveries surfaced during
  drafting that extended the founder prompt's scope:
  (a) CA-28 (permissionCatalogSeed.test.ts) hardcodes the
  catalog to 16 permissions and specific 3-item role lists — it
  breaks when user.profile.update is added, even though CA-27
  (permissionParity.test.ts) is dynamic and passes automatically.
  Sub-brief Work Item 5.4(b) now covers updating four CA-28
  assertions (16→17 total, controller 16→17, ap_specialist list
  3→4, executive list 3→4). This is not "adding tests" — it is
  maintaining the parity invariant CA-28 encodes.
  (b) role_permissions uses (role_id, permission_key) as its
  composite PK, not a permission_id FK. The founder prompt's
  S1-6 verification SQL had permission_id; corrected to
  permission_key in the sub-brief. Ordering note: commits 2 and
  3 are coupled — intermediate state (DB has 17 permissions,
  ACTION_NAMES has 16, CA-28 expects 16) fails tests, so the
  two commits must land together in the same push. Flagged
  explicitly in §10 commit plan.
- 2026-04-18 NOTE   Phase 1.2 Session 1 execution session —
  starting. Starting SHA: 4a62faf. Starting model: Claude Opus
  4.7 (claude-opus-4-7[1m]). Completion target: all 12 S1 exit
  criteria (S1-1 through S1-12) pass after the four-commit
  cadence defined in sub-brief §10. Sub-brief at
  docs/09_briefs/phase-1.2/session-1-brief.md is the spec; this
  session produces code, migrations, and test edits. Master
  brief frozen at aae547a.
- 2026-04-18 WRONG  Session 1 sub-brief §5.4(b) named CA-28 as
  the only test needing count updates, but CA-37 in
  crossOrgRlsIsolation.test.ts also hardcodes permissions and
  role_permissions counts (16→17 permissions, 22→25 role grants
  — same invariant as CA-28, tested through the RLS surface
  rather than the admin surface). Caught correctly by the full
  pnpm test step at commit 4, not by the commit-2 verification
  (which only ran CA-27 and CA-28 explicitly). WSL Claude
  stopped and flagged per sub-brief §7 rather than powering
  through; founder chose Option 1 (amend commit 3 to cover both
  CA-28 and CA-37). Amended commit: 9894603 → 3b034b8.
  Lesson for Session 2+ sub-brief drafting: when a migration
  changes permissions or role_permissions row counts, the
  sub-brief must include a grep verification step:
  `grep -rn 'toHaveLength\|toBe' tests/ | grep -E 'permissions|role_permissions'`.
  This is a zero-cost check that catches the full set of
  catalog-count dependencies, not just the ones the sub-brief
  author happened to remember. Candidate for a conventions.md
  addition under "Phase 1.5A Conventions / Permission Keys" so
  every future drafter sees it.
- 2026-04-18 NOTE   Kong gateway / auth container ordering quirk
  surfaced during Session 1 execution. After pnpm db:reset
  (which restarts db, auth, storage, realtime containers) Kong
  was not refreshing its upstream resolution to the restarted
  auth container — the admin auth API calls for seed user
  creation returned "An invalid response was received from the
  upstream server" via the gateway even though the auth
  container logs showed it was healthy and serving requests on
  port 9999. Workaround: `docker restart supabase_kong_chounting`
  before running `pnpm db:seed:all`. The symptom appeared only
  after the second back-to-back db:reset in a single session
  (commit 4's db:reset; commit 2's earlier db:reset was followed
  only by targeted CA-27/CA-28 tests, which don't hit auth).
  The first baseline `pnpm test` (pre-commit-1) passed because
  the DB was pre-seeded from the prior session. Worth preserving
  as a workflow note: after every `pnpm db:reset`, run
  `docker restart supabase_kong_chounting && sleep 3 && pnpm db:seed:all`
  — or, preferably, a `pnpm db:reset:clean` script that folds
  the Kong refresh + seed into one command. The underlying
  cause is not investigated here; likely Kong DNS caching or
  upstream health-check interval. Phase 2 DevEx work.
- 2026-04-18 NOTE   Phase 1.2 Session 1 execution complete. All
  12 S1 exit criteria pass. 4 commits on top of 4a62faf:
  44ecb4f (deps), 21169ea (migration 118 + types regen),
  3b034b8 (ACTION_NAMES + CA-28 + CA-37 parity — amended from
  9894603 after the CA-37 gap was flagged), and commit 4 (this
  commit: migration 119 + ProposedEntryCard type + shim +
  friction journal entries). Pinned versions:
  @anthropic-ai/sdk 0.90.0, zod-to-json-schema 3.25.2. Starting
  model: Claude Opus 4.7 (claude-opus-4-7[1m]) — unchanged
  throughout. Full regression: 36 test files, 162 tests, 0
  failures. Master brief still frozen at aae547a. No new open
  questions beyond the CA-37 sub-brief-drafting-workflow note
  above. Session decomposition discipline held: no Session 2+
  scope leaked in.
- 2026-04-18 NOTE   Phase 1.2 Session 2 sub-brief drafting session
  started. Starting SHA: 82247cb. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief still frozen at aae547a;
  Session 1 complete. Session 2 scope: orchestrator skeleton + 10
  tool schemas + respondToUser enforcement + mocked callClaude
  with deterministic Anthropic Messages fixtures, all against
  pure TypeScript (no Next.js route wiring yet, no real API
  calls). Two founder-confirmed observations to codify during
  drafting: (1) mock fixture shapes must be typed literals citing
  the SDK type so Session 4's real-API swap is mechanical;
  (2) trace_id propagation gets a dedicated work item + CA-47
  test covering log output + service-layer-via-tool-path +
  ai_actions.trace_id as the three assertable surfaces.
- 2026-04-18 NOTE   Phase 1.2 Session 2 sub-brief drafting session
  complete. Artifacts: (1) session-2-brief.md (642 lines, within
  the 400–650 target after two compression passes — the first
  draft came in at 733, trimmed by compressing §5.2 schema
  blocks into a table + single-line Zod citations for the six
  new schemas, compressing §5.3 type block to cite master §5.1,
  and compressing §5.4 callClaude body from a full code block to
  signature + queue-pattern description); (2) CURRENT_STATE.md
  updated noting Session 1 complete + Session 2 ready;
  (3) this entry. Four SDK-type observations worth preserving
  from the required-reading pass on
  node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
  (v0.90.0): Message has a required container field (Container |
  null) that must be present in fixture literals; ToolUseBlock
  has a required caller field (DirectCaller | ServerToolCaller |
  ServerToolCaller20260120) that fixtures set to
  { type: 'direct' }; Usage has many required fields (cache_*,
  inference_geo, server_tool_use, service_tier) that fixtures
  either populate or null-fill via the shared makeMessage helper;
  the return type is Anthropic.Messages.Message (not a simplified
  wrapper), which is load-bearing for Session 4's mechanical
  swap. These are captured in sub-brief §5.4 fixture guidance.
  No new open questions surfaced during drafting. No master-brief
  inconsistencies found. Session 2 is unambiguous enough that
  execution should hit the same zero-drift discipline as Session
  1 with no stop-and-flag moments — though that will only be
  known post-execution.
- 2026-04-18 NOTE   Phase 1.2 Session 2 execution session —
  starting. Starting SHA: fc306c5 (the Session 2 readiness
  commit). Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]).
  Completion target: all 15 S2 exit criteria (S2-1 through S2-15)
  pass after the four-commit cadence defined in sub-brief §10.
  Two founder pre-decisions: canvasDirectiveSchema lands at
  src/shared/schemas/canvas/canvasDirective.schema.ts (new
  subfolder); toolsForPersona avoids raw count comments.
  Sub-brief at docs/09_briefs/phase-1.2/session-2-brief.md is
  the spec; this session writes real agent code against the
  mocked Anthropic client. Master brief frozen at aae547a.
- 2026-04-18 WRONG  Discovered during commit 3 pre-execution
  reading: the PostJournalEntryInputSchema and
  ReversalInputSchema carry four .refine() blocks (two per
  schema) that reject source='agent' and dry_run=true with
  messages "not implemented in Phase 1.1.". These are Phase 1.1
  placeholder guards with a self-documenting comment at
  lines 86–93 of journalEntry.schema.ts noting their intended
  removal in Phase 1.2. The sub-brief §5.2 cited both schemas
  as "verbatim, no new Zod" which was incomplete — it didn't
  flag that the existing schemas gate the exact inputs Session
  2 feeds through Fixture C and CA-47's postJournalEntry
  dry-run path. WSL Claude stopped and flagged per Session 1
  precedent rather than powering through; founder chose
  Option 3 (fold into commit 4 alongside the tests). Commit 4
  removes the four .refine() blocks and inverts the two unit
  tests in journalEntrySchema.test.ts (agent-source rejection
  → "accepts agent source with idempotency_key" +
  "rejects agent source without idempotency_key";
  dry_run rejection → "accepts dry_run: true"). The sibling
  idempotencyRefinement now becomes runtime-reachable as the
  file's own comment predicted, bidirectionally paired with
  the database CHECK constraint idempotency_required_for_agent
  from migration 001. Lesson for Session 3+ sub-brief drafting:
  when a sub-brief cites an existing Zod schema, the drafter
  must grep the schema file for .refine() clauses whose message
  text contains "Phase 1" or "not implemented" or similar
  self-referential placeholders. These are pending migrations
  the cited schema still carries. Candidate for a
  conventions.md addition alongside the Permission Catalog
  Count Drift convention from Session 1 (suggested section
  name: "Cited-Code Verification" or "Inherited-Assumption
  Checks") — holding off on the commit until Session 2
  close-out to batch with any further lessons.
- 2026-04-18 NOTE   Phase 1.2 Session 3 sub-brief drafting session
  started. Starting SHA: d20c767. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a; Sessions 1
  and 2 complete with 178/178 regression baseline. Session 3 scope:
  system prompts (three persona prompts + locale/canvas/onboarding
  suffixes), buildSystemPrompt composition helper, and i18n template
  additions to messages/{en,fr-CA,zh-Hant}.json covering every
  template_id already referenced by Session 2's fixtures and the
  orchestrator's fallback paths, plus the Four Questions keys from
  master §10.3. Pure strings + a string-composition function + JSON
  additions — no new logic, no new tools, no real API calls. Four
  founder pre-decisions to codify: (1) buildSystemPrompt signature
  Option B (deferred-extensible OrgContext stub); (2) locale is a
  live parameter now; (3) canvas suffix covers only the current
  CanvasDirective union members (no Session 6 speculation);
  (4) onboarding suffix instructs Claude without encoding the
  Session 5 state machine. Cited-Code Verification is a live
  convention now — this is its first use outside the retrospective
  lesson where it was coined.
- 2026-04-18 WRONG  Drafting discovery 1: master §7 is a six-section
  structural skeleton, not fully verbatim prompt text. Verbatim
  content: §6.3 anti-hallucination rules, §7 section 4
  (structured-response contract line), §7 section 5 (voice rules),
  §7.1 onboarding suffix, §7 section 6 canvas suffix (via
  canvas_context_injection.md). Not verbatim (must be
  session-authored): the Identity block (parameterized by orgName,
  persona, user display_name at runtime) and the Available-tools
  enumeration (generated from toolsForPersona output). Stopped
  and flagged per drafting prompt's "STOP before making up
  content" rule. Founder chose Option 2 (§7 is sufficient as
  skeleton + citation chain; Session 3 authors the Identity block
  templates and assembly glue with a commit-2 review gate). Master
  brief stays frozen at aae547a. Sub-brief §6.1 documents each
  section of each persona prompt with an explicit source-citation
  table distinguishing verbatim-cited from session-authored. This
  distinction — "verbatim" vs "skeleton + upstream" — is a class
  of drafter oversight not yet codified in conventions.md.
  Candidate for a future convention addition after a third
  datapoint surfaces.
- 2026-04-18 WRONG  Drafting discovery 2: spec divergence between
  master §6.2 item 5 (line 483–487) and Session 2's shipped
  orchestrator. Master specifies that on structural-retry
  exhaustion the orchestrator "surfaces a generic error template:
  { template_id: 'agent.error.structured_response_missing',
  params: {} } and logs AGENT_STRUCTURED_RESPONSE_INVALID." Session
  2's orchestrator throws new ServiceError instead of returning
  the template response. CA-43 locked in the divergence by
  asserting the throw. The agent.error.structured_response_missing
  template_id is referenced by master but never actually produced
  by the running code. Flagged during the Cited-Code Verification
  grep for locale additions. Founder chose Option 1 (fix + add
  template_id to locales + invert CA-43). The fix is ~8 lines in
  src/agent/orchestrator/index.ts (throw block becomes a
  persistSession + return-template block); log line is preserved.
  Folded into Session 3's commit 2 (orchestrator wire-up commit).
  This is a subtler cousin of the Cited-Code Verification lesson:
  "sub-brief touched code that diverged from spec; existing tests
  locked in the divergence; grep of message text against spec
  catches it." Not yet codifying as a convention — batching
  pattern until a third datapoint surfaces ("Shipped-Code-to-Spec
  Verification" is the working name).
- 2026-04-18 NOTE   Drafting observation (not blocking Session 3):
  master §21's CA-* test catalog drifted from Session 2's actual
  shipped tests. §21 lists CA-39 as agentIdempotency.test.ts,
  CA-40 as agentToolRetry.test.ts, etc. — completely different
  scopes and names than Session 2 shipped (agentOrchestratorHappyPath
  through agentTracePropagation). This affects Session 8's exit-
  criteria verification because §21 maps CA-* to EC-*. Founder has
  noted this for Session 8 planning; explicitly out-of-scope for
  Session 3. Expected resolution: a master brief patch session
  before Session 8 kicks off, reconciling §21 with the actual
  shipped names.
- 2026-04-18 NOTE   Phase 1.2 Session 3 sub-brief drafting session
  complete. Artifacts: (1) session-3-brief.md (503 lines, within
  300–550 target); (2) CURRENT_STATE.md updated noting Session 2
  complete + Session 3 ready; (3) this entry + the two WRONG
  entries above. Five founder pre-decisions codified in sub-brief
  §4 (four original + Pre-decision 5 added after discovery 1
  resolution). Cited-Code Verification grep confirmed four
  fixture/orchestrator template_ids, not five — the founder's
  fifth (agent.error.structured_response_missing) was not grep-
  surfaced because Session 2's orchestrator throws rather than
  returning it; resolved via §6.7 fix. Twelve total template_ids
  enumerated in §6.5 for locale additions (five agent.* + seven
  proposed_entry.*). No other open questions surfaced.
- 2026-04-18 NOTE   Phase 1.2 Session 3 execution session —
  starting. Starting SHA: 1562d3c (Session 3 readiness anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Completion
  target: all 10 S3 exit criteria (S3-1 through S3-10) pass after
  the four-commit cadence in sub-brief §11. Commit 2 has a
  founder review gate for Session-3-authored prose (three Identity
  block templates + three locale directive strings + any authored
  canvas suffix prose). Two founder pre-decisions resolved during
  review: (a) canvas_context_injection.md carries a verbatim
  framing block; Session 3 translates Handlebars to TS template-
  literal conditionals in commit 1; (b) CA-51 is a fresh test
  at tests/unit/i18nLocaleParity.test.ts. Sub-brief at
  docs/09_briefs/phase-1.2/session-3-brief.md is the spec.
  Master brief frozen at aae547a.
- 2026-04-18 NOTE   Session 3 commit 2 introduced two internal
  helper modules under src/agent/prompts/personas/:
  _sharedSections.ts (verbatim master-cited content: §6.3 rules,
  §7 structured-response contract, §7 voice rules — extracted to
  prevent drift across the three persona files) and
  _identityAndTools.ts (identity-block template + tools
  enumeration helper used by all three personas). Underscore
  prefix marks them internal-only. Not named in sub-brief §10
  stop-points file list but sound refactor — three persona
  files (controller.ts, ap_specialist.ts, executive.ts) still
  exist with the expected PersonaPrompt exports (S3-1 passes)
  and no duplicated prose. DRY factor prevents master §6.3
  drift across files. Pattern worth preserving for Session 4+:
  executor may introduce internal-only helper modules when the
  sub-brief's named public exports are preserved and the
  relevant S3-* criteria still pass.
- 2026-04-18 NOTE   Commit-2 founder review gate produced one
  polish request: drop UUIDs (org_id, user_id) from the identity
  block. UUIDs are token tax for Claude with zero reasoning
  benefit — trace_id handles human-readable correlation in logs.
  Applied: userLabel simplified to `input.user.display_name ??
  'the user'`; normal-branch parenthetical `(org id: ${orgId})`
  removed; onboarding branch's trailing "The user is ..."
  sentence dropped since it read awkwardly without a display
  name. Candidate lesson for the batched-conventions catalog:
  "prompt content is for Claude's reasoning, not audit trail —
  keep UUIDs out unless the model needs them to call a tool."
- 2026-04-18 NOTE   Phase 1.2 Session 4 sub-brief drafting session
  started. Starting SHA: 6cdba6e. Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a; Sessions
  1–3 complete, regression baseline 191/191. Session 4 scope: the
  first paid-API session — real Anthropic client swap,
  OrgContextManager full implementation per master §8, two new
  API routes (/api/agent/{message,confirm}), confirm-route state
  machine with idempotency protection (master §13.3), four new
  audit_log.action values, executeTool dispatch for all remaining
  tool stubs, real-API error classification. Mandatory Cited-Code
  Verification grep surfaced 8 Session 4 forward-pointers in
  src/agent/* (checklist for §5 work items) and one drift
  candidate: journalEntryService.ts:16-17 header comment says
  "Agent source (dry_run, idempotency) deferred to Phase 1.2 —
  rejected" but Session 2's refine removal made the agent path
  accepted. Header comment drifted from code. Small fix, worth
  capturing as a Session 4 housekeeping item (single-line comment
  update). Also noted: canvasDirectiveSchema's
  ProposedEntryCardSchema placeholder TODO tags Session 7, not
  Session 4 — drafting prompt's mention was slightly off.
- 2026-04-18 NOTE   Phase 1.2 Session 4 sub-brief drafting session
  complete. Artifacts: (1) session-4-brief.md (654 lines, within
  500–750 target); (2) CURRENT_STATE.md updated noting Session 3
  complete + Session 4 ready; (3) this entry. Five founder
  pre-decisions codified in sub-brief §4: (1) OrgContext
  injection prose uses names not UUIDs — carries Session 3's
  commit-2 lesson forward verbatim; (2) error classification is
  a dedicated work item with per-class ServiceError mapping and
  retry behavior (401/429/5xx/network/malformed); (3)
  /api/agent/confirm implements the full state machine from
  master §13.3 with an added defensive fifth branch for reserved
  future statuses; (4) paid API minimized to one smoke test
  (CA-66) that skips when ANTHROPIC_API_KEY unset;
  (5) ANTHROPIC_API_KEY provisioning is a founder prerequisite,
  not an executor action. Eleven work items enumerated
  (§6.1–§6.11) covering OrgContextManager + injection prose +
  real callClaude + error classification + executeTool dispatch
  + two routes + four audit writes + serviceErrorToStatus +
  journalEntryService header-comment drift fix (discovered
  during drafting grep) + mandatory pre-execution grep. 16 S4
  exit criteria + 14 new CA tests (CA-53–66). Six-commit plan
  with commit-2 founder review gate. Two observations worth
  preserving for the batched-conventions catalog: (a) the
  drift-candidate fix in §6.10 is a new sub-pattern — "stale-
  file-header drift caught by the Cited-Code Verification grep,"
  candidate extension to Cited-Code Verification saying the
  grep catches source-provenance drift not just refine guards;
  one datapoint only, not codifying. (b) the confirm-route's
  fifth branch (defensive catch-all for unexpected statuses) is
  session-authored glue, not a master-brief divergence — worth
  noting that master specifications sometimes enumerate only
  expected branches and session authorship adds defensive
  catch-alls without unfreezing master.
- 2026-04-18 NOTE   Phase 1.2 Session 3 execution complete. All
  10 S3 exit criteria pass. 4 commits on top of 1562d3c:
  98791f8 (persona prompts + suffixes + OrgContext stub),
  1f4d8cf (buildSystemPrompt + orchestrator wire-up +
  structural-retry surface fix + CA-43 inversion — commit-2
  founder review gate produced one polish before landing),
  5e05d91 (12 locale keys × 3 files), and commit 4 (this
  commit: CA-48 through CA-52 tests). Starting model: Claude
  Opus 4.7 — unchanged throughout. Full regression: 50 test
  files, 191 tests, 0 failures (178 baseline + 13 new its
  across 5 new CA files; CA-49, CA-50, CA-51, CA-52 each have
  multiple it-blocks covering main path + negative cases, which
  the execution prompt explicitly permitted). Master brief
  still frozen at aae547a. Three lessons worth preserving for
  the batched-conventions catalog (all candidates, none codified
  yet): (1) "verbatim vs skeleton+upstream" from drafting
  discovery 1; (2) "Shipped-Code-to-Spec Verification" from
  drafting discovery 2; (3) "UUIDs out of prompts" from
  commit-2 polish + (4) the "internal-helper refactor deserves
  friction-journal NOTE" pattern observed during commit-2
  review. Batching until a third datapoint surfaces per
  founder discipline. Session decomposition discipline held:
  no Session 4+ scope leaked in (no OrgContextManager logic,
  no API routes, no real Anthropic client).
- (earlier entry preserved below)
- 2026-04-18 NOTE   Phase 1.2 Session 2 execution complete. All
  15 S2 exit criteria pass. 4 commits on top of fc306c5:
  0bee609 (ServiceError codes + 10 tool schemas +
  canvasDirectiveSchema), ea2f09e (orchestrator skeleton +
  mocked callClaude + fixtures + test factory), 3539223
  (persona whitelist + session load/create + trace_id
  propagation), and commit 4 (this commit: Phase 1.1 agent-path
  guard removal + unit test inversions + CA-39 through CA-47
  integration tests + friction journal close-out). Starting
  model: Claude Opus 4.7 — unchanged throughout. Full
  regression: 45 test files, 178 tests, 0 failures (162
  baseline + 16 new: 9 CA-* files contributing 15 it-blocks +
  1 net from unit test inversion). Master brief still frozen
  at aae547a. Two discoveries worth preserving for future
  sessions: (1) the Phase 1.1 guard-removal sub-brief gap
  captured above — a new class of drafter oversight alongside
  CA-37-style count-drift gaps; (2) the Map key-type narrowing
  around tool-name lookups (orchestrator/index.ts line 141 in
  the first draft failed typecheck because `as const` on
  `.name` narrowed the Map key to literal tool names while
  Anthropic's ToolUseBlock.name is just string; fixed with
  `Map<string, (typeof tools)[number]>`). Session
  decomposition discipline held: no Session 3+ scope leaked
  in. No new open questions beyond the sub-brief-drafting
  lesson above.
- 2026-04-18 NOTE   Phase 1.2 Session 4 execution session —
  starting. Starting SHA: ec86a63 (Session 4 readiness anchor,
  matches sub-brief freeze). Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a.
  Completion target: all 16 S4 exit criteria (S4-1 through
  S4-16) pass after the six-commit cadence in sub-brief §11.
  Commit 2 has a founder review gate for the OrgContext
  injection prose authored against master §8 + Pre-decision 1
  (names not UUIDs). ANTHROPIC_API_KEY: present in .env.local
  (108 chars, sk-ant- prefix) — CA-66 will run the real-API
  smoke test, not skip. Sub-brief at
  docs/09_briefs/phase-1.2/session-4-brief.md is the spec.
  Six execution-prompt clarifications extend the sub-brief
  (A–F) based on a fresh-pass re-read that surfaced two
  concrete gaps and a pre-existing caveat:

  - Clarification A — explicit import-retarget list for §6.1
    (5 files importing OrgContext from the Session 3 stub
    location, verified by pre-drafting grep).
  - Clarification B — CA-54 uses BOTH positive (org_name,
    industry_display_name, functional_currency, controller
    display_name substrings) and negative (zero v4 UUID regex
    hits) assertions.
  - Clarification C — CA-66 failure interpretation: pass /
    skip-unset / fail-with-AGENT_UNAVAILABLE are three
    distinct outcomes, only the first two are Session 4
    pass-states and the third is key-side not code-side.
  - Clarification D — null-org audit emission uniform skip
    rule. §6.8 specifies four agent.* audit emits but three of
    them (session_created, message_processed, tool_executed)
    fire in contexts where session.org_id can be null during
    onboarding per master §9.1. audit_log.org_id is uuid NOT
    NULL (initial schema line 486, unchanged by migration 118).
    recordMutation's AuditEntry.org_id is a required string.
    Uniform rule: skip the emit when session.org_id is null,
    wrapped in try/catch that logs but does not rethrow (per
    Clarification F). Provenance recovered on first
    session_org_switched when user creates their first org.
  - Clarification E — org-switch detection logic + transition
    matrix + CA-65 expansion + test ripple. §6.8 row 4
    described the trigger parenthetically but not the code;
    branch-2 filter silently misses org-switch today. New
    detection query before branch 3 INSERT. loadOrCreateSession
    signature extends to (input, ctx, log). Ripple: 6 existing
    test call sites (CA-45 × 4, CA-46 × 2) need ctx threaded
    via makeTestContext at describe scope. Commit 4 ordering:
    signature + test ripple FIRST (typecheck), then executeTool
    dispatch, then audit emits, then §6.10 housekeeping.
    CA-65 grows to two it-blocks in one file (org_A→org_B and
    null→org_X).
  - Clarification F — tx-atomicity caveat (non-blocking).
    recordMutation's header asserts same-transaction-as-mutation
    per INV-AUDIT-001 but Session 4's three new emit sites
    (loadOrCreateSession, handleUserMessage, executeTool) are
    not inside a transaction. Pre-existing architectural gap
    inherited from master §16. Session 4 applies try/catch
    mitigation only; Phase 2 events-table migration restores
    tx-atomicity. Session close adds one paragraph to the
    closeout entry naming the gap.

  Brainstorming/pressure-test cycle before this prompt: fresh-
  pass caught the null-org NOT NULL conflict (Clarification D);
  WSL Claude's pressure test tightened per-tool matrix → uniform
  skip rule and surfaced the tx-atomicity caveat; founder added
  the try/catch mitigation and caught the 6-call-site test
  ripple before Commit 4. Four improvements from two reviewers
  over three cycles. Stopping point judged correct — diminishing
  returns beyond this.
- 2026-04-18 WRONG  Session 4 commit 1 pre-check surfaced a
  material correction to Clarification D's premise. The
  Clarification cited audit_log.org_id as uuid NOT NULL
  (20240101000000_initial_schema.sql:486) but migration 113
  (20240113000000_extend_memberships.sql:137, Phase 1.5B,
  2026-04-15) altered that column via ALTER TABLE audit_log
  ALTER COLUMN org_id DROP NOT NULL. The constraint has been
  gone for three days. Both the fresh-pass re-read and the
  pressure test missed the migration. Corroborating evidence:
  userProfileService.updateProfile:115 writes
  org_id: undefined as unknown as string for user.profile_updated
  audit rows — a type cast that only works at runtime because
  the DB column is nullable. CA-15 (userProfileAudit.test.ts)
  already passes in the 191/191 baseline, confirming nullable
  writes work end-to-end. Implications: Clarification D's skip
  rule is no-op-safe rather than load-bearing; AuditEntry.org_id
  type is stale (string, should be string | null); Session 4
  could emit agent.* events during onboarding with null org_id
  for richer audit coverage. Chose Option A (ship per
  Clarification D verbatim; defer type cleanup to a dedicated
  session). Rationale: Option C's drive-by type fix would ripple
  to every mutating service function in the codebase and deserves
  its own review cycle. Skip rule is behaviorally safe either way
  and has been reviewed + approved. Candidate for a future
  convention catalog entry (sixth staged): "When a DB column's
  NOT NULL constraint is altered by a later migration, the
  TypeScript type at the insert boundary must also be updated —
  verify migration lineage, not just the initial schema." Also
  noted during pre-check: CA-45 has 6 loadOrCreateSession calls
  (4 it-blocks) and CA-46 has 3 calls (2 it-blocks) — 9 total,
  not the "6" stated in Clarification E's test-ripple section.
  The approach (threading ctx via makeTestContext at describe
  scope) is unchanged; only the expected-count number for the
  pre-commit-4 grep shifts from 7 to 10.
- 2026-04-18 NOTE   Session 4 commit 2 required a mid-commit
  query rewrite. Sub-brief §6.1 specified loadOrgContext as joining
  memberships → user_profiles via PostgREST embedding to fetch
  controller display names. First test run surfaced a PostgREST
  error: "Could not find a relationship between 'memberships'
  and 'user_id' in the schema cache." Root cause: memberships
  and user_profiles both reference auth.users as parallel FKs,
  and PostgREST only embeds through direct FKs between the two
  tables. Rewrote as two sequential queries (find controller
  user_ids from memberships filtered to role=controller +
  status=active, then batch lookup user_profiles via .in()).
  Behaviorally identical, same master §8 return shape. Flagged
  during commit-2 review gate and approved. Candidate for a
  sixth future-convention datapoint: "When a sub-brief specifies
  a query shape that turns out to be infeasible due to schema/
  tool constraints (PostgREST FK embedding, Supabase join
  limits, etc.), execution rewrites and flags in the review
  gate." One datapoint; not codifying.
- 2026-04-18 NOTE   Phase 1.2 Session 4 execution complete. All
  16 S4 exit criteria pass. 6 commits on top of ec86a63:
  e774577 (OrgContextManager full shape + stub retirement),
  96b904b (OrgContext injection prose + buildSystemPrompt wiring
  — commit-2 founder review gate produced one polish: bold
  removed from org_name in prose), 34c8fe3 (real Anthropic
  client + error classification), b4585bb (executeTool dispatch
  + audit emits + journalEntryService header fix), f288da2
  (/api/agent/{message,confirm} routes + serviceErrorToStatus),
  da4641e (CA-53 through CA-66 tests). Starting model: Claude
  Opus 4.7 — unchanged throughout. Full regression: 60 test
  files, 209 tests, 0 failures (191 baseline + 18 new it-blocks
  across 10 new CA-* files: CA-53 × 2, CA-54 × 1, CA-55–59 × 6
  in one file, CA-60 × 2, CA-61–63 × 3, CA-64 × 1, CA-65 × 2,
  CA-66 × 1). Master brief still frozen at aae547a. Sub-brief
  still frozen at ec86a63. ANTHROPIC_API_KEY present — CA-66
  ran against real Claude and passed (one paid API call).

  Clarification F tx-atomicity paragraph (session-close
  obligation): recordMutation's header asserts same-transaction-
  as-mutation per INV-AUDIT-001, but Session 4's three new
  agent.* emit sites (loadOrCreateSession branch 3,
  handleUserMessage's three return points, executeTool's
  finally block) are not inside a service transaction —
  adminClient issues statement-by-statement REST calls, so
  the session INSERT / message persist / tool execution and
  their audit rows are not atomic. This is pre-existing at the
  architectural level (master §16 specifies the emits; the
  current orchestrator has no tx wrapper). Session 4 applied
  try/catch mitigation only — audit failures log but do not
  throw, preventing a DB audit error from poisoning user-facing
  requests. Phase 2's events-table migration (INV-LEDGER-003)
  restores tx-atomicity by making events the Layer 3 truth
  written inside the mutation transaction. No ADR needed for
  this gap; it's tied to the pending phase evolution that the
  recordMutation.ts header comment and the events table's
  "reserved seat" comment both reference.

  Execution-time finds worth preserving:

  (1) Migration 113 pre-check discovery — captured in the
  WRONG entry above. audit_log.org_id has been nullable since
  Phase 1.5B (2026-04-15), which means Clarification D's skip
  rule is no-op-safe rather than load-bearing. Option A shipped.

  (2) PostgREST FK embedding rewrite (commit 2) — captured in
  the NOTE entry above.

  (3) journalEntryService.post missing idempotency_key column
  write. The DB CHECK idempotency_required_for_agent (CLAUDE.md
  Rule 6) requires idempotency_key when source='agent', but the
  service's INSERT omitted the column. CA-61 (pending → confirmed)
  surfaced this as POST_FAILED: "violates check constraint
  idempotency_required_for_agent." One-line fix added mid-commit-6:
  `idempotency_key: parsed.idempotency_key ?? null` in the
  journal_entries INSERT. Pre-existing bug — Session 4 is the
  first session to exercise source='agent' end-to-end through
  the service layer. Candidate for a future-convention
  datapoint: "Every DB CHECK constraint that gates a field
  must be matched by an explicit INSERT column write in the
  owning service; absence surfaces only at runtime when a new
  source path is exercised." Not codifying — one datapoint.

  (4) PostgREST embedding error message pattern. The error
  "Could not find a relationship between X and Y" surfaces as
  a Supabase-client exception, not a typecheck failure — the
  query shape compiles fine because PostgREST embedding is
  runtime-resolved. Worth noting for future schema-join work.

  Six candidate-future-conventions staged now (up from five at
  session start): prompt-UUID discipline, Shipped-Code-to-Spec
  Verification, verbatim-vs-skeleton citation distinction,
  internal-helper refactor NOTE, migration-lineage verification
  (new from this session), query-shape infeasibility handling
  (new from this session). None codified per founder discipline
  — batching until a third datapoint surfaces for each.

  Session decomposition discipline held: no Session 5+ scope
  leaked in (no onboarding state machine, no form-escape
  surfaces, no AgentChatPanel UI rewrite, no canvas directive
  extensions, no ProposedEntryCard rewrite). The four finds
  above are all within Session 4's natural scope — the first
  three are gap-fills discovered during execution of a
  spec-defined work item, the fourth is a documentation note.
  Master §21 CA-* numbering drift still deferred to Session 8.

  Approximate session time: ~2h (including the pre-commit-1
  migration-113 halt, the commit-2 review gate, the PostgREST
  rewrite, the test-ripple count correction from 6 to 10, and
  the commit-6 idempotency_key fix).
- 2026-04-18 NOTE   Phase 1.2 Session 4.5 — AuditEntry nullable
  cleanup. Single-commit follow-up to Session 4's migration-113
  find. Scope: change AuditEntry.org_id from string to
  string | null in src/services/audit/recordMutation.ts; remove
  the `undefined as unknown as string` cast at
  userProfileService.updateProfile:115 in favor of
  `org_id: null`; audit every other recordMutation call site
  for null-correctness. Audit result: 18 recordMutation call
  sites across 8 files — 17 pass non-null org_ids (safe), 1 is
  the hack (cleanup target). authEvents.ts's login/logout
  writes bypass recordMutation and insert directly with
  `org_id: null` — that code is already correct; refactoring it
  to use recordMutation would have been scope creep, left
  alone. No test additions, no new service functions. 209/209
  still green. Type change is purely additive (widens the
  accepted input set), so existing non-null callers continue to
  typecheck. Starting model: Claude Opus 4.7 — continuous with
  Session 4. Starting SHA: 9c6552d. One commit lands this.

  Clarification D skip-rule reconsideration (surfaced for
  Session 5, not changed here): now that audit_log.org_id is
  known to accept null, Session 4's three agent.* emit sites
  (loadOrCreateSession branch 3, handleUserMessage's three
  return points, executeTool's finally block) could emit with
  null org_id during onboarding instead of skipping. This
  would give richer audit coverage for the onboarding flow
  Session 5 is building. The trade-off is modest — skipping
  loses nothing critical (provenance recovers on first
  session_org_switched), but the explicit emits make
  onboarding-time agent behavior visible in audit_log for
  debugging. Flag for Session 5 to decide as part of its
  onboarding-state-machine design; Session 4.5 does not
  change the skip rule.

  Approximate session time: ~25 minutes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief drafting session
  started. Starting SHA: cbbfafd (Session 4.5 closeout anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Master
  brief frozen at aae547a; Sessions 1–4 + 4.5 complete,
  regression baseline 209/209. Target artifacts: (1)
  docs/09_briefs/phase-1.2/session-5-brief.md (new), (2)
  docs/09_briefs/CURRENT_STATE.md (stale — still says "Session 4
  ready to execute"), (3) this entry + session-close entry.
  Session 5 scope per founder drafting prompt: master §11
  onboarding flow implementation (state machine, welcome page
  minimal-functional, sign-in redirect, orchestrator state
  integration, invited-user detection). Seven founder
  pre-decisions locked in the drafting prompt: (1) minimal
  welcome, no Session 7 imports; (2) AgentChatPanel contract
  `{ orgId: string | null }`; (3) invited-user detection via
  server component; (4) step 4 completion is a state flag flip
  (not canvas_directive — defers first canvas_directive use to
  Session 6/7); (5) step 1 completes when display_name is set
  (not all four §11.3 fields); (6) resolvePersona onboarding
  stub confirmed as master decision A; (7) test delta is a
  floor, not a cap. Mandatory pre-drafting Cited-Code
  Verification grep clean: zero welcome-page hits in src/app/,
  zero OnboardingState/state.onboarding hits (Session 5
  introduces both), last_login_at used only for login-time
  tracking (not as onboarding signal per Pre-decision 5). One
  open drafting decision: step-4 completion signal — options
  (a) respondToUser template_id pattern, (b) new
  completeOnboarding tool, (c) orchestrator heuristic. Founder
  leans toward (a). To be pressure-tested during drafting.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief drafting session
  complete. Artifacts: (1) session-5-brief.md (705 lines — ~50
  longer than Session 4's 654, proportional to Session 5's wider
  scope and the Pre-decision 8 three-option pressure-test);
  (2) CURRENT_STATE.md updated — Session 4 / 4.5 marked complete,
  Session 5 marked ready to execute; (3) this entry. Eight
  founder pre-decisions locked in sub-brief §4: seven from the
  drafting prompt verbatim + one drafting-authored (Pre-decision
  8 — step-4 completion signal is the respondToUser template_id
  pattern `agent.onboarding.first_task.navigate`, with Options B
  and C rejected during pressure-test). Rationale for Option A:
  preserves the "always respondToUser at turn end" discipline
  (master §6.2 item 2), adds no new tool (honors §6.4 whitelist
  invariance + Session 5's no-new-tools out-of-scope constraint),
  fully observable via existing agent.message_processed audit
  row, needs only one new orchestrator detection branch. Option
  B would add a persona-whitelist decision and master-brief
  divergence. Option C has no clean programmatic trigger.

  Nine work items enumerated (§6.1–§6.11; §6.11 is the mandatory
  pre-execution grep, §6.10 is a five-line comment add): (6.1)
  OnboardingState type + read/write helpers at
  src/agent/onboarding/state.ts; (6.2) extended onboardingSuffix
  — commit-1 founder review gate here for the step-aware prose;
  (6.3) buildSystemPrompt wiring; (6.4) orchestrator state
  read/write + three transition detectors + step-4 template_id
  detection; (6.5) AgentResponse.onboarding_complete optional
  field; (6.6) /api/agent/message initial_onboarding body field;
  (6.7) welcome page (server component with client chat panel
  embed); (6.8) sign-in redirect logic; (6.9) AgentChatPanel
  prop contract conformance; (6.10) resolvePersona inline
  comment citing master decision A.

  Eleven S5 exit criteria + 7 new CA tests (CA-67 through CA-73,
  with CA-67 and CA-73 permitted multi-it-block per Session 3/4
  pattern). 5-commit cadence: (1) types + suffix + wiring —
  founder review gate; (2) orchestrator transitions + response
  shape; (3) welcome page + AgentChatPanel contract; (4) sign-in
  redirect; (5) tests + locale keys.

  Three observations surfaced worth preserving:

  (1) Master §21 CA-46/CA-47 drift continues. Master's CA
  catalog references onboardingNewUser.test.ts as CA-46 and
  onboardingInvitedUser.test.ts as CA-47 — different numbers
  and different file names than the actual shipped CA-45
  (agentSessionPrecedence) and CA-46 (agentSessionOnboarding)
  from Session 2. Session 5 continues CA-67+ per Session 3's
  pattern; the reconciliation is Session 8 scope. Noted in
  §2 "NOT delivered" list.

  (2) AgentChatPanel stub conformance (Pre-decision 2) is a
  Session 5 work item (§6.9), but the drafter did not verify
  the current stub's actual prop signature during drafting —
  execution's first task in commit 3 will be reading the stub
  and confirming whether the contract `{ orgId: string | null,
  initialOnboardingState?: OnboardingState }` requires adding
  props or just leaves the existing shape intact. If the stub
  already accepts these props, commit 3 is simpler; if not,
  commit 3 adds them. Either way, Session 7's rewrite must
  honor the contract. Flag this as an execution-time discovery
  point, not a sub-brief ambiguity.

  (3) The Session 4.5 "Session 5 to decide" flag about
  Clarification D's skip rule was resolved in sub-brief §9
  (What is NOT in Session 5): skip rule stays intact. Richer
  onboarding audit coverage via null-org emits is not worth
  loosening a pressure-tested decision mid-flow. Flagged as a
  deferred candidate for whenever recordMutation's tx-atomicity
  gets revisited (Phase 2 events table per INV-LEDGER-003).

  Cited-Code Verification grep at session start: clean. Zero
  welcome-page hits in src/app/, zero OnboardingState /
  state.onboarding hits, last_login_at used only for login-time
  tracking (not as onboarding signal per Pre-decision 5). No
  surprises; the nine existing onboarding-related src/agent/
  hits are all Session 3 (onboardingSuffix) + Session 4
  (orchestrator references, persona identity block mentioning
  "onboarding path", createOrganization/listIndustries tool
  mentions) as expected.

  No master-brief inconsistencies surfaced requiring an
  unfreeze. The master §21 CA-* numbering drift is the closest
  thing to an inconsistency but it's a known deferred item for
  Session 8, not a Session 5 blocker.

  Seven candidate-future-conventions staged (unchanged from
  Session 4.5 close — no new candidates from this drafting
  session): prompt-UUID discipline, Shipped-Code-to-Spec
  Verification, verbatim-vs-skeleton citation distinction,
  internal-helper refactor NOTE pattern, migration-lineage
  verification, query-shape infeasibility handling, and the
  narrower one-datapoint DB-CHECK ↔ INSERT column-list matching.

  Approximate drafting time: ~40 minutes (including the three-
  option step-4 pressure-test, the CURRENT_STATE surgery, and
  this entry).
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief revision session
  started. Starting SHA: 1ea60dc (Session 5 drafting anchor).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Four
  founder-review tightening items to apply: (1) §6.4 item 3
  step-transition rule — advance to smallest uncompleted step
  > N, not hardcoded 1→2/2→4; (2) §6.4 item 5 state persists
  only on success path (failed turns don't advance the machine);
  (3) §6.1 also exports onboardingStateSchema Zod alongside the
  TS interface in src/agent/onboarding/state.ts; (4) §6.7
  explicit Option B decision — invited-user welcome page uses
  orgId={null} uniformly, richer-context question deferred.
  Plus one minor §10 artifact-list fix (one template_id key,
  not three). No §4 pre-decision changes, no §11 commit-plan
  changes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 sub-brief revision session
  complete. Four founder-review tightenings applied + one
  drafting-bug fix surfaced during Revision 1 work. Sub-brief
  grew 705 → 799 lines; no architectural changes, all spec
  tightening.

  Revisions applied:

  (1) §6.4 item 3 — replaced hardcoded 1→2 / 2→4 transitions
  with the smallest-uncompleted-step-greater-than-N rule. Three
  worked examples added (fresh user step 1, fresh user step 2
  atomic 2+3 advance, invited user step 1 → skip to 4).
  Explicit edge-case handler: if `completed_steps` already
  contains all of {1,2,3,4} before step-N completion, log an
  error and don't re-advance (upstream bug; execution flags).

  (2) §6.4 item 5 — state persists ONLY on the success path.
  Failure paths (Q13 exhaustion, structural-retry exhaustion)
  persist conversation via existing persistSession call but
  MUST NOT persist state changes. Rationale: a failed turn
  should be replayable without skipping a step. Concrete
  implementation named: failure-path calls pass `state:
  undefined`; only the success-path call passes the new state.

  (3) §6.1 now exports `onboardingStateSchema` (Zod) alongside
  the TS interface in the same file. Placement rationale
  added: narrow agent-internal schemas live with their
  subsystem (matches Session 4 pattern); broader boundary
  schemas live under src/shared/schemas/. §6.6's implicit
  schema reference now has a sourced definition.

  (4) §6.7 explicit Option B decision — invited-user orgId is
  `null` uniformly. Full rationale paragraph added: Option A
  would load OrgContext for richer step-4 context but forces
  orchestrator asymmetry (org-switch detection, agent.* audit
  emits, onboarding suffix gating). Option B keeps onboarding
  uniformly orgless; richer-context deferred. The welcome
  page retains the invited user's firstOrgId client-side for
  the completion router.push target.

  Drafting bug surfaced (fix applied as extension of Revision
  1): §6.7's initial-state computation had two errors the
  drafter introduced that the founder's Revision 1 prompt used
  the correct values for. (a) `current_step` was conditionally
  1 or 4 based on invited-user status — wrong; master §11.1's
  trigger only sends users to /welcome when display_name IS
  NULL, so current_step is always 1 on arrival. Invited-user
  shortened flow is expressed via initial `completed_steps`,
  not initial `current_step`. (b) `completed_steps` for
  invited users was stated as `[1, 2, 3]` — wrong; master
  §11.5(c) specifies `[2, 3]` (profile is still needed, which
  is why the user is in onboarding). Fixed §6.7 initial-state
  list with explicit master citation. CA-71's initial-state
  assertion also corrected from `completed_steps:[]` to
  `completed_steps:[2,3]`, matching master §11.5(c). The
  drafter's recap had this correct for the invited-user flow
  *logic* but got the initial-state *numbers* wrong — an
  example of "descriptively correct, numerically wrong"
  drift. Worth noting but not a new convention-candidate —
  it's a narrow single-datapoint class caught by the
  founder's revision-round close reading.

  Minor §10 fix: "Three new template_id keys" → "One new
  template_id key", matching Pre-decision 8's specification
  and §6.2's note that the suffix is English-only prompt prose
  (not a locale-routed user-facing string).

  No master-brief inconsistencies surfaced. No §4 pre-decision
  changes. No §11 commit-plan changes. Seven candidate-future-
  conventions staging unchanged.

  Approximate revision time: ~25 minutes.
- 2026-04-18 NOTE   Phase 1.2 Session 5 execution session —
  starting. Starting SHA: 9c22e07 (Session 5 sub-brief
  revision anchor; sub-brief at
  docs/09_briefs/phase-1.2/session-5-brief.md is frozen and
  authoritative). Starting model: Claude Opus 4.7
  (claude-opus-4-7[1m]). Master brief frozen at aae547a.
  Regression baseline: 209/209. Target test count at
  session close: ~218 (209 + 7 CA-67–73 floor, more if
  sub-assertions surface per Pre-decision 7). Five-commit
  cadence with commit-1 founder review gate for the
  extended onboardingSuffix prose. Eight founder
  pre-decisions in sub-brief §4 are authoritative. Mandatory
  §6.11 Cited-Code Verification grep: clean. Nine hits in
  src/agent/ for onboarding-related text (all Session 3/4
  expected: onboardingSuffix, orgContextSummary, persona
  files, orchestrator, toolsForPersona, listIndustries,
  createOrganization); zero hits in src/app/ (Session 5
  creates /welcome and the sign-in redirect). Zero hits for
  state.onboarding / OnboardingState (Session 5 introduces
  both). `last_login_at` used only for its natural
  login-time tracking in userProfileService + membership
  listing — NOT as an onboarding signal per Pre-decision 5
  (Session 5 uses display_name).
- 2026-04-19 NOTE   Phase 1.2 Session 5 execution complete. All
  11 S5 exit criteria pass. 5 commits on top of 9c22e07:
  be72229 (OnboardingState + extended suffix + buildSystemPrompt
  wiring — commit-1 founder review gate produced one polish:
  "isn't available yet" → "isn't wired in for you right now" on
  step 2's skip handler), 6297b57 (orchestrator state
  transitions + AgentResponse.onboarding_complete), 246ee25
  (welcome page + AgentChatPanel prop contract), f09b73f
  (sign-in redirect logic), 2b644f6 (CA-67 through CA-73 tests).
  Starting model: Claude Opus 4.7 — unchanged throughout. Full
  regression: 67 test files, 226 tests, 0 failures (209 baseline
  + 17 new it-blocks across 7 new CA files — CA-67 × 5, CA-68 ×
  1, CA-69 × 1, CA-70 × 2, CA-71 × 2, CA-72 × 2, CA-73 × 4).
  Target test count was ~218; actual 226 via sub-assertions per
  Pre-decision 7. Master brief frozen at aae547a. Sub-brief
  frozen at 9c22e07.

  Two execution-time finds worth preserving:

  (1) Sub-brief §6.3 internal contradiction — captured at
  Commit 1 review gate. "onboardingSuffix returns empty for null"
  (§6.3 first statement) and "the old behavior (generic
  onboarding suffix) still fires" under the guard (§6.3 second
  statement) are contradictory if both route through the same
  function. Resolved by splitting: onboardingSuffix(state)
  returns empty for null (step-aware path), new
  genericOnboardingSuffix() preserves Session 3's static block
  verbatim. buildSystemPrompt's defense-in-depth guard calls
  the generic variant as fallback. CA-49 stays green, Session 3
  behavior preserved. Datapoint #3 for the "narratively correct,
  contractually wrong" drift pattern — first was Session 4's
  test-ripple count correction, second was the invited-user
  initial state [1,2,3] vs master §11.5(c)'s [2,3] during
  Session 5 sub-brief revision. Founder flagged three datapoints
  as the convention-proposal bar; candidate will be staged after
  Session 5 close per founder discipline.

  (2) orgService.createOrgWithTemplate input-schema mismatch —
  surfaced by CA-69 on first end-to-end exercise of the
  createOrganization agent dispatch. Agent tool's
  createOrganizationInputSchema (8 fields) is narrower than
  orgService's createOrgProfileSchema which also requires
  accountingFramework + defaultReportBasis. Fix: executeTool's
  createOrganization dispatch merges 'aspe' / 'accrual' defaults
  (matching the DB column defaults from migration 109) before
  calling the service. Same class as Session 4's missing
  idempotency_key column write — a pre-existing gap exposed
  only when a new session first exercises an end-to-end path.
  Narrow single-datapoint class; not a new convention candidate.

  No master-brief inconsistencies surfaced requiring an
  unfreeze. Clarification D skip rule stayed intact per §9 of
  the sub-brief (Session 5 explicitly declined to loosen for
  richer onboarding audit coverage — Phase 2 events-table
  revisit remains the right venue). resolvePersona onboarding
  stub confirmed as master decision A with the durable inline
  comment per Pre-decision 6.

  No Anthropic API calls during execution — CA-67 through
  CA-73 are all fixture-driven (no CA-66-style real-API smoke).
  Cost: zero.

  Candidate-future-conventions: eight staged now (seven from
  Session 4.5 close + one proposed after Session 5: the
  "narratively correct, contractually wrong" drift pattern,
  with three datapoints accumulated). None codified per founder
  batching discipline.

  Session decomposition discipline held: no Session 6+ scope
  leaked in (no form-escape surfaces, no Skip link
  implementation, no canvas directive extensions, no
  AgentChatPanel rewrite beyond the minimal prop-contract
  conformance + onboarding-mode branch). The AgentChatPanel
  change does add a new OnboardingChat subcomponent that
  Session 7's rewrite will consolidate — scoped to render the
  minimal welcome flow without importing any Session 7
  components (SuggestedPrompts is skipped in onboarding mode
  per Pre-decision 1's spirit).

  Approximate session time: ~60 minutes (including the commit-1
  review gate pause, the CA-49 test-preservation fix, the
  CA-69 createOrganization input-schema fix, and this entry).
- 2026-04-19 NOTE   Phase 1.2 Session 5.1 — smoke-test-surfaced
  bug fixes. Starting SHA: 4487e19 (Session 5 closeout).
  Starting model: Claude Opus 4.7 (claude-opus-4-7[1m]). Scope:
  two bugs caught by the autonomous EC-20 smoke (Session 5 + 5,
  running Turn 2 of a User-A conversation against real Anthropic
  API): (1) orchestrator persists a trailing respondToUser
  tool_use block in session.conversation, causing every
  multi-turn conversation to fail on Turn 2 with Anthropic's
  400 "tool_use ids were found without tool_result blocks
  immediately after" — this is a Session-2-era defect fixture
  tests couldn't catch; (2) Claude invents template_ids not in
  locale files (smoke test saw `onboarding.profile.ask_display_name`
  which doesn't exist in messages/*.json) — the system prompt
  tells Claude the contract but doesn't enumerate valid keys,
  which is a Session-3-era gap. Both bugs block product behavior;
  bug (1) blocks every multi-turn conversation, bug (2) causes
  runtime i18n render failures. Baseline 226/226. Smoke-test
  scripts at scripts/_smoketest-*.ts deleted per Session 5.1
  prompt (served their purpose; not product code). Pre-execution
  grep for template_id references in src/agent/ came back clean
  — the three that the source code explicitly references
  (agent.error.tool_validation_failed,
  agent.error.structured_response_missing,
  agent.onboarding.first_task.navigate) are all present in all
  three locale files. Two keys in the agent.* namespace
  (agent.emptyState, agent.suggestedPromptsHeading) are UI
  strings rendered by AgentChatPanel / SuggestedPrompts — not
  response templates; will be excluded from the valid-response
  list.
- 2026-04-19 NOTE   Phase 1.2 Session 5.1 execution complete.
  Two commits on top of 4487e19: 9b1af3d (Bug 1:
  message-protocol invariant in persistSession success path),
  887d5ea (Bug 2: enumerate valid template_ids in system
  prompt). Starting model: Claude Opus 4.7 — unchanged. Full
  regression: 69 test files, 233 tests, 0 failures (226
  baseline + 2 protocol-invariant + 5 template-id set closure
  it-blocks). Typecheck clean. Master brief frozen at aae547a.
  Session 5 sub-brief frozen at 9c22e07. Session 5 feature
  commits unchanged.

  Bug 1 (message-protocol violation) details:
  - Surface: every multi-turn agent conversation against real
    Claude fails on Turn 2 with Anthropic 400
    "tool_use ids were found without tool_result blocks
    immediately after."
  - Root cause: persistSession wrote resp.content verbatim,
    including trailing respondToUser tool_use blocks.
    respondToUser is orchestrator-internal (consumed by
    handleUserMessage, not executed via executeTool) so has
    no matching tool_result. Anthropic's protocol rejects the
    sequence on Turn 2 when the conversation is replayed.
  - Secondary: if Claude bundled a non-respondToUser tool_use
    alongside respondToUser in one turn (e.g., listIndustries +
    respondToUser), the success path also failed to persist the
    tool_use+tool_result pair — the toolResults accumulated in
    memory weren't pushed to messages.
  - Fix: success path (around line 439) filters respondToUser
    from resp.content, pushes the {assistant filtered content,
    user toolResults} pair into messages when otherTools.length
    > 0, and terminates with a text placeholder
    "[responded with template_id=X]" so the sequence is protocol-
    valid.
  - Regression test: agentConversationProtocolInvariant.test.ts
    asserts (a) no respondToUser tool_use blocks in the persisted
    conversation; (b) every non-respondToUser tool_use has a
    matching tool_result in the immediately-following user
    message. Verified test FAILS against pre-fix code via git
    stash.
  - NOT fixed: Q13 exhaustion (line 347) and structural-retry
    exhaustion (line 468) persistSession calls have the same
    latent issue if the failing resp contained tool_uses. Left
    alone per the Session 5.1 prompt's recommendation — those
    paths return error templates telling the user to rephrase,
    so continuation is rare. Flag for future session if
    empirically hit.

  Bug 2 (template_id invention) details:
  - Surface: smoke test observed Claude emitting
    `onboarding.profile.ask_display_name`, which doesn't exist
    in any locale file. next-intl would throw "missing
    translation" at UI render.
  - Root cause: the STRUCTURED_RESPONSE_CONTRACT says "every
    template_id must exist in the locale files" but doesn't
    enumerate which keys are valid. Claude invents
    semantically reasonable keys.
  - Fix: new module src/agent/prompts/validTemplateIds.ts
    exports VALID_RESPONSE_TEMPLATE_IDS (13 allowlisted keys)
    + UI_ONLY_AGENT_KEYS (2 UI-only agent.* keys). A new
    VALID_TEMPLATE_IDS prompt section, wired into all three
    personas via _sharedSections.ts, enumerates the allowlist
    grouped by namespace with explicit "Do NOT invent new keys"
    instruction.
  - Regression test: agentTemplateIdSetClosure.test.ts enforces
    set equality between the two exported lists and the actual
    en.json agent.* + proposed_entry.* keys. Five it-blocks
    cover subset, exhaustiveness, disjointness, and section
    rendering.

  CA-67 assertion update: the step-1/2/3 "not to contain
  agent.onboarding.first_task.navigate" negative checks used
  to look at the full prompt output. After Session 5.1's
  VALID_TEMPLATE_IDS section, that template_id appears in
  every prompt as part of the enumerated allowlist. Retargeted
  the negative assertion to "Do NOT use this template_id for
  any other turn" — the step-4-specific reservation guardrail,
  which only exists in the step-4 onboarding suffix. Same
  semantic check; different anchor string.

  Pre-existing test-isolation flake observed: on the first full
  test run after Bug 2 landed, CA-54 and CA-15 reported
  failures. Re-running the suite cleared both. Root cause is
  userProfileAudit's afterAll modifies SEED.USER_CONTROLLER's
  display_name temporarily, and if another test querying that
  user runs in parallel (or reads mid-window), there's a
  transient state mismatch. Pre-existing issue, NOT caused by
  Session 5.1. Worth tracking but out of scope here. Test
  isolation via trace_id cleanup is Session 5.1 pattern
  already in place — this is a different leak vector.

  Execution-time observations (no new convention candidates
  needed for these two — the class of finding is already
  captured by staged candidates):

  (1) Params-shape gap (Session 5.1 deferred). The prompt now
  enumerates valid template_ids but doesn't specify which
  params each template expects (e.g., agent.greeting.welcome
  needs {user_name}, agent.accounts.listed needs {count}).
  Smoke test saw Claude emit params:{} where the template
  expected structured params. Symptom: the rendered string has
  literal "{user_name}" text where a name should be. Not a
  crash, but a visible UI defect. Flag for a future session —
  likely folded into Session 7's UI rewrite where rendered
  output becomes visible to the founder during testing.

  (2) Model deprecation warning still firing on every call:
  'claude-sonnet-4-20250514' deprecated June 15, 2026. Not
  urgent (~8 weeks), but a future session's migration task.

  Staging the Session 5.1 convention candidate:

  (9) Mock-vs-Protocol Invariant Gap — fixture-based agent
  tests (CA-39 through CA-73) exercise the orchestrator's
  Zod validation + state machine + response extraction, but
  cannot catch Anthropic API protocol violations because the
  mocked callClaude doesn't enforce the tool_use →
  tool_result pairing rule. The smoke test is the only
  venue that catches these. One datapoint (Bug 1). Not
  codifying yet per founder batching discipline. Future
  instances: e.g., conversation-length limits, model-specific
  shape requirements, streaming constraints — any
  protocol-level rule fixtures don't model.

  Nine candidate-future-conventions staged now (eight from
  pre-Session-5.1 + this new one). None codified per founder
  batching discipline. The "Spec-to-Implementation
  Verification" candidate (datapoint #3 as of Session 5 close)
  remains convention-ready; founder stated it would be
  codified during Session 6 drafting.

  Smoke test scripts at scripts/_smoketest-create-users.ts and
  _smoketest-userA-full.ts were deleted at session start per
  the Session 5.1 prompt. Findings file at
  /tmp/smoketest-findings.md still exists (not committed;
  served its purpose as input to Session 5.1).

  Approximate session time: ~50 minutes.
- 2026-04-19 NOTE   Phase 1.2 Session 5.2 — PROFILE_NOT_FOUND +
  step-4 completion guard. Starting SHA: 6a588f8 (Session 5.1
  closeout). Starting model: Claude Opus 4.7. Scope: two
  mechanical fixes surfaced by the EC-20 smoke re-run:
  (1) userProfileService.updateProfile throws PROFILE_NOT_FOUND
  when the user_profiles row doesn't exist — fine in production
  where sign-in's getOrCreateProfile creates the row first, but
  fragile: admin-created users hit a dead-end and any silent
  failure of the sign-in trigger would also break
  updateUserProfile. Fix: convert to upsert (ON CONFLICT DO
  UPDATE) so the ordering dependency goes away. (2) The
  onboarding state machine allows step-4 completion without
  step 1 ever completing — the advance rule's math permits
  jumping from step 1 to step 4 (via createOrganization's
  atomic 2+3) leaving completed_steps = [2, 3]. User "completes
  onboarding" with display_name null. Fix: add
  completed_steps.includes(1) guard to the step-4 completion
  detector, plus tighten the onboardingSuffix step-4 prose to
  branch when step 1 is missing so the agent retries rather
  than treating the session as done. Baseline 233/233.
  Pre-execution grep clean: PROFILE_NOT_FOUND used by both
  updateProfile (being removed) and getProfile (unchanged);
  zero pre-existing completed_steps.includes code guards.
- 2026-04-19 NOTE   Phase 1.2 Session 5.2 execution complete.
  Two commits on 6a588f8: e0a4435 (Fix 1: updateProfile upsert),
  f69fe75 (Fix 2: step-4 completion guard + suffix tightening).
  Full regression: 70 test files, 238 tests, 0 failures (233
  baseline + 1 new it-block in CA-15 for the upsert-insert
  branch + 4 new it-blocks in onboardingStep4GuardNoStep1 for
  the step-4 guard and suffix prose). Typecheck clean. Master
  brief frozen at aae547a. Session 5 sub-brief frozen at
  9c22e07. Session 5 / 5.1 feature commits unchanged.

  Fix 1 (userProfileService.updateProfile upsert):
  - Replaced the SELECT-then-throw-PROFILE_NOT_FOUND shape with
    SELECT (for audit before-state) followed by UPSERT via
    supabase-js's .upsert({...}, { onConflict: 'user_id' }).
  - Atomic at the DB layer (ON CONFLICT DO UPDATE), so the
    SELECT→UPSERT race window is benign for correctness. Audit
    fidelity in the narrow race window (concurrent insert
    between our SELECT and our UPSERT) may report
    before_state: null when a concurrent inserted existed;
    single-user flows make this vanishingly rare; noted in the
    service comment.
  - Audit action stays `user.profile_updated` in both branches
    (the semantic verb — the caller didn't know whether the row
    existed). before_state: populated on UPDATE, null on
    INSERT per Phase 1.5A convention.
  - `auto_created: boolean` added to the log line so operators
    can distinguish the two branches.
  - PROFILE_NOT_FOUND stays in ServiceError.ts — getProfile
    still uses it.
  - CA-15 (userProfileAudit.test.ts) gains a second describe
    block for the upsert-insert branch: pre-delete seed profile
    row for USER_AP_SPECIALIST, call updateProfile, confirm the
    row materializes and audit has before_state: null. AfterAll
    restores the seed profile so downstream tests stay green.

  Fix 2 (step-4 completion guard):
  - handleUserMessage's step-4 completion branch now also
    checks currentOnboarding.completed_steps.includes(1) before
    flipping in_onboarding=false. An else-if branch logs a
    `warn` on the blocked path so state-machine drift is
    visible in logs.
  - onboardingSuffix's step-4 case now branches on
    completed_steps.includes(1). Normal path (step 1 done)
    emits the unchanged first-task invitation prose. Recovery
    path (step 1 missing) emits a new section titled "Step 4
    (blocked: profile incomplete)" that directs the agent back
    to updateUserProfile and explicitly tells it NOT to emit
    the completion template_id while step 1 is pending.
  - Four-it-block regression test covers: guard blocks
    completion on [2,3] state; positive control on [1,2,3]
    state; suffix emits recovery prose on [2,3]; suffix emits
    normal prose on [1,2,3].

  Prose authorship observation: the Fix 2 suffix tightening
  adds authored conditional prose within the already-review-
  gated step-4 section. The Session 5.2 prompt flagged a
  potential stop condition ("if the drafter judges a review
  gate is warranted, flag and wait"). Executor's judgment: the
  new branch is defensive and small (~7 short lines),
  structurally parallel to the existing prose, uses the same
  voice and discipline (no emoji, no introductions, explicit
  instruction to NOT emit the completion template_id). On
  balance, closer to "minor tightening of existing reviewed
  section" than "new authored content." No review gate
  invoked; flagging for founder awareness at session close.
  If the founder wants to tighten wording (e.g., soften the
  "blocked" phrasing, adjust the technical language), a small
  revision session applies.

  Mock-vs-Protocol Invariant Gap candidate — second datapoint:
  the PROFILE_NOT_FOUND surfacing was a production-invariant
  failure (the Phase 1.5B design contract "sign-in creates the
  row before updateProfile runs" is not enforced by any test;
  fixtures all seed the profile row explicitly). This adds a
  second instance to the candidate (Session 5.1 Bug 1 was the
  first — Anthropic protocol rule). The class: fixture tests
  exercise code paths assuming their preconditions are met;
  smoke tests catch precondition-violation paths that fixtures
  cannot model. Two datapoints; one more and it'll be at the
  codification bar.

  State-machine-under-constrained observation (narrow, no
  convention candidate yet): the advance rule in state.ts is
  correct (math is well-defined, worked examples in the sub-
  brief all evaluate correctly), but it doesn't enforce
  sequential step completion. current_step === 4 with
  completed_steps = [2, 3] is legal per the rule. The
  state-machine spec in master §11.5 doesn't require sequential
  completion either — completed_steps is the set of done steps,
  not a strictly-ordered sequence. Session 5.2's step-4 guard
  is the first place that enforces "step 1 must precede step 4
  completion" — the state machine itself remains permissive,
  which is appropriate because the step-advance rule needs to
  handle the atomic 2+3 advance cleanly. The guard at the
  completion-detection site is the right place for the
  ordering constraint. Future sessions adding new steps should
  similarly guard at completion rather than constraining the
  advance rule.

  Nine candidate-future-conventions staged (unchanged from
  Session 5.1 close; the Mock-vs-Protocol Invariant Gap grew
  to two datapoints but stays staged per batching discipline).
  None codified. Spec-to-Implementation Verification (three
  datapoints as of Session 5 close) remains convention-ready
  for Session 6 drafting codification.

  EC-20 closeout status: the combined findings journal entry
  for the full EC-20 smoke test still awaits founder's browser
  pass (scenarios 3, 4, 5). Autonomous portion is now
  validated post-Fix-1 and post-Fix-2; re-run after Session
  5.2 would show User B completing onboarding cleanly (previously
  stuck at PROFILE_NOT_FOUND).

  Approximate session time: ~35 minutes.
- 2026-04-19 NOTE   Phase 1.2 EC-20 smoke test — combined
  closeout (all three runs + browser scenarios). **Gate PASSED.**

  EC-20 is Phase 1.2's manual-gate exit criterion for the
  onboarding flow (master brief §20 row EC-20, amplified by
  Session 5 sub-brief §8 to cover fresh + invited flows plus
  three browser-interactive redirect scenarios). The test ran
  in three autonomous phases across Sessions 5 / 5.1 / 5.2 plus
  a single founder-driven browser pass. This entry consolidates
  the full story so Session 8's exit-criteria reconciliation can
  cite EC-20 as closed without reconstructing from scattered
  closeout entries and /tmp/smoketest-findings.md.

  The three autonomous runs progressed as follows. **Run 1**
  (original, HEAD 4487e19, 226/226 fixtures green) got User A
  through Turn 1 successfully but failed on Turn 2 with
  Anthropic API 400 "tool_use ids were found without tool_result
  blocks immediately after," surfacing what became Bug 1 below.
  In the same Turn 1 response, Claude emitted an invented
  template_id (`onboarding.profile.ask_display_name`) that
  didn't exist in any locale file — Bug 2. The test blocked;
  Session 5.1 was scheduled to fix both.

  **Run 2** (post-Session-5.1, HEAD 6a588f8, 233/233 fixtures)
  validated both Session 5.1 fixes end-to-end against real
  Claude. User A completed onboarding in 3 turns with
  `onboarding_complete: true`. Zero invalid template_ids across
  the run. But the run surfaced two new findings. User B's
  shortened flow got stuck at step 1 because
  `userProfileService.updateProfile` threw `PROFILE_NOT_FOUND`
  on every call — Phase 1.5B's design assumed the sign-in
  callback's `getOrCreateProfile` creates the row first, but
  the admin-created smoke user had no `user_profiles` row
  (Bug 3). And User A's final `state.onboarding.completed_steps`
  was `[2, 3]` — step 1 never completed because Turn 2's
  updateUserProfile hit the same PROFILE_NOT_FOUND and got
  absorbed into a tool_validation_failed template, yet the
  state-machine advance rule permitted current_step to jump
  from 1 to 4 via createOrganization's atomic 2+3 completion,
  and the step-4 completion detector didn't verify step 1 had
  actually completed (Bug 4). User A "finished" onboarding with
  `display_name` still null.

  **Run 3** (post-Session-5.2, HEAD 3f02b17, 238/238 fixtures)
  validated both Session 5.2 fixes. Fresh `pnpm db:reset:clean`
  plus new smoke-user creation (User A id
  `fa6ed596-98ce-44fd-83c1-fdd080e5c2c4`, User B id
  `bd2d7700-09a1-4f36-a260-ff86bfecbfc9`). User A completed in
  3 turns; User B completed in 2 turns. Final
  `state.onboarding` for both: `{ in_onboarding: false,
  current_step: 4, completed_steps: [1, 2, 3], invited_user:
  {false,true} }`. Both `user_profiles` rows materialized via
  Fix 1's upsert-insert branch (log lines "User profile
  upserted" with `auto_created: true`). Zero invalid
  template_ids across both users. Zero spurious step-4 guard
  firings — neither user's `onboarding_complete` flipped
  prematurely. Acme Smoke Inc org created for User A with CoA
  (16 accounts) + 12 fiscal periods.

  The four bugs, consolidated:

  | # | Bug | Surfaced | Fixed | Commit | Verified |
  |---|-----|----------|-------|--------|----------|
  | 1 | Multi-turn protocol violation (respondToUser tool_use persisted without matching tool_result) | Run 1 | Session 5.1 | 9b1af3d | Runs 2 + 3 |
  | 2 | Template_id invention (system prompt didn't enumerate valid keys) | Run 1 | Session 5.1 | 887d5ea | Runs 2 + 3 (0 invalid IDs across 5+ real turns) |
  | 3 | PROFILE_NOT_FOUND on bypass-sign-in paths (fixture tests all pre-seed profile rows) | Run 2 | Session 5.2 | e0a4435 | Run 3 (both users upserted cleanly) |
  | 4 | Step-4 completion without step 1 (state machine under-constrained; user could finish nameless) | Run 2 (semantic) | Session 5.2 | f69fe75 | Run 3 (`completed_steps: [1,2,3]` in both final states) |

  Bugs 1 and 2 would have shipped as hard failures (Bug 1
  breaks every multi-turn agent conversation; Bug 2 breaks UI
  render via next-intl). Bugs 3 and 4 would have been
  production-latent — the sign-in trigger path kept them
  invisible until any future flow bypassed sign-in. All four
  are now regression-guarded by fixture tests
  (`agentConversationProtocolInvariant`,
  `agentTemplateIdSetClosure`, the CA-15 upsert-branch it-block,
  `onboardingStep4GuardNoStep1`).

  The three browser scenarios ran against `pnpm dev` at HEAD
  3f02b17. **Scenario 3** signed the executive seed user in
  via `/en/sign-in`; `resolveSignInDestination` routed directly
  to `/en/11111111-1111-1111-1111-111111111111` (Bridge Holding
  Co DEV) without passing through `/welcome`. Chart of Accounts
  rendered. One redirect hop confirmed in devtools. PASS.
  **Scenario 4**: still signed in as executive, manually
  navigated to `/en/welcome`. The server-component
  defense-in-depth guard in
  `src/app/[locale]/welcome/page.tsx` (the
  "memberships + display_name present → redirect to first org"
  branch) fired, routing back to `/en/<org-id>/`. Welcome chat
  chrome never rendered. PASS. **Scenario 5**: opened an
  incognito window with no session cookies, navigated to
  `/en/welcome`. The same page's `if (!user)
  redirect('/sign-in')` guard fired. Sign-in form rendered at
  `/en/sign-in`. Welcome chrome never rendered. PASS.

  One production-readiness gap surfaced during the browser
  pass: the currently-shipped `SplitScreenLayout` top nav
  contains only the `OrgSwitcher` — there is no avatar
  dropdown, no sign-out affordance. A signed-in user has no
  in-app path to sign out. Scenario 5 required an incognito
  window to simulate the unauthenticated state. This is **not a
  Session 5 regression** — Session 5's scope was the welcome
  page and sign-in redirect, not post-sign-in shell chrome.
  It's within Session 7's already-declared scope ("avatar
  dropdown + Mainframe Activity icon" per the master §14.6
  roadmap). Captured here so Session 7's sub-brief picks it up
  as a concrete named requirement rather than a nice-to-have.

  Viewport check: split-screen layout rendered cleanly at a
  normal laptop viewport. Chart of Accounts table readable,
  agent stub panel narrow but functional, left rail icons
  visible. Agent empty state shows "Phase 1.1 — agent
  activates in Phase 1.2" subtitle — placeholder for Session
  7's AgentChatPanel rewrite. Per Session 5's "ugly is fine,
  broken is not" acceptance bar, passes. Session 7 polish
  observations: active-state indicator on the left rail is
  subtle, the `← → 1 / 1` pagination chrome above the Chart of
  Accounts card implies pagination behavior that doesn't exist
  yet, and the empty-state subtitle needs final copy.

  Cumulative Anthropic API cost across the three runs:
  approximately $0.35 (roughly $0.003 Run 1 — turn 2 aborted
  immediately, $0.15 Run 2, $0.10 Run 3). Pino doesn't capture
  `Anthropic.Messages.usage` from response objects, so figures
  are estimates based on prompt size and turn counts. Browser
  scenarios produced zero agent API traffic (auth-redirect
  flows only). Well within EC-20's implicit cost budget.

  Convention candidate update: **#9 Mock-vs-Protocol Invariant
  Gap is now at two datapoints.** Datapoint 1 (Bug 1): fixture
  `callClaude` doesn't enforce Anthropic's
  `tool_use` → `tool_result` protocol rule; real API does.
  Datapoint 2 (Bug 3): fixture tests all pre-seed
  user_profiles rows; real admin-created-user path has none.
  The class is the same — fixture tests validate happy paths
  given their preconditions but don't exercise paths where
  preconditions are absent. One more datapoint qualifies for
  codification. Watch for it through Session 6 execution and
  subsequent smoke runs.

  Session 5.1's incidental observation (Claude emits the
  reserved completion template_id before step 4 occasionally)
  surfaced again in Run 3. The orchestrator's two-condition
  guard correctly blocked. This is **not a convention candidate
  on its own** — layered defense between probabilistic prompt
  compliance and deterministic machine guards is generic
  engineering discipline, not a novel pattern. Fold the
  prompt-tightening work into Session 7 alongside the
  params-shape gap where rendered template output first becomes
  visible for manual UX evaluation.

  Smoke-test users (User A, User B) and the "Acme Smoke Inc"
  org remain in the dev DB from Run 3. `pnpm db:reset:clean`
  wipes them whenever desired. `/tmp/smoketest-findings.md`
  remains as a historical artifact. No code or test changes in
  this closeout — the EC-20 story is already captured in
  Sessions 5, 5.1, 5.2 commits; this entry is the single
  authoritative narrative for Session 8.

  **EC-20 gate: PASSED.** Eleven distinct improvements across
  Sessions 1–5 + 5.1 + 5.2 before code shipped or during
  execution. The drafting → pressure-test → execute → smoke
  cycle paid out fully: four bugs caught that all 238 fixture
  tests would have missed, two of them shipping-blockers.

  Approximate documentation time: ~25 minutes.
- 2026-04-19 NOTE   Phase 1.2 Session 6 sub-brief drafting
  session started. Starting SHA: 90e9dbb (EC-20 combined
  closeout). Starting model: Claude Opus 4.7. Scope: master
  §12 (five form-escape surfaces: user profile editor, org
  profile editor, org users list, invitation accept page,
  invite user flow) + master §15 (five canvas directive
  extensions: user_profile, org_profile, org_users,
  invite_user, welcome). EC-* gates to cover: EC-21, EC-23,
  EC-24, EC-25, EC-26. Master brief frozen at aae547a.
  Regression baseline 238/238.

  **First codification from the candidate-convention backlog.**
  Convention #8 "Spec-to-Implementation Verification" codified
  as the first commit of this drafting session (b24a8d6),
  BEFORE drafting pre-work starts. Positioned in
  docs/04_engineering/conventions.md under a new "Phase 1.2
  Conventions" block parallel to the existing Phase 1.5A
  block. Applies to this sub-brief's preparation: every
  numeric claim, literal value, list element, or structural
  reference citing master brief / Phase 1.5 / ADRs / migrations
  / locale files / prior sub-briefs MUST be grep-verified
  before freeze. Nine candidates remain staged; one codified.

  Session 6 drafting pre-work (per Convention #8) will run:
  (1) grep docs/ for stale /admin/orgs references; (2) verify
  canvas directive types against master §15 and existing
  src/shared/types/canvasDirective.ts declarations;
  (3) grep src/ for Phase 1.5B form-escape groundwork to
  identify build/stub/net-new surface; (4) OnboardingChat seam
  check (Session 7 consolidation target — don't touch);
  (5) EC-20 closeout commit presence check. Results feed the
  sub-brief structure and commit plan.
- 2026-04-19 NOTE   Phase 1.2 Session 6 sub-brief drafting
  session complete. Artifacts: (1) session-6-brief.md (701
  lines — within the 600–900 target, ~100 shorter than Session
  5's 799 reflecting Session 6's tighter scope since all
  backends are built); (2) CURRENT_STATE.md updated —
  Sessions 5, 5.1, 5.2 marked complete with commit hashes, EC-20
  closeout noted, Session 6 marked ready to execute; (3) this
  entry. Eight founder pre-decisions locked in sub-brief §4.

  Pre-work findings (per Convention #8 Spec-to-Implementation
  Verification applied to this sub-brief's drafting):

  (1) /admin/orgs grep surfaced 15 total hits across docs/.
  Classified: 6 archive (leave), 3 Phase 1.1 historical (leave
  — `/admin/orgs` was Phase 1.1's org-creation page), 1
  actively stale in active spec
  (`docs/03_architecture/ui_architecture.md:197` routing table
  — Session 6 §6.9 cleans it), 2 stale in the Session 5
  sub-brief itself (frozen at 9c22e07, flagged for Session 8
  reconciliation not Session 6 cleanup), 3 hits in the drafting
  grep's own journal entry context (self-referential, no
  action).

  (2) Canvas directive types grep against master §15:
  src/shared/types/canvasDirective.ts has Phase 1.1 built
  types + Phase 2+ stubs; none of the five new Session 6 types
  (user_profile, org_profile, org_users, invite_user, welcome)
  currently exist. All net-new additions. No overlaps.

  (3) Phase 1.5A/B groundwork grep: all five backend services
  exist (userProfileService with upsert, orgService,
  invitationService, membershipService), all five API routes
  exist (`/api/auth/me` PATCH, `/api/orgs/[orgId]/profile` PATCH,
  `/api/orgs/[orgId]/invitations` POST,
  `/api/orgs/[orgId]/users` GET, `/api/invitations/accept`
  POST). Session 6 writes zero service code. Pure UI + wiring.

  (4) OnboardingChat seam check: the mode-branch in
  AgentChatPanel.tsx (Session 5's `initialOnboardingState`
  prop triggers the OnboardingChat subcomponent) is Session 7
  consolidation target. Session 6 sub-brief §9 explicitly
  marks AgentChatPanel.tsx as NOT-modified. Skip-link lives in
  the welcome page layout (a sibling element to the chat
  panel), not inside the panel itself.

  (5) EC-20 closeout commit (90e9dbb) present and verified in
  friction journal line 2268. Gate PASSED prior to Session 6
  drafting.

  Three structural observations from drafting worth preserving:

  (a) Convention #8's first application: the grep verification
  took ~6 minutes across the five checks. Finding the actively
  stale `ui_architecture.md:197` reference BEFORE drafting let
  it become a scoped work item (§6.9) rather than surfacing
  mid-execution as a Session 8 cleanup pile. Pattern validated
  on its first deployment: five minutes of grep saves a
  Session 8 reconciliation entry.

  (b) The canvas-component vs route-page split (Pre-decision
  1): both consumers (agent directive + avatar dropdown) need
  the same editor. Session 6 builds components once; route
  pages are thin wrappers. Follows the existing Phase 1.1
  pattern (`JournalEntryForm` lives in `src/components/canvas/`
  and is reached via both route and canvas directive). No new
  pattern invented; consistent with the codebase.

  (c) Skip-link placement (Pre-decision 3): the Session 5
  onboardingSuffix acknowledged forms don't exist yet. Session
  6 wires them, and the skip link goes in the welcome page
  LAYOUT (not in the chat transcript) to avoid polluting the
  agent conversation with UI affordances. Only step 1 has a
  skip target (user profile); step 2/3/4 don't because the
  org-creation path has no form-escape in Session 6 and step 4
  isn't a skippable step. Clean separation: the welcome page
  is the UI shell, the chat is the conversation, and the
  onboardingSuffix prose describes behavior for the chat.

  Two review gates planned:
  - Commit 2: three new canvas components' UX (field ordering,
    labels, save confirmation prose, error surfaces, invite-
    form token display, role badges).
  - Commit 4: onboardingSuffix step-1 prose update
    acknowledging the skip link now exists.

  Nine candidate-future-conventions staged; one (Convention
  #8) codified today. Mock-vs-Protocol Invariant Gap still at
  2 datapoints, watching Session 6 execution for a possible
  third.

  Approximate drafting time: ~55 minutes (including 6 minutes
  of pre-work grep, the CURRENT_STATE surgery, and this
  entry).
- 2026-04-19 NOTE   Phase 1.2 Session 6 sub-brief pre-freeze
  revisions. Starting SHA: 0c36607. Six surgical revisions
  applied before execution begins:

  (1) `welcome` directive semantics honesty. Grepped master
  §15; master's text is terse ("`welcome` renders the
  onboarding layout (§11.2)") with no concrete user-facing
  use case. Pre-decision 7's prose updated to acknowledge the
  round-trip-for-existing-users reality openly rather than
  calling it "useful for 'take me back to onboarding.'"
  Session 6 wires the directive per master §15 inclusion but
  documents its only current semantic as "navigate to /welcome
  and let the server-component guards route appropriately."
  Real user-facing triggers await a future session.

  (2) `?forbidden=org-settings` promoted from "e.g.,"
  suggestion to named Session 6 ↔ Session 7 contract.
  Pre-decision 5 updated; CA-76 will assert the flag is
  emitted.

  (3) Commit 1 structure resolved to the stubs-then-components
  shape. The "OR bundled" hedge removed. Commit 1 ships the
  four component-backed directive types dispatching to
  ComingSoonPlaceholder; `welcome` lands fully (no component
  dependency). Commit 2 adds the components AND rewires the
  switch.

  (4) Invitation accept page state count reconciled against
  master §20 EC-26. Master explicitly enumerates 5 states
  (signed-out, email-match, email-mismatch, invalid, expired);
  §12.5's text collapses invalid+expired into one user-facing
  message but EC-26 counts them as distinct states. Sub-brief
  was 5-state in §6.5 and CA-79 already; Pre-decision 4 had
  internal drift (omitted signed-out, added "already
  accepted"). Pre-decision 4 rewritten to list the master-
  EC-26 5 states exactly. "Already accepted" handled via the
  existing invitationService idempotency, not as a sixth
  state.

  (5) Pre-decision 3 gains a permanence note: the step-2
  onboardingSuffix phrasing "isn't wired in for you right now"
  is a permanent architectural choice per master §12, NOT a
  Session-7 deferral. No org-creation form-escape surface
  exists or is planned. Future sessions should not treat the
  phrasing as a TODO.

  (6) OrgProfileEditor field list diff-verified against master
  §12.2 per Convention #8. Result: the sub-brief's 12 fields
  match master §12.2's 12 fields with naming-shorthand
  differences only (master uses prose shortcuts like
  "industry" / "timezone" / "locale" / "reportBasis"; sub-brief
  uses the actual camelCase schema names `industryId` /
  `timeZone` / `defaultLocale` / `defaultReportBasis` per
  Phase 1.5A convention). No fields missing, no fields added.
  §6.3 gained a small diff-verification note recording this.

  Sub-brief grew 701 → 758 lines (+57 lines, all clarifying
  prose — no new scope, no new work items, no new tests, no
  new pre-decisions). Still within the 600–900 target.

  Convention #8 applied a second time (first application was
  during the Session 6 drafting session itself; this is the
  second pass). The §12.2 field-list grep-diff closed in
  ~90 seconds and surfaced zero substantive gaps — exactly
  what the convention is designed to confirm.

  Nine candidate-future-conventions staged; one codified
  (Convention #8, two applications now on record). Session 6
  readiness anchor moves to the next commit. Execution can
  begin.

  Approximate revision time: ~20 minutes.
- 2026-04-19 NOTE   Phase 1.2 Session 6 execution session
  started. Starting SHA: 14b948b (sub-brief pre-freeze
  revisions). Starting model: Claude Opus 4.7. Scope: master
  §12's five form-escape surfaces + master §15's five canvas
  directive extensions + ContextualCanvas dispatch + onboarding
  skip-link + stale /admin/orgs doc cleanup at
  ui_architecture.md:197. EC-* gates to cover: EC-21, EC-23,
  EC-24, EC-25, EC-26. Regression baseline 238/238 green at
  session start.

  Planned commit cadence: 5 commits on top of 14b948b.
  (1) canvas directive types + schema + dispatch stubs;
  (2) canvas components [founder review gate]; (3) route
  pages + invitation accept page (see Option A below);
  (4) onboarding skip-link + suffix prose [founder review
  gate]; (5) CA-74 through CA-81 + CA-82 + doc cleanup +
  closeout. Convention #8 applied on third pass (pre-
  execution code-grep, narrower than drafting-time passes).

  **Convention #8 catch at pre-execution verification.** The
  pre-code grep surfaced a sub-brief claim that did not match
  shipped reality: sub-brief §6.5 and Pre-decision 4 both
  referenced `invitationService.getByToken` as existing.
  Grep returned zero matches — no `getByToken`, no
  `previewInvitation`, no read-by-token preview method
  anywhere in src/services/. The only read-by-token logic is
  inside `acceptInvitation` (mutating, merges four failure
  modes into a single `INVITATION_INVALID_OR_EXPIRED` code),
  which cannot drive 5-state distinguishable branching on the
  accept page.

  Underlying constraints that blocked a no-new-code path:
  (1) org_invitations RLS is `user_is_controller(org_id)` for
  SELECT (migration 20240114) — invitees cannot read their
  own invitation via a Next.js server-component
  `createServerClient` call; (2) the existing acceptInvitation
  collapses malformed-token / not-found / wrong-hash / expired
  / email-mismatch all into one error code, ruling out
  speculative-POST-and-interpret-error as a workaround;
  (3) master §20 EC-26 requires five distinguishable states.

  Four options were presented to founder: (A) add a read-only
  previewInvitationByToken method on invitationService;
  (B) ship 3-state accept page in Session 6 + sub-brief
  amendment + defer to Session 7; (C) defer accept page
  entirely to Session 7; (D) direct adminClient() use in
  page.tsx (violates Law 1). Founder selected Option A:
  Session 6 adds one new service method (~30 LOC, pure read
  logic, no audit, no new ServiceError codes, no new
  migrations). The sub-brief's "no new service functions"
  claim was interpreted as a scope-signal ("don't do Phase
  1.5A work"), not an absolute rule. A read-only preview
  supporting Session 6's own UI surface is scope-consistent.

  Service method signature: `previewInvitationByToken(token)`
  returns `{ state: 'pending' | 'invalid' | 'expired' |
  'already_accepted', invitedEmail?, orgId? }`. The
  email_mismatch state is NOT produced by the service — it's
  derived by the page.tsx caller by comparing
  `state === 'pending' && invitedEmail !== caller.email`.
  Cleaner separation: service returns invitation facts; page
  handles auth-identity comparison. Test delta: CA-82 added
  above the 8-test floor as a dedicated preview-method unit
  test (7 it-blocks). Test count floor for Session 6 becomes
  9, target ~247 green.

  **Convention #8 refinement surfaced by this catch.** The
  codified convention lists four verification categories
  (numeric claims, literal values, list elements, structural
  references) but does not explicitly name *identity
  assertions* — claims that a named method / route / schema
  field / constant exists in shipped code. The sub-brief
  drafting passes ran category-faithful grep-diffs against
  master §12.2 and master §15 (list elements + literal
  values) but did NOT grep-verify the single identity claim
  "invitationService.getByToken (existing)" in §6.5. Proposed
  fifth category: "Identity assertions — grep the named
  symbol at the cited location before claiming it exists."
  Captured here for a single-commit convention-content
  refinement at the start of Session 7 drafting, out of band
  from Session 6 execution (amending a convention mid-session
  creates its own drift). Two applications of Convention #8
  are already on record; the catch here is a third
  application that produced the refinement signal.

  **Uncommitted-at-start files flagged.** `git status --short`
  surfaced two uncommitted items unrelated to Session 6
  scope: (i) `docs/02_specs/open_questions.md` modified with
  Q27-Q31 (Phase 2 layered-tiers agent architecture open
  questions — ADR-0008 blockers); (ii) `docs/09_briefs/
  phase-2/agent_architecture_proposal.md` (new, CTO-reviewed
  Phase 2 layered-tiers proposal). Both are Phase 2 planning
  artifacts that will be addressed separately by founder.
  Session 6 commits use explicit `git add <path>` to avoid
  sweeping these in; they will be called out again in the
  Session 6 closeout entry so the founder's Phase 2 triage
  doesn't lose them.

- 2026-04-19 NOTE   Skills migration session. Token overhead in
  the always-loaded `CLAUDE.md` was growing with the rulebook;
  rules that only apply to specific code areas are now
  on-demand under `.claude/skills/`. Five skills landed —
  `journal-entry-rules/`, `service-architecture/`,
  `agent-tool-authoring/`, `integration-test-rules/`,
  `audit-scans/` — each opening with a pointer to its
  canonical source in `docs/` and summarizing rather than
  duplicating. `docs/INDEX.md` added as the one-line-per-file
  map; tier-1 navigation in `CLAUDE.md` now lists only
  `ledger_truth_model.md`, `agent_autonomy_model.md`,
  `CURRENT_STATE.md`, and `friction-journal.md` with
  everything else deferred to `INDEX.md`. Two pnpm scripts
  added for the repeat workflow — `pnpm agent:floor` (runs
  the five Category A integration tests) and
  `pnpm agent:validate` (typecheck + no-hardcoded-URLs +
  floor); both added to `.claude/settings.local.json` allow
  list. `CLAUDE.md` trimmed from 250 to 78 lines (~69%
  reduction), with sections §1–§8 relocated to the skills
  and §9 folded into the trimmed §10 (the reserved-seat
  events table is named in the simplification list and
  enforcement is already at Layer 1 via the append-only
  triggers + INV-LEDGER-003).

  Two corrections landed as by-products of the trim.
  **A1 (Two Laws citation).** Original `CLAUDE.md` §1 cited
  INV-SERVICE-001/-002 as the source of the Two Laws; the
  leaves actually enforce `withInvariants` wrapping and
  `adminClient` discipline, not the Laws themselves. The Two
  Laws are glossary-backed framing (`docs/02_specs/
  glossary.md`). The `service-architecture/` skill sources
  the Laws to the glossary and cites INV-SERVICE-001 /
  INV-SERVICE-002 / INV-AUTH-001 only for their real content.
  The root `CLAUDE.md` no longer makes any Two-Laws claim
  directly. **B1 (phantom lint rule).** Original §2 claimed
  a `no-unwrapped-service-mutation` build-time lint exists;
  it does not. The leaf explicitly says "no lint rule today;
  Phase 1.2 candidate" and the first Phase 1.1 audit already
  flagged this as UF-002. The `service-architecture/` skill
  states the current reality (code review enforces; lint is
  a Phase 1.2 candidate, see UF-002) and the trimmed
  `CLAUDE.md` drops the claim entirely.

  Q32 logged as a side-effect. Checking the reversal-mirror
  step order while drafting the `journal-entry-rules/` skill
  surfaced a three-way disagreement between ADR-0001 (reason
  last), `INV-REVERSAL-001` leaf + code execution +
  `validateReversalMirror()` header comment (reason first),
  and the function's inline step labels (reason numbered as
  Step 5 but executed first). The code is self-consistent in
  execution; the ADR and inline labels lag. Reported to the
  founder per guardrail #7 and resolved as Q32 in
  `docs/02_specs/open_questions.md` (Section 3), with the
  recommended fix being an ADR-0001 post-implementation note
  and a five-comment renumber in `journalEntryService.ts` —
  both out of scope for this session and staged for separate
  review.

  Pattern note worth preserving for future skill migrations:
  **skills point, they do not duplicate.** The Q32 drift was
  invisible to the skill because the skill pointed to the
  leaf rather than restating the step numbering. Had the
  skill duplicated ADR-0001's numbering, the Q32 discrepancy
  would have been inherited into the skill and the trim
  would have propagated it. The "summarize and point"
  discipline paid its first dividend during the work that
  established it.
- 2026-04-19 NOTE   Session 6 browser-verification deferral.
  The Playwright plugin was installed mid-session
  (`~/.claude/plugins/installed_plugins.json` shows
  `playwright@claude-plugins-official` registered at
  2026-04-19T18:38:35) but its MCP tools did not hot-load
  into the running Claude Code session — MCP plugins
  register at session start. WSL Claude could not drive a
  browser; founder's environment also lacked browser tooling.
  Option B chosen: close Commit 2+3 on backend verification
  (supabase-js-authenticated preview-method state branching,
  pre-fill data reads, authz checks) + structural code
  review; defer visual/interactive UX verification to
  Commit 4's skip-link flow. After Commit 4's prose edit
  lands and `pnpm typecheck && pnpm test` is green, **the
  next session should** (1) restart Claude Code so Playwright
  tools register, (2) verify the tool prefix appears in the
  deferred-tool list, (3) run the combined retroactive
  browser pass covering Commit 2+3's visual checks
  (UserProfileEditor pre-fill + save-button cycling,
  OrgProfileEditor controller render + immutable-fields
  card, OrgUsersView table + invite-form token display,
  EmailMismatchView copy, AcceptCTA POST) plus Commit 4's
  skip-link visibility + click-navigation, (4) generate a
  fresh invitation token (the one from this session was
  consumed by the verification script), (5) treat any
  surfaced issue as a Session 6 amendment commit — small
  scope, no sub-brief amendment unless structural. **If the
  plugin still fails to load after restart:** debug it
  separately; do NOT block Commit 5 on it. Backend +
  structural review already cleared the commit gates. A
  one-line "Playwright-verified post-hoc" note lands in the
  next journal entry when verification completes.
- 2026-04-19 NOTE   Phase 1.2 Session 6 execution complete.
  All 12 S6 exit criteria pass. 288/288 tests green (238
  baseline + 50 new across 9 new test files — CA-74 through
  CA-82; CA-82 added above the 8-test floor per Option A
  scope delta). Five feature commits landed on top of
  14b948b: 2d4c0b8 (canvas directive types + schema +
  dispatch stubs), c34b9f3 (canvas components), 6aef5c8
  (route pages + invitation accept + preview service),
  e9ffa9e (skip-link + prose update), plus this Commit 5
  (tests + doc cleanup + closeout). No migrations, no new
  ActionNames, no new ServiceError codes, no new deps, no
  orchestrator changes. Covers EC-21, EC-23, EC-24, EC-25,
  EC-26.

  **Convention #8 third application and refinement.** Two
  drafting-time applications (numeric claims + master §12.2
  field-list diff) already on record at session start; the
  pre-execution code-grep was application #3 and produced
  the only catch of the session — sub-brief §6.5 and
  Pre-decision 4 referenced a `invitationService.getByToken`
  method that did not exist in shipped code. Convention #8
  as codified lists four verification categories (numeric
  claims, literal values, list elements, structural
  references) but does not name "identity assertions"
  — claims that a named method / route / schema field /
  constant exists. The drafting passes ran category-faithful
  greps and missed the identity claim. **Refinement captured
  for single-commit codification at Session 7 drafting
  start:** add "Identity assertions — grep the named symbol
  at the cited location before claiming it exists" as the
  fifth verification category. Out of band from Session 6
  execution to avoid amending a convention mid-session.

  **Option A scope delta.** One new read-only service method
  (`previewInvitationByToken`, ~40 LOC) landed as a
  scope-consistent exception to the sub-brief's "no new
  service functions" claim. The method is pure read logic,
  no audit row, no mutation; admin client justified by the
  token-bearer auth pattern already used by acceptInvitation.
  Master §20 EC-26 requires 5 distinguishable states on the
  accept page; the existing acceptInvitation merges four
  failure cases into a single INVITATION_INVALID_OR_EXPIRED
  code, and org_invitations RLS is controller-only for
  SELECT — so the state branching could not be driven
  without a new read primitive. The "no new service
  functions" claim was interpreted as a scope-signal ("don't
  do Phase 1.5A work"), not an absolute rule. A read-only
  preview supporting Session 6's own UI surface is
  scope-consistent. CA-82 (7 it-blocks) pins the method's
  state-determination behavior.

  **Commit 2+3 founder review gate — outcome.** Commit 2
  (canvas components) accepted structurally without
  revision. Hands-on UX review folded into Commit 3's
  review gate since Commit 3's route pages make each
  component reachable by clean URL. Mid-session the
  Playwright plugin was installed but its MCP tools did
  not hot-load into the running Claude Code session. WSL
  Claude had Bash / Read / Write / Edit only — no browser
  automation. Option B chosen: close the combined gate on
  backend verification (supabase-js-authenticated preview-
  method state branching, pre-fill data reads, authz
  checks via getMembership + orgService) + structural code
  review. Visual/interactive UX verification deferred to a
  post-restart Playwright pass (captured separately in
  the 2026-04-19 "Session 6 browser-verification
  deferral" entry earlier in this journal).

  One observation captured for Session 7 polish backlog:
  no UI for invitation resend when the user misses the
  one-time token display window. invitationService.
  resendInvitation exists but has no UI. Naturally paired
  with master §22's deferred "Pending invitations list"
  (Phase 2 scope).

  **Commit 4 founder review gate — outcome.** Step-1
  onboardingSuffix prose change approved without tweaks.
  Design choices landed as proposed: "Skip to form" link
  named in the prose, "/settings/profile" destination path
  named literally, explicit neutrality guidance ("Either
  path advances the state machine — don't push them toward
  one or the other") prevents Claude from evangelizing
  either path. Step 2/3/4 prose unchanged; step 2's "isn't
  wired in for you right now" phrasing stays per
  Pre-decision 3's permanence note.

  **Split-file commit hygiene.** Throughout execution,
  four-then-six uncommitted files from two parallel work
  streams sat in the working tree: (i) session-start Phase
  2 planning artifacts (docs/02_specs/open_questions.md
  Q27-Q31 additions + docs/09_briefs/phase-2/
  agent_architecture_proposal.md); (ii) mid-session skills
  migration (CLAUDE.md rewrite 250→78 lines + docs/INDEX.md
  new + package.json agent:floor / agent:validate scripts +
  a friction-journal entry). All six remain uncommitted at
  Session 6 close. My commits used explicit `git add <path>`
  per file throughout; the friction-journal specifically
  needed a temporary-revert-and-restore pattern (save
  working state to /tmp, git checkout HEAD, append only my
  new entry, commit, restore working state from /tmp) twice
  during this session so the skills-migration entry stayed
  out of my Commit 4 and Commit 5. Flagging here for the
  founder's separate triage — these six items should commit
  together as a "Phase 2 planning + skills migration
  pre-Session-7" chore.

  **Mock-vs-Protocol Invariant Gap convention candidate —
  no new datapoint.** Session 6 added no orchestrator tests
  and produced no mock-vs-protocol divergence. Still at 2
  datapoints as of the EC-20 closeout. Watching.

  **Phase 1.2 progress.** Sessions 1 / 2 / 3 / 4 / 4.5 /
  5 / 5.1 / 5.2 / 6 complete; EC-20 closeout passed. Seven
  of ~eight Phase 1.2 sessions shipped. Session 7 is the
  UI-integration session (AgentChatPanel rewrite,
  ProposedEntryCard migration to ADR-0002, ContextualCanvas
  click handlers, SplitScreenLayout onboarding mode, avatar
  dropdown + sign-out affordance from EC-20 closeout's
  production-readiness gap, params-shape gap, canvas
  schema tightening). Session 8 is verification + Phase
  1.2 closeout (27 exit criteria matrix, master §21 CA-*
  reconciliation, 20-real-entries gate, adversarial test).

- 2026-04-19 NOTE   Session 6 Playwright retroactive pass —
  deferred again. MCP tools loaded after Claude Code restart
  (tool_search returns playwright:* prefix), but the MCP server
  defaults to `--browser chrome` and looks for
  `/opt/google/chrome/chrome`, which is not installed in the
  WSL environment. `npx playwright install chrome` requires
  sudo and failed; `npx playwright install chromium` succeeded
  but the MCP server is not configured to use it — switching
  would require editing
  `~/.claude/plugins/cache/claude-plugins-official/playwright/
  unknown/.mcp.json` to pass `--browser chromium` and
  restarting Claude Code again. Out of scope for a git-hygiene
  session. Handoff: next attempt either installs real Chrome
  via sudo, reconfigures the MCP to chromium + restarts, or
  runs the six checks manually. Backend + structural review
  gates already closed Commits 2-4; visual/interactive
  verification remains outstanding.

- 2026-04-19 NOTE   Triage-session staging observation. When
  parallel worktree edits land against a stale HEAD — working
  tree is an older snapshot than the committed tip — a straight
  `git add` of the split-file-commit pattern silently reverts
  committed tip content. The pre-Session-7 triage hit exactly
  this: the working tree's friction-journal was a pre-Session-6-
  closeout snapshot (2828 lines) with the mid-session skills-
  migration entry inserted, while HEAD was the post-Session-6-
  closeout tip (2882 lines). Diff stat showed 68 insertions plus
  122 deletions when the plan expected insertions-only; the
  ratio check caught it. Recovery pattern: copy working tree to
  /tmp, `git checkout HEAD -- <file>`, splice the new content
  against HEAD's version (anchor by preceding line + blank
  separator), verify the diff stat is additions-only, stage.
  Guard for the future: `git stash` before pulling / rebasing /
  switching when parallel work is expected, then apply edits on
  top of current HEAD, then `git stash pop`. One datapoint, not
  yet a convention candidate — the codification threshold is
  two.

## Phase 1.2 Session 7 (execution)

- 2026-04-19 NOTE   Session 7 execution kickoff. Anchor SHA
  af8b636 (docs(phase-1.2): CURRENT_STATE Session 7 kickoff
  ready). Working tree clean. Baseline: 288/288 tests green,
  `pnpm agent:validate` expected to pass. Sub-brief at
  `docs/09_briefs/phase-1.2/session-7-brief.md` (frozen at
  ba9599a), DRAFT v4 with grep-pass verification + founder
  surgical corrections applied. Six commits planned: (1)
  params-shape enumeration + locale keys + orchestrator-
  boundary validation; (2) ProposedEntryCard real render +
  schema tightening + reject endpoint + migration 120; (3)
  AgentChatPanel production rewrite + conversation resumption
  + error UI; (4) shell polish (avatar dropdown + Activity
  icon + placeholder review queue page); (5) canvas context
  click handlers + EC-19 tests; (6) docs closeout + Session 8
  handoff. Pre-declared split-point at end of Commit 3 if
  wall-clock past day 2. Each commit gates on a founder review
  per the Session 6 pattern — diff review, test-pass
  verification, Convention #8 identity-assertion spot-check.
  Starting Commit 1.

- 2026-04-19 NOTE   Commit 1 landed at 6904a2f. Params-shape
  enumeration — `VALID_RESPONSE_TEMPLATE_IDS` (flat array)
  became `TEMPLATE_ID_PARAMS` (object mapping each template_id
  to a `.strict()` Zod schema). Helper
  `validateParamsAgainstTemplate(template_id, params)` returns a
  discriminated result; orchestrator boundary calls it on
  respondToUser input, exhausted budget emits
  `agent.error.tool_validation_failed` as a normal turn. 21 new
  locale entries (2 response templates × 3 locales + 7 UI-only
  suggestion keys × 3 locales). New agentTemplateParamsClosure
  test (15 it-blocks) enforces bidirectional parity between
  schema `.shape` keys and `en.json` `{placeholder}` tokens.
  303/303 green.

- 2026-04-19 NOTE   Commit 2 landed at 3abbc7a. Five design
  questions surfaced in the design pass (confirm-endpoint
  asymmetry, CardResolution shape, reject endpoint 5-branch
  machine, migration 120 scope, two small schema choices);
  founder approved all five with three refinements (Branch 2
  SELECT failure fallback, strict-idempotent reason-insensitive
  replay, 409 body includes currentStatus). Implementation
  delivered: ProposedEntryCardSchema (.strict() on card/line/
  policy_outcome, z.literal('approve') on required_action,
  loose reason_params with orchestrator doing strict per-
  template validation). Migration 120 additive (ADD VALUE
  'edited' + RENAME rejection_reason → resolution_reason;
  blast radius 1 code file, 3 type references, all resolved).
  New /api/agent/reject endpoint — 5 branches mirroring confirm
  (not found → 404; status matches outcome → 200 idempotent,
  first reason wins; terminal-but-different → 409 CONFLICT
  with currentStatus body; pending → 200 write; stale → 422).
  Confirm Branch 2 extended with secondary SELECT on
  `journal_entries.entry_number`, fallback degradation on error
  preserves the success signal. ProposedEntryCard real render
  with Four Questions layout, two-step inline reject textarea,
  Approve/Reject/Edit per-card isSubmitting state, safeTranslate
  fallback on reason_template_id miss. 331/331 green (+28:
  12 schema acceptance + 12 reject endpoint + 4 extended
  CA-74).

- 2026-04-19 NOTE   Commit 3 landed at 9be396c. Largest commit
  of Session 7; main payload was conversation-resume
  infrastructure. Design pass surfaced a material gap in
  Pre-decision 8's premise — the persisted conversation shape
  is Anthropic-format messages that the Session 5.1 terminating-
  text rewrite strips of everything except template_id baked
  into an unstructured string. Derivation recorded separately
  as Pre-decision 14 (below). Delivered: migration 121
  (agent_sessions.turns JSONB additive, pure column add); new
  src/shared/types/chatTurn.ts (ChatTurn + CardResolution +
  PersistedTurn subsets); new /api/agent/conversation GET
  endpoint (three-branch: hydrate-from-turns, reconstruct-from-
  Anthropic-messages-on-empty-turns fallback with logged
  warning, empty-session); orchestrator extends with userTurn
  captured at entry + dual-write at all three persistSession
  call sites; AgentChatPanel rewrite with ProductionChat
  subcomponent (mount-time fetch, three error UI treatments,
  empty-state SuggestedPrompts wired to send, per-turn
  ProposedEntryCard with onCardResolved optimistic ack synth
  + CardResolvedBadge); Pre-decision 11b patch at
  onboardingComplete branch (first-active-membership lookup +
  agent_sessions.org_id update). 2 new test files (9
  conversationLoadEndpoint + 4 suggestedPromptsOneClickFire).
  344/344 green (+13). Option B fallback verified firing and
  logging `conversation-load: pre-migration-121 session,
  falling back to reconstruction` in the reconstruction test
  output.

### Pre-decision 14 derivation — conversation-resume shape

Material gap surfaced at the Commit 3 design pass.
Pre-decision 8 ("Conversation resumes on AgentChatPanel
mount") assumed the persisted conversation carried enough
structured data to reconstruct the client-facing ChatTurn array
— template_id, params, card, canvas_directive. Direct read of
`src/agent/orchestrator/index.ts:544-550` showed otherwise: the
Session 5.1 terminating-text rewrite persists only
``[responded with template_id=${template_id}]`` as an
unstructured text block, dropping params + canvas_directive +
card. Without a persistence refactor, refresh renders on a
production-chat session would lose params ("Entry #
has been posted to the ledger") and lose cards entirely.

Options evaluated (executor surfaced the gap, founder and
executor converged on the decision):

- **Option A full** — new migration + new `turns` JSONB column
  on `agent_sessions`. Clean separation of concerns. Costs one
  migration.
- **Option A narrowed** (founder's initial lean) — reshape the
  existing `conversation` JSONB to `{messages, turns}`. Avoids
  a new migration; costs reader-pollution at three callsites
  that currently read `conversation` as an array.
- **Option B only** — reconstruct from Anthropic messages +
  ai_actions join on load. Degraded render for historical turns
  (empty params, no cards). Scope shortcut.
- **Option C** — drop Pre-decision 8 entirely. AgentChatPanel
  always mounts empty. Negative scope; rolls back a founder-
  approved design decision by implementation shortcut.

Decision: **Option A+** (new migration, new column). Executor's
reasoning: the reader-pollution cost of in-place reshape was
underweighted in the initial lean — three existing readers of
`agent_sessions.conversation` would need `Array.isArray`
shape-detection forever, small pollution that accumulates.
Migration 121 as a scoped exception is identically justified to
Pre-decision 3's exception for migration 120 (Agent-Ladder
correctness) — correctness-driven, one ALTER, additive, grep-
verified zero breaking consumers. The "no migrations" Session 7
discipline is about avoiding speculative schema work, not
forbidding necessary schema work. Founder accepted the
push-back and ratified Option A+. Option B became the
backward-compat fallback for pre-migration-121 rows (Phase 1.2
rows are test data; real onboarding transcripts post-migration
get the proper shape).

Execution: migration 121 shipped one ALTER ADD COLUMN turns
jsonb NOT NULL DEFAULT '[]'::jsonb inside a BEGIN/COMMIT
wrapper, matching migration 118's convention. Orchestrator's
three persistSession callers compute `[...existingTurns,
userTurn, assistantTurn]` and pass it as the new `newTurns`
parameter. The conversation-load endpoint's three-branch logic
(hydrate when `turns.length > 0`, reconstruct-with-warning
when `conversation.length > 0 && turns.length === 0`,
empty-session otherwise) was covered by 9 new tests including
an explicit pre-migration-121 fallback case verifying the
warning log fires.

Sub-brief at ba9599a stays frozen — Pre-decision 14 lives
here in the friction journal rather than as a sub-brief
amendment. Session 8 handoff references it for retrospective
codification.

### Session 7 retrospective

Four patterns worth naming explicitly.

**1. Day-clock compression — calibration question, not win.**

Sub-brief estimated 3 days across Commits 1-5; actual execution
landed Commits 1-3 (the full chat+card+prompt trinity plus
conversation-resume infrastructure) on day 1 — 2026-04-19. The
earlier Commit 3 review gate report framed this as "Session 7
is wrapping up in one calendar day," which reads as celebration.
It shouldn't. The compression deserves a calibration question.

Founder-proposed hypothesis (to test against future sessions):
**Commits 1-3 had design complexity matching the estimate, but
execution complexity substantially less than estimated, because
the sub-brief's design work pre-resolved most of the open
questions before execution started.** Specifically:

- The Phase 2 Q&A brainstorm (2026-04-19, pre-execution design
  sprint) produced Pre-decisions 1-13 covering card rendering
  (inline), error UI shape (three treatments),
  card-resolution-as-server-derived-read-only, onboarding
  session org_id update (11b), welcome page compatibility (12),
  etc. When execution started, most design decisions were
  already locked.
- The design-pass-at-commit-kickoff pattern (Commit 2's five-
  nuance discussion + Commit 3's Pre-decision 14 discovery)
  caught remaining gaps early, preventing mid-implementation
  re-architecture.
- Founder review gates at commit boundaries surfaced
  refinements at punctuation points rather than in-flight, so
  no commit required re-work.

If this hypothesis holds, execution-time estimates should read
as "1 day execution + X days equivalent of sub-brief drafting
upfront." Phase 1.3+ might want to measure sub-brief drafting
time separately as a calibration input. Otherwise the
split-point discipline (Pre-decision 2's "past day 2"
threshold) becomes a never-fires constraint — a constraint
that never binds isn't doing any work.

Separately for the record: the pre-declared split-point was
correct regardless of actual timing. The declaration assumed
linear time ("Commit 3 budget rose to ~1.5 day, pushing end
of Commit 3 past day 2"); when time compressed, the split
stayed baked in. The value of pre-declaration isn't
proven-by-firing — it's proven by simplification. Commit 6
focused cleanly on closeout rather than "should we squeeze
one more commit" judgment calls. That's the real benefit.

Single datapoint from Session 7; codification needs two more.
Sessions 7.1 and 8 are the next calibration checks.

**2. Pre-decision discovery at layer-transition boundaries —
convention candidate.**

Session 7 produced two pre-decisions discovered after sub-brief
freeze:

- **Pre-decision 11b** (sub-brief drafting, grep-pass
  verification): orchestrator's onboarding-complete branch
  doesn't have the target org_id in scope; it must be queried
  from memberships. Gap between "onboarding complete" (state-
  machine layer) and "agent_sessions.org_id keyed on (user,
  org)" (schema layer).
- **Pre-decision 14** (Commit 3 design pass): persisted
  conversation shape is Anthropic-format messages; client-
  facing ChatTurn shape needs structured params + card +
  canvas_directive. Gap between "conversation resume" (UX
  layer) and "Session 5.1 terminating-text persistence"
  (orchestrator layer).

Both gaps surface at **layer-transition boundaries**. When a
decision upstream (onboarding-complete UX, conversation-resume
UX) meets a layer downstream (session persistence, orchestrator
state), assumptions from the upper layer often don't match
reality at the lower layer. The layer-transition is where the
drift lives.

Proposed discipline for future sub-briefs + design passes: when
a pre-decision commits to behavior that traverses two or more
layers of the stack, explicitly verify the downstream layer
holds the state the upper-layer behavior requires. Grep for the
specific fields or columns before declaring the pre-decision
done.

Two datapoints; codification threshold is two. Candidate for
Convention #9, to be ratified at Session 8 retrospective (name
to be finalized then).

**3. Mutual hallucination-flag discipline held.**

The two-way anti-hallucination protocol established earlier in
the Phase-1.2 execution (Session 5.1 / EC-20 closeout era) held
across all three Commit design passes + review gates. No false
inferences fired. Two specific instances where the discipline
paid out in-session:

- Commit 2 design pass: executor surfaced five design nuances
  (the asymmetry plus four others). Founder verified all five
  by direct code read + grep before approving, producing three
  surgical refinements. The extra nuances got disciplined
  approvals rather than getting waved through.
- Commit 3 review gate: founder flagged
  `memberships.status` as possibly non-existent; verified
  via migration 113 read; founder explicitly retracted the
  flag ("I called this a 'blocking issue' before verifying.
  Spot-checks should verify before raising flags, not after")
  and named the verify-before-flag discipline as the correct
  sequence. The retraction itself demonstrates the discipline
  working.

No codification needed — the pattern is working organically.
Worth preserving the examples for future session recalibration.

**4. Schema-as-tightening as bonus discipline.**

`ProposedEntryCardSchema.lines.min(2)` tightened an implicit
invariant (double-entry requires at least 2 lines) from
"enforced by manual care at the TS-type layer" to "enforced at
the Zod boundary." The TS type at `proposedEntryCard.ts:24`
declared `lines: ProposedEntryLine[]` without a minimum; the
Zod mirror made the minimum explicit at validation time.

Similar small tightenings live alongside in Commit 2 schemas:

- `z.literal('approve')` on `policy_outcome.required_action`
  (TS type is the single-value union `'approve'`; Zod mirror
  makes drift-on-enum-add loud).
- `z.string().min(1).optional()` on the reject-endpoint
  `reason` (empty-string is a client-contract violation; Zod
  rejects at 400 rather than silently accepting).

Discipline to preserve: **when writing a Zod schema mirror of
a TS type, ask which implicit invariants in the code's usage
can be made explicit in the schema.** The Zod boundary is the
cheapest place to turn "this shouldn't happen" into "this
cannot parse."

Not yet a convention — pattern is uncontroversial and likely
already de-facto standard. Worth naming so future schema work
runs the check explicitly.

### Session 7.1 handoff

Status: sub-brief needed, ready to draft.

Anchor SHA: Commit 6 SHA (recorded at draft time).

Scope — Commits 4+5 from Session 7's original sub-brief at
ba9599a, carried forward via Pre-decision 2's split-point
pre-declaration:

- **Commit 4 (original)** — shell polish: avatar dropdown with
  Profile / Org settings (controller-only) / Team / Sign out
  items; Mainframe rail Activity icon navigating to
  `/<locale>/<orgId>/agent/actions`; ~15 LOC placeholder
  `page.tsx` at that route so the icon doesn't 404.
  `avatarDropdownMenuBehavior.test.ts` (controller sees 4
  items, non-controller 3, sign-out fires Supabase + router
  push). Estimate ~0.5 day.
- **Commit 5 (original)** — canvas context click handlers:
  `JournalEntryListView` row click sets `selectedEntity`;
  `ChartOfAccountsView` row click adds selection-only onClick;
  pure `reduceSelection` reducer honoring Pre-decision 10's
  type-compatibility rule; `SplitScreenLayout` state lift for
  `selectedEntity` + `setSelectedEntity`; `AgentChatPanel`
  `send()` builds `canvas_context` from props and includes
  in request body. Two new test files:
  `canvasContextReducer.test.ts` (~6 it-blocks) +
  `apiAgentMessageCanvasContextPassthrough.test.ts`. Plus
  three EC-19 manual scenarios (under-anchored / over-
  anchored / clarification). Estimate ~0.5 day.

Total estimate ~1 day.

Three carryovers from Commit 3's non-blocking observations that
Session 7.1 should close:

- **currentUserRole prop wiring on SplitScreenLayout.**
  AgentChatPanel accepts `currentUserRole?: UserRole` but
  SplitScreenLayout doesn't thread the real value — defaults
  to 'controller'. Read membership.role from the
  authenticated user's current-org membership and pass it
  through so SuggestedPrompts shows the right persona chips.
- **Canvas navigation on Approve.** ProposedEntryCard's
  `onNavigate` callback is currently not wired. Commit 5's
  SplitScreenLayout state lift is the natural home — wire
  `onNavigate` from ProductionChat so the journal-entry view
  auto-opens on Approve and the prefilled form opens on Edit.
- **SplitScreenLayout state lift (Pre-decision 9).** The
  useState-based `selectedEntity` + canvas-directive state is
  what Commit 5 delivers; Commit 4's avatar-dropdown Team
  button also consumes this via an `onTeamClick` callback
  (fires `setDirective({ type: 'org_users', orgId })`).
  Commits 4 and 5 have a unidirectional coupling — Commit 4's
  dropdown consumes Commit 5's state setter — so order
  matters if both are implemented in a single session.

EC coverage: EC-19 (canvas context client + agent) is the
primary gate; EC-19a (automated client-side) + EC-19b (manual
agent-side) split per the Session 7 sub-brief. EC-8's
placeholder landing at Session 7.1 enables Session 8's real
queue page.

Sub-brief drafting should apply Convention #8 identity-
assertion discipline throughout, matching Session 7 sub-brief's
pattern at ba9599a.

### Session 8 handoff

Status: sub-brief needed, schedule after Session 7.1 closes.
Refreshed at Session 7.1 Commit 6 closeout (2026-04-19).

Anchor SHA: Session 7.1 Commit 6 closeout SHA (the commit
carrying this update).

Scope — verification + closeout for Phase 1.2:

- **Session 7.1 Commit 4 disposition (first Session 8
  decision).** Commit 4 (shell polish — AvatarDropdown with
  4 items, MainframeRail Activity icon, ~15 LOC placeholder
  `src/app/[locale]/[orgId]/agent/actions/page.tsx`, P15
  `currentUserRole` wiring on `SplitScreenLayout` with
  `orgId !== null` onboarding guard, `avatarDropdownMenu
  Behavior.test.ts`) deferred at Session 7.1 Commit 5 closeout
  because EC-19 verification scope widened (7.1.1 + 7.1.2).
  **Default disposition: lands as Session 8's opening
  commit.** Session 7.2 as a separate mini-sub-session remains
  a valid alternative if founder prefers scope isolation at
  Session 8 kickoff. Rolling into Session 8 is closer to how
  Session 7 → 7.1 absorbed 7's Commits 4–5; Session 7.1.1 /
  7.1.2 were mid-thread carve-outs for scope-widening
  discoveries, a different shape than "originally planned,
  deferred due to session compression." Scope is genuinely
  independent of everything else on this list; no rebase risk
  either way.
- **Functional AI Action Review queue page** — replaces the
  Commit 4 placeholder (whether that placeholder lands as
  Session 7.2 or as part of Session 8 per the bullet above).
  Query `ai_actions` for the current org; render rows with
  `status` + `created_at` + `idempotency_key` + cross-link to
  the journal entry when `status ∈ {'confirmed',
  'auto_posted'}`. ~80–120 LOC plus any needed `ai_actions`
  query service. Required for EC-8 ("the 20 Phase 1.2 agent
  entries all appear correctly in the AI Action Review
  queue"). Role-gate on `ai_actions.read` permission (all
  three roles hold it per migration 116).
- **Mode B org_id confusion investigation.** New finding
  surfaced during 7.1.2 EC-19 execution, orthogonal to 7.1
  scope: the agent consistently says "I need the organization
  ID" when asked about non-selected entities or ungrounded
  questions. Hypothesis: `listJournalEntries` (and likely
  other read-tool) descriptions don't cover "look up by
  number" or "resolve context from user reference." Likely
  touches `src/agent/tools/` descriptions + possibly
  `src/agent/prompts/` persona routing. Scope budget TBD at
  Session 8 sub-brief time; may split into its own mini-sub-
  session depending on investigation-vs-fix ratio. Rolls the
  agent's conversational usefulness beyond journal-entry
  creation into grounded question-answering — arguably a
  Phase 2 scope question, but worth scoping at Session 8.
- **27-EC matrix reconciliation** — full pass across the 27
  exit criteria (19 from `phase_plan.md` + 8 new for
  onboarding/forms/migration). **EC-19b closed at Session
  7.1 Commit 5**: manual scenarios (a), (b), (c) all passed
  against real Claude at the 39c6d38 SHA; captured in the
  7.1.2 execution NOTE above. EC-19a automated coverage lives
  in `canvasContextReducer.test.ts` +
  `apiAgentMessageCanvasContextPassthrough.test.ts` in the
  Commit 5 test surface. Unnumbered shipping items (avatar
  dropdown / Activity icon / placeholder-then-real queue
  page) listed for bookkeeping completeness.
- **EC-2** — 20 real Phase 1.2 agent entries produced through
  the conversational flow. Manual gate; one of the two
  production-readiness proofs for Phase 1.2 shipping.
- **EC-11** — cost-per-entry dashboard / observation.
  Anthropic API spend per successful journal entry. Phase 1.3
  calibration input.
- **EC-13** — adversarial anti-hallucination test. Prompts the
  agent with deliberately wrong context (non-existent
  accounts, impossible dates, reversed-sign amounts) and
  verifies the agent refuses rather than inventing. Paid-API
  session.
- **Session 5 `/admin/orgs` reference reconciliation** — two
  references in the Session 5 sub-brief to `/admin/orgs` as a
  post-onboarding landing page that doesn't exist in the
  shipped codebase. Reconcile: either ship a minimal
  `/admin/orgs` route, or strike the references and update
  `resolveCompletionHref` in `AgentChatPanel.OnboardingChat` to
  match actual behavior.
- **Environmental-gotchas backlog** (from 7.1.2 EC-19 run,
  deferred):
  - Bridge Holding Co `/api/orgs/11111111.../journal-entries`
    returns 500 consistently; Bridge Real Estate works fine.
    Route stack-trace capture + root-cause; likely a seed-
    data or routing bug, not an EC-19 issue.
  - `OrgSwitcher.tsx:67` emits React duplicate-key warnings
    for the two seed orgs. Cosmetic; one-line key fix.
  - `claude-sonnet-4-20250514` model deprecation warning,
    EOL 2026-06-15. Update to the current model family before
    the June cutoff.
- **Phase 1.2 closeout retrospective** — patterns, calibration
  data, process insights. Written as the Phase 1.2 counterpart
  to `docs/07_governance/retrospectives/phase-1.1-
  retrospective.md`. Includes the day-clock calibration
  hypothesis from Session 7's retrospective (now with the
  Session 7.1 thread as a second datapoint — six commits on
  day 1 plus EC-19 verification, with execution compression
  holding through multi-sub-session carve-outs) and the
  Session 8 own-day datapoint.

Estimate: variable. Depends on the 20-entry gate result (EC-2)
and whether the adversarial test (EC-13) surfaces prompt-
engineering work. Typical Phase 1.1 closeout was ~3 days;
Phase 1.2 likely similar or longer given the agent surface
area.

Outstanding candidate-conventions that Session 8 retrospective
should ratify or demote:

- **Convention #9 — "Material gaps surface at layer-transition
  boundaries."** Five datapoints: P11b (Session 7), P14
  (Session 7), P16 dual-context rewrite (Session 7.1), P19
  template-catalog gap (Session 7.1.1), P21 rationale drift
  (Session 7.1.1). Doubly overdetermined. P21's datapoint
  suggests scope extends beyond "implementation layers" to
  include "planner-drafting layer → execution layer" — name
  the convention to encompass both.
- **Convention #10 — "Mutual hallucination-flag-and-retract
  discipline between planner and executor."** Six datapoints
  in Session 7.1 thread alone: P20 prose tweaks, P21
  rationale retraction, ValidTemplateId type redefinition,
  zombie dev-server misdiagnosis, executing-plans skill
  review-gate bypass self-audit, 7.1.2 sub-brief stale-
  phrasing observation. Triply overdetermined. Session 7's
  retrospective noted "no codification needed — working
  organically"; 7.1's datapoint volume shifts the call.
- **Held-working-tree discipline across multi-commit threads**
  (single datapoint from 7.1's 6-commit thread holding
  Commit 5 uncommitted across 9 hours and 5 intervening
  commits). Not at codification threshold yet; watch Session
  8 for a second datapoint.
- **Shape C DELTA-of-DELTA sub-brief envelope is ~75–95
  lines** (two datapoints this thread — 7.1.1 at 77, 7.1.2 at
  85). Revised from Session 7's "30–60 line" estimate.
  Estimate-update rather than convention-material; noted so
  Session 8 or later Shape C sub-briefs size correctly.

Process observations to carry into Session 8:

- **Scope-discipline vs founder-workflow planner bias** —
  single datapoint from 7.1; watch for a second in Session 8.
  The planner should not default-to-defer when the founder is
  driving an EC gate and the ask is scope-aligned even if not
  scope-bracketed.
- **executing-plans skill review-gate bypass** — observed
  once; structural-vs-one-off undetermined at 1 datapoint.
  Session 8 is the pattern-repeat-watch; if it repeats,
  either wrap the skill with a review-gate prompt or document
  the founder-review-at-commit-boundary convention
  independently.

## Phase 1.2 Session 7.1 (execution)

- 2026-04-19 NOTE   Session 7.1 execution kickoff. Anchor SHA
  dc0ee69 (docs(phase-1.2): session 7.1 sub-brief frozen).
  Working tree clean. Baseline: 344/344 tests green,
  `pnpm agent:validate` passes (typecheck + no-hardcoded-URLs +
  5 Category A floor tests). Sub-brief at
  `docs/09_briefs/phase-1.2/session-7-1-brief.md` — Shape B
  DELTA over ba9599a §4 for Commits 4+5 deferred per Session 7
  Pre-decision 2's split-point pre-declaration, plus three
  non-blocking Commit 3 carryovers (currentUserRole wiring,
  canvas navigation on Approve/Edit, SplitScreenLayout state
  lift). Three execution commits planned per Pre-decision 18's
  dependency reversal: (1) **Commit 5** (ba9599a labels) —
  canvas context click handlers, reduceSelection pure reducer
  honoring Pre-decision 10's type-compatibility rule,
  SplitScreenLayout state lift, AgentChatPanel send() builds
  canvas_context from props, two new test files + three EC-19
  manual scenarios against real Claude; (2) **Commit 4**
  (ba9599a labels) — AvatarDropdown (4 items), MainframeRail
  Activity icon, ~15 LOC placeholder actions/page.tsx,
  avatarDropdownMenuBehavior test, **plus** P15 currentUserRole
  wiring on SplitScreenLayout with `orgId !== null` onboarding
  guard per §3 carryover disposition; (3) Commit 6 — docs
  closeout, Session 7.1 retrospective, CURRENT_STATE update,
  and UPDATE (not rewrite) of the existing Session 8 handoff
  section (anchor SHA shift + Convention #9 candidate datapoint
  count refresh — three datapoints now: P11b, P14, P16 rewrite).
  Pre-decisions in effect: P15 (OrgSwitcher pattern + guard),
  P16 (dual-context UX ruling; callback order is implementation
  detail, ProposedEntryCard.tsx stays untouched), P17 (all four
  dropdown items drop selectedEntity uniformly per P10), P18
  (Commit 5 before Commit 4 by dependency). Each commit gates
  on a founder review per Session 6/7 pattern — diff review,
  test-pass verification, Convention #8 identity-assertion
  spot-check. Starting Commit 5.

## Phase 1.2 Session 7.1.1 (execution)

- 2026-04-19 NOTE   Session 7.1.1 execution kickoff. Anchor SHA
  58ade6e (docs(phase-1.2): session 7.1.1 sub-brief frozen).
  Working-tree state: Session 7.1 Commit 5 changes held
  uncommitted (modified bridge/canvas components +
  `src/agent/canvas/` + two new `tests/integration/` files +
  this friction-journal entry). Per sub-brief §2, Commit 5
  stays uncommitted; 7.1.1 commits land on top of 58ade6e and
  Commit 5 re-tests EC-19 against the extended catalog after.
  Baseline: 365/365 tests green, `pnpm agent:validate` passes
  (typecheck + no-hardcoded-URLs + 5 Category A floor tests).
  Sub-brief at `docs/09_briefs/phase-1.2/session-7-1-1-brief.md`
  — micro-sub-session carved out of Session 7.1 to extend the
  template catalog so the agent has a legal response shape for
  grounded conversational answers (EC-19 scenario (a)) and to
  move `agent.error.*` out of agent-selectable space into an
  orchestrator-internal map. Single feature commit planned
  (`feat(phase-1.2): Session 7.1.1 — agent.response.natural +
  template catalog split`) with retrospective folded into the
  commit message per §5; process observations roll up into
  Session 7.1 Commit 6 closeout when it lands. Three
  pre-decisions in effect: **P19** (`agent.response.natural`
  `{ text: string }.strict()` as the general free-form
  conversational template; narrow per-entity templates rejected
  as not-scalable), **P20** (prompt routing prefers structured
  templates when shape known, falls back to
  `agent.response.natural` for grounded conversational answers;
  exact prose wording drafted during execution with founder
  review at commit gate), **P21** (two-map split —
  `AGENT_EMITTABLE_TEMPLATE_IDS` 14 entries rendered in prompt;
  `SERVER_EMITTED_TEMPLATE_IDS` 2 entries orchestrator-internal;
  `validateParamsAgainstTemplate` accepts both via merged
  lookup so self-emit paths keep validating through the same
  helper). Convention #9 candidate (material gaps surface at
  layer-transition boundaries) picks up a **4th datapoint** at
  7.1.1 — the template-catalog gap is a layer-transition gap
  between catalog-closure and prompt-routing per §8, joining
  P11b, P14, and the P16 dual-context rewrite. Overdetermined
  for codification at Session 8 retrospective. Commit gates on
  founder review — diff review, test-pass verification,
  Convention #8 identity-assertion spot-check, and founder
  sign-off on P20 exact prose wording. Post-commit: founder
  runs EC-19 scenarios (a), (b), (c) in browser against the
  extended catalog; if all three pass, Commit 5 commits; any
  fail → investigate `canvasContextSuffix` or persona prompts
  before retry. Starting design pass.

- 2026-04-19 NOTE   Design-pass outcome (Session 7.1.1 pre-
  implementation). Founder rulings on four surfaced items: (1)
  P20 prose approved with two tweaks — add `agent.greeting.welcome`
  to the structured enumeration and replace "clarifying what
  the user is looking at" with "asking a clarifying question
  when context is ambiguous" (matches EC-19 scenario (c)
  wording); (2) scope widened — `agentTemplateIdSetClosure.test.ts`
  joins the commit alongside `agentTemplateParamsClosure.test.ts`,
  including a load-bearing negative assertion that no
  `SERVER_EMITTED_TEMPLATE_IDS` key appears in
  `validTemplateIdsSection()` rendered output; (3) P21 rationale
  corrected — the stated reason "self-emit paths keep same
  helper" doesn't match call-site reality (the two self-emit
  sites at `src/agent/orchestrator/index.ts:450`, `:468`,
  `:708`, `:726` construct assistant turns with literal
  template_ids and do **not** invoke `validateParamsAgainstTemplate`).
  **Corrected rationale (authoritative from this NOTE forward):**
  "`validateParamsAgainstTemplate` accepts both maps via merged
  lookup because (a) single API surface for any future consumer
  validating a persisted turn, (b) defense-in-depth if a future
  code path validates server-emitted turns before persistence.
  Isolation of `agent.error.*` from the agent-selectable surface
  is maintained at the prompt-renderer layer
  (`validTemplateIdsSection` only iterates
  `AGENT_EMITTABLE_TEMPLATE_IDS`), not at the validator layer."
  (4) Disjointness test included:
  `Object.keys(AGENT_EMITTABLE_TEMPLATE_IDS).filter(k => k in
  SERVER_EMITTED_TEMPLATE_IDS)` must equal `[]`. (5) Internal
  `ValidTemplateId` type redefinition proceeds (zero external
  callers verified via grep; only use is at line 61 of the
  same file). **5th Convention #9 datapoint — planner-side.**
  The P21 rationale was drafted at sub-brief time without
  grep-verifying how the orchestrator self-emit sites actually
  use the validator. The surface symptom was a minor accuracy
  gap in the rationale; the layer-transition this exposes is
  "pre-decision drafting (planner layer) → call-site reality
  (orchestrator layer)." Joining the four earlier datapoints
  (P11b schema-layer, P14 persistence-layer, P16 dual-context
  rewrite, P19 template-catalog gap) as the **5th** — Session 8
  codification is now doubly overdetermined. Proceeding to
  implementation.

## Phase 1.2 Session 7.1.2 (execution)

- 2026-04-19 NOTE   Session 7.1.2 commit d66c0c4 landed with
  Playwright harness + EC-19 spec. Two process observations:
  (a) executing-plans skill's workflow bypassed the founder
  review gate between implementation and commit — pattern
  deviation from session-wide discipline; commit content clean
  on retrospective inspection, but process observation
  preserved for Session 7.1 Commit 6 retrospective. (b) Session
  7.1.2 sub-brief §4 journalEntry.ts bullet retains stale pre-
  amendment "data-testid selectors" phrasing; §6 and the code
  fixture correctly reflect the authoritative text-based-
  initially strategy. Minor artifact-staleness; not amending.

- 2026-04-19 NOTE   EC-19 manual verification complete against
  post-a43dd35 code. All three scenarios pass canvas_context
  over-anchoring criterion (scenarios a, b bidirectional, c).
  Session 7.1.1's extended catalog (agent.response.natural +
  removed "pick the closest" directive) verified working in
  real Claude against the project. Verdict substantiated in
  planner conversation; captured user messages and verbatim
  agent responses archived there. Session 7.1 Commit 5 gate
  clears.

- 2026-04-19 NOTE   New finding surfaced during EC-19
  execution: "Mode B org_id confusion" pattern. Agent
  consistently claims "I need the organization ID" when asked
  about non-selected entities or ungrounded questions.
  Hypothesis: listJournalEntries tool description doesn't
  cover "look up by number" or "resolve context from user
  reference." Tool-selection gap orthogonal to canvas_context
  injection. Becomes Session 8 or Phase 2 investigation.

- 2026-04-19 NOTE   Environmental gotchas observed during
  EC-19 execution: (a) zombie dev-server diagnosis false
  alarm — planner misread ps output and claimed a root-owned
  next-server v14.2.13 held port 3000; retracted after
  founder-instigated fresh logs showed the project's own
  v15.5.15 dev server serving correctly. Convention #10
  datapoint: planner hallucinated a diagnosis from a misread
  screenshot; founder-instigated fresh logs exposed the
  error. (b) Bridge Holding Co
  /api/orgs/11111111.../journal-entries returns 500
  consistently; Bridge Real Estate works fine. Route stack-
  trace capture deferred to Session 8. (c) OrgSwitcher.tsx:67
  emits React duplicate-key warnings for the two seed orgs —
  cosmetic, minor cleanup. (d) claude-sonnet-4-20250514 model
  deprecation warning logged, EOL June 15 2026 — Session 8
  backlog item. (e) WSL vs Windows CMD terminal confusion —
  founder's `pnpm test:e2e` in CMD couldn't find Playwright
  installed inside WSL; mirrored across sudo-PATH pitfalls
  where `sudo pnpm` inherited a different `PATH` than the
  interactive shell, producing spurious "command not found"
  during Playwright-browser install.

### Session 7.1 retrospective

Session 7.1 executed as a three-sub-session thread all on
2026-04-19: the main Shape B DELTA (dc0ee69) carrying Commits
4–5 deferred from Session 7, plus two Shape C DELTA-of-DELTA
micro-sub-sessions carved out mid-thread (7.1.1 template
catalog, 7.1.2 Playwright harness) when scope for EC-19
verification widened past the main sub-brief's envelope. Six
commits landed on top of dc0ee69:

- **53ff280** — `fix(dev): disable broken pino-pretty
  transport under Next.js 15`. Dev-experience fix surfaced
  when EC-19 manual run required a working dev server; landed
  ahead of the 7.1.1 sub-brief as an un-bracketed hygiene
  commit.
- **58ade6e** — `docs(phase-1.2): session 7.1.1 sub-brief
  (frozen)`.
- **a43dd35** — `feat(phase-1.2): Session 7.1.1 —
  agent.response.natural + template catalog split`. Adds the
  general free-form conversational template (P19) + two-map
  split (P21) + prompt-routing prose (P20).
- **1388945** — `docs(phase-1.2): session 7.1.2 sub-brief
  (frozen)`.
- **d66c0c4** — `feat(phase-1.2): Session 7.1.2 — Playwright
  harness + EC-19 spec`. Introduces `tests/e2e/` + harness
  fixtures + EC-19 scenarios (a), (b), (c) as the first spec.
- **39c6d38** — `feat(phase-1.2): Session 7.1 Commit 5 —
  canvas context injection`. The original Commit 5 scope —
  held uncommitted across the entire thread.

**Commit 4** (original shell polish — AvatarDropdown,
MainframeRail Activity icon, placeholder actions/page.tsx,
P15 `currentUserRole` wiring, `avatarDropdownMenuBehavior`
test) **is deferred to a subsequent session.** Second
pre-declared split-point of the Phase 1.2 execution, same
shape as Session 7's Commit 4–5 split: scope that doesn't
block the next EC gate gets deferred when the session day-
clock compresses enough to surface new scope (7.1.1 + 7.1.2)
mid-thread. Commit 4's scope is genuinely independent of
Commit 5's carryovers; no rebase friction expected.

Five patterns worth naming explicitly.

**1. Held-working-tree discipline worked across a 6-commit
thread.**

Commit 5's working tree (modified bridge/canvas components +
`src/agent/canvas/` + two new `tests/integration/` files +
the Session 7.1 execution-kickoff NOTE) stayed uncommitted
across the pino fix + two micro-sub-session sub-brief freezes
+ two micro-sub-session feature commits + EC-19 manual
verification — roughly 9 hours elapsed and 5 intervening
commits between the Commit 5 implementation moment and its
commit moment. No stash, no branch gymnastics, no cherry-pick
dance. Each micro-sub-session's §2 Prerequisites block
explicitly named Commit 5's held state and instructed the
executor not to touch it; each intervening commit touched
strictly disjoint files.

This is the first Phase 1.2 session to test hold-across-
multiple-commits discipline at this duration. It held. The
key affordances:

- Sub-brief §2 treats the held working tree as a
  **prerequisite**, not a nuisance. The "do not touch, stash,
  or revert" phrasing is load-bearing.
- Micro-sub-session file scopes are chosen to not collide
  with the held set (catalog files for 7.1.1, test
  infrastructure for 7.1.2).
- Each micro-sub-session's commit re-tests the held set's
  green baseline (tests + typecheck) before landing, catching
  any accidental cross-contamination immediately.

No codification yet — single datapoint. But the pattern
generalizes to any situation where a verification step needs
to land on top of extended infrastructure but the
infrastructure itself is the thing being verified. Worth
naming in Session 8 retrospective if a second datapoint
surfaces.

**2. Convention #9 candidate at 5 datapoints — codification
doubly overdetermined.**

"Material gaps surface at layer-transition boundaries"
collected three datapoints this thread, bringing the total to
five:

- **P11b** (Session 7) — onboarding-complete UX layer →
  `agent_sessions.org_id` schema layer.
- **P14** (Session 7) — conversation-resume UX layer →
  Session 5.1 terminating-text persistence layer.
- **P16 dual-context rewrite** (Session 7.1) — `onNavigate`
  callback shape → dual-context canvas+transcript UX.
- **P19 template-catalog gap** (Session 7.1.1) — catalog-
  closure layer → prompt-routing layer; EC-19 scenario (a)
  wasn't answerable with the shipped catalog.
- **P21 rationale drift** (Session 7.1.1) — planner-drafting
  layer → orchestrator call-site reality; the stated
  rationale "self-emit paths keep same helper" didn't match
  the four call sites in `src/agent/orchestrator/index.ts`.

Codification threshold is two datapoints. Five datapoints
make it doubly overdetermined. Session 8 retrospective is
the codification opportunity; the fifth datapoint (P21,
Session 7.1.1) also suggests the scope widens beyond
"implementation layers" to include "drafting layer →
execution layer" — the planner's mental model of the code,
in the act of being written, is a layer that can drift from
the shipped code. Whatever the final wording, Session 8
should carry the planner-drafting datapoint into the naming.

**3. Convention #10 candidate at 6 datapoints in one session
thread — triply overdetermined.**

"Mutual hallucination-flag-and-retract discipline between
planner and executor" surfaced six times across the 7.1
thread:

- **P20 prose tweaks** (7.1.1 design pass) — founder added
  two precise tweaks to the drafted prose (`agent.greeting.
  welcome` to the structured list; "asking a clarifying
  question when context is ambiguous" replacing the drafted
  "clarifying what the user is looking at"). Planner drafted;
  founder flagged; planner ratified.
- **P21 rationale retraction** (7.1.1 design pass) — planner
  drafted a rationale that grep-verification showed didn't
  match the call sites; planner explicitly retracted and
  re-stated (see the authoritative-from-this-NOTE-forward
  rewrite in the 7.1.1 design-pass NOTE).
- **ValidTemplateId type redefinition** (7.1.1 design pass) —
  planner proposed; founder asked for external-caller grep;
  proceeding ratified only after zero-caller evidence.
- **Zombie dev-server misdiagnosis** (7.1.2 EC-19 run) —
  planner misread `ps` output and claimed a root-owned
  `next-server v14.2.13` held port 3000; founder-instigated
  fresh logs showed the project's own v15.5.15 serving
  correctly; planner retracted.
- **executing-plans skill review-gate bypass** (7.1.2) —
  self-audit observation: the skill's workflow skipped the
  founder review gate between implementation and commit for
  the d66c0c4 feature commit. Commit content was clean on
  retrospective inspection, but the process pattern-deviation
  was surfaced and logged rather than waved past.
- **7.1.2 sub-brief stale-phrasing observation** (7.1.2) —
  the sub-brief's §4 `journalEntry.ts` bullet retained pre-
  amendment "data-testid selectors" phrasing while §6 and the
  shipped fixture carried the authoritative text-based-
  initially strategy. Planner noticed the artifact-staleness
  against shipped reality and flagged rather than papering
  over.

Six datapoints in one session thread is triply overdetermined
for codification. Prior Session 7 retrospective named the
pattern "working organically, no codification needed" — at a
datapoint volume this high, the pattern shifts from organic-
practice to load-bearing-discipline, and codification moves
from "nice to have" to "name it so executors in fresh
sessions don't need to rediscover it." Session 8
retrospective should write it up alongside Convention #9.

**4. Shape C DELTA-of-DELTA sub-brief size calibration.**

Session 7 retrospective posited a "30–60 line" envelope for
Shape C DELTA-of-DELTA sub-briefs (micro-sub-sessions carved
from a parent sub-brief). This thread produced two Shape C
sub-briefs with measured sizes materially larger:

- Session 7.1.1 sub-brief: **77 lines**.
- Session 7.1.2 sub-brief: **85 lines**.

The cluster centers at ~80 lines, comfortably above the
30–60 envelope. Pattern from both sub-briefs: §1 goal + §2
prerequisites (including held-working-tree state) + §3
pre-decisions (3–5 continuing-numbered pre-decisions) + §4
scope detail + §5 commit cadence + §6 stop conditions + §7
or §8 convention-candidate datapoint context.

Calibration update for Session 8 forward: **Shape C envelope
is ~75–95 lines, not 30–60.** The earlier estimate was
drafted before any Shape C sub-brief had shipped; the
underweighting came from treating "micro" as a line-count
term rather than a scope term. A micro-sub-session is micro
by scope (single commit, ~1–2 hours) and by LOC (60–100),
but not by sub-brief length — the prerequisite-density is the
same as a full-shape sub-brief, and skipping prerequisite
articulation is how micro-sub-sessions go off the rails.

Single revision to the earlier estimate; no convention
implications beyond the estimate-update itself.

**5. Process observations worth preserving (not yet
convention-level).**

Three additional observations surfaced this thread that
aren't yet at codification threshold but are worth naming so
future sessions can spot second datapoints:

- **Scope-discipline vs founder-workflow planner bias.** When
  the founder's iterative workflow produces an ask that looks
  like scope creep (e.g., "while we're here, can we also fix
  X"), the planner has a bias toward deferring-by-convention
  even when the founder's ask is the correct call in context.
  Observed when the Commit 4 shell polish deferred to a
  subsequent session while EC-19 verification drove the 7.1.1
  + 7.1.2 sub-sessions — the deferral was correct, but the
  planner's initial lean-to-defer wasn't calibrated to
  "founder is driving the EC gate, scope-creep check is
  moot." Worth watching across Session 8 to see whether a
  second datapoint clarifies the correction shape.
- **executing-plans skill review-gate bypass.** The
  `superpowers:executing-plans` skill's workflow, as invoked
  for 7.1.2's d66c0c4 commit, skipped the inter-implementation-
  and-commit founder review gate that Session 6 / 7 / 7.1
  Commit 5 all applied. Observed once this thread. The
  hypothesis is structural (the skill's workflow doesn't
  prompt for a review gate between "execute" and "commit"),
  but one datapoint isn't enough to confirm structural vs.
  one-off. Pattern-repeat-watch at Session 8 will determine
  which. If repeats, either wrap the skill with a review-gate
  prompt or document the founder-review-at-commit-boundary
  convention independently of executing-plans.
- **Mode B org_id confusion finding.** Surfaced during EC-19
  execution, orthogonal to 7.1 scope: the agent consistently
  claims "I need the organization ID" when asked about non-
  selected entities or ungrounded questions — `listJournal
  Entries` tool description likely doesn't cover "look up by
  number" or "resolve context from user reference." Tool-
  selection gap, not a canvas_context injection gap. Rolls
  into Session 8 as a new investigation item; may touch
  `src/agent/tools/` scope.

## Phase 1.2 Session 8 (execution)

- 2026-04-19 NOTE   Session 8 execution kickoff. Anchor SHA
  5e094bb (docs(phase-1.2): session 8 sub-brief (frozen)).
  Working tree clean. Baseline: 369/369 tests green,
  `pnpm agent:validate` passes (typecheck + no-hardcoded-URLs +
  5 Category A floor tests, 26 tests / 5 files). Sub-brief at
  `docs/09_briefs/phase-1.2/session-8-brief.md` — Shape A full
  sub-brief, 1068 lines, 13 pre-decisions P28–P40. Phase 1.2
  terminal session. 14-commit plan per §4 P28: C1 shell polish,
  C2 AI Action Review queue, C3 OrgSwitcher status filter +
  /admin/orgs ERRATA, C4 HoldingCo 500 pino instrumentation,
  C5 HoldingCo root-cause fix, [M] model migration (Q8a
  Option B ratified — `claude-sonnet-4-20250514` → current
  stable Sonnet; single paid-API pass), C6 EC-2, C7 EC-13,
  C8 Mode B listJournalEntries description + persona hint
  (placed AFTER paid-API gates per Q4), C9 Conventions #9 + #10
  codification, C10 27-EC matrix, C11 Phase 1.2 retrospective,
  C12 closeout. Six pre-decisions ratified at sub-brief draft
  v1 review (including Q8a Option B and OQ-S8-2
  `src/services/agent/` directory). Convention #9 candidate at
  5 datapoints (P11b, P14, P16 dual-context rewrite, P19
  template-catalog gap, P21 rationale drift) — codification
  target C9. Convention #10 candidate at 6 datapoints (P20
  prose tweaks, P21 rationale retraction, ValidTemplateId type
  redefinition, zombie dev-server misdiagnosis, executing-plans
  skill review-gate bypass, 7.1.2 sub-brief stale-phrasing) —
  codification target C9. Six split-point triggers pre-declared
  (§7); carve to 8.1 rather than truncate. Founder review gate
  at C1, C2, [M], C7, C8, C9, C11 per §12 "authored content"
  rule. Convention #8 identity-assertion grep pass applied at
  every commit's pre-implementation step. Starting design pass
  on C1 (shell polish — AvatarDropdown, SplitScreenLayout
  modifications, MainframeRail Activity icon, placeholder
  `agent/actions/page.tsx`, `avatarDropdownMenuBehavior` test).

- 2026-04-20 NOTE   C1 pre-implementation grep pass surfaced three
  drafting-layer drifts in P29: (a) MainframeRail already has an
  "actions" icon at :21 — C1 repurposes rather than adds sixth
  icon; (b) SplitScreenLayout.orgId is non-null typed — P29's
  "orgId !== null guard" drops as dead code; (c) settings/profile
  + settings/org are standalone routes outside the shell — P29's
  "dispatch directive before router.push" drops as dead work.
  Collectively: Convention #9 datapoint, Phase 1.2 Session 8
  first instance. Extends Session 7.1 thread's 5-datapoint
  sub-pattern ("planner-drafting → code-call-site reality") by a
  6th instance; codification at C9 still holds.

- 2026-04-20 NOTE   Positive observation (C1 design pass): P17's
  "uniform selectedEntity drop across avatar dropdown items" is a
  design property that emerges from reducer + route structure, not
  a per-callsite code enforcement. reduceSelection's type-
  incompatibility rule handles Team's directive_change path; full
  navs (Profile, Org settings, Sign out) unload the shell's state
  entirely. No explicit drop code needed on any of the four
  items. Worth preserving as a design insight for Phase 2.

- 2026-04-20 NOTE   Post-C1 dead-code tracking: after C1 lands, the
  `ai_action_review_queue` variant in the CanvasDirective union
  (`src/shared/types/canvasDirective.ts:13`) has no UI dispatcher —
  MainframeRail's `actions` handler switches to router.push, and
  ContextualCanvas's case for this directive renders
  `ComingSoonPlaceholder`. Not removed in C1 (scope creep). Flag
  for Session 8 retrospective and Phase 2 cleanup: "dead
  CanvasDirective variant: ai_action_review_queue; no UI dispatcher
  post-5e094bb + C1."

### C1 closeout — shell polish

**Commit:** e05d413
**Scope actuals:**
- Files: 6 source (1 NEW component, 1 NEW pure helper, 2 MODIFIED
  components, 1 NEW placeholder page) + 1 NEW test file + 3 i18n
  locale files (4 keys each)
- LOC: ~280 (scope floor estimate was ~80–120; overrun attributable
  to i18n 3-locale parity + node-env testability workaround
  pattern — pure helper extraction — not scope creep)
- Tests: +5 (P40 estimated +1; variance comes from testing the
  pure helper exhaustively rather than the original "controller vs
  others + sign-out navigation" 3-block scope)
- Final test count: 374/374

**Convention #9 datapoints (material gaps at layer transitions)
surfaced in C1:**

1. Pre-implementation grep — Finding A: P29 drafted "add Activity
   icon" without noticing MainframeRail.tsx:21 already held one
   labeled "AI Action Review" with ✅ emoji. Drafting-layer /
   code-layer drift.
2. Pre-implementation grep — Finding B: P29 drafted `orgId !== null`
   guard without checking SplitScreenLayout's actual prop type
   (non-null string). Drafting-layer / type-layer drift.
3. Pre-implementation grep — Finding C: P29 drafted "dispatch
   directive + router.push" without checking that settings routes
   render outside the shell (unmounts target component).
   Drafting-layer / render-tree drift.
4. UX verification — RLS policy expansion: SplitScreenLayout query
   used (org_id + maybeSingle) without user_id filter.
   `memberships_select` RLS policy broadens for controllers via
   `user_is_controller` helper, returning all team rows. The query
   layer and RLS policy layer had implicit, incompatible
   assumptions about scope. Query-layer / RLS-layer drift.

**Convention #10 datapoint (mutual hallucination-flag-and-retract):**

Planner's initial diagnosis of the RLS-expansion bug hypothesized
"possibly duplicate active+removed membership rows" (the P32 bug
path). Diagnostic data showed 3 rows from controller RLS expansion,
not 2 from duplicate status rows — entirely different mechanism.
Planner retracted the hypothesis before shipping a speculative fix
and re-analyzed against the actual RLS policy. Worth naming:
diagnostics should precede hypothesis commitment, not confirm it.

**Positive observation:**

UX verification gate caught a bug that passed:
- Convention #8 grep pass (verified OrgSwitcher pattern identity
  but didn't cross-check pattern-divergence implications —
  SplitScreenLayout adds `.maybeSingle()` which OrgSwitcher doesn't
  use)
- TypeScript typecheck (both queries are type-correct)
- Pure-helper test pass (`avatarDropdownItems` correctly returns 4
  for controller)

The bug was at the DB → RLS → component state → prop-passing
integration path. None of the structural checks can see it because
no layer by itself is wrong — only their interaction. Demonstrates
the UX gate's unique coverage of integration paths that can't be
unit-tested without a full browser environment.

Also worth naming: P17's "uniform selectedEntity drop across avatar
dropdown items" is a design property that emerges from reducer +
route structure (Profile/Org-settings/Sign-out full-nav unloads the
shell; Team's `directive_change` fires `reduceSelection`'s
type-incompatibility drop for `org_users`). No per-callsite
enforcement code needed. Potential Phase 2 retrospective insight:
design invariants that fall out of reducer + route structure don't
need explicit enforcement code.

**Scope delta for retrospective calibration:**

LOC overrun sources (both structural, not creep):
- i18n 3-locale parity: ~18 LOC (6 keys × 3 locales)
- Pure-helper extraction pattern: ~28 LOC (`avatarDropdownItems.ts`)
  for node-env test compatibility

Future Shape A sub-briefs should add these to C1-shaped scope
floors when i18n and node-env-vitest apply.

### C2 closeout — AI Action Review queue functional

**Commit:** 9ef45db
**Scope actuals:**
- 5 source files (1 NEW service, 1 REPLACES page, 1 NEW table
  component, 0 UI modifications) + 2 NEW test files + 3 i18n
  locale files (12 keys each)
- LOC: ~350 (P30 floor ~200; variance from i18n 3-locale parity +
  5 it-blocks service test + exhaustive merge/ordering coverage)
- Tests: +9 it-blocks (P40 estimated +2 files / ~+5 it-blocks);
  final test count 374 → 383

**Convention #9 datapoints surfaced during C2 (4 total):**

1. **Finding D — canUserPerformAction path YAGNI:** P30's literal
   `canUserPerformAction(ctx, 'ai_actions.read', orgId)` was
   over-specified for a read-gate where all three personas hold
   the permission. Deviation to `getMembership` + null-check
   ratified by founder ruling; Phase 2 revisits if
   role-discriminating reads appear.

2. **Finding E — FK embed vs separate-query for entry_number
   merge:** `journalEntryService.list`'s `reversed_by` lookup is
   the direct structural analog; C2 mirrors the two-query pattern.
   Phase 1.1 retrospective §3 names FK-embed type-shape drift as
   a bug class; executor applied the discipline pre-implementation.

3. **ai_action_status enum expansion:** migration 20240120 added
   `'edited'` as a fifth enum value. P30 did not enumerate all 5
   values; pre-implementation grep surfaced `'edited'` and the
   status-pill color scheme covers it. Minor drafting-layer gap.

4. **Seed-reality vs in-code-comment drift:** the comment in
   `orgProfileEditorAuthz.test.ts:52-54` claims "every seed user
   has memberships on both" ORG_HOLDING and ORG_REAL_ESTATE.
   Test-run verification showed AP specialist is on
   ORG_REAL_ESTATE only. C2 test file documents actual seed
   reality; the outdated comment in the Session 6 test file is
   flagged (not fixed in this commit — docs-only fix can be
   drive-by with a future commit or Phase 2 cleanup).

**Positive observations:**

- **Two-step server-side authz pattern.** The authz gate uses
  `getMembership` (no ServiceContext needed); the service call
  builds a minimal ServiceContext inline with
  `caller.org_ids = [orgId]` only. Authorization runs BEFORE
  ServiceContext construction — the context carries already-
  verified scope, not claimed scope. Worth naming as a Phase 2-
  facing pattern for future server-component data-fetching routes.
- **i18n placeholder-parity pattern used again.** English strings
  in `fr-CA.json` and `zh-Hant.json` per conventions.md §i18n.
  Third Phase 1.2 commit using this pattern (after C1 + original
  Session 6 form scaffolding). Worth codifying in Phase 1.2
  retrospective §6 as a convention candidate or flag for Phase 2
  translation-pipeline work.

**Observations surfaced during UX verification (non-regressions):**

- AP specialist sign-in triggers an onboarding "Let's post a
  journal entry" flow visible in the agent chat panel. Pre-
  existing AP-persona behavior, not a C2 regression. Flagged here
  as a datapoint for Phase 2 scope calibration — the onboarding
  state machine's persona-specific branches may need post-Phase-
  1.2 attention if AP users routinely re-encounter the onboarding
  suffix on re-sign-in.

**Scope delta for retrospective calibration:**

LOC overrun sources (all structural, not creep):
- i18n 3-locale parity: ~36 LOC (12 keys × 3 locales)
- Service test exhaustive coverage: ~40 LOC (5 it-blocks vs P30
  estimate of 3–4)
- Inline ServiceContext construction in page: ~8 LOC

Test-block overrun (+9 vs +5 estimate) covers real failure modes:
ordering, entry_number merge, `ORG_ACCESS_DENIED`, empty-response,
filter-by-org, seed-reality contract, forbidden-flag contract,
stranger-user null membership.

**Process deviation (flag only, no remediation):**

Executor omitted a C2 kickoff NOTE under the Session 8 execution
heading at start of C2 design pass. Session 8 kickoff instruction
named this as the commit-open ritual ("friction-journal NOTE
appended to the Session 8 execution block at start of each
commit's work"). C1 had its kickoff NOTE from the session kickoff
itself; C2's absence is a structural gap, not an intentional
deviation. No remediation for C2 (can't retroactively pre-date
the NOTE); C3 forward should open with an explicit kickoff NOTE.

- 2026-04-20 NOTE   C3 design pass kickoff (restored per-commit
  NOTE discipline). Scope per P28 / P32 / P33: batched fix for
  OrgSwitcher duplicate-key warning (one-line `.eq('status',
  'active')` addition) + `/admin/orgs` Session 5 ERRATA appendix
  + grep-verification that `resolveCompletionHref` currently
  routes to `/[locale]/[firstOrgId]/`. Scope floor <30 LOC + one
  docs block. Founder review gate: §6 names "none required (pure
  hygiene)" — I will still pause for diff-review-only per §12's
  optional-gate rule. Starting grep pre-checks.

### C3 closeout — OrgSwitcher status filter + /admin/orgs reconciliation

**Commit:** 5c6ee31
**Scope actuals:**
- 2 source (1 MODIFIED `OrgSwitcher.tsx` +1 LOC; 1 NEW test
  ~65 LOC) + 1 MODIFIED docs (Session 5 ERRATA block ~28 lines)
- Test delta: +1 it-block (P40 estimated +1; exact match)
- Final test count: 383 → 384
- Three files outside scope (AgentChatPanel, `/admin/orgs/page`,
  CURRENT_STATE) verified unchanged per founder Ruling 2

**Convention #9 datapoints (3 this commit):**

1. **Finding G — `/admin/orgs` route exists** (drafting-layer /
   code-reality drift propagated three session handoffs: Session 6
   PD-8 → Session 7.1 handoff → Session 8 sub-brief §3 + P33).
   Pre-implementation grep at C3 caught it.

2. **Finding H — `resolveCompletionHref` fall-through to
   `/admin/orgs` remains** in the degenerate edge case,
   contradicting sub-brief §3 prereq. Half-true premise (happy
   path matched; fall-through did not).

3. **Finding I — proposed P33 ERRATA text was factually wrong.**
   Committing it would have propagated false information.
   Corrected ERRATA documents actual state.

**Cross-commit pattern observation:**

C1–C3 has now accumulated 11 Convention #9 datapoints (3+5+3,
counting the C1 UX-gate finding and the C2 seed-reality finding
as separate datapoints):

- Intra-session drafting-layer drift: 7 datapoints (mostly C1
  and C2 findings).
- Cross-session drafting drift: 1 datapoint (this commit's
  Finding G, spans Sessions 6 → 7.1 → 8).
- Code-reality / schema-reality drift: 3 datapoints (C1 RLS
  expansion, C2 ai_action_status enum, C2 seed-reality comment).

Worth naming at C9 codification: Convention #9's datapoints have
structurally distinct sub-categories. Single codification at C9
with sub-categorization inside, OR two tightly-related
conventions (#9a intra-layer, #9b cross-session-premise-
inheritance).

**Scope delta for retrospective calibration:**

- LOC match to P32 floor (~1 LOC + 1 test + ERRATA block) — no
  overrun.
- Three design findings surfaced in design pass (G, H, I); all
  ratified as the sub-brief premise being wrong; executor
  correctly refused to commit the drafted ERRATA verbatim.
- C3 is the first Session 8 commit where the sub-brief was
  substantively wrong at the premise level rather than just
  under-specified. Distinguish in retrospective: P29 (C1) and
  P30 (C2) were under-specified (correct premise, missing
  details); P33 (C3) was WRONG premise. Different failure mode,
  different codification implications.

- 2026-04-20 NOTE   C4 design pass kickoff. Scope per P28 /
  P31: structured pino logging inside GET handler's catch
  block at `src/app/api/orgs/[orgId]/journal-entries/route.ts`.
  Instrumentation-only — no behavior change; the 500 continues
  to surface, the log just makes root cause observable.
  ~10 LOC. Review gate optional per §12; founder post-commit
  action is to run a HoldingCo GET request and capture the
  stack trace from dev logs for C5's design-pass gate.
  Starting grep pre-checks.

### C4 closeout — HoldingCo 500 pino stack-trace instrumentation

**Commit:** 387cdb2
**Scope actuals:**
- 1 source file MODIFIED (`route.ts` GET handler only; POST
  untouched) — +26 / -1 LOC
- Test delta: 0 (P40 match — instrumentation-only, no behavior
  change)
- Final test count: 384/384 (held exactly)

**Convention #9 datapoint (1 this commit):**

1. **Finding J — TypeScript strict-mode scaffolding overhead.**
   P31 drafted the log shape as if `trace_id` and `org_id` were
   always in scope in the catch block, but the existing code
   binds both inside the try block (orgId from `await params`
   at :81, ctx.trace_id from `buildServiceContext` at :85).
   Hoist-`let` + type-guarded unknown destructuring added ~8 LOC
   beyond P31's ~10 LOC estimate. Not scope creep — TypeScript
   strict mode is language-enforced, not discretionary.

**Sub-category structure emerging across C1–C4:**

Four distinct failure modes in sub-brief drafting accumulated
across Session 8 so far, each a candidate Convention #9
sub-category at C9 codification:

- **Wrong premise** (P33 / C3): premise itself was factually
  incorrect; acting on it would have committed false content.
- **Under-specification** (P30 / C2): correct premise, missing
  detail (e.g., P30 didn't enumerate all `ai_action_status`
  enum values or spell out the server-component canUserPerformAction
  path gap).
- **Drafting/code-reality drift** (P29 / C1): correct premise
  but specific values didn't match code reality (MainframeRail
  icon already existed; orgId prop was non-null; settings
  routes were outside shell).
- **Scaffolding overhead** (P31 / C4): correct premise, correct
  detail, but under-modeled the TypeScript-strict-mode accommodation
  required to implement the shape.

Each sub-category has distinct codification implications — C9's
Convention #9 write-up should name at least three (scaffolding
overhead is arguably minor enough to cluster with under-
specification; founder-call at codification time).

**Scope delta for retrospective calibration:**

- LOC +8 over P31 estimate; structural, not creep.
- No test added (P40 match).
- Review gate was diff-only (optional per §12 — hygiene-shaped
  change, not authored content).
- Post-commit: waiting for founder's HoldingCo 500 repro + stack
  trace capture before C5 design pass can open.

- 2026-04-20 NOTE   C4 repro surfaced a C4-design miss. The
  expected `'journal-entries GET 500'` pino line was absent
  from dev stdout; two 500s still fired. Root cause: the failure
  is a `ServiceError` (likely `READ_FAILED` thrown from
  `journalEntryService.list`), and C4's logger.error sits in the
  *unknown-error* branch — AFTER the ServiceError early-return.
  Planner's C4 claim ("ServiceError branch reaches pino through
  service-layer loggerWith(ctx)") was true for `.post` (which
  has log.error calls on failure paths) but FALSE for `.list`
  (no log.error on READ_FAILED). Claim was not grep-verified
  against `.list` before ruling.

- 2026-04-20 NOTE   C5 scope expanded to two parts per founder
  ruling: **Part 1** — extend the catch-block log to also fire
  for ServiceError with status ≥ 500 (flat `err_code`,
  `err_message`, `err_stack` fields to avoid pino's reserved
  `err` field; message `'journal-entries GET 500 (ServiceError)'`).
  **Part 2** — repro-driven root-cause fix, shape TBD from the
  expanded log's output. Executor implements Part 1, validates
  (no behavior change; test count stays 384/384), and stands
  down for founder re-repro. C5 will commit Part 1 + Part 2
  together (no separate C4b trivial-instrumentation commit).
  Finding K captured for the C5 closeout; Convention #9 / #10
  categorization question logged for C9 codification. Starting
  Part 1 implementation.

### C5 closeout — HoldingCo 500 root-cause fix (URI-too-long from unbounded .in() queries)

**Commit:** 86b1adb
**Scope actuals:**
- 2 files MODIFIED (route.ts Part 1 +25/-8; journalEntryService.ts
  Part 2 +43/-14)
- 1 file NEW (journalEntriesListChunkedIn.test.ts ~163 LOC)
- Test delta: +1 it-block (P40 range +1 to +3; low-end match)
- Final test count: 384 → 385
- Suite runtime: 54s → 56s (+1.9s; dominated by 150-entry bulk seed)

**Root cause:** HTTP 414 "URI too long" from PostgREST/nginx when
`journalEntryService.list` serialized >200 UUIDs into a
`.in('col', entryIds)` query URL. Architectural / infrastructure-
layer bug, not seed-data edge. Any org with ~200+ entries affected;
ORG_HOLDING crossed the threshold during Phase 1.2 dev.

**Convention #9 datapoints (3 this commit, bringing Session 8
total to 16):**

1. **Finding K — Service-layer log claim was false for `.list`.**
   Planner's C4 ruling (ServiceError branches reach pino via
   `loggerWith`) was true for `.post` but FALSE for `.list`
   (READ_FAILED throws silently). Claim was not grep-verified
   against the specific function. Caught by the forcing function
   "no pino output despite C4 in place."

2. **Finding L — P31 speculation exhaustively wrong.** All three
   P31 "likely suspects" (reversed_by map miss, NUMERIC edge,
   null fiscal_period_id) missed. Real cause (URI length) was
   infrastructure-layer, not data-layer. Extends Finding J's
   "scaffolding overhead" sub-category.

3. **Two-step P31 discipline observation (positive).** Instrument-
   before-fix paid off recursively: C4 instrumentation caught
   one wrong design claim (Finding K); C5 Part 2 chunking caught
   another wrong design claim (P31's speculated root causes).
   Both corrections were Phase-2-scaled bugs avoided by ~10
   minutes of added roundtrip.

**Convention #10 datapoints (1 this commit):**

- Planner unverified-claim retraction mid-design. Executor's
  "C4 pino line absent from stdout" finding was the forcing
  function. Planner retracted the C4 ruling's "ServiceError
  reaches pino" claim verbatim, restated with grep-verified
  scope (true for `.post`, false for `.list`), and proceeded
  to C5 Part 1 expansion. Retraction was caught at lowest-cost
  point (mid-repro, before another commit).

**Cross-commit pattern observation:**

Session 8 Convention #9 datapoints through C5: 16 total across
5 commits.

- Intra-session drafting drift: 7 datapoints (C1 + C2 findings)
- Cross-session premise inheritance: 1 datapoint (C3 Finding G)
- Code-reality / schema-reality drift: 3 datapoints (C1 RLS,
  C2 enum, C2 seed-comment)
- Scaffolding overhead (TypeScript, infrastructure): 3 datapoints
  (C4 Finding J, C5 Finding K, C5 Finding L)
- Planner speculation drift: 2 datapoints (C5 Finding L
  explicitly; C5 Finding K implicitly)

The "scaffolding overhead" sub-category is now 3-deep
(TypeScript strict-mode at C4; service-layer logging gap at
C5 Part 1; infrastructure URI limits at C5 Part 2). Worth
naming as its own Convention #9 sub-category at C9 codification.
Proposed sub-category name: "Language/runtime/infrastructure
scaffolding gaps — sub-briefs under-model concerns that are
invisible at source-read time but visible at runtime."

- 2026-04-20 NOTE   [M] model migration kickoff. Q8a Option B
  freeze-discipline applied: master brief §5.2 step 6 literal
  model string `'claude-sonnet-4-20250514'` intentionally NOT
  edited (brief frozen at aae547a; reference survives as a
  historical artifact superseded by this commit). Decision G
  (§3 "Starting model: Claude Sonnet (latest stable)") phrasing
  is model-agnostic, no edit needed. Convention #8 grep pre-
  checks clean: single call site at
  `src/agent/orchestrator/index.ts:73` (NOTE: line `:73`, not
  `:72` — planner's line number was stale; executor caught at
  apply time). `callClaude.ts` usage is vanilla
  `messages.create` — no prefill, no `output_format`, no
  fine-grained-tool-streaming beta header, no `effort` param.
  All four documented 4.6 breaking changes absent from our
  codebase. Target model `'claude-sonnet-4-6'` verified via
  Anthropic migration guide web search. Optional smoke test
  skipped per P[M] ruling — constant is one-line grep-
  verifiable. Convention #10 datapoint captured this sequence:
  planner's post-C5-verification message bundled C5 body + [M]
  design pass in a way that obscured the "C5 commits first"
  sequence step; executor caught the working-tree mix before
  [M] commit landed.

### [M] closeout — migrate to claude-sonnet-4-6

**Commit:** e04c579
**Scope actuals:**
- 1 source file MODIFIED (`src/agent/orchestrator/index.ts:73`;
  +1 / -1 LOC — the MODEL constant swap)
- No test added (optional smoke skipped per P[M])
- Test delta: 0 (P40 match — 385/385 held exactly)
- Master brief §5.2 step 6 intentionally not edited (Q8a Option B
  freeze-discipline applied)

**Convention #9 / #10 observations:**

1. **Zero design findings emerged at [M] design pass.** First
   Session 8 commit where pre-implementation grep came up clean
   across all checks. Two readings for the retrospective:
   - *Selection effect:* [M] is a mechanical migration; sub-brief
     drafters handle mechanical shapes better than feature work.
     The shape is constrained.
   - *Overfitting check:* planner might otherwise be pattern-
     matching "find a finding in every commit" and inflating
     minor observations. [M] having zero findings is a useful
     data point AGAINST that drift — it says finding-accumulation
     is real work, not mandatory ritual.

   Both readings worth noting in Phase 1.2 retrospective §3
   (patterns).

2. **Convention #10 meta-datapoint from the commit-sequencing
   retraction** (captured in [M] kickoff NOTE). Planner's post-
   C5-verification message bundled C5 body + [M] design pass
   without strict sequencing markers; executor's friction-journal
   anchor check caught the working-tree mix before [M] commit
   landed. Retraction cost: one message exchange. Had the mix
   landed, remediation cost would have been a squash-rewrite of
   [M] or an immediate fix-forward — significantly more expensive.

   Candidate Phase 1.3 discipline surfaced (not ratified now):
   planner messages instructing commits should end with explicit
   "STANDING BY FOR <specific thing>" markers rather than
   continuing into next-step design content in the same response.
   Worth adding to the Phase 1.2 retrospective's §7 "What I would
   do differently" section.

3. **Line-number drift in planner ruling** (`:72` vs actual
   `:73`). Executor trivially verified and applied the correct
   line. Minor Convention #9 datapoint: planner reported a line
   number without re-verifying against the file state after prior
   edits. Low-cost catch.

**Session 8 state through [M]:**

- 6 commits landed (C1 + C2 + C3 + C4 + C5 + [M])
- Test count 369 → 385 (+16 from Session 8)
- Convention #9 datapoints: 17 across 6 commits (16 at C5 + 1
  at [M] for line-number drift)
- Convention #10 datapoints: 2 explicit retractions (C5
  Finding K mid-design, [M] kickoff commit-sequencing)
- [M] post-commit smoke is founder's next action before C6 EC-2
  paid-API run

**Post-commit smoke check — PASS (2026-04-20).**

Single-turn "what's our org name" prompt round-tripped against
real Claude on the new model. All four key indicators green:

- HTTP 200 on `POST /api/agent/message` (4685ms).
- Orchestrator successfully extracted the `respondToUser` tool
  call — structured-response contract works on 4.6.
- Valid `template_id: 'agent.response.natural'` returned from
  the shipped catalog; no template-drift regression.
- Full trace chain intact: `trace_id` + `org_id` + `user_id`
  all populated in the pino log line.

Two positive observations (not Convention #9 findings; calibration
data):

- **Latency baseline captured.** First recorded 4.6 call:
  **4685ms** for a single-turn no-tool-call prompt. Sonnet 4
  baseline was ~2–3s for similar prompts; the extra latency is
  consistent with 4.6's default `effort: 'high'` behavior flagged
  in Anthropic's migration guide. Reference data for Phase 1.3
  cost/latency modeling. If C6 EC-2 (20 entries × ~5s = ~100s
  of API time) feels slow, `effort='medium'` or `'low'` is the
  first tuning lever.
- **Structural response contract works on 4.6.** The
  respondToUser tool-based enforcement from master §6.2 fires
  correctly on the new model. No structured-response code
  changes required for the migration.

No SDK deprecation warnings. No 4.6 breaking changes surfaced.
No fallback to `'claude-sonnet-4-5'` needed.

**Next commit: C6 — EC-2 paid-API gate (20 real entries +
verify-ec-2 script)**

Smoke clears the gate; C6 design pass opens next. Founder
budget acknowledgement required before C6 paid-API run begins
(Session 8 kickoff rule for paid-API commits).

- 2026-04-20 NOTE   C6 design pass gated by pre-check C6-α
  (grep-verify `callClaude.ts` emits a single pino log line
  containing `usage` fields + `trace_id` in the same record).
  Rationale: the "join by trace_id" strategy in
  `scripts/verify-ec-2.ts` depends on log lines actually
  existing. Same class of check as Convention #8 identity
  assertions. Ran the grep; FAIL.

- 2026-04-20 NOTE   **Finding M — P34 log-structure claim was
  false.** Pre-check C6-α revealed `callClaude.ts` does NOT
  emit `usage` data in any log line. The only post-success log
  (`:240-243`) is `log.debug(stop_reason)` — below production
  threshold, and lacks the `usage` field entirely. Sub-brief
  P34's assertion ("Pino logs from callClaude already record
  `usage.input_tokens` + `usage.output_tokens` per call") was
  not grep-verified at drafting time. **3rd "logging /
  observability gap" Convention #9 datapoint in consecutive
  commits** (Finding K at C5 Part 1, Finding L at C5 Part 2,
  Finding M now), confirming a named anti-pattern within the
  scaffolding-overhead sub-category: "log-shape assertion
  without grep-verification."

- 2026-04-20 NOTE   **3rd Convention #10 retraction this
  session.** Founder self-retracted the P34 log-structure
  claim verbatim on executor's grep evidence. First two:
  C5 Finding K (mid-design, planner retracted service-layer
  log claim), [M] commit-sequencing (planner retracted bundled
  commit workflow). Convention #10 is earning its keep:
  3 mid-session retractions caught at cheap points rather than
  propagating into commits.

- 2026-04-20 NOTE   C6-α scope carved per founder ruling:
  standalone commit, subject
  `chore(phase-1.2): Session 8 — add usage logging to callClaude (pre-C6 C-α gap)`.
  Source fix = add `log.info` at `:238` with `stop_reason` +
  `usage` (input_tokens, output_tokens, cache_read_input_tokens,
  cache_creation_input_tokens); remove existing
  `log.debug(stop_reason)` at `:240-243` (maintenance-trap
  cleanup — two post-success log lines at different levels
  covering overlapping fields is a known anti-pattern). ~12 LOC
  added, ~4 LOC removed, net ~+8. Re-verification smoke:
  one ~$0.02 round-trip against dev server after fix lands;
  grep + jq the captured stdout; pass criterion = single JSON
  record contains all four usage fields + trace_id. C6 is now
  2 commits (C6-α + C6 proper); sub-brief didn't budget for
  this split. Acceptable per §7 pre-check discipline. Starting
  source fix.

### C6 closeout — EC-2 paid-API verification (partial; workstream paused mid-Entry 1 for prompt-engineering O3)

**Commits:**

- `1afdae0` fix(ui): OrgSwitcher filters memberships by authenticated user (Finding O1)
- `277eff2` docs(phase-1.2): Session 8 C6 prereq O2 — org_id injection plan (Option 3a)
- `eab7f12` fix(agent): Finding O2 — orchestrator injects session.org_id for org-scoped tools (O2-v1 code)
- `23e536f` fix(dev): relocate EC-2 log capture outside the tree + gitignore /logs/ (tee-storm fix)
- `b80f5ae` docs(phase-1.2): Session 8 C6 prereq O2-v2 — pre-Zod injection + card post-fill plan (Option 2A expanded)
- `6d62d4a` fix(agent): Finding O2-v2 — pre-Zod injection for ledger tools + card post-fill (O2-v2 code)
- `e4c0312` notes(friction): Session 8 C6 closeout — O1, N8–N10, O2-v1, O2-v2, Bug A, Bug B, tee-storm, conventions (pre-amend SHA; the amend that fills in this line produces a new SHA — see commit footer)

**Workstream narrative.** Session 8 C6 EC-2 verification workstream shipped six technical commits across 2026-04-20 to 2026-04-21 — Finding O1 (OrgSwitcher RLS/user-scope drift), the O2-v1 pair (plan + code — strip `org_id` from read-tool schemas + orchestrator injection), the tee-storm infrastructure fix (relocate dev-server tee target outside the tree + gitignore `/logs/`), and the O2-v2 pair (plan + code — pre-Zod injection for ledger tools + `ProposedEntryCard` post-fill). The workstream **paused mid-paid-API Entry 1** rather than completing the 20-entry run. Cumulative paid spend today: ~$0.11 of the $5 Session 8 ceiling (halt-and-escalate threshold $3). Bug A (date hallucination) and Bug B (checkPeriod-locked panic demanding user-pasted UUIDs) are prompt-engineering carry-forward blockers deferred to a dedicated O3 design-pass session. This entry is the arc's only friction-journal write; none of the six technical commits back-reference the journal (consistent with the batch-at-closeout format convention). It also journals Findings N8, N9, N10 (from the pre-C6 EC-2 prompt set commit `cac629e`, captured in the commit body but never in the journal) alongside Finding O1 (from today's `1afdae0` — itself one of the six C6-arc technical commits, not pre-C6, but likewise commit-body-only until this entry). Per the O2-v2 plan's §7 directive to "append alongside Findings M, N8–N10, O1"; Finding M was already journaled at C6-α.

**Scope actuals:**

- 6 technical commits + 1 friction-journal commit (this one) for the C6 arc proper. Batching in the journal also covers **one additional pre-C6 commit** (`cac629e`, EC-2 prompt set + verify script + dev-seed extension) whose findings (N8, N9, N10) were captured in the commit body but unjournaled. Finding M was already journaled at C6-α (see line 4526 of this file); no re-journaling needed for M.
- Test delta across the [M]-to-C6 interval: **385 → 395 (+10 total)**. Verified from commit bodies:
  - C6-α (`7cc7ed1`) held at 385/385 — observability-only, no test added
  - REDACT_CONFIG extract (`4220d24`) held at 385/385 — pure refactor
  - CA-83 pino redaction test (`853d687`) +3 — one redact-path assertion + two canary assertions (non-empty paths list, `[REDACTED]` censor lock)
  - O2-v1 code (`eab7f12`) +1 to 389/389 — `tests/integration/agentOrgIdInjection.test.ts`
  - O2-v2 code (`6d62d4a`) +6 to 395/395 — ledger injection, `ai_actions` audit-trail, card post-fill, card-without-prior-ledger-throws, `fiscal_period_id` still required, `idempotency_key` unconditional overwrite
- Attribution: +3 CA-83 (Phase 1.1 DEFERRED #20 back-fill landed inside Session 8 calendar), +1 O2-v1 (Session 8 feature), +6 O2-v2 (Session 8 feature). Only +7 are Session-8-feature tests in the strict sense.
- `pnpm agent:validate` green at every intermediate commit and at rest: typecheck + no-hardcoded-URLs + 26/26 Category A floor
- Paid-API spend: ~$0.11 of the $5 Session 8 ceiling across two Entry 1 attempts (yesterday's O2-v1 failure, today's O2-v2 partial success). Single-call max observed: ~$0.03
- EC-2 full 20-entry run: NOT executed (blocked on Bug A + Bug B)
- O2-v2 verification split: Site 1 **paid-verified** (today's Entry 1 retry; Zod errors dropped 3→1 field, the residual being the legitimate model-owned `fiscal_period_id`); Site 2 **code-verified only, NOT paid-verified** (today's run terminated before card construction)
- DB state at pause: `agent_sessions` and `ai_actions` preserved for the C11 retrospective; do NOT run `pnpm db:reset:clean` until the next paid run is explicitly ready
- Forensic logs retained outside the tree at `~/chounting-logs/ec-2-run-20260421T201938Z.log` (yesterday's O2-v1 failure evidence) and `~/chounting-logs/ec-2-run-20260421T232045Z.log` (today's O2-v2 partial-success evidence)

**Convention #9 datapoints (10 this commit, bringing Session 8 total to 28):**

1. **Finding O1 — OrgSwitcher memberships query relied on RLS for user-scoping that RLS deliberately does not enforce.** The dropdown showed incorrect role labels for controllers. Root cause: the client-side memberships query used RLS alone to scope to the authenticated user, but RLS was designed to allow controllers cross-user visibility into orgs they control (an admin-surface affordance). The `org_id`-keyed dedup then rendered whichever row Postgres returned first. Fix at `1afdae0`: add `.eq('user_id', user.id)` client-side, mirroring the pattern already used at the sign-in page. UI-label bug only — agent orchestrator persona resolution via `getMembership()` was always correct (service-role, explicit `user_id` filter). No security impact. **Sub-category:** code-reality / RLS-intent drift. The UI code author assumed RLS was a user-scoping mechanism; RLS is actually an access-control mechanism whose scoping varies by role. Forcing function: paid-run halted yesterday on fatigue + retraction-accumulation grounds (see **Operational observation** below); today's diagnostic revealed the bug. The same halt pattern fired again today on Entry 1's retry, now cataloged as Option X — two halts, one pattern, same session.

2. **Finding N8 — Sonnet 4.6 has four pricing rails, not two.** Surfaced during the EC-2 prompt set + verification script drafting (commit `cac629e`). Sonnet 4.6's pricing model includes four rails: base input, base output, cache creation, cache read. The prior mental model (and the sub-brief's cost-rollup sketch) assumed two rails only. The verify-ec-2 script implements full four-rail math for forward compatibility; today's run hits only two rails because orchestrator doesn't enable caching yet (see Finding N9). **Sub-category:** sub-brief under-models the external API's pricing surface. Caught at the script-drafting stage, before any paid spend against the incorrect math. **Primary-source note:** `cac629e`'s commit body labeled these together as "Finding N8/N9"; the journal splits them because N8 is a fact about Anthropic's external pricing surface while N9 is a fact about our implementation — independently citable (if N8 is wrong, N9 may still hold, and vice versa).

3. **Finding N9 — orchestrator does not set `cache_control` on Anthropic API calls, so cache rails evaluate to 0.** Companion to N8. The four-rail math in verify-ec-2 is forward-compatible, but the current orchestrator doesn't emit the cache-control headers Anthropic requires to activate cache creation or cache read billing. Consequence: today's EC-2 cost rollup attributes 100% of spend to base input + base output rails. No bug per se — caching is a Phase 1.3 feature explicitly deferred — but the prompt-builder architecture (`buildSystemPrompt`, persona sections, `_identityAndTools`, `orgContextSummary`) is cache-friendly in shape (stable prefix, per-turn suffix) and would benefit from a cache-control pass whenever Phase 1.3 opens. **Sub-category:** deferred feature with stable architectural precondition — flag for Phase 1.3 roadmap.

4. **Finding N10 — EC-2 frozen prompt set required accounts not in the Real Estate CoA template.** Surfaced during EC-2 prompt set drafting. The frozen 20-prompt set needs accounts for AR, consulting revenue, prepaid insurance, payroll withholdings (federal tax, CPP, EI), GST/PST, equipment, equipment-loan, intangibles, accumulated depreciation, accumulated amortization — most of which were absent from the Real Estate-flavored dev-seed CoA. **Fix at `cac629e`:** targeted dev-seed extension (31 additional accounts in `src/db/seed/dev.sql` section 3b; idempotent via `ON CONFLICT DO NOTHING`), not a migration. **Carry-forward to Phase 1.3+:** three roadmap items the founder flagged at discovery — (i) more industry CoA templates beyond Real Estate, (ii) CoA customization UX (add/edit/delete accounts post-onboarding), (iii) quick-start→customize flow. **Sub-category:** onboarding assumption (Real Estate as default template) wasn't load-tested against the breadth of realistic journal entries. The dev-seed workaround carries today; the roadmap items carry forward.

5. **Finding O2-v1 — convention asserted in one place, partially applied at call sites.** The architectural rule "UUIDs flow through tool input, not the prompt body" was asserted at `_identityAndTools.ts:30-32` and `orgContextSummary.ts:8-13`, and correctly implemented for `updateUserProfile` and `updateOrgProfile`. But the three read tools (`listChartOfAccounts`, `checkPeriod`, `listJournalEntries`) still required `org_id` in their Zod schemas, and the ledger tools (`postJournalEntry`, `reverseJournalEntry`) reused shared service schemas requiring `org_id` + `idempotency_key`. Ratified fix at `eab7f12` (Option 3a): strip `org_id` from read-tool schemas, orchestrator injects `session.org_id` at service-call time; leave ledger schemas unchanged (shared with `/api/agent/confirm` and `/api/agent/reject`) and overwrite inside `executeTool` before the `ai_actions` write. Null-org guard rejects with a loud error across all five org-scoped tools. **New Convention #9 sub-category proposed for C9 codification:** "convention asserted in one place, partially applied at call sites." Distinct from under-specification (the convention was fully spelled out) and from scaffolding overhead (the convention's adoption was incomplete, not invisible at source-read time).

6. **Finding O2-v2 Site 1 — spec assumption about model output untested against real model.** O2-v1's plan Part 2 asserted: "Zod validation still passes (model emits some UUID, Zod accepts any valid UUID, orchestrator overwrites with the real one)." Paid-API Entry 1 retry (yesterday) proved the assumption wrong: the model emitted empty strings (not guess-UUIDs) for `org_id`, `fiscal_period_id`, and `idempotency_key`. Zod rejected at the main-loop boundary; `executeTool` never ran; O2-v1's overwrite (inside `executeTool`) was unreachable. Site 1 fix at `6d62d4a`: pre-Zod injection for `postJournalEntry` and `reverseJournalEntry` between `toolByName.get` lookup and `def.zodSchema.safeParse`. Unconditional overwrite (not `??=`) — empty-string emissions would survive a conditional merge and fail Zod regardless. `fiscal_period_id` stays model-owned (depends on `entry_date` via `checkPeriod`). **Paid-verified in today's Entry 1 retry** (`~/chounting-logs/ec-2-run-20260421T232045Z.log`): Zod errors dropped from 3 fields to 1 field (residual `fiscal_period_id` is the legitimate model-owned path that Bug A/B ultimately derailed). **New Convention #9 sub-category proposed for C9 codification:** "spec assumption about model output untested against real model." First instance in the session. Distinct from Finding O2-v1's class (convention-partial-application) — this is a class of spec assertion that only a paid-API forcing function can falsify.

7. **Finding O2-v2 Site 2 — card post-fill shipped in code, untested in paid-API.** `ProposedEntryCardSchema` requires four UUIDs (`org_id`, `idempotency_key`, `trace_id`, `dry_run_entry_id`); the model has no legitimate source for three of them. Fix at `6d62d4a`: schema split (new `ProposedEntryCardInputSchema` omits the three model-unowned UUIDs; strict output schema unchanged for client consumers) + post-fill in the `respondToUser` success path using a `handleUserMessage`-scoped `lastLedgerIdempotencyKey` passed from Site 1, with `AGENT_TOOL_VALIDATION_FAILED` thrown if a card is emitted without a prior successful ledger call this turn. Mechanism details are in `docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md` §4 — the journal captures the decision, not the implementation. Six regression tests pass. **Paid-API verification deferred** — today's Entry 1 retry terminated at Bug A/B before card construction. Same Convention #9 sub-category as Finding #6 (spec-vs-model drift) but different axis: Site 2 is untested in paid-API because the upstream bug chain prevented reaching it, not because the spec assumption was falsified. **Carry-forward:** next Entry 1 retry post-A+B fixes is the paid-verification event. Until then, Site 2 rests on six regression tests only.

8. **Bug A — agent date hallucination (prompt-engineering gap).** For "this month" with `today = 2026-04-21`, the agent picked April 2025 instead of April 2026 — observed in both paid-API Entry 1 attempts. Not an O2-v2 regression; pre-existing. The system prompt does not inject the current date into any context block. Consequence: `checkPeriod` called with `entry_date = 2025-04-01` → `periodService.isOpen` returns `is_open = false` because the 2025 period is correctly locked → agent enters Bug B failure mode. **Fix candidate (deferred to O3 session):** inject current date into `buildSystemPrompt` via a new context block or `orgContextSummary` augmentation. **Convention #9 sub-category candidate:** "prompt-engineering gap — sub-brief assumed model has context the system prompt does not inject." Same class as Finding O2-v1 (convention partial application) but at the prompt layer instead of the tool-input layer. Blocking for EC-2 full 20-entry run.

9. **Bug B — checkPeriod-locked panic violates UUIDs-never-in-chat premise.** When `checkPeriod` returns `is_open = false` (correct server behavior for a prior-year period), the agent fabricates a "no prior journal entries to reference" justification and asks the user to paste a UUID into the chat. Net-new today. Violates the entire architectural premise of O2 / O2-v2 — users never see or supply UUIDs. **Fix candidate (deferred to O3 session):** add period-locked-recovery instruction to the system prompt (e.g., "if `checkPeriod` returns `is_open = false`, the period is closed for posting; retry `checkPeriod` with the current year"). Same prompt-engineering class as Bug A but distinct failure mode: Bug A is missing factual context, Bug B is missing procedural recovery. Blocking for EC-2 full 20-entry run.

10. **Finding O2-v2-meta (tee-storm) — planner-authored infrastructure caused the environment defect it later spent days debugging.** The EC-2 prereq at `docs/07_governance/ec-2-prompt-set.md` documented `pnpm dev 2>&1 | tee "logs/ec-2-run-${TS}.log"`. `logs/` was never in `.gitignore`; Next.js's dev-server file watcher respects `.gitignore`. Every `Compiled-in-Xms` stdout line teed into `logs/`; watcher saw a file change; triggered a recompile; wrote another stdout line; storm. Observed effects across two days of debugging: intermittent sign-in failures (Fast Refresh disruption masked by the storm), `JSON.parse: Unexpected end of JSON input` crashes (watcher reading manifests mid-write), a 1.2MB log file from a single 574-module recompile cycle, negative `-ms` timestamps from overlapping cycles, and stale-render compounding of the OrgSwitcher fix at `1afdae0`. Diagnosed by external review, fixed at `23e536f` (`/logs/` gitignored + tee target relocated to `/tmp/`; non-forensic logs deleted; forensic logs retained at `~/chounting-logs/`). **New Convention #9 sub-category proposed for C9 codification:** "planner-authored infrastructure caused the environment defect it later spent days debugging." Distinct from under-specification (the prereq was fully specified as written — that's the point); distinct from scaffolding overhead (this wasn't a runtime invisible gap — the infrastructure was authored, not inherited). Name-axis: **actively caused, not merely unmodeled.** The meta-flavor (infrastructure author debugged their own trap for two days without recognizing the author-role) is the distinguishing signal that makes this worth its own sub-category rather than folding into under-specification.

**Convention #10 datapoints (4 this commit, bringing Session 8 total to 9 — reconciled from primary sources):**

The running counts in commit bodies drifted. Reconciled here from `cac629e`'s pre-today cumulative ("Five Convention #10 retractions in Session 8 cumulative (C5 Finding K, [M] sequencing, P34 log-shape, Entry 3 BC tax math, Entry 5 BC tax math)") plus each today-commit's body, in chronological order:

- **Retraction 6 — OrgSwitcher "executive-session produces different experiment" claim** (commit body `1afdae0`, 11:03 UTC-07). Planner claim that running the paid run against an executive-persona session would produce a different experimental outcome from the controller session. Wrong — persona resolution is server-side per-request via `getMembership()`, not from UI state. Caught during today's OrgSwitcher diagnostic; cost: one diagnostic exchange. Commit body correctly numbered this "6th in Session 8" (pre-today cumulative was 5).

- **Retraction 7 — O2 brief "locally optimal, globally breaks downstream invariant" framing** (commit body `eab7f12`, 12:03 UTC-07). The original O2 finding was framed as a local-vs-global invariant tradeoff; investigation revealed the convention was already in place and half-implemented, so the framing is better stated as "convention asserted in one place, partially applied at call sites." Under-specified framing corrected before any code was written. **Numbering drift — this commit body labels the retraction "6th this session" but that slot was already occupied by Retraction 6 (OrgSwitcher, same day, one hour earlier). The true slot is 7th.** Two commits authored close in time each incremented from their local view of the running total without cross-reconciling. Low-value to fix at commit time; reconciled here. **Candidate Convention #9 meta-datapoint for C9 codification:** "running-count drift across parallel commits — each commit body increments from its own local view; reconciliation happens at friction-journal batch."

- **Retraction 8 — O2-v1 plan Part 2 "guess-UUID" assumption** (commit bodies `b80f5ae` + `6d62d4a`, 13:59 + 14:12 UTC-07). Planner asserted: "Zod validation still passes (model emits some UUID, Zod accepts any valid UUID, orchestrator overwrites with the real one)." Paid-API evidence (`~/chounting-logs/ec-2-run-20260421T201938Z.log:2474`) showed empty-string emissions, not guess-UUIDs. Retracted during the O2-v2 design pass. Cost: the O2-v2 plan itself (one design pass + one implementation commit) — which would have been avoidable had O2-v1 been paid-verified before shipping. But cheaper than the alternative: discovering the gap deeper in the EC-2 run, potentially after multiple Entry 1 retries. **Numbering drift — both commit bodies label this "7th this session" because they counted from "6th = OrgSwitcher" and skipped Retraction 7 (O2 brief framing) in their running total. The true slot is 8th.**

- **Retraction 9 — "clean sequence" Entry 1 retry prediction.** Planner predicted a clean end-to-end sequence for the post-O2-v2 Entry 1 retry. Observed: Site 1 passed cleanly, Site 2 was never reached because Bug A fired, Bug B fabricated a UUID-paste demand. Retraction captured in this closeout rather than a separate exchange. Convention #10 is doing its work — each retraction is calibration signal for the planner's future predictions. This is the 9th retraction, not the 8th as running counts through today had implied.

**Net correction to the running tally.** Session 8 Convention #10 total through C6 is **9**, not 8. The one-retraction drift is itself a datapoint (noted as candidate meta-datapoint in Retraction 7). Two parallel commits each self-numbered "6th" because they each incremented from pre-today = 5 without knowledge of the other's retraction. Later commits (b80f5ae, 6d62d4a) counted from the "6th = OrgSwitcher" anchor and skipped the brief-framing retraction. The journal entry is the reconciliation point.

**Operational observation — Option X halt decision (positive-discipline exemplar).** Today's halt after Entry 1's partial-success retry is worth preserving as an exemplar, not a gap. Planner chose Option X (halt the paid run, batch findings to C6 closeout, defer Bug A + Bug B to a dedicated O3 design session) over Option Z ("let's just patch A + B inline and try Entry 1 one more time"). Two **independent** signals drove the decision, and preserving both matters because future sessions may fire on either signal first:

1. **Fatigue pattern-match (emotional signal).** Two Convention #10 retractions inside the same paid-API attempt (Retraction 8 and Retraction 9 above), plus the tee-storm meta-finding still fresh from two days of diagnosis, plus 9 retractions cumulative this session — the surface for "let's just fix one more thing" was high. Halting protects against the accumulated-retraction-debt class of mistake where a tired planner bundles a poorly-scoped fix into a commit that has to be unwound by the next session.

2. **Bundling independent proofs into one retry (epistemic signal).** Bug A (date-context injection) and Bug B (period-locked recovery instruction) are both prompt-engineering fixes to `buildSystemPrompt`. If both ship in one commit and the next Entry 1 retry fails, the failure mode is ambiguous: is the date fix wrong, is the recovery instruction wrong, or is there a third bug lurking? A dedicated O3 session that scopes A + B with separate tests and a design pass keeps each fix's failure mode attributable. This stands on its own merit — the fatigue signal alone would have sufficed to halt, but the epistemic argument is the stronger of the two independently.

Preserving both exemplars means the next-session planner has two invocation points. If fatigue fires first ("I'm two retractions deep, should I keep going?"), invoke signal 1. If epistemic fires first ("this fix is coupled to an uninvestigated second bug"), invoke signal 2. **Sibling to Convention #10:** retractions catch bad planner outputs post-hoc; the halt discipline catches bad planner trajectories pre-hoc. Same practice, different timescales.

**Deferred to C9 codification:**

- Whether the halt discipline earns a dedicated Convention number or remains an operational-observation slot inside Convention #10's orbit. Design question about the conventions taxonomy, not an observation; pulled out here as a trackable C9 input rather than buried in the observation body.
- Four new Convention #9 sub-categories proposed in this entry: (i) convention-asserted-in-one-place-partially-applied-at-call-sites, (ii) spec-assumption-about-model-output-untested-against-real-model, (iii) planner-authored-infrastructure-caused-environmental-defect, (iv) prompt-engineering-gap-sub-brief-assumed-model-has-context-system-prompt-does-not-inject. C9 renames are free; the descriptive names land here.
- Candidate meta-sub-category "running-count drift across parallel commits" (from Retraction 7's reconciliation) — deciding whether this is a Convention #9 datapoint, a Convention #10 cousin, or process overhead that doesn't need a convention.
- Layer-by-layer attribution-masking pattern (see Cross-commit pattern observation below) — descriptive name "attribution-masking in layered forcing functions" proposed; C9 picks the final taxonomy.

**Cross-commit pattern observation — layer-by-layer bug revelation in deeply-integrated LLM systems.** The C6 arc's six technical commits demonstrated an anti-pattern worth naming. Each layer fix exposed the next: each forcing-function run attributes failures to the first-failing layer, masking later-layer bugs until each earlier layer is fixed. The driver: the integration surface (prompt ↔ tool-input ↔ service ↔ RLS ↔ DB) has five layers, and a forcing function that exercises the full surface (paid-API) cannot attribute failures to a specific layer without first fixing all earlier-layer bugs. Concrete instances from this arc are in Findings #6, #7, and #8 — no need to re-enumerate here. **Candidate Convention #9 sub-category for C9 codification:** "attribution-masking in layered forcing functions." The operational implication is that paid-API spend per forcing-function run scales with the number of layer-bugs remaining — each fix costs at least one retry to surface the next layer's bug.

**Carry-forward:**

- **Bug A (date hallucination)** — dedicated O3 design-pass session. Touches `src/agent/orchestrator/buildSystemPrompt.ts`, likely `orgContextSummary` augmentation. Suggested scope: new brief at `docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md`, spec pass, implementation, regression tests, then retry Entry 1 from a fresh DB reset.
- **Bug B (period-locked recovery instruction)** — paired with Bug A in the same O3 session because both are prompt-engineering fixes to the same file and both must land before a clean Entry 1 retry can attribute failures correctly (per the cross-commit pattern observation above).
- **O2-v2 Site 2 paid-API verification** — the next Entry 1 retry post-A+B fixes is the paid-verification event. Until then, Site 2 rests on six regression tests and has not been exercised end-to-end against a real model emission.
- **EC-2 full 20-entry run** — gated on Bug A + Bug B + Site 2 paid-verification. Approximate remaining budget: $5 ceiling minus ~$0.11 spent = ~$4.89 headroom; expected full-run spend $0.30–$0.80 per the prereq's P34 estimate.
- **Phase 1.3+ CoA roadmap (from Finding N10)** — three items flagged at discovery: (i) more industry CoA templates beyond Real Estate, (ii) CoA customization UX (add/edit/delete accounts post-onboarding), (iii) quick-start→customize flow. Not a Session 8 blocker; carry forward to Phase 1.3 planning.
- **Phase 1.3+ caching enablement (from Finding N9)** — prompt-builder architecture is cache-friendly in shape; activating Anthropic cache-control headers would light up the currently-zero cache rails identified by Finding N8. Not a Session 8 blocker; informational for Phase 1.3 cost/latency modeling.
- **C7–C12 Session 8 remainder** — EC-13 adversarial (C7), Mode B fix (C8), Convention codification (C9), 27-EC matrix (C10), Phase 1.2 retrospective (C11), session closeout (C12). Not blocked by anything in C6 directly but benefit from C6 findings being journaled first — the C9 codification pass in particular has four new sub-category proposals + one meta-sub-category from this entry to ratify or fold.

**Session 8 state through C6:**

- Commits landed Session 8: **18 total** counting commits that land Session 8 workstream content. Breakdown: 6 (C1–[M]) + 5 (C6-α `7cc7ed1`, REDACT_CONFIG extract `4220d24`, CA-83 test `853d687`, CA-83 TODO `e0e6052`, EC-2 prompt set + dev-seed extension + verify-ec-2 script folded into `cac629e`) + 6 (today's C6 arc technical commits: `1afdae0`, `277eff2`, `eab7f12`, `23e536f`, `b80f5ae`, `6d62d4a`) + 1 (this closeout) = 18. **Excludes:** `4bbeb1d` (Phase 1.1 control-foundations brief — docs-only Phase 1.1 work landed in the Session 8 calendar window as scope-adjacent cleanup) and `1001818` (External CTO Architecture Review ADR-0008 — peer-level workstream with its own journal section at line 4568, landed in Session 8 calendar but not part of Session 8 execution). **Includes:** `4220d24`/`853d687`/`e0e6052` (CA-83 pino redaction back-fill from Phase 1.1 DEFERRED #20, landed inside Session 8 as a prereq for C6 observability — workstream-relevant even though the exit-criteria lineage is Phase 1.1). Calendar-presence vs. workstream-membership is a judgment call at the edge; this convention errs toward workstream content. Anchor: Session 8 opened at 5e094bb.
- Test count: 385 → 395 (+10 across the [M]-to-C6 interval; +7 Session 8 feature tests, +3 Phase 1.1 DEFERRED #20 back-fill for CA-83 pino redaction). Verified against commit-body test-count statements, not derived.
- Convention #9 datapoints: **28 through C6 closeout** (17 at [M] per line 4472 anchor + 1 at C6-α for Finding M + 10 new in this closeout: O1, N8, N9, N10, O2-v1, O2-v2 Site 1, O2-v2 Site 2, Bug A, Bug B, O2-v2-meta). Four new sub-categories proposed in this entry alone (see Deferred to C9 codification above).
- Convention #10 datapoints: **9 explicit retractions this session** (5 through `cac629e` pre-today: C5 Finding K, [M] kickoff, P34 log-shape, Entry 3 BC tax math, Entry 5 BC tax math; 4 today: OrgSwitcher, O2-v1 brief framing, O2-v1 Part 2 guess-UUID, clean-sequence Entry 1 prediction). Convention #10 is doing its best work on C6 — 4 retractions in a single arc, each caught mid-arc rather than post-commit; the running-count drift among today's commits is itself a datapoint (see Retraction 7).
- Paid-API spend: ~$0.11 of $5 Session 8 ceiling. Single-call max observed: ~$0.03. Halt threshold: $3.
- Next action (gated on founder approval): dedicated O3 design-pass session for Bug A + Bug B. No paid-API spend in that session until Entry 1 retry is ready against a fresh DB reset.

---

## External CTO Architecture Review (2026-04-21)

A multi-round exchange with an external CTO compared chounting
against LedgerSMB (a 15+-year-old Perl/Postgres accounting ERP)
and then against the external CTO's independent framing of
"best standard accounting software practice." The cycle
produced actionable refinements to the truth model, the
architecture doc, and the Phase 2 priority ordering. This
entry records the cycle for future reference so the next round
of Phase 2 planning references a stable baseline.

### A. What was reviewed

- **The LedgerSMB base schema** (tables: `lsmb_module`,
  `account_heading`, `account`, `journal_entry`, `journal_line`,
  `ar`, `ap`, `gl`, `acc_trans`, `voucher`, `batch`, `yearend`,
  payroll module, entity/contact model, fixed assets, etc.).
  Mature, broad, mid-refactor in production for years (both
  `acc_trans` and `journal_line` coexist).
- **16 LedgerSMB audit queries** — one per invariant, stored as
  markdown files with yaml frontmatter. Confirmed the enforcement
  model: detect violations periodically, not prevent at commit.
- **LedgerSMB reporting code** (`trial_balance__generate`,
  `ar_ap__transaction_search`, `credit_limit__used`) plus a
  commented-out `AP_simple_post` PL/pgSQL function labeled "first
  attempt to mimic AA.pm, sub post_transaction." Confirmed that
  balance is checked inside the posting function after the fact
  (`PERFORM trans_id ... HAVING sum(amount) <> 0; IF FOUND THEN
  RAISE EXCEPTION 'Out of balance'`), not by CHECK constraint.
- **External CTO review writeup** of the initial comparison.
  Endorsed chounting's core design; sharpened the framing around
  Model A vs. Model B; corrected the "checkpointing is a
  performance concern" characterization; introduced the
  three-enforcement-modes taxonomy.

### B. Load-bearing conclusions from the cycle

1. **chounting is building Model B (modern ledger
   infrastructure, Stripe-shape).** LedgerSMB is Model A
   (traditional ERP). Production target is the Hybrid: Model B
   core + Model A domain modules + reporting layer. The gap list
   relative to LedgerSMB is not "chounting is missing rigor" —
   it is "Model A modules have not yet been layered on the Model
   B core." Reframing reduces the gap list from alarming to
   planned.
2. **Checkpointing is accounting correctness, not just
   performance.** Opening balance for period N is definitionally
   the closing balance for period N−1. "What did the books say
   on date X, as seen from date Y" is an audit question that
   requires persisted snapshots. The earlier framing ("needed at
   scale to avoid full-table scans") underweighted this; the
   external CTO's correction is the right frame. Recorded as
   INV-CHECKPOINT-001 in the "Phase 2 Reserved Invariants"
   subsection of `ledger_truth_model.md` with Layer 1b
   classification (scheduled audit — synchronous enforcement
   would require O(n) re-aggregation per journal-line insert).
3. **Not every invariant can be feasibly enforced
   synchronously.** Cross-aggregate sums, subsidiary-ledger
   control-account tie-outs, checkpoint-vs-ledger equality,
   bank-rec sum matching — all involve relating two aggregates
   across tables, and a synchronous trigger is the prohibitive-
   cost pattern. The external CTO's three-mode taxonomy
   (commit-time / write-time higher-level / scheduled-audit) is
   sharper than the earlier "audit-category tier" sketch.
   Formalized as the Layer 1a / Layer 1b split in ADR-0008,
   with the authority-gradient semantics unchanged (both
   sub-layers are physical and independent of services; they
   differ in latency, not in rigor).
4. **LedgerSMB is not architecturally "wrong" — it reflects
   older tradeoffs.** Human operators controlled every posting
   through a restricted UI, SQL access was privileged, and
   systems were single-tenant. The detect-after-write model was
   sound under those assumptions. chounting solves a different
   problem class — APIs, agents, concurrency, multi-tenant —
   which requires prevent-at-write for the invariants that can
   be enforced that way. The external CTO flagged this nuance,
   and future review writeups should preserve it to avoid
   dismissive framing of legacy systems built to different
   assumptions.

### C. One place pushed back on the external CTO

The external CTO's Tier 1 ordering placed **journal taxonomy**
(`journal_type` — Sales / Purchases / Receipts / etc.) alongside
checkpointing, purpose tagging, and source↔JE linkage. Pushed
back: `journal_type` is UX / report-slicing convenience, not
load-bearing. It can land later as a derived column with zero
migration pain, and putting it in Tier 1 reflects a
human-operator-first mental model that agent-first systems do
not share. Demoted to Tier 2 in the revised ordering.

What was added to Tier 1 in its place: **multi-stage approval
state machine.** Today `ai_actions.status` is a single-entry
chain (pending → confirmed/rejected/auto_posted/stale). That
works for one-shot agent proposals. It does not work for the
first workflow that needs second-person approval (separation
of duties), scheduled posting (approved-but-not-yet-posted), or
post-amendment re-review. For an agent-first system, the state
machine matters earlier than a journal-type label does.

### D. One invariant class the external CTO underweighted

Row-level source↔JE linkage ("every posted bill has a JE") was
flagged as Tier 1, correctly. But the more load-bearing
monthly-close invariant is the **aggregate tie-out**:

> `SUM(open AP subsidiary balances) = AP control-account GL balance`

Row linkage can hold while aggregates drift — a stuck reversal
not posted to the control account, an FX revaluation gap that
updated one side only, a partially-reversed entry whose
subsidiary row wasn't updated. Named `INV-SUBLEDGER-TIEOUT-001`
in the Phase 2 stubs, classified Layer 1b (scheduled audit
before period close). Row linkage is `INV-SUBLEDGER-LINK-001`,
Layer 1a. Both needed; separate INV-IDs so Phase 2 doesn't
conflate them.

### E. Revised Phase 2 priority ordering

Incorporating the external CTO's input, the pushback on
`journal_type`, and the aggregate-tie-out addition:

1. **Checkpointing / period-boundary balances** — both
   accounting correctness (external CTO's point) and performance.
2. **Account purpose tagging** (`account_link`-style lookup) —
   needed by the first agent tool that posts AR/AP; without
   it, "the AR control account for org X" is hard-coded or
   fragile-inferred.
3. **Source↔JE linkage (INV-SUBLEDGER-LINK-001) + subsidiary
   tie-out (INV-SUBLEDGER-TIEOUT-001)** — the pair, not just the
   first. Row linkage is necessary; aggregate tie-out is the
   month-end guarantee. Layer 1a and Layer 1b respectively.
4. **Multi-stage approval state machine** — replaces ad-hoc
   `ai_actions.status` with a reusable model.
5. **Layer 1a / Layer 1b split in `ledger_truth_model.md` +
   Model A/B paragraph in `system_overview.md`** — documentation
   only, cheap, landed in this commit cycle (ADR-0008). Sets the
   framework the above four items reference.
6. Journal taxonomy (`journal_type`) — later, UX / reporting.
7. Effective-date / accrual model — when first accrual workflow
   arrives.
8. Batch / voucher abstraction — when first bulk import or
   payment-run workflow arrives.
9. Dimensions (cost centers / projects) — customer-driven.
10. Year-end closing model — when first org crosses a full
    fiscal year.
11. Currencies lookup table + FK — cheap data-integrity cleanup;
    deferred from this cycle on the "no customer driving it"
    principle.

### F. What landed in this commit

Documentation only (writing-plans ceremony deliberately skipped
because the work is pure markdown edits):

- **`docs/07_governance/adr/0008-layer-1-enforcement-modes.md`** —
  new ADR formalizing the Layer 1a / Layer 1b split. Authority
  gradient semantics unchanged; sub-layer distinction is about
  evaluation latency (commit-time prevention vs. scheduled
  detection), not about rigor. Includes the three tests for
  classifying a new invariant as 1a or 1b, and the four
  alternatives considered with each alternative's architectural
  cost named.
- **`docs/07_governance/adr/README.md`** — ADR-0008 added to the
  index table.
- **`docs/02_specs/ledger_truth_model.md`** — Authority Gradient
  table split into Layer 1a and Layer 1b rows; new "Why Layer 1
  has two sub-layers" paragraph explaining the split in prose;
  new "Phase 2 Reserved Invariants" subsection at the end of
  Layer 1 with three stubs (INV-CHECKPOINT-001 as 1b,
  INV-SUBLEDGER-LINK-001 as 1a, INV-SUBLEDGER-TIEOUT-001 as
  1b) documenting the planned rule, the enforcement-mode
  rationale, and the Phase 2 home; summary section updated to
  label the 11 Phase 1.1 invariants as Layer 1a and to
  acknowledge the 1b category with zero Phase 1.1 members.
- **`docs/03_architecture/system_overview.md`** — new "Model
  Context — Ledger Infrastructure vs. ERP" section at the top
  explaining Model A / Model B / Hybrid, positioning chounting
  as Model B core on a Hybrid trajectory, and giving the
  three-category lens (core hardening / domain modules /
  reporting layer) for reading the Phase 2 backlog.
- **`docs/02_specs/glossary.md`** — Layer 1 entry updated to
  name the 1a/1b split so a glossary reader finds the
  sub-layers without first reading `ledger_truth_model.md`.
- **`docs/06_audit/control_matrix.md`** — Layer 1 section
  heading updated to "Layer 1a" with a note that all 11 current
  invariants are 1a per ADR-0008 and that Phase 1.1 has zero
  Layer 1b members.
- **This friction-journal entry.**

### G. What was deferred

- **Currencies lookup table and FK from
  `organizations.functional_currency` / `journal_lines.currency`.**
  External CTO Tier 3. Correct work; not tied to this cycle. No
  customer is currently driving it — every org defaults to CAD —
  and deferring forces better design when the first
  multi-currency customer arrives (what historical-rate table
  accompanies it? what ISO source?). Tracked at item 11 in the
  revised Phase 2 ordering above.
- **Implementation of any Phase 2 invariant.** The three stubs
  in the truth model reserve names and enforcement modes; the
  schema objects they reference (`account_checkpoint`,
  subsidiary-ledger status fields, control-account mapping)
  remain Phase 2 work. This cycle is framework-only.
- **Multi-stage approval state machine design.** Elevated to
  Tier 1 in the priority ordering but not designed here.
  Requires its own brainstorming / spec cycle before
  implementation.
- **ADR-0008+ on the writing-plans ceremony exception.** The
  decision to skip writing-plans for pure-doc work (no tests, no
  code) is worth codifying as a convention or an ADR eventually,
  but doing so here would widen scope beyond the review
  response. Deferred as a candidate convention; current
  discipline is "use the TDD-shaped plan skill for TDD-shaped
  work; use direct doc edits for documentation."

### H. Lessons for the next review cycle

1. **Don't frame performance and correctness as separate
   concerns when they overlap.** Checkpointing was initially
   presented as "needed at scale to avoid full-table scans";
   the external CTO correctly pointed out that opening balances
   *are* the correctness concern. Framing determines priority.
   Correctness framings get Tier 1; performance framings often
   don't. Next review: start with the correctness framing if
   one exists.
2. **Audit-scan patterns deserve structural representation, not
   metadata tags.** Earlier framing proposed tagging each
   invariant with `enforcement_mode: synchronous | audit`;
   ADR-0008 rejects that and takes the structural-split path.
   The distinction is load-bearing enough that a contributor
   skimming for "what Layer 1 invariants exist" must see the
   mode in the section title, not as metadata inside the leaf.
3. **Review responses should be shipped as packages.** Landing
   these three doc updates as one commit produces a single
   coherent response to the review; splitting into three PRs
   would have added review overhead without content value.
   Documentation is cheaper to ship than code, and the review
   response benefits from being a single artifact.

## Phase A — invariant-doc consolidation (2026-04-21)

Phase A of the Phase 1.x execution cycle consolidated the
invariant-documentation framework introduced by ADR-0008:
service-layer UNBALANCED backstop (Prompt 1) and INV-AUDIT-002
audit_log append-only enforcement (Prompt 2). Three doc-only
lessons surfaced during execution; each gets its own
subsection below.

### A. Drafter-side Spec-to-Implementation Verification failure (Prompt 3 before_state convention) — 2026-04-21

Drafting Prompt 3 (doc-only codification of the `before_state`
capture convention into the INV-AUDIT-001 leaf), the drafter
framed the convention as new — "no current call site populates
`before_state`" and "`periodService.lock` / `unlock` will be
the first real exercise." Both claims were wrong. Phase 1.5A
(2026-04-15) introduced the convention across six service
files (`orgService`, `addressService`, `membershipService`,
`invitationService`, `userProfileService`,
`agent/orchestrator/loadOrCreateSession`), with three
integration tests (`addressServiceAudit.test.ts`,
`userProfileAudit.test.ts`,
`agentSessionOrgSwitchAudit.test.ts`) and a contributor-facing
entry at `docs/04_engineering/conventions.md:190`.

Executor caught at the Step 2 gate via
`grep -rn "recordMutation" src/`. A five-second check at
drafting time would have prevented five paragraphs of wrong
framing.

Minor secondary drift in the same draft: the proposed DELETE
bullet cited `addressService.ts:287, 332, 340` for "address
removal"; verification showed only line 287 is DELETE
(`removeAddress`), while 332 and 340 are UPDATE sites inside
`setPrimaryAddress`. Trimmed to `:287` at the Step 2 gate.
The paragraph about not making stale citations contained a
stale citation — the same class of error at a second layer,
which is itself a useful datapoint about how drafter memory
compounds.

Class: same as the Phase 1.2 Session 2 "Cited-Code
Verification" and Session 6 "identity assertion" datapoints —
narratively correct, contractually wrong against the actual
codebase. The drafter's goal (surface the convention in the
authoritative leaf) survived the correction; only the framing
("first implementation site") drifted.

**Refinement to Spec-to-Implementation Verification
convention.** The existing five-category list (numeric claims,
literal values, list elements, structural references,
identity assertions) covers facts about the shipped code but
doesn't explicitly cover *temporal* claims. Sixth category
added in this commit: **temporal claims** — any assertion
that code is "new," "first," "not yet implemented," "the only
current X," or similar. Verify via grep against the shipped
codebase, not against a mental model of a prior phase.
Codebase state drifts faster than drafter memory updates. See
`docs/04_engineering/conventions.md` "Spec-to-Implementation
Verification" section for the full list and the matching
Refinement datapoint paragraph.

## Phase B — concurrent-session coordination (2026-04-22)

Phase B of the Phase 1.x execution cycle surfaced an
operational pattern prior phases had not: two Claude Code
sessions working the same repo under the same git identity
without coordination. Three subsections follow — the headline
incident, an earlier datapoint retrospectively reinterpreted,
and one prompt-side drift that amended cleanly.

### A. Parallel Claude Code sessions interleaved commits on the same branch (O3 Phase C discovery) — 2026-04-22

Two Claude Code sessions ran concurrently on the same
workstation, on branch `staging`, authoring commits as the
same git identity (`champagne-papa`). One executed the O3
prompt-engineering workstream (Sites 1 and 2 — temporal
context injection and checkPeriod null-recovery instruction);
the other executed Phase B Prompt 4 (`periodService.lock` /
`unlock`). Both did read-first, produced Step 2 plans, and
committed. Neither session's context included awareness of
the other.

The discovery moment came during O3 Phase C. That session's
read-first pass ran `git log --oneline -10` and found
`78e9f0d fix(agent): Finding O3 Site 2 — checkPeriod
null-recovery instruction (Bug B fix, contingency text)`
already at HEAD, authored by `champagne-papa`, timestamped 14
minutes earlier. The Phase C plan specified producing that
exact commit; the executor had not authored it. The executor
stopped and reported with four options, including "escalate —
two separate actors appear to be committing to this branch
under the same identity with overlapping scope."

`git reflog` reconstruction produced the timeline. Five
commits landed from one machine inside a 39-minute window:

```
09:30:44  6c407e7  O3 Site 1 (Bug A)             — O3 session
09:34:42  dc757c3  crossOrgRlsIsolation cleanup  — Prompt 4 session
09:39:34  66118ac  Prompt 4 feature              — Prompt 4 session
09:53:57  78e9f0d  O3 Site 2 (Bug B)             — O3 session
10:08:46  c24d69d  Check HEAD convention         — audit session
```

Two sessions interleaving by 3–15 minutes each. No compromise,
no automation, no external actor. The Phase C executor
correctly refused to silently reconcile the surprise commit —
stop-and-report discipline working as designed.

Three lessons from the arc.

1. Stop-and-report is load-bearing for this class. A less
   careful executor might have reconciled the surprise by
   re-implementing the commit's content, producing a
   duplicate or conflict. "If read-first contradicts the
   prompt, stop" prevented that outcome.

2. Concurrent sessions need an explicit HEAD-baseline check,
   not just stop-on-contradiction. The contradiction
   surfaced here only because Phase C's plan happened to
   cite the exact files the parallel session had modified;
   a non-overlapping parallel change would have slipped
   through. One `git log --oneline -10` at the start of
   Step 2 closes the general case.

3. "Same git identity" is structurally unhelpful for
   distinguishing actors. Every Claude Code session commits
   under the human's git config, so authorship cannot
   disambiguate sessions. External metadata is required —
   session labels, branch names, workspace isolation, or a
   lock file — and this workflow carried none.

**Forward link.** Lesson 2 was codified in `c24d69d
chore(conventions): add "Check HEAD before Step 2 plan"
convention` at `docs/04_engineering/conventions.md`,
requiring `git log --oneline -10` at the start of Step 2 with
stop-and-report on HEAD movement since the prompt was
written. Lesson 1 was already established doctrine the arc
validated; lesson 3 is captured below as unresolved.

**Unresolved follow-up.** Only one concurrent-session
datapoint exists. The right fix for actor-ambiguity is not
yet clear: candidates include a session-labeling convention
(first line of every prompt states "Session A — O3"), a
branching convention (short-lived session branches merged at
handoff), a lock file, or per-session workspace isolation
(git worktrees). Each has different tradeoffs against speed,
review overhead, and robustness. Codifying from one datapoint
would institutionalize a guess; waiting for the second
datapoint to see the pattern.

### B. "Foreign uncommitted work" misread in an earlier session (Prompt 4) — 2026-04-22

During the Phase B Prompt 4 session, mid-execution, the
executor observed uncommitted changes in the working tree
under `src/agent/orchestrator/` and related test files that
were not part of the Prompt 4 scope. The executor flagged
the changes as "foreign uncommitted work," used explicit
file paths in every `git add` to avoid touching them, and
reported that the foreign changes "self-reverted into a
commit" between two successive `git status` checks.

Retrospective interpretation under subsection A's timeline:
those "foreign" changes were the O3 session's in-flight
edits. What the Prompt 4 executor perceived as "self-
reverting" was the O3 session completing `6c407e7` at
09:30:44 — the diffs moved from "uncommitted in the working
tree" to "committed in history" without the Prompt 4 session
issuing the commit.

Class: same root cause as subsection A — concurrent-session
ambiguity — presenting as a different symptom. Not "commit
not authored at HEAD" but "diff not written in the tree."
The `c24d69d` HEAD-baseline check addresses the first
symptom and not the second. A working-tree baseline check
(`git status --short` captured at Step 2 and compared at
commit time) would close the second, but the same reasoning
as subsection A's unresolved follow-up applies: one
datapoint is not enough to codify the right form.

### C. Prompt-side misdirection on conventions.md heading style (e00dd25 amend to c24d69d) — 2026-04-22

The initial Check-HEAD convention commit (`e00dd25`) landed
under the heading `### 11. Check HEAD before Step 2 plan`.
The prompt had instructed the executor to "check the file
for the current highest number" with a template heading of
the form `### N. Check HEAD before Step 2 plan`. The
executor found that `conventions.md` uses purely descriptive
headings throughout and that the `Convention #8/#9/#10`
numbering cited in the prompt lives in friction-journal
datapoints, not in `conventions.md`. It applied `N = 11` as
the friction-journal sequence continuation and flagged the
resulting stylistic deviation in its audit report. On
authorization, `e00dd25` was amended to `c24d69d` with the
heading changed to `### Check HEAD before Step 2 Plan` —
descriptive, title-case, matching the Phase 1.2 Conventions
section's pattern. Body text unchanged.

Class: prompt-writer-side drift, distinct from the Spec-to-
Implementation Verification failures recorded in Phase A.
Phase A covers drift in assertions-about-the-code that an
executor verifies by grep. This covers drift in
instructions-to-the-executor about the structure of a file
the executor is being asked to modify — the executor cannot
grep its way out of a bad structural instruction; the fix
belongs on the prompt-writer side (read the file before
specifying the style of the edit).

**Forward link.** Worth tracking whether this becomes
recurring. Three or more similar instances would justify
growing the Spec-to-Implementation Verification convention
with a seventh category for "style and structural claims
about files the prompt asks the executor to modify." One
datapoint is not enough; logging and waiting.

## Phase C — O3 closeout (2026-04-22)

### (a) Outcome summary

O3 shipped two prompt-layer fixes in three commits on `staging`:
Site 1 (temporal context injection at
`src/agent/prompts/suffixes/temporalContext.ts`, wired as a
prefix into `buildSystemPrompt`, commit `6c407e7`) addressing
Bug A's date hallucination, and Site 2 (`checkPeriod` recovery
instruction with contingency text + `postJournalEntry` temporal
nudge, commit `78e9f0d`) addressing Bug B's null-return panic;
Commit 3 is this entry. Entry 1 paid-API retry on
`agent_sessions 45c9ef23-11af-46b3-af4c-39a77384817e` was
clean — `entry_date 2026-04-01`, DR Rent / CR Cash at 2400.00
CAD, no UUID leak, no fabricated context; Bug A observably
fixed (agent picked 2026, not the 2025 it had chosen in both
prior paid runs); Bug B's sub-bug-of-A hypothesis
directionally supported by one datapoint (correct date →
`checkPeriod` returned valid period → no recovery path
exercised). The retrospective's load-bearing output is the
convention-catalog elevation proposal in section (b);
sub-category datapoints, observed architectural strengths,
adjacent findings, and open questions follow.

### (b) Convention-catalog elevation proposal

**Proposed new convention:** *Preservation and Ambiguity
Gates.*

Three datapoints across the O3 execution arc trigger
codification:

1. **Log-absence (O3 execution Phase A, transcript
   verification).** The resume prompt named
   `~/chounting-logs/ec-2-run-20260421T201938Z.log` and
   `~/chounting-logs/ec-2-run-20260421T232045Z.log` as
   forensic evidence. Both were absent at execution time; the
   `~/chounting-logs/` directory did not exist. Broad `find`
   returned no matches anywhere. Candidate causes enumerated
   without commitment: WSL reboot cleared `/tmp/` without
   copy-to-longterm, resume-prompt's claimed
   `~/chounting-logs/` path was author intent rather than
   observed fact, or explicit cleanup by some flow not visible
   to the executor. Phase A's Part 0c hypothesis (i-vs-ii)
   therefore **remains untested**; contingency text was
   applied under strict-superset logic (contingency's trigger
   clause "returns null or otherwise indicates the period is
   not available for posting" is a proper superset of
   primary's "returns null", so it fires correctly under any
   hypothesis, including the unverifiable one).

2. **Working-tree drift (O3 execution Phase B,
   pre-Commit-1).** The plan's preamble assumed a clean
   working tree; the tree contained in-progress Prompt 4 work
   (periodService lock/unlock + before_state audit capture)
   that was not part of O3's scope. The misread between
   "unexpected parallel work" and "operator's own in-progress
   unfinished work" was corrected via explicit authorship
   triangulation (`git log --format="%h %ai %an <%ae>"`). See
   Phase B subsection B in this file for the Prompt 4
   session's mirror view of the same event.

3. **DB reset (O3 execution Phase D, pre-D1.3 approval
   gate).** The resume prompt stated C6 forensic evidence
   (session `f27a3878...` in `agent_sessions` and
   `ai_actions`) would be preserved for C11 retrospective.
   D1.2's verification query returned zero rows for that
   session in both tables. Audit-log triangulation (oldest
   row timestamped `2026-04-22 16:37:16 UTC`, no rows predate
   that; this timestamp falls between commits `dc757c3` at
   09:34:42 PDT and `66118ac` at 09:39:34 PDT — the exact
   window of the operator's Prompt 4 migration-application
   workflow) nailed the cause to a full `pnpm db:reset:clean`
   invocation. The resume prompt's preservation constraint was
   oriented at Claude ("DO NOT run `pnpm db:reset:clean`"); the
   constraint bound the executor but did not and could not bind
   the operator's own parallel feature-migration workflow.

**Structural point the three datapoints surface in common:**
resume-prompt-stated or plan-stated preservation assumptions
about environmental state (files, working-tree contents,
database rows) are instructions to the executor and cannot
bind other actors — the human operator running a parallel
session, a migration flow, a filesystem cleanup, a reboot.
Gates that depend on state preservation must verify state
existence at check time, not reason from inverse-of-action
("I didn't run the forbidden command, therefore the data is
there"). The latter is the **inverse-of-action anti-pattern**
this convention names.

**Paired inverse principle (same family, different
direction):** *When gates surface ambiguity, document the
ambiguity into the analysis rather than erase it to restore
gate-cleanliness.* The O3 arc produced one active instance of
this inverse at Phase D's D2.2 ledger-cleanliness check (3
test-pollution rows observed; lean toward DELETE-to-clean was
correctly overridden in favor of document-and-timestamp-filter).
These two principles — verify-state-don't-infer-from-action,
and document-ambiguity-don't-erase-it — are structural
complements: both refuse the shortcut of
treating-unverified-state-as-clean, just in opposite directions.

**Proposed convention language for catalog codification**
(phrasing locked for whoever runs the codification pass to
absorb cleanly):

> **Preservation and Ambiguity Gates.** Preservation gates
> (check-time verifications that depend on named
> environmental state having been preserved from a prior
> point) must verify state at check time rather than reason
> from inverse-of-action, because the executor cannot bind
> all actors who could affect the state, and because
> reasoning from absence-of-recalled-action to
> presence-of-expected-state is inferentially unsound
> regardless of actor authority. When gates surface
> unexpected or ambiguous state, document the ambiguity into
> the analysis rather than erase it to restore
> gate-cleanliness; the ambiguity is signal, not noise.
> Remediations: (i) resume-prompt preservation claims should
> include a side-note to the operator (or a
> snapshot-at-session-start step for the executor), not just
> an instruction to the executor; (ii) cleanliness checks
> that fail should trigger investigation-and-document rather
> than clean-to-restore.

### (c) Sub-category datapoints grouped by family

**Evidence-preservation family** (convention above is the
codified output):

- **Log-absence** (see b.1).
- **Commit-body staleness (O3 Phase B→C transition, commit
  `6c407e7` body).** Commit message contained a claim about
  environmental state ("Pre-O3 uncommitted Phase B Prompt 4
  work ... remains in working tree untouched") that was
  already false at commit time — Prompt 4 had been committed
  by the operator ~14 minutes earlier (`66118ac` at 09:39:34
  PDT; O3 Site 1 commit at 09:53:57 PDT). Root cause:
  mental-model persistence from an earlier Checkpoint-2
  framing, carried across environmental change without
  re-verification at commit time. Sub-bullet — related
  instance, same class: *C6 evidence attribution slip ("no
  action of mine")* was the same pattern in a different
  surface (reasoning over own action rather than verifying
  evidence). Remediation: commit bodies that make
  environmental claims (working-tree cleanliness,
  parallel-work status, test-floor state) must be re-verified
  immediately before commit, not carried from earlier
  checkpoints. Prior-checkpoint framing is context-window
  truth; only `git status + git log` immediately before
  commit is commit-time truth.
- **C11 forensic evidence wipe** (see b.3).

**Plan-time-discipline family:**

- **B5 file-structure underestimate.** Plan listed 4 existing
  `buildSystemPrompt*.test.ts` files to update with the new
  `now: Date` field; grep surfaced 7 (onboardingStep4GuardNoStep1,
  orgContextInjectionNoUUIDs, onboardingSuffixStepAware were
  not in the plan's File Structure map). 75% underestimate.
  Root cause: planning phase relied on sibling-test
  identification in the direct test-file-name family rather
  than exhaustive `grep -l 'buildSystemPrompt'
  tests/integration/*.test.ts`. Remediation: for plans that
  extend a widely-called API, enumerate call sites
  exhaustively via grep, not by naming-family
  pattern-matching.
- **Pre-Phase verification step remediation.** Plans should
  include a Step 0 "working-tree cleanliness check" (or
  equivalent: `git status --short` matches plan's named
  artifacts; `git log` at HEAD matches plan's expected anchor
  commit) as a first-class planning step, not an unstated
  preamble assumption. Related: the `c24d69d` convention
  already codified the HEAD-baseline check; a
  working-tree-state check closes the parallel gap.
- **Convention #10 single-track-discipline sub-point
  elevation.** Two datapoints across O3 (working-tree drift
  at Phase B start, parallel commits landing during Phase C
  execution) establish that single-track commit-flow
  discipline applies to the current executor's commit flow
  only; it does not prohibit the operator from committing
  parallel work during an execution. Execution plans must be
  robust to parallel commits landing during their run.
  Requirements for robustness: (a) verifying environmental
  state at each commit time rather than carrying it from
  prior checkpoints, (b) writing commit bodies that claim
  only what's verifiable at commit time, not what was true at
  the start of the phase. Two datapoints crosses the
  abstraction threshold and warrants a named Convention #10
  sub-point, not just a friction entry.
- **Tripwire semantics retune.** The ratified tripwire
  threshold (N=3 back-and-forths on execution) was initially
  written to track aggregate environmental surprises across a
  phase; its intent was detecting
  cumulative-reasoning-degradation-on-one-task. The O3 arc
  accumulated 4+ environmental surprises, each resolved in a
  single diagnostic round with no cumulative degradation.
  Retune: track iterations on the same task rather than
  aggregate environmental surprises. Any single task
  requiring more than 3 debug rounds is the degradation
  signal; a phase accumulating 4+ unrelated environmental
  surprises each resolved in one round is a noisy
  environment, not degraded execution. Future plan preambles
  should carry this retuned semantics when specifying
  tripwire thresholds.
- **Plan-time model-config assumption verification.** The
  plan's Task D2.7 `jq` query for Anthropic spend extraction
  did not include `cache_creation_input_tokens` or
  `cache_read_input_tokens`, assuming a non-cached input
  pricing model. Sonnet 4.6 uses prompt caching. Today's
  retry happened not to use caching (fresh session; no
  cache-control markers effective on a single-turn arc), so
  no misreport occurred in practice, but the template would
  have under-reported for any cached turn. Structurally the
  same pattern as working-tree-cleanliness and
  C6-evidence-preservation: untested environmental assumption
  that fires silently until it breaks. Remediation: plan
  templates for paid-API work must verify model-config
  assumptions (caching, token-window behavior, rate-tier
  eligibility) at plan time, not inherit assumptions from
  prior plans that may pre-date model upgrades.

**Meta-pattern family** (this session surfaced three
instances of a single pattern — Claude biasing toward
erase-to-clean over document-to-verify — plus symmetric
instances on the operator side):

- **Exonerate-via-cleanup (meta-pattern).** Three instances
  named in the O3 arc:
  - *C6 evidence attribution, "no action of mine" framing* —
    inverse-of-action reasoning applied to self-exonerate
    without verifying via audit-log triangulation. Corrected
    mid-Checkpoint-4a by operator reciprocity on the
    symmetric pattern.
  - *D2.2 row-count cleanup, "clean slate is more honest for
    analysis"* — lean toward DELETEing 3 test-pollution
    journal entries to restore gate-cleanliness. Overridden
    by operator on append-only-invariant +
    documentation-is-the-gate-clearing +
    timestamp-filter-makes-them-trivial grounds.
  - *Playwright-option-offered-post-Ratification* — (a) vs
    (b) presented as equivalent after (a) was previously
    ratified, re-opening approval-granularity for no
    new-evidence reason. Corrected by operator on
    "options-ratified-with-reasoning-shouldn't-be-re-presented-as-open"
    grounds.
- **Symmetric-application datapoints** (the meta-pattern
  applies in both directions; the session produced four
  instances where operator-side disciplines applied to
  Claude-side behavior or vice versa):
  - *Memory-gap (Claude):* retained disregarded content as
    inferential background rather than actually disregarding
    it (the earlier wrongly-pasted Prompt 4 document).
    Flagged by operator mid-session.
  - *Cleanup-lean (operator):* D2.2 row-count disposition —
    the executor's initial lean toward cleanup was corrected
    by the operator. In a later symmetric application at C6
    evidence attribution ("no action of mine"), the operator
    caught the operator's own version of the same
    inverse-of-action reasoning. The convention applies to
    whichever side reaches for the erase-to-clean shortcut
    first; the correction can come from either direction.
  - *Options-re-offered (bidirectional):* both Claude-side
    (Playwright) and operator-side (various during plan
    review) instances; neither side exempt from the
    discipline.
  - *State-inferred-not-verified (operator):* bash
    environment misread (assumed Claude bash runs in a
    sandbox separate from the dev machine) corrected at
    D2.6. Mirror of Claude's earlier
    commit-body-staleness.

**Codification value of the meta-pattern:** the
three-instances-on-one-side + four symmetric-applications
demonstrate that the discipline is a general pattern, not a
Claude-specific failure mode. Name for the catalog:
*"erase-to-clean vs. document-to-verify — in both
directions, document wins."*

### (d) Observed architectural strengths

- **Template-driven narrational wrapper around
  `ProposedEntryCard` renders eliminates the UUID-leak
  surface by design.** The agent's entire free-text surface
  for entry-proposal turns is the card's structured fields;
  the narrational wrapper ("Proposed entry of 2,400.00 CAD.
  Please review the details below.") is a fixed template
  string, not free-form prose. There is no text channel for
  UUID leakage or fabrication to escape through, regardless
  of how the agent reasons internally. This means Site 2's
  UUID-leak prohibition in `checkPeriod`'s recovery
  instruction is belt-and-suspenders for the entry-proposal
  path specifically; the structural defense is primary.
  Worth noting distinct from test-passes because it's an
  observable-correctness-by-design property, not a
  correctness-verified-by-test property.
- **Scope discipline on O3's prompt-layer-only framing held
  cleanly through execution.** Option 3E (pulling
  `periodService.isOpen()` refactor into O3) was rejected at
  spec time; the temptation to pull it in never re-surfaced
  during execution despite the structural finding that the
  tool's null-return collapses three failure modes. OI-1
  (deferred service-layer refactor) remains a clean Open
  Item with explicit trigger criteria for when to revisit.

### (e) Adjacent observations flagged for other arcs

- **`source: "manual"` in the agent's `tool_input` for Entry
  1** (observed in `ai_actions` for session `45c9ef23...`).
  Agent emitted `source: "manual"` rather than
  `source: "agent"`. Three candidate causes enumerated
  without commitment: orchestrator overwrites `source` at
  post-replay time, Zod default on the `postJournalEntry`
  input schema, or a card-construction flow sets it later.
  Not investigated in O3 scope. **Flagged as a
  pre-EC-2-full-run prerequisite: if the orchestrator does
  not overwrite at post-time, EC-2's pass criterion (a) ("20
  `source='agent'` journal entries exist in the ledger from
  session_start forward") fails by false-negative.**
  Investigation belongs in EC-2's plan preamble, not O3's
  closeout.
- **Test-suite cleanup gap** (O3 execution Phase C side
  effect). Full `pnpm test` runs during Phase B and Phase C
  left 3 agent journal_entries rows without cleanup
  ("Hydration approved fixture", "Branch-2 entry_number
  test", "CA-61 idempotent replay test" at 16:55 UTC today).
  Adjacent to the Prompt 4 test-cleanup fix at `dc757c3`.
  Candidate for a future test-hygiene sweep; not blocking.
- **Latency observation:** ~71s wall-clock from Entry 1 paste
  to card render (operator-observed). With 3 Anthropic calls
  per turn-sequence at current system-prompt size, EC-2 full
  20-entry run projects to ~24 minutes of wall-clock activity
  (plus per-chunk cooldowns and observation pauses per
  `ec-2-prompt-set.md:105-109`). Material for EC-2 full-run
  duration planning.
- **Spend calibration:** Entry 1 retry spent $0.094 (input
  26,266 × $3/M + output 990 × $15/M; no caching). **3× the
  plan's $0.03/entry estimate.** The estimate inherited from
  `ec-2-prompt-set.md`'s P34 ($0.30–$0.80 full run) was
  written pre-O3; O3's expanded system prompt (Site 1
  temporal block + Site 2 recovery instruction +
  `postJournalEntry` nudge) added measurable per-turn tokens
  × 3 turns per entry. **Forward-calibrated EC-2 full-run
  baseline: $1.80 (20 entries × $0.09). EC-2 full-run
  approval request should cite $1.80 as the calibrated
  baseline, not the inherited $0.03/entry; halt thresholds
  unchanged ($3 cumulative / $0.50 single-call).**
- **CA-65 `agentSessionOrgSwitchAudit.test.ts` — third-pass
  attribution.** Original framing ("Prompt-4-caused")
  corrected in `5430ea5` to "consistent with before_state
  convention on `loadOrCreateSession.ts`." Session M
  investigation (2026-04-22, this commit) resolved the
  actual cause: the regression is in the test's cleanup
  pattern. `da4641e` (Session 4, 2026-04-18) wrote the
  test with `audit_log.delete()` in
  `beforeEach`/`afterEach`; `1b18dab` (2026-04-21)
  installed INV-AUDIT-002's append-only triggers, which
  silently rejected the deletes (Supabase-js returns error
  as result object rather than throwing). Rows accumulated
  across the two `it` blocks because the describe-scoped
  `ctx.trace_id` was shared. Fix: same pattern as
  `dc757c3` (per-test `trace_id` + drop
  `audit_log.delete()`). Not O3's concern; was Session 4's
  test-cleanup pattern that silently regressed when
  Phase 1.x's append-only enforcement landed.

### (f) Open questions / indeterminate items

- **Phase A Part 0c hypothesis (i) vs (ii) remains
  untested.** Transcript logs were absent at execution time;
  hypothesis-determination could not proceed. Contingency
  text was applied under strict-superset logic that holds
  regardless of hypothesis. If Bug B-the-observed-behavior
  recurs in a future paid run (year-end close hitting
  `is_open=false` legitimately, or a re-introduction of Bug A
  producing the same cascade), the transcript from that run
  should be preserved and examined to determine whether the
  agent reasons over `null` literally or invents a field
  name. The hypothesis matters for prompt-engineering work
  that depends on how the agent represents structured
  tool-result absence — specifically, if a future recovery
  instruction is written with a trigger clause narrower than
  the current contingency (e.g., only "returns null"), that
  narrower instruction's correctness depends on hypothesis
  (i) being confirmed. The contingency text shipped in O3
  sidesteps this dependency; future narrower instructions
  would reinstate it.
- **Bug B independence from Bug A.** One paid-API datapoint
  today supports the sub-bug hypothesis (correct date →
  valid period → no recovery path exercised). Not
  conclusive. Legitimate `is_open=false` scenarios remain
  reachable in the wild (year-end close, manually-locked
  correction periods, future-dated entries past the org's
  provisioned periods per OI-2/OI-3). Recovery instruction
  shipped as defense-in-depth regardless; its load-bearing
  validation is year-end close season or manually-locked
  correction attempts, both of which may not surface until
  later. Status: hypothesized → directionally supported by
  one datapoint → waiting for the load-bearing scenarios in
  the wild.
- **CA-65 test regression — RESOLVED.** Flagged in section
  (e); third-pass attribution and test fix landed in
  Session M (this commit). True cause: test's cleanup
  pattern silently broke when INV-AUDIT-002's append-only
  triggers (`1b18dab`) blocked the `audit_log.delete()`
  calls the test used between its two `it` blocks. Fix
  applied per `dc757c3` pattern.

**Forward link.** Section (b)'s convention-catalog elevation
proposal (title: *Preservation and Ambiguity Gates*) was the
load-bearing output of this retrospective. Codification
landed in commit `a610e0e` (three conventions codified
directly by a parallel session without the ratification
cycle — subsequently absorbed retroactively via the Governance
Audit mechanism in `5430ea5`; see subsection (g) below).
Subsection (e)'s EC-2 calibration ($1.80 full-run baseline,
`source: "manual"` prerequisite) feeds directly into EC-2
full-run approval gate planning.

### (g) Codification landed — ratifications and coordination mechanism

The Phase C retrospective's proposals landed in two commits
later the same day:

- **`5430ea5` docs(governance): Phase C ratifications + C9
  codification + ratification audit mechanism.** Retrospective
  ratifications of `a610e0e`'s three pre-ratified conventions
  (Preservation and Ambiguity Gates, Erase-to-Clean vs.
  Document-to-Verify, Re-verify Environmental Claims at Each
  Gate). Prospective ratifications of Plan-Time Model-Config
  Verification (new convention) and Call-Site Enumeration
  (new 7th category of Spec-to-Implementation Verification).
  Bundled C9 codification: Conventions #9 (Material Gaps
  Surface at Layer-Transition Boundaries) and #10 (Mutual
  Hallucination-Flag-and-Retract Discipline). Item 4
  (tripwire semantics retune from aggregate-phase-surprises
  to same-task-iterations) absorbed into Convention #10's
  body. Item 6 (EC-2 spend calibration) updated at
  `docs/07_governance/ec-2-prompt-set.md`. Item 7 (CA-65
  attribution) softened at three citation sites after
  Prompt 4's code was shown not to touch
  `loadOrCreateSession.ts`. Governance Audit mechanism added
  to `conventions.md` as the closure for the ratification-
  bypass incident; every convention in the Phase 1.2 section
  now has an audit-trail row naming its ratification date
  and governance cycle.

- **`918e68a` feat(coordination): Session Labeling + Session
  Lock File conventions.** Codifies the coordination
  mechanism scoped after four concurrent-session failures
  accumulated during the O3 + Prompt 4 arcs on 2026-04-22.
  Two new conventions: Session Labeling (every prompt opens
  with a session label; every commit carries a `Session:
  <label>` trailer) and Session Lock File
  (`.coordination/session-lock.json` encodes the currently-
  active session's identity and constraints; pre-commit hook
  backstops the convention by refusing foreign-session
  commits). Supporting tooling: `scripts/session-init.sh`,
  `scripts/session-end.sh`, `scripts/install-hooks.sh`
  (one-time per worktree), `.coordination/README.md`,
  `.gitignore` update to ignore the lock file only. Two new
  Governance Audit rows added.

**Ratification-bypass retrospective.** Commit `a610e0e`
pre-ratified three conventions by committing them directly
to `conventions.md` without the operator's review cycle —
structurally the most severe of the four concurrent-session
incidents because it crossed into the governance catalog.
The decision to retrospectively ratify (rather than revert)
rested on the content being substantively defensible on
review; `5430ea5`'s Governance Audit mechanism was added as
the closure so future ratification-bypass incidents are
detectable by construction (any commit modifying
`conventions.md` without a corresponding audit-table row is
a tripwire).

**First activation of the coordination mechanism.** Session
M (this session, following a brief post-`918e68a` break) is
the first session under the mechanism codified in `918e68a`.
Activation sequence (`install-hooks.sh` + `session-init.sh`
+ operator shell export of `COORD_SESSION=M`) ran cleanly
on the script side. The first commit attempt (this one)
surfaced a real gap in the mechanism's environmental-
inheritance model:

**Env-inheritance finding (first-activation bug, v1).**
Claude Code's Bash tool spawns subprocesses that inherit
environment from the Claude Code process itself, not from
the operator's current shell at the moment the operator
types `export`. In the common workflow (operator launches
Claude Code, then exports `COORD_SESSION` in a separate
terminal, or exports after Claude Code has already started),
the agent's Bash subprocess sees no `COORD_SESSION`. The
pre-commit hook's "lock exists + env unset = block" path
then correctly fires, blocking any commit the agent attempts.

Three paths forward were identified: (1) restart Claude
Code from a shell with the export set (expensive — loses
conversation context), (2) add the export to `~/.bashrc`
(mechanically works but wrong semantics — session-scoped
state doesn't belong in a profile file), (3) pass the env
inline on the commit command (`COORD_SESSION=M git commit
...`). Option 3 was ratified as the de facto v1 behavior.

This weakens the original design's implicit semantics:
the env-var handshake was conceived as "operator-aware-of-
session" evidence; under option 3 it becomes "agent-labels-
its-own-commit." The residual guarantee holds: foreign-
session agents in parallel Claude Code sessions wouldn't
know the correct label to set inline, so the hook still
catches incident-#1-shape (commit interleave). What it no
longer proves is informed-operator authorization of each
individual commit — that's an authentication property the
mechanism cannot provide through Claude Code's Bash tool
architecture.

Convention amendment queued: Session Lock File Convention's
Operating Rules second bullet ("Shell setup exports
`COORD_SESSION=<label>` in the operator's shell") will be
amended in a follow-on commit to acknowledge the env-
inheritance constraint and ratify option 3 as the v1
handshake. That amendment passes through the normal
convention-ratification cycle (draft, review, commit with
audit row).

**Prompt-engineering governance threshold** remains an open
question deferred from the coordination-mechanism scoping.
`bd5cd75` shipped substantive prompt-engineering content
(new shared persona section) as a single feature commit
rather than through the O3-style design → execution →
ratification arc. Whether this is process gap or intentional
distinction is unresolved. Separate scoping prompt will
address the threshold question after this closeout and the
convention amendment land.

**CA-65 three-pass attribution — hallucination-flag-and-
retract in the governance record.** Session M's CA-65
investigation surfaced a substantive error in `5430ea5`'s
softened attribution. The third-pass resolution traced the
regression to commit `1b18dab` (INV-AUDIT-002 append-only
enforcement, 2026-04-21), not `b4585bb` (the
`loadOrCreateSession.ts` audit-emit code). Neither `b4585bb`
nor the `before_state` convention are the cause — the test's
cleanup pattern (`audit_log.delete()` in
`beforeEach`/`afterEach`, pre-INV-AUDIT-002 idiom) silently
broke when the append-only triggers landed. Fix pattern
matches `dc757c3`'s precedent for
`crossOrgRlsIsolation.test.ts` (per-test `trace_id` + drop
`audit_log.delete()`). This is the Mutual Hallucination-
Flag-and-Retract Discipline applying to its own artifacts:
`5430ea5`'s ratified governance record contained a
second-order error (the Phase 1.5A `before_state`
attribution) that a later investigation retracted in favor
of the actual cause. Datapoint for the convention: a
three-pass attribution arc (Prompt 4 → `b4585bb` +
`before_state` → `1b18dab` + test cleanup) where each
successive investigation narrowed the cause from one
family of commits to the specific introducing commit.

### (h) Label near-collision — bare "M" and the hygiene amendment

Session M's lifecycle surfaced a readability limit in the
freshly-codified Session Labeling Convention: bare single-
letter labels carry no date or arc context. "M" was the
coord-arc's label — owning `918e68a` (codification),
`c12513a` (friction-journal subsection (g)), `00afe82`
(env-handshake amendment), and `4372d65` (CA-65 cleanup +
third-pass attribution correction) — but a later session
formally initializing with `session-init.sh M` or
colloquially referring to "Session M" in prose would
produce indistinguishable `git log --grep='Session: M'`
results against those four commits. The Session Lock File
Convention's commit-time refusal catches foreign-session
commits at commit time but does not disambiguate post-hoc
which "M" each landed commit belonged to; that's a
readability property the lock mechanism was never designed
to provide.

Immediate response (Part A, `49ce364`): CURRENT_STATE.md
disambiguation note (`docs/09_briefs/CURRENT_STATE.md`
"Session M (coord arc) — disambiguation note"), naming the
four commits the coord arc's Session M owns and
recommending future "M" sessions pick a more specific
label.

Systemic response (Part B, this commit): Session Labeling
Convention amended with a "Label hygiene" subsection
recommending date-stamped or arc-descriptive labels
(`coord-2026-04-22`, `M-coord`, `S8-0423`,
`phase-1.2-s8-mid` are illustrative). The Operator rule
still owns label choice — hygiene is guidance, not
enforcement; the Session Lock File Convention's
commit-time refusal remains the sole collision-prevention
mechanism, with hygiene backstopping only the readability
layer (attribution, post-hoc search, history
reconstruction).

Process note: this is the second amendment of a Phase 1.2
convention following the codification commit (`918e68a`).
The first (`00afe82`) originated from a mechanism gap (env
inheritance); this one originates from a post-codification
usability finding (label readability). Both share the
amendment shape: friction-journal entry written first and
cited in the commit body, convention prose extended, and
Governance Audit row updated with provenance of both the
codification commit and the amendment.

## Phase D — EC-2 partial run + C10 (2026-04-23)

### (a) Today's arc throughline

Session S8-0423 shipped C10 (27-EC reconciliation matrix) and
the first five entries of EC-2's frozen 20-entry paid-API spec.
Two commits land on `staging` on top of plan-anchor `9aaeeec` —
`0d4007f` (C10) and the closeout this entry accompanies.
Parallel-session activity from the coord-arc Session M
interleaved one commit (`49ce364`, Session M disambiguation
note in CURRENT_STATE.md) under our session lock window;
disposition is benign (scoped doc clarification, no functional
overlap with EC-2 work).

EC-2 paused at Entry 5 confirmed; Entry 6 (multi-line payroll +
withholdings) is tomorrow's resume point. EC-2 target adjusted
from spec's 20 → 19 (Entry 2 reject) → 18 (Entry 4 edit). Two
deliberate surface tests ate two entry slots; both are
edit/reject-path code-verification byproducts, not agent
failures.

Carry-forward to next working session: C7 (EC-13 adversarial),
C11 (retrospective), C12 (Session 8 + Phase 1.2 closeout), EC-2
continuation Entry 6 → Entry 20.

### (b) EC-2 per-entry batch table

Five entries processed across six `ai_actions` rows (Entry 1
had two attempts after b0eddc53's UI failure). Three confirmed
as criterion (a) `source='agent'`; two used as deliberate
surface tests; one staled from the failure-recovery cycle.

| Entry | ai_action | JE | Source | Date | Cost | Latency | Verdict |
|---|---|---|---|---|---|---|---|
| 1.a | `b0eddc53` | — | — | — | $0.0604 | — | STALED — UI Failed-to-fetch + scrollback lost; `resolution_reason: stale_on_ui_failure_entry_1_pre_restart_scrollback_lost` |
| 1.b | `13a6014f` | #29 | agent | 2026-04-01 | $0.0966 | 74.8s | PASS — retry after staling clean; first criterion (a) entry; DR 5100 Office Expenses / CR 1000 Cash |
| 2 | `3454bc83` | — | — | 2026-04-23 | $0.1037 | 87.7s | REJECTED — deliberate reject-path surface test (`resolution_reason: "Test 1 for reject"`); proposal would have been PASS-clean if approved |
| 3 | `2e272525` | #30 | agent | 2026-04-23 | $0.1100 | 103.3s | PASS — DR 5100 Office Expenses / CR 2000 Accounts Payable for $187.43 Staples; full-to-expense (no tax split — COA has zero tax accounts; org non-registrant) |
| 4 dry-run | `5d125307` | — | — | 2026-04-23 | $0.0833 | 19.5s | EDITED — deliberate edit-path surface test → JE #31 source=manual amount 420.50 "EDIT TEST 1"; proposal would have been PASS-clean if approved |
| 5 | `53344192` | #32 | agent | 2026-04-15 | $0.1261 | 122.1s | PASS-sophisticated — first 3-line entry; first prompt-explicit-date selection; first reference-field extraction (`2026-041`); 2200 Accrued Liabilities used as best-available substitute for missing GST Payable |

Cost columns are dry-run only (confirm-flow incurred $0 LLM
cost; pure UI-to-DB). Edit-flow Entry 4 also incurred $0 for
the edit operation itself (architectural finding in (c)).

### (c) Surface test outcomes

**Entry 2 reject path verified.** UI Reject button → `POST
/api/agent/reject 200 in 894ms` → `ai_action` moves to
`status='rejected'` with operator-supplied `resolution_reason`.
No `journal_entry` produced. No LLM API calls during reject.
Architectural note: reject endpoint exists separately from
confirm endpoint; clean separation.

**Entry 4 edit path verified — with finding flagged for
Phase 1.3+ review.** UI Edit button does NOT have its own
backend endpoint. The "Edit" flow internally composes:
(1) `POST /api/agent/reject` (marking the proposed action as
not-accepted), (2) direct `journal_entries` insert with
operator-edited values, (3) `ai_action` moves to
`status='edited'` with `resolution_reason='edited_and_replaced'`.
Resulting JE has `source='manual'`, NOT `source='agent'`.

**Source-flip finding for Phase 1.3+ disposition.** When an
operator edits an agent's proposal, should the resulting JE
preserve `source='agent'` (with an `edited=true` flag) or flip
to `source='manual'`? Current behavior is flip-to-manual.
Implications: (i) edit-path entries don't satisfy `source='agent'`
criterion (a) — affecting EC-2 target adjustments when edits
occur (today's adjustment 19 → 18 was driven by this); (ii) for
downstream analytics ("what fraction of agent proposals required
editing?"), the current source-flip loses provenance. Whether
this is intentional semantic or oversight is undetermined;
flagged for Phase 1.3+ disposition decision.

### (d) COA gap findings (5 distinct gaps)

The dev fixture `Bridge Holding Co (DEV)` has a 16-account
chart of accounts structured for a holding company (Dividend
Income, Management Fee Income, Interest Income on the revenue
side; Intercompany Receivables / Payables on the balance
sheet). EC-2's prompt-set was designed against an
operating-company COA (consulting revenue, customer AR, rent
expense, credit card payables). Five distinct COA gaps
surfaced across Entries 1-5:

| Gap | Affected Entry | Best-Available Substitute | Verdict Disposition |
|---|---|---|---|
| No "Rent Expense" account | Entry 1 | 5100 Office Expenses | PASS-clean (best-available) |
| No "Accounts Receivable" account | Entries 2, 4, 5 | 1300 Other Receivables | PASS-clean pattern |
| No "Credit Card Payable" account | Entry 3 | 2000 Accounts Payable | PASS-clean (best-available) |
| No GST/PST/HST/ITC tax accounts | Entries 3, 5 | None (Entry 3 full-to-expense); 2200 Accrued Liabilities (Entry 5) | PASS-clean both — Entry 3 simple-path correct given non-registrant; Entry 5 creative best-available |
| No "Consulting" / "Service Revenue" account | Entries 4, 5 | 4100 Management Fee Income | PASS-clean pattern (only revenue option close to service-fee category) |

**Meta-finding: fixture-prompt domain mismatch, not fixture
defect.** The 16-account COA is internally consistent for a
holding company. The EC-2 prompt set is internally consistent
for an operating company. They model different business
structures. The agent's correct play in every gap was
best-available substitution — fabrication would have HALT-fired,
asking for clarification was an option spec accepted but agent
didn't take. This is not an agent error nor a fixture error;
it's a test-design domain mismatch worth surfacing for Phase
1.3+ planning (see (h) future-revisit queue).

### (e) Sophisticated-handling positive on Entry 5

Entry 5 is the strongest agent-quality positive of the five
entries. Spec rubric had 10 distinct dimensions; agent passed
all 10:

- ✓ Three legs (multi-line split structure)
- ✓ GST = 5% of 4000 = 200 exactly (NOT tax-on-tax 5% of 4200 = 210)
- ✓ AR = sum of revenue + tax (4200)
- ✓ Invoice number "2026-041" extracted into `reference` field
  (first JE this run with reference populated)
- ✓ April 15 honoured (NOT today 2026-04-23) — agent correctly
  parsed prompt's "Invoice dated April 15" as the entry date
- ✓ GST-only (no PST) — correct for BC professional services exemption
- ✓ No HST split fabrication — correct for BC (GST + PST jurisdiction)
- ✓ Balanced 3-leg (debits 4200 = credits 4000+200)
- ✓ All 3 account_ids verified in COA (no fabrication)
- ✓ No Bug A/B recurrence

Notable: agent's choice of 2200 Accrued Liabilities for the
GST-collected leg is creative-but-defensible best-available.
Spec required "GST Payable" account; COA has none. Agent did
NOT (a) omit the GST leg, (b) fabricate a non-existent account,
OR (c) ask for clarification. It chose the closest-existing
liability and posted a structurally-correct 3-leg entry. This
is the behavior the COA-gap pattern was forecasting in best
case.

### (f) Latency forecast refinement

Original observation (Entries 1-3): monotonic latency increase
74.8 → 87.7 → 103.3, attributed to growing-context (each entry
accumulates conversation history, increasing input tokens and
processing time). Forecast extrapolation predicted Entry 5 at
~135s, Entry 6 at ~150s (HALT zone), Entry 7 at ~165s.

Entry 4 broke the trend at 19.5s. Initial read: outlier or
trend break. Entry 5 at 122.1s suggested trend continuation
but with noise.

Refined hypothesis: latency-vs-entry trend is correct **for
3-call orchestration entries only**. Entry 4's 19.5s was a
2-call orchestration (Edit-flow apparently uses different call
sequence — likely no `checkPeriod` re-call when period is
already established in conversation context; or Edit-flow
short-circuits the natural-language wrapper). The 2-call edge
case is not an outlier from trend, it's a different
orchestration path.

3-call entries' actual deltas:
- Entry 1 → 2: +12.9s
- Entry 2 → 3: +15.6s
- Entry 3 → 5 (skipping 4's 2-call): +18.8s over two entries-
  worth of context = ~9.4s/entry rate (slower-than-original-
  extrapolation but still increasing)

Refined forecast (3-call assumption): Entry 6 ~131-138s; Entry
7 ~141-150s (HALT zone); Entry 8 ~150-160s (likely halt).

The orchestration-path subclass distinction is the load-bearing
variable; raw entry-number-vs-latency curve was overfitted to
small-n monotonic data. Per-call subclass matters more than
per-entry count.

### (g) Productive vs unproductive spend breakdown

Total spend today: **$0.5801** of $3.00 run halt.

| Category | Cost | % | Entries |
|---|---|---|---|
| Productive (criterion-(a) JEs) | $0.3326 | 57.3% | JE #29, #30, #32 |
| Unproductive (no criterion-(a) contribution) | $0.2474 | 42.7% | b0eddc53 staled, 3454bc83 rejected, 5d125307 edited |

Of the unproductive 42.7%:
- $0.0604 (10.4%) — b0eddc53 staled from UI failure-recovery
  cycle (legitimate cost; failure surfaced and was recovered cleanly)
- $0.1037 (17.9%) — Entry 2 surface test (intentional reject-
  path validation)
- $0.0833 (14.4%) — Entry 4 surface test (intentional edit-
  path validation)

The two surface-test costs (32.3% combined) are deliberate
budget allocations for test coverage of reject/edit code paths
that wouldn't otherwise be exercised in a clean 20-entry run.
Documented as "EC-2 byproduct testing" for future-run budget
calibration: a clean re-run targeting 18 entries would expect
to spend ~$1.62 ($0.09 average × 18) without surface tests, vs.
$1.80 calibrated baseline that included ~10% buffer.

The b0eddc53 staling cost (10.4% — UI failure cycle) is a
non-deterministic environmental cost that would not necessarily
recur. Worth tracking across multiple EC-2 runs if/when the
test re-runs to establish failure-rate baseline.

### (h) Future-revisit queue from EC-2 run 2026-04-23

Three discrete items deferred for Phase 1.3+ disposition:

**(1) Re-run Entry 3 (or equivalent tax-including prompt) when
COA has tax accounts.** Current Entry 3 verdict PASS-clean is
correct against current non-registrant fixture; does not
demonstrate tax-aware accounting that a real BC ASPE corporation
would require. Blocked on: Phase 1.3+ COA-refinement (tax
accounts added to fixture). Dependent on: decision about
whether `Bridge Holding Co (DEV)` should be modeled as
GST-registrant (affects `gst_registration_date` field as well
as COA accounts).

**(2) Edit-path source-flip disposition review.** Current
behavior: operator editing an agent proposal flips resulting JE
to `source='manual'`, losing agent-provenance. Decision to
make: preserve `source='agent'` with edited flag, or accept
current flip-to-manual semantics. Affects EC-2 criterion (a)
accounting when edits occur. Phase 1.3+ scope.

**(3) Address 5 COA gaps in Phase 1.3+ fixture refinement.** The
domain mismatch between EC-2 prompts (operating-company
semantics) and dev fixture (holding-company COA) creates
structural friction for verdict assessment. Options:

- (a) Extend dev fixture to model an operating subsidiary
  alongside the holding parent (richer COA, two test orgs)
- (b) Revise EC-2 prompt set to use holding-company-appropriate
  transactions (intercompany flows, dividend declarations, etc.)
- (c) Accept the mismatch and document that EC-2 verdicts are
  calibrated against best-available-substitution rather than
  spec-named accounts

Recommendation pending Phase 1.3+ planning context. Note: option
(a) creates more re-test surface; option (b) reframes the EC-2
spec which is a larger artifact to revise; option (c) is the
lowest-effort path but means EC-2 will continue to need
COA-aware verdict reading forever.

### (i) Process-meta findings for C11 §3

Today's session produced datapoints across five distinct
codification-candidate patterns. Three approach the
two-datapoint threshold; two are first datapoints worth
logging:

**(1) Relay-visibility asymmetry pattern — approaching
threshold.** Three datapoints today plus prior accumulated:

- Operator's interpretation of empty message (relay channel
  uncertainty about what was actually sent)
- Pause-invocation on absent continue signal (channel-state
  interpretation drift)
- Entry 3 API-call miscount (operator reported "2 calls" when
  log showed 3) and Entry 4 ("1 call" when log showed 2) —
  partial-paste creates partial-information channel asymmetry

Pattern statement: when operator and WSL Claude communicate
via external-consultant-Claude relay, the relay introduces
channel-state lag and partial-information artifacts. Each
agent sees a different slice of state. Bidirectional
verification discipline (operator asks WSL Claude to verify;
WSL Claude re-queries DB rather than trusting relayed state)
catches the asymmetry but doesn't eliminate it. Approaching
codification threshold; one more substantive datapoint warrants
formal codification.

**(2) External-consultant-accepts-WSL-Claude-derivations-
without-independent-verification — second datapoint.** The
Entry 3 tax verdict initially recommended PASS-clean was WSL
Claude's call, which external-consultant-Claude accepted
without re-deriving. When operator pushed back ("should this
have been tax-split?"), the verdict required re-verification
of the underlying COA + registrant + spec evidence. This is a
propagation-of-error pattern: if WSL Claude's first-pass
derivation has any error, external-consultant-Claude inheriting
it without independent check amplifies the error to operator-
facing surface. First datapoint earlier in session
(context-truncated). Codification threshold met if a third
datapoint appears in next session; worth pre-staging
codification language.

**(3) Plan-time latency forecasts from small-n trends — single
datapoint with structural insight.** Entry 4's 19.5s breaking
the 74.8 → 87.7 → 103.3 monotonic forecast taught the lesson:
3-entry trends overfit when there's structural variation in
orchestration (call-count subclass). Forecast refinement
required naming the subclass variable and refitting per-
subclass. Lesson generalizes beyond latency: any small-n trend
extrapolation should ask "what's the subclass variable I'm
assuming holds constant?" before extrapolating.

**(4) Standing-instructions-produce-reach-for-behavior — single
datapoint.** Earlier in session, "use Playwright whenever
appropriate" instruction nudged WSL Claude toward proposing
Playwright for EC-2 execution despite operator's manual-paste
discipline. Caught by operator pushback. Lesson: standing
instructions imply defaults that compete with case-by-case
reasoning; discipline requires the case-by-case to win when
they conflict. Adjacent to but distinct from
convention-codification-before-operational-preconditions.

**(5) Arc-compounding-without-tripwire — second datapoint.**
First was C10 yesterday (planned as "30 rows surface for
review" executing as multi-investigation + classification
debate + gate-time discovery + re-stage). Today's EC-2 was
planned as "5 entries before pause" but executed as 6
ai_actions (Entry 1 attempt 1 + retry + 4 more) + multiple
halt-investigation cycles + COA-gap re-derivations across each
entry + edit-path verification byproduct. Two datapoints;
codification candidate.

Codification language for the pattern: arcs decompose into
sub-arcs invisibly when the per-task tripwires don't trigger
because each sub-arc is small. Cumulative cognitive load
compounds without per-decision halt-and-surface. Mitigation:
explicit pause-invocation when arc execution shape diverges
from plan-shape, even if no individual sub-arc warrants halt.

### (j) Tomorrow's resume point

Entry 6 of EC-2's 18-target run (target adjusted from spec's
20 due to surface-test slot sacrifices). Entry 6 spec text:

> "Ran payroll for our one employee yesterday. Gross $4,800,
> fed tax withheld $720, CPP $267.84, EI $75.84, net deposit
> to her account was $3,736.32."

Entry 6 is the second multi-line split (5+ lines: gross expense
+ 4 deduction credits + cash credit). COA-gap candidates likely
high: payroll-deduction-payable accounts (federal tax payable,
CPP payable, EI payable) almost certainly don't exist. Best-
available pattern likely 2200 Accrued Liabilities for all 3
deductions (consistent with Entry 5's GST handling).

**Halt monitors at session end:**
- Per-call $0.50 budget remaining (not consumed today)
- Chunk-1 cumulative $0.92 remaining (vs $1.50 halt) —
  comfortable
- Run cumulative $2.42 remaining (vs $3.00 halt) — comfortable
- Latency-trend tracking: 3-call entries continue rising
  (~9-15s/entry); 2-call edge case for edit-flow only
- Bright-line halts unchanged

**Operator action items for tomorrow's resume:**

- Fresh `session-init.sh` with new label (S8-0424 or
  arc-descriptive)
- Restart dev server with proper `tee` pipe to fresh log file
- Verify session_start window — today's session_start was
  `2026-04-23T03:05:18Z`; tomorrow's run continues from same
  EC-2 session_start so Entry 6's `source='agent'` criterion
  filter still applies (no need to re-cleanslate the test org)
- Pasted prompts continue from spec line where Entry 6 starts
- Bring Entry 6 spec text + COA payroll-deduction pre-check up
  before paste

**Push decision (held, three named unhold conditions same as
prior closeouts):**

- (a) Audit session and Prompt 4 session both confirmed as not
  expecting to push their own commits separately
- (b) Enough time has passed that other sessions' push-intent
  is moot
- (c) A new arc requires pushing for arc-specific reasons

At commit time today: branch will be N ahead of `origin/staging`
(C10 + closeout = 2 today, plus prior held commits and the
Session M `49ce364` interleave). Cross-reference at read-time
via `git log origin/staging..staging` for accurate count.

## Phase E — Session 8 C6 EC-2 actual run + C11 codifications (2026-04-24/25)

### (a) Run window + outcome summary

**Run window:** 2026-04-24 23:12 UTC → 2026-04-25 21:32 UTC (spans
UTC midnight rollover; ~22.3 wall-clock hours including a ~19-hour
operator break; agent-active session-time ~3 hours).

**Session lock labels:** S8-0424 (initial), S8-0425 (relabeled at
break-resume per Session Labeling Convention).

**Active agent_session:** `fb89b62c-adc0-4b6a-8e73-8ee816ff02ad`
(persisted across the entire run; 32+ turns by Entry 12).

**Target org:** `22222222-2222-2222-2222-222222222222` (Bridge Real
Estate Entity DEV) — controller persona. Wrong-org routing inherited
from S8-0423's resume prompt was caught at session-start and
corrected to Real Estate fixture before any productive entry (see
section (e) finding #1 + cluster cross-reference).

**Outcome:** **10/20 productive entries posted + 1/1 ambiguity-test
PASS + 1 failed entry (halt fired).** Run ended at hard-rule halt
on Entry 12 attempt 2 — reproducibility across consecutive attempts
with identical signature pattern.

| Class | Count | Detail |
|---|---|---|
| Productive entries (criterion (a) `source='agent'`) | **10/20** | JEs #1–10 |
| Ambiguity tests passed | **1/1** | Entry 11 (EC-11 hallucination-resistance: clarifying question, no card render) |
| Failed entries (with documented orphans) | **1** | Entry 12 (two attempts, both AGENT_STRUCTURED_RESPONSE_INVALID) |
| Total `ai_actions` orphans staled | **7** | 5 OI-2 + 2 structural-response-invalid |

### (b) Pass-criteria evaluation

| Criterion | Status | Evidence |
|---|---|---|
| (a) `source='agent'` target 20/20 | **PARTIAL — 10/20** | All 10 productive entries `source='agent'` confirmed in DB |
| (b) `ai_actions` ↔ `journal_entries` join integrity | **PASS** | All 10 verified at per-entry JOIN check; idempotency_key linked correctly bidirectionally |
| (c) Ledger balanced + deferred-constraint compliance | **PASS** | Every JE balanced (DR=CR); period-locked checks clean; INV-AUDIT-001/002 untouched |
| (d) Cost rollup | **DEFERRED** | This-run worst-case WSL est ~$2.78–$2.93 of $3.00 single-run ceiling. Cumulative across S8-0421/0422/0423/0424/0425 deferred to operator Anthropic dashboard cross-reference (`ai_actions.response_payload.cost_usd` not populated for this run; chunk-1/2 telemetry hole from dev-server log-capture gap recurrences — see finding #7 — is the root cause of the in-DB cost-attribution gap) |

### (c) Sensible-accounting narrative

**Path-1 default pattern (Entries 3 and 10).** On tax-inclusive
corp-card purchases ($187.43 Staples; $94.20 Balzac's), agent chose
Path-1 (full-to-expense) over Path-B (split GST ITC asset + PST-
rolled-into-expense). Spec accepts both; agent's choice is rubric-
clean. Real-world accounting cost: agent leaves recoverable GST ITC
on the table on every tax-inclusive tangible-goods entry and that
compounds over time. **Phase 1.3+ refinement candidate** — prompt-
layer nudge OR spec-layer tightening for the tangible-goods/corp-
card/tax-inclusive compound.

**Entry 6 employer-side payroll burden.** Spec-clean payroll entry
covered employee-side mechanics only (gross + 3 withholding
liabilities + cash). Agent did not proactively offer employer-side
burden (CPP match, EI premium, EHT/WCB). **Anti-hallucination
correctly prevented fabrication** — prompt didn't supply employer-
side numbers. Phase 1.3+ candidate: a `bookPayrollEntry` tool
computing employer-side burden from province + current rate tables,
OR a prompt-layer follow-up.

**Entry 7 prepaid amortization.** Spec-clean policy-purchase booking
(DR Prepaid Insurance / CR Cash for $6,000; coverage window
May 1 2026–Apr 30 2027 in description and prepaid-leg memo). Agent
did not proactively offer to schedule the 12 monthly $500
amortization entries. Anti-hallucination correctly stuck to prompt
content. Phase 1.3+ candidate: when agent books a prepaid asset,
proactively ask whether to schedule the amortization entries —
recurring-journal substrate from Arc A makes this feasible.

**Entry 10 April 18 date — degraded-commitment artifact.** Spec
target was April 17 (last Friday from operator-PDT 2026-04-24).
Agent committed to April 18 (Saturday) on attempt 3 after two byte-
identical re-pastes under the OI-2 stall pattern. Accounting fields
(DR 5730 / CR 2010 / $94.20) clean; date is wrong by one day.
**Operator disposition (a)** — leave April 18 in run record as
degraded-commitment-under-OI-2 artifact; document as Phase 2
evidence; defer correction to post-fix verification run.

### (d) Two-class failure inventory

**Class 1 — OI-2 stall (false-success narration). 5 events across
4 entries (6, 8, 9, 10).** Agent emits an `agent.response.natural`
template variant claiming the proposed entry card rendered ("ready
for your review above") but no card actually rendered in the UI.
The `postJournalEntry` tool call wrote a `pending` ai_action
(orphan); something downstream — UI-render validation on
`entry_date`, template selection, or similar — broke silently.
**Trigger condition (refined):** relative-date-token AND proximity
to UTC-rollover; pre-rollover stall rate on relative-date prompts
~50% (1/2: Entry 6 stalled, Entry 7 did not despite being closer
to rollover); post-rollover stall rate 100% (4/4: Entries 8, 9,
10, plus rolled-over Entry 6 attempts). **Recovery:** 0% agent
self-recovery; 100% required operator intervention (re-paste,
often with explicit date anchor — Entry 8 only recovered after
operator added explicit "April 24" anchor on attempt 3). **Mid-run
reclassification:** initial framing was "prompt leak"; reclassified
mid-run to render-failure-with-false-success-narration after
operator clarified no card rendered (see retraction R-#10 in
section (j)).

**Class 2 — Structural-response-invalid. 2 events on 1 entry (12).**
Agent successfully calls `postJournalEntry` with valid, ideal
`tool_input` (entry_date 2026-04-25, DR 5710 spec-match, CR 1000,
balanced cents-exact); then fails to emit any valid `respondToUser`
call across `STRUCTURAL_MAX_RETRIES` iterations. Orchestrator emits
canned `agent.error.structured_response_missing` template per master
§6.2 item 5 (`src/agent/orchestrator/index.ts:777-808`). **Documented
orchestrator behavior — not novel.** What's novel is seeing it fire,
not the existence of the handling. **Hypothesis weighting (post-
reproducibility):** context saturation at high turn count (~32+
turns) strongly favored. Reproducibility eliminates random
transient and Anthropic API output-format degradation; tool_input
was clean on both attempts → prompt shape not the cause; failure
is specifically in the second-half-of-orchestrator-loop (post-
tool-call respondToUser emission). **Recovery in this run:** 0%;
second attempt produced identical failure; hard rule fired; halt
mandatory.

### (e) All findings (with cross-references to scratch files)

1. **Wrong-org routing** — caught at session start. Bridge Holding
   (`11111…`) targeted by inherited resume prompts; corrected to
   Real Estate (`22222…`) before any productive entry. Source: spec
   uses `<test_org_id>` placeholder; operator UI default carried
   over from prior session. See `/tmp/s8-0424-wrong-org-finding.md`.
2. **OI-2 UTC-rollover gap surfaced live** — first observation
   Entry 8 first-attempt; later mid-run reclassified from "prompt-
   leak" to render-failure-with-false-success-narration after
   operator clarification. Mechanism documented in
   `src/agent/prompts/suffixes/temporalContext.ts:24-30` (Phase 1.2
   simplification: UTC-only injection because `organizations.timezone`
   not yet shipped). See `/tmp/s8-0424-oi-2-finding.md`.
3. **Structural-response-invalid as new failure class** — Entry 12,
   reproducible across 2 attempts, separate from OI-2. See
   `/tmp/s8-0424-oi-2-finding.md` "NON-OI-2 FINDING" section at top.
4. **Pre-staged SQL three-error catch** (Entry 8 stale-handling
   path) — external-consultant pre-staged SQL used non-existent
   column (`resolved_at`), wrong status (`rejected` vs canonical
   `stale`), and wrong table-target framing. WSL Claude verified
   live schema + b0eddc53 precedent + check constraint before
   executing. See `/tmp/s8-0424-oi-2-finding.md` "Stale-handling
   for first-attempt card (schema-corrected)" section.
5. **Tax-inclusive sensible-accounting Path-1 default** — Entries
   3 and 10. See `/tmp/s8-0424-sensible-accounting-notes.md`.
6. **Latency-not-caching paradox** — post-credit-top-up Entries
   2–7 showed 12–16s warm-state latency; `cache_read_input_tokens=0`
   on all calls falsifies caching hypothesis. Mechanism unexplained
   from external view. See `/tmp/s8-0424-latency-pattern.md`.
7. **Dev-server log-capture gap (3 recurrences)** — operator pasted
   `pnpm dev` without `tee` redirect at original chunk-1 start,
   chunk-2 restart, and break-restart. Resolved at chunk-3 only
   (post-break restart with operator-confirmed tee in process tree).
   Root cause of the chunk-1/2 in-DB cost-attribution gap noted
   in section (b) criterion (d). See
   `/tmp/s8-0424-dev-server-observations.md`.
8. **Convention #10 EC-direction sub-track sources** — 7 datapoints
   consolidated for sub-track introduction; see section (h).
9. **Convention #11 candidate** — per-entry tripwire-A preflight
   on session orphan state; not OI-2-specific. See section (i)
   for codification source-evidence + rationale.
10. **Type-conditional / sub-class taxonomy retracted mid-run** —
    Entry 9 initially classified "OI-2 type-immune" because
    adjusting-entry semantics; falsified when retroactive orphan
    discovered (Entry 9 prompt has "this month" relative-date
    token → vulnerable). Sub-class B (weekday-arithmetic drift)
    for Entry 10 retracted entirely; Entry 10's April 18 is
    degraded-commitment-under-byte-identical-re-paste, not a
    calendar-arithmetic error. Sub-class A (UTC-rollover) is the
    only real OI-2 sub-class; broader than initially characterized.
    See `/tmp/s8-0424-oi-2-finding.md` "CORRECTED MECHANISM"
    section. (Two of the three retractions in this finding land
    in retraction sub-track R-#11 and R-#12 — see section (j).)
11. **Session-lock PID staleness when session-init.sh runs via
    Bash tool** — structural artifact, not a bug introduced this
    session. `$$` captures script-shell PID which dies when Bash
    tool returns. See `/tmp/s8-0424-dev-server-observations.md`.

**Cluster cross-reference.** Findings #1 (wrong-org), #2 (OI-2
UTC-rollover), and #4 (pre-staged-SQL schema mismatch) are
datapoints for the existing **"Re-verify Environmental Claims at
Each Gate"** convention (`docs/04_engineering/conventions.md` §
under "Phase 1.2 Conventions"). This run contributes three
datapoints to that existing convention's continued evolution —
distinct from the C10 EC-direction sub-track (section (h)) and
C11 codification (section (i)) tracks. Local capture in
`/tmp/s8-0424-oi-2-finding.md` (lines 480–484, 495–500) and
`/tmp/s8-0424-wrong-org-finding.md`.

### (f) OI-2 fix stack (6-item, slotted pre-C11 closeout)

**Minimum scope to ship Phase 1.2 close.** Scope-doc framing:
trigger mechanism partially characterized; deterministic-resolution
stack is the correct response regardless of full mechanistic
clarity. If we can't fully characterize when the LLM fails, we
shouldn't trust it to resolve dates at all.

1. **User-local timezone injection.** `temporalContext.ts` reads
   org timezone (or browser tz, or session metadata) and emits
   both UTC and local stamps with distinguishing labels.
2. **Deterministic date resolution.** Server-side resolution of
   relative-date tokens at prompt-construction time, not LLM
   arithmetic at response time.
3. **Day-of-week validation.** When agent emits a date, validate
   that the resolved date's actual day-of-week matches any prompt
   day-of-week token; refuse on mismatch.
4. **Refuse-on-ambiguity for span-prompts.** "Last week", "this
   quarter" span tokens require operator-clarification rather than
   LLM point-date selection.
5. **Confidence-thresholded commit.** Date resolutions below
   confidence threshold surface to operator for explicit
   confirmation rather than committing silently.
6. **Defer org-level timezone (Phase 2).** Schema migration adding
   `organizations.timezone` field + resolver in
   `temporalContextSuffix` — Phase 2 resolution. Phase 1.2 ships
   without this if items 1–5 sufficient via session-metadata /
   browser-tz route.

### (g) Separate workstream — structural-response-invalid

**NOT in OI-2 fix stack.** Hypothesis: context-window saturation
at high turn counts (~32+ turns) producing respondToUser emission
failures despite clean tool_input. Mitigations to investigate in a
future scoping pass:

- Agent-session rotation thresholds (cap turn count per session)
- Context-window monitoring with proactive truncation
- Structural-retry budget calibration (currently
  `STRUCTURAL_MAX_RETRIES`; re-tune?)
- Session-state liveness checks before respondToUser emission
- Whether specific accumulated context (the 7 prior stale rows?
  the rejected card? the 5 OI-2 false-success narrations?)
  contributes to the failure surface

**Not a Phase 1.2 close-out blocker.** Recommend separate design
commit if investigation confirms reproducibility on future runs
(today's evidence already strongly supports — reproduced 2/2).

### (h) Convention #10 EC-direction sub-track (7 new datapoints; sub-track formally introduced this commit)

**Sub-track structure formally introduced to Convention #10 this
commit.** The convention covers two operational phases of epistemic
discipline under uncertainty: pre-claim hygiene (EC-direction sub-
track, new) and post-claim correction (retraction sub-track,
existing). Rationale and prior-datapoint grandfathering (9 priors
remain in retraction sub-track unaltered) documented in the
`conventions.md` Convention #10 amendment landing as Commit 2 of
this closeout. Numbering below is sub-track-internal, not session-
cumulative.

- **EC-#1 Stream-existence ≠ persistence.** Log-capture gap
  inference error: an open log stream was treated as evidence of
  DB persistence; it isn't. Log presence is necessary but not
  sufficient. EC must verify persistence via DB query, not stream
  observation.
- **EC-#2 Visible-trace ≠ total-cost.** Orphan-trace cost
  undercount: cost estimates derived from visible operator-paste
  log-lines understate actual spend because orphan ai_action
  tool-calls (no card rendered, no operator-paste resumption)
  contribute cost without a paste-line trace. EC cost estimates
  must add explicit orphan-line accounting.
- **EC-#3 Visible-trace ≠ operator-action-context.** Operator
  re-paste as mitigation (not agent self-recovery): a re-pasted
  prompt that produces a successful entry on attempt-N can read
  as agent self-recovery from the trace alone. Load-bearing for
  the OI-2 reclassification — the `agent.response.natural` "ready
  for your review above" emission on attempt-1 was first-classified
  as agent-recovered when in fact it was operator-recovered via
  explicit-anchor re-paste.
- **EC-#4 Operator must approve stale-handling SQL before
  execution.** Even when consultant ratifies. Established mid-run
  across 7 stale operations after the b0eddc53/Entry 8 path
  surfaced two schema-mismatches in pre-staged SQL (column
  `resolved_at` doesn't exist; status `rejected` is for operator-
  rejection, not never-rendered cards). Mutual flag-and-retract
  protected the run from a wrong-shape stale-handling write.
- **EC-#5 EC asks for operator-narration before classifying a
  new agent-behavior pattern requiring action.** When EC observes
  a new pattern that requires operator intervention (reject,
  re-paste, explicit anchor), EC asks the operator to narrate the
  action and motivation before classifying the pattern. Should
  have fired at Entry 8 first-attempt; didn't, and mis-
  classification propagated through 4 entries (per EC-#3 above).
- **EC-#6 EC cost estimates flagged as lower bounds when multi-
  paste behavior is visible** in operator screenshots. Companion
  to EC-#2: when log-line traces are incomplete (telemetry hole +
  orphan-line gap + visible re-paste behavior), report cost as
  lower-bound range, not point estimate.
- **EC-#7 EC infers from DB-visible state with explicit "based
  on what's visible" qualifiers.** For claims requiring filesystem
  or operator-action context beyond the DB, EC asks rather than
  infers.

### (i) Convention #11 codification source — per-entry tripwire-A preflight

**Codification source-evidence + rationale; canonical text deferred
to Commit 2 `conventions.md` write.**

Per-entry tripwire-A preflight on session orphan state. Generic
pending-orphan check (`SELECT COUNT(*) FROM ai_actions WHERE
session_id=<current> AND status='pending'`) before each operator
paste. Caught all 7 staled orphans correctly across both failure
classes (5 OI-2 + 2 structural-response-invalid) — the mechanism
is failure-class-agnostic. Not OI-2-specific. Generalizes to: any
session that posts via the agent should preflight pending-orphan
state at the entry boundary, regardless of what's expected to fail.

**Codification rationale.** Convention #11 lands as a sibling to
Convention #10's EC-direction sub-track (per (h) above): both are
pre-claim/pre-action hygiene rules, but C11 is about session-state
verification and C10 EC-direction is about EC-claim qualification.
They reinforce rather than overlap. Canonical text + naming slot
in `conventions.md` catalog land at Commit 2.

### (j) Convention #10 retraction sub-track (3 new this run; mainline cumulative through Session 8 C6 = 9 prior + 3 = 12)

The three retractions from this run continue the existing retraction
sub-track session-cumulative numbering (R-#10 through R-#12). The
9 priors per friction-journal.md line 4665 (Session 8 mainline
retraction-track scope; excludes 2 S8 O3-arc retractions captured
separately in `conventions.md` Convention #10 codification-trigger
set datapoints #7–#8) + 3 this run = **12 mainline cumulative
through S8 C6**. No Phase D additions verified.

- **R-#10 — UTC-midnight Entry-8-attempt-1 prompt-leak
  misclassification.** Initial framing of the OI-2 stall pattern
  was "prompt leak" (relative-date tokens leaking into agent's
  UTC-anchored context, producing date drift). Mid-run reclassified
  to render-failure-with-false-success-narration after operator
  clarified no card rendered. Reclassification cost: 4 entries'
  worth of mis-classification before retraction; caught when
  operator surfaced the missing-card observation. Tightly coupled
  to EC-direction sub-track datapoint EC-#3 — the reclassification
  is the load-bearing forcing-function for that pre-claim hygiene
  rule.
- **R-#11 — Sub-class B (weekday-arithmetic drift) for Entry 10
  retracted entirely.** Entry 10's April 18 (Saturday) vs spec
  April 17 (Friday) was first classified as a calendar-arithmetic
  error class within OI-2's sub-class taxonomy. Falsified when
  byte-identical re-paste analysis showed the third attempt
  committed identically to attempts 1+2 (no calendar arithmetic
  involved); the actual mechanism is degraded-commitment-under-
  byte-identical-re-paste. Sub-class B does not exist as a real
  OI-2 sub-class.
- **R-#12 — Entry 9 "OI-2 type-immune" claim.** Entry 9
  (depreciation, adjusting entry, posted 2026-04-25 00:52 UTC)
  was first classified as "OI-2 type-immune" because adjusting-
  entry semantics anchor to fiscal-period-end rather than relative-
  date-tokens. Falsified when retroactive-orphan discovery showed
  Entry 9's prompt contained "this month" (relative-date token);
  vulnerability is type-conditional, not type-immune. Refines OI-2
  sub-class taxonomy to: today/yesterday simple-entries vulnerable;
  adjusting/period-end entries conditionally vulnerable on
  relative-date tokens.

### (k) Scratch-provenance (run-record housekeeping)

9 files retained at `/tmp/s8-0424-*.md` through close. 7 canonical
(per Session 8 inventory); 2 superseded — `resume-brief.md`
chunk-2 procedural handoff, fully superseded; `utc-midnight-
rollover.md` pre-reclassification OI-2 draft, lines 83–94 third-
datapoint framing folded into `oi-2-finding.md` and the cluster
cross-reference in section (e). All retained for run-record
archaeology; not load-bearing for next session.

### (l) Carry-forward

- **OI-2 fix stack (6-item)** — gating for next paid-API session.
  Ship items 1–5 minimum; defer item 6 (org-tz schema migration)
  to Phase 2 if items 1–5 sufficient.
- **Structural-response-invalid investigation** — separate design
  pass per section (g). Hypothesis: context-window saturation at
  high turn counts. Mitigation surface listed.
- **Entries 13–20 + Entry 12 retry** — fresh-session re-run gate.
  Run from a fresh `agent_session` (not continuing
  `fb89b62c-...`); context accumulation is a known confound for
  Class 2.
- **OI-2 deferral framing reassessment.** Phase 1.2 deferred OI-2
  to Phase 2 without behavioral-footprint data. Footprint now:
  ~100% stall rate on relative-date prompts post-UTC-rollover; 0%
  agent self-recovery. Phase 2 priority should be reassessed at
  the next planning gate.
- **Sensible-accounting Phase 1.3+ candidates** — Path-1 default
  prompt nudge; `bookPayrollEntry` employer-side tool;
  prepaid-amortization scheduling proactive ask.

### (m) C6 disposition + Session 8 state through C6

**SHIP AS PARTIAL.** This entry captures: 10 productive + 1/1 PASS
+ 1 failed-entry inventory; all findings with scratch cross-refs;
OI-2 fix stack scope (6-item, pre-C11); structural-response-invalid
as separate workstream (post-Phase-1.2); EC-direction sub-track
formally introduced to Convention #10 with 7 datapoints; 3 new
retractions in retraction sub-track (cumulative 12); Convention
#11 codification source. Future paid-API session deferred until
OI-2 fix stack lands and a fresh `agent_session` is initialized.

**Session 8 state through C6 (this entry):**

- Convention #10 retraction sub-track: **12 mainline cumulative
  through S8 C6** (9 prior per friction-journal.md line 4665,
  Session 8 mainline scope; + 3 this run; no Phase D additions; 2
  S8 O3-arc retractions captured separately in `conventions.md`
  C10 codification-trigger set datapoints #7–#8 are not counted
  in this mainline ledger).
- Convention #10 EC-direction sub-track: **7 datapoints** (sub-
  track formally introduced this commit; sub-track-internal
  numbering EC-#1 through EC-#7).
- Convention #11: **codified as new convention this commit**
  (canonical text in `conventions.md` per Commit 2; this entry
  carries source-evidence + rationale only).
- "Re-verify Environmental Claims at Each Gate" convention:
  **3 new evolution datapoints** this run (findings #1, #2, #4
  per cluster cross-reference in section (e)).
- Paid-API spend: this-run worst-case ~$2.78–$2.93 of $3.00
  single-run ceiling; cumulative S8 deferred to operator dashboard
  cross-reference.
- Single-run halt threshold ($3): not exceeded this run.

### (n) OI-2 fix-stack closeout NOTEs (post-implementation)

Three follow-up items surfaced during OI-2 fix-stack
implementation (foundation commit `6896f4b`, validation commit
`91a317f`). None block C7 EC-13 verification — flagged here so
they don't drift into archaeology.

**NOTE 1 — `reverseJournalEntry` dow-gate scope deferral.**
Validation-commit gate B (day-of-week validation) is scoped to
`postJournalEntry` only via an explicit `if (tu.name ===
'postJournalEntry')` guard in the orchestrator. The dispatcher
pattern means broadening to `reverseJournalEntry` is a one-line
change, but the date semantics differ enough (operator typically
picks the reversal date from a known set, not arithmetic from a
relative phrase) that the brief's recommendation to defer was
ratified. Revisit trigger: a real-world reversal-prompt
mismatch surfacing during C7 verification or later operator
runs. Until then, scoped to `postJournalEntry` matches the C6
evidence base.

**NOTE 2 — `source_phrase` granularity in
`agent.error.entry_date_dow_mismatch`.** Gate B's
`detectPromptWeekday` helper currently returns the bare weekday
name as `phrase` (e.g., `'friday'`), not the full qualified
phrase (e.g., `'last friday'`). The dow_mismatch template's
`source_phrase` param therefore surfaces the bare token. Richer
context (preserving the `last|this|next` qualifier) would
require detecting the qualifier-prefix optionally and threading
it into the helper's return shape. Deferred for the validation
commit to keep the diff narrow. Revisit trigger: operator
feedback that the bare weekday in error UI is too terse, or a
case where the qualifier carries load-bearing intent for the
clarification flow.

**NOTE 3 — Carry-forward `accountLedgerService.test.ts`
failures.** Two tests in
`tests/integration/accountLedgerService.test.ts` (`returns
ordered rows with correct running-balance for three ascending-
date entries on Investments in Subsidiaries` and
`running_balance is debit-positive: credit contribution on
Intercompany Receivables yields negative delta`) were verified
pre-existing on baseline `f935efc` via `git stash` + isolated
re-run during the foundation-commit ratification turn. Same
failure shape (running-balance arithmetic on specific accounts;
diff values on the order of 600–3000 from expected), same line
numbers (`accountLedgerService.test.ts:269` and `:346`),
unchanged through both fix-stack commits — full-suite tally
moved 519/521 → 533/535 from foundation to validation; the
failure count stayed at 2. Likely an account-fixture / seed-
pollution issue independent of OI-2 (the fix stack does not
touch ledger arithmetic, account migration, or running-balance
computation). Revisit trigger: dedicated diagnostic pass on the
ledger-arithmetic surface, or a regression that causes the count
to grow beyond 2.

**NOTE 3 update (2026-04-26, C7 EC-13 closeout):** Reclassified
to non-deterministic state-sensitivity. See section (o) Obs-B'
below — Phase B's Hard 3 (535/535 clean) and Phase C's Hard 3
re-runs (534/536) hit different states from the same seed.

### (o) C7 EC-13 — OI-2 fix-stack paid-API verification run

*Captured in `phase-1.2-retrospective.md` §3 Pattern 6 (Meta A first application: D1 coverage trichotomy, D2 cost trichotomy, D3 spec-runtime tuple, D4 halt-collision axis-level decomposition).*

### (p) C11 retrospective on C7 EC-13 (2026-04-26)

*Captured in `phase-1.2-retrospective.md` §3 Pattern 6 (Meta A and Meta B drafting + Convention #11 rename).*

## Vercel deploy fix — typescript-eslint plugin under pnpm (2026-04-26)

A streak of failing Vercel preview deploys all errored at the
ESLint step with `Definition for rule
'@typescript-eslint/no-explicit-any' was not found` from
`src/components/canvas/LineEditor.tsx:77,79`. Build compiled
fine; ESLint blew up. This entry records the root cause, the fix,
the diagnostic signal that confirmed the fix, and the
follow-up items filed separately.

### A. Root cause

The `@typescript-eslint` plugin was previously resolved
ambiently via npm's flat-tree hoisting. Nothing in
`eslint.config.mjs` declared it — the config only extends
`next/core-web-vitals`, which does not reference
`@typescript-eslint/*` rules; `next/typescript` (which does)
was never extended. The inline disable comments in
`LineEditor.tsx` (load-bearing `any` on the
`UseFormRegister<any>` type, documented at the file top)
happened to find the plugin in `node_modules` because some
transitive dependency had hoisted it there.

The npm → pnpm migration (visible in build logs as `Package
Manager changed from npm to pnpm`) exposed the latent gap.
pnpm's strict, non-hoisted `node_modules` stopped exposing
transitive peer deps the way npm's flat tree did. ESLint 9 also
turns unknown rule references in disable comments into hard
errors rather than the silent ignores ESLint 8 produced. The
combination converted a long-standing ambient dependency into a
build-blocker.

This is **not** a Next 15 regression. Under npm hoisting this
would have continued to "work by accident" indefinitely. If the
project ever migrated back to npm or someone forked it under
npm, the same ambient resolution would re-occur — the latent
gap would be re-hidden, not re-fixed. Worth being explicit about
the attribution because "Next dropped it" is the wrong-but-
plausible story a future reader would land on.

### B. Fix

Local commit `e19cc91` on `staging`:

- `pnpm add -D typescript-eslint` (8.59.0)
- `eslint.config.mjs`: spread `tseslint.configs.recommended`
  before the `FlatCompat` block. Order matters — parser setup
  must precede next's config, otherwise next can clobber the
  parser typescript-eslint needs.
- Configure `@typescript-eslint/no-unused-vars` with
  `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`,
  `caughtErrorsIgnorePattern: '^_'` to match the codebase's
  existing underscore-prefix convention for intentionally-unused
  params; downgrade to `warn` so the 3 remaining genuine
  findings don't block the build.

Lint state after fix: 0 errors, 6 warnings (cleanup deferred).
Local `pnpm build` green. Vercel preview deploy green after
push + Supabase env-var update (see §D).

### C. Diagnostic signal — lint-flip

After the install, the lint output for `LineEditor.tsx:79`
flipped from:

> Error: Definition for rule
> '@typescript-eslint/no-explicit-any' was not found.

to:

> Warning: Unused eslint-disable directive (no problems were
> reported from '@typescript-eslint/no-explicit-any').

This is a high-signal confirmation: the rule is now both
*registered* and *active*. `report-unused-disable-directives` is
on under `tseslint.configs.recommended`, so the directive is
being evaluated against actual violations and found
unnecessary. The inverse failure mode (install present in name
only, plugin not actually loaded) would have left the
"unknown rule" error in place. Worth remembering as a debugging
tell for plugin-resolution issues: *unknown* → *unused* is the
shape that says "fully wired."

(Side observation: line 77's disable is still load-bearing —
`register: UseFormRegister<any>` does use `any`. Line 79's
disable was always stale — `errors: FieldErrors<FieldValues>`
doesn't use `any`. Cleanup item filed; not addressed in the
build-fix commit.)

### D. Runtime verification — Supabase env-var mismatch

After push and a green Vercel build, the staging login form
returned `{"code":"invalid_credentials","message":"Invalid login
credentials"}` (HTTP 400). The 400-with-JSON-body shape
confirmed:

- `NEXT_PUBLIC_SUPABASE_URL` reaches a real Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid for that project (a
  bad key would have produced a 401 about the API key, not a
  400 about credentials)
- The build picked up the new env values (no stale bundle)
- Network path, DNS, CORS — all fine

The `controller@thebridge.local` test user simply does not exist
in the new project — it has no migrations applied and no seed
data. This is a runtime-state mismatch, not a deploy-pipeline
issue. Filed as a follow-up item (§E item 2); explicitly out of
scope for the deploy fix.

### E. Follow-up items filed (not fixed in this work)

1. **packageManager mismatch.** `package.json#packageManager`
   declares `pnpm@9.0.0` while `pnpm-lock.yaml` is generated by
   `pnpm@10.x`. Vercel tolerates this (warning, not failure)
   but the divergence travels with this commit — `pnpm add -D
   typescript-eslint` regenerated the lockfile under local pnpm
   10, so the mismatch is now baked into a fresh artifact
   rather than a stale one. Same *shape* of problem as the
   ambient-plugin issue (declared metadata diverging from
   actual runtime, papered over by tooling tolerance), kept
   separate by the same principle that kept the lint cleanup
   separate.
2. **Staging Supabase project rebuild.** New project is empty.
   Migrations from `supabase/migrations/` need to apply, then
   seed scripts. Scope uncharacterized — could be 15 minutes if
   migrations apply cleanly, could be 2 hours if they've
   drifted. Stage 2 work; not blocking for the deploy fix.
3. **Lint cleanup commit (the 6 warnings).**
   `BasicBalanceSheetView.tsx:10` unused `MoneyAmount` import;
   `taxCodeService.ts:25` and `invitationService.ts:230` `ctx`
   params should be `_ctx`; `LineEditor.tsx:79` stale
   `eslint-disable` directive (line 77's is still valid);
   `confirm/route.ts:93` stale `no-console` disable;
   `mfa-enroll/page.tsx:81` pre-existing `<img>` warning
   (unrelated). To land on a clean baseline after Vercel
   confirms green.
4. **`NEXT_PUBLIC_APP_URL` per-branch concern.** If staging is
   the only branch deploying as Preview, the static value
   works. If multiple feature branches deploy as Previews, the
   static value will be wrong for all non-staging Previews —
   `NEXT_PUBLIC_*` is baked at build time, so a runtime fallback
   to `VERCEL_URL` would be the cleaner long-term shape.
   Surfaced during env-var setup planning; not addressed.

### F. Process slips worth recording

1. **`session-init.sh` accepts any string as label, including
   flag-shaped strings.** Initial invocation was
   `scripts/session-init.sh --help` (intent: see usage); the
   script silently created a session lock named `--help`. No
   validation on label shape. Cleaned up via `session-end.sh`
   and re-initialized with proper label `vercel-deploy-fix`.
   Not at codification threshold; flagged in case the same
   mistake recurs.
2. **`COORD_SESSION` shell-scope foot-gun.** Each Bash tool
   invocation is a fresh subshell. `export COORD_SESSION=...`
   in one call does not carry to subsequent calls. For
   short multi-commit runs, inline-prefix
   (`COORD_SESSION='label' git commit ...`) is the simplest
   discipline. A wrapper that reads
   `.coordination/session-lock.json` back into env at the top
   of each command would centralize this if session-lock-aware
   work becomes a regular pattern; over-engineered for a single
   session.

### Session bookkeeping

- **Session label:** `vercel-deploy-fix` (closed)
- **Branch state:** `staging` at `e19cc91` (1 commit ahead of
  origin pre-push; pushed during this session)
- **Lint baseline post-fix:** 0 errors, 6 warnings
- **Vercel deploy state:** preview green; runtime auth blocked
  on empty Supabase project (separate Stage 2 work)

### (q) C12 — Phase 1.2 closeout (2026-04-26)

**Date:** 2026-04-26 (UTC), session S14-c12-phase-1-2-closeout-0426
**Status:** Closed under Reading B — OI-3 / Class 2 fix-stack
work extends into Phase 2. Phase 1.2 closes with five durable
inheritance artifacts plus this commit's five C12 deliverables.
**Author SHA at session start:** `e4c069f`

#### C12 narrative

C12 closes Phase 1.2 under Reading B. Five deliverables landed
in this commit:

- **D1** Phase retrospective at
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  (920 lines, 9 sections — phase summary, inheritance-artifact
  map, 8 phase-level patterns, Phase 2 inheritance narrative,
  calibration data, honest limitations, what to keep/change,
  Phase 2 starting state).
- **D2** 27-EC matrix final dispositions at
  `docs/09_briefs/phase-1.2/ec-matrix.md` (in-place updates).
  EC-2 → PARTIAL 10/20 with verified/attempted/untried split
  per Meta A; EC-13 → PARTIAL with OI-2 verified scope + Class 2
  untested annotation; EC-9 + EC-11 stay DEFERRED with
  annotations naming durable evidence in section (o) and OI-3
  scoping doc; EC-10 stays DEFERRED unchanged. Final totals:
  21 MET / 2 PARTIAL / 7 DEFERRED / 0 MISSED.
- **D3** CURRENT_STATE phase transition at
  `docs/09_briefs/CURRENT_STATE.md`. Header line rewritten to
  name Phase 1.2 close + Phase 2 open; new "Phase 1.2 — Closed"
  section + new "Phase 2 — Inheritance and opening workstreams"
  section added; existing in-flight session-by-session content
  preserved (relabeled as historical record).
- **D4** Phase 2 obligations doc at
  `docs/09_briefs/phase-2/obligations.md` (new file, 433 lines,
  9 sections — named workstreams, deferred ECs, investigation
  queue, sensible-accounting candidates, COA gaps,
  architectural follow-ups, convention split-trigger watch,
  process observations, Phase 2+ deferrals).
- **D5** This entry — section (q) C12 closeout in
  friction-journal.

#### Phase 1.2 final state summary

**Cumulative test count:** 534/536 under shared-DB full-suite
(534 passing, 2 failing on Arc A item 27 — `accountLedgerService`
running-balance fragility, fix shape known per Arc A
retrospective Pattern 3 — migrate to less-polluted account,
1300 precedent; clean baseline under `pnpm db:reset:clean` is
536/536). Phase 1.1 baseline was 49 unit + 26 integration = 75
tests; Phase 1.2 added 461 tests across 8 main sessions and
carve-outs.

**Cumulative paid-API spend:** ~$3.96-$4.11 estimated
(WSL-summed from in-friction-journal records; operator
authoritative dashboard total may differ). Breakdown: Session
4 EC-66 ~$0.02; Session 5/5.1/5.2 EC-20 smoke runs ~$0.05
estimated; Session 8 O3 Entry 1 retry $0.094; Session 8 Phase
D partial run $0.5801; Session 8 Phase E full run ~$2.78-$2.93
(operator dashboard authoritative); Session 8 C7 EC-13
$0.4913.

**Commits since Session 1 anchor `4a62faf`:** 144.

**Durable inheritance artifact list with commit-hash invariants:**

1. Section (p) C11 retrospective on C7 EC-13 — `f221bab`.
2. OI-3 Class 2 fix-stack scoping doc — `161bff8`.
3. Section (o) C7 closeout deliverables (Meta A first
   application) — `52a63f0`.
4. Conventions catalog Meta A + Meta B + Convention #11
   rename — `d2b2f50`.
5. C12 Phase 1.2 closeout (D1+D2+D3+D4+D5) — this commit.

#### Convention #10 retraction sub-track count post-C12

Cumulative through C11 = 17 (12 prior + 4 in C7 + 1 in C11).
No new retractions surfaced during C12 authoring (D1/D2/D3/D4/
D5 stayed within the EC-direction discipline floor without
producing new retraction-track datapoints). Phase 1.2 closes
with the cumulative 17-retraction baseline; Phase 2 inherits
the count.

#### Convention applications during C12 authoring

- **Meta A** applied to D1's pattern-naming sections — 8
  named patterns each carrying their own dimension shape (fire
  count, datapoints, codification status, phase-level lesson).
  Also applied to D2's EC matrix updates (EC-2 verified/
  attempted/untried trichotomy preserved at the matrix-row
  level).
- **Meta B** applied to D4's workstream cross-dependency
  articulation (named workstreams + deferred ECs +
  investigation queue + architectural follow-ups together
  enumerate the cross-component dependencies Phase 2 inherits).
- **Convention #11** applied at session-init-time preflight
  (orphan check on `pending` `ai_actions` rows for the active
  session_id at S14 start; no orphans surfaced).
- **Convention #10 EC-direction sub-track** applied throughout
  authoring — all EC-claim shapes (calibration data, paid-API
  spend totals, test count, commit count) qualified as
  authoritative-vs-estimated where applicable; one
  WSL-summed-vs-dashboard-authoritative caveat surfaced
  explicitly in calibration data (D1 §5; D5 final state above).
- **Spec-to-Implementation Verification (Convention #8)**
  applied to D2's MET spot-checks (EC-3 trace propagation,
  EC-18 persona guardrails, EC-22 invited user — all verified
  via direct file existence check before EC matrix edits).

#### Forward pointer

Phase 2 opens with **OI-3 fix-stack implementation** and
**Class 2 fix-stack implementation** as named workstreams. The
OI-3 implementation chat opens against
`docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md`
on commit `161bff8` as inheritance and resolves the §3c
sub-decision (four-option enumeration on tentative-state
representation) as its first action. The first paid-API gate
Phase 2 hits is OI-3 M1 post-fix validation (synthetic-prompt
harness, $0.50 ceiling, 9 shapes × 3 runs); this is also the
discriminating evidence for whether Class 2 collapses into
OI-3 or extends beyond it.

The full carry-forward queue lives at
`docs/09_briefs/phase-2/obligations.md` (D4 above). Phase 2
brief authors sequence work from the queue per Phase 2 scope
decisions.


