## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X
- NOTE — observation worth preserving for next phase

## Phase 2

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
