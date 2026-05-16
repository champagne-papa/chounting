-- =============================================================
-- 20240155000000_forwarded_mailbox_substrate.sql
-- Phase 6 chunk 6.3a — forwarded_mailbox ingestion substrate.
--
-- Three statements (multi-statement bundling per migration 153
-- precedent + chunk 6.3a brief Architecture Migration 155
-- composition):
--   Statement 1: Layer 1 partial UNIQUE index on
--                (org_id, channel_metadata->>'message_id') WHERE
--                ingest_channel = 'forwarded_mailbox'. Idempotency
--                at provider-retry boundary per Sub-Q2 sub-decision
--                (iii). β-1 reconciliation: brief wrote `channel`;
--                actual column is `ingest_channel` (verify-from-disk
--                catch at migration-write time).
--   Statement 2: internal_sender_allowlist table per Sub-Q4 lock.
--                Layer 2 service-enforced; Layer 1 reservation only
--                (no CHECK on sender_address per ADR-0008 policy-vs-
--                physics).
--   Statement 3: 3-row seed with PII-placeholder values per Sub-Q4
--                + Flag 18. Operator runs post-deploy UPDATE for
--                real emails (documented in brief Walkable proof).
--
-- Statement ordering rationale: idempotency index first (protects
-- against any concurrent retry during migration apply); allowlist
-- table next; seed inserts last. Marginal at v1 (migrations apply
-- pre-traffic) but discipline-correct.
--
-- ADR-0008 layer discipline:
--   - Layer 1: partial UNIQUE index on message_id (idempotency
--     substrate); table reservation only on internal_sender_allowlist
--     (no CHECK on sender_address values; policy-grade).
--   - Layer 2: service-enforced allowlist check at
--     ingestionService.handleForwardedMailbox (Task 7).
--   - Layer 3: route handler at /api/webhooks/postmark-inbound
--     does not query allowlist directly (route handler only does
--     HMAC + Zod + org-resolve; service layer owns allowlist).
--
-- MailboxHash resolution at v1: org_id UUID (per Flag 20 brief
-- amendment 2026-05-15; β-2 reconciliation; no slug column on
-- organizations at v1; Phase 2.5+ slug substrate addition is
-- forward-pointer). resolveOrgFromMailboxHash helper (Task 6)
-- parses MailboxHash as UUID and SELECT org_id WHERE org_id=parsed.
--
-- See docs/09_briefs/phase-6/chunks/2026-05-15-phase-6-chunk-3a.md
-- (this migration's authoritative brief; commit 9fc831a + 2026-05-15
-- in-line amendment for Flag 20).
-- See supabase/migrations/20240152000000_ingestion_substrate.sql
-- (defines ingest_batches.channel_metadata jsonb + ingest_channel
-- ENUM column; both referenced by Statement 1's partial UNIQUE).
-- =============================================================

-- =============================================================
-- Statement 1: Layer 1 message_id idempotency partial UNIQUE index.
-- Per-org scoped (a forward from org A and a forward from org B
-- could in principle share message_id if a mail loop crosses orgs;
-- per-org uniqueness is the correct scope).
-- =============================================================

CREATE UNIQUE INDEX idx_ingest_batches_forwarded_mailbox_message_id
  ON ingest_batches (org_id, (channel_metadata->>'message_id'))
  WHERE ingest_channel = 'forwarded_mailbox';

-- =============================================================
-- Statement 2: internal_sender_allowlist table.
-- Layer 2 service-enforced allowlist per ADR-0008 (policy-grade
-- runtime check at service ingress). Layer 1 substrate is table
-- reservation only; no CHECK on sender_address values.
-- =============================================================

CREATE TABLE internal_sender_allowlist (
  sender_address TEXT PRIMARY KEY,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes          TEXT
);

COMMENT ON TABLE internal_sender_allowlist IS
  'Phase 6 chunk 6.3a forwarded_mailbox allowlist (Sub-Q4 lock). '
  'Migration-only mutability at v1 (per Flag 18 seed-data convention). '
  'Service-layer comparison via .toLowerCase() normalization (per '
  'invitationService precedent). Layer 2 enforcement at '
  'ingestionService.handleForwardedMailbox; Layer 1 substrate is '
  'this table only. UI editing surface deferred to Phase 2.5+ per '
  'spend_initiative.md §8.6.';

-- RLS not required on this table: service_role only (allowlist
-- lookup is in webhook system-actor path; no user-direct access).
-- No GRANT to authenticated.
GRANT SELECT ON internal_sender_allowlist TO service_role;

-- =============================================================
-- Statement 3: PII-placeholder seed (Sub-Q4 + Flag 18).
-- Operator runs post-deploy UPDATE for each placeholder:
--   UPDATE internal_sender_allowlist
--      SET sender_address = '<real_email>'
--      WHERE sender_address = '<placeholder>';
-- Failure mode if forgotten: webhook handler rejects all mail as
-- not-allowlisted (loud, observable, not silent).
-- =============================================================

INSERT INTO internal_sender_allowlist (sender_address, notes) VALUES
  ('placeholder-founder@chounting.com',
   'REPLACE_VIA_POST_DEPLOY_UPDATE — founder'),
  ('placeholder-user1@chounting.com',
   'REPLACE_VIA_POST_DEPLOY_UPDATE — Phase 1.3 exit-criteria user 1'),
  ('placeholder-user2@chounting.com',
   'REPLACE_VIA_POST_DEPLOY_UPDATE — Phase 1.3 exit-criteria user 2')
ON CONFLICT (sender_address) DO NOTHING;
