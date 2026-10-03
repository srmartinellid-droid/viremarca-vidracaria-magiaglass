import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createClient } from '@libsql/client';
import { put } from '@vercel/blob';
import { processImage } from '../lib/media';

const dryRun = process.argv.includes('--dry-run');
const databaseUrl = process.env.TURSO_DATABASE_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (!databaseUrl) throw new Error('TURSO_DATABASE_URL não configurada.');
if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN não configurada.');

const db = createClient({ url: databaseUrl, authToken });
const backupPath = process.env.MIGRATE_IMAGES_BACKUP || `.tmp/migrate-images-backup-${Date.now()}.json`;

type GalleryItem = {
  id?: string;
  title?: string;
  image?: string;
  images?: string[];
  [key: string]: unknown;
};

function isDataImage(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(value);
}

function decodeDataImage(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error('Data URL de imagem inválida.');
  return { mime: match[1].toLowerCase(), bytes: Buffer.from(match[2], 'base64') };
}

async function migrateImage(value: string, altText: string) {
  const { mime, bytes } = decodeDataImage(value);
  const file = new File([bytes], 'legacy-image', { type: mime });
  const { output } = await processImage(file, 'gallery');
  const digest = createHash('sha256').update(output).digest('hex');
  const key = `magiaglass/gallery/migrated-${digest}.webp`;
  const blob = await put(key, output, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: false,
    token: blobToken,
  });

  await db.execute({
    sql: 'INSERT INTO media(storage_key,url,purpose,alt_text,created_at) VALUES(?,?,?,?,?) ON CONFLICT(storage_key) DO UPDATE SET url=excluded.url,alt_text=excluded.alt_text',
    args: [key, blob.url, 'gallery', altText.slice(0, 180) || 'Imagem da galeria Magia Glass', new Date().toISOString()],
  });

  return blob.url;
}

async function main() {
  await db.execute(`CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY, storage_key TEXT UNIQUE NOT NULL, url TEXT NOT NULL, purpose TEXT NOT NULL, alt_text TEXT NOT NULL, created_at TEXT NOT NULL)`);

  const result = await db.execute({ sql: 'SELECT value,updated_at FROM site_content WHERE key=? LIMIT 1', args: ['gallery'] });
  if (!result.rows.length) {
    console.log('Nenhuma galeria encontrada. Nada a migrar.');
    return;
  }

  const rawValue = String(result.rows[0].value);
  const gallery = JSON.parse(rawValue) as GalleryItem[];
  if (!Array.isArray(gallery)) throw new Error('O conteúdo gallery não é um array válido.');

  const backup = { key: 'gallery', updated_at: result.rows[0].updated_at, value: gallery };
  console.log(`${dryRun ? '[DRY-RUN] ' : ''}Backup: ${backupPath}`);
  if (!dryRun) {
    await fs.mkdir('.tmp', { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
  }

  const uploaded: string[] = [];
  const nextGallery = JSON.parse(JSON.stringify(gallery)) as GalleryItem[];
  let changes = 0;

  for (const item of nextGallery) {
    const altText = String(item.title || item.description || 'Imagem da galeria Magia Glass');
    const images = Array.isArray(item.images) ? item.images.slice() : (item.image ? [item.image] : []);
    const nextImages: string[] = [];

    for (const image of images) {
      if (!isDataImage(image)) {
        nextImages.push(image);
        continue;
      }

      changes += 1;
      if (dryRun) {
        console.log(`[DRY-RUN] ${item.id || 'item'}: migraria imagem Base64 (${image.length} chars)`);
        nextImages.push(image);
        continue;
      }

      const url = await migrateImage(image, altText);
      uploaded.push(url);
      nextImages.push(url);
      console.log(`Migrada: ${item.id || 'item'} -> ${url}`);
    }

    item.images = nextImages;
    item.image = nextImages[0] || '';
  }

  if (dryRun) {
    console.log(`[DRY-RUN] ${changes} imagem(ns) Base64 encontradas. Nenhuma alteração foi gravada.`);
    return;
  }

  if (!changes) {
    console.log('Nenhuma imagem Base64 encontrada. Migração já está concluída.');
    return;
  }

  try {
    await db.execute({
      sql: 'INSERT INTO site_content(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
      args: ['gallery', JSON.stringify(nextGallery), new Date().toISOString()],
    });
  } catch (error) {
    console.error('Falha ao gravar a galeria. Os backups permanecem em', backupPath);
    throw error;
  }

  console.log(`Migração concluída: ${changes} imagem(ns). Backup: ${backupPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
