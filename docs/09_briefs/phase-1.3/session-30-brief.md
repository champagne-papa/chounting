# Session 30 — Path C convention-to-CI-enforcement cluster (LT-01 + LT-03 + LT-04)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S30 is CI-rule + drift-check + comment annotation work; no orchestrator request fires).

**Goal:** Close the convention-to-CI-enforcement cluster across LT-01 (LT-01(a) = LT-03; LT-01(b); LT-01(c); LT-01(d)) and LT-04. Each item shares the shape "turn a hand-maintained data structure or convention into a CI-enforced drift check." Closes UF-006 (convention-only enforcement gap), UF-013 (test coverage facets including hardcoded-URL grep), and QUALITY-006 (ORG_SCOPED_TOOLS Set drift). Sequences AFTER S29a so LT-01(b)'s rule fires against post-S29a clean wrap-site state. The state at `c47e58d` is the canonical substrate the LT-01(b) guard is calibrated against.

**Architecture (V1 minimal scope):**

- **LT-03 (= LT-01(a)) — adminClient import restriction.** Add `no-restricted-imports` rule to `eslint.config.mjs` blocking `@/db/adminClient` import outside `src/services/`. Mechanizes UF-006's primary surface.
- **LT-01(b) — withInvariants wrap-or-annotate enforcement.** Custom ESLint rule `services/withInvariants-wrap-or-annotate` that walks `ExportNamedDeclaration → ObjectExpression → Property` in `src/services/**/*.ts` and asserts each property is either (i) wrapped in `withInvariants(...)` or (ii) preceded by canonical-form annotation `// withInvariants: skip-org-check (pattern-X: rationale-string)`. Empty starting allowlist (annotation-default discipline; allowlist reserved for future standing-architectural exemptions). Pattern B/C/E/G1/H sites annotated as part of S30's annotation pass. Pattern G1 sites (orgService.getOrgProfile, addressService.listAddresses, membershipService.listOrgUsers, invitationService.listPendingInvitations) are route-handler-gated via explicit `caller.org_ids.includes(orgId)` check per hot-fix arc (`c617f58` + `5d58b36`); rule passes via canonical-form `pattern-G1` annotation match (NOT wrap-detection — the rule scope is service-layer files only, with no visibility into route handlers; brief's pre-creation framing of "wrap-detection at the route handler layer" was substrate-mechanistically incorrect and was corrected at S30 execution-time-pre-flight Task 5 verification).
- **LT-01(c) — no-hardcoded-URLs CI check formalization (narrow scope).** Existing check at `package.json` `test:no-hardcoded-urls` (`! grep -rn 'localhost:54321\\|127.0.0.1:54321' tests/ src/`) is narrower than parent brief implied. S30 closure = formalize the existing narrow check; ensure it runs in `pnpm agent:validate` (substrate-confirmed at brief-creation: it does); document scope. **Scope-extension to non-Supabase localhost references is OUT OF SCOPE per pre-decision (c-1c-α);** any extension would open Phase-2-shaped scope that violates the brief's own out-of-scope list.
- **LT-01(d) — CLAUDE.md / AGENTS.md reconciliation.** Time-boxed audit of CLAUDE.md (185 lines) + AGENTS.md (5 lines) with one-hop reads of cited docs. 60-minute ceiling starting at audit-task entry. Three-bucket disposition (auto-resolve silent / auto-resolve commit-message-noted / surface for operator). Audit population reduced post-hot-fix: 4 G1 service-function JSDocs (orgService.getOrgProfile, addressService.listAddresses, membershipService.listOrgUsers, invitationService.listPendingInvitations) + 3 route-handler file-tops (profile, addresses, invitations) were reconciled in the hot-fix arc (`c617f58` + `5d58b36`); these claims are pre-closed. Remaining audit population: CLAUDE.md (185 lines, per pre-decision (b)) + AGENTS.md (5 lines).
- **LT-04 — ORG_SCOPED_TOOLS drift check.** Per-tool `orgScoped: boolean` required-field annotation on each ToolDef. Refactor: extract derived ORG_SCOPED_TOOLS Set from tool registry to `src/agent/tools/orgScopedTools.ts` (location lean per pre-decision (c)). Drift test in `tests/unit/agent/orgScopedTools.test.ts` asserts derivation correctness against orchestrator's reference. Field semantics question deferred to (c4) sub-pre-flight.
- **`.next/` ignore in eslint.config.mjs.** Folded into LT-03's edit per pre-decision (a). Closes the 9,860-error baseline pollution surfaced at S30 brief-creation pre-flight.

**Tech stack:** TypeScript, ESLint (custom rule), Vitest. New dependencies: possibly `@typescript-eslint/utils` for ESLint custom rule authoring (substrate-verify if already in `node_modules`). No schema changes. No orchestrator behavior changes (only refactors). No service-layer behavior changes (only annotation additions per (a)). No paid-API spend.

---

**Anchor (parent) SHA:** `5d58b36` — sibling fix-forward post-G1-hot-fix (route-handler file-top reconciliation across 3 routes). Verify HEAD's parent matches at Task 1 Step 2. Chain (chronological, oldest → newest): `1400694` (S28 brief) → `7ba3455` (Path C corrigendum + folded NOTE) → `3cedd05` (corrigendum SHA fix-forward) → `bafd4f9` (S29a brief) → `c47e58d` (S29a execution) → `53aa533` (S30 brief; this brief's prior anchor) → `ee35abf` (.gitignore cleanup; orthogonal) → `b4f6063` (G1 hot-fix brief) → `c617f58` (G1 hot-fix execution) → `5d58b36` (sibling fix-forward; route-handler file-top reconciliation) → this re-anchor commit.

**Upstream authority:**
- `docs/09_briefs/phase-1.3/path-c-arc-summary.md` (post-corrigendum at `7ba3455`) — S30 entry; arc summary's Pattern landscape appendix; Gate 4 LT-01/LT-03/LT-04/QUALITY-006 expected text.
- `docs/09_briefs/phase-1.3/session-29a-brief.md` (at `bafd4f9`) — brief structure precedent.
- `docs/07_governance/friction-journal.md` tail — S29a closeout NOTE at `c47e58d`; 19-element inventory; codification entry for fractal-substrate-fidelity convention; element #6 + #11 operator-pending decision-forks.
- `docs/07_governance/audits/phase-1.2/action-plan.md` — LT-01, LT-03, LT-04 verbatim "Done when" criteria; UF-006, UF-013 references; QUALITY-006 lineage for LT-04.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-006 (convention-only enforcement gap); UF-013 (test coverage facets); QUALITY-006 (ORG_SCOPED_TOOLS Set drift).
- `eslint.config.mjs` (HEAD `c47e58d`) — current state lacks `no-restricted-imports` rule and lacks `ignores: ['.next/**']` block.
- `src/services/middleware/withInvariants.ts` (HEAD `c47e58d`) — file-top comment reconciled to universal framing per S29a item (a); throws ServiceError per α-class-unify.
- `src/agent/orchestrator/index.ts:1098-1104` (text-anchor: "ORG_SCOPED_TOOLS") — LT-04 target; substrate-confirmed at S30 brief-creation pre-flight.
- `src/agent/tools/index.ts` — canonical 10-tool registry barrel export.
- `package.json` `test:no-hardcoded-urls` — existing LT-01(c)-adjacent check; substrate at S30 brief-creation pre-flight is narrower than parent brief implied.
- `CLAUDE.md` (185 lines) + `AGENTS.md` (5 lines) — LT-01(d) target.

---

## Session label
`s30-brief` (brief-creation session label) → `S30-ci-enforcement-cluster` (execution session label, applied at Task 1 Step 1).

## Pre-flight findings (substrate-grounded reference at HEAD `c47e58d`)

### Pre-flight delta inventory vs parent brief framing

Per the codified discipline graduated this session at N=3 ("Brief-creation pre-flight as substrate-fidelity gate"), this section enumerates substrate-vs-brief-framing gaps surfaced at brief-creation pre-flight:

