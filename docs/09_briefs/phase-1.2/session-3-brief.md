# Phase 1.2 Session 3 Execution Sub-Brief — System Prompts + i18n

*This sub-brief drives Session 3 of Phase 1.2. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the
architecture document and is never modified during execution.
Session 1 and 2 sub-briefs (`session-1-brief.md` and
`session-2-brief.md`, both committed) are the density references.
Where this sub-brief and the master brief disagree, the master
brief wins — stop and flag rather than deviate.*

---

## 1. Goal

Session 3 lands the three persona system prompts, the three
composable context suffixes (locale directive, canvas context,
onboarding), the `buildSystemPrompt` composition helper, and the
i18n template entries for every `template_id` Session 2's fixtures
and orchestrator fallbacks reference — plus the Four Questions
keys from master §10.3. The orchestrator's Step 4 placeholder is
replaced with a real `buildSystemPrompt()` call. The structural-
retry exhaustion path is corrected to return a template response
per master §6.2 item 5 (closing a Session 2 spec divergence). No
real Anthropic API calls (the mocked regime continues), no
onboarding flow state machine, no form-escape surfaces, no UI
changes.

---

## 2. Master-brief sections implemented

- **§7** — three persona prompts, five sections per prompt
- **§7.1** — onboarding suffix (verbatim block per master)
- **§10.3** — Four Questions + policy-outcome templates, all
  seven keys in all three locale files
- **§6.2** item 5 — structural-retry-exhaustion surface closed
  (Session 3 fixes Session 2's `throw` to return the template
  response per the spec)

Sections NOT delivered:

- §6.1 tool inventory → already complete (Session 2)
- §8 OrgContextManager → Session 4 (Session 3 stubs the type
  per Pre-decision 1)
- §11 onboarding flow state machine → Session 5 (Session 3
  writes the *suffix*, not the state machine)
- §13 API routes → Session 4
- §14 UI changes → Session 7
- §15 canvas directive extensions → Session 6
- §21 test catalog — master §21's CA-* numbering drifted from
  Session 2's actual names; founder has noted this for Session 8,
  not Session 3's concern

---

## 3. Locked Decisions (inherited)

All master §3 decisions + Session 1–2 sub-brief decisions + the
four founder pre-decisions below (§4).

---

## 4. Founder pre-decisions (authoritative)

### Pre-decision 1 — `buildSystemPrompt` signature: Option B

Master §7 specifies the long-term signature
`(persona, orgContext, locale, canvasContext)`.
`OrgContextManager` lands in Session 4. Session 3 ships a
**deferred-extensible stub**: a minimal `OrgContext | null`
interface that Session 4 expands without breaking call sites.

Session 3's stub (in `src/agent/prompts/orgContext.ts`):

```typescript
export interface OrgContext {
  org_id: string;
  org_name: string;
  // TODO(session-4): add legal_name, industry_display_name,
  // functional_currency, fiscal_year_start_month,
  // fiscal_periods, controllers per master §8.
}
```

The builder accepts `orgContext: OrgContext | null`. When null,
the identity block omits org-specific language and the onboarding
suffix is considered (Pre-decision 4). When non-null in Session 3,
the identity block renders `org_id` and `org_name`; Session 4
extends the identity block with the richer fields.

### Pre-decision 2 — locale is a live parameter

Session 2's orchestrator accepts `input.locale` but uses it only
for degradation-path scaffolding. Session 3 wires locale into the
system prompt via a locale-directive suffix. The builder receives
the locale, appends the directive to the base prompt, and a test
asserts the directive is present for all three locales (`en`,
`fr-CA`, `zh-Hant`).

### Pre-decision 3 — canvas context suffix scope

The canvas suffix covers only the `CanvasDirective` union members
present in `src/shared/types/canvasDirective.ts` as of Session 2.
Session 6 will extend this; Session 3 must not speculate about
extensions. When `canvasContext` is absent, the builder omits the
suffix entirely.

### Pre-decision 4 — onboarding suffix shape

The onboarding suffix (master §7.1, quoted verbatim) is appended
when `persona === 'controller' && orgContext === null`. The suffix
instructs Claude to use `createOrganization` as the first
meaningful tool and to invoke `listIndustries` for industry
selection. It does **not** encode the Session 5 state machine;
it is a single static prompt fragment.

### Pre-decision 5 (new from founder review) — §7 citation chain

Master §7 is a **six-section skeleton** with mixed verbatim +
skeleton content, not fully verbatim prompt text. Session 3
assembles each persona prompt per the source-citation table in
§5.1 below. **Commit 2 of execution has a founder review gate**
(§10) for the session-authored prose (Identity block template
strings + assembly glue). Master brief stays frozen at `aae547a`.

