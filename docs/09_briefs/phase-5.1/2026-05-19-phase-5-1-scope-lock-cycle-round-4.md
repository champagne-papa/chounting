# Phase 5.1 Amendments — Scope-Lock Cycle Round 4

**Session:** 18
**Date:** 2026-05-19
**Branch:** `staging`
**HEAD at session-onset:** `5121569` ("docs(phase-5.1): Round 3 walk (Sub-Q5 ordering + Sub-Q4 sub-decisions + Sub-Q4 sub-shapes)")
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green; full vitest trusted at 1148/1148 per directive baseline.
**Predecessor:** Round 3 close at `5121569` (2026-05-19 earlier); Round 2 at `2560ef6`; Round 1 at `72a40bf`. Four Phase 5.1 commits ahead of `origin/staging`.

---

## §1 — Preamble + Round 3 inheritance + 4 findings + 3 divergences banking

### §1.1 Round 3 close summary

Round 3 closed eleven sub-questions/sub-decisions at 501 lines. Round 3 absorbed three preamble locks (Sub-Q2 = 2.β; Sub-Q4 = Option (i) single commit; Sub-Q4.5 = 4.5.α) and walked Sub-Q5 ordering + Sub-Q4 sub-decisions (4-a/b/c/d) + Sub-Q4 sub-shapes (1/2/3). Round 4 inherits eleven locks and walks the remaining two final-lock surfaces (Sub-Q1 + Sub-Q5) plus per-chunk discipline + Two Laws verification scope + friction-journal cycle inventory.

### §1.2 Eleven Round 3 dispositions standing at Round 4 onset

| Sub-Q | Disposition | Lock round |
|---|---|---|
| Sub-Q2 | 2.β (partial extraction) | Round 3 preamble |
| Sub-Q3 | β (substrate-tables-only) | Round 2 onset |
| Sub-Q4 | Option (i) single commit | Round 3 preamble |
| Sub-Q4.5 | 4.5.α (inline) | Round 3 preamble |
| Sub-Q4-a | per-bill granularity | Round 3 |
| Sub-Q4-b | primary_invoice + receipt accepted set | Round 3 |
| Sub-Q4-c | post-time-only enforcement | Round 3 |
| Sub-Q4-d | forward + audit row backfill | Round 3 |
| Sub-Q4-shape-1 | EVIDENCE_INCOMPLETE ServiceErrorCode | Round 3 |
| Sub-Q4-shape-2 | two optional fields + Zod default | Round 3 |
| Sub-Q4-shape-3 | billEvidenceCompleteness.test.ts flat path + 3 fixtures | Round 3 |
| Sub-Q6 | docs/09_briefs/phase-5.1/ | Round 1 |
| Sub-Q7 | phase-5-1-retrospective.md standalone | Round 2 |

Sub-Q1 = 1.γ-i and Sub-Q5 = 5.1a → 5.1b are leans pending Round 4 joint final lock.

### §1.3 Four Round 3 substantive findings absorbed

- **Finding 1 — ADR-0011 §15 editorial cluster (2 candidates).** "Adjacent commit paths" framing over-broad (Round 2 Refinement B) + "primary_invoice (or 'primary')" cites non-existent enum value at ADR-0011 §15:850 (Round 3 §3.b). Bank for Phase 5.1 retrospective drafting; potential ADR-0011 fifth amendment (editorial-only).
- **Finding 2 — `controller_override_memo` reserved post-v1.** Per ADR-0016 §2:421-427; v1 captures override via boolean flag + audit row (4-d.γ); PDF attachment is post-v1 trigger.
- **Finding 3 — T2_new_payment literal already exists at chunk 5.1b precondition.** At `documentRelationshipCandidate.schema.ts:111` in `ReRoutingTriggerSchema`. Phase 5.1 chunk 5.1b adds the T2 **branch** to `DispatchTriggerInputSchema` (5 → 6 branches at line 418), NOT the literal. Sub-Q2 T2 wiring volume tightens within ~720-1190 LOC chunk 5.1b band.
- **Finding 4 — bill integration tests camelCase + flat path convention.** `billEvidenceCompleteness.test.ts` matches existing `bill[Action].test.ts` pattern per Sub-Q4-shape-3 lock. N=1; below conventions.md graduation threshold.

### §1.4 Session-onset divergences — N=0 candidate (c) instances

**Notable: zero new path divergences fired at Round 4 verify-from-disk.** All 16 inputs (13 inherited + 3 new) at correct paths. Candidate (c) catalog stays at **N=19** through Round 4.

Rounds 1-3 fired N=4 + N=2 + N=3 = N=9 cumulative candidate (c) instances at session-prompt-authoring grain. Round 4 fires N=0. Two plausible mechanisms:

- **(i) Directive-author discipline improvement.** Three consecutive rounds of candidate (c) instances at session-prompt-authoring grain may have prompted brainstorming-side verify-from-disk discipline tightening before Round 4 prompt fires.
- **(ii) Fewer fresh path citations.** Round 4 directive inherits most inputs from prior rounds; only 3 new inputs (Phase 6.5 chunk 1 brief; chunk 3 brief; friction-journal.md) all at well-established canonical paths.

Both plausible. The directive's own meta-observation at §H "catalog forecasts N=20+ before cycle close" was a partial-information-recommendation-drift counter-prediction; reality is N=19 holds at Round 4. Bank as Phase 5.1 retrospective drafting observation: **candidate (c) catalog rate may decelerate as cycle progresses + discipline reinforces**.

**Updated candidate (c) catalog observation:**
- Catalog stands at **N=19** at Round 4 onset (same as Round 3 close).
- Brainstorming-arc grain at N=13/N=19 (highest-firing).
- Retrospective-authoring fourth-grain candidate at N=1.
- ADR-authoring fifth-grain candidate at N=0 numbered + N=2 banked-for-retrospective (Finding 1 cluster).

### §1.5 Round 4 walk structure

