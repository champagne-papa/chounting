# Service-layer conventions

Service template structure, three-consumer pattern, route handlers,
middleware, webhook handler discipline, error-handling review. The
rules that govern code under `src/services/` and the surfaces
adjacent to it.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

---

## Error-Handling Review Rule

Every `catch` block, every `if (error)` branch, and every
assigned-but-unused error variable in new service code must either
(a) throw, (b) `log.error` with context, or (c) carry a code
comment explaining why the error is safe to swallow. Silent error
absorption is a review-fail.

Codified from the three `invitationService` bugs found in the
Phase 1.5B closeout review — two of the three bugs were hidden
because errors were caught and swallowed, so tests passed on the
happy path. See `docs/07_governance/friction-journal/phase-1.5.md` entry
2026-04-15 (invitationService bugs) for the full incident.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=3 (three `invitationService` bugs hidden by
  swallowed errors, found in Phase 1.5B closeout review)
- Promoted from: Phase 1.5B closeout review
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.5.md` entry
  2026-04-15 (invitationService bugs)

---

## Worked Example — Posting a Journal Entry

This worked example demonstrates the entire Phase 1 stack end-to-end
for the simplest possible financial transaction. Every other module
follows the same pattern.

A journal entry is the atom of accounting. Every other module —
bills, invoices, payments, reconciliation — eventually produces a
journal entry. If `postJournalEntry` works correctly with the full
stack (Zod validation → service middleware → deferred constraint →
audit log → canvas directive), every other module can follow the same
pattern.

### Output Schema

The output schema for a journal entry post. The `ProposedEntryCard`
shape is what the agent returns in dry-run mode; the
`PostJournalEntryOutput` wraps it with a status and canvas directive.

```typescript
export const ProposedEntryCardSchema = z.object({
  org_id: z.string().uuid(),
  org_name: z.string(),
  transaction_type: z.enum(['journal_entry', 'bill', 'payment', 'intercompany']),
  vendor_name: z.string().optional(),
  matched_rule_label: z.string().optional(),
  lines: z.array(z.object({
    account_code: z.string(),
    account_name: z.string(),
    debit: MoneyAmountSchema,
    credit: MoneyAmountSchema,
    currency: z.string().length(3),
  })),
  intercompany_flag: z.boolean(),
  reciprocal_entry_preview: z.unknown().optional(),
  agent_reasoning: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'novel']),
  routing_path: z.string().optional(),
  idempotency_key: z.string().uuid(),
  dry_run_entry_id: z.string().uuid(),
});

export const PostJournalEntryOutputSchema = z.object({
  journal_entry_id: z.string().uuid(),
  status: z.enum(['draft', 'posted', 'proposed']),
  proposed_entry_card: ProposedEntryCardSchema.optional(),
  canvas_directive: z.discriminatedUnion('type', [
    z.object({ type: z.literal('journal_entry'), entryId: z.string().uuid(), mode: z.enum(['view', 'edit']) }),
    z.object({ type: z.literal('proposed_entry_card'), card: ProposedEntryCardSchema }),
  ]),
});

export type PostJournalEntryOutput = z.infer<typeof PostJournalEntryOutputSchema>;
```

### The Same Schema, Three Consumers

The same Zod schema is imported by:

**1. Next.js API route**
(`src/app/api/orgs/[orgId]/journal-entries/route.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = PostJournalEntryInputSchema.parse(body);
  const ctx = await buildServiceContext(request);
  const result = await withInvariants(journalEntryService.post)(parsed, ctx);
  return Response.json(result);
}
```

**2. Double Entry Agent tool**
(`src/agent/tools/postJournalEntry.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const postJournalEntryTool = {
  name: 'postJournalEntry',
  description: 'Create a journal entry. Always use dry_run=true on the first call.',
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
};
```

**3. Manual journal entry form**
(`src/components/canvas/JournalEntryForm.tsx`):

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PostJournalEntryInputSchema, type PostJournalEntryInput }
  from '@/shared/schemas/accounting/journalEntry.schema';

export function JournalEntryForm({ orgId }: { orgId: string }) {
  const form = useForm<PostJournalEntryInput>({
    resolver: zodResolver(PostJournalEntryInputSchema),
    defaultValues: { org_id: orgId, source: 'manual', dry_run: false, lines: [] },
  });
}
```

One schema, three consumers, one source of truth. If the schema
changes, all three break in the same way at compile time, and the
change is visible in exactly one PR.

### Service Function Template

`src/services/accounting/journalEntryService.ts` — the template
every other service function follows:

