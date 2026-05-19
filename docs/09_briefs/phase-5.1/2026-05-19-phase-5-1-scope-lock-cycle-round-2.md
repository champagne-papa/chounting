# Phase 5.1 Amendments — Scope-Lock Cycle Round 2

**Session:** 16
**Date:** 2026-05-19
**Branch:** `staging`
**HEAD at session-onset:** `72a40bf` ("docs(phase-5.1): Round 1 verify-from-disk pass + sub-question structure")
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green; full vitest trusted at 1148/1148 per directive baseline.
**Predecessor:** Round 1 close at `72a40bf` (2026-05-17); Round 1 artifact at `docs/09_briefs/phase-5.1/2026-05-17-phase-5-1-scope-lock-cycle-round-1.md` (509 lines).

---

## §1 — Preamble + Round 1 inheritance

### §1.1 Round 1 close summary

Round 1 walked five substantive Grain 1 substrate-shape findings + seven sub-questions + four bank-worthy observations at §2.4. Round 1 closed at `72a40bf` with five findings carried to Round 2:

- **Finding 1** — INV-DOC-001 two-artifact obligation (leaf registration + Layer 2 enforcement code; NOT a leaf in `ledger_truth_model.md` per disk; ADR-0011 §15 reserved-candidate only).
- **Finding 2** — Layer 1 substrate already shipped at Phase 5 (`bills.override_evidence_completeness` at migration `20240138000000:172`); Phase 5.1 enforcement is Layer 2 only.
- **Finding 3** — vendor_credits + vendor_credit_applications tables **do not exist** in any migration; β disposition ships tables as v1-active substrate at Phase 5.1.
- **Finding 4** — paymentService greenfield introduction; T2 dispatcher slot reserved at Phase 4 chunk 3 activates on `paymentService.record()` post-commit hook + extends `DispatchTriggerInputSchema` discriminated union.
- **Finding 5** — `apps/web/src/services/evidence/` substrate is `.gitkeep`-only; opens Sub-Q4.5 inline-vs-evidence-service surface adjudication.

### §1.2 Sub-Q3 = β locked + Refinements 1 + 2 absorbed

Sub-Q3 disposition was adjudicated brainstorming-side post-Round-1. **Sub-Q3 = β locked:**

- vendor_credits + vendor_credit_applications tables ship as v1-active substrate at Phase 5.1
- No service-layer surface (no vendorCreditService); no UI; no consumer wiring
- ADR-0010 substrate-now-enforcement-later catalog instance N=5 (Phase 6.5 retro ratified N=4 + Phase 5.1 addition)
- Phase 5 retrospective §6:404-414 framing honored (vendor onboarding + vendor_credits operational rollout remain post-v1 contingent on founder + two real users hitting operational need)

**Refinement 1 — ADR-0016 third amendment cycle additive provenance-preserving.** Phase 5.1 amends ADR-0016 §1 + §3 (pair-validity matrix) by moving `vendor_credit` + `vendor_credit_application` from reserved-post-v1 back to v1-active (for primary_invoice and adjacent cells per substrate landing). The amendment block cites BOTH Phase 2.5 Commit A (prior reservation amendment) AND Phase 5.1 (current amendment). Per Phase 2.5 Commit B convention: never restructure to absorb amendments invisibly. ADR-0016's existing two amendments at lines 1751 (Phase 2.5 Commit A reconciliation) + 1869 (Phase 4 retrospective reconciliation); Phase 5.1 ships the third amendment block after line 1983.

**Refinement 2 — T4 + T6 dispatcher slots stay reserved per β disposition.** Phase 4 chunk 3 Framing F locked at scope-lock Round 1: "T2/T4/T6 reserved per 'land schema with consumer code' reverse-discipline — `paymentService.ts` and `vendorCreditService.ts` do not exist at v1; their dispatcher wiring activates when paymentService/vendorCreditService ship in a future Phase 5 amendment chunk." β disposition ships substrate without service, so T4 + T6 stay reserved-pending-consumer. Phase 5.1 paymentService activation makes T2 bidirectionally active (emit hook at `paymentService.record()` + admit in `DispatchTriggerInputSchema` discriminated union); T4 + T6 stay reserved with the existing comment.

### §1.3 Session-onset divergence — candidate (c) N=16

One path divergence surfaced at Round 2 verify-from-disk:

**Divergence — control_matrix.md path correction.** Directive cited `docs/07_governance/control_matrix.md`. Actual path: `docs/06_audit/control_matrix.md` per `docs/INDEX.md:84`. Banked as **candidate (c) pattern instance N=16** at session-prompt-authoring grain (partial-information-recommendation-drift; cited path inferred without verify-from-disk on INDEX.md).

**Updated candidate (c) catalog observation:**
- N=13 — apReportService.ts path drift (Round 1 §1.1; session-prompt-authoring grain)
- N=14 — HEAD-pin drift (Round 1 §1.1; session-prompt-authoring grain)
- N=15 — Phase 5 retrospective §6:404 vendor_credits "tables exist in the schema" assertion (Round 1 §2.4 finding 1; retrospective-authoring grain, first observation)
- N=16 — control_matrix.md path drift (this Round 2 §1.3; session-prompt-authoring grain)

Brainstorming-arc grain at N=10 of N=16 (highest-firing). Retrospective-authoring grain at N=1 (fourth-grain candidate; Phase 5.1 retrospective writeup grain is future N=2 graduation candidate per Round 1 §6.3 carry-forward).

### §1.4 Round 2 walk structure

Per directive §1-§6:

| § | Walk | Primary outputs |
|---|---|---|
| §1 | Preamble + Round 1 inheritance | (this section) |
| §2 | Sub-Q2: paymentService introduction + T2 dispatcher activation | Provisional lean (2.α / 2.β / 2.γ) |
| §3 | Sub-Q4: INV-DOC-001 enforcement two-artifact obligation | Leaf registration shape + Layer 2 code shape + decomposition adjudication |
| §4 | Sub-Q4.5 (NEW): inline-vs-evidence-service surface | Provisional lean (4.5.α / 4.5.β) |
| §5 | Sub-Q1 narrowing + Path C invocation framing | Volume forecast refined + Sub-Q1 disposition shapes |
| §6 | Round 2 close + Round 3 scope projection | Dispositions banked + Round 3 prompt inputs |

### §1.5 Canonical cross-references (Round 1 + Round 2 inputs)

Inherited from Round 1 § 1.4 + three new for Round 2:

- **Phase 4 chunk 3 brief** at `docs/09_briefs/phase-4/chunks/2026-05-14-phase-4-chunk-3.md` (947 lines) — T2/T4/T6 dispatcher slot reservation shape; Framing F lock; bidirectional T2 activation (emit + admit).
- **ADR-0016** at `docs/07_governance/adr/0016-document-relationship-graph.md` (1983 lines) — vendor_credit + vendor_credit_application enum reservation language; two existing amendment blocks at lines 1751 + 1869; Phase 5.1 ships third amendment block.
- **Migration 20240138000000** at `supabase/migrations/20240138000000_phase5_vendor_prepayment_substrate.sql` (272 lines) — `bills.override_evidence_completeness boolean NOT NULL DEFAULT false` at line 172 + header comment at line 167-168 ("reserved Phase 2 stub for INV-DOC-001 (enforcement deferred per substrate-now-enforcement-later D6 §6.8)").
- **INV-LEDGER-001 leaf** at `docs/02_specs/ledger_truth_model.md:179-283` — template for INV-DOC-001 leaf shape; canonical sections (Invariant / Enforcement / Why X / Interaction with the service layer / Service-layer backstop / Category A floor test / Referenced by).
- **invariants.md** at `docs/02_specs/invariants.md` (currently 20 rows; Phase 5.1 adds row 21) — rollup row format documented.
- **control_matrix.md** at `docs/06_audit/control_matrix.md` (audit-side evidence; Layer 2 section currently 6 rows; Phase 5.1 adds 7th Layer 2 row).

---

## §2 — Sub-Q2 walk: paymentService introduction + T2 dispatcher activation

### §2.1 Refined framing from Round 1 Finding 4

Round 1 Finding 4 surfaced paymentService as **greenfield introduction** (never existed in git history). The Round 1 framing assumed Sub-Q2 was about "extracting from billService.recordPayment"; Round 2 refines this:

paymentService is not an extraction. It's a new service whose first method activates the **T2 dispatcher slot** reserved at Phase 4 chunk 3 Framing F. The relationship to `billService.recordPayment` is one of three shapes adjudicated below.

**Bidirectional T2 activation per Phase 4 chunk 3 substrate:**
- **Emit-side:** `paymentService.record()` (or analogous method) fires `T2_new_payment` trigger post-commit via `dispatchTrigger({ trigger_type: 'T2_new_payment', ... })`. Pattern B external-wrap variant per F-J-11 (try/catch + log + best-effort isolation per P3-i F-J-4).
- **Admit-side:** `DispatchTriggerInputSchema` discriminated union (currently 5 v1-active branches: T1, T3, T5, T8, T10) extends to admit T2_new_payment branch. Schema extension lands at Phase 5.1 paymentService chunk (or amendment-cycle commit if 1.α).

### §2.2 Disposition options

**2.α — paymentService supersedes billService.recordPayment.**

Full extraction. `paymentService.record()` becomes the canonical mutation handler for `record_bill_payment` (per ADR-0011 §7 ProposedMutation handle naming). `billService.recordPayment` removed; consumers migrate.

Consumer migration scope per Round 2 verify-from-disk:

| Consumer | Path | Migration action |
|---|---|---|
| Route handler | `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` | Swap `billService.recordPayment` → `paymentService.record` (wrap site + import) |
| UI component | `apps/web/src/components/canvas/RecordPaymentCard.tsx` | Update header comment + (if applicable) tRPC/API call surface name |
| Schema | `apps/web/src/shared/schemas/spend/bill.schema.ts` | Move `RecordBillPaymentInputSchema` to `apps/web/src/shared/schemas/spend/recordPayment.schema.ts` (or analogous payment-domain location) |
| Audit enum | `apps/web/src/db/types.ts:3272,3669` (auto-generated) | Schema-side: keep `record_bill_payment` as audit action name OR rename to `payment_recorded` per paymentService canonical naming |
| Exception queue resolution_action | `apps/web/src/shared/schemas/document-platform/exceptionQueueEntry.schema.ts:21` | Schema-side: same as audit enum decision |
| Integration tests | `apps/web/tests/integration/...` (verify-from-disk at brief-draft) | Test file renames + call-site updates |

Surface is **tight** (4-5 consumer touchpoints + tests). Path C invocation fires at brief-draft per RI-7 prospective grain (5+ touchpoints; verify-against-disk enumeration before refactor).

**2.β — paymentService.record() handles payment-flow primitive; billService.recordPayment retains AP-domain orchestration.**

Partial extraction. paymentService.record() owns the payment-flow-pure logic (insert payments row + insert bill_payment_allocations row + compose payment JE + delegate to journalEntryService.post()). billService.recordPayment retains:

- bill state-transition computation (`partially_paid` vs `fully_paid`)
- `bills.lifecycle_state` UPDATE
- bill-grain audit emission (`bill_payment_recorded`)
- T5_bill_state_transition dispatch (currently in billService.recordPayment at `apps/web/src/services/spend/billService.ts:717-736`; conditional gating per F-J-12)

paymentService.record() emits T2_new_payment post-commit; T5 stays at billService.recordPayment. Consumers unchanged (still call `billService.recordPayment`); paymentService.record() is internal-only at v1.

**2.γ — paymentService.record() wraps billService.recordPayment.**

paymentService.record() becomes the **public surface**; internally calls billService.recordPayment for execution. Consumers migrate to paymentService.record(). billService.recordPayment retains as internal implementation detail.

Per ADR-0007 service composition: paymentService.record() composes payment-domain validation + T2 dispatch + billService.recordPayment delegate. T5 still fires from billService.recordPayment internal. Two dispatch hooks fire (T2 from paymentService outer wrap; T5 from billService inner per existing logic).

### §2.3 Substrate-side adjudication inputs

**Input 1 — ADR-0011 §7 ProposedMutation canonical handle naming.**

Per ADR-0011 §7 (lines 482-489): "Maps to one ledger-touching change. Commits through a domain service that produces ledger operations via `ledgerService.post(...)` per Reading B. Examples: `record_bill_payment`, `post_vendor_credit`, `apply_vendor_prepayment_to_bill`."

"`record_bill_payment`" is the canonical ProposedMutation handle. Per Reading B framing, ONE domain service owns the mutation. This biases toward 2.α (paymentService owns the canonical mutation) OR 2.γ (paymentService is public surface; billService is internal).

**Input 2 — Phase 6 retrospective §6.b naming.**

"Chunk-3-Phase-4 reserved T2 dispatcher slot activates at `paymentService.record()` post-commit dispatch hook." This explicitly names `paymentService.record()` (not `.payment()` or `.create()`). Bias for canonical method name: **`paymentService.record()`** per Phase 6 retro framing.

**Input 3 — Phase 4 chunk 3 Framing F locked.**

