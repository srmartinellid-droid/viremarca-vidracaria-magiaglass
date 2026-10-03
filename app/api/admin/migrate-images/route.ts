import { createHash, createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { sameOrigin } from '@/lib/request-security';
import { processImage, type MediaPurpose } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const CONFIRMATION = 'MIGRAR IMAGENS';
const TOKEN_TTL_MS = 10 * 60 * 1000;
const DEFAULT_BATCH = 3;
const MAX_BATCH = 5;
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,/i;

type Row = { key: string; value: string; updated_at: string };
type Job = {
  key: string;
  path: Array<string | number>;
  dataUrl: string;
  altText: string;
  purpose: MediaPurpose;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function loadRows(): Promise<Row[]> {
  await ensureSchema();
  const result = await db.execute('SELECT key,value,updated_at FROM site_content ORDER BY key');
  return result.rows.map(row => ({
    key: String(row.key),
    value: String(row.value),
    updated_at: String(row.updated_at),
  }));
}

function snapshot(rows: Row[]) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    rows,
  };
}

function snapshotHash(rows: Row[]) {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}

function signToken(hash: string, expires: number) {
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret) throw new Error('ADMIN_SECRET não configurado.');
  const payload = `${hash}.${expires}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyToken(token: string, currentHash: string) {
  const secret = process.env.ADMIN_SECRET || '';
  const parts = token.split('.');
  if (!secret || parts.length !== 3) return false;
  const [hash, expiresRaw, signature] = parts;
  const expires = Number(expiresRaw);
  if (!hash || hash !== currentHash || !Number.isFinite(expires) || expires < Date.now()) return false;
  const payload = `${hash}.${expires}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  return signature.length === expected.length &&
    createHash('sha256').update(signature).digest('hex') === createHash('sha256').update(expected).digest('hex');
}

function isDataImage(value: unknown): value is string {
  return typeof value === 'string' && DATA_IMAGE_RE.test(value);
}

function purposeFor(key: string, path: Array<string | number>): MediaPurpose {
  const last = String(path[path.length - 1] ?? '').toLowerCase();
  if (last.includes('logo')) return 'logo';
  if (last.includes('hero')) return 'hero';
  if (key === 'services') return 'service';
  return 'gallery';
}

function altFor(key: string, path: Array<string | number>, root: unknown) {
  const parent = path.slice(0, -1).reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[String(segment)];
    return undefined;
  }, root);
  if (parent && typeof parent === 'object') {
    const obj = parent as Record<string, unknown>;
    for (const field of ['title', 'name', 'description']) {
      if (typeof obj[field] === 'string' && obj[field].trim()) return obj[field].trim().slice(0, 180);
    }
  }
  return `${key} · Magia Glass`;
}

function collectImages(value: unknown, key: string, path: Array<string | number> = [], root = value, out: Job[] = []) {
  if (isDataImage(value)) {
    out.push({
      key,
      path,
      dataUrl: value,
      altText: altFor(key, path, root),
      purpose: purposeFor(key, path),
    });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImages(item, key, [...path, index], root, out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([field, item]) => {
      collectImages(item, key, [...path, field], root, out);
    });
  }
  return out;
}

function setAtPath(root: unknown, path: Array<string | number>, replacement: string) {
  if (!path.length || !root || typeof root !== 'object') return;
  let cursor: any = root;
  for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
  cursor[path[path.length - 1]] = replacement;
}

function decodeDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error('Imagem Base64 inválida.');
  return { mime: match[1].toLowerCase(), bytes: Buffer.from(match[2], 'base64') };
}

async function buildJobs(rows: Row[]) {
  const parsed = new Map<string, unknown>();
  const jobs: Job[] = [];
  for (const row of rows) {
    let value: unknown;
    try {
      value = JSON.parse(row.value);
    } catch {
      continue;
    }
    parsed.set(row.key, value);
    collectImages(value, row.key, [], value, jobs);
  }
  return { parsed, jobs };
}

async function measureJobs(jobs: Job[]) {
  let before = 0;
  let after = 0;
  for (const job of jobs) {
    const { mime, bytes } = decodeDataUrl(job.dataUrl);
    const file = new File([bytes], 'legacy-image', { type: mime });
    const processed = await processImage(file, job.purpose);
    before += bytes.byteLength;
    after += processed.output.byteLength;
  }
  return { before, after };
}

async function upsertMedia(key: string, url: string, altText: string) {
  await db.execute({
    sql: 'INSERT INTO media(storage_key,url,purpose,alt_text,created_at) VALUES(?,?,?,?,?) ON CONFLICT(storage_key) DO UPDATE SET url=excluded.url,alt_text=excluded.alt_text',
    args: [key, url, 'gallery', altText.slice(0, 180), new Date().toISOString()],
  });
}