---

## 5. Prerequisites

- Git clean at `d20c767` or later
- `pnpm test` green at 178/178 (regression baseline)
- No new deps
- `ANTHROPIC_API_KEY` still not required

---

## 6. Work items

Eight work items. Every commit leaves `pnpm typecheck && pnpm test`
green — no intentional red intermediate state.

### 6.1 Persona prompt files with explicit source citations

Directory: `src/agent/prompts/personas/`. Three files:
- `controller.ts` exports `controllerPersonaPrompt(orgContext, user)`
- `ap_specialist.ts` exports `apSpecialistPersonaPrompt(orgContext, user)`
- `executive.ts` exports `executivePersonaPrompt(orgContext, user)`

Each returns a string assembled from the five numbered sections of
master §7 plus Session-3-authored glue. The **source-citation
table** below is load-bearing — every section cites either master
(verbatim) or Session 3 (authored with founder review):

| Section | Content | Source |
|---|---|---|
| 1. Identity block | Who the user is, their persona, their org (or onboarding state) | **Session 3 authored** — template-literal interpolation of `orgContext.org_name`, persona label, user display name. Founder review at commit 2. |
| 2. Available tools | Enumeration of the persona's tool whitelist with one-line descriptions | **Session 3 authored glue** — iterates `toolsForPersona(persona)`, reads `tool.description` (already authored in Session 2). |
| 3. Anti-hallucination rules | The six rules that prevent fabricated amounts/accounts | **Verbatim** from master §6.3 (six numbered rules, quoted exactly). |
| 4. Structured-response contract | Single sentence mandating `respondToUser` on every turn | **Verbatim** from master §7 section 4 (line 565–567): *"Your responses must be `{template_id, params}`. Do not output English prose. Every `template_id` must exist in the locale files."* |
| 5. Voice rules | Neutral, professional, unnamed, no emoji, no filler | **Verbatim** from master §7 section 5 / ADR-0006: *"neutral, professional, unnamed. No emoji, no exclamation marks, no filler phrases."* |

The "Session 3 authored" rows (1 and 2) get a commit-2 review
gate. The "Verbatim" rows (3, 4, 5) are drop-ins — no authorship,
no review needed. The `tool.description` strings authored in
Session 2 are already reviewed (live in git since commit `0bee609`).

### 6.2 Context suffix files

Directory: `src/agent/prompts/suffixes/`. Three files:

**`localeDirective.ts`** — exports
`localeDirective(locale: 'en' | 'fr-CA' | 'zh-Hant'): string`.
Returns a one-line instruction: *"Respond in English."* /
*"Répondez en français canadien."* /
*"請以繁體中文回應。"*. These three strings are Session 3 authored
(short, low-stakes, founder review at commit 2).

**`canvasContextSuffix.ts`** — exports
`canvasContextSuffix(canvasContext: CanvasContext | undefined): string`.
Empty string when absent. When present, describes the active
canvas view using only the `CanvasDirective` union members from
`src/shared/types/canvasDirective.ts`. Per master §7 section 6
this cites the "subordinate-framing block" from
`docs/09_briefs/phase-1.2/canvas_context_injection.md` — execution
reads that doc and incorporates its guidance. If the doc does not
contain a ready-to-paste block, Session 3 authors the framing
(commit-2 review).

**`onboardingSuffix.ts`** — exports `onboardingSuffix(): string`.
**Verbatim** from master §7.1 (line 580–585):

> "The user is new. Walk them through setup: (1) their profile
> (name, role, preferences), (2) their organization, (3) industry
> selection for CoA template, (4) first task invitation. At each
> step, mention they can skip to the form-based surface. Use the
> available tools (updateUserProfile, createOrganization,
> updateOrgProfile, listIndustries) to complete each step."

### 6.3 `buildSystemPrompt` composition

File: `src/agent/orchestrator/buildSystemPrompt.ts`. Signature per
Pre-decision 1:

```typescript
export function buildSystemPrompt(params: {
  persona: Persona;
  orgContext: OrgContext | null;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  canvasContext?: CanvasContext;
  user: { user_id: string; display_name?: string };
}): string
```

Composition order:

1. Base persona prompt (per `params.persona`, assembled per §6.1)
2. Locale directive suffix (Pre-decision 2)
3. Onboarding suffix if `persona === 'controller' && orgContext === null`
   (Pre-decision 4)
