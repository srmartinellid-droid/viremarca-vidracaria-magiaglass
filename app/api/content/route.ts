import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { DEFAULT_HOME, DEFAULT_SERVICES, DEFAULT_GALLERY, DEFAULT_SETTINGS } from '@/lib/default-data';
import { isAdmin } from '@/lib/auth';

const defaults: Record<string, unknown> = { home: DEFAULT_HOME, services: DEFAULT_SERVICES, gallery: DEFAULT_GALLERY, settings: DEFAULT_SETTINGS };
const allowed = new Set(Object.keys(defaults));

export async function GET() {
  await ensureSchema();
  const result = await db.execute('SELECT key,value FROM site_content');
  const out: Record<string, unknown> = { ...defaults };
  for (const row of result.rows) {
    try { out[String(row.key)] = JSON.parse(String(row.value)); } catch { /* keep default */ }
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  await ensureSchema();
  const body = await req.json();
  if (!allowed.has(body.key)) return NextResponse.json({ error: 'Chave inválida' }, { status: 400 });
  await db.execute({
    sql: 'INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
    args: [body.key, JSON.stringify(body.value), new Date().toISOString()],
  });
  return NextResponse.json({ ok: true });
}