- **pre-1: Lint baseline gap.** `pnpm lint` returns 10,614 problems (9,860 errors + 754 warnings) at HEAD `c47e58d`. Root cause: `.next/` build output is being linted; `eslint.config.mjs` has no `ignores` block. Pre-existing; not regression. Critical for LT-03/LT-01(b) design — broken baseline drowns custom-rule signals unless fixed first. Resolution: fold `ignores: ['.next/**']` into LT-03's eslint.config.mjs edit (per pre-decision (a)).
- **pre-2: "Rule 8" framing-gap.** Parent brief cited "CLAUDE.md Rule 8 for LT-01(c)"; substrate shows CLAUDE.md doesn't number rules. The actual mechanism is `pnpm test:no-hardcoded-urls` defined inline in `package.json`: `! grep -rn 'localhost:54321\\|127.0.0.1:54321' tests/ src/`. Existing check is narrower than parent brief implied — only blocks Supabase API local port (`localhost:54321`/`127.0.0.1:54321`); not `localhost:3000` (Next.js dev) or general `http://localhost`. Resolution: rename references throughout S30 brief; surface scope-extension question as pre-decision (c-1c).
- **pre-3: ORG_SCOPED_TOOLS substrate-finding.** `updateOrgProfile` uses `session.org_id` but isn't in ORG_SCOPED_TOOLS Set. Substrate-confirmed at brief-creation post-feedback (read of `orchestrator/index.ts:1213-1227`): updateOrgProfile has BOTH (i) its own inline null-org check at lines 1219-1223 (`if (session.org_id === null) throw new Error('updateOrgProfile called without an active org (onboarding session)')`) AND (ii) an inline `withInvariants(orgService.updateOrgProfile, { action: 'org.profile.update' })` wrap at lines 1224-1227. The Set's actual semantics: "tools whose null-org rejection is gated by Set membership lookup at line 1105" — narrower than "tools that use org context." updateOrgProfile is intentionally outside the Set because its per-tool dispatcher case re-implements the null-org check with a tool-specific error message AND wraps locally rather than relying on Set-membership gating. Resolution: brief encodes the narrower semantics; field-naming choice (orgScoped vs requiresOrchestratorOrgGate vs alternative) lands at Task 0 Step 0.3 (before lock acquisition; operator-decided). **Disclosure (closeout-NOTE-element-pre-4 trigger):** initial brief-draft asserted state 2 as substrate-confirmed without reading lines 1214-1225 contents — only ran a grep that returned line numbers. Substrate verification was completed post-operator-feedback. This is itself a fractal-fidelity firing on the brief-drafting derivation; sibling shape to pre-1/2/3 at the brief-drafting cadence layer.
- **pre-6: Anchor chain extension.** `c47e58d` → `ee35abf` (orthogonal .gitignore cleanup) → `b4f6063` (G1 hot-fix brief) → `c617f58` (G1 hot-fix execution) → `5d58b36` (sibling fix-forward). 4 interceding commits between this brief's prior anchor (`53aa533`) and the re-anchor target (`5d58b36`); 1 orthogonal, 3 within G1 hot-fix arc.
- **pre-7: Pattern G1 row dispositions.** Removed from LT-01(b) annotation pass at S30 brief; sites now wrapped via route-handler-check (rule's wrap-or-annotate predicate satisfied via wrap-detection without annotation entry). LT-01(b) annotation count drops from "21 to 25 total" (with conditional +4 for Variant β) to a stable 21 (10 Pattern B + 3 Pattern C/E + 1 Pattern H + 7 D/G2/I existing).
- **pre-8: LT-01(d) audit scope reduction.** Hot-fix's combined service-layer JSDoc + route-handler file-top reconciliation closes some claims that LT-01(d) would have audited: 4 G1 service-function JSDocs + 3 route-handler file-tops are pre-closed. Remaining LT-01(d) audit population: CLAUDE.md (185 lines) + AGENTS.md (5 lines) per pre-decision (b).
- **pre-9: Carry-forward elements from hot-fix arc closeouts.** pre-6-equivalent (substrate-grep-first closure-execution evidence at hot-fix) and pre-7-equivalent family (substrate-fidelity-gate continuing-firings at hot-fix arc — five cadence layers now firing) carry forward from S30 hot-fix arc closeouts. First firing at re-anchor cadence layer is THIS pre-flight's delta-inventory derivation; sixth cadence layer.

### Lint / typecheck / test floor

#### post-S29a at HEAD `c47e58d` (historical reference; brief's prior anchor)

| Check | Result | Disposition |
|---|---|---|
| `pnpm typecheck` | clean | floor passes |
| `pnpm lint` | 10,614 problems (9,860 errors + 754 warnings) | pre-existing baseline; resolved by S30 via `.next/` ignore |
| `pnpm test` (post `db:reset:clean && db:seed:all`) | 1 failed (verifyAuditCoverageRoundTrip) / 573 passed / 0 skipped (574) | matches expected post-S29a state per element #19; pre-existing carry-forward |

#### post-hot-fix at HEAD `5d58b36` (current re-anchor target)

| Check | Result | Disposition |
|---|---|---|
| `pnpm typecheck` | clean | floor passes (carry-forward from hot-fix closeout NOTE) |
| `pnpm agent:validate` | 26/26 (post `db:reset:clean && db:seed:all`) | floor passes (carry-forward from hot-fix closeout NOTE) |
| `pnpm lint` | not directly queried at re-anchor (chat-side draft session, no bash); expected ~10,614 problems carry-forward — hot-fix arc made no source changes that would shift lint baseline; substrate-confirm at execution-time Task 2 Step 1 | pre-existing baseline; resolved by S30 via `.next/` ignore |
| `pnpm test` (post `db:reset:clean && db:seed:all`) | 557/578 passed (4 new G1 cross-org regression tests in `tests/integration/orgGetCrossOrg.test.ts` pass; carry-forward set unchanged per S29a element #19) | carry-forward from hot-fix closeout NOTE; run-ordinal-dependent. The "557/578 passed" capture in the hot-fix closeout NOTE matches a fresh-post-reset run (run 1 after `db:reset:clean && db:seed:all`): 1 failed (`verifyAuditCoverageRoundTrip` orthogonal) + 557 passed + 20 skipped (intentional `it.skip` / `describe.skip`; not failures) = 578. Subsequent runs without DB reset surface accumulated state pollution: 3 failed (`verifyAuditCoverageRoundTrip` + `accountLedgerService` running-balance ×2 + `crossOrgRlsIsolation` suite-level setup failure on duplicate `journal_entries_pkey`) + 555 passed + 20 skipped = 578. The 20 skipped are intentional markers, not carry-forward failures. Per S29a element #19, the carry-forward "set" is 3 named categories — (a) `verifyAuditCoverageRoundTrip` orthogonal; (b) `accountLedgerService` running-balance brief-anticipated wrap-driven; (c) `crossOrgRlsIsolation` cascading pollution downstream of (b) — where (b) and (c) only manifest after the running-balance pollution accumulates in `journal_entries`. Reporting-level failure count is run-ordinal-dependent (1 fresh, 3 polluted), not a fixed number. Task 9 regression: run with `db:reset:clean && db:seed:all` immediately before; expect 1 failed (`verifyAuditCoverageRoundTrip`) + 557 passed + 20 skipped post-S30 edits, allowing for any deliberate test additions from LT-04 drift test (Task 4 Step 6). Drift beyond this fresh-run baseline halts per Task 9 Step 4. The hot-fix closeout NOTE's "3 pre-existing carry-forwards" sub-clause was a category-count shorthand that referred to the named categories from S29a element #19, not to instance counts. The S30 brief re-anchor's Item 1 reconciliation attempted to multiply the category-count into an instance-count and produced "~21 individual test failures" — that arithmetic was substrate-incorrect; the underlying numbers are substrate-correct under the run-ordinal-dependent framing. Folds into S30 closeout NOTE as a substrate-fidelity-gate firing at re-anchor cadence (sibling-shape to sibling fix-forward NOTE element #3 at post-execution-review cadence). |

### LT-01(b) target population — 7 canonical-form annotation sites at `c47e58d`

| Pattern | Site | File:line |
|---|---|---|
| D | getOrCreateProfile | userProfileService.ts:37 |
| D | getProfile | userProfileService.ts:74 |
| D | updateProfile | userProfileService.ts:91 |
| G2 | listShared | taxCodeService.ts:25 |
| G2 | listIndustries | orgService.ts:376 |
| I | acceptInvitation | invitationService.ts:96 |
| I | previewInvitationByToken | invitationService.ts:285 |

All 7 sites: canonical-form annotation directly precedes `async methodName(...)` shorthand-method Property inside ObjectExpression bound to ExportNamedDeclaration's VariableDeclarator. Zero divergent shapes. AST visitor walks `ExportNamedDeclaration → ObjectExpression → Property` and checks leading-comment + wrap-detection.

### LT-01(b) annotation pass (S30 execution surface)

Per pre-decision (a)'s annotation-default discipline, S30 adds annotations at the following non-A populations. Counts substrate-derived at brief-creation; sub-pre-flight at Task 2 re-derives with verbatim-action enumeration for Pattern B.

| Pattern | Sites | S30 disposition |
|---|---|---|
| A (16 wrapped) | 16 sites across 8 files | n/a — wrapped at service export; rule passes via wrap detection |
| B (~10 mutations) | journalEntryService.post; recurringJournalService.{createTemplate, updateTemplate, deactivateTemplate, generateRun, approveRun, rejectRun}; invitationService.{inviteUser, revokeInvitation, resendInvitation} | annotate with `(pattern-B: route-handler-wrapped via withInvariants(action: '...'))`; verbatim action per site |
| C/E (3 sites) | journalEntryService.get; recurringJournalService.{getTemplate, getRun} | annotate with `(pattern-C: deferred to S29b)` / `(pattern-E: deferred to S29b)`; per (e) Variant α/β disposition |
| D/G2/I (7 existing) | per pre-flight table above | already canonical at HEAD; no S30 edit |
| H (1 site) | membershipService.listForUser | annotate with `(pattern-H: dead code; remove in Phase 2 cleanup)` |
| G1 (4 sites) | orgService.getOrgProfile; addressService.listAddresses; membershipService.listOrgUsers; invitationService.listPendingInvitations | annotate with `(pattern-G1: route-handler-gated via caller.org_ids.includes(orgId) check; not withInvariants-wrapped per S30 hot-fix arc c617f58 + 5d58b36, OQ-07 resolved-decision integrity)` |
| Additional B (10 sites surfaced at execution) | addressService.{addAddress, updateAddress, removeAddress, setPrimaryAddress}; membershipService.{changeUserRole, suspendUser, reactivateUser, removeUser}; orgService.{createOrgWithTemplate, updateOrgProfile} | brief's pre-flight Pattern B enumeration was substrate-incomplete (10 sites listed; substrate-correct count = 20). Surfaced at S30 execution-time Task 5 rule verification. Each annotated with verbatim action per route-handler wrap-site (action strings: `'org.address.create' \| 'org.address.update' \| 'org.address.delete' \| 'org.address.set_primary' \| 'user.role.change' \| 'user.suspend' \| 'user.suspend' (substrate-bug at reactivate route) \| 'user.remove' \| 'org.create' \| 'org.profile.update'`). |

Annotation pass total: 28 added at S30 (10 brief-enumerated B + 3 C/E + 1 H + 4 G1 + 10 surfaced-B) + 7 D/G2/I existing = 35 total annotated sites in src/services/ at S30 closeout. Brief's pre-creation count of "21 stable" was substrate-incomplete on two axes: (1) G1 sites need annotation (rule scope is service-layer files only; route-handler-check is not wrap-detectable from the rule's vantage); (2) Pattern B enumeration missed 10 mutating sites in addressService / membershipService / orgService. Both gaps surfaced at S30 execution-time-pre-flight Task 5 verification and resolved at Task 6 annotation pass; folds into S30 closeout NOTE as substrate-fidelity-gate firings #N+1 and #N+2 at execution-time-pre-flight cadence.

### LT-04 target — tool registry vs ORG_SCOPED_TOOLS Set

| Tool (canonical: `src/agent/tools/index.ts`) | session.org_id required? | In ORG_SCOPED_TOOLS Set? | (c4) substrate state |
|---|---|---|---|
| updateUserProfile | no (Pattern D — own profile via user_id) | NO | matches |
| createOrganization | no | NO | matches |
| updateOrgProfile | yes (via session.org_id) | NO | **state 2: mechanism elsewhere** — substrate-confirmed at brief-creation: own null-org check at lines 1219-1223 + inline `withInvariants(orgService.updateOrgProfile, { action: 'org.profile.update' })` wrap at lines 1224-1227 |
| listIndustries | no (G2 — globally-shared) | NO | matches |
| listChartOfAccounts | yes | YES | matches |
| checkPeriod | yes | YES | matches |
| listJournalEntries | yes | YES | matches |
| postJournalEntry | yes | YES | matches |
| reverseJournalEntry | yes | YES | matches |
| respondToUser | no | NO | matches |

ORG_SCOPED_TOOLS Set semantics narrower than first-glance reading: gates **only** tools whose null-org check happens at the dispatcher Set-membership lookup (line 1105). updateOrgProfile is intentionally outside the Set because its null-org check + wrap live inline at the per-tool dispatch (lines 1219-1227, substrate-confirmed). Field-naming question for (c2) annotation surfaces at Task 0 Step 0.3 (BEFORE lock acquisition): `orgScoped` with documented narrower semantics vs `requiresOrchestratorOrgGate` (semantics: "tool's null-org check is gated by Set membership at dispatcher") vs alternative. The two have different semantic implications and the brief defers the choice to operator at Task 0.

### CLAUDE.md / AGENTS.md size for LT-01(d)

| File | Lines | Audit-target population |
|---|---|---|
| CLAUDE.md | 185 | tier-1 navigation paths (4); skill triggers (5); "What done means" criteria (3); session execution conventions (3 sub-sections); Phase 1 simplifications reference (1) |
| AGENTS.md | 5 | trivially included |
| docs/INDEX.md | 193 | OUT OF SCOPE — navigation map; structural drift differs from claim drift |

---

## Hard constraints (do not violate)

- **Out of scope:**
  - Phase 2 obligations (MT-02, MT-04, QW-06, UF-015, etc.).
  - Path A scope (DND-01 CORS/CSRF/rate-limiting, DND-04 pagination).
  - LT-02 / S31 (test coverage cluster).
  - S29b (Patterns C/E design-bearing migration).
  - Pattern A wrap mechanization (S29a closed; substrate at HEAD `c47e58d`).
  - Element #6 G1 substantive remediation. RESOLVED pre-S30 via hot-fix arc (`c617f58` + `5d58b36`); not in S30 scope because already done. See Out-of-scope explicit list item 6 for full provenance.
  - Pattern H removal (dead code; Phase 2 cleanup workstream); annotation only at S30.
  - docs/INDEX.md or broader docs-tree audit (LT-01(d) scope ceiling).
  - Recursive-descent reads from CLAUDE.md citations (LT-01(d) one-hop only).
- **Test posture floor.** ALL existing tests at HEAD post-edit remain at the documented pre-existing carry-forward state. `pnpm agent:validate` clean. No new failures attributable to this session beyond any deliberate test additions (LT-04 drift test).
- **Hard constraint A — ESLint custom rule isolation.** LT-01(b) rule must function correctly even with pre-existing lint baseline noise. Verified by: (i) folding `.next/` ignore in same edit; (ii) rule fires with zero false-positives on the 7 canonical-form sites; (iii) rule fires correctly on all post-S30 annotation additions.
- **Hard constraint B — annotation-form canonical preserved.** All annotations added at S30 use the exact-string canonical form `// withInvariants: skip-org-check (pattern-X: rationale-string)`. Pattern B annotations carry verbatim action per site; Pattern C/E carry deferral text; Pattern H carries dead-code text. (G1 sites are not annotated at the service layer; wrapped via route-handler-check per hot-fix arc `c617f58` + `5d58b36`.)
- **Hard constraint C — LT-04 type-system enforcement.** `orgScoped: boolean` is a **required field** on ToolDef, no default, no optional marker. Type-checker enforces "every new tool has explicit org-scope decision at definition." Optional-with-default would silently flag new tools as non-org-scoped.
- **Hard constraint D — LT-04 single-source-of-truth direction.** ORG_SCOPED_TOOLS Set in orchestrator is consumed (imported) from the dedicated module; orchestrator does NOT maintain its own Set. The dedicated module derives the Set from the tool registry. Drift test verifies derivation correctness against the source registry, not Set-vs-Set equality.
- **Hard constraint E — LT-01(d) time-box.** 60-minute ceiling starts at audit-task entry, not session start. Hard ceiling; overruns surface unaudited remainder rather than extending. Lock acquisition + substrate reads + other Task-N work do not eat into the 60 minutes.
- **Hard constraint F — LT-01(d) one-hop scope.** Reads of cited docs allowed for claim-verification only; recursive descent forbidden. One-hop reads count against time-box.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight. Re-verify at execution time before edit; halt on any drift. Substrate-grounded line numbers are parenthetical aids; text-anchors are load-bearing references.
- **Y2 commit shape.** Single bundled commit by default. Y2-split available if net diff exceeds ~200 lines OR if LT-01(d)'s reconciliation surfaces non-trivial drift fixes (commit 1: CI rules + LT-04 drift check + annotation pass; commit 2: CLAUDE.md / governance reconciliation + friction-journal NOTE). Operator's call at execution time, not pre-committed.
- **No placeholder-and-amend.** NOTE refers to "this commit family" generically; no SHA reference in NOTE body. Per S29a element #1 precedent.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time; executor re-confirms the batch as a D1-shape preamble before touching code):

1. **(a) LT-01(b) implementation surface = ESLint custom rule on existing pipeline.** Custom rule `services/withInvariants-wrap-or-annotate` walks AST visitor on `ExportNamedDeclaration → ObjectExpression → Property` in `src/services/**/*.ts`. `.next/` ignore folded into the same eslint.config.mjs edit that lands LT-03. Annotation-everywhere with empty starting allowlist; allowlist reserved for future standing-architectural exemptions. Pattern B annotation rationale uses verbatim action per site (action-only, no path); sub-pre-flight at brief-creation enumerates Pattern B sites + action strings + multi-handler/non-handler-consumer check.

2. **(b) LT-01(d) scope ceiling = CLAUDE.md + AGENTS.md only with one-hop reads (b1-shallow-follow).** 60-minute time-box starts at audit-task entry. Three-bucket discriminator: auto-resolve silent (mechanical, substrate-unambiguous: stale counts, typos, broken paths, mechanism-name drift, same-file line-shifts); auto-resolve commit-message-noted (cross-file content moves, mechanism renames from prior sessions); surface for operator (architectural-state divergence, cross-document inconsistency, doc-vs-code drift without ADR, multi-referent ambiguity). Audit-pass inventory as substrate-record sibling artifact. "Rule 8" → `pnpm test:no-hardcoded-urls` rename throughout brief.

3. **(c) LT-04 drift check shape = test-based + per-tool annotation + refactor.** Test in `tests/unit/agent/orgScopedTools.test.ts` asserts derivation correctness. `orgScoped: boolean` required field on ToolDef (Hard constraint C). Refactor extracts derived Set to `src/agent/tools/orgScopedTools.ts` (lean location; substrate-decide at execution if `src/agent/orchestrator/` better fits the consumption pattern). orchestrator imports the const (Hard constraint D). Field-naming sub-pre-flight at execution: `orgScoped` vs `requiresOrchestratorOrgGate` per (c4) substrate state-2 finding.

4. **(c-1c) LT-01(c) scope = narrow (ratified at brief-creation post-pre-flight).** Existing `pnpm test:no-hardcoded-urls` blocks only `localhost:54321` / `127.0.0.1:54321` (Supabase API local port). Substrate at HEAD shows `localhost:3000` URLs in test files (e.g., `tests/integration/mfaEnforcementMiddleware.test.ts:124,139,155,169`). **Ratified disposition (c-1c-α):** LT-01(c) closure = formalize existing narrow check; ensure it runs in `pnpm agent:validate` (it does); document scope. Scope-extension to non-Supabase `localhost` references is **out of scope** because (i) parent brief's LT-01 scope was three rule-shaped checks not one + one convention-extension; (ii) extending opens Phase-2-shaped scope (Phase 2 obligations are listed in this brief's out-of-scope items); (iii) softens un-compressed-rhythm by adding mid-brief operator-pending without dialogue ratification. The narrow-scope closure is sufficient for Path C arc closure.

