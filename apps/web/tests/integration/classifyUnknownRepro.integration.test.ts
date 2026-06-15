// tests/integration/classifyUnknownRepro.integration.test.ts
//
// Board-#3 classify-unknown repro-runner (LIVE, gated). On-demand operator
// diagnostic — NOT a CI assertion target. Reads real exception_queue_entries
// (point SUPABASE_TEST_URL at the target DB) and, for any unknown_document_type
// rows, re-runs the REAL classifier (Tier C → paid Claude) to decide repro-or-
// drop. Grounded 2026-06-14: prod has 0 unknown_document_type rows (all 4 are
// unmatched_router_candidate), so the repro set is empty today; the teeth
// activate when such a row appears. Gated: RUN_CLASSIFY_UNKNOWN_REPRO=1 +
// ANTHROPIC_API_KEY (real Claude is billed).

import { describe, it, expect } from 'vitest';
import { adminClient } from '@/db/adminClient';
import { classifyDocumentType } from '@/agent/orchestrator/extraction/classifier';
import type { DocumentArtifactRow } from '@/agent/orchestrator/extraction/types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import {
  tallyByReason,
  selectUnknownRows,
  reproVerdict,
} from '../helpers/classifyUnknownRepro';

const SHOULD_RUN =
  process.env.RUN_CLASSIFY_UNKNOWN_REPRO === '1' &&
  Boolean(process.env.ANTHROPIC_API_KEY);

interface ExceptionRow {
  document_case_id: string;
  source_document_id: string | null;
  org_id: string;
  exception_reason: string;
}

describe.skipIf(!SHOULD_RUN)(
  'board-#3 — classify-unknown repro-runner (LIVE, paid Claude)',
  () => {
    it('discriminating query: tallies exception_queue_entries by exception_reason', async () => {
      const db = adminClient();
      const { data, error } = await db
        .from('exception_queue_entries')
        .select('exception_reason');
      expect(error).toBeNull();
      const tally = tallyByReason((data ?? []) as { exception_reason: string }[]);
      // eslint-disable-next-line no-console
      console.log('exception_reason tally =', JSON.stringify(tally));
      expect(typeof tally).toBe('object');
    });

    it('repro-or-drop: re-classifies every unknown_document_type row', async () => {
      const db = adminClient();
      const { data, error } = await db
        .from('exception_queue_entries')
        .select('document_case_id, source_document_id, org_id, exception_reason');
      expect(error).toBeNull();
      const unknownRows = selectUnknownRows((data ?? []) as ExceptionRow[]);

      const verdicts: { source_document_id: string; verdict: string }[] = [];
      for (const row of unknownRows) {
        if (!row.source_document_id) continue; // no OCR to re-run on
        // .single() assumes ONE artifact row per source_document. If an
        // activating row ever points at a source_document carrying multiple
        // artifact rows (e.g. a re-OCR), .single() THROWS — at that point
        // switch to .maybeSingle() or .order(...).limit(1). Inert today
        // (0 unknown_document_type rows); a when-this-activates heads-up.
        const { data: art } = await db
          .from('document_artifacts')
          .select('*')
          .eq('source_document_id', row.source_document_id)
          .single();
        const ctx: SystemActorServiceContext = {
          trace_id: `repro-${row.document_case_id}`,
          caller: { user_id: null, system_actor: 'classify_unknown_repro' },
          org_id: row.org_id,
        };
        const classification = await classifyDocumentType(
          {
            ocrArtifact: art as unknown as DocumentArtifactRow,
            source_document_id: row.source_document_id,
            trace_id: ctx.trace_id,
          },
          ctx,
        );
        verdicts.push({
          source_document_id: row.source_document_id,
          verdict: reproVerdict(classification.result.documentType),
        });
      }
      // eslint-disable-next-line no-console
      console.log('repro verdicts =', JSON.stringify(verdicts));
      expect(verdicts.length).toBe(
        unknownRows.filter((r) => r.source_document_id).length,
      );
    });
  },
);