| § | Walk | Primary outputs |
|---|---|---|
| §1 | Preamble + Round 3 inheritance + 4 findings + 3 divergences | (this section) |
| §2 | Sub-Q1 final lock (1.γ-i two-chunk decomposition) | Locked + volume forecast confirmed |
| §3 | Sub-Q5 final lock (5.1a → 5.1b sequenced) | Locked + ordering rationale |
| §4 | Path C invocation final adjudication | Ratified-negative; reactive availability preserved |
| §5 | Per-chunk acceptance criteria + rollback + test matrix | Chunk 5.1a + chunk 5.1b detailed criteria |
| §6 | Two Laws verification scope per chunk | INV-SERVICE-001/002 + INV-AUTH-001 inheritance |
| §7 | Friction-journal cycle inventory | Codification-candidate consolidation for retrospective |
| §8 | Round 4 close + Round 5+ scope projection | Operational-flex collapse evaluation |

### §1.6 Canonical cross-references (Round 4 substrate)

- **Phase 6.5 chunk 1 brief** at `docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-1.md` (623 lines) — chunk-grade acceptance-criteria + rollback + test-matrix authoring shape (per CTO Condition 5 inheritance). Structure: Preamble + Scope + Substrate touchpoints + Tasks (per-task acceptance criteria) + Cross-task verification + Implementation order + Risk + Rollback posture distributed across §6 + §7.
- **Phase 6.5 chunk 3 brief** at `docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-3.md` (1091 lines) — heavier chunk-grade authoring grain inheritance reference.
- **friction-journal.md** at `docs/07_governance/friction-journal.md` (15,700 lines) — Path C reactive-availability discipline reference; F-J-14 third-instance Phase 6.5 codification context.
- **All Round 1-3 inputs** carry forward per directive enumeration.

---

## §2 — Sub-Q1 final lock (1.γ-i two-chunk decomposition)

### §2.1 Ratification

**Sub-Q1 = 1.γ-i LOCKED.** Two-chunk decomposition:
- **Chunk 5.1a** — INV-DOC-001 + vendor_credits β paired substrate amendments.
- **Chunk 5.1b** — paymentService standalone greenfield introduction.

### §2.2 Volume forecast at Round 4 grain

Refined from Round 2 forecast (~1400-2520 LOC) per Round 3 findings:

| Chunk | Component | Volume (LOC) |
|---|---|---|
| 5.1a | INV-DOC-001 leaf registration (3 files + code annotation) | ~150-250 |
| 5.1a | INV-DOC-001 Layer 2 enforcement code + Sub-Q4-shape-2 schema extension | ~80-150 |
| 5.1a | INV-DOC-001 integration tests (3 fixtures) | ~150-300 |
| 5.1a | EVIDENCE_INCOMPLETE ServiceErrorCode extension | ~5-15 |
| 5.1a | vendor_credits + vendor_credit_applications migration | ~150-300 |
| 5.1a | ADR-0016 third amendment block | ~100-200 |
| 5.1a | linked_entity_type CHECK + Zod widen + types regeneration | ~80-150 |
| 5.1a | Sub-Q4-d 4-d.γ backfill migration (auto-override + audit row) | ~50-100 |
| **Chunk 5.1a subtotal** | | **~765-1465 LOC** |
| 5.1b | paymentService.ts greenfield service file | ~250-400 |
| 5.1b | paymentService Zod schemas (recordPayment.schema.ts or analogous) | ~80-130 |
| 5.1b | paymentService unit + integration tests | ~250-400 |
| 5.1b | billService.recordPayment refactor to delegate to paymentService.record() | ~80-150 |
| 5.1b | T2_new_payment branch addition to DispatchTriggerInputSchema | ~10-30 |
| 5.1b | T2 dispatcher emission wiring at paymentService.record() | ~30-60 |
| **Chunk 5.1b subtotal** | | **~700-1170 LOC** |
| **Phase 5.1 total** | | **~1465-2635 LOC** |

Round 4 forecast slightly higher than Round 2 (~1400-2520) per Sub-Q4-d 4-d.γ backfill migration component (~50-100 LOC). Both chunks remain under RI-7 single-session ceiling (~2000 LOC empirical per Phase 6.5).

### §2.3 Sub-Q1 lock rationale (consolidated)

- **Substrate-grain alignment.** Chunk 5.1a pairs two substrate-amendment-grade artifacts (INV-DOC-001 reservation-graduation + vendor_credits β substrate-creation). Both have ADR amendment block deliverables (ADR-0011 §15 reservation graduation; ADR-0016 third amendment cycle). Per Phase 2.5 Commit B convention, ADR amendments are additive provenance-preserving.
- **Service-grain alignment.** Chunk 5.1b standalone paymentService is the only chunk introducing new service file + Zod schemas + T2 dispatcher activation + billService.recordPayment refactor. Service-grain work has focused review shape (Two Laws verification + withInvariants wrap + INV-SERVICE-001/002/AUTH-001 inheritance + T2 dispatcher emission test).
- **Volume balance.** Both chunks well-balanced (~765-1465 vs ~700-1170 LOC); neither exceeds RI-7 ceiling.
- **Dependency analysis.** No substrate-side dependency forces alternative decomposition. Chunk 5.1b doesn't depend on chunk 5.1a's substrate or vice versa.

---

## §3 — Sub-Q5 final lock (5.1a → 5.1b sequenced)

### §3.1 Ratification

**Sub-Q5 = 5.1a → 5.1b sequenced LOCKED.**

### §3.2 Ordering rationale (consolidated from Round 3 §2)