5. **Y2 commit shape: single bundled commit by default.** Y2 split available if net diff exceeds ~200 lines OR LT-01(d)'s reconciliation surfaces non-trivial drift fixes. Operator's call at execution.

6. **Estimated session duration: ~1-2 days.** Task 0 closure-confirm pre-task (~3-5 min — defensive grep for G1 closure substrate; (e) and (c4) confirmations remain in scope) + ESLint custom rule authoring (~3 hours including testing) + LT-03 rule (~30 min) + .next/ ignore (~5 min) + LT-04 refactor + drift test (~1.5 hours) + Pattern B/C/E/H annotation pass (~1.5 hours) + LT-01(d) audit (60-min ceiling) + LT-01(c) closure (~15 min) + full-suite regression (~30 min) + friction-journal NOTE drafting (~1.5 hours) + review buffer.

OPEN — operator to resolve before / during S30 (carry-forward inputs from S29a closeout):

- **(d) Element #6 G1 disposition — RESOLVED at hot-fix arc (`c617f58` + `5d58b36`).** G1 territory closed pre-S30 across both substrate layers: service-layer JSDoc reconciliation at hot-fix execution (`c617f58`); route-handler file-top reconciliation at sibling fix-forward (`5d58b36`). 4 G1 service functions are wrapped via explicit `caller.org_ids.includes(orgId)` check at route-handler with 403 ORG_ACCESS_DENIED; 4 cross-org regression tests in `tests/integration/orgGetCrossOrg.test.ts`; service-layer JSDoc + route-handler file-top documentation aligned with implementation. No carry-forward to S30 execution. Task 0 Step 0.1 transitions to defensive substrate-confirm of closure (see Task 0 Step 0.1 below).

