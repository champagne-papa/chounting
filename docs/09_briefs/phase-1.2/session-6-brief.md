# Phase 1.2 Session 6 Execution Sub-Brief — Form-Escape Surfaces + Canvas Directive Extensions

*This sub-brief drives Session 6 of Phase 1.2. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the
architecture document and is never modified during execution. The
Session 1–5 sub-briefs plus Sessions 5.1 / 5.2 / EC-20 closeout
are density and structural references. Where this sub-brief and
the master brief disagree, the master brief wins — stop and flag
rather than deviate.*

---

## 1. Goal

Session 6 delivers master §12's five form-escape surfaces and
master §15's five canvas directive extensions. Session 5 shipped
the conversational onboarding entry point; Session 6 ships the
form-based alternative that master decision B locked in as the
skip path, plus the canvas-directive plumbing so the agent can
navigate the user into those forms conversationally
("Let me show you your profile — I'll open the editor").

Five deliverable dimensions:

- **Five canvas components** — `UserProfileEditor`,
  `OrgProfileEditor`, `OrgUsersView` (with inline invite form).
  The welcome directive is a navigation hint, not a new
  component (reuses the Session 5 welcome page).
- **Three route pages** — `/[locale]/settings/profile`,
  `/[locale]/[orgId]/settings/org`, `/[locale]/invitations/accept`.
- **Five new canvas directive types** at
  `src/shared/types/canvasDirective.ts` + runtime Zod at
  `src/shared/schemas/canvas/canvasDirective.schema.ts`.
- **ContextualCanvas dispatch** for the five new types.
- **Onboarding skip-link** wired from the welcome page to the
  form surfaces.

All API backends already exist from Phase 1.5A/B — Session 6 is
purely UI + canvas-directive plumbing + skip-link. No migrations,
no new ActionNames, no new ServiceError codes, no new services.

---

## 2. Master-brief sections implemented

- **§12.1** — User Profile Editor at
  `src/app/[locale]/settings/profile/page.tsx` + canvas
  component.
- **§12.2** — Org Profile Editor at
  `src/app/[locale]/[orgId]/settings/org/page.tsx` + canvas
  component. Controller-only with non-controller redirect.
- **§12.3** — Invite User Form as inline form inside
  `OrgUsersView`.
- **§12.4** — Org Users List at
  `src/components/canvas/OrgUsersView.tsx` (canvas-only — no
  route page; reached via `org_users` directive or Session 7's
  avatar dropdown).
- **§12.5** — Invitation Accept Page at
  `src/app/[locale]/invitations/accept/page.tsx` — all five
  states (signed-out, email-match, email-mismatch, invalid,
  expired).
- **§15** — Five new canvas directive types added verbatim:
  `user_profile`, `org_profile`, `org_users`, `invite_user`,
  `welcome`. `ContextualCanvas.tsx` switch extended.
- **EC-21** — Onboarding "Skip" link navigates to form-based
  surface (wired from welcome page).
- **EC-23** — User profile editor saves via PATCH /api/auth/me.
- **EC-24** — Org profile editor: controller can edit,
  non-controller redirected.
- **EC-25** — Invite user: token returned, invitation created
  (reuses CA-16).
- **EC-26** — Invitation accept page handles all 5 states.

Sections NOT delivered (explicitly deferred):

- §14.1 `AgentChatPanel` rewrite → Session 7 (OnboardingChat
  seam inside the current panel stays intact; Session 7
  consolidates both modes).
- §14.2 `ContextualCanvas` click handlers for journal entries /
  accounts → Session 7 (canvas_context injection is adjacent
  but separate; Session 6's ContextualCanvas changes are
  directive-dispatch only).
- §14.3 SuggestedPrompts functional → Session 7.
- §14.4 SplitScreenLayout onboarding mode → Session 7.
- §14.6 Avatar dropdown + Mainframe Activity icon → Session 7
  (the sign-out-affordance gap flagged in EC-20 closeout is
  Session 7 scope; Session 6's forms are reachable by direct
  URL and by canvas directive, which is sufficient for EC-21,
  EC-23, EC-24).
