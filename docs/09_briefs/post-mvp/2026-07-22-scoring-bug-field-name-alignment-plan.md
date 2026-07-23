# Scoring-bug field-name alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `documentRouterService`'s `extracted_fields` reader keys with the vocabulary the Phase 7 extraction schemas actually write, re-activating 0.70 / 0.60 / 0.35 of structurally-dead scoring weight across `vendor_invoice` / `receipt` / `payment_confirmation`.

**Architecture:** Five call sites in `documentRouterService.ts` read (or reconstruct) `extracted_fields` using placeholder key names invented at chunk-1. The scorer itself is correct and is not touched. The fix is per-site key renaming plus one reconstruction extension, defended by tests that seed the *real* extractor vocabulary. The structural remedy (typed per-type contract replacing `z.record(z.unknown())`) is deliberately deferred and re-filed against a live trigger.

**Tech Stack:** TypeScript, Zod, Vitest (integration + unit), Supabase/Postgres local, pnpm + turbo.

**Design authority:** `docs/09_briefs/post-mvp/2026-07-22-scoring-bug-field-name-alignment-design.md` (ratified 2026-07-22).

## Global Constraints

- **Never commit.** Every commit is the operator's explicit per-act word. Steps below say *"report for operator commit"*, never `git commit`.
- If the operator authorises a commit: run from repo root as `COORD_SESSION='board-4-slice-2-build' git -C /home/philc/projects/chounting commit -F <msgfile>`. The lock label is stale-but-current; do not re-init, clear, or PID-investigate it.
- **TDD is mandatory: RED before GREEN, and the failure must be *watched*.** A step that says "run it and confirm it fails" is not optional and its output must be reported.
- **Multi-line `Edit` anchors:** per CLAUDE.md Z1 #11.a, `Read` the target block to confirm exact bytes before any `Edit` whose `oldText` spans more than one line. Do not construct anchors from grep output.
- **No paid Claude calls in tests.** Verify with `grep -c "callClaude: API call complete"` = 0.
- **Known-red carry-forward:** `apps/web/tests/unit/ReviewCaseDetailView.test.tsx` fails at HEAD with a stale-text divergence (received `"Posted and committed (posted)."` vs expected `"Posted and committed."`), byte-unchanged by this work. Expect exactly this one failure in `pnpm test:full`. **STOP and report on any other failure.**
- **Do not touch:** `composeScore`, `V1_PROVISIONAL_WEIGHTS`, `CONFIDENCE_THRESHOLDS_V1_PROVISIONAL`, `AMBIGUITY_MARGIN_V1_PROVISIONAL`, or the two intended-null Scenario A blocks at `documentRouterService.ts:1001-1015` and `:1209-1223`.
- **No migration, no schema change, no invariant change, no ADR amendment** is in scope. If one appears necessary, STOP and report.
- Commands run from repo root `/home/philc/projects/chounting`.

---

## Task 0: Pre-flight — branch decision (OPERATOR GATE, no code)

**This task writes nothing. It exists because the design's §5 item 3 is not executable on the current branch.**

Grounded facts:

- `feat/board-4-fork-c` @ `806aa935` — Fork C CLOSED, pushed, 11 commits ahead of `origin/main`.
- The scoring-bug finding lives **only** on `docs/scoring-bug` @ `640c8057` (1 commit ahead of `origin/main`). Verified: the entry is **NOT PRESENT** in `docs/07_governance/friction-journal.md` on `feat/board-4-fork-c`.
- Therefore "amend the `docs/scoring-bug` finding" (design §5 item 3) **cannot be performed from `feat/board-4-fork-c`** — the text isn't there.

- [ ] **Step 1: Re-verify the branch topology from disk**

```bash
git branch --show-current
git rev-list --count origin/main..HEAD
git log --oneline -1 docs/scoring-bug
git rev-list --count origin/main..docs/scoring-bug
rg -n "scoring silently reduced" docs/07_governance/friction-journal.md || echo "NOT PRESENT on this branch"
```

Expected: current branch `feat/board-4-fork-c`; 11; `640c8057`; 1; `NOT PRESENT on this branch`.

- [ ] **Step 2: Present the branch options to the operator and HOLD**

**Recommended: branch from `docs/scoring-bug`.** Rationale — the fix and the finding it discharges belong in one place; the friction entry being amended exists only there; `docs/scoring-bug` is 1 commit off `origin/main` (a clean base) versus `feat/board-4-fork-c`'s 11 commits of unmerged Fork C work; and the design explicitly frames this as **anti-scope to Fork C**, so it should not land on the Fork C branch.

```bash
# ONLY on the operator's explicit word:
git checkout -b fix/scoring-field-name-alignment docs/scoring-bug
```

Alternatives if the operator prefers: branch from `origin/main` and write a *new* superseding friction entry (leaving `docs/scoring-bug` to merge independently); or merge `docs/scoring-bug` into the working branch first.

