# Service-layer conventions

Service template structure, three-consumer pattern, route handlers,
middleware, webhook handler discipline, error-handling review. The
rules that govern code under `src/services/` and the surfaces
adjacent to it.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

Webhook route handler conventions are currently in repo-root
`CLAUDE.md`; they relocate to this file at Commit D of the v2.2
reorg (see `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1).

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