- §20 EC-22 → Session 5 (already passed via CA-71).
- §20 EC-27 (ProposedEntryCard migration) → Session 7.
- Address management UI (master §22 "NOT in Phase 1.2").
- Role admin / suspend / reactivate / remove controls (§22).
- Pending invitations list (§22).
- `canvasDirectiveSchema.card` tightening from
  `z.unknown()` to `ProposedEntryCardSchema` → Session 7.

---

## 3. Locked Decisions (inherited)

All master §3 decisions + Session 1–5 sub-brief decisions +
Session 4.5 / 5.1 / 5.2 closeouts + this sub-brief's eight
Pre-decisions below (§4). Convention #8
Spec-to-Implementation Verification (codified at `b24a8d6`)
applied to this sub-brief's drafting — every numeric claim and
literal value below has been grep-verified against its cited
source.

---

## 4. Founder pre-decisions (authoritative)

### Pre-decision 1 — Canvas components are the single source of truth; route pages are thin wrappers

Each form surface lives in `src/components/canvas/`
(`UserProfileEditor.tsx`, `OrgProfileEditor.tsx`,
`OrgUsersView.tsx`). The route pages at
`src/app/[locale]/settings/profile/page.tsx` and
`src/app/[locale]/[orgId]/settings/org/page.tsx` are thin
wrappers that import the canvas component, pass any URL-derived
props (`orgId` for the org profile page), and wrap in the
current page layout. No form logic duplicated between routes
and canvas. This matches the existing Phase 1.1 canvas pattern
(`JournalEntryForm` lives in `src/components/canvas/` and is
reached both via route and via `journal_entry_form` directive).

Rationale: the agent's `canvas_directive` needs to render the
same editor the avatar dropdown would, and Session 7's avatar
dropdown will reach those routes. One implementation; two
consumers.

### Pre-decision 2 — Org Users List is canvas-only (no route page)

Per master §12.4, `OrgUsersView` is reached via Mainframe
"Activity" (Session 7) or avatar dropdown → "Team" (Session 7).
Session 6 builds the canvas component; the UI entry point
lands in Session 7. Until then, the view is reachable via the
`org_users` canvas directive emitted by the agent (e.g., "Show
me the team"). No new route page at
`/[locale]/[orgId]/team` — that's Session 7 scope.

Rationale: Session 6's scope is the components + directives.
Adding a route for the team view duplicates Session 7's nav
work without changing what's testable in Session 6. The canvas
directive dispatch is sufficient for EC-24/EC-25 integration
tests.

### Pre-decision 3 — Skip-link is a welcome-page UI element (not a chat message)

The Session 5 onboardingSuffix says "a form-based org-setup
isn't wired in for you right now." Session 6 wires it. The
skip-link is a button rendered inside the welcome page (outside
the chat transcript), not a clickable prose element in the
chat. Clicking it triggers `router.push` to the relevant form
surface based on the current onboarding step:
- Step 1 (profile) → `/[locale]/settings/profile`
- Step 2/3 (org creation) → **no form-escape in Session 6**
  (master §12 doesn't list an org-creation form; the org
  profile editor is post-creation-only). Skip-link is hidden
  at step 2/3.
- Step 4 (first task) → hidden (not a skippable step).

Update the onboardingSuffix prose to match: the Session 5
phrasing "a form-based org-setup isn't wired in for you right
now" needs to stay for step 2 (no form-escape for org
creation exists) but should be updated for step 1 to
acknowledge the skip-link is now available. **Founder review
gate applies at Commit 4** for the onboardingSuffix prose
changes.

### Pre-decision 4 — Invitation accept page is a server component for the 5-state branching

`src/app/[locale]/invitations/accept/page.tsx` is a server
component that:
1. Parses `token` from `searchParams`.
2. Reads the authenticated user via `@supabase/ssr`.
3. If unauthenticated → `redirect('/[locale]/sign-in?returnTo=...')`.
4. Looks up the invitation via `invitationService.getByToken`
   (exists from 1.5B).
