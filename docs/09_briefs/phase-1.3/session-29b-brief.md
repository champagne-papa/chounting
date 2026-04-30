# Session 29b — Path C MT-03 Patterns C/E design + migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S29b is service-signature refactor + route-handler call-site updates; no orchestrator request fires).

**Goal:** Close MT-03 Patterns C/E (3 sites) via input-shape refactor — the design-bearing migration that converts the annotated-exception sites at S30 closeout (`pattern-C: deferred to S29b` / `pattern-E: deferred to S29b`) into wrapped sites under `withInvariants`. After S29b, the LT-01(b) ESLint rule fires green via wrap-detection (not annotation-match) at all three sites; service-layer property references at `journalEntryService.get`, `recurringJournalService.getTemplate`, `recurringJournalService.getRun` become `Property{value: CallExpression(callee: withInvariants)}`.

**Framing refinement against arc-summary's S29b section.** The arc-summary's pre-decision (a) framed two design choices (input-shape refactor vs `withInvariants` overload). Brief-creation pre-flight at HEAD `e966f30` substrate-confirmed the caller surface is materially narrower than the arc-summary implied: 2 route handlers + 0 agent-tool consumers + 0 service-to-service callers + 1 unconsumed export (`getRun`). The "input-shape refactor propagates to all callers including agent tools" risk does not materialize at substrate. Operator-ratified pre-decision (a-α) at brief-creation: input-shape refactor for all three sites; no `withInvariants` overload. Arc-summary pre-decision (b) framed RECURRING_TEMPLATE_NOT_FOUND uniformity as a binary; substrate at HEAD shows the code is used at 5 service-internal sites + 1 test + 1 mapping with substrate-coherent semantic distinction (intra-org-not-found at mutations vs cross-org-not-found at getTemplate dual-use). Operator-ratified pre-decision (b-γ): leave domain-specific code in place (substrate-coherent existing pattern; uniformity question orthogonal to wrap-mechanism question; expanding S29b to include uniformity is scope-creep).

**Architecture (V1 minimal scope):**

