import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { DEFAULT_HOME, DEFAULT_SERVICES, DEFAULT_GALLERY, DEFAULT_SETTINGS } from '@/lib/default-data';
import { isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const defaults: Record<string, unknown> = { home: DEFAULT_HOME, services: DEFAULT_SERVICES, gallery: DEFAULT_GALLERY, settings: DEFAULT_SETTINGS };
const allowed = new Set(Object.keys(defaults));
const MAX_CONTENT_BYTES = 3_200_000;

export async function GET() {
  try {
    await ensureSchema();
    const result = await db.execute('SELECT key,value FROM site_content');
    const out: Record<string, unknown> = { ...defaults };
    for (const row of result.rows) {
      try { out[String(row.key)] = JSON.parse(String(row.value)); } catch { /* keep default */ }
    }
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar os dados.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const raw = await req.text();
    const size = new TextEncoder().encode(raw).byteLength;
    if (size > MAX_CONTENT_BYTES) {
      return NextResponse.json({ error: 'Conteúdo grande demais para salvar. Reduza o tamanho das imagens.' }, { status: 413 });
    }

    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || typeof body.key !== 'string' || !allowed.has(body.key)) {
      return NextResponse.json({ error: 'Chave inválida' }, { status: 400 });
    }
    if (!Object.prototype.hasOwnProperty.call(body, 'value')) {
      return NextResponse.json({ error: 'Valor ausente' }, { status: 400 });
    }

    await ensureSchema();
    await db.execute({
      sql: 'INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
      args: [body.key, JSON.stringify(body.value), new Date().toISOString()],
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não foi possível gravar os dados no banco.' }, { status: 500 });
  }
}