1. **T3/T2/T1 surface-precedence.** Chunk 5.1a is T3/T2-grade work (governance documentation: ledger_truth_model.md leaf + invariants.md rollup + control_matrix.md row + ADR-0016 third amendment); chunk 5.1b is T1-grade work (service implementation). T3/T2 before T1 per Phase 6.5 retrospective Commit B precedent (CLAUDE.md + conventions.md atomically before code work).
2. **Risk-grade ordering.** Chunk 5.1a (substrate amendments + invariant graduation) is lower-risk per substrate-shape-coherence + ADR-amendment additive provenance. Chunk 5.1b (greenfield service + T2 dispatcher activation + billService.recordPayment refactor) is higher-risk per greenfield-introduction + cross-substrate-wire + caller-internal refactor. Ship lower-risk first.
3. **Substrate-coherence.** Chunk 5.1a touches Phase 5 substrate (existing migrations); chunk 5.1b touches Phase 4 substrate (T2 dispatcher slot) + introduces new service. Phase-5-substrate-coherence ships first; Phase-4-substrate-consumer-wire ships second.
4. **Founder-review-load distribution.** Chunk 5.1a is governance-document-heavy (review by reading docs); chunk 5.1b is code-heavy (review by reading code). Sequenced ordering distributes founder review-load across sessions.

### §3.3 Alternative orderings ruled out

- **5.1b → 5.1a:** No substrate dependency forces; reverse ordering doesn't gain operational benefit per Round 3 §2.2 analysis. Rejected.
- **Parallel chunks:** Not feasible at single-founder + WSL Claude orchestration grain. Rejected.
- **Sub-chunking within chunks:** Drifts toward Sub-Q1 1.β (full decomposition); Sub-Q1 = 1.γ-i locked. Rejected.

---

## §4 — Path C invocation final adjudication

### §4.1 Ratified-negative

**Path C invocation prospectively-negative LOCKED.** Reactive availability through implementation preserved per F-J-14 third-instance Phase 6.5 codification.

### §4.2 Adjudication rationale

- **Both chunks under RI-7 single-session ceiling** (~2000 LOC empirical per Phase 6.5). Chunk 5.1a ~765-1465 LOC; chunk 5.1b ~700-1170 LOC.
- **No prospective complexity signal** at scope-lock cycle close. All sub-questions adjudicated; all sub-decisions locked.
- **F-J-14 three-grain catalog** (Phase 6.5 codification): brief-draft prospective; Phase-A-close prospective; mid-impl-reactive. Phase 5.1 at scope-lock cycle close grain has no signal for prospective grain firing.
- **Reactive availability preserved.** If mid-implementation surfaces unexpected substrate density (e.g., billService.post() refactor surfaces more touchpoints than enumerated; paymentService greenfield surfaces unexpected ServiceErrorCode extension; vendor_credits β migration surfaces additional ADR-0016 cell amendments), reactive Path C invocation at chunk-A or chunk-B implementation session per F-J-14 third-instance discipline.

### §4.3 Named-future-trigger

If chunk 5.1a or chunk 5.1b implementation session surfaces:
- Substrate touchpoints exceeding ~2000 LOC empirical ceiling, OR
- Cross-substrate dependency not enumerated at Round 4 grain, OR
- Test-fragility cascade beyond Sub-Q4-shape-3 / paymentService integration test scope,

THEN Path C invocation fires reactively per F-J-14 third-instance discipline. Phase 5.1 retrospective documents the reactive invocation per F-J-14 grain catalog firing observation.

---

## §5 — Per-chunk acceptance criteria + rollback posture + test matrix

Per v3 §9 Decision 5 + CTO Condition 5. Authoring shape inherits Phase 6.5 chunk 1 brief (623 lines) precedent: Preamble + Scope + Substrate touchpoints + Tasks (per-task acceptance criteria) + Cross-task verification + Implementation order + Risk + Rollback. Round 4 provides chunk-level acceptance criteria; chunk-brief-draft (post-cycle-close) authors per-task decomposition.

### §5.1 Chunk 5.1a — INV-DOC-001 + vendor_credits β substrate amendments

#### §5.1.1 Chunk 5.1a acceptance criteria

**(A) INV-DOC-001 artifact (a) — leaf registration.**

- (A.1) Leaf added to `docs/02_specs/ledger_truth_model.md` at end of Layer 2 section (before Phase 2 Reserved Invariants subsection). Per INV-LEDGER-001 template: Invariant + Enforcement + Layer + Interaction + Service-layer backstop + Category A floor test (not applicable; not a floor test) + Referenced by.
- (A.2) Rollup row added to `docs/02_specs/invariants.md` table at row 21. Bidirectional reachability statement updates from "20 distinct INV-IDs (14 Layer 1a, 6 Layer 2, 0 Layer 1b)" → "21 distinct (14 Layer 1a, 7 Layer 2, 0 Layer 1b)".
- (A.3) Audit row added to `docs/06_audit/control_matrix.md` Layer 2 section (Layer 2 currently 6 rows → 7 rows post-chunk-5.1a). Includes test coverage + enforcement mechanism + non-bypassability claim.
- (A.4) Bidirectional reachability annotation in `apps/web/src/services/spend/billService.ts` header comment block + inline at billService.post() function header. Annotation: `INV-DOC-001 Layer 2: bill commit requires primary_document_id OR override_evidence_completeness=true (see ledger_truth_model.md leaf + ADR-0011 §15 reservation graduation)`.
- (A.5) Symmetric-difference verification command (`diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) <(grep -rho 'INV-[A-Z]\+-[0-9]\+' src/ supabase/migrations/ | sort -u)`) returns empty at chunk close.

**(B) INV-DOC-001 artifact (b) — Layer 2 enforcement code.**

- (B.1) `PostBillInputSchema` extended at `apps/web/src/shared/schemas/spend/bill.schema.ts` with two optional fields per 4-shape-2.β:
  - `primary_document_id: z.string().uuid().optional()`
  - `override_evidence_completeness: z.boolean().optional().default(false)`
