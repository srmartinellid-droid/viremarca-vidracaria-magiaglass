import crypto from 'node:crypto';
import sharp from 'sharp';
import { put, del } from '@vercel/blob';

const MAX_INPUT_BYTES = 8 * 1024 * 1024;

const MAGIC = {
  jpeg: [0xff,0xd8,0xff],
  png: [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],
  webp: [0x52,0x49,0x46,0x46],
} as const;

export type MediaPurpose = 'hero'|'service'|'gallery'|'logo';

export function validateImageMagic(bytes: Uint8Array) {
  if (MAGIC.jpeg.every((v,i)=>bytes[i]===v)) return 'jpeg';
  if (MAGIC.png.every((v,i)=>bytes[i]===v)) return 'png';
  if (MAGIC.webp.every((v,i)=>bytes[i]===v) && bytes[8]===0x57 && bytes[9]===0x45 && bytes[10]===0x42 && bytes[11]===0x50) return 'webp';
  return null;
}

export async function processImage(file: File, purpose: MediaPurpose) {
  if (file.size > MAX_INPUT_BYTES) throw new Error('Imagem acima do limite de 8 MB.');
  const input = Buffer.from(await file.arrayBuffer());
  const kind = validateImageMagic(input);
  if (!kind) throw new Error('Arquivo de imagem inválido. Use JPEG, PNG ou WebP.');
  const width = purpose === 'hero' ? 2400 : purpose === 'logo' ? 800 : 1600;
  const output = await sharp(input).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  return { output, kind };
}

export async function uploadMedia(output: Buffer, purpose: MediaPurpose) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Vercel Blob não está conectado. Configure BLOB_READ_WRITE_TOKEN no projeto.');
  const key = `magiaglass/${purpose}/${crypto.randomUUID()}.webp`;
  const blob = await put(key, output, { access: 'public', contentType: 'image/webp', addRandomSuffix: false });
  return { key, url: blob.url };
}

export async function deleteMedia(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Vercel Blob não está conectado.');
  await del(url);
}
