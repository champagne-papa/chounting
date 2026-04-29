# Path C arc — closing Phase 1.2 audit MT/LT obligations before Phase 2 surface expansion

## Title and intent

This arc closes the Phase 1.2 audit's medium-term (MT-03, MT-05,
MT-06) and long-term (LT-01, LT-02, LT-03, LT-04) obligations
across four sessions, before Phase 2 surface expansion begins.
The Phase 1.2 audit's load-bearing findings (UF-001 ledger
immutability, UF-002 read-path authorization, UF-003 transaction
atomicity) are already closed by the post-audit fix-stack arc
(S25 / S26 / S27, arc anchor `297256e`, post-S27 verification-
gate corrections at `d39ec09`). The audit's remaining
recommendations sit unaddressed: convention-vs-mechanism
enforcement debt that compounds with each new service, observability
gaps that go undetected until something fails, and test-coverage
gaps that grow more expensive to backfill the further the codebase
drifts from the audit-time state.

The framing the operator named at scoping is **"house in better
order before adding rooms"**: Phase 2 will multiply the agent
surface (mobile approvals, intercompany, recurring-entry
scheduler), and the Path C items compound faster on that expanded
surface than they do at Phase 1.2 closure scale. Closing them
before Phase 2 expansion is cheaper than closing them in flight.

**Path C is "Phase 1.2 sprint 2" and "Phase 1.3 (audit cleanup
subset)" by different naming conventions.** The action plan calls
the post-arc cleanup work "Phase 1.2 sprint 2"; the operator
refers to it as Path C; LT-01 and LT-03 carry "Phase 1.3
(deployment readiness and CI/CD)" tags in `action-plan.md`. All
three names point at the same scope — the audit-cleanup subset of
Phase 1.3, scoped to ship before Phase 2 expansion. This document
uses **Path C** as the operative name; cross-references map back
to the action plan's "Phase 1.2 sprint 2" framing.

**Path C does NOT include deployment readiness.** CORS/CSRF/rate-
limiting (DND-01) and other DND-listed deferrals remain Phase 1.3
**Path A** scope, which runs after Path C closes and before MVP
feedback. Path C closes audit findings mechanically; Path A closes
deployment readiness; the two are different gates with different
verification criteria. Treating Path C closeout as "done with
foundation work" would be wrong-shaped — the boundary between
audit-cleanup and deployment-readiness is intentional and load-
bearing.

## Sessions named

### S28 — Observability cluster (MT-05 + MT-06)

**File:** `docs/09_briefs/phase-1.3/session-28-brief.md` (drafted
by brief-creation session post-arc-summary ratification).
**Estimated duration:** ~half day.
**Summary:** Closes MT-05 (UF-008 audit-emit failure alerting at
`orchestrator/index.ts:187–205, 1272–1295` and
`loadOrCreateSession.ts:152–179` — counter metric or
structured-flag log on swallowed try/catch errors; alert
threshold defined) and MT-06 (UF-010 PII redaction expansion —
two surfaces: pino `REDACT_CONFIG.paths` extension to include
`email`, `phone`, `first_name`, `last_name`, `display_name`; and
`recordMutation.redactPii` extended from shallow to nested
traversal per the in-code MT-06 reference at
`src/services/audit/recordMutation.ts:14-19`). Both items are
observability/redaction additive surfaces, no service-call-graph
changes, no shared file. Single bundled commit. Y2 commit shape
optional — bundling permitted because both items are <1 day each
and the governance attribution is light (single friction-journal
NOTE referencing both UF-008 and UF-010 closure).

**Pre-decisions for brief-creation session:** (a) Counter-metric
shape — pino structured-flag log vs. dedicated metric counter
(`audit_emit_failure_count`); operator preference governs.
(b) Alert threshold for MT-05 — the action plan suggests "> 1
failure per 100 agent operations"; brief-creation should propose
a concrete number and surface it for ratification. (c) MT-06
nested traversal recursion depth limit (defense against
pathological JSON depth); brief-creation proposes; operator
ratifies.

### S29 — Service-layer authorization mechanically enforced (MT-03 broad)

