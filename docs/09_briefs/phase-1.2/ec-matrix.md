# Phase 1.2 Exit Criteria Matrix

Classification: **MET** (verified at session anchor SHA), **DEFERRED**
(explicitly carried to Phase 1.3 / Phase 2 with named reason), **N/A**
(not applicable to Phase 1.2 scope), **MISSED** (undelivered EC not
paper-closable; firing this status triggers session-8-brief.md §7 #4
split-point per P38).

Generated during C10 of Phase 1.2 Session 8, 2026-04-23.

Spec-vs-implementation drift on CA-numbering and test-filenames is
noted per-row where applicable. The master brief's Test Catalog
(written at plan time, 2026-01) reserved CA-39 through CA-49 for
specific test filenames; actual execution produced different
CA-numbers and filenames for the same EC coverage. This is a
generalizable Phase 1.2 pattern, captured in the Session 8 Phase 1.2
retrospective (C11 §3) under "Plan-time implementation-detail
specification drifts from execution reality."

Rows are grouped into 6 thematic sections: **Foundations and
Regression** (EC-1, EC-3, EC-7), **Agent Mechanics** (EC-4, EC-5,
EC-12, EC-15, EC-16, EC-17, EC-18), **Paid-API Validation** (EC-2,
EC-9, EC-10, EC-11, EC-13), **User-Facing Surfaces** (EC-6, EC-8,
EC-14, EC-19), **Onboarding + Forms** (EC-20 through EC-27), and
**Shipping line items (unnumbered)**. Section grouping is for
readability; ECs retain their master-brief numbering and can be
cited by EC-N independently.

Schema items S1 (migration 118 applied) and S2 (migration 119
applied) from master brief §20 are deliberately excluded per P38's
scope statement (matrix covers 27 ECs only; schema status lives in
the brief itself, not duplicated here).

---

## §1 Foundations and Regression

| EC | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-1 | Phase 1.1 + 1.5 regression: 162 tests pass | brief §20 line 1290 | `pnpm test` | MET | Verified-green at `bd5cd75` (Session 8 C8 commit; `pnpm agent:validate` green per commit body). Current full-suite count ~412 passing tests substantially exceeds 162 baseline; original Phase 1.1+1.5 surface included in current suite. CA-65 cleanup-pattern regression resolved at `4372d65`; full suite green at gate-time. |
| EC-3 | `trace_id` correlates message → orchestrator → service → audit | brief §20 line 1292 | Integration test | MET | `tests/integration/agentTracePropagation.test.ts` (CA-47 in actual test). Asserts `AgentResponse.trace_id === ctx.trace_id` (return-value surface) and `ai_actions.trace_id === ctx.trace_id` (persisted-artifact surface). Code-level loggerWith binding propagates trace_id through pino child loggers (third surface, code-level invariant). Note: brief reserved CA-47 for `invitationAcceptPage.test.ts`; CA-numbering drifted during execution. |
| EC-7 | Mainframe degradation works without agent | brief §20 line 1296 | Manual test, `phase_plan.md` #7 | MET | Code shipped Sessions 2 §5.4 + Session 4 §5.4 (degradation path, real-API error classification, `AGENT_UNAVAILABLE` when `ANTHROPIC_API_KEY` is unset). Ambient verification: non-agent flows (sign-in, navigation, ledger access) have worked correctly throughout Phase 1.2 development, satisfying the EC's "works without agent" criterion. Dedicated adversarial smoke test (API key intentionally absent to force the degradation path) not performed as discrete event; implicit in every non-agent dev-usage session. |

---

## §2 Agent Mechanics

