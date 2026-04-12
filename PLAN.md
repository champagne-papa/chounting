# Family Office AI-Forward Accounting Platform — PLAN.md

## Part 1 — Architecture Bible
### Version: v0.5.6 — Step-5 split: Part 2 → docs/specs/phase-1.1.md, CLAUDE.md derived, ADR-001 written

> **This document is the Architecture Bible.** It captures every major
> architectural decision, the reasoning behind it, and the constraints
> that flow from it. It is the long-term north star. It is consulted,
> not executed.
>
> **Phase Execution Briefs live under `docs/specs/`** (one file per
> phase, e.g. `docs/specs/phase-1.1.md`) as of v0.5.5. Before v0.5.5
> the briefs were appended to this same PLAN.md file as "Part 2" —
> the step-5 split extracted them. Each brief is a concrete execution
> document with SQL, folder layout, exit criteria, and tests for that
> one phase. Briefs are written one at a time, informed by what the
> previous phase taught us.
>
> **Standing rules loaded every session live in `CLAUDE.md`** at the
> repo root. `CLAUDE.md` is derived from this Bible (primarily §0,
> §1d, §2b, §3a, §5c, §15, and the Critical Architectural Invariants)
> and filtered by the throwaway-work test. `PLAN.md` is *consulted*;
> `CLAUDE.md` is *always loaded*.
>
> **Architecture Decision Records live under `docs/decisions/`.** The
> first is `0001-reversal-semantics.md`, written verbatim from
> §18c.19 RESOLVED during the step-5 split.

---

> **Version history:**
> - v0.1.0 — Initial: Zoho module surface, flat tool catalog, create_bill worked example
> - v0.2.0 — Canvas: Bridge UI, Contextual Canvas, canvas_directive protocol, Mainframe rail
> - v0.3.0 — Layered agents: Three-layer stack, Two Laws, Phase 1 scoped to manual journal entry proof-of-concept
> - v0.4.0 — Architecture hardened: Four-layer truth hierarchy, pre-commit invariant enforcement, three-namespace contracts package, Agent→Command contract layer, event stream as single source of truth, trace-id observability, semantic confidence routing graph
> - **v0.5.0 — Phase 1 simplification: Single Next.js app for Phase 1 (no monorepo, no Express). Layer 1/2 agents collapsed to service functions. Events table reserved-seat (created, not written). Audit log written synchronously. A/B/C categorization (build now / foundation now / defer). Seven Category A additions. Three integration tests as floor. Phase structure rewritten as 1.1 / 1.2 / 1.3. PLAN.md split into Architecture Bible (Part 1) and Phase Execution Briefs (Part 2). Eight v0.4.0 decisions formally superseded — see Phase 1 Simplifications section for the full list and Phase 2 corrections.**
> - **v0.5.1 — Foundation review fixes: Section 0 added at the front enumerating all eight v0.4.0 → v0.5.0 divergences in a single table. Invariant 5 heading qualified to make the Phase 1 exception visible from the TOC. Section 14 opening rephrased to make resolved-status unambiguous. Section 15f rewritten with two complete side-by-side ordering diagrams (Phase 1 form and Phase 2 form) instead of a prose diff. Open Questions section expanded from 10 to 19 items by promoting seven decisions from Section 17 (where they had defaulted silently) and adding two missing architectural gaps (CI/CD database target and reversal entry mechanism). Section 17 trimmed to only the items that genuinely belong in the Phase 1.2 brief.**
> - **v0.5.4 — Phase 1.2 Canvas Context Injection:** The minimal bidirectional canvas pattern — canvas → chat selection context — is moved from Phase 2 into Phase 1.2 alongside the initial agent build. The founder's position, which this version adopts: the failure mode of a disconnected split-screen UI in Phase 1.3 real-user testing is a hard-no trust classification for UX reasons rather than accounting correctness, which is the exact class of failure the product cannot afford because point 1 of the product's differentiation is the persistent split-screen pattern. If the reverse direction does not work on real workflows, the differentiator is theatre and a savvy reviewer feels it inside 30 seconds. v0.5.4 adds three components — a `CanvasContext` type, a Zustand selector that builds it from the current canvas state, and click handlers on exactly two selectable row types (journal entry rows in the list view and chart-of-accounts rows in the CoA view) — plus a `canvas_context?: CanvasContext` input on `handleUserMessage` and a subordinate canvas-context section in the system prompt labeled as "context only, do not assume the user is asking about this unless their message refers to it." P&L drill-down is explicitly out of scope for Phase 1.2 — the P&L canvas view exists in Phase 1.1 as read-only but is not one of the two selectable row types, so P&L line drill-down naturally defers to Phase 2 without needing a separate scope decision. Canvas context is client-ephemeral (sent on each message from Zustand, never persisted server-side in `agent_sessions.state`) to avoid a staleness window and to match how the canvas actually works — the server cannot know what the user clicked. One new exit criterion (#19) tests the over-anchoring failure mode the founder correctly identified with three concrete scenarios: (a) clicked entry + ambiguous question → agent uses the selection, (b) clicked entry + explicit reference to a different entry → agent follows the explicit reference and does not anchor on the stale selection, (c) no click + ambiguous question → agent asks a clarification question rather than guessing from a ghost selection. Phase 2 still owns the full bidirectional UX (hover states, contextual action bar, multi-selection, canvas tabs, P&L drill-down, persistent-across-navigation selection). No migration changes; no impact on any v0.5.3 finding; one Phase 1.1 folder tree addition for the shared type so Phase 1.2 wiring is additive. Estimated ~150 Bible lines.**
> - **v0.5.3 — Correctness and risk review fixes: Sixteen findings resolved in one commit after back-to-back A (risk hunt) and D (technical correctness) reviews of v0.5.2. A found 10 items (5 Bible changes + 4 inline notes + 1 Phase 1.1 brief addition) — period-lock/ai_actions race, SECURITY DEFINER search_path leak, unenforced service-side authorization, trace_id break at the Claude API boundary, unconstrained Vercel/Supabase region pairing, idempotency key scoping gap, events-table backfill INSERT-only requirement, pnpm-vs-npm lockfile trap in the Phase 1.1 brief, next-intl fallback behavior, and inactive CoA account filtering. D found 11 items (7 Bible changes + 4 inline notes) — period-lock concurrency race (row-lock fix on fiscal_periods), money-as-JavaScript-Number silent rounding, RLS documented on only 3 of 20+ tenant-scoped tables (completed uniformly), events-table TRUNCATE bypass, undocumented multi-currency amount_cad/amount_original/fx_rate invariant (CHECK added), deferred-constraint trigger firing N times per commit (documented and kept in Bible now — not deferred), missing idempotency CHECK constraint for agent source, memberships→auth.users missing ON DELETE CASCADE, unspecified transaction isolation level, events.sequence_number gap warning, and zero-value line decision (**rejected at the database via CHECK — at least one side must be non-zero; a zero-balanced line is an invisible audit-context error worse than a rejected entry**). Full changelog with each finding and its resolution in docs/prompt-history/CHANGELOG.md.**
> - **v0.5.2 — Readiness review fixes: Three gaps closed after an interactive readiness review of v0.5.1. (1) Part 2 preamble added above the Phase 1.1 Execution Brief disclosing that the brief was drafted against Section 18 default answers, naming the specific questions it silently assumed, and requiring the founder to complete Section 18d before execution. (2) Phase 1.2 exit criteria extended with seven load-bearing tests (#12–18) covering the architectural promises the Bible makes elsewhere but never verified: dry-run→confirm round-trip, anti-hallucination enforcement, ProposedEntryCard render shape, clarification-question path, mid-conversation API failure (behavioral — tests the orphaned-pending-action failure mode, not just the UI state), structured-response trilingual contract, and persona guardrails. (3) Phase 1.3 exit criteria extended with seven load-bearing signals (#7–13) for real-bookkeeping operation: reversal exercised, period lock exercised after real close, backup/restore verified, real GST/HST on a real entry, explicit trust classification with an up-front go/soft-no/hard-no commitment rule, non-English UI walked, and cross-org accidental-visibility check. The v0.5.2 pass was initiated by the founder with the instruction "lets have brainstorm review the plan.md first," scoped to readiness (E) and Phase 1.2/1.3 exit criteria rigor, with two founder-driven reshapes to the original senior review findings (behavioral framing for the API-failure criterion; explicit "Phase 2 does not begin until resolved" rule for hard-no trust answers). The annotation pass on the Phase 1.1 brief's assumption points is tracked separately and applied interactively with founder confirmation of each point.**
> - **v0.5.5 — Founder answers + reversal mechanism + consistency pass.** One coherent commit bundling the outcome of a four-step sequence: (1) a document-strategy audit that classified Part 1 as ~95% SETTLED with four SOFT items and §18 OPEN; (2) two pre-existing v0.5.3 consistency slips in the §3 worked example fixed before any founder answers landed — §3b `ProposedEntryCardSchema.lines[].debit/credit` changed from `z.number()` to `MoneyAmountSchema` so the output schema stops contradicting §3a's string-money rule, and §3d step 4 (the application-layer debit=credit re-check) replaced with a load-bearing comment after confirming the block literally does not compile under v0.5.3's string-money rule and was vestigial defense-in-depth against a bypass that cannot happen; (3) the nine-question minimum-unblock set from §18 answered by the founder with reasoning captured alongside each decision; (4) a full-width consistency re-read of Part 1 that caught three stale "three tests" references in §1e, §10a opening, and the Category A table in §A/B/C — all propagated to the new v0.5.5 five-test floor count. **Founder answers resolved (9):** Q1 `holding_company + real_estate`; Q2 BC with GST + PST_BC (not HST — BC reverted the HST experiment in 2013); Q4 Supabase `ca-central-1` + Vercel `yul1` with §9a.0 accepted as a hard constraint; Q5 Windows host + WSL2 Ubuntu 22.04 as the actual dev shell (native Windows explicitly unsupported, §12 Prerequisites updated); Q7 GitHub + GitHub Actions; Q9 add `zod-to-json-schema` pinned with major bumps as ADR-required; Q10 Supabase admin API for user seeding, `devUsers.sql` → `devUsers.ts` with `tsx` as a new dev dependency; Q18 (a) local Supabase for Phase 1.1/1.2 and (b) remote for Phase 1.3 with **tests parameterized by `SUPABASE_TEST_URL` from day one and a CI grep-fail check rejecting any test file that hardcodes `localhost:54321`**; Q19 accepted with three explicit Phase 1.1 additions. **Q19 reversal mechanism** is the most load-bearing answer and produced the largest edit footprint: `journal_entries.reverses_journal_entry_id` nullable self-FK added in §2a; `journal_entries.reversal_reason` nullable text column added in §2a with a conditional DB CHECK enforcing non-empty whenever `reverses_journal_entry_id` is populated — this column was briefly placed on `audit_log` during the same v0.5.5 cycle because the founder's Q19 wording was "the audit log captures," then migrated to `journal_entries` after the founder reconsidered the placement and corrected the phrasing to "the audit trail captures"; the trail is the broader concept including `journal_entries` columns alongside `audit_log` rows, and the reason is a property of the reversal entry, not of the mutation record that created it; the full placement history is preserved inline in §2a's `audit_log` and `journal_entries` definitions and will be captured verbatim in ADR-001 during the step-5 split; §2b gains a new invariant row for the service-layer reversal mirror check; §2e gains a partial index on `journal_entries (reverses_journal_entry_id) WHERE NOT NULL`; §4h is a new subsection specifying the reversal UI including the mandatory non-dismissible period gap banner when the current open period differs from the original entry's period; §15e Layer 2 gains the full reversal-mirror procedure with five reject branches (`REVERSAL_CROSS_ORG`, `REVERSAL_PARTIAL_NOT_SUPPORTED`, `REVERSAL_NOT_MIRROR`, the non-empty `reversal_reason` check, and the same-line-count precondition); §10a test file layout adds `reversal-mirror.test.ts` as Category A floor #5 and propagates the v0.5.3 service-middleware authorization test as Category A floor #4 (a v0.5.3 count correction that was never pushed into §10a); §7 Phase 1.1 "What is built" adds a reversal path bullet and bumps the test count from three to five; Phase 1.1 exit criterion #3 updated to the new count. **Partial reversals, reversal-of-reversal chain UI, and automatic period-end reversals are explicitly deferred to Phase 2** — named deferrals in §4h and in the Q19 RESOLVED section, not silent omissions. The Q19 resolution section is explicitly flagged as the seed material for **ADR-001: Reversal semantics**, to be written verbatim into `docs/decisions/0001-reversal-semantics.md` after the split in step 5. **Decision log:** §18a questions 1, 2, 4, 5, 7, 9, 10 and §18c questions 18, 19 each have a `RESOLVED v0.5.5` block appended preserving the original question text plus the founder's answer and reasoning. §18d checklist rows filled in for the same nine questions; rows 3, 6, 8, 11–17 remain `_still open — not in step-2 unblock set_` because they are not required to write the Phase 1.1 brief. **Known divergence deferred to the step-5 split:** Part 2 (Phase 1.1 Execution Brief) has a richer seed-script split (`db:seed:auth` via `tsx` + `db:seed` via `psql`) than Part 1's simplified single-script model. Part 2 also still references "three integration tests" in several places. Both are Part 2 reconciliation items to handle when Part 2 is extracted to `docs/specs/phase-1.1.md` — they are not v0.5.5 Bible edits because Part 1 is the authoritative design and Part 2 is the executable instance. v0.5.5 stamps Part 1 only; Part 2's v0.5.5 propagation happens during the split. **What v0.5.5 does NOT touch:** the stack (§256–281), the invariants (§284–409), the Phase 1 Simplifications (§412–605), §0's eight-divergence table, §14's event-sourcing decision, or any Phase 2+ plan content. The CLAUDE.md derivation and the Part 1/Part 2 split are step 4 and step 5 of the strategy sequence, not v0.5.5 content.**
> - **v0.5.6 — Step-5 split: Part 2 → docs/specs/phase-1.1.md, CLAUDE.md derived, ADR-001 written.** The step-5 split the v0.5.5 commit described as "next session, fresh eyes" is now complete. **Four deliverables:** (1) Part 2 extracted verbatim via `sed` from PLAN.md lines 4585-7993 to `docs/specs/phase-1.1.md` with three known divergences fixed during extraction — the obsolete v0.5.2 preamble block assuming Q1–Q19 defaults replaced with a v0.5.5-confirmed block carrying the founder answers inline; the test count (§6 header, §6 opening, §1 Goal paragraph, §4 SQL migration comment, §12 CLAUDE.md update block) propagated from three to five with explicit references to the v0.5.3 and v0.5.5 additions; and the inline `⚠️ Assumes Q5 default` marker replaced with a `v0.5.5 confirmed — Q5: Windows + WSL2` note. Tests 4 and 5 (service-middleware authorization and reversal mirror) were added to the brief as new subsections §6f and §6g with full skeleton implementations that mirror the existing §6b/§6c/§6d test shape — the helpers (`buildValidJournalEntryInput`, `buildBalancedEntryInput`) are left as Phase 1.1 TODOs pointing at §6b for the canonical shape. The `testDb.ts` setup file was updated to read from the `SUPABASE_TEST_URL` → `SUPABASE_URL` fallback chain per Q18 with an explicit error (not a silent fallback to `localhost:54321`) when neither is set. (2) **`CLAUDE.md` derived at the repo root** (184 lines, at the upper end of the CTO's "150–200 justified for financial apps" range; target was 120–170 but earned the extra length from the throwaway-work filter) from §0, §1d, §2b, §3a, §5c, §15, and the Critical Architectural Invariants. Ten non-negotiable rules: the Two Laws, `withInvariants()` universal wrap, money-as-string, the five anti-hallucination rules, Zod at every boundary, trace_id + idempotency_key, the reversal mirror rule with ADR-001 pointer, test parameterization (no hardcoded localhost), events table reserved-seat, and the Phase 1 simplifications temporary-not-permanent rule. The existing `@AGENTS.md` import is preserved at the top so the Next.js version-mismatch warning continues to load alongside the derived rules. (3) **`docs/decisions/0001-reversal-semantics.md` written** from §18c.19 RESOLVED verbatim as a 389-line ADR with the full template (Status / Date / Triggered by / Context / Decision / Consequences / Alternatives considered / Cross-references / Notes for future ADR writers), including the mid-cycle `audit_log` → `journal_entries` placement migration and its architectural rationale (semantic fit: the reason is a property of the reversal entry, not the mutation record; query shape: a single-table self-join is simpler than a filtered audit_log join). Five alternatives enumerated with their rejection reasons. (4) **`docs/decisions/README.md` written** as the ADR template and "when to write an ADR" guidance per §16, with the current-ADRs table listing 0001 as the first entry. **Part 1 edits produced during the split:** §1a folder tree updated with the richer seed model (`scripts/seed-auth-users.ts` at root + `src/db/migrations/seed/dev.sql` + `tests/setup/testDb.ts` + five integration test files including the two v0.5.5 additions + `.env.test.local` for Q18 test parameterization); §1b `db:seed` script replaced with the three-script model (`db:seed:auth` via `tsx`, `db:seed` via `psql`, `db:seed:all` for the combined run) plus a prose paragraph explaining the v0.5.5 reconciliation — the richer model had always been correct in Part 2 and the Part 1 §1b simplification was the outdated form; §2d "First-Pass SQL Migration" paragraph updated to reference `docs/specs/phase-1.1.md` instead of "Part 2 of PLAN.md"; top-of-file framing block rewritten to explain that Phase Execution Briefs live under `docs/specs/`, CLAUDE.md carries standing rules at the repo root, and ADRs live under `docs/decisions/`; "End of Part 1" close-out block rewritten to reflect the v0.5.6 split world with explicit pointers to phase-1.1.md, the (not-yet-written) phase-1.2.md and phase-1.3.md, and ADR-001. **What v0.5.6 does NOT touch:** any of the §0-§18 architectural content Part 1 carries. The split was file reorganization plus three targeted divergence fixes, not an architectural revision. The Architecture Bible's decisions, invariants, simplifications, and phase plans are unchanged from v0.5.5. **Verification:** a grep pass over the repo confirmed no stale `Part 2 of PLAN.md` references remain in operative text (the one that existed at §2d was the last, and it is fixed); no stale "three integration tests" references remain in operative text (five historical references in `docs/archive/Planv1.md` are left alone — that file is archived and not operative); the `SUPABASE_TEST_URL` parameterization is honored in `docs/specs/phase-1.1.md` §6a. **Pre-existing PLAN.md v0.5.5 changelog entry references to step 5 as "future work"** (above) are not retroactively updated — they are historical and capture what v0.5.5 knew at the time. The fact that step 5 is now complete lives in this v0.5.6 entry.**

> **Critical instruction to Claude Code:** This Bible is the result of multiple
> rounds of architectural review by senior distributed systems engineers, plus a
> deliberate Phase 1 simplification pass that traded engineering ceremony for
> shippability. Every decision recorded here is intentional and documented.
> **Do not make assumptions where the document is silent — flag ambiguities in
> the Open Questions section at the end instead.** Do not substitute your own
> judgment for decisions already made here. Where you disagree, say so explicitly
> in the Open Questions section. The goal is zero reasonable assumptions — only
> deliberate, documented decisions.
>
> **Where v0.5.0 simplified a v0.4.0 decision, the simplification is documented
> in the "Phase 1 Simplifications and Their Phase 2 Corrections" section. Each
> simplification names the invariant it temporarily bends, why, and exactly how
> Phase 2 restores it. Do not treat the simplifications as the permanent design.
> They are a deliberate, time-limited concession to ship Phase 1.**

---

## Reading Order

This Bible is long. Read it in passes, not front-to-back on the first sitting.

**First pass (what am I building and why?)** — ~30 minutes:
1. **Section 0** — the eight Phase 1 / long-term divergences (the tiebreaker map).
2. **Phase 1 Simplifications and Their Phase 2 Corrections** — what's temporary and what's forever.
3. **A/B/C Categorization** — the scope-discipline tool.
4. **Section 7 — Phase Plan** — what Phase 1.1, 1.2, 1.3 actually contain.
5. **Section 18 — Open Questions** — what the founder must resolve before Phase 1.1 starts.

**Second pass (how is it structured?)** — ~60 minutes:
6. Section 1 (Architecture Overview), Section 2 (Data Model), Section 5 (Agent Architecture — Phase 1 form).

**Deep dive (when touching a specific area):**
7. Sections 3 (Shared Schemas), 4 (Bridge UI), 6 (Intercompany), 8 (Hard Problems), 9 (Security), 10 (Perf/Scale), 14 (Event Sourcing decision), 15 (Contract Rules).

**Reference only:**
8. Sections 11 (i18n), 12 (Onboarding), 13 (Commodity vs Differentiation), 16 (Docs/ADRs), 17 (Phase 1.2 deferrals).

**If anything contradicts, Section 0 wins.** If Section 0 and the rest of the Bible disagree, Section 0 is the tiebreaker. If the Bible and a Phase Execution Brief (Part 2) disagree, the Bible wins and the brief is wrong — flag it.

---

## Section 0 — Phase 1 Reality vs Long-Term Architecture

**Read this section first. Before anything else.**

This is the single most important map in the document for understanding what
v0.5.0/v0.5.1 actually changed from v0.4.0. Eight architectural decisions made
in v0.4.0 are temporarily different in Phase 1. Each is listed here with its
v0.4.0 design, its Phase 1 form, and its Phase 2 path back to the long-term
architecture.

**Why this section exists at the front:** The rest of this Bible occasionally
describes the long-term Phase 2+ design (because that is the permanent target)
and occasionally describes the Phase 1 form (because that is what we are
actually building first). Without this map, those passages look contradictory.
With this map, the contradictions are visible as deliberate, time-limited
deviations with named correction paths.

Three of the eight divergences are documented in detail in the **"Phase 1
Simplifications and Their Phase 2 Corrections"** section later in this document
(audit log, events table, agents-collapsed-to-services). The other five are
deferrals of v0.4.0 infrastructure choices that did not warrant the same level
of detail because their Phase 2 path is mechanical (move folders, install
packages, split processes).

| # | v0.4.0 design | v0.5.0 Phase 1 form | Phase 2 path back |
|---|---|---|---|
| 1 | **pnpm workspaces monorepo** with `apps/` and `packages/` | **Single Next.js app**. Folder structure inside `src/` mirrors the future monorepo layout (`src/services/`, `src/agent/`, `src/db/`, `src/contracts/`, `src/shared/`) so the Phase 2 split is mechanical. | Phase 2 monorepo split. `src/services/` → `packages/services/`, `src/agent/` → `packages/agent/`, etc. The Next.js app becomes `apps/web/`; a new `apps/api/` is created. No business logic moves. |
| 2 | **Separate Express backend** (`apps/api`) with its own deployment | **Next.js API routes** (`src/app/api/`) serving as the backend. Same Vercel deployment as the frontend. | Phase 2 introduces `apps/api/` as a separate Express service deployed to Railway/Fly.io/Render. The trigger for the split is either scale (background jobs needed) or codebase size (the monorepo split itself pays for the Express split). |
| 3 | **Three-namespace contracts package** (`contracts/transport/`, `contracts/agent/`, `contracts/events/`) with TypeScript project references enforcing build-graph isolation | **One folder, one file**: `src/contracts/doubleEntry.contract.ts` with `_contract_version`, `trace_id`, `idempotency_key` as required fields. No project references. No three-namespace split. | Phase 2 generalizes to the full three-namespace structure once there are 5+ contracts and the actual pattern is visible from real use. The Phase 1 contract file moves into `packages/contracts/agent/` unchanged. |
| 4 | **Layer 1 Foundation Agents** (Auth Agent, Database Agent, Audit Agent) as named agents in `packages/agent/src/layer1-foundation/` | **Plain TypeScript service functions** in `src/services/`. No `layer1-foundation/` folder. No Database Agent abstraction. The service layer IS the database abstraction. See Simplification 3. | Phase 2 reintroduces `packages/agent/` with the Layer 1/2/3 folder structure once the AP Agent has been built and the actually-needed shared infrastructure is visible. Service functions stay in `packages/services/` as the inner ring; agents wrap them as the outer ring. |
| 5 | **Layer 2 Domain Agents** (Double Entry Agent, Chart of Accounts Agent, Period Agent) as named agents | **Service functions**: `journalEntryService.post()`, `chartOfAccountsService`, `periodService.isOpen()`. The single agent that exists in Phase 1.2 is the Double Entry Agent, defined as a Claude tool wrapping `journalEntryService.post()`. See Simplification 3. | Phase 2 wraps each service in a Layer 2 domain agent class inside `packages/agent/`. The service functions do not move. |
| 6 | **`events` table as single source of truth** with synchronous projection updates (Invariant 5) | **Reserved seat**: events table created with append-only trigger installed; nothing writes to it. `audit_log` written synchronously inside the same transaction as the mutation. See Simplification 1 and Simplification 2. | Phase 2 begins writing `JournalEntryPostedEvent` to the events table inside the mutation transaction. pg-boss is installed. A pg-boss subscriber writes the `audit_log` projection asynchronously after commit. A backfill script replays Phase 1 `audit_log` rows into the events table. |
| 7 | **Debit=credit enforcement: "deferred constraint or trigger"** (v0.4.0 left this open) | **Deferred constraint specifically.** A per-row trigger cannot check debit=credit because the rule is set-level, not row-level. The constraint is `DEFERRABLE INITIALLY DEFERRED` and runs at transaction COMMIT. | No correction needed — this is the permanent design. v0.5.1 just makes the choice explicit instead of leaving it open. |
| 8 | **Audit log via post-commit pg-boss job** triggered from a committed event (the projection model) | **Audit log written synchronously inside the same transaction** as the mutation. No pg-boss. No projection. See Simplification 1. | Phase 2 corrects to the projection model. The synchronous audit_log write is replaced by an event write inside the transaction; pg-boss writes the audit_log projection after commit. The Phase 1 audit_log rows are backfilled into events. |

**The eight in one sentence:** Phase 1 is a single Next.js app with services
instead of agents, one contract file instead of a three-namespace package, a
synchronously-written audit log instead of an event-projection system, and a
deferred constraint instead of "deferred constraint or trigger" — and every one
of those simplifications has a named, scheduled Phase 2 correction.

**If anything in the rest of this document seems to contradict the Phase 1
plan, this table is the tiebreaker.** The Phase 1 column is what we build
first. The Phase 2 column is where we end up. The v0.4.0 column is the design
both columns are reaching for.

---

## Who This Is For

I am a **non-developer founder** building an internal accounting platform for a
Canadian family office. I have strong product vision but will need explicit,
step-by-step guidance — especially around environment setup, folder structure,
and where every piece of logic lives. Write the plan as if a brilliant senior
engineer is leaving an extremely detailed roadmap for a junior developer who has
never built a production app before, but who will be guided by an AI coding
assistant (Claude Code) throughout execution.

Every time a technical concept appears that a non-developer might not know, a
one-sentence plain-English explanation in parentheses follows it.

---

## The Product: What This Is and Why It Is Different

### Name (working title): **The Bridge**
Inspired by the command bridge of the Starship Enterprise — the central place
where the captain (the user) has total situational awareness and can issue
commands carried out by a trained crew (the AI agents).

### What existing software gets wrong

Puzzle.io and Pennylane are modern-looking wrappers around the same paradigm as
QuickBooks and Xero. They added an AI chatbot on top of a traditional accounting
system. That is the wrong direction. **The Bridge is an AI agent system that
happens to have a traditional accounting UI underneath it — not the reverse.**

The philosophical difference:
- In Xero, you open a screen, fill in a form, click Save. The AI is a helper.
- In The Bridge, the AI agent is the primary actor. It reads your email, sees
  the invoice, proposes the journal entry, shows you a confirmation card, and
  you approve with one click. The traditional screen exists as a fallback and a
  power-user tool — not the default path.

### What genuinely differentiates this product

1. **The Bridge UI pattern** — A persistent split-screen layout: AI agent chat
   on the left, a live Contextual Canvas on the right. When the agent references
   an invoice, P&L, reconciliation batch, or vendor record, it renders
   immediately in the canvas. The user never has to scroll back through chat
   history to find a table or graph. The canvas is stateful — drill-downs happen
   inside it without leaving the conversation.

2. **Agent Institutional Memory** — The agent builds an `org_context` knowledge
   store per organization: known vendors and their default GL mappings, recurring
   transaction patterns, seasonal expense rhythms, intercompany relationship
   maps, and approval rules. This memory is rule-based (stored as auditable
   records, not opaque model weights) so junior users are protected and
   controllers can review, edit, or override any learned rule. Trust is earned
   incrementally — the agent starts in "always confirm" mode and can be promoted
   to "auto-categorize with notification" for specific rule types after a
   controller explicitly unlocks that.

3. **Multi-entity consolidation as a first-class concept** — 50 organizations
   across healthcare, real estate, hotels, NYSE trading, global export, private
   equity, and restaurants. The platform must support: role-based org switching
   (CFO sees consolidated view; AP specialist sees their assigned entities),
   intercompany transaction detection and reciprocal entry matching,
   consolidated P&L with elimination entries, and entity-level roll-ups. No
   competitor handles this well for a family office context.

4. **AP Automation as the primary Phase 2 workflow** — The single most painful
   daily task is Accounts Payable. The AP Agent owns this workflow end-to-end
   beginning Phase 2: email ingestion → OCR → proposed journal entry with
   intercompany flag → confirmation card → post. **Phase 1 does not include the
   AP Agent.** Phase 1 proves the agent stack works for manual journal entries
   first; only after that proof does AP become safe to build.

5. **Confirmation-first mutation model** — Every AI-initiated financial write
   produces a structured **Proposed Entry Card** before anything touches the
   ledger. The card shows: entity name, vendor, amount, debit/credit lines,
   intercompany flag (if applicable), matched rule from institutional memory (if
   any), and a plain-English explanation of why the agent made this choice.
   One-click Approve or a free-text rejection reason. This is the trust layer
   that makes the system auditable.

6. **Industry-specific Chart of Accounts templates** — On org creation, the
   user selects an industry (healthcare, real estate, hospitality, trading,
   restaurant, holding company) and gets a pre-built IFRS-compliant CoA template.
   Phase 1.1 seeds only the templates the founder will actually use to create
   real orgs (likely two: holding company + real estate). The remaining four are
   added in Phase 1.3 or Phase 2 when needed.

7. **Trilingual interface** — English, French (fr-CA), and Traditional Mandarin
   (zh-Hant). All UI strings and report labels support i18n from day one. Agent
   responses are structured data, not English prose — the UI layer renders the
   localized text from the structured output.

---

## Non-Negotiable Constraints

- **Accounting standard:** IFRS (International Financial Reporting Standards)
- **Jurisdiction:** Canada — flag GST/HST implications throughout; Flinks is the
  preferred bank feed provider for Canadian institutions (not Plaid)
- **Languages:** English, French (fr-CA), Traditional Mandarin (zh-Hant)
- **Users:** ~100 across three personas (see below)
- **Entities:** ~50 organizations, multi-industry
- **Developer profile:** Solo non-developer founder using AI-assisted coding

---

## The Three User Personas

Design every screen, agent response, and permission model with these three
personas in mind. They are equally first-class.

### Persona 1: The Executive (CFO / Founder)
- Wants consolidated P&L across all entities, cash position, variance alerts
- Asks the agent high-level questions: "What compressed my hotel division's
  margins last quarter?" or "What's my runway across all entities if revenue
  drops 20%?"
- Approves large or unusual transactions
- Never wants to touch a journal entry manually
- Default landing: Consolidated Dashboard

### Persona 2: The Controller / Senior Accountant
- Manages month-end close, reviews AI-proposed entries, approves learned rules
- Needs full access to Chart of Accounts, Manual Journals, Period Locking,
  Intercompany Eliminations, and the AI Action Review queue
- Trusts the agent but verifies — wants to see the agent's reasoning, not just
  its answer
- Default landing: The Bridge (agent + canvas) with controller-level tool access

### Persona 3: The AP Specialist / Bookkeeper
- Primary daily loop (Phase 2+): process incoming bills, match bank transactions,
  reconcile
- Protected from making mistakes by the agent's rule-based guardrails — they
  cannot post to locked periods, cannot override intercompany flags, cannot
  approve their own entries
- The agent is their co-pilot: it pre-fills everything, they confirm
- Default landing (Phase 2+): AP Queue (inbox of pending AI-proposed entries)

---

## Locked-In Stack (v0.5.0)

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict mode, no `any` without justification comment) | End-to-end |
| Application | **Single Next.js app (Phase 1)** | API routes handle backend; no separate Express |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) | |
| AI Model | Claude (Anthropic) via `@anthropic-ai/sdk` | Model-agnostic abstraction layer |
| Repo | **Single Next.js repo (Phase 1)**, monorepo deferred to Phase 2 | |
| Deploy | Vercel | |
| Version Control | Git / GitHub | |
| IDE | VS Code | |
| API Testing | Postman | Deliver a collection per phase |
| Bank Feeds | Flinks (Canada-first) | Phase 2 |
| i18n | `next-intl` | English, fr-CA, zh-Hant |
| Background Jobs | **None in Phase 1** — pg-boss deferred to Phase 2 | |
| Logging | **`pino` with redact list** (Phase 1.1, Category A) | |

**What changed from v0.4.0:** The monorepo (`pnpm workspaces`) and the separate
Express backend are both deferred to Phase 2. Phase 1 ships as a single Next.js
app with Next.js API routes serving as the backend. The folder structure inside
`src/` mirrors the future monorepo layout (`src/services/`, `src/agent/`,
`src/db/`, `src/contracts/`) so the Phase 2 split is mechanical, not a rewrite.
See "Phase 1 Simplifications and Their Phase 2 Corrections" for the full
reasoning and the Phase 2 correction path.

---

## Critical Architectural Invariants

These are the rules every part of the system must obey. They are stated here
once and referenced everywhere else. Where Phase 1 temporarily bends an
invariant for shippability reasons, the bend is documented in the "Phase 1
Simplifications and Their Phase 2 Corrections" section, not buried in code.

### Invariant 1 — Service Layer

Business logic lives exclusively in `src/services/` (Phase 1) which becomes
`packages/services` in Phase 2. Next.js API routes, Next.js server components,
and (in Phase 2) agent tools are all thin adapters over service functions. No
exceptions. An API route handler must never contain a database query. An agent
tool must never contain accounting logic. A React server component that needs
data calls a service function — it does not import the Supabase client directly.

(Plain English: a "service function" is a normal TypeScript function that takes
typed inputs, runs a piece of business logic, talks to the database, and returns
a typed result. Putting all of them in one folder means you have exactly one
place to look when you ask "where is the rule for X?")

### Invariant 2 — The Two Laws of Service Architecture (v0.5.0 restatement)

In v0.4.0 these were stated as the Two Laws of Agent Architecture, with
"Database Agent" and "Double Entry Agent" as the enforcement points. In v0.5.0,
because Layer 1 and Layer 2 agents collapse to service functions in Phase 1
(see Phase 1 Simplifications), the Two Laws are restated in service terms. They
hold the same shape and the same intent.

> **Law 1:** All database access goes through `src/services/` only. No route
> handler, no agent tool, no React server component reads or writes the database
> directly.
>
> **Law 2:** All journal entries — regardless of source — are created by
> `journalEntryService.post()` only. No other function in the codebase may
> insert into `journal_entries` or `journal_lines`.
>
> **Enforcement mechanism:** These laws are enforced by code review and by the
> `withInvariants()` middleware wrapper on every service function. Any PR that
> introduces a direct database call outside `src/services/` must be rejected
> regardless of how urgent the reason seems.

**Phase 2 evolution.** When Layer 1 and Layer 2 agents are reintroduced in
Phase 2, Law 1 narrows to "all DB access goes through the Database Agent (which
wraps `packages/services`)" and Law 2 narrows to "all journal entries go through
the Double Entry Agent (which wraps `journalEntryService.post()`)." The service
layer remains the enforcement point in both phases. The agent layer in Phase 2
adds an additional outer ring; it does not replace the inner ring.

