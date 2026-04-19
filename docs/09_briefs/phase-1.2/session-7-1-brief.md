# Phase 1.2 Session 7.1 Sub-Brief (DELTA)

**Drafted:** 2026-04-19
**Anchor SHA:** 18ebf95 (Session 7 closeout — retrospective + Session 7.1/8 handoffs)
**Authoritative scope source:** `docs/09_briefs/phase-1.2/session-7-brief.md` @ ba9599a §4 Commits 4–5
**Predecessor session:** Session 7 (complete; 344/344 tests green)
**Status:** DRAFT v1 — awaiting founder review gate before freeze

---

## 1. Session goal

Ship Commits 4 + 5 deferred from Session 7's pre-declared split-point, and close the three non-blocking carryovers surfaced during Session 7 Commit 3. This is a **delta** over ba9599a, not a standalone artifact: Commit 4/5 file paths, endpoint shapes, and test names are authoritative at ba9599a §4 and are not restated here. This sub-brief documents only what is new for Session 7.1 — three Commit-3 carryovers, four 7.1-specific pre-decisions, a grep-pass at 18ebf95, and commit cadence notes.

Bounded scope: no new feature surface, no schema changes, no master-brief re-interpretation. Estimate ~1 day.

---

## 2. Prerequisites

- **Anchor 18ebf95** working tree clean, 344/344 tests green, `pnpm agent:validate` passes.
- **Read ba9599a §4** (Commits 4 and 5) before executing — the file-level scope lives there.
- **Convention #8** (identity-assertion fifth category, codified at 2b22529) applies throughout drafting and execution, matching Session 7's discipline.
- **Master brief §14.6 + `canvas_context_injection.md`** unchanged from Session 7 — no new design surface touched here.

---

## 3. Carryovers from Session 7 Commit 3

Three non-blocking observations surfaced during Commit 3 review; each is dispositioned to a specific Session 7.1 commit:

- **`currentUserRole` prop wiring on `SplitScreenLayout`** — closes in Commit 4 per Pre-decision 15 below.
- **Canvas navigation on Approve/Edit** (`ProposedEntryCard.onNavigate` wiring from `ProductionChat`) — closes in Commit 5 per Pre-decision 16 below.
- **`SplitScreenLayout` state lift coordination** — Commit 4's avatar-dropdown Team button consumes Commit 5's `setDirective` lift. Addressed by Pre-decision 18 (commit-order reversal) below.

---

## 4. Pre-decisions specific to 7.1

Numbering continues from Session 7 (P1–P13 + P11b + P14 landed at ba9599a / 18ebf95).

### Pre-decision 15 — `currentUserRole` threading adopts `OrgSwitcher`'s client-side membership-read pattern

`SplitScreenLayout` gains a `useEffect` that mirrors the browser-client pattern at `src/components/bridge/OrgSwitcher.tsx:27–54`: `createBrowserClient`, `SELECT {role}` from `memberships` filtered by `user_id = auth.uid() AND org_id = currentOrgId`, setState with the returned role, pass to `AgentChatPanel` as `currentUserRole`. Scope ~15 LOC in `SplitScreenLayout`.

**Guard:** the `useEffect` must skip when `orgId === null` (onboarding mode). Onboarding sessions have no membership yet; persona is always `'controller'` per the orchestrator's `resolvePersona`. The query would return empty. Guard on `orgId !== null` before firing.

