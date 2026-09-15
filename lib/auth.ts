import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db, ensureSchema } from './db';

const COOKIE = 'mg_admin';
const secret = () => process.env.ADMIN_SECRET || '';
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export async function createSession() {
  await ensureSchema();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  await db.execute({
    sql: 'INSERT INTO admin_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)',
    args: [hash(token), expires, new Date().toISOString()],
  });
  const sig = crypto.createHmac('sha256', secret()).update(token).digest('hex');
  const jar = await cookies();
  jar.set(COOKIE, `${token}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin() {
  if (!secret()) return false;
  await ensureSchema();
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [token, sig] = raw.split('.');
  if (!token || !sig || sig.length !== 64) return false;
  const expected = crypto.createHmac('sha256', secret()).update(token).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const result = await db.execute({
    sql: 'SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>? LIMIT 1',
    args: [hash(token), Date.now()],
  });
  return result.rows.length > 0;
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    const [token] = raw.split('.');
    if (token) {
      await db.execute({ sql: 'DELETE FROM admin_sessions WHERE token_hash=?', args: [hash(token)] });
    }
  }
  jar.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