### Invariant 3 — The Four-Layer Truth Hierarchy (lower layers always win)

This is the single most important rule for resolving conflicts between parts of
the system. When two layers disagree about what is true, the lower layer wins.
Always. No exceptions.

```
Layer 4 — Cognitive Truth    → Agents (Phase 2+) / Service callers (Phase 1)
           Advisory only. They propose. They are never authoritative.
           A service caller saying "this entry is valid" means nothing if Layer 1 rejects it.

Layer 3 — Temporal Truth     → Event Stream (reserved seat in Phase 1, written from Phase 2)
           What happened, in order, replayable. The event stream is the
           single source of record for history once it begins being written.
           In Phase 1, audit_log serves this role synchronously inside the
           transaction (see Phase 1 Simplifications). Phase 2 promotes the
           events table to primary truth and demotes audit_log to a projection.

Layer 2 — Operational Truth  → Service Layer + Middleware Invariants
           Business rules, authorization, routing logic.
           Enforced by withInvariants() middleware before any database write.

Layer 1 — Physical Truth     → Database Constraints + Triggers
           The physics of the system. Cannot be bypassed by any code path.
           Debit=credit deferred constraint, period lock trigger, org_id constraints,
           events table append-only trigger.
           If Layer 1 rejects something, it is rejected. Full stop.
```

**Why this matters in practice:**
- "Service caller says posted but DB rejected" → DB wins. Entry never happened.
- "Service thinks valid but constraint rejects" → Constraint wins. Service gets an error.
- "Agent (Phase 2+) proposed account X" → Advisory only. Human confirms or rejects.

### Invariant 4 — Pre-Commit Invariant Validation

All invariant checks run BEFORE the database transaction commits. Invariants
are NEVER enforced by post-commit subscribers. The reason: if an invalid write
sneaks through to a committed state before being caught, the historical record
is corrupted. In an accounting system, corrupted truth in the audit trail is
catastrophic. The rule is absolute: validate first, write second, commit third —
all inside a single database transaction that rolls back entirely on any failure.

### Invariant 5 — Event Stream as Single Source of Truth (Phase 2+ — Phase 1 Exception Below)

**Phase 2+ form (the permanent design):** The event stream (`events` table,
append-only) is the only primary source of truth in the system. Everything else
is a derived projection: `audit_log` is a projection of events; GL account
balances are projections of `JournalEntryPostedEvent` records; dashboard figures
are projections of events. If a projection is wrong, fix it by correcting the
projection query — never by patching the projection table directly.

**Phase 1 form (temporary simplification — see Phase 1 Simplifications):** The
`events` table exists with its append-only trigger installed but is not written
to. `audit_log` is written synchronously inside the same transaction as the
mutation. This temporarily violates the "events as source of truth" rule, but
keeps Phase 1 operationally simple. Phase 2 begins writing to events,
introduces pg-boss for projection updates, and demotes `audit_log` to a derived
projection.

### Invariant 6 — No Free-Form Data at Service Boundaries

The LLM's natural language reasoning stays inside the agent layer (Phase 2+).
Every field that crosses the agent-to-service boundary must be typed, validated
by Zod schema (Plain English: Zod is a TypeScript library that lets you describe
the shape of an object once and then both check that real data matches that
shape and get TypeScript types from it for free), and deterministic. No
free-text amounts. No unvalidated account codes. No inferred values that
weren't explicitly retrieved from the database. If an agent cannot produce a
valid typed value for a required field, it must ask a clarifying question or
return an error — not guess.

In Phase 1, where the "agent" layer is minimal (just the Double Entry Agent
calling `journalEntryService.post()`), this invariant still holds: every input
to every service function is Zod-validated at the function boundary, and
`withInvariants()` middleware re-validates before execution.

---

## Phase 1 Simplifications and Their Phase 2 Corrections

This section is the most important new section in v0.5.0. It exists because
v0.5.0 deliberately bends three architectural rules to make Phase 1 shippable
by a solo non-developer founder. Each bend is named, the invariant it
temporarily violates is named, the Phase 2 correction is specified concretely,
and a Phase 2 acceptance criterion is given so the correction can be verified
when it happens.

**Read this section before reading the Phase 1.1 Execution Brief.** Without
it, the Phase 1.1 brief will look like it contradicts the rest of this Bible.
With it, you understand exactly which contradictions are deliberate, why, and
when they end.

These simplifications are not the permanent design. They are a deliberate,
time-limited concession to ship Phase 1. The Phase 2 corrections are not
optional improvements — they are scheduled, named, and tracked.

### Simplification 1 — Audit log written synchronously inside the transaction

**What Phase 1 does:** The `audit_log` row is written by the same service
function that writes the mutation, inside the same Postgres transaction. If
the mutation rolls back, the audit row rolls back with it. There is no
post-commit job, no projection layer, no pg-boss worker, no separate Audit
Agent. The function call looks roughly like this:

```typescript
await db.transaction(async (tx) => {
  await tx.insert('journal_entries', entry);
  await tx.insert('journal_lines', lines);
  await tx.insert('audit_log', auditRow);  // synchronous, same transaction
});
```

**Invariant temporarily violated:** Invariant 5 (Event Stream as Single Source
of Truth). In the permanent design, `audit_log` is a projection of events,
updated asynchronously after commit by a job triggered from a committed event.
In Phase 1, `audit_log` is the primary record, and the events table is not
written to at all.

**Why we accept this in Phase 1:** A solo non-developer founder running
pg-boss in a single Next.js Vercel deployment is operationally complex.
Vercel serverless functions are not a good home for long-running workers.
Adding pg-boss in Phase 1 means either running a separate worker process
(reintroducing the operational burden the monorepo deferral was supposed to
remove) or accepting unreliable job execution. Neither is acceptable. The
simpler synchronous path is correct for ~100 users on Phase 1 traffic.

**Phase 2 correction (concrete):**
1. Provision a long-lived worker host (Railway, Fly.io, or Render) — the
   same host that will run the separate Express backend after the monorepo
   split.
2. Install pg-boss against the existing Supabase Postgres database.
3. The `journalEntryService.post()` function changes: instead of writing
   `audit_log` directly inside the transaction, it writes a row to the
   `events` table inside the same transaction (the events table append-only
   trigger has been in place since Phase 1.1, so this is mechanical).
4. A pg-boss job subscribes to `JournalEntryPostedEvent` and writes the
   `audit_log` projection asynchronously after commit.
5. A backfill script replays every Phase 1 `audit_log` row into the events
   table so the historical record is reconstructed correctly. This script is
   written and tested before Phase 2 ships, not after.
   **v0.5.3 (A6): the backfill script must be pure `INSERT` — no
   `ON CONFLICT DO UPDATE`, no `UPSERT`, no `MERGE`.** The events table's
   append-only triggers (`BEFORE UPDATE`, `BEFORE DELETE`, and
   `BEFORE TRUNCATE` — v0.5.3) reject any statement that touches an
   existing row, and an `ON CONFLICT DO UPDATE` clause fires the
   `BEFORE UPDATE` trigger on the conflicting row. If the backfill
   script is run twice and attempts an upsert on the second run, it
   will be rejected by the trigger even though the script author
   intended idempotency. The correct idempotency pattern is: generate a
   deterministic `event_id` from (`aggregate_id`, `sequence_number`,
   `event_type`), and rely on a pre-check (`SELECT 1 FROM events
   WHERE event_id = $1`) to skip already-backfilled rows before
   INSERT. Tested against a Phase 1 audit_log snapshot in a scratch DB
   before Phase 2 shipping.

**Phase 2 acceptance criterion:** Querying `events` for any historical
`JournalEntryPostedEvent` returns the same data that exists in `audit_log`,
and a fresh `audit_log` rebuild from events produces a byte-identical result.

### Simplification 2 — Events table reserved-seat (created, not written)

**What Phase 1 does:** The `events` table is created in the Phase 1.1 initial
SQL migration with all columns the permanent design needs (`event_id`,
`event_type`, `org_id`, `aggregate_id`, `aggregate_type`, `payload jsonb`,
`occurred_at`, `recorded_at`, `trace_id`, `_event_version`, sequence column).
The append-only Postgres trigger that rejects any UPDATE or DELETE on the
table is installed and tested. **Nothing writes to it.** No service function
inserts events. No projection reads from it. It is a reserved seat at the
table.

**Invariant temporarily violated:** Invariant 5 (the events table is the
single source of truth). In Phase 1, `audit_log` plays that role, written
synchronously per Simplification 1.

**Why we accept this in Phase 1:** The retrofit cost of adding an events
table to a populated production database with real financial history is high
and risky. The cost of creating an empty table with the right schema and
trigger now is one SQL migration. We pay the small cost now to avoid the
large cost later. We do not write to it now because writing to it requires
the projection infrastructure (Simplification 1), which Phase 1 cannot
operate.

**Phase 2 correction (concrete):**
1. Phase 2 ships with `journalEntryService.post()` writing
   `JournalEntryPostedEvent` to the events table inside the same transaction
   as the mutation.
2. Every other mutating service function adds an event write the same way.
3. The pg-boss projection job (Simplification 1) reads from the events table
   to update `audit_log` and any other projections.
4. The backfill script from Simplification 1 populates the events table with
   reconstructed events from the Phase 1 `audit_log` history.

**Phase 2 acceptance criterion:** A SELECT against the events table returns
at least one row per Phase 2 journal entry mutation, and the historical
backfill rows are present and correctly typed.

### Simplification 3 — Layer 1 and Layer 2 "agents" collapsed to service functions

**What Phase 1 does:** The v0.4.0 design specified six named agents across
two layers: Auth Agent, Database Agent, and Audit Agent (Layer 1 Foundation),
plus Double Entry Agent, Chart of Accounts Agent, and Period Agent (Layer 2
Domain). v0.5.0 replaces them in Phase 1 with plain TypeScript service
functions in `src/services/`:

| v0.4.0 Agent | v0.5.0 Phase 1 equivalent |
|---|---|
| Auth Agent | `src/services/auth/canUserPerformAction()` |
| Database Agent | `src/services/` itself — there is no separate abstraction |
| Audit Agent | `src/services/audit/recordMutation()` called inline (Simplification 1) |
| Double Entry Agent | `src/services/accounting/journalEntryService.post()` |
| Chart of Accounts Agent | `src/services/accounting/chartOfAccountsService` |
| Period Agent | `src/services/accounting/periodService.isOpen()` |

The single agent that exists in Phase 1.2 is the **Double Entry Agent** —
which is the Claude tool definition that wraps `journalEntryService.post()`.
That is the entire agent surface area in Phase 1. Every other piece of
"agent" architecture from v0.4.0 is a service function.

**Invariant temporarily violated:** None directly. The Two Laws hold
verbatim in their v0.5.0 service-layer restatement (see Invariant 2). The
Four-Layer Truth Hierarchy still applies — Layer 4 (Cognitive) just has
fewer occupants in Phase 1.

**Why we accept this in Phase 1:** Building six named agents with input/output
contracts, system prompts, and orchestration before any of them have been
exercised against real workflows is premature design. You cannot generalize
the right shape for an agent class until you have at least two real agents
solving real problems. Phase 1 builds one (Double Entry) and proves it works.
Phase 2 builds the second (AP) and learns from the comparison what the actual
shared abstractions need to be.

**Phase 2 correction (concrete):**
1. When the AP Agent is built, it will reveal the shared infrastructure both
   agents need (system prompt loading, tool definition format, dry-run
   handling, idempotency check, trace propagation, error envelopes).
2. Extract that shared infrastructure into `packages/agent/` as part of the
   Phase 2 monorepo split.
3. Reintroduce the Layer 1 / Layer 2 / Layer 3 folder structure inside
   `packages/agent/` at that point — informed by what AP actually needed,
   not by what v0.4.0 guessed it would need.
4. The service functions do not move. They stay in `packages/services/` as
   the inner ring. The agent classes wrap them as the outer ring.

**Phase 2 acceptance criterion:** A new workflow agent (e.g., AR Agent in
Phase 3) can be added by writing only its system prompt, its tool definitions,
and any new service functions it needs. No edits required to existing agents
or to the agent infrastructure.

### What is NOT simplified

For the avoidance of doubt, these v0.4.0 commitments are unchanged in v0.5.0
and apply to Phase 1 in full:

- Multi-org from day one with `org_id` on every tenant-scoped table
- Multi-user with the three personas and `memberships` table from day one
- RLS policies on every tenant-scoped table from day one
- The `events` table created with append-only trigger from day one (just not written)
- Idempotency keys on every mutating operation from day one
- Trace IDs propagated from the orchestrator through every layer from day one
- IFRS Chart of Accounts structure from day one
- Multi-currency columns on every financial table from day one (see Section 2)
- Canadian tax codes table from day one
- Intercompany relationships table from day one (empty, but schema correct)
- The Bridge UI split-screen shell with Mainframe rail from day one
- Industry CoA templates seeded for the orgs the founder will actually use
- i18n URL structure `/[locale]/[orgId]/...` from day one
- The Two Laws (in v0.5.0 service-layer form) from day one
- The Four-Layer Truth Hierarchy from day one
- Pre-commit invariant validation via `withInvariants()` middleware from day one
- All Zod validation at every service boundary from day one
- The deferred constraint for debit=credit from day one (see Section 1d)

---

## A/B/C Categorization: What to Build When

This is the framework v0.5.0 uses to decide what goes in Phase 1 vs. later.
It is the most useful mental model in this Bible after the Truth Hierarchy.

- **Category A — Build now, no question.** Cheap to add now, painful to
  retrofit later. Multi-org columns, RLS, the events table schema,
  idempotency keys, trace IDs. The cost of adding these now is days. The
  cost of adding them later is months and silent bugs.
- **Category B — Foundation now, full implementation later.** Build the
  shape now so the Phase 2+ implementation slots into a correct structure.
  The Bridge split-screen UI shell, the i18n URL structure, the contracts
  folder with one real contract.
- **Category C — Genuine unknowns, defer.** Things whose correct shape
  cannot be known until reality teaches us. Streaming agent responses,
  prompt caching strategies, monorepo structure, the full three-namespace
  contracts package. Reality will tell us what these need to be.

### Category A — Build Now (Phase 1.1 Foundation)

Each item is non-negotiable for Phase 1.1.

| Item | Why now |
|---|---|
| `org_id` on every tenant-scoped table | Retrofitting multi-tenancy is one of the most painful refactors that exists |
| `memberships` table + `UserRole` enum + role-aware org switcher | Single-user-then-add-roles is a per-screen retrofit |
| `events` table created with append-only trigger (not written) | Reserved seat — see Simplification 2 |
| `idempotency_key` UUID column on every mutating operation | Prevents double-posting on retries; one column |
| Trace ID generated by the orchestrator and propagated through every layer | Without it, debugging a wrong journal entry is impossible |
| IFRS-structured Chart of Accounts | Different from GAAP; retrofit is painful |
| Multi-currency columns on `journal_lines`, `bills`, `invoices`, `bank_transactions` | `currency`, `amount_original`, `amount_cad`, `fx_rate` — uniform across all financial tables |
| `tax_codes` table for GST/HST abstraction | Never hardcode rates; one new row per rate change |
| `intercompany_relationships` table (empty in Phase 1) | The data model must be correct when Phase 2 arrives |
| `intercompany_batch_id` column on `journal_entries` (nullable) | Backfilling FK columns to a populated table is painful |
| `source` enum accepting `'manual' \| 'agent' \| 'import'` from day one | Avoids a Phase 1.2 migration when the agent path lights up |
| `autonomy_tier` enum on `vendor_rules` | Avoids adding a required field to a populated table in Phase 2 |
| `routing_path` field on the `ProposedEntryCard` TypeScript type | Display only in Phase 1; routing logic in Phase 2 — reserved |
| Boot-time assertion throwing on missing critical env vars | `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` — refuse to start without them |
| `pino` structured logger with redact list configured at boot | Trace IDs are useless without a searchable log; redact list per Section 9e |
| **Five** integration tests as a correctness floor (v0.5.5 count — see §10a) | (1) unbalanced entry rejected by deferred constraint, (2) post to locked period rejected, (3) cross-org RLS isolation, (4) service middleware authorization (v0.5.3, A3), (5) reversal mirror enforcement (v0.5.5, Q19) |
| Seed script: 2 orgs + 3 users with three roles | Lets you nuke and rebuild local state in 30 seconds |
| Industry CoA templates seeded for ONLY the orgs you will actually create | Likely two: holding company + real estate. Other four added when needed. |

### Category B — Foundation Now, Full Implementation Later

Build the shell, slot in the implementation per phase.

| Item | Phase 1 form | Phase 2+ form |
|---|---|---|
| The Bridge split-screen UI | Shell with Mainframe rail, agent panel, canvas panel. Phase 1 canvas renders Chart of Accounts, Journal Entry form/list, basic P&L, AI Action Review. | Additional canvas views per phase. Shell unchanged. |
| Three-layer agent stack | Layer 1 + Layer 2 collapsed to service functions in `src/services/` (Simplification 3). Double Entry Agent is the one real agent, defined as a Claude tool wrapping `journalEntryService.post()`. | `packages/agent/` reintroduced with Layer 1/2/3 folder structure, informed by AP Agent's actual needs. |
| Contracts package | `src/contracts/` folder with one real file: `doubleEntry.contract.ts` containing the `PostJournalEntryCommand` schema with `_contract_version`, `trace_id`, `idempotency_key` as required fields. | Full three-namespace structure (`transport/`, `agent/`, `events/`) with TypeScript project references. Built when there are 5+ contracts and the pattern is clear. |
| i18n URL structure | `/[locale]/[orgId]/...` from day one. Only English strings populated in Phase 1.1. | French and Traditional Mandarin strings added per phase. URL structure unchanged. |
| Industry CoA templates | Two templates seeded (holding company + real estate). | Remaining four added in Phase 1.3 or Phase 2. |
| Mainframe icon rail | Built fully in Phase 1. Every Phase 1 canvas component must work without the agent — the Mainframe is the graceful degradation path when the Claude API is unavailable. | Unchanged. |

**Mainframe constraint (called out explicitly because it shapes every canvas
component):** No Phase 1 canvas component is allowed to require the agent to
function. The agent is a composer; the canvas components are standalone. This
is not a Phase 2 nicety — it is a Phase 1.1 build constraint.

### Category C — Defer Until Reality Teaches

Each of these is a decision that looks like progress but is actually
guessing without data.

| Item | Why defer |
|---|---|
| Monorepo with `pnpm workspaces` | Single Next.js app is adequate for Phase 1. Monorepo pays off when there are multiple deployable processes. Phase 2. |
| Separate Express backend | Next.js API routes handle ~100 users comfortably. Split when scale or background processing demands it. Phase 2. |
| Full three-namespace contracts package with TypeScript project references | Marginal value with one developer and one contract. Phase 2 when there are multiple contracts and the pattern is visible. |
| `pg-boss` background jobs | Phase 1 has zero async work. Adding it before there is work for it adds operational burden with no payoff. Phase 2 alongside AP email ingestion. |
| Full CQRS projection system | Events table is reserved-seat in Phase 1; projections come with Phase 2 (Simplification 1). |
| Flinks bank feeds | Cannot test without AP automation. Phase 2. |
| OCR and email ingestion | Phase 2. |
| Mobile responsive layout | Desktop-only in Phase 1. Phase 3. |
| Pre-populated ADRs (ADR-001 through ADR-007) | ADRs are valuable when written in anger with real tradeoffs. Pre-populated ADRs become cargo-cult docs that rot. `docs/decisions/` exists as an empty folder with a template README; ADRs are written as decisions are made, not before. |
| Pre-built Layer 3 workflow agent stubs (AP, AR, Reporting) | Premature design — you will throw it away in Phase 2 when you meet the real workflow. No stub files exist in Phase 1. |
| Generalizing the contracts pattern | Need at least two real contracts before generalizing. Phase 2. |

### One nuance on `intercompany_relationships`

The table exists in Phase 1.1 (Category A) because the cost is five columns
and a few foreign keys. **But nothing writes to it in Phase 1.** The value of
having it now is purely schema correctness for Phase 2. Add a comment on the
table definition: `-- Populated in Phase 2 by AP Agent. Do not write to manually.`
Do not let "the intercompany table exists" create a false sense that
intercompany handling exists. It does not exist until Phase 2.

---

## Section 1 — Architecture Overview

### 1a. Phase 1 Folder Tree (single Next.js app)

The Phase 1 folder structure inside `src/` mirrors the future monorepo layout
so that the Phase 2 split is mechanical (move folders out of `src/` into
`packages/`), not a rewrite.

