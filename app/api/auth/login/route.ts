import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureSchema } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';

    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'Banco de dados não configurado no ambiente da aplicação.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'ADMIN_SECRET não configurada no ambiente da aplicação.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    await ensureSchema();

    const existing = await db.execute('SELECT password_hash FROM admin_users WHERE id=1 LIMIT 1');
    if (!existing.rows.length) {
      const initial = process.env.ADMIN_INITIAL_PASSWORD;
      if (!initial) {
        return NextResponse.json(
          { ok: false, error: 'ADMIN_INITIAL_PASSWORD não configurada. Defina a senha inicial no ambiente da aplicação.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      const passwordHash = await bcrypt.hash(initial, 12);
      await db.execute({
        sql: 'INSERT INTO admin_users(id,password_hash,updated_at) VALUES(1,?,?)',
        args: [passwordHash, new Date().toISOString()],
      });
    }

    const result = await db.execute('SELECT password_hash FROM admin_users WHERE id=1 LIMIT 1');
    if (!result.rows.length) {
      return NextResponse.json({ ok: false, error: 'Usuário administrativo não pôde ser inicializado.' }, { status: 500 });
    }

    const ok = await bcrypt.compare(password, String(result.rows[0].password_hash));
    if (!ok) return NextResponse.json({ ok: false, error: 'Senha incorreta.' }, { status: 401 });

    await createSession();
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin-login]', error);
    return NextResponse.json(
      { ok: false, error: 'Falha ao conectar ao banco de dados ou criar a sessão administrativa.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
