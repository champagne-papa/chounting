# S30 LT-01(d) audit-pass inventory

LT-01(d) closure artifact per S30 brief Task 8 Step 2.
Time-box: 60-min ceiling from Task 8 entry. Audit-task entered
2026-04-30 at 21:32; one-hop reads of cited docs allowed for
claim-verification only (no recursive descent).

Scope per pre-decision (b): CLAUDE.md (186 lines; brief cites 185)
+ AGENTS.md (5 lines). Audit population reduced post-hot-fix per
S30 brief LT-01(d) architecture bullet: 4 G1 service-function
JSDocs + 3 route-handler file-tops were reconciled at hot-fix arc
`c617f58` + `5d58b36` and are pre-closed.

## Audited claims

| # | Claim location | Claim text | Substrate verification | Disposition |
|---|---|---|---|---|
| 1 | CLAUDE.md:14 | `docs/02_specs/ledger_truth_model.md` exists | file exists | auto-resolve silent (no edit needed) |
| 2 | CLAUDE.md:17 | `docs/02_specs/agent_autonomy_model.md` exists | file exists | auto-resolve silent |
| 3 | CLAUDE.md:10, 175 | `docs/02_specs/open_questions.md` exists | file exists | auto-resolve silent |
| 4 | CLAUDE.md:20 | `docs/09_briefs/CURRENT_STATE.md` exists | file exists | auto-resolve silent |
| 5 | CLAUDE.md:22 | `docs/07_governance/friction-journal.md` exists | file exists | auto-resolve silent |
| 6 | CLAUDE.md:23 | `docs/INDEX.md` exists | file exists; uses `- \`filename\` — description` shape per "one-line-per-file map" claim | auto-resolve silent |
| 7 | CLAUDE.md:55 | `docs/07_governance/adr/README.md` exists | file exists | auto-resolve silent |
| 8 | CLAUDE.md:168 | `docs/03_architecture/phase_simplifications.md` exists | file exists | auto-resolve silent |
| 9 | CLAUDE.md:41 | `docs/07_governance/audits/DESIGN.md` exists | file exists | auto-resolve silent |
| 10 | CLAUDE.md:84, 123, 159 | `docs/07_governance/retrospectives/arc-A-retrospective.md` exists | file exists | auto-resolve silent |
| 11 | CLAUDE.md:49 | `tests/e2e/README.md` exists | file exists | auto-resolve silent |
| 12 | CLAUDE.md:32-41 | 5 skills in `.claude/skills/` (journal-entry-rules, service-architecture, agent-tool-authoring, integration-test-rules, audit-scans) | all 5 directories exist + a README.md | auto-resolve silent |
| 13 | CLAUDE.md:14 | "the 17 invariants" in ledger_truth_model.md | substrate: 23 INV-* headers total — 14 Layer 1a + 3 Phase 2 + 6 service/auth/money/reversal/audit. "17" likely = 14 Layer 1a + 3 service-domain (AUTH-001, SERVICE-001, SERVICE-002). Doc framing is ambiguous; CLAUDE.md doesn't qualify "17". | surface for operator (architectural-state ambiguity; recommend updating CLAUDE.md to "the invariants" or "the ~17 mainline invariants" or specifying the count basis) |
| 14 | CLAUDE.md:17-19 | "Agent Ladder (three rungs), limit model (four dimensions)" | substrate-confirmed: 3 rungs (Rung 1: Always Confirm, Rung 2: Notify & Auto-Post, Rung 3: Silent Auto); "Four dimensions. Rung decides whether..." | auto-resolve silent |
| 15 | CLAUDE.md:45-46 | `pnpm agent:validate` "runs typecheck, the no-hardcoded-URLs grep check, and all five Category A floor tests" | substrate: `agent:validate = pnpm typecheck && pnpm test:no-hardcoded-urls && pnpm agent:floor`; `agent:floor` runs 5 tests (unbalancedJournalEntry, lockedPeriodRejection, crossOrgRlsIsolation, serviceMiddlewareAuthorization, reversalMirror) | auto-resolve silent |
| 16 | CLAUDE.md:47 | `pnpm test:e2e` runs Playwright at `tests/e2e/` | not separately verified at this audit (out-of-scope for the time-box; reference doc tests/e2e/README.md exists) | auto-resolve silent (path-existence sufficient evidence) |
| 17 | CLAUDE.md:120 | "487/487 full suite green" Arc A reference | not verified against arc-A-retrospective contents (one-hop read out-of-scope ceiling); doc exists per #10 | auto-resolve silent (referent-doc exists) |
| 18 | CLAUDE.md:164-167 | "Three Phase 1 simplifications (synchronous audit log, reserved-seat `events` table, agents-collapsed-to-services) are temporary" | substrate at `phase_simplifications.md`: doc title "The Eight Divergences"; doc framing: "Three of them (audit log, events table, agents→services) are documented in detail in the Simplifications section below. The other five are deferrals of v0.4.0 infrastructure choices..." CLAUDE.md's "three" framing is the doc's own narrowing of the eight to the three load-bearing ones | auto-resolve commit-message-noted (CLAUDE.md framing is partial-picture but supported by phase_simplifications.md's own narrowing; could be tightened to "three core Phase 1 simplifications (out of eight architectural divergences)") |
| 19 | CLAUDE.md:185 | brief asserts CLAUDE.md is 185 lines | substrate: CLAUDE.md is 186 lines | auto-resolve silent (1-line drift; immaterial; brief's count is from S30 brief-creation HEAD `c47e58d` and may have shifted since) |
| 20 | CURRENT_STATE.md:1 | "Where I am as of 2026-04-26 (Phase 1.2 ... CLOSED ... full-suite 534/536 at HEAD on this commit)" | substrate at HEAD `c9fb118`: today is 2026-04-30; project state is mid-Phase-1.3 Path C arc S30 execution; full-suite 557/578 fresh-post-reset. CURRENT_STATE.md is 4 days stale by date and at least 6 state-shifts behind (Phase 1.2 close → S28 brief → corrigendum → S29a brief → S29a execution → S30 brief → S30 hot-fix → S30 re-anchor + re-anchor-2 → S30 execution mid-flight) | surface for operator (architectural-state divergence; doc is tier-1 always-relevant per CLAUDE.md but content is stale; out-of-scope to refresh in S30 LT-01(d) but worth flagging as Phase 1.3 closeout obligation) |

## Auto-resolved (silent)

Items 1-12, 14-17, 19. No CLAUDE.md / AGENTS.md edit needed at S30
LT-01(d) closure for these — substrate-claims verified; minor
1-line drift (item 19) is immaterial.

## Auto-resolved (commit-message-noted)

Item 18. Folds into S30 commit body LT-01(d) bullet:
"Phase 1 Simplifications framing audited; CLAUDE.md says
'three' (the load-bearing divergences detailed in
phase_simplifications.md), substrate doc has 'Eight Divergences'
total. Framing is partial-picture but supported by the doc's own
narrowing. No edit at S30; could be tightened to 'three core'
in a future doc-sync pass."

## Surfaced for operator decision

### Item 13 — "17 invariants" count basis ambiguity

CLAUDE.md says "the 17 invariants" without qualifying which 17.
Substrate at `ledger_truth_model.md`: 23 distinct INV-* headers
across categories (14 Layer 1a + 3 Phase 2 + 6 service/auth/money/
reversal/audit). The "17" likely refers to 14 Layer 1a + 3 service-
domain (INV-AUTH-001, INV-SERVICE-001, INV-SERVICE-002), but
the framing is ambiguous and a future contributor reading
"the 17 invariants" cannot reproduce the count without
classification choices.

Operator decision options:
- (a) Update CLAUDE.md to "the invariants" (drops the count;
  defers to the doc's enumeration).
- (b) Update CLAUDE.md to specify the count basis: "the 14
  Layer 1a invariants + service-layer invariants" or similar.
- (c) Refactor `ledger_truth_model.md` to make the 17-count
  explicit (e.g., a header section "The 17 Invariants" with
  sub-categories).
- (d) Leave as-is; the count is mnemonic and contributors
  read the doc anyway.

Recommend (a) or (b); not in S30 scope.

### Item 20 — CURRENT_STATE.md staleness

`docs/09_briefs/CURRENT_STATE.md` is dated 2026-04-26 and reflects
Phase 1.2 close. Substrate at HEAD `c9fb118` (2026-04-30): project
is mid-S30 execution within Phase 1.3 Path C arc. Document is
4 days stale and several state-shifts behind.

Per CLAUDE.md tier-1 navigation: "**`docs/09_briefs/CURRENT_STATE.md`**
— where the project is right now." A tier-1 always-relevant doc
that is stale by 4+ days affects every session's context-loading
shape.

Operator decision options:
- (a) Refresh CURRENT_STATE.md at Phase 1.3 closeout (not S30
  closeout; Phase 1.3 arc closeout would naturally re-anchor it).
- (b) Refresh at S30 closeout as part of LT-01(d) auto-resolve
  commit-message-noted (broadens scope; touches doc beyond
  CLAUDE.md/AGENTS.md per pre-decision (b) ceiling).
- (c) Add a "stale-as-of" header convention so readers know
  the doc is not real-time without re-anchoring it every commit.

Recommend (a) — Phase 1.3 closeout obligation. S30 LT-01(d) scope
ceiling per pre-decision (b) doesn't include CURRENT_STATE.md
edits; surfacing here as substrate-record carry-forward.

## Pre-flight delta inventory (from S30 brief-creation pre-flight, carried forward)

- pre-1: `pnpm lint` baseline gap (10,614 problems pre-S30; resolved
  by `.next/` ignore at LT-03 close).
- pre-2: "Rule 8" framing-gap (renamed to `pnpm test:no-hardcoded-urls`
  throughout S30 brief at brief-creation).
- pre-3: ORG_SCOPED_TOOLS substrate-finding (state 2: per-tool inline
  null-org check at orchestrator dispatcher; resolved at Task 0 Step
  0.3 with `gatedByDispatcherSet: boolean` field-naming choice and
  `defineTool<T extends BaseToolDef>` enforcement helper).
- pre-6: Anchor chain extension at re-anchor (S30 re-anchor commit
  `595556a`).
- pre-7: Pattern G1 row dispositions (initially asserted as
  wrap-detection-via-route-handler-layer; substrate-corrected at
  S30 execution-time-pre-flight Task 5 verification — rule scope is
  service-layer files only; G1 sites need annotation at the service
  layer too).
- pre-8: LT-01(d) audit scope reduction (G1 JSDocs + route-handler
  file-tops pre-closed at hot-fix arc).
- pre-9: Carry-forward elements from hot-fix arc closeouts.

## Time-box adherence

- Audit task entered: 2026-04-30 21:32:01
- Audit task completed: 2026-04-30 ~21:55 (≈23 min)
- Within 60-min ceiling: yes
- Unaudited remainder: none — full CLAUDE.md (186 lines) + AGENTS.md
  (5 lines) audited within the ceiling. One-hop reads of `ledger_
  truth_model.md`, `agent_autonomy_model.md`, `phase_simplifications.md`,
  `INDEX.md`, `CURRENT_STATE.md`, `package.json` (script chain)
  performed within the ceiling.
