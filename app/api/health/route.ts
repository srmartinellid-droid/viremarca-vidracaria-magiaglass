import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = {
    tursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    tursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    adminSecret: Boolean(process.env.ADMIN_SECRET),
    initialPassword: Boolean(process.env.ADMIN_INITIAL_PASSWORD),
  };

  if (!configured.tursoUrl || !configured.tursoToken) {
    return NextResponse.json(
      { ok: false, configured, database: 'not_configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    await ensureSchema();
    const result = await db.execute('SELECT COUNT(*) AS count FROM admin_users');
    return NextResponse.json(
      {
        ok: true,
        configured,
        database: 'connected',
        adminUser: Number(result.rows[0]?.count ?? 0) > 0 ? 'initialized' : 'not_initialized',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[health]', error);
    return NextResponse.json(
      { ok: false, configured, database: 'error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
