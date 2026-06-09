# Charter — Mailbox → SharePoint live (auth-model fix + combined onboarding)

**Status:** RATIFIED 2026-06-08 (advisor-cleared the verification seat; ratify + commit-under-lock
delegated to the executor per read-back). rev.2 folds the grounded enumeration — item 5 confirmed
first-hand from disk (N+1 `storageProvider.put()` + one batch RPC, not `createSourceDocument`),
item 2 attachment-only edge, item 6 latency sharpened. Committed under lock
`mailbox-sharepoint-live`. Push (`42fa8277..HEAD`) + lock-release remain Phil's.
**Anchored at:** `staging == origin/staging == 42fa8277` (re-baselined this session;
all code read `[disk]` first-hand). Reflog/log tail confirms the two shipped Charter B
arcs (real-flow `ac8bd7ca..3796de62`; PROVEN-LIVE `eb9c431e..42fa8277`).
**Coordination:** session lock `mailbox-sharepoint-live`.
**Provenance legend:** `[disk]` grounded first-hand this session; `[docs]` Postmark
primary documentation (cited); `[design]` a steer to be settled by the spec; `[adr]`
fixed by a ratified ADR.

This is a **code arc** (charter → spec → plan → execute), not a docs-only task. The
runbook (Phase 2) is gated behind a real code fix (Phase 1), because the mailbox
channel does not work today.

---

## 1. The bug (load-bearing)

`POST /api/webhooks/postmark-inbound` rejects with **401** any request lacking a valid
`X-Postmark-Signature` header equal to `HMAC-SHA256(rawBody, POSTMARK_INBOUND_WEBHOOK_SECRET)`
as a hex digest, compared constant-time (`route.ts:70-90`, `:208-232`). `[disk]`

**Postmark inbound webhooks send no such signature.** Postmark's webhook security model
is **(a) HTTP Basic Authentication** (credentials embedded in the webhook URL → an
`Authorization: Basic …` header) and **(b) IP allowlisting** against Postmark's published
webhook IP ranges. There is no body-signing secret, no signature header, no per-request
HMAC. `[docs]`

**Consequence:** every real Postmark delivery 401s at step 2; nothing reaches
`resolveOrgFromMailboxHash` → `ingestionService.handleForwardedMailbox` → `ingestDocument`.
The forwarded-mailbox channel has **never received real mail.** `[disk][docs]`

**Why it slipped:** the route-level integration test
(`forwardedMailbox.handleForwardedMailbox.integration.test.ts`) **mints the signature
itself** — `createHmac('sha256', TEST_SECRET).update(body).digest('hex')` (`:105-115`) —
so it green-lights a fictional signing client. Test #2 (`:339`) exercises the 401 path with
a deliberately-wrong signature. The test validates the wrong contract; it cannot catch the
mismatch because it constructs exactly the header the code expects. `[disk]`

This is the **same class of bug we are fixing**: an auth contract designed against an
imagined provider behavior rather than the real one. The replacement auth MUST match
Postmark's documented behavior, verified against primary docs — not a second invented scheme.

## 2. Confirmed blast radius `[disk]`

The code change is small and contained:

- **Signature logic is local.** `verifyPostmarkSignature` is defined and used only in
  `route.ts` (def `:70`, call `:210`). No shared helper; grep finds no other occurrence.
- **One webhook handler.** `apps/web/src/app/api/webhooks/postmark-inbound/route.ts` is the
  **only** file under `app/api/webhooks/`. No sibling copies the pattern.
- **Env var is confined.** `POSTMARK_INBOUND_WEBHOOK_SECRET` is defined in `shared/env.ts`
  (`REQUIRED_SERVER` `:25` + export `:67`) and consumed only at `route.ts:213` (plus a
  comment reference in the integration test). Boot-required (`assertEnv` fatals if missing).
- **Tests touching the path:** route-level `forwardedMailbox.handleForwardedMailbox.integration.test.ts`
  (imports `POST`, self-mints the HMAC); unit `schemas.forwardedMailbox.test.ts`; service-unit
  `forwarded_mailbox.serviceComposition.test.ts`.

Touched by the fix: the one route file, the one env var, the one route integration test
(**rewrite**, not extend), and the `.env.local` / `.env.example` fixture for the new
credential. The route's header comment + `verifyPostmarkSignature` doc comment (which assert
the false "Postmark signs the body" claim) are corrected as part of the fix.

## 3. Disk-vs-instruction mismatches (surfaced, not papered over)

1. **"The mailbox tests appear service-level only" is not quite right.** One test *is*
   route-level (imports the route `POST`), but it self-mints `X-Postmark-Signature`, so it
   tests a fictional contract. The fix **rewrites** this test to the Basic Auth contract;
   it does not merely "add route-level coverage."
2. **Code comments assert false Postmark behavior.** `route.ts:63-68` and `:92-100` state
   Postmark HMAC-signs the body. Corrected as part of the fix.