- **(e) Element #11 Pattern C/E zero-test-coverage (operator-pending; conditional task-shape encoded).** Two variants:
  - **(e) Variant α — S29b pre-flight adds C/E test coverage:** S30 LT-01(b) C/E annotation rationale = `(pattern-C: deferred to S29b)` / `(pattern-E: deferred to S29b)`; timeline-bounded; rule logic unchanged.
  - **(e) Variant β-soft — LT-02/S31 absorbs gap:** S30 LT-01(b) C/E annotation rationale = `(pattern-C: deferred; test coverage tracked as LT-02/S31 obligation)` / `(pattern-E: ...)`; longer timeline encoded in annotation text only; **rule logic identical to Variant α** (no mechanical tolerance; annotation-content-only differs).

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| S30-LT-03 | UF-006 (primary) | eslint.config.mjs | `no-restricted-imports` rule blocks `@/db/adminClient` import outside `src/services/`; `.next/` ignore added; `pnpm lint` returns acceptable error count (verifies baseline closure). | grep verifies rule presence; lint run on src/app/api/ with mock `import` of adminClient triggers error. | Gate 4 LT-03 |
| S30-LT-01(b) | UF-006 (mechanism facet) | eslint.config.mjs (rule registration); `eslint-rules/` (rule definition); src/services/**/*.ts (annotation pass) | Custom rule `services/withInvariants-wrap-or-annotate` registered. Rule fires zero false-positives on 7 canonical-form sites at c47e58d. Pattern B/C/E/H sites carry canonical-form annotations per Hard constraint B. Empty allowlist. `pnpm lint --rule services/withInvariants-wrap-or-annotate` clean. | rule unit tests in `eslint-rules/__tests__/`; spot-check on 3+ Pattern A sites confirms wrap-detection passes; spot-check on 3+ canonical-annotated sites confirms comment-detection passes; spot-check on a deliberately-broken site fails with expected message. | Gate 4 LT-01(b) |
| S30-LT-01(c) | UF-013 (hardcoded-URL facet) | package.json (existing `test:no-hardcoded-urls`) | Existing narrow check (`localhost:54321\|127.0.0.1:54321`) verified to run in `pnpm agent:validate`; scope documented in CLAUDE.md (or sibling) per (c-1c-α). | grep substrate confirms no Supabase API URLs hardcoded in `tests/` or `src/`. | Gate 4 LT-01(c) |
| S30-LT-01(d) | UF-006 (documentary facet) | CLAUDE.md, AGENTS.md, audit-inventory sibling | 60-min audit-task completed within ceiling; auto-resolved fixes batched into commit; surfaced findings as friction-journal NOTE entries OR ADR proposals; audit inventory captured as substrate-record. | inventory enumerates each claim audited with disposition; pre-flight delta inventory included. | Gate 4 LT-01(d) (if defined; otherwise integration with friction-journal closure) |
| S30-LT-04 | QUALITY-006 | src/agent/tools/orgScopedTools.ts (new); src/agent/tools/*.ts (10 files; field add); src/agent/orchestrator/index.ts:1098-1104 (replace with import); tests/unit/agent/orgScopedTools.test.ts (new); src/agent/tools/index.ts (possibly expanded barrel exports) | Per-tool `<fieldname>: boolean` required field on each ToolDef (Hard constraint C); field-naming applied per Task 0 Step 0.3 resolution; consistent across ToolDef type, all 10 tool annotations, dedicated module, drift test, and commit body. orchestrator imports from dedicated module (Hard constraint D). Drift test asserts derivation correctness. | drift test passes; TypeScript type-checker rejects ToolDef without the field; `pnpm typecheck` clean; orchestrator's null-org gate behavior unchanged. | Gate 4 LT-04 / QUALITY-006 |

---

## Task 0: Pre-Task discipline check — variant disposition (BEFORE lock acquisition)

This task is the **discipline-correct halt-point for operator-pending variant decisions**: (e) Pattern C/E test-coverage timeline + (c4) updateOrgProfile field-naming. If either is unresolved at Task 0 entry, surface for operator before proceeding. Pre-decision (d) was resolved at hot-fix arc (`c617f58` + `5d58b36`); Step 0.1 below is the defensive substrate-confirm of closure rather than a variant-resolution gate. Lock acquisition + session-init are part of Task 1, deliberately AFTER this check.

- [ ] **Step 0.1: Confirm (d) closure substrate.**

Pre-decision (d) was resolved at hot-fix arc (`c617f58` + `5d58b36`) — G1 territory closed pre-S30. This step is a defensive substrate-confirm that the closure holds at execution-time HEAD; it is NOT a variant-resolution gate (the variant resolution landed at hot-fix arc).

```bash
grep -rn 'caller.org_ids.includes(orgId)' src/app/api/orgs/
```

Expected: 4 hits (one per G1 GET route at profile, addresses, users, invitations). If hits drift below 4, HALT — could indicate regression after sibling fix-forward; surface for substrate-re-derivation. If hits exceed 4, surface — could indicate adjacent GET endpoints gained the same gate (possibly intentional but substrate-verify before proceeding).

- [ ] **Step 0.2: Confirm (e) variant resolution**

Operator confirms which (e) variant has been ratified:
- **Variant α (S29b adds C/E test coverage):** Pattern C/E annotation rationale carries timeline-bounded `(pattern-C: deferred to S29b)` shape.
- **Variant β-soft (LT-02/S31 absorbs gap):** Pattern C/E annotation rationale carries longer timeline `(pattern-C: deferred; test coverage tracked as LT-02/S31 obligation)`. Rule logic identical to Variant α.

(e) variants are non-blocking for opening (both proceed to Task 1); only the annotation rationale text differs at Task 6 Step 2.

- [ ] **Step 0.3: Confirm (c4) updateOrgProfile field-naming disposition**

Per pre-flight pre-3 substrate finding: ORG_SCOPED_TOOLS Set semantics are narrower than first-glance reading; updateOrgProfile is intentionally outside the Set because its null-org check + withInvariants wrap happen inline at the dispatcher (orchestrator/index.ts:1214-1227, substrate-confirmed at brief-creation post-feedback). Operator chooses field naming for the per-tool annotation:
- `orgScoped: boolean` with documented narrower semantics ("tool's null-org check is gated by Set membership at dispatcher; tools with their own per-tool dispatch checks have orgScoped: false").
- `requiresOrchestratorOrgGate: boolean` (more precise; longer; matches Set semantics literally).
- Alternative.

Resolution lands at this step; subsequent task steps use the resolved name.

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S30-ci-enforcement-cluster
```

Then export in your shell:

```bash
export COORD_SESSION='S30-ci-enforcement-cluster'
```

Verify lock present:

```bash
cat .coordination/session-lock.json
```

Expected: lock contents include `"session": "S30-ci-enforcement-cluster"`, fresh `started_at` timestamp, current PID. Per element #12 lock-mechanical-discipline finding from S29a: lock-acquisition is what UPGRADES the pre-commit hook from advisory to blocking. Without matching COORD_SESSION the hook silently downgrades. **Verify-after-acquire is load-bearing.**

- [ ] **Step 2: Confirm HEAD points at the brief's authoritative commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit on the brief is the S30 re-anchor commit; its parent is `5d58b36` (sibling fix-forward post-G1-hot-fix). Earlier in the chain: `5d58b36` → `c617f58` → `b4f6063` → `ee35abf` → `53aa533` → `c47e58d` (S29a execution). If any drift, halt and surface to operator.

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

- [ ] **Step 4: Defensive variant-disposition re-check**

Per Task 0 discipline: (d) was resolved at hot-fix arc (`c617f58` + `5d58b36`); (e) and (c4) field-naming were resolved before lock acquisition. This step is a defensive re-check against ratified state; primary halt-point is Task 0.

If Task 0 Step 0.1's `caller.org_ids.includes(orgId)` grep returned anything other than 4 hits (drift in (d) closure substrate) and Task 0 was bypassed: **HALT immediately**, release lock via `bash scripts/session-end.sh`, and re-run Task 0 Step 0.1 against execution-time HEAD before re-opening.

---

## Task 2: Convention #8 verify-directly + sub-pre-flight

The brief's pre-flight findings were substrate-grounded at brief-creation HEAD `c47e58d`. Re-verify before any edit. Halt on drift.

- [ ] **Step 1: Re-verify lint baseline + 7 canonical-form annotation sites**

```bash
pnpm lint 2>&1 | tail -3
grep -rn "// withInvariants: skip-org-check" src/services/ | wc -l
```

Expected: lint problem count matches pre-flight (~10,614 problems); annotation count = 7. If annotation count drifts, halt — could indicate a site was added/removed between brief-creation and execution; surface for substrate-re-derivation.

- [ ] **Step 2: Re-verify ORG_SCOPED_TOOLS substrate**

```bash
grep -A6 "const ORG_SCOPED_TOOLS = new Set" src/agent/orchestrator/index.ts
grep -n "if (toolName === 'updateOrgProfile')" src/agent/orchestrator/index.ts
```

Expected: 5-entry Set at lines 1098-1104; per-tool dispatch check at line ~1214. Halt on drift.

- [ ] **Step 3: Re-verify tool registry**

```bash
grep "^export {" src/agent/tools/index.ts | wc -l
```

Expected: 10 tool exports. If count drifts, surface — could indicate a new tool added between brief-creation and execution; substrate-re-derive.

- [ ] **Step 4: Sub-pre-flight — Pattern B verbatim-action enumeration**

For each Pattern B mutation site, identify (i) service file:line of export; (ii) all route-handler files that wrap it via `withInvariants(serviceFn, { action: '...' })`; (iii) action string(s) at each wrap-site; (iv) whether export has any non-route-handler consumers.

```bash
# Enumerate Pattern B mutation sites:
grep -rn "withInvariants(.*\.post\|withInvariants(.*\.create\|withInvariants(.*\.update\|withInvariants(.*\.deactivate\|withInvariants(.*\.generate\|withInvariants(.*\.approve\|withInvariants(.*\.reject\|withInvariants(.*\.invite\|withInvariants(.*\.revoke\|withInvariants(.*\.resend" src/app/api/
```

Output: per-site mapping table. If 1:1 mapping holds (each Pattern B export has exactly one route-handler wrap-site with one action string), verbatim-action annotation lands cleanly. If multi-handler or non-handler-consumer surfaces, surface to operator for per-site disposition (multi-action annotation, representative-action, or generic fallback per pre-decision (a) refinement).

- [ ] **Step 5: Defensive substrate re-verification of (c4) state**

Per Task 0 Step 0.3: field-naming was resolved before lock acquisition based on substrate-confirmed state 2. This step re-verifies the substrate at execution-time HEAD to confirm state 2 still holds (defense against substrate drift between brief-creation and execution).

```bash
sed -n '1213,1227p' src/agent/orchestrator/index.ts
```

Expected at HEAD `c47e58d`: lines 1214-1227 contain `if (toolName === 'updateOrgProfile')` block with inline null-org check (1219-1223) and inline `withInvariants(orgService.updateOrgProfile, { action: 'org.profile.update' })` wrap (1224-1227). If substrate has drifted, halt and surface — field-naming choice may need re-litigation.

---

## Task 3: LT-03 — adminClient import restriction + .next/ ignore

- [ ] **Step 1: Edit eslint.config.mjs**

Add to the rules block:

```js
{
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@/db/adminClient", "**/db/adminClient"],
        message: "adminClient import is restricted to src/services/. Route handlers and other layers must consume services rather than the admin client directly (UF-006).",
      }],
    }],
    // ... existing rules ...
  },
},
{
  // Override: src/services/ may import adminClient
  files: ["src/services/**/*.ts"],
  rules: {
    "no-restricted-imports": "off",
  },
},
```

Add `ignores: ['.next/**']` to the top-level config array OR to a dedicated config object per ESLint flat config conventions. Substrate-confirm the precise syntax against `eslint.config.mjs` shape at HEAD; the lean is a top-level `{ ignores: ['.next/**'] }` entry.

- [ ] **Step 2: Verify the rule fires + baseline closes**

```bash
pnpm lint 2>&1 | tail -3
```

Expected: error count drops materially (the 9,860 errors from `.next/` should be gone). Remaining errors should be from real source code (warnings + any actual rule violations).

```bash
# Spot-check: temporarily add `import { adminClient } from '@/db/adminClient'` to a route handler file; run lint; expect the rule to fire; revert.
```

---

## Task 4: LT-04 — ORG_SCOPED_TOOLS drift check refactor + per-tool annotation

- [ ] **Step 1: Confirm field-naming resolution from Task 0 Step 0.3**

Field-naming choice (`orgScoped` / `requiresOrchestratorOrgGate` / alternative) was resolved at Task 0 Step 0.3 before lock acquisition. **`{fieldname}` placeholder used in subsequent Task 4 / Task 6 / Task 10 steps refers to this resolved name; substitute consistently across all propagation points (Step 2 annotation values, Step 3 type definition, Step 4 module file content, Step 6 drift test, Task 10 Step 3 commit body).** Re-confirm the resolved name here for executor reference.

- [ ] **Step 2: Add required field to ToolDef + annotate all 10 tools**

For each tool file under `src/agent/tools/`, add the resolved field as a required property. Substrate-grounded values per pre-flight Section "LT-04 target":

- updateUserProfileTool: `false`
- createOrganizationTool: `false`
- updateOrgProfileTool: per (c4) substrate state resolution
- listIndustriesTool: `false`
- listChartOfAccountsTool: `true`
- checkPeriodTool: `true`
- listJournalEntriesTool: `true`
- postJournalEntryTool: `true`
- reverseJournalEntryTool: `true`
- respondToUserTool: `false`

- [ ] **Step 3: Update ToolDef type to require the field**

Update the type definition in `src/agent/tools/types.ts` (or wherever ToolDef lives) to declare the field as required. Run `pnpm typecheck` — should fail at any tool missing the field, confirming type-system enforcement.

- [ ] **Step 4: Create dedicated module `src/agent/tools/orgScopedTools.ts`**

```ts
// src/agent/tools/orgScopedTools.ts
//
// Derived ORG_SCOPED_TOOLS Set. Single source of truth for "tools whose
// null-org check is gated by Set membership at the orchestrator
// dispatcher." Tools with their own per-tool null-org checks (e.g.,
// updateOrgProfile at orchestrator/index.ts:~1214) are intentionally
// excluded; the {fieldname} flag on each ToolDef is the canonical
// decision point. LT-04 drift check verifies derivation correctness.
//
// QUALITY-006 closure (S30; Path C arc).

