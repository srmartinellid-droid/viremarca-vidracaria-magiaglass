import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureSchema } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  await ensureSchema();
  const { password } = await req.json();
  const existing = await db.execute('SELECT password_hash FROM admin_users WHERE id=1');
  if (!existing.rows.length) {
    const initial = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initial) return NextResponse.json({ ok: false, error: 'ADMIN_INITIAL_PASSWORD não configurada' }, { status: 503 });
    const passwordHash = await bcrypt.hash(initial, 12);
    await db.execute({ sql: 'INSERT INTO admin_users(id,password_hash,updated_at) VALUES(1,?,?)', args: [passwordHash, new Date().toISOString()] });
  }
  const result = await db.execute('SELECT password_hash FROM admin_users WHERE id=1');
  const ok = await bcrypt.compare(password || '', String(result.rows[0].password_hash));
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  await createSession();
  return NextResponse.json({ ok: true });
}