4. Canvas context suffix if `canvasContext` present (Pre-decision 3)
5. (Session 4 will inject org-context summary between steps 1
   and 2 — the builder's composition order already has a slot
   for it)

Returns the full assembled string with single-blank-line separators
between sections.

### 6.4 Wire `buildSystemPrompt` into the orchestrator

In `src/agent/orchestrator/index.ts` replace the placeholder at
line ~101:

```typescript
// Before:
const system = 'You are an accounting agent. End every turn with a call to respondToUser carrying a template_id and params.';

// After:
const system = buildSystemPrompt({
  persona,
  orgContext: null,  // Session 4 loads this via OrgContextManager
  locale: input.locale,
  canvasContext: input.canvas_context,
  user: { user_id: input.user_id },
});
```

The placeholder string must be fully removed — a grep for
*"You are an accounting agent. End every turn"* in `src/` after
Session 3 execution returns zero hits. This is a session-close
verification step.

### 6.5 Locale file additions

Twelve new template_ids added to all three locale files
(`messages/en.json`, `messages/fr-CA.json`, `messages/zh-Hant.json`).
Placeholder English values in all three per the existing i18n
convention (fr-CA and zh-Hant use English fallbacks until real
translations arrive). The `agent.*` and `proposed_entry.*`
namespaces sit alongside existing keys like `agent.emptyState`
and `nav.agentUnavailable`.

**From Session 2 fixtures + orchestrator surfaces:**

| Key | Source | Placeholder English value |
|---|---|---|
| `agent.greeting.welcome` | Fixture A | "Welcome, {user_name}." |
| `agent.accounts.listed` | Fixture B | "I found {count} accounts for your organization." |
| `agent.entry.proposed` | Fixture C | "Proposed entry of {amount}. Please review the details below." |
| `agent.error.tool_validation_failed` | orchestrator Q13 exhausted (`index.ts:~200`) | "I was unable to format a valid request after {retries} attempts. Please rephrase what you'd like to do." |
| `agent.error.structured_response_missing` | orchestrator structural-retry exhausted (§6.7 below) | "I had trouble formatting a response. Please try again." |

**From master §10.3:**

| Key | Purpose |
|---|---|
| `proposed_entry.what_changed` | Q1 — rendered from lines array |
| `proposed_entry.why.rule_matched` | Q2 — "Matched rule: {label}." |
| `proposed_entry.why.novel_pattern` | Q2 — "Novel pattern — the agent has not seen this before." |
| `proposed_entry.track_record.no_rule` | Q3 — "N/A for this proposal." |
| `proposed_entry.if_rejected.journal_entry` | Q4 — "The entry will not be posted. You can edit and resubmit." |
| `proposed_entry.if_rejected.reversal` | Q4 — "The original entry remains on the ledger." |
| `proposed_entry.policy.approve_required` | Policy outcome — "Requires your approval." |

Total: 12 new keys × 3 locale files = 36 entries added.

If the mandatory pre-drafting Cited-Code Verification grep
surfaces any additional `template_id` references in `src/agent/`
or `tests/fixtures/` that are not in this table, the execution
session adds them to the locale files and flags the discovery in
the close-out.

### 6.6 OrgContext stub type

File: `src/agent/prompts/orgContext.ts`. Exports the minimal
interface per Pre-decision 1, with an explicit TODO naming
Session 4's additions. Single-line doc comment citing master §8
as the long-term home.

### 6.7 Orchestrator structural-retry surface fix (Session 2 divergence closeout)

**D2 disposition: Option 1.** Master §6.2 item 5 (line 483–487)
specifies:

> If the second attempt also lacks `respondToUser`, the
> orchestrator surfaces a generic error template:
> `{ template_id: 'agent.error.structured_response_missing',
> params: {} }` and logs `AGENT_STRUCTURED_RESPONSE_INVALID`.

Session 2 shipped `throw new ServiceError('AGENT_STRUCTURED_RESPONSE_INVALID', ...)`
instead of returning the template response. That's a spec
divergence caught by this session's Cited-Code Verification grep
when preparing the locale additions.

Replace the throw block at `src/agent/orchestrator/index.ts:~223`:

```typescript
// Before:
if (structuralRetries >= STRUCTURAL_MAX_RETRIES) {
  log.error({}, 'structural retry budget exhausted');
  throw new ServiceError(
    'AGENT_STRUCTURED_RESPONSE_INVALID',
    'Claude did not produce a respondToUser tool_use after retry',
  );
}

// After:
if (structuralRetries >= STRUCTURAL_MAX_RETRIES) {
  log.error({}, 'structural retry budget exhausted — AGENT_STRUCTURED_RESPONSE_INVALID');
  await persistSession(session.session_id, messages, resp, ctx.trace_id, log);
  return {
    session_id: session.session_id,
    response: {
      template_id: 'agent.error.structured_response_missing',
      params: {},
    },
    trace_id: ctx.trace_id,
  };
}
```