**Do not proceed to Task 1 until the operator names the branch.** Every later task assumes the chosen branch is checked out and the tree is clean.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `apps/web/src/services/document-platform/documentRouterService.ts` | sites 1-5 + two stale comments | 1, 2, 3, 4, 6 |
| `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts` | re-filed typed-lift obligation (`:134-141`) | 6 |
| `apps/web/tests/integration/documentRouterService.integration.test.ts` | primary router coverage; new RED tests; must-not-fire guards; fixture migration | 1, 2, 3, 4 |
| `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts` | fixture migration (`:187`); T5 re-evaluation reconstruction test | 1, 4 |
| `apps/web/tests/integration/documentRouterService.resolveCandidates.integration.test.ts` | fixture migration (`:210`) | 1 |
| `apps/web/tests/integration/dispatchTriggerCrossPhase.integration.test.ts` | fixture migration (`:154`) | 1 |
| `apps/web/tests/integration/sweepStrandedCases.integration.test.ts` | fixture migration (`:378`) | 1 |
| `apps/web/tests/unit/documentRelationshipCandidateSchema.test.ts` | fixture migration (`:140`) | 1 |
| `apps/web/tests/integration/scoringFieldAlignmentPipeline.integration.test.ts` | **NEW** — pipeline-level proof | 5 |
| `docs/07_governance/friction-journal.md` | tracked obligation artifact + radius amendment | 6 |

### Fixture inventory (grounded — every occurrence)

| File:line | Current | Extracted-side? | Action |
|---|---|---|---|
| `documentRouterService.integration.test.ts:210` | `?? { invoice_amount: 1000 }` | yes | → `{ amount: 1000 }` (Task 1) |
| `…:911-913` | `invoice_amount` / `invoice_date` / `invoice_number` | yes | → `amount` / `accounting_date` / `vendor_invoice_number` (Task 1) |
| `…:942` | `invoice_amount`, `invoice_date` | yes | → `amount`, `accounting_date` (Task 1) |
| `…:964` | `invoice_amount`, `invoice_date` | yes | → `amount`, `accounting_date` (Task 1) |
| `…:1100` | `invoice_amount` | yes | → `amount` (Task 1) |
| `…:1015-1017` | `receipt_amount` / `receipt_date` / `authorization_reference` | yes | → `total` / `date` / `auth_ref` (Task 2) |
| `…:1116` | `receipt_amount` | yes | → `total` (Task 2) |
| `…:1056` | `authorization_reference: 'ACH-TRACE-99999'` inside `extractedFields` | yes | → `auth_ref` (Task 3) |
| `…:152` | `insert.authorization_reference = opts.authorizationReference` | **NO — candidate-side `payments` column** | **DO NOT CHANGE** |
| `…:1050` | `authorizationReference: 'ACH-TRACE-99999'` (seed opt) | **NO — seed helper param** | **DO NOT CHANGE** |
| `dispatchTrigger…:187` | `invoice_amount`, `invoice_date` | yes | → `amount`, `accounting_date` (Task 1) |
| `resolveCandidates…:210` | `invoice_amount` | yes | → `amount` (Task 1) |
| `dispatchTriggerCrossPhase…:154` | `invoice_amount`, `invoice_date` | yes | → `amount`, `accounting_date` (Task 1) |
| `sweepStrandedCases…:378` | `invoice_amount` | yes | → `amount` (Task 1) |
| `documentRelationshipCandidateSchema.test.ts:140` | `invoice_amount` | yes | → `amount` (Task 1) |

### Existing helpers (use these; do not invent)

```ts
interface RouterCaseFixture { caseId: string; sourceDocId: string; vendorId: string }

async function buildRouterCaseFixture(orgId: string, ctx: ServiceContext): Promise<RouterCaseFixture>
async function seedOpenBill(db: Db, orgId: string, vendorId: string,
  opts?: { amount?: number; lifecycleState?: 'draft'|'pending_approval'|'approved_for_payment'|'partially_paid'|'fully_paid'|'voided'|'cancelled'; issueDate?: string; billNumber?: string }): Promise<string>
async function seedOpenPayment(db: Db, orgId: string, vendorId: string,
  opts?: { amount?: number; paymentDate?: string; paymentState?: string; authorizationReference?: string; paymentMethod?: string }): Promise<string>
function buildInput(fixture: RouterCaseFixture, ctx: ServiceContext,
  opts?: { documentType?: 'vendor_invoice'|'receipt'|'payment_confirmation'|'unknown'; vendorMatchConfidence?: number; vendorMatchType?: 'exact_name'|'fuzzy_name'|'no_match'; vendorIdOverride?: string|null; extractedFields?: Record<string, unknown> }): CompleteCandidateInputRaw
```

Scoring reference (`scoreComposition.ts`, unchanged): `vendor_invoice` = vendor .30 / amount .30 / date .15 / reference .25 / pm 0 · `receipt` = .25/.25/.15/.20/.15 · `payment_confirmation` = .20/.25/.10/.35/.10.

---

## Task 1: vendor_invoice — site 1 + all `invoice_*` fixtures

**Files:**
- Modify: `apps/web/src/services/document-platform/documentRouterService.ts:932-970`
- Test: `apps/web/tests/integration/documentRouterService.integration.test.ts` (new tests + `:210`, `:911-913`, `:942`, `:964`, `:1100`)
- Test: `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts:187`
- Test: `apps/web/tests/integration/documentRouterService.resolveCandidates.integration.test.ts:210`
- Test: `apps/web/tests/integration/dispatchTriggerCrossPhase.integration.test.ts:154`
- Test: `apps/web/tests/integration/sweepStrandedCases.integration.test.ts:378`
- Test: `apps/web/tests/unit/documentRelationshipCandidateSchema.test.ts:140`

