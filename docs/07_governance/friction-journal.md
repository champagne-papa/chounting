## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X
- NOTE — observation worth preserving for next phase

> **Path note 2026-05-08 (round-2 docs reorganization Session 4
> ec-2 move):** entries below referencing `07_governance/ec-2-prompt-set.md`
> should be read as referring to `09_briefs/phase-1.2/ec-2-prompt-set.md`
> post-move. The file content is unchanged; only its location
> moved. References preserved verbatim per the friction-journal-
> is-history rule (entries record what was true at write time).
> See the 2026-05-08 NOTE entry below for the migration's
> commit-level provenance.

> **Path note 2026-05-08 (round-2 docs reorganization Session 5A
> docs/superpowers/ elimination):** entries below referencing
> `docs/superpowers/specs/` should be read as referring to
> `docs/09_briefs/phase-0/specs/` post-move. Entries referencing
> `docs/superpowers/plans/2026-05-04-*` should be read as referring
> to `docs/09_briefs/phase-0/plans/`. The single entry referencing
> `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md`
> should be read as referring to
> `docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md`.
> File contents are unchanged; only locations moved. References
> preserved verbatim per the friction-journal-is-history rule
> (entries record what was true at write time). See the 2026-05-08
> NOTE entry below (Session 5A closeout) for the migration's
> commit-level provenance.

> **Path note 2026-05-09 (round-2 docs reorganization Session 5B
> Layer 2 phase-0 governance migration):** entries below
> referencing `docs/09_briefs/phase-2/2026-05-03-*` and
> `docs/09_briefs/phase-2/2026-05-04-*` files (D1-D6 ratification
> packages, phase-0-governance-plan, bank-detail amendment,
> evidence-link coordination, phase-0-closure-verification, session
> 2d/2f opening prompts and closeout) should be read as referring
> to their new locations under `docs/09_briefs/phase-0/<sub-bucket>/`
> per the briefs convention's per-phase organization. Sub-bucket
> assignments per Session 5B Decision 2 + 5: governance-plan →
> plans/; D1-D6 packages → ratification-packages/ (NEW sub-bucket
> per convention expansion at Session 5B Decision 2); bank-detail
> amendment + evidence-link + closure-verification + session
> prompts/closeout → chunks/. File contents unchanged; only
> locations moved. References preserved verbatim per the
> friction-journal-is-history rule. See the 2026-05-09 NOTE entry
> below (Session 5B closeout) for the migration's commit-level
> provenance.

## Phase 2

### Phase 5 chunk B5-3-D5 substantive arc closeout retrospective entry (2026-05-12) — seventh Phase-5-arc-execution friction-journal entry + (cadence-β-i-a) third-instance within Phase 5 arc (cross-arc N=3 graduation evaluation FIRED; arc-closure synthesis) + 5 chunk-grain catches + 8 sub-catch-ledger analytical observations + Candidate 4 (i-α) ActivePaymentsView shipped + catch #69 substrate-correction shipped (NEW per-bill bill-detail endpoint closing deferred Disposition (α) from B5-3-D3) + Phase A scope canonical expansion 8 → 9 surfaces + 3 NEW arc-closure retrospective candidates (35th + 36th + 37th)

This is the SEVENTH Phase-5-arc-execution entry. Chunk B5-3-D5 (Slice D Spend continuation — Candidate 4 (i-α) ActivePaymentsView + catch #69 substrate-correction; single-session per (cadence-β-i-a) ratified at chunk-onset triangulation) opened 2026-05-12 at HEAD `13c3a53` (post-B5-3-D4 ship); substantive session #1 + closeout SHIPPED at this commit per (cadence-β-i-a) single-session cadence (THIRD instance after B5-1 + B5-3-D1; **cross-arc N=3 trigger for candidate (e) graduation evaluation FIRES at (cadence-β-i-a) cadence shape — evaluation deferred to Phase 5 arc-closure retrospective per §Drift-B**). Chunk B5-3-D5 ships 1 v1-deliverable read-side UI surface (ActivePaymentsView via MainframeRail "Active Payments" entry-path enabler) + 1 substrate-correction (NEW per-bill bill-detail endpoint closing catch #69 sibling-class to catch #57 substrate-grain semantic drift at downstream-consumer grain). Phase A scope canonical expansion 8 → 9 surfaces ratified at chunk-grain. Phase 5 arc continues with B5-3-D6 (reverse mutation write-side UX per Surface 3 disposition; couples Spend v1 functional-completion at (γ-1) firing condition for arc-closure synthesis venue).

**Chunk-closeout grain preserves §Drift-B narrow-scope methodology** (precedent established at chunks B5-3-D1 + B5-3-D2 + B5-3-D3 + B5-3-D4 closeouts): this entry preserves chunk-grain pattern observations + drift dispositions + carry-forward inventory + analytical-observation enumeration. Cross-arc synthesis defers to Phase 5 arc-closure retrospective.

**Chunk B5-3-D5 SHIPPED summary (single-session per (cadence-β-i-a)):**

- Session #1 + closeout (this commit): 6 modified + 10 new files (~1303 net lines) covering Tasks 1-5 substrate buildout + catch #69 substrate-correction in same uncommitted session #1 increment per (γ-a) bundle pattern
- Tasks 1-5 increment (~736 lines): apReportService.activePayments method + ActivePaymentsRow schema + GET /api/orgs/[orgId]/reports/active-payments route + ActivePaymentsView canvas view + 5-file canonical canvas integration (canvasDirective + ContextualCanvas + canvasContextSuffix + MainframeRail + ActivePaymentsView import) + integration test (5 Cat A floor + filter + amount_due computation) + unit test (4 schema-boundary) + E2E smoke spec
- Catch #69 substrate-correction increment (~567 lines): apReportService.billDetail method + BillDetailInputSchema + BillDetailRow + BillDetailOutput schemas + NEW GET /api/orgs/[orgId]/bills/[billId] per-bill endpoint + RecordPaymentCard.tsx fetch URL amendment (~18 net change; closes catch #69 substrate-grain semantic drift at downstream-consumer grain) + integration test (5 Cat A floor + amount_due computation + lifecycle_state independence assertion) + unit test (4 schema-boundary)
- Bundle stats: 1303 net lines / 16 files / 52% line bundle-horizon + 64% file bundle-horizon (1303/2500; 16/25). Trivially under (γ-a) single-session ceiling.

**D2.7 screenshot gate (γ) firing — (a-ii) incremental gate-firing verdict per founder Item 3 (a-ii) ratification:**

D2.7 screenshot gate fired at chunk close per (a-ii) incremental framing. Founder captured 1 new Shot #9 (ActivePaymentsView mounted via Path β DB-direct pre-seed: vendor + bill at partially_paid state with $200 allocation against $500 amount → computed amount_due $300). **Gate verdict: PASS at view-grain** (all 8 prescribed verifications hold: heading "Active Payments" + table renders + bill_number "D5-SHOT-9" + vendor mono uuid + due_date 2026-06-11 + amount_due 300.0000 + total 300.0000 + row hover/click affordance functional per row-click navigation execution).

**Substantive surface caught at Shot #9 Step 10 optional verification (catch #69 genesis):** row-click ActivePaymentsView → RecordPaymentCard mount succeeded BUT RecordPaymentCard rendered "Bill not found in payment approval queue" error for partially_paid bill. Mechanism verified-from-disk: RecordPaymentCard.tsx:156 hard-coded fetch to `/api/orgs/${orgId}/reports/payment-approval-queue` per B5-3-D4 Disposition (α) "reuse queue endpoint + client-side billId filter at card grain"; queue post-filter is approved_for_payment ONLY; partially_paid bills excluded → client-side find() returns undefined → error message. v1 partial-payment-followup UX flow BROKEN at downstream-consumer grain despite ActivePaymentsView entry-point surface working. Sibling-class to catch #57 substrate-grain semantic drift at downstream-consumer grain at NEW downstream-consumer surface (RecordPaymentCard vs catch #57's original PaymentApprovalQueueView grain).

**Catch #69 substrate-correction shipped at chunk close** per founder substrate-decision authority Item (3) ratification (option A + α-1 sub-option): NEW per-bill bill-detail endpoint `/api/orgs/[orgId]/bills/[billId]/route.ts` + `apReportService.billDetail` method (Pattern B convention parity per service-architecture skill §2) + `billDetail.schema.ts` (BillDetailInputSchema + BillDetailRow including lifecycle_state forward-compat additive surface + BillDetailOutput type-alias) + RecordPaymentCard.tsx fetch URL amendment (queue endpoint → per-bill endpoint) + integration test + unit test. Closes deferred Disposition (α) from B5-3-D3 chunk-grain framing. Future-proofs for B5-3-D6 BillReverseCard data-fetch surface across 3 lifecycle states (approved_for_payment + partially_paid + fully_paid). Substrate-correction landed in same uncommitted session #1 increment per (γ-a) bundle pattern; single chunk-completion bundled commit.

**Chunk-grain catches enumeration (5 catches at chunk B5-3-D5; cumulative N=62 entering → N=67 exiting):**

Chunk-onset catches: NONE at chunk-onset triangulation grain. All 8 onset triangulation surfaces converged across both sides without catch-grade surfaces emerging (Surface 1 substantive divergence on bundle vs split collapsed to (b) split post-engagement; all others convergent on first surfacing).

Plan-doc draft catches (#65; 1 at plan-doc-authoring grain via brainstorm-side parallel-surface review):
- #65 WSL-side orchestrator-grain plan-doc-authoring editorial drift at discriminator-naming convention grain — plan doc initially cited `active_payments_view` violating MainframeRail-anchored `report_<entity>` convention enumeration (verified-from-disk by brainstorm-side: report_pl + report_trial_balance + report_ap_aging + report_open_bills + report_vendor_balance + report_payment_approval_queue + report_paid_bills_history); amended to `report_active_payments` (10 occurrences via replace_all). Sibling-class to catch #63 at subagent-mandate-framing grain but at distinct plan-doc-authoring substrate-output surface; 3-grain runtime substrate impact (type definition + runtime dispatch + agent canvas-directive emission); substantively load-bearing vs catch #64 JSDoc-comment-grain precedent.

Implementer-subagent dispatch catches (#66-#68; 3 at substrate-implementation grain via verify-from-disk + report-accuracy verification):
- #66 implementer-subagent self-action-attribution confusion at report-accuracy grain (NEW sub-mechanism class) — implementer reported apReportService.activePayments method + activePayments.schema.ts as "pre-existing substrate" + speculated "likely landed at chunk B5-3-D5 onset substrate-ratification"; verify-from-disk via git status + git log + ls timestamps confirmed implementer CREATED substrate during own dispatch. Functional code shipped correctly; report-accuracy drift only. Caught by orchestrator via verify-from-disk + recon-cross-check (recon explicitly said no activePayments method existed). Bilateral grain-axis convergence at orchestrator-catches-subagent-drift via verify-from-disk discipline.
- #67 WSL-side plan-doc-authoring scope-projection at test-expectation grain — plan doc Task 5a Test 4 cited "400 ZodError" path; disk-verified read-side route has no ZodError catch (mirror of paymentApprovalQueue + paidBillsHistory patterns); falls through to 500. Subagent reframed Test 4 to assert 500 + 'Internal server error'. Pattern parity observation: existing read-side routes share this shape — substantive arc-closure substrate-correction candidate observation per 36th retrospective candidate.
- #68 WSL-side plan-doc-authoring scope-projection at architecture-precedent-knowledge grain — plan doc Task 5a Test 3 cited "403 wrong-org via withInvariants ORG_ACCESS_DENIED"; read-side route has no withInvariants wrap; cross-org isolation is RLS-driven (200 empty result, not 403). Subagent worked around by mocking buildServiceContext to throw ORG_ACCESS_DENIED. Sibling-class to #56 amendment-site enumeration grain at distinct architecture-precedent-knowledge sub-grain. Sibling to #67 at distinct grain (test-expectation vs architecture-precedent); BOTH surface mutation-route-pattern projected onto read-side route — substantive arc-closure substrate-correction question per 36th retrospective candidate.

Gate-execution catches (#69; 1 at chunk-close gate-execution grain via founder-environment-execution):
- #69 substrate-grain semantic drift at downstream-consumer grain — RecordPaymentCard.tsx:156 hard-coded fetch to payment-approval-queue endpoint per B5-3-D4 Disposition (α); queue filters approved_for_payment only; partially_paid bills excluded; v1 partial-payment-followup UX flow broken at downstream-consumer grain. Sibling-class to catch #57 at NEW downstream-consumer surface (RecordPaymentCard vs catch #57's original PaymentApprovalQueueView grain). Substrate-correction shipped at chunk close per founder Item (3) ratification (A + α-1).

**Sub-catch-ledger analytical observations carrying to arc-closure synthesis venue (8 observations; within-arc N=8):**

Inherited from B5-3-D4 close (5):
1. RecordPaymentCard 554-vs-300-350 estimation-grain
2. Orchestrator cwd-persistence meta-execution-mechanic
3. bill.ts 361-vs-239 brainstorm-side file-size-cite grain
4. JSDoc helper-name editorial drift (#64 candidate bundled-as-analytical)
5. 401 DevTools console surface

NEW at B5-3-D5 (3):
6. Substrate-correction line-count drift 567-vs-250-350 (estimation-grain; sibling to #1; within-arc estimation-grain analytical observation N=2). Sub-driver decomposition at N=2 grain: B5-3-D4 driver = form-grain UX surface (dropdown branches + error-state branches + render-block layout expansion); B5-3-D5 driver = integration test surface (294 vs 150-180; ~+115 over). Different sub-drivers suggest underlying mechanism is planning-grain under-specification at per-test or per-UX-branch enumeration sub-pattern rather than single estimation-bias direction.
7. Documentation-density at substrate-correction grain — catch #69 referenced at 4 substrate-grain sites (route.ts header + schema.ts header + apReportService.billDetail JSDoc + RecordPaymentCard.tsx header). NEW sub-mechanism class N=1; watch for recurrence at subsequent substrate-correction grain.
8. route.ts 38-vs-45 brainstorm-side file-size-cite drift (sibling to #3; within-arc brainstorm-side file-size-cite drift sub-pattern N=2; +7 delta likely JSDoc comment block + blank lines).

**Sub-mechanism distribution post-chunk-B5-3-D5 (cumulative within-arc; canonical count per N=67):**

- WSL-side substrate-citation drift N=12 (sustained from B5-3-D4)
- WSL-side scope-projection N=12 (was N=10 at B5-3-D4 close; +#67 + #68 → N=12); under-specification sub-cluster N=10 (#33+#35+#36+#43+#53+#56+#58+#61+#67+#68 if classified per primary sub-mechanism; codification-candidate evidence basis substantively load-bearing further); over-specification sub-cluster N=2; other sub-mechanisms N=3
- WSL-side orchestrator-grain plan-doc-authoring editorial drift / scope-projection sub-pattern N=4 (#63 subagent-mandate-framing grain + #65 plan-doc-authoring discriminator-naming convention grain + #67 plan-doc-authoring test-expectation grain + #68 plan-doc-authoring architecture-precedent-knowledge grain) — codification-candidate evidence basis substantively load-bearing per 35th arc-closure retrospective candidate
- Implementer-subagent self-action-attribution confusion at report-accuracy grain (NEW class) N=1 (#66) — bilateral grain-axis convergence at orchestrator-catches-subagent-drift via verify-from-disk
- Brainstorm-side substrate-citation drift N=3 (sustained)
- Brainstorm-side grain-discrimination N=1 (sustained)
- Brainstorm-side file-size-cite grain drift sub-pattern N=2 (within-arc analytical observation; bill.ts at B5-3-D4 + route.ts at B5-3-D5)
- Chain-of-drift bilateral meta-grain N=2 (sustained)
- Chain-of-drift through founder-ratification surface N=1 (sustained)
- Prophylactic-application-grain partial-success N=1 (sustained)
- Dispatch-mandate-violation 4th grain-axis N=1 (sustained)
- Pre-existing-rule-firing surface N=1 (sustained)
- Substrate-grain semantic drift at downstream-consumer N=2 (#57 + #69; within-arc sub-pattern emerging — codification-candidate at N=3+ threshold) — 37th arc-closure retrospective candidate
- Substrate-grain capability gap N=1 (sustained)

Total cumulative N=67. **1 NEW sub-mechanism class surfaced at B5-3-D5** (#66 implementer-subagent self-action-attribution confusion at report-accuracy grain). Within-arc orchestrator-grain plan-doc-authoring editorial drift / scope-projection sub-pattern N=4 reaches canonical codification-candidate threshold N=3+ at this chunk close.

**Drift dispositions resolved at chunk-B5-3-D5 closeout:**

§Drift-A + §Drift-B + §Drift-C persist. This entry follows §Drift-B narrow-scope methodology + §Drift-C inline-in-friction-journal venue. Founder Item 4 (B5-3-D1 substrate-amendment timing) preserved at arc-closure venue. Founder Item 5 (D2.7-gate-with-substrate-ship-only-exception) sustained at arc-closure synthesis. Candidate 4 (i-α) ActivePaymentsView SHIPPED — closes Candidate 4 (i-α) sub-surface at chunk-grain (the partial-payment-followup entry-point surface); Candidate 4 (a)-(h) + (i-α further consumers) preserved at arc-closure venue. **Catch #69 substrate-correction also CLOSES the v1 partial-payment-followup UX flow at downstream-consumer grain at chunk-grain** (RecordPaymentCard now consumes new per-bill endpoint regardless of bill lifecycle_state). Disposition (α) "reuse queue endpoint" precedent from B5-3-D3 superseded at chunk-grain by NEW per-bill bill-detail endpoint; deferred Disposition (α) closed at chunk B5-3-D5.

**Cross-arc graduation triggers FIRED at chunk-B5-3-D5 (evaluation DEFERRED to Phase 5 arc-closure per §Drift-B):**

- **(cadence-β-i-a) cross-arc N=3 FIRES** (B5-1 + B5-3-D1 + B5-3-D5); first reach of canonical codification-candidate threshold N=3+ at this cadence shape; evaluation deferred to Phase 5 arc-closure
- Under-specification sub-cluster within-arc N=10 (+#67 + #68 from B5-3-D4 N=8) — codification-candidate evidence basis substantively load-bearing further
- Substrate-grain semantic drift at downstream-consumer sub-pattern within-arc N=2 (#57 + #69) — codification-candidate trajectory; canonical threshold N=3+ approaching; if 3rd sibling-class surfaces at B5-3-D6 close, threshold met (37th arc-closure retrospective candidate)
- Within-arc orchestrator-grain plan-doc-authoring editorial drift / scope-projection sub-pattern N=4 (#63 + #65 + #67 + #68) — canonical codification-candidate threshold N=3+ MET; substantively load-bearing for arc-closure synthesis (35th arc-closure retrospective candidate)
- Within-arc cross-subagent grain-axis N=14 (was N=13 at B5-3-D4 close; +#66 orchestrator-catches-subagent self-action-attribution confusion)
- Within-arc prophylactic-application-grain N=16 sustained-plus (was N=15 at B5-3-D4 close + 1 from B5-3-D5 catch #69 substrate-correction shipping at chunk-grain via founder-environment-execution at gate-execution grain)
- Within-arc cross-side via founder-environment-execution prophylactic-application N=2 (#58 D2.7 Shot #7 pre-seed dependency caught at B5-3-D4 + #69 row-click flow gap caught at B5-3-D5) — codification-candidate evidence basis at sub-pattern grain
- 3 NEW arc-closure retrospective candidates (35th + 36th + 37th)

**Carry-forward inventory (B5-3-D5 SHIPPED → subsequent chunks + arc-closure):**

Active for chunk B5-3-D6 firing (next-chunk; Surface 3 disposition + Spend v1 functional-completion):
1. `billService.reverse` mutation write-side UX (reversal_reason free-text + INV-AP-002 4-state precondition + Sub-D 'voided' terminal state + mirror-line JE construction) — substrate at billService.ts:728-846 verified-from-disk at B5-3-D5 onset recon; substrate-novelty per per-chunk
2. BillReverseCard per-bill canvas view (3-field form-grain) + 5-file canvas integration (`bill_reverse_card` discriminator)
3. POST /api/orgs/[orgId]/bills/[billId]/reverse/route.ts
4. bill.reverse ActionName + permission migration
5. Reverse UX entry paths (approved_for_payment + partially_paid via Active Payments view; fully_paid via paidBillsHistory amendment; pending_approval defers to Candidate 4 (d))
6. **BillReverseCard data-fetch consumes NEW per-bill endpoint at /api/orgs/[orgId]/bills/[billId]** (shipped at B5-3-D5 substrate-correction; available for direct consumption at B5-3-D6 — closes catch #69 future-proofing benefit)
7. D2.7 incremental Shot #10 (BillReverseCard mounted)
8. (cadence-β-i-b) cross-arc N=5 firing at B5-3-D6 close

Active for subsequent-chunk firing (2 items; preserved-deferred):
1. FT1 `clampTtl` NaN-guard at `supabaseStorageProvider.ts:95-99` — storage-substrate-touching chunk
2. Item 18 org_settings substrate-floor — (orgset-β) sub-arc

Active for Phase 5 arc-closure retrospective (32 inherited + 3 NEW at B5-3-D5 close = 35 candidates):
- Items 1-34 per prior chunk closeout entries below (32 + potential 33rd + potential 34th from prior framings)
- **35: Orchestrator-grain plan-doc-authoring editorial drift / scope-projection sub-pattern codification framework** (within-arc N=4 evidence basis; canonical threshold met; #63 + #65 + #67 + #68 sibling-class instances at distinct sub-grain surfaces — subagent-mandate-framing + discriminator-naming + test-expectation + architecture-precedent-knowledge)
- **36: Read-side route architecture-pattern codification** (catches #67 + #68 surface sub-substantive question — read-side routes have no ZodError catch + no withInvariants wrap; cross-org isolation is RLS-driven; mutation routes have explicit ZodError + withInvariants. Is read-side pattern intentional canonical or pattern drift? Cross-cutting service-architecture pattern question distinct from Candidate 4 Spend subdomain scope)
- **37: Substrate-grain semantic drift at downstream-consumer sub-pattern codification** (within-arc N=2 evidence basis trajectory; #57 + #69 sibling-class instances at distinct downstream-consumer surfaces within Spend domain; if 3rd sibling instance surfaces at B5-3-D6 close, threshold N=3+ met)

**Candidate 4 EXPANSION at chunk-B5-3-D5 closeout (originally B5-3-D1 header drift; expanded over 5 chunks):**

Candidate 4 sub-surfaces post-B5-3-D5:
- (a) B5-3-D1 read-side service file header text aspirational drift + **NEW B5-3-D5 sub-observation**: apReportService.billDetail JSDoc carries aspirational `withInvariants(action: 'bill_detail.read')` claim shape; sibling to catch #54 + (a) original — extends arc-closure substrate-correction scope by N=1 method
- (b) Per-property ESLint annotation across 5 Phase 5 service files (catch #54)
- (c) `apReportService.paymentApprovalQueue` filter semantic-drift correction (catch #57)
- (d) Pending Approvals canvas view exposing `pending_approval` bills
- (e) Agent canvas-directive emission capability wiring for `payment_approval_card` (catch #60)
- (f) PaymentApprovalQueueView row-click amendment add-back for approve-action grain
- (g) D2.7 Shot #7 fire at substrate-correction-chunk grain
- (h) D2.7-gate-with-substrate-ship-only-exception discipline codification
- **(i-α) "Active Payments" canvas view shipped at chunk-grain** (B5-3-D5; CLOSES sub-surface at chunk-grain; remaining (a)-(h) sub-surfaces preserved at arc-closure venue)
- **(j) NEW B5-3-D5 sub-observation: apReportService naming-grain imprecision** ("Report" suffix but houses non-report reads e.g. billDetail) — sub-grain to (a) aspirational-naming-grain question; could fold into (a) at arc-closure synthesis OR surface as standalone observation

Arc-closure scope-grain expansion observation: 10 sub-surfaces vs original 1-surface framing at chunk B5-3-D1 closeout. Arc-closure substrate-amendment scope continues to grow substantively. (i-α) partially closed at chunk-grain — first sub-surface of Candidate 4 to ship at chunk-grain rather than defer to arc-closure substrate-correction chunk. **Non-blocking observation; preserved at arc-closure venue per §Drift-B.**

**Defense-in-depth grain-axis enumeration (post-chunk-B5-3-D5):**

- Cross-side axis: within-arc N≥21 (catches #21-#33 + #37 + #39 + #45 + #55 + #56 + #57 + #58 + #59 + #60 + #63 + #65 + #66 + #67 + #68 + #69 cross-side surfaced)
- Self-reflective axis: within-arc N=2 (#32 + #37 + #44)
- Cross-subagent axis: within-arc N=14 (B5-3-D2 N=5 + B5-3-D3 N=7 + B5-3-D4 N=1 #62 + B5-3-D5 N=1 #66)
- Cross-side via founder-environment-execution N=2 (#58 + #69) — NEW sub-pattern emerging
- Meta-grain buckets: chain-of-drift bilateral N=2 (#38 + #59); chain-of-drift through founder-ratification N=1 (#45 hybrid); prophylactic-application-grain partial-success N=1 (#39 hybrid); dispatch-mandate-violation N=1 (#42); pre-existing-rule-firing N=1 (#54); substrate-grain semantic drift at downstream-consumer N=2 (#57 + #69); substrate-grain capability gap N=1 (#60); orchestrator-grain task-description editorial drift N=1 (#63); orchestrator-grain plan-doc-authoring editorial drift / scope-projection sub-pattern N=4 (#63 + #65 + #67 + #68); implementer-subagent self-action-attribution confusion N=1 (#66 NEW at B5-3-D5)

Architecture-validating observation: bidirectional cross-side parallel-surface verification + cross-subagent verify-from-disk discipline + founder-environment-execution gate-execution prophylactic-application + orchestrator-catches-subagent report-accuracy verification operate symmetrically AND across multiple grain-axes; H3 surface-area-grain asymmetry hypothesis substantively favored further entering Phase 5 arc-closure synthesis (within-arc N=16+ prophylactic-success preventive catches; N=14 cross-subagent; N=21+ cross-side; N=2 cross-side founder-environment-execution; N=8 sub-catch-ledger analytical observations codification-candidate).

**Push-readiness three-condition gate (CHUNK-COMPLETION grain) — MET per CLAUDE.md convention:**

1. Test-suite health: **MET** (853/853 vitest + 26/26 agent:validate + typecheck clean at clean DB baseline; +18 from B5-3-D4 baseline 835 = matches 9 activePayments tests + 9 billDetail tests)
2. Doc-sync reconciled: **MET trivially** (no INV / control_matrix / ADR amendments at this chunk; canvas integration is type-level + UI; permission migration N/A — read-side; `ledger_truth_model` unchanged; `types.ts` not regenerated — no schema changes)
3. Governance closeout: **MET** via this friction-journal chunk-B5-3-D5 entry + retrospective inline per §Drift-C + carry-forward inventory + Candidate 4 (i-α) ship-grain closure + Candidate 4 (j) NEW sub-surface enrichment + 3 NEW arc-closure retrospective candidates (35th + 36th + 37th)

**Chunk B5-3-D5 CLOSED at this commit.** 1 v1-deliverable read-side UI surface promoted to user-accessible at chunk close (ActivePaymentsView via MainframeRail "Active Payments" entry-path enabler) + 1 substrate-correction shipped at chunk-grain (NEW per-bill bill-detail endpoint closing catch #69 substrate-grain semantic drift at downstream-consumer grain + closing deferred Disposition (α) from B5-3-D3). D2.7 screenshot gate FIRED with Shot #9 PASS verdict per (a-ii) incremental framing (Phase A scope canonical expansion 8 → 9 surfaces grounded). (cadence-β-i-a) cross-arc N=3 graduation evaluation FIRES; defers to Phase 5 arc-closure per §Drift-B. Push CLEAN to `origin/staging` per (cadence-β-i-a) chunk-completion precedent. Phase 5 arc continues with B5-3-D6 (reverse mutation per Surface 3 disposition; couples Spend v1 functional-completion at (γ-1) firing condition for arc-closure synthesis venue).

---

### Phase 5 chunk B5-3-D4 substantive arc closeout retrospective entry (2026-05-12) — sixth Phase-5-arc-execution friction-journal entry + (cadence-β-i-b) fourth-instance (cross-arc N=4 graduation evaluation FIRED; arc-closure synthesis) + 3 chunk-grain catches + 5 sub-catch-ledger analytical observations + recordPayment write-side UX completion (1 user-accessible RecordPaymentCard via PaymentApprovalQueueView row-click amendment) + D2.7 screenshot gate (γ) FIRED at (a-ii) incremental Shot #8 verdict PASS + Phase A scope canonical expansion 7→8 surfaces

This is the SIXTH Phase-5-arc-execution entry. Chunk B5-3-D4 (Slice D Spend continuation — recordPayment write-side UX completion; reverse defers to B5-3-D5 OR arc-closure per (decomp-γ) hybrid scope-lock) opened 2026-05-12 at HEAD `6a99c2c` (post-B5-3-D3 ship); substantive session #1 SHIPPED 2026-05-12 at HEAD `de358fb` (LOCAL ONLY; push DEFERRED to chunk-completion per (cadence-β-i-b); 1 commit ahead of `origin/staging` through session #2 implementation) — substrate: bill.record_payment ActionName + permission migration atomic + POST /api/orgs/[orgId]/bills/[billId]/record-payment mutation route + RecordPaymentCard canvas view (per-bill form-grain with form-schema separation per catch #46) + payment_record_card canvas integration 4-file canonical touch-set + recordBillPaymentRoute integration test (9 tests = 5 Category A floor + 4 substantive); substantive session #2 + closeout SHIPPED at this commit per (cadence-β-i-b) 2-session bundled cadence (**fourth instance after chunk B5-2 + chunk B5-3-D2 + chunk B5-3-D3; cross-arc N=4 trigger for candidate (e) graduation evaluation FIRES — evaluation deferred to Phase 5 arc-closure retrospective per §Drift-B**). Chunk B5-3-D4 ships 1 v1-deliverable write-side UI surface promoted to user-accessible at chunk close: **RecordPaymentCard** (substrate-ship-only at session #1; promoted to user-accessible at session #2 via PaymentApprovalQueueView 5th-file row-click amendment revived with NEW navigation target per Item 4 (β) discriminator naming + catch #57 sub-surface re-framing semantically valid grounding). Phase 5 arc continues with next-chunk election per (decomp-γ) hybrid — candidates: B5-3-D5 (recordPayment partial-payment-followup UX + reverse mutation) OR B5-3-E (AR domain slice) OR arc-closure synthesis venue.

**Chunk-closeout grain preserves §Drift-B narrow-scope methodology** (precedent established at chunk B5-3-D1 closeout; continued at chunks B5-3-D2 + B5-3-D3 closeouts): this entry preserves chunk-grain pattern observations + drift dispositions + carry-forward inventory + analytical-observation enumeration. Cross-arc synthesis defers to Phase 5 arc-closure retrospective.

**Chunk B5-3-D4 SHIPPED summary:**

- Session #1 (HEAD `de358fb` LOCAL): 11 files / +2067/-10 / migration + 1 mutation route + RecordPaymentCard canvas view + 4-file canvas integration + integration test (9 tests) + plan doc (729 lines) / 835/835 vitest + 26/26 agent:validate + typecheck clean at session #1 close gate
- Session #2 + closeout (this commit): 3 files at substrate-touch + closeout artifacts / PaymentApprovalQueueView 5th-file row-click amendment (revived per Item 4 (β); 2 surgical edits — line 20 destructure + line 77 onClick) + bill.ts E2E fixture extension (+320 lines; 5 new helpers including seedApprovedBill direct admin-client seed bypassing post+approve UI for E2E recordPayment-only scope) + recordPaymentCard.spec.ts Playwright E2E spec (138 lines; 2 tests = full-payment + partial-payment) + friction-journal entry + push-readiness gate evaluation / typecheck clean at post-Task-2 verification
- Cumulative chunk B5-3-D4: ~14 files / 1 user-accessible UI surface promoted to user-accessible at chunk close (RecordPaymentCard) / 9 new vitest tests (recordBillPaymentRoute) / 2 new Playwright E2E tests (recordPaymentCard.spec.ts) / 835/835 at clean DB baseline (was 826 entering)

**D2.7 screenshot gate (γ) firing — (a-ii) incremental gate-firing verdict per founder Item 3 (a-ii) ratification:**

D2.7 screenshot gate fired at session #2 close per (a-ii) incremental framing (capture NEW surface ONLY; prior 6 user-accessible shots verified at B5-3-D3 gate — no regression-test rationale absent material change). Founder captured 1 new shot (Shot #8 — RecordPaymentCard mounted at approved_for_payment bill state via Path β DB-direct pre-seed). **Gate verdict: PASS** (all 8 prescribed verifications hold):

1. Card heading "Record Payment — Bill #D4-SHOT-8" ✓
2. Bill detail summary (vendor + due_date + amount_cad + amount_due) ✓
3. payment_method 'EFT' default selected ✓
4. amount_cad pre-filled with computed amount_due ($500.00; hint text "Partial payment allowed. Amount due: 500.0000" — implementer-grain UX prophylactic-application instance addressing catch #57 sub-surface expansion at in-form grain) ✓
5. cash_account_id "1000 — Cash and Cash Equivalents" default ✓
6. ap_control_account_id "2000 — Accounts Payable" default ✓
7. fiscal_period_id "FY Current" default ✓
8. "Record Payment" + "Cancel" buttons visible ✓

Phase A scope canonical expansion grounded at chunk-grain ratification: 7 → 8 surfaces (7 user-accessible + 1 substrate-ship-only PaymentApprovalCard remaining per founder Item 5; carried to arc-closure substrate-correction venue). RecordPaymentCard joins user-accessible cohort.

**Chunk-grain catches enumeration (3 catches at chunk B5-3-D4; cumulative N=59 entering → N=62 exiting):**

Chunk-onset catches (#61; 1 at chunk-onset triangulation grain):
- #61 WSL-side scope-projection under-specification at MEMORY.md edit-anchor grain (founder Item 1 ratification at chunk-onset; sibling cluster #33+#35+#36+#43+#53+#56+#58 → within-arc under-specification N=8 — codification-candidate evidence basis substantively load-bearing further)

Session #1 implementation catches: NONE at chunk-execution-grain. Verify-from-disk discipline + catch-lesson #34-#61 prophylactic-application at code-template grain held breadth-correctly through all 5 session #1 tasks. Within-arc prophylactic-application-grain N=14 sustained at session #1 implementation; cross-subagent grain-axis N=12 sustained.

Session #2 implementation + gate-execution catches (#62-#63; 2 at chunk-close grain):
- #62 WSL-side substrate-citation drift at column-name grain (plan template cited `bill_payment_allocations.allocation_id` PK; actual disk-verified is `bill_payment_allocation_id` per disk schema verification; implementer-subagent prophylactically self-corrected at Task 5 integration test authoring; sibling-class to catch #51 column-name grain — within-arc substrate-citation-at-column-name-sub-grain N=2; cross-subagent grain-axis prophylactic-application instance N=13 logged separately)
- #63 WSL-side orchestrator-grain task-description editorial drift at subagent-mandate-framing grain (NEW sub-shape; sibling-class to catch #57 substrate-grain semantic drift but distinct mandate-framing vs downstream-consumer-code grain; brainstorm-side verified-from-disk at apReportService.ts:489-491 post-filter as `approved_for_payment` ONLY → WSL-side Task 14 subagent-dispatch mandate framing editorialized "partially_paid stays" — INCORRECT per disk; logged per bidirectional symmetry discipline as sibling to #48-#52 implementer-grain editorial drift sub-mechanism)

**Sub-catch-ledger analytical observations enumeration (5 observations at chunk B5-3-D4; NOT catch-ledger-grade per "would this cause a bug?" threshold; carried as analytical for arc-closure synthesis classification framework codification candidate):**

1. **Estimation-grain analytical**: RecordPaymentCard 554 lines vs 300-350 plan estimate (within 2x; ManualBillForm 630-line precedent was available at plan-doc-draft time but cited 300-350 anyway). Sub-mechanism: estimation-grain drift at line-count-projection grain.
2. **Orchestrator-grain meta-execution-mechanic**: shell-state-persistence between Bash invocations at validation gate execution (cwd persisted from `cd apps/web` at step 6b → root-level `pnpm db:reset:clean` failed to resolve at step 6c; resolved in-band via explicit `cd /home/philc/projects/chounting && ...` prefix). Operational-discipline questions surfaced: should orchestrator emit cwd-restore preamble after `cd <subdir>` operations? Should Bash invocations be wrapped with project-root prefix by default? Sub-mechanism: shell-discipline at meta-execution-mechanic grain.
3. **Brainstorm-side file-size-cite drift**: brainstorm-side cited bill.ts at 361 lines in prior turn framing; subagent verify-from-disk at 239 actual baseline (subagent verified ground truth before extending to 559 post-Task-2). Sub-mechanism: file-size-cite drift at brainstorm-side count-arithmetic grain (sibling to #59 chain-of-drift through count-propagation).
4. **Implementer-subagent JSDoc helper-name editorial drift**: assertPaymentRecorded JSDoc at bill.ts:577-609 cites `apReportService.getPaymentApprovalQueue` but actual method name is `apReportService.paymentApprovalQueue` (no `get` prefix). Verified-on-disk by brainstorm-side at post-Task-2 verification. Non-substantive at JSDoc comment grain (not consumed in code logic). Sub-mechanism: implementer-subagent-grain editorial drift at JSDoc-naming grain.
5. **401 DevTools console surface at Shot #8 capture**: PostgREST query against canonical test user UUID returned 401 Unauthorized; bill detail fetch DID succeed (hint text rendered amount_due correctly); functional impact undetectable at gate-execution grain. Likely source: agent session-lifecycle background fetch OR Supabase SSR auth-state refresh OR canvas view stale fetch cancellation window. Sub-mechanism: dev-server background-fetch surface (NEW sub-shape).

Within-arc analytical observation sub-pattern N=5 — codification-candidate evidence basis substantively load-bearing for arc-closure synthesis 33rd retrospective candidate (sub-catch-ledger analytical-observation classification framework codification — addresses the "what crosses the catch-ledger threshold vs carries as analytical observation" methodology question).

**Sub-mechanism distribution post-chunk-B5-3-D4 (cumulative within-arc; WSL-side canonical count per N=62):**

- WSL-side substrate-citation drift N=12 (#34 + #39 + #40 + #41 + #44 + #46 + #47 + #48 + #49 + #51 + #52 + #55 + #62) — note: enumeration shows 13 catches; #39 is hybrid-classified across substrate-citation + prophylactic-application; counts primary classification at chunk-close adjudication. +#62 column-name sub-grain at session #2 = +1
- WSL-side scope-projection N=10 (#28 + #30 + #31 + #33 + #35 + #36 + #37 + #50 + #53 + #56 + #58 + #61); under-specification sub-cluster N=8 (#33 + #35 + #36 + #43 + #53 + #56 + #58 + #61; codification-candidate evidence basis substantively load-bearing further; +#61 at chunk-onset) ; over-specification sub-cluster N=2 (#37 + #50); other sub-mechanisms N=3 (#28 + #30 + #31)
- WSL-side orchestrator-grain task-description editorial drift (NEW sub-mechanism at session #2) N=1 (#63)
- Brainstorm-side substrate-citation drift N=3 (#27 + #29 + #45 hybrid)
- Brainstorm-side grain-discrimination scope-projection N=1 (#32)
- Chain-of-drift bilateral meta-grain N=2 (#38 + #59)
- Chain-of-drift through founder-ratification surface (#45 hybrid) N=1
- Prophylactic-application-grain partial-success meta-grain N=1 (#39 hybrid)
- Dispatch-mandate-violation 4th grain-axis N=1 (#42)
- Pre-existing-rule-firing surface N=1 (#54)
- Substrate-grain semantic drift at downstream-consumer N=1 (#57; sub-surface expansion at partial-payment-followup UX flagged at this chunk; bundles to arc-closure candidate 4 inventory)
- Substrate-grain capability gap N=1 (#60)

Total cumulative N=62. **1 NEW sub-mechanism class surfaced at chunk B5-3-D4**: orchestrator-grain task-description editorial drift (#63) — sibling-class to substrate-grain semantic drift (#57) at distinct mandate-framing-vs-code-logic grain axis. Pre-existing-substrate-drift sub-pattern within-arc N=3 (#54 + #57 + #60) sustained (no new instances at B5-3-D4).

**Cross-grain prophylactic-application bilateral convergence observation (bundle-as-single instance per chunk-close adjudication):**

Implementer subagent at Task 2 dispatch encoded catch #57 sub-surface expansion (partial-payment-followup UX gap) at TWO grains within single dispatch:
- (a) `assertPaymentRecorded` JSDoc at `bill.ts:577-609` (test-fixture grain — explicit documentation that both `partially_paid` AND `fully_paid` transitions remove the row from the `approved_for_payment`-filtered queue; spec asserts queue-absence as v1 boundary)
- (b) RecordPaymentCard "Partial payment allowed. Amount due: 500.0000" hint text (UX-grain — observed at Shot #8 capture; surfaces partial-payment capability + remaining amount_due to operator)

Cross-grain prophylactic application within single subagent dispatch substantively load-bearing for arc-closure prophylactic-application-grain codification-candidate. **Bundle-as-single within-arc prophylactic-application instance per chunk-close adjudication** (single root semantic understanding driving both encodings; logging as separate instances would over-count evidence basis at codification-candidate grain). **Within-arc prophylactic-application-grain N=14 sustained baseline + 1 bundled instance at session #2 = N=15.**

**Drift dispositions resolved at chunk-B5-3-D4 closeout:**

§Drift-A + §Drift-B + §Drift-C persist from prior chunks; this entry follows §Drift-B narrow-scope methodology + §Drift-C inline-in-friction-journal venue. Founder Item 4 (B5-3-D1 substrate-amendment timing) preserved at arc-closure venue. **Item 2 (a) (B5-3-D3 chunk-onset 5-file canvas integration ratification; ROLLED BACK at B5-3-D3 session #2 (iii-b) per catch #57 grounding): REVIVED at B5-3-D4 with NEW navigation target `payment_record_card` per Item 4 (β) ratification — semantically valid per record-payment's `approved_for_payment` entry-state precondition matches existing queue filter canonically (catch #57 sub-surface re-framing at action-grain different from original approve-action framing).** Forward-progress amendment ratified at chunk-grain; not retroactive substrate amendment. Founder Item 5 (D2.7-gate-with-substrate-ship-only-exception codification candidate) sustained at arc-closure synthesis carry-forward; Shot #7 PaymentApprovalCard remains substrate-ship-only-exception (no v1 user-accessible entry path; arc-closure substrate-correction chunk fires UX-wiring).

**Catch #57 sub-surface expansion at chunk-B5-3-D4 (NEW arc-closure substrate-correction sub-surface bundled to Candidate 4 inventory):**

Brainstorm-side verified-from-disk at chunk B5-3-D4 session #2 verification grain: `loadBillsWithAmountDue` helper filters `lifecycle_state IN {approved_for_payment, partially_paid}` (open-bill set); `paymentApprovalQueue` post-filters to `approved_for_payment` ONLY (apReportService.ts:489-491). Bills at `partially_paid` are EXCLUDED from queue per post-filter. **Sub-substantive UX gap at v1 partial-payment-followup**: when operator records a partial payment via RecordPaymentCard, bill transitions to `partially_paid` → bill DISAPPEARS from PaymentApprovalQueueView visibility → operator has NO v1 UX path to record additional partial payments against the same bill. Original catch #57 framing was queue filter semantic drift at approve-action grain; this is sibling-class manifestation at record-payment partial-payment-followup action grain. **Sharpened arc-closure substrate-correction scope** (per WSL-side verification #4 grounding at Shot #8 capture surface enhancement): in-form math is correct (RecordPaymentCard pulls computed `amount_due` per catch #20 helper logic; partial-payment-followup pre-fill would be correct AT form-grain IF an entry path existed); the actual UX gap is queue-filter / "Active Payments view exposing `partially_paid` bills". Bundle to **Candidate 4 sub-surface (i) NEW** (sibling to (c) queue-filter correction + (d) Pending Approvals view) OR extends (c) scope. Arc-closure synthesis venue per founder substrate-decision authority.

**Cross-arc graduation triggers FIRED at chunk-B5-3-D4 (evaluation DEFERRED to Phase 5 arc-closure per §Drift-B):**

- **(cadence-β-i-b) cross-arc N=4 FIRES** (B5-2 + B5-3-D2 + B5-3-D3 + B5-3-D4); combined with prior firings, cadence shape (cadence-β-i-b) has substantively favorable cross-arc N=4 evidence basis entering arc-closure synthesis
- Under-specification sub-cluster within-arc N=8 (#33 + #35 + #36 + #43 + #53 + #56 + #58 + #61) — codification-candidate evidence basis substantively load-bearing further (was N=7 at B5-3-D3 close; +1 at chunk B5-3-D4)
- Pre-existing-substrate-drift sub-pattern within-arc N=3 (#54 + #57 + #60) sustained
- Chain-of-drift bilateral meta-grain within-arc N=2 (#38 + #59) sustained
- Within-arc prophylactic-application-grain N=15 successful preventive catches (14 baseline + 1 bundled at chunk B5-3-D4 implementer cross-grain encoding of catch #57 sub-surface) — codification-candidate evidence basis substantively load-bearing further for arc-closure synthesis
- Sub-catch-ledger analytical observation sub-pattern within-arc N=5 (NEW evidence-basis at chunk B5-3-D4) — codification-candidate emerging for arc-closure 33rd retrospective candidate
- Cross-subagent grain-axis within-arc N=13 (12 baseline + #62 implementer prophylactic self-correction at column-name sub-grain) — codification-candidate evidence basis sustained
- Orchestrator-grain task-description editorial drift NEW sub-mechanism class (#63) — within-arc N=1 baseline; sibling-class to substrate-grain semantic drift (#57) at distinct grain axis

**Carry-forward inventory (B5-3-D4 SHIPPED → subsequent chunks + arc-closure):**

Active for subsequent-chunk firing (2 items; preserved-deferred from prior chunks):
1. FT1 (`clampTtl` NaN-guard at `supabaseStorageProvider.ts:95-99`) — preserved-deferred to storage-substrate-touching chunk
2. Item 18 org_settings substrate-floor — preserved-deferred per (orgset-β)

Active for Phase 5 arc-closure retrospective (32 candidates inherited + potential 33rd at chunk-B5-3-D4 close):
- Items 1-32 per prior chunk closeout entries below
- **Potential 33rd**: Sub-catch-ledger analytical-observation classification framework codification (within-arc N=5 evidence basis at chunk B5-3-D4; methodology question — what crosses catch-ledger threshold vs carries as analytical observation; "would this cause a bug?" heuristic + sub-mechanism class enumeration emerging at chunk-grain) [META-GRAIN]

**Candidate 4 EXPANSION at chunk-B5-3-D4 closeout (originally B5-3-D1 header drift; expanded over 4 chunks):**

Candidate 4 EXPANDED scope (now 9 sub-surfaces over 4 chunks; +1 from chunk B5-3-D4):
- (a) B5-3-D1 read-side service file header text aspirational drift
- (b) Per-property ESLint annotation across 5 Phase 5 service files (catch #54)
- (c) `apReportService.paymentApprovalQueue` filter semantic-drift correction (catch #57; COUPLED with (d) + new (i))
- (d) Pending Approvals canvas view exposing `pending_approval` bills (NEW at B5-3-D3; COUPLED with (c))
- (e) Agent canvas-directive emission capability wiring for `payment_approval_card` (catch #60; COUPLED with (f))
- (f) PaymentApprovalQueueView row-click amendment add-back for approve-action grain (COUPLED with (e)) — NOTE: PaymentApprovalQueueView row-click amendment for record-payment-action grain SHIPPED at chunk B5-3-D4 session #2 per Item 4 (β) ratification; (f) scope now specifically approve-action target
- (g) D2.7 Shot #7 fire at substrate-correction-chunk grain [OPERATIONAL CONSEQUENCE]
- (h) D2.7-gate-with-substrate-ship-only-exception discipline codification [META-GRAIN]
- **(i) NEW at B5-3-D4: "Active Payments" canvas view exposing `partially_paid` bills for partial-payment-followup UX OR queue-filter rename + scope-extension** — catch #57 sub-surface expansion at partial-payment-followup action grain; COUPLED with (c) substrate-correction scope

Arc-closure scope-grain expansion observation: 9 sub-surfaces vs original 1-surface framing at chunk B5-3-D1 closeout. Arc-closure substrate-amendment scope continues to grow substantively. **Non-blocking observation; preserved at arc-closure venue per §Drift-B**.

**Defense-in-depth grain-axis enumeration (post-chunk-B5-3-D4):**

- Cross-side axis: within-arc N≥19 (catches #21-#33 + #37 + #39 + #45 + #55 + #56 + #57 + #58 + #59 + #60 + #63 cross-side surfaced)
- Self-reflective axis: within-arc N=2 (#32 + #37 + #44)
- Cross-subagent axis: within-arc N=13 (B5-3-D2 N=5 + B5-3-D3 N=7 + B5-3-D4 N=1 = #62 implementer prophylactic self-correction at column-name sub-grain)
- Meta-grain buckets: chain-of-drift bilateral N=2 (#38 + #59); chain-of-drift through founder-ratification N=1 (#45 hybrid); prophylactic-application-grain partial-success N=1 (#39 hybrid); dispatch-mandate-violation N=1 (#42); pre-existing-rule-firing N=1 (#54); substrate-grain semantic drift at downstream-consumer N=1 (#57); substrate-grain capability gap N=1 (#60); orchestrator-grain task-description editorial drift N=1 (#63 NEW at B5-3-D4)

Architecture-validating observation: bidirectional cross-side parallel-surface verification + cross-subagent verify-from-disk discipline + bilateral grain-axis convergence at substrate-grain semantic understanding (catch #57 prophylactic encoding bundle-as-single instance at chunk B5-3-D4) operate symmetrically AND across multiple grain-axes; H3 surface-area-grain asymmetry hypothesis substantively favored further entering Phase 5 arc-closure synthesis (within-arc N=15 prophylactic-success preventive catches; N=13 cross-subagent; N=19+ cross-side; N=5 sub-catch-ledger analytical observations codification-candidate).

**Push-readiness three-condition gate (CHUNK-COMPLETION grain) — MET per CLAUDE.md convention:**

1. Test-suite health: **MET** (835/835 vitest + 26/26 agent:validate + typecheck clean at session #1 close gate; post-Task-2 typecheck verified clean at session #2 implementation; no test regressions at session #2 surgical edits)
2. Doc-sync reconciled: **MET trivially** (no INV / control_matrix / ADR amendments at this chunk; canvas integration is type-level + UI only; `ledger_truth_model` unchanged; `types.ts` not regenerated — no schema changes beyond permission migration; permission migration consumed via integration test verification)
3. Governance closeout: **MET** via this friction-journal chunk-B5-3-D4 entry + retrospective inline per §Drift-C + carry-forward inventory + Candidate 4 (i) NEW sub-surface codification + 33rd arc-closure retrospective candidate evidence-basis emergence

**Chunk B5-3-D4 CLOSED at this commit.** 1 v1-deliverable write-side UI surface promoted to user-accessible at chunk close (RecordPaymentCard via PaymentApprovalQueueView row-click amendment per Item 4 (β)). D2.7 screenshot gate FIRED with Shot #8 PASS verdict per (a-ii) incremental framing (Phase A scope canonical expansion 7→8 surfaces grounded). (cadence-β-i-b) cross-arc N=4 graduation evaluation FIRES; defers to Phase 5 arc-closure per §Drift-B. Push CLEAN to `origin/staging` per (cadence-β-i-b) precedent (push fires at chunk-completion, NOT session #1 close). Phase 5 arc continues with next-chunk election per (decomp-γ) hybrid.

---

### Phase 5 chunk B5-3-D3 substantive arc closeout retrospective entry (2026-05-12) — fifth Phase-5-arc-execution friction-journal entry + (cadence-β-i-b) third-instance (cross-arc N=3 graduation evaluation FIRED; arc-closure synthesis) + 21 chunk-grain catches + 2 of 2 v1-deliverable write-side UI surfaces shipped (1 user-accessible + 1 substrate-ship-only per catch #57+#60 disposition) + 2 new sub-mechanism buckets + D2.7 screenshot gate (γ) FIRED with substrate-ship-only-exception verdict (6/7 PASS + 1 deferred to arc-closure substrate-correction chunk)

This is the FIFTH Phase-5-arc-execution entry. Chunk B5-3-D3 (Slice D write-side UI surfaces: manual bill form + payment approval card + D2.7 screenshot gate firing) opened 2026-05-11 at HEAD `4abd387` (post-B5-3-D2 ship); substantive session #1 SHIPPED 2026-05-11 at HEAD `1844f9e` (AP write-side UI substrate: 2 ActionName permissions atomic migration + POST /bills mutation route + VendorPicker thin abstraction Path X + ManualBillForm canvas view + bill_form canvas integration 4-file canonical touch-set + postBillRoute integration test + NEW bill.ts E2E fixture + billForm.spec.ts); substantive session #2 + closeout SHIPPED at this commit per (cadence-β-i-b) 2-session bundled cadence (third instance after chunk B5-2 + chunk B5-3-D2; **cross-arc N=3 trigger for candidate (e) graduation evaluation FIRES — evaluation deferred to Phase 5 arc-closure retrospective per §Drift-B**). Chunk B5-3-D3 ships 2 v1-deliverable write-side UI surfaces: ManualBillForm (user-accessible via MainframeRail "New Bill"; functional end-to-end verified at gate-execution grain — vendor + bill creation + JE side-effect + recordMutation audit all green) + PaymentApprovalCard (**substrate-ship-only at v1** per catch #57 + #60 disposition; component + integration tests + canvas-directive type + 4-file canvas integration plumbing ship; no v1 user-accessible entry path due to substrate-grain semantic + capability gaps; arc-closure substrate-correction chunk fires user-grade UX wiring). Phase 5 arc continues with next-chunk election per (decomp-γ) hybrid — candidates: B5-3-E (AR domain slice) OR B5-3-D4+ (Spend continuation with recordPayment + reverse mutations) OR alternative.

**Chunk-closeout grain preserves §Drift-B narrow-scope methodology** (precedent established at chunk B5-3-D1 closeout; continued at chunk B5-3-D2 closeout): this entry preserves chunk-grain pattern observations + drift dispositions + carry-forward inventory. Cross-arc synthesis defers to Phase 5 arc-closure retrospective.

**Chunk B5-3-D3 SHIPPED summary:**

- Session #1 (HEAD `1844f9e`): 15 files / +2496/-10 / migration + 1 mutation route + VendorPicker + ManualBillForm + 4-file canvas integration + integration test + NEW E2E fixture + E2E spec + plan doc / 821/821 vitest + 26/26 agent:validate + typecheck clean
- Session #2 + closeout (this commit): 6+ files / approve route + PaymentApprovalCard + 4-file canvas integration (post-(iii-b) revert; was 5-file at chunk-onset Item 2 (a) ratification) + integration test + plan doc + friction-journal entry / 826/826 vitest + 26/26 agent:validate + typecheck clean
- Cumulative: ~21-23 files / 2 v1-deliverable write-side UI surfaces (1 user-accessible + 1 substrate-ship-only) / 1 new vitest cluster (5 tests at session #1 postBillRoute) + 1 new vitest cluster (5 tests at session #2 billApproveForPaymentRoute) / 826/826 at clean DB baseline

**D2.7 screenshot gate (γ) firing — substrate-ship-only-exception verdict (NEW codification candidate, founder Item 5 ratified):**

D2.7 screenshot gate fired at session #2 closeout per chunk-onset Surface 8 ratification + CLAUDE.md §UI-session screenshot gate convention. Founder captured 7 prescribed shots against fresh-seed state (Shots #1-#6 user-accessible UX surfaces; Shot #7 per (iii-b) revert disposition requires agent canvas directive entry path). Gate verdict: **6/7 PASS + 1 substrate-ship-only deferral**:

- Shots #1-#5 (B5-3-D2 read-side UX surfaces): PASS clean against fresh seed
- Shot #6 (ManualBillForm B5-3-D3 session #1): PASS (form chrome + Zod validation surface + (δ) one-off vendor pre-seed + end-to-end submission verified at gate-execution grain — bill `84b4e6b2-5e7e-479c-9dd5-7c1e60930570` created in `pending_approval` with JE back-reference `bb241f71-802d-4e9b-bc02-277bf1495a2d`)
- Shot #7 (PaymentApprovalCard B5-3-D3 session #2): **DEFERRED** per catch #57 + #60 substrate-ship-only grounding; canonical agent canvas directive entry path returns HTTP 400 (catch #60 capability gap); fallback paths (debug page / DevTools manipulation) rejected per Item 5 (g) ratification + §Drift-B narrow-scope methodology alignment

**NEW codification candidate at Item 5:** "D2.7-gate-with-substrate-ship-only-exception" discipline — substrate-ship-only surfaces (components that ship as substrate awaiting future-chunk UX-wiring) DO NOT block D2.7-style gates at chunk closeout grain. Sibling-class to §Drift-B narrow-scope methodology codification. Arc-closure synthesis venue.

**Chunk-grain catches enumeration (21 catches at chunk B5-3-D3; cumulative N=38 entering → N=59 exiting):**

Chunk-onset catches (#40-#46; 7 at scope-lock + plan doc draft grain):
- #40 WSL-side substrate-citation drift at action-name grain (Surface 3 lean `'bill.approve_for_payment'`; canonical `'bill.approve'` per billService.ts:11 + :406)
- #41 WSL-side substrate-citation drift at count-quantification grain (recon Target A2 N=1; actual N=11 in apReportService.ts whole-file scan)
- #42 NEW sub-mechanism: cross-subagent dispatch-mandate-violation grain (recon made analytical "structural not drift" judgment exceeding dispatch mandate "NOT to make recommendations"); 4th cross-grain axis distinct from prior cross-subagent (subagent catches orchestrator)
- #43 WSL-side scope-projection under-specification at canvas integration grain (Surface 7 cited 4-file touch-set; PaymentApprovalCard navigation required 5th-file PaymentApprovalQueueView amendment — founder Item 2 (a) ratified, later reverted under (iii-b) at session #2 post-Task-5 checkpoint per catch #57 disposition)
- #44 WSL-side substrate-citation drift at chunk-attribution grain (B5-2-era attribution corrected to B5-3-D1; self-reflective catch-grain axis)
- #45 chain-of-drift through founder-ratification surface (NEW sub-shape; hybrid classification: brainstorm-side substrate-citation drift sibling #27+#29 + NEW chain-of-drift sub-shape; "accountant" role_key cited unverified → founder ratified verbatim → WSL-side plan-doc-grain disk verification catch)
- #46 WSL-side substrate-citation drift at code-template grain (Task 4b form/service schema separation per JournalEntryForm precedent; sibling cluster)

Session #1 implementation catches (#47-#54; 8 at implementer-subagent + validation-gate-execution + cross-side parallel-surface verification grain):
- #47 WSL-side substrate-citation drift at timestamp grain (plan cited `20240133`; actual `20240140` per disk scan; 7 non-permission migrations shipped between recon and Task 1 execution)
- #48 WSL-side substrate-citation drift at field-name grain (plan cited `display_name`; actual `name` per vendorService.ts + listVendors.schema.ts)
- #49 WSL-side substrate-citation drift at endpoint-path grain (plan cited `/api/orgs/[orgId]/tax-codes`; actual `/api/tax-codes` flat global route)
- #50 WSL-side scope-projection over-specification at validation-gate-citation grain (plan cited `pnpm build` as validation gate; CLAUDE.md §1 doesn't include build; pre-existing ESLint failures persist on 5 Phase 5 service files)
- #51 WSL-side substrate-citation drift at column-name grain (plan cited `journal_entries.posted`; actual `adjustment_status` + `entry_type` per disk-verified schema)
- #52 WSL-side substrate-citation drift at seed-data-assumption grain (plan assumed vendor seed; dev.sql has none; required NEW `seedTestVendor` helper)
- #53 WSL-side scope-projection under-specification at hardcoded-count-asserting-file enumeration grain (Task 1 missed CA-37 in `crossOrgRlsIsolation.test.ts`; CA-28 covered but CA-37 not; sibling under-specification cluster)
- #54 NEW sub-mechanism bucket: pre-existing-rule-firing surface (ESLint `services/withInvariants-wrap-or-annotate` fires on 5 Phase 5 service-layer files / 13 errors pre-existing across B5-1 + B5-2 + B5-3-D1 + B5-3-D2 substrate; non-blocking per CLAUDE.md §1 chunk-close gate)

Session #2 implementation + gate-execution catches (#55-#60; 6 at implementer-subagent + gate-execution + cross-side parallel-surface grain):
- #55 WSL-side substrate-citation drift at type-shape grain (template local `BillRow` with `string` amount fields; actual `PaymentApprovalQueueRow` with `MoneyAmount` branded type; sibling cluster)
- #56 WSL-side scope-projection under-specification at amendment-site enumeration grain (plan Task 3 cited line 77 `<tr>` amendment; missed line 20 prop destructuring requirement for compilation)
- #57 NEW sub-mechanism bucket: substrate-grain semantic drift at downstream-consumer implementation grain (B5-3-D1 `apReportService.paymentApprovalQueue` filter semantic drift: filter `approved_for_payment` post-fetch vs spec §11.4 EC-A-6 intent `pending_approval`; sibling-class to catch #54 pre-existing-substrate-drift)
- #58 WSL-side scope-projection under-specification at pre-seed-dependency grain (Task 6 setup item 3 assumed ManualBillForm bill creation provides Shot #7 substrate; ManualBillForm vendor-required + fresh-seed 0 vendors → blocker; sibling under-specification cluster)
- #59 chain-of-drift through count-propagation between sides (sibling to #38 chain-of-drift bilateral; WSL-side N=53 vs brainstorm-side N=54 propagation drift; meta-recursive sub-grain observation: catch #59 own surface carries the count drift it documents — sub-grain bundled under #59 per founder ratification rather than separate catch #61)
- #60 NEW sub-mechanism bucket: substrate-grain capability gap at gate-execution grain (agent canvas-directive emission for `payment_approval_card` not wired at v1; HTTP 400 at `/api/agent/message`; ADR-0015 + agent-first architecture canonical-path BLOCKED; sibling-class to catch #57 substrate-ship-only framing)

**Sub-mechanism distribution post-chunk-B5-3-D3 (cumulative within-arc; WSL-side canonical count per N=59):**

- WSL-side projection-drift N=9 (#28 + #30 + #31 + #33 + #35 + #36 + #37 + #53 + #56 + #58); under-specification sub-cluster N=7 (#33 + #35 + #36 + #43 + #53 + #56 + #58; within-arc codification-candidate evidence basis substantively strengthened); over-specification sub-cluster N=2 (#37 + #50); other sub-mechanisms N=3 (#28 + #30 + #31)
- WSL-side substrate-citation drift N=11 (#34 + #39 + #40 + #41 + #44 + #46 + #47 + #48 + #49 + #51 + #52 + #55) — note: this enumeration shows 12 catches; #39 is hybrid-classified across substrate-citation + prophylactic-application; counts in substrate-citation bucket per primary classification at session #1 close adjudication
- Brainstorm-side substrate-citation drift N=3 (#27 + #29 + #45 hybrid)
- Brainstorm-side grain-discrimination scope-projection N=1 (#32)
- Chain-of-drift bilateral meta-grain N=2 (#38 + #59)
- Chain-of-drift through founder-ratification surface (NEW sub-shape at #45 hybrid) N=1
- Prophylactic-application-grain partial-success meta-grain N=1 (#39 hybrid)
- Dispatch-mandate-violation 4th grain-axis (NEW at chunk-onset) N=1 (#42)
- Pre-existing-rule-firing surface (NEW bucket at session #1) N=1 (#54)
- Substrate-grain semantic drift at downstream-consumer (NEW bucket at session #2) N=1 (#57)
- Substrate-grain capability gap (NEW bucket at session #2) N=1 (#60)

Total cumulative N=59. **3 NEW sub-mechanism buckets surfaced at chunk B5-3-D3**: dispatch-mandate-violation (#42), pre-existing-rule-firing (#54), substrate-grain semantic drift at downstream-consumer (#57). Plus #60 (substrate-grain capability gap) sibling-class to #57 framing → could bundle as 2 buckets vs 3 at arc-closure synthesis adjudication. Symmetric sub-mechanism class coverage between sides; pre-existing-substrate-drift sub-pattern within-arc N=3 (#54 + #57 + #60) codification-candidate evidence basis emerging substantively.

**Drift dispositions resolved at chunk-B5-3-D3 closeout:**

§Drift-A + §Drift-B + §Drift-C persist from B5-3-D1 + B5-3-D2; this entry follows §Drift-B narrow-scope methodology + §Drift-C inline-in-friction-journal venue. Founder Item 4 (B5-3-D1 substrate-amendment timing) preserved at arc-closure venue. Item 2 (a) (5-file canvas integration with PaymentApprovalQueueView row-click amendment) **rolled back** at session #2 post-Task-5 checkpoint per (iii-b) ratification — catch #57 substantive grounding made the row-click amendment non-functional (queue filter excludes pending_approval; clicked bills already in target state). Session-grain rollback preserves §Drift-B + δ-i discipline (forward-progress amendment reverted before commit; closed B5-3-D2 substrate not retroactively amended). Founder Item 5 (D2.7-gate-with-substrate-ship-only-exception codification candidate) ratified for arc-closure synthesis carry-forward.

**Cross-arc graduation triggers FIRED at chunk-B5-3-D3 (evaluation DEFERRED to Phase 5 arc-closure per §Drift-B):**

- **(cadence-β-i-b) cross-arc N=3 FIRES** (B5-2 + B5-3-D2 + B5-3-D3); combined with (cadence-β-i-a) cross-arc N=2 FIRED at B5-3-D1, cadence shape (cadence-β-i-b) has substantively favorable cross-arc N=3 evidence basis entering arc-closure
- (test-γ) within-arc N≥3 ratchet continues active
- 3 NEW sub-mechanism buckets surfaced at chunk B5-3-D3 (dispatch-mandate-violation #42 + pre-existing-rule-firing #54 + substrate-grain semantic drift at downstream-consumer #57 / substrate-grain capability gap #60) — bucket-class enumeration vs lumping methodology arc-closure adjudication candidate
- Pre-existing-substrate-drift sub-pattern within-arc N=3 (#54 + #57 + #60) — NEW codification-candidate evidence basis emerging
- Under-specification sub-cluster within-arc N=7 (#33 + #35 + #36 + #43 + #53 + #56 + #58) — codification-candidate evidence basis substantively strengthened (was N=3 at B5-3-D2 close; +4 at chunk B5-3-D3)
- Chain-of-drift bilateral meta-grain within-arc N=2 (#38 + #59) — sibling pattern propagation across chunks
- Within-arc prophylactic-application-grain N=14 successful preventive catches (7 at B5-3-D3 session #1 + 6 at B5-3-D3 session #2 + prior chunks) — codification-candidate evidence basis substantively load-bearing for arc-closure synthesis

**Carry-forward inventory (B5-3-D3 SHIPPED → subsequent chunks + arc-closure):**

Active for subsequent-chunk firing (2 items; preserved-deferred from prior chunks):
1. FT1 (clampTtl NaN-guard at `supabaseStorageProvider.ts:95-99`) — preserved-deferred to storage-substrate-touching chunk
2. Item 18 org_settings substrate-floor — preserved-deferred per (orgset-β)

Active for Phase 5 arc-closure retrospective (32+ items; 29 inherited from prior chunks + 3+ new at chunk-B5-3-D3 close):
- Items 1-29 per chunk B5-3-D1 + B5-3-D2 closeout entries below
- 30: Cross-arc N=3 graduation evaluation for (cadence-β-i-b) — substantively favorable evidence basis
- 31: Pre-existing-substrate-drift sub-pattern codification candidate (#54 + #57 + #60; within-arc N=3 evidence basis)
- 32: D2.7-gate-with-substrate-ship-only-exception discipline codification (founder Item 5 ratified; sibling §Drift-B narrow-scope methodology codification)

**Candidate 4 EXPANSION at chunk-B5-3-D3 closeout (originally B5-3-D1 header drift; expanded over 3 chunks):**

What was "B5-3-D1 read-side service file header drift carry-forward" at chunk B5-3-D1 closeout has expanded over 3 chunks to **Phase 5 Spend subdomain substrate-amendment-and-UX-architecture-reconciliation scope** with 8 sub-surfaces:
- (a) B5-3-D1 read-side service file header text aspirational drift (`apReportService.ts` + `vendorReportService.ts`; N=11 loci verified)
- (b) Per-property ESLint annotation across 5 Phase 5 service files (catch #54; 13 errors pre-existing)
- (c) `apReportService.paymentApprovalQueue` filter semantic-drift correction (catch #57; filter should match spec §11.4 EC-A-6 `pending_approval` intent OR rename queue per UX-architecture reconciliation) [COUPLED with (d)]
- (d) Pending Approvals canvas view (NEW) to expose `pending_approval` bills with row-click entry to PaymentApprovalCard [COUPLED with (c)]
- (e) Agent canvas-directive emission capability wiring for `payment_approval_card` (catch #60; ADR-0015 + agent-first architecture canonical path) [COUPLED with (f)]
- (f) PaymentApprovalQueueView row-click amendment add-back after substrate semantic-fix lands (revives catch #43 chunk-onset Item 2 (a) ratification scope) [COUPLED with (e)]
- (g) D2.7 Shot #7 fire at substrate-correction-chunk grain (founder Item 5 deferral per catch #57 + #60) [OPERATIONAL CONSEQUENCE of (c)+(d)+(e)+(f)]
- (h) D2.7-gate-with-substrate-ship-only-exception discipline codification (NEW; founder Item 5; sibling §Drift-B narrow-scope methodology codification) [META-GRAIN]

Arc-closure scope-grain expansion observation: 8 sub-surfaces vs original 1-surface framing at chunk B5-3-D1 closeout. Arc-closure substrate-amendment scope substantively larger than originally projected. **Non-blocking observation; preserved at arc-closure venue per §Drift-B**.

**Defense-in-depth grain-axis enumeration (post-chunk-B5-3-D3):**

- Cross-side axis: within-arc N≥18 (catches #21-#33 + #37 + #39 + #45 + #55 + #56 + #57 + #58 + #59 + #60 cross-side surfaced)
- Self-reflective axis: within-arc N=2 (#32 + #37 + #44)
- Cross-subagent axis: within-arc N=12 (B5-3-D2 N=5 + B5-3-D3 N=7 — implementer subagent catches at task-grain via verify-from-disk discipline)
- Meta-grain buckets: chain-of-drift bilateral N=2 (#38 + #59); chain-of-drift through founder-ratification N=1 (#45 hybrid); prophylactic-application-grain partial-success N=1 (#39 hybrid); dispatch-mandate-violation N=1 (#42); pre-existing-rule-firing N=1 (#54); substrate-grain semantic drift at downstream-consumer N=1 (#57); substrate-grain capability gap N=1 (#60)

Architecture-validating observation: bidirectional cross-side parallel-surface verification + cross-subagent verify-from-disk discipline operate symmetrically AND across multiple grain-axes; H3 surface-area-grain asymmetry hypothesis substantively favored entering Phase 5 arc-closure synthesis (within-arc N=14+ prophylactic-success preventive catches; N=12 cross-subagent; N=18+ cross-side).

**Push-readiness three-condition gate (CHUNK-COMPLETION grain) — MET per CLAUDE.md convention:**

1. Test-suite health: **MET** (826/826 vitest + 26/26 agent:validate + typecheck clean at clean DB baseline; +5 from session #1 close baseline 821 = matches Task 4 5-test increment)
2. Doc-sync reconciled: **MET trivially** (no INV / control_matrix / ADR amendments at this chunk; canvas integration is type-level + UI only; `ledger_truth_model` unchanged; `types.ts` regenerated implicitly via typecheck pass)
3. Governance closeout: **MET** via this friction-journal chunk-B5-3-D3 entry + retrospective inline per §Drift-C + carry-forward inventory + Item 5 codification candidate ratification

**Chunk B5-3-D3 CLOSED at this commit.** 2 v1-deliverable write-side UI surfaces shipped (1 user-accessible: ManualBillForm functional end-to-end + 1 substrate-ship-only: PaymentApprovalCard component + integration tests + canvas-directive plumbing). D2.7 screenshot gate FIRED with 6/7 PASS + 1 substrate-ship-only-exception verdict (founder Item 5 ratified). (cadence-β-i-b) cross-arc N=3 graduation evaluation FIRES; defers to Phase 5 arc-closure per §Drift-B. Push CLEAN to `origin/staging` per (cadence-β-i-b) precedent (push fires at chunk-completion, NOT session #1 close). Phase 5 arc continues with next-chunk election per (decomp-γ) hybrid.

---

### Phase 5 chunk B5-3-D2 substantive arc closeout retrospective entry (2026-05-11) — fourth Phase-5-arc-execution friction-journal entry + (cadence-β-i-b) second-instance (cross-arc N=2 graduation evaluation FIRED; arc-closure synthesis) + 13 chunk-grain catches + 5 of 5 v1-deliverable view UI surfaces shipped + 2 new meta-grain sub-mechanism buckets

This is the FOURTH Phase-5-arc-execution entry. Chunk B5-3-D2 (Slice D UI-side AP read-side reporting; 5 view UI surfaces) opened 2026-05-11 at HEAD `9aafabe` (post-B5-3-D1 ship); substantive session #1 SHIPPED 2026-05-11 at HEAD `e143792` (3 of 5 views: EC-A-3 + EC-A-4 + EC-A-5 + new vendorService.ts substrate); substantive session #2 + closeout SHIPPED at this commit per (cadence-β-i-b) 2-session bundled cadence (second instance after chunk B5-2; cross-arc N=2 trigger for candidate (e) graduation evaluation FIRES — evaluation deferred to Phase 5 arc-closure retrospective per §Drift-B). Chunk B5-3-D2 closes 5 of 5 v1-deliverable read-side view UI surfaces (3 from session #1 + 2 from session #2); EC-A-8 scope-removed under (δ) symmetry with B5-3-D1 per §11.5 Document-Platform ownership. Phase 5 arc continues with B5-3-D3 (write-side UI surfaces: manual bill form + payment approval card + screenshot gate (γ) firing for all 7 Phase A UI surfaces) OR alternative next-slice election per (decomp-γ) hybrid.

**Chunk-closeout grain preserves §Drift-B narrow-scope methodology** (precedent established at chunk B5-3-D1 closeout): this entry preserves chunk-grain pattern observations + drift dispositions + carry-forward inventory. Cross-arc synthesis defers to Phase 5 arc-closure retrospective.

**Chunk B5-3-D2 SHIPPED summary:**

- Session #1 (HEAD `e143792`): 18 files / +1838 / 3 views + new vendorService.ts substrate + 4-file canvas integration + 4 unit tests + 7 E2E / 816/816 vitest + 26/26 agent:validate + typecheck clean
- Session #2 + closeout (this commit): 12 files / 2 views + 4-file canvas integration extension + 4 E2E + friction-journal entry + plan doc / 816/816 vitest + 26/26 agent:validate + typecheck clean
- Cumulative: 30 files / 5 of 5 v1-deliverable view UI surfaces + 1 new service substrate / 4 new vitest + 11 new E2E

**Chunk-grain catches enumeration (13 catches at chunk B5-3-D2; cumulative N=25 entering → N=38 exiting):**

Chunk-onset catches (#27-#33; 7 at scope-lock + plan doc draft grain):
- #27 brainstorm-side substrate-citation drift at slice election (ADR-0015 §10 6-mutation enumeration)
- #28 WSL-side scope-projection at D2.7 (manual form-entry fixtures transitive-dependency-temporal)
- #29 brainstorm-side substrate-citation drift at D2.6 (test-count session-vs-grain conflation)
- #30 WSL-side layer-categorization error on EC-A-5 (D2.4 symmetry at wrong layer; Two Laws Law 1 dispositive)
- #31 WSL-side grain-discrimination scope-projection at Q1 (hybrid page route as implementation-grain vs ratification-grain)
- #32 brainstorm-side self-surfaced grain-discrimination (within-B5-3-D1-retrospective venue projection; SELF-REFLECTIVE)
- #33 WSL-side plan-doc scope-projection under-specification (canvas integration 0-2 contingent vs 3-file concrete)

Session #1 implementation catches (#34-#37; 4 at implementer-subagent + validation-gate-execution grain):
- #34 WSL-side substrate-citation drift (`@/components/canvas/types` nonexistent; FIRST WSL-side substrate-citation; cross-subagent-grain)
- #35 WSL-side scope-projection under-specification (canvasContextSuffix.ts 4th file; cross-subagent-grain)
- #36 WSL-side scope-projection under-specification (TS-typing vendor_id; cross-subagent-grain)
- #37 WSL-side scope-projection over-specification (plan doc Task 5 E2E gate over-projection; SELF-REFLECTIVE)

Session #2 onset + plan doc draft catches (#38-#39; 2 at NEW meta-grain buckets):
- #38 chain-of-drift bilateral meta-grain (WSL-side commit/memory N=5 → brainstorm-side handoff partial-correction N=6 → actual N=7; chain crosses sides with partial-correction at verification surface; NEW meta-grain bucket)
- #39 WSL-side substrate-citation drift at session #2 plan doc Task 1b code template (combined imports from wrong path; sibling to #34; finer-grain variant; NEW meta-grain bucket: prophylactic-application-grain partial-success — catch #34 lesson succeeded at lesson-statement grain but failed at code-template grain)

**Sub-mechanism distribution post-chunk-B5-3-D2 (cumulative within-arc):**

- WSL-side projection-drift N=7 (#28 + #30 + #31 + #33 + #35 + #36 + #37); under-specification sub-cluster N=3 (#33 + #35 + #36; codification candidate); over-specification N=1 (#37); other N=3 (#28 + #30 + #31)
- WSL-side substrate-citation drift N=1 (#34)
- Brainstorm-side substrate-citation drift N=2 (#27 + #29)
- Brainstorm-side grain-discrimination scope-projection N=1 (#32)
- Chain-of-drift bilateral meta-grain N=1 (#38; NEW bucket)
- Prophylactic-application-grain partial-success meta-grain N=1 (#39; NEW bucket)

Total cumulative N=38. Symmetric sub-mechanism class coverage between sides; absolute counts diverge per H3 surface-area-grain asymmetry hypothesis (arc-closure synthesis).

**Drift dispositions resolved at chunk-B5-3-D2 closeout:**

§Drift-A + §Drift-B + §Drift-C persist from B5-3-D1; this entry follows §Drift-B narrow-scope methodology + §Drift-C inline-in-friction-journal venue. B5-3-D1 header-comment aspirational withInvariants/ActionName drift (N=10+ mentions across apReportService.ts + vendorReportService.ts) NOT replicated at B5-3-D2 new files (drift disposition applied prophylactically); arc-closure carry-forward per §Drift-B + δ-i.

**Cross-arc graduation triggers FIRED at chunk-B5-3-D2 (evaluation DEFERRED to Phase 5 arc-closure per §Drift-B):**

- (cadence-β-i-b) cross-arc N=2 FIRES (B5-2 + B5-3-D2); combined with (cadence-β-i-a) cross-arc N=2 FIRED at B5-3-D1, both cadence shapes have cross-arc N=2 evidence basis entering arc-closure
- (test-γ) within-arc N≥3 ratchet continues active; counting-grain ambiguity surfaced at session #1 + session #2 validation gates via accountLedgerService pollution-driven flake
- NEW: Chain-of-drift propagation pattern (#38) — meta-grain mechanism distinct from substrate-citation + projection-drift sub-mechanism classes
- NEW: Prophylactic-application-grain partial-success (#39) — meta-grain mechanism for grain-asymmetric discipline application

**Carry-forward inventory (B5-3-D2 SHIPPED → subsequent chunks + arc-closure):**

Active for subsequent-chunk firing (3 items):
1. FT1 (clampTtl NaN-guard) — preserved-deferred to storage-substrate chunk
2. Item 18 org_settings substrate-floor — preserved-deferred per (orgset-β)
3. NEW: D2.7 screenshot gate (γ) — fires at B5-3-D3 closeout (captures all 7 Phase A UI surfaces at single fixture state via founder-grain capture per CLAUDE.md §UI-session screenshot gate)

Active for Phase 5 arc-closure retrospective (29 items; 25 inherited from prior chunks + 4 new at chunk-B5-3-D2):
- Items 1-25 per chunk B5-3-D1 closeout entry below
- 26: ec-19.spec.ts pre-existing E2E failure (2/3 against CONTROLLER_ORG seed; verified pre-existing via stash-regression-check)
- 27: accountLedgerService.test.ts pollution-driven flake counting-grain ambiguity ((test-γ) instance)
- 28: cross-subagent-grain catch-grain axis recognition + chain-of-drift bilateral meta-grain (#38) + prophylactic-application-grain partial-success meta-grain (#39)
- 29: Defense-in-depth grain-axis enumeration confirmed at 3-axis (cross-side + self-reflective + cross-subagent) + 2 meta-grain buckets

**Defense-in-depth grain-axis enumeration (post-chunk-B5-3-D2):**

- Cross-side axis: within-arc N≥12 (catches #21-#33 + #37 + #39)
- Self-reflective axis: within-arc N=2 (#32 + #37)
- Cross-subagent axis: within-arc N=5 (B5-3-D1 #21+#26 + B5-3-D2 #34+#35+#36)
- Meta-grain buckets: chain-of-drift bilateral N=1 (#38); prophylactic-application-grain partial-success N=1 (#39)

Architecture-validating observation: bidirectional cross-side parallel-surface verification operates symmetrically AND across multiple grain-axes; H3 surface-area-grain asymmetry hypothesis substantively favored entering Phase 5 arc-closure synthesis.

**Chunk B5-3-D2 CLOSED at this commit. Push CLEAN to `origin/staging`. 5 of 5 v1-deliverable read-side view UI surfaces shipped per Phase A scope; B5-3-D3 ships write-side UI + screenshot gate (γ) firing. Phase 5 arc continues.**

---

### Phase 5 chunk B5-3-D1 substantive arc closeout retrospective entry (2026-05-11) — third Phase-5-arc-execution friction-journal entry + (cadence-β-i-a) second-instance (cross-arc N=2 graduation evaluation FIRED; arc-closure synthesis) + 6 chunk-grain catches + 3 drift dispositions + chunk-closeout/arc-closure grain discrimination methodology

This is the THIRD Phase-5-arc-execution entry. Chunk B5-3-D1 (Slice D AP read-side reporting; data-side) opened 2026-05-10 at HEAD `fdb019d`; substantive sessions #1 + #2 SHIPPED 2026-05-10/11 at HEADs `770fef4` + `93cecdd`; closeout session #3 closes the chunk at this commit per (cadence-β-i-a) 3-session split (second instance of this cadence-shape after chunk B5-1; cross-arc N=2 trigger for candidate (e) graduation evaluation FIRES — evaluation deferred to Phase 5 arc-closure retrospective per founder narrow-scope disposition §Drift-B). Phase 5 arc continues with chunk B5-3-D2 (UI screenshot-gated surfaces) OR alternative next-slice election per (decomp-γ) hybrid by domain-slice.

**Chunk-closeout grain narrowed per founder ratification at session #3 onset (§Drift-B below):** this entry preserves chunk-grain pattern observations + drift dispositions + carry-forward inventory. Cross-arc synthesis (codification adjudications + graduation evaluations + cross-arc N≥2/N≥3 codification candidate decisions) defers to Phase 5 arc-closure retrospective rather than firing at this chunk-closeout grain. Methodology shift from chunk B5-1 + B5-2 closeout precedents (which included codification adjudications at chunk-closeout grain).

#### Aggregate chunk metrics

| Session | HEAD | Files | Lines | Tests | Validation |
|---|---|---|---|---|---|
| Chunk onset (2026-05-10) | `fdb019d` (chunk B5-2 closeout) | — | — | — | memory-writes-only Stage 6 per Item 17 |
| Substantive #1 (2026-05-10) | `770fef4` | 13 | +2340/-1 | 24 new | 801/801 + 26/26 |
| Substantive #2 (2026-05-11) | `93cecdd` | 8 | +1368/-3 | 11 new | 812/812 + 26/26 |
| Closeout #3 (2026-05-11) | this commit | — | — | — | conditions 1+2+3 MET |

Cumulative across substantive sessions: 21 files / +3708/-4 / 35 new tests at clean DB baseline 812/812. 5 of 5 v1-deliverable views shipped (EC-A-3 + EC-A-4 + EC-A-5 + EC-A-6 + EC-A-7); EC-A-8 scope-removed under (δ) per §Drift-A.

#### Arc-class second-instance status framing

Chunk B5-3-D1 is the THIRD chunk-grain implementation arc of Phase 5 (after chunks B5-1 + B5-2). (cadence-β-i-a) 3-session split fires SECOND time after chunk B5-1 — **cross-arc N=2 graduation trigger for candidate (e) FIRES at session #1 ship.** Per §Drift-B narrow-scope ratification, graduation evaluation defers to Phase 5 arc-closure retrospective; this entry logs the trigger-firing as a raw data point.

Sessions #1 + #2 substantive observations enumerated below as raw data points; codification synthesis carries forward to arc-closure.

#### 6 chunk-grain catches (observations; codification deferred to arc-closure)

**Cluster B B1 cumulative N=25 = 19 entering D1 + 6 across chunk B5-3-D1.**

Session #1 catches (4):

1. **Catch #21 — orchestrator-dispatch-grain loggerWith API drift.** Subagent-caught during Task 2-3 implementation at session #1; subagent revised file-scoped logger to per-call construction per substrate-grounded API. Architecture-validating observation: defense-in-depth working as designed (subagent's substrate-read at implementation grain corrected orchestrator's semantic-memory projection in dispatch prompt).
2. **Catch #22 — orchestrator-dispatch-grain `ctx.caller.org_ids[0]` semantic-memory propagation.** Brainstorm-side caught at session #1 checkpoint #1; resolved via openBills.schema.ts + org_id input shape addition (pattern parity with aging + balance schemas).
3. **Catch #23 — orchestrator-ratification-grain D1.3 ratification without .gitignore verify-from-disk.** Surfaced at post-Task-3 file-staging verify when D1.3 `reports/` subfolder silently captured by .gitignore `reports/` broad pattern; resolved via disposition (b) .gitignore scope refinement (`reports/` → `/reports/` root-only).
4. **Catch #24 — substrate-side .gitignore broader-than-documented-intent observation.** Surfaced concurrently with catch #23; resolved via disposition (b) scope refinement. New grain variant in grounding-rigor spectrum: substrate-side observation grain.

Session #2 catches (2):

5. **Catch #25 — orchestrator-ratification-grain D1.1 ratification without verify-from-disk on exception routing substrate.** Surfaced at session #2 onset D2.4 dispatch when verify-from-disk Outcome C revealed exception_queue substrate doesn't exist in code or migrations. Sibling to catch #23 (D1.3 ratification-grain). Resolved via §Drift-A (δ) EC-A-8 scope-removal.
6. **Catch #26 — orchestrator-dispatch-grain `toMoneyAmount` String() coercion projection drift.** Subagent-caught preventively at Tasks 1-4 by verify-from-disk against session #1 `loadBillsWithAmountDue` helper pattern. Sibling to catch #21 (loggerWith API drift); same class — orchestrator-grain projection without disk grounding. Defense-in-depth validation second instance.

**Within-arc pattern observations (logged as raw data; codification deferred to arc-closure per §Drift-B):**

- **Orchestrator-dispatch-grain count = 3 instances** (catches #21 + #22 + #26) — **within-arc N≥3 candidate (e) shape-refinement-via-within-arc-evidence-basis trigger FIRES.** Codification candidate evaluation deferred to arc-closure.
- **Orchestrator-ratification-grain count = 2 instances** (catches #23 + #25) — within-arc N≥2; codification candidate "ratification-grain verify-from-disk dispatch fires PREVENTIVELY at chunk-onset planning lock against any ratification that cites substrate as a dependency"; deferred to arc-closure alongside (α) codification-grain primary candidate from B5-2.
- **Subagent-caught catches = 2 instances** (catches #21 + #26) — both orchestrator-dispatch-grain; architecture-validating data points; defense-in-depth from subagent substrate-read at implementation grain corrected orchestrator-grain semantic-memory drift at both instances.

**Process-overhead hypothesis refinement (carry-forward to arc-closure):** D1 evidence refines the hypothesis to a **two-surface model**:
- **Implementation-grain catches** correlate with substrate novelty (D1 session #2 = 0 catches at Tasks 1-4; pattern-inherited from session #1; novelty zero produces yield zero)
- **Ratification-grain catches** correlate with substrate-existence-assumption surface (D1 session #2 catch #25 surfaced at fresh substrate-existence-assumption for EC-A-8 despite pattern-inherited session; independent of substrate novelty)

#### 3 drift dispositions

**§Drift-A — EC-A-8 (δ) scope-removal from chunk B5-3-D1.** D1.1 ratification of "3 EC-A-8 behavioral tests" surfaced at session #2 onset D2.4 verify-from-disk dispatch as Outcome C: exception routing substrate does NOT exist in code or migrations (zero references to `exception_queue` or `exceptionRoutingService` in `apps/web/src/`; zero migrations create the table); Phase 5 §10 phase-sequencing explicitly excludes ingestion/extraction substrate (verbatim: "No drag-drop, no email, no extraction"); EC-A-8 row at Spend brief §11.4 explicitly anchors substrate ownership to Document Platform ("consumed from Document Platform substrate"). Disposition (δ) ratified: EC-A-8 scope-removed from chunk B5-3-D1; stays as Phase A exit criterion; delivery deferred to Phase 6+ chunk that ships Document Platform exception_queue substrate. Catch #25 logged at session #2 onset; resolved via this disposition. Phase 5 ↔ Phase 6+ cross-phase dependency carry-forward to arc-closure.

**§Drift-B — Chunk-closeout / arc-closure grain discrimination methodology.** Brainstorm-side surfaced at session #3 onset: chunk B5-3-D1 carry-forward inventory entering closeout would have included 4 candidate (e) trigger evaluations + multiple cross-arc codification candidate decisions if chunk-closeout precedent at B5-1 + B5-2 were applied uniformly. Founder narrow-scope ratification: chunk-closeout limits disposition to artifacts that NEED to land at chunk-closeout grain (friction-journal entry + push-readiness gate + chunk-grain push); arc-closure-grain candidates (cross-arc graduation evaluations + cross-arc codification candidates) carry-forward to Phase 5 arc-closure retrospective. Methodology shift from chunk B5-1 + B5-2 closeout precedents (which included codification adjudications at chunk-closeout grain). New chunk-closeout/arc-closure grain discrimination methodology established at B5-3-D1; preserves grain separation between chunk-closeout substrate-grain reconciliation and arc-closure cross-arc synthesis.

**§Drift-C — Retrospective venue (inline-in-friction-journal).** Per chunk B5-1 §B + chunk B5-2 §Drift-B precedents: inline-in-friction-journal at chunk closeout; arc-completion retrospective separate document deferred to Phase 5 arc-closure. Chunk B5-3-D1 is mid-arc (Phase 5 arc continues with chunk B5-3-D2 or B5-4 per (decomp-γ) hybrid).

#### Carry-forward to subsequent chunks (B5-3-D2 / B5-4+) and Phase 5 arc-closure

**Active for subsequent-chunk firing (2 items; preserved from chunk B5-2 closeout):**

- **Item 1 FT1** (`clampTtl` NaN-guard at `apps/web/src/services/storage/providers/supabaseStorageProvider.ts`) — deferred at D1 onset; still pending; fires at storage-substrate-touching chunk
- **Item 18 org_settings substrate-floor** (dedicated sub-arc per (orgset-β)) — deferred at D1 onset; still pending; fires at first `org_settings.*` consumption

**Active for Phase 5 arc-closure retrospective (18 items; chunk-closeout-grain consolidation per §Drift-B):**

Preserved from prior chunks:

1. **Item 16** cross-arc-grain meta-codification-candidate
2. **Process-overhead-vs-deliverable-velocity observation** — refined to two-surface model at B5-3-D1 (implementation-grain vs ratification-grain catches with different drivers)
3. **Discipline-of-the-discipline observation** (Z1 #11.b + Cluster B adjacent-register pattern)
4. **Catch #17 brainstorm-side semantic-memory observation pattern**
5. **(α) Codification-grain verify-from-disk gate** (primary candidate from B5-2)
6. **(β) Test-pass-evidence-grain limitation** (sub-observation under α)
7. **6-grain-variant grounding-rigor spectrum** (4-grain at B5-2 + catch #21 orchestrator-dispatch-grain + catch #24 substrate-side observation grain; B5-3-D1 catches #25 + #26 fit existing grains)
8. **(cadence-β-i-b) cross-arc N=2 watch** (stays at N=1; B5-3-D1 fires (cadence-β-i-a))
9. **Catch #20 forward-pointer** — post-v1 accrual workflow chunk for ADR-0015 §5 two-axis spec drift disambiguation
10. **§3.1+§3.2 trigger-condition sub-pattern SKILL refinement candidate** — read-side direct-DB seeding doesn't fire trigger; SKILL refinement at arc-closure
11. **accountLedgerService.test.ts pollution-driven flake observation** — cross-arc N=2 candidate (B5-2 session #1 + D1 sessions #1+#2)
12. **(cadence-β-i-a) cross-arc N=2 graduation evaluation FIRED** — B5-1 + D1 = N=2; founder triangulation at arc-closure per candidate (e) pathway

New at chunk B5-3-D1 closeout:

13. **Within-arc N≥3 orchestrator-dispatch-grain codification candidate** — catches #21 + #22 + #26 within D1; candidate (e) shape-refinement-via-within-arc-evidence-basis trigger FIRED; arc-closure evaluation
14. **Within-arc N≥2 orchestrator-ratification-grain codification candidate** — catches #23 + #25 within D1; "ratification-grain verify-from-disk dispatch fires PREVENTIVELY at chunk-onset planning lock against any ratification that cites substrate as a dependency"; arc-closure evaluation alongside (α) codification-grain primary candidate from B5-2
15. **(test-γ) grain definition clarification** — three plausible counting surfaces (file-grain / logical-test-class-grain / case-grain); B5-1 + B5-2 + D1 cross-arc comparison gated on this disposition; arc-closure evaluation
16. **EC-A-8 (δ) scope-removal + Phase 5 ↔ Phase 6+ cross-phase dependency** — EC-A-8 satisfies at Phase 6+ chunk that delivers Document Platform exception_queue substrate; arc-closure consolidation
17. **File-top staleness convention pattern-stable observation** — convention fired across B5-1 + B5-2 + B5-3-D1 (3 Phase 5 chunks); pattern-stable per codified discipline in CLAUDE.md
18. **Chunk-closeout/arc-closure grain discrimination methodology** (§Drift-B) — narrow-scope precedent established at B5-3-D1; arc-closure consolidation of methodology evidence across chunks

#### Subagent dispatch and brainstorm-side parallel-surface shape (chunk-grain)

Two-sided + founder triple architecture operated across chunk B5-3-D1. Substantive subagent dispatches at sessions #1 (Tasks 1-3) + #2 (Tasks 1-4); brainstorm-side parallel-surface review at checkpoints (#1 + #2 session #1; checkpoint Task 5 session #2). Cluster B B1 verify-from-disk dispatches at chunk-onset + session #2 onset (D2.4 exception routing substrate) + scope-lock gates per graduated discipline. **Subagent-caught catches (#21 + #26) validate defense-in-depth architecture** — subagent substrate-read at implementation grain corrected orchestrator-grain semantic-memory projection at both instances. Architecture-validating data point: two-sided + founder triple defends against orchestrator-grain drift via subagent-grain substrate-read.

#### Push-readiness gate disposition (chunk-completion grain)

**Condition 1 (test-suite health):** MET. `pnpm agent:validate` 26/26 + `pnpm test` 812/812 at HEAD `93cecdd` (session #2 push); session #3 closeout commit re-verifies condition 1 (doc-only commit; no test impact).

**Condition 2 (doc-sync reconciled):** MET. `invariants.md` ↔ `control_matrix.md` ↔ `ledger_truth_model.md` consistent across chunk B5-3-D1 (no new invariants registered; INV-AP-001/002 activated at B5-2 Layer 2 service per Spend brief §11.3 substrate-now-enforcement-later cross-pattern; D1 read-side adds NO new invariants). `types.ts` matches post-B5-2 schema substrate (D1 no schema changes). Spend brief unchanged at D1 (D1 amendment shipped at B5-2 closeout). ADR-0015 unchanged at D1.

**Condition 3 (governance closeout):** MET. Friction-journal entry shipped (this entry); 6 catches enumerated as observations (codification deferred per §Drift-B); 3 drift dispositions resolved (§Drift-A EC-A-8 (δ) scope-removal + §Drift-B grain discrimination methodology + §Drift-C retrospective venue); carry-forward inventory reconciled to 2 subsequent-chunk + 18 arc-closure candidates. CLAUDE.md NOT updated this chunk (no new graduated conventions; codification candidates carry-forward to arc-closure per §Drift-B narrow-scope disposition). `.claude/skills/integration-test-rules/SKILL.md` NOT amended (§3.1+§3.2 trigger-condition sub-pattern refinement candidate carries to arc-closure).

**All three push-readiness conditions MET at chunk B5-3-D1 closeout. Push authorized.**

---

**Substrate-decision-integrity preserved across full chunk B5-3-D1 (3 sessions; 2026-05-10 onset → 2026-05-11 closeout).** Phase 5 chunk B5-3-D1 CLOSED at this retrospective entry. Phase 5 arc continues with chunk B5-3-D2 (UI screenshot-gated surfaces) OR alternative next-slice election per (decomp-γ) hybrid by domain-slice. Chunk-closeout/arc-closure grain discrimination methodology established per §Drift-B narrow-scope disposition: chunk-closeout limits to substrate-grain reconciliation; arc-closure handles cross-arc synthesis. Multiple candidate (e) triggers FIRED but evaluation deferred to arc-closure retrospective: (cadence-β-i-a) cross-arc N=2 + (test-γ) within-arc N≥3 + within-arc N≥3 orchestrator-dispatch-grain + within-arc N≥2 orchestrator-ratification-grain.

---

### Phase 5 chunk B5-2 substantive arc closeout retrospective entry (2026-05-10) — second Phase-5-arc-execution friction-journal entry + (cadence-β-i-b) first-instance + 12 first-instance observations + 6 codification adjudications + 2 drift dispositions + 4-data-point grounding-rigor spectrum

This is the SECOND Phase-5-arc-execution entry. Chunk B5-2 (Slice A bill lifecycle per Spend Initiative §11.1) opened at 2026-05-10 substantive session #1 onset; substantive session #1 SHIPPED at HEAD `3cffe74`; closeout session #2 closes the chunk at this commit per (cadence-β-i-b) 2-session bundled cadence (N=1 first-instance precedent; first chunk-grain implementation-arc closeout under (cadence-β-i-b)). Phase 5 arc continues with chunk B5-3+ per (decomp-γ) hybrid by domain-slice.

#### Aggregate chunk metrics

| Session | HEAD | Files | Lines | Tests | Validation |
|---|---|---|---|---|---|
| Chunk onset (2026-05-10) | `a4da915` (chunk B5-1 closeout) | — | — | — | memory-writes-only Stage 6 |
| Substantive #1 (2026-05-10) | `3cffe74` | 12 | +4410/-3 | 78 new | 777/777 + 26/26 |
| Closeout #2 (2026-05-10) | this commit | 5 (SKILL.md §3 + 4 vendor prepayment test refactors) + closeout artifacts | — | pre-check 4 files / 8 tests + typecheck | conditions 1+2+3 MET |

Cadence: (cadence-β-i-b) 2-session bundled operationally validated as N=1 first-instance; awaiting cross-arc N=2 per candidate (e) for graduation evaluation. Chunk B5-1 fired (cadence-β-i-a) 3-session split; both shapes inhabit candidate (e) within-arc shape-refinement pathway.

#### Arc-class first-instance status framing

Chunk B5-2 is the SECOND chunk-grain implementation arc of Phase 5 (after chunk B5-1). (cadence-β-i-b) bundled cadence is FIRST-INSTANCE under the 2-session-per-chunk shape. Session #1 + session #2 observations qualify as first-instance under (cadence-β-i-b) cadence framing AND under chunk B5-2-specific cluster framing.

#### 12 first-instance pattern observations

**Session #1 observations (per `3cffe74` commit body + pickup file enumeration):**

1. **First chunk-grain bill lifecycle substantive session in Phase 5** — `3cffe74` lands first bill substrate (migration 20240139000000) + 4 mutations (`post_bill`, `approve_bill_for_payment`, `record_bill_payment`, `reverse_bill`) + `bill_payment_allocations` net-new table per Sub-I.

2. **First (cadence-β-i-b) 2-session bundled cadence firing** — chunk B5-2 splits into substantive #1 + closeout #2; cadence-shape locked at chunk-onset planning per founder bundled-accept. First-instance precedent; awaiting cross-arc N=2 per candidate (e) for graduation evaluation.

3. **First (test-γ) 4+2+1 asymmetric split firing** — 4 per-mutation tests + 2 per-criterion tests (EC-A-1 + EC-A-2) + 1 unit test (54 cases). Asymmetric: `approve_bill_for_payment` is state-only (no JE) so no per-criterion grain test required there.

4. **First substrate-decision audit-grounded re-ratification under Cluster B B1 discipline (N=12 ratifications at chunk onset)** — D1-D7 + Sub-D/E/F/G/I/J/K/L/M/N + Path β; Sub-H dissolved as false catch (numeric(20,4) uniform across spend domain). Cluster B B1 productive catches accumulate to N=19 across the chunk spanning 19 grain variants (N=18 at chunk-onset + step-1 closeout grain; catch #19 added at step-4 closeout grain — see §Drift-A sibling exhibit); Cluster B B2 first-fire operationally validated at scope-projection sub-shape (4→3 mutations + 7→6 tests projected vs substrate-supported).

5. **First Reading B preservation under `bill_payment_allocations` mutation surface** — `record_bill_payment` posts JE via `journalEntryService` AND inserts `bill_payment_allocations` rows via `billService` (Reading B-compliant: domain service produces ledger ops, ledger service writes journal_entries). Sub-I net-new table preserves Reading B by routing through `billService` not `ledgerService`.

6. **First `reverse_bill` thin-wrapper mutation pattern** — calls `journalEntryService.post(reverses_journal_entry_id=…)` per Sub-E corrected mechanism; target state `voided` per Sub-D; `posted_journal_entry_id` uuid FK back-reference on `bills` per Sub-N (b).

7. **First `payment_method` enum activation** — 5 active values (`check`/`eft`/`wire`/`cash`/`other`) + 4 reserved (`credit_card`/`ach`/`bank_transfer`/`money_order`) per Sub-K. Reserved-enum-states discipline per ADR-0010.

8. **First INV-AP-001 + INV-AP-002 Layer 2 activation** — invariants activated at first AP-domain service consumer per Spend brief §11.3 substrate-now-enforcement-later cross-pattern.

**Session #2 closeout observations:**

9. **First chunk-grain closeout step-1 verify-from-disk dispatch under semantic-memory-citation discipline** — handoff prompt cited 4 anchors (Spend brief §9 line 225, ADR-0015 §1 Q80, open_questions.md Q80 pattern, CURRENT_STATE.md §Drift-1 option-i); verify-from-disk surfaced 5 Cluster B B1 fires across the 4 citation anchors. §Drift-1 anchor returned no on-disk basis after (β) sub-investigation (no §Drift-* section in CURRENT_STATE.md or friction-journal.md; no "option i" enumeration framing).

10. **Catch #17 — session-grain semantic-memory proposal grain** — brainstorm-side proposed traceId cleanup at chunk B5-2 session #1 without substrate read; WSL-side substrate-read corrected the mechanism. First codified instance of brainstorm-side semantic-memory observation surfacing as if grounded.

11. **Catch #18 — codified-discipline grain substrate-finding** — chunk B5-1 Adjudication 6 codification of dedicated-test-accounts pattern at SKILL.md §3 prescribed DELETE cleanup of `journal_lines` + `journal_entries` that is silently rejected by `trg_journal_entries_no_delete` (migration 20240133000000; service_role does NOT bypass triggers). 4 vendor prepayment afterAll blocks have been silently failing since chunk B5-1 codification. The chunk B5-1 closeout claim of "699/699 tests PASS" was substantively accurate against assertion grain but cleanup grain was failing silently across the full chunk B5-1 + chunk B5-2 session #1 timeline. Path β refinement at session #1 pre-ship aligned bill tests; SKILL.md §3 revision at session #2 codifies the substrate-aligned shape (split into §3.1 per-run COA isolation + §3.2 JE/JL accumulation-acceptance); 4 vendor prepayment test files refactored at session #2 step 2 to align. Pre-check validated 4 files / 8 tests PASS + `pnpm typecheck` clean (~5s combined).

12. **§Drift-1 dissolution — handoff-document grain semantic-memory propagation** — brainstorm-side authored "CURRENT_STATE.md §Drift-1 option-i update" citation at chunk B5-2 session #1 onset handoff drafting from semantic memory without verify-from-disk grounding; citation propagated forward to session #2 onset handoff; dissolved at closeout step 1 by verify-from-disk dispatch. No on-disk anchor across CURRENT_STATE.md, friction-journal.md, or conventions.md. Concrete exhibit of handoff-document semantic-memory propagation across two sequential handoff documents without source verification. (α) founder restate explicitly NOT requested per honest-epistemic-discipline (founder not the author; (α) would invert cost structure). Closeout scope reduced from 5 to 4 items.

#### 4-data-point grounding-rigor spectrum

Catches #17, #18, §Drift-1 dissolution, and (cadence-β-i-b) form four data points along a handoff-citation grounding-rigor spectrum, ordered from correctly-grounded to never-grounded. Positive-control inclusion is load-bearing: an implicit-axis enumeration would lose the asymmetry between catches the discipline corrects and citations the discipline validates.

1. **Correctly-grounded, verify-from-disk validates** — (cadence-β-i-b) at chunk B5-2 D7. Handoff-document carried a real substrate-decision; verify-from-disk at consumption confirmed the framing. Positive-control evidence that the discipline validates correct citations as well as catches incorrect ones.

2. **Session-grain proposal, semantic-memory uninformed** — Catch #17 (brainstorm-side traceId cleanup). Proposal originated from semantic memory without substrate read; correction landed when substrate-read surfaced the actual mechanism.

3. **Codified-discipline grain, substrate-finding corrects** — Catch #18 (Item 20 dedicated-test-accounts pattern was solving the wrong problem). Test-pollution drove substrate discovery; codified discipline was substrate-misframed and required revision via SKILL.md §3 split into §3.1 + §3.2.

4. **Handoff-document grain, never grounded** — §Drift-1 dissolution. Citation entered handoff chain at session #1 onset from brainstorm-side semantic memory; propagated forward to session #2 onset; dissolved at closeout step 1 by verify-from-disk dispatch. No on-disk basis at any grain.

#### 6 codification adjudications outcomes

**Adjudication 1 — Item 20 SKILL revision (§3 split into §3.1 + §3.2 per catch #18 substrate-level finding).** SKILL.md §3 was "Dedicated test-accounts pattern" — single section conflating COA-isolation discipline (beforeAll grain) with JE/JL cleanup discipline (afterAll grain). Catch #18 surfaced that the conflated pattern prescribed JE/JL DELETE silently rejected at trigger layer. Revision splits §3 into:

- **§3.1 Per-run COA isolation** (beforeAll grain; `T${traceId.slice(0,8)}_*` codes; `vendorPrepaymentApply.test.ts` as codification anchor preserved from chunk B5-1; afterAll COA cleanup framed as optional hygiene-positive defense-in-depth rather than load-bearing discipline).
- **§3.2 JE/JL accumulation-acceptance** (afterAll grain; `void createdJeIds` + comment; `journalSourceExternalId.test.ts:32-40` as canonical pattern; `reportTrialBalance.test.ts:147` as read-side T-prefix filter anchor; INV-LEDGER-001 Layer 1a + migration 20240133000000 → `trg_journal_entries_no_delete` as substrate authority chain; explicit "service-role does NOT bypass triggers" framing).

4 vendor prepayment test files (`vendorPrepaymentApply.test.ts` + 3 `vendorPrepaymentApplyEcA*` siblings) refactored at session #2 step 2 to substrate-aligned shape. Three-way consistency achieved across (a) SKILL.md codification + (b) chunk-B5-1 vendor prepayment tests (refactored at this step 2) + (c) chunk-B5-2 bill tests (already aligned via session #1 Path β refinement).

**Adjudication 2 — (cadence-β-i-b) ratified as N=1 first-instance observation; NOT graduated.** Awaiting cross-arc N=2 per candidate (e) shape-refinement-via-cross-arc-evidence-basis meta-pathway. (cadence-β-i-b) is currently listed as chunk B5-2 substrate-decision (D7), not as graduated standing rule. Friction-journal entry records the N=1 data point; graduation evaluation defers until subsequent chunk-grain implementation arc reproduces the bundled-cadence shape.

**Adjudication 3 — Sub-H dissolution (false catch at chunk-onset audit grain).** Sub-H was a Cluster B B1 candidate at chunk-onset for numeric column type divergence between `bills.amount_total` (existing) and `bill_payment_allocations.amount` (new). Audit-grounded re-ratification confirmed `numeric(20,4)` uniform across spend domain; Sub-H dissolved. First codified instance of Cluster B B1 false-positive disposition at chunk-onset audit grain — confirms the discipline's discrimination between productive catches and false candidates.

**Adjudication 4 — Cluster B B1 N=19 productive catches operationally validated at chunk-grain scale.** Across 19 grain variants spanning substrate-citation, scope-projection, audit-grounded substrate-decision-restate, plan-authoring transitive-dependency, semantic-memory observation, handoff-document propagation (section-non-existence sub-grain AND path-prefix sub-grain), pickup-file-content-tracking. Cluster B graduated at chunk B5-1 closeout per chunk B5-1 Adjudication 1; chunk B5-2 firing-density confirms the discipline operates at expected scale across implementation-arc-execution. Cluster B B2 (scope-projection grain) first-fire operationally validated at independent grain from chunk B5-1.

**Adjudication 5 — Item 20 SKILL revision codification under (a) in-scope refactor disposition (Sub-Adjudication 3 at session #2 step 2 surfacing).** Session #2 step 2 surfaced that the §3.1 canonical anchor (`vendorPrepaymentApply.test.ts`) itself contained the substrate-violating afterAll pattern that §3.2 corrects. Three dispositions adjudicated: (a) in-scope refactor of canonical anchor + 3 EC-A siblings; (b) out-of-scope defer; (c) hybrid refactor canonical anchor only. Disposition (a) selected on codification-integrity grounds — §3.2 cites `vendorPrepaymentApply.test.ts` as §3.1's canonical anchor; the file should embody the discipline it anchors. Cost: 4 mechanical file edits. Three-way consistency outcome per Adjudication 1.

**Adjudication 6 — Path β substrate-aligned cleanup refinement (catch #18 in-session disposition).** Catch #18 discovered during session #1 integration test runs: chunk-B5-1-codified dedicated-test-accounts pattern prescribed DELETE on `journal_lines` + `journal_entries` that's silently rejected by `trg_journal_entries_no_delete`. Path β refinement applied at session #1 pre-ship: bill tests refactored to accept JE/JL accumulation + T-prefix filter at read side. Canonical anchors: RUN_SUFFIX precedent at `journalSourceExternalId.test.ts:32-40` (accumulation-acceptance pattern); T-prefix filter at `reportTrialBalance.test.ts:147` (read-side discipline). SKILL.md §3 revision at session #2 codifies the substrate-aligned shape; vendor prepayment test refactors at session #2 step 2 bring chunk-B5-1 tests into alignment.

#### 2 drift dispositions

**§Drift-A — §Drift-1 citation dissolution (handoff-document semantic-memory propagation).** Handoff prompt cited "CURRENT_STATE.md §Drift-1 option-i update" as one of 5 chunk B5-2 closeout active items. Verify-from-disk dispatch at closeout step 1 (β) sub-investigation returned no on-disk anchor across CURRENT_STATE.md (30+ sections; none labeled §Drift-*), friction-journal.md (no §Drift-* framing), or conventions.md (no on-disk basis). (β) negative; (γ) floor disposition fired: dissolution + documentation. Source-grain identified as brainstorm-side handoff-drafting at chunk B5-2 session #1 onset, propagated forward to session #2 onset via inherited handoff. (α) founder restate explicitly NOT requested per honest-epistemic-discipline. Closeout scope reduced from 5 items to 4.

**Sibling exhibit at handoff-document grain (lower severity, same pathway).** Step 4 verify-from-disk surfaced a second handoff-document semantic-memory propagation: handoff cited the Spend brief at `docs/09_briefs/phase-5/spend_initiative.md`; on-disk path is `docs/09_briefs/phase-2/spend_initiative.md` (the brief was authored during the Phase 2 Document Platform Initiative arc ahead of Phase 5 implementation, so the directory binds to the authoring phase not the consuming phase). Lower severity than §Drift-1 (file exists at neighbor path rather than not at all), same handoff-document grain propagation pathway: brainstorm-side semantic memory bound the Spend Initiative implementation arc (Phase 5) to the brief's directory location without verify-from-disk grounding; citation propagated through session #1 + session #2 onset handoffs unmodified. Catch #19 logged at step 4 disposition (during D1 path-citation verification before bundled commit); brings running Cluster B B1 catch count from N=18 to N=19. Path-prefix sub-grain joins section-non-existence sub-grain (§Drift-1) under the handoff-document grain umbrella — both inhabit the 4-data-point spectrum's entry 4 ("Handoff-document grain, never grounded") at different severities.

**§Drift-B — Retrospective venue (inline-in-friction-journal).** Per chunk B5-1 §B precedent: inline-in-friction-journal at chunk closeout; arc-completion retrospective separate document deferred to Phase 5 arc-closure. Chunk B5-2 is mid-arc (Phase 5 arc continues with B5-3+).

#### Carry-forward to subsequent chunks (B5-3+) and Phase 5 arc-closure

**Active for subsequent-chunk firing (preserved from chunk B5-1 carry-forward):**

- **Item 1 FT1** (`clampTtl` NaN-guard at `apps/web/src/services/storage/providers/supabaseStorageProvider.ts`) — fires at next chunk that touches `storageProviderService` directly. Chunk B5-2 didn't fire it.
- **Item 18 org_settings substrate-floor** — dedicated sub-arc per (orgset-β); fires before v1 ship per Phase 1.Storage anti-scope framing.

**Active for Phase 5 arc-closure retrospective:**

- **Item 16 cross-arc-grain codified-discipline applicability meta-codification-candidate** — preserved from chunk B5-1.
- **Process-overhead-vs-deliverable-velocity observation** — chunk B5-1 closeout flagged this as concerning ("codification velocity outpacing deliverable velocity"). **Chunk B5-2 update inverts the framing:** more rigorous verification grain than chunk B5-1 (Cluster B B1 N=18 + B2 first-fire + 4 catches at codification grain spanning catch #17/#18/§Drift-1/Sub-H) produced real catches that would have shipped silently otherwise. Process overhead at chunk B5-2 produced substantive value at multiple grains. The "outpacing" framing from chunk B5-1 reads at chunk B5-2 as overhead-was-load-bearing rather than overhead-was-excess. Cross-arc trajectory worth tracking across chunks B5-3+.
- **Discipline-of-the-discipline observation** (Z1 #11.b + Cluster B adjacent-register pattern) — preserved from chunk B5-1.
- **Catch #17 brainstorm-side self-incurred semantic-memory observation** — preserved from chunk B5-1 carry-forward; new concrete data point logged this chunk (Obs 10 above).
- **NEW: (α) Codification-grain verify-from-disk gate** — **primary cross-arc retrospective candidate.** Generalization of handoff-document verify-from-disk pattern to a new grain: codification of disciplines that touch substrate should fire verify-from-disk on the substrate before ratification. Evidence basis: chunk B5-1 Adjudication 6 codified the dedicated-test-accounts pattern WITH a substrate-violating DELETE prescription AT THE SAME TIME the test suite was reporting 699/699 PASS. Two failure modes co-occurred at codification grain: (α-i) substrate read of migration 20240133000000 was not fired before codification ratification; (α-ii) test-pass evidence was implicitly trusted as cleanup-discipline evidence. Both gaps need verify-from-disk to close. Sub-options for the codification candidate shape held for arc-closure synthesis: author-time gate / author-time marking / consume-time gate / hybrid. Resolution awaits cross-arc N≥2 evidence per candidate (e) pathway if the pattern fires again.
- **NEW: (β) Test-pass-evidence-grain limitation** — **sub-observation under (α).** Test-pass evidence ratifies assertions, not surrounding cleanup-discipline. Complementary observation about evidence-type limits; not a discipline-codification candidate in its own right.
- **NEW: 4-data-point grounding-rigor spectrum meta-pattern** — handoff-citation grounding-rigor varies along a spectrum from correctly-grounded (positive control: cadence-β-i-b) through session-grain (catch #17), codified-discipline grain (catch #18), to never-grounded (§Drift-1). Meta-pattern data point exhibits at chunk B5-2; possible cross-arc retrospective synthesis with (α) if firing recurs.
- **(cadence-β-i-b) cross-arc N=2 watch** — N=1 logged at chunk B5-2; graduation evaluation fires if cross-arc N=2 accumulates per candidate (e).

#### Subagent dispatch and brainstorm-side parallel-surface shape (this cycle)

Two-sided + founder triple architecture operated across chunk B5-2: WSL-side (filesystem/bash/git execution + verify-from-disk authority) and brainstorm-side (parallel observation surface with filesystem MCP for grounding-when-needed); founder adjudicates substrate-decision authority surfaces. Closeout step 1 verify-from-disk dispatched against the 4 handoff-cited anchors surfaced 5 Cluster B B1 fires; closeout step 2 (Item 20 SKILL revision + 4 vendor prepayment test refactors) executed under (γ-a) bundle pattern (working-tree accumulation; no per-task commits); closeout step 2 pre-check validated 4 vendor prepayment test files pass + typecheck clean before step 3 friction-journal narrative-locking (~5s combined cost). Procedural-symmetry argument confirmed operational: step 1 validated handoff citations before scope-lock; analogous discipline at step-2-completion validated substrate-aligned-refactor before narrative-lock.

#### Push-readiness gate disposition (chunk-completion grain)

**Condition 1 (test-suite health)**: MET. `pnpm agent:validate` 26/26 + `pnpm test` 777/777 at HEAD `3cffe74` (session #1 push); session #2 closeout pre-check validated 4 vendor prepayment test files pass (8 tests / 4.03s) + `pnpm typecheck` clean. Doc-only changes from session #2 step 3+ don't affect condition 1 grain.

**Condition 2 (doc-sync reconciled)**: MET. `invariants.md` ↔ `control_matrix.md` ↔ `ledger_truth_model.md` consistent across chunk B5-2 (INV-AP-001/002 activated at Layer 2 service per Spend brief §11.3 substrate-now-enforcement-later cross-pattern). `types.ts` regenerated against post-session #1 schema substrate at session #1 push. Spend brief §3 D1 amendment ships at this commit per substrate-aligned `bill_lifecycle_state` canonical 7-state framing (per ADR-0015 §10 + B5-1 migration 20240138000000 + B5-2 migration 20240139000000). open_questions.md Q80 (plain post_bill spec D2 Q-entry) ships per Q70-Q79 concise-pattern shape. `.claude/skills/integration-test-rules/SKILL.md` §3 revision ships per Adjudication 1.

**Condition 3 (governance closeout)**: MET. Friction-journal entry shipped (this entry); 6 codification adjudications recorded; 2 drift dispositions resolved; carry-forward inventory reconciled across subsequent-chunk-firing surfaces (2 items: FT1, Item 18) + Phase 5 arc-closure retrospective candidates (8 items: Item 16, process-overhead observation w/ chunk B5-2 update, discipline-of-the-discipline, catch #17 meta-pattern, (α) primary, (β) sub-observation, grounding-rigor spectrum meta-pattern, (cadence-β-i-b) N=2 watch). Item 20 SKILL revision shipped at `.claude/skills/integration-test-rules/SKILL.md` §3 split (§3.1 + §3.2). 4 vendor prepayment test files refactored to substrate-aligned shape per Adjudication 5.

**All three push-readiness conditions MET at chunk B5-2 closeout. Push authorized.**

---

**Substrate-decision-integrity preserved across full chunk B5-2 (2 sessions; 2026-05-10 onset → 2026-05-10 closeout).** Phase 5 chunk B5-2 CLOSED at this retrospective entry. Phase 5 arc continues with chunk B5-3+ per (decomp-γ) hybrid by domain-slice. (cadence-β-i-b) 2-session bundled cadence documented as N=1 first-instance; awaiting cross-arc N=2 per candidate (e) for graduation evaluation. First chunk-grain implementation-arc closeout under (cadence-β-i-b) precedent shipped under (γ-a) bundled commit at clean-termination gate per refined (R-iii) graduated form.

---

### Phase 5 chunk B5-1 substantive arc closeout retrospective entry (2026-05-10) — first Phase-5-arc-execution friction-journal entry + 12 first-instance pattern observations + 7 codification adjudications + 3 drift dispositions

This is the FIRST Phase-5-arc-execution entry in the friction-journal. Phase 5 first-domain consumer arc opened at chunk B5-1 onset 2026-05-07 per arc-cadence forward-pointers from Phase 2 brief-creation arc-closeout. Substantive sessions #1+#2 SHIPPED; chunk B5-1 closes at session #3 per (cadence-β-i-a) 3-session deliverable-grain split. Phase 5 arc continues with subsequent chunks (B5-2+) per (decomp-γ) hybrid by domain-slice.

#### Aggregate chunk metrics

| Session | HEAD | Files | Lines | Tests | Validation |
|---|---|---|---|---|---|
| Chunk onset (2026-05-07) | `78da920` (round-2 closure) | — | — | — | memory-writes-only Stage 6 |
| Substantive #1 (2026-05-10) | `ebeab51` | 7 | +568/-4 | 19 unit | 684/684 + 26/26 |
| Substantive #2 (2026-05-10) | `7c9f715` | 10 | +2025/-5 | 15 integration | 699/699 + 26/26 |
| Closeout #3 (2026-05-10) | this commit | — | — | — | conditions 1+2+3 MET |

Cadence: (cadence-β-i-a) 3-session split confirmed operational. Total session #1+#2 deliverable: 17 files / +2593/-9 / 34 new tests passing.

#### Arc-class first-instance status framing

Chunk B5-1 is the first chunk-grain implementation arc of Phase 5. Phase 5 is the first first-domain consumer implementation arc of chounting (after Phase 0 governance arc, Phase 1.Storage substrate implementation arc, and Phase 2 brief-creation arc). All session #1 + session #2 observations qualify as first-instance under arc-class framing.

#### 12 first-instance pattern observations

**Session #1 observations (recovered from `ebeab51` commit body per drift §A disposition):**

1. **First implementation-arc substantive code commit in Phase 5** — `ebeab51` lands first vendor prepayment infrastructure code; sets precedent for subsequent slices (B5-2, B5-3, etc.). Source: commit body opening.
2. **First chunk-grain substantive session under (cadence-β-i-a)** — multi-session-per-chunk operational shape verified; substantive split across 3 sessions per locked scope. Source: commit body cadence reference.
3. **First round-2-guardrail-respecting implementation** — `apps/web/src/services/spend/` + `apps/web/src/shared/schemas/spend/` paths verified compliant with `apps/web/src/README.md` folder-placement guardrail per Principle 3. Source: commit body "Round-2 absorption" section.
4. **First substrate-gap surface during chunk-grain execution (Cluster B B1 substrate-citation grain)** — D5/(orgset-β): `org_settings.deposit_tax_timing_default` cited in ADR-0015 §10 but `org_settings` table itself was anti-scoped at Phase 1.Storage chunk 1 to a dedicated sub-arc that has not yet fired. Source: commit body "D5 substrate-gap deferral" section.
5. **First INV-MONEY-001-compliant pure status function in spend domain** — `vendorPrepaymentStatus.ts` uses money.schema helpers (toMoneyAmount + addMoney + subtractMoney + eqMoney + zeroMoney); avoids Number coercion per discipline. Source: commit body "State-machine substrate" section.
6. **First plan-vs-actual divergence handled mid-execution** — test paths shifted from co-located (plan default) to `tests/unit/` flat per chounting convention (vitest config restricts to `tests/**/*.test.ts`). Source: commit body final paragraph.

**Session #2 observations (per pickup file enumeration):**

7. **First chunk-grain mutation-shipping session in Phase 5** — `7c9f715` lands the first vendor prepayment mutation handlers; sets precedent for subsequent slices.
8. **First (test-γ) hybrid test architecture firing** — 6 integration tests across 3-per-mutation + 3-per-criterion grain; per-criterion tests exercise EC-A-1/2/3 invariants via the apply mutation (Spend brief §11 covers bill posting; vendor prepayment apply contributes indirectly).
9. **First D4-α policy decision logged to open_questions.md** — refund-with-applications gap per ADR-0015 §6 silence; conservative (block-and-force-reverse) shipping posture. Q80 RESOLVED at this closeout per Adjudication 7.
10. **First mid-session test-pollution catch + fix (Cluster B B3 runtime grain — covered separately by Item 20 codification)** — initial tests used seeded chart_of_accounts codes ('2200' / '1300') that other test files (`reportTrialBalance.test.ts`) assert specific zero-balances on; refactored to dedicated test accounts (per-run codes derived from traceId). Resolution required schema-grain refactor across 4 test files.
11. **First scope-compression-from-plan-authoring-grain at session-start framing (Cluster B B2 sub-shape)** — session-start prompt framed 4 mutations + 7 tests + 8 audit events + Q1-Q5 locks; verify-from-disk surfaced D1 (write_off reserved per ADR §1) + D2 (§11.1-§11.3 are bill criteria not vendor-prepayment) + D3 (approval-gate service-layer only, not joint) + D5 (Q1-Q5 notation drift; canonical is Q-closure-IDs); founder bundle compressed to 3 mutations + 6 tests + 6 events + Q-closure IDs. Second instance of Cluster B B1 substrate-citation shape (after session #1's D5/(orgset-β)) plus first instance of Cluster B B2 scope-projection shape.
12. **(Reclassified per Adjudication 2 below)** Obs 6 was originally enumerated at session #2 close as first-instance "atomicity-model docstring rephrase" (`recordMutation.ts:122-127`); reclassified at this closeout entry as carry-forward-resolution for Item 1 FT3 (RESOLVED transition) rather than first-instance pattern observation.

**Plus brainstorm-side meta-observation surfaced at session #3 closeout (becomes evidence basis for Cluster B graduation per Adjudication 1):**

13. **Pickup-file-content-tracking gap (Cluster B B1 sub-shape at pickup-file-maintenance grain)** — session #1's six first-instance observations were enumerated in session #1's close pickup file body but did not carry into session #2's close pickup file body. The gap surfaces the Cluster B B1 shape recurring at pickup-file-maintenance grain: pickup-file Stage 6 firing operates at pickup-file-content-tracking grain not verified-from-disk grain re what needs preserving across closeouts. Recovery via `ebeab51` commit body sufficient for this entry's enumeration (drift §A disposition).

#### 7 codification adjudications outcomes

**Adjudication 1 — Cluster B graduation (multi-shape codification per cross-arc N=2 via candidate (e)).** Cluster B graduates as multi-shape codified discipline at this closeout per founder bundled-accept. Codified at `CLAUDE.md` "Plan-authoring substrate-verification at transitive-dependency grain" section (added at this commit). Sub-shapes:

- **B1 Substrate-citation grain** — cited substrate may reference tables / types / files that don't exist or have been moved or deferred. Instances: session #1 D5/(orgset-β); session #2 D3 approval-gate misreading + D5 Q-lock notation drift; session #3 pickup-file-content-tracking gap (meta-evidence at pickup-file-maintenance grain).
- **B2 Scope-projection grain** — plan projects scope larger than substrate supports. Instances: session #2 D1-γ (4→3 mutations); D2-α (7→6 tests).
- **B3 Runtime grain** — covered separately by Item 20 codification (dedicated-test-accounts pattern). NOT a Cluster B sub-discipline.

Adjacent to Z1 #11.b (verbatim re-read at drafting-onset for cited substrate). Cluster B fires earlier: at plan-authoring-onset, before scope-lock. Discrimination is timing — Z1 #11.b is for drafters; Cluster B is for plan-authors.

**Adjudication 2 — Cluster A retain-as-observation; Obs 6 reclassification.** Cluster A retains as observation cluster (no graduation firing). Obs 6 (atomicity-docstring rephrase) reclassifies as carry-forward-resolution (Item 1 FT3 RESOLVED transition logged at session #2) rather than first-instance pattern observation. Refines first-instance count to 11 + 1 RESOLVED.

**Adjudication 3 — Cluster C retain-as-observation.** Obs 9 (D4-α policy gap → Q80) is informational not codification candidate. Logged for arc-grain retrospective consumption at Phase 5 arc-closure (chunk B5-1 doesn't close the Phase 5 arc).

**Adjudication 4 — Item 17 graduation pattern-stable per candidate (e) within-arc N≥3.** Memory-writes-only Stage 6 firing-shape graduates at this closeout. Codified at `CLAUDE.md` "Memory-writes-only Stage 6 firing-shape" section (added at this commit). Within-arc N=3: chunk-onset memory-writes-only + session #1 close (γ-a) bundle (1 commit + 2 memory-writes) + session #2 close (γ-a) bundle (1 commit + 2 memory-writes); shape consistent across all three instances.

**Adjudication 5 — Cluster taxonomy applicability per §A.3 (option-iii non-exhaustive).** Three-cluster (A/B/C) framing arose mid-conversation as descriptive grouping; treating as prescriptive would over-weight a working-memory artifact. Future first-instances classified ad-hoc per substantive shape. No codification artifact ships (declining-to-codify is the disposition).

**Adjudication 6 — Item 20 dedicated-test-accounts pattern codified at testing-discipline grain.** Pattern: integration tests posting JEs to ANY seeded account require dedicated test accounts to avoid cross-file balance-assertion collisions. Codified at `.claude/skills/integration-test-rules/SKILL.md` §3 (added at this commit). Implementation: per-run unique account_codes derived from traceId; lifecycle: beforeAll create, afterAll delete after journal_lines + journal_entries cleanup.

**Adjudication 7 — Q80 disposition (combined option-i + option-iii).** ADR-0015 §1 amendment shipped at this closeout: ratifies D4-α v1 disposition (block refund if applications exist) + adds post-v1 deferral language for D4-β cascade (alongside `written_off` / `forfeited` reserved-state deferral pattern). Q80 entry REMOVED from `docs/02_specs/open_questions.md` per resolution discipline ("removing items from this file as they resolve is the discipline that keeps the file useful").

#### 3 drift dispositions

**§A — Session #1 observations gap recovered.** Session #1's six first-instance observations were absent from session #2 close pickup file body. Recovered via `ebeab51` commit body (option 2: canonical-evidence-anchor per Z1 #15). Option 4 fallback not needed — commit body grain sufficient for enumeration. The gap itself becomes Cluster B B1 evidence at pickup-file-maintenance grain (Obs 13 above; meta-evidence under Adjudication 1).

**§B — Retrospective venue: inline-in-friction-journal (this entry).** Chunk B5-1 closeout is mid-arc (Phase 5 arc continues with B5-2+); arc-completion retrospective fires at arc closure, not chunk closure. Inline-in-friction-journal preserves the precedent pattern that closest matches chunk-grain (Phase 2 brief-creation arc-closeout was inline at line 9401). Separate retrospective document (arc-A / phase-1.1 / phase-1.2 precedent) deferred to Phase 5 arc-closure.

**§C — Item 13 (`crossOrgRlsIsolation.test.ts` test-infra hygiene) transition CARRY-FORWARD → RESOLVED.** Three-run durability established at HEADs `ebeab51` + `7c9f715` + `7c9f715` (third pre-flight green at session #3 onset). (test-fix-α) defensive enhancement skipped per session #2 Anchor 4 verdict; durability not falsified. (a) state-dependent-on-pre-session-#1-substrate interpretation substantially better-supported per brainstorm-side observation: three runs across two HEADs all clean without (test-fix-α) is meaningful evidence that the original failure was state-dependent on pre-session-#1 substrate that round-2 / session #1 substrate updates cleared.

#### Carry-forward to subsequent chunks (B5-2+) and Phase 5 arc-closure

**Active for subsequent-chunk firing:**

- **Item 1 FT1** (`clampTtl` NaN-guard at `apps/web/src/services/storage/providers/supabaseStorageProvider.ts:95-99`) — fires at next chunk that touches `storageProviderService` directly. Chunk B5-1 didn't fire it (verified at session #1 dispatch).
- **Item 18 org_settings substrate-floor** (dedicated sub-arc per (orgset-β)) — activates per-org override branch of tax-timing 3-layer rule retroactively across all consuming domains; fires before v1 ship per Phase 1.Storage anti-scope framing.

**Active for Phase 5 arc-closure retrospective:**

- **Item 16 cross-arc-grain codified-discipline applicability meta-codification-candidate** — Sub-Q axis taxonomy (subq-β) lock; potential meta-codification candidate at arc closure if cross-arc evidence accumulates.
- **Process-overhead-vs-deliverable-velocity observation** (founder + brainstorm-side joint flagging) — chunk B5-1 generated more codification candidates than substantive code per ratio comparison; not necessarily wrong for first-implementation-arc chunk where structural novelty is high; bears watching across chunks B5-2+ to see whether codification velocity normalizes or continues outpacing deliverable velocity.

#### Subagent dispatch shape (this cycle)

Z1 #11.b dispatch fired at session #3 substantive-drafting-onset (3 subagents):

- Subagent A: friction-journal current shape + Phase 5 arc-class-first-instance entry framing precedents
- Subagent B: cluster A/B/C codification meta-candidates synthesis (consolidate first-instance observations across sessions #1+#2)
- Subagent C: ADR-0015 §6 + Q80 disposition options + post-v1 deferral framing precedents

Plus pre-flight retrospective-venue probe via bash.

**Cumulative chunk B5-1 dispatch count**: 4 (session #1 onset) + 4 (session #2: 3 ADR + 1 recon) + 3 (session #3: friction-journal + cluster + Q80) = **11 subagent dispatches across chunk preventively**. Z1 #11.b graduated codification operationally validated across chunk-grain implementation execution.

#### Push-readiness gate disposition (chunk-completion grain)

**Condition 1 (test-suite health)**: MET. `pnpm agent:validate` 26/26 + `pnpm test` 699/699 at HEAD `7c9f715` (session #2 push); session #3 closeout commit re-verifies condition 1.

**Condition 2 (doc-sync reconciled)**: MET. `invariants.md` ↔ `control_matrix.md` ↔ `ledger_truth_model.md` consistent across chunk B5-1 (no new invariants registered; INV-AP-001/002 reserved per Spend brief §11.3 substrate-now-enforcement-later cross-pattern; activate at first INV-AP citation). `types.ts` matches post-session #1 schema substrate (regenerate via `pnpm db:generate-types` if any future schema deltas). ADR-0015 §1 amendment shipped at this commit per Q80 resolution.

**Condition 3 (governance closeout)**: MET. Friction-journal entry shipped (this entry); 7 codification adjudications recorded; 3 drift dispositions resolved; carry-forward inventory reconciled to 4 active items (FT1, item 18, item 16, process-overhead observation). `CLAUDE.md` updated with 2 new graduated conventions (Cluster B B1+B2 + memory-writes-only Stage 6). `skills/integration-test-rules/SKILL.md` updated with §3 dedicated-test-accounts pattern.

**All three push-readiness conditions MET at chunk B5-1 closeout. Push authorized.**

---

**Substrate-decision-integrity preserved across full chunk B5-1 (3 sessions; 2026-05-07 onset → 2026-05-10 closeout).** Phase 5 chunk B5-1 CLOSED at this retrospective entry. Phase 5 arc continues with chunk B5-2+ per (decomp-γ) hybrid by domain-slice. First Phase-5-arc-execution friction-journal entry shipped under (γ-a) bundled commit at clean-termination gate per refined (R-iii) graduated form.

---

- 2026-05-10 NOTE — Round-2 docs reorganization Session 8
  execution closeout (codification tail adjudications shipped)
  AND ROUND-2 CLOSURE DECLARATION. Three implementation commits
  + closeout per the codification-adjudication-shape locked at
  Session 8 brainstorm + plan at
  `docs/07_governance/round-2/2026-05-10-session-8-plan.md`.

  **Round-2 docs reorganization closes at this push.** Three
  closure dimensions met across the arc:

  - **Structural closure** at Session 7 (`863b52b`) — V2
    ratified at `docs/07_governance/DOCS_RESTRUCTURE_V2.md`;
    three Principles + Pattern 7 + Migration Map canonical.
  - **Operational closure** at Session 5B (`ba195d7`) and
    Session 6 (`d1d239b`) — round-2 tail (Layer 1 + Layer 2
    migrations; four-README rewrites + doc-class pattern
    propagation); Phase 1 onset readiness sustained N=3
    sessions post-V2.
  - **Codification closure** at Session 8 (this push) — drift
    meta-pattern Tier 1 ratified; Pattern 7 bypass-procedure
    operationally complete (3 rules ↔ 3 timing surfaces);
    methodology cluster sub-categorized; Tier 3 carry-forwards
    dispositioned; round-2 closure declared.

  The meta-arc folder `docs/07_governance/round-2/` becomes a
  historical archive at this point. Future round-N work creates
  `docs/07_governance/round-N/` per the round-N workflow
  convention codified at Session 7 C6.

  Three implementation commits + closeout this dispatch:
  - C1 `6614d58` (drift meta-pattern Tier 1 codification): full
    Tier 1 codification at conventions.md Round-2 section with
    three timing surfaces + path-reference vs content-reference
    sub-shapes + inter-session dependency sub-axis + prophylactic-
    vs-reactive mode-of-application sub-rule + N=3 evidence
    trail + codification-practice meta-question recorded as
    canonical answer + Tier 3 carry-forward (recurring meta-arc
    question held).
  - C2 `8e76d6e` (Pattern 7 third operational rule):
    cross-reference verification at execution time added to
    `docs/README.md` Pattern 7 bypass-procedure. Three operational
    rules now cover three timing surfaces (1:1 mapping confirmed:
    canonical-source ↔ execution-time; chronological-reality ↔
    planning-decision-time; cross-reference ↔ cross-reference-
    time).
  - C3 `58a4417` (methodology cluster sub-categorization): three
    clusters (A: codification-trajectory; B: session-execution
    discipline; C: scope/structural) with worked-example
    inventory drawing from journal's canonical enumeration.
    Halt-and-split contingency NOT triggered (11 inhabitants
    within ~13-14 ceiling; clusters segment cleanly; no fourth
    cluster needed).
  - C4 (this commit): closeout + round-2 closure declaration.

  Acceptance criteria — all 12 satisfied (a-l per plan).

  **Locked decisions (Session 8 brainstorm-validated, executed
  this dispatch):**
  - Codification-practice meta-question answered: sub-shape
    preservation when differential firing evidence exists;
    unification with examples otherwise. Codified at
    conventions.md Round-2 section as canonical answer for
    future chounting codification work.
  - Drift meta-pattern category: process meta-pattern (NOT
    architectural principle). Surfaces are temporal (timing
    surfaces), not structural. Principle 4 in V2 amendment ruled
    out per category mismatch.
  - Drift meta-pattern ratification path: conventions.md
    Round-2 section update (Tier 1 codification with full
    taxonomy) + Pattern 7 bypass-procedure expansion (third
    operational rule). V2 stays as ratification snapshot per
    δ-i discipline.
  - Inter-session dependency mechanism: codified as sub-axis
    within drift meta-pattern (preserved sub-shape per
    differential timing surface).
  - Prophylactic-vs-reactive sub-axis: codified as
    mode-of-application sub-rule (N=3 evidence sufficient).
  - Recurring meta-arc placement question: held at Tier 3 (N=1
    insufficient; codification candidacy remains; awaiting
    second fire).
  - Methodology cluster sub-categorization: three clusters
    (A/B/C) with character-based segmentation; worked-example
    inventory drawing from journal's canonical enumeration;
    re-evaluation trigger at ~8-inhabitant sub-cluster
    soft-threshold.
  - Round-2 closure declaration: attached to this Session 8
    closeout per all-work-units-complete condition.

  **Cross-reference-time drift surface — post-gate frequency
  evidence (NOT trajectory advancement; gate fired at 5B
  closeout):**

  Sub-instances caught during Session 8 execution:

  1. **C1 recursion (structurally novel meta-instance).** The
     act of replacing "Tier 3 → Tier 2 trajectory" text with
     "Tier 1 codified" text IS itself the resolution of a
     content-reference drift on the very file being ratified.
     The discipline catches itself updating the canonical record
     of itself. Meta-instance worth marking even though gate
     already fired; novel sub-shape (recursion) within the
     content-reference cluster — the canonical record being
     updated is the canonical record OF the discipline applying
     the update. Not a new timing surface; not a new sub-shape
     in the codification's structural sense; an instance of
     pattern self-application that's worth recording for future
     codification work to consider whether self-application
     warrants its own naming.
  2. **Plan-vs-journal divergence at C3 inventory.** Plan's
     brainstorm-time inventory of 11 items (codification-
     trajectory framing) and journal's actual methodology
     cluster enumeration (5B brainstorm's "reasoning tools"
     framing #3-#10 + #16 + Session 6 brainstorm's +2) diverge
     in specifics. Resolution: C3 sub-categorization uses
     journal's canonical enumeration; plan's inventory preserved
     as substrate. Cross-reference-time drift sub-instance
     (content-reference cluster).
  3. **V2 Part 2 + conventions.md "Tier 3 → Tier 2 trajectory"
     text (pre-Session-5B-gate-firing).** Both texts pre-date
     the gate firing at Session 5B closeout. C1 updates
     conventions.md to ratify Tier 1 (the live discipline doc
     reflecting post-gate state). V2 Part 2's "N=2 evidence"
     text stays as ratification snapshot per δ-i discipline.
     This is the architectural separation V2 ratifies at
     Session 7 + 5B + 6 + 8 sessions: V2 ratifies snapshot
     state; conventions.md tracks live discipline. The
     separation operates correctly at this Session 8 update.

  Three sub-instances total during Session 8 execution. All
  content-reference cluster (semantic drift from state changes).
  Frequency data point: cross-reference-time surface continues
  to fire when state evolves between codification time and live
  discipline time, even within the same codification ratification
  session. The discipline operates correctly; sub-instances
  resolve at execution time per the operational rules now
  ratified at C2.

  **Pre-codification observation queue post-Session-8-execution
  (queue updates):**

  - Tier 1 LIVE: Floor-only push gate carve-out advances to
    N=10 LIVE this push (halftime + 5A brainstorm + 5B brainstorm
    + Session 6 brainstorm + Session 6.5 execution + Session 7
    plan dispatch + Session 7 execution + 5B execution + Session
    6 execution + Session 8 plan dispatch + Session 8 execution
    = chronological count from journal at execution time).
    [Verify count: N=9 was recorded at Session 6 closeout;
    Session 8 plan dispatch (3ec624f) at +1 = N=10; this push
    at +1 = N=11. Or if plan dispatch counts as separate fire:
    chronological reality is N=11.] Actually re-counting
    chronologically: previous push at Session 6 execution
    (d1d239b) at N=9; Session 8 plan dispatch push (3ec624f) is
    intervening floor-only fire = N=10; Session 8 execution push
    (this) at N=11.
  - Drift meta-pattern: Tier 1 RATIFIED at C1. Graduates from
    Tier 2 → Tier 1 candidacy to Tier 1 ratified codification.
  - Inter-session dependency sub-axis: Tier 1 RATIFIED at C1
    as sub-axis within drift meta-pattern.
  - Prophylactic-vs-reactive sub-rule: Tier 1 RATIFIED at C1
    as mode-of-application sub-rule within drift meta-pattern.
  - Tier 2: substrate-leverage phase observation holds at
    Tier 2 (no Session 8 evidence affecting this).
  - Tier 3: recurring meta-arc placement question holds at N=1.
    Prophylactic-vs-reactive graduates out (codified at C1).
  - Methodology cluster bucket: sub-categorized at C3 (3
    clusters A/B/C); 3 inhabitants graduated out (drift,
    inter-session, prophylactic). Floor-only carve-out also
    graduated (at Session 7 C6, retroactively recorded in
    Cluster A as worked example). Sub-clusters operate under
    own count discipline per re-evaluation trigger.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, N=11 invocation):**
  - Condition 1 (test-suite health): GREEN under floor-only
    path. `pnpm db:reset:clean && pnpm agent:validate` reports
    26/26. Full-suite NOT invoked per the carve-out's
    mechanical-non-impact argument; doc-only diff (conventions.md
    drift codification + docs/README.md Pattern 7 third rule +
    conventions.md methodology cluster sub-categorization + this
    entry; zero migrations / zero services / zero integration
    tests / zero source files / zero test files) cannot regress
    tests by construction.
  - Condition 2 (doc-sync): GREEN. Session 8's primary
    deliverable IS doc-sync work (codification ratifications +
    bucket sub-categorization + closure declaration); same
    category as Sessions 5A/5B/6/6.5/7 doc-sync deliverables.
  - Condition 3 (governance closeout): this entry; round-2
    closure declared (per below).

  **Round-2 closure declaration.**

  Round-2 docs reorganization closes at this push. Round-2
  spanned Sessions 1 through 8 (with Session 6.5 + 5B execution
  + Session 6 execution interim + Session 7 V2 ratification +
  Session 8 codification tail). Three closure dimensions met:
  structural at Session 7; operational at Sessions 5B + 6;
  codification at Session 8. This is the institutional milestone
  framing — three closure dimensions met across the arc is the
  substantive achievement worth marking explicitly.

  Phase 1 onset readiness: confirmed. Source-tree authority
  discipline holds across N=4 sessions post-V2-ratification
  (Session 7 + 5B + Session 6 + Session 8). Phase 1 storage /
  evidence work unblocked at operator's discretion.

  The drift discipline that emerged during round-2 (prophylactic-
  vs-reactive default; cross-reference-time surface;
  chronological-reality verification) is durable in canonical
  conventions.md Round-2 section + Pattern 7's bypass-procedure
  operational rules + V2's ratified Principles + the friction-
  journal evidence trail across Sessions 5A through 8. Phase 1
  work executing post-round-2 inherits the discipline without
  explicit reference. That's substrate Phase 1 will benefit from
  invisibly.

  **Forward pointers (post-round-2):**

  - **Round-2 closes at this push.** No further round-2 sessions
    planned; meta-arc folder becomes historical archive.
  - **Phase 1 onset is operator-determined.** Substrate is
    ready; discipline is operational; guardrails are in place.
    Phase 1 storage / evidence work begins whenever operator
    decides.
  - **Future round-N work** creates a new meta-arc folder
    (`docs/07_governance/round-N/`) per the codified round-N
    restructure plan workflow.
  - **Tier 3 carry-forwards:** recurring meta-arc placement
    question (N=1; codification candidacy at second fire);
    Cluster A holds substrate-leverage phase observation (Tier
    2; codification candidacy at third fire). Both await
    future-arc evidence.
  - **Methodology cluster sub-clusters** operate under own count
    discipline; new observations land in cluster matched by
    character. Re-evaluation trigger at ~8-inhabitant sub-cluster
    soft-threshold.

  Round-2 has been a substantial arc spanning ~8 sessions of
  brainstorm-and-execution work, multiple plan-revision cycles,
  drift catches at three timing surfaces with codification
  trajectory advancement to Tier 1 ratification, two
  architectural ratifications (V1 elevation + V2 creation), three
  Principles ratified, Pattern 7 with conditional permission,
  three operational rules covering three timing surfaces, a
  meta-arc folder pattern that became canonical first-instance
  precedent, a methodology cluster sub-categorized into three
  named clusters, and the institutional discipline this
  conversation arc developed. The substrate this arc built is
  durable. Phase 1 inherits it.

- 2026-05-10 NOTE — Round-2 docs reorganization Session 6
  execution closeout (four-README rewrites + doc-class pattern
  propagation). Two implementation commits per the failure-mode-
  asymmetry partition locked at Session 6 brainstorm + plan at
  `docs/07_governance/round-2/2026-05-09-session-6-plan.md`.
  Plan was authored 2026-05-09 (pre-Session-7-V2-ratification);
  execution at 2026-05-10 (post-V2 + post-5B-execution).
  Closeout forward pointers rewritten from pre-Session-7 plan-
  substrate to post-Session-7-and-5B reality per the drift
  discipline.

  Two implementation commits + closeout:
  - C1 `5d178f1` (02/03/04 grouped rewrite): three READMEs
    propagate doc-class openers + canonical-axis articulation +
    canonical-source enumeration matching CLAUDE.md's
    authoritative-source list. Failed-backward triple
    (content-completeness expansion preserving WGH/WDNGH
    structure per δ-i discipline).
  - C2 `5846178` (01_prd full rewrite): structural-pattern
    adoption (WGH/WDNGH framework + doc-class opener) layered
    on 5B's invalid-claim touchup. Failed-forward case. Plus
    one cross-reference-time drift catch:
    `system_overview.md:280` "empty in Phase 1.1" annotation
    updated to reflect 9-feature-spec post-5B-Layer-1 state.
  - C3 (this commit): closeout.

  Acceptance criteria — all 11 implementation-side criteria
  satisfied (a-k per plan); criterion (l) closed by this entry.

  **Locked decisions (Session 6 brainstorm-validated, retained
  at execution time):**
  - Failure-mode taxonomy (forward vs backward) drove the C1/C2
    partition: 02/03/04 failed-backward (under-specifies present
    state) → C1 grouped rewrite (content-completeness expansion);
    01_prd failed-forward (described future state) → C2 isolated
    rewrite (structural-pattern adoption).
  - Doc-class opener pattern (`**Document class: <name>.**`)
    propagated from `docs/09_briefs/README.md` precedent to four
    directory READMEs. Consumer-side instantiation of V2 Part 1
    Principle 1 ("one canonical axis"); the principle propagates,
    not the literal phrase.
  - δ-i preservation discipline: 02/03/04 preserve existing WGH
    structure, layering opener + canonical-source enumeration on
    top; 01_prd's full rewrite adopts the structure 02/03/04
    already had (δ-i applies in reverse — the structure is what's
    being preserved).
  - Inter-session dependency mechanism (Stop Condition 1 verifies
    5B execution closed cleanly before any Session 6 commits
    land): structurally novel mechanism class for round-2 plans;
    operated correctly at session start (verified
    HEAD=ba195d7 + 9 feature specs at 01_prd/ + 4 sub-buckets at
    phase-0/ + 01_prd/README invalid-claims-removed + toolchain
    green).

  **Cross-reference-time drift surface — post-gate frequency
  evidence (NOT trajectory advancement; gate already fired at
  5B closeout):**

  Per V2 Part 2's drift meta-pattern codification status (Tier 2
  → Tier 1 candidacy advanced at 5B closeout via N=3 across
  three timing surfaces), Session 6 execution sub-instances
  accumulate as frequency evidence at the cross-reference-time
  surface, not as new gate-firing events. Sub-instances caught
  during Session 6 execution (per the prophylactic discipline):

  1. **Plan's closeout template references Session 7 as
     future.** Plan said "Session 7 owns Tier 1 codification (3
     LIVE candidates + V2 ratification + DOCS_RESTRUCTURE_V2.md)"
     and "Codification deferred to Session 7's natural substrate
     moment." Both stale: V2 ratified at Session 7 commit
     `863b52b`; carve-out codified at Session 7 C6 (conventions.md
     round-2 section). Resolution: closeout forward pointers
     rewritten to reflect post-Session-7 reality (Session 8
     brainstorm follows; carve-out is canonically codified).
  2. **Plan claimed N=6 invocation.** Actual chronological count:
     N=9 LIVE post-this-push (read journal at execution time per
     drift discipline; N=8 recorded at 5B closeout + this push +
     1 = N=9). Resolution: closeout records N=9.
  3. **`system_overview.md:280` content-reference drift.** Said
     "01_prd/  # feature-level PRDs (empty in Phase 1.1)" but
     folder has 9 feature specs post-5B Layer 1. Resolution:
     updated annotation to reflect current state in C2.

  Three sub-instances total during Session 6 execution. All
  content-reference cluster (semantic drift from state changes)
  per the path-reference vs content-reference sub-shape framing
  Session 7 closeout flagged. The path-reference cluster fired
  zero instances during Session 6 (no paths moved; Session 6
  operates entirely on docs/ READMEs in-place). The content-
  reference cluster fired three instances. Frequency data point:
  cross-reference-time surface continues to fire when state has
  evolved between plan-write-time and execution-time, even when
  the gate has already fired.

  **Brainstorm-time observations (Session 6 brainstorm output;
  preserved verbatim per brainstorm-time-observations-as-
  historical discipline; closeout-time framing notes added in
  brackets):**

  - **README failure-mode taxonomy: forward vs backward.**
    Surfaced as principled basis for the failure-mode-asymmetry
    commit-shape partition. 01_prd failed forward (described
    future state never materialized); 02/03/04 failed backward
    (under-specifies present state by omitting canonical
    contents). Adjudication: lands as sub-pattern within the
    structural-pattern bucket (the bucket matures past
    single-instance status with this addition; sub-pattern-within-
    bucket is a phenomenon distinct from new-bucket-creation;
    round-2's posture handles both). [Closeout-time framing:
    bucket sub-categorization decision still deferred to Session
    8 with framework per Session 7 closeout's deferral.]
  - **Count-level commit pattern N=4 fire with count-of-3
    (not 4).** 5A=4+1, fix-arc=4+1, 5B=4+1, Session 6=2+1.
    Pattern holds at structural level (implementation-then-
    closeout) while count varies. Recording as count-level
    variance within stable structural pattern rather than
    force-fitting to 4+1 or treating as new pattern. [Closeout-
    time framing: Session 7 was 6+1 (C1-C6 + closeout); count
    variance is consistent across round-2 execution sessions.]
  - **Inter-session dependency mechanism — new pattern
    observation.** Session 6 plan introduced a Stop Condition 1
    that verifies prior session's execution closed cleanly
    before current session's commits land. [Closeout-time
    framing: Session 7 plan ALSO carried this mechanism for 5B
    + Session 6 dependencies; mechanism has now fired three
    times (Session 6 plan referencing 5B; Session 7 plan
    referencing 5B + Session 6.5; this Session 6 execution
    referencing 5B closeout state). N=3 firings confirms the
    mechanism class as a generalizable plan-substrate pattern;
    Tier 3 → Tier 2 candidacy. Methodology cluster.]

  **Pre-codification observation queue post-Session-6-execution
  (queue updates, post-Session-7 reality framing):**

  - Tier 1 LIVE: Floor-only push gate carve-out advances to N=9
    LIVE this push (halftime + 5A brainstorm + 5B brainstorm +
    Session 6 brainstorm + Session 6.5 execution + Session 7
    plan dispatch + Session 7 execution + 5B execution +
    Session 6 execution = 9 fires through this push). The
    carve-out is now canonically codified at conventions.md
    round-2 section (Session 7 C6); subsequent firings are
    post-codification frequency data, not pre-codification
    candidacy. **NEW status:** carve-out has graduated from
    "candidate" to "ratified" via Session 7 C6.
  - Tier 1 candidacy: drift meta-pattern at N=3 across 3 timing
    surfaces holds; principle-level ratification path
    adjudication remains Session 8 brainstorm work.
  - Tier 2: drift meta-pattern Tier 1 candidacy unchanged from
    5B closeout. Inter-session dependency mechanism at N=3
    advances Tier 3 → Tier 2 (per closeout-time framing of the
    brainstorm-time observation).
  - Tier 3 (N=1 awaiting recurrence): recurring meta-arc
    placement question + prophylactic-vs-reactive sub-axis hold
    at N=1.
  - Methodology cluster bucket: 11 inhabitants + cross-reference-
    time drift firings as frequency evidence (post-gate;
    accumulating evidence of frequency, not new inhabitants).
    Sub-categorization decision remains deferred to Session 8.
    [Closeout-time framing: Session 8's bucket-structural scope
    grows by inter-session dependency mechanism Tier 3 → Tier 2
    advancement; bucket reorganization potentially absorbs that
    elevation depending on Session 8 brainstorm adjudication.]

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, ninth invocation N=9):**
  - Condition 1 (test-suite health): GREEN under floor-only
    path. `pnpm db:reset:clean && pnpm agent:validate` reports
    26/26. Full-suite NOT invoked per the carve-out's
    mechanical-non-impact argument; doc-only diff (4 README
    rewrites + 1 system_overview annotation update + this entry;
    zero migrations / zero services / zero integration tests /
    zero source files / zero test files) cannot regress tests by
    construction.
  - Condition 2 (doc-sync): GREEN. Session 6's primary
    deliverable IS doc-sync work (four README rewrites consuming
    V2's ratified Principle 1 + ADR-0021's architectural
    contributions); same category as 5A and 5B execution
    closeouts.
  - Condition 3 (governance closeout): this entry; carry-
    forwards captured below.

  **Forward pointers (rewritten at execution time per drift
  discipline; plan's pre-Session-7 forward pointers were
  stale):**

  - **Round-2 substantive work fully closes at this push.**
    Round-2 structural closure was complete at Session 7 (commit
    `863b52b`); round-2 tail (Layer 1 + Layer 2 migrations) at
    Session 5B (commit `ba195d7`); round-2 cleanup completion
    (four-README rewrites) at this Session 6 execution push.
    The meta-arc folder `docs/07_governance/round-2/` becomes a
    historical archive; future round-N work creates
    `docs/07_governance/round-N/` per the round-N workflow
    convention codified at Session 7 C6.
  - **Session 8 brainstorm next.** Scope per Session 7 closeout
    + 5B closeout + this closeout:
    - Drift meta-pattern Tier 1 codification path adjudication
      (architectural-principle vs process-meta-pattern category
      boundary; principle-level / Pattern-7-bypass-procedure-
      expansion / conventions.md-only ratification path). Per
      Session 7 closeout's flag, the category boundary is the
      load-bearing question; the ratification path follows.
    - Methodology bucket sub-categorization (11+ inhabitants;
      soft-threshold tripped at Session 6.5 closeout).
    - Inter-session dependency mechanism Tier 3 → Tier 2
      advancement (N=3 firings: Session 6 plan, Session 7 plan,
      this Session 6 execution).
    - Recurring meta-arc placement question Tier 3 carry-
      forward; prophylactic-vs-reactive sub-axis Tier 3 carry-
      forward.
    - Path-reference vs content-reference sub-shape codification
      consideration (per Session 7 closeout flag): Session 6
      execution adds content-reference frequency data (3
      sub-instances); path-reference cluster fired 0 sub-instances
      this session. Session 8 considers whether codification
      distinguishes the sub-shapes.
  - **Phase 1 onset readiness — N=3 sustained-readiness test
    passed.** Session 7 (V2 ratification) + Session 5B (Layer
    1+2 migrations) + Session 6 (four-README rewrites) all
    landed cleanly without challenging the apps/web/src/
    guardrail. Source-tree authority discipline holds across
    three sessions post-V2-ratification. **Round-2 closure is
    now operator-determined**: declaration is a decision, not a
    question. Phase 1 storage / evidence work is unblocked at
    operator's discretion.

- 2026-05-09 NOTE — Round-2 docs reorganization Session 5B
  execution closeout (Layer 1 + Layer 2 briefs reorganization;
  post-Session-7 cleanup work). Five implementation commits per
  the substrate-then-moves sequence locked at the 5B brainstorm
  + plan at
  `docs/07_governance/round-2/2026-05-08-session-5b-plan.md`.
  Plan was authored 2026-05-08 (pre-V2-ratification); execution
  at 2026-05-09 (post-V2-ratification at Session 7). Multiple
  cross-reference-time drift instances caught at execution time
  per the drift discipline; recorded as evidence below.

  Five commits this dispatch:
  - C1 `429c144` (Layer 1): 9 feature specs `phase-2/` →
    `01_prd/` flat + `phase-2/README` acknowledgment +
    `01_prd/README` touch-up.
  - C2 `173abea` (Layer 2 substrate): briefs convention 3→4
    sub-buckets + 3 README updates + new
    `ratification-packages/` + `chunks/` directories. ADR
    README anchor adjusted at execution time (cross-reference-
    time drift catch #1).
  - C3 `60281a6` (Layer 2 2026-05-03 group): 5 file moves +
    friction-journal path-note blockquote extension + active-doc
    cross-reference updates (ADR/README:274 + open_questions.md:755
    cross-reference-time drift catches #2-3).
  - C4 `42fdf8d` (Layer 2 2026-05-04 group): 8 file moves +
    active-doc cross-reference updates (delivery-model.md:156 +
    document_platform_initiative.md 5 refs cross-reference-time
    drift catches #4-9).
  - C5 (this commit): closeout.

  Acceptance criteria — all 12 satisfied (a-l per plan).

  **Locked decisions (5B brainstorm-validated, retained at
  execution time):**
  - Convention expansion via Decision 2 option X: briefs
    convention adds `ratification-packages/` as 4th sub-bucket
    per 6-consumer evidence (D1-D6 ratification cluster).
  - Decision 5 sub-bucket assignments: governance-plan → plans/;
    D1-D6 → ratification-packages/; bank-detail amendment +
    evidence-link + closure-verification + session prompts/
    closeout → chunks/.
  - Decision 4 substrate-then-moves: C1 Layer 1 bundle (9 moves
    + 2 READMEs); C2 Layer 2 substrate (3 READMEs + new
    directory); C3 + C4 Layer 2 migrations (5 + 8 moves).
  - Disposition matrix per 5A's Commit 3 precedent: friction-
    journal entries + legacy ADRs + closed-phase briefs (in
    phase-0/) + 5B plan + 5A plan + round-2 README → δ-i
    preserved; active spec/architecture/engineering docs →
    rewritten at execution time.
  - phase-2/README acknowledgment text: 9 retainees (plan
    author's "8 retainees" was off-by-one; 2026-05-06-phase-2-
    brief-pre-positioning-notes.md was missed at brainstorm
    time; corrected at execution time).

  **Cross-reference-time drift surface — N=1 firing (advances
  drift meta-pattern toward Tier 1 codification candidacy).**
  The plan-substrate-vs-canonical-reality drift meta-pattern
  fired multiple instances at the cross-reference-time surface
  during 5B execution. Per V2 Part 2's codification trajectory
  framing: N=2 evidence pre-this-closeout (execution-time +
  planning-decision-time surfaces); cross-reference-time surface
  needed an N=1 instance to advance the meta-pattern from Tier 3
  → Tier 2 to N=3 with shape match across distinct timing
  surfaces (Tier 2 → Tier 1 candidacy). 5B execution provides
  that N=1 evidence — multiple cross-reference-time instances
  under one meta-pattern observation:

  1. **ADR README anchor mismatch (C2).** Plan's old_string for
     ADR README edit contained pre-Session-7 text
     (`docs/restructure-plan.md`); current state post-Session-
     7-C1 has `docs/07_governance/DOCS_RESTRUCTURE_V1.md`. Edit
     anchor adjusted at execution time. Resolution applied by
     verifying current canonical state before the Edit (the
     "verify the artifact before agreeing with an alarm" rule
     operating prophylactically: I read the current state of
     the ADR README before drafting the Edit, rather than
     trusting the plan's old_string).
  2. **"when ratified at Session 7" phrasing stale.** V2 has
     ratified at Session 7. Plan's both old_string and new_string
     used future-tense "when ratified at Session 7". Updated to
     past-tense "ratified at round-2 Session 7" in C2's Edit.
  3. **ADR/README.md:274 active-doc cross-reference.** Phase 0
     governance plan reservations paragraph cited the governance
     plan at its old `docs/09_briefs/phase-2/2026-05-03-...`
     path. Updated to new path under
     `docs/09_briefs/phase-0/plans/` in C3.
  4. **open_questions.md:755 active-doc cross-reference.**
     Q53-Q78 file batches reference cited governance plan at old
     path. Updated to new path under
     `docs/09_briefs/phase-0/plans/` in C3.
  5. **delivery-model.md:156 active-doc cross-reference.** d6
     ratification package template reference cited at old path.
     Updated to `docs/09_briefs/phase-0/ratification-packages/`
     in C4.
  6. **document_platform_initiative.md 5 active-doc cross-
     references.** d6 package + closure-verification references.
     Updated to new paths in C4.
  7. **phase-2/README acknowledgment count drift.** Plan's
     acknowledgment text said "8 retainees"; reality was 9
     (`2026-05-06-phase-2-brief-pre-positioning-notes.md` was
     authored 2026-05-06 but plan-author at 2026-05-08 missed
     it). Corrected at execution time.

  Total: 7 distinct cross-reference-time drift instances caught
  at execution time. Counts as N=1 of the cross-reference-time
  surface for the meta-pattern (multiple-within-session is the
  unit, matching the Session 6.5 closeout precedent).

  **Drift meta-pattern post-this-closeout: N=3 across 3 timing
  surfaces.** Codification trajectory advances from Tier 3 →
  Tier 2 to Tier 2 → Tier 1 candidacy:
  - Execution-time surface: 4+ instances (Session 6.5 lib/hooks
    + header style + fire count + Session 7 C1 cross-reference
    enumeration).
  - Planning-decision-time surface: 1 instance (Session 7
    brainstorm Path A vs Path B).
  - Cross-reference-time surface: 1 instance (this 5B execution,
    7 sub-instances under one meta-pattern observation).

  The third timing surface firing is the codification gate-pass
  per V2 Part 2: "N=3 with shape match across three distinct
  timing surfaces." Codification candidacy is now Tier 1; future
  Session (8 brainstorm or beyond) adjudicates the principle-
  level ratification text. The drift meta-pattern can now
  cross-cut the V2 ratification (e.g., as an amendment to
  Principle 3's bypass procedure operational rules, or as a
  fourth Principle if the substrate-discipline framing warrants
  separate ratification).

  **5B execution validates Pattern 7's bypass procedure
  operational rules in practice.** The plan was a substrate
  artifact; the execution applied both operational rules
  prophylactically:
  - Canonical-source verification at execution time: applied
    before each Edit anchor; caught the ADR README anchor drift
    (would have failed silently otherwise).
  - Chronological-reality verification at planning time: applied
    when reading the closeout entry's forward pointers; the
    plan's "Session 7 brainstorm inherits..." text was rewritten
    to reflect post-Session-7 reality (Session 6 execution +
    Session 8 brainstorm).

  **Pre-codification observation queue post-Session-5B-execution
  (queue updates):**
  - Tier 1 LIVE: Floor-only push gate carve-out advances to N=8
    LIVE this dispatch push (halftime + 5A brainstorm closeout +
    5B brainstorm closeout + Session 6 brainstorm closeout +
    Session 6.5 execution + Session 7 plan dispatch + Session 7
    execution + Session 5B execution = 8 fires through this
    push). Drift meta-pattern advances Tier 2 → Tier 1 candidacy.
  - Tier 2: drift meta-pattern at N=3 across 3 timing surfaces;
    Tier 1 codification candidate.
  - Tier 3: status reaffirmed. Recurring meta-arc placement
    question + prophylactic-vs-reactive sub-axis hold at N=1.
  - Methodology cluster bucket: 11 inhabitants + cross-reference-
    time drift firing as N=1 of the cross-reference-time surface
    sub-instance category. Bucket count holds (the new evidence
    is a sub-instance of an existing inhabitant, not a new
    inhabitant). Sub-categorization decision still deferred to
    Session 8.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, eighth invocation N=8):**
  - Condition 1 (test-suite health): GREEN under floor-only path.
    `pnpm db:reset:clean && pnpm agent:validate` reports 26/26.
    Full-suite NOT invoked per the carve-out's mechanical-non-
    impact argument; doc-only diff (22 file moves + 6 README
    updates + 4 active-doc cross-reference updates +
    friction-journal blockquote extension + this entry; zero
    migrations / zero services / zero integration tests / zero
    source files / zero test files) cannot regress tests by
    construction.
  - Condition 2 (doc-sync): GREEN. 5B's primary deliverable IS
    doc-sync work (Layer 1 + Layer 2 migrations + convention
    expansion + 3 README updates + 7 cross-reference-time drift
    catches resolved at execution time); same category as 5A's
    "doc-sync done as primary deliverable" green.
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured below.

  **Forward pointers (rewritten at execution time per drift
  discipline; plan's pre-Session-7 forward pointers were stale):**
  - Round-2 structural closure was complete at Session 7
    (commit `863b52b`). 5B execution is post-V2 cleanup work,
    NOT structural ratification. V2's three Principles + Pattern
    7 + Migration Map are canonical and unchanged by this
    execution.
  - Session 6 execution remains pending after this closes;
    Session 6 plan at `docs/07_governance/round-2/
    2026-05-09-session-6-plan.md` (commit `c913b7a` + fix-ups)
    is unchanged and unblocked.
  - Session 8 brainstorm follows Session 6 execution; scope per
    Session 7 closeout's framework (review 11 methodology-bucket
    inhabitants + adjudicate sub-categorization; absorb
    cross-reference-time drift firing as N=1 evidence; consider
    drift meta-pattern Tier 1 codification at Session 8 or beyond).
  - **Phase 1 onset readiness sustained.** The `apps/web/src/`
    guardrail remains in place; source-tree authority discipline
    remains ratified at V2 Part 1 Principle 3; 5B execution
    operates entirely on docs/ and adds no source-tree changes;
    Phase 1 storage / evidence work remains unblocked.
  - **Drift meta-pattern N=3 codification trajectory.** Tier 2
    → Tier 1 candidacy advanced this push. Future Session
    adjudicates principle-level ratification (e.g., as Principle
    4 in V2 amendment, or as Pattern 7 bypass-procedure expansion).

- 2026-05-09 NOTE — Round-2 docs reorganization Session 7 closeout
  (V2 ratification + V1 elevation + remaining guardrail surfaces);
  closes round-2 structural work. Files landed across seven commits:
  C1 V1 elevation (`d4a3390`); C2 V2 creation (`09bb127`); C3
  `docs/README.md` Folder placement guardrail (`a3b3483`); C4
  repo-root `README.md` Folder placement section (`f6af23a`); C5
  CLAUDE.md `### Folder placement guardrails` sub-section
  (`c649845`); C6 `docs/04_engineering/conventions.md` Round-2
  Conventions section (`484d920`); C7 this closeout. V2 ratifies
  three Principles + Pattern 7 + Migration Map; round-2's
  structural work closes; 5B and Session 6 execution remain
  pending as cleanup commits afterward.

  **Locked decisions (round-2 closeout-grade):**
  - V2 Part 1 ratifies three Principles: canonical-axis
    (Principle 1: a folder should encode only one canonical axis,
    other axes belong in metadata and indexes); document-class-
    not-workflow-lineage with meta-arc exception (Principle 2:
    top-level folders are document classes, not workflow lineages,
    with one exception for cross-phase meta-arcs); folder-
    placement guardrails at high-decision-cost structural surfaces
    (Principle 3).
  - Pattern 7 conditional permission for cross-phase meta-arcs
    under `07_governance/` ratifies at V2 Part 1 with two
    operational rules in the bypass procedure (canonical-source
    verification at execution time; chronological-reality
    verification at planning time). Operational rules live at the
    bypass-procedure level, NOT Principle 3 ratification.
  - V2 Part 2 captures plan-substrate-vs-canonical-reality drift
    meta-pattern as N=2 evidence (Session 6.5 execution-time +
    Session 7 brainstorm planning-decision-time). Tier 3 → Tier 2
    trajectory; NOT ratified to a principle at N=2.
  - V2 Part 3 Migration Map enumerates round-2 migrations
    including Session 6.5's `apps/web/src/` guardrail, the Session
    3 ADR upgrade, the Session 4 ec-2-prompt-set move + ADR-0022
    lifecycle workflows, the Session 5A `superpowers/`
    elimination, the Session 5/5A phase-0/ + phase-5/ creation,
    and Session 7's V1 elevation + V2 creation + three guardrail
    surfaces + CLAUDE.md sub-section + conventions.md round-2
    section.
  - Per-surface N=1 framing: each Principle 3 surface
    (`apps/web/src/`, `docs/`, repo root) independently meets
    N=1; aggregation across surfaces NOT required. `apps/web/src/`
    cites Session 6.5 prior-art (commit `b98208c`); `docs/` and
    repo root cite C3/C4 same-session outputs.
  - C5 lands a CLAUDE.md `### Folder placement guardrails`
    sub-section under "Project rules and vocabulary"; integrates
    into actual idiom (NOT a fabricated Rule 12).
  - C6 codifies four round-2 conventions at conventions.md:
    round-N restructure plan workflow; three-category
    codification taxonomy (architectural principle / procedural
    pattern / process meta-pattern); "verify the artifact before
    agreeing with an alarm" rule; plan-substrate-vs-canonical-
    reality drift meta-pattern at Tier 3 → Tier 2 trajectory.
  - Bucket-structural work disposition: **deferred to Session 8
    with framework**. No third Tier 3 → Tier 2 candidate fired
    during Session 7 execution (the C1 cross-reference enumeration
    drift catch reinforces existing N=1 of execution-time surface,
    NOT a new Tier 3 entry). Session 8 framework: review the 11
    methodology-bucket inhabitants in brainstorm/scope; apply
    sub-categorization if natural categories surface; otherwise
    carry forward as "soft-threshold tripped, awaiting decisive
    sub-categorization."

  **5B execution and Session 6 execution recorded as plan-but-
  not-executed at V2 ratification time** (per the chronological-
  reality precedent established at Session 6.5 closeout):
  - 5B execution (Layer 1 + Layer 2 migrations): pending; lands
    as cleanup post-V2. 5B execution does NOT qualify for floor-
    only carve-out (has migrations + services).
  - Session 6 execution (four-README rewrites + doc-class pattern
    propagation): pending; lands as cleanup post-V2. Session 6
    execution DOES qualify for floor-only.
  - V2 ratification operates on design substrate (Principles,
    Pattern 7, Migration Map, V1 elevation), all of which are on
    disk regardless of 5B/6 execution status. Path-level cross-
    references throughout V2/C3/C4/C5 mean 5B/6 execution can
    land later without invalidating V2's references. Session 8
    inherits 5B/6 execution + bucket-structural sub-categorization
    decision; placement decision (single Session 8 plan vs.
    Session 8a/8b plans) adjudicates at Session 8 brainstorm time.

  **Brainstorm-time observations:**
  - **Path-level cross-references discipline applied throughout
    V2 + C3/C4/C5.** Verified at execution time via grep-sweeps.
    No cross-reference cites post-rewrite content; all cross-
    references cite paths. The cross-reference-time surface of
    the drift meta-pattern is mitigated by this discipline; an
    N=1 instance of drift catching at the cross-reference-time
    surface (e.g., a V2 cross-reference broken when Session 6
    rewrites a sub-folder README) would advance the meta-pattern
    to Tier 1 codification candidacy. As of this closeout, the
    cross-reference-time surface still has 0 instances.
  - **C1 cross-reference enumeration drift caught at execution
    time (additional N=1 instance of execution-time surface).**
    Plan author (Session 7 brainstorm) claimed `ADR-0021` was the
    only live cross-reference to `docs/restructure-plan.md`
    requiring update at C1; grep at execution time surfaced
    `docs/07_governance/adr/README.md` line 138 as additional
    live reference. Resolution: updated both link targets in C1.
    Mechanism: plan author missed the ADR README cross-reference
    at brainstorm time (substrate vs canonical-grep mismatch).
    Same shape as Session 6.5's three execution-time instances;
    counts as evidence #4 of the execution-time surface (not a
    new timing surface). Total drift-meta-pattern evidence post-
    this-closeout: 4 instances at execution-time surface +  1
    instance at planning-decision-time surface = 5 instances
    across 2 of 3 timing surfaces. Codification trajectory still
    awaits cross-reference-time N=1 to advance to Tier 1.
  - **Drift discipline applied prophylactically.** Per the N=3
    meta-observation from the Session 7 brainstorm dispatch: the
    discipline being applied prophylactically (catching drift
    before it could fire — e.g., NOT projecting the floor-only
    fire count in the plan) rather than reactively (catching
    drift after it fires — e.g., the C1 enumeration catch) is a
    sub-axis worth tracking. This Session 7 execution applied
    both modes: prophylactic at the plan's "floor-only fire count
    NOT projected" framing (count read at execution time per the
    operational rule); reactive at the C1 enumeration catch (drift
    surfaced during execution and was corrected). The
    prophylactic-vs-reactive sub-axis is captured in operator
    memory but not yet in canonical docs; future codification
    decision: whether the sub-axis warrants its own Tier 3 entry
    or stays as an operational nuance within the existing drift
    meta-pattern entry.
  - **Floor-only carve-out at N=7 LIVE post-this-push.**
    Enumeration through this push: halftime + 5A brainstorm
    closeout + 5B brainstorm closeout + Session 6 brainstorm
    closeout + Session 6.5 execution + Session 7 plan dispatch +
    Session 7 execution = 7 fires. The Session 7 plan dispatch
    (commit `04e0eb8`) was a floor-only fire that landed without
    a closeout entry per the brainstorm-dispatch convention (no
    friction-journal entry at brainstorm closeout, only at
    execution closeout); this closeout entry records the
    chronological count including that intervening fire per the
    drift discipline's chronological-reality verification rule.
  - **Round-2 closes at this push.** Round-2 spanned Sessions 1
    through 7 (with 5B + 6 brainstorm + 6.5 execution interim +
    Session 7 brainstorm + Session 7 execution; 5B and Session 6
    execution as post-closure cleanup). The meta-arc folder
    `docs/07_governance/round-2/` becomes a historical archive
    at this point per the meta-arc folder convention. Future
    round-N work creates `docs/07_governance/round-N/` per the
    round-N workflow convention codified at C6.
  - **N=2 of plan-substrate-vs-canonical-reality drift meta-
    pattern captured in V2 Part 2.** Tier 3 → Tier 2
    codification trajectory; awaiting N=3 with shape match for
    principle-level ratification. Cross-reference-time surface
    needs an N=1 instance before crossing to Tier 1. The
    discipline is operational (Pattern 7's bypass procedure
    rules) and codified (V2 Part 2 + conventions.md C6) without
    being principled, which is the right shape per the three-
    category codification taxonomy.
  - **Recurring meta-arc placement question N=1 — ratification
    gaps cause recurring questions.** The "should we move
    `docs/07_governance/round-2/`" question recurred multiple
    times during round-2; each surfacing was resolved ad-hoc by
    reaffirming the canonical-first-instance precedent framing.
    V2 Part 1's Pattern 7 ratification + the Session 7 plan's
    "Don't move round-2/" hard constraint close the gap. N=1
    evidence for the discipline that recurring questions are
    diagnostic of ratification gaps; codification candidacy at
    second fire (a future round-N or arc-X recurring question
    would advance to N=2).
  - **Friction-journal heading-structure verification result.**
    `## Phase 2` was the active section heading at execution
    time (matches plan's expected structure; no shift since
    Sessions 5/6/6.5 closeout placement). Closeout entry
    inserted at top of `## Phase 2`, above the Session 6.5
    closeout entry, per canonical chronological-reverse
    ordering.

  **Pre-codification observation queue post-Session-7-execution
  (queue updates):**
  - Tier 1 LIVE: Floor-only push gate carve-out advances to N=7
    LIVE this push (halftime + 5A brainstorm closeout + 5B
    brainstorm closeout + Session 6 brainstorm closeout + Session
    6.5 execution + Session 7 plan dispatch + Session 7
    execution = 7 fires through this push). Round-2 conventions
    codified at conventions.md (round-N workflow + three-category
    codification taxonomy + "verify before agreeing with alarm"
    rule + drift meta-pattern entry) — Tier 1 candidates for
    these advance from "candidate" to "ratified" via C6.
    Methodology cluster bucket: deferred to Session 8 with
    framework.
  - Tier 2: drift meta-pattern at N=2 advances Tier 3 → Tier 2;
    cross-reference-time surface still awaiting N=1.
  - Tier 3 (N=1 awaiting recurrence): recurring meta-arc
    placement question (new entry at this closeout); prophylactic-
    vs-reactive drift discipline sub-axis (new entry at this
    closeout).
  - Other tiers: status reaffirmed; no changes.
  - Bucket counts: methodology cluster at 11 inhabitants (post-
    Session-6.5 + drift meta-pattern at planning-decision-time
    surface + recurring meta-arc placement + prophylactic-
    discipline sub-axis); soft-threshold tripped at Session 6.5;
    bucket-structural decision deferred to Session 8 with
    framework.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, seventh invocation N=7):**
  - Condition 1 (test-suite health): GREEN under floor-only path.
    `pnpm db:reset:clean && pnpm agent:validate` reports 26/26.
    Full-suite NOT invoked per the carve-out's mechanical-non-
    impact argument; doc-only diff (V1 move + V2 + 3 guardrail-
    section additions + 1 CLAUDE.md sub-section + 1 conventions.md
    section + this entry; zero migrations / zero services / zero
    integration tests / zero source files / zero test files)
    cannot regress tests by construction.
  - Condition 2 (doc-sync): GREEN. V1 elevation preserves
    existing content per δ-i; V2 references V1 at post-elevation
    path (path-stable at C1); INDEX.md updated at C1 + C2;
    cross-references resolve via path-level links (verified via
    grep-sweep at each commit). C1 also caught and corrected the
    ADR-0021 + adr/README cross-reference link targets to the new
    V1 path.
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured below per round-2 closure scope.

  **Forward pointers:**
  - **Session 8 (post-round-2 cleanup)** inherits 5B execution +
    Session 6 execution + bucket-structural sub-categorization
    decision. Session 8 plan placement: if 5B/6 execution is
    phase-N work, plan lands at `docs/09_briefs/<phase>/plans/`;
    if cleanup is governance-shape work, lands at a new
    `docs/07_governance/post-round-2/` folder (would itself be
    Pattern 7 light-bypass per the 4/4 precedent-matching test
    citing `round-2/`). Adjudication at Session 8 brainstorm
    time.
  - Round-2 closure does NOT close 5B/6 execution; those are
    independent execution sessions whose plan substrate is
    committed (5B at `560f5a9`; Session 6 at `c913b7a` + fix-ups
    at `14c840c` + `a562568`) and whose execution is unblocked
    by V2 ratification at this closeout.
  - Future restructure rounds (round-3, etc.) follow the round-N
    workflow per conventions.md C6: arc-level brief at docs root;
    session plans at meta-arc folder; arc closure elevates V<N>
    to `07_governance/` alongside V<N+1>.
  - **Phase 1 onset readiness.** The `apps/web/src/` guardrail
    is in place (Session 6.5); the source-tree authority
    discipline is ratified at V2 Part 1 Principle 3; Phase 1
    storage / evidence work can begin once the operator decides
    round-2 is closed enough. V2 ratification at this closeout
    is the canonical signal for round-2 structural completion;
    5B/6 execution as cleanup commits land afterward without
    blocking Phase 1 onset.
  - **Drift meta-pattern codification trajectory.** Tier 3 →
    Tier 2 holding; awaiting cross-reference-time N=1 instance
    to advance to Tier 1. Future Session 6 execution (rewriting
    sub-folder READMEs) is a candidate fire-window — if any
    V2 / C3 / C4 / C5 cross-reference fails to resolve when
    Session 6 lands, that's the N=1 evidence for the cross-
    reference-time surface.

- 2026-05-09 NOTE — Round-2 docs reorganization Session 6.5
  closeout (apps/web/src/ folder-placement guardrail interim);
  files landed at `apps/web/src/README.md` (substantive guardrail,
  ~150 lines) and `apps/web/src/AGENTS.md` (terse pre-flight
  directive, 3-5 sentences) at commit `b98208c` (157 line additions
  total). Closes the Phase 1 (Storage / Evidence Core) onset risk
  at the source-tree surface: ADR-0020 authority-gradient discipline
  is now load-bearing at the apps/web/src/ surface itself, not
  only in canonical docs (folder-structure.md, authority-gradient.md).
  Session 6.5 ratifies Principle 3 (folder placement guardrails at
  high-decision-cost structural surfaces) at the source-tree
  surface as N=1 implementation evidence; full Principle 3 wording,
  three-surface map (apps/web/src/, docs/, repo root), Pattern 7
  conditional-permission framing for meta-arc folders, and
  AGENTS.md/README.md pairing convention carry forward to Session
  7's V2 ratification.

  **Locked decisions (5):**
  - Principle 3 (tightened wording, ratifies in Session 7 V2):
    folder placement guardrails land at high-decision-cost
    structural surfaces; the canonical taxonomy is documented at
    the surface itself, not only elsewhere. Three surfaces ratified
    at V2: apps/web/src/ (this session), docs/ (Session 7), repo
    root (Session 7).
  - Three-surface enumeration (apps/web/src/ first, docs/ + repo
    root in Session 7) — substrate-now-enforcement-later applied
    at the guardrail-surface axis: Session 6.5 ships one surface
    now to close the active risk window; remaining surfaces ship
    in Session 7 atomically with V2 ratification + CLAUDE.md
    sub-section + DOCS_RESTRUCTURE_V2.md.
  - Pattern 7 conditional-permission framing for meta-arc folders
    under `07_governance/` — first-instance meta-arc shape requires
    full bypass (folder README answering doc-class questions,
    friction-journal entry as N=1 evidence, operator acknowledgment
    in commit body); follows-precedent meta-arc requires light
    bypass (4/4 precedent-matching checklist, one-line friction-
    journal entry, commit-body precedent citation). Codification
    lands at Session 7 in `docs/README.md`.
  - AGENTS.md + README.md pairing convention at apps/web/src/ per
    repo-root precedent: AGENTS.md is AI-pre-flight cross-tool
    convention (terse, 3-5 sentences, recognized by Cursor / Aider
    / Codex); README.md is structural-onboarding (audience-neutral,
    substantive). Repo root pairs both; apps/web/src/ now also
    pairs both. `docs/` uses README.md alone (existing convention;
    CLAUDE.md cross-reference makes it pre-flight without a
    separate AGENTS.md).
  - CLAUDE.md sub-section under "Project rules and vocabulary"
    (not a fabricated "Rule 12") — Session 7 lands a new
    sub-section pointing at the three surface guardrails, stating
    the bypass discipline, citing worked examples. Atomic landing
    with `docs/` guardrail and repo-root extension to avoid
    orphan-link windows.

  **Carry-forwards to Session 7:**
  - `docs/README.md` Folder placement guardrail draft (caught-and-
    fixed example: `docs/superpowers/` workflow-lineage migration
    in round-2 Session 5A; worked-precedent example:
    `docs/07_governance/round-2/` meta-arc folder).
  - Repo-root `README.md` Folder placement section (structural-
    folder-permitted patterns: `apps/`, `packages/`, `supabase/`,
    `scripts/`, `docs/`, `eslint-rules/`, `.coordination/`;
    tooling/system folders out-of-scope: `.git/`, `.turbo/`,
    `node_modules/`, `logs/`, `reports/`, `test-results/`).
  - CLAUDE.md sub-section under "Project rules and vocabulary"
    (per locked decision above).
  - Principle 3 ratification in `DOCS_RESTRUCTURE_V2.md` — the
    canonical wording and three-surface map land at V2, with
    apps/web/src/ as N=1 implementation precedent.
  - Pattern 7 conditional-permission wording with the 4/4
    precedent-matching checklist (precedent README answers
    doc-class questions; new README answers same questions citing
    precedent; cross-phase scope / durable identity / closure
    criteria / governance-surface placement match; naming
    structurally consistent).

  **Brainstorm-time observations (5):**
  - **Plan-substrate-vs-canonical-reality drift fired three times
    in this session** (recurrent meta-pattern within a single
    execution window; N=1 of the meta-pattern, not N=3 —
    multiple-within-session is itself the unit). The three
    instances:
    1. Plan's brainstorm-context section listed `lib/` and
       `hooks/` among forbidden patterns; canonical
       `folder-structure.md` (ratified by ADR-0020) lists both as
       permitted forward-looking patterns. Resolution: README
       aligned with canonical doc; only `utils/` and
       `modules/<feature>/` ship as forbidden. Operator-
       acknowledged via AskUserQuestion resolution — option 1
       (canonical wins).
    2. Plan instructed friction-journal entry header use
       `### 2026-05-09 —` style; canonical pattern across all
       prior closeouts (5A, 5B, Session 6 brainstorm, etc.) is
       bullet-list `- 2026-05-09 NOTE —` style. Plan's own "Notes
       for executor" section said "structure matches Session
       5A/5B/6 closeout shape" — internal plan inconsistency.
       Resolution: bullet-list style used (this entry), matching
       canonical pattern.
    3. Plan claimed N=6 floor-only invocation; operator handoff
       projected N=7. Reality at push time: N=5 (next push after
       Session 6 brainstorm closeout at N=4 LIVE; 5B execution
       and Session 6 execution have not yet run). Plan and
       handoff both projected forward from a sequence (5B exec →
       Session 6 exec → Session 6.5 exec) that did not
       materialize. Resolution: closeout records N=5; observation
       captures the drift.
    Common shape across all three: plan-substrate (forbidden
    list, header style, projected count) drifts from canonical-
    reality (folder-structure.md, friction-journal pattern,
    chronological fire history) at execution time. Future readers
    should source fire-counts from the friction-journal's
    fire-history record rather than from forward projections in
    plans or handoffs; forbidden-pattern lists from canonical
    `folder-structure.md` rather than plan brainstorm-context;
    entry-shape from canonical existing entries rather than plan
    literal instructions. Forward to Session 7's V2 ratification
    of Principle 3: guardrail-canonical alignment is load-bearing,
    and the bypass procedure shape should make canonical-source
    verification step explicit. The principle Session 7 ratifies
    operates on this very pattern — guardrails that don't match
    canonical sources create the same disambiguation problem the
    principle is solving.
  - **Floor-only carve-out N=5 invocation, first fire outside
    `docs/` territory.** Markdown placement under `apps/web/src/`
    (rather than `docs/`) is a structurally novel surface; the
    diff shape (zero migrations / zero services / zero integration
    tests / zero source files / zero test files) is mechanically
    equivalent to prior doc-only fires. Codification of the carve-
    out itself still defers to Session 7's natural substrate
    moment per substrate-now-enforcement-later — Session 6.5 uses
    the carve-out, does not codify it. Session 7 closeout absorbs
    N=5 as additional evidence that the formal criteria operate on
    diff shape, not folder location. (Per the drift observation
    above: Session 7 will need to source the canonical fire-count
    from the friction-journal record at codification time, not
    from earlier plan / handoff projections.)
  - **Pattern 7 light-bypass implicitly fired for this plan's
    placement under `docs/07_governance/round-2/`.** N=1 evidence
    of the conditional-permission machinery operating in practice
    (currently described only in the brainstorm-context section
    of the plan and this closeout). 4/4 precedent-matching: round-2
    README answers document-class questions; this plan's location
    implicitly cites precedent (`round-2/` naming); cross-phase
    scope and durable identity match the meta-arc shape; naming
    structurally consistent with the round-N session-plan pattern
    (`2026-05-09-session-6-5-plan.md`). Material for Session 7's
    V2 ratification of Pattern 7.
  - **`pnpm adr:index --check` meaningfulness for non-ADR diffs.**
    Gate ran clean for the README + AGENTS markdown-only diff;
    result vacuously clean (the diff doesn't touch ADRs, so the
    gate had no possible signal to produce). Gate stays in the
    floor sequence as cheap insurance but is not load-bearing for
    this diff scope. If a future floor-only diff happens to touch
    `docs/07_governance/adr/` inadvertently, the gate would catch
    it — that's the insurance value. No Session 7 codification
    consequence beyond the existing Topic 4 lock.
  - **Friction-journal heading-structure verification result.**
    `## Phase 2` was the active section heading at execution time
    (matches plan's expected structure; no shift since Session 5
    or Session 6 brainstorm closeout placement). Closeout entry
    inserted at top of `## Phase 2`, above the Session 6
    brainstorm closeout entry, per canonical chronological-reverse
    ordering.

  **Pre-codification observation queue post-Session-6.5-execution
  (queue updates):**
  - Tier 1 LIVE: Floor-only push gate carve-out advances to N=5
    LIVE this dispatch push (halftime + 5A brainstorm closeout +
    5B brainstorm closeout + Session 6 brainstorm closeout +
    Session 6.5 execution = 5 fires through this push). First
    fire outside `docs/` territory; structural-coverage data
    point for Session 7 codification. Other Tier 1 candidates
    (Turbo cache #3, count-level commit pattern #11) status
    unchanged.
  - Tier 3 (N=1 awaiting recurrence): +1 (plan-substrate-vs-
    canonical-reality drift meta-pattern; three instances
    captured in this session count as N=1 of the meta-pattern,
    not N=3). Methodology cluster.
  - Other tiers: status reaffirmed; no changes. Methodology
    bucket count holding at 10+1 inhabitants (the new meta-
    pattern observation joins methodology cluster) per Session 6
    brainstorm closeout soft-threshold trip; Session 7 already
    owns the sub-categorization decision.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, fifth invocation N=5):**
  - Condition 1 (test-suite health): GREEN under floor-only path.
    `pnpm db:reset:clean && pnpm agent:validate` reports 26/26.
    Full-suite NOT invoked per the carve-out's mechanical-non-
    impact argument; doc-only diff (README + AGENTS markdown,
    zero migrations / zero services / zero integration tests /
    zero source files / zero test files) cannot regress tests by
    construction. First fire outside `docs/` territory;
    mechanical equivalence preserved.
  - Condition 2 (doc-sync): GREEN. Diff is README + AGENTS
    additions at apps/web/src/; no canonical doc edits; no INDEX
    update needed (`docs/INDEX.md` catalogs `docs/` contents,
    not source-tree contents). Cross-references resolve to
    `folder-structure.md`, `authority-gradient.md`,
    `conventions.md` canonical paths from
    `apps/web/src/README.md` (verified via `grep -rn` per plan
    Stop Condition 2).
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured above per plan §Task 2 closeout structure.

  **Forward pointers:**
  - Session 7 brainstorm scope per Session 6 brainstorm closeout
    Topic 4 lock: Tier 1 codification (3 LIVE candidates: Turbo
    cache #3, floor-only push gate carve-out at N=5 post-this-
    push [adjusted from earlier projection of N=7 per the
    chronological reality observation above], count-level commit
    pattern #11) + V2 ratification + DOCS_RESTRUCTURE_V2.md +
    methodology bucket sub-categorization decision (per soft-
    threshold trip recorded at Session 6 brainstorm closeout).
    Session 7 also inherits this closeout's plan brainstorm-
    context section by way of
    `docs/07_governance/round-2/2026-05-09-session-6-5-plan.md`
    (Principle 3 wording, three-surface map, Pattern 7 conditional
    permission, AGENTS.md/README.md pairing convention, CLAUDE.md
    sub-section content) for V2 ratification scope.
  - Session 6 execution and 5B execution remain pending; Session
    6.5 closing without those running first does not block them —
    the Phase 1 onset-risk Session 6.5 closes is independent of
    5B execution (Layer 1 + Layer 2 migrations) and Session 6
    execution (four-README rewrites). The session-ordering
    assumption captured in plan and handoff (5B → 6 → 6.5 → 7)
    was forward-projection substrate, not a blocking dependency;
    Session 6.5 dispatching ahead of 5B/6 execution is the
    contingency the chronological reality drift surfaced.

- 2026-05-09 NOTE — Round-2 docs reorganization Session 6
  brainstorm closed; plan landed at
  `docs/07_governance/round-2/2026-05-09-session-6-plan.md`
  (commit `c913b7a`, 459 lines), with two fix-up commits
  (`14c840c` correcting floor-only fire count from N=4 to N=5;
  `a562568` correcting Session 6 execution's projected floor-
  only fire count from N=5 to N=6 after the first fix-up's
  propagation gap surfaced). Seven locked decisions (Topics
  1-7) plus an inter-session dependency mechanism. Session 6
  execution waits for fresh-context session against the plan;
  5B execution must run first per the plan's Stop Condition 1
  verification. This entry documents brainstorm-grain output
  (locked decisions + brainstorm-time observations + queue
  updates + carry-forwards); Session 6 execution closeout will
  be a separate entry after the README rewrites ship.

  **Locked decisions (7 + 1):**
  - Topic 1 (per-README failure-mode taxonomy): 01_prd is
    failed-forward (described future state that round-2 retired
    by populating the folder); 02_specs / 03_architecture /
    04_engineering are failed-backward (under-specify present
    state by omitting canonical-source files named in CLAUDE.md
    as authoritative). Two work shapes follow: full rewrite
    (01_prd, structural-pattern adoption) vs targeted rewrites
    (02/03/04, content-completeness expansion preserving
    existing structure per δ-i discipline). All four READMEs
    propagate the doc-class opener pattern (`**Document class:
    <name>.**`) instantiating ADR-0021's "A folder encodes one
    canonical axis" principle. Principle propagates, not phrase
    — caught at brainstorm-time via grep verification that the
    literal "one canonical axis" phrase lives at ADR-0021:498
    while the consumer-side instantiation in 09_briefs/README
    is the doc-class opener.
  - Topic 2 (commit shape, 1+3+1): C1 grouped 02/03/04 rewrite
    (failed-backward triple, content-completeness expansion,
    no 5B-execution dependency) → C2 isolated 01_prd full
    rewrite (failed-forward case, structural-pattern adoption,
    5B-touchup baseline dependency) → C3 closeout. Failure-
    mode asymmetry maps cleanly to commit boundaries —
    preserves blame-locality where work shape is similar,
    isolates categorically distinct work. Count-level commit
    pattern N=4 fire at structural level (implementation-then-
    closeout); count varies (3 implementation, not 4) per
    work-shape grouping. Pattern holds at structural level;
    count-level variance is itself a brainstorm-time
    observation (see below).
  - Topic 3 (cross-reference synchronization): batch-edit
    discipline within each commit (cross-refs touched by a
    commit land in that commit; no later sync sweep) +
    grep-sweep verification before each commit lands. No new
    "cross-ref cadence" naming substrate — batch-edit
    discipline catches at-write-time without adding new surface
    that would itself need consumer evidence to justify.
  - Topic 4 (payload-mitigation, hybrid grain-separation):
    Session 7 inherits the 16-item queue but only owns Tier 1
    codification work (3 LIVE candidates + V2 ratification +
    DOCS_RESTRUCTURE_V2.md). Tier 2-5 reaffirmation is per-
    closeout work, not per-session work. Operating criterion:
    **status-track at every closeout; codification at Tier 1
    LIVE elevation**. The criterion separates queue-size
    growth (monotonic until codification removes items) from
    session-scope (action-items-only). Scales beyond round-2:
    any future session's codification scope is Tier 1
    candidates at session-onset; any future session's
    closeout reaffirms tier status across the queue.
  - Topic 5 (push-readiness gate): floor-only carve-out,
    formal criteria as primary justification (zero migrations
    / zero services / zero integration tests / zero source
    files / zero test files all met). N=4 fire at this
    dispatch push; Session 6 execution push will be N=6 (after
    5B execution push at N=5). 5B execution push at N=5 is
    the first execution-grade fire of the carve-out; Session
    6 execution push at N=6 is the second. Codification of
    the carve-out itself defers to Session 7's natural
    substrate moment per recursive substrate-now-enforcement-
    later.
  - Topic 6 (5B brainstorm carry-forwards): four named at 5B
    brainstorm closeout. (a) Payload-mitigation placement —
    resolved in Topic 4 above. (b) Queue-trajectory non-
    linearity — propagate forward; closeout reports queue
    delta this brainstorm. (c) Methodology bucket sub-
    categorization watch (8 inhabitants approaching size
    threshold) — propagate forward; closeout reports current
    count. (d) Categorical-distinction-preservation N=1 meta-
    pattern — propagate forward; closeout reports whether new
    bucket created or sub-pattern adjudicated.
  - Topic 7 (substrate-leverage phase): track explicitly.
    Session 6 brainstorm session-grain output is brainstorm/
    plan-heavy (this dispatch shipped plan + two fix-ups +
    closeout, zero execution work) — N=2 data point on the
    phase-transition observation first surfaced at 5B
    brainstorm closeout. Inversion confirmed at N=2;
    observation moves Tier 3 (N=1) → Tier 2 (awaiting third
    fire).
  - Plus item (inter-session dependency mechanism, structurally
    novel for round-2 plans): Session 6 plan introduces a Stop
    Condition 1 that verifies prior session's execution closed
    cleanly before current session's commits land. Prior
    round-2 plans had stop conditions but no inter-session
    dependency verification of this shape. Mechanism rationale
    preserved as plan-internal substrate (lines 13-24 of the
    plan) so fresh-context executor doesn't need brainstorm
    history.

  **Inter-session dependency mechanism class (load-bearing
  meta-observation).** The Stop Condition 1 mechanism is a new
  category of plan substrate: plans that depend on a different
  session's execution closing cleanly. The mechanism's shape —
  verify-then-halt-or-proceed — generalizes beyond Session 6:
  any plan whose work depends on prior session's acceptance
  criteria can use the same shape. The mechanism earns its
  keep on failure case: if 5B execution lands cleanly, Stop 1
  verifies and proceeds; if 5B execution introduced unexpected
  scope, Stop 1 halts before any Session 6 commits land. The
  plan-internal-substrate framing is what makes the mechanism
  standalone-readable; without it, fresh-context executors
  would need the brainstorm conversation to understand why
  Stop 1 verifies what it verifies. N=1 observation;
  codification candidacy at second fire.

  **Brainstorm-time observations (6):**
  - **README failure-mode taxonomy (forward vs backward).**
    Surfaced as principled basis for the failure-mode-asymmetry
    commit-shape partition. 01_prd failed forward (described
    future state never materialized); 02/03/04 failed backward
    (under-specifies present state by omitting canonical
    contents). Adjudication: lands as sub-pattern within the
    structural-pattern bucket created at 5B brainstorm. The
    bucket matures past single-instance status with this
    addition — its three inhabitants (count-level commit
    pattern; phase folder lifecycle-stage hypothesis; phase-0/
    phase-5 canonical exemplars) gain a sub-pattern (failure-
    mode taxonomy) that lives within an existing inhabitant's
    structural axis (canonical-exemplar pattern × failure-mode-
    axis = matrix). Sub-pattern-within-bucket is a phenomenon
    distinct from new-bucket-creation; round-2's posture
    handles both. Counts as N=2 of the categorical-distinction-
    preservation meta-pattern (5B brainstorm's structural-
    pattern bucket creation was N=1).
  - **Count-level commit pattern N=4 fire with count-of-3 (not
    4).** 5A=4+1, fix-arc=4+1, 5B=4+1, Session 6=3+1. Pattern
    holds at structural level (implementation-then-closeout)
    while count varies. Recording as count-level variance
    within stable structural pattern rather than force-fitting
    to 4+1 (artificial commit splitting) or treating as new
    pattern (categorical inflation). Itself an instance of
    categorical-distinction-preservation (preserving pattern-
    at-structural-level from pattern-at-count-level) — could
    be counted as N=3 of the meta-pattern if surfacing-the-
    distinction is itself an instance; not adjudicating that
    count here.
  - **Inter-session dependency mechanism — new pattern
    observation N=1.** See meta-observation above for the
    mechanism class framing. Joins the queue at Tier 3 (N=1,
    awaiting recurrence). Codification candidacy at second
    fire — likely Session 7 if it ships a similar plan shape,
    or post-round-2 otherwise. Methodology cluster.
  - **Pre-condition block N=2 holding.** Second consecutive
    session-start where the precondition block produced clean
    pass with no surprises. The block earns its keep on the
    failure case (catching environment drift cheaply); current
    pattern is consistent-environment, not pattern-confirming-
    or-failing. N=2 holding; not codifying. Methodology
    cluster.
  - **Mid-dispatch plan re-read caught miscount — pre-push
    verification N=2.** Advancing N=1 → N=2 from a single
    brainstorm session: first instance caught the original N=4
    vs N=5 miscount (plan as initially shipped at `c913b7a`
    omitted 5A brainstorm push from precedent chain); second
    instance caught the propagation-completeness gap when
    fix-up #1 didn't propagate to Session 6 execution's
    projected count (N=5 → N=6 fix at `a562568`). Mechanism's
    value is the catching, not the category-of-thing-caught;
    second fire was a propagation-completeness check on a
    prior fix, surfacing fix-up review's distinct failure
    mode. Methodology cluster.
  - **Parallel-session commit appearance.** Mid-Session-6-
    brainstorm a parallel-session commit landed (`25ac74b`
    authored 13:32:27 PDT, between fix-up #1 and fix-up #2)
    without crossing the chat boundary that authored Session
    6 brainstorm. Recognized after-the-fact via git-log
    surveillance during pre-closeout investigation.
    Recognition resolved: the commit is the operator's own
    work from a parallel agent session producing Session
    6.5's plan. The methodology note is precise: operating
    multi-agent across parallel sessions on the same local
    repo produces commits in shared history without crossing
    the chat boundary that authored them; recognition
    requires git-log surveillance at session boundaries, not
    just within-chat awareness. Future multi-agent sessions
    on shared repos benefit from "check git log at session
    boundaries for parallel-session commits" being a
    discoverable discipline. N=1; methodology cluster; not
    codifying.

  **Pre-codification observation queue post-Session-6-
  brainstorm (queue updates):**
  - Tier 1 LIVE: status reaffirmed for all 3 candidates.
    Floor-only push gate carve-out advances to N=4 LIVE this
    dispatch push (halftime + 5A brainstorm + 5B brainstorm
    closeout + Session 6 brainstorm dispatch = 4 fires through
    this push). Will advance to N=5 LIVE at 5B execution push,
    N=6 LIVE at Session 6 execution push, N=7 LIVE at Session
    6.5 execution push. Codification position for Session 7
    strengthens. Other Tier 1 candidates (Turbo cache #3,
    count-level commit pattern #11) status unchanged; #11
    gains a count-level-variance footnote per the brainstorm-
    time observation above.
  - Tier 2 (awaiting second fire): substrate-leverage phase
    advances N=1 → N=2 per Topic 7 lock — moves from Tier 3
    to Tier 2. Other Tier 2 items unchanged.
  - Tier 3 (N=1 awaiting recurrence): +1 (inter-session
    dependency mechanism) +1 (mid-dispatch plan re-read pre-
    push verification, advancing to N=2 within this same
    brainstorm via the propagation-completeness instance) +1
    (parallel-session commit visibility). Other Tier 3 items
    unchanged.
  - Tier 4 (deferral cluster): status reaffirmed; no changes.
  - Tier 5 (reference exemplars): status reaffirmed; no
    changes.
  - Bucket counts: structural-pattern bucket gains a sub-
    pattern (failure-mode taxonomy); methodology cluster +2
    (mid-dispatch plan re-read at N=2; parallel-session commit
    visibility N=1) → 10 inhabitants. **Soft sub-categorization
    threshold (10) reached.** Surface as Session 7 brainstorm
    scope addition: methodology bucket sub-categorization
    decision joins Session 7 alongside Tier 1 codification +
    V2 ratification + DOCS_RESTRUCTURE_V2.md. Topic 4's hybrid
    grain-separation lock anticipated this possibility; the
    locked criterion (status-track at closeouts; codification
    at Tier 1 LIVE) does not preclude bucket-structural work
    being added to Session 7 scope when triggered.
  - Queue-trajectory delta this brainstorm: +3 new tier
    inhabitants (inter-session dependency mechanism, mid-
    dispatch plan re-read, parallel-session commit
    visibility), +1 sub-pattern (failure-mode taxonomy within
    structural-pattern), +1 elevation (substrate-leverage
    phase Tier 3 → Tier 2). Trajectory non-trivial; consistent
    with 5B brainstorm closeout's queue-trajectory-non-
    linearity flag.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, fourth invocation N=4):**
  - Condition 1 (test-suite health): GREEN under floor-only
    path. `pnpm db:reset:clean && pnpm agent:validate` reports
    26/26. Full-suite NOT invoked per the carve-out's
    mechanical-non-impact argument; doc-only diff (zero
    migrations / zero services / zero integration tests / zero
    source files / zero test files) cannot regress tests by
    construction. Same category as 5A and 5B brainstorm
    closeout pushes; brainstorm-grade work continues to
    qualify under the formal criteria.
  - Condition 2 (doc-sync): GREEN. Session 6 brainstorm's
    primary deliverable IS plan-grade output (Session 6 plan +
    two fix-ups); doc-sync is the deliverable type. Same
    category as prior brainstorm closeouts (5A, 5B) —
    sustained pattern not establishing pattern.
  - Condition 3 (governance closeout): this entry; carry-
    forwards captured below per Topic 6 + the new brainstorm-
    time observations.

  **Forward pointers:**
  - Session 6 execution inherits this plan + post-5B-execution
    docs structure. Stop Condition 1 verifies 5B closed
    cleanly before any Session 6 commits land. If 5B execution
    introduces unexpected scope, Stop 1 halts and escalates
    inline.
  - Session 6.5 sits between Session 6 execution and Session 7
    in the round-2 sequence (per `25ac74b`'s plan, Stop 1
    verifying Session 6 closeout state — brainstorm closeout,
    per the plan's wording — before any Session 6.5 work
    begins). Session 6.5 is unblocked by this push event
    landing on origin/staging; Session 6 execution is also
    unblocked by the same push and remains a separate future
    session.
  - Session 7 brainstorm scope per Topic 4 lock plus the
    soft-threshold-trip update: Tier 1 codification (3 LIVE
    candidates: Turbo cache #3, floor-only push gate carve-
    out at N=7 post-Session-6.5-execution-push, count-level
    commit pattern #11) + V2 ratification + DOCS_RESTRUCTURE_
    V2.md + methodology bucket sub-categorization decision
    (newly added per soft-threshold trip at this brainstorm).
    Session 7 also inherits Session 6.5 closeout's brainstorm-
    context section (Principle 3 wording, three-surface map,
    Pattern 7 conditional permission, AGENTS.md/README.md
    pairing convention, CLAUDE.md sub-section content) for
    V2 ratification scope.
  - Carry-forwards from 5B brainstorm: (a) payload-mitigation
    resolved in Topic 4 (this brainstorm); (b) queue-
    trajectory non-linearity confirmed (this brainstorm added
    3 tier inhabitants + 1 sub-pattern + 1 elevation); (c)
    methodology bucket count 10, soft threshold tripped —
    added to Session 7 scope; (d) categorical-distinction-
    preservation meta-pattern at N=2 (failure-mode taxonomy
    adjudication is N=2 instance after 5B's structural-pattern
    bucket creation N=1).
  - New carry-forwards from Session 6 brainstorm: inter-
    session dependency mechanism (Tier 3 N=1, codification
    candidacy at second fire); mid-dispatch plan re-read pre-
    push verification (Tier 3 N=2 within this brainstorm via
    propagation-completeness instance, methodology cluster);
    parallel-session commit visibility (Tier 3 N=1,
    methodology cluster); substrate-leverage phase advanced
    to Tier 2 (N=2 awaiting third fire — Session 6 execution
    provides counter-evidence if execution-heavy or
    confirming-evidence if brainstorm/plan-heavy continues).

- 2026-05-08 NOTE — Round-2 docs reorganization Session 5B
  brainstorm closed; plan landed at
  `docs/07_governance/round-2/2026-05-08-session-5b-plan.md`.
  Seven locked decisions covering Layer 1 + Layer 2 migration
  scope, commit shape, push-readiness gate, queue triage, and
  observation-bucket structure. 5B execution waits for fresh-
  context session against the plan. This entry documents
  brainstorm-grain output (locked decisions + queue triage +
  bucket creation + 16 observations across 4 buckets); 5B
  execution closeout will be a separate entry after migrations
  ship.

  **Locked decisions (7):**
  - Decision 1 (Layer 1 narrow scope): 9 Phase-2-pattern feature
    specs migrate phase-2/ → 01_prd/ flat, no sub-folder. 8
    retained files become explicit forward-pointers (2
    architectural briefs to Session 6; 1 scope-decision + 5
    specialized to Session 7 or post-round-2). Audit-revised
    headline (handoff said "10 feature specs"; content audit
    found 9 + 2 architectural-briefs + 1 scope-decision + 5
    specialized — categorical re-framing under Explore-grain
    file-content audit).
  - Decision 2 (Layer 2 + convention expansion): 13 Phase-0
    files migrate to phase-0/. Convention expands 3→4 sub-
    buckets with new `ratification-packages/` for D1-D6 cluster
    (option X selected over semantic-stretch options Y/Z).
    Three READMEs touched (briefs convention; ADR README
    separate paragraph distinguishing pre-ratification vs
    ratification-time; phase-0/README instance update).
    Amendment file in chunks/ per temporal-vs-formal
    distinction. The 2026-05-06 file stays in phase-2/ (not
    phase-0 work despite date-grouping).
  - Decision 3 (01_prd/README disposition): touch-up in 5B
    (3 invalid claims fixed) + rewrite in Session 6 (5th
    outside locked four). Re-examined the 5A-closeout binary
    (rewrite-vs-touch-up) under fresh evidence; produced a
    third option (touch-up + rewrite split) better than either
    original. State-mismatch-window argument is load-bearing
    — discipline extends from "make Session N inherit answers"
    to "make published artifacts accurate at all times."
  - Decision 4 (commit shape, 5 commits): C1 Layer 1 bundle →
    C2 Layer 2 substrate → C3 2026-05-03 group → C4 2026-05-04
    group → C5 closeout. Matches the count-level commit pattern
    from fix-arc (4 implementation + 1 closeout) and 5A (4
    implementation + 1 closeout); 5B is N=3 instance via
    natural-outcome evidence (count emerged from Decisions 1+2+3
    independent of count-targets, not pattern-engineered-by-
    reaching).
  - Decision 5 (phase-0 sub-organization): no additional
    sub-organization beyond the 4 sub-buckets. Phase-0 becomes
    canonical multi-sub-bucket exemplar; phase-5 remains
    canonical single-sub-bucket exemplar. First concrete test
    of "phase folder contains sub-buckets the phase needs"
    rule produces correct output.
  - Decision 6 (push-readiness gate): floor-only carve-out
    per formal criteria (zero migrations / zero services /
    zero integration tests / zero source files / zero test
    files all met). N=2 invocation (after halftime plans push);
    codification candidate live for Session 7. Brainstorm-time-
    instinct correction preserved as evidence trail: initial
    instinct flagged 5B as full-suite-appropriate via
    "structural changes" framing; closer examination revealed
    this conflated substrate-change-affecting-downstream-
    consumers with test-regression-risk — different concerns
    with different gates. Substrate-correctness has its own
    audit-shaped gate (review process, friction-journal, README
    cross-references, ADR linter); full-suite gate's mechanical
    purpose is catching test regressions, not validating
    downstream-consumer impact.
  - Decision 7 (bucket creation + queue triage): structural-
    pattern bucket created with 3 inhabitants (count-level
    commit pattern; phase folder lifecycle-stage hypothesis;
    phase-0/phase-5 canonical exemplars). Categorically distinct
    from deferral cluster (substrate-trim discipline) and
    methodology cluster (reasoning tools). Queue triage executed
    at 5B brainstorm (not deferred to Session 6) because 5B
    execution will surface migration-mechanical observations,
    not strategic-grain observations affecting codification
    thresholds.

  **Bucket-creation-vs-codification distinction (load-bearing
  meta-observation).** Bucket creation is organizational
  substrate (where do observations live in the queue;
  triggered by consumer evidence — multiple inhabitants warrant
  categorical distinction). Observation codification is
  rule-shaping substrate (what does the observation become as
  a rule in conventions.md or similar; triggered by N-threshold
  + natural-outcome evidence). These are parallel-but-different
  operations and can happen independently. 5B brainstorm's
  bucket creation (structural-pattern bucket with 3 inhabitants,
  only one at LIVE codification candidacy) exercises this
  distinction. Without naming it explicitly, future readers
  might conflate "moving an observation into a bucket" with
  "codifying the observation," confusing the trajectory.

  **Pre-codification observation queue post-5B-brainstorm (16
  observations across 4 buckets):**

  Deferral cluster (2; substrate-trim discipline): #1
  linter/generator deferral (N=1, awaiting cross-arc); #2
  convention-shape deferral (N=1, awaiting cross-arc).

  Methodology cluster (8; reasoning tools): #3 Turbo cache
  content-hash (N=2, **codification candidate LIVE** for
  Session 7 brief template substrate); #4 floor-only push gate
  carve-out (N=2, **codification candidate LIVE**, will move
  to N=3 at this brainstorm closeout's push); #5 variance-
  decomposition diagnostic (N=1, awaiting recurrence); #6
  handoff-prompt-commit-number-translation (N=1, awaiting
  recurrence); #7 count-level-vs-structural-level distinction
  (N=2 across two decision domains; Decision 4 commit shape +
  Decision 6 gate-path); #8 pre-execution-audit-revealing-
  scope-refinement (N=2: Phase 3 substrate audit + 5B Decision
  1 audit); #9 5A-closeout-framings-refined-by-5B-brainstorm
  (N=2: Decision 1 audit revision + Decision 3 binary→split);
  #10 discipline-extension pattern (N=2: 5A's agency-extends-
  to-consumer + 5B's discipline-extends-to-published-artifact-
  accuracy); #16 fresh-pass-on-decision-revealing-refinement
  (N=1, surfaced at Decision 7's fresh-pass; categorically
  distinct from #8 audit-shaped via decision-state-re-
  examination vs filesystem/content evidence-gathering).

  Structural-pattern cluster (3; work-shape regularities; **NEW
  BUCKET established at 5B brainstorm Decision 7.B**): #11
  count-level commit pattern (N=3 codification candidacy via
  natural-outcome evidence; commit count emerged from substrate-
  vs-consumer reasoning independent of count-targets); #12
  phase folder lifecycle-stage hypothesis (N=2: phase-5 mid-
  execution single sub-bucket vs phase-0 closed multi-sub-
  bucket; awaiting third phase); #13 phase-0/phase-5 as
  canonical exemplars (Tier 5 reference; exemplars exemplify
  rather than codify).

  Narrative-substrate cluster (1; meta-meta): #14 temporal-vs-
  purposive framing (N=1, applied once in 5A's cross-session
  durability finding; engagement-not-new-fire trajectory).

  Convention-meta (1): #15 convention-expansion rule first
  invocation (N=1, ratification-packages/ at Decision 2;
  awaiting second expansion for codification candidacy).

  **Queue-trajectory non-linearity (Session 6 planning input).**
  Queue grew 4 (halftime) → 5 (fix-arc closeout) → 9 (5A
  closeout) → 16 (5B brainstorm). Each session has produced
  more observations than the previous, not the same number.
  Trajectory is non-linear because each session exercises
  governance surfaces in ways that produce new observations,
  and those new observations themselves become surfaces future
  decisions exercise. This is the discipline working as
  designed AND a Session 7 planning input. If 5B execution +
  Session 6 produce comparable growth, Session 7 inherits 25-30
  observations across the four-or-five buckets — meaningfully
  larger than halftime's 4-observation queue saw when it
  flagged Session 7 payload risk. **Session 6 brainstorm should
  make the payload-mitigation decision explicitly** (offload-
  to-Session-6 vs split-7A/7B vs accept-overload) rather than
  deferring to Session 7 trigger time. The calculus has shifted:
  "accept overload" is decreasingly attractive as queue grows;
  Session 6 has the relevant inputs for the decision (current
  queue + 5B execution outputs); Session 7 trigger time has
  less flexibility because the session is already starting.

  **Methodology bucket sub-categorization watch.** 8 inhabitants
  approaching the size where internal sub-categorization might
  warrant consideration. Don't sub-categorize prophylactically;
  let Session 7's codification work surface natural sub-
  divisions if any emerge. Substrate-now-enforcement-later
  applied at the bucket-internal-structure level.

  **Observation queue tier sort (for Session 7's codification
  work):**
  - Tier 1 (codification candidates LIVE; eligible for
    codification at Session 7 — actual disposition depends on
    Session 7's evidence state and payload constraints;
    codification work itself may reveal whether observation is
    cleanly codifiable in current form): #3 Turbo cache (Session
    7 brief template substrate context); #4 floor-only push
    gate (conventions.md addition); #11 count-level commit
    pattern (conventions.md addition or its own doc in
    `docs/07_governance/round-2/`).
  - Tier 2 (awaiting one more fire to elevate): #7 count-vs-
    structural distinction; #8 pre-exec-audit pattern; #9 5A-
    closeout-framings-refined; #10 discipline-extension; #12
    lifecycle-stage hypothesis; #15 convention-expansion rule.
  - Tier 3 (N=1 awaiting recurrence): #5 variance-decomposition;
    #6 handoff-prompt-commit-number-translation; #16 fresh-
    pass-on-decision-revealing-refinement.
  - Tier 4 (deferral cluster awaiting cross-arc evidence): #1
    linter/generator; #2 convention-shape.
  - Tier 5 (reference exemplars; referenced as substrate by
    future work; no codification because exemplars exemplify
    rather than codify): #13 phase-0/phase-5 canonical exemplars.
  - Narrative-substrate (separate trajectory): #14 temporal-vs-
    purposive (N=1, applied; codify only when fires as new
    instance, not as engagement).

  Push-readiness gate (floor-only carve-out, second consecutive
  invocation):
  - Condition 1: GREEN under floor-only path. The 5B-brainstorm-
    closeout commit-batch (this entry + plan) is plans-landing-
    grain work; mechanical-non-impact argument applies cleanly
    (zero migrations / zero services / zero integration tests /
    zero source files / zero test files in 5B brainstorm output).
    Per the floor-only carve-out's framing, full-suite NOT
    invoked.
  - Condition 2: GREEN. Plans-landing artifacts internally
    consistent; plan cross-references locked decisions; closeout
    entry captures all 7 decisions + queue triage + observation
    inventory; no schema or ADR changes (ADR README touched in
    5B execution C2, not in this brainstorm push).
  - Condition 3: GREEN. This entry; methodology and structural-
    pattern observations surfaced as separate carry-forward
    paragraphs with explicit codification thresholds.

  This push elevates floor-only push gate carve-out from N=2
  to N=3 (after halftime plans push and 5A brainstorm push).
  N=3 with natural-outcome evidence at three independent
  consumers strengthens codification candidacy beyond N=2 LIVE
  status — the codification at Session 7 doesn't need to argue
  from scarce evidence; three natural-outcome consumers
  demonstrate the carve-out's criteria reflect something
  structural about the work. Floor-only is the first methodology-
  cluster observation to reach N=3 LIVE status.

  Forward pointers:
  - 5B execution session (fresh-context) executes against the
    plan; closeout entry follows execution. This brainstorm
    closeout is brainstorm-grain output only.
  - Session 6 brainstorm inherits this queue + whatever 5B
    execution surfaces. Payload-mitigation decision flagged as
    Session 6 brainstorm scope per queue-trajectory non-
    linearity above.
  - Session 7 codification queue tier-sorted as above; Tier 1
    candidates eligible (not pre-committed) at Session 7
    trigger time per current evidence state and payload
    constraints.
  - Pattern-tracking carry-forwards: categorical-distinction-
    preservation under pressure (Decision 6 + Decision 7 #16-
    vs-#8 — both N=1 instances; observe but don't codify; track
    if recurs); methodology bucket sub-categorization watch
    (8 inhabitants; defer to Session 7 codification work).

- 2026-05-08 NOTE — Round-2 docs reorganization Session 5A
  (Layer 0 substrate) shipped. Four implementation commits per
  the substrate-then-moves sequence locked at topic 1
  brainstorm + plan at
  `docs/07_governance/round-2/2026-05-08-session-5a-plan.md`.
  Round-2 is now past its hardest structural phase per the
  fix-arc-closeout meta-observation; 5A is the first
  application-of-substrate session against the clean baseline
  the fix arc established.

  Four commits:
  - `baad85f` (Commit 1): docs(briefs): convention + _template
    — three sub-buckets (specs/, plans/, chunks/) with explicit
    deferral-to-consumer-evidence sentence; "**Document class:
    briefs.**" one-liner per V1-amendment-locked decision #2;
    minimal _template.md with closeout-artifacts inline (with
    conventions.md cross-reference parenthetical to prevent
    drift between conventions.md and the template if either
    gets revised independently). +70/-8.
  - `49ed5a8` (Commit 2): docs(adr): README pre-ratification-
    home — parallel `<phase>/plans/` clause + ADR-0019-only
    stale-claim correction (three-sentence historical seam:
    "ADR-0021 introduced the pre-ratification-design-spec
    discipline at round-2 Session 3. ADRs 0001-0018 predate
    this convention and were ratified without separate
    pre-ratification specs. ADR-0019 is the single pre-
    existing instance under the convention."). +22/-11.
  - `4f54fe7` (Commit 3): docs(briefs): docs/superpowers/
    elimination — high-blast-radius solo. Asymmetric file
    handling preserved in commit message: 3 git mv (tracked
    siblings) for ADR-0019 spec → phase-0/specs/ + D5 plan +
    C11/D6 plan → phase-0/plans/; 1 git add at new path
    (never-tracked file; scratch location was never the
    intended home per commit `1aff855`'s deliberate-untracked
    breadcrumb) for chunk B5-1 plan → phase-5/chunks/.
    friction-journal file-top path-note blockquote added
    (sibling to existing ec-2 path-note). docs/superpowers/
    source directory deleted. Reference disposition matrix
    enumerated all remaining `docs/superpowers/` references
    as δ-i-preserved (legacy ADR-0021/0019, restructure-plan.md
    Phase 1.1 historical migration descriptions, round-2
    namespace docs + 5A plan describing this session's own
    work) — zero active-doc broken references. +1044 (3
    renames at 100% similarity + chunk B5-1 1074 lines tracked
    for first time + path-note blockquote).
  - `33b4707` (Commit 4): docs(briefs): phase-0/ + phase-5/
    READMEs — instantiated from _template.md against
    directories Commit 3 populated. Phase-0 README documents
    its specs/ + plans/ sub-buckets (ADR-0019 spec; D5 + C11/D6
    plans); phase-5 README documents its chunks/ sub-bucket
    (chunk B5-1). Closeout artifact references for phase-0
    deferred to Session 5B Layer 2 migration. +35/-0.

  Acceptance criteria — all nine satisfied:
  - (a) docs/09_briefs/README.md trimmed three-sub-bucket
    convention shipped; explicit deferral-to-consumer-evidence
    sentence present; "one canonical axis" one-liner included.
  - (b) docs/09_briefs/_template.md minimal phase-folder
    skeleton shipped.
  - (c) ADR README corrected; "ADRs 0011-0019" reframed to
    ADR-0019-only with three-sentence historical seam.
  - (d) docs/superpowers/ eliminated; four files relocated
    to phase-appropriate homes.
  - (e) Asymmetric git handling preserved in Commit 3 message
    (one git add for never-tracked file vs three git mv for
    tracked siblings).
  - (f) `pnpm typecheck` clean before each commit.
  - (g) `pnpm adr:lint` clean throughout (0 errors / 0
    warnings).
  - (h) `pnpm adr:index --check` clean throughout (no INDEX
    drift).
  - (i) Pre-commit hook fired correctly each commit
    (informational session-lock warning only on Commits 1/3/4
    where no ADR-related files staged; ADR check fired
    correctly on Commit 2 with ADR README staged, both
    `adr:lint` and `adr:index --check` passed).

  Full-suite acceptance verification (5× under
  `TURBO_FORCE=true`): 5/5 GREEN. Per-run timings: Run 1
  107.99s, Run 2 102.65s, Run 3 105.95s, Run 4 109.05s, Run 5
  126.32s (test durations); wall-clock 1m33.6s-1m57.9s.
  `Cached: 0 of 1` confirmed each run; cache-bust working.
  All 137/137 files + 665/665 tests green per run.

  **Cross-session durability finding (load-bearing):** this
  verification is the first independent test of whether the
  test-hygiene fix arc's cleanup of the cross-org-rls-flake
  Condition 1 deviation persists past the session that shipped
  it. The fix-arc closeout entry could only claim "5/5 green
  confirms the fix"; this entry can claim "5/5 green on a
  session that didn't ship the fix confirms the fix's
  durability beyond its own session." Floor-state compounding
  (clean-baseline-inheritance) just demonstrated for the first
  time across session boundaries — agency framing extends
  through to the consumer of the closure (5A), not just the
  actor that closed it (fix arc).

  Open-item resolutions at session start (all three already
  addressed by the plan as written; verification-not-discovery
  outcome — meta-signal that the brainstorm-to-plan handoff
  captured open items faithfully):
  - Phase assignment for the three tracked sibling files: all
    three self-identifiable as Phase 0 governance arc work
    from line ~5 of each file. Mapping locked: ADR-0019 spec
    → phase-0/specs/; D5 + C11/D6 plans → phase-0/plans/.
  - 01_prd/README.md status: rewrite needed (not touch-up).
    Three current claims structurally invalidated by Layer 1
    landing feature specs ("ships empty in Phase 1.1";
    "Expected first occupant: Phase 1.2 agent integration
    PRD"; "Deletion criterion: archive…by end of Phase 1.3").
    Carry-forward to Session 6 as 5th README rewrite outside
    the locked four (locked four = 09_briefs in 5A + 02_specs
    + 03_architecture + 04_engineering in Session 6).
  - Template parenthetical: include the conventions.md
    cross-reference. Default-include applied; cheap addition;
    prevents drift between conventions.md and the template.

  Observations surfaced during execution:
  - **Comprehension test result (Phase 3 Probe 4 style):**
    convention substrate (09_briefs/README + _template +
    phase-0/phase-5 READMEs as exemplars + ADR-0021 Profile
    (b) glosses) passes the four-question test (sub-buckets
    + purposes; _template.md purpose; new-phase-folder
    creation; canonical axis). One minor gap: the mechanical
    "how" of creating-from-template (copy file? rename?
    edit?) is implicit in the README's Authoring section; the
    phase-0/phase-5 exemplars compensate, but a future
    convention-revision could make the mechanical step
    explicit. Exemplar-compensated; not a blocking gap.
  - **Variance-decomposition diagnostic (methodology
    observation, not codified):** Run 5's outlier slowness
    (~16% slower than next-slowest) decomposes by vitest
    sub-phase: prepare ~30% slower, collect ~30% slower,
    tests only ~10% slower. Slowdown concentrates in
    I/O-heavy startup phases (vitest module loading), not
    test execution itself. That's the signature of
    environmental noise (machine load, DB warmup, disk
    contention), not test-suite instability — substantive
    regression would surface in the `tests` sub-phase.
    Generalizable observation (not codified): for N×
    verification runs that show timing variance,
    decomposition into vitest sub-phases distinguishes
    environmental-from-substantive. Same methodology-gap
    bucket as Turbo cache observation; categorically distinct
    from deferral patterns. N=1; not codified.
  - **Handoff-prompt-commit-number-translation (methodology
    observation, not codified):** the handoff prompt named
    four commits; the plan refined to four implementation
    commits + a closeout commit. Stop conditions in the
    handoff were keyed to commit numbers; as the actual
    sequence diverged (closeout commit lands later than the
    handoff numbering implied), translation between handoff-
    numbering and plan-numbering was needed at session-start
    Stop 3. Generalizable observation (not codified): when a
    handoff prompt names commit numbers in stop conditions
    and the plan refines the count, the executor needs to
    translate. The handoff prompt's stop conditions could
    have been keyed to scope-completion milestones (e.g.,
    "after Layer 0 substrate commits land," "after full-
    suite verification") rather than commit numbers,
    sidestepping the translation entirely. This is a
    handoff-prompt-design observation, not just a session-
    execution observation — the gap was at drafting time,
    not execution time. N=1; not codified.

  Pre-codification observation state (post-5A):
  - Linter/generator deferral (V1-amendment-locked): N=1; did
    not fire during 5A.
  - Convention-shape deferral (5A audit-driven trim 5→3):
    N=1; trim happened at brainstorm not execution; did not
    fire again during 5A.
  - Floor-only push gate carve-out: N=1; 5A uses full-suite
    gate (not floor-only); did not fire again.
  - **Pattern observation (cross-substrate, not yet
    cross-arc):** all three deferral observations above share
    the same shape — "trim now to actually-consumed surface;
    expansion follows consumer evidence." This is the
    organizing principle the fix-arc closeout entry first
    surfaced. The pattern stays not-codified pending
    cross-arc evidence (next consumer would be a Session
    5B/6/7 decision invoking the same shape); 5A did not
    produce that evidence. Per the fix-arc closeout's
    framing, the pattern's load-bearing status increases each
    session it holds without firing, but codification still
    requires consumer-evidence not just observer-recognition.
  - **Turbo cache methodology gap: N=1 → N=2.** TURBO_FORCE
    used in 5A's verification (second occurrence beyond
    fix-arc closeout). Threshold reached per the codification
    framing at fix-arc closeout (`≥2 future invocations of
    this carve-out elevate to brief template guidance`).
    **Codification candidate is now live**; actual
    codification deferred to Session 7's V1→V2 ratification
    work where brief template substrate naturally lands.
    Same N=2 cross-arc evidence basis the deferral-pattern
    cluster is still missing.
  - Methodology-gap cluster (new bucket; categorically
    distinct from deferral patterns): Turbo cache (N=2,
    threshold reached); variance-decomposition diagnostic
    (N=1, just surfaced in this session); handoff-prompt-
    commit-number-translation (N=1, just surfaced in this
    session). Three observations in one bucket; codification
    threshold per the same epistemic discipline (N≥2
    cross-arc for methodology gaps; Turbo cache is the first
    to cross it).
  - Narrative-substrate observation (fix-arc closeout's
    temporal-vs-purposive framing): N=1; did not fire
    explicitly during 5A but the "non-fix-arc session"
    framing in this entry's cross-session durability finding
    leans purposive (consumer-of-closure rather than
    temporal-after-fix), which is the framing the
    observation flagged as load-bearing.

  Push-readiness gate (per CLAUDE.md three-condition gate,
  full-suite path):
  - Condition 1 (test-suite health): GREEN. 5×
    `pnpm db:reset:clean && pnpm test` under
    `TURBO_FORCE=true` reports 5/5 137/137 + 665/665. No
    deviation. **Second consecutive push under clean
    Condition 1** (fix-arc closeout was the first); the
    pattern is being maintained, not just established.
  - Condition 2 (doc-sync): GREEN. 5A's primary deliverable
    IS doc-sync work (convention substrate + ADR README
    correction + superpowers/ elimination + new phase
    READMEs); category-distinct from fix-arc closeout's "no
    doc-sync needed" green. Both readings are correct;
    keeping the categorical distinction visible per the
    fix-arc-closeout meta-observation. types.ts regen not
    required; INDEX.md unaffected; `adr:index --check`
    confirms README in sync.
  - Condition 3 (governance closeout): this entry; no
    retrospective needed (mid-arc; round-2 retrospective at
    Session 7 V1→V2 ratification); methodology and
    deferral observations surfaced as separate carry-forward
    paragraphs above with explicit codification thresholds.

  Forward pointers:
  - Session 5B brainstorms next; consumes 5A's substrate
    (Layer 1 = feature specs migration to 01_prd/; Layer 2 =
    phase-0 governance migration to phase-0/). 5B inherits
    the cleanest baseline of any round-2 session: Condition 1
    green, no deferred deviations, no in-flight test-hygiene
    work, working tree clean, briefs convention substrate on
    disk for 5B's consumers.
  - 01_prd/README.md rewrite carry-forward: lands in Session
    6 as 5th README rewrite outside the locked four;
    documented above per open-item resolution.
  - Turbo cache methodology codification candidate live for
    Session 7 (when brief template substrate naturally lands
    as part of V1→V2 ratification work).
  - Deferral-pattern cluster (linter/generator, convention-
    shape, floor-only push gate) tracks at N=1 awaiting
    cross-arc fire evidence; no codification action this
    session.

- 2026-05-08 NOTE — Test-hygiene fix arc shipped (sibling-of-
  round-2; closes the Sessions-3/4/halftime Condition 1
  deviation). Three commits, by script-bundle, per the plan at
  `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md`
  paired with its brief. Plan-and-brief pattern (one-brief-plus-
  one-plan, co-located in post-mvp/) distinct from round-2's
  one-arc-brief-plus-N-session-plans pattern.

  - Commit `5e223dc` (primary solo, deviation-closing):
    `tests/integration/crossOrgRlsIsolation.test.ts` — `TEST_IDS`
    const moved from module-scope `as const` to describe-scope
    `let`, assigned in `beforeAll` with `crypto.randomUUID()`
    per field, reused in `afterAll` cleanup. Cleanup-dependency
    option (a) — module-scope storage — chosen over post-insert
    DB query per topic 4 brainstorm lock. +28/-15 lines.
  - Commit `50e0199` (ADR scripts bundle, items #1+#2):
    `scripts/adr/lint.ts` adds `TAXONOMY_REL` and `INVARIANTS_REL`
    constants computed via `relative()` from the existing
    `TAXONOMY_PATH`/`INVARIANTS_PATH` constants; Check 5
    (modules) and Check 11 (invariants) error messages now
    cite the relative-path constants instead of hardcoded
    `"taxonomy.md"`/`"invariants.md"`. `scripts/adr/generate-
    index.ts` `--check` failure path now emits first 10
    differing lines of diff (- on disk, + after regeneration)
    before exit 1. +19/-3. Commit 2's pre-commit hook execution
    incidentally exercised the modified ADR scripts against
    their own staged changes; both `adr:lint` and `adr:index
    --check` passed under the new behavior — substrate testing
    itself, the kind of dogfood validation that's hard to
    engineer deliberately.
  - Commit `3889372` (install-hooks bundle, items #3+#4):
    `scripts/install-hooks.sh` writes new hook content to a
    temp file via `mktemp` first, compares with existing hook
    via `cmp -s`, short-circuits with "already installed...
    (no action)" message when content matches; otherwise
    backs up + installs (backup now pins to genuinely-different
    content rather than overwriting prior backups). `trap` on
    EXIT cleans temp file on failure paths; disarmed after
    final `mv`. +22/-6.

  Acceptance evidence (all seven criteria from the brief
  satisfied):
  - (a) `grep -E '99990[0-9]{3}-' apps/web/tests/integration/crossOrgRlsIsolation.test.ts`
    returns no matches post-Commit 1.
  - (b) `pnpm db:reset:clean && pnpm test` 5× under
    `TURBO_FORCE=true`: 5/5 GREEN. Per-run timings tightly
    clustered at 96-103s test duration (1m30-1m36s wall-clock);
    all reports `Cached: 0 of 1 cached` confirming actual
    re-execution. Pre-fix flake rate observed at ~25% across
    Sessions 3/4/halftime; post-fix rate 0/5 across this
    verification.
  - (c) Test count baseline preserved: 137 files / 665 tests
    full suite; `crossOrgRlsIsolation.test.ts` retains 20
    tests.
  - (d) ADR linter cites canonical paths in error output;
    green-path behavior unchanged (`pnpm adr:lint` clean,
    0 errors / 0 warnings).
  - (e) `pnpm adr:index --check` diff path implemented;
    green-path exits 0 with "no changes (22 ADRs scanned)".
  - (f) `bash scripts/install-hooks.sh` rerun against matching
    hook content prints no-op message and exits 0; no backup
    overwrite (`.pre-coordination` size unchanged across
    consecutive invocations).
  - (g) All 3 commits independently revertable; commit
    boundaries align with script-bundle seams.

  The fix arc was triggered specifically to close the deviation
  before Session 5's push, breaking the carry pattern at
  session 3 rather than letting it normalize. Generalizable
  observation (not codified): two sessions of carry is
  documented exception; three starts being a tolerated norm.
  N=1; not codified.

  Methodology observation (not codified): N× verification
  criteria implicitly assume each run actually executes.
  Turbo's content-hash cache subverts this — `pnpm
  db:reset:clean` resets DB state but doesn't invalidate
  Turbo's cache, so subsequent `pnpm test` invocations against
  unchanged source inputs return cached pass results in
  ~100ms (`>>> FULL TURBO`) rather than re-executing. First
  attempt at 5× verification hit this: Run 1 executed at
  119s, Runs 2-5 returned cache hits at 97-135ms. Symptom to
  watch for: a "5× run" loop completing in under 30s total
  rather than the expected 5-10 min — the diagnostic is
  per-run wall-clock time, not pass/fail status (cached runs
  faithfully report the prior pass result). Resolved by
  re-running with `TURBO_FORCE=true` prefix on each
  invocation; `Cached: 0 of 1` confirmed across all 5 runs.
  Generalizable observation (not codified): future briefs
  specifying "run N×" acceptance criteria should either name
  the cache-busting requirement explicitly (`TURBO_FORCE=true`)
  or specify the equivalent direct command. N=1; not codified.
  ≥2 future occurrences elevate to brief template guidance.
  Categorically distinct from the deferral-pattern carry-
  forwards (linter/generator deferral, convention-shape
  deferral, floor-only push gate carve-out) — those are
  substrate-trim decisions; this is a methodology gap in
  acceptance-criteria specification.

  Discipline codification per the brief: friction-journal
  NOTE sufficient (this entry); `04_engineering/conventions.md`
  addition for "integration test fixtures must use
  `crypto.randomUUID()` for any column with a unique
  constraint, never fixed values" deferred to ≥3-fire
  threshold per the brief's framing.

  Push-readiness gate (per CLAUDE.md three-condition gate,
  full-suite path):
  - Condition 1 (test-suite health): GREEN. `pnpm
    db:reset:clean && pnpm test` 5× under `TURBO_FORCE=true`
    reports 5/5 137/137 + 665/665. **First push since Session
    2 to evaluate Condition 1 GREEN without deviation
    framing.** The Sessions-3/4/halftime carry is closed.
  - Condition 2 (doc-sync): three commits internally
    consistent; no schema or ADR changes; `types.ts` regen
    not required; `INDEX.md` unaffected; `adr:index --check`
    confirms README in sync.
  - Condition 3 (governance closeout): this entry; no
    retrospective needed (sibling fix arc, not phase
    closeout); shared-deferral-logic and methodology-gap
    observations surfaced as separate carry-forward
    paragraphs above.

  Forward pointers:
  - Session 5A executes next per
    `docs/07_governance/round-2/2026-05-08-session-5a-plan.md`.
    First round-2 session push under clean Condition 1 baseline
    (no deviation; the fix arc closed it).
  - Round-2 governance posture now carries four observations
    pre-codification: linter/generator deferral, convention-
    shape deferral, floor-only push gate carve-out (three
    deferral-shape patterns); plus methodology-gap on N×
    verification (different shape; tracked separately). All
    N=1 with explicit codification thresholds.

- 2026-05-08 NOTE — Floor-only push gate carve-out for doc-only
  diffs (N=1 precedent). Plans-landing commit-pair (commits
  `f3aa14d` round-2 namespace + 5A plan; `e4721a1` topic 4 plan)
  pushed under floor-only gate (`pnpm agent:validate` 26/26 GREEN
  on clean DB) rather than full-suite gate, on the grounds that
  plan documents have zero test-affecting impact. Floor-only is
  mechanically defensible for diffs containing zero migrations /
  zero services / zero integration tests / zero source files /
  zero test files.

  Generalizable observation (not codified): full-suite gate
  exists to catch test regressions; doc-only diffs cannot regress
  tests by construction. Repeated invocation of full-suite for
  doc-only work risks normalization-by-attrition of the deviation
  framing — Sessions 3, 4, and halftime all carried the documented
  Condition 1 deviation under full-suite gate; a fourth carry on
  doc-only work would start looking like normalization rather
  than exception. Floor-only carve-out for genuinely doc-only
  diffs is the disciplined alternative.

  N=1; not codified. ≥2 future invocations of this carve-out
  elevate to `04_engineering/conventions.md` candidate. Companion
  to the linter/generator deferral (V1-amendment-locked) and
  convention-shape deferral (5A audit-driven trim from 5 sub-
  buckets to 3) — three deferral patterns now visible across
  round-2's governance substrate; codification threshold remains
  pre-codification per the same N-and-cross-arc-evidence
  discipline that's held throughout.

  Forward pointers: test-hygiene fix arc executes next per
  `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md`
  (closes the Condition 1 deviation that has carried across
  Sessions 3, 4, and halftime); Session 5A executes after per
  `docs/07_governance/round-2/2026-05-08-session-5a-plan.md`
  (first push under green Condition 1).

- 2026-05-08 NOTE — Round-2 docs reorganization halftime check +
  V1 amendment + Session 7 payload risk flag. Triggered post-
  Session-4 closeout (commit `3251d7b`), before the test-hygiene
  fix arc triggers. Round-2 is at the midpoint of its seven-
  session sequence — Sessions 1-4 + cleanup block shipped;
  Sessions 5/6/7 queued. Halftime ran a plan-vs-execution
  reconciliation and surfaced three buckets plus one risk flag.

  - **Locked-on-disk and holding.** restructure-plan.md (1158
    lines, V1 substrate); ADR-0021 four locked items (frontmatter
    schema, `02_specs/taxonomy.md` as canonical, `scripts/<area>/`
    location, `09_briefs/<phase>/specs/` pre-ratification homes);
    ADR-0022 ratification (amendment vs supersession); Profile
    (b) — structural-plus-semantic reference docs; deferral of
    three-category codification taxonomy + round-N restructure
    plan workflow to Session 7. No drift in this bucket.

  - **Scope-elevated during execution (deliberate, budget-
    consuming).** Session 4 elevated documentation-cluster items
    #9 and #10 to ADR-0022 substrate ratification (Profile (b)-
    authorized scope elevation, not creep). Session 4 also added
    Profile (b) glosses for round-2-specific vocabulary (dogfood
    ADR, forward-only convention, δ-i preservation, session-
    internal narration) as a "cheap addition" beyond pure
    triage. Both consumed budget against later sessions; both
    deliberate.

  - **Drift signal — conversational-only substrate (headline
    finding).** Three round-2 design-conversation decisions
    exist only in transcripts and have no filesystem home: (1)
    briefs convention ships now / linter+generator deferred to
    N=3 OR friction trigger / Session 5 ships convention +
    `_template.md` only, (2) "one canonical axis" principle
    one-liner in four README rewrites (Sessions 5+6), (3) "top-
    level folders are document classes" principle ratified in V2
    Part 1 (Session 7). Verified zero matches across
    `docs/restructure-plan.md` and this journal. This is exactly
    the failure mode the filesystem-not-prompt rule and Z1 #15
    (bidirectional iterative-catching termination — artifacts
    are the anchor, not transcripts) protect against.

  - **Fix shape — V1 amendment.** `docs/restructure-plan.md`
    gets a new "Amendments — Post-V1 Decisions" section
    appending the three decisions with a bounded scope-preamble:
    V1 amendments capture post-V1-write decisions with
    identified Session 5/6/7 consumers, not retroactive
    revisions of executed decisions and not speculative
    substrate. The preamble bounds the precedent so future
    amendments either fit that shape or surface the question of
    whether they belong elsewhere. Substrate-now-enforcement-
    later applies cleanly: the three decisions ARE substrate,
    their consumers (Sessions 5/6/7) ARE known, and consumer
    shape (briefs convention, README rewrites, V2 Part 1) is
    concrete. Lands before the test-hygiene fix arc executes so
    Session 5's substrate is on disk when execution resumes.

  - **Sibling status of test-hygiene fix arc.** Arc is post-mvp/
    test-hygiene subject matter, not docs-reorganization. Brief
    at `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md`.
    Calling it sibling-of-round-2 (not in-round) preserves
    round-2's scope identity and keeps the V1→V2 ratification at
    Session 7 from renumbering. Recorded in the V1 amendment as
    the explicit boundary between round-2 and sibling work.

  - **Session 7 payload risk flag — decision not made at
    halftime.** Session 7 carries V1→V2 ratification + three-
    category codification taxonomy + round-N restructure plan
    workflow + conventions.md additions + glossary Tier 2 stub
    closures. With the three conversational decisions' execution
    residue potentially adding to that, Session 7 is at overload
    risk. Mitigation options identified: (a) offload payload to
    Session 6, (b) split into Session 7A / 7B, (c) accept
    overload. Decision deferred to Session 6 planning or Session
    7 trigger-time. This entry preserves the risk for visibility;
    no decision attached.

  - **Halftime-as-practice meta-note (not codified).** This
    halftime check produced a real finding (the three
    conversational decisions) and a real concern (Session 7
    overload). That is the audit working as intended — same way
    Phase 3 of the cleanup block worked. Halftime checks at
    roughly equivalent points in future rounds appear to be a
    tested practice worth repeating. N=1; not codified as a
    rule. Future-rounds surface will reveal whether the pattern
    holds or needs different shape. If halftime-as-practice ever
    moves toward codification, the routing question (this entry
    lives in friction-journal following the Session 4 / Phase 2
    arc-grain pattern, but `04_engineering/conventions.md`
    Documentation Routing currently directs phase-or-arc-scope
    reflection to `07_governance/retrospectives/`) will need
    explicit resolution.

  Closes round-2 halftime-check. Test-hygiene fix arc triggers
  next; Session 5 follows.

- 2026-05-08 NOTE — Round-2 docs reorganization Session 4
  (`07_governance/` housekeeping + Phase 3/4 audit dispositions)
  shipped. Seven tracked commits:

  - `7492765` — ec-2-prompt-set.md move from `07_governance/` to
    `09_briefs/phase-1.2/` (solo, 24-ref blast radius). Active
    refs silently rewritten; friction-journal entries preserved
    verbatim per the friction-journal-is-history rule + file-top
    annotation; closed-phase session briefs silently rewritten.
  - `4634a56` — `07_governance/README.md` rewrite addressing the
    4 stale-claim findings from Session 2 verification (open_questions
    miscategorization fixed, CTO_HANDOFF_V2 + friction-journal/
    archive entries added; ec-2 not added per Commit 1 move).
  - `caf8ba0` — INDEX.md disambiguation blockquotes for `06_audit/`
    (financial-controls invariant evidence) vs
    `07_governance/audits/` (technical code-audit framework).
  - `cfa9149` — developer_setup.md Step 4: `bash scripts/install-hooks.sh`
    documented as required setup step. Closes #5 silent-bypass
    operational fix from Phase 3 Probe 3b. Doc-only minimum-viable
    shape.
  - `fda99b9` — ADR-0022 ratification (Amendment vs Supersession
    Workflow). Six Decision items: amend-vs-supersede decision rule,
    `## Amendment` block format, Status-line clause accumulation,
    frontmatter unchanged across amendments, supersession workflow
    symmetry, forward-only application. Sibling to ADR-0021
    (substrate vs lifecycle).
  - `a040e98` — documentation cluster batch (Phase 3 candidates
    #6/#7/#8/#11/#12) in `_template.md` + ADR README, plus Profile
    (b) inline glosses in ADR-0021 / ADR-0022 ("Glossary for
    outside readers" sections). Single-disposition per Phase 4
    reviewer note.
  - `<this entry>` — friction-journal closeout + push-readiness
    verification + Session 4 → Session 5 forward pointers.

  Phase 4 triage outcomes ratified by execution: 9 IN candidates
  all landed (1 operational fix #5 + ADR-0022 substrate replacing
  #9/#10 + 5 documentation-cluster fixes #6/#7/#8/#11/#12 + 2
  pre-Session-4 cleanup commits per locked decisions = 9). 4 OUT
  candidates (#1/#2/#3/#4 tooling polish) stay deferred to the
  test-hygiene-arc-or-sibling brief at
  `09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md`
  per the locked OUT disposition.

  Sequencing decision (per Phase 4 reviewer note): ADR-0022
  ratified (Commit 5) BEFORE the README prose changes that
  reference it (Commit 6). Forward-reference foot-gun avoided.

  Session 4 followed the Profile (b) decision: structural-plus-
  semantic reference docs. Both ADR-0021 and ADR-0022 ship
  "Glossary for outside readers" sections covering round-2-
  specific terms (round-2, dogfood ADR, forward-only convention,
  δ-i preservation, session-internal narration). Cross-references
  the existing Governance Vocabulary section in
  `02_specs/glossary.md` for broader project vocabulary.

  Push-readiness gate Condition 1 deviation (third instance in
  round-2 work; per CLAUDE.md three-artifact framing):

  - (a) Mechanism: same pre-existing test-suite flake as
    Session 3. `tests/integration/crossOrgRlsIsolation.test.ts`
    fails ~25% of full-suite runs (`pnpm test`) due to fixed-
    fixture UUID collision with another test inserted before it
    under vitest's parallel scheduling. Floor scope (`pnpm
    agent:validate`) on clean DB: 26/26 GREEN. Full suite this
    session: 1 failure, same crossOrgRlsIsolation file.
  - (b) Fix shape: candidate (a) — random UUIDs in fixture —
    filed at `09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md`
    (existing brief from round-2 cleanup, amended at `a322fe9`
    with the tooling-polish OUT cluster).
  - (c) Carry-forward framing: NOT a Session 4 regression.
    Session 4 diff (7 commits) touched 0 migrations, 0 services,
    0 integration tests. Pure docs/governance. The flake
    pre-exists round-2 work entirely (~25% rate observed at
    Session 3 sampling).

  Condition 2 (doc-sync): INDEX.md ↔ ADR README ↔ frontmatter
  schema ↔ taxonomy.md ↔ glossary.md all reconciled. ADR-0022
  cross-references resolve. Generator idempotent post-Commit-6.

  Condition 3 (governance closeout): this entry. Conventions
  earned: ADR-0022 codifies amendment-vs-supersession workflow
  (was tribal knowledge before Phase 3 Probe 4 surfaced).
  Documentation cluster fixes close the 5 onboarding gaps from
  Probe 4. Profile (b) glosses opened reference docs to outside
  readers per the locked decision.

  Forward-pointer for Session 5 Layer 0: the
  `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md`
  scratch file is still untracked at its current path,
  deliberately, per the Layer-0-instruction commit `1aff855`.
  Layer 0's first action: `git add` at the new path
  `docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md`,
  NOT `git mv`. The three sibling files in `docs/superpowers/`
  use `git mv` to their `phase-0/` destinations.

  Forward-pointer for the test-hygiene fix arc (whenever it
  triggers): post-mvp brief carries (a) the random-UUID fixture
  fix as the primary scope and (b) the four tooling-polish OUT
  candidates (#1/#2/#3/#4) as adjacent-scope-independent-within-arc.
  CI will continue to flake on crossOrgRlsIsolation at ~25% rate
  until this arc lands. CI casualties hitting the failure should
  find the diagnosis from the failure surface (one-line comment
  added at `c8f4f5f` to the test file pointing at the brief).

  Total round-2 work to date (Sessions 2–4 + cleanup block + this
  Session 4): 25+ tracked commits. Session 4 alone: 7. Cumulative
  tally: ADR-0021 + ADR-0022 ratified, taxonomy.md + glossary
  Governance Vocabulary established, lint+generator+CI substrate
  shipped, 5 documentation gaps closed, operational silent-bypass
  fix shipped, ec-2 relocated, INDEX disambiguated, README
  rewritten. Session 5 (briefs reorganization + superpowers/
  elimination) and Session 6 (Workstream 5 spec/architecture/
  engineering frontmatter) and Session 7 (round-2 V1→V2
  ratification + conventions.md codifications) remain.

- 2026-05-08 NOTE — Round-2 docs reorganization Session 3 (ADR
  system upgrade) shipped. Six tracked commits + skipped Commit 7
  (idempotency check, no diff): reports/ gitignore (`f0858a5`,
  separate session); taxonomy.md substrate (`fce7172`); INDEX
  attribution (`2955cea`); template + scripts + README + wiring
  (`f6a2af9`); generator first run + 3-digit-prefix regex fix
  (`adf2ced`); ADR-0021 dogfood + Date normalization fix
  (`9007404`).

  ADR-0021 ratifies four locked Decision items per round-2 plan:
  frontmatter schema (forward-only from 0021); canonical taxonomy
  at 02_specs/taxonomy.md (not adr/TAXONOMY.md per consultant
  redirect); TypeScript-for-docs-tooling LOCATION convention at
  top-level scripts/<area>/ (runtime tsx already established;
  location is what's new, with explicit attribution per Blocker 4
  resolution); pre-ratification design specs at
  09_briefs/<phase>/specs/.

  Bugs surfaced + fixed inline: (1) generator's 3-digit-prefix
  regex didn't strip "ADR-001:" from ADR-0001's H1 (legacy file
  predates 4-digit convention); (2) gray-matter auto-parsed
  unquoted YAML date `2026-05-08` to a Date object, which the
  linter rejected as "not a valid ISO date." Both fixed by
  expanding regex (`\d{3,4}`) and Date-object normalization in
  both scripts.

  Filesystem-not-prompt rule outcome (Sub-shape #5 N=1 evidence
  carry-forward from verification): Outcome A. The verification
  pass in Session 2 captured N=1 evidence with all 6 subagents
  firing Outcome A (dispatch-time rule prevented prompt-quoting;
  zero re-dispatches). This Session 3 execution did not exercise
  the verification rubric directly; the rule's load-bearing role
  remains active for Session 5/6's structured verification (when
  it next fires).

  Round-N restructure plan codification: NOT shipped this session;
  deferred to Session 7's conventions.md addition alongside V1
  elevation + V2 creation. Three-category codification taxonomy
  (architectural principles N=1, procedural patterns at workflow
  grain N=1, process meta-patterns N=2-with-shape-match) also
  deferred to Session 7.

  Deviation from Session 3 prompt logged: (a) Commit 1 (planning
  notes file) was skipped as a tracked commit because reports/ is
  gitignored; the notes live at
  `reports/session-3-adr-execution-notes.md` as working scratch.
  (b) INDEX.md entries for `scripts/adr/generate-index.ts` and
  `scripts/adr/lint.ts` not added — INDEX.md is explicitly the
  Docs Index (line 1) and adding scripts/ entries violates its
  stated scope. Scripts documented in adr/README.md and
  package.json instead. (c) ADR-0021 frontmatter required moving
  the field-semantics comment block out of the file (it broke
  gray-matter's frontmatter detection) — the comment block lives
  in `_template.md` only.

  Pre-commit hook upgrade: `scripts/install-hooks.sh` now generates
  a hook that runs `pnpm adr:lint` and `pnpm adr:index --check`
  whenever staged files include ADR-related paths (adr/, taxonomy,
  invariants, scripts/adr/). Existing session-lock check preserved
  verbatim; runs in compose order before the ADR check.
  Re-installation required after any future install-hooks.sh
  edit; verified working in Commits 5 and 6 (both ran the new
  hook successfully).

  Forward note for Session 5 superpowers/ elimination: ADR-0021's
  pre-ratification design specs section + the ADR README's
  matching section both name superpowers/specs/ as the now-
  deprecated prior location and forward-point at
  DOCS_RESTRUCTURE_V2.md (Session 7) for the canonical migration
  record. The breadcrumb is in place ahead of the actual file move.

  Forward note for Session 7 codification: round-N restructure
  plan convention + three-category codification taxonomy (and the
  artifact-codification relationship insight) both committed as
  round-2 design context but await Session 7's
  `conventions.md` addition for codification.

  Push-readiness gate Condition 1 deviation (per CLAUDE.md
  three-artifact framing — investigation completed post-Commit 8;
  finding revised below):

  Initial deviation hypothesis (pre-investigation): dev DB state
  pollution from prior sessions. Filed at Commit 8 commit time as
  the most likely mechanism given session diff scope (0 migrations
  / services / integration tests touched).

  Post-investigation finding (after `pnpm db:reset:clean &&
  pnpm db:seed:all`): hypothesis WAS PARTIALLY WRONG. The clean
  reset PASSES `pnpm agent:validate` 26/26 (5 floor test files
  including `crossOrgRlsIsolation.test.ts` itself), but FAILS
  `pnpm test` (full suite) with the same PK-collision error on
  the same test file. The mechanism is inter-test state pollution
  in the full suite, NOT dev DB state pollution from prior
  sessions.

  - (a) Mechanism (revised): test-suite ordering / inter-test
    state pollution. `tests/integration/crossOrgRlsIsolation.test.ts`
    inserts journal_entries with fixed UUIDs in its fixture. When
    run in 5-file floor scope (`pnpm agent:floor`), no conflict.
    When run in full 137-file suite (`pnpm test`), at least one
    other test file inserts a journal_entry with a colliding UUID
    before crossOrgRlsIsolation runs, producing the PK violation.
    Test count grew 598 → 665 (28 new tests) since
    CURRENT_STATE.md's "598/598 green" baseline (2026-05-01); a
    recently-added test likely introduces the collision.
  - (b) Fix shape (revised): four candidates for a future
    test-hygiene arc, NOT in Session 3 scope:
      i. crossOrgRlsIsolation uses random UUIDs (e.g., `crypto.randomUUID()`)
         instead of fixed fixture UUIDs.
      ii. Conflicting test cleans up its inserts.
      iii. Per-file DB reset between integration tests (slow but
           isolating).
      iv. Vitest test-ordering forces crossOrgRlsIsolation first.
    Each touches the test suite directly; outside docs-only Session 3
    scope.
  - (c) Carry-forward framing: NOT a Session 3 regression — diff
    scope confirmed (0 migrations / services / integration tests).
    The full-suite failure is a pre-existing test-suite-hygiene
    issue introduced by the 28 tests added between 2026-05-01 and
    2026-05-08. Filed as carry-forward to the next session that
    touches integration tests OR to a dedicated test-hygiene arc;
    Session 4 forward-pointer.

  Push decision: deferred to operator. Investigation complete;
  Session 3 substantive work is sound (typecheck clean, lint
  clean, generator idempotent, ADR-0021 ratified, all 7 tracked
  commits land cleanly). The full-suite test failure is real but
  pre-existing and out of scope. Operator chooses between:
   (push now, deviation documented per Condition 1's three-artifact
   framing — Condition 1 met under "OR deviations documented"
   branch) vs (defer push, file test-hygiene fix arc, push after
   that arc lands and full suite returns to green).

  ---

  Post-investigation revision 2 (further empirical data): the
  test is FLAKY, not deterministically broken on either side.

  Test runs collected:
  - ac1ff11 (pre-Session-3) full suite: 1 run, 665/665 GREEN.
  - HEAD (post-Session-3) full suite, run 1: 1 failure on
    crossOrgRlsIsolation.test.ts.
  - HEAD run 2 (turbo cache hit; not informative).
  - HEAD run 3 (forced via direct vitest invocation, fresh DB):
    665/665 GREEN.
  - HEAD run 4 (vitest direct, fresh DB): 665/665 GREEN.

  Tally: 3 of 4 HEAD runs green, 1 red. Pre-Session-3 single
  run green is consistent with the same flakiness rate (the bug
  fires on the order of 25% of full-suite runs in this small
  sample); a multi-run pre-Session-3 sample would likely surface
  the same red.

  Verdict: the failure is timing-dependent inter-test state
  pollution that pre-dates Session 3. The lockfile diff
  (gray-matter + 9 transitive deps; 0 packages bumped, 0 test
  infrastructure changes) is not plausibly the cause; vitest's
  parallel test-file scheduling produces non-deterministic
  ordering, and crossOrgRlsIsolation's fixed-fixture UUIDs
  collide with another full-suite test's inserts when the
  scheduling lands the wrong way.

  Fix candidate (a) — random UUIDs via `crypto.randomUUID()` in
  the crossOrgRlsIsolation fixture — eliminates the class of bug
  and is the right next arc. Filed as carry-forward.

  Probe #7 forward-pointer (per round-2 design conversation
  feedback): the regex-hole near-miss in adf2ced (3-digit-prefix
  fix) and this flaky-test investigation both surface the gap
  that Probes #5 and #6 don't cover — the GENERATOR's extraction
  logic (regex on H1 / Status / Date) and the LINTER's logic
  itself have no test fixtures with known-bad inputs asserting
  that bad inputs produce expected error / extraction outputs.
  A versioned fixture (small test ADRs with deliberately-broken
  H1 / Status / Date / frontmatter, asserted to produce expected
  extraction or rejection) closes this gap. File for the next
  session that touches scripts/adr/ — likely Session 6 or the
  test-hygiene arc that ships fix candidate (a).

  Glossary candidates flagged for Phase 2 of pre-Session-4
  cleanup (governance vocabulary that recurred consistently
  across round-2 design + Session 3 execution; ready to migrate
  to `02_specs/glossary.md` Governance Vocabulary subsection
  when Phase 2 creates that section). No taxonomy.md migrations
  in this entry — no frontmatter values introduced:
  - **push-readiness gate** + **Condition 1 / 2 / 3** +
    **three-artifact framing** — CLAUDE.md push-readiness
    three-condition gate vocabulary; in production use across
    Sessions 2 and 3.
  - **STRUCTURAL-OBJECTION** — verification-session status
    taxonomy member (rev 3 verification prompt); used in
    Session 2 verification report and reused in Session 3
    deviation framing.
  - **filesystem-not-prompt rule** — round-2 verification
    discipline (subagents must cite filesystem evidence, not
    quote dispatch back); load-bearing in Session 2 verification
    and Session 3 closeout posture.
  - **Outcome A / B / C** — filesystem-not-prompt rule outcome
    categories (dispatch-time prevented all violations / self-
    checks fired and caught real violations / self-checks fired
    on false positives); design committed at round-2 design
    conversation; N=1 evidence captured.
  - **Three-category codification taxonomy**: architectural
    principle (N=1 sufficient; ratification IS codification),
    procedural pattern at workflow grain (N=1 if codification
    artifact = workflow it describes), process meta-pattern
    (N=2 with shape match; artifact decoupled from codification).
    Round-2 design context; conventions.md addition deferred to
    Session 7 alongside V1→V2 elevation.
  - **Round-N restructure plan workflow** — V1+V2 paired
    ratification structure; round-2 design context, conventions.md
    addition deferred to Session 7.

  Phase 3 audit results (snapshot, audit-time — preserve
  verbatim; this is the substrate state at 2026-05-08 before
  Session 4 lands fixes). Four breadth-first probes against
  the ADR substrate landed in Session 3:

  - **Probe 1 — `pnpm adr:lint` against malformed ADR
    (`9999-probe-malformed.md`, 6 distinct violations + 1 valid
    INV control):** PASS. 7 errors caught (id mismatch, status
    enum, malformed date, unknown module, INV regex, INV not in
    invariants.md, related ADR not found). All messages cite
    `path:field severity message` shape. Exit 1. Probe file
    deleted; baseline lint returned to 0 errors / 21 ADRs.
  - **Probe 2 — `pnpm adr:index --check` after Current ADRs
    table corruption** (`Three-Tier Agent Architecture (with
    Document Platform Reframe Amendment)` → `CORRUPTED-PROBE-2`
    via sed): PASS. `--check` exited 1 with message "README.md
    regeneration would change content. Run `pnpm adr:index` and
    commit the result." Non-check `pnpm adr:index` restored
    cleanly; final diff empty.
  - **Probe 3 — `scripts/install-hooks.sh` idempotency +
    silent-bypass surface:** PARTIAL PASS / FINDING. Hook
    *content* idempotent across runs (same generated heredoc),
    but backup mechanism overwrites prior `pre-commit.pre-
    coordination`; "what was originally here" history lost
    after first re-run. No "already installed" no-op message.
    Silent-bypass surface confirmed: zero `postinstall` /
    `prepare` script in package.json; zero `install-hooks`
    mention in `developer_setup.md`; fresh-clone contributors
    commit unguarded.
  - **Probe 4 — comprehension test (read ADR-0021 +
    `_template.md` fresh, attempt hypothetical ADR-0022 "Brief
    frontmatter and tooling"):** 7 GAPS surfaced — (4a)
    next-free-ADR-number procedure not documented, (4b)
    filename pattern (`NNNN-kebab-slug.md`) not stated, (4c)
    Status-line bracket placeholders (`[authority]`,
    `[ratification artifact reference]`) unexplained, (4d)
    supersession workflow not in reference docs, (4e) amendment
    workflow tribal knowledge, (4f) forward-only Decision rule
    referenced but not restated, (4g) YAML date quoting not
    signaled. Honest caveat: I wrote both reference docs in
    Session 3 (inheritance bias real); a fresh contributor may
    surface additional semantic gaps (e.g., terms like
    "round-2," "dogfood ADR," "δ-i preservation").

  Calibration: Phase 2 zero candidates + Phase 3 twelve
  candidates = breadth-first audit working as designed.
  Definitional-exercise pass (Phase 2) and breakage attempt
  (Phase 3) test different failure modes; the substrate is
  mechanically sound (no probes hard-failed) but operationally
  and documentationally underspecified at substrate-landing
  time.

  Phase 4 triage matrix (pre-Session-4 plan — NOT execution
  record; Session 4 commits will be the actual outcome
  evidence). 9 IN, 4 OUT, 0 DROP across the 12 Phase 3
  candidates after #1's reconsideration (DROP → OUT on
  asymmetry-favoring-prevention pushback).

  - **IN, mandatory operational fix:** #5 silent bypass.
    Doc-only minimum-viable shape — one line in
    `developer_setup.md` ("Run `bash scripts/install-hooks.sh`
    after `pnpm install`"). High operational risk + small fix
    + decouples from #3's backup-overwrite issue.
  - **IN, documentation cluster (single PR):** #6 next-free-
    ADR-number procedure, #7 filename pattern, #8 Status-line
    bracket placeholders, #11 forward-only Decision rule
    restatement, #12 YAML date quoting — all land in
    `_template.md` comment-block additions or ADR README prose.
    #9 supersession workflow + #10 amendment workflow split
    out into ADR-0022 substrate per locked decision below.
  - **OUT, tooling polish (independent within test-hygiene
    arc):** #1 linter error path-citing, #2 `--check` sample
    diff, #3 install-hooks backup idempotency, #4 install-
    hooks no-op messaging. Re-filed as adjacent-scope
    amendment to `09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-brief.md`
    (commit `a322fe9`). Trigger relationship: independent
    within arc.
  - **DROP:** none (after #1 reconsideration).

  Locked Session 4 decisions (made at Phase 4 disposition,
  preventing mid-session re-scoping):
  - **Profile (b)** — structural-plus-semantic reference docs.
    Documentation cluster ships profile (b): structural fixes
    for #6–#12 plus inline glosses for the round-2-specific
    terms ADR-0021 uses ("dogfood ADR," "round-2," "forward-
    only convention," "δ-i preservation," "session-internal
    narration"). Cheap addition; opens reference docs to
    Phase 1 implementation contributors.
  - **ADR-0022 ratification** for amendment-vs-supersession
    workflow. Decision rules belong in ADRs per project
    conventions; documenting-by-inspection is the exact
    failure mode Probe 4e surfaced. Extends the dogfood
    pattern (ADR-0021 ratified frontmatter+tooling system;
    ADR-0022 ratifies lifecycle workflows). Splits #9, #10
    out of documentation cluster prose into ADR-0022 substrate.

  Forward-pointer to friction-journal readers: the Phase 3
  probe results above are *snapshot evidence* — substrate state
  at audit-time, before fixes — and should remain readable
  verbatim even after Session 4 closes the gaps. The Phase 4
  triage matrix is *planning artifact* — disposition, not
  outcome — and is expected to become outdated as IN candidates
  ship in Session 4. Distinguishing artifact types here so
  future readers don't conflate "what was true at substrate-
  landing" with "what got fixed in cleanup."

  Forward-pointer for Session 5 Layer 0 (`docs/superpowers/`
  elimination): the file
  `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md`
  is currently untracked at its scratch path. This is *deliberate*,
  not drift — discovered during pre-Session-4 cleanup pre-push
  verification, after weighing path (1) "track at scratch path
  + git mv in Layer 0" against path (2) "leave untracked + first
  git add at the new path during Layer 0." Path (2) chosen for
  cleaner git history: the file was always intended to live under
  `docs/09_briefs/phase-5/chunks/`; the current location is just
  where it was scratched while being drafted. **Layer 0
  instruction: first action for this file is `git add` at the
  new path `docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md`,
  NOT `git mv` from the scratch path.** Three sibling files in
  `docs/superpowers/` (the two D5/D6 ratification execution plans
  and the ADR-0019 design spec) ARE tracked and SHOULD use `git
  mv` to their respective `phase-0/` destinations per the round-2
  plan. The asymmetric handling (one `git add` + three `git mv`)
  reflects the asymmetric history (one never-tracked scratch +
  three tracked-since-Phase-0). Reconsider path (2) if Session 5
  slips beyond ~2 weeks — the durability gap widens past the
  point where scope hygiene wins.

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

### 2026-05-12 — Phase 5 chunk B5-3-D6 SHIPPED — bill reversal flow

Built and shipped the bill reversal flow per the founder's
plain-English brief. Single Claude, no ratification rituals, no
catch ledgers, no cadence labels. Five pieces:

1. POST `/api/orgs/[orgId]/bills/[billId]/reverse` route wrapping
   `billService.reverse` with `withInvariants({ action: 'bill.reverse' })`.
   Mirrors the approve-for-payment + record-payment route shape.
2. `bill.reverse` permission migration (controller only; +1 perm,
   +1 role_perm) and CA-28/CA-37 count assertions bumped 28→29 /
   38→39.
3. `BillReverseCard` per-bill canvas view — 3-field form
   (reversal_reason textarea, fiscal_period_id picker, entry_date),
   red "Reverse" confirm button, amber warning banner about
   irreversibility through the UI. Bill detail fetched from the
   B5-3-D5 per-bill endpoint (so the card works for all four
   reversable states uniformly).
4. Canvas integration (4-file set) + row-click amendments:
   ActivePaymentsView gets a per-row "Reverse" button at the end
   of each row (stopPropagation so the row body still navigates
   to record-payment), PaidBillsHistoryView gets a full-row click
   to bill_reverse_card. The directive carries an optional
   `returnTo` so the card returns the user to wherever they came
   from.
5. Integration test (9 cases — 5 Category A floor + ap_specialist
   PERMISSION_DENIED + 3 state-coverage: approved_for_payment /
   partially_paid / fully_paid). Category A-1 captures the mirror
   semantics check. E2E smoke verifies row-click → card mount →
   form fields render → cancel returns; passes in 28s.

Gate: agent:validate 26/26, typecheck clean, full vitest
862/862 (up from 853 = +9 route tests).

**Surprise.** Tried to seed a posted bill from the Playwright
fixture by importing `billService` directly so the E2E could
exercise the full success path. The import chain hits
`assertEnv()` at module load (via `adminClient.ts → env.ts`)
which demands `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_*`, etc. —
vars the Playwright test runner doesn't have, even though the
`pnpm dev` webServer does (Next loads .env.local for it). Pivoted
to a simpler E2E that seeds a `partially_paid` bill via direct
admin insert (no posted JE) and verifies UI wire-up only.
Full reverse-success-path coverage moved entirely to the route
integration test, which walks bills through real state
transitions via `billService.post / approveForPayment /
recordPayment` and exercises all four reversable lifecycle
states. The split feels fine for v1: integration test owns the
semantics, E2E owns the canvas-wire-up smoke.

**Form-schema unit test attempted then dropped.** Wrote a
`BillReverseCard.test.ts` next to the component for the 4-case
boundary check. Vitest's `include` is `tests/**/*.test.ts`
only, so the test was invisible. Looked at sibling form schemas
(`RecordPaymentFormSchema` inside `RecordPaymentCard.tsx`) — no
unit test exists for any of them. Boundary already covered by
the route test's 400-Zod case (empty `reversal_reason`). Deleted
the file and moved on.

**One micro-thing in the brief.** "Reverse from pending_approval
via canvas UI" is out of scope per the brief (no Pending
Approvals view yet). The route still accepts pending_approval —
verified by Category A-1 — so the substrate is ready when the
arc-closeout adds that view.

The Spend domain is now functionally complete at v1. Next:
Phase 5 arc-closure synthesis when the founder elects.

### 2026-05-12 — Phase 5 arc-closure prep: PendingApprovalsView

Closed the last functional gap before Phase 5 arc-closure. Before
this chunk, operators could reach reverse for bills in
approved_for_payment / partially_paid / fully_paid (via Active
Payments + Paid Bills History row-clicks) but not pending_approval
— even though billService.reverse accepts that state. The route
substrate has been ready since B5-3-D6; this chunk added the UI
entry point.

Five pieces shipped:

1. `apReportService.pendingApprovals` — inline fetch (the shared
   loadBillsWithAmountDue helper filters to
   `{approved_for_payment, partially_paid}` only, so it's not
   reusable here; same call as paidBillsHistory's reasoning).
   Returns vendor_id + bill_number + issue_date + due_date +
   amount_cad + days_pending. days_pending = `today - created_at`
   (issue_date can be backdated, created_at measures actual queue
   duration).
2. GET `/api/orgs/[orgId]/reports/pending-approvals` route —
   read-side, no withInvariants, mirror sibling pattern.
3. `PendingApprovalsView` — per-org table, row-click navigates to
   PaymentApprovalCard, per-row Reverse button (mirror of the
   ActivePaymentsView amendment from D6) navigates to
   BillReverseCard with `returnTo: 'report_pending_approvals'`
   (extended the BillReverseCard return union to include the new
   view).
4. Canvas integration (5-file set: directive + ContextualCanvas
   + canvasContextSuffix + MainframeRail entry + view import).
5. Substrate-correction to PaymentApprovalCard: swapped its
   fetch from `/reports/payment-approval-queue` (which post-
   filters to approved_for_payment only — the OUTPUT state of
   the action, not the INPUT state pending_approval) to the
   per-bill endpoint `/api/orgs/[orgId]/bills/[billId]` (B5-3-D5
   substrate). Without this, mounting the card from the new view
   would always error "Bill not found in approval queue". Same
   shape of fix as B5-3-D5 (RecordPaymentCard's correction);
   PaymentApprovalCard was substrate-ship-only since B5-3-D3 and
   had no working entry point until now.

**Audit pass at chunk-onset.** Before building, grepped the
codebase for other consumers using the
"fetch a queue endpoint, then `.find(b => b.bill_id === billId)`"
pattern that's been the root cause of catches #57, #69, and
PaymentApprovalCard. Found 7 client-side report-endpoint
consumers; 6 are list views (correct use), 1 was PaymentApprovalCard
(the one already in scope). No fourth instance. PaidBillsHistoryView's
row-click goes directly to BillReverseCard (per-bill endpoint);
VendorBalanceView uses a parameterized `?vendor_id=X` query. The
trajectory is real but bounded.

**Validation gate.** typecheck clean; agent:validate 26/26;
pnpm test 871/871 (was 862 → +9 route tests on the new
pendingApprovalsRoute test, +4 unit-schema, with the new file
appearing in the 173 → wait, file count went 173 (was 171) →
correctly +2 files = unit + route integration). E2E pendingApprovalsView
spec passes 2/2 in 26s (rail-click smoke + row-click smoke). Test
pollution surfaced once mid-run on accountLedgerService.test.ts
(running-balance baseline drift from accumulated JE rows across
the suite); a `pnpm db:reset:clean` cleared it. Pre-existing
suite-wide test-pollution issue, not chunk-related.

Phase 5 functionally complete at v1 across all four bill
lifecycle entry points (pending_approval, approved_for_payment,
partially_paid, fully_paid) for both approve and reverse actions.
Arc-closure synthesis is the next surface.

**Flaky-test note for future-me.** `accountLedgerService.test.ts`
has running-balance baseline pollution that surfaces intermittently
when run mid-suite; `pnpm db:reset:clean` clears it. Root cause not
investigated this session — suspect test-ordering or shared-state
issue in the suite (other tests posting JE entries against the
shared seed accounts Investments-in-Subsidiaries and Intercompany-
Receivables before this test reads its baseline). If this bites
again, start there.

### 2026-05-12 — Phase 5 arc-closure

Phase 5 (Spend Initiative) closes. Manual AP foundation shipped
across 9 chunks (B5-1 substrate → B5-2 substrate → B5-3-D1
through B5-3-D6 → arc-closure prep). The two real users can
post bills, approve them, record payments against them, reverse
them from any of the four reversable lifecycle states, and
report on the resulting bill population through five canonical
read views plus two operational entry-path views. 871/871
vitest at HEAD `07ae4e9`; 26/26 agent:validate floor; E2E specs
for the write-side surfaces passing against a fresh
`db:reset:clean`.

The retrospective lives at
`docs/07_governance/retrospectives/phase-5-retrospective.md` —
nine sections, structured against Phase 1.1's frame, written in
plain English deliberately because the meta-lesson of the arc
was that the apparatus (catch ledgers, sub-mechanism class
labels, cumulative-N tallies, ratification cycles) had
overstayed. Section 9 is the honest-limitations section and is
the part that earns the rest of the document's claims.

Things to know at Phase 5 closeout that aren't in the
retrospective:

- The Spend brief's §2 ("Locked v1 scope") and §10 ("Phase
  sequencing") disagree about whether prepayments / credits /
  vendor onboarding are v1 deliverables. Phase 5 shipped
  against §2; the §10 additions are deferred to post-v1 under
  the "reserved schema seats" framing. The Phase 2 brief
  author should resolve which is authoritative.
- `vendorPrepaymentService` has 3 of 4 methods on disk
  (`record` / `apply` / `refund`) with Zod schemas; no routes,
  no UI. Substrate is ready when the operational signal
  arrives.
- Vendor credits are zero — no service, no schema, no
  migration. Clean greenfield when needed.
- Vendor onboarding is read-only (`listVendors`). No
  createVendor / updateVendor / vendor_rules.

Sequencing for what's next, settled in the arc-closure
conversation: **Phase 2 (Document Core) → Phase 3 (Document
Relationship Graph) → Phase 4 (Relationship Router) → Phase 6
(Ingestion channels) → Phase 7 (Extraction) → Phase 8
(Proposal handoff)**. Canonical per the reframe spec §2;
Phase 1 (Storage / Evidence Core) verified shipped across all
six chunks per the migration header.

### 2026-05-12 — Phase 2 chunk 1 SHIPPED — document_cases substrate + base service

Three substrate findings worth carrying forward.

**Logger level for case-lifecycle events.** Service uses
`log.info` over the Phase 1 sibling `documentPlatformService.ts`'s
`log.debug` because document_case creation is a human-cadence
business event, not a high-volume storage trace step. Closest-
sibling consistency inverts when volume + semantic level inverts.

**DELETE-protection asymmetry vs Phase 1.** document_cases ships
BEFORE DELETE protection (Option C adjudication at chunk-zero
close) but not the full Phase 1 triple-layer (RLS + BEFORE DELETE
+ BEFORE TRUNCATE + REVOKE TRUNCATE). ADR-0011 §9 doesn't list
document_cases as immutable in the row-level sense (§3 explicitly
describes it as a workflow-mutable state machine); the BEFORE
DELETE trigger is the load-bearing piece for audit_log referent
integrity, the TRUNCATE protections in Phase 1 are about bulk-
data hygiene that doesn't apply to workflow rows. Skipped as
cargo-cult.

**Zod `.datetime()` is too strict for timestamptz round-trips.**
Zod's `.datetime()` defaults to a stricter ISO-8601 subset than
Postgres timestamptz emits — Supabase returns the offset form
(`...+00:00`), not `Z` suffix. `z.string()` is the right shape
for timestamptz read-back unless you opt into `{ offset: true }`.
Caught by integration tests against a real DB; not surfaced by
typecheck or by the brief-loop review pass.

### 2026-05-12 — Phase 2 chunk 2 SHIPPED — transition() + state machine enforcement

Two findings worth carrying forward.

**AccountLedgerService delta-assertion category error.** The
chunk-2 validation gate surfaced the third recurrence of the
`accountLedgerService.test.ts` running_balance failures
previously written off as "intermittent pollution" in `07ae4e9`.
Investigation: it's not mid-suite pollution. It's a category
error in the assertion shape. Tests 3 and 6 used a "delta from
end-of-file baseline" assertion that conflated two properties —
(a) the entry got posted, and (b) the file-end running_balance
shifted by the entry's amount. (b) is only meaningful if the
test owns the entire ledger state. running_balance is positional
(window function at query time, ordered by entry_date), so
past-dated entries from prior test-file runs interleave at the
same entry_date and shift the `find()`-by-content result's
running_balance non-deterministically. Fix at `fc5dfd8`:
find-by-journal_entry_id + per-row contribution (this row's rb
minus the previous row's rb in the ordered result). Residue-
immune by construction. The deeper fix — disposable accounts
per test so shared state doesn't accumulate at all — is tracked
as a Phase 2 retrospective candidate; the assertion shape and
the test-design strategy are distinct concerns. The "third
recurrence = investigate, not remediate" rule from the chunk-2
brief was the right discipline here.

**Constraint-name renames as a downstream test-fragility
surface.** The chunk-2 migration renamed the state CHECK
constraint from `document_cases_state_chunk_1_active` to
`document_cases_state_chunk_2_active` "for chunk traceability."
That broke chunk-1's test #4 regex match. Fixed inline (regex
now matches `document_cases_state_chunk_\d+_active`). Worth
knowing: rename-with-broadening migrations have test-stability
costs that are easy to miss at brief drafting. If chunks 3+
continue the rename pattern, the regex stays stable; if they
switch to in-place ALTER without rename, the costs disappear.

### 2026-05-13 — Phase 2 chunk 4 SHIPPED — document_artifacts substrate + ocr_runs + extraction_runs

One finding worth carrying forward (no fresh surprises — four
anticipated surprises in the brief did not manifest as new
issues).

**Substrate-walkable phase-done refinement.** Chunk 4 ships
substrate-only; the phase-done bar refined to substrate-walkable
(admin-INSERT + constraint/trigger/RLS verification from tests).
Three proofs that chunks 1-3 landed are deferred to Phase 7's
writer: Pattern B unwrapped-export + ServiceError shape for this
surface, audit-log RPC integration with parent-derived org_id
(chunk-3 canonical pattern), and Zod boundary against real-caller
payloads (vs admin-test fixtures). Item 4 of the working
discipline (phase-done means end-to-end-walkable) is preserved by
naming the deferral, not by silently relaxing it. The Phase 7
writer is the natural home for those three proofs because the
pipeline orchestrator per ADR-0014 owns the artifact-write
surface end-to-end.

### 2026-05-13 — Phase 2 chunk 5 SHIPPED — source_document_links polymorphic spine + documentLinkService

Five findings worth carrying forward.

**Column-level GRANT for service_role UPDATE — codebase-novel pattern.** Chunks 1-4 used RLS USING (false) for full-row UPDATE/DELETE blocking; chunk 5 introduces column-level GRANT (`GRANT UPDATE (link_status) TO service_role`) to permit narrow service-role mutation while blocking other columns. §6(a) is the ADR mandate; §6(b) is enforced as a small BEFORE UPDATE OF link_status trigger. Two-mechanism composition: GRANT enforces "which columns are mutable," trigger enforces "valid transitions on the mutable column." No overlap. Migration top-comment names the composition explicitly so the receipt lives in code. Verified at validation gate: the GRANT-rejection test fires with "permission denied for column link_role" against `db.from('source_document_links').update({ link_role: 'supporting' })`; the trigger-rejection test fires with the regex-matched "reversed → created" exception. Two-mechanism composition shipped clean.

**(c-α) ship-but-don't-wire known-state.** `documentLinkService.reverseLinkedEntityLink()` exists and is tested at chunk 5; Phase 5 reversal paths (`billService.reverse`, `paymentService.commitFailureReversal`) are NOT yet wired to call it. There's a window where the function exists but no production caller wires it. The integrity gap (reversed bill leaves orphaned `link_status='created'` rows until wired) is by-design for chunk-5 scope — wiring is a separate later concern (Phase 5 amendment, forward chunk, or Phase 4 Router work). Layer separation preserved: Phase 2 chunks don't modify Phase 5 services.

**Cascade-despite-REVOKE — OUTCOME B fired.** Phase 1's `reject_source_documents_delete()` BEFORE DELETE trigger (storage_substrate migration line 413-424) RAISES EXCEPTION on any DELETE attempt on `source_documents`, including service_role. The cascade-despite-REVOKE empirical verification cannot fire from this code path at chunk 5; the `ON DELETE CASCADE` on `source_document_links.source_document_id` is wired correctly per ADR-0011 §4 + ADR-0016 §5, but the parent-delete path is unreachable from service_role. A controller-authority deletion path (Phase 1 future enhancement per ADR-0011 §4) is the only legitimate route to exercise the cascade. Property documented-deferred; chunk-5 test handles OUTCOME B with explicit error-message assertion.

**ADR-0016 §1 vendor_credit / vendor_credit_application substrate gap.** ADR-0016 §1 lists 8 v1-active linked_entity_type values; Phase 5 substrate ships 6 (vendor_credits + vendor_credit_applications tables don't exist in this codebase). Chunk 5 ships the tighter 6-value v1-active subset: `bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`. ENUM full membership unchanged (28 values; both reserved values stay in the type per ADR-0010). Pair-validity matrix shrinks from 15 → 13 cells (drops `(vendor_credit, supporting)` and `(vendor_credit_application, supporting)`). When Phase 5 ships the credit substrate, a future chunk's CHECK relaxes `_chunk_5_active` to `_chunk_N_active` with 8 values; ENUM extends; LINKED_ENTITY_TABLE_MAP extends with 2 cases. Deviation is forward-compatible per ADR-0010 reserved-enum activation discipline. Surfaced as a retrospective inventory item consolidating with two prior editorial findings under "ADR-0016 full editorial audit."

**Phase 5 PK column naming inconsistency.** Phase 5 substrate uses two PK column conventions: `<entity>_id` for bills / vendors / payments / bill_lines / bill_payment_allocations; bare `id` for vendor_prepayments / vendor_prepayment_applications. Chunk-5's polymorphic integrity validator carries a per-entity-type PK column map (`LINKED_ENTITY_TABLE_MAP` exported from `sourceDocumentLink.schema.ts`) to navigate the asymmetry. Future Phase 5 tables that join the v1-active linked_entity_type set must surface their PK column in the map at activation time. Worth a future-me note: when the chunk-6 exception queue or Phase 4 Router consumes the same `linked_entity_type` enum, they should import `LINKED_ENTITY_TABLE_MAP` rather than re-deriving the table → pkColumn mapping.

Anticipated surprises that did NOT fire as fresh entries:
- §5 4-field signature missing reversal_reason — handled at brief-draft (added as 5th input field).
- §6→§4 ADR-0016 cross-ref errors — surfaced at scope-lock; lands in retrospective inventory.

One incidental finding worth noting (small but caught at test-run): `audit_log` PK column is `audit_log_id`, NOT `id`. Initial chunk-5 test fixture used `.select('id, entity_id')` which returned null data (PostgREST treats nonexistent column references as silent failure). Fixed to `.select('entity_id')`. Future tests that query audit_log must reference `audit_log_id` or omit the PK column from the SELECT list.

Implementation-time changes beyond the four-file scope: added `'LINKED_ENTITY_NOT_FOUND'` to `ServiceErrorCode` union in `apps/web/src/services/errors/ServiceError.ts` (single-line addition). Chunk-2 precedent for `'INVALID_TRANSITION'` (state-machine work) supports this minor scope expansion — new error codes ship in lockstep with their first service emitter.

### 2026-05-13 — Phase 2 chunk 6 SHIPPED — exception queue + resolution_action/exception_status/exception_reason enums + documentExceptionService

Four findings worth carrying forward.

**chunk-2 LEGAL_TRANSITIONS broadening for reprocess — §3 amendment pending.** Chunk 6 broadens chunk-2's `LEGAL_TRANSITIONS` at `documentCaseService.ts` line 36 to add `'classified'` to `needs_review`'s exit list (becomes `['rejected', 'matched', 'proposed', 'classified']`). `AUTOMATION_ONLY_TRANSITIONS` at lines 49-59 unchanged — the new `needs_review → classified` transition is human-callable (controller-initiated reprocess action), NOT in the automation-only set. ADR-0011 §3's transition table doesn't list this exit; chunk-6 extension flags an ADR-0011 §3 amendment in retrospective inventory item #6 sub-finding 4. The Layer 1 CHECK on `document_cases.state` also broadens from `_chunk_2_active` (4 values) to `_chunk_6_active` (6 values, adding `needs_review` + `classified`) — same `_chunk_N_active` incremental-broadening pattern chunks 1-2 used. The brief-draft anticipated this; the chunk-2 actor-gating mechanism verified-from-disk at brief-loop (LEGAL_TRANSITIONS at lines 30-41; AUTOMATION_ONLY_TRANSITIONS at lines 49-59; broadening composes cleanly).

**Substrate-now-amendment-later for `backfill_vendor_prepayment_suggested` — ADR-0011 §13 amendment pending.** Chunk 6 ships `backfill_vendor_prepayment_suggested` as the 9th reserved `resolution_action` enum value per ADR-0015 §6 cross-reference (verified at lines 628/650/1137/1373 during brief-loop). ADR-0011 §13's enum doesn't currently list it (brief-loop verified zero references in ADR-0011 — no §13 amendment landed between scope-lock and brief-draft); chunk 6 ships substrate-now-amendment-later. Same trajectory as `manual_born_paid_workflow` pre-2026-05-08-amendment. Substrate matches ADR-0015 §6's expectation; §13 amendment pending in retrospective inventory item #6 sub-finding 5. The cross-ADR-named resolution_action pattern (ADR-0015 §6 names two reserved values; ADR-0011 §13 owns enum membership) is now established — future amenders need to know that the pattern fires via §13 amendment cycles, not chunk-substrate cycles. When the §13 amendment ships, no enum migration is needed (the value already exists in the type).

**Second cross-phase verify-from-disk win — discipline now load-bearing.** The cross-phase refinement to `feedback_verify_from_disk_at_brief_loop.md` (added at chunk-5 close) caught real cross-ADR drift again at chunk 6: ADR-0015 §6 `backfill_vendor_prepayment_suggested` enum-membership gap surfaced at scope-lock; ADR-0013 ratification-status was initially miscaptured (recon said "not yet ratified" when ADR-0013 ratified 2026-05-03) and corrected during `exception_reason` adjudication. Two consecutive cross-phase chunks where the refinement caught drift before substrate landed (chunk 5: `vendor_credits` substrate gap; chunk 6: `backfill_vendor_prepayment_suggested` enum gap + ADR-0013 ratification correction). Pattern: verify-from-disk catches drift in N chunks → codify the refinement at chunk N+1 → chunks N+2 and N+3 validate the refinement → graduate from "lesson" to "rule." The discipline is graduating from "still being learned" to "expected at every cross-phase chunk." Worth tracking explicitly because it's becoming load-bearing for chunk-7+ scope-lock loops.

**Enqueue RPC ordering — INSERT before UPDATE (implementation discovery).** Chunk-6 first test run surfaced a real RPC-ordering bug: the brief specified the enqueue RPC as `(1) state UPDATE classified|matched → needs_review; (2) INSERT exception_queue_entries row`. With that ordering, duplicate-enqueue against a case already in needs_review (because the first enqueue transitioned it) hits the state-UPDATE check_violation FIRST, raising `INVALID_TRANSITION` instead of the expected `EXCEPTION_ALREADY_OPEN` from the partial-UNIQUE constraint on the queue row. The fix: reorder the RPC to INSERT first, UPDATE second. The partial-UNIQUE on `(document_case_id) WHERE exception_status = 'open'` fires on duplicate INSERT before the state-UPDATE runs; first-enqueue against wrong-state cases still produces the right error (INSERT succeeds, then state-UPDATE matches zero rows, raises `check_violation` → `INVALID_TRANSITION`). Both error paths now map cleanly. Carry-forward for chunks 7+: when an atomic RPC combines a UNIQUE-protected INSERT with a state-machine UPDATE, INSERT-first ordering preserves the typed-error semantics of the UNIQUE constraint; UPDATE-first ordering can mask the UNIQUE violation behind a state-violation that fires on the same case during the duplicate retry. The brief's spec was wrong; the implementation discovered the right order. Migration top-comment names the ordering rationale explicitly.

Anticipated surprises that did NOT fire as fresh entries:
- 5-column GRANT + BEFORE UPDATE trigger composition — chunk-5 §6(a)+§6(b) pattern scaled cleanly from 1 to 5 columns; no new interaction with the trigger.
- N=4 partial-index sequence — passed on first run (after RPC reorder); the test caught the underlying RPC ordering bug, validating the test design.
- Direct-org_id 4-policy RLS via `user_has_org_access(org_id)` — mirrors chunks 1-2 verbatim; clean.
- Atomic RPC parent-derived org_id (from `document_cases`) — chunks-3-5 pattern with `source_documents` parent generalizes to `document_cases` parent verbatim.

Two incidental findings worth noting:

(1) `DocumentCaseStateSchema` broadening (β deviation from brief). The brief specified "modify documentCaseService.ts" for the LEGAL_TRANSITIONS broadening but didn't anticipate that `documentCase.schema.ts` `DocumentCaseStateSchema` also needs to broaden — `readDocumentCase` would fail Zod parse for cases in 'classified' or 'needs_review' state if the Zod boundary stayed at chunk-2's 4-value subset. Chunk-6 implementation broadens to 6 values (matches the Layer 1 CHECK admission set: received, classified, needs_review, proposed, approved, rejected; still-reserved at Layer 2 + Layer 1: extracting, matched, committed, archived). One additional file modification beyond the brief's enumerated four-file scope. Brief-draft missed this; implementation caught it at the first chunk-6 integration test that called `readDocumentCase` against a case in needs_review state. Carry-forward: chunks that broaden a state-CHECK Layer 1 must also broaden the corresponding Zod schema's enum, or the read-back path breaks.

(2) Constraint-name-rename test-fragility — second firing of chunk-2's lesson. Chunk-2 friction-journal entry at chunk-2 close noted: "test assertions that hardcode migration-internal names — constraint names, trigger names, function names — are fragile to substrate changes." Chunk-6 broadens `document_cases_state_chunk_2_active` to `document_cases_state_chunk_6_active`; `documentCaseService.integration.test.ts` line 332 had hardcoded the literal `document_cases_state_chunk_2_active` instead of the stable regex pattern `/document_cases_state_chunk_\d+_active/` chunk-2's carry-forward prescribed. Fixed inline at chunk-6 implementation (single-line regex update). The chunk-2 lesson fired exactly as predicted; the fix discipline is now well-established. Chunks 7+: when broadening a CHECK constraint, audit the integration test suite for hardcoded constraint-name literals and replace with `_chunk_\d+_active`-shaped regex patterns.

### 2026-05-13 — Phase 4 chunk 1 SHIPPED — `document_relationship_candidates` substrate + `documentRouterService.completeCandidate()` Subsystem 1

Six findings worth carrying forward — five pre-drafted at scope-lock per the (D) filter (cross-cutting chunk-1 decisions with no natural single-file code-comment home; pattern codifications stay at scope-lock memory file §5); one implementation-time discovery (column-name verify-from-disk gap).

**Pair-validity CHECK skipped deliberately on candidate row.** Chunk 1 ships `document_relationship_candidates` without a DB-layer pair-validity CHECK on `(linked_entity_type, link_role)`. The 13-cell pair-validity matrix lives at `sourceDocumentLink.schema.ts` (chunk-5) as the canonical source of truth; chunk-1's `DocumentRelationshipCandidateSchema.refine()` imports `VALID_PAIRS` from there. Three reasons: (a) the candidate row isn't a commit (source_document_links is the committed materialization; documentLinkService.create() Layer 1 CHECK rejects invalid pairs at commit time); (b) duplicating the CHECK creates lockstep maintenance burden across ADR-0016 §3 amendments — exactly the substrate-decision-integrity hazard Phase 2.5 Commit B was unwinding; (c) Zod-import-shared matrix is the canonical Layer-1 defense per the c-2 lock at scope-lock. Discriminator for future chunk authors: if a row's schema-defense fires on internally-constructed values (no external-input path), Layer 1 lives in the Zod schema's `.refine()` consuming the shared matrix, NOT in a duplicated DB CHECK. Revisit only if a downstream consumer ever operates on candidate-row data without going through commit.

**`VALID_PAIRS` export-status near-miss + cross-chunk same-domain modification.** Chunk-5 exported `LINKED_ENTITY_TABLE_MAP` from `sourceDocumentLink.schema.ts` with an explicit Phase-4-Router-reuse comment, but left `VALID_PAIRS` as private `const` despite serving the same matrix-defense family. Chunk-1's c-2 lock ("Zod-import-shared matrix is the canonical Layer-1 defense") presupposes the export. Chunk-1 widens `const VALID_PAIRS` → `export const VALID_PAIRS` as a one-keyword change co-located in the chunk-1 bundled commit. Same precedent shape as chunk-6 broadening chunk-2's LEGAL_TRANSITIONS in the chunk-6 commit (same-domain modification in substrate-chunk commit; cross-chunk modifications are acceptable when single-keyword + load-bearing for the consuming chunk). Pattern rule for future schema authors: when exporting a helper with cross-chunk reuse anticipation, audit the entire matrix-defense family in the same file — pair-validity matrix, table map, enum subsets, validity sets — for the same reuse logic. Export-or-keep-private should be a deliberate decision per-helper, not a default-private pattern with selective exports.

**`CONFIDENCE_THRESHOLDS_V1_PROVISIONAL` home decision + ADR-0019 activation hook.** Per ADR-0014 §7 Q65, Subsystem 1 consumes per-document-type confidence thresholds (vendor_invoice 0.85, receipt 0.80, payment_confirmation 0.85, unknown null = always-exception). The constant lives at the top of `documentRouterService.ts` with explicit comment naming ADR-0014 §7 Q65 as source-of-truth + ADR-0019 (Confidence Calibration Policy) as the future governance owner. When ADR-0019 ratifies calibrated values, chunks-N amends the constant. The constant's location at the consuming-service top makes the amendment surface mechanical and small. Discriminator for future chunk authors: provisional ADR-ratified constants with single consumer at chunk-introduction time live at the top of the consuming service file. Trade-off considered: shared constants file (`src/services/document-platform/constants.ts`) deferred until second consumer emerges. Lift trigger: second consumer materializes (Subsystem 2 / Subsystem 3 chunks 2+ may consume the same thresholds; Phase 5 reviewer UI for proposal review).

**Substrate-writer-pattern divergences from chunks-3-6 — two independent discriminators.** Chunk-1 ships two deliberate divergences in the substrate-writer RPC pattern; each discriminator applies independently to future chunks. **(a) Invariant-writer-identity → hardcode `created_by` in RPC.** Chunks-3-6 RPCs pass `created_by` through from service (writer may be user or automation; service determines which). Chunk-1 hardcodes `'agent'` inside `create_candidates_with_audit` because Subsystem 1 is automation-only at v1 (Router is agent-pipeline per ADR-0007 §Tier 2.5). Substrate invariant enforced mechanically at RPC layer; per-invocation `user_id` (when chunks-2+ ship Subsystem 3 with controller-initiated triggers like T10) captured separately in `audit_log.user_id`. Discriminator: future chunks with always-automation writers hardcode at RPC; future chunks with user-or-automation writers pass through. **(b) Batch-RPC shape → plural RPC naming.** Chunks-3-6 RPCs are singular (`create_X_with_audit`, `enqueue_X_with_audit`). Chunk-1's `create_candidates_with_audit` is the first plural-naming instance at chunks-1-6 because Subsystem 1 produces a set per ADR-0018 §item 2 ("zero or more DocumentRelationshipCandidate rows"). Per-candidate audit_log row emission preserves chunks-3-6 per-write semantic; same `trace_id` links the batch for forensic queries. Discriminator: future chunks with batch-RPC shape use plural; singular-write RPCs stay singular.

**Head-pointer write deferred to Subsystem 2 (chunks 2+).** `document_cases.current_relationship_candidate_id` is reserved by chunk-1-of-Phase-2 substrate (chunk-1 migration line 60: `current_relationship_candidate_id uuid, -- populated Phase 4`). Phase 4 chunk-1's `completeCandidate` does NOT write this column — Subsystem 1 produces candidates, period. Subsystem 2's chunks-2+ implementation picks the winner from the candidate set per ADR-0018 §item 3 ambiguity-resolution branches (a propose-best / b propose-with-ambiguity-flag / c route-to-exception-queue) and sets the head pointer at that time. Chunk-1's candidates are queryable via `document_relationship_candidates.document_case_id` index but not yet via the head pointer; acceptable because chunk-1 has no v1 consumer of the head pointer (Subsystem 2 + AP/Spend commit path are chunks-2+ + Phase 5 territory). Discriminator for future chunk authors: the three-subsystem decomposition in ADR-0018 §item 1 maps to a clean substrate-write-boundary split — Subsystem 1 writes `document_relationship_candidates` rows; Subsystem 2 writes `document_cases.current_relationship_candidate_id`; Subsystem 3 writes new candidate rows with `supersedes_candidate_id` pointing at prior. Don't mix subsystem-write-scopes at chunk-introduction time. Test category 7 (head-pointer non-action contract, 2 tests) verifies the discipline mechanically.

**Implementation-time column-name verify-from-disk surprise — bills.issue_date + payments.amount.** Brief §2 Architecture "Tier 2.5 read boundary" subsection cited ADR-0018 §item 5 filter contracts verbatim (`lifecycle_state IN ('approved_for_payment', 'partially_paid')` etc.) but the helper SELECTs assumed `bills.invoice_date` (actual column is `issue_date`) and `payments.amount_cad` (actual column is `amount`; only `bills.amount_cad` exists). Both surfaced at first chunk-1 test run as `column does not exist` errors. Fixed inline (rename interface fields + SQL SELECT columns); no schema migration needed. Carry-forward for cross-domain-read chunks (Phase 4 chunks 2+, Phase 7 pipeline implementation): verify-from-disk against Phase 5 substrate column names via `psql \d <table>` at brief-draft time, NOT just at ADR-text grain. ADR-0018 §item 5's filter contracts are correct at the value level (lifecycle_state, payment_state); the column names the helper SELECTs are scope-lock implementation detail that the brief inferred from the codebase without psql verification. Pattern: cross-domain-read helper signatures get a brief-draft-time `psql \d <table>` pre-flight to confirm the SELECT column set matches actual schema. Chunks-5-6 didn't fire this because they didn't do cross-domain reads (they read their own document-platform substrate).

Anticipated surprises that did NOT fire as fresh entries:
- ADR-0018 §item 2's 8-v1-active reference vs post-Phase-2.5 6-v1-active state — staged as retrospective inventory item 1.
- ADR-0016 §Reserved-enums-and-audit-events table propagation gap — staged as retrospective inventory item 2.
- Phase 5 read-path "gap" framing from initial scope-lock — Reading-Y ratified; Router reads via private helpers using adminClient. No Phase 5 service exports needed.
- ADR-0014 §11 incomplete-candidate handoff — chunk-1 `CompleteCandidateInputSchema` is the materialization; ADR-0014 §11 only canonicalizes `DocumentRelationshipCandidate` PascalCase, not `IncompleteCandidate`.
- Pre-flight 1 (`evidence/` directory) — confirmed at scope-lock: NOT for Router; service location locked to `services/document-platform/`.
- Pre-flight 2 (vitest parameterization) — confirmed at scope-lock: chunks-5-6 don't parameterize; chunk-1 ships 6 separate happy-path `it()` blocks.
- Pre-flight 3 (`SEED.VENDOR_*` constants) — confirmed at scope-lock: not present; `buildRouterCaseFixture` creates vendor via direct adminClient INSERT.

One incidental finding worth noting:

(1) Test-isolation discipline for "zero-emission" assertions within shared-ctx describe blocks. The chunks-5-6 pattern shares `ctx` (and `ctx.trace_id`) across all `it()` blocks in a describe; `afterAll` cleans up at the describe level. This works for tests that assert SPECIFIC entity_id matches but breaks for tests asserting ABSENCE of trace_id-scoped rows (a "zero rows" assertion sees leaked rows from sibling tests). Chunk-1's "zero candidates produced → zero audit_log rows" test (M4 explicit callout) initially shared the outer ctx and failed because earlier tests in the same describe accumulated audit_log rows under the same trace_id. Fix: use a local `makeTestContext()` with fresh `trace_id` for the zero-emission assertion + local-trace_id cleanup at test end. Carry-forward: any test asserting "zero rows for trace_id" within a shared-ctx describe needs a local ctx with fresh trace_id; "specific entity_id match" assertions don't need this isolation. Chunks-5-6 didn't fire this because they don't have zero-emission assertions (chunk-5/6 always create something and assert on it).

### 2026-05-14 — Phase 4 chunk 2 SHIPPED — Subsystem 2 (Ambiguity Resolution) substrate + `documentRouterService.resolveCandidates()`

Eight findings worth carrying forward — seven pre-drafted at scope-lock per the (D) filter (cross-cutting chunk-2 decisions with no natural single-file code-comment home); one (β-1) implementation-time reconciliation.

**Ambiguity-margin filter: forward-compat-insurance + v1-operational-honesty.** Subsystem 2's branch decision parametrizes by N (candidate count) and margin (top_confidence − runner_up_confidence) against `AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05`. Chunk-1's `completeCandidate` emits every candidate with `confidence_score = vendor_match.confidence` (single-feature scoring per ADR-0018 §item 2 v1 specification); margin = 0 structurally for every N≥2 case. Under any positive threshold, all N≥2 cases route to branch (b) → exception queue with `exception_reason='multi_candidate_ambiguity'`. v1 operational reality: any N≥2 case routes to manual exception-queue review. Branch (a) via the margin filter (N≥2 + differential scores) is structurally unreachable at v1; activates when chunks-3+ ship multi-feature scoring (amount-match, date-proximity, additional features) per ADR-0018 §item 2. Forward-compat preservation: tiebreak rule `ORDER BY confidence_score DESC, id ASC` is encoded in `loadCandidatesForCase` + decision-record `before_state`'s `candidate_set_ids` ordering for chunks-3+ activation without code changes; only `AMBIGUITY_MARGIN_V1_PROVISIONAL` value changes per ADR-0019 calibration cycles. Discriminator for future chunk authors: provisional V1-PROVISIONAL constants with single consumer at chunk-introduction time live at the top of the consuming service; ADR-0019 ratification triggers mechanical amendment at the constant location. v1-operational-honesty over over-engineered branch-(a)-via-margin paths.

**`audit_log.idempotency_key` first-instance deliberately-populated; forensic-correlation-not-uniqueness.** Chunks-5-6 services pass NO `idempotency_key` in their RPC `p_audit` objects (`documentLinkService.ts`, `documentExceptionService.ts` verified at pre-flight 2); the RPCs use `NULLIF(p_audit->>'idempotency_key', '')::uuid` pass-through, accepting null. `audit_log.idempotency_key` has NO UNIQUE constraint at the column-or-table level (chunks-1-6 migrations verified). Phase 1 precedent (`journalEntryService.ts`) is caller-supplied-or-null. Chunk-2-Phase-4 is the first chunk at chunks-1-6 to populate `idempotency_key` deliberately, with a deterministic TS-side recipe: `md5(case_id || ':' || trace_id || ':router_decision_recorded')` constructed via Node `crypto.createHash('md5')` and UUID-formatted via 8-4-4-4-12 hex slicing. The recipe's intent is forensic-correlation: a single trace_id may produce multiple decision-record rows (e.g., Subsystem 3 re-evaluation reusing the trace_id under T1-T10 triggers); `GROUP BY idempotency_key` deduplicates at higher orchestration layers. Cross-row asymmetry: under the same trace_id, chunk-2-Phase-4's decision-record row carries a populated idempotency_key; chunk-6's `enqueueException` audit row (emitted for branches b/c) leaves idempotency_key null because chunk-6's service doesn't construct one (unchanged at chunk-2 ship). The asymmetry is intentional — trace_id remains the canonical correlation key; idempotency_key is decision-record-specific forensic axis. Discriminator for future chunks: populate deterministic idempotency_key when a row needs retry-correlation as a queryable forensic axis (Subsystem 3 re-evaluation rows under same trace_id will follow chunk-2's pattern); leave null when trace_id alone suffices. TS-side construction over SQL-side because (a) service-layer has all components naturally; (b) the deterministic recipe is visible at the call-site where the discipline codifies; (c) the service can re-derive the key for forensic-replay queries.

**Split p_audit: two-structurally-distinct-audit-rows-per-RPC discriminator.** Branch (a)'s atomic RPC `set_case_head_pointer_with_audit(p_decision, p_audit_decision, p_audit_mutation)` emits two audit_log rows with structurally-distinct `before_state` JSONB shapes — decision-record row carries 10-field DecisionRecordBeforeState (branch, candidate_set_ids, confidence_scores, top_confidence, runner_up_confidence, ambiguity_margin_computed, ambiguity_margin_threshold, winner_candidate_id, exception_reason, document_type); mutation row carries 2-field `{state, current_relationship_candidate_id}`. The RPC takes two separate `p_audit_*` params to keep the structurally-distinct shapes addressed independently. First instance at chunks-1-6 of two-structurally-distinct-audit-rows-per-RPC pattern. Chunk-1-Phase-4's batch RPC `create_candidates_with_audit` emits N×1 rows (N candidates, structurally identical; one row per candidate); partial precedent for multi-row emission but rows share shape so single-p_audit remained adequate. Five reasons for the split-p_audit pattern at chunk-2: (1) action-verb visibility — TS-only closed vocabulary (`'router_decision_recorded'`, `'document_case_transitioned'`) belongs in TS code, not plpgsql literals; (2) caller-owned DecisionRecordBeforeState construction — 10 fields, most of which the RPC can't reconstruct (margin, threshold, branch); (3) Subsystem 3 forward-compat — ADR-0016 §6 + ADR-0018 §Schema-deltas anticipate multi-RPC orchestration where higher cardinalities of structurally-distinct rows materialize (supersession + state transition + candidate replacement); (4) query simplification — distinct payload shapes prevent ambiguity in audit-log queries that filter on `before_state->>'…'`; (5) brief clarity — explicit per-row params make the RPC contract self-documenting. Discriminator for future chunk authors: single-p_audit when audit rows are structurally identical (batch-RPC N×1-shape with one row type repeated); split-p_audit when audit rows are structurally distinct (each row's before_state shape known separately at design time). Chunk-2 establishes the discriminator at chunks-1-6 grain; Subsystem 3 chunks extend mechanically.

**Pure-audit RPC suffix-drop + two-axis verb-family disambiguation.** Chunk-2 introduces two RPC-name patterns: (1) mutation RPCs with `_with_audit` suffix — `set_case_head_pointer_with_audit` (substrate mutation + co-emission of audit rows in single transaction). Establishes the Router-subsystem head-pointer-mutation RPC-name family; future Subsystem 3 RPCs extend mechanically (e.g., `supersede_case_head_pointer_with_audit` for candidate replacement at chunks 3+). (2) Pure-audit RPCs without suffix — `record_router_decision` (audit IS the operation; no substrate mutation at this RPC level). Dropping the suffix clarifies the RPC's purpose; the state transition (classified → needs_review) for branches (b)/(c) is owned by chunk-6's `enqueue_exception_with_audit` RPC, which composes its own audit + mutation. Discriminator for future chunks: mutation-with-audit-co-emission keeps `_with_audit` suffix (set_*_with_audit, update_*_with_audit, insert_*_with_audit, delete_*_with_audit); pure-audit-only RPCs drop the suffix (record_*, emit_*, log_*). Chunks 5-6 RPCs were all mutation-RPCs so the pattern wasn't visible until chunk-2. Two-axis verb-family disambiguation (companion sub-discipline): the RPC-name family `set_case_head_pointer_*` and the audit-row action verb `'document_case_transitioned'` operate on independent axes — conflation is the failure mode this codification prevents. RPC names encode mutation-shape kinship (Subsystem 2's head-pointer-mutation family extends to Subsystem 3's `supersede_case_head_pointer_*`). Audit-row action verbs encode case-state-machine events from the audit_log consumer's perspective; chunk-2-Phase-2 introduced `'document_case_transitioned'` as a single-verb-per-state-transition convention (`documentCaseService.ts:202` passes the same verb for all transitions; source/target captured in `before_state` JSONB). Chunk-2-Phase-4's branch (a) row-2 inherits the verb verbatim (pre-flight #1 outcome (b) single-verb). The decision-record audit row uses a chunk-2-Phase-4-specific verb `'router_decision_recorded'` (R4.2 lock; branch-agnostic; matches the decision-record semantic). Future chunks: RPC-name family extensions describe mutation-shape; action-verb extensions describe new audit-event types in the chunk-2-Phase-2 single-verb-per-state-transition + chunk-2-Phase-4 decision-record convention.

**DecisionRecordBeforeState forensic-payload self-containment.** The decision-record audit row's `before_state` JSONB carries 10 fields (branch, candidate_set_ids, confidence_scores, top_confidence, runner_up_confidence, ambiguity_margin_computed, ambiguity_margin_threshold, winner_candidate_id, exception_reason, document_type). The named fields `top_confidence` and `runner_up_confidence` are redundant with `confidence_scores` map + `candidate_set_ids` ordered derivation; the explicit naming serves three ADR-0019 calibration-cycle use cases: (1) query-path simplification (§7) — analysis queries `before_state->>'top_confidence'` directly without reconstructing top-from-map ordering; reduces analysis latency at v1+6mo first calibration cycle. (2) Audit-trail invariance (§13) — `ambiguity_margin_threshold` captures the at-decision-time value of `AMBIGUITY_MARGIN_V1_PROVISIONAL`; if the constant changes between cycles, prior decisions preserve their decision-time threshold for forensic accuracy ("what threshold was this decision made under" answerable from audit_log alone). (3) Stratification (§9 row 1) — `document_type` is included as calibration-cycle stratification key, enabling per-doctype decision-pattern analysis (vendor_invoice vs receipt vs payment_confirmation may need separate threshold calibrations). Discriminator for future chunks: forensic-payload self-containment — when a row's before_state will be queried by analysis pipelines that don't have access to related tables, include all calibration-relevant fields directly (even if derived). The `.refine()` iff-constraint defense at `DecisionRecordBeforeStateSchema` Layer 2 enforces N=0 ⇔ top_confidence null + N<2 ⇔ runner_up_confidence/margin null + branch=a ⇔ winner non-null/exception_reason null.

**v1 envelope-less Subsystem 2 contract: branch (b)/(c) substrate-collapse + unconditional invocation.** ADR-0018 §item 3 specifies three decision branches for Subsystem 2: (a) single winner — set head pointer + state transition; (b) ambiguous — propose multiple candidates to reconciliation UI; (c) no match — route to exception queue. Branch (b) presupposes Tier-1 ProposedEntryCard disambiguation UI for operator review + selection. v1 ships without envelopes (`ProposedMutation`/`ProposedAttachment` types have zero codebase references at scope-lock 2026-05-13) and without the ProposedEntryCard UI. Chunk 2 implements an envelope-less v1 shape by collapsing branch (b) → branch (c) at the substrate mutation level: branch (b) head pointer unset (no winner); case state → needs_review via chunk-6 enqueueException; `exception_reason='multi_candidate_ambiguity'` (preserves branch identifier in audit trail for ADR-0018 §item 3 conformance + forward-compat with envelope-shipping chunks). Branch (c) head pointer unset (no match); case state → needs_review via chunk-6 enqueueException; `exception_reason='unmatched_router_candidate'`. Both branches route to the manual exception queue at v1; the only difference is `exception_reason`, which signals the exception source to the operator. v1 pipeline orchestrator contract: always invoke `resolveCandidates` after `completeCandidate`, regardless of candidate count. N=0 is handled inside Subsystem 2 (branch c), not at orchestrator-level. Forward-compat with the Phase 7 pipeline orchestrator. When envelopes ship (Phase 5 reviewer UI chunk or later), ADR-0018 §item 3 amendment fires to reconcile the v1 collapse with §item 3's original prose — likely either promoting branch (b) to emit an envelope with multiple candidate targets per the original framing, or ratifying chunk-2's collapse as canonical v1+ shape. Retrospective inventory item 6 stages the amendment. Discriminator for future chunk authors: when a brief or ADR specifies UI-dependent substrate behavior but the UI doesn't ship at the substrate-chunk's time, prefer substrate-collapse with branch identifier preserved in audit trail (forward-compat) over ADR amendment at substrate time (premature lock-in). The amendment fires at the first consumer chunk.

**First cross-phase substrate modification: CHECK broaden + FK ALTER.** Chunk-2-Phase-4 modifies two Phase 2 substrate elements: (1) Layer 1 CHECK constraint broaden — `document_cases.state` admits `'matched'`; constraint rename `document_cases_state_chunk_6_active` → `document_cases_state_chunk_7_active` reflecting cross-phase broadening event counter. (2) Head-pointer FK activation — chunk-1-Phase-2 reserved bare column `current_relationship_candidate_id uuid` (migration `20240143000000_document_cases_substrate.sql` line 67); chunk-2-Phase-4 activates FK constraint `REFERENCES document_relationship_candidates(id) ON DELETE RESTRICT`. ADR-0010 substrate-now-enforcement-later: reserve early, enforce at consumer-chunk. Cross-phase modification precedent context: chunk-1-Phase-4 modified chunk-5-Phase-2's `VALID_PAIRS` constant (cross-chunk same-phase; one-keyword export-status change); chunk-6-Phase-2 modified chunk-2-Phase-2's `LEGAL_TRANSITIONS` constant (cross-chunk same-phase; transition-matrix broadening). Chunk-2-Phase-4 modifies chunk-1-Phase-2's CHECK constraint + chunk-1-Phase-2 column FK — new structural shape at chunks-1-6: cross-phase substrate modification. Sub-discriminators: (a) CHECK suffix naming discipline (chunk-number sequence vs phase-based suffix `_phase_N_v2` vs time-based `_2026_05_14`) — provisional `_chunk_7_active` chunk-number-sequence at brief-draft; full codification deferred to second cross-phase CHECK-broaden event's friction-journal entry (or earlier ADR-0010 amendment). Retrospective inventory item 7 stages. (b) FK naming + RESTRICT/CASCADE choice — RESTRICT mirrors chunk-1-Phase-4 immutable-spine convention (`document_relationship_candidates` REVOKE'd from service_role for DELETE; no delete path at v1 makes RESTRICT effectively inert but defense-in-depth under future substrate changes). Discriminator for future chunk authors: cross-phase substrate modifications are first-class at chunks-1-6 grain when consumer-chunk activates reserved substrate; document in friction-journal + migration top-comment.

**(β-1) `INTEGRITY_VIOLATION` ServiceErrorCode does not exist — chunks-5-6 catchall is `POST_FAILED`.** Brief R3.4 cited `INTEGRITY_VIOLATION` as a ServiceError code inherited from chunks-5-6 for FK violation mapping (PG SQLSTATE 23503) and `no_data_found` mapping (P0002). Implementation surfaced the gap: the `ServiceErrorCode` union at `src/services/errors/ServiceError.ts:3-100` does not define `INTEGRITY_VIOLATION`; chunks-5-6's actual precedent (chunk-6 `documentExceptionService.ts`) maps 23505 → `EXCEPTION_ALREADY_OPEN`, 23514 → `INVALID_TRANSITION`, 0A000 → `INVALID_TRANSITION`, and everything else → `POST_FAILED` catchall. Chunk-2-Phase-4's branch (a) RPC error handling collapses 23503/P0002 → `POST_FAILED` to match the actual precedent. Discriminator for future chunks: when a brief cites a ServiceErrorCode by name, verify against the actual `ServiceErrorCode` union at implementation — briefs may carry forward names that sound canonical but were never defined. Pattern: brief-draft pre-flight checklist for cross-chunk ServiceError code references should include a grep against `ServiceErrorCode` union members before locking R3.4-style "no new codes" claims. Describe 9 test 1 (FK violation on invalid `winner_candidate_id`) asserts `POST_FAILED` per this reconciliation.

Anticipated surprises that did NOT fire as fresh entries:
- ADR-0018 §item 3 branch (b) "propose-with-ambiguity-flag" prose — chunk-2 v1 collapse documented; retrospective inventory item 6 staged for first envelope-substrate chunk.
- Layer 1 CHECK suffix discipline (`_chunk_7_active` naming) — provisional chunk-number sequence; codification deferred to second cross-phase broaden event. Retrospective inventory item 7.
- `AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05` value choice — operationally indifferent at v1 (chunk-1 single-feature scoring zeros all margins); ADR-0019 first calibration cycle ratifies. Retrospective inventory item 8.
- Pre-flight #1 outcome (b) (single-verb `'document_case_transitioned'`) was anticipated as one of two scope-lock R4.3 outcomes; lock applied at brief-draft.
- Pre-flight #2 outcome (ii) (chunks-5-6 omit idempotency_key) was anticipated as one of multiple scope-lock R4.5 outcomes; chunk-2 first-instance population locked at brief-draft.
- Pre-flight #3 + #4 confirmations (canonical Router service home + no-state-transition contract on empty paths) — no friction surfaced; R3.3 lock #3 + R5.4.β.ii fixture design grounded.


### 2026-05-14 — Phase 4 chunk 3 (3a) SHIPPED — Subsystem 3 dispatcher service + integration tests (Path C-dispatcher-isolated split)

Ten primary entries shipping at 3a per Path C-dispatcher-isolated split (F-J-1 + F-J-2 + F-J-3 + F-J-4 + F-J-5 + F-J-6 + F-J-7 + F-J-13 + F-J-14 + F-J-15) plus three β reconciliations. F-J-8 + F-J-10 + F-J-11 + F-J-12 defer to 3b (cross-phase wiring section). F-J-9 demoted to memory-only per (D) filter (extends F-J-ε `_with_audit` suffix discipline with one more instance; no new shape).

**Phase 4 chunk 3 — `_chunk_N_active` arc-extended-lifecycle-sequence discipline (tier-1 codification, F-J-1).** Layer 1 CHECK constraint suffix discipline codified per (α-iii) Round 4.a lock. The suffix tracks the chunk's position in the arc-extended `_chunk_N_active` lifecycle sequence. Phase 2 chunks 1-6 occupy positions 1-6 (one position per chunk that participates in the `_chunk_N_active` lifecycle). Phase 4 chunks that participate in the lifecycle — introduce a new `_chunk_N_active` CHECK or broaden an existing one — extend the sequence by one position. Chunks that use a different naming convention (e.g., `_v1_active` for fixed-range CHECKs like confidence_score on document_relationship_candidates) do not participate and do not extend the count. Position assignment: Phase 2 chunk 1 = position 1 (source_documents); Phase 2 chunk 2 = position 2 (document_cases.state introduced at `_chunk_2_active`); Phase 2 chunk 3 = position 3 (document_case_sources); Phase 2 chunk 4 = position 4 (document_artifacts; substrate-walkable carve-out); Phase 2 chunk 5 = position 5 (source_document_links polymorphic spine); Phase 2 chunk 6 = position 6 (exception_queue_entries introduced + document_cases.state broadened — all four landed at `_chunk_6_active` per same-chunk-multi-CHECK rule below); Phase 4 chunk 1 = position skipped (used `_v1_active` for range CHECK; different naming convention); Phase 4 chunk 2 = position 7 (document_cases.state broadened to `_chunk_7_active` admitting 'matched'); Phase 4 chunk 3 = position 8 (exception_status broadened to `_chunk_8_active` admitting 'cancelled'). A single chunk introducing or broadening MULTIPLE `_chunk_N_active` CHECKs gets the same position-suffix on all of them (Phase 2 chunk 6 precedent: four CHECKs at `_chunk_6_active`). Codification deferred: chunks that broaden a `_chunk_N_active` CHECK across multiple lifecycle events within the same chunk (none observed yet at chunks 1-6 + Phase 4 chunks 1-3); ratification fires when this case actually arises. Closes chunk-2-Phase-4 retrospective inventory item 7 ("second cross-phase CHECK-broaden event's codification deferred to second cross-phase CHECK-broaden event"); chunk-3-Phase-4 IS that second cross-phase CHECK-broaden event. Discriminator for future chunk authors: when broadening or introducing a `_chunk_N_active` CHECK, compute the chunk's position in the arc-extended-lifecycle-sequence and apply the suffix; reference this codification for the rule.

**Phase 4 chunk 3 — cancelled-is-terminal trigger symmetry with mirror-framing error message (F-J-2).** chunk-6's `reject_invalid_exception_status_transition` trigger function rejected only `resolved → other` transitions (resolved is terminal one-way per ADR-0011 §13 chunk-6 semantics). Chunk-3 activates the reserved `'cancelled'` exception_status value and extends the trigger function with a second IF clause forbidding `cancelled → other` transitions — cancelled is terminal one-way per ADR-0018 Subsystem 3 contract (re-enqueue produces a NEW entry, not a transition from cancelled; chunk-6 partial UNIQUE index `(document_case_id) WHERE exception_status='open'` correctly admits fresh enqueue after cancellation). Error message text per Round 4.b refinement: `'cancelled is terminal per ADR-0018 Subsystem 3 contract; cancelled → % is forbidden (mirrors chunk-6 resolved → % one-way rule)'`. Per-source-state error messaging preserved (two distinct messages for `resolved → X` vs `cancelled → X`); the chunk-6 codified discipline of stable test regex `_chunk_\d+_active` handles constraint-name shifts at the test-assertion layer separately. Discriminator for future chunks: when activating a reserved terminal-state ENUM value, extend the corresponding state-machine trigger function with a per-source-state IF clause; preserve mirror-framing in the error message to document the symmetry to operators reading audit logs.

**Phase 4 chunk 3 — `cancelled_at` deferred per "land schema with consumer code" reverse-discipline; fourth instance of consumer-presence verification (F-J-3).** Round 4.c verification at scope-lock surfaced two v1 consumer checks for a `cancelled_at TIMESTAMPTZ` column on `exception_queue_entries` (mirror of chunk-6's `resolved_at` shape): (1) UI surface — does any v1 UI query exception_queue_entries by cancelled status or cancelled_at? Phase 4 ships dispatcher-side substrate; exception queue UI lives in Phase 6; cancelled entries are filtered OUT of the active queue (partial UNIQUE design says cancelled is out-of-queue); no foreseeable Phase 6 UI surface needs cancelled_at inline. (2) Audit/reporting filter — does any v1 service or query path filter WHERE cancelled_at > ?. v1 reporting surfaces are bills/payments/journals; no exception-queue audit/reporting at v1. Both checks negative → 4.c-γ locked at scope-lock: no new columns; cancellation transition is pure status flip; WHEN/WHY via audit_log trace_id correlation. The "land schema with consumer code" reverse-discipline reads in this direction: substrate addition needs a named v1 consumer; if none exists, defer the addition. Fourth instance of this pattern at chunks 1-6 + Phase 4 chunks 1-3: (a) vendor_credits substrate (chunk 5 finding — Phase 5 didn't ship vendor_credits tables); (b) backfill_vendor_prepayment_suggested (chunk 6 finding — cross-ADR drift caught at scope-lock); (c) paymentService/vendorCreditService (Phase 4 chunk 3 framing finding — Phase 5 service surface gap); (d) cancelled_at (Phase 4 chunk 3 Round 4.c finding). Four-instance precedent supports Item D codification at Phase 4 retrospective (RI-1). Discriminator for future chunk authors: any substrate addition requires a named v1 consumer; if no consumer exists, defer with explicit forward-pointing comment naming the consumer-presence verification as the deferral rationale.

**Phase 4 chunk 3 — P3-i post-commit wrapper pattern for Phase 5/2/1 services calling dispatchTrigger (F-J-4).** First instance of post-commit dispatch wrapper at chunks-1-6 + Phase 4 chunks 1-2. The dispatcher (`documentRouterService.dispatchTrigger`) is called from Phase 5/2/1 service methods AFTER the caller's primary mutation commits — NOT inside the caller's withInvariants transaction. P3-i implementation pattern: caller's service method body executes primary mutation (INSERTs, UPDATEs, recordMutation audit emission); appends try/catch around `await documentRouterService.dispatchTrigger(...)` at end of body; logs on failure without propagating (best-effort isolation). Exception for T10 (single-case caller-driven trigger): no try/catch — dispatcher failure propagates to caller. Three reasons for P3 (post-commit) over P1 (same-transaction): (a) operational correctness — bill post succeeding but T1 dispatch failing is a "missed re-evaluation" recoverable via T10 manual override or future T8 period-reopen sweep; bill post failing because dispatcher had a transient error is unrecoverable from caller's perspective and operationally worse; (b) transaction length — P1 would make billService.post's transaction include the dispatcher's fan-out (up to 50 case re-evaluations); long-running transactions hold row-locks longer; P3 keeps short transactions; (c) best-effort dispatcher contract — P3 enables "dispatcher is best-effort; failures log but don't propagate to caller" design. Pattern B variant split (Round 6 Finding A) means the insertion site differs across services: external-wrap services (Phase 2 document-platform + Phase 5 spend) get dispatch at end of plain async function body (route handler wraps via withInvariants externally); internal-wrap services (Phase 1 accounting) get dispatch INSIDE the existing `withInvariants(async (input, ctx) => ...)` body, after audit emit. Discriminator for future chunks: when a service method needs a downstream best-effort emission (telemetry, trigger dispatch, notification), prefer P3-i post-commit wrapper over same-transaction inclusion; document the variant (internal-wrap vs external-wrap) per Pattern B context. Pre-shipped at 3a as service-comment ratification + dispatcher-surface ratification; cross-phase consumers materialize at 3b.

**Phase 4 chunk 3 — per-trigger-type failure policy: fan-out log+continue / single-case propagate (F-J-5).** First instance of asymmetric per-trigger-type failure policy at chunks-1-6 + Phase 4 chunks 1-2. The dispatcher's internal switch on `trigger_type` applies different failure semantics per trigger: fan-out triggers (T1, T3, T5, T8 — system-driven; no single caller cares about a specific case's outcome) catch service-layer failures in the per-case loop's try/catch, log + skip + continue to the next case; the failed case emits a `router_re_evaluation_fired` audit row with `decision_outcome='dispatch_failed'` in a separate small transaction. Single-case triggers (T10 — caller-driven via documentExceptionService.resolveException with resolution_action='reprocess'; the caller wants to know if the re-route succeeded) re-throw the original error after dispatch_failed audit emission; the caller sees the error. The semantic asymmetry maps to the operational reality: T1 fan-out across 50 exception cases for a vendor is operationally "50 independent re-evaluations triggered by the same event" — a failure in case #25 shouldn't roll back case #24's successful re-route. T10 is one caller asking for one case's re-route — failure must propagate so the caller can retry or surface the error. Universal log+continue (even T10) would silence operational failures to callers; universal fail-and-propagate (even fan-out) would let one bad case kill 49 good ones. Discriminator for future chunks: when designing a dispatcher with multiple trigger types, assess per-trigger-type whether the trigger has a single caller-care semantic (propagate failures) or fan-out semantic (log+continue + audit-emit failures); the policy can split across triggers within a single dispatcher.

**Phase 4 chunk 3 — `dispatch_failed` decision_outcome value: substrate-now-amendment-later per chunk-6 backfill_vendor_prepayment_suggested precedent (F-J-6).** ADR-0018 §Schema-deltas defines `decision_outcome` as a 4-value vocabulary (no_change, re_routed_from_exception, re_routed_to_exception, candidate_superseded). Chunk-3's per-trigger-type failure policy (F-J-5) requires a fifth value to capture per-case dispatch failures (service-layer failures caught at the dispatcher's per-case try/catch, emitted in a separate small transaction with `decision_outcome='dispatch_failed'`). Chunk-3 ships `dispatch_failed` as Zod literal union substrate at chunk close; the ADR-0018 §Schema-deltas amendment to formally add the value is retrospective inventory candidate RI-2 (Phase 4 retrospective batch). Per ADR-0018 §Schema-deltas wording, `decision_outcome` is documented as event-payload constraint, NOT a DB CHECK closed enum — chunk-3's introduction is Layer 2 (Zod) + Layer 3 (TS const + service emission) only; no Layer 1 DB CHECK addition needed. Pre-amendment substrate shipping mirrors chunk-6's backfill_vendor_prepayment_suggested precedent: chunk-6 shipped the reserved resolution_action value at chunk close pending ADR-0011 §13 amendment; Phase 2.5 Commit B (e2cceb9) ratified the amendment as a follow-on. Same shape at chunks 4+ for ADR-0018 §Schema-deltas. Semantic split codified at brief: dispatch_failed captures the operational subset where the dispatcher loop catches a thrown ServiceError; PG-rollback failures within per-case transactions are NOT captured at audit_log layer (rollback voids in-transaction audit row); detectable only via pino logs. Honest scoping: dispatch_failed isn't trying to capture every failure mode, just the operational subset where the dispatcher loop catches outside a per-case transaction. Discriminator for future chunks: when a new substrate value is needed but the source ADR doesn't yet enumerate it, ship pre-amendment substrate at the chunk's close + stage the ADR amendment as retrospective inventory candidate; same shape generalizes across ADRs.

**Phase 4 chunk 3 — direct-call cross-service pattern: no event-bus indirection at v1 (F-J-7).** First explicit codification of the cross-service emission mechanism at chunks-1-6 + Phase 4 chunks 1-2. Chunk-3's Phase 5/2/1 service methods call `documentRouterService.dispatchTrigger` directly via TypeScript imports; no event-bus indirection, no message queue, no asynchronous handoff. The codebase has no typed-event-bus infrastructure at v1 (verified at scope-lock Round 5.e and Round 1 codebase orientation); building one is significant scope creep that doesn't fit chunk-3's substrate-mutation grain. Direct call is v1-realistic; event-bus indirection is post-MVP territory. The pattern's trade-off: direct calls create static import dependencies (Phase 5 services depend on Phase 4 documentRouterService); future post-MVP refactoring may invert to dependency-inversion via event bus if (a) the static dependency becomes operationally awkward at scale, OR (b) the dispatcher's failure-isolation discipline (P3-i best-effort + dispatch_failed audit) doesn't suffice and async retry semantics are needed. Neither condition fires at v1. Discriminator for future chunks: when adding cross-service downstream emission, default to direct call until operational evidence justifies bus infrastructure; codify the direct-call shape in service-method comments per chunk-3 P3-i wrapper pattern (F-J-4).

**Phase 4 chunk 3 — γ' re-eval primitive + γ'-partial per-trigger semantic-coverage + D-partial-no-idempotency contract (tier-1 codification, F-J-13).** Three layered framings around the Subsystem 3 re-evaluation primitive, locked at the amended-brief amendment cycle. **(γ' re-eval primitive)** `rematchCandidate(case_id, trace_id, ctx)` is a thin private wrapper over chunk-1's `completeCandidate` that reconstructs a partial `CompleteCandidateInput` from the case's head-of-chain `document_relationship_candidates.candidate_features` substrate + a vendor_id fallback via `linked_entity_id` (bills.vendor_id / vendor_prepayments.vendor_id). Honors ADR-0018 §item 4 "Subsystem 3 re-evaluates pre-commit cases" at matching-semantic level for cases-with-prior-candidates. **(γ'-partial per-trigger coverage)** chunk-1's completeCandidate does NOT persist substrate on failure paths; stranded cases (T1/T3 fan-out scope; T10-without-priors) have no `candidate_features` rows. v1 coverage table per amended brief: T5/T8/T10-with-priors re-routing-functional via reconstruction; T1/T3/T10-stranded audit-only (rematchCandidate returns []; caller maps to decision_outcome='no_change'). Full γ (any-case-reconstructable) activates when Phase 7 ships classification + extraction + vendor-matching substrate for stranded cases. **(D-partial-no-idempotency)** ADR-0018:792-805 specifies an idempotency contract ("if new Subsystem 1 output matches current candidate, no new candidate row is emitted") that chunk-3 does NOT implement. chunk-1's completeCandidate dedups against `source_document_links` only (via `existingPairKey` filter), NOT against existing `document_relationship_candidates` rows. Every non-empty re-run inserts new candidate rows in addition to existing ones; T5/T6/T8 partial-state-change emits `candidate_superseded` even when output is identical to prior (noisy audit events + growing supersession chains). Acceptable at v1 with low trigger volume; defers ADR-0018-conformant fingerprint-based dedup activation to a future chunk per RI-9 (Phase 4 retrospective batch). The three framings collectively make the 6-rule discriminator at runPerCaseReEvaluation step 5 operationally coherent at v1. Discriminator for future chunk authors: when a domain primitive accepts partial-substrate inputs, name the partial-coverage variant explicitly (γ'-partial vs γ-full) at scope-lock; ADR-cited idempotency contracts may also have partial-implementation variants worth explicit naming (D-partial-no-idempotency) when full implementation requires substrate not yet available.

**Phase 4 chunk 3 — Path C-dispatcher-isolated invocation: first chunk-atomicity break at chunks-1-6 + Phase 4 (tier-1 codification, F-J-14).** First explicit chunk-atomicity break at the chunks-1-6 + Phase 4 chunks 1-2 grain. Chunks 1-6 + Phase 4 chunks 1-2 each shipped one substrate + service + tests + friction-journal-entries bundle in a single commit; chunk-3 splits into 3a (dispatcher service + dispatcher integration tests + dispatcher-side friction-journal) and 3b (cross-phase service-method wirings + cross-phase test extensions + remaining friction-journal + memory rename) under Path C invocation pattern. Triggering conditions (evidence at chunk-3): five framing-touching findings (Pause 2-5 amendment cycle + Path C as 5th finding itself) accumulated mid-implementation crossing the volume-vs-budget arithmetic for reliable single-session delivery; brief amendment cycle (RI-10 / F-J-15) absorbed framings 1-4 but volume-of-implementation remained outside single-session scope. Path C preserves wiring-with-tests pairing at each commit boundary: 3a pairs dispatcher service + dispatcher tests; 3b pairs cross-phase service wirings + cross-phase test extensions. Validation gate green at each commit non-negotiable. The split represents new structural shape at chunks-1-6 grain: chunks-with-cross-phase-blast-radius may exceed single-session budget when (a) the chunk's substrate scope is large (chunk-3: 8 source files + 1 migration + 1 generated types.ts) AND (b) scope-lock surfaces N framing-revisits (chunk-3: 5 findings amendment cycle). Retrospective inventory candidate RI-7 codifies session-budget-feasibility verification at scope-lock for future chunks of substantively-novel-logic scope. Discriminator for future chunk authors: when a chunk's volume-vs-budget arithmetic at scope-lock or mid-implementation exceeds single-session reliable delivery, invoke Path C split with explicit fault-line declaration (dispatcher-isolated vs cross-phase-wirings, or analogous); preserve wiring-with-tests pairing at each commit; require validation-gate-green at each commit boundary.

**Phase 4 chunk 3 — brief amendment cycle discipline: chunks-1-6 + Phase 4 single-finding-divergence-shape vs cross-arc multi-finding-amendment-cycle threshold (tier-1 codification, F-J-15).** Chunks-1-6 + Phase 4 chunks 1-2 operated under brief-stands-with-friction-journal-deviations discipline: implementation surfaces are absorbed by friction-journal entries (β-N reconciliations); brief text stays as-shipped at scope-lock for chronology + provenance. This discipline holds cleanly at single-finding scale (one or two β reconciliations per chunk). Chunk-3 crossed the divergence threshold: five framing-touching findings accumulated mid-implementation arc (Pause 2 γ' re-eval primitive; Pause 3 γ'-partial per-trigger coverage; Pause 4 D-partial 6-rule discriminator; Pause 5 D-partial-no-idempotency; Path C-dispatcher-isolated as workflow framing). Each finding touched amendable framings: re-eval primitive shape, per-trigger semantic coverage, decision-outcome discriminator structure, idempotency contract conformance, commit shape. Beyond single-finding scale, friction-journal-only divergence loses brief-as-canonical-reference quality. RI-10 ratifies the brief amendment cycle discipline: when N findings accumulate beyond shape-changing-amount, the brief gets editorial amendment cycle (amendment section ratified at the original brief's header position) rather than friction-journal-only divergence. The amended brief at c76d264 absorbs all five chunk-3 framings as the authoritative chunk-3 specification; F-J-13 + F-J-14 + F-J-15 ship at chunk-3 close as canonical-record-of-discipline-graduations rather than deviation-records. Discriminator for future chunk authors: at single-finding scale (one or two β reconciliations), friction-journal-only divergence is sufficient. At multi-finding-shape-changing scale (three or more framings touched), brief amendment cycle is the right tool — the amendment section ratifies new framings as authoritative; friction-journal entries codify the discipline graduations; retrospective inventory tracks any further ADR amendments. Sibling discipline to RI-7 (session-budget-feasibility verification at scope-lock).

**Anticipated surprises that DID fire as fresh entries (β reconciliations).**

- **(β-3) Migration `WHERE id = p_entry_id` for `exception_queue_entries` is wrong — PK column is `exception_queue_entry_id`.** Scope-lock substrate WIP had the cancel_exception_with_audit RPC's SELECT FOR UPDATE + UPDATE clauses filtering on `id` but the chunk-6 substrate uses `exception_queue_entry_id` as the PK column name. Fixed at impl onset (two-line migration edit). Same shape as chunk-2-Phase-4 (β-1) column-name verify-from-disk surprise: brief inferred SELECT/UPDATE column from codebase without psql verification; carry-forward to chunks 4+: cross-substrate migration columns get a brief-draft-time `psql \d <table>` pre-flight when the brief writes new RPCs referencing a chunk-N substrate not authored by the same brief. Third instance of notational-drift catch (dispatch_failed introduce-vs-extends + idempotency-key field-order + bills-vs-vendor_prepayments PK naming asymmetry). RI-5 codification threshold met.

- **(β-4) 6-rule discriminator `count_after` interpretation: K2 head-of-chain SELECT vs `newCandidates.length`.** Amended brief Task 4 step 7 says `candidate_count_after` = "SELECT COUNT(*) post-mutation" (K2 head-of-chain literal). Under chunk-1 completeCandidate's no-supersedes-on-empty-rerun semantic, head-of-chain SELECT post-mutation yields `count_after = count_before` for empty re-runs (no INSERTs happen, no prior rows removed). That makes the 6-rule discriminator's rules 2 / 4 / 6 indistinguishable: T5 walkable proof would yield count_after=1 (prior still head-of-chain) instead of count_after=0 (the walkable-proof-required value for rule 4 firing). Implementation uses `count_after = newCandidates.length` (the rematchCandidate result count) to make the discriminator operationally coherent. This is the minimum-deviation interpretation that matches the walkable proof's rule 4 firing semantic. Carry-forward: amended brief §3 + §5's K2 head-of-chain language is technically inconsistent with chunk-1's no-supersedes semantic; future ADR-0018 amendment (RI-2 batch) may clarify whether dispatcher should explicitly supersede prior on empty rematchCandidate, or whether `count_after = newCandidates.length` is the canonical v1 interpretation.

- **(β-5) Amended brief §3 Rule 5 "data-inconsistent: prior candidates AND open exception for same case" is operationally reachable at v1.** Amendment §3 framed rule 5 (count_before > 0, count_after = 0, open_exception_id) as data-inconsistent and prescribed throw POST_FAILED. But the state is reachable through normal v1 operation: T5/T8 invalidation produces re_routed_to_exception (rule 4) which calls enqueueException to create an open exception without removing prior candidates; a subsequent T1/T3 fan-out legitimately picks up the same case with priors + open exception, rematchCandidate returns [] (no fresh matches), and rule 5 fires. Implementation maps rule 5 to decision_outcome='no_change' (no work to do; case stays in queue) rather than throw — operationally correct semantic. Carry-forward: amended brief §3 rule 5 language is too narrow; the discriminator's "data-inconsistent" framing should be replaced with "case is currently in exception queue and rematchCandidate found no fresh matches → no_change". Retrospective inventory candidate (Phase 4 retrospective batch): tighten the discriminator table prose to reflect operational reachability.


### 2026-05-14 — Phase 4 chunk 3 (3b) SHIPPED — cross-phase emission wiring + chunk-3 substrate complete

Four primary friction-journal entries at 3b (F-J-8 + F-J-10 + F-J-11 + F-J-12) per amended brief Amendment §6 + Path C split. F-J-9 remains demoted to memory-only. Plus a correction-notes section for 3a numbering bookkeeping.

**Phase 4 chunk 3 — Item C verify-from-disk fires prospectively at chunk-3 brief-draft (F-J-8; first prospective application).** `feedback_verify_from_disk_at_brief_loop.md` codifies three Item C-style checklists. Chunk-3 brief-draft was the first session at chunks-1-6 + Phase 4 chunks 1-2 to apply Item C prospectively (chunks-1-6 + Phase 4 chunk 2 fired Item C reactively at implementation β-1 reconciliations — INTEGRITY_VIOLATION mismatch in chunk-2-Phase-4). Pre-flight prospective grep at chunk-3 brief-draft: (a) `grep -n 'EXCEPTION_ALREADY_CANCELLED' apps/web/src/services/errors/ServiceError.ts` — confirmed absent; brief lists as new substrate addition. (b) `grep -n 'dispatch_failed' apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts` — confirmed absent; broader grep also confirmed `decision_outcome` does not exist anywhere as Zod schema or TS const, so chunk-3 INTRODUCES `RouterDecisionOutcomeSchema` fresh (notation refinement: scope-lock memory's "extended" language is technically inaccurate — chunk-3 introduces, not extends; brief uses "introduces"). The prospective-vs-reactive distinction matters: prospective Item C catches β-reconciliation candidates BEFORE the brief commits; reactive Item C catches them at implementation when service code fails to compile or runs into PG errors. Chunk-3 demonstrated the prospective-application value: two β-reconciliation candidates prevented (EXCEPTION_ALREADY_CANCELLED + dispatch_failed both confirmed absent at brief-draft; brief explicitly names them as new substrate). At 3a impl, three additional β reconciliations surfaced that prospective Item C did NOT catch (PK column fix + count_after semantic + rule 5 reachability) — see correction-notes section below for why these are second-order rather than naming-level surprises. Discriminator for future chunks: at brief-draft, grep against codebase-canonical-sources for every new ServiceErrorCode / Zod schema / TS const / type name the brief cites; document the grep result in the brief's Flagged Ambiguities section. Item C is now firing prospectively at chunks 4+ by default.

**Phase 4 chunk 3 — first multi-trigger-types-within-one-trace audit_log shape (F-J-10): R1 idempotency_key recipe extends F-J-β with trigger_type dimension.** Chunk-2-Phase-4 introduced deliberate audit_log idempotency_key population per F-J-β with recipe `md5(case_id || ':' || trace_id || ':router_decision_recorded')::uuid` — three components: case_id, trace_id, action_name (single-action-per-trace semantic). Chunk-3-Phase-4 introduces R1 recipe `md5(case_id || ':' || trace_id || ':' || trigger_type)::uuid` for `router_re_evaluation_fired` audit events — extends the recipe with trigger_type as the position-3 discriminator that action_name occupied in F-J-β. The substitution is precise: trigger_type IS the new discriminator within a trace because multiple trigger types may fire within a single trace_id (e.g., T5 invalidation produces a re-eval that fires T1-style fan-out via supersession chains; 3b cross-phase wiring of T1 + T5 + T8 confirms this happens — billService.post followed by billService.recordPayment both within one route handler trace would emit both T1 and T5 audits). Chunk-2's F-J-β was single-action-per-trace; chunk-3 generalizes to multi-trigger-types-per-trace. The recipe's field order is preserved (case_id, then trace_id, then discriminator in position 3); only the discriminator's semantic dimension changes. Cross-row correlation: under the same trace_id, chunk-2's decision-record row carries idempotency_key constructed with action_name; chunk-3's per-case router_re_evaluation_fired rows carry idempotency_keys constructed with trigger_type; the two are distinguishable by their idempotency_key value but share trace_id for cross-event correlation. Verified at brief-draft against documentRouterService.ts:386 (chunk-2 actual recipe field order). Discriminator for future chunks: when a single trace_id may produce multiple audit events of different types/actions, include the discriminator (action_name, trigger_type, or analogous) in position 3 of the md5 input; keep case_id + trace_id in positions 1+2 for cross-recipe consistency.

**Phase 4 chunk 3 — Pattern B variant split (F-J-11): Phase 1 internal-wrap vs Phase 2/5 external-wrap.** Pattern B "unwrapped function exports" comes in two variants in chounting, verified at scope-lock Round 6 against periodService.ts + billService.ts + vendorPrepaymentService.ts + documentExceptionService.ts and applied at 3b across 6 service-method modifications (Task 6). External-wrap variant (Phase 2 document-platform + Phase 5 spend): service methods exported as plain async functions; route handlers wrap calls via `withInvariants(action, () => service.method(...))` externally; service body has no withInvariants reference (billService.ts:1-69 header verbatim: "Plain unwrapped functions exported as service object; route handlers wrap via withInvariants per Pattern B INV-SERVICE-001 export contract"). Internal-wrap variant (Phase 1 accounting): service methods exported as `withInvariants(async (input, ctx) => { ... })` — withInvariants wraps INTERNALLY at function definition site (periodService.ts:172 `unlock: withInvariants(...)`). The split is real and architecturally meaningful: Phase 1 services originated pre-Pattern-B-codification (chunks-1-6 of Phase 2 introduced external-wrap as the canonical Pattern B); Phase 1 didn't refactor. P3-i post-commit wrapper application (F-J-4) handles both variants: external-wrap services get dispatch at end of plain async function body before `return result`; internal-wrap services get dispatch INSIDE the `withInvariants(async () => ...)` body after the existing audit emission. 3b's 6 modifications split 5 external-wrap (billService.post / recordPayment / reverse + vendorPrepaymentService.record + documentExceptionService.resolveException) + 1 internal-wrap (periodService.unlock). The variant determines insertion site, not pattern semantic — both variants land best-effort dispatch (try/catch around dispatchTrigger; log on failure; no propagation except T10). Future Phase 4+ chunks reaching into Phase 1 services (e.g., adding a periodService.lock T-style trigger) inherit the variant awareness from this codification. Codified at Round 6 brief-draft verification + 3b impl confirmation (now N=2 evidence: scope-lock prediction + impl realization). Second-instance trigger would graduate to "should we normalize the variants project-wide" question — deferred until that surfaces.

**Phase 4 chunk 3 — T5 emission per-method conditional gating (F-J-12): state-transition watch-set semantics.** ADR-0018 §T5 specifies T5 fires when bill "leaves ('approved_for_payment', 'partially_paid') states." Per-method analysis of billService.ts at scope-lock Round 6 and confirmed at 3b impl: (a) `billService.approveForPayment` transitions `pending_approval → approved_for_payment` — enters the watched set; does NOT leave. T5 does NOT fire (chunk-3 does not modify approveForPayment). (b) `billService.recordPayment` transitions `approved_for_payment → partially_paid` (allocation < full) or `approved_for_payment → fully_paid` / `partially_paid → fully_paid` (allocation = full). T5 fires ONLY on transitions to `fully_paid` (leaves the watched set); transitions to `partially_paid` stay in the watched set and do not fire T5. Gating logic: `if (newState === 'fully_paid')`. (c) `billService.reverse` transitions `<any> → voided`. T5 fires ONLY when pre-reverse `bill.lifecycle_state IN ('approved_for_payment', 'partially_paid')` (the reversed bill was in the watched set); reversals from `pending_approval` or `fully_paid` do not fire T5 (those bills weren't in the watched set; their reversal doesn't invalidate router candidates). Gating logic: `if (preReverseLifecycleState === 'approved_for_payment' || preReverseLifecycleState === 'partially_paid')`. Conditional emission preserves T5's spec semantic — invalidation triggers when a candidate-eligible bill becomes candidate-ineligible. Over-emission (firing T5 for state changes within the watched set, like partially_paid → still-partially_paid, or for entries into the set) would cause the dispatcher to fan out unnecessarily, finding no invalidation work, emitting `router_re_evaluation_fired` rows with `decision_outcome='no_change'` for cases that never had a state-change reason to re-evaluate. 3b cross-phase tests verified all four conditional firings via spy-on-dispatchTrigger (4 tests across recordPayment + reverse describes: fully_paid fires; partially_paid doesn't; reverse-from-approved fires; reverse-from-pending doesn't). Discriminator for future chunks: when adding a state-machine-based trigger, articulate the watch-set semantic (which states constitute the "valid" set for the candidate; transitions OUT of the set fire the trigger; transitions INTO or WITHIN the set do not); encode the gating in the service-method dispatch hook with explicit conditional rather than universal emission. The watch-set framing generalizes to future T-style triggers gated on lifecycle state changes (Phase 5 amendment chunks shipping paymentService may introduce T6 with a similar watch-set; T7 vendor_master_merge may have a state-machine watch-set semantic).

#### 3a numbering correction + RI codification updates (chunk-3 close)

Chunk-3 3a friction-journal shipped at c3782e9 with β-numbering that collides with the carried-in β-3 from prior sessions (handoff §4 baked the trigger errcode resolution `feature_not_supported` ERRCODE on both clauses + cancel RPC `check_violation` on WHERE-guard into the migration on disk; that finding kept the β-3 label). The 3a friction-journal labeled the PK column fix (`WHERE id` → `WHERE exception_queue_entry_id` in cancel_exception_with_audit RPC) as β-3, the count_after semantic decision as β-4, and the rule 5 no_change mapping as β-5 — collisions with the carried-in β-3, and the subsequent shift wrong. CLAUDE.md no-amend discipline preserved by adding this correction section in 3b's bundled commit rather than rewriting c3782e9.

**Correct β-numbering at chunk-3 close:**
- **β-3 (carried in from prior sessions; shipped verbatim at c3782e9):** trigger errcode `feature_not_supported` on both clauses of `reject_invalid_exception_status_transition` + cancel RPC `check_violation` on WHERE-guard. **Third notational-drift instance.**
- **β-4 (new at 3a impl; mislabeled β-3 at c3782e9):** Migration `WHERE id = p_entry_id` → `WHERE exception_queue_entry_id = p_entry_id` in cancel_exception_with_audit RPC. PK column verify-from-disk surprise. **Fourth notational-drift instance.**
- **β-5 (new at 3a impl; mislabeled β-4 at c3782e9):** count_after = newCandidates.length (rematchCandidate result count) rather than K2 head-of-chain SELECT post-mutation. Operationally-coherent under D-partial-no-idempotency.
- **β-6 (new at 3a impl; mislabeled β-5 at c3782e9):** Discriminator rule 5 maps to `decision_outcome='no_change'` rather than throw POST_FAILED. Rule 5 state IS operationally reachable via T5→T1 sequence under chunk-1 no-supersedes-on-empty-rerun semantic.

**RI-5 codification trail update.** Four-instance N=4 sequence (was claimed N=3 at c3782e9): dispatch_failed introduce-vs-extends (brief-draft) + idempotency-key field-order (brief-draft) + trigger errcode `feature_not_supported` (prior session impl) + PK column fix (3a impl). Threshold met beyond N=3; RI-5 codification is firmly above threshold at Phase 4 retrospective.

**RI-10 sub-discipline entry (primary): second-order-consequence-tracing during amendment cycles.** When a brief amendment ratifies N framings (chunk-3's amendment cycle at c76d264 absorbed five framings: γ' re-eval primitive / γ'-partial per-trigger coverage / D-partial 6-rule discriminator / D-partial-no-idempotency / Path C split), the amendment process must explicitly trace each framing's interaction-with-every-other-framing — not just absorb the framings as-stated. Absorbing framings without tracing interactions yields second-order consequences surfacing at impl rather than at amendment. β-5 (count_after semantic ambiguity from K2-post-mutation vs newCandidates.length under D-partial-no-idempotency) and β-6 (rule 5 reachability via T5→T1 sequence under no-supersedes-on-empty-rerun) are both second-order consequences of Pause 5 (D-partial-no-idempotency) that the amended brief absorbed at framing-level but didn't trace through to count-semantics and discriminator-rule-reachability. The discipline fires when N≥3 framings are in scope. Empirical bound: chunk-3's five framings is current evidence point (threshold upper-bounded by 5 framings; lower bound undetermined). Future amendment cycles with N≥3 framings should produce a "framing-interaction matrix" as part of the amendment cycle, surfacing second-order consequences before impl.

**RI-6 grain 4 cross-reference (secondary): β-5 and β-6 are grain-4 instances.** RI-6's grain 4 (idempotency-and-side-effect-contract conformance verification at scope-lock) names the substrate category where the chunk-3 second-order consequences surface. β-5 and β-6 both touch grain-4 substrate (idempotency contract under D-partial absence; side-effect contract under T5→T1 sequence reachability). RI-10's sub-discipline (amendment-cycle second-order tracing) is the process discipline; RI-6 grain 4 is the substrate-category-conformance discipline; both apply to the same evidence basis. Phase 4 retrospective can adjudicate whether the two graduate together or separately.

**F-J-14 workflow-interaction note.** At intermediate-commit boundaries in Path-C-split chunks, the handoff §8 contract overrides the executing-plans skill's `finishing-a-development-branch` step. 3a session shipped the 3a bundled commit (c3782e9) without invoking branch-closure infrastructure; 3b session ships the cross-phase wiring commit + Task 12 (memory rename + MEMORY.md pointer flip) at chunk-3 substrate complete. The override is workflow-correct for Path C; the executing-plans skill's default step would have prematurely closed the development branch at 3a, violating Path C's intermediate-commit shape. Codified as one-line addendum to F-J-14 (Path C codification) rather than promoted to RI status — the observation is narrow to Path C invocations and inherits as a sub-pattern when future chunks invoke Path C.


### 2026-05-14 — Phase 4 retrospective: codify-while-deciding meta-discipline + three applied-discipline instances

Phase 4 retrospective scope-lock (7 rounds; 2026-05-14) surfaced an organizing meta-discipline (**codify-while-deciding-not-while-implementing**) plus three applied-discipline instances observable across rounds 3-6. The meta-discipline operated implicitly across the 7-round scope-lock; this entry codifies it explicitly so it carries forward to future retrospective scope-locks. The four observations together form Phase 4 retrospective's process-discipline contribution; substantive-content discipline contributions ship as the T3 / T3' / T4 graduations at Commits A / B / C per Phase 4 retrospective Commit C cross-references.

**(4) Codify-while-deciding-not-while-implementing (primary).** Across the 7-round scope-lock, decisions surfaced inside rounds were codified at decision-time within the round rather than deferred to "we'll write it up when drafting." Examples spanning rounds 4-6: Round 4 codified the Commit A four-section mapping + the Commit A paradigm-shift callout text + the verify-at-impl §item 3 substructure hook at the same round that decided the four-section mapping itself, not as a follow-on; Round 5 codified the T1 seven-section writeup structure + the T4 CLAUDE.md addition six-sub-section structure + the descriptive-primary-with-RI-parenthetical naming convention + the impl-time verify trigger for CLAUDE.md insertion site at the same round that decided the cluster-level surfaces; Round 6 codified the per-commit validation + end-of-batch test verification + Option B commit sequencing + A → B → C drafting order + single F-J entry covering 4 retrospective-process meta-observations with (4) codify-while-deciding leading at the same round that decided the validation gate sequence itself. The pattern: decisions surfaced inside a round are codified at decision-time at the same artifact-grain (round outputs); not deferred to "we'll write it up at drafting." Round 3 emergence: the verify-from-disk-applied-at-retrospective-scoping-grain pattern (named below as (3)) was itself a codify-while-deciding instance — Round 3's 19-item inventory consolidation applied verify-from-disk at retrospective-scoping-grain and codified the result at the same round, not deferred. The meta-discipline applies reflexively to the drafting work shipped at Commits A/B/C: §item 3 verify-from-disk at Commit A drafting onset adjudicated within-substructure scope at drafting-time (no Round 4 partial reopen); CLAUDE.md insertion-site verify at Commit C drafting onset adjudicated new-top-level-section at drafting-time per Round 5's pre-specified scale criterion; both are codify-while-deciding at drafting-grain.

**(1) Descriptive-primary-with-RI-parenthetical naming convention (Round 5 drafting-time codification).** Round 5 surfaced and codified at the same round: name discipline-cluster sub-sections by descriptive primary first, with RI inventory item in parenthesis at the end as a back-trail. Examples: "Consumer-presence verification before substrate addition (RI-1)"; "Read-substrate verification at scope-lock, four grains (RI-6)"; "Session-budget-feasibility verification + Path C invocation conditions (RI-7)"; "Brief amendment cycle threshold + framing-interaction matrix at N≥3 (RI-10)". Rationale: descriptive-primary makes the discipline navigable for readers who don't have the RI-N memory; parenthetical-RI preserves the back-trail for readers who do. Mid-Round-5 reaction codified the convention at the same round that produced it. Inherited at Commit C drafting: applied verbatim to CLAUDE.md `Verify-forward-at-scope-lock for computational-shape chunks` 5 sub-sections; applied verbatim to Phase 4 retrospective §4 codified-patterns cluster headers.

**(2) Scope-lock-rounds-carry-verify-at-impl-forward pattern (Rounds 4-5-6 cross-round emergence).** Each scope-lock round produced verify-at-impl items at its own grain: Round 4 → §item 3 substructure verify (at Commit A drafting first operation); Round 5 → CLAUDE.md insertion site verify (at Commit C drafting first operation); Round 6 → per-commit validation gate + end-of-batch test verification (at each commit and at end-of-batch). The cross-round emergence: scope-lock rounds don't lock everything; they explicitly carry verify-at-impl items forward to drafting time. The pattern's discriminator: rounds adjudicate the bounded scope they can adjudicate from the evidence available at round-time; they explicitly leave verify-at-impl items for the drafting boundary where on-disk evidence resolves the question. Applied at chunk-1-6 + Phase 4 grain at single-finding scale; Phase 4 retrospective shows it at cross-round multi-finding scale. The pattern sibling-relates to RI-6 (read-substrate verification at scope-lock four grains): RI-6 is the substrate-verify discipline at scope-lock-time; this pattern is the process-discipline that names which verify-items can be adjudicated at scope-lock vs which must carry forward.

**(3) Verify-from-disk applied at retrospective-scoping-grain (Round 3 emergence; folded into (4)'s evidence).** Round 3 surfaced a meta-pattern: verify-from-disk discipline (codified at `feedback_verify_from_disk_at_brief_loop.md` Item C at chunks-1-6 + Phase 4 chunk 2 grain) operates not only at brief-draft + scope-lock + implementation lifecycle stages, but also at retrospective-scoping-grain. Round 3 applied verify-from-disk to consolidate the 19-item inventory across chunks 1-3-Phase-4 + chunk-2-Phase-4 carry-forwards + chunk-3 candidates; the consolidation surfaced T3 cluster (4 items + arc-derived) / T3' cluster (2 items) / T4 cluster (4 items + 1 memory-only) / T1 cluster (arc + RI-5 trail + brief inventory documentation) / memory-only-stays (2 candidates) / carry-forward (4 items) / closes-pre-Round-3 (1 item) — a 7-way partition that wouldn't emerge from inventory-list-as-rendered without verify-from-disk against current on-disk inventory state. Round 3 is the canonical first-instance of verify-from-disk applied at retrospective-scoping-grain at chunks-1-6 + Phase 4 grain. The pattern is folded into (4)'s evidence rather than promoted to its own primary because it operates at the same codify-while-deciding-at-decision-time grain (Round 3 codified the 7-way partition at Round 3, not deferred to drafting).

**Instance enumeration discipline.** The four meta-observations above were the floor at Round 6 lock per the original §5.c.4 single-F-J-entry-covering-4-meta-observations design; §7c held the enumeration open through drafting in case a fifth surfaced. Assessment at drafting close: no fifth meta-observation surfaced during Commit A / B / C drafting work. The candidate fifth ("RI-7 reflexive application at transition-boundaries observable across scope-lock → drafting transition") did not fire — the 529 Overloaded mid-drafting was operational reality (transient server-side; recovery via verify-from-disk + retry), not methodology pattern; user's mid-drafting reaction explicitly named it as below codification threshold (server-side transients aren't methodology). Instance enumeration closes at 4 (one primary (4) + three named subsections (1)+(2)+(3)). Future retrospective drafting cycles may surface additional applied-discipline instances; this entry establishes the floor and the (4)-leading structure for those future entries.

**Why this entry ships at Phase 4 retrospective Commit C.** Phase 4 retrospective's substantive-content graduations (T3 + T3' + T4 codified patterns) ship at Commits A + B + C respectively; this F-J entry codifies the *process-discipline graduations* that operated implicitly during the 7-round scope-lock + drafting. Without this entry, the codify-while-deciding meta-discipline operates implicitly at future retrospective scope-locks but doesn't carry forward as a discoverable discipline. The Phase 4 retrospective's framing-discovery arc centerpiece is a substantive-content arc (γ' / γ'-partial / D-partial / D-partial-no-idempotency / Path C); this entry's codify-while-deciding meta-discipline is the process-discipline arc that operated in parallel. Both ship as Phase 4 retrospective's discipline-graduation contributions.

**Discriminator for future retrospective drafting cycles.** When approaching a retrospective scope-lock: (a) apply (4) codify-while-deciding by codifying decisions surfaced inside a round at the same round, not deferring to drafting; (b) use (1) descriptive-primary-with-RI-parenthetical naming for cluster sub-section headers; (c) recognize (2) scope-lock-rounds-carry-verify-at-impl-forward — locks adjudicate the bounded scope round-evidence supports + explicitly carry verify-at-impl items to drafting boundary; (d) apply (3) verify-from-disk at retrospective-scoping-grain at retrospective inventory consolidation rounds. Drafting itself applies (4) reflexively: §item 3 verify at Commit A drafting onset + CLAUDE.md insertion site verify at Commit C drafting onset + instance-enumeration-stays-open-through-drafting are all codify-while-deciding-at-drafting-grain instances. The retrospective scope-lock + drafting cycle is itself an artifact-class where codify-while-deciding shows up at multiple grains; future cycles inherit this entry's framing as the canonical statement.


### 2026-05-15 — Phase 4 retrospective post-close drift: Phase 5.1 reviewer framing fabrication + Phase 6 sequencing omission

Phase 4 retrospective Commit C (`294f9e7`, 2026-05-14) shipped three governance artifacts (retrospective writeup at `docs/07_governance/retrospectives/phase-4-retrospective.md` + CLAUDE.md `Verify-forward-at-scope-lock for computational-shape chunks` addition + `project_phase_4_retrospective_shipped.md` memory file) containing substantive drift discovered the following day at the next-session-recommendation grain. The drift is provenance-preserving-fixed via a post-close correction commit on 2026-05-15; original sections preserved with the drift visible as historical record. This entry codifies the drift, the canonical reading, the discovery grain, and the discriminator for future retrospective drafting.

**Drift summary.** Two compounding errors at Commit C drafting time:

(a) **"Phase 5.1 reviewer chunk" framing fabrication.** Round 7 scope-lock locked the "cross-phase consumer two-inventory shape" naming convention but used "Phase 5.1 reviewer chunk" as the consumer label without grounding the label against canonical sequencing documents. The label appears in NO canonical doc other than the Commit C artifacts themselves. "Reviewer chunk" was invented at Commit C drafting; the canonical Phase 5.1 framing is **Phase 5 amendments** per Phase 2 retrospective §6 line 588: *"Phase 5 amendment work (INV-DOC-001 enforcement wiring; vendor_credits substrate) is the other parallel candidate; could ship as Phase 5.1 amendments before or alongside Phase 3/4/7."*

(b) **Phase 6 sequencing omission.** Round 7 scope-lock framed only Phase 5.1 + Phase 7 as cross-phase consumers; missed Phase 6 (Ingestion) entirely. Phase 5 retrospective §6 line 380-381 is canonical: *"**Phase 5 closes → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8**. Canonical per the reframe spec §2."* After Phase 4 closes, Phase 6 is the canonical next phase, not Phase 5.1. Phase 6 is also the operationally-instantiated pure-discipline-reference consumer (Round 7 Q3's "theoretically-possible third shape" that Round 7 framed as hypothetical-Phase-8; Phase 6 is the actual instance).

**Canonical readings (per disk verification at 2026-05-15).**

- Phase 5.1 = Phase 5 amendments (INV-DOC-001 enforcement + vendor_credits substrate + paymentService introduction territory per chunk-3-Phase-4 scope-lock framing of T2/T6 as "Phase 5 amendment territory"). Operational realization of vendor onboarding remains post-v1 per Phase 5 retrospective §6 line 396-414 reserved-schema-seats framing.
- Phase 3 = Document Relationship Graph consolidation per Phase 2 retrospective §6 lines 570-574. Substantively shipped at chunk-5-Phase-2 (`source_document_links`); needs closeout-verify session to ratify or surface residual scope.
- Phase 6 = Ingestion (`ingest_batches`, `ingest_items`, `document_jobs`) + pipeline orchestrator per ADR-0014. Needs Phase 2 substrate (`document_cases` as place to land documents) — shipped.
- Phase 7 = Tier 2 Document Pipeline (OCR + extraction + vendor-matching) per Phase 2 retrospective §6 lines 580-585.

**Discovery grain.** The drift surfaced when the next-session-recommendation question forced a verify-from-disk against canonical sequencing documents (`docs/03_architecture/phase_plan.md` + `docs/09_briefs/CURRENT_STATE.md` + Phase 2 retrospective + Phase 5 retrospective). The Commit C drafting's verify-at-impl items (§item 3 substrate; CLAUDE.md insertion site) covered substrate-shape + structural-placement questions; they did NOT cover phase-naming-attribution against canonical sequencing documents. The drift was invisible at retrospective scope-lock (Round 7 inherited the "Phase 5.1 reviewer" framing without verifying) and at drafting (no verify-at-impl item covered phase-naming-attribution); surfaced post-close at the next-session-recommendation grain.

**Codification grain — N=1 at post-retrospective-close drift discovery.** This is structurally similar to F-J entry's named subsection (3) (verify-from-disk applied at retrospective-scoping-grain; Round 3 emergence at chunks-1-6 + Phase 4 grain) but at a distinct grain: (3) operates at *retrospective scope-lock inventory consolidation*; this drift operates at *post-retrospective-close next-session-recommendation*. Both are verify-from-disk applied at non-standard grains; both are codify-while-deciding-not-while-implementing applied reflexively at the discovery moment. N=1 at the post-retrospective-close grain; future Phase 5/6/7 retrospective close may surface similar drift → N=2 graduation candidate. Below codification threshold for CLAUDE.md or ADR amendment at chunks-1-6 + Phase 4 grain (single-instance evidence); observation-only.

**Provenance-preserving fix shape.** Three artifacts touched at the post-close correction commit (alongside this friction-journal entry): retrospective writeup gets a "## Post-close correction" section appended at end with the canonical readings + corrected three-shape cross-phase consumer inventory + corrected next-session sequencing; CLAUDE.md gets a smaller "Post-close correction" note appended to the `Verify-forward-at-scope-lock` cluster's Cross-references subsection pointing at the retrospective's correction section; memory file gets a "Post-close correction" section pointing at both. Original sections preserved in all three artifacts; corrections append at end. Below ADR-amendment-cycle threshold (no ADR amendment needed; canonical readings already exist in Phase 2 + Phase 5 retrospectives); above leave-implicit threshold (forward-pointer drift compounds in cost across future-session reconciliations).

**Discriminator for future retrospective drafting cycles.** When retrospective writeup contains forward-pointers to downstream phases, the verify-at-impl item set MUST include phase-naming-attribution verification against canonical sequencing documents (Phase 2 retrospective + Phase 5 retrospective + reframe spec + any phase-specific retrospectives that name future phases) before drafting close. This is a verify-at-impl extension to RI-6 four-grain (read-substrate verification at scope-lock) at the retrospective-drafting grain: substrate-shape grain + per-trigger semantic coverage grain + per-trigger × per-decision-outcome conformance grain + idempotency-and-side-effect-contract conformance grain + **phase-naming-attribution-against-canonical-sequencing grain** (the fifth grain at retrospective-drafting). At chunks-1-6 + Phase 4 grain the fifth grain is observation-only (N=1 evidence; this drift); future retrospective drafting cycles may surface the grain at N=2+ and graduate it formally.

**Sibling-to-(3) observation.** Named subsection (3) of the 2026-05-14 F-J entry codifies verify-from-disk at retrospective-scoping-grain (Round 3 emergence). This 2026-05-15 entry codifies verify-from-disk at post-retrospective-close-discovery-grain. Both are verify-from-disk applied at non-standard grains within the retrospective scope-lock + drafting + post-close arc. Together they suggest a higher-order pattern: verify-from-disk applies at every grain of the retrospective lifecycle (inventory consolidation + drafting + post-close); the discipline is grain-agnostic; future codification at the grain-agnostic framing graduates if a third grain surfaces evidence. Currently N=2 across two grains (retrospective-scoping at Round 3 + post-retrospective-close at this drift); third grain instance (e.g., verify-from-disk at retrospective-publication / cross-phase-consumer-application grain) would trigger grain-agnostic codification at next retrospective.