The `AGENT_STRUCTURED_RESPONSE_INVALID` log line is preserved
per master §6.2 ("...and logs"). The `persistSession` call is
added so the failed exchange is still recorded in
`agent_sessions.conversation` (matches the Q13-exhaustion branch's
behavior a few lines up).

Lands in commit 2 (the orchestrator wire-up commit).

### 6.8 Mandatory pre-execution grep (Cited-Code Verification)

Per `docs/04_engineering/conventions.md` / "Cited-Code
Verification". Before commit 2 of execution runs:

```bash
grep -nE 'Phase 1\.1|Phase 1\.2|not implemented|TODO|DEPRECATED' \
  src/agent/orchestrator/index.ts \
  src/agent/orchestrator/*.ts \
  src/shared/types/canvasContext.ts
grep -rnE "template_id.*'agent\.|template_id: '" \
  tests/fixtures/ src/agent/
```

Expected first-grep hits: zero in `orchestrator/`; maybe TODOs in
`canvasContext.ts` (inspect and document). Expected second-grep
hits: the five template_ids enumerated in §6.5 row 1. Any
additional hits → add the template_id to the locale files and
flag the discovery in the close-out recap.

---

## 7. Exit Criteria

All criteria prefixed `S3-`. Ten criteria.

| # | Criterion | Verification |
|---|---|---|
| S3-1 | Three persona prompt files exist with expected exports | `ls src/agent/prompts/personas/ && grep -l "PersonaPrompt" src/agent/prompts/personas/*.ts` returns 3 |
| S3-2 | Three suffix files exist with expected exports | `ls src/agent/prompts/suffixes/` returns 3 files |
| S3-3 | `buildSystemPrompt` composes all sections in the expected order | CA-48 passes |
| S3-4 | Orchestrator placeholder string fully removed | `grep "You are an accounting agent. End every turn" src/` returns zero hits |
| S3-5 | Every fixture-referenced template_id exists in `en.json` | `jq '.agent' messages/en.json` returns a non-empty object containing all five `agent.*` keys from §6.5 |
| S3-6 | Every `proposed_entry.*` template_id from master §10.3 exists in `en.json` | `jq '.proposed_entry' messages/en.json` non-empty with all 7 keys |
| S3-7 | fr-CA and zh-Hant have parity with en.json | `diff <(jq 'keys' en.json) <(jq 'keys' fr-CA.json)` and same for zh-Hant — both return no diff |
| S3-8 | Structural-retry-exhaustion returns template (not throws) | CA-43 (inverted) passes |
| S3-9 | `pnpm typecheck` exits 0 | same |
| S3-10 | Full regression clean: 178 baseline + 5 new = 183 tests, 0 failures | `pnpm test` |

---

## 8. Test delta

Session 3 adds **5 new** tests (CA-48 through CA-52) and **inverts
1 existing** test (CA-43). Pattern matches Session 2 commit 4
(where two journalEntrySchema unit tests were inverted from
Phase 1.1 rejections to Phase 1.2 contracts).

**New tests:**

| # | File | Asserts |
|---|---|---|
| CA-48 | `tests/integration/buildSystemPromptComposition.test.ts` | Given a controller + non-null orgContext + en locale + no canvasContext → output contains persona identity, the controller tool enumeration, anti-hallucination rules (verbatim from §6.3), the structured-response contract, voice rules, and the English locale directive. |
| CA-49 | `tests/integration/buildSystemPromptOnboarding.test.ts` | Given a controller + null orgContext → output contains the verbatim onboarding suffix from master §7.1. |
| CA-50 | `tests/integration/buildSystemPromptCanvas.test.ts` | Given a non-null canvasContext → output contains the canvas suffix describing the active view. Given canvasContext undefined → output contains no canvas section. |
| CA-51 | `tests/integration/i18nLocaleParity.test.ts` | Every key in `messages/en.json` exists in `messages/fr-CA.json` AND `messages/zh-Hant.json`. If this test already exists (prior phase), Session 3 confirms it still passes; otherwise Session 3 adds it. |
| CA-52 | `tests/integration/buildSystemPromptLocales.test.ts` | Same baseline prompt with `locale: 'en'` vs `locale: 'fr-CA'` vs `locale: 'zh-Hant'` → outputs differ only in the locale-directive segment. |