**Interfaces:**
- Consumes: the helpers listed under *Existing helpers* above.
- Produces: nothing new exported. After this task `completeCandidate` reads `amount` / `accounting_date` / `vendor_invoice_number` for `vendor_invoice`.

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe('documentRouterService.completeCandidate — happy-path Subsystem 1 matching (chunk 1)')` block in `apps/web/tests/integration/documentRouterService.integration.test.ts`:

```ts
  it('scores amount/date/reference from extractor vocabulary (regression: chunk-1 placeholder keys)', async () => {
    const db = adminClient();
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    await seedOpenBill(db, SEED.ORG_HOLDING, fixture.vendorId, {
      amount: 1000,
      issueDate: '2026-05-13',
      billNumber: 'BILL-001',
    });

    const result = await completeCandidate(
      buildInput(fixture, ctx, {
        vendorMatchConfidence: 0.95,
        extractedFields: {
          amount: 1000,
          accounting_date: '2026-05-13',
          vendor_invoice_number: 'BILL-001',
        },
      }),
      ctx,
    );

    expect(result).toHaveLength(1);
    // vendor .30*.95 = .285 alone is the pre-fix ceiling. All three other
    // axes must contribute: .285 + .30 + .15 + .25 = .985.
    expect(result[0].confidence_score).toBeGreaterThan(0.9);

    const axes = Object.fromEntries(
      result[0].candidate_features.features.map((f) => [f.feature_name, f.normalized_score]),
    );
    expect(axes.amount_match).toBe(1);
    expect(axes.date_proximity).toBe(1);
    expect(axes.reference_alignment).toBe(1);
  });
```

- [ ] **Step 2: Run it and WATCH it fail**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "extractor vocabulary"
```

Expected: **FAIL**. `confidence_score` is `0.285` (not > 0.9) and `axes.amount_match` / `date_proximity` / `reference_alignment` are all `0`. Report the observed numbers — this is the proof the axes are dead.

- [ ] **Step 3: Fix site 1 — the three `compute*` reads**

`Read` `documentRouterService.ts:930-945` first to confirm exact bytes, then replace:

```ts
      const amountFeatures = computeAmountFeatures(
        parsed.extracted_fields.amount,
        bill.amount_cad,
      );
      const dateFeatures = computeDateFeatures(
        parsed.extracted_fields.accounting_date,
        bill.issue_date,
      );
      const billNumberMatch = computeStringMatchFeature(
        parsed.extracted_fields.vendor_invoice_number,
        bill.bill_number,
      );
```

- [ ] **Step 4: Fix site 1 — the three `*_raw_value.extracted` forensic fields**

`Read` `documentRouterService.ts:944-973`, then change the three `extracted:` lines (currently `:952`, `:960`, `:967`) to:

```ts
          extracted: parsed.extracted_fields.amount ?? null,
```
```ts
          extracted: parsed.extracted_fields.accounting_date ?? null,
```
```ts
          extracted: parsed.extracted_fields.vendor_invoice_number ?? null,
```

These must move with Step 3 or the audit trail misreports what was scored.

- [ ] **Step 5: Run the new test and confirm it passes**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "extractor vocabulary"
```

Expected: **PASS**, `confidence_score` ≈ `0.985`.

- [ ] **Step 6: Add the must-not-fire guard (intended-null Scenario A)**

The inferred-target path must stay vendor-only. Append to the same describe block:

```ts
  it('MUST NOT FIRE: inferred-target (Scenario A) stays vendor-only after field-name alignment', async () => {
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    // No seedOpenBill — no existing bill, so Scenario A inferred-target fires.
    const result = await completeCandidate(
      buildInput(fixture, ctx, {
        vendorMatchConfidence: 0.95,
        extractedFields: {
          amount: 1000,
          accounting_date: '2026-05-13',
          vendor_invoice_number: 'BILL-001',
        },
      }),
      ctx,
    );

    expect(result).toHaveLength(1);
    expect(result[0].linked_entity_id).toBeNull();
    expect(result[0].candidate_features.scenario).toBe('invoice_inferred_target');
    // Intended-null per ADR-0015 §7: only vendor_match contributes, even
    // though extracted_fields now carries real values.
    expect(result[0].confidence_score).toBeCloseTo(0.285, 5);
    const axes = Object.fromEntries(
      result[0].candidate_features.features.map((f) => [f.feature_name, f.normalized_score]),
    );
    expect(axes.amount_match).toBe(0);
    expect(axes.date_proximity).toBe(0);
    expect(axes.reference_alignment).toBe(0);
  });
```

- [ ] **Step 7: Run the guard**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "MUST NOT FIRE"
```

Expected: **PASS**. If it fails, the fix leaked into the inferred-target path — STOP and report.

- [ ] **Step 8: Migrate every `invoice_*` fixture**

Apply these exact edits (all are extracted-side; the inventory table above marks the two that must NOT change):

- `documentRouterService.integration.test.ts:210` → `extracted_fields: opts.extractedFields ?? { amount: 1000 },`
- `…:911-913` → `amount: 1000,` / `accounting_date: '2026-05-13',` / `vendor_invoice_number: 'BILL-001',`
- `…:942` → `extractedFields: { amount: 1200, accounting_date: '2026-05-13' },`
- `…:964` → `extractedFields: { amount: 1000, accounting_date: '2026-06-15' },`
- `…:1100` → `buildInput(fixture, ctx, { extractedFields: { amount: 1000 } }),`
- `dispatchTrigger…:187` → `extracted_fields: { amount: 1000, accounting_date: '2026-05-14' },`
- `resolveCandidates…:210` → `extracted_fields: { amount: 1000 },`
- `dispatchTriggerCrossPhase…:154` → `extracted_fields: { amount: 1000, accounting_date: '2026-05-14' },`
- `sweepStrandedCases…:378` → `extracted_fields: { amount: 1000 },`
- `documentRelationshipCandidateSchema.test.ts:140` → `extracted_fields: { amount: 1000 },`

