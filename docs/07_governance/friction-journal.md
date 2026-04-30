## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X
- NOTE — observation worth preserving for next phase

## Phase 2

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
