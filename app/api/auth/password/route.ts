import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  const { oldPassword, newPassword } = await req.json();
  if (typeof newPassword !== 'string' || newPassword.length < 12) return NextResponse.json({ ok: false, error: 'A nova senha deve ter pelo menos 12 caracteres' }, { status: 400 });
  await ensureSchema();
  const result = await db.execute('SELECT password_hash FROM admin_users WHERE id=1');
  if (!result.rows.length || !(await bcrypt.compare(oldPassword || '', String(result.rows[0].password_hash)))) return NextResponse.json({ ok: false }, { status: 400 });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.execute({ sql: 'UPDATE admin_users SET password_hash=?,updated_at=? WHERE id=1', args: [passwordHash, new Date().toISOString()] });
  return NextResponse.json({ ok: true });
}