- [ ] **Step 9: Run the full affected suite**

```bash
pnpm --filter @chounting/web exec vitest run \
  tests/integration/documentRouterService.integration.test.ts \
  tests/integration/documentRouterService.dispatchTrigger.integration.test.ts \
  tests/integration/documentRouterService.resolveCandidates.integration.test.ts \
  tests/integration/dispatchTriggerCrossPhase.integration.test.ts \
  tests/integration/sweepStrandedCases.integration.test.ts \
  tests/unit/documentRelationshipCandidateSchema.test.ts
```

Expected: all green. Any test that now asserts a *higher* score than before is correct — that is the bug being fixed. Any test asserting exact pre-fix scores must be updated with the new arithmetic **and the change explained in the report**, not silently loosened.

- [ ] **Step 10: Typecheck, then report for operator commit**

```bash
pnpm --filter @chounting/web typecheck
git status --short
```

Report the built surface for advisor grounding. **Do not commit.** Suggested message subject: `fix(scoring): site 1 — vendor_invoice reads extractor vocabulary (amount/accounting_date/vendor_invoice_number)`.

---

## Task 2: receipt — sites 2 + 3

**Files:**
- Modify: `apps/web/src/services/document-platform/documentRouterService.ts:1063-1108` (site 2), `:1137-1161` (site 3)
- Test: `apps/web/tests/integration/documentRouterService.integration.test.ts` (`:1015-1017`, `:1116`, plus new tests)

**Interfaces:**
- Consumes: Task 1's aligned reader convention.
- Produces: `receipt` branches read `total` / `date` / `auth_ref`; `payment_method` unchanged.

- [ ] **Step 1: Write the failing test**

```ts
  it('receipt scores amount/date/reference from extractor vocabulary (total/date/auth_ref)', async () => {
    const db = adminClient();
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    await seedOpenPayment(db, SEED.ORG_HOLDING, fixture.vendorId, {
      amount: 1000,
      paymentDate: '2026-05-13',
      authorizationReference: 'AUTH-12345',
      paymentMethod: 'eft',
    });

    const result = await completeCandidate(
      buildInput(fixture, ctx, {
        documentType: 'receipt',
        vendorMatchConfidence: 0.95,
        extractedFields: {
          total: 1000,
          date: '2026-05-13',
          auth_ref: 'AUTH-12345',
          payment_method: 'eft',
        },
      }),
      ctx,
    );

    const toPayment = result.find((c) => c.linked_entity_type === 'payment');
    expect(toPayment).toBeDefined();
    const axes = Object.fromEntries(
      toPayment!.candidate_features.features.map((f) => [f.feature_name, f.normalized_score]),
    );
    expect(axes.amount_match).toBe(1);
    expect(axes.date_proximity).toBe(1);
    expect(axes.reference_alignment).toBe(1);
    expect(axes.payment_method_consistency).toBe(1);
  });
```

- [ ] **Step 2: Run it and WATCH it fail**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "receipt scores amount/date/reference"
```

Expected: **FAIL** — `amount_match`, `date_proximity`, `reference_alignment` all `0`; only `payment_method_consistency` is `1`.

- [ ] **Step 3: Fix site 2 (receipt → payment)**

`Read` `documentRouterService.ts:1061-1112`, then rename the reads at `:1064`, `:1068`, `:1072` and the matching `extracted:` fields at `:1087`, `:1095`, `:1102`:

```ts
        parsed.extracted_fields.total,      // was receipt_amount
```
```ts
        parsed.extracted_fields.date,       // was receipt_date
```
```ts
        parsed.extracted_fields.auth_ref,   // was authorization_reference
```
```ts
          extracted: parsed.extracted_fields.total ?? null,
```
```ts
          extracted: parsed.extracted_fields.date ?? null,
```
```ts
          extracted: parsed.extracted_fields.auth_ref ?? null,
```

Leave `parsed.extracted_fields.payment_method` at `:1076` / `:1108` **unchanged** — it already matches.

Add above the amount read: `// subtotal deliberately unread — it excludes tax and would not match a committed amount.`

- [ ] **Step 4: Fix site 3 (receipt → bill)**

`Read` `documentRouterService.ts:1135-1165`, then rename `:1138`, `:1142` and `:1153`, `:1161` the same way (`receipt_amount`→`total`, `receipt_date`→`date`). Site 3 has no reference/payment_method reads — `reference_match` and `payment_method_match` stay literal `null`.

- [ ] **Step 5: Run the test and confirm it passes**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "receipt scores amount/date/reference"
```

Expected: **PASS**.

- [ ] **Step 6: Add the receipt must-not-fire guard**

```ts
  it('MUST NOT FIRE: receipt inferred-target stays vendor-only after field-name alignment', async () => {
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    // No seedOpenPayment and no seedOpenBill → receipt inferred-target fires.
    const result = await completeCandidate(
      buildInput(fixture, ctx, {
        documentType: 'receipt',
        vendorMatchConfidence: 0.95,
        extractedFields: { total: 1000, date: '2026-05-13', auth_ref: 'AUTH-12345', payment_method: 'eft' },
      }),
      ctx,
    );
    const inferred = result.find((c) => c.candidate_features.scenario === 'receipt_inferred_target');
    expect(inferred).toBeDefined();
    expect(inferred!.linked_entity_id).toBeNull();
    const axes = Object.fromEntries(
      inferred!.candidate_features.features.map((f) => [f.feature_name, f.normalized_score]),
    );
    expect(axes.amount_match).toBe(0);
    expect(axes.date_proximity).toBe(0);
    expect(axes.reference_alignment).toBe(0);
    expect(axes.payment_method_consistency).toBe(0);
  });
