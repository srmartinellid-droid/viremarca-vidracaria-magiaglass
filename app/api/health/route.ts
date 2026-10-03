import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await isAdmin().catch(() => false);
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    return NextResponse.json(admin
      ? { ok: false, configured: { tursoUrl: false, tursoToken: false, adminSecret: Boolean(process.env.ADMIN_SECRET), initialPassword: Boolean(process.env.ADMIN_INITIAL_PASSWORD) }, database: 'not_configured' }
      : { ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    await ensureSchema();
    if (!admin) return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    const result = await db.execute('SELECT COUNT(*) AS count FROM admin_users');
    return NextResponse.json({
      ok: true,
      configured: { tursoUrl: true, tursoToken: true, adminSecret: Boolean(process.env.ADMIN_SECRET), initialPassword: Boolean(process.env.ADMIN_INITIAL_PASSWORD) },
      database: 'connected',
      adminUser: Number(result.rows[0]?.count ?? 0) > 0 ? 'initialized' : 'not_initialized',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[health]', error);
    return NextResponse.json({ ok: false }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