- (B.2) `billService.post()` enforcement check inserted between Zod validation and bill row INSERT. Check: `if (!parsed.override_evidence_completeness && !parsed.primary_document_id) throw new ServiceError('EVIDENCE_INCOMPLETE', '...')`.
- (B.3) `documentLinkService.create()` call inserted after bill row INSERT, conditional on `primary_document_id` provided. Links primary_invoice to bill atomically in same transaction.
- (B.4) Sub-Q4-b 4-b.β extension: `link_role` accepted set includes both `primary_invoice` AND `receipt` (born-paid scenarios). Enforcement check at billService.post() accepts either link_role for primary attachment.
- (B.5) `EVIDENCE_INCOMPLETE` added to `ServiceErrorCode` union at `apps/web/src/services/errors/ServiceError.ts` per 4-shape-1.α.
- (B.6) Integration test `apps/web/tests/integration/billEvidenceCompleteness.test.ts` ships with 3 fixtures per Sub-Q4-shape-3:
  - Positive path: bill post with primary_document_id succeeds + source_document_links row created.
  - Override path: bill post with override_evidence_completeness=true succeeds without primary_document_id.
  - Failure path: bill post without primary_document_id + without override throws EVIDENCE_INCOMPLETE.

**(C) Sub-Q4-d 4-d.γ backfill.**

- (C.1) Migration includes `UPDATE bills SET override_evidence_completeness=true WHERE bill_id NOT IN (SELECT linked_entity_id FROM source_document_links WHERE linked_entity_type='bill' AND link_role IN ('primary_invoice', 'receipt') AND link_status='created')`.
- (C.2) Migration inserts `bill_evidence_override_applied` audit row per UPDATEd bill (mechanism: trigger or batch INSERT statement at migration time; brief-draft adjudicates).
- (C.3) Existing posted bills exempt from forward enforcement via auto-override.

**(D) vendor_credits β substrate amendments.**

- (D.1) Migration `2026XXXXXXXXXX_phase_5_1_vendor_credits_substrate.sql` ships `vendor_credits` + `vendor_credit_applications` tables. Substrate shape mirrors `vendor_prepayments` + `vendor_prepayment_applications` (migration 20240138000000), excluding payments-column extensions (not applicable to vendor_credits).
- (D.2) `linked_entity_type` CHECK constraint at source_document_links broadened from 6-value v1-active to 8-value v1-active (adding `vendor_credit` + `vendor_credit_application`). Per chunk-2-Phase-2 lesson (Layer 1 broadening implies Zod schema broadening): `LinkedEntityTypeSchema` at Zod boundary also widens.
- (D.3) TypeScript types regenerated via `pnpm db:types` post-migration; commits regenerated `apps/web/src/db/types.ts`.

**(E) ADR-0016 third amendment cycle.**

- (E.1) New amendment block at ADR-0016 file end (after line 1983; following Phase 2.5 Commit A amendment at line 1751 + Phase 4 retrospective amendment at line 1869). Additive provenance-preserving per Phase 2.5 Commit B convention.
- (E.2) Amendment content: §1 v1-active 6→8 (re-add vendor_credit + vendor_credit_application per Phase 5.1 substrate landing); §3 pair-validity matrix cells for vendor_credit + vendor_credit_application rows transition from "R" (reserved post-v1) to "A" (active v1) for at least `primary_invoice` and adjacent cells per substrate landing; §5 cascade behavior amendments for the two row types; §Closes Q-no-tracking (if new tracking added).
- (E.3) Cross-reference to both Phase 2.5 Commit A (prior reservation) AND Phase 5.1 (current ratification) per Phase 2.5 Commit B "never restructure to absorb amendments invisibly" convention.

#### §5.1.2 Chunk 5.1a rollback posture

**Medium reversibility per Phase 6.5 chunk-1 precedent.**

- **(R.1) Layer 2 enforcement code reversible** via single revert-commit on chunk 5.1a. billService.post() reverts to pre-Phase-5.1 shape; PostBillInputSchema reverts to 18-field schema; EVIDENCE_INCOMPLETE removed from ServiceErrorCode union; integration tests removed.
- **(R.2) vendor_credits substrate migration reversible** via down-migration. No consumer service surface (Sub-Q3 β disposition); no data loss risk (substrate-without-consumers). Down-migration: DROP TABLE vendor_credit_applications; DROP TABLE vendor_credits; revert linked_entity_type CHECK constraint to 6-value v1-active.
- **(R.3) ADR-0016 third amendment additive.** Preserves Phase 2.5 Commit A + Phase 4 retrospective amendments per provenance discipline. Rollback removes amendment block; pre-Phase-5.1 ADR-0016 state preserved.
- **(R.4) INV-DOC-001 leaf registration reversible.** Revert removes leaf from ledger_truth_model.md + rollup row from invariants.md + audit row from control_matrix.md + annotation from billService.ts. Bidirectional reachability statement reverts to 20 distinct INV-IDs.
- **(R.5) Sub-Q4-d 4-d.γ backfill audit rows preserved on rollback** (audit_log is append-only per INV-AUDIT-002). bill_evidence_override_applied audit rows remain queryable post-rollback; semantic interpretation shifts ("override was applied at Phase 5.1 attempt; now reverted" — audit-trail-preserving).
- **(R.6) Risk: cross-chunk dependency.** If chunk 5.1b ships and depends on chunk 5.1a's vendor_credits substrate (it does NOT per Sub-Q3 β + Sub-Q2 2.β), rollback of chunk 5.1a would require chunk 5.1b revert first. Per Round 4 §2.3 dependency analysis, no cross-chunk dependency; chunk 5.1a rollback is independent of chunk 5.1b.

#### §5.1.3 Chunk 5.1a test matrix

- **Floor tests preserved:** 1148/1148 vitest + 26/26 agent:validate baseline maintains. Chunk 5.1a adds new tests; doesn't remove existing.
- **New tests:**
  - `apps/web/tests/integration/billEvidenceCompleteness.test.ts` — 3 fixtures (positive / override / failure).
  - `apps/web/tests/integration/billPostBill.test.ts` extensions — if existing test relies on Sub-Q4-shape-2 PostBillInputSchema fields default-false behavior, verify no regression; otherwise no changes.
  - Migration-level test for Sub-Q4-d 4-d.γ backfill — assertion that pre-Phase-5.1 bills without primary attachment get override_evidence_completeness=true + corresponding audit row exists post-migration.
