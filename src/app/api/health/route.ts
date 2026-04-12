// src/app/api/health/route.ts
// GET /api/health -> { status: "ok" }

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
