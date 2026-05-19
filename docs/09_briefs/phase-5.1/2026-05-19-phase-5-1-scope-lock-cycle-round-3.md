# Phase 5.1 Amendments — Scope-Lock Cycle Round 3

**Session:** 17
**Date:** 2026-05-19
**Branch:** `staging`
**HEAD at session-onset:** `2560ef6` ("docs(phase-5.1): Round 2 walk (Sub-Q2 + Sub-Q4 + Sub-Q4.5 + Sub-Q1 narrowing)")
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green; full vitest trusted at 1148/1148 per directive baseline.
**Predecessor:** Round 2 close at `2560ef6` (2026-05-19 earlier); Round 1 at `72a40bf` (2026-05-17). Two local-unpushed Phase 5.1 commits ahead of `origin/staging`.

---

## §1 — Preamble + Round 2 inheritance + locks

### §1.1 Round 2 close summary

Round 2 walked Sub-Q2 (paymentService introduction) + Sub-Q4 (INV-DOC-001 two-artifact obligation) + Sub-Q4.5 (inline-vs-evidence-service) + Sub-Q1 narrowing + Sub-Q5 ordering surface. Round 2 also locked Sub-Q7 (`phase-5-1-retrospective.md` standalone per Phase 6.5 7.α precedent). Volume forecast refined to ~1400-2520 LOC total Phase 5.1 (INV-DOC-001 ~350-680 + paymentService ~720-1190 + vendor_credits β ~330-650). Round 2 closed at `2560ef6` with three sub-questions provisionally leaned for Round 3 lock.

### §1.2 Three locks absorbed at Round 3 preamble

Per founder + brainstorming-side ratification of Round 2 leans:

**Sub-Q2 = 2.β LOCKED** (partial extraction).
- paymentService.record() ships as payment-flow primitive — atomicity boundary + T2 dispatcher activation hook + post-commit emission.
- billService.recordPayment retains AP-domain orchestration — bill state transitions + lifecycle_state update + bill-grain audit + T5 dispatch.
- T2 bidirectional activation per Round 2 Finding 4: emit at paymentService.record() + admit T2_new_payment branch in `DispatchTriggerInputSchema` discriminated union (currently 5 v1-active branches → 6 post-Phase-5.1).
- No 2.α (consumer-side migration cost disproportionate to v1 benefit per Round 2 §2.2 substrate-evidence-grounded enumeration: ~5 substrate touchpoints + N test files).
- No 2.γ (inversion-of-control; AP-domain knowledge would leak into payment primitive).

**Sub-Q4 = Option (i) single commit LOCKED** (atomic INV-DOC-001 graduation).
- Single commit ships both artifact (a) leaf registration + artifact (b) enforcement code.
- T3 grain: ADR-0011 §15 reservation graduation reference.
- T2 grain: ledger_truth_model.md leaf + invariants.md rollup + control_matrix.md row.
- T1 grain: billService.post() Layer 2 enforcement code + integration tests.
- invariants.md bidirectional reachability statement updates from "20 distinct INV-IDs (14 Layer 1a, 6 Layer 2, 0 Layer 1b)" → "21 distinct (14 Layer 1a, 7 Layer 2, 0 Layer 1b)"; symmetric-difference verification command runs at Phase 5.1 close.

**Sub-Q4.5 = 4.5.α LOCKED** (inline at billService.post() with retrospective flag).
- INV-DOC-001 enforcement code lives inline in billService.post(); no evidence-service introduction at Phase 5.1.
- `apps/web/src/services/evidence/` stays `.gitkeep`-only.
- Phase 5.1 retrospective explicit statement: evidence-service is named-future-activation pending N≥2 consumer-presence per RI-1.

### §1.3 Refinements A + B banking notes

**Refinement A — Consumer enumeration accuracy at Round 3.** Round 3 cites Round 2 §2.2 verify-from-disk count (~5 substrate touchpoints + N test files) as the substrate-evidence-grounded consumer enumeration. The "30-100+ callers" framing from brainstorming-side adjudication is estimate-inflation (~3-10× inflated); banked as observation, **not added to candidate (c) catalog** at Round 3 grain. Round 3 brief-grade work cites verify-from-disk count.

**Refinement B — ADR-0011 §15 editorial clarification cluster.** Two findings carry forward as potential ADR-0011 §15 editorial-clarification candidates (NOT scope-changing; bank for retrospective):
- **"Adjacent commit paths" framing over-broad** (Round 2 §3.b.v) — substrate has single firing site at billService.post().
- **"primary_invoice (or 'primary')" cites non-existent enum value** (NEW at Round 3 §3.b) — `primary` is NOT in the source_document_links link_role enum per ADR-0016 §2; only `primary_invoice` exists. The "(or 'primary')" framing in ADR-0011 §15:850 has no v1-active enum referent.

Both editorial clarification candidates bank as Phase 5.1 retrospective drafting observations. Catalog placement (single ADR-authoring grain N=2 vs split with N=1 each) adjudicates at retrospective drafting. Candidate (c) numbered catalog stays at session-onset count + Round 3 session-prompt-authoring instances.

### §1.4 Session-onset divergences — candidate (c) N=17 + N=18 + N=19

Three path divergences surfaced at Round 3 verify-from-disk:

**Divergence (a) — ServiceErrorCode path correction. (N=17)** Directive §15: "Likely at `apps/web/src/shared/types/serviceError.ts` or `apps/web/src/services/_helpers/serviceError.ts`." Actual: `apps/web/src/services/errors/ServiceError.ts`. Both directive guesses wrong (even with "Likely" hedging, two-wrong-guesses constitutes session-prompt-authoring drift). Banked as candidate (c) N=17 at session-prompt-authoring grain.