async function uploadJob(job: Job) {
  const { mime, bytes } = decodeDataUrl(job.dataUrl);
  const file = new File([bytes], 'legacy-image', { type: mime });
  const { output } = await processImage(file, job.purpose);
  const digest = createHash('sha256').update(output).digest('hex');
  const storageKey = `magiaglass/${job.purpose}/migrated-${digest}.webp`;
  const existing = await db.execute({ sql: 'SELECT url FROM media WHERE storage_key=? LIMIT 1', args: [storageKey] });
  const url = existing.rows.length
    ? String(existing.rows[0].url)
    : (await put(storageKey, output, {
        access: 'public',
        contentType: 'image/webp',
        addRandomSuffix: false,
        allowOverwrite: true,
      })).url;

  await upsertMedia(storageKey, url, job.altText);
  return { url, before: bytes.byteLength, after: output.byteLength };
}

export async function GET(request: Request) {
  if (!sameOrigin(request)) return jsonError('Origem não permitida.', 403);
  if (!(await isAdmin())) return jsonError('Não autorizado.', 401);

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  if (url.searchParams.get('download') !== '1' || !token) return jsonError('Backup não especificado.', 400);

  const rows = await loadRows();
  if (!verifyToken(token, snapshotHash(rows))) return jsonError('Backup expirado ou conteúdo alterado desde a preparação.', 409);

  const body = JSON.stringify(snapshot(rows), null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="magiaglass-content-backup.json"',
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError('Origem não permitida.', 403);
  if (!(await isAdmin())) return jsonError('Não autorizado.', 401);

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'dry-run');

    const rows = await loadRows();
    const hash = snapshotHash(rows);
    const { parsed, jobs } = await buildJobs(rows);

    if (action === 'dry-run' || action === 'prepare') {
      const measure = await measureJobs(jobs);
      const response: Record<string, unknown> = {
        ok: true,
        mode: action,
        imagesFound: jobs.length,
        beforeKb: Number((measure.before / 1024).toFixed(1)),
        estimatedAfterKb: Number((measure.after / 1024).toFixed(1)),
        estimatedSavedKb: Number(((measure.before - measure.after) / 1024).toFixed(1)),
        writes: 0,
        contentHash: hash,
        message: 'Nenhuma escrita foi realizada.',
      };
      if (action === 'prepare') {
        const expires = Date.now() + TOKEN_TTL_MS;
        const token = signToken(hash, expires);
        response.backupExpiresAt = new Date(expires).toISOString();
        response.backupDownloadUrl = `/api/admin/migrate-images?download=1&token=${encodeURIComponent(token)}`;
        response.confirmationToken = token;
        response.confirmationPhrase = CONFIRMATION;
      }
      return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action !== 'migrate') return jsonError('Ação inválida.', 400);
    if (!process.env.BLOB_READ_WRITE_TOKEN) return jsonError('Vercel Blob não está conectado no runtime.', 503);

    const token = typeof body.confirmationToken === 'string' ? body.confirmationToken : '';
    if (!token || !verifyToken(token, hash)) return jsonError('Faça um novo prepare e baixe o backup antes de migrar.', 409);
    if (body.confirm !== CONFIRMATION) return jsonError(`Confirmação obrigatória: ${CONFIRMATION}`, 400);

    const cursor = Math.max(0, Number(body.cursor || 0));
    const batchSize = Math.min(MAX_BATCH, Math.max(1, Number(body.batchSize || DEFAULT_BATCH)));
    if (!Number.isInteger(cursor)) return jsonError('Cursor inválido.', 400);

    const start = Date.now();
    const timeBudgetMs = 30_000;
    let processed = 0;
    let before = 0;
    let after = 0;
    const nextParsed = new Map(parsed);
    const changedKeys = new Set<string>();
    let nextCursor = cursor;

    while (nextCursor < jobs.length && processed < batchSize && Date.now() - start < timeBudgetMs) {
      const job = jobs[nextCursor];
      const currentRoot = nextParsed.get(job.key);
      if (!currentRoot) {
        nextCursor++;
        continue;
      }

      const currentValue = job.path.reduce<any>((value, segment) => value?.[segment], currentRoot);
      if (!isDataImage(currentValue)) {
        nextCursor++;
        continue;
      }

      const result = await uploadJob({ ...job, dataUrl: currentValue });
      setAtPath(currentRoot, job.path, result.url);
      changedKeys.add(job.key);
      before += result.before;
      after += result.after;
      processed++;
      nextCursor++;
    }

    for (const key of changedKeys) {
      const value = nextParsed.get(key);
      await db.execute({
        sql: 'INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
        args: [key, JSON.stringify(value), new Date().toISOString()],
      });
    }

    const done = nextCursor >= jobs.length;
    return NextResponse.json({
      ok: true,
      mode: 'migrate',
      processed,
      total: jobs.length,
      cursor: nextCursor,
      done,
      beforeKb: Number((before / 1024).toFixed(1)),
      afterKb: Number((after / 1024).toFixed(1)),
      savedKb: Number(((before - after) / 1024).toFixed(1)),
      writes: changedKeys.size,
      message: done ? 'Migração concluída.' : 'Lote concluído. Retome com o cursor retornado.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin-migrate-images]', error);
    return jsonError(error instanceof Error ? error.message : 'Falha na migração.', 500);
  }
}