import * as tools from '@/agent/tools';

export const ORG_SCOPED_TOOLS: ReadonlySet<string> = new Set(
  Object.values(tools)
    .filter((t) => t.{fieldname})
    .map((t) => t.name),
);
```

Replace `{fieldname}` with the resolved name from Step 1.

- [ ] **Step 5: Update orchestrator to consume the derived Set**

```bash
# Replace lines 1098-1104 (or substrate-current line range) of src/agent/orchestrator/index.ts:
# from: const ORG_SCOPED_TOOLS = new Set([...]);
# to: import { ORG_SCOPED_TOOLS } from '@/agent/tools/orgScopedTools';
```

Move the import to the top of the file with other imports.

- [ ] **Step 6: Add drift test**

Create `tests/unit/agent/orgScopedTools.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ORG_SCOPED_TOOLS } from '@/agent/tools/orgScopedTools';
import * as tools from '@/agent/tools';

describe('ORG_SCOPED_TOOLS drift check (LT-04 / QUALITY-006)', () => {
  it('derives ORG_SCOPED_TOOLS from tool registry orgScoped field', () => {
    const expected = new Set(
      Object.values(tools).filter((t) => t.{fieldname}).map((t) => t.name),
    );
    expect(ORG_SCOPED_TOOLS).toEqual(expected);
  });

  it('every tool has explicit orgScoped decision (type-check enforced; runtime spot-check)', () => {
    for (const tool of Object.values(tools)) {
      expect(tool).toHaveProperty('{fieldname}');
      expect(typeof tool.{fieldname}).toBe('boolean');
    }
  });
});
```

- [ ] **Step 7: Run typecheck + drift test**

```bash
pnpm typecheck 2>&1 | tail -5
pnpm test orgScopedTools 2>&1 | tail -10
```

Expected: typecheck clean; drift test passes.

---

## Task 5: LT-01(b) — withInvariants wrap-or-annotate ESLint custom rule

- [ ] **Step 1: Substrate-verify dependencies**

```bash
grep '"@typescript-eslint/utils"' package.json node_modules/@typescript-eslint/utils/package.json 2>&1 | head -3
```

If `@typescript-eslint/utils` is not installed, install it: `pnpm add -D @typescript-eslint/utils`.

- [ ] **Step 2: Create rule directory + rule file**

Create `eslint-rules/withInvariants-wrap-or-annotate.js` (or `.ts` + build step; substrate-decide per project conventions). Rule shape:

- Visitor: `ExportNamedDeclaration`
- For each ObjectExpression bound to a VariableDeclarator under the export, walk Properties
- For each Property whose value is an async function (FunctionExpression with async or ArrowFunctionExpression with async):
  - Pass if value is a CallExpression with callee `Identifier('withInvariants')`
  - Pass if leading comments contain a comment matching the canonical-form regex: `/^\/\/ withInvariants: skip-org-check \(pattern-[A-Z][A-Z0-9]?: .+\)$/`
  - Else: report at the Property location with message: `"Service-layer org-scoped export '{name}' must be either wrapped in withInvariants(...) or annotated with the canonical-form skip-org-check comment (S29a; UF-006)."`

**Known AST gotcha (substrate-derive at execution):** at the 7 canonical sites, the shape is `Property` with `method: true` and FunctionExpression value (object-literal shorthand-method syntax: `async name(...) {}`), NOT `Property` with `shorthand: true` (which is a different AST shape used for `{ name }` destructure-style). Some parsers emit `MethodDefinition` for class methods but `Property` with `method: true` for object-literal methods. Visitor must handle the `method: true` case explicitly OR walk both `Property` and `MethodDefinition` nodes — substrate-confirm by inspecting AST output for one of the 7 sites (e.g., via `npx eslint --print-config` or AST explorer) before finalizing the visitor.

- [ ] **Step 3: Register the rule in eslint.config.mjs**

Add the custom rule plugin to `eslint.config.mjs`:

```js
import customRules from './eslint-rules/index.js';