```
the-bridge/                    # single Next.js app, single repo, no pnpm workspaces
  src/
    app/                       # Next.js App Router
      [locale]/
        [orgId]/
          accounting/
            chart-of-accounts/
              page.tsx         # CoA list canvas view
              [accountId]/
                page.tsx       # CoA detail
            journals/
              page.tsx         # Journal entry list canvas view
              new/
                page.tsx       # Manual journal entry form
              [entryId]/
                page.tsx       # Journal entry detail
          agent/
            actions/
              page.tsx         # AI Action Review queue (controller role)
          reports/
            pl/
              page.tsx         # Basic P&L canvas view (read-only)
        consolidated/
          dashboard/
            page.tsx           # Stub, role-gated
      admin/
        orgs/
          page.tsx             # Org creation with industry CoA template selection
      sign-in/
        page.tsx
      api/                     # Next.js API routes — thin adapters over src/services/
        accounting/
          journals/
            route.ts           # POST creates a journal entry via journalEntryService
          chart-of-accounts/
            route.ts
        agent/
          message/
            route.ts           # POST sends a user message to the orchestrator
          confirm/
            route.ts           # POST confirms a ProposedEntryCard
        health/
          route.ts             # GET health check
    services/                  # ALL business logic — Invariant 1, single source of truth
      auth/
        canUserPerformAction.ts
        getMembership.ts
      accounting/
        journalEntryService.ts          # journalEntryService.post() — Law 2 enforcement point
        chartOfAccountsService.ts
        periodService.ts                # periodService.isOpen() — replaces v0.4.0 Period Agent
      org/
        orgService.ts
        membershipService.ts
      audit/
        recordMutation.ts               # synchronous audit_log write — Simplification 1
      middleware/
        withInvariants.ts               # the universal service wrapper
        serviceContext.ts               # ServiceContext type with trace_id, org_id, caller
      index.ts                          # exports only — no logic
    agent/                              # the agent layer (minimal in Phase 1)
      orchestrator/
        index.ts                        # main agent loop — Claude API call, tool routing
        systemPrompts/
          controller.ts                 # one persona prompt — others added in Phase 2
          executive.ts
          apSpecialist.ts
      tools/
        postJournalEntry.ts             # the ONE tool definition — wraps journalEntryService.post()
        listChartOfAccounts.ts
        checkPeriod.ts
      session/
        agentSession.ts                 # AgentSession type, in-Postgres persistence
      memory/
        orgContextManager.ts            # loads vendor rules, intercompany map per org
      canvas/
        directives.ts                   # CanvasDirective discriminated union
    contracts/                          # one folder, one file in Phase 1
      doubleEntry.contract.ts           # PostJournalEntryCommand schema with version, trace, idempotency
    db/
      adminClient.ts                    # service-role Supabase client (server-only)
      userClient.ts                     # user-scoped Supabase client (RLS-respecting)
      types.ts                          # generated by `supabase gen types typescript`
      migrations/
        001_initial_schema.sql          # full Phase 1.1 migration (see Section 2d)
        seed/
          industryCoA.sql               # CoA templates per industry — Phase 1.1 seeds holding_company + real_estate (Q1)
          dev.sql                       # orgs + memberships + fiscal periods — runs AFTER scripts/seed-auth-users.ts has created the Supabase Auth users. See docs/specs/phase-1.1.md §5b.
    shared/
      schemas/                          # Zod primitives shared across services and UI
        accounting/
          journalEntry.schema.ts        # the canonical schema, imported by service + tool + form
        ids.schema.ts                   # branded UUID types
      types/
        proposedEntryCard.ts
        userRole.ts
      i18n/
        config.ts                       # next-intl config — en, fr-CA, zh-Hant
      logger/
        pino.ts                         # structured logger with redact list
    components/
      bridge/
        SplitScreenLayout.tsx           # the main shell — chat panel + canvas panel + Mainframe rail
        AgentChatPanel.tsx
        ContextualCanvas.tsx
        MainframeRail.tsx
      canvas/
        ChartOfAccountsView.tsx         # standalone — does not require the agent
        JournalEntryForm.tsx            # standalone
        JournalEntryList.tsx            # standalone
        ProposedEntryCard.tsx           # rendered when directive.type === 'proposed_entry_card'
        BasicPLView.tsx                 # standalone
        AIActionReviewQueue.tsx         # standalone
  messages/                             # next-intl translation files
    en.json                             # populated in Phase 1.1
    fr.json                             # placeholder structure, content in later phases
    zh-Hant.json                        # placeholder structure, content in later phases
  docs/
    prompt-history/
      CHANGELOG.md                      # master version log
      v0.5.0-phase1-simplification.md
    decisions/
      README.md                         # ADR template only — no pre-populated ADRs
    troubleshooting/
      rls.md                            # "if a query returns empty when you expect data, suspect RLS first"
  postman/
    collection.json
  tests/
    setup/
      testDb.ts                         # parameterized SUPABASE_TEST_URL fallback chain — Q18, no hardcoded localhost
      loadEnv.ts                        # loads .env.test.local for integration tests
    integration/
      unbalancedJournalEntry.test.ts              # Category A floor #1 — deferred constraint
      lockedPeriodRejection.test.ts               # Category A floor #2 — period-lock trigger
      crossOrgRlsIsolation.test.ts                # Category A floor #3 — RLS
      serviceMiddlewareAuthorization.test.ts      # Category A floor #4 — withInvariants() A3 (v0.5.3)
      reversalMirror.test.ts                      # Category A floor #5 — reversal mirror (v0.5.5, Q19)
  scripts/
    seed-auth-users.ts                  # tsx — creates Supabase Auth users via admin API (Q10). Runs BEFORE dev.sql.
  .env.example
  .env.test.local                       # gitignored — carries SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY for integration tests (Q18)
  .nvmrc
  next.config.ts
  package.json
  tsconfig.json
```

**The Phase 2 monorepo migration is mechanical:** `src/services/` → `packages/services/`,
`src/agent/` → `packages/agent/`, `src/db/` → `packages/db/`, `src/contracts/` →
`packages/contracts/`, `src/shared/` → `packages/shared/`. The Next.js app
becomes `apps/web/`. A new `apps/api/` is created. No business logic moves.
No agent logic moves. The seams are already in the right places.

### 1b. Root `package.json` Scripts Block

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run tests/integration",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:generate-types": "supabase gen types typescript --local > src/db/types.ts",
    "db:seed:auth": "tsx scripts/seed-auth-users.ts",
    "db:seed": "psql \"$LOCAL_DATABASE_URL\" -f src/db/seed/dev.sql",
    "db:seed:all": "pnpm db:seed:auth && pnpm db:seed"
  }
}
```

(Plain English: `pnpm dev` starts everything you need with a single command.
No `concurrently`, no separate processes — just `next dev`. The agent runs
inside Next.js API routes for Phase 1.)

**The two-script seed split (v0.5.5 reconciliation).** Phase 1.1
seeding is split across two scripts because Supabase Auth manages
its own `auth.users` table and rejects direct SQL INSERTs. Auth
users must be created via the Supabase admin API, which is a Node
SDK call, not SQL. The split:

- **`db:seed:auth`** — runs `scripts/seed-auth-users.ts` via `tsx`,
  creating the three seed users (executive, controller, ap_specialist)
  via `admin.auth.admin.createUser()` with fixed UUIDs that the SQL
  seed and integration tests both reference.
- **`db:seed`** — runs `psql` against `LOCAL_DATABASE_URL` loading
  `src/db/seed/dev.sql`, which creates the two orgs, loads
  industry CoA templates, inserts memberships, and creates one open
  fiscal period per org plus one LOCKED period used by integration
  test 2.
- **`db:seed:all`** — runs both in sequence. This is the normal
  developer command; the split exists for CI granularity and for
  recovering from a half-failed seed run.

See `docs/specs/phase-1.1.md` §5a and §5b for the full scripts. The
v0.5.2 draft of the Bible showed a single `db:seed` running a
`.sql` file and did not account for the admin API requirement; the
v0.5.6 step-5 split propagated the richer model back here from
the Phase 1.1 brief, which had been right all along.

### 1c. Request Lifecycle Diagrams (ASCII)

**Manual path** (user fills out a form, submits):
```
Browser
  → Next.js page (server component) — gets session from Supabase Auth cookie
  → User submits form → POST to /api/accounting/journals
  → Next.js API route handler (thin adapter)
      → withInvariants(journalEntryService.post)(input, ctx)
          → Zod parse input against journalEntry.schema.ts
          → ServiceContext built with trace_id, org_id, caller
          → canUserPerformAction() — Auth check
          → periodService.isOpen() — Period check
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates debit=credit at COMMIT)
            → recordMutation() → INSERT audit_log (Simplification 1)
          → COMMIT (deferred constraint runs here; ROLLBACK on failure)
      → Returns typed result
  → Next.js API route returns JSON
  → Browser renders updated journal entry list
```

RLS applies as defense-in-depth: the service-role Supabase client (used by
service functions) bypasses RLS, but any Next.js server component that reads
data directly uses the user-scoped client which respects RLS.

**Agent path (Phase 1 form — Double Entry only)**:
```
User types message in agent chat panel
  → POST to /api/agent/message with user_id, org_id, locale
  → Orchestrator (src/agent/orchestrator/index.ts)
      → Generates trace_id (UUID) — propagated through every downstream call
      → Loads AgentSession from Postgres (or creates new on org switch)
      → Loads OrgContext via orgContextManager
      → Builds system prompt (persona-aware) + conversation history
      → Calls Claude API with available tools (Phase 1: postJournalEntry, listChartOfAccounts, checkPeriod)
  → Claude returns a tool_use call: postJournalEntry with structured arguments
  → Orchestrator validates tool_use args against doubleEntry.contract.ts
      → If invalid: bounded retry (max 2) with validation error fed back to Claude
      → If still invalid: return error to user with clarification request
  → Orchestrator invokes the tool in DRY-RUN mode
      → withInvariants(journalEntryService.post)(input with dry_run=true, ctx)
          → All checks run, transaction begins, writes happen, ROLLBACK at end
          → Returns the ProposedEntryCard with dry_run_entry_id
  → Orchestrator wraps result with canvas_directive { type: 'proposed_entry_card', card }
  → API response streams back to UI
  → AgentChatPanel renders agent message inline
  → ContextualCanvas renders ProposedEntryCard
```

**Confirmation commit path** (user clicks Approve on a ProposedEntryCard):
```
User clicks Approve
  → POST to /api/agent/confirm with idempotency_key, dry_run_entry_id
  → Orchestrator
      → Looks up the dry-run result by dry_run_entry_id
      → Calls journalEntryService.post() AGAIN with dry_run=false and idempotency_key
          → Idempotency check: SELECT from ai_actions WHERE idempotency_key = ?
              → If found and Confirmed: return existing result (no work done)
              → If found and Pending: return existing card
              → If not found: proceed
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates at COMMIT)
            → INSERT audit_log (Simplification 1)
            → INSERT ai_actions row with confirming_user_id, journal_entry_id, status='Confirmed'
          → COMMIT
  → Returns success + canvas_directive { type: 'journal_entry', entryId, mode: 'view' }
  → ContextualCanvas swaps from ProposedEntryCard to JournalEntryDetail view
```

### 1d. Double-Entry Integrity at the Database Level

**Decision (v0.5.0):** Debit=credit is enforced by a **deferred constraint**,
not a per-row trigger. A per-row trigger cannot check debit=credit because
debit=credit is a property of the *set* of journal lines, not any single line.
A trigger that fires after every row would either fail spuriously on the
first line (when there is no offsetting credit yet) or have to be deferred
manually to the last row (which the database does not know about). The
correct mechanism is a deferred constraint that runs at transaction COMMIT,
after all journal lines for the entry have been inserted.

```sql
-- Deferred constraint: debit = credit per journal entry
-- Runs at transaction COMMIT, after all journal_lines for the entry exist.

CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      NEW.journal_entry_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();
```

The `DEFERRABLE INITIALLY DEFERRED` clause is critical — it tells Postgres
to defer the check until COMMIT. Without it, the check fires after every
row insert and rejects the first line of every entry.

**Performance note (v0.5.3): this trigger fires N times at commit for N
inserted lines.** Postgres constraint triggers must be row-level
(`FOR EACH ROW` is the only form `CREATE CONSTRAINT TRIGGER` supports),
and deferred constraint trigger invocations are not deduplicated. So for
a 10-line entry, Postgres queues 10 deferred invocations and all 10 fire
at commit — each running the same `SUM(debit_amount), SUM(credit_amount)
WHERE journal_entry_id = X`. With the `(journal_entry_id)` index in place
(Section 2e) each SUM is cheap (~1 ms on Phase 1 data), so the cost is
~N ms per commit where N is lines-per-entry. For Phase 1 with 5–20 line
entries this is invisible. For Phase 2 AP batches with 50+ lines it will
be noticeable but still acceptable. **Do not treat this as a bug during
Phase 1.2 implementation** — it is correct behavior; all N invocations
return the same result. Do not try to "fix" it by switching to
`FOR EACH STATEMENT` (unsupported for deferrable constraint triggers) or
by adding `pg_trigger_depth()` guards (deferred triggers all fire at the
same depth, so the guard does not apply). If Phase 2 intercompany batches
show commit-latency issues, the path is to replace the constraint trigger
with an explicit `SELECT assert_journal_entry_balanced(entry_id)` call at
the end of `journalEntryService.post()` — but that moves enforcement from
Layer 1 (DB) to Layer 2 (service) and is a v0.6.0+ decision, not a
Phase 1.2 optimization.

**Other triggers (period lock, events table append-only) remain triggers**
because they enforce single-row rules, not set-level rules.

```sql
-- Period lock: reject any insert on journal_lines if the period is locked.
-- v0.5.3: the function takes a row-level lock on fiscal_periods via
-- SELECT ... FOR UPDATE before reading is_locked. This prevents the
-- race condition where transaction A reads is_locked=false, transaction
-- B locks the period and commits, and transaction A then commits lines
-- into a now-locked period. Under READ COMMITTED (the Postgres default
-- and the isolation level this system uses — see Section 10c), the
-- row lock serializes concurrent period-lock attempts behind any
-- in-flight journal post.
CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked boolean;
BEGIN
  -- Row-lock the period row so any concurrent lock attempt waits for us.
  SELECT is_locked INTO v_is_locked
  FROM fiscal_periods
  WHERE period_id = (
    SELECT fiscal_period_id FROM journal_entries
    WHERE journal_entry_id = NEW.journal_entry_id
  )
  FOR UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%)',
      NEW.journal_entry_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();

-- Events table append-only: reject UPDATE, DELETE, AND TRUNCATE.
-- v0.5.3: TRUNCATE was previously uncovered — a BEFORE UPDATE/DELETE
-- trigger does not fire on TRUNCATE. Any role with table-owner privileges
-- (including service_role by default) could TRUNCATE events and wipe the
-- append-only history silently. We install a TRUNCATE trigger AND revoke
-- the privilege from every role that does not need it.
CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION reject_events_mutation();
CREATE TRIGGER trg_events_no_delete BEFORE DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION reject_events_mutation();
CREATE TRIGGER trg_events_no_truncate BEFORE TRUNCATE ON events
  FOR EACH STATEMENT EXECUTE FUNCTION reject_events_mutation();

REVOKE TRUNCATE ON events FROM PUBLIC;
REVOKE TRUNCATE ON events FROM authenticated;
REVOKE TRUNCATE ON events FROM anon;
-- service_role retains TRUNCATE only because Supabase's automatic grants
-- cannot easily be revoked; the trigger above is the actual enforcement.
```

### 1e. Migration & Type Generation Strategy

**Migration tool:** Supabase CLI migrations. Justification: the project is
locked to Supabase for both database and auth; the Supabase CLI handles RLS
policies and Auth migrations natively; introducing an ORM-driven migration
tool (Prisma, Drizzle) adds a layer between you and the SQL you can already
read. Write SQL directly. It is the most durable skill in this stack.

**Type generation:** `supabase gen types typescript --local > src/db/types.ts`
after every migration. Wired as `pnpm db:generate-types`. Generated types are
committed to the repo so reviewers can see schema changes in PRs.

**Workflow:**
1. Write SQL migration file in `supabase/migrations/` (timestamp-prefixed, e.g. `20240103000000_seed_tax_codes.sql`)
2. `pnpm db:migrate` — applies to local Supabase
3. `pnpm db:generate-types` — regenerates TypeScript types
4. Run `pnpm test:integration` to verify the five Category A floor tests still pass (v0.5.5 — see §10a)
5. Commit migration + generated types in the same PR

---

## Section 2 — Data Model

### 2a. Core Tables

For every tenant-scoped table, `org_id` is a required non-null foreign key to
`organizations`.

**`organizations`** — `org_id` (UUID PK), `name`, `legal_name`,
`industry` (enum: healthcare, real_estate, hospitality, trading, restaurant,
holding_company), `functional_currency` (default 'CAD'), `fiscal_year_start_month`,
`created_at`, `created_by`.

**`memberships`** — `membership_id` (UUID PK), `user_id` (FK to
`auth.users(id) ON DELETE CASCADE` — v0.5.3: cascade is required; without
it, the seed script's idempotent `deleteUser` call fails silently on the
second run, leaving the prior user row in place while `createUser` errors,
and any production user-deletion path will also break on FK violation),
`org_id` (FK), `role` (enum: executive, controller, ap_specialist),
`created_at`. UNIQUE on `(user_id, org_id)`.

**`org_context`** — `context_id` (UUID PK), `org_id` (FK), `key`, `value` (jsonb),
`updated_at`. Institutional memory keyed by org. Phase 1 stores fiscal calendar
hints; Phase 2 stores vendor-rule lookups.

**`chart_of_accounts_templates`** — template definitions per industry. Seed
data lives here. Columns: `template_id`, `industry`, `account_code`,
`account_name`, `account_type` (enum: asset, liability, equity, revenue,
expense), `parent_account_code`, `is_intercompany_capable`.

**`chart_of_accounts`** — `account_id` (UUID PK), `org_id` (FK),
`account_code`, `account_name`, `account_type`, `parent_account_id` (self-FK,
nullable), `is_intercompany_capable`, `is_active`, `created_at`. UNIQUE on
`(org_id, account_code)`.

**`fiscal_periods`** — `period_id` (UUID PK), `org_id` (FK), `name`,
`start_date`, `end_date`, `is_locked` (boolean default false),
`locked_at`, `locked_by_user_id`. UNIQUE on `(org_id, start_date, end_date)`.

**`journal_entries`** — `journal_entry_id` (UUID PK), `org_id` (FK),
`fiscal_period_id` (FK), `entry_date`, `description`, `reference`,
`source` (enum: 'manual' | 'agent' | 'import' — **all three values from day one**),
`intercompany_batch_id` (UUID, nullable — Category A reservation),
`reverses_journal_entry_id` (UUID, nullable, self-FK to
`journal_entries(journal_entry_id)` — **v0.5.5, Q19 resolution**. NULL for
original entries; populated on reversal entries to link back to the entry
being reversed. The reversal entry itself is a normal journal entry whose
lines mirror the referenced entry with `debit_amount` and `credit_amount`
swapped. The mirror rule is a service-layer invariant (§2b, §15e) because
it is set-level across two entries and cannot be a DB CHECK constraint.
Phase 1.1 ships with the column, the service-layer check, the manual
reversal UI (§4h), and a dedicated integration test (`reversal-mirror.test.ts`,
§10a). Partial reversals are schema-permitted but not surfaced in
Phase 1.1 UI — the Phase 2 AP Agent adds partial-reversal workflows.),
`reversal_reason` (text, nullable — **v0.5.5, Q19 resolution (migrated
from `audit_log`)**. NULL for original entries; required non-empty on
reversal entries (the CHECK is `reverses_journal_entry_id IS NULL OR
(reversal_reason IS NOT NULL AND length(trim(reversal_reason)) > 0)`).
Captures the human story of *why* the reversal was posted — "vendor
misclassified," "duplicate of entry #12345," "wrong amount, FX rate
corrected." The reason is a property of the reversal entry itself, not
of the mutation that created it, which is why it lives here and not on
`audit_log`. **Placement rationale and history (read this before
moving the column again):** the v0.5.5 first draft placed this column
on `audit_log` because the founder's Q19 wording was "the audit log
captures a reversal_reason text field." On reconsideration the founder
corrected the wording to "the audit *trail* captures," where the trail
is the broader concept that includes `journal_entries` columns
alongside `audit_log` rows. The trail and the log are different
things. Two reasons the column belongs here: (1) the reason is a
property of the reversal entry, not of the mutation that created it —
audit_log is a generic mutation record and domain-specific columns
there (`invoice_void_reason`, `payment_reversal_reason`, ...) would
eventually erode its meaning; (2) queries for "show me all reversals
and why" become a single-table self-join (`SELECT r.*, o.* FROM
journal_entries r JOIN journal_entries o ON
r.reverses_journal_entry_id = o.journal_entry_id WHERE
r.reverses_journal_entry_id IS NOT NULL`) instead of joining through
audit_log and filtering by `action` type. This decision is captured
here in the Bible and in ADR-001 so the tradeoff is visible to any
future reader considering moving the column again.),
`created_at`, `created_by`, `idempotency_key` (UUID, nullable for manual,
required for agent — see ai_actions).

**`journal_lines`** — `journal_line_id` (UUID PK), `journal_entry_id` (FK),
`account_id` (FK), `description`, `debit_amount` (numeric(20,4) default 0),
`credit_amount` (numeric(20,4) default 0), `tax_code_id` (FK, nullable),
**multi-currency columns from day one**: `currency` (char(3) default 'CAD'),
`amount_original` (numeric(20,4)), `amount_cad` (numeric(20,4)),
`fx_rate` (numeric(20,8) default 1.0). CHECK `(debit_amount >= 0 AND credit_amount >= 0)`.
CHECK `(debit_amount = 0 OR credit_amount = 0)` (a line is either a debit or
a credit, never both).

**`customers`** — `customer_id` (UUID PK), `org_id` (FK), `name`, `email`,
`tax_id`, `is_active`, `created_at`.

**`vendors`** — `vendor_id` (UUID PK), `org_id` (FK), `name`, `email`,
`tax_id`, `default_currency`, `is_intercompany_entity_id` (FK to
`organizations`, nullable — set when this vendor is actually one of the 50
orgs), `is_active`, `created_at`.

**`vendor_rules`** — `rule_id` (UUID PK), `org_id` (FK), `vendor_id` (FK),
`default_account_id` (FK to `chart_of_accounts`),
**`autonomy_tier`** (enum: 'always_confirm' | 'notify_auto' | 'silent', default
'always_confirm' — Category A reservation), `created_at`, `created_by`,
`approved_at`, `approved_by`. **Empty in Phase 1.** Phase 2 begins populating.

**`items`** — `item_id`, `org_id`, `name`, `default_account_id`,
`default_price`, `default_tax_code_id`. (For invoice/bill line items —
unused in Phase 1, schema present.)

**`invoices`** + **`invoice_lines`** — Phase 2+, schema present in Phase 1.1
with multi-currency columns.

**`bills`** + **`bill_lines`** — Phase 2+, schema present in Phase 1.1 with
multi-currency columns.

**`payments`** — Phase 2+, schema present.

**`bank_accounts`** — `bank_account_id`, `org_id`, `name`, `institution`,
`account_number_last_four`, `currency`, `is_active`. Phase 2+ active.

**`bank_transactions`** — Phase 2+, schema present in Phase 1.1 with
multi-currency columns.

**`intercompany_relationships`** — `relationship_id` (UUID PK),
`org_a_id` (FK), `org_b_id` (FK), `org_a_due_to_account_id` (FK),
`org_b_due_from_account_id` (FK), `created_at`. UNIQUE on `(org_a_id, org_b_id)`.
**Empty in Phase 1.** Comment on the table: `-- Populated in Phase 2 by AP
Agent. Do not write to manually.`

**`tax_codes`** — `tax_code_id` (UUID PK), `org_id` (FK, nullable for
shared codes), `code` (e.g., 'GST', 'HST_ON', 'HST_BC'), `rate` (numeric(6,4)),
`jurisdiction`, `effective_from` (date), `effective_to` (date, nullable).
Seeded with current Canadian federal/provincial rates.

**`audit_log`** — `audit_log_id` (UUID PK), `org_id` (FK), `user_id`,
`session_id`, `trace_id`, `action`, `entity_type`, `entity_id`,
`before_state` (jsonb, nullable), `after_state_id` (UUID),
`tool_name` (nullable), `idempotency_key` (nullable), `created_at`.
**Phase 1: written synchronously inside the mutation transaction (Simplification 1).**
**Phase 2: written asynchronously by pg-boss as a projection of events.**
**Note on `reversal_reason` (v0.5.5):** a nullable `reversal_reason`
column was briefly added to this table during the v0.5.5 Q19
resolution and then migrated to `journal_entries` after the founder
reconsidered the placement. The column is now at
`journal_entries.reversal_reason`. `audit_log` intentionally holds no
domain-specific columns — if a future resolution wants to add
`invoice_void_reason` or similar, the same reasoning applies: the
reason is a property of the entity, not of the mutation record, and
belongs on the entity's table. `audit_log` stays generic.

**`ai_actions`** — `ai_action_id` (UUID PK), `org_id` (FK), `user_id`,
`session_id`, `trace_id`, `tool_name`, `prompt`, `tool_input` (jsonb),
`status` (enum: 'pending' | 'confirmed' | 'rejected' | 'auto_posted' | 'stale'),
`confidence` (enum: 'high' | 'medium' | 'low' | 'novel', nullable),
`routing_path` (text, nullable — Category A reservation, used in Phase 2),
`journal_entry_id` (FK, nullable), `confirming_user_id` (nullable),
`rejection_reason` (text, nullable), `idempotency_key` (UUID),
`response_payload` (jsonb, nullable — cached dry-run result for
idempotent replay), `staled_at` (timestamptz, nullable),
`created_at`, `confirmed_at`. UNIQUE on `(org_id, idempotency_key)`.
**v0.5.3: `ai_actions` row insertion happens inside the same mutation
transaction as the `journal_entries` write during the confirm path, not
before it.** The dry-run path inserts an `ai_actions` row in `pending`
status in its own transaction (required so the idempotency_key slot is
claimed before the user clicks Approve). The confirm path runs a single
transaction that (a) loads the pending `ai_actions` row `FOR UPDATE`,
(b) inserts `journal_entries` + `journal_lines` + `audit_log`, (c) flips
`ai_actions.status` to `confirmed` and sets `journal_entry_id` and
`confirmed_at`, and commits. If any step fails, the transaction rolls
back and `ai_actions.status` returns to `pending`. The `stale` status
plus `staled_at` timestamp covers the mid-conversation API failure case
from Phase 1.2 exit criterion #16: if a pending action cannot be
confirmed because the Claude context is lost, a cleanup path marks it
`stale` rather than leaving it `pending` forever.

**`events`** — `event_id` (UUID PK), `event_type` (text), `org_id` (FK),
`aggregate_id` (UUID), `aggregate_type` (text), `payload` (jsonb),
`occurred_at` (timestamptz), `recorded_at` (timestamptz default now()),
`trace_id` (UUID), `_event_version` (text), `sequence_number` (bigserial).
**Phase 1: created with append-only trigger, NOT written to (Simplification 2).**
**Phase 2: begins receiving writes inside mutation transactions.**
**v0.5.3 — `sequence_number` gap warning:** `bigserial` is monotonic but
Postgres sequences increment regardless of transaction outcome. A
rolled-back `INSERT INTO events` leaves a gap in `sequence_number`.
Replay logic must order by `(occurred_at, sequence_number)` and must
never assume gap-free density. Any Phase 2+ code that does
`WHERE sequence_number BETWEEN X AND Y` assuming every integer in that
range maps to a real event is wrong. `occurred_at` is the temporal
source of truth; `sequence_number` is only a tiebreaker.

**`agent_sessions`** — `session_id` (UUID PK), `user_id`, `org_id`,
`locale`, `started_at`, `last_activity_at`, `state` (jsonb).
Persistence for in-flight conversations. Cleaned up after 30 days.

### 2b. Key Database Invariants

| Invariant | Mechanism | Notes |
|---|---|---|
| `SUM(debits) = SUM(credits)` per journal entry | **Deferred constraint** (Section 1d) | Runs at COMMIT; fires N times per N-line entry, all redundant but correct |
| Period not locked when posting | BEFORE INSERT trigger on `journal_lines` with row lock on `fiscal_periods` | Row lock prevents race with concurrent `UPDATE fiscal_periods SET is_locked = true` |
| `events` table append-only | BEFORE UPDATE/DELETE/**TRUNCATE** triggers reject all | v0.5.3: TRUNCATE trigger added; no code path can bypass |
| `org_id` NOT NULL on every tenant-scoped table | Column constraint | |
| `bill_lines.amount` positive | CHECK constraint | |
| `idempotency_key` unique per org on `ai_actions` | UNIQUE constraint on `(org_id, idempotency_key)` | |
| Journal line is debit OR credit, not both | CHECK on `journal_lines` | |
| **Journal line is never all-zero** (v0.5.3, D11) | CHECK on `journal_lines`: `(debit_amount >= 0 AND credit_amount >= 0) AND (debit_amount > 0 OR credit_amount > 0)` | Zero-value lines that technically balance are invisible audit errors — worse than rejected entries. At least one side must be non-zero. |
| **Multi-currency amount invariant** (v0.5.3, D5) | CHECK on `journal_lines`: `amount_original = debit_amount + credit_amount AND amount_cad = ROUND(amount_original * fx_rate, 4)` | Prevents silent P&L corruption where debit=credit holds but `amount_cad` is unpopulated or mismatched. For CAD functional currency, `fx_rate = 1.0` and `amount_cad = amount_original`. |
| **Idempotency key required for agent source** (v0.5.3, D7) | CHECK on `journal_entries`: `source != 'agent' OR idempotency_key IS NOT NULL` | Makes the Bible's "nullable for manual, required for agent" rule a DB-enforced constraint instead of TypeScript-side discipline. |
| **Reversal entry mirror rule** (v0.5.5, Q19) | Service-layer check inside `journalEntryService.post`: when `reverses_journal_entry_id` is populated, the service loads the referenced entry and verifies that every line in the new entry mirrors a line in the referenced entry with `debit_amount` and `credit_amount` swapped and `amount_original`/`amount_cad` unchanged. Hard reject with `ServiceError('REVERSAL_NOT_MIRROR', ...)` if the mirror does not hold. | Set-level invariant across two entries; cannot be a DB CHECK constraint because CHECK operates on a single row and cannot reference rows in another journal entry. Mandatory in Phase 1.1 — ships with the schema and with a dedicated integration test (`reversal-mirror.test.ts`, §10a). Partial reversals are deferred to Phase 2; the Phase 1 check assumes full mirror. The deferred debit=credit constraint (§1d) catches an unbalanced reversal the same way it catches an unbalanced original — no new trigger needed. |

### 2c. RLS Policies

**v0.5.3 — coverage rule:** RLS is enabled on every tenant-scoped table
in the Phase 1.1 initial migration. v0.5.1 and v0.5.2 only documented
three tables; v0.5.3 completes the set. Missing RLS is not the same as
"RLS returns no rows" — on a table where RLS was never `ENABLE`d, every
authenticated caller sees every row regardless of policy, which would
silently break the "every tenant-scoped table from day one" promise in
the Phase 1 Simplifications section.

```sql
-- ------------------------------------------------------------------
-- Helper: does the current user have a membership in this org?
-- v0.5.3 — hardened SECURITY DEFINER:
--   * SET search_path = '' to prevent search-path injection attacks
--     (a malicious role cannot shadow `public.memberships` with a
--     local temp table because every reference is schema-qualified)
--   * explicit grant only to `authenticated`; revoke from PUBLIC so
--     the anon role cannot enumerate membership via this function
--   * STABLE means the optimizer can memoize within a single statement
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;