3. **A SharePoint onboarding runbook already exists** (`runbooks/charter-b-sharepoint-onboarding.md`).
   Phase 2 produces a *combined* mailbox→SharePoint runbook; the spec decides extend-in-place
   vs new-`mailbox-sharepoint-onboarding.md` (lean: new combined doc that cross-references the
   SharePoint one, per the user's named deliverable).

## 4. Operator-gated vs code split

- **Code (in-arc, agent):** replace HMAC verification with Postmark-native auth; settle the
  `POSTMARK_INBOUND_WEBHOOK_SECRET` disposition; update the rejection taxonomy; rewrite the
  route auth test against the real contract; correct the false comments.
- **Operator-gated (Phil's; Phase-2 runbook documents, does not perform):** Postmark account
  + inbound stream; Basic Auth credentials set in both the Postmark webhook URL and the Vercel
  env (Production + Preview + staging, mirroring Upstash scoping per `env.ts:7-18`); SharePoint
  Azure `Sites.Selected` app + client cert + `GRAPH_*` in the production Vercel scope + per-site
  grant on the customer's real site; `org_settings` provisioning
  (`default_storage_provider='sharepoint_drive'` + `sharepoint_site_id`/`drive_id`); the live
  forward-a-test-email discharge.

## 5. Phase structure

### Phase 1 — code auth fix (spec → plan → execute, under the lock)

**Spec opens with a downstream-path soundness check (refinement from read-back).** The exact
condition that hid the HMAC bug — a path never exercised against its real contract — applies to
the *whole* mailbox→SharePoint chain, not just auth. Before treating "auth fixed" as "code half
done," the spec sanity-checks the chain `route → handleForwardedMailbox → createSourceDocument →
SharePoint put → byteFetch` for other latent provider-contract or never-combined-live
assumptions, and enumerates explicitly what the live discharge exercises **for the first time** —
so the discharge is eyes-open rather than "auth was surely the only problem." First-cut
enumeration (confirm/extend in the check; provenance tagged):

1. Real Postmark **Basic Auth** against the fixed handler — never run live (the bug). `[disk]`
2. A **real Postmark inbound payload** (plus-addressed MailboxHash, base64 attachments,
   TextBody/HtmlBody) through the `.passthrough()` Zod schema — first real Postmark shape. The
   schema is deliberately `.passthrough()` (not `.strict()`), so Postmark's extra fields (FromFull,
   ToFull, Headers, MessageStream, …) won't 400 — real-but-low-risk. **One edge to weigh:** the
   `.refine()` requires `TextBody` **or** `HtmlBody`, so an **attachment-only forward with an empty
   body** would 400 (`malformed_payload`) — a plausible real-world shape. `[disk]`
3. `handleForwardedMailbox` against a **real (non-mocked) storage provider** — the integration
   test mocks the resolver to `supabase_storage` (`vi.mock('@/services/storage/resolver')` + a
   `put` returning `provider:'supabase_storage'`), so the mailbox batch path has only ever touched
   a mock. `[disk]`
4. The **mailbox channel + a live SharePoint Graph put, combined** — proven only separately: the
   integration test mocks the provider; the PROVEN-LIVE harness proves `direct_upload`→SharePoint
   (`ingest_channel:'direct_upload'`), not the mailbox channel. `[disk]`
5. **Multiple SharePoint puts in one synchronous webhook** — confirmed first-hand:
   `handleForwardedMailbox` builds `orderedFiles = [email_body, ...attachments]` and issues one
   `storageProvider.put()` per file in a sequential loop, then a single
   `create_ingest_batch_with_documents_with_audit` RPC for all N+1 documents (it does **not** call
   `createSourceDocument` — that is the single-doc RPC path). Provider is resolved once
   (`resolveStorageProvider(org_id)`, which is channel-agnostic), so for a SharePoint-default org a
   mailbox email with N attachments = **N+1 sequential live Graph puts**, versus the PROVEN-LIVE
   harness's single put. `[disk, resolved]`
6. The **full synchronous `ingestDocument` pipeline** (Modal OCR + Claude) running inline in the
   webhook **once** (on the primary ingest source, post-RPC) — after the N+1 puts. Each put is an
   upload **+ a SHA-256 re-read** (two Graph round-trips), so one 3-attachment email = 4 puts ×
   (upload+re-read) + one pipeline run, all before the 200. The PROVEN-LIVE harness exercises put +
   byteFetch only, not the pipeline. This materially sharpens the §6 latency flag. `[disk]`

The check is cheap (reads, no live calls) and is the disciplined extension of this bug's own
lesson; any Phase-1 code scope it surfaces is folded into the spec, not discovered live.

The **spec** then settles against disk:

- **Auth design.** `[design]` steer: **Basic Auth + IP allowlist (defense-in-depth)**, with the
  IP-allowlist enforced **at the edge** (Vercel firewall / middleware), not in route code — the
  spec should *lean edge*: Postmark's IP ranges change over time `[docs]`, and hardcoding changing
  IPs into the handler is the same drift-bug class this arc exists to fix. The spec may still
  document IP enforcement as an operator step if edge enforcement isn't wired in-arc; what it must
  not do is bake changing IPs into application code.
- **`POSTMARK_INBOUND_WEBHOOK_SECRET` disposition.** Repurpose as the Basic Auth password
  (fixed username, minimal env churn across three Vercel scopes) **vs** rename for semantic
  clarity (e.g. `POSTMARK_INBOUND_BASIC_AUTH`). Spec decides. `[design]`
- **Rejection-taxonomy changes.** Row 1 "HMAC signature invalid → 401" becomes "Basic Auth
  invalid/absent → 401"; the audit action (`forwarded_mailbox.signature_invalid`) is renamed
  or repurposed accordingly. The other seven rows are unaffected. `[disk]`
- **Route-handler auth test coverage.** Rewrite the existing route test to exercise a
  **realistic** Postmark request shape (valid Basic Auth → accepted; missing/wrong Basic Auth
  → 401). This is the regression that would have caught the original bug.
- **URL-credential handling (flag).** Basic-Auth-in-URL means the password lives in the Postmark
  webhook config and is transmitted as `Authorization: Basic`. Treat it as a rotatable secret;
  never log the `Authorization` header; note the leak surface in the spec and runbook.

Then **plan → execute** with per-task read-back; closest advisor attention on (a) the new auth
matching Postmark's real contract and (b) the test exercising a realistic Postmark request.

### Phase 2 — gated operator tail (combined runbook)

Produce the combined onboarding runbook documenting, in dependency order: SharePoint live ops →
org provisioning → Postmark account/stream + Basic Auth creds + webhook URL
(`https://chounting.chou.ca/api/webhooks/postmark-inbound`) + the MailboxHash = org_id UUID
plus-addressing convention (`<anything>+<org-uuid>@inbound.<domain>`, confirmed against Postmark
plus-addressing docs `[docs]`). **Verification = the combined discharge:** forward a test email
to a SharePoint-provisioned org; confirm a `source_documents` row lands with
`storage_provider='sharepoint_drive'` and bytes in the customer's SharePoint. That single event
proves auth + mailbox + live SharePoint at once.

## 6. Surfaced, not decided

- **Synchronous full-pipeline latency (sharpened by the §5 soundness check).** One webhook does
  **N+1 sequential live Graph puts** (one per file: email_body + N attachments; each an upload **+
  a SHA-256 re-read** = two Graph round-trips) **then** one `ingestDocument` run inline (OCR +
  classify + match) — all before the 200. A 3-attachment invoice email to a SharePoint org = 4
  puts × (upload+re-read) + the pipeline inside Postmark's webhook-timeout window. Total likely
  exceeds the timeout → Postmark retries → `MessageID` idempotency dedupes (mitigation holds,
  exercised more). Existing posture (mailbox-finish), not introduced here; works pre-Phase-7. The
  runbook flags it; verify Postmark's actual webhook-timeout value at ops time (do not assert from
  memory) and expect retry behavior.
- **Orphan-blob on a failed batch = accepted risk per ADR-0013.** `put` succeeds, then the
  `source_documents` INSERT runs in `withInvariants`; an INSERT failure leaves the bytes
  orphaned. **v1 explicitly accepts orphan-blob risk; GC is owned by ADR-0014 (post-v1)**
  (ADR-0013 Status Item 4 + items 1/9). `[adr]` For a SharePoint-default org the orphan lands
  in the *customer's* SharePoint library (more visible than a Supabase orphan) — surfaced for
  real-customer-prod awareness, not re-litigated.
- **Multi-attachment picking gap.** The handler passes **all** attachments through
  (`route.ts:312`); primary-doc picking among multiple is the banked prioritized follow-up.
  Still applies; not in arc.
- **Real-customer production SharePoint.** The discharge runs against a real customer tenant —
  higher care. Unit/test-proven is readiness, not proof.

## 7. Boundaries

- **In-arc deliverable:** the auth fix works against Postmark's real contract
  (correct-and-tested) **+** the combined runbook.
- **NOT in-arc:** the live ops + the green discharge (Phil's; no agent can perform them).
- **UNIT/test-PROVEN ≠ PROVEN.** A passing route-handler auth test is readiness, not proof
  that real Postmark mail flows end-to-end.
- **Push (`42fa8277..HEAD`) + lock-release are Phil's** at arc close, per push-terminal-close.
  The stack banks locally until the three-condition gate clears.

## 8. Read-back asks

Closest attention on: (1) §1's bug statement + §2's blast radius match disk; (2) §3's
mismatches are accurate (esp. the test-contract correction); (3) the Phase-1 spec scope in §5
is the right cut — the **downstream-path soundness check + never-combined-live enumeration**
open the spec, auth design **leans edge** for IP-allowlist, and env disposition + taxonomy +
test rewrite + URL-cred flag follow; (4) §7 boundaries hold the UNIT-PROVEN≠PROVEN line.