**Rejected alternatives:** shared hook (premature abstraction at 2 consumers; extract at 3); server-side prop (scope creep into server components beyond Session 7.1's charter). The ~50ms empty-state flicker is imperceptible.

### Pre-decision 16 — Approve flow renders dual-context: canvas + transcript

On `/api/agent/confirm` success, `ProposedEntryCard` invokes both `onResolved` and `onNavigate`. `onResolved` synthesizes the `agent.entry.posted` ack turn (appended at transcript bottom) via `ProductionChat`'s existing pattern; `onNavigate` fires `{ type: 'journal_entry', entryId, mode: 'view' }` to `SplitScreenLayout`'s `setDirective`. Both are synchronous setState calls batched into a single React commit — callback order inside the handler is an implementation detail with no observable UX consequence, and Session 7.1 takes no position on it. Current shipped order at `ProposedEntryCard.tsx:75–85` (handleApprove) and `:144–149` (handleEdit) stays as-is.

The ruling is the **dual-context render**: canvas = resulting state (posted JE view); chat = what just happened (ack turn under the resolved-badged card). `ProductionChat`'s mount-scroll-to-bottom pattern places both in the user's viewport on the next commit.

Edit flow is analogous: `onResolved` synthesizes no ack turn (status-only resolution for `'edited'`); `onNavigate` fires `{ type: 'journal_entry_form', orgId, prefill: buildPrefillFromCard(card) }` — grep-cite at `src/components/ProposedEntryCard.tsx:144–148` (handler already in place; Session 7.1's carryover is the `ProductionChat` wire-up to the callbacks, not the dispatch shapes).

### Pre-decision 17 — Avatar dropdown actions apply Pre-decision 10 uniformly

All four avatar dropdown items (Profile, Org settings, Team, Sign out) fire navigations whose target directives are type-incompatible with entity selections (`journal_entry`, `account`):

- **Profile** → fires canvas directive `{ type: 'user_profile' }`.
- **Org settings** → `{ type: 'org_profile', orgId }`.
- **Team** → `{ type: 'org_users', orgId }` per ba9599a §4 Commit 4.
- **Sign out** → `router.push('/<locale>/sign-in')` (hard navigation; selection moot).

Per Pre-decision 10's type-compatibility rule, `selectedEntity` drops on all four. Single mental model: "dropdown navigation drops non-compatible selections" — no per-item special-casing. This extends Pre-decision 10 uniformly across the full dropdown action surface.

### Pre-decision 18 — Commit 5 lands before Commit 4 (dependency-order reversal)

Commit 4's avatar-dropdown Team button consumes Commit 5's `SplitScreenLayout.setDirective` lift. Unidirectional coupling: Commit 4 → Commit 5. The `AvatarDropdown` component itself can be drafted without `setDirective` plumbing, but the Team-button wire-up and the full integration test cannot close until Commit 5 has landed the state lift.

**Execution order:** land Commit 5 first, then Commit 4. This reverses ba9599a's numbering; the labels "Commit 4" and "Commit 5" below refer to **ba9599a's original scope**, not execution order. The closeout commit remains Commit 6.

Rejected alternative: land Commit 4 first with Team-button as a no-op stub, then Commit 5 wires it — adds scope (stub + later wire-up) for no gain.

---

## 5. Convention #8 grep-pass results at anchor 18ebf95

Identity-assertions verified against shipped code before this sub-brief's commit:

- `src/components/bridge/OrgSwitcher.tsx:27–54` — membership-read pattern present (`useEffect` at :29, `createBrowserClient` at :30, `supabase.from('memberships').select('org_id, role, …')` at :34–37). ✓ Pre-decision 15.
- `src/components/bridge/SplitScreenLayout.tsx` — `'use client'` at line 11, accepts `orgId: string` prop (line 21). ✓
- `src/components/ProposedEntryCard.tsx:144–148` — `handleEdit` dispatches `{ type: 'journal_entry_form', orgId: card.org_id, prefill: buildPrefillFromCard(card) }` via `onNavigate?.(…)`. `buildPrefillFromCard` defined at :355. ✓ Pre-decision 16.
- `src/components/bridge/MainframeRail.tsx` — file exists; receives `onNavigate` prop from `SplitScreenLayout:42`. ✓
- `src/app/[locale]/[orgId]/agent/actions/` — empty directory (Phase 1.1 carryover slot; no `page.tsx`). ✓ Commit 4's placeholder target.
- `src/shared/types/canvasDirective.ts` — discriminated-union members `user_profile` (:20), `org_profile` (:21), `org_users` (:22), `journal_entry` (:9), `journal_entry_form` (:10) all present. ✓ Pre-decision 17.

Any grep miss during execution: surface to founder before sub-brief commit. Don't paper over drift.

---

## 6. Commit cadence

Execution order per Pre-decision 18:

1. **Commit 5** (ba9599a's canvas-context click handlers + EC-19 tests) → verify `pnpm agent:validate` → EC-19 manual scenarios run → founder review gate → lands.
2. **Commit 4** (ba9599a's shell polish: avatar dropdown + Activity icon + placeholder review queue page) → verify → founder review gate → lands.
3. **Commit 6** (closeout) — retrospective entry + CURRENT_STATE update + Session 8 handoff. The Session 8 handoff already lives in `docs/07_governance/friction-journal.md` under the Session 7 heading; Commit 6 **updates it** (anchor SHA shift, carryover status, convention-candidate datapoint count) rather than writing a new one.

Founder review gate at each boundary covers: diff review, test-pass verification, Convention #8 identity-assertion spot-check.

---

## 7. Stop conditions

- `pnpm test` fails at any commit boundary: fix before proceeding.
- Convention #8 pre-commit grep surfaces identity-assertion drift: correct before commit.
- Pre-decision 10 type-compatibility test added at Commit 5 fails: investigate; do not proceed to Commit 4 until the reducer is green.