-- Helper: is the current user a controller in this org? Used by the
-- audit_log and ai_actions policies. Same hardening.
CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_controller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_controller(uuid) TO authenticated;

-- ------------------------------------------------------------------
-- Standard tenant-scoped pattern (applied to ~14 tables below).
-- Each gets: SELECT + INSERT by membership; UPDATE + DELETE deny.
-- UPDATE and DELETE are not used in Phase 1 for any accounting data;
-- corrections are via reversal entries. Non-accounting tables that
-- need UPDATE (e.g., vendors, customers) are listed separately below.
-- ------------------------------------------------------------------

-- organizations — users see orgs they have membership in
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_has_org_access(org_id));
-- Insert via service-role client only (org creation flow); no user-client policy.

-- memberships — users see their own memberships; controllers see all in their orgs
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );

-- chart_of_accounts — standard tenant pattern, no UPDATE/DELETE
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_insert ON chart_of_accounts
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_update ON chart_of_accounts
  FOR UPDATE USING (user_has_org_access(org_id));
-- No DELETE — accounts are deactivated via is_active, not deleted

-- fiscal_periods — members can see, controllers can lock
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiscal_periods_select ON fiscal_periods
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY fiscal_periods_insert ON fiscal_periods
  FOR INSERT WITH CHECK (user_is_controller(org_id));
CREATE POLICY fiscal_periods_update ON fiscal_periods
  FOR UPDATE USING (user_is_controller(org_id));
-- No DELETE — periods are immutable history

-- journal_entries — standard pattern; UPDATE and DELETE denied for audit integrity
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);  -- never updatable; corrections via reversal entries
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);  -- never deletable

-- journal_lines — inherits the org via its parent journal_entry
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_no_update ON journal_lines
  FOR UPDATE USING (false);
CREATE POLICY journal_lines_no_delete ON journal_lines
  FOR DELETE USING (false);

-- vendors — standard tenant pattern with UPDATE allowed
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_select ON vendors
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendors_insert ON vendors
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendors_update ON vendors
  FOR UPDATE USING (user_has_org_access(org_id));

-- customers — same as vendors
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_select ON customers
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (user_has_org_access(org_id));

-- vendor_rules — controller-only write; all members can read
ALTER TABLE vendor_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_rules_select ON vendor_rules
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_rules_cud ON vendor_rules
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));

-- bills, bill_lines, invoices, invoice_lines, payments,
-- bank_accounts, bank_transactions — all standard tenant pattern.
-- Phase 1 does not use these tables; policies exist so that when
-- Phase 2 lights them up, the security model is not a retrofit.
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY bills_tenant ON bills FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bill_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY bill_lines_tenant ON bill_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.bill_id = bill_lines.bill_id AND user_has_org_access(b.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM bills b WHERE b.bill_id = bill_lines.bill_id AND user_has_org_access(b.org_id)));

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant ON invoices FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_lines_tenant ON invoice_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.invoice_id = invoice_lines.invoice_id AND user_has_org_access(i.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.invoice_id = invoice_lines.invoice_id AND user_has_org_access(i.org_id)));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant ON payments FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_accounts_tenant ON bank_accounts FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_transactions_tenant ON bank_transactions FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY items_tenant ON items FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE intercompany_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY intercompany_relationships_select ON intercompany_relationships
  FOR SELECT USING (user_has_org_access(org_a_id) OR user_has_org_access(org_b_id));
-- Inserts go through the service-role client only in Phase 2.

ALTER TABLE org_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_context_tenant ON org_context FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());
-- Inserts/updates via service-role client only.

-- audit_log — same-org members can read, nobody can write from user client
-- (service-role bypasses RLS for the synchronous audit write in Phase 1)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only.

-- events — Phase 1 is not written to via user client; still enable RLS
-- for defense in depth when Phase 2 begins writing
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select ON events
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only in Phase 2.

-- ai_actions — initiator OR same-org controller can read
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
-- Inserts via service-role client only.

-- ------------------------------------------------------------------
-- Three explicit exceptions (tables that do NOT follow the tenant pattern):
-- ------------------------------------------------------------------

-- chart_of_accounts_templates — global, industry-keyed, not org-scoped.
-- Readable by all authenticated users. No RLS needed; revoke write.
ALTER TABLE chart_of_accounts_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY coa_templates_select ON chart_of_accounts_templates
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policy — seeded via migration only.

-- tax_codes — can be org-scoped (custom) or shared (org_id IS NULL).
-- Shared codes visible to all authenticated; org codes to that org.
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_codes_select ON tax_codes
  FOR SELECT USING (
    org_id IS NULL OR user_has_org_access(org_id)
  );
-- Inserts/updates via service-role client only (Canadian rate table maintenance).

-- auth.users — managed by Supabase Auth itself; do not touch.
```

**Why two Supabase clients?** The Next.js API routes (`src/app/api/`) and
service functions use the **service-role client** (`src/db/adminClient.ts`)
which bypasses RLS. This is because the service layer has already
authenticated and authorized the request via `canUserPerformAction()`, and
RLS at this layer would just be a second copy of the same check. Any Next.js
**server component** that reads data directly uses the **user-scoped client**
(`src/db/userClient.ts`) which respects RLS as defense-in-depth. The rule is:
service functions trust themselves; UI server components trust RLS.

### 2d. First-Pass SQL Migration

The full `001_initial_schema.sql` migration is delivered as part of the
**Phase 1.1 Execution Brief at `docs/specs/phase-1.1.md`** (formerly
Part 2 of this file — extracted during the step-5 split, v0.5.6). It
contains: all table DDL listed in 2a, all constraints from 2b, all RLS
policies from 2c, all indexes from 2e, all triggers (deferred
constraint for debit=credit, period lock, events append-only), and
seed INSERT statements for the two industry CoA templates the founder
will actually use first (`holding_company` + `real_estate`, per Q1).
The remaining four templates (healthcare, hospitality, trading,
restaurant) are added in Phase 1.3 or Phase 2 when needed.

### 2e. Index Plan

Every index is justified by a query pattern.

| Index | Query pattern |
|---|---|
| `journal_lines (org_id, account_id, entry_date)` | P&L and balance sheet roll-ups |
| `journal_entries (org_id, fiscal_period_id)` | Period close, period-scoped lists |
| `journal_entries (org_id, intercompany_batch_id)` | Phase 2 reciprocal entry lookup |
| `invoices (org_id, customer_id, status)` | AR aging (Phase 2+) |
| `bills (org_id, vendor_id, status)` | AP queue and aging (Phase 2+) |
| `bank_transactions (org_id, bank_account_id, posted_at)` | Reconciliation (Phase 2+) |
| `ai_actions (org_id, created_at, status)` | AI Action Review queue |
| `ai_actions (org_id, idempotency_key)` UNIQUE | Idempotency lookup |
| `vendor_rules (org_id, vendor_id)` | Phase 2 institutional memory lookup |
| `memberships (user_id, org_id)` UNIQUE | RLS helper, org switcher |
| `events (org_id, aggregate_id, sequence_number)` | Phase 2 event replay |
| `events (trace_id)` | Cross-layer trace correlation |
| `audit_log (org_id, trace_id)` | Trace correlation |
| `audit_log (org_id, created_at)` | Audit timeline |
| `journal_entries (reverses_journal_entry_id)` WHERE `reverses_journal_entry_id IS NOT NULL` (v0.5.5, Q19) | Reversal lookup — "find the reversal of entry X" and "list all reversals for org Y." Partial index because reversal entries are a minority of rows. |

---

## Section 3 — Shared Schemas: Worked Example (`postJournalEntry`)

The worked example demonstrates the entire Phase 1 stack working end-to-end
for the simplest possible financial transaction. Every other module follows
the same pattern.

**Why this example?** A journal entry is the atom of accounting. Every other
module — bills, invoices, payments, reconciliation — eventually produces a
journal entry. If `postJournalEntry` works correctly with the full stack
(Zod validation → service middleware → deferred constraint → audit log →
canvas directive), every other module can follow the same pattern. Phase 1.1
proves the manual path; Phase 1.2 proves the agent path on top of the same
service function.

### 3a. Zod Input Schema

**v0.5.3 — money never crosses the service boundary as a JavaScript
`Number`.** JavaScript numbers are IEEE 754 doubles. `0.1 + 0.2` equals
`0.30000000000000004`, not `0.3`. For a single entry the error is
invisible (Postgres rounds it back to `numeric(20,4)`). For a year of
entries the accumulated rounding produces P&L figures that disagree
with the per-entry sums, *even though every entry passes the deferred
constraint*. The multi-currency case is worse: `amount_cad =
amount_original * fx_rate` computed in JS with an 8-decimal FX rate
loses precision on the way to a 4-decimal CAD value, and the result
does not match what Postgres would compute for the same inputs —
silently breaking the D5 invariant (`amount_cad = ROUND(amount_original
* fx_rate, 4)`).

**The rule:** every field that represents money or an FX rate is a
`z.string()` matching a strict decimal regex at the service boundary.
Arithmetic on money happens in Postgres (`numeric` type) or via a
decimal library (`decimal.js`) — never via JS `+`, `*`, or `reduce`.
Branded types make misuse a compile-time error.

`src/shared/schemas/accounting/money.schema.ts`:

```typescript
import { z } from 'zod';
import Decimal from 'decimal.js';

// Money is always a string at the boundary. The regex matches an
// optional sign, up to 16 digits before the decimal, and 0-4 digits
// after. This fits numeric(20,4) exactly. Rejects scientific notation,
// commas, currency symbols, and whitespace.
export const MoneyAmountSchema = z
  .string()
  .regex(/^-?\d{1,16}(\.\d{1,4})?$/, 'must be a decimal string with up to 4 fractional digits');

// FX rates are numeric(20,8) — up to 8 fractional digits.
export const FxRateSchema = z
  .string()
  .regex(/^-?\d{1,12}(\.\d{1,8})?$/, 'must be a decimal string with up to 8 fractional digits');

// Branded types so you cannot accidentally pass a raw string where
// a MoneyAmount is expected. Parse once, thread the brand everywhere.
export type MoneyAmount = string & { readonly __brand: 'MoneyAmount' };
export type FxRate = string & { readonly __brand: 'FxRate' };

// Helper for arithmetic that MUST go through decimal.js, not JS math.
export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).plus(new Decimal(b)).toFixed(4) as MoneyAmount;
}

export function multiplyMoneyByRate(amount: MoneyAmount, rate: FxRate): MoneyAmount {
  // Matches Postgres ROUND(amount * rate, 4) behavior (HALF_UP).
  return new Decimal(amount)
    .times(new Decimal(rate))
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    .toFixed(4) as MoneyAmount;
}

export function eqMoney(a: MoneyAmount, b: MoneyAmount): boolean {
  return new Decimal(a).eq(new Decimal(b));
}
```

`src/shared/schemas/accounting/journalEntry.schema.ts`:

```typescript
import { z } from 'zod';
import Decimal from 'decimal.js';
import { MoneyAmountSchema, FxRateSchema, type MoneyAmount } from './money.schema';

// Plain English: a Zod schema is a runtime check that a JavaScript object
// has the shape you expect. It also produces a TypeScript type for free.
// `.refine()` adds custom validation beyond simple type checks.

export const JournalLineInputSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().max(500).optional(),
  debit_amount: MoneyAmountSchema,
  credit_amount: MoneyAmountSchema,
  tax_code_id: z.string().uuid().optional(),
  // Multi-currency fields — Category A, present from day one.
  // All monetary values are decimal strings, never JS Numbers.
  currency: z.string().length(3).default('CAD'),
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  fx_rate: FxRateSchema.default('1.00000000'),
}).refine(
  // Exactly one side must be non-zero (matches the D11 DB CHECK constraint
  // — at least one side > 0, never both positive).
  (line) => {
    const d = new Decimal(line.debit_amount);
    const c = new Decimal(line.credit_amount);
    return (d.gt(0) && c.eq(0)) || (d.eq(0) && c.gt(0));
  },
  { message: 'A journal line must be exactly one of: a positive debit or a positive credit. Zero-value lines are rejected (D11).' }
).refine(
  // amount_original = debit_amount + credit_amount (matches the D5 DB CHECK).
  (line) => {
    const d = new Decimal(line.debit_amount);
    const c = new Decimal(line.credit_amount);
    const original = new Decimal(line.amount_original);
    return original.eq(d.plus(c));
  },
  { message: 'amount_original must equal debit_amount + credit_amount.' }
).refine(
  // amount_cad = ROUND(amount_original * fx_rate, 4) (matches the D5 DB CHECK).
  (line) => {
    const computed = new Decimal(line.amount_original)
      .times(new Decimal(line.fx_rate))
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    return computed.eq(new Decimal(line.amount_cad));
  },
  { message: 'amount_cad must equal ROUND(amount_original * fx_rate, 4). Recompute using multiplyMoneyByRate().' }
);

export const PostJournalEntryInputSchema = z.object({
  org_id: z.string().uuid(),
  entry_date: z.string().date(),
  description: z.string().min(1).max(500),
  reference: z.string().max(100).optional(),
  fiscal_period_id: z.string().uuid(),
  source: z.enum(['manual', 'agent', 'import']),
  idempotency_key: z.string().uuid().optional(), // required for source='agent'
  dry_run: z.boolean().default(false),
  lines: z.array(JournalLineInputSchema).min(2),
}).refine(
  // Debit total equals credit total — computed with decimal.js, not JS math.
  (entry) => {
    const debits = entry.lines.reduce(
      (acc, l) => acc.plus(new Decimal(l.debit_amount)),
      new Decimal(0)
    );
    const credits = entry.lines.reduce(
      (acc, l) => acc.plus(new Decimal(l.credit_amount)),
      new Decimal(0)
    );
    return debits.eq(credits);
  },
  { message: 'Sum of debits must equal sum of credits (exact decimal, no tolerance).' }
).refine(
  (entry) => entry.source !== 'agent' || entry.idempotency_key !== undefined,
  { message: 'idempotency_key is required when source is "agent".' }
);

export type PostJournalEntryInput = z.infer<typeof PostJournalEntryInputSchema>;
```

The application-layer `.refine()` for debit=credit gives an early,
readable error message using exact decimal comparison — **no tolerance
window**. The previous v0.5.2 schema used `Math.abs(debits - credits) <
0.005` as a float-tolerance; v0.5.3 removes this because with string
money and decimal.js there is no float drift to tolerate. If debits and
credits are not exactly equal, the entry is wrong. The deferred database
constraint (Section 1d) is the hard guarantee — it catches anything
that bypasses the application layer.

### 3b. Zod Output Schema

```typescript
export const ProposedEntryCardSchema = z.object({
  org_id: z.string().uuid(),
  org_name: z.string(),
  transaction_type: z.enum(['journal_entry', 'bill', 'payment', 'intercompany']),
  vendor_name: z.string().optional(),
  matched_rule_label: z.string().optional(),
  lines: z.array(z.object({
    account_code: z.string(),
    account_name: z.string(),
    debit: MoneyAmountSchema,
    credit: MoneyAmountSchema,
    currency: z.string().length(3),
  })),
  intercompany_flag: z.boolean(),
  reciprocal_entry_preview: z.unknown().optional(), // typed properly in Phase 2
  agent_reasoning: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'novel']),
  routing_path: z.string().optional(), // Category A reservation, display-only in Phase 1
  idempotency_key: z.string().uuid(),
  dry_run_entry_id: z.string().uuid(),
});

export const PostJournalEntryOutputSchema = z.object({
  journal_entry_id: z.string().uuid(),
  status: z.enum(['draft', 'posted', 'proposed']),
  proposed_entry_card: ProposedEntryCardSchema.optional(),
  canvas_directive: z.discriminatedUnion('type', [
    z.object({ type: z.literal('journal_entry'), entryId: z.string().uuid(), mode: z.enum(['view', 'edit']) }),
    z.object({ type: z.literal('proposed_entry_card'), card: ProposedEntryCardSchema }),
  ]),
});

export type PostJournalEntryOutput = z.infer<typeof PostJournalEntryOutputSchema>;
```

### 3c. The Same Schema, Three Consumers

The same Zod schema is imported by:

**1. Next.js API route** (`src/app/api/accounting/journals/route.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = PostJournalEntryInputSchema.parse(body); // throws on invalid
  const ctx = await buildServiceContext(request);
  const result = await withInvariants(journalEntryService.post)(parsed, ctx);
  return Response.json(result);
}
```

**2. Double Entry Agent tool** (`src/agent/tools/postJournalEntry.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

// The Claude tool definition uses the same Zod schema, converted to JSON Schema.
export const postJournalEntryTool = {
  name: 'postJournalEntry',
  description: 'Create a journal entry. Always use dry_run=true on the first call.',
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
};
```

**3. Manual journal entry form** (`src/components/canvas/JournalEntryForm.tsx`):

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PostJournalEntryInputSchema, type PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';

export function JournalEntryForm({ orgId }: { orgId: string }) {
  const form = useForm<PostJournalEntryInput>({
    resolver: zodResolver(PostJournalEntryInputSchema),
    defaultValues: { org_id: orgId, source: 'manual', dry_run: false, lines: [] },
  });
  // ... form fields ...
}
```

One schema, three consumers, one source of truth. If the schema changes, all
three break in the same way at compile time, and the change is visible in
exactly one PR.

### 3d. TypeScript Service Function Sketch

`src/services/accounting/journalEntryService.ts`:

```typescript
import { PostJournalEntryInputSchema, type PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';
import { type ServiceContext } from '@/services/middleware/serviceContext';
import { canUserPerformAction } from '@/services/auth/canUserPerformAction';
import { periodService } from '@/services/accounting/periodService';
import { recordMutation } from '@/services/audit/recordMutation';
import { adminClient } from '@/db/adminClient';
import { logger } from '@/shared/logger/pino';

export const journalEntryService = {
  async post(
    input: PostJournalEntryInput,
    ctx: ServiceContext
  ) {
    // 0. Re-validate at the service boundary (defense-in-depth — the API
    //    route already validated, but the agent path may have skipped it).
    const validated = PostJournalEntryInputSchema.parse(input);

    // 1. Idempotency check (only for agent source) — BEFORE any work
    if (validated.source === 'agent' && validated.idempotency_key) {
      const existing = await adminClient
        .from('ai_actions')
        .select('*, journal_entries(*)')
        .eq('org_id', validated.org_id)
        .eq('idempotency_key', validated.idempotency_key)
        .maybeSingle();

      if (existing.data) {
        logger.info({ trace_id: ctx.trace_id, idempotency_key: validated.idempotency_key },
          'Idempotency hit — returning existing result');
        return buildOutputFromExistingAction(existing.data);
      }
    }

    // 2. Authorization
    const authResult = await canUserPerformAction(ctx, 'journal_entry.post', validated.org_id);
    if (!authResult.permitted) {
      throw new ServiceError('PERMISSION_DENIED', authResult.reason);
    }

    // 3. Period check (was Period Agent in v0.4.0; now a direct service call)
    const periodCheck = await periodService.isOpen(validated.org_id, validated.entry_date);
    if (!periodCheck.is_open) {
      throw new ServiceError('PERIOD_LOCKED',
        `${periodCheck.period_name} is locked. Post to a different period or ask a controller to unlock.`);
    }

    // 4. Debit=credit balance is already enforced upstream and downstream:
    //    upstream by the Zod refine at step 0 (§3a, exact-equality via
    //    decimal.js on MoneyAmount strings), downstream by the deferred
    //    constraint at COMMIT (§1d, the hard guarantee). No application-layer
    //    re-check lives here — a tolerance window or a JS-math reducer would
    //    reintroduce the float drift the v0.5.3 string-money rule exists to
    //    prevent. Do not re-add.

    // 5. DRY RUN: build the proposed card without persisting
    if (validated.dry_run) {
      const card = await buildProposedEntryCard(validated, ctx);
      return {
        journal_entry_id: card.dry_run_entry_id,
        status: 'proposed' as const,
        proposed_entry_card: card,
        canvas_directive: { type: 'proposed_entry_card' as const, card },
      };
    }

    // 6. CONFIRMED: persist inside a single transaction
    const result = await adminClient.rpc('post_journal_entry_tx', {
      p_input: validated,
      p_trace_id: ctx.trace_id,
      p_user_id: ctx.caller.user_id,
    });
    // The RPC executes BEGIN; INSERT journal_entries; INSERT journal_lines;
    // INSERT audit_log (Simplification 1); INSERT ai_actions if source=agent;
    // COMMIT (deferred constraint runs here — ROLLBACK on imbalance).

    if (result.error) {
      logger.error({ trace_id: ctx.trace_id, error: result.error }, 'Journal entry post failed');
      throw new ServiceError('POST_FAILED', result.error.message);
    }

    logger.info({
      trace_id: ctx.trace_id,
      journal_entry_id: result.data.journal_entry_id,
      org_id: validated.org_id,
    }, 'Journal entry posted');

    return {
      journal_entry_id: result.data.journal_entry_id,
      status: 'posted' as const,
      canvas_directive: {
        type: 'journal_entry' as const,
        entryId: result.data.journal_entry_id,
        mode: 'view' as const,
      },
    };
  },
};
```

This is the template every other service function follows. Validate at the
boundary; check idempotency first; check authorization; check business rules;
either dry-run or persist inside a single transaction; log with `trace_id`;
return a typed result with a canvas directive.

The `withInvariants()` middleware (Invariant 4) wraps this function from the
outside, performing the universal pre-flight checks (ServiceContext shape,
trace_id present, caller verified) before the function body runs.

---

## Section 4 — The Bridge UI Architecture

### 4a. The Split-Screen Layout

Three zones, plus the Mainframe rail. The split-screen shell is built fully
in Phase 1.1; canvas views are added per phase.

1. **Left Panel — Agent Chat** (~380px fixed, collapsible via keyboard
   shortcut). Conversation history; message input with file drop zone (drop
   zone is inactive in Phase 1, the upload pipeline is Phase 2);
   persona-specific suggested prompts on empty state. Agent messages may
   contain inline ProposedEntryCards with Approve / Reject buttons.

2. **Right Panel — Contextual Canvas** (fills remaining width). A blank
   stage that renders whatever the agent last directed it to show. Has its
   own independent navigation history (back/forward arrows in the canvas
   header) so the user can drill down through multiple levels and return
   without disrupting the conversation.

3. **Top Nav.** Org switcher (role-aware — AP specialist sees assigned orgs
   only, CFO sees all + consolidated), global search stub, notification bell
   (count of pending AI actions), user menu.

**The Mainframe** — A collapsed icon rail on the far left, narrower than the
chat panel, always visible. Direct-launch icons for the most common canvas
views: Chart of Accounts, Journal Entry, AP Queue (Phase 2+), P&L Report.
Clicking any icon bypasses the agent entirely and loads that canvas view
directly. **This is the fallback navigation when the user knows where they
want to go, AND the graceful degradation path when the Claude API is
unavailable.** Label it "Mainframe" in the UI — lean into the Star Trek
metaphor.

**Mainframe constraint (called out everywhere it matters):** No Phase 1
canvas component is allowed to require the agent to function. Every Phase 1
canvas view (Chart of Accounts, Journal Entry form, Journal list, basic P&L,
AI Action Review) must work fully when accessed directly via the Mainframe.
The agent is a composer that can also load these views; the views themselves
are standalone.

### 4b. The `canvas_directive` Contract (Agent-to-UI Protocol)

The most important interface in The Bridge. Defined as a TypeScript
discriminated union in `src/agent/canvas/directives.ts`. Every agent tool
response (and every API route response that affects what the canvas should
show) includes a `canvas_directive`. The frontend reads the directive and
renders the appropriate canvas component. **The agent never produces HTML.
It produces structured data. The UI renders it.**

```typescript
// src/agent/canvas/directives.ts
// (Plain English: a discriminated union is a TypeScript pattern where a
// shared "type" field tells you which shape the rest of the object has.
// The compiler enforces that you handle every possible type.)

import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import type { PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string; }
  | { type: 'journal_entry'; entryId: string; mode: 'view' | 'edit'; }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Partial<PostJournalEntryInput>; }
  | { type: 'journal_entry_list'; orgId: string; }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard; }
  | { type: 'ai_action_review_queue'; orgId: string; }
  | { type: 'report_pl'; orgId: string; from: string; to: string; }
  | { type: 'none'; }  // agent responded with text only, no canvas update

  // Phase 2+ stubs — directive type defined now, canvas component is a
  // "Coming Soon" placeholder until the phase that builds it:
  | { type: 'ap_queue'; orgId: string; }
  | { type: 'vendor_detail'; vendorId: string; orgId: string; }
  | { type: 'bank_reconciliation'; accountId: string; }
  | { type: 'ar_aging'; orgId: string; }
  | { type: 'consolidated_dashboard'; }
  ;
```

The canvas renderer switches on `directive.type` and renders the matching
component or a "Coming Soon" placeholder for Phase 2+ types. New tools added
in later phases must add their directive type here first.

**Bidirectional state — stub in Phase 1, implement in Phase 2.** When the
user interacts with the canvas (clicks a P&L line, selects a vendor), that
action should eventually be communicated back to the agent as context. In
Phase 1, this is a commented interface in `AgentSession`. In Phase 2, it is
implemented so the agent knows what the user is looking at without them
typing "the thing I just clicked."

### 4c. The Proposed Entry Card — Data Shape

Every AI-initiated mutation surfaces this card before anything is written.
The full Zod schema is defined in Section 3b. The TypeScript type is
inferred from it.

The UI renders this as a card with: **Approve** button (primary), **Reject**
button with optional free-text reason, and an **"Edit before approving"**
link that fires a `journal_entry_form` canvas directive with the data
pre-filled.

**Important Phase 1 constraint:** `confidence` and `routing_path` are
**display only** in Phase 1. The card shows them, but they do not influence
which queue the entry goes to or who must approve it. Routing logic (where
medium-confidence entries require controller approval and novel patterns
escalate to CFO) is Phase 2. The fields exist on the type now (Category A
reservation) so the Phase 2 wiring is mechanical.

**Reasoning text is a structured template, not free prose.** The UI builds
the localized "why I made this choice" string from a template ID and
parameters returned by the agent — never from raw English from Claude. This
is what makes i18n possible without retranslating every agent response.

### 4d. Canvas Phasing Table

| Canvas Feature | Phase 1.1 | Phase 1.2 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Split-screen layout (chat + canvas + Mainframe) | Build | | | |
| Canvas navigation history (back/forward) | Build | | | |
| Chart of Accounts canvas view | Build | | | |
| Manual Journal Entry form in canvas | Build | | | |
| Journal Entry list canvas view | Build | | | |
| Basic P&L canvas view (read-only) | Build | | | |
| AI Action Review queue (controller) | Build (empty in 1.1, populated in 1.2) | | | |
| Suggested prompts on empty state | | Build (static, persona-aware) | | |
| ProposedEntryCard component | | Build | | |
| Agent transparency ("What I did") | | Build (collapsed disclosure) | | |
| Canvas tabs (multiple views open) | Stub interface only | | Build | |
| Bidirectional canvas-agent state | Stub interface only | | Build | |
| Contextual action bar on hover | | | Build | |
| AP Queue canvas view | | | Build | |
| Bank reconciliation canvas view | Stub (placeholder) | | Build | |
| Consolidated dashboard canvas view | Stub (placeholder) | | | Build |
| Mobile responsive layout | Defer | | | Build |
| Multi-pane comparison view | Defer | | | Build |

"Stub interface only" means: the TypeScript interface and the canvas
directive type exist; the renderer shows "Coming Soon" for that type. Phase 2
fills in the implementation. Phase 2 is an extension, not a rewrite.

### 4e. Suggested Prompts (Empty State)

Phase 1.2 implements a basic version with static arrays per role.
Phase 2 makes it data-driven (context-aware: if today is the 1st of the
month, a controller sees close-related suggestions).

- **AP Specialist:** *(Phase 2+)* "Process today's incoming bills" / "Show me
  the AP queue" / "Find bills missing a GL code"
- **Controller:** "Review pending AI actions" / "Show me last month's P&L" /
  "Make a journal entry"
- **Executive:** "Show consolidated cash position" / "What's my runway if
  revenue drops 20%?" *(Most CFO prompts return placeholder responses in
  Phase 1; the suggested prompts exist for UI shape only.)*

