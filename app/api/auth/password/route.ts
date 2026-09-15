import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Sessão administrativa expirada ou inválida. Faça login novamente.' },
        { status: 401, headers: noStore }
      );
    }

    const body = await req.json().catch(() => ({}));
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!oldPassword) {
      return NextResponse.json(
        { ok: false, error: 'Informe a senha atual.' },
        { status: 400, headers: noStore }
      );
    }

    if (newPassword.length < 12) {
      return NextResponse.json(
        { ok: false, error: 'A nova senha deve ter pelo menos 12 caracteres.' },
        { status: 400, headers: noStore }
      );
    }

    await ensureSchema();
    const result = await db.execute('SELECT password_hash FROM admin_users WHERE id=1 LIMIT 1');

    if (!result.rows.length) {
      return NextResponse.json(
        { ok: false, error: 'Usuário administrativo não encontrado no banco de dados.' },
        { status: 500, headers: noStore }
      );
    }

    const currentHash = String(result.rows[0].password_hash || '');
    const validCurrentPassword = await bcrypt.compare(oldPassword, currentHash);

    if (!validCurrentPassword) {
      return NextResponse.json(
        { ok: false, error: 'A senha atual informada não corresponde à senha cadastrada.' },
        { status: 400, headers: noStore }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.execute({
      sql: 'UPDATE admin_users SET password_hash=?,updated_at=? WHERE id=1',
      args: [passwordHash, new Date().toISOString()],
    });

    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    console.error('[admin-password]', error);
    return NextResponse.json(
      { ok: false, error: 'Não foi possível alterar a senha no banco de dados.' },
      { status: 500, headers: noStore }
    );
  }
}