```

- [ ] **Step 7: Migrate the receipt fixtures**

- `documentRouterService.integration.test.ts:1015-1017` → `total: 1000,` / `date: '2026-05-13',` / `auth_ref: 'AUTH-12345',`
- `…:1116` → `extractedFields: { total: 1000 },`

- [ ] **Step 8: Run, typecheck, report**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts
pnpm --filter @chounting/web typecheck
```

Expected: green. Report; **do not commit**. Subject: `fix(scoring): sites 2+3 — receipt reads total/date/auth_ref`.

---

## Task 3: payment_confirmation — site 4

**Files:**
- Modify: `apps/web/src/services/document-platform/documentRouterService.ts:1265`, `:1295`
- Test: `apps/web/tests/integration/documentRouterService.integration.test.ts:1056` + new test

**Interfaces:**
- Consumes: Task 1/2 conventions.
- Produces: `payment_confirmation` reads `auth_ref`; `payment_amount` / `payment_date` / `payment_method` were already correct.

- [ ] **Step 1: Re-ground the extractor before editing**

This is the heaviest single axis in the system (`reference_alignment` = 0.35). Confirm the writer's name first-hand:

```bash
sed -n '13,25p' apps/web/src/shared/schemas/extraction/paymentConfirmationExtractionSchema.ts
```

Expected: `auth_ref: z.string().optional(),` present; **no** `authorization_reference`. If that is not what you see, STOP and report.

- [ ] **Step 2: Write the failing test**

```ts
  it('payment_confirmation scores its heaviest axis (reference 0.35) from auth_ref', async () => {
    const db = adminClient();
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    await seedOpenPayment(db, SEED.ORG_HOLDING, fixture.vendorId, {
      amount: 5000,
      paymentDate: '2026-05-10',
      authorizationReference: 'ACH-TRACE-99999',
      paymentMethod: 'eft',
    });

    const result = await completeCandidate(
      buildInput(fixture, ctx, {
        documentType: 'payment_confirmation',
        vendorMatchConfidence: 0.95,
        extractedFields: {
          payment_amount: 5000,
          payment_date: '2026-05-10',
          auth_ref: 'ACH-TRACE-99999',
          payment_method: 'eft',
        },
      }),
      ctx,
    );

    expect(result).toHaveLength(1);
    const axes = Object.fromEntries(
      result[0].candidate_features.features.map((f) => [f.feature_name, f.normalized_score]),
    );
    expect(axes.reference_alignment).toBe(1);
    // vendor .20*.95=.19 + amount .25 + date .10 + reference .35 + pm .10 = .99
    expect(result[0].confidence_score).toBeGreaterThan(0.95);
  });
```

- [ ] **Step 3: Run it and WATCH it fail**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "heaviest axis"
```

Expected: **FAIL** — `reference_alignment` is `0`, score ≈ `0.64`.

- [ ] **Step 4: Fix site 4**

`Read` `documentRouterService.ts:1263-1298`, then:

```ts
        parsed.extracted_fields.auth_ref,          // :1265, was authorization_reference
```
```ts
          extracted: parsed.extracted_fields.auth_ref ?? null,   // :1295
```

Leave `payment_amount`, `payment_date`, `payment_method` unchanged.

- [ ] **Step 5: Run and confirm pass**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "heaviest axis"
```

Expected: **PASS**, score ≈ `0.99`.

- [ ] **Step 6: Migrate the fixture at `:1056` ONLY**

Change the key **inside `extractedFields`** at `:1056` from `authorization_reference:` to `auth_ref:`.

**Do NOT touch** `:1050` (`authorizationReference:` — a `seedOpenPayment` option) or `:152` (`insert.authorization_reference` — the `payments` table column). Those are candidate-side and correct.

- [ ] **Step 7: Run, typecheck, report**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts
pnpm --filter @chounting/web typecheck
```

Report; **do not commit**. Subject: `fix(scoring): site 4 — payment_confirmation reads auth_ref (restores the 0.35 reference axis)`.

---

## Task 4: site 5 — `rematchCandidate` reconstruction — **MERGE-SAFETY PRECONDITION**

> **Elevated 2026-07-22 (grounded post-Task-1).** This is no longer completeness work. Task 1 introduces a **transient regression** on the re-evaluation path: before it, site 1 read `invoice_amount`/`invoice_date` — the same invented names site 5 writes — so rematch amount+date were internally consistent and live. After it, site 1 reads `amount`/`accounting_date` while site 5 still writes `invoice_amount`/`invoice_date`, so both resolve to `undefined` → `0`. **vendor_invoice amount and date go live→dead on the rematch path until this task lands.**
>
> Direction is fail-safe (dead axes → margin 0 → branch (b) → exception queue → a human sees it, under the verified bleed-stop, no ledger write), so it is not dangerous. But it is this arc's own bug class reintroduced on a narrower path, and it is **test-invisible**: verified 2026-07-22 that the dispatchTrigger suite asserts outcomes only — zero assertions on `candidate_features` / `confidence_score` / `normalized_score`. The 121-green Task 1 run does not speak to it.
>
> Consequences: (a) Tasks 1-3 must not be merged without this task; (b) if Task 1 is committed alone, its message **must name the split-vocabulary transient** — invisibility is the failure mode this arc exists to end; (c) Step 2's test below is the coverage that closes the blind spot permanently.

**Files:**
- Modify: `apps/web/src/services/document-platform/documentRouterService.ts:564-585` (feature lookups), `:652-656` (reconstruction)
- Test: `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts` (new — this is where the re-evaluation helpers already live)

**Reaching `rematchCandidate`:** it is module-private (`documentRouterService.ts:534`). The public path is the exported `dispatchTrigger` (`:2088`) → `runPerCaseReEvaluation` → `rematchCandidate` (`:1770`). The existing suite already drives this with a `buildT5Envelope(orgId, billId, traceId)` helper — use it. **Do not add a `_for_test` export.**

**Interfaces:**
- Consumes: `candidate_features.features[]` records produced by `composeScore`, each `{ feature_name, raw_value, normalized_score, weight, contribution }`. Axis names: `vendor_match`, `amount_match`, `date_proximity`, `reference_alignment`, `payment_method_consistency`.
- Produces: `rematchCandidate` reconstructs extractor-vocabulary keys for all three document types.

- [ ] **Step 1: Verify the raw values are actually reachable (not a silent no-op)**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts -t "extractor vocabulary" --reporter=verbose
```