**Divergence (b) — DispatchTriggerInputSchema location. (N=18)** Directive §17: "Likely at `apps/web/src/shared/schemas/document-platform/`." The directory exists ✓ but the schema is co-located inside `documentRelationshipCandidate.schema.ts:418` (not a standalone file). Directive cited the parent directory generically; substrate reality is one-file-per-domain-substrate convention. Also: directive §14 "documentJob type at `apps/web/src/shared/types/documentJob.ts`" — file doesn't exist; document-platform substrate lives at `apps/web/src/shared/schemas/document-platform/` (and `apps/web/src/services/document-platform/`), not in a documentJob-named file. Banked as candidate (c) N=18 at session-prompt-authoring grain (two-related-path-guesses-wrong consolidated as single instance).

**Divergence (c) — billService integration test path. (N=19)** Directive §16: "`apps/web/tests/integration/spend/billService/`." Actual: `apps/web/tests/integration/` is flat-structured (~hundreds of `.test.ts` files at root level; no `spend/` subdirectory; no `billService/` subdirectory). Existing bill tests at flat path: `billPostBill.test.ts`, `billApproveForPayment.test.ts`, `billRecordPayment.test.ts`, `billReverse.test.ts`, `billEcA1.test.ts`, `billEcA2.test.ts`. Naming convention: `bill[Action].test.ts` flat. Banked as candidate (c) N=19 at session-prompt-authoring grain.

**Updated candidate (c) catalog observation:**
- Catalog **N=16 → N=19 at Round 3 onset.**
- Brainstorming-arc grain at **N=13 of N=19** (highest-firing grain; N=10 from Round 2 + N=17/18/19 new this Round 3).
- Retrospective-authoring grain at N=1 (fourth-grain candidate; Phase 5.1 retrospective writeup grain is future N=2 graduation candidate).
- ADR-authoring grain candidate at N=0 numbered + N=2 banked-for-retrospective (Refinement B cluster — "adjacent commit paths" + "primary_invoice or 'primary'"). Fifth-grain candidate if codification at Phase 5.1 retrospective drafting picks split-sub-grain disposition.

### §1.5 Round 3 walk structure

| § | Walk | Primary outputs |
|---|---|---|
| §1 | Preamble + Round 2 inheritance + locks | (this section) |
| §2 | Sub-Q5 chunk ordering walk + Round 4 lock target | 5.1a → 5.1b canonical + alternative orderings |
| §3 | Sub-Q4 sub-decision walks (4-a/b/c/d) | Round 3 leans per sub-decision |
| §4 | Sub-Q4 sub-shape walks (error code / schema / tests) | Round 3 lean per sub-shape |
| §5 | Round 3 close + Round 4 scope projection | Sub-Q lock summary + Round 4 prompt inputs |

### §1.6 Canonical cross-references (Round 2 + Round 3 inputs)

Inherited from Round 2 § 1.5 + Round 3 substrate touchpoints:

- **PostBillInputSchema** at `apps/web/src/shared/schemas/spend/bill.schema.ts:72-91` (132-line file; 3-layer ADR-0010 discipline) — Sub-Q4-shape-2 extension site.
- **ServiceErrorCode union** at `apps/web/src/services/errors/ServiceError.ts:3-108` — Sub-Q4-shape-1 extension site. Inherits Phase 2/4 explicit-named-codes convention (LINKED_ENTITY_NOT_FOUND, EXCEPTION_ALREADY_OPEN, EXCEPTION_ALREADY_CANCELLED; verbatim ADR-cited codes for ADR-0013 storage).
- **DispatchTriggerInputSchema** at `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts:418-455` — Sub-Q2 T2 branch extension site (paymentService chunk; chunk 5.1b).
- **ADR-0016 §2** at `docs/07_governance/adr/0016-document-relationship-graph.md:341-433` — link_role enum v1-active subset = 4 values (`primary_invoice`, `payment_evidence`, `receipt`, `supporting`); Sub-Q4-b adjudication source.
- **ADR-0016 §5** at `docs/07_governance/adr/0016-document-relationship-graph.md:705-840` (table at line 763+) — cascade behavior per linked_entity_type; Sub-Q4-c adjudication source (link_status flip semantics).
- **Existing bill integration tests** at `apps/web/tests/integration/bill*.test.ts` (flat) — Sub-Q4-shape-3 placement convention.

---

## §2 — Sub-Q5 chunk ordering walk + Round 4 lock target

### §2.1 Canonical 5.1a → 5.1b ordering (Round 2 surface)

Round 2 §5.3 surfaced 5.1a → 5.1b as the natural ordering under Sub-Q1 1.γ-i decomposition. Round 3 walks the canonical case + alternative orderings:

**5.1a (chunk one) — INV-DOC-001 + vendor_credits β substrate amendments.**
- INV-DOC-001 leaf registration (ledger_truth_model.md + invariants.md + control_matrix.md) + Layer 2 enforcement at billService.post() + integration tests (~350-680 LOC).
- vendor_credits + vendor_credit_applications migration + ADR-0016 third amendment + linked_entity_type CHECK + Zod schema widen (~330-650 LOC).
- Combined: ~680-1330 LOC. Single-session-feasible per RI-7 ceiling.

**5.1b (chunk two) — paymentService introduction.**
- Greenfield paymentService.ts (Pattern B unwrapped + header doc + Zod schema + service object) + T2 dispatcher activation (emit hook at paymentService.record() + DispatchTriggerInputSchema discriminated union branch addition) + billService.recordPayment refactor to delegate payment-flow steps to paymentService.record() + integration tests (~720-1190 LOC).
- Single-session-feasible per RI-7 ceiling.

### §2.2 Alternative ordering walks

**Alternative (i) — 5.1b → 5.1a (paymentService first).**

Reasoning if warranted: paymentService introduction unblocks some downstream dependency. **Substrate-evidence check at Round 3:**
- INV-DOC-001 enforcement at billService.post() has NO dependency on paymentService.record(). The two services act on distinct grain (bill creation vs payment recording).
- vendor_credits β substrate has NO dependency on paymentService.record().
- paymentService.record() has NO dependency on INV-DOC-001 (paymentService operates on already-validated posted bills; INV-DOC-001 fires at bill post time).
- paymentService.record() has NO dependency on vendor_credits β substrate.