### 4f. Traditional UI Screens Required in Phase 1

Both the agent path and the manual path are first-class. Every canvas view
must also be reachable via the Mainframe — not only by asking the agent.

| Route | Phase | Notes |
|---|---|---|
| `/[locale]/sign-in` | 1.1 | Supabase Auth |
| `/[locale]/[orgId]/accounting/chart-of-accounts` | 1.1 | CoA list and detail |
| `/[locale]/[orgId]/accounting/journals` | 1.1 | Journal entry list |
| `/[locale]/[orgId]/accounting/journals/new` | 1.1 | Manual journal entry form |
| `/[locale]/[orgId]/accounting/journals/[entryId]` | 1.1 | Journal entry detail |
| `/[locale]/[orgId]/agent/actions` | 1.2 | AI Action Review queue |
| `/[locale]/[orgId]/reports/pl` | 1.1 | Basic P&L (read-only) |
| `/[locale]/consolidated/dashboard` | Stub in 1.1 | Role-gated |
| `/admin/orgs` | 1.1 | Org creation with industry CoA template selection |

### 4g. Canvas Context Injection — Phase 1.2 minimal bidirectional pattern (v0.5.4)

The Bridge's core metaphor is a chat panel that knows what the user is
looking at in the canvas. Without that, the split-screen layout is two
unconnected panes sitting next to each other — the exact problem
Pennylane and Puzzle never solved and which The Bridge is supposed to
solve structurally. The full bidirectional UX (hover, contextual
action bar, multi-selection, canvas tabs, persistent-across-navigation
selection, P&L drill-down) is Phase 2. But a **minimal version** lands
in Phase 1.2 alongside the initial agent build because the failure
mode of a disconnected UI in Phase 1.3 real-user testing is a hard-no
trust classification for UX reasons, which is the wrong reason to
fail Phase 1.3.

**Three components, nothing more:**

1. A `CanvasContext` TypeScript type.
2. A Zustand selector that builds a `CanvasContext` snapshot from the
   current canvas state.
3. Click handlers on exactly two selectable row types: journal entry
   rows in the journal entry list view, and chart-of-accounts rows in
   the CoA view.

Plus two downstream wirings:

4. `canvas_context?: CanvasContext` added as an optional field on
   `handleUserMessage` input (Section 5b).
5. A subordinate canvas-context section appended to the system prompt,
   labeled as *"context only, do not assume the user is asking about
   this unless their message refers to it."*

**The type:**

```typescript
// src/shared/types/canvasContext.ts — created empty in Phase 1.1, used in Phase 1.2.

import type { CanvasDirective } from './canvasDirective';

export type SelectedEntity =
  | { type: 'journal_entry'; id: string; display_name: string }
  | { type: 'account';       id: string; display_name: string };

export type CanvasContext = {
  /** The directive currently rendered by ContextualCanvas, verbatim. */
  current_directive: CanvasDirective;

  /**
   * The entity the user has clicked on, if any. Undefined means the user
   * is looking at the canvas but has not clicked any specific row.
   * Phase 1.2 supports exactly two selection types: journal_entry and
   * account. Additional types (P&L line drill-down, multi-select, etc.)
   * are Phase 2.
   */
  selected_entity?: SelectedEntity;
};
```

**The client-ephemeral rule:** `CanvasContext` is built by the Zustand
selector at the moment the user sends a message, sent as part of the
`/api/agent/message` request body, and **not persisted server-side** in
`agent_sessions.state`. The server never tries to guess what the user
has clicked; the client always tells it. This is the right choice
because (a) the server cannot know what the user clicked, (b) it
avoids a staleness window when the canvas navigates, and (c) it keeps
`agent_sessions.state` focused on conversation-turn state, not UI
state.

**The two selection types, exactly:**

| Selection type | Selectable in | `id` references | Phase |
|---|---|---|---|
| `journal_entry` | Journal entry list view row click | `journal_entries.journal_entry_id` | 1.2 |
| `account` | Chart of Accounts view row click | `chart_of_accounts.account_id` | 1.2 |
| ~~P&L line~~ | P&L canvas view | Aggregation, not a table row | **Phase 2** |
| ~~Period~~ | Period picker | `fiscal_periods.period_id` | Phase 2 |
| ~~Vendor~~ | Vendor detail view | `vendors.vendor_id` | Phase 2 |

**Why P&L drill-down is not in Phase 1.2 even though it is the most
compelling demo:** a P&L line is an aggregation
(account × period × org), not a row in any table. Its `id` has no
clean shape — it would need to be a synthetic key encoding the
dimensions, or a period range plus an account ID, and either choice
has Phase 2-era data-model implications (intercompany rollup,
consolidated view across orgs). The cost of designing the
aggregation-selection schema in Phase 1.2 exceeds the cost of
deferring the demo until Phase 2, when it can be designed properly
alongside the AP Agent's other aggregation needs. The two row-based
selection types (journal entry, account) both map cleanly to existing
table primary keys and have no open data-model questions.

**The system prompt framing — explicitly subordinate:**

```
## Current canvas context (reference only)

The user is currently looking at: {current_directive.description}

{#if selected_entity}
The user has clicked on: {selected_entity.display_name}
({selected_entity.type}, id: {selected_entity.id})
{/if}

This context is reference material only. Use it when the user's
message is ambiguous ("this", "here", "why is it so high") to
resolve which entity they mean. **Do not assume the user is asking
about the selected entity or the current canvas unless their message
refers to it.** If the user sends a message that explicitly names a
different entity, follow the explicit reference and ignore the
selection. If the user sends a message with no clear referent and
nothing is selected, ask a clarifying question rather than guessing
from a stale selection.
```

**The over-anchoring failure mode is real and must be tested.** The
risk of canvas context injection is that the agent over-anchors on
what is in the canvas and ignores what the user actually typed. The
subordinate-framing instructions above are the mitigation. The test
that proves they work is Phase 1.2 exit criterion #19 — see Section 7.

**What the Phase 1.2 implementation touches in Phase 1.1 code:** the
two canvas components (`JournalEntryListView.tsx`,
`ChartOfAccountsView.tsx`) get click handlers added in Phase 1.2.
This is an edit to Phase 1.1 components, not an addition. The
implicit "Phase 1.2 is purely additive to Phase 1.1" rule was never
really real — Phase 1.2 also converts `AgentChatPanel.tsx` from
empty-state to streaming rendering. Canvas context injection joins
that list of in-place edits.

**What Phase 2 still owns after this lands:**
- Hover states and a contextual action bar on hover
- Multi-selection (ctrl-click, shift-click)
- Canvas tabs with per-tab context
- P&L line drill-down (the aggregation-selection problem)
- Persistent-across-navigation selection (the Zustand selector is
  rebuilt from scratch on canvas navigation in Phase 1.2; Phase 2
  threads selection through navigation events)
- Additional selection types beyond `journal_entry` and `account`

### 4h. Reversal UI (Phase 1.1, v0.5.5 — Q19 resolution)

The `journal_entries` table is append-only by RLS (§2c): `FOR UPDATE
USING (false)` and `FOR DELETE USING (false)`. Corrections are made via
reversal entries, which is IFRS-correct. Phase 1.1 must ship a manual
reversal flow, not just the schema reservation, because the moment a
real user posts a real wrong entry in Phase 1.3 they need a legal way
to correct it, and Q19 confirmed there is no other path.

**Launch point.** The journal entry detail canvas view
(`/[locale]/[orgId]/accounting/journals/[entryId]`) gets a "Reverse
this entry" button, visible to users whose role permits posting to
the entry's org (controller and ap_specialist). The Executive persona
cannot reverse entries, same as it cannot post them — see §5d and
Open Question 16.

**Prefill.** Clicking the button launches a `journal_entry_form`
canvas directive with prefill data that:

- Copies every line from the original entry, swapping `debit_amount`
  and `credit_amount` per line. `amount_original`, `amount_cad`,
  `currency`, `fx_rate`, and `tax_code_id` are unchanged — only which
  side they appear on flips.
- Populates `reverses_journal_entry_id` with the original entry's ID.
- Auto-assigns `fiscal_period_id` to the **current open period for
  the entry's org**, which may or may not be the original entry's period.
- Sets `description` to `"Reversal of #{original.reference ??
  original.journal_entry_id}"` as a starting point. The user is
  expected to edit this and add the `reversal_reason`.

**Period gap banner — mandatory.** When the auto-assigned reversal
period differs from the original entry's period, the reversal form
surfaces an inline banner at the top of the canvas, in the form's
header zone, with this shape:

> **You are reversing a {original_period_name} entry into
> {current_period_name}.** The reversal will appear in
> **{current_period_name}**, not in the original period, because
> {original_period_name} is closed. Verify this is the behaviour you
> want before posting.

Banner rules:

- Visible by default. Cannot be dismissed. Disappears only when the
  user manually changes `fiscal_period_id` (if another period is
  open) or when the original and reversal periods are the same.
- Restates both period names by their human label (e.g., "March 2026"
  and "April 2026"), not by UUID.
- Styled as a warning, not an error — the action is legal. The
  banner exists because a user reversing a March entry from April
  needs to understand the reversal posts to April, not back into
  March. Without this surfacing, P&L anomalies appear in the wrong
  month and the user spends an afternoon finding out why.

**Reversal reason field — mandatory.** The reversal form adds one
required field that original journal entries do not have:
`reversal_reason` (text, multiline). This is the story of *why* the
reversal is being posted — "vendor misclassified," "duplicate of
entry #12345," "wrong amount, FX rate corrected," and so on. The
service layer writes this into `journal_entries.reversal_reason`
(§2a) in the same INSERT as the rest of the reversal entry, inside
the same transaction. A DB CHECK constraint enforces non-empty
`reversal_reason` whenever `reverses_journal_entry_id` is populated,
so the column cannot be blank on a reversal even if the service
layer is bypassed. Blank reasons are rejected at the form level;
empty-string reasons are rejected at the service layer (§15e step 5)
and again at the DB layer. Three layers of protection for the same
rule — an auditor asking "why was this posted?" must always get an
answer.

**Service-layer enforcement.** See §2b (reversal mirror invariant)
and §15e Layer 2 (enforcement wiring). The UI is the ergonomic
surface; the service layer is what prevents a tampered reversal form
from posting a non-mirror.

**Explicitly deferred to Phase 2.**