Then confirm by reading `documentRouterService.ts:965-970` that `reference_raw_value` is `{ extracted, candidate, match }` and `:1106-1111` that `payment_method_raw_value` is `{ extracted, candidate, match }`. If either is `null` on the stored candidate, the extension below is a no-op — STOP and report.

- [ ] **Step 2: Write the failing test**

Add to `apps/web/tests/integration/documentRouterService.dispatchTrigger.integration.test.ts`, alongside the existing T5 tests (which already use `buildT5Envelope` and `seedStrandedCase`):

```ts
  it('T5 re-evaluation reconstructs reference, not just amount/date', async () => {
    const db = adminClient();
    const fixture = await buildRouterCaseFixture(SEED.ORG_HOLDING, ctx);
    const billId = await seedOpenBill(db, SEED.ORG_HOLDING, fixture.vendorId, {
      amount: 1000,
      issueDate: '2026-05-13',
      billNumber: 'BILL-001',
    });

    // Seed a prior candidate carrying all three raw_values.
    await completeCandidate(
      buildInput(fixture, ctx, {
        extractedFields: {
          amount: 1000,
          accounting_date: '2026-05-13',
          vendor_invoice_number: 'BILL-001',
        },
      }),
      ctx,
    );

    // T5 drives dispatchTrigger → runPerCaseReEvaluation → rematchCandidate.
    await dispatchTrigger(buildT5Envelope(SEED.ORG_HOLDING, billId, ctx.trace_id), ctx);

    const { data: rows, error } = await db
      .from('document_relationship_candidates')
      .select('candidate_features, supersedes_candidate_id')
      .eq('document_case_id', fixture.caseId)
      .not('supersedes_candidate_id', 'is', null);
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);

    const features = (rows![0].candidate_features as { features: Array<{ feature_name: string; normalized_score: number }> }).features;
    const axes = Object.fromEntries(features.map((f) => [f.feature_name, f.normalized_score]));
    expect(axes.amount_match).toBe(1);
    expect(axes.date_proximity).toBe(1);
    // Pre-fix this is 0 — the reconstruction never carried the reference value.
    expect(axes.reference_alignment).toBe(1);
  });
```

If `buildRouterCaseFixture` / `seedOpenBill` / `buildInput` are not already imported in this file, copy them from `documentRouterService.integration.test.ts` rather than re-implementing — they are private per-file helpers by existing convention.

- [ ] **Step 3: Run it and WATCH it fail**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.dispatchTrigger.integration.test.ts -t "reconstructs reference"
```

Expected: **FAIL** — `reference_alignment` is `0`.

- [ ] **Step 4: Add the two missing feature lookups**

`Read` `documentRouterService.ts:564-586`, then add after the `dateFeature` lookup:

```ts
  const referenceFeature = candidateFeatures.features.find(
    (f) => f.feature_name === 'reference_alignment',
  );
  const paymentMethodFeature = candidateFeatures.features.find(
    (f) => f.feature_name === 'payment_method_consistency',
  );
```

and after the `dateRaw` cast:

```ts
  const referenceRaw = referenceFeature?.raw_value as
    | { extracted?: string | null }
    | null
    | undefined;
  const paymentMethodRaw = paymentMethodFeature?.raw_value as
    | { extracted?: string | null }
    | null
    | undefined;
```

- [ ] **Step 5: Replace the reconstruction block**

`Read` `documentRouterService.ts:647-660`, then replace the `extracted_fields` object with:

```ts
    // Extractor vocabulary (post field-name alignment). Keys are distinct
    // across document types, so the unconditional-write pattern from chunk-3
    // still holds — each branch reads only its own keys.
    extracted_fields: {
      // vendor_invoice
      amount: amountRaw?.extracted ?? null,
      accounting_date: dateRaw?.extracted ?? null,
      vendor_invoice_number: referenceRaw?.extracted ?? null,
      // receipt
      total: amountRaw?.extracted ?? null,
      date: dateRaw?.extracted ?? null,
      // payment_confirmation
      payment_amount: amountRaw?.extracted ?? null,
      payment_date: dateRaw?.extracted ?? null,
      // receipt + payment_confirmation
      auth_ref: referenceRaw?.extracted ?? null,
      payment_method: paymentMethodRaw?.extracted ?? null,
    },