// ...

const eslintConfig = [
  // ... existing config ...
  {
    files: ['src/services/**/*.ts'],
    plugins: { services: customRules },
    rules: {
      'services/withInvariants-wrap-or-annotate': 'error',
    },
  },
];
```

- [ ] **Step 4: Run rule against substrate**

```bash
pnpm lint src/services/ 2>&1 | grep "services/withInvariants-wrap-or-annotate" | tail -30
```

Expected (pre-annotation-pass): rule fires at all Pattern B/C/E/H/G1 sites (per (d)/(e) variant disposition); rule does NOT fire at the 7 canonical-annotated sites or the 16 Pattern A wrapped sites.

- [ ] **Step 5: Add unit tests for the rule**

Create `eslint-rules/__tests__/withInvariants-wrap-or-annotate.test.js` covering:
- Pass: wrapped Pattern A site
- Pass: canonical-annotated Pattern D site
- Pass: canonical-annotated Pattern G2 site
- Pass: canonical-annotated Pattern I site
- Fail: unwrapped + un-annotated site
- Fail: non-canonical comment shape (e.g., wrong pattern enum, wrong parens)

```bash
pnpm test eslint-rules 2>&1 | tail -10
```

---

## Task 6: Pattern B/C/E/H annotation pass

- [ ] **Step 1: Annotate Pattern B sites with verbatim action per Task 2 Step 4 sub-pre-flight**

For each Pattern B site (substrate-derived list at Task 2 Step 4):
- Add `// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: '<action_string>'))` immediately above the property declaration.

- [ ] **Step 2: Annotate Pattern C/E sites per (e) variant disposition**

If (e) Variant α: `// withInvariants: skip-org-check (pattern-C: deferred to S29b)` / `(pattern-E: deferred to S29b)`.
If (e) Variant β-soft: `// withInvariants: skip-org-check (pattern-C: deferred; test coverage tracked as LT-02/S31 obligation)` / `(pattern-E: ...)`.

Sites: journalEntryService.ts get; recurringJournalService.ts getTemplate, getRun.

- [ ] **Step 3: Annotate Pattern H site**

`// withInvariants: skip-org-check (pattern-H: dead code; remove in Phase 2 cleanup)` at membershipService.listForUser.

- [ ] **Step 4: Verify rule passes against post-annotation substrate**

```bash
pnpm lint src/services/ 2>&1 | grep "services/withInvariants-wrap-or-annotate"
```

Expected: zero rule violations (all sites either wrapped or annotated; G1 sites pass via wrap-detection at the route handler layer per hot-fix arc).

```bash
grep -rn "// withInvariants: skip-org-check" src/services/ | wc -l
```

Expected count: 7 (existing D/G2/I) + 10 (Pattern B) + 3 (Pattern C/E) + 1 (Pattern H) = 21 total.

---

## Task 7: LT-01(c) — formalize existing narrow check (per (c-1c-α))

- [ ] **Step 1: Verify existing check runs in `pnpm agent:validate`**

```bash
grep "agent:validate" package.json
```

Expected: `agent:validate` script chains `test:no-hardcoded-urls`. (Already does at HEAD; verify unchanged.)