| EC | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-4 | Idempotency: duplicate confirm returns existing, no second row | brief §20 line 1293 | Integration test | MET | `tests/integration/apiAgentConfirmIdempotent.test.ts` (CA-61 in actual test). Asserts: dry-run write → POST `/api/agent/confirm` → 200 with `journal_entry_id` → POST confirm again → 200 with the same `journal_entry_id`. Only one `journal_entries` row exists. Note: brief reserved CA-39 for `agentIdempotency.test.ts`; reality is CA-61 / `apiAgentConfirmIdempotent.test.ts`. |
| EC-5 | Tool-call retry: 2 retries then clarification | brief §20 line 1294 | Integration test | MET | `tests/integration/agentRetryBudget.test.ts` (CA-42 in actual test). Per docstring: Q13 tool-validation retry budget — max 2 retries after initial attempt; three consecutive validation failures surface clarification template rather than a fourth retry. Note: brief reserved CA-40 for `agentToolRetry.test.ts`; reality is CA-42. |
| EC-12 | Dry-run → confirm round-trip on 3 entries | brief §20 line 1301 | Integration test | MET | `tests/integration/apiAgentConfirmIdempotent.test.ts` (CA-61) covers the round-trip mechanism (dry-run write → confirm → posted journal entry) end-to-end. Brief's "3 entries" specification not literally implemented as a 3-entry-batch test; single-entry round-trip in CA-61 exercises identical code path / invariants. The "3 entries" specification was a planning-level reliability framing that wasn't operationalized as a per-entry-count gate. |
| EC-15 | Clarification-question path without incrementing retry | brief §20 line 1304 | Integration test (specced `agentClarification.test.ts` / CA-43; absent in repo) | DEFERRED | No dedicated test for EC-15's specific assertion (clarification path doesn't increment Q13 retry budget). Related but inverse coverage exists in `agentRetryBudget.test.ts` (CA-42) for clarification template firing AFTER Q13 budget exhaustion — different direction from EC-15's spec. Code-level invariant likely holds (orchestrator distinguishes structural retries from clarification turns) but not explicitly tested. Phase 1.3+: add explicit clarification-path-retry-isolation test. |
| EC-16 | Mid-conversation API failure: no orphans, stale handling | brief §20 line 1305 | Integration test (specced `agentMidConversationFailure.test.ts` / CA-44; absent in repo) | DEFERRED | No dedicated test located. CA-44 in actual repo is `agentPersonaWhitelist.test.ts` (covering EC-18). Some adjacent coverage in `agentValidationRetry.test.ts` for validation-failure recovery — different failure surface (Zod failure, not Anthropic API failure). EC-16's specific assertions (no orphan journal entries; ai_actions transitions to stale on mid-conversation API failure) lack dedicated test coverage. Phase 1.3+: add explicit mid-conversation-API-failure regression test. |
| EC-17 | Structured-response contract upheld on 3 responses | brief §20 line 1306 | Manual inspection, `phase_plan.md` #17 | MET | Session 7 brief §6 line 351: "Commit 1 strengthens (params validation at orchestrator boundary); already passing from Session 5, ship-verified." Manual inspection per EC-17 spec performed during Session 7 closeout (Commit 1, SHA `6904a2f`). Contract additionally reinforced by code-level Zod validation at orchestrator boundary. |
| EC-18 | Persona guardrails: Executive cannot post | brief §20 line 1307 | Integration test | MET | `tests/integration/agentPersonaWhitelist.test.ts` (CA-44 in actual test, not brief's CA-45). Explicitly asserts `expect(names).not.toContain('postJournalEntry')` for executive persona, plus `not.toContain('reverseJournalEntry')` (other ledger-mutation tools). Whitelist enforced at `toolsForPersona` per master §6.4. |

---

## §3 Paid-API Validation

All five ECs in this section depend on the paid-API gates named in
the Session 8 backlog — EC-2 full 20-entry run and C7 EC-13
adversarial run. Per-row Evidence columns describe EC-specific
verification surfaces; the shared full-run dependency is named here
once rather than repeated per row.

| EC | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-2 | 20 real entries posted through agent; ledger correct | brief §20 line 1291 | Manual + `phase_plan.md` #2 | PARTIAL — 10/20 | C12 update: PARTIAL with verified/attempted/untried split per Meta A (`d2b2f50`). **Verified (10/20):** Phase E delivered 10 productive entries through chunk-1 (commit `064d0da` baseline; full inventory in friction-journal section (m)). C7 EC-13 added Entries 12 + 14 productive (commit `52a63f0`, section (o)). **Attempted-but-Class-2 (2):** C7 Entries 13 + 15 staled per OI-3 scoping doc (`161bff8`) §1 Finding mechanism. **Untried (8):** chunk-2 Entries 16-20 (untried-by-halt, post-Class-2 systematic halt at Entry 15) + Entry 12 retry + Entry 13 retry. Carries to Phase 2 post-OI-3 + Class 2 fix-stack per `phase-2/obligations.md` §2. Earlier evidence (O3 Phase D Entry 1 retry, agent_sessions `45c9ef23-...`, $0.094 spend) preserved as the calibration anchor for $1.80 forecast. |
| EC-9 | 20 real entries + 10 friction entries (behavioral) | brief §20 line 1298 | Manual + `phase_plan.md` #9 | DEFERRED | Phase E delivered 10 productive entries against the 20-entry portion (commit `064d0da` baseline; partial coverage shared with EC-2's PARTIAL update above). The 10-friction-entries dimension is untouched by Phase E or C7. Phase 2 needs both EC-2 continuation and a separate friction-behavioral run; status remains DEFERRED until both dimensions execute. Friction-entry portion not yet specced as discrete deliverable. |
| EC-10 | Time-to-confirmed-entry: target < 30s | brief §20 line 1299 | Manual measurement, `phase_plan.md` #10 | DEFERRED | Single datapoint from O3 Entry 1 retry: ~71s wall-clock paste-to-card-render (operator-observed). 71s exceeds 30s target by ~2.4×. Single datapoint is not a full-run aggregate; full-run + per-entry latency measurement required for EC-10 verification. **Forward-looking concern:** the 30s target may need revisiting against expanded-prompt baseline; capture in C11 §6 handoff for either (a) target revision in C11 §5 calibration, or (b) reducibility investigation before EC-2 full-run approval. |
| EC-11 | Cost-per-entry recorded | brief §20 line 1300 | Dashboard (per `phase_plan.md` #11) | DEFERRED | Cost-recording mechanism shipped (pino `usage` log lines from `callClaude.ts`; jq-based extraction documented). Per-entry cost data durable across Phase E inventory + C7 cost rollup at friction-journal section (o) lines 6996-7003 totaling $0.4913 across 6 line items per the C7 closeout deliverable D2 cost trichotomy ($0.2163 verification + $0.2750 discovery; commit `52a63f0`). Earlier datapoint $0.094 (Entry 1, O3 Phase D) preserved. EC-11's verification mechanism per spec is "dashboard aggregate data" which is operator-side and outside this commit's authoring scope; status remains DEFERRED until operator-side dashboard aggregation is captured. |
| EC-13 | Anti-hallucination adversarial test | brief §20 line 1302 | Manual, `phase_plan.md` #13 | PARTIAL — verified OI-2 fix-stack scope; Class 2 fix-stack untested | C12 update: PARTIAL. C7 EC-13 paid-API verification run (2026-04-26, S9-0425, agent_sessions `7d0e1d6a-...`, $0.4913 spend; friction-journal section (o), commit `52a63f0`) verified OI-2 fix-stack end-to-end on relative-date resolution (gate A short-circuit at $0/129ms on Entry 14 "last month" token), Site 1 pre-Zod injection (`org_id`/`fiscal_period_id`/`idempotency_key` pre-Zod overwrite), and Site 2 card post-fill (orchestrator-owned UUIDs stamped onto emitted cards). Class 2 fix-stack scoped at OI-3 doc (`161bff8`) but untested as workstream not yet implemented; Phase 2 carries the OI-3 + Class 2 implementation per `phase-2/obligations.md` §1. Earlier scheduling reference (session-8-brief.md §6 7-vector adversarial framework) preserved. |

---

## §4 User-Facing Surfaces

| EC | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-6 | Org switch resets session | brief §20 line 1295 | Integration test | MET | Two tests cover the surface — `tests/integration/agentSessionPrecedence.test.ts` (CA-45 in actual test) covers three-precedence session load/create per master §5.2 step 1 / sub-brief §5.7; `tests/integration/agentSessionOrgSwitchAudit.test.ts` (CA-65 in actual test) covers org-switch detection + audit emission per master §16 / Clarification E. Both tests pass cleanly as of `4372d65` (2026-04-22 18:38 PDT) which resolved CA-65's cleanup-pattern regression (root cause: INV-AUDIT-002 append-only enforcement at `1b18dab` silently broke the test's `beforeEach/afterEach audit_log.delete()` idiom; rows accumulated across the two `it` blocks because the describe-scoped `trace_id` was shared). Fix pattern: per-test `trace_id` + drop `audit_log.delete()` — same as `dc757c3` for `crossOrgRlsIsolation`. CA-65 verified passing 2/2 at gate-time pre-commit. Note: brief reserved CA-41 for `agentOrgSwitch.test.ts`; reality is CA-45 + CA-65 with file split. |
| EC-8 | Manual + agent entries appear in AI Action Review | brief §20 line 1297 | Manual, `phase_plan.md` #8 | MET | Two test files cover the surface — `tests/integration/aiActionsListService.test.ts` (covers `aiActionsService.list` business logic — empty response, cross-org filtering, created_at DESC ordering, ORG_ACCESS_DENIED enforcement, entry_number merge for confirmed rows with linked journal_entry) and `tests/integration/aiActionsReviewPageRender.test.ts` (covers page render). Shipped in Session 8 Commit 2 (`9ef45db` — "AI Action Review queue functional"). Manual surface verified by Session 8 work itself plus tests confirm both manual + agent entry visibility. |
| EC-14 | ProposedEntryCard renders all fields, screenshot committed | brief §20 line 1303 | Manual, `phase_plan.md` #14 | DEFERRED | Render portion: MET. ProposedEntryCard real-render shipped Session 7 Commit 2 (SHA `3abbc7a` per CURRENT_STATE Session 7 entry); 28 new schema/render tests; O3 Phase D Entry 1 retry confirmed clean browser render ("Proposed entry of 2,400.00 CAD. Please review the details below." narrational wrapper + card with Approve/Reject/Edit buttons). Screenshot-committed portion: DEFERRED. No screenshot artifact located in repo (`find docs -iname '*screenshot*'` returns nothing for ProposedEntryCard). O3 retry browser screenshots exist in ephemeral session state only, not under version control. Phase 1.3+ or C10 follow-up: commit a ProposedEntryCard screenshot artifact to docs/ for long-term reference. May be shared artifact with EC-27's screenshot requirement since both reference the same component. |
| EC-19 | Canvas context injection: 3-scenario over-anchoring test | brief §20 line 1308 | Manual, `phase_plan.md` #19 | MET | Per CURRENT_STATE Session 7.1 entry: "EC-19 manual verification (scenarios a, b, c) all passed against real Claude at post-a43dd35 code. EC-19b closed; EC-19a covered by Commit 5's two integration test files." Three scenarios (a) under-anchored, (b) over-anchored, (c) clarification all passed. Session 7.1 Commit 5 (SHA `39c6d38`) shipped the implementation. Session 7.1.1 added `agent.response.natural` template (commit `a43dd35`) to make scenario (a) answerable; Session 7.1.2 introduced Playwright harness as test infrastructure. Authoritative scenario source: `docs/09_briefs/phase-1.2/canvas_context_injection.md` §Over-Anchoring Test. |

---

## §5 Onboarding + Forms

| EC | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| EC-20 | Onboarding: new user redirected to /welcome, completes 4 steps | brief §20 line 1314 | Integration test | MET | Onboarding 4-step flow covered by 7 test files: `onboardingStep1Transition.test.ts`, `onboardingStep2And3Transition.test.ts` (atomic 2+3 advance per Session 5), `onboardingStep4Completion.test.ts`, `onboardingStep4GuardNoStep1.test.ts` (Session 5.2 guard), `onboardingSuffixStepAware.test.ts` (CA-67), `onboardingSignInRedirect.test.ts`, `onboardingResumeBehavior.test.ts`. Brief specced CA-46 / `onboardingNewUser.test.ts` (single file); reality split coverage across 7 test files for the multi-step flow. |
| EC-21 | Onboarding: "Skip" link navigates to form-based surface | brief §20 line 1315 | Manual test | MET | `tests/integration/onboardingSkipLinkFlow.test.ts`. Session 6 work per session-6-brief.md line 65. |
| EC-22 | Onboarding: invited user sees shortened flow | brief §20 line 1316 | Integration test | MET | `tests/integration/onboardingInvitedUser.test.ts` — one of the rare cases where brief's CA-47 / filename matches reality (though CA-47 is now used by `agentTracePropagation.test.ts`; the file's CA tag may have shifted). Session 5 work. |
| EC-23 | User profile editor: saves via PATCH `/api/auth/me` | brief §20 line 1317 | Integration test | MET | `tests/integration/userProfileEditorFlow.test.ts` covers PATCH flow; `userProfileAudit.test.ts` covers audit emission; `userProfileAutoCreate.test.ts` covers profile auto-creation on first login. Session 6 work per session-6-brief.md line 67. |
| EC-24 | Org profile editor: controller can edit, non-controller redirected | brief §20 line 1318 | Integration test | MET | `tests/integration/orgProfileEditorAuthz.test.ts` covers controller-can-edit + non-controller-redirected authz; `orgProfileCreation.test.ts` covers creation flow. Session 6 work per session-6-brief.md line 68. |
| EC-25 | Invite user: token returned, invitation created | brief §20 line 1319 | Reuse CA-16 | MET | `tests/integration/inviteAcceptFlow.test.ts` covers CA-16 (full invite → accept lifecycle) + CA-17 (rejects expired/revoked tokens). Brief said "Reuse CA-16" for EC-25 verification — direct match. Plus `invitationPreviewByToken.test.ts`, `inviteRevokeReinvite.test.ts`, `orgUsersViewInvite.test.ts` cover adjacent invitation surfaces. |
| EC-26 | Invitation accept page: handles all 5 states | brief §20 line 1320 | Integration test | MET | `tests/integration/invitationAcceptPageStates.test.ts` covers all 5 invitation-accept states (signed-out, email-match, email-mismatch, invalid, expired). Brief specced CA-48; reality has dedicated test file with all 5 states. |
| EC-27 | ProposedEntryCard: confidence chip removed, policy_outcome rendered, debit/credit are MoneyAmount strings | brief §20 line 1321 | Code inspection + screenshot | DEFERRED | Schema migration portion: MET. ProposedEntryCardSchema acceptance test (Session 7 Commit 2, SHA `3abbc7a`) covers the three schema properties — confidence_score removed from user-visible card, policy_outcome rendered, debit/credit as MoneyAmount strings. 28 new schema/render tests confirm migration shipped. Brief specced CA-49; reality is descriptive filename. Screenshot-committed portion: DEFERRED. Same shape as EC-14 — no committed screenshot artifact in repo; render verified ambient at O3 Phase D Entry 1 retry. Phase 1.3+ or C10 follow-up: commit ProposedEntryCard screenshot artifacts (one pre-migration, one post-migration if distinguishable, or one canonical render) to docs/ for long-term reference; may be shared artifact with EC-14's screenshot requirement since both reference the same component. |