```

- [ ] **Step 6: Run and confirm pass**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.dispatchTrigger.integration.test.ts -t "reconstructs reference"
```

Expected: **PASS**.

- [ ] **Step 7: Run the whole router suite, typecheck, report**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/documentRouterService.integration.test.ts tests/integration/documentRouterService.dispatchTrigger.integration.test.ts
pnpm --filter @chounting/web typecheck
```

Report; **do not commit**. Subject: `fix(scoring): site 5 — rematchCandidate reconstructs reference + payment_method across all three types`.

---

## Task 5: pipeline-level proof

**Files:**
- Create: `apps/web/tests/integration/scoringFieldAlignmentPipeline.integration.test.ts`

**Interfaces:**
- Consumes: the real `ingestDocument` pipeline with the **sidecar** mocked (no Claude call at all — the fixture is Tier-A-sufficient, so Stage 4 never falls through to paid Tier C); the aligned reader from Tasks 1-4.
- Produces: end-to-end evidence that a real extraction reaches a multi-axis score.

> **Do NOT use `tests/integration/e2e/ingestPipelineHarness.ts`.** Its consumers are gated behind `RUN_MODAL_E2E` *and* require the live Modal sidecar plus secrets — they do not run in `pnpm test:full` and would violate the no-paid-calls constraint.
>
> **Base-switch note (2026-07-22).** This plan was drafted against `feat/board-4-fork-c`, but the work branched from `docs/scoring-bug`. `statementNotInvoicePipelineWiring.integration.test.ts` was **added by Fork C and does not exist on this base**. Verified substitutes that do exist here, are un-gated, mock `invokeSidecar`, and call `ingestDocument`: **`tests/integration/multiInvoicePipelineWiring.integration.test.ts`** (use this one) and `tests/integration/routingTerminalDisposition.integration.test.ts`.

- [ ] **Step 1: Confirm the model file exists on this base, then read it**

```bash
git branch --show-current    # expect: fix/scoring-field-name-alignment
sed -n '1,60p' apps/web/tests/integration/multiInvoicePipelineWiring.integration.test.ts
```

The Tier-A convention section is **not on this base** (Fork C codified it in `docs/04_engineering/conventions/testing.md`), so do not `sed` for it. The requirements it encodes, restated here so the fixture is correct without it:

- Stage-4 `tierASufficient` needs amount + `vendor_invoice_number` + `accounting_date`, labelled `Invoice #<n>` / `Total: $x` / `Date:`. Satisfying it is what keeps Stage 4 from falling through to **paid** Tier C.
- Stage-2.5 `looksMultiInvoice` fires on ≥2 six-character letter-AND-digit tokens — keep the fixture to **one** such token, or the document routes to multi-invoice segmentation instead.
- Seed link/α substrate via the real RPCs, never raw inserts.

- [ ] **Step 2: Copy the mock scaffolding from the reference test**

Reproduce this header shape (confirm exact bytes against `multiInvoicePipelineWiring.integration.test.ts` on this base before copying):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));
vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { ingestDocument } = await import('@/agent/orchestrator/extraction/ingestDocument');
const { getStorageProvider } = await import('@/services/storage/resolver');
const { invokeSidecar } = await import('@/agent/orchestrator/extraction/sidecar/client');

const db = adminClient();
```

Use a Tier-A-sufficient clean-invoice OCR fixture modelled on that file's `CLEAN_LINES` (labelled `Invoice #<n>` / `Vendor: <name>` / `Date: <iso>` / `Total: $<amt>`), seed a matching bill for the same vendor with the same amount / issue date / bill number, then:

```ts
    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    const { data: candidates } = await db
      .from('document_relationship_candidates')
      .select('confidence_score, candidate_features')
      .eq('document_case_id', caseId);

    expect(candidates).toHaveLength(1);
    // 0.30 is the pre-fix structural ceiling (vendor_match weight alone).
    expect(candidates![0].confidence_score).toBeGreaterThan(0.3);

    const features = (candidates![0].candidate_features as { features: Array<{ feature_name: string; normalized_score: number }> }).features;
    const axes = Object.fromEntries(features.map((f) => [f.feature_name, f.normalized_score]));
    expect(axes.amount_match).toBe(1);
```