5. Branches to the five states server-side:
   - Invitation not found → error page
   - Invitation expired → error page
   - Email mismatch → error page with sign-out suggestion
   - Email match, not-yet-accepted → CTA button "Accept
     invitation" that posts to `/api/invitations/accept`
   - Email match, already accepted → redirect to the org

A small client component handles the Accept button's submit +
redirect on success. Rest is server-rendered. Rationale: the
state branching is authoritative and cookie-authenticated;
server component renders correctly on first paint with no
client-side flash.

### Pre-decision 5 — OrgProfileEditor authorization: server-component redirect for non-controllers

The org profile editor's route page at
`/[locale]/[orgId]/settings/org` is a server component that
checks the caller's role via `getMembership(user_id, orgId)`.
If role is not `'controller'`, `redirect('/[locale]/[orgId]/')`
with a query flag the destination can surface as a toast (e.g.,
`?forbidden=org-settings`). Toast rendering is Session 7
polish — Session 6 only needs the redirect to work; the
destination page's toast handling can be a no-op pending the
Session 7 UI work.

Rationale: server-component redirect is the same pattern used
by the Session 5 welcome page's defense-in-depth guards.
Consistent with the codebase.

### Pre-decision 6 — Invite form is inline in OrgUsersView; invitation token surfaces post-submit

Per master §12.3, the invite form lives inside `OrgUsersView`,
not as a separate page. Implementation:
- `OrgUsersView` renders the org users table (from `GET
  /api/orgs/[orgId]/users`) plus an "Invite" button.
- Button toggles visibility of an inline form with email +
  role dropdown (executive / controller / ap_specialist).
- Submit posts to `/api/orgs/[orgId]/invitations`.
- On success: the response's invitation token renders in a
  readonly text field with a "Copy" affordance (master §12.3:
  "shows the invitation token for manual sharing").
- The `invite_user` canvas directive opens OrgUsersView with
  the invite form pre-expanded (agent can say "Let me start an
  invitation" and send the user directly to the filled-form
  state).

No email delivery in Phase 1.2 (master §22 implicit — no email
service wired). Token display + copy is the MVP.

### Pre-decision 7 — Five canvas directive types added exactly as master §15 specifies

```typescript
| { type: 'user_profile' }
| { type: 'org_profile'; orgId: string }
| { type: 'org_users'; orgId: string }
| { type: 'invite_user'; orgId: string }
| { type: 'welcome' }  // navigates to /[locale]/welcome
```

Added to `src/shared/types/canvasDirective.ts` in the Phase 1.2
additions block (between the Phase 1.1 built types and the
Phase 2+ stubs). Matching Zod variants added to
`src/shared/schemas/canvas/canvasDirective.schema.ts` with
`.strict()`.

The `welcome` directive is a navigation hint rather than a new
component. `ContextualCanvas` handles it by calling
`router.push('/[locale]/welcome')` — the welcome page handles
its own state. Useful for "take me back to onboarding" from
within the main app shell. For Session 6 scope, the directive
is wired; the user-facing trigger comes from Session 7's
avatar dropdown + Mainframe Activity nav.

### Pre-decision 8 — Stale `/admin/orgs` cleanup is a Session 6 work item, not a separate commit

The pre-drafting grep surfaced one actively-stale `/admin/orgs`
reference in active spec: `docs/03_architecture/ui_architecture.md:197`,
a routing-table entry referencing `/admin/orgs` as the post-auth
destination. Session 5's landed behavior routes to
`/[locale]/[firstOrgId]/`. Session 6 updates this row in the
table. The two sub-brief-internal references in
`docs/09_briefs/phase-1.2/session-5-brief.md:572, 685` are
frozen at 9c22e07 and remain stale against landed behavior;
they're flagged for Session 8 reconciliation, NOT Session 6
cleanup. Archive references (`docs/99_archive/*`) and Phase 1.1
historical references remain untouched.

---

## 5. Prerequisites