No substrate-side dependency forces 5.1b → 5.1a. Alternative (i) rejected.

**Alternative (ii) — Parallel chunks (any order; no inter-chunk dependency).**

Both chunks are independent. Parallel-feasibility check passes per dependency analysis above. Practical consideration: scope-lock cycle precedent (Phase 2.5 + Phase 6.5) sequenced commits; no parallel-chunk precedent in the project history. Parallel chunks would require two simultaneous brief-drafting sessions; sequenced chunks align with single-session-execute discipline. Alternative (ii) acceptable-but-no-precedent; defer to sequenced unless founder operational need warrants parallel.

**Alternative (iii) — 5.1a-split or 5.1b-split (sub-chunking within a chunk).**

Sub-chunking would split chunk 5.1a into 5.1a-i (INV-DOC-001) + 5.1a-ii (vendor_credits β), or chunk 5.1b into 5.1b-i (paymentService greenfield) + 5.1b-ii (T2 dispatcher activation). Each sub-chunk is ~330-680 LOC; trivially single-session-feasible.

Substrate-grain analysis:
- 5.1a-split rationale: INV-DOC-001 is Layer 2 enforcement work; vendor_credits β is migration + ADR amendment work. Different review shapes (code review vs ADR review).
- 5.1b-split rationale: paymentService greenfield is service-introduction work; T2 dispatcher activation is schema-extension work. Different substrate touchpoints.

Counter-argument: Sub-Q1 1.γ-i picked two-chunk decomposition specifically because the chunks are substrate-shape coherent at chunk grain. Sub-chunking re-introduces three-or-four-chunk shape, drifting toward Sub-Q1 1.β (full decomposition). Alternative (iii) rejected; Sub-Q1 = 1.γ-i (two-chunk) is the locked decomposition.

### §2.3 Round 3 lean target: 5.1a → 5.1b sequenced

**Provisional lean: 5.1a → 5.1b sequenced ordering.**

**Reasons:**

1. **T3/T2/T1 surface-precedence canonical.** chunk 5.1a is T3/T2-grade work (governance documentation: leaf registration, ADR amendment); chunk 5.1b is T1-grade work (service-introduction implementation). T3/T2 before T1 per Phase 6.5 retrospective Commit B precedent + general surface-precedence discipline.
2. **Risk-grade ordering.** chunk 5.1a (substrate amendments) is lower-risk per substrate-shape-coherence; chunk 5.1b (greenfield service introduction + T2 dispatcher activation) is higher-risk per greenfield + cross-substrate-wire. Ship lower-risk first.
3. **Substrate-coherence.** chunk 5.1a touches Phase 5 substrate (existing migrations); chunk 5.1b touches Phase 4 substrate (T2 dispatcher slot) + introduces new service. Phase-5-substrate-coherence ships first; Phase-4-substrate-consumer-wire ships second.
4. **Founder-review-load distribution.** chunk 5.1a is governance-document-heavy (review by reading docs); chunk 5.1b is code-heavy (review by reading code). Sequenced ordering distributes founder review-load across sessions.

**Path C invocation evaluation (final at Round 3):** Sub-Q1 1.γ-i is two-chunk; both chunks under RI-7 single-session ceiling. **Path C invocation does NOT fire prospectively.** Reactive Path C availability through implementation per F-J-14 mid-impl-reactive grain (third grain in three-grain catalog); reactive invocation if mid-implementation surface unexpected complexity.

**Round 4 lock target.** Sub-Q5 = 5.1a → 5.1b sequenced at Round 4 lock with Sub-Q1 = 1.γ-i. Inheritance: both locks fire jointly at Round 4 per cycle precedent.

---

## §3 — Sub-Q4 sub-decision walks (4-a/b/c/d)

### §3.a Sub-Q4-a — per-bill vs per-case INV-DOC-001 enforcement granularity

**Question.** Does INV-DOC-001 fire at per-bill grain (at billService.post() for each bill row) or per-case grain (at document_cases case-grain, before bill posting)?

**Substrate-side evidence:**

- ADR-0011 §15:848-850 framing: "Every committed bill / case has at least one `source_document_links` row..." — wording suggests per-bill OR per-case grain is acceptable; ADR doesn't pin.
- ADR-0016 §1 linked_entity_type v1-active set: 6 values (`bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`). **`document_case` is NOT a linked_entity_type value** at v1-active. Per-case enforcement would require either (a) extending linked_entity_type to include `document_case` (out of Phase 5.1 scope per Sub-Q3 β disposition + Layer 2 narrowing), OR (b) using a different substrate (document_cases table directly without source_document_links).
- Sub-Q2 = 2.β + Sub-Q4 = Option (i) locks Phase 5.1 enforcement at billService.post() per ADR-0011 §15 Layer 2 narrowing. Per-case enforcement is out-of-scope.

**Disposition options:**

- **4-a.α Per-bill.** INV-DOC-001 fires at billService.post() for each bill row. Check: `linked_entity_type='bill'` + `linked_entity_id=<bill_id>` + `link_role='primary_invoice'` row exists in source_document_links.
- **4-a.β Per-case.** INV-DOC-001 fires at document_cases case-grain. Out-of-scope per substrate-side evidence above.

**Round 3 lean: 4-a.α (per-bill).** Consistent with:
- ADR-0011 §15 Layer 2 narrowing per Round 1 Finding 2 (enforcement at billService.post()).
- Sub-Q4 = Option (i) single commit lock (artifact b: Layer 2 enforcement at billService.post()).
- ADR-0016 §1 linked_entity_type v1-active set (document_case not included; per-case enforcement requires substrate expansion beyond Phase 5.1 scope).
- Phase 6 retro §6.b inheritance (Phase 5.1 scope is single-tier; per-case grain is Phase 6+ document_cases reviewer-side surface design).