- [ ] **Step 3: Run it**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/scoringFieldAlignmentPipeline.integration.test.ts
```

Expected: PASS.

- [ ] **Step 4: Confirm no paid calls**

```bash
pnpm --filter @chounting/web exec vitest run tests/integration/scoringFieldAlignmentPipeline.integration.test.ts 2>&1 | grep -c "callClaude: API call complete"
```

Expected: `0`. Any other number — STOP and report.

- [ ] **Step 5: Report** — **do not commit**. Subject: `test(scoring): pipeline-level proof that aligned fields reach multi-axis scoring`.

---

## Task 6: stale comments + obligation re-file + friction journal

**Files:**
- Modify: `apps/web/src/services/document-platform/documentRouterService.ts:203-209`
- Verify (do not edit): `apps/web/src/services/document-platform/documentRouterService.ts:1054-1055`
- Modify: `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts:134-141`
- Modify: `docs/07_governance/friction-journal.md`

- [ ] **Step 1: Verify the `:1054-1055` arithmetic rather than editing it**

```bash
sed -n '43,49p' apps/web/src/core/document-platform/scoreComposition.ts
```

Confirm `receipt` = vendor `0.25` + amount `0.25` + date `0.15` = **0.65**, matching the comment's claimed Scenario-B cap. If it sums to 0.65, **leave the comment unedited** — it documented intent and the fix restores its truth. Record the arithmetic in the report.

- [ ] **Step 2: Correct the `:203-209` tombstone**

`Read` `documentRouterService.ts:197-212`, then replace the stale observation paragraph with:

```ts
// v1-operational history: from chunk-1 through the 2026-07-22 field-name
// alignment, completeCandidate read placeholder extracted_fields keys that no
// extraction schema emitted, so amount/date/reference normalized to 0 and every
// candidate scored vendor_match alone. For N≥2 that made margin = 0
// structurally and every such case routed to branch (b) → exception queue.
// The alignment restored genuine multi-feature scoring, so branch (a) via the
// margin filter is now reachable and margins are non-zero. This threshold has
// therefore never been exercised against a real margin distribution — its
// ratification is ADR-0019's first calibration cycle (surface 3.5), which
// calibrates it as a coupled set with the three classifier thresholds.
```

- [ ] **Step 3: Re-file the typed-lift obligation**

`Read` `documentRelationshipCandidate.schema.ts:130-150`, then replace the stale trigger paragraph with:

```ts
// extracted_fields is permissive — one z.record for all scored document
// types, with no per-type discrimination.
//
// DEFERRED OBLIGATION (re-filed 2026-07-22). The original note here said
// "lift to typed shape when Phase 7's per-type field schemas ship." Phase 7
// shipped them (vendorInvoiceExtractionSchema.ts et al) and the trigger fired
// with nothing watching it, so the chunk-1 placeholder key names stayed the
// live contract and three of five scoring axes read undefined for an entire
// phase. See the 2026-07-22 friction-journal entry.
//
// The 2026-07-22 fix aligned the reader keys to the extractor vocabulary by
// hand. That is correct but NOT structural: nothing makes a future mismatch a
// compile error. The lift to a per-document-type discriminated contract is the
// remedy that closes the bug class.
//
// RE-FILED TRIGGER: governed auto-commit return (ADR-0007 §Tier 2 Q78) — a
// real gate with an owner, not a date that can pass unobserved. This is a
// deliberate deferral, not an oversight.
```

- [ ] **Step 4: Write the friction-journal entry**

Append a `## 2026-07-22 — ...` section to `docs/07_governance/friction-journal.md` (newest entries go at the end; the current last entry is `## 2026-07-22 — board #4 Fork C seam fix …` at `:19418`). It must record:

- The pattern: **a deferred obligation whose named trigger fired unobserved**. Not a typo, not three independent mismatches.
- The true radius: all three scored types (dead weight 0.70 / 0.60 / 0.35), five sites, plus the site-5 reconstruction gap where `payment_confirmation` re-evaluation reconstructed nothing at all.
- The `payment_confirmation` rationale inversion: `reference_alignment` is weighted 0.35 *because* bank-issued references are canonical, and that was the axis that never fired.
- Why the fixtures hid it: the tests seeded the reader's invented vocabulary, so 100%-dead scoring shipped green.
- The re-filed trigger and where it lives.
- Codification status: **not** a codification. The must-not-fire-on-the-legitimate-adjacent-case lesson fires here at **N=2** (Fork C dup over-fire was N=1) — bank it as a graduate-ready candidate and route through `codify-convention` at the next arc close, per the deferred-authoring precedent.

- [ ] **Step 5: If the operator chose a branch where the `docs/scoring-bug` entry exists, amend it**

```bash
rg -n "scoring silently reduced" docs/07_governance/friction-journal.md
```

If present (i.e. Task 0 chose `docs/scoring-bug` as the base), append a dated amendment to that entry recording the corrected radius — additive, provenance-preserving, never a silent rewrite. If absent, the new entry from Step 4 carries the correction and the report must say so explicitly.

- [ ] **Step 6: Report** — **do not commit**. Subject: `docs(scoring): re-file typed-lift obligation against a live trigger + friction entry (radius correction)`.

---

## Task 7: full verification sweep

- [ ] **Step 1: Typecheck**

```bash
pnpm --filter @chounting/web typecheck
```
Expected: clean.

- [ ] **Step 2: Floor suite**

```bash
pnpm agent:validate
```
Expected: floor 26/26, 0 ERRORs. The one scoped-out Q2 query carve-out is expected.

- [ ] **Step 3: Full suite (Condition-1 evidence)**

```bash
pnpm test:full
```
Expected: exactly **one** failure — `ReviewCaseDetailView.test.tsx` (known-red carry-forward). **STOP and report on anything else.** Record the pass/fail/skip counts verbatim; do not predict them.

- [ ] **Step 4: No paid calls**

```bash
pnpm test 2>&1 | grep -c "callClaude: API call complete"
```
Expected: `0`.

- [ ] **Step 5: Lint**

```bash
pnpm lint
```
Expected: clean.

- [ ] **Step 6: Final report to the operator**

Include: the observed RED output from Task 1 Step 2 and Task 3 Step 3 (the dead-axis proof), the `test:full` counts verbatim, the `:1054-1055` arithmetic result, confirmation that the two intended-null sites are byte-unchanged (`git diff` on `documentRouterService.ts:1001-1015` and `:1209-1223` shows nothing), and the full commit chain for the operator's review.

```bash
git status --porcelain
git diff --stat
```

**Do not commit, do not push.** Both are the operator's per-act word.
