# CHOUnting System Overview — CTO Review Package V4

**Title:** CHOUnting System Overview: Architecture, Decisions, and Capability Standard
**Date:** 2026-05-24
**Version:** V4 (re-grounded against HEAD)
**Status:** CTO review draft — ready for sending
**Filed:** top-level governance artifact at `docs/07_governance/SYSTEM_OVERVIEW_CTO_REVIEW_V4.md`, matching the `CTO_HANDOFF_V2` / `DOCS_RESTRUCTURE_V*` precedent. A `07_governance/proposals/` document-class subfolder was considered and **deferred to N=2** per the docs-tree folder guardrail (`docs/README.md` ambiguous-case rule → would require a ratifying ADR; top-level placement is an already-permitted pattern, so no ADR is warranted at N=1).
**Supersedes:** "CHOUnting CTO Review Package V3 — Final" (system-overview draft, never committed to repo)
**Distinct from:** `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md` (a *different*, already-signed-off proposal about the Phase 6.5 shell consolidation — the "V3" name collision that motivated this rename)
**Grounding anchor:** every 🟢/🟡/🔴 status cell and every file:line citation in this document was verified against `staging` at commit **`5eade62f`** (tree clean of tracked changes, 2026-05-24). Re-verify against the SHA you send if HEAD has advanced.
**Format:** Two-layer package — Executive Decision Memo (this document) + Appendices A–J (reference only; several appendices are authoring stubs, flagged in the index).
**Length target:** Executive memo readable in 8 minutes; full proposal walkable in 30; appendices reference only.

---

## §0 Revision note — what changed from V3, and why

V3 was reviewed against HEAD and the current-state grounding was found to be written from an earlier snapshot. One staleness is structural (not cosmetic): **the document pipeline now auto-commits ledger mutations through a system-actor bypass, with no Agent Ladder enforcement on the path** — which directly contradicts a V3 non-goal and reframes the single most important architecture decision. The other corrections are accuracy/freshness.

The substantive changes in V4:

1. **New lead section §2.5 — Auto-Commit Reconciliation.** States the live behavior shipped 2026-05-24, the ADR-0007 Q78 bypass, and the unreconciled ADR-0014 §11. This flips Decision 2 from "build the gate before the feature" to "retrofit the gate onto the already-live feature." This is the most important change in the package.
2. **§2 re-grounded** with a 🟢/🟡/🔴 legend applied consistently, corrected cells, and shipped-but-previously-omitted capabilities added (multi-currency, recurring journals, adjusting entries, atomic RPC, `events` reserved seat, intercompany substrate, `org_settings`, payment.record permission, Tier A classifier recalibration).
3. **🟢/🟡/🔴 discipline extended** to the §4 diagram, the §5.3 Ladder-presence table, and the §12 evidence chain, so a target diagram cannot be mistaken for shipped wiring.
4. **§12 / §5.6 target-vs-shipped labels.** The Logic Receipt and the memory-promotion ladder are explicitly labeled *target schema, not yet wired*. The `vendor_rules` promoted schema (ADR-0017) was **never migrated** — the live table uses the older `autonomy_tier` enum.
5. **Decision 4 justification reframed.** The "Bridge naming collision" is *prospective* (introduced by V3's product framing of "The Bridge" as the UI shell), not present in the repo. Justification reframed as "adopt precise layered vocabulary to enable the connector-authority-semantics model."
6. **§7 product claims toned** from "ratified" to "spec-defined / partially implemented." One named UX pattern (`triage_bucket_intake`) is formally SUPERSEDED.
7. **§9 capability template** reframed as default-with-escape; to be validated on AR before being mandated slice-wide.
8. **§13 doc-creation plan** now routes new docs through the ADR-0022 supersession/status-header workflow.
9. **Pre-flight gap-closers (post-draft patch, 2026-05-24):** named the Two Laws of Service Architecture (§5); restored the three degraded-mode operational guarantees (§11.3); added the multi-framework declaration note (§9.3); stated the Domain Event / Audit Event / Logic Receipt tripod in one place (§12.0); footnoted the SharePoint two-sub-arc distinction (§13.3).
10. **Pre-flight V2 gap-closers (post-draft patch, 2026-05-24):** added the *capability providers produce candidates, not domain truth* principle (§4); the *discovery is not authority* principle for bidirectional Connectors (§8.2); surfaced the **Unified Work Inbox** as the work-centric user surface (§10); aligned the multi-entity spine component list (§13.2 ↔ §10.2); clarified AR substrate status in the §13.3 sequence.

A correction ledger with the exact before/after for every cell is in **Appendix K** (new).

---

## §1 Executive Summary

CHOUnting is an invariant-enforced accounting system where agents participate through typed tools, propose consequential work, operate external systems through connectors, and leave evidence, approvals, and audit trails behind every action. The substrate is real and shipped; the target architecture is roughly half-built.

**Headline finding (new in V4):** as of 2026-05-24 the document pipeline **auto-commits matched ledger mutations** via a seeded system-actor service account that **bypasses the user-authority gate (`canUserPerformAction`) and runs no Agent Ladder rung or system-ceiling check** (the INV-AGENT invariants are not registered). The feature shipped ahead of the trust architecture meant to gate it. See §2.5. This does not weaken Decision 2 — it makes it urgent and changes its framing from prevention to remediation.

This proposal asks the CTO to approve six architecture decisions and acknowledge two product framings.

### Required architecture decisions

| # | Decision | Reason |
|---|---|---|
| 1 | Adopt the five-section runtime architecture | Locks canonical system overview |
| 2 | Promote Agent Ladder to structural spine; bind Settings to its policy side; **retrofit Ladder enforcement onto the already-live auto-commit path before any new auto-post surface** | Prevents permissions-feature misframing and unsafe configuration; closes the live gap in §2.5 |
| 3 | Position eval/replay as vertical sidecar that validates the immutable evidence substrate (does not replace it) | Prevents agent-output-testing misframing; preserves audit defensibility |
| 4 | Rename integration layer to "External Systems Layer"; adopt Connector vocabulary for families inside it | Adopt precise layered vocabulary to enable the connector-authority-semantics model (prevents a *prospective* "Bridge" collision — see §8.0) |
| 5 | Adopt the capability-slice model with a tiered template (Lite + Full) as the default standard for new accounting features | Prevents drift to module-shaped thinking |
| 6 | Build the domain events / outbox spine before major capability expansion | Prevents async coordination chaos in AR, banking, bridges (the `events` reserved seat already exists — §2, §11) |

### Recommended product framings (not binding architecture)

| # | Framing | Purpose |
|---|---|---|
| 7 | CHOUnting Agent Chat / Cowork / Code as the user-facing modes, analogous to the Claude product family | User-facing positioning |
| 8 | The Bridge as the product UI shell (three-zone: workspace tabs / agent chat / contextual canvas) | Differentiates from "Claude with accounting tools" |

### Non-goals

This proposal does not approve:

- Building broad income tax advice now (tax research is the highest-risk slice and sequences last)
- Building payroll from scratch (likely integrate Wagepoint/Payworks rather than build)
- Replacing QBO/Xero/Sage immediately (external ledger connector is a future option)
- Making SharePoint folder location authoritative (§8.2 framing: bytes are external; meaning is CHOUnting's)
- Allowing settings to bypass system ceilings (system-vs-policy boundary is schema-enforced)
- **Expanding agent ledger-mutation autonomy beyond the already-live auto-commit path until Ladder enforcement is retrofitted onto it.** (V3 stated this as "agents may not mutate ledger state outside service/Ladder controls"; that is now factually inaccurate — see §2.5. The honest non-goal is *no new auto-post surface before the Ladder gates the existing one*.)

---

## §2 Current-State Grounding

CHOUnting is not starting from zero. The proposal is anchored in a working codebase at `5eade62f`.

**Legend.** 🟢 Shipped (table + service + route/consumer, live). 🟡 Partial / substrate-only (some layers present; not a complete product surface). 🔴 Missing (no substrate).

| Area | Status | Notes (file:line where load-bearing) |
|---|---|---|
| Ledger truth model (**21** invariants) | 🟢 | Layer 1a/1b/2; INV-DOC-001 is the 21st (Phase 5.1). `invariants.md` reachability statement says 21; the `## The 20 invariants` heading is stale prose. Reversal semantics per ADR-0001. |
| Multi-currency infrastructure | 🟢 | `amount_original`/`amount_cad`/`fx_rate` triad on `journal_lines`, `invoices`, `bills`, `bank_transactions`, vendor prepayment/credit tables. DB CHECK enforcement (`amount_cad = ROUND(amount_original * fx_rate, 4)`) is on `journal_lines` only — INV-MONEY-002/003, `initial_schema.sql:238–241`. *Load-bearing for the multi-entity base/reporting-currency story (§10.2).* |
| Recurring journal templates | 🟢 | `recurring_journal_templates/_lines/_runs` (`20240131000000`); `recurringJournalService.ts`; routes under `/api/orgs/[orgId]/recurring-templates` + `/recurring-runs`; INV-RECURRING-001 deferred constraint trigger. |
| Adjusting entries | 🟢 | `entry_type='adjusting'` + CHECK `adjustment_reason_required_for_adjusting`; INV-ADJUSTMENT-001 (`20240128000000`). |
| Atomic journal RPC | 🟢 | `write_journal_entry_atomic(p_entry, p_lines, p_audit)` — header + lines + audit in one COMMIT envelope (`20240134000000`). |
| AP / Spend subdomain | 🟡 | Bills/payments/allocations + 7-state lifecycle (ADR-0015) are 🟢. **Prepayments = service, no routes** (`vendorPrepaymentService.ts`); **credits = tables only, no service, no routes** (`vendor_credits` `20240156000000`; `vendorCreditService.ts` does not exist). Both deferred post-v1 per Phase 5 retro. (V3 said "shipped incl. prepayments, credits" — corrected.) |
| Document Platform substrate | 🟢 | `source_documents`, `document_cases`, `document_artifacts`, `source_document_links` (ADR-0011/0016/0018). |
| Document pipeline (**8 canonical stages**, Stage 0–7) | 🟢 | Modal/PaddleOCR sidecar + Tier C Claude fallback (ADR-0014 §1; Phase 7). Runtime emits 10 parent `stage_name` values + 2 AI-fallback children (12 distinct) per the 2026-05-23 §1 amendment. (V3 said "9 stages" — matches none of 8/10/12; corrected to the 8 canonical.) |
| Tier A classifier (real-OCR recalibrated) | 🟢 | `tierCoordination.ts` + per-type rule modules recalibrated against a 10-doc real-OCR corpus (Session 71): shape-discriminating positives, receipt-header carve-out, asymmetric precedence. *Reliability fact: the classifier was over-broad on real OCR before this fix.* |
| Exception queue | 🟢 | `resolution_action` enum = **18 values** (9 v1-active); one-open-per-case partial unique index (`20240148000000`). (V3 said 17 — corrected.) |
| Storage provider abstraction | 🟢 | ADR-0013; Supabase v1-active; SharePoint reserved. `sharepoint_durability_mode` is ADR-text-only — **not yet a migrated column**. |
| Forwarded mailbox ingestion | 🟢 | Postmark inbound webhook (HMAC-verified) + `ingestionService`; webhook convention (Phase 6.3a). |
| Agent substrate | 🟢 | `agent_sessions` (turns is a JSONB *column*, not an `agent_turns` table); `ProposedMutation` Zod; Logic Receipt = `ProposalJustificationSchema` Zod (no `logic_receipts` table); three-tier (ADR-0007). |
| Authority infrastructure | 🟢 | `roles`/`permissions`/`role_permissions` (the migration is named `permission_catalog`; there is no table by that name); MFA (Supabase Auth); `canUserPerformAction`; `withInvariants`; `recordMutation`. `payment.record` permission added (`20240162000000`; catalog 29→30). |
| `org_settings` substrate | 🟢 | 5 v1-active columns (fallback order, AI budget, vendor-match threshold, GC cadence) + 6 null-default calibration columns (ADR-0019) (`20240158000000`). |
| **Auto-commit (system-actor) path** | 🟢 **live, ungated by Ladder** | `ingestDocument.ts` auto-commits matched mutations via `SystemActorServiceContext`; `withInvariants` bypasses the user-authority + identity invariants; **no Ladder rung/ceiling check**. See §2.5. (V3 framed this as future work.) |
| Reporting RPCs | 🟡 | `get_profit_and_loss` (= income-statement data), `get_trial_balance`, `get_balance_sheet`, `get_account_balance`, `get_account_ledger`, `get_accounts_by_type`. **No snapshots.** (V3 said "no income statement" — the gap is snapshots, not the statement; corrected.) |
| Vendor template / rules substrate | 🟡 | ADR-0017 exists, **but its promoted schema was never migrated.** Live `vendor_rules` has the older `autonomy_tier` enum (`always_confirm`/`notify_auto`/`silent`); `vendor_rule_rung`, `promotion_authority`, `clean_approval_count` appear in **zero migrations** — ADR/doc prose only. Enforcement deferred. |
| Pure core extraction | 🟡 | ADR-0020; `apps/web/src/core/` exists with READMEs only; empty of `.ts`. |
| Agent Ladder enforcement | 🟡 | INV-AGENT-001 through 006 reserved in `agent_autonomy_model.md`; **not registered** in `invariants.md`/`control_matrix.md`. *And not on the live auto-commit path — §2.5.* |
| Eval / replay substrate | 🟡 | `ingestPipelineHarness.ts` + 3 `documentPipeline.*.e2e.test.ts` (RUN_MODAL_E2E gate) + `autoCommitGate.integration.test.ts` + `tier-c-empirical-exercise.ts`. **No `eval_fixtures`/`eval_runs` tables.** (V3 said "Missing / ad-hoc" — understated; corrected to 🟡.) |
| AR / Invoicing / Customers | 🟡 | `customers`/`invoices`/`invoice_lines` tables exist from initial schema with multi-currency columns (`initial_schema.sql:365/381/398`). **No service, no routes.** (V3 said 🔴 Missing — corrected: substrate present, breadth absent.) |
| Bank reconciliation | 🟡 | `bank_accounts`/`bank_transactions` tables exist (multi-currency) (`initial_schema.sql:456/466`). **No reconciliation service/table.** (V3 said 🔴 Missing — corrected.) |
| Multi-entity / consolidation | 🟡 | `intercompany_relationships` table reserved ("Populated in Phase 2 by AP Agent") (`initial_schema.sql:158`); `is_intercompany_entity_id` on vendors; `legal_entity_id` on storage/spend tables (v1 1:1 org mapping). **No `entity_group`/`consolidation_scope`/`related_party`.** (V3 framed multi-entity as completely missing — corrected to thin substrate.) |
| `events` domain-event reserved seat | 🟡 | `events` table exists with append-only triggers + REVOKEs (INV-LEDGER-003) and comment "Nothing writes here until Phase 2." **The outbox spine has a reserved, physically-append-only seat from day one** — de-risks Decision 6. |
| Domain events / outbox spine (writers + dispatch) | 🔴 | No producer/consumer/dispatch infrastructure; the `events` seat has no writers. Highest-leverage infrastructure gap. |
| GST/HST filing workflow | 🔴 | Tax codes seeded are **GST (5%) + PST_BC (7%)** — no HST seed; no filing service/table. (V3 said "GST/HST seeded" — corrected.) |
| Report snapshots | 🔴 | Reports run live, not snapshotted (no snapshot tables). |
| External connectors beyond storage | 🔴 | QBO, Plaid/Flinks, CRA, calendar, outbound comms — none. |
| Engagement context | 🔴 | Deferred unless firm market commits. |

The right load-bearing pieces are real. Cross-cutting infrastructure is decided but mostly unbuilt. Breadth pieces are future work. **One piece of cross-cutting infrastructure (auto-commit) shipped ahead of its governance layer — §2.5.**

---

## §2.5 Auto-Commit Reconciliation (state of the live system as of 2026-05-24) — LEAD FINDING

This section is new in V4 and is the most consequential change to the package. It is the reason Decision 2 reframes.

### What shipped

The auto-commit arc — four commits present at HEAD: `60b89106` (system-actor service-account substrate), `edb260f6` (open the commit gate), `c67801ec` (seeded gate validation), `8a6c9bc3` (arc closeout); ratified by `a940ec6f` (ADR-0007 auth-model) — made the document pipeline **auto-commit matched ledger mutations** with no human approval and no Agent Ladder check. It is live on `staging`.

Exact anchors (verified at `5eade62f`):

- **`ingestDocument.ts:440–449`** — comment: *"The pipeline now auto-commits matched ledger mutations. See ADR-0007 §Tier 2 (Q78 resolution) + service-layer.md Candidate #11 (RETIRED)."* The `synthCtxForCommit` shim is retired; the orchestrator passes its `SystemActorServiceContext` directly to the commit-path `withInvariants` sites.
- **Four `withInvariants(SystemActorServiceContext)` commit sites** in `ingestDocument.ts`: line 535 `billService.post` (`bill.post`) and line 544 `paymentService.record` (`payment.record`) in `commitProposedEntryCard`; line 605 `billService.post` and line 631 `paymentService.record` in `commitProposedMutationBundle`.
- **`withInvariants.ts:58–109`** — system-actor branch (conditional at line 68 `if (isSystemActorContext(ctx))`) **bypasses Invariant 1 (`user_id` presence), Invariant 2 (`verified`), and Invariant 4 (role authorization via `canUserPerformAction`)**. Invariant 3 (org-consistency, `ctx.org_id === input.org_id`) and the `trace_id` check still run. It then commits *as* the seeded service account so `created_by`/audit `user_id` resolve to a real, joinable identity.
- **`serviceContext.ts:67`** — `SYSTEM_ACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a1'`; `SystemActorServiceContext` type at lines 80–84.
- **`autoCommitGate.integration.test.ts`** — proves a real bill commits attributed to the system actor: line 197 `expect(billAudit![0].user_id).toBe(SYSTEM_ACTOR_USER_ID)`; lines 229–238 prove the payment/allocation path the same way.
- **ADR-0007** — Q78 resolution block (lines 619–632) + inline §Tier 2 block (lines 267–283): **Option A — system actor bypasses the identity-coupled invariants** (Inv 1/2/4); trust boundary is the orchestrator that constructs the context. Lines 117–121: *"The Agent Ladder … and the tier policy are **orthogonal** … They operate in different dimensions and do not interact."*

### Where the gate is missing

The auto-commit path runs **no Agent Ladder rung check, no system-ceiling check (INV-AGENT-001 through 006 are not registered), and bypasses `canUserPerformAction`.** ADR-0007 treats the Ladder and the tier policy as *orthogonal* — not as gate-before-commit. And **ADR-0014 §11 is unreconciled**: it still reads *"Tier 1 commit-time confirmation per ADR-0007 (auto-post deferred post-v1 per spec §11)"* at line 1004 (and again at line 1859). A whole-file search for `2026-05-24` in ADR-0014 returns zero — ADR-0007 closed Q78, but ADR-0014 was never amended to match the shipped behavior.

This is the V3/V4 §16 Risk #2 ("Agent Ladder becomes a permissions checkbox; the trust architecture quietly evaporates") **partially realized in production.**

### What this means for Decision 2

Decision 2 is a **remediation** decision, not a future-prevention decision. The Ladder must be retrofitted onto the already-live system-actor path **before any new auto-post surface ships.** Concretely:

1. **INV-AGENT-001 (system-ceiling check)** registers on the *existing* commit sites in `ingestDocument.ts` (lines 535/544/605/631), not on hypothetical future ones.
2. **Phase B item "Agent Ladder pure-rule math in `core/agent-ladder/`"** becomes load-bearing-now, not preparatory — it gates the live path.
3. **ADR-0014 §11 needs an amendment block** reconciling "auto-post deferred post-v1" with shipped behavior (V4 ships alongside a proposed ADR-0014 §11 amendment — see Appendix L).
4. The CTO is asked to approve Decision 2 *with this remediation framing.*

This is the section that changes the urgency of the entire proposal.

---

## §3 Product Framing (Recommended, Not Binding)

CHOUnting has three working modes analogous to modern AI work systems: conversational work, cowork-style operation in the user's real environment, and specialized domain execution. The Claude product family is the closest external analog.

### §3.1 The three modes

| Mode | Claude analog | What it is |
|---|---|---|
| CHOUnting Agent Chat | Claude Chat | Conversational primary surface — ask, instruct, get explanations, see proposals |
| CHOUnting Cowork | Claude Cowork | Agent operates the user's real accounting environment via Connectors (SharePoint, QBO, banks, CRA, calendar, email) |
| CHOUnting Code | Claude Code | Specialized accounting capability — services, rules, invariants, posting paths |

### §3.2 The two non-Claude differentiators

| Concept | Why no Claude analog |
|---|---|
| The Bridge | Product UI shell: three-zone layout (workspace tabs / agent chat / contextual canvas). Claude products are conversational; CHOUnting is conversational + canvas + workspaces. |
| The Agent Ladder | Trust architecture. Claude serves the user as sole principal. CHOUnting serves multiple principals. |

### §3.3 Principal multiplicity (the architectural reason for the Ladder)

CHOUnting operates with multiple principals whose claims on the books may diverge: the user, the entity (owns books that must be correct independent of any individual user), the auditor (reconstructable evidence seven years out), the tax authority (CRA — defensible filings with point-in-time-correct reasoning), and the accounting profession (framework constraints: ASPE / IFRS / tax basis).

Every architectural decision can be evaluated against: *does this preserve every principal's claim on the books?* The Agent Ladder, Logic Receipts, eval/replay, and the evidence chain all exist because the answer must be yes for all five. **The auto-commit path (§2.5) currently answers this question without the Ladder — which is precisely why Decision 2's remediation framing matters.**

### §3.4 What this means for explanations

Like Claude Chat, CHOUnting Agent Chat explains what it's doing. Unlike Claude Chat, those explanations are structured audit-bearing Logic Receipts — not free-form prose. *Today the Logic Receipt is a Zod schema (`ProposalJustificationSchema`) carried on a JSONB `justification` field, not a queryable immutable receipt store — see §12.2.* A CRA reviewer in 2032 must retrieve why the agent categorized a March 2026 expense, referencing the rule version, institutional-memory state, tax-provision text as it read at the time, and document evidence.

---

## §4 The Canonical System Overview Diagram

Status annotations: 🟢 shipped · 🟡 partial/substrate · 🔴 missing. (Applied so the target diagram is not read as shipped wiring.)

```
                     Eval / Replay Sidecar 🟡 (harness + e2e exist; no eval_* tables)
              fixture replay · model/provider diffs · regression tests
                  reconstruction validation · snapshot checks 🔴
                                │
        ┌───────────────────────┼────────────────────────┐
        │                       │                        │
        │   Authority Gradient ↓│  ↑ Structured Errors   │
        │   Agent Ladder Spine 🟡│  (substrate-only;       │
        │                       │   NOT on auto-commit    │
        │                       │   path — §2.5)          │
╔═══════╪═══════════════════════╪════════════════════════╪═══════╗
║       │                       │                        │       ║
║  Entry points produce Intents (Navigation/Mutation/Query) 🟡    ║
║  External events produce Domain Events 🔴 (no writers/dispatch) ║
║                                                                 ║
║  ┌────▼───────────────────────▼────────────────────────▼────┐  ║
║  │           Agent Control Plane 🟢                          │  ║
║  │  agent sessions · turns (JSONB) · tool calls              │  ║
║  │  rung-aware tool dispatch 🟡 · system ceilings 🟡 · gates  │  ║
║  └─────────────────────────────────┬─────────────────────────┘  ║
║                                    │ typed agent-tool contracts  ║
║                                    ▼                            ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │                  Domain Services 🟢                       │    ║
║  │  Subledgers · Transformations · Connector orchestrators 🔴│    ║
║  │  Consequential ops run through withInvariants 🟢          │    ║
║  │  ⚠ system-actor branch bypasses user-auth gate (§2.5)     │    ║
║  └────────┬──────────────────────────────────┬─────────────┘    ║
║           ▼                                  ▼                  ║
║  ┌────────────────────┐         ┌──────────────────────────┐    ║
║  │  Pure Core Rules 🟡 │         │  Capability Providers 🟢  │    ║
║  │  invariants 🟢 ·    │         │  OCR · LLM-as-capability │    ║
║  │  balance · locks 🟢 │         │  Tier C Claude fallback  │    ║
║  │  tax math 🔴 ·      │         │  health/degraded 🔴       │    ║
║  │  Ladder limit math 🔴│        │  tracking                │    ║
║  └────────┬──────────┘         └──────────────────────────┘    ║
║           ▼                                                     ║
║  ╔═══════════════════════════════════════════════════════════╗ ║
║  ║      CHOUnting Domain State / Meaning                     ║ ║
║  ║  Evidence Chain (see §12 — several nodes are TARGET):     ║ ║
║  ║  Documents 🟢 → Versions 🟢 → Pipeline 🟢 → Assertions 🔴 →║ ║
║  ║  Proposals 🟡(in-mem) → Approvals 🟡 → Posting Intents 🔴 →║ ║
║  ║  JEs 🟢 → Logic Receipts 🟡(Zod, no table) → Audit 🟢 →    ║ ║
║  ║  Domain Events 🟡(reserved seat, no writers)              ║ ║
║  ║  Ledger 🟢 · Subledgers 🟢 · Parties 🟡 · Reports 🟡 ·     ║ ║
║  ║  Snapshots 🔴 · Institutional Memory 🔴 · Filing State 🔴 ·║ ║
║  ║  Entity Groups 🔴 · Intercompany reserved seat 🟡         ║ ║
║  ║  CHOUnting owns meaning. Bytes may live elsewhere.        ║ ║
║  ╚═══════════════════════╤═══════════════════════════════════╝ ║
║                          ▼                                     ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │   External Systems Layer 🔴 (storage Connector 🟢 only)   │  ║
║  │   Connector families: Storage 🟢 · External Ledger 🔴 ·   │  ║
║  │   Bank Feed 🔴 · Filing Authority 🔴 · Communication 🟡   │  ║
║  │   (Postmark inbound) · Calendar 🔴 · Payment 🔴 ·         │  ║
║  │   Workpaper 🔴                                            │  ║
║  └──────────────────────────────────────────────────────────┘  ║
║                          ▼                                     ║
║          Providers: Supabase 🟢 · SharePoint(reserved) ·       ║
║          Postmark 🟢 · QBO/Plaid/CRA/Cal/Stripe 🔴             ║
╚═══════════════════════════════════════════════════════════════╝
```

Naming stack: **The Bridge** = product UI shell · **External Systems Layer** = integration architecture · **Connector families** = storage, ledger, bank feed, filing authority, communication, calendar, payment, workpaper · **Providers** = concrete adapters (SharePoint, QBO, Plaid, etc.). Appendix A holds the high-resolution diagram.

**Capability providers produce candidates, not domain truth.** OCR, LLM extraction (Tier C), and embedding retrieval emit *candidate* outputs (assertions, retrieved context) into the pipeline; **domain services decide what becomes CHOUnting state.** This is the architectural reason a provider can be swapped (PaddleOCR → another OCR engine; one Claude model → the next) without touching accounting meaning — and the reason no provider output writes ledger state directly.

---

## §5 The Agent Ladder Spine

The Agent Ladder is not a permissions feature. It is the trust architecture. **It is also currently bypassed on the one live ledger-mutation autonomy path (§2.5), which is why this section's status is 🟡 "substrate-only and not yet on the live path."**

**Foundational invariants the whole architecture inherits — the Two Laws of Service Architecture** (per `docs/02_specs/glossary.md`): *Law 1: all database access goes through `src/services/` only; Law 2: all journal entries are created by `journalEntryService.post()` only* — encoded by INV-SERVICE-001 / INV-SERVICE-002. Both are absolute and apply to every capability slice and every commit path. The auto-commit path (§2.5) runs *through* `withInvariants`/services, so it honors the Two Laws — it bends the *authority* gate (`canUserPerformAction`), not the Two Laws. A new slice author inherits both Laws by default.

### §5.1 Two separate gates

```
User authority:    canUserPerformAction(user, action, org)
Agent authority:   canRungPerformAction(rung, action, context)   ← NOT YET IMPLEMENTED
```

A consequential operation must pass BOTH gates. Today the user-authority gate is real and enforced for user-initiated mutations; the agent-authority gate does not exist as code, and the auto-commit path bypasses the user-authority gate entirely (§2.5).

### §5.2 The decision tree (target)

The canonical Ladder gates are steps 2–7; steps 1, 8, 9, 10 are the outer envelope (this is what V3 imprecisely called "the six-step decision tree" — there are six *gates* inside a ten-step envelope):

```
consequentialOperation(context):
  1.  assertUserCanPerformAction(user, action, org)        # envelope — 🟢 exists for users
  2.  assertSystemCeilingNotViolated(action, context)      # gate — 🔴 INV-AGENT-001 unregistered
  3.  resolveApplicableRung(rule, context)                 # gate — 🔴
  4.  assertRungCanPerformAction(rung, action)             # gate — 🔴
  5.  assertPerTransactionLimit(amount, rule.limit)        # gate — 🔴
  6.  assertPerDayAggregateLimit(org, day_remaining)       # gate — 🔴
  7.  assertTrackRecord(rule.recent_history)               # gate — 🔴
  8.  writePolicyEvaluation(outcome)                       # envelope — 🔴
  9.  writeLogicReceipt(structured_justification)          # envelope — 🟡 Zod schema, no table
  10. emitDomainEvent(if applicable)                       # envelope — 🔴 reserved seat, no writer
```

### §5.3 Where the Ladder lives in each layer (status-annotated)

| Layer | Ladder presence | Status |
|---|---|---|
| Agent Control Plane | Per-session rung context; tool eligibility map; orchestrator system-ceiling pre-check | 🔴 not implemented; **auto-commit path has no pre-check (§2.5)** |
| Domain Services | Decision tree runs via `withInvariants`; INV-AGENT-001–006 register as services land | 🟡 `withInvariants` exists; no Ladder gates in it; system-actor branch bypasses user-auth |
| Pure Core Rules | Four limit-dimension math; track-record evaluation; decision-tree logic separable from DB | 🔴 `core/` empty |
| Capability Providers | Model version captured in Logic Receipts so Ladder can demote rules on regression | 🟡 model metadata captured in `ProposalJustificationSchema` |
| Domain State | `vendor_rules.rung`; promotion/demotion audit; ceiling-hit audit; rule version history | 🔴 live table uses `autonomy_tier`; rung/promotion/clean_approval_count never migrated |
| External Systems Layer | Per-Connector system ceilings (e.g., CRA filing always Always Confirm) | 🔴 |

### §5.4 System vs Policy boundary

| Category | Configurable | Examples |
|---|---|---|
| System | Never | Locked periods, intercompany, equity, reversals, period-end adjustments, first-time vendors above floor, vendor bank-detail changes, CRA filing submission |
| Policy | By owner | Per-transaction limits, per-day aggregate, rung assignment, promotion criteria |

### §5.5 Settings binding (load-bearing CTO decision)

Settings UI is not free configuration. It is: the policy-side projection of the System-vs-Policy boundary; plus capability toggles; plus Connector configuration; plus formatting (numbering, payment terms, templates, tax settings, reporting framework).

Settings cannot: lower the system-ceiling list; raise per-day aggregate without owner-approval flow; promote rules without ceremony; bypass the Four Questions grammar. This binding is enforced at the service layer, not just at the UI. *(Note: `org_settings` substrate exists — `20240158000000` — but currently holds AI-pipeline tuning, not Ladder policy; the policy-side projection is unbuilt.)*

### §5.6 Memory promotion pattern (TARGET — not yet wired)

**Status label (new in V4): this is a target-state narrative. The substrate it assumes does not exist.** The live `vendor_rules` table uses the `autonomy_tier` enum; `clean_approval_count`, `current_rung`, `promotion_authority`, and the `vendor_rule_rung`/`vendor_rule_promotion_authority` enums appear in **zero migrations** (ADR-0017 prose only). The promotion ceremony, track-record counters, and demotion audit are unbuilt.

Target path:

```
User correction event
  → candidate memory (recorded, not yet a rule)
  → proposed rule (after threshold of consistent corrections)
  → user-approved rule (controller approval ceremony)
  → Agent Ladder rung assignment (defaults to Always Confirm)
  → future application with track record
  → promotion ceremony (Notify & Auto-Post or Silent Auto)
  → demotion possible at any time by any controller
```

Worked example (Bell Canada → "Telecom" → 3 consistent corrections → candidate → proposed rule → controller approval at Always Confirm → 15/15 track record → promotion to Notify & Auto-Post with $1,500 limit → auto-post with 24h reversible window → one-click demote) illustrates where institutional memory, the Ladder, the Four Questions, and Logic Receipts *will* compose once the schema is migrated and the gates are built.

---

## §6 The Eval / Replay Sidecar

### §6.1 What eval is and is not

Eval validates the audit substrate. Eval is not the audit substrate itself. The audit substrate is the immutable evidence captured at decision time: source-document version + content hash; document assertions with provenance; retrieved evidence-pack IDs; rule versions; tax-provision versions + effective dates; institutional-memory snapshot; model-invocation metadata; proposal payload; user-approval actor + timestamp; posting/mutation result; Logic Receipt. This is captured once and never depends on a future model. CRA defense relies on this captured evidence, not on replay.

**V4 caveat:** today the "captured evidence" is the `ProposalJustificationSchema` JSONB carried on proposals and flowing to `document_artifacts.pipeline_trace` — not a dedicated immutable receipt table. The audit-defensibility promise is sound in shape but the substrate is partial (§12.2).

### §6.2 Eval's two roles

**Role 1 — Regression protection during development.** When we change OCR providers, Claude models, prompts, matching algorithms, or posting rules, run fixtures through services and diff against snapshots. *(Partially real today: `ingestPipelineHarness` + the three `documentPipeline.*.e2e.test.ts` behind `RUN_MODAL_E2E`, plus the Tier A real-OCR corpus test and `tier-c-empirical-exercise.ts`.)*

**Role 2 — Reconstruction validation.** Replay the captured evidence through the captured rule/provision versions to validate consistency. Validation of the immutable record, not a substitute for it.

### §6.3 Eval taps multiple layers

Domain Services (replay fixtures through entry points) · Capability Providers (diff across provider/model versions) · Domain State (read Logic Receipts, traces, snapshots, audit) · Pure Core Rules (test deterministic logic directly) · **Bypasses the Agent Control Plane** (eval runs don't pollute production `agent_sessions`).

### §6.4 Minimum eval schema (TARGET — no `eval_*` tables exist yet)

```
eval_fixtures   id · org_template · fixture_type · source_bytes_ref · expected_outputs_json · created_at
eval_runs       id · fixture_id · run_type(regression|reconstruction_validation) · model_version
                · prompt_version · provider_versions · pipeline_version · result · diffs_json · created_at
eval_baselines  id · fixture_id · baseline_outputs_json · baseline_at · approved_by
eval_failures   eval_run_id · failure_type · severity · linked_trace_id
```

---

## §7 Product Identity Inside the Architecture

### §7.1 Four distinct concepts (must not blur)

| Concept | Definition | Status |
|---|---|---|
| Intent | User/UI request entering the system (Navigation, Mutation, or Query) | 🟡 spec-defined (`intent_model.md`); `Intent` union not yet instantiated in production TS |
| Proposal | Candidate consequential action awaiting approval or Ladder decision | 🟢 `ProposedMutation` Zod + `ProposedEntryCard` |
| Domain Event | Fact emitted after state changes (internal, drives async reactions) | 🔴 reserved `events` seat, no writers |
| External Event | Webhook/feed/message from an external system | 🟡 Postmark inbound only |

### §7.2 The Three Intents (spec-defined)

```typescript
type Intent =
  | { type: 'navigation'; directive: CanvasDirective }
  | { type: 'mutation';   mutation:  ProposedMutation }
  | { type: 'query';      query:     QuerySpec };
```

Defined in `docs/02_specs/intent_model.md`. **Not yet instantiated as a TS union in production code**; `QuerySpec` is a reserved Phase 2 shape. (V3 implied this was in code — corrected.)

### §7.3 The Four Questions Grammar (spec-defined; partially implemented)

Every confirmation surface answers, in fixed order: (1) What changed? (delta) (2) Why? (rule matched, or "novel pattern") (3) Track record? (N of M) (4) What if I reject? (explicit consequence). **Implemented today on `ProposedEntryCard` only.** `PaymentApprovalCard`, `RecordPaymentCard`, and `ReversalForm` do not yet implement it. The spec (`intent_model.md`) requires it on every confirmation surface; that is the target.

### §7.4 Structured-output discipline (shipped)

The agent returns structured data, never UI prose; UI templates localize via `next-intl` (installed, `^3.20.0`, used in 10+ files). The `respondToUser` tool description enforces "render from `template_id` + params, do not output English prose," and the orchestrator validates against a Zod schema. This is a genuine, enforced constraint.

### §7.5 The Bridge UI shell (shipped)

Three-zone persistent layout (`SplitScreenLayout.tsx`): Zone 1 consolidated left panel (workspace tabs, nav, footer, chat-history reserved); Zone 2 agent chat (drag-drop/paste/+button, inline `ProposedEntryCard`); Zone 3 contextual canvas (renders directives). The earlier fourth "intake rail" zone was removed at Phase 6.5 (replaced by `PendingDocumentsView`).

### §7.6 Phase 2 UX patterns (spec-stubs, NOT ratified; mostly unimplemented)

V3 called these "ratified." They are **captured stubs** from the 2026-04-16 design sprint ("Not yet scoped, not yet specified beyond this stub"), none implemented in code: `cmd_z_as_reversal`, `peek_drill_down`, `mini_map_large_ledgers`, `mirror_cards_intercompany`, `pinned_views_strip`, `mobile_approval_remote`. **`triage_bucket_intake` is formally SUPERSEDED (2026-05-16)** by the chat-drop + `PendingDocumentsView` approach. The capability template cross-references these as *future* patterns.

---

## §8 The External Systems Layer

### §8.0 On the naming (Decision 4 justification, reframed)

V3 justified the rename as "resolves the Bridge naming collision." That collision is **not present in the repo**: "The Bridge" is used *exclusively* as the product/UI name (`CLAUDE.md`, `ui_architecture.md`, `glossary.md`, `src/components/bridge/`); no integration layer is named "Bridge" in code. The collision is **prospective** — it would be *introduced* by V3's own product framing of "The Bridge" as the UI shell (§7.5) colliding with informal "Bridge Layer" talk for integrations. The cleaner justification, adopted here: **adopt precise layered vocabulary (External Systems Layer / Connector family / Provider) to enable the connector-authority-semantics model and forestall the prospective collision.** The rename is still recommended; only its stated rationale changes.

### §8.1 Naming stack

```
The Bridge          = product UI shell
External Systems    = integration architecture
   Layer
Connector families  = storage, ledger, bank feed, filing authority,
                      communication, calendar, payment, workpaper
Providers           = SharePoint, QBO, Plaid, CRA, Gmail, etc.
```

### §8.2 The "bytes vs meaning" generalization

External systems hold external state. CHOUnting holds meaning, proposals, audit, approvals, evidence, and lifecycle.

**Discovery is not authority.** External *location* and external *labels* are UX conveniences for the human, never classification signals for the agent. A PDF dropped in a SharePoint `/AP/` folder is not therefore a payable; a QBO "Bills"-tab entry, a bank-assigned "Office Expenses" category, or a calendar event titled "GST Filing" do not bind CHOUnting's classification or authorize an action. The agent classifies from *contents* and proposes through the Ladder; external metadata is an input to UX, not to truth. This holds for every bidirectional Connector.

| External system | What it holds | What CHOUnting holds |
|---|---|---|
| SharePoint / OneDrive / GDrive / Box | Document bytes | Meaning, classification, lifecycle, evidence chain |
| QBO / Xero / Sage | Ledger state of record (when external) | Proposed mutations, audit, approval state |
| Plaid / Flinks | Bank transaction stream | Categorization, matching, reconciliation |
| CRA portals | Filing of record (after submission) | Working papers, citations, prior-year comparisons |
| Gmail / Outlook | Email bytes + delivery | Communication state, drafts, evidence collection |
| Google Cal / Outlook Cal | Calendar projection target | Deadlines, engagement schedule, reminders |
| Stripe / ACH | Payment execution | Payment state, evidence, reconciliation |
| Excel / Sheets | Workpaper bytes | Workpaper state, generation, re-ingestion |

### §8.3 Connector authority semantics matrix

Each Connector declares `external_system_role` × `chounting_role`:

- **external_system_role:** artifact_store, ledger_of_record, evidence_source, filing_authority, communication_channel, deadline_projection, payment_rail, workpaper_surface
- **chounting_role:** source_of_meaning, proposal_engine, audit_owner, mirror, controller, observer, preparer, drafter

### §8.4 Connector capability flags

`can_ingest`, `can_project`, `can_mutate_external_state`, `can_receive_webhooks`, `can_poll`, `can_detect_drift`, `can_replay`, `can_reconcile`; plus `requires_platform_initiated_ops`, `requires_user_approval_for_mutation`, `requires_oauth`, `requires_signed_webhook_verification`.

### §8.5 The `external_operations` table (generalized from the SharePoint pattern — TARGET)

Any Connector supporting both projection and ingestion requires an `external_operations` table with TTL discipline to prevent feedback loops:

```
external_operations
  id · org_id · operation_source(chounting|external_user|provider) · connector_type · provider
  · external_object_ref · operation_type · idempotency_key · ttl_expires_at
  · source_domain_event_id · initiated_at · status
```

SharePoint folder-move/watch, QBO writeback/webhook, calendar push/event, bank-feed fetch/manual-reconciliation all use the same mechanism. *(No such table exists yet.)*

### §8.6 Per-Connector internal sub-services

Storage: ingestion · lifecycle projector · drift detector · platform-initiated ops. External Ledger: sync · posting projector · external-mutation reconciler · OOB-edit detector. Bank Feed: feed ingestion · transaction normalizer · match-candidate builder · reconciliation. Filing Authority: package builder · submission · confirmation ingester · reassessment ingester. Communication: draft builder · approval/send · reply ingester · attachment linker. Calendar: deadline projector · reschedule reconciler · reminder-status ingester.

---

## §9 The Capability-Slice Template (tiered) — default standard, with right-sizing escape

### §9.1 Principle

Accounting features are not isolated modules. Every capability is a vertical slice through the architecture. Externally, users see Zoho-like workspaces; internally, no `/modules/invoicing/` folder exists.

### §9.2 Lite version (default for every slice)

15 declarations: user job · domain objects · state machine · pure-core rules · domain services · agent-tool contracts · Agent Ladder obligations · proposal types · posting contract · domain events · work-inbox entries · external systems touched · audit/Logic-Receipt requirements · eval cases · degraded mode.

### §9.3 Full version (for foundational or high-risk slices)

Adds 10: user-facing surfaces · Four Questions rendering · reporting framework/basis · headless operability · i18n discipline · institutional-memory contribution · multi-entity behavior · engagement context · security/data access · reporting impact.

**Multi-framework note:** the *reporting framework/basis* declaration is not single-valued — a slice may declare **multiple frameworks** when it serves different reporting contexts (e.g., ASPE for an operating company's books, IFRS for public-facing consolidation, tax basis for slip/return preparation). The family-office reality is multi-framework (per the principal-multiplicity framing in §3.3); the template carries that multiplicity rather than assuming one basis per slice.

### §9.4 Reframe (new in V4): default-with-escape, validated on AR first

The template is proven on exactly one slice (AP). **Mandating all 25 declarations for every slice before the template is exercised a second time risks ceremony overhead.** Treat Lite(15) as the default and Full(25) as the foundational/high-risk default, with an explicit "right-size" escape recorded in the slice's brief when a declaration is genuinely N/A — mirroring the project's own single-vs-multi-chunk-brief practice. **Validate the template on AR (the next slice) before mandating it slice-wide.**

### §9.5 Worked examples

Appendix B walks AP through all 25 declarations using shipped code. Appendix C walks AR/Invoicing as the next-slice spec (mirrors AP; required substrate for multi-entity intercompany matching).

---

## §10 Product Capability Map

**§10 is the record-centric view.** The complementary *work-centric* view — the **Unified Work Inbox**, generalizing the existing document-scoped exception queue across slices into one daily landing (bills awaiting approval, bank transactions awaiting match, invoices awaiting send, documents awaiting classification, filings awaiting review, Connector drift, low-confidence proposals) — is the AP Specialist persona's primary surface and a key differentiator from record-centric (Zoho-shaped) products. It is treated as cross-cutting in the capability template (§9.2 item 11).

| User-facing area | CHOUnting slice | Status | Primary dependency |
|---|---|---|---|
| Purchases | AP / Spend | 🟢 (bills/payments) · 🟡 (prepayments service-only; credits tables-only) | canonical example |
| Sales | AR / Invoicing / Customers | 🟡 substrate (tables exist; no service/routes) | Customer/party model, numbering, PDF/email Connector |
| Banking | Bank Reconciliation | 🟡 substrate (tables exist; no service) | Bank-feed Connector, match candidates, domain events |
| Filing & Compliance | Tax Treatment / Filing / Research (§10.1) | 🟡 codes only (GST + PST_BC) | Tax-knowledge governance, filing Connector |
| Reports Center | Reporting (with snapshots) | 🟡 live RPCs (incl. P&L); 🔴 snapshots | Snapshot substrate, materialized views |
| Accountant | Accountant Tools | 🟡 (manual + recurring + adjusting shipped; bulk + currency UI missing) | — |
| Settings | Configuration / Policy Plane | 🟡 (`org_settings` for AI tuning; policy-side projection unbuilt) | Bound to Ladder policy side |
| (no Zoho area) | Multi-Entity / Consolidation | 🟡 thin substrate (`intercompany_relationships` reserved) · 🔴 automation | Spine in Phase B; full after AP+AR |
| Time/Projects | Projects / Time | 🔴 later slice | deferred |
| Inventory | Inventory / Orders | 🔴 later slice | deferred; may be out of scope |
| Payroll | Payroll / Slips | 🔴 likely integrate | Wagepoint/Payworks Connector vs build |
| (cross-cutting) | Document Platform | 🟢 | Serves every slice above |

### §10.1 Tax as three slices (load-bearing clarification)

| Tax slice | Scope | Risk | Build order |
|---|---|---|---|
| Tax Treatment | Transaction-level GST/HST/ITC classification | Low | First |
| Tax Filing | GST/HST returns, remittances, slips, confirmations | Medium | Second |
| Tax Research / Advice | Cited, point-in-time, authority-aware research and memos | High | Last |

Every tax output carries: jurisdiction, tax period, entity type, authority citation, effective date, authority level, confidence/risk, review requirement. *(Note: only GST + PST_BC are seeded today — no HST. The Canadian wedge starts narrower than "GST/HST.")*

### §10.2 Multi-entity split

The product vision names ~50 entities. **The thin substrate already partly exists** (`intercompany_relationships` reserved seat; multi-currency triad on core tables for base/reporting currency; `legal_entity_id` on storage/spend tables at v1 1:1 org mapping). Splits:

| Sub-slice | Scope | Build phase |
|---|---|---|
| Multi-entity spine | `entity_group`, membership, consolidation_scope, base/reporting currency, party_link, related_party, cross-entity permissions, `entity_id` discipline on every record | Phase B (early infra) — *partly seated; needs the group/consolidation tables* |
| Multi-entity automation | Mirror cards, intercompany matching, elimination entries, consolidated reporting | Phase C (after AP + AR real) |

`entity_id` on every record from day one is foundational; retrofitting tenancy is catastrophic. The spine ships before any new slice.

---

## §11 Security, Privacy, and Data Governance

### §11.1 Principles

1. **Org scope enforced below the agent layer** — RLS + service-layer `org_id` invariants (INV-RLS-001); the agent cannot retrieve another org's data.
2. **External OAuth tokens encrypted at rest and rotated** — per-Connector token store (target; no external OAuth Connectors yet).
3. **Webhooks verified before ingestion** — HMAC `timingSafeEqual`; the Postmark inbound handler does this today.
4. **Documents and emails treated as untrusted input** — prompt-injection defense in extraction; LLM outputs validated against Zod before reaching domain services.
5. **Model calls logged with provider/model metadata** — captured in `ProposalJustificationSchema`; data-minimization/redaction policy (target).
6. **Agent retrieves least-privilege context** — retrieval scoped by org, role, engagement (when applicable).
7. **Audit records append-only and permissioned** — `audit_log` has no UPDATE/DELETE policy; INSERT only via `adminClient` through `recordMutation` (INV-AUDIT-001/002). **The `events` table is likewise physically append-only (3 triggers + 3 REVOKEs, INV-LEDGER-003) from day one** — the outbox spine has a governed seat before it has writers.
8. **Deletion of external files does not delete CHOUnting evidence** — `source_documents` persist with `storage_status='orphaned_in_provider'` per ADR-0013.
9. **Canadian data-residency** — Canadian-region hosting per `security.md`.
10. **Retention per data class** — audit/evidence ≥ 7 years (CRA standard).

**New governance note (from §2.5):** the system-actor commit path bypasses `canUserPerformAction`. The trust boundary is the orchestrator that mints the `SystemActorServiceContext`. Until the Ladder gates this path, the security posture for auto-committed mutations rests entirely on that boundary plus the surviving Invariant 3 (org-consistency) and `trace_id` checks. This should be stated explicitly to the CTO.

### §11.2 Connector-specific concerns

OAuth token theft → encrypted storage + rotation + scope-minimization. Webhook replay → signature verification + idempotency keys + timestamp checks. Prompt injection from emails → untrusted-input handling. Cross-tenant leakage via shared agent state → RLS + org-scoped service contexts + `withInvariants`. External-system mutations bypassing CHOUnting → drift detection + `external_operations` reconciliation. Model-provider data exposure → per-org redaction + audit logging.

### §11.3 Degraded-mode resilience (three operational guarantees)

Degraded mode is testable only if "good" is defined. Any capability provider can be down — Anthropic (classification/extraction fallback), Modal/OCR, embeddings, or external sync. The slice-template degraded-mode declaration (§9.2 item 15) is measured against three guarantees:

1. **Read-only operation always works.** Reports, ledger and account views, document viewing, and previously-captured proposals remain available when AI / OCR / external providers are down.
2. **Pre-AI work continues to flow.** Manual journal entry, manual bill entry, and document upload (queued for later processing) do not depend on AI availability.
3. **Manual paths stay unblocked for deadline-bearing workflows.** Any workflow with a legal or operational deadline (period close, filing, payment) has a manual path that requires no capability provider.

Each slice's declaration must state, per provider dependency, which guarantee holds and the fallback behavior. The capability-provider health substrate (§13.2 item 7) is 🔴 unbuilt; the per-provider downtime scenario matrix (Anthropic / Modal / embeddings / external-sync) is Appendix H.

---

## §12 The Evidence Chain (target architecture, status-annotated)

Documents do not directly create accounting truth. Documents produce assertions; assertions produce proposals; proposals (approved or Ladder-allowed) produce mutations; mutations produce Logic Receipts, audit events, and domain events.

### §12.0 Domain Events vs Audit Events vs Logic Receipts (the trust tripod)

Three records are easy to conflate but are distinct legs of the same trust architecture, with different consumers:

| Record | Answers | Drives | Today |
|---|---|---|---|
| **Domain Event** | *What happened that the system must react to?* | async reactions / orchestration | 🟡 `events` reserved seat, no writers |
| **Audit Event** | *What happened, for the record?* | observability / accountability | 🟢 `audit_log` via `recordMutation` |
| **Logic Receipt** | *Why was this consequential mutation justified?* | defensibility / CRA reconstruction | 🟡 `ProposalJustificationSchema` (Zod on JSONB); no table |

A consequential mutation typically produces all three: the audit row records *that* a bill posted; the Logic Receipt records *why* the agent proposed it (rule version, evidence-pack IDs, model metadata); the domain event lets downstream work react. They must not be collapsed into one record — each leg serves a different principal (§3.3). The evidence chain below threads all three.

### §12.1 The chain — what exists vs what is target

| Node | Reality at `5eade62f` | Status |
|---|---|---|
| `source_document` | `source_documents` table | 🟢 |
| `document_version` | `source_document_versions` table (name differs) | 🟢 |
| `pipeline_run` / `pipeline_trace` | `pipeline_trace` is a JSONB column on `document_artifacts`; no `pipeline_run` table (run tracked via `document_jobs`/`ingest_batches`) | 🟡 |
| `document_assertions` | No table, no type — does not exist | 🔴 target |
| `proposed_mutation` | Zod schema (`ProposedMutationSchema`); in-memory/JSONB, no table | 🟡 |
| `approval / rejection` | `document_cases` states + `ai_actions` pending/confirmed/rejected; no standalone table | 🟡 |
| `posting_intent` | Does not exist anywhere | 🔴 target |
| `journal_entry` | `journal_entries` table | 🟢 |
| `logic_receipt` | `ProposalJustificationSchema` Zod on JSONB `justification`; **no `logic_receipts` table** | 🟡 target |
| `audit_event` | Writes to existing `audit_log` (no `audit_events` table) | 🟢 (via `audit_log`) |
| `domain_event` | Reserved `events` table, append-only, **no writers** | 🟡 reserved seat |

**Of 11 nodes: 4 shipped, 4 partial/in-memory, 3 are target-only.** The chain is a sound *target*; it is not the shipped wiring. Mark it as such wherever it is presented as architecture.

### §12.2 Logic Receipt schema (TARGET — no table exists)

The Logic Receipt is today the `ProposalJustificationSchema` Zod type (`apps/web/src/shared/schemas/accounting/proposalJustification.schema.ts`, Phase 8 chunk 9, closes ADR-0007 Q30), carried on the proposal's JSONB `justification` and flowing to `document_artifacts.pipeline_trace`. The expanded, queryable, immutable receipt store below **does not exist** and is the gap between the CRA-defensibility promise and the substrate:

```
logic_receipts (TARGET)
  id · mutation_id · org_id · created_at
  rule_id · rule_version · institutional_memory_snapshot_ref
  retrieved_evidence_pack_ids[] · tax_provision_versions_consulted[]
  model_invocation_metadata[] · proposal_payload_hash
  approval_actor_id · approval_timestamp · policy_evaluation_outcome
  confidence_score(internal) · user_utterance(verbatim, if chat-originated)
```

CRA defense without depending on future model availability requires this to become a first-class immutable record, not a JSONB blob on an artifact row.

### §12.3 Versioning requirements (for point-in-time reconstruction)

With `effective_from`/`effective_to`: `vendor_rules` (append-only) · `tax_provisions` (by `effective_at`; provincial + federal + bilingual) · `chart_of_accounts` (historical states) · `org_settings` (policy state at any past moment). *(None of these are versioned today.)*

---

## §13 Sequencing

### §13.1 Phase A — Architecture documents to freeze (route through ADR-0022 supersession workflow)

New docs must carry the house status-header block and follow the ADR-0022 supersession/lifecycle convention (status header, `Supersedes:` line, no silent overwrite). Two of the listed docs already exist and would be *amended/superseded*, not created:

- `docs/00_product/product_vision.md` — **exists** → amend (Claude-analog framing + principal multiplicity + degraded-mode + reconstructable-state)
- `docs/03_architecture/system_overview.md` — **exists** → supersede with the §4 diagram (v2)
- `docs/03_architecture/accounting-capability-template.md` — new (Lite + Full)
- `docs/03_architecture/domain-events-outbox.md` — new
- `docs/03_architecture/connector-authority-semantics.md` — new
- `docs/03_architecture/agent-ladder-runtime-enforcement.md` — new (**must cover the auto-commit retrofit, §2.5**)
- `docs/03_architecture/degraded-mode-architecture.md` — new
- `docs/03_architecture/security-and-data-governance.md` — new
- `docs/03_architecture/evidence-chain.md` — new (with the §12.1 status table)
- **Amendment:** `docs/07_governance/adr/0014-tier-2-document-pipeline.md` §11 — reconcile "auto-post deferred post-v1" with shipped auto-commit (Appendix L)

### §13.2 Phase B — Infrastructure before breadth

1. Domain events / outbox spine (the `events` seat exists; add producers/consumers/dispatch)
2. Generalized work inbox from the exception queue
3. **Agent Ladder pure-rule math in `core/agent-ladder/` — load-bearing-now: it gates the live auto-commit path (§2.5), not just future surfaces**
4. **Register INV-AGENT-001 on the existing `ingestDocument.ts` commit sites (auto-commit retrofit)**
5. Connector authority-semantics codification
6. Report snapshots / materialized views
7. Capability-provider health substrate + degraded-mode UI
8. Thin multi-entity spine — add `entity_group`, membership, `consolidation_scope`, `party_link`, `related_party`, cross-entity permissions + `entity_id` discipline on every record (the intercompany/currency seats already exist; full component list per §10.2)
9. Logic Receipt schema expansion (§12.2 → first-class table)

### §13.3 Phase C — Next product slices

AR / Invoicing / Customers (biggest gap — initial-schema tables exist; no service/routes yet; mirrors AP; required for multi-entity) → Reporting Center / snapshots → Bank Reconciliation → GST/HST Tax Treatment → GST/HST Tax Filing → Multi-Entity Automation → SharePoint bidirectional Connector → Outbound Communication Connector → Tax Research / Advice (last).

*Footnote — SharePoint activation is two sub-arcs, not one:* **Sub-arc A** (projection: CHOUnting → SharePoint, lifecycle/folder projection) and **Sub-arc B** (ingestion: SharePoint → CHOUnting, folder-watch). They ship independently and have different customer triggers, so "SharePoint activation" is not a single approvable unit. Detail deferred to the eventual SharePoint activation brief.

### §13.4 Decision dependency graph

```
Auto-commit Ladder retrofit (§2.5) required before:
  any new auto-post surface · Notify&Auto-Post · Silent Auto · bulk approvals

Domain events/outbox required before:
  SharePoint bidirectional · bank feeds · calendar projection · filing workflows
  · report snapshot refresh · intercompany matching

Report snapshots required before:
  Reproducible reporting · GST/HST filing package · close workflow
  · eval regression on financial statements

Connector authority semantics required before:
  QBO/Xero/Sage · CRA filing · Gmail/Outlook outbound · bank feeds

Thin multi-entity spine required before:
  Any new slice (entity_id discipline is foundational)
```

---

## §14 CTO Decisions Requested

### Required architecture decisions

| # | Decision | Independently approvable? |
|---|---|---|
| 1 | Adopt five-section runtime architecture (§4) | Yes |
| 2a | Promote Agent Ladder to structural spine (§5) | Yes |
| 2b | Bind Settings UI to Ladder policy side (§5.5) | Yes (depends on 2a) |
| **2c** | **Retrofit Ladder enforcement onto the live auto-commit path before any new auto-post surface; amend ADR-0014 §11 (§2.5)** | **Yes — recommended as blocking** |
| 3a | Position eval/replay as vertical sidecar (§6.3) | Yes |
| 3b | Adopt eval-validates / evidence-is-substrate framing (§6.1) | Yes (depends on 3a) |
| 4a | Rename to External Systems Layer (§8.0/§8.1) | Yes |
| 4b | Adopt Connector / Provider naming stack (§8.1) | Yes (depends on 4a) |
| 5 | Adopt capability-slice model with tiered template as **default-with-escape** (§9) | Yes |
| 6 | Build domain events / outbox before major expansion (§13.2) | Yes |

### Recommended product framings (non-blocking)

| # | Framing | Note |
|---|---|---|
| 7 | Agent Chat / Cowork / Code analogy (§3) | Approve as working framing, not binding language |
| 8 | The Bridge as product UI shell (§7.5) | Approve as product identity |

### Roadmap priorities (for ratification, not blocking)

AR/Invoicing/Customers next → Reporting snapshots → Bank reconciliation → GST/HST treatment then filing → Multi-entity spine in Phase B, full automation after AR/AP.

---

## §15 Open Questions

1. **Engagement context** — single-org-only or firm-market commitment?
2. **External ledger Connectors** — does CHOUnting become a brain on top of QBO/Xero for some customers, or always own the ledger?
3. **Tax knowledge scope at v1** — GST/HST treatment + filing only, or include T2 advice?
4. **Bilingual ITA storage** — defer with English-only product, or store both languages now?
5. **Mobile capture timing** — Phase 8+ candidate; depends on capability template proving out on AR.
6. **Payroll** — build native or integrate Wagepoint/Payworks?
7. **Provincial corporate tax (Quebec)** — in scope for the filing slice?
8. **Reporting framework defaults** — ASPE assumed default? IFRS for which entity classes?
9. **(new) Auto-commit autonomy posture** — now that the pipeline auto-commits without the Ladder, what is the interim risk posture until 2c lands? Freeze auto-commit to a whitelist of document types/amount ceilings, or accept the current open posture on staging only?

---

## §16 Top Risks if Decisions Are Not Made Now

1. **Capability drift to module-shaped thinking** — without the slice model, AR gets built as an isolated folder.
2. **Agent Ladder becomes a permissions checkbox** — *partially realized already (§2.5); the longer 2c waits, the more auto-post surfaces accrete on the ungated path.*
3. **Eval scoped as agent-output testing** — instead of system regression.
4. **Settings expose unsafe knobs** — without policy-side binding.
5. **Connector integrations become one-off** — without authority semantics.
6. **Async coordination chaos** — without the domain-events spine (the `events` seat helps, but has no dispatch).
7. **Audit, traces, proposals, Logic Receipts remain scattered** — without evidence-chain formalization, the CRA-defense promise outruns the substrate (§12.2).
8. **Multi-entity gets retrofitted** — without the thin spine in Phase B (currency + intercompany seats exist; the group/consolidation tables do not).

---

## Appendices

| # | Title | Status |
|---|---|---|
| A | Full ASCII diagram (high-resolution §4) | stub — to author |
| B | AP / Spend walked through 25-item capability template | stub — to author from shipped code |
| C | AR / Invoicing walked through 25-item template (next-slice spec) | stub — to author |
| D | Domain events / outbox strawman schema + acceptance criteria | stub |
| E | Agent Ladder enforcement path (decision tree with code anchors) | stub — must include §2.5 retrofit |
| F | Connector authority semantics matrix (full) | stub |
| G | Security, privacy, data governance + per-Connector matrix | stub (§11 is the summary) |
| H | Degraded-mode behavior matrix per capability provider | stub |
| I | Eval / replay v0 schema + reconstruction validation worked example | stub (§6.4 is the seed) |
| J | Naming-collision migration: doc-mentions of "Bridge Layer" → "External Systems Layer" | stub — note: §8.0 shows the collision is prospective, so this is a forward-naming guard, not a repo sweep |
| **K** | **Correction ledger — every V3→V4 cell change with before/after + evidence** | **new — see below** |
| **L** | **Proposed ADR-0014 §11 amendment block (auto-commit reconciliation)** | **new — draft below** |

### Appendix K — Correction ledger (V3 → V4)

| Item | V3 said | V4 (verified at `5eade62f`) | Evidence |
|---|---|---|---|
| Invariant count | 20 | 21 (INV-DOC-001 is 21st) | `invariants.md` reachability statement |
| AP prepayments/credits | 🟢 shipped | 🟡 prepayments service-only; credits tables-only | `vendorPrepaymentService.ts`; `vendorCreditService.ts` absent; `20240156000000` |
| Exception queue enum | 17 values | 18 values | `20240148000000` |
| Pipeline stages | 9 | 8 canonical (10 parent stage_names + 2 children) | ADR-0014 §1 (183–207) + amendment (244–253) |
| Reporting | "no income statement" | P&L RPC exists; gap is snapshots | `20240107000000:25` |
| Vendor rules | "table with rung enum" | live `autonomy_tier`; ADR-0017 schema never migrated | `initial_schema.sql:347–357`; zero migration matches for rung/promotion/clean_approval_count |
| Eval/replay | 🔴 missing/ad-hoc | 🟡 harness + e2e + gate exist; no `eval_*` tables | `ingestPipelineHarness.ts` etc. |
| AR | 🔴 missing | 🟡 tables exist, no service/routes | `initial_schema.sql:365/381/398` |
| Bank | 🔴 missing | 🟡 tables exist, no service | `initial_schema.sql:456/466` |
| Multi-entity | (framed as missing) | 🟡 `intercompany_relationships` reserved + currency + `legal_entity_id` | `initial_schema.sql:158` |
| Multi-currency | (unmentioned) | 🟢 shipped (triad + INV-MONEY-002/003) | `initial_schema.sql:238–241` |
| Recurring journals | (unmentioned) | 🟢 shipped | `20240131000000` |
| Adjusting entries | (unmentioned) | 🟢 shipped (INV-ADJUSTMENT-001) | `20240128000000` |
| Atomic RPC | (unmentioned) | 🟢 `write_journal_entry_atomic` | `20240134000000` |
| `events` seat | 🔴 missing | 🟡 reserved + append-only triggers | `initial_schema.sql:555` |
| GST/HST | "seeded" | GST + PST_BC only; no HST | `20240103000000` |
| Auto-commit | future/non-goal | 🟢 live, ungated by Ladder | §2.5 anchors |
| Three Intents / Four Questions | "ratified"/in code | spec-defined; Four Questions on `ProposedEntryCard` only | `intent_model.md`; `ProposedEntryCard.tsx` |
| Phase 2 UX patterns | "ratified" | spec-stubs; `triage_bucket_intake` SUPERSEDED | `docs/01_prd/` stubs |
| Logic Receipt / posting_intent / document_assertions | presented as substrate | target schema; Logic Receipt is Zod-on-JSONB | §12 |
| Decision 4 justification | "resolves Bridge collision" | collision is prospective; reframe to vocabulary rationale | §8.0 |

### Appendix L — Proposed ADR-0014 §11 amendment block (draft)

> **Amendment (2026-05-24) — auto-commit reconciliation.** §11's statement "auto-post deferred post-v1 per spec §11" is superseded for the system-actor commit path. As of the auto-commit arc (`60b89106`→`8a6c9bc3`, ratified `a940ec6f`; ADR-0007 Q78 Option A), `ingestDocument` auto-commits matched `post_bill` and `record_bill_payment` mutations via `withInvariants(SystemActorServiceContext)`, which bypasses Invariants 1/2/4. This path runs no Agent Ladder rung or system-ceiling check (INV-AGENT-001 unregistered). Tier-1 commit-time confirmation remains the rule for *user-initiated* proposals; auto-commit is now live for system-actor pipeline commits. Registering Ladder enforcement on this path is tracked as the Decision 2c remediation (system-overview V4 §2.5 / §13.2 items 3–4).

---

*End of V4 decision memo. Appendices A–J are authoring stubs; K and L are complete. Re-verify all 🟢/🟡/🔴 cells against the SHA at send time.*