- Git clean at `b24a8d6` (convention codification) or later
- `pnpm test` green at 238/238
- No new deps — Session 6 is pure UI + type + component
- No new migrations — all backends (services + API routes)
  exist from Phase 1.5A/B
- No new `ANTHROPIC_API_KEY` usage — Session 6 doesn't touch
  the orchestrator

Existing Phase 1.5A/B assets Session 6 consumes (verified via
grep of `src/`):

- `src/services/user/userProfileService.ts` — `getProfile`,
  `updateProfile` (upsert-shaped as of Session 5.2)
- `src/services/org/orgService.ts` — `getOrgProfile`,
  `updateOrgProfile`, `listIndustries`
- `src/services/org/invitationService.ts` — invitation
  lifecycle functions
- `src/services/org/membershipService.ts` — `listForOrg` for
  the org users view
- `src/app/api/auth/me/route.ts` — PATCH profile
- `src/app/api/orgs/[orgId]/profile/route.ts` — PATCH org
- `src/app/api/orgs/[orgId]/invitations/route.ts` — POST invite
- `src/app/api/orgs/[orgId]/users/route.ts` — GET users list
- `src/app/api/invitations/accept/route.ts` — POST accept
- `src/shared/schemas/organization/profile.schema.ts` — Zod
  patch schema
- `src/shared/schemas/user/invitation.schema.ts` — Zod
  invitation schemas

---

## 6. Work items

Nine work items organized across the five commits (§11).
Commit 2 has a founder review gate for the three new canvas
components' UX (field ordering, labels, save-button behavior,
error surfaces). Commit 4 has a founder review gate for the
onboardingSuffix prose change that introduces the skip-link
language.

### 6.1 Canvas directive type + schema extensions

**Files:**
- `src/shared/types/canvasDirective.ts` (modified) — add five
  new variants per Pre-decision 7.
- `src/shared/schemas/canvas/canvasDirective.schema.ts`
  (modified) — add matching Zod `z.object({...}).strict()`
  variants to the `canvasDirectiveSchema` discriminated union.

The ordering within both files: add the five new variants
between the Phase 1.1 "built" variants and the Phase 2+
"stubs" block, matching the existing comment structure. Don't
change the existing variants.

**Done when:** `pnpm typecheck` clean; the five new types are
reachable in the union from both consumers of
`CanvasDirective`.

### 6.2 UserProfileEditor canvas component

**File:** `src/components/canvas/UserProfileEditor.tsx` (NEW).

Fields per master §12.1: `firstName`, `lastName`, `displayName`,
`phone`, `phoneCountryCode`, `preferredLocale`,
`preferredTimezone`. Pre-fill from
`userProfileService.getProfile` via a client-side fetch or a
server component wrapper; execution decides based on which
fits the ContextualCanvas embedding model cleanly.

Save via `PATCH /api/auth/me`. Button states: idle, saving,
saved-confirmation. Inline validation via the existing
`updateUserProfilePatchSchema` (already `.strict()` per Phase
1.5A convention). Errors surface inline per field.

The Four Questions per master §12.1 surface as a short save
confirmation block (not a modal, not a separate screen — a
simple `<div>` visible after successful save).

**Done when:** form renders, submits, shows save confirmation,
handles Zod errors. Passes CA-75.

### 6.3 OrgProfileEditor canvas component + route-layer authorization

**Files:**
- `src/components/canvas/OrgProfileEditor.tsx` (NEW) — the
  form component itself, takes `orgId` as a prop.
- `src/app/[locale]/[orgId]/settings/org/page.tsx` (NEW) —
  server component that checks controller role per
  Pre-decision 5, redirects non-controllers, and renders
  `OrgProfileEditor`.

Fields per master §12.2: `name`, `legalName`, `industryId`
(dropdown from `listIndustries`), `businessStructure`,
`businessRegistrationNumber`, `taxRegistrationNumber`, `email`,
`phone`, `timeZone`, `defaultLocale`, `defaultReportBasis`,
`accountingFramework`. Pre-fill from
`orgService.getOrgProfile`.