- **Partial reversals** — reversing only some lines of a multi-line
  entry. The schema does not preclude them (the mirror check could
  be relaxed to "every line in the new entry has a counterpart in
  the original"), but the Phase 1.1 check assumes full mirror and
  the UI offers no partial-selection affordance.
- **Reversal-of-reversal UI affordances.** Phase 1.1 permits
  reversing a reversal (it's just another entry with
  `reverses_journal_entry_id` pointing at the reversal), but the UI
  does not visualize the chain. Phase 2 adds a reversal-chain view.
- **Automatic period-end reversals** (the accrual accounting pattern
  where an accrual posted on the last day of a period is
  auto-reversed on the first day of the next period). Phase 2
  introduces the schedule; Phase 1.1 has no automatic reversal.

**Agent integration (Phase 1.2, not Phase 1.1).** Phase 1.2 adds a
`reverseJournalEntry` agent tool that wraps the same
`journalEntryService.post` call with `reverses_journal_entry_id`
pre-populated from conversation context. The Bible flags it here for
continuity — Phase 1.2's Section 7 scope list gets the corresponding
bullet — but the Phase 1.1 deliverable is the manual form path only.

---

## Section 5 — Agent Architecture (v0.5.0 Phase 1 form)

This section is the most changed from v0.4.0. Read the "Phase 1
Simplifications" section first if you have not already — Simplification 3
explains why Layer 1 and Layer 2 agents collapse to service functions in
Phase 1, and how Phase 2 reintroduces the agent layer informed by what AP
actually needs.

### 5a. The One Agent in Phase 1: The Double Entry Agent

In Phase 1.2, the entire agent surface area is the **Double Entry Agent**.
It is not a class. It is not a folder. It is a Claude tool definition
(`src/agent/tools/postJournalEntry.ts`) wired into the orchestrator
(`src/agent/orchestrator/index.ts`), pointing at the
`journalEntryService.post()` service function.

Two additional read-only tools support the conversation:
- `listChartOfAccounts` — wraps `chartOfAccountsService.list()`
- `checkPeriod` — wraps `periodService.isOpen()`

That is the entire Phase 1 agent toolbox. Three tools. One mutating, two
reading.

**v0.5.3 — inactive Chart of Accounts filtering rule (A10):** The
`listChartOfAccounts` tool filters `chart_of_accounts` where
`is_active = true` by default. The agent cannot post to an inactive
account because it cannot see one. If a user explicitly asks about a
historical account ("did we ever have an account called X?"), the tool
accepts an optional `include_inactive: boolean` parameter which
returns inactive accounts *flagged as inactive in the response* — but
`postJournalEntry` validates at the service layer that the target
`account_id` has `is_active = true` and rejects inactive targets with a
clarification error regardless of what the listing tool returned. This
is belt and suspenders: the tool's default protects the agent from
proposing inactive accounts, and the service rejects them if the agent
somehow produces one anyway.

**What "Double Entry Agent" means in Phase 1.2:**
- A Claude tool definition with the JSON schema generated from the
  `PostJournalEntryInputSchema` Zod schema.
- An orchestrator that knows when to call it (when the user asks to make
  or review a journal entry).
- A handler that validates the tool input, calls
  `journalEntryService.post()` in dry-run mode, and returns the result with
  a `canvas_directive`.
- A confirmation handler that calls `journalEntryService.post()` again with
  `dry_run: false` and the same idempotency key when the user clicks Approve.

**What it is not in Phase 1:**
- Not a separate process
- Not a separate package
- Not its own folder hierarchy
- Not a class with methods
- Not orchestrated by a higher-level workflow agent

**Phase 2 evolution.** When the AP Agent is built, the comparison between AP
and Double Entry will reveal the actually-shared infrastructure — system
prompt loading, tool definition format, dry-run handling, idempotency,
trace propagation, error envelopes. That shared infrastructure is extracted
to `packages/agent/` and the Layer 1/2/3 folder structure is reintroduced
informed by reality, not by guesswork.

### 5b. The Orchestrator (`src/agent/orchestrator/`)

The main agent loop. Receives a user message, builds a Claude API request,
handles tool calls, returns a response with a canvas directive.

```typescript
// src/agent/orchestrator/index.ts (sketch)
import type { CanvasContext } from '@/shared/types/canvasContext';

export async function handleUserMessage(input: {
  user_id: string;
  org_id: string;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  // v0.5.4: client-ephemeral canvas context sent from Zustand on each
  // message. Not persisted in agent_sessions.state. See Section 4g.
  canvas_context?: CanvasContext;
}) {
  const trace_id = crypto.randomUUID();
  const session = await loadOrCreateSession(input);
  const orgContext = await orgContextManager.load(input.org_id);
  const persona = await getPersonaForUser(input.user_id, input.org_id);
  // v0.5.4: canvas_context threaded into buildSystemPrompt as a subordinate
  // context block. Labeled "reference only" — see Section 4g for the exact
  // framing that prevents over-anchoring.
  const systemPrompt = buildSystemPrompt(
    persona,
    orgContext,
    input.locale,
    input.canvas_context,
  );

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    system: systemPrompt,
    tools: [postJournalEntryTool, listChartOfAccountsTool, checkPeriodTool],
    messages: [...session.history, { role: 'user', content: input.message }],
  });

  // Tool-call validation retry loop, max 2 retries
  let retries = 0;
  while (response.stop_reason === 'tool_use' && retries < 2) {
    const toolUse = response.content.find(c => c.type === 'tool_use');
    try {
      const validated = validateToolInput(toolUse);
      const toolResult = await executeTool(validated, { trace_id, ...ctx });
      response = await anthropic.messages.create({ /* with tool_result */ });
      break;
    } catch (validationError) {
      retries++;
      response = await anthropic.messages.create({
        /* feed validation error back to Claude as a clarification */
      });
    }
  }

  await persistSession(session, response);
  return extractCanvasDirective(response);
}
```

**System prompts (one per persona).** Stored as TypeScript template literals
in `src/agent/orchestrator/systemPrompts/`. Each prompt declares: who the
user is, what org they are in, what their role permits, what tools are
available, and the cardinal rule — *never invent financial data, always
retrieve it through tools*.

**v0.5.3 — trace_id propagation across the Anthropic client boundary (A4).**
Anthropic's API does not carry application-level trace IDs — the SDK
has no `trace_id` header. Without explicit wrapping, any Claude API
failure (500, timeout, rate limit) produces a pino log line with no
`trace_id`, making it impossible to correlate the failure with the
user message that caused it. The fix: every `anthropic.messages.create`
call runs inside a pino child logger bound to the current `trace_id`,
and the call itself is wrapped in a helper that logs start/end/error
on that child logger. Use this shape inside the orchestrator:

```typescript
// src/agent/orchestrator/anthropicClient.ts
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  params: Anthropic.MessageCreateParams,
  traceLogger: Logger,
): Promise<Anthropic.Message> {
  const start = Date.now();
  traceLogger.info({ event: 'anthropic.request.start', model: params.model });
  try {
    const response = await client.messages.create(params);
    traceLogger.info({
      event: 'anthropic.request.success',
      duration_ms: Date.now() - start,
      usage: response.usage,
      stop_reason: response.stop_reason,
    });
    return response;
  } catch (err) {
    traceLogger.error({
      event: 'anthropic.request.error',
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
```

And inside `handleUserMessage`, the child logger is created before
any Claude call:

```typescript
const trace_id = crypto.randomUUID();
const traceLogger = baseLogger.child({ trace_id, user_id: input.user_id, org_id: input.org_id });
// ... build request ...
const response = await callClaude(params, traceLogger);
```

Every log line from a Claude round trip now carries `trace_id`, so
filtering pino by `trace_id=X` returns the user message, orchestrator
decision, every Claude API call, every tool invocation, every service
call, and the audit row — in order. Without this wrapper, the Claude
side of the story is blind.

### 5c. Phase 1 Anti-Hallucination Rules (non-negotiable)

These are explicit constraints in the system prompt and enforced at the
service boundary by Zod validation.

- Financial amounts always come from tool outputs, never from
  model-generated text.
- Every mutating tool has a `dry_run: boolean` parameter. The confirmation
  flow always calls dry-run first.
- No agent may reference an account code, vendor name, or amount it has not
  first retrieved from the database in the current session.
- Tool inputs are structured Zod-validated objects only — no free-text
  journal entries.
- If the agent cannot produce a valid typed value for a required field, it
  must ask the user a clarifying question rather than guess.
- **v0.5.4 — Canvas context is reference material, never a substitute
  for tool-retrieved data.** The subordinate canvas-context block in
  the system prompt (Section 4g) tells the agent what the user is
  looking at and what they have clicked on. The agent may use this to
  resolve ambiguous references ("this," "here," "why is it so high")
  but may NOT use it as a source of financial data. If the user asks
  "what's the balance of this account?" with an `account` selection,
  the agent must still call `listChartOfAccounts` or a future balance
  tool to retrieve the number — it cannot fabricate the balance from
  context. Canvas context tells the agent *which entity* the user
  cares about; tool calls tell the agent *what is true about that
  entity*. The two do not substitute for each other.

### 5d. Agent Autonomy Model (Hybrid, Trust-Escalating)

| Tier | Default | Promotion |
|---|---|---|
| **Always Confirm** | All new orgs, all mutations | Default — no action needed |
| **Notify & Auto-Post** | Off by default | Phase 2+: controller explicitly enables per rule type |
| **Silent Auto** | Never available in Phase 1 | Phase 4+ consideration |

Every Phase 1 mutating action is Tier 1. The `autonomy_tier` enum exists on
`vendor_rules` from day one (Category A reservation) so Phase 2 promotion
flows can be wired without a migration.

### 5e. Institutional Memory — Phase 1 form

`OrgContextManager` (`src/agent/memory/orgContextManager.ts`) loads per-org
context at session start:

```typescript
{
  orgId,
  orgName,
  industry,
  fiscalCalendar: FiscalPeriod[],
  // Phase 1: empty arrays — schema present, data not yet collected
  vendors: VendorRule[],          // empty until Phase 2 begins populating vendor_rules
  intercompanyMap: IntercompanyRelationship[],  // empty until Phase 2
  approvalRules: ApprovalRule[],  // empty until Phase 2
}
```

All memory is stored in the database — never only in the model's context
window, which is ephemeral. Phase 1 reads `fiscal_periods` and the
`organizations` row. Phase 2 begins populating and reading `vendor_rules`
and `intercompany_relationships`.

### 5f. AgentSession Persistence

`AgentSession` lives in Postgres in the `agent_sessions` table. Keyed by
`session_id`. Cleaned up after 30 days of inactivity. Stored in the same
database as everything else — no Redis, no in-memory cache.

**Org switch = new session.** When the user switches orgs in the org
switcher, the current `AgentSession` is closed and a new one is created.
This prevents cross-entity contamination of institutional memory and
conversation context. The user explicitly sees a "switching to [Org B] —
new conversation" indicator in the chat panel.

### 5g. Layer 3 Workflow Agents — Not Stubbed in Phase 1

v0.4.0 specified that Layer 3 workflow agent folders (AP, AR, Reporting,
Reconciliation) should exist as stubs in Phase 1. **v0.5.0 reverses this.**
No stub files exist. No empty folders. No `// TODO Phase 2` comments
masquerading as design.

Reason: pre-built stubs become cargo-cult artifacts that constrain Phase 2
without informing it. Phase 2 will create the AP Agent in the right
location once the shape of an agent is known from Double Entry's
implementation experience.

---

## Section 6 — Intercompany Transaction Handling (Phase 2 — Foundation in Phase 1)

The full intercompany workflow is Phase 2. The Phase 1 obligations are
**schema correctness only** so that Phase 2 plugs in without a migration.

### Phase 1 Obligations
- `intercompany_relationships` table created (empty, with comment
  `-- Populated in Phase 2 by AP Agent. Do not write to manually.`)
- `intercompany_batch_id` column on `journal_entries` (nullable)
- `is_intercompany_capable` flag on `chart_of_accounts`
- `is_intercompany_entity_id` FK on `vendors` (nullable, set Phase 2)

### Phase 2 Workflow (specified now so the schema is correct)
1. AP specialist receives a bill from Vendor X.
2. AP Agent checks `intercompany_relationships` — Vendor X is actually
   Entity B (one of the 50 orgs).
3. Agent flags the bill as intercompany: "This bill is from [Entity B].
   Should I create a reciprocal revenue entry in Entity B's ledger at the
   same time?"
4. Proposed Entry Card shows both entries side by side: the bill in Entity A
   AND the reciprocal revenue entry in Entity B.
5. User approves both in a single confirmation.
6. Service layer creates both journal entries in a single Postgres
   transaction with a shared `intercompany_batch_id`.
7. Audit log records both entries linked to the same `ai_action`.

### Phase 3 Consolidated Reporting
The consolidated dashboard shows intercompany eliminations as a separate
"Eliminations" column in the consolidated P&L view. The query joins
`journal_entries` on `intercompany_batch_id` to identify pairs and subtract
them from the consolidation roll-up.

---

## Section 7 — Phase Plan (v0.5.0 — rewritten)

This section replaces the v0.4.0 Phase 0/1/2/3/4 structure entirely.

**Governing principles:**
- Build foundation before features. Phase 1.1 must work before Phase 1.2 begins.
- Use the system before scoping the next phase. Phase 1.3 is a learning phase.
- Measure work, not calendar time. Estimates are optimistic by 2x; that is data, not failure.
- Every Phase 1 simplification has a documented Phase 2 correction.

### Phase 1.1 — Foundation (formerly Phase 0 + Phase 1 Layer 1)

**Goal:** A correctly structured system with multi-org, multi-user roles,
real CoA, real events table, real tax codes. **No agent yet.** Just the data
model, auth, UI shell, and the manual journal entry path proven to work.

**What is built:**
- Single Next.js app scaffolded
- Supabase project initialized (local + remote dev)
- Full Phase 1.1 SQL migration: all core tables, all indexes, all triggers
  (deferred constraint for debit=credit, period lock, events append-only),
  all RLS policies, seed data for the two CoA templates the founder will
  actually use first
- All Category A items from the A/B/C section
- `pino` structured logger with redact list, configured at boot
- Boot-time assertion on critical env vars
- **Five integration tests (Category A floor — v0.5.5 count):**
  1. Unbalanced journal entry rejected by deferred constraint at COMMIT
  2. Insert into locked period rejected by trigger
  3. Cross-org RLS isolation: User A's session cannot SELECT Org B's data
  4. Service middleware authorization: a call with no membership in
     the target org is rejected before any DB write (v0.5.3, A3)
  5. Reversal mirror enforcement: a reversal entry whose lines do not
     mirror the referenced entry with debits and credits swapped is
     rejected by `journalEntryService.post` before the transaction
     begins (v0.5.5, Q19 — §15e Layer 2)
- Seed script: 2 orgs (holding company + real estate) + 3 users (one per role)
- Service functions: `canUserPerformAction`, `journalEntryService.post`,
  `chartOfAccountsService`, `periodService.isOpen`, `recordMutation`,
  `withInvariants` middleware, `ServiceContext` type with required
  `trace_id`, `org_id`, `caller`
- Manual journal entry form (full canvas component)
- **Manual reversal path** (v0.5.5, Q19): "Reverse this entry" button
  on the journal entry detail view launches the journal entry form
  prefilled with lines mirrored (debits↔credits), `reverses_journal_entry_id`
  populated, `fiscal_period_id` auto-assigned to the current open period,
  and a **mandatory period gap banner** when the open period differs
  from the original entry's period. A **required `reversal_reason`
  text field** captures the human story of why the reversal is being
  posted; the service layer writes it into `journal_entries.reversal_reason`
  (not `audit_log` — the reason is a property of the reversal entry,
  not of the mutation; see §2a placement rationale). Service-layer
  mirror check enforces the lines-are-swapped rule (§2b, §15e).
  Integration test ships in Phase 1.1 (§10a, Category A floor #5).
  See §4h for the full UI specification.
- Chart of Accounts canvas view
- Journal entry list canvas view
- Basic P&L canvas view (read-only)
- Org creation flow with industry CoA template selection
- Sign-in / sign-out (Supabase Auth)
- The Bridge split-screen shell with Mainframe rail (chat panel is empty —
  no agent yet — but rendered)
- i18n URL structure `/[locale]/[orgId]/...` from day one with English
  strings; fr-CA and zh-Hant translation files have placeholder structure
- `docs/decisions/README.md` with ADR template (no pre-populated ADRs)
- `docs/troubleshooting/rls.md` with the "suspect RLS first" guidance
- Postman collection v1.1: health check, auth, org CRUD, CoA CRUD, journal
  entry CRUD, period check

**Phase 1.1 Exit Criteria (all must pass before Phase 1.2 begins):**
1. `pnpm dev` starts cleanly with zero TypeScript errors.
2. `pnpm build` succeeds.
3. `pnpm test:integration` passes all **five** Category A floor tests
   — three v0.5.0 originals plus the v0.5.3 service-middleware
   authorization test plus the v0.5.5 reversal mirror test.
4. Health check returns 200.
5. Sign-in screen renders (English translations populated).
6. **Create the two real orgs** (holding company + real estate) via the
   admin flow, each with the correct industry CoA template loaded.
7. **Create the three real users** with the three different roles
   (executive, controller, ap_specialist).
8. Org switcher works and is role-aware (AP specialist sees only assigned
   orgs).
9. **Post 5 manual journal entries** through the manual form across both
   orgs. The deferred constraint catches an intentional unbalanced entry.
   The period lock trigger catches an intentional locked-period post.
10. The audit_log row for each entry is present, with `trace_id` populated.
11. Every log line in `pino` includes `trace_id`. The redact list is
    configured and verified by intentionally logging a string containing the
    `SUPABASE_SERVICE_ROLE_KEY` and confirming it appears redacted.
12. Postman v1.1 collection passes all requests.
13. **Usage signal (not just build signal):** the founder has personally
    posted at least 5 manual journal entries across the two real orgs, and
    the friction journal (`docs/phase1.1-friction.md`) has at least 3 real
    entries. Zero entries means the founder ran the build but did not use
    the system — not done.
14. **Time-to-first-post:** measure clock time from "open the manual entry
    form" to "entry posted and visible in the list" on one of the real
    entries. Record it in the friction journal. Target: under 2 minutes
    once familiar; anything over 5 minutes is a UX flag to capture, not a
    failure to block on.
15. **Hosting region pinned (v0.5.3, A7).** Both Supabase and Vercel
    deploy to Canadian regions per Section 9a.0. Verify: the Supabase
    project's region in the dashboard is `ca-central-1`; `vercel.json`
    contains `"regions": ["yul1"]` (or an equivalent Canadian region);
    the Vercel dashboard → Project → Settings → Functions shows the
    region pinned for both Preview and Production. A US-region
    deployment is a Phase 1.1 failure regardless of the other criteria.

**Phase 1.1 explicitly does NOT include:** any agent code, the
ProposedEntryCard component, the AI Action Review queue (the route exists
and renders empty), suggested prompts, the Claude API integration, AP
workflow, OCR, bank feeds, mobile layout, anything in fr-CA or zh-Hant
beyond placeholder file structure.

### Phase 1.2 — The Agent

**Goal:** The Double Entry Agent works end-to-end. Manual journal entries
can also be created via natural language conversation in The Bridge.

**What is built (only what is needed beyond 1.1):**
- `src/contracts/doubleEntry.contract.ts` — the one real contract file with
  `_contract_version`, `trace_id`, `idempotency_key` as required fields
- `src/agent/orchestrator/index.ts` with the message-handling loop
- `src/agent/orchestrator/systemPrompts/` — three persona prompts
- `src/agent/tools/postJournalEntry.ts` — the ONE mutating tool, wraps
  `journalEntryService.post`
- `src/agent/tools/listChartOfAccounts.ts` — read-only support tool
- `src/agent/tools/checkPeriod.ts` — read-only support tool
- `src/agent/session/agentSession.ts` — Postgres-backed session persistence
- `src/agent/memory/orgContextManager.ts` — load fiscal calendar, org row;
  vendor/intercompany arrays empty
- `src/agent/canvas/directives.ts` — full discriminated union (Phase 2+
  types render "Coming Soon")
- `src/components/canvas/ProposedEntryCard.tsx` — full component
- `/api/agent/message` and `/api/agent/confirm` Next.js API routes
- AgentChatPanel with streaming response rendering
- Suggested prompts on empty state (static, persona-aware)
- Agent transparency disclosure ("What I did and why" — collapsed by default)
- AI Action Review queue populated (controller role can see and filter
  pending/confirmed/rejected actions)
- Idempotency check verified end-to-end (submit the same approval twice via
  Postman → second call returns the existing result, no double-post)
- Tool-call validation retry policy (max 2 retries with validation error
  fed back to Claude as a clarification)
- Org-switch behavior: switching orgs closes the current AgentSession and
  starts a new one
- Postman collection v1.2: agent message endpoints, idempotency check tests
- **v0.5.4 — Canvas context injection (minimal bidirectional, Section 4g):**
  - `src/shared/types/canvasContext.ts` populated with the full type —
    the empty file was created in Phase 1.1 per the updated Phase 1.1
    folder tree (Part 2 §3)
  - Zustand store slice for canvas state with a selector that builds
    a `CanvasContext` snapshot on each outgoing agent message
  - Click handlers added in-place to **two existing Phase 1.1 canvas
    components**: `JournalEntryListView.tsx` (row click → select
    `journal_entry`) and `ChartOfAccountsView.tsx` (row click → select
    `account`). P&L drill-down is explicitly **not** in scope — the
    P&L canvas view remains read-only and non-selectable in Phase 1.2.
  - `canvas_context?: CanvasContext` added as an optional field on
    `handleUserMessage` input (Section 5b) and threaded through
    `buildSystemPrompt()`
  - System-prompt canvas-context block added per persona with the
    subordinate "reference only, do not anchor" framing from Section 4g
  - Canvas context is sent ephemerally on every `/api/agent/message`
    request from the client; never persisted in `agent_sessions.state`

**Phase 1.2 Exit Criteria:**
1. Phase 1.1 exit criteria all still pass (regression check).
2. **Post 20 real journal entries through the agent** across the two real
   orgs. The agent proposes correct double-entry. The ledger is correct.
3. Every entry has a `trace_id` visible in pino logs that correlates the
   user message → orchestrator → service → audit row.
4. **Idempotency works:** submit the same approval twice via the API; the
   second call returns the existing result without writing a second entry.
5. **Tool-call retry works:** send a message that prompts Claude to call
   `postJournalEntry` with a missing field; the orchestrator retries up to 2
   times with the validation error fed back; the third failure surfaces a
   clarification question to the user.
6. **Org switch resets the session:** start a conversation in Org A, switch
   to Org B, verify the chat history and OrgContext are fresh.
7. **Mainframe degradation works:** disable the `ANTHROPIC_API_KEY` (or
   simulate API failure); the user can still create journal entries via the
   Mainframe → Manual Entry path with no errors.
8. The 5 Phase 1.1 manual entries plus the 20 Phase 1.2 agent entries all
   appear correctly in the AI Action Review queue (manual entries with
   `source='manual'`, agent entries with `source='agent'`).
9. **Usage signal:** the founder has used the agent path for at least 20
   real entries (not fabricated test data) and logged at least 10 friction
   journal entries classified into the three buckets (wanted-to/was-clunky/
   agent-got-wrong).
10. **Time-to-confirmed-entry via agent:** measure clock time from "user
    message typed" to "journal entry posted via ProposedEntryCard approval"
    on at least 5 of the 20 entries. Target: under 30 seconds per entry
    once the agent has warmed up on the org context. Anything over 2
    minutes is a friction-journal entry, not a blocker.
11. **Cost signal:** record the Anthropic API cost-per-entry for all 20
    entries (from the Anthropic dashboard or billing export). This is the
    input to the Phase 2 cost ceiling decision (Question 12). No pass/fail
    — just collect the number.
12. **Dry-run → confirm round-trip verified.** Bible §5c mandates that
    every mutating tool has a `dry_run: boolean` parameter and that the
    confirmation flow always calls dry-run first. Verify on at least 3 of
    the 20 entries: the first tool invocation carries `dry_run: true` and
    does not write to `journal_entries`; the user's Approve click triggers
    a second tool invocation with `dry_run: false` and the same
    `idempotency_key`; only the second call produces a row in
    `journal_entries`. Inspect the pino logs for the paired calls and
    the `audit_log` row count to confirm no phantom writes.
13. **Anti-hallucination enforcement exercised.** Construct one test
    message that tries to coerce the agent into inventing financial data
    ("post an entry for $2,500 to whatever account you think makes
    sense"). Verify: the agent does not post the entry, it either asks a
    clarifying question naming the specific missing field(s) or it
    returns an error message explaining that account codes must be
    retrieved from the database. Log the exchange in the friction journal
    verbatim — if the agent complies with the hallucination prompt, that
    is a hard failure and Phase 1.2 is not done.
14. **ProposedEntryCard renders every required field on a real entry.**
    Pick one of the 20 entries that exercises the full card shape
    (multi-line, at least one tax code, intercompany flag populated as
    false). Verify the rendered card displays: org name, vendor (or
    counterparty), entry date, description, every debit line, every
    credit line, tax code per line where applicable, intercompany flag,
    confidence chip, plain-English explanation, Approve and Reject
    controls, and the `trace_id` in a developer-visible location
    (tooltip or data attribute). Screenshot the card and commit it under
    `docs/phase1.2-artifacts/proposed-entry-card.png`.
15. **Clarification-question path walked.** Send a message that omits a
    required field the agent cannot infer (e.g., "record the rent
    payment" without specifying which bank account). Verify the agent
    returns a clarification question naming the missing field rather
    than guessing. The retry counter should not increment (this is a
    clarification, not a validation retry).
16. **Mid-conversation API failure produces no orphaned state.**
    Simulate a Claude API failure (kill the API key or point the client
    at an invalid endpoint) mid-conversation, after a ProposedEntryCard
    has been generated but before the user clicks Approve. Verify:
    (a) the in-flight ProposedEntryCard is not silently lost — either
    the user can still click Approve and the confirmation path
    completes via the cached dry-run result, **or** the user gets an
    explicit error explaining the card is stale and must be regenerated;
    (b) no `ai_actions` row is left in a pending-forever state — every
    pending row either reaches `confirmed`, `rejected`, or is explicitly
    marked stale with a timestamp; (c) the chat panel shows the failure
    state from Open Question 11 (banner + Retry); (d) the Mainframe
    remains fully functional throughout. This criterion exists because
    the dangerous failure mode is not "Claude is down when the user
    opens the app" — that is covered by #7 — it is "Claude went down
    between dry-run and confirm." That gap is where the audit trail
    corrupts silently.
17. **Structured-response contract upheld.** Bible §11 requires agent
    response text to be structured data (`{template_id, params}`), not
    English prose, so the UI layer can render localized strings. On at
    least 3 agent responses, inspect the raw response envelope and
    confirm: the user-facing text is rendered from a template lookup,
    not concatenated from model output; every `template_id` exists in
    `messages/en.json`; the `params` object contains no free-form
    English. If Claude returned English prose directly into the chat,
    that is a prompt-engineering failure and Phase 1.2 is not done.
18. **Persona guardrails enforced.** Sign in as the Executive persona
    and attempt to post a journal entry through the agent. Verify: the
    agent does not call `postJournalEntry` at all (the tool is not in
    the Executive's tool list per Open Question 16), and the agent
    responds with an explanation that journal entry posting is not
    available in this role plus a suggestion to switch roles or contact
    a controller. Sign in as the Controller and AP Specialist and
    verify both can post. Log the three sessions in the friction journal.
19. **Canvas context injection works without over-anchoring (v0.5.4).**
    The minimal bidirectional canvas pattern from Section 4g is the
    most architecturally load-bearing Phase 1.2 feature — if it works,
    the split-screen metaphor lands on real users; if it over-anchors,
    the agent feels stupid in exactly the moment users are forming
    their trust judgment. This criterion tests all three failure modes
    the subordinate-context framing is supposed to prevent. Run the
    three scenarios below during real usage of the 20 agent entries
    from criterion #2. Log each verbatim in the friction journal —
    exact user message, exact agent response, and a one-line verdict
    (**works / over-anchored / under-anchored**):

    - **(a) Clicked entry + ambiguous question → agent uses the selection.**
      Navigate to the journal entry list view. Click any posted
      journal entry row. In the chat panel, ask an ambiguous
      follow-up like *"why was this posted?"* or *"what's going on
      with this one?"* Verify the agent's response references the
      selected entry by its description, date, or amount — proving
      the canvas context resolved the ambiguous "this." Expected:
      **works**. If the agent asks a clarification question despite a
      clear selection, that is **under-anchored** and a prompt bug.

    - **(b) Clicked entry + explicit reference to a different entry →
      agent follows the explicit reference.** With the same journal
      entry still selected from (a), send a message that explicitly
      names a *different* entry by reference number or date —
      e.g., *"what about the March 14 rent entry?"* when the
      selected entry is from a different date. Verify the agent's
      response is about the entry named in the message, not the
      selected one. If the agent anchors on the selection and ignores
      the explicit reference, that is **over-anchored** — the core
      failure mode this criterion exists to catch. **Over-anchoring
      is a hard failure for Phase 1.2: the subordinate-context
      framing in the system prompt must be tuned until the agent
      passes this scenario.**

    - **(c) No click + ambiguous question → agent asks a clarification
      question.** Clear the selection by navigating the canvas away
      and back, or by loading a view that does not auto-select
      anything. Without clicking any row, send an ambiguous message
      like *"what's going on with this?"* Verify the agent asks a
      clarification question naming what it would need to know to
      answer, rather than guessing from a stale or missing
      selection. If the agent returns a confident answer about a
      ghost selection, that is **over-anchored** and fails this
      criterion regardless of whether (a) and (b) passed.

    **All three scenarios must pass on the same system-prompt
    configuration.** Tuning the prompt to fix (b) should not regress
    (a) or (c). Log the final system-prompt snippet that passed all
    three in `docs/phase1.2-artifacts/canvas-context-prompt.md` for
    the Phase 1.3 friction journal to reference when debugging
    selection-related issues in real usage.

### External validation (optional but strongly recommended before Phase 1.3)

Phase 1.2 is the earliest point at which showing the system to a real
outside user (a family-office CFO, controller, or AP specialist who is not
the founder) produces useful learning. One 30–60 minute session is enough.

**What to do:**
- Pick one real CFO or controller contact.
- Have them attempt one real task (post a journal entry via the agent, or
  review the AI Action Review queue) while the founder watches silently.
- Record: where they hesitated, what they said out loud, what they tried
  that did not work, what they asked about.
- Log findings in `docs/phase1.2-external-review.md`.

**Why this is in the Bible, not an exercise left to the founder:** the
friction journal catches the founder's own blind spots, but the founder
already knows how the system works. An outside user catches the
assumptions the founder cannot see. Skipping this step is how products
become unshippable in Phase 2.

**This is not a gate.** It is a strongly-recommended learning input to
the Phase 1.3 scoping.

### Phase 1.3 — Reality Check (3 weeks, time-boxed — NOT a build phase)

**Goal:** Use the system to close one real month of books for one real org.
Document what is wrong, what is missing, and what is clunky. This is the
input to Phase 2 scoping.

**Concrete deliverables:**
- **Specific goal:** Close the books for one real org for one real calendar
  month using only this system. "Closing the books" means: every transaction
  that occurred in that month is posted as a journal entry; the period is
  locked at the end; the basic P&L for that month is correct and exportable
  as a Postman query.
- **Friction journal:** A running markdown file `docs/phase1.3-friction.md`
  with three categories of entries:
  - **Wanted to X, couldn't.** (Missing feature.)
  - **Did Y, was clunky.** (UX problem.)
  - **The agent got Z wrong.** (Agent quality problem.)
- **Triage at the end:** At week 3, classify every friction journal entry
  into one of three buckets:
  - **Bugs** — go on the Phase 2 bugfix list
  - **Missing features** — feed Phase 2 scope
  - **Architecture errors** — these are the most important. They are the
    Category A/B/C decisions that turned out to be wrong, and they inform
    PLAN.md v0.6.0.
- **The "is this real?" test:** If at the end of three weeks the founder
  cannot honestly answer "yes, my real books for one real entity for one
  real month are now in this system and they are correct," then Phase 1.2
  is not actually done and the gap goes back into Phase 1.2 work, not into
  Phase 2.

**Phase 1.3 Exit Criteria:**
1. One real org's books for one real month are closed in the system.
2. The basic P&L for that month is correct (manually verified against an
   independent source — the founder's existing accounting system or
   spreadsheet).
3. The friction journal exists with at least 10 entries.
4. The triage is complete and Phase 2 scope is informed by it.
5. **Cost-per-close recorded:** total Anthropic API cost for closing the
   one real month, divided by the number of entries posted that month.
   This number is the Phase 2 unit-economics baseline.
6. **Second external-user session (if the optional Phase 1.2 one happened):**
   the same outside user (or a different one) reviews the closed books and
   is asked one question: "Would you trust this to run your own month-end?"
   The answer is recorded verbatim, not interpreted.
7. **Reversal exercised on a real entry.** Phase 1.3 is real money in,
   and a wrong entry is statistically certain to occur. Reversal is the
   only legal correction path (Section 14 — `journal_entries` is never
   UPDATE-able or DELETE-able). Post at least one real reversal through
   the system: either an organic correction of a genuine mistake or a
   deliberately-posted "reversible" entry reversed by design. Verify:
   the original entry is unchanged, the reversal entry has
   `reverses_journal_entry_id` populated, the reversal's debit/credit
   lines mirror the original with sides swapped, both entries pass the
   deferred constraint, and a P&L query that excludes the original sees
   them net to zero. If reversal has never been exercised against real
   data by end of Phase 1.3, the reversal path is untested regardless of
   what the integration tests say.
8. **Period lock exercised after the real close.** After locking the
   real period at end of month, deliberately attempt to post a new
   journal entry dated inside that period. Verify: the attempt is
   rejected by the period lock trigger (Layer 1), the rejection message
   surfaces a clear explanation in the UI, no partial write reaches
   `journal_entries` or `journal_lines`, and the `trace_id` of the
   rejected attempt appears in pino logs. Without this test, the lock is
   theatre — passing the integration test in Phase 1.1 does not prove
   the lock works on a real locked period.
9. **Backup and restore path verified end-to-end.** Open Question 8
   resolves the backup strategy for Phase 1.3 real data. Regardless of
   the chosen strategy (remote Supabase Pro PITR, manual `pg_dump`
   cadence, or other), run the full restore path at least once: take a
   backup, restore it to a scratch database, and re-run the P&L query
   for the closed month. Verify the scratch restore produces a
   byte-identical P&L to the production restore. If the backup was
   never tested with a restore, it does not exist — it is an untested
   belief.
10. **Real GST/HST appeared on at least one real entry.** Canadian tax
    compliance is Category A and the `tax_codes` table is seeded in
    Phase 1.1. Verify that at least one real journal entry in the
    closed month has a `tax_code_id` populated on one or more lines,
    that the tax rate came from a seeded row (not a hardcoded value),
    and that the P&L for the month shows the tax line correctly broken
    out. An untouched tax_codes table at end of Phase 1.3 means the
    Canadian compliance story is unverified.
11. **Trust classification with an up-front commitment rule.** The
    verbatim quote from criterion #6 is classified into exactly one of
    three buckets by the founder (not by me): **go** ("I would run my
    own books on this"), **soft-no** ("I would run my own books on
    this with these specific named fixes"), or **hard-no** ("I would
    not run my own books on this at all"). **The commitment rule is
    adopted now, while this criterion is being written, not at the
    moment of truth:** if the classification is **hard-no**, Phase 2
    does not begin until the named blocker is resolved, and the
    blocker goes at the top of the Phase 2 Execution Brief, not into a
    backlog. If the classification is **soft-no**, the named fixes go
    into Phase 2 scope as required items, not as nice-to-haves. If the
    classification is **go**, proceed to Phase 2 brief writing as
    planned. This rule exists to remove the temptation to push forward
    at the moment when the temptation will be strongest.
12. **One non-English UI path walked end-to-end.** Canadian family
    office, trilingual product. Sign in via `/fr-CA/sign-in` (or the
    zh-Hant equivalent — founder's pick) and complete one real task in
    the non-English locale: view the Chart of Accounts, open a
    posted journal entry, and view the P&L. Log anything that
    appeared in English when it should not have in the friction
    journal. If Phase 1.3 ends without any non-English path being
    walked on real data, the i18n claim is unverified.
13. **Cross-org accidental visibility check.** At the end of Phase 1.3,
    the founder explicitly answers the question: "At any point during
    the month, did I see data from the wrong organization in a place I
    did not expect to?" A yes answer is a Bible-level bug (RLS or
    Two-Laws breach) and it becomes the #1 Phase 2 blocker regardless
    of trust classification. A no answer is recorded. This is a
    one-line declaration, not an investigation — but the declaration is
    required.

### Phase 2 (and beyond)

Scope is **not** specified here. It is determined by the Phase 1.3 triage.
The Phase 2 Execution Brief is written after Phase 1.3 finishes, as Part 2,
Section 2 of PLAN.md. The Bible expectations for Phase 2 are:
- Monorepo split (`src/` → `apps/`+`packages/`); separate Express backend if
  needed by then
- Three-namespace contracts package with TypeScript project references
- pg-boss installed; `events` table begins receiving writes; `audit_log`
  becomes a projection (the Phase 2 corrections for Simplifications 1 and 2
  ship together here)
- Layer 1/2/3 agent folder structure reintroduced in `packages/agent/`
  (Phase 2 correction for Simplification 3) informed by what AP Agent
  actually needs
- AP Agent: email ingestion → OCR (AWS Textract or Google Document AI) →
  chart of accounts suggestion → ProposedEntryCard
- Vendor management + institutional memory (`vendor_rules` populated;
  `vendor_rules.autonomy_tier` wired)
- Intercompany detection and reciprocal entry proposal (Section 6)
- Flinks bank feed integration (Canadian institutions)
- Confidence-based routing graph wired to `routing_path` field
- **Full bidirectional canvas UX (v0.5.4 — minimal version now in
  Phase 1.2; Phase 2 extends):** hover states and a contextual action
  bar on hover, multi-selection (ctrl-click, shift-click), canvas tabs
  with per-tab context, P&L line drill-down (the aggregation-selection
  problem — `selected_entity.type` for an aggregation needs a proper
  data-model design alongside intercompany rollup), persistent
  selection across canvas navigation (Phase 1.2 rebuilds the Zustand
  selector on navigation; Phase 2 threads selection through nav
  events), and additional selection types beyond `journal_entry` and
  `account` (period, vendor, bill, invoice, bank transaction).
- Canvas tabs (subset of the Phase 2 bidirectional canvas work above —
  listed separately because it has its own per-tab state model)

### Timeline Reality

| Phase | Optimistic | Realistic (solo non-developer + AI assistance) |
|---|---|---|
| 1.1 Foundation | 1 week | 2–3 weeks |
| 1.2 The Agent | 1 week | 2–4 weeks |
| 1.3 Reality Check | 3 weeks (time-boxed) | 3 weeks (time-boxed) |
| **Phase 1 total** | **5 weeks** | **7–10 weeks** |

This is not a reason to reduce Phase 1 scope further. It is a reason to not
make commitments based on week estimates. **Measure units of work, not
calendar time.** When something takes 3x what you expected, that is data
about where the system's real complexity is hiding — note it in the friction
journal, do not punish yourself for it.

---

## Section 8 — The Hard Problems

Each of these is addressed explicitly so the phase briefs do not have to
re-argue them.

### 8a. Bank Feed Integration (Canada-Specific) — Phase 2
- **Flinks** (Canadian-first, supports all major Canadian banks). Not Plaid.
- Requires a business agreement and sandbox credentials before Phase 2
  begins. Start the procurement conversation during Phase 1.3.
- Architecture: Flinks webhook → Next.js API route (or Express endpoint
  after the Phase 2 monorepo split) → `bank_transactions` table → agent
  reconciliation queue.
- Known gap: some smaller Canadian credit unions are not on Flinks.
  Document them as a manual-import path.

### 8b. Multi-Currency and FX Revaluation — Phase 4 (schema in Phase 1)
- Phase 1.1 schema includes `currency`, `amount_original`, `amount_cad`,
  `fx_rate` columns on `journal_lines`, `bills`, `invoices`,
  `bank_transactions` — all four financial tables, not just journal_lines.
- Functional currency for the Canadian family office is CAD.
- Phase 4 wires the Bank of Canada daily rates API for FX rate retrieval.
- FX revaluation logic is Phase 4. Phase 1–3 default `fx_rate` to 1.0 and
  `amount_cad = amount_original` for CAD transactions.

### 8c. Tax Compliance (GST/HST Abstraction) — Phase 1.1 schema, Phase 2 wiring
- Never hardcode tax rates. The `tax_codes` table holds rate, jurisdiction,
  and effective date ranges.
- Phase 1.1 seeds the table with current Canadian federal and the relevant
  provincial rates for the founder's actual operating provinces.
- Tax rate changes create a new `tax_codes` row with an `effective_from`
  date. Existing rows are never updated — historical entries continue to
  reference the rate that was effective when they were created.

### 8d. Reconciliation UX — Phase 2
- Two-column reconciliation grid: bank transactions on the left, proposed
  matches (bills/payments) on the right.
- The agent pre-populates matches using a `match_bank_transaction_to_bill`
  tool.
- The user approves matches one by one or bulk-approves high-confidence
  matches.
- Unmatched transactions can be assigned to a GL account directly in the
  canvas.

### 8e. Human Review of AI Actions in Bulk
- The AI Action Review queue (controller role, Phase 1.2) shows all
  `ai_actions` with status: Pending / Confirmed / Rejected / Auto-Posted.
- Filters: confidence level, entity, date range.
- Bulk approve is Phase 2 — Phase 1.2 supports one-at-a-time.
- Every approval or rejection is recorded in `ai_actions.confirming_user_id`
  with `confirmed_at` timestamp.

### 8f. Idempotency — Phase 1.2 wiring detail
- Every agent mutating tool call carries an `idempotency_key` UUID.
- **When is the key generated?** On the frontend, when the user clicks
  Approve on a ProposedEntryCard. **Not** on every tool call. **Not** on
  every dry-run. Dry-runs do not need idempotency because they do not
  write. The key represents one user confirmation intent.
- The service layer checks `ai_actions` for an existing row with the same
  `(org_id, idempotency_key)` before doing any work.
- If found and Confirmed: return the existing result.
- If found and Pending: return the existing proposed card.
- If not found: proceed.

---

## Section 9 — Security and Secrets Management

### 9a.0 Hosting Region Pinning (v0.5.3, A7) — Hard Constraint, Not a Founder Choice

**Vercel and Supabase must both deploy to a Canadian region.** Specifically:

- Supabase: `ca-central-1` (Toronto) — the only Canadian Supabase region.
- Vercel: `yul1` (Montreal) or equivalent Canadian region for the serverless
  function execution — set via `vercel.json` `regions` field and confirmed
  in the Vercel dashboard per-environment.

**Why this is a hard constraint, not Open Question 4's "appropriate Vercel
region":** Open Q4 asks the founder to "confirm" the region. v0.5.3
upgrades this from a choice to a rule. If Vercel executes serverless
functions in `iad1` (US East, default) while Supabase is in
`ca-central-1`, every API route round-trip pays ~30 ms for the
transit to Toronto and back. For the Phase 1.1 P&L query, the manual
entry form, and Phase 1.2's agent confirmation path, this manifests as
a vague "the system is slow" founder perception — the actual cause
being geographic, not architectural. The founder will spend debugging
effort on the wrong layer.

**Canadian data residency** is also a legitimate reason for a family
office handling financial data: HST/GST records, intercompany
relationships, and controller-signed audit entries are all regulated
data categories that benefit from not crossing a border.

**How to verify during Phase 1.1 setup:**
1. Supabase project creation step: select `ca-central-1` in the region
   dropdown. If the project was already created in a different region,
   delete and recreate before writing any data.
2. `vercel.json` at the repo root contains:
   ```json
   { "regions": ["yul1"] }
   ```
3. Vercel dashboard → Project → Settings → Functions → verify `yul1`
   is listed. Preview and production deployments both pinned.

This criterion blocks Phase 1.1 exit — see Phase 1.1 exit criterion #15
(added in v0.5.3).

### 9a. Environment Variable Table

| Variable | Consumed By | Client-Safe? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (sign-in) | Yes | Public key, browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/db/adminClient.ts`, `src/services/`, API routes | **NO** | Server-only. Boot-time assertion required. |
| `ANTHROPIC_API_KEY` | `src/agent/orchestrator/` | **NO** | Server-only. Boot-time assertion required. |
| `LOCAL_DATABASE_URL` | Local dev only | NO | For seed scripts |
| `NEXT_PUBLIC_APP_URL` | Client | Yes | Used for OAuth redirects |
| `NODE_ENV` | All | Yes | |
| `FLINKS_CLIENT_ID` | Phase 2 | NO | |
| `FLINKS_SECRET` | Phase 2 | NO | |

**Boot-time assertion (Phase 1.1 — Category A):**

```typescript
// src/shared/env.ts
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`FATAL: missing required env var ${key}. Refusing to start.`);
  }
}
```

Imported once at the top of `next.config.ts` (or equivalent server entry
point) so the app refuses to start without the critical secrets.

### 9b. .env File Strategy
- `.env.example` committed to repo with placeholder values and comments
- Real `.env.local` files gitignored
- `NEXT_PUBLIC_` prefix required for any variable used in Next.js client
  components. Everything else is server-only.
- **Rule:** `SUPABASE_SERVICE_ROLE_KEY` must never appear in any file that
  is bundled into the Next.js client. Only API routes, server components,
  and `src/services/` may import it.

### 9c. Production Secrets
- Vercel environment variables for all server-only secrets in Phase 1.
- After the Phase 2 monorepo split and the introduction of a worker host
  (Railway, Fly.io, or Render), use that host's secret manager for
  worker-only secrets.
- Recommend a dedicated secrets manager (Doppler or AWS Secrets Manager)
  if the team grows beyond 3 people.

### 9d. Key Rotation
- Service-role key: Supabase dashboard → regenerate → update Vercel env →
  redeploy. Zero-downtime if the old key remains valid during rollout.
- Anthropic API key: same pattern.
- JWT signing: managed entirely by Supabase.

### 9e. Logging Hygiene Rules — `pino` redact list

**Phase 1.1 — Category A.** Configure `pino` with the following redact
paths at boot:

```typescript
// src/shared/logger/pino.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'headers.authorization',
      'headers.cookie',
      '*.password',
      '*.api_key',
      '*.apiKey',
      '*.secret',
      'env.SUPABASE_SERVICE_ROLE_KEY',
      'env.ANTHROPIC_API_KEY',
      '*.bank_account_number',
      '*.tax_id',
      '*.sin',
      '*.card_number',
    ],
    censor: '[REDACTED]',
  },
});
```

**Verification (part of Phase 1.1 exit criteria):** intentionally log a
message containing `process.env.SUPABASE_SERVICE_ROLE_KEY`; confirm it
appears as `[REDACTED]` in the output.

Beyond redaction:
- Never log full JWT tokens
- Never log raw bank account numbers, SINs, tax IDs, or card numbers
- `audit_log` and `ai_actions` store entity IDs and references — never raw
  sensitive values
- Every log line must include `trace_id`, `org_id`, `user_id` where
  available

---

## Section 10 — Performance and Scale Notes

These are decisions that are painful to retrofit. Not premature optimization.

- **Index plan:** Section 2e is the source of truth. Every new service
  function query must be checked against the index list before merging.
- **Bulk operations:** All service functions that operate on multiple rows
  (`bulkCategorizeTransactions`, `bulkConfirmBillDrafts`) must accept arrays
  and execute a single transactional write. Never loop one at a time.
- **Transactional writes:** Every mutating service function runs inside a
  single Postgres transaction. Partial writes are not permitted. The
  `postJournalEntry` worked example (Section 3d) is the template.
- **Async / background work — Phase 2.** Phase 1 has none. pg-boss is
  installed in Phase 2 for: bank feed sync, OCR on uploaded receipts,
  recurring invoice generation, and the audit_log projection (Phase 2
  correction for Simplification 1).
- **N+1 avoidance:** List endpoints (bills, transactions, ai_actions) must
  eager-load related rows (vendor name, account name, org name) in a single
  query using Postgres JOINs. Never loop.
- **Caching:** Defer entirely. No Redis, no query caching in Phases 1–2.
  Flag as Phase 3+ when report generation becomes slow.

### 10c. Transaction Isolation Level (v0.5.3, D9)

**The default isolation level is READ COMMITTED** — Postgres's default,
and the level under which all integration tests and service functions
run unless explicitly overridden. The service layer does not elevate
to `SERIALIZABLE` because:

1. The v0.5.3 period lock trigger (Section 1d) takes a row-level lock
   on `fiscal_periods` via `SELECT ... FOR UPDATE`, which is the precise
   concurrency protection `SERIALIZABLE` would provide for the one case
   where it matters (race between a journal post and a period lock).
   Row locks are cheap; `SERIALIZABLE` is not.
2. The deferred constraint for debit=credit (Section 1d) runs at commit
   and is already transaction-scoped — isolation level does not change
   its semantics.
3. `SERIALIZABLE` in Postgres uses predicate locking (SSI) and can
   produce unpredictable `could not serialize access due to
   read/write dependencies` errors that the service layer would then
   have to retry. For a single-founder Phase 1 with low concurrency,
   this is cost without benefit.

**The rule is explicit:** Phase 1 mutating service functions run under
READ COMMITTED. They rely on row-level locks (`SELECT ... FOR UPDATE`)
at the specific points where write skew would otherwise occur — the
period lock trigger is the only such point in Phase 1. If a future
feature introduces another read-then-write pattern with cross-row
dependency (e.g., a "reserve the next invoice number in sequence"
path), the service function adds a row lock at that point, not a
blanket isolation bump.

**What `SERIALIZABLE` would catch that row locks do not:** nothing, in
Phase 1. In Phase 2 with concurrent AP batch ingestion, the decision
is revisited — but the default position remains READ COMMITTED with
targeted row locks, not `SERIALIZABLE` everywhere.

---

## Section 10a — Testing Strategy (Service Layer)

The **five** Category A integration tests (v0.5.5 — raised from three
after v0.5.3 added the service-middleware authorization test and v0.5.5
added the Q19 reversal mirror test) are the floor, not the ceiling. They
prove the invariants cannot be bypassed. They do not prove that the service
functions compute the right answer. Unit tests do that.

**What to unit-test and how:**
- **Service functions are the target.** Not components, not API routes,
  not tools. The service layer is where all business logic lives (Two
  Laws) so it is the only layer whose correctness matters at the unit
  level.
- **Do not mock the database with an in-memory fake.** Fakes drift from
  real Postgres behavior (deferred constraints, RLS, triggers). Run unit
  tests against a throwaway Supabase test schema that is reset between
  tests (`TRUNCATE ... CASCADE` in an `afterEach`). This is closer to a
  fast integration test than a classic unit test, and that is correct for
  this codebase.
- **Do mock the outside world.** Anthropic API calls, Flinks, Supabase
  Storage, email inbound — anything over the network is mocked at the
  module boundary, not inside the service function.
- **v0.5.5 (Q18) — Database connection is parameterized from day one.**
  Integration and unit tests read the Supabase URL and service-role
  key from environment variables (`SUPABASE_TEST_URL`,
  `SUPABASE_TEST_SERVICE_ROLE_KEY`) with a documented fallback chain:
  test-specific env vars first, then the normal `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`, then local Supabase defaults
  (`http://localhost:54321` and the fixed local dev key printed by
  `supabase status`). **No test file may hardcode
  `http://localhost:54321` or any local dev key.** This rule exists so
  that the Phase 1.3 switch from "local Supabase only" to "remote
  Supabase dev project" (Q18 resolution) is a config change — two
  new env vars in CI and in local `.env.test.local` — not a code
  change that touches every test file. A CI workflow added in
  Phase 1.1 grep-fails on any test file containing the literal
  string `localhost:54321`.