**Round 3 lock target.** Sub-Q4-a = 4-a.α LOCKED at Round 3.

### §3.b Sub-Q4-b — link_role accepted set

**Question.** What `link_role` value(s) satisfy INV-DOC-001 "attached primary document"?

**Substrate-side evidence (verify-from-disk at ADR-0016 §2):**

- **Full reserved set:** 27 values (`primary_invoice`, `payment_evidence`, `receipt`, `supporting`, `duplicate_arrival`, `superseded_version`, `vendor_credit_memo`, `vendor_statement_excerpt`, `purchase_order`, `receiving_document`, `retainer_agreement`, `deposit_request`, `bank_statement_excerpt`, `card_statement_excerpt`, `reconciliation_evidence`, `failure_notice`, `customer_invoice_attachment`, `customer_remittance`, `tax_form`, `contract`, `payroll_document`, `asset_purchase_support`, `prior_period_evidence`, `correction_memo`, `controller_override_memo`, `audit_evidence`, `email_thread`).
- **v1 active subset:** 4 values (`primary_invoice`, `payment_evidence`, `receipt`, `supporting`).
- **`primary` is NOT in the enum at all** — neither v1-active nor reserved post-v1. ADR-0011 §15:850 "primary_invoice (or 'primary')" cites a non-existent enum value. **Bank as ADR-0011 §15 editorial clarification candidate** (cluster with Refinement B "adjacent commit paths" framing; both potential ADR amendment at Phase 5.1 retrospective drafting).
- ADR-0016 §2:379 framing on `primary_invoice`: "the dominant invoice PDF for a bill" — canonical primary document link_role for AP-domain bills.

**Disposition options:**

- **4-b.α Singleton.** Accepted set = {`primary_invoice`}. Strict v1; matches ADR-0016 §2 canonical primary-invoice-for-bill framing.
- **4-b.β Two-value.** Accepted set = {`primary_invoice`, `receipt`}. Per ADR-0015 §7 Scenario C (born-paid bundle with standalone receipt), `receipt` may serve as primary evidence for a bill when no separate invoice exists. ADR-0016 §3 pair-validity matrix confirms `(bill, receipt)` is active v1.
- **4-b.γ Broader.** Accepted set = {`primary_invoice`, `receipt`, `supporting`} or wider. Loose; allows secondary evidence to satisfy INV-DOC-001.

**Adjudication inputs:**

- ADR-0011 §15:848-850 spirit: "Every committed bill / case has at least one... `primary_invoice` (or `primary`) `link_role`" — singular "primary_invoice" framing biases toward 4-b.α.
- ADR-0015 §7 Scenario C: standalone receipt as primary evidence biases toward 4-b.β.
- INV-DOC-001 purpose: evidence-completeness for bill commit. The v1 question is whether `receipt` alone (no separate invoice) is sufficient evidence. Per ADR-0015 §7 Scenario C: yes for born-paid bundles.