Save via `PATCH /api/orgs/[orgId]/profile`. Same button-state +
validation pattern as §6.2. `baseCurrency` and
`fiscalYearStartMonth` are **not editable** (immutable
post-creation per Phase 1.5A convention; the Zod
`updateOrgProfilePatchSchema` is `.strict()` and rejects them).

**Done when:** form renders for controllers, non-controllers
redirect to `/[locale]/[orgId]/?forbidden=org-settings`,
submits through the existing API, handles the existing
ORG_IMMUTABLE_FIELD / ORG_UPDATE_FAILED / INDUSTRY_NOT_FOUND
error codes with user-facing messages. Passes CA-76.

### 6.4 OrgUsersView canvas component with inline invite form

**File:** `src/components/canvas/OrgUsersView.tsx` (NEW).

Table columns: user's display name (or email as fallback),
role badge, status badge, `is_org_owner` badge. Data source:
`GET /api/orgs/[orgId]/users` (existing). Read-only — no
inline edits or delete actions (Pre-decision 2 + master §22
exclusions).

"Invite" button toggles an inline form with:
- Email field
- Role dropdown (`executive | controller | ap_specialist`)
- Submit button

Submit posts to `POST /api/orgs/[orgId]/invitations`. On
success, render a readonly text input containing the invitation
token + a "Copy" button. On failure, surface the existing
error codes (USER_ALREADY_MEMBER, INVITATION_ALREADY_PENDING,
etc.) as inline messages.

The `invite_user` canvas directive opens the view with the
invite form pre-expanded. Implementation: the view takes an
optional `initialMode?: 'list' | 'invite'` prop; the directive
dispatch passes `'invite'`.

**Done when:** list renders with org members; invite form
expands and submits; token displays post-invite. Passes CA-77
+ CA-78.

### 6.5 Invitation Accept Page (server component, 5-state branching)

**File:** `src/app/[locale]/invitations/accept/page.tsx` (NEW).

Per Pre-decision 4. Parses `?token=` from searchParams, reads
auth session server-side, branches to the five states:

1. **Not signed in** → `redirect` to
   `/[locale]/sign-in?returnTo=/[locale]/invitations/accept?token=...`.
2. **Signed in, email matches, pending** → render the Accept
   CTA. A small client component handles the POST to
   `/api/invitations/accept` and the redirect on success.
3. **Signed in, email mismatches** → render the error page
   with "This invitation was sent to {email}. You're signed in
   as {different_email}. Sign out and sign in with the correct
   account." message.
4. **Signed in, token invalid** → render "This invitation is
   no longer valid."
5. **Signed in, token expired** → render "This invitation has
   expired."

The branching logic reads the invitation via
`invitationService.getByToken` (existing). **Ordering matters:**
the signed-in-but-not-matching check happens BEFORE the
token-validity check — the user should see "you're signed in
as the wrong account" before "this invitation is invalid" if
both apply. Rationale: the email-mismatch case is actionable
(sign out, re-sign-in); the invalid case is terminal.

**Done when:** all five states render correctly. Passes CA-79.

### 6.6 ContextualCanvas dispatch for the five new directive types

**File:** `src/components/bridge/ContextualCanvas.tsx`
(modified).

Extend the directive-type switch statement with cases for:
- `user_profile` → render `UserProfileEditor`
- `org_profile` → render `OrgProfileEditor` with
  `orgId={directive.orgId}`
- `org_users` → render `OrgUsersView` with
  `orgId={directive.orgId}` and `initialMode='list'`
- `invite_user` → render `OrgUsersView` with
  `orgId={directive.orgId}` and `initialMode='invite'`
- `welcome` → call `router.push('/[locale]/welcome')` as a
  side effect in a `useEffect`; render the `ComingSoonPlaceholder`
  as a fallback for the brief window before navigation

The existing directive handling (Phase 1.1 types) is
untouched. Phase 2+ stubs continue to render
`ComingSoonPlaceholder`.

**Done when:** all five new directive types route to the
correct view when dispatched via canvas state. Passes CA-80.

