# Phase 1.2 Session 7.1.1 Sub-Brief (DELTA of DELTA)

**Drafted:** 2026-04-19
**Anchor SHA:** 53ff280 (fix(dev): disable broken pino-pretty transport under Next.js 15)
**Predecessor sub-brief:** `docs/09_briefs/phase-1.2/session-7-1-brief.md` @ dc0ee69 (Shape B DELTA)
**Authoritative catalog source:** `src/agent/prompts/validTemplateIds.ts` @ 53ff280
**Status:** DRAFT v1 — awaiting founder review gate before freeze

---

## 1. Session goal

Micro-sub-session carved out of Session 7.1. Extends the template catalog so the agent has a legal response shape for grounded conversational answers (EC-19 scenario (a), and future "answer a question about X" cases); performs server-only template hygiene moving `agent.error.*` out of agent-selectable space into an orchestrator-internal map. Bounded scope, ~60–100 LOC, single commit landing on top of 53ff280.

---

## 2. Prerequisites

- `pnpm test` at 365/365; `git rev-parse --short HEAD` → `53ff280`.
- **Working-tree state:** Session 7.1 Commit 5 changes uncommitted (modified bridge/canvas components + `src/agent/canvas/` + two new `tests/integration/` files). **Do not touch, stage, stash, or revert.** 7.1.1 commits on top of 53ff280; Commit 5 re-tests EC-19 against the extended catalog after (§6).

---

## 3. Pre-decisions specific to 7.1.1

Numbering continues from Session 7.1 (P15–P18 landed at dc0ee69).

### Pre-decision 19 — `agent.response.natural` is the general free-form conversational template

Schema: `z.object({ text: z.string() }).strict()`. Single template handles the entire "answer a grounded question in prose" surface. Closure discipline preserved: `template_id` closure protects against invented *keys*, not against free-form *text within* a known key. **Rejected:** narrow per-entity templates (`agent.entry.described`, `agent.account.described`) — not scalable; Phase 2 entity types would grow the catalog indefinitely and the UI renders `params.text` identically regardless of subject.

### Pre-decision 20 — Prompt routing: prefer structured, fall back to natural

`validTemplateIdsSection` prose must instruct Claude to prefer structured templates when the response shape is known (`agent.entry.proposed` when proposing; `agent.accounts.listed` when listing; `agent.onboarding.first_task.navigate` at onboarding completion; `agent.entry.posted` / `agent.entry.rejected` for approval-flow acks) and to use `agent.response.natural` only when no structured template fits. Exact wording drafted during execution; **founder review of the wording is required at the commit gate.**

### Pre-decision 21 — Two-map split: `AGENT_EMITTABLE_TEMPLATE_IDS` vs `SERVER_EMITTED_TEMPLATE_IDS`

Current `TEMPLATE_ID_PARAMS` (15 entries) splits into:

- `AGENT_EMITTABLE_TEMPLATE_IDS` — 13 carried over (6 `agent.*` + 7 `proposed_entry.*`, excluding the two `agent.error.*` keys) + 1 new (`agent.response.natural`) = **14 entries**.
- `SERVER_EMITTED_TEMPLATE_IDS` — 2 entries: `agent.error.tool_validation_failed`, `agent.error.structured_response_missing`. Emitted only by orchestrator self-emit paths (Q13 exhaust `src/agent/orchestrator/index.ts:~442`, structural exhaust `:~600`).

`validateParamsAgainstTemplate` accepts both maps via a merged lookup — self-emit paths keep validating through the same helper. `validTemplateIdsSection` iterates **only** `AGENT_EMITTABLE_TEMPLATE_IDS`; Claude never sees `agent.error.*` as a selectable option in the system prompt.

---

## 4. Scope detail

- `src/agent/prompts/validTemplateIds.ts` — split per P21; add `agent.response.natural` per P19; update `validTemplateIdsSection` prose per P20; merged-lookup `validateParamsAgainstTemplate`. `VALID_RESPONSE_TEMPLATE_IDS` derived from the merged set for backward-compat consumers (closure test).
- `messages/en.json`, `messages/fr-CA.json`, `messages/zh-Hant.json` — add `agent.response.natural: "{text}"` per locale (fr-CA + zh-Hant are English fallbacks in Phase 1.2 per `agentTemplateParamsClosure.test.ts` header note; cross-locale parity is a Phase 2 follow-up).
- `src/agent/orchestrator/index.ts` — behavior unchanged; the two self-emit paths continue to flow through `validateParamsAgainstTemplate` (merged lookup). No orchestrator-logic changes required.
- `tests/integration/agentTemplateParamsClosure.test.ts` — driver iterates `{ ...AGENT_EMITTABLE_TEMPLATE_IDS, ...SERVER_EMITTED_TEMPLATE_IDS }` so bidirectional placeholder parity continues to cover both server-emitted keys. Optional new test: disjointness between the two maps (closure discipline at map-construction layer).

---

## 5. Commit cadence

Single feature commit: `feat(phase-1.2): Session 7.1.1 — agent.response.natural + template catalog split`. Retrospective folded into the commit message (too small for a dedicated closeout commit); process observations roll up into Session 7.1 Commit 6 closeout.

---

## 6. EC-19 re-run (Session 7.1 Commit 5 carryover)

After 7.1.1 lands: Commit 5 changes (held uncommitted) re-test against the extended catalog; EC-19 scenarios (a) under-anchored, (b) over-anchored, (c) clarification re-run against real Claude. If (a) passes semantically with `agent.response.natural`, Commit 5 commits. If any scenario fails, investigate prompt-engineering in `canvasContextSuffix` + persona prompts before retry. Commit 4 proceeds per P18 dependency ordering; Commit 6 closeout notes 7.1.1 in the Session 7.1 retrospective.

---

## 7. Stop conditions

- `pnpm test` fails at the 7.1.1 commit boundary: fix before proceeding.
- `pnpm agent:validate` surfaces typecheck or Convention #8 grep drift: correct before commit.

---

## 8. Convention #9 datapoint

The template-catalog gap (EC-19 scenario (a) not answerable with the shipped catalog) is a layer-transition gap between catalog-closure and prompt-routing — **4th datapoint** for the "material gaps surface at layer-transition boundaries" candidate convention (joining P11b, P14, and the P16 dual-context rewrite). Overdetermined for codification at Session 8 retrospective.
