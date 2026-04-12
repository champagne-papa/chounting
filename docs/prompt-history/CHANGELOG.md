# PLAN.md Changelog

Full changelog for `PLAN.md` — the Architecture Bible for The Bridge.
Each entry names the version, the review that produced it, and every
finding resolved. The canonical condensed version history lives at the
top of Part 1 of `PLAN.md`; this file is the expanded form for audit
and post-hoc review.

---

## v0.5.4 — Phase 1.2 Canvas Context Injection

**Origin:** Founder-initiated scope decision after review of the Phase
1.2 canvas story. The argument: the minimal version of bidirectional
canvas context (canvas → chat, not just chat → canvas) must land in
Phase 1.2 alongside the initial agent build, not in Phase 2 alongside
the AP Agent. If it slips to Phase 2, the Phase 1.3 real-user test
happens on a split-screen UI where the chat and canvas feel like two
unconnected panes — which is the exact failure mode the product is
supposed to solve structurally. A hard-no trust classification for UX
disconnection is the wrong reason to fail Phase 1.3.

**What changed:**

| Bible section | Change |
|---|---|
| Version header | v0.5.3 → v0.5.4 |
| Version history block | New v0.5.4 entry (condensed form) |
| §4g Canvas Context Injection | **New section.** Defines the `CanvasContext` type, the two Phase 1.2 selection types (`journal_entry`, `account`), the client-ephemeral rule, the subordinate-context framing principle, the in-place edit to Phase 1.1 components in Phase 1.2, and the explicit list of what Phase 2 still owns. |
| §5b The Orchestrator | `handleUserMessage` input extended with optional `canvas_context?: CanvasContext`; `buildSystemPrompt()` signature extended to take canvas_context. |
| §5c Anti-Hallucination Rules | New rule: canvas context is reference material only, never a substitute for tool-retrieved data. The agent may use selection to resolve ambiguous references but must still call tools for financial facts. |
| §7 Phase 1.2 "What is built" | Added the three v0.5.4 components (type, Zustand selector, click handlers on two canvas components) plus the two wirings (orchestrator input field, system-prompt block). |
| §7 Phase 1.2 Exit Criteria | New criterion #19 — three-scenario over-anchoring test. (a) clicked entry + ambiguous question → uses selection; (b) clicked entry + explicit reference to different entry → follows explicit reference, does not anchor; (c) no click + ambiguous question → asks clarification. All three must pass on the same system-prompt configuration. |
| §7 Phase 2 expectations | "Bidirectional canvas state" line expanded into an explicit list of what Phase 2 still owns after v0.5.4 lands: hover states, action bar, multi-selection, canvas tabs, P&L drill-down, persistent-across-navigation selection, and additional selection types. |
| Part 2 Phase 1.1 Brief §3 | Folder tree gets `src/shared/types/canvasContext.ts` added, empty of consumers in Phase 1.1 so the Phase 1.2 wiring is purely additive. |

**Explicitly NOT changed:**

- No `001_initial_schema.sql` changes. Canvas context is a runtime
  TypeScript/Zustand concern with no SQL footprint.
- No v0.5.3 finding is re-opened or revised.
- No new Open Question. The three sharpenings (scope to two row
  types, over-anchoring test, client-ephemeral rule) are decisions
  made now, in the Bible, not deferred.

**Scope decisions made and documented:**

1. **Only two selection types in Phase 1.2:** `journal_entry`
   (from journal entry list view) and `account` (from CoA view).
   P&L drill-down is explicitly out of scope because a P&L line is
   an aggregation (account × period × org), not a table row, and
   the aggregation-selection schema has Phase 2-era data-model
   implications. This decision did not need a separate discussion
   because the Phase 1.2 canvas scope already limits interactive
   views to the journal entry list and CoA view — the P&L canvas
   view exists in Phase 1.1 as read-only but is naturally not
   selectable without a new schema.

2. **Client-ephemeral, not server-persisted.** Canvas context is
   built by the Zustand selector at the moment the user sends a
   message, sent in the request body, and never stored in
   `agent_sessions.state`. The server does not try to guess what
   the user clicked. Rationale: (a) the server cannot know what the
   user clicked, (b) it avoids a staleness window on canvas
   navigation, (c) it keeps `agent_sessions.state` focused on
   conversation-turn state.

3. **Subordinate framing in the system prompt.** The canvas-context
   block is explicitly labeled as "reference only, do not assume
   the user is asking about this unless their message refers to
   it." The over-anchoring risk is mitigated by prompt structure
   and verified by exit criterion #19 scenario (b).