```typescript
import { PostJournalEntryInputSchema, type PostJournalEntryInput }
  from '@/shared/schemas/accounting/journalEntry.schema';
import { type ServiceContext } from '@/services/middleware/serviceContext';
import { canUserPerformAction } from '@/services/auth/canUserPerformAction';
import { periodService } from '@/services/accounting/periodService';
import { recordMutation } from '@/services/audit/recordMutation';
import { adminClient } from '@/db/adminClient';
import { logger } from '@/shared/logger/pino';

export const journalEntryService = {
  async post(input: PostJournalEntryInput, ctx: ServiceContext) {
    // 0. Re-validate at the service boundary (defense-in-depth)
    const validated = PostJournalEntryInputSchema.parse(input);

    // 1. Idempotency check (only for agent source) — BEFORE any work
    if (validated.source === 'agent' && validated.idempotency_key) {
      const existing = await adminClient
        .from('ai_actions')
        .select('*, journal_entries(*)')
        .eq('org_id', validated.org_id)
        .eq('idempotency_key', validated.idempotency_key)
        .maybeSingle();
      if (existing.data) {
        logger.info({ trace_id: ctx.trace_id, idempotency_key: validated.idempotency_key },
          'Idempotency hit — returning existing result');
        return buildOutputFromExistingAction(existing.data);
      }
    }

    // 2. Authorization — INV-AUTH-001
    const authResult = await canUserPerformAction(ctx, 'journal_entry.post', validated.org_id);
    if (!authResult.permitted) {
      throw new ServiceError('PERMISSION_DENIED', authResult.reason);
    }

    // 3. Period check
    const periodCheck = await periodService.isOpen(validated.org_id, validated.entry_date);
    if (!periodCheck.is_open) {
      throw new ServiceError('PERIOD_LOCKED',
        `${periodCheck.period_name} is locked.`);
    }

    // 4. Debit=credit balance enforced upstream (Zod refine) and
    //    downstream (deferred constraint at COMMIT — INV-LEDGER-001).
    //    No application-layer re-check here.

    // 5. DRY RUN: build the proposed card without persisting
    if (validated.dry_run) {
      const card = await buildProposedEntryCard(validated, ctx);
      return {
        journal_entry_id: card.dry_run_entry_id,
        status: 'proposed' as const,
        proposed_entry_card: card,
        canvas_directive: { type: 'proposed_entry_card' as const, card },
      };
    }

    // 6. CONFIRMED: persist inside a single transaction
    const result = await adminClient.rpc('post_journal_entry_tx', {
      p_input: validated,
      p_trace_id: ctx.trace_id,
      p_user_id: ctx.caller.user_id,
    });

    if (result.error) {
      logger.error({ trace_id: ctx.trace_id, error: result.error },
        'Journal entry post failed');
      throw new ServiceError('POST_FAILED', result.error.message);
    }

    logger.info({
      trace_id: ctx.trace_id,
      journal_entry_id: result.data.journal_entry_id,
      org_id: validated.org_id,
    }, 'Journal entry posted');

    return {
      journal_entry_id: result.data.journal_entry_id,
      status: 'posted' as const,
      canvas_directive: {
        type: 'journal_entry' as const,
        entryId: result.data.journal_entry_id,
        mode: 'view' as const,
      },
    };
  },
};
```

This is the template every other service function follows: validate
at the boundary; check idempotency first; check authorization; check
business rules; either dry-run or persist inside a single
transaction; log with `trace_id`; return a typed result with a canvas
directive. The `withInvariants()` middleware wraps this function from
the outside, performing universal pre-flight checks before the
function body runs.

---
**Origin:**
- First codified: PLAN.md §3b-§3d worked-example appendix (Phase 1.1
  closeout restructure)
- Evidence basis: N=multiple (template followed by every service)
- Promoted from: PLAN.md worked-example extraction during Phase 1.1
  closeout
- Cross-references: `src/services/accounting/journalEntryService.ts`,
  `withInvariants`, ADR-0001 (service layer pattern)

---

## Webhook route handler conventions

Conventions for external-webhook routes — provider-invoked HTTP
endpoints that receive substrate from third-party services (Postmark
inbound mail; future Stripe / auth callbacks / etc.).

**Directory convention.** Webhook routes live at
`apps/web/src/app/api/webhooks/<provider>-<event>/route.ts`. Frontend-
invoked routes stay at `/api/orgs/[orgId]/...`. The semantic
distinction is **who invokes** (third-party HMAC-verified vs.
user-session-authenticated) and **how `org_id` is derived** (resolver
helper vs. URL parameter). Future webhook routes inherit this
directory layout.

