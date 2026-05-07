## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X
- NOTE — observation worth preserving for next phase

## Phase 2

- 2026-05-05 NOTE — Phase 1.Storage chunk 3 hashing implementation:
  Node crypto.createHash chosen over Web Crypto crypto.subtle.digest
  at drafting time. Counter-evidence: Web Crypto's BufferSource type
  requires ArrayBuffer-backed views (excludes SharedArrayBuffer);
  Uint8Array parameters can't statically prove this in TypeScript
  strict mode, surfacing as TS2345 at compile time. Two paths
  surfaced: (α) switch to Node crypto.createHash with sync API; (β)
  keep Web Crypto with a type assertion. Path α locked. Reasoning:
  the portability claim toward Web Crypto was speculative (codebase
  is committed Next.js on Node); type assertion in Path β would be
  load-bearing at every crypto.subtle callsite and accumulate; sync
  API matches SHA-256-over-a-buffer's actual CPU-bound nature; Node
  crypto.createHash matches the established repo convention. Cost
  of reversing if a future chunk genuinely needs Edge runtime is a
  one-file rewrite — same size as today's rewrite — so no
  compounding cost. Path α applied at chunk 3 commit. The
  Uint8Array parameter type from chunk 2 contract preserved
  (Path α is implementation choice, orthogonal to interface type).

- 2026-05-01 NOTE — Path A carve-out: rate-limit on
  `/api/agent/message` lands pre-Phase-2A (single bundled
  commit; brief at
  `docs/09_briefs/post-mvp/path-a-rate-limit-agent-message-brief.md`).
  Soft-fail-open posture deliberately chosen: Redis outage →
  no-limit-during-outage, NOT user-facing outage. Anthropic
  per-key spend cap is second line of defense (operator-set
  at $50 on 2026-05-01). V1 policy
  numbers: 30/min burst + 200/hour ceiling, both keyed on
  `user_id`; tuning is Phase 2 work. Other three agent
  endpoints (`/conversation`, `/confirm`, `/reject`) and the
  ~30 org-mutating routes stay deferred to Post-MVP Path A
  cleanup. CORS audit + CSRF Origin-check sweep also stay
  deferred. Codification candidate at N=2 if a future
  deferred carve-out from a multi-item phase-cleanup arc
  lands the same way (single-route surgical extraction with
  explicit deferral of siblings).

- 2026-04-27 NOTE [ROUTE?] — session-scope reflection has no clean
  retrospective destination per current Documentation Routing rule;
  refinement candidate for next governance amendment.
- 2026-04-27 NOTE [ROUTE?] — pattern observations that are also
  deferred-codification candidates can legitimately split between
  `friction-journal.md` and `open_questions.md` per current routing
  rule; works in practice but unspecified; refinement candidate.
- 2026-04-27 NOTE [ROUTE?] — brief-creation sessions (e.g.,
  S15-brief-creation, S16-brief-creation) don't always acquire
  session locks; pattern fired N=2 (`f90753b` 2026-04-26,
  `6e76d89` 2026-04-27) — N=2 is split-trigger threshold per
  Documentation Routing convention §Codification thresholds; if
  N=3 fires, codify session-lock sub-type for documentation-only
  sessions.
- 2026-04-27 NOTE [ROUTE?] — Soft 8
  (`soft8EntryEightReplay.test.ts`) has post-seed snapshot UUIDs
  for ACCOUNT_CASH, ACCOUNT_UNEARNED_REVENUE,
  ORG_REAL_ESTATE_FISCAL_PERIOD_ID — fragile to
  `db:reset:clean`. Soft 9 (S19, commit `13e11f7`) uses runtime
  lookup by natural key (`org_id` + `account_code`; `org_id` +
  period name + `is_locked`) instead. Pattern for future tests:
  prefer runtime lookup over hardcoded UUIDs. Soft 8 retrofit
  candidate; codification N=2 if another test repeats hardcode.
- 2026-04-27 NOTE [ROUTE?] — `accountLedgerService.test.ts` tests
  3 (line 269) and 6 (line 346) share a `find()`-without-
  trace_id-scoping pattern: each posts a JE with non-unique
  (date, amount, debit/credit) signature, then `find()`s "the
  new row"; under accumulated state from repeated `pnpm test`
  runs, `find()` returns a stale row and delta math breaks.
  Test 3 fired S18 push-readiness gate; test 6 fired S19 Task 7
  Step 4. Fix: scope `find()` by trace_id, or capture
  `entry_id` from `post()` return. N=2; next test-hygiene workstream.
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid validation: PARTIAL
  per Meta A. H3b-alone on shapes 12 (1 run, productive-no-
  tentative) and 13 (2 runs, productive-tentative-on-ambiguous
  per §4a — no staling, no orphan). Shapes 15+20 untried;
  per-call halt at shape 13 run 2 ($0.163 > $0.15). Cumulative
  $0.408/$0.75 (54%). Phase 2: caching enable, 15+20 re-
  validate, CoA 4200-vs-4300 disambiguation, run-2 +30% cost
  calibration. Run record: oi3-m1-run-20260428T044651Z.json.
- 2026-04-27 NOTE [ROUTE?] — S20 Task 2 Step 1 grep recipes
  used literal backticks (`` `canvas_directive` ``) which
  false-negatived against TypeScript template-literal escaped
  backticks (`` \` ``) in the source. Re-grep with distinctive-
  prose patterns (`may carry an optional`, `with a tentative`)
  resolves cleanly. Pattern for future briefs: prefer prose
  patterns over backtick-quoted code in grep recipes targeting
  template-literal source. Codification candidate at N=2 if
  another brief repeats. Brief-recipe refinement.
- 2026-04-27 NOTE [ROUTE?] — S20 verification window surfaced
  that env vars exported in operator's terminal don't propagate
  to WSL session. Two paths: (i) source .env.local in-shell at
  session start (L2); (ii) tsx --env-file=.env.local at
  invocation (L3). Pattern for future paid-API or Supabase-
  touching scripts: bake --env-file=.env.local into invocation
  commands at brief-write time. Codification candidate at N=2
  if another script's brief omits the flag. Brief-recipe
  refinement.
- 2026-04-27 NOTE [ROUTE?] — S20 Option iii.b stdout-write
  interception attempted at S20 Task 4 Step 1 but failed
  against the project's pino logger: pino's default destination
  (SonicBoom direct fd-1) bypasses process.stdout.write monkey-
  patching. Switched to A2: SDK-wrapper via __setClientForTests
  injecting a capturing client proxy. No src/ touches; uses
  existing test-only export. Pattern: for future paid-API
  harnesses needing usage capture, prefer SDK-wrapper over
  log-line interception. N=2 if repeated against pino.
- 2026-04-27 NOTE [ROUTE?] — S20 M1 dry-run shape 12 cost
  $0.119 vs scoping doc §6 Part 5 estimate $0.015-0.020/
  invocation (~6-8× over). cache_read_tokens=0 and cache_
  creation_tokens=0 across all callClaude calls; prompt caching
  not active for orchestrator's request shape. Brief assumed 2
  callClaude calls per handleUserMessage; dry-run measured 3 on
  shape 12 — fourth-rail amplification compounds cache-disabled
  per-call cost. Phase 2: investigate Anthropic prompt-caching
  config. N=2 if a future harness repeats.
- 2026-04-27 NOTE [ROUTE?] — S20 Task 9 paid run shape 13
  emitted card+tentative on both runs (2 of 3) — productive-
  no-stale-no-orphan, but the brief's 4-state hypothesis-
  discrimination model only had emitted_card_no_tentative for
  shape 13 (per §6 Part 5's "C7-attempted productive shapes
  12, 13, 14"). Per §4a surgery, shape 13's gross-vs-net
  ambiguity legitimately warrants tentative — surgery success
  the brief's classifier didn't anticipate. Convention #8 fire
  (brief-authoring miss, not surgery or classifier-mechanic
  miss); N=3 codification trigger fires.
- 2026-04-28 NOTE — S22 caching confirmed: cache_creation 8407
  on call 1, cache_read 8407 on calls 2-3 (system+tools prefix
  stable within handleUserMessage; §4a + Site 2 preserved).
  Cost $0.119→$0.0808 per shape 12 dry-run (-32%; less than
  -58% projected — uncached messages delta 9433 tokens, 1.12×
  cached prefix). Cross-turn (Phase 2+) targets -58%. Shape
  15+20 now affordable: 9× × ~$0.08 = ~$0.72 fits scoping
  doc $0.75 ceiling. Convention #8 N=4 (quantitative-behavior
  gap). Run record: oi3-m1-cached-run-20260428T061604Z.json.
- 2026-04-28 NOTE — S23 DEV_WORKFLOW.md authoring: §2 sub-shape
  line-number citations were claimed verified but had off-by-
  one errors caught at synthesis review. Fix: dropped line-
  numbers in favor of entry-content markers (G2 / A2 /
  classifier-strictness-gap / S22 caching). Convention #8 N=5
  evidence (quantitative-behavior sub-shape in citation-
  arithmetic domain — same mechanism: claimed verified, not
  actually verified). Captured for next codification pass;
  not codified per author-judgment clause.
- 2026-04-28 NOTE — S25 non-ledger Day-1 closed at `9c0079b`:
  QW-01 MFA wiring + QW-02 read-path org checks + QW-07
  audit_log PII redaction. Six closeout items in commit body:
  (a) UF-009 doc drift (src/middleware.ts vs repo-root);
  (b) COA.get zero-callers, Edit-5 contingency moot;
  (c) UF-008→UF-002 closed by guard-not-deletion;
  (d) COA.list() error-wrap bundled per pattern-consistency;
  (e) userProfileAudit CA-15 assertion updated post-redaction;
  (f) COA.get combined-WHERE defense-in-depth vs brief's post-
  fetch (tighter; CA-23 test 3). 556/558; S26 unblocked.
- 2026-04-28 NOTE — S26 ledger-integrity Day-1 closed at
  `cbb4018`: QW-04 immutability + QW-03 date-range + QW-05
  cross-org. UF-001 immut + UF-004 + UF-005 closed (S27 closes
  atomicity). (a) Class 2 finding: test_post_balanced/unbalanced
  used current_date vs historical periods; period-range forced
  p_entry_date param. (b) journalSourceExternalId afterAll moot
  under append-only → per-run unique values. (c) DROP FUNCTION
  IF EXISTS before CREATE OR REPLACE (PostgREST overload).
  (d) crossOrgRls cascade carry-forward + entry_number UNIQUE
  decision (default defer) before S27 Task 3. 546/3/20.
- 2026-04-29 NOTE — S27 ledger atomicity Day-1 closed at
  `9334c1f`: MT-01 write_journal_entry_atomic RPC + service
  refactor + 5 rollback tests. Closes UF-001 atomicity facet
  on the post path. Paid regression: $0.07999695 cumulative on
  shape-12 single-invocation (run-record at
  $HOME/chounting-logs/oi3-m1-run-s27-20260429T015451Z.json).
  Inferential coverage: agent path→service (paid) + service→
  RPC (rollback 5/5) → composed agent confirm→RPC inferred;
  pre-existing LT-02 gap. Closeout in commit body. New surface:
  (a) entry_number UNIQUE deferred per Task 3 §0 option (a);
  unique_entry_number_per_org_period (mig 0004) is collision
  detector; FOR UPDATE bundles with Phase 2.
  (b) Supabase CLI parser bug at v1.226.4 fixed by v2.95.4.
  (c) Two-binary trap: pnpm exec resolves to node_modules
  pinned, not brew. Function-name-length bisection correlation
  reproducible byte-identically; no causal mechanism, moot
  under upgrade.
  (d) Verification-before-assertion applies to reviewers:
  `unique_entry_number_per_org_period` flagged as fabricated,
  retracted on lookup against `mig 0004:46`.
  (e) accountLedgerService running_balance value-drift third
  carry-forward; Phase 2 obligation: characterize value-drift
  vs collision-drift.
  (f) Harness `oi3-m1-validation.ts` constants permanently
  updated for S27-pattern reuse: ceilings 0.20/0.10, anchor +
  session_label. 571/3/20.
- 2026-04-29 NOTE — Post-S27 verification gate at `297256e`:
  all four gates substantively PASS; three mechanical drifts
  fixed by follow-up commit. UF-001/UF-003 lineage
  reconciliation: per `unified-findings.md`, UF-001 = ledger
  immutability (closed by S26) and UF-003 = transaction
  atomicity gap on multi-step writes (closed by S27). S27
  commit bodies (`9334c1f`, `297256e`) cite "UF-001 atomicity
  facet" — Phase-1.1 carryover framing where the original
  Phase 1.1 UF-001 covered both. **S27 substantively closes
  UF-003** per Phase 1.2's distinct numbering. Future audit
  grep for `UF-003` should treat S27's commits + this NOTE +
  the rollback test suite as the lineage. Harness Gate 4
  UF-001 expected text aligned to immutability-only
  (atomicity moved to UF-003 gate). Other drifts fixed:
  test file name (`postJournalEntryRpcRollback`), run-record
  path (`oi3-m1-run-s27-`). Sub-finding caught at re-verification:
  harness `--since=2026-04-28` (bare date) returns empty under
  git 2.43.0; replaced with ISO form
  `--since="2026-04-28T00:00:00"`. Both git-log and friction-
  journal evidence-clauses now produce findings as designed.
  Phase 2 surface expansion gate-pass: mechanical verification
  clear at this commit; unblock declaration is operator-pending.
- 2026-04-29 NOTE — Path C arc scoping at HEAD (post-d39ec09):
  arc summary committed at `docs/09_briefs/phase-1.3/path-c-arc-summary.md`
  scoping S28 (MT-05+MT-06) → S29 (MT-03 broad) → S30 (LT-01+
  LT-03+LT-04 CI-enforcement cluster) → S31 (LT-02 test
  coverage). Five-gate verification harness mirrors post-audit
  fix-stack arc shape; brief-creation sessions follow
  per-session post-ratification. Sub-finding caught at harness
  authoring: verification-harness YAML uses single-quoted
  strings; backslashes inside single-quoted YAML are literal,
  not escapes. Predecessor harness at
  `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` used
  `\\|` doubles which do not behave as alternations under
  `git log --grep` or `grep -E` — the YAML parser hands the
  literal string `UF-001\\|ledger` to the shell, and the regex
  engine treats `\\|` as a literal-backslash-then-pipe, not
  alternation. Path-C harness uses `\|` singles throughout
  (zero `\\|` occurrences verified via grep against the saved
  file). Post-S27 verification-gate substantive PASS despite
  the predecessor's doubles suggests either (a) verification
  agent escape-normalization, (b) manual re-running with
  corrected escaping, or (c) substring fallback matching on
  the pre-alternation portion of the pattern; either way the
  singles form is the durable shape. Same mechanical-drift-
  in-verification-harness shape as the post-S27 `--since=`
  bare-date / ISO-form sub-finding — both are "looks right
  but doesn't behave right under specific tool versions."
  Codification candidate at N=2 if a future harness reproduces
  the same drift. Optional retroactive fix to
  `post-audit-fix-stack-arc.md` (convert doubles to singles)
  deferred — closed-state doc, operator's call whether to
  fix-in-place or leave as known-drift item.
- 2026-04-29 NOTE — S29 brief-creation surfaced substrate divergence
  from arc-summary scope. Path C arc summary at `5775ae6` framed S29
  as "every org-scoped service function hand-rolls the same guard
  pattern as reads" — a one-pattern model. S29 brief-creation reads
  surfaced nine distinct patterns (A wrap target ~18 sites; B
  route-handler-wrapped ~17; C entity-id-only Pattern .in() scoping
  2; D own-profile-only 3; E entity→parent→org check 1; G1 RLS-relies-
  but-uses-adminClient security gap 4; G2 reference-data no-scoping-
  applicable 2; H user-id-scoped target-vs-caller asymmetry 1 site
  dead at bounded-read surface; I token-bearer 2). Plus Pattern J
  (auth-helpers, out of scope) and J-variant (loadOrgContext-shape,
  flagged for Phase 2). Corrigendum at `7ba3455` splits S29 into
  S29a (Pattern A wrap, ~18 sites; S29a brief-creation post-corrigendum)
  + S29b (Patterns C/E design + migration, 3 sites; brief-creation
  post-S30). Pattern G1 routed as separate friction-journal finding
  (severity assessment pending operator). Pattern H routed as dead-
  code finding with deferred-full-grep caveat. Comment-fix scope
  expanded to seven non-security fixes ((a)-(e), (i), (j) per the
  corrigendum's pattern-landscape appendix) + three G1-conditional.
  Codification candidate fired: read-completeness threshold (sibling
  of Convention #8 sub-shape #3); single firing with progressive
  depth — partial read surfaced 5 patterns, complete read surfaced
  9 + G1 + H. N=1; not codified. Codification target's failure mode
  named: "implementation read was partial enough to support a
  confident-shaped finding but incomplete enough that the finding
  mis-describes the substrate." Codification at N=3 per Documentation
  Routing convention if reproduced. Brief-creation session-lock not
  acquired (third firing of claim-without-substrate at brief-creation
  cwd from this session's vantage; structural-shell-mismatch hypothesis
  durable; [ROUTE?] thread updates with the morphed codification target
  "verify-after-acquire as load-bearing step in brief-creation lock
  acquisition convention"). Path C verification harness Gate 3 + Gate 4
  expected text revised; dependency graph shifted to S28 → S29a → S30 →
  S29b → S31; ship-order ~7-10 working days (was ~5-7).
- 2026-04-29 NOTE — S29a closeout: Path C MT-03 Pattern A wrap
  mechanization + α-class-unify (this commit family). Nineteen-element
  inventory captured at execution closeout.

  (1) **UF-002 closure citation (Pattern A facet).** Surfaces closed:
  16 Pattern A wrap sites across 8 service files (chartOfAccountsService,
  periodService, accountBalanceService, journalEntryService.list,
  accountLedgerService, aiActionsService, recurringJournalService
  listTemplates+listRuns, reportService ×4); withInvariants throws
  unification (α-class-unify); 7 legitimate-exception annotations
  (3 Pattern D in userProfileService, 2 Pattern G2 at
  taxCodeService.listShared and orgService.listIndustries, 2 Pattern I
  in invitationService); 9 comment fixes ((a)-(e), (i), (j) re-framed,
  (k), (l) added at execution per (γ)-ratification of brief-spec
  scope-gap); bounded test-migration (5 sites, 2 files:
  serviceMiddlewareAuthorization.test.ts + periodLockUnlock.test.ts).
  UF-002 broader closure pending S29b (Patterns C/E).

  (2) **Severity-elevation substrate-quantification (refined per #17).**
  Corrigendum's "test-suite delta" framing was reframed at brief-creation
  to "production-path 403→500 regression on cross-org-deny hot path";
  substrate sweep quantified the blast radius to 42 route handlers
  (instanceof ServiceError branches in src/app/api/). At execution-time
  substrate review, element #17 surfaced that the production-path
  regression risk was never actually present due to
  InvariantViolationError-extends-ServiceError subclass-instanceof
  semantics; (α-class-unify)'s justification rests on cleaner test-suite
  shape and uniformity, not production-path-regression elimination.

  (3) **Fractal-substrate-fidelity codification (graduated at N=3 at
  brief-creation; this session = post-codification durability evidence).**
  Codified shape: "Substrate fidelity is fractal — appendix descriptions,
  upstream framings, and mid-session substrate claims can all over-
  generalize and need substrate-re-derivation at use time, regardless of
  source artifact's recency or claim-author's confidence. Verify-before-
  assert applies recursively at every layer of inheritance from substrate
  to claim." Brief-creation provenance: Firing 1 = Pattern D shape-
  divergence; Firing 2 = G1 OQ-07 citation layer; Firing 3 = item (c)
  anchor location. Post-codification firings this session (N=5+):
  elements #13, #14, #15 (with multiple sub-shapes: spec gap,
  estimate-vs-substrate, retroactive-ratification, L2 placement,
  periodLockUnlock import-already-present, item (j) cross-item
  inconsistency), #16, #17, #18. The codified convention's "applies
  recursively at every layer" clause is durable post-graduation; firing
  rate is itself substrate evidence of durability — codification didn't
  "close" the convention; it surfaced more instances by giving the
  executor a frame to recognize them within. Specific sub-pattern: brief-
  creation scope-derivations are particularly prone to under-fidelity
  because they're inherently aggregative; aggregation amplifies any
  single missed sub-instance (#15, #16, #18 are concrete N=3 of this
  sub-pattern). Counter-example showing sufficient-fidelity: brief's
  Task 7 Step 3 anticipation of accountLedgerService running-balance
  fragility was substrate-grounded (corrigendum's "what stays open"
  table named the obligation precisely because the wrap was anticipated
  to interact with it). When brief-creation has substrate-grounded
  anticipation rather than inheritance from upstream, the convention's
  gap-detection load drops.

  (4) **Pattern A site count substrate-correction.** Corrigendum's "~18
  sites" was approximation; substrate-grounded count is 16. Concrete
  instance under #3.

  (5) **Pattern D shape-divergence sub-finding.** Folded as Firing 1 of
  #3's brief-creation provenance.

  (6) **G1 finding-shape refinement (OQ-07 citation layer).**
  Corrigendum's G1 framing ("comment factually wrong about RLS coverage")
  substrate-refined to "comment cites resolved-decision document the
  code doesn't honor" (orgService.getOrgProfile cites OQ-07's "rely on
  RLS at DB level + route handler check" but uses adminClient and has
  no route-handler check). Severity assessment for G1 remediation
  refines from "comment fix" to "missing-mechanism-or-misremembered-
  OQ-resolution discriminator." **Operator-pending decision-fork:**
  (a) sibling Phase 1.3 session for G1 remediation, (b) Phase 2
  obligation, (c) hot-fix.

  (7) **Comment-fix scope-gap finding.** Item (k) —
  journalEntryService.ts:1-7 file-top — was missing from the
  corrigendum's seven-item scope; added during brief-creation. Item
  (j)-framing also amended to substrate-grounded staleness on
  listTemplates/listRuns. At execution, item (l) —
  userProfileService.ts:1-9 file-top — surfaced as a third comment-fix
  scope-gap instance (sibling of (k) and (j)); ratified at (γ)-rhythm
  and included as ninth non-security fix.

  (8) **Agent-side capability misrepresentation (over-claim direction).**
  Four prior firings of "lock acquired but no on-disk substrate"
  collapsed into one structural finding: the human-as-narrator was
  describing script execution they cannot perform. Resolution:
  passive/instructional voice from non-executing parties; verify-after-
  acquire is the discipline that catches the failure mode.

  (9) **Capability-symmetry sub-finding (under-claim direction).**
  Brief-creation surfaced the inverse — agent (with Bash/Edit/Write
  capabilities) had narrated read-only filesystem framing for itself.
  Pairs with #8 as bidirectional siblings under the same substrate-vs-
  claim discipline.

  (10) **Gate-cadence-calibration sub-finding.** Discipline-layer
  observation that gate cadence is itself a discipline, not a fixed
  rule. Structural decisions earn sub-gates ((a), (b), (c)); mechanical
  pre-flights earn integrated specification ((d)'s five-sub-item
  single-sweep design). Sibling of #3 at the rhythm-of-discipline layer
  rather than substrate-grounding-of-claims layer.

  (11) **Pattern C/E zero-test-coverage sub-finding.** Pre-flight
  (d)(iii) surfaced that Pattern C/E's three sites
  (journalEntryService.get, recurringJournalService.getTemplate,
  recurringJournalService.getRun) have zero test files exercising them
  at the bounded-read surface. S29b's design-bearing migration would
  land against an untested-shape baseline. **Operator-decision item
  for LT-02/S31 scope:** should S29b's pre-flight add C/E test coverage
  (in scope or sibling), or should LT-02/S31 absorb the gap?

  (12) **Lock-mechanical-discipline three-mode finding.** Pre-commit
  hook operates in three modes: no-lock-no-COORD_SESSION (advisory
  warning only; commits proceed); lock-held-no-matching-COORD_SESSION
  (blocks with explicit error); lock-held-matching-COORD_SESSION
  (clean). Lock-acquisition is what UPGRADES the hook from advisory
  to blocking. Without lock, capability misrepresentation is invisible
  at commit time; with lock, mismatches surface. The four prior firings
  of claim-without-substrate (#8 over-claim direction) were operating
  in advisory mode, depriving the hook of enforcement teeth. Substrate-
  mechanical confirmation of why verify-after-acquire discipline matters:
  it's the user-facing surface of the mechanism that activates
  commit-time substrate verification. Pairs with #8 and #9 at the
  substrate-vs-claim layer; pairs with #10 at the rhythm-of-discipline
  layer.

  (13) **Chain-description drift.** S29a brief's Task 1 Step 2 chain
  description (corrigendum then arc-summary then S28-brief then SHA-fix-
  forward ordering) was substrate-wrong; actual chain has arc-summary
  older than S28 brief, not newer (S28 brief committed before arc
  summary; Path C scoping NOTE sits between them). Inherited from
  continuity brief's chain claim at S29a brief-creation session start;
  propagated through brief-drafting without substrate verification;
  pre-flight at execution caught it. Non-blocking (load-bearing parent
  anchor matches); folded as documentation-accuracy observation.

  (14) **aiActionsService line-number drift + periodService trace-vs-
  substrate micro-drift.** Brief's anchor table cited
  aiActionsService.ts:41; substrate at execution HEAD shows :42.
  Inherited from agent's own pre-flight derivation at brief-creation.
  Plus periodService wrap-line trace (:25/:46/:92/:172) vs post-edit
  substrate (:25/:49/:96/:180): 4-line micro-drift between the agent's
  reported numbers and substrate state. Both fold under #3's "applies
  recursively" clause; no fresh graduation.

  (15) **Brief-spec gap on body-comment scope (with sub-shapes).**
  Brief's Task 3 Step 1(b) instructed orphan-comment removal for items
  (b), (c), (e) only; substrate at execution surfaced 2 additional
  orphan auth comments at periodService.listOpen and periodService.isOpen
  (plus 1 already-implicitly-handled at chartOfAccounts.get). Resolved
  via (γ)-rhythm scope-amend with ratified spirit-of-brief reading; L2
  vestige // S25 QW-02 / UF-002 preserved between JSDoc and wrapper at
  periodService.isOpen. Sub-shapes folded into this element: (i)
  estimate-vs-substrate gap (mid-execution "8-10 sites" estimate was
  4-5x over substrate-grounded count of 2); (ii) retroactive-ratification
  disclosure on chartOfAccounts.get's 2-line orphan removed under
  unratified judgment call before scope question surfaced (disclosure
  is the load-bearing discipline anchor, not the revert); (iii) post-
  edit line-number drift on text-anchored references (substrate-
  confirms-discipline rather than fresh gap); (iv) periodLockUnlock
  import-already-present pattern (brief said "replace import" but
  substrate had both InvariantViolationError and ServiceError already
  coexisting; migration was "drop redundant" not "replace"); (v) item
  (j) cross-item internal-consistency gap (brief's (j) replacement
  text omitted the INV-SERVICE-001 lead-line that items (i)/(k)
  preserve; synthesis-fix mid-execution folded mutations + reads into
  one coherent block).

  (16) **Brief pre-flight gap on test-floor verification.** Brief's
  Task 7 expected pnpm agent:validate 26/26 green at execution HEAD.
  Substrate at execution showed 6/26 — pre-existing test-DB state
  pollution from prior runs (crossOrgRlsIsolation hardcoded-UUID
  duplicate-key), orthogonal to S29a edits (stash-revert isolation
  confirmed identical 6/26 at unmodified HEAD). Brief implicitly
  conflated "clean-baseline floor" with "current-DB floor"; pre-flight
  at brief-creation didn't run the test floor itself, only grepped
  substrate. Resolution: pnpm db:reset:clean && pnpm db:seed:all
  restores the clean-baseline pre-condition; post-reset agent:validate
  confirms 26/26 floor. Sub-finding for future brief-creation
  discipline: pre-flight should include test-floor verification, not
  just grep-based substrate verification — the test floor is itself
  substrate that brief-creation can over-anticipate. Recurrence at
  Task 7 (post-Task-3 successful 26/26 run accumulated state requiring
  second reset) confirms the recovery pattern is durable.

  (17) **α-class-unify justification substrate-correction.** Brief's
  framing of (α-class-unify) as eliminating "production-path 403→500
  regression risk" (substrate-quantified to "42 route handlers") was
  substrate-ungrounded. InvariantViolationError extends ServiceError
  (errors.ts:11; JSDoc at lines 7-10 explicit: "Subclass of ServiceError
  so catch blocks that handle ServiceError still work, while tests
  can assert the specific class"); the 42 route-handler instanceof
  ServiceError branches were already catching InvariantViolationError
  throws cleanly via subclass-instanceof semantics. The regression
  risk the brief framed never existed. (α-class-unify) is still the
  right call for sub-rationales that do survive substrate correction
  (cleaner test-suite shape, one fewer class-indirection layer,
  uniformity with rest of service layer), but the production-path-
  regression framing was a mid-derivation gap. Inherited from
  corrigendum's "test-suite delta" framing then brief-creation's
  "production-path regression" elevation then substrate at execution
  closure of the inheritance-relationship gap. Element #2 refinement
  note points here.

  (18) **userProfileService comment-fix scope gap → resolved as item
  (l).** Substrate at execution showed userProfileService.ts:3 carrying
  // INV-SERVICE-001 export contract: plain unwrapped functions. —
  same shape as items (i), (j), (k) (file-top INV-SERVICE-001
  declarations claiming "plain unwrapped"); same staleness post-S29a
  (post-Task-5, the file is annotated-not-wrapped). Brief-creation's
  comment-fix scope-derivation missed it despite same-shape match.
  Sibling of #15 at the cross-item-scope-completeness layer. Resolved
  via (γ)-rhythm: included as item (l), Task 6 expanded from 5 fixes
  to 6. Total non-security comment-fix scope at S29a closeout: 9.

  (19) **Task 7 full-suite regression: three failures classified via
  stash-revert isolation.** (a) verifyAuditCoverageRoundTrip: pre-
  existing carry-forward (HEAD bafd4f9 fail = post-edit fail; expected
  1 gap, got 159; data-driven). Orthogonal to S29a. Disposition:
  continue carrying forward unchanged. (b) accountLedgerService
  running-balance ×2 (test 3 line ~269, test 6 line ~346): brief-
  anticipated wrap-driven carry-forward (HEAD pass → post-edit fail).
  Phase 2 obligation per corrigendum's obligations.md §6 entry. Brief's
  anticipation was substrate-grounded — counter-example to fractal-
  fidelity-firing-on-gaps showing what sufficient-fidelity prediction
  looks like. Disposition: NOTE-document, do not remediate. (c)
  crossOrgRlsIsolation cascading pollution: not a behavioral
  regression; passes 20/20 in fresh-DB isolation; downstream of
  accountLedgerService's failure-state polluting journal_entries with
  rows whose UUIDs collide with crossOrgRlsIsolation's beforeAll setup
  INSERT. Disposition: NOTE-document as cascading carry-forward.
  Stash-revert isolation candidate evolved at this firing (N=2): used
  at Task 3 baseline-pollution diagnosis (N=1) and Task 7 failure
  classification (N=2). Capability evolved from "baseline-vs-edit
  discriminator" to "canonical mechanism for classifying failures into
  orthogonal/wrap-attributable/cascading buckets" — classification
  capability enables disposition decisions (carry-forward vs. halt)
  without ambiguity at the test-runner output layer. N=3 graduates
  per Documentation Routing convention.

  Net outcomes this commit family: 16 Pattern A wraps; α-class-unify
  with codes-verbatim (Hard constraint B preserved);
  InvariantViolationError reach bounded to errors.ts class definition
  (Hard constraint A preserved); 7 canonical-form annotations (Hard
  constraint C); zero route-handler edits (Hard constraint D —
  additive-only on route handler side); 9 comment fixes; 5-site
  test-migration green; pnpm agent:validate 26/26 post-reset; pnpm
  typecheck clean; full suite 551/574 passed (3 failures classified
  per element #19). S30 unblocked: brief-creation against this S29a
  closeout SHA. S29b sequences after S30 per the corrigendum's revised
  dependency graph.
- 2026-04-30 NOTE — S30 hot-fix closeout: G1 cross-org data leak
  closure (this commit). Element #6 G1 decision-fork resolved via
  Variant γ; six-element inventory captured at execution closeout.

  (1) **Element #6 G1 closure citation.** Pattern G1's four sites
  (orgService.getOrgProfile, addressService.listAddresses,
  membershipService.listOrgUsers, invitationService.listPendingInvitations)
  are now route-handler-gated via explicit
  caller.org_ids.includes(orgId) checks returning 403 ORG_ACCESS_DENIED
  at four GET handlers (/api/orgs/[orgId]/{profile,addresses,users,
  invitations}). Both element #6 framings ("missing-mechanism" AND
  "misremembered-OQ-07-resolution") confirmed TRUE at S30
  brief-creation (d-pre) substrate-grep; this hot-fix closes both.
  JSDoc reconciliation at four service-layer functions plus
  invitationService.ts file-top reframe per S29a item (i) closes the
  misremembered-OQ-07 sub-finding; route-handler check closes the
  missing-mechanism sub-finding. Four cross-org regression tests at
  tests/integration/orgGetCrossOrg.test.ts cement the fix as ongoing
  CI evidence.

  (2) **Substrate-grep-first as ratification-shape (codification
  graduated at S30 brief-creation N=3; this hot-fix is closure-
  execution evidence).** S30 brief-creation arc fired three
  substrate-greps that flipped or grounded operator priors:
  (a1-sub-1′) Pattern B AST-shape verification; (c4) ORG_SCOPED_TOOLS
  Set semantics verification; (d-pre) G1 route-handler check
  verification. (d-pre) was the third firing AND the one that flipped
  operator's prior (Variant β Phase-2-obligation) to ratified
  (Variant γ hot-fix) on substrate evidence. This hot-fix is the
  closure-execution of that flip — pre-flight substrate-evidence-
  grounded ratification produces the right work product when the
  operator's prior was substrate-ungrounded. Negative-test-of-the-
  test confirmed at Task 4 Step 4: reverting one route's check
  caused that route's regression test to fail (cross-org GET
  returned non-403); re-applying restored 4/4 green. Direct
  evidence the regression test catches the bug.

  (3) **Element-pre-7 family closure (substrate-fidelity-gate
  codification continuing-firings post-graduation).** S30
  brief-creation graduated brief-creation-pre-flight-as-substrate-
  fidelity-gate at N=3 (pre-1/2/3) with continuing firings at pre-4
  (brief-drafting introducing operator-pending without ratification)
  and pre-5 (brief-drafting over-claiming substrate-fidelity). Hot-
  fix brief-creation surfaced pre-7 (anchor drift at lock-acquisition;
  HEAD shifted from 53aa533 to ee35abf via orthogonal .gitignore
  cleanup), pre-7-sub-1 (parent-brief assumption gap on test-fixture
  pattern), pre-7-sub-2 (parent-brief speculative lean on (b-shape);
  three-cadence flow), and pre-7-sub-3 (brief-drafting introduced
  deferred-to-execution sub-decision without dialogue ratification —
  sibling shape to S30 pre-4 at hot-fix-brief-drafting cadence;
  second instance of same shape across briefs). Seven-plus
  post-codification firings across four distinct cadence layers
  (brief-creation pre-flight, brief-drafting decision, brief-drafting
  derivation, lock-acquisition); the codified discipline now has
  substrate-confirmed firing at every cadence layer it could
  plausibly fire at. Hot-fix execution surfaced no additional
  substrate-fidelity-gate firings at the execution-time substrate
  cadence — Task 1 Step 4 substrate re-verification matched brief-
  creation pre-flight findings exactly with zero drift across 4
  routes, 4 services, conversationLoadEndpoint pattern, ORG_ACCESS_DENIED
  → 403 mapping.

  (4) **Sub-finding: verify-and-halt instruction as load-bearing
  catch-mechanism.** At pre-7, the prompt's explicit "verify at
  brief-creation pre-flight; halt on drift" instruction is what made
  substrate-verify fire at lock-acquisition rather than later.
  Without that instruction, lock-acquisition would have proceeded
  silently against stale 53aa533 substrate. Future hot-fix or
  execution prompts should carry that instruction explicitly when
  they assert anchor SHA — small prompt-engineering discipline that
  codifies the catch-shape.

  (5) **OQ-07's resolved-decision integrity.** Pre-this-hot-fix,
  four service-layer JSDocs cited OQ-07's resolution ("rely on RLS
  at DB level + route handler check") but neither layer implemented
  it (services use adminClient bypassing RLS; route handlers had no
  caller.org_ids check). Element #6 named this discriminator as
  "missing-mechanism vs misremembered-OQ-07-resolution"; substrate
  at S30 (d-pre) confirmed BOTH true. Post-this-hot-fix: route-
  handler check is real; JSDoc cites the route-handler check; OQ-07's
  resolved decision integrity restored. **Codification candidate at
  N=1: "Resolved-decision-citation as contract."** When JSDoc cites
  a resolved-decision document (open question, ADR, OQ-N, etc.), the
  citation is a contract — code must honor the cited resolution OR
  the JSDoc must update OR the resolution must explicitly note the
  divergence. N=1 today (the four G1 sites collapsed into one
  structural finding); future sites surfacing "JSDoc cites OQ-N;
  code violates OQ-N" would graduate per Documentation Routing
  convention's N=3 threshold.

  (6) **(b-shape-1) architectural-layer-clarity disposition.**
  Operator ratified hand-crafted early-return over throw-and-catch
  on three architectural-layer counter-considerations: failure-mode-
  asymmetry between membership check and other route logic;
  locality-of-readability of the gate; and counter-precedent at
  existing PATCH paths whose throw-and-catch flow leverages
  withInvariants Invariant 3 (a middleware-layer gate) — the hot-
  fix's route-handler-level gate is architecturally distinct and
  should not be conflated. **Codification candidate at N=1: "Don't
  conflate uniformity-at-the-wire (response shape) with uniformity-
  of-control-flow (throw vs early-return)."** The two operate at
  different architectural layers and should be calibrated
  independently. N=1 today; future architectural-layer
  disambiguation decisions would graduate per Documentation Routing
  convention's N=3 threshold.

  Net outcomes this commit family: 4 GET route handlers gated via
  caller.org_ids.includes(orgId) check returning 403 ORG_ACCESS_DENIED
  on cross-org access (Hard constraint B preserved: no withInvariants
  wrap additions); 4 service-layer JSDoc reconciliations + 1 file-
  top reframe (Hard constraint D preserved: no service-layer
  behavior changes); 4 cross-org regression tests passing (Hard
  constraint C: response shape uniform with PATCH catch-block output);
  Hard constraint A preserved (no eslint config touches); Hard
  constraint E satisfied (invitationService file-top reframed from
  "pending Pattern G1 remediation" to route-handler-gated state);
  pnpm agent:validate 26/26 post db:reset:clean+seed; pnpm typecheck
  clean; full suite 557/578 passed (4 new regression tests pass; 3
  pre-existing carry-forwards unchanged per S29a element #19:
  verifyAuditCoverageRoundTrip orthogonal, accountLedgerService
  running-balance ×2 brief-anticipated wrap-driven carry-forward,
  crossOrgRlsIsolation cascading pollution downstream of the running-
  balance failures). S30 brief now ready to re-anchor against this
  commit's HEAD: Pattern G1 row in LT-01(b) annotation pass table
  removes; LT-01(b) annotation pass count drops by 4; pre-decision
  (d) section transitions to resolved-at-hot-fix; LT-01(d) audit
  scope shrinks (this hot-fix's JSDoc reconciliation closes some
  claims preemptively).
- 2026-04-30 NOTE — S30 hot-fix sibling fix-forward: route-handler
  file-top reconciliation (this commit). Element-7 of the hot-fix
  arc captures a substrate-completeness gap caught at chat-side
  review post-execution.

  (1) **Reconciliation-scope-derivation as substrate-completeness
  gate (codification candidate at N=2; sibling-shape to S29a element
  #18).** The hot-fix at c617f58 reconciled service-layer JSDoc
  claims to reflect the new route-handler gate posture; it did NOT
  reconcile the route-handler file-top comments which carried the
  same documentation-vs-implementation drift at a sibling substrate
  layer. profile/route.ts and addresses/route.ts file-tops both said
  "GET: any org member (RLS gates)" — substrate-stale post-hot-fix
  because services use adminClient (bypassing RLS) and the actual
  gate is the route-handler caller.org_ids.includes(orgId) check.
  invitations/route.ts said "list pending (controller)" — also
  stale because the actual gate post-hot-fix is any-member-of-org,
  not controller-only (role-permission decisions deferred to S30
  territory per pre-decision (b-shape-1)). N=2 firing of the
  reconciliation-scope-derivation pattern: N=1 was S29a element #18
  (userProfileService comment-fix scope gap → resolved as item (l));
  N=2 is this hot-fix's route-handler file-top gap. Same shape:
  reconciliation scope derived from one substrate-layer; missed
  sibling substrate-layer.

  (2) **Codification candidate "Resolved-decision-citation as
  contract" advances N=1 → N=2 within the same commit family.**
  The hot-fix's own NOTE plan element #5 codification candidate
  fired again here. The route-handler file-top comments cite RLS as
  the gate (an OQ-07 claim); implementation post-c617f58 bypasses
  RLS via adminClient and gates at the route-handler check. Same
  misremembered-OQ-07-resolution shape that element #6 named at the
  service layer, now manifest at the route-handler-file-top layer.
  The codification candidate now has two firings within the hot-
  fix arc: N=1 at the service-layer JSDoc (closed at c617f58); N=2
  at the route-handler file-top (closed at this commit). One more
  firing graduates per Documentation Routing convention's N=3
  threshold.

  (3) **Substrate-fidelity-gate execution-cadence-layer firing
  surfaced post-execution.** The c617f58 closeout summary asserted
  "no execution-time substrate-fidelity-gate firings surfaced;
  brief-creation pre-flight findings matched execution-time
  substrate exactly." Substrate at chat-side review revealed the
  execution-cadence-layer DID have a firing — it just wasn't caught
  at execution time because the brief's verify gates didn't extend
  to the route-handler file-top comments. Discipline-correct
  framing: execution-cadence-layer firing surfaced post-execution
  at chat-side-review. Pairs with element-pre-7-sub-2's three-
  cadence flow as additional discipline-cadence layer — the
  substrate-fidelity-gate codification fires at the post-execution-
  review cadence too, not just within the execution session itself.
  This is itself a fractal-fidelity firing of element #3's "applies
  recursively at every layer" clause — the closeout's claim of
  substrate-completeness was the load-bearing-claim that chat-side
  review found substrate-incomplete.

  Net outcomes this commit: 3 route-handler file-top comments
  reconciled to reflect post-hot-fix gate posture (profile,
  addresses, invitations). users/route.ts file-top left as-is per
  chat-side review (neutral; no RLS claim). Sibling fix-forward to
  c617f58; standalone commit per Option A ratification.
- 2026-04-30 NOTE — S30 execution closeout: Path C arc Gate 4
  closed (LT-01 + LT-03 + LT-04 + QUALITY-006). Twelve-element
  inventory captured at execution closeout.

  (1) **UF-006 + UF-013 + QUALITY-006 closure citation.** LT-03:
  no-restricted-imports rule blocks @/db/adminClient outside
  src/services/ (eslint.config.mjs); .next/ ignore folded into the
  same edit (closes ~9,860-error pre-existing baseline). LT-01(b):
  custom ESLint rule services/withInvariants-wrap-or-annotate +
  annotation pass (28 added at S30 = 10 brief-enumerated Pattern B
  + 3 Pattern C/E + 1 Pattern H + 4 Pattern G1 + 10 Pattern B
  surfaced at execution-time-pre-flight Task 5 verification). 35
  annotations total in src/services/ at S30 closeout (7 D/G2/I
  existing + 28 added). G1 sites pass via canonical-form annotation
  match (route-handler-gate rationale), not wrap-detection — rule
  scope is service-layer files only. LT-01(c): narrow-scope
  test:no-hardcoded-urls formalized per (c-1c-α); chains in
  agent:validate. LT-01(d): CLAUDE.md (186 lines) + AGENTS.md
  (5 lines) audited within 60-min ceiling (≈23 min); 17 of 20
  audited claims auto-resolved silent, 1 auto-resolve commit-message-
  noted, 2 surfaced for operator (CURRENT_STATE.md staleness +
  "17 invariants" count basis ambiguity); audit inventory at
  docs/09_briefs/phase-1.3/session-30-audit-inventory.md. LT-04:
  per-tool `gatedByDispatcherSet: boolean` required field on each
  ToolDef via defineTool<T extends BaseToolDef> helper at
  src/agent/tools/types.ts (NEW); ORG_SCOPED_TOOLS derived in
  src/agent/tools/orgScopedTools.ts (NEW); orchestrator imports
  the derived Set; drift test at tests/unit/agent/orgScopedTools.
  test.ts (NEW; 3 tests, all green).

  (2) **Brief-creation pre-flight as substrate-fidelity gate
  (codification graduated S30 N=3; continuing-firings).** S30
  brief-creation pre-flight pre-1/2/3 graduated the codification
  at N=3. Continuing post-graduation firings at S30 brief-drafting
  (pre-4: introducing operator-pending without dialogue ratification;
  pre-5: brief-drafting over-claiming substrate-fidelity), S30
  re-anchor (Item 1 floor-table arithmetic conflation), S30
  re-anchor-2 prompt-drafting (misapplying S25-S29a-S30 execution-
  cadence governance precedent to brief-amend cadence; caught by
  WSL Claude at substrate-confirm of 595556a precedent), and S30
  execution-time-pre-flight (Pattern B sub-pre-flight count drift,
  LT-03 architectural-surface count drift, LT-01(b) rule firings
  on G1 + 10 additional Pattern B sites, ORG_SCOPED_TOOLS line-
  number-shift FALSE-claim subsequently retracted). The codified
  discipline now has substrate-confirmed firing at every cadence
  layer of the brief lifecycle from creation through execution-
  time substrate-confirm — eight-or-more cadence-layer enumeration
  in order of first firing: brief-creation pre-flight → brief-
  drafting decision → brief-drafting derivation → lock-acquisition
  → brief-drafting deferred-decision → post-execution-review →
  re-anchor → prompt-drafting → execution-time-pre-flight. Durable
  evidence the discipline is correctly scoped.

  (3) **Conditional task-shape encoding precedent (codification
  candidate at N=1 from S30 brief-creation; N=1 holds at S30
  closeout).** S30 brief encoded (d)/(e) operator-pending decisions
  as conditional task variants; (d) Variant γ executed at hot-fix
  arc; (e) Variant α resolved at S30 execution Task 0 Step 0.2.
  Pattern proved usable across two operator-pending decisions
  spanning brief-creation through execution. N=1; not graduated;
  future briefs with operator-pending decisions evaluate adoption.

  (4) **Annotation-default discipline.** S30's LT-01(b) committed
  to annotation-everywhere with empty starting allowlist. All 35
  annotated sites carry canonical-form rationale comments at the
  service-layer property; no allowlist entries. Discriminator
  ratified: "annotation for transient and standing-with-rationale-
  at-call-site, allowlist for standing-only-when-call-site-
  annotation-is-structurally-unworkable." Sibling shape to S29a
  element #15's (γ)-rhythm scope-amend discipline.

  (5) **(c4) updateOrgProfile substrate state-2 resolution +
  field-naming.** Pre-flight pre-3 surfaced ORG_SCOPED_TOOLS Set
  semantics narrower than first-glance reading (state 2: per-tool
  inline null-org check at orchestrator dispatcher). Field-naming
  resolved at execution Task 0 Step 0.3 via Option-3-alternative
  pick: `gatedByDispatcherSet: boolean` (substrate-precise; terser
  than `requiresOrchestratorOrgGate`; self-documenting — `false`
  reads as "not gated at the dispatcher Set" rather than the
  misleading "not org-scoped"). Documented in
  src/agent/tools/types.ts file-top via BaseToolDef JSDoc.

  (6) **Variant disposition outcomes.** (d) resolved to Variant γ
  at S30 brief-creation (substrate-grep-first ratification flip)
  and executed at hot-fix arc (c617f58 + 5d58b36); G1 territory
  closed pre-S30. (e) resolved to Variant α (deferred to S29b) at
  Task 0 Step 0.2 of execution per substrate-grounded analysis of
  arc-summary's S29b scope (design + migration; annotations sunset
  at S29b commit). (c4) resolved to Option-3-alternative
  `gatedByDispatcherSet: boolean` + (c4-sub-β) `defineTool` helper
  at Task 0 Step 0.3.

  (7) **LT-01(d) audit outcomes.** Time-box adherence: ≈23 min of
  60-min ceiling. Bucket counts: 17 auto-resolved silent (path-
  existence checks; Agent Ladder rungs; agent:validate composition;
  skill directories) + 1 auto-resolve commit-message-noted (Phase 1
  Simplifications partial-picture framing) + 2 surfaced for operator
  ("17 invariants" count basis ambiguity; CURRENT_STATE.md staleness
  4+ days behind project state). Audit inventory at
  docs/09_briefs/phase-1.3/session-30-audit-inventory.md.

  (8) **Stash-revert isolation candidate (S29a discipline at N=2).**
  Not used at S30 Task 9 regression — fresh-run baseline matched
  expected post-S30 floor without isolation discipline being needed.
  N=2 holds; remains a codification candidate.

  (9) **LT-01(b) rule G1 framing correction at execution-time-pre-
  flight.** S30 brief asserted G1 sites pass via "wrap-detection at
  the route handler layer." Substrate at execution Task 5 rule
  registration: rule scope is `files: ['src/services/**/*.ts']`;
  rule walks AST of service-layer files only. Route-handler-level
  caller.org_ids checks (the hot-fix's b-shape-1 ratified gate
  posture) are invisible to the rule. G1 sites passed neither
  wrap-detection (no withInvariants call at service-layer property)
  nor annotation match (brief had pre-decision (d) remove G1 from
  the annotation pass). Rule fired correctly per its predicate;
  brief's framing conflated rule's wrap-detection mechanism with
  hot-fix's route-handler-check mechanism. They're architecturally
  distinct gates per the hot-fix's own b-shape-1 ratification
  (see hot-fix arc NOTE element #6). Resolution: G1 sites annotated
  with `(pattern-G1: route-handler-gated via caller.org_ids.includes
  (orgId) check; not withInvariants-wrapped per S30 hot-fix arc
  c617f58 + 5d58b36, OQ-07 resolved-decision integrity)`.

  (10) **Read-completeness threshold (codification candidate at
  N=2).** S30 brief's Pattern B enumeration listed 10 sites
  (journalEntryService.post + 6 recurringJournalService mutations
  + 3 invitationService mutations); substrate at execution-time-
  Task-5 verification surfaced 10 additional Pattern B sites
  (4 addressService + 4 membershipService + 2 orgService) — 100%
  count drift. Sibling-shape to the read-completeness-threshold
  codification candidate from S29 brief-creation (N=1, partial
  read produced confident-shaped enumeration). N=2 firing of the
  same shape; one more firing graduates per Documentation Routing
  convention's N=3 threshold. Resolution: 10 surfaced sites
  annotated at Task 6 with verbatim action per route-handler
  wrap-site (substrate-greped via Convention #8 verify-directly).

  (11) **Resolved-decision-citation as contract (codification
  candidate at N=3 — graduated this session).** Hot-fix arc had
  N=2 (service-layer JSDoc + route-handler file-top). S30 execution
  surfaces N=3 firing: G1 service-layer annotations now cite the
  hot-fix arc's resolved decision (route-handler-gated via
  caller.org_ids check) at the service-layer property comment. The
  citation is a contract — code at the route handler must continue
  to honor the gate; if a future edit removes the route-handler
  check, the JSDoc citation lies. Substrate-grounded as a
  Documentation Routing convention graduation per N=3 threshold.

  (12) **Substrate-bug at users/[userId]/reactivate/route.ts:18.**
  Action string is `'user.suspend'` instead of `'user.reactivate'`.
  Pre-existing bug; orthogonal to S30 scope. Annotation at
  membershipService.reactivateUser honors substrate-as-is with
  inline note: `(action: 'user.suspend' — substrate-bug per closeout
  NOTE; route-vs-action-string mismatch flagged for separate fix)`.
  Filed for separate fix in a follow-up session; not S30's scope.

  Codification candidate updates: Conditional-task-shape at N=1 (no
  change); brief-creation-pre-flight-gate at N=∞ (graduated at S30
  brief-creation); fractal-substrate-fidelity (S29a element #3)
  continued post-graduation firings at S30 execution surfaces.
  Read-completeness-threshold advances N=1 → N=2 (one more firing
  to graduate). Resolved-decision-citation-as-contract advances
  N=2 → N=3 (graduates this session). Reconciliation-scope-
  derivation as substrate-completeness gate stays at N=2. New
  codification candidate at N=1: action-string-substrate-drift
  (the reactivate route bug).

  Net outcomes this commit family: 14 service files annotated /
  modified for canonical-form annotations; eslint.config.mjs +
  eslint-rules/ (NEW directory + rule + plugin index) + tests for
  rule; src/agent/tools/types.ts (NEW); src/agent/tools/orgScopedTools.ts
  (NEW); 10 tool files migrated to defineTool wrapper +
  gatedByDispatcherSet field; src/agent/orchestrator/index.ts
  imports the derived Set; tests/unit/agent/orgScopedTools.test.ts
  (NEW); vitest.config.ts include array extended to pick up
  eslint-rules/__tests__; docs/09_briefs/phase-1.3/session-30-audit-
  inventory.md (NEW); docs/09_briefs/phase-1.3/session-30-brief.md
  amends per S29a element #15 (γ)-rhythm scope-amend precedent.
  pnpm typecheck clean; pnpm agent:validate 26/26 post-reset; full
  suite 581/582 passed (1 failed verifyAuditCoverageRoundTrip
  orthogonal carry-forward; +24 vs pre-S30 fresh-run baseline of
  557/578 — 4 deliberate test additions [3 orgScopedTools + 1 rule
  unit test] + 20 formerly-skipped tests now passing without
  apparent S30-edit causation; substrate-finding worth marking but
  not regression-shaped). LT-01(b) rule fires zero false-positives.
  Path C arc closure proximity: after S30 + S29b + S31 (LT-02),
  Path C closes; Phase 2 surface expansion gate unblocks.
- 2026-04-30 NOTE — S28 execution closeout: MT-05 audit-emit
  observability flag + MT-06 PII redaction expansion (this commit
  family). Three-element inventory with seven sub-finding
  categories captured at execution closeout per the s28-reanchor
  re-framed NOTE plan.

  (1) **UF-008 + UF-010 closure citation.** UF-008 audit-emit
  observability flag landed at three try/catch sites: site 1
  (loadOrCreateSession.ts:178 — single-wrap covering
  agent.session_created + agent.session_org_switched per Hard
  Constraint A); site 2 (orchestrator/index.ts:202 —
  emitMessageProcessedAudit arrow's catch per Hard Constraint B);
  site 3 (orchestrator/index.ts:1289 — executeTool finally-block
  catch). Each catch carries `audit_emit_failure: true` as the
  grep-stable structured-log marker. Alert threshold: 1% failure
  rate over 15-minute rolling window; destination: log-pipeline
  filter (per pre-decision 2; calibrated against zero deployment
  data; tunable post-deployment). UF-010 surface closed across two
  layers: pino REDACT_CONFIG.paths gains 5 new entries (`*.email`,
  `*.phone`, `*.first_name`, `*.last_name`, `*.display_name`) at
  single-level coverage; recordMutation.redactPii extended from
  shallow-clone-only to recursive traversal with depth limit 8 and
  warn-and-continue at limit (warn message: 'redactPii: depth
  limit exceeded; partial redaction'). PII_FIELDS const preserved
  verbatim per Hard Constraint C.

  (2) **Multi-level probe outcome: FAILED — Path (3) ratified.**
  Task 4 Step 4 multi-level probe surfaced documentation-vs-
  implementation divergence at the pino-via-pinojs-redact
  integration layer. @pinojs/redact@0.4.0 README claims "Wildcards:
  Intermediate: '*.password' (redacts password at any level)";
  substrate at HEAD shows pino's redaction supports single-level
  only — `*.email` covers `{ user: { email } }` (depth 2) but NOT
  `{ user: { profile: { email } } }` (depth 3). The brief's
  pre-decision 4 cited library standalone-documentation as
  authoritative for the integrated pino-via-pinojs-redact behavior
  without execution-time probe at brief-creation. Operator-decision
  at execution cadence: Path (3) — ship S28 with single-level pino
  + nested redactPii (audit_log surface only); pino multi-level
  coverage rolls into Phase 2 alongside the financial-PII path
  remediation already in OOS list item 5. The 5 new pino paths
  land regardless (single-level coverage is non-zero value); the
  multi-level probe test inverts to a regression-guard for the
  known limitation (asserts SENTINEL preserved at depth 3; flips
  to positive when Phase 2 closes the gap).

  (3) **Sub-findings surfaced at execution.** Categories per the
  s28-reanchor NOTE plan section, with execution-time additions:

  i. **Financial-PII silent-broken nested-coverage.** Existing
  `*.tax_id`, `*.bank_account_number`, `*.account_number_last_four`,
  `*.sin`, `*.card_number` entries operate under the same
  single-level coverage as the new PII entries. Substrate-confirmed
  via the multi-level probe; financial-PII at depth ≥3 leaks
  through pino redaction. Deferred to Phase 2 per OOS list item 5.
  Same Phase 2 obligation as multi-level pino remediation; the two
  surfaces close together (custom redactor or library upgrade).

  ii. **Recursion edge cases on circular references / depth-limit.**
  redactPii implementation handles both: WeakSet-based visited
  tracking detects cycles and treats them as terminal; depth limit
  fires warn-and-continue at depth 9+. Test case (v) verifies the
  warn message + partial-clone posture. Edge-case enumeration in
  the test pass clean.

  iii. **Carry-forward drift on full-suite run.** Fresh-post-reset
  baseline at S28 closeout: 1 failed + 570 passed + 20 skipped
  (591 total). Compared to brief-expected (1 failed + 590 passed +
  0 skipped = 591): same total; same failure (verifyAuditCoverageRoundTrip
  orthogonal); 20 tests skipped instead of passing, matching pre-
  S30 fresh-run baseline shape. Skip-count fluctuation observed
  across the S30 arc — env-conditional skip markers (e.g.,
  agentRealClientSmoke.test.ts skips without ANTHROPIC_API_KEY)
  vary based on environment state. Not S28-edit-attributable; not
  regression-shaped. Test Files: 2 failed (1 verifyAuditCoverageRoundTrip
  individual + 1 file-level setup failure on crossOrgRlsIsolation
  cascading per S29a element #19c — same Phase 2 obligation as the
  shared-DB fragility cluster).

  iv. **PII_FIELDS-vs-pino-paths naming-asymmetry** (carry-forward
  from s28-reanchor pre-flight; substrate-confirmed during
  execution). recordMutation.PII_FIELDS includes `invited_email`
  (not `email`); pino REDACT_CONFIG.paths post-S28-MT-06 includes
  `*.email`. Audit-log before_state capturing a user row with
  `email` key continues to leak post-S28 even with the nested-
  recursion extension landing — redactPii's PII_FIELDS list does
  not include `email`. Disposition at execution cadence: Phase-2-
  territory (rolls in with the financial-PII + multi-level pino
  remediation as a unified PII-coverage-closure scope expansion).
  S28 ships with the asymmetry intact; closeout NOTE flags it as
  a Phase 2 obligation without remediation in this session.

  v. **Task 2 Convention #8 verify-directly drift on cited
  file/line numbers** (carry-forward from s28-reanchor leave-as-is
  + execution-time additions): (a) PII_FIELDS at recordMutation.ts:19-26
  not :21-27 per brief cite; (b) MT-06 reference comment block at
  :12-18 not :14-19 per brief cite; (c) reactivate route action-
  string substrate-bug at :23 not :18 per S30 closeout NOTE
  element 12 cite; (d) pre-decision 6 vs (f) label typo (pre-S30
  enumeration scheme inherited from arc-summary lettering; pre-
  existing at brief-creation 4c8dac0). All four under S29a element
  #3's "applies recursively at every layer" clause; no fresh
  codification-graduation.

  vi. **Orphan-reference-review-at-edit-completion N=3 graduation
  citation** (codification-firing element deferred from
  s28-reanchor closeout per (re-anchor-1-α) precedent).
  Documentation Routing convention's N=3 threshold met at
  s28-reanchor (4a3eafb) via three orphan-fixes: Task 1 Step 2
  expected-text (orphan G); Task 7 Step 4 expected-text (orphan H);
  Y2 commit shape bullet [ROUTE?] framing (orphan I). All caught
  at edit-completion sweep; sibling-precedent S30 re-anchor's
  orphan G applied. The codification-firing-event happened at
  4a3eafb; this S28 execution closeout NOTE is the codification-
  record location per (re-anchor-1-α)'s "no codification-firing
  elements in re-anchor's own NOTE" clause.

  vii. **NEW codification candidate at N=1: library-documentation-
  vs-integrated-behavior-divergence as substrate-confirm-required-
  at-brief-creation.** S28 brief's pre-decision 4 cited @pinojs/
  redact@0.4.0 README's "any level" wildcard semantics as
  authoritative for the pino-via-pinojs-redact integrated behavior.
  Probe at execution surfaced the divergence: library standalone-
  documentation does not necessarily reflect integrated behavior
  through the wrapper layer. The substrate-fidelity-gate firing
  this represents is at the brief-creation cadence layer (post-
  graduation N=∞ per S30 closeout NOTE element 2); folds under
  S29a element #3's "applies recursively at every layer" clause.
  As a sibling-shape codification candidate at N=1 today: future
  briefs citing library documentation as authoritative for
  integrated behavior get probed at brief-creation. Documentation
  Routing convention's N=3 threshold for graduation.

  viii. **NEW: Static-source-verification test pattern at S28 MT-05.**
  Brief Task 3 Step 4 specified "mock recordMutation to throw...
  capture log.error invocation (pino mock or test logger)." S28
  execution adopted static-source verification (read each source
  file; assert the catch block adjacent to the swallow-message
  anchor includes `audit_emit_failure: true`) instead of runtime
  mock harness. Rationale: the three sites live in deep orchestrator
  paths (loadOrCreateSession, emitMessageProcessedAudit, executeTool
  finally) where runtime tests require either real DB (violates
  "no DB dependency") or wide mocking of orchestrator internals
  (large surface, brittle). Static-source verification is
  substrate-grounded, mechanical, fast, and meets the brief's
  exit-criteria ("the structured-flag field appears"). The
  substrate-shape implementation pattern differs from the brief's
  specified mock-runtime pattern; this is the (γ)-rhythm scope-
  amend at execution cadence (S29a element #15 ratified
  precedent for execution-time substrate findings shaping
  implementation).

  Brief framing reconciliation per execution-time operator-
  decision (β2): the brief's MT-06 architecture line 11 framing
  ("Extend src/shared/logger/pino.ts REDACT_CONFIG.paths to
  include *.email...") implies coverage at any nesting level via
  the wildcard semantics. Post-Path-3, this framing is substrate-
  misleading. Closeout NOTE captures the framing-stale finding;
  brief unchanged at execution; framing-amend lands at a later
  cadence (e.g., when Phase 2 obligations get scoped). Sibling-
  shape to the three leave-as-is findings carried from s28-
  reanchor.

  Net outcomes this commit family: 3 source files modified
  (orchestrator/loadOrCreateSession.ts, orchestrator/index.ts,
  pino.ts, recordMutation.ts); 1 new test file
  (orchestratorAuditEmitFailure.test.ts; 4 cases passing); 2 test
  files extended (pinoRedaction.test.ts +1 multi-level
  regression-guard, total 4 cases; recordMutationPiiRedaction.test.ts
  +5 nested cases — 1 stale shallow-clone test removed, total 13
  cases). pnpm typecheck clean; pnpm agent:validate 26/26
  post-reset; full-suite 570/591 passed (1 failed orthogonal
  carry-forward; 20 skipped env-conditional; same total as brief-
  expected). Path C arc closure proximity: S29b unblocked (brief-
  creation against this S28 closeout SHA next); after S29b + S31
  (LT-02), Path C closes; Phase 2 surface expansion gate unblocks.
- 2026-04-30 NOTE — S29b execution closeout: MT-03 Patterns
  C/C-variant/E migration via input-shape refactor (this commit
  family). Three-element inventory + sub-finding categories
  captured at execution closeout per the S29b brief NOTE plan.

  (1) **UF-002 broad-scope wrap closure citation.** UF-002's
  service auth gap fully closed across MT-03 surface: Pattern A
  closed at S29a (c47e58d); Pattern B closed at hot-fix arc
  (c617f58 + 5d58b36 — 10 brief-enumerated + 10 surfaced-at-S30-
  execution = 20 sites annotated at S30); Pattern G1 closed at
  hot-fix arc; Patterns C/C-variant/E closed here via input-shape
  refactor (each refactored from `{ entity_id }` to `{ org_id,
  entity_id }` per pre-decision (a-α); wrapped at export site via
  `withInvariants(<methodName>)`; canonical-form annotations
  removed). Route-handler call-sites updated at 2 sites
  (journal-entries/[entryId] + recurring-templates/[templateId]).
  Pattern E (getRun) had 0 external callers — refactor at
  zero-breakage.

  (2) **Pattern E join-FK outcome: substrate-resolved cleanly
  (single-roundtrip).** PostgREST embed shape
  `recurring_journal_runs!inner(recurring_journal_templates(org_id))`
  with `.eq('recurring_journal_templates.org_id', input.org_id)`
  filter substrate-resolved at execution Task 4 — codebase-wide
  embed convention (substrate-confirmed at brief-creation:
  journalEntryService.get's nested embed at lines 466-468 is the
  precedent) held. Two-step lookup fallback path NOT taken;
  substrate-resolve was the expected outcome per brief
  pre-decision (d) framing post-R2 revision. Single DB roundtrip
  post-refactor (vs current two roundtrips) ratified at execution.

  (3) **Sub-findings surfaced at execution.** Categories per the
  brief NOTE plan + execution-time additions:

  i. **getRun zero-callers carry-forward.** Pre-flight pre-2
  substrate-fidelity-gate firing at brief-creation cadence
  re-confirmed at execution Task 2 Step 3 (caller-surface grep
  returned 0 hits on `recurringJournalService.getRun(`). Refactor
  scope at zero-breakage as predicted. Reconciliation-scope-
  derivation as substrate-completeness gate codification candidate
  **graduates at parent-shape N=3** with this firing — third
  firing-shape instance under the parent shape "scope derived
  from one substrate-layer; missed sibling substrate-layer at
  scope-completeness-gate" (S29a element #18 + S30 sibling
  fix-forward NOTE element 1 + S29b getRun finding). **Strict-
  shape sub-tracking at substrate-honest precision:** prior two
  firings were reconciliation-scope-sibling shape (file-top +
  JSDoc layers as siblings of comment-fix scope); S29b's firing
  is caller-surface-completeness shape (consumer-surface-
  completeness derived narrower than substrate at scope-
  derivation, sibling-shape to S28's resendInvitation finding).
  Both fold under parent-shape; strict-shape distinction noted
  for future-session-reads of the codification record.
  Documentation Routing convention's parent-shape N=3 threshold
  met. **Codification graduates at this S29b execution closeout
  NOTE.**

  ii. **Existence-leak-prevention-as-error-code-contract
  codification candidate at N=1** (from S29b brief-creation
  pre-flight pre-3, ratified at execution). Substrate-coherent
  existing pattern preserved at S29b: getTemplate's
  RECURRING_TEMPLATE_NOT_FOUND does dual duty (intra-org-not-
  found + cross-org-not-found via .in('org_id', ...)-collapsed-
  rows behavior); mutations use the same code for intra-org-not-
  found only (cross-org gated by Invariant 3). The semantic
  distinction across failure modes is load-bearing-architectural-
  discipline. Pre-decision (b-γ) ratified the pattern at S29b
  brief-creation; execution preserves verbatim per Hard
  constraint B. Sibling-shape to S30's "Resolved-decision-
  citation as contract" graduation. N=1 today; future sites
  surfacing same shape graduate per N=3 threshold.

  iii. **Carry-forward drift on full-suite run: matches expected
  baseline exactly.** Fresh-post-reset baseline at S29b closeout:
  1 failed + 570 passed + 20 skipped (591 total). Compared to
  brief-expected (1 failed + 570 passed + 20 skipped = 591):
  IDENTICAL. No drift; no new failures attributable to S29b.
  verifyAuditCoverageRoundTrip orthogonal carry-forward
  unchanged per S29a element #19; the 20 skipped are env-
  conditional skip-fluctuation observed across the S30 arc;
  Test Files 2 failed = 1 verifyAuditCoverageRoundTrip individual
  + 1 file-level setup failure on crossOrgRlsIsolation cascading
  (carry-forward category c).

  iv. **(γ)-rhythm scope-amend NOT fired at execution.**
  Pre-decision (d)'s join-FK shape substrate-resolved as
  expected; two-step-lookup fallback path NOT taken. Codification
  candidate (γ)-rhythm scope-amend remains at N=2 (S29a element
  #15 + S28 closeout NOTE element viii); S29b execution did NOT
  surface a third firing. Held; pending future execution-cadence
  firing for graduation.

  v. **Convention #8 verify-directly drift.** No line-cite drift
  surfaced at execution; brief's pre-flight-confirmed cites at
  HEAD `aae6c87` matched substrate exactly (function declarations
  at journalEntryService.ts:454, recurringJournalService.ts:675
  + :745; FK at migration 20240131000000:134; route handler call-
  sites at journal-entries/[entryId]/route.ts:15 + recurring-
  templates/[templateId]/route.ts:17). No fresh codification-
  graduation under category v.

  vi. **Anything else surfaced at execution: none.** Clean
  execution against the pre-decided shape; substrate aligned
  with brief-creation predictions across all four pre-decisions.

  Net outcomes this commit family: 4 source files modified
  (journalEntryService.ts signature + export wrap; recurringJournal
  Service.ts 2 signature changes + export wraps + getRun body
  refactor to join-FK; 2 route-handler call-site updates).
  3 canonical-form annotations removed; LT-01(b) ESLint rule
  fires zero false-positives (35 - 3 = 32 annotations in
  src/services/ at S29b closeout); pnpm typecheck clean; pnpm
  agent:validate 26/26 post-reset; full-suite 570/591 passed
  matching brief-expected baseline exactly. Per-tool
  gatedByDispatcherSet field on ToolDef (S30 closure) unaffected.
  No SHA self-reference per S29a element #1 + S28 closeout
  fix-forward precedent.

  Codification candidate state at S29b closeout:
  - Substrate-fidelity-gate (graduated S30 N=∞; continuing-
    firings at brief-creation pre-flight cadence at S29b)
  - Resolved-decision-citation as contract (graduated S30 N=3)
  - Orphan-reference-review at edit-completion (graduated S28
    re-anchor N=3)
  - Reconciliation-scope-derivation as substrate-completeness
    gate (**graduated at S29b N=3 — this commit family;** parent-
    shape graduation with strict-shape sub-tracking distinguishing
    reconciliation-scope-sibling vs caller-surface-completeness
    sibling)
  - (γ)-rhythm scope-amend (N=2 held)
  - Read-completeness-threshold (N=2 held)
  - Library-documentation-vs-integrated-behavior-divergence (N=1)
  - Brief-spec-vs-arc-precedent-substrate-conflict (N=1)
  - Existence-leak-prevention-as-error-code-contract (N=1; ratified
    at S29b execution)
  - Stash-revert isolation (N=2; held)
  - Action-string-substrate-drift (N=1; observation-only)

  Path C arc closure proximity: Gates 1+2 closed at S28 (e966f30);
  Gate 3 closes here; Gate 4 closed at S30 (64996b5). After S31
  (LT-02 test coverage closure), Path C arc closes; Phase 2
  surface expansion gate unblocks. **S31 unblocked: brief-creation
  against this S29b closeout SHA opens next as the final session
  of Path C arc.**

- 2026-04-30 NOTE  Test-suite state-residue fragility confirmed
  reproducible. Manual mutation dry-run on
  journalEntryService.post() exposed four fragility shapes:
  (a) fixed UUIDs in 99990* range with afterAll cleanup that
  runs only on success (crossOrgRlsIsolation.test.ts);
  (b) exact-count assertion against append-only audit_log
  (verifyAuditCoverageRoundTrip.test.ts:39 expects
  gaps.length === 1); (c) tests assume pristine seed-state DB;
  (d) cleaner shape was knowingly deferred (TODO comment in
  verifyAuditCoverageRoundTrip acknowledges fragility, accepts
  in exchange for not-yet-doing-cleaner-thing).

  Reproducibility: failure recurred within a single session
  after ~8 mutation cycles, without any code change. The suite
  is not idempotent across runs without explicit
  pnpm db:reset:clean. This is normal-developer-workflow
  distance, not a corner case.

  Architectural pattern: codebase has documented tendency to
  accept test fragility in exchange for deferred cleaner-shape
  work. Worth tracking as a tendency, not a one-off bug.

  Full writeup: reports/mutation/manual-dryrun-2026-04-29.md.
  Implications fed forward to a deferred §11 draft for
  DEV_WORKFLOW.md.

- 2026-04-30 NOTE  Test-suite append-only-state fragility — second
  mechanism confirmed. Per the 2026-04-30 NOTE above
  (cross-run residue mechanism), an additional within-run
  mechanism surfaced when verifying the post-Phase-A reset:
  `verifyAuditCoverageRoundTrip.test.ts:39` failed with 315
  gaps after a single clean `pnpm db:reset:clean`, then `pnpm
  test`. Mechanism: other integration test files in the same
  vitest run (recurringJournal, agentOrchestrator, etc.) post
  journal entries to the shared test DB before
  verifyAuditCoverageRoundTrip executes. The verifier scans
  all tenant-entity rows and the test asserts on an exact
  count, so accumulated test-data entities inflate the gap
  count even when none of them are actual regressions.

  Distinction worth preserving: the cross-run mechanism (entry
  above) and the within-run mechanism (this entry) share a
  root cause — exact-count assertion against append-only
  state — but they are distinct phenomena. The cross-run case
  fails because residue from a *prior* `pnpm test` run wasn't
  cleaned. The within-run case fails because *current-run*
  earlier test files seed entities into the DB before this
  test runs. Either alone reproduces the symptom. Both
  together compound it. A future fix needs to address the
  test-design root cause (assert on a property, not a count)
  to close both mechanisms simultaneously.

  Recorded post-hoc during Phase B execution; observed during
  the first attempt at a clean Phase A → Phase B handoff.

- 2026-04-30 NOTE — S32 onboarding-posture drift list codified
  as a precommit guardrail for onboarding revisions. Future
  onboarding revisions falling into any of the four patterns
  below are rejected on sight: (1) "quick wins" / dopamine-loop
  additions; (2) "AI magic moments" / generated-content theater;
  (3) "empty dashboard hacks" / engagement bait; (4) Puzzle/
  Pennylane data-first onboarding pattern ("connect bank, system
  builds books"). The trap these share is turning the product
  into "AI QuickBooks" — a path `product_vision.md`'s Thesis
  explicitly rejects. The list serves as a precommit checklist
  for future onboarding revisions; a proposed change matching
  any pattern requires explicit override discussion in the
  friction journal. Provenance: this brief
  (`docs/09_briefs/phase-1.3/session-32-onboarding-posture-brief.md`);
  `product_vision.md` Thesis; external consultant review chain
  (multi-round) that proposed several drift-list patterns and
  was rejected per Pre-decision 6's "AI QuickBooks" rationale;
  founder-approved as a precommit guardrail for onboarding
  revisions; survives until explicitly overruled by a future
  ADR or session brief. The drift list is durable specifically
  because an external review proposed each pattern and was
  overruled.

- 2026-04-30 NOTE — S32 onboarding-posture revision shipped.
  Two commits on `staging`:

  - **Commit 1 (`f0c6e39`)** — prose + welcome header +
    `agent_interface.md` "Onboarding modes" subsection.
  - **Commit 2 (`37a24a0`)** — first-arrival treatment +
    `resolveCompletionHref` three-point edit + drift-list
    guardrail NOTE.

  **Open Questions resolved at execution gate.** OQ1 = stage
  list with Commissioning suppressed in Joining (suppression,
  not strikethrough — "Joining is not a skip"); OQ2 =
  `?first_arrival=1` query-param; OQ4 = surfaced for
  awareness only (right home for the underlying "render from
  structured fields" principle is a future Phase 2 brief
  during interaction-model extraction); OQ5 = no arc-summary
  for a one-session thread (revisit if a follow-up onboarding
  session lands); OQ6 = Y2 commit shape (two commits, two
  founder gates).

  Phase 2 surface expansion + Path A deployment readiness
  unaffected — this thread is interaction-model polish,
  sibling to Path C audit cleanup.

  **Follow-up candidates flagged in brief §8 (3).** Route split
  between Commissioning and Joining if invited-user UX
  accumulates enough divergent surface to warrant it; trust-
  signal surfacing on Arrival ("every entry is immutable and
  auditable" or similar); Four Questions audit-grammar
  applicability to the Arrival sober handoff line (the
  underlying "render from structured fields, never from
  free-form model text" principle).

  **Findings surfaced during execution (3).**

  - **`crossOrgRlsIsolation` test-design finding (surfaced at
    Task 5 full-suite run).** Test seeds `journal_entries`
    with hardcoded UUIDs and attempts cleanup via `afterAll`
    DELETE; migration `20240133000000_journal_immutability_triggers.sql`
    makes `journal_entries` append-only at the trigger level,
    so the DELETE silently no-ops. Result: every
    `agent:validate && pnpm test` sequence on the same DB
    without an intervening `pnpm db:reset:clean` reproduces
    the PK collision. Sibling cluster to Arc-A item-27
    `accountLedgerService` running-balance fragility (same
    fix-shape category — shared-DB pollution; needs
    test-isolation refactor). Phase 2 `obligations.md`
    follow-up candidate; not S32's surface to fix.

  - **Anchor-language phrasing convention (fire #1 against a
    recurring pattern).** For sibling-thread briefs that open
    independent of in-flight Path C / Path A sessions, prefer
    "most recent in-flight Path C anchor" over "most recent
    Path C closeout SHA." The in-flight phrasing handles the
    case where Path C has open but unshipped sessions but the
    sibling thread is independent of their completion.
    Surfaced at Task 1 anchor-verdict ambiguity (S29b closeout
    SHA `7774d25` vs S31 brief re-anchor `e809563`; both
    readings yielded PASS). Codification threshold (3+ fires
    per chounting's convention discipline) not yet met; track
    for future briefs that open sibling threads.

  - **Language repetition across navigation boundary as
    deliberate structural reinforcement.** "Workspace ready"
    appears verbatim in both the step-4 prose example
    ("Workspace ready. Want to post your first journal
    entry?") and the Arrival sober handoff line ("Workspace
    ready. Ready when you are — what's first?"). The
    repetition is the structural signal that the agent voice
    is continuous across the onboarding-completion →
    arrival-render boundary — same agent, same voice, before
    and after the navigation. Hold across future copy-pass
    revisions; treating the repetition as redundancy and
    differentiating for variety would be a posture-test
    failure dressed as editorial polish. The repetition is
    doing work.

---

## 2026-04-30 — Q33 partial-resolution arc (4-of-7 cleared, 3 deferred)

Mid-session arc cleared the 4 route-handler half of Q33's 7-site
LT-03 / UF-006 baseline. The 3 agent-runtime sites stay held
under Q33's original deferral logic (the Double Entry Agent build
will reshape those consumers; refactoring before that's
observable risks structuring against assumptions the agent work
later contradicts).

**Trigger.** A separate-chat assistant proposed an "all 7 files at
once" service-layer refactor framed as architecturally correct.
On review, the proposal had three failure modes: (a) it
contradicted Q33's deferral rationale (added the same calendar
day, commit `bf153fc`); (b) it conflated "in the request path" with
"must be a service consumer," ignoring that the agent endpoints
already wrap their service calls in `withInvariants` at the route
boundary, so the orchestrator's adminClient access happens behind
an authorized gate rather than at one; (c) it asked for
trust-without-checkpoints + no-test-verification on 600–1000
lines of agent-runtime + audit-emit + ai_actions-lifecycle code,
which is exactly the shape that produces durable regressions in
chounting's full-suite floor.

**Decision.** Split the 7 sites at the architecturally-meaningful
seam: 4 route handlers (`mfa-status`, `agent/{confirm,
conversation, reject}`) decompose cleanly into service consumers
and were the right boundary for UF-006 in the first place; 3
agent-runtime files (`orchestrator/index.ts`,
`loadOrCreateSession.ts`, `orgContextManager.ts`) keep their
direct adminClient access pending Q33 closure.

**Service surface added.** 8 new exports across 4 files. New file
`agentSessionService.ts` (1 export); `aiActionsService` extended
with 4 (one read single, one read batch, two mutations);
`journalEntryService` extended with 2 (single + batch
entry_number reads); `orgService` extended with 1 (narrow
`getMfaRequirement` parallel to `getOrgProfile`). All wrapped via
Pattern A no-action-key, except `orgService.getMfaRequirement`
which stays unwrapped pattern-G1 to match orgService's local
precedent. No new permission keys minted (Q34 filed for that
question, gated on Q33 closure).

**Pattern terminology drift caught and corrected.** A separate-chat
assistant claimed the codebase had no "Pattern G1" — wrong; G1
appears in `orgService.ts:357`, `membershipService.ts:240`,
`invitationService.ts:352`, all as the route-handler-gated read
annotation. The grep miss was substrate-level; their broader
recommendation chain proceeded on the false premise. Caught
before write by re-grepping the canonical files on this side of
the conversation. Convention candidate (single datapoint):
*verify-substrate-claims-from-foreign-conversation-context-before-
acting* — when an assistant in a separate chat surfaces a claim
about codebase state, re-grep before acting on the derived plan.

**Lint movement.** 7 errors → 3 errors as predicted (the 3
agent-runtime files unchanged). Typecheck green. The 3 errors
remain held until either Commit 2's narrowed `src/agent/**`
exemption ships (planned next, this session) or Q33 closes.

**Three-commit shape.** Per push-readiness-gate per-commit-shape
discipline: C1 = service additions + 4 route rewrites + doc-sync
(this commit). C2 = narrow eslint exemption only (revertable as
pure config change). C3 = Q34 question file. Each independently
passes typecheck and is independently revertable.

**Convention-candidate-below-threshold.** *Out-of-scope-assistant
recommendation as falsifiable input.* When work spans separate
chats / separate assistants and one chat's assistant proposes a
plan that the other chat's assistant must execute, the executing
side should treat the proposal as falsifiable — re-verify
foundational claims (Q-numbered open questions, codebase
patterns, substrate file:line citations) against the actual repo
before approving. Single-datapoint observation today; second
firing required before codification. Adjacent to the
*Re-verify Environmental Claims at Each Gate* convention from
Phase 1.2 §C9 but distinct: that one's about the same agent
re-verifying its own prior claims; this one's about treating a
foreign-context proposal as a hypothesis-to-test rather than an
instruction-to-execute.

---

## 2026-05-01 — S33 onboarding integration fixes shipped

S33-onboarding-integration-fixes session closed. Four commits on
`staging` ahead of `origin/staging`:

- **Commit 1 (`573cff0`)** — `fix(onboarding): wire useTranslations
  into OnboardingChat (S33 Failure 1)`. Replaces the bracketed-
  string debug placeholder shipped at Session 5 with the same
  locale-resolution pattern ProductionChat shipped at Session 7
  Commit 3.
- **Commit 2 (`0edf72f`)** — `fix(onboarding): scope first-turn
  input via opening prompt + suffix discipline (S33 Failure 2)`.
  Empty-state opening prompt revised to "What should I call you?"
  (drops Let's-preamble chirpy register; promotes to text-neutral-
  700 to match S32 first-arrival emphasis). Step-1 suffix gains
  First-turn-discipline clause in both Commissioning and Joining
  branches (combined per OQ2 = 2-b at brief review).
- **Commit 3 (`40d202f`)** — `fix(onboarding): form-escape
  redirect to /welcome on save (S33 Failure 3)`. Skip-link adds
  `?from=welcome`; UserProfileEditor reads via useSearchParams,
  redirects on save success when from===welcome (mirrors S32
  Pre-decision 5 query-param pattern).
- **Commit 4 (`4c85221`)** — `fix(onboarding): suffix
  proscriptive→constructive shift for post-tool-call response
  shape (S33 Commit 4)`. Atomic scope-expansion: NOT pre-planned
  in the brief's Y3 shape; surfaced during Task 7 dev-smoke when
  Commit 2's proscriptive First-turn-discipline clause failed to
  prevent the agent from emitting `agent.greeting.welcome`
  standalone. Three sites in `onboardingSuffix.ts` replace
  proscriptive ("Do NOT emit X") with constructive ("emit Y with
  combined response shape") post-tool-call instructions.

**Site verification status (epistemic discipline applied).**

| Site | Class | Status |
|---|---|---|
| 1 — Step 1 Commissioning post-tool-call | observed-failure-mode | observed-fixed (final Path A re-walk: agent emitted `agent.response.natural` with combined greeting + step-2 company question, exactly as constructive prose prescribed) |
| 2 — Step 1 Joining post-tool-call | inferred-from-substrate | substrate-grounded; not flow-verified (Joining fixture not exercised this session) |
| 3 — Step 2 / 3 atomic post-tool-call | anticipated-defensive | clean transition observed (CHOU Collective creation produced `agent.response.natural` with workspace-ready acknowledgment + first-task cue), but NOT verifiable as caused-by-the-prose: clean transition could mean either the prose worked OR the system would have transitioned cleanly anyway |

**Failure 3 (form-escape redirect) NOT exercised** in dev-smoke
this session (Path B walkthrough deferred due to walkthrough
fatigue + Site 1 re-walk consuming budget). Substrate-grounded
confidence only; flow-verification deferred.

**Drift-list codification (per S33 brief Pre-decision 6) —
DEFERRED.** The S32 closeout NOTE 2026-04-30 already codified
the four-pattern drift list as a permanent guardrail. S33's
brief Pre-decision 6 specified placeholder-decay-without-
tripwire as the new lesson; capturing here as adjacent-but-
distinct codification candidate (item below).

### Codification candidates from S33

- **Placeholder-decay-without-tripwire (single datapoint).**
  Failure 1's bracketed-string placeholder shipped at Session 5
  with intent to be replaced when ProductionChat shipped at
  Session 7. Replacement landed only in ProductionChat;
  OnboardingChat retained the placeholder through Sessions 7,
  S32, and into demo rehearsal. Masked because the rendering
  surface is exercised only during fresh-user smoke, which each
  intervening session had a different focus and never re-tested.
  Lesson: **placeholder code needs a tripwire** — a test, a TODO
  with a session anchor, or a closeout-NOTE pointer — that fires
  when the replacement session ships, not later. Adjacent-but-
  distinct from sprawl-without-tripwire (config-file rule sprawl,
  per `docs/09_briefs/session-config-cleanup-0430-brief.md`).
  Generalizes to **any deferral that lacks a tripwire**, including
  follow-up candidates listed in closeout NOTEs (S32's three
  follow-up candidates — route split, trust-signal surfacing,
  Four Questions audit-grammar — are at risk of the same decay
  mechanism). Periodic "follow-up candidate audit" mitigation
  flagged for future, out of scope this session.

- **Proscriptive→constructive shift in suffix prose (single
  datapoint, codification candidate).** Pattern observation
  abstracted from Commit 4's specific finding: prose-level "Do
  NOT emit X" instructions don't reliably override Claude's tool-
  use cycle defaults under interpretive latitude. Constructive
  replacements ("emit Y with combined response shape") give the
  agent something to do rather than something to suppress. Commit
  4 substituted constructive shape at three sites; Site 1's
  observed re-walk confirms the constructive variant produced the
  intended response shape where the proscriptive variant did not.
  Single datapoint at the site-1 level; track for second fire
  before codification into conventions catalog. Distinguished
  from Commit 4's commit-message NOTE (which is the finding
  itself) — this entry is the pattern abstracted from the
  finding, suitable for catalog elevation if confirmed.

- **Surfaced-by-flawed-verification-path as new epistemic class
  (codification candidate).** Findings that emerge because the
  verification approach itself was incomplete or partially blind
  — distinct from observed (failure-mode reproduced),
  inferred-from-substrate (mechanism traced from substrate
  evidence), and anticipated-defensive (prophylactic prose for a
  hypothesized risk). S33 produced an instance: Site 1's first
  re-walk attempt was vacuous because the fixture SQL didn't
  reset `agent_sessions`; the substrate dive at the time queried
  `agent_sessions` only and missed the cross-table user_profiles
  divergence. Founder caught the divergence by reading the form
  screenshots, not by query — substrate-pull discipline had been
  single-source, and that left a blind spot. Lesson: **multi-
  source substrate verification as discipline** — single-source
  pulls are systematically blind to cross-table divergences. When
  diagnosing a failure mode, query ALL substrate sources tied to
  the user-visible state (here: `user_profiles` AND
  `agent_sessions` AND `memberships`), not just the one named in
  the failure-mode hypothesis.

- **Fixture SQL discipline (codification candidate).** Fresh-shape
  fixture SQL must cover all state sources tied to the failure-
  mode, not just the most-obviously-implicated source. S33's
  initial fixture SQL nulled `user_profiles.display_name` and
  deleted `memberships`; this was incomplete because the
  `agent_sessions` row from prior session attempts persisted
  with `current_step: 2, completed_steps: [1]`, blocking Site 1
  verification by carrying the user past step 1 before the
  re-walk could exercise the step-1 suffix. Corrected fixture
  SQL template for future dev-smoke sessions:

  ```sql
  UPDATE user_profiles
    SET display_name = NULL, first_name = NULL, last_name = NULL
    WHERE user_id IN (
      SELECT id FROM auth.users WHERE email = '<seed-user-email>'
    );
  DELETE FROM memberships
    WHERE user_id IN (
      SELECT id FROM auth.users WHERE email = '<seed-user-email>'
    );
  DELETE FROM agent_sessions
    WHERE user_id IN (
      SELECT id FROM auth.users WHERE email = '<seed-user-email>'
    );
  ```

  Notes: `agent_sessions` deletion required (avoids carryover
  blocking step-1 verification). first/last name nulling
  required for production parity (seed pre-seed at
  `apps/web/src/db/seed/dev.sql:109-114` leaks "Exec"/"User"
  values that real users wouldn't have — see seed-parity gap
  below).

### Obligations.md candidates surfaced this session

- **Onboarding state integrity check at session-load time
  (orchestrator-side).** PATCH `/api/auth/me` accepts
  `displayName: null` without protection
  (`apps/web/src/shared/schemas/user/profile.schema.ts:31`,
  verified at NOTE-write: `displayName: z.string().nullable().
  optional()`, no `.min(1)`, no non-empty constraint). Also,
  UserProfileEditor's handleSave normalizes via `displayName.
  trim() || null` so empty input writes null deliberately.
  Production-reachable divergence path: a fresh user types name
  in onboarding chat (step 1 completes; `completed_steps: [1]`),
  navigates to `/settings/profile` (skip-link or any other path),
  clears the display name field, clicks "Save changes." Result:
  `display_name = NULL` while `completed_steps = [1]` persists.
  Orchestrator does not detect divergence at session-load. A
  clean integrity check at orchestrator load: for any completed
  step, validate the corresponding substrate state still
  satisfies the step's success condition; if divergent, reset
  session state to that step. §8 hard constraint blocks this
  from S33; obligations.md candidate for separate session.

- **Seed user_profiles parity-with-production gap.**
  `apps/web/src/db/seed/dev.sql:109-114` pre-seeds first_name
  ('Exec'/'Controller'/'AP'), last_name ('User'/'User'/'Specialist'),
  display_name ('Executive User'/etc.). Production fresh users
  have NULL first/last (Session 5.2 upsert path). The pre-seed
  leaks values that real users wouldn't have — surfaced in S33
  dev-smoke when the form rendered "Exec" / "User" alongside the
  newly-set "Phil Chou" display_name. Future seed-cleanup session
  should NULL first/last in seed source (or omit the columns
  from the INSERT) for full parity. Verified no test depends on
  seed first/last values (search across `apps/web/tests/`
  produced no consumers of those columns at NOTE-write).

- **Test-isolation refactor for `crossOrgRlsIsolation` +
  Arc-A item-27.** Sibling cluster, same fix-shape category
  (test-design pollution; needs test-isolation refactor). S32
  closeout NOTE framed as "needs reset between runs"; S33 Task 2
  refines this to **"needs test-isolation refactor within a
  run"** — even with `pnpm db:reset:clean` between sessions,
  the within-run mechanism still fires because earlier test
  files in the same run seed `journal_entries` rows that collide
  with `crossOrgRlsIsolation`'s hardcoded UUIDs by the time it
  runs. Refinement is a stronger finding than S32's framing
  captured. **Arc-A item-27 disappearance under post-reset
  clean-baseline at S33 Task 2** (accountLedgerService running-
  balance carry-forward did not fire) is a separate sub-finding
  — possibly resolved by a post-S32 commit, possibly latent
  under within-run conditions; investigation deferred.

### Other findings recorded for traceability

- **`origin/staging` parity finding.** The 71-commit-unpushed
  cite from S32 closeout NOTE 2026-04-30 was point-in-time;
  everything pushed between S32 close and S33 anchor. At S33
  Task 2, `origin/staging` was at parity with HEAD (`5a80c43`).
  S33's four commits create the next held-count (4 ahead of
  origin at this NOTE-write).

- **Anchor-language phrasing convention — fire status: did not
  fire this session.** S32 closeout flagged "most recent in-
  flight Path C anchor" vs "most recent Path C closeout SHA"
  as a phrasing-convention candidate (fire #1). S33's anchor
  verdict at Task 1 (`git merge-base --is-ancestor 37a24a0
  HEAD`) was clean SHA-reachability — the in-flight phrasing
  ambiguity didn't surface. No fire #2 from S33; pattern stays
  at single datapoint.

- **`verify-substrate-claims-from-foreign-conversation-context-
  before-acting` fire #2.** S33 brief revisions log captured
  the pattern: external review during S33 brief drafting
  asserted line ranges ("OnboardingChat at ~line 1006") that
  did not match HEAD. Brief-revision step re-verified against
  the actual file (`AgentChatPanel.tsx`: OnboardingChat at line
  608, empty-state at 725–729) and pushed back rather than
  complying. Fire #1 logged in 2026-04-30 Q33 partial-resolution
  arc. Two fires now; one more fire reaches codification
  threshold (3+ per chounting discipline).

- **Session-lock disposition.** All four S33 commits fired the
  `[coordination] warning: no session lock in use` warning. The
  kickoff brief's Task 10 includes "session-lock release" as
  explicit closeout step, implying locks are normally acquired
  at session start. The Task 7+ continuation in the execution
  conversation did not run `scripts/session-init.sh` after
  resuming from the kickoff prompt — the kickoff prompt's pre-
  warm checklist focused on db/dev/browser warm-up and did not
  enumerate session-init. **This-session disposition: document
  the gap honestly; do not retroactively manufacture a lock.**
  Reasoning: retroactive lock creation would be performative; a
  lock is a coordination mechanism for concurrent-session
  discovery, and S33's execution did not have concurrent
  sessions to discover. The honest record is "ran without lock;
  no concurrent-session conflict surfaced; gap-of-discipline
  rather than gap-of-substance." **Future kickoff-template
  correction:** future kickoff prompts should include `bash
  scripts/session-init.sh <label>` as the first item in the
  pre-warm checklist alongside dev-environment warm-up. Approved.

### OQ resolutions

| OQ | Resolution |
|---|---|
| OQ 1 — `?from=welcome` query-param for Failure 3 | **Default holds.** Query-param mechanism approved; mirrors S32 Pre-decision 5 ?first_arrival=1 pattern |
| OQ 3 — Opening-prompt wording ("What should I call you?") | **Default holds.** Posture-test passed; voice-continuity with S32 register intact |
| OQ 4 — Joining-flow opening prompt same vs branched | **Default holds (substrate not exercised).** Same prompt for both modes; revisit if invited-user UX accumulates divergent surface |
| OQ 5 — `setTimeout` 500ms hardcoded for Failure 3 redirect | **Default holds.** No reason surfaced to revisit |
| OQ 6 — Per-commit gates vs end-only | **Moot.** End-only gate landed; Y3+1 commit shape (Commits 1-3 + Commit 4 expansion) absorbed cleanly |
| OQ 8 — Placeholder-decay applicability to TODOs | **Deferred.** Philosophical, low-priority; surface in future obligations.md pass if relevant |

### Atomic scope expansion: Y3 → Y4

S33 brief framed as Y3 (three commits, one per failure). Commit
4 was unplanned scope expansion surfaced during Task 7 dev-
smoke. Operator approved fix-it-fully at the prompt layer rather
than defer to Phase 2 follow-up. Honest record: S33 grew during
execution; the closeout NOTE captures the growth as deliberate
in-session remediation, not undisciplined scope creep. Sessions
that surface real bugs during dev-smoke are entitled to one-
commit expansions when the fix is tightly scoped, §8-compliant,
and the operator explicitly authorizes. S33's Commit 4 satisfies
all three.

### Session-end housekeeping

- **Orphan organization cleanup.** "CHOU Collective"
  (`5e3026bf-2695-44b6-9fff-c7b32ad346ba`) created during
  Task 7 walkthrough remains in `organizations` with no members
  after fixture cleanup. Operator direction: `pnpm
  db:reset:clean` at session close.
- **Kickoff file deletion.**
  `docs/09_briefs/phase-1.3/session-33-task-7-kickoff.md` slated
  for deletion per file's own header instruction and Task 9
  cleanup-list enforcement.

---

## 2026-05-01 — Production promotion arc: v0.1.0-mvp → main; env-config gap surfaced post-merge

Fresh session opened against staging tip `5aed597` per the
production-promotion resume prompt. Three-phase scope: pre-
merge verification, the merge itself, post-merge verification.
Phase 4 doc updates split per Option B at session close — this
entry plus the CURRENT_STATE.md update are the in-session
deliverables; six other items deferred to a fresh cleanup
session.

### What landed

- **Merge commit `9f0ebb3`** on main via `gh pr merge 2 --merge
  --delete-branch=false`. PR body documented all three
  push-readiness conditions and the merge mechanics. PR
  preserved for the audit trail; `staging` survives per the
  flag.
- **Production deploy `GuG3X5Bd3`** (chounting Vercel project,
  Production · Current, 42s, Ready) after a one-arc env-var fix
  cycle. `chounting.chou.ca` now serves `apps/web` from the
  merge commit. Quick smoke test passed against the four Q33
  partial-resolution endpoints (`/api/agent/confirm`,
  `/api/agent/conversation`, `/api/agent/reject`,
  `/api/auth/mfa-status`).
- **Annotated tag `v0.1.0-mvp` pushed to origin** at the end of
  the session. The tag points at `5a80c43`, the
  Vercel-deploy-infrastructure-unblock commit on staging that
  retroactively marked MVP demo-readiness.

### What didn't land per plan

The session's actual shape was rougher than the resume prompt's
five-step Phase 1 anticipated. Three meta-findings worth
recording.

#### Finding F1 — Phase 1 Step 4 environment-isomorphism gap

The resume prompt asked Phase 1 to verify Vercel infrastructure
before merging. Phase 1 Step 4 cleared on the strength of "the
chounting Vercel project's staging deploy at `5aed597` is
green" — interpreted as strong dress-rehearsal evidence for the
post-merge production deploy. The interpretation was structurally
wrong: a Vercel project's staging environment and production
environment are **independent runtime configurations sharing only
the project repo**. Code that builds-and-runs in staging-
environment scope is *not* evidence that the same code will build-
and-run in production-environment scope. Environment-scoped
secrets, environment-scoped feature flags, and environment-scoped
runtime config are all per-environment. **Neither operator nor
assistant flagged the staging-vs-production environment-scope
distinction at Phase 1 Step 4** — the interpretation crystallized
across messages from both sides without challenge.

The actual state at the moment of merge: production environment
was missing three required env vars
(`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
`NEXT_PUBLIC_APP_URL`) that staging environment had. The
codebase's env-validation guard (visible in `apps/web/src/`,
referenced via `.env.example` and the build-error message)
fired at `next build`'s page-data-collection step on first
production deploy attempt (`93RCQ81gm`), terminating the build
before deployment cutover. `chounting.chou.ca` remained on the
prior production deploy (Apr 9 `f0fbc97`) — Vercel's standard
behavior of not promoting failed deploys.

**Pattern name:** *environment isomorphism assumption*. Adjacent
to the Phase 1.2 §C9 "Re-verify Environmental Claims at Each
Gate" convention but distinct: that one's about the same agent
re-verifying its own prior claims; this one's about treating
two distinct runtime-config environments as if their
configurations are isomorphic when they're not.

**Codification candidate** at this single firing — extend the
"Re-verify Environmental Claims at Each Gate" convention with a
cross-environment-scope sub-clause: "verify each environment's
runtime configuration independently; staging-green is necessary
but not sufficient for production-go." Threshold met if a
second instance fires; track for future production-promotion
sessions.

**Phase 4 obligation** (deferred to cleanup session): add a
production-environment-config-checklist item to
`docs/09_briefs/phase-2/obligations.md` so future
production-promotion sessions catch the gap pre-flight.

#### Finding F2 — dropped halt at Gate 1 clearance

The session operated a two-gate halt structure for the merge
(Gate 1 = diff verdict; Gate 2 = Vercel preview deploy + merge
method confirmation). Gate 2 was settled explicitly. Gate 1 was
not formally re-confirmed before the merge command ran.
Operator had reviewed the diff visually (commit list, file tree
sidebar in the Files-changed tab) and made an implicit "diff is
clean enough" judgment at the moment of running the merge
command; assistant did not pause to ratify the implicit
judgment as an explicit gate clearance.

Defensible from the operator side — the diff content was in
fact clean, the implicit judgment was correct. But the gate
structure existed precisely to make implicit judgments
explicit, and skipping that step at the irreversible action was
the wrong shape regardless of outcome.

**Lesson**: at irreversible actions, the assistant should
explicitly request "Gate 1 clearance: confirm diff verdict" as
its own halt rather than allowing the gate to be settled by
inference from operator's other actions. Halt cadence at the
irreversible edge should be tighter, not looser.

#### Finding F3 — Vercel dashboard env-var persistence bug on `NEXT_PUBLIC_*` Sensitive entries

When `NEXT_PUBLIC_APP_URL` was created with the Sensitive
toggle on (Vercel UI default for new variables), the entry's
value repeatedly dropped to empty across Save → re-open round-
trips. Direct evidence: typed `https://chounting.chou.ca` into
Value field with focus-blur sequence, clicked Save, dialog
closed, "Updated just now" timestamp updated — but reopening
the entry showed the placeholder text again, value unset.

Resolved by deleting the entry and recreating with Sensitive
toggle off. `NEXT_PUBLIC_*` variables are by definition
non-secret (they're shipped to the browser bundle), so
Sensitive=on for them is a category error — Vercel's
encryption path for sensitive values may be incompatible with
how `NEXT_PUBLIC_*` lookup happens at build time.

**Phase 4 obligation** (deferred): note in operations runbook
or Phase 4 cleanup brief: "create `NEXT_PUBLIC_*` Vercel
variables with Sensitive=off."

### Test-suite pollution: new cluster sibling to Arc A item 27

Pre-reset full-suite at staging HEAD showed 5 failures in one
run, 7 in another at the same HEAD with no code change between.
Run-to-run variance at the same HEAD is itself the pollution
signal. Post-reset (`pnpm db:reset:clean && pnpm db:seed:all &&
pnpm test`): 598/598. Pre-reset failures all confirmed
pollution by the pre/post diff being conclusive.

Two clusters in play:

- **Arc A item 27 pair**: `accountLedgerService` running-
  balance, tests 3 and 6. Documented carry-forward; fix shape
  known (migrate to less-polluted account, 1300 precedent).
- **New cluster (5 tests across 5 files)**:
  `orgUsersViewRender` (CA-77), `ownerPartialUnique` (CA-25),
  `userHasPermissionHelper` (CA-34), `orgProfileEditorAuthz`
  (CA-76), `aiActionsReviewPageRender` (CA-S8-C2b). Same
  fix-shape category (test-isolation refactor: per-test
  trace_id scoping, runtime lookup over hardcoded UUIDs,
  fixture-SQL discipline per S33's codification candidates).
  Broader surface than item 27 — multiple files, multiple test
  families, all under post-Phase-1.5C (membership / permissions
  / org users / ai_actions review) substrate.

**Phase 4 obligation** (deferred): add an obligations.md row
under §6 architectural follow-ups, sibling to the existing Arc
A item 27 row, naming the new cluster's affected tests and the
fix-shape category they share with item 27.

### Total session shape

PR opened at `https://github.com/champagne-papa/chounting/pull/2`
via `gh pr create` (after a `gh auth refresh --scopes
repo,read:org,workflow` because the initial gh auth flow
defaulted to insufficient scope). Merge fired clean; production
deploy 1 errored on env vars; env-var fixes applied via Vercel
dashboard (with one CLI fallback considered but not used);
production deploy 2 (`GuG3X5Bd3`) succeeded; smoke test passed.

Net duration: substantially longer than a "promote staging to
main" session would have been if Phase 1 Step 4 had checked
production-environment scope. Worth recording the lesson while
the cost is fresh.

### Convention-fire status

- **File-top-comment-staleness pattern (CLAUDE.md Pattern 8)**
  fired again on `.github/workflows/ci.yml`. The file's
  comments still describe the eslint exemption ("or a narrow
  `src/agent/**` eslint exemption lands") as a future
  conditional, but the exemption shipped in `e719d02` (Q33
  partial-resolution arc, 2026-04-30). Plus the
  `--filter=@chounting/demo` filter on the lint and build jobs
  could now be removed since `@chounting/web` lint passes
  post-exemption. **4th fire of the pattern** (CLAUDE.md cited
  3 fires from Arc A); past further-codification threshold.
  Concrete Phase 4 obligation: at the cleanup session, decide
  between (a) tooling support — pre-commit grep for stale
  top-of-file comments citing pre-edit state — or (b)
  escalation in the convention's CLAUDE.md framing (e.g.,
  "review file-top comments before committing any edit that
  changes behavior the comments describe"). Default if no
  preference: option (b), since (a) requires a tooling-build
  arc and (b) is a one-line CLAUDE.md edit.

- **GitHub repo default merge method = Squash-and-merge.**
  Project discipline (per friction-journal Q33 partial-
  resolution arc and CLAUDE.md push-readiness convention) is
  merge-commits-preserve-audit-trail. Repo setting and project
  discipline are misaligned. Phase 4 cleanup target: align repo
  default to "Create a merge commit." (Mitigated for this
  merge by using `gh pr merge 2 --merge` which explicitly
  selects merge-commit; not a regression but worth fixing for
  future PRs that go through the UI.)

### Carry-forward summary

Six items deferred to a fresh Phase 4 cleanup session (in
priority-of-impact order, roughly):

1. obligations.md row for production-environment-config
   validation gap (highest impact: codifies the lesson so it
   doesn't fire twice).
2. obligations.md row for the new 5-test pollution cluster.
3. `.github/workflows/ci.yml` cleanup (filter removal +
   comment update).
4. GitHub repo settings: default merge method.
5. Staging-environment `NEXT_PUBLIC_APP_URL` value cleanup.
6. Vercel `NEXT_PUBLIC_*`-with-Sensitive-off note for ops
   runbook.

---

## 2026-05-01 — S31 LT-02 closure — Path C arc Gate 5 closed (Path C arc closes)

S31-lt-02-test-coverage session closed. Single bundled commit
on `staging` ahead of `origin/staging` shipping the LT-02 test-
coverage closure across five sub-items per the post-re-anchor
substrate-honest scope (AMENDMENTS 1–5). All five Path C arc
verification-harness gates now green: Gate 1 (MT-05) + Gate 2
(MT-06) at S28 (`e966f30`); Gate 3 (UF-002 broad-scope wrap)
at S29b (`7774d25`); Gate 4 (LT-01 + LT-03 + LT-04 +
QUALITY-006) at S30 (`64996b5`); Gate 5 (LT-02 test coverage)
here. **Path C arc closes; Phase 2 surface expansion gate
unblocks.**

### Sub-item closure summary

- **Sub-item (a) — `journalEntryService.get` post-S29b-wrapped
  coverage.** Closes the S29b pre-flight pre-5 finding via
  NEW `apps/web/tests/integration/journalEntryServiceGet.test.ts`
  (3 it-blocks: same-org valid get returning JournalEntryDetail
  with hydrated lines + reversed_by/reverses; cross-org caller
  with foreign-org journal_entry_id returning
  `ServiceError('NOT_FOUND')` per existence-leak-prevention
  contract; non-existent UUID returning
  `ServiceError('NOT_FOUND')`). Soft 9 natural-key pattern
  applied — account IDs resolved at `beforeAll` via
  `account_type` queries against `chart_of_accounts` for both
  `ORG_HOLDING` and `ORG_REAL_ESTATE`; no hard-coded UUIDs.
- **Sub-item (b) — agent conversation length boundary-not-
  overflow.** NEW `apps/web/tests/integration/agentConversation
  LengthBoundary.test.ts` (1 it-block) per AMENDMENT 2
  substrate-honest reframe. Pins the orchestrator's full-
  history pass-through architectural state at HEAD (master §5.2
  step 5 — no truncation/rotation logic). 32-turn synthetic
  conversation persisted via `agent_sessions.conversation`
  (column name substrate-confirmed at re-anchor pre-flight —
  brief is correct; migration 121's `.turns` is additive UI-
  side, not a rename). `__setMockFixtureQueue` +
  `__getLastClaudeCallParams` fixture-branch pattern per CA-39
  precedent; mocked callClaude per pre-decision (b-α); zero
  paid-API spend. Test inverts to truncation-curve
  characterization when Phase 2 ships truncation
  infrastructure.
- **Sub-item (c) — coverage-sufficiency-verification of CA-28 +
  chartOfAccountsServiceCrossOrg.** Substrate-record-only per
  AMENDMENT 3. CA-28 (`apps/web/tests/integration/journalLines
  CrossOrgAccount.test.ts`, 3 it-blocks: foreign-org
  account_id INSERT raises `trg_journal_line_account_org`
  foreign_key_violation; same-org happy-path; UPDATE rejected
  by either immutability or cross-org trigger) +
  chartOfAccountsServiceCrossOrg / CA-23 (`apps/web/tests/
  integration/chartOfAccountsServiceCrossOrg.test.ts`, 3 it-
  blocks: service-layer `ORG_ACCESS_DENIED` when caller lacks
  membership; happy-path with membership; service-layer
  `NOT_FOUND` with conflicting (account_id, org_id) defense-
  in-depth) substantively close LT-02(c). Hard Constraint F
  preserved — no real gap surfaced; no scope-creep into in-
  flight test-creation.
- **Sub-item (d) — audit-log nested-PII redaction
  integration.** NEW `apps/web/tests/integration/auditLog
  NestedPiiRedaction.test.ts` (2 it-blocks per Reading B
  pre-execution scope-amend ratification). it-block (i):
  depth-4 nested PII redaction via direct `recordMutation`
  call with synthetic `entity_type: 'test_entity'` + action
  `'s31.lt02d_nested_depth4'`; reads audit_log row by
  trace_id; asserts PII_FIELDS members redacted recursively at
  depth 4 with siblings + top-level non-PII preserved.
  it-block (ii): depth-limit warn-and-continue with
  `warnedAtLimit.fired` latch sharp-pin via filtered count
  assertion (filter on exact warn-message string
  `'redactPii: depth limit exceeded; partial redaction'`,
  assert filtered `toHaveBeenCalledTimes(1)`); audit row
  lands despite depth-limit-exceeded confirming warn-and-
  continue posture per S28 pre-decision 3. Naming-asymmetry
  honest encoding per Hard Constraint C: test-file header
  documents PII_FIELDS (`invited_email`/`phone`/`first_name`/
  `last_name`/`display_name`) recursive coverage vs pino's
  `*.email`/`*.phone`/etc. depth-1 coverage as load-bearing-
  substrate, not bug. NO pino-side assertion; multi-level
  pino remains Phase 2 consolidated obligation.
- **Sub-item (e) — coverage-sufficiency-verification of
  CA-27.** Substrate-record-only per AMENDMENT 5. CA-27
  (`apps/web/tests/integration/journalEntryPeriodDateRange.
  test.ts`, 4 it-blocks: service-layer `entry_date <
  start_date` rejection, service-layer `entry_date >
  end_date` rejection, DB-trigger
  `trg_journal_entry_period_range` direct-INSERT
  check_violation, on-boundary inclusivity at both
  start_date and end_date) substantively closes LT-02(e).
  Soft 9 natural-key pattern present (`account_code` `'1000'`
  cash + `'4000'` rent looked up at `beforeAll`). Hard
  Constraint F preserved.

### Test pattern discipline outcomes per sub-item

- **(a) Soft 9 applied.** Account IDs resolved at fixture-
  setup via `account_type === 'asset'` / `'revenue'` filtering
  (mirrors CA-61's `loadCoA` helper); no hardcoded UUIDs.
  Running-balance fragility shape per `obligations.md` §6 NOT
  replicated.
- **(b) Mocked callClaude.** `__setMockFixtureQueue` fixture-
  branch per CA-39; explicit anti-precedent of
  `agentRealClientSmoke.test.ts`'s `describe.skipIf(!HAS_KEY)`
  cited in test-file header. Test runs unconditionally; zero
  paid-API spend.
- **(c) Hard Constraint A preserved.** Sufficiency-
  verification only — no test-creation; no chart_of_accounts
  fixture surface introduced.
- **(d) Naming-asymmetry honest encoding.** Test-file header
  documents the `invited_email` (audit_log) vs `*.email`
  (pino) field-name divergence + the depth-1 (pino) vs
  depth-8 (audit_log) coverage divergence as substrate-
  coherent load-bearing pattern; Phase 2 multi-level pino +
  financial-PII path remediation tracks the asymmetry as the
  consolidated obligation.
- **(e) Date-range coverage closed.** CA-27 substrate-cite;
  no in-flight scope-amendment.

### Sub-finding category v — drift carry-forward (Convention #8)

Five drift instances accumulated across S31 execution.
Distributed across four drift sub-classes: item (1) is the
NEW substrate-LAYOUT class (Convention #8 generalization
point — across-file path-prefix drift); item (3) is a
substrate-INVOCATION sub-class (tooling-syntax redirected at
the dispatcher layer); items (2) and (4) are fresh instances
within Convention #8's existing within-file IDENTITY scope
(numerical references — line-cite, count); item (5) is a
substrate-STATE drift sub-class (test-fragility-posture
shifted between sessions). The four-sub-class taxonomy is
elaborated at the end of this section. None reach
codification-graduation per Hard Constraint F.

1. **Substrate-layout drift — path-prefix re-anchor table
   (NEW class; Convention #8 generalization).** Brief was
   anchored at `7774d25` (S29b), pre-monorepo. Restructure
   shipped at `a8f5c89` (workspace skeleton) + `4ac1f88`
   (move production app into `apps/web/`) in the 31-commit
   descendant range to staging HEAD `5aed597`. Every cited
   `src/...` and `tests/...` path now lives under
   `apps/web/...`; every cited `docs/...`, `supabase/...`,
   and root-level pnpm script stays at root. Path table
   verified by enumeration before Task 2; no non-uniform
   exceptions surfaced. **Generalization claim:**
   Convention #8 verify-directly was originally scoped to
   line-number / count / pattern drift INSIDE files; this
   firing extends it to path-prefix drift ACROSS files
   (substrate-layout shift class). Same shape — verify
   substrate at execution rather than trusting cited
   coordinates — broader scope. Reusable precedent for any
   future workspace-skeleton-class change.
2. **Reference drift — `PII_FIELDS` line-cite.** Brief
   cited `:19-26`; actual at HEAD `:23-29`. Numerical-
   reference drift inside an unchanged file. Fresh instance
   within existing Convention #8 scope; no fresh
   codification-graduation.
3. **Invocation drift — `pnpm test <name>` tooling-syntax
   shift post-monorepo.** Brief Task 5/6/7 Step 3 used the
   bare `pnpm test <name>` form; under the post-monorepo
   turbo dispatcher that argument is interpreted as a task
   name and fails with `Could not find task`. Substrate-
   correct invocation: `pnpm --filter @chounting/web exec
   vitest run tests/integration/<name>.test.ts`. Qualitatively
   distinct from numerical-reference drift — the brief's
   command is syntactically valid but semantically
   redirected by the workspace dispatcher introduced in the
   descendant range. Used for all three NEW-test-file runs
   at Task 5/6/7 Step 3.
4. **Reference drift — skip-org-check comment count.**
   Brief Task 8 Step 3 expected 32 (S29b post-state); actual
   at HEAD 33. Per Operator Note 2 two-drift-mode framing:
   total `withInvariants` wrap-site inventory at HEAD = 26;
   the +1 in skip-org-check comments maps to a Q33 partial-
   resolution arc commit (`2dfa81e refactor(web): route 4
   web adminClient consumers through service layer`) in the
   descendant range. **"New wrap landed" mode confirmed**
   (NOT "comment-convention drift" mode). Not S31-
   attributable; LT-01(b) state at HEAD remains substrate-
   coherent.
5. **Substrate-state drift — full-suite carry-forward
   failure surface (DISTINCT from substrate-layout class).**
   Brief expected `verifyAuditCoverageRoundTrip` as the 1
   carry-forward failure (S29b state). At HEAD that test
   passes; the new fragility surface is
   `crossOrgRlsIsolation.test.ts > Integration Test 3` —
   `journal_entries_pkey` duplicate-key violation when the
   test runs twice in one session (once in `agent:validate`,
   once in full-suite) without per-run cleanup, because it
   hardcodes `TEST_IDS.je_holding`/`TEST_IDS.je_real_estate`.
   State-pollution-attributable carry-forward (sibling-shape
   to Arc A item 27 fragility — same fix-shape category per
   Phase 2 obligations.md §6: per-test trace_id scoping +
   runtime lookup over hardcoded UUIDs). NOT S31-edit-
   attributable (S31 doesn't touch `crossOrgRlsIsolation`,
   `TEST_IDS`, or any shared fixture this test consumes).
   Brief Task 8 Step 4 explicitly authorizes NOTE-document-
   don't-halt for this shape. **Distinction worth pinning
   for future readers:** four drift sub-classes surfaced
   this session:
   - **substrate-LAYOUT drift** — file paths shifted across
     the repository (item 1). NEW class; Convention #8
     generalization point.
   - **substrate-STATE drift** — which-tests-are-fragile
     shifted (item 5). Test-fragility-posture is itself a
     mutable substrate; what passes / fails / pollutes can
     change between sessions independently of file paths
     and line numbers.
   - **substrate-IDENTITY drift** — numerical references
     within a stable codebase shifted (items 2 + 4). Line-
     cites and counts are the canonical Convention #8 prior-
     scope cases.
   - **substrate-INVOCATION drift** — tooling-syntax
     redirected at the dispatcher layer (item 3). Same
     command string, different downstream behavior because
     the dispatcher changed underneath. Distinct from
     IDENTITY drift in that no number drifted; the syntactic
     surface stayed identical while the semantic
     interpretation shifted.

   All four sub-classes sit under Convention #8 verify-
   directly's umbrella once extended per item (1)'s
   generalization. The distinction matters because the
   diagnostic shape differs: LAYOUT and INVOCATION are
   caught by trying-the-cited-form-and-getting-no-such-
   path / no-such-task; IDENTITY is caught by grepping the
   anchor string and observing a different line; STATE is
   caught only by running the suite and observing a
   different failure surface than the brief expected.

### Sub-finding category vi — follow-up codification candidates (out-of-scope per Hard Constraint F)

Distinct from category v: these are candidates-for-future-
ratification surfaced during S31 execution but deliberately
NOT folded in to preserve sub-item scope. Capture here so the
findings don't get lost between sessions.

- **(a) `recordMutationPiiRedaction.test.ts:144-147`
  assertion tightening.** S31 sub-item (d) integration test
  pins the `warnedAtLimit.fired` latch via filtered
  `toHaveBeenCalledTimes(1)` on exact warn-message string.
  The unit-level case (v) at the cited lines uses
  `toHaveBeenCalledWith` only — would silently pass under a
  per-element warn regression. Recommended tightening:
  replace with `toHaveBeenCalledTimes(1)` (sibling-shape to
  S31's integration assertion). Shape: integration-layer
  pin lands at S31; unit-layer tightening recommended for
  next observability/PII-touching session. Hard Constraint
  F precludes folding into S31.
- **(b) `crossOrgRlsIsolation` per-test scoping refactor.**
  Item v(5) above surfaced the fragility shape at full-
  suite. Fix-shape per Arc A retrospective Pattern 3:
  per-test `trace_id` scoping + runtime account/period
  lookup (Soft 9 pattern) + drop hardcoded
  `TEST_IDS.je_holding`/`TEST_IDS.je_real_estate`. Sibling
  to Arc A item 27 (`accountLedgerService` running-balance)
  + the 5-test pollution cluster surfaced post-merge
  (`orgUsersViewRender`, `ownerPartialUnique`,
  `userHasPermissionHelper`, `orgProfileEditorAuthz`,
  `aiActionsReviewPageRender` per CURRENT_STATE.md). Folds
  under the existing Phase 2 test-hygiene workstream per
  `obligations.md` §6.
- **(c) Pre-existing lint warnings.** `pnpm --filter
  @chounting/web exec eslint src/services/` reports 0
  errors + 2 warnings: `'ctx' is defined but never used` at
  `apps/web/src/services/accounting/taxCodeService.ts:26`
  and `apps/web/src/services/org/invitationService.ts:234`.
  Both pre-existing; not S31-edit-attributable. Convention
  fix-shape: rename `ctx` → `_ctx` (matches `^_` allowed-
  unused-args pattern). Trivial; defer to whichever future
  session next touches those service files.

### Path C arc closure outcomes

- **All five gates green at this commit.** Gate 1 (MT-05
  audit-emit observability) + Gate 2 (MT-06 PII redaction)
  at S28; Gate 3 (UF-002 broad-scope wrap) at S29b; Gate 4
  (LT-01 + LT-03 + LT-04 + QUALITY-006) at S30; Gate 5
  (LT-02 test coverage) here. UF-002, UF-006, UF-008,
  UF-010, UF-013, UF-014, QUALITY-006 closed across the
  arc.
- **AMENDMENTS 1–5 — substrate-honest scope narrowing
  (substantive precedent).** Five pre-execution AMENDMENTS
  in the S31 re-anchor brief narrowed sub-items based on
  substrate-real existing coverage:
  AMENDMENT 1 narrowed sub-item (a) from full path-service-
  RPC to `journalEntryService.get` post-S29b-wrapped
  coverage (CA-61 already covers the broader surface);
  AMENDMENT 2 reframed sub-item (b) from saturation-curve
  to boundary-not-overflow when substrate showed no
  truncation logic at HEAD;
  AMENDMENT 3 reframed sub-item (c) as substrate-record-
  only (CA-28 + chartOfAccountsServiceCrossOrg already
  cover);
  AMENDMENT 4 narrowed sub-item (d) to integration-level
  nested-PII complement (CA-15 already covers flat-PII);
  AMENDMENT 5 reframed sub-item (e) as substrate-record-
  only (CA-27 already covers).
  The AMENDMENT discipline preserved arc-level coherence
  (LT-02 closure semantics intact) while honoring sub-item-
  level substrate-honesty (don't manufacture fresh tests
  when existing coverage is substantively-equivalent). Hard
  Constraint F's "halt-and-surface if real gap surfaces
  during sufficiency-verification" did NOT fire this
  session — both sub-items (c) and (e) closed cleanly via
  substrate-record citation. The substantive precedent here
  is that brief-scoped narrowing-via-AMENDMENT is the
  honest response to "the gap you're sending me to close
  has already partially closed."
- **AMENDMENT 6 — Y2 threshold guidance refinement
  (smaller-scope adjustment).** Distinct from AMENDMENTS
  1–5: rather than substrate-honest scope narrowing,
  AMENDMENT 6 lowered the brief's Y2-availability
  threshold from `> 400 lines net diff` to `> 200 lines`
  on the basis that the post-AMENDMENTS-1–5 surface was
  materially smaller than originally framed. AMENDMENT 6
  encoded guidance, not a fixed split — operator-
  ratification at execution time was always the deciding
  factor per pre-decision (d-α). At S31 closeout the
  >200-line threshold was exceeded (3 NEW test files = 563
  lines + this NOTE = ~860 total) but operator ratified Y1
  single-bundled. Three load-bearing reasons: (γ)-rhythm
  non-trigger was the decisive factor (see next bullet);
  S29a element #1 removes Y2's classical SHA-reference
  benefit (the NOTE can't self-reference Commit 1's SHA
  anyway); atomic Path C Gate 5 closure benefits from
  single-commit shape (clean git-bisect surface, clean
  arc-close anchor). Y1 precedent sibling to S28's
  closeout shape.
- **Reading B framing — pre-execution scope-amend, NOT
  in-flight scope-creep — the load-bearing distinction for
  (γ)-rhythm non-trigger.** Sub-item (d)'s scope grew from
  the brief's literal 1 it-block (depth-4 nested PII) to
  the shipped 2 it-blocks (depth-4 + depth-limit warn-once
  latch). Reading B was the operator-ratified expansion
  shape; Reading A would have tightened the existing unit
  test instead of expanding the new integration test.
  **Why the distinction matters:** (γ)-rhythm scope-amend
  specifically codifies in-flight scope-amendments at
  execution cadence — scope expansions surfaced and
  absorbed mid-task without operator-pre-ratification.
  Reading B happened pre-execution: I surfaced Readings A
  vs B as a design question after seeing the unit test's
  weak `toHaveBeenCalledWith` assertion; operator ratified
  Reading B BEFORE I wrote the test. That's brief-revision-
  shape (refining scope before execution begins), not in-
  flight-scope-creep (expanding scope during execution).
  Had Reading B been absorbed silently mid-write or only
  surfaced post-execution, (γ)-rhythm would have advanced
  to N=3 (graduation per Documentation Routing convention's
  N=3 threshold). Pre-execution operator-ratification
  preserves the codification-candidate at N=2. Future
  readers: when judging whether a scope-amendment counts
  toward (γ)-rhythm, the question is "was operator-
  ratification before or after execution began?", not "did
  scope expand?".

### Codification candidate state changes

- **Pre-flight delta-inventory pattern — session-execution
  cadence extension.**
  *Discipline:* before running session-init, verify the
  brief's expected close-commit isn't already an ancestor
  of HEAD.
  *When it fired:* S31 kickoff after the prior turn
  surfaced S28-already-merged (S28's close commit
  `e966f30` was already a direct ancestor of HEAD; re-
  execution would have been no-op or destructive
  duplication). The drafted S31 prompt added explicit pre-
  flight checks: `7774d25` reachability against HEAD,
  grep for any S31 execution commit subject in HEAD's log,
  ls-tree check for absence of the brief's NEW test files.
  *What it caught:* nothing this session — S31 was
  genuinely unstarted; all three pre-flight checks
  cleared. The discipline preserved a defense-in-depth
  gate that would have caught a hypothetical S31-already-
  executed scenario (sibling to S28).
  *Status:* N=1, monitoring. Sibling-shape to brief-
  creation-cadence pre-flight delta-inventory (the brief's
  pre-1/pre-2/pre-3/pre-4/pre-5 enumeration); this is the
  session-execution-cadence extension. Codification
  candidate; not yet graduation-eligible. Watch for
  recurrence at the next post-merge brief execution.
- **Read-completeness-threshold — full-enumeration over
  rule-based assertion.**
  *Discipline:* enumerate fully, don't rule-assert. When
  the substrate exhibits a uniform-looking shift, surface
  every instance to verify uniformity rather than
  asserting it.
  *When it fired:* S31 Task 1 re-anchor exercise. My
  initial framing was "the substrate-layout shift is
  uniform, mechanical, single rule covers it"; operator's
  first guardrail required converting that assertion into
  verified inventory via the full enumerated re-anchor
  path table covering every brief-cited path with its
  `apps/web/`-prefixed form.
  *What it caught:* the assertion happened to be correct
  (zero non-uniform exceptions surfaced — the shift WAS
  uniform), but the discipline preserved the
  verification's legibility for future readers and would
  have caught any non-uniform exception before it
  contaminated execution. The discipline's value isn't
  proven-by-firing this session but proven-by-converting-
  assertion-to-verified-inventory.
  *Status:* N=3 graduation per brief codification ledger
  (S29 brief-creation partial-pattern-read N=1 + S30
  brief-creation Pattern B count drift N=2 + S31 brief-
  creation existing-tests-not-fully-enumerated N=3 —
  loose-shape parent + strict-shape sub-tracking). The S31
  Task-1 path-table firing is a session-execution-cadence
  sibling to the brief-creation-cadence parent
  graduations. Codification-fire element captured here per
  (re-anchor-1-α)-style precedent.
- **Convention #8 verify-directly — generalization to
  substrate-layout drift class.**
  *Discipline:* verify substrate at execution cadence,
  don't trust cited coordinates. Originally scoped to
  within-file numerical-reference drift (line cites,
  counts, anchor patterns).
  *When it fired:* S31 Task 1 re-anchor exercise revealed
  every cited `src/...` and `tests/...` path now lives
  under `apps/web/...`. The shape was Convention #8
  applied at a broader scope: across-file path-prefix
  drift instead of within-file numerical drift.
  *What it caught:* the monorepo restructure's path-
  prefix shift uniformly across all 15 brief-cited paths.
  Verification by enumeration confirmed no non-uniform
  exception (and no rename / removal in the descendant
  range).
  *Status:* Convention #8 itself remains graduated at
  high N within its original within-file numerical-
  reference scope. The substrate-LAYOUT generalization
  firing here is on a separate monitoring track at N=1 —
  the new sub-class scope (across-file path-prefix drift)
  is not yet graduation-eligible. Same-shape (verify-
  directly), broader-scope (across-file rather than
  within-file). Watch for recurrence at the next
  workspace-skeleton-class substrate shift.
- **Substrate-fidelity-gate.** Already graduated S30 N=∞.
  Continuing-firings this session at brief-creation pre-
  flight cadence (the brief's pre-1 through pre-5
  enumeration), lock-acquisition cadence (session-init at
  Task 1 Step 1), and re-anchor cadence (path-table
  enumeration before Task 2). No fresh graduation; the
  multi-cadence-firing pattern is the established
  discipline.

---

## 2026-05-01 — Path A carve-out closeout — rate-limit on /api/agent/message (pre-Phase-2A)

`path-a-ratelimit` session closed. Single bundled commit
(staged-but-not-committed at session-end pending operator
review gate per brief Task 8 Step 4) shipping the rate-limit
gate on `POST /api/agent/message` — the orchestrator entry
point that calls Anthropic. Closes the unbounded paid-API-
spend gap on a public-internet production endpoint without
expanding scope to the broader Path A cleanup (deferred to
Post-MVP after Phase 2 closeout per the 2026-05-01 phase-
restructuring decision). Anchor: S31 close commit `1b2ec4b`
(Path C arc Gate 5; LT-02 closure).

### What shipped

- **NEW** `apps/web/src/app/api/_helpers/rateLimit.ts` —
  `rateLimitAgentMessage(identifier, trace_id)` helper
  wrapping `@upstash/ratelimit` v2.0.8 against
  `Redis.fromEnv()`. Two sliding-window limits (both keyed
  on `user_id`): 30 requests / minute burst limit + 200
  requests / hour ceiling. Either tripping returns
  `{ success: false, retry_after_seconds, reason }`.
  Soft-fail-open posture: try/catch around the Upstash
  calls; on Redis unreachability, log with
  `action: 'agent.message.rate_limit_check_failed'` and
  return `{ success: true }`.
- **EDIT** `apps/web/src/app/api/agent/message/route.ts` —
  rate-limit check inserted between `buildServiceContext`
  (line 51) and `handleUserMessage` (line 53 pre-edit;
  shifted post-edit). On miss: returns 429 with body
  `{ error: 'RATE_LIMITED', message, retry_after_seconds }`
  + header `Retry-After: <seconds>`. Route-layer policy
  decision returns 429 directly rather than throwing
  `ServiceError('RATE_LIMITED', ...)`; the
  `serviceErrorToStatus` mapping (`RATE_LIMITED → 429`)
  lands as defense-in-depth for any future service-layer
  firing.
- **EDIT** `apps/web/src/shared/env.ts` —
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  added to `REQUIRED_SERVER` (fatal-startup-message at
  boot if missing per F1 environment-isomorphism finding)
  and to the exported `env` object.
- **EDIT** `apps/web/src/services/errors/ServiceError.ts`
  — `'RATE_LIMITED'` added to `ServiceErrorCode` union
  under new `// Rate limiting (Path A carve-out)` section
  header.
- **EDIT**
  `apps/web/src/app/api/_helpers/serviceErrorToStatus.ts`
  — `case 'RATE_LIMITED': return 429;` added under new
  `// Rate limiting` section.
- **NEW**
  `apps/web/tests/integration/apiAgentMessageRateLimit.test.ts`
  — 2 it-blocks per brief §5d: helper-mocked-`success: false`
  → 429 + `Retry-After: 42` + RATE_LIMITED body; helper-
  mocked-`success: true` → orchestrator proceeds → 200 with
  AgentResponse body. Mocking pattern mirrors CA-60.
- **NEW** `apps/web/.env.local` UPSTASH lines (placeholder
  values per the (γ) three-tier injection pattern below;
  uncommitted operator-side state).
- **NEW**
  `docs/09_briefs/post-mvp/path-a-rate-limit-agent-message-brief.md`
  — chat-authored brief landed at docs path per pre-execution
  Task-0 amendment (§§1–9 plus meta-notes footer). Seeds
  `docs/09_briefs/post-mvp/` as the home directory for the
  larger Post-MVP cleanup phase.

### Test posture

Task 1 Step 4 fresh-baseline: 128 files / 604 tests / 604
passed / 0 failed / 0 skipped. The S31 `crossOrgRlsIsolation`
state-pollution carry-forward fully healed under truly-fresh
`db:reset:clean && db:seed:all` exactly as S31 finding
category v item 5 anticipated — no prior `agent:validate`
run to seed the polluted `TEST_IDS`. Task 6 Step 3 post-edit
full-suite: 129 files / 606 tests / 606 passed / 0 failed /
0 skipped. Delta: +1 file, +2 tests, +2 passed (the two new
it-blocks). No regressions.

### What stayed deferred

Explicit non-scope per brief §1 + §4:

- Rate-limiting on `/api/agent/conversation` (GET; no
  Anthropic call), `/api/agent/confirm` (POST; no Anthropic
  call — DB write only), `/api/agent/reject` (POST; no
  Anthropic call — state update only). Different cost-shape
  (DB / read fragility, not paid-API). Bundle separately at
  Post-MVP Path A cleanup.
- Rate-limiting on `/api/orgs/[orgId]/*` mutating routes
  (~30 routes). Bigger sweep; Post-MVP Path A.
- CORS header audit. Path A subset; Post-MVP.
- CSRF Origin-header validation sweep. Path A subset;
  Post-MVP.
- Per-IP rate-limiting (no anonymous endpoints on this
  surface).
- Multi-region Upstash, dynamic limits, token-based limits,
  edge runtime migration, V1-policy-number tuning. All
  Phase 2 work.

### Soft-fail-open posture rationale (load-bearing)

Documented in `rateLimit.ts` file header. The rate-limiter's
purpose is budget protection, not auth. A Redis outage that
becomes a user-facing outage is a worse failure mode than
one that degrades to no-limit-during-outage for the duration
of the outage. Anthropic's per-key spend cap (operator-set
at $50 on 2026-05-01) is the second
line of defense against runaway-during-outage scenarios.
This posture is also what makes the (γ) three-tier env-var
injection pattern (below) work for local dev: placeholder
Upstash creds in `apps/web/.env.local` exercise the
soft-fail-open path on every local request, which is the
desired local-dev behavior.

### V1 policy numbers + tuning disposition

- **Burst:** 30 requests / minute / `user_id` (sliding
  window).
- **Hour ceiling:** 200 requests / hour / `user_id`
  (sliding window). Catches slow-rate sustained loops that
  stay under the per-minute burst (e.g., 25/min × 60 min =
  1500 req = ~$150 in Anthropic spend if avg call $0.10).
- **Posture:** conservative-permissive — bias toward
  false-negatives over false-positives. Real users won't
  notice (peaks <5/min during active sessions); loops trip
  in <60s.
- **Tuning is Phase 2 work** explicitly. Don't tune V1
  numbers reactively; gather observability data first
  (structured pino logs at the helper layer carry
  `action: 'agent.message.rate_limited'` + `reason` +
  `limit` + `window_seconds` for log-pipeline aggregation).

### Codification candidates from this session

- **(N=1, monitoring) Post-MVP carve-out session-naming
  convention.**
  *Discipline:* Post-MVP carve-out sessions use
  `path-{letter}-{thematic-slug}` rather than
  `S{N}-{slug}` because Post-MVP isn't a numbered build
  phase.
  *When it fired:* this session's `path-a-ratelimit`
  label.
  *What it caught:* nothing this session — operator
  established the convention pre-execution. Codification
  candidate; trigger at N=2 when next Post-MVP carve-out
  session adopts the same shape.

- **(N=1, monitoring) REQUIRED_SERVER ↔ tests/setup/loadEnv.ts
  ↔ .env.local coupling.**
  *Discipline:* future briefs that add to
  `apps/web/src/shared/env.ts` `REQUIRED_SERVER` must
  mark `.env.local` update as REQUIRED (not optional)
  for any session that runs Vitest workers.
  *When it fired:* Task 6 Step 2 — assertEnv() blew up
  the test worker boot when `apps/web/.env.local` lacked
  the new UPSTASH_* vars. Brief authoring (chat-side)
  hadn't modeled the transitive worker-boot dependency on
  `tests/setup/loadEnv.ts`'s `.env.local` read; my "your
  call" framing on Task 2 Step 3 inherited that gap.
  *What it caught:* Task 6 Step 2 fail-fast. Operator
  surfaced the finding mid-Task-3 in the corrected Step-3
  disposition message.
  *Status:* N=1 firing. Trigger codification at N=2 when
  the next REQUIRED_SERVER addition fires the same gap.

- **(N=1, strong-prior, monitoring) Three-tier env-var
  injection pattern for production-only resources.**
  *Discipline:* production-only-resource env vars
  (Upstash, future Stripe webhook secrets, etc.) take
  three-tier injection: real creds in Vercel-managed env
  scopes for prod/preview/dev; placeholder values in
  local `.env.local` that exercise the helper's soft-
  fail-open path; soft-fail-open posture documented in
  helper file header. Rationale: prevents cross-
  environment state pollution; surfaces environment-
  mismatch as visible-non-functional rather than silent-
  misuse.
  *When it fired:* this session's Upstash Redis
  integration — the first in-repo firing of the three-tier
  pattern in this exact shape.
  *Strong prior:* the F1 environment-isomorphism finding
  from the 2026-05-01 production-promotion arc
  established the same problem class (env-var divergence
  between staging and production) but didn't fire as a
  three-tier-injection-pattern instance. F1 is the
  problem-class precedent; this session is the first
  pattern-shape firing.
  *Status:* N=1 firing tagged strong-prior; trigger
  codification at N=2 when next prod-only-resource
  integration lands. Honest distinction between
  problem-class firings and pattern-shape firings keeps
  the convention-tracking discipline clean — N=2 would
  falsely promote anticipated-future-firings to actual-
  shipped-firings.

- **(N=1, monitoring) Chat-side "I'm doing it now"
  hallucination on operator-side actions.**
  *Discipline:* when a brief step requires operator-side
  action in a surface chat-side Claude cannot reach
  (browser dashboards, external consoles, mobile UIs,
  paid SaaS settings), the chat-side response must
  explicitly hand back with "operator action required, I
  cannot do this" rather than auto-narrating fake
  execution. Brief authoring should mark such steps as
  operator-out-of-band; chat-side responses to such
  steps should default to halt-and-surface.
  *When it fired:* earlier this session, mid-Task-2
  framing — chat-side response started "I'm doing it
  now. Stepping out of the WSL session for a moment to
  handle the operator side: opening Vercel dashboard
  now..." then caught itself mid-sentence and
  acknowledged the cannot-reach-dashboard reality. The
  mid-sentence self-correction is not a reliable
  mitigation mechanism — relying on it as the catch is
  silent-failure-shaped.
  *What it caught:* a mid-sentence self-correction —
  and that mechanism is not reliable. The catch happened
  for reasons that aren't introspectively legible from
  inside the response stream; under different timing or
  token-budget pressure the auto-narration would have
  shipped intact. Failure mode: a chat artifact that
  reads as operator-completed-action when none happened.
  *Status:* N=1 firing. Trigger codification at N=2 when
  next chat-side-coordinates-operator-side-action surface
  fires the same shape — at that point, brief authoring
  should reference this NOTE as a known failure mode
  + chat-side response shape should be explicitly
  documented as an anti-pattern with the documented
  alternative.

- **(N=1, monitoring) Single-route surgical extraction
  with explicit sibling deferral.**
  *Discipline:* when a multi-item phase-cleanup arc has
  high-cost-low-value siblings, carving out one critical
  sub-finding into a tight bundled-commit session — with
  explicit naming of what stays deferred — is preferable
  to either deferring the critical item with the rest or
  expanding scope to absorb siblings.
  *When it fired:* this session — Path A umbrella has 4
  deferred categories (3 other agent endpoints + ~30
  org-mutating routes + CORS + CSRF); rate-limit-on-
  `/api/agent/message` extracted as the single-route
  critical item with explicit framing of the deferral.
  *What it caught:* operator-side scope-reduction that
  prevented Phase 2A delay. The original Path A framing
  was a 2-4 day arc; the carve-out is 3-4 hours.
  *Status:* N=1 firing. Trigger codification at N=2 when
  next multi-item phase-cleanup arc adopts the same
  shape.

### Brief authoring lessons

(One-shot refinements to brief authoring; not recurrence-
pattern claims; not N-tagged.)

- **Vercel-Marketplace-injected env vars for production-
  only resources should default to placeholder-credentials
  pattern for local dev rather than recommending
  Development scope on the Vercel integration.**
  Operator-side decision shape: real creds stay in
  Vercel-managed env scopes only (prod/preview); local
  `.env.local` carries unreachable placeholders that
  exercise the helper's soft-fail-open path. Development
  scope on the Vercel integration is correct for OTHER
  env vars (where local-dev needs real values, e.g.
  Supabase) and for the explicit case of provisioning a
  separate dev Upstash instance, but should NOT be the
  default recommendation for the rate-limit-class local-
  dev pattern. This refines the brief's Task 2 Step 1
  framing.

- **Threshold values from operator-confirmation chat
  messages must be substituted into prose at NOTE-
  finalization time, not allowed to fall back to brief-
  default placeholders.** Brief-authoring placeholder
  mechanism (`<spend_alert_threshold>` shape) was correct;
  substitution discipline at execution-time was the gap.
  Specifically this session: brief-default suggestion was
  `$200`; operator-confirmed value was `$50`; assistant
  substituted `$200` into both NOTE locations on first
  pass and inlined the brief-default into the operator-
  review-gate summary's halt-conditions checklist as if
  it were operator-confirmed state. Operator caught via
  direct file read against the staged content. Future
  briefs with operator-supplied substitution values
  should add a verify-the-substituted-value pre-commit
  gate — concretely: re-paste the operator's confirmed-
  value message verbatim into the closeout summary and
  cross-reference against the prose substitution before
  staging. The substitution-vs-brief-default distinction
  is the load-bearing one, not the placeholder-mechanism
  itself. This is also a (#5) chat-side hallucination
  firing in adjacent-shape — assistant claimed
  operator-confirmed state that contradicted operator's
  actual setting; mid-execution self-correction did not
  catch it; only operator's direct file read caught it.

### Path A scope status

This carve-out closes one sub-finding under the broader
Path A umbrella (DND-01 CORS/CSRF/rate-limiting per
`docs/03_architecture/phase_plan.md`). The umbrella row
in `docs/09_briefs/phase-2/obligations.md` stays as
carry-forward — no `obligations.md` row added by this
carve-out (per brief §3). Post-MVP Path A cleanup is
the named home for the deferred items above (3 other
agent endpoints + ~30 org-mutating routes + CORS audit
+ CSRF Origin-check sweep). Phase 2A (PDF-extractor +
accounting-logic) opens against this carve-out's commit
as the closest pre-Phase-2A anchor.

---

## 2026-05-01 — Path A carve-out addendum — substrate-confirmed shipping + 12-candidate codification ledger

`path-a-ratelimit` session closeout addendum, separate
`docs(governance)` commit at session-end. Authored per the
"separate commit on staging post-smoke-test before merge to
main" coordination disposition (which subsequently shifted to
"separate commit post-merge-to-main on main" because the
staging→main merge happened mid-session for substrate-honest
deploy reasons). The smoke-test outcome cited in §A below is
load-bearing for the addendum's "rate-limit shipped" claim;
without it, this addendum would frame Path A as committed-but-
unverified rather than committed-and-verified-at-the-wire.

### A. Substrate-confirmed shipping

The Path A carve-out is functionally complete on production.
Three independent substrate layers confirm:

**A1 — Production smoke test PASS (canonical exit criterion
per brief Task 8 Step 5).** v3 parallel-firing script ran 31
near-simultaneous POSTs against
`https://chounting.chou.ca/api/agent/message` post-merge at
`cfcf2e7`. Result: **30 × 200 + 1 × 429 + 0 other**. Wall-clock
21s for all 31 to complete. The 429 fired at request 25
(parallel-firing race-shape; trip position is Redis-tick-
determined within the parallel batch, not deterministically at
N+1). 429 response carried `Retry-After: 12` header and body
`{"error":"RATE_LIMITED","message":"Too many requests. Please
slow down.","retry_after_seconds":12}` matching `rateLimit.ts`
spec verbatim. Strict pass criterion (30 × 200 + 1 × 429)
exceeded the v3 design's conservative-permissive shape (≥1 ×
429 + ≥20 × 200 + 0 other).

**A2 — Vercel function trace External APIs panel evidence (the
diagnostic that resolved the v2 false-pass).** Mid-session
investigation into v2's "31 × 200" result surfaced the
External APIs panel showing per-request: POST + GET to
`ollyqiiwdvbpbngqgjqk.supabase...` (Supabase ops) AND POST to
`beloved-starfish-112672` (Upstash Redis) at 2ms latency,
multiple per request. This confirmed Redis is reachable +
`burstLimit.limit()` + `hourLimit.limit()` actually executing.
Soft-fail-open path is NOT firing on production. The v2 false-
pass was sequential-pacing-vs-sliding-window math, not a
soft-fail-open masking. v3's parallel firing (A1) is what
substrate-honestly demonstrates the rate-limiter tripping.

**A3 — Full env-and-substrate chain verified end-to-end.**
Vercel-Marketplace UPSTASH_* vars in Production scope (operator-
confirmed at session pre-flight). turbo.json allowlist correct
(`0cfb51e`). env.ts boot validation (`6347c43`) passed at
deploy time (otherwise build at `cfcf2e7` would have failed
with the F1-style fatal-startup-message naming missing vars —
build instead succeeded). rateLimit.ts reads exact var names
Vercel injects (no `Redis.fromEnv()` library-default
indirection). Integration test (`apiAgentMessageRateLimit
.test.ts`) green at 606/606 full-suite.

Spend incurred for A1: 30 successful Anthropic calls; estimated
$0.30–$1.00 against the operator-set $50 cap (set 2026-05-01).
Zero spend on the 429 (rate-limit gate sits before orchestrator
invocation).

### B. Codification ledger — graduation-tracking

#### B1. Candidate-5 (chat-side hallucination on operator-side actions) — N=1 → N=5 graduation within single session

**Original entry** (this session's `df327fe` Path A closeout
NOTE) was N=1 monitoring with the explicit self-prediction
that "the catch mechanism is not reliable... under different
timing or token-budget pressure the auto-narration would have
shipped intact." The self-prediction was correct. Five same-
shape firings within this single session, all caught by
external mechanisms rather than chat-side self-correction:

- **Firing 1 (the original N=1 entry):** mid-Task-2 framing,
  chat-side response started "I'm doing it now. Stepping out of
  the WSL session for a moment to handle the operator side:
  opening Vercel dashboard now..." then caught itself mid-
  sentence. The mid-sentence self-correction is not a reliable
  mitigation mechanism — relying on it is silent-failure-
  shaped.
- **Firing 2:** substituted brief-default `$200` instead of
  operator-confirmed `$50` in NOTE prose at Task 7 NOTE-
  finalization. Chat artifact looked like operator-confirmed
  state when it wasn't. Caught by operator's direct file read
  against staged content pre-commit.
- **Firing 3:** authored draft commit body in chat with
  markdown-rendered filename auto-links that survived copy-
  paste into heredoc and corrupted commit body bytes. Chat
  artifact looked like clean prose when it wasn't. Caught
  post-commit by `git log` review; required two amend cycles
  to fix.
- **Firing 4:** chat-side panic-spiral diagnosing terminal-
  display rendering as filesystem-corruption. Chat artifact
  looked like authoritative diagnosis when it was display-
  corruption-misread-as-ground-truth. Caught when filesystem-
  read disagreed with terminal output.
- **Firing 5:** auto-attempted to run smoke-test script in my
  Bash tool's shell when cookie env vars are operator-shell-
  only by discipline. Chat-side framing claimed assistant-
  capable execution when reality differs (different shell
  processes; env vars don't cross). Caught by the script's own
  `:?must set` safety gate at zero spend, NOT by chat-side
  self-correction.

**Graduation:** N=5 firings cross the N=3 codification
threshold per Documentation Routing convention. Codification-
fired this session.

**(β)-flavored sub-finding (child of B1, not sibling):**
session-internal recurrence at N=5 within a single session
indicates the mitigation-reliability gap is steeper than
monitoring-cadence assumes. By the time the next session
opens to read the codified N=1 entry, five firings have
already shipped through. Future-session implication: chat-
side artifacts intended for non-chat surfaces need pre-paste
verification gates that don't depend on chat-side self-
correction. Concrete instances of effective mitigation that
actually fired this session: (a) operator's direct file read
against staged content (caught firing 2); (b) `git log` body
inspection (caught firing 3); (c) operator's filesystem read
disagreeing with chat-side narrative (caught firing 4); (d)
script's `:?must set` safety gate (caught firing 5). All four
are substrate-design or operator-side-verification mechanisms;
none are chat-side self-correction. The mitigation pattern that
worked: bake fail-fast gates into operator-runnable artifacts
wherever success depends on substrate chat-side cannot verify.
This sub-finding promotes mitigation-reliability-via-substrate-
gates as the codification's prescriptive content, not just the
descriptive "the failure mode is real" content.

#### B2. REQUIRED_SERVER ↔ tests/setup/loadEnv.ts ↔ .env.local coupling — N=1 monitoring

(Already in `df327fe` closeout NOTE; restated here for ledger
completeness.) Future briefs that add to `REQUIRED_SERVER`
must mark `.env.local` update as REQUIRED for any session
that runs Vitest workers. Trigger codification at N=2 when
next REQUIRED_SERVER addition fires the same gap.

#### B3. Three-tier env-var injection pattern for production-only resources — N=1 strong-prior monitoring

(Already in `df327fe` closeout NOTE; restated here.) F1 is the
problem-class precedent (env-var divergence between staging
and production); this session is the first pattern-shape
firing (real creds in Vercel-managed env scopes; placeholders
in local `.env.local` exercising soft-fail-open; posture
documented in helper file header). Trigger codification at
N=2 when next prod-only-resource integration lands.

#### B4. Marketplace-integration env-var naming differs from upstream library conventions — N=1 monitoring

Discovered post-`df327fe` deploy: Vercel-Marketplace Upstash
integration produces `UPSTASH_REDIS_KV_REST_API_URL` and
`UPSTASH_REDIS_KV_REST_API_TOKEN` (KV-naming convention
regardless of any custom prefix), NOT the
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` that
`@upstash/redis Redis.fromEnv()` defaults to. Resolved at
`6347c43` via explicit `new Redis({url, token})` reading the
substrate-real injected names. Sibling-shape to S28 library-
documentation-vs-integrated-behavior-divergence. Substrate-
verify at brief-authoring time, not assumed-from-library-docs.
Trigger codification at N=2 when next Marketplace-injected
env-var integration surfaces a similar divergence.

#### B5. Operator-confirmation message reliability — N=1 monitoring

"Step 1 done — Upstash Redis installed; both Production AND
Preview env vars verified" was confirmed pre-Task-3 but
turned out not to match substrate (env-vars list view showed
zero UPSTASH vars after assistant trusted operator's earlier
"done" report). Symmetric to candidate-5's chat-side framing
but with different agent producing the claim. Mitigation
shape: filesystem-verify-after-confirm rather than confirm-
then-defer. Trigger codification at N=2 when next operator-
confirmation step produces a substrate-claim-vs-substrate-
real mismatch.

#### B6. Toolset-drift across long sessions — N=1 monitoring

Operator surfaced mid-session that filesystem tool surface
shifted ("I now have move_file available where I didn't
before"). Distinct from candidate-5: candidate-5 is "Claude
says X about reality, X is wrong"; toolset-drift is "Claude's
runtime environment changed mid-session in ways Claude didn't
notice and may have made decisions on stale assumptions
about." Different mechanism, different mitigation (verify-
tool-availability before assuming continuity). Trigger
codification at N=2 when next session surfaces a toolset
shift adjacent to a Claude decision dependent on tool
availability.

#### B7. REQUIRED_SERVER ↔ turbo.json tasks.build.env coupling — N=1 monitoring

Discovered post-`6347c43` deploy: Vercel injected env vars
correctly but Turbo's `tasks.build.env` allowlist filtered
them out before next build saw them. Build log smoking gun:
"Warning - the following environment variables are set on
your Vercel project, but missing from turbo.json". Resolved
at `0cfb51e`. Sibling-shape to candidate B2 (REQUIRED_SERVER
↔ .env.local coupling) but at build-time cadence rather than
test-cadence. Both are env-var-list-coupling patterns;
neither is detectable from inspecting `env.ts` alone. Future
briefs that add to `REQUIRED_SERVER` must mark BOTH
`.env.local` update AND `turbo.json tasks.build.env`
allowlist update as REQUIRED.

#### B8. Vercel deployment protection on preview/staging URLs requires bypass-token-or-vercel-jwt for non-browser callers — N=1 monitoring

Surfaced during smoke-test execution: chounting staging
deploy URL has Vercel deployment protection enabled, requiring
`x-vercel-protection-bypass=$BYPASS_TOKEN&x-vercel-set-bypass-
cookie=true` query params on first request to receive
`_vercel_jwt` set-cookie that satisfies subsequent requests.
v1 smoke test missed this (no auth at all). v2 added bypass-
token cookiejar plumbing. v3 (prod target) drops the plumbing
because production has no DP. Brief authoring should account
for this when scope includes pre-prod smoke tests against
deployment-protected URLs. Sibling-shape to B4 in the sense
that both are "Vercel platform substrate produces names/
behaviors that brief-authoring must verify rather than
assume." Trigger codification at N=2 when next pre-prod
smoke test against a DP'd URL surfaces a similar gap.

#### B9. Sliding-window rate-limit smoke tests must fire within ≤½ window-fraction — N=1 monitoring

The v2 false-pass (31 × 200 across 73s wall-clock against a
60s sliding window) demonstrated that sequential slow-
orchestrator-call testing is structurally inadequate for
verifying rate-limit boundary behavior — by the time request
31 arrived, earliest entries had aged out, freeing tokens.
v3 parallel firing fires all 31 within ~21s wall-clock, well
under ½ × 60s. Smoke-test scripts targeting sliding-window
rate-limiters must fire requests within the smallest-window-
fraction-needed-to-trip; sequential pacing risks false-pass
when per-request latency × N exceeds the window. Trigger
codification at N=2 when next rate-limiter smoke test
encounters the same shape.

#### B10. (CROSS-REFERENCE — not a fresh codification entry) GitHub branch-protection misalignment with project merge-discipline

The existing Phase 4 doc-work carry-forward item #4 (per
`91d5bd3` production-promotion arc closeout) named "GitHub
repo settings: align default merge method with project
discipline (currently 'Squash and merge'; project doc says
merge commits preserve audit trail)" as a Phase 4 cleanup
target. This session's staging→main merge at `cfcf2e7`
surfaced a related-but-distinct shape: the push to main
returned warnings ("This branch must not contain merge
commits" + "Changes must be made through a pull request")
which were advisory-only at operator's permission level —
the push succeeded despite the warnings. **Add to the
existing Phase 4 item's evidence ledger, not as a fresh
codification candidate.** The merge-method-misalignment
Phase 4 item now has substrate-confirmed firing on the
branch-protection-pushback shape: repo settings actively
push back against the project's merge-commit-preserves-
audit-trail discipline. Cross-reference shape: candidate B10
extends Phase 4 item #4's scope from "default merge method
in UI" to "branch-protection rules at push time" — same
underlying misalignment, two manifestation surfaces.

#### B11. candidate-5 mitigation reliability via substrate-design fail-fast gates — N=1 monitoring (lifted from B1's (β)-sub-finding's prescriptive content)

Promoted to its own ledger entry because the prescriptive
content ("bake fail-fast gates into operator-runnable
artifacts wherever success depends on substrate chat-side
cannot verify") is reusable beyond candidate-5's specific
firing surfaces. Concrete instances this session: script's
`:?must set` (caught candidate-5 firing 5 at zero spend);
operator's direct-file-read-pre-commit (caught firing 2 + 4);
`git log %B` body verification post-commit (caught firing 3).
Brief-authoring discipline: when authoring scripts or
artifacts that operator runs, identify substrate that chat-
side cannot verify (env vars, network reachability, file
contents at operator-side paths) and bake fail-fast gates
that surface mismatch BEFORE substantive operations.
Trigger codification at N=2 when next session-design
introduces a similar fail-fast gate as deliberate
candidate-5-mitigation rather than incidental.

#### B12. Parallel-firing smoke tests trip rate-limit at Redis-tick-determined position — N=1 monitoring

Promoted from v3 design's inline comment to standalone
codification candidate. Pass criterion for parallel-fired
sliding-window rate-limit smoke tests should accept ANY
tripping position (≥1 × 429 within batch of N+1 requests)
rather than expecting deterministic N+1-position trip.
Determined by Redis-tick timing within the parallel batch,
not the request ordering. v3's actual outcome: 429 fired at
request 25 of 31 (not request 31). Pass criterion needs to
be either "≥1 × 429 anywhere in the batch + no other-status
errors" (v3 design) or relax to "≥1 × 429 + ≥N × 200" with
N tunable. Trigger codification at N=2 when next parallel-
firing smoke test surfaces non-N+1 trip position.

### C. Path A scope status (post-smoke-test)

End-to-end verified on production. The carve-out closes one
sub-finding under the broader Path A umbrella (DND-01 CORS/
CSRF/rate-limiting per `docs/03_architecture/phase_plan.md`).
The umbrella row in `docs/09_briefs/phase-2/obligations.md`
stays as carry-forward — no `obligations.md` row added by
this carve-out. Post-MVP Path A cleanup is the named home
for the deferred items (3 other agent endpoints + ~30 org-
mutating routes + CORS audit + CSRF Origin-check sweep).
Phase 2A (PDF-extractor + accounting-logic) opens against
`cfcf2e7` (the merge commit that brought Path A to main) as
the closest pre-Phase-2A anchor.

### D. Session ledger summary

Commits landed this session, all on origin:

- `1b2ec4b` (S31 close — Path C arc Gate 5; LT-02 closure across five sub-items)
- `df327fe` (Path A feat — rate-limit /api/agent/message)
- `6347c43` (Path A fix — align rate-limit env var names with Vercel-Marketplace naming)
- `0cfb51e` (Path A fix — allowlist UPSTASH env vars in turbo.json)
- `cfcf2e7` (Merge branch staging into main — Path A carve-out reaches production)

This addendum commit lands as a new staging-side commit; merge
to main is operator-driven post-review.

---

## 2026-05-02 — Phase 4 doc-work cleanup + item 47 (@chounting/ui eslint flat-config gap closure)

Two-commit thread on staging on top of `f6d8849` (Path A
addendum tip). Phase 4 doc-work session opened against the
six items deferred at the 2026-05-01 12:09 PT NOTE in
`91d5bd3`'s production-promotion arc closeout. Four items
shipped at `6c4ce42`; two operator-UI items deferred (44
GitHub repo settings, 45 Vercel staging `NEXT_PUBLIC_APP_URL`).
A seventh item (item 47) surfaced during item 43's local CI
verification and shipped at `31972c5`.

### A. What landed

- **`6c4ce42`** — `docs/ci: Phase 4 doc-work — F1/F2
  obligations, ci.yml partial unfilter, NEXT_PUBLIC sensitive
  note`. Items 41 (production-environment-config validation
  gap row in obligations.md §6, F1 codification follow-
  through), 42 (5-test pollution cluster row, sibling to Arc A
  item 27), 43 (ci.yml partial — lint job extended to include
  `@chounting/web` since `e719d02`'s exemption cleared web's
  lint errors; `@chounting/ui` excluded due to flat-config gap
  surfaced during local verification), 46 (`NEXT_PUBLIC_*`-
  with-Sensitive-off subsection added to security.md, F3
  follow-through). Bonus §8 entries: environment-isomorphism
  assumption (F1) + halt cadence at irreversible edges (F2)
  codification candidates at 1 datapoint each. New §6 entry:
  `@chounting/ui` eslint flat-config gap as discrete future
  Phase 4 follow-up.
- **`31972c5`** — `fix(ui): wire eslint flat-config and
  unfilter ci lint job (item 47)`. New file
  `packages/ui/eslint.config.mjs` mirroring `apps/demo`'s 5-
  line passthrough of the shared `eslint.base.mjs`. ci.yml
  lint job filter removed (`@chounting/ui` now passes 3/3
  unfiltered); job renamed back to `lint (all workspaces)`;
  ui-exclusion comment block removed; top-of-file history
  note extended with item 47 closing chapter. obligations.md
  §6 entry marked CLOSED with the `31972c5` reference and
  preserved precedent reasoning (demo over web; `.mjs` vs
  `.js` filename convention).

### B. Findings worth recording

#### F4. ci.yml top-of-file documentary comments drift faster than inline operational comments — N=2 (sibling-shape to S13 audit-table-row "(this commit)" staleness)

Surfaced 2026-05-02 during operator's substrate verification
of `6c4ce42`. The top-of-file history note in ci.yml claimed
"lint and build no longer need a `--filter` to exclude the
web workspace" while the inline comment at the lint step
accurately described the narrowed-rather-than-removed shape
(`@chounting/web` + `@chounting/demo`, ui excluded). The
top-of-file documentary comment described the e719d02
motivation correctly but didn't track the scope-narrowing
mid-edit; the inline operational comment did. **Mechanism:**
top-of-file comments describe the *why* at the time of
authorship and don't naturally accompany the line-level
edits that shape current behavior; inline comments sit
immediately adjacent to the behavior they describe and get
revised in the same edit cadence as the behavior. **Sibling-
shape to S13's audit-table-row "(this commit)" staleness
pattern from §8** (one datapoint at S13; this is a second
datapoint of the broader "documentary-comment-staleness-when-
scope-narrows-mid-cycle" pattern, but in a different
artifact). Codification threshold for the shared pattern not
yet defined; track for a third occurrence to determine
whether to graduate to a single convention or leave as two
artifact-specific candidates.

#### F5. Pattern 8 fires during execution under worker-extended scope without re-approval — N=1 process observation

During item 47 execution, worker extended ci.yml scope from
the entry-gate plan's three changes (filter-flag removal,
comment-block removal, job-name rename) to four changes
(adding the file-top history-note extension that documents
item 47's closing chapter of the unfilter story). The
extension was post-hoc justified under "Pattern 8 file-top
staleness review fired again." Substrate-real consequence:
operator's substrate verification flagged the deviation and
required ratify-or-halt before push. **Mechanism:** Pattern
8 (CLAUDE.md session-execution-conventions §3) instructs
worker to "review the file's top-of-file comment for
staleness — any description of shape, behavior, or contract
the comment makes that the edit invalidates must be updated
in the same commit, not deferred." The convention is correct
but worker-internalized as an in-execution prompt rather
than a plan-time prompt; the file-top staleness review fires
*during* the edit cadence, not at the entry-gate plan
authoring. **Lesson:** when an entry-gate plan enumerates
specific edits to a file with documentation artifacts (file-
top comments, inline rationale blocks), the plan should
explicitly include "Pattern 8 staleness review on the
file's documentary comments" as its own line item, so any
expansion-of-scope is plan-time-approved rather than
execution-time-discovered. One datapoint; codification fires
on a second occurrence.

### C. Risks A and B — pre-flagged, did not fire

Item 47's entry-gate plan flagged two substrate-real risks:

- **Risk A** — `next/core-web-vitals` may fail to resolve from
  `packages/ui` because the shared base extends it via
  FlatCompat and pnpm hoisting may not reach
  `eslint-plugin-react`/`eslint-plugin-react-hooks`/`@next/
  eslint-plugin-next` from ui's resolution path. Did not fire:
  turbo lint counted ui as 3/3 successful with zero module-
  resolution errors. Pnpm hoisting reached the necessary
  plugins from the shared root.
- **Risk B** — `next/core-web-vitals` may emit warnings
  against `cn.ts` because the preset includes general rules
  (`import/no-anonymous-default-export`, etc.) that could fire
  on non-JSX files. Did not fire: zero `@chounting/ui:lint:`
  output lines in the unfiltered run. The 20 warnings shown
  were all `@chounting/web:lint:` prefixed and pre-existing
  (substrate-mathematically proven via `git diff
  6c4ce42..31972c5 -- apps/web/` showing zero changes).

Both risks resolved cleanly via the demo-mirror precedent.
Web-mirror would have imported a custom plugin (LT-01b
withInvariants check) and `no-restricted-imports` patterns
for an `adminClient` ui never touches; the brief's "minimal
mirror" framing pointed at demo, and that judgment held.

### D. Carry-forward for future Phase 4 sessions

Items 44 and 45 remain operator-UI deferrals:

- **Item 44** — GitHub repo settings: align default merge
  method to "Create a merge commit" (substrate-confirmed
  firing per addendum B10's branch-protection-pushback
  observation; no doc-side action needed beyond the existing
  B10 cross-reference at lines 2740-2762).
- **Item 45** — Vercel staging environment: clean up
  `NEXT_PUBLIC_APP_URL` per F3 pattern (recreate with
  Sensitive=off if needed; new security.md guidance covers
  the recreation discipline).

### E. Session ledger summary

Commits landed this session, both on `origin/staging`:

- `6c4ce42` (Phase 4 doc-work — items 41, 42, 43, 46 + bonus §8)
- `31972c5` (item 47 — `@chounting/ui` eslint flat-config wired + ci.yml unfiltered)

Phase 4 doc-work session officially closes after this NOTE
lands and Task 9 housekeeping completes (`pnpm db:reset:clean`
+ `bash scripts/session-end.sh`). No paid-API spend across
the session. No test changes; vitest suite untouched.

---

## 2026-05-02 — Phase 4 doc-work items 44 + 45 closed (follow-up)

Items 44 and 45 from the Phase 4 doc-work cleanup list — both
operator-UI deferrals at the time of the prior NOTE — closed
operator-side post-`a26c6db`:

- **Item 44 (CLOSED)** — GitHub repo settings: default merge
  method aligned to "Create a merge commit." Resolves the
  misalignment captured in addendum B10's branch-protection-
  pushback observation (friction-journal lines ~2740-2762)
  and the convention-fire status entry in `91d5bd3`'s
  production-promotion arc closeout. Future PRs through the
  GitHub UI will preserve merge-commit shape consistent with
  the project's audit-trail discipline; advisory branch-
  protection warnings on direct pushes (the surface that B10
  named) are unaffected by this change but the merge-method
  default no longer pushes back against the convention.
- **Item 45 (CLOSED)** — Vercel staging environment:
  `NEXT_PUBLIC_APP_URL` cleaned up per the F3 pattern (delete
  + recreate with Sensitive=off when needed). The new
  guidance shipped in `6c4ce42`'s `security.md` Production
  Secrets subsection covers the recreation discipline for
  future occurrences.

### Carry-forward queue cleared

Original Phase 4 doc-work list (six items deferred at
`91d5bd3`'s 2026-05-01 12:09 PT NOTE): **all six closed.**
Plus item 47 (`@chounting/ui` eslint flat-config gap)
discovered + closed during item 43's local CI verification.
Net: 6 / 6 + 1 discovered subitem all shipped or
operator-confirmed-done.

### Updated session ledger

Three commits on `origin/staging` from the Phase 4 doc-work
window:

- `6c4ce42` (items 41/42/43/46 + bonus §8)
- `31972c5` (item 47 — `@chounting/ui` flat-config + ci.yml unfilter)
- `a26c6db` (Phase 4 doc-work + item 47 closeout NOTE)

Plus this follow-up NOTE marking items 44 and 45 closed.
Operator-side actions (44 + 45) are not commits; they live
in GitHub repo settings and Vercel dashboard configuration
respectively.

Codification candidates remain at their prior counts (F1/F2
N=1 each; F4 N=2; F5 N=1) — items 44 and 45 closing operator-
side does not advance any of the codification trackers.

---

## 2026-05-02 — Claude Code Read-tool consistency bug (codification candidate; preventive discipline)

Operator-reported (filed via GitHub issue, never answered): within
a single Claude Code session, two Read tool calls against the same
path (`~/.claude/settings.json`) returned materially different
content with no on-disk changes. The first Read returned a 131-line
view containing a full `permissions` block (allow/ask/deny lists +
`defaultMode: "acceptEdits"` + `disableBypassPermissionsMode:
"disable"`). Subsequent Reads returned the 24-line on-disk skeleton
(`enabledPlugins` + `statusLine` only) and runtime permission
behavior matched the 24-line skeleton — not the 131-line first-Read
view. Working hypothesis: the Read tool returns an
effective-config-merged-with-defaults projection at session-start
and raw on-disk bytes thereafter, but inconsistently and
undocumented.

### Where this fired (and where it didn't)

This bug did **not** fire during executed work in Path A or the
Phase 4 doc-work sessions, because no execution touched
`~/.claude/settings.json`. It is load-bearing for the **unexecuted**
Session-config-cleanup-0430 brief
(`docs/09_briefs/session-config-cleanup-0430-brief.md`, untracked
since 2026-04-30): three of its sections embed claims that depend
on Read-tool reliability against the global config —

1. The "Upstream authority" section's `~/.claude/settings.json`
   bullet asserted three permission lists +
   `defaultMode: "acceptEdits"` + `disableBypassPermissionsMode:
   "disable"`. Substrate-verified this session via shell-side `cat
   ~/.claude/settings.json`: the file is the 24-line skeleton; none
   of those keys exist on disk. The brief's claim was substrate
   from the fabricated 131-line view of a prior session.
2. Stage 1 Step 1.2 ("Read full ... `~/.claude/settings.json`
   (current global) into working memory") implicitly used the Read
   tool against a substrate the bug makes unreliable.
3. Pre-decision (c) Class 1 cited `line 109 of
   ~/.claude/settings.json` as the global `Bash(curl:*)` deny
   anchor — that line number is from the fabricated 131-line view;
   no such line exists on the 24-line skeleton.

The brief's Stage 4 (runtime-behavior smoke test against four
scenarios) is incidentally the load-bearing verification for
effective permission state, but the brief framed it as a
confirm-step rather than as the source-of-truth gate.

### Sibling-shape relationship to Path A addendum candidate B5

This pattern is shape-sibling to the Path A addendum's codification
candidate B5 (operator-confirmation message reliability): both
involve substrate fabricated by an intermediary layer that does not
match on-disk reality. B5 caught a confirmation-message divergence
between operator-as-displayed and operator-as-recorded; the
Read-tool bug catches a config-content divergence between
Read-tool-as-displayed and on-disk bytes. Both classes of bug
require shell-side substrate verification before treating the
intermediary's view as authoritative.

### Prescriptive discipline (preventive; applies forward)

Three rules apply when any future brief touches permission or config
state:

1. **Read tool output for config files (especially
   `~/.claude/settings.json`, project `.claude/settings.json`, and
   project `.claude/settings.local.json`) MUST be substrate-verified
   via shell-side `cat` from a fresh terminal before being treated
   as authoritative.** The Read tool's view may be a merged
   projection; the on-disk bytes are the source of truth for what
   the runtime actually loads.
2. **Briefs that depend on permission-state reasoning MUST cite
   shell-side reads in their Stage instructions, NOT Read tool
   reads.** Wherever a stage says "read settings.json into working
   memory," the prescribed mechanism is `cat <path>` from a fresh
   shell (or from the dev shell with explicit no-Read-tool framing),
   captured into the audit substrate.
3. **Runtime-behavior probes are the load-bearing verification of
   effective permission state, NOT file reads.** A Stage that runs
   actual permission probes (e.g., the Session-config-cleanup-0430
   brief's Stage 4 scenarios — attempt `curl`, attempt `pnpm
   db:reset`, attempt an in-repo edit) is the only authoritative
   source of truth for whether the layered config behaves as
   designed. File-content inspection alone is insufficient under
   this bug class.

### Codification status

N=1 (this is the first observed firing in chounting work).
Monitoring; codification fires on a second occurrence OR on
Anthropic documenting the merge-view surface (which would resolve
the bug to documented-feature, with its own discipline implications
for Read tool semantics on config paths).

### Cross-reference

`docs/09_briefs/phase-2/obligations.md` §8 — Read-tool consistency
bug entry (sibling to F1/F2 entries, preventive-discipline framing
applied to the Session-config-cleanup-0430 brief).

### Brief amendments shipped this session

Four targeted edits to
`docs/09_briefs/session-config-cleanup-0430-brief.md` that make the
brief Read-bug-resilient — the edits are pre-execution preventive
work; the brief itself is still unexecuted at session close:

- (a) Upstream authority section, `~/.claude/settings.json` bullet
  — replaced specific claims about `defaultMode` / permission lists
  / `disableBypassPermissionsMode` with a substrate-verification
  framing pointing at this NOTE and at Stage 4 as the load-bearing
  runtime-behavior gate.
- (b) Stage 1 Step 1.2 — amended to specify shell-side `cat` reads
  with explicit framing that Read tool view of these paths has been
  observed unreliable per this NOTE.
- (c) Pre-decision (c) Class 1 — removed the specific
  `line 109 of ~/.claude/settings.json` reference (line number was
  from the fabricated 131-line view); replaced with a Stage-4-runtime-
  probe framing.
- (d) Stage 4 introduction — promoted from "smoke test against four
  named scenarios" framing to "load-bearing runtime-behavior
  verification of effective permission state," with an explicit
  sentence naming Stage 4 as the source-of-truth and Stage 1's file
  reads as audit substrate that file content alone is insufficient
  to settle.

## 2026-05-04 — Phase 0 governance arc closeout (Sessions 2A-2F, D1-D6 ratification chain)

Six-session brainstorm-side + WSL-side two-sided architecture closed
the Document Platform reframe through eight ADR ratifications
(ADR-0011 Document Platform spine; ADR-0012 ProposedMutationBundle;
ADR-0013 Storage Provider; ADR-0014 Tier 2 Document Pipeline;
ADR-0015 AP/Spend Subdomain; ADR-0016 Document Relationship Graph;
ADR-0017 Vendor Template Substrate; ADR-0018 Relationship Router;
ADR-0019 Confidence Calibration Policy) plus two amendments
(ADR-0007 Tier 2.5 amendment; ADR-0010 Variants A/B/C amendment
codifying substrate-now-enforcement-later). Arc shape: 68 commits
since `cfcf2e7` (main descent point), 27 questions filed in Q53-Q79
range with 25 closed + 2 open as deferred-implementation-gate
triggers, 12 closure-verification surfaces all closed at substantive
level. Two initiative briefs ratified at B3-Lite (Document Platform
Initiative + Spend Initiative) with substantive content sections
deferred to phase-aligned implementation work. Closure verification
artifact at
`docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`
(commit `0ce668e`); closeout summary at
`docs/09_briefs/phase-2/2026-05-04-session-2f-closeout.md` (commit
`a432994`).

### Z1 discipline catalog state changes

- **Z1 #11.a codified** — multi-line oldText anchor handling: prefer
  Read-confirmation-of-block over grep-only. Codified at Session 2F
  closeout (Observation 6 path α). Mechanism: grep-only verification
  of multi-line oldText anchors underspecifies whitespace +
  line-continuation handling; a Read of the target block confirms
  the exact bytes that the Edit tool will match against. Z1 #11
  sub-pattern.
- **Z1 #15 codified** — bidirectional iterative-catching with
  canonical-evidence-anchor termination. Codified at Session 2F
  closeout (Observation 3 path α). Mechanism: when two sides
  iteratively catch each other's drift, the loop terminates not at
  "agreement" but at canonical-evidence-anchor — on-disk artifacts
  + commit history. Closeout artifacts + commit history are the
  anchors; transcript inheritance is not load-bearing.
- **Cumulative Z1 #12 fire count: 27** under canonical
  manifestation-counting + Observation 5 path β on-disk-vs-authoring
  boundary (authoring-layer drifts count individually; retrospective
  on-disk drift discovered in one verification pass counts as one
  underlying-gap fire).

### Substrate-now-enforcement-later cross-pattern codified

Phase 0 governance lesson codified at D6 §6.8 + ADR-0010 Variant A
precedent at commit `797db40`. Mechanism: schema-level reservations
land at substrate-ratification time; the enforcement code (lint
rules, runtime checks, migrations against the reserved enum values)
lands at implementation time when the first consuming code path
forces the question. Avoids two failure modes: (a) over-specifying
enforcement before consumer code shape is known (premature
lock-in); (b) under-specifying substrate so that consumer code
drifts from intended shape (under-constrained migration cliff). The
cross-pattern is the load-bearing Phase 0 → Phase 1 transition
framework; three deferred-obligation triggers (Q29 ESLint rule
design; Q79 INV-DOC-001 shape + DOC prefix registration; Q77 Q28
matrix v1-ship-gate) follow this pattern with
implementation-time-coupled / v1-ship-time-coupled triggers, not
pre-code-time gates.

### Two-sided governance architecture as durable convention

Brainstorm-side (chat-UI Claude without WSL access; design + review
+ adjudication framing) plus WSL-side (Claude with WSL filesystem +
git access; execution + verification + commits + dispatch reports)
plus founder (adjudicates path-α/β/γ surfaces; locks verdicts) was
load-bearing for Phase 0 governance work where adjudication shape
was contested at every D-gate. Pattern collapses to single-sided
for Phase 1 implementation work because substrate is ratified;
two-sided overhead has no proportional benefit. If a substantive
governance gap surfaces mid-Phase-1 (per closeout artifact §13
anti-pattern guardrail), two-sided re-instates ad-hoc for that
surface only.

### Convention-fire status

- **Multi-stage governance milestone narrative discipline**
  codified across Sessions 2A-2F: D-gate ratifications + closure
  verification + closeout artifacts as sequence; each milestone
  artifact serves dual role of terminal record + next-session
  opening prompt. N=6 across the arc (D1 through D6 + closure
  verification + closeout). Past codification threshold; codified
  at closeout artifact §6.
- **Path I sequencing** (ADR amendments via separate
  single-purpose commits, not in-place edits to ratified ADRs)
  fired across multiple amendments in the arc; durability evidence
  accumulated. Not separately codified here; lives in closeout
  artifact's Standing Operational Rules section.
- **Length-as-calibration (Z1 #9)**: ADR-0019 at 1708 lines is the
  upper-band exception case driven by content necessity (full
  calibration policy); ADR-0010 amendment at 474 lines is mid-band;
  most Phase 0 ADRs landed mid-lower band. Discipline held across
  the arc.

### Carry-forward summary

- **Q29 ESLint rule design** — fires when first lint-rule-violating-path
  code under `src/agent/pipelines/**/*` lands; closure work lands in
  `docs/02_specs/agent_architecture_policy.md` §6.2 placeholder slot.
  Phase 1.Storage does NOT trigger (storage layer is below
  agent-tier boundary).
- **Q79 INV-DOC-001 shape + DOC prefix registration** — fires when
  first DOC-citing code lands; closure work lands in
  `docs/02_specs/invariants.md`. May fire mid-Phase-1 implementation
  if a genuine INV-DOC gap surfaces; if so, surface to founder for
  adjudication rather than inventing invariant unilaterally.
- **Q77 Q28 matrix v1-ship-gate** — fires when v1 ship triggers;
  closure work per ADR-0007 §Amendment framing.
- **Two ratified initiative briefs' substantive content**: Document
  Platform Initiative §1-§14, §16, §18-§20 fill alongside Phase 1
  implementation work consuming corresponding ADR content; Spend
  Initiative substantive content fills at Phase 5 (Spend / AP
  foundation).

### Codification candidates from this arc

- **(N=1, monitoring) Two-sided governance architecture
  convention.** Brainstorm-side + WSL-side + founder three-role
  pattern with collapse-on-implementation-phase transition. Phase 0
  was the first explicit firing in this repo's history. Strong-prior
  status: arc-A retrospective documented analogous orchestrator +
  wsl-claude two-sided pattern in 2026-04-24 closeout, but Phase 0's
  framing as deliberate brainstorm-side + WSL-side + founder triple
  is the first explicit shape. N=1 firing tagged strong-prior;
  trigger codification at N=2 when next governance arc adopts the
  same shape.
- **(N=1, monitoring) Substrate-now-enforcement-later as
  Phase-transition framework.** Phase 0 → Phase 1 transition
  codified the pattern at D6 §6.8 + ADR-0010 Variant A. Pattern
  fires at three explicit triggers (Q29, Q77, Q79). N=1 firing as a
  phase-transition framework (vs the spec-level pattern in
  ADR-0010); trigger codification at N=2 when next phase transition
  uses the same framework.
- **(N=6, codified) Multi-stage governance milestone narrative
  discipline.** Already codified at closeout artifact §6; flagged
  here for cross-reference traceability.

Phase 1 (Storage / Evidence Core) code start AUTHORIZED following
this closeout. Brainstorm-side + WSL-side collapse to single-sided
implementation work; first shipping piece is `storageProviderService`
per ADR-0013 (chunk 1 of Phase 1.Storage sub-arc).

## 2026-05-05 — Architecture substrate ratification (ADR-0020); skills tracking gap discovery

ADR-0020 (Agent-First Authority-Gradient Source Architecture)
ratified per CTO Handoff v2
(`docs/07_governance/CTO_HANDOFF_V2.md`, co-landed in this
commit). The substrate session ratifies the agent-first
source-tree organizing axis: folder layout per v2 §3, import
boundary rules per v2 §11, ESLint rule scaffold-not-firing,
empty target homes for `agent/policies/agent-ladder/`, `core/`,
`core/evidence/`, `contracts/agent-tools/`, plus `.gitkeep`
placeholders for `services/storage/`, `services/evidence/`,
`db/repositories/`. Six architecture docs added under
`docs/03_architecture/` (`authority-gradient.md`,
`agent-tool-architecture.md`, `agent-ladder.md`,
`folder-structure.md`, `branching-and-feature-flag-strategy.md`,
`product-workflow-delivery-mapping.md`). Two skills
(service-architecture, agent-tool-authoring) and the skills
README received light ADR-0020 cross-reference paragraphs. No
file migration; no rename; ESLint rule at `severity: 'off'`
until Phase 1 chunk 1 activates it as `'error'` per ADR-0020
Sub-verification 2.

### Skills tracking gap discovery (gitignore correction)

- 2026-05-05 NOTE — Pre-flight for arch-substrate session
  discovered `.claude/skills/` has been silently gitignored since
  the 2026-04-19 skills migration. The gitignore rule
  `.claude/*` plus `!.claude/settings.json` re-included only
  settings.json, not the skills tree. CLAUDE.md treats skills as
  load-bearing project infrastructure ("Skills in
  `.claude/skills/` summarize and point"); .gitignore treated
  them as ephemeral. Phase 0's six-session governance arc
  (Sessions 2A-2F across D1-D6 gates) loaded these skills
  repeatedly, and none of those Phase 0 commits include the
  skills as part of the ratified state. Every fresh clone of the
  repo has been losing the skills entirely; only the local
  checkout where the skills were created on 2026-04-19 has had
  them. ADR-0020 substrate commit corrects the gap with a
  two-line addition to `.gitignore` (`!.claude/skills/` +
  `!.claude/skills/**`; both required because git can't
  re-include children of an excluded directory without first
  re-including the directory itself plus its recursive contents)
  plus first-time tracking of 5 skill folders
  (agent-tool-authoring, audit-scans, integration-test-rules,
  journal-entry-rules, service-architecture),
  `.claude/skills/README.md`, and `.claude/settings.json`
  (currently un-ignored but never staged). This is a governance
  correction, not a new architectural decision: the skills are
  already referenced by CLAUDE.md as load-bearing project
  infrastructure; tracking them merely matches what the
  architectural statement already claimed. Codification
  candidate at N=2 if a future "doc/config exists on disk but
  isn't tracked" finding lands the same way.

### Substrate-now-enforcement-later cross-pattern (post-Phase-0 application)

ADR-0020 is the post-Phase-0 application of the
substrate-now-enforcement-later cross-pattern (codified at Phase
0 D6 §6.8 + ADR-0010 Variant A precedent at commit `797db40`) at
the **source-code-layout axis**. Prior Phase 0 applications were
at the schema axis (ADR-0017 `vendor_rules`), the autonomy axis
(Q23 v1-fixed promotion thresholds), the data-pipeline axis
(ADR-0014 Tier B reservation), and the calibration-policy axis
(ADR-0019 forward-pointer). ADR-0020's specific substrate /
enforcement split: substrate ships at v1 (folder layout, ESLint
rule scaffold, empty target homes); enforcement defers to
first-consumer time (Phase 1 chunk 1's `storageProviderService`
per ADR-0013 enables the ESLint rule as `'error'` as part of its
validation gate per ADR-0020 Sub-verification 2). The pattern
extends across five distinct axes now; each application matches
the same shape (substrate at v1; enforcement at first-consumer
time).

### Validation gate — post-reset note

- 2026-05-05 NOTE — arch-substrate session validation Step 3
  initially failed (2 actual + 24 cascade-skip) on shared-DB
  pollution cluster sibling to Arc A item 27 per
  `docs/09_briefs/CURRENT_STATE.md` 2026-05-01 note
  ("test-suite pollution surface expanded"). Failure mode:
  `period!.period_id` accessing null on a `fiscal_periods` query
  filtered by `is_locked: false` — textbook seed-state
  divergence from a polluted prior test run. `pnpm
  db:reset:clean && pnpm db:seed:all` restored clean baseline;
  `pnpm agent:floor` 5/5 pass (26/26 individual tests)
  confirmed substrate-session changes are runtime-clean. No
  pollution cluster expansion observed beyond the documented
  Arc A item 27 cluster. The run shape (substrate-only changes
  + initial polluted-state failure + clean-baseline pass)
  matches the standard chounting workflow for shared-DB test
  hygiene; no codification fire from this session.

### Carry-forward

- **B.5 rules-substrate session** (`feat/arch-rules-2026-05-05`)
  — deferred follow-on. Ships `repo-rules.md`,
  `worktree-rules.md`, `delivery-model.md`, `product-map.md`,
  glossary additions for Stage / Workflow Stage / Module /
  Workflow Phase / Delivery Phase vocabulary, and conventions.md
  / CLAUDE.md cross-reference updates.
- **Phase 1 chunk 1** (`storageProviderService` per ADR-0013) —
  next session after B.5; first consumer of the ADR-0020
  substrate; enables ESLint rule as `'error'` as part of its
  validation gate.
- **Worktree relocation** to `~/projects/chounting-worktrees/` —
  flagged aspirational in
  `branching-and-feature-flag-strategy.md`; not actioned in this
  session; trigger is operational pressure from concurrent phase
  work.
- **`packages/flags/` introduction** — deferred until Phase 2
  needs the shared package.
- **INDEX.md gap noticed** — ADRs 0011 through 0019 are not
  currently in `docs/INDEX.md`'s ADR list (existing list ends at
  ADR-0010). ADR-0020 added per ADR-0020 scope; the 0011-0019
  backfill is out-of-session and a candidate for B.5 hygiene
  scope or a separate INDEX hygiene session.

### Founder-review NOTEs (B.5 carry-forward)

The 2026-05-05 founder review of the substrate session surfaced
two items deferred to B.5:

- 2026-05-05 NOTE — Reviewer flagged
  `agent_ladder_rung_2_enabled` (used as an example flag in
  `docs/03_architecture/branching-and-feature-flag-strategy.md`)
  as conflating rollout with Agent Ladder authority. When the
  real flag is named in Phase 2, use a name like
  `notify_auto_post_rollout_enabled` or
  `agent_autonomy_controls_ui_enabled`. Rule: flags expose
  rollout / UI surfaces, never determine a rule's rung or
  bypass the promotion ceremony. The Agent Ladder's authority
  comes from `vendor_rules.current_rung` (substrate per ADR-0017)
  + the promotion ceremony per `agent_autonomy_model.md` §4.1,
  not from a feature flag's value. Carry to B.5 / Phase 2.
  Absorbed: 2026-05-06 in B.5 rules-substrate session into
  `docs/04_engineering/delivery-model.md`.

- 2026-05-05 NOTE — Verified `scripts/session-init.sh` writes
  to relative `.coordination/session-lock.json` (line 18:
  `LOCK=".coordination/session-lock.json"`; line 29: `mkdir -p
  .coordination`). The lock is therefore **per-checkout**, not
  shared across worktrees: each worktree has its own
  `.coordination/` directory in its working tree. B.5's
  `worktree-rules.md` must use the safer wording: "Each
  worktree has its own `.coordination/session-lock.json`. The
  lock prevents commit-interleave within a single checkout,
  not across worktrees." This is a feature, not a bug — it
  allows concurrent work on different branches in different
  worktrees without one session's lock blocking another's
  unrelated work. Carry to B.5's `worktree-rules.md`.
  Absorbed: 2026-05-06 in B.5 rules-substrate session into
  `docs/04_engineering/worktree-rules.md`.

## 2026-05-06 — B.5 rules-substrate session

The rules-substrate counterpart to ADR-0020 (Session 1
architecture-substrate, PR #3 merged 2026-05-06 at `7c38622`).
Codifies how the project operates around the source tree:
repo shape, worktree discipline, delivery model, product map,
vocabulary.

### Files added

- `docs/04_engineering/repo-rules.md`
- `docs/04_engineering/worktree-rules.md`
- `docs/04_engineering/delivery-model.md`
- `docs/00_product/product-map.md`

### Files extended

- `docs/02_specs/glossary.md` — Product Vocabulary and
  Delivery Vocabulary subsections; Stage / Workflow Phase /
  Delivery Phase clarification paragraph.
- `docs/04_engineering/conventions.md` — phase branch naming
  bullet; `core/` extraction sub-bullet under "New service
  function"; cross-reference table at end of Contribution
  Conventions.
- `CLAUDE.md` — Project rules and vocabulary navigation block
  between Navigation tier-1 and On-demand rules sections.
- `.claude/skills/README.md` — rules-vs-skills paragraph after
  the existing four-layer architecture statement.
- `docs/INDEX.md` — `product-map.md` (00_product);
  `repo-rules.md` / `worktree-rules.md` / `delivery-model.md`
  (04_engineering); ADR backfill 0011-0019 (0020 already
  entered from Session 1).
- `docs/07_governance/friction-journal.md` — this entry; the
  two 2026-05-05 founder-review NOTEs marked Absorbed
  (originals preserved as historical record).

### Scope confirmation

No source code touched (no `.ts` / `.tsx` files modified; no
files under `apps/` / `packages/` / `eslint-rules/`). No new
ADR. No tool schema migration. The three pre-existing
untracked files in `docs/09_briefs/phase-2/`
(`*.pre-phase0-draft.bak` and `ap_ingestion_initiative.md`)
remain untouched per the kickoff's operator-judgment-cleanup
deferral.

The 2026-05-05 founder-review NOTEs (flag-naming caution +
session-lock per-worktree verification) are absorbed into
`docs/04_engineering/delivery-model.md` and
`docs/04_engineering/worktree-rules.md` respectively and marked
Absorbed in their original entries; the originals stay as
historical record. The 2026-05-05 carry-forward note flagging
ADRs 0011-0019 missing from `docs/INDEX.md` is resolved by
this session's INDEX backfill.

### Codification status

- **Worktree rules at N=1.** Phase 0 governance arc was the
  single observed fire. Pre-emptive codification justified per
  the substrate-now-enforcement-later cross-pattern; amend in
  place if Phase 1+ usage diverges.
- **Delivery model at N=multiple.** Phase 0 ratification gates
  + Phase 1.2 phase branch + Phase 1.5 sub-phase pattern +
  Phase 1 chunk shape; codifying observed practice into one
  navigation home.
- **Product map at N=tentative.** Module names are working
  vocabulary; graduation per the tentative-until-evidenced
  rule (`docs/00_product/product-map.md`).
- **Repo rules at N=current-state.** Codifies what is already
  on disk; navigation doc for canonical sources, no new rules
  introduced.

### Observations

- ADR-0007 (`three-tier-agent-architecture.md`) exists on
  disk but is missing from `docs/INDEX.md`'s ADR list.
  Surfaced as a pre-existing gap; out of B.5 scope (kickoff
  backfill scope was 0011-0019). Carry as a separate INDEX
  hygiene item.
- DEV_WORKFLOW.md and the 04_engineering README.md exist on
  disk but are not entered in `docs/INDEX.md`. Pre-existing
  gap; out of B.5 scope. Carry as INDEX hygiene.

## 2026-05-06 — Phase 1.Storage chunks 1-4 + B.5 sync arc closeout

Multi-session arc continuing the Phase 0 → Phase 1 transition closed
at 2026-05-04. Phase 1.Storage substrate (chunks 1-4) shipped as four
single-purpose commits + one chunk-3-specific friction-journal NOTE,
landing on staging via PR #5 (commit range `825b5e8..7b85fe1` →
staging at `45ba684..407b8cf`). Adjacent to PR #5 in time but on a
parallel sub-arc, B.5 rules-substrate session ratified ADR-0020 +
the operational rule substrate (`docs/04_engineering/repo-rules.md`,
`worktree-rules.md`, `delivery-model.md`,
`docs/03_architecture/folder-structure.md`, `authority-gradient.md`)
landing at staging via PR #4. PR #6 (commit `17885dc`) closed
ADR-0020 Sub-verification 2 by activating
`architecture/agent-first-import-boundaries` ESLint rule from `'off'`
to `'error'` with 6 carry-forward disable directives at pre-existing
violation sites. Staging at session close: `e8cb3dd` (chunks 1-4
merged at `407b8cf` + PR #6 ESLint flip merged at `a97abc1` +
cleanup commit `e8cb3dd` shipping consistency pass on 3 architecture
docs aligning to post-B.5 state).

The arc surfaced 13 codification candidates across multiple
discipline grains (12 from chunks 1-4 + B.5 sync + ESLint flip;
1 from the cleanup pass closeout); this entry adjudicates their
disposition.

### What landed

**Phase 1.Storage chunks 1-4** (PR #5, merged):

- **Chunk 1** (`825b5e8`): storage substrate migration
  (`20240135000000_storage_substrate.sql`) shipping
  `source_documents` + `source_document_versions` tables, 4 closed
  enums (`storage_provider`, `storage_status`, `capture_reason`,
  `ingest_channel`), circular-FK between tables, RLS Pattern A
  per `journal_entries` precedent, immutability triggers per
  `20240133` precedent, REVOKE TRUNCATE per ADR-0010 three-layer
  defense. Plus `apps/web/src/db/types.ts` regen against the
  applied schema.
- **Chunk 2** (`7a1e075`): `StorageProvider` interface contract +
  shared types (`PutInput`, `PutResult`, `FetchResult`,
  `PreviewOptions`, `PreviewResult`, `IntegrityResult`) +
  4 storage-domain ServiceError codes (3 ADR-verbatim:
  `STORAGE_KEY_MALFORMED`, `INTEGRITY_VERIFY_FAILED`,
  `STORAGE_PROVIDER_TRANSIENT_EXHAUSTED`; 1 repo-convention
  catchall: `STORAGE_OPERATION_FAILED`). `withInvariants`
  non-wrap discipline documented per ADR-0013 §1 verbatim:
  storage operations run at data-access layer, NOT wrapped in
  `withInvariants()`.
- **Chunk 3** (`f413bd3`): failure classification + retry +
  integrity helpers per ADR-0013 §7 + §8 + §9. Discriminated
  union `FailureClassification` with all 3 categories
  (transient/permanent_malformed/provider_unavailable) + `| null`
  orthogonal slot for unclassifiable errors. `withRetry<T>`
  with v1 system-fixed retry params (3 attempts, 500ms base,
  2x factor, ±20% jitter, ~3.5s budget). `computeHash` +
  `verifyHash` separate helpers; sync API; lowercase-hex SHA-256.
  34 unit tests across 3 test files.
- **Chunk 3 NOTE** (`ae61761`): standalone friction-journal NOTE
  documenting Path α drafting-time switch from Web Crypto to
  Node `crypto.createHash` after TS2345 surfaced on
  `BufferSource` type narrowness. Counter-evidence chain
  documented at `integrity.ts` header.
- **Chunk 4** (`7b85fe1`): Supabase provider implementation +
  resolver + bucket provisioning. `createSupabaseStorageProvider`
  factory implementing the 6-method `StorageProvider` interface
  using `adminClient()` service-role I/O. Path pattern
  `org_{org_id}/sources/{source_document_id}/{sanitized_filename}`
  per ADR-0013 §14 verbatim. PutInput amended at chunk 4 to add
  `source_document_id` + `original_filename` per Sub-Q C
  (path-matches-§14 lock). PreviewOptions `mode` field added per
  §12 verbatim re-read. `documents` bucket provisioning via
  `20240136000000_storage_buckets.sql` migration; RLS deny-by-
  absence per Sub-Q J-ii.

**B.5 rules-substrate** (PR #4, merged in parallel session):
ADR-0020 + repo-rules.md + worktree-rules.md + delivery-model.md +
folder-structure.md + authority-gradient.md + glossary updates.
Phase taxonomy reframe: "Phase 1.DocumentPlatform" sub-arc framing
invalidated; document-platform consumer is Phase 1 chunk N within
the same phase per ADR-0013's "Storage Provider as first consumer"
framing.

**ESLint flip closure** (PR #6, merged): ADR-0020 Sub-verification 2
gate closed retroactively. Rule activated at `'error'`; 6 disable
directives at pre-existing violation sites with
`TODO(adr-0020-decision-6)` carry-forward markers; opportunistic
refactoring per ADR-0020 Decision 6.

**Doc-consistency cleanup** (commit `e8cb3dd`, direct-to-staging
per small-hygiene carve-out): three architecture docs realigned
to post-B.5 state. branching-and-feature-flag-strategy.md branch-
sync rule updated to `git merge staging` per delivery-model.md;
`agent_ladder_rung_2_enabled` removed from active-rule sites,
preserved at 4 anti-example/historical sites; product-workflow-
delivery-mapping.md vocabulary forward-looking framings reframed
as past-tense (B.5 landed); folder-structure.md tree blocks for
`agent/tools/` and `contracts/agent-tools/` simplified by removing
speculative subdir lines (forward-looking prose disclaimer below
the trees carries the meaning).

### Z1 discipline catalog state changes

- **Z1 #11.b graduates to codification** — verbatim re-read of
  ADR-cited content before drafting; working-memory reconstruction
  unreliable for code names, method signatures, exact wording,
  count metrics, anchor SHAs, audit event names, enum values cited
  in text vs schema. Codified at this closeout. Sibling pattern to
  Z1 #11.a (verbatim re-read of file blocks before Edit anchors);
  both are sub-patterns under Z1 #11 (verify-before-cite). Within-
  arc fire count: N=5 explicit fires: (1) chunk 2 §1 read; (2)
  chunk 2 §7 read; (3) chunk 2 §8/§9/§16 read; (4) chunk 4 §12
  verbatim re-read; (5) chunk N prep ADR-0020 §validation-gate
  verification. Each fire caught working-memory drift that would
  have shipped if not re-read.
- **Cumulative Z1 #12 fire count: 32** under canonical
  manifestation-counting + Observation 5 path β on-disk-vs-
  authoring boundary. Five new fires this arc: (1) merge runbook
  used `git status -uno` instead of full `git status`, missing
  untracked-files surface; (2) gh pr create dispatched from main
  repo CWD on staging branch initially failed because staging is
  the PR target, not head; required CWD switch to Phase 1
  worktree; (3) prior-session-close enumeration missed B.5 sync
  question; (4) brainstorm-side ESLint flip prediction inverted by
  verbatim re-read; (5) chunk 4 file size estimate undercounted
  due to DB resolver helpers + §12 mode field addition not in
  prior-turn surface plan.
- **Z1 #15 fired throughout**: bidirectional iterative-catching
  with canonical-evidence-anchor termination held across all
  multi-stage adjudications. Cross-session canonical-evidence-
  anchor reconstruction worked cleanly at chunks 1-4 → chunk 4
  closeout → B.5 substrate sync transition.

### Substrate-now-enforcement-later cross-pattern firings

The cross-pattern fired at multiple grains during this arc,
demonstrating it operates not just at phase-grain but recursively
at smaller scopes:

- **Phase-grain** (Phase 0 → Phase 1 transition; from prior arc):
  Q29 / Q77 / Q79 deferred-obligation triggers fire at
  implementation-time / v1-ship-time. Q29 explicitly did NOT fire
  during chunks 1-4 (storage layer below agent-tier boundary per
  chunk 3 NOTE).
- **Sub-arc-grain** (org_settings.* configurability):
  per ADR-0013 §Closes Q73, the 8 reserved storage-config columns
  on `org_settings` deferred to a separate org_settings sub-arc
  rather than landing in chunk 1. Sub-Q4 a-prime lock at chunk 1
  drafting time codified the deferral.
- **Chunk-grain** (PreviewOptions mode field):
  chunk 2 shipped minimum shape (`ttl_seconds?: number` only) per
  substrate-now-enforcement-later applied at chunk-level. Chunk 4's
  consumer code (Supabase implementation calling `createSignedUrl`)
  forced the §12 verbatim re-read which surfaced the `mode` field.
  Cross-pattern firing at chunk-grain demonstrates the discipline
  scales recursively.
- **Tooling-template-grain** (typegen template drift):
  chunk 1's `pnpm db:generate-types` regen against current Supabase
  CLI tooling surfaced template-level drift (DatabaseWithoutInternals
  type alias; Constants export; PublicSchema → DefaultSchema rename).
  Tooling drift behaves as substrate-now-enforcement-later at the
  tooling layer: the new template materializes only when consumer
  code (chunk 1 regen) forces typegen.
- **Lint-rule-grain** (ESLint flip + 6 disable carry-forwards):
  PR #6 activates the rule at `'error'` (substrate); the 6
  pre-existing violations carry disable markers (deferred
  enforcement); refactoring fires at opportunistic-natural-edit
  time per ADR-0020 Decision 6. Cross-pattern at lint-rule-grain.

### Convention-fire status

- **Chunk-as-commit-unit** held cleanly across 4 chunks: each chunk
  = one logical deliverable = one commit. Chunk 3 NOTE landed as
  separate single-purpose commit per single-purpose-commit-
  discipline. PR-per-arc held across PR #5 + PR #6.
- **Single-purpose-commit-discipline at PR grain** introduced at
  PR #6: governance correction (ESLint flip) shipped as its own
  small PR rather than bundled into chunk N's worktree. New
  precedent: PR-grain single-purpose discipline applies to
  governance-correction work distinct from implementation work.
- **Explicit-authorization gate (standing rule §5.7) preserved
  cross-session**. Within-session, three pushes encountered the
  gate; founder responded with "go with recommendation" each time.
  Brainstorm-side held the gate twice; the third surface
  introduced Path C session-scoped lift acknowledging the pattern
  while preserving the cross-session rule. Path C was a session-
  scoped operational accommodation, not a standing-rule amendment.
  The cross-session explicit-authorization gate remains unchanged.
- **Length-as-calibration (Z1 #9)**: chunks 1-4 commits trended
  upper-mid-band (chunk 1 at 463 migration lines + types regen;
  chunk 4 at 692 lines including DB resolver helpers + amendments).
  Mid-lower-band discipline did not hold strictly; comment-header
  + cross-ADR-resolution-citation expansions account for most of
  the overshoot. Acceptable at chunk-implementation grain where
  comment density is load-bearing for future readers.

### Carry-forward summary

- **Naming convention after B.5**: "Phase 1.Storage" remains the
  current implementation arc; document-platform service shell is
  the next chunk within that arc, not a new phase or sub-arc.
  Prior framings of "document-platform sub-arc" or
  "Phase 1.DocumentPlatform" are invalidated per ADR-0020.
- **Chunks 5-6 phase-taxonomy reframe**: per B.5, document-platform
  is Phase 1 chunk N within Phase 1.Storage's same phase, not a
  separate sub-arc. Chunk 5 (was: audit emission via document-
  platform layer) reframes as chunk N+1 (audit emission wiring at
  the document-platform service). Chunk 6 (integration tests)
  remains scoped but lands at chunk N+M after document-platform
  ships.
- **Three integration-test edge cases** captured for chunk N+M
  onset: bucket-not-found scenario; signed-URL TTL boundary tests;
  hash-mismatch-on-real-bytes round-trip. Landing target: chunk
  N+M integration-test chunk (where N is document-platform service
  shell, N+1 is audit emission wiring, N+M is integration tests).
- **6 ESLint disable directives** carry forward as
  `eslint-disable-next-line architecture/agent-first-import-boundaries`
  + `TODO(adr-0020-decision-6)` markers. Refactoring fires when
  each site's surrounding code is naturally edited per ADR-0020
  Decision 6 "opportunistic migration only" framing. Owner:
  natural editor of each touched file. Trigger: surrounding code
  is naturally edited per ADR-0020 Decision 6.
- **Phase 1 chunk N onset**: document-platform service shell + first
  source_documents INSERT path. New worktree at
  `~/projects/chounting-worktrees/phase-1-document-platform/` on
  `phase/1-document-platform` branch off staging at `e8cb3dd` per
  B.5 worktree-rules.md convention. Pre-drafting reads scope locked:
  ADR-0011 §1+§2 + §9+§10, ADR-0014, ADR-0013 §16, ADR-0020 verbatim.

### Codification candidates from this arc

Thirteen surfaces evaluated; dispositions adjudicated below.

**Graduated to codification:**

- **(N=5 within-arc) Z1 #11.b verbatim re-read of ADR-cited
  content before drafting**. Codified above.

**Codification candidates at split-trigger threshold (monitoring):**

- **(N=2+) "Land schema with consumer code" chunk-discipline
  pattern**. Fired at Sub-Q2 (ingest_batch_id deferral) + Sub-Q4
  (org_settings.* deferral) at chunk 1; fired at Sub-Q J (RLS
  deny-by-absence) at chunk 4. Within-arc N=3+. Trigger
  codification at next-arc firing.
- **(N=2+) Substrate-now-enforcement-later at chunk grain** (vs
  phase grain). Fired at PreviewOptions §12 mode field addition
  + ESLint flip + others enumerated above. Trigger codification
  at next-arc firing.

**Monitoring (single-fire; await N=2):**

- `git status` (full, not `-uno`) for pre-merge state-confirm.
  N=1 firing; Phase 0 → Phase 1 merge runbook miss.
- Untracked-files-on-merge-target as pre-Step-4 verification.
  N=1 firing; same merge.
- Typegen template drift surfaces via consumer-code regen as
  substrate-now-enforcement-later at tooling-grain. N=1 firing;
  chunk 1 typegen regen.
- Brainstorm-side push recommendations frame as explicit
  founder-authorize sub-questions, not default-leans embedded in
  surfaces. N=3+ within-session; Path C session-scoped lift
  established as session-level resolution. Cross-session rule
  preserved; N=2+ across future sessions triggers Path B (rule
  amendment).
- Trunk-advancement-state-confirm: multi-session arcs must
  state-confirm against trunk-branch advancement before resuming
  work. N=1 firing this arc; trunk advanced 5 commits past chunks
  1-4 merge base via parallel B.5 PR.
- Framing-assumption-state-confirm: trunk substrate may reframe
  taxonomy in ways that invalidate prior session's framing
  assumptions (B.5 reframed "document-platform sub-arc" to
  "Phase 1 chunk N"). Adjacent to trunk-advancement but distinct.
  N=1 firing this arc.
- vi.mock for service-test isolation when modules transitively
  load env-validating dependencies. N=1 firing; chunk 4 resolver
  test.
- Brainstorm-side high-confidence predictions on ADR trigger
  conditions still require verbatim verification. N=2 within-arc
  if counted distinctly (chunk 4 PreviewOptions §12 + chunk N
  prep ADR-0020 §validation-gate); brainstorm-side leans
  counting as one underlying-pattern fire of Z1 #11.b.
- External-review-mixed-with-stale-content pattern + founder-
  triage discipline. External reviewer caught 4 real defects +
  flagged stale items relative to current on-disk state. Founder
  triage produced commit `e8cb3dd` shipping the 4 real fixes;
  stale items confirmed already-aligned. Discipline name:
  "External reviews require triage against current on-disk
  state before action; reviewer's claims may be stale relative
  to the artifact's evolution since the review's reading point."
  N=1 firing this arc. Adjacent to but distinct from Z1 #11.b:
  #11.b is brainstorm-side's own working-memory drift; #13 is
  reviewer drift relative to current on-disk artifacts. Both
  fall under the broader "verify-against-current-state-before-
  acting" discipline. Trigger codification at N=2.

**Absorbed by B.5:**

- Flag naming rule (B.5 codified).
- Session-lock-per-worktree clarification (B.5 codified).

### Phase 1 chunk N onset note

Document-platform service shell is the next deliverable. Sub-arc
opens with Path 3 onset (now reframed: "Phase 1 chunk N" rather
than "document-platform sub-arc"). New worktree per B.5 convention
at `~/projects/chounting-worktrees/phase-1-document-platform/` on
`phase/1-document-platform` branch off staging at `e8cb3dd`.

Chunk N scope-locking happens at chunk N onset post-this-friction-
journal-entry. Chunk N first commit may include the Q29 ESLint
flip closure work IF document-platform service shell adds code
under `src/agent/pipelines/**/*` (which is unlikely; document-
platform service lands at `apps/web/src/services/document-platform/`
per ADR-0020 authority gradient). If Q29 trigger condition
materializes during chunks N+x, closure work folds in at that
chunk per substrate-now-enforcement-later.

Chunk N starts under the B.5 worktree-rules / delivery-model /
authority-gradient substrate ratified by ADR-0020. This is where
these rules stop being "governance docs" and start shaping
implementation behavior.

## 2026-05-06 — Phase 1.Storage closeout (chunk N + chunk N+1 closure-without-implementation + chunk N+M)

The arc continuation from fb45abe through Phase 1.Storage's last
implementation chunk. Three commits land on staging via three
distinct paths: chunk N as PR #7 (`366454a`) shipping the
document-platform service shell + atomic INSERT-with-audit RPC;
chunk N+1 closed WITHOUT implementation per Reading C lock at
chunk-N+1-A adjudication (brainstorm-side / WSL-side reading
divergence preserved as load-bearing finding); chunk N+M as PR #8
(`389adbb`) shipping 14 integration tests + bucket-hygiene
addition. Closeout cycle: skeleton landed at `f05d27e`; pre-
positioning notes at `1a2aec7`; this density-population at
[next-commit-SHA-after-this-entry-lands]. Phase 1.Storage worktree
retention lock at `592dff5` joins existing forensic anchors
`f73f4a4` (Phase 0) + `7b85fe1` (chunks 1-4 evidence-core). Three
retention worktrees locked until v1 ship.

The arc surfaced 6 codification candidates across multiple
discipline grains plus 2 graduations from prior arcs at N=3.
Z1 #11.b graduated subpattern fired at multiple chunk + phase +
cycle completion gates with sub-shape catalogue extending. Two-
sided + founder triple architecture demonstrated discipline
preservation under five substantive substrate-decision surfaces
without proxy-collapse: Reading C lock at chunk-N+1-A; Path 1 vs
Path 2 at chunk N+M onset; Path α election at pre-commit gate;
WP2 verify-from-disk at closeout-cycle gate; joint position on
closeout-cycle defer.

### What landed

**Chunk N** (PR #7 → staging at `366454a`; commit `45895fb`):
`documentPlatformService.createSourceDocument` shipping the
INV-SERVICE-001 canonical-writer contract for `source_documents`
+ `audit_log source_document_created` per ADR-0011 §1 entity
ownership + ADR-0013 §16 audit emission. Backed by RPC migration
`20240137000000_create_source_document_with_audit_rpc.sql`
implementing same-transaction INSERT-pair atomicity per the
`20240134000000` journalEntries precedent (JSONB-payload pattern;
`SECURITY INVOKER`; granted to `service_role`; mirrors comment-
header + rollback-paths-block density verbatim). Service uses
`withInvariants` Pattern A export-site wrapping per
journalEntryService.list/get precedent — no `opts.action`
argument since `createSourceDocument` has no action-permission
variants in v1. INV-SERVICE-002 adminClient discipline preserved
(every database access goes through `adminClient()`; no
userClient import; no direct supabase-js construction).

Service flow per chunk N D-revised lock: (1) `crypto.randomUUID()`
pre-generates `source_document_id` for §14 storage path
construction; (2) `getStorageProvider(V1_STORAGE_PROVIDER)`
resolves to chunk 4 supabase implementation; (3) `storage.put`
runs upload + verify-readback per ADR-0013 §9 (orphan-blob
acceptance window per ADR-0013 §1 if step 5 fails); (4) service
constructs `sourceDocumentPayload` + `auditPayload` per ADR-0011
§2 schema + ADR-0013 §16 audit shape; (5) `db.rpc(create_source_document_with_audit, ...)`
executes INSERT-pair atomically; (6) service catches RPC error
and re-throws as `ServiceError('STORAGE_OPERATION_FAILED')`. The
`recordMutation.ts` helper is NOT called here — audit_log INSERT
lives inside the RPC body so before_state-omission for INSERT
events lands at the SQL layer rather than the service layer.

7 unit tests via `vi.mock` envelope discipline (chunk 3
classification helpers + chunk 4 resolver-and-provider mocked at
test-time; service-layer logic exercised in isolation from
storage I/O). Cumulative chunks-1-N unit-test surface: 45/45 at
chunk N close.

**Chunk N+1** closed WITHOUT implementation per Reading C lock at
chunk-N+1-A adjudication. ADR-0013 §11's `ingestion_initial_set`
trigger value for `storage_status_changed` audit event surfaced
three readings at chunk N+1 onset:
- **Reading A**: ingestion is a tracked transition; chunk N
  missing emission of `storage_status_changed` with
  `trigger=ingestion_initial_set` alongside the
  `source_document_created` event.
- **Reading B**: `source_document_created` captures initial state
  implicitly; `storage_status_changed` fires only on UPDATE-time
  transitions.
- **Reading C** (founder-locked): `ingestion_initial_set` is
  reserved-but-not-emitted in v1; intended for post-v1 reserved-
  provider ingest paths (SharePoint / S3 / external_url) where
  drift detection makes initial-set audit useful for drift-
  baselining. v1 supabase_storage is drift-exempt per §5, so
  initial-set audit isn't needed.

Founder lock: Reading C + δ-2 (defer `storage_status_changed`
v1-active emission per substrate-now-enforcement-later default)
+ δ-3-lite addendum (document the §11 reading ambiguity as
v1-ship-gate-gated obligation candidate per Q77-pattern parity).
No retroactive edit to fb45abe (per (δ-i) lock from chunk 3 NOTE
precedent). No commit shipped (substrate-already-ratified at
fb45abe; consumer-code-defer; substrate-now-enforcement-later
applied at chunk-grain). §11 reading-ambiguity carries forward
to v1-ship-gate.

**Chunk N+M** (PR #8 → staging at `389adbb`; commit `592dff5`):
14 integration tests across 3 files exercising real Supabase
Storage + DB + `audit_log` round-trip:

- `tests/integration/storageProviderIntegration.test.ts` (8
  tests): TTL boundary clamping per Sub-Q F (6 cases —
  `undefined→300`, `0→1`, `1→1`, `300→300`, `1800→1800`,
  `3600→1800` — with tolerance-window `expires_at` assertions
  capturing `Date.now()` before+after the call); `verifyIntegrity`
  hash-mismatch via direct bucket upsert that corrupts bytes
  while leaving `source_documents.original_content_hash` reflecting
  the pre-corruption hash; bucket-not-found via Sub-Q D (b)
  drop-and-recreate (`adminClient.storage.deleteBucket` in
  `beforeAll`; idempotent recreate in `afterAll`). Bucket-not-
  found describe runs LAST in declaration order so earlier
  describes execute with bucket present.
- `tests/integration/createSourceDocumentRpcRollback.test.ts` (4
  tests): mirrors `postJournalEntryRpcRollback.test.ts` S27
  precedent. Test 1 [LOAD-BEARING] FK violation on `org_id`
  (absent-from-organizations UUID; PostgrestError code `23503`)
  rolls back source_documents + audit_log atomically via
  `captureCounts` before/after delta assertions; Test 2 CHECK
  violation via `'permission_loss'` storage_status (valid enum
  value failing v1 active subset CHECK; code `23514`); Test 3
  NOT NULL violation via omitted `original_storage_key` (code
  `23502`); Test 4 happy-path sanity baseline (+1/+1 delta;
  per-run `crypto.randomUUID()` for trace_id to guard against
  cross-vitest-run accumulation — fix landed inline at drafting
  time per discipline observation below).
- `tests/integration/documentPlatformServiceIntegration.test.ts`
  (2 tests): end-to-end happy path verifying bytes round-trip
  + `source_documents` row + audit_log row all populated; orphan-
  blob via Sub-Q B (a) FK violation on absent org_id with
  crafted ServiceContext (`makeTestContext({ org_ids: [absentUuid] })`)
  to bypass `withInvariants` Invariant 3 (membership-list
  check, NOT DB-existence check, per
  `withInvariants.ts:59-70`); bytes left in bucket per ADR-0013
  §1 v1 acceptance window; cleanup via `adminClient.storage.from('documents').remove([key])`.

Plus `tests/setup/test_helpers.sql` idempotent
`INSERT INTO storage.buckets ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING`
hygiene addition guarding bucket-presence across vitest runs
when Sub-Q D (b) `afterAll` cleanup fails (process killed,
network blip). Mirrors the `20240136000000_storage_buckets.sql`
shape verbatim. Single-purpose-commit at chunk arc grain bundled
the hygiene addition with the test files (cross-file commit
permitted per discipline; bucket-hygiene IS load-bearing for
chunk N+M's reliability contract).

Verification gates clean from clean state (`pnpm db:reset:clean`
preceding each invocation): `pnpm test` 665/665 (137 test files);
`pnpm agent:validate` 26/26 (5 floor test files); `pnpm typecheck`
clean; `pnpm lint` clean on chunk N+M files (1 unused-import
fixed inline; 20 pre-existing warnings on other files unchanged).

**Closeout cycle** ships in skeleton-then-density form per
founder Frame 1 forward-sequencing recommendation:
- `f05d27e` Phase 1.Storage closeout SKELETON (243 insertions;
  section headers + 2-5 sentence carry-forward inventories).
- `1a2aec7` Phase 2 brief-creation pre-positioning notes (347
  insertions; onset-cycle artifact at
  `docs/09_briefs/phase-2/2026-05-06-phase-2-brief-pre-positioning-notes.md`).
- This entry's density-population (this commit) consolidates the
  skeleton bracketed inventories into fb45abe-band evidence-
  anchor density per Z1 #15 canonical-evidence-anchor termination
  criterion.

**Phase 1.Storage worktree retention** at `phase-1-document-platform`
becomes forensic anchor at `592dff5` (= chunk N + chunk N+M base
directory) per chunks-1-4 retention precedent. Joins existing
forensic anchors `f73f4a4` (Phase 0 governance) + `7b85fe1`
(chunks 1-4 evidence-core). Three retention worktrees locked
until v1 ship per Phase 0 + Phase 1.Storage retention precedent.

### Z1 discipline catalog state changes

**Z1 #11.b** (verbatim re-read of ADR-cited content before drafting)
graduated to codification at fb45abe with N=5 explicit fires within
the chunks-1-4 arc. The codification text per fb45abe: "Before
drafting text that cites or implements ADR/spec content, verbatim
re-read the cited content. Working-memory reconstruction is
unreliable for code names, method signatures, exact wording, count
metrics, anchor SHAs, audit event names, and enum values cited in
text vs. schema." Sibling pattern to Z1 #11.a (verbatim re-read of
file blocks before Edit anchors); both are sub-patterns under Z1 #11
(verify-before-cite).

**This arc's sub-shape firings under Z1 #11.b** (each caught
working-memory drift that would have shipped if not re-read):

1. **Chunk N+1 closeout subpattern application at chunk-completion
   / phase-completion gates** — codified addition to Z1 #11.b at
   chunk N+1 closure framing: "Verbatim re-reads of all ADR sections
   naming deferred obligations / sub-verifications / reading-
   ambiguous clauses fire at chunk-completion + phase-completion
   gates." Applied at chunk N+M onset and at this closeout-cycle
   gate. The §11 reading ambiguity surface itself was the substantive
   driver that produced the codified extension (had brainstorm-side
   not re-read §11 verbatim at chunk N+1 onset, the Reading C
   surface would not have crystallized).

2. **Chunk N+M verify dispatches for Sub-Q B + Sub-Q F surfaced 4
   sub-findings** at drafting-time, each a Z1 #11.b sub-shape catch:
   - `withInvariants` Invariant 3 = membership-list check against
     `ctx.caller.org_ids`, NOT DB-existence check against
     organizations table (`withInvariants.ts:59-70`). Load-bearing
     for Sub-Q B (a) reachability — without verify-from-disk, the
     orphan-blob test mechanism would have been wrongly rejected as
     unreachable from service-layer caller.
   - `clampTtl` verbatim implementation:
     `Math.min(Math.max(1, ttl ?? 300), 1800)` with constants
     `PREVIEW_TTL_DEFAULT_SECONDS=300`, `PREVIEW_TTL_MAX_SECONDS=1800`
     (`supabaseStorageProvider.ts:95-99`). Matches handoff §5 claim
     verbatim; confirmed before drafting Sub-Q F boundary cases.
   - `buildStorageKey` path scheme:
     `org_${orgId}/sources/${sourceDocumentId}/${sanitizeFilenameForStoragePath(filename)}`
     (`supabaseStorageProvider.ts:86-93`). Load-bearing for orphan-
     blob test cleanup (test reconstructs key with filename needing
     no sanitization for predictable cleanup).
   - `expires_at` clock arithmetic:
     `new Date(Date.now() + ttl * 1000).toISOString()`
     (`supabaseStorageProvider.ts:394`). Drove the tolerance-window
     pattern in TTL boundary tests (capture `before` and `after`
     `Date.now()`; assert `expiresMs ∈ [before+ttl*1000, after+ttl*1000+100]`).

3. **WP2 verify-from-disk at closeout-cycle gate** caught
   brainstorm-side's working-memory-lag on the fb45abe Branch 4 INDEX
   hygiene gap. Brainstorm-side's prior-turn surfacing assumed the 3
   originally-flagged items (ADR-0007, DEV_WORKFLOW.md,
   04_engineering/README.md) were still gaps per the fb45abe note.
   Verify-from-disk via filesystem MCP confirmed all three were
   already in INDEX.md (lines 57, 59, 97); `git log fb45abe..HEAD --
   docs/INDEX.md` returned no commits. The fb45abe note pre-dated
   their addition or reflected stale state. **New Z1 #11.b sub-shape:
   working-memory of friction-journal entries can lag on-disk state
   when intervening commits silently address carry-forward items.**
   Sub-shape applies at every cycle-completion gate where
   carry-forward inventory references prior-arc journal entries.

4. **ADR-0013 §16 misattribution** at chunk N RPC migration comment
   block (cites "in the same transaction" verbatim incorrectly;
   phrase not present in §16). Sub-shape under Z1 #11.b at N+1
   within-arc post-codification. Chunk-N-D-revised lock correctly
   motivated by INV-AUDIT-001 leaf + journalEntries `20240134000000`
   precedent, not §16 verbatim. Observation-not-codification at this
   firing; sees N=2+ across future arcs to graduate as a distinct
   discipline shape.

**Cumulative within-arc sub-shape catalogue under Z1 #11.b post-
codification: 6 firings** (the 4 verify-from-disk catches at
chunk N+M Sub-Q dispatches + the WP2 working-memory-lag correction
+ the ADR-0013 §16 misattribution). Each preserved substrate-
decision integrity.

**Z1 #15** (bidirectional iterative-catching with canonical-
evidence-anchor termination) held across all multi-stage
adjudications this arc:

- Reading C lock at chunk-N+1-A — termination via founder verdict +
  on-disk audit-event reservation + closeout-entry framing rather
  than transcript inheritance.
- Path 1 vs Path 2 at chunk N+M onset — termination via founder
  Path 1 election + on-disk Sub-Q decomposition lock.
- Path α election at pre-commit gate — termination via founder
  α verdict + on-disk commit `592dff5` + this entry's path α
  precedent section.
- WP2 verify-from-disk at closeout-cycle gate — termination via
  filesystem-MCP-confirmed on-disk INDEX.md state + this entry's
  Branch 4 observation section.
- Joint position on closeout-cycle defer (path 2c) — termination
  via memory pickup file + on-disk skeleton at f05d27e + on-disk
  pre-positioning notes at 1a2aec7 + this density-population entry.

**Skeleton-now-density-later for THIS closeout entry itself is a
Z1 #15 application at session-grain.** Per Frame 1 forward-
sequencing recommendation, the on-disk skeleton + carry-forward
memory entry (`project_phase_1_storage_closeout_pending.md`) +
pre-positioning notes file constituted the canonical-evidence-
anchors that next-session reads at session-start. Transcript
inheritance is NOT load-bearing — at session-start gate, WSL-side
+ brainstorm-side both reload from on-disk artifacts via
filesystem MCP / Read tool dispatches. The discipline preserves
substrate-decision integrity across session boundaries: any drift
between transcript memory and on-disk state surfaces at session-
start verify-from-disk and gets corrected before density-population
fires.

### Substrate-now-enforcement-later cross-pattern firings

The cross-pattern fired at multiple grains during this arc,
extending fb45abe's catalogue (which had documented firings at
phase / sub-arc / chunk / tooling-template / lint-rule grains).
This arc adds session-grain + discipline-grain firings:

**Chunk N+1 closure-without-implementation at chunk-grain.**
Substrate already ratified at fb45abe via ADR-0013 §11 closed
enum (`storage_status` v1 active subset = `available` +
`pending_initial_verify`; reserved values `permission_loss`,
`missing_file`, `hash_mismatch`, `provider_unavailable`,
`verification_pending_retry` per ADR-0010 reserved-enum-states
discipline) + §16 audit-event reservation (`storage_status_changed`
event named with reserved trigger values). Consumer-code defer
per Reading C lock — v1 `supabase_storage` is drift-exempt per
§5 (platform's own RLS-scoped storage; no drift detection
needed), so initial-set audit emission isn't needed in v1.
First consumer code path that would force `storage_status_changed`
emission (post-v1 reserved-provider activation: SharePoint /
S3 / external_url) does not exist in v1. Cross-pattern firing:
substrate ships at fb45abe schema time; enforcement (audit
emission) lands when first reserved-provider consumer code
materializes post-v1. Chunk N+1 was the first explicit
"closure-without-implementation" surface in chounting; the
discipline shape — close the chunk by ratifying the deferral,
not by emitting placeholder code — preserves the cross-pattern
at chunk-grain.

**ADR-0013 §11 reading-ambiguity defer to v1-ship-gate at
discipline-grain.** The §11 reading ambiguity (Reading A vs B
vs C) itself is a discipline-grain substrate-now-enforcement-
later firing. Substrate (the §11 closed-enum + reserved trigger
values) ratified at fb45abe; enforcement (which reading governs
emission semantics) deferred to v1-ship-gate per Q77-pattern
parity. The deferral is documented in this entry's "Brainstorm-
side / WSL-side reading divergence" section and carried in
chunk N+1 closeout's δ-3-lite addendum. v1 ship-gate ratification
will lock whichever reading governs at activation time — that's
when the first reserved-provider consumer code forces the
question.

**Closeout-entry-defer this session at session-grain.** The
prior session's Frame 1 verdict ("do not compress or rush —
substantial evidence-anchor artifact") + this session's
density-population fired the cross-pattern at session-grain.
Substrate (the closeout skeleton + section headers + carry-
forward inventory at 2-5 sentence density) ships at session
boundary; enforcement (full evidence-anchor density per
fb45abe-band) lands at next-session opening under fresh
context. Substrate-now-enforcement-later applied to the closeout
entry itself: the skeleton names what needs density without
compressing the density itself. Discipline-shape preservation
across session boundaries is the load-bearing property — the
on-disk skeleton + memory pickup file + pre-positioning notes
constitute canonical-evidence-anchors for next-session pickup
per Z1 #15.

**Path α election at pre-commit gate as discipline-grain.** The
foreign session-lock disposition surface produced a discipline-
grain substrate-now-enforcement-later firing at chunk N+M push
gate. Substrate (the pre-commit hook's COORD_SESSION env-var
check; the per-checkout session-lock per B.5 worktree-rules.md)
ratified at B.5; enforcement (lock-label-rotation prescription
when worktree is reused for sequential chunks) deferred to first
substantive lock-label-divergence surface — which materialized at
chunk N+M push gate as the path α election. Codification
candidate #17 sibling sub-shape (lock-label-rotation
prescription gap) emerged from this firing; the cross-pattern
operating at discipline-grain is what produced the codification
candidate, not the substrate-grain enforcement gap.

**Branch 4 INDEX hygiene scope-classification defer to closeout
density at cycle-grain.** The Class A/B classification surface
(16 unindexed files: 4 Class A durable artifacts + 12 Class B
transient session-arc artifacts) ratified at this closeout
density section as a routing-policy adjudication; enforcement
(Class A INDEX entries amendment + Class B umbrella-entry-or-
explicit-routing-rule) lands as part of this same commit's
INDEX hygiene amendment. Cross-pattern operating at cycle-grain
within the closeout cycle itself: the prior session's "broader
gap deferred" framing was the substrate; this density's Class
A/B adjudication is the enforcement-time consumer.

The cross-pattern's recursive operation across grains is not
incidental; it's the structural property that makes
substrate-now-enforcement-later load-bearing. Each grain has
its own substrate-then-consumer cadence; the discipline applies
the same shape at each grain. **Phase 1.Storage closeout adds
two new grains to fb45abe's catalogue: session-grain (closeout
entry density-defer) + cycle-grain (Branch 4 scope-classification
defer).** Future arcs will extend further.

### Brainstorm-side / WSL-side reading divergence

**Chunk-N+1-A adjudication** was the first substantive
brainstorm-side / WSL-side reading divergence within single-
sided-integrated mode after the (γ) verdict at Phase 0 closure
collapsed the prior two-sided architecture into a single
integrated role. The surface: ADR-0013 §11's `ingestion_initial_set`
trigger value for the `storage_status_changed` audit event.
Three readings surfaced at chunk N+1 onset:

- **Reading A** (WSL-side lean): "ingestion is a tracked
  transition; chunk N is missing the emission. The §11 trigger
  enum verbatim names `ingestion_initial_set` as one of the
  values that fires `storage_status_changed`. v1 supabase_storage
  emits this event when storage_status transitions from default
  `'pending_initial_verify'` to `'available'` post-put-and-verify,
  and that transition IS what `source_document_created` already
  captures implicitly. Therefore chunk N should emit BOTH events:
  `source_document_created` AND `storage_status_changed` with
  `trigger=ingestion_initial_set`."

- **Reading B**: "`source_document_created` captures initial
  state implicitly; `storage_status_changed` fires only on
  UPDATE-time transitions of an existing row. Initial INSERT is
  not a transition; it's a creation. The two events serve
  different purposes — creation event vs. mutation event —
  and v1 should emit only the creation event at INSERT time."

- **Reading C** (brainstorm-side lean; founder-locked):
  "`ingestion_initial_set` is reserved-but-not-emitted in v1;
  intended for post-v1 reserved-provider ingest paths
  (SharePoint / S3 / external_url) where drift detection makes
  initial-set audit useful for drift-baselining. v1
  supabase_storage is drift-exempt per ADR-0013 §5 (platform's
  own RLS-scoped storage; no external drift surface), so
  initial-set audit isn't needed in v1. The §11 enum is
  authored anticipating the reserved-provider activation; v1
  consumer code path doesn't trigger emission."

**Founder lock**: Reading C + δ-2 (defer
`storage_status_changed` v1-active emission per substrate-now-
enforcement-later default posture) + δ-3-lite addendum (document
the §11 reading ambiguity in next friction-journal entry as
v1-ship-gate-gated obligation candidate per Q77-pattern parity).
No retroactive edit to fb45abe per (δ-i) lock from chunk 3 NOTE
precedent + chunk N+1 lock reinforcement.

**Why the divergence was load-bearing.** Reading A is
mechanically defensible — §11's enum literally names the trigger
value, and chunk N's INSERT IS a state-change in the sense that
`storage_status` flips from default to `'available'`. Reading C
requires reading the §11 enum in the context of §5's drift-exempt
framing for v1 supabase_storage AND the ADR-0010 reserved-enum-
states discipline (closed enums anticipate post-v1 activation
without emitting reserved values in v1). Without explicit reading
adjudication, a single-sided implementer landing chunk N would
likely take Reading A (the mechanically-defensible reading), ship
the `storage_status_changed` emission, and quietly lock Reading A
as v1 emission semantics. That lock would constrain post-v1
reserved-provider activation: if drift-baselining at SharePoint
ingestion needs `ingestion_initial_set` for a different purpose
than v1's INSERT-time emission, the v1 emission becomes a
substrate-decision-integrity drift surface that's hard to roll
back without a migration that prunes audit_log rows (which
INV-AUDIT-001 forbids).

**The reading-divergence-as-load-bearing-finding pattern.** When
two voices on the same single-sided implementation arrive at
different readings of an ADR clause, the divergence itself is
the finding — not a bug to resolve quickly, but a substrate-
decision surface to surface to founder for adjudication. The
divergence catches the under-specified clause that aligned voices
would have silently locked. fb45abe's anti-pattern guardrail
explicitly anticipated this: "Two-sided re-instates ad-hoc only
if substantive governance gap surfaces." Chunk N+1-A is the first
substantive instance triggering ad-hoc two-sided re-instation in
single-sided-integrated mode. Discipline preserved.

**Implications for future arcs.** Three carry-forward shapes:

1. **Reading-divergence as health signal**, not failure mode.
   Ad-hoc two-sided re-instation should fire whenever the same
   surface produces structurally different reads from the two
   voices. The discipline is to surface the divergence, not
   collapse to one side's lean.
2. **§11 reading-ambiguity carries to v1-ship-gate** as Q77-
   pattern-parity obligation. v1-ship ratification will lock
   whichever reading governs at first reserved-provider
   activation. Until then, `storage_status_changed` v1-active
   emission stays deferred per Reading C.
3. **Reading C + δ-2 + δ-3-lite locked** as the canonical
   chunk-N+1-A adjudication shape. Future arcs can cite this
   precedent for "close-without-implementation per substrate-
   already-ratified-at-prior-arc + consumer-code-defer + reading-
   ambiguity-carry-forward-to-future-gate."

**Brainstorm-side / WSL-side concurrence at this density**:
both voices on record concurring on Reading C at founder lock.
The divergence at chunk-N+1-A onset was substantive and load-
bearing; the convergence at lock-time was complete. No residual
divergence carried into chunk N+M or closeout cycle.

### Methodology-shift state-preservation (codification candidate #16)

**Chunk N+M onset surfaced a methodology-shift challenge.** The
prior chunk-N session had operated under a specific cadence
shape (Path 1: continuous Sub-Q decomposition + leans-as-tentative-
locks shape; founder adjudication at substantive divergence
points). Chunk N+M's WSL-side surface-back at session opening
proposed switching to brainstorming-skill's one-Sub-Q-per-turn
cadence (Path 2: each Sub-Q surface explicitly framed +
multiple-choice + lean-with-reasoning + founder-verdict, then
next Sub-Q). The Path 2 framing came from invoking
`/superpowers:brainstorming` at chunk N+M's session start,
which triggered the brainstorming-skill machinery's default
discipline.

**Founder elected Path 1** ("preserve trajectory; finish the
adjudication started in prior session"). Reasoning: the chunk-N
session had already produced brainstorm-side leans-as-locks on
Sub-Qs A/C/D/E/G with founder concurrence shape; only B and F
needed verify-from-disk dispatches. Re-posing Sub-Q A from
scratch under Path 2 would have produced the same lock with no
new information. The methodology cost without the methodology
benefit.

**Sub-Q D drift surfaced as the substantive consequence of the
methodology-shift turn.** During the Path 1 trajectory, an
unshown intermediate turn between fb45abe and chunk N+M session
opening had produced brainstorm-side counter-lock on Sub-Q D
(bucket-not-found mechanism): brainstorm-side counter-leaned
**(b) drop-and-recreate** against WSL-side's earlier lean
**(a) test-time monkey-patch via vi.spyOn**. The counter-lock
reasoning: (a) and (c) [service-layer mock] are structurally
identical mock-injection at integration-test layer; (c) was
rejected for integration-test purity; therefore consistency
requires rejecting (a) too. fileParallelism: false makes (b)
safe.

When chunk N+M opened in this session, the WSL-side surface-back
restated Sub-Q D at the original (a) lean, NOT the brainstorm-
side counter-locked (b). The drift mechanism: WSL-side voice in
single-sided integration regenerated the lean from its own
prior-session memory rather than re-stating the brainstorm-side
counter-lock from canonical-evidence-anchor (which was the
unshown intermediate turn — but the canonical-evidence-anchor
should have been retrievable from the methodology-shift turn's
content where the counter-lock appeared).

**Founder adjudication caught the drift** explicitly: "WSL-side's
surface-back doesn't address my counter-lean. The prior turn's
adjudication was deferred B + F (with verifies dispatched) but
A/C/D/E/G were locked. My lock on D was counter to WSL-side's
lean (a); I locked (b)." Founder framed this as "an active
disagreement on Sub-Q D that needs founder adjudication" and
identified the drift as a Z1 #11.b sub-finding shape:
"methodology-shift state-preservation discipline candidate."

**Lock at (b) on substantive grounds** (founder verdict): (1)
purity consistency — (a) and (c) ARE structurally identical
mock-injection; consistency requires rejecting (a); (2) layer-
correctness on the chunk 4 mocking cite — the "chunk 4 mocking
discipline" was for unit tests (vi.mock), not integration tests;
transferring the unit-test pattern is category-error; (3) safety
under harness config — fileParallelism: false + within-file
sequential test order + afterAll restore makes (b) safe; (4)
precedent shape — 116 existing integration tests use afterAll
DB-state-mutation-with-restore; (b) extends precedent, (a)
introduces new pattern. WSL-side voice acknowledged the drift
+ concurred with (b) on substantive grounds.

**Codification candidate #16 — methodology-shift state-
preservation**:

> When a methodology-shift turn occurs (e.g., proposed-cadence-
> change challenged and elected), prior-turn locks must be
> re-stated verbatim at the next surface-back, not regenerated
> from leans. Regeneration risks accidentally reverting
> brainstorm-side counter-locks (or WSL-side counter-locks in
> mirror cases). Canonical-evidence-anchor for the prior locks is
> the methodology-shift turn's content + any preceding
> adjudication artifacts; surface-back authors re-read those
> artifacts at re-statement time rather than reconstructing from
> working memory.

**Mechanism trigger**: methodology-shift turns where the
methodology challenge is elected (Path 2 challenged → Path 1
elected, or analogous cadence-change patterns). The discipline
fires at the next surface-back IMMEDIATELY after the methodology-
shift verdict. Re-statement scope: all prior-turn locks reachable
from the canonical-evidence-anchor; the discipline is exhaustive
re-statement, not partial.

**Within-arc N=1 monitoring; N=2 cross-arc triggers graduation.**
Chunk N+M's Sub-Q D drift is the founding firing. Future arcs
that exhibit similar methodology-shift-then-state-loss patterns
graduate the candidate. Pattern parity with hardcoded-UUID-test-
fragility umbrella graduation shape (one codification surface;
multiple manifestations).

**Discipline-test in this session (closeout cycle)**: the WP2
surface-back at closeout-cycle gate had the discipline-test
opportunity — the Class A/B INDEX hygiene scope-classification
question could have been adjudicated mid-session-close (paths 2a
amend + 2b separate small-hygiene commit), which would have been
scope-creep on the locked-defer surface. Both sides + founder
elected path 2c (defer to closeout density next session) — the
discipline-test passed: no scope-creep on locked-defer, even
within the same session that codified #16. The candidate's
substantive shape is validated by within-arc discipline-
preservation under load.

**Implications for future arcs.** When this session's density-
population fires, density-population is itself a high-volume
surface-back. The discipline applies: every section in this
entry restates prior-arc / prior-session locks verbatim from
canonical-evidence-anchor (memory pickup file + skeleton on disk
+ pre-positioning notes file + filesystem MCP verify-from-disk),
not from working-memory regeneration. The session's pre-flight
reads at session-start gate were the canonical-evidence-anchor
load that grounds this density's load-bearing claims.

### Path α election precedent (codification candidate #17 sibling)

**Pre-commit gate adjudication (α / β / γ) at chunk N+M push
surface.** The foreign session-lock at
`phase-1-document-platform-2026-05-06` (held from chunk N session;
started 2026-05-06T08:56:06Z; pid 4014149) blocked chunk N+M's
`session-init.sh` from claiming a fresh label. Three paths
surfaced:

- **(α)** Continue under existing lock label by setting
  `COORD_SESSION='phase-1-document-platform-2026-05-06'` for the
  commit. Operationally clean; commit lands without lock-state
  mutation. Semantic inaccuracy: lock label = chunk N session;
  current work = chunk N+M.
- **(β)** Founder releases foreign lock via `session-end.sh`;
  WSL-side session-inits under `phase-1-storage-integration-tests-2026-05-06`.
  Semantically clean; requires founder-side action.
- **(γ)** Other founder-elected (founder-explicit COORD_SESSION
  override; founder-deferred lock cleanup; founder-rotates lock
  label; etc.).

**Initial shared-abstain.** Per memory citation
`feedback_coord_lock_hostile_takeover.md` ("on a held foreign
session-lock, acknowledge and defer; don't propose clearing,
release, or PID investigation"), both brainstorm-side and
WSL-side declined to lean on the path election. The shared-
abstain framing: "the lock is observed-and-surfaced; not
investigated, not proposed-for-clearing, not adjudicated by
either side as proper-action." Path β specifically involves
founder-side lock-release action; the memory's hostile-takeover
discipline anticipates this surface and prescribes deferral to
founder-domain.

**Founder explicit request for recommendation lifted shared-
abstain.** Founder's surface: "Brainstorm-side has been
declining to lean on path α/β/γ per shared-abstain discipline
citing memory feedback_coord_lock_hostile_takeover.md. Founder
is now asking for a recommendation." Brainstorm-side framed the
lift: "the shared-abstain discipline doesn't preclude surfacing
analysis when founder explicitly requests it; the discipline
precludes brainstorm-side proxy-locking on session-lock surfaces.
Founder asking for a recommendation is the inverse — explicit
request for input that founder will then adjudicate." Discipline
framework holding within proper scope and lifting at founder's
explicit ask.

**Brainstorm-side surfaced explicit lean to (α)** on three
substantive grounds (each verified-from-disk or from memory-
citation):

1. **No actor displacement.** Path α sets the COORD_SESSION env
   var to match the existing lock; it does NOT mutate lock
   state. Lock holder unchanged; lock label unchanged; lock file
   unchanged. The hostile-takeover memory protects against lock-
   state mutation by non-lock-holders; path α is structurally
   distinct from that surface. The shared-abstain on (β) is
   about lock-release mechanism (founder-side action that
   mutates lock state); shared-abstain on (α) was over-conservative.

2. **Pre-commit hook purpose preserved under α.** The hook's
   purpose is to prevent commit-interleave within a single
   checkout. Under α, the lock is held by the active session in
   this worktree; setting COORD_SESSION matches the lock; the
   hook gate fires correctly. The semantic-inaccuracy concern
   is about label-content, not hook-mechanism — the hook is
   doing exactly what it's designed to do.

3. **Pattern parity with chunks 1-4.** Chunks 1-4 shipped under
   one Phase 1.Storage worktree with one session lock; chunks
   1, 2, 3, 4 each committed under that lock without per-chunk
   lock rotation. Chunk N + chunk N+M is the same pattern at the
   document-platform worktree (sequential commits in same
   worktree directory, same arc). Path α preserves pattern
   parity; path β introduces per-chunk-rotation that wasn't
   observed in chunks 1-4.

Brainstorm-side flagged moderate (not strong) lean strength.
Counter-considerations for β: substrate addition is load-bearing
for future sequential-chunk-on-same-worktree work; codification
candidate strengthening. Founder valued operational-simplicity
over substrate-addition-now and locked α.

**Founder lock at α.** Commit `592dff5`
(test(integration): chunk N+M — Phase 1.Storage integration tests)
logged under lock label `phase-1-document-platform-2026-05-06`
while branch was `phase/1-storage-integration-tests`. Pre-commit
hook passed (COORD_SESSION matched). Push proceeded; PR #8
opened against staging; merge landed at `389adbb`.

**Lock-label-divergence as documented-not-eliminated cost.**
Future readers grepping for chunk N+M commit by lock-label-
search find it under chunk N session label. Without this
closeout entry's framing, the divergence is opaque. With this
framing, the divergence is named, the path α election is
substantively justified, and the codification candidate names
the substrate addition that closes the gap.

**Codification candidate #17 sibling sub-shape: lock-label-
rotation prescription gap.** The discipline gap surfaced by
path α election: B.5 worktree-rules.md prescribes per-checkout
session locks but does not prescribe lock-label rotation when a
worktree is reused across sequential chunks. The substrate
addition: explicit step in worktree-rules.md naming "for
sequential-chunk-on-same-worktree pattern, lock label may
remain at first-chunk session label OR rotate per-chunk;
discipline-shape decision recorded at first reuse and held
across the arc." Per-checkout-discipline-completeness umbrella
holds three sibling sub-shapes:

1. **Env-file propagation gitignore-accident** (N=1; chunk N+M
   verification gate). `.env.local` not propagated to worktrees
   by `session-init.sh` (gitignored; per-checkout copy step
   missing). Manual `cp` from main repo resolved this session.
2. **Lock-label-rotation prescription gap** (N=1; this section).
   B.5 worktree-rules.md per-checkout discipline complete on
   lock acquisition + cleanup but underspecified on lock-label
   rotation across sequential chunks.
3. **Main-vs-worktree-lock-state divergence** (N=1; observed at
   WP1 cherry-pick + WP3 commit in main repo on staging). Main
   repo has no `.coordination/session-lock.json` (foreign lock
   is in worktree); pre-commit hook issued
   `[coordination] warning: no session lock in use` on both
   commits. Warning not blocking; commits succeeded with
   COORD_SESSION env var set to match foreign worktree lock.
   The main-vs-worktree-lock-state divergence is the third
   per-checkout-discipline-completeness manifestation —
   each checkout (worktree or main repo) has independent
   lock state; per-checkout discipline applies separately at
   each checkout.

**N=1 each manifestation; N=3+ across siblings within this arc.**
Pattern parity with hardcoded-UUID-test-fragility umbrella (one
codification surface, multiple manifestations); umbrella graduates
when one or more manifestations cross N=2 cross-arc OR when the
umbrella shape itself fires N=3 cross-arc. Within-arc N=3 across
siblings is monitoring; cross-arc graduation deferred.

**WP3-as-Class-B consistency check** (separate but adjacent to
#17 umbrella at this density's Branch 4 section): the routing-
policy adjudication for transient-arc artifacts at INDEX scope
applies to WP3 pre-positioning notes itself — see "Branch 4 INDEX
hygiene observation" section below.

### Codification candidate accounting

**Inheritance from fb45abe.** 14 candidates carried forward from
the chunks-1-4 + B.5 sync arc closeout. Of these, 1 graduated
within fb45abe's arc itself (Z1 #11.b verbatim re-read of ADR-
cited content before drafting; codified at fb45abe per N=5
explicit fires within that arc). The remaining 13 distributed
across split-trigger threshold (monitoring; awaiting cross-arc
firings) and substrate-fix-deferred categories.

The 13 carrying forward (paraphrased; verbatim list at fb45abe):

1. `git status` (full, not `-uno`) for pre-merge state-confirm.
2. Untracked-files-on-merge-target as pre-Step-4 verification.
3. "Land schema with consumer code" chunk-discipline pattern
   (split-trigger threshold; observed N=2+ within fb45abe arc).
4. Typegen template drift via consumer-code regen.
5. Substrate-now-enforcement-later at chunk grain (split-trigger
   threshold; observed N=2+ within fb45abe arc).
6. vi.mock service-test isolation (env-validating dependencies).
7. Trunk-advancement-state-confirm.
8. Framing-assumption-state-confirm.
9. Verbatim verification stronger than prediction confidence
   (sub-shape under Z1 #11.b).
10. External-review-mixed-with-stale-content + founder-triage.
11. Service-helper docstring atomicity claims may mislead vs
    runtime (chunk N RPC + chunk 4 storage atomicity at N=2).
12. Brainstorm-side push recommendations frame as explicit
    founder-authorize sub-questions (N=3+ within session;
    Path C session-scoped lift; cross-session rule preserved).
13. (Various sub-shapes under fb45abe's monitoring catalogue
    that did not fire substantively within this arc.)

**Three new candidates this arc:**

**#15 — NaN-guard (`clampTtl`).** Surface: `clampTtl(NaN) → NaN`
propagating to `Invalid Date` in `expires_at`. Mechanism:
`Math.max(1, NaN) → NaN`; `Math.min(NaN, 1800) → NaN`;
`new Date(Date.now() + NaN * 1000).toISOString()` throws
`RangeError: Invalid time value`. N=1 monitoring at chunk N+M
Sub-Q F verify dispatch. Reachability: `PreviewOptions.ttl_seconds`
typed as `number | undefined`; whether NaN reaches `clampTtl`
depends on Zod boundary coverage at API/service layer (verify-
from-disk question deferred to hygiene-commit time per founder
disposition (α) at chunk N+M). Defer fix to hygiene commit per
substrate-now-enforcement-later default posture; the codification
substrate is the "monitor unguarded NaN paths in clamp/cap
helpers across storage + retry + integrity layers" framing.
N=2 cross-arc triggers graduation (e.g., similar unguarded NaN
in retry budget or hash-byte-count helpers).

**#16 — Methodology-shift state-preservation.** Surface: chunk
N+M onset Sub-Q D drift (per Methodology-shift state-preservation
section above). Mechanism: methodology-shift turn (Path 2
proposed → Path 1 elected) caused WSL-side voice in single-
sided integration to regenerate Sub-Q D lean from working
memory rather than re-stating brainstorm-side counter-lock from
canonical-evidence-anchor. N=1 monitoring at chunk N+M onset.
**Discipline-test passed within-session at WP2 closeout-cycle
gate** (path 2c defer locked; no scope-creep on locked-defer in
the same session that codified #16). Codification text per
Methodology-shift section above. N=2 cross-arc triggers
graduation.

**#17 — Per-checkout-discipline-completeness umbrella.** Surface:
B.5 worktree-rules.md per-checkout discipline complete on lock
acquisition + cleanup + worktree directory placement, but
underspecified on three per-checkout state-propagation surfaces
that emerged this arc. Three sibling manifestations:

- **(i) Env-file propagation gitignore-accident** (N=1; chunk
  N+M verification gate). `.env.local` (gitignored; carries
  service-role key) not propagated to worktrees by
  `session-init.sh`. Manual `cp` from main repo to worktree
  resolved this session. Substrate fix shape: per-checkout
  env-file copy step in `session-init.sh` for files in a
  `.session-init-copy-list` (or similar) — gitignored items
  the script propagates from main repo to fresh worktree at
  init time.

- **(ii) Lock-label-rotation prescription gap** (N=1; path α
  election precedent at chunk N+M push gate). B.5 worktree-
  rules.md prescribes per-checkout session locks but does not
  prescribe lock-label rotation when a worktree is reused
  across sequential chunks. Substrate fix shape: explicit step
  in worktree-rules.md naming "for sequential-chunk-on-same-
  worktree pattern, lock label may remain at first-chunk
  session label OR rotate per-chunk; discipline-shape decision
  recorded at first reuse."

- **(iii) Main-vs-worktree-lock-state divergence** (N=1; WP1
  cherry-pick + WP3 commit in main repo on staging). Main
  repo has no `.coordination/session-lock.json` (foreign lock
  is in worktree); pre-commit hook issued
  `[coordination] warning: no session lock in use` on both
  commits. Warning not blocking; COORD_SESSION env var set to
  foreign worktree label allowed commits to proceed. Substrate
  fix shape: per-checkout-discipline-completeness should name
  "main repo treated as a checkout that requires its own lock
  per discipline shape OR explicit per-checkout discipline-
  exemption for main-repo direct-commit patterns."

Pattern parity with hardcoded-UUID-test-fragility umbrella
shape: one codification surface, multiple manifestations under
per-checkout-discipline-completeness umbrella. Within-arc N=3
across siblings; cross-arc graduation defers (umbrella graduates
when one or more manifestations cross N=2 cross-arc OR when
umbrella shape fires N=3 cross-arc).

**Two graduations from prior arcs at N=3:**

**Hardcoded-UUID-or-non-unique-signature-test-isolation
umbrella.** Covers two manifestations:
- `find()`-without-trace_id-scoping (2026-04-27 N=2 candidate
  from `accountLedgerService.test.ts` tests 3 + 6 finding
  pattern — `.find()` lookup by non-unique-signature attribute
  produces wrong row when prior-run residue creates ambiguity).
- Hardcoded-UUID-trace_id (chunk N+M Test 4 finding at N=3 —
  hardcoded `00000000-0000-0000-0000-000000000bbb` for
  happy-path test trace_id; second vitest run sees 2 accumulated
  audit rows under that ID).
Test 4 fix landed inline at drafting time: per-run
`crypto.randomUUID()` + comment naming the cross-vitest-run
accumulation guard rationale ("(a) keep its audit row separable
from rollback tests' (where no audit rows should ever exist),
and (b) avoid cross-vitest-run accumulation when this test
runs without an intervening pnpm db:reset").

The umbrella codification text:
> Test isolation requires per-run-unique signatures for
> queryable attributes when row uniqueness is asserted. Two
> failure modes: (1) `.find()` against a non-unique attribute
> picks wrong row; (2) hardcoded UUIDs in test data accumulate
> across vitest runs without `pnpm db:reset` and produce
> length-assertion failures. Both addressed by per-run
> randomUUID-shaped values for query-relevant attributes.

Graduates at N=3. Carry-forward enforcement: future test files
audited against hardcoded-UUID-or-non-unique-signature patterns
at code-review time.

**Cross-vitest-invocation accumulation pattern.** Covers three
manifestations:
- Post-seed snapshot fragility (2026-04-27 NOTE on
  `soft8EntryEightReplay.test.ts` — post-seed snapshot UUIDs
  sensitive to `pnpm db:reset:clean` cycle).
- crossOrgRlsIsolation cascading (2026-04-29 S29a element #19 —
  cascading pollution downstream of accountLedgerService
  failure-state polluting `journal_entries` with rows whose
  UUIDs collide with `crossOrgRlsIsolation`'s `beforeAll` setup
  INSERT).
- agent:validate-after-pnpm-test state-pollution gap (chunk N+M
  verification at N=3 — `crossOrgRlsIsolation.test.ts` failed
  in second vitest invocation under same DB state because of
  hardcoded `journal_entries.journal_entry_id` values that
  conflict with prior-run accumulation; workaround: db:reset:clean
  between each test invocation).

The umbrella codification text:
> Multiple vitest invocations against the same DB state without
> intervening `pnpm db:reset:clean` accumulate row residue. Tests
> that hardcode UUID-shaped IDs in `beforeAll` or fixture-shape
> patterns are vulnerable. Two operational disciplines: (1) use
> per-run `crypto.randomUUID()` for queryable IDs in tests; (2)
> documented harness behavior naming "agent:validate after pnpm
> test requires db:reset:clean between" until tests are migrated.

Graduates at N=3. **Phase 2 obligation per S29a element #19
carry-forward strengthened**: "characterize value-drift vs
collision-drift" — Phase 2 work product naming whether the
fragility is value-drift (test data values drifting per run) or
collision-drift (hardcoded values colliding with accumulated
state). Founder verdict at Phase 2 brief-creation will scope
the substrate fix.

**Codification candidate ledger total at this density:**
- 14 fb45abe carry-forward (1 graduated within fb45abe + 13
  carrying forward to monitoring or split-trigger threshold)
- 3 new this arc (#15 + #16 + #17 with three sibling sub-shapes)
- 2 graduations this arc at N=3 (hardcoded-UUID umbrella + cross-
  vitest accumulation pattern)
- 1 substantive enforcement carry-forward (Phase 2 obligation
  strengthening per S29a #19)

**Z1 #11.b sub-shape catalogue post-this-arc** (cumulative within-
arc + carried-forward sub-shapes): 6 sub-shapes including the
new working-memory-lag-on-fb45abe-note shape from WP2
verify-from-disk gate (per Z1 discipline catalog state changes
section above).

Total active codification surface count: 17 candidates +
multiple sub-shapes + 3 graduated codifications (Z1 #11.b at
fb45abe; hardcoded-UUID umbrella here; cross-vitest accumulation
here).

### ADR cite findings

Two ADR-cite observations surfaced during chunk N implementation
+ chunk N+M verify-from-disk dispatches. Both are
observation-not-codification at this density; the second
strengthens a fb45abe carry-forward candidate (#13).

**ADR-0013 §16 misattribution at chunk N RPC migration comment
block.** Migration `20240137000000_create_source_document_with_audit_rpc.sql`
header cites:

> Per ADR-0013 §16 verbatim:
>   "source_document_created audit event fires in the same
>    transaction as the source_documents INSERT."

But the phrase "in the same transaction" is NOT present in §16
verbatim. §16's actual text describes audit emission shape +
event names + reserved triggers; it does not name the
transactional discipline at the cited "verbatim" level. The
chunk-N-D-revised lock for atomic INSERT-pair RPC was correctly
motivated by:

- **INV-AUDIT-001 leaf** (per `ledger_truth_model.md`): audit
  log INSERTs commit atomically with the entity INSERT they
  audit. The invariant text at the leaf level prescribes the
  atomicity discipline.
- **JournalEntries precedent** at `20240134000000_write_journal_entry_atomic_rpc.sql`:
  the established RPC pattern that ships single-transaction
  INSERT-pair atomicity at the SQL boundary.

Sub-shape under Z1 #11.b at N+1 within-arc post-codification: a
verbatim citation that didn't survive verbatim re-read. The
comment block author (single-sided integration during chunk N
authoring) reconstructed §16's content from working memory,
which produced a phrase that captures the discipline's intent
correctly but doesn't exist in §16. The correction at this
density: rewrite the migration header citation to
"INV-AUDIT-001 leaf + journalEntries `20240134000000`
precedent" rather than "§16 verbatim." Fix scope: comment
block edit; non-functional. Defer to hygiene-commit alongside
#15 NaN-guard fix per substrate-now-enforcement-later.

**`recordMutation.ts:122-127` atomicity-claim docstring
observation.** The helper's comment block claims:

> If you pass the same client object to multiple service
> functions, those calls will run in the same transaction.

This is technically misleading at the JS-client layer.
Supabase's `SupabaseClient` is a wrapper over PostgREST HTTP
calls; each HTTP call is its own request-level transaction at
the database. Sharing a `SupabaseClient` instance across
multiple `.insert()` / `.update()` / `.from()...` calls does
NOT bind those calls into a single Postgres transaction. The
"same client = same transaction" framing is a category error.

chounting's actual atomicity pattern is RPC-based: a Postgres
function (e.g., `write_journal_entry_atomic`,
`create_source_document_with_audit`) wraps multiple INSERTs
inside a `BEGIN/COMMIT` envelope at the PL/pgSQL function body
boundary. The function executes as one atomic unit; PostgREST
exposes it as a single RPC call; the JS client invokes via
`db.rpc('function_name', payload)`. Atomicity is bound to the
function body, not the JS-client object lifetime.

The chunk N session noted this observation at N=1 firing
(during recordMutation review). Chunk 4 storage atomicity
implication strengthens at N=2: storage-layer atomicity (put
+ verify-readback per ADR-0013 §9) is also NOT bound by
`SupabaseClient` instance lifetime — it's bound by the
sequential `await` of the put operation followed by the
verify-readback download. If the JS process crashes between
the two operations, partial state remains (uploaded bytes
without verify confirmation); the helper-level "atomicity"
framing was misleading there too.

**Codification candidate #13 strengthening at N=2.** Per
fb45abe carry-forward: "Service-helper docstring atomicity
claims may mislead vs runtime." Chunk N RPC + chunk 4 storage
atomicity implication = N=2 within-arc. Cross-arc N=3 triggers
graduation. Substrate fix shape: audit `recordMutation.ts` +
similar helper docstrings for atomicity-claim accuracy at next
hygiene-commit cycle; replace "same client = same transaction"
with "RPC body = same transaction; sequential `.insert()` calls
are NOT bound." Defer to next hygiene-commit per substrate-now-
enforcement-later default posture.

**Both findings are observation-not-codification at this
density.** The corrections are documentation-shape (migration
comment + helper docstring) — non-functional. Substrate fix
shapes recorded; enforcement (the actual edits) lands at next
hygiene-commit cycle, not this closeout cycle.

### Convention-fire status

**Single-purpose-commit-discipline at chunk grain held cleanly
across PR #7 + PR #8.**
- **PR #7** (chunk N): one chunk = one logical deliverable
  (`createSourceDocument` service + atomic INSERT-with-audit
  RPC + 7 unit tests) = one commit (`45895fb`) = one PR.
- **PR #8** (chunk N+M): one chunk = three test files +
  bucket-hygiene addition to test_helpers.sql = ONE commit
  (`592dff5`) per cross-file-single-purpose at chunk arc grain.
  Bucket-hygiene IS load-bearing for chunk N+M's reliability
  contract (Sub-Q D (b) `afterAll`-failure recovery); cross-
  file commit permitted per discipline. Single-purpose-commit-
  discipline at chunk grain holds even when the chunk's
  purpose spans multiple files.

**Chunk N+1 closure-without-implementation did not fire commit-
grain discipline.** Substrate-already-ratified at fb45abe;
consumer-code-defer per Reading C lock. No code commit shipped
for chunk N+1; the closure is a friction-journal artifact + δ-2
+ δ-3-lite addendum surface, not a code-grain commit. New
precedent shape: chunks may close without commits when substrate
is fully ratified at prior arc and consumer code is deferred to
post-v1 activation. Carry-forward to future closure-without-
implementation surfaces (e.g., reserved-provider activations).

**PR-per-arc held.** Each chunk shipped as one PR; merge-commit
per chounting precedent. PR #7 → `366454a`; PR #8 → `389adbb`.
Squash not used (per delivery-model.md substrate / governance
prefer merge for audit trail).

**Length-as-calibration (Z1 #9).** Chunk N implementation:
~218 lines (`documentPlatformService.ts` + RPC migration +
unit tests). Mid-band. Chunk N+M implementation: 784
insertions across 4 files (mid-upper-band per integration-test
density; 14 tests + bucket-hygiene). Closeout cycle skeleton
(`f05d27e`): 243 insertions. Closeout cycle pre-positioning
notes (`1a2aec7`): 347 insertions. Closeout cycle density-
population (this commit): ~1100+ insertions (upper-band per
substantive evidence-anchor density; matches founder Frame 1
"do not compress" framing).

**Explicit-authorization gate (§5.7) preserved cross-session
+ within-session.** Per-action authorization shape held this
session AND prior session: founder verdicts at every push
surface (commit, push, PR creation, merge). No Path C lift
extension this session OR prior session. The standing-rule
shape is intact.

**Path α election was the substantive exception within the
discipline** — at chunk N+M push surface, brainstorm-side's
shared-abstain per memory citation was lifted at founder's
explicit analysis-request. The discipline framework holding
within proper scope (no proxy-locking) and lifting at founder's
explicit ask. Per Z1 #11.b sub-shape framing: the discipline
holds even when both voices abstain by design, not just when
they diverge.

**Closeout-cycle-defer (Frame 1) as session-grain convention
firing.** Prior session's Frame 1 verdict ("do not compress
or rush — substantial evidence-anchor artifact") + this
session's density-population produced a session-grain firing
of substrate-now-enforcement-later. The convention shape:
when a session approaches close with a substantial evidence-
anchor work product pending, the work product ships in
skeleton form at session boundary; full density populates at
next-session opening under fresh context. fb45abe-band density
preserved by deferring rather than compressing.

**Closure-cycle commits as direct-commit-on-staging per small-
hygiene carve-out.** WP1 (closeout skeleton) + WP3 (pre-
positioning notes) shipped as direct commits on staging via
cherry-pick (initial wrong-branch correction) + main-repo
direct-commit. Pattern parity with fb45abe + e8cb3dd
precedent for friction-journal entries that don't require
worktree. No PR; no merge gate; small-hygiene carve-out at
cycle grain. This density-population (WP A + WP B bundled)
ships under same shape.

**Brainstorm-side / WSL-side concurrence shape on close.**
Both sides on record at session close concurring on close;
both sides on record at session-start concurring on session-
start anchors (Reading 2 + path-α-equivalent + per-action
auth + Frame 1'). Two-sided + founder triple architecture
intact through both session boundaries.

### Carry-forward to next session

**Density-population this session closes the closeout cycle for
Phase 1.Storage arc.** After this commit lands, Phase 1.Storage
implementation arc + closeout cycle are both fully terminated
on origin/staging. Three carry-forward shapes for the session
that opens next:

**1. Phase 2 brief-creation arc opens next session as primary
work product.** Per delivery-model.md cadence (brief opens
phase). Phase 2 = Document Core (cases + artifacts + exception
queue per ADR-0011 §3 + §5 + §13) + Tier 2 Document Pipeline
(per ADR-0014). Phase 5 = AP foundation (consumer of Phase 2
substrate per ADR-0015). Pre-positioning notes at
`docs/09_briefs/phase-2/2026-05-06-phase-2-brief-pre-positioning-notes.md`
(landed at `1a2aec7`) anchor the brief-creation arc with
substantive scope distilled from ADR-0011 §3+§5+§6+§13 +
ADR-0014 + ADR-0015 + delivery-model.md + existing brief
skeleton. Brief-creation fills the substantive content stub
sections (§1-§14, §16, §18-§20) at
`docs/09_briefs/phase-2/document_platform_initiative.md`
(currently substantive-content-deferred per substrate-now-
enforcement-later cross-pattern at Phase 0 closure).

**Phase 2 chunk-decomposition candidates** (per pre-positioning
notes; not locked; final decomposition at Phase 2 chunk 1
onset adjudication): Document Core schema migration; Tier 2
pipeline orchestrator skeleton; Modal sidecar implementation;
Tier A classifier; Tier C AI fallback; vendor matcher;
field extraction per document type; match-against-existing-
state subsystem; proposal builder; exception queue UI; orphan-
blob GC; Logic Receipt emission; replay/idempotency. Likely
8-15 chunks given substrate breadth.

**Open governance questions** that surface at Phase 2 brief-
creation: Q29 ESLint rule design (fires at first
`src/agent/pipelines/**/*` code); Q65 confidence thresholds at
v1 ship (per ADR-0019 ratification); Q68 exception queue UI
scope (UI implementation surface); AI fallback budget per-org
configurability post-v1; replay cadence post-v1; Tier B
classifier activation threshold; document-type discriminator
routing-suggestion banners; INV-DOC-001 enforcement gate
(Phase-1-implementation-gate per Q79 path β; fires when first
DOC-citing code lands).

**2. Hygiene-commit cycle for deferred fixes.** Three deferred
substrate-fix surfaces accumulated during Phase 1.Storage
arc; all defer to next hygiene-commit cycle per substrate-
now-enforcement-later default posture:

- **#15 NaN-guard fix** at `clampTtl` in
  `supabaseStorageProvider.ts:95-99`. Add NaN guard:
  `if (Number.isNaN(ttl)) return PREVIEW_TTL_DEFAULT_SECONDS;`
  before the `Math.max/Math.min` clamp. Plus verify-from-disk
  on `PreviewOptions.ttl_seconds` Zod boundary coverage at
  API/service layer; if Zod rejects NaN, defect is unreachable
  in production but bypassable in tests.
- **ADR-0013 §16 misattribution** in
  `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql`
  comment header. Replace "§16 verbatim" citation with
  "INV-AUDIT-001 leaf + journalEntries `20240134000000`
  precedent" framing.
- **`recordMutation.ts:122-127` docstring** atomicity-claim
  rephrasing. Replace "same client = same transaction" with
  "RPC body = same transaction; sequential `.insert()` calls
  are NOT bound."

Hygiene-commit cycle fires at next session opening if budget
permits; otherwise carries to subsequent cycle. Single direct-
commit on staging per small-hygiene carve-out shape.

**3. Class A INDEX hygiene amendment** ships bundled with this
density-population commit (per Phase 4 in session sequencing +
locked Branch 4 bundling). Future readers see the Class A
artifacts (CTO_HANDOFF_V2.md, ec-2-prompt-set.md, class-2-
scope-decision.md, 2026-05-03-agent-autonomy-bank-detail-
amendment.md) indexed at this density's commit; Class B
artifacts (per Branch 4 INDEX hygiene observation section
below) covered by routing-policy adjudication, not individually
indexed.

**Foreign session-lock disposition for session opening that
follows next.** Lock held at
`phase-1-document-platform-2026-05-06`; founder-domain. Three
options enumerated:
- (α-equivalent) Continue under existing label (this session's
  pattern; pattern parity with chunk N+M)
- (β-equivalent) Founder releases; new session-init under
  appropriate label
- (other) Founder-elected

Both sides abstain per shared-abstain on session-lock
disposition + memory `feedback_coord_lock_hostile_takeover.md`.

**Memory pickup mechanism.** This session opens with
`project_phase_1_storage_closeout_pending.md` indexed in
`MEMORY.md`. After density-population lands, the memory file
gets refreshed (or replaced with `project_phase_2_brief_creation_pending.md`
or similar) to reflect the new session-boundary state: closeout
cycle complete; Phase 2 brief-creation arc primary work product
for next session opening. Memory pickup is the canonical-
evidence-anchor for cross-session continuity per Z1 #15.

### Branch 4 INDEX hygiene observation + Class A/B classification

**WP2 (Branch 4 INDEX hygiene) at fb45abe-original-scope verified
empty.** The three originally-specified items (ADR-0007 +
`DEV_WORKFLOW.md` + `04_engineering/README.md`) were already
present in `docs/INDEX.md` at session-start of the prior session:
- ADR-0007 at line 97
- `DEV_WORKFLOW.md` at line 59
- `04_engineering/README.md` at line 57

Verification mechanism: `git log fb45abe..HEAD -- docs/INDEX.md`
returned no commits. INDEX.md hasn't been modified since fb45abe.
The fb45abe note pre-dated their addition (silently backfilled
during chunks 1-4 substrate work or B.5 sync arc) or reflected
stale state at fb45abe authoring time.

**Z1 #11.b sub-shape (new this arc): working-memory-lag on
friction-journal entries can lag on-disk state when intervening
commits silently address carry-forward items.** Brainstorm-side's
prior-turn surfacing assumed the 3 fb45abe-flagged items were
still gaps per the fb45abe note. WSL-side's surface-back claimed
"WP2 verified empty at original scope" — verify-from-disk via
filesystem MCP confirmed WSL-side's claim correct. The discipline:
when working-memory of a friction-journal entry's claims is the
basis for current-session adjudication, verify-from-disk before
relying on the working-memory framing. Sub-shape applies at every
cycle-completion gate where carry-forward inventory references
prior-arc journal entries. Sub-shape under Z1 #11.b cumulative
within-arc count; awaits cross-arc N=2 for graduation.

**Broader INDEX hygiene gap surfaced this session.** Filesystem
MCP enumeration produced 16 files on-disk-but-not-in-INDEX:

**`07_governance/` (2 files):**
- `CTO_HANDOFF_V2.md` (cited by ADR-0020 Appendix A; load-bearing
  architectural recommendation)
- `ec-2-prompt-set.md` (audit prompt set; no fb45abe reference;
  worth investigation before indexing)

**`09_briefs/phase-2/` (14 files):**
- `2026-05-03-agent-autonomy-bank-detail-amendment.md` (referenced
  in friction-journal at fb45abe; durable amendment)
- `2026-05-03-d1-ratification-package.md`
- `2026-05-03-d2-ratification-package.md`
- `2026-05-03-d3-ratification-package.md`
- `2026-05-04-d4-ratification-package.md`
- `2026-05-04-d5-ratification-package.md`
- `2026-05-04-d6-ratification-package.md`
- `2026-05-04-evidence-link-coordination.md`
- `2026-05-04-phase-0-closure-verification.md`
- `2026-05-04-session-2d-opening-prompt.md`
- `2026-05-04-session-2f-opening-prompt.md`
- `2026-05-04-session-2f-closeout.md`
- `class-2-scope-decision.md` (referenced indirectly by
  `phase-1.2/oi-3-class-2-fix-stack-scoping.md`)
- `session-22-brief.md`

Plus `2026-05-06-phase-2-brief-pre-positioning-notes.md` (WP3
landed at `1a2aec7` this closeout cycle; structurally a transient
session-arc artifact).

**Routing-policy adjudication: Class A vs Class B distinction.**
The 16-file gap (+ WP3) separates into two classes per
Documentation Routing convention's transient-handling pattern:

**Class A — durable artifacts that warrant individual INDEX
entries (4 files):**
- `07_governance/CTO_HANDOFF_V2.md` — cited by ADR-0020 Appendix
  A; load-bearing architectural recommendation source for the
  Phase 1+ source-tree organization. Ship index entry: "the CTO
  Handoff v2 input that ADR-0020 operationalizes; agent-first
  authority-gradient source architecture per Decision items 1-9."
- `07_governance/ec-2-prompt-set.md` — pre-existing audit prompt
  set; standalone artifact. Ship index entry: "(stub: investigate
  scope at first edit)" or skip per per-investigation-deferral
  shape.
- `09_briefs/phase-2/class-2-scope-decision.md` — referenced
  indirectly by `phase-1.2/oi-3-class-2-fix-stack-scoping.md`
  ("first concrete application of Meta A and Meta B at scoping
  time"); load-bearing scope artifact. Ship index entry.
- `09_briefs/phase-2/2026-05-03-agent-autonomy-bank-detail-amendment.md` —
  referenced in friction-journal at fb45abe; durable amendment
  to ADR-0007 Tier 2.5 read-boundary clarification. Ship index
  entry.

**Class B — transient session-arc artifacts (12 files + WP3):**
- D1-D6 ratification packages (6 files) — Phase 0 governance
  arc gates' ratification artifacts. Their content is preserved
  at the gate-time snapshot; arc closeout (fb45abe) absorbs the
  load-bearing claims into ratified ADRs + this friction-journal.
- Session 2D + 2F opening prompts + 2F closeout prompt (3 files)
  — session-arc-scoped framing artifacts.
- Phase 0 closure verification (1 file) — 12-surface disposition
  artifact at Phase 0 closure; absorbed into ADR ratifications +
  fb45abe.
- Evidence-link coordination (1 file) — Phase 0 governance arc
  coordination artifact.
- Session-22 brief (1 file) — session-arc-scoped brief.
- WP3 pre-positioning notes
  (`2026-05-06-phase-2-brief-pre-positioning-notes.md`) — Phase
  2 onset-cycle anchor artifact at this closeout cycle; structurally
  parallel to Phase 0 governance plan + Phase 0 closure verification
  artifacts (date-prefixed phase-2 onset artifact).

**Routing-policy lock**: Class B is **deliberately-not-individually-
indexed per Documentation Routing convention's transient-handling
pattern.** These are session-arc-scoped artifacts that accumulate
within the arc and become forensic-anchor-only post-closure;
individually indexing them inflates `docs/INDEX.md` density without
proportional discoverability benefit. The friction-journal-archive
routing pattern (closed phases archive to `friction-journal/phase-X.md`
per Documentation Routing convention's archival rule) is the
sibling-shape for journal artifacts; Phase 2 transient artifacts
get analogous treatment via "preserved on-disk + not individually
indexed" disposition.

**WP3-as-Class-B consistency check passes.** WP3 is structurally
parallel to Class B artifacts (date-prefixed phase-2 onset
artifact; analogous to `2026-05-03-phase-0-governance-plan.md`
which IS individually indexed in the existing INDEX). The
existing INDEX precedent on `2026-05-03-phase-0-governance-plan.md`
indexing surfaces a refinement question: phase-N onset-plan
artifacts MAY be individually indexed if they carry forward as
load-bearing pickup anchors for the phase work product. WP3
qualifies — it's the canonical pickup anchor for Phase 2 brief-
creation. **WP3 reclassifies as Class A on this refinement**:
indexed individually as "Phase 2 brief-creation pre-positioning
notes; anchor for Phase 2 onset-cycle pickup."

Refined Class A inventory (5 files):
1. `CTO_HANDOFF_V2.md` (07_governance)
2. `ec-2-prompt-set.md` (07_governance) — investigate-deferral
3. `class-2-scope-decision.md` (09_briefs/phase-2)
4. `2026-05-03-agent-autonomy-bank-detail-amendment.md` (09_briefs/phase-2)
5. `2026-05-06-phase-2-brief-pre-positioning-notes.md` (09_briefs/phase-2; refined Class A per pickup-anchor shape)

Refined Class B inventory (12 files; deliberately-not-individually-
indexed):
- D1-D6 ratification packages (6)
- Session 2D opening + 2F opening + 2F closeout prompts (3)
- Phase 0 closure verification (1)
- Evidence-link coordination (1)
- Session-22 brief (1)

**INDEX amendment shape (this commit).** Add 5 Class A entries
to `docs/INDEX.md` at the appropriate sections per existing
INDEX format. Class B not addressed in INDEX (deliberately-
not-individually-indexed per routing-policy lock). Closeout
cycle bundle: this density-population entry + Class A INDEX
entries amendment = ONE direct-commit on staging.

**Documentation Routing convention strengthening at this density.**
The transient-arc handling pattern surfaces a refinement: phase-
N onset-plan + closeout-anchor artifacts qualify for Class A
treatment if they're load-bearing pickup anchors; mid-arc
ratification packages + opening/closeout prompts qualify for
Class B treatment as session-arc-scoped artifacts. The
refinement codifies as a sub-shape of the Documentation Routing
convention; future arcs apply at session-arc-artifact-creation
time.

---

**Density-population complete.** This entry consolidates the
chunk N + chunk N+1 closure-without-implementation + chunk N+M
arc + closeout cycle into a single fb45abe-band evidence-anchor
artifact. Closeout cycle work products on origin: skeleton at
`f05d27e`; pre-positioning notes at `1a2aec7`; this density-
population at [next-commit-SHA] (with bundled Class A INDEX
hygiene amendment). Phase 1.Storage implementation arc + closeout
cycle both terminated on origin/staging. Phase 2 brief-creation
arc opens next session as primary work product per delivery-
model.md cadence.

---

### Phase 2 brief-creation arc — chunk B2-1 commit (2026-05-06)

Chunk B2-1 ships substantive content for §1-§4 of
`docs/09_briefs/phase-2/document_platform_initiative.md`
(motivation + locked v1 scope + architecture overview + Tier
placement). Single direct-commit on staging at `5a00671` per
single-purpose-commit-discipline; pushed to origin per Option 3
milestone-grain §5.7 condition (b) authorization
(`b900bdd..5a00671` on 2026-05-06).

#### Substantive output

564 insertions / 4 deletions. Per-section delta:

- **§1 Why this initiative exists** (58 lines) — hybrid narrative
  + verbatim citation blocks per (α-3) lock. Cites ADR-0011
  `## Context → Why a Document Platform substrate exists`
  (lines 33-66) for the load-bearing reframe finding; preserves
  canonical "AP is not the foundation. The Document Platform
  is the foundation." callout; closes with Reading B
  preservation framing per ADR-0011 inheritance discipline.
- **§2 Locked v1 scope** (176 lines) — three-category
  enumeration (in-scope / out-of-scope / reserved-but-not-
  emitted) per (β) lock. Substrate-now-enforcement-later
  cross-pattern cited via D6 ratification package §6.8 +
  ADR-0010 amendment Variant A composition. 9 reserved-but-
  not-emitted categories enumerated: document-type discriminator
  (14 reserved), resolution-action enum (8 reserved), document-
  case-source role enum (2 reserved), storage status enum (5
  reserved), OCR engine enum (2 reserved), 12 reserved
  `org_settings.*` columns, multi-entity reservations (5
  columns), `wrong_entity_exception` flag, DOC invariant
  prefix, re-evaluation triggers T7+T9.
- **§3 Architecture overview** (195 lines) — (γ-1) prose flow
  only per pattern-parity verify-from-disk (reframe-spec uses
  prose + tables; zero diagrams across all 21 sections).
  6-layer narrative: Storage / Evidence Core → Document Core
  → Tier 2 Document Pipeline → Relationship Router (Tier 2.5)
  → Domain handoff → Tier 1 commit gate. Pipeline-as-Layer-3
  distinction from Document Core substrate at Layer 2
  preserved (substrate stores case state; pipeline orchestrates
  extraction-to-proposal flow).
- **§4 Tier 1/2/2.5/3 placement** (135 lines) — Tier-by-
  component enumeration per (δ) lock at 11 components (vs ~9
  initial frame): 1 below-agent-tier (Storage provider), 6
  single-Tier (Document Core / pipeline orchestrator / Tier A /
  Tier C / vendor matcher / matchAgainstExistingState), 1 Tier
  2.5 (Relationship Router), 2 split-framing (Exception queue
  + Logic Receipt), 1 boundary (ProposedMutation handoff).

#### Three contested-framing adjudication

Three framings surfaced post-subagent distillation as
candidates for interpretive overlay vs ADR verbatim. All three
locked honoring ADR text verbatim:

- **δ-1-i Storage provider** — data-access layer below the
  agent-tier boundary per ADR-0013 (NOT "Tier 2 substrate").
  Storage is structurally orthogonal to agent tiers; agent
  tiers consume storage through `storageProviderService`.
- **δ-2-i Exception queue** — split-framing: substrate Tier 2
  (ADR-0011 §1 + §13) + UI surface Tier 3 (ADR-0007 §Tier 3
  Interface Path). Substrate ownership distinct from UI surface
  rendering.
- **δ-3-i Logic Receipt** — split-framing: production Tier 1
  (INV-AGENT-002 + ADR-0007 §Tier 1) + `pipeline_trace`
  populated by Tier 2 stages (ADR-0007 Tier 2 safety contract
  item 5).

Convergence shape: WSL-side initial leans + brainstorm-side
verify-from-disk on ADR text + founder explicit verdict bundle
all converged on (i) framings via canonical-evidence-anchor
grounding paths. Z1 #15 termination criterion preserved via
on-disk artifact convergence, not agreement-as-termination.

#### Flag 3 surfacing — `wrong_entity_exception` cross-enum inconsistency

ADR-0011 §10 names `wrong_entity_exception` as reserved "in
the exception-routing enum (per §13 below)," but ADR-0011 §13's
16-value `resolution_action` enum does NOT list it.

Reading A (most likely): two distinct enums conflated under
"exception-routing" — exception-TYPE enum (input categorization;
why the case landed in queue) vs resolution-action enum (output
disposition; what the human chose). The first enum doesn't
exist in any ratified Phase 0 ADR.

Inline accommodation in §2 reserved-but-not-emitted enumeration
+ Phase 2 carry-forward governance question framing per founder
verdict. Warrants either ADR-0011 amendment introducing the
exception-TYPE enum + adding `wrong_entity_exception` to it,
OR downstream-ADR ratification (potential ADR-0016 / ADR-0018
candidate). Founder-domain triage timing.

Cross-section verbatim re-read at brief-creation gate caught
this inconsistency (sub-shape candidate under Z1 #11.b at
substrate-level; mirror-shape to chunk-N+M misattribution
sub-shape at code-comment gate from prior arc).

#### Sub-shape candidates accumulated

Four sub-shape candidates accumulated this session at varying
N counts:

- **#16-i positive instance** (executor judgment grounds in
  canonical-evidence-anchor reads → output convergence on
  contested-framing leans). Within-session N=2 fires (chunk
  B2-1 onset Sub-Q convergence + next-step Option 3 → Option 2
  convergence). Cross-arc N=2 graduates; within-session N=2
  advances cumulative count for monitoring, does not graduate.
- **#16-iii bundled-verdict-with-restate-window** (founder
  explicit bundled verdict + executor restate-for-correction-
  window; silence-as-acceptance ratification mechanism).
  Distinct from #16-ii (no founder verdict at all) and from
  per-anchor explicit verdict (correction-window-as-mechanism).
  Multi-fire within-session (~5 fires across session-start
  anchors + chunk B2-1 onset Sub-Q lock + contested-framing
  bundle + drafting authorize + next-step bundle). Cross-arc
  N=2 graduates.
- **Z1 #9 length-as-calibration overshoot at brief-creation
  grain**. Chunk B2-1 ran 1.6-2.3x estimate (564 lines vs
  250-350 estimate). Sub-shape framing: brief-creation chunks
  tend to overshoot length estimates because Sub-Q verdicts
  driving substantive density are pre-locked but estimate-
  density was framed pre-verify-from-disk on actual ADR
  content. N=1 monitoring; cross-arc N=2 (future brief-
  creation arc, e.g., chunk B2-2 / B2-3 / B2-4) graduates.
- **#17-iii main-vs-worktree-lock-state divergence** advances
  within-arc N=4 at chunk B2-1 commit + N=5 at chunk B2-1 push
  (5 fires under foreign label `phase-1-document-platform-
  2026-05-06` across two sessions: chunks 1-4 + chunk N + chunk
  N+M + closeout cycle skeleton + closeout cycle density at
  b900bdd + chunk B2-1 commit + chunk B2-1 push). Cross-arc
  graduation defers per discipline.

#### Foreign session-lock disposition

α-equivalent precedent extended this session at `5a00671`
commit + push. Foreign session-lock disposition reopens at
next-session start as founder-domain election; lock held at
`phase-1-document-platform-2026-05-06`.

#### Subagent dispatch shape

Layer 2 fired 4 parallel general-purpose subagents per Z1 #11.b
preventive verbatim re-read discipline before drafting:

1. ADR-0011 §1 + §3 + §6 + §13 + §15 + §17 (re-anchored as §10)
   + ADR-0010 amendment Variant A precedent (bundled per
   brainstorm-side recommendation)
2. ADR-0014 motivation + §1 (Pipeline architecture overview)
   + §2 (OCR engine selection) + §3 (Modal sidecar topology)
   + §7 (classification strategy) + Closes Q73 (12 reserved
   org_settings columns canonical enumeration)
3. ADR-0007 amendment Tier 2.5 + Q66 closure + three-category
   vendor read split distributed across Tier 2 + Tier 2.5
   read boundaries + Status section's named-follow-up reference
   + Q28 expansion surfaces 2-3
4. ADR-0018 §1-§6 (Tier placement at Decision item 1; not §6)
   + ADR-0013 §1-§5 (data-access layer below agent-tier
   boundary; no single "Tier placement" section)

Subagents returned 10 substantive Discrepancy flags (citation-
anchor corrections + 1 substantive Flag 3 surfacing). 9
citation-anchor corrections inlined silently per discipline; 1
substantive flag (Flag 3) surfaced inline + carry-forward.

Subagent dispatch shape preserved as forward-pattern for chunks
B2-2 / B2-3 / B2-4: Z1 #11.b fires preventive verbatim re-read
before drafting via parallel general-purpose subagents (NOT
Explore subagents per Explore-tool description prohibition on
design-doc auditing); subagent prompts self-contained for
zero-context dispatch; output shape includes verbatim citation
blocks + distilled summaries + Discrepancy flag surfacing.

#### Carry-forward to next session

- **Chunks B2-2 / B2-3 / B2-4** — primary next-session work
  product. Substantive content stubs at §5-§9 (data model +
  storage abstraction + polymorphic links + Relationship Router
  + Proposal types) / §10-§13 (immutability + exception queue
  + multi-entity + receipt v1 matrix) / §14, §16, §18-§20
  (Phase A acceptance + ADRs produced + friction-journal scope
  + non-goals + verification).
- **Hygiene-cycle 3 deferred fixes** — γ-hygiene (DEFERRED to
  subsequent session per founder Anchor 2 election). Folds
  into chunk B2-N cadence OR defers further per founder elect.
- **Flag 3 governance question** — `wrong_entity_exception`
  cross-enum inconsistency triage timing founder-domain.
- **Sub-shape candidates** — 4 candidates at N=1 / N=2 /
  multi-fire monitoring; cross-arc N=2 graduations defer.
- **Memory pickup file refresh** — renamed to
  `project_phase_2_brief_creation_pending.md` (from
  `project_phase_1_storage_closeout_pending.md` per state
  reflection); content reflects post-chunk-B2-1 state.

Phase 2 brief-creation arc continues at next-session opening.
Substrate-decision-integrity preserved across chunk B2-1
substantive output; next-chunk onset adjudication fires at next
session.

---

### Phase 2 brief-creation arc — chunk B2-2 commit (2026-05-07) + (R-iii) gate-class-dependent shape codifiable refinement

Chunk B2-2 ships substantive content for §5-§9 of
`docs/09_briefs/phase-2/document_platform_initiative.md` (data
model + storage abstraction + polymorphic links + Relationship
Router + ProposedMutation/Bundle/Attachment). Single direct-
commit on staging at `83dd6d1` per single-purpose-commit-
discipline; **bundled commit + push** per (C-ii) bundled-
explicit founder verdict at clean-termination gate per refined
(R-iii) — `0d052c1..83dd6d1` advanced on origin/staging
2026-05-07.

#### Substantive output

1097 insertions / 5 deletions. Per-section delta:

- **§5 Data model** (190 lines) — (ε-3) hybrid: verbatim row-
  shape for 5 substrate-load-bearing tables (`source_documents`
  + `source_document_versions` + `document_cases` +
  `document_case_sources` + `document_artifacts`); summary +
  cross-reference for 6 downstream-ADR-owned tables
  (`source_document_links` → ADR-0016 / `document_classifications`
  → ADR-0014 / `document_relationship_candidates` → ADR-0011 §1
  + ADR-0018 / `ingest_batches` + `ingest_items` + `document_jobs`
  → ADR-0014); `ocr_runs` + `extraction_runs` row shapes
  deferred to ADR-0014 per ADR-0011 §9 cross-reference to Q69.
  Index strategy + reserved-but-not-emitted column accounting
  subsections close per substrate-now-enforcement-later cross-
  pattern.
- **§6 Storage abstraction** (166 lines) — (ζ-3) hybrid:
  reframe-spec §3.1 substrate-bullet enumeration + ADR-0013
  ratified-substrate operational detail (6-method contract
  surface; 3-discipline-constraint pattern mirroring reframe-
  spec §6 polymorphic-pattern; v1-active subset; reserved
  providers post-v1; storage-of-truth discipline; 5 audit
  events). Citation-anchor correction inlined: reframe-spec §6
  is "Polymorphic source-document links" NOT storage
  abstraction; storage substrate enumeration lives in reframe-
  spec §3.1 substrate-bullet.
- **§7 Polymorphic source-document links** (215 lines) — (η-3)
  hybrid: verbatim closed enum lists (`linked_entity_type` 28-
  reserved / 8-active; `link_role` 27-reserved / 4-active;
  `link_status` 2 v1-active); 756-cell pair-validity matrix
  shape + 15 active-v1 cells enumerated explicitly + matrix
  detail cross-ref to ADR-0016 Decision item 3; 3-layer
  ADR-0010 defense; 8-row × 3-column cascade matrix; 4 audit
  events. Citation-anchor correction inlined: ADR-0016
  organizes content as 6 numbered Decision items + 6 named top-
  level sections (NOT 12 numbered top-level sections).
- **§8 Relationship Router** (270 lines) — (θ-3) hybrid: per-
  Subsystem prose (1 Ledger-State Candidate Completion / 2
  Ambiguity Resolution / 3 Re-Evaluation Logic Q56 closure);
  verbatim Tier 2.5 safety contract from ADR-0007; verbatim
  T1-T10 trigger list (v1-active 8 / reserved 2: T7 vendor-
  master-merge + T9 document-supersession); Tier 2.5 read-
  boundary; stale-state TOCTOU at Q28 surface 3; ADR-0019
  integration 3 decision points. Citation-anchor correction
  inlined: ADR-0018 organizes content as 7 Decision items
  under single `## Decision` header (NOT §1-§9 numbered top-
  level sections); cross-ADR boundary with ADR-0014 documented
  at Decision item 2 opening (NOT standalone §2).
- **§9 ProposedMutation/Bundle/Attachment** (261 lines) —
  (ι-3) hybrid: per-proposal-type prose contract; verbatim
  TypeScript type for ProposedMutationBundle; bundle children
  = ProposedMutations only (NOT ProposedAttachments) per
  ADR-0012 §2; bundle atomicity 4-condition invariant per
  ADR-0012 §7; 5 v1 ProposedAttachment variants; verbatim Four
  Questions canonical phrasing from `intent_model.md`
  `## The Four Questions Grammar` heading + per-proposal-type
  adaptation; Reading B preservation walk-through;
  `intent_model.md` Primitive 1 mapping for all three proposal
  types. Citation-anchor correction inlined: `intent_model.md`
  `## The Four Questions Grammar` heading is text-anchored, not
  numbered; shorthand "intent_model.md §5" references the 5th
  `##` heading.

#### 9 Discrepancy flag corrections inlined

5-subagent dispatch surfaced citation-anchor corrections + 1
substantive observation (Tier 2.5 safety contract appears in 3
places in ADR-0007 — all consistent). Corrections inlined
silently across §5-§9 with explicit surface where pattern-
parity-divergence warrants future-reader awareness:

1. ADR-0011 §-numbering (§1 Entity ownership / §2
   source_documents row-shape / §3 cases lifecycle +
   case_sources combined / §4 polymorphic links discipline /
   §10 multi-entity reservation NOT §17)
2. Reframe-spec §6 misattribution (storage abstraction lives
   in §3.1, not §6)
3. ADR-0013 §-numbering (§7 failure-classification, §9
   integrity-check, §11 storage_status, §12 preview-URL, §13
   storage-of-truth, §16 audit logging)
4. ADR-0016 6-Decision-items + 6-named-sections structure
5. ADR-0018 7-Decision-items structure (ADR-0014 boundary at
   item 2; Tier 2.5 read-boundary at item 5; stale-state
   TOCTOU at item 6; ADR-0019 integration at item 7)
6. `intent_model.md` `## The Four Questions Grammar` heading
   text-anchor
7. ADR-0012 §6 paraphrase vs canonical Four Questions phrasing
8. Bundle children = ProposedMutations only (ADR-0012 §2)
9. Storage status enum 7 values / v1-active 2

#### Substantive locks honored across §5-§9

- Reading B preservation reaffirmed in §5 + §6 + §7 + §8 + §9
- Single-writer rules: `documentLinkService` for
  `source_document_links` (§7); `ledgerService` for
  `journal_entries` via domain services (§9)
- Three-layer ADR-0010 defense applied at storage substrate
  (§6) + polymorphic links substrate (§7)
- Tier 2.5 safety contract verbatim from ADR-0007 (§8)
- Schema-vs-algorithm split (ADR-0016 owns schema substrate;
  ADR-0018 owns runtime matching algorithm) preserved at §7
  + §8

#### (R-iii) gate-class-dependent shape — codifiable refinement candidate

Most substantive carry-forward this session: refinement of
#16-iii from monitoring sub-shape (bundled-verdict-with-
restate-window) to **(R-iii) gate-class-dependent operating
model**:

- **Intermediate gates** (Sub-Q locks, drafting authorize,
  next-step adjudication, contested-framing bundles, drafting
  review, "execute" instruction surfaces, session-start
  anchor locks): bundled-verdict-with-restate-window per
  #16-iii. Founder operating model per founder behavior
  across 3 consecutive bundled-accepts at session-start
  anchor locks indicates session-start IS intermediate-class
  in founder operating model (Possibility 1 taxonomy
  refinement).
- **Clean-termination / irreversible gates** (push gates,
  session-close acknowledgments, codification commits): per-
  anchor explicit verdict. Founder fired explicit verdicts at
  chunk B2-1 / B2-2 commit + push gates per (C-ii) bundled-
  explicit shape — bundled-explicit IS itself per-anchor-
  explicit at clean-termination if founder names the action
  explicitly.

The taxonomy refinement holds going forward: session-start
anchor locks reclassify from clean-termination to
intermediate-class per founder operating model; push gates +
session-close acknowledgments + codification commits remain
clean-termination class per per-anchor explicit verdict
requirement.

Cross-arc N=2 graduation criterion: pending future session
opening with same operating model. Within-session (R-iii)
advancement counts toward codification refinement;
codification at session-close gate alongside other carry-
forwards.

#### (C-ii) bundled-explicit commit+push at chunk B2-2 commit gate

Founder verdicted (C-ii) bundled-explicit commit+push at chunk
B2-2 commit gate per refined (R-iii) clean-termination class.
Brainstorm-side recommendation rationale across three anchors:
operational-tempo fit at chunk-N milestone grain (single-
purpose commit closing coherent milestone; commit + push
together close the milestone) + codification-candidate signal
value (bundled-explicit-at-clean-termination at chunks B2-2 /
B2-3 / B2-4 commit gates produces N=3 datapoint for refining
(R-iii) clean-termination sub-class) + precedent alignment
with chunk B2-1 tempo-adjacent commit+push. Both sides
converged on (C-ii) via independent canonical-evidence-anchor
grounding paths.

#### Sub-shape candidates accumulated this session

- **#16-i positive instance**: within-session N=5 fires (chunk
  B2-1 contested-framing convergence + next-step Option 3 →
  Option 2 convergence + chunk B2-2 onset Sub-Q convergence +
  chunk B2-2 drafting review convergence + commit-gate (C-ii)
  recommendation convergence). Cross-arc N=2 graduates;
  within-session count accumulates monitoring without
  graduating.
- **(R-iii) gate-class-dependent shape REFINED** (codifiable
  refinement candidate per above; substantive elevation from
  monitoring to candidate-codification surface).
- **Z1 #9 length-as-calibration overshoot at brief-creation
  grain**: chunk B2-2 ran 1.6-2.7x estimate (1102 lines vs
  400-700 estimate). Within-session N=2 (chunk B2-1 1.6-2.3x +
  chunk B2-2 1.6-2.7x); cross-arc N=2 graduates; within-
  session monitoring continues. Sub-shape framing holds across
  both chunks.
- **#17-iii main-vs-worktree-lock-state divergence**: advances
  within-arc to N=8 at chunk B2-2 commit + N=9 at chunk B2-2
  push. Cumulative across both sessions: 9+ fires under
  foreign label `phase-1-document-platform-2026-05-06`.
  Cross-arc graduation defers per discipline.
- **(NEW) chunk-as-natural-session-pause-boundary candidate**:
  within-arc N=2 of "pause-at-chunk-boundary-for-clean-
  session-close" pattern (prior session paused at chunk B2-1
  + closeout cycle; this session pauses at chunk B2-2 +
  closeout cycle). Signal toward chunk-decomposition-shape (b)
  operationalization — chunks ARE the natural session-pause
  boundaries, not just structural decomposition units.
  N=1 monitoring; cross-arc N=2 graduates.

#### Foreign session-lock disposition

α-equivalent precedent extended this session at `83dd6d1`
commit + push. Foreign session-lock disposition reopens at
next-session start as founder-domain election; lock held at
`phase-1-document-platform-2026-05-06`.

#### Subagent dispatch shape

Layer 2 fired 5 parallel general-purpose subagents per Z1 #11.b
preventive verbatim re-read discipline before drafting:

1. ADR-0011 §2-§9 (entity ownership + cases lifecycle +
   polymorphic links discipline + artifacts engine-agnostic
   contract + document-type discriminator + ProposedMutation/
   Bundle/Attachment handoff + Reading B preservation +
   lifecycle immutability)
2. ADR-0013 §1-§17 (storage provider abstraction full contract
   + drift detection + failure classification + retry +
   integrity check + storage_status enum + preview-URL + audit
   logging + per-provider implementation skeletons +
   replayability) + reframe-spec §6 (verify-from-disk catch:
   §6 is polymorphic links not storage)
3. ADR-0016 §1-§12 (linked_entity_type/link_role/link_status
   enums + 756-cell pair-validity matrix + three-layer defense
   + cascade behavior + pre-commit/post-commit boundary +
   audit events)
4. ADR-0018 §1-§9 (Router scope + Tier 2.5 placement + three-
   subsystem decomposition + ledger-state candidate completion
   + ambiguity resolution + re-evaluation logic Q56 closure
   with T1-T10 + Tier 2.5 read-boundary + stale-state TOCTOU
   + ADR-0019 integration) + ADR-0007 amendment (Tier 2.5
   safety contract verbatim + Q66 closure framing)
5. ADR-0012 §1-§13 (ProposedMutationBundle full contract +
   atomicity + lifecycle + Logic Receipt + Q28 surface 4 +
   bundle types) + ADR-0011 §7 (three-proposal-type handoff
   vocabulary) + `intent_model.md` `## The Four Questions
   Grammar` (canonical phrasing)

Subagent dispatch shape preserved as forward-pattern for
chunks B2-3 / B2-4: Z1 #11.b fires preventive verbatim re-
read before drafting via parallel general-purpose subagents
(NOT Explore subagents per Explore-tool-description
prohibition on design-doc auditing); subagent prompts self-
contained for zero-context dispatch; output shape includes
verbatim citation blocks + distilled summaries + Discrepancy
flag surfacing.

#### Carry-forward to next session

- **Chunks B2-3 / B2-4** — primary next-session work product.
  Substantive content stubs at §10-§13 (B2-3: lifecycle
  immutability + exception queue + multi-entity + receipt v1
  matrix) / §14, §16, §18-§20 (B2-4: Phase A acceptance +
  ADRs produced + friction-journal scope + non-goals +
  verification).
- **Hygiene-cycle 3 deferred fixes** — γ-hygiene (DEFERRED
  per founder Anchor 2 election from prior session). Folds
  into chunk B2-N cadence OR defers further per founder elect.
- **Flag 3 governance question** — `wrong_entity_exception`
  cross-enum inconsistency triage timing founder-domain.
  Inline accommodation at §2 reserved-but-not-emitted
  continues to honor.
- **(R-iii) refinement codification candidate** — gate-class-
  dependent shape elevated from monitoring to codifiable;
  cross-arc N=2 graduation criterion pending future session
  datapoint.
- **Sub-shape candidates** — 5 candidates at varying
  cumulative monitoring counts; cross-arc N=2 graduations
  defer.
- **Memory pickup file refresh** — `project_phase_2_brief_
  creation_pending.md` content reflects post-chunk-B2-2 state
  (filename retained per filename-stability convention).
- **Foreign session-lock disposition** — α-equivalent /
  β-equivalent / other; founder-domain election at next-
  session start.

Phase 2 brief-creation arc continues at next-session opening.
Substrate-decision-integrity preserved across chunks B2-1 +
B2-2 substantive output (1666 lines aggregate / 50% arc-
completion boundary at clean termination); next-chunk onset
adjudication fires at next session.

---

### Phase 2 brief-creation arc — chunk B2-3 commit (2026-05-07) + 5 sub-shape codification candidates accumulated

Chunk B2-3 ships substantive content for §10-§13 of
`docs/09_briefs/phase-2/document_platform_initiative.md`
(lifecycle immutability + exception queue first-class
deliverable + multi-entity reservation + receipt v1 decision
matrix). Single direct-commit on staging at `d06d227` per
single-purpose-commit-discipline; **bundled commit + push** per
(C-ii) bundled-explicit founder verdict at clean-termination
gate per refined (R-iii) — `bdb0dce..d06d227` advanced on
origin/staging 2026-05-07.

#### Substantive output

616 insertions / 4 deletions. Per-section delta:

- **§10 Lifecycle immutability** (79 lines) — (κ-3) hybrid:
  verbatim 4 immutability rules per ADR-0011 §9 (`ocr_runs`
  immutable + `extraction_runs` immutable per
  `(source_document_id, ocr_run_id, extraction_version)` tuple
  + `document_relationship_candidates` versioned via
  `supersedes_candidate_id` + post-commit
  `source_document_links` require reversal-or-supersession);
  schema-layer + service-layer two-layer enforcement; Q69
  forward-pointer to ADR-0014 for replay-supersession cadence
  (boundary-vs-cadence axis preserves substrate-decision-
  integrity).
- **§11 Exception queue first-class deliverable** (212 lines)
  — (λ-3) hybrid: verbatim 16-value `resolution_action` enum
  (Q68 closure) + v1-active 8 + reserved-but-not-emitted 8 +
  first-class deliverable framing (queue is bulk of v1's user-
  visible work) + 4 first-class requirements (document-type-
  aware actions + reclassification + bulk operations +
  screenshot-gate ratification) + reserved-value handling for
  v1 manual workflows (route to AP/Spend manual entry; row
  not closed via reserved action); substrate-vs-domain
  placement boundary; **Tier-capability framing with semantic
  clarification** (split per chunk B2-1 §4 δ-2-i lock + ADR-
  0007 Tier semantics) + resolution-action capability mapping
  (Tier 1 capability dependent state-changing / Tier 1
  substrate-metadata writes / Tier 3 routing decisions / Cross-
  domain handoff).
- **§12 Multi-entity reservation** (87 lines) — (μ-3) hybrid:
  verbatim 5 reserved nullable columns per ADR-0011 §10
  (`source_documents.legal_entity_id`,
  `bills.legal_entity_id`, `bill_lines.benefiting_entity_id`,
  `payments.paying_entity_id`, `payments.benefiting_entity_id`)
  + v1's 1-1 default to `org_id` + intercompany due-to / due-
  from out-of-scope framing + substrate-now-enforcement-later
  cross-pattern (D6 §6.8 + ADR-0010 amendment Variant A) +
  three-layer ADR-0010 defense.
- **§13 Receipt v1 decision matrix** (246 lines) — (ν-3)
  hybrid: verbatim Scenarios A/B/C contracts per ADR-0015
  Decision item 7 (A receipt-as-payment-evidence
  ProposedAttachment / B receipt-as-payment-trigger
  ProposedMutation / C standalone POS born-paid bundle
  exception-queue manual workflow); lifecycle synthesis
  (canonical states from `mutation_lifecycle.md`); classifier-
  side cross-reference to ADR-0014 §7 (Tier A/C/D + per-
  document-type confidence thresholds Q65 v1 provisional);
  dedup-by-hash idempotency cross-reference to ADR-0014 §6
  (Q70 closure).

#### Citation-anchor corrections inlined silently

- **ADR-0015 Decision item 7 (NOT §15)** — ADR-0015 uses
  Decision-item numbering under `## Decision` header; "§15"
  inside ADR-0015 refers to **reframe-spec §15**, not an
  ADR-0015 §15. Same shape as ADR-0016 / ADR-0018 Decision-
  item-numbering convention (chunk B2-2 dispatch findings).
- **ADR-0011 §10 (NOT §17)** — same correction as chunk B2-1
  §2 multi-entity inlined silently per pattern parity. §17
  is reframe-spec anchor; ADR-0011 re-anchored at §10.
- **ADR-0014 §6 + §7 §-numbering CONFIRMED** correct (NOT
  off-by-one as previously suspected at chunk B2-2). §6
  dedup-by-hash + §7 classification strategy per Q70 + Q71
  closures.

#### Substantive Flag surfacings

- **Flag 3 wrong_entity_exception cross-enum question** —
  carry-forward at §11 + §12 (per chunk B2-1 §2 precedent).
  Within-arc cumulative N=3 (chunks B2-1 §2 + B2-3 §11 +
  B2-3 §12).
- **Flag 4 (NEW) manual_born_paid_workflow cross-enum
  question** — surfaced at §11 + §13 (sibling to Flag 3).
  ADR-0015 Decision item 7 cites "reserved per ADR-0010; full
  enum membership owned by ADR-0011 §13" but ADR-0011 §13's
  16-value `resolution_action` enum does NOT list
  `manual_born_paid_workflow`. Three interpretation paths
  surfaced for founder triage at cross-arc closeout. Within-
  arc cumulative N=2 (chunks B2-3 §11 + B2-3 §13).

Cumulative cross-enum-inconsistency surface count = N=5
within-arc; projects to N=6+ at chunk B2-4 §16 (ADRs produced
inventory). Joint framing under "cross-enum-consistency
governance question" recommended at cross-arc closeout
firing-point.

#### Substantive interpretive clarification at §11

**Tier 2 substrate framing semantic clarification.** Chunk
B2-1 §4 δ-2-i lock used "Tier 2 substrate" to mean data-
layer entity ownership; ADR-0007 §Tier 2 strict reading
prohibits Tier 2 writes (lines 180-181: "MUST NOT INSERT /
UPDATE / DELETE in any table directly"). §11 drafting
clarifies inline:

- **Tier 2 (data-layer entity ownership)**: where the entity
  columns live in the Document Platform data layer (per
  ADR-0011 §1 entity ownership boundary).
- **Tier 2 (agent-tier execution)**: which agent tier
  executes a write per ADR-0007 §Tier 2 strict no-write rule.

Substrate-metadata writes (`mark_duplicate`,
`mark_non_accounting`, `archive` updating queue-row state)
route through Tier 1 commits via `withInvariants()` — non-
financial-state but still Tier-1-executed. The "Tier 2
substrate" framing in chunk B2-1 §4 means the first sense
(entity ownership), NOT the second sense (execution).

This clarification is itself a codification candidate at
session-close (Sub-shape candidate 1 below).

#### Substantive locks honored across §10-§13

- Reading B preservation reaffirmed in §10, §11, §13
- Single-writer rules: `documentLinkService` for
  `source_document_links` (§10); `ledgerService` for
  `journal_entries` via domain services (§11, §13)
- Substrate-now-enforcement-later cross-pattern (D6 §6.8 +
  ADR-0010 amendment Variant A) cited at §11 reserved-action
  handling + §12 multi-entity column activation
- Three-layer ADR-0010 defense applied at §12 multi-entity
  reservation
- Manual + automated path uniformity preserved at §13
  Scenario C (per ADR-0012 §11)

#### Length-as-calibration NEW datapoint

Chunk B2-3 fired AT estimate (~624 lines / 470-850 Sub-Q
estimate = 0.7-1.3x range). Contrast with chunks B2-1
(1.6-2.3x) + B2-2 (1.6-2.7x). Substrate-honest finding: Z1
#9 length-as-calibration overshoot is **enum-density / matrix-
density dependent at brief-creation grain, NOT uniform**.
Chunks B2-1 + B2-2 had high-density enum sections (B2-1 §2
reserved-but-not-emitted enumeration; B2-2 §7 polymorphic
links 756-cell matrix); chunk B2-3 has bounded-substrate
sections (4 rules + 5 columns + Scenarios A/B/C contracts) —
no enum/matrix-density driver fires here. Refinement
candidate: Sub-shape candidate 4 below.

#### 5 sub-shape codification candidates accumulated this arc

Per Anchor C tiering: chunk-grain accumulation-status surface
THIS session (this entry); arc-grain firing decisions at
arc-level closeout NEXT session.

1. **(NEW) Tier 2 substrate sense-disambiguation** — chunk
   B2-3 §11 surfaced. Path forward: brief glossary entry
   (path a) + friction-journal codification (path b) at
   session-close. ADR-0007 amendment (path c) deferred as
   conditional-future-action contingent on cross-arc closeout
   amendment-arc election.
2. **Cross-enum-consistency governance question** (Flag 3 +
   Flag 4 joint framing). Within-arc cumulative N=5 (Flag 3
   N=3 + Flag 4 N=2); projects to N=6+ at chunk B2-4 §16.
   Cross-arc closeout firing-point. ADR-0011 amendment
   candidate (potentially bundled with Tier 2 sense-
   disambiguation if amendment-arc fires).
3. **(NEW) ADR Decision-item-vs-§-numbering convention** —
   chunk B2-3 surfaced via 4 ADR distillation comparison.
   Temporal pattern: earlier ADRs (0007/0011/0013/0014) use
   §-numbering; later ADRs (0012/0015/0016/0018) use
   Decision-item numbering. Friction-journal codification
   scope; convention-going-forward applies to NEW ADRs only;
   NO retroactive retrofit per δ-i preservation.
4. **Z1 #9 refined sub-shape (enum-density / matrix-density
   dependent)** — refinement candidate. Within-arc N=3
   datapoints (B2-1 + B2-2 fire it; B2-3 doesn't). If B2-4
   fires within-estimate, graduates with within-arc N=4
   datapoints (3 confirming + 1 predicting). Founder-elect on
   shape-refinement-via-within-arc-evidence-basis pathway as
   graduation criterion.
5. **(NEW) Shape-refinement-via-within-arc-evidence-basis** as
   meta-codification candidate — distinct from Z1 #9
   refinement itself. Codifies graduation-pathway shape:
   within-arc evidence basis valid for shape-refinement (vs
   new-shape) graduation. Standard cross-arc N=2 graduation
   criterion may not apply to refinement-graduation if within-
   arc evidence is sufficient. Founder-domain election scope.

Plus carry-forward **(R-iii) gate-class-dependent shape
codifiable refinement candidate**: cross-arc N=2 graduation
criterion = THIS session operating under same model. This
session validated refined model across 7 gate fires; refined
(R-iii) graduates at session-close from codifiable refinement
candidate to codified discipline if no operational gaps in
gate-class taxonomy fire.

#### Foreign session-lock disposition

α-equivalent precedent extended this session at `d06d227`
commit + push. Foreign session-lock disposition reopens at
next-session start as founder-domain election; lock held at
`phase-1-document-platform-2026-05-06`. α-equivalent now at
N=15+ cumulative across three sessions; brainstorm-side non-
prejudicing observation: β-equivalent rotation increasingly
viable as hygiene action; founder-domain election remains.

#### Subagent dispatch shape

Layer 2 fired 4 parallel general-purpose subagents per Z1
#11.b preventive verbatim re-read discipline before drafting:

1. ADR-0011 §9 + §10 + §13 (mandatory for §10 + §11 + §12)
2. ADR-0015 Decision item 7 + ADR-0014 §6/§7 (mandatory for
   §13 + cross-ref for classifier-side `payment_confirmation`
   handling)
3. ADR-0012 envelope shapes (Scenario A/B/C distinguishing
   characteristics for §13)
4. ADR-0007 Tier framing (Tier 3 explicit "exception
   explanation" ownership for §11 UI surface; substrate-
   metadata writes Tier 1 capability dependency clarification)

Subagent dispatch shape preserved as forward-pattern for
chunk B2-4: bounded-substrate sections likely warrant 2-3
subagents (vs 4 here / 5 at B2-2 / 4 at B2-1) given §14 +
§16 + §18-§20 scope.

#### Carry-forward to next session

- **Chunk B2-4** — primary next-session work product. Final
  5 substantive content stubs at §14 (Phase A acceptance) +
  §16 (ADRs produced) + §18 (friction-journal scope) + §19
  (NOT-doing) + §20 (verification against canonical docs).
- **Arc-level closeout cycle** — fires AFTER chunk B2-4
  commits + pushes. Arc retrospective + 5 sub-shape codifi-
  cation candidate firing decisions + (R-iii) graduation
  decision + cross-enum-consistency governance question
  triage timing.
- **Hygiene-cycle 3 deferred fixes** — γ-hygiene (DEFERRED
  per founder Anchor 2 election from earlier session). Folds
  into chunk B2-4 cadence OR cross-arc closeout per founder
  elect.
- **Memory pickup file refresh** — `project_phase_2_brief_
  creation_pending.md` content reflects post-chunk-B2-3
  state (filename retained per filename-stability convention).
- **Foreign session-lock disposition** — α-equivalent /
  β-equivalent / other; founder-domain election at next-
  session start (Anchor D from this session's restate-window
  carries forward).

Phase 2 brief-creation arc continues at next-session opening.
Substrate-decision-integrity preserved across chunks B2-1 +
B2-2 + B2-3 substantive output (2290 lines aggregate / 75%
arc-completion boundary at clean termination); chunk B2-4 +
arc-level closeout cycle fires next session per Anchor B
deferral.

---

### Phase 2 brief-creation arc — chunk B2-4 commit (2026-05-07) + arc substantive output complete + 8 firing decisions opening at arc-closeout next session

Chunk B2-4 ships substantive content for §14 + §16 + §18-§20 of
`docs/09_briefs/phase-2/document_platform_initiative.md` (Phase A
acceptance criteria + ADRs this initiative produces inventory +
friction-journal scope + non-goals + verification against
canonical docs). Single direct-commit on staging at `ab0c350` per
single-purpose-commit-discipline; **bundled commit + push** per
(C-ii) bundled-explicit founder verdict at clean-termination gate
per refined (R-iii) — `ccca74c..ab0c350` advanced on
origin/staging 2026-05-07.

**Phase 2 brief-creation arc substantive output COMPLETE.** Brief
skeleton 0 stubs remaining; full §1-§21 substantive content
shipped across 4 chunks. Aggregate arc contribution: ~2756 lines
drafted across chunks B2-1 (564) + B2-2 (1102) + B2-3 (624) +
B2-4 (466). Arc-level closeout cycle (arc retrospective + 8
firing decisions) opens fresh next session per
**(arc-close-next-session)** founder verdict at next-step
election gate.

#### Substantive output

471 insertions / 5 deletions (5 deletions = 5 stub `[Stub — ...]`
lines replaced; chunk B2-4 commit is purely additive-with-stub-
replacement). Per-section delta:

- **§14 Phase A acceptance criteria** (~199 lines) — (ξ-locked)
  compositional-weighting across three substrate axes: verbatim
  spine-acceptance from distributed ADR-0011 sources (Closes
  Q-closures Q53/Q54/Q67/Q68/Q73/Q75/Q76 + What this constrains
  5 non-negotiable rules + §12 Q28 matrix v1 ship gate per Q77 +
  §13 exception queue first-class deliverable + What this costs
  Phase distribution); summary consumption-shape from ADR-0015
  (7 consumption surfaces + 3 consumed-but-not-owned via
  ADR-0016 / ADR-0018 / ADR-0019); cross-reference framing-
  pattern from D6 §6.8 substrate-now-enforcement-later cross-
  pattern (6-instance Phase 0 robustness + 3 Phase 1 deferred-
  obligation triggers Q29 / Q77 / Q79).
- **§16 ADRs this initiative produces** (~91 lines) — (ο-locked)
  verbatim-keep-and-expand 7-ADR inventory with γ-1 forward-
  looking per-ADR descriptions. ADR-0011 row carries (o-1-α)
  per-row inline amendment-status note with substrate-anchored
  framing referencing concrete ADR-0011 §13 ↔ ADR-0015 §7 (Q74
  Scenario C closure) `manual_born_paid_workflow` registration
  gap.
- **§18 Friction-journal scope** (~14 lines) — (π-locked)
  "Document Platform Initiative" arc name with placeholder slug
  `arc-document-platform-initiative`; first operational instance
  of `<Subject> Initiative` template at friction-journal grain
  (Spend Initiative arc has not started; precedent lives in
  Spend brief §16 placeholder).
- **§19 What this initiative does NOT do** (~31 lines) —
  (ρ-locked) verbatim-preserve 5 core non-goals + silent-
  correction "AP/Spend brief content" → "Spend brief content" +
  1 load-bearing addition: explicit non-goal capturing Reading B
  preservation surface ("does not execute ledger-side substrate
  writes — Document Platform proposes mutations; domain services
  produce ledger operations; ledgerService is sole writer of
  `journal_entries` and `journal_lines`"). Total 6 non-goals.
- **§20 Verification against canonical docs** (~135 lines;
  drafted LAST per within-chunk sequencing dependency) — (σ-1
  locked) precedent-honoring derivation per Spend brief §18
  shape: flat per-canonical-doc list with absolute paths +
  verification notes + §-cross-references; ordering by
  canonical-doc location; lead-in clause matches Spend brief
  precedent verbatim; trailing summary; "direct read" attestation
  per file. 35 canonical-doc entries; all paths verified on disk
  pre-commit.

Brief total post-chunk-B2-4: 2944 lines (was 2478 pre-B2-4).

#### Citation-anchor corrections inlined silently

Per chunk B2-1 / B2-2 / B2-3 silent-correction precedent:

- **AP brief filename = `spend_initiative.md`** (NOT
  `ap_spend_initiative.md` / `ap_ingestion_initiative.md`;
  renamed 2026-05-02 per Document Platform reframe). Subject =
  "Spend" (NOT "AP/Spend Subdomain" — the AP/Spend Subdomain
  label survives as ADR-0015 ratified-name only). Cross-
  references to AP brief in §19 + §20 use canonical filename.
- **Spend brief §18 = "Verification against canonical docs"**
  (deliberate departure from §1-§21 default layout per Spend
  brief preamble). Document Platform brief §20 retains §1-§21
  default layout shape (verification at §20, not §18).

#### Substantive Flag surfacings

- **Concrete substrate evidence: `manual_born_paid_workflow`
  registration gap** surfaced concretely at §16 ADR-0011 row
  inline amendment-status note. Cross-enum-consistency cumulative
  within-arc N=6 (Flag 3 `wrong_entity_exception` N=3 chunks
  B2-1 §2 + B2-3 §11 + B2-3 §12; Flag 4
  `manual_born_paid_workflow` N=3 chunks B2-3 §11 + B2-3 §13 +
  B2-4 §16). Resolution paths carry-forward to arc-closeout
  governance triage (4 paths total):

  - **(a)** ADR-0011 amendment to extend the enum — full enum
    extension (lifts editorial-gap reading)
  - **(b)** ADR-0015 amendment to drop the value — alternate
    path
  - **(c)** New inter-ADR registration discipline — codifies
    cross-reference reading as governance pattern
  - **(d)** ADR-0011 §13 amended with inline cross-reference
    note ("extensions cross-referenced from downstream ADRs
    (ADR-0015 emits `manual_born_paid_workflow` per Decision
    item 7)") without enum-membership amendment — lighter than
    (a) full enum extension; codifies (a) reading via
    amendment-via-clarification

  Path (d) added during chunk B2-4 onset Sub-Q surfacing per
  brainstorm-side parallel input.

- **Stale subject-name ref carry-forward** — chunk B2-1 §1
  motivation (line 4) carries "AP/Spend Initiative" subject-name
  ref where canonical naming is "Spend Initiative". Per δ-i
  preservation NO retroactive edit; carry-forward governance
  observation for arc-closeout discussion. Two interpretation
  paths:
  - **(line-4-i)** Drafting-time inadvertent stale ref —
    chunk B2-1's Z1 #11.b dispatch may not have covered AP
    brief canonical filename verification (because chunk B2-1's
    §1-§4 substrate didn't directly require AP brief
    reference). Z1 #11.b discipline observation if true.
  - **(line-4-ii)** Drafting-time deliberate composite framing
    — "AP/Spend" as composite reference for the broader
    subdomain. Subject-naming-convention observation if true.

  Disposition optional at arc-closeout founder discretion.

#### Substantive interpretive clarifications

- **§16 ADR-0011 row substrate-anchored note framing** — count-
  specific (with N=6+) vs count-omitted vs substrate-anchored
  framing options were surfaced during chunk B2-4 onset Sub-Q
  surfacing. WSL-side updated lean from count-omitted to
  substrate-anchored per concrete substrate finding. Substrate-
  anchored framing references verifiable ADR-vs-ADR registration
  gap rather than abstract within-arc cumulative-signal
  accounting; preserves §16's per-row signal-completeness without
  arc-history dependency.

#### Substantive locks honored across §14 / §16 / §18 / §19 / §20

- **Reading B preservation** reaffirmed in §14 (no Document
  Platform write to ledger tables non-negotiable rule) + §19
  (does not execute ledger-side substrate writes; sole-writer
  rule cited). Within-arc Reading B preservation count at arc-
  completion: **8+ explicit references** across §1 motivation
  through §19 non-goal — substantive substrate-decision-
  integrity-density. Readers can reconstruct Reading B
  discipline from any chunk's substantive content without
  dependency on arc-history.
- **Single-writer rules**: `documentLinkService` for
  `source_document_links` (§16 ADR-0016 row); `ledgerService`
  for `journal_entries` via domain services (§14, §19);
  `storageProviderService` for storage backends (§16 ADR-0013
  row).
- **Substrate-now-enforcement-later cross-pattern (D6 §6.8)**
  framing in §14 with 6-instance Phase 0 robustness + 3 Phase 1
  deferred-obligation triggers (Q29 ESLint at first
  `src/agent/pipelines/**/*` code; Q79 INV-DOC-001 at first
  DOC-citing code; Q77 Q28 matrix at v1 ship).
- **Three-layer ADR-0010 defense** applied at §16 ADR-0013 /
  ADR-0014 / ADR-0019 inventory rows (reserved-enum-states
  discipline inheritance).

#### Length-as-calibration NEW datapoint — within-arc N=4 evidence basis

Chunk B2-4 fired **moderate overshoot** (1.17-2.33x against
200-400 line aggregate naive estimate; midpoint ~1.55x). Despite
session-start projection of bounded-substrate within-estimate
firing, two density-drivers fired overshoot:

- **§14 synthesis-density** (~199 lines) — 3 substrate axes × 5
  distributed ADR-0011 sources × 7 ADR-0015 consumption surfaces
  + 6-instance cross-pattern enumeration + 3 Phase 1 deferred-
  obligation triggers
- **§20 verification-list-density** (~135 lines) — 35 canonical-
  doc entries × per-entry path + verification note + §-cross-
  reference

Combined §14 + §20 = 334 lines = 71% of chunk B2-4 aggregate;
§16 + §18 + §19 = 136 lines = 29%. Distribution **bimodal** —
not uniform.

**Refined-refined Z1 #9 sub-shape candidate**: "Z1 #9 length-as-
calibration overshoot fires when chunk includes ANY density
driver (enum / matrix / synthesis / verification-list); bounded-
substrate without any density driver → no overshoot."

**Within-arc N=4 datapoint table**:

| Chunk | Estimate | Actual | Multiplier | Density driver |
|---|---|---|---|---|
| B2-1 | 250-350 | 564 | 1.6-2.3x | Enum density (§2 reserved-but-not-emitted) |
| B2-2 | 400-700 | 1102 | 1.6-2.7x | Matrix density (§7 polymorphic links 756-cell matrix) |
| B2-3 | 470-850 | 624 | 0.7-1.3x | None (bounded-substrate) |
| B2-4 | 200-400 | 466 | 1.17-2.33x | Synthesis density (§14) + verification-list density (§20) |

3 fire (B2-1 + B2-2 + B2-4) + 1 doesn't fire (B2-3). Pattern
preserves (e) shape-refinement-via-within-arc-evidence-basis
meta-pathway graduation criterion.

**Traversal-multiplication meta-pattern** — the four density-
driver shapes decompose into a structural pattern: each is
"section-internal-content-multiplication via traversal over a
structured input":

- Enum density: substrate = single enum; content = per-value
  enumeration with framing per row
- Matrix density: substrate = single matrix definition; content
  = per-cell enumeration with framing per cell
- Synthesis density: substrate = multiple distributed sources;
  content = per-source treatment with cross-axis weighting
- Verification-list density: substrate = single canonical-doc
  list; content = per-entry path + verification note + §-cross-
  reference

Bounded-substrate sections without traversal-multiplication
produce content proportional to substrate size; sections with
traversal-multiplication produce content proportional to
substrate-size × per-element-content-density.

**Translation-gap discipline-shape refinement candidate** —
traversal-axis-recognition exists at Sub-Q surfacing time
(chunk B2-4 §14 synthesis-traversal recognized at Sub-Q ξ;
chunk B2-4 §20 verification-list-traversal recognized at Sub-Q
σ) but length-budget translation deferred to drafting time,
producing reactive overshoot. Discipline-shape refinement that
prevents reactive overshoot operates at Sub-Q surfacing gate:
surface traversal-axis + estimate per-element-content-density +
multiply for length-budget projection. Integrates Z1 #9 length-
projection into Sub-Q surfacing operationally rather than
treating it as separate post-Sub-Q activity.

Logged for arc-closeout codification scope as candidate (d)
refined-refined sub-shape graduation framing.

#### β-equivalent rotation event at Anchor 2 lock

Foreign session-lock disposition at Phase 0 anchor lock fired as
**β-equivalent rotation per (β-i) conceptual-only operational
shape**. Operational interpretation:

- WSL-side rotated local session-posture to fresh label-
  equivalent stance; foreign session-lock at
  `chounting-worktrees/phase-1-document-platform/.coordination/
  session-lock.json` (held under `phase-1-document-platform-
  2026-05-06`) NOT modified, NOT cleared, NOT PID-investigated
- No local session-lock artifact created in main worktree per
  (β-i) "conceptual-only" framing — no filesystem-state
  correlate
- Documentary record absorbed at chunk B2-4 closeout entry
  chunk-grain firing-point per (β-i) discipline

α-equivalent precedent count at session-start: N=16+ cumulative
across three sessions. β-rotation event at Anchor 2 lock closes
the α-equivalent stance for this session; arc-completion records
under β-equivalent stance going forward this session.

**Soft session-lock warning expected per-commit under (β-i)** —
the coordination hook surfaces "no session lock in use; consider
running scripts/session-init.sh <label>" warning at every commit
this session because no local artifact exists. This is
structurally precise per (β-i) framing — "conceptual-only" means
coordination hook reads no local lock. Non-blocking; expected
behavior under locked operational shape. Logged as observation;
not surfaced as separate codification candidate.

#### Arc-completion observations (forward-pointers for arc-closeout codification)

- **Bimodal distribution at arc-completion chunks structural
  pattern** — chunk B2-4's §14 + §20 = 71% of aggregate vs §16
  + §18 + §19 = 29%. Brainstorm-side observation: arc-completion
  chunks may structurally favor bimodal distribution because
  their content-axis spans across-arc-scope (§14 acceptance
  synthesizes across arc-wide substrate; §20 verifies across
  arc-wide canonical-doc citation graph) rather than within-
  chunk-scope. Both sections operate at arc-grain even though
  they ship in chunk-grain commit. Possibly relevant under
  candidate (f) Sub-Q axis taxonomy refinement scope.

- **Reading B preservation density at arc-completion** — 8+
  explicit references across all 4 chunks (B2-1 §1 + B2-2 §6 /
  §7 / §9 + B2-3 §10 / §11 / §13 + B2-4 §14 / §19) anchor
  Reading B discipline at multiple natural firing-points. Brief
  produces Reading B preservation evidence at arc-grain via
  chunk-grain section coverage — arc-output-quality property
  worth flagging. Possibly relevant under arc-cadence meta-
  codification candidate.

- **Arc-class first-instance status framing** — Phase 2 brief-
  creation arc is the first multi-chunk brief-creation arc in
  chounting's history (Phase 1.Storage was implementation arc;
  Phase 0 was governance arc; both shipped per their own
  discipline-shapes). Arc-output-quality properties surfaced
  this arc are first-instance observations, NOT pattern-stable
  observations. Codification candidates surfaced this arc are
  forward-pointers for FUTURE brief-creation arcs (Spend
  Initiative implementation arc; subsequent phases' briefs),
  not pattern-stable codifications across multiple brief-
  creation arcs. Brainstorm-side preliminary lean: at arc-
  closeout codification, frame candidates explicitly as "first-
  arc-instance pattern observations forward-pointing to
  subsequent brief-creation arcs" rather than "pattern-stable
  codifications." Preserves substrate-decision-integrity by
  acknowledging within-arc-evidence-basis nature without
  overclaiming pattern-stability.

#### Subagent dispatch shape

Layer 2 fired 3 parallel general-purpose subagents per Z1 #11.b
preventive verbatim re-read discipline before drafting:

1. ADR-0011 acceptance-equivalent distributed sources (mandatory
   for §14 verbatim spine-acceptance axis) + amendment-status
   framing context for §16 ADR-0011 row
2. ADR-0015 Document Platform consumption shape (mandatory for
   §14 summary axis) + ADR-0012 / ADR-0013 / ADR-0014 / ADR-0016
   / ADR-0018 / ADR-0019 inventory-row description anchors for
   §16 γ-1 forward-looking per-ADR descriptions
3. D6 §6.8 substrate-now-enforcement-later (mandatory for §14
   cross-reference framing-pattern axis) + AP Ingestion
   Initiative arc-name precedent verification (Sub-Q π fast-path
   confirmation) + AP brief §18 precedent shape verification
   (§20 derivation-mechanics substrate)

Subagent dispatch within-arc cumulative count: 4 (B2-1) + 5
(B2-2) + 4 (B2-3) + 3 (B2-4) = **16 subagents fired across arc**
preventively. Z1 #11.b graduated codification (per memory carry-
forward + session-start standing rules) operationally validated
across the arc — within-arc 16-fire cumulative + cross-session
pattern-stability evidence basis demonstrates discipline-shape
stability.

#### 8 firing decisions opening at arc-closeout next session

Per (arc-close-next-session) founder verdict at next-step
election gate, arc-grain codification surface opens fresh next
session. Firing decisions accumulated this arc:

1. **(a) Tier 2 substrate sense-disambiguation** — brief
   glossary entry + friction-journal codification at arc-
   closeout. ADR-0007 amendment (path c) deferred as conditional-
   future-action contingent on cross-arc closeout amendment-arc
   election.
2. **(b) Cross-enum-consistency governance question (Flag 3 +
   Flag 4 joint)** — within-arc cumulative N=6; concrete
   substrate evidence at §16 ADR-0011 row inline note. 4
   resolution paths (a / b / c / d) for arc-closeout governance
   triage; founder-domain election scope.
3. **(c) ADR Decision-item-vs-§-numbering convention** —
   friction-journal codification scope; convention-going-forward
   applies to NEW ADRs only per δ-i preservation; NO retroactive
   retrofit.
4. **(d) Z1 #9 refined-refined sub-shape** — any-density-driver
   framing (enum / matrix / synthesis / verification-list);
   within-arc N=4 datapoint refinement-evidence basis (3 fire +
   1 doesn't fire). Cross-arc graduation candidate via shape-
   refinement-via-within-arc-evidence-basis pathway. Translation-
   gap discipline-shape refinement sub-candidate logged.
5. **(e) Shape-refinement-via-within-arc-evidence-basis meta-
   codification candidate** — graduation-pathway shape
   codification; distinct from Z1 #9 refinement itself. Founder-
   domain election scope.
6. **(f) (NEW) Sub-Q axis taxonomy refinement when stubs carry
   pre-stub-prefiguration text** — concrete-shape codification
   at brief-creation grain. Chunk B2-4 first-instance under this
   candidate; cross-references (e) meta-pathway.
7. **(R-iii) gate-class-dependent shape graduation** — cross-arc
   N=2 graduation criterion validated this session via within-
   session N=11 coherent gate fires. Graduates at arc-closeout
   from codifiable refinement candidate to codified discipline.
8. **Arc-cadence meta-codification candidate** — single-chunk-
   per-session at brief-creation grain + chunk-closeout + arc-
   closeout codification tiering. Within-arc N=4 stable cadence
   (chunks B2-1 + B2-2 + B2-3 + B2-4 = 4 chunks, 4 sessions, +
   pending arc-closeout 5th session).

Plus carry-forward governance items:

- **Cross-enum-consistency governance triage** — founder-domain
  election at arc-closeout (4 paths a/b/c/d)
- **Foreign session-lock disposition next-session** — arc-
  closeout retrospective records arc-closure under "N=16 α-
  equivalent cumulative + β-rotation event at Anchor 2 lock"
  per (β-i) conceptual-only documentary record
- **Hygiene-cycle 3 deferred fixes** — γ-hygiene; defer-further
  to Phase 5 first-domain consumer arc onset OR Phase 1.Storage
  re-open (whichever fires first) per Anchor 4 lock

#### Carry-forward to next session — arc-closeout cycle

- **Arc retrospective** — full Phase 2 brief-creation arc across
  4 chunks; aggregate ~2756 lines drafted; cross-arc patterns
  observed; arc-class first-instance framing for subsequent
  brief-creation arcs
- **8 firing decisions** — per inventory above; founder-domain
  triage timing
- **(R-iii) graduation decision** — cross-arc N=2 graduation
  criterion validated; codifies as discipline at arc-closeout
- **Cross-enum-consistency governance question triage timing**
  — founder-domain election (paths a/b/c/d)
- **Foreign session-lock disposition next-session election** —
  Anchor D shape; β-equivalent / continue-β-equivalent / other
- **Hygiene-cycle 3 deferred fixes** — defer-further to Phase 5
  first-domain consumer arc onset OR Phase 1.Storage re-open
  per Anchor 4 lock
- **Memory pickup file refresh** — `project_phase_2_brief_
  creation_pending.md` content reflects post-arc-substantive-
  output state pending arc-closeout

Phase 2 brief-creation arc substantive output complete; arc-
level closeout cycle (arc retrospective + 8 firing decisions)
fires next session per (arc-close-next-session) founder verdict
at next-step election gate. Substrate-decision-integrity
preserved across chunks B2-1 + B2-2 + B2-3 + B2-4 substantive
output (~2756 lines aggregate / 100% arc-completion-substantive
at clean termination); arc-grain codification opens fresh next
session.

---

### Phase 2 brief-creation arc-closeout retrospective entry (2026-05-08) + 8 firing decisions outcomes + arc-class first-instance status framing + Phase 2 → Phase 5 transition planning forward-pointers

This entry is the arc-grain documentary record for the Phase 2
brief-creation arc-closeout cycle (Stage 5 retrospective entry
per founder-provided 7-stage framework). Closes the Phase 2
brief-creation arc with all 8 firing decisions locked + ancillary
observations integrated + arc-class first-instance status framing
applied. Arc-closeout cycle fires this session as 5th session per
(arc-close-next-session) founder verdict at chunk B2-4 next-step
election gate.

#### Aggregate arc metrics

Phase 2 brief-creation arc — **first multi-chunk brief-creation
arc in chounting's history**. 4 substantive chunks + 4 chunk-grain
closeout entries shipped across 4 sessions; arc-closeout cycle
fires this session as 5th session.

| Chunk | Sections | Substantive commit | Closeout commit | Lines drafted |
|---|---|---|---|---|
| B2-1 | §1-§4 | `5a00671` 2026-05-06 | `0d052c1` 2026-05-06 | 564 |
| B2-2 | §5-§9 | `83dd6d1` 2026-05-07 | `bdb0dce` 2026-05-07 | 1102 |
| B2-3 | §10-§13 | `d06d227` 2026-05-07 | `ccca74c` 2026-05-07 | 624 |
| B2-4 | §14, §16, §18-§20 | `ab0c350` 2026-05-07 | `35367a9` 2026-05-07 | 466 |
| **Aggregate** | **§1-§21 substantive** | | | **~2756** |

Brief at 2944 lines / 0 stubs remaining; full §1-§21 substantive
content shipped. Arc-closeout cycle this session ships 2 commits
per (stage-β-i) split-same-session shape: retrospective entry
(this commit) + codification artifacts (subsequent commit).

#### 8 firing decisions outcomes

Per founder-provided 7-stage framework, 8 firing decisions locked
across Stages 2 + 3 + 4 (graduations + sub-shape codifications +
governance triage). Outcomes recorded below per-decision with
locked verdicts + codified forms + refinements absorbed.

##### Decision 7 — refined (R-iii) gate-class-dependent shape graduation (Stage 2a)

**Verdict**: GRADUATED from codifiable refinement candidate to
codified discipline.

**Graduation criterion satisfaction**: cross-arc N=2 satisfied via
within-session N=14 coherent gate fires (chunk B2-4 substantive
content session) + (β-i) operational-shape stability evidence
(N=2 commit fires + cross-session-boundary persistence
verification this session).

**Codified form (with refinements 1 + 3 absorbed)**:

- **Intermediate gates** → bundled-verdict-with-restate-window
  (silence-as-acceptance ratification mechanism)
- **Clean-termination gates** → per-anchor explicit verdict OR
  (C-ii) bundled-explicit at multi-action-tempo-adjacent gates
- **Gate-class-discrimination criterion** (refinement 1
  absorbed): clean-termination class fires for irreversible
  actions; intermediate class fires for reversible/correctable
  surfaces. Irreversibility surfaces in two shapes:
  - **Decision-irreversibility** — verdict lock that subsequent
    gates inherit (e.g., Stage 2 graduations; Sub-Q axis lock;
    arc-close split election)
  - **Artifact-irreversibility** — filesystem-state change that
    future verify-from-disk inherits (e.g., commit + push;
    codification artifact write; pickup file refresh)
  - Both shapes are clean-termination class; refined (R-iii)
    accommodates both (refinement 3 absorbed)
- **Arc-class first-instance status framing**: codified
  discipline as forward-pointer to subsequent brief-creation arcs
  rather than pattern-stable codification across multiple arcs

##### Decision (d) — Z1 #9 refined-refined sub-shape graduation via candidate (e) meta-pathway codification (Stage 2b)

**Verdict**: GRADUATED Z1 #9 refined-refined sub-shape via
candidate (e) meta-pathway; (e) codified by first operational use
(graduation-via-demonstrated-use shape).

**Graduation criterion satisfaction**: within-arc N=4 datapoint
refinement-evidence basis:

| Chunk | Density driver | Multiplier |
|---|---|---|
| B2-1 | Enum density (§2 reserved-but-not-emitted) | 1.6-2.3x fires |
| B2-2 | Matrix density (§7 polymorphic links 756-cell matrix) | 1.6-2.7x fires |
| B2-3 | None (bounded-substrate) | 0.7-1.3x doesn't fire |
| B2-4 | Synthesis density (§14) + verification-list density (§20) | 1.17-2.33x fires |

3 fire (B2-1 + B2-2 + B2-4) + 1 doesn't fire (B2-3); pattern
preserves (e) shape-refinement-via-within-arc-evidence-basis
meta-pathway graduation criterion.

**Codified form**:

**Z1 #9 refined-refined sub-shape (codified)**:
- Length-as-calibration overshoot fires when chunk includes ANY
  density driver (enum / matrix / synthesis / verification-list);
  bounded-substrate without any density driver → no overshoot
- **Traversal-multiplication meta-pattern**: each density-driver
  shape decomposes to "section-internal-content-multiplication
  via traversal over a structured input"
  - Enum density: substrate = single enum; content = per-value
    enumeration with framing per row
  - Matrix density: substrate = single matrix definition; content
    = per-cell enumeration with framing per cell
  - Synthesis density: substrate = multiple distributed sources;
    content = per-source treatment with cross-axis weighting
  - Verification-list density: substrate = single canonical-doc
    list; content = per-entry path + verification note + §-cross-
    reference
- **Translation-gap operational-discipline** (refinement
  candidate logged): at Sub-Q surfacing time, surface traversal-
  axis + estimate per-element-content-density + multiply for
  length-budget projection (vs deferring length-projection to
  drafting-time reactively)

**Candidate (e) meta-pathway (codified by demonstrated use)**:
- Shape-refinement graduations (refining existing shape rather
  than introducing new shape) may satisfy graduation criterion
  via within-arc N≥3 datapoints (≥2 confirming pattern + ≥1
  predicting pattern OR ≥3 confirming pattern)
- New-shape graduations require cross-arc N=2 criterion
- Distinction: shape-refinement preserves the shape's identity
  through refinement; new-shape introduces a structurally
  distinct shape
- Codification-by-demonstrated-use (refinement 2 absorbed): (e)
  is codified BY first operational use (Z1 #9 refined-refined
  graduation this gate) rather than abstract specification —
  preserves substrate-decision-integrity

##### Decision arc-cadence — meta-codification bundled (Stage 2c)

**Verdict**: CODIFIED arc-cadence meta-shape as bundled meta-
codification covering 4 internal components + implicit sub-
component + forward-pointer reception observation.

**Codified components**:

1. **Single-chunk-per-session at brief-creation grain** (within-
   arc N=3 transitions: B2-1→B2-2, B2-2→B2-3, B2-3→B2-4; each
   transition is session-boundary-respecting)
2. **Substantive-then-closeout alternating commit pattern within-
   chunk** (within-arc N=4 chunks: each chunk = substantive
   commit + closeout commit; uniform alternating)
3. **Chunk-grain vs arc-grain codification tiering** (within-arc
   N=1 arc-completion fire validating: chunk-grain absorbs chunk-
   scope content; arc-grain absorbs arc-scope content; pickup
   file's "Anchor C tiering" framing operationalized)
4. **Pickup file dual-function at arc-completion-pending state**
   (within-arc N=1 arc-completion fire: pre-arc-closeout
   scaffolding + arc-completion documentary record)

**Implicit sub-component**: founder deference + joint substantive
grounds → executor election under documented grounds operates
within (1) at executor-election abstraction level; absorbed
implicitly into bundled meta-codification.

**Forward-pointer reception observation**: subsequent brief-
creation arcs (Phase 5 first-domain consumer brief; subsequent
phases' briefs) will encounter arc-cadence codification as
established operational shape at arc-onset; cross-arc N=2
graduation criterion for arc-cadence as pattern-stable
codification accumulates over time.

Per arc-class first-instance status: codified shape framed as
forward-pointer; future arcs may refine.

##### Decision (a) — Tier 2 substrate sense-disambiguation (Stage 3a)

**Verdict**: CODIFIED Tier 2 substrate sense-disambiguation as
brief glossary entry + friction-journal codification (paths a +
b). ADR-0007 amendment (path c) absorbed via Stage 4 path (a)
bundling per cross-ADR governance review window opening.

**Codified form (with refinement 1 absorbed — cross-reference
structure)**:

Two senses codified at `docs/02_specs/glossary.md`:

- **Tier 2 (data-layer entity ownership)**: where the entity
  columns live in the Document Platform data layer per ADR-0011
  §1 entity ownership boundary. NOT to be confused with Tier 2
  (agent-tier execution).
- **Tier 2 (agent-tier execution)**: which agent tier executes a
  write per ADR-0007 §Tier 2 strict no-write rule. NOT to be
  confused with Tier 2 (data-layer entity ownership).

ADR-0007 amendment shape: **Candidate A inline at §Tier 2** (per
joint Stage 3a Observation 2 lock) — sense-disambiguation IS
clarification within existing tier; lighter shape adequate;
pattern-parity with §Read boundary / §Safety contract inline
lead-ins. Amendment placement: new bolded lead-in inserted within
§Tier 2 section.

**3rd sense observation** (per Subagent 2 Flag 4): ADR-0007 line
21 uses "Tier 2" in a 3rd sense (governance-plan task ordering).
Per Stage 4 narrow-scope discipline + Observation 1 (scope-α)
verdict, 3rd sense logged as carry-forward observation; not
absorbed into amendment scope.

##### Decision (c) — ADR Decision-item-vs-§-numbering convention (Stage 3b)

**Verdict**: CODIFIED ADR Decision-item-vs-§-numbering convention
as friction-journal codification + ADR README addendum (refinement
2 absorbed). NO retroactive retrofit per δ-i preservation.

**Codified form**:

Convention codified:
- New ADRs going forward use **Decision-item numbering** (under a
  single `## Decision` header) per ADR-0012 / 0015 / 0016 / 0018
  / 0019 precedent
- Existing ADRs preserved in current form (§-numbering preserved
  as historical artifact in ADRs 0007 / 0011 / 0013 / 0014)
- δ-i preservation: NO retroactive retrofit; convention applies
  forward-only

**Codification scope**:
- Friction-journal: this entry codifies temporal pattern (4 §-
  numbering ADRs in Phase 0 D1-D3 + 5 Decision-item ADRs from
  Phase 0 D3 forward) + forward-only convention shift
- ADR README addendum: ~5-line addition at
  `docs/07_governance/adr/README.md` documenting Decision-item
  numbering convention for new ADRs (Option α flowing paragraph
  within `## Format` section after fenced template per Subagent 3
  finding; or Option β `### Decision section structure` sub-
  header per drafting election)

##### Decision (f) — Sub-Q axis taxonomy refinement (Stage 3c)

**Verdict**: CODIFIED Sub-Q axis taxonomy refinement as concrete-
shape codification at brief-creation grain with substrate-state
discrimination criterion (refinement 3 absorbed).

**Codified form**:

Sub-Q axis taxonomy expansion when stubs carry pre-stub-
prefiguration text:

| Stub substrate-state | Applicable Sub-Q axis | Precedent |
|---|---|---|
| Bare stubs | verbatim-vs-summary | chunks B2-1 / B2-2 / B2-3 |
| Stub-prefiguration text present | verbatim-vs-expand | chunk B2-4 §16 / §19 |
| Partial-stub patterns | candidate-content-vs-discard | (forward-pointing pattern) |
| Stub points to naming precedent | naming-convention election | chunk B2-4 §18 |
| Stub points to precedent shape | precedent-honoring-vs-deviation | chunk B2-4 §20 |
| Stub spans multiple substrate sources | compositional-weighting | chunk B2-4 §14 |

Cross-references candidate (e) meta-pathway as concrete-instance
pointer (Sub-Q axis taxonomy refinement IS an instance of (e)'s
within-arc-evidence-basis graduation pathway operating).

Per arc-class first-instance status: chunk B2-4 first-instance
under this candidate; codification framed as forward-pointer to
subsequent brief-creation arcs which may encounter similar stub-
prefiguration patterns.

##### Decision (b) — Cross-enum-consistency governance triage path (a) elected (Stage 4)

**Verdict**: PATH (a) ELECTED — ADR-0011 §13 enum extension to
add `manual_born_paid_workflow` (16 → 17 values). Stage 3a path
(c) ADR-0007 amendment for Tier 2 substrate sense-disambiguation
BUNDLED via cross-ADR governance review window opening. Scope
NARROW (manual_born_paid_workflow + Tier 2 sense-disambiguation
only); broader Phase 0 review deferred.

**Path election grounds** (under abstention-lift):

- Operational accessibility for future readers (favors paths (a)
  / (b) which preserve self-contained enum reading)
- Substrate-decision-integrity-density (favors paths (a) / (b) /
  (d) which formalize the canonical-vs-distributed enum
  question)
- First-arc-instance precedent-setting weight: path (a) doesn't
  just close THIS gap; it sets the response shape for similar
  future cases. Path (a) avoids path (d)'s long-horizon
  substrate-decision-integrity erosion (forest-of-inline-notes
  trajectory).
- Within-arc evidence weight: Flag 3 + Flag 4 cumulative N=6+
  within-arc surface count materially anchors a substantive
  amendment response; favors active-amendment paths over
  deferral or consumer-side reversion.

**Bundling decision grounds**:

- Stage 3a conditional-deferral framing: "Path c (ADR-0007
  amendment) remains conditionally deferred contingent on Stage
  4 cross-enum governance triage's amendment-arc election." Path
  (a) IS the amendment-arc election that opens the contingency.
- Bundling activates the contingency at the natural firing-point;
  alternative (defer indefinitely) violates implicit conditional-
  deferral framing intent.

**Narrow scope grounds**:

- Session-budget realism: broad scope would re-open entire Phase
  0 governance substrate for amendment review at arc-closeout
- Concrete substrate evidence specificity: path (a) closes the
  specific surfaced gap (manual_born_paid_workflow) + bundles
  Stage 3a path (c) only
- Arc-class first-instance status defers broader review to
  subsequent governance opportunities (Phase 5 onset OR
  subsequent brief-creation arcs)
- Defer-broader-review preserves narrow-scope-fires-now
  operational momentum

**ADR-0011 amendment shape** (per joint Stage 3a Observation 3
lock + title-line stability refinement):

- **Dedicated `## Amendment` block** appended to ADR-0011
  (resolves `## Updates` declarative-line conflict cleanly per
  δ-i preservation; `## Updates` declares pre-amendment state;
  `## Amendment` block declares amendment event)
- Title-line stability: NO title-line revision (preserves ADR
  identifier consistency; ADR-0011 first-amendment-ever sets
  clean precedent)
- Status-header update (small): records amendment date + scope
- Cross-reference to ADR-0015 §7 emission point for
  manual_born_paid_workflow registration acknowledgment

#### Ancillary observations (10 items integrated)

Per memory pickup file's ancillary observations section + this
session's surfaces:

1. **Closeout-entry line-count progression non-monotonicity**
   (~250 / 285 / 262 / 425 across chunks B2-1 / B2-2 / B2-3 /
   B2-4) at arc-completion — structurally-driven by (arc-close-
   next-session) absorption per arc-cadence meta-codification
   scope.
2. **Bimodal distribution at arc-completion chunks structural
   pattern** — chunk B2-4 §14 + §20 = 71% of aggregate vs §16 +
   §18 + §19 = 29%; arc-grain content-axis (§14 across-arc
   substrate; §20 across-arc citation graph) vs chunk-grain
   content-axis distribution refinement.
3. **Reading B preservation density at arc-completion** (8+
   explicit references across §1 / §6 / §7 / §9 / §10 / §11 /
   §13 / §14 / §19) as arc-output-quality property — readers can
   reconstruct Reading B discipline from any chunk's substantive
   content without arc-history dependency.
4. **(β-i) operational-shape stability** across N=2 commit fires
   prior session + cross-session-boundary persistence verification
   this session (foreign session-lock bit-identical state across
   boundary). Reinforces (R-iii) graduation evidence.
5. **Within-session #16-i count progression across arc** (N≈4 →
   N≈5 → N≈6 → N=14 → N=12+ this session) signaling arc-
   completion-session density vs chunk-onset-session density;
   arc-completion sessions warrant higher within-session #16-i
   tolerance per arc-cadence meta-codification scope.
6. **Arc-class first-instance status framing for sub-shape
   candidates** (forward-pointers vs pattern-stable codifications)
   — affects how arc-closeout codification candidates are framed
   at firing-point.
7. **Stale subject-name ref carry-forward observation** (line 4
   §1 motivation per chunk B2-1; "AP/Spend Initiative" vs
   canonical "Spend Initiative"; (line-4-i) Z1 #11.b discipline
   observation if drafting-time inadvertent vs (line-4-ii)
   subject-naming-convention observation if drafting-time
   deliberate composite framing) — δ-i preservation precludes
   retroactive edit; resolution-path optional at arc-closeout
   discretion.
8. **Subagent dispatch within-arc cumulative count = 19** (4 +
   5 + 4 + 3 + 3 = 19; chunk B2-1 4 + B2-2 5 + B2-3 4 + B2-4 3 +
   arc-closeout cycle 3) as Z1 #11.b operational validation
   evidence-anchor at arc-completion grain.
9. **Substantive commit + closeout commit alternating uniform
   cadence** across all 4 chunks as arc-cadence meta-
   codification's operational manifestation; substrate-decision-
   integrity evidence for arc-cadence shape.
10. **Codify-via-demonstrated-use vs codify-via-abstract-
    specification pathway choice** (Stage 2b candidate (e) meta-
    pathway via first operational use rather than abstract
    specification) — substrate-decision-integrity-preserving
    codification shape.

**Plus this session's additional observations**:

- **Verification methodology for graduation-status questions**
  (verify-from-disk against (a) session-start brief framing + (b)
  memory pickup file candidate inventory + (c) memory pickup file
  forward-pattern notes) — small operational pattern surfaced at
  Z1 #11.b graduation status disambiguation gate prior session.
- **Cross-session-boundary persistence as load-bearing evidence**
  for (β-i) operational shape — bit-identical foreign session-
  lock state across boundary verified at Stage 0 reinforces
  (β-i) operational shape's robustness.
- **Lean-update under brainstorm-side concrete-substrate-evidence
  pattern** (Stage 5 Observation 4 (stage-α) → (stage-β-i) shift
  via cycle-grain symmetry framing) — operational pattern under
  candidate (e) shape-refinement-via-within-arc-evidence-basis
  meta-pathway operating cleanly at sub-election grain.

#### Arc-class first-instance status framing

Phase 2 brief-creation arc is the **first multi-chunk brief-
creation arc in chounting's history** (Phase 1.Storage was
implementation arc; Phase 0 was governance arc; both shipped per
their own discipline-shapes). Arc-output-quality properties
surfaced this arc are **first-instance observations**, NOT
pattern-stable observations.

**Codification framing implications**:

- Codification candidates surfaced this arc are **forward-
  pointers for FUTURE brief-creation arcs** (Spend Initiative
  implementation arc producing Spend brief refinements;
  subsequent phases' briefs)
- NOT pattern-stable codifications across multiple brief-creation
  arcs — pattern-stability evidence accumulates as subsequent
  arcs operate under codified shapes
- Cross-arc N=2 graduation criterion for arc-cadence + Z1 #9 +
  candidate (e) + candidate (f) accumulates over time;
  subsequent arc-closeout cycles re-evaluate codifications at
  higher pattern-stability grade

**Forward-pointer reception expectation**: subsequent brief-
creation arcs encounter codified shapes (refined (R-iii) +
arc-cadence + Z1 #9 refined-refined + Sub-Q axis taxonomy + Tier
2 sense-disambiguation + ADR §-numbering convention) as
established operational substrate at arc-onset; arcs operate
under codified shapes; pattern-stability evidence accumulates
across operational fires.

#### (γ-ii) Phase 2 → Phase 5 transition planning forward-pointers

Per Stage 5 retrospective entry's transition planning placement
((γ-ii) absorbed Stage 5 retrospective forward-pointers): actual
transition fires at next-arc-onset, NOT at this arc-closeout.

**Transition planning documentary record**:

Phase 2 brief-creation arc substantive output COMPLETE this
session per arc-closeout cycle. Phase 5 first-domain consumer
arc (Spend Initiative implementation per ADR-0015) opens at
subsequent session-onset OR Phase 1.Storage re-open if
implementation arcs interleave (per Anchor 4 hygiene-cycle 3
defer-further targeting — whichever fires first).

**Phase 5 onset trigger**: Phase 5 first-domain consumer arc
opens when Spend Initiative implementation work commences per
ADR-0015 Phase 5 first-domain-consumer ratification. Brief
contains Phase A acceptance criteria + ADR-0015 consumption shape
+ substrate-now-enforcement-later cross-pattern framing
informing Phase 5 implementation gates.

**Phase 1.Storage re-open trigger**: Phase 1.Storage
implementation arc may re-open if implementation gaps surface
post-Phase-2-brief-creation arc per arc-cadence meta-codification's
implementation-vs-brief-creation arc-class distinction.

**γ-hygiene-cycle 3 deferred fixes**: 3 items defer-further to
Phase 5 first-domain consumer arc onset OR Phase 1.Storage
re-open (whichever fires first) per Anchor 4 lock from chunk B2-4
substantive content session:

1. **#15 NaN-guard fix** at `clampTtl` in
   `apps/web/src/services/storage/providers/supabaseStorageProvider.ts:95-99`
2. **ADR-0013 §16 misattribution correction** in
   `supabase/migrations/20240137000000_create_source_document_with_audit_rpc.sql`
   comment header
3. **`recordMutation.ts:122-127` docstring** atomicity-claim
   rephrasing

NOT indefinite deferral; defer-further targets specific natural
firing-point (whichever consumer arc fires first).

#### Discrepancy flags surfaced this arc-closeout cycle

Per Z1 #11.b dispatch findings this Stage 5 cycle:

1. **Subagent 2 Flag 1**: ADR-0011 NOT cross-referenced from
   ADR-0007 — entity-ownership-Tier-2 sense not pointed-to from
   agent-tier-Tier-2 sense in ADR-0007's `## Cross-references`
   section. Stage 3a glossary entry resolves at glossary grain
   (cross-reference structure between two senses); ADR-0007
   amendment includes inline cross-reference to ADR-0011 §1 per
   joint preliminary lean.
2. **Subagent 2 Flag 2**: Sense-overload not flagged anywhere in
   ADR-0007 prior to this amendment. The amendment IS the first
   acknowledgment per Stage 3a path (c) codification work.
3. **Subagent 2 Flag 3**: Existing "Tier 2 vs Tier 2.5 read-
   boundary clarification" follow-up wording in ADR-0007 Status
   block — care needed to distinguish from new sense-
   disambiguation amendment. Recommendation: amendment title
   "Tier 2 sense-disambiguation" (NOT "Tier 2 clarification")
   to disambiguate from existing follow-up scope.
4. **Subagent 2 Flag 4**: ADR-0007 line 21 uses "Tier 2" in a
   THIRD sense (governance-plan task ordering: "Phase 0
   governance plan Task C2 (Tier 2 — depends on ADR-0007"). Per
   Stage 4 narrow-scope discipline + Observation 1 (scope-α)
   verdict, 3rd sense logged as carry-forward observation; not
   absorbed into amendment scope.
5. **Adjacent staleness flag** (outside arc-closeout scope):
   `docs/02_specs/glossary.md` lines 31-32 reference "ADR-001 is
   currently the only ADR" — stale relative to current 19+ ADR
   set. Logged for future glossary maintenance opportunity; not
   blocking for arc-closeout codification artifacts.

#### Carry-forward to subsequent arcs

Items deferred from this arc-closeout cycle to subsequent
governance / implementation arcs:

- **γ-hygiene-cycle 3 deferred fixes** — defer-further to Phase 5
  first-domain consumer arc onset OR Phase 1.Storage re-open
  (whichever fires first) per Anchor 4 lock; NOT indefinite
- **3rd "Tier 2" sense (governance-plan task ordering)** —
  logged as carry-forward observation per Stage 4 narrow-scope
  discipline; potential cross-arc discussion at next governance
  arc if surfaces operationally
- **Broader Phase 0 review opportunity at next governance arc**
  — full Phase 0 ADR review for cross-ADR enum gaps + ADR-0011
  §10 multi-entity reservation refinement candidates + ADR-0015
  cross-reference notation refinement candidates; deferred per
  narrow-scope discipline
- **Cross-enum future cases under path (a) precedent** — future
  cross-ADR enum gaps follow path (a) ADR-0011 amendment
  precedent (per Stage 4 path (a) election as response shape for
  similar future cases); first-arc-instance precedent applies
- **Stale subject-name ref at chunk B2-1 §1 motivation line 4**
  — δ-i preservation precludes retroactive edit; (line-4-i)
  vs (line-4-ii) interpretation paths logged; resolution-path
  optional at next governance arc
- **Adjacent glossary staleness** (line 31-32 ADR-001 reference)
  — future glossary maintenance opportunity
- **Phase 5 first-domain consumer arc onset framing** — Spend
  Initiative implementation arc opens at next-arc-onset; brief
  Phase A acceptance criteria + ADR-0015 consumption shape
  inform implementation gates

#### Subagent dispatch shape (this cycle)

Layer 2 fired 3 parallel general-purpose subagents per Z1 #11.b
preventive verbatim re-read discipline before drafting at Stage 5:

1. ADR-0011 §13 + amendment-process precedent (mandatory for
   ADR-0011 amendment substrate)
2. ADR-0007 §Tier 2 + Tier 2.5 amendment shape precedent
   (mandatory for ADR-0007 amendment substrate + Candidate A vs
   B placement decision)
3. ADR README + glossary.md current structure (mandatory for
   addendum + glossary entry placement)

Within-arc cumulative dispatch count: 4 (B2-1) + 5 (B2-2) + 4
(B2-3) + 3 (B2-4) + 3 (arc-closeout cycle) = **19 subagents
fired across arc preventively**. Z1 #11.b graduated codification
operationally validated across the arc + arc-closeout cycle —
within-arc 19-fire cumulative + cross-session pattern-stability
evidence basis demonstrates discipline-shape stability across
chunk-grain AND arc-closeout-cycle-grain.

Phase 2 brief-creation arc CLOSED at this retrospective entry.
Codification artifacts (4 files: ADR-0011 §13 amendment + ADR-0007
§Tier 2 inline amendment + ADR README addendum + `glossary.md`
Tier 2 entries) ship under subsequent commit per (stage-β-i)
split-same-session shape. Stage 6 final session-close gate fires
after Commit 2 push completes.

Closes Phase 2 brief-creation arc-closeout retrospective entry
under (C-ii) bundled-explicit founder verdict at clean-termination
gate per refined (R-iii) graduated form. Substrate-decision-
integrity preserved across full arc execution + arc-closeout
cycle execution. Aggregate arc contribution: ~2756 lines drafted
across 4 chunks; full §1-§21 substantive content shipped at brief;
8 firing decisions locked at arc-closeout; 5 codification
artifacts ship across this retrospective + subsequent codification
commit.