- **Pattern C — `journalEntryService.get`.** Refactor input shape from `{ journal_entry_id: string }` to `{ org_id: string; journal_entry_id: string }`. Function body unchanged on the authorization shape — the existing `.in('org_id', ctx.caller.org_ids)` filter remains; the wrap's Invariant 3 fires first against the new `input.org_id` (defense-in-depth). Wrap at the export site: `get: withInvariants(get)`. Throws unchanged (`'NOT_FOUND'` generic). Route handler (`orgs/[orgId]/journal-entries/[entryId]/route.ts:15`) updates call-site to pass `{ org_id: orgId, journal_entry_id: entryId }`.
- **Pattern C-variant — `recurringJournalService.getTemplate`.** Refactor input shape from `{ recurring_template_id: string }` to `{ org_id: string; recurring_template_id: string }`. Function body unchanged on authorization (`.in('org_id', ctx.caller.org_ids)` filter preserved; wrap's Invariant 3 fires first against new `input.org_id`). Wrap at export site: `getTemplate: withInvariants(getTemplate)`. Throws unchanged (`'RECURRING_TEMPLATE_NOT_FOUND'` domain-specific per pre-decision (b-γ)). Route handler (`orgs/[orgId]/recurring-templates/[templateId]/route.ts:17`) updates call-site to pass `{ org_id: orgId, recurring_template_id: templateId }`.
- **Pattern E — `recurringJournalService.getRun`.** Refactor input shape from `{ recurring_run_id: string }` to `{ org_id: string; recurring_run_id: string }`. Body refactor: replace the two-step lookup (run first, then parent template's `org_id` via `ctx.caller.org_ids.includes(...)`) with a join-style query that asserts cross-org via the FK `recurring_journal_runs.recurring_template_id → recurring_journal_templates.recurring_template_id` and the parent's `org_id` filter. Wrap at export site: `getRun: withInvariants(getRun)`. Throws unchanged (`'NOT_FOUND'` generic on cross-org and not-found). **0 external callers** at substrate (substrate-fidelity-gate firing at brief-creation pre-flight cadence; sibling-shape to `invitationService.resendInvitation` at S28 re-anchor pre-flight); refactor is functionally zero-breakage.

**Tech stack:** TypeScript, Supabase Postgres (FK join via PostgREST embedded select), Vitest. No new dependencies. No schema changes (FK already exists at migration `20240131000000_recurring_journal_templates.sql:134`). No migrations. No orchestrator or prompt edits. No agent-tool surface changes (zero consumers).

---

**Anchor (parent) SHA:** `e966f30` (S28 execution close — MT-05 audit-emit flag + MT-06 PII redaction expansion) chained from `4a3eafb` (S28 brief re-anchor) → `64996b5` (S30 execution close) → `c9fb118` (S30 re-anchor-2) → `595556a` (S30 re-anchor) → `5d58b36` (sibling fix-forward) → `c617f58` (S30 hot-fix execution) → `b4f6063` (S30 hot-fix brief) → `ee35abf` (gitignore) → `53aa533` (S30 brief) → `c47e58d` (S29a closeout) → `bafd4f9` (S29a brief) → corrigendum + arc-summary chain. Verify HEAD's parent matches at Task 1 Step 2.

**Upstream authority:**
- `docs/09_briefs/phase-1.3/path-c-arc-summary.md` — S29b section (lines 160-196 at HEAD); pre-decisions a/b/c framing; revised dependency graph (S30 → S28 → S29b → S31).
- `docs/07_governance/audits/phase-1.2/action-plan.md` — MT-03 broad-scope service auth wrap; UF-002 closure semantics.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-002 (service auth gap; closes via Pattern A at S29a + Patterns C/E at S29b).
- `src/services/middleware/withInvariants.ts` — current single signature; Invariant 3 fires on `input.org_id`. No overload added (per pre-decision (a-α)).
- `src/services/accounting/journalEntryService.ts:454-528` (Pattern C) + `:529-538` (export object with annotation).
- `src/services/accounting/recurringJournalService.ts:675-710` (Pattern C-variant) + `:745-772` (Pattern E) + `:774-793` (export object with annotations).
- `src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts:15` — Pattern C route-handler call-site.
- `src/app/api/orgs/[orgId]/recurring-templates/[templateId]/route.ts:17` — Pattern C-variant route-handler call-site.
- `tests/integration/recurringJournal.test.ts:311` — RECURRING_TEMPLATE_NOT_FOUND test on `generateRun` (NOT getTemplate; orthogonal to S29b scope per pre-decision (b-γ)).
- `eslint.config.mjs` (LT-01(b) rule registration at S30) — rule fires green via wrap-detection at the 3 sites post-S29b; the 3 canonical-form annotations get removed from service files.
- S28 closeout NOTE (friction-journal tail) — codification candidates ledger; carry-forward elements; sequence ratification.

---

## Session label
`S29b-mt-03-c-e-migration` — Path C MT-03 Patterns C/E design + migration.

## Hard constraints (do not violate)

- **Out of scope (Path C and beyond):**
  - MT-03 Pattern A wrap (closed at S29a, `c47e58d`).
  - Pattern G1 cross-org closure (closed at S30 hot-fix arc, `c617f58` + `5d58b36`).
  - LT-01 / LT-03 / LT-04 + QUALITY-006 CI-enforcement cluster (closed at S30, `64996b5`).
  - MT-05 audit-emit observability flag + MT-06 PII redaction expansion (closed at S28, `e966f30`).
  - LT-02 test coverage closure (ships in S31).
  - RECURRING_TEMPLATE_NOT_FOUND uniformity decision (per pre-decision (b-γ): out of scope; substrate-coherent existing pattern preserved; uniformity is Phase 2 obligation if ever scoped).
  - `withInvariants` overload addition (per pre-decision (a-α): not taken; signature unchanged).
  - Substrate-bug at `src/app/api/orgs/[orgId]/users/[userId]/reactivate/route.ts` action-string mismatch (per S30 closeout NOTE element 12; carry-forward; separate fix).
  - Phase 2 PII-coverage consolidated obligation (multi-level pino + financial-PII path depth + PII_FIELDS-vs-pino-paths naming-asymmetry per S28 closeout NOTE category iv).
  - `getRun` consumer surface — adding a route handler or other consumer for the now-unconsumed export is out of scope (substrate-fidelity-gate firing at S29b brief-creation pre-flight; consumer-addition is Phase 2 work if ever scoped).
  - 8 LT-03 architectural-surface sites (Phase 2; per S30 closeout disposition-γ).
  - QW-06 conversation Zod validation (Phase 2).
  - DND-01 / DND-02 / DND-03 (Phase 2 / Path A).
  - Any orchestrator or prompt-text edits.
- **Test posture floor (run-ordinal-dependent per S30 brief re-anchor-2 framing).** `pnpm agent:validate` 26/26 green at HEAD post-edit; if drift surfaces, run `pnpm db:reset:clean && pnpm db:seed:all` to restore clean baseline. Full suite fresh-post-reset baseline at HEAD `e966f30` = 1 failed (`verifyAuditCoverageRoundTrip` orthogonal carry-forward) + 570 passed + 20 skipped (591 total per S28 closeout). Post-S29b edits expected to preserve this baseline; no deliberate test additions at S29b scope (per pre-decision (c) mechanical-only). Halt criteria per Task 6: drift beyond fresh-run baseline halts; carry-forward stays unchanged.
- **No schema changes.** S29b is service-signature refactor + route-handler call-site updates only. No migration files. No type regeneration.
- **No paid-API spend authorization.** S29b does not invoke the orchestrator or fire any Anthropic call.
- **Y2 commit shape (single bundled commit).** Pattern C + Pattern C-variant + Pattern E refactor body single. Friction-journal NOTE appended in the same commit per S25-S29a-S30 governance precedent. **No SHA self-reference in commit body or NOTE body** per S29a element #1 + S28 closeout fix-forward precedent.
- **Hard constraint A — withInvariants signature preservation.** The existing single signature `function withInvariants<I, O>(fn: ServiceFn<I, O>, opts?: WithInvariantsOptions): ServiceFn<I, O>` is preserved verbatim. No overload added per pre-decision (a-α). The wrap's Invariant 3 (`input.org_id` consistency check) is the load-bearing gate at the wrap layer post-refactor.
- **Hard constraint B — RECURRING_TEMPLATE_NOT_FOUND preservation.** All 5 service-internal throw sites for `'RECURRING_TEMPLATE_NOT_FOUND'` preserved verbatim. Test at `recurringJournal.test.ts:311` expecting this code on `generateRun` preserved verbatim. `serviceErrorToStatus.ts:32` mapping preserved verbatim. The semantic distinction between intra-org-not-found (mutations) and cross-org-not-found (getTemplate dual-use) is load-bearing-architectural-discipline per the existence-leak-prevention contract (codification candidate at N=1 from S29b brief-creation pre-flight).
- **Hard constraint C — generic NOT_FOUND preservation at C and E.** `journalEntryService.get` and `recurringJournalService.getRun` continue throwing generic `'NOT_FOUND'` on cross-org and not-found cases. Wrap addition does not change throw behavior; the `.in('org_id', ...)` filter (C) and join-FK filter (E) collapse intra-org-not-found and cross-org-not-found into the same generic code (existence-leak-prevention).
- **Hard constraint D — Pattern E join-FK refactor: schema-substrate.** The FK `recurring_journal_runs.recurring_template_id → recurring_journal_templates.recurring_template_id` (per migration `20240131000000:134`) is the load-bearing-substrate for Pattern E's body refactor. Substrate-confirm at execution Task 2 that the FK exists and PostgREST embed shape is supported. Halt on schema drift.
- **Convention #8 verify-directly discipline.** Every cited file/line/anchor was grep-confirmed at brief-creation pre-flight against HEAD `e966f30`. Re-verify at execution time before edit; halt on any drift. Audit-cited line numbers (`recordMutation.ts:21-27` cite drift, etc., per S28 closeout NOTE category v) are illustrative-of-known-drift, not load-bearing claims; use grep-stable text-anchors over line numbers.
- **Additive-only at the test layer.** No new test additions at S29b per pre-decision (c) mechanical-only. Existing tests verified for non-breakage post-edit; no signature-shape rewrites. Test coverage gap at C/E sites (per pre-flight pre-5) is LT-02/S31 obligation — out of scope.
- **Grep-stable anchors locked.**
  - Pattern C site: `journalEntryService.get` function declaration; export object's `// withInvariants: skip-org-check (pattern-C: deferred to S29b)` annotation comment + bare `get,` property reference.
  - Pattern C-variant site: `recurringJournalService.getTemplate` function declaration; export object's `// withInvariants: skip-org-check (pattern-C: deferred to S29b)` annotation + bare `getTemplate,` property.
  - Pattern E site: `recurringJournalService.getRun` function declaration; export object's `// withInvariants: skip-org-check (pattern-E: deferred to S29b)` annotation + bare `getRun,` property.
  - Route-handler call-sites: `journalEntryService.get(` and `recurringJournalService.getTemplate(` substrings. (No call-site for getRun.)

---

## Pre-decisions enumerated

What's decided at brief-write per operator ratification at brief-creation pre-flight (do not re-litigate at execution time; executor re-confirms the batch as a D1-shape preamble before touching code):

1. **(a-α) Design choice — input-shape refactor for all three sites.** Each Pattern C/C-variant/E site refactors input from `{ entity_id }` to `{ org_id, entity_id }`. Wrap at export site: `<methodName>: withInvariants(<methodName>)`. Route-handler call-sites updated to pass `{ org_id: orgId, ... }`. Rationale: caller surface is narrow (2 route handlers + 0 agent-tools + 0 service-to-service + 1 unconsumed export); no agent-tool propagation needed; smaller diff than overload approach (no `withInvariants` surface change); cleaner than hybrid (uniform pattern across all three). The arc-summary pre-decision (a)'s overload risk ("withInvariants overload introduces second signature") and refactor risk ("propagates to all callers including agent tools") both fail to materialize at substrate.

2. **(b-γ) RECURRING_TEMPLATE_NOT_FOUND uniformity — leave domain-specific code in place.** Existing pattern is substrate-coherent (5 service-internal sites + 1 test + 1 mapping all consistently use the domain-specific code). Substrate-significant semantic distinction between intra-org-not-found (mutations) vs cross-org-not-found (getTemplate dual-use) would be erased by uniformity. Error-code-uniformity is orthogonal to the wrap-mechanism question. Conflating expands S29b scope without substrate-grounded benefit. Post-S29b shape: getTemplate continues throwing `'RECURRING_TEMPLATE_NOT_FOUND'` on cross-org-not-found (existence-leak prevention); mutations continue throwing on intra-org-not-found (genuine 404). Wire-level both surface as 404 via `serviceErrorToStatus`; in-codebase the codes carry semantic information — codification candidate at N=1: existence-leak-prevention-as-error-code-contract.

3. **(c) Test-suite delta — mechanical-only at S29b scope.** No new tests required at S29b. Existing tests verified for non-breakage post-edit; sub-pre-flight at execution Task 2 enumerates them. Test coverage gap at C/E sites (no direct test grep hits at brief-creation pre-flight) is LT-02/S31 obligation — out of scope. The single existing RECURRING_TEMPLATE_NOT_FOUND test at `recurringJournal.test.ts:311` exercises `generateRun` (NOT getTemplate); orthogonal to S29b's wrap-mechanism work.

4. **(d) Pattern E body refactor: join-FK shape.** `getRun`'s body refactor replaces the two-step lookup with a join-style query via the FK `recurring_journal_runs.recurring_template_id → recurring_journal_templates.recurring_template_id`. PostgREST embedded select shape (substrate-grep at execution to confirm exact PostgREST syntax against the codebase's existing embed patterns; lean is `recurring_journal_runs!recurring_template_id (recurring_journal_templates(org_id))` or equivalent). The `.in('org_id', ctx.caller.org_ids)` filter applied via the embedded path. Single DB roundtrip post-refactor (vs current two roundtrips). **Substrate-confirmed at brief-creation:** the FK exists per migration `20240131000000:134`; PostgREST embed support is the codebase-wide convention — `journalEntryService.get` at lines 466-468 already uses a deeply-nested embed (`fiscal_periods(...), journal_lines(...chart_of_accounts(...))`), establishing the embed-shape precedent at codebase-wide scope. Substrate-resolve is the expected outcome at execution Task 4 Step 2. **Fallback path remains as safety-net:** two-step lookup with `input.org_id`-filter if PostgREST embed shape doesn't substrate-resolve. Substrate-unlikely (not coin-flip) given the codebase-wide embed convention; brief-creation cannot pre-decide for substrate that requires execution-time PostgREST behavior verification, so the fallback stays encoded for completeness.

5. **Y2 commit shape: single bundled commit.** All three site refactors + 2 route-handler call-site updates + friction-journal NOTE land in one commit. Estimated diff size ~80-150 lines (small surface). No Y2 split.

6. **Estimated session duration: ~2-3 hours** (per arc-summary's 2-3 days estimate; substrate-narrow caller surface cuts that materially). Task 0 substrate-confirm (~10 min) + Pattern C refactor (~30 min) + Pattern C-variant refactor (~30 min) + Pattern E join-FK refactor (~45 min including PostgREST embed verification) + route-handler call-site updates (~15 min) + sub-pre-flight existing-test non-breakage check (~15 min) + full-suite regression (~30 min) + friction-journal NOTE drafting (~30 min) + review buffer.

OPEN — operator to resolve before / during S29b execution: _none ratified at brief-creation_. All three arc-summary pre-decisions ratified to (a-α) / (b-γ) / (c) at brief-creation per substrate-grounded analysis. Pre-decision (d) Pattern E join-FK shape may surface PostgREST embed-shape question at execution Task 4 — substrate-confirm at execution time; halt and surface for operator if join-FK shape doesn't substrate-resolve.

---

## Exit-criteria matrix

| ID | UF | Target file(s) | Done when | Test evidence required | Harness gate |
|---|---|---|---|---|---|
| S29b-MT-03-C | UF-002 (Pattern C) | `journalEntryService.ts` (signature + export wrap); `journal-entries/[entryId]/route.ts` (call-site) | `journalEntryService.get` input shape is `{ org_id: string; journal_entry_id: string }`; export is `get: withInvariants(get)`; route-handler call-site passes both fields; canonical-form annotation removed from export object. | LT-01(b) ESLint rule fires zero false-positives on the post-refactor service file (rule passes via wrap-detection, not annotation-match); existing route-handler tests (if any) green; full-suite regression green at expected baseline. | Gate 3 (UF-002 broad-scope wrap closure: Patterns A/C/E all wrapped) |
| S29b-MT-03-C-variant | UF-002 (Pattern C-variant) | `recurringJournalService.ts` (signature + export wrap); `recurring-templates/[templateId]/route.ts` (call-site) | `recurringJournalService.getTemplate` input shape is `{ org_id: string; recurring_template_id: string }`; export is `getTemplate: withInvariants(getTemplate)`; route-handler call-site passes both fields; `RECURRING_TEMPLATE_NOT_FOUND` preserved verbatim; canonical-form annotation removed from export object. | LT-01(b) rule fires zero false-positives; `recurringJournal.test.ts:311` test still green (RECURRING_TEMPLATE_NOT_FOUND on generateRun); full-suite regression green. | Gate 3 |
| S29b-MT-03-E | UF-002 (Pattern E) | `recurringJournalService.ts` (signature + body + export wrap) | `recurringJournalService.getRun` input shape is `{ org_id: string; recurring_run_id: string }`; body refactored to join-FK pattern (single DB roundtrip); export is `getRun: withInvariants(getRun)`; canonical-form annotation removed from export object; no external callers added (zero-consumer state preserved). | LT-01(b) rule fires zero false-positives; full-suite regression green; PostgREST embed shape substrate-confirmed (Task 4 Step 2). | Gate 3 |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S29b-mt-03-c-e-migration
export COORD_SESSION='S29b-mt-03-c-e-migration'
cat .coordination/session-lock.json
```

Verify lock present with COORD_SESSION matching.

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor chain**

```bash
git log --oneline -5
```

Expected: most recent commit is the S29b brief-creation commit (single file: `docs/09_briefs/phase-1.3/session-29b-brief.md`); parent is `e966f30` (S28 execution close); grandparent is `4a3eafb` (S28 brief re-anchor). If any drift, halt and surface to operator.

- [ ] **Step 3: Branch posture**

```bash
git status --short
git branch --show-current
```

Expected: `staging` branch, working tree clean.

---

## Task 2: Convention #8 verify-directly — re-confirm grep anchors against HEAD

Re-verify pre-flight findings at execution-time substrate. Halt on drift before touching code.

- [ ] **Step 1: Sub-shape #1 — 3 C/E annotation sites locate**

```bash
grep -B1 -A2 "// withInvariants: skip-org-check (pattern-C\|// withInvariants: skip-org-check (pattern-E" src/services/accounting/
```

Expected: 3 hits — `journalEntryService.ts` (Pattern C above `get,`); `recurringJournalService.ts` (Pattern C above `getTemplate,` + Pattern E above `getRun,`).

- [ ] **Step 2: Sub-shape #1 — 3 function declarations locate**

```bash
grep -nE "^async function get\b|^async function getTemplate\b|^async function getRun\b" src/services/accounting/journalEntryService.ts src/services/accounting/recurringJournalService.ts
```

Expected: 3 hits.

- [ ] **Step 3: Sub-shape #2 — caller surface re-verify**

```bash
grep -rn "journalEntryService.get(\|recurringJournalService.getTemplate(\|recurringJournalService.getRun(" src/ tests/ 2>&1 | grep -v node_modules
```

Expected: 1 hit on `journalEntryService.get(` at `journal-entries/[entryId]/route.ts`; 1 hit on `recurringJournalService.getTemplate(` at `recurring-templates/[templateId]/route.ts`; 0 hits on `recurringJournalService.getRun(` (Pattern E unconsumed; substrate-fidelity-gate firing). If hits drift (especially on getRun gaining a consumer between brief-creation and execution), halt and surface — adds external-caller-update scope.

- [ ] **Step 4: Sub-shape #2 — withInvariants signature unchanged**

```bash
grep -nE "^export function withInvariants" src/services/middleware/withInvariants.ts
```

Expected: 1 hit; single signature `function withInvariants<I, O>(fn, opts?)`. No overload added per Hard constraint A.

- [ ] **Step 5: Sub-shape #2 — RECURRING_TEMPLATE_NOT_FOUND preservation surfaces unchanged**

```bash
grep -rn "RECURRING_TEMPLATE_NOT_FOUND" src/ tests/ 2>&1 | grep -v node_modules
```

Expected: 5 service-internal sites in `recurringJournalService.ts` + 1 test at `recurringJournal.test.ts:311` (or post-line-drift equivalent) + 1 mapping at `serviceErrorToStatus.ts:32` + 1 type definition in `ServiceError.ts`. If any site drops or new site appears, halt — Hard constraint B preservation contract.

- [ ] **Step 6: Sub-shape #3 — schema FK substrate-confirm**

```bash
grep -nE "recurring_template_id.*REFERENCES" supabase/migrations/20240131000000_recurring_journal_templates.sql
```

Expected: 2 hits (one for recurring_journal_template_lines, one for recurring_journal_runs). The recurring_journal_runs FK is the load-bearing-substrate for Pattern E's join-FK refactor (Hard constraint D).

- [ ] **Step 7: Sub-shape #4 — full-suite carry-forward state pre-edit**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -5
```

Expected: 26/26 green. If drift, halt and surface — agent:validate is the test-posture-floor pre-condition.

If any sub-shape surfaces drift beyond expectations, halt and surface for substrate-re-derivation.

---

## Task 3: Pattern C refactor — `journalEntryService.get`

- [ ] **Step 1: Refactor function signature**

Edit `src/services/accounting/journalEntryService.ts`. Function signature change:

```ts
async function get(
  input: { org_id: string; journal_entry_id: string },
  ctx: ServiceContext,
): Promise<JournalEntryDetail> {
```

Body unchanged — the existing `.in('org_id', ctx.caller.org_ids)` filter remains as defense-in-depth (Invariant 3 fires first against `input.org_id`; the in-body filter is now redundant but substrate-safe).

- [ ] **Step 2: Wrap at export + remove canonical annotation**

```ts
export const journalEntryService = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'journal_entry.post' + 'journal_entry.adjust' variant); also wrapped service-to-service in recurringJournalService.approveRun for defense-in-depth)
  post,
  list: withInvariants(list),
  get: withInvariants(get),  // <-- post-S29b: wrap-detection passes; pattern-C annotation removed
};
```

Remove the `// withInvariants: skip-org-check (pattern-C: deferred to S29b)` line above `get`.

- [ ] **Step 3: Update route-handler call-site**

Edit `src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts`. Change call-site to pass `{ org_id: orgId, journal_entry_id: entryId }`. Substrate-grep at execution for the exact call-site shape; line ~15 per pre-flight.

---

## Task 4: Pattern E refactor — `recurringJournalService.getRun` (join-FK)

- [ ] **Step 1: Refactor function signature**

Edit `src/services/accounting/recurringJournalService.ts`. Function signature change:

```ts
async function getRun(
  input: { org_id: string; recurring_run_id: string },
  ctx: ServiceContext,
): Promise<RecurringRunDetail> {
```

- [ ] **Step 2: Substrate-confirm PostgREST embed shape**

Read existing PostgREST embed patterns in `recurringJournalService.ts` (or sibling service files) to confirm the codebase-wide convention for joined-FK queries. Likely shape:

```ts
const { data: run, error } = await db
  .from('recurring_journal_runs')
  .select('recurring_run_id, recurring_template_id, scheduled_for, status, journal_entry_id, rejection_reason, created_at, recurring_journal_templates!inner(org_id)')
  .eq('recurring_run_id', input.recurring_run_id)
  .eq('recurring_journal_templates.org_id', input.org_id)
  .maybeSingle();
```

If the codebase uses a different embed pattern (e.g., explicit FK alias), substrate-grep and conform. Halt and surface to operator if PostgREST embed shape doesn't substrate-resolve.

- [ ] **Step 3: Refactor body to join-FK pattern**

Replace the existing two-step lookup with the single-roundtrip join pattern from Step 2. Throws unchanged: `'NOT_FOUND'` generic on no-row (collapses cross-org-not-found and intra-org-not-found per existence-leak-prevention contract). Drop the `recurring_journal_templates` field from the returned `RecurringRunDetail` type (the join is internal to the auth check; the embed result is consumed for filtering only).

- [ ] **Step 4: Wrap at export + remove canonical annotation**

```ts
export const recurringJournalService = {
  // ... existing entries ...
  listRuns: withInvariants(listRuns),
  getRun: withInvariants(getRun),  // <-- post-S29b: wrap-detection passes; pattern-E annotation removed
};
```

Remove the `// withInvariants: skip-org-check (pattern-E: deferred to S29b)` line above `getRun`.

- [ ] **Step 5: No call-site updates**

Pattern E has 0 external callers. No call-site updates required. (If pre-flight Task 2 Step 3 surfaced a new caller, halt and surface — out of brief scope.)

---

## Task 5: Pattern C-variant refactor — `recurringJournalService.getTemplate`

- [ ] **Step 1: Refactor function signature**

Edit `src/services/accounting/recurringJournalService.ts`. Function signature change:

```ts
async function getTemplate(
  input: { org_id: string; recurring_template_id: string },
  ctx: ServiceContext,
): Promise<RecurringTemplateDetail> {
```

Body unchanged on authorization — the existing `.in('org_id', ctx.caller.org_ids)` filter remains (defense-in-depth post-Invariant-3). Throws unchanged (`'RECURRING_TEMPLATE_NOT_FOUND'` per Hard constraint B).

- [ ] **Step 2: Wrap at export + remove canonical annotation**

```ts
export const recurringJournalService = {
  // ... existing entries ...
  listTemplates: withInvariants(listTemplates),
  getTemplate: withInvariants(getTemplate),  // <-- post-S29b: wrap-detection passes; pattern-C annotation removed
  // ... existing entries ...
};
```

Remove the `// withInvariants: skip-org-check (pattern-C: deferred to S29b)` line above `getTemplate`.

- [ ] **Step 3: Update route-handler call-site**

Edit `src/app/api/orgs/[orgId]/recurring-templates/[templateId]/route.ts`. Change call-site to pass `{ org_id: orgId, recurring_template_id: templateId }`. Substrate-grep at execution for the exact call-site shape; line ~17 per pre-flight.

---

## Task 6: Full-suite regression

- [ ] **Step 1: Sub-pre-flight existing-test non-breakage**

Identify tests that exercise the 3 refactored sites or call them indirectly:

```bash
grep -rn "journalEntryService.get\|.getTemplate\|.getRun" tests/ 2>&1 | grep -v node_modules
```

For each hit, confirm the test fixture-input shape passes through unchanged (since route-handler-style call-sites aren't tested directly in unit tests; integration tests using real route-handler invocation continue working). If a test directly imports `journalEntryService.get` etc. and constructs an `{ entity_id }` input, halt and surface — it's a test-shape rewrite that pre-decision (c) flagged as out-of-scope.

- [ ] **Step 2: agent:validate**

```bash
pnpm db:reset:clean && pnpm db:seed:all
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green.

- [ ] **Step 3: typecheck**

```bash
pnpm typecheck 2>&1 | tail -5
```

Expected: clean. Type-checker enforces Pattern A/B/C/D/E/etc. via withInvariants's generic; new wrapped exports inherit the input-shape contract.

- [ ] **Step 4: lint (LT-01(b) rule fires green via wrap-detection)**

```bash
pnpm lint src/services/ 2>&1 | grep "services/withInvariants-wrap-or-annotate"
```

Expected: zero rule violations. The 3 sites now pass via wrap-detection (Property{value: CallExpression(callee: withInvariants)}), not annotation-match. Substrate-grep to confirm 3 annotations dropped:

```bash
grep -rn "// withInvariants: skip-org-check (pattern-C\|// withInvariants: skip-org-check (pattern-E" src/services/accounting/
```

Expected: 0 hits post-edit (annotations removed at Tasks 3/4/5).

```bash
grep -rn "// withInvariants: skip-org-check" src/services/ | wc -l
```

Expected: 32 (35 pre-S29b minus 3 C/E annotations dropped). Stable count for post-S29b state.

- [ ] **Step 5: full vitest suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: 1 failed (verifyAuditCoverageRoundTrip orthogonal carry-forward) + 570 passed + 20 skipped (591 total) — same as pre-S29b baseline. No new failures attributable to S29b.

If carry-forward count drifts beyond fresh-run baseline (state-pollution-dependent reporting per S30 brief re-anchor-2 framing), capture the drift state for the friction-journal NOTE and surface for operator if wrap-attributable. State-pollution-dependent failures (`accountLedgerService` running-balance + `crossOrgRlsIsolation` cascading) are known carry-forwards per S29a element #19; not S29b-edit-attributable.

---

## Task 7: Commit + friction-journal NOTE

- [ ] **Step 1: Draft friction-journal NOTE**

Append to `docs/07_governance/friction-journal.md` tail. Three required elements + sub-finding categories:

1. **UF-002 closure citation** — cite specific surfaces closed: 3 Pattern C/E sites refactored to `{ org_id, entity_id }` input shape + wrap at export. Pattern A closed at S29a; Pattern B at hot-fix arc; Patterns C/C-variant/E closed here. UF-002's broad-scope service auth gap fully closed across MT-03 surface.

2. **Multi-roundtrip → single-roundtrip outcome at Pattern E** — record whether the join-FK PostgREST embed substrate-resolved cleanly (default) or fell back to two-step lookup (per pre-decision (d) substrate-confirm at execution). If fallback, name rationale.

3. **Sub-findings surfaced at execution.** Categories (per S29b brief-creation pre-flight + execution-time additions):

   i. **getRun zero-callers carry-forward.** Pre-flight pre-2 substrate-fidelity-gate firing at brief-creation cadence: getRun has 0 external callers (sibling-shape to `invitationService.resendInvitation` finding at S28 re-anchor pre-flight). Refactor scope at zero-breakage given zero callers. Reconciliation-scope-derivation as substrate-completeness gate codification candidate **graduates at parent-shape N=3** with this firing — third firing-shape instance under the parent-shape "scope derived from one substrate-layer; missed sibling substrate-layer at scope-completeness-gate" (S29a element #18 + S30 sibling fix-forward NOTE element 1 + this getRun finding). **Strict-shape sub-tracking at substrate-honest precision:** prior two firings were reconciliation-scope-sibling shape (file-top + JSDoc layers as siblings of the comment-fix scope); S29b's firing is caller-surface-completeness shape (consumer-surface-completeness derived narrower than substrate at scope-derivation, sibling-shape to S28's resendInvitation finding). Both fold under parent-shape; strict-shape distinction noted for future-session-reads of the codification record. Documentation Routing convention's parent-shape N=3 threshold met. Codification-fire element captured here at execution closeout per (re-anchor-1-α)-style precedent (brief-creation NOTEs don't carry codification-firing elements; defer to execution closeout).

   ii. **Existence-leak-prevention-as-error-code-contract codification candidate at N=1** (from S29b brief-creation pre-flight pre-3). Substrate-coherent existing pattern: getTemplate's RECURRING_TEMPLATE_NOT_FOUND does dual duty (intra-org-not-found + cross-org-not-found via the `.in('org_id', ...)`-collapsed-rows behavior); mutations use the same code for intra-org-not-found only (cross-org gated by Invariant 3). The semantic distinction across failure modes is load-bearing-architectural-discipline. Pre-decision (b-γ) ratifies the pattern at S29b. Sibling-shape to S30's "Resolved-decision-citation as contract" graduation. N=1 today; future sites surfacing same shape graduate per N=3 threshold.

   iii. **Carry-forward drift on full-suite run.** If full-suite shows drift beyond fresh-run baseline (1 failed + 570 passed + 20 skipped), capture; classify state-pollution-attributable vs S29b-edit-attributable. State-pollution-attributable: known carry-forward (S29a element #19); not regression. S29b-edit-attributable would halt per Task 6 Step 5.

   iv. **(γ)-rhythm scope-amend at execution cadence**, if any. If Task 4 Step 2 PostgREST embed shape substrate-fails and execution takes the two-step-lookup fallback, that's a (γ)-rhythm scope-amend per pre-decision (d) framing. Folds into the codification candidate's N tracking (N=2 pre-S29b + S29b firing if applicable = N=3 graduation candidate).

   v. **Convention #8 verify-directly drift on cited file/line numbers** (carry-forward shape from S28 closeout NOTE category v). Any line-cite drift from the brief's cites surfaces here; fold under S29a element #3's "applies recursively at every layer" clause.

   vi. **Anything else surfaced at execution that doesn't fit existing categories.**

Per S29a element #1 + S28 closeout fix-forward precedent: NO SHA self-reference in commit body or NOTE body. NOTE references "this commit family" without an SHA.

- [ ] **Step 2: Stage all changes**

```bash
git add src/services/accounting/journalEntryService.ts \
        src/services/accounting/recurringJournalService.ts \
        src/app/api/orgs/[orgId]/journal-entries/[entryId]/route.ts \
        src/app/api/orgs/[orgId]/recurring-templates/[templateId]/route.ts \
        docs/07_governance/friction-journal.md
git status --short
```

Expected: 5 files staged. No untracked files outside this set.

- [ ] **Step 3: Commit (Y2 single bundled)**

Subject (under 70 chars): `feat(services): S29b MT-03 Patterns C/E migration via input-shape refactor`

Body covers:
- Pattern C closure (`journalEntryService.get`): input shape refactor + wrap at export.
- Pattern C-variant closure (`recurringJournalService.getTemplate`): input shape refactor + wrap at export; RECURRING_TEMPLATE_NOT_FOUND preserved per (b-γ).
- Pattern E closure (`recurringJournalService.getRun`): input shape refactor + body refactor (two-step lookup → join-FK single-roundtrip OR fallback per pre-decision (d) substrate-confirm); wrap at export.
- Route-handler call-site updates at 2 sites.
- 3 canonical-form annotations removed; LT-01(b) rule fires green via wrap-detection.
- UF-002 closed across MT-03 surface (Patterns A/B/C/C-variant/E all wrapped; Pattern G1 closed at hot-fix arc).
- Friction-journal NOTE in same commit per S25-S29a-S30-S28 governance precedent.
- No SHA self-reference per S29a element #1 + S28 closeout fix-forward precedent.

Do NOT include `Co-Authored-By` unless operator-confirmed at closeout.

- [ ] **Step 4: Verify final commit family**

```bash
git log --oneline -3
```

Expected: most recent commit is the S29b execution commit; parent is the S29b brief-creation commit; grandparent is `e966f30` (S28 execution).

- [ ] **Step 5: Run agent:validate one final time post-commit**

```bash
pnpm agent:validate 2>&1 | tail -10
```

Expected: 26/26 green at the S29b commit SHA.

- [ ] **Step 6: Session end**

```bash
bash scripts/session-end.sh
```

Lock release; COORD_SESSION unset.

- [ ] **Step 7: Surface S29b closeout to operator**

Single message summarizing:
- Commit SHA.
- Gate 3 pass status (UF-002 broad-scope wrap closure: Patterns A/B/C/C-variant/E all wrapped; Pattern G1 closed at hot-fix arc).
- Pattern E join-FK outcome (single-roundtrip vs fallback per pre-decision (d)).
- Annotation count post-S29b (32 = 35 minus 3 C/E annotations dropped).
- Sub-findings recorded in friction-journal NOTE.
- Codification graduation: Reconciliation-scope-derivation as substrate-completeness gate at N=3.
- New codification candidate at N=1: Existence-leak-prevention-as-error-code-contract.
- S31 unblocked: brief-creation against S29b closeout SHA opens next per ratified sequence (S30 → S28 → S29b → S31).

---

## Verification harness alignment

This brief's exit-criteria map to the Path C arc-summary verification harness Gate 3 (UF-002 broad-scope wrap closure). At S29b closeout, the harness's mechanical checks for Gate 3 should fire green:

**Gate 3: UF-002 broad-scope wrap closure**
- `MT-03-Pattern-A-wrap` — closed at S29a (`c47e58d`).
- `MT-03-Pattern-B-wrap` — closed at hot-fix arc (`c617f58` + `5d58b36`); 10 brief-enumerated + 10 surfaced-at-S30-execution = 20 sites annotated at S30 closeout.
- `MT-03-Pattern-C-wrap` — closed here (S29b); journalEntryService.get + recurringJournalService.getTemplate wrapped via withInvariants.
- `MT-03-Pattern-E-wrap` — closed here (S29b); recurringJournalService.getRun wrapped via withInvariants; join-FK body refactor.
- `MT-03-Pattern-G1-wrap` — closed at hot-fix arc (`c617f58` + `5d58b36`); 4 sites route-handler-gated via caller.org_ids.includes(orgId).

Re-anchor note: Gates 1+2 closed at S28 (`e966f30`); Gate 4 closed at S30 (`64996b5`); Gate 3 closes here. After S31 (LT-02 test coverage closure), Path C arc closes; Phase 2 surface expansion gate unblocks.

---

## Friction-journal NOTE plan

Element 1 (UF-002 closure) + Element 2 (Pattern E join-FK outcome) + Element 3 (sub-findings i-vi per Task 7 Step 1) per the brief's NOTE plan.

Codification candidates ledger at S29b brief-creation:
- Substrate-fidelity-gate (graduated S30 N=∞; continuing-firings)
- Resolved-decision-citation as contract (graduated S30 N=3)
- Orphan-reference-review at edit-completion (graduated S28 re-anchor N=3)
- Reconciliation-scope-derivation as substrate-completeness gate (**graduates at S29b N=3 per this brief's pre-flight finding**; codification-fire element at S29b execution closeout per deferral discipline)
- (γ)-rhythm scope-amend (N=2; pending N=3)
- Read-completeness-threshold (N=2; pending N=3)
- Library-documentation-vs-integrated-behavior-divergence (N=1)
- Brief-spec-vs-arc-precedent-substrate-conflict (N=1-or-N=2)
- Existence-leak-prevention-as-error-code-contract (**NEW at S29b brief-creation N=1**)
- Stash-revert isolation (N=2; held)
- Action-string-substrate-drift (N=1; observation-only)

---

## Out-of-scope explicit list (recap for executor reference)

1. **withInvariants overload addition** — per pre-decision (a-α); signature unchanged.
2. **RECURRING_TEMPLATE_NOT_FOUND uniformity** — per pre-decision (b-γ); domain-specific code preserved.
3. **getRun consumer addition** — out of scope; refactor lands without external callers (existing zero-consumer state preserved).
4. **Phase 2 PII-coverage consolidated obligation** (multi-level pino + financial-PII path depth + PII_FIELDS-vs-pino-paths naming-asymmetry) — per S28 closeout; Phase 2 work.
5. **Reactivate-route action-string substrate-bug** — per S30 closeout NOTE element 12; separate fix.
6. **8 LT-03 architectural-surface sites** — per S30 closeout disposition-γ; Phase 2.
7. **CURRENT_STATE.md staleness** — per S30 LT-01(d) audit inventory; Phase 1.3 closeout obligation.
8. **"17 invariants" count basis ambiguity** — per S30 LT-01(d) audit inventory; deferred operator-decision.
9. **LT-02 test coverage closure** — ships in S31 per ratified sequence.
10. **Any orchestrator or prompt-text edits** — not S29b's surface.

Items 1, 2, 3 are particularly likely to surface as confused-scope at execution time; the executor should decline scope expansion and surface for operator decision rather than proceeding.