**System-actor route handler pattern.** Webhook route handlers bypass
`withInvariants` and construct `SystemActorServiceContext` directly
with `caller: { user_id: null, system_actor: '<source>' }`. The
discriminator is **invocation source**: third-party HMAC-verified
webhook (system-actor) vs. authenticated user session (user-session).
Future system-actor surfaces (cron, scheduled tasks, other webhook
providers) inherit this pattern. The runtime guarantee that
`withInvariants` normally provides (verified caller + memberships-vs-
input-org check) is replaced by HMAC verification + provider-specific
org-resolve at the route handler boundary.

**`SystemActorServiceContext` sister type.** Sister type to
`ServiceContext` (NOT a discriminated-union extension). Existing
`ctx.caller.user_id` consumer sites unchanged. `recordMutation`
widens its accepted ctx shape to `ServiceContext |
SystemActorServiceContext`; storage provider methods widen `ctx`
to `StorageProviderContext` (same union) to accept system-actor
invocation at storage put time. Service methods that need to support
**both** invocation modes declare the union at parameter type
(explicit signature, not implicit narrowing). The "two ServiceContext
types" cost is bounded; the alternative (consumer-site narrowing at
discriminated-union extension) is scope-disproportionate to the
value at one new system-actor caller grain.

**HMAC constant-time signature comparison.** Webhook handlers use
`crypto.timingSafeEqual` (node:crypto) on equal-length hex digests
for signature verification. Direct `===` string comparison on
signature digests is an anti-pattern (timing-attack reconstruction
of the secret); `timingSafeEqual` is the canonical Node.js stdlib
primitive for constant-time digest comparison. The helper pattern:
compute expected digest → length-check → wrap in `timingSafeEqual`.

**Cross-references.**
- `apps/web/src/app/api/webhooks/postmark-inbound/route.ts` — first
  instance precedent for all four sub-conventions at chunk 6.3a.
- `apps/web/src/services/middleware/serviceContext.ts` —
  `SystemActorServiceContext` sister type definition.
- `apps/web/src/services/audit/recordMutation.ts` — union-widening
  surface for system-actor audit emission.

---
**Origin:**
- First codified: Phase 6 chunk 6.3a (first-instance precedent —
  Postmark inbound webhook)
- Evidence basis: N=1 with explicit "future webhook providers inherit
  this pattern" framing
- Promoted from: chunk 6.3a implementation notes
- Cross-references:
  `apps/web/src/app/api/webhooks/postmark-inbound/route.ts`;
  `apps/web/src/services/middleware/serviceContext.ts`;
  `apps/web/src/services/audit/recordMutation.ts`
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Consumer-side synthetic ServiceContext for system_actor orchestrator invocations (substrate-shim discipline)

Deterministic-TS orchestrators (Tier 2 document pipeline orchestrator
per ADR-0014 §1; future Tier 2.5 orchestrators) run as
system_actor — caller.user_id is a synthetic sentinel
(`system_actor:<orchestrator_name>`), not a verified user UUID.
The orchestrator invokes wrapped service functions via `withInvariants`
to satisfy INV-AUTH-001 pre-flight checks (context shape +
trace_id + verified caller + org-access + role-based authorization).
`withInvariants` expects `ServiceContext` shape (`VerifiedCaller`
with user_id: string + email + verified: true + org_ids: string[]),
NOT `SystemActorServiceContext` shape (which has user_id: null +
system_actor: string + org_id: string).

The discipline at the consumer-side: orchestrator constructs a
**synthetic ServiceContext** satisfying the structural shape for
`withInvariants` pre-flight, with:

```typescript
const synthCtxForCommit: ServiceContext = {
  trace_id: input.trace_id,
  caller: {
    user_id: `system_actor:${SYSTEM_ACTOR}`,
    email: 'system@bridge.local',
    verified: true as const,
    org_ids: [input.org_id],
  },
};
```

The synthetic shape satisfies the four `withInvariants` pre-flight
invariants:

1. **ServiceContext shape** — `ctx` well-formed; `trace_id`,
   `caller.user_id` present.