**Round 3 lean: 4-b.β (two-value singleton-plus-receipt).** Reasons:
- Honors ADR-0015 §7 Scenario C born-paid bundle (standalone receipt as primary evidence).
- Honors ADR-0016 §3 pair-validity matrix `(bill, receipt)` v1-active cell.
- Minimum-viable accepted set that doesn't reject canonical AP-domain v1 workflows.
- Excludes `payment_evidence` (semantically attaches to payment row per ADR-0016 §2, not bill row) and `supporting` (secondary evidence; can't satisfy primary requirement).

**Round 3 lock target.** Sub-Q4-b = 4-b.β LOCKED at Round 3.

**Founder push-back consideration:** if v1 workflow specifically rejects standalone-receipt-as-primary (e.g., controller policy requires explicit invoice for every bill), 4-b.α LOCKS instead. Otherwise 4-b.β.

### §3.c Sub-Q4-c — detach-after-post() handling

**Question.** If a primary document attachment is detached after billService.post() succeeds, does INV-DOC-001 re-fire?

**Substrate-side evidence (verify-from-disk at ADR-0016 §5 + §6):**

- ADR-0016 §6 (lines 843-953) Pre-commit vs post-commit boundary: `source_document_links` is **immutable post-commit** per documentLinkService.create() being the only INSERT path + no UPDATE permission on most columns; only `link_status` may transition (`created → reversed`).
- ADR-0016 §5 (line 763) cascade behavior for `bill` linked_entity_type: bill reversal sets link_status='reversed' (not delete); "the document evidence remains valid (the reversed bill still has its invoice attached for audit purposes)."
- ADR-0011 §16 bill lifecycle immutability: posted bills are immutable except for state transitions; voided is terminal.

**Disposition options:**

- **4-c.α Post-time-only check.** INV-DOC-001 fires once at billService.post(); no re-fire post-commit. If link_status flips to 'reversed' post-bill-reversal, no enforcement re-fire (bill is also reversed; evidence-completeness moot for terminal bill state).
- **4-c.β Lifetime check.** INV-DOC-001 re-fires on any source_document_links change for the bill_id. Requires substrate (e.g., Layer 1 trigger on source_document_links UPDATE/INSERT for bill linked_entity_type; or Layer 2 service-layer hook on documentLinkService.create() + .reverseLinkedEntityLink()).
- **4-c.γ Custom mode.** Hybrid (post-time-only for happy path; lifetime check for specific scenarios like primary detach explicitly).

**Adjudication inputs:**

- ADR-0016 §6 post-commit immutability means primary link CAN'T be deleted (only flipped to 'reversed' via documentLinkService.reverseLinkedEntityLink()). Detach-after-post() in the strict sense (DELETE of primary link row) cannot happen on disk.
- Reversal cascade per ADR-0016 §5: link_status='reversed' is associated with bill reversal; evidence remains attached for audit. The reversed bill itself is in 'voided' terminal state; INV-DOC-001 enforcement re-fire moot.
- If primary link is flipped to 'reversed' WITHOUT corresponding bill reversal (admin override; out-of-band operation): per ADR-0016 §6 + ADR-0011 §16, this is not a v1-supported operation. No substrate path admits it.

**Round 3 lean: 4-c.α (post-time-only check).** Reasons:
- Substrate-side ADR-0016 §6 post-commit immutability means there's no v1 disk path for primary detach to occur outside bill reversal.
- Bill reversal cascades primary link to 'reversed' status (evidence preserved for audit; not deleted); reversed bill is terminal voided state, so re-firing INV-DOC-001 enforcement on a voided bill is semantically inapplicable.
- 4-c.β would require additional substrate (Layer 1 trigger or Layer 2 service hook) that isn't justified by current operational signal; substrate-now-enforcement-later discipline per ADR-0010 applies.
- 4-c.γ is custom complexity without v1 substrate motivation.

**Round 3 lock target.** Sub-Q4-c = 4-c.α LOCKED at Round 3.

**Bank for retrospective.** Lifetime-check substrate is named-future-trigger if (a) operational signal emerges for primary-detach-without-bill-reversal scenarios, OR (b) post-v1 phases (banking domain; AR domain) introduce evidence-completeness invariants where lifetime checks matter (e.g., bank-statement re-attachment workflows).

### §3.d Sub-Q4-d — backfill posture for existing posted bills

**Question.** Does INV-DOC-001 enforcement apply retroactively to existing posted bills (pre-Phase-5.1-active)?

**Substrate-side evidence:**

- Phase 5 shipped bill posting (chunk B5-2) without INV-DOC-001 enforcement at billService.post(). Existing posted bills in the schema may or may not have `primary_invoice` link rows.
- `bills.override_evidence_completeness` column shipped at Phase 5 migration `20240138000000:172` with `DEFAULT false`. Existing bills carry the column value `false`.
- If INV-DOC-001 fires retroactively (e.g., backfill check at Phase 5.1 migration), existing bills without primary_invoice + with `override_evidence_completeness=false` would fail the check.

**Disposition options:**

- **4-d.α Forward-only enforcement.** INV-DOC-001 fires for bills posted post-Phase-5.1-active only. Existing posted bills are exempt by virtue of having posted before the invariant was enforced.
- **4-d.β Forward + retroactive flag-set.** New bills enforce; existing posted bills get `override_evidence_completeness` flipped to `true` at migration time (auto-override for pre-Phase-5.1 bills; documented as "Phase 5.1 migration auto-set per pre-enforcement-era discipline").
- **4-d.γ Forward + audit row backfill.** Same as 4-d.β plus emit `bill_evidence_override_applied` audit row for each pre-Phase-5.1 bill at migration time (audit trail of the auto-override).
- **4-d.δ Forward + backfill rejection.** Existing posted bills without primary_invoice + without manual override get rejected at next mutation (reversal attempt, payment recording, etc.) — retroactive enforcement firing at next-touch grain.

**Adjudication inputs:**

- Phase 6.5 chunk 2 EC1.β v1-default-window-confirm pattern precedent: substrate ships at v1 with forward-only enforcement; UX/edge-case refinement at post-v1 grain.
- ADR-0010 substrate-now-enforcement-later discipline: substrate ships first; enforcement layer narrows to forward-only at v1; lifetime/retroactive enforcement is post-v1 contingent on operational signal.
- Phase 5 shakedown evidence: existing posted bills survived Phase 5 close + Phase 6/6.5 work without primary_invoice link enforcement. Retroactive rejection would invalidate sub-set of existing bills; founder would need to either (a) manually attach primary_invoice for each, OR (b) flip override flag for each.
- Founder operational-load consideration: 4-d.β / 4-d.γ auto-override at migration time avoids manual operator burden; 4-d.δ delays burden to next-touch grain (more spread out but more risk of surprise rejection); 4-d.α makes existing bills exempt without override flag flip (clean but loses audit trail of "this bill predates enforcement").

**Round 3 lean: 4-d.γ (forward + audit row backfill at migration time).** Reasons:
- Auto-override at migration time avoids founder manual operator burden for existing posted bills (Phase 5.1 chunk 5.1a migration includes UPDATE bills SET override_evidence_completeness=true WHERE [no primary_invoice link]).
- Audit row backfill preserves audit trail: each pre-Phase-5.1 bill carries `bill_evidence_override_applied` audit row at migration time, documenting the auto-override.
- Forward-only enforcement at billService.post() for new bills (canonical Sub-Q4-a + 4-c.α path).
- Honors ADR-0010 substrate-now-enforcement-later + Phase 6.5 EC1.β v1-default-window-confirm pattern precedent (forward-only at v1; retroactive-rejection patterns deferred).
- Bank as candidate (c) pattern instance N=20 if backfill migration introduces new audit action enum value (`bill_evidence_override_applied` is candidate naming).

**Round 3 lock target.** Sub-Q4-d = 4-d.γ LOCKED at Round 3.

**Implementation note for chunk 5.1a brief.** Migration includes:
1. `UPDATE bills SET override_evidence_completeness=true WHERE bill_id NOT IN (SELECT linked_entity_id FROM source_document_links WHERE linked_entity_type='bill' AND link_role IN ('primary_invoice', 'receipt') AND link_status='created')` — auto-override pre-Phase-5.1 bills without primary attached.
2. Audit row INSERT per UPDATEd bill at migration time (or wrapped in `recordMutation` if migration discipline permits service-layer call; per migrations-rule path-scoped fire, the discipline at brief-draft adjudicates).
3. Forward-enforcement at billService.post() per Sub-Q4-shape-2 schema extension.

### §3.e Sub-Q4 sub-decision lock summary

| Sub-Q4 sub-decision | Round 3 lean | Lock target |
|---|---|---|
| 4-a per-bill vs per-case | **4-a.α (per-bill)** | Round 3 lock |
| 4-b link_role accepted set | **4-b.β (primary_invoice + receipt)** | Round 3 lock |
| 4-c detach-after-post() | **4-c.α (post-time-only)** | Round 3 lock |
| 4-d backfill posture | **4-d.γ (forward + audit row backfill)** | Round 3 lock |

---

## §4 — Sub-Q4 sub-shape walks (error code / schema extension / tests)

### §4.1 Sub-Q4-shape-1 — Error code surface

**Question.** Does INV-DOC-001 enforcement throw a typed ServiceErrorCode or use POST_FAILED catchall?

**Substrate-side evidence (verify-from-disk at ServiceError.ts):**

- ServiceErrorCode union currently includes 60+ named codes (verify-from-disk count at `apps/web/src/services/errors/ServiceError.ts:3-108`).
- Phase 2/4 precedent: explicit named codes per failure mode (`LINKED_ENTITY_NOT_FOUND` for Phase 2 chunk 5; `EXCEPTION_ALREADY_OPEN` for Phase 2 chunk 6; `EXCEPTION_ALREADY_CANCELLED` for Phase 4 chunk 3).
- Phase 4 chunk 3 β-1 precedent: POST_FAILED catchall used for `INTEGRITY_VIOLATION` (not in the union). Catchall reserved for unmodeled failure modes; named codes preferred for stable enforcement boundaries.
- INV-DOC-001 enforcement is a stable, well-modeled boundary (Layer 2 service-layer; specific failure mode = "no primary attached and no override"). Named code fits the convention.

**Disposition options:**

- **4-shape-1.α `EVIDENCE_INCOMPLETE` ServiceErrorCode extension.** Add typed code; throw `new ServiceError('EVIDENCE_INCOMPLETE', '...')`.
- **4-shape-1.β `INV_DOC_001_VIOLATION` ServiceErrorCode extension.** Invariant-named code; ties error directly to invariant ID.
- **4-shape-1.γ POST_FAILED catchall + message text.** Catchall code; failure mode discriminated by message body.

**Adjudication inputs:**

- Phase 2/4 naming precedent: semantic names (LINKED_ENTITY_NOT_FOUND, EXCEPTION_ALREADY_OPEN) over invariant-ID-named codes. Bias toward 4-shape-1.α.
- Code-grep stability: `EVIDENCE_INCOMPLETE` is searchable; `INV_DOC_001_VIOLATION` ties to invariant ID (would require rename if INV-DOC-001 is ever renumbered).
- Downstream consumer discrimination: route handler's error→HTTP-status mapping benefits from typed code (`EVIDENCE_INCOMPLETE` → 400 Bad Request); catchall would map to 500 Internal Server Error by default.

**Round 3 lean: 4-shape-1.α (`EVIDENCE_INCOMPLETE` ServiceErrorCode extension).** Reasons:
- Fits Phase 2/4 semantic-naming convention.
- Stable across future INV-DOC-NNN expansions (each invariant gets its own semantically-named error code).
- Downstream HTTP-status mapping clean (400 Bad Request).
- Catchall POST_FAILED is for unmodeled failure modes; INV-DOC-001 enforcement is well-modeled.

**ServiceErrorCode union extension at Phase 5.1 chunk 5.1a:**

```typescript
// Add to union per existing convention:
| 'EVIDENCE_INCOMPLETE' // Phase 5.1 — INV-DOC-001 enforcement at
                       // billService.post() rejection
```

Section placement in the union: after `EXCEPTION_ALREADY_CANCELLED` (Phase 4 chunk 3; existing line 102) per chronological-by-phase grouping convention. Or after Document core comments per substrate-domain grouping. Brief-draft adjudicates.

**Round 3 lock target.** Sub-Q4-shape-1 = 4-shape-1.α LOCKED at Round 3.

### §4.2 Sub-Q4-shape-2 — PostBillInputSchema extension shape

**Question.** What's the shape of the PostBillInputSchema extension for INV-DOC-001 enforcement inputs?

**Substrate-side evidence (verify-from-disk at bill.schema.ts):**

- `PostBillInputSchema` at `apps/web/src/shared/schemas/spend/bill.schema.ts:72-91` currently 18 fields (org_id, vendor_id, bill_number, issue_date, due_date, payment_terms_days, purchase_order_id, currency, amount_original, amount_cad, fx_rate, tax_amount_total, bill_lines, fiscal_period_id, entry_date, ap_control_account_id).
- 3-layer ADR-0010 discipline pattern: Layer 1 DB CHECK + Layer 2 Zod boundary + Layer 3 service emission.
- Closed-enum convention: `BillLifecycleStateSchema`, `PaymentMethodSchema`, `AppliedToSchema` at file top.

**Disposition options:**

- **4-shape-2.α Two optional fields.** Add `primary_document_id: z.string().uuid().optional()` + `override_evidence_completeness: z.boolean().optional()` (no default; default behavior at service handler: undefined → false).
- **4-shape-2.β Two optional fields with default.** Add `primary_document_id: z.string().uuid().optional()` + `override_evidence_completeness: z.boolean().optional().default(false)` (Zod-level default).
- **4-shape-2.γ Discriminated-union sub-schema.** Add `evidence_disposition: z.discriminatedUnion('mode', [{ mode: z.literal('primary'), primary_document_id: z.string().uuid() }, { mode: z.literal('override'), override_evidence_completeness: z.literal(true) }])` — discriminated-union forces caller to explicitly opt for primary-OR-override path.

**Adjudication inputs:**

- bills.override_evidence_completeness Layer 1 column has `NOT NULL DEFAULT false` per Phase 5 migration. Zod-level `.optional().default(false)` mirrors Layer 1 default.
- 4-shape-2.γ discriminated union is stricter (caller must explicitly choose), but adds API ergonomic complexity. Phase 6.5 codification on operational-flex collapse heuristic: prefer simpler shape unless complexity justifies.
- 4-shape-2.α vs 4-shape-2.β: distinction is whether Zod parses `undefined` → keeps `undefined` (4-shape-2.α) or `undefined` → `false` (4-shape-2.β). 4-shape-2.β cleaner downstream (service handler reads `parsed.override_evidence_completeness` always as boolean, never undefined).
- BillLifecycleStateSchema + PaymentMethodSchema + AppliedToSchema are closed-enum; override_evidence_completeness is boolean primitive. Closed-enum convention doesn't apply; primitive default-handling discipline does.

**Round 3 lean: 4-shape-2.β (two optional fields with Zod-level default).** Reasons:
- Mirrors Layer 1 column default (`NOT NULL DEFAULT false`).
- Clean downstream typing (service handler reads `parsed.override_evidence_completeness` as boolean always).
- Simpler than 4-shape-2.γ discriminated union; aligns with operational-flex collapse heuristic.
- Allows caller to omit both fields and get default behavior (override=false; primary=undefined → enforcement fires → EVIDENCE_INCOMPLETE thrown).

**Extension snippet for chunk 5.1a brief:**

```typescript
export const PostBillInputSchema = z.object({
  // ... existing 18 fields ...
  // INV-DOC-001 enforcement inputs (Phase 5.1):
  primary_document_id: z.string().uuid().optional(),
  override_evidence_completeness: z.boolean().optional().default(false),
});
```

**Round 3 lock target.** Sub-Q4-shape-2 = 4-shape-2.β LOCKED at Round 3.

### §4.3 Sub-Q4-shape-3 — Integration test specifics

**Question.** Test file placement + test case fixtures + adjacency-path coverage shape.

**Substrate-side evidence (verify-from-disk at tests/integration/):**

- `apps/web/tests/integration/` is **flat-structured** (no spend/billService subdirectory hierarchy). Existing bill tests: `billPostBill.test.ts`, `billApproveForPayment.test.ts`, `billApproveForPaymentRoute.test.ts`, `billDetailRoute.test.ts`, `billEcA1.test.ts`, `billEcA2.test.ts`, `billRecordPayment.test.ts`, `billReverse.test.ts`, `billReverseRoute.test.ts`, `openBills.test.ts`.
- Naming convention: `bill[Action].test.ts` (camelCase action; flat file path).
- Existing `billPostBill.test.ts` is the closest analog (covers bill posting at integration grain).

**Disposition options:**

- **4-shape-3.α New test file `billEvidenceCompleteness.test.ts`.** Three test cases at flat path; mirrors `billEcA1.test.ts` / `billEcA2.test.ts` naming pattern (`bill[ScenarioCode]`-style).
- **4-shape-3.β Extend `billPostBill.test.ts` with new describe block.** Add `describe('INV-DOC-001 enforcement', ...)` block to existing file. Keeps all post-related tests co-located.
- **4-shape-3.γ Three separate files** for positive / override / failure paths.

**Adjudication inputs:**

- Single-feature-per-file naming convention (`billPostBill.test.ts` = bill posting feature; `billEcA1.test.ts` = EC-A-1 scenario test). INV-DOC-001 is a distinct feature gating bill post; deserves its own file per convention.
- 4-shape-3.γ over-splits (three small files); 4-shape-3.β under-splits (mixes unrelated test scenarios in single file).
- 4-shape-3.α matches convention + balanced granularity.

**Test fixture design:**

```typescript
// apps/web/tests/integration/billEvidenceCompleteness.test.ts (NEW)

describe('INV-DOC-001 enforcement at billService.post()', () => {
  it('positive path: bill post with primary_document_id succeeds + creates source_document_links row', async () => {
    // Setup: org + vendor + fiscal_period + accounts + source_document
    // Act: billService.post({ ...inputs, primary_document_id: <uuid> })
    // Assert: bill row created + bill_lines + JE posted + source_document_links row
    //          with linked_entity_type='bill' + link_role='primary_invoice'
  });

  it('override path: bill post with override_evidence_completeness=true succeeds without primary_document_id', async () => {
    // Setup: org + vendor + fiscal_period + accounts
    // Act: billService.post({ ...inputs, override_evidence_completeness: true })
    // Assert: bill row created with override_evidence_completeness=true + no source_document_links row
  });

  it('failure path: bill post without primary_document_id and without override throws EVIDENCE_INCOMPLETE', async () => {
    // Setup: org + vendor + fiscal_period + accounts
    // Act: billService.post({ ...inputs }) — neither primary_document_id nor override_evidence_completeness
    // Assert: ServiceError thrown with code='EVIDENCE_INCOMPLETE'; no rows committed
  });
});
```

**Adjacency-path coverage:**
- post() error mapping: covered in failure path test.
- T2 dispatcher emission verification: out-of-scope (T2 fires at paymentService.record(), not billService.post(); chunk 5.1b territory).
- ServiceErrorCode discrimination: covered in failure path test (catches with `code === 'EVIDENCE_INCOMPLETE'`).
- 4-b.β receipt-as-primary path: extend positive path test OR add fourth test case for `link_role='receipt'` accepted. Brief-draft adjudicates.
- 4-d.γ backfill audit row: covered at chunk 5.1a migration test (separate scope; migration-level test, not service-level).

**Round 3 lean: 4-shape-3.α (new test file at `billEvidenceCompleteness.test.ts` flat path).** Reasons:
- Matches existing single-feature-per-file convention.
- Three-fixture shape (positive / override / failure) is balanced granularity.
- Future test additions (receipt-as-primary; edge cases) extend the same file naturally.

**Round 3 lock target.** Sub-Q4-shape-3 = 4-shape-3.α LOCKED at Round 3.

---

## §5 — Round 3 close + Round 4 scope projection

### §5.1 Round 3 dispositions banked

| Sub-Q | Round 3 status | Lock target |
|---|---|---|
| Sub-Q1 — decomposition | 1.γ-i lean held | Round 4 |
| Sub-Q2 — paymentService | 2.β LOCKED (Round 3 preamble) | — |
| Sub-Q3 — vendor_credits | β LOCKED (Round 2 onset) | — |
| Sub-Q4 — INV-DOC-001 | Option (i) single commit LOCKED (Round 3 preamble) | — |
| Sub-Q4.5 — evidence-service | 4.5.α LOCKED (Round 3 preamble) | — |
| Sub-Q4-a per-bill vs per-case | **4-a.α LOCKED** (per-bill) | — |
| Sub-Q4-b link_role accepted set | **4-b.β LOCKED** (primary_invoice + receipt) | — |
| Sub-Q4-c detach-after-post() | **4-c.α LOCKED** (post-time-only) | — |
| Sub-Q4-d backfill posture | **4-d.γ LOCKED** (forward + audit row backfill) | — |
| Sub-Q4-shape-1 — error code | **4-shape-1.α LOCKED** (EVIDENCE_INCOMPLETE) | — |
| Sub-Q4-shape-2 — schema extension | **4-shape-2.β LOCKED** (two optional fields with Zod default) | — |
| Sub-Q4-shape-3 — integration tests | **4-shape-3.α LOCKED** (new billEvidenceCompleteness.test.ts flat) | — |
| Sub-Q5 — ordering | 5.1a → 5.1b sequenced lean | Round 4 (with Sub-Q1) |
| Sub-Q6 — artifact location | LOCKED (Round 1) | — |
| Sub-Q7 — retrospective placement | LOCKED (Round 2) | — |

**Eleven sub-questions/sub-decisions LOCKED at Round 3.** Remaining: Sub-Q1 final lock + Sub-Q5 final lock (both fire at Round 4 jointly per cycle precedent).

### §5.2 Round 4 scope projection

**Round 4 primary walks:**

- Sub-Q1 final lock (1.γ-i ratification per Round 2 + Round 3 ordering surface).
- Sub-Q5 final lock (5.1a → 5.1b sequenced ratification with Sub-Q1).
- Path C invocation final adjudication (prospectively negative per Round 2 + Round 3 analysis; ratified-negative at Round 4).
- Per-chunk acceptance criteria + rollback posture + test matrix per v3 §9 Decision 5 + CTO Condition 5.
- Two Laws verification scope (INV-SERVICE-001/002 + INV-AUTH-001 inheritance per chunk).

**Round 4 secondary walks (if scope permits):**

- Friction-journal entries banked-at-this-cycle inventory (candidate (c) N=19 + ADR-0011 §15 editorial clarifications + Phase 5 retro §6:404 vendor_credits assertion correction + ADR-0016 §1 vendor_credit cell-validity update).
- Phase 5.1 retrospective drafting plan (Round 6-7 territory but surface if Round 4 scope permits).

### §5.3 Carry-forward observations

1. **Candidate (c) catalog N=19 at Round 3 close.** Brainstorming-arc grain N=13 of N=19 (highest-firing). Retrospective-authoring fourth-grain candidate N=1. ADR-authoring fifth-grain candidate N=0 numbered + N=2 banked-for-retrospective (Refinement B cluster).
2. **ADR-0011 §15 editorial clarification cluster (Refinement B + Round 3 §3.b finding).** Two findings carry forward as Phase 5.1 retrospective drafting observations:
   - "Adjacent commit paths" framing over-broad (single firing site at billService.post()).
   - "primary_invoice (or 'primary')" cites non-existent enum value (no `primary` link_role in source_document_links enum per ADR-0016 §2).
   - **Potential editorial-grade amendment** to ADR-0011 §15 at Phase 5.1 retrospective Commit grade (ADR-0011's fourth amendment; counting Phase 2.5 + Phase 4 retro + Phase 6.5 retro Commit A as prior).
3. **Sub-Q4-d backfill audit row enum addition.** chunk 5.1a migration introduces new audit action `bill_evidence_override_applied` (per 4-d.γ disposition). Brief-draft verifies the audit action enum's current shape + extension path.
4. **`controller_override_memo` link_role reserved post-v1 for INV-DOC-001 override evidence.** Per ADR-0016 §2:421-427: "controller_override_memo is reserved for the INV-DOC-001 (ADR-0011 §15) override path — when a controller overrides the evidence-completeness invariant via the `bills.override_evidence_completeness` flag (ADR-0015 §10), post-v1 may capture the override justification as a memo PDF linked with this role; v1 captures the override through the boolean flag and audit event only." Phase 5.1 chunk 5.1a chooses 4-d.γ (audit row at migration time + flag flip); `controller_override_memo` PDF attachment is post-v1 trigger.
5. **vendor_credits β doesn't activate `controller_override_memo` either** (per Sub-Q3 β substrate-only; no service surface; controller_override_memo reserved post-v1 stays reserved).
6. **Tests directory flat structure confirmed.** Future Phase 5.1 retrospective may note candidate-for-codification: integration-tests-flat-structure-vs-nested-subdirectory convention (currently flat; some projects nest by feature). Bank as observation.

### §5.4 Round 4 prompt inputs

Round 4 prompt should:

- Re-cite Round 1 + Round 2 + Round 3 dispositions (eleven sub-questions/sub-decisions locked; Sub-Q1 + Sub-Q5 pending Round 4 lock).
- Lock Sub-Q1 = 1.γ-i (1.γ-i two-chunk decomposition per Round 2 lean + Round 3 surface).
- Lock Sub-Q5 = 5.1a → 5.1b sequenced (per Round 3 §2 walk).
- Surface per-chunk acceptance criteria + rollback posture + test matrix for chunks 5.1a + 5.1b per v3 §9 Decision 5.
- Surface Two Laws verification scope for both chunks.
- Path C invocation ratified-negative.

---

**Round 3 status:** complete. Single-session-execute-and-close per directive. Eleven sub-questions/sub-decisions locked at Round 3; Sub-Q1 + Sub-Q5 final locks at Round 4. Awaiting Round 4 prompt drafting (Sub-Q1 + Sub-Q5 locks + per-chunk acceptance criteria + Two Laws verification).
