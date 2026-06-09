# Runbook — Mailbox → SharePoint live onboarding (combined operator setup)

**Status:** DRAFT — held under lock for advisor read-back. Gated operator tail of the
`mailbox-sharepoint-live` arc (Phase 2). These steps are **externally gated** — they require a real
Postmark account + a real Azure tenant / M365 SharePoint and are NOT performed by any agent. The
arc ships **UNIT-PROVEN** (the auth fix + selection + routing are wired and test-proven against
mocks); the **first live mailbox→SharePoint transfer is gated on completing this runbook**.
"Wired" is not "proven live."

**Audience:** operator/admin onboarding an M365-equipped org onto forwarded-mailbox ingestion that
files into the customer's SharePoint.

**Realizes:** charter `63729742` §5 Phase 2; depends on the Phase-1 code fix (charter `63729742` →
spec `acd6e451` → plan `8e4fcbaa` → Task 1 `8ebfb0cc` → Task 2 `1f461e0d` → follow-up `a463c73e`).

---

## What is already built (no action needed)

- **Auth (Phase-1 fix):** the inbound webhook authenticates via **HTTP Basic Auth** (username
  `postmark` + the `POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` password), constant-time compared. (It
  previously expected a Postmark HMAC signature that Postmark never sends — every delivery 401'd;
  that is fixed.)
- **Mailbox channel:** `POST /api/webhooks/postmark-inbound` → `resolveOrgFromMailboxHash` →
  `ingestionService.handleForwardedMailbox` → synchronous `ingestDocument`. Sender allowlist,
  `MessageID` idempotency, and the rejection taxonomy are live.
- **Storage selection:** ingest resolves the org's `default_storage_provider`
  (`resolveStorageProvider`, channel-agnostic) and stamps it; `byteFetch` dispatches on the row's
  provider. `sharepoint_drive` is reachable.
- **SharePoint provider:** the six `StorageProvider` methods (put-then-re-read SHA-256 integrity),
  app-only `Sites.Selected` cert auth — Charter B (a).

## Gated steps — perform in dependency order

### A. SharePoint live ops + org provisioning

Follow **`charter-b-sharepoint-onboarding.md`** steps 1–4 first (that runbook is the canonical
SharePoint-ops source; do not duplicate it here):

1. Azure app registration — `Sites.Selected` **only** (no broader `Files.*`/`Sites.*`).
2. Client certificate; set `GRAPH_TENANT_ID` / `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_CERT_PATH` on the
   deploy host (production Vercel scope).
3. Per-site grant on the customer's real SharePoint site.
4. Org provisioning: set the org's `org_settings.default_storage_provider = 'sharepoint_drive'` +
   `sharepoint_site_id` + `sharepoint_drive_id` (production DB).

(Do **not** run that runbook's step 5 `direct_upload` e2e as the proof — the mailbox discharge in
§C below supersedes it for this arc, exercising the mailbox channel + SharePoint together.)

### B. Postmark inbound + Basic Auth

5. **Postmark account + inbound stream.** Create the inbound server/stream. Configure the inbound
   domain (custom domain with MX → Postmark, or the Postmark-provided inbound address).
6. **Basic Auth credential.** Choose a strong password. It must be set **identically** in two
   places (they must match or every delivery 401s):
   - **Vercel env** `POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` — scopes **Production + Preview +
     staging** (mirror the Upstash scoping). ⚠️ **Deploy-ordering:** this var is **boot-required**
     (`assertEnv`); it must exist in the deployed Vercel env **before or with** the code deploy, or
     the app **fails to boot** (the "required-var-missing-on-deploy" class the production-promotion
     arc hit). Also update local `.env.local` for integration tests.
   - **Postmark webhook URL** — embed the credential in the URL (Postmark transmits it as
     `Authorization: Basic`):
     ```
     https://postmark:<password>@chounting.chou.ca/api/webhooks/postmark-inbound
     ```
     ⚠️ **The username must be exactly `postmark`.** It is a fixed code constant. A different
     username 401s **every** delivery, surfaced only as a uniform `forwarded_mailbox.auth_invalid`
     audit — a silent, hard-to-diagnose "all deliveries rejected" failure (the same symptom as the
     bug this arc fixed, from a config mismatch). Spell out the username; don't just "set the
     password."
7. **IP allowlist (defense-in-depth) at the Vercel Firewall**, NOT in app code: allow Postmark's
   published webhook IP ranges (`postmarkapp.com/support/article/800-ips-for-firewalls`; these
   change over time → operator-maintained, which is why they are not hardcoded). The Next
   middleware deliberately excludes `/api`, so this belongs at the platform edge.
8. **Forwarding address / MailboxHash = org_id UUID** (v1 convention). Postmark splits the
   plus-addressing tag into `MailboxHash`; the resolver UUID-parses it to the org. Address form:
   ```
   <anything>+<org-uuid>@<inbound-domain>
   e.g.  inbound+550e8400-e29b-41d4-a716-446655440000@inbound.chounting.com
   ```
   The org-uuid is the `org_settings` org from step 4. Give the customer this address to forward to.
9. **Sender allowlist.** The sender's `From` address must be in `internal_sender_allowlist` for the
   org, or the document is **rejected** (`200` + `rejected_not_allowlisted` audit, not ingested).
   Add the forwarding users' addresses.

### C. Verification — the combined live discharge

10. From an **allowlisted** sender, forward a test email **with an invoice attachment** to the
    SharePoint-provisioned org's plus-address (§B step 8). Confirm:
    - a `source_documents` row lands with **`storage_provider = 'sharepoint_drive'`**, and
    - the **bytes are present in the customer's SharePoint** library.

    This single event proves **auth + mailbox channel + live SharePoint put** at once — the first
    **PROVEN-LIVE** evidence for mailbox→SharePoint. Until it passes, the status is **reachable +
    unit-proven, live transfer gated.**

## Operator flags (read before running)

- **Synchronous latency.** One webhook does **N+1 sequential live Graph puts** (one per file:
  email body + N attachments; each an upload **+ a SHA-256 re-read** = two Graph round-trips)
  **then** one `ingestDocument` run (OCR + classify + match) — all before the `200`. A 3-attachment
  email = 4 puts × (upload+re-read) + the pipeline inside Postmark's webhook-timeout window. It may
  exceed the timeout → Postmark **retries** → `MessageID` **idempotency** dedupes (no double-ingest,
  just exercised more). **Verify Postmark's actual webhook-timeout value at setup time** (do not
  assume) and expect retry behaviour.
- **Orphan blobs on a failed batch.** A mid-batch `put` failure (or a failed atomic RPC after
  successful puts) leaves the already-written bytes orphaned **in the customer's SharePoint** — v1
  **accepts** this (ADR-0013 items 1/4; **no GC runs in v1**). More visible than a Supabase orphan;
  expect occasional stray files on failures.
- **Multi-attachment picking gap.** A multi-attachment forward ingests **all** attachments, but the
  pipeline classifies one **primary** source per case; picking the right primary among several is a
  banked follow-up — multi-attachment mail is accepted but not fully handled.
- **Real customer production.** This runs against a real customer SharePoint tenant — higher care.
  UNIT-PROVEN ≠ PROVEN; the §C discharge is the proof.

## What this runbook is NOT

The actual ops (Postmark account, Azure registration, cert, per-site grant, env vars, the live
forward-and-verify) are the operator's (Phil's) — no agent can perform them. The push of the arc's
commits (`42fa8277..HEAD`) and the lock release remain Phil's at arc close.
