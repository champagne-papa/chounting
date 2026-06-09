# Post-V1 Revisit Notes — capability tracks, Workflow Core, AP

**Status:** Advisory synthesis from a scoping thread (verification-advisor notes), NOT a ratified plan or charter.
**Anchored at:** HEAD `62798444` (origin/staging). Re-ground every [disk] item against current code before chartering — true as of this thread's reads, may drift.
**Legend:** [disk] = grounded from code/migrations/ADRs this session · [discussed] = design discussion, unverified · [decided] = a call made in this thread.

## How to use this doc
A memory aid so that after other CHOUnting work, we revisit these. Before acting on any item, re-ground its [disk] facts (code moves) and treat [discussed]/[decided] as starting positions, not settled scope. The originating thread is the fuller record.

## Workflow Core (the engine)
- [disk] Substrate is **inert**: `workflow_instances` + `workflow_events` (migration `20240171000000`), `CHECK(state='pending')`, no runtime writer (only `src/` ref is generated `db/types.ts`). ADR-0028 ratified it as a reserved seat. `services/workflow/` does not exist yet.
- [disk] Model contract `workflow_model.md` authored in full (code-defined defs, idempotent service-only activities, compensation as a `workflow_events.event_type`, version-pin determinism) — engine build implements against a ready spec.
- [disk] Reserved invariants: INV-WORKFLOW-002 (append-only — trigger exists), 003 (never-writes-ledger — covered by the live ESLint import boundary once the module exists), 004 (version-pin determinism — **enforcement unbuilt**, must be built + registered). Register-on-enforcement.
- [disk] OQ-3 consumer seam deferred: nullable FK on `document_jobs` vs a `workflow_events` activity record — both additive.
- [decided] **Deferred — "too early."** No current process needs durable orchestration; building it without a real consumer is what ADR-0028 declined to do. Revisit when a genuine multi-step/durable/compensatable consumer appears.
- [discussed] Candidate first consumers: **ingest** rejected (deterministic-by-mandate per ADR-0007 Q31 → can't exercise agent→engine; already works synchronously + sweep; sync-v1 locked; risky re-platform). **Reporting** rejected (read-only; nothing to compensate; hollow). **Recurring-journal scheduler** — [disk] `recurringJournalService` has a reserved Phase-2 scheduler state + generate→approve→post lifecycle + compensation-shaped orphan-recovery; cleanest abstract candidate. **AP pay-run** — the live candidate (see below).

## Workflow UI / canvas
- [disk] ADR-0028 D-0028.7: canvas is off the substrate arc's critical path; docs draft in parallel, ships last; observe-AND-operate projection. No workflow view exists today.
- [discussed] When built, decompose three ways: **spec in parallel** (forcing-function for the append-only `workflow_events` schema — retrofitting an observe-field later is painful); **observe** (read projection — bundle with the engine as acceptance surface); **operate** (retry/compensate/cancel — privileged write; gate at AP-review authority grade, same org-derived-from-row discipline as `documentCaseService.transition()`).

## AP-aware conversations (option 1)
- [disk] AP **services** all exist: `billService`, `paymentService`, `vendorService`, `vendorPrepaymentService`, `apReportService`, `vendorReportService`. The agent has **zero AP tools** today (11 wired: journal/CoA/period/org + `draftVendorRule` + `respondToUser`).
- [discussed] Lowest-risk capability path: thin agent-tool wraps over shipped services. No Workflow Core needed.
- [caveat] Service *files* inventoried, not method surfaces — confirm e.g. whether `apReportService` does aging buckets before assuming a tool is thin.

## Review-inbox copilot (option 2)
- [disk] Surface exists: `reviewPreviewReadService` (proposal evidence + scoring), `documentCaseService` (case state/approve), the `approve-post` route. Double-entry agent core already ships (post/reverse/list JE).
- [discussed] Read side easy; accept/edit/reject is the privileged approve→post write — authority-gated. Low-orchestration, higher-authority.

## Month-end close assistant (option 3) / AP pay-run
- [disk] Close-grade tooling **not built**: no reconciliation service, no accruals, no close orchestrator (`periodService` gives period lock; `postV1ReconciliationOrchestrator` is pipeline commit-bundle reconciliation, not bank/account close-rec).
- [discussed] Reframed to the real process: **AP pay-run** (populate AP list → controller approves batch → disburse → reconcile), twice monthly. This is the pay-run slice, NOT full month-end close (which also needs accruals/period-lock/account-rec). Bounded → better as a first workflow.
- [open fork] Whether the pay-run is a Workflow Core consumer or just options 1+2 turns on ONE question: **does the batch carry durable cross-time state with compensation?** (approved Mon, disbursed Wed, one payment fails → reverse/hold the batch, resume after crash). If yes → genuine engine consumer (durable instance, payments as activities, reversal as saga compensation) — agent-initiable, not sync-locked, arguably the best candidate. If all-one-sitting-retry → it's 1+2 capability, no engine. **Not on disk — it's how the close actually behaves.** Deciding read when revisited: `paymentService` + `billService` for existing batch/pay-run/partial-failure semantics.

## AP workflow list — V1 (live) vs V2 (built-but-inert)
- [disk] **Live spine:** drag-drop → `source_document` → Stages 0–7 → typed extraction + `pipeline_trace` → `ProposedMutation(post_bill)` + parked case → re-verify → gate computes `cap(max, current_rung)` + shadow rule eval + autonomy-gate **records** → parks `parked_unposted`, case → `needs_review` → human Pending Approval card → approve **posts** bill + audit. **A dragged invoice reaches a parked proposal, NOT the ledger; ledger write requires a human click.**
- [disk] **Built-but-inert (the V2 "flip"):** auto-post on rung 2/3 **disabled** (Q78; `autonomy_gate_log.realized_outcome` DB-CHECK-locked to `'parked'`); gate's three downstream checks (per-txn limit, daily-aggregate ceiling, track-record health) are pass-through **stubs** `// activates post-v1`; approve/reject **outcome counters** (clean/non-clean promotion math) are "a future approval-pipeline arc," not recorded yet; promotion/probation + dollar limits/ceilings post-V1. **Rung cap is the one live autonomy piece.**
- [disk] V1 = full pipeline + full autonomy substrate in **record/shadow mode**. V2 = flip to **decide** (wire outcome counters, activate stubs, enable governed auto-commit). **None of the V2 flip is Workflow Core work** — it's gate-flip + counter-wiring + stub-activation.

## Layered-stack flow diagram — V1 vs target
- [disk] The flow diagram (input → intake → AI-edge → Intent+WorkflowStartRequest → Agent → Workflow Core → Decision Modules → Services → Accounting → Evidence/Audit/Domain Event) is the **target**, not V1-live. Corrections:
  - **Domain Event** (`events` outbox): reserved seat, nothing writes it (`recordMutation`: "in Phase 2 this role moves to events; for now audit_log is the truth"). NOT live.
  - **Workflow Core** in the command spine: inert; the live ingest path bypasses it.
  - Terminal **omits two live records**: Logic Receipt (`rule_evaluation_log`) and the autonomy gate log (`autonomy_gate_log`).
  - **Evidence:** one canonical evidence **object per subject** at the review-commit path; completeness **descriptive-only** at V1. Not a "bundle."
  - Query path: Reporting/Query services + authorization are live (read-only). `QueryTrace`/`QuerySpec`/snapshots likely target-not-live — but that's absence-of-evidence (not found), not confirmed absent; needs a read if it matters.
- [disk] To make this diagram flow end-to-end live you'd need a Workflow Core consumer AND the event-sourcing projection — both reserved.

## Current decision & immediate direction
- [decided] Defer Workflow Core; defer DEA scoping (it was upstream of the now-deferred first-consumer question). **Deepen AP ingest** — add SharePoint storage + mailbox channel. This is ingest/storage/channel plumbing, NOT agent-capability work.
- [disk, corrected at the 2026-06-07 grounding read — supersedes this line's original "may be partially built / needs a seam" framing] **Mailbox is substantially BUILT end-to-end**: HMAC-verified Postmark webhook route (`api/webhooks/postmark-inbound`, full rejection taxonomy), `handleForwardedMailbox` complete (allowlist check, two-layer idempotency, 1+N email_body+attachments composition, same atomic RPC as drag-drop), migration `20240155`, env var templated. It processes **async-by-sweep, not sync**: the mailbox path has no pipeline invoker (drag-drop only carries the Class D T4 `IngestInvoker`); the D2.3 sweep covers it (`sweepStrandedCases.ts` `ELIGIBLE_STATES` includes `received` → B3 full `ingestDocument` re-run) **but the sweep's only invocation surface is the operator CLI script** (`apps/web/scripts/sweep-stranded-cases.ts`) — no vercel.json cron, no pg_cron, no route (repo-level pin; external schedulers can't be ruled out from disk). "Finish mailbox" = a DECISION, not a gap-fill: (A) wire a sync invoker (T4 inversion pattern) vs (B) schedule the sweep — plus an allowlist management surface (`internal_sender_allowlist` has zero writers; operator-SQL-only) and Postmark ops activation (account, inbound address, webhook secret per env). **SharePoint — the seam EXISTS** (supersedes "needs a storage-provider seam"): `storage_provider` ENUM reserves `'sharepoint_drive'` (migration `20240135:120`); `resolver.ts` reserved-branch throws until activation ("replace the throw with the factory call"); ADR-0013 §14 + the 2026-05-15 `sharepoint_durability_mode` amendment (org_settings-level reservation, no column migrated). Net-new = the provider implementation + widening two v1-active CHECKs (`20240135:217` source_documents + the document_versions sibling; CHECK-broaden ⇒ Zod-broaden applies) + an org_settings/durability slice. Pre-charter fork to resolve: (a) SharePoint as **storage provider** vs (b) SharePoint as **folder-watcher ingest channel** — genuinely different arcs; (b) composes (a).

- [SUPERSEDED 2026-06-09 by the mailbox-sharepoint-live arc] The "HMAC-verified Postmark webhook route" framing above is WRONG: Postmark inbound webhooks send **no body signature** (security = HTTP Basic Auth in the webhook URL + IP allowlist), so the route's HMAC check 401'd every real delivery and the channel never received live mail. Fixed to HTTP Basic Auth (charter `63729742` → spec `acd6e451` → Task 1 `8ebfb0cc` → Task 2 `1f461e0d` → `a463c73e`). Mailbox→SharePoint is now wired + unit-proven, **live-gated** on `docs/09_briefs/post-mvp/runbooks/mailbox-sharepoint-onboarding.md` (operator ops + first forwarded email = the PROVEN-LIVE event). See `retrospectives/mailbox-sharepoint-live-retrospective.md`.

## Don't-forget list (also revisit)
- [disk] **Q33 ×3** deferred agent-runtime adminClient sites — tied to "Double-Entry-Agent timing"; resolve (with a deferred INV registration) if/when DEA work touches `orgContextManager`/orchestrator/session-loading.
- [discussed, unverified] **Runtime hardening / foundation arc** — orgId session-context bug + high-turn-count/structural-response-invalid failure modes. Never grounded this session; no-regret-but-unverified. Everything agent-facing sits on this runtime — most urgently if a durable workflow ever runs on it.
- **Governed auto-commit (the V2 flip)** as its own track — separate from Workflow Core, well-substrated, the natural "complete AP" work.
- **DEA capability tracks** (AP-aware conversations, review-inbox copilot) — deferred, not cancelled; revisit when AP capability becomes the priority.
- [disk] Tracked residue at `62798444`: five governance one-offs; `folder-structure.md` refresh; `monorepo.md` body; gitignore-anchoring N=3 bank w/ trigger; vendor-match schema divergence; 6 LT-01b reds; Decision 10 / ADR-0036.
- **Three independent tracks framing:** (a) AP capability/completion, (b) runtime hardening, (c) Workflow Core — none blocks the others; the engine waits for a real consumer.