2. **Verified caller** — `caller.verified = true as const`. The
   sentinel user_id naming (`system_actor:<name>`) marks this as
   structurally-verified-but-synthetic; downstream `canUserPerformAction`
   queries will return no membership rows for the sentinel user_id
   (the action option must therefore be omitted OR routed to a
   role-permission that doesn't require user-grade membership).
3. **org-access** — `caller.org_ids = [input.org_id]` satisfies
   `withInvariants` Invariant 3 (input's org_id is a member of the
   caller's org_ids). The orchestrator's own org-resolve guarantee
   replaces the user-session membership query.
4. **Role-based authorization** — if `{action}` option is provided,
   `canUserPerformAction` runs against the sentinel user_id and
   returns no membership; therefore action option SHOULD be omitted
   for orchestrator-driven commits unless a system-actor-grade
   role-permission is named at the ACTION_NAMES enum. Omission
   skips role-based authorization while preserving Invariants 1-3.

**Trigger:** any orchestrator authoring that invokes wrapped service
functions via `withInvariants` from a system_actor calling context.

**Evidence basis (N=2 cross-chunk):**

- **chunk 7.3a Stage 6** (commit `8499189`) — Tier 2 document
  pipeline orchestrator's `match_against_existing_state` stage
  invokes `documentRouterService.completeCandidate` (Phase 4
  Subsystem 1) via `withFailureClassification`-wrapped function
  with `synthCtxForRouter` shape (lines 292-300 of
  `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts`).
  First instance of consumer-side synthetic ServiceContext at
  orchestrator-to-service boundary.

- **chunk 7.3b Stage 7** (commit `ab0f7fe`) — Tier 2 document
  pipeline orchestrator's `build_proposal` Stage 7 commit composite
  invokes `withInvariants(billService.post, {action: 'bill.post'})`
  and `withInvariants(paymentService.record, {action: 'bill.record_payment'})`
  with `synthCtxForCommit` shape paralleling `synthCtxForRouter`.
  Second instance of consumer-side synthetic ServiceContext;
  cross-chunk evidence basis for the contract shape.

**Why the shape is precise + reusable.** The 5-field synthetic
ServiceContext is structurally identical across both instances
(trace_id + caller{user_id: sentinel, email: 'system@bridge.local',
verified: true, org_ids: [input.org_id]}). The sentinel user_id
naming convention (`system_actor:<orchestrator_name>`) generalizes
across future orchestrator surfaces; the email sentinel
(`system@bridge.local`) is a non-routable address marking this as
service-internal; org_ids carries the input's org_id verbatim.

**Substrate-shim framing — Phase 8 ADR amendment forward-pointer.**
The synthetic ServiceContext is a **substrate-shim**, NOT a
permanent contract. At v1 the system_actor-vs-VerifiedCaller
asymmetry is resolved at the consumer-side via shape coercion;
at post-v1, the canonical resolution is widening `withInvariants`'s
accepted ctx shape to a structural union (`ServiceContext |
SystemActorServiceContext`), parallel to the chunk 6.3a
`recordMutation` widening pattern. Phase 8 ADR amendment at
ADR-0007 §Tier 2 safety contract OR ADR-0011 §1 service-layer
contract codifies the proper widening; this convention's
consumer-side synthetic shape phases out post-amendment.

**How to apply.** At orchestrator authoring grade, construct
synthCtx with the 5-field shape above; name the sentinel
`system_actor:<orchestrator-name>` per orchestrator. Pass via
`withInvariants(serviceFn)(input, synthCtx)`. Document the
substrate-shim framing inline (cross-reference this convention)
so future readers understand the post-v1 widening trajectory.

**Cross-references.**
- `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts`
  lines 292-300 (synthCtxForRouter) + Stage 7 commit composite
  (synthCtxForCommit) — N=2 cross-chunk evidence.
- `apps/web/src/services/middleware/withInvariants.ts` lines 29-93
  — wrapper contract (4 pre-flight invariants).
- `apps/web/src/services/middleware/serviceContext.ts` —
  `VerifiedCaller` + `ServiceContext` + `SystemActorCaller` +
  `SystemActorServiceContext` type definitions.
- Phase 6 chunk 6.3a `recordMutation` widening pattern (sibling
  precedent for ctx-shape widening at consumer-side; eventual
  post-v1 model for `withInvariants` widening).
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #11 + retrospective inventory item #5 (Phase 8
  post-v1 ADR amendment forward-pointer).

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: N=2 cross-chunk (chunk 7.3a `synthCtxForRouter`
  at commit `8499189` + chunk 7.3b `synthCtxForCommit` at commit
  `ab0f7fe`); codification at N=2 defensible per Phase 7
  retrospective §2 §A Candidate #11 founder-ratification — contract
  shape is precise + reusable + paired with Phase 8 post-v1 ADR
  amendment forward-pointer (substrate-shim framing, not permanent
  contract)
- Promoted from: Phase 7 retrospective §3 Candidate #11
- Cross-references: Phase 7 retrospective §3 Candidate #11 + §5
  retrospective inventory item #5 (Phase 8 post-v1 ADR amendment)