### 6.7 Route pages — thin wrappers

**Files:**
- `src/app/[locale]/settings/profile/page.tsx` (NEW) — thin
  wrapper around `UserProfileEditor`. Server component: reads
  auth, redirects unauthenticated users to sign-in.
- `src/app/[locale]/[orgId]/settings/org/page.tsx` — already
  covered by §6.3 (bundled because the route-layer auth is
  the primary logic).

The profile page is extremely thin (~15 lines): auth check +
`<UserProfileEditor />` render. The wrapper pattern keeps all
form logic in the canvas component so the agent's
`canvas_directive` + the avatar-dropdown nav (Session 7) both
reach the same code.

**Done when:** `/[locale]/settings/profile` renders the editor
for authenticated users, redirects to sign-in otherwise.

### 6.8 Onboarding skip-link UI + onboardingSuffix prose update

**Files:**
- `src/app/[locale]/welcome/page.tsx` (modified) — add a skip
  link visible at step 1 (conditional on
  `initialState.current_step === 1`). Clicking navigates to
  `/[locale]/settings/profile`. Hidden at step 2/3/4 per
  Pre-decision 3.
- `src/components/bridge/AgentChatPanel.tsx` (modified) — the
  skip link lives in the welcome page's layout, NOT inside
  AgentChatPanel. AgentChatPanel doesn't change in Session 6;
  the welcome page renders the skip link as a sibling element
  above or below the chat panel.
- `src/agent/prompts/suffixes/onboardingSuffix.ts` (modified)
  — step 1 prose updated to acknowledge the skip link now
  exists. Step 2/3/4 prose unchanged.

**Founder review gate applies at Commit 4** for the
onboardingSuffix prose change. The prior Session 5.1 phrasing
"a form-based org-setup isn't wired in for you right now" at
step 2 stays unchanged (still true — no org-creation form in
Session 6). Step 1's language changes to reflect the
available skip.

**Done when:** skip link renders at step 1; clicking
navigates; updated prose reviewed and approved. Passes
CA-81.

### 6.9 Stale `/admin/orgs` reference cleanup

**File:** `docs/03_architecture/ui_architecture.md` (modified)
at line 197.

Current row: `| /admin/orgs | 1.1 | Org creation with industry
CoA template selection |`.