- **Substrate-mod test-staleness review** per `.claude/rules/migrations.md` discipline:
  - linked_entity_type CHECK broadens 6 → 8 v1-active. Audit dependent tests (`tests/integration/` grep for `linked_entity_type` + `LinkedEntityTypeSchema`). Surface to brief-draft.
  - `bills.override_evidence_completeness` column existing UPDATE patterns — verify no test fragility from new auto-override migration.
- **Two Laws floor tests preserved** per §6.
- **Total chunk 5.1a new test count estimate:** 5-10 new tests (3 INV-DOC-001 fixtures + 1-2 migration tests + adjacency-path coverage).

### §5.2 Chunk 5.1b — paymentService greenfield introduction

#### §5.2.1 Chunk 5.1b acceptance criteria

**(F) paymentService greenfield service file.**

- (F.1) New file `apps/web/src/services/spend/paymentService.ts` ships with Pattern B unwrapped function exported as service object (mirror billService.ts shape; smaller surface).
- (F.2) File header comment block per Phase 5 service-layer convention:
  - INV-SERVICE-001 / INV-SERVICE-002 / INV-AUDIT-001 / INV-AUTH-001 inheritance annotations.
  - Reading B preservation note (journalEntryService.post() sole writer of journal_entries / journal_lines).
  - Sub-Q2 2.β partial extraction documentation (payment-flow primitive; AP-domain orchestration retained at billService.recordPayment).
- (F.3) `paymentService.record(input, ctx)` method:
  - Input: payment-flow primitive params (bill_id, amount_cad, payment_method, payment_date, reference_number, fiscal_period_id, entry_date, ap_control_account_id, cash_account_id).
  - Output: `{payment_id, journal_entry_id}` minimal — caller composes lifecycle update + bill audit + T5 dispatch.
  - Composes payment JE (Dr ap_control / Cr cash) + delegates to journalEntryService.post() (Reading B preserved).
  - Inserts payments row (payment_purpose='bill_payment', payment_state='paid').
  - Inserts bill_payment_allocations row.
  - Emits T2_new_payment dispatch post-commit per Pattern B external-wrap variant (try/catch + log per P3-i F-J-4; best-effort isolation).

**(G) paymentService Zod schemas.**

- (G.1) New file at `apps/web/src/shared/schemas/spend/recordPayment.schema.ts` (or analogous payment-domain location; brief-draft adjudicates).
- (G.2) `RecordPaymentInputSchema` per Sub-Q2 2.β partial-extraction shape. 3-layer ADR-0010 discipline (Layer 2 Zod boundary).

**(H) billService.recordPayment refactor.**

- (H.1) billService.recordPayment retains as orchestration wrapper. Internal flow:
  1. Sub-L precondition check (bill.currency === 'CAD').
  2. INV-AP-002 Layer 2 state-transition precondition check.
  3. Validate referenced fiscal_period_id + accounts.
  4. INV-AP-001 Layer 2 cumulative allocation sum check.
  5. **Delegate to paymentService.record()** for payment-flow primitive (payment row + allocation row + JE).
  6. Compute new lifecycle_state.
  7. Update bills.lifecycle_state.
  8. Emit bill_payment_recorded audit (bill grain).
  9. T5_bill_state_transition dispatch (existing F-J-12 conditional gating; fires on newState === 'fully_paid' only).
- (H.2) Consumer surface UNCHANGED per 2.β disposition. Route handler at `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` continues to wrap billService.recordPayment via withInvariants(action: 'bill.record_payment'). No caller migration.

**(I) T2_new_payment branch addition to DispatchTriggerInputSchema.**

- (I.1) Edit `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts:418-453`. Extend discriminated union from 5 branches (T1, T3, T5, T8, T10) to 6 branches (adding T2_new_payment).
- (I.2) T2 branch payload fields per Phase 4 chunk 3 substrate shape: `{ trigger_type: 'T2_new_payment', org_id, payment_id, vendor_id, bill_id, trace_id }`. Exact field list adjudicates at brief-draft per documentRouterService.dispatchTrigger() consumer signature.
- (I.3) Brief-draft verifies that ReRoutingTriggerSchema at line 111 already admits T2_new_payment literal (Finding 3); no changes to ReRoutingTriggerSchema at chunk 5.1b.

**(J) T2 dispatcher emission wiring.**

- (J.1) paymentService.record() invokes `await dispatchTrigger({ trigger_type: 'T2_new_payment', ... }, ctx)` post-commit per Pattern B external-wrap variant.
- (J.2) Best-effort isolation per P3-i F-J-4: try/catch + log.error on dispatcher failure; never propagate; paymentService.record() succeeds regardless of dispatcher outcome.

#### §5.2.2 Chunk 5.1b rollback posture

**Medium reversibility.**

- **(R.7) paymentService greenfield removable** via single revert-commit. All Phase-5.1b additions (new service file + Zod schemas + tests + ServiceErrorCode if any) removed.
- **(R.8) billService.recordPayment refactor reversible.** Revert restores inline JE composition + payment row insert + allocation row insert. No external surface change (consumers unchanged per 2.β).
- **(R.9) T2_new_payment branch addition to DispatchTriggerInputSchema reversible.** Revert removes branch from discriminated union (6 → 5 branches). ReRoutingTriggerSchema preserves T2_new_payment literal (Phase 4 chunk 3 substrate; unaffected).
- **(R.10) T2 dispatcher emission wiring reversible.** Revert removes dispatchTrigger call at paymentService.record() (or removes paymentService.record() entirely if chunk reverts).
- **(R.11) Risk: T2 emission audit row preserved on rollback** (audit_log append-only per INV-AUDIT-002). router_re_evaluation_fired audit rows with T2_new_payment trigger_type remain queryable post-rollback; semantic interpretation shifts (T2 dispatcher fired at Phase 5.1 attempt; now reverted). Phase 4 dispatcher's defensive log message at trigger_type='T2_new_payment' DispatchTriggerInputSchema-parse-failure should be reviewed at brief-draft (potential pre-Phase-5.1-rollback rejection if T2 attempted post-rollback).