- [ ] **Step 2: Document scope explicitly**

Confirm CLAUDE.md (or a sibling doc routed via LT-01(d) reconciliation) documents the narrow scope: `pnpm test:no-hardcoded-urls` blocks only Supabase API local URLs (`localhost:54321` / `127.0.0.1:54321`); non-Supabase `localhost` references are intentional and out-of-scope per (c-1c-α). Documentation update batches into the LT-01(d) audit at Task 8 if not already covered there.

---

## Task 8: LT-01(d) — CLAUDE.md / AGENTS.md reconciliation audit

**Time-box:** 60 minutes; starts at this Task entry (not session start). Hard ceiling.

- [ ] **Step 1: Audit pass enumeration**

Read CLAUDE.md (185 lines) sequentially; for each claim that asserts substrate-shape, verify against substrate. Allowed: one-hop reads of cited docs for claim-verification only (no recursive descent). One-hop reads count against time-box.

- [ ] **Step 2: Build audit-pass inventory (substrate-record sibling artifact)**

Create `docs/09_briefs/phase-1.3/session-30-audit-inventory.md` with structure:

```md
# S30 LT-01(d) audit-pass inventory

## Audited claims
| Claim location (file:line) | Claim text | Substrate verification | Disposition |
|---|---|---|---|
| ... | ... | ... | auto-resolve silent / auto-resolve commit-message-noted / surface for operator |

## Auto-resolved (silent)
- ...

## Auto-resolved (commit-message-noted)
- ...

## Surfaced for operator decision
- ...

## Pre-flight delta inventory (from S30 brief-creation pre-flight, carried forward)
- pre-1: ...
- pre-2: ...
- pre-3: ...

## Time-box adherence
- Audit task entered at: ...
- Audit task completed at: ...
- Within 60-min ceiling: yes/no
- Unaudited remainder (if overrun): ...
```

- [ ] **Step 3: Apply auto-resolved fixes (silent + commit-message-noted)**

Edit CLAUDE.md / AGENTS.md per the inventory. Auto-resolve-silent fixes go directly into the commit. Auto-resolve-commit-message-noted fixes go into the commit AND get a line in the commit body.

Per pre-flight: rename "Rule 8" references throughout S30 brief AND any CLAUDE.md references (if any) to `pnpm test:no-hardcoded-urls`.

- [ ] **Step 4: Surface findings for operator decision**

Findings in the third bucket get:
- A friction-journal NOTE entry per finding, OR
- An ADR proposal under `docs/07_governance/adr/`, depending on severity.

Operator decides direction (update doc to match code, or restore code to match doc) before S30 commit.

---

## Task 9: Full-suite regression

- [ ] **Step 1: agent:validate**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green. Per element #16 from S29a closeout: pre-flight should include test-floor verification with clean-baseline pre-condition.

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 3: lint**

```bash
pnpm lint 2>&1 | tail -5
```

Expected: error count materially reduced from pre-S30 baseline (10,614 problems). Remaining problems should be limited to source-code warnings or the deliberately-added LT-01(b) rule firings if any sites slipped through annotation pass.

- [ ] **Step 4: full vitest suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: pre-existing carry-forward count unchanged from S29a element #19 baseline (verifyAuditCoverageRoundTrip carry-forward; accountLedgerService running-balance carry-forwards if exposed via cascading test-ordering pollution per S29a element #19). New addition: drift test green.

If unexpected drift surfaces, apply S29a's stash-revert isolation discipline (now N=2 → graduates with this firing if used) to discriminate edit-effect from baseline-state.

---

## Task 10: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. NOTE plan structure:

1. **UF-006 + UF-013 + QUALITY-006 closure citation** — cite specific surfaces closed: LT-03 adminClient import restriction; LT-01(b) custom rule + annotation pass (28 annotations added at S30 = 10 brief-enumerated Pattern B + 3 Pattern C/E + 1 Pattern H + 4 Pattern G1 + 10 Pattern B surfaced at execution-time Task 5 verification; total annotated sites in src/services/ at S30 closeout = 35 including the 7 D/G2/I existing at HEAD `c47e58d`; G1 sites annotated with route-handler-gate rationale per hot-fix arc `c617f58` + `5d58b36`); LT-01(c) narrow-scope formalization per (c-1c-α); LT-01(d) reconciliation per audit inventory; LT-04 per-tool `gatedByDispatcherSet: boolean` field via `defineTool<T extends BaseToolDef>` helper + drift check + orchestrator import.
2. **Brief-creation pre-flight as substrate-fidelity gate (codification graduated at N=3 this session).** Provenance: pre-1 (lint baseline), pre-2 ("Rule 8" framing-gap), pre-3 (updateOrgProfile substrate-finding). Codified shape: brief-creation sessions produce a pre-flight delta inventory as a sibling artifact, surfaced before pre-decisions begin. Pairs with S29a element #3 at the substrate-vs-claim discipline layer; covers the aggregate substrate-fidelity of brief-creation as a process. **Meta-pattern note:** the codification graduated DURING the very brief-creation session that generated the firings — codification firing within the session that produced it is itself a discipline-shape worth marking, and pairs with element #3's "applies recursively at every layer of inheritance" clause at the time-axis layer.

   **pre-4: Brief-drafting introducing operator-pending without dialogue ratification.** During brief-drafting, the (c-1c) LT-01(c) scope-extension question was introduced as a fourth operator-pending pre-decision without that having been ratified in dialogue. Sibling shape to pre-1/2/3 but at the brief-drafting cadence (within-session) rather than parent-brief or pre-flight (cross-session). Caught by operator at structural review; resolved at brief-creation as (c-1c-α) narrow-scope ratification. N=1 candidate-shape: substrate-fidelity firings are now visible at every cadence layer (parent-brief framing → pre-flight derivation → brief-drafting decisions → execution-time substrate). The aggregate evidence is that the codified discipline catches inherited-framing drift at progressively finer cadence layers as it matures. **pre-5: Brief-drafting over-claiming substrate-fidelity.** During brief-drafting, pre-flight pre-3's "state 2" finding was asserted as substrate-confirmed without actually reading the cited line range — only a grep returned line numbers; substrate verification was completed post-operator-feedback. Sibling shape to pre-4 at the brief-drafting layer; another fractal-fidelity firing on the brief-drafter's own derivation. Both pre-4 and pre-5 fold into element #2's codification provenance as continuing-firings-after-graduation evidence.
