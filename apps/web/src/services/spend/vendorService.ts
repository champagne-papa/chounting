// src/services/spend/vendorService.ts
//
// Phase 5 chunk B5-3-D2 substantive session #1: general-entity vendor list
// service per EC-A-5 Path (Y) ratification (Two Laws Law 1 dispositive:
// all DB access through src/services/; route handlers must not query
// vendors table directly).
//
// Mirror pattern: vendorReportService.ts (B5-3-D1) for structural
// discipline (imports, ServiceContext, adminClient, ServiceError,
// loggerWith, plain unwrapped functions exported as service object).
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): READ-ONLY.
// No journalEntryService.post(); no INSERT/UPDATE; no recordMutation.
//
// INV-SERVICE-001 export contract (structural): plain unwrapped function
// (Pattern B). Route handlers do NOT wrap via withInvariants() — read
// functions are intentionally not wrapped per service-architecture skill
// §2 canonical; authorization via RLS on vendors table (vendors_select
// policy gates by user_has_org_access(org_id)).
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// ServiceErrorCode usage: generic 'READ_FAILED' per vendorReportService
// precedent; rich discriminator message text carries specifics.
//
// Consumer surface: EC-A-5 vendor balance view (this chunk) + B5-3-D3
// manual bill form + payment approval card (downstream). Centralized
// vendor-list pattern eliminates substrate-fragmentation across 3
// consumers (per chunk B5-3-D2 onset Path (X) vs (Y) substantive
// disposition).

import { adminClient } from '@/db/adminClient';
import type {
  ServiceContext,
  SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  ListVendorsInputSchema,
  type ListVendorsInput,
  type ListVendorsInputRaw,
  type ListVendorsOutput,
} from '@/shared/schemas/spend/listVendors.schema';
import type {
  VendorMatchInput,
  VendorMatchResult,
  VendorCandidate,
} from '@/agent/orchestrator/extraction/types';

// Per ADR-0014 §9 vendor-matcher confidence threshold (v1-fixed 0.80;
// NOT a reserved org_settings column at v1 per chunk 7.3a brief §4
// value pick #3).
const VENDOR_MATCH_THRESHOLD_V1 = 0.8;