---

## §6 Shipping line items (unnumbered)

These three items shipped together in Session 8 Commit 1 (`e05d413` —
`feat(phase-1.2): Session 8 Commit 1 — shell polish (avatar dropdown
+ Activity icon + placeholder queue)`). They have no master-level EC
numbers; per Session 7 brief §5 they're listed here for bookkeeping
completeness.

| Item | Criterion | Source | Verification | Status | Evidence |
|---|---|---|---|---|---|
| Avatar dropdown | Avatar dropdown / sign-out affordance per master §14.6 | session-7-brief.md §5 | Integration test + manual review | MET | Shipped Session 8 C1 (`e05d413`). `tests/integration/avatarDropdownMenuBehavior.test.ts` covers item visibility contract via pure helper (`getAvatarDropdownItems`). Click-handler behavior (`router.push` targets, `supabase.auth.signOut()` firing) reviewed at C1 founder review gate. Verification mode (code review vs. interactive sign-out smoke test) not separately recorded in commit body or friction-journal; operator-knowledge only. Per master §14.6. |
| Activity icon | Mainframe rail Activity icon per master §14.6 | session-7-brief.md §5 | Operator visual confirmation at C1 founder review gate | MET | Shipped Session 8 C1 (`e05d413`) per commit message. No dedicated test file (visibility-only icon). Verification mechanism: founder review gate at C1 commit (operator visual confirmation of icon presence in Mainframe rail). No automated regression coverage; future operator-level regressions (e.g., accidental component removal) would require follow-up review to detect. Phase 1.3+: consider smoke test for presence of navigation affordances. Per master §14.6. |
| Placeholder review queue page | `actions/page.tsx` placeholder so Activity icon doesn't 404 | session-7-brief.md §5 | Operator visual confirmation at C1 founder review gate | MET | Shipped Session 8 C1 (`e05d413`) — ~15 LOC placeholder page so Activity icon doesn't navigate to 404. No dedicated test; placeholder content. Verification mechanism: founder review gate at C1 commit (operator visual confirmation of page render at /actions). No automated regression coverage; a future commit accidentally deleting `actions/page.tsx` would not be caught by any test. Will be replaced by real review queue in Phase 1.3+; smoke test for navigation-affordance presence recommended at that time. |

