import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN && process.env.ADMIN_SECRET);
  return NextResponse.json({ ok: configured }, { status: configured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
