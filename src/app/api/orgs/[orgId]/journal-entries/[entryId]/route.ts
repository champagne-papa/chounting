import { NextResponse } from 'next/server';
import { journalEntryService } from '@/services/accounting/journalEntryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; entryId: string }> }
) {
  try {
    const { orgId, entryId } = await params;
    const ctx = await buildServiceContext(req);

    const entry = await journalEntryService.get(
      { org_id: orgId, journal_entry_id: entryId },
      ctx
    );

    // URL/data consistency: verify the entry belongs to the org in the URL.
    // Prevents URL spoofing (/orgs/orgA/journal-entries/entryFromOrgB).
    // Returns 404 (not 403) to avoid leaking existence. Post-S29b the
    // wrap's Invariant 3 already gates org_id consistency against caller's
    // memberships; this in-handler check defends against URL-vs-result
    // mismatch when the entry happens to belong to a different org the
    // caller IS a member of.
    if (entry.org_id !== orgId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
