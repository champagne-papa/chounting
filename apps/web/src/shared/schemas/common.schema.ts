import { z } from 'zod';

// Postgres timestamptz round-trips with offset form (e.g.
// '2026-05-12T22:04:25.123+00:00'), not the Z-suffix form that
// Zod's z.string().datetime() accepts by default. Use this
// helper for timestamptz column read-back across schemas.
// Background: friction-journal entry at dd3f774 (Phase 2 chunk 1
// SHIPPED — three substrate findings).
export const TimestamptzString = z.string();
