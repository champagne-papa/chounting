# Phase 6 Chunk 6.3a Brief — Forwarded Mailbox Ingestion (Postmark Inbound)

- **Date:** 2026-05-15
- **Phase:** Phase 6 (Ingestion)
- **Chunk:** 6.3a (Path C first-half: forwarded_mailbox implementation; chunk 6.3b ships Phase 6 retrospective + merge-to-main)
- **Status:** brief-drafting → execution-session-pending
- **Brainstorming session:** chunk 6.3a brainstorming closed 2026-05-15. 8 sub-Q locks (Sub-Q3 cascade-closed by Sub-Q2). 19 active RI candidates carried forward. 24 codification candidates accumulating at Phase 6 retrospective (chunk 6.3b consolidation). Path C invocation precedent at chunk 6.3 grain graduates the brief-grain Na/Nb convention to N=2 observation-grain via sibling-convention (impl-vs-synthesis fault line; sibling to chunk 6.2's substrate-vs-feature fault line).

## Path C second-half context

Chunk 6.3a is the first-half of Path C invocation at chunk 6.3 grain (Sub-Q1 lock). Chunk 6.3a scope: forwarded_mailbox ingestion via Postmark webhook + minimum cards-UI discovery extension per Sub-Q10. Chunk 6.3b scope: Phase 6 retrospective consolidation + merge-to-main. Two chunks ship sequentially; merge-to-main fires at chunk 6.3b close.

**Brief-grain Na/Nb convention.** Chunk 6.3a is the first half of an impl-vs-synthesis fault-line split. This is a sibling convention to chunk 6.2's substrate-vs-feature fault line (chunk 6.2a substrate-consumer-conformance + chunk 6.2b drag-drop end-to-end). At Phase 6 retrospective, the convention codifies as two fault-line families (substrate-vs-feature N=1; impl-vs-synthesis N=1); each remains available for graduation if future phases surface a same-family second instance.

**LOC forecast.** Recalibrated 2000-3500 LOC per Flag 16 (chunk 6.2b 97%-over-upper-bound overshoot inheritance). Forecast is soft; chunk 6.3a may undershoot or overshoot. Per chunk 6.2b precedent test-count anchor: 1086 baseline + ~15 new tests (7 integration webhook + 4 endpoint/UI Option B + 4 unit schema/service) ≈ 1101 ±2 at chunk 6.3a close.

## Goal

Ship the forwarded_mailbox ingestion channel end-to-end:

- Postmark inbound webhook handler at `/api/webhooks/postmark-inbound/route.ts` (first webhook in /api/webhooks/ convention)
- HMAC-SHA256 signature verification + Zod-validated Postmark payload (pre-parsed JSON; no MIME parser library)
- Hardcoded internal-sender allowlist via DB table (founder + 2 real users seed) with service-layer enforcement
- Atomic per-email batch creation via existing chunk 6.1 RPC (`create_ingest_batch_with_documents_with_audit`); writes 1 batch + N+1 source_documents + 1 case + 1 case_sources (role='email_body') + N+1 jobs + 1 audit row
- Idempotent duplicate-message_id handling via Layer 1 partial UNIQUE index
- Audit-logged rejection paths (signature invalid → 401; allowlist reject → 200 silent drop; invalid recipient → 200 silent drop; malformed payload → 400)
- Minimum cards-UI discovery extension (Sub-Q10 Option B): cards endpoint optional `ingest_batch_id` + DocumentIntakeRail mount-fetch recent cards

Walkable proof: operator forwards email to `inbound+<org-slug>@inbound.chounting.com` with N attachments. Within seconds, Postmark webhook fires, batch ingests atomically. Operator opens chounting web app; DocumentIntakeRail mount-fetch renders the N+1 cards (1 email_body + N attachments) in the idle state's recent-cards list. Phase 7 will classify each card post-ship.

## Sub-Q resolutions

### Sub-Q1: Path C invocation at chunk 6.3 grain — LOCKED Path C split

**Lock:** chunk 6.3a (forwarded_mailbox implementation) + chunk 6.3b (Phase 6 retrospective + merge-to-main).

**Verify-from-disk evidence:**
- Path C precedent at chunks-1-6 + Phase 4 grain (RI-7 + F-J-14 tier-1); N=2 observation-grain after chunk 6.3 split.
- Chunk 6.2b actual LOC: 2335 vs 785-1185 forecast (97% over upper bound; Flag 16 inheritance).
- Three Path C invocation criteria per RI-7: volume estimate exceeds single-session band (likely YES at recalibrated 2000-3500), framing-revisits at scope-lock (undetermined; likely below N≥3), substantively-novel-logic scope (YES — three first-instance precedents bundled: webhook handler + MIME parser integration + allowlist enforcement).

**Reasoning chain:**
1. Volume-vs-budget arithmetic: recalibrated 2000-3500 LOC bundled would strain single-session reliable delivery under retrospective time pressure.
2. Synthesis-vs-locks framing protection: Phase 6 retrospective consolidation is synthesis-of-already-decided (24 codification candidates accumulating); bundling synthesis with new-locks-heavy forwarded_mailbox impl risks lossy synthesis.
3. First-instance precedent attention budget: forwarded_mailbox bundles three first-instance precedents (webhook handler / MIME parser / allowlist surface); each warrants Grain 5 prospective scan + codification consideration.
4. Brief-grain Na/Nb codification pathway: chunk 6.3 split graduates the convention to N=2 observation-grain (sibling-convention by fault-line family).
5. Merge-to-main natural boundary: chunk 6.3b close fires merge-to-main at natural phase-close marker.

**Rejected options:**
- Single commit (a): late-session pressure to skip retro-consolidation depth; codification graduations rushed.
- Three-way split (c): no precedent; anti-pattern.
- Single commit + separate merge (d): degenerate variant of (a) without semantic difference.

**Sub-Q1 disposition note at Sub-Q10 grain.** Sub-Q1's "server-only" framing at session start scoped to new affordances (no new drag-drop UI; no new visual paradigm). Sub-Q10 walk surfaced that cards-UI discovery mechanism requires a Grain 5 fifth-grain extension via cards endpoint optional batch_id + DocumentIntakeRail mount-fetch (Option B). Path C split holds; "server-only" refined at Sub-Q10 grain to scope to affordance-kind, not discovery-mechanism. Cards endpoint + DocumentIntakeRail receive minimum extensions per Sub-Q10 lock.

### Sub-Q2: Mail provider integration — LOCKED Postmark inbound (Sub-Q3 cascade-closed)

**Lock:** Postmark inbound with bundled sub-decisions:
- (i) Webhook URL: `/api/webhooks/postmark-inbound/route.ts` (new `/api/webhooks/` directory convention)
- (ii) Sync processing: webhook handler does full HMAC verify + Zod validate + allowlist check + storage puts + atomic RPC; responds 200 after success
- (iii) Layer 1 message_id idempotency via partial UNIQUE index (migration 155)
- (iv) No raw MIME storage by us at v1; Postmark's 45-day retention suffices

**Verify-from-disk evidence:**
- spend_initiative.md §8.6: provider choice fully open. "v1 serves founder + two real users only."
- Zero existing webhook handlers in /api/ (first-instance precedent valid).
- Zero mail-related dependencies in package.json (root + apps/web).
- ADR-0011 reserves `forwarded_mailbox` enum; no provider locked.
- ADR-0013 specifies uniform `org_{org_id}/sources/...` storage path.

**Reasoning chain:**
1. §8.6 imposes no constraint; provider choice fully chunk 6.3a discretion.
2. Postmark provides pre-parsed JSON (From, To, Subject, MessageID, MailboxHash, TextBody, HtmlBody, Attachments[]). Sub-Q3 cascade-closes — no MIME parser library needed.
3. Cleanest webhook contract for first-instance precedent: HTTP POST + JSON + HMAC-SHA256. Sets template for future third-party webhooks.
4. v1 economics trivially met: ~$0.19/month at "founder + 2 users" volume.
5. Replay via provider: 45-day MIME retention at Postmark suffices for v1 forensic window.
6. Next.js App Router native: zero new dependencies; `Request.text()` + `crypto` stdlib + `JSON.parse()` + Zod.

**Rejected options:**
- SES inbound: provider-side parsing not native; requires SNS+S3 plumbing; client-side MIME parser library required (does not collapse Sub-Q3).
- Mailgun routes: parsing configurable but webhook contract less clean than Postmark.
- Cloudflare Email Routing: Workers-native; awkward fit in Next.js App Router project.
- Custom MX (self-host SMTP): infrastructure burden; way too much for v1.

**Sub-Q3 cascade closure.** Postmark's pre-parsed JSON payload eliminates the MIME-parser-library decision. `PostmarkInboundWebhookSchema` validates the payload shape directly (Sub-Q6 Artifact 2). Per cascade-closed sub-Q folding convention (chunk 6.3a precedent-setting tier-2 codification candidate), Sub-Q3 has no separate lock section; the closure is documented in-place.

**Vendor lock-in forward-pointer (tier-2 friction-journal):** PostmarkInboundWebhookSchema + service-layer adapter shape is intentionally Postmark-coupled at v1. If Q41 / Phase 2.5+ surfaces multi-provider need, the brief at that point will design the provider-abstraction layer. Pre-empts future "we should have made it provider-agnostic" retrospective regret.

### Sub-Q4: Allowlist enforcement — LOCKED Layer 2 service-enforced via internal_sender_allowlist DB table

**Lock — 11 sub-decisions:**

| Sub-lock | Decision |
|---|---|
| Validated field | `From` header (Postmark `From` parsed), `.toLowerCase()` normalized |
| Case sensitivity | Case-insensitive; store lowercase in seed, compare lowercase per `invitationService` precedent |
| Layer placement | Layer 2 (service-enforced) per ADR-0008 (policy not physics) |
| Audit emission path | Direct service via `recordMutation` (NOT new pure-audit RPC) |
| Audit `action` | `forwarded_mailbox.rejected_not_allowlisted` (dot-namespaced) |
| Audit `entity_type` | `forwarded_mailbox` (open TEXT; new value; no Layer 1 broadening) |
| Audit `entity_id` | `null` (no entity affected) |
| Audit `before_state` | `{from, to, subject, message_id, attachment_count: number \| null, reason: 'sender_not_in_allowlist'}` JSONB |
| Audit `after_state_id` | `null` |
| Rejection response | 200 + JSON body `{status: 'rejected', reason: 'not_allowlisted'}` |
| Migration | 155 bundles message_id idempotency + allowlist table + seed (multi-statement migration; chunk 6.2a precedent) |

**Verify-from-disk evidence:**
- spend_initiative.md §8.6: "seed data in the AP subdomain migration; controllers cannot edit it via UI in v1; founder + two real users."
- audit_log `action`/`entity_type` are open TEXT (no Layer 1 ENUM/CHECK); new values land without amendment.
- Pattern B pre-RPC validation precedents: `getMembership()` + `canUserPerformAction()` + `vendorPrepaymentService` state-set check.
- ADR-0008 layer placement: policy-grade runtime checks land at Layer 2 service.
- `invitationService.ts` precedent: `.toLowerCase()` at service entry for email comparison.

**v1 allowlist mutability shape.** Migration-only at v1; no UI editing surface (per Sub-Q10 confirmation of server-only constraint). Allowlist mutations between rejection and provider retry don't violate any invariant at v1 scale.

**`attachment_count: number | null` discipline.** Use `null` when payload parse failed (Postmark sent garbage) vs `0` for "0 attachments." Preserves "we couldn't determine" vs "we determined zero" distinction.

### Sub-Q5: Email_body case_sources write timing — LOCKED Option D

**Lock:** Caller-constructed `p_case_sources` 1-element array at service layer; existing chunk 6.1 RPC unchanged.

**Verify-from-disk evidence:**
- `'email_body'` is current-valid at Layer 1 CHECK (`document_case_sources_role_v1_active` includes it).
- Chunk 6.1 RPC `create_ingest_batch_with_documents_with_audit` already writes document_case_sources via `p_case_sources` JSONB array (migration 152 lines 547-563).
- Migration 152 lines 91-94 document Phase 6 vs Phase 7 division of labor explicitly: "Phase 6 writes case_sources for email_body role only; Phase 7 post-classification writes primary/supporting/payment_evidence."

**Sub-decisions:**

| Sub-lock | Decision |
|---|---|
| Substrate changes | None |
| RPC amendment | None |
| Layer 1 broadening | None (`'email_body'` already v1-active) |
| `p_case_sources` shape at chunk 6.3a | 1-element array: `[{id, document_case_id, source_document_id, role: 'email_body', trace_id, created_by}]` |
| UUID generation | Pre-generated at service layer per chunk 6.2b drag-drop convention |
| `source_document_id` mapping | Pre-generated UUID of email_body source_document at p_documents[0] (explicit positional convention) |
| `created_by` value | `'ingestionService.handleForwardedMailbox'` (mirror chunk 6.2b pattern; verify at task plan) |
| Phase 7 forward-pointer | Documented: "case_sources rows for non-email_body roles deferred to Phase 7 per chunk-6.1-RPC division-of-labor" |

**Positional convention code comment requirement** at service-method array-construction site:

```typescript
// p_documents[0] is the email_body source_document; subsequent indices are attachments.
// p_case_sources[0].source_document_id references p_documents[0].id.
// Phase 7 will write p_case_sources for indices 1..N as attachment-role rows post-classification.
```

**Flag 5 disposition update.** Flag 5 (Phase 6 vs Phase 7 division of labor) carries forward to Phase 6 retrospective with status: ratified-by-Sub-Q5-lock at chunk 6.3a.

**document_case_sources vs source_document_links distinction.** These are distinct tables (migration 145 vs migration 147; case-grain vs polymorphic entity-grain per ADR-0016). Conflation in prior memory entries surfaced during Sub-Q5 walk; codified as Flag 19 (tier-3) terminology hygiene at retrospective.

### Sub-Q6: Zod schema branch — LOCKED three artifacts

**Lock:** Three artifacts at chunk 6.3a:

**Artifact 1: ForwardedMailboxChannelMetadataSchema** (our-shape; extends `ingestBatch.schema.ts` discriminated union).

```typescript
export const ForwardedMailboxChannelMetadataSchema = z
  .object({
    from: z.string().email(),
    to: z.string().email(),
    subject: z.string(),
    message_id: z.string().min(1),
    attachment_count: z.number().int().min(0),
  })
  .strict()
  .refine((v) => !('sentinel' in v), {
    message:
      'sentinel-shape channel_metadata is not a valid ingestion event (valid forwarded_mailbox channel_metadata requires from/to/subject/message_id/attachment_count fields; see ingestBatch.schema.ts symmetric-filter discipline)',
  });
```

Composed into IngestBatchChannelMetadataSchema discriminated union as `forwarded_mailbox` branch.

**Sub-decisions:**
- 5 canonical fields (from, to, subject, message_id, attachment_count); raw_headers EXCLUDED.
- `from` / `to` stored as-received (no Zod-level normalization); service-layer normalizes for allowlist comparison only.
- Dual-layer sentinel rejection (`.strict()` + `.refine()`) mirroring DragDropChannelMetadataSchema precedent.

**Artifact 2: PostmarkInboundWebhookSchema** (third-party-payload; new file `apps/web/src/shared/schemas/document-platform/postmarkWebhook.schema.ts`).

```typescript
export const PostmarkAttachmentSchema = z.object({
  Name: z.string(),
  Content: z.string(),  // base64-encoded
  ContentType: z.string(),
  ContentLength: z.number().int().min(0),
});

export const PostmarkInboundWebhookSchema = z
  .object({
    From: z.string().email(),
    MessageID: z.string().min(1),
    To: z.string(),
    MailboxHash: z.string(),  // empty string allowed (no + suffix case)
    Subject: z.string(),  // can be empty
    TextBody: z.string().optional(),
    HtmlBody: z.string().optional(),
    Attachments: z.array(PostmarkAttachmentSchema),
  })
  .passthrough()
  .refine(
    (v) => v.TextBody !== undefined || v.HtmlBody !== undefined,
    { message: 'Postmark payload must have at least one of TextBody or HtmlBody' },
  );
```

**Sub-decisions:**
- New file `postmarkWebhook.schema.ts` (separation of concerns: third-party-payload distinct from our-shape).
- `.passthrough()` NOT `.strict()` — forward-compat with Postmark API additions.
- At-least-one-of-TextBody/HtmlBody refine catches malformed events.
- Sentinel rejection NOT applied (third-party payload won't naturally emit sentinel; defense-in-depth marginal).
- PascalCase field names persist only at route-handler/Zod-parse boundary; service-layer transforms to snake_case for storage.

**Artifact 3: withInvariants bypass at webhook route handler (Pattern A).**

Webhook route handler does NOT use `withInvariants`. System-actor `ServiceContext` constructed directly with `caller: { user_id: null, system_actor: 'postmark_inbound_webhook' }`. Org_id derived from `MailboxHash` before ctx construction via `resolveOrgFromMailboxHash(mailboxHash)` helper.

**ServiceContext type extension at chunk 6.3a scope.** `ServiceContext.caller` becomes a discriminated union:

```typescript
type ServiceContext = {
  caller:
    | { user_id: string; system_actor?: never }
    | { user_id: null; system_actor: string };
  org_id: string;
  trace_id: string;
};
```

Existing ServiceContext consumers using `ctx.caller.user_id` without null-checking surface as TypeScript errors post-extension. Verify-at-task-plan blast radius enumeration: grep `ctx.caller.user_id` across `apps/web/src/services/` and adjust per consumer.

### Sub-Q7: Cards endpoint surface — LOCKED Model 1 + email_body filename composition

**Lock:** Per-job rendering (no view amendment at chunk 6.3a) + service-layer email_body filename composition.

**Verify-from-disk evidence:**
- `document_cards_view` (migration 154) has NO GROUP BY, NO DISTINCT; INNER JOIN chain is pure flattening. Each row = one document_job.
- DocumentCard.tsx renders `card.original_filename` in title.
- Cards endpoint surfaces view rows 1:1 to response (no server-side aggregation).

**Sub-decisions:**

| Sub-lock | Decision |
|---|---|
| `document_cards_view` amendment | NONE (view stays per-job) |
| Cards endpoint changes | Sub-Q10 Option B applies (see Sub-Q10 lock) |
| DocumentCard component changes | NONE (Sub-Q1 server-only constraint preserved) |
| email_body `original_filename` | `${subject_truncated_100chars_sanitized}.eml` if subject non-empty, else `email-body-${message_id_short}.eml` |
| email_body `mime_type` | `text/plain` if storing TextBody (preferred); `text/html` if HtmlBody fallback |
| email_body content storage | Single source_document; prefer Postmark `TextBody`; fall back to `HtmlBody` if TextBody empty (Sub-Q6 refine guarantees at-least-one) |
| Storage path | `org_{org_id}/sources/{source_document_id}.{txt\|html}` per ADR-0013 uniform convention; extension matches mime_type |
| Subject truncation | Exact char-100 cut, no ellipsis |
| Filename sanitization | Strip invalid filename chars (`/ \ : * ? " < > \|`) and replace with `-` |
| Per-case aggregation | Deferred to Phase 7 (forward-pointer codified at Phase 6 retrospective) |

**Operator-visible UX shape at chunk 6.3a ship.** Forwarded email with N attachments produces N+1 cards (1 email_body + N attachments) in the recent-cards mount-fetch list (Sub-Q10 Option B makes them visible). All cards share `case_id`, `received_at`, `ingest_channel='forwarded_mailbox'`, `channel_metadata.message_id`. Grouping is visible via these shared fields. Phase 7 classification will resolve each card individually. **Operator UX acceptance gate at brief approval (coupled with Sub-Q10 lock).**

### Sub-Q10: UX surface confirmation — LOCKED Option B minimum scope expansion

**Lock:** Cards endpoint extension (optional `ingest_batch_id` + recent-N fallback) + DocumentIntakeRail mount-fetch on idle state.

**Verify-from-disk evidence:**
- Cards endpoint requires `ingest_batch_id` as Zod-required query param (400 on omit).
- DocumentIntakeRail receives batch_id exclusively from drag-drop POST response (line 122).
- No alternate discovery endpoint, no polling, no realtime in codebase.
- Operator user journey at chunk 6.3a ship without UI extensions: forwarded_mailbox batches ingest correctly but are invisible in UI.

**Sub-decisions:**

| Sub-lock | Decision |
|---|---|
| Cards endpoint Zod schema | `ingest_batch_id: z.string().uuid().optional()` + `limit: z.number().int().positive().default(50)` |
| Fallback behavior | If batch_id omitted, return recent N cards across all batches for org, ordered by `case_created_at DESC`, default limit=50 |
| DocumentIntakeRail mount-time fetch | On mount, fetch `/api/orgs/[orgId]/documents/cases?limit=50` (no batch_id); display in idle_with_recent_cards state |
| State machine extension | Supplements (does not replace) existing `idle` state. New transitions: `idle → fetching_recent → idle_with_recent_cards`. `idle` is canonical pre-fetch state |
| Visual treatment | Identical to current cards rendering (no new component); just renders more cards in idle_with_recent_cards state |
| Forwarded_mailbox card visibility | Renders in recent-cards list via channel-agnostic query |
| Limit-default-50 anchor | v1-default-pending-operator-feedback (friction-journal note at chunk 6.3a close) |

**Reasoning chain (Option B over Options A and C):**
1. Sub-Q1 forward-flag intent: scoped to affordance-kind, not discovery-mechanism. Option B doesn't introduce a new affordance.
2. v1 utility floor: shipping forwarded_mailbox with cards invisible in UI is operator-perceives-as-broken-despite-working-correctly. Worse than not shipping.
3. Scope bound is small: ~50-130 LOC across endpoint + UI; well within recalibrated 2000-3500 forecast.
4. Phase 7 alignment preserved: per-case aggregation (Sub-Q7 deferral) still belongs at Phase 7.
5. Grain 5 gap codification: Sub-Q10's surfacing of the gap IS itself a successful Grain 5 firing; codification value at Phase 6 retrospective is high.

**Rejected options:**
- Option A (accept UX gap; defer to Phase 7): cleanest scope discipline but ships operator-perceives-as-broken UX. Acceptable only if operator explicitly approves the gap at brief.
- Option C (full scope expansion: new sidebar / recent-batches dashboard): violates Sub-Q1 explicitly; over-scopes chunk 6.3a; pushes Path C 6.3a/6.3b balance.

### Sub-Q8 + Sub-Q9 deferred

- **Sub-Q8 (Phase 6 retrospective consolidation):** chunk 6.3b scope per Path C lock. Brainstorming for chunk 6.3b walks Sub-Q8.
- **Sub-Q9 (merge-to-main timing):** cascaded to "after chunk 6.3b retrospective ship" per Sub-Q1 split.

## Architecture

Single-commit chunk 6.3a (Path C first-half). Forwarded_mailbox channel ships end-to-end:

**Webhook flow:**

```
Postmark POST /api/webhooks/postmark-inbound
  ↓
[Route handler] Read raw body via Request.text()
  ↓
[Route handler] Verify HMAC-SHA256(rawBody, POSTMARK_INBOUND_WEBHOOK_SECRET) == X-Postmark-Signature header
  ↓ 401 if invalid (Postmark retries with backoff; eventually backs off)
[Route handler] JSON.parse(rawBody)
  ↓ 400 if syntactically invalid
[Route handler] PostmarkInboundWebhookSchema.parse(parsed)
  ↓ 400 if schema-invalid (audit: forwarded_mailbox.malformed_payload)
[Route handler] resolveOrgFromMailboxHash(payload.MailboxHash) → org_id | null
  ↓ 200 + invalid_recipient audit if null (system trace_id, org_id=null)
[Route handler] Construct system-actor ctx: { caller: { user_id: null, system_actor: 'postmark_inbound_webhook' }, org_id, trace_id: crypto.randomUUID() }
  ↓
[Service] ingestionService.handleForwardedMailbox(input, ctx) — bypasses withInvariants
  ↓ Allowlist check: SELECT internal_sender_allowlist WHERE sender_address = payload.From.toLowerCase()
  ↓ if not allowed: emit forwarded_mailbox.rejected_not_allowlisted audit via recordMutation; return { rejected: true, reason: 'not_allowlisted' }
  ↓
[Service] Sequential storageProviderService.put() for email_body + N attachments
  ↓ Storage put failure → ServiceError thrown; route returns 5xx (Postmark retries; idempotency catches duplicate)
[Service] Construct p_documents (N+1 rows), p_cases (1 row), p_case_sources (1-element with email_body role), p_jobs (N+1 rows), p_audit
  ↓
[Service] Call create_ingest_batch_with_documents_with_audit RPC atomically
  ↓ ON CONFLICT (message_id idempotency) → SELECT existing batch_id; return { idempotent: true, batch_id }
  ↓ RPC failure → ServiceError; route returns 5xx (Postmark retries; idempotency catches)
  ↓
[Route handler] Return 200 + JSON body { status: 'accepted', batch_id }
```

**Full rejection taxonomy:**

| Scenario | HTTP Response | Audit Emission | Postmark Behavior |
|---|---|---|---|
| HMAC signature invalid | 401 | `forwarded_mailbox.signature_invalid` (system trace_id, org_id=null) | Retries with backoff |
| JSON syntactically invalid | 400 | None (route-layer; pre-audit) | Treats as bad request |
| Postmark payload Zod-invalid | 400 | `forwarded_mailbox.malformed_payload` (system trace_id, org_id=null) | Treats as bad request |
| Invalid recipient (MailboxHash → no org) | 200 + `{status: 'rejected', reason: 'invalid_recipient'}` | `forwarded_mailbox.invalid_recipient` (system trace_id, org_id=null) | Acks; stops retry |
| Allowlist rejection | 200 + `{status: 'rejected', reason: 'not_allowlisted'}` | `forwarded_mailbox.rejected_not_allowlisted` (org-scoped trace_id) | Acks; stops retry |
| Duplicate message_id (retry hit) | 200 + `{status: 'accepted', batch_id: <existing>, idempotent: true}` | None (idempotent ack; RPC ON CONFLICT DO NOTHING) | Acks; stops retry |
| Storage put failure | 5xx + ServiceError details `{file_index, filename, stage}` | None (pre-audit failure) | Retries; idempotency catches on second attempt |
| Atomic RPC failure | 5xx + ServiceError | None | Retries; idempotency catches on second attempt |

**Migration 155 composition (3 statements):**

```sql
-- Statement 1: message_id idempotency (Sub-Q2 sub-decision iii)
CREATE UNIQUE INDEX idx_ingest_batches_forwarded_mailbox_message_id
  ON ingest_batches (org_id, (channel_metadata->>'message_id'))
  WHERE channel = 'forwarded_mailbox';

-- Statement 2: internal_sender_allowlist table (Sub-Q4)
CREATE TABLE internal_sender_allowlist (
  sender_address TEXT PRIMARY KEY,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Statement 3: seed data with placeholders (Sub-Q4 + Flag 18)
INSERT INTO internal_sender_allowlist (sender_address, notes) VALUES
  ('placeholder-founder@chounting.com', 'REPLACE_VIA_POST_DEPLOY_UPDATE — founder'),
  ('placeholder-user1@chounting.com', 'REPLACE_VIA_POST_DEPLOY_UPDATE — Phase 1.3 exit-criteria user 1'),
  ('placeholder-user2@chounting.com', 'REPLACE_VIA_POST_DEPLOY_UPDATE — Phase 1.3 exit-criteria user 2')
ON CONFLICT DO NOTHING;
```

**Statement ordering rationale:** idempotency index first (protects against any concurrent retry during migration apply); allowlist table next; seed inserts last. Marginal at v1 (migrations apply pre-traffic) but discipline-correct.

**Post-deploy operator step (documented in Walkable proof):** Operator runs `UPDATE internal_sender_allowlist SET sender_address = '<real_email>' WHERE sender_address = '<placeholder>'` for each of the 3 placeholders. Failure mode if forgotten: webhook handler rejects all mail as not-allowlisted (loud, observable, not silent).

## Status

ADR amendment review at chunk 6.3a brief-draft: **no ADR amendment cycles needed at chunk 6.3a.**

- ADR-0011 (`forwarded_mailbox` enum already reserved at §2): no amendment.
- ADR-0013 (storage path `org_{org_id}/sources/...` uniform): no amendment.
- ADR-0014 (storage architecture; §10 GC for orphans): no amendment.
- ADR-0016 (source_document_links polymorphic spine): not affected (Sub-Q5 walk surfaced terminology hygiene distinction from document_case_sources; tier-3 retro candidate, not ADR amendment).

Phase 6 retrospective at chunk 6.3b will review whether codification candidates accumulated at chunk 6.3a (4 new first-instance precedents + Sub-Q10 Grain 5 firing + others) warrant ADR amendment cycles.

## Walkable proof

**End-to-end operator walk at chunk 6.3a ship:**

1. **Pre-deploy operator setup:**
   - Configure Postmark inbound stream with target URL `https://<deploy>.vercel.app/api/webhooks/postmark-inbound` + shared secret stored in `POSTMARK_INBOUND_WEBHOOK_SECRET` env var.
   - Configure inbound address: `inbound+<org_slug>@inbound.chounting.com` (MailboxHash captures org_slug).
   - Post-deploy: run `UPDATE internal_sender_allowlist SET sender_address = '<real_email>' WHERE sender_address = '<placeholder>'` for each of the 3 placeholders.

2. **Operator forwards email** to `inbound+acme@inbound.chounting.com` with subject "Invoice from Acme Corp - Q1 2026" + 3 PDF attachments.

3. **Postmark receives mail**, parses MIME, fires webhook to our endpoint with JSON payload.

4. **Our webhook handler:**
   - Verifies HMAC signature ✓
   - Zod-validates Postmark payload ✓
   - Resolves `acme` MailboxHash → org_id = `<acme_uuid>` ✓
   - Allowlist check: From=`founder@chounting.com` → found ✓
   - Stores email_body source_document (text/plain content from TextBody) + 3 attachment source_documents at `org_<acme_uuid>/sources/<sd_id>.{txt,pdf,pdf,pdf}`
   - Calls atomic RPC: writes 1 ingest_batches + 4 source_documents + 1 document_case (state='received') + 1 document_case_sources (role='email_body') + 4 document_jobs (state='queued') + 1 audit_log row
   - Returns 200 + `{status: 'accepted', batch_id: '<batch_uuid>'}`

5. **Operator opens chounting web app:**
   - DocumentIntakeRail at SplitScreenLayout zone 4 mounts.
   - Mount-fetch calls `/api/orgs/<acme_uuid>/documents/cases?limit=50` → returns recent cards.
   - State transitions to `idle_with_recent_cards`.
   - Renders 4 cards (1 email_body + 3 attachments) for this batch + any prior batches in scope.
   - email_body card title: `Invoice from Acme Corp - Q1 2026.eml` (subject-named, truncated/sanitized).
   - 3 attachment cards show their original filenames.

6. **Test exercises (integration test target):**
   - Test #1: Valid Postmark payload + 3 attachments → 1 batch + 4 source_documents + 1 case + 1 case_sources + 4 jobs + 1 audit. Verifies happy path end-to-end.
   - Test #2: HMAC signature failure → 401 + audit row with `forwarded_mailbox.signature_invalid`.
   - Test #3: Malformed Postmark payload (Zod fail) → 400 + audit row with `forwarded_mailbox.malformed_payload`.
   - Test #4: Sentinel-shape channel_metadata at Zod ingress → ZodError; zero DB rows land.
   - Test #5: Allowlist rejection → 200 + audit row with `forwarded_mailbox.rejected_not_allowlisted`; zero ingest rows.
   - Test #6: Invalid recipient (MailboxHash → no org) → 200 + audit row with `forwarded_mailbox.invalid_recipient`; zero ingest rows.
   - Test #7: Idempotency duplicate message_id (retry) → 200 with existing batch_id; ingest_batches row count unchanged.

## Tech Stack

**Zero new dependencies.** Per Sub-Q2 lock:

- `Request.text()` (Next.js native) for raw body read — must use `.text()` not `.json()` because HMAC is computed over raw bytes
- `node:crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` for HMAC-SHA256 verification (Node.js runtime per Next.js App Router default; no `export const runtime = 'edge'` directive)
- `JSON.parse()` for Postmark payload parse (after signature verification)
- `zod` (already present) for schema validation
- `crypto.randomUUID()` for trace_id generation
- `@supabase/supabase-js` (already present) for RPC + table access

No mail provider SDK. No MIME parser library (Sub-Q3 cascade-closed). No third-party HMAC library.

**Constant-time signature comparison.** HMAC comparison MUST use `crypto.timingSafeEqual()` to prevent timing-attack reconstruction of the secret. Direct `===` string comparison on signature digests is an anti-pattern; specify `timingSafeEqual` in Task 8 implementation.

## In scope

**New files (5):**

1. **`supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql`** — 3 statements (message_id idempotency partial UNIQUE index + internal_sender_allowlist table + seed inserts).

2. **`apps/web/src/shared/schemas/document-platform/postmarkWebhook.schema.ts`** — PostmarkInboundWebhookSchema + PostmarkAttachmentSchema (Sub-Q6 Artifact 2; first-instance third-party-payload schema; `.passthrough()` for forward-compat).

3. **`apps/web/src/app/api/webhooks/postmark-inbound/route.ts`** — first webhook handler in /api/webhooks/ convention; HMAC verify + Zod parse + org resolve + system-actor ctx + service call + 200 always response shaping.

4. **`apps/web/src/services/document-platform/resolveOrgFromMailboxHash.ts`** — service helper; SELECT organizations WHERE slug = mailboxHash; returns org_id or null.

5. **`apps/web/tests/integration/forwardedMailbox.handleForwardedMailbox.integration.test.ts`** — 7 integration tests per Walkable proof Test #1-#7.

**Modified files (8):**

6. **`apps/web/src/shared/schemas/document-platform/ingestBatch.schema.ts`** — add ForwardedMailboxChannelMetadataSchema (Sub-Q6 Artifact 1) + forwarded_mailbox branch in discriminated union; activate (uncomment) the chunk 6.3 forward-pointer comment.

7. **`apps/web/src/services/document-platform/ingestionService.ts`** — add `handleForwardedMailbox(input, ctx)` method per Sub-Q5 lock; constructs p_documents (N+1 rows with email_body at index 0), p_cases (1 row), p_case_sources (1-element with role='email_body'), p_jobs (N+1 rows), p_audit; calls chunk 6.1 RPC atomically. Handles ON CONFLICT (idempotency) + allowlist check + audit emission for rejection paths.

8. **`apps/web/src/services/types.ts`** (or wherever ServiceContext lives) — extend ServiceContext.caller to discriminated union (user-session vs system-actor); chunk 6.3a's blast radius scope.

9. **`apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts`** (Sub-Q10 Option B) — Zod schema change: `ingest_batch_id: z.string().uuid().optional()` + `limit: z.number().int().positive().default(50)`. Conditional WHERE filtering on batch_id. Backward-compatible.

10. **`apps/web/src/components/canvas/DocumentIntakeRail.tsx`** (Sub-Q10 Option B) — state machine extension: new `idle_with_recent_cards` state. Mount-time fetch on idle entry. Render recent cards alongside dropzone in idle_with_recent_cards state.

11. **`apps/web/tests/integration/cardsEndpoint.recentN.integration.test.ts`** — 4 tests for Option B: cards endpoint without batch_id returns recent N, with batch_id backward-compat preserved, limit param honored, sentinel filtering preserved.

12. **`apps/web/tests/unit/forwarded_mailbox.serviceComposition.test.ts`** — 2 unit tests: email_body filename composition (subject truncation/sanitization edge cases), p_case_sources positional-convention construction.

13. **`apps/web/tests/unit/schemas.forwardedMailbox.test.ts`** — 2 unit tests: ForwardedMailboxChannelMetadataSchema accepts valid + rejects sentinel + rejects missing fields; PostmarkInboundWebhookSchema passthrough behavior + at-least-one-body refine.

**File-by-file LOC estimate:**

| File | LOC estimate |
|---|---|
| Migration 155 | ~30 (3 statements + comments) |
| postmarkWebhook.schema.ts | ~80 |
| webhook route.ts | ~150 |
| resolveOrgFromMailboxHash.ts | ~40 |
| Integration test (webhook 7 tests) | ~600 |
| ingestBatch.schema.ts modification | ~50 added |
| ingestionService.ts handleForwardedMailbox | ~250 |
| ServiceContext type extension + consumer updates | ~80 |
| cards endpoint modification | ~40 |
| DocumentIntakeRail modification | ~100 |
| Cards endpoint integration test (4 tests) | ~250 |
| Unit tests (4 tests) | ~200 |
| File-top comments + JSDoc | ~150 |
| **Total** | **~2020** |

Sits within recalibrated 2000-3500 LOC forecast. Flag 16 LOC-methodology caveat applies (forecast soft; chunk 6.3a may undershoot or overshoot).

## Out of scope

1. **Mail provider abstraction layer** — chunk 6.3a is intentionally Postmark-coupled (vendor lock-in forward-pointer to Q41+ Phase 2.5).
2. **Per-org allowlists** — v1 global allowlist only (per §8.6); per-org deferred to Q41+.
3. **Allowlist management UI** — migration-only mutability at v1 (per Sub-Q4 lock).
4. **DKIM / SPF / DMARC enforcement** — Q41+ scope (per §8.6).
5. **Per-case aggregation in `document_cards_view`** — Phase 7 candidate (per Sub-Q7 deferral; Phase 7 post-classification case_sources writes shift card-grain semantics).
6. **Channel-aware visual differentiation** in DocumentCard — Sub-Q1 server-only constraint; deferred to Phase 7 or beyond.
7. **Recent-batches sidebar / dashboard** — Sub-Q10 Option C rejected; Option B's mount-fetch suffices at v1.
8. **Polling / realtime subscription for new ingestions** — no existing patterns; deferred.
9. **Bounce / soft-fail handling** — Postmark provides bounce webhooks; not in chunk 6.3a scope.
10. **Email reply threading** — Postmark provides ReplyTo + InReplyTo headers; chunk 6.3a stores message_id only.
11. **HtmlBody → text conversion** — chunk 6.3a stores raw HtmlBody as-is if TextBody empty; Phase 7 may extract text.
12. **`forwarded_mailbox.received` audit emission** — only rejection audits emitted; successful ingestion's audit is inside the chunk 6.1 RPC.
13. **Allowlist mutation audit log** — migration-driven only at v1; no operational mutation surface to audit.
14. **Raw MIME envelope storage** — Postmark's 45-day retention suffices at v1 (per Sub-Q2 sub-decision iv).
15. **MailboxHash → org_slug renaming / normalization** — store as-received in channel_metadata.to; service-layer parses for routing only.

## Flagged ambiguities

| # | Flag | Disposition / Resolution Pending |
|---|---|---|
| 1 | Postmark webhook URL operational config | External to repo; founder configures in Postmark dashboard; documented in Walkable proof |
| 2 | POSTMARK_INBOUND_WEBHOOK_SECRET env var management | Vercel env var; rotation discipline pending — operator decision |
| 3 | resolveOrgFromMailboxHash failure modes | Empty MailboxHash → invalid_recipient; non-existent slug → invalid_recipient. Code comment specifies. |
| 4 | Inbound address provisioning per org | Q41+ scope; v1 uses single domain `inbound.chounting.com` with MailboxHash routing |
| 5 | Subject sanitization edge cases | Empty subject → fallback filename; emoji/unicode in subject → preserved unless invalid filename chars |
| 6 | TextBody encoding | Postmark sends UTF-8; stored as-received without re-encoding |
| 7 | Sub-Q7 + Sub-Q10 coupled operator UX shape | Brief approval cycle requires operator acknowledgment of 4-cards-per-3-attachment-email shape + limit-50 default |
| 8 | Flag 18 seed-data PII shape | Placeholder seed values committed; operator runs post-deploy UPDATE; documented in Walkable proof |

## Task plan

**Pre-flight verification (Task 0).**
- Run `pnpm agent:validate` against pre-chunk HEAD; confirm 26/26 green baseline.
- Run `pnpm test` against pre-chunk HEAD; confirm 1086/1086 vitest green baseline.

**Substrate landing (Tasks 1-3).**

**Task 1: Migration 155 substrate.** Create `supabase/migrations/20240155000000_forwarded_mailbox_substrate.sql` with 3 statements per Architecture. Run `pnpm db:reset && pnpm db:seed:all`; verify partial UNIQUE index + table + seed rows present.
- **Verification gate:** `psql -c "\d ingest_batches"` shows new index; `SELECT count(*) FROM internal_sender_allowlist` returns 3.

**Task 2: types.ts regeneration.** Regenerate `apps/web/src/types/database.ts` post-migration. Confirm `internal_sender_allowlist` types present.
- **Verification gate:** `pnpm typecheck` green.

**Task 3: ServiceContext type extension.** Modify `ServiceContext` to discriminated union (user-session vs system-actor). Grep `ctx.caller.user_id` across `apps/web/src/services/` and adjust consumers for exhaustive narrowing.
- **Verification gate:** `pnpm typecheck` green; no `ctx.caller.user_id` access without null-check or discriminator narrowing.

**Schema landing (Tasks 4-5).**

**Task 4: PostmarkInboundWebhookSchema + PostmarkAttachmentSchema.** Create `apps/web/src/shared/schemas/document-platform/postmarkWebhook.schema.ts` per Sub-Q6 Artifact 2 spec.
- **Verification gate:** `pnpm typecheck` green; schema exports accessible.

**Task 5: ForwardedMailboxChannelMetadataSchema + discriminated union branch.** Modify `ingestBatch.schema.ts`: add ForwardedMailboxChannelMetadataSchema + uncomment-and-activate the chunk 6.3 forward-pointer branch in IngestBatchChannelMetadataSchema discriminated union.
- **Verification gate:** `pnpm typecheck` green; schema exports accessible.

**Service landing (Tasks 6-7).**

**Task 6: resolveOrgFromMailboxHash helper.** Create `apps/web/src/services/document-platform/resolveOrgFromMailboxHash.ts`. Service helper that SELECTs `organizations` WHERE `slug = mailboxHash`; returns `org_id` or `null`.
- **Verification gate:** `pnpm typecheck` green; helper accessible.

**Task 7: ingestionService.handleForwardedMailbox method.** Add method to `ingestionService.ts` per Sub-Q5 + Sub-Q4 + Sub-Q2 locks. Composes p_documents (N+1 with email_body at index 0), p_cases (1 row), p_case_sources (1-element with role='email_body'), p_jobs (N+1), p_audit. Allowlist check before storage puts. Sequential storage puts. Atomic RPC call. ON CONFLICT idempotent ack. Audit emission for rejection paths via recordMutation. Include positional-convention code comment per Sub-Q5 lock.
- **Verification gate:** `pnpm typecheck` green; service method exported.

**Route handler landing (Task 8).**

**Task 8: /api/webhooks/postmark-inbound/route.ts.** Create webhook route handler per Sub-Q6 Artifact 3 (bypass withInvariants; system-actor ctx) + Architecture flow. HMAC verify → JSON parse → Zod validate → resolveOrgFromMailboxHash → system-actor ctx → service call → response shaping. Handle all 8 rejection-taxonomy scenarios.
- **Verification gate:** `pnpm typecheck` green.

**Sub-Q10 Option B landing (Tasks 9-10).**

**Task 9: Cards endpoint extension.** Modify `apps/web/src/app/api/orgs/[orgId]/documents/cases/route.ts` per Sub-Q10 Option B: `ingest_batch_id` optional + `limit` default 50; conditional WHERE on batch_id; backward-compatible with chunk 6.2b drag-drop call shape.
- **Verification gate:** `pnpm typecheck` green; manual fetch test against dev DB confirms recent-N returns + batch_id-specified returns.

**Task 10: DocumentIntakeRail mount-fetch.** Modify `DocumentIntakeRail.tsx`: new `idle_with_recent_cards` state; mount-time fetch on `idle` entry → transitions to `idle_with_recent_cards`; render recent cards alongside dropzone.
- **Verification gate:** `pnpm typecheck` green; manual UI check confirms cards render on mount.

**Test landing (Tasks 11-13).**

**Task 11: Webhook integration tests.** Create `forwardedMailbox.handleForwardedMailbox.integration.test.ts` with Test #1-#7 per Walkable proof.
- **Verification gate:** `pnpm test` shows 7 new tests passing.

**Task 12: Cards endpoint integration tests.** Create `cardsEndpoint.recentN.integration.test.ts` with 4 tests (recent-N without batch_id; with batch_id backward-compat; limit param honored; sentinel filtering preserved).
- **Verification gate:** `pnpm test` shows 4 new tests passing.

**Task 13: Unit tests.** Create `forwarded_mailbox.serviceComposition.test.ts` (2 tests: filename composition edge cases; p_case_sources positional convention) + `schemas.forwardedMailbox.test.ts` (2 tests: ForwardedMailboxChannelMetadataSchema + PostmarkInboundWebhookSchema).
- **Verification gate:** `pnpm test` shows 4 new tests passing.

**Closing (Task 14).**

**Task 14: Full validation + file-top comment review.** Run `pnpm agent:validate` (26/26 green). Run `pnpm test` (target 1101 ±2 green). Run `pnpm typecheck` green. Review file-top comments for staleness (per CLAUDE.md staleness convention) on modified files: ingestionService.ts, ingestBatch.schema.ts, cases/route.ts, DocumentIntakeRail.tsx.
- **Verification gate:** all three validation commands green; file-top comments accurate.

## Test plan

**Baseline:** 1086 vitest tests + 26/26 Category A floor at chunk 6.2b ship.

**New tests at chunk 6.3a (target +15):**

**Integration tests — webhook (Task 11):**
1. Happy path: valid Postmark payload + 3 attachments → 1 batch + 4 source_documents + 1 case + 1 case_sources (role='email_body') + 4 jobs + 1 audit. Verify storage puts called sequentially; verify RPC atomicity; verify trace_id propagation.
2. HMAC signature failure → 401 response + `forwarded_mailbox.signature_invalid` audit row (system trace_id, org_id=null); zero ingest rows.
3. Malformed Postmark payload (Zod fail) → 400 response + `forwarded_mailbox.malformed_payload` audit row.
4. Sentinel-shape channel_metadata at Zod ingress (defense-in-depth at our-shape schema; tested via ingestionService entry-point) → ZodError; zero DB rows land.
5. Allowlist rejection (From not in allowlist) → 200 + `{status: 'rejected', reason: 'not_allowlisted'}` + audit row (org-scoped trace_id, allowlist-fields in before_state); zero ingest rows.
6. Invalid recipient (MailboxHash → no matching org) → 200 + `{status: 'rejected', reason: 'invalid_recipient'}` + audit row (system trace_id, org_id=null); zero ingest rows.
7. Idempotency duplicate message_id (retry) → 200 + `{status: 'accepted', batch_id: <existing>, idempotent: true}`; ingest_batches row count unchanged from first attempt.

**Integration tests — cards endpoint (Task 12):**
8. Cards endpoint without batch_id query param → 200 + recent N cards (default 50) across all batches for org.
9. Cards endpoint with batch_id (chunk 6.2b drag-drop call shape) → 200 + cards filtered to that batch (backward-compat).
10. Cards endpoint with limit=10 → 200 + at-most 10 cards.
11. Cards endpoint filters sentinel correctly in recent-N path (no sentinel-batch cards surface even when batch_id omitted).

**Unit tests (Task 13):**
12. email_body filename composition: subject="" → fallback `email-body-<message_id_short>.eml`; subject with `/\:*?` chars → sanitized; subject > 100 chars → truncated at exact char-100.
13. p_case_sources positional convention: handleForwardedMailbox composes 1-element array; source_document_id references p_documents[0].id.
14. ForwardedMailboxChannelMetadataSchema: accepts valid; rejects sentinel-shape; rejects missing fields; rejects extra fields (via `.strict()`).
15. PostmarkInboundWebhookSchema: accepts valid; tolerates extra Postmark fields (via `.passthrough()`); rejects missing both TextBody and HtmlBody (via refine).

**Target test count at chunk 6.3a close:** 1086 + 15 = **1101 ±2** per chunk 6.2b precedent ±2 tolerance.

**Category A floor (26/26):** unchanged. All 26 floor tests must remain green; no regressions in `pnpm agent:validate`.

## Friction-journal placeholder

**Pre-drafted entries (codifications shipping at chunk 6.3a):**

- **F-J entry — first-instance precedent: webhook handler in /api/webhooks/.** Chunk 6.3a introduces the first external webhook handler in /api/webhooks/. Convention locked: provider-invoked webhook routes live at `/api/webhooks/<provider>-<event>/route.ts`; frontend-invoked routes remain at `/api/orgs/[orgId]/...`. Semantic distinction: who invokes + how org is derived. Future webhooks (Stripe, Auth callbacks) inherit this convention. Greppable: search for `/api/webhooks/` directory.

- **F-J entry — first-instance precedent: Postmark-coupled service adapter shape.** Chunk 6.3a introduces the first third-party-provider-coupled service adapter (ingestionService.handleForwardedMailbox consumes Postmark payload shape). Convention locked: Q41+ Phase 2.5 multi-provider expansion is named as deliberate future scope with its own brief. Forward-pointer preserved; not a regret at v1.

- **F-J entry — first-instance precedent: system-actor route handler pattern.** Chunk 6.3a introduces system-actor route invocation: webhook handler bypasses withInvariants and constructs ServiceContext directly with `caller: { user_id: null, system_actor: 'postmark_inbound_webhook' }`. Pattern locked: webhook route handlers (system-actor invocation) bypass withInvariants; user-session-invoked route handlers use withInvariants. Discriminator is invocation source (third-party HMAC-verified vs authenticated user session).

- **F-J entry — first-instance precedent: system-actor ServiceContext discriminated-union shape.** Chunk 6.3a extends ServiceContext.caller to discriminated union (user-session vs system-actor). Future system-actor surfaces (cron jobs, scheduled tasks, other webhook providers) inherit this shape. Type-system enforces exhaustive narrowing.

- **F-J entry — Flag 18 seed-data-PII-shape convention codification.** Chunk 6.3a uses placeholder seed values committed to migration; operator runs post-deploy UPDATE for real emails. Convention locked: when migration-seeded data includes PII or near-PII, use placeholder-plus-post-deploy convention vs literal-values-in-migration. Reason: git history is forever; v1 audience scope (internal-only) does not constrain future audience. Phase 2.5+ deprecation path retires this when UI-editable allowlists ship.

- **F-J entry — Flag 19 terminology hygiene: document_case_sources vs source_document_links.** Chunk 6.3a Sub-Q5 walk surfaced conflation in prior memory entries. Convention codified: document_case_sources (migration 145, case-grain, role enum with 'email_body' v1-active) is distinct from source_document_links (migration 147, polymorphic entity-grain per ADR-0016). Future memory entries referencing either table must state the distinction explicitly.

- **F-J entry — Sub-Q10 RI-6 Grain 5 fifth-grain firing codification (tier-2 retro carry-forward).** Sub-Q1 scope-lock at session start didn't verify-from-disk on cards UI consumer contract for the new forwarded_mailbox batch creation path. Sub-Q10 walk surfaced the gap (cards endpoint requires batch_id; DocumentIntakeRail has no discovery mechanism). Pattern codified: Grain 5 scan at scope-lock must include existing-UI-consumer-contract verification, not just new-service-surface caller scan. Expands Grain 5's operational definition from "consumer scan for new emitting code" to "consumer scan for new emitting code AND existing-UI-consumer of affected entity types." High-value codification; Phase 6 retrospective tier-2.

- **F-J entry — Audit-action naming convention split (tier-2 retro carry-forward).** Chunk 6.3a uses dot-namespaced (`forwarded_mailbox.<action>`); chunk-2-Phase-3 uses underscored (`document_case_transitioned`). Both precedents valid. Convention codified at Phase 6 retrospective: dot-namespaced for new domain-event families (anticipated taxonomy expansion); underscored for established entity-state-transition events (stable taxonomy). Chunk 6.3a's `forwarded_mailbox.rejected_not_allowlisted` opens a new domain family.

- **F-J entry — Cascade-closed sub-Q folding convention (tier-2 retro carry-forward).** Chunk 6.3a's Sub-Q3 closes via Sub-Q2 lock (Postmark pre-parsed JSON eliminates MIME parser library decision). Convention codified: cascade-closed sub-Qs fold into the closing sub-Q's resolution rather than getting empty placeholder sections. Documented in-place where closure happened. Pre-empts retrospective noise from "decisions that say we didn't need to decide."

- **F-J entry — Migration bundling threshold convention (tier-2 retro carry-forward).** Chunk 6.3a migration 155 bundles 3 statements (idempotency index + allowlist table + seed). Migration 152 bundled 6+ statements; migration 153 bundled 4 statements; migration 154 single statement. Pattern codified at Phase 6 retrospective: bundle migration statements when all statements ship at same chunk + are logically related; split when concerns are domain-distinct.

- **F-J entry — Atomic-extension-via-JSONB-array channel-composition pattern (tier-2 retro carry-forward).** Chunk 6.3a leverages chunk 6.1 RPC's variable-length p_case_sources / p_documents / p_jobs JSONB array parameters. Drag-drop passes empty p_case_sources; forwarded_mailbox passes 1-element. Phase 7 will pass N+1 elements. Pattern codified: single atomic RPC accepts variable-row-count extensions via JSONB array parameters; channel-specific row composition at service layer; backward-compatible channel addition is service-layer-only.

- **F-J entry — Zod strict-mode-for-our-shape vs passthrough-for-third-party convention (tier-2 retro carry-forward).** Chunk 6.3a's two new schemas use `.strict()` (ForwardedMailboxChannelMetadataSchema = our-shape; detect drift) vs `.passthrough()` (PostmarkInboundWebhookSchema = third-party; forward-compat). Discipline split codified at Phase 6 retrospective.

- **F-J entry — Server-only-constraint operational scope (tier-2 retro carry-forward).** Chunk 6.3a's Sub-Q1 server-only constraint at session start was monolithic; Sub-Q10 walk surfaced that server-only applies per-affordance / per-discovery-mechanism / per-existing-UI-consumer separately. Convention codified: future scope-locks adjudicate "server-only" granularly rather than as a single constraint.

- **F-J entry — Limit-default-50 anchor for cards endpoint recent-N path.** Sub-Q10 Option B's `limit` default = 50 is v1-anchor-pending-operator-feedback. Forwarded_mailbox v1 audience volume unknown. Phase 7+ revises if 50 cards is too few (operator loses scroll-back beyond 50th) or too many (rendering performance). Tier-3 codification.

- **F-J entry — Email_body filename composition convention.** Synthetic filenames on email_body source_documents at chunk 6.3a: `${subject_truncated_100chars_sanitized}.eml` with `email-body-${message_id_short}.eml` empty-subject fallback. Truncation = exact char-100 cut, no ellipsis. Sanitization = strip `/\:*?"<>|` chars; replace with `-`. Future channels with synthetic-filename needs inherit this shape. Tier-3 codification.

- **F-J entry — View-grain-vs-row-grain operational distinguishability.** Drag-drop's 1:1 N-files:N-cases:N-jobs made document_cards_view grain invisible. Forwarded_mailbox's 1 case:N+1 source_documents:N+1 jobs surfaces grain distinguishability for the first time. Pattern: when a new channel's row-multiplication shape diverges from existing channels, view-grain becomes operationally significant. Future channels (api_ingest, others) inherit this consideration. Tier-3 codification.

- **F-J entry — ADR-0008 vs ADR-0010 layer-placement cross-reference clarity.** Chunk 6.3a Sub-Q2/Sub-Q4 walks surfaced ambiguity on which ADR covers which layer-placement question. ADR-0008 = policy-based runtime checks (Layer 2 service); ADR-0010 = closed-enum / substrate-now-enforcement-later (Layer 1 substrate). Tier-3 codification candidate; lighter-touch clarification at retrospective.

**Conditional entries (codifications conditional on chunk 6.3a impl outcome — pre-drafted; only fire if condition met):**

- **Conditional — operator-override-at-brief-approval on Sub-Q7+Sub-Q10 coupled UX.** If operator rejects 4-cards-per-3-attachment-email shape OR limit-50-default at brief approval, chunk 6.3a brief enters amendment cycle. Friction-journal entry codifies the override scenario + decision.

- **Conditional — first-time multi-statement migration ON CONFLICT discipline.** If migration 155's seed INSERT triggers ON CONFLICT in dev DB (already-seeded), confirm no-op behavior + idempotent re-run via `pnpm db:reset`. Friction-journal entry codifies any surprises.

- **Conditional — ServiceContext discriminated-union blast radius.** If TypeScript errors surface in more than 10 ctx.caller.user_id consumer sites, friction-journal entry codifies scope expansion + per-consumer adjustment pattern. If ≤10 sites, no entry needed; in-scope per Sub-Q6 lock.

## What's next

**Chunk 6.3b** (Path C second-half; chunk 6.3a's brainstorming-side already aware of structure):
- Phase 6 retrospective consolidation at `docs/07_governance/retrospectives/phase-6-retrospective.md` (Sub-Q8 walk in chunk 6.3b brainstorming).
- 24 codification candidates accumulating at chunk 6.3a brainstorming close; Sub-Q8 walk triages into graduate-now / graduate-at-Phase-7-entry / leave-as-tracked.
- 19 active RI candidates inventoried in retrospective writeup.
- ADR amendment cycles if N≥3 framings surfaced during chunk 6.3a impl (otherwise friction-journal-only divergence per RI-10).
- Merge-to-main fires at chunk 6.3b close (Sub-Q9 cascade resolution).

**Phase 7** (post-Phase-6):
- Per-case aggregation in `document_cards_view` (Sub-Q7 deferred forward-pointer).
- Post-classification case_sources writes for primary/supporting/payment_evidence roles (Phase 6 vs Phase 7 division of labor, Flag 5 ratification).
- Channel-aware visual differentiation in DocumentCard (if operator UX feedback at v1 surfaces it).
- Discovery affordances beyond mount-fetch (recent-batches sidebar / notifications / polling) if operator feedback surfaces it.

**Q41 / Phase 2.5+** (post-v1):
- Multi-provider mail abstraction (vendor lock-in forward-pointer).
- DKIM / SPF / DMARC enforcement.
- Per-org allowlists with UI editing surface.
- Mailbox rotation, retention policy, per-org inbound address provisioning.

## Commit message template

```
feat(phase-6): chunk 6.3a — forwarded_mailbox ingestion (Postmark inbound)

Path C first-half. Ships forwarded_mailbox channel end-to-end via Postmark
inbound webhook. Chunk 6.3b ships Phase 6 retrospective + merge-to-main.

Substrate (migration 155):
- partial UNIQUE index on (org_id, channel_metadata->>'message_id')
  WHERE channel='forwarded_mailbox' (Layer 1 idempotency at provider-retry boundary)
- internal_sender_allowlist table (Layer 2 service-enforced allowlist per ADR-0008)
- 3-row seed with placeholders (operator UPDATE post-deploy per Flag 18)

Service + route + UI:
- ingestionService.handleForwardedMailbox: allowlist check + sequential storage
  puts + atomic chunk-6.1-RPC with 1-element p_case_sources (role='email_body')
- /api/webhooks/postmark-inbound/route.ts: HMAC verify + Zod parse + system-actor
  ServiceContext (bypasses withInvariants; first-instance pattern)
- /api/orgs/[orgId]/documents/cases extension: optional batch_id + limit; recent-N
  fallback per Sub-Q10 Option B (RI-6 Grain 5 firing)
- DocumentIntakeRail mount-fetch in new idle_with_recent_cards state

Schemas:
- ForwardedMailboxChannelMetadataSchema (our-shape; .strict() + sentinel-rejection)
- PostmarkInboundWebhookSchema + PostmarkAttachmentSchema (third-party; .passthrough())

First-instance precedents (codified at chunk close):
- Webhook handlers at /api/webhooks/<provider>-<event>/
- Postmark-coupled service adapter (Q41+ multi-provider forward-pointer)
- System-actor route handler pattern (bypasses withInvariants)
- System-actor ServiceContext discriminated-union shape

Tests: +15 new (7 webhook integration + 4 cards endpoint + 4 unit) → 1101 vitest;
26/26 agent:validate green.

Sub-Q resolutions: Sub-Q1 Path C split + Sub-Q2 Postmark (Sub-Q3 cascade-closed)
+ Sub-Q4 Layer 2 allowlist + Sub-Q5 Option D (no substrate change) + Sub-Q6
three-artifact lock + Sub-Q7 Model 1 + Sub-Q10 Option B. Sub-Q8 + Sub-Q9 at
chunk 6.3b scope. Brief at docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3a.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