Framing F: "T2/T4/T6 branches add to `DispatchTriggerInputSchema` when `paymentService.ts` and `vendorCreditService.ts` ship in a future Phase 5 amendment chunk." Phase 4 chunk 3 anticipates paymentService.ts (filename) shipping; bidirectional T2 activation depends on the filename existing.

**Input 4 — Separation-of-concerns architecture argument.**

payment-flow primitive is more general than AP-domain orchestration. Future paymentService consumers (customer payments at AR phase; refunds; banking payouts) need the primitive without bill-domain coupling. 2.β cleanest separation:

- paymentService.record() = payment domain primitive (reusable across AP/AR/banking)
- billService.recordPayment = AP-domain orchestration (composes paymentService + bill-grain side effects)

2.α + 2.γ over-couple payment-domain primitive to AP-domain orchestration (T5 dispatch in particular).

**Input 5 — Reading B preservation (non-negotiable).**

All three options preserve Reading B (journalEntryService.post() remains sole writer of journal_entries / journal_lines). 2.α: paymentService.record() composes JE input → journalEntryService.post(). 2.β: paymentService.record() composes JE input → journalEntryService.post(); billService.recordPayment orchestrates. 2.γ: paymentService.record() wraps billService.recordPayment which composes JE input → journalEntryService.post().

**Input 6 — Two Laws + INV-SERVICE-001/002 + INV-AUTH-001 inheritance.**

paymentService.record() ships with:
- INV-SERVICE-001 wrap site at route handler (Pattern B unwrapped function + withInvariants wrap at route per billService precedent)
- INV-SERVICE-002 adminClient discipline (all DB access via adminClient)
- INV-AUTH-001 permission check via withInvariants action (route handler action: `'payment.record'` per Sub-Q2 sub-decision OR `'bill.record_payment'` retained for backwards compat)
- INV-AUDIT-001 recordMutation emission at payment grain (audit action: `payment_recorded` OR `record_bill_payment` per Sub-Q2 sub-decision)
- INV-MONEY-001 boundary discipline (Zod schemas at payment-domain boundary)

These inherit regardless of 2.α/β/γ choice; not load-bearing for disposition.

**Input 7 — Method naming sub-decisions.**

| Element | 2.α / 2.γ | 2.β |
|---|---|---|
| Service name | `paymentService` | `paymentService` |
| Method name | `paymentService.record()` per Phase 6 retro | `paymentService.record()` (returns `{payment_id, journal_entry_id}` minimal) |
| Route handler action | `'payment.record'` (new) OR `'bill.record_payment'` (existing) | `'bill.record_payment'` (route still hits billService) |
| Audit enum value | `payment_recorded` (new) OR `record_bill_payment` (existing) | `record_bill_payment` (unchanged) |
| Exception queue resolution_action | Same as audit enum | `record_bill_payment` (unchanged) |
| Migration to rename audit enum | Yes (2.α only — full rename) | No |

2.α requires audit enum rename migration (touches `apps/web/src/db/types.ts` auto-generation + audit_log historical rows under existing `record_bill_payment` enum value preserved); 2.γ may or may not (depending on whether route handler action name renames); 2.β does not (smallest substrate footprint).

### §2.4 Round 2 provisional lean: 2.β

**Provisional lean: 2.β (partial extraction; payment-flow primitive at paymentService.record(); AP-domain orchestration retained at billService.recordPayment).**

**Reasons:**

1. **Cleanest separation-of-concerns.** paymentService.record() is reusable across future AP/AR/banking phases. billService.recordPayment retains bill-domain orchestration (lifecycle_state update + bill-grain audit + T5 dispatch). 2.α and 2.γ over-couple.
2. **Smallest substrate footprint.** No audit enum rename migration; no exception queue resolution_action rename; no schema namespace move. The Phase 5.1 paymentService chunk introduces paymentService.ts + paymentService.record() + Zod schemas + tests; billService.recordPayment refactors internally to call paymentService.record() for payment-flow steps.
3. **T2 + T5 dispatch separation honored.** paymentService.record() fires T2_new_payment (new payment is the trigger event); billService.recordPayment fires T5_bill_state_transition (bill lifecycle change is the trigger event). Two distinct domains; two distinct triggers; two distinct dispatch sites. 2.α would coalesce both at paymentService (T5 becomes payment-domain-aware which is the wrong coupling direction).
4. **Consumer surface unchanged.** Route handler at `apps/web/src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts` still wraps `billService.recordPayment` (no rename). UI component at `RecordPaymentCard.tsx` unchanged. Schema at `bill.schema.ts` unchanged. Refactor scope tight.
5. **ADR-0011 §7 ProposedMutation handle naming preserved.** `record_bill_payment` remains the canonical ProposedMutation handle for "record a payment against a bill." paymentService.record() is the payment-domain primitive that this mutation composes; it doesn't replace the handle.

**Sub-Q2 sub-decisions deferred to implementation-brief review (product-discovery grain per CTO Condition 7):**

- Specific paymentService.record() input/output schema shape (Zod schema fields)
- Specific paymentService.record() error code surface (`PAYMENT_*` codes vs generic POST_FAILED)
- File header doc shape (mirror billService.ts header doc convention)

**Round 3 lock target.** Sub-Q2 = 2.β at Round 3 unless founder pushes back at Round 3 review.

---

## §3 — Sub-Q4 walk: INV-DOC-001 enforcement (Layer 2 + two-artifact obligation)

### §3.0 Refined framing from Round 1 Findings 1 + 2

Round 1 Finding 1 established INV-DOC-001 is **NOT a leaf** in `ledger_truth_model.md` (reserved-candidate per ADR-0011 §15 only). Round 1 Finding 2 confirmed Layer 1 substrate already shipped at Phase 5 (`bills.override_evidence_completeness` flag at migration `20240138000000:167-172`); Phase 5.1 enforcement is **Layer 2 only**.

Phase 5.1 INV-DOC-001 ships **two artifacts**:

- **(a) Leaf registration** — promote INV-DOC-001 from reserved-candidate (ADR-0011 §15) to leaf in `ledger_truth_model.md` + rollup row in `invariants.md` + audit row in `control_matrix.md` + bidirectional reachability annotation in code.
- **(b) Layer 2 enforcement code** — `billService.post()` (and any adjacent commit paths) refuses to commit bills without an attached primary document, except when `override_evidence_completeness=true` on the bill row.

### §3.a Leaf registration (artifact a)

#### §3.a.i ledger_truth_model.md leaf addition

Template per `INV-LEDGER-001` leaf at `docs/02_specs/ledger_truth_model.md:179-283`:

```
### INV-DOC-001 — Evidence completeness for committed bills (Layer 2)

**Invariant.** Every committed bill has at least one
`source_document_links` row with `linked_entity_type='bill'`,
`linked_entity_id=<bill_id>`, and `link_role` ∈ {'primary_invoice',
'primary'} — unless the bill row carries `override_evidence_completeness=true`.

**Enforcement.** Layer 2 service-layer check at
`billService.post()`. The service function refuses to commit a bill
without an attached primary document, except when the
`override_evidence_completeness` controller flag is set on the bill
row. The flag's Layer 1 substrate ships at Phase 5 migration
`20240138000000_phase5_vendor_prepayment_substrate.sql:172`
(`override_evidence_completeness boolean NOT NULL DEFAULT false`);
the Layer 2 enforcement lands at Phase 5.1.

**Why Layer 2.** [Per ADR-0011 §15: substrate-now-enforcement-later
discipline. The DB has no foreign key from bills to source_document_links
that would enforce the "at least one primary" rule at Layer 1 — the
relationship is many-to-many via the polymorphic spine, and the
"primary" requirement is a business rule that depends on link_role
enum membership rather than referential integrity.]

**Interaction with the service layer.** [billService.post() input
schema extension: optional primary_document_id parameter. When
provided, billService.post() inserts a source_document_links row
with linked_entity_type='bill' + linked_entity_id=<bill_id> +
link_role='primary_invoice' in the same transaction. When not
provided, billService.post() refuses to commit unless
override_evidence_completeness=true.]

**Service-layer backstop.** [None at Phase 5.1; Phase 2+ may add a
reporting backstop at evidence-completeness audit prompt under
`docs/07_governance/audits/prompts/`.]

**Category A floor test.** [Not a Category A floor candidate at
Phase 5.1; Category A is reserved for Phase 1.1 + Arc A core
invariants. Phase 5.1 integration test scope at §3.b.iv covers
positive path, override path, and failure path.]

**Referenced by:** [ADR-0011 §15 (reservation graduation source);
ADR-0015 (override mechanism owner); ADR-0016 §6 (primary_invoice
link_role canonical pair); billService.ts (enforcement code site).]
```

Leaf insertion site: after INV-AUDIT-001 (current line 4097+) at the end of Layer 2 section, before Phase 2 Reserved Invariants subsection. INV-DOC-001 becomes the 21st invariant and the 7th Layer 2 invariant.

#### §3.a.ii invariants.md rollup row addition

Template per current rows 15-20 (Layer 2) at `docs/02_specs/invariants.md:74-79`:

```
| 21 | INV-DOC-001 | 2 | Bills require attached primary document | TypeScript service function (Zod schema + business-logic check) | [leaf](ledger_truth_model.md#inv-doc-001--evidence-completeness-for-committed-bills) | `src/services/spend/billService.ts` (function `post`) |
```

**Bidirectional reachability statement update.** invariants.md currently states (lines 33-35): "20 distinct INV-IDs documented in `ledger_truth_model.md` (14 Layer 1a, 6 Layer 2, 0 Layer 1b)." Phase 5.1 updates to: "21 distinct INV-IDs documented (14 Layer 1a, **7 Layer 2**, 0 Layer 1b)." Symmetric difference remains empty if bidirectional reachability annotation in `src/services/spend/billService.ts` ships (artifact a sub-deliverable).

#### §3.a.iii control_matrix.md row addition