3. **Conditional task-shape encoding precedent (codification candidate at N=1).** S30 brief encoded (d)/(e) operator-pending decisions as conditional task variants rather than waiting for resolution between sessions. Variant α/β/γ branches with explicit operational semantics ("paused", "annotation rationale only", "annotation absent"). Pairs with un-compressed-rhythm gate-cadence-calibration (S29a element #10) at the open-loop-management layer. N=1; not graduated; future briefs with operator-pending decisions evaluate adoption.
4. **Annotation-default discipline.** S30's LT-01(b) committed to annotation-everywhere with empty starting allowlist. Allowlist mechanism reserved for future standing-architectural exemptions where rule-scope-refinement isn't viable. Discriminator: "annotation for transient and standing-with-rationale-at-call-site, allowlist for standing-only-when-call-site-annotation-is-structurally-unworkable." Sibling shape to S29a element #15's (γ)-rhythm scope-amend discipline.
5. **(c4) updateOrgProfile substrate state-2 resolution.** Pre-flight substrate-investigation surfaced that ORG_SCOPED_TOOLS Set semantics are narrower than first-glance reading (state 2: mechanism elsewhere). Field-naming question (orgScoped vs requiresOrchestratorOrgGate vs alternative) resolved at Task 0 Step 0.3 (before lock acquisition) to <field name>. Documented in dedicated module's file-top.
6. **Variant disposition outcomes.** (d) resolved to Variant γ at S30 brief-creation (substrate-grep-first ratification flip) and executed at hot-fix arc (`c617f58` + `5d58b36`); G1 territory closed pre-S30. (e) resolved to Variant <α/β-soft> at <Task 0 Step 0.2 — operator-pending until execution>.
7. **LT-01(d) audit outcomes.** Time-box adherence: <within / overrun>. Bucket counts: <X auto-resolved silent, Y auto-resolved commit-message-noted, Z surfaced>. Audit inventory at `docs/09_briefs/phase-1.3/session-30-audit-inventory.md`.
8. **Stash-revert isolation candidate.** If used during Task 9 regression, this is the third firing — graduates per Documentation Routing convention's N=3 threshold.
9. **Codification candidate updates.** Conditional-task-shape at N=1 (this session); brief-creation-pre-flight-gate at N=∞ (graduated this session); fractal-substrate-fidelity (S29a element #3) continued post-graduation firings if any.

NOTE plan formatting follows the existing tail entries' shape (date prefix, lead-line, lettered or numbered sub-elements as appropriate to length).

- [ ] **Step 2: Stage all changes**

```bash
git add eslint.config.mjs \
        eslint-rules/ \
        src/agent/tools/ \
        src/agent/orchestrator/index.ts \
        src/services/accounting/ \
        src/services/agent/ \
        src/services/middleware/ \
        src/services/org/ \
        src/services/reporting/ \
        src/services/user/ \
        tests/unit/agent/orgScopedTools.test.ts \
        eslint-rules/__tests__/ \
        package.json \
        CLAUDE.md \
        AGENTS.md \
        docs/07_governance/friction-journal.md \
        docs/09_briefs/phase-1.3/session-30-audit-inventory.md
git status --short
```

Expected: staged files match the variant dispositions and audit outcomes. If route-handler files appear in the staged list, halt — none should be touched per the architecture (no service-layer behavior changes; no orchestrator behavior changes; LT-01(b) rule scopes via `files: ['src/services/**/*.ts']` override).

- [ ] **Step 3: Commit (Y2-shape: single bundled by default; Y2-split if net diff > ~200 lines or LT-01(d) surfaces non-trivial drift)**

Subject (under 70 chars): `feat(ci): S30 LT-01 + LT-03 + LT-04 convention-to-CI-enforcement cluster`

Body covers:
- LT-03: no-restricted-imports rule for adminClient outside src/services/.
- LT-01(b): custom ESLint rule services/withInvariants-wrap-or-annotate + annotation pass (28 added at S30: 10 brief-enumerated Pattern B + 3 Pattern C/E + 1 Pattern H + 4 Pattern G1 + 10 Pattern B surfaced at execution-time Task 5 verification; 35 total annotated sites in src/services/ at S30 closeout including the 7 D/G2/I existing at HEAD c47e58d). G1 sites pass via canonical-form annotation match (route-handler-gate rationale), not wrap-detection — rule scope is service-layer files only.
- LT-01(c): per (c-1c) variant disposition.
- LT-01(d): per audit inventory; <X> auto-resolves silent; <Y> commit-message-noted; <Z> surfaced.
- LT-04: per-tool {fieldname}: boolean required field on ToolDef; ORG_SCOPED_TOOLS derived in src/agent/tools/orgScopedTools.ts; drift test in tests/unit/agent/.
- .next/ ignore in eslint.config.mjs (closes 9,860-error pre-existing baseline).
- UF-006 + UF-013 + QUALITY-006 closure cited.
- Friction-journal NOTE in same commit per S25-S29a governance precedent.

Do NOT include `Co-Authored-By` unless operator-confirmed at closeout.

- [ ] **Step 4: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the S30 commit SHA. Per element #16: re-run `db:reset:clean && db:seed:all` if state pollution surfaces.

- [ ] **Step 5: Session end**

```bash
bash scripts/session-end.sh
```

Lock release; COORD_SESSION unset.

- [ ] **Step 6: Surface S30 closeout to operator**

Single message summarizing:
- Commit SHA(s).
- LT-03 + LT-01(b) + LT-01(c) + LT-01(d) + LT-04 closure summary per exit-criteria matrix.
- Pre-flight findings → execution outcomes mapping (any drift, any unexpected hits surfaced).
- Variant resolution outcomes for (d) and (e).
- (c4) field-naming resolution outcome.
- Friction-journal NOTE summary (closeout inventory).
- LT-01(d) audit-pass inventory summary (X/Y/Z bucket counts).
- S29b unblocked: design-bearing migration of Patterns C/E (3 sites) sequences after S30 per the corrigendum's revised dependency graph. **Variant disposition reminder for S29b:** if (e) Variant β-soft was chosen, S29b annotation rationale carries longer timeline; if (e) Variant α was chosen, S29b's pre-flight adds C/E test coverage.
- Path C arc closure proximity: after S30 + S29b + S31 (LT-02), Path C closes; Phase 2 surface expansion gate unblocks.

---

## Verification harness alignment

S30's exit-criteria map to the Path C arc-summary verification harness Gate 4 (post-corrigendum) checks:

**Gate 4: LT-01 + LT-03 + LT-04 closed**
- `LT-03-adminClient-restriction` — `eslint.config.mjs` carries `no-restricted-imports` rule blocking `@/db/adminClient` outside `src/services/`.
- `LT-01(b)-wrap-or-annotate` — custom rule registered; rule fires zero false-positives on canonical-annotated sites; 35 annotations total in src/services/ at S30 closeout: 7 D/G2/I existing at HEAD `c47e58d` + 28 added at S30 (10 brief-enumerated Pattern B + 3 Pattern C/E + 1 Pattern H + 4 Pattern G1 [route-handler-gate rationale] + 10 Pattern B surfaced at execution-time-pre-flight Task 5 verification). G1 sites pass via canonical-form annotation match, not wrap-detection (rule scope is service-layer files only).
- `LT-01(c)-no-hardcoded-urls` — per (c-1c) variant.
- `LT-01(d)-doc-reconciliation` — audit inventory complete; auto-resolved fixes committed; surfaced findings as NOTE/ADR entries.
- `LT-04-orgScopedTools-drift` — drift test green; per-tool annotation type-system-enforced.

Gate 4 calibrates against S30 commit SHA; subsequent S29b sequences against this state.

---

## Friction-journal NOTE plan (summary; full text in Task 10 Step 1)

Nine-element inventory (the running closeout NOTE plan from brief-creation), with element #2 incorporating five sub-firings (pre-1, pre-2, pre-3, pre-4, pre-5) of the substrate-fidelity-gate codification:

1. UF-006 + UF-013 + QUALITY-006 closure
2. Brief-creation pre-flight as substrate-fidelity gate (codification graduated at N=3 with continuing post-graduation firings at pre-4 and pre-5 within the same session — meta-pattern of codification-firing-within-session-that-produced-it)
3. Conditional task-shape encoding precedent (codification candidate at N=1)
4. Annotation-default discipline (sibling of S29a element #15's (γ)-rhythm scope-amend)
5. (c4) updateOrgProfile substrate state-2 resolution + field-naming
6. Variant disposition outcomes ((d), (e))
7. LT-01(d) audit outcomes (bucket counts, time-box adherence)
8. Stash-revert isolation candidate (graduates if Task 9 fires)
9. Codification candidate updates

Carry-forward elements from hot-fix arc closeouts (`c617f58` + `5d58b36`) — fold into S30 closeout NOTE per substrate-grep-first closure-execution-evidence framing:
- **element-pre-6:** substrate-grep-first codification's third firing flip from operator's prior (Variant β) to ratified (Variant γ) executed at hot-fix arc; closure-execution evidence for the codification.
- **element-pre-7 family:** substrate-fidelity-gate continuing-firings at hot-fix arc cadence layers (lock-acquisition cadence at pre-7; brief-drafting cadence at pre-7-sub-2; brief-drafting deferred-decision cadence at pre-7-sub-3; post-execution-review cadence at sibling fix-forward closeout). Five distinct cadence layers now firing across the hot-fix arc.
- **Codification candidates from hot-fix arc at N=2:** "Resolved-decision-citation as contract" (service-layer JSDoc + route-handler file-top); "Reconciliation-scope-derivation as substrate-completeness gate" (S29a element #18 + hot-fix route-handler file-top scope-gap).

Element count: 9-element baseline + 3 carry-forward elements from hot-fix arc + N from re-anchor session itself = substrate-derived count post-additions. Closeout will likely add further elements per execution-time substrate findings (per S29a precedent: brief-creation projected 11; closeout shipped 19).

---

## Out-of-scope explicit list (recap for executor reference)

1. Phase 2 obligations (MT-02, MT-04, QW-06, UF-015).
2. Path A scope (DND-01..05).
3. LT-02 / S31 (test coverage cluster).
4. S29b (Patterns C/E design-bearing migration).
5. Pattern A wrap mechanization (S29a closed).
6. Element #6 G1 substantive remediation. RESOLVED pre-S30 via hot-fix arc (`c617f58` + `5d58b36`). G1 territory closed; not in S30 scope because it's already done. (Variants α/β/γ from S30 brief-creation have no remaining S30 implications post-resolution.)
7. Pattern H removal (dead code; Phase 2 cleanup); annotation only.
8. docs/INDEX.md or broader docs-tree audit.
9. Recursive-descent reads from CLAUDE.md citations.
10. Route-handler edits (none expected; rule scopes apply via `files: ['src/services/**/*.ts']` override).

Items 1, 3, 4, 6 are particularly likely to surface as confused-scope at execution; the executor should decline scope expansion and surface for operator decision rather than proceeding.