async function listVendors(
  input: ListVendorsInputRaw,
  ctx: ServiceContext,
): Promise<ListVendorsOutput> {
  let parsed: ListVendorsInput;
  try {
    parsed = ListVendorsInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `list_vendors input validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id,
  });

  const db = adminClient();
  const { data, error } = await db
    .from('vendors')
    .select('vendor_id, name, is_active')
    .eq('org_id', parsed.org_id)
    .order('name', { ascending: true });

  if (error) {
    log.error({ err: error.message }, 'list_vendors query failed');
    throw new ServiceError(
      'READ_FAILED',
      `list_vendors query failed: ${error.message}`,
    );
  }

  return {
    vendors: (data ?? []).map((row) => ({
      vendor_id: row.vendor_id,
      name: row.name,
      is_active: row.is_active,
    })),
  };
}

/**
 * matchVendor — Stage 5 vendor matcher per ADR-0014 §9. READ-ONLY
 * Pattern B per Reading B (ADR-0007 §Tier 2 + ADR-0011 §11).
 *
 * Reads vendor identity-and-matching fields ONLY per Q29 ESLint
 * boundary (name + tax_id + email + domain extracted from email).
 * MUST NOT read bank-detail fields, transactional state, or
 * payment-risk fields.
 *
 * 6-strategy cascade per chunk 7.3a brief §4 value pick #3 with
 * Phase A Step 15 adjustment: vendors.aliases column absent in
 * initial_schema.sql; alias strategy dropped from original 7-strategy
 * cascade. Banked at chunk 7.3a close report as Phase A divergence.
 *
 *   1. exact_name (case-insensitive ILIKE vendors.name; confidence 1.0)
 *   2. tax_id (exact match vendors.tax_id; confidence 1.0)
 *   3. email (exact match vendors.email; confidence 0.90)
 *   4. domain (vendor.email LIKE %@<domain>; confidence 0.85)
 *   5. fuzzy_name (length-ratio Jaccard via ILIKE substring; confidence per score)
 *   6. no_match (no candidates above threshold 0.80)
 */
async function matchVendor(
  input: VendorMatchInput,
  ctx: ServiceContext | SystemActorServiceContext,
): Promise<VendorMatchResult> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id ?? undefined,
  });
  const db = adminClient();

  const { org_id, vendorField } = input;
  const nameQuery =
    vendorField.vendor_name ?? vendorField.vendor_text ?? vendorField.merchant_text;

  // Strategy 1: exact_name (case-insensitive ILIKE).
  if (nameQuery) {
    const { data, error } = await db
      .from('vendors')
      .select('vendor_id, name, tax_id, email')
      .eq('org_id', org_id)
      .ilike('name', nameQuery)
      .limit(5);
    if (error) {
      log.error({ err: error.message, strategy: 'exact_name' }, 'matchVendor query failed');
      throw new ServiceError(
        'READ_FAILED',
        `matchVendor exact_name query failed: ${error.message}`,
      );
    }
    if (data && data.length > 0) {
      return {
        vendor_id: data[0]!.vendor_id as string,
        confidence: 1.0,
        match_type: 'exact_name',
        candidate_alternatives: [],
      };
    }
  }

  // Strategy 2: tax_id (exact match).
  if (vendorField.tax_id) {
    const { data, error } = await db
      .from('vendors')
      .select('vendor_id, name, tax_id, email')
      .eq('org_id', org_id)
      .eq('tax_id', vendorField.tax_id)
      .limit(1);
    if (error) {
      log.error({ err: error.message, strategy: 'tax_id' }, 'matchVendor query failed');
      throw new ServiceError(
        'READ_FAILED',
        `matchVendor tax_id query failed: ${error.message}`,
      );
    }
    if (data && data.length > 0) {
      return {
        vendor_id: data[0]!.vendor_id as string,
        confidence: 1.0,
        match_type: 'tax_id',
        candidate_alternatives: [],
      };
    }
  }

  // Strategy 3: email (exact match).
  if (vendorField.email) {
    const { data, error } = await db
      .from('vendors')
      .select('vendor_id, name, tax_id, email')
      .eq('org_id', org_id)
      .eq('email', vendorField.email)
      .limit(1);
    if (error) {
      log.error({ err: error.message, strategy: 'email' }, 'matchVendor query failed');
      throw new ServiceError(
        'READ_FAILED',
        `matchVendor email query failed: ${error.message}`,
      );
    }
    if (data && data.length > 0) {
      return {
        vendor_id: data[0]!.vendor_id as string,
        confidence: 0.9,
        match_type: 'email',
        candidate_alternatives: [],
      };
    }
  }

  // Strategy 4: domain (extracted from email; vendors with same email domain).
  if (vendorField.email && vendorField.email.includes('@')) {
    const domain = vendorField.email.split('@')[1];
    if (domain) {
      const { data, error } = await db
        .from('vendors')
        .select('vendor_id, name, tax_id, email')
        .eq('org_id', org_id)
        .ilike('email', `%@${domain}`)
        .limit(5);
      if (error) {
        log.error({ err: error.message, strategy: 'domain' }, 'matchVendor query failed');
        throw new ServiceError(
          'READ_FAILED',
          `matchVendor domain query failed: ${error.message}`,
        );
      }
      if (data && data.length === 1) {
        return {
          vendor_id: data[0]!.vendor_id as string,
          confidence: 0.85,
          match_type: 'domain',
          candidate_alternatives: [],
        };
      }
      if (data && data.length > 1) {
        const candidates: VendorCandidate[] = data.slice(0, 3).map((row) => ({
          vendor_id: row.vendor_id as string,
          vendor_name: row.name as string,
          match_type: 'domain',
          confidence: 0.85,
        }));
        return {
          vendor_id: null,
          confidence: 0,
          match_type: 'no_match',
          candidate_alternatives: candidates,
        };
      }
    }
  }

  // Strategy 5: fuzzy_name via length-ratio Jaccard (no pg_trgm at v1).
  if (nameQuery) {
    const { data, error } = await db
      .from('vendors')
      .select('vendor_id, name, tax_id, email')
      .eq('org_id', org_id)
      .ilike('name', `%${nameQuery}%`)
      .limit(5);
    if (error) {
      log.error({ err: error.message, strategy: 'fuzzy_name' }, 'matchVendor query failed');
      throw new ServiceError(
        'READ_FAILED',
        `matchVendor fuzzy_name query failed: ${error.message}`,
      );
    }
    if (data && data.length > 0) {
      const scored = data
        .map((row) => {
          const score = computeFuzzyScore(nameQuery, row.name as string);
          return { row, score };
        })
        .sort((a, b) => b.score - a.score);

      const best = scored[0]!;
      if (best.score >= VENDOR_MATCH_THRESHOLD_V1) {
        return {
          vendor_id: best.row.vendor_id as string,
          confidence: best.score,
          match_type: 'fuzzy_name',
          candidate_alternatives: scored.slice(1, 4).map((s) => ({
            vendor_id: s.row.vendor_id as string,
            vendor_name: s.row.name as string,
            match_type: 'fuzzy_name',
            confidence: s.score,
          })),
        };
      }
      const candidates: VendorCandidate[] = scored.slice(0, 3).map((s) => ({
        vendor_id: s.row.vendor_id as string,
        vendor_name: s.row.name as string,
        match_type: 'fuzzy_name',
        confidence: s.score,
      }));
      return {
        vendor_id: null,
        confidence: 0,
        match_type: 'no_match',
        candidate_alternatives: candidates,
      };
    }
  }

  return {
    vendor_id: null,
    confidence: 0,
    match_type: 'no_match',
    candidate_alternatives: [],
  };
}

/**
 * Length-ratio Jaccard approximation. Returns a value in [0, 1].
 * v1 floor pending pg_trgm extension activation.
 */
function computeFuzzyScore(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 1.0;
  if (bLower.includes(aLower) || aLower.includes(bLower)) {
    const longer = Math.max(aLower.length, bLower.length);
    const shorter = Math.min(aLower.length, bLower.length);
    return shorter / longer;
  }
  const aWords = new Set(aLower.split(/\s+/));
  const bWords = new Set(bLower.split(/\s+/));
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

export const vendorService = {
  listVendors,
  matchVendor,
};