4. **In-place edit to Phase 1.1 components, not new components.**
   `JournalEntryListView.tsx` and `ChartOfAccountsView.tsx` — both
   created in Phase 1.1 — get click handlers added in Phase 1.2.
   This breaks the implicit "Phase 1.2 is purely additive to Phase
   1.1" rule, but that rule was never real — Phase 1.2 also
   converts `AgentChatPanel.tsx` from empty-state to streaming
   rendering. Canvas context wiring joins the list of Phase 1.2
   in-place edits.

**Estimated footprint:** ~150 Bible lines; no migration changes;
one Phase 1.1 folder tree addition (`canvasContext.ts`); no impact
on any v0.5.3 finding.

---

## v0.5.3 — Correctness & Risk Review Fixes (16 findings)

**Reviews that produced this version:**
- **A — Risk hunt.** Found 10 items most likely to blow up during Phase
  1.1/1.2/1.3 execution. 5 Bible changes, 4 inline notes, 1 Phase 1.1
  brief addition.
- **D — Technical correctness.** Found 11 items under adversarial
  technical scrutiny of the invariants, data model, RLS, deferred
  constraint, and trace propagation. 7 Bible changes, 4 inline notes.

**Total: 16 findings, all resolved in a single v0.5.3 commit.**

---

### Findings from review A (risk hunt)

| ID | Finding | Blast radius | Resolution |
|---|---|---|---|
| **A1** | Synchronous audit log + deferred constraint + pre-claimed `ai_actions` idempotency row race: on constraint rejection, the `ai_actions` row is left pending-forever with a claimed key, blocking retries. | High | §2a: `ai_actions` now has `stale` status + `staled_at` column. The dry-run path claims the key in its own transaction; the confirm path loads the pending row `FOR UPDATE` inside the mutation transaction and flips status atomically. Mid-conversation API failures mark rows `stale` rather than leaving them pending. Covered by new Phase 1.2 exit criterion #16 (v0.5.2). |
| **A2** | `SECURITY DEFINER` on `user_has_org_access` has no `search_path` hardening and is granted to PUBLIC implicitly, letting anon role enumerate memberships. | High | §2c: function recreated with `SET search_path = ''`, schema-qualified body, `REVOKE ALL FROM PUBLIC`, and `GRANT EXECUTE TO authenticated` only. Same hardening applied to the new `user_is_controller` helper. |
| **A3** | "Service functions trust themselves" means any service function that forgets to call `canUserPerformAction` is a silent cross-tenant breach (service-role client bypasses RLS). | High | §15e: `withInvariants()` middleware now calls `canUserPerformAction` automatically for every mutating service function via a declared `action` field. Lint rule `no-unwrapped-service-mutation` enforces that no mutating function escapes the wrapper. New fourth integration test `serviceMiddlewareAuthorization.test.ts` proves rejection happens before any DB write. |
| **A4** | `trace_id` is generated by the orchestrator and threaded through service calls, but does not ride on Anthropic API requests. Claude API failures log with no `trace_id`, producing blind spots in cross-layer debugging. | High | §5b: every `anthropic.messages.create` call goes through `callClaude()` which binds `trace_id` into a pino child logger before the call, logs start/success/error on that child, and re-throws. Every Claude round trip now carries `trace_id` in all log lines. |
| **A5** | Idempotency key scope ambiguous: `idempotency_key` on both `ai_actions` (unique per org) and `journal_entries` (nullable for manual, required for agent). What if manual form supplies a colliding key? | Medium | Inline in §2a `ai_actions` entry + new CHECK constraint in §2b on `journal_entries`: `source != 'agent' OR idempotency_key IS NOT NULL`. Manual path does not accept a user-supplied key at all. (Also covered by D7.) |
| **A6** | Phase 2 events backfill script will fail against the append-only trigger if it uses `ON CONFLICT DO UPDATE` or `UPSERT` semantics for idempotent re-runs. | Medium | Simplification 1 Phase 2 correction step #5: backfill script must be pure INSERT. Idempotency comes from deterministic `event_id` + pre-check SELECT, not from upsert. |
| **A7** | Vercel + Supabase region mismatch not constrained. "Appropriate Vercel region" in Open Q4 lets the founder ship a US-region deployment hitting a Toronto DB for every API call. | Medium | Promoted to new Section 9a.0 as a hard constraint: Supabase `ca-central-1`, Vercel `yul1`. Added Phase 1.1 exit criterion #15 that blocks completion on region verification. |
| **A8** | Phase 1.1 brief deletes `package-lock.json` and `pnpm-lock.yaml` in the clean slate step but never pins the founder to pnpm specifically. A solo founder following the brief on autopilot may run `npm install` and produce silently divergent resolution. | Low | New §2.0 at the top of the Phase 1.1 brief: pin pnpm via Corepack before any other action. Explicit "never type `npm install`" rule. ⚠️ Q5 assumption marker on the Windows path. |
| **A9** | `next-intl` fallback on missing keys — `fr.json` and `zh-Hant.json` described as "placeholder structure" without specifying the content of placeholder values. | Low | §11: placeholder locale files are `cp en.json fr.json && cp en.json zh-Hant.json`. English fallback values guarantee Phase 1.3 exit #12 (non-English path walked) is not blocked on missing keys. |
| **A10** | No rule for the Phase 1.2 agent proposing entries against inactive CoA accounts. | Low | §5a: `listChartOfAccounts` filters `is_active = true` by default; `postJournalEntry` validates the target account is active at the service layer. Belt and suspenders. |