**File:** `docs/09_briefs/phase-1.3/session-29-brief.md` (drafted
post-arc-summary ratification).
**Estimated duration:** ~1-2 days.
**Summary:** Closes MT-03 broad-scope: route every org-scoped
service function (reads AND mutations) through `withInvariants`,
removing per-function manual `if (!ctx.caller.org_ids.includes(...)) throw ...`
guards. The operator-ratified broadening from action-plan literal
scope ("read-path enforcement wrapper") rests on three observations:
(1) the convention-vs-mechanism principle that motivated MT-03
applies identically to mutations; (2) the codebase's mutation
functions hand-roll the same guard pattern as reads (verified at
`periodService.lock` / `periodService.unlock` / similar — the
in-code comment at `chartOfAccountsService.ts:18-19` ("Phase 12A
pattern for read functions (writes use withInvariants Invariant 3
instead)") names the inconsistency directly); (3) Phase 2 mobile-
approval work will add new mutating service functions, and
convention-only enforcement at that point compounds the debt.
Cost differential vs. narrow scope is small (~half day above
narrow per scoping estimate). The brief explicitly notes the
broadening from action-plan literal, documents the rationale,
and audits existing mutation call-sites for wrap-signature
consistency as part of the work. Single bundled commit unless
the wrap-site refactor exceeds ~80 lines of net diff (operator's
call at execution; Y2 split available if scope expands).

**Pre-decisions for brief-creation session:** (a) Refactor
strategy — wrap each service function inline at its export site,
or extract a shared `withOrgAuth` helper that wraps and re-exports
in bulk; brief-creation proposes; operator ratifies. (b) Per-
function guards that legitimately do NOT require org scoping
(e.g., user-profile reads with `org_id: null` audit shape per
`recordMutation.ts:53-56`) need explicit annotation; brief-
creation enumerates exceptions and proposes annotation shape.
(c) Test-suite delta — full-suite green is required at session
close; brief-creation pre-flights which integration tests
exercise the wrapped paths and surfaces any expected failures
for ratification before refactor begins.

### S30 — Convention-to-CI-enforcement cluster (LT-01 + LT-03 + LT-04)

**File:** `docs/09_briefs/phase-1.3/session-30-brief.md` (drafted
post-arc-summary ratification).
**Estimated duration:** ~1 day.
**Summary:** Closes LT-01, LT-03, and LT-04 as a unified
convention-to-CI-enforcement cluster — three items that share the
shape "turn a hand-maintained data structure or convention into a
CI-enforced drift check." Components:
- **LT-03** (= LT-01(a)): ESLint `no-restricted-imports` rule
  preventing `adminClient` import outside `src/services/`.
  Mechanizes UF-006's primary surface.
- **LT-01(b)**: CI check (custom AST-based check or ESLint plugin)
  for `withInvariants` wrapping on all service-layer org-scoped
  exports. Catches future bypasses of the S29 wrap-site
  refactor; sequences AFTER S29 so the check fires against a
  clean wrap-site state.
- **LT-01(c)**: CI grep-fail for hardcoded test URLs (CLAUDE.md
  Rule 8). Mechanizes a long-standing convention.
- **LT-01(d)**: Documentation-reality reconciliation — audit
  CLAUDE.md claims against implementation; commit any drift
  fixes alongside CI rules. Lightweight; ~30 minutes.
- **LT-04**: Lint rule or test verifying `ORG_SCOPED_TOOLS` Set
  in `orchestrator/index.ts:1098–1104` matches the tool registry.
  Same enforcement-pattern shape (turn hand-maintained data
  structure into drift check). The action plan's "Phase 2 sprint
  1 when new tools are added" tag is wrong-shaped — drift checks
  fire on first-touch, not retrospectively; LT-04 belongs with
  this cluster.

Single bundled commit. UF-006 + UF-013 closure plus QUALITY-006
closure (LT-04's lineage). Y2 commit shape applies if the
documentation-reality reconciliation surfaces non-trivial drift
fixes — those split into Commit 1 (CI rules + LT-04 drift check)
and Commit 2 (CLAUDE.md / governance reconciliation +
friction-journal NOTE).

**Pre-decisions for brief-creation session:** (a) LT-01(b)'s
implementation surface — ESLint custom rule vs. AST check vs.
runtime check at boot; brief-creation proposes; operator ratifies.
(b) LT-01(d)'s scope ceiling — the action plan says "audit all
CLAUDE.md claims against implementation"; brief-creation should
bound this with a time-box (e.g., 1-hour ceiling) to prevent
scope creep, and surface non-trivial drift findings to the
operator rather than auto-resolving. (c) LT-04's drift check
shape — comparing the hand-maintained Set against `toolsForPersona.ts`
registry; brief-creation proposes whether it's a lint rule, a
test, or both.

### S31 — Test coverage closure (LT-02)

**File:** `docs/09_briefs/phase-1.3/session-31-brief.md` (drafted
post-arc-summary ratification).
**Estimated duration:** ~2-3 days; largest Path C item; may warrant
Y2 split or further sub-session decomposition at brief-creation.
**Summary:** Closes the five LT-02 sub-items per `action-plan.md`:
(a) API route integration tests for agent confirm/reject paths —
this absorbs the "agent confirm-flow integration coverage" Phase 2
obligation flagged at S27 closeout (friction-journal NOTE 2026-
04-29 (a-f), item attribution: "Inferential coverage: agent
path→service (paid) + service→RPC (rollback 5/5) → composed agent
confirm→RPC inferred; pre-existing LT-02 gap"); (b) conversation
saturation curve characterization (turn counts up to 32, verify
context-window behavior); (c) cross-org report contamination test
(attempt to reference account from org B in org A's entry, verify
rejection — exercises S26 QW-05 cross-org trigger); (d) audit-log
PII presence assertions (verify S25 QW-07 and S28 MT-06 redaction
working end-to-end); (e) period-lock date-range enforcement test
(post entries before/after period range, verify S26 QW-03 rejection).

The S27 friction-journal NOTE explicitly tags its missing coverage
as falling under LT-02; sub-item (a) is its canonical home. No
deduplication or expansion of LT-02 needed beyond the action
plan's existing scope.

Y2 commit shape recommended given session size: Commit 1 = test
additions; Commit 2 = governance attribution including
friction-journal NOTE on coverage delta and any test-pattern
findings that surface during execution.

**Pre-decisions for brief-creation session:** (a) Test pattern
discipline — any new test against `accountLedgerService` or any
account-balance-touching surface MUST follow the runtime-lookup-
by-natural-key pattern (Soft 9 precedent at S19, commit `13e11f7`)
rather than hardcoded UUIDs (Soft 8 precedent), to avoid replicating
the running-balance fragility shape that lives as a sibling Phase 2
obligation in `obligations.md` §6 ("`accountLedgerService` running-
balance fragility"). Brief-creation calls this out as a hard rule;
session execution honors it. (b) Sub-item (b) saturation curve
characterization — does the test exercise live Anthropic API calls
(paid) or a simulated/replayed conversation history (free)? If
paid, brief-creation surfaces a cumulative-spend ceiling and per-
call halt threshold per the paid-API harness discipline pattern;
if free, brief-creation enumerates the simulation strategy.
(c) LT-02 sub-item ordering — independent or sequential? If any
sub-item exercises infrastructure another adds, sequencing matters.
Brief-creation enumerates dependencies. (d) Y2 split-trigger
threshold — at what diff size does Commit 1 split into Commit 1a
+ Commit 1b? Operator's call at execution.

## Dependency graph

```
S28 (observability cluster) ─── independent ── can run any time after d39ec09 (post-S27 verification gate)
│
│
S29 (MT-03 broad) ──────── REQUIRED sequential after S28 (or parallel-safe; operator's call)
├── No code-path overlap with S28 (S28 = pino + recordMutation extensions; S29 = withInvariants + service files)
├── Sequential preferred for context cleanliness (single unbroken commit trail at HEAD)
└── S28 → S29 ordering chosen; not binding
│
│
S30 (CI-enforcement cluster) ── REQUIRED sequential after S29
├── Reason: LT-01(b) wrap-site CI guard MUST fire against the post-S29 wrap-site state. Running LT-01(b)
│    against pre-S29 codebase (per-function manual guards) would either false-positive on every service
│    file or require dual-mode logic; both shapes are wrong-cost.
├── Reason: LT-03's no-restricted-imports rule is independent of S29, but bundling with LT-01(b)
│    means a single CI-enforcement commit rather than two.
└── Cannot parallelize with S29 — wrap-site CI guard's "what to check against" is ambiguous before
    S29 lands.
│
│
S31 (LT-02 test coverage) ──── independent of S29/S30 in principle; sequencing-flexible
├── Tests for agent confirm/reject paths (sub-item a) are independent of withInvariants refactor
│    (S29 changes pre-flight checks; tests exercise post-flight behavior).
├── Tests for cross-org/period-lock (sub-items c, e) exercise existing S26 triggers; independent.
├── Tests for audit-log PII (sub-item d) exercise both S25 QW-07 and S28 MT-06 — REQUIRED sequential
│    after S28 closes.
└── Operator may sequence S31 in parallel with S29 if (d) is split out, or in serial after S30 for
    context cleanliness. Recommendation: serial after S30 (mirror S25/S26/S27 single-trail discipline).
```

## Ship order recommendation

**S28 → S29 → S30 → S31.** Linear sequence; ~5-7 working days total
elapsed (S28 ~half day, S29 ~1-2 days, S30 ~1 day, S31 ~2-3 days).

Sequential is **required** between S29 and S30 (LT-01(b) wrap-site
CI guard must fire against post-S29 state). Other transitions are
sequential-preferred but not binding:

- **S28 → S29:** No code-path overlap; could parallelize. Sequential
  recommended for context cleanliness and to mirror S25/S26/S27's
  single-trail discipline.
- **S30 → S31:** Independent except for S31's sub-item (d) which
  exercises S28's MT-06. If S28 has shipped, S31 can run before
  S30 in principle. Sequential after S30 recommended for
  consistency.

The S25 → S26 → S27 precedent's reasoning ("each session's friction-
journal entry references the prior session's outcome, building a
coherent arc record") applies here. Path C's friction-journal
lineage benefits from linear ordering: S28's MT-06 closure is cited
by S31's sub-item (d); S29's wrap-site refactor is cited by S30's
LT-01(b) check; etc.

Parallelization within a single session is fine where the brief
designs for it (S30's three sub-clusters — LT-03 ESLint rule,
LT-01(b-d) CI checks, LT-04 drift check — are independent within
the session and can be implemented in any order as long as the
single-bundled-commit shape is preserved at session close).

## Verification gate before Phase 2 surface expansion

The five conditions that must hold before Phase 2 surface expansion
begins. Each is a binary check; surfaced at S31 closeout (the arc's
final confirmation point). Mirrors the S25/S26/S27 four-condition
gate shape; mechanical checks per item closure with friction-journal
evidence and audit-finding lineage traceability through commit
messages plus friction-journal NOTEs.

**Gate framing note:** Path C's verification gate closes audit-
cleanup obligations only. Phase 2 surface expansion is unblocked
when all five gates PASS. **Path A deployment-readiness work
(CORS/CSRF/rate-limiting per DND-01; remaining DND-01..05 items)
is a separate gate that runs after Path C closes and before MVP
feedback.** Path C closeout does not constitute "done with
foundation work" — it constitutes "done with audit cleanup."

1. **Audit-emit observability live (MT-05).**
   - Counter metric or structured-flag log on swallowed try/catch
     errors at `orchestrator/index.ts:187–205, 1272–1295` and
     `loadOrCreateSession.ts:152–179`.
   - Alert threshold defined and documented.
   - S28 commit cites UF-008 closure.
   - Verification: action-plan MT-05 "Done when" criterion satisfied.

2. **PII redaction comprehensive (MT-06).**
   - `pino.ts` REDACT_CONFIG.paths includes `email`, `phone`,
     `first_name`, `last_name`, `display_name`.
   - `recordMutation.redactPii` recurses nested objects (extends
     beyond the S25 QW-07 shallow-only shape per
     `recordMutation.ts:14-19`).
   - Integration test asserts both surfaces (pino log line; audit_log
     before_state) lack the PII fields.
   - S28 commit cites UF-010 closure (full surface, after S25 QW-07
     partial).
   - Verification: action-plan MT-06 "Done when" + the audit_log
     nested-PII surface that S25 explicitly deferred to MT-06.

3. **Service-layer authorization mechanically enforced (MT-03 broad).**
   - Every org-scoped service export wraps through `withInvariants`
     (reads AND mutations).
   - Per-function manual `if (!ctx.caller.org_ids.includes(...)) throw ...`
     guards removed except where explicitly annotated as
     no-org-scoping (and the annotation shape is consistent across
     such functions).
   - S29 commit cites UF-002 broader closure (beyond S25 QW-02's
     two-method scope).
   - Note: this gate's mechanical wrap-site check is enforced at
     CI by Gate 4 (LT-01(b)); Gate 3 verifies the post-refactor
     state itself.

4. **Mutation-surface CI guards live (LT-01 + LT-03 + LT-04).**
   - ESLint `no-restricted-imports` blocks `adminClient` import
     outside `src/services/` (LT-03 / LT-01(a)).
   - CI check fires when a service-layer org-scoped export bypasses
     `withInvariants` (LT-01(b)).
   - CI grep-fail catches hardcoded test URLs per CLAUDE.md Rule 8
     (LT-01(c)).
   - Documentation-reality reconciliation captured in S30 commit
     body or a doc-reconcile commit (LT-01(d)).
   - `ORG_SCOPED_TOOLS` Set drift detection lives — adding a tool
     to the registry without updating the Set fails CI (LT-04 /
     QUALITY-006).
   - S30 commit cites UF-006 + UF-013 + QUALITY-006 closure.
   - Verification: each rule fires green on a synthetic violation
     fixture (test that asserts the rule rejects the violation
     pattern).

5. **LT-02 test coverage closed (five sub-items).**
   - (a) API route integration tests for agent confirm/reject paths
     — absorbs S27-surfaced inferential coverage gap.
   - (b) Conversation saturation curve characterization (turn
     counts up to 32, context-window behavior verified).
   - (c) Cross-org report contamination test (exercises S26 QW-05
     trigger).
   - (d) Audit-log PII presence assertions (exercises S25 QW-07 +
     S28 MT-06 redaction end-to-end).
   - (e) Period-lock date-range enforcement test (exercises S26
     QW-03 / S27 RPC rejection path).
   - All five sub-items have corresponding test cases; `pnpm
     test:integration` covers all five paths.
   - S31 commits cite UF-013 + UF-014 (test-coverage facets) closure.

When all five gates PASS, Phase 2 surface expansion is unblocked.
**Path A (deployment readiness) remains a separate, downstream
gate before MVP feedback.**

## What stays open

The following items are NOT closed by Path C and remain open
work, sorted by destination:

### Phase 2 obligations (post-Path C, pre-MVP-feedback)

| Audit ID / Source | Surface | Sequencing |
|---|---|---|
| **MT-02 / UF-014** | Canvas data refresh mechanism — `refreshKey` counter in `SplitScreenLayout`, increment after mutations, dependency in canvas data fetch hooks. | Sequences with Phase 2 mobile-approval work; closes alongside that scope. |
| **MT-04 / UF-011** | Conversation rotation + saturation observability — turn-count threshold for session rotation; metrics on session rotation frequency. Phase 2 cross-turn caching enablement requires the rotation-aware shape. | Sequences with cross-turn caching enablement (Phase 2 obligation `obligations.md` §6 "Caching enablement"). |
| **QW-06 / UF-007** | Conversation shape Zod validation on load — replace `as unknown[]` cast in `loadOrCreateSession.ts:194` with explicit Zod validation. | Already deferred per S25 pre-decision; sequencing constraint "ALONGSIDE OR AFTER cross-turn caching enablement" per `obligations.md` §6 entry. |
| **`accountLedgerService` running-balance fragility** | Test-hygiene fix — migrate affected tests to less-polluted account (1300 Short-term Investments precedent). 2 tests failing (3, 6) under shared-DB full-suite; clean under `pnpm db:reset:clean` baseline. Phase 2 obligation: characterize value-drift vs collision-drift per S27 friction-journal NOTE 2026-04-29 (e). | Phase 2 test-hygiene workstream; LT-02 (S31) brief should cite this as a sibling pattern but not absorb its scope. |
| **UF-015** | Unbounded text fields (description, reference, notes) — column-level length caps. Severity unscoped at audit time. | Phase 2 evaluation per audit's "Phase 2 concern" framing. |

### Path A scope (Phase 1.3 deployment readiness, post-Path C, pre-MVP-feedback)

| Audit ID / Source | Surface |
|---|---|
| **DND-01** | CORS/CSRF/rate-limiting at deployment boundary. Phase 1.1 UF-011 carry-forward; explicitly deferred per `action-plan.md:131-133`. |
| **DND-04** | Pagination on list endpoints (when entry counts approach hundreds per period). |
| **Other Path A surfaces** | TBD at Path A scoping session — deployment-readiness checklist authored separately. |

The audit's "Do Not Do" list at `action-plan.md` lines 130–150
(DND-01..DND-05) remains in force through Path C closeout.
**DND-01 is Path A scope.** DND-02 (conversation-table rebuild),
DND-03 (full PII compliance suite — note that QW-07 + MT-06
together close the immediate PII-capture-prevention surface but
not full right-to-erasure or access controls), DND-05
(orchestrator decomposition) remain Phase 2 obligations.

### Audit-finding lineage table

For traceability — which UF closes at which Path C gate:

| UF | Severity | Path C closure | Notes |
|---|---|---|---|
| UF-001 | Critical | (S26 + S27, pre-Path C) | Closed at post-audit fix-stack arc; verified at d39ec09. |
| UF-002 | High | Gate 3 (S29 broad-scope wrap) | S25 QW-02 closed the immediate two-method gap; S29 closes the broader convention-vs-mechanism shape across all reads + mutations. |
| UF-003 | High | (S27, pre-Path C) | Closed at post-audit fix-stack arc. |
| UF-004 | High | (S26, pre-Path C) | Closed at post-audit fix-stack arc. |
| UF-005 | High | (S26, pre-Path C) | Closed at post-audit fix-stack arc. |
| UF-006 | High | Gate 4 (S30) | LT-01 + LT-03 mechanize the convention-only enforcement. |
| UF-007 | High | (deferred — Phase 2 obligation) | QW-06 deferred at S25 pre-decision; sequenced alongside cross-turn caching. |
| UF-008 | Medium | Gate 1 (S28) | MT-05 audit-emit observability. |
| UF-009 | Medium | (S25, pre-Path C) | Closed at post-audit fix-stack arc. |
| UF-010 | Medium | Gate 2 (S28) | S25 QW-07 closed audit_log shallow surface; S28 MT-06 closes pino surface + audit_log nested surface. |
| UF-011 | Medium | (deferred — Phase 2 obligation) | MT-04 sequences with cross-turn caching. |
| UF-012 | Medium | (deferred — Phase 2 obligation) | Type-cast cleanup folds under QW-06 scope; same sequencing constraint. |
| UF-013 | Low | Gate 4 (S30) + Gate 5 (S31) | LT-01 mechanizes; LT-02 covers test gaps. |
| UF-014 | Low | Gate 5 (S31, partial — test-coverage facet) | MT-02's product surface is Phase 2 (sequences with mobile approvals); LT-02's test-coverage facet closes at Gate 5. |
| UF-015 | Low | (deferred — Phase 2 evaluation) | Unbounded text fields; severity unscoped at audit time. |
| QUALITY-006 | Medium | Gate 4 (S30) | LT-04 hand-maintained tool set drift check. |

## Cross-references

- `docs/07_governance/audits/phase-1.2/action-plan.md` —
  authoritative MT-NN / LT-NN entries; verbatim "Done when" criteria.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` —
  UF-001..UF-015 evidence and severity rationale.
- `docs/07_governance/audits/phase-1.2/audit-report.md` —
  Foundation Readiness Assessment and YES-WITH-CAVEATS verdict
  synthesis.
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` —
  precedent for arc-summary structure and verification-gate
  appendix shape; pre-Path C audit closures (UF-001/002/003/004/
  005/009/010) live here.
- `docs/09_briefs/phase-2/obligations.md` — destination for Path
  C "what stays open" items; the carry-forward queue this arc
  appends to.
- `docs/04_engineering/DEV_WORKFLOW.md` §1 — brief-creation
  session discipline; per-session brief drafting happens in a
  separate session from execution.
- `docs/07_governance/friction-journal.md` (Phase 2 section, tail
  entries 2026-04-28 / 2026-04-29) — S25/S26/S27 closeout NOTEs
  + post-S27 verification-gate corrections (`d39ec09`).
- `src/services/middleware/withInvariants.ts` — Invariant 3
  (`org_id` consistency) is the mechanical home for S29's broad-
  scope MT-03 wrap.
- `src/services/audit/recordMutation.ts:14-19` — in-code MT-06
  reference confirming pino-redaction-expansion + nested-
  traversal scope split.
- `src/shared/logger/pino.ts:19-40` — `REDACT_CONFIG.paths`
  current state (financial PII covered; name/email/phone fields
  to add at S28).
- `eslint.config.mjs` — current state lacks `no-restricted-imports`
  rule; LT-03 / LT-01(a) target.
- `docs/02_specs/ledger_truth_model.md` — INV-AUTH-001 (primary
  invariant for service-layer authorization); MT-03 broad scope
  closes the convention-to-mechanism migration for INV-AUTH-001
  reads facet.
- `docs/07_governance/adr/0008-layer-1-enforcement-modes.md` —
  Layer classification rationale; MT-03 broad migrates the
  read-side INV-AUTH-001 enforcement from convention to Layer 2
  middleware uniformly with the mutation side.

## Arc anchor and chain

- **Anchor:** `d39ec09` — post-S27 verification-gate corrections
  (S27 arc closeout + post-arc mechanical drift fixes); the SHA
  at which the four post-audit fix-stack verification-gate
  conditions hold simultaneously and at which Path C scoping
  surfaced.
- **S28 anchor:** `d39ec09`; S28 produces commit(s) TBD at
  execution.
- **S29 anchor:** S28 closeout SHA; S29 produces commit(s) TBD.
- **S30 anchor:** S29 closeout SHA; S30 produces commit(s) TBD.
- **S31 anchor:** S30 closeout SHA; S31 produces commit(s) TBD.
- **Arc closeout:** S31 closeout SHA is the SHA at which the five
  Path C verification-gate conditions hold simultaneously. Phase
  2 surface expansion sessions anchor against the arc-closeout
  SHA or later.
- **Path A relationship:** Path A opens against the Path C
  closeout SHA. Path A closeout (deployment readiness) precedes
  MVP feedback; Path C closeout precedes Phase 2 surface
  expansion. Both gates hold separately.

---

## Appendix: Verification Harness

Mechanical-check spec for the five verification-gate conditions.
A verification agent run post-S31 (ad-hoc, not pre-scheduled)
checks out the S31 closeout SHA and runs each block's `commands`;
the gate condition holds iff every command's output matches
`expected`. This appendix is the binding contract between gate
definition and verification execution; mirrors the post-audit
fix-stack arc's harness shape per the `297256e` precedent.

**Note on `--since` form:** per S27 friction-journal NOTE 2026-
04-29 sub-finding, all `git log --since=` invocations use ISO
form `--since="YYYY-MM-DDTHH:MM:SS"` rather than bare-date form.
Bare-date form returns empty under git 2.43.0; ISO form is
durable.

### Gate 1: MT-05 audit-emit observability live

```yaml
gate: "MT-05 closed — audit-emit failures observable"
checks:
  - id: MT-05-counter-or-flag
    finding: UF-008
    commands:
      - 'grep -nB 3 -A 8 "emitMessageProcessedAudit\|tool_executed.*audit\|session_created.*audit" src/agent/orchestrator/index.ts | grep -iE "metric|counter|audit_emit_failure|swallow"'
      - 'grep -nB 3 -A 8 "session_created" src/agent/orchestrator/loadOrCreateSession.ts | grep -iE "metric|counter|audit_emit_failure|swallow"'
    expected:
      - 'each of the three audit-emit try/catch sites carries either a dedicated counter increment or a structured-flag log line that distinguishes the swallowed-error case from a normal log'
      - 'a single grep-able marker (e.g., "audit_emit_failure" or equivalent) identifies all three sites uniformly'

  - id: MT-05-alert-threshold
    commands:
      - 'grep -rnE "audit_emit_failure|audit emit alert|MT-05" docs/ src/ tests/'
    expected:
      - 'an alert threshold is documented (e.g., in friction-journal NOTE, in operator-runbook, or in a structured config) — the action plan suggests "> 1 failure per 100 agent operations"; the brief-creation session ratifies a concrete number'

  - id: MT-05-test
    commands:
      - 'ls tests/integration/ tests/unit/ | grep -iE "audit.*emit.*fail|swallow.*audit|MT-05"'
    expected:
      - 'integration or unit test asserts the metric/flag fires when audit-emit throws (synthetic failure injection)'
```

### Gate 2: MT-06 PII redaction comprehensive

```yaml
gate: "MT-06 closed — pino + nested audit_log surfaces"
checks:
  - id: MT-06-pino-paths
    finding: UF-010
    commands:
      - 'grep -nE "email|phone|first_name|last_name|display_name" src/shared/logger/pino.ts'
    expected:
      - 'REDACT_CONFIG.paths includes all five PII path globs (e.g., "*.email", "*.phone", "*.first_name", "*.last_name", "*.display_name") alongside existing financial PII paths'

  - id: MT-06-nested-redaction
    commands:
      - 'grep -nB 3 -A 15 "redactPii\|PII_FIELDS" src/services/audit/recordMutation.ts'
    expected:
      - 'redactPii recurses nested objects (not shallow-clone-only as in S25 QW-07); recursion has a documented depth limit'
      - 'PII_FIELDS list unchanged from S25 QW-07 (the nested-traversal extension reuses the field list)'

  - id: MT-06-tests
    commands:
      - 'ls tests/integration/ tests/unit/ | grep -iE "pino.*pii|MT-06|redact.*nested"'
      - 'pnpm test pinoRedaction recordMutation 2>&1 | tail -5'
    expected:
      - 'unit test asserts pino output redacts a log statement containing the five PII fields'
      - 'integration test asserts audit_log.before_state lacks PII fields when written via a mutation that captures a nested PII-bearing row (e.g., user_profile update)'
      - 'tests pass'
```

### Gate 3: MT-03 broad-scope service-layer authorization mechanically enforced

```yaml
gate: "MT-03 closed — every org-scoped service export wraps through withInvariants"
checks:
  - id: MT-03-wrap-coverage
    finding: UF-002 (broader)
    commands:
      - 'grep -rnE "ctx\.caller\.org_ids\.includes" src/services/ | grep -v withInvariants.ts'
    expected:
      - 'zero hits OR only annotated exceptions remain — every match outside withInvariants.ts must be either (a) inside an explicitly-annotated no-org-scoping function, or (b) zero. The wrap-through-middleware refactor moves the check to a single canonical site.'

  - id: MT-03-withInvariants-comment
    commands:
      - 'grep -nA 5 "// .*INV-AUTH-001" src/services/middleware/withInvariants.ts'
    expected:
      - 'the file-top comment names INV-AUTH-001 as covering BOTH reads and mutations (current comment scopes only mutations; S29 updates this per file-top staleness convention from CLAUDE.md)'

  - id: MT-03-no-bypass-test
    commands:
      - 'ls tests/integration/ tests/unit/ | grep -iE "withInvariants.*read|read.*withInvariants|MT-03"'
    expected:
      - 'integration test asserts a read function rejects cross-org access when the caller lacks org_ids membership (verifies wrap fires; complements existing mutation-side tests)'
```

### Gate 4: Mutation-surface CI guards live (LT-01 + LT-03 + LT-04)

```yaml
gate: "LT-01 + LT-03 + LT-04 closed — convention-to-CI-enforcement cluster"
checks:
  - id: LT-03-eslint-restricted-imports
    finding: UF-006 / UF-013
    commands:
      - 'grep -nE "no-restricted-imports|adminClient" eslint.config.mjs'
    expected:
      - 'eslint.config.mjs contains a no-restricted-imports rule that blocks adminClient imports outside src/services/'
      - 'pnpm lint fails on a synthetic violation fixture (e.g., a test fixture that imports adminClient from src/components/)'

  - id: LT-01b-withInvariants-CI-guard
    finding: UF-006
    commands:
      - 'grep -rnE "withInvariants.*CI|wrap.*CI|service.*export.*check" eslint.config.mjs scripts/ .github/workflows/'
    expected:
      - 'a CI check (custom ESLint rule, AST script, or workflow step) verifies that every exported service function in src/services/ either wraps through withInvariants OR carries an explicit no-wrap annotation'
      - 'the check fails on a synthetic bypass fixture'

  - id: LT-01c-hardcoded-test-urls
    finding: UF-006
    commands:
      - 'grep -rnE "hardcoded.*url|test.*url.*grep|CLAUDE.*Rule 8" scripts/ .github/workflows/ package.json'
    expected:
      - 'a CI grep-fail check exists for hardcoded test URLs per CLAUDE.md Rule 8 (the agent:validate target may already perform this check; LT-01(c) verifies it lives or adds it if missing)'

  - id: LT-01d-doc-reality-reconciliation
    commands:
      - 'git log --grep="LT-01.*reconcil\|CLAUDE.md.*reconcil\|doc.*reality" --since="2026-04-29T00:00:00" --oneline | head -3'
      - 'grep -B 2 -A 5 "LT-01.*reconcil\|documentation-reality" docs/07_governance/friction-journal.md'
    expected:
      - 'S30 commit body or a sibling commit references the documentation-reality reconciliation pass; any drift fixes captured in the same commit family'
      - 'friction-journal NOTE summarizes any non-trivial drift surfaced during the reconciliation'

  - id: LT-04-tool-set-drift-check
    finding: QUALITY-006
    commands:
      - 'grep -rnE "ORG_SCOPED_TOOLS.*drift|tool.*registry.*check|ORG_SCOPED_TOOLS.*test" src/agent/ tests/ scripts/ .github/workflows/'
    expected:
      - 'a lint rule or test asserts that ORG_SCOPED_TOOLS Set in src/agent/orchestrator/index.ts:1098-1104 matches the tool registry from toolsForPersona.ts (or equivalent canonical source)'
      - 'the check fails on a synthetic drift fixture (add a tool to the registry without updating the Set)'
```

### Gate 5: LT-02 test coverage closed (five sub-items)

```yaml
gate: "LT-02 closed — five test-coverage sub-items shipped"
checks:
  - id: LT-02a-confirm-reject-routes
    finding: UF-013, S27 inferential-coverage carry-forward
    commands:
      - 'ls tests/integration/ | grep -iE "agent.*confirm.*route|agent.*reject.*route|confirm.*reject"'
    expected:
      - 'integration tests exercise /api/agent/confirm and /api/agent/reject end-to-end (composed agent confirm→service→RPC path; closes the S27-flagged inferential-coverage gap)'

  - id: LT-02b-saturation-curve
    commands:
      - 'ls tests/integration/ tests/unit/ | grep -iE "saturation|conversation.*32|context.*window"'
    expected:
      - 'test characterizes conversation behavior at turn counts up to 32 (replayed or live; brief-creation session pre-decision captured in commit body)'
      - 'test asserts the rotation-policy threshold (per MT-04 sequencing — Path C does NOT ship MT-04, but LT-02(b) characterizes the curve that MT-04 will act on)'

  - id: LT-02c-cross-org-account
    commands:
      - 'ls tests/integration/ | grep -iE "cross.*org.*account|account.*cross.*org|cross.*org.*report"'
    expected:
      - 'integration test attempts to reference an account from org B in an org A entry; assertion exercises S26 QW-05 cross-org trigger (rejection)'

  - id: LT-02d-audit-log-pii
    commands:
      - 'ls tests/integration/ tests/unit/ | grep -iE "audit.*pii|pii.*audit|recordMutation.*pii"'
    expected:
      - 'test asserts audit_log.before_state lacks PII after a mutation captures a PII-bearing row (covers S25 QW-07 + S28 MT-06 nested traversal end-to-end)'

  - id: LT-02e-period-date-range
    commands:
      - 'ls tests/integration/ | grep -iE "period.*date.*range|backdate|date.*period"'
    expected:
      - 'integration test posts entries with entry_date outside the period [start_date, end_date]; assertion verifies S26 QW-03 + S27 RPC rejection path'
      - 'note: this may already exist post-S26/S27; LT-02(e) verifies sufficiency or adds gap-filling cases'

  - id: LT-02-test-pattern-discipline
    commands:
      - 'grep -rnE "find\(.*\).*entry|select.*entry.*find" tests/integration/ | grep -v "trace_id\|entry_id"'
    expected:
      - 'zero hits OR only annotated exceptions — new LT-02 tests follow runtime-lookup-by-natural-key (Soft 9 precedent); no new tests share the find()-without-trace_id-scoping pattern that fired the accountLedgerService running-balance fragility (Phase 2 obligation)'
```

### Verification agent invocation

```bash
# Post-S31 invocation pattern (ad-hoc; not pre-scheduled):
# 1. Check out the S31 closeout SHA.
# 2. Run each gate's checks; report per-gate PASS / FAIL with evidence.
# 3. Overall verdict: Phase 2 surface expansion unblocked iff all 5 gates PASS.
# 4. Path A (deployment readiness) remains a separate gate before MVP feedback.

git checkout <S31-closeout-SHA>
# (verification agent runs the five gate blocks above and reports)
```

If any gate FAILs, the executing session for that gap reopens; do
not proceed to Phase 2 surface expansion until the failing gate's
closing commit lands and re-verification passes.

**Phase 2 unblock vs. MVP feedback unblock are distinct.** Phase
2 surface expansion is unblocked at Path C arc closeout (five
gates PASS). MVP feedback is unblocked at Path A closeout
(deployment-readiness gate, scoped separately at Path A's own
arc summary). Future audits and future operator-self should treat
these as two gates, not one.