Updated row: replace with `/[locale]/[orgId]/` as the post-auth
destination per Session 5's `resolveSignInDestination` + master
§14.5. Add a one-line note that `/[locale]/admin/orgs` still
exists as a Phase 1.1 historical artifact (the directory is
still present in `src/app/[locale]/admin/orgs/` — leaving the
code in place; only the doc's routing-table claim changes).

Two sub-brief-internal references at
`docs/09_briefs/phase-1.2/session-5-brief.md:572, 685` remain
stale — sub-brief frozen at 9c22e07, NOT amended. Flagged in
the EC-20 closeout entry for Session 8 reconciliation.

**Done when:** the routing-table entry in
`ui_architecture.md:197` reflects Session 5's landed behavior.

---

## 7. Exit Criteria

Twelve `S6-N` criteria.

| # | Criterion | Verification |
|---|---|---|
| S6-1 | Five new `CanvasDirective` type variants exported | `grep -c "type: 'user_profile'\|type: 'org_profile'\|type: 'org_users'\|type: 'invite_user'\|type: 'welcome'" src/shared/types/canvasDirective.ts` returns 5 |
| S6-2 | Five new Zod variants in `canvasDirectiveSchema` | Similar grep on the schema file |
| S6-3 | `UserProfileEditor` renders + saves via PATCH /api/auth/me | CA-75 |
| S6-4 | `OrgProfileEditor` renders for controller, redirects non-controller | CA-76 |
| S6-5 | `OrgUsersView` renders org members + invite form | CA-77 |
| S6-6 | Invite form posts + displays token | CA-78 (reuses CA-16 for the service-level test) |
| S6-7 | Invitation accept page handles all 5 states | CA-79 |
| S6-8 | `ContextualCanvas` dispatches all five new directive types | CA-80 |
| S6-9 | Skip link renders at onboarding step 1 and navigates | CA-81 |
| S6-10 | Route pages render their canvas components with auth checks | Manual smoke |
| S6-11 | Stale `/admin/orgs` reference in `ui_architecture.md:197` updated | `grep -n "/admin/orgs" docs/03_architecture/ui_architecture.md` returns 0 |
| S6-12 | Full regression: 238 baseline + new CA-74–81 = ~247 tests, 0 failures | `pnpm test` |

Covers EC-21, EC-23, EC-24, EC-25, EC-26.

---

## 8. Test delta

At least eight new tests (CA-74 through CA-81; numbering
continues from Session 5's CA-73 high water mark).

| # | File | Asserts |
|---|---|---|
| CA-74 | `tests/integration/canvasDirectiveSchemaExtensions.test.ts` | Zod parsing: each of the five new variants round-trips cleanly; unknown variant rejected |
| CA-75 | `tests/integration/userProfileEditorFlow.test.ts` | Render editor with seeded profile, submit a displayName patch, verify PATCH /api/auth/me call succeeds + DB row updated |
| CA-76 | `tests/integration/orgProfileEditorAuthz.test.ts` | Two it-blocks. (1) Controller loads the page and renders the form with pre-filled values. (2) Non-controller hits the page and is redirected with `?forbidden=org-settings` query flag |
| CA-77 | `tests/integration/orgUsersViewRender.test.ts` | OrgUsersView renders all active members for an org with role badges; non-member gets redirected/empty |
| CA-78 | `tests/integration/orgUsersViewInvite.test.ts` | Invite form submission: email + role → POST succeeds → token displayed. Integration test using the existing CA-16 invitation service flow as the backend |
| CA-79 | `tests/integration/invitationAcceptPageStates.test.ts` | Five it-blocks covering all five invitation-accept states (signed-out, email-match-pending, email-mismatch, invalid, expired). Uses test fixtures for invitation states rather than hitting real email |
| CA-80 | `tests/integration/contextualCanvasDirectiveDispatch.test.ts` | Dispatch each of the five new directive types via canvas state; assert the correct component renders (or in the `welcome` case, that router.push fires) |
| CA-81 | `tests/integration/onboardingSkipLinkFlow.test.ts` | Welcome page at step 1 renders a skip link pointing to `/en/settings/profile`; at step 2/3/4 the skip link is absent |

Execution MAY add sub-assertions or additional it-blocks per
Pre-decision 7 of Session 5 (test delta is a floor, not a
cap — same convention carries forward).

---

## 9. What is NOT in Session 6

- AgentChatPanel rewrite (Session 7) — the OnboardingChat seam
  inside the current panel stays intact; Session 7 consolidates
  both modes.
- ContextualCanvas click handlers for journal entries /
  accounts / canvas_context injection (Session 7).
- SuggestedPrompts functional implementation (Session 7).
- SplitScreenLayout onboarding mode (Session 7).
- Avatar dropdown + Mainframe Activity icon (Session 7).
- `canvasDirectiveSchema.card` tightening from `z.unknown()` to
  `ProposedEntryCardSchema` (Session 7).
- ProposedEntryCard migration to ADR-0002 policy_outcome
  (Session 7, EC-27).
- Params-shape enumeration in the system prompt (Session 7 —
  naturally paired with AgentChatPanel rewrite where rendered
  templates become visible).
- Reserved-template_id prompt-engineering tightening (Session
  7 — paired with params-shape).
- Email delivery for invitations (Phase 2).
- Pending invitations list (master §22 exclusion).
- Address management UI (master §22 exclusion).
- Role admin / suspend / reactivate / remove controls (master
  §22 exclusion).
- Avatar / logo upload UI (master §22 exclusion).
- MFA recovery codes (master §22 exclusion).
- `last_login_at` display in any editor — not part of §12.1
  field list.
- Master §14.1-14.6 UI changes other than the skip-link
  hook-up (all deferred to Session 7 unless explicitly named
  above).
- New migrations, new ActionNames, new ServiceError codes, new
  service functions.
- `/api/agent/message` or `/api/agent/confirm` changes.
- Session 5 sub-brief amendments (frozen at 9c22e07 — two
  internal `/admin/orgs` references stay stale pending Session
  8 reconciliation).

---

## 10. Stop Points for This Session

The execution session produces:

- `src/shared/types/canvasDirective.ts` (modified)
- `src/shared/schemas/canvas/canvasDirective.schema.ts`
  (modified)
- `src/components/canvas/UserProfileEditor.tsx` (NEW)
- `src/components/canvas/OrgProfileEditor.tsx` (NEW)
- `src/components/canvas/OrgUsersView.tsx` (NEW)
- `src/components/bridge/ContextualCanvas.tsx` (modified)
- `src/app/[locale]/settings/profile/page.tsx` (NEW)
- `src/app/[locale]/[orgId]/settings/org/page.tsx` (NEW)
- `src/app/[locale]/invitations/accept/page.tsx` (NEW)
- `src/app/[locale]/welcome/page.tsx` (modified — skip link)
- `src/agent/prompts/suffixes/onboardingSuffix.ts` (modified
  — step 1 prose)
- `docs/03_architecture/ui_architecture.md` (modified — line
  197)
- 8 new test files (`tests/integration/*.test.ts`)
- Updated `docs/07_governance/friction-journal.md`
  (session-close entry)

Stop after all 12 S6 exit criteria pass. Do **not** begin
Session 7.

---

## 11. Commit plan

Five commits. Commit 2 has a founder review gate for the three
new canvas components' UX. Commit 4 has a founder review gate
for the onboardingSuffix prose update. Every commit leaves
`pnpm typecheck && pnpm test` green.

- **Commit 1** — `feat(phase-1.2): canvas directive extensions (types + schema + ContextualCanvas dispatch)`
  Files: updated `canvasDirective.ts`, updated
  `canvasDirective.schema.ts`, updated `ContextualCanvas.tsx`.
  Components referenced in the dispatch switch are imported
  from lazy imports or wrapped in fallback
  `ComingSoonPlaceholder` until Commit 2 adds them — OR commits
  1 and 2 are bundled if the typecheck dependency is awkward.
  Execution decides based on how the import graph compiles.

- **Commit 2** — `feat(phase-1.2): canvas components — UserProfileEditor, OrgProfileEditor, OrgUsersView`
  **FOUNDER REVIEW GATE** for the three new components' UX:
  field ordering, labels, save confirmation prose, error
  surfaces, invite-form token display, role badges on the
  users list. Present rendered screenshots (or a live
  `pnpm dev` walkthrough) at the gate.

- **Commit 3** — `feat(phase-1.2): route pages + invitation accept`
  Files: new `src/app/[locale]/settings/profile/page.tsx`,
  new `src/app/[locale]/[orgId]/settings/org/page.tsx`, new
  `src/app/[locale]/invitations/accept/page.tsx`. Thin wrappers
  + the 5-state accept page's server-component branching.

- **Commit 4** — `feat(phase-1.2): onboarding skip-link + suffix prose update`
  Files: updated `src/app/[locale]/welcome/page.tsx`, updated
  `src/agent/prompts/suffixes/onboardingSuffix.ts`.
  **FOUNDER REVIEW GATE** for the onboardingSuffix prose
  change at step 1 (Pre-decision 3). Session 5.1's Commit 1
  gate is precedent: the prose is authored content and
  deserves a second pair of eyes.

- **Commit 5** — `test(phase-1.2): CA-74 through CA-81 + doc cleanup`
  Files: 8 new test files, updated
  `docs/03_architecture/ui_architecture.md:197`, updated
  `docs/07_governance/friction-journal.md` (session close).
  Full regression green.

If execution surfaces a reason to split or merge, do so — but
every commit must leave `pnpm typecheck && pnpm test` green.

---

*End of Phase 1.2 Session 6 Sub-Brief.*