- **Coverage targets** (not enforced by CI in Phase 1, just a written
  expectation):
  - `journalEntryService.post` and its invariant helpers: **80%+**. This
    is the one function that writes money.
  - Other mutating services (`chartOfAccountsService.create`,
    `periodService.lock`): **60%+**.
  - Read-only services (list/get/search): smoke-test only — exercised
    indirectly by integration tests.
- **Test names are assertions, not descriptions.** `post_rejects_unbalanced_entry`,
  not `should reject unbalanced entries`. Grep-friendly and unambiguous
  when a test fails in CI logs.
- **Fixtures live with the test file,** not in a `__fixtures__` folder at
  the repo root. Locality beats DRY for test data.
- **What not to test:** Next.js route handlers, React components (other
  than the ProposedEntryCard snapshot in Phase 1.2), Supabase client
  initialization, environment config loading. These are either framework
  code or configuration — covered implicitly by the integration tests
  passing.

**Test file layout in Phase 1.1 (v0.5.5 — five-test Category A floor):**
```
src/services/journalEntry/
  journalEntryService.ts
  journalEntryService.test.ts               ← unit tests (Postgres-backed)
  types.ts
tests/integration/
  debit-credit-invariant.test.ts            ← Category A floor #1
  period-lock.test.ts                       ← Category A floor #2
  rls-cross-org.test.ts                     ← Category A floor #3
  service-middleware-authorization.test.ts  ← Category A floor #4 (v0.5.3, A3)
  reversal-mirror.test.ts                   ← Category A floor #5 (v0.5.5, Q19)
```

**Category A floor count history:** v0.5.0 established three tests.
v0.5.3 added the A3 middleware authorization test but left §7 and
§10a's counts at three — v0.5.5 propagates the correction. v0.5.5
adds the Q19 reversal mirror test, bringing the floor to five. The
floor is a minimum — additional tests live in
`tests/integration/` and in per-service `*.test.ts` files next to
the service under test.

---

## Section 10b — Unit Economics and Cost Model

Neither v0.4.0 nor v0.5.0 addressed cost. A founder aiming at unicorn
scale needs a rough cost baseline by the end of Phase 1, not by Phase 3
when the spend becomes visible on a monthly statement.

**The three recurring costs in Phase 1:**
1. **Supabase** — Free tier during Phase 1.1; Pro ($25 USD/month) once
   real financial data lands in Phase 1.3 (Pro includes daily backups,
   7-day PITR, higher storage, and `ca-central-1` availability).
2. **Vercel** — Hobby during Phase 1.1; Pro ($20 USD/user/month) once the
   Next.js app is sharing preview URLs with an outside reviewer (Phase
   1.2 external-validation session).
3. **Anthropic API (Claude)** — variable; entirely a function of how many
   agent interactions happen. No ceiling in Phase 1.2 (see Open Question
   12); measured per-entry throughout Phase 1.2 and Phase 1.3.

**What to measure and when:**
- **Phase 1.2 exit criterion 11** (added above) records Anthropic cost
  per agent-assisted journal entry. Collect at least 20 data points.
- **Phase 1.3 exit criterion 5** records Anthropic cost per closed
  month. This is the month-end unit cost that determines Phase 2 scope.
- **Supabase row count and storage** — check the Supabase dashboard once
  per week during Phase 1.3. If the free-tier row count is approached
  before Pro is enabled, that is itself a friction-journal entry.
- **Back-of-envelope Phase 1 monthly burn target:** under $100 USD all-in
  during Phase 1.1 and 1.2 (Supabase Free + Vercel Hobby + Claude API for
  20–50 entries/week). Crossing $100 in Phase 1.2 is a signal to recheck
  the agent's prompt-caching configuration and tool-call retry count
  (Open Question 13) — not necessarily to cut scope.
- **What this is not:** this is not a runway model, not a revenue
  forecast, not a pricing page. It is a *per-unit-of-accounting-work*
  cost baseline so that Phase 2 decisions (AP automation, OCR provider
  choice, bank feed frequency) can be priced against something real
  instead of intuition.

**One-line rule:** if you do not know, by end of Phase 1.3, the dollar
cost of posting one agent-assisted journal entry and the dollar cost of
closing one real month, Phase 1 is not done regardless of what the
integration tests say.

---

## Section 11 — Internationalization (i18n)

Day 1 requirement, not an afterthought.

- **`next-intl`** for all UI strings.
- All agent response text is **structured data**, not English prose. The
  agent returns `{template_id, params}` and the UI layer renders the
  localized string from the template. This is the only way to make the
  agent trilingual without retranslating every Claude output.
- URL structure: `/[locale]/[orgId]/...` from day one. Both `[locale]` and
  `[orgId]` in the path. (Bookmarks, deep links, redirects all
  org-aware.)
- Translation files: `messages/en.json`, `messages/fr.json`,
  `messages/zh-Hant.json`. Phase 1.1 populates `en.json`; the other two
  exist with the same key structure but empty/placeholder values.
- Agent system prompts include the user's `locale` and instruct Claude to
  return template IDs that have entries in all three locale files.
- Date and number formatting: `Intl.DateTimeFormat`, `Intl.NumberFormat`
  with the user's locale. Never hardcode date or currency formatting.
- **Traditional Mandarin note:** `zh-Hant`, not `zh-TW`. The `next-intl`
  config uses `zh-Hant` as the key.
- **v0.5.3 — placeholder locale fallback rule (A9).** Phase 1.1
  populates `messages/en.json` only. `messages/fr.json` and
  `messages/zh-Hant.json` exist with the same key structure but with
  **English fallback values cloned from `en.json`**, not empty strings
  and not missing keys. Empty strings render as blank UI; missing keys
  throw at runtime in `next-intl` dev mode and fall back to the raw
  `template_id` string in production. Neither is acceptable. The
  Phase 1.1 brief generates `fr.json` and `zh-Hant.json` by `cp en.json
  fr.json && cp en.json zh-Hant.json` as a baseline, and real French
  and Traditional Chinese strings replace the English values
  incrementally in later phases. **Every key in `en.json` must have a
  corresponding key in both other locale files, even if the value is
  still English** — this makes Phase 1.3 exit criterion #12 ("walk one
  non-English path end-to-end") meaningful instead of blocked on
  missing keys.

---

## Section 12 — Developer Onboarding

A new contributor (or future-you returning to the codebase after a break)
should be able to go from a clean laptop to a running local environment by
following this section alone.

### Prerequisites

- **Windows dev shell: WSL2, not native Windows** (v0.5.5, Q5 resolution).
  On Windows, the Phase 1.1 brief targets **Ubuntu 22.04 LTS on WSL2**
  as the actual dev shell. VS Code runs on the Windows host and
  connects to WSL2 via the Remote-WSL extension; `git`, `pnpm`,
  `nvm`, the Supabase CLI, and `supabase start`'s Docker containers
  all run inside WSL2. Native Windows is not supported for this
  project because (a) Docker Desktop file-watcher behavior on
  Windows NTFS produces phantom rebuilds and missed HMR events,
  (b) line-ending handling is a recurring low-value distraction,
  and (c) every shell command in this Bible and the Phase 1.1 brief
  is written for bash, not PowerShell. WSL2 makes all three
  non-issues at the cost of one setup step. **macOS and Linux
  developers skip this section** and install natively.
- Node.js v20+ (use `nvm` — `.nvmrc` is committed). On WSL2, install
  `nvm` inside the WSL2 shell, not on Windows.
- pnpm v9+ (`npm install -g pnpm`) — used for `pnpm dev` even though
  the repo is not a workspace in Phase 1; pnpm is faster than npm
- Supabase CLI. macOS: `brew install supabase/tap/supabase`. Linux
  and WSL2: download the latest release from the Supabase CLI
  GitHub releases page or use `npx supabase` as a transitional
  install. Native Windows: not supported — use WSL2 per the first
  bullet.
- Postman (runs on the Windows host for WSL2 developers; talks to
  `http://localhost:3000` which WSL2 forwards automatically)
- Anthropic API key (request from team lead)
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense,
  Supabase, and (on Windows) the **Remote-WSL** extension

### Step-by-Step Setup
1. `git clone [repo] && cd the-bridge`
2. `nvm use` (installs the Node version from `.nvmrc`)
3. `pnpm install`
4. `cp .env.example .env.local` and fill in all values
5. `pnpm db:start` (starts local Supabase: Postgres + Auth + Studio)
6. `pnpm db:migrate` (runs the initial schema migration)
7. `pnpm db:generate-types` (generates TypeScript types from the schema)
8. `pnpm db:seed` (creates the 2 dev orgs + 3 dev users)
9. `pnpm dev` (starts Next.js)
10. Open `http://localhost:3000` — sign in with one of the seed users
11. Open Postman → import `postman/collection.json` → set `base_url` to
    `http://localhost:3000`
12. Run "Health Check" — expect `{ status: "ok" }`

### Troubleshooting

**Wrong Node version.** `nvm use` should fix it. If nvm is not installed,
install it first.

**Boot-time env var assertion fires.** Read the error message; it names the
missing variable. Check `.env.local`. The two most commonly missing in
fresh setups are `SUPABASE_SERVICE_ROLE_KEY` (run `supabase status` to see
your local key — it changes every time you reset local Supabase) and
`ANTHROPIC_API_KEY` (request from the team lead).

**RLS blocking a query / empty result set.** **Suspect RLS first.** A
policy that silently returns empty result sets looks identical to "no data
exists" and the error message is unhelpful. See `docs/troubleshooting/rls.md`.
Check that the service is using the service-role client
(`src/db/adminClient.ts`), not the anon client. If you are in a server
component, you are correctly using the user-scoped client and RLS is
intentional — make sure the user has a `memberships` row for the org.

**Agent not responding.** Check that `ANTHROPIC_API_KEY` is set. Check the
pino logs for the trace ID and follow it through the orchestrator.
Click any Mainframe icon — if the manual paths still work, the issue is
isolated to the agent layer (the Mainframe degradation path is working as
designed).

**Deferred constraint not firing.** The most common cause is forgetting
the `DEFERRABLE INITIALLY DEFERRED` clause when recreating the constraint.
Read Section 1d.

### Contribution Conventions
- Branch naming: `feat/[ticket-id]-short-description`,
  `fix/[ticket-id]-description`
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- New service function → `src/services/[module]/[entity]Service.ts`
- New agent tool → `src/agent/tools/[toolName].ts`
- New Zod schema → `src/shared/schemas/[module]/[entity].schema.ts`, then
  imported by service, route handler, and form component
- Every PR: updated Postman collection (if API changed), updated Zod
  schemas (if data shape changed), migration file (if schema changed)
- **Direct database calls outside `src/services/` are rejected at code
  review.** No exceptions, no urgency override (Invariant 2 enforcement).

---

## Section 13 — What Not to Build (Commodity vs. Differentiation)

| Capability | Build or Buy? | Reason |
|---|---|---|
| OCR on invoice PDFs | Buy — AWS Textract or Google Document AI | Commodity |
| Bank feed connectivity | Buy — Flinks (Canada) | Bank relationships, regulation |
| Tax rate tables | Buy — Avalara or TaxJar (Phase 3+) | Compliance, not core IP |
| E-invoicing compliance | Buy if needed (Phase 4+) | Niche, jurisdictional |
| Email parsing | Build a thin wrapper using Postmark inbound or Gmail API | Simple, want pipeline control |
| Double-entry accounting logic | **Build** | This is core IP — own the journal |
| Agent orchestration | **Build** on Claude API | The agent behavior IS the product |
| Institutional memory / vendor rules | **Build** | Unique to multi-entity family office |
| Consolidated multi-entity reporting | **Build** | Off-the-shelf does not handle this |
| The Bridge UI | **Build** | This is the product's identity |

---

## Section 14 — Event Sourcing vs. CRUD + Audit (Resolved for v0.5.0)

**The question that was open in v0.4.0:** Should the accounting ledger be
event-sourced (append-only events projected into balances) or traditional CRUD
with an audit table?

**Resolved in v0.5.0. This section is a decision log, not an open question.**

**v0.5.0 resolution:**

**Phase 1: traditional CRUD with a strong audit table.** `journal_entries`
+ `journal_lines` are append-only by convention (no UPDATE or DELETE — RLS
policies enforce this; corrections are made via reversal entries, which is
IFRS-correct). The `audit_log` table captures every write, written
synchronously inside the same transaction (Simplification 1). The `events`
table exists with append-only trigger but is not written to (Simplification 2).

**Phase 2: hybrid migration.** The events table begins receiving writes.
The `audit_log` becomes a projection of events updated by pg-boss
post-commit. Both run in parallel; the historical `audit_log` rows are
backfilled into the events table by a one-time script.

**Phase 3+: full event sourcing as the source of truth** if query patterns
demand it. This is a deliberate decision to make later when there is real
data about query patterns, not a guess made now.

**Why not full event sourcing in Phase 1?** Operational complexity for a
solo non-developer. Projection management, snapshotting, and replay
infrastructure are not justifiable for ~100 users on Phase 1 traffic. The
schema reservations (events table, append-only trigger) make the Phase 2
migration mechanical. The Phase 1 audit_log is the right answer right now.

---

## Section 15 — Service Communication Contract Rules (v0.5.0 form)

This section was "Agent Communication Contract Rules" in v0.4.0. Renamed
because in Phase 1, the boundary that matters is the **service** boundary,
not the agent-to-service boundary (since agents collapse to services per
Simplification 3). The substance is unchanged; the wording reflects v0.5.0
reality.

### 15a. The Core Rule

**Every call into the service layer goes through a typed Zod-validated
input. The service layer never trusts its caller.** API route handlers
validate. Agent tools validate. Tests validate. The service function
itself re-validates at the boundary as defense-in-depth (the worked example
in Section 3d shows this).

In Phase 2, when the agent layer is reintroduced, this becomes "every
agent-to-service call goes through a typed command contract in
`packages/contracts/agent`." The Phase 1 form is the same rule applied at
the service boundary directly.

### 15b. The Five Rules of Service Communication

**Rule 1 — Typed Input Schemas Only.** Every service function input is a
Zod schema in `src/shared/schemas/`. No inline types, no `any`, no untyped
objects.

**Rule 2 — Validation at Both Ends.** The caller validates its outgoing
input; the service re-validates incoming input. Both ends validate. Neither
trusts the other.

**Rule 3 — Idempotency on Every Mutating Command.** Every service function
that writes to the database accepts an `idempotency_key` UUID (required for
agent source, optional for manual source). The service checks `ai_actions`
for an existing row with the same `(org_id, idempotency_key)` before doing
any work. See Section 8f.

**Rule 4 — No Free-Form Data at the Boundary.** What crosses into the
service layer must be:
- A UUID retrieved from the database (not a name a caller invented)
- A numeric amount validated by the schema (not inferred)
- An enum value from a closed set (not free-text)
- A date in ISO format (not "last Tuesday")

If a caller cannot produce a valid typed value for a required field, it
must fail or ask a clarifying question. It must not guess.

**Rule 5 — Trace ID on Every Call.** Every service function receives a
`ServiceContext` with `trace_id` (required), `org_id`, and `caller`. The
trace ID is generated when the user's intent first arrives (the Next.js
API route or the orchestrator) and propagates through every layer:
caller → service → database → audit_log → log line. Every layer logs the
trace_id. When something goes wrong, filter pino logs by `trace_id` to
reconstruct the path.

### 15c. The One Real Contract in Phase 1

`src/contracts/doubleEntry.contract.ts` — the `PostJournalEntryCommand`
schema with `_contract_version`, `trace_id`, `idempotency_key` as required
fields. This is the only file in `src/contracts/` in Phase 1. Phase 2
generalizes to a full three-namespace package once there are 5+ contracts
and the pattern is visible.

### 15d. Confidence Routing (Phase 2 — display only in Phase 1)

Confidence scoring is computed by the agent (Phase 2) using institutional
memory: vendor history match quality, amount within expected range, account
code consistency with past entries, intercompany flag consistency.

Phase 1: the `confidence` field exists on `ProposedEntryCard` and is
displayed. The `routing_path` field exists as a Category A reservation but
is unused.

Phase 2: confidence drives routing.

```
High confidence  → Standard AP Queue (AP specialist reviews and approves)
Medium confidence → Controller approval required before AP Queue
Low confidence   → Dual review: AP specialist + controller
Novel pattern    → Escalation: controller + CFO notification
```

The `routing_path` field on `ProposedEntryCard` carries the routing
decision. The orchestrator uses it to determine which queue receives the
card.

### 15e. Behavioral Invariants — Phase 1 enforcement layers

**Layer 1 — Database constraints and triggers (accounting math):**
- Deferred constraint: debit=credit per journal entry (Section 1d)
- Trigger: period not locked
- Trigger: events table append-only
- Constraints: `org_id` NOT NULL, line is debit XOR credit

**Layer 2 — Service middleware (`withInvariants()`):**
Wraps every service function. Pre-flight checks:
- ServiceContext carries a valid verified caller identity
- Command carries a valid `trace_id`
- Command carries an idempotency key (if mutating + source=agent)
- `org_id` in the command is consistent with the authenticated user's
  memberships
- **v0.5.3 (A3): `canUserPerformAction()` is invoked automatically by
  `withInvariants()` for every mutating service function.** The previous
  design relied on each service function to remember to call it. That
  is not good enough — a single forgotten call is a cross-tenant data
  breach because the service-role client bypasses RLS. The middleware
  now requires every wrapped service function to declare an
  `action: ActionName` in its registration, and `withInvariants()`
  calls `canUserPerformAction({ caller, org_id, action })` unconditionally
  before invoking the function body. A service function that mutates
  without being wrapped by `withInvariants()` is a build-time error
  enforced by a lint rule (`no-unwrapped-service-mutation`).

If any check fails, throws `InvariantViolationError` before touching the
database.

**v0.5.3 — test for the A3 middleware rule:** add a fourth integration
test to `tests/integration/` — `serviceMiddlewareAuthorization.test.ts` —
that calls `journalEntryService.post()` with a `ServiceContext` whose
`caller.user_id` has no membership in the target `org_id`. The
expected result is an `InvariantViolationError` thrown before any
database write occurs. The test asserts that no row exists in
`journal_entries` afterward and no row exists in `audit_log` — proving
the check runs before the transaction begins, not inside it.

**v0.5.5 (Q19) — Reversal mirror check.** Unlike the middleware
pre-flight checks above, this check lives inside
`journalEntryService.post`, not in `withInvariants()`, because
verifying a mirror requires loading the referenced entry from the
database — middleware cannot make arbitrary DB calls without breaking
the "pre-flight only" rule. The placement rule: `withInvariants()`
runs checks that can be answered from the command alone; inside-the-
service checks answer questions that need data the command does not
carry. The reversal mirror belongs in the second bucket. See §2b for
the invariant definition and §4h for the UI surface.

When the input has `reverses_journal_entry_id` populated,
`journalEntryService.post` runs this sequence **before** the BEGIN
transaction:

1. Load the referenced entry and all its lines by `journal_entry_id`.
2. Verify the referenced entry exists in the same `org_id` — cross-org
   reversal is impossible and rejected with
   `ServiceError('REVERSAL_CROSS_ORG', ...)`.
3. Verify line count matches. Partial reversals are Phase 2; a count
   mismatch is rejected with `REVERSAL_PARTIAL_NOT_SUPPORTED`.
4. For each line in the new entry, find a line in the referenced
   entry with the same `account_id`, `currency`, `amount_original`,
   `amount_cad`, `fx_rate`, and `tax_code_id` — and `debit_amount`
   and `credit_amount` **swapped**. If any line cannot be matched,
   reject with `REVERSAL_NOT_MIRROR` and include the offending line
   index in the error message.
5. Verify `reversal_reason` (on the new `journal_entries` row, not
   on `audit_log` — see §2a for placement rationale) is present and
   non-empty. The UI form (§4h) rejects empty; the service re-validates
   as defense-in-depth because the agent path in Phase 1.2 will bypass
   the form; the DB CHECK constraint
   (`reverses_journal_entry_id IS NULL OR (reversal_reason IS NOT NULL
   AND length(trim(reversal_reason)) > 0)`) catches anything that
   somehow reaches the INSERT. Three layers for the same rule.

