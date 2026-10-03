import { createClient } from '@libsql/client';
import fs from 'node:fs/promises';

const dryRun = process.argv.includes('--dry-run');
const url = process.env.TURSO_DATABASE_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error('TURSO_DATABASE_URL não configurada.');

const db = createClient({ url, authToken });

async function exec(sql:string,args:any[]=[]){
  console.log((dryRun?'[DRY-RUN] ':'')+sql);
  if (!dryRun) await db.execute({sql,args});
}

async function main(){
  const snapshot:any = {};
  for (const key of ['home','services','gallery','settings']) {
    const result = await db.execute({sql:'SELECT value,updated_at FROM site_content WHERE key=? LIMIT 1',args:[key]});
    snapshot[key] = result.rows[0] || null;
  }
  if (!dryRun) await fs.writeFile(`.tmp/content-backup-${Date.now()}.json`, JSON.stringify(snapshot,null,2));

  await exec('CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY, password_hash TEXT NOT NULL, updated_at TEXT NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS login_attempts (key_hash TEXT PRIMARY KEY, failures INTEGER NOT NULL, window_start INTEGER NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, whatsapp TEXT NOT NULL, servico TEXT NOT NULL, mensagem TEXT NOT NULL, origem TEXT NOT NULL, status TEXT NOT NULL, nota TEXT NOT NULL DEFAULT "", created_at TEXT NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY, storage_key TEXT UNIQUE NOT NULL, url TEXT NOT NULL, purpose TEXT NOT NULL, alt_text TEXT NOT NULL, created_at TEXT NOT NULL)');
  await exec('CREATE TABLE IF NOT EXISTS lead_rate_limits (ip_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start INTEGER NOT NULL)');
  const cols = await db.execute('PRAGMA table_info(admin_users)');
  if (!cols.rows.some(r => String(r.name)==='must_change')) {
    await exec('ALTER TABLE admin_users ADD COLUMN must_change INTEGER NOT NULL DEFAULT 0');
  }
  await exec('CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)');
  await exec('CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)');
  await exec('CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)');
  console.log('Migration '+(dryRun?'dry-run ':'')+'prepared.');
}
main().catch(error=>{console.error(error);process.exit(1);});