---

### Findings from review D (technical correctness)

| ID | Finding | Blast radius | Resolution |
|---|---|---|---|
| **D1** | Period lock trigger is a race condition under READ COMMITTED. Transaction A reads `is_locked=false`, transaction B locks and commits, A commits lines into a now-locked period. | High | §1d: trigger function rewritten to `SELECT is_locked FROM fiscal_periods WHERE period_id = X FOR UPDATE`. Row lock serializes any concurrent `UPDATE fiscal_periods SET is_locked = true` behind the in-flight journal post. Complements the §10c READ COMMITTED + row-lock isolation model. |
| **D2** | Money crosses the service boundary as JavaScript `Number`. IEEE 754 rounding + multi-currency FX produce accumulated P&L drift that passes the per-entry deferred constraint. | High | §3a fully rewritten: money is `z.string()` with a strict decimal regex; branded `MoneyAmount` and `FxRate` types. New `money.schema.ts` with `addMoney`, `multiplyMoneyByRate`, `eqMoney` helpers using `decimal.js`. The float-tolerance `< 0.005` window in the v0.5.2 debit=credit check is removed — exact decimal equality is the rule. |
| **D3** | RLS documented on exactly 3 tables out of 20+ tenant-scoped tables. Bible promise "RLS on every tenant-scoped table" unverifiable. | High | §2c fully rewritten: RLS enabled + policies documented for 20+ tables using the two hardened helpers (`user_has_org_access`, `user_is_controller`). Three explicit exceptions documented: `chart_of_accounts_templates` (global), `tax_codes` (shared/org hybrid), `auth.users` (Supabase-managed). |
| **D4** | `events` append-only guarantee bypassed by `TRUNCATE`. BEFORE UPDATE/DELETE triggers do not fire on TRUNCATE, and service-role has TRUNCATE privilege by default. | High | §1d: `BEFORE TRUNCATE FOR EACH STATEMENT` trigger added. `REVOKE TRUNCATE ON events FROM PUBLIC/authenticated/anon`. Service-role retains the privilege only because Supabase grants cannot easily be revoked; the trigger is the actual enforcement. |
| **D5** | Multi-currency `amount_cad` / `amount_original` / `fx_rate` relationship never stated. Silent bug: service function forgets to populate `amount_cad`, P&L rolls up wrong, debit=credit still passes. | Medium | §2b: two new invariant rows with CHECK constraints — `amount_original = debit_amount + credit_amount` and `amount_cad = ROUND(amount_original * fx_rate, 4)`. §3a `.refine()` calls mirror the DB checks at the application layer for early error messages. |
| **D6** | Deferred constraint trigger is `FOR EACH ROW DEFERRABLE` — fires N times at commit for N-line entries, each running the same SUM query. **Kept in Bible per founder direction, not deferred to Phase 2.** | Medium | §1d: explicit performance note added in the Bible now, not in a later phase brief. Named "not a bug, do not try to fix it" with the list of rejected alternatives (`FOR EACH STATEMENT` unsupported, `pg_trigger_depth()` doesn't apply, service-layer assert moves enforcement). v0.6.0+ may revisit for Phase 2 AP batches. A developer hitting this in Phase 1.2 without the note would waste hours. |
| **D7** | `idempotency_key` nullability is TypeScript-side discipline with no DB CHECK. If the agent tool forgets to populate the key, silent NULL accepted. | Medium | §2b: `CHECK (source != 'agent' OR idempotency_key IS NOT NULL)` on `journal_entries`. |
| **D8** | `memberships.user_id → auth.users(id)` has no `ON DELETE CASCADE`. Seed script `.catch(() => {})` swallows FK violation on re-run; idempotency silently broken after first seed. | Medium | §2a: `memberships.user_id` FK changed to `REFERENCES auth.users(id) ON DELETE CASCADE`. Second seed run now works. Production user deletion also works. |
| **D9** | Transaction isolation level unspecified. Default READ COMMITTED permits write skew on read-then-write patterns (D1 is the primary example). | Medium | New §10c. Explicit rule: Phase 1 mutating service functions run under READ COMMITTED with targeted row locks (`SELECT ... FOR UPDATE` on `fiscal_periods` — the D1 fix — is the only such point in Phase 1). `SERIALIZABLE` rejected as cost without benefit for a single-founder Phase 1; revisited in Phase 2 for AP batches. |
| **D10** | `events.sequence_number bigserial` has gaps on rollback. Any Phase 2+ code assuming dense ordering breaks. | Low | Inline note in §2a events schema entry: replay logic must order by `(occurred_at, sequence_number)` and must never assume gap-free density. `sequence_number` is a tiebreaker, not a truth source. |
| **D11** | Zero-value journal lines are allowed by the v0.5.2 CHECK constraints (both debit=0 and credit=0 satisfy "debit XOR credit"). Invisible audit-context errors. **Founder position: reject at the database, at least one side must be non-zero.** | Low | §2b: CHECK constraint `(debit_amount >= 0 AND credit_amount >= 0) AND (debit_amount > 0 OR credit_amount > 0)`. §3a `.refine()` mirrors the check with an explicit error message pointing at D11. Rationale recorded: zero-balanced lines are worse than rejected entries because they silently pollute the audit trail while passing every higher-level balance check. |

---

### Summary of Bible sections touched in v0.5.3

| Section | Change |
|---|---|
| Version header | Bumped from v0.5.2 to v0.5.3 |
| Version history block | New v0.5.3 entry (condensed form) |
| Phase 1 Simplifications 1 (step 5) | Backfill script must be pure INSERT (A6) |
| §1d Double-Entry Integrity at the Database Level | Deferred constraint performance note (D6); period lock row-lock fix (D1); TRUNCATE trigger + REVOKE (D4) |
| §2a Core Tables | `memberships` CASCADE (D8); `ai_actions` stale status + transaction rule (A1/A5); `events.sequence_number` gap note (D10) |
| §2b Key Database Invariants | 3 new rows: zero-line CHECK (D11), multi-currency invariant (D5), idempotency CHECK for agent source (D7); period lock note updated; TRUNCATE note added |
| §2c RLS Policies | Full rewrite. Hardened `user_has_org_access` + new `user_is_controller` helper (A2); RLS + policies for 20+ tables (D3); three explicit exceptions |
| §3a Zod Input Schema | Full rewrite. New `money.schema.ts`. Branded `MoneyAmount`/`FxRate`. `decimal.js` arithmetic. Exact equality check. D5 + D11 + D7 mirrored in `.refine()` (D2 + D5 + D7 + D11) |
| §5a Agent Architecture | Inactive CoA filtering rule (A10) |
| §5b The Orchestrator | `callClaude()` wrapper for trace_id propagation (A4) |
| §9a.0 Hosting Region Pinning | New section. `ca-central-1` + `yul1` hard constraint (A7) |
| §7 Phase 1.1 Exit Criteria | New #15 — region pinning verification |
| §10c Transaction Isolation Level | New section. READ COMMITTED + row-lock rule (D9) |
| §11 Internationalization | Placeholder locale fallback rule (A9) |
| §15e Behavioral Invariants | `withInvariants()` now auto-calls `canUserPerformAction` + lint rule + new 4th integration test (A3) |
| **Part 2 — Phase 1.1 Brief §2.0** | New subsection: pnpm pin via Corepack before clean slate (A8) |

---

### What v0.5.3 does NOT change

- The eight Phase 1 divergences in Section 0 are unchanged.
- The three Phase 1 Simplifications (audit log sync, events reserved seat, agents→services) are unchanged in substance; only Simplification 1's Phase 2 correction step gained the A6 INSERT-only rule.
- The Two Laws, the Four-Layer Truth Hierarchy, and Invariants 1–6 are unchanged.
- The v0.5.2 Phase 1.1/1.2/1.3 exit criteria from the readiness review are unchanged; v0.5.3 only adds #15 to Phase 1.1 (region pinning) — no changes to Phase 1.2 or 1.3.
- Section 18 Open Questions are unchanged. Several v0.5.3 findings (A7, A8) touch Q4 and Q5 respectively but resolve them as hard constraints rather than removing the questions, since the founder still needs to confirm Q5 (OS) for the Corepack path.

---

## v0.5.2 — Readiness Review Fixes

(See the condensed version history block at the top of `PLAN.md` Part 1.
Full narrative deferred — v0.5.2 was the first version to ship a
changelog file and earlier versions are documented only in the
in-Bible version history.)

## v0.5.1 — Foundation Review Fixes

(See the condensed version history block.)

## v0.5.0 — Phase 1 Simplification

(See the condensed version history block.)

## v0.4.0 and earlier

Pre-changelog. See the condensed version history block at the top of
`PLAN.md` Part 1.