Template per Layer 2 section header at `docs/06_audit/control_matrix.md:53-59` (extending Layer 2's currently 6 rows to 7). Row content:

```
### INV-DOC-001 — Evidence completeness for committed bills (Layer 2)

**Spec leaf:** [`docs/02_specs/ledger_truth_model.md` INV-DOC-001](../02_specs/ledger_truth_model.md#inv-doc-001--evidence-completeness-for-committed-bills)

**Test coverage:** Integration test at
`tests/integration/billEvidenceCompleteness.test.ts` (Phase 5.1
new). Three test cases: (a) bill post with primary_document_id
inserts source_document_links row atomically and commits; (b) bill
post without primary_document_id and override_evidence_completeness=true
commits successfully without source_document_links row; (c) bill
post without primary_document_id and override_evidence_completeness=false
(default) throws ServiceError('POST_FAILED', 'EVIDENCE_INCOMPLETE: ...').

**Enforcement mechanism:** TypeScript service function check in
`billService.post()`. The check fires AFTER Zod input validation +
bill_lines validation but BEFORE the bills row INSERT. If
override_evidence_completeness=false and primary_document_id is
absent, the function throws before any database mutation. If
primary_document_id is provided, the function INSERTs the bill row
+ bill_lines + source_document_links row in the same transaction
via journalEntryService.post() composition.

**Non-bypassability claim:** No code path other than
`billService.post()` (and the post-Phase-5.1 paymentService.record()
delegate per Sub-Q2 = 2.β) creates a bills row — all consumers
flow through this service per INV-SERVICE-001 + INV-SERVICE-002.
The override flag is the only bypass mechanism; the flag is itself
a controller-grade audit event per ADR-0015 (override use cases:
controller backfill for legacy bills, audit-trail exception for
emergency posting without document).
```

control_matrix.md row insertion site: after INV-AUDIT-001 row at end of Layer 2 section.

#### §3.a.iv Bidirectional reachability annotation in code

Per invariants.md verification command (lines 44-47):

```bash
diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) \
     <(grep -rho 'INV-[A-Z]\+-[0-9]\+' src/ supabase/migrations/ | sort -u)
```

For symmetric reachability post-Phase-5.1, `INV-DOC-001` must appear as annotation in code. Insertion site: `apps/web/src/services/spend/billService.ts` (file header comment block + inline at billService.post() function header). Pattern per billService.ts header at lines 52-57 ("INV-AP-001 Layer 2: ..."): add `INV-DOC-001 Layer 2: bill commit requires primary_document_id OR override_evidence_completeness=true (see ledger_truth_model.md leaf + ADR-0011 §15 reservation graduation)`.

### §3.b Layer 2 enforcement code (artifact b)

#### §3.b.i billService.post() signature extension

Current `PostBillInputSchema` per Round 2 read at `apps/web/src/services/spend/billService.ts:76-80` (Zod schema imported from `apps/web/src/shared/schemas/spend/bill.schema.ts`; not directly shown in Round 2 read). Phase 5.1 extension:

- Add optional `primary_document_id: z.string().uuid().optional()` field to `PostBillInputSchema`.
- Add optional `override_evidence_completeness: z.boolean().default(false)` field (mirrors Layer 1 column default).

#### §3.b.ii billService.post() enforcement logic

Insertion site: after Zod input validation (post `parsed = PostBillInputSchema.parse(input)`) + after bill_lines validation, BEFORE journalEntryService.post() call (currently line 317).

Enforcement shape:

```typescript
// INV-DOC-001 Layer 2: bill commit requires attached primary document
// OR override_evidence_completeness=true. Per ADR-0011 §15 reservation
// graduation; leaf at ledger_truth_model.md.
if (!parsed.override_evidence_completeness && !parsed.primary_document_id) {
  throw new ServiceError(
    'POST_FAILED',
    `EVIDENCE_INCOMPLETE: bill commit requires primary_document_id ` +
    `or override_evidence_completeness=true (INV-DOC-001)`,
  );
}
```

#### §3.b.iii source_document_links atomic insert in same transaction

If `primary_document_id` provided, billService.post() INSERTs the source_document_links row after the bill row INSERT (line 332+ region). The link insert depends on bill_id existing (foreign key); same-transaction insert ensures atomicity. Insertion shape:

```typescript
if (parsed.primary_document_id) {
  // Compose source_document_links input per ADR-0016 §1 + §4 + §5.
  await documentLinkService.create(
    {
      org_id: parsed.org_id,
      source_document_id: parsed.primary_document_id,
      linked_entity_type: 'bill',
      linked_entity_id: insertedBill.bill_id,
      link_role: 'primary_invoice',
    },
    ctx,
  );
}
```

Note: documentLinkService.create() is the canonical attachment-creation surface per ADR-0016 §6 (pre-commit vs post-commit boundary). At billService.post() time, the bill is being committed in the same transaction; documentLinkService.create() runs inside billService.post()'s caller-wrap-with-invariants transaction.

#### §3.b.iv Integration test scope

Three integration test cases per §3.a.iii control_matrix row:

1. **Positive path:** bill post with `primary_document_id` provided → bill row + bill_lines + source_document_links row all committed atomically; JE posted via journalEntryService.post().
2. **Override path:** bill post with `override_evidence_completeness=true` and no `primary_document_id` → bill row + bill_lines committed without source_document_links row; JE posted; `bills.override_evidence_completeness=true` persisted.
3. **Failure path:** bill post with `override_evidence_completeness=false` (default) and no `primary_document_id` → `ServiceError('POST_FAILED', 'EVIDENCE_INCOMPLETE: ...')` thrown before any DB mutation; no rows committed.

Test file: `apps/web/tests/integration/billEvidenceCompleteness.test.ts` (new). Mirror shape per existing AP integration tests (e.g., `tests/integration/billPost.test.ts` if present; verify-from-disk at brief-draft).

#### §3.b.v Adjacent commit paths

Per ADR-0011 §15: "The `billService.post()` and adjacent commit paths refuse to commit bills without an attached primary document..."

Verify-from-disk on adjacent commit paths:

| Path | Touches `bills` row | INV-DOC-001 firing |
|---|---|---|
| `billService.post()` | INSERT new bill row | **Yes** (primary canonical site) |
| `billService.approveForPayment()` | UPDATE `lifecycle_state` only | No (bill already exists; INV-DOC-001 fired at post time) |
| `billService.recordPayment()` (or paymentService.record() per Sub-Q2 = 2.β) | UPDATE `lifecycle_state` only | No (bill already exists) |
| `billService.reverse()` | UPDATE `lifecycle_state` to 'voided'; reverses JE | No (reversal preserves prior INV-DOC-001 fire) |
| Document Platform commit paths (e.g., documentRouterService dispatcher) | Does NOT insert bills | No (Document Platform produces proposals; bills inserted via billService.post()) |
| Bundle commit paths (e.g., ADR-0012 born-paid bundle) | Composes billService.post() + billService.recordPayment() | INV-DOC-001 fires at billService.post() phase (single bill row created) |

Single canonical firing site: `billService.post()` only. ADR-0011 §15's "adjacent commit paths" phrasing is over-cautious; Phase 5.1 enforcement is at billService.post() exclusively. Bank as §6 carry-forward observation for ADR-0011 §15 amendment review (potential editorial clarification at Phase 5.1 retrospective).

### §3.c Two-artifact decomposition adjudication

**Option (i) — Single commit ships both artifacts.** One commit shipping leaf registration (artifact a) + enforcement code (artifact b) + integration tests. Tight coupling between docs and code; both reference each other; bidirectional reachability verification can run at single-commit grain.

**Option (ii) — Two commits sequenced.** Commit (a) ships leaf registration (governance docs only); Commit (b) ships enforcement code + integration tests + bidirectional reachability annotation in code. Honors layer-by-layer review shape (governance review separate from code review).

**Option (iii) — Three commits sequenced.** Commit (a) ships leaf in ledger_truth_model.md; Commit (b) ships invariants.md rollup + control_matrix.md row; Commit (c) ships enforcement code. Per-document review grain.

**Adjudication.** Option (i) preferred. Reasons:

1. **Bidirectional reachability verification.** invariants.md verification command requires both leaf in ledger_truth_model.md AND annotation in code to pass diff check. Two-commit split risks one-commit-only failing the diff. Single commit preserves push-readiness gate Condition 2 (doc-sync reconciled) at every commit.
2. **Phase 2.5 Commit shape precedent.** Phase 2.5 shipped ADR-amendment-cycle commits each containing tightly-coupled doc changes (substantive + cross-references). Single-commit shape per Phase 2.5 Commit A's example: one commit for one substantive amendment + all cross-references in same commit.
3. **Sub-Q1 impact.** If Sub-Q1 picks chunked decomposition (1.β or 1.γ), INV-DOC-001 chunk groups artifacts a + b in a single chunk. If Sub-Q1 picks single-cycle (1.α), both artifacts ship in the same broader commit. Option (i) compatible with both Sub-Q1 dispositions.

**Round 3 lock target.** §3.c decomposition adjudication = Option (i) (single commit ships both artifacts).

---

## §4 — Sub-Q4.5 walk (NEW): inline-vs-evidence-service surface

### §4.1 Refined framing from Round 1 Finding 5

Round 1 Finding 5: `apps/web/src/services/evidence/` exists with only `.gitkeep` (zero-byte; verified at Round 2 Bash). Per Phase 6 retro §6.b: "first realization at Phase 5.1 reviewer-side surface design."

Phase 5.1 INV-DOC-001 enforcement code (artifact b at §3.b) needs an enforcement surface. Two options:

### §4.2 Disposition options

**4.5.α — Inline at billService.post().**

INV-DOC-001 enforcement code lives in billService.post() per §3.b.ii. The 5-line check (`if (!override && !primary) throw`) + the 7-line documentLinkService.create() call (§3.b.iii) sit inside billService.post() function body.

- Pros: Simpler; one service surface; tight coupling; RI-1 compliant (N=1 consumer at v1).
- Cons: Future DOC-prefix invariants (INV-DOC-002+ when reserved per ADR-0011 §15 framing) need similar Layer 2 enforcement; inline-at-billService doesn't extend.

**4.5.β — Evidence-service introduction at `apps/web/src/services/evidence/`.**

New service `evidenceService.checkBillCompleteness(input, ctx)` (or analogous shape) called from billService.post(). Surface:

```typescript
// apps/web/src/services/evidence/evidenceService.ts (new)

export const evidenceService = {
  async checkBillCompleteness(
    input: { primary_document_id?: string; override_evidence_completeness: boolean },
    ctx: ServiceContext,
  ): Promise<void> {
    if (!input.override_evidence_completeness && !input.primary_document_id) {
      throw new ServiceError(
        'POST_FAILED',
        'EVIDENCE_INCOMPLETE: bill commit requires primary_document_id ' +
        'or override_evidence_completeness=true (INV-DOC-001)',
      );
    }
  },
};
```

billService.post() calls `await evidenceService.checkBillCompleteness({...}, ctx)` at §3.b.ii's enforcement site.

- Pros: Extensible to future DOC-prefix invariants (INV-DOC-002, INV-DOC-003, ...); matches Phase 6 retro §6.b "first realization at Phase 5.1 reviewer-side surface design" framing; cleaner separation; testable in isolation.
- Cons: Slightly more LOC (new service file + Zod schema for input); premature abstraction risk per RI-1 (N=1 current consumer); additional service-layer wrapping cost.

### §4.3 RI-1 N≥2 consumer-presence check

Per RI-1 discipline: introduce abstractions when N≥2 consumers materialize. Current state:

- **Current consumers of INV-DOC-001 enforcement:** N=1 (billService.post() only).
- **Anticipated future consumers:** paymentService.record() per Sub-Q2 = 2.β does NOT need INV-DOC-001 check (the bill already has evidence completeness at post() time; paymentService.record() doesn't re-check). Future DOC-prefix invariants (INV-DOC-002+) per ADR-0011 §15 framing would consume evidence-service but are not specified at v1.

**RI-1 verdict.** N=1 consumer-presence at v1. Phase 5.1 evidence-service introduction is **prophylactic abstraction** without N≥2 consumer-presence justification.

### §4.4 Phase 6 retrospective §6.b framing

Per Phase 6 retro §6.b: "`services/evidence/` substrate-allocation realization (chunk-3-Phase-4 carry-forward; the directory ships with `.gitkeep` at v1; first realization at Phase 5.1 reviewer-side surface design)."

Two readings of "first realization at Phase 5.1 reviewer-side surface design":

- **Reading (i):** Phase 5.1 ships the first evidence-service code (4.5.β). "Reviewer-side surface" = invariant-enforcement-reviewer; Phase 5.1's INV-DOC-001 enforcement is the first reviewer-side surface that realizes evidence/.
- **Reading (ii):** Phase 5.1 introduces inline enforcement; future reporting/AR-side phase realizes evidence-service for a reviewer-side reporting surface (e.g., "bills missing primary attachment" report). "Reviewer-side surface" = reporting surface for reviewers/auditors.

Reading (i) is the natural read at Phase 5.1 grain. Reading (ii) defers to a future phase.

### §4.5 Round 2 provisional lean: 4.5.α with retrospective flag

**Provisional lean: 4.5.α (inline at billService.post()) with explicit retrospective flag for future evidence-service consideration if N≥2 emerges.**

**Reasons:**

1. **RI-1 N≥2 threshold not met at v1.** Single consumer (billService.post()) doesn't justify abstraction introduction per RI-1 discipline. Prophylactic abstraction risks YAGNI violation.
2. **Phase 6 retro §6.b framing is not a hard mandate.** "First realization at Phase 5.1 reviewer-side surface design" reads as anticipation, not requirement. Phase 5.1 may realize evidence/ as inline-enforcement-with-retrospective-flag OR as evidence-service-introduction; both honor the anticipation if Phase 5.1 retrospective documents the disposition explicitly.
3. **Phase 5.1 retrospective documents the disposition.** Per Sub-Q7 (retrospective at `phase-5-1-retrospective.md` confirmed), the Phase 5.1 retrospective explicitly documents the inline-vs-evidence-service disposition + the retrospective flag for future evidence-service introduction if N≥2 consumer-presence materializes (e.g., AR-phase bill-equivalent surface; future DOC-prefix invariant per ADR-0011 §15).
4. **Smaller substrate footprint at Phase 5.1.** Inline shape adds ~5 lines to billService.post() + the documentLinkService.create() call. Evidence-service introduction adds ~30-50 LOC (new service + Zod schema + integration test ergonomics). Phase 5.1 amendment-cycle grain favors tighter substrate.
5. **`.gitkeep` substrate-allocation seat preserved.** evidence/ directory remains at `.gitkeep`-only; future realization unblocked. No regression on Phase 6 retro §6.b "first realization" framing — the realization moves from "Phase 5.1 ships evidence-service" to "Phase 5.1 documents the deferral with N≥2 future trigger."

**Counter-consideration.** If founder operational-signal at Round 3 review favors 4.5.β (premature abstraction acceptable in exchange for cleaner future extensibility), Round 3 locks 4.5.β instead. The decision is fundamentally a founder architectural preference call; Round 2 surfaces both options with substantive trade-off articulation.

**Round 3 lock target.** Sub-Q4.5 = 4.5.α at Round 3 unless founder pushes back at Round 3 review.

---

## §5 — Sub-Q1 narrowing + Path C invocation framing

### §5.1 Volume forecast refinement post-Round 2 dispositions

Post-Round-2 dispositions narrow Sub-Q1's volume forecast:

| Substrate | Volume (LOC) | Source |
|---|---|---|
| INV-DOC-001 artifact (a) — leaf registration + rollup + matrix row + code annotation | ~150-250 | §3.a per-doc additions; bidirectional annotation in billService.ts |
| INV-DOC-001 artifact (b) — Layer 2 enforcement code | ~50-100 | §3.b: PostBillInputSchema extension + 5-line check + documentLinkService.create() composition + adjacent-paths verify (verbatim-only edit) |
| INV-DOC-001 integration tests | ~150-300 | §3.b.iv three test cases |
| INV-DOC-001 ADR-0011 §15 cross-reference update | ~10-30 | Bank as part of artifact (a); minor edit citing graduation |
| INV-DOC-001 subtotal | **~350-680** | |
| paymentService.ts — greenfield service file | ~250-400 | Pattern B unwrapped function + header doc + Zod schema + service object export (mirror billService.ts shape; smaller surface) |
| paymentService Zod schemas | ~100-150 | `apps/web/src/shared/schemas/spend/recordPayment.schema.ts` or analogous |
| paymentService unit + integration tests | ~250-400 | Mirror billService.recordPayment test coverage |
| billService.recordPayment refactor (2.β partial) | ~80-150 | Internal call to paymentService.record(); remove inline JE composition + payment row insert + allocation insert; retain lifecycle_state update + bill audit + T5 dispatch |
| T2_new_payment trigger emission wiring at paymentService.record() | ~30-60 | Pattern B external-wrap variant; try/catch + log per P3-i F-J-4 |
| DispatchTriggerInputSchema extension to admit T2_new_payment branch | ~10-30 | `apps/web/src/shared/schemas/document-platform/dispatchTriggerInput.schema.ts` (or analogous) |
| paymentService subtotal | **~720-1190** | |
| vendor_credits + vendor_credit_applications migration | ~150-300 | Mirror vendor_prepayments substrate shape per migration 20240138000000 |
| ADR-0016 third amendment block | ~100-200 | §1 v1-active 6→8 + §3 pair-validity matrix cells + §6 cascade behavior cells |
| linked_entity_type CHECK constraint broadening + Zod schema widen | ~30-50 | Layer 1 CHECK admits vendor_credit + vendor_credit_application; Zod widen LinkedEntityTypeSchema (per Phase 6 retro chunk-2 lesson: "Layer 1 broadening implies Zod schema broadening") |
| TypeScript types regeneration (auto-generated) | ~50-100 | `apps/web/src/db/types.ts` regenerated per substrate change |
| vendor_credits β subtotal | **~330-650** | |
| **Phase 5.1 total** | **~1400-2520 LOC** | |

Round 1 forecast at §3 Sub-Q1: ~1500-2800 LOC. Round 2 refinement: ~1400-2520 LOC (slightly tighter; vendor_credits β narrows due to no-service-surface; INV-DOC-001 narrows due to single-commit option (i) at §3.c).

### §5.2 Sub-Q1 disposition shapes

**1.α — Single amendment cycle.** Phase 5.1 ships as a single sequenced commit trail (commits A → B → C or A → B → C → D per substrate-grain split within the cycle). ~1400-2520 LOC in single cycle. Per RI-7 single-session ceiling at ~2000 LOC empirical (Phase 6.5 codification): tight at upper bound; upper-bound shape (~2520) is single-session-feasible IF the cycle is sequenced over multiple sessions (Phase 2.5 ran commits A + B + C over 2 sessions). Lower-bound shape (~1400) is comfortably single-session-feasible.

**1.β — Three-chunk decomposition.**
- chunk 5.1a — INV-DOC-001 (~350-680 LOC; single-session-feasible)
- chunk 5.1b — paymentService (~720-1190 LOC; single-session-feasible)
- chunk 5.1c — vendor_credits β (~330-650 LOC; single-session-feasible)

Conservative; each chunk has natural fault line at substrate-shape grain.

**1.γ — Partial chunked.**

Sub-variants:

- **1.γ-i — INV-DOC-001 + vendor_credits β paired; paymentService standalone.**
  - chunk 5.1a — INV-DOC-001 + vendor_credits β (Phase-5-substrate-adjacent; both touch reserved-candidate-graduation; ~680-1330 LOC)
  - chunk 5.1b — paymentService standalone (greenfield service introduction; ~720-1190 LOC)
- **1.γ-ii — INV-DOC-001 standalone; paymentService + vendor_credits β paired.**
  - chunk 5.1a — INV-DOC-001 standalone (governance-document + Layer 2 enforcement; ~350-680 LOC)
  - chunk 5.1b — paymentService + vendor_credits β (both service-layer-related; ~1050-1840 LOC; tight at upper bound)
- **1.γ-iii — paymentService + INV-DOC-001 paired; vendor_credits β standalone.**
  - chunk 5.1a — paymentService + INV-DOC-001 (both AP-foundation-grade; paymentService.record() + billService.post() both touched; potential cross-chunk coupling friction; ~1070-1870 LOC)
  - chunk 5.1b — vendor_credits β standalone (substrate-only; ADR-0016 amendment; ~330-650 LOC)

### §5.3 Sub-Q1 provisional lean: 1.γ-i

**Provisional lean: 1.γ-i (INV-DOC-001 + vendor_credits β paired; paymentService standalone).**

**Reasons:**

1. **Substrate-grain alignment.** chunk 5.1a (INV-DOC-001 + vendor_credits β) groups the two substrate-amendment-grade artifacts: both touch Phase 2.5 / Phase 5 reserved-candidate-graduation. Both have ADR amendment block deliverables (ADR-0011 §15 reservation-graduation note for INV-DOC-001; ADR-0016 third amendment block for vendor_credits β). Per Phase 2.5 Commit B convention, ADR amendments are additive provenance-preserving; pairing them in one chunk preserves cross-amendment review at single commit grain.
2. **Service-grain alignment.** chunk 5.1b (paymentService standalone) is the only chunk introducing a new service file + Zod schemas + T2 dispatcher activation + billService.recordPayment refactor. Service-grain work has its own review shape (Two Laws verification, withInvariants wrap site, INV-SERVICE-001/002/AUTH-001 inheritance, T2 dispatcher emission test) that benefits from focused chunk review.
3. **Volume balance.** chunk 5.1a (~680-1330 LOC) + chunk 5.1b (~720-1190 LOC) are well-balanced per Phase 6.5 chunk grade. Neither chunk exceeds RI-7 single-session ceiling at empirical ~2000 LOC.
4. **Dependency ordering.** chunk 5.1a (INV-DOC-001 + vendor_credits β) ships independently. chunk 5.1b (paymentService) depends on Phase 4 chunk 3 T2 dispatcher slot reservation (already shipped) + bidirectional T2 activation in DispatchTriggerInputSchema (greenfield at chunk 5.1b). No cross-chunk dependency that forces ordering, but chunk 5.1a → chunk 5.1b ordering is natural (substrate amendments before service introduction; consistent with Phase 5 retro §6 framing on substrate-first).

**Path C invocation evaluation per RI-7.** 1.γ-i is **two-chunk decomposition**; Path C invocation does NOT fire prospectively at Phase 5.1 brief-draft. Each chunk fits single-session-ceiling; reactive Path C availability through implementation per F-J-14 mid-impl-reactive grain (third grain in Path C three-grain catalog).

**Sub-Q1 sub-decision: chunk ordering.** chunk 5.1a → chunk 5.1b. Reasons:
- Substrate amendments before service introduction (Phase 5 retro §6 framing).
- INV-DOC-001 enforcement at billService.post() is independent of paymentService introduction.
- vendor_credits β is independent of paymentService introduction.
- paymentService introduction has no dependency on INV-DOC-001 or vendor_credits β substrate (paymentService.record() doesn't touch source_document_links or vendor_credits tables).

**Round 4 lock target.** Sub-Q1 = 1.γ-i at Round 4 (per directive §5.3 final lock at Round 4 per cycle precedent).

---

## §6 — Round 2 close + Round 3 scope projection

### §6.1 Round 2 dispositions banked

| Sub-Q | Round 2 disposition | Round | Lock target |
|---|---|---|---|
| Sub-Q1 — decomposition | **1.γ-i lean** (INV-DOC-001 + vendor_credits β paired; paymentService standalone) | Round 4 | per directive cycle precedent |
| Sub-Q2 — paymentService extraction scope | **2.β lean** (partial extraction; payment-flow primitive at paymentService.record(); AP-domain orchestration retained at billService.recordPayment) | Round 3 | provisional → lock |
| Sub-Q3 — vendor_credits scope | **β LOCKED** at Round 2 onset | (locked) | n/a |
| Sub-Q4 — INV-DOC-001 enforcement | Two-artifact obligation walked (artifact a + artifact b); §3.c decomposition = Option (i) single commit | Round 3 | provisional → lock |
| Sub-Q4.5 — inline-vs-evidence-service (NEW) | **4.5.α lean** (inline at billService.post() with retrospective flag for future N≥2 evidence-service consideration) | Round 3 | provisional → lock |
| Sub-Q5 — ordering across substrates | chunk 5.1a → chunk 5.1b ordering surfaced; depends on Sub-Q1 lock | Round 4 | depends on Sub-Q1 |
| Sub-Q6 — artifact location | `docs/09_briefs/phase-5.1/` (locked at Round 1) | (locked) | n/a |
| Sub-Q7 — retrospective placement | `phase-5-1-retrospective.md` standalone (per Phase 6.5 7.α precedent) | Round 2 | **lock now** |

**Sub-Q7 lock.** `docs/07_governance/retrospectives/phase-5-1-retrospective.md` per Phase 6.5 7.α precedent. The convention-inconsistency observation from Round 1 §3 Sub-Q7 (Phase 2.5 7.β append vs Phase 6.5 7.α standalone vs Phase 6.5-codification-arc-sequence 7.γ sibling synthesizing) carries forward: Phase 5.1 picks 7.α (standalone) per Phase 6.5 precedent. The convention-inconsistency itself is the codification candidate if a fourth amendment-cycle picks a fourth shape; banked per Round 1 §6.3.

### §6.2 Round 3 scope projection

**Round 3 primary walks:**

- Sub-Q2 lock (2.β confirm OR founder push-back to 2.α / 2.γ; substantive walk on T2 + T5 dispatch separation; method naming + canonical action name)
- Sub-Q4 lock (artifact a + artifact b decomposition = Option (i) confirm; §3.b enforcement code shape sub-decisions: error code surface, integration test specifics, billService.post() PostBillInputSchema extension shape)
- Sub-Q4.5 lock (4.5.α confirm with retrospective flag OR founder push-back to 4.5.β; if 4.5.β, evidence-service file naming + surface shape walked)
- Sub-Q5 surface (chunk ordering finalize per Sub-Q1 lean; cross-chunk dependency analysis)

**Round 3 secondary walks (if scope permits):**

- Per-chunk acceptance criteria + rollback posture + test matrix (per v3 §9 Decision 5 + CTO Condition 5) — typically Round 6 territory; surface at Round 3 if 1.γ-i locks early.
- Two Laws verification scope (INV-SERVICE-001/002 + INV-AUTH-001 inheritance per chunk).

### §6.3 Carry-forward observations

1. **N=16 candidate (c) catalog.** Brainstorming-arc grain at N=10 of N=16 (highest-firing). Retrospective-authoring grain at N=1 (Phase 5.1 retrospective writeup is future N=2 graduation candidate).
2. **ADR-0011 §15 "adjacent commit paths" phrasing.** §3.b.v verify-from-disk surfaced that adjacent commit paths reduce to billService.post() only (no other path inserts bills). ADR-0011 §15's "adjacent commit paths" framing is over-cautious; Phase 5.1 retrospective documents this as potential editorial clarification for future ADR-0011 amendment.
3. **vendor_credits β migration LOC undershoots Phase 5 vendor_prepayments shape.** Phase 5 migration 20240138000000 shipped vendor_prepayments + vendor_prepayment_applications + payments column extensions in 272 LOC. β shipping vendor_credits + vendor_credit_applications mirror (no payments column extensions; no ADR-0011 §15 stub since INV-DOC-001 ships enforcement separately) likely runs ~150-300 LOC.
4. **DispatchTriggerInputSchema extension is shared substrate.** paymentService chunk and vendor_credits β chunk both could extend DispatchTriggerInputSchema (paymentService adds T2; vendorCreditService would add T4+T6 but β skips it). Phase 5.1 paymentService chunk owns T2 extension; T4+T6 extension stays deferred per Refinement 2.
5. **Retrospective-authoring grain candidate.** Phase 5 retro §6:404 vendor_credits assertion correction (Round 1 §2.4 finding 1) banked as N=1 retrospective-authoring grain instance. Phase 5.1 retrospective writeup may surface N=2 retrospective-authoring grain instance if assertion-without-verify-from-disk fires during draft. Codification threshold approaches.

### §6.4 Round 3 prompt inputs

Round 3 prompt should:

- Re-cite Round 1 + Round 2 dispositions (Sub-Q3 = β + Sub-Q7 = 7.α locked; Sub-Q2 2.β + Sub-Q4.5 4.5.α + Sub-Q1 1.γ-i leans)
- Surface founder operational-signal call on:
  - Sub-Q2 = 2.β lock or push-back
  - Sub-Q4.5 = 4.5.α lock or push-back (if push-back, evidence-service surface design walked at Round 3)
  - Sub-Q1 = 1.γ-i lean for Round 4 lock
- Walk Sub-Q4 implementation details (artifact a + artifact b sub-shapes; integration test specifics; error code surface)
- Surface chunk ordering finalize per Sub-Q5

---

**Round 2 status:** complete. Single-session-execute-and-close per directive. Awaiting Round 3 prompt drafting (Sub-Q2 + Sub-Q4 + Sub-Q4.5 lock walks + Sub-Q1 prep for Round 4 lock).
