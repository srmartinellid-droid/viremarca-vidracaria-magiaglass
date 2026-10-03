import { db } from './db';
import { loginKey } from './request-security';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export async function checkLoginRateLimit(req: Request) {
  const key = loginKey(req);
  const row = await db.execute({ sql: 'SELECT failures,window_start FROM login_attempts WHERE key_hash=? LIMIT 1', args: [key] });
  const current = row.rows[0];
  if (!current) return { blocked: false, retryAfter: 0, key };
  const start = Number(current.window_start);
  const failures = Number(current.failures);
  if (Date.now() - start >= WINDOW_MS) {
    await db.execute({ sql: 'DELETE FROM login_attempts WHERE key_hash=?', args: [key] });
    return { blocked: false, retryAfter: 0, key };
  }
  if (failures >= MAX_FAILURES) {
    return { blocked: true, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (Date.now() - start)) / 1000)), key };
  }
  return { blocked: false, retryAfter: 0, key };
}

export async function recordLoginFailure(key: string) {
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO login_attempts(key_hash,failures,window_start) VALUES(?,?,?)
          ON CONFLICT(key_hash) DO UPDATE SET failures=CASE
            WHEN ? - login_attempts.window_start >= ? THEN 1
            ELSE login_attempts.failures + 1 END,
            window_start=CASE
            WHEN ? - login_attempts.window_start >= ? THEN ? ELSE login_attempts.window_start END`,
    args: [key, 1, now, now, WINDOW_MS, now, WINDOW_MS, now],
  });
}

export async function clearLoginFailures(key: string) {
  await db.execute({ sql: 'DELETE FROM login_attempts WHERE key_hash=?', args: [key] });
}