---

## Final totals

C12 update: EC-2 and EC-13 promoted from DEFERRED → PARTIAL with verified/attempted/untried split per Meta A. EC-9 and EC-11 stay DEFERRED with annotations naming durable evidence in friction-journal section (o) and OI-3 scoping doc.

| Section | MET | PARTIAL | DEFERRED | MISSED | Total |
|---|---|---|---|---|---|
| §1 Foundations and Regression | 3 | 0 | 0 | 0 | 3 |
| §2 Agent Mechanics | 5 | 0 | 2 | 0 | 7 |
| §3 Paid-API Validation | 0 | 2 | 3 | 0 | 5 |
| §4 User-Facing Surfaces | 3 | 0 | 1 | 0 | 4 |
| §5 Onboarding + Forms | 7 | 0 | 1 | 0 | 8 |
| §6 Shipping line items | 3 | 0 | 0 | 0 | 3 |
| **Total** | **21** | **2** | **7** | **0** | **30** |

No MISSED rows; no §7 #4 split-point trigger fires. The 2 PARTIALs are EC-2 (10/20) and EC-13 (OI-2 verified, Class 2 untested). The 7 DEFERREDs cluster: 3 in §3 (EC-9, EC-10, EC-11 — paid-API gates pending behavioral / latency-sustained / dashboard-aggregate verification respectively), 2 in §2 (EC-15, EC-16 — missing dedicated tests for clarification-path-retry-isolation and mid-conversation-API-failure), 1 in §4 (EC-14 screenshot-committed portion), 1 in §5 (EC-27 screenshot-committed portion). All have named Phase 1.3+ or Phase 2 remediation pointers in their Evidence columns.

**Phase 1.2 close-readiness:** Phase 1.2 closes under Reading B (OI-3 / Class 2 fix-stack work extends into Phase 2). Phase 2 inherits the 2 PARTIAL ECs as workstream-gated (EC-2 continuation + EC-13 Class 2 fix-stack — both per `phase-2/obligations.md` §1) and the 7 DEFERRED ECs as discrete follow-up items (EC-9 / EC-10 / EC-11 Phase 2 paid-API gates; EC-15 / EC-16 test-authoring gaps; EC-14 / EC-27 screenshot-commit pass).

**Spec-vs-implementation drift:** noted per-row throughout; generalizable pattern captured in C11 §3 retrospective per the preamble pointer.