#### §5.2.3 Chunk 5.1b test matrix

- **Floor tests preserved.**
- **New tests:**
  - paymentService integration tests (3-5 new tests):
    - Positive: paymentService.record() inserts payment row + allocation row + JE + emits T2.
    - Negative: invalid input (Zod validation failure).
    - Negative: cumulative over-allocation (INV-AP-001 — wait, this is at billService.recordPayment per 2.β orchestration; paymentService doesn't enforce; brief-draft clarifies).
    - T2 emission verification: paymentService.record() emits T2_new_payment + payload validates against DispatchTriggerInputSchema 6th branch.
  - billService.recordPayment regression tests preserved (existing billRecordPayment.test.ts).
- **Substrate-mod test-staleness review:** DispatchTriggerInputSchema 5 → 6 branches. Audit dependent tests (`documentRouterService.dispatchTrigger.integration.test.ts` if exists; verify per Phase 4 chunk 3 test inventory) for fragility per 5-branch enumeration assumptions.
- **Two Laws floor tests preserved** per §6.

---

## §6 — Two Laws verification scope per chunk

INV-SERVICE-001 + INV-SERVICE-002 + INV-AUTH-001 inheritance per chunk.

### §6.1 Chunk 5.1a Two Laws verification

- **INV-SERVICE-001 (every mutating service function wrapped in withInvariants).** billService.post() already wrapped via route handler `apps/web/src/app/api/orgs/[orgId]/bills/route.ts` (verify-from-disk at chunk-brief-draft; existing Pattern B unwrapped function + route-handler-wrapped). Chunk 5.1a changes are within wrap boundary (PostBillInputSchema extension + Layer 2 enforcement code + documentLinkService.create() composition). No new wrap site introduced.
- **INV-SERVICE-002 (adminClient discipline).** billService.post() uses adminClient per existing implementation. Chunk 5.1a documentLinkService.create() call inherits caller's transaction context (adminClient-bound). No userClient introduction.
- **INV-AUTH-001 (every mutating service call authorized via withInvariants(action)).** billService.post() route handler invokes withInvariants(action: 'bill.post'). Chunk 5.1a Sub-Q4-d 4-d.γ backfill migration runs at deploy time (not service-layer mutation); migration discipline applies per `.claude/rules/migrations.md`, not service-layer Two Laws.
- **Migration-level Two Laws.** Per `.claude/rules/migrations.md`: NOT NULL blast radius, substrate-mod test-staleness review apply. Chunk 5.1a migration adds vendor_credits + vendor_credit_applications tables with NOT NULL columns + DEFAULT values; broadens linked_entity_type CHECK 6 → 8 (substrate-mod-event test-staleness review fires per §5.1.3 test matrix item).

### §6.2 Chunk 5.1b Two Laws verification

- **INV-SERVICE-001 (withInvariants wrap from day one).** paymentService.record() ships as Pattern B unwrapped function. Wrap site at route handler (post-Phase-5.1b chunk; brief-draft adjudicates whether chunk 5.1b ships a new route handler for paymentService.record() OR keeps consumers behind billService.recordPayment per 2.β disposition — Sub-Q2 2.β disposition is **billService.recordPayment retains as orchestration**; consumer route handlers don't migrate; paymentService.record() is **internal-only at v1**, called from billService.recordPayment).
  - **Implication:** paymentService.record() doesn't need its own route-handler wrap site at v1; it's wrapped *transitively* via billService.recordPayment's existing wrap. INV-SERVICE-001 satisfied via transitive wrap; chunk 5.1b doesn't introduce new wrap obligation.
  - **Caveat:** if Phase 5.1b+ phase introduces direct paymentService.record() consumer (e.g., AR-phase customer payment route), that consumer needs its own withInvariants wrap. Named-future-deliverable.
- **INV-SERVICE-002 (adminClient discipline).** paymentService.record() uses adminClient per Pattern B discipline. Inherits billService caller's transaction context for current v1.
- **INV-AUTH-001 (every mutating service call authorized).** paymentService.record() is internal-only at v1; permission gate fires at billService.recordPayment's withInvariants(action: 'bill.record_payment') wrap. paymentService.record() inherits authorization context per transitive wrap.

### §6.3 Two Laws verification floor tests preserved

- `serviceMiddlewareAuthorization.test.ts` (Category A floor — INV-AUTH-001) preserved at chunks 5.1a + 5.1b close.
- `crossOrgRlsIsolation.test.ts` (Category A floor — INV-RLS-001) preserved.
- All 5 Category A floor tests (per pnpm agent:floor) green at 26/26 baseline.

---

## §7 — Friction-journal cycle inventory

Codification candidate consolidation for Phase 5.1 retrospective drafting. Codification venue + sub-grain decomposition defer to retrospective.

### §7.1 Candidate (c) catalog evolution (N=19 at Round 4 close)

**Catalog by grain:**
- **Brainstorming-arc grain: N=13/N=19** (highest-firing). Session-prompt-authoring sub-grain N=9 (Rounds 1-3 contribution; Round 4 fires N=0). Other brainstorming-arc sub-grains: estimate-inflation (Refinement A; not numbered), partial-information disposition framings.
- **Retrospective-authoring fourth-grain candidate: N=1** (Phase 5 retro §6:404 vendor_credits assertion correction). Phase 5.1 retrospective writeup grain is future N=2 graduation candidate.
- **ADR-authoring fifth-grain candidate: N=0 numbered + N=2 banked-for-retrospective** (Finding 1 cluster: ADR-0011 §15 adjacent-commit-paths over-broad + primary link_role naming drift).

**Round 4 observation: candidate (c) rate decelerated.** Round 1-3 fired N=9 cumulative instances at session-prompt-authoring grain; Round 4 fires N=0. Possible mechanisms (per §1.4):
- Directive-author discipline improvement (verify-from-disk before prompt fires).
- Fewer fresh path citations (Round 4 inherits most inputs from prior rounds).

Phase 5.1 retrospective drafting evaluates whether N=0 at Round 4 is signal of discipline-internalization vs cycle-progress-dependent. If signal-of-internalization, T4 CLAUDE.md codification candidate: "Session prompt drafting at brainstorming-side: verify-from-disk all cited paths before prompt fires" (preventive vs detective catch-grain shift). N=9 evidence basis at session-prompt-authoring sub-grain may graduate.

### §7.2 ADR-0011 §15 editorial cluster (Finding 1)

Two editorial-clarification candidates for Phase 5.1 retrospective drafting:

- **(C.1) "Adjacent commit paths" framing over-broad** (Round 2 Refinement B). ADR-0011 §15:855-857 cites "billService.post() and adjacent commit paths refuse to commit bills..."; substrate reality is single firing site at billService.post() per Round 2 §3.b.v verify-from-disk.
- **(C.2) "primary_invoice (or 'primary')" cites non-existent enum value** (Round 3 §3.b finding). ADR-0011 §15:848-850 cites "primary_invoice (or `primary`) `link_role`"; `primary` is NOT in the source_document_links link_role enum per ADR-0016 §2:341-360. Only `primary_invoice` exists.

**Codification venue:** Phase 5.1 retrospective drafting authors a fifth ADR-0011 amendment (counting Phase 6.5 retro Commit A + prior amendments) — editorial-only; preserves substantive scope.

### §7.3 Phase 5 retro §6:404 vendor_credits assertion correction

Phase 5 retrospective at lines 404-414 asserts "vendor_credits, vendor_credit_applications tables exist in the schema." Round 1 §2.4 verify-from-disk found this assertion is false (tables don't exist; only enum reservation existed).

**Codification venue:** Phase 5.1 retrospective documents the assertion correction + bank as retrospective-authoring fourth-grain candidate (N=1 catalog instance).

### §7.4 ADR-0016 §1 vendor_credit cell-validity update

Per Sub-Q3 β disposition, vendor_credit + vendor_credit_application move from reserved-post-v1 back to v1-active in linked_entity_type enum. ADR-0016 §1 v1-active set 6 → 8 + §3 pair-validity matrix cells update. Substrate consequence; not an editorial clarification but a substantive amendment.

**Codification venue:** ADR-0016 third amendment cycle (chunk 5.1a deliverable per §5.1.1 (E.1)-(E.3)). Phase 5.1 retrospective documents the amendment provenance per Phase 2.5 Commit B convention.

### §7.5 bill integration test convention (Finding 4)

`bill[Action].test.ts` flat path convention at apps/web/tests/integration/. Sub-Q4-shape-3 lock chose 4-shape-3.α aligned with convention. N=1 below conventions.md graduation threshold.

**Codification venue deferred.** No retrospective action at Phase 5.1 grain; observation banks for future convention codification if pattern fires elsewhere.

### §7.6 controller_override_memo named-future-activation (Finding 2)

ADR-0016 §2:421-427 reserves `controller_override_memo` link_role for post-v1 INV-DOC-001 override evidence PDF attachment. Phase 5.1 v1 captures override via boolean flag + audit row only (4-d.γ); PDF link is post-v1 named-future-trigger adjacent to T4 + T6 dispatcher slots (vendorCreditService consumer post-v1).

**Codification venue:** Phase 5.1 retrospective documents named-future-activation cluster (controller_override_memo + T4 + T6 dispatcher slots). Operational signal triggers (founder + two real users hitting need for controller override evidence PDF; OR vendor_credits operational rollout firing T4/T6 dispatcher activation).

---

## §8 — Round 4 close + Round 5+ scope projection

### §8.1 Round 4 dispositions banked

| Sub-Q | Round 4 status |
|---|---|
| Sub-Q1 | **1.γ-i LOCKED** (two-chunk decomposition) |
| Sub-Q2 | 2.β LOCKED (Round 3 preamble) |
| Sub-Q3 | β LOCKED (Round 2 onset) |
| Sub-Q4 | Option (i) single commit LOCKED (Round 3 preamble) |
| Sub-Q4.5 | 4.5.α LOCKED (Round 3 preamble) |
| Sub-Q4-a | 4-a.α LOCKED (Round 3) |
| Sub-Q4-b | 4-b.β LOCKED (Round 3) |
| Sub-Q4-c | 4-c.α LOCKED (Round 3) |
| Sub-Q4-d | 4-d.γ LOCKED (Round 3) |
| Sub-Q4-shape-1 | 4-shape-1.α LOCKED (Round 3) |
| Sub-Q4-shape-2 | 4-shape-2.β LOCKED (Round 3) |
| Sub-Q4-shape-3 | 4-shape-3.α LOCKED (Round 3) |
| Sub-Q5 | **5.1a → 5.1b sequenced LOCKED** |
| Sub-Q6 | LOCKED (Round 1) |
| Sub-Q7 | LOCKED (Round 2) |
| Path C invocation | **Prospectively-negative LOCKED; reactive availability preserved** |

**All sub-questions, sub-decisions, sub-shapes, and ordering decisions LOCKED at Round 4 close.** Per-chunk acceptance criteria + rollback posture + test matrix shipped at §5. Two Laws verification scope shipped at §6. Friction-journal cycle inventory shipped at §7.

### §8.2 Operational-flex collapse evaluation per Phase 6.5 codification

Per Phase 6.5 codification: cycle collapses Round N+ if all sub-questions adjudicated + all partial-information items operationalized at Round N grain.

**Round 4 status check:**
- All 14 sub-questions LOCKED ✓.
- All 8 sub-decisions (Sub-Q4-a/b/c/d + Sub-Q4-shape-1/2/3 + Sub-Q5 ordering) LOCKED ✓.
- Path C invocation final adjudication LOCKED ✓.
- Per-chunk acceptance criteria + rollback + test matrix shipped at §5 ✓.
- Two Laws verification scope shipped at §6 ✓.
- Friction-journal cycle inventory documented at §7 ✓.

**Operational-flex collapse opportunity AVAILABLE at Round 4 close.** Round 5+ fires only if Round 4 surfaces unforeseen complexity. Round 4 surface is clean (no unforeseen complexity; no new candidate (c) instances; no substrate-side findings beyond Round 3 inventory).

**Disposition lean: Phase 5.1 scope-lock cycle CLOSES AT ROUND 4.** Cycle close + brief-draft plan fires at Session 19 directly (chunk 5.1a brief-drafting per Sub-Q5 5.1a → 5.1b sequenced).

Alternative: Round 5 fires as **cycle-close consolidation round** (analogous to Phase 6.5 cycle close brief at `2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`). The cycle-close consolidation brief consolidates Rounds 1-4 into a single canonical cycle-close artifact per Phase 6.5 precedent.

**Adjudication framing for Session 19 brainstorming-side:**

- **Option A — Round 5 cycle-close consolidation brief.** Single artifact at `docs/09_briefs/phase-5.1/2026-05-XX-phase-5-1-scope-lock-cycle-close.md` consolidates Rounds 1-4 + ships canonical cycle-close artifact per Phase 6.5 precedent. Volume ~800-1200 LOC.
- **Option B — Skip Round 5; Session 19 fires chunk 5.1a brief-drafting directly.** Chunk 5.1a brief at `docs/09_briefs/phase-5.1/chunks/2026-05-XX-phase-5-1-chunk-5-1-a.md` per Phase 6.5 chunk-brief precedent. Rounds 1-4 artifacts stand as cycle-close evidence (no consolidation artifact).
- **Option C — Hybrid.** Round 5 fires lightweight cycle-close summary (1-2 paragraph cycle close summary at `2026-05-XX-phase-5-1-scope-lock-cycle-close.md` ~50-100 LOC) + Session 19 fires chunk 5.1a brief-drafting parallel.

**Round 4 lean: Option B (skip Round 5; Session 19 fires chunk 5.1a brief-drafting directly).** Reasons:
- All sub-questions LOCKED at Round 4; no consolidation work remains.
- Per Phase 6.5 codification operational-flex collapse: cycle collapses when adjudication complete.
- Round 1-4 artifacts (Round 1 = 509 + Round 2 = 633 + Round 3 = 501 + Round 4 = this) sufficient cycle-close evidence.
- Phase 6.5's cycle-close brief shape (~3700 LOC) was substantive because Phase 6.5 had heavier sub-question structure (20 sub-questions) + UI substrate; Phase 5.1's 14 sub-questions + amendment-cycle grain warrants tighter consolidation.

Founder + brainstorming-side adjudicates Option A vs B vs C at Session 19 prompt drafting.

### §8.3 Round count forecast revision

Phase 5.1 scope-lock cycle Round count at Round 4 close: **4-5 rounds total.**
- Round 1 (Session 15): preamble + Sub-Q structure + verify-from-disk pass.
- Round 2 (Session 16): Sub-Q2 + Sub-Q4 + Sub-Q4.5 walks + Sub-Q1 narrowing + Sub-Q7 lock.
- Round 3 (Session 17): three lock absorption + Sub-Q5 walk + Sub-Q4 sub-decisions + Sub-Q4 sub-shapes.
- Round 4 (Session 18; this artifact): Sub-Q1 + Sub-Q5 + Path C final locks + per-chunk discipline + Two Laws + friction-journal inventory.
- Round 5 (optional): cycle-close consolidation brief OR skipped per operational-flex collapse.

Per A4.1-grade Phase-A-realized forecast accuracy: forecast band 5-7 rounds (per cycle precedent inheritance) tightened to 4-5 actual at Round 4 close. Operational-flex collapse heuristic justifies the tightening.

### §8.4 Round 5+ prompt inputs (if Option A or C)

If Round 5 fires per Option A (cycle-close consolidation):
- Consolidate Rounds 1-4 into single canonical artifact.
- Surface candidate (c) catalog observations + meta-discipline observations from Rounds 1-4.
- Sub-question lock summary table (14 sub-questions + 8 sub-decisions; all LOCKED).
- Volume forecast confirmation + risk inventory.

If Session 19 fires chunk 5.1a brief-drafting per Option B:
- Inherit Round 4 §5.1 acceptance criteria as chunk 5.1a brief preamble.
- Operationalize at per-task grain (Phase 6.5 chunk 1 brief shape inheritance).
- Concrete partial-information picks (linked_entity_type CHECK constraint name; migration filename; audit action enum value name; etc.).

### §8.5 Carry-forward observations

1. **A4.1-grade Phase-A-realized forecast accuracy holds.** Rounds 1-3 volumes (509 / 633 / 501) within forecast bands. Round 4 forecast (600-900) — actual TBD at line count post-write.
2. **Operational-flex collapse heuristic graduates at Round 4.** Phase 6.5 codification (Sessions 6/9/12 three-precedent track record at chunk grain) extends to amendment-cycle grain at Phase 5.1 Round 4. Codification observation banks for Phase 5.1 retrospective drafting.
3. **Candidate (c) deceleration at Round 4** (N=0 instances vs Rounds 1-3 N=9 cumulative). Discipline-internalization mechanism vs cycle-progress-dependence adjudicates at Phase 5.1 retrospective drafting.
4. **No new ADR-0011 §15 editorial-cluster candidates** surfaced at Round 4. Cluster stays at 2 candidates (Refinement B + Sub-Q4-b primary link_role).
5. **No substrate-side blockers identified** at Round 4. Chunk 5.1a + chunk 5.1b implementation-ready post-cycle-close.

---

**Round 4 status:** complete. Single-session-execute-and-close per directive. **All sub-questions LOCKED.** Phase 5.1 scope-lock cycle SUBSTANTIVELY CLOSES AT ROUND 4 per operational-flex collapse heuristic. Round 5 cycle-close consolidation brief is optional per founder/brainstorming-side adjudication at Session 19 prompt drafting.
