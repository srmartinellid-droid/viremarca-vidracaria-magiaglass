import { createClient } from '@libsql/client';

const databaseUrl = process.env.TURSO_DATABASE_URL || 'https://magiaglass-build-placeholder.invalid';

export const db = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let schemaPromise: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY, password_hash TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (key_hash TEXT PRIMARY KEY, failures INTEGER NOT NULL, window_start INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, whatsapp TEXT NOT NULL, servico TEXT NOT NULL, mensagem TEXT NOT NULL, origem TEXT NOT NULL, status TEXT NOT NULL, nota TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS lead_rate_limits (ip_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY, storage_key TEXT UNIQUE NOT NULL, url TEXT NOT NULL, purpose TEXT NOT NULL, alt_text TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
  `CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)`,
];

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.batch(SCHEMA, 'write');
      const cols = await db.execute('PRAGMA table_info(admin_users)');
      if (!cols.rows.some((r) => String(r.name) === 'must_change')) {
        await db.execute('ALTER TABLE admin_users ADD COLUMN must_change INTEGER NOT NULL DEFAULT 0');
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