**Inverted test:**

| # | File | Change |
|---|---|---|
| CA-43 | `tests/integration/agentStructuralRetry.test.ts` | Currently asserts `.rejects.toThrow(/AGENT_STRUCTURED_RESPONSE_INVALID|structured/i)`. Session 3 inverts to `expect(response.response.template_id).toBe('agent.error.structured_response_missing')`. The test's describe block text may need updating to reflect the new contract ("returns template response" rather than "raises"). |

The drafter proposes final numbering and names; if execution
discovers a meaningful additional test or a proposed test is
redundant, flag it in the close-out rather than silently adding
or dropping.

---

## 9. What is NOT in Session 3

- No real Anthropic API calls (Session 4)
- No `OrgContextManager` logic — only the stub type
- No onboarding flow state machine (Session 5)
- No form-escape surfaces (Session 6)
- No API routes (Session 4)
- No UI changes (Session 7)
- No `ProposedEntryCard` component rewrite (Session 7)
- No new agent tools
- No new dependencies
- No new migrations
- No real French or Traditional Mandarin translations — all
  locale additions use English fallbacks per the established
  i18n convention
- No master brief modifications — §7 stays frozen at `aae547a`
  (Pre-decision 5 resolves the completeness question via
  commit-2 review, not by unfreezing master)
- No master §21 CA-* renumbering (Session 8 concern per founder
  disposition)

---

## 10. Stop Points for This Session

The execution session produces:

- `src/agent/prompts/personas/{controller,ap_specialist,executive}.ts`
- `src/agent/prompts/suffixes/{localeDirective,canvasContextSuffix,onboardingSuffix}.ts`
- `src/agent/prompts/orgContext.ts` (stub type)
- `src/agent/orchestrator/buildSystemPrompt.ts`
- Updated `src/agent/orchestrator/index.ts` (placeholder removed
  + structural-retry-exhaustion fix)
- `messages/{en,fr-CA,zh-Hant}.json` (12 new keys × 3 files)
- 5 new test files (CA-48 through CA-52)
- Updated `tests/integration/agentStructuralRetry.test.ts`
  (CA-43 inverted)
- Friction-journal entry with Session 3 summary

Stop after all 10 S3 exit criteria pass. Do **not** begin Session 4.

---

## 11. Commit plan

Four commits. **Commit 2 has a founder review gate** before it
lands — execution halts after staging the commit 2 files and
requests founder review of the Session-3-authored prose per
Pre-decision 5.

- **Commit 1** — `feat(phase-1.2): persona prompts + context suffixes + OrgContext stub`
  Files: `src/agent/prompts/personas/*.ts`,
  `src/agent/prompts/suffixes/*.ts`,
  `src/agent/prompts/orgContext.ts`. Green: typecheck +
  existing 178 tests. Contains the Session-3-authored prose
  (identity templates, tool-enumeration glue, locale directive
  strings). **Founder review gate before push.**
- **Commit 2** — `feat(phase-1.2): buildSystemPrompt + orchestrator wire-up + structural-retry surface fix`
  Files: `src/agent/orchestrator/buildSystemPrompt.ts`,
  `src/agent/orchestrator/index.ts` (placeholder → real
  builder call + §6.7 throw → return fix). Green: typecheck +
  178 existing tests (CA-43 temporarily fails after the
  orchestrator fix; addressed in commit 4).
  Wait — this creates a red intermediate between commits 2 and 4.
  **Alternative:** fold CA-43 inversion into commit 2 so every
  commit stays green. Recommended — matches Session 2's
  commit-4 pattern where schema migration + test inversion
  landed together. Commit 2 files become: buildSystemPrompt +
  orchestrator/index.ts + `tests/integration/agentStructuralRetry.test.ts`.
- **Commit 3** — `i18n(phase-1.2): agent + proposed_entry template keys`
  Files: `messages/{en,fr-CA,zh-Hant}.json`. Green: typecheck +
  all existing tests (including the inverted CA-43 from commit 2).
- **Commit 4** — `test(phase-1.2): CA-48 through CA-52 — system prompt composition + locale parity`
  Files: 5 new integration test files. Green: 183/183 tests, 0
  failures. Verifies every S3 exit criterion.

Founder review gate applies between the `pnpm typecheck && pnpm test`
green confirmation and `git push` (or before the commit if prose
changes are needed). Execution does **not** self-approve the
commit-1 prose.

---

*End of Phase 1.2 Session 3 Sub-Brief.*