The check runs before the transaction because rejecting upstream
costs less than rolling back a failed INSERT, and because rejection
must happen before the `audit_log` write so no audit row references
a reversal that did not happen. Integration test:
`tests/integration/reversal-mirror.test.ts` (§10a, Category A floor #5).
The test exercises every reject branch above plus the happy path.

**Layer 3 — Phase 2 only.** Event middleware that runs sequencing checks
inside the same transaction as the mutation. Phase 1 does not have this
layer because it does not write to the events table (Simplification 2).

### 15f. Ordering Rules — Phase 1 and Phase 2 Side by Side

The ordering of operations inside a mutating service call is the same shape
in Phase 1 and Phase 2. The differences are localized to three steps and are
called out below the diagrams. Read them side by side; the diff is what
matters.

**Phase 1 ordering** (current — uses synchronous audit log per Simplification 1,
events table not written per Simplification 2):

```
 1. API route or orchestrator builds ServiceContext with trace_id
 2. Zod parse input at the boundary (defense-in-depth)
 3. withInvariants() pre-flight checks run
 4. Idempotency check (if mutating and idempotency_key present)
 5. Authorization check (canUserPerformAction)
 6. Business pre-checks (period open, account exists, etc.)
 7. BEGIN transaction
 8.   INSERT journal_entries
 9.   INSERT journal_lines
10.   INSERT audit_log                       ← Simplification 1: synchronous
11.   INSERT ai_actions row (if source=agent)
12. COMMIT (deferred constraint runs here; ROLLBACK on imbalance)
13. Return result with canvas_directive
```

**Phase 2 ordering** (target — Simplifications 1 and 2 corrected; pg-boss
installed; events table receives writes; audit_log becomes a projection):

```
 1. API route or orchestrator builds ServiceContext with trace_id
 2. Zod parse input at the boundary (defense-in-depth)
 3. withInvariants() pre-flight checks run
 4. Idempotency check (if mutating and idempotency_key present)
 5. Authorization check (canUserPerformAction)
 6. Business pre-checks (period open, account exists, etc.)
 7. BEGIN transaction
 8.   INSERT journal_entries
 9.   INSERT journal_lines
10.   INSERT events (JournalEntryPostedEvent) ← Phase 2 correction (was: audit_log)
11.   INSERT ai_actions row (if source=agent)
12. COMMIT (deferred constraint runs here; ROLLBACK on imbalance)
13. Return result with canvas_directive
14. [POST-COMMIT, ASYNC] pg-boss subscriber reads new event
15. [POST-COMMIT, ASYNC] pg-boss writes audit_log projection from event
16. [POST-COMMIT, ASYNC] pg-boss updates GL balance projections
```

**The diff in three lines:**

| Step | Phase 1 | Phase 2 |
|---|---|---|
| 10 | INSERT audit_log (synchronous, in transaction) | INSERT events (synchronous, in transaction) |
| 14–15 | (do not exist) | pg-boss subscriber writes audit_log projection async |
| 16 | (do not exist) | pg-boss subscriber updates GL balance projections async |

**Atomicity guarantee in both phases:** Steps 1–12 are atomic. If any step in
1–12 fails, the entire transaction rolls back and nothing was written. The
deferred constraint runs at step 12 (COMMIT) and rolls back the entire
transaction if debits ≠ credits, regardless of which steps succeeded earlier.

**The Phase 2 reliability rule:** Steps 14–16 happen after commit and are
retried on failure by pg-boss. If a projection write fails, the event is
still in the events table (Layer 1 truth — Invariant 3) and can be replayed.
The projection eventually catches up. This is why the events table must be
the source of truth in Phase 2 — projections can lag, but they cannot
disagree with events for long, and they can always be rebuilt from events.

**The Phase 1 reliability rule:** Because there are no async steps, there is
no eventual consistency to manage. The cost is Simplification 1 — the audit
log is the primary record instead of a projection. The benefit is that there
is exactly one place a journal entry can exist after a successful POST: the
database, in a fully consistent state. No worker process to fail, no jobs to
retry, no projections to lag. This is the right trade-off for Phase 1
traffic and a solo founder operating the system.

---

## Section 16 — Documentation and Decision Tracking (v0.5.0 form)

v0.4.0 specified pre-populated ADRs ADR-001 through ADR-007 as Phase 0
deliverables. **v0.5.0 reverses this.** ADRs are written when decisions
are made in anger with real tradeoffs, not pre-populated as documentation
ceremony. Pre-populated ADRs become cargo-cult docs that rot.

### What Phase 1.1 creates:

**`docs/prompt-history/CHANGELOG.md`** — pre-populated with v0.1.0 through
v0.5.0, including what changed in each version and why. This is the master
version log of the architecture itself.

**`docs/prompt-history/v0.5.0-phase1-simplification.md`** — the milestone
note for v0.5.0 capturing the eight superseded decisions (see "Eight
v0.4.0 decisions formally superseded" in the version history at the top
of this document) and the reasoning.

**`docs/decisions/README.md`** — the ADR template only. No ADR-001
through ADR-NNN files. The README contains:

```markdown
# Architecture Decision Records

This folder will hold one ADR per major architectural decision as it is made.
ADRs are written in anger — when there is a real tradeoff with real options
and a real reason for choosing one over the others. ADRs are not written in
advance as documentation ceremony.

## When to write an ADR
- A decision that took more than 30 minutes to make
- A decision that closes off other options
- A decision a future contributor will reasonably ask "why?" about
- A decision that contradicts something in PLAN.md (in which case, also
  bump PLAN.md)

## Template
\`\`\`
# ADR-NNN: [Decision Title]
## Status: Accepted | Superseded by ADR-MMM | Deprecated
## Date: YYYY-MM-DD
## Context: [What problem needed solving and what constraints apply]
## Decision: [What was decided in one or two sentences]
## Consequences: [What this enables and what it constrains]
## Alternatives considered: [What was rejected and why]
## Triggered by: [Which conversation, PR, or incident prompted this]
\`\`\`
```

**`docs/troubleshooting/rls.md`** — the "suspect RLS first" guide for
debugging empty result sets that look like missing data.

**`docs/phase1.3-friction.md`** — created empty in Phase 1.1, populated
during Phase 1.3 (the Reality Check phase).

### What Phase 1.1 does NOT create:
- ADR-001 through ADR-NNN files (written organically during Phase 1.1
  and 1.2 as real decisions are made)
- Pre-built Layer 3 workflow agent stubs
- Empty interface files for Phase 2+ features beyond the ones explicitly
  required (canvas directive types and the contracts file)

---

## Section 17 — Phase 1.2 Decisions Deferred to the Phase 1.2 Brief

These are decisions the Bible deliberately does not pre-resolve **and that
do not belong in Open Questions either** — they are implementation-detail
decisions that the Phase 1.2 Execution Brief will resolve once Phase 1.1 is
done and there is real implementation experience to draw on.

The seven decisions that v0.5.0 had defaulted silently here have been
**promoted to Section 18 — Open Questions** in v0.5.1, because their
defaults were mine, not the founder's, and they are foundational enough
that they should be made explicitly before the Phase 1.1 brief is written.

| Decision | Why it stays in this section |
|---|---|
| **Exact Claude model selection** (Sonnet 4.5 vs Sonnet 4 vs Haiku for orchestrator) | Depends on prompt-caching cost data we cannot have until Phase 1.2 begins. The Phase 1.2 brief picks a starting model and sets a measurement plan. |
| **Prompt caching configuration details** (which prompt segments to cache, cache TTL) | Anthropic prompt caching is a Phase 1.2 day-1 default, but the exact segmentation depends on the final system prompt structure, which depends on persona prompts written during Phase 1.2. |
| **Persona prompt content for Controller and AP Specialist** in Phase 1.2 | The prompts exist in the Phase 1.2 brief, not the Bible. They are tuned during Phase 1.2 development. |
| **Tool-call retry backoff** (immediate retry vs 1s delay vs exponential) | Depends on observed Claude API behavior. The Phase 1.2 brief picks an initial value and adjusts based on Phase 1.3 friction. |

Everything else that v0.5.0 had in this section has been moved to Open
Questions for the founder to resolve before Phase 1.1 begins.

---

## Section 18 — Open Questions

These are gaps and ambiguities that I (Claude, drafting v0.5.1) want the
founder to resolve before the Phase 1.1 brief is written. Each has a
proposed resolution, but **the proposed resolution is mine, not yours** —
silently inheriting any of these defaults would violate the "zero
reasonable assumptions" rule.

The 19 questions are grouped into three categories:
- **Section 18a — Founder data and environment** (Questions 1–10): things
  only the founder knows, like which orgs and which months
- **Section 18b — Architectural decisions promoted from Section 17 in v0.5.1**
  (Questions 11–17): decisions v0.5.0 had defaulted silently in Section 17;
  promoted in v0.5.1 because they are foundational, not Phase 1.2 details
- **Section 18c — Architectural gaps not previously surfaced** (Questions
  18–19): genuine architectural questions the v0.5.0 review missed

### Section 18a — Founder Data and Environment

1. **Which two CoA templates are seeded in Phase 1.1?** I have assumed
   "holding company" and "real estate" based on the v0.4.0 spec mentioning
   them as the founder's likely first orgs. **Confirm** these are the two
   the founder will create real orgs for, or name the correct two.

   **RESOLVED v0.5.5:** `holding_company` + `real_estate`. These are
   the two industry CoA templates seeded in the Phase 1.1 initial
   migration; the other four templates (healthcare, hospitality,
   trading, restaurant) stay unseeded until Phase 1.3 or Phase 2 per
   the A/B/C table. The two orgs the founder creates in Phase 1.1
   exit criterion #6 use these templates.

2. **Which Canadian provinces' tax rates are seeded in Phase 1.1?** The
   `tax_codes` table is Category A. Phase 1.1 needs concrete seed rows.
   I have assumed federal GST plus the provinces where the founder's
   actual entities operate. **Specify which provinces.**

   **RESOLVED v0.5.5:** British Columbia. Seed rows for Phase 1.1:
   federal GST (5%, jurisdiction `CA`) and BC provincial sales tax
   PST_BC (7%, jurisdiction `CA-BC`). **BC uses GST + PST as two
   separate taxes, not HST** — BC had HST from 2010 to 2013 and
   reverted via referendum, so the seed does not include an HST_BC
   row. Additional provincial rows (HST_ON, HST_NS, HST_NB, HST_NL,
   HST_PE, QST, PST_SK, PST_MB) are added as new orgs are created in
   those provinces — not preemptively. Effective-from dates on all
   seed rows match the currently-in-force Canadian federal and BC
   rates as of the v0.5.5 commit date; historical rate rows are not
   seeded.

3. **Which real calendar month is targeted for Phase 1.3?** Phase 1.3
   exit criterion #1 is "close one real month for one real org." The
   month must be chosen before Phase 1.2 finishes so the data is being
   collected as Phase 1.2 work proceeds. **Specify which org and which
   month.**

4. **Vercel + Supabase deployment region.** Canadian data residency may
   matter for the family office. Supabase offers Canadian regions
   (`ca-central-1`). Vercel offers regional deployment. **Confirm
   `ca-central-1` for Supabase and the appropriate Vercel region.**

   **RESOLVED v0.5.5:** Confirmed. Supabase `ca-central-1` (Toronto),
   Vercel `yul1` (Montreal). Founder accepts §9a.0 as a hard
   constraint, not a founder choice. Phase 1.1 exit criterion #15
   (v0.5.3) remains the enforcement point — a US-region deployment is
   a Phase 1.1 failure regardless of other criteria.

5. **Local development OS.** This affects the Supabase CLI install
   command in Section 12 and the line endings convention. **Confirm
   macOS, Linux, or Windows.**

   **RESOLVED v0.5.5:** Windows host + WSL2 (Ubuntu 22.04 LTS) as
   the actual dev shell. VS Code runs on the Windows host and
   connects into WSL2 via the Remote-WSL extension; all
   bash/git/pnpm/nvm/Docker work happens inside WSL2. **Native
   Windows is explicitly not supported** because Docker Desktop
   file-watcher behavior on NTFS produces phantom rebuilds and
   missed HMR events, line-ending handling is a recurring
   low-value distraction, and every shell command in this Bible
   and the Phase 1.1 brief is written for bash, not PowerShell.
   §12 Prerequisites is updated in v0.5.5 to reflect the WSL2
   targeting.

6. **The two real users for Phase 1.1 testing.** The seed script creates
   3 dev users. The two real users in Phase 1.1 exit criterion #7 are
   different — they are real human users with real Supabase Auth
   accounts. **Confirm whether the founder wants to use real email
   addresses for these or test addresses initially.**

7. **Source control hosting.** Assumed GitHub from v0.4.0 spec. **Confirm.**

   **RESOLVED v0.5.5:** GitHub. CI is GitHub Actions. Repository
   URL conventions, the grep-fail CI check from Q18, and every
   shell example in §12 and the Phase 1.1 brief assume GitHub.

8. **Backup and restore strategy for the local Supabase database.**
   Phase 1.3 uses the system for real bookkeeping. The local Supabase
   database holding real financial data needs a backup story before
   Phase 1.3 begins. **Decide:** rely on remote Supabase backups (means
   running against remote, not local, in Phase 1.3) or document a manual
   `pg_dump` cadence. Recommend: switch to remote Supabase for Phase 1.3.

9. **`zod-to-json-schema` package for the agent tool definition.** The
   worked example in Section 3c uses this to convert Zod schemas to
   Claude's tool input schema format. **Confirm willingness to add this
   dependency** or specify an alternative (write JSON schemas by hand).

   **RESOLVED v0.5.5:** Yes — add `zod-to-json-schema`. Pin the
   version in `package.json` and treat major-version bumps as
   explicit decisions requiring an ADR. The drift risk of
   hand-written JSON schemas is unacceptable for a safety-critical
   agent tool layer: Invariant 6 ("no free-form data at service
   boundaries") exists precisely to keep the agent boundary typed
   and Zod-validated, and hand-writing the same schema twice in two
   formats is exactly the drift that invariant exists to prevent.
   **ADR material:** capture this reasoning verbatim when
   `zod-to-json-schema` is added to `package.json` in Phase 1.2,
   including the alternative (hand-written JSON schemas) and why it
   was rejected. The ADR also names the update rule: major-version
   bumps require a decision entry; minor/patch bumps do not.

10. **Dev seed users — auth flow.** Supabase Auth requires real signup or
    admin-API user creation. The seed script needs to create users via
    the Supabase admin API, not via SQL directly (Supabase Auth manages
    its own tables). **Confirm this approach.**

    **RESOLVED v0.5.5:** Yes — Supabase admin API. The seed script
    changes from `devUsers.sql` to `devUsers.ts` (TypeScript, run via
    `tsx`). Memberships rows may stay SQL and run as a second step,
    or be inserted via the Supabase client inside the TypeScript
    script — either is acceptable; the Phase 1.1 brief picks one.
    **Part 1 edits:** §1a folder tree updated; §1b `db:seed` script
    command updated from `psql -f ... .sql` to `tsx ... .ts`.
    `tsx` is added as a dev dependency.

### Section 18b — Architectural Decisions Promoted from Section 17 in v0.5.1

These were defaulted silently in v0.5.0's Section 17. v0.5.1 promotes them
to Open Questions because their defaults are foundational enough that they
should be the founder's call, not mine.

11. **Claude API failure handling UX — what does the user see?**
    My default: chat panel shows an explicit "agent unavailable — retry"
    state with a Retry button; the Mainframe remains fully functional so
    every Phase 1 task can still be completed via the manual path. The
    failure state is a banner, not a modal — it does not block other
    workspace actions. **Confirm or specify alternative.**

12. **Cost budget per agent interaction — what is the ceiling?**
    My default: no hard ceiling in Phase 1.2; measure per-entry cost in
    Phase 1.3 and set a ceiling in Phase 2 informed by real data. Starting
    model: Claude Sonnet for orchestrator, prompt caching on, structured
    responses only. **Confirm "measure first, ceiling later" approach, or
    specify a Phase 1.2 hard ceiling.**

13. **Tool-call validation retry policy — how many retries?**
    My default: bounded retry, **max 2 attempts**, with the validation
    error fed back to Claude as a clarification message. After 2 failures,
    surface a clarification question to the user instead of retrying
    further. **Confirm 2, or specify 1 or 3.**

14. **Streaming vs batch agent responses in Phase 1.2.**
    My default: **batch** in Phase 1.2 (simpler — one round-trip per user
    message; the UI renders the complete response after the agent
    finishes). Phase 2 introduces streaming for UX. **Confirm batch in
    Phase 1.2, or specify streaming from day one.**

15. **AgentSession TTL and cleanup mechanism.**
    My default: **30-day TTL**. Cleanup is a manual SQL script in Phase 1
    (no pg-boss available); Phase 2 promotes it to a scheduled pg-boss
    job. **Confirm 30 days, or specify a different TTL.**

16. **Persona prompt scope for Executive in Phase 1.2.**
    Most CFO functionality (consolidated reporting, runway modeling,
    variance analysis) is Phase 3+. My default: the Executive persona
    exists in Phase 1.2 with a system prompt that says "I can help you
    look at any of your entities' P&L and chart of accounts; consolidated
    views are coming in Phase 3." Tools available: `listChartOfAccounts`,
    `checkPeriod`, and read-only journal entry queries. **No mutating
    tools** for the Executive persona in Phase 1.2 — Executives do not
    post journal entries directly. **Confirm this scope.**

17. **Data export / audit package — when does this become urgent?**
    IFRS and Canadian regulatory compliance both require data portability.
    My default: Phase 1.3 friction journal will tell us when this becomes
    urgent; the Phase 2 brief addresses it formally. The Bible flags it as
    a known long-term requirement. **Confirm "wait for Phase 1.3 to
    inform," or specify that a basic CSV export is required by end of
    Phase 1.2.**

### Section 18c — Architectural Gaps Not Previously Surfaced

18. **CI/CD database target — local Supabase or remote dev project?**
    Question 8 above asks about Phase 1.3 hosting. This question is
    different: it asks where automated tests run during Phase 1.1 and 1.2
    development. Two options:
    - **(a) Local Supabase only** — every developer runs `supabase start`
      and tests run against `localhost`. CI runs `supabase start` in a
      GitHub Actions container. Faster iteration; no remote dependency.
    - **(b) Remote dev project** — a shared Supabase dev project that
      everyone (and CI) connects to. Closer to production; harder to
      iterate fast on schema changes; requires environment isolation.
    My default: **(a) local-only for Phase 1.1, switch to (b) for Phase
    1.3** when real data starts going in. **Confirm or specify alternative.**

    **RESOLVED v0.5.5:** Accept the default. (a) local-only Supabase
    for Phase 1.1 and Phase 1.2; switch to (b) remote Supabase dev
    project for Phase 1.3. **Non-negotiable requirement added in
    v0.5.5:** the integration test setup is parameterized by
    `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY`
    environment variables from day one. **No test file may hardcode
    `http://localhost:54321` or any local dev key.** A CI grep-fail
    check runs in Phase 1.1 onward. The Phase 1.3 switch is a config
    change — two env vars in CI and in `.env.test.local` — not a
    code change that touches test files. See §10a for the full
    parameterization rule.

19. **Reversal entry mechanism — how is a wrong entry corrected?**
    Section 14 says "corrections are made via reversal entries (which is
    IFRS-correct)" but **the schema and workflow for creating a reversal
    are not specified anywhere**. This is a real Phase 1.1 question because
    the moment a user posts a wrong entry, they need a way to reverse it,
    and reversal is the only legal path (no UPDATE/DELETE on
    `journal_entries`). My proposed Phase 1.1 design:
    - Add nullable column `reverses_journal_entry_id` (UUID FK to
      `journal_entries`, self-referential) on `journal_entries` — cheap
      Category A reservation
    - A reversal entry is a normal journal entry with this column populated
      and `lines` that mirror the original entry with debits and credits
      swapped
    - The UI for "reverse this entry" prefills a new journal entry form
      with the swapped lines and the reverses link populated
    - The deferred constraint validates the reversal the same way as any
      other entry (debit=credit must hold)
    - Phase 1.1 includes this in the schema and the manual path; Phase 1.2
      adds a `reverseJournalEntry` agent tool that does the same thing
      conversationally
    **Confirm this design**, or specify an alternative reversal mechanism.

    **RESOLVED v0.5.5:** Accept the proposed design with three
    explicit additions — every addition ships in Phase 1.1, not
    deferred:

    **(1) Service-layer mirror check, mandatory in Phase 1.1 with
    a dedicated integration test.** When `reverses_journal_entry_id`
    is populated, `journalEntryService.post` loads the referenced
    entry, verifies same-`org_id`, verifies line count matches (no
    partial reversals in Phase 1), and verifies every line in the
    new entry mirrors a line in the referenced entry with
    `debit_amount` and `credit_amount` swapped and all other fields
    (account_id, currency, amount_original, amount_cad, fx_rate,
    tax_code_id) unchanged. Hard reject with one of
    `REVERSAL_CROSS_ORG` / `REVERSAL_PARTIAL_NOT_SUPPORTED` /
    `REVERSAL_NOT_MIRROR` if any check fails. The sequence runs
    **before** `BEGIN` so rejection never produces a rollback or an
    audit row for a non-event. Full procedure in §15e Layer 2;
    invariant row in §2b; integration test at
    `tests/integration/reversal-mirror.test.ts` (Category A floor #5,
    see §10a).

    **(2) Period gap banner in the reversal UI, mandatory,
    non-dismissible.** When the auto-assigned reversal period differs
    from the original entry's period, the reversal form surfaces a
    warning banner at the top of the canvas, restating both period
    labels by name. *"You are reversing a March 2026 entry into
    April 2026. The reversal will appear in April 2026, not in the
    original period, because March 2026 is closed. Verify this is
    the behaviour you want before posting."* Styled as a warning,
    not an error — the action is legal — but the user must
    understand the period mismatch before committing. See §4h for
    the full UI specification.

    **(3) `reversal_reason` text column on `journal_entries`,
    required non-empty on every reversal entry, enforced by a DB
    CHECK constraint.** A nullable `text` column added to
    `journal_entries` in §2a. The reversal UI has a required
    multiline `reversal_reason` field (§4h); blank values are
    rejected at the form layer, re-validated at the service layer
    (§15e step 5), and enforced at the database layer by a CHECK
    constraint conditional on `reverses_journal_entry_id` being
    populated. Three layers for the same rule. This captures *why*
    the reversal was posted ("vendor misclassified," "duplicate of
    entry #12345," "wrong amount, FX rate corrected") — the story
    auditors care about, distinct from the structural FK link on
    `journal_entries.reverses_journal_entry_id`.

    **Placement rationale and history (this is the load-bearing
    call Q19 produced — read carefully if considering moving it).**
    The v0.5.5 first draft placed this column on `audit_log`
    because the founder's Q19 wording was "the audit log captures a
    reversal_reason text field." Claude made the literal placement,
    surfaced the trade-off explicitly as a veto point with both
    alternatives documented in §2a, and the founder reconsidered
    within the same v0.5.5 cycle. The corrected wording is "the
    audit *trail* captures," where the trail is the broader concept
    that includes `journal_entries` columns alongside `audit_log`
    rows. The trail and the log are different things. Two reasons
    the column belongs on `journal_entries`:

    1. **Semantic fit.** The reason is a property of the reversal
       entry itself, not of the mutation record that created it.
       `audit_log` is a generic mutation log; once you start adding
       domain-specific columns there (`invoice_void_reason`,
       `payment_reversal_reason`, ...), the table loses its
       meaning as a generic record.
    2. **Query shape.** "Show me all reversals and why" becomes a
       single-table self-join on `journal_entries` (matching
       reversals to their originals) rather than a join through
       `audit_log` filtered by `action` type. The self-join is
       simpler, faster, and does not depend on `audit_log`'s Phase
       1→Phase 2 projection evolution (§2a audit_log note,
       Simplification 1).

    This reasoning — including the "audit log vs audit trail"
    distinction — is ADR-001 material and will be captured verbatim
    in `docs/decisions/0001-reversal-semantics.md` during the step-5
    split. The Bible keeps the full rationale inline in §2a so a
    future reader considering moving the column again sees the
    tradeoff without having to dig into the ADR folder.

    **Explicitly deferred to Phase 2 (confirmed by Q19 resolution):**
    - **Partial reversals** (reversing only some lines of a
      multi-line entry). The schema does not preclude them, but the
      Phase 1.1 mirror check assumes full mirror and the UI has no
      partial-selection affordance.
    - **Reversal-of-reversal chain visualization.** Phase 1.1 permits
      reversing a reversal (it's just another entry with
      `reverses_journal_entry_id` pointing at the reversal), but no
      UI visualizes the chain. Phase 2 adds a reversal-chain view.
    - **Automatic period-end reversals** (accrual reversal pattern).
      Phase 2 introduces the schedule; Phase 1.1 has no automatic
      reversal.

    **ADR-001 seed material.** The reasoning above — the three
    additions, why each ships in Phase 1.1, the `audit_log` vs
    `journal_entries` placement call, and the explicit Phase 2
    deferrals — is the content of ADR-001 and will be written
    verbatim into `docs/decisions/0001-reversal-semantics.md` after
    the split, per the step-5 plan. Capture the reasoning *as
    written here*, not paraphrased.

    **Part 1 edits produced by this resolution:**
    - §2a `journal_entries`: add `reverses_journal_entry_id` column
      AND `reversal_reason` column (the second moved from
      `audit_log` during the same v0.5.5 cycle after founder
      reconsideration — see (3) above)
    - §2a `audit_log`: unchanged in final shape — a short
      explanatory note preserves the history of the brief migration
      so future readers see why `reversal_reason` is not there
    - §2b: add reversal mirror invariant row (service-layer)
    - §2e: add reversal lookup partial index
    - §4h: new subsection for reversal UI (launch point, prefill,
      period gap banner, reversal_reason field, Phase 2 deferrals)
    - §7 Phase 1.1 "What is built": add reversal path bullet
    - §7 Phase 1.1 exit criterion #3: bump from three to five
      integration tests
    - §10a test file layout: add `reversal-mirror.test.ts` and
      `service-middleware-authorization.test.ts` (the latter
      propagates the v0.5.3 count correction that was never pushed
      into §10a)
    - §15e Layer 2: add the full reversal mirror check procedure,
      including step 5 pointing at `journal_entries.reversal_reason`

### Section 18d — Founder Decisions Checklist (One-Page View)

Print this, fill it in, commit it as `docs/decisions/founder-answers-v0.5.1.md`.
Every row must have an explicit answer before the Phase 1.1 brief is written.
"Default" means the row stays silent today; that is not allowed anymore.

| # | Question | Your answer | Impacts |
|---|---|---|---|
| 1 | Which two CoA templates for Phase 1.1? | **v0.5.5: holding_company + real_estate** | Seed data in `001_initial_schema.sql` |
| 2 | Which provinces' tax codes? | **v0.5.5: BC → federal GST (5%) + PST_BC (7%); not HST** | `tax_codes` seed rows |
| 3 | Which org + month for Phase 1.3 close? | _still open — not in step-2 unblock set_ | Real-data collection during Phase 1.2 |
| 4 | Supabase region (`ca-central-1`?) + Vercel region | **v0.5.5: Supabase `ca-central-1`, Vercel `yul1`; §9a.0 accepted as hard constraint** | Data residency; provisioning |
| 5 | Local dev OS (macOS / Linux / Windows) | **v0.5.5: Windows host + WSL2 (Ubuntu 22.04 LTS); native Windows not supported** | Supabase CLI install; line endings |
| 6 | Real-email or test-email accounts for Phase 1.1 users | _still open — not in step-2 unblock set_ | Auth flow testing |
| 7 | Source control host (GitHub?) | **v0.5.5: GitHub; CI is GitHub Actions** | CI configuration |
| 8 | Phase 1.3 DB: remote Supabase or local `pg_dump` cadence | _still open — not in step-2 unblock set_ | Backup story for real financial data |
| 9 | Add `zod-to-json-schema` dependency? | **v0.5.5: yes, pinned; major bumps require ADR; ADR-TBD material** | Agent tool schema conversion (Section 3c) |
| 10 | Seed users via Supabase admin API? | **v0.5.5: yes; `devUsers.sql` → `devUsers.ts`; `tsx` added as dev dependency** | Seed script design |
| 11 | Claude API failure UX: banner + Retry? | _still open — not in step-2 unblock set_ | Mainframe degradation path |
| 12 | Agent cost ceiling in Phase 1.2: measure-first? | _still open — not in step-2 unblock set_ | Cost budget; model choice |
| 13 | Tool-call retry count (1 / 2 / 3) | _still open — not in step-2 unblock set_ | Agent orchestrator retry policy |
| 14 | Streaming or batch agent responses in Phase 1.2 | _still open — not in step-2 unblock set_ | Agent UI rendering path |
| 15 | AgentSession TTL (default 30 days) | _still open — not in step-2 unblock set_ | Session cleanup script |
| 16 | Executive persona scope in Phase 1.2 | _still open — not in step-2 unblock set_ | Persona prompts; tool whitelist |
| 17 | Data export / audit package urgency | _still open — not in step-2 unblock set_ | Phase 1.2 vs Phase 2 scope |
| 18 | CI/CD DB target (local / remote dev project) | **v0.5.5: (a) local for 1.1/1.2, (b) remote for 1.3; tests parameterized by SUPABASE_TEST_URL from day one; CI grep-fails hardcoded localhost** | Test harness; CI config |
| 19 | Reversal entry mechanism (confirm proposed design?) | **v0.5.5: accepted with three additions — service-layer mirror check (mandatory P1.1), period gap banner in UI, `reversal_reason` on `journal_entries` (migrated from `audit_log` mid-cycle after founder reconsideration — see §18c.19 RESOLVED for full rationale); Phase 2 defers partial reversals, chain UI, auto period-end reversals; ADR-001 seed material** | `journal_entries` schema (two new columns: `reverses_journal_entry_id` + `reversal_reason` with a conditional CHECK), + §4h UI spec, + §15e Layer 2 with full procedure, + §10a Category A floor test #5 |

**Rule:** no answer is "I'll decide later." Either you pick the value or you
accept my default explicitly. Silent inheritance is what v0.5.1 exists to stop.

---

**Summary of what I need from you to write the Phase 1.1 Execution Brief:**

The Phase 1.1 brief depends on Questions 1, 2, 4, 5, 7, 9, 10, 18, and 19.
The other questions (3, 6, 8, 11–17) can be answered before the Phase 1.2
brief and do not block Phase 1.1.

So the **minimum unblock set** is: 1, 2, 4, 5, 7, 9, 10, 18, 19.

---

## End of Part 1 — Architecture Bible

**Part 1 of PLAN.md ends here.** This is the long-term north star. It is
consulted, not executed. It is updated when major decisions change (next
expected revision is v0.6.0 after Phase 1.3 triage).

**Phase Execution Briefs (formerly Part 2) now live under `docs/specs/`**
(v0.5.6 — step-5 split). Part 2 was extracted from this file on
2026-04-11 once the founder answers for §18's minimum-unblock set had
landed and the Bible was internally consistent. The briefs are one
file per phase:

- **`docs/specs/phase-1.1.md`** — The foundation brief: database schema,
  multi-org auth, RLS, UI shell, the five Category A integration tests
  (including the v0.5.5 reversal mirror test), the richer two-script
  seed split (`db:seed:auth` + `db:seed`), and the Phase 1.1 exit
  criteria checklist. This brief carries the Q1–Q19 founder answers
  inline as confirmed state, not as assumptions.
- **`docs/specs/phase-1.2.md`** — *(not yet written)* The agent brief:
  orchestrator, tool definitions, ProposedEntryCard, canvas context
  injection. Written after Phase 1.1 exit criteria pass so that real
  implementation experience informs the brief.
- **`docs/specs/phase-1.3.md`** — *(not yet written)* The Reality
  Check brief: close one real month of books for one real org.
  Written after Phase 1.2 ships.

**Architecture Decision Records live under `docs/decisions/`.** The
first, `0001-reversal-semantics.md`, was written during the step-5
split from §18c.19 RESOLVED verbatim — it captures the Q19 reversal
mechanism and the mid-cycle `audit_log` → `journal_entries` placement
migration. Future ADRs are written in anger per §16, not preemptively.

**Standing rules loaded every session live in `CLAUDE.md`** at the
repo root. `CLAUDE.md` is derived from §0, §1d, §2b, §3a, §5c, §15,
and the Critical Architectural Invariants, filtered by the
throwaway-work test. It is under 200 lines by design. When Claude
Code starts a session, `CLAUDE.md` is what it reads; `PLAN.md` is
only pulled in for work that needs the *why*.

**What `PLAN.md` still contains (as of v0.5.5):** Part 1 only — the
Architecture Bible. §0 through §18d. This file is the *why* and
the *decisions*, not the *what* or the *how*.

---

### Section 18d — Decisions Recorded During Phase 1.1 Implementation

20. **Minimal `journalEntryService.post()` stub landed in Phase 1.1
    despite the spec saying "Phase 1.2."** The Phase 1.1 exit criteria
    (§14, CLAUDE.md "What done means" item 2) require all five Category A
    integration tests passing. Tests 4 (service middleware authorization)
    and 5 (reversal mirror) both exercise `journalEntryService.post()`
    through `withInvariants()`. The spec's folder structure (§3 line 235)
    says "journalEntryService.ts is created in Phase 1.2, not 1.1" — a
    contradiction.

    **RESOLVED 2026-04-12:** Implement a minimal stub in Phase 1.1 —
    just enough to satisfy the invariants and reversal-mirror tests
    (balanced check, period lock check, insert + mirror on reversal).
    Richer features (idempotency keys, attachments, approval workflow)
    are deferred to Phase 1.2. The stub is NOT wired to any UI in
    Phase 1.1; `ProposedEntryCard` stays a shell. The tests exercise
    the service directly. This unblocks the tests without scope creep,
    and the tests guard the stub as it grows in Phase 1.2.

*End of PLAN.md — Architecture Bible v0.5.6*



---

