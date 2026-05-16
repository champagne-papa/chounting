// src/services/document-platform/resolveOrgFromMailboxHash.ts
//
// Phase 6 chunk 6.3a — Postmark inbound MailboxHash → org_id resolution
// helper (Sub-Q6 Artifact 3 + β-2 Approach 1 amendment).
//
// At v1, MailboxHash carries the org_id UUID directly (no slug column
// on organizations table per β-2 verify-from-disk reconciliation).
// Postmark parses the +suffix tag from the inbound address; e.g.,
//   inbound+550e8400-e29b-41d4-a716-446655440000@inbound.chounting.com
// yields MailboxHash = '550e8400-e29b-41d4-a716-446655440000'.
//
// Resolution algorithm:
//   1. Validate MailboxHash parses as UUID. If not, return null.
//   2. SELECT org_id FROM organizations WHERE org_id = parsed.
//   3. Return org_id string or null.
//
// Failure modes returning null:
//   - Empty MailboxHash (no +suffix on recipient address)
//   - Non-UUID MailboxHash (operator typo / spam / probe)
//   - UUID-shaped MailboxHash that doesn't match any org row (deleted
//     org or operator typo with valid UUID format)
//
// Phase 2.5+ forward-pointer: when per-org slug-based inbound addresses
// ship, extend this resolver to try slug-match first, falling back to
// UUID-match. Multi-address support preserves backwards-compat.

import { z } from 'zod';
import { adminClient } from '@/db/adminClient';

const UuidSchema = z.string().uuid();

export async function resolveOrgFromMailboxHash(
  mailboxHash: string,
): Promise<string | null> {
  const parsed = UuidSchema.safeParse(mailboxHash);
  if (!parsed.success) {
    return null;
  }

  const db = adminClient();
  const { data, error } = await db
    .from('organizations')
    .select('org_id')
    .eq('org_id', parsed.data)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.org_id;
}
